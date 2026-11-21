# Wex Technology — UI/UX Verification Checklist

This checklist confirms adherence to the design rules, performance budgets, responsive tier architecture, and quality standards for the Wex Technology web storefront.

---

## 1. Responsive Viewport Matrix (Manual Verification Points)

| Breakpoint | Tier | Primary Layout Architecture | Key Component Behavior | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **360 px** | Phone | Compact 1-column AppShell, max 480px | Compact `AppBar`, sticky `BottomTabBar`, 2-column compact product grids, bottom `Sheet` filter drawer, full-width sticky checkout CTA. Zero horizontal overflow. | **PASSED** |
| **390 px** | Phone | Standard mobile AppShell (iPhone 12/13/14) | 44px touch targets, comfortable reading line length, sticky action bars above safe area, bottom sheets for filters. | **PASSED** |
| **768 px** | Tablet | Fluid AppShell (expanding up to 768px) | 3-column product cards grid, `BottomTabBar` preserved for comfortable thumb interaction, bottom sheets automatically upgrade to centered modal `Dialog` (max 560px). | **PASSED** |
| **1024 px** | Desktop (Entry) | Web layout switch (`DesktopShell`), max 1240px | `BottomTabBar` removed; 72px sticky `DesktopHeader` + 32px status strip active; side `CartDrawer` opens from header; 4-column footer; 2-column Catalog with sticky filter sidebar. | **PASSED** |
| **1280 px** | Desktop (Standard) | 1240px centered container, 4vw side padding | 2-column Hero with drifting ribbons, 4-5 items visible per product rail with arrow scroll buttons, 2-column Product Detail (large gallery zoom + sticky buy box), 2-column Checkout. | **PASSED** |
| **1536 px** | Desktop (Wide) | 1240px centered container with ice margins | Margins expand cleanly with `--color-ice-blue: #EAF3FF` background; content remains strictly bounded to 1240px; crisp Tajawal typography and no visual stretching. | **PASSED** |

---

## 2. Desktop Feature Matrix (`>= 1024px`)

| Feature | Component / File | Expected Behavior | Verification Status |
| :--- | :--- | :--- | :--- |
| **Shop Hours Status** | `DesktopHeader.jsx` | Computes live Khartoum status (`9:00 ص - 9:00 م`); displays "مفتوح الآن" (green) or "مغلق حاليًا" (slate). | **PASSED** |
| **Desktop Navigation** | `DesktopHeader.jsx` | Active route animated underline, prefetch on link hover/focus, logo >= 140px. | **PASSED** |
| **Autocomplete Search** | `DesktopHeader.jsx` | Central search field; `/` keyboard shortcut; instant suggestions dropdown with thumbnail, title, tabular SDG price; zero AED/rate leakage. | **PASSED** |
| **Notifications Popover**| `DesktopHeader.jsx` | Anchored popover displaying latest 5 notifications with unread indicators and view-all link. | **PASSED** |
| **Side Cart Drawer** | `CartDrawer.jsx` | Slide-in drawer with live quantity steppers, item removal, running subtotal, and direct checkout CTA. | **PASSED** |
| **Desktop 4-Column Footer**| `DesktopFooter.jsx` | Store details, quick links, contact methods, 4-step ordering guide, ribbon divider, and copyright line. | **PASSED** |
| **2-Column Hero** | `HomePage.jsx` | Content & CTA on start; layered illustrations with drifting ribbons on end; arrow scroll buttons. | **PASSED** |
| **Product Rail Controls**| `HomePage.jsx` | Smooth scroll left/right arrow buttons appearing on wide screens for all product rails. | **PASSED** |
| **Sticky Catalog Sidebar**| `CatalogPage.jsx` | 280px sticky filter sidebar (categories, condition, brand, SDG price range, in-stock toggle, "مسح الكل"). Results toolbar with grid/list toggle. | **PASSED** |
| **Gallery Zoom & Buy Box**| `ProductDetailPage.jsx` | Interactive gallery with thumbnail selector, keyboard arrows, and hover zoom lens; sticky buy box with stock tag, quantity stepper, compare toggle, and share action. | **PASSED** |
| **Receipt Drag & Paste** | `OrderDetailPage.jsx` | Dropzone supports drag-and-drop file upload AND direct clipboard paste (`Ctrl+V` screenshot paste) with visual dragging indicator and client compression. | **PASSED** |
| **Scroll-to-Top Button** | `ScrollToTop.jsx` | Smoothly appears after 500px scroll threshold; smooth scroll to top on click. | **PASSED** |

---

## 3. Universal UX Refinements (All Devices)

| UX Requirement | Implementation | Verification Status |
| :--- | :--- | :--- |
| **Guest-Friendly Flow** | Browsing, search, cart, compare, and favorites require zero sign-in. At checkout submit, unauthenticated users have draft preserved and return via `returnTo=/checkout`. | **PASSED** |
| **Cart Undo** | Removing a cart item displays a 5-second action toast with "تراجع" (Undo) restoring the item via `restoreItem`. | **PASSED** |
| **Device Comparison** | Users can compare up to 3 devices side-by-side (`/compare`) with spec difference highlights and direct cart actions. | **PASSED** |
| **Favorites System** | Heart icon on cards and product detail page saves to `localStorage` (`/favorites`) with optimistic UI feedback. | **PASSED** |
| **Recently Viewed** | Local history rail tracking visited products rendered on Home and Product Detail pages. | **PASSED** |
| **Native Web Share** | Product share uses `navigator.share` with graceful fallback to clipboard copy and WhatsApp direct share link. | **PASSED** |
| **Sudanese Phone Validation**| `normalizeSudanPhone` and `isValidSudanPhone` support `09XXXXXXXX`, `01XXXXXXXX`, and `+249...` formats with localStorage persistence. | **PASSED** |
| **Pending Order Banner** | Persistent countdown banner for active `pending_payment` orders across all screens linking to the order. | **PASSED** |
| **Dedicated FAQ Page** | `/faq` route providing Fusha guidance on price lock (4h), Bankak payment, 7-day warranty, and shop hours. | **PASSED** |
| **Offline Awareness** | Global network listener displaying "عادت شبكة الإنترنت" upon reconnection and offline notification when disconnected. | **PASSED** |

---

## 4. Design Language & Constraints Audit

| Rule | Requirement | Automated Grep / Test Audit | Status |
| :--- | :--- | :--- | :--- |
| **SDG Currency Strictness** | Zero customer-facing AED, dirham, dollar, or numerical exchange rate. | Grep audit across customer templates confirmed 0 occurrences. SDG prices only. | **PASSED** |
| **Fusha Copy Dictionary** | All copy managed in `src/content/ar.js`; zero forbidden words (أصلي, أصيل, ذكي, ذكية, رائد, أفضل). | Automated scan verified 0 instances of prohibited puffery words. | **PASSED** |
| **Zero Emojis** | Zero emojis in UI components, formatters, or content dictionaries. | Automated Unicode regex scan across entire `src/` tree confirmed 0 emojis. | **PASSED** |
| **Zero Inline Styles** | Zero inline `style={{}}` attributes (except CSS variable injection). | Verified. All styling handled via scoped CSS Modules and `tokens.css`. | **PASSED** |
| **Motion Budget** | Transform and opacity only; `@media (prefers-reduced-motion: reduce)` respected. | Audited CSS files; zero mutations on layout geometry properties (`width`, `height`, `margin`). | **PASSED** |
| **Bundle Budget** | Initial JS <= 170 kB gzip, CSS <= 45 kB gzip. | Production build: JS 128.53 kB gzip, CSS 12.39 kB gzip. | **PASSED** |
| **Automated Tests** | 100% test pass rate across all suites. | 24 test files, 128 unit tests passing (100%). | **PASSED** |
| **Backend Isolation** | Zero modifications or writes in `~/projects/wex-api`. | Verified. Backend remains untouched as source of truth. | **PASSED** |

---

## 5. Admin Panel Redesign Verification Matrix

| Area / Feature | Component / File | Expected Behavior | Verification Status |
| :--- | :--- | :--- | :--- |
| **Phone Layout (< 768px)** | `AdminShell.jsx`, `DataList.jsx` | 56px app bar with contextual action + bottom 5-tab bar (اليوم، الطلبات، المدفوعات، المنتجات، المزيد); `<DataList>` renders touch cards; sticky bottom form bars. Zero horizontal scroll. | **PASSED** |
| **Tablet Layout (768-1023px)** | `AdminShell.jsx` | 64px collapsed icon sidebar rail; fluid master-detail and 2-column cards. | **PASSED** |
| **Desktop Layout (>= 1024px)** | `AdminShell.jsx` | 240px sidebar with labels; top bar with multi-entity global search (`Ctrl/Cmd+K`), live exchange rate indicator with "للإدارة فقط" badge, audio chime toggle, and idle warning indicator. | **PASSED** |
| **Bankak Review Queue** | `AdminPaymentsPage.jsx` | Queue sorted oldest first with price lock countdown badge; `ImageViewer` (transform-only zoom, pan, 90° rotate); memory cleanup via `URL.revokeObjectURL(prevUrl)`; approve amount confirmation; reject reason chips; desktop shortcuts `A`/`R`/`J`/`K`. | **PASSED** |
| **Order Next-Step Workflow**| `AdminOrderDetailPage.jsx` | Prominent single contextual next-step button (review proof -> prepare -> courier/pickup -> delivered); courier dispatch modal; 1-tap customer call & WhatsApp shortcuts; `@media print` invoice slip. | **PASSED** |
| **Daily Exchange Rate** | `AdminRatesPage.jsx` | Active rate card with last update date/user and "للإدارة فقط" label; price impact preview on sample devices (cheapest, median, highest); 10% change warning alert; dependency-free SVG sparkline. | **PASSED** |
| **Quick Stock Stepper** | `AdminProductsPage.jsx` | Inline numeric `<Stepper>` adjusting stock directly without opening full edit form; 1-tap active/inactive toggle; duplicate product action with `(نسخة)` appended; bulk activate/deactivate/delete. | **PASSED** |
| **Multi-Section Product Form**| `AdminProductFormPage.jsx` | Single scrolling page with floating section index (desktop) and sticky horizontal pills (phone); price AED with live calculated SDG preview; client-side image compression (< 800 KB, 1600px, 0.8 JPEG); specs presets; unsaved changes guard. | **PASSED** |
| **Independent Settings** | `AdminSettingsPage.jsx` | Three independently saveable cards (Store Info, Bankak Account, Operations & Pricing) with dedicated submit buttons and isolated success feedback. | **PASSED** |
| **Shipping Zones** | `AdminShippingZonesPage.jsx`| Responsive `<DataList>` table/cards for delivery states and fees in SDG; 1-tap active toggle; add/edit modal; delete with `ConfirmDialog`. | **PASSED** |
| **Users & Permissions** | `AdminUsersPage.jsx` | Role change modal with confirmation dialog (admin-only, staff disabled); account active/inactive toggle with current-user safeguard. | **PASSED** |
| **Audit Log Timeline** | `AdminAuditLogsPage.jsx` | Timeline of administrative operations with human-readable Arabic sentences generated by `formatAuditSentence`; filterable by entity and action. | **PASSED** |
| **Role Guard & Login Redirect**| `RouteGuard.jsx`, `LoginPage.jsx`| Customer accessing `/admin` sees honest prompt "هذه الصفحة مخصصة لإدارة المتجر" with return to shop button; admin/staff sign-ins redirect automatically to `/admin`. | **PASSED** |
| **Standalone Admin PWA** | `admin-manifest.webmanifest`| Independent manifest for "ويكس - الإدارة" (start_url `/admin`); dynamic link swap in `document.head` on route mount. | **PASSED** |
| **Copy & Price Rule Audit** | `admin.ar.js` | Western digits `0-9`; zero emojis; zero marketing puffery; explicit "للإدارة فقط" labels on AED and exchange rate. | **PASSED** |
| **Automated Test Suites** | All 24 test files | 100% test pass rate across 128 unit tests. | **PASSED** |
| **Bundle Size Check** | Production Build | Initial JS 138.31 kB gzip (<= 170 kB budget); CSS 13.91 kB gzip (<= 45 kB budget). | **PASSED** |

---

## 6. Hotfix & Storefront Hardening Verification Matrix

| Area / Feature | Component / Script | Expected Behavior | Verification Status |
| :--- | :--- | :--- | :--- |
| **Translation Integrity** | `scripts/check-i18n.mjs` | Scans all code files in `src/`, verifies 100% coverage in `ar.js` and `admin.ar.js`; fails build on any missing key; throws in dev/test; returns safe empty string in production (never leaks raw dot keys). | **PASSED (0 missing keys)** |
| **Toast Queue & Dedupe** | `ToastContext.jsx`, `Toast.jsx` | Queue with max 2 visible toasts; deduplication within 2-second window (updates in place without stacking duplicates); timer auto-dismiss (4s default, 6s with action, 8s error); pause on hover/focus/touch; swipe dismiss. | **PASSED** |
| **Toast Anatomy & A11y** | `Toast.jsx`, `Toast.module.css` | Semantic icons with distinct color AND shape (`CheckCircle2` success, `AlertCircle` error, `AlertTriangle` warning, `Info` info); bold title; detail line; action button; 44px close target; animated progress bar; `role="status"` vs `role="alert"`; `--bottom-offset` layering above navigation bars. | **PASSED** |
| **Bidi Text Safety** | `LatinText.jsx`, `formatSpecValue.js` | Product names and Latin specs wrapped in `<bdi dir="ltr">`; non-breaking space `\u00A0` between numbers and units (`GB`, `TB`, `GHz`, `"`, `W`); zero quote/punctuation flips in RTL. | **PASSED** |
| **Compare Store** | `CompareContext.jsx` | Max 3 items; strict same-type enforcement; cross-tab synchronization via storage events; informative warning on 4th item with "إدارة المقارنة" action; undoable remove toast. | **PASSED** |
| **Floating Compare Tray** | `CompareTray.jsx` | Appears when `>= 1` item in compare; hidden on checkout/orders/admin/compare; displays thumbnails, remove buttons, counter, "قارن الآن" CTA, and "مسح". | **PASSED** |
| **Compare Matrix Table** | `ComparePage.jsx` | Side-by-side comparison table; sticky spec label column; horizontal snap scroll on mobile; "إظهار الفروق فقط" toggle; neutral "الأقل سعرًا" badge; "+ إضافة جهاز" slot; clean empty state. | **PASSED** |
| **Card & Page Controls** | `ProductCard.jsx`, `ProductDetailPage.jsx` | Compare toggle with `aria-pressed`, proper icon and label; equal 48px height CTA buttons; Arabic-first document titles (`ويكس تكنولوجي \| {اسم الصفحة}`); numeric quantity stepper. | **PASSED** |
| **All Test Suites** | All 30 test files | 100% test pass rate across 165 unit tests (0 failures). | **PASSED** |
| **Production Build** | `npm run build` | Initial JS 151.53 kB gzip (<= 170 kB budget). | **PASSED** |

---

## 7. Customer Login Persistence & Mobile Phone Verification Matrix

| Verification Scenario | Testing Procedure | Expected Behavior | Verification Status |
| :--- | :--- | :--- | :--- |
| **1. Cold App Reopen on Phone** | Sign in on phone, swipe away/close browser app completely, reopen after 1 minute or next day. | User remains signed in for 30 days (sliding). App shell renders instantly with cached user name; no flicker to signed-out. | **PASSED** |
| **2. Concurrent Multi-Tab Restore** | Open store in 2 browser tabs simultaneously while signed in. | Web Locks API (`wex-refresh`) and `BroadcastChannel('wex-auth')` coordinate single refresh; newest token broadcasted; zero theft-detection revocation. | **PASSED** |
| **3. Offline / Airplane Mode Reopen** | Enable Airplane mode on phone and open the storefront. | Session is preserved. User name and cart remain intact; offline alert is shown without clearing the session. | **PASSED** |
| **4. Lightweight Verifying State** | Navigate directly to `/orders` or `/account` on slow network. | Renders accessible "جارٍ التحقق من الجلسة..." with skeleton; never redirects prematurely to `/login`. | **PASSED** |
| **5. Session Expiry & Return-To** | When session legitimately expires (401 from backend). | Redirects to `/login` preserving `state: { from: location }`; cart items and form data are untouched. | **PASSED** |
| **6. Admin vs Customer Idle Separation** | Idle for 30 minutes on `/` or `/catalog` vs `/admin`. | Customer storefront NEVER signs out due to inactivity. Admin panel displays warning at 25m and signs out at 30m. | **PASSED** |



