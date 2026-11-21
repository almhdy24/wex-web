#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tokensPath = path.resolve(__dirname, '../src/styles/tokens.css');

const cssContent = fs.readFileSync(tokensPath, 'utf8');

// Parse CSS variables from tokens.css
const tokenMap = {};
const varRegex = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
let match;
while ((match = varRegex.exec(cssContent)) !== null) {
  tokenMap[`--${match[1]}`] = match[2].trim();
}

function resolveColor(val) {
  if (!val) return null;
  val = val.trim();
  if (val.startsWith('var(')) {
    const varName = val.slice(4, -1).split(',')[0].trim();
    return resolveColor(tokenMap[varName] || varName);
  }
  return val;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Required token pairs from Design System
const tokenPairs = [
  { text: '--wex-navy', bg: '--wex-white', name: 'Navy text on White card', minRatio: 4.5 },
  { text: '--wex-navy', bg: '--wex-ice', name: 'Navy text on Ice background', minRatio: 4.5 },
  { text: '--wex-text-secondary', bg: '--wex-white', name: 'Secondary text on White card', minRatio: 4.5 },
  { text: '--wex-text-secondary', bg: '--wex-ice', name: 'Secondary text on Ice background', minRatio: 4.5 },
  { text: '--on-dark', bg: '--wex-navy', name: 'On-dark text on Navy dark card', minRatio: 4.5 },
  { text: '--on-dark-muted', bg: '--wex-navy', name: 'On-dark muted text on Navy dark card', minRatio: 4.5 },
  { text: '--wex-white', bg: '--wex-royal', name: 'White text on Royal button', minRatio: 4.5 },
  { text: '--wex-royal', bg: '--wex-white', name: 'Royal text on White background', minRatio: 4.5 },
  { text: '--wex-success', bg: '--wex-white', name: 'Success text on White background', minRatio: 4.5 },
  { text: '--wex-warning', bg: '--wex-white', name: 'Warning text on White background', minRatio: 4.5 },
  { text: '--wex-danger', bg: '--wex-white', name: 'Danger text on White background', minRatio: 4.5 },
];

let failed = false;
console.log('[check-contrast] Verifying design system token contrast ratios...');

for (const pair of tokenPairs) {
  const textVal = resolveColor(tokenMap[pair.text]);
  const bgVal = resolveColor(tokenMap[pair.bg]);

  if (!textVal || !bgVal) {
    console.error(`❌ [check-contrast] Missing token definition: ${pair.text} (${textVal}) or ${pair.bg} (${bgVal})`);
    failed = true;
    continue;
  }

  const ratio = getContrast(textVal, bgVal);
  const pass = ratio >= pair.minRatio;
  const formatted = ratio.toFixed(2);

  if (pass) {
    console.log(`✅ [check-contrast] ${pair.name} (${pair.text} on ${pair.bg}): ${formatted}:1 >= ${pair.minRatio}:1`);
  } else {
    console.error(`❌ [check-contrast] ${pair.name} (${pair.text} on ${pair.bg}): ${formatted}:1 < ${pair.minRatio}:1`);
    failed = true;
  }
}

if (failed) {
  console.error('\n❌ [check-contrast] Contrast checks failed!');
  process.exit(1);
} else {
  console.log('✅ [check-contrast] All token contrast ratios pass WCAG AA standards.\n');
  process.exit(0);
}
