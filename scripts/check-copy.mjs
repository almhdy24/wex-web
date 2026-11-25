#!/usr/bin/env node
/**
 * check-copy.mjs — Arabic copy rules across web + API (docs/GLOSSARY.ar.md in wex-api).
 * Scans Arabic string literals / text in:
 *   web: src (js/jsx, not tests), index.html, public webmanifests
 *   api: app/Language/ar, app/Config/PushTemplates.php, app/Views/emails, app/Services, app/Controllers
 * Fails on: banned glossary synonyms, dialect, Latin punctuation inside Arabic,
 * double spaces, AED / exchange-rate wording on customer surfaces.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, '..');
const apiCandidates = [process.env.WEX_API_DIR, path.resolve(web, '../wex-api'), path.resolve(web, '../../wex-api')].filter(Boolean);
const api = apiCandidates.find((p) => fs.existsSync(path.join(p, 'app/Config/Routes.php')));

const BANNED = [
  [/الأوردر|الطلبية/u, 'الطلب'],
  [/(?:ال)?إيصال|وصل التحويل/u, 'إشعار التحويل'],
  [/قفل السعر|تجميد السعر/u, 'تثبيت السعر'],
  [/(?:رسوم|منطقة|مناطق|تكلفة)\s+الشحن|(?<![\p{L}])الشحن(?![\p{L}])/u, 'التوصيل'],
  [/الاستلام من الفرع/u, 'الاستلام من المحل'],
  [/عربة التسوق|الكارت(?![\p{L}])/u, 'السلة'],
  [/(?<![\p{L}])جنيه/u, 'ج.س'],
  [/اللوج إن/u, 'تسجيل الدخول'],
  [/شنو|عاوز|كدا|هسي|بنثبت/u, 'الفصحى (لا عامية)'],
];
const CUSTOMER_ONLY = [
  [/درهم|AED|سعر الصرف/u, 'لا تُعرض العملة الداخلية أو سعر الصرف للعميل'],
];
const ARABIC = /[\u0600-\u06FF]/u;
const LATIN_PUNCT = /[\u0600-\u06FF]\s?[,;?](?!\d)|[,;?]\s?[\u0600-\u06FF]/u;

function walk(dir, ok, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '__tests__', 'tests', '.git'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ok, out);
    else if (ok(p)) out.push(p);
  }
  return out;
}

/** Arabic-bearing string literals with their line numbers (JS/PHP), or text lines (HTML/manifest). */
function strings(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = [];
  const re = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/gu;
  if (/\.(js|jsx|mjs|php)$/.test(file)) {
    // strip comments so documentation is not linted as UI copy
    const clean = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));
    let m;
    while ((m = re.exec(clean))) {
      if (ARABIC.test(m[2])) out.push({ text: m[2], line: clean.slice(0, m.index).split('\n').length });
    }
    // JSX text nodes
    const jsx = /> *([^<>{}\n]*[\u0600-\u06FF][^<>{}\n]*)</gu;
    while ((m = jsx.exec(clean))) out.push({ text: m[1], line: clean.slice(0, m.index).split('\n').length });
  } else {
    src.split('\n').forEach((l, i) => { if (ARABIC.test(l)) out.push({ text: l, line: i + 1 }); });
  }
  return out;
}

const files = [
  ...walk(path.join(web, 'src'), (p) => /\.(js|jsx)$/.test(p)).map((f) => ({ f, customer: !/\/admin\/|admin\.ar\.js|\/admin[A-Z]/.test(f) })),
  { f: path.join(web, 'index.html'), customer: true },
  ...walk(path.join(web, 'public'), (p) => p.endsWith('.webmanifest')).map((f) => ({ f, customer: !f.includes('admin') })),
];
if (api) {
  for (const [d, customer] of [['app/Language/ar', true], ['app/Views/emails', true], ['app/Config', true], ['app/Services', false], ['app/Controllers', false]]) {
    for (const f of walk(path.join(api, d), (p) => p.endsWith('.php'))) {
      if (d === 'app/Config' && !/PushTemplates\.php$/.test(f)) continue;
      files.push({ f, customer });
    }
  }
} else if (process.env.CI) {
  console.error('ERROR check-copy: wex-api checkout not found');
  process.exit(1);
}

// Admin-only wording that lives in shared files (reviewed; keep this list short).
const ALLOW = [
  ['src/content/common/breadcrumbs.js', /سعر الصرف/u],        // /admin/rates breadcrumb
  ['app/Language/ar/Api.php', /سعر الصرف/u],                  // admin rate-update message
];
const allowed = (f, text) => ALLOW.some(([p, re]) => f.endsWith(p) && re.test(text));

const errors = [];
for (const { f, customer } of files) {
  for (const { text, line } of strings(f)) {
    const where = `${path.relative(path.dirname(web), f)}:${line}`;
    for (const [re, want] of BANNED) if (re.test(text)) errors.push(`${where}  «${text.trim().slice(0, 70)}»  → استخدم: ${want}`);
    if (customer && !allowed(f, text)) for (const [re, why] of CUSTOMER_ONLY) if (re.test(text)) errors.push(`${where}  «${text.trim().slice(0, 70)}»  → ${why}`);
    if (LATIN_PUNCT.test(text)) errors.push(`${where}  «${text.trim().slice(0, 70)}»  → علامات ترقيم عربية (، ؟ ؛)`);
    if (/[\u0600-\u06FF] {2,}[\u0600-\u06FF]/u.test(text)) errors.push(`${where}  «${text.trim().slice(0, 70)}»  → مسافتان متتاليتان`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n❌ check-copy: ${errors.length} violation(s). See wex-api/docs/GLOSSARY.ar.md`);
  process.exit(1);
}
console.log(`✅ check-copy: ${files.length} files clean (glossary, dialect, punctuation, spacing, customer currency).`);
