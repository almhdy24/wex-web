/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderDetailPage from '../pages/store/OrderDetailPage';
import { ordersApi } from '../api/orders';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';

// Mock ordersApi
vi.mock('../api/orders', () => ({
  ordersApi: {
    getOrderDetail: vi.fn(),
    uploadPaymentProof: vi.fn(),
    getPaymentProofImage: vi.fn(),
    reorder: vi.fn(),
  },
}));

describe('PaymentProofViewer in OrderDetailPage', () => {
  const mockAuth = {
    user: { id: 1, name: 'محمد', role: 'customer' },
    isAuthenticated: true,
  };

  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  const createdUrls = [];
  const revokedUrls = [];

  beforeEach(() => {
    vi.clearAllMocks();
    createdUrls.length = 0;
    revokedUrls.length = 0;

    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn((blob) => {
      const url = `blob:http://localhost/test-proof-${createdUrls.length + 1}`;
      createdUrls.push(url);
      return url;
    });

    URL.revokeObjectURL = vi.fn((url) => {
      revokedUrls.push(url);
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  const baseOrderUnderReview = {
    id: 101,
    order_number: 'WEX-261121-C1A99',
    status: 'payment_review',
    total_sdg: 500000,
    seconds_remaining: 7200,
    lock_expires_at: new Date(Date.now() + 7200000).toISOString(),
    order_type: 'pickup',
    payment: {
      state: 'under_review',
      can_upload: false,
      can_review: true,
      latest_proof: { id: 45, status: 'pending', image_url: '/api/v1/orders/WEX-261121-C1A99/payment-proof/45/image' },
      proofs_count: 1,
    },
    items: [],
  };

  function renderPage(order = baseOrderUnderReview) {
    return render(
      <MemoryRouter initialEntries={[`/orders/${order.order_number}`]}>
        <AuthContext.Provider value={mockAuth}>
          <ToastContext.Provider value={mockToast}>
            <Routes>
              <Route
                path="/orders/:orderNumber"
                element={<OrderDetailPage initialOrder={order} initialLoading={false} />}
              />
            </Routes>
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  it('fetches authenticated blob and renders proof image when viewing existing order (page refresh scenario)', async () => {
    const fakeBlob = new Blob(['fake image data'], { type: 'image/png' });
    ordersApi.getPaymentProofImage.mockResolvedValueOnce(fakeBlob);

    renderPage();

    // Verify ordersApi.getPaymentProofImage called with orderNumber and proof.id
    expect(ordersApi.getPaymentProofImage).toHaveBeenCalledWith('WEX-261121-C1A99', 45);

    // Verify blob URL created and image rendered
    await waitFor(() => {
      const img = screen.getByAltText('صورة إشعار التحويل');
      expect(img).toBeTruthy();
      expect(img.getAttribute('src')).toBe('blob:http://localhost/test-proof-1');
    });

    expect(createdUrls).toContain('blob:http://localhost/test-proof-1');
  });

  it('opens full-size modal when clicking thumbnail and closes on close button', async () => {
    const fakeBlob = new Blob(['fake image data'], { type: 'image/png' });
    ordersApi.getPaymentProofImage.mockResolvedValueOnce(fakeBlob);

    renderPage();

    await waitFor(() => {
      expect(screen.getByAltText('صورة إشعار التحويل')).toBeTruthy();
    });

    // Click thumbnail to zoom
    const thumbBox = screen.getByRole('button', { name: /عرض إشعار التحويل بالحجم الكامل/i });
    fireEvent.click(thumbBox);

    // Modal dialog appears
    const modal = screen.getByRole('dialog', { name: /عرض صورة الإشعار/i });
    expect(modal).toBeTruthy();
    const fullImg = screen.getByAltText('صورة إشعار التحويل كاملة');
    expect(fullImg).toBeTruthy();
    expect(fullImg.getAttribute('src')).toBe('blob:http://localhost/test-proof-1');

    // Close button dismisses modal
    const closeBtn = screen.getByRole('button', { name: /إغلاق/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('handles API error when image request fails and allows retry', async () => {
    ordersApi.getPaymentProofImage.mockRejectedValueOnce(new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً')).toBeTruthy();
    });
    expect(screen.queryByAltText('صورة إشعار التحويل')).toBeNull();

    // Verify retry button is present and triggers re-fetch
    const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/i });
    expect(retryBtn).toBeTruthy();

    const fakeBlob = new Blob(['fake image data retry'], { type: 'image/png' });
    ordersApi.getPaymentProofImage.mockResolvedValueOnce(fakeBlob);

    fireEvent.click(retryBtn);

    await waitFor(() => {
      const img = screen.getByAltText('صورة إشعار التحويل');
      expect(img).toBeTruthy();
    });
  });

  it('revokes blob URL when component unmounts', async () => {
    const fakeBlob = new Blob(['fake image data'], { type: 'image/png' });
    ordersApi.getPaymentProofImage.mockResolvedValueOnce(fakeBlob);

    const { unmount } = renderPage();

    await waitFor(() => {
      expect(createdUrls.length).toBe(1);
    });

    unmount();

    expect(revokedUrls).toContain('blob:http://localhost/test-proof-1');
  });
});
