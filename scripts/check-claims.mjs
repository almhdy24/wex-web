#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webRootDir = resolve(__dirname, '..');
const apiRootDir = resolve(webRootDir, '..', 'wex-api');

// Forbidden claim words & sample values
const FORBIDDEN_WORDS = [
  { pattern: /ضمان/u, name: 'Invented warranty (ضمان)' },
  { pattern: /فحص/u, name: 'Invented inspection (فحص)' },
  { pattern: /معاينة/u, name: 'Invented inspection (معاينة)' },
  { pattern: /اختبار/u, name: 'Invented testing (اختبار)' },
  { pattern: /تجربة/u, name: 'Invented trial (تجربة)' },
  { pattern: /مختارة بعناية/u, name: 'Marketing claim (مختارة بعناية)' },
  { pattern: /استبدال/u, name: 'Invented replacement (استبدال)' },
  { pattern: /استرجاع/u, name: 'Invented return (استرجاع)' },
  { pattern: /إرجاع/u, name: 'Invented return (إرجاع)' },
  { pattern: /معتمد/u, name: 'Invented authorization (معتمد)' },
  { pattern: /وكيل/u, name: 'Invented agency (وكيل)' },
  { pattern: /رسمي/u, name: 'Invented official claim (رسمي)' },
  { pattern: /مضمون/u, name: 'Invented guarantee (مضمون)' },
  { pattern: /2849102/u, name: 'Placeholder bank account (2849102)' },
  { pattern: /WEX-DBG/u, name: 'Debug test order reference (WEX-DBG)' },
  { pattern: /sample/ui, name: 'Placeholder sample string' },
  { pattern: /فورًا|فوراً/u, name: 'Invented immediacy claim (فورًا)' },
  { pattern: /سريع/u, name: 'Invented fast claim (سريع)' },
  { pattern: /الآمن/u, name: 'Invented safe guarantee (الآمن)' },
  { pattern: /(?:24|48)\s*ساعة/u, name: 'Invented timeframe (24/48 ساعة)' },
  { pattern: /فاتورة/u, name: 'Invented invoice claim (فاتورة)' },
  { pattern: /جنيه/u, name: 'Non-standard currency label (جنيه instead of ج.س)' },
  { pattern: /ستسجل/u, name: 'Invented promise (ستسجل)' },
];

// Dialect words check (Arabic Sudanese colloquial in customer storefront)
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

function scanFiles(dir, filterFn, files = []) {
  if (!existsSync(dir)) return files;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && entry !== 'dist' && entry !== '.git' && entry !== '__tests__' && entry !== 'tests') {
        scanFiles(fullPath, filterFn, files);
      }
    } else if (filterFn(fullPath, entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

// 1. Web Storefront files
const storefrontFiles = scanFiles(join(webRootDir, 'src'), (path) => {
  return /\.(jsx?|mjs)$/.test(path) && !path.includes('/admin/') && !path.includes('admin.');
});

// 2. Admin preset lists in Web
const adminPresetFiles = [
  join(webRootDir, 'src', 'content', 'admin.ar.js'),
  join(webRootDir, 'src', 'pages', 'admin', 'AdminProductFormPage.jsx'),
].filter(existsSync);

// 3. API Seeds, Migrations, Language, Email Views
const apiFiles = [];
if (existsSync(apiRootDir)) {
  scanFiles(join(apiRootDir, 'app', 'Database', 'Seeds'), (p) => p.endsWith('.php'), apiFiles);
  scanFiles(join(apiRootDir, 'app', 'Database', 'Migrations'), (p) => p.endsWith('.php'), apiFiles);
  scanFiles(join(apiRootDir, 'app', 'Language'), (p) => p.endsWith('.php'), apiFiles);
  scanFiles(join(apiRootDir, 'app', 'Views', 'emails'), (p) => p.endsWith('.php'), apiFiles);
}

console.log('=== Checking Forbidden Marketing Claims & Placeholder Data ===');
console.log(`Scanning:
  - ${storefrontFiles.length} Storefront source files
  - ${adminPresetFiles.length} Admin preset files
  - ${apiFiles.length} API seeders, migrations, language, and email files`);

let violationsCount = 0;

function checkContent(filePath, content, checkDialect = false) {
  // Strip block/line comments
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

  for (const { pattern, name } of FORBIDDEN_WORDS) {
    const match = cleanContent.match(pattern);
    if (match) {
      console.error(`❌ ${filePath}: Found forbidden claim/placeholder "${match[0]}" (${name})`);
      violationsCount++;
    }
  }

  if (checkDialect) {
    for (const { pattern, name } of DIALECT_WORDS) {
      const match = cleanContent.match(pattern);
      if (match) {
        console.error(`❌ ${filePath}: Found dialect word "${match[0]}" (${name})`);
        violationsCount++;
      }
    }
  }
}

// Check storefront
for (const file of storefrontFiles) {
  checkContent(file, readFileSync(file, 'utf8'), true);
}

// Check admin presets
for (const file of adminPresetFiles) {
  checkContent(file, readFileSync(file, 'utf8'), false);
}

// Check API files
for (const file of apiFiles) {
  checkContent(file, readFileSync(file, 'utf8'), false);
}

if (violationsCount > 0) {
  console.error(`\n❌ FAIL: Found ${violationsCount} forbidden claim or placeholder violation(s).`);
  process.exit(1);
} else {
  console.log(`✅ PASS: Zero forbidden claims or placeholders found across all scanned files.`);
  process.exit(0);
}
