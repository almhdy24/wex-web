/**
 * Single source of truth for Order UI State & Countdown.
 * Ensures Payment screen, orders list, notifications, and pending-order banner
 * never disagree on stages, countdowns, or CTAs.
 */

export function deriveOrderUiState(order, now = Date.now(), serverTimeOffset = 0) {
  if (!order) {
    return {
      stage: 'none',
      label: '',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: '',
      latestProof: null,
    };
  }

  const currentTime = now + serverTimeOffset;
  const expiresAt = order.lock_expires_at ? new Date(order.lock_expires_at).getTime() : 0;
  const isLockExpired = Boolean(expiresAt && expiresAt <= currentTime);
  const rawStatus = order.status;

  const proofs = order.payment_proofs || order.proofs || [];
  const latestProof = proofs.length > 0 ? proofs[proofs.length - 1] : null;

  // 1. Expired or Cancelled
  if (rawStatus === 'cancelled' || rawStatus === 'expired' || (rawStatus === 'pending_payment' && isLockExpired)) {
    return {
      stage: 'expired',
      label: rawStatus === 'cancelled' ? 'تم إلغاء الطلب' : 'ملغي لانتهاء المهلة',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'انتهت مهلة حجز الطلب وتم إلغاؤه تلقائياً.',
      latestProof,
    };
  }

  // 2. Under Review (payment_review, payment_uploaded, or latest proof pending)
  if (
    rawStatus === 'payment_review' ||
    rawStatus === 'payment_uploaded' ||
    rawStatus === 'under_review' ||
    (latestProof && latestProof.status === 'pending')
  ) {
    return {
      stage: 'payment_review',
      label: 'قيد المراجعة',
      primaryAction: null,
      showBanner: false, // Disappears immediately when proof is under review
      countdown: Math.max(0, Math.floor((expiresAt - currentTime) / 1000)),
      message: 'تم استلام الإشعار. بانتظار مراجعة المحل.',
      latestProof,
    };
  }

  // 3. Rejected proof
  if (rawStatus === 'payment_rejected' || (latestProof && latestProof.status === 'rejected')) {
    return {
      stage: 'rejected',
      label: 'تم رفض الإشعار',
      primaryAction: 'ارفع إشعارًا جديدًا',
      showBanner: true,
      countdown: Math.max(0, Math.floor((expiresAt - currentTime) / 1000)),
      message: latestProof?.review_note || 'تم رفض إشعار التحويل. يرجى رفع إشعار جديد صالح.',
      latestProof,
    };
  }

  // 4. Pending payment (unexpired, no proof under review)
  if (rawStatus === 'pending_payment') {
    return {
      stage: 'pending_payment',
      label: 'بانتظار التحويل',
      primaryAction: 'ارفع إشعار التحويل',
      showBanner: true,
      countdown: Math.max(0, Math.floor((expiresAt - currentTime) / 1000)),
      message: 'يرجى تحويل المبلغ ورفع إشعار التحويل قبل انتهاء المهلة.',
      latestProof: null,
    };
  }

  // 5. Confirmed
  if (rawStatus === 'confirmed') {
    return {
      stage: 'confirmed',
      label: 'تم تأكيد الطلب',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'تم تأكيد استلام المبلغ وجارٍ تجهيز الطلب.',
      latestProof,
    };
  }

  // 6. Ready
  if (rawStatus === 'ready') {
    return {
      stage: 'ready',
      label: 'جاهز للاستلام / الشحن',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'الطلب جاهز للاستلام أو في انتظار شركة التوصيل.',
      latestProof,
    };
  }

  // 7. Out for Delivery
  if (rawStatus === 'out_for_delivery') {
    return {
      stage: 'out_for_delivery',
      label: 'خرج للتوصيل',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'المندوب في طريقه لتسليم طلبك.',
      latestProof,
    };
  }

  // 8. Completed
  if (rawStatus === 'completed') {
    return {
      stage: 'completed',
      label: 'مكتمل',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'تم تسليم الطلب بنجاح. شكراً لتسوقك معنا.',
      latestProof,
    };
  }

  // Fallback
  return {
    stage: rawStatus,
    label: order.status_label || rawStatus,
    primaryAction: null,
    showBanner: false,
    countdown: 0,
    message: '',
    latestProof,
  };
}

export function formatCountdownTime(seconds) {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
