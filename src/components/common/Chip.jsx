import React from 'react';
import { X } from 'lucide-react';
import styles from './Chip.module.css';

export default function Chip({
  children,
  active = false,
  onClick,
  onRemove,
  icon: Icon,
  className = '',
  ...rest
}) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.active : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
      <span>{children}</span>
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          className={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onRemove();
            }
          }}
          aria-label="إزالة"
        >
          <X size={14} strokeWidth={2} />
        </span>
      )}
    </button>
  );
}
