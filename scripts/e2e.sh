#!/data/data/com.termux/files/usr/bin/bash
set -e

PORT=${API_PORT:-8080}
BASE_URL="http://127.0.0.1:${PORT}/api/v1"
API_DIR="/data/data/com.termux/files/home/projects/wex-api"

echo "=== Wex Technology Comprehensive E2E Journey Test ==="
echo "Target Base URL: ${BASE_URL}"

assert_clean_integrity() {
  local step_name="$1"
  if ! (cd "$API_DIR" && php spark integrity:check > /dev/null 2>&1); then
    echo "FAIL: integrity:check reported violations after ${step_name}"
    (cd "$API_DIR" && php spark integrity:check)
    exit 1
  fi
  echo "✔ integrity:check passed (0 violations) after ${step_name}"
}

# 1. Customer Sign In (log driver)
CUST_EMAIL="cust_$(date +%s)@example.com"
echo ""
echo "--- Step 1: Customer Sign In (${CUST_EMAIL}) ---"
REQ_RES=$(curl -s -X POST "${BASE_URL}/auth/email/request" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${CUST_EMAIL}\"}")

sleep 1
LATEST_EMAIL=$(grep -l "To: ${CUST_EMAIL}" $(ls -t /data/data/com.termux/files/home/projects/wex-api/writable/logs/emails/*.log 2>/dev/null) 2>/dev/null | head -1)
if [ -z "$LATEST_EMAIL" ]; then
  echo "FAIL: No email log found for ${CUST_EMAIL}"
  exit 1
fi

CUST_OTP=$(grep -oP '(?<=<div class="code-box">)[0-9]{6}' "$LATEST_EMAIL")
echo "Customer OTP from email log: ${CUST_OTP}"

CUST_VERIFY=$(curl -s -X POST "${BASE_URL}/auth/email/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${CUST_EMAIL}\",\"code\":\"${CUST_OTP}\",\"name\":\"محمد عثمان\"}")

CUST_TOKEN=$(node -e "try{console.log(JSON.parse(process.argv[1]).data.access_token||'')}catch(e){}" "$CUST_VERIFY")
if [ -z "$CUST_TOKEN" ]; then
  echo "FAIL: Customer authentication failed"
  echo "$CUST_VERIFY"
  exit 1
fi
echo "Customer authenticated. Token: ${CUST_TOKEN:0:15}..."

# 2. Customer Creates Order
echo ""
echo "--- Step 2: Customer Creates Order ---"
PRODUCTS_RES=$(curl -s "${BASE_URL}/products?per_page=20")
PRODUCT_ID=$(node -e "
try {
  const items = JSON.parse(process.argv[1]).data || [];
  const p = items.find(x => x.stock_status === 'in_stock' || (x.stock_quantity || 0) > 0);
  console.log(p ? p.id : '2');
} catch { console.log('2'); }
" "$PRODUCTS_RES")

ORDER_PAYLOAD="{\"order_type\":\"pickup\",\"contact_phone\":\"0912345678\",\"items\":[{\"product_id\":${PRODUCT_ID},\"quantity\":1}]}"
ORDER_RES=$(curl -s -X POST "${BASE_URL}/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${CUST_TOKEN}" \
  -d "$ORDER_PAYLOAD")

ORDER_NUMBER=$(node -e "try{console.log(JSON.parse(process.argv[1]).data.order_number||'')}catch(e){}" "$ORDER_RES")
if [ -z "$ORDER_NUMBER" ]; then
  echo "FAIL: Failed to create order"
  echo "$ORDER_RES"
  exit 1
fi
echo "Order created successfully: ${ORDER_NUMBER}"
assert_clean_integrity "Step 2: Order Creation"

# 3. Customer Uploads Proof (file named "blob" without extension)
echo ""
echo "--- Step 3: Customer Uploads Proof (File 'blob' without extension) ---"
TMP_BLOB="/data/data/com.termux/files/home/projects/wex-api/writable/tmp_test_blob"
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01Haf\xa0\x00\x00\x00\x00IEND\xaeB`\x82' > "$TMP_BLOB"
ORIGINAL_SIZE=$(wc -c < "$TMP_BLOB" | tr -d ' ')

UPLOAD_RES=$(curl -s -X POST "${BASE_URL}/orders/${ORDER_NUMBER}/payment-proof" \
  -H "Authorization: Bearer ${CUST_TOKEN}" \
  -F "proof_image=@${TMP_BLOB};filename=blob;type=image/png" \
  -F "sender_name=محمد عثمان" \
  -F "reference_number=BNK-889900")

echo "Upload response: $UPLOAD_RES"
PROOF_ID=$(node -e "try{console.log(JSON.parse(process.argv[1]).data.proof_id||'')}catch(e){}" "$UPLOAD_RES")
if [ -z "$PROOF_ID" ]; then
  echo "FAIL: Uploading payment proof failed"
  rm -f "$TMP_BLOB"
  exit 1
fi
echo "Payment proof uploaded with ID: ${PROOF_ID}"
assert_clean_integrity "Step 3: Proof Upload"

# 4. Admin Sign In
echo ""
echo "--- Step 4: Admin Sign In ---"
ADMIN_EMAIL="admin@wextechnology.com"
curl -s -X POST "${BASE_URL}/auth/email/request" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\"}" > /dev/null

sleep 1
LATEST_ADMIN_EMAIL=$(grep -l "To: ${ADMIN_EMAIL}" $(ls -t /data/data/com.termux/files/home/projects/wex-api/writable/logs/emails/*.log 2>/dev/null) 2>/dev/null | head -1)
ADMIN_OTP=$(grep -oP '(?<=<div class="code-box">)[0-9]{6}' "$LATEST_ADMIN_EMAIL")

ADMIN_VERIFY=$(curl -s -X POST "${BASE_URL}/auth/email/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"code\":\"${ADMIN_OTP}\"}")

ADMIN_TOKEN=$(node -e "try{console.log(JSON.parse(process.argv[1]).data.access_token||'')}catch(e){}" "$ADMIN_VERIFY")
if [ -z "$ADMIN_TOKEN" ]; then
  echo "FAIL: Admin authentication failed"
  rm -f "$TMP_BLOB"
  exit 1
fi
echo "Admin authenticated. Token: ${ADMIN_TOKEN:0:15}..."

# 5. Cross-Check: Customer Order, Admin Order Detail, and Payments Queue Must All Agree
echo ""
echo "--- Step 5: Consistency Cross-Check Across Customer, Admin Detail, and Payments Queue ---"
CUST_ORDER=$(curl -s "${BASE_URL}/orders/${ORDER_NUMBER}" -H "Authorization: Bearer ${CUST_TOKEN}")
ADMIN_DETAIL=$(curl -s "${BASE_URL}/admin/orders/${ORDER_NUMBER}" -H "Authorization: Bearer ${ADMIN_TOKEN}")
ADMIN_QUEUE=$(curl -s "${BASE_URL}/admin/orders?status=payment_review" -H "Authorization: Bearer ${ADMIN_TOKEN}")

node -e "
const cust = JSON.parse(process.argv[1]).data;
const admin = JSON.parse(process.argv[2]).data;
const queue = JSON.parse(process.argv[3]).data || [];
const orderNum = process.argv[4];
const proofId = parseInt(process.argv[5], 10);

const queueItem = queue.find(o => o.order_number === orderNum);
if (!queueItem) {
  console.error('FAIL: Order not found in payments queue');
  process.exit(1);
}

console.log('1. Checking unified payment block across all endpoints:');
if (!cust.payment || cust.payment.state !== 'under_review') {
  console.error('FAIL: Customer order missing or incorrect payment block:', cust.payment);
  process.exit(1);
}
if (!admin.payment || admin.payment.state !== 'under_review') {
  console.error('FAIL: Admin detail missing or incorrect payment block:', admin.payment);
  process.exit(1);
}
if (!queueItem.payment || queueItem.payment.state !== 'under_review') {
  console.error('FAIL: Queue item missing or incorrect payment block:', queueItem.payment);
  process.exit(1);
}

console.log('2. Checking customer name and contact consistency:');
if (!admin.customer || !admin.customer.name || admin.customer.name.includes('عميل')) {
  console.error('FAIL: Admin detail customer name invalid or placeholder:', admin.customer);
  process.exit(1);
}
if (admin.customer_name !== queueItem.customer_name) {
  console.error('FAIL: Admin detail and queue disagree on customer_name:', admin.customer_name, queueItem.customer_name);
  process.exit(1);
}

console.log('3. Checking proofs list consistency:');
if (!Array.isArray(admin.proofs) || admin.proofs.length === 0 || admin.proofs[0].id !== proofId) {
  console.error('FAIL: Admin detail proofs list missing or mismatch:', admin.proofs);
  process.exit(1);
}
if (!Array.isArray(queueItem.proofs) || queueItem.proofs.length === 0 || queueItem.proofs[0].id !== proofId) {
  console.error('FAIL: Queue proofs list missing or mismatch:', queueItem.proofs);
  process.exit(1);
}

console.log('PASS: Customer order, Admin detail, and Payments queue agree completely!');
" "$CUST_ORDER" "$ADMIN_DETAIL" "$ADMIN_QUEUE" "$ORDER_NUMBER" "$PROOF_ID"

assert_clean_integrity "Step 5: Consistency Verification"

# 6. Admin Fetches Proof Image through Authorized Endpoint
echo ""
echo "--- Step 6: Admin Fetches Proof Image ---"
PROOF_IMG_URL="${BASE_URL}/orders/${ORDER_NUMBER}/payment-proof/${PROOF_ID}/image"
IMG_HEADER_FILE="/data/data/com.termux/files/home/projects/wex-api/writable/tmp_img_headers.txt"
IMG_BODY_FILE="/data/data/com.termux/files/home/projects/wex-api/writable/tmp_img_body.bin"

HTTP_STATUS=$(curl -s -D "$IMG_HEADER_FILE" -o "$IMG_BODY_FILE" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -w "%{http_code}" \
  "$PROOF_IMG_URL")

echo "Image fetch HTTP status: ${HTTP_STATUS}"
CONTENT_TYPE=$(grep -i "Content-Type:" "$IMG_HEADER_FILE" | head -1 | tr -d '\r\n')
BODY_SIZE=$(wc -c < "$IMG_BODY_FILE" | tr -d ' ')
echo "Content-Type: ${CONTENT_TYPE}"
echo "Body Size: ${BODY_SIZE} bytes"

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "FAIL: Expected HTTP 200, got ${HTTP_STATUS}"
  cat "$IMG_BODY_FILE"
  rm -f "$TMP_BLOB" "$IMG_HEADER_FILE" "$IMG_BODY_FILE"
  exit 1
fi

if [[ "$CONTENT_TYPE" != *"image/"* ]]; then
  echo "FAIL: Content-Type does not match image/*: ${CONTENT_TYPE}"
  rm -f "$TMP_BLOB" "$IMG_HEADER_FILE" "$IMG_BODY_FILE"
  exit 1
fi

if [ "$BODY_SIZE" -le 0 ]; then
  echo "FAIL: Downloaded proof body size is 0 bytes"
  rm -f "$TMP_BLOB" "$IMG_HEADER_FILE" "$IMG_BODY_FILE"
  exit 1
fi
echo "PASS: Proof image fetched successfully with HTTP 200 and Content-Type image/*"
assert_clean_integrity "Step 6: Image Fetch"

# 7. Admin Approves Proof
echo ""
echo "--- Step 7: Admin Approves Proof ---"
REVIEW_RES=$(curl -s -X POST "${BASE_URL}/admin/orders/${ORDER_NUMBER}/proofs/${PROOF_ID}/review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"action":"approve","note":"تم التأكد من استلام الحوالة"}')

echo "Review Response: $(echo "$REVIEW_RES" | cut -c1-150)..."
if ! echo "$REVIEW_RES" | grep -q -E '"success"[[:space:]]*:[[:space:]]*true'; then
  echo "FAIL: Admin approve proof failed"
  rm -f "$TMP_BLOB" "$IMG_HEADER_FILE" "$IMG_BODY_FILE"
  exit 1
fi
echo "PASS: Admin approved proof successfully"
assert_clean_integrity "Step 7: Admin Approval"

# 8. Customer Sees Status Change to Confirmed
echo ""
echo "--- Step 8: Customer Observes Status Change ---"
CUST_ORDER_RES=$(curl -s "${BASE_URL}/orders/${ORDER_NUMBER}" \
  -H "Authorization: Bearer ${CUST_TOKEN}")

CUST_STATUS=$(node -e "try{console.log(JSON.parse(process.argv[1]).data.status||'')}catch(e){}" "$CUST_ORDER_RES")
echo "Customer order status is now: ${CUST_STATUS}"

if [ "$CUST_STATUS" != "confirmed" ]; then
  echo "FAIL: Expected order status 'confirmed', got '${CUST_STATUS}'"
  rm -f "$TMP_BLOB" "$IMG_HEADER_FILE" "$IMG_BODY_FILE"
  exit 1
fi
echo "PASS: Customer sees status change to 'confirmed'!"
assert_clean_integrity "Step 8: Confirmed Status"

# 9. Legacy-Orphan Simulation and Repair
echo ""
echo "--- Step 9: Legacy-Orphan Path Simulation & Repair ---"
ORPHAN_NUM="WEX-E2E-ORPH-$(date +%s)"
sqlite3 /data/data/com.termux/files/home/projects/wex-api/writable/database/wex.sqlite "
INSERT INTO orders (order_number, user_id, status, delivery_type, delivery_phone, rate_sdg_snapshot, app_discount_percent_snapshot, subtotal_aed, subtotal_sdg, discount_sdg, delivery_fee_sdg, total_sdg, lock_expires_at, created_at)
VALUES ('${ORPHAN_NUM}', 1, 'payment_review', 'pickup', '+249912345678', 650, 0, 10, 6500, 0, 0, 6500, datetime('now', '+2 hours'), datetime('now'));
INSERT INTO order_events (order_id, from_status, to_status, note, created_at)
SELECT id, 'pending_payment', 'payment_review', 'طلب معلق تجريبي', datetime('now') FROM orders WHERE order_number = '${ORPHAN_NUM}';
"

# Assert integrity:check detects the violation
if (cd "$API_DIR" && php spark integrity:check > /dev/null 2>&1); then
  echo "FAIL: integrity:check should have failed on seeded orphan order"
  exit 1
fi
echo "PASS: integrity:check caught seeded orphan violation"

# Verify Dashboard API returns warning
DASH_RES=$(curl -s "${BASE_URL}/admin/dashboard" -H "Authorization: Bearer ${ADMIN_TOKEN}")
node -e "
const d = JSON.parse(process.argv[1]).data;
if (!d || d.inconsistent_orders_count < 1) {
  console.error('FAIL: Dashboard did not report inconsistent_orders_count:', d);
  process.exit(1);
}
console.log('PASS: Dashboard reports inconsistent orders count:', d.inconsistent_orders_count);
" "$DASH_RES"

# Apply repair
(cd "$API_DIR" && php spark integrity:repair --apply > /dev/null 2>&1)
echo "Repairs applied."

# Assert integrity:check is now clean
assert_clean_integrity "Step 9: After Integrity Repair"

# Cleanup temporary test files and seeded order
rm -f "$TMP_BLOB" "$IMG_HEADER_FILE" "$IMG_BODY_FILE"
sqlite3 /data/data/com.termux/files/home/projects/wex-api/writable/database/wex.sqlite "
DELETE FROM order_events WHERE order_id IN (SELECT id FROM orders WHERE order_number = '${ORPHAN_NUM}');
DELETE FROM orders WHERE order_number = '${ORPHAN_NUM}';
"

echo ""
echo "=== E2E Integration Journey PASSED (with zero integrity violations) ==="
