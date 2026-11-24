import React from 'react';
import { formatDate, format12hTime, formatRelativeTime } from '../../utils/formatters';
import styles from './OrderDate.module.css';

/**
 * Format order date line as safe string for plain-text contexts.
 */
export function formatOrderDateLine(isoString, label = 'تم الإنشاء:') {
  if (!isoString) return '';
  const dateStr = formatDate(isoString);
  const timeStr = format12hTime(isoString);
  const relStr = formatRelativeTime(isoString);
  const base = `${dateStr} ${timeStr}`.trim();
  if (relStr && relStr !== dateStr) {
    return `${label} ${base} · ${relStr}`;
  }
  return `${label} ${base}`;
}

/**
 * OrderDate Component
 * Clean, RTL-safe order date display:
 * - Date and time in <bdi dir="ltr"> to prevent Arabic punctuation/slash distortion
 * - Relative time in a separate muted tag without jumbled parentheses
 */
export default function OrderDate({
  date,
  label = 'تم الإنشاء:',
  showRelative = true,
  className = '',
}) {
  if (!date) return null;

  const dateStr = formatDate(date);
  const timeStr = format12hTime(date);
  const relStr = showRelative ? formatRelativeTime(date) : '';
  const hasRelative = Boolean(relStr && relStr !== dateStr);

  return (
    <span className={`${styles.dateLine} ${className}`.trim()} dir="rtl">
      {label && <span className={styles.label}>{label}</span>}
      <bdi dir="ltr" className={styles.dateTime}>
        {dateStr} {timeStr}
      </bdi>
      {hasRelative && (
        <span className={styles.relative}>
          <span className={styles.bullet} aria-hidden="true">·</span>
          <span>{relStr}</span>
        </span>
      )}
    </span>
  );
}
