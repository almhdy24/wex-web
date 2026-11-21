#!/data/data/com.termux/files/usr/bin/bash
set -e

PORT=${API_PORT:-8080}
BASE_URL="http://127.0.0.1:${PORT}/api/v1"

echo "=== Wex Technology Comprehensive E2E Journey Test ==="
echo "Target Base URL: ${BASE_URL}"

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
# Get first available in-stock product ID
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

# 3. Customer Uploads Proof (file named "blob" without extension)
echo ""
echo "--- Step 3: Customer Uploads Proof (File 'blob' without extension) ---"
TMP_BLOB="/data/data/com.termux/files/home/projects/wex-api/writable/tmp_test_blob"
# Create a 1x1 valid PNG image
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

# 5. Admin Lists Payments & Asserts Required Fields
echo ""
echo "--- Step 5: Admin Lists Payments ---"
ADMIN_PAYMENTS=$(curl -s "${BASE_URL}/admin/orders?status=payment_review" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "Admin Payments Response: $(echo "$ADMIN_PAYMENTS" | cut -c1-200)..."

# Find our created order in the payments list
# Assertions: customer name, customer phone, order number, amount, expected_amount, and proof with id/status/created_at
node -e "
const json = JSON.parse(process.argv[1]);
const orderNum = process.argv[2];
const items = json.data || [];
const found = items.find(o => o.order_number === orderNum);
if (!found) {
  console.error('FAIL: Order ' + orderNum + ' not found in admin payment_review queue');
  process.exit(1);
}
console.log('Verifying order payload fields:');
const required = ['customer_name', 'customer_phone', 'order_number', 'amount', 'expected_amount', 'payment_proofs'];
const missing = [];
for (const f of required) {
  if (found[f] === undefined || found[f] === null) {
    missing.push(f);
  }
}
if (missing.length > 0) {
  console.error('FAIL: Admin payments list item is missing required fields:', missing);
  process.exit(1);
}

// Assert proof contains id, status, created_at
const proofs = found.payment_proofs;
if (!Array.isArray(proofs) || proofs.length === 0) {
  console.error('FAIL: Order has no payment_proofs in list item');
  process.exit(1);
}
const p = proofs[0];
if (!p.id || !p.status || !p.created_at) {
  console.error('FAIL: Payment proof is missing id, status, or created_at:', p);
  process.exit(1);
}
console.log('PASS: All required fields present in admin payments item');
" "$ADMIN_PAYMENTS" "$ORDER_NUMBER"

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

# Cleanup temporary test files
rm -f "$TMP_BLOB" "$IMG_HEADER_FILE" "$IMG_BODY_FILE"
echo ""
echo "=== E2E Integration Journey PASSED ==="
