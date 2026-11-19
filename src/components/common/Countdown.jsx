import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import styles from './Countdown.module.css';

export default function Countdown({
  expiresAt,
  totalHours = 4,
  lockedRateSdg,
  onExpire,
}) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(expiresAt));

  function calculateTimeLeft(targetDate) {
    if (!targetDate) return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) {
      return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { totalMs: diff, hours, minutes, seconds, expired: false };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(expiresAt);
      setTimeLeft(remaining);
      if (remaining.expired) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const totalDurationMs = totalHours * 60 * 60 * 1000;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft.totalMs / totalDurationMs) * 100));
  const isUnder30Min = !timeLeft.expired && timeLeft.totalMs < 30 * 60 * 1000;

  const pad = (n) => String(n).padStart(2, '0');
  const formattedTime = timeLeft.expired
    ? '00:00:00'
    : `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`;

  const bannerClass = [
    styles.banner,
    timeLeft.expired ? styles.expiredBanner : isUnder30Min ? styles.warningBanner : '',
  ]
    .filter(Boolean)
    .join(' ');

  const timerClass = [
    styles.timer,
    timeLeft.expired ? styles.expiredTimer : isUnder30Min ? styles.warningTimer : '',
  ]
    .filter(Boolean)
    .join(' ');

  const barClass = [
    styles.progressBar,
    timeLeft.expired ? styles.expiredProgressBar : isUnder30Min ? styles.warningProgressBar : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Milestone text for screen readers (only on state boundaries)
  const accessibleAnnouncement = timeLeft.expired
    ? 'انتهت فترة تثبيت السعر'
    : isUnder30Min
    ? 'تنبيه: متبقي أقل من نصف ساعة لتثبيت السعر'
    : undefined;

  return (
    <div className={bannerClass}>
      {accessibleAnnouncement && (
        <span className="sr-only" role="status" aria-live="polite">
          {accessibleAnnouncement}
        </span>
      )}

      <div className={styles.headerRow}>
        <div className={styles.infoBlock}>
          {isUnder30Min ? (
            <AlertTriangle size={18} strokeWidth={1.75} className={styles.warningText} />
          ) : (
            <Clock size={18} strokeWidth={1.75} />
          )}
          <span>
            {timeLeft.expired
              ? 'انتهت مدة تثبيت السعر لهذا الطلب'
              : isUnder30Min
              ? 'سارع بالتحويل: متبقي أقل من 30 دقيقة على انتهاء تثبيت السعر'
              : 'السعر مثبت لك لإتمام التحويل'}
            {lockedRateSdg ? ` (الدرهم = ${lockedRateSdg} جنيه)` : ''}
          </span>
        </div>

        <div className={timerClass} aria-label={`الوقت المتبقي: ${formattedTime}`}>
          {formattedTime}
        </div>
      </div>

      <div className={styles.progressTrack} aria-hidden="true">
        <div
          className={barClass}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
