#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

async function run() {
  const { ar } = await import(path.join(srcDir, 'content', 'ar.js'));
  const { adminAr } = await import(path.join(srcDir, 'content', 'admin.ar.js'));

  // Flatten dictionary into dot-separated paths
  function flatten(obj, prefix = '') {
    const paths = new Set();
    for (const [key, val] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        // If it is an object, also record it and recurse
        paths.add(fullPath);
        for (const sub of flatten(val, fullPath)) {
          paths.add(sub);
        }
      } else {
        paths.add(fullPath);
      }
    }
    return paths;
  }

  const definedArKeys = flatten(ar);

  function hasKey(obj, dotPath) {
    const parts = dotPath.split('.');
    let cur = obj;
    for (const p of parts) {
      if (!cur || typeof cur !== 'object' || !(p in cur)) return false;
      cur = cur[p];
    }
    return cur !== undefined;
  }

  // Walk files in src/
  function getCodeFiles(dir) {
    let files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
          files.push(...getCodeFiles(fullPath));
        }
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const codeFiles = getCodeFiles(srcDir);

  // Regex patterns:
  // 1. t('some.key') or t("some.key")
  const tRegex = /\bt\(\s*['"]([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)['"]/g;
  // 2. ar.some.key
  const arRegex = /\bar\.([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g;
  // 3. adminAr.some.key
  const adminArRegex = /\badminAr\.([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g;

  const missingKeys = [];
  const usedKeys = new Set();

  for (const filePath of codeFiles) {
    // Skip content definitions themselves
    if (filePath.includes(path.join('src', 'content'))) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(rootDir, filePath);

    // Check t(...)
    let m;
    while ((m = tRegex.exec(content)) !== null) {
      const key = m[1];
      usedKeys.add(key);
      if (!hasKey(ar, key)) {
        missingKeys.push({ type: 't()', key, file: relPath });
      }
    }

    // Check ar.xxx
    while ((m = arRegex.exec(content)) !== null) {
      let key = m[1];
      // strip standard JS method calls like .replace, .toString, etc.
      key = key.replace(/\.(replace|toString|trim|split|slice|toLowerCase|toUpperCase)$/, '');
      usedKeys.add(key);
      if (!hasKey(ar, key)) {
        missingKeys.push({ type: 'ar.', key, file: relPath });
      }
    }

    // Check adminAr.xxx
    while ((m = adminArRegex.exec(content)) !== null) {
      let key = m[1];
      key = key.replace(/\.(replace|toString|trim|split|slice|toLowerCase|toUpperCase)$/, '');
      usedKeys.add(key);
      if (!hasKey(adminAr, key)) {
        missingKeys.push({ type: 'adminAr.', key, file: relPath });
      }
    }
  }

  console.log(`[i18n-check] Scanned ${codeFiles.length} files. Found ${usedKeys.size} distinct key references.`);

  if (missingKeys.length > 0) {
    console.error(`\n❌ [i18n-check] FAIL: Found ${missingKeys.length} missing translation key(s):`);
    for (const item of missingKeys) {
      console.error(`  - [${item.type}] "${item.key}" in ${item.file}`);
    }
    process.exit(1);
  }

  // Report unused keys (notice only)
  let unusedCount = 0;
  for (const k of definedArKeys) {
    // Only check leaf paths
    if (!usedKeys.has(k) && typeof ar[k] === 'string') {
      unusedCount++;
    }
  }

  console.log(`✅ [i18n-check] PASS: All translation keys are valid and defined. (${unusedCount} unused leaf keys defined for future/storefront use).`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[i18n-check] Error running check:', err);
  process.exit(1);
});
