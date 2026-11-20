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
});
