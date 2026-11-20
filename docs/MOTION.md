# Wex Technology Motion System (`docs/MOTION.md`)

This document is the official motion specification for `wex-web`. It details every animation across the storefront, its duration, curve, performance guards, and adaptations across `full`, `lite`, and `reduced` motion modes.

---

## 1. Core Principles & Performance Budget

1. **Transform & Opacity Only**: No animation may ever mutate `width`, `height`, `top`, `left`, `right`, `bottom`, `margin`, `padding`, `box-shadow`, or `filter: blur()`. `stroke-dashoffset` is used strictly for SVG progress rings and checkmark draws; `clip-path` is used only for splash logo sweep.
2. **Hardware Concurrency & Memory Adaptation**:
   - `full`: High-end fluid experience with particle ribbons, floating hero layers, and active spring animations.
   - `lite`: Automatically triggered on devices with <= 2 GB RAM, <= 4 CPU cores, or `Save-Data` network headers. Disables continuous background loops, parallax, and particle bursts; maintains crisp, short transitions.
   - `reduced`: Enforced when `prefers-reduced-motion: reduce` is active or selected by the user. Zero motion, instantaneous visibility.
3. **Budget**: Initial JS <= 170 kB gzip; CSS <= 40 kB gzip.

---

## 2. Animation Directory & Matrix

| Animation Name | Scope / Component | Trigger | Duration & Curve | Full Mode | Lite Mode | Reduced Mode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `splash-ribbons` | `SplashScreen.jsx` | App mount | `800ms`, `ease-standard` | 3 staggered diagonal ribbons slide in | 1 static fade | Instant |
| `splash-logo-sweep`| `SplashScreen.jsx` | After ribbons | `450ms`, `ease-standard` | Mask sweep & rotating X | Instant fade | Instant |
| `hero-ribbon-drift`| `HeroCarousel.jsx` | Continuous | `8000ms`, linear infinite | Gentle floating rotation & translation | Static gradient | Static |
| `reveal-up` | `<Reveal>` | Viewport intersect | `250ms`, `ease-standard` | Opacity 0->1 + translateY(14px->0) | Opacity 0->1 only | Instant |
| `stagger-entrance` | `<Stagger>` | Container mount | `250ms` + `i * 60ms` | Staggered fade and rise per card | `i * 30ms`, 6px rise | Instant |
| `tab-pill-slide` | `BottomTabBar.jsx` | Tab change | `250ms`, `ease-emphasized`| Spring sliding capsule & icon bounce | Instant tab snap | Instant |
| `button-ripple` | `<Ripple>` / `Button` | Pointer tap/click | `450ms`, `ease-standard` | Expanding radial ripple | Fast ripple | None |
| `cta-sheen-sweep` | Primary CTA Button | Idle periodic (6s) | `1200ms`, `ease-standard`| Subtle 135deg light sweep | None | None |
| `count-up-price` | `useCountUp` | Viewport intersect | `700ms`, quad ease-out | Western digits count up from 0 | Immediate target | Immediate |
| `cart-item-fly` | `ProductCard.jsx` | Add to Cart | `450ms`, WAAPI curve | Cloned thumbnail flies to cart badge | Badge bump only | None |
| `cart-badge-bump` | `AppBar.jsx` | Cart count update | `200ms`, `ease-emphasized`| Scale 1 -> 1.25 -> 1 | Quick highlight | None |
| `countdown-ring` | `OrderDetailPage.jsx`| Timer tick (1s) | Continuous | SVG `stroke-dashoffset` decrements | SVG offset updates | Step update |
| `countdown-pulse` | `OrderDetailPage.jsx`| Under 30 min | `2000ms` infinite pulse | Amber scale & glow pulse | Amber color only | Static amber |
| `success-burst` | Order success view | Order confirmation | `750ms`, `ease-exit` | 12 transform-only brand ribbon bits | Static checkmark | None |
| `timeline-draw` | `OrderDetailPage.jsx`| Step change | `400ms`, `ease-standard` | Progressive vertical line fill | Step switch | Step switch |
| `how-it-works-line`| `HomePage.jsx` | Section intersect | `600ms`, `ease-standard` | SVG connector line draws down | Full line visible | Full line |
| `sheet-slide-up` | `Sheet.jsx` | Filter tap | `250ms`, `ease-standard` | Translates from Y(100%) to 0 | Faster slide | Instant |
