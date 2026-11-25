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

    // A passed lock on an order still awaiting proof is expired even before the server's
    // expiry job catches up: showing "السعر مثبت لمدة 00:00:00" and an upload form lies (VIS-02).
    if (
      pState === 'expired' || rawStatus === 'cancelled' || rawStatus === 'expired' ||
      (pState === 'awaiting_proof' && isLockExpired)
    ) {
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
        label = 'جاهز للاستلام أو التوصيل';
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
      label: 'جاهز للاستلام أو التوصيل',
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

/**
 * Canonical Order Statuses matching wex-api (Config/Wex.php).
 */
export const ORDER_STATUSES = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_REVIEW: 'payment_review',
  CONFIRMED: 'confirmed',
  READY_FOR_PICKUP: 'ready_for_pickup',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

/**
 * Valid transitions matrix per backend OrderStateMachine.php:
 * fromStatus => [toStatuses]
 */
export const ALLOWED_TRANSITIONS = {
  pending_payment: ['payment_review', 'cancelled', 'expired'],
  payment_review: ['confirmed', 'pending_payment', 'expired', 'cancelled'],
  confirmed: ['ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled'],
  ready_for_pickup: ['completed', 'cancelled'],
  out_for_delivery: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  expired: [],
};

/**
 * Arabic status labels for UI and error messages.
 */
export const ORDER_STATUS_LABELS = {
  pending_payment: 'بانتظار التحويل',
  payment_review: 'مراجعة الإشعار',
  confirmed: 'تم التأكيد وجاري التجهيز',
  ready_for_pickup: 'جاهز للاستلام بالمحل',
  out_for_delivery: 'خرج مع المندوب للتوصيل',
  completed: 'مكتمل ومستلم',
  cancelled: 'ملغي',
  expired: 'منتهي الصلاحية',
};

/**
 * Checks if a transition from fromStatus to toStatus is permitted.
 */
export function canTransitionOrder(fromStatus, toStatus) {
  // Normalize legacy aliases
  const normalizedTo = toStatus === 'delivered' ? 'completed' : toStatus;
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  return allowed.includes(normalizedTo);
}

/**
 * Returns specific error message for invalid transitions.
 */
export function getTransitionErrorMessage(fromStatus, toStatus) {
  const fromName = ORDER_STATUS_LABELS[fromStatus] || fromStatus;
  const toName = ORDER_STATUS_LABELS[toStatus] || toStatus;
  return `لا يمكن نقل الطلب من [${fromName}] إلى [${toName}].`;
}

/**
 * Returns the primary next action for an order based on delivery type and status.
 */
export function getNextOrderAction(order) {
  if (!order || !order.status) return null;
  const status = order.status;
  const isDelivery = order.delivery_type === 'delivery';

  switch (status) {
    case 'pending_payment':
      return {
        targetStatus: 'payment_review',
        actionLabel: 'مراجعة الإشعار',
        hint: 'في انتظار رفع إشعار التحويل البنكي من العميل',
        iconName: 'Eye',
        needsCourierModal: false,
      };
    case 'payment_review':
      return {
        targetStatus: 'confirmed',
        actionLabel: 'تأكيد الدفع',
        hint: 'مراجعة وتأكيد صحة إشعار التحويل البنكي',
        iconName: 'CheckCircle2',
        needsCourierModal: false,
      };
    case 'confirmed':
      if (isDelivery) {
        return {
          targetStatus: 'out_for_delivery',
          actionLabel: 'تسليم للمندوب',
          hint: 'تسليم الطرد لمندوب شركة التوصيل وتحديث الحالة',
          iconName: 'Truck',
          needsCourierModal: true,
        };
      }
      return {
        targetStatus: 'ready_for_pickup',
        actionLabel: 'جاهز للاستلام',
        hint: 'إشعار العميل بجاهزية الطلب للاستلام من المحل',
        iconName: 'Store',
        needsCourierModal: false,
      };
    case 'ready_for_pickup':
      return {
        targetStatus: 'completed',
        actionLabel: 'إكمال الاستلام',
        hint: 'تأكيد حضور العميل واستلام الطلب بنجاح',
        iconName: 'CheckCircle2',
        needsCourierModal: false,
      };
    case 'out_for_delivery':
      return {
        targetStatus: 'completed',
        actionLabel: 'تأكيد التسليم',
        hint: 'تأكيد تسليم المندوب الشحنة للعميل بنجاح',
        iconName: 'CheckCircle2',
        needsCourierModal: false,
      };
    default:
      return null;
  }
}
