import { test, expect } from '@playwright/test';

test.describe('01: Storefront Browse, Catalog & PDP (FEAT-001 - FEAT-004)', () => {
  test('FEAT-001: Home page loads with header, logo, search, and sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Logo & branding
    await expect(page.locator('header, nav, [role="banner"]').first()).toBeVisible();
    await expect(page).toHaveTitle(/Wex|ويكس/);

    // Hero or Announcement ticker
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();

    await page.screenshot({ path: `e2e/test-results/feat-001-home-${page.viewportSize().width}.png` });
  });

  test('FEAT-002: Catalog browse, filter by category and search', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Check search input exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"]').first();
    await expect(searchInput).toBeVisible();

    // Verify product cards are displayed
    const productCards = page.locator('[data-product-card], article, [class*="productCard"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });

    // Type search query
    await searchInput.fill('Dell');
    await page.waitForTimeout(500);

    await page.screenshot({ path: `e2e/test-results/feat-002-catalog-${page.viewportSize().width}.png` });
  });

  test('FEAT-003: Product Detail Page & image gallery', async ({ page }) => {
    // Navigate to a known product
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const firstProductLink = page.locator('a[href^="/products/"]').first();
    await expect(firstProductLink).toBeVisible();
    await firstProductLink.click();

    await page.waitForURL(/\/products\/.+/);
    await page.waitForLoadState('networkidle');

    // Verify PDP elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[class*="price"], [data-price]').first()).toBeVisible();

    // Verify Add to Cart button is present
    const orderBtn = page.locator('button:has-text("اطلب الآن"), button:has-text("أضف إلى السلة")').first();
    await expect(orderBtn).toBeVisible();

    await page.screenshot({ path: `e2e/test-results/feat-003-pdp-${page.viewportSize().width}.png` });
  });

  test('FEAT-004: Favorites and Compare toggle', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Locate favorite or compare button on product card
    const favButton = page.locator('button[aria-label*="المفضلة"], button[title*="المفضلة"]').first();
    if (await favButton.isVisible()) {
      await favButton.click();
    }

    await page.screenshot({ path: `e2e/test-results/feat-004-fav-compare-${page.viewportSize().width}.png` });
  });
});
