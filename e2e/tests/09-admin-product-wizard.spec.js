// Category-driven product form: the add-device flow succeeds with valid data, and invalid data
// produces field-level Arabic errors (never the raw English "Validation failed" text).
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers.js';

test.describe('09: Admin product wizard', () => {
  test('invalid submit shows Arabic field errors and the red-fields toast', async ({ page }) => {
    await loginAs(page, 'admin@wextechnology.com');
    await page.goto('/admin/products/new?type=laptop', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'نشر', exact: true }).click();
    await expect(page.getByText('تحقق من الحقول المظللة بالأحمر').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Validation failed/i)).toHaveCount(0);
    await expect(page.getByText('اسم الجهاز مطلوب').first()).toBeVisible();
  });

  test('category-first flow publishes a laptop with schema-driven specs', async ({ page }) => {
    await loginAs(page, 'admin@wextechnology.com');
    await page.goto('/admin/products/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('ماذا تريد أن تضيف؟')).toBeVisible();
    await page.getByRole('radio', { name: 'حاسوب' }).click();
    await page.getByRole('button', { name: 'متابعة' }).click();

    const name = `HP ProBook E2E ${Date.now()}`;
    await page.getByRole('button', { name: /المعلومات الأساسية/ }).first().click();
    await page.locator('#f-name').fill(name);

    await page.getByRole('button', { name: /^\s*\d?\s*المواصفات/ }).first().click();
    await page.locator('#f-spec-model').fill('ProBook 440 G7');
    await page.locator('#f-spec-cpu_family').selectOption('i5');
    await page.getByRole('radio', { name: '8 GB' }).first().click();
    await page.getByRole('radio', { name: '256 GB' }).click();
    await page.getByRole('radio', { name: 'SSD', exact: true }).click();
    await page.getByRole('radio', { name: '14 بوصة' }).click();
    await page.getByRole('radio', { name: 'مدمج' }).click();

    await page.getByRole('button', { name: /السعر والمخزون/ }).first().click();
    await page.locator('#f-price_aed').fill('1500');

    await page.getByRole('button', { name: 'نشر', exact: true }).click();
    await expect(page.getByText('تم الحفظ')).toBeVisible({ timeout: 8000 });
    await page.waitForURL(/\/admin\/products$/, { timeout: 8000 });
    await expect(page.getByText(/Validation failed/i)).toHaveCount(0);

    // Clean up: this product has stock 1 and would otherwise be the newest item that later
    // storefront specs buy or open. Delete it from the list (soft delete, hidden from the store).
    const card = page.locator('tr, [class*="mobileCard"]').filter({ hasText: name }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.getByRole('button', { name: 'حذف الجهاز' }).click();
    await page.getByRole('button', { name: 'تأكيد الحذف' }).click();
    await expect(page.getByText(name)).toHaveCount(0, { timeout: 10000 });
  });
});
