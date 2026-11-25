# Admin UI Audit Report (Phase 1 — Run `45552450805`)

Measured across all 19 admin routes (`src/app/adminRoutes.js`) at `320x800`, `360x800`, `412x800`, and `768x800` (76 route/width checks) via `e2e/tests/admin-audit.spec.js`.

---

## 1. Global Root Causes

1. **Global CSS Leaks (`src/styles/global.css` & `src/styles/tokens.css`)**:
   - `body` sets `min-height: 100vh; min-height: 100dvh;` and `AdminShell` + `Page` + individual pages each add their own padding/min-height/tab-bar clearance.
   - Forms in `/admin/settings` (37 inputs) and `/admin/products/new` (40 inputs) override `font-size` below `16px` (`< 16px` triggers iOS Safari auto-zoom).
   - `AdminShell` top bar action buttons (`_mobileSearchBtn`, `_iconBtn`) are `36x36px` (below `44px` minimum touch target).
   - `a.skip-link` is `43px` tall (`< 44px`).
2. **Absolute Positioning & Clipping Inside Cards**:
   - In `/admin/products` (`AdminProductsPage.module.css`), the low-stock badge (`منخفض`) uses `position: absolute`, clipping outside the card edge at `320px`.
   - In `/admin/orders`, order numbers (`#WEX-...`) collide with status chips at `320px` and `completed` renders in English.
3. **Horizontal Overflow**:
   - `/admin` at `320px` overflows horizontally (visible dark navy strip on the left edge in `audit-admin-320.png`).
   - `/admin/recent-purchases` overflows horizontally at `320px` and `360px` (table/wide row not wrapped in card layout on mobile).
4. **Physical `left`/`right` & Mixed `vh` Units**:
   - Legacy admin CSS modules mix `left`/`right` instead of logical `inset-inline-start`/`inset-inline-end` and `100vh` instead of `100dvh`.

---

## 2. Per-Route Measured Summary (`admin-audit-report.json`)

| Route | Overflow Widths | Small Targets | Small Input Fonts | Clipped Text | English UI Text |
|---|---|---|---|---|---|
| `/admin` | `320` | 60 | 1 | 0 | `completed` |
| `/admin/orders` | — | 60 | 1 | 0 | `completed` |
| `/admin/payments` | — | 36 | 1 | 0 | — |
| `/admin/products` | — | 24 | 1 | 9 | — |
| `/admin/categories` | — | 24 | 1 | 0 | — |
| `/admin/brands` | — | 24 | 1 | 0 | — |
| `/admin/rates` | — | 24 | 1 | 0 | — |
| `/admin/shipping-zones` | — | 60 | 1 | 0 | — |
| `/admin/payment-accounts` | — | 60 | 5 | 4 | — |
| `/admin/recent-purchases` | `320, 360` | 30 | 1 | 0 | — |
| `/admin/hero-slides` | — | 60 | 1 | 0 | — |
| `/admin/home-sections` | — | 54 | 1 | 0 | — |
| `/admin/announcements` | — | 33 | 1 | 0 | — |
| `/admin/faq` | — | 60 | 1 | 0 | — |
| `/admin/pages` | — | 60 | 1 | 0 | — |
| `/admin/settings` | — | 36 | 37 | 1 | — |
| `/admin/users` | — | 24 | 1 | 0 | — |
| `/admin/audit-logs` | — | 24 | 1 | 0 | — |
| `/admin/products/new` | — | 60 | 40 | 3 | — |
