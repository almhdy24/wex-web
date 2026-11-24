/**
 * @vitest-environment jsdom
 */
import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../components/common/Modal';
import Sheet from '../components/common/Sheet';
import Drawer from '../components/common/Drawer';

function OverlayFormParent({ Component, inputLabel, title }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  return (
    <div>
      <button onClick={() => setOpen(true)}>فتح النافذة</button>
      <Component isOpen={open} onClose={() => setOpen(false)} title={title}>
        <input
          type="text"
          aria-label={inputLabel}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="button" onClick={() => setOpen(false)}>
          حفظ
        </button>
      </Component>
    </div>
  );
}

describe('BUG 1: Overlay Focus Stability & Trap Contract', () => {
  it('Modal: typing 10 characters keeps input focused, retains text, and does not steal focus', () => {
    render(<OverlayFormParent Component={Modal} inputLabel="اسم الحساب" title="نافذة الحساب" />);

    const openBtn = screen.getByText('فتح النافذة');
    fireEvent.click(openBtn);

    const input = screen.getByLabelText('اسم الحساب');
    input.focus();
    expect(document.activeElement).toBe(input);

    const chars = '0123456789';
    let currentVal = '';
    for (const char of chars) {
      currentVal += char;
      fireEvent.change(input, { target: { value: currentVal } });
      // Crucial assertion: activeElement MUST remain the input on every keystroke
      expect(document.activeElement).toBe(input);
    }

    expect(input.value).toBe('0123456789');
  });

  it('Sheet: typing 10 characters keeps input focused, retains text, and does not steal focus', () => {
    render(<OverlayFormParent Component={Sheet} inputLabel="رقم الحساب" title="لوحة الحساب" />);

    const openBtn = screen.getByText('فتح النافذة');
    fireEvent.click(openBtn);

    const input = screen.getByLabelText('رقم الحساب');
    input.focus();
    expect(document.activeElement).toBe(input);

    const chars = '2499123456';
    let currentVal = '';
    for (const char of chars) {
      currentVal += char;
      fireEvent.change(input, { target: { value: currentVal } });
      expect(document.activeElement).toBe(input);
    }

    expect(input.value).toBe('2499123456');
  });

  it('Drawer: typing 10 characters keeps input focused and retains text', () => {
    render(<OverlayFormParent Component={Drawer} inputLabel="اسم الفرع" title="درج الفرع" />);

    const openBtn = screen.getByText('فتح النافذة');
    fireEvent.click(openBtn);

    const input = screen.getByLabelText('اسم الفرع');
    input.focus();
    expect(document.activeElement).toBe(input);

    const chars = 'الخرطوم 01';
    let currentVal = '';
    for (const char of chars) {
      currentVal += char;
      fireEvent.change(input, { target: { value: currentVal } });
      expect(document.activeElement).toBe(input);
    }

    expect(input.value).toBe('الخرطوم 01');
  });

  it('Escape key triggers onClose without error', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="نافذة تجريبية">
        <p>محتوى</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('Tab key wraps inside Modal focus trap', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="نافذة التركيز">
        <input type="text" aria-label="حقل 1" />
        <button type="button">زر 2</button>
      </Modal>
    );

    const closeBtn = screen.getByLabelText('إغلاق النافذة');
    const input1 = screen.getByLabelText('حقل 1');
    const btn2 = screen.getByText('زر 2');

    // Focus last element and press Tab -> should wrap to first element (closeBtn)
    btn2.focus();
    expect(document.activeElement).toBe(btn2);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // Focus first element and press Shift+Tab -> should wrap to last element (btn2)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btn2);
  });

  it('Restores focus to trigger button when overlay closes', () => {
    function ToggleModal() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button id="trigger-btn" onClick={() => setOpen(true)}>
            زر الفتح
          </button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="نافذة">
            <button onClick={() => setOpen(false)}>إغلاق</button>
          </Modal>
        </div>
      );
    }

    render(<ToggleModal />);
    const trigger = screen.getByText('زر الفتح');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    // Open modal
    fireEvent.click(trigger);
    expect(screen.getByText('نافذة')).toBeTruthy();

    // Close modal via close button
    const closeBtn = screen.getByRole('button', { name: 'إغلاق' });
    fireEvent.click(closeBtn);

    // Focus should be returned to trigger
    expect(document.activeElement).toBe(trigger);
  });
});
