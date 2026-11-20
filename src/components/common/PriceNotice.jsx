import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import styles from './PriceNotice.module.css';

/**
 * Format prices_updated_at ISO string into Arabic friendly format:
 * e.g., "اليوم 9:00" or "أمس 14:30"
 */
export function formatPricesUpdatedAt(isoString) {
  if (!isoString) return 'اليوم 9:00';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'اليوم 9:00';

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
      return `اليوم ${timeStr}`;
    }
    if (isYesterday) {
      return `أمس ${timeStr}`;
    }
    return `${d.getDate()}/${d.getMonth() + 1} ${timeStr}`;
  } catch {
    return 'اليوم 9:00';
  }
}

/**
 * PriceNotice Component
 *
 * Displays transparent customer-facing notice regarding price stability
 * and price lock without ever exposing the reference currency or rate.
 *
 * @param {'full' | 'short'} variant
 * @param {number} lockHours
 * @param {string} pricesUpdatedAt
 * @param {boolean} showLastUpdated
 * @param {string} className
 */
export default function PriceNotice({
  variant = 'full',
  lockHours = 4,
  pricesUpdatedAt = null,
  showLastUpdated = false,
  className = '',
}) {
  const hours = lockHours || 4;

  if (variant === 'short') {
    return (
      <div className={`${styles.noticeShort} ${className}`.trim()} role="note">
        <Info size={14} className={styles.icon} />
        <span>
          الأسعار بتتغير مع تقلب سعر الصرف. بعد الطلب بنثبت ليك السعر لمدة {hours} ساعات تحول فيها.
        </span>
      </div>
    );
  }

  return (
    <aside className={`${styles.noticeCard} ${className}`.trim()} role="note">
      <ShieldCheck size={18} className={styles.icon} />
      <div className={styles.noticeContent}>
        <p className={styles.noticeText}>
          الأسعار بتتغير مع تقلب سعر الصرف. بعد الطلب بنثبت ليك السعر لمدة {hours} ساعات تحول فيها.
        </p>
        {showLastUpdated && (
          <span className={styles.updatedAtLine}>
            آخر تحديث للأسعار: {formatPricesUpdatedAt(pricesUpdatedAt)}
          </span>
        )}
      </div>
    </aside>
  );
}
