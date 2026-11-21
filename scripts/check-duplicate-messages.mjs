#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const srcDir = join(rootDir, 'src');

console.log('[check-duplicate-messages] Verifying single-source message rule across storefront...');

let violations = 0;

// 1. Price-lock explanation forbidden in CartPage, ProductDetailPage, ProductCard
const cartContent = readFileSync(join(srcDir, 'pages/store/CartPage.jsx'), 'utf8');
const productDetailContent = readFileSync(join(srcDir, 'pages/store/ProductDetailPage.jsx'), 'utf8');
const productCardContent = readFileSync(join(srcDir, 'components/products/ProductCard.jsx'), 'utf8');

const priceLockPattern = /(?:ثبت السعر|تثبيت السعر|يبقى السعر ثابتًا|يُثبَّت السعر)/u;

if (priceLockPattern.test(cartContent)) {
  console.error('❌ [check-duplicate-messages] CartPage.jsx contains price-lock explanation! It must live ONLY in Checkout and Payment.');
  violations++;
}

if (priceLockPattern.test(productDetailContent)) {
  console.error('❌ [check-duplicate-messages] ProductDetailPage.jsx contains price-lock explanation! It must live ONLY in Checkout and Payment.');
  violations++;
}

if (priceLockPattern.test(productCardContent)) {
  console.error('❌ [check-duplicate-messages] ProductCard.jsx contains price-lock explanation! It must live ONLY in Checkout and Payment.');
  violations++;
}

// 2. Price-lock explanation MUST exist in CheckoutPage and OrderDetailPage
const checkoutContent = readFileSync(join(srcDir, 'pages/store/CheckoutPage.jsx'), 'utf8');
const orderDetailContent = readFileSync(join(srcDir, 'pages/store/OrderDetailPage.jsx'), 'utf8');

if (!checkoutContent.includes('بعد التأكيد يُثبَّت السعر لمدة')) {
  console.error('❌ [check-duplicate-messages] CheckoutPage.jsx must have the exact price-lock explanation line above the button.');
  violations++;
}

if (!orderDetailContent.includes('المتبقي لتثبيت السعر')) {
  console.error('❌ [check-duplicate-messages] OrderDetailPage.jsx must display "المتبقي لتثبيت السعر" in the payment amount card.');
  violations++;
}

// 3. Price-update caption exists under search on Home
const homeContent = readFileSync(join(srcDir, 'pages/store/HomePage.jsx'), 'utf8');
if (!homeContent.includes('formatPriceUpdateCaption')) {
  console.error('❌ [check-duplicate-messages] HomePage.jsx must display price freshness caption under search.');
  violations++;
}

if (violations > 0) {
  console.error(`❌ [check-duplicate-messages] Found ${violations} single-message rule violation(s).`);
  process.exit(1);
} else {
  console.log('✅ [check-duplicate-messages] PASS: All messages live strictly once per customer journey.');
}
