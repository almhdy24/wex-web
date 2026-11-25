# Wex Push Notification System — Discovery & Architecture Design

## 1. Phase 0 Discovery Findings

### 1.1 Existing In-App Notification System (`wex-api` & `wex-web`)
- **Database (`wex-api`)**: `notifications` table (`id`, `user_id`, `type`, `title`, `body`, `order_id`, `read_at`, `created_at`).
- **Service & Controller**: `App\Services\NotificationService::notify()` inserts a row into `notifications` and optionally enqueues an email via `MailService`. `NotificationController` exposes:
  - `GET /api/v1/notifications`
  - `GET /api/v1/notifications/unread-count`
  - `PATCH /api/v1/notifications/{id}/read`
  - `POST /api/v1/notifications/mark-all-read`
- **Frontend (`wex-web`)**: `src/api/notifications.js`, `src/pages/store/NotificationsPage.jsx`, and unread count badges in `DesktopHeader.jsx`, `AppBar.jsx`, `BottomTabBar.jsx`, `AccountPage.jsx`, and `StoreLayout.jsx`.

### 1.2 Service Worker & PWA Setup (`wex-web`)
- `vite.config.js` uses `vite-plugin-pwa` with default `generateSW` strategy, `registerType: 'autoUpdate'`, and `workbox.runtimeCaching`:
  - `NetworkOnly` for `/admin`, `/me`, `/orders`, `/payment-proof`.
  - `StaleWhileRevalidate` for `/api/v1/products`, `/api/v1/categories`, `/api/v1/brands`, and `/uploads/products/`.
  - `NetworkFirst` for `/api/v1/shop`.
- `PwaPrompt.jsx` manages `beforeinstallprompt`, iOS Safari standalone detection (`!window.navigator.standalone`), offline banner, and SW update reload.
- `src/__tests__/pwa-workbox.test.js` asserts manifest properties, `index.html` meta tags, and `vite.config.js` Workbox caching rules.
- **Migration plan**: Switch `VitePWA` to `strategies: 'injectManifest'` with `srcDir: 'src'`, `filename: 'sw.js'`, preserving all Workbox precaching and runtime caching rules inside `src/sw.js` while adding `push`, `notificationclick`, and `pushsubscriptionchange` handlers.

### 1.3 Order State Machine & Triggers (`wex-api`)
- `OrderStateMachine.php` defines legal transitions across `pending_payment`, `payment_review`, `confirmed`, `ready_for_pickup`, `out_for_delivery`, `completed`, `cancelled`, `expired`.
- `OrderService.php` and `PaymentProofService.php` already call `NotificationService::notify()` on `order_created`, `order_expired`, `order_confirmed`, `order_ready_pickup`, `order_out_delivery`, `order_completed`, `payment_proof_uploaded`, `payment_approved`, and `payment_rejected`.
- `OrdersExpire.php` (`php spark orders:expire`) runs every minute via cron to expire overdue `pending_payment` orders.

### 1.4 Admin Sound Alert & Favorites
- `AdminShell.jsx` and `AdminDashboardPage.jsx` implement a Web Audio API sound alert when pending/unread counts increase. Push notifications will complement this feature without replacing it.
- `FavoritesContext.jsx` in `wex-web` stores favorites in `localStorage` only; `wex-api` has no server-side `favorites` table. Therefore, server-side back-in-stock and price-drop push notifications for favorited products are skipped and documented as a future enhancement if server-side favorites are added.

---

## 2. Target Architecture

### 2.1 Single Source of Truth
Push is a **delivery channel** layered on top of `NotificationService`:
1. Every notification event creates an in-app `notifications` row first (including `data_json` for deep links/order metadata and `channel_flags`).
2. `PushService` checks the global kill switch (`push_enabled` setting), user `notification_preferences`, actor exclusion, and stale-event guards.
3. For each active subscription in `push_subscriptions`, a `push_outbox` row is enqueued.
4. Up to 20 outbox rows are attempted inline with a short timeout; remaining rows and retries are processed by `php spark push:work` (exponential backoff, max 5 attempts).

### 2.2 Database Schema (`wex-api`)
- **`push_subscriptions`**: `id`, `user_id` (nullable), `platform` (`web|android|ios`), `provider` (`webpush|fcm`), `endpoint_or_token`, `endpoint_hash` (unique SHA-256 index for MySQL/SQLite compatibility on long URLs/tokens), `keys_json`, `device_label`, `user_agent`, `locale`, `app_version`, `topics_json`, `is_active`, `last_success_at`, `last_failure_at`, `failure_count`, `created_at`, `updated_at`.
- **`notification_preferences`**: `id`, `user_id` (unique), `order_updates`, `payment_updates`, `price_alerts`, `announcements`, `new_orders`, `receipts`, `low_stock`, `created_at`, `updated_at`.
- **`push_outbox`**: `id`, `notification_id`, `subscription_id`, `status` (`pending|sent|failed|expired`), `attempts`, `next_attempt_at`, `error`, `created_at`, `sent_at`.
- **`notifications` (extended)**: add `data_json` (TEXT nullable), `channel_flags` (VARCHAR(100) nullable).

### 2.3 Provider Abstraction (Web Push + Flutter FCM)
- `App\Services\Push\PushProviderInterface`: `send(PushSubscription $sub, array $payload): PushResult`.
- `WebPushProvider`: `minishlink/web-push` with VAPID keys from `.env` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- `FcmProvider`: Full FCM HTTP v1 implementation (service account JSON from `FCM_SERVICE_ACCOUNT_PATH`, OAuth2 JWT assertion token cached in CI4 cache, token & topic sends), disabled by default unless `FCM_ENABLED=true`.
- `FakeProvider`: Records sent payloads in memory / `writable/logs/fake_push.jsonl` for unit tests and CI E2E verification.

### 2.4 Security, Privacy & Copy Rules
- **Arabic (MSA) only**: All titles, bodies, and UI strings in Modern Standard Arabic (`dir: 'rtl'`, `lang: 'ar'`), centralized in `app/Config/PushTemplates.php` (backend) and `src/content/` (frontend).
- **No sensitive data in push payloads**: Never include bank account numbers, phone numbers, receipt images, AED/exchange rates, or admin names. Rejection reasons stay in-app only; push says `"يرجى مراجعة الطلب"`.
- **Relative deep links**: Only relative paths (`/orders/:orderNumber`, `/admin/orders/:orderNumber`, `/notifications`, `/products`) are sent and validated against same-origin on click.
- **Auth & Re-binding**: Registration requires authentication. Upsert by `endpoint_hash` re-binds the subscription to the current `user_id` on login on shared devices; logout deletes/deactivates the device subscription.
