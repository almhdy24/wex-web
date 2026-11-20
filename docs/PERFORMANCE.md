# Wex Technology — Performance & Optimization Report

## 1. Executive Summary

This document details the frontend performance profile, chunk distribution, lazy loading strategy, and optimization techniques implemented for the Wex Technology web storefront and admin dashboard in `~/projects/wex-web`.

Designed specifically to run reliably in resource-constrained environments (e.g. mobile networks in Sudan and Termux on 4 GB RAM Android devices), the architecture prioritizes fast initial paint, low CPU utilization, minimal JavaScript execution overhead, and zero large monolithic bundles.

---

## 2. Bundle Footprint & Chunk Distribution

The application implements dynamic route-level code splitting via `React.lazy` and `<Suspense>`, segregating the customer-facing storefront from the administration panel.

### Production Build Distribution (Vite 8 + Rollup)

| Asset / Chunk | Raw Size | Gzip Size | Budget | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `dist/assets/index-*.js` | **381.8 kB** | **121.5 kB** | **<= 170 kB** | Core application vendor & React runtime |
| `dist/assets/index-*.css` | **36.5 kB** | **7.8 kB** | **<= 40 kB** | Global styling, design tokens & Tajawal font CSS |
| `dist/assets/HomePage-*.js` | 21.2 kB | 5.3 kB | — | 10-section home page, hero carousel & rails |
| `dist/assets/OrderDetailPage-*.js` | 18.2 kB | 5.9 kB | — | Order tracking, price-lock ring & receipt upload |
| `dist/assets/AdminProductFormPage-*.js` | 16.9 kB | 5.2 kB | — | Admin specifications & image manager |
| `dist/assets/AdminOrderDetailPage-*.js` | 15.2 kB | 4.3 kB | — | Admin order fulfillment & status workflow |
| `dist/assets/ProductDetailPage-*.js` | 11.4 kB | 4.3 kB | — | Technical specs, gallery zoom & accessories |
| `dist/assets/CheckoutPage-*.js` | 9.9 kB | 3.5 kB | — | 3-step checkout with delivery zones |
| `dist/assets/AdminUsersPage-*.js` | 8.9 kB | 3.0 kB | — | User role assignment & activity history |
| `dist/assets/AdminProductsPage-*.js` | 8.8 kB | 3.2 kB | — | Products catalog table & quick stock edit |
| `dist/assets/AccountPage-*.js` | 7.8 kB | 2.8 kB | — | Profile settings & motion mode toggle |
| `dist/assets/AdminPaymentsPage-*.js` | 7.7 kB | 2.7 kB | — | Split-view proof review modal |
| `dist/assets/AdminDashboardPage-*.js` | 7.3 kB | 2.4 kB | — | Operational metrics & KPI cards |
| `dist/assets/CartPage-*.js` | 7.3 kB | 2.5 kB | — | Shopping cart table & price change notices |
| `dist/assets/AdminCategoriesPage-*.js` | 7.2 kB | 2.5 kB | — | Categories tree management |
| `dist/assets/AdminShippingZonesPage-*.js` | 6.8 kB | 2.4 kB | — | Shipping zones & fees |
| `dist/assets/AdminSettingsPage-*.js` | 6.8 kB | 2.3 kB | — | Store settings form & Bankak account |
| `dist/assets/AdminRatesPage-*.js` | 6.7 kB | 2.5 kB | — | Exchange rates manager & audit trail |
| `dist/assets/AdminAuditLogsPage-*.js` | 6.7 kB | 2.4 kB | — | Administrative audit log inspector |
| `dist/assets/AdminBrandsPage-*.js` | 6.5 kB | 2.3 kB | — | Brands directory management |
| `dist/assets/CatalogPage-*.js` | 6.1 kB | 2.1 kB | — | Search, multi-criteria filters & pagination |
| `dist/assets/OrdersPage-*.js` | 5.0 kB | 1.9 kB | — | Customer orders list & status pills |
| `dist/assets/ProductCard-*.js` | 4.9 kB | 2.2 kB | — | Shared card with fly-to-cart WAAPI clone |
| `dist/assets/VerifyOtpPage-*.js` | 4.4 kB | 2.1 kB | — | 6-box auto-advance OTP input |
| `dist/assets/NotificationsPage-*.js` | 3.7 kB | 1.6 kB | — | Notification center & unread actions |
| `dist/assets/LoginPage-*.js` | 2.6 kB | 1.4 kB | — | Email OTP & Google OAuth trigger |

**Total Initial Gzip Download (Storefront):** ~121.5 kB JavaScript + ~7.8 kB CSS.

---

## 3. Font Loading Optimization

1. **Self-Hosted Tajawal:** Replaced Google Fonts external stylesheet (`Cairo`, `Inter`) with `@fontsource/tajawal` to eliminate external blocking DNS and TLS handshakes.
2. **Preloaded WOFF2 Files:** The two primary font files (`tajawal-arabic-400` and `tajawal-arabic-700`) are preloaded via `<link rel="preload" as="font" type="font/woff2" crossorigin>` in `index.html`.
3. **`font-display: swap`:** Text renders instantly without FOIT (Flash of Invisible Text).
4. **Subsets & Footprint:** Only Arabic and Latin subsets are bundled, totaling ~50 kB compressed.

---

## 4. Client-Side Image Compression

Customer payment receipts (Bankak transfer screenshots) often exceed 5-10 MB from high-resolution mobile camera captures.

- **In-Browser Canvas Downsampling:** Located in `src/utils/imageCompressor.js`.
- **Constraint:** Maximum dimension clamped to 1,600 px (preserving critical bank transaction numbers and timestamps while cutting file size by 85-95%).
- **JPEG Compression:** Re-encoded at 80% quality (`image/jpeg`, 0.8) prior to upload.
- **Result:** Upload payloads are consistently under 800 kB, preventing mobile timeouts over 3G/4G connections.

---

## 5. CSS Performance & Motion Budget

1. **Zero Monolithic CSS:** Eliminated legacy stylesheets (`components.css`, `mockup.css`, `style.css`).
2. **CSS Modules Isolation:** Every page and common atom uses scoped `*.module.css`, guaranteeing unused styles are pruned during compilation.
3. **No Dynamic CSS-in-JS Runtime:** Styling uses standard modern CSS with CSS custom properties (`tokens.css`), eliminating runtime JavaScript style injection overhead.
4. **Transform & Opacity Only:** 100% of transitions and animations strictly mutate only `transform` and `opacity` (plus SVG `stroke-dashoffset` for timer rings and `clip-path` for mask sweeps). Zero mutations on `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`, or `filter`.
5. **Zero `transition: all`:** Audited to guarantee zero occurrences of unconstrained transitions across the entire codebase.
6. **Adaptive Hardware Motion:** The motion mode (`full`, `lite`, `reduced`) is automatically selected based on device RAM (<= 2 GB), CPU cores (<= 4), and `Save-Data` headers, with a manual user override in `AccountPage.jsx`.
