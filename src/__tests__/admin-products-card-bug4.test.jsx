/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import { adminApi } from '../api/admin';
import { ToastContext } from '../context/ToastContext';
import styles from '../pages/admin/AdminProductsPage.module.css';

vi.mock('../api/admin', () => ({
  adminApi: {
    getProducts: vi.fn(),
    getCategories: vi.fn().mockResolvedValue({ data: [] }),
    getBrands: vi.fn().mockResolvedValue({ data: [] }),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

const dummyToast = {
  addToast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
};

describe('BUG 4: Admin Products Card Status Chip & Header Structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false, // force mobile cards view (< 768px)
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  const dummyProduct = {
    id: 101,
    name: 'Lenovo ThinkPad T480 Core i7 16GB 512GB SSD Touchscreen Business Laptop',
    brand_name: 'Lenovo',
    condition: 'used_clean',
    price_sdg: 750000,
    price_aed: 1850,
    stock_quantity: 1,
    is_active: 1,
    is_featured: 0,
    type: 'laptop',
  };

  it('card header does not use position:absolute on the status chip and guarantees shrinking title stack', async () => {
    adminApi.getProducts.mockResolvedValue({
      data: [dummyProduct],
      meta: { page: 1, total_pages: 1, total: 1 },
    });

    const { container } = render(
      <ToastContext.Provider value={dummyToast}>
        <MemoryRouter initialEntries={['/admin/products']}>
          <AdminProductsPage />
        </MemoryRouter>
      </ToastContext.Provider>
    );

    await screen.findByText('Lenovo');

    // Find the mobile card
    const mobileCards = container.querySelectorAll(`.${styles.mobileCard}`);
    expect(mobileCards.length).toBeGreaterThan(0);

    const card = mobileCards[0];
    const header = card.querySelector(`.${styles.mobileCardHeader}`);
    expect(header).toBeTruthy();

    const chipWrapper = card.querySelector(`.${styles.mobileStatusChip}`);
    expect(chipWrapper).toBeTruthy();

    const infoStack = card.querySelector(`.${styles.mobileInfo}`);
    expect(infoStack).toBeTruthy();

    // Verify brand text is rendered cleanly without redundant "ماركة غير محددة"
    expect(screen.getByText('Lenovo')).toBeTruthy();
    expect(screen.queryByText('ماركة غير محددة')).toBeNull();

    // Verify stock warning is rendered in single row with count
    const stockRow = card.querySelector(`.${styles.mobileStockWrapper}`);
    expect(stockRow).toBeTruthy();
    expect(screen.getByText(/منخفض/)).toBeTruthy();
  });

  it('omits brand line cleanly when brand is absent without displaying placeholder text', async () => {
    const unbrandedProduct = {
      ...dummyProduct,
      id: 102,
      name: 'شاحن لابتوب أصلي 65 واط Type-C',
      brand_name: null,
      brand: null,
    };

    adminApi.getProducts.mockResolvedValue({
      data: [unbrandedProduct],
      meta: { page: 1, total_pages: 1, total: 1 },
    });

    render(
      <ToastContext.Provider value={dummyToast}>
        <MemoryRouter initialEntries={['/admin/products']}>
          <AdminProductsPage />
        </MemoryRouter>
      </ToastContext.Provider>
    );

    await screen.findByText('شاحن لابتوب أصلي 65 واط Type-C');
    expect(screen.queryByText('ماركة غير محددة')).toBeNull();
  });
});
