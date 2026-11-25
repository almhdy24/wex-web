#!/usr/bin/env node
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const outDir = resolve(rootDir, 'screenshots');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';

const VIEWPORTS = [
  {
    name: 'android-360x800-dpr3-font1.3',
    width: 360,
    height: 800,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    fontScale: 1.3,
  },
  {
    name: 'iphone-390x844-dpr3',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    fontScale: 1.0,
  },
  {
    name: 'ipad-768x1024',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    fontScale: 1.0,
  },
  {
    name: 'laptop-1280x800',
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    fontScale: 1.0,
  },
];

const ROUTES = [
  // Storefront Seven Core Pages
  { path: '/', name: 'store-home' },
  { path: '/catalog', name: 'store-catalog' },
  { path: '/products/lenovo-thinkpad-t480', name: 'store-product-detail' },
  { path: '/cart', name: 'store-cart' },
  { path: '/checkout', name: 'store-checkout' },
  { path: '/orders', name: 'store-orders' },
  { path: '/orders/WEX-101', name: 'store-order-detail' },
  { path: '/account', name: 'store-account' },

  // Auxiliary Storefront Pages
  { path: '/favorites', name: 'store-favorites' },
  { path: '/compare', name: 'store-compare' },
  { path: '/faq', name: 'store-faq' },
  { path: '/about', name: 'store-about' },
  { path: '/privacy-policy', name: 'store-privacy' },
  { path: '/terms', name: 'store-terms' },
  { path: '/login', name: 'store-login' },

  // Admin Shell
  { path: '/admin', name: 'admin-dashboard' },
  { path: '/admin/orders', name: 'admin-orders' },
  { path: '/admin/payments', name: 'admin-payments' },
  { path: '/admin/products', name: 'admin-products' },
  { path: '/admin/rates', name: 'admin-rates' },
  { path: '/admin/settings', name: 'admin-settings' },
  { path: '/admin/shipping-zones', name: 'admin-shipping-zones' },
  { path: '/admin/users', name: 'admin-users' },
  { path: '/admin/categories', name: 'admin-categories' },
  { path: '/admin/brands', name: 'admin-brands' },
  { path: '/admin/announcements', name: 'admin-announcements' },
  { path: '/admin/recent-purchases', name: 'admin-recent-purchases' },
  { path: '/admin/hero-slides', name: 'admin-hero-slides' },
  { path: '/admin/home-sections', name: 'admin-home-sections' },
  { path: '/admin/faq', name: 'admin-faq' },
  { path: '/admin/pages', name: 'admin-pages' },
  { path: '/admin/audit-logs', name: 'admin-audit-logs' },
];

async function main() {
  // Dynamically import playwright (available in CI environment)
  let chromium;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch (err) {
    console.error('Playwright not installed in local environment. This script runs in CI workflow runner.');
    console.error(err.message);
    process.exit(1);
  }

  console.log('=== Wex Technology Visual Regression & Layout Check ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Target Output: ${outDir}`);
  console.log(`Viewports (${VIEWPORTS.length}): ${VIEWPORTS.map((v) => v.name).join(', ')}`);
  console.log(`Routes (${ROUTES.length}): ${ROUTES.map((r) => r.path).join(', ')}`);

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let totalCaptured = 0;
  let totalErrors = 0;

  for (const vp of VIEWPORTS) {
    const vpDir = resolve(outDir, vp.name);
    if (!existsSync(vpDir)) {
      mkdirSync(vpDir, { recursive: true });
    }

    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}, DPR: ${vp.deviceScaleFactor}, Touch: ${vp.hasTouch}) ---`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor || 1,
      isMobile: vp.isMobile ?? false,
      hasTouch: vp.hasTouch ?? false,
      // Requests made by the service worker bypass context.route() mocks and hit the
      // unmocked network (net::ERR_FAILED, stuck skeletons). Snapshots test the page, not the SW.
      serviceWorkers: 'block',
    });

    // Seed mock admin and customer authentication tokens in localStorage
    await context.addInitScript(() => {
      try {
        localStorage.setItem('auth_token', 'mock_ci_admin_token');
        localStorage.setItem(
          'auth_user',
          JSON.stringify({
            id: 1,
            name: 'مدير النظام (CI)',
            email: 'admin@wextechnology.com',
            role: 'admin',
          })
        );
      } catch {
        // ignore
      }
    });

    const page = await context.newPage();

    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      const consoleErrors = [];

      // Name the failing URL: 'Failed to load resource' alone is not diagnosable.

      page.on('requestfailed', (req) => console.log(`   ↳ request failed: ${req.method()} ${req.url()} (${req.failure()?.errorText})`));

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        consoleErrors.push(err.message);
      });

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

        // Apply Android font scale 1.3 when specified
        if (vp.fontScale && vp.fontScale !== 1.0) {
          await page.addStyleTag({
            content: `html { font-size: ${Math.round(vp.fontScale * 100)}% !important; }`,
          });
        }

        await page.waitForTimeout(500);

        // Check for console errors
        if (consoleErrors.length > 0) {
          console.error(`  ❌ [${vp.name}] ${route.path}: Console error(s) detected:`);
          for (const err of consoleErrors) {
            console.error(`     - ${err}`);
          }
          totalErrors++;
        }

        // 1. Check for horizontal overflow (document scrollWidth must equal clientWidth on every page)
        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const winWidth = window.innerWidth;
          const hasOverflow = docWidth > clientWidth + 1 || docWidth > winWidth + 1;

          // Find offending elements where getBoundingClientRect().right > innerWidth
          const offending = [];
          document.querySelectorAll('*').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 1.5) {
              offending.push({
                tag: el.tagName,
                className: el.className ? String(el.className).slice(0, 50) : '',
                right: Math.round(rect.right),
                winWidth,
              });
            }
          });

          return {
            hasOverflow,
            docWidth,
            clientWidth,
            winWidth,
            offending: offending.slice(0, 5),
          };
        });

        if (overflow.hasOverflow) {
          console.error(
            `  ❌ [${vp.name}] ${route.path}: Horizontal overflow detected! (scrollWidth: ${overflow.docWidth}px, clientWidth: ${overflow.clientWidth}px, innerWidth: ${overflow.winWidth}px)`
          );
          if (overflow.offending.length > 0) {
            console.error(`     Offending element(s):`, JSON.stringify(overflow.offending));
          }
          totalErrors++;
        }

        // 2. Fixed bars check (StickyBar, BottomTabBar, AppBar)
        const barCheck = await page.evaluate(() => {
          const winWidth = window.innerWidth;
          const issues = [];
          const fixedElements = Array.from(document.querySelectorAll('*')).filter((el) => {
            const style = window.getComputedStyle(el);
            return (
              style.position === 'fixed' &&
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              parseFloat(style.opacity || '1') > 0
            );
          });

          for (const bar of fixedElements) {
            const rect = bar.getBoundingClientRect();
            // Bar must be fully inside viewport horizontally
            if (rect.left < -1.5 || rect.right > winWidth + 1.5) {
              issues.push({
                type: 'bar_escapes_viewport',
                className: String(bar.className).slice(0, 50),
                rect: { left: Math.round(rect.left), right: Math.round(rect.right) },
                winWidth,
              });
            }

            // Verify StickyBar on mobile is centered, inset 12px, and NOT ~half width
            const cls = String(bar.className);
            if (cls.includes('stickyBar') || cls.includes('purchaseBar')) {
              if (winWidth <= 480) {
                const expectedWidth = winWidth - 24; // inset 12px on both sides
                if (rect.width < expectedWidth * 0.8) {
                  issues.push({
                    type: 'bar_too_narrow_or_offset',
                    actualWidth: Math.round(rect.width),
                    expectedWidth,
                    className: cls.slice(0, 50),
                  });
                }
              }
            }
          }
          return issues;
        });

        if (barCheck.length > 0) {
          console.error(`  ❌ [${vp.name}] ${route.path}: Fixed bar positioning issues:`, JSON.stringify(barCheck));
          totalErrors++;
        }

        // 3. Primary buttons visible and tappable check
        const buttonCheck = await page.evaluate(() => {
          const issues = [];
          const primaryButtons = Array.from(
            document.querySelectorAll(
              'button[class*="primary"], button[class*="orderBtn"], button[class*="cartIcon"], button[class*="stickyUploadBtn"]'
            )
          ).filter((btn) => {
            const style = window.getComputedStyle(btn);
            return (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              parseFloat(style.opacity || '1') > 0
            );
          });

          for (const btn of primaryButtons) {
            const rect = btn.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;

            // Only test buttons currently within viewport bounds
            if (
              rect.top >= 0 &&
              rect.bottom <= window.innerHeight &&
              rect.left >= 0 &&
              rect.right <= window.innerWidth
            ) {
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const elAtPoint = document.elementFromPoint(centerX, centerY);
              if (elAtPoint && !btn.contains(elAtPoint) && !elAtPoint.contains(btn)) {
                issues.push({
                  btnText: btn.textContent?.trim().slice(0, 30),
                  btnClass: String(btn.className).slice(0, 50),
                  obstructedBy: `${elAtPoint.tagName}.${String(elAtPoint.className).slice(0, 40)}`,
                });
              }
            }
          }
          return issues;
        });

        if (buttonCheck.length > 0) {
          console.error(
            `  ❌ [${vp.name}] ${route.path}: Primary button(s) obstructed:`,
            JSON.stringify(buttonCheck)
          );
          totalErrors++;
        }

        // 4. Special check on /catalog: open filter Sheet and verify BottomTabBar doesn't overlap Apply/Reset buttons
        if (route.path === '/catalog') {
          try {
            const filterTrigger = await page.$(
              'button[aria-label*="تصفية"], button:has-text("تصفية"), button[class*="filterBtn"]'
            );
            if (filterTrigger) {
              await filterTrigger.click();
              await page.waitForTimeout(300);

              const sheetOverlapCheck = await page.evaluate(() => {
                const sheet = document.querySelector('[role="dialog"]');
                const tabbar = document.querySelector('nav[class*="bottomNav"], [class*="bottomNav"]');
                const applyBtn = document.querySelector('button[class*="applyBtn"]');
                const resetBtn = document.querySelector('button[class*="resetDraftBtn"]');

                if (!sheet || !applyBtn) return { hasIssue: false, note: 'Sheet or apply button not found' };

                let overlapped = false;
                const bRect = applyBtn.getBoundingClientRect();
                const topEl = document.elementFromPoint(
                  bRect.left + bRect.width / 2,
                  bRect.top + bRect.height / 2
                );

                if (topEl && tabbar && (tabbar.contains(topEl) || topEl.closest('[class*="bottomNav"]'))) {
                  overlapped = true;
                }

                return {
                  hasIssue: overlapped,
                  applyBtnVisible: bRect.width > 0 && bRect.height > 0,
                  resetBtnVisible: Boolean(resetBtn),
                };
              });

              if (sheetOverlapCheck.hasIssue) {
                console.error(
                  `  ❌ [${vp.name}] /catalog filter sheet: BottomTabBar overlaps the sheet Apply/Reset buttons!`
                );
                totalErrors++;
              }

              // Close sheet
              const closeBtn = await page.$(
                '[role="dialog"] button[aria-label*="إغلاق"], button[class*="closeBtn"]'
              );
              if (closeBtn) {
                await closeBtn.click();
                await page.waitForTimeout(200);
              }
            }
          } catch {
            // Ignore filter sheet test errors if button not present
          }
        }

        // Capture screenshot
        const screenshotPath = resolve(vpDir, `${route.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  ✓ [${vp.name}] ${route.path} -> ${route.name}.png`);
        totalCaptured++;
      } catch (err) {
        console.error(`  ❌ [${vp.name}] ${route.path}: Failed to capture - ${err.message}`);
        totalErrors++;
      }
    }

    await context.close();
  }

  await browser.close();

  console.log(`\n=== CI Visual Check Summary ===`);
  console.log(`Total Screenshots Captured: ${totalCaptured}`);
  console.log(`Total Errors / Violations: ${totalErrors}`);

  if (totalErrors > 0) {
    console.error('❌ FAIL: Visual and layout checks detected errors or horizontal overflow.');
    process.exit(1);
  } else {
    console.log(
      '✅ PASS: All viewports captured cleanly with zero console errors, zero horizontal overflow, and fully reachable action controls.'
    );
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled visual check failure:', err);
  process.exit(1);
});
