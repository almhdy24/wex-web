# Wex Push Notifications — Production Deployment & Smoke Checklist

## 1. Backend Deployment (`wex-api`)

1. Install PHP dependencies (including `minishlink/web-push`):
   ```bash
   composer install --no-dev --optimize-autoloader
   ```
2. Run database migrations:
   ```bash
   php spark migrate --all
   ```
3. Generate VAPID keys (run ONCE in production):
   ```bash
   php spark push:keys
   ```
   Copy the output into `wex-api/.env`:
   ```env
   VAPID_PUBLIC_KEY="..."
   VAPID_PRIVATE_KEY="..."
   VAPID_SUBJECT="mailto:support@wex.sd"
   FCM_ENABLED=false
   ```
   > **Warning**: Rotating VAPID keys invalidates **all** existing Web Push subscriptions. Users would need to re-subscribe.

4. Configure Cron (shared hosting / Linux crontab):
   ```cron
   * * * * * cd /path/to/wex-api && php spark push:work >> /dev/null 2>&1
   * * * * * cd /path/to/wex-api && php spark orders:expire >> /dev/null 2>&1
   * * * * * cd /path/to/wex-api && php spark push:reminders >> /dev/null 2>&1
   ```
5. **CORS**: Ensure `wex.corsAllowedOrigins` in `wex-api/.env` includes the exact HTTPS storefront origin (e.g. `https://wex.sd`).

---

## 2. Frontend Deployment (`wex-web`)

1. **HTTPS Requirement**: Web Push (`PushManager` + Service Worker) strictly requires **HTTPS** in production (`http://localhost` works for local dev only).
2. **Service Worker Scope & Cache-Busting**:
   - `vite-plugin-pwa` uses `strategies: 'injectManifest'` with `src/sw.js` and `registerType: 'autoUpdate'`.
   - `sw.js` is served at `/sw.js` with scope `/`.
   - Configure your web server (Nginx/Apache `.htaccess`) so `/sw.js` is served with `Cache-Control: no-cache, no-store, must-revalidate` so returning users always receive the updated Service Worker immediately.

---

## 3. Device Testing Guide

### Android Chrome
1. Open `https://wex.sd` in Chrome and log in.
2. Place an order -> on Order Detail page, tap **تفعيل الإشعارات** in the pre-permission card and allow.
3. From Account -> Settings -> الإشعارات, tap **إرسال إشعار تجريبي** and verify notification arrives.

### Desktop Chrome / Edge
1. Log in as admin or customer.
2. Allow notifications from the Admin Dashboard banner or Account -> Settings -> الإشعارات.
3. Minimize or unfocus the browser window and send a test push -> verify OS notification appears and clicking it focuses/navigates to the target page.

### iPhone / iPad (iOS 16.4+ Safari PWA)
1. Open `https://wex.sd` in **Safari** (not Chrome/in-app browser).
2. Tap the **Share** button -> **إضافة إلى الشاشة الرئيسية (Add to Home Screen)**.
3. Launch the installed **Wex** app from the home screen and log in.
4. Go to Account -> Settings -> الإشعارات (or Order Detail) and tap **تفعيل الإشعارات** -> Allow.

---

## 4. 5-Minute Manual Smoke Checklist (10 Steps)

1. `GET /api/v1/push/config` returns `enabled: true` and a non-empty `webPushPublicKey`.
2. Log in as customer -> Account -> Settings -> الإشعارات -> enable push on device -> device appears in **الأجهزة المسجلة**.
3. Tap **إرسال إشعار تجريبي** -> notification arrives (or Toast if app is focused).
4. Place a new order -> admin receives `admin_new_order` push; customer receives `order_created` push + in-app row.
5. Upload payment proof -> admin receives `admin_receipt_uploaded`; customer receives `payment_proof_uploaded`.
6. Admin rejects proof with a reason -> in-app notification shows reason; push says `"يرجى مراجعة الطلب"` (no sensitive data).
7. Admin approves proof -> customer receives `payment_approved` push; clicking it opens `/orders/:orderNumber` and marks it read.
8. Admin toggles global `push_enabled` OFF -> sending test or order update creates in-app row only, zero push sends.
9. Admin toggles `push_enabled` ON and sends a broadcast -> targeted customers receive it.
10. Customer logs out -> subscription is removed from `push_subscriptions`.
