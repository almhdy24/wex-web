import React from 'react';
import {
  Clock,
  Eye,
  CheckCircle2,
  Package,
  Truck,
  Store,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  User,
} from 'lucide-react';
import styles from './StatusChip.module.css';

const STATUS_MAP = {
  // Order Statuses
  pending_payment: { label: 'بانتظار التحويل', variant: 'warning', icon: Clock },
  payment_review: { label: 'مراجعة الإشعار', variant: 'warning', icon: Eye },
  confirmed: { label: 'تم تأكيد الدفع', variant: 'success', icon: CheckCircle2 },
  processing: { label: 'قيد التجهيز بالمحل', variant: 'info', icon: Package },
  ready_for_pickup: { label: 'جاهز للاستلام بالمحل', variant: 'info', icon: Store },
  out_for_delivery: { label: 'مع مندوب التوصيل', variant: 'info', icon: Truck },
  delivered: { label: 'تم التسليم بنجاح', variant: 'success', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', variant: 'danger', icon: XCircle },
  expired: { label: 'انتهت مهلة السعر', variant: 'danger', icon: AlertTriangle },

  // Payment Proof Review Statuses
  pending: { label: 'قيد التدقيق', variant: 'warning', icon: Clock },
  approved: { label: 'مقبول', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', variant: 'danger', icon: XCircle },

  // User Roles
  admin: { label: 'مدير نظام', variant: 'primary', icon: ShieldCheck },
  staff: { label: 'طاقم عمل', variant: 'info', icon: UserCheck },
  customer: { label: 'عميل', variant: 'neutral', icon: User },

  // Boolean Activity
  active: { label: 'معروض', variant: 'success', icon: CheckCircle2 },
  inactive: { label: 'مخفي', variant: 'neutral', icon: XCircle },
};

/**
 * StatusChip
 * Accessible status indicator combining text, semantic color, and an SVG icon.
 */
export default function StatusChip({ status, label, variant, icon: CustomIcon, size = 'md' }) {
  const config = STATUS_MAP[status] || {
    label: label || status,
    variant: variant || 'neutral',
    icon: CustomIcon || Clock,
  };

  const finalLabel = label || config.label;
  const finalVariant = variant || config.variant;
  const Icon = CustomIcon || config.icon;

  return (
    <span className={`${styles.chip} ${styles[finalVariant]} ${styles[size]}`}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} className={styles.icon} strokeWidth={2} aria-hidden="true" />}
      <span className={styles.label}>{finalLabel}</span>
    </span>
  );
}
