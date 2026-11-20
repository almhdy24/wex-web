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
