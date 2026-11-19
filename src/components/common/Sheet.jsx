import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Sheet.module.css';

export default function Sheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
}) {
  const sheetRef = useRef(null);

  // Esc key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus sheet on open
    sheetRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`${styles.sheet} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
      >
        <div className={styles.handle} aria-hidden="true" />

        {title && (
          <div className={styles.header}>
            <h2 id="sheet-title" className={styles.title}>
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
      </div>
    </div>
  );
}
