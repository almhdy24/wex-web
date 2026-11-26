/**
 * Arabic hour count in its grammatical form, as used after a preposition
 * ("لمدة …", "خلال …"): 1 ساعة واحدة · 2 ساعتين · 3–10 N ساعات · 11+ N ساعة.
 * Every lock-duration text renders through this from the lock_hours setting
 * (it was hard-coded "4 ساعات", or "{n} ساعات" for any n).
 * Server twin: wex-api App\Libraries\ArabicDuration::hours().
 */
export function formatHoursAr(value) {
  const n = Math.max(1, Math.round(Number(value) || 0));
  if (n === 1) return 'ساعة واحدة';
  if (n === 2) return 'ساعتين';
  if (n <= 10) return `${n} ساعات`;
  return `${n} ساعة`;
}

/** Replaces the {{lock_duration}} token used in admin-editable content. */
export function renderLockDuration(text, lockHours) {
  return String(text ?? '').replace(/\{\{\s*lock_duration\s*\}\}/g, formatHoursAr(lockHours));
}
