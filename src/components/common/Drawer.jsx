import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Drawer.module.css';

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

  // Esc key handler & body overflow lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the drawer on open
    drawerRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
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
