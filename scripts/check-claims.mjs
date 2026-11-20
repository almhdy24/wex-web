import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FORBIDDEN_CLAIM_PATTERNS = [
  { pattern: /ضمان\s*(معتمد|شامل|سنتين|الوكيل|المحل|استبدال|حقيقي)/u, name: 'Invented warranty claim' },
  { pattern: /فحص\s*(شامل|مخبري|واختبار)/u, name: 'Invented lab/thorough inspection claim' },
  { pattern: /فترة\s*تجربة/u, name: 'Invented trial period claim' },
  { pattern: /قبل\s*سداد\s*أي\s*مبلغ/u, name: 'Invented pay-after-test claim' },
  { pattern: /استرجاع\s*خلال/u, name: 'Invented return window claim' },
  { pattern: /استبدال\s*مجاني/u, name: 'Invented free replacement claim' },
  { pattern: /وكيل\s*(معتمد|رسمي|تجاري)/u, name: 'Invented authorized agency claim' },
  { pattern: /موزع\s*رسمي/u, name: 'Invented official distributor claim' },
  { pattern: /معتمد\s*من\s*(آبل|سامسونج|أبل|ديل|اتش بي|لينوفو)/u, name: 'Invented manufacturer authorization' },
  { pattern: /التوصيل\s*الآمن/u, name: 'Invented safe delivery guarantee' },
  { pattern: /شحن\s*مضمون/u, name: 'Invented guaranteed delivery claim' },
  { pattern: /مفحوص\s*ومضمون/u, name: 'Invented tested and guaranteed claim' },
  { pattern: /تم\s*فحصه\s*بدقة/u, name: 'Invented thorough testing claim' },
  { pattern: /فحص\s*واختبار/u, name: 'Invented inspection and testing claim' },
];

function scanDir(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && entry !== 'dist' && entry !== '.git' && entry !== '__tests__') {
        scanDir(fullPath, files);
      }
    } else if (/\.(jsx?|mjs|css)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcFiles = scanDir('src');
let violationsCount = 0;

console.log(`[check-claims] Scanning ${srcFiles.length} source files for invented business claims...`);

for (const file of srcFiles) {
  const content = readFileSync(file, 'utf8');
  for (const { pattern, name } of FORBIDDEN_CLAIM_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      console.error(`❌ [check-claims] ${file}: Found "${match[0]}" (${name})`);
      violationsCount++;
    }
  }
}

if (violationsCount > 0) {
  console.error(`\n❌ Found ${violationsCount} invented claim violations. Please remove every invented business claim.`);
  process.exit(1);
} else {
  console.log(`✅ [check-claims] PASS: Zero invented business claims found across ${srcFiles.length} files.`);
  process.exit(0);
}
