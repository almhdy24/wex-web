/**
 * @vitest-environment jsdom
 *
 * Regression tests for bugs found while enabling react-hooks/exhaustive-deps (WEB-HOOK-01..04).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ToastContext } from '../context/ToastContext';

vi.mock('../api/admin', () => ({
  adminApi: {
    getOrderDetail: vi.fn(),
    getPaymentProofImage: vi.fn(),
    getSettings: vi.fn().mockResolvedValue({ data: {} }),
    getUsers: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, per_page: 20 } }),
    updateUserRole: vi.fn(),
    updateUserStatus: vi.fn(),
  },
}));
vi.mock('../api/orders', () => ({
  ordersApi: { getOrders: vi.fn() },
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'admin' }, isAuthenticated: true, isAdmin: true, isStaff: true, loading: false }),
}));

import { adminApi } from '../api/admin';
import { ordersApi } from '../api/orders';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import OrdersPage from '../pages/store/OrdersPage';
import { swrCache } from '../utils/swrCache';

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
const withToast = (ui) => <ToastContext.Provider value={toast}>{ui}</ToastContext.Provider>;

function LocationProbe() {
  const loc = useLocation();
  return <span data-testid="loc">{loc.search}</span>;
}

beforeEach(() => {
  vi.clearAllMocks();
  swrCache.clear();
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = window.scrollTo || (() => {});
});

describe('WEB-HOOK-01 AdminUsersPage filter chips', () => {
  it('removing the role chip keeps a search typed after the chip appeared', async () => {
    render(withToast(
      <MemoryRouter initialEntries={['/admin/users?role=admin']}>
        <Routes>
          <Route path="/admin/users" element={<><AdminUsersPage /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>,
    ));

    const search = await screen.findByPlaceholderText('ابحث بالاسم أو البريد أو الهاتف...');
    fireEvent.change(search, { target: { value: 'سارة' } });
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toContain('q='), { timeout: 2000 });

    const removeRole = screen.getAllByRole('button').find((b) => (b.getAttribute('aria-label') || '').startsWith('إزالة فلتر الدور'));
    fireEvent.click(removeRole);

    await waitFor(() => {
      const qs = new URLSearchParams(screen.getByTestId('loc').textContent);
      expect(qs.get('role')).toBeNull();
      expect(qs.get('q')).toBe('سارة');
    });
  });
});

describe('WEB-HOOK-02 AdminOrderDetailPage proof thumbnails', () => {
  it('revokes the receipt blob URL on unmount', async () => {
    const created = 'blob:receipt-1';
    URL.createObjectURL = vi.fn(() => created);
    URL.revokeObjectURL = vi.fn();
    adminApi.getOrderDetail.mockResolvedValue({
      data: { order_number: 'WEX-1', status: 'payment_review', items: [], total_sdg: 1000, proofs: [{ id: 7, status: 'pending' }], payment_proofs: [{ id: 7, status: 'pending' }] },
    });
    adminApi.getPaymentProofImage.mockResolvedValue(new Blob(['x'], { type: 'image/jpeg' }));

    const { unmount } = render(withToast(
      <MemoryRouter initialEntries={['/admin/orders/WEX-1']}>
        <Routes><Route path="/admin/orders/:orderNumber" element={<AdminOrderDetailPage />} /></Routes>
      </MemoryRouter>,
    ));

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(created);
  });
});

describe('WEB-HOOK-03 AdminOrderDetailPage out-of-order responses', () => {
  it('a slow response for the previous order does not overwrite the current one', async () => {
    let resolveA;
    adminApi.getOrderDetail.mockImplementation((n) => (n === 'WEX-AAA'
      ? new Promise((r) => { resolveA = r; })
      : Promise.resolve({ data: { order_number: 'WEX-BBB', status: 'confirmed', items: [], total_sdg: 2000, proofs: [] } })));

    let go;
    function Nav() { go = useNavigate(); return null; }

    render(withToast(
      <MemoryRouter initialEntries={['/admin/orders/WEX-AAA']}>
        <Nav />
        <Routes><Route path="/admin/orders/:orderNumber" element={<AdminOrderDetailPage />} /></Routes>
      </MemoryRouter>,
    ));

    act(() => go('/admin/orders/WEX-BBB'));
    await screen.findAllByText(/WEX-BBB/);

    await act(async () => {
      resolveA({ data: { order_number: 'WEX-AAA', status: 'confirmed', items: [], total_sdg: 1000, proofs: [] } });
    });

    expect(screen.queryAllByText(/WEX-AAA/)).toHaveLength(0);
    expect(screen.queryAllByText(/WEX-BBB/).length).toBeGreaterThan(0);
  });
});

describe('WEB-HOOK-04 OrdersPage retry', () => {
  it('retry does not pass the click event as an AbortSignal', async () => {
    ordersApi.getOrders
      .mockRejectedValueOnce(Object.assign(new Error('تعذر الاتصال'), { status: 0 }))
      .mockResolvedValueOnce({ data: [] });

    render(withToast(<MemoryRouter><OrdersPage /></MemoryRouter>));

    const retry = await screen.findByText('إعادة المحاولة');
    fireEvent.click(retry);

    await waitFor(() => expect(ordersApi.getOrders).toHaveBeenCalledTimes(2));
    const signal = ordersApi.getOrders.mock.calls[1][1]?.signal;
    expect(signal === undefined || signal instanceof AbortSignal).toBe(true);
  });
});

describe('WEB-ADM-01 AdminUsersPage empty filtered result', () => {
  it('renders a clear-filters button instead of crashing', async () => {
    render(withToast(
      <MemoryRouter initialEntries={['/admin/users?role=staff']}>
        <Routes><Route path="/admin/users" element={<><AdminUsersPage /><LocationProbe /></>} /></Routes>
      </MemoryRouter>,
    ));
    const clear = await screen.findByRole('button', { name: 'مسح الفلاتر' });
    fireEvent.click(clear);
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toBe(''));
  });
});
