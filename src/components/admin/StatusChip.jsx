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
  HelpCircle,
} from 'lucide-react';
import styles from './StatusChip.module.css';

const DOMAIN_MAP = {
  account: {
    active: { label: 'نشط', variant: 'success', icon: CheckCircle2 },
    inactive: { label: 'معطل', variant: 'danger', icon: XCircle },
  },
  visibility: {
    active: { label: 'معروض', variant: 'success', icon: CheckCircle2 },
    inactive: { label: 'مخفي', variant: 'neutral', icon: XCircle },
  },
  role: {
    admin: { label: 'مدير عام', variant: 'warning', icon: ShieldCheck },
    staff: { label: 'موظف متجر', variant: 'info', icon: UserCheck },
    customer: { label: 'عميل', variant: 'neutral', icon: User },
  },
  proof: {
    pending: { label: 'قيد التدقيق', variant: 'warning', icon: Clock },
    approved: { label: 'مقبول', variant: 'success', icon: CheckCircle2 },
    rejected: { label: 'مرفوض', variant: 'danger', icon: XCircle },
  },
  order: {
    pending_payment: { label: 'بانتظار التحويل', variant: 'warning', icon: Clock },
    payment_review: { label: 'مراجعة الإشعار', variant: 'warning', icon: Eye },
    confirmed: { label: 'تم تأكيد الدفع', variant: 'success', icon: CheckCircle2 },
    processing: { label: 'قيد التجهيز بالمحل', variant: 'info', icon: Package },
    ready_for_pickup: { label: 'جاهز للاستلام بالمحل', variant: 'info', icon: Store },
    out_for_delivery: { label: 'مع مندوب التوصيل', variant: 'info', icon: Truck },
    delivered: { label: 'تم التسليم بنجاح', variant: 'success', icon: CheckCircle2 },
    completed: { label: 'مكتمل ومستلم', variant: 'success', icon: CheckCircle2 },
    cancelled: { label: 'ملغي', variant: 'danger', icon: XCircle },
    expired: { label: 'انتهت مهلة السعر', variant: 'danger', icon: AlertTriangle },
  },
};

const DEFAULT_MAP = {
  ...DOMAIN_MAP.order,
  ...DOMAIN_MAP.proof,
  admin: { label: 'مدير نظام', variant: 'primary', icon: ShieldCheck },
  staff: { label: 'طاقم عمل', variant: 'info', icon: UserCheck },
  customer: { label: 'عميل', variant: 'neutral', icon: User },
  active: { label: 'معروض', variant: 'success', icon: CheckCircle2 },
  inactive: { label: 'مخفي', variant: 'neutral', icon: XCircle },
};

/**
 * StatusChip
 * Accessible status indicator combining text, semantic color, and an SVG icon.
 * Supports domains: order, proof, role, visibility, account.
 */
export default function StatusChip({
  status,
  domain,
  label,
  variant,
  icon: CustomIcon,
  size = 'md',
}) {
  const domainConfig = domain && DOMAIN_MAP[domain] ? DOMAIN_MAP[domain][status] : null;
  const config = domainConfig || DEFAULT_MAP[status];

  const finalLabel = label || config?.label || status || 'غير محدد';
  const finalVariant = variant || config?.variant || 'neutral';
  const Icon = CustomIcon || config?.icon || (config ? null : HelpCircle);

  return (
    <span className={`${styles.chip} ${styles[finalVariant]} ${styles[size]}`}>
      {Icon && (
        <Icon
          size={size === 'sm' ? 12 : 14}
          className={styles.icon}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
      <span className={styles.label}>{finalLabel}</span>
    </span>
  );
}
