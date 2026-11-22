import React from 'react';
import styles from './Price.module.css';

/**
 * Unified Price Component
 * - Single accessible name for screen readers (no duplicate sr-only reading)
 * - Visually separate currency label
 * - Western digits isolated with dir="ltr"
 *
 * @param {number|string} value - SDG price amount
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'hero'} size
 * @param {'navy'|'royal'|'vivid'|'success'|'onDark'|'inherit'} tone
 * @param {boolean} strike - Strikethrough for original price
 * @param {boolean} showCurrency
 */
export default function Price({
  value,
  size = 'md',
  tone = 'navy',
  currency = 'ج.س',
  showCurrency = true,
  strike = false,
  className = '',
  ...rest
}) {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  const formatted = Math.round(num).toLocaleString('en-US');
  const ariaLabel = `${formatted} ${currency}`;

  return (
    <span
      className={`${styles.price} ${styles[size] || styles.md} ${styles[tone] || styles.navy} ${strike ? styles.strike : ''} ${className}`}
      aria-label={ariaLabel}
      {...rest}
    >
      <span className={styles.amount} aria-hidden="true" dir="ltr">
        {formatted}
      </span>
      {showCurrency && ' '}
      {showCurrency && (
        <span className={styles.currency} aria-hidden="true">
          {currency}
        </span>
      )}
    </span>
  );
}
