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

## 5. Screen Layout & Navigation Standards

### 5.1 Mobile-First Viewport (>= 360px)
- Minimum touch target: `44px x 44px`.
- CSS Logical Properties: `margin-inline`, `padding-inline`, `inset-inline` for native RTL alignment.
- Container: Max width `1200px` centered with responsive horizontal padding (`16px` on mobile, `24px` on desktop).

### 5.2 Storefront Navigation
- **Header:**
  - Minimum 120px brand logo.
  - Quick keyword search input.
  - Live currency ticker: "الدرهم اليوم [rate] جنيه" with live timestamp.
  - Notification bell with unread dot.
  - Cart counter badge.
- **Mobile Bottom Navigation Bar:**
  - 4 fixed tabs: الرئيسية (Home), المتجر (Store), طلباتي (Orders), حسابي (Account).
  - Automatically hidden on Checkout and Product Detail pages to expose sticky bottom action bars.
