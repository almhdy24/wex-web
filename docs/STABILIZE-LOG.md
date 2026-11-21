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
