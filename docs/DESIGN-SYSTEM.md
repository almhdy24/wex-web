# Wex Technology — Design System Specification (v1.0 Vibrant Identity)

## 1. Brand Identity & Color System (`src/styles/tokens.css`)

Wex Technology (أم درمان، مول الواحة) combines modern vibrant electronics retail aesthetics with clear, high-contrast Arabic RTL usability.

### 1.1 Brand Palette

| Token | Value | Role |
| :--- | :--- | :--- |
| `--wex-navy` | `#061A55` | Deep navy for primary headings, body text, dark cards |
| `--wex-royal` | `#0B3FBF` | Royal blue for interactive links, active pills, secondary borders |
| `--wex-vivid` | `#1E6BFF` | Vivid blue for interactive states, middle gradient stop, focus |
| `--wex-cyan` | `#00B7FF` | Radiant cyan accent (rate pulse, gradient end, badge accents; never text on white) |
| `--wex-ice` | `#EAF3FF` | Ice blue page backdrop, active pill fill |
| `--wex-ice-light` | `#F4F8FE` | Secondary container fill, sunken input wells |
| `--wex-white` | `#FFFFFF` | Primary card surface, sheet backdrop |

### 1.2 Gradients

- **Brand Signature Gradient (`--wex-grad-brand`):**
  `linear-gradient(135deg, #0B3FBF 0%, #1E6BFF 50%, #00B7FF 100%)`
  Used for hero banners, primary CTAs, and key brand moments.
- **Brand CTA Gradient (`--gradient-brand-cta`):**
  `linear-gradient(135deg, #0B3FBF 0%, #1E6BFF 100%)`
- **Ribbon Accent (`--wex-grad-ribbon`):**
  `linear-gradient(115deg, rgba(11, 63, 191, 0.95) 0%, rgba(30, 107, 255, 0.90) 60%, rgba(0, 183, 255, 0.85) 100%)`
- **Navy Depth (`--wex-grad-navy`):**
  `linear-gradient(135deg, #061A55 0%, #0B3FBF 100%)`

### 1.3 Tactile Blue-Tinted Elevation

- `--shadow-sm`: `0 2px 6px rgba(6, 26, 85, 0.06)`
- `--shadow-md`: `0 8px 20px rgba(6, 26, 85, 0.09)`
- `--shadow-lg`: `0 16px 32px rgba(6, 26, 85, 0.12)`
- `--shadow-sticky`: `0 -4px 16px rgba(6, 26, 85, 0.08)`
- `--shadow-floating`: `0 12px 30px rgba(30, 107, 255, 0.22)`

### 1.4 Spacing & Dimensions

- Spacing: 4px (`--space-1`), 8px (`--space-2`), 12px (`--space-3`), 16px (`--space-4`), 20px (`--space-5`), 24px (`--space-6`), 32px (`--space-8`), 48px (`--space-12`).
- Page Padding: 16px (`--page-padding`).
- Safe Areas: `--safe-top: env(safe-area-inset-top, 0px)`, `--safe-bottom: env(safe-area-inset-bottom, 0px)`.
- Touch Targets: Min 48px on all primary controls.

### 1.5 Shared Component Guidelines

1. **Page (`Page.jsx`):**
   - Applies consistent `--page-padding` and bottom tab bar + safe-area insets.
   - Eliminates duplicate `<h1>` titles directly beneath layout `AppBar`.
2. **Card (`Card.jsx`):**
   - 16px radius (`--radius-card`), 1px border (`--wex-border`), blue-tinted shadow (`--shadow-sm`).
3. **Button (`Button.jsx`):**
   - Primary: Uses `--wex-grad-brand` with active scale press feedback and ripple.
   - Secondary: White surface with 1px royal border.
4. **StickyBar (`StickyBar.jsx`):**
   - Fixed, padded, rounded floating styling, safe-area aware.
5. **BottomTabBar (`BottomTabBar.jsx`):**
   - Sliding active indicator pill, spring bounce, 48px touch targets, badge pop animations.
