# Wex Technology — Admin Redesign Architecture Plan (`docs/ADMIN-PLAN.md`)

## 1. Overview & Operational Persona
The administration panel is designed for the shop owner and retail staff in Omdurman, Sudan. 
Key operational profile:
- **Primary device**: Smartphone (portrait, one-handed operation, variable 3G/4G connectivity).
- **Secondary device**: Desktop PC in the store for bulk data entry, order printing, and catalog organization.
- **Top 3 Daily Workflows**:
  1. Review Bankak bank-transfer receipts and approve/reject before price-lock expiry.
  2. Advance order fulfillment states and contact customers via WhatsApp/call.
  3. Update daily exchange rate (AED -> SDG) with impact preview.

---

## 2. Layout Tiers & Structural Adaptation

| Tier | Viewport | Navigation Architecture | Layout Model | Overlays & Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Phone** | `< 768px` | Fixed 56px `AdminAppBar` + Fixed 56px `AdminBottomTabBar` (اليوم، الطلبات، المدفوعات [شارة حية]، المنتجات، المزيد) | 1-column card streams; all tables converted to cards via `<DataList>` | Bottom sheet filters; sticky bottom action bars for forms & reviews |
| **Tablet** | `768px – 1023px` | Collapsed 64px icon sidebar rail + top status bar | 2-column card grids or compact tables | Centered modal dialogs (max 560px) |
| **Desktop** | `>= 1024px` | Full 240px sidebar with text labels + sticky top bar with global search & notifications | Master-detail grids, dense tabular views with sortable headers & sticky headers | Full modals, anchored popovers, keyboard shortcuts |

---

## 3. Screen-by-Screen Layout Specifications

### 3.1 Screen 1: Today Dashboard (`/admin`)
- **Phone (`< 768px`)**:
  - Sticky top bar with quick rate chip and manual refresh button.
  - Urgent Action Card: Large amber card displaying pending payment reviews count, oldest waiting time ("أقدم إشعار منذ 24 دقيقة"), and primary CTA to open reviews queue.
  - Operational metrics cards: 2x2 grid (Orders today, Today revenue SDG, Pending review, Price lock duration).
  - Quick rate update button opening a bottom sheet to adjust the rate in 2 taps.
  - Low stock warning banner if any item stock <= threshold.
- **Tablet (`768px – 1023px`)**:
  - 3-column metric cards row.
  - Split section: Orders by status breakdown (left) and low-stock alerts table (right).
- **Desktop (`>= 1024px`)**:
  - 4-metric summary row with subtle hover lift.
  - Urgent review banner with direct jump button.
  - 2-column dashboard: Real-time orders status distribution card and interactive low-stock inventory table with quick restock buttons.
- **States**:
  - *Loading*: 4 skeleton cards + skeleton chart banner.
  - *Empty*: Helpful placeholder "لا توجد طلبات مسجلة اليوم حتى الآن".
  - *Error*: Reconnect error card with retry button.

### 3.2 Screen 2: Payments Review Queue (`/admin/payments`)
- **Phone (`< 768px`)**:
  - Top progress counter: "الإشعار 1 من 4 (أقدم إشعار متبقي عليه 32 دقيقة)".
  - Large interactive receipt viewer: pinch/double-tap to zoom, pan, rotate 90° button.
  - Collapsible summary drawer: Order number, customer name, phone with direct call & WhatsApp shortcuts, expected SDG amount with copy button.
  - Sticky bottom action bar: "قبول التحويل" (royal blue) and "رفض الإشعار" (outline red, opens reason chips sheet).
- **Tablet (`768px – 1023px`)**:
  - Split view: Left 50% image zoom & rotate viewport, Right 50% order details and customer verification card.
- **Desktop (`>= 1024px`)**:
  - Master-detail or side-by-side view:
    - Left column (60%): High-resolution receipt image preview with mouse-wheel zoom, drag-to-pan, and rotate actions.
    - Right column (40%): Bank details matching card (Bankak account, expected SDG, sender name, transfer reference).
    - Keyboard shortcuts: `A` to Approve, `R` to Reject, `J`/`K` to navigate queue.
    - Sticky action footer with auto-advance to next pending receipt.
- **States**:
  - *Empty*: Celebratory calm state: "لا توجد إشعارات بانتظار المراجعة — تم التدقيق لكافة التحويلات".
  - *Loading*: Skeleton canvas and details card.

### 3.3 Screen 3: Orders Management & Detail (`/admin/orders`, `/admin/orders/:orderNumber`)
- **Orders List**:
  - **Phone (`< 768px`)**: Horizontally scrollable status filter chips with live counts; orders rendered as compact cards showing order number, customer, total in SDG, status chip, delivery type, and quick call button.
  - **Desktop (`>= 1024px`)**: Full `<DataList>` table with sticky header, sortable date/amount columns, search input, date range filter, and pagination with page size.
- **Order Detail**:
  - Status header with ONE primary "next step" contextual action button:
    - `payment_review` -> "قبول الدفع" / "مراجعة الإشعار"
    - `confirmed` -> "تجهيز للاستلام" / "بدء التجهيز"
    - `processing` (delivery) -> "إرسال مع المندوب" (prompts for courier name & phone)
    - `processing` (pickup) -> "جاهز للاستلام بالمحل"
    - `out_for_delivery` / `ready_for_pickup` -> "تم التسليم بنجاح"
  - Customer contact bar: Direct call button (`tel:`) and WhatsApp button (`wa.me` with pre-filled message: *"مرحباً {name}، بخصوص طلبك رقم {order_number} من ويكس تكنولوجي..."*).
  - Print button with `@media print` order invoice slip.
  - Secondary action dropdown: extend price lock (hours), cancel order (requires reason), copy order text.

### 3.4 Screen 4: Products List & Form (`/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`)
- **Products List**:
  - **Phone (`< 768px`)**: Product cards with thumbnail, 2-line title, stock stepper (`-` / `+`), active toggle switch, AED price labeled "للإدارة فقط" alongside SDG price.
  - **Desktop (`>= 1024px`)**: `<DataList>` table with thumbnail, name, brand, stock stepper, AED and SDG prices, active status toggle, duplicate product action, and edit button. Bulk selection toolbar (activate, deactivate, delete).
- **Product Form**:
  - Multi-section form with floating/sticky section index (البيانات الأساسية، السعر والمخزون، الصور، المواصفات، الملحقات).
  - Price section: AED input with live SDG preview calculated from current exchange rate and clearly marked "للإدارة فقط".
  - Photo manager: Client-side image compression to 1,600px / JPEG 0.8 prior to upload, drag-to-reorder, primary photo selector, delete with undo toast.
  - Specs editor: Preset fields for laptops/phones (المعالج، الرام، التخزين، كرت الشاشة، الشاشة، البطارية، الضمان) + custom rows.
  - Sticky bottom save bar with unsaved-changes dirty guard.

### 3.5 Screen 5: Exchange Rate (`/admin/rates`)
- **Input & Sparkline**: Large numeric input for new rate, last updated timestamp, who updated it, and an SVG sparkline showing recent rate history.
- **Impact Preview**: Client-side calculation previewing 3-5 sample devices (old price in SDG -> new price in SDG).
- **Safety Guards**:
  - Warning alert if change is > 10% from the previous rate.
  - Confirmation modal required stating: *"سيتم تحديث أسعار جميع الأجهزة فوراً"*.
- **History Table**: Tabular history of previous rate adjustments.

### 3.6 Screen 6: Settings & Shipping Zones (`/admin/settings`, `/admin/shipping-zones`)
- **Settings**: Grouped independent cards (Store Info, Bankak Account, Price Lock Duration, App Discount %, Price Rounding Step). Each section saves independently with isolated loading and success state.
- **Shipping Zones**: Inline editable list of delivery states and fees in SDG.

### 3.7 Screen 7: Users & Audit Logs (`/admin/users`, `/admin/audit-logs`)
- **Users**: Searchable list with role badges; role change modal (admin-only) and active status toggle.
- **Audit Logs**: Filterable timeline by action and entity; human-readable Arabic sentences translating actions into clear descriptions.

---

## 4. Shared Primitives to Implement in Phase 1
1. `AdminShell.jsx`: Adaptive layout switching between Phone (< 768px: AppBar + BottomTabBar), Tablet (768-1023px: Icon Rail), and Desktop (>= 1024px: Sidebar + TopBar with global search).
2. `DataList.jsx`: Shared component rendering a clean table on desktop and responsive cards on mobile from identical column definitions.
3. `StatusChip.jsx`: Unified status indicator using icon, color, and text.
4. `ImageViewer.jsx`: Interactive pan, pinch, rotate, and zoom component for payment proofs.
5. `useIdleTimer.js`: Automatic inactivity detector (warning at 25m, signout at 30m).
6. `admin.ar.js`: Centralized Modern Standard Arabic dictionary for all admin strings.
