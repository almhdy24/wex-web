# Wex Technology — Admin API Gaps & Client Workarounds

This document records all missing or constrained backend API capabilities in `~/projects/wex-api` and the client-side workarounds implemented in `wex-web` to deliver the admin user experience without modifying the backend.

---

## 1. Pending Payments Queue Flattening
- **API State**:
  - `GET /api/v1/admin/orders?status=payment_review` returns an order list without complete proof details (image metadata, customer reference notes, bank account matching details).
  - Detailed payment proof records are only retrievable via `GET /api/v1/admin/orders/:orderNumber`.
  - Payment proof images are streamed as binary via `GET /api/v1/orders/:orderNumber/payment-proof/:proofId/image`.
- **API Gap**: No single endpoint exists to fetch a unified queue of pending payment proofs with remaining lock time, customer details, and proof identifiers.
- **Client Workaround**:
  - The client queries `GET /api/v1/admin/orders?status=payment_review&per_page=50`.
  - The client sorts orders by oldest submission first (`created_at` ascending) to prioritize urgent reviews.
  - The client calculates the remaining price lock countdown from `price_locked_until` (or `created_at + lock_hours`).
  - Upon selecting an item in the queue, the client fetches `GET /api/v1/admin/orders/:orderNumber` and streams the receipt image into a temporary `Blob` object URL, revoking the URL immediately after review or transition.

---

## 2. Multi-Entity Global Search
- **API State**:
  - Search is only supported per entity collection via `GET /api/v1/admin/orders?q=...` and `GET /api/v1/admin/products?q=...`.
- **API Gap**: No unified search endpoint (`GET /api/v1/admin/search?q=...`) exists to query across orders, customers, and product items simultaneously.
- **Client Workaround**:
  - The admin header global search input (`DesktopHeader` / `AdminShell`) runs debounced parallel queries to both `/admin/orders` and `/admin/products`.
  - Results are aggregated and categorized into "الطلبات" (with order number and customer phone) and "المنتجات" (with product thumbnail, title, and stock).
  - Tapping a result navigates directly to `/admin/orders/:orderNumber` or `/admin/products/:id/edit`.

---

## 3. Product Duplication
- **API State**:
  - Products can only be created via `POST /api/v1/admin/products`.
- **API Gap**: No `POST /api/v1/admin/products/:id/duplicate` endpoint exists.
- **Client Workaround**:
  - The client fetches the original product via `GET /api/v1/admin/products/:id`.
  - It generates a duplicate payload: appends " (نسخة)" to the product name, resets stock to 1, sets `is_active: false` (to prevent accidental immediate publishing), strips server-generated fields (`id`, `created_at`, `updated_at`, `images`), and submits to `POST /api/v1/admin/products`.
  - The user is then immediately redirected to edit the newly created cloned product.

---

## 4. Bulk Product Actions
- **API State**:
  - Product mutations (`PATCH /admin/products/:id`, `PATCH /admin/products/:id/stock`, `DELETE /admin/products/:id`) only accept single IDs.
- **API Gap**: No `POST /api/v1/admin/products/bulk` endpoint exists.
- **Client Workaround**:
  - The client executes concurrent requests using `Promise.allSettled` with a live progress indicator.
  - Failures are individually caught, allowing successful items to update while reporting specific errors to the operator.

---

## 5. Exchange Rate Impact Preview
- **API State**:
  - `POST /api/v1/admin/rates` updates the active AED to SDG exchange rate globally.
- **API Gap**: No calculation endpoint exists to preview how a pending rate update will affect catalog prices before committing.
- **Client Workaround**:
  - The client fetches 5 sample active products via `GET /api/v1/admin/products?per_page=5`.
  - The client simulates the new price in SDG: `price_sdg = Math.round((price_aed * new_rate) / rounding_step) * rounding_step` using `rounding_step_sdg` from store settings.
  - The client displays a visual table showing: `اسم الجهاز`, `السعر الحالي (ج.س)`, `السعر الجديد (ج.س)`, and `نسبة التغيير`.

---

## 6. Live Receipts Push & Sound Notifications
- **API State**:
  - The backend is a stateless REST API without WebSocket or Server-Sent Events (SSE) connections.
- **API Gap**: Real-time push notifications for incoming payment proofs are not supported by the backend.
- **Client Workaround**:
  - The client implements a lightweight 30-second polling loop against `GET /api/v1/admin/dashboard`.
  - Polling is automatically suspended when the browser tab is hidden (`document.hidden` via Page Visibility API) to conserve battery and bandwidth.
  - When `pending_reviews_count` increases compared to the previous poll, the client updates the document title (`(N) ويكس - الإدارة`), increments the badge on the Payments bottom tab, and plays a subtle synthesized audio chime via the Web Audio API (if enabled by the user in settings).
