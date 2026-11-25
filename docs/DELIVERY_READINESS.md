# Wex Technology — Delivery Readiness Report

## 1. Root Cause of Admin 404s (Resolved)
1. **Service Worker (`src/sw.js`)**: `NavigationRoute` had `/^\/admin/` in `denylist` and `NetworkOnly` matched `pathname.includes('/admin')`. Any reload or deep link on `/admin/*` when the SW was active bypassed `index.html` fallback. Fixed to denylist `/^\/api\//` only and scope `NetworkOnly` to `request.mode !== 'navigate' && pathname.startsWith('/api/')`.
2. **Router Error Masking (`src/app/router.jsx`)**: `errorElement: <NotFoundPage />` caused any runtime JS error inside `/admin` to render `404 — الصفحة غير موجودة`. Replaced with `RouteErrorPage.jsx` and added `{ path: '*', element: <NotFoundPage /> }` inside `/admin` children.
3. **Nav Drift (`src/components/admin/AdminShell.jsx`)**: Hardcoded route lists omitted `/admin/brands`. Created `src/app/adminRoutes.js` as Single Source of Truth for `router.jsx`, `AdminShell.jsx`, and `e2e/tests/admin-crawler.spec.js`.
4. **Auth Race (`src/context/PushContext.jsx`)**: `PushContext` fired `/api/v1/push/config` while `AuthContext` `loading` was still `true`, causing a `401` on `/admin` reload. Fixed to wait for `authLoading === false`.
5. **Mobile Heading Hidden (`src/pages/admin/AdminProductsPage.module.css`)**: `.titleInfo` had `display: none` on `< 768px`, hiding `<h1>إدارة المنتجات والأجهزة</h1>`. Fixed to `display: flex`.

---

## 2. Feature Verification Matrix

| Feature / Surface | Status | Evidence |
|---|---|---|
| All 19 Admin Routes (fresh + reload, 360x800 & 1280x800) | **VERIFIED** | CI E2E `admin-crawler.spec.js` (run `45551283848` & latest) |
| Storefront IA Order (`وصل حديثاً` -> `الأكثر طلباً` -> `الماركات` -> `طريقة الطلب`) | **VERIFIED** | CI E2E `07-quality-gates.spec.js` |
| Order Detail Payment Accounts & Receipt-First Order | **VERIFIED** | CI E2E `02-cart-checkout-order.spec.js` & `06-push-notifications.spec.js` |
| Push Backend (`PushService`, `FakeProvider`, retries, kill switch) | **VERIFIED** | PHPUnit `PushNotificationTest` (5 tests, 27 assertions) + CI E2E `06-push-notifications.spec.js` |
| Push Web Client (`sw.js`, state machine, UI) | **VERIFIED** | Vitest `push-notifications.test.jsx` (8/8) & `pwa-workbox.test.js` (3/3) |
| Local HTTPS (`nginx` + Local Root CA) | **VERIFIED** | `nginx -t` + `curl --cacert ~/.wex-local-https/ca.crt` on `https://localhost:8443` |
| Real Push Delivery on Physical Devices | **UNVERIFIED (Needs On-Device Check)** | Cannot be proven in headless CI; use 10-step smoke checklist below |

---

## 3. Production Deployment Notes
1. **SPA Fallback**: Keep `public/_redirects` and `public/.htaccess` (or Nginx `try_files $uri $uri/ /index.html;`) active.
2. **SW Cache-Busting**: Serve `/sw.js` and `/registerSW.js` with `Cache-Control: no-cache, no-store, must-revalidate`.
3. **Backend Migrations & Env**: Run `php spark migrate --all` and `php spark push:keys`, set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `wex.corsAllowedOrigins`, and cron jobs (`push:work`, `orders:expire`, `push:reminders`).

---

## 4. 10-Step Phone Smoke Checklist (5 Minutes)
1. Start local HTTPS (`bash scripts/local-https/start.sh static`) or open production HTTPS URL.
2. Open `/admin/products` and reload the page — confirm it loads (no 404).
3. Open **المزيد** on mobile admin and tap **الماركات** — confirm it opens cleanly.
4. Open Home `/` — confirm order: Hero -> Search -> Categories -> `وصل حديثاً` -> `الأكثر طلباً` -> Brands -> `طريقة الطلب` -> Store Info.
5. Place a test order -> confirm Order Detail shows Receipt Upload / Pre-Permission Sheet before Countdown & Bank Account.
6. Tap **تفعيل الإشعارات** and allow browser permission.
7. Go to **حسابي -> الإعدادات -> الإشعارات** and tap **إرسال إشعار تجريبي**.
8. Minimize/unfocus browser and trigger an order status change from Admin -> confirm OS push arrives in Arabic with no sensitive data.
9. Tap the notification -> confirm it opens `/orders/:orderNumber` and marks it read.
10. Log out -> confirm device subscription is removed.
