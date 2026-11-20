# Wex Technology — Design System & UI Specification

## 1. Brand Identity & Visual Guidelines

Wex Technology is an established electronics retail store located in Omdurman, Sudan (Al-Waha Mall, Al-Shuhada). The design system conveys technical competence, calm reliability, and honest transparency without artificial marketing puffery.

### 1.1 Color Palette (`src/styles/tokens.css`)

| Token | Hex Value | Usage & Meaning |
| :--- | :--- | :--- |
| `--color-navy` | `#061A55` | Primary headings, high-contrast body text, dark app bar surfaces. |
| `--color-royal` / `--color-royal-blue` | `#0B3FBF` | Primary buttons, active state accents, interactive anchors. |
| `--color-vivid` | `#1E6BFF` | Hover states, active tabs, focused elements. |
| `--color-cyan` | `#00B7FF` | **Restrained Accent ONLY**: Focus rings (`:focus-visible`), live indicators, tiny dots. |
| `--color-ice` / `--color-ice-blue` | `#EAF3FF` | Page backgrounds, subtle card highlights, informational strips. |
| `--color-white` | `#FFFFFF` | Card surfaces, modal sheets, input backgrounds. |

#### Semantic Status Tokens
- **Success (`#10B981`):** In stock, confirmed order, approved payment receipt, active item.
- **Warning (`#F59E0B`):** Low stock warning, pending payment, price lock < 30 minutes remaining.
- **Danger (`#EF4444`):** Out of stock, expired price lock, cancelled order, rejected payment receipt.
- **Info (`#2563EB`):** Delivery in transit, ready for store pickup, operational notifications.

---

## 2. Typography & Numeral System

### 2.1 Self-Hosted Tajawal Font
- **Family:** `Tajawal`, sans-serif (hosted via `@fontsource/tajawal`).
- **Weights:** 400 (Regular), 500 (Medium), 700 (Bold), 800 (Extra Bold).
- **Preloaded:** WOFF2 files for 400 and 700 weights preloaded in `index.html`.
- **Eliminated:** All dependencies on Cairo, Inter, or Google Fonts CDN.

### 2.2 Western Digits & Tabular Numerals
- **Rule:** Western Arabic digits (`0-9`) used across all screens for technical precision.
- **Tabular Figures:** `font-variant-numeric: tabular-nums` enforced globally on html, inputs, timers, and prices.
- **Arabic Paragraphs:** `line-height: 1.7` for comfortable Arabic reading.

---

## 3. Brand Graphic: Slanted Ribbon

The slanted ribbon graphic (derived from the Wex X-arrow motif) is restricted to **EXACTLY TWO PLACES**:
1. **Splash & Sign-In Header:** Header card on `LoginPage.jsx` and `VerifyOtpPage.jsx`.
2. **Admin Screen Divider:** 2px subtle gradient bar directly below the page title in administrative views.
3. **Nowhere Else:** No floating ribbons, background shapes, or decorative gradient noise on product cards or content areas.

---

## 4. Atomic Base Components (`src/components/common/`)

All base components use scoped CSS Modules (`*.module.css`) and reference `tokens.css`.

| Component | File | Key Features |
| :--- | :--- | :--- |
| `Button` | `Button.jsx` | Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), loading spinner, 44px touch target. |
| `Input` | `Input.jsx` | Label, error hint, hint text, LTR override support for telephone/email/slug. |
| `Select` | `Select.jsx` | Accessible custom select styling with chevron icon. |
| `Chip` | `Chip.jsx` | Horizontal scrolling category filter chips with active states. |
| `Tag` / `Badge` | `Tag.jsx`, `Badge.jsx` | Semantic status tags (`success`, `warning`, `danger`, `info`, `neutral`). |
| `Card` | `Card.jsx` | 1px border (`--color-border`), 12px border radius, subtle hover elevation. |
| `Sheet` | `Sheet.jsx` | Mobile bottom-sheet drawer for filters and secondary actions. |
| `Modal` | `Modal.jsx` | Centered dialog with backdrop blur, keyboard ESC dismissal, and focus trap. |
| `Countdown` | `Countdown.jsx` | Tabular countdown timer, < 30min warning indicator, auto-expiration handler. |
| `CopyField` | `CopyField.jsx` | One-click copy button with temporary checkmark feedback (Bankak account, order number). |
| `Skeleton` | `Skeleton.jsx` | Content placeholder loaders with gentle pulse effect (zero spinner on lists). |
| `EmptyState` | `EmptyState.jsx` | Honest, helpful empty state messages with primary call to action. |
| `ErrorState` | `ErrorState.jsx` | Sudanese-friendly actionable error messages with retry button. |

---

## 5. Responsive Layout Tiers & Breakpoints

The storefront architecture utilizes **three responsive layout tiers** sharing the same design tokens, React components, and modern Fusha copy:

| Tier | Breakpoint | Container Width | Shell / Header | Navigation & Overlays |
| :--- | :--- | :--- | :--- | :--- |
| **Phone** | `< 640px` | Max `480px` centered | Fixed 56px `AppBar` | Fixed 56px `BottomTabBar`, bottom `Sheet` overlays |
| **Tablet** | `640px – 1023px` | Max `768px` fluid | Fixed 56px `AppBar` | Fixed 56px `BottomTabBar`, centered `Modal` dialogs (max 560px) |
| **Desktop** | `>= 1024px` | Max `1240px` centered | Sticky 72px `DesktopHeader` + 32px status strip | Horizontal top nav with animated underline, side `Drawer` cart, 4-column `DesktopFooter` |

### 5.1 Responsive Spacing & Container Rules
- **Side Padding:** `clamp(16px, 3vw, 24px)` on phone/tablet; `clamp(24px, 4vw, 48px)` on desktop.
- **Desktop Container:** Constrained to `1240px` centered via `margin-inline: auto`.
- **Backgrounds:** Ice background (`--color-ice-blue: #EAF3FF`) for outer page backgrounds on wide screens; clean white cards (`--color-white: #FFFFFF`) with 1px border (`--color-border: #E2E8F0`).
- **Typography Stepping on Desktop:**
  - Body text: 16px – 17px (line-height: 1.7).
  - Page titles: 28px – 36px bold.
  - Section headers: 22px – 24px bold.
  - Tabular numerals: `font-variant-numeric: tabular-nums` enforced on all numbers and prices.

### 5.2 Desktop Navigation & Overlays (`>= 1024px`)
- **Top Status Strip (32px):**
  - Live shop hours indicator: computed in real time from Khartoum business hours (`9:00 ص - 9:00 م`). Renders "مفتوح الآن" (success green pill) or "مغلق حاليًا" (neutral slate pill).
  - Physical store location: "مول الواحة، الشهداء، أم درمان".
  - Quick contact links: direct WhatsApp and telephone.
- **Sticky Desktop Header (72px):**
  - Brand Logo: Minimum 140px width with link to `/`.
  - Main Navigation: Links for الرئيسية (`/`), المتجر (`/products`), الملحقات (`/products?category=accessories`), and طلباتي (`/orders`), with smooth animated indicator underline.
  - Autocomplete Search Field: Wide centered input with debounced query suggestions, product thumbnails, tabular SDG prices, recent searches chips, and keyboard `/` focus shortcut.
  - Notifications Bell: Anchored popover displaying the 5 latest notifications with unread state indicators and link to `/notifications`.
  - Side Cart Drawer: Clicking cart icon opens a responsive slide-in side drawer (`CartDrawer.jsx`) with live quantity steppers, running financial breakdown, and direct checkout CTA.
  - Account Menu: Avatar dropdown with direct links to `/account`, `/orders`, `/faq`, or guest sign-in CTA.
- **Desktop 4-Column Footer:**
  - Column 1: Wex Technology store identity, physical address, and hours.
  - Column 2: Quick links (`/`, `/products`, `/orders`, `/faq`, `/terms`).
  - Column 3: Contact methods, WhatsApp hotline, and location map link.
  - Column 4: 4-step ordering guide (اختيار الجهاز، تثبيت السعر، تحويل بنكك، الاستلام).
  - Full-width royal-to-cyan ribbon divider and copyright row with dynamic year and SDG pricing transparency statement.
- **Overlay Hierarchy:**
  - Toasts: Bottom-start anchored (`bottom: 32px`, `inset-inline-start: 32px`) on desktop.
  - Dialogs: Centered modal windows with backdrop blur, focus trap, and Escape key dismissal.
  - Popovers: Anchored to trigger buttons with click-outside detection.
  - Floating WhatsApp FAB: Automatically removed on desktop in favor of header and footer contact points.
  - Scroll-to-Top Button: Appears after 500px vertical page scroll on wide viewports.

---

## 6. Copy Rules & Customer-Facing Currency Constraints

- **Never mention reference currency or exchange rate:** Never show `AED`, `د.إ`, `درهم`, `دولار`, or the numerical exchange rate on any customer-facing screen, card, or notification. Reference currency and exchange rates are strictly business-private and admin-only.
- **SDG Only:** All customer pricing is displayed exclusively in Sudanese Pounds (`ج.س` / SDG): `price_sdg`, `unit_price_sdg`, `line_total_sdg`, `subtotal_sdg`, `discount_sdg`, `delivery_fee_sdg`, and `total_sdg`.
- **Reusable Customer Notice:** When informing customers about market price fluctuations, use exclusively the standard reusable notice:
  *"الأسعار بتتغير مع تقلب سعر الصرف. بعد الطلب بنثبت ليك السعر لمدة {N} ساعات تحول فيها."*
- **Price Lock Presentation:** Locked orders display only `السعر مثبت: {total} ج.س` and `ينتهي التثبيت الساعة {HH:MM}`. Any "locked rate" or "سعر الصرف المحجوز" is strictly forbidden on customer screens.

---

## 7. Shared Utilities & Formatters (`src/utils/`)

All UI formatting across storefront and administration is centralized in `src/utils/`:

| Utility | File | Purpose & Behavior |
| :--- | :--- | :--- |
| `pluralAr(n, forms)` | `pluralAr.js` | Modern Standard Arabic grammar rules (1: singular `one`, 2: dual `two`, 3-10: plural genitive `few`, 11-99: singular accusative `many`, 100+: singular genitive). |
| `relativeTimeAr(date, baseDate)` | `relativeTimeAr.js` | Africa/Khartoum timezone relative times ("الآن"، "قبل دقيقة"، "قبل دقيقتين"، "قبل 5 دقائق"، "قبل ساعتين"، "قبل يومين"). Older dates format to YYYY/MM/DD. |
| `safeText(val, fallback)` | `safeFormatters.js` | Guaranteed zero rendering of `undefined`, `null`, `NaN`, or `[object Object]`. |
| `formatSdgSafe(amount)` | `safeFormatters.js` | Thousands separators with Western digits (0-9) and ` ج.س`. |
| `formatAedSafe(amount)` | `safeFormatters.js` | Thousands separators with ` د.إ` for admin/staff viewports. |
| `formatMoney(amount, currency)` | `safeFormatters.js` | General money formatter with custom currency suffix. |
| `formatDateSafe(isoString, fallback, includeTime)` | `safeFormatters.js` | Formats ISO timestamps in Africa/Khartoum timezone (UTC+2) with Western digits. |
| `errorMapper(error)` | `errorMapper.js` | Maps HTTP statuses (400, 401, 403, 404, 409, 413, 422, 429, 500, 502, 503, 504, 0/network) to structured Arabic messages, titles, and retry hints. |

---

## 8. Centralized Common Content (`src/content/common/`)

Reusable dictionary strings partitioned into domain-specific modules:
- `buttons.js`: Reusable button labels (confirm, cancel, save, delete, retry, checkout, etc.).
- `actions.js`: Common user actions and modal confirmation dialogues.
- `errors.js`: Standard validation and HTTP error state descriptions.
- `offline.js`: Network disconnection, caching notices, and reconnection feedback.
- `pagination.js`: Table and list pagination terms (previous, next, page X of Y, total items).
- `breadcrumbs.js`: Human-readable route labels in Modern Standard Arabic.
