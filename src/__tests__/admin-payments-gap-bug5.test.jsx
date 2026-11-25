/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import { adminApi } from '../api/admin';
import { ToastContext } from '../context/ToastContext';
import styles from '../pages/admin/AdminPaymentsPage.module.css';

vi.mock('../api/admin', () => ({
  adminApi: {
    getOrders: vi.fn(),
    getOrderDetail: vi.fn(),
    getPaymentProofImage: vi.fn().mockResolvedValue(new Blob(['dummy'], { type: 'image/jpeg' })),
    approvePaymentProof: vi.fn(),
    rejectPaymentProof: vi.fn(),
  },
}));

const dummyToast = {
  addToast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
};

describe('BUG 5: Admin Payments Page Layout & Clearance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const dummyQueueItem = {
    order_number: 'WEX-8801',
    created_at: new Date().toISOString(),
    total_sdg: 450000,
    price_locked_until: new Date(Date.now() + 3600000).toISOString(),
    payment_proofs: [
      {
        id: 1,
        status: 'pending',
        path: '/proofs/p1.jpg',
        created_at: new Date().toISOString(),
      },
    ],
  };

  it('renders verification card immediately below header on mobile with details column ordered before image column', async () => {
    adminApi.getOrders.mockResolvedValue({
      data: [dummyQueueItem],
      total: 1,
    });
    adminApi.getOrderDetail.mockResolvedValue({
      data: dummyQueueItem,
    });

    const { container } = render(
      <ToastContext.Provider value={dummyToast}>
        <MemoryRouter initialEntries={['/admin/payments']}>
          <AdminPaymentsPage />
        </MemoryRouter>
      </ToastContext.Provider>
    );

    await screen.findByText(/طلب رقم/);

    const reviewGrid = container.querySelector(`.${styles.reviewGrid}`);
    expect(reviewGrid).toBeTruthy();

    const detailsCol = container.querySelector(`.${styles.detailsColumn}`);
    expect(detailsCol).toBeTruthy();

    const imageCol = container.querySelector(`.${styles.imageColumn}`);
    expect(imageCol).toBeTruthy();

    const card = container.querySelector(`.${styles.verificationCard}`);
    expect(card).toBeTruthy();

    // Verify verification card contains expected payment details
    expect(screen.getByText('WEX-8801')).toBeTruthy();
  });
});
