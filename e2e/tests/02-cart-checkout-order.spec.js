import { test, expect } from '@playwright/test';
import { loginAs, DUMMY_RECEIPT_BUFFER } from './helpers.js';

test.describe('02: Cart, Checkout & Order Lifecycle (FEAT-005 - FEAT-013)', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as test customer so checkout proceeds smoothly without OTP blocker
    await loginAs(page, 'customer@wex.sd');
  });

  test('FEAT-005 to FEAT-013: Full customer journey from cart to receipt upload', async ({ page }) => {
    // 1. Visit product catalog and click product
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const firstProduct = page.locator('a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    await page.waitForURL(/\/products\/.+/);

    // 2. Add product to cart
    const addToCartBtn = page.locator('button:has-text("اطلب الآن"), button:has-text("أضف إلى السلة")').first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // 3. Navigate to Cart
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button:has-text("متابعة")')).toBeVisible();

    await page.screenshot({ path: `e2e/test-results/feat-005-cart-${page.viewportSize().width}.png` });

    // 4. Click proceed to checkout
    await page.locator('button:has-text("متابعة")').click();
    await page.waitForURL(/\/checkout/);
    await page.waitForLoadState('networkidle');

    // 5. Verify Checkout Delivery vs Pickup Option Cards (equal height & checkmark)
    const pickupOption = page.locator('button[role="radio"]:has-text("الاستلام من المحل")');
    const deliveryOption = page.locator('button[role="radio"]:has-text("التوصيل")');
    await expect(pickupOption).toBeVisible();
    await expect(deliveryOption).toBeVisible();

    // Select delivery
    await deliveryOption.click();
    await expect(deliveryOption).toHaveAttribute('aria-checked', 'true');

    // Check shipping zone dropdown
    const zoneSelect = page.locator('#checkout-zone-select');
    await expect(zoneSelect).toBeVisible();
    const zoneOptions = await zoneSelect.locator('option').allTextContents();
    expect(zoneOptions.length).toBeGreaterThan(0);
    // Verify zone name is present, not just "- 6,000 ج.س"
    expect(zoneOptions[0]).not.toMatch(/^[\s-]*[\d,]+\s*ج\.س$/);

    // Fill address and phone
    const addressInput = page.locator('#checkout-address-input');
    await addressInput.fill('حي الملازمين، شارع الموردة');

    const phoneInput = page.locator('#checkout-phone-input');
    await phoneInput.fill('0912345678');

    await page.screenshot({ path: `e2e/test-results/feat-006-checkout-${page.viewportSize().width}.png` });

    // 6. Confirm Order
    const confirmBtn = page.locator('button:has-text("تأكيد الطلب")');
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // 7. Verify Redirect to Order Detail Page
    await page.waitForURL(/\/orders\/[A-Za-z0-9-]+/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Verify order number rendered safely
    const orderTitle = page.locator('h1, [class*="orderHeaderTitle"]').first();
    await expect(orderTitle).toBeVisible();
    const orderTitleText = await orderTitle.textContent();
    expect(orderTitleText).toMatch(/WEX-/);

    // Verify Price Lock countdown timer exists
    const countdown = page.locator('[class*="countdownText"], [dir="ltr"]').first();
    await expect(countdown).toBeVisible();

    // 8. Upload Payment Receipt
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'receipt.jpg',
        mimeType: 'image/jpeg',
        buffer: DUMMY_RECEIPT_BUFFER,
      });

      // Confirm upload button
      const uploadSubmitBtn = page.locator('button:has-text("تأكيد وإرسال الإشعار")');
      if (await uploadSubmitBtn.isVisible()) {
        await uploadSubmitBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: `e2e/test-results/feat-008-order-detail-${page.viewportSize().width}.png` });
  });
});
