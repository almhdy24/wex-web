# Responsive Screen Mapping (`docs/RESPONSIVE-MAP.md`)

This matrix maps every storefront screen across the three layout tiers:
- **Phone (`< 640px`)**: Single 480px app column, 56px fixed App Bar, 56px Bottom Tab Bar, bottom sheets.
- **Tablet (`640px – 1023px`)**: Fluid container (max 768px), Bottom Tab Bar, centered modal dialogs (max 560px), 3-column product cards.
- **Desktop (`>= 1024px`)**: Full web layout (max 1240px container, side padding 24-48px), 72px Desktop Header, 4-column Footer, multi-column desktop grids, side drawers, and popovers.

---

## Screen-by-Screen Breakdown

### 1. Home Page (`/`)
| Feature / Section | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Header / App Bar** | 56px Mobile AppBar (logo right, unread bell, cart badge) | 56px Mobile AppBar | 72px Desktop Header + top status strip ("مفتوح الآن") |
| **Greeting & Search** | Compact greeting + 46px search input with rotating placeholder | Greeting + wider search input | Integrated in Header search with live popup suggestions |
| **Hero Carousel** | Full-width single column dark navy card, touch swipe, auto 5s | Staggered 2-column card | Wide 2-column hero: text & CTA on start, parallax image stack on end, prev/next arrows |
| **Quick Actions** | 4-column round icon bubbles | 4-column round icon bubbles | Embedded in navigation bar and footer |
| **Category Tiles** | Horizontal scrolling tiles | 4-6 column tiles row | 6-column grid in single row |
| **Product Rails** | Scroll-snap horizontal track (peeking cards) | 3-column scroll rail | 4-5 column rail with prev/next carousel arrows |
| **How to Order** | Vertical 4 steps with gradient connector line | 2x2 grid of steps | Horizontal 4 steps with continuous ribbon track |
| **Price Notice** | Full-width Card component (`PriceNotice`) | Full-width Card component | Full-width Card within 1240px container |
| **Shop Info** | Single-column navy card with WhatsApp CTA | 2-column card (text + map button) | 2-column split (working hours & location + map visual card) |
| **Floating WhatsApp** | Bottom-start FAB (hides on scroll down) | Bottom-start FAB | Removed (replaced with Header & Footer links) |
| **Loading / Error** | Skeletons for each rail / ErrorState with retry | Skeletons for 3-col rails / ErrorState | Skeletons for 4-5 col rails / ErrorState |

---

### 2. Catalog Page (`/products`)
| Feature / Section | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Filter Controls** | Horizontal scrolling chips + sort dropdown | Horizontal chips + sort dropdown | Sticky 280px filter sidebar at start (types, brands, conditions, price range, in-stock) |
| **Layout** | 1 column stacked layout | 1 column with wider width | 2-column layout (Sidebar 280px + Results 1fr) |
| **Results Grid** | Strictly 2 columns | 3 columns | 3 to 4 columns with toolbar (count, sort, grid/list toggle) |
| **Filter Overlays** | Bottom Sheet for advanced filters | Centered Modal (max 560px) | In-place sticky sidebar (no modal) |
| **Empty State** | `EmptyState` with filter reset action | `EmptyState` with filter reset action | Full-width `EmptyState` with category recommendations |
| **Pagination** | Prev/Next bar with page count | Prev/Next bar with page count | Numbered pagination bar with jump-to-page |

---

### 3. Product Details Page (`/products/:slug`)
| Feature / Section | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Layout Structure** | Single vertical scrolling column | Single vertical scrolling column | 2-column layout: Gallery (start) + Sticky Buy Box (end) |
| **Gallery** | 180px image box with tap-to-zoom modal | 240px image box with thumbnails | Large 450px gallery with vertical thumbnails & hover lens zoom |
| **Pricing & Buy Box** | Inline Price Box + PriceNotice | Inline Price Box + PriceNotice | Sticky Buy Box with large SDG price, guarantee notes, quantity stepper, "أضف للسلة", and "اطلب الآن" |
| **Specs & Warranty** | Stacked cards below pricing | Stacked cards below pricing | Tabbed sections: "المواصفات الفنية" (2-col table) & "الضمان والاستلام" |
| **Accessories Rail** | Horizontal scroll-snap rail | 3-column scroll rail | 4-column "يكمل جهازك" grid with one-click quick add |
| **Sticky Action Bar** | Fixed bottom action bar (above safe area) | Fixed bottom action bar | Not shown (actions live in sticky buy box) |
| **Actions Bar** | Add to cart, quantity, buy now | Add to cart, quantity, buy now | Add to cart, buy now, compare, favorite, share buttons |

---

### 4. Cart Page (`/cart`) & Cart Drawer
| Feature / Section | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Cart Access** | Dedicated `/cart` page | Dedicated `/cart` page | Side Drawer from Header icon + optional full `/cart` page |
| **Page Layout** | Single column items list + summary card | Single column items list + summary card | 2-column layout (Items list 65% + Sticky financial summary 35%) |
| **Item Removal** | Animated collapse + 5s undo snackbar | Animated collapse + 5s undo snackbar | Animated collapse + 5s undo snackbar |
| **Price Change Alert** | Neutral banner per item (`تغير سعر هذا الجهاز`) | Neutral banner per item | Neutral banner per item with highlight diff |
| **Checkout CTA** | Sticky bottom checkout bar | Sticky bottom checkout bar | Prominent button in sticky summary & drawer footer |

---

### 5. Checkout Page (`/checkout`)
| Feature / Section | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Progress Tracker** | Step titles in cards | Step titles in cards | Visual 3-step progress bar (السلة → بيانات الطلب → تثبيت السعر والدفع) |
| **Page Layout** | Stacked vertical sections (1, 2, 3) | Stacked vertical sections | 2-column layout: Forms on start (60%), Sticky Order Summary on end (40%) |
| **Step 1: Delivery** | 2-button toggle (Pickup vs Delivery) | 2-button toggle | 2-button card selector with live details |
| **Step 2: Contact** | Phone & address inputs + validation | Phone & address inputs + validation | Grid of inputs with auto-complete and remembered phone |
| **Step 3: What Next?** | Concise instructions | Concise instructions | "ماذا بعد؟" guidance box explaining the price lock & Bankak steps |
| **Submit CTA** | Sticky bottom submit bar | Sticky bottom submit bar | Sticky CTA button in financial summary column |

---

### 6. Order Details & Price-Lock Screen (`/orders/:orderNumber`)
| Feature / Section | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Page Layout** | Single vertical scrolling column | Single vertical scrolling column | 2-column layout: (Start) Price Lock + Bankak + Receipt; (End) Timeline + Items + Support |
| **Countdown Timer** | SVG Circular progress ring + digital digits | SVG Circular progress ring + digital digits | Prominent countdown ring with soft flipping digits and urgent amber pulse |
| **Bankak Account** | Card with one-click copy button | Card with one-click copy button | Card with one-click copy button and QR / visual reference |
| **Receipt Upload** | File input tap area + image compression | File input tap area + image compression | Dropzone supporting file picker, drag-and-drop, and clipboard paste (Ctrl+V) |
| **Order Confirmation** | 12-particle confetti burst on success | 12-particle confetti burst on success | Confetti burst (full mode) + instant receipt preview |
| **Timeline** | Vertical 5-step status track | Vertical 5-step status track | Animated progressive vertical timeline with milestone timestamps |

---

### 7. Orders History (`/orders`)
| Feature / Section | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Tabs / Filters** | Horizontal scroll tabs (الكل, بانتظار التحويل...) | Horizontal scroll tabs | Pill tabs row with order count counters |
| **Orders Display** | Stacked card list | 2-column cards grid | Tabular row list with order #, date, items preview, SDG total, status chip, and actions |
| **Pending Notice** | Sticky top banner if pending order exists | Sticky top banner | Persistent top announcement bar with live countdown clock |

---

### 8. Notifications (`/notifications`)
| Feature / Section | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Access** | Full screen route | Full screen route | Header Bell popover (5 latest + "عرض الكل") + full `/notifications` page |
| **Layout** | Single column cards list | Single column cards list | 2-column layout (Categories side menu + notification cards) |

---

### 9. Account & Auth (`/account`, `/login`, `/auth/verify`)
| Feature / Section | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Account Layout** | Single column menu list | Single column menu list | 2-column layout (Profile menu sidebar + Content cards) |
| **Login / Verify** | Fullscreen mobile card with ribbons | Centered card (max 440px) | Centered card (max 480px) on brand ribbon backdrop |
| **OTP Entry** | 6-box input with auto-advance | 6-box input with auto-advance | 6-box input with paste (Ctrl+V) support and keyboard arrows |
| **Guest Flow** | Return-to redirect on checkout | Return-to redirect on checkout | Return-to redirect modal without losing cart |

---

### 10. New Desktop-Enhanced Experiences
| Screen / Modal | Phone (< 640px) | Tablet (640-1023px) | Desktop (>= 1024px) |
| :--- | :--- | :--- | :--- |
| **Product Compare (`/compare`)** | Compact 2-column comparison sheet | 2-column table modal | 3-laptop side-by-side spec comparison table with difference highlighting |
| **Favorites (`/favorites`)** | Fullscreen saved products list | 2-column grid | 3-4 column product grid with batch remove |
| **FAQ Page (`/faq`)** | Accordion list | Accordion list | 2-column layout (Categories sidebar + animated accordion questions) |
| **Scroll to Top** | Not required | Floating button after 600px | Smooth floating scroll-to-top button after 600px scroll |

---

## State Handling Across All Tiers
Every single screen implements 4 universal states:
1. **Loading State:** Shimmering transform-only skeletons matching the exact tier grid columns (2 cols on phone, 3 on tablet, 4 on desktop).
2. **Empty State:** `EmptyState` component with localized Fusha messaging and direct CTA button.
3. **Error State:** `ErrorState` with retry action button; never loses previously loaded or entered user form data.
4. **Offline State:** Global offline banner (`PwaPrompt` / `useNetworkStatus`) with automatic retry on reconnection.
