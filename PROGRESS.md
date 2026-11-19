# Wex Technology Web - Project Progress Tracker

## (a) Project Phases and Completion Status

- [x] **Phase 0: Inspection and Contract**
  - Inspected backend routes, controllers, entities, services, models, and tests.
  - Mapped public, customer, and admin endpoints.
  - Verified role permissions (customer, staff, admin) and self-modification safeguards.
  - Verified product images (relative uploads path) and protected payment proof binary streaming.
  - Created `docs/API-CONTRACT.md` documenting verified contracts and discrepancies.
  - Created `PROGRESS.md`.
- [x] **Phase 1: Frontend Foundation**
  - Initialized React 19 + Vite 8 in `~/projects/wex-web`.
  - Configured portable npm scripts for Termux Android environment.
  - Configured environment files (`.env`, `.env.example`).
  - Established React Router structure with StoreLayout and AdminLayout.
  - Implemented Arabic-first RTL design system tokens (`tokens.css`, `global.css`, `components.css`).
  - Created shared components (Button, Input, Select, Modal, Badge, Skeleton, EmptyState, ErrorState).
  - Implemented ToastContext and notifications provider.
  - Configured PWA manifest with original Wex Technology brand icons.
  - Production build and test runner verified (100% passing).
- [x] **Phase 2: API and Authentication**
  - Implemented centralized API client (`src/api/client.js`) with standard JSON envelope, error extraction, and FormData handling.
  - Implemented access token refresh rotation with single-flight deduplication and theft protection.
  - Implemented AuthContext with user session persistence, role checking, and `/me` profile updates.
  - Implemented passwordless Email OTP login flow (`/auth/email/request`, `/auth/email/verify`, 6-digit input, 60s cooldown timer, new account name prompt).
  - Integrated Google Identity Services with client ID configuration support.
  - Built protected customer account management (`src/pages/store/AccountPage.jsx`) with Sudan phone normalization, notification preference toggles, logout, and soft account deletion.
  - Unit tests for API client passed (100% passing).
- [x] **Phase 3: Storefront**
  - Implemented responsive Home page (`HomePage.jsx`) with live shop data, category cards, featured laptops, and trust badges.
  - Implemented Product Catalog (`CatalogPage.jsx`) with live filtering (category, brand, condition, AED price range, in-stock, search keyword, sorting, pagination), URL sync, loading skeletons, and empty states.
  - Implemented Product Detail view (`ProductDetailPage.jsx`) with photo gallery thumbnails, technical specs table, warranty details, stock status protection, and suggested accessories.
  - Implemented touch-friendly Cart page (`CartPage.jsx`) with local storage persistence and quantity limits (1-10).
  - Implemented Checkout flow (`CheckoutPage.jsx`) with pickup vs. delivery selection, shipping zones from API, and server-side calculation notice.
  - Unit tests for formatting utilities and business logic passed (100% passing).
- [x] **Phase 4: Customer Operations**
  - Implemented Customer Orders listing (`OrdersPage.jsx`) with status tabs, order cards, and pagination.
  - Implemented Order Details & Tracking (`OrderDetailPage.jsx`) with live price lock countdown timer (`.price-lock-banner`), Bankak transfer instructions, and copy shortcuts.
  - Implemented Payment Proof Upload modal with file picker, client preview, sender name, reference number, and immediate order status refresh.
  - Implemented Order Cancel and Reorder actions respecting backend state machine rules.
  - Implemented In-App Notification Center (`NotificationsPage.jsx`) with unread badge counter in header, single mark-read, and mark-all-read.
  - Unit tests for order status mapping, proof reviews, and timer calculations passed (100% passing).
- [ ] **Phase 5: Admin Operations**
  - Admin operational dashboard (status counters, pending reviews, today's revenue, low-stock alerts).
  - Admin order management (order table, filtering, order detail, event timeline).
  - Order status updates (respecting OrderStateMachine).
  - Payment receipt review modal (approve/reject with note).
  - Price lock extension modal.
- [ ] **Phase 6: Admin Management**
  - Product catalog CRUD (product form, specs JSON, stock update, activate/deactivate, delete).
  - Product images manager (multi-upload, preview, set primary, delete).
  - Suggested accessories linking / unlinking.
  - Category and Brand CRUD.
  - Exchange rate management (current AED -> SDG rate, audit history).
  - Store settings management & Shipping zones CRUD.
  - User management (role update, activate/deactivate, spending stats).
  - System audit log viewer.
- [ ] **Phase 7: PWA and Hardening**
  - Web App Manifest (Wex Technology, icons, theme colors).
  - Service worker with cache exclusion for private/auth endpoints.
  - Offline fallback page & install prompt.
  - Security review, headers, and dependency audit.
- [ ] **Phase 8: Final Verification & Documentation**
  - Unit tests for API client, auth, cart, formatters, and status helpers.
  - Production build (`npm run build`).
  - Architecture documentation (`docs/ARCHITECTURE.md`).
  - Deployment guide (`docs/DEPLOYMENT.md`).
  - Testing documentation (`docs/TESTING.md`).
  - README.md.

---

## (b) Completed Tasks
- Inspected backend routes in `app/Config/Routes.php` and controller implementations.
- Verified test suite behavior in `tests/feature/`.
- Verified live running API on `http://localhost:8081` (`/ping`, `/shop`, `/products`).
- Documented API contract and discrepancies in `docs/API-CONTRACT.md`.
- Initialized Git repository at `~/projects/wex-web`.

---

## (c) Remaining Tasks
- Complete Phases 1 through 8.

---

## (d) Files Created or Modified
- `docs/API-CONTRACT.md` (created)
- `PROGRESS.md` (created)

---

## (e) API Integration Status
- Backend inspected: CodeIgniter 4 at `http://localhost:8081/api/v1`.
- Verified endpoints: `/ping`, `/shop`, `/shipping-zones`, `/categories`, `/brands`, `/products`, `/products/{slug}`.
- Discrepancies noted and resolved in `docs/API-CONTRACT.md`.

---

## (f) Verification Results
- Backend curl tests successful:
  - `GET /api/v1/ping` -> 200 OK (service active)
  - `GET /api/v1/shop` -> 200 OK (rate 650 SDG, lock 4 hours)
  - `GET /api/v1/products` -> 200 OK (14 seeded products, laptops & accessories)

---

## (g) Known Limitations
- Google Sign-in requires valid `VITE_GOOGLE_CLIENT_ID` in production; in local development with no client ID configured, the UI gracefully defaults to Email OTP.
- Payment receipts must be viewed via authorized API binary streaming endpoint (`/api/v1/orders/{order_number}/payment-proof/{id}/image`).

---

## (h) Next Immediate Action
- Proceed to Phase 5: Admin Operations (Operational dashboard metrics, orders management table, order details, payment proof approval/rejection review, status transitions, and price-lock extension).
