import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Drawer from '../components/common/Drawer';
import Popover from '../components/common/Popover';
import Dialog from '../components/common/Dialog';

describe('Layout Tiers & Overlay Primitives Tests', () => {
  describe('useViewport hook in Node/SSR environment', () => {
    it('provides safe mobile fallback when window is undefined', () => {
      const initial = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        tier: 'mobile',
      };
      expect(initial.isMobile).toBe(true);
      expect(initial.isDesktop).toBe(false);
      expect(initial.tier).toBe('mobile');
    });
  });

  describe('Drawer component', () => {
    it('returns null when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <Drawer isOpen={false} title="سلة المشتريات">
          <p>محتوى السلة</p>
        </Drawer>
      );
      expect(html).toBe('');
    });

    it('renders drawer with accessible role and title when isOpen is true', () => {
      const html = renderToStaticMarkup(
        <Drawer isOpen={true} title="سلة المشتريات">
          <p>محتوى السلة</p>
        </Drawer>
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('سلة المشتريات');
      expect(html).toContain('محتوى السلة');
      expect(html).toContain('إغلاق اللوحة الجانبية');
    });

    it('renders with start or end position class', () => {
      const htmlEnd = renderToStaticMarkup(
        <Drawer isOpen={true} position="end" title="نهاية">
          <div>محتوى</div>
        </Drawer>
      );
      expect(htmlEnd).toContain('drawerEnd');

      const htmlStart = renderToStaticMarkup(
        <Drawer isOpen={true} position="start" title="بداية">
          <div>محتوى</div>
        </Drawer>
      );
      expect(htmlStart).toContain('drawerStart');
    });
  });

  describe('Popover component', () => {
    it('returns null when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <Popover isOpen={false}>
          <p>محتوى القائمة</p>
        </Popover>
      );
      expect(html).toBe('');
    });

    it('renders popover with children and alignment class when isOpen is true', () => {
      const html = renderToStaticMarkup(
        <Popover isOpen={true} align="end" ariaLabel="قائمة الحساب">
          <p>محتوى القائمة</p>
        </Popover>
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain('alignEnd');
      expect(html).toContain('محتوى القائمة');
    });

    it('supports center and start alignments', () => {
      const htmlCenter = renderToStaticMarkup(
        <Popover isOpen={true} align="center">
          <div>مركز</div>
        </Popover>
      );
      expect(htmlCenter).toContain('alignCenter');

      const htmlStart = renderToStaticMarkup(
        <Popover isOpen={true} align="start">
          <div>بداية</div>
        </Popover>
      );
      expect(htmlStart).toContain('alignStart');
    });
  });

  describe('Dialog component', () => {
    it('returns null when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <Dialog isOpen={false} title="تأكيد الطلب">
          <p>نص التأكيد</p>
        </Dialog>
      );
      expect(html).toBe('');
    });

    it('renders forced modal variant with centered dialog styling', () => {
      const html = renderToStaticMarkup(
        <Dialog isOpen={true} forceVariant="modal" title="نافذة منبثقة">
          <p>محتوى الحوار</p>
        </Dialog>
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain('نافذة منبثقة');
      expect(html).toContain('محتوى الحوار');
    });

    it('renders forced sheet variant with bottom sheet styling', () => {
      const html = renderToStaticMarkup(
        <Dialog isOpen={true} forceVariant="sheet" title="لوحة سفلية">
          <p>محتوى اللوحة</p>
        </Dialog>
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain('لوحة سفلية');
      expect(html).toContain('محتوى اللوحة');
    });
  });

  describe('Responsive Architecture & Viewport Shell Integrity', () => {
    it('StoreLayout.module.css uses 100dvh without 94dvh floating tablet traps', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const cssPath = path.resolve(process.cwd(), 'src/layouts/StoreLayout.module.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      // Assert 94dvh / 94vh floating trap has been eradicated
      expect(cssContent).not.toContain('94dvh');
      expect(cssContent).not.toContain('94vh');

      // Assert full height app shell
      expect(cssContent).toContain('height: 100dvh');
      expect(cssContent).toContain('max-height: 100dvh');
    });
  });
});
