# Architecture Decision Records (ADRs) — Wex Technology Web

## ADR-001: Three-Tier Responsive Architecture (Replacing Fixed 480px Column)

### Date: 2026-11-20
### Status: Accepted
### Context
The original storefront design constrained the interface to a single 480px centered mobile-app-style column across all display viewports. While optimal for mobile parity with the original prototype, this created significant empty gutters and awkward ergonomics on tablets and desktop browsers.

### Decision
The previous rule "one 480px column on every device" is officially replaced by **three distinct layout tiers** sharing the same design language, brand tokens, components, data models, and Fusha Arabic dictionary:

1. **Phone Tier (`< 640px`)**:
   - 480px max-width mobile application shell.
   - Fixed 56px App Bar (logo right, notifications bell, cart button).
   - Fixed 56px Bottom Tab Bar (الرئيسية، المتجر، طلباتي، حسابي).
   - Bottom sheets for filters and menus.
   - Single or dual column scrolling rails.

2. **Tablet Tier (`640px – 1023px`)**:
   - Wider application shell container with fluid grid (up to 768px).
   - 3-column product cards.
   - Bottom Tab Bar remains active for ergonomic thumb access.
   - Sheets adapt to centered modal dialogs (max-width 560px).

3. **Desktop Tier (`>= 1024px`)**:
   - Proper desktop web application layout with container max-width 1240px.
   - Sticky 72px Desktop Header: logo (>= 140px), primary nav with animated underline, wide search bar with live auto-complete dropdown, notifications popover, cart slide drawer trigger, and account dropdown menu.
   - Top status bar: working hours indicator ("مفتوح الآن / مغلق حالياً") and contact shortcuts.
   - 4-column rich desktop footer with shop location and links.
   - Two-column layouts on Catalog (sticky sidebar filter + 3/4-column product grid), Product Details (large gallery zoom + sticky buy box + specs table), Cart & Checkout (forms + sticky order summary), and Order Details (countdown & bank card + timeline).
   - Floating WhatsApp button is removed on desktop in favor of header/footer contact links.

### Implementation Guidelines
- Responsive adaptations must prioritize **CSS media queries (`@media (min-width: ...)`), container queries (`@container`), and fluid clamp calculations**.
- A lightweight `useViewport` hook is used strictly for structural switches where HTML tree composition differs (e.g., side drawer vs modal sheet, AppShell vs DesktopShell).
- **Zero layout drift or code duplication:** Pages, route components, and business hooks remain shared.
- Performance budgets: Initial JS <= 170 kB gzip, CSS <= 45 kB gzip. Desktop-only structural fragments are code-split and loaded on demand.

---

## ADR-002: Universal UX Improvements & Desktop Interactions

### Date: 2026-11-20
### Status: Accepted
### Context
Improving the customer storefront required solving real-world Sudanese commerce friction points across all devices (phones, tablets, desktop):
- Volatile mobile connections leading to lost form data.
- Unnecessary sign-in barriers prior to checkout that caused cart abandonment.
- Non-standard phone formatting causing failed order creation.
- Accidental item deletion in the cart without recovery.
- Need for quick side-by-side spec comparison and device bookmarking without requiring account sign-in.
- Clunky file upload on desktop for Bankak transaction screenshots.

### Decisions
1. **Guest-Friendly Checkout & Return-To Flow:**
   - Browsing, catalog search, cart operations, favorites, and comparison never require authentication.
   - At checkout submission, unauthenticated customers have their full form draft preserved in `sessionStorage` and are routed to `/login?returnTo=/checkout`.
   - Post-authentication or verification, the customer returns directly to `/checkout` with their cart and draft intact.
2. **Undo Pattern for Cart Deletions:**
   - Removing an item from the cart triggers a 5-second action toast with "تراجع" (Undo).
   - If clicked, the item is restored to the cart at its previous quantity using `restoreItem()`.
3. **Local-First Comparison & Favorites:**
   - Customers can add up to 3 devices to a comparison matrix (`/compare`), highlighting differences across CPU, GPU, RAM, storage, and screen size.
   - Favorite heart button on cards and product detail page saves to `localStorage` (`/favorites`) with instant optimistic feedback.
4. **Sudanese Mobile Phone Normalization:**
   - Normalization utility `normalizeSudanPhone` handles `09XXXXXXXX`, `01XXXXXXXX`, `+249...`, and raw 9-digit formats, standardizing to clean local representation.
   - Last used phone number and delivery address persist in `localStorage` for returning visits.
5. **Desktop Interactions & Overlays:**
   - Keyboard shortcuts: `/` focuses desktop search bar; `Escape` closes any open drawer, modal, or popover.
   - Desktop cart opens as a high-performance slide drawer (`CartDrawer.jsx`) rather than forcing navigation away from the current page.
   - Receipt upload dropzone supports drag-and-drop file drop AND direct clipboard paste (`Ctrl+V` screenshot pasting) in addition to the standard file picker.
   - Hover states use `transform: translateY(-4px)` with soft shadows, constrained strictly to hover-capable devices (`@media (hover: hover) and (pointer: fine)`).
6. **Fusha Copy & Zero AED/Rate Customer Leakage:**
   - All customer-facing copy resides in `src/content/ar.js`.
   - Customers see prices strictly in SDG (`ج.س`). Reference currency (`AED`) and numerical exchange rates remain strictly private to the store administration.
   - Prohibited marketing fluff ("أصيل", "أصلي", "ذكية", "الأفضل") replaced with precise technical and honest descriptions.

---

## ADR-003: Ground-Up Admin Panel Redesign for Sudanese Retail Operations

### Date: 2026-11-20
### Status: Accepted
### Context
The store owner and retail staff in Omdurman, Sudan, manage store operations under challenging local infrastructure (intermittent power, high-latency 3G/4G connections, and heavy volume of Bankak mobile banking receipts). Daily operations require rapid review of Bankak payment proofs, moving orders through dispatch stages, updating volatile exchange rates, and inventory management on both smartphones (often one-handed) and desktop PCs.

### Decisions
1. **Three-Tier Adaptive Admin Shell (`AdminShell.jsx`):**
   - **Phone (`< 768px`)**: Top app bar with contextual action + bottom 5-tab bar (اليوم، الطلبات، المدفوعات [with live unread badge]، المنتجات، المزيد). Tables convert to touch-friendly cards via `<DataList>`. Form controls have sticky bottom action bars.
   - **Tablet (`768px – 1023px`)**: 64px collapsed icon sidebar rail + fluid content.
   - **Desktop (`>= 1024px`)**: 240px collapsible sidebar with labels, sticky top bar with multi-entity global search (order #, customer phone, product name with `Ctrl/Cmd+K` shortcut), live exchange rate indicator labeled "للإدارة فقط", notifications, audio chime toggle, and idle warning indicator.

2. **Shared Responsive `<DataList>` Component:**
   - Single component rendering an accessible data table on desktop/tablet (sticky header, sortable columns, row hover) and clean touch cards on phone from the same column definitions.

3. **Top Daily Workflow 1: Bankak Payment Proofs Review Queue (`AdminPaymentsPage.jsx`):**
   - Queue sorted oldest first with countdown badge showing remaining price lock time.
   - Hardware-accelerated `ImageViewer` (transform-only zoom, pan, 90° rotate) fetching authorized blob image and revoking `URL.revokeObjectURL(prevUrl)` on cleanup to eliminate memory leaks on 4 GB RAM devices.
   - Compact "المطلوب" panel: order number, customer name and phone (1-tap call & WhatsApp), expected amount with 1-tap copy, sender name, transfer reference, and upload time.
   - Decisions: "قبول" with exact amount confirmation; "رفض" requiring quick-fill canned rejection chips (`المبلغ المحول أقل من المطلوب`, `الإشعار غير واضح`, etc.) + optional customer note. Auto-advances to next review item.
   - Desktop keyboard shortcuts: `A` (approve), `R` (reject), `J` (next), `K` (previous).

4. **Top Daily Workflow 2: Order Management & Next-Step Actions (`AdminOrderDetailPage.jsx`):**
   - Prominent contextual primary next-step button determined by order status (`pending_payment`/`payment_review` -> "مراجعة إشعار الدفع واعتماده", `confirmed` -> "بدء تجهيز الطلب بالمحل", `processing` [delivery] -> "تسليم لمندوب التوصيل", `processing` [pickup] -> "جاهز للاستلام بالمحل", `ready_for_pickup`/`out_for_delivery` -> "تم التسليم للعميل بنجاح").
   - Courier dispatch modal requiring courier name & phone for delivery orders.
   - 1-tap customer contact bar (`tel:` and prefilled WhatsApp template `wa.me`).
   - Printable invoice slip styled via `@media print`.

5. **Top Daily Workflow 3: Daily Exchange Rate Update (`AdminRatesPage.jsx`):**
   - Active exchange rate prominently displayed with last updated date, creator, and "للإدارة فقط" badge.
   - Price impact preview: calculates old SDG -> new SDG and difference on sample devices across price tiers (cheapest, median, most expensive).
   - Safeguard warning if proposed change exceeds 10% from active rate.
   - Dependency-free SVG sparkline chart of 30-day rate history.

6. **Product Catalog & Multi-Section Form (`AdminProductsPage.jsx`, `AdminProductFormPage.jsx`):**
   - Inline numeric `<Stepper>` for quick stock adjustments directly in the table/cards without opening the full edit form.
   - 1-tap active/inactive visibility toggle with instant optimistic update.
   - "تكرار المنتج" action: clones product with `(نسخة)` appended to title, `is_active: 0`, and redirects to edit.
   - Bulk actions toolbar: activate, deactivate, delete with confirmation dialog.
   - Multi-section product form with floating section index (desktop) and sticky horizontal pills (phone) for: البيانات الأساسية، السعر والمخزون، الصور، المواصفات الفنية، والملحقات.
   - Client-side image auto-compression before upload (max 1600px, JPEG quality 0.8, < 800 KB).
   - Specs presets for laptops, phones, accessories plus custom dynamic rows.

7. **Role-Based Access Control & Navigation Boundaries:**
   - Staff role has access strictly to `/admin`, `/admin/orders`, and `/admin/payments`. Admin-only links (`products`, `rates`, `settings`, `shipping-zones`, `users`, `audit-logs`) are hidden from navigation and guarded by `RoleGuard`.
   - When a customer attempts to access `/admin`, `RoleGuard` displays an honest store return prompt ("هذه الصفحة مخصصة لإدارة المتجر") with a primary CTA button to return to the shop.
   - Sign-in redirects: admin and staff sign-ins automatically redirect to `/admin`.

8. **Standalone Admin PWA & Session Security:**
   - Independent Admin PWA manifest (`public/admin-manifest.webmanifest`, name "ويكس - الإدارة", start_url `/admin`).
   - Dynamically swaps manifest link in `document.head` when on `/admin` and restores storefront manifest when navigating back.
   - Inactivity timer (`useIdleTimer`): warns at 25 minutes of inactivity, signs out at 30 minutes.

9. **Strict Price Rule & Copy Standards:**
   - Customers see prices in SDG only; AED and exchange rates are strictly admin-only and labeled with "للإدارة فقط".
   - Modern Standard Arabic copy dictionary (`src/content/admin.ar.js`), Western digits (`0-9`), zero emojis (Lucide icons only), and zero marketing puffery.
