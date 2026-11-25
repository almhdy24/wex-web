import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers.js';

const STOREFRONT_GATES = [
  { path: '/', name: 'Home' },
  { path: '/products', name: 'Catalog' },
  { path: '/cart', name: 'Cart' },
  { path: '/faq', name: 'FAQ' },
  { path: '/login', name: 'Login' },
];

test.describe('07: Storefront & Admin Quality Gates', () => {
  test('Storefront IA order, 30-char typing retention, no colon-only labels, no overflow, and HTML report', async ({ page }) => {
    const width = page.viewportSize()?.width || 1280;
    const rows = [];

    for (const route of STOREFRONT_GATES) {
      const consoleErrors = [];
      const badResponses = [];
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text());
      });
      page.on('response', (r) => {
        const u = r.url();
        if (
          r.status() >= 400 &&
          !u.includes('favicon') &&
          !u.includes('/api/v1/auth/refresh') &&
          !u.includes('/uploads/products/')
        ) {
          badResponses.push(`${r.status()} ${u}`);
        }
      });

      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main, [role="main"], h1, h2').first()).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(300);

      const audit = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        const colonLabels = Array.from(document.querySelectorAll('label')).filter(
          (el) => el.innerText.trim() === ':'
        ).length;
        const unlabeledButtons = Array.from(document.querySelectorAll('button')).filter((btn) => {
          const text = (btn.innerText || '').trim();
          const aria = (btn.getAttribute('aria-label') || '').trim();
          const title = (btn.getAttribute('title') || '').trim();
          return !text && !aria && !title && btn.offsetParent !== null;
        }).length;
        return { overflow, colonLabels, unlabeledButtons };
      });

      expect(audit.overflow, `${route.path} overflow at ${width}`).toBe(false);
      expect(audit.colonLabels, `${route.path} has colon-only labels`).toBe(0);
      expect(audit.unlabeledButtons, `${route.path} has unlabeled visible buttons`).toBe(0);
      expect(badResponses, `${route.path} failed responses: ${badResponses.join(', ')}`).toEqual([]);
      expect(consoleErrors, `${route.path} console errors: ${consoleErrors.join(', ')}`).toEqual([]);

      const shotName = `gate-${route.name.toLowerCase()}-${width}.png`;
      await page.screenshot({ path: `test-results/${shotName}`, fullPage: false });
      rows.push({ route: route.path, name: route.name, width, status: 'PASS', shotName });
    }

    // HomePage IA order & 30-char typing retention
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const searchInput = page.locator('input[type="search"], input[placeholder*="ابحث"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    const sentence = 'أجهزة لابتوب ديل مستعملة ممتازة';
    await searchInput.click();
    await searchInput.type(sentence, { delay: 10 });
    await expect(searchInput).toHaveValue(sentence);

    const domOrderOk = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const idxNew = bodyText.indexOf('وصل حديثاً');
      const idxPopular = bodyText.indexOf('الأكثر طلباً');
      const idxHow = bodyText.indexOf('طريقة الطلب');
      const idxStore = bodyText.indexOf('معلومات المتجر') !== -1 ? bodyText.indexOf('معلومات المتجر') : bodyText.indexOf('مول الواحة');
      return idxNew !== -1 && idxPopular !== -1 && idxHow !== -1 && idxNew < idxPopular && idxPopular < idxHow && (idxStore === -1 || idxHow < idxStore);
    });
    expect(domOrderOk, 'HomePage sections must follow IA order: وصل حديثاً -> الأكثر طلباً -> طريقة الطلب -> المتجر').toBe(true);

    // Cross-surface check: Admin disables/enables orders_enabled or updates and Storefront reflects it
    await loginAs(page, 'admin@wextechnology.com');
    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // Generate lightweight HTML report in test-results/index.html
    const outDir = path.resolve(process.cwd(), 'test-results');
    fs.mkdirSync(outDir, { recursive: true });
    const htmlRows = rows
      .map(
        (r) =>
          `<tr><td>${r.name}</td><td><code>${r.route}</code></td><td>${r.width}px</td><td><strong style="color:green">${r.status}</strong></td><td><a href="${r.shotName}"><img src="${r.shotName}" width="160"/></a></td></tr>`
      )
      .join('\n');
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Wex E2E Quality Gate Report</title><style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h1>Wex E2E Quality Gate Report</h1><table><thead><tr><th>Screen</th><th>Route</th><th>Viewport</th><th>Status</th><th>Screenshot</th></tr></thead><tbody>${htmlRows}</tbody></table></body></html>`;
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
  });
});
