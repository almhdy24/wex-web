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
      canUpload: false,
      canReview: false,
    };
  }

  const currentTime = now + serverTimeOffset;
  const expiresAt = order.lock_expires_at ? new Date(order.lock_expires_at).getTime() : 0;
  const countdown = expiresAt > 0
    ? Math.max(0, Math.floor((expiresAt - currentTime) / 1000))
    : (typeof order.seconds_remaining === 'number' ? Math.max(0, Math.floor(order.seconds_remaining)) : 0);
  const isLockExpired = expiresAt > 0
    ? expiresAt <= currentTime
    : (typeof order.seconds_remaining === 'number' ? order.seconds_remaining <= 0 : false);
  const rawStatus = order.status;

  const proofs = order.payment_proofs || order.proofs || [];
  const latestProof = order.payment?.latest_proof || (proofs.length > 0 ? proofs[proofs.length - 1] : null);

  // When server-provided payment block is available, consume it directly
  if (order.payment) {
    const pState = order.payment.state;

    if (pState === 'expired' || rawStatus === 'cancelled' || rawStatus === 'expired') {
      return {
        stage: 'expired',
        label: rawStatus === 'cancelled' ? 'تم إلغاء الطلب' : 'ملغي لانتهاء المهلة',
        primaryAction: null,
        showBanner: false,
        countdown: 0,
        message: 'انتهت مهلة تثبيت السعر.',
        latestProof,
        canUpload: false,
        canReview: false,
      };
    }

    if (pState === 'under_review') {
      return {
        stage: 'payment_review',
        label: 'قيد المراجعة',
        primaryAction: null,
        showBanner: false,
        countdown,
        message: 'تم استلام الإشعار. بانتظار مراجعة المحل.',
        latestProof,
        canUpload: false,
        canReview: true,
      };
    }

    if (pState === 'rejected') {
      return {
        stage: 'rejected',
        label: 'تم رفض الإشعار',
        primaryAction: 'ارفع إشعارًا جديدًا',
        showBanner: true,
        countdown,
        message: latestProof?.review_note || order.rejection_reason || 'تم رفض إشعار التحويل. يرجى رفع إشعار جديد صالح.',
        latestProof,
        canUpload: true,
        canReview: false,
      };
    }

    if (pState === 'awaiting_proof') {
      return {
        stage: 'pending_payment',
        label: 'بانتظار التحويل',
        primaryAction: 'ارفع إشعار التحويل',
        showBanner: true,
        countdown,
        message: 'يرجى تحويل المبلغ ورفع إشعار التحويل قبل انتهاء المهلة.',
        latestProof: null,
        canUpload: true,
        canReview: false,
      };
    }

    if (pState === 'approved') {
      let stage = 'confirmed';
      let label = 'تم تأكيد الطلب';
      let message = 'تم تأكيد استلام المبلغ وجارٍ تجهيز الطلب.';

      if (rawStatus === 'processing') {
        stage = 'processing';
        label = 'جاري التجهيز';
        message = 'جاري تجهيز عناصر الطلب بالمحل.';
      } else if (rawStatus === 'ready' || rawStatus === 'ready_for_pickup') {
        stage = 'ready';
        label = 'جاهز للاستلام / الشحن';
        message = 'الطلب جاهز للاستلام أو في انتظار شركة التوصيل.';
      } else if (rawStatus === 'out_for_delivery') {
        stage = 'out_for_delivery';
        label = 'خرج للتوصيل';
        message = 'المندوب في طريقه لتسليم طلبك.';
      } else if (rawStatus === 'completed' || rawStatus === 'delivered') {
        stage = 'completed';
        label = 'مكتمل';
        message = 'تم تسليم الطلب بنجاح. شكراً لتسوقك معنا.';
      }

      return {
        stage,
        label,
        primaryAction: null,
        showBanner: false,
        countdown: 0,
        message,
        latestProof,
        canUpload: false,
        canReview: false,
      };
    }
  }

  // Fallback when order.payment is not supplied (fixtures/mock tests)
  if (rawStatus === 'cancelled' || rawStatus === 'expired' || (rawStatus === 'pending_payment' && isLockExpired)) {
    return {
      stage: 'expired',
      label: rawStatus === 'cancelled' ? 'تم إلغاء الطلب' : 'ملغي لانتهاء المهلة',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'انتهت مهلة تثبيت السعر.',
      latestProof,
      canUpload: false,
      canReview: false,
    };
  }

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
      showBanner: false,
      countdown,
      message: 'تم استلام الإشعار. بانتظار مراجعة المحل.',
      latestProof,
      canUpload: false,
      canReview: true,
    };
  }

  if (rawStatus === 'payment_rejected' || (latestProof && latestProof.status === 'rejected')) {
    return {
      stage: 'rejected',
      label: 'تم رفض الإشعار',
      primaryAction: 'ارفع إشعارًا جديدًا',
      showBanner: true,
      countdown,
      message: latestProof?.review_note || order.rejection_reason || 'تم رفض إشعار التحويل. يرجى رفع إشعار جديد صالح.',
      latestProof,
      canUpload: true,
      canReview: false,
    };
  }

  if (rawStatus === 'pending_payment') {
    return {
      stage: 'pending_payment',
      label: 'بانتظار التحويل',
      primaryAction: 'ارفع إشعار التحويل',
      showBanner: true,
      countdown,
      message: 'يرجى تحويل المبلغ ورفع إشعار التحويل قبل انتهاء المهلة.',
      latestProof: null,
      canUpload: true,
      canReview: false,
    };
  }

  if (rawStatus === 'confirmed') {
    return {
      stage: 'confirmed',
      label: 'تم تأكيد الطلب',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'تم تأكيد استلام المبلغ وجارٍ تجهيز الطلب.',
      latestProof,
      canUpload: false,
      canReview: false,
    };
  }

  if (rawStatus === 'ready' || rawStatus === 'ready_for_pickup') {
    return {
      stage: 'ready',
      label: 'جاهز للاستلام / الشحن',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'الطلب جاهز للاستلام أو في انتظار شركة التوصيل.',
      latestProof,
      canUpload: false,
      canReview: false,
    };
  }

  if (rawStatus === 'out_for_delivery') {
    return {
      stage: 'out_for_delivery',
      label: 'خرج للتوصيل',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'المندوب في طريقه لتسليم طلبك.',
      latestProof,
      canUpload: false,
      canReview: false,
    };
  }

  if (rawStatus === 'completed' || rawStatus === 'delivered') {
    return {
      stage: 'completed',
      label: 'مكتمل',
      primaryAction: null,
      showBanner: false,
      countdown: 0,
      message: 'تم تسليم الطلب بنجاح. شكراً لتسوقك معنا.',
      latestProof,
      canUpload: false,
      canReview: false,
    };
  }

  return {
    stage: rawStatus,
    label: order.status_label || rawStatus,
    primaryAction: null,
    showBanner: false,
    countdown: 0,
    message: '',
    latestProof,
    canUpload: false,
    canReview: false,
  };
}

export function formatCountdownTime(seconds) {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
