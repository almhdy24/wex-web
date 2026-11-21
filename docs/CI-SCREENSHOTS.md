# CI Multi-Viewport Visual & Layout Testing

This document details the automated visual regression and layout validation infrastructure configured for Wex Technology (`wex-web`).

---

## 1. Overview & Constraints

To strictly adhere to system constraints (Termux environment with limited 4 GB RAM, zero browser processes locally), visual rendering, screenshot capture, and multi-viewport regression checks run exclusively in **GitHub Actions CI**.

The workflow is defined in `.github/workflows/ui-check.yml` and orchestrated via `scripts/ci-ui-check.mjs` using Playwright Chromium in headless mode on Ubuntu runners.

---

## 2. Target Viewports

Every storefront and admin page is rendered and tested across 4 distinct device form factors:

| Viewport Name | Resolution | Device Target | Purpose |
| :--- | :--- | :--- | :--- |
| `android-360x800` | 360 × 800 | Budget Android (Samsung Galaxy A-series) | Minimum supported mobile width; tests compact wrapping, tab-bar clearance, stacked cards |
| `iphone-390x844` | 390 × 844 | Modern iOS (iPhone 13 / 14 / 15) | Standard mobile iOS layout with safe-area bottom inset |
| `ipad-768x1024` | 768 × 1024 | Tablet Portrait (iPad Air / Mini) | Medium tablet breakpoint, navigation rail / bottom bar transition |
| `laptop-1280x800` | 1280 × 800 | Desktop / Laptop Screen | Full desktop sidebar layout, grid alignment, table displays |

---

## 3. Automated Assertions

For every route and viewport, the runner evaluates:
1. **Zero Console Errors**: Traps `console.error` and unhandled window errors. Any error halts the build with a descriptive error trace.
2. **Horizontal Overflow Guarantee**: Asserts `document.documentElement.scrollWidth <= window.innerWidth`. Any element causing horizontal scroll on the viewport fails the build immediately.
3. **Full-Page Screenshot Capture**: Captures complete vertical scroll area to `.png` images and organizes them by viewport directory.

---

## 4. Routes Matrix

The visual check captures full-page snapshots for 30 distinct routes:

### Storefront Routes
- `store-home.png` (`/`)
- `store-catalog.png` (`/catalog`)
- `store-cart.png` (`/cart`)
- `store-checkout.png` (`/checkout`)
- `store-orders.png` (`/orders`)
- `store-favorites.png` (`/favorites`)
- `store-compare.png` (`/compare`)
- `store-faq.png` (`/faq`)
- `store-about.png` (`/about`)
- `store-privacy.png` (`/privacy-policy`)
- `store-terms.png` (`/terms`)
- `store-login.png` (`/login`)
- `store-account.png` (`/account`)

### Admin Management Routes
- `admin-dashboard.png` (`/admin`)
- `admin-orders.png` (`/admin/orders`)
- `admin-payments.png` (`/admin/payments`)
- `admin-products.png` (`/admin/products`)
- `admin-rates.png` (`/admin/rates`)
- `admin-settings.png` (`/admin/settings`)
- `admin-shipping-zones.png` (`/admin/shipping-zones`)
- `admin-users.png` (`/admin/users`)
- `admin-categories.png` (`/admin/categories`)
- `admin-brands.png` (`/admin/brands`)
- `admin-announcements.png` (`/admin/announcements`)
- `admin-recent-purchases.png` (`/admin/recent-purchases`)
- `admin-hero-slides.png` (`/admin/hero-slides`)
- `admin-home-sections.png` (`/admin/home-sections`)
- `admin-faq.png` (`/admin/faq`)
- `admin-pages.png` (`/admin/pages`)
- `admin-audit-logs.png` (`/admin/audit-logs`)

Total snapshots generated per CI run: **120 high-resolution PNG images** (30 routes × 4 viewports).

---

## 5. How to Download Screenshots from GitHub Actions

1. Navigate to the repository on GitHub: `https://github.com/<owner>/wex-web`.
2. Click on the **Actions** tab.
3. Select the latest run of the **UI & Visual Regression Check** workflow.
4. Scroll down to the **Artifacts** section at the bottom of the summary page.
5. Click on **`wex-ui-screenshots`** to download the ZIP archive.
6. Extract the archive to inspect screenshots categorized by device folder:
   ```
   screenshots/
   ├── android-360x800/
   │   ├── store-home.png
   │   ├── admin-hero-slides.png
   │   └── ...
   ├── iphone-390x844/
   ├── ipad-768x1024/
   └── laptop-1280x800/
   ```
