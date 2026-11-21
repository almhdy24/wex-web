#!/data/data/com.termux/files/usr/bin/bash
set -e

PORT=${API_PORT:-8080}
BASE_URL="http://127.0.0.1:${PORT}/api/v1"
FIXTURES_DIR="/data/data/com.termux/files/home/projects/wex-web/tests/fixtures"

mkdir -p "$FIXTURES_DIR"

echo "=== Recording API Fixtures from ${BASE_URL} ==="

fetch_endpoint() {
  local endpoint="$1"
  local outfile="$2"
  local token="$3"

  local auth_header=""
  if [ -n "$token" ]; then
    auth_header="Authorization: Bearer $token"
  fi

  echo "Recording ${endpoint} -> ${outfile}..."
  if [ -n "$auth_header" ]; then
    curl -s "${BASE_URL}${endpoint}" -H "$auth_header" > "${FIXTURES_DIR}/${outfile}"
  else
    curl -s "${BASE_URL}${endpoint}" > "${FIXTURES_DIR}/${outfile}"
  fi
}

# 1. Public Endpoints
fetch_endpoint "/shop" "shop.json"
fetch_endpoint "/categories" "categories.json"
fetch_endpoint "/brands" "brands.json"
fetch_endpoint "/products?per_page=12" "products.json"
fetch_endpoint "/shipping-zones" "shipping-zones.json"
fetch_endpoint "/content/hero-slides" "hero-slides.json"
fetch_endpoint "/content/home-sections" "home-sections.json"
fetch_endpoint "/content/faq" "faq.json"
fetch_endpoint "/content/pages" "pages.json"
fetch_endpoint "/announcements" "announcements.json"
fetch_endpoint "/recent-purchases" "recent-purchases.json"

# Product detail fixture
FIRST_SLUG=$(grep -o '"slug":"[^"]*' "${FIXTURES_DIR}/products.json" | head -1 | cut -d'"' -f4)
if [ -n "$FIRST_SLUG" ]; then
  fetch_endpoint "/products/${FIRST_SLUG}" "product-detail.json"
else
  echo '{"success":true,"data":null}' > "${FIXTURES_DIR}/product-detail.json"
fi

# 2. Login as Admin
ADMIN_EMAIL="admin@wextechnology.com"
curl -s -X POST "${BASE_URL}/auth/email/request" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\"}" > /dev/null

LATEST_EMAIL=$(ls -t /data/data/com.termux/files/home/projects/wex-api/writable/logs/emails/ 2>/dev/null | head -1)
ADMIN_OTP="123456"
if [ -n "$LATEST_EMAIL" ]; then
  LOG_CODE=$(grep -o '[0-9]\{6\}' "/data/data/com.termux/files/home/projects/wex-api/writable/logs/emails/${LATEST_EMAIL}" | head -1)
  if [ -n "$LOG_CODE" ]; then
    ADMIN_OTP="$LOG_CODE"
  fi
fi

VERIFY_RES=$(curl -s -X POST "${BASE_URL}/auth/email/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"code\":\"${ADMIN_OTP}\"}")

ADMIN_TOKEN=$(echo "$VERIFY_RES" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "Admin token obtained: ${ADMIN_TOKEN:0:15}..."

# 3. Customer Authentication
CUST_EMAIL="customer@example.com"
curl -s -X POST "${BASE_URL}/auth/email/request" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${CUST_EMAIL}\"}" > /dev/null

LATEST_EMAIL=$(ls -t /data/data/com.termux/files/home/projects/wex-api/writable/logs/emails/ 2>/dev/null | head -1)
CUST_OTP="123456"
if [ -n "$LATEST_EMAIL" ]; then
  LOG_CODE=$(grep -o '[0-9]\{6\}' "/data/data/com.termux/files/home/projects/wex-api/writable/logs/emails/${LATEST_EMAIL}" | head -1)
  if [ -n "$LOG_CODE" ]; then
    CUST_OTP="$LOG_CODE"
  fi
fi

CUST_VERIFY=$(curl -s -X POST "${BASE_URL}/auth/email/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${CUST_EMAIL}\",\"code\":\"${CUST_OTP}\",\"name\":\"محمد أحمد\"}")

CUST_TOKEN=$(echo "$CUST_VERIFY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "Customer token obtained: ${CUST_TOKEN:0:15}..."

# 4. Customer Protected Fixtures
fetch_endpoint "/me" "me-customer.json" "$CUST_TOKEN"
fetch_endpoint "/orders" "customer-orders.json" "$CUST_TOKEN"
fetch_endpoint "/notifications" "notifications.json" "$CUST_TOKEN"

# 5. Admin Protected Fixtures
fetch_endpoint "/me" "me-admin.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/dashboard" "admin-dashboard.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/orders" "admin-orders.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/products" "admin-products.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/categories" "admin-categories.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/brands" "admin-brands.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/shipping-zones" "admin-shipping-zones.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/rates" "admin-rates.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/settings" "admin-settings.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/users" "admin-users.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/audit-logs" "admin-audit-logs.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/payment-accounts" "admin-payment-accounts.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/hero-slides" "admin-hero-slides.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/home-sections" "admin-home-sections.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/faq" "admin-faq.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/pages" "admin-pages.json" "$ADMIN_TOKEN"
fetch_endpoint "/admin/recent-purchases" "admin-recent-purchases.json" "$ADMIN_TOKEN"

echo "✅ All fixtures recorded successfully in ${FIXTURES_DIR}"
