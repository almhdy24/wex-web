import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DataList from '../components/admin/DataList';
import StatusChip from '../components/admin/StatusChip';
import Stepper from '../components/admin/Stepper';
import ConfirmDialog from '../components/admin/ConfirmDialog';
import { adminAr } from '../content/admin.ar';

describe('Admin Primitives Unit Tests', () => {
  it('DataList renders table structure with provided columns and data', () => {
    const columns = [
      { key: 'name', label: 'الاسم', isPrimary: true },
      { key: 'role', label: 'الدور', isStatus: true },
      { key: 'phone', label: 'الهاتف' },
    ];
    const data = [
      { id: 1, name: 'أحمد علي', role: 'مدير', phone: '0912345678' },
      { id: 2, name: 'سارة عمر', role: 'موظف', phone: '0987654321' },
    ];

    const html = renderToStaticMarkup(<DataList columns={columns} data={data} />);

    // Table view
    expect(html).toContain('الاسم');
    expect(html).toContain('الدور');
    expect(html).toContain('أحمد علي');
    expect(html).toContain('سارة عمر');
    expect(html).toContain('0912345678');
  });

  it('DataList renders empty state when data is empty', () => {
    const html = renderToStaticMarkup(
      <DataList columns={[{ key: 'id', label: 'الرقم' }]} data={[]} emptyMessage="لا توجد طلبات" />
    );
    expect(html).toContain('لا توجد طلبات');
  });

  it('DataList handles standardized pagination contract and legacy currentPage', () => {
    const columns = [{ key: 'id', label: 'الرقم' }];
    const data = [{ id: 1 }, { id: 2 }];

    // Standard contract: { page: 2, totalPages: 5, totalItems: 10 }
    const htmlStandard = renderToStaticMarkup(
      <DataList
        columns={columns}
        data={data}
        pagination={{ page: 2, totalPages: 5, totalItems: 10, onPageChange: () => {} }}
      />
    );
    expect(htmlStandard).toContain('صفحة 2 من 5');
    expect(htmlStandard).toContain('(10 عنصر)');

    // Legacy alias: { currentPage: 3, totalPages: 5 }
    const htmlLegacy = renderToStaticMarkup(
      <DataList
        columns={columns}
        data={data}
        pagination={{ currentPage: 3, totalPages: 5, onPageChange: () => {} }}
      />
    );
    expect(htmlLegacy).toContain('صفحة 3 من 5');
  });

  it('DataList renders mobile cards with isActions slot in card footer', () => {
    const columns = [
      { key: 'name', label: 'الاسم', isPrimary: true },
      { key: 'phone', label: 'الهاتف' },
      {
        key: 'actions',
        label: 'الإجراءات',
        isActions: true,
        render: () => <button type="button">تعديل الصلاحيات</button>,
      },
    ];
    const data = [{ id: 1, name: 'سارة', phone: '0912345678' }];

    const htmlCards = renderToStaticMarkup(
      <DataList columns={columns} data={data} forceView="cards" />
    );
    expect(htmlCards).toContain('role="list"');
    expect(htmlCards).toContain('role="listitem"');
    expect(htmlCards).toContain('سارة');
    expect(htmlCards).toContain('تعديل الصلاحيات');
  });

  it('StatusChip renders icon and text for order statuses', () => {
    const htmlPending = renderToStaticMarkup(<StatusChip status="pending_payment" />);
    expect(htmlPending).toContain('بانتظار التحويل');

    const htmlConfirmed = renderToStaticMarkup(<StatusChip status="confirmed" />);
    expect(htmlConfirmed).toContain('تم تأكيد الدفع');

    const htmlDelivered = renderToStaticMarkup(<StatusChip status="delivered" />);
    expect(htmlDelivered).toContain('تم التسليم بنجاح');
  });

  it('StatusChip renders role status correctly', () => {
    const htmlAdmin = renderToStaticMarkup(<StatusChip status="admin" />);
    expect(htmlAdmin).toContain('مدير نظام');

    const htmlStaff = renderToStaticMarkup(<StatusChip status="staff" />);
    expect(htmlStaff).toContain('طاقم عمل');
  });

  it('Stepper renders value and controls', () => {
    const html = renderToStaticMarkup(<Stepper value={5} />);
    expect(html).toContain('5');
    expect(html).toContain('إنقاص');
    expect(html).toContain('زيادة');
  });

  it('ConfirmDialog renders title, description, and action buttons', () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="تأكيد الحذف"
        description="سيتم حذف هذا العنصر نهائياً"
        confirmLabel="نعم، احذف"
      />
    );
    expect(html).toContain('تأكيد الحذف');
    expect(html).toContain('سيتم حذف هذا العنصر نهائياً');
    expect(html).toContain('نعم، احذف');
  });

  it('ConfirmDialog accepts legacy message and confirmText aliases', () => {
    const htmlLegacy = renderToStaticMarkup(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="تأكيد التنشيط"
        message="هل تريد إعادة التنشيط؟"
        confirmText="تنشيط الحساب"
      />
    );
    expect(htmlLegacy).toContain('تأكيد التنشيط');
    expect(htmlLegacy).toContain('هل تريد إعادة التنشيط؟');
    expect(htmlLegacy).toContain('تنشيط الحساب');
  });

  it('StatusChip supports account and visibility domains', () => {
    const htmlActiveAccount = renderToStaticMarkup(
      <StatusChip domain="account" status="active" />
    );
    expect(htmlActiveAccount).toContain('نشط');

    const htmlInactiveAccount = renderToStaticMarkup(
      <StatusChip domain="account" status="inactive" />
    );
    expect(htmlInactiveAccount).toContain('معطل');

    const htmlActiveVis = renderToStaticMarkup(
      <StatusChip domain="visibility" status="active" />
    );
    expect(htmlActiveVis).toContain('معروض');
  });

  it('admin.ar.js contains zero forbidden marketing puffery words', () => {
    const raw = JSON.stringify(adminAr);
    const forbidden = /أصيل|أصلي|أفضل|مميز|حصري|ضمان حقيقي|ذكي/u;
    expect(forbidden.test(raw)).toBe(false);
  });

  it('admin.ar.js contains zero emojis', () => {
    const raw = JSON.stringify(adminAr);
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(raw)).toBe(false);
  });

  it('verifies sticky action bar sits above admin tab bar using offset variable and z-index > 100 on every admin form', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');

    const formStylesheets = [
      'src/pages/admin/AdminProductFormPage.module.css',
      'src/pages/admin/AdminHeroSlidesPage.module.css',
      'src/pages/admin/AdminSettingsPage.module.css',
      'src/pages/admin/AdminRatesPage.module.css',
    ];

    for (const cssPath of formStylesheets) {
      const fullPath = resolve(process.cwd(), cssPath);
      const css = readFileSync(fullPath, 'utf8');

      // 1. Must define .stickyBottomBar
      expect(css).toContain('.stickyBottomBar');

      // 2. Must apply --admin-tab-bar-height offset
      expect(css).toMatch(/bottom:\s*calc\(var\(--admin-tab-bar-height/);

      // 3. Must have z-index > 100 to stay above admin tab bar (which has z-index 100)
      const zIndexMatch = css.match(/\.stickyBottomBar[\s\S]*?z-index:\s*(?:var\([^,]+,\s*)?([0-9]+)/);
      expect(Boolean(zIndexMatch)).toBe(true);
      const zIndex = parseInt(zIndexMatch[1], 10);
      expect(zIndex).toBeGreaterThan(100);
    }

    const adminShellCss = readFileSync(resolve(process.cwd(), 'src/components/admin/AdminShell.module.css'), 'utf8');
    expect(adminShellCss).toContain('var(--admin-tab-bar-height');
  });
});
