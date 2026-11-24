/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageManager from '../components/admin/ImageManager';
import Lightbox from '../components/common/Lightbox';
import adminApi from '../api/admin';
import { ToastContext } from '../context/ToastContext';

vi.mock('../api/admin', () => ({
  default: {
    uploadProductImages: vi.fn().mockResolvedValue({ data: [] }),
    updateProductImage: vi.fn().mockResolvedValue({ data: {} }),
    deleteProductImage: vi.fn().mockResolvedValue({ data: {} }),
    reorderProductImages: vi.fn().mockResolvedValue({ data: [] }),
    getProduct: vi.fn().mockResolvedValue({ data: { images: [] } }),
  },
  adminApi: {
    uploadProductImages: vi.fn().mockResolvedValue({ data: [] }),
    updateProductImage: vi.fn().mockResolvedValue({ data: {} }),
    deleteProductImage: vi.fn().mockResolvedValue({ data: {} }),
    reorderProductImages: vi.fn().mockResolvedValue({ data: [] }),
    getProduct: vi.fn().mockResolvedValue({ data: { images: [] } }),
  },
}));

describe('ImageManager component', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no images are provided', () => {
    render(
      <ToastContext.Provider value={mockToast}>
        <ImageManager productId={10} images={[]} onImagesChange={vi.fn()} />
      </ToastContext.Provider>
    );

    expect(screen.getByText('لا توجد صور مرفوعة للجهاز بعد')).toBeTruthy();
    expect(screen.getByText(/الحد الأقصى 10 صور/)).toBeTruthy();
  });

  it('renders primary badge on primary image and enables setting a new primary image', async () => {
    const images = [
      { id: 1, path: '/uploads/1.jpg', thumb_path: '/uploads/1.jpg', is_primary: 1, alt: 'واجهة الجهاز' },
      { id: 2, path: '/uploads/2.jpg', thumb_path: '/uploads/2.jpg', is_primary: 0, alt: 'خلفية الجهاز' },
    ];
    const onImagesChange = vi.fn();

    render(
      <ToastContext.Provider value={mockToast}>
        <ImageManager productId={10} images={images} onImagesChange={onImagesChange} />
      </ToastContext.Provider>
    );

    expect(screen.getByText('الرئيسية')).toBeTruthy();

    const starButtons = screen.getAllByLabelText('تعيين كصورة رئيسية');
    fireEvent.click(starButtons[1]);

    await waitFor(() => {
      expect(adminApi.updateProductImage).toHaveBeenCalledWith(10, 2, { is_primary: 1 });
      expect(mockToast.success).toHaveBeenCalledWith('تم تعيين الصورة كصورة رئيسية');
    });
  });

  it('triggers reorder endpoint when moving images', async () => {
    const images = [
      { id: 101, path: '/uploads/1.jpg', is_primary: 1 },
      { id: 102, path: '/uploads/2.jpg', is_primary: 0 },
    ];
    const onImagesChange = vi.fn();

    render(
      <ToastContext.Provider value={mockToast}>
        <ImageManager productId={5} images={images} onImagesChange={onImagesChange} />
      </ToastContext.Provider>
    );

    const moveNextBtns = screen.getAllByLabelText('تحريك لليسار');
    fireEvent.click(moveNextBtns[0]);

    await waitFor(() => {
      expect(adminApi.reorderProductImages).toHaveBeenCalledWith(5, [102, 101]);
    });
  });

  it('updates alt text on blur or enter', async () => {
    const images = [{ id: 7, path: '/uploads/test.jpg', is_primary: 1, alt: 'قديم' }];

    render(
      <ToastContext.Provider value={mockToast}>
        <ImageManager productId={5} images={images} onImagesChange={vi.fn()} />
      </ToastContext.Provider>
    );

    const altInput = screen.getByPlaceholderText('وصف الصورة (Alt)...');
    fireEvent.change(altInput, { target: { value: 'وصف جديد ومفصل' } });
    fireEvent.blur(altInput);

    await waitFor(() => {
      expect(adminApi.updateProductImage).toHaveBeenCalledWith(5, 7, { alt: 'وصف جديد ومفصل' });
      expect(mockToast.success).toHaveBeenCalledWith('تم تحديث النص البديل');
    });
  });
});

describe('Lightbox component', () => {
  const images = [
    { url: '/img1.jpg', alt: 'صورة 1' },
    { url: '/img2.jpg', alt: 'صورة 2' },
  ];

  it('renders image counter and navigates next/prev', () => {
    const onClose = vi.fn();
    render(<Lightbox isOpen={true} images={images} initialIndex={0} onClose={onClose} />);

    expect(screen.getByText('1 من 2')).toBeTruthy();

    const nextBtn = screen.getByLabelText('الصورة التالية');
    fireEvent.click(nextBtn);
    expect(screen.getByText('2 من 2')).toBeTruthy();

    const prevBtn = screen.getByLabelText('الصورة السابقة');
    fireEvent.click(prevBtn);
    expect(screen.getByText('1 من 2')).toBeTruthy();
  });

  it('handles Escape key to close', () => {
    const onClose = vi.fn();
    render(<Lightbox isOpen={true} images={images} initialIndex={0} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('toggles zoom on button click', () => {
    render(<Lightbox isOpen={true} images={images} initialIndex={0} onClose={vi.fn()} />);

    const zoomBtn = screen.getByLabelText('تكبير الصورة');
    fireEvent.click(zoomBtn);

    expect(screen.getByText('إعادة للحجم الطبيعي')).toBeTruthy();
  });
});
