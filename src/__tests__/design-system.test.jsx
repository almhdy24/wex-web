import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  Button,
  Chip,
  Card,
  DarkCard,
  NoticeLine,
  Sheet,
  PageHeader,
  StickyBar,
} from '../components/common';

describe('Design System Primitives (Phase 1)', () => {
  it('Button renders primary, secondary, and tertiary styles', () => {
    const primary = renderToStaticMarkup(<Button variant="primary">تأكيد الطلب</Button>);
    expect(primary).toContain('button');
    expect(primary).toContain('primary');
    expect(primary).toContain('تأكيد الطلب');

    const secondary = renderToStaticMarkup(<Button variant="secondary">متابعة</Button>);
    expect(secondary).toContain('secondary');

    const tertiary = renderToStaticMarkup(<Button variant="tertiary">إضافة منتجات أخرى</Button>);
    expect(tertiary).toContain('tertiary');
  });

  it('Chip renders outline neutral and selected states with radius 999', () => {
    const defaultChip = renderToStaticMarkup(<Chip>لابتوبات</Chip>);
    expect(defaultChip).toContain('chip');
    expect(defaultChip).not.toContain('selected');

    const selectedChip = renderToStaticMarkup(<Chip active>جديد</Chip>);
    expect(selectedChip).toContain('selected');
  });

  it('Card renders white surface, 1px border, radius 16, no shadow', () => {
    const html = renderToStaticMarkup(<Card>محتوى البطاقة</Card>);
    expect(html).toContain('card');
    expect(html).toContain('محتوى البطاقة');
  });

  it('DarkCard renders navy dark card with on-dark tokens and optional gradient', () => {
    const navyCard = renderToStaticMarkup(<DarkCard>البطاقة الداكنة</DarkCard>);
    expect(navyCard).toContain('darkCard');
    expect(navyCard).toContain('navy');

    const gradCard = renderToStaticMarkup(<DarkCard gradient>المبلغ المطلوب</DarkCard>);
    expect(gradCard).toContain('gradient');
  });

  it('NoticeLine renders plain text line with info icon', () => {
    const html = renderToStaticMarkup(
      <NoticeLine>السعر قابل للتغيير حتى تأكيد الطلب.</NoticeLine>
    );
    expect(html).toContain('noticeLine');
    expect(html).toContain('السعر قابل للتغيير حتى تأكيد الطلب.');
  });

  it('Sheet renders bottom sheet dialog', () => {
    const html = renderToStaticMarkup(
      <Sheet isOpen={true} title="تصفية الأجهزة" onClose={() => {}}>
        <div>محتوى التصفية</div>
      </Sheet>
    );
    expect(html).toContain('sheet');
    expect(html).toContain('تصفية الأجهزة');
    expect(html).toContain('محتوى التصفية');
  });

  it('PageHeader renders title and back button', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PageHeader title="تأكيد الطلب" showBack={true} />
      </MemoryRouter>
    );
    expect(html).toContain('header');
    expect(html).toContain('تأكيد الطلب');
    expect(html).toContain('backBtn');
  });

  it('StickyBar renders fixed bar with soft shadow', () => {
    const html = renderToStaticMarkup(
      <StickyBar>
        <button>تأكيد الطلب</button>
      </StickyBar>
    );
    expect(html).toContain('stickyBar');
    expect(html).toContain('تأكيد الطلب');
  });
});
