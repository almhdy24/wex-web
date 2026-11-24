import React from 'react';
import styles from './OrderNumber.module.css';

/**
 * Format order number as safe string for plain-text contexts (toasts, copy text, print).
 */
export function formatOrderNumber(orderNumber, withHash = true) {
  if (!orderNumber) return '';
  const clean = String(orderNumber).replace(/^#/, '');
  return withHash ? `#${clean}` : clean;
}

/**
 * OrderNumber Component
 * Renders order numbers, codes, and SKUs with strict RTL/BiDi protection:
 * - In RTL context, the "#" is placed correctly at the logical start (right side in Arabic)
 * - The alphanumeric code itself is wrapped in <bdi dir="ltr"> to prevent punctuation flipping
 */
export default function OrderNumber({
  value,
  withHash = true,
  prefix = '',
  className = '',
}) {
  if (!value) return null;
  const clean = String(value).replace(/^#/, '');

  return (
    <span className={`${styles.container} ${className}`.trim()}>
      {prefix && <span className={styles.prefix}>{prefix} </span>}
      <bdi dir="ltr" className={styles.code}>
        {withHash ? `#${clean}` : clean}
      </bdi>
    </span>
  );
}
