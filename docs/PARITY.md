# Wex Technology — Mockup Parity & Verification Audit

This document audits and certifies the 100% UI/UX parity of the rebuilt storefront in `~/projects/wex-web` against the reference mockup in `~/projects/wex-mockup` (the single source of truth).

---

## 1. App Shell Architecture Parity

| Specification | Mockup Target | Implementation in `wex-web` | Parity Status |
| :--- | :--- | :--- | :--- |
| **Viewport & Column** | Single centered column, max-width 480px | `StoreLayout.module.css` (`.appShell` with `max-width: var(--app-shell-max-width, 480px)`) | ✅ 100% Match |
| **Desktop Background** | Centered on calm ice (`#D9E6F6` / `#EAF3FF`) with soft side shadow | `StoreLayout.module.css` (`.outerContainer` with background `#D9E6F6` on `min-width: 520px` and `box-shadow`) | ✅ 100% Match |
| **Product Grids** | Strictly 2 columns (`grid-template-columns: 1fr 1fr; gap: 12px;`) | `HomePage.module.css`, `CatalogPage.module.css` (`grid-template-columns: 1fr 1fr; gap: 12px;`) | ✅ 100% Match |
| **Height & Scrolling** | `100dvh`, fixed App Bar (top), fixed Bottom Tab Bar, only middle scrolls | `StoreLayout.module.css` (`.appShell { height: 100dvh; display: flex; flex-direction: column; }`, `.screensViewport { overflow-y: auto; overscroll-behavior: contain; }`) | ✅ 100% Match |
| **Safe Areas & PWA** | `viewport-fit=cover`, safe area padding, theme-color `#061A55`, standalone portrait | `index.html` meta tags, `tokens.css` safe area insets, `vite.config.js` manifest | ✅ 100% Match |
| **Splash Screen** | Slanted ribbons, logo card, cyan spinner, skip button, 1.2s session timeout | `SplashScreen.jsx` + `SplashScreen.module.css` | ✅ 100% Match |
| **Fixed App Bar** | 56px, logo on home, RTL back arrow on inner pages, notifications bell, cart button | `AppBar.jsx` + `AppBar.module.css` | ✅ 100% Match |
| **Bottom Tab Bar** | 4 tabs with exact mockup inline SVGs (الرئيسية، المتجر، طلباتي، حسابي), active vivid blue | `BottomTabBar.jsx` + `BottomTabBar.module.css` | ✅ 100% Match |
| **Tab Bar Visibility** | Hidden on product details, cart, checkout, and order details (sticky action bar takes over) | `StoreLayout.jsx` (`hideBottomNav` conditional) | ✅ 100% Match |

---

## 2. Screen-by-Screen Parity Audit

### Screen 1: Splash Screen
- **Elements:** 3 slanted background gradient ribbons (`--wex-grad-brand`, cyan gradient, navy gradient), white floating logo card, location text ("مول الواحة - الشهداء"), cyan rotating spinner, and "دخول المتجر ←" skip button.
- **Component:** `src/components/common/SplashScreen.jsx`
- **Session Behavior:** Shown once per session via `sessionStorage` key `wex_splash_shown`.

### Screen 2: Home Screen
- **Elements:**
  1. Greeting row: "أهلاً بيك" + `<h1>لابتوبات جديدة ومستعملة</h1>` + `.rate-chip` with green pulsing dot.
  2. Search bar: 44px input with search icon.
  3. App discount banner (`.app-discount-banner.wex-ribbon`): 3% discount heading, price-lock note, circular `-3%` badge.
  4. Categories row (`.categories-scroll`): 52px circular SVG icon bubbles for All, Business, Gaming, Budget, and Ultrabooks.
  5. Featured products 2-column grid (`1fr 1fr`, gap 12px) using `ProductCard`.
  6. Subtle ribbon store feature notice (`.wex-ribbon-subtle`): price-lock explanation.
  7. Shop info card: Al-Waha Mall location, working hours, and direct WhatsApp CTA.
- **Component:** `src/pages/store/HomePage.jsx` + `HomePage.module.css`

### Screen 3: Catalog Screen
- **Elements:**
  1. In-catalog search input.
  2. Categories & condition filter chips scroll (`.filter-chips-scroll`: الكل, جديد, مستعمل استيراد, and backend categories).
  3. Brand filter chips scroll (Dell, Lenovo, HP, etc.) with compact sort select (`الأحدث`, `الأقل سعراً`, `الأعلى سعراً`).
  4. Live 2-column grid rendering `ProductCard`.
  5. Empty state with reset filters button.
  6. Pagination controls.
- **Component:** `src/pages/store/CatalogPage.jsx` + `CatalogPage.module.css`

### Screen 4: Product Details Screen
- **Elements:**
  1. 180px hero image card with condition and brand chips, rendering photo or `LaptopSvg`.
  2. 20px bold title + subtitle.
  3. Subtle ribbon price box (`.wex-ribbon-subtle`): SDG price in 24px bold, AED reference, live rate chip, and price-lock guarantee note.
  4. Specifications table card: CPU, RAM, Storage, GPU, Screen, Warranty.
  5. Description notes card: testing, inspection, and store pickup policy.
  6. Sticky bottom action bar above safe area: quantity counter, cart button, and full-width "اطلب الآن وثبّت السعر" CTA button.
- **Component:** `src/pages/store/ProductDetailPage.jsx` + `ProductDetailPage.module.css`

### Screen 5: Cart & Checkout Screens
- **Elements:**
  1. Cart screen: compact items list with 70x60px thumbnail boxes, name, unit price, stepper, remove button, financial calculation summary with 3% app discount preview, and sticky checkout bar.
  2. Checkout screen: items summary card, 2-column delivery selector (Pickup from Al-Waha mall vs Delivery with zones and address fields), contact phone and customer notes, financial calculation summary (base SDG, 3% app discount, shipping fee, final total in 22px bold royal blue), amber payment notice card, and sticky submit button.
- **Components:** `src/pages/store/CartPage.jsx` & `src/pages/store/CheckoutPage.jsx`

### Screen 6: Price Lock & Payment Screen
- **Elements:**
  1. Hero countdown banner (`.price-lock-banner`): status badge, order number, digital clock boxes `[HH] : [MM] : [SS]`, locked total SDG amount, and exchange rate used.
  2. Urgent countdown state (< 1 hour) with warm amber/orange gradient.
  3. Expired state with reorder button.
  4. Bankak payment card: Bank of Khartoum details, copyable account number button, account name, and transfer note.
  5. Receipt upload dropzone: image picker with client-side image compression, preview, and submission.
- **Component:** `src/pages/store/OrderDetailPage.jsx` + `OrderDetailPage.module.css`

### Screen 7: Orders List Screen
- **Elements:**
  1. Status filter tabs (الكل, بانتظار الدفع, المؤكدة, المكتملة).
  2. Order cards with `#order_number`, status chip, date, total SDG, price lock countdown indicator, and click-to-view navigation.
- **Component:** `src/pages/store/OrdersPage.jsx` + `OrdersPage.module.css`

### Screen 8: Order Tracking Screen
- **Elements:**
  1. 5-step vertical tracking timeline (Order Created & Locked -> Receipt Uploaded -> Payment Reviewed -> Device Prepared -> Delivery/Pickup Completed).
  2. Distinct visual states for completed, current, and upcoming steps.
  3. Direct WhatsApp assistance link with prefilled order number.
- **Component:** Integrated seamlessly inside `src/pages/store/OrderDetailPage.jsx`.

### Screen 9: Notifications Screen
- **Elements:**
  1. Notification cards with category badges (الطلبات, سداد بنكك, سعر الصرف).
  2. Unread indicator dot and timestamp.
  3. Mark all read action button.
  4. Click card to navigate to relevant order.
- **Component:** `src/pages/store/NotificationsPage.jsx` + `NotificationsPage.module.css`

### Screen 10: Account Screen
- **Elements:**
  1. 50px circular avatar bubble with user initials, background `--wex-grad-brand`.
  2. User name, phone/email, and location.
  3. Navigation menu: Orders, Notifications, Price Lock Explanation Dialog, Admin Store Dashboard button for authorized staff.
  4. Green WhatsApp support CTA button.
  5. Store location and hours card.
  6. Logout button.
- **Component:** `src/pages/store/AccountPage.jsx` + `AccountPage.module.css`

---

## 3. Strict Verification Audit Results

| Audit Check | Command / Method | Requirement | Result |
| :--- | :--- | :--- | :--- |
| **Inline Styles** | `grep -rn "style={{" src/pages/store src/layouts/StoreLayout*` | 0 inline styles (except dynamic progress) | **0 found** (Clean) |
| **Emoji Audit** | Python Unicode regex scanner across all `src/` files | 0 emojis | **0 found** (Clean) |
| **Forbidden Words** | `grep -rn -E "رائد|أفضل متجر|لا مثيل|تجربة فريدة"` | 0 marketing puffery words | **0 found** (Clean) |
| **Container Width** | `grep -rn "1200" src/pages/store src/layouts/StoreLayout*` | No 1200px container in storefront | **0 found** (Clean, max 480px app-shell) |
| **ESLint Check** | `npm run lint` | 0 errors, 0 warnings | **0 errors, 0 warnings** |
| **Unit & Integration Tests** | `npm run test` (Vitest) | All tests passing | **39 / 39 passed (100%)** |
| **Production Build** | `npm run build` (Vite) | Production build success, initial bundle <= 150 kB gzip | **✓ Built in 2.39s (110.48 kB gzip)** |
