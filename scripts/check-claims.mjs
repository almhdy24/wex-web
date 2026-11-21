#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const srcDir = join(rootDir, 'src');

// Customer Storefront forbidden words & claims
const FORBIDDEN_WORDS = [
  { pattern: /ضمان/u, name: 'Invented warranty (ضمان)' },
  { pattern: /فحص/u, name: 'Invented inspection (فحص)' },
  { pattern: /اختبار/u, name: 'Invented testing (اختبار)' },
  { pattern: /تجربة/u, name: 'Invented trial (تجربة)' },
  { pattern: /استبدال/u, name: 'Invented replacement (استبدال)' },
  { pattern: /استرجاع/u, name: 'Invented return (استرجاع)' },
  { pattern: /إرجاع/u, name: 'Invented return (إرجاع)' },
  { pattern: /معتمد/u, name: 'Invented authorization (معتمد)' },
  { pattern: /وكيل/u, name: 'Invented agency (وكيل)' },
  { pattern: /رسمي/u, name: 'Invented official claim (رسمي)' },
  { pattern: /مضمون/u, name: 'Invented guarantee (مضمون)' },
  { pattern: /فورًا|فوراً/u, name: 'Invented immediacy claim (فورًا)' },
  { pattern: /سريع/u, name: 'Invented fast claim (سريع)' },
  { pattern: /الآمن/u, name: 'Invented safe guarantee (الآمن)' },
  { pattern: /(?:24|48)\s*ساعة/u, name: 'Invented timeframe (24/48 ساعة)' },
  { pattern: /فاتورة/u, name: 'Invented invoice claim (فاتورة)' },
  { pattern: /جنيه/u, name: 'Non-standard currency label (جنيه instead of ج.س)' },
  { pattern: /ستسجل/u, name: 'Invented promise (ستسجل)' },
];

// Dialect words check (Arabic Sudanese colloquial)
const DIALECT_WORDS = [
  { pattern: /بنثبت/u, name: 'Dialect word (بنثبت)' },
  { pattern: /(?:^|\s)ليك(?:[\s.,!؛؟]|$)/u, name: 'Dialect word (ليك)' },
  { pattern: /شنو/u, name: 'Dialect word (شنو)' },
  { pattern: /عاوز/u, name: 'Dialect word (عاوز)' },
  { pattern: /(?:^|\s)دا\s+/u, name: 'Dialect demonstrative (دا )' },
  { pattern: /(?:^|\s)دي\s+/u, name: 'Dialect demonstrative (دي )' },
  { pattern: /هسي/u, name: 'Dialect word (هسي)' },
  { pattern: /كدا/u, name: 'Dialect word (كدا)' },
];

function scanStorefrontDir(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      // Admin is strictly out of scope
      if (entry !== 'node_modules' && entry !== 'dist' && entry !== '.git' && entry !== '__tests__' && entry !== 'admin') {
        scanStorefrontDir(fullPath, files);
      }
    } else if (/\.(jsx?|mjs)$/.test(entry)) {
      // Exclude admin pages/components
      if (!fullPath.includes('/admin/') && !fullPath.includes('admin.')) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const storefrontFiles = scanStorefrontDir(srcDir);
let violationsCount = 0;

console.log(`[check-claims] Scanning ${storefrontFiles.length} storefront JS/JSX files for forbidden claims and dialect words...`);

for (const file of storefrontFiles) {
  const content = readFileSync(file, 'utf8');
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

  for (const { pattern, name } of FORBIDDEN_WORDS) {
    const match = cleanContent.match(pattern);
    if (match) {
      console.error(`❌ [check-claims] ${file}: Found forbidden word "${match[0]}" (${name})`);
      violationsCount++;
    }
  }

  for (const { pattern, name } of DIALECT_WORDS) {
    const match = cleanContent.match(pattern);
    if (match) {
      console.error(`❌ [check-claims] ${file}: Found dialect word "${match[0]}" (${name})`);
      violationsCount++;
    }
  }
}

if (violationsCount > 0) {
  console.error(`\n❌ Found ${violationsCount} claim/dialect violations in storefront.`);
  process.exit(1);
} else {
  console.log(`✅ [check-claims] PASS: Zero forbidden claims or dialect words found across ${storefrontFiles.length} storefront files.`);
  process.exit(0);
}
