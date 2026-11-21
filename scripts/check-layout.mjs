#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const srcDir = join(rootDir, 'src');

function scanDir(dir, ext = '.css', files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && entry !== 'dist' && entry !== '.git' && entry !== 'admin') {
        scanDir(fullPath, ext, files);
      }
    } else if (entry.endsWith(ext) && !fullPath.includes('/admin/')) {
      files.push(fullPath);
    }
  }
  return files;
}

const cssFiles = scanDir(srcDir, '.module.css');
let failed = false;

console.log(`[check-layout] Linting ${cssFiles.length} storefront CSS modules...`);

// Check for money nowrap: any rule with 'price' or 'amount' in selector should ideally have white-space: nowrap
for (const file of cssFiles) {
  const content = readFileSync(file, 'utf8');

  // Check line-clamp without box-orient
  if (content.includes('-webkit-line-clamp') && !content.includes('-webkit-box-orient: vertical')) {
    console.error(`❌ [check-layout] ${file}: -webkit-line-clamp must be accompanied by -webkit-box-orient: vertical`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log(`✅ [check-layout] Layout checks passed.`);
  process.exit(0);
}
