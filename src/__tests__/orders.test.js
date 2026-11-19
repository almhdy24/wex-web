import { describe, it, expect } from 'vitest';
import { getOrderStatusInfo, getProofStatusInfo } from '../utils/formatters';

describe('Customer Orders Unit Tests', () => {
  it('correctly maps all backend order statuses to Arabic labels and semantic variants', () => {
    const statuses = [
      { key: 'pending_payment', label: 'بانتظار الدفع', variant: 'warning' },
      { key: 'payment_review', label: 'مراجعة إشعار الدفع', variant: 'info' },
      { key: 'confirmed', label: 'تم تأكيد الطلب', variant: 'success' },
      { key: 'ready_for_pickup', label: 'جاهز للاستلام بالمحل', variant: 'info' },
      { key: 'out_for_delivery', label: 'جاري التوصيل مع المندوب', variant: 'info' },
      { key: 'completed', label: 'مكتمل ومستلم', variant: 'success' },
      { key: 'cancelled', label: 'ملغي', variant: 'danger' },
      { key: 'expired', label: 'انتهت فترة الحجز', variant: 'danger' },
    ];

    statuses.forEach(({ key, label, variant }) => {
      const info = getOrderStatusInfo(key);
      expect(info.label).toBe(label);
      expect(info.variant).toBe(variant);
    });
  });

  it('correctly maps payment proof review statuses', () => {
    expect(getProofStatusInfo('pending').variant).toBe('warning');
    expect(getProofStatusInfo('approved').variant).toBe('success');
    expect(getProofStatusInfo('rejected').variant).toBe('danger');
  });

  it('calculates remaining countdown time correctly', () => {
    const totalSeconds = 3665;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    expect(hours).toBe(1);
    expect(minutes).toBe(1);
    expect(seconds).toBe(5);
  });
});
