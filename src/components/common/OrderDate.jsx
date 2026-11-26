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
      {/* Date LTR, then the time as its own RTL unit: one LTR isolate around both put ص/م
          at the far right, so it was read first ("م 8:00 2026/11/24"). */}
      <span className={styles.dateTime}>
        <bdi dir="ltr">{dateStr}</bdi>
        {timeStr && ' '}
        {timeStr && <bdi dir="rtl">{timeStr}</bdi>}
      </span>
      {hasRelative && (
        <span className={styles.relative}>
          <span className={styles.bullet} aria-hidden="true">·</span>
          <span>{relStr}</span>
        </span>
      )}
    </span>
  );
}
