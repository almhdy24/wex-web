import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Drawer.module.css';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'end',
  width = '420px',
  id = 'side-drawer',
}) {
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  // Esc key, focus trap & body overflow lock
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus initial element
    const drawerEl = drawerRef.current;
    if (drawerEl) {
      const focusable = drawerEl.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        drawerEl.focus();
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab') {
        if (!drawerRef.current) return;
        const focusable = Array.from(drawerRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !drawerRef.current.contains(document.activeElement)) {
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

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        ref={drawerRef}
        id={id}
        className={`${styles.drawer} ${position === 'start' ? styles.drawerStart : styles.drawerEnd}`}
        style={{ '--drawer-width': width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'لوحة جانبية'}
        tabIndex={-1}
      >
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="إغلاق اللوحة الجانبية"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
