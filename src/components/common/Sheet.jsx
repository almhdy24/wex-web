import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ar } from '../../content/ar';
import styles from './Sheet.module.css';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Sheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
}) {
  const sheetRef = useRef(null);
  const triggerRef = useRef(null);
  const dragStartY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  // Esc key, focus trap, and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus initial element
    const sheetEl = sheetRef.current;
    if (sheetEl) {
      const focusable = sheetEl.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        sheetEl.focus();
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!sheetRef.current) return;
        const focusable = Array.from(sheetRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !sheetRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !sheetRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const dy = currentY - dragStartY.current;
    if (dy > 0) {
      setDragOffset(dy);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 70) {
      onClose();
    }
    setDragOffset(0);
  };

  const sheetStyle = dragOffset > 0 ? { transform: `translate3d(0, ${dragOffset}px, 0)` } : undefined;

  const content = (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`${styles.sheet} ${className}`}
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
      >
        <div
          className={styles.handleWrapper}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-hidden="true"
        >
          <div className={styles.handle} />
        </div>

        {title && (
          <div className={styles.header}>
            <h2 id="sheet-title" className={styles.title}>
              {title}
            </h2>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label={ar.common.close}
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>
        )}

        <div className={styles.content}>
          {children}
        </div>

        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(content, document.body);
  }
  return content;
}
