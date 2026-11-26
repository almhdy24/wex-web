/**
 * Low-data mode: the browser's Data Saver (navigator.connection.saveData) or a 2G-class
 * connection. Optional network work (route prefetch, "أجهزة مشابهة", the recent-purchases
 * ticker) is skipped; anything the customer asked for still loads.
 */
export function isDataSaver() {
  if (typeof navigator === 'undefined') return false;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return false;
  if (conn.saveData === true) return true;
  return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
}
