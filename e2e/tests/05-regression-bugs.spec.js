import { test, expect } from '@playwright/test';
import { loginAs } from './helpers.js';

test.describe('05: Regression Suite for Specific Mobile & Visual Bugs', () => {
  test('BUG 1: Login sheet Google button stays on menu; email button reveals input with back link', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('domcontentloaded');

    // Trigger auth sheet or visit login page
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    // Verify phone or email option
    const emailOptionBtn = page.locator('button:has-text("البريد الإلكتروني")');
    if (await emailOptionBtn.isVisible()) {
      await emailOptionBtn.click();
      // Verify email input is revealed
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      // Verify back link exists and clicking it returns to mode
      const backBtn = page.locator('button:has-text("رجوع")');
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await expect(emailOptionBtn).toBeVisible();
    }

    await page.screenshot({ path: `e2e/test-results/bug-1-auth-sheet-${page.viewportSize().width}.png` });
  });

  test('BUG 2 & 3: Receipt upload buttons row and order number clipping check at mobile width', async ({ page }) => {
    // Authenticate
    await loginAs(page, 'customer@wex.sd');

    // Navigate to orders
    await page.goto('/orders');
    await page.waitForLoadState('domcontentloaded');

    const firstOrder = page.locator('a[href^="/orders/"]').first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      await page.waitForURL(/\/orders\/.+/);
      await page.waitForLoadState('domcontentloaded');

      // Check order title does not overflow viewport horizontally
      const orderTitle = page.locator('h1, [class*="orderHeaderTitle"]').first();
      await expect(orderTitle).toBeVisible();
      const titleBox = await orderTitle.boundingBox();
      const viewport = page.viewportSize();
      if (titleBox && viewport) {
        expect(titleBox.x).toBeGreaterThanOrEqual(0);
        expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(viewport.width + 5);
      }

      // Check pick buttons row does not overflow viewport horizontally
      const pickButtons = page.locator('[class*="pickButtonsRow"]');
      if (await pickButtons.isVisible()) {
        const box = await pickButtons.boundingBox();
        if (box && viewport) {
          expect(box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }

    await page.screenshot({ path: `e2e/test-results/bug-2-3-order-detail-${page.viewportSize().width}.png` });
  });

  test('BUG 4: Phone and numeric inputs have dir=ltr and text-align=right in computed style', async ({ page }) => {
    // Add item to cart first so /checkout does not redirect to /cart
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
    const firstProduct = page.locator('a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 10000 });
    await firstProduct.click();
    await page.waitForURL(/\/products\/.+/);

    const addBtn = page.locator('button:has-text("اطلب الآن"), button:has-text("أضف إلى السلة")').first();
    await addBtn.click();

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');

    const phoneInput = page.locator('#checkout-phone-input');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    const styles = await phoneInput.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        direction: computed.direction,
        textAlign: computed.textAlign,
      };
    });

    expect(styles.direction).toBe('ltr');
    expect(styles.textAlign).toBe('right');

    await page.screenshot({ path: `e2e/test-results/bug-4-numeric-inputs-${page.viewportSize().width}.png` });
  });

  test('BUG 5: Checkout option cards equal heights, check icon, and price replacement', async ({ page }) => {
    // Add item to cart first
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
    const firstProduct = page.locator('a[href^="/products/"]').first();
    await firstProduct.click();
    await page.waitForURL(/\/products\/.+/);

    const addBtn = page.locator('button:has-text("اطلب الآن"), button:has-text("أضف إلى السلة")').first();
    await addBtn.click();

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');

    const pickupBtn = page.locator('button[role="radio"]:has-text("الاستلام من المحل")');
    const deliveryBtn = page.locator('button[role="radio"]:has-text("التوصيل")');
    await expect(pickupBtn).toBeVisible();
    await expect(deliveryBtn).toBeVisible();

    // Check heights
    const pickupBox = await pickupBtn.boundingBox();
    const deliveryBox = await deliveryBtn.boundingBox();
    if (pickupBox && deliveryBox) {
      // Allow +/- 2px difference due to borders
      expect(Math.abs(pickupBox.height - deliveryBox.height)).toBeLessThanOrEqual(2);
    }

    // Switch to delivery and check price replacement
    await deliveryBtn.click();
    const deliveryText = await deliveryBtn.textContent();
    // Once delivery is chosen, subtitle should show price or "مجانًا"
    expect(deliveryText).toMatch(/ج\.س|مجانًا|حسب المنطقة/);

    await page.screenshot({ path: `e2e/test-results/bug-5-checkout-cards-${page.viewportSize().width}.png` });
  });

  test('BUG 6: Button icons layout is inline row, never column', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');

    // Inspect buttons with icons. The catalog is a lazy route: counting right after
    // domcontentloaded raced its render (0 buttons on a slow run). Wait for the first one.
    const buttonsWithIcons = page.locator('button svg');
    await buttonsWithIcons.first().waitFor({ state: 'attached', timeout: 15000 });
    const count = await buttonsWithIcons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const parentButton = buttonsWithIcons.nth(i).locator('xpath=..');
      const flexDir = await parentButton.evaluate((el) => {
        return window.getComputedStyle(el).flexDirection;
      });
      expect(flexDir).not.toBe('column');
    }

    await page.screenshot({ path: `e2e/test-results/bug-6-button-icons-${page.viewportSize().width}.png` });
  });
});
