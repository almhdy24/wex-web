import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Design-review snapshots: every storefront and admin screen at 360x800 and 1280x800.
 *
 * API responses are recorded from a real, freshly seeded API (fixtures/recorded/*.json,
 * see docs/CI-SCREENSHOTS.md), so the screens render real shapes and states. Product
 * photos are studio-style renders (fixtures/images, render-product-images.py): text
 * wireframes made card and gallery design impossible to judge.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const OUTPUT_DIR = path.resolve(__dirname, 'screenshots');
const FIX = path.resolve(__dirname, 'fixtures');
const REC = path.join(FIX, 'recorded');
const IMG = path.join(FIX, 'images');

const rec = (name) => JSON.parse(fs.readFileSync(path.join(REC, `${name}.json`), 'utf8'));
const legacy = (name) => JSON.parse(fs.readFileSync(path.join(FIX, `${name}.json`), 'utf8'));

const ORDERS = rec('_orders');
const inHours = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();

// Recorded lock times go stale; keep live orders' locks in the future for every run.
function freshOrder(name, hours) {
  const o = rec(name);
  if (o?.data && hours) {
    o.data.lock_expires_at = inHours(hours);
    o.data.seconds_remaining = Math.round(hours * 3600);
    if (o.data.payment) o.data.payment.lock_expires_at = o.data.lock_expires_at;
  }
  return o;
}

const orderByNumber = {
  [ORDERS.pending]: freshOrder('order-pending', 3.4),
  [ORDERS.review]: freshOrder('order-review', 2.1),
  [ORDERS.rejected]: freshOrder('order-reject', 1.6),
  [ORDERS.confirmed]: rec('order-conf'),
  'WEX-EXPIRED-001': legacy('order-expired'),
};

const ordersList = rec('orders-list');
const products = rec('products');
const productList = products.data || [];

// Exact path (after /api/v1) -> recorded response.
const EXACT = {
  '/shop': 'shop', '/categories': 'categories', '/brands': 'brands', '/shipping-zones': 'zones',
  '/announcements': 'announcements', '/content/hero-slides': 'hero-slides',
  '/content/home-sections': 'home-sections', '/content/faq': 'faq', '/content/pages': 'pages',
  '/notifications/unread-count': 'unread', '/push/config': 'push-config', '/push/preferences': 'push-prefs',
  '/admin/dashboard': 'admin-dashboard', '/admin/settings': 'admin-settings', '/admin/rates': 'admin-rates',
  '/admin/shipping-zones': 'admin-zones', '/admin/users': 'admin-users', '/admin/categories': 'admin-categories',
  '/admin/brands': 'admin-brands', '/admin/audit-logs': 'admin-audit', '/admin/hero-slides': 'admin-hero',
  '/admin/faq': 'admin-faq', '/admin/pages': 'admin-pages', '/admin/announcements': 'admin-announcements',
  '/admin/payment-accounts': 'admin-payment-accounts',
};

const ok = (data) => ({ success: true, message: '', data });

// Which studio image stands in for a product photo path.
function imageFor(file) {
  const f = file.toLowerCase();
  const thumb = f.includes('_thumb');
  let base = null;
  if (f.includes('mouse')) base = 'mouse';
  else if (f.includes('backpack') || f.includes('bag')) base = 'backpack';
  else if (f.includes('charger')) base = 'charger';
  else if (f.includes('ssd') || f.includes('ram')) base = 'ssd';
  else if (f.includes('cooling')) base = 'laptop-gray';
  else if (f.includes('phone') || f.includes('iphone') || f.includes('galaxy')) base = 'phone-black';
  else {
    const laptops = ['laptop-silver', 'laptop-black', 'laptop-gray', 'laptop-navy'];
    let h = 0;
    for (const c of f.replace(/(_thumb|-\d+)?\.jpg$/, '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    base = laptops[h % laptops.length];
  }
  return path.join(IMG, `${base}${thumb ? '_thumb' : ''}.jpg`);
}

let currentRole = 'guest'; // set per route; drives /me and /auth/refresh

async function handleApi(route) {
  const url = new URL(route.request().url());
  const p = url.pathname.replace(/^.*\/api\/v1/, '');
  const method = route.request().method();

  if (p === '/auth/refresh') {
    if (currentRole === 'guest') return route.fulfill({ status: 401, json: { success: false, message: '' } });
    return route.fulfill({ json: ok({ access_token: `ci-${currentRole}`, expires_in: 900 }) });
  }
  if (p === '/me') return route.fulfill({ json: rec(currentRole === 'admin' ? 'me-admin' : 'me-customer') });
  if (method !== 'GET') return route.fulfill({ json: ok(null) });

  if (EXACT[p]) return route.fulfill({ json: rec(EXACT[p]) });

  let m;
  if (/\/payment-proof\/\d+\/image$|\/proofs\/\d+\/image$/.test(p)) {
    return route.fulfill({ path: path.join(IMG, 'receipt.jpg'), contentType: 'image/jpeg' });
  }
  if ((m = p.match(/^\/products\/([^/]+)$/))) {
    const slug = decodeURIComponent(m[1]);
    const item = productList.find((x) => x.slug === slug);
    if (item?.type === 'accessory') return route.fulfill({ json: rec('product-detail-acc') });
    return route.fulfill({ json: rec('product-detail') });
  }
  if (p === '/products') return route.fulfill({ json: products });
  if ((m = p.match(/^\/(admin\/)?orders\/([^/]+)$/))) {
    const o = orderByNumber[decodeURIComponent(m[2])];
    if (o) return route.fulfill({ json: o });
    // The admin payment queue also lists seeded orders outside the four recorded ones.
    if (m[1]) return route.fulfill({ json: rec('admin-order') });
    return route.fulfill({ status: 404, json: { success: false, message: 'الطلب غير موجود.' } });
  }
  if (p === '/orders') return route.fulfill({ json: ordersList });
  if (p === '/admin/orders') {
    return route.fulfill({ json: rec(url.searchParams.get('status') === 'payment_review' ? 'admin-payments' : 'admin-orders') });
  }
  if (/^\/admin\/products\/\d+$/.test(p)) return route.fulfill({ json: rec('admin-product') });
  if (p === '/admin/products') return route.fulfill({ json: rec('admin-products') });
  if (p === '/notifications') return route.fulfill({ json: rec('notifications') });

  return route.fulfill({ json: ok([]) });
}

const customer = { role: 'customer' };
const admin = { role: 'admin' };
const twoProducts = productList.slice(0, 2);

const ROUTES = [
  // Storefront
  { name: '01-home', path: '/' },
  { name: '02-catalog', path: '/catalog' },
  { name: '03-catalog-filter-sheet', path: '/catalog', mobileOnly: true, action: async (page) => {
    await page.getByRole('button', { name: 'تصفية' }).first().click();
    await page.waitForTimeout(400);
  } },
  { name: '04-product-detail', path: '/products/lenovo-thinkpad-t480' },
  { name: '05-product-accessory', path: '/products/logitech-wireless-mouse-b170' },
  { name: '06-cart', path: '/cart', cart: true },
  { name: '07-checkout', path: '/checkout', cart: true, ...customer },
  { name: '08-checkout-login-sheet', path: '/checkout', cart: true, action: async (page) => {
    await page.locator('input[type="tel"]').first().fill('0912345678');
    // A hidden (responsive) duplicate made `.last()` wait forever; click the visible one.
    const btn = page.locator('button:visible', { hasText: 'تأكيد الطلب' }).last();
    try {
      await btn.click({ timeout: 5000 });
    } catch (e) {
      // Report why (e.g. which element intercepts the tap: that would be a real bug).
      console.error(`   ! confirm click: ${e.message.split('\n').slice(0, 6).join(' | ')}`);
      await btn.evaluate((el) => el.click());
    }
    await page.waitForTimeout(400);
  } },
  { name: '09-orders', path: '/orders', ...customer },
  { name: '10-order-pending', path: `/orders/${ORDERS.pending}`, ...customer },
  { name: '11-order-review', path: `/orders/${ORDERS.review}`, ...customer },
  { name: '12-order-rejected', path: `/orders/${ORDERS.rejected}`, ...customer },
  { name: '13-order-confirmed', path: `/orders/${ORDERS.confirmed}`, ...customer },
  { name: '14-order-expired', path: '/orders/WEX-EXPIRED-001', ...customer },
  { name: '15-account', path: '/account', ...customer },
  { name: '16-favorites', path: '/favorites', ...customer, favorites: true },
  { name: '17-compare', path: '/compare', compare: true },
  { name: '18-notifications', path: '/notifications', ...customer },
  { name: '19-faq', path: '/faq' },
  { name: '20-login', path: '/login' },
  { name: '21-offline', path: '/offline' },
  { name: '22-not-found', path: '/this-page-does-not-exist' },
  // Admin
  { name: '30-admin-dashboard', path: '/admin', ...admin },
  { name: '31-admin-orders', path: '/admin/orders', ...admin },
  { name: '32-admin-order-detail', path: `/admin/orders/${ORDERS.review}`, ...admin },
  { name: '33-admin-payments', path: '/admin/payments', ...admin },
  { name: '34-admin-products', path: '/admin/products', ...admin },
  { name: '35-admin-product-new', path: '/admin/products/new', ...admin },
  { name: '36-admin-product-edit', path: '/admin/products/2/edit', ...admin },
  { name: '37-admin-settings', path: '/admin/settings', ...admin },
  { name: '38-admin-hero-slides', path: '/admin/hero-slides', ...admin },
  { name: '39-admin-faq', path: '/admin/faq', ...admin },
  { name: '40-admin-pages', path: '/admin/pages', ...admin },
  { name: '41-admin-users', path: '/admin/users', ...admin },
];

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'desktop-1280', width: 1280, height: 800 },
];

async function run() {
  const only = process.env.SNAP_ONLY ? new RegExp(process.env.SNAP_ONLY) : null;
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const failures = [];

  for (const vp of VIEWPORTS) {
    const vpDir = path.join(OUTPUT_DIR, vp.name);
    fs.mkdirSync(vpDir, { recursive: true });
    console.log(`\n📷 ${vp.name} (${vp.width}x${vp.height})`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'ar-SD',
      // Full-page captures never scroll: <Reveal> sections stay at opacity 0 unless motion
      // is reduced (VIS-04).
      reducedMotion: 'reduce',
      // SW requests bypass context.route() mocks.
      serviceWorkers: 'block',
    });
    await context.route('**/api/**', handleApi);
    await context.route('**/uploads/products/**', (route) => {
      const file = new URL(route.request().url()).pathname.split('/').pop();
      return route.fulfill({ path: imageFor(file), contentType: 'image/jpeg' });
    });

    for (const route of ROUTES) {
      if (route.mobileOnly && vp.width > 480) continue;
      if (only && !only.test(route.name)) continue;
      currentRole = route.role || 'guest';
      const page = await context.newPage();
      const consoleErrors = [];
      // A guest's session bootstrap gets 401 from /auth/refresh by design (no cookie).
      const expected401 = (t) => route.role === undefined && /status of 401/.test(t);
      page.on('console', (msg) => { if (msg.type() === 'error' && !expected401(msg.text())) consoleErrors.push(msg.text()); });
      page.on('pageerror', (err) => consoleErrors.push(err.message));

      await page.addInitScript((seed) => {
        localStorage.clear();
        if (seed.user) localStorage.setItem('wex_user', JSON.stringify(seed.user));
        if (seed.cart) localStorage.setItem('wex_cart_items', JSON.stringify(seed.cart));
        if (seed.favorites) localStorage.setItem(`wex_user_favorites_${seed.user?.id}`, JSON.stringify(seed.favorites));
        if (seed.compare) localStorage.setItem('wex_compare_items', JSON.stringify(seed.compare));
      }, {
        user: route.role ? rec(route.role === 'admin' ? 'me-admin' : 'me-customer').data : null,
        cart: route.cart ? [{ ...productList[1], quantity: 1 }, { ...productList[8], quantity: 2 }] : null,
        favorites: route.favorites ? productList.slice(2, 5) : null,
        compare: route.compare ? twoProducts : null,
      });

      try {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(400);
        if (route.action) await route.action(page);

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        if (overflow) failures.push(`[Overflow] ${vp.name} ${route.name}`);
        if (consoleErrors.length) failures.push(`[Console] ${vp.name} ${route.name}: ${consoleErrors.join('; ')}`);

        if (!route.action) {
          // The mobile app shell scrolls inside its own container, so a full-page capture
          // only ever showed the first 800px. Let the document hold the whole screen.
          await page.addStyleTag({ content: `
            [class*="desktopViewport"], [class*="appShell"] { height: auto !important; max-height: none !important; min-height: 100dvh !important; overflow: visible !important; }
            [class*="screensViewport"] { overflow: visible !important; flex: none !important; }
          ` });
          await page.waitForTimeout(150);
        }
        await page.screenshot({ path: path.join(vpDir, `${route.name}.png`), fullPage: !route.action });
        console.log(`  ✓ ${route.name}${overflow ? ' (overflow)' : ''}${consoleErrors.length ? ' (console errors)' : ''}`);
      } catch (err) {
        failures.push(`[Load] ${vp.name} ${route.name}: ${err.message.split('\n')[0]}`);
        console.error(`  ❌ ${route.name}: ${err.message.split('\n')[0]}`);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
  await browser.close();

  if (failures.length) {
    console.error('\n❌ Snapshot problems:');
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }
  console.log('\n✅ All screens captured: 0 console errors, 0 horizontal overflow.');
}

run().catch((err) => {
  console.error('Fatal snapshot runner error:', err);
  process.exit(1);
});
