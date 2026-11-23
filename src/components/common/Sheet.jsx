import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ar } from '../../content/ar';
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
  const dragStartY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

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

    sheetRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
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
