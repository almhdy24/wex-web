import React from 'react';
import { Plus, Minus } from 'lucide-react';
import styles from './Stepper.module.css';

/**
 * Stepper
 * Touch-friendly numeric stepper with minimum 44px tap targets.
 */
export default function Stepper({
  value = 0,
  onChange,
  min = 0,
  max = 9999,
  disabled = false,
  size = 'md',
  ariaLabel = 'تعديل الكمية',
}) {
  const handleDecrement = (e) => {
    e.stopPropagation();
    if (disabled || value <= min) return;
    onChange?.(value - 1);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (disabled || value >= max) return;
    onChange?.(value + 1);
  };

  return (
    <div className={`${styles.stepper} ${styles[size]}`} aria-label={ariaLabel}>
      <button
        type="button"
        className={styles.stepBtn}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="إنقاص"
      >
        <Minus size={14} />
      </button>

      <span className={styles.value} aria-live="polite">
        {value}
      </span>

      <button
        type="button"
        className={styles.stepBtn}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="زيادة"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
