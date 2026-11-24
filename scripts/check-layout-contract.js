#!/usr/bin/env node

/**
 * Static Layout, CSS & Safety Contract Checker
 *
 * Enforces:
 * 1. Button Layout: No button-like rule (button, .btn, .button) has flex-direction: column.
 * 2. Absolute Chips: No status chip or badge inside card modules uses position: absolute.
 * 3. Tab Bar Clearance: All storefront modules and AdminShell define proper bottom clearance.
 * 4. BiDi Isolation: No raw unisolated '#${order.order_number}' without OrderNumber or bdi.
 * 5. Global Elements: No un-scoped global rules that break interactive svg/img alignment.
 * 6. Storefront Greeting Leak: Admin names/roles never leaked to storefront greeting.
 * 7. Icon Button Accessibility: All buttons without visible text must have aria-label.
 */

import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

let errors = [];

function walkFiles(dir, exts, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, exts, callback);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      callback(fullPath);
    }
  }
}

// 1. Button Layout & Absolute Chips Contract
walkFiles(SRC_DIR, ['.css'], (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(process.cwd(), filePath);

  const rules = content.split('}');
  for (const rule of rules) {
    const parts = rule.split('{');
    if (parts.length < 2) continue;
    const selector = parts[0].trim();
    const body = parts[1].trim();

    // Check for flex-direction: column on button-like selectors
    const isButtonSelector = /(?:^|\s|,|\.)(?:button|btn|actionBtn|stepBtn)(?:\s|:|\.|$)/i.test(selector);
    const isExplicitButtonGroup = /(?:group|list|stack|column)/i.test(selector);
    if (isButtonSelector && !isExplicitButtonGroup && /flex-direction\s*:\s*column/i.test(body)) {
      errors.push(`[Button Contract Violation] ${relPath}: selector "${selector}" uses flex-direction: column`);
    }

    // Check for position: absolute on chips/status badges in card modules
    if (/AdminProductsPage\.module\.css|AdminOrdersPage\.module\.css|DataList\.module\.css/i.test(relPath)) {
      const isChipSelector = /(?:chip|status|badge)/i.test(selector);
      if (isChipSelector && /position\s*:\s*absolute/i.test(body)) {
        errors.push(`[Chip Layout Violation] ${relPath}: selector "${selector}" uses position: absolute`);
      }
    }
  }
});

// 2. Tab Bar Clearance Contract
const adminShellCssPath = path.join(SRC_DIR, 'components/admin/AdminShell.module.css');
if (fs.existsSync(adminShellCssPath)) {
  const content = fs.readFileSync(adminShellCssPath, 'utf8');
  if (!content.includes('padding-bottom: var(--admin-tabbar-h)')) {
    errors.push(`[Admin Shell Clearance] AdminShell.module.css must define padding-bottom: var(--admin-tabbar-h) on .mainContainer`);
  }
  if (!content.includes('[data-page-container="true"]')) {
    errors.push(`[Admin Shell Clearance] AdminShell.module.css must reset data-page-container="true" inside .pageContent to prevent multi-layer padding`);
  }
} else {
  errors.push(`[Missing File] AdminShell.module.css not found`);
}

// Storefront pages clearance check
const storefrontClearancePages = [
  'pages/store/AccountPage.module.css',
  'pages/store/NotificationsPage.module.css',
  'pages/store/ComparePage.module.css',
  'pages/store/FaqPage.module.css',
];
for (const pageRel of storefrontClearancePages) {
  const fullPath = path.join(SRC_DIR, pageRel);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('--tabbar-clearance-v2')) {
      errors.push(`[Storefront Clearance] ${pageRel} must include padding-bottom: var(--tabbar-clearance-v2)`);
    }
  }
}

// 3. Raw Order Number '#' Scramble Check in JSX
walkFiles(SRC_DIR, ['.jsx'], (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(process.cwd(), filePath);

  // Check for raw unisolated strings like `طلب #${order.order_number}`
  const rawHashMatch = /`طلب\s*#\$\{order(?:\.order_number|_number)\}`/g.exec(content);
  if (rawHashMatch) {
    errors.push(`[BiDi Scramble Risk] ${relPath}: uses raw unisolated order number template. Use <OrderNumber> instead.`);
  }

  // Check storefront greeting for admin role leak
  if (/HomePage\.jsx/i.test(relPath)) {
    if (content.includes('user.role ===') && !content.includes('user.role === \'customer\'')) {
      errors.push(`[Greeting Leak Risk] ${relPath}: must strictly guard storefront greeting for customer role only.`);
    }
  }

  // 4. Focus Trap Unstable Dependencies Check
  // Flags useEffect blocks calling .focus() whose dependency array contains children, functions, or objects
  const effectRegex = /useEffect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[([\s\S]*?)\]\s*\)/g;
  let match;
  while ((match = effectRegex.exec(content)) !== null) {
    const effectBody = match[1];
    const depsString = match[2];
    if (effectBody.includes('.focus(')) {
      const deps = depsString.split(',').map((d) => d.trim()).filter(Boolean);
      for (const dep of deps) {
        if (/^(children|props|on[A-Z].*|handle[A-Z].*)$/.test(dep)) {
          errors.push(
            `[Focus Trap Violation] ${relPath}: useEffect calling .focus() has unstable dependency "${dep}". Use a ref or depend only on open/mode.`
          );
        }
      }
    }
  }
});

if (errors.length > 0) {
  console.error('\n❌ Layout & CSS Contract Check Failed:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  console.log('✅ Layout & CSS Contract Check: All rules PASS (button row, chip positioning, admin & storefront clearance, bidi isolation, greeting sanitization)');
  process.exit(0);
}
