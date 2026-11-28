import React from 'react';
import { X } from 'lucide-react';
import styles from './Chip.module.css';

/**
 * Design System Chip
 * - Outline neutral: border #D5E2F7, white bg, navy text
 * - Selected: solid royal (var(--wex-royal)) + white text (#FFFFFF)
 * - Radius 999px
 */
export default function Chip({
  children,
  active = false,
  selected = false,
  onClick,
  onRemove,
  icon: Icon,
  className = '',
  ...rest
}) {
  const isSelected = active || selected;
  return (
    <button
      type="button"
      className={`${styles.chip} ${isSelected ? styles.selected : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {Icon && <Icon size={16} strokeWidth={1.75} className={styles.icon} aria-hidden="true" />}
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
          <X size={14} strokeWidth={1.75} />
        </span>
      )}
    </button>
  );
}
