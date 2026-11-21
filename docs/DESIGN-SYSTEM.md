# Wex Technology — Unified Design System & Storefront Rescue Specification

## 1. Brand Identity & Color System (`src/styles/tokens.css`)

Wex Technology is an established electronics retail store located in Omdurman, Sudan (Al-Waha Mall, Al-Shuhada). The visual system conveys technical calm, reliable transparency, and honest communication without decorative noise or repeated messages.

### 1.1 Brand Palette

| Token | Hex Value | Usage & Meaning | WCAG AA Contrast |
| :--- | :--- | :--- | :--- |
| `--wex-navy` | `#061A55` | Primary text, headings, dark surfaces | 16.32:1 on White, 14.58:1 on Ice |
| `--wex-royal` | `#0B3FBF` | Primary buttons, active tabs/chips, links | 8.48:1 on White |
| `--wex-vivid` | `#1E6BFF` | Focus rings (`:focus-visible`), small active details | 4.65:1 on White |
| `--wex-cyan` | `#00B7FF` | **2px Accents ONLY**: countdown ring accents, tiny indicators | (Never used for text or backgrounds) |
| `--wex-ice` | `#EAF3FF` | Page background, tag background | Base surface |
| `--wex-white` | `#FFFFFF` | Cards, modal sheets, input backgrounds | Base surface |

### 1.2 Neutrals (Derived from Navy)

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `--wex-text-secondary` | `#4B5B85` | Secondary captions, timestamps, helpers (6.70:1 on White) |
| `--wex-border` | `#D5E2F7` | 1px card and control borders |
| `--wex-text-disabled` | `#9AA8C7` | Disabled states, placeholders |

### 1.3 High-Contrast Semantic Status Tokens (Inside Status Chips & Text ONLY)

- **Success (`--wex-success: #12805C`):** 4.92:1 on White. Confirmed orders, verified receipts.
- **Warning (`--wex-warning: #B45309`):** 5.02:1 on White. Pending payment, urgent timer.
- **Danger (`--wex-danger: #B42318`):** 6.57:1 on White. Expired orders, rejected proof.
- **Zero other greens/oranges/reds:** WhatsApp buttons are royal outline with the WhatsApp icon (no green); favorite active heart is royal filled (no red); no colored dots on chips.

---

## 2. Surfaces & Gradients

### 2.1 Surfaces (Exactly Two)
1. **Card (`Card.jsx` / `*.module.css`):** White surface (`#FFFFFF`), 1px border (`#D5E2F7`), radius 16px, zero box-shadow.
2. **Dark Card (`DarkCard.jsx`):** Navy surface (`#061A55`), max ONE dark card per screen. Text strictly uses tokens `--on-dark: #FFFFFF` and `--on-dark-muted: #C9D6F5`.

### 2.2 Gradients
- Strictly **Royal to Navy** (`linear-gradient(135deg, #0B3FBF 0%, #061A55 100%)`).
- Restricted to **EXACTLY TWO PLACES**: Hero banner and Payment Amount card.
- Never used on buttons, tags, chips, or regular cards.

---

## 3. Spacing, Radius & Type Scale

- **Spacing Scale:** 4px, 8px, 12px, 16px, 24px, 32px.
- **Page Padding:** 16px (mobile) / 24px (desktop). Section gap: 24px.
- **Radius Scale:** 12px (controls/inputs/buttons), 16px (cards/sheets), 999px (chips).
- **Type Scale:**
  - Caption: 12px
  - Small: 14px
  - Body: 16px (line-height 1.7)
  - Title: 18px (line-height 1.35)
  - Heading: 22px (line-height 1.35)
  - Hero Title: 26-28px (weight 800)
- **Weights:** 400 (regular) and 700 (bold) only (800 hero title only). Zero letter-spacing on Arabic.

---

## 4. Single-Source Message Principle

Each message lives in ONE place per customer journey and nowhere else:
1. **Price-lock explanation:** Only (a) one line above the checkout "تأكيد الطلب" button and (b) the payment screen. Never in cart, home banner, product page, or toasts.
2. **Last price update:** Once, small caption under the Home search field (`آخر تحديث للأسعار: اليوم 9:00 ص`).
3. **Shop address and hours:** Once on Home (shop block) and once in the footer/menu. Never inside hero or product tabs except the factual pickup line.
4. **"How to order" steps:** Once, on Home. Number badges only, no icons over numbers.

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
  *"الأسعار تتغيّر مع تقلّب سعر الصرف. عند إتمام الطلب نثبّت لك السعر لمدة {N} ساعات لتتمكّن من التحويل."*
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
| `formatSpecValue(val)` / `<SpecValue>` | `formatSpecValue.js` | Normalizes technical specs with non-breaking spaces `\u00A0` between numbers and units (`GB`, `TB`, `GHz`, `"`, `W`) and enforces LTR direction `<bdi dir="ltr">`. |
| `<LatinText>` | `LatinText.jsx` | Wraps Latin product names, CPU models, and codes in `<bdi dir="ltr">` preventing RTL stray quote and punctuation flips. |

---

## 8. Centralized Common Content (`src/content/common/`)

Reusable dictionary strings partitioned into domain-specific modules:
- `buttons.js`: Reusable button labels (confirm, cancel, save, delete, retry, checkout, etc.).
- `actions.js`: Common user actions and modal confirmation dialogues.
- `errors.js`: Standard validation and HTTP error state descriptions.
- `offline.js`: Network disconnection, caching notices, and reconnection feedback.
- `pagination.js`: Table and list pagination terms (previous, next, page X of Y, total items).
- `breadcrumbs.js`: Human-readable route labels in Modern Standard Arabic.
