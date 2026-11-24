#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const srcDir = join(rootDir, 'src');

function getAllJsxFiles(dir, list = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', '__tests__', 'tests'].includes(entry)) {
        getAllJsxFiles(fullPath, list);
      }
    } else if (entry.endsWith('.jsx')) {
      list.push(fullPath);
    }
  }
  return list;
}

function getDefinedClasses(cssContent) {
  const clean = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
  const classes = new Set();
  const lines = clean.split('\n');
  let inKeyframes = false;

  for (const line of lines) {
    if (/@keyframes\s+/.test(line)) inKeyframes = true;
    if (inKeyframes) {
      if (line.includes('}')) inKeyframes = false;
      continue;
    }
    const matches = line.matchAll(/\.([a-zA-Z0-9_-]+)/g);
    for (const match of matches) {
      const cls = match[1];
      if (!/^\d/.test(cls)) {
        classes.add(cls);
      }
    }
  }
  return classes;
}

const jsxFiles = getAllJsxFiles(srcDir);
let totalChecked = 0;
const errors = [];

for (const jsxFile of jsxFiles) {
  const content = readFileSync(jsxFile, 'utf8');
  // Match CSS module imports: import styles from './X.module.css'
  const importMatch = content.match(/import\s+(\w+)\s+from\s+['"]([^'"]+\.module\.css)['"]/);
  if (!importMatch) continue;

  const styleVarName = importMatch[1];
  const relativeCssPath = importMatch[2];
  const cssFullPath = resolve(dirname(jsxFile), relativeCssPath);

  if (!existsSync(cssFullPath)) {
    errors.push(`${relative(rootDir, jsxFile)}: Missing CSS file ${relativeCssPath}`);
    continue;
  }

  totalChecked++;
  const cssContent = readFileSync(cssFullPath, 'utf8');
  const definedClasses = getDefinedClasses(cssContent);

  // Match styleVarName.className
  const dotRegex = new RegExp(`\\b${styleVarName}\\.([a-zA-Z0-9_-]+)`, 'g');
  const bracketRegex = new RegExp(`\\b${styleVarName}\\[['"]([a-zA-Z0-9_-]+)['"]\\]`, 'g');

  const usedClasses = new Set();
  for (const m of content.matchAll(dotRegex)) {
    usedClasses.add(m[1]);
  }
  for (const m of content.matchAll(bracketRegex)) {
    usedClasses.add(m[1]);
  }

  const missing = [];
  for (const cls of usedClasses) {
    if (!definedClasses.has(cls)) {
      missing.push(cls);
    }
  }

  if (missing.length > 0) {
    errors.push(
      `${relative(rootDir, jsxFile)} -> ${relative(rootDir, cssFullPath)}:\n  Missing classes: ${missing.map((c) => '.' + c).join(', ')}`
    );
  }
}

console.log(`[check:css] Checked ${totalChecked} JSX files with CSS modules.`);
if (errors.length > 0) {
  console.error('[check:css] Errors found:\n' + errors.join('\n'));
  process.exit(1);
} else {
  console.log('[check:css] PASS: All referenced CSS classes exist.');
}
