#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "=== Wex Technology Frontend Quality Audit ==="

ERRORS=0

echo "1. Checking for forbidden marketing puffery words..."
PUFFERY=$(grep -rn -E "أصيل|أصلي|أفضل|مميز|حصري|ضمان حقيقي|ذكي" src/content/ src/pages/ || true)
if [ -n "$PUFFERY" ]; then
  echo "FAIL: Found puffery words:"
  echo "$PUFFERY"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: Zero puffery words found."
fi

echo "2. Checking for customer AED/rate leaks in storefront..."
LEAKS=$(grep -rn -i -E "AED|درهم|سعر الصرف|سعر اليوم" src/pages/store/ src/components/store/ || true)
if [ -n "$LEAKS" ]; then
  echo "FAIL: Found potential customer currency leaks:"
  echo "$LEAKS"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: Zero customer AED/rate leaks in storefront."
fi

echo "3. Checking for forbidden 'transition: all' in CSS..."
TRANS_ALL=$(grep -rn "transition: all" src/ || true)
if [ -n "$TRANS_ALL" ]; then
  echo "FAIL: Found 'transition: all' in styles:"
  echo "$TRANS_ALL"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: Zero 'transition: all' found."
fi

echo "4. Checking for emojis in src/..."
# Matches unicode emojis (common emoji ranges)
EMOJIS=$(grep -rn -P "[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]" src/ || true)
if [ -n "$EMOJIS" ]; then
  echo "FAIL: Found emojis in src/:"
  echo "$EMOJIS"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: Zero emojis found."
fi

echo "5. Checking for invented warranty or trial period claims in storefront..."
WARRANTY_CLAIMS=$(grep -rn -E "ضمان معتمد|ضمان المحل|ضمان فحص 7 أيام|فحص واستبدال|فحص مخبري" src/pages/store/ src/components/store/ src/components/desktop/ || true)
if [ -n "$WARRANTY_CLAIMS" ]; then
  echo "FAIL: Found invented warranty/trial claims in storefront:"
  echo "$WARRANTY_CLAIMS"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: Zero invented warranty/trial claims found."
fi

if [ $ERRORS -gt 0 ]; then
  echo "=== AUDIT FAILED with $ERRORS error(s) ==="
  exit 1
else
  echo "=== AUDIT PASSED: All 5 quality checks clean ==="
fi
