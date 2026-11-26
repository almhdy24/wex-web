import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/store/HomePage';
import StoreFooter from '../components/store/StoreFooter';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { ToastContext } from '../context/ToastContext';
import { FavoritesContext } from '../context/FavoritesContext';

vi.mock('../api/shop', () => ({
  shopApi: {
    getShop: vi.fn().mockResolvedValue({
      data: {
        address: 'مول الواحة، الشهداء، أم درمان',
        lock_hours: 4,
        prices_updated_at: '2026-11-20T23:37:02Z',
        whatsapp: '249912345678',
      },
    }),
  },
}));

vi.mock('../api/products', () => ({
  productsApi: {
    getProducts: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Dell Latitude 7490',
          price_sdg: 487500,
          condition: 'used_imported',
          type: 'laptop',
          cpu: 'i5',
          ram: '8GB',
          storage: '256GB',
        },
      ],
    }),
  },
}));

describe('HomePage Rescue Verification (Phase 2)', () => {
  const dummyAuth = {
    user: null,
    isAuthenticated: false,
  };

  const dummyCart = {
    addItem: vi.fn(),
  };

  const dummyToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const dummyFavorites = {
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  };

  function renderHome(authValue = dummyAuth) {
    return renderToStaticMarkup(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <CartContext.Provider value={dummyCart}>
            <ToastContext.Provider value={dummyToast}>
              <FavoritesContext.Provider value={dummyFavorites}>
                <HomePage
                  initialLoading={false}
                  initialProducts={[
                    {
                      id: 1,
                      name: 'Dell Latitude 7490',
                      price_sdg: 487500,
                      condition: 'used_imported',
                      type: 'laptop',
                    },
                  ]}
                  initialShopInfo={{
                    address: 'مول الواحة، الشهداء، أم درمان',
                    lock_hours: 4,
                    prices_updated_at: '2026-11-20T23:37:02Z',
                    whatsapp: '249912345678',
                  }}
                />
              </FavoritesContext.Provider>
            </ToastContext.Provider>
          </CartContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  // VIS-04: the desktop footer listed 4 order steps while the home panel lists 3.
  it('footer "طريقة الطلب" lists exactly the home panel steps', () => {
    const strip = (t) => t.replace(/<[^>]+>/g, '').trim();
    const homeSteps = [...renderHome().matchAll(/<p class="[^"]*stepText[^"]*">([^<]+)<\/p>/g)].map((m) => strip(m[1]));
    const footerHtml = renderToStaticMarkup(
      <MemoryRouter>
        <StoreFooter shopInfo={null} />
      </MemoryRouter>
    );
    const footerSteps = [...footerHtml.matchAll(/<div class="[^"]*stepItem[^"]*">([^<]+)<\/div>/g)].map((m) => strip(m[1]).replace(/^\d+\.\s*/, ''));
    expect(homeSteps).toHaveLength(3);
    expect(footerSteps).toEqual(homeSteps);
  });

  it('renders guest greeting and search with 12h time price caption', () => {
    const html = renderHome();
    expect(html).toContain('مرحبًا بك');
    expect(html).toContain('ابحث عن جهاز أو ماركة');
    expect(html).toContain('آخر تحديث للأسعار:');
    expect(html).toContain('ص'); // 12-hour Arabic morning indicator
  });

  it('renders user greeting when logged in without subtitle', () => {
    const loggedInAuth = {
      user: { name: 'عثمان' },
      isAuthenticated: true,
    };
    const html = renderHome(loggedInAuth);
    expect(html).toContain('مرحبًا، عثمان');
    expect(html).not.toContain('أجهزة مختارة بعناية لتناسب');
  });

  it('renders exactly 3 category tiles: الحواسيب، الهواتف، الملحقات', () => {
    const html = renderHome();
    expect(html).toContain('الحواسيب');
    expect(html).toContain('الهواتف');
    expect(html).toContain('الملحقات');
    // Ensure quick actions row and category chips with colored dots are removed
    expect(html).not.toContain('تتبّع طلبي');
    expect(html).not.toContain('موقع المحل');
  });

  it('renders steps block with number badges and shop block with hours', () => {
    const html = renderHome();
    expect(html).toContain('طريقة الطلب');
    // 3-step flow introduced by the Phase 3-6 storefront IA (2bd3018)
    expect(html).toContain('اختر الجهاز وأكّد الطلب لتثبيت السعر');
    expect(html).toContain('حوّل المبلغ وارفع إشعار التحويل البنكي');
    expect(html).toContain('استلم طلبك من المحل أو عبر التوصيل');

    // Shop Block
    expect(html).toContain('ويكس تكنولوجي');
    expect(html).toContain('مول الواحة، الشهداء، أم درمان');
    expect(html).toContain('السبت - الخميس: 9:00 ص - 9:00 م');
    // Hours come from the admin text only; no hard-coded 'الجمعة: مغلق' line.
    expect(html).not.toContain('الجمعة: مغلق');
    expect(html).toContain('الموقع على الخريطة');
    expect(html).toContain('تواصل عبر واتساب');
  });

  it('renders the "وصل حديثاً" / "مختارات المتجر" rows and no duplicate audience sections', () => {
    const html = renderHome();
    // Phase 3-6 IA (2bd3018) replaced the single "أجهزة مختارة" section with these rows.
    expect(html).toContain('وصل حديثاً');
    expect(html).toContain('مختارات المتجر');
    expect(html).not.toContain('أجهزة مختارة');
    // CLAIM-01: no popularity claim the shop cannot back (it lists featured items).
    expect(html).not.toContain('الأكثر طلب');
    expect(html).not.toContain('الأكثر مبيع');
    // Ensure duplicate audience sections stay removed
    expect(html).not.toContain('للدراسة');
    expect(html).not.toContain('للعمل');
  });
});
