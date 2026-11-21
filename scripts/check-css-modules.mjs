#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const srcDir = join(rootDir, 'src');

console.log('=== Checking CSS Modules Class Integrity ===');

function scanDir(dir, fileList = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && entry !== 'dist' && entry !== '.git' && entry !== '__tests__' && entry !== 'tests') {
        scanDir(fullPath, fileList);
      }
    } else if (/\.(jsx?|mjs)$/.test(entry)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function extractDefinedClasses(cssContent) {
  // Strip comments
  const clean = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
  const classes = new Set();

  // Match class selectors
  // Avoid @keyframes percentages or @media
  const lines = clean.split('\n');
  let inKeyframes = false;

  for (const line of lines) {
    if (/@keyframes\s+/.test(line)) {
      inKeyframes = true;
    }
    if (inKeyframes) {
      if (line.includes('}')) {
        inKeyframes = false;
      }
      continue;
    }

    // Class selector regex: .className followed by space, :, ., ,, {, etc.
    const classMatches = line.matchAll(/\.([a-zA-Z0-9_-]+)/g);
    for (const match of classMatches) {
      const cls = match[1];
      // Exclude numbers (e.g. .5em) or common css values
      if (!/^\d/.test(cls)) {
        classes.add(cls);
      }
    }
  }
  return classes;
}

function extractUsedClasses(jsxContent, alias) {
  const used = new Set();
  const clean = jsxContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

  // 1. alias.className
  const dotPattern = new RegExp(`\\b${alias}\\.([a-zA-Z0-9_-]+)`, 'g');
  for (const m of clean.matchAll(dotPattern)) {
    used.add(m[1]);
  }

  // 2. alias['className'] or alias["className"]
  const bracketPattern = new RegExp(`\\b${alias}\\[['"]([a-zA-Z0-9_-]+)['"]\\]`, 'g');
  for (const m of clean.matchAll(bracketPattern)) {
    used.add(m[1]);
  }

  // 3. alias[isX ? 'classNameA' : 'classNameB'] or similar ternary
  const ternaryPattern = new RegExp(`\\b${alias}\\[[^\\]]*?['"]([a-zA-Z0-9_-]+)['"][^\\]]*?['"]([a-zA-Z0-9_-]+)['"][^\\]]*?\\]`, 'g');
  for (const m of clean.matchAll(ternaryPattern)) {
    used.add(m[1]);
    used.add(m[2]);
  }

  return used;
}

const sourceFiles = scanDir(srcDir);
const missingErrors = [];
const unusedReport = [];
let totalCssModulesChecked = 0;

for (const jsxFile of sourceFiles) {
  const jsxContent = readFileSync(jsxFile, 'utf8');

  // Match import statements: import [alias] from '[path].module.css';
  const importRegex = /import\s+([a-zA-Z0-9_]+)\s+from\s+['"]([^'"]+\.module\.css)['"]/g;
  let match;

  while ((match = importRegex.exec(jsxContent)) !== null) {
    const alias = match[1];
    const importPath = match[2];
    const cssPath = resolve(dirname(jsxFile), importPath);
    const relJsx = relative(rootDir, jsxFile);
    const relCss = relative(rootDir, cssPath);

    if (!existsSync(cssPath)) {
      missingErrors.push({
        file: relJsx,
        cssFile: relCss,
        missing: [`(File not found: ${relCss})`],
      });
      continue;
    }

    totalCssModulesChecked++;
    const cssContent = readFileSync(cssPath, 'utf8');
    const definedClasses = extractDefinedClasses(cssContent);
    const usedClasses = extractUsedClasses(jsxContent, alias);

    const missing = [];
    for (const cls of usedClasses) {
      if (!definedClasses.has(cls)) {
        missing.push(cls);
      }
    }

    if (missing.length > 0) {
      missingErrors.push({
        file: relJsx,
        cssFile: relCss,
        missing,
      });
    }

    const unused = [];
    for (const cls of definedClasses) {
      if (!usedClasses.has(cls)) {
        unused.push(cls);
      }
    }
    if (unused.length > 0) {
      unusedReport.push({
        file: relJsx,
        cssFile: relCss,
        unused,
      });
    }
  }
}

console.log(`Checked ${totalCssModulesChecked} CSS module imports across ${sourceFiles.length} files.`);

if (unusedReport.length > 0) {
  console.log(`\nℹ️ Found unused CSS classes in ${unusedReport.length} module(s):`);
  for (const item of unusedReport) {
    console.log(`  ${item.cssFile} (${item.unused.length} unused: ${item.unused.slice(0, 5).join(', ')}${item.unused.length > 5 ? '...' : ''})`);
  }
}

if (missingErrors.length > 0) {
  console.error(`\n❌ FAIL: Found missing CSS classes in ${missingErrors.length} file(s):`);
  for (const err of missingErrors) {
    console.error(`  ${err.file} -> ${err.cssFile}:`);
    for (const m of err.missing) {
      console.error(`    - missing class: ".${m}"`);
    }
  }
  process.exit(1);
} else {
  console.log('✅ PASS: All referenced CSS module classes exist.');
  process.exit(0);
}
