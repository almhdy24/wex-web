#!/usr/bin/env node
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const outDir = resolve(rootDir, 'screenshots');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';

const VIEWPORTS = [
  { name: 'android-360x800', width: 360, height: 800 },
  { name: 'iphone-390x844', width: 390, height: 844 },
  { name: 'ipad-768x1024', width: 768, height: 1024 },
  { name: 'laptop-1280x800', width: 1280, height: 800 },
];

const ROUTES = [
  // Storefront
  { path: '/', name: 'store-home' },
  { path: '/catalog', name: 'store-catalog' },
  { path: '/cart', name: 'store-cart' },
  { path: '/checkout', name: 'store-checkout' },
  { path: '/orders', name: 'store-orders' },
  { path: '/favorites', name: 'store-favorites' },
  { path: '/compare', name: 'store-compare' },
  { path: '/faq', name: 'store-faq' },
  { path: '/about', name: 'store-about' },
  { path: '/privacy-policy', name: 'store-privacy' },
  { path: '/terms', name: 'store-terms' },
  { path: '/login', name: 'store-login' },
  { path: '/account', name: 'store-account' },

  // Admin
  { path: '/admin', name: 'admin-dashboard' },
  { path: '/admin/orders', name: 'admin-orders' },
  { path: '/admin/payments', name: 'admin-payments' },
  { path: '/admin/products', name: 'admin-products' },
  { path: '/admin/rates', name: 'admin-rates' },
  { path: '/admin/settings', name: 'admin-settings' },
  { path: '/admin/shipping-zones', name: 'admin-shipping-zones' },
  { path: '/admin/users', name: 'admin-users' },
  { path: '/admin/categories', name: 'admin-categories' },
  { path: '/admin/brands', name: 'admin-brands' },
  { path: '/admin/announcements', name: 'admin-announcements' },
  { path: '/admin/recent-purchases', name: 'admin-recent-purchases' },
  { path: '/admin/hero-slides', name: 'admin-hero-slides' },
  { path: '/admin/home-sections', name: 'admin-home-sections' },
  { path: '/admin/faq', name: 'admin-faq' },
  { path: '/admin/pages', name: 'admin-pages' },
  { path: '/admin/audit-logs', name: 'admin-audit-logs' },
];

async function main() {
  // Dynamically import playwright (available in CI environment)
  let chromium;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch (err) {
    console.error('Playwright not installed in local environment. This script runs in CI workflow runner.');
    console.error(err.message);
    process.exit(1);
  }

  console.log('=== Wex Technology Visual Regression & Layout Check ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Target Output: ${outDir}`);
  console.log(`Viewports (${VIEWPORTS.length}): ${VIEWPORTS.map((v) => v.name).join(', ')}`);
  console.log(`Routes (${ROUTES.length}): ${ROUTES.map((r) => r.path).join(', ')}`);

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let totalCaptured = 0;
  let totalErrors = 0;

  for (const vp of VIEWPORTS) {
    const vpDir = resolve(outDir, vp.name);
    if (!existsSync(vpDir)) {
      mkdirSync(vpDir, { recursive: true });
    }

    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    // Seed mock admin authentication tokens in localStorage
    await context.addInitScript(() => {
      try {
        localStorage.setItem('auth_token', 'mock_ci_admin_token');
        localStorage.setItem('auth_user', JSON.stringify({
          id: 1,
          name: 'مدير النظام (CI)',
          email: 'admin@wextechnology.com',
          role: 'admin',
        }));
      } catch {
        // ignore
      }
    });

    const page = await context.newPage();

    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      const consoleErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        consoleErrors.push(err.message);
      });

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500);

        // Check for console errors
        if (consoleErrors.length > 0) {
          console.error(`  ❌ [${vp.name}] ${route.path}: Console error(s) detected:`);
          for (const err of consoleErrors) {
            console.error(`     - ${err}`);
          }
          totalErrors++;
        }

        // Check for horizontal overflow (no horizontal scrollbar on body)
        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          return {
            hasOverflow: docWidth > winWidth + 1, // allow 1px rounding margin
            docWidth,
            winWidth,
          };
        });

        if (overflow.hasOverflow) {
          console.error(`  ❌ [${vp.name}] ${route.path}: Horizontal overflow detected! (scrollWidth: ${overflow.docWidth}px, innerWidth: ${overflow.winWidth}px)`);
          totalErrors++;
        }

        // Capture screenshot
        const screenshotPath = resolve(vpDir, `${route.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  ✓ [${vp.name}] ${route.path} -> ${route.name}.png`);
        totalCaptured++;
      } catch (err) {
        console.error(`  ❌ [${vp.name}] ${route.path}: Failed to capture - ${err.message}`);
        totalErrors++;
      }
    }

    await context.close();
  }

  await browser.close();

  console.log(`\n=== CI Visual Check Summary ===`);
  console.log(`Total Screenshots Captured: ${totalCaptured}`);
  console.log(`Total Errors / Violations: ${totalErrors}`);

  if (totalErrors > 0) {
    console.error('❌ FAIL: Visual and layout checks detected errors or horizontal overflow.');
    process.exit(1);
  } else {
    console.log('✅ PASS: All viewports captured cleanly with zero console errors and zero horizontal overflow.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled visual check failure:', err);
  process.exit(1);
});
