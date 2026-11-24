# Wex Web & API Codebase Audit & Fix Log

File-by-file comprehensive review of `src/` and `wex-api` in execution order.

| File Path | Issues Found | Fix Applied / Status |
|-----------|--------------|----------------------|
| `src/styles/tokens.css` | `--glass-bg: #FFFFFF` caused white-on-white text/icons | Retained token, updated `.navy .headerBtn` and hero action buttons to use translucent glass overlay `rgba(255, 255, 255, 0.14)`. |
| `src/styles/global.css` | Global `img, svg { display: block }` could conflict with button inline icons | Reinforced inline SVG overrides for interactive elements. |
| `src/utils/formatters.js` | `formatDate` included military time via `formatDateSafe(..., true)`, causing double-time string in `OrderDate.jsx` | Updated `formatDate` to output date only (`YYYY/MM/DD`); added `formatDateTime` for explicit composite needs. |
| `src/utils/shopSettings.js` | Mixed Latin `'ويكس تكنولوجي - Wex Technology'` in default shop settings | Cleaned to Modern Standard Arabic `'ويكس تكنولوجي'`. |
| `src/components/common/OrderNumber.jsx` | Hash `#` rendered outside `<bdi dir="ltr">`, susceptible to RTL bidi flipping | Moved `#` directly inside `<bdi dir="ltr">#{clean}</bdi>`. |
| `src/components/common/AppBar.jsx` | Raw inline SVGs, missing aria-labels, buttons showing white squares in navy mode, badges on opposite corner | Switched to Lucide icons (`ArrowRight`, `Bell`, `Heart`, `ShoppingCart`), 44px min touch target, top-start badge positioning, added `headerContent` slot. |
| `src/components/common/AppBar.module.css` | `.navy .headerBtn` used solid white background with white icon; badges anchored incorrectly | Updated to translucent white glass background with border, top-start badge corner alignment. |
| `src/components/common/BottomTabBar.jsx` | Account tab showed unread count badge ("3"); badge anchored to entire 56px button rather than icon | Removed badge from Account tab; wrapped icon in `.iconWrap` so badge anchors to top-start corner of 24px icon. |
| `src/components/common/BottomTabBar.module.css` | Detached badge coordinates | Added `.iconWrap` with relative positioning; badge anchored at `top: -6px; inset-inline-start: -6px;`. |
| `src/pages/store/HomePage.jsx` | Admin name rendered in storefront greeting; hero action buttons white-on-white; store hours missing Friday closed line | Sanitized greeting to display first name for customers only or neutral "مرحبًا بك"; added Friday closed line; fixed button glass styling. |
| `src/pages/store/HomePage.module.css` | 84px bottom hero padding caused huge dead space before search; category tiles hidden behind tab bar | Tightened hero padding to 40px, search margin to -20px, category tiles to 50px icon well with visible contrast. |
| `src/pages/store/OrderDetailPage.jsx` | Status chip collided with title in 320px header; countdown showed 00:00:00 on confirmed orders; bank account number lacked bidi isolation | Rebuilt header using dedicated rows via `headerContent`; hid countdown when confirmed or in review, displaying dedicated status cards; wrapped account number in `<bdi dir="ltr">`. |
| `src/pages/store/OrderDetailPage.module.css` | Missing classes for rebuilt header rows and confirmed/review state cards | Added `.orderHeaderContent`, `.orderHeaderTitleRow`, `.confirmedCard`, `.reviewCard`, etc. |
| `src/pages/store/AccountPage.module.css` | 56px bottom padding was lower than tab bar height (~110px), cutting off bottom controls | Updated to `padding-bottom: var(--tabbar-clearance-v2)`. |
| `src/pages/store/NotificationsPage.module.css` | Missing bottom clearance for bottom tab bar | Added `padding-bottom: var(--tabbar-clearance-v2)`. |
| `src/pages/store/ComparePage.module.css` | Fixed 60px bottom padding caused content overlap with tab bar | Updated to `padding-bottom: var(--tabbar-clearance-v2)`. |
| `src/pages/store/FaqPage.module.css` | Fixed 16px bottom padding caused content overlap with tab bar | Updated to `padding-bottom: var(--tabbar-clearance-v2)`. |
| `src/pages/admin/AdminSettingsPage.jsx` | Mixed Latin `'ويكس تكنولوجي - Wex Technology'` | Cleaned to Modern Standard Arabic `'ويكس تكنولوجي'`. |
| `wex-api/app/Database/Seeds/DevSeeder.php` | Mixed Latin `'Wex Technology - متجر التقنية'` | Cleaned to Modern Standard Arabic `'متجر التقنية'`. |
