#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('=== Checking Admin UI for Disallowed Latin Words ===');

// Allowlist of technical terms, brand/model names, spec units, currencies, formats
const ALLOWLIST = new Set([
  // Brands & Models
  'wex', 'technology', 'dell', 'lenovo', 'hp', 'apple', 'asus', 'acer', 'samsung',
  'thinkpad', 'elitebook', 'probook', 'macbook', 'latitude', 'inspiron', 'ideapad',
  'intel', 'core', 'amd', 'ryzen', 'nvidia', 'geforce', 'rtx', 'gtx',
  'windows', 'macos', 'ios', 'android', 'linux',

  // Spec Units & Technical acronyms
  'gb', 'tb', 'mb', 'kb', 'ghz', 'mhz', 'mah', 'wh', 'hz', 'w', 'v', 'px', 'rem', 'em', 'kg', 'g',
  'ssd', 'hdd', 'nvme', 'ram', 'rom', 'fhd', 'ips', 'oled', 'uhd', 'qhd', 'led',
  'usb', 'type', 'hdmi', 'wifi', 'bluetooth', 'lan', 'nfc', 'sim', 'esim',
  'i3', 'i5', 'i7', 'i9', 'ddr', 'gen', 'th',

  // Currencies, Protocols, IDs & Formats
  'sdg', 'aed', 'usd', 'eur', 'id', 'url', 'otp', 'ip', 'json', 'csv', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'svg',
  'whatsapp', 'facebook', 'google', 'ctrl', 'enter',
]);

const adminDirs = [
  join(rootDir, 'src', 'pages', 'admin'),
  join(rootDir, 'src', 'components', 'admin'),
];
const adminContentFile = join(rootDir, 'src', 'content', 'admin.ar.js');

function scanDir(dir, fileList = []) {
  if (!existsSync(dir)) return fileList;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, fileList);
    } else if (/\.(jsx?|mjs)$/.test(entry)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const adminFiles = [];
for (const d of adminDirs) {
  scanDir(d, adminFiles);
}
if (existsSync(adminContentFile)) {
  adminFiles.push(adminContentFile);
}

let violations = [];

for (const filePath of adminFiles) {
  const relPath = relative(rootDir, filePath);
  const content = readFileSync(filePath, 'utf8');

  // Strip block & line comments
  let clean = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  const lines = clean.split('\n');

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed) return;

    // Check specifically for Hero Slides and CTA anywhere in UI strings
    if (/Hero\s+Slides/i.test(trimmed)) {
      violations.push({
        file: relPath,
        line: lineNum,
        word: 'Hero Slides',
        context: trimmed,
      });
      return;
    }
    if (/\bCTA\b/.test(trimmed)) {
      violations.push({
        file: relPath,
        line: lineNum,
        word: 'CTA',
        context: trimmed,
      });
      return;
    }

    // If file is admin.ar.js: extract string values
    if (filePath.endsWith('admin.ar.js')) {
      const propMatch = trimmed.match(/:\s*['"`]([^'"`]+)['"`]/);
      if (propMatch) {
        let val = propMatch[1];
        // Strip template tokens like {name}, {count}, {time}
        val = val.replace(/\{[a-zA-Z0-9_]+\}/g, '');
        checkStringWords(val, relPath, lineNum, trimmed);
      }
      return;
    }

    // In JSX files: extract text between > and <
    const jsxTextMatches = trimmed.matchAll(/>([^<>{]+)</g);
    for (const m of jsxTextMatches) {
      const text = m[1].trim();
      if (text && !text.startsWith('&')) {
        checkStringWords(text, relPath, lineNum, trimmed);
      }
    }

    // Extract UI label/placeholder/title props: placeholder="..." or label="..." or title="..."
    const propTextMatches = trimmed.matchAll(/\b(?:placeholder|label|title|alt)\s*=\s*['"]([^'"]+)['"]/g);
    for (const m of propTextMatches) {
      const text = m[1].trim();
      checkStringWords(text, relPath, lineNum, trimmed);
    }
  });
}

function checkStringWords(text, relPath, lineNum, context) {
  // Find all Latin words
  const words = text.match(/[A-Za-z]+/g) || [];
  for (const w of words) {
    const lower = w.toLowerCase();
    if (!ALLOWLIST.has(lower) && lower.length > 1) {
      violations.push({
        file: relPath,
        line: lineNum,
        word: w,
        context,
      });
    }
  }
}

console.log(`Scanned ${adminFiles.length} admin UI and content files.`);

if (violations.length > 0) {
  console.error(`\n❌ FAIL: Found ${violations.length} disallowed Latin word(s) in Admin UI:`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} -> "${v.word}" in: ${v.context}`);
  }
  process.exit(1);
} else {
  console.log('✅ PASS: Admin UI strings contain only Arabic and allowlisted technical/brand terms.');
  process.exit(0);
}
