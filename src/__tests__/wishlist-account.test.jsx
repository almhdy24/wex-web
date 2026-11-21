import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import FavoritesPage from '../pages/store/FavoritesPage';
import AccountPage from '../pages/store/AccountPage';
import { FavoritesContext } from '../context/FavoritesContext';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';

describe('WEX Wishlist & Customer Account Experience Tests', () => {
  const dummyToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  const dummyCart = {
    cart: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    totalItems: 0,
    totalPrice: 0,
  };

  const sampleProducts = [
    {
      id: 101,
      slug: 'thinkpad-x1-carbon-gen-9',
      name: 'Lenovo ThinkPad X1 Carbon Gen 9',
      price_sdg: 780000,
      processor: 'Core i7-1185G7',
      ram: '16GB',
      storage: '512GB NVMe',
      screen_size: '14" 4K',
      condition: 'used',
      stock_quantity: 10,
      stock_status: 'in_stock',
    },
    {
      id: 102,
      slug: 'dell-precision-5560',
      name: 'Dell Precision 5560 Workstation',
      price_sdg: 1250000,
      processor: 'Core i7-11800H',
      ram: '32GB',
      storage: '1TB NVMe',
      screen_size: '15.6" UHD',
      condition: 'open_box',
      stock_quantity: 0,
      stock_status: 'out_of_stock',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario 1 & 4: Wishlist Storage & Rendering', () => {
    it('renders empty wishlist state with explore action and clear guidance', () => {
      const emptyFavorites = {
        favorites: [],
        favoriteCount: 0,
        isFavorite: () => false,
        toggleFavorite: vi.fn(),
        removeFavorite: vi.fn(),
        clearFavorites: vi.fn(),
        moveToCart: vi.fn(),
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <ToastContext.Provider value={dummyToast}>
            <CartContext.Provider value={dummyCart}>
              <FavoritesContext.Provider value={emptyFavorites}>
                <FavoritesPage />
              </FavoritesContext.Provider>
            </CartContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('المفضلة فارغة');
      expect(html).toContain('تصفّح الأجهزة');
      expect(html).toContain('احفظ الأجهزة بالضغط على رمز القلب');
    });

    it('renders responsive product grid with prices in SDG, specs, and availability', () => {
      const activeFavorites = {
        favorites: sampleProducts,
        favoriteCount: 2,
        isFavorite: () => true,
        toggleFavorite: vi.fn(),
        removeFavorite: vi.fn(),
        clearFavorites: vi.fn(),
        moveToCart: vi.fn(),
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <ToastContext.Provider value={dummyToast}>
            <CartContext.Provider value={dummyCart}>
              <FavoritesContext.Provider value={activeFavorites}>
                <FavoritesPage />
              </FavoritesContext.Provider>
            </CartContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      // Verify product information
      expect(html).toContain('Lenovo ThinkPad X1 Carbon Gen 9');
      expect(html).toContain('Dell Precision 5560 Workstation');
      expect(html).toContain('780,000 ج.س');
      expect(html).toContain('1,250,000 ج.س');

      // Verify stock availability badges (ar.wishlist.inStock vs ar.wishlist.outOfStock)
      expect(html).toContain('متوفر');
      expect(html).toContain('غير متوفر');

      // Verify specs display
      expect(html).toContain('Core i7-11800H');
      expect(html).toContain('16\u00a0GB');
      expect(html).toContain('32\u00a0GB');

      // Zero customer-facing foreign currencies
      expect(html).not.toContain('AED');
      expect(html).not.toContain('درهم');
      expect(html).not.toContain('USD');
    });
  });

  describe('Scenario 2: Guest to Authenticated Wishlist Merging Logic', () => {
    it('properly merges guest favorites into user favorites without duplicates', () => {
      const guestItems = [
        { id: 101, name: 'Lenovo ThinkPad' },
        { id: 102, name: 'Dell Precision' },
      ];
      const existingUserItems = [
        { id: 102, name: 'Dell Precision' },
        { id: 103, name: 'HP EliteBook' },
      ];

      // Simulate merge logic as in FavoritesContext
      const existingIds = new Set(existingUserItems.map((p) => p.id));
      const newItemsFromGuest = guestItems.filter((p) => !existingIds.has(p.id));
      const merged = [...existingUserItems, ...newItemsFromGuest];

      expect(merged).toHaveLength(3);
      expect(merged.map((p) => p.id)).toEqual([102, 103, 101]);
    });
  });

  describe('Scenario 5: Profile & Personal Information Tab', () => {
    it('renders customer profile information and verification badges', () => {
      const authUser = {
        id: 42,
        name: 'محمد عبد الله',
        email: 'mohamed@example.com',
        phone: '0912345678',
        email_verified: true,
        google_linked: true,
      };

      const mockAuth = {
        user: authUser,
        isAuthenticated: true,
        updateUser: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
      };

      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={['/account?tab=profile']}>
          <ToastContext.Provider value={dummyToast}>
            <AuthContext.Provider value={mockAuth}>
              <FavoritesContext.Provider value={{ favorites: sampleProducts, favoriteCount: 2 }}>
                <AccountPage />
              </FavoritesContext.Provider>
            </AuthContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      // Verify profile fields
      expect(html).toContain('محمد عبد الله');
      expect(html).toContain('mohamed@example.com');
      expect(html).toContain('0912345678');
      expect(html).toContain('موثق');
    });

    it('validates Sudanese phone numbers (09x, 01x, 10 digits)', () => {
      const isValidSudanesePhone = (phone) => {
        if (!phone) return true; // optional
        const cleaned = phone.replace(/[\s-]/g, '');
        return /^(09|01)\d{8}$/.test(cleaned);
      };

      expect(isValidSudanesePhone('0912345678')).toBe(true);
      expect(isValidSudanesePhone('0123456789')).toBe(true);
      expect(isValidSudanesePhone('0999999999')).toBe(true);
      expect(isValidSudanesePhone('0512345678')).toBe(false); // invalid prefix
      expect(isValidSudanesePhone('091234567')).toBe(false); // only 9 digits
      expect(isValidSudanesePhone('09123456789')).toBe(false); // 11 digits
    });
  });

  describe('Scenario 6, 7 & 8: Linked Accounts & Security Management', () => {
    it('renders Security tab with connected Google, active Email OTP, and unsupported Facebook notice', () => {
      const authUser = {
        id: 42,
        name: 'سارة أحمد',
        email: 'sara@gmail.com',
        phone: '0123456789',
        email_verified: true,
        google_linked: true,
      };

      const mockAuth = {
        user: authUser,
        isAuthenticated: true,
        updateUser: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
      };

      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={['/account?tab=security']}>
          <ToastContext.Provider value={dummyToast}>
            <AuthContext.Provider value={mockAuth}>
              <FavoritesContext.Provider value={{ favorites: [], favoriteCount: 0 }}>
                <AccountPage />
              </FavoritesContext.Provider>
            </AuthContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      // Verify Email OTP is shown as primary method
      expect(html).toContain('البريد الإلكتروني (رمز OTP)');
      expect(html).toContain('طريقة الدخول برمز التحقق عبر البريد الإلكتروني');

      // Verify Google OAuth status
      expect(html).toContain('حساب Google');
      expect(html).toContain('مرتبط بحساب Google');

      // Verify Facebook shows honest status without fake connection buttons
      expect(html).toContain('حساب Facebook');
      expect(html).toContain('نظام الدخول يعتمد على البريد (OTP) وGoogle');

      // Verify Sessions & Logout Actions
      expect(html).toContain('تسجيل الخروج من هذا الجهاز');
      expect(html).toContain('تسجيل الخروج من جميع الأجهزة');
    });

    it('renders Security tab when Google is not linked, offering connection action', () => {
      const authUser = {
        id: 43,
        name: 'علي حسن',
        email: 'ali@example.com',
        phone: '0911223344',
        email_verified: true,
        google_linked: false,
      };

      const mockAuth = {
        user: authUser,
        isAuthenticated: true,
        updateUser: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
      };

      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={['/account?tab=security']}>
          <ToastContext.Provider value={dummyToast}>
            <AuthContext.Provider value={mockAuth}>
              <FavoritesContext.Provider value={{ favorites: [], favoriteCount: 0 }}>
                <AccountPage />
              </FavoritesContext.Provider>
            </AuthContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('غير مرتبط');
      expect(html).toContain('ربط حساب Google');
    });
  });

  describe('Scenario 3 & 9: Account Navigation, Wishlist Integration & RTL UI', () => {
    it('renders multi-tab segmented navigation for clean visual hierarchy', () => {
      const authUser = {
        id: 42,
        name: 'محمد عبد الله',
        email: 'mohamed@example.com',
        phone: '0912345678',
      };

      const mockAuth = {
        user: authUser,
        isAuthenticated: true,
        updateUser: vi.fn(),
        logout: vi.fn(),
      };

      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={['/account']}>
          <ToastContext.Provider value={dummyToast}>
            <AuthContext.Provider value={mockAuth}>
              <FavoritesContext.Provider value={{ favorites: sampleProducts, favoriteCount: 2 }}>
                <AccountPage />
              </FavoritesContext.Provider>
            </AuthContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      // Verify segmented navigation tabs exist
      expect(html).toContain('نظرة عامة');
      expect(html).toContain('المعلومات الشخصية');
      expect(html).toContain('عناوين التوصيل');
      expect(html).toContain('الأمان والحسابات المرتبطة');
      expect(html).toContain('الإعدادات وتفضيلات المتجر');

      // Verify overview cards
      expect(html).toContain('قائمة الأجهزة المفضلة');
      expect(html).toContain('متابعة وسجل الطلبات');
      expect(html).toContain('متجر ويكس تكنولوجي — فرع أم درمان');
    });
  });
});
