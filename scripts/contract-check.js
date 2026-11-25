#!/usr/bin/env node
/**
 * contract-check.js — static frontend ⇄ API contract diff (no browser, no network).
 *
 * 1. Parses wex-api/app/Config/Routes.php into {method, path, handler}.
 * 2. Scans wex-web/src for API calls: api.get/post/put/patch/delete(path, body),
 *    apiClient(path, { method }) — path templates are normalised (`${x}` -> :param,
 *    query-string expressions dropped).
 * 3. For each call, checks a route exists for METHOD + PATH, and that every request
 *    body key the frontend sends is read somewhere by the API handler (controller
 *    method, or the service method the body is passed to).
 *
 * Exit 1 on any ERROR. WARN lines are informational (API routes never called, or
 * field reads the analyser could not resolve -> reported as UNVERIFIED).
 *
 * Usage: node scripts/contract-check.js [--json]
 *   WEX_API_DIR   path to wex-api (default ../wex-api, then ../../wex-api)
 *   CI=true       missing API checkout becomes an error instead of a skip
 * Accepted exceptions: scripts/contract-allowlist.json  { "ignore": ["POST /x field:y", ...] }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..');
const apiCandidates = [process.env.WEX_API_DIR, path.resolve(webRoot, '../wex-api'), path.resolve(webRoot, '../../wex-api')].filter(Boolean);
const apiRoot = apiCandidates.find((p) => fs.existsSync(path.join(p, 'app/Config/Routes.php')));
const asJson = process.argv.includes('--json');

if (!apiRoot) {
  const msg = `contract-check: wex-api checkout not found (tried ${apiCandidates.join(', ')})`;
  if (process.env.CI) {
    console.error(`ERROR ${msg}`);
    process.exit(1);
  }
  console.warn(`SKIP  ${msg}`);
  process.exit(0);
}

const allow = new Set(
  (() => {
    try {
      return JSON.parse(fs.readFileSync(path.join(here, 'contract-allowlist.json'), 'utf8')).ignore || [];
    } catch {
      return [];
    }
  })(),
);

/* ----------------------------- helpers ----------------------------- */

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

/** Reads a JS string/template literal starting at s[i] (a quote char). Returns {value, end, parts}. */
function readLiteral(s, i) {
  const q = s[i];
  let j = i + 1;
  let value = '';
  const parts = []; // for templates: [{text}|{expr}]
  let text = '';
  while (j < s.length) {
    const c = s[j];
    if (c === '\\') { text += s[j + 1]; value += s[j + 1]; j += 2; continue; }
    if (c === q) { parts.push({ text }); return { value, end: j + 1, parts }; }
    if (q === '`' && c === '$' && s[j + 1] === '{') {
      parts.push({ text }); text = '';
      let depth = 1; let k = j + 2; let expr = '';
      while (k < s.length && depth > 0) {
        const ch = s[k];
        if (ch === '`' || ch === '"' || ch === "'") { const lit = readLiteral(s, k); expr += s.slice(k, lit.end); k = lit.end; continue; }
        if (ch === '{') depth++;
        if (ch === '}') { depth--; if (depth === 0) break; }
        expr += ch; k++;
      }
      parts.push({ expr });
      value += '\u0000';
      j = k + 1;
      continue;
    }
    text += c; value += c; j++;
  }
  return null;
}

/** Index of the matching closing bracket for s[i] in '{[(' (skips strings). */
function matchBracket(s, i) {
  const open = s[i];
  const close = { '{': '}', '[': ']', '(': ')' }[open];
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '"' || c === "'" || c === '`') { const lit = readLiteral(s, j); if (!lit) return -1; j = lit.end - 1; continue; }
    if (c === '/' && s[j + 1] === '/') { j = s.indexOf('\n', j); if (j < 0) return -1; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return j; }
  }
  return -1;
}

/** Top-level keys of an object literal source "{ a: 1, b, 'c': 2, ...x }". */
function objectKeys(src) {
  const keys = new Set();
  const body = src.slice(1, -1);
  let depth = 0; let token = '';
  const flush = () => {
    const t = token.trim(); token = '';
    if (!t || t.startsWith('...')) return;
    const m = t.match(/^(?:["'`]?)([A-Za-z_$][\w$]*)(?:["'`]?)\s*(?::|$|\()/);
    if (m) keys.add(m[1]);
  };
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '"' || c === "'" || c === '`') { const lit = readLiteral(body, i); token += body.slice(i, lit.end); i = lit.end - 1; continue; }
    if ('{[('.includes(c)) depth++;
    if ('}])'.includes(c)) depth--;
    if (c === ',' && depth === 0) { flush(); continue; }
    token += c;
  }
  flush();
  return keys;
}

function normalisePath(lit) {
  // Build from template parts: whole-segment expressions -> :param, others (query) dropped.
  let out = '';
  const parts = lit.parts;
  for (let k = 0; k < parts.length; k++) {
    const p = parts[k];
    if ('text' in p) { out += p.text; continue; }
    const prev = out;
    const next = parts[k + 1] && 'text' in parts[k + 1] ? parts[k + 1].text : '';
    if (prev.endsWith('/') && (next === '' || next.startsWith('/') || next.startsWith('?'))) out += ':param';
    // else: expression glued to the path (e.g. `${qs ? `?${qs}` : ''}`) -> query, ignore
  }
  out = out.split('?')[0].replace(/\/+$/, '') || '/';
  if (!out.startsWith('/')) out = `/${out}`;
  return out;
}

/** True when code from `from` to the end of `src` never closes the block `from` sits in. */
function inScope(src, from) {
  let depth = 0;
  for (let j = from; j < src.length; j++) {
    const c = src[j];
    if (c === '"' || c === "'" || c === '`') { const lit = readLiteral(src, j); if (!lit) return false; j = lit.end - 1; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth < 0) return false; }
  }
  return true;
}

/* ------------------------------ API side ----------------------------- */

const routesSrc = fs.readFileSync(path.join(apiRoot, 'app/Config/Routes.php'), 'utf8');
const routes = [];
{
  const stack = [];
  for (const line of routesSrc.split('\n')) {
    const g = line.match(/\$routes->group\(\s*'([^']*)'/);
    if (g) { stack.push(g[1]); continue; }
    if (/^\s*}\);/.test(line)) { stack.pop(); continue; }
    const r = line.match(/\$routes->(get|post|put|patch|delete)\(\s*'([^']*)'\s*,\s*'([^']+)'/);
    if (!r) continue;
    const segs = [...stack, r[2]].map((x) => x.replace(/^\/+|\/+$/g, '')).filter(Boolean);
    const full = `/${segs.join('/')}`.replace(/\(:(segment|num|any|alpha|alphanum|hash)\)/g, ':param');
    const handler = r[3].split('/')[0];
    routes.push({ method: r[1].toUpperCase(), path: full.replace(/^\/api\/v1/, '') || '/', handler });
  }
}

const phpCache = new Map();
const readPhp = (f) => { if (!phpCache.has(f)) phpCache.set(f, fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''); return phpCache.get(f); };
const serviceFiles = walk(path.join(apiRoot, 'app/Services'), ['.php']);

function phpMethodBody(src, name) {
  const m = new RegExp(`function\\s+${name}\\s*\\(`).exec(src);
  if (!m) return '';
  const brace = src.indexOf('{', src.indexOf(')', m.index));
  const end = matchBracket(src, brace);
  return end > 0 ? src.slice(brace, end + 1) : '';
}

function phpReads(body, vars, fileSrc) {
  const keys = new Set();
  const v = vars.join('|');
  for (const m of body.matchAll(new RegExp(`\\$(?:${v})\\[\\s*'([\\w]+)'\\s*\\]`, 'g'))) keys.add(m[1]);
  for (const m of body.matchAll(new RegExp(`array_key_exists\\(\\s*'([\\w]+)'\\s*,\\s*\\$(?:${v})`, 'g'))) keys.add(m[1]);
  for (const m of body.matchAll(/->get(?:Post|Get|Var|File|PostGet|GetPost)\(\s*'([\w]+)'/g)) keys.add(m[1]);
  // allow-lists iterated with $data[$key]: foreach (['a','b'] as $key) / $allowedKeys = [...]
  for (const m of body.matchAll(/(?:foreach\s*\(\s*|\$\w*(?:[Kk]eys|[Ff]ields)\w*\s*=\s*)\[([^\]]*)\]/g)) {
    for (const s of m[1].matchAll(/'([\w]+)'/g)) keys.add(s[1]);
  }
  for (const m of body.matchAll(/self::([A-Z_]+)/g)) {
    const c = new RegExp(`const\\s+${m[1]}\\s*=\\s*\\[([^\\]]*)\\]`).exec(fileSrc || '');
    if (c) for (const s of c[1].matchAll(/'([\w]+)'/g)) keys.add(s[1]);
  }
  return keys;
}

function apiReadKeys(handler) {
  const [ctrl, method] = handler.split('::');
  const file = path.join(apiRoot, 'app/Controllers/Api/V1', `${ctrl.replace(/\\/g, '/')}.php`);
  const src = readPhp(file);
  const body = phpMethodBody(src, method);
  if (!body) return { keys: new Set(), resolved: false };
  const keys = phpReads(body, ['body', 'payload', 'data', 'input', 'json', 'raw'], src);
  let resolved = keys.size > 0;
  // Follow the body into service calls: ->svc->method(..., $body|$payload ...)
  for (const m of body.matchAll(/->(\w+)\(([^;]*?\$(?:body|payload|data|raw)\b[^;]*?)\)/g)) {
    for (const sf of serviceFiles) {
      const ssrc = readPhp(sf);
      const sbody = phpMethodBody(ssrc, m[1]);
      if (!sbody) continue;
      // the body may arrive under any parameter name (e.g. $extra): read the signature
      const sig = new RegExp(`function\\s+${m[1]}\\s*\\(([^)]*)\\)`).exec(ssrc);
      const params = sig ? [...sig[1].matchAll(/\$(\w+)/g)].map((x) => x[1]) : [];
      const sk = phpReads(sbody, [...new Set(['data', 'payload', 'body', 'input', ...params])], ssrc);
      // one more hop for helpers called with $data (e.g. validateProductData($data))
      for (const h of sbody.matchAll(/\$this->(\w+)\(\s*\$data\b/g)) {
        for (const k of phpReads(phpMethodBody(ssrc, h[1]), ['data'], ssrc)) sk.add(k);
      }
      if (sk.size) { sk.forEach((k) => keys.add(k)); resolved = true; }
    }
  }
  // whole-body pass-through (e.g. updatePreferences($userId, $body)) with no reads found
  return { keys, resolved };
}

/* ---------------------------- frontend side --------------------------- */

const calls = [];
for (const file of walk(path.join(webRoot, 'src'), ['.js', '.jsx'])) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /\b(api|apiClient)\s*(?:\.\s*(get|post|put|patch|delete))?\s*\(\s*(?=[`'"])/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1] === 'apiClient' && m[2]) continue;
    const litStart = re.lastIndex;
    const lit = readLiteral(src, litStart);
    if (!lit) continue;
    const p = normalisePath(lit);
    if (p.startsWith('/http') || /^\/?\$/.test(p)) continue;
    let method = (m[2] || 'get').toUpperCase();
    const callOpen = src.lastIndexOf('(', litStart);
    const callClose = matchBracket(src, callOpen);
    const args = callClose > 0 ? src.slice(lit.end, callClose) : '';
    if (m[1] === 'apiClient') {
      const mm = args.match(/method\s*:\s*['"](\w+)['"]/);
      if (mm) method = mm[1].toUpperCase();
    }
    // request body keys
    let keys = null;
    if (['POST', 'PUT', 'PATCH'].includes(method) && m[1] === 'api') {
      const a = args.replace(/^\s*,\s*/, '');
      if (a.startsWith('{')) keys = objectKeys(a.slice(0, matchBracket(a, 0) + 1));
      else {
        const id = (a.match(/^([A-Za-z_$][\w$]*)/) || [])[1];
        const before = src.slice(0, m.index);
        if (id) {
          // nearest declaration whose scope still encloses the call (braces never close below it)
          const decl = [...before.matchAll(new RegExp(`(?:const|let|var)\\s+${id}\\s*=\\s*\\{`, 'g'))]
            .reverse()
            .find((d) => inScope(before, d.index));
          if (decl) {
            const o = decl.index + decl[0].length - 1;
            keys = objectKeys(before.slice(o, matchBracket(before, o) + 1));
            for (const asg of before.slice(o).matchAll(new RegExp(`\\b${id}\\.(\\w+)\\s*=`, 'g'))) keys.add(asg[1]);
          } else if (new RegExp(`(?:const|let|var)\\s+${id}\\s*=\\s*new FormData`).test(before) || /formData/i.test(id)) {
            keys = new Set([...src.matchAll(/\.append\(\s*['"](\w+)['"]/g)].map((x) => x[1]));
          }
        }
      }
    }
    const line = src.slice(0, m.index).split('\n').length;
    calls.push({ file: path.relative(webRoot, file), line, method, path: p, keys });
  }
}

/* ------------------------------- compare ------------------------------ */

const matchRoute = (method, p) => {
  const segs = p.split('/');
  const cands = routes.filter((r) => {
    const rs = r.path.split('/');
    return rs.length === segs.length && rs.every((s, i) => s === segs[i] || s === ':param' || segs[i] === ':param');
  });
  // prefer exact literal segment matches over :param
  cands.sort((a, b) => b.path.split('/').filter((s) => s !== ':param').length - a.path.split('/').filter((s) => s !== ':param').length);
  return { route: cands.find((r) => r.method === method), any: cands };
};

const errors = [];
const warns = [];
const used = new Set();
for (const c of calls) {
  const where = `${c.file}:${c.line}`;
  const { route, any } = matchRoute(c.method, c.path);
  const id = `${c.method} ${c.path}`;
  if (!route) {
    if (allow.has(id)) continue;
    if (any.length) errors.push(`METHOD  ${id} (${where}) — API only has ${[...new Set(any.map((r) => r.method))].join('/')} for ${any[0].path}`);
    else errors.push(`ROUTE   ${id} (${where}) — no API route`);
    continue;
  }
  used.add(`${route.method} ${route.path}`);
  if (c.keys && c.keys.size) {
    const { keys: read, resolved } = apiReadKeys(route.handler);
    if (!resolved) { warns.push(`UNVERIFIED fields ${id} -> ${route.handler} (could not resolve API reads; sent: ${[...c.keys].join(', ')})`); continue; }
    for (const k of c.keys) {
      if (read.has(k) || allow.has(`${id} field:${k}`)) continue;
      errors.push(`FIELD   ${id} sends '${k}' (${where}) — ${route.handler} never reads it (reads: ${[...read].sort().join(', ') || '—'})`);
    }
  }
}
for (const r of routes) {
  if (!used.has(`${r.method} ${r.path}`)) warns.push(`UNUSED  ${r.method} ${r.path} -> ${r.handler} (no frontend caller)`);
}

if (asJson) {
  console.log(JSON.stringify({ apiRoot, routes: routes.length, calls: calls.length, errors, warns }, null, 2));
} else {
  console.log(`contract-check: ${routes.length} API routes, ${calls.length} frontend calls (api: ${path.relative(webRoot, apiRoot) || apiRoot})`);
  for (const w of warns) console.log(`WARN  ${w}`);
  for (const e of errors) console.log(`ERROR ${e}`);
  console.log(errors.length ? `\n${errors.length} contract mismatch(es).` : '\nNo contract mismatches.');
}
process.exit(errors.length ? 1 : 0);
