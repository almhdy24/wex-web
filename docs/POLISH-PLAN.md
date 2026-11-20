# Wex Technology — Storefront Polish & Motion Plan

This document defines the comprehensive architecture and screen-by-screen specification for elevating `~/projects/wex-web` into an attractive, fluid, on-brand, and accessible storefront.

---

## 1. Visual & Brand Design System Refresh

### 1.1 Brand Motif & Slanted Ribbon Expansion
- **Cancelled Restrictions**: The previous restriction limiting ribbons to only two places is removed.
- **Brand Geometry**: The signature slanted ribbon (90deg and 135deg angles, inspired by the Wex X-arrow motif) and the royal-blue-to-cyan gradient (`#061A55` -> `#0B3FBF` -> `#1E6BFF` -> `#00B7FF`) become a consistent visual anchor across:
  - Hero carousel background with drifting translucent ribbon layers.
  - Section dividers with dynamic angle accents.
  - Interactive loaders, progress rings, and skeleton shimmers.
  - Order success ribbon burst (transform-only, 12 light particles in full motion mode).
  - App shell backdrop and splash screen transition.
- **Color Palette Guardrails**:
  - Deep Navy: `#061A55` (Primary background for hero, headers, and brand contrasts)
  - Royal Blue: `#0B3FBF` (Primary brand color for buttons, active tabs, and primary headings)
  - Vivid Blue: `#1E6BFF` (Secondary interactive highlights and hover accents)
  - Cyan Accent: `#00B7FF` (Restricted to fine accents: active indicators, badges, countdown digits, icons)
  - Ice Blue: `#EAF3FF` (Card backgrounds, subtle borders, chip backgrounds)
  - Soft Card Elevation: Navy-tinted soft shadows (`0 8px 24px rgba(6, 26, 85, 0.06)`), border radius 16px to 24px.
- **Typography & Clear Space**:
  - Font: **Tajawal** exclusively for all Arabic and numbers (Playfair Display solely for Latin subtitle "TECHNOLOGY").
  - Digits: Strictly Western Arabic (`0-9`) with `font-variant-numeric: tabular-nums`.
  - Brand Logo: Minimum 120px, unrotated, untinted, unshadowed, with clear margin.

---

## 2. Motion System Architecture (`src/motion/`)

### 2.1 Performance Principles
- **Transform & Opacity Only**: Zero animation of `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`, or `filter: blur()`. Stroke-dashoffset and clip-path used strictly for progress rings and reveal sweeps.
- **Low Overhead**: Lightweight custom system relying on native CSS, Web Animations API (WAAPI), `IntersectionObserver`, and the `View Transitions API` (with immediate CSS fallback). No Lottie or large libraries.
- **Budget**: Initial JS bundle <= 170 kB gzip; CSS bundle <= 40 kB gzip.

### 2.2 Motion Tokens
- **Durations**:
  - `fast`: `150ms` (taps, ripples, icon toggles)
  - `base`: `250ms` (sheet slides, modal fades, tab pill movements)
  - `slow`: `450ms` (page transitions, expand/collapse)
  - `hero`: `800ms` (hero carousel ribbon drifts, splash intro)
  - `stagger`: `60ms` per item
- **Curves**:
  - `standard`: `cubic-bezier(0.2, 0.8, 0.2, 1)` (general UI motions)
  - `emphasized`: `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounces, badge pops)
  - `exit`: `cubic-bezier(0.4, 0, 1, 1)` (dismissals)

### 2.3 Motion Modes (`full` | `lite` | `reduced`)
- **Auto-Detection**:
  - `reduced`: triggers if `window.matchMedia('(prefers-reduced-motion: reduce)')` matches.
  - `lite`: triggers if `navigator.deviceMemory <= 2` or `navigator.hardwareConcurrency <= 4` or `navigator.connection?.saveData === true`.
  - `full`: standard default for modern hardware.
- **User Override**: Toggle in Account page ("الحركة: كاملة / مخففة"). Stored in `localStorage` under `wex_motion_mode`.
- **Root Injection**: `<html data-motion="full|lite|reduced">` dynamically controls all animations via CSS selectors. In `lite` and `reduced` modes, continuous loops and parallax are strictly disabled.

---

## 3. Screen-by-Screen Polish & Specification

### 3.1 App Shell, Navigation & Global Elements
- **App Shell**: Fluid single column centered at `max-width: 480px`. Uses `100dvh` / `100svh`. Handles virtual keyboard by lifting or suppressing bottom bars when input is focused.
- **App Bar**:
  - Right (RTL): Brand Logo with clear space.
  - Left (RTL): Notification bell with animated unread dot + Cart icon with bounce badge counter.
- **Bottom Tab Bar**:
  - 4 tabs (الرئيسية، المتجر، طلباتي، حسابي).
  - Floating sliding active pill indicator with smooth spring translation.
  - Icon micro-bounce on selection.
  - Hidden on Cart, Checkout, and Product Detail screens to make room for sticky action bars.

### 3.2 Splash Screen
- Diagonal brand ribbons slide in with staggered transforms.
- Logo card reveals via clip-path sweep.
- Clean rotating X mark, fading out smoothly into Home (max 1.4s total, skippable on tap).

### 3.3 New Home Screen (10 Ordered Sections)
1. **App Bar**: Logo, notification bell, cart with badge.
2. **Greeting & Search**: Greeting (`أهلاً بك، {name}`) + prominent search input with rotating placeholder ("ابحث عن جهاز، مثل: Dell Latitude") and interactive recent search tags on focus.
3. **Hero Carousel**: 3 slides with auto-advance (5s), touch-pause, swipe gesture, and circular dot progress:
   - Slide 1: "أحدث الأجهزة وصلت" with photo of latest laptop.
   - Slide 2: "تثبيت السعر عند الطلب" with animated clock/lock icon.
   - Slide 3: "ملحقات حاسوبك الأساسية" featuring accessories.
4. **Quick Action Tiles**: 4 circular icon buttons: تصفح الأجهزة، تتبع طلبي، تواصل عبر واتساب، موقع المحل.
5. **Category Rails**: Horizontal pills with category icons (حواسيب محمولة، هواتف ذكية، ملحقات) + condition chips (جديد / مستعمل استيراد).
6. **Product Rails (API-driven)**:
   - "وصل حديثًا"
   - "مناسبة للدراسة"
   - "مناسبة للعمل"
   - "ملحقات مختارة"
   - Scroll-snap with peeking next card, title, "عرض الكل" button, and quick-add button.
7. **"كيف تطلب" 4-Step Ribbon Journey**:
   - Animated SVG connector line drawing on viewport intersection.
   - Step 1: اختر الجهاز
   - Step 2: ثبّت السعر
   - Step 3: حوّل المبلغ وارفع الإشعار
   - Step 4: استلم من المحل أو بالتوصيل
8. **Price Notice**: Standard `<PriceNotice variant="full" />` stating:
   *"الأسعار تتغيّر مع تقلّب سعر الصرف. عند إتمام الطلب نثبّت لك السعر لمدة {N} ساعات لتتمكّن من التحويل."*
9. **Shop Location Card**: Al-Waha Mall, working hours, interactive WhatsApp and map buttons over a subtle ribbon background.
10. **Floating WhatsApp Button**: Small floating button (bottom-start above bottom tab bar), automatically hides on downward scroll and appears on upward scroll.

### 3.4 Product Card Component
- Aspect ratio 4:3 image wrapper on ice-to-white gradient (`#EAF3FF` to `#FFFFFF`).
- Condition pill tag: "جديد" or "مستعمل استيراد".
- 2-line title clamp with `min-width: 0`.
- Technical specs line: (e.g. `i5 · 16GB · 512GB SSD`).
- SDG-only price in bold tabular figures.
- Morphing quick-add button that transforms into a checkmark, triggers haptic feedback (`navigator.vibrate(8)`), and sends a clone flying to the cart icon via WAAPI.

### 3.5 Catalog Screen
- Sticky filter/sort sub-header with results counter.
- Filter bottom sheet with animated chips for categories, condition, and quick price range presets.
- 2-column responsive grid with staggered fade-and-rise entrance.
- Clean empty state with filter reset action.

### 3.6 Product Detail Page
- Gallery with swipe/tap indicators and image modal zoom.
- Full technical specifications card.
- "يكمل جهازك" suggested accessories rail with one-tap add.
- Sticky bottom purchase bar with quantity stepper and full-width "تثبيت السعر وإتمام الطلب" CTA.

### 3.7 Cart & Checkout Flow
- **Cart Page**: Item removal with CSS collapse transition; clear breakdown; price change inline banner with old/new SDG comparison if refreshed catalog indicates update.
- **Checkout Page**: 3-step structured cards (Delivery type -> Contact phone & Address -> Order summary); inline validation; sticky confirmation CTA with double-submit protection.

### 3.8 Order Detail & Price Lock
- Circular SVG countdown ring (`stroke-dashoffset`) updating smoothly every second.
- Digits flip with soft vertical translate.
- Amber pulse state when less than 30 minutes remain.
- Copyable Bankak bank account with checkmark confirmation.
- Modern receipt dropzone with animated progress ring and check mark draw upon upload.
- Order success particle ribbon burst (12 transform-only pieces in full motion mode).
- 5-step vertical order timeline with progressive stroke fill.

### 3.9 Account, Notifications & Auth
- **Account Page**: User avatar initials, quick order navigation, Motion Mode switcher ("الحركة: كاملة / مخففة"), WhatsApp support link, logout.
- **Notifications Page**: Categorized alerts with smooth unread dot dismissal.
- **Sign-In Flow**: 6-box auto-advancing OTP input with paste support and 60-second resend countdown.

---

## 4. Modern Standard Arabic (Fusha) Copy Strategy

- **Single Source of Truth**: All text is centralized in `src/content/ar.js`. No hard-coded Arabic text in JSX components.
- **Tone & Register**: Modern Standard Arabic (الفصحى المعاصرة الميسرة) — polite, dignified, concise, direct.
- **Zero Puffery**: Absolute prohibition on hype words (`أصلي`, `الأفضل`, `مميز`, `حصري`, `ضمان حقيقي`, `وارد دبي`, `ذكي`, exclamation marks, emojis).
- **Zero Rate Leaks**: Never mention AED, dirham, dollar, or reference exchange rates.
- **Backend String Normalization**: UI layer maps any colloquial backend API response strings to proper Fusha Arabic, with audit recorded in `docs/COPY-TODO-API.md`.
