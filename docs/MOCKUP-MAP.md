# Wex Technology — Mockup Screen & Component Mapping (MOCKUP-MAP)

This document is the architectural specification and source-of-truth bridge mapping every screen from `~/projects/wex-mockup` (`index.html`, `css/style.css`, `js/app.js`, `js/data.js`) to the React application in `~/projects/wex-web`.

---

## 1. Global App Shell Framework

| Element / Layer | Mockup Source / Rule | App Shell Implementation | Notes |
| :--- | :--- | :--- | :--- |
| **Viewport Background** | `.desktop-viewport`: centered radial/solid ice background `#D9E6F6` / `#EAF3FF` | `StoreLayout.module.css`: `.shellWrapper` with centered flex container | Screens > 520px center the 480px frame with soft side shadow. |
| **App Shell Frame** | `.phone-frame` / `.app-container`: max-width `480px`, width `100%`, height `100dvh` | `StoreLayout.module.css`: `.appShell` with `height: 100dvh; max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; overflow: hidden;` | Strictly no 1200px container. Mobile-app feel on all devices. |
| **Safe Areas** | `env(safe-area-inset-top)` / `bottom` | `padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);` | Viewport meta: `viewport-fit=cover`. |
| **App Bar** | `.app-header`: height 56px, sticky top, background `#FFFFFF`, border-bottom `#EAF3FF`, z-index 80 | `AppBar.jsx` / `StoreLayout.jsx`: 56px fixed header, title or logo, back button (RTL arrow), actions (search, notifications with dot, cart) | Inner pages show back arrow `polyline points="9 18 15 12 9 6"`. |
| **Scroll Container** | `.screens-viewport`: `flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;` | `.contentArea` in `StoreLayout.jsx` | Only this middle section scrolls; tab bar and app bar stay locked. |
| **Bottom Tab Bar** | `.bottom-nav`: 56px height + safe area, 4 tabs (الرئيسية، المتجر، طلباتي، حسابي), active tab vivid blue `#1E6BFF`, unread badge | `BottomTabBar.jsx`: fixed bottom, exact SVG icons from mockup, hidden on Product/Cart/Checkout/OrderDetail | Replaced by sticky bottom action bar on Product & Checkout. |
| **Native Feedback** | `:active` press scale `.98`, `-webkit-tap-highlight-color: transparent`, `overscroll-behavior: contain`, `navigator.vibrate(10)` | Global CSS & component modules | Pure native feel, inputs at 16px to prevent iOS auto-zoom. |

---

## 2. Screen-by-Screen Element Mapping

### Screen 1: Splash (`#screen-splash`)
- **React Route / Component:** Handled in `AppShell` as initial overlay / `SplashScreen.jsx` (shown ~1.2s on first session visit, non-blocking if app is ready).
- **Background:** `radial-gradient(circle at 50% 30%, #061A55 0%, #030D2C 100%)`.
- **Slanted Ribbons:**
  1. Width 160%, height 60px, `background: var(--wex-grad-brand)`, `transform: rotate(-25deg)`, top 22%, opacity 0.85, blur 1px.
  2. Width 160%, height 40px, `background: linear-gradient(90deg, #1E6BFF 0%, #00B7FF 100%)`, top 32%, opacity 0.6.
  3. Width 160%, height 90px, `background: linear-gradient(90deg, #061A55 0%, #0B3FBF 100%)`, bottom 18%, opacity 0.7.
- **Logo Container:** White rounded card (border-radius 24px, padding 18px 24px, shadow `0 14px 40px rgba(0,0,0,0.35)`), image `assets/logo.png` (width 210px).
- **Location Subtitle:** `font-size: 13px; color: #00B7FF; font-weight: 600;` ("مول الواحة - الشهداء").
- **Loader:** 28px circular border spinner with cyan top border, skip button pill (`دخول المتجر ←`).

### Screen 2: Home (`#screen-home`)
- **React Route / Component:** `/` -> `HomePage.jsx` + `HomePage.module.css`.
- **Elements in Order:**
  1. **App Bar:** Wex Brand Logo (width 132px, min 120px) on right, Notification icon button (38px circle with cyan dot) on left.
  2. **Greeting & Rate Row:**
     - Right: "أهلاً بيك" (12px, gray-600) + "لابتوبات جديدة ومستعملة" (18px, navy 900).
     - Left: `.rate-chip` with pulsing cyan dot + "الدرهم اليوم: [rate] جنيه" (12px bold royal).
  3. **Search Input Bar:** Full width input (height 44px, radius 14px, border 1.5px gray-200, search SVG icon on right inset 14px).
  4. **App Discount Ribbon Banner (`.app-discount-banner.wex-ribbon`):**
     - Background: `var(--wex-grad-brand)` with rotated pseudo-element highlight.
     - Chip: "خصم الطلب بالتطبيق" (white on 25% white backdrop).
     - Title: "خصم 3% لو طلبت من التطبيق" (15px bold white).
     - Note: "السعر بيتثبت ليك لمدة 4 ساعات عشان تحول" (11px ice).
     - Circle Badge: 54px blur circle with `-3%` and `تخفيض`.
  5. **Categories Row (`.categories-scroll`):**
     - Header: "التصنيفات" (15px bold) + "عرض الكل" link.
     - Horizontal scroll chips: 52px icon bubble (radius 20px, ice border, shadow-sm, active: royal blue background with white icon) + title 11px bold navy.
     - Category types & icons: All (Laptop), New (Box), Used (Briefcase), Study (Graduation), Work (Briefcase), Gaming (Gamepad), Accessories (Mouse).
  6. **Featured Products Section:**
     - Header: "أجهزة مختارة" + "كل الأجهزة ←" link.
     - Grid: 2 columns (`grid-template-columns: 1fr 1fr; gap: 12px;`).
     - Product Card: 14px padding, 20px radius, 120px laptop image container with SVG illustration or API photo, condition badge top-right, brand, 2-line title, 2 spec pills (RAM, SSD), SDG price in bold 16px + currency suffix, AED reference price.
  7. **Price Lock Informational Banner (`.wex-ribbon-subtle`):**
     - Radius 20px, padding 14px, 6px gradient right border bar.
     - Title: "طريقة تثبيت السعر" (13px bold navy).
     - Description: "سعر اللابتوب بالدرهم وبيتغير مع الصرف. لما تطلب، بنثبت ليك السعر لمدة محددة وبتحول فيها. لو المدة انتهت بيرجع السعر للصرف الحالي."

### Screen 3: Catalog (`#screen-catalog`)
- **React Route / Component:** `/products` -> `CatalogPage.jsx` + `CatalogPage.module.css`.
- **Elements in Order:**
  1. **App Bar:** Back button (polyline), Title "الأجهزة المتوفرة ([count] أجهزة)", Reset filters button (refresh/rotate icon).
  2. **Search Input:** 13px font, search icon, keyword filtering.
  3. **Category Chips Bar (`.filter-chips-scroll`):** Horizontal scroll pills (الكل، جديد، مستعمل استيراد، للدراسة، للشغل، ألعاب).
  4. **Brand Chips & Sort Row:** Horizontal scroll brand pills (الكل، Dell, Lenovo, HP, Acer, Apple, Asus) + compact sort `<select>` (الترتيب، السعر: من الأقل، السعر: من الأعلى).
  5. **Product Grid:** 2 columns (`1fr 1fr`, gap 12px), renders product cards.
  6. **Empty State:** Centered card with message "ما في أجهزة مطابقة للبحث" and "عرض كل الأجهزة" reset button.

### Screen 4: Product Details (`#screen-product`)
- **React Route / Component:** `/products/:slug` -> `ProductDetailPage.jsx` + `ProductDetailPage.module.css`.
- **Elements in Order:**
  1. **App Bar:** Back button, Title "تفاصيل الجهاز", WhatsApp inquiry button (`openWhatsApp`).
  2. **Hero Image Card:** Height 180px, gradient `#FFFFFF` -> `#EAF3FF`, border 1px ice, condition chip ("مستعمل استيراد" / "جديد") + brand chip.
  3. **Title & Subtitle:** 20px extra-bold navy title + 13px vivid blue subtitle.
  4. **Price Box (`.wex-ribbon-subtle`):**
     - Big SDG price (24px 900 royal blue + 14px "جنيه") + small AED price (`(XXX درهم)`).
     - Rate chip on left: "الدرهم اليوم: [rate] جنيه".
     - Notice: "سعر اللابتوب بالدرهم وبيتغير مع الصرف. لما تطلب، بنثبت ليك السعر لمدة محددة وبتحول فيها. لو المدة انتهت بيرجع السعر للصرف الحالي."
  5. **Specs Table Card:** White card, radius 20px, 16px padding, title "مواصفات الجهاز", rows for CPU, RAM, Storage (SSD), GPU, Screen, Warranty.
  6. **Notes / Description Card:** White card, radius 20px, title "ملاحظات عن الجهاز:", paragraph text with line-height 1.6.
  7. **Sticky Bottom Action Bar:** Fixed above safe area, gradient background, large vivid gradient button (`.btn.btn-vivid`) "اطلب الآن" -> proceeds to checkout.

### Screen 5: Cart + Checkout (`#screen-checkout`)
- **React Route / Component:** `/cart` & `/checkout` -> `CheckoutPage.jsx` & `CartPage.jsx` + `Checkout.module.css`.
- **Elements in Order:**
  1. **App Bar:** Back button, Title "إتمام الطلب وتثبيت السعر".
  2. **Product Summary Card:** 70x60px image thumbnail, product name, specs snippet, SDG price.
  3. **Delivery Method Selector:**
     - 2 column options: "استلام من المحل (مجاني)" vs "توصيل (الرسوم حسب الولاية)".
     - Active selection box: 2px royal blue border, ice blue background.
     - If delivery selected: city dropdown (أم درمان، الخرطوم، بحري، ولايات أخرى) + detailed address input.
  4. **Financial Breakdown Card:**
     - Base price (`[AED] درهم × [rate] = [SDG] جنيه`).
     - App discount line (`-3%` in royal blue bold).
     - Delivery fee (`مجاني` or calculated fee).
     - Total to transfer: 22px 900 royal blue.
     - Rate used note: `سعر الصرف: [rate]`.
  5. **Notice Callout:** Amber card (`#FFFBEB`, border `#FCD34D`), "ملاحظة الدفع: الدفع كامل قبل التجهيز، للاستلام من المحل أو للتوصيل. السعر بيتثبت ليك لمدة [hours] ساعات عشان تحول في بنكك وترفع الإشعار."
  6. **Sticky Action Button:** `.btn.btn-vivid` "تثبيت السعر وإتمام الطلب".

### Screen 6: Price Lock + Payment Hero Screen (`#screen-lock`)
- **React Route / Component:** `/orders/:orderNumber` (when pending payment) -> `OrderDetailPage.jsx`.
- **Elements in Order:**
  1. **App Bar:** Back button, Title "تثبيت السعر والسداد", WhatsApp support button.
  2. **Hero Countdown Banner (`.price-lock-banner`):**
     - Dark navy background with cyan glow radial accent.
     - Lock header: `.lock-status-badge` "السعر مثبت" + Order `#XXXX`.
     - Subtitle: "الوقت المتبقي للتحويل ورفع الإشعار".
     - Digital Clock Boxes (LTR): `[HH]` ساعة `:` `[MM]` دقيقة `:` `[SS]` ثانية.
       - Boxes: 10px 14px padding, 26px bold digits, 9px unit label.
       - Colon: 24px cyan blinking separator.
       - If `< 1 hour`: banner switches to `.urgent` (reddish-burgundy gradient).
     - Locked Price Summary: Total SDG in 18px white bold + locked exchange rate in cyan.
  3. **Store Bank Details Card (`.bank-card`):**
     - Header: "بنك الخرطوم (تطبيق بنكك)" + branch + "تحويل بنكك" tag.
     - Account Number Row: 15px tabular navy digits + `.copy-badge-btn` ("نسخ").
     - Account Name Row: "Wex Technology".
     - Transfer Note: "اكتب رقم الطلب #[order_number]".
  4. **Receipt Upload Box:**
     - If not uploaded: `.receipt-dropzone` with dashed border `#B8D6FF`, file picker trigger, note "صورة عادية أو لقطة شاشة", and "تأكيد ورفع الإشعار" button. Includes client-side compression (< 1600px, JPEG 0.8).
     - If uploaded: Green confirmation box "تم استلام إشعار التحويل - الطلب قيد المراجعة حالياً" + "متابعة حالة الطلب" button.
  5. **Expired State Handling:**
     - If expired: Banner turns slate gray (`.expired`), clock reads `00:00:00`.
     - Callout: Red box "انتهت مدة تثبيت السعر المحددة (4 ساعات) ... تقدر تطلب الجهاز من جديد بالسعر الحالي".
     - Action: Button "إعادة الطلب بالسعر الحالي".

### Screen 7: Orders List (`#screen-orders`)
- **React Route / Component:** `/orders` -> `OrdersPage.jsx` + `OrdersPage.module.css`.
- **Elements in Order:**
  1. **App Bar:** Brand logo, Title "سجل الطلبات", Add new order / Catalog button.
  2. **Header Row:** "الطلبات السابقة" + chip "تحويل عبر بنكك".
  3. **Order Cards:** Radius 20px, padding 14px, border 1px ice:
     - Top row: Order `#XXXX` + status chip (`.chip-status` with variants: warning, info, success, completed, danger).
     - Product title (13px 700 navy).
     - Date & Total SDG (14px 900 royal blue).
     - Footer row: Delivery type ("استلام من المحل" / "توصيل") + link "تتبع الطلب ←".

### Screen 8: Order Tracking Timeline (`#screen-tracking`)
- **React Route / Component:** `/orders/:orderNumber` (when confirmed/progressing) -> `OrderDetailPage.jsx` timeline view.
- **Elements in Order:**
  1. **App Bar:** Back button, Title "متابعة مسار الطلب".
  2. **Order Info Card:** Order `#XXXX`, product name, total SDG, delivery type.
  3. **Price Lock Alert (if waiting_payment):** Amber banner with shortcut button to Payment screen.
  4. **Tracking Timeline Card (`.tracking-timeline`):**
     - Vertical connector line (2px gray-200).
     - 5 Steps:
       1. تسجيل الطلب وتثبيت السعر (Order registered & price locked).
       2. رفع إشعار التحويل (Payment receipt uploaded).
       3. مراجعة التحويل (Bank receipt verified).
       4. تجهيز الجهاز للاستلام / للتوصيل (Device tested & packaged).
       5. تسليم الطلب (Handover completed).
     - Dots: 24px circular badge (completed: green checkmark/تم; current: vivid blue with pulse ring; pending: gray number).
  5. **Action Buttons:** "العودة للطلبات" (secondary) + "تواصل معانا واتساب" (primary).

### Screen 9: Notifications (`#screen-notifications`)
- **React Route / Component:** `/notifications` -> `NotificationsPage.jsx` + `NotificationsPage.module.css`.
- **Elements in Order:**
  1. **App Bar:** Back button, Title "الإشعارات والتنبيهات".
  2. **Notification Cards:**
     - Circular icon badge (warning/amber for price lock timer, success/green for approved payment, info/blue for order updates).
     - Title (13px bold navy) + relative time (10px gray-400).
     - Body text (12px gray-600 line-height 1.4).
     - Unread border `#B8D6FF` + subtle shadow.
     - Click navigates directly to associated order or price-lock screen.

### Screen 10: Account (`#screen-account`)
- **React Route / Component:** `/account` -> `AccountPage.jsx` + `AccountPage.module.css`.
- **Elements in Order:**
  1. **App Bar:** Title "حسابي وإعدادات التطبيق".
  2. **Profile Card:** Avatar bubble (50px gradient circle with user initials) + name ("محمد عثمان" or authenticated user) + phone (+249 ...) + city ("أم درمان").
  3. **Menu List Card:**
     - Row 1: "العناوين المسجلة" -> value "أم درمان، الشهداء ›".
     - Row 2: "لغة التطبيق" -> value "العربية ›".
     - Row 3: "طريقة تثبيت السعر" -> value "تفاصيل ›".
  4. **WhatsApp Support CTA:** Large green button `#25D366` ("تواصل معانا واتساب").
  5. **Shop Info Card:** Ice background, name "Wex Technology (ويكس تكنولوجي)", location "مول الواحة، الشهداء، أم درمان", hours, telephone.
  6. **Admin Panel Navigation:** Outlined button "لوحة الإدارة التجريبية" (links to `/admin`).

### Screen 11: Sign-In (`LoginPage.jsx` & `VerifyOtpPage.jsx`)
- **React Route / Component:** `/login` & `/auth/verify`.
- **Elements in Order:**
  - Styled with the mockup's slanted ribbons and splash aesthetic.
  - Google Sign-In first (one-tap GIS button).
  - Passwordless Email OTP input.
  - 6-box auto-advancing verification code input with 60s countdown timer.

---

## 3. Mockup Inline SVG Icons Directory

The following exact SVG vectors from `index.html` and `js/app.js` are preserved and ported directly:
1. **Home Nav Icon:** `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`
2. **Catalog Nav Icon:** `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`
3. **Orders Nav Icon:** `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`
4. **Account Nav Icon:** `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`
5. **Back Button (RTL):** `<polyline points="9 18 15 12 9 6"/>`
6. **Notification Bell:** `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`
7. **Search Icon:** `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`
8. **Laptop SVG Generator:** `getLaptopSVG(silhouette, accentColor)` ported to `src/components/common/LaptopSvg.jsx` for products without uploaded photographs.

---

## 4. Copy Guidelines Alignment

All marketing puffery and forbidden words remain strictly excluded:
- No "أصلية، أفضل، مميز، احترافي، حصري، ضمان حقيقي، وارد دبي، ذكي، تجربة، !".
- Condition is "جديد" or "مستعمل استيراد" only.
- Warranty text originates solely from the API field.
- Price note: "السعر بالدرهم وبيتغير مع الصرف. بنثبته ليك بعد الطلب."
