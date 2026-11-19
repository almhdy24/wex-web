# Wex Technology API Contract

Verified contract between `wex-web` (React Frontend) and `wex-api` (CodeIgniter 4 Backend).  
Base URL: `/api/v1` (configured via `VITE_API_BASE_URL`, default `http://localhost:8081/api/v1`).

---

## 1. Standard Response Envelope

All API endpoints strictly return the following standard JSON structure:

### Success Response
```json
{
  "success": true,
  "message": "رسالة النجاح بالعربية",
  "data": { ... } | [ ... ] | null,
  "errors": null,
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  } | null
}
```

### Error Response
```json
{
  "success": false,
  "message": "رسالة الخطأ بالعربية",
  "data": null,
  "errors": {
    "field_name": "تفاصيل الخطأ"
  } | null,
  "meta": null
}
```

---

## 2. Authentication & Security

- **Scheme:** Bearer token authentication in HTTP header: `Authorization: Bearer <access_token>`.
- **Access Token:** JWT HS256, 15-minute lifespan. Stored in-memory for security.
- **Refresh Token:** 64-char hex string, 30-day lifespan. Rotated on each refresh. Stored in session/local storage.
- **Theft Detection:** If an invalidated refresh token is reused, the entire token family is revoked immediately.

---

## 3. Discrepancy & Verification Log

| Topic | User Prompt Reference | Verified Backend Implementation | Reason & Action |
|---|---|---|---|
| Payment Review Listing | `GET /admin/payments?status=pending` | `GET /admin/orders?status=payment_review` | Verified in `Routes.php` and `PaymentAdminController.php`. Filter orders by status `payment_review`. |
| Payment Review Action | `POST /admin/payments/{id}/approve` | `POST /admin/orders/{order_number}/proofs/{id}/review` | Body: `{"action": "approve" \| "reject", "note": "..."}`. Handled in `PaymentAdminController::review`. |
| Lock Extension | `POST /admin/orders/{order_number}/extend-lock` | `POST /admin/orders/{order_number}/lock` | Body: `{"hours": 4}` (1-72). Verified in `Routes.php` and `OrderAdminController::extendLock`. |
| Exchange Rate Update | `POST /admin/rates` `{"rate": 850}` | `POST /admin/rates` `{"rate_sdg": 850}` | Verified in `RateAdminController::update()` which validates `rate_sdg`. |
| Create Order Contact Phone | `delivery_phone` | `contact_phone` | Verified in `OrderService::createOrder()` which validates `contact_phone` with Sudan phone regex. |
| Notification Mark Read | `POST /notifications/{id}/read` | `PATCH /notifications/{id}/read` | Verified in `Routes.php` and `NotificationController::markRead`. |

---

## 4. Complete Endpoint Reference

### 4.1 Public Endpoints
- `GET /ping`: Health check, returns service status and UTC timestamp.
- `GET /shop`: Public shop profile (`name`, `address`, `phone`, `whatsapp`, `working_hours`, `exchange_rate_sdg`, `rate_updated_at`, `price_lock_hours`, `app_discount_percent`). Note: Bank details are NOT public; only returned on order creation.
- `GET /shipping-zones`: Active delivery zones in Sudan states with `fee_sdg`.
- `GET /categories`: Active categories with names (`name_ar`, `name_en`), `slug`, and `sort_order`.
- `GET /brands`: Active brands with `name` and `slug`.
- `GET /products`: Filterable product catalog.
  - Query parameters: `page`, `per_page`, `type` (`laptop`|`phone`|`accessory`), `category` (slug or id), `brand` (slug or id), `condition` (`new`|`used_imported`), `min_price_aed`, `max_price_aed`, `featured` (bool), `in_stock` (bool), `q` (search term), `sort` (`price_asc`|`price_desc`|`newest`).
- `GET /products/{slug}`: Product details with full `specs` JSON, warranty, image list, and suggested accessories.

### 4.2 Authentication Endpoints
- `POST /auth/google`: `{"id_token": "..."}` -> returns tokens and user object.
- `POST /auth/email/request`: `{"email": "..."}` -> sends 6-digit OTP code to email.
- `POST /auth/email/verify`: `{"email": "...", "code": "123456", "name": "..."}` -> returns tokens and user object.
- `POST /auth/refresh`: `{"refresh_token": "..."}` -> returns new access token and rotated refresh token.
- `POST /auth/logout`: `{"refresh_token": "..."}` -> revokes single session.
- `POST /auth/logout-all`: Bearer auth -> revokes all sessions for user.

### 4.3 Customer Profile (`/me`)
- `GET /me`: Returns profile of authenticated user.
- `PATCH /me`: Updates `name`, `phone` (Sudan format: `+249...` or `09...`).
- `PATCH /me/preferences`: Updates `{"email_notifications": boolean}`.
- `DELETE /me`: Soft-deletes user account.

### 4.4 Customer Orders & Tracking
- `GET /orders`: List orders of authenticated user (`page`, `per_page`).
- `POST /orders`:
  - Body:
    ```json
    {
      "order_type": "pickup" | "delivery",
      "contact_phone": "0912345678",
      "items": [{"product_id": 1, "quantity": 1}],
      "shipping_zone_id": 1,
      "delivery_address": "أم درمان - حي الملازمين",
      "customer_notes": "..."
    }
    ```
  - Returns: Order object, Bankak bank transfer instructions (`bank_details`), and `seconds_remaining`.
- `GET /orders/{order_number}`: Order details, status timeline events, delivery details, payment proofs.
- `POST /orders/{order_number}/cancel`: Cancel pending order, immediately restoring reserved stock.
- `POST /orders/{order_number}/reorder`: Duplicate order items with fresh pricing and lock.
- `POST /orders/{order_number}/payment-proof`: Multipart form upload (`proof_image` [max 5MB JPEG/PNG/WEBP], `sender_name`, `reference_number`).
- `GET /orders/{order_number}/payment-proof/{id}/image`: Protected binary stream of receipt image.

### 4.5 Notifications
- `GET /notifications`: List paginated notifications.
- `GET /notifications/unread-count`: Returns `{"unread_count": N}`.
- `PATCH /notifications/{id}/read`: Mark notification as read.
- `POST /notifications/mark-all-read`: Mark all notifications as read.

### 4.6 Admin & Staff Endpoints
- `GET /admin/dashboard`: Metrics (`orders_by_status`, `pending_reviews_count`, `today_orders`, `low_stock_products`, `exchange_rate`, `price_lock_hours`).
- `GET /admin/orders`: List all orders with filters (`status`, `delivery_type`, `q`, `page`, `per_page`).
- `GET /admin/orders/{order_number}`: Full admin order detail including customer info, payment proofs, and audit events.
- `PATCH /admin/orders/{order_number}/status`: Update status (`status`, `note`). Statuses: `confirmed`, `ready_for_pickup`, `out_for_delivery`, `completed`, `cancelled`.
- `POST /admin/orders/{order_number}/lock`: Extend price lock (`{"hours": 4}`).
- `POST /admin/orders/{order_number}/proofs/{id}/review`: Review bank receipt (`{"action": "approve" | "reject", "note": "..."}`).

### 4.7 Admin Catalog & Configuration Management (Admin only)
- Products:
  - `GET /admin/products`
  - `POST /admin/products`
  - `GET /admin/products/{id}`
  - `PATCH /admin/products/{id}`
  - `DELETE /admin/products/{id}`
  - `PATCH /admin/products/{id}/stock` (`{"stock_quantity": N}`)
  - `POST /admin/products/{id}/accessories` (`{"accessory_id": N}`)
  - `DELETE /admin/products/{id}/accessories/{accessory_id}`
  - `POST /admin/products/{id}/images` (multipart `images[]`)
  - `PATCH /admin/products/{id}/images/{img_id}` (`{"is_primary": bool, "sort_order": N}`)
  - `DELETE /admin/products/{id}/images/{img_id}`
- Categories:
  - `GET /admin/categories`, `POST /admin/categories`, `GET /admin/categories/{id}`, `PATCH /admin/categories/{id}`, `DELETE /admin/categories/{id}`
- Brands:
  - `GET /admin/brands`, `POST /admin/brands`, `GET /admin/brands/{id}`, `PATCH /admin/brands/{id}`, `DELETE /admin/brands/{id}`
- Settings & Rates:
  - `GET /admin/settings`, `PATCH /admin/settings`
  - `GET /admin/rates`, `POST /admin/rates` (`{"rate_sdg": N}`)
- Shipping Zones:
  - `GET /admin/shipping-zones`, `POST /admin/shipping-zones`, `PATCH /admin/shipping-zones/{id}`, `DELETE /admin/shipping-zones/{id}`
- Users:
  - `GET /admin/users`, `GET /admin/users/{id}`, `PATCH /admin/users/{id}/role` (`{"role": "staff"|"admin"|"customer"}`), `PATCH /admin/users/{id}/status` (`{"is_active": bool}`)
- Audit Logs:
  - `GET /admin/audit-logs` (`page`, `per_page`, `action`, `user_id`, `entity`)
