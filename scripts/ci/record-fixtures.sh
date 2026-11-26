#!/usr/bin/env bash
# Records real API responses for the snapshot fixtures from an isolated, freshly seeded
# SQLite DB. The dev .env is switched to fixtures.sqlite and ALWAYS restored on exit.
set -u
API=$HOME/projects/wex-api
SCR=$(mktemp -d)
OUT=${1:-$(cd "$(dirname "$0")" && pwd)/fixtures/recorded}
BAK=$SCR/wex-api.env.bak
cd "$API" || exit 1

cp -p .env "$BAK" || exit 1
restore() {
  cp -p "$BAK" "$API/.env" && echo "env restored"
  [ -n "${SRV:-}" ] && kill "$SRV" 2>/dev/null
}
trap restore EXIT

sed -i 's/^database.default.database=wex.sqlite$/database.default.database=fixtures.sqlite/' .env
grep -q '^database.default.database=fixtures.sqlite$' .env || { echo "env switch failed"; exit 1; }
rm -f writable/database/fixtures.sqlite && touch writable/database/fixtures.sqlite
php spark migrate --all >/dev/null 2>&1 || { echo "migrate failed"; exit 1; }
php spark db:seed DatabaseSeeder >/dev/null 2>&1
php spark db:seed DevSeeder >/dev/null 2>&1
echo "fixtures.sqlite bytes: $(stat -c %s writable/database/fixtures.sqlite)"

TESTING_LOGIN_ENABLED=true php -S 127.0.0.1:8091 -t public >"$SCR/fx-api.log" 2>&1 &
SRV=$!
sleep 2
B=http://127.0.0.1:8091/api/v1
mkdir -p "$OUT"

tok() { curl -s -X POST $B/auth/testing-login -H 'Content-Type: application/json' -d "{\"email\":\"$1\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['access_token'])"; }
CT=$(tok customer@wex.sd)
AT=$(tok admin@wextechnology.com)
[ -n "$CT" ] && [ -n "$AT" ] || { echo "login failed"; exit 1; }

pid() { curl -s "$B/products?per_page=50" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print([p['id'] for p in d if p.get('stock_status')!='out_of_stock'][$1])"; }
mkorder() { # $1 product index, $2 key
  curl -s -X POST $B/orders -H "Authorization: Bearer $CT" -H 'Content-Type: application/json' -H "Idempotency-Key: fixture-order-$2" \
    -d "{\"order_type\":\"pickup\",\"contact_phone\":\"0912345678\",\"items\":[{\"product_id\":$(pid $1),\"quantity\":1}]}" \
    | python3 -c "
import sys,json
d=json.load(sys.stdin)
if not d.get('data'): print(json.dumps(d,ensure_ascii=False)[:400], file=sys.stderr); sys.exit(1)
print(d['data']['order_number'])"
}
python3 -c "
from PIL import Image; Image.new('RGB',(600,900),(235,240,248)).save('$SCR/proof.jpg',quality=80)"
upload() { curl -s -X POST "$B/orders/$1/payment-proof" -H "Authorization: Bearer $CT" -F "proof_image=@$SCR/proof.jpg;type=image/jpeg" -F 'reference_number=TRX-48213' -F 'sender_name=محمد أحمد' >/dev/null; }
proofid() { curl -s "$B/admin/orders/$1" -H "Authorization: Bearer $AT" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];ps=d.get('payment_proofs') or d.get('proofs') or [];print(ps[-1]['id'] if ps else '')"; }
review() { curl -s -X POST "$B/admin/orders/$1/proofs/$2/review" -H "Authorization: Bearer $AT" -H 'Content-Type: application/json' -d "$3" >/dev/null; }

PENDING=$(mkorder 0 p1)
REVIEW=$(mkorder 1 r1); upload "$REVIEW"
REJECT=$(mkorder 2 j1); upload "$REJECT"; review "$REJECT" "$(proofid "$REJECT")" '{"action":"reject","note":"المبلغ في الإشعار لا يطابق المطلوب"}'
CONF=$(mkorder 3 c1); upload "$CONF"; review "$CONF" "$(proofid "$CONF")" '{"action":"approve"}'
echo "orders: $PENDING $REVIEW $REJECT $CONF"
printf '{"pending":"%s","review":"%s","rejected":"%s","confirmed":"%s"}\n' "$PENDING" "$REVIEW" "$REJECT" "$CONF" > "$OUT/_orders.json"

rec() { # $1 file, $2 path, $3 token(optional)
  if [ -n "${3:-}" ]; then curl -s "$B$2" -H "Authorization: Bearer $3" > "$OUT/$1.json"; else curl -s "$B$2" > "$OUT/$1.json"; fi
  python3 -c "import json,sys;d=json.load(open('$OUT/$1.json'));sys.exit(0 if d.get('success') else 1)" || echo "  ! $1 ($2) not success"
}
rec shop /shop; rec categories /categories; rec brands /brands; rec zones /shipping-zones
rec products "/products?per_page=20"; rec announcements /announcements
rec hero-slides /content/hero-slides; rec home-sections /content/home-sections; rec faq /content/faq; rec pages /content/pages
rec product-detail /products/lenovo-thinkpad-t480; rec product-detail-acc /products/logitech-wireless-mouse-b170
rec me-customer /me "$CT"; rec me-admin /me "$AT"
rec orders-list "/orders?per_page=20" "$CT"
for k in PENDING REVIEW REJECT CONF; do n=${!k}; rec "order-$(echo $k | tr A-Z a-z)" "/orders/$n" "$CT"; done
rec notifications "/notifications?per_page=20" "$CT"; rec unread /notifications/unread-count "$CT"
rec push-config /push/config "$CT"; rec push-prefs /push/preferences "$CT"
rec admin-dashboard /admin/dashboard "$AT"; rec admin-orders "/admin/orders?per_page=20" "$AT"
rec admin-payments "/admin/orders?status=payment_review&per_page=50" "$AT"
rec admin-order "/admin/orders/$REVIEW" "$AT"
rec admin-products "/admin/products?per_page=20" "$AT"; rec admin-product "/admin/products/2" "$AT"
rec admin-settings /admin/settings "$AT"; rec admin-rates /admin/rates "$AT"; rec admin-zones /admin/shipping-zones "$AT"
rec admin-users "/admin/users?per_page=20" "$AT"; rec admin-categories /admin/categories "$AT"; rec admin-brands /admin/brands "$AT"
rec admin-audit "/admin/audit-logs?per_page=20" "$AT"
rec admin-hero /admin/hero-slides "$AT"; rec admin-faq /admin/faq "$AT"; rec admin-pages /admin/pages "$AT"
rec admin-announcements /admin/announcements "$AT"; rec admin-payment-accounts /admin/payment-accounts "$AT"
ls "$OUT" | wc -l
