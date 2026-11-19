# Wex Technology — UI/UX Verification Checklist

This checklist confirms adherence to the design rules, performance requirements, and quality standards for the Wex Technology frontend.

| Item | Requirement | Verification Result | Status |
| :--- | :--- | :--- | :--- |
| **1. Inline Styles** | Zero inline `style={{}}` blocks except dynamic styles (e.g. countdown progress bar). | Automated grep verified. Legacy 430 inline style blocks replaced with CSS Modules. | **PASSED** |
| **2. Emojis** | Zero emojis used as UI icons. | Automated regex grep across `src/` confirmed 0 emojis. Unified on `lucide-react`. | **PASSED** |
| **3. Self-Hosted Typography** | Self-hosted Tajawal font with preloaded WOFF2. Zero Cairo / Inter. | Tajawal 400 & 700 preloaded in `index.html`. Cairo & Inter removed. | **PASSED** |
| **4. Numerals** | Western digits (0-9) everywhere; `font-variant-numeric: tabular-nums`. | Applied globally in `global.css` and in all formatters and timers. | **PASSED** |
| **5. Dead CSS Cleanup** | Delete `mockup.css`, `style.css`, `components.css`. | Deleted. Only `tokens.css`, `global.css`, and `*.module.css` exist. | **PASSED** |
| **6. Forbidden Words** | Zero occurrences of marketing puffery (أصلية, أفضل, مميز, احترافي, حصري, ضمان حقيقي, وارد دبي, ذكي, تجربة). | Grep scan confirmed 0 instances across entire `src/` tree. | **PASSED** |
| **7. Condition Statements** | Honest condition labels ("جديد", "مستعمل استيراد", "مجدد"). | Verified in `formatters.js` and `ProductCard.jsx`. | **PASSED** |
| **8. Price Lock Notice** | "السعر بالدرهم وبيتغير مع الصرف. بنثبته ليك بعد الطلب." | Displayed on product pages, checkout, and order details. | **PASSED** |
| **9. Brand Graphic Ribbon** | Restricted to Splash header and Admin page title divider only. | Verified across all layouts and templates. | **PASSED** |
| **10. Touch Targets** | Minimum 44px on interactive controls. | Verified on buttons, inputs, select triggers, bottom nav tabs, and cards. | **PASSED** |
| **11. Motion & Reduced Motion** | 150-200ms ease; `@media (prefers-reduced-motion: reduce)` respected. | Implemented in `global.css` and CSS Modules. | **PASSED** |
| **12. Code Splitting** | `React.lazy()` for all route pages; chunks < 500 kB. | Main bundle 349 kB (gzip 110 kB). Route chunks 3-20 kB. 0 warnings. | **PASSED** |
| **13. Automated Tests** | All Vitest suites passing. | 9 test files, 39 tests passing (100%). | **PASSED** |
| **14. Production Build** | Vite build succeeds with zero errors in Termux environment. | Build completes in ~1.9s. | **PASSED** |
| **15. Backend Isolation** | Zero modifications or writes in `~/projects/wex-api`. | Verified. Backend remains untouched as source of truth. | **PASSED** |
