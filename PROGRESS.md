# Wex Technology Web - Project Progress Tracker

## App Shell Track (Branch: app-shell) — Current

Rebuilding storefront UI as ONE mobile-app-style experience identical on phone and desktop matching `~/projects/wex-mockup` (source of truth).

- [x] **Phase 0: Study Mockup, MOCKUP-MAP & Token Merge**
  - Read `~/projects/wex-mockup/index.html`, `css/style.css`, `js/app.js`, `js/data.js` completely.
  - Created `docs/MOCKUP-MAP.md` mapping every mockup screen (splash, home, catalog, product details, checkout, price-lock/payment, orders, tracking, notifications, account, sign-in) with elements in order, spacing, sizes, colors, gradients, ribbons, icons, and React routes.
  - Merged mockup CSS variables into `src/styles/tokens.css` (mockup values prioritized for radii, shadows, brand gradients, and palette).
- [x] **Phase 1: App Shell Architecture & Foundation**
  - Root layout: single 480px max-width column, centered on ice background `#D9E6F6` / `#EAF3FF` on wide viewports, 100dvh height, only middle content scrolls.
  - Safe area padding `env(safe-area-inset-top/bottom)`, `viewport-fit=cover`, theme-color `#061A55`, manifest `standalone` portrait.
  - Fixed 56px App Bar (`AppBar.jsx` + `AppBar.module.css`): brand title or logo on home, RTL back button on inner pages, notifications bell with unread dot, cart button with item count.
  - Fixed 56px Bottom Tab Bar (`BottomTabBar.jsx` + `BottomTabBar.module.css`): 4 tabs with exact mockup inline SVGs (الرئيسية، المتجر، طلباتي، حسابي), active tab in vivid blue `#1E6BFF`, unread badge, automatically hidden on product details, cart, checkout, and order detail screens where sticky bottom action bar takes over.
  - Splash screen overlay (`SplashScreen.jsx` + `SplashScreen.module.css`): slanted brand ribbons, logo card, cyan spinner, skip button, 1.2s timeout with session storage tracking.
  - Laptop illustration fallback component (`LaptopSvg.jsx`): exact SVG vector illustration matching mockup silhouettes and accent color.
  - Native feel: `overscroll-behavior: contain`, `-webkit-tap-highlight-color: transparent`, `:active` press feedback (`scale(0.98)`), 16px inputs to prevent iOS zoom, toasts floating above bottom tab bar, bottom sheets within 480px frame.
  - Verification: 0 lint errors, 39/39 tests passing, production build 110.16 kB gzip.
- [x] **Phase 2: Home, Catalog & Product Detail Screens**
  - `ProductCard.jsx` & `ProductCard.module.css`: exact mockup parity (14px padding, 20px radius, condition badge top-right, 120px image box with real photo or `LaptopSvg` vector fallback, brand subtitle, 2-line title, 2 quick spec pills, SDG bold price + AED reference, quick add to cart button).
  - `HomePage.jsx` & `HomePage.module.css`: Screen 2 parity (user greeting & live exchange rate chip with pulsing green dot, 44px search input with search icon, 3% app discount banner with slanted brand ribbons & `-3%` circle badge, categories scroll with 52px circular SVG icon bubbles, 2-column featured product grid, subtle ribbon price-lock notice, shop info & WhatsApp link).
  - `CatalogPage.jsx` & `CatalogPage.module.css`: Screen 3 parity (in-catalog search, categories & condition filter chips scroll, brands filter chips scroll with compact sort dropdown, live 2-column product grid, empty state with filter reset, pagination bar).
  - `ProductDetailPage.jsx` & `ProductDetailPage.module.css`: Screen 4 parity (180px hero image card with condition & brand chips, 20px bold title, subtle ribbon price box with live rate chip & price guarantee note, specs table card, store inspection & warranty notes card, fixed bottom action bar above safe area with quantity counter, cart button, and "اطلب الآن وثبّت السعر" full-width CTA).
  - Verification: 0 lint errors, 39/39 tests passing, production build 110.18 kB gzip.
- [x] **Phase 3: Cart, Checkout & Sign-In Screens**
  - `CartPage.jsx` & `CartPage.module.css`: Screen 5 parity in 480px app shell (cart items list with 70x60px image boxes, name, unit price, line total, quantity stepper, remove button, financial calculation card with 3% app discount preview, and sticky bottom checkout action bar).
  - `CheckoutPage.jsx` & `CheckoutPage.module.css`: Screen 5 parity (items summary card, 2-column delivery selector [Pickup from Al-Waha mall vs Delivery with zones and address fields], contact phone and notes, financial calculation summary with SDG base, 3% discount, shipping fee, final total, amber payment policy card, and sticky submit order button).
  - `LoginPage.jsx`, `VerifyOtpPage.jsx`, and `Auth.module.css`: splash brand theme with slanted gradient ribbons, white card with logo, Google sign-in integration, Sudanese email/phone OTP input, 6-digit auto-advancing code boxes with 60s resend countdown.
  - Verification: 0 lint errors, 39/39 tests passing, production build 110.46 kB gzip.
- [x] **Phase 4: Price-Lock/Payment, Orders, Tracking, Notifications & Account**
  - `OrderDetailPage.jsx` & `OrderDetailPage.module.css`: Screen 6 & Screen 8 parity (Hero digital countdown banner with `[HH] : [MM] : [SS]` clock boxes, urgent state `< 1h` with warm amber/orange gradient, expired state with clean reorder button, locked price summary line, Bankak account transfer card with copy shortcut, receipt upload dropzone with client-side image compression & instant preview, 5-step order tracking timeline with completed/current states, and WhatsApp direct assistance CTA).
  - `OrdersPage.jsx` & `OrdersPage.module.css`: Screen 7 parity (status filter tabs [الكل, بانتظار الدفع, المؤكدة, المكتملة], order cards with `#order_number`, status chip, date, total SDG, price lock countdown indicator, and zero inline styles).
  - `NotificationsPage.jsx` & `NotificationsPage.module.css`: Screen 9 parity (notification cards with category badges [الطلبات, سداد بنكك, سعر الصرف], unread indicator dot, date, click-to-order navigation, and mark all read action).
  - `AccountPage.jsx` & `AccountPage.module.css`: Screen 10 parity (50px circular avatar bubble with user initials, phone, city, menu card with order history, notifications, price-lock explanation dialog, admin store dashboard button for staff, WhatsApp support CTA, shop location details card, and logout).
  - Verification: 0 lint errors, 39/39 tests passing, production build 110.45 kB gzip.
- [x] **Phase 5: Polish & Quality Pass**
  - Zero emojis across the entire `src/` directory (verified via automated Unicode scanner script).
  - Zero forbidden marketing words (no "رائد", "أفضل متجر", "لا مثيل له", etc.).
  - Zero inline styles across storefront pages, layouts, and route guards.
  - Skeletons, empty states, and error states with retry buttons verified across all screens.
  - A11y & touch targets >= 44px with focus rings and tabular-nums formatting for financial values.
  - Initial JS bundle 110.48 kB gzip (well within the <= 150 KB budget).
- [x] **Phase 6: Parity Audit & Final Verification**
  - Created `docs/PARITY.md` certifying 100% element parity with mockup across all 10 screens.
  - Automated greps verified: 0 style={{}} in storefront pages/layouts, 0 emojis, 0 forbidden marketing words, 0 max-width 1200 containers in storefront.
  - ESLint: 0 errors, 0 warnings.
  - Vitest: 39 passed (100%).
  - Vite production build: 110.48 kB gzip initial JS (under 150 kB budget). All storefront pages dynamic chunked.

---

- [x] **Redesign Phase 1: Design System & Base Components**
  - Self-hosted Tajawal font weights (400, 500, 700, 800) via `@fontsource/tajawal` with Arabic and Latin woff2 preloaded in `index.html`. Removed Cairo/Inter.
  - Refactored `tokens.css` with exact brand guide colors (Navy `#061A55`, Royal `#0B3FBF`, Vivid `#1E6BFF`, Cyan `#00B7FF` accent, Ice `#EAF3FF`, White `#FFFFFF`), 12px card radius, 10px input/button radius, 1px slate-200 borders, and restrained floating shadows.
  - Implemented base components as CSS Modules: `Button`, `Input`, `Select`, `Chip`, `Tag` / `Badge`, `Card`, `Sheet`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `Countdown`, `CopyField`.
  - Installed `lucide-react` (stroke 1.75, size 20) and removed emojis from base components and formatters.
  - Deleted dead CSS (`mockup.css`).
  - Set up ESLint with `eslint-plugin-jsx-a11y` and `eslint-plugin-react`.
  - All 24 unit tests passing, production build verified.
- [x] **Redesign Phase 2: Layout & Navigation**
  - Header: logo (130px min 120px), search field (inline on desktop, icon-expand on mobile), notification bell with unread dot, cart counter.
  - Rate strip: "الدرهم اليوم [rate] جنيه" + "تحديث: اليوم 9:00". Dark top banner removed.
  - Mobile bottom navigation (4 tabs: الرئيسية، المتجر، طلباتي، حسابي) with Lucide icons (`Home`, `LayoutGrid`, `Package`, `User`). Automatically hidden on checkout/product pages.
  - Plain footer: address (مول الواحة - الشهداء - أم درمان), hours, phone, WhatsApp. Emojis removed.
  - Global `ErrorBoundary` with reload action, updated `NotFoundPage`, `OfflinePage`, and `PwaPrompt` with CSS Modules and zero inline styles.
  - ESLint, Vitest (24 tests), and Vite production build verified.
- [x] **Redesign Phase 3: Storefront & Catalog**
  - Shared `ProductCard` + `ProductCard.module.css`: 4:3 image on white, object-fit contain, 2-line title, one-line spec summary, condition tag ("جديد", "مستعمل استيراد"), tabular SDG price + muted AED price, low-stock indicator, whole card link with quick "أضف للسلة" button.
  - `HomePage` + `HomePage.module.css`: removed gradient hero and generic trust cards. Clean search input, scrollable category chips, "وصل جديد" responsive grid (2 cols mobile, 4 cols desktop), "ملحقات" row, compact 3-step "كيف تطلب" strip, and shop info block with WhatsApp and Maps links.
  - `CatalogPage` + `CatalogPage.module.css`: mobile bottom `Sheet` filter drawer with count badge, desktop sticky sidebar filter card, URL param synchronization, sort dropdown, skeleton loading state, "ما لقينا أجهزة بالمواصفات دي" honest empty state with filter reset, and pagination.
  - `ProductDetailPage` + `ProductDetailPage.module.css`: image gallery with thumbnail selector and click-to-zoom modal, clean 2-column specs definition list (`<dl>`, `<dt>`, `<dd>`), warranty line mapped from API, exchange rate volatility note ("السعر بالدرهم وبيتغير مع الصرف. بنثبته ليك بعد الطلب."), compatible accessories section, and sticky mobile bottom action bar.
  - Lint, test suite (24 tests), and production build verified.
- [x] **Redesign Phase 4: Cart, Checkout & Sign-In**
  - `CartPage` + `CartPage.module.css`: compact responsive rows, quantity stepper with limits, running subtotal calculation, honest "السلة فاضية" empty state, sticky desktop summary card, clear item removal.
  - `CheckoutPage` + `CheckoutPage.module.css`: 1-page 3-step streamlined checkout (Pickup vs Delivery selection, delivery zone fees, Sudan telephone input with `inputMode="tel"`, customer notes, price freeze notice, double-submit protection, and sticky mobile CTA bar).
  - `LoginPage` & `VerifyOtpPage` + `Auth.module.css`: brand ribbon decoration at top of card, Google Sign-In placed first and largest, 6-box numeric OTP input with autofocus, digit-advance, backspace navigation, paste-fill, auto-submit, 60s live countdown timer, and prompt for new user registration.
  - Verified with zero inline styles, zero forbidden words, zero emojis, clean lint, 24 unit tests, and production build.
- [x] **Redesign Phase 5: Customer Operations**
  - `OrderDetailPage` + `OrderDetailPage.module.css`: live tabular countdown banner with progress bar and urgent visual treatment when remaining time < 30 minutes, Bankak payment card with `CopyField` actions for account number, account name, and exact amount, client-side receipt image compression (canvas max 1600px, JPEG quality 0.8, < 1 MB target), order timeline history, WhatsApp customer support link, and expired state handling with reorder action.
  - `OrdersPage` + `OrdersPage.module.css`: order list with status filter pills, tabular pricing and countdown remaining time, delivery type indicators, and clean pagination.
  - `NotificationsPage` + `NotificationsPage.module.css`: unread notification indicators, mark single / mark all read actions, honest empty states.
  - `AccountPage` + `AccountPage.module.css`: customer profile information, editable phone/name, email notifications preference switch, multi-session logout, and account deletion confirmation modal.
  - Verified with zero inline styles, zero forbidden words, zero emojis, clean lint, 24 unit tests, and production build.
  - Added Vite dev server reverse proxy for `/api` and `/uploads` forwarding to local Wex API server `http://localhost:8081`.
- [x] **Redesign Phase 6: Admin Redesign**
  - `AdminPaymentsPage` + `AdminPaymentsPage.module.css`: split-view review modal featuring receipt image preview/zoom alongside full order details, one-click approve/reject actions, and quick-fill canned rejection chips ("الإشعار غير واضح", "المبلغ لا يطابق المطلوب", "رقم الإشعار غير صحيح").
  - `AdminDashboardPage` + `AdminDashboardPage.module.css`: high-priority payment review alert banner, key KPI cards (daily orders, review queue, current exchange rate, price lock duration), order status breakdown, and low-stock alerts.
  - `AdminOrdersPage` & `AdminOrderDetailPage`: responsive orders table with status filter, courier dispatch inputs, price lock extension dialog, and full audit timeline.
  - `AdminProductsPage` & `AdminProductFormPage`: product catalog with inline quick stock editor, specifications builder with presets (laptop, phone), multi-image upload with primary selector, and accessory linking.
  - `AdminRatesPage`, `AdminSettingsPage`, `AdminShippingZonesPage`, `AdminUsersPage`, `AdminAuditLogsPage`: converted to CSS Modules with `AdminCommon.module.css`, brand ribbon decorative divider under all admin page titles, zero inline styles, zero forbidden words, zero emojis.
  - Verified with clean ESLint (0 errors), 24 passing unit tests, and production build.
- [ ] **Redesign Phase 7: Copy, A11y & Performance Pass**
  - Complete copy review eliminating all forbidden words.
  - React.lazy for routes, admin chunk segregation, LCP preloads.
- [ ] **Redesign Phase 8: Final Audit & Verification**
  - Automated grep checks: zero inline styles, zero emojis, zero forbidden words, zero Cairo.
  - Full lint, test, build verification and documentation updates.

---

## (a) Initial Project Phases (Completed on main)

- [x] **Phase 0: Inspection and Contract**
  - Inspected backend routes, controllers, entities, services, models, and tests.
  - Mapped public, customer, and admin endpoints.
  - Verified role permissions (customer, staff, admin) and self-modification safeguards.
  - Verified product images (relative uploads path) and protected payment proof binary streaming.
  - Created `docs/API-CONTRACT.md` documenting verified contracts and discrepancies.
  - Created `PROGRESS.md`.
- [x] **Phase 1: Frontend Foundation**
  - Initialized React 19 + Vite 8 in `~/projects/wex-web`.
  - Configured portable npm scripts for Termux Android environment.
  - Configured environment files (`.env`, `.env.example`).
  - Established React Router structure with StoreLayout and AdminLayout.
  - Implemented Arabic-first RTL design system tokens (`tokens.css`, `global.css`, `components.css`).
  - Created shared components (Button, Input, Select, Modal, Badge, Skeleton, EmptyState, ErrorState).
  - Implemented ToastContext and notifications provider.
  - Configured PWA manifest with original Wex Technology brand icons.
  - Production build and test runner verified (100% passing).
- [x] **Phase 2: API and Authentication**
  - Implemented centralized API client (`src/api/client.js`) with standard JSON envelope, error extraction, and FormData handling.
  - Implemented access token refresh rotation with single-flight deduplication and theft protection.
  - Implemented AuthContext with user session persistence, role checking, and `/me` profile updates.
  - Implemented passwordless Email OTP login flow (`/auth/email/request`, `/auth/email/verify`, 6-digit input, 60s cooldown timer, new account name prompt).
  - Integrated Google Identity Services with client ID configuration support.
  - Built protected customer account management (`src/pages/store/AccountPage.jsx`) with Sudan phone normalization, notification preference toggles, logout, and soft account deletion.
  - Unit tests for API client passed (100% passing).
- [x] **Phase 3: Storefront**
  - Implemented responsive Home page (`HomePage.jsx`) with live shop data, category cards, featured laptops, and trust badges.
  - Implemented Product Catalog (`CatalogPage.jsx`) with live filtering (category, brand, condition, AED price range, in-stock, search keyword, sorting, pagination), URL sync, loading skeletons, and empty states.
  - Implemented Product Detail view (`ProductDetailPage.jsx`) with photo gallery thumbnails, technical specs table, warranty details, stock status protection, and suggested accessories.
  - Implemented touch-friendly Cart page (`CartPage.jsx`) with local storage persistence and quantity limits (1-10).
  - Implemented Checkout flow (`CheckoutPage.jsx`) with pickup vs. delivery selection, shipping zones from API, and server-side calculation notice.
  - Unit tests for formatting utilities and business logic passed (100% passing).
- [x] **Phase 4: Customer Operations**
  - Implemented Customer Orders listing (`OrdersPage.jsx`) with status tabs, order cards, and pagination.
  - Implemented Order Details & Tracking (`OrderDetailPage.jsx`) with live price lock countdown timer (`.price-lock-banner`), Bankak transfer instructions, and copy shortcuts.
  - Implemented Payment Proof Upload modal with file picker, client preview, sender name, reference number, and immediate order status refresh.
  - Implemented Order Cancel and Reorder actions respecting backend state machine rules.
  - Implemented In-App Notification Center (`NotificationsPage.jsx`) with unread badge counter in header, single mark-read, and mark-all-read.
  - Unit tests for order status mapping, proof reviews, and timer calculations passed (100% passing).
- [x] **Phase 5: Admin Operations**
  - Implemented Admin Dashboard (`AdminDashboardPage.jsx`) with live metrics from `GET /admin/dashboard`, pending payment review alert banner, today's order count & revenue, and low-stock inventory alerts.
  - Implemented Admin Orders table (`AdminOrdersPage.jsx`) with search, status filters, and pagination.
  - Implemented Order Details & Management (`AdminOrderDetailPage.jsx`) with status state machine transitions (`confirmed` -> `ready_for_pickup` / `out_for_delivery` -> `completed` / `cancelled`), lock extension modal, and courier assignment.
  - Implemented Payment Proof Review interface (`AdminPaymentsPage.jsx` and review modal) with protected binary image streaming, approval confirmation, and rejection notes.
  - Production build and test suite verified (100% passing).
- [x] **Phase 6: Admin Management**
  - Implemented Products catalog table (`AdminProductsPage.jsx`) with keyword search, type filter, active filter, inline quick stock editing, and product deletion.
  - Implemented Product Form (`AdminProductFormPage.jsx`) supporting both creation and editing, specs builder with laptop/phone presets, image upload manager (multi-file, set primary, delete), and accessories linker.
  - Implemented Categories management (`AdminCategoriesPage.jsx`) with Arabic/English names, slugs, sort order, and active toggling.
  - Implemented Brands management (`AdminBrandsPage.jsx`) with slug generation and active toggling.
  - Implemented Exchange Rate management (`AdminRatesPage.jsx`) with live AED-to-SDG rate card, instant store price update warning, rate update dialog, and paginated historical audit trail.
  - Implemented Store Settings form (`AdminSettingsPage.jsx`) covering shop contacts, Bankak bank details, price lock duration, discount, and low-stock threshold.
  - Implemented Shipping Zones management (`AdminShippingZonesPage.jsx`) for Sudan states with SDG delivery fees.
  - Implemented User Management (`AdminUsersPage.jsx`) with role assignment (`customer`, `staff`, `admin`), active status toggle, purchasing stats, and self-demotion protection.
  - Implemented Audit Trail Viewer (`AdminAuditLogsPage.jsx`) with action and entity filters, user attribution, and payload inspector modal.
  - Unit tests for admin capabilities created (`src/__tests__/admin.test.js`, 19/19 tests passing).
- [x] **Phase 7: PWA and Hardening**
  - Configured Web App Manifest with Wex Technology brand identity, colors (`#061A55`, `#FFFFFF`), Arabic RTL metadata, and icons (`192x192`, `512x512` maskable).
  - Configured Service Worker (`vite-plugin-pwa`) with strict cache segregation:
    - Never caches private or authenticated endpoints (`/api/v1/auth`, `/api/v1/orders`, `/api/v1/me`, `/api/v1/admin`).
    - NetworkFirst strategy for public metadata (`/api/v1/shop`, `/api/v1/categories`, `/api/v1/brands`).
    - StaleWhileRevalidate strategy for static product images (`/uploads/products/`).
  - Implemented interactive PWA installation banner and live offline connectivity detector (`PwaPrompt.jsx`).
  - Polished offline fallback view (`OfflinePage.jsx`) and not found view (`NotFoundPage.jsx`) with clean brand styling and no emoji placeholders.
  - Completed security audit and confirmed no credentials, tokens, or OTP codes are stored in URLs or printed to logs.
- [x] **Phase 8: Final Verification & Documentation**
  - Expanded unit tests to include cart operations and limitations (`src/__tests__/cart.test.js`, 24/24 tests passing).
  - Production build successfully tested and generating optimized assets in `dist/` with zero errors.
  - Authored comprehensive Architecture document (`docs/ARCHITECTURE.md`).
  - Authored complete Deployment guide (`docs/DEPLOYMENT.md`) including Apache `.htaccess` with SPA fallback, security headers, MIME types, and HTTPS enforcement.
  - Authored Testing documentation (`docs/TESTING.md`) with automated and manual verification journeys.
  - Authored primary Project README (`README.md`).
  - Completed all phases from Phase 0 to Phase 8.

---

## (b) Completed Tasks
- **Phase 0:** Backend inspection, entity mapping, and `docs/API-CONTRACT.md`.
- **Phase 1:** React 19 + Vite 8 frontend foundation, design tokens (`Tajawal`, Wex Navy/Royal/Cyan/Ice Blue), atomic UI components, and PWA setup.
- **Phase 2:** Centralized API client (`src/api/client.js`), single-flight token refresh rotation, Email OTP login, Google Sign-In, and user profile management.
- **Phase 3:** Complete Storefront (HomePage, CatalogPage with multi-filtering, ProductDetailPage with specs & gallery, CartPage, and CheckoutPage).
- **Phase 4:** Customer operations (OrdersPage, OrderDetailPage with 4-hour price lock countdown, Bankak transfer card, payment proof upload, cancel/reorder, and notifications center).
- **Phase 5:** Admin operations (AdminDashboardPage with operational metrics and low-stock alerts, AdminOrdersPage, AdminOrderDetailPage with status transitions, and AdminPaymentsPage proof review).
- **Phase 6:** Admin management (AdminProductsPage, AdminProductFormPage with specs builder & image uploader, AdminCategoriesPage, AdminBrandsPage, AdminRatesPage with audit trail, AdminSettingsPage, AdminShippingZonesPage, AdminUsersPage, and AdminAuditLogsPage).
- **Phase 7:** PWA install banner, offline network detection (`PwaPrompt.jsx`), offline fallback page, and security audit.
- **Phase 8:** 24 unit tests across 6 suites, production build validation, and comprehensive technical documentation (`README.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`, `TESTING.md`).

---

## (c) Remaining Tasks
- All planned phases and features completed and verified.

---

## (d) Files Created or Modified
- `docs/API-CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/TESTING.md`
- `PROGRESS.md`
- `README.md`
- `public/.htaccess`
- `src/` (complete application, components, pages, layouts, styles, and tests)

---

## (e) API Integration Status
- 100% Integrated with live backend at `http://localhost:8081/api/v1`.
- Standard JSON envelope handling across all customer and administrative endpoints.
- Single-flight token refresh rotation operational.

---

## (f) Verification Results
- **Vitest Unit Test Suite:** 6 test files, 24 tests passed (100% passing).
- **Vite Production Build:** Successfully built in ~2.46s; outputs optimized bundles and PWA manifest to `dist/`.
- **Apache `.htaccess`:** Configured with SPA rewrite fallback, security headers, and caching.

---

## (g) Known Limitations
- Google Sign-In requires a valid `VITE_GOOGLE_CLIENT_ID` in production; gracefully falls back to Email OTP if omitted.

---

## (h) Next Immediate Action
- Deliver final project report to the user.
- Google Sign-in requires valid `VITE_GOOGLE_CLIENT_ID` in production; in local development with no client ID configured, the UI gracefully defaults to Email OTP.
- Payment receipts must be viewed via authorized API binary streaming endpoint (`/api/v1/orders/{order_number}/payment-proof/{id}/image`).

---

# Redesign & Hardening Track (`redesign` branch)

## Overview & Objectives
Calm, trustworthy, production-ready UI/UX tailored for Sudanese customers and electronics retail:
- Self-hosted Tajawal font (Arabic + Latin subsets, preloaded WOFF2, Western tabular numbers).
- Zero inline styles (~430 legacy blocks converted to scoped CSS Modules).
- Zero emojis (replaced with unified `lucide-react` icons).
- Pure CSS design system with Navy `#061A55`, Royal `#0B3FBF`, Vivid `#1E6BFF`, restrained Cyan `#00B7FF`, Ice `#EAF3FF`.
- Honest technical copy (zero forbidden promotional words: أصلية, أفضل, مميز, احترافي, حصري, ضمان حقيقي, وارد دبي, ذكي, تجربة).
- Mobile-first layout with 44px+ touch targets and bottom navigation bar.

## Completed Redesign Phases
- [x] **Redesign Phase 1: Design System & Base Components (commit `67f8f10`)**
  - Self-hosted Tajawal font via `@fontsource/tajawal` (400, 500, 700, 800) with preload in `index.html`.
  - Refactored `tokens.css` with exact brand palette and semantic colors.
  - Built 14 atomic CSS Modules: Button, Input, Select, Chip, Tag, Card, Sheet, Modal, Toast, Skeleton, EmptyState, ErrorState, Countdown, CopyField.
  - Replaced emojis with `lucide-react` (stroke 1.75, size 20).
- [x] **Redesign Phase 2: Layout & Navigation (commit `6245d67`)**
  - Responsive header with 120px+ logo, search input, rate strip ("الدرهم اليوم [rate] جنيه" + timestamp), unread notification dot, and cart count.
  - Mobile bottom navigation with 4 tabs (الرئيسية، المتجر، طلباتي، حسابي).
  - Redesigned AdminLayout with responsive sidebar and active route indicators.
  - Redesigned NotFoundPage, OfflinePage, and PwaPrompt.
- [x] **Redesign Phase 3: Storefront & Catalog (commit `40cd7b5`)**
  - ProductCard with 4:3 aspect ratio, 2-line title clamp, honest condition tags ("جديد", "مستعمل استيراد"), tabular SDG price and muted AED reference, low-stock warning, and quick add action.
  - HomePage without AI-template gradients; scrollable category chips, "وصل جديد" grid, "ملحقات" row, 3-step "كيف تطلب" strip, and store location block.
  - CatalogPage with mobile bottom Sheet filter drawer, desktop sticky sidebar, URL-synced multi-filter, and empty state.
  - ProductDetailPage with photo gallery modal, `<dl>` technical specs table, warranty from API, and accessories section.
- [x] **Redesign Phase 4: Cart, Checkout & Sign-In (commit `085f12c`)**
  - CartPage with responsive rows, stepper, clear breakdown, and honest empty state.
  - CheckoutPage with 1-page 3-step layout, telephone inputMode, double-submit protection, and sticky CTA.
  - LoginPage and VerifyOtpPage with brand ribbon header, Google first, 6-box auto-advance OTP input, paste handling, and 60s countdown.
- [x] **Redesign Phase 5: Customer Operations & Vite API Proxy (commit `f017d54`)**
  - Configured Vite dev server reverse proxy for `/api` and `/uploads` to `http://localhost:8081`.
  - OrderDetailPage with tabular price lock countdown bar, Bankak transfer card with CopyField shortcuts, client-side canvas receipt compression (< 1600px, JPEG 0.8), timeline, and WhatsApp support.
  - OrdersPage, NotificationsPage, and AccountPage redesigned with CSS Modules.
- [x] **Redesign Phase 6: Admin Dashboard & Management (commits `7a87451` & `c7e008c`)**
  - AdminPaymentsPage with split-view receipt preview alongside order details, one-click verify/reject, and quick rejection reason chips.
  - AdminDashboardPage, AdminOrdersPage, AdminOrderDetailPage, AdminProductsPage with quick inline stock editor, AdminProductFormPage with specs presets and image manager.
  - AdminRatesPage, AdminSettingsPage, AdminShippingZonesPage, AdminUsersPage, AdminAuditLogsPage, AdminCategoriesPage, AdminBrandsPage.
- [x] **Redesign Phase 7: Code-Splitting, Copy & Performance Pass (commit `e678743`)**
  - Dynamic `lazy()` imports in `src/app/router.jsx` with `<Suspense>` fallback, dropping main JS bundle from 559 kB to 349 kB (gzip 110 kB).
  - Deleted dead monolithic `components.css`, cutting CSS bundle to 91 kB (gzip 14.8 kB).
  - Global copy audit verified 0 occurrences of forbidden marketing terms and 0 emojis.
  - Created `docs/PERFORMANCE.md` documenting bundle breakdown, font preloading, and client-side image downsampling.
  - ESLint verified 0 errors, 0 warnings.
- [x] **Redesign Phase 8: Extended Tests, Design System Docs & Final Audit**
  - Added unit test suites for Western price formatting, price lock countdown, and receipt image downsampling math (`price-formatting.test.js`, `countdown.test.js`, `receipt-compression.test.js`).
  - Extracted shared `src/utils/imageCompressor.js` with aspect ratio calculations.
  - Authored comprehensive `docs/DESIGN-SYSTEM.md` and `docs/UI-CHECKLIST.md`.
  - Updated `README.md` and `docs/TESTING.md`.

- [x] **Phase B: Hide Exchange Rate & AED Prices Across Storefront (branch `hide-rate`)**
  - **B1 Storefront Sanitization:** Removed rate chip ("الدرهم اليوم ..."), AED subtitles under prices, "1 درهم = ..." text, locked-rate text on lock card, and any AED/rate occurrences across all customer storefront components and pages.
  - **B2 SDG-Only Pricing:** ProductCard, ProductDetailPage, CartPage, CheckoutPage, and OrderDetailPage display exclusively SDG prices received from the API (`price_sdg`, line totals, subtotal, discount, total). No client-side math from AED.
  - **B3 Shared `<PriceNotice variant="full|short" />` Component:** Implemented reusable component displaying exact required Arabic string: *"الأسعار بتتغير مع تقلب سعر الصرف. بعد الطلب بنثبت ليك السعر لمدة {N} ساعات تحول فيها."* and pricing freshness indicator *"آخر تحديث للأسعار: اليوم 9:00"* using `prices_updated_at`.
  - **B4 Dynamic Cart Price Change Workflow:** Re-fetches current catalog on cart open and checkout mount. If an item's `price_sdg` has changed, displays a neutral inline alert: *"تغير سعر هذا الجهاز"* with previous and new SDG amounts, requiring explicit user confirmation before placing the order.
  - **B5 Simplified Price-Lock Card:** OrderDetailPage displays countdown timer, *"السعر مثبت: {total} ج.س"*, and *"ينتهي التثبيت الساعة {HH:MM}"*, with short PriceNotice and zero mention of exchange rates or locked conversion figures.
  - **B6 Admin Panel Privacy Controls:** Added *"للإدارة فقط"* badges on AED and rate fields. `AdminProductFormPage` takes `price_aed` and provides live preview `"= X ج.س بالسعر الحالي"` using live rate. `AdminRatesPage` maintains audit history and confirm modal with exact copy *"سيتم تحديث أسعار جميع الأجهزة فوراً"*. `AdminOrdersPage` and `AdminOrderDetailPage` display both SDG and AED amounts with the rate snapshot.
  - **B7 Service Worker & PWA Hardening:** Excluded all `/admin` paths from service worker caching in `vite.config.js`. Updated `AuthContext.clearSession` to purge `wex-public-api-cache` and any API caches on logout.
  - **B8 Comprehensive Vitest Suite:** Created `src/__tests__/hide-rate.test.jsx` covering PriceNotice variants, `formatPricesUpdatedAt`, ProductCard zero-AED guarantees, countdown banner privacy, and cart price change confirmation workflow. All 10 test files and 47 tests pass (100%).
  - **B9 Documentation:** Updated `README.md`, `docs/API-CONTRACT.md`, `docs/DESIGN-SYSTEM.md`, `docs/PARITY.md`, `docs/MOCKUP-MAP.md` recording that removal of the rate chip, AED lines, and locked-rate text is an intentional architectural deviation from the mockup.

## Verification Checklist
- [x] `npm run lint`: 0 errors, 0 warnings.
- [x] `npm run test`: 10 test files, 47 passed (100%).
- [x] `npm run build`: built in ~2.4s, zero errors.
- [x] Customer-facing text audit: zero references to AED, dirham, or dollar; only generic fluctuation notice ("تقلب سعر الصرف") is permitted.

---

# Polish & Rich Motion Phase (Branch `polish-motion`)

- [x] **Phase 0: UI & Copy Audit, Motion & Polish Master Plan**
  - Audited existing UI and designed screen-by-screen modernization in `docs/POLISH-PLAN.md`.
  - Built centralized Modern Standard Arabic (Fusha) dictionary in `src/content/ar.js` with `t(key, vars)` and `mapApiMessage(msg)`.
  - Audited backend colloquial messages and documented recommendations in `docs/COPY-TODO-API.md`.
- [x] **Phase 1: Motion System Foundation & Tokens**
  - Integrated motion tokens in `tokens.css` (durations: 150ms/250ms/450ms/800ms/600ms, easings: standard/emphasized/exit).
  - Created `src/motion/`: `motionTokens.js`, `useMotionMode.js` (detects hardware capability, prefers-reduced-motion, and local storage override), `Reveal.jsx`, `Stagger.jsx`, `useCountUp.js`, `Ripple.jsx`, and `useParallax.js`.
  - Added user motion mode toggle in `AccountPage.jsx` ("الحركة: كاملة / مخففة / موقوفة").
  - Authored comprehensive motion specification and animation directory in `docs/MOTION.md`.
  - Created test suite `src/__tests__/motion.test.js`.
- [x] **Phase 2: App Shell & Global Component Polish**
  - Upgraded `SplashScreen.jsx` & `SplashScreen.module.css`: slanted drifting ribbons, clip-path mask sweep logo reveal, rotating X mark motif, max 1.4s with tap-to-skip, Fusha copy.
  - Refactored `BottomTabBar.jsx` & `BottomTabBar.module.css`: dynamic sliding pill indicator (`--active-index`), spring icon bounce on tab selection, Fusha labels, removed `transition: all`.
  - Upgraded `AppBar.jsx` & `AppBar.module.css`: unread pulse dot on notification bell, cart count bump animation, `id="app-bar-cart-btn"` WAAPI target, Fusha labels.
  - Upgraded `Toast.module.css`: slide-in transition, error shake keyframe, reduced-motion bypass.
  - Upgraded `Sheet.jsx` & `Sheet.module.css`: spring-up slide entrance, touch drag-to-dismiss handle with dynamic transform, backdrop fade, Fusha close label.
  - Upgraded `Button.jsx` & `Button.module.css`: active press scale, primary CTA idle sheen sweep every 6s on idle (disabled in lite/reduced).
  - Upgraded `Skeleton.module.css`: hardware-accelerated transform-only shimmer sweep (`translate3d(-100%, 0, 0)` -> `translate3d(100%, 0, 0)`).
  - Upgraded `StoreLayout.jsx` & `StoreLayout.module.css`: RTL direction-aware slide page transitions (`screenContentForward` from left `-14px` and `screenContentBackward` from right `+14px`), rotating X mark pull-to-refresh indicator.
  - Upgraded `Card.module.css`, `Chip.module.css`, `Modal.module.css`, `Input.module.css`, `Select.module.css`: soft navy-tinted elevation, active press scale, removed `box-shadow` and `all` from transitions.
  - Refactored `Countdown.jsx` & `Countdown.module.css`: transform-based `scaleX(var(--progress, 1))` with `transform-origin: right center` replacing `transition: width 1s linear`.
  - Verification: 0 lint errors, 11 test files and 51 tests passed (100%), production build 121.23 kB gzip initial JS.
- [x] **Phase 3: New Home Screen & Product Card**
  - Upgraded `ProductCard.jsx` & `ProductCard.module.css`: 4:3 aspect ratio image container on ice-to-white gradient (`#EAF3FF` to `#FFFFFF`), condition badge (`جديد` / `مستعمل استيراد`), 2-line title, clean spec line (`i5 · 8GB · 256GB`), large SDG price with tabular numerals, morphing quick-add button with checkmark feedback, haptics (`navigator.vibrate`), cart badge bump event, and WAAPI fly-to-cart animation clone targeting `#app-bar-cart-btn`. Container queries `@container` ensure fluid card layout in 1-column and 2-column rails.
  - Implemented 10-section `HomePage.jsx` & `HomePage.module.css`:
    1. App Bar (StoreLayout integration with unread bell and animated cart count).
    2. Greeting line with signed-in user name / guest greeting + rotating search placeholder examples ("ابحث عن جهاز، مثل: Dell Latitude", "Lenovo ThinkPad", "HP EliteBook", "شاحن أصيل") with popular search chips on focus.
    3. Hero carousel with dark navy background, animated drifting slanted ribbons, `useParallax`, auto-advance 5s, touch swipe, touch pause, and active progress dots across 3 slides (وصل حديثًا, ضمان تثبيت السعر, ملحقات الحاسوب).
    4. Quick actions row (4 round icon tiles: تصفح الأجهزة, تتبع طلبي, تواصل عبر واتساب, موقع المحل).
    5. Category tiles (حواسيب محمولة, هواتف, ملحقات) + condition chips (جديد, مستعمل استيراد).
    6. Four API-driven horizontal rails with scroll-snap and peeking next cards ("وصل حديثًا", "مناسبة للدراسة", "مناسبة للعمل", "ملحقات"), with skeletons during loading and graceful empty handling.
    7. "كيف تطلب" section with 4 animated steps connected by a brand gradient ribbon line.
    8. Price notice card with generic SDG fluctuation string and freshness indicator.
    9. Shop location card with Al-Waha Mall address, operating hours, Google Maps and WhatsApp CTAs, and slanted ribbon background accent.
    10. Floating WhatsApp button above bottom tab bar with scroll-direction detection (hides on scroll down, reappears on scroll up).
  - Verification: 0 lint errors, 11 test files and 51 tests passing, production build 121.41 kB gzip initial JS.
- [x] **Phase 4: Catalog, Product Page, Search & Cart Flight Animation**
  - Upgraded `CatalogPage.jsx` & `CatalogPage.module.css`:
    - Clean Fusha text using centralized `ar.catalog` dictionary keys (`resultsCount`, `searchPlaceholder`, `resetFilters`, `sortTitle`, `noResultsTitle`).
    - Staggered entrance animation for product grid via `--i` indices.
    - Results count bar with conditional reset button.
    - Zero `transition: all`, transform, opacity, background-color and border-color transitions only.
  - Upgraded `ProductDetailPage.jsx` & `ProductDetailPage.module.css`:
    - Hero gallery with tap-to-zoom modal, multi-image thumbnail indicator dots, and vector `LaptopSvg` fallback.
    - Specs card with Fusha spec keys and warranty badge.
    - "يكمل جهازك" accessories rail with one-tap quick add.
    - Sticky bottom action bar with quantity stepper, morphing cart button with checkmark feedback, and full-width "تثبيت السعر وتأكيد الطلب" CTA.
    - WAAPI fly-to-cart animation clone targeting `#app-bar-cart-btn`.
    - Customer privacy strictly enforced: SDG prices only, zero AED, zero exchange rate.
  - Verification: 0 lint errors, 11 test files and 51 tests passing, production build 121.38 kB gzip initial JS.
- [x] **Phase 5: Cart, Checkout, Price-Lock Ring, Receipt & Orders Flow**
  - Upgraded `CartPage.jsx` & `CartPage.module.css`:
    - Animated collapse on item removal (`collapseOut` animation).
    - Preserved exact neutral price change notification string: *"تغير سعر هذا الجهاز"* with previous and new SDG amounts.
    - Updated copy to use centralized `ar.cart` Fusha strings.
    - Removed all `transition: all`.
  - Upgraded `CheckoutPage.module.css`:
    - Refined 3-step structured cards (Pickup/Delivery, Phone/Address, Financial Summary).
    - Replaced all `transition: all` with transform and border-color transitions.
  - Upgraded `OrderDetailPage.jsx` & `OrderDetailPage.module.css`:
    - Circular SVG countdown progress ring with dynamic `stroke-dashoffset` calculated from lock expiration.
    - Urgent warning pulse under 30 minutes.
    - 12-particle transform-only ribbon confetti celebration burst on confirmed and completed orders (active only in `full` motion mode, disabled in `reduced` or `lite`).
    - Customer privacy strictly enforced: *"السعر مثبت: {total} ج.س"* and *"ينتهي التثبيت الساعة {HH:MM}"*, zero rate, zero AED.
    - Replaced all 5 `transition: all` occurrences.
  - Upgraded `OrdersPage.module.css`, `NotificationsPage.module.css`, `Auth.module.css`, `AccountPage.module.css`, and `AdminPaymentsPage.module.css`:
    - Replaced all `transition: all` across the entire repository with transform, opacity, background-color, and border-color.
    - Zero `transition: all` remaining across all CSS modules.
  - Verification: 0 lint errors, 11 test files and 51 tests passing, production build 121.39 kB gzip initial JS.
- [x] **Phase 6: Responsiveness & Accessibility Audits**
  - Enforced fluid sizing via `clamp()` and `rem` units across viewport range (320px to 480px mobile-first shell, centered on wide viewports).
  - Integrated `visualViewport` on-screen keyboard detection in `StoreLayout.jsx`: automatically hides the bottom tab bar when the software keyboard opens, preventing overlap and giving full height to input forms.
  - Ensured all interactive touch targets meet or exceed 44px minimum sizing with clear `:active` press scale feedback.
  - Maintained safe-area padding for notches and home indicators (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).
  - Container queries `@container` validated on `ProductCard` for seamless multi-column to single-column card adaptation.
  - Verification: 0 lint errors, 11 test files and 51 tests passing, production build 121.49 kB gzip initial JS.
- [x] **Phase 7: Copy Modernization Pass Across All Screens**
  - Audited all JSX files across the codebase against the Fusha dictionary `src/content/ar.js`.
  - Upgraded `NotificationsPage.jsx` and `OrdersPage.jsx` to use centralized Fusha strings (`t('notifications.xxx')` and `t('ordersList.xxx')`).
  - Grep audits verified:
    - 0 instances of marketing puffery (`الأفضل`, `مميز`, `احترافي`, `حصري`, `ضمان حقيقي`, `وارد دبي`).
    - 0 customer-facing instances of AED, dirham, dollar, or reference exchange rate text.
    - 0 emojis across all `src/` files.
    - Western Arabic numerals (0-9) used consistently for financial tabular amounts.
  - Verification: 0 lint errors, 11 test files and 51 tests passing, production build 121.48 kB gzip initial JS.
- [x] **Phase 8: Final Performance Benchmarks & Double Check Verification**
  - Performance Budgets Verified:
    - Initial JS bundle: `dist/assets/index-*.js`: **121.48 kB gzip** (well below the <= 170 kB budget).
    - Global CSS bundle: `dist/assets/index-*.css`: **7.75 kB gzip** (well below the <= 40 kB budget).
    - All routes cleanly split into dynamic on-demand chunks.
  - Updated `docs/PERFORMANCE.md` with complete asset distribution table and runtime optimizations.
  - Verified `docs/MOTION.md` with 18 documented animations across `full`, `lite`, and `reduced` modes.
  - "Double Check the Double Check" Results:
    - `npm run lint`: 0 errors, 0 warnings.
    - `npm test`: 11 test files, 51 / 51 tests passing (100%).
    - `npm run build`: Production build completes cleanly.
    - Backend API verification (`php vendor/bin/phpunit` in `~/projects/wex-api`): 63 / 63 tests passing (100%), 2,667 assertions. Live curl scans against `http://127.0.0.1:8081` confirm zero customer-facing reference currency or exchange rate leakage.
    - Grep audits: 0 `transition: all`, 0 emojis, 0 forbidden marketing words, 0 customer-facing AED/rate references.

---

# Desktop & Better UX Track (Branch `desktop-ux`)

- [x] **Phase 0: Layout Audit, Tier Plan & Copy Leftovers Fix**
  - Recorded ADR in `docs/DECISIONS.md`: Replaced "single 480px column on every device" with 3 layout tiers (Phone < 640px, Tablet 640-1023px, Desktop >= 1024px).
  - Authored comprehensive screen-by-screen breakdown in `docs/RESPONSIVE-MAP.md` covering all 10+ storefront routes across all three tiers with loading/empty/error/offline states.
  - Fixed copy leftovers: updated search placeholder in `HomePage.jsx` and `ar.js` to "شاحن حاسوب", renamed hero slide badge to "ثبّت السعر عند الطلب", verified zero forbidden words and zero AED/rate leakage.
  - Verification: 0 lint errors, 11 test files and 51 tests passing, production build 121.48 kB gzip initial JS.
- [x] **Phase 1: Layout Tiers Foundation & Overlay Primitives**
  - Created `src/hooks/useViewport.js`: Lightweight matchMedia-based 3-tier viewport hook (`isMobile` <640px, `isTablet` 640-1023px, `isDesktop` >=1024px, `tier`).
  - Created `src/components/common/Drawer.jsx` & `Drawer.module.css`: Accessible side drawer with focus trap, body scroll lock, Esc key handler, and transform-only slide animation from end/start.
  - Created `src/components/common/Popover.jsx` & `Popover.module.css`: Anchored floating dropdown with click-outside detection, Esc key dismissal, transform-scale entrance animation, and start/center/end alignments.
  - Created `src/components/common/Dialog.jsx`: Adaptive dialog primitive rendering bottom `Sheet` on mobile and centered `Modal` (max 560px) on tablet and desktop.
  - Created `src/components/common/ScrollToTop.jsx` & `ScrollToTop.module.css`: Floating smooth scroll-to-top button appearing after 500px scroll threshold with accessible label and transform animation.
  - Added responsive layout tokens to `src/styles/tokens.css` (`--tablet-max-width`, `--desktop-max-width`, `--desktop-header-height`, `--desktop-top-bar-height`, `--desktop-side-padding`).
  - Created `src/__tests__/viewport.test.jsx`: 10 unit tests covering overlay primitives and viewport detection.
  - Verification: 0 lint errors, 12 test files and 61 tests passing (100%), production build 121.47 kB gzip initial JS, 7.81 kB gzip global CSS.
- [x] **Phase 2: Desktop Header/Footer, Search Dropdown, Notifications Popover, Account Menu, Cart Drawer**
  - Created `src/components/desktop/DesktopHeader.jsx` & `DesktopHeader.module.css`:
    - 72px sticky white bar with brand logo (min 140px), primary navigation (`/`, `/products`, `/products?category=accessories`, `/orders`) with active animated underline.
    - Top status strip with live Khartoum shop status ("مفتوح الآن" / "مغلق حاليًا" based on 9:00 ص - 9:00 م schedule), WhatsApp, phone, and location.
    - Wide search bar with debounced autocomplete suggestions dropdown (product thumbnail, title, tabular SDG price; zero AED/rate leakage), recent search chips, and clear action.
    - Notifications button with unread dot and anchored `Popover` showing 5 latest notifications and "عرض جميع التنبيهات" link.
    - Account button with user avatar initial and anchored `Popover` menu (user details, "طلباتي", "بيانات الحساب", "تسجيل الخروج" or guest login prompt).
  - Created `src/components/desktop/DesktopFooter.jsx` & `DesktopFooter.module.css`:
    - 4 columns: Shop details & hours, Quick links, Contact & support, How to order 4 steps.
    - Royal-blue-to-cyan gradient ribbon divider, copyright line with dynamic year, and SDG-only pricing disclaimer. Zero puffery, zero emojis.
  - Created `src/components/desktop/CartDrawer.jsx` & `CartDrawer.module.css`:
    - Slide-in side drawer rendering cart items with image/LaptopSvg, quantity steppers, item removal, running subtotal, 3% app discount, total in SDG, "متابعة الطلب" checkout CTA, and "عرض السلة كاملة" button.
  - Updated `src/layouts/StoreLayout.jsx` & `StoreLayout.module.css`:
    - Clean tier switching: renders full web layout (`desktopShell`, container max-width 1240px, `DesktopHeader`, `DesktopFooter`, `ScrollToTop`) on `>= 1024px`, and phone/tablet `appShell` (expanding to 768px on tablet) on `< 1024px`.
  - Created `src/__tests__/desktop-shell.test.jsx`: 4 unit tests covering desktop header, footer, and cart drawer.
  - Verification: 0 lint errors, 13 test files and 65 tests passing (100%), production build 131.15 kB gzip initial JS, 11.76 kB gzip global CSS.
- [x] **Phase 3: Desktop Home & Catalog Layouts with Hover States**
  - Upgraded `HomePage.jsx` & `HomePage.module.css`:
    - Wide 2-column hero: start column (headings, subtitle, CTA button, dots indicator) + end column (visual illustration with drifting brand ribbons & parallax); accessible desktop prev/next arrow buttons.
    - Added desktop rail navigation: previous and next smooth scroll arrow buttons on all product rails (`newArrivals`, `studyLaptops`, `workLaptops`, `accessories`), 4-5 cards visible across the 1240px container.
    - Category tiles and quick actions expanded into balanced desktop horizontal grids.
    - "كيف تطلب": 4-step row connected with the ribbon motif.
    - 2-column Shop block: contact & working hours on one side, interactive Google Maps card on the other.
    - Removed floating WhatsApp FAB on desktop (handled by top strip and footer contact links).
  - Upgraded `CatalogPage.jsx` & `CatalogPage.module.css`:
    - 2-column desktop layout: sticky 280px filter sidebar at start (category options, condition filter, brand options, SDG price range presets, and in-stock toggle with "مسح الكل" action) + results column at end.
    - Desktop results toolbar: item count, grid/list view toggle (`LayoutGrid` and `List` icons), and sort dropdown.
    - Live URL parameter synchronization across all filters.
    - Product grid adapts responsively: 2 columns on phone (< 640px), 3 columns on tablet (640-1023px), 3-4 columns on desktop (>= 1024px).
  - Enhanced `ProductCard.module.css`:
    - Smooth hover elevation (`translateY(-4px)` with soft navy shadow and blue border accent) active only on pointer/hover devices.
  - Verification: 0 lint errors, 13 test files and 65 tests passing (100%), production build 131.13 kB gzip initial JS, 11.76 kB gzip global CSS.
- [x] **Phase 4: Product Page (Gallery Zoom, Buy Box, Tabs), Compare, Favorites, Recently Viewed, Share**
  - Created `src/context/CompareContext.jsx` & `src/context/FavoritesContext.jsx` with localStorage persistence and safe fallback defaults for isolated unit tests.
  - Enhanced `ProductCard.jsx`: added floating favorite heart button with active state and toast confirmation.
  - Created `src/pages/store/FavoritesPage.jsx` (`/favorites`): clean view of customer favorites with quick-add to cart and empty state pointing to catalog.
  - Created `src/pages/store/ComparePage.jsx` (`/compare`): side-by-side comparison table for up to 3 devices with highlighted spec differences, SDG prices, and direct add-to-cart actions.
  - Upgraded `src/pages/store/ProductDetailPage.jsx` & `ProductDetailPage.module.css`:
    - 2-column desktop layout: large interactive gallery at start + sticky buy box at end.
    - Gallery thumbnail strip with keyboard navigation and hover zoom lens preview.
    - Buy box: bold SDG tabular price, condition chip, stock status, quantity stepper, add-to-cart, buy-now, compare toggle, and native Web Share API with clipboard/WhatsApp fallback.
    - Specs & Warranty tabs (`المواصفات`, `الضمان والاستلام`) with structured specs table.
    - Compatible accessories rail ("يكمل جهازك") and "شاهدت مؤخرًا" recently viewed rail powered by localStorage.
  - Created `src/__tests__/compare-favorites.test.jsx`: 4 unit tests covering favorites and compare mechanisms.
  - Verification: 0 lint errors, 14 test files and 69 tests passing (100%), production build 126.64 kB gzip initial JS, 11.76 kB gzip global CSS.
- [x] **Phase 5: Cart Page, Checkout Two-Column Layout, Guest Flow & Pending Order Banner**
  - Enhanced `Toast.jsx`, `Toast.module.css`, and `ToastContext.jsx`: added action button support (`actionToast`), refined action styling, and set desktop positioning to bottom-start (`inset-inline-start: 32px`).
  - Enhanced `CartContext.jsx`: added `restoreItem` to support 5-second undo restoration.
  - Upgraded `CartPage.jsx` & `CartPage.module.css`:
    - 2-column desktop layout: items list on start (65%) + sticky calculation summary on end (35%).
    - 5-second undo snackbar on item removal ("تم حذف {item} من السلة" with "تراجع" button).
    - Mobile sticky bottom checkout bar hidden on desktop; primary checkout action integrated directly into the sticky summary card.
  - Upgraded `CheckoutPage.jsx` & `CheckoutPage.module.css`:
    - 3-step progress indicator across top: (1) السلة, (2) بيانات الطلب (نشط), (3) تثبيت السعر والدفع.
    - 2-column desktop layout: delivery selector & contact forms (60%) + sticky order review summary (40%) with PriceNotice and submit CTA.
    - "ماذا بعد تثبيت السعر؟" next steps card explaining price-lock, Bankak transfer, and pickup/delivery.
    - SessionStorage draft persistence across phone, delivery zone, address, and notes.
  - Implemented Guest Checkout Flow:
    - Opened `/checkout` to guests in `src/app/router.jsx`.
    - If customer is unauthenticated at submit time, draft is preserved and user is redirected to `/login?returnTo=/checkout` without touching cart contents.
    - Updated `LoginPage.jsx` and `VerifyOtpPage.jsx` to honor `returnTo` URL parameter and return user seamlessly to checkout.
  - Created `PendingOrderBanner.jsx` & `PendingOrderBanner.module.css`:
    - Persistent top banner across all viewports detecting active `pending_payment` orders.
    - Live countdown timer, order number link to `/orders/{order_number}`, and session dismissal.
    - Integrated into `StoreLayout.jsx`.
  - Created `src/__tests__/cart-checkout.test.jsx`: 5 unit tests covering cart, checkout, and pending order banner.
  - Verification: 0 lint errors, 15 test files and 74 tests passing (100%), production build 127.73 kB gzip initial JS, 12.33 kB gzip global CSS.
- [x] **Phase 6: Order Detail & Orders Desktop Layouts, Receipt Drag/Paste, Account/Notifications, FAQ Page**
  - Upgraded `OrderDetailPage.jsx` & `OrderDetailPage.module.css`:
    - 2-column desktop layout: (Start Column) sticky countdown ring + price lock banner + Bankak card + receipt upload dropzone; (End Column) 5-step tracking timeline + order items & delivery breakdown + WhatsApp assistance card.
    - Receipt Dropzone: drag-and-drop file upload with visual dragging feedback (`isDragging`), plus clipboard paste (Ctrl+V) listener to paste screenshot directly from clipboard.
    - Breadcrumb navigation to return to orders list.
  - Upgraded `OrdersPage.module.css`: desktop horizontal tabular row layout with order number, date, item summary, status badge, price in SDG, and quick action buttons.
  - Upgraded `AccountPage.module.css` and `NotificationsPage.module.css` for desktop max-width and typography.
  - Created `FaqPage.jsx` & `FaqPage.module.css` (`/faq`):
    - Fusha copy covering: price lock mechanism (4 hours), Bankak payment & receipt upload, 7-day testing warranty, store address in Al-Waha mall and opening hours (9:00 AM - 9:00 PM), and delivery options.
    - Live search query filter and accordion expand/collapse.
    - Registered `/faq` in `src/app/router.jsx`.
  - Created `src/__tests__/order-detail-faq.test.jsx`: unit tests covering FAQ page, search, and propositions.
  - Verification: 0 lint errors, 16 test files and 76 tests passing (100%), production build clean (127.82 kB gzip initial JS, 12.33 kB gzip global CSS).
- [x] **Phase 7: General UX Pass: Forms, Undo, Error Recovery, Prefetch, Blur-up & A11y**
  - Form validation: added `normalizeSudanPhone` and `isValidSudanPhone` in `src/utils/formatters.js` supporting all Sudanese formats (`09XXXXXXXX`, `01XXXXXXXX`, `+249...`).
  - Customer contact persistence: integrated phone validation and localStorage phone persistence in `CheckoutPage.jsx` so return visits autofill immediately.
  - Error recovery & network awareness: added live online/offline event listeners in `StoreLayout.jsx` with network reconnection notification ("عادت شبكة الإنترنت").
  - Optimistic route prefetching: created `src/utils/prefetch.js` with instant route prefetching on link hover/focus across `DesktopHeader.jsx` and `BottomTabBar.jsx`.
  - A11y: added keyboard skip-to-content link in `StoreLayout.jsx` and `StoreLayout.module.css`.
  - Copy & Puffery Audit: cleaned forbidden word `ذكية` in `src/content/ar.js`; automated regex scans verified 0 forbidden marketing words, 0 customer-facing references to AED/exchange rate, and 0 emojis across all `src/` files.
  - Unit tests: added Sudanese phone normalization and validation tests in `src/__tests__/formatters.test.js`.
  - Verification: 0 lint errors, 16 test files and 77 tests passing (100%), production build clean (128.53 kB gzip initial JS, 12.39 kB gzip global CSS).
- [x] **Phase 8: Performance, Tests, Documentation Updates & Double Check Verification**
  - Updated `docs/PERFORMANCE.md` with complete chunk distribution table, client-side image compression specs, and motion budget analysis.
  - Authored ADR-002 in `docs/DECISIONS.md` documenting universal UX improvements (guest checkout return-to flow, cart undo, comparison & favorites, phone normalization, receipt drag/paste, zero AED/rate rule).
  - Updated `docs/DESIGN-SYSTEM.md` with comprehensive three-tier specifications, responsive container rules (1240px desktop), desktop navigation hierarchy, and typography step-up.
  - Updated `docs/MOTION.md` with desktop micro-interactions (hover lift, focus-visible rings, shortcuts, transform-only guarantees).
  - Authored detailed verification matrix in `docs/UI-CHECKLIST.md` across 6 responsive breakpoints (360px, 390px, 768px, 1024px, 1280px, 1536px), desktop feature matrix, and universal UX rules.
  - Completed Double Check the Double Check: verified clean ESLint (0 errors, 0 warnings), 100% Vitest pass rate (16 test files, 77/77 tests), and clean production build under initial budgets (JS 128.53 kB <= 170 kB gzip, CSS 12.39 kB <= 45 kB gzip).

---

# Admin Redesign Track (Branch `admin-ux`)

Ground-up redesign of the administration panel tailored for store operators and retail staff under Sudanese mobile network conditions and dual usage (smartphone one-hand + desktop PC).

- [x] **Phase 0: Admin Audit, Comprehensive Plan & API Gaps Analysis**
  - Audited all existing admin pages, routes, controllers, and styles.
  - Authored `docs/API-GAPS.md` detailing backend limitations (payments queue, global search, product duplication, bulk actions, rate impact preview, live push) and explicit client-side workarounds.
  - Authored `docs/ADMIN-PLAN.md` documenting screen-by-screen responsive layouts across Phone (< 768px), Tablet (768-1023px), and Desktop (>= 1024px), including loading, empty, and error states.
  - Verification: 0 lint errors, 16 test files and 77 tests passing (100%), production build clean.
- [x] **Phase 1: Admin Shell and Primitives Foundation**
  - Created `src/content/admin.ar.js`: comprehensive Modern Standard Arabic dictionary for all admin operations, courteous operational tone, Western digits, zero emojis, zero puffery words, and explicit "للإدارة فقط" labels.
  - Created `src/hooks/useIdleTimer.js`: tracks user activity (`pointerdown`, `keydown`, `scroll`, `touchstart`), triggers warning at 25m, and signs out at 30m.
  - Created `src/components/admin/StatusChip.jsx` & `StatusChip.module.css`: accessible status badge using icon + color + text (orders, proofs, roles, visibility).
  - Created `src/components/admin/DataList.jsx` & `DataList.module.css`: shared responsive component switching between dense data table on desktop/tablet (>=768px) and touch cards on phone (<768px) with sticky header, sortable columns, and unified pagination.
  - Created `src/components/admin/FilterBar.jsx` & `FilterBar.module.css`: inline filters on desktop, compact search + bottom sheet on phone with active count badge.
  - Created `src/components/admin/ConfirmDialog.jsx` & `ConfirmDialog.module.css`: accessible confirmation dialog stating consequences in plain words.
  - Created `src/components/admin/Stepper.jsx` & `Stepper.module.css`: numeric stepper with 44px tap targets for mobile stock and hours adjustment.
  - Created `src/components/admin/ImageViewer.jsx` & `ImageViewer.module.css`: interactive receipt image viewer with 60fps transform-only zoom, pan, and 90° rotation.
  - Created `src/components/admin/AdminShell.jsx` & `AdminShell.module.css`: adaptive shell supporting Phone (app bar + bottom tab bar with live badge), Tablet (64px collapsed icon rail), and Desktop (240px sidebar + top bar with global search, live rate indicator, audio chime toggle, and idle warning).
  - Updated `src/layouts/AdminLayout.jsx` to wrap nested routes with `AdminShell`.
  - Added unit test suite `src/__tests__/admin-primitives.test.jsx` (8 unit tests).
  - Verification: 0 lint errors, 17 test files and 85 tests passing (100%), production build clean (136.42 kB gzip initial JS, 13.78 kB gzip global CSS).
- [x] **Phase 2: Today Dashboard & Payments Review Queue**
  - Upgraded `AdminDashboardPage.jsx` & `AdminDashboardPage.module.css`:
    - Top "تحتاج إلى إجراء" section: prominent hero card for pending reviews with direct CTA, quick operational flow badges (to prepare, ready for pickup, out for delivery), and low-stock alert banner.
    - Rate card with 1-tap quick update modal and "للإدارة فقط" labeling.
    - Key metrics (today orders, revenue in SDG, price lock duration).
    - Status distribution list and low-stock table with direct navigation.
    - 30-second background polling with tab visibility guard.
  - Redesigned `AdminPaymentsPage.jsx` & `AdminPaymentsPage.module.css`:
    - Queue sorting oldest first with countdown badge showing remaining price lock time.
    - High-performance `ImageViewer` (transform-only zoom, pan, 90° rotate) fetching authorized blob image and revoking URL on cleanup.
    - Compact "المطلوب" panel: order number, customer name and phone (1-tap call & WhatsApp), expected amount with 1-tap copy, sender name, transfer reference, and upload time.
    - Approve flow: confirmation modal displaying the exact amount before status update.
    - Reject flow: requires reason selection from canned chips (`المبلغ المحول أقل من المطلوب`, `الإشعار غير واضح`, etc.) + optional custom customer-visible note.
    - Auto-advance to next item in queue after decision; empty state when all reviews are complete.
    - Phone: sticky bottom action bar above safe area. Desktop: keyboard shortcuts (`A` approve, `R` reject, `J` next, `K` prev).
  - Added `formatRelativeTime` in `src/utils/formatters.js`.
  - Added unit test suite `src/__tests__/admin-phase2.test.jsx`.
  - Verification: 0 lint errors, 18 test files and 87 tests passing (100%), production build clean (136.58 kB gzip initial JS, 13.78 kB gzip global CSS).
- [x] **Phase 3: Orders List & Order Detail with Next-Step Actions**
  - Upgraded `AdminOrdersPage.jsx` & `AdminOrdersPage.module.css`:
    - Horizontally scrollable status filter chips bar with live counts (`الكل`, `بانتظار التحويل`, `مراجعة الإشعار`, `تم التأكيد`, `قيد التجهيز`, `جاهز للاستلام`, `مع المندوب`, `تم التسليم`, `ملغي`, `منتهي`).
    - `<FilterBar>` with search (order number, customer phone), delivery type filter, date filter.
    - URL query parameter synchronization (`searchParams`).
    - Rendered via `<DataList>` (touch card view on phone, sortable data table on desktop).
  - Upgraded `AdminOrderDetailPage.jsx` & `AdminOrderDetailPage.module.css`:
    - Status header with `<StatusChip status={order.status} />`.
    - Single primary contextual next-step action based on current status (`pending_payment`/`payment_review` -> "مراجعة إشعار الدفع واعتماده", `confirmed` -> "بدء تجهيز الطلب بالمحل", `processing` [delivery] -> "تسليم لمندوب التوصيل", `processing` [pickup] -> "جاهز للاستلام بالمحل", `ready_for_pickup`/`out_for_delivery` -> "تم التسليم للعميل بنجاح").
    - Courier dispatch modal requiring courier name & phone for delivery orders.
    - Customer contact bar with direct call button (`tel:`) and WhatsApp shortcut (`wa.me` with prefilled template).
    - Delivery details card, items breakdown with thumbnails, and audit timeline.
    - Payment proofs history table with interactive `ImageViewer` modal.
    - Secondary actions: extend price lock (hours), cancel order (requires reason), copy summary, and printable invoice slip with `@media print` stylesheet.
  - Added unit test suite `src/__tests__/admin-phase3.test.jsx` (2 unit tests).
  - Verification: 0 lint errors, 19 test files and 89 tests passing (100%), production build clean (137.54 kB gzip initial JS, 13.78 kB gzip global CSS).
- [x] **Phase 4: Products List & Multi-Section Product Form**
  - Upgraded `AdminProductsPage.jsx` & `AdminProductsPage.module.css`:
    - Responsive `<DataList>` implementation switching between touch cards (< 768px) and accessible data table with sortable columns (>= 768px).
    - Inline numeric `<Stepper>` for quick stock adjustments directly in the table/cards without opening the full edit form.
    - 1-tap active/inactive visibility toggle with instant optimistic update.
    - Stock badges highlighting low-stock (<= 2) and out-of-stock items.
    - "تكرار المنتج" action: clones product with `(نسخة)` appended to title, `is_active: 0`, and redirects to the edit form.
    - Bulk selection toolbar (select all / individual items, bulk activate, bulk deactivate, bulk delete with plain-words `ConfirmDialog`).
    - Comprehensive `<FilterBar>` with search (q), category, brand, condition, stock status, and active status filters with URL synchronization.
  - Upgraded `AdminProductFormPage.jsx` & `AdminProductFormPage.module.css`:
    - Single scrolling form with floating section sidebar on desktop (>= 1024px) and sticky horizontal pills on mobile (< 1024px) for quick jump navigation:
      - 1. البيانات الأساسية
      - 2. السعر والمخزون (AED input labeled "للإدارة فقط" + live calculated SDG price preview from current exchange rate)
      - 3. صور الجهاز (auto-compressed on client before upload to max 1600px/80% JPEG via `compressImage`, reorder controls, set primary image, and delete with undo toast)
      - 4. المواصفات الفنية (preset templates for laptops, phones, accessories + dynamic custom key-value spec rows)
      - 5. الملحقات المقترحة (link/unlink accessories)
    - Unsaved changes guard via `beforeunload` listener and dirty state tracking.
    - Sticky bottom save bar with "حفظ التعديلات" (primary) and "معاينة في المتجر" (`target="_blank"` to customer product page).
  - Added unit test suite `src/__tests__/admin-phase4.test.jsx` (2 unit tests).
  - Verification: 0 lint errors, 0 warnings, 20 test files and 91 tests passing (100%), production build clean (137.90 kB gzip initial JS <= 170 kB budget, 13.78 kB gzip global CSS <= 45 kB budget).
- [x] **Phase 5: Exchange Rate, Settings & Shipping Zones**
  - Upgraded `AdminRatesPage.jsx` & `AdminRatesPage.module.css`:
    - Today's active exchange rate prominently displayed with last updated date, creator, and "للإدارة فقط" badge.
    - Quick rate update form with immediate impact preview on 3 sample devices (cheapest, median, most expensive) showing Old SDG -> New SDG and difference.
    - Large change warning alert when proposed rate difference exceeds 10%.
    - Lightweight, dependency-free SVG sparkline chart of exchange rate history (30 data points).
    - Plain-words `ConfirmDialog` stating consequence of rate modification across the entire storefront.
  - Upgraded `AdminSettingsPage.jsx` & `AdminSettingsPage.module.css`:
    - Split into three independently saveable cards, each with dedicated submit button and isolated loading/success states:
      - 1. Shop Info & Contact (name, address, hours, phone, WhatsApp)
      - 2. Bankak Account (bank name, account name, account number)
      - 3. Operations & Pricing (price lock duration hours with `<Stepper>`, app discount percentage with `<Stepper>`, rounding step SDG, low-stock threshold with `<Stepper>`).
  - Upgraded `AdminShippingZonesPage.jsx` & `AdminShippingZonesPage.module.css`:
    - Responsive `<DataList>` table/cards for delivery states and fees in SDG.
    - 1-tap active/inactive toggle for delivery zones.
    - Modal for adding and updating shipping zones with validation.
    - Delete zone with plain-words `ConfirmDialog`.
  - Added unit test suite `src/__tests__/admin-phase5.test.jsx` (3 unit tests).
  - Verification: 0 lint errors, 0 warnings, 21 test files and 94 tests passing (100%), production build clean (137.97 kB gzip initial JS <= 170 kB budget, 13.88 kB gzip global CSS <= 45 kB budget).
- [x] **Phase 6: Users, Audit Log, Role-Based Navigation & Login Redirect**
  - Upgraded `AdminUsersPage.jsx` & `AdminUsersPage.module.css`:
    - Responsive `<DataList>` table/cards displaying user name, email, phone, role (`admin`, `staff`, `customer`), and active status.
    - Role change modal with confirmation dialog (restricted to `admin` only; disabled for `staff`).
    - Account active/inactive toggle with `ConfirmDialog` (protects current admin from self-disabling).
    - `<FilterBar>` with query search, role dropdown, and active status filters.
  - Upgraded `AdminAuditLogsPage.jsx` & `AdminAuditLogsPage.module.css`:
    - Timeline of administrative actions with human-readable Arabic sentences generated by `formatAuditSentence` ("قام فلان باعتماد إشعار التحويل البنكي للطلب #...", "قام فلان بتحديث سعر الصرف من ... إلى ...", etc.).
    - Filterable by entity type and action.
    - Modal for inspecting full raw JSON details.
  - Role-based routing & login redirect:
    - Updated `RouteGuard.jsx` (`RoleGuard` and `GuestRoute`): if a customer tries to access `/admin`, shows an honest card "هذه الصفحة مخصصة لإدارة المتجر" with a primary button to return to the shop.
    - Updated `LoginPage.jsx` and `VerifyOtpPage.jsx`: admin and staff sign-ins automatically redirect to `/admin` instead of the customer storefront.
  - Added unit test suite `src/__tests__/admin-phase6.test.jsx` (3 unit tests).
  - Verification: 0 lint errors, 0 warnings, 22 test files and 97 tests passing (100%), production build clean (138.22 kB gzip initial JS <= 170 kB budget, 13.91 kB gzip global CSS <= 45 kB budget).
- [x] **Phase 7: Polish (A11y, Idle Timer, Admin PWA Manifest, Error Recovery)**
  - Standalone Admin PWA Manifest:
    - Created `public/admin-manifest.webmanifest` ("ويكس - الإدارة | Wex Technology Admin", start_url `/admin`, theme color `#061A55`, background `#EAF3FF`).
    - Dynamic manifest swapping in `AdminShell.jsx`: automatically switches `link[rel="manifest"]` to `/admin-manifest.webmanifest` while in admin panel and reverts back upon leaving.
    - Cleaned marketing puffery word from `vite.config.js` manifest description.
  - Idle security & audio awareness:
    - Verified `useIdleTimer` warning at 25 min and auto sign-out at 30 min.
    - Web Audio API chime with persistence toggle for incoming payment receipts.
  - Accessibility & Touch Targets:
    - All touch elements on phone verified >= 44px (steppers, action icons, tab bars, sheet buttons).
    - Focus visible rings (`:focus-visible` 2px cyan with 2px offset) across all admin controls.
    - Screen reader announcements: `role="status"` and `aria-live="polite"` on toasts and badges.
  - Added unit test suite `src/__tests__/admin-phase7.test.jsx` (2 unit tests).
  - Verification: 0 lint errors, 0 warnings, 23 test files and 99 tests passing (100%), production build clean (138.31 kB gzip initial JS <= 170 kB budget, 13.91 kB gzip global CSS <= 45 kB budget).
- [x] **Phase 8: Tests, Documentation & Final Double Check Verification**
  - Architecture & Decisions:
    - Authored ADR-003 in `docs/DECISIONS.md` documenting the three-tier admin shell, top daily workflows (Bankak proof review queue, order next-step workflow, exchange rate updates), role access controls, standalone admin PWA manifest, and strict price rule.
  - Performance & Memory Management:
    - Updated `docs/PERFORMANCE.md` with memory profile (blob URL revocation), dependency-free SVG sparkline, chunk distribution, and 30s battery-conscious polling.
  - Verification Checklist:
    - Authored comprehensive verification checklist in `docs/UI-CHECKLIST.md` covering Phone, Tablet, Desktop, touch targets >= 44px, keyboard navigation, and workflow parity.
  - Automated Audits:
    - Verified 0 emojis across entire `src/` directory via automated Unicode scanner script.
    - Verified 0 prohibited marketing words or promotional superlatives across all content files.
    - Verified 0 customer-facing references to AED, dirham, or numerical exchange rate.
    - Verified 0 inline styles (`style={{}}`) in application pages and layouts (CSS Modules only).
  - Double Check the Double Check:
    - ESLint: 0 errors, 0 warnings.
    - Vitest: 23 test suites, 99/99 tests passing (100%).
    - Vite production build: 138.31 kB gzip initial JS (under <= 170 kB budget), 13.91 kB gzip global CSS (under <= 45 kB budget).
    - Backend isolation: verified `~/projects/wex-api` remains completely untouched.





