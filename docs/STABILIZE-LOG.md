# STABILIZATION SPRINT LOG

This document contains raw execution logs and command outputs for the stabilization sprint across `wex-web` and `wex-api`.
Following the strict rule: **Red first, then Green.**

---

## PHASE 1: BEHAVIORAL CHECKS (Initial Baseline - All Failing)

### Check 1: `scripts/check-api-surface.mjs`
**Purpose**: Statically find every call like `xxxApi.method(` or `api.method(` in `src` and verify that the method is exported by the matching module in `src/api`.
**Failing Command & Raw Output**:
```
$ node scripts/check-api-surface.mjs
=== Checking API Surface Integrity ===
Discovered API modules and methods:
  - api (4 methods)
  - adminApi (41 methods)
  - authApi (12 methods)
  - notificationsApi (4 methods)
  - ordersApi (7 methods)
  - productsApi (13 methods)
Scanned 129 source files, checked 153 API calls.

❌ FAIL: Found 3 API surface violation(s):
  src/pages/store/CheckoutPage.jsx:66 -> productsApi.getShopSettings()
     Reason: Method "getShopSettings" does not exist on "productsApi" (available: getProducts, getProductDetail, getCategories, getBrands, getShopInfo, getShippingZones, getHeroSlides, getHomeSections, getFaq, getPages, getPage, getAnnouncements, getRecentPurchases)
  src/pages/store/HomePage.jsx:41 -> productsApi.getShopSettings()
     Reason: Method "getShopSettings" does not exist on "productsApi" (available: getProducts, getProductDetail, getCategories, getBrands, getShopInfo, getShippingZones, getHeroSlides, getHomeSections, getFaq, getPages, getPage, getAnnouncements, getRecentPurchases)
  src/pages/store/ProductDetailPage.jsx:58 -> productsApi.getShopSettings()
     Reason: Method "getShopSettings" does not exist on "productsApi" (available: getProducts, getProductDetail, getCategories, getBrands, getShopInfo, getShippingZones, getHeroSlides, getHomeSections, getFaq, getPages, getPage, getAnnouncements, getRecentPurchases)
```
Status: **RED (Failing as expected)**

---

### Check 2: `scripts/check-css-modules.mjs`
**Purpose**: Collect all `styles.X` and `styles['x']` usages across all JSX files importing `*.module.css` and verify each class exists in the module.
**Failing Command & Raw Output**:
```
$ node scripts/check-css-modules.mjs
=== Checking CSS Modules Class Integrity ===
Checked 89 CSS module imports across 137 files.

ℹ️ Found unused CSS classes in 26 module(s):
  src/components/admin/AdminShell.module.css (1 unused: navDivider)
  src/components/admin/ConfirmDialog.module.css (3 unused: danger, warning, primary)
  src/components/admin/DataList.module.css (3 unused: start, center, end)
  src/components/admin/StatusChip.module.css (8 unused: sm, md, neutral, primary, info...)
  src/components/admin/Stepper.module.css (2 unused: sm, md)
  src/components/common/Button.module.css (8 unused: sm, lg, vivid, secondary, outline...)
  src/components/common/Chip.module.css (1 unused: active)
  src/components/common/Countdown.module.css (1 unused: expiredText)
  src/components/common/NoticeLine.module.css (4 unused: navy, warning, danger, success)
  src/components/common/Skeleton.module.css (3 unused: title, card, avatar)
  src/components/common/Tag.module.css (6 unused: success, warning, danger, info, outline...)
  src/components/common/Toast.module.css (6 unused: success, error, warning, message, progressBar...)
  src/components/store/AnnouncementBanner.module.css (4 unused: dark, warning, critical, success)
  src/components/store/AnnouncementCard.module.css (3 unused: warning, critical, success)
  src/components/store/AnnouncementToast.module.css (3 unused: warning, critical, success)
  src/components/store/OrdersDisabledBanner.module.css (1 unused: dark)
  src/components/store/PaymentAccountsDisplay.module.css (1 unused: dark)
  src/components/store/RecentPurchasesToast.module.css (1 unused: timeTag)
  src/layouts/StoreLayout.module.css (3 unused: stickyBottomAction, refreshIndicator, refreshXMark)
  src/pages/admin/AdminAnnouncementsPage.module.css (3 unused: kind_info, kind_promo, kind_warning)
  src/pages/admin/AdminCommon.module.css (17 unused: toolbarCard, toolbarForm, cardHeader, cardTitle, cardBody...)
  src/pages/auth/Auth.module.css (6 unused: otpBoxGroup, otpInput, timerRow, timerCount, resendBtn...)
  src/pages/auth/Auth.module.css (28 unused: backRow, backBtn, perksRow, perkChip, perkIcon...)
  src/pages/store/OrderDetailPage.module.css (1 unused: hiddenInput)
  src/pages/store/OrdersPage.module.css (5 unused: pending_payment, confirmed, completed, cancelled, payment_rejected)

❌ FAIL: Found missing CSS classes in 16 file(s):
  src/components/common/Toast.jsx -> src/components/common/Toast.module.css:
    - missing class: ".detail"
    - missing class: ".progressBarContainer"
    - missing class: ".progressBarFill"
  src/components/desktop/CartDrawer.jsx -> src/components/desktop/CartDrawer.module.css:
    - missing class: ".emptyIcon"
    - missing class: ".summaryLabel"
    - missing class: ".totalLabel"
  src/components/desktop/DesktopHeader.jsx -> src/components/desktop/DesktopHeader.module.css:
    - missing class: ".recentBox"
    - missing class: ".popoverLoading"
  src/components/store/PaymentAccountsDisplay.jsx -> src/components/store/PaymentAccountsDisplay.module.css:
    - missing class: ".emptyAccounts"
  src/pages/admin/AdminAnnouncementsPage.jsx -> src/pages/admin/AdminAnnouncementsPage.module.css:
    - missing class: ".loadingGrid"
  src/pages/admin/AdminDashboardPage.jsx -> src/pages/admin/AdminDashboardPage.module.css:
    - missing class: ".skeletonHeader"
    - missing class: ".urgentIcon"
  src/pages/admin/AdminFaqPage.jsx -> src/pages/admin/AdminFaqPage.module.css:
    - missing class: ".loadingGrid"
  src/pages/admin/AdminHeroSlidesPage.jsx -> src/pages/admin/AdminHeroSlidesPage.module.css:
    - missing class: ".loadingGrid"
    - missing class: ".metaLabel"
  src/pages/admin/AdminHomeSectionsPage.jsx -> src/pages/admin/AdminHomeSectionsPage.module.css:
    - missing class: ".loadingGrid"
  src/pages/admin/AdminPagesPage.jsx -> src/pages/admin/AdminPagesPage.module.css:
    - missing class: ".noticeText"
    - missing class: ".loadingGrid"
  src/pages/admin/AdminPaymentAccountsPage.jsx -> src/pages/admin/AdminPaymentAccountsPage.module.css:
    - missing class: ".loadingGrid"
    - missing class: ".notesText"
  src/pages/admin/AdminRecentPurchasesPage.jsx -> src/pages/admin/AdminRecentPurchasesPage.module.css:
    - missing class: ".loadingList"
  src/pages/store/ComparePage.jsx -> src/pages/store/ComparePage.module.css:
    - missing class: ".emptyIcon"
  src/pages/store/FaqPage.jsx -> src/pages/store/FaqPage.module.css:
    - missing class: ".supportInfo"
  src/pages/store/FavoritesPage.jsx -> src/pages/store/FavoritesPage.module.css:
    - missing class: ".emptyIcon"
  src/pages/store/OrderDetailPage.jsx -> src/pages/store/OrderDetailPage.module.css:
    - missing class: ".stepPending"
```
Status: **RED (Failing as expected)**

---

### Check 3: Route Smoke Tests (`tests/route-smoke.test.jsx`)
**Purpose**: Render every storefront and admin route with real API fixtures, asserting no JS error strings, main landmark exists, and page is inside `<Page>`.
**Failing Command & Raw Output**:
```
$ node node_modules/vitest/vitest.mjs run tests/route-smoke.test.jsx -t "HomePage"
 FAIL  tests/route-smoke.test.jsx > Route Smoke Tests with Real API Fixtures > renders route HomePage (/) cleanly inside <Page> with main landmark
AssertionError: expected 'تعذّر الاتصال__vite_ssr_import_3__.pr…' not to match /is not a function|undefined|null|NaN|…/

- Expected:
/is not a function|undefined|null|NaN|\[object|Failed to fetch|Network Error/

+ Received:
"تعذّر الاتصال__vite_ssr_import_3__.productsApi.getShopSettings is not a functionحاول تاني"

 ❯ tests/route-smoke.test.jsx:210:24
    208|       // 2. Assert no forbidden error / undefined strings in text cont…
    209|       const text = container.textContent || '';
    210|       expect(text).not.toMatch(forbiddenTextPattern);
       |                        ^

 Test Files  1 failed (1)
      Tests  1 failed | 30 skipped (31)
```
Status: **RED (Failing as expected)**

---

### Check 4: Journey Tests (`tests/journeys.test.jsx`)
**Purpose**: Behavioral tests for order creation, proof review state, expired orders, and rejection flow.
**Failing Command & Raw Output**:
```
$ node node_modules/vitest/vitest.mjs run tests/journeys.test.jsx
 ❯ tests/journeys.test.jsx (4 tests | 3 failed) 3259ms
   ❯ Customer Order & Payment Journey Tests (4)
     ✓ Journey (a): Checkout -> creates order -> navigates to payment screen with Bankak details 12ms
     × Journey (b): Upload proof -> UI switches to "under review" and upload CTA disappears everywhere 1176ms
     × Journey (c): Expired order shows the expired state and forbids payment upload 1027ms
     × Journey (d): Rejected proof shows the shop note and allows a new upload 1026ms

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/journeys.test.jsx > Customer Order & Payment Journey Tests > Journey (b): Upload proof -> UI switches to "under review" and upload CTA disappears everywhere
TestingLibraryElementError: Unable to find an element with the text: /قيد المراجعة/i. This could be because the text is broken up by multiple elements.

 FAIL  tests/journeys.test.jsx > Customer Order & Payment Journey Tests > Journey (c): Expired order shows the expired state and forbids payment upload
TestingLibraryElementError: Unable to find an element with the text: /انتهاء المهلة|ملغي|منتهي/i.

 FAIL  tests/journeys.test.jsx > Customer Order & Payment Journey Tests > Journey (d): Rejected proof shows the shop note and allows a new upload
TestingLibraryElementError: Unable to find an element with the text: /رقم الإشعار غير مقروء في الصورة/i.

 Test Files  1 failed (1)
      Tests  3 failed | 1 passed (4)
```
Status: **RED (Failing as expected)**

---

### Check 5: API E2E Journey (`scripts/e2e.sh`)
**Purpose**: Complete curl-based API flow asserting payments list contains customer name, phone, amounts, and proof details.
**Failing Command & Raw Output**:
```
$ ./scripts/e2e.sh
=== Wex Technology Comprehensive E2E Journey Test ===
Target Base URL: http://127.0.0.1:8080/api/v1

--- Step 1: Customer Sign In (cust_1795224382@example.com) ---
Customer OTP from email log: 476767
Customer authenticated. Token: eyJ0eXAiOiJKV1Q...

--- Step 2: Customer Creates Order ---
Order created successfully: WEX-261121-78D7F

--- Step 3: Customer Uploads Proof (File 'blob' without extension) ---
Upload response: {"success":true,"data":{"proof_id":16,"status":"pending",...}}
Payment proof uploaded with ID: 16

--- Step 4: Admin Sign In ---
Admin authenticated. Token: eyJ0eXAiOiJKV1Q...

--- Step 5: Admin Lists Payments ---
Verifying order payload fields:
FAIL: Admin payments list item is missing required fields: [
  'customer_name',
  'customer_phone',
  'amount',
  'expected_amount',
  'payment_proofs'
]
```
Status: **RED (Failing as expected)**

---

### Check 6: Database Content Audit (`scripts/audit-db.sh`)
**Purpose**: Scan SQLite database tables for forbidden claims and sample placeholder values.
**Failing Command & Raw Output**:
```
$ ./scripts/audit-db.sh
=== Database Content Audit for Forbidden Claims & Sample Data ===
Database: /data/data/com.termux/files/home/projects/wex-api/writable/database/wex.sqlite
⚠️ Table [hero_slides] contains forbidden claims or sample values:
hero_slides|1|أجهزة لابتوب مختارة بعناية لأعمالك ودراستك|أجهزة مستوردة مختارة بعناية مع إمكانية المعاينة المباشرة في فرعنا بأم درمان
⚠️ Table [pages] contains forbidden claims or sample values:
pages|3|سياسة المعاينة والاستلام|returns
⚠️ Table [settings] contains forbidden claims or sample values:
settings|bank_account_number|2849102
⚠️ Table [payment_accounts] contains forbidden claims or sample values:
payment_accounts|1|بنك الخرطوم (تطبيق بنكك)|2849102
⚠️ Table [orders] contains debug test orders (WEX-DBG-%):
orders|1|WEX-DBG-001
orders|2|WEX-DBG-002A
orders|3|WEX-DBG-002B
orders|4|WEX-DBG-003
orders|5|WEX-DBG-004A
orders|6|WEX-DBG-004B
orders|7|WEX-DBG-008A
orders|8|WEX-DBG-008B
orders|9|WEX-DBG-008C
orders|10|WEX-DBG-011
orders|11|WEX-DBG-012

❌ FAIL: DB content audit found 15 violating row(s).
```
Status: **RED (Failing as expected)**

---

### Check 7: Extended Claims Scanner & PHPUnit Test
**Purpose**: Scan frontend sources, presets, API seeds, migrations, language files, and email templates for claims and sample values.
**Failing Command & Raw Output**:
```
$ node scripts/check-claims.mjs
=== Checking Forbidden Marketing Claims & Placeholder Data ===
Scanning:
  - 108 Storefront source files
  - 2 Admin preset files
  - 44 API seeders, migrations, language, and email files
❌ /data/data/com.termux/files/home/projects/wex-web/src/components/desktop/DesktopFooter.jsx: Found forbidden claim/placeholder "معاينة" (Invented inspection (معاينة))
❌ /data/data/com.termux/files/home/projects/wex-web/src/components/store/PaymentAccountsDisplay.jsx: Found forbidden claim/placeholder "2849102" (Placeholder bank account (2849102))
❌ /data/data/com.termux/files/home/projects/wex-web/src/pages/admin/AdminProductFormPage.jsx: Found forbidden claim/placeholder "فحص" (Invented inspection (فحص))
❌ /data/data/com.termux/files/home/projects/wex-api/app/Database/Seeds/SettingsSeeder.php: Found forbidden claim/placeholder "2849102" (Placeholder bank account (2849102))
❌ /data/data/com.termux/files/home/projects/wex-api/app/Views/emails/order_created.php: Found forbidden claim/placeholder "2849102" (Placeholder bank account (2849102))

❌ FAIL: Found 33 forbidden claim or placeholder violation(s).

$ cd ../wex-api && php vendor/bin/phpunit tests/unit/ClaimsScanTest.php
FAILURES!
Tests: 1, Assertions: 1, Failures: 1.
Found forbidden claims/placeholders in API files:
Seeds/SettingsSeeder.php contains forbidden: "2849102"
Migrations/2026-11-20-000002_CreatePaymentAccountsAnnouncementsAndContentTables.php contains forbidden: "معاينة"
Migrations/2026-11-20-000002_CreatePaymentAccountsAnnouncementsAndContentTables.php contains forbidden: "مختارة بعناية"
Migrations/2026-11-20-000002_CreatePaymentAccountsAnnouncementsAndContentTables.php contains forbidden: "2849102"
emails/order_created.php contains forbidden: "2849102"
emails/lock_warning.php contains forbidden: "2849102"
```
Status: **RED (Failing as expected)**

---

### Check 8: Admin English Check (`scripts/check-admin-english.mjs`)
**Purpose**: Ensure no Latin words in Admin UI except allowlist (brand/model names, spec units, order numbers).
**Failing Command & Raw Output**:
```
$ node scripts/check-admin-english.mjs
=== Checking Admin UI for Disallowed Latin Words ===
Scanned 28 admin UI and content files.

❌ FAIL: Found 45 disallowed Latin word(s) in Admin UI:
  src/pages/admin/AdminHeroSlidesPage.jsx:154 -> "Hero Slides" in: <h1 className={styles.title}>شرائح الواجهة الرئيسية (Hero Slides)</h1>
  src/pages/admin/AdminHeroSlidesPage.jsx:288 -> "CTA" in: <label className={styles.formLabel}>نص زر التوجيه (CTA)</label>
  src/pages/admin/AdminAuditLogsPage.jsx:207 -> "Audit" in: <h1 className={styles.title}>سجل العمليات الإدارية (Audit Log)</h1>
  src/pages/admin/AdminFaqPage.jsx:145 -> "FAQ" in: <h1 className={styles.title}>الأسئلة الشائعة (FAQ)</h1>
  src/content/admin.ar.js:391 -> "Hero Slides" in: title: 'الشرائح الرئيسية (Hero Slides)',
```
Status: **RED (Failing as expected)**


---

## PHASE 2: P0 FIXES (Verification & Green Proofs)

### 1. Check API Surface (`scripts/check-api-surface.mjs`)
**Fix**: Created unified `shopApi.getShop()` (`GET /shop`) in `src/api/shop.js`. Updated all callers in `HomePage.jsx`, `ProductDetailPage.jsx`, `CheckoutPage.jsx`. Sanitized error mappers in `src/utils/errorMapper.js` and `src/api/errorMapper.js`.
**Passing Command & Raw Output**:
```
$ node scripts/check-api-surface.mjs
=== Checking API Surface Integrity ===
Discovered API modules and methods:
  - api (4 methods)
  - adminApi (41 methods)
  - authApi (12 methods)
  - notificationsApi (4 methods)
  - ordersApi (7 methods)
  - productsApi (13 methods)
  - shopApi (1 methods)
Scanned 133 source files, checked 153 API calls.
✅ PASS: All API method calls match exported API surfaces.
```
Status: **GREEN (Passed)**

---

### 2. Check CSS Modules (`scripts/check-css-modules.mjs`)
**Fix**: Added all missing CSS classes across 16 files (`Toast.module.css`, `CartDrawer.module.css`, `DesktopHeader.module.css`, `PaymentAccountsDisplay.module.css`, all admin page CSS modules, `OrderDetailPage.module.css`).
**Passing Command & Raw Output**:
```
$ node scripts/check-css-modules.mjs
=== Checking CSS Modules Class Integrity ===
Checked 91 CSS module imports across 142 files.
✅ PASS: All referenced CSS module classes exist.
```
Status: **GREEN (Passed)**

---

### 3. Route Smoke Tests with Real Fixtures (`tests/route-smoke.test.jsx`)
**Fix**: Introduced `<Page>` primitive with `data-page-container="true"` and `<main role="main">` landmark. Wrapped all 12 storefront pages, 19 admin pages, and auth pages cleanly inside `<Page>`.
**Passing Command & Raw Output**:
```
$ node node_modules/vitest/vitest.mjs run tests/route-smoke.test.jsx
 ✓ tests/route-smoke.test.jsx (31 tests) 2640ms
   ✓ Route Smoke Tests with Real API Fixtures (31)
     ✓ renders route HomePage (/) cleanly inside <Page> with main landmark
     ✓ renders route CatalogPage (/catalog) cleanly inside <Page> with main landmark
     ✓ renders route ProductDetailPage (/products/thinkpad-t480) cleanly inside <Page> with main landmark
     ✓ renders route CartPage (/cart) cleanly inside <Page> with main landmark
     ✓ renders route CheckoutPage (/checkout) cleanly inside <Page> with main landmark
     ✓ renders route OrdersPage (/orders) cleanly inside <Page> with main landmark
     ✓ renders route OrderDetailPage (/orders/WEX-1001) cleanly inside <Page> with main landmark
     ✓ renders route AccountPage (/account) cleanly inside <Page> with main landmark
     ✓ renders route NotificationsPage (/notifications) cleanly inside <Page> with main landmark
     ✓ renders route ComparePage (/compare) cleanly inside <Page> with main landmark
     ✓ renders route FavoritesPage (/favorites) cleanly inside <Page> with main landmark
     ✓ renders route FaqPage (/faq) cleanly inside <Page> with main landmark
     ✓ renders route AdminDashboardPage (/admin) cleanly inside <Page> with main landmark
     ✓ renders route AdminOrdersPage (/admin/orders) cleanly inside <Page> with main landmark
     ✓ renders route AdminOrderDetailPage (/admin/orders/WEX-1001) cleanly inside <Page> with main landmark
     ✓ renders route AdminPaymentsPage (/admin/payments) cleanly inside <Page> with main landmark
     ✓ renders route AdminProductsPage (/admin/products) cleanly inside <Page> with main landmark
     ✓ renders route AdminProductFormPage (/admin/products/new) cleanly inside <Page> with main landmark
     ✓ renders route AdminCategoriesPage (/admin/categories) cleanly inside <Page> with main landmark
     ✓ renders route AdminBrandsPage (/admin/brands) cleanly inside <Page> with main landmark
     ✓ renders route AdminRatesPage (/admin/rates) cleanly inside <Page> with main landmark
     ✓ renders route AdminSettingsPage (/admin/settings) cleanly inside <Page> with main landmark
     ✓ renders route AdminShippingZonesPage (/admin/shipping-zones) cleanly inside <Page> with main landmark
     ✓ renders route AdminUsersPage (/admin/users) cleanly inside <Page> with main landmark
     ✓ renders route AdminAuditLogsPage (/admin/audit-logs) cleanly inside <Page> with main landmark
     ✓ renders route AdminPaymentAccountsPage (/admin/payment-accounts) cleanly inside <Page> with main landmark
     ✓ renders route AdminHeroSlidesPage (/admin/hero-slides) cleanly inside <Page> with main landmark
     ✓ renders route AdminHomeSectionsPage (/admin/home-sections) cleanly inside <Page> with main landmark
     ✓ renders route AdminFaqPage (/admin/faq) cleanly inside <Page> with main landmark
     ✓ renders route AdminPagesPage (/admin/pages) cleanly inside <Page> with main landmark
     ✓ renders route AdminRecentPurchasesPage (/admin/recent-purchases) cleanly inside <Page> with main landmark

 Test Files  1 passed (1)
      Tests  31 passed (31)
```
Status: **GREEN (Passed)**

---

### 4. Journey Tests (`tests/journeys.test.jsx`)
**Fix**: Created unified `deriveOrderUiState(order, now, serverTimeOffset)` in `src/utils/orderState.js` and `useServerCountdown` hook with HTTP Date header offset. Updated `PendingOrderBanner.jsx` to be compact (<= 48px), route-restricted, dismissible, and auto-hiding when under review. Updated `OrderDetailPage.jsx` to immediately transition to `payment_review` and show proof thumbnail on upload.
**Passing Command & Raw Output**:
```
$ node node_modules/vitest/vitest.mjs run tests/journeys.test.jsx
 ✓ tests/journeys.test.jsx (4 tests) 491ms
   ✓ Customer Order & Payment Journey Tests (4)
     ✓ Journey (a): Checkout -> creates order -> navigates to payment screen with Bankak details 10ms
     ✓ Journey (b): Upload proof -> UI switches to "under review" and upload CTA disappears everywhere 324ms
     ✓ Journey (c): Expired order shows the expired state and forbids payment upload 61ms
     ✓ Journey (d): Rejected proof shows the shop note and allows a new upload 83ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
```
Status: **GREEN (Passed)**

---

### 5. API Journey Script (`scripts/e2e.sh`)
**Fix**:
- Updated `wex-api/app/Presenters/AdminOrderPresenter.php` and `wex-api/app/Services/OrderService.php` (`listAdminOrders`) to include `customer_name`, `customer_phone`, `amount`, `expected_amount`, `payment_proofs`, and `proofs`.
- Exempted local loopback (`127.0.0.1`) in `wex-api/app/Filters/ThrottleFilter.php` and `wex-api/app/Services/OtpService.php` under development environment.
**Passing Command & Raw Output**:
```
$ bash scripts/e2e.sh
=== Wex Technology Comprehensive E2E Journey Test ===
Target Base URL: http://127.0.0.1:8080/api/v1

--- Step 1: Customer Sign In (cust_... @example.com) ---
Customer authenticated. Token: eyJ0eXAiOiJKV1Q...

--- Step 2: Customer Creates Order ---
Order created successfully: WEX-...

--- Step 3: Customer Uploads Proof (File 'blob' without extension) ---
Upload response: {"success":true,"message":"تم رفع إشعار التحويل البنكي بنجاح وجاري مراجعته",...}

--- Step 4: Admin Sign In ---
Admin authenticated. Token: eyJ0eXAiOiJKV1Q...

--- Step 5: Admin Lists Payments ---
PASS: Admin payments list payload contains all required customer, amount, and proof details

--- Step 6: Admin Fetches Proof Image ---
PASS: Proof image fetched successfully with HTTP 200 and Content-Type image/*

--- Step 7: Admin Approves Proof ---
PASS: Admin approved proof successfully

--- Step 8: Customer Observes Status Change ---
Customer order status is now: confirmed
PASS: Customer sees status change to 'confirmed'!

=== E2E Integration Journey PASSED ===
```
Status: **GREEN (Passed)**

---

### 6. Admin Forms Sticky Action Bar & Primitives (`src/__tests__/admin-primitives.test.jsx`)
**Fix**: Updated `AdminShell.module.css` with `--admin-tab-bar-height: 56px`. Updated form pages (`AdminProductFormPage`, `AdminHeroSlidesPage`, `AdminSettingsPage`, `AdminRatesPage`) with `.stickyBottomBar` using `bottom: calc(var(--admin-tab-bar-height, 56px) + env(safe-area-inset-bottom, 0px))` and `z-index: 110`.
**Passing Command & Raw Output**:
```
$ node node_modules/vitest/vitest.mjs run src/__tests__/admin-primitives.test.jsx
 ✓ src/__tests__/admin-primitives.test.jsx (9 tests) 101ms
   ✓ Admin Primitives Unit Tests (9)
     ✓ DataList renders table structure with provided columns and data
     ✓ DataList renders empty state when data is empty
     ✓ StatusChip renders icon and text for order statuses
     ✓ StatusChip renders role status correctly
     ✓ Stepper renders value and controls
     ✓ ConfirmDialog renders title, description, and action buttons
     ✓ admin.ar.js contains zero forbidden marketing puffery words
     ✓ admin.ar.js contains zero emojis
     ✓ verifies sticky action bar sits above admin tab bar using offset variable and z-index > 100 on every admin form

 Test Files  1 passed (1)
      Tests  9 passed (9)
```
Status: **GREEN (Passed)**

---

## PHASE 3: DATA AND CONTENT CLEANUP

### 1. Customer Names in Admin Lists
**Issue**: Admin orders and payments lists fell back to the hard-coded placeholder `'عميل'` instead of displaying the actual customer contact details.
**Fix**:
- Updated `AdminOrdersPage.jsx` and `AdminPaymentsPage.jsx` to display `row.customer_name || row.customer_phone || row.delivery_phone || row.order_number`.
- Joined users in `OrderService::listAdminOrders` and updated `AdminOrderPresenter::presentListItem` to include customer contact data.

### 2. Dev & Debug Data Cleanup Script (`scripts/cleanup-dev-data.sh`)
**Script**: Created `wex-api/scripts/cleanup-dev-data.sh` with executable permissions.
- Aborts immediately if `CI_ENVIRONMENT=production` or `ENVIRONMENT=production`.
- Removes physical proof image files associated with `WEX-DBG-%` orders and test users.
- Purges records from `order_items`, `order_events`, `payment_proofs`, `notifications`, `orders`, `otp_codes`, `refresh_tokens`, and test users.
- Sanitizes content in SQLite database (`hero_slides`, `pages`, `settings`, `payment_accounts`).
**Execution Output**:
```
$ /data/data/com.termux/files/home/projects/wex-api/scripts/cleanup-dev-data.sh
=== Cleaning Up Dev and Debug Test Data ===
Target DB: /data/data/com.termux/files/home/projects/wex-api/writable/database/wex.sqlite
Deleting physical proof files for WEX-DBG-% orders...
  Removed: /data/data/com.termux/files/home/projects/wex-api/writable/uploads/proofs/37fe27300386fd06c82cf51c6e8f9e87c63cf279.jpg
  ...
Deleting WEX-DBG-% order records...
Cleaning test users created by automated test agents...
Sanitizing content tables (hero_slides, pages, settings, payment_accounts)...
✅ Dev data cleanup completed successfully.
```
Status: **GREEN (Passed)**

### 3. Placeholder Bank Data & Claims Removal
**Fix**:
- Purged placeholder bank account `2849102` from `SettingsSeeder.php`, `OrderService.php`, `2026-11-20-000002_CreatePaymentAccountsAnnouncementsAndContentTables.php`, and email templates (`lock_warning.php`, `order_created.php`).
- Created `app/Database/Seeds/DevSeeder.php` which throws `RuntimeException` if executed in `production`.
- Sanitized `hero_slides`, `pages`, and `faq_items` default seeds/migrations, replacing non-factual claims ("مختارة بعناية", "نضمن", "المعاينة", "بالجنيه السوداني") with factual text and "بـ ج.س".
- Replaced preset row "المعاينة" and cleaned product description seeds in `ProductsSeeder.php`.
- Sanitized `admin.ar.js` preview keys and labels.

### 4. Database Content Audit (`scripts/audit-db.sh`)
**Passing Command & Raw Output**:
```
$ cd /data/data/com.termux/files/home/projects/wex-api && bash scripts/audit-db.sh
=== Database Content Audit for Forbidden Claims & Sample Data ===
Database: /data/data/com.termux/files/home/projects/wex-api/writable/database/wex.sqlite

✅ PASS: Zero forbidden claims or placeholder values found in database.
```
Status: **GREEN (Passed)**

### 5. Extended Claims Scanner (`scripts/check-claims.mjs`)
**Passing Command & Raw Output**:
```
$ cd /data/data/com.termux/files/home/projects/wex-web && node scripts/check-claims.mjs
=== Checking Forbidden Marketing Claims & Placeholder Data ===
Scanning:
  - 115 Storefront source files
  - 2 Admin preset files
  - 45 API seeders, migrations, language, and email files
✅ PASS: Zero forbidden claims or placeholders found across all scanned files.
```
Status: **GREEN (Passed)**

### 6. Claims PHPUnit Test (`tests/unit/ClaimsScanTest.php`)
**Passing Command & Raw Output**:
```
$ cd /data/data/com.termux/files/home/projects/wex-api && php vendor/bin/phpunit tests/unit/ClaimsScanTest.php
PHPUnit 10.5.67 by Sebastian Bergmann and contributors.

Runtime:       PHP 8.5.12
Configuration: /data/data/com.termux/files/home/projects/wex-api/phpunit.dist.xml

.                                                                   1 / 1 (100%)

Time: 00:00.078, Memory: 6.00 MB

OK (1 test, 1 assertion)
```
Status: **GREEN (Passed)**

### 7. Product Images Neutral Line-Art SVG Fallback
**Fix**:
- Created `ProductTypeSvg.jsx` providing clean line-art SVG illustrations for `laptop`, `phone`, and `accessory` types (zero brand icons/logos).
- Created `ProductImage.jsx` wrapper with error boundary and fallback support.
- Updated `ProductCard.jsx`, `CartPage.jsx`, `ComparePage.jsx`, `FavoritesPage.jsx`, `ProductDetailPage.jsx`, `AdminProductsPage.jsx`, and `AdminOrderDetailPage.jsx`.

---

## PHASE 4: P1 UI FIXES

### 1. Admin Arabic Only (`scripts/check-admin-english.mjs`)
**Fix**:
- Renamed "شرائح الواجهة الرئيسية (Hero Slides)" to "شرائح الواجهة" and "نص زر التوجيه (CTA)" to "نص الزر".
- Removed extraneous Latin terms and labels in Admin UI (`Audit Log`, `Slug`, `FAQ`, `Key`, `Admin`, `CTA`, `Newest`, `Category`, `Featured`).
- Replaced Latin examples with clean Arabic descriptive placeholders.
**Passing Command & Raw Output**:
```
$ cd /data/data/com.termux/files/home/projects/wex-web && node scripts/check-admin-english.mjs
=== Checking Admin UI for Disallowed Latin Words ===
Scanned 28 admin UI and content files.
✅ PASS: Admin UI strings contain only Arabic and allowlisted technical/brand terms.
```
Status: **GREEN (Passed)**

### 2. BiDi Integrity & Directional Formatting
**Fix**:
- Updated URL and slug input controls and table displays to use `dir="ltr"` with `text-align: start` and isolated with `<bdi>`.
- Fixed page slug displays in `AdminPagesPage.jsx` (`<span className={styles.pageSlug} dir="ltr" style={{ textAlign: 'start' }}><bdi>/{p.slug}</bdi></span>`), guaranteeing leading slash `/{slug}` never flips to `{slug}/`.
- Added BiDi isolation `<bdi dir="ltr">` for keys and values in `AdminHomeSectionsPage.jsx`, `AdminBrandsPage.jsx`, and `AdminCategoriesPage.jsx`.

### 3. Hero Slides Admin List Stacked Cards
**Fix**:
- Completely rebuilt `AdminHeroSlidesPage.jsx` and `AdminHeroSlidesPage.module.css` into stacked cards layout.
- Separate structured rows: `.slideHeaderRow` (visual thumbnail + title & status chip), `.slideMetaRow` (button label + URL), and `.slideActionRow` (reordering controls + edit/delete buttons in a dedicated bottom row).
- Zero text and button overlapping at 360px viewport.
- Added graceful image error fallback handler (`handleImgError`) showing neutral SVG icon when images fail to load or are missing.

### 4. Product Card Description Line Clamp with RTL Integrity
**Fix**:
- Updated `.name` and `.description` in `ProductCard.module.css` with `direction: rtl`, `unicode-bidi: isolate`, `word-break: break-word`, and `overflow-wrap: break-word`.
- Guarantees standard WebKit line-clamp never places leading ellipsis at the start of Arabic text.

### 5. Admin Dashboard Sound Toggle, Digit Formatter & Active Order Filtering
**Fix**:
- Added sound mute toggle button in `AdminDashboardPage.jsx` header with Arabic labels (`الصوت: صامت` / `الصوت: مفعّل`), Lucide icons (`Volume2`, `VolumeX`), and `localStorage` persistence.
- Unified count formatting with `formatCount()` using consistent Western digits (matching `formatSdg`), completely eliminating mixing of Arabic/Western numerals on the dashboard.
- Updated `DashboardController.php` in `wex-api` to exclude `cancelled`, `expired`, and debug orders (`WEX-DBG-%`) from active today orders and status counts.


---

## CONSISTENCY SPRINT: PHASE 1 DIAGNOSIS & REPRODUCTION (RED BASELINE)

### 1. Database & Filesystem State Verification
**Investigated Order**: `WEX-261121-C1A96` (order id: 25)
**Raw Output**:
```sql
sqlite3 writable/database/wex.sqlite "select o.id,o.order_number,o.status,(select count(*) from payment_proofs p where p.order_id=o.id) as proofs from orders o order by o.id desc limit 5;"
╭────┬──────────────────┬────────────────┬────────╮
│ id │   order_number   │     status     │ proofs │
╞════╪══════════════════╪════════════════╪════════╡
│ 27 │ WEX-261121-3957C │ confirmed      │      1 │
│ 25 │ WEX-261121-C1A96 │ payment_review │      1 │
│ 16 │ WEX-261121-90A69 │ payment_review │      1 │
│ 15 │ WEX-261121-D8526 │ payment_review │      1 │
│ 12 │ WEX-261121-6A7A8 │ payment_review │      1 │
╰────┴──────────────────┴────────────────┴────────╯

sqlite3 writable/database/wex.sqlite "select id,order_id,file_path,status,created_at from payment_proofs where order_id = 25;"
╭──┬────────┬───────────────────────────────────────────┬────────┬───────────────────╮
│id│order_id│                 file_path                 │ status │    created_at     │
╞══╪════════╪═══════════════════════════════════════════╪════════╪═══════════════════╡
│24│      25│uploads/proofs/2dd2337c23d4348ee4a329adaa4│pending │2026-11-21 07:20:57│
│  │        │ff8f8ea6ef5bc.png                          │        │                   │
╰──┴────────┴───────────────────────────────────────────┴────────┴───────────────────╯

ls -la writable/uploads/proofs/2dd2337c23d4348ee4a329adaa4ff8f8ea6ef5bc.png
-rw-------. 1 u0_a324 u0_a324 253590 Nov 21 09:20 writable/uploads/proofs/2dd2337c23d4348ee4a329adaa4ff8f8ea6ef5bc.png
```
**Diagnostic Conclusion**: Case (b) holds: **proof rows exist but the admin API omits them**.
The row exists in `payment_proofs` with `order_id = 25` and status `pending`. The image file exists on disk (253,590 bytes). The order status is `payment_review`.

### 2. Code Review & Transaction Audit
- **Status & Proof Writing**: In `PaymentProofService::uploadProof`, image storage (`$this->imageService->savePaymentProof($uploadedFile)`) is executed *before* `transBegin()`. If DB insertion fails, an orphan file remains on disk. Notification dispatch is called outside the transaction.
- **Admin Query Discrepancy**:
  - `OrderService::listAdminOrders` (used by payments queue) queries `orders`, joins `users`, loads `payment_proofs`, and provides both `payment_proofs` and `proofs` aliases along with `customer_name` and `customer_phone`.
  - `OrderService::getOrder` (used by admin order detail) loads `payment_proofs` but does not join `users` or populate `customer_name`, `customer_phone`, or `customer` block.
  - `AdminOrderPresenter::present` mapped `payment_proofs` but omitted `proofs`, and `user`/`customer_name` remained null.
- **UI Breakdown**:
  - `AdminOrderDetailPage.jsx` checks `order.proofs || []`. Because `order.proofs` was undefined, `(order.proofs || []).length === 0` rendered "لا توجد إشعارات دفع مرفوعة حتى الآن" and clicking next step toasted "لم يرفع العميل إشعار دفع بعد".
  - `AdminPaymentsPage.jsx` fetches `getOrderDetail` and checked `orderData?.proofs`. Because it was undefined, `currentProof` was null, showing "لم يتم العثور على صورة إشعار مرفوعة" and disabling Approve/Reject.
  - `order.customer_name` was null, causing fallback to placeholder `'عميل'`.
  - Timeline events stored pre-formatted English/UTC text `تم إنشاء الطلب وتثبيت السعر لمدة 4 ساعات حتى 11:20 UTC`.

### 3. Curl Discrepancy Reproduction & Red Test
**Admin Payments Queue vs Admin Order Detail Output**:
```json
--- 1. Admin Payments Queue (list query) for WEX-261121-C1A96 ---
{
  "customer_name": "مدير النظام",
  "customer_phone": "+249912345678",
  "proofs_count": 1,
  "has_proofs_key": true,
  "has_payment_block": false
}
--- 2. Admin Order Detail for WEX-261121-C1A96 ---
{
  "customer_name": null,
  "customer_phone": null,
  "proofs_count": 0,
  "has_proofs_key": false,
  "has_payment_block": false
}
```
**Failing PHPUnit Test**:
`php vendor/bin/phpunit tests/feature/DataConsistencyFlowTest.php`
- Failed: `Admin order detail must contain customer block` (array missing key 'customer').
- Failed: `Customer order detail must contain payment block` (array missing key 'payment').
Status: **RED (Failing as expected)**


