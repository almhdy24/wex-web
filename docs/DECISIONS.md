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
