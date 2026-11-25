import { test, expect } from '@playwright/test';
import { ADMIN_ROUTES } from '../../src/app/adminRoutes.js';
import { loginAs } from './helpers.js';

const CRAWL_ROUTES = ADMIN_ROUTES.filter((r) => !r.path.includes(':'));

test.describe('Admin Route Crawler (P0 Gate)', () => {
  test('visits and reloads every admin route without 404, 4xx/5xx, console errors, or overflow', async ({ page }, testInfo) => {
    const consoleErrors = [];
    const pageErrors = [];
    const failedResponses = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        failedResponses.push(`${res.status()} ${res.url()}`);
      }
    });

    await loginAs(page, 'admin@wextechnology.com');

    const width = page.viewportSize()?.width || 1280;
    const reportRows = [];

    for (const route of CRAWL_ROUTES) {
      consoleErrors.length = 0;
      pageErrors.length = 0;
      failedResponses.length = 0;

      // 1. Direct URL navigation
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

      // 2. Reload on the deep link (verifies SPA fallback & SW NavigationRoute)
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

      // Wait briefly for initial API data fetch to settle
      await page.waitForTimeout(400);

      const bodyText = await page.locator('body').innerText();
      expect(bodyText, `Route ${route.path} rendered NotFoundPage`).not.toContain('الصفحة غير موجودة');
      expect(bodyText, `Route ${route.path} rendered RouteErrorPage`).not.toContain('حدث خطأ غير متوقع');

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(overflow, `Route ${route.path} has horizontal overflow at width ${width}`).toBe(false);

      expect(failedResponses, `Route ${route.path} had failed HTTP responses: ${failedResponses.join(', ')}`).toEqual([]);
      expect(pageErrors, `Route ${route.path} had page errors: ${pageErrors.join(', ')}`).toEqual([]);
      expect(consoleErrors, `Route ${route.path} had console errors: ${consoleErrors.join(', ')}`).toEqual([]);

      const slug = route.path.replace(/\//g, '_').replace(/^_/, '');
      const shotPath = `test-results/crawler-${slug}-${width}.png`;
      await page.screenshot({ path: shotPath, fullPage: false });

      reportRows.push(`| ${route.path} | PASS (${width}px) | ${shotPath} |`);
    }

    // 3. Verify navigation clicks (mobile More sheet at 360px, desktop sidebar at 1280px)
    if (width <= 768) {
      const moreBtn = page.getByRole('button', { name: 'المزيد' });
      await expect(moreBtn).toBeVisible();
      await moreBtn.click();
      await expect(page.getByRole('link', { name: 'الماركات' })).toBeVisible();
      await page.getByRole('link', { name: 'الماركات' }).click();
      await expect(page).toHaveURL(/\/admin\/brands/);
    } else {
      const brandsLink = page.locator('aside a[href="/admin/brands"]').first();
      await expect(brandsLink).toBeVisible();
      await brandsLink.click();
      await expect(page).toHaveURL(/\/admin\/brands/);
    }

    console.log(`\n=== ADMIN CRAWLER ROUTE TABLE (${testInfo.project.name}) ===`);
    console.log('| Route | Status | Screenshot |');
    console.log('|---|---|---|');
    reportRows.forEach((r) => console.log(r));
  });
});
