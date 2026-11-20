import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PaymentAccountsDisplay from '../components/store/PaymentAccountsDisplay';
import AnnouncementBanner from '../components/store/AnnouncementBanner';
import OrdersDisabledBanner from '../components/store/OrdersDisabledBanner';
import RecentPurchasesToast from '../components/store/RecentPurchasesToast';

describe('Storefront New Features Unit Tests', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('PaymentAccountsDisplay renders bank cards, account numbers, and general notes', () => {
    const mockAccounts = [
      {
        id: 1,
        bank_name: 'بنك الخرطوم (بنكك)',
        account_name: 'ويكس للتكنولوجيا',
        account_number: '1234567',
        branch: 'فرع أم درمان',
        notes: 'يرجى كتابة رقم الطلب في الملاحظات',
        is_active: 1,
      },
      {
        id: 2,
        bank_name: 'بنك فيصل الإسلامي (فوري)',
        account_name: 'ويكس للتقنية',
        account_number: '9876543',
        branch: null,
        notes: null,
        is_active: 1,
      },
    ];

    const html = renderToStaticMarkup(
      <PaymentAccountsDisplay
        accounts={mockAccounts}
        generalNotes="يرجى كتابة رقم الطلب في سبب التحويل بدقة"
        orderNumber="WX-1050"
      />
    );

    expect(html).toContain('بنك الخرطوم (بنكك)');
    expect(html).toContain('1234567');
    expect(html).toContain('فرع أم درمان');
    expect(html).toContain('يرجى كتابة رقم الطلب في الملاحظات');
    expect(html).toContain('بنك فيصل الإسلامي (فوري)');
    expect(html).toContain('9876543');
    expect(html).toContain('يرجى كتابة رقم الطلب في سبب التحويل بدقة');
    expect(html).toContain('WX-1050');
  });

  it('PaymentAccountsDisplay shows fallback when accounts list is empty', () => {
    const html = renderToStaticMarkup(
      <PaymentAccountsDisplay accounts={[]} />
    );

    expect(html).toContain('لا توجد حسابات دفع مفعلة حالياً');
  });

  it('AnnouncementBanner renders announcement with kind, title, and body', () => {
    const mockAnnouncements = [
      {
        id: 10,
        kind: 'promo',
        title: 'عروض نهاية العام',
        body: 'تخفيضات على أجهزة ThinkPad',
        link_label: 'تصفح العروض',
        link_url: '/products?category=thinkpad',
        placement: 'banner',
      },
    ];

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AnnouncementBanner announcements={mockAnnouncements} />
      </MemoryRouter>
    );

    expect(html).toContain('عروض نهاية العام');
    expect(html).toContain('تخفيضات على أجهزة ThinkPad');
    expect(html).toContain('تصفح العروض');
    expect(html).toContain('/products?category=thinkpad');
  });

  it('OrdersDisabledBanner renders polite Arabic pause message', () => {
    const customMessage = 'نعتذر، المتجر مغلق لجرد المخزون وسنعود غداً.';
    const html = renderToStaticMarkup(
      <OrdersDisabledBanner message={customMessage} />
    );

    expect(html).toContain(customMessage);
    expect(html).toContain('استقبال الطلبات متوقف مؤقت');
  });

  it('RecentPurchasesToast does not crash when wrapped in router', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RecentPurchasesToast purchases={[]} />
      </MemoryRouter>
    );
    expect(html).toBe('');
  });
});
