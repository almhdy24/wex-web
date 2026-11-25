import fs from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';
import { ADMIN_ROUTES } from '../../src/app/adminRoutes.js';
import { loginAs } from './helpers.js';

const AUDIT_WIDTHS = [320, 360, 412, 768];
const CRAWL_ROUTES = ADMIN_ROUTES.filter((r) => !r.path.includes(':'));

test.describe('Phase 1: Admin Deep Audit (320/360/412/768)', () => {
  test('measures layout, touch targets, typography, overlap, and captures screenshots across all admin routes', async ({ page }) => {
    test.setTimeout(180000);
    await loginAs(page, 'admin@wextechnology.com');

    const report = [];
    const outDir = path.resolve(process.cwd(), 'test-results/admin-audit');
    fs.mkdirSync(outDir, { recursive: true });

    for (const width of AUDIT_WIDTHS) {
      await page.setViewportSize({ width, height: 800 });

      for (const route of CRAWL_ROUTES) {
        const consoleErrors = [];
        const failedRequests = [];

        const onConsole = (m) => {
          if (m.type() === 'error') consoleErrors.push(m.text());
        };
        const onResponse = (r) => {
          if (r.status() >= 400 && !r.url().includes('favicon')) {
            failedRequests.push(`${r.status()} ${r.url()}`);
          }
        };

        page.on('console', onConsole);
        page.on('response', onResponse);

        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(450);

        const metrics = await page.evaluate(() => {
          const vw = window.innerWidth;
          const describe = (el) => {
            const parts = [];
            let cur = el;
            for (let i = 0; i < 4 && cur && cur.nodeType === 1; i += 1) {
              const tag = cur.tagName.toLowerCase();
              const cls = typeof cur.className === 'string'
                ? cur.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.')
                : '';
              parts.unshift(cls ? `${tag}.${cls}` : tag);
              cur = cur.parentElement;
            }
            return parts.join(' > ');
          };

          const overflow = document.documentElement.scrollWidth > vw + 1;
          const outOfViewport = [];
          const clippedText = [];
          const smallTouchTargets = [];
          const smallInputFonts = [];
          const unlabeledControls = [];
          const colonOnlyLabels = [];
          const tallEmptyBlocks = [];
          const interactiveRects = [];

          document.querySelectorAll('*').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return;

            if (rect.right > vw + 2 || rect.left < -2) {
              if (outOfViewport.length < 15) {
                outOfViewport.push({
                  selector: describe(el),
                  left: Math.round(rect.left),
                  right: Math.round(rect.right),
                  vw,
                  position: cs.position,
                });
              }
            }

            if (
              (cs.overflowX === 'hidden' || cs.overflow === 'hidden') &&
              el.scrollWidth > el.clientWidth + 4 &&
              el.innerText.trim().length > 0 &&
              clippedText.length < 10
            ) {
              clippedText.push({
                selector: describe(el),
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
                text: el.innerText.trim().slice(0, 40),
              });
            }
          });

          document.querySelectorAll('button, a, [role="button"]').forEach((el) => {
            const rect = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (rect.width === 0 || rect.height === 0 || cs.display === 'none' || cs.visibility === 'hidden') return;
            interactiveRects.push({ el, rect, selector: describe(el) });
            if (rect.width < 44 || rect.height < 44) {
              if (smallTouchTargets.length < 15) {
                smallTouchTargets.push({
                  selector: describe(el),
                  w: Math.round(rect.width),
                  h: Math.round(rect.height),
                  text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30),
                });
              }
            }
            const label = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
            if (!label && unlabeledControls.length < 10) {
              unlabeledControls.push(describe(el));
            }
          });

          const overlappingInteractive = [];
          for (let i = 0; i < interactiveRects.length; i += 1) {
            for (let j = i + 1; j < interactiveRects.length; j += 1) {
              const a = interactiveRects[i];
              const b = interactiveRects[j];
              if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
              const overlapX = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
              const overlapY = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
              if (overlapX > 4 && overlapY > 4 && overlappingInteractive.length < 10) {
                overlappingInteractive.push({ a: a.selector, b: b.selector });
              }
            }
          }

          document.querySelectorAll('input, select, textarea').forEach((el) => {
            const rect = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (rect.width === 0 || rect.height === 0 || cs.display === 'none') return;
            const fsPx = parseFloat(cs.fontSize);
            if (fsPx < 16 && smallInputFonts.length < 10) {
              smallInputFonts.push({ selector: describe(el), fontSize: fsPx });
            }
          });

          document.querySelectorAll('label').forEach((el) => {
            if (el.innerText.trim() === ':') {
              colonOnlyLabels.push(describe(el));
            }
          });

          document.querySelectorAll('div, section').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.height > 120 && el.innerText.trim() === '' && !el.querySelector('img, svg, input, canvas')) {
              if (tallEmptyBlocks.length < 5) {
                tallEmptyBlocks.push({ selector: describe(el), height: Math.round(rect.height) });
              }
            }
          });

          const bodyText = document.body.innerText;
          const notFoundRender = bodyText.includes('الصفحة غير موجودة');

          return {
            overflow,
            scrollWidth: document.documentElement.scrollWidth,
            outOfViewport,
            clippedText,
            smallTouchTargets,
            overlappingInteractive,
            smallInputFonts,
            unlabeledControls,
            colonOnlyLabels,
            tallEmptyBlocks,
            notFoundRender,
          };
        });

        page.off('console', onConsole);
        page.off('response', onResponse);

        const slug = route.path.replace(/\//g, '_').replace(/^_/, '');
        const shotFile = `audit-${slug}-${width}.png`;
        await page.screenshot({ path: path.join(outDir, shotFile), fullPage: true });

        report.push({
          route: route.path,
          width,
          ...metrics,
          consoleErrors,
          failedRequests,
          screenshot: shotFile,
        });
      }
    }

    fs.writeFileSync(
      path.join(outDir, 'admin-audit-report.json'),
      JSON.stringify(report, null, 2)
    );

    const htmlRows = report
      .map((r) => {
        const pass = !r.overflow && !r.notFoundRender && r.colonOnlyLabels.length === 0 && r.smallInputFonts.length === 0 && r.consoleErrors.length === 0 && r.failedRequests.length === 0;
        return `<tr><td><code>${r.route}</code></td><td>${r.width}px</td><td style="color:${pass ? 'green' : 'red'}"><strong>${pass ? 'PASS' : 'FAIL'}</strong></td><td>${r.overflow}</td><td>${r.smallInputFonts.length}</td><td><a href="${r.screenshot}"><img src="${r.screenshot}" width="120"/></a></td></tr>`;
      })
      .join('\n');
    fs.writeFileSync(
      path.join(outDir, 'index.html'),
      `<!doctype html><html><head><meta charset="utf-8"><title>Admin Audit Report</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;text-align:left}</style></head><body><h1>Admin Audit Report (320/360/412/768)</h1><table><thead><tr><th>Route</th><th>Width</th><th>Status</th><th>Overflow</th><th>SmallInputs</th><th>Screenshot</th></tr></thead><tbody>${htmlRows}</tbody></table></body></html>`
    );

    const failures = report.filter(
      (r) =>
        r.overflow ||
        r.notFoundRender ||
        r.colonOnlyLabels.length > 0 ||
        r.smallInputFonts.length > 0 ||
        r.consoleErrors.length > 0 ||
        r.failedRequests.length > 0
    );
    if (failures.length > 0) {
      throw new Error(
        `Admin audit failed on ${failures.length} route/width checks:\n` +
          failures
            .map(
              (f) =>
                `${f.route} (${f.width}px): overflow=${f.overflow}, notFound=${f.notFoundRender}, smallInputs=${f.smallInputFonts.length}, console=${f.consoleErrors.length}, http=${f.failedRequests.length}`
            )
            .join('\n')
      );
    }
  });
});
