import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, ZoomIn, ZoomOut } from 'lucide-react';
import styles from './Lightbox.module.css';

/**
 * Universal full-screen touch-friendly Lightbox:
 * - Keyboard navigation (Esc, ArrowLeft, ArrowRight)
 * - Touch swipe left/right for next/prev
 * - Double-tap toggle zoom 1x / 2.2x
 * - 44px minimum touch targets
 * - Body scroll locking
 */
export default function Lightbox({
  isOpen,
  images = [],
  initialIndex = 0,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const lastTapRef = useRef(0);
  const total = images.length;

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        // In RTL, right arrow means previous in reading order
        handlePrev();
      } else if (e.key === 'ArrowLeft') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) return null;

  const currentItem = images[currentIndex];
  const src = typeof currentItem === 'string' ? currentItem : currentItem.url || currentItem.path;
  const alt = typeof currentItem === 'object' ? currentItem.alt || 'صورة الجهاز' : 'صورة الجهاز';

  // Double tap handler
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;

    // Check double tap
    if (timeDiff < 300) {
      // Toggle zoom
      setScale((prev) => (prev > 1 ? 1 : 2.2));
      setPan({ x: 0, y: 0 });
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // Check swipe if not zoomed in
    if (scale <= 1 && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // In RTL: swipe to right means previous, swipe to left means next
        if (deltaX > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    }
  };

  const toggleZoom = () => {
    setScale((prev) => (prev > 1 ? 1 : 2.2));
    setPan({ x: 0, y: 0 });
  };

  // Portal to <body>: on mobile the page sits in a transformed screen container, which
  // becomes the containing block for position:fixed, so the overlay covered the (tall)
  // page instead of the screen and the image was centred far off-screen.
  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="معرض الصور بحجم الشاشة"
    >
      <div className={styles.topBar}>
        <span className={styles.counter}>
          {currentIndex + 1} من {total}
        </span>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="إغلاق المعرض"
        >
          <X size={24} />
        </button>
      </div>

      <div
        className={styles.stage}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {total > 1 && (
          <button
            type="button"
            className={`${styles.navButton} ${styles.navPrev}`}
            onClick={handlePrev}
            aria-label="الصورة السابقة"
          >
            <ChevronRight size={28} />
          </button>
        )}

        <div
          className={styles.imageWrapper}
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <img
            src={src}
            alt={alt}
            className={styles.lightboxImage}
            draggable={false}
          />
        </div>

        {total > 1 && (
          <button
            type="button"
            className={`${styles.navButton} ${styles.navNext}`}
            onClick={handleNext}
            aria-label="الصورة التالية"
          >
            <ChevronLeft size={28} />
          </button>
        )}
      </div>

      <div className={styles.bottomBar}>
        <button
          type="button"
          className={styles.zoomToggle}
          onClick={toggleZoom}
          aria-label={scale > 1 ? 'تصغير الصورة' : 'تكبير الصورة'}
        >
          {scale > 1 ? (
            <>
              <ZoomOut size={16} />
              <span>إعادة للحجم الطبيعي</span>
            </>
          ) : (
            <>
              <ZoomIn size={16} />
              <span>تكبير الصورة</span>
            </>
          )}
        </button>
      </div>
    </div>,
    document.body
  );
}

Lightbox.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  images: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        url: PropTypes.string,
        path: PropTypes.string,
        alt: PropTypes.string,
      }),
    ])
  ).isRequired,
  initialIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};
