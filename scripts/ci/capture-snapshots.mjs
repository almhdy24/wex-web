import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const OUTPUT_DIR = path.resolve(__dirname, 'screenshots');

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

function loadFixture(file) {
  const p = path.join(FIXTURES_DIR, file);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const shopFixture = loadFixture('shop.json');
const categoriesFixture = loadFixture('categories.json');
const brandsFixture = loadFixture('brands.json');
const productsFixture = loadFixture('products.json');
const productDetailFixture = loadFixture('product-detail.json');
const orderConfirmedFixture = loadFixture('order-confirmed.json');
const orderPendingFixture = loadFixture('order-pending.json');
const orderExpiredFixture = loadFixture('order-expired.json');
const ordersListFixture = loadFixture('orders-list.json');
const adminDashboardFixture = loadFixture('admin-dashboard.json');
const userProfileFixture = loadFixture('user-profile.json');

const ROUTES = [
  { name: '01-home', path: '/', auth: false },
  { name: '02-catalog', path: '/catalog', auth: false },
  { name: '03-product-detail', path: '/products/thinkpad-t480s', auth: false },
  { name: '04-cart', path: '/cart', auth: false },
  { name: '05-checkout', path: '/checkout', auth: true },
  { name: '06-order-detail-confirmed', path: '/orders/WEX-261123-3353B', auth: true },
  { name: '07-order-detail-pending', path: '/orders/WEX-PENDING-001', auth: true },
  { name: '08-order-detail-expired', path: '/orders/WEX-EXPIRED-001', auth: true },
  { name: '09-account', path: '/account', auth: true },
  { name: '10-login', path: '/login', auth: false },
  { name: '11-admin-dashboard', path: '/admin', auth: true, admin: true },
  { name: '12-admin-orders-list', path: '/admin/orders', auth: true, admin: true },
  { name: '13-admin-order-detail', path: '/admin/orders/WEX-261123-3353B', auth: true, admin: true },
  { name: '14-admin-products-list', path: '/admin/products', auth: true, admin: true },
  { name: '15-admin-product-form', path: '/admin/products/new', auth: true, admin: true },
];

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'desktop-1280', width: 1280, height: 800 },
];

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  let hasFailures = false;
  const failureReasons = [];

  for (const vp of VIEWPORTS) {
    const vpDir = path.join(OUTPUT_DIR, vp.name);
    fs.mkdirSync(vpDir, { recursive: true });

    console.log(`\n📷 Capturing snapshots for viewport: ${vp.name} (${vp.width}x${vp.height})`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'ar-SD',
      // Full-page captures never scroll, so <Reveal> sections (opacity 0 until intersected)
      // were blank bands in every screenshot (VIS-04). Reduced motion renders them at rest.
      reducedMotion: 'reduce',
      // Requests made by the service worker bypass context.route() mocks and hit the
      // unmocked network (net::ERR_FAILED, stuck skeletons). Snapshots test the page, not the SW.
      serviceWorkers: 'block',
    });

    // Mock API requests
    await context.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const p = url.pathname;

      if (p.includes('/shop')) {
        return route.fulfill({ json: shopFixture });
      }
      if (p.includes('/categories')) {
        return route.fulfill({ json: categoriesFixture });
      }
      if (p.includes('/brands')) {
        return route.fulfill({ json: brandsFixture });
      }
      if (p.includes('/products/thinkpad-t480s') || p.includes('/products/1')) {
        return route.fulfill({ json: productDetailFixture });
      }
      if (p.includes('/products')) {
        return route.fulfill({ json: productsFixture });
      }
      if (p.includes('/orders/WEX-PENDING-001')) {
        return route.fulfill({ json: orderPendingFixture });
      }
      if (p.includes('/orders/WEX-EXPIRED-001')) {
        return route.fulfill({ json: orderExpiredFixture });
      }
      if (p.includes('/orders/WEX-261123-3353B') || p.includes('/admin/orders/WEX-261123-3353B')) {
        return route.fulfill({ json: orderConfirmedFixture });
      }
      if (p.includes('/orders')) {
        return route.fulfill({ json: ordersListFixture });
      }
      if (p.includes('/admin/dashboard') || p.includes('/admin/stats')) {
        return route.fulfill({ json: adminDashboardFixture });
      }
      if (p.includes('/auth/me') || p.includes('/users/me')) {
        return route.fulfill({ json: userProfileFixture });
      }

      return route.fulfill({ json: { success: true, data: [] } });
    });

    for (const route of ROUTES) {
      const page = await context.newPage();
      const consoleErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        consoleErrors.push(err.message);
      });

      // Inject authentication tokens if route requires auth
      if (route.auth) {
        await page.addInitScript(({ admin }) => {
          localStorage.setItem('wex_token', 'mock_jwt_token_for_ci');
          localStorage.setItem('token', 'mock_jwt_token_for_ci');
          localStorage.setItem(
            'wex_user',
            JSON.stringify({
              id: admin ? 1 : 10,
              name: admin ? 'مشرف المتجر' : 'أحمد إبراهيم',
              phone: '0912345678',
              role: admin ? 'admin' : 'customer',
            })
          );
        }, { admin: Boolean(route.admin) });
      }

      try {
        const fullUrl = `${BASE_URL}${route.path}`;
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500); // Allow animations & layout to settle

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return {
            scrollWidth: doc.scrollWidth,
            clientWidth: doc.clientWidth,
            hasOverflow: doc.scrollWidth > window.innerWidth + 1,
          };
        });

        if (overflow.hasOverflow) {
          const msg = `[Overflow] ${vp.name} ${route.name} (${route.path}): scrollWidth (${overflow.scrollWidth}px) > viewport (${vp.width}px)`;
          console.error(`  ❌ ${msg}`);
          failureReasons.push(msg);
          hasFailures = true;
        }

        // Check console errors
        if (consoleErrors.length > 0) {
          const msg = `[Console Errors] ${vp.name} ${route.name}: ${consoleErrors.join('; ')}`;
          console.error(`  ❌ ${msg}`);
          failureReasons.push(msg);
          hasFailures = true;
        }

        const screenshotPath = path.join(vpDir, `${route.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  ✓ ${route.name} saved -> ${path.relative(process.cwd(), screenshotPath)}`);
      } catch (err) {
        const msg = `[Load Failure] ${vp.name} ${route.name} (${route.path}): ${err.message}`;
        console.error(`  ❌ ${msg}`);
        failureReasons.push(msg);
        hasFailures = true;
      } finally {
        await page.close();
      }
    }

    await context.close();
  }

  await browser.close();

  if (hasFailures) {
    console.error('\n❌ Visual CI Snapshots Failed:');
    for (const r of failureReasons) {
      console.error(`  - ${r}`);
    }
    process.exit(1);
  } else {
    console.log('\n✅ Visual CI Snapshots: All routes captured cleanly with 0 console errors and 0 horizontal overflow.');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal snapshot runner error:', err);
  process.exit(1);
});
