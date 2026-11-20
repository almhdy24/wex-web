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

