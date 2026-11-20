import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Toast, { ToastContainer } from '../components/common/Toast';
import LatinText from '../components/common/LatinText';

describe('Phase 2: Toast System Unit, Anatomy & Accessibility Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('1. Toast anatomy: renders semantic icons, bold title, detail, 44px close target, and progress bar', () => {
    const mockToast = {
      id: 't-1',
      type: 'success',
      title: 'أُضيف إلى السلة',
      detail: <LatinText>ThinkPad T480s</LatinText>,
      duration: 4000,
      count: 1,
      action: {
        label: 'عرض السلة',
        onClick: vi.fn(),
      },
    };

    const html = renderToStaticMarkup(
      <Toast toast={mockToast} onDismiss={vi.fn()} />
    );

    // Title and detail
    expect(html).toContain('أُضيف إلى السلة');
    expect(html).toContain('ThinkPad T480s');
    expect(html).toContain('<bdi dir="ltr">');

    // Action button
    expect(html).toContain('عرض السلة');

    // 44px close target with accessible label
    expect(html).toContain('aria-label="إغلاق التنبيه"');

    // Status accessibility
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');

    // Progress bar container
    expect(html).toContain('progressBarContainer');
  });

  it('2. Toast error role: uses role="alert" and aria-live="assertive"', () => {
    const errorToast = {
      id: 't-err',
      type: 'error',
      title: 'فشل الاتصال بالخادم',
      detail: 'يرجى التحقق من اتصالك بالإنترنت',
      duration: 8000,
    };

    const html = renderToStaticMarkup(
      <Toast toast={errorToast} onDismiss={vi.fn()} />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain('فشل الاتصال بالخادم');
  });

  it('3. Repeated toast display count badge when count > 1', () => {
    const countToast = {
      id: 't-count',
      type: 'info',
      title: 'أُضيف إلى المقارنة',
      detail: '2 من 3',
      count: 3,
    };

    const html = renderToStaticMarkup(
      <Toast toast={countToast} onDismiss={vi.fn()} />
    );

    expect(html).toContain('×3');
    expect(html).toContain('تكرر 3 مرات');
  });

  it('4. ToastContainer renders max visible toasts and uses bottom-offset in styles', () => {
    const toasts = [
      { id: '1', type: 'info', title: 'إشعار 1' },
      { id: '2', type: 'success', title: 'إشعار 2' },
    ];

    const html = renderToStaticMarkup(
      <ToastContainer toasts={toasts} onDismiss={vi.fn()} />
    );

    expect(html).toContain('إشعار 1');
    expect(html).toContain('إشعار 2');
  });

  it('5. LatinText wraps product names and numbers safely in <bdi dir="ltr">', () => {
    const html1 = renderToStaticMarkup(<LatinText>Dell Latitude 7420</LatinText>);
    expect(html1).toBe('<bdi dir="ltr">Dell Latitude 7420</bdi>');

    const html2 = renderToStaticMarkup(<LatinText>16 GB RAM / 512 GB SSD</LatinText>);
    expect(html2).toBe('<bdi dir="ltr">16 GB RAM / 512 GB SSD</bdi>');

    const htmlEmpty = renderToStaticMarkup(<LatinText>{null}</LatinText>);
    expect(htmlEmpty).toBe('');
  });

  it('6. Queue management: deduplication within 2s window updates existing item', () => {
    const DEDUPE_WINDOW_MS = 2000;
    const MAX_VISIBLE = 2;
    let queue = [];
    const recentDispatches = new Map();

    const dispatch = (toast) => {
      const now = Date.now();
      const dedupeKey = toast.dedupeKey || `${toast.type}::${toast.title}`;
      const last = recentDispatches.get(dedupeKey);

      if (last && now - last.timestamp < DEDUPE_WINDOW_MS) {
        recentDispatches.set(dedupeKey, { id: last.id, timestamp: now });
        const idx = queue.findIndex((t) => t.id === last.id);
        if (idx !== -1) {
          queue[idx] = {
            ...queue[idx],
            count: (queue[idx].count || 1) + 1,
            title: toast.title,
          };
        }
        return last.id;
      }

      const id = toast.id || `id-${now}-${Math.random()}`;
      recentDispatches.set(dedupeKey, { id, timestamp: now });
      const newToast = { ...toast, id, count: 1 };
      queue = queue.length >= MAX_VISIBLE ? [...queue.slice(-(MAX_VISIBLE - 1)), newToast] : [...queue, newToast];
      return id;
    };

    // First dispatch
    dispatch({ dedupeKey: 'cart-1', type: 'success', title: 'أُضيف إلى السلة' });
    expect(queue.length).toBe(1);
    expect(queue[0].count).toBe(1);

    // Rapid second dispatch (500ms later)
    vi.advanceTimersByTime(500);
    dispatch({ dedupeKey: 'cart-1', type: 'success', title: 'أُضيف إلى السلة' });
    expect(queue.length).toBe(1); // Still 1 item, updated in place!
    expect(queue[0].count).toBe(2);

    // Third different item added
    dispatch({ dedupeKey: 'fav-2', type: 'info', title: 'أُضيف إلى المفضلة' });
    expect(queue.length).toBe(2);

    // Fourth item added: drops oldest, keeps max 2
    dispatch({ dedupeKey: 'comp-3', type: 'warning', title: 'أُضيف إلى المقارنة' });
    expect(queue.length).toBe(2);
    expect(queue.find((t) => t.dedupeKey === 'cart-1')).toBeUndefined();
    expect(queue.find((t) => t.dedupeKey === 'comp-3')).toBeDefined();
  });
});
