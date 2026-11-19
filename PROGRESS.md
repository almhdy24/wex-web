# Wex Technology Web - Project Progress Tracker

## (a) Project Phases and Completion Status

- [x] **Phase 0: Inspection and Contract**
  - Inspected backend routes, controllers, entities, services, models, and tests.
  - Mapped public, customer, and admin endpoints.
  - Verified role permissions (customer, staff, admin) and self-modification safeguards.
  - Verified product images (relative uploads path) and protected payment proof binary streaming.
  - Created `docs/API-CONTRACT.md` documenting verified contracts and discrepancies.
  - Created `PROGRESS.md`.
- [ ] **Phase 1: Frontend Foundation**
  - Initialize React + Vite project.
  - Configure environment files (`.env`, `.env.example`).
  - Establish React Router structure (storefront & admin routes, 404, offline).
  - Design system tokens (`tokens.css`, `global.css`, `components.css`).
  - RTL Arabic-first layout, typography, and responsive shells (`StoreLayout`, `AdminLayout`).
  - Common components (Button, Input, Modal, Toast, Skeleton, Table, Badge).
- [ ] **Phase 2: API and Authentication**
  - Centralized API client with JWT refresh rotation and request deduplication.
  - AuthContext & session management.
  - Email OTP login flow (request, 6-digit input, countdown, verify).
  - Google Sign-in integration with Google Identity Services.
  - Protected route guards (Public, Customer, Staff, Admin).
  - Customer profile & preferences management (`/me`).
- [ ] **Phase 3: Storefront**
  - Home page (branding, search, categories, featured laptops, accessories, shop info).
  - Product catalog (search, category/brand filters, condition, AED price range, sorting, pagination).
  - Product details (gallery, specs table, warranty, stock status, accessories suggestions).
  - Cart context with persistence and touch-friendly controls.
  - Checkout page (pickup vs delivery, shipping zone selection, address, contact phone).
- [ ] **Phase 4: Customer Operations**
  - Order creation with server-computed totals.
  - Bank transfer instructions & live price-lock countdown timer.
  - Payment proof upload (Bankak screenshot, sender name, reference).
  - Customer orders list & order tracking timeline.
  - In-app notification center (unread badge, mark read, mark all read).
  - Customer account profile settings & soft delete.
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
- Proceed to Phase 1: Initialize Vite + React project in `~/projects/wex-web`, establish routing, design tokens, responsive RTL layouts, and common components.
