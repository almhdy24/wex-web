import React, { useEffect, useRef } from 'react';
import styles from './Popover.module.css';

export default function Popover({
  isOpen,
  onClose,
  anchorRef,
  children,
  align = 'end', // 'start' | 'end' | 'center'
  width = '320px',
  className = '',
  role = 'dialog',
  ariaLabel,
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(event.target))
      ) {
        onClose?.();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
        anchorRef?.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const alignClass =
    align === 'start'
      ? styles.alignStart
      : align === 'center'
      ? styles.alignCenter
      : styles.alignEnd;

  return (
    <div
      ref={popoverRef}
      className={`${styles.popover} ${alignClass} ${className}`}
      style={{ '--popover-width': width }}
      role={role}
      aria-modal="false"
      aria-label={ariaLabel}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
