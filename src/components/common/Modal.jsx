import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
  footer,
  maxWidth = '540px',
  className = '',
  variant = 'default', // 'default' | 'image'
}) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus initial element
    const dialogEl = dialogRef.current;
    if (dialogEl) {
      const focusable = dialogEl.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        dialogEl.focus();
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;
        const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
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

  const isImage = variant === 'image';
  const labelId = title ? 'modal-title' : undefined;

  const modalNode = (
    <div
      className={`${styles.backdrop} ${isImage ? styles.imageBackdrop : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`${styles.dialog} ${isImage ? styles.imageDialog : ''} ${className}`}
        style={!isImage && maxWidth !== '540px' ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-label={!title ? (ariaLabel || 'نافذة منبثقة') : undefined}
      >
        {isImage ? (
          <div className={styles.imageWrapper}>
            <button
              type="button"
              className={styles.imageCloseBtn}
              onClick={onClose}
              aria-label="إغلاق"
            >
              <X size={24} strokeWidth={2} />
            </button>
            <div className={styles.imageContent}>{children}</div>
          </div>
        ) : (
          <>
            {title && (
              <div className={styles.header}>
                <h2 id="modal-title" className={styles.title}>
                  {title}
                </h2>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={onClose}
                  aria-label="إغلاق النافذة"
                >
                  <X size={20} strokeWidth={1.75} />
                </button>
              </div>
            )}

            <div className={styles.content}>{children}</div>

            {footer && <div className={styles.footer}>{footer}</div>}
          </>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalNode, document.body);
  }

  return modalNode;
}
