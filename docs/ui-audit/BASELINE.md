# WEX Web: UI/UX Audit & Baseline Report (Phase 0)
**Date:** 22 Nov 2026  
**Branch:** stabilize  
**Scope:** Storefront Pages (Catalog, ProductDetail, Cart, Checkout, Orders, OrderDetail, Account) & Design System Foundations

---

## 1. Automated Quality Baseline

| Check | Tool / Script | Status | Metric |
| :--- | :--- | :--- | :--- |
| **Unit & Integration Tests** | Vitest (`npm test`) | ✅ PASS | 44 test files passed, 303 tests passed, 0 failures |
| **Design Token Contrast** | `scripts/check-contrast.mjs` | ✅ PASS | 11/11 token pairs pass WCAG AA standards (>= 4.5:1) |
| **Marketing Claims / Leaks**| `scripts/check-claims.mjs` | ✅ PASS | 0 forbidden claims across 165 source files |
| **i18n Integrity** | `scripts/check-i18n.mjs` | ✅ PASS | 390 keys verified across 146 files, 0 missing |
| **CSS Module Layout** | `scripts/check-layout.mjs` | ✅ PASS | 66 storefront CSS modules passed |
| **Single-Source Messages** | `scripts/check-duplicate-messages.mjs` | ✅ PASS | 0 duplicate journey messages |
| **ESLint** | `npm run lint` | ✅ PASS | 0 errors, 4 warnings (allowed unused vars) |
| **Production Build** | `npm run build` | ✅ PASS | Built in 3.68s, main chunk `index-oDRk5wt3.js` (516.71 kB / 155.33 kB gzip) |

---

## 2. Before-Screenshots Inventory (`docs/ui-audit/before/`)

All 7 required pages captured across 4 target viewports (360x800, 390x844, 768x1024, 1280x800) in RTL:

| Page | 360px | 390px | 768px (Tablet) | 1280px (Desktop) |
| :--- | :--- | :--- | :--- | :--- |
| **Catalog** | `catalog-360.png` | `catalog-390.png` | `catalog-768.png` | `catalog-1280.png` |
| **Product Detail** | `product-detail-360.png` | `product-detail-390.png` | `product-detail-768.png` | `product-detail-1280.png` |
| **Cart** | `cart-360.png` | `cart-390.png` | `cart-768.png` | `cart-1280.png` |
| **Checkout** | `checkout-360.png` | `checkout-390.png` | `checkout-768.png` | `checkout-1280.png` |
| **Orders** | `orders-360.png` | `orders-390.png` | `orders-768.png` | `orders-1280.png` |
| **Order Detail** | `order-detail-360.png` | `order-detail-390.png` | `order-detail-768.png` | `order-detail-1280.png` |
| **Account** | `account-360.png` | `account-390.png` | `account-768.png` | `account-1280.png` |

---

## 3. Shared Primitives Audit Findings

1. **Focus Ring Contrast**:
   - Current: `:focus-visible { outline: 2px solid var(--wex-cyan); }`
   - Cyan (`#00B7FF`) on white card yields 2.3:1 contrast (fails WCAG 2.2 AA non-text contrast requirement of 3:1).
   - Fix in Phase 1: Switch light surface focus ring to `--wex-vivid` (`#1E6BFF`, ~4.6:1 contrast) and reserve cyan for dark surfaces.
2. **Typography & Font Weights**:
   - `global.css` imports `@fontsource/tajawal/arabic-900.css` (unused) and misses `latin-500` / `latin-800`.
   - Prices using weight 800 fall back to synthetic bolding or 700 on Latin numbers.
3. **Modals & Overlays**:
   - `AccountPage` has 3 inline modal overlays (`z-index: 10000`).
   - `OrderDetailPage` has inline receipt preview viewer.
   - `ProductDetailPage` has inline image zoom viewer.
   - None provide complete focus trapping, focus restoration, or aria-labelledby bindings.
   - Consolidate into `Modal` / `Dialog` with an `image` viewer variant.
4. **Price Rendering Inconsistency**:
   - Prices formatted inconsistently via `formatSdg`, inline `.toLocaleString()`, or duplicate `.srOnly` spans.
   - Unified `<Price />` component needed.
5. **AppBar Overlap**:
   - Pages pass arbitrary `--header-bottom` (28px, 36px, 62px, 84px) matched by manual negative margins.
   - Expose explicit `overlap` prop and standardize `--appbar-overlap`.
