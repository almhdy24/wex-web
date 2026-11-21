import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  Phone,
  MessageCircle,
  Printer,
  Copy,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Store,
  Eye,
  Check,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { formatSdg, formatDate, formatRelativeTime, resolveImageUrl } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import StatusChip from '../../components/admin/StatusChip';
import ImageViewer from '../../components/admin/ImageViewer';
import Page from '../../components/common/Page';
import ProductImage from '../../components/common/ProductImage';
import styles from './AdminOrderDetailPage.module.css';

function ProofThumbnailItem({ proof, orderNumber, onOpen }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi
      .getPaymentProofImage(orderNumber, proof.id)
      .then((blob) => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [orderNumber, proof.id]);

  return (
    <div
      className={styles.proofHistoryItem}
      onClick={() => onOpen('approve')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen('approve');
      }}
    >
      <div className={styles.proofThumbnailBox}>
        {loading ? (
          <Skeleton width="48px" height="48px" borderRadius="var(--radius-sm)" />
        ) : error || !blobUrl ? (
          <div className={styles.proofThumbError}>
            <AlertTriangle size={18} />
          </div>
        ) : (
          <img src={blobUrl} alt="إشعار التحويل" className={styles.proofThumbImg} />
        )}
      </div>

      <div className={styles.proofHistoryInfo}>
        <div className={styles.proofStatusRow}>
          <StatusChip status={proof.status} size="sm" />
          <span className={styles.proofDate}>{formatRelativeTime(proof.created_at)}</span>
        </div>
        <span className={styles.proofSender}>المرسل: {proof.sender_name || '—'}</span>
        <span className={styles.proofRef}>الرقم: {proof.reference_number || '—'}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onOpen('approve');
        }}
      >
        <Eye size={14} />
        <span>معاينة</span>
      </Button>
    </div>
  );
}

export default function AdminOrderDetailPage({ initialOrder = null, initialLoading = false } = {}) {
  const { orderNumber } = useParams();
  const { success, error: toastError } = useToast();

  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(initialOrder ? initialLoading : true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Modals
  const [courierModalOpen, setCourierModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [courierPhone, setCourierPhone] = useState('');

  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockHours, setLockHours] = useState(4);
  const [extendingLock, setExtendingLock] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [resettingOrphan, setResettingOrphan] = useState(false);

  // Proof Review Modal
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [proofImageBlobUrl, setProofImageBlobUrl] = useState(null);
  const [loadingProofImage, setLoadingProofImage] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewingProof, setReviewingProof] = useState(false);

  const loadOrder = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOrderDetail(orderNumber);
      setOrder(res.data);
    } catch (err) {
      setError(err.message || 'الاتصال ضعيف. حاول مجدداً.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrder === null) {
      loadOrder(true);
    }
  }, [orderNumber, initialOrder]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (proofImageBlobUrl) URL.revokeObjectURL(proofImageBlobUrl);
    };
  }, [proofImageBlobUrl]);

  // Update order status directly
  const handleStatusUpdate = async (nextStatus, payload = {}) => {
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(orderNumber, {
        status: nextStatus,
        ...payload,
      });
      success(`تم تحديث حالة الطلب إلى "${nextStatus}"`);
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل تحديث حالة الطلب');
    } finally {
      setUpdating(false);
    }
  };

  // Reset orphan order in payment_review with 0 proofs
  const handleResetOrphan = async () => {
    setResettingOrphan(true);
    try {
      const res = await adminApi.resetOrphanOrder(orderNumber);
      success(res.message || 'تمت معالجة الطلب وإعادته لحالة بانتظار التحويل');
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشلت معالجة الطلب');
    } finally {
      setResettingOrphan(false);
    }
  };

  // Primary Next-Step Action Logic
  const handlePrimaryNextStep = () => {
    if (!order) return;
    const isDelivery = order.delivery_type === 'delivery';

    switch (order.status) {
      case 'payment_review':
      case 'pending_payment': {
        const proofs = order.proofs || order.payment_proofs || [];
        const pendingProof = proofs.find((p) => p.status === 'pending') || order.payment?.latest_proof || proofs[0];
        if (pendingProof) {
          openProofReview(pendingProof, 'approve');
        }
        break;
      }
      case 'confirmed':
        handleStatusUpdate('processing');
        break;
      case 'processing':
        if (isDelivery) {
          setCourierModalOpen(true);
        } else {
          handleStatusUpdate('ready_for_pickup');
        }
        break;
      case 'ready_for_pickup':
      case 'out_for_delivery':
        handleStatusUpdate('delivered');
        break;
      default:
        break;
    }
  };

  // Courier Dispatch Submit
  const handleCourierSubmit = async (e) => {
    e.preventDefault();
    if (!courierName.trim()) {
      toastError('يرجى إدخال اسم المندوب');
      return;
    }
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(orderNumber, {
        status: 'out_for_delivery',
        courier_name: courierName.trim(),
        courier_phone: courierPhone.trim() || undefined,
      });
      success('تم تسليم الطلب للمندوب وتحديث الحالة');
      setCourierModalOpen(false);
      setCourierName('');
      setCourierPhone('');
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل تسليم الطلب للمندوب');
    } finally {
      setUpdating(false);
    }
  };

  // Lock Extension
  const handleExtendLock = async (e) => {
    e.preventDefault();
    setExtendingLock(true);
    try {
      await adminApi.extendLock(orderNumber, lockHours);
      success(`تم تمديد مهلة السعر بمقدار ${lockHours} ساعات`);
      setLockModalOpen(false);
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل تمديد مهلة السعر');
    } finally {
      setExtendingLock(false);
    }
  };

  // Cancel Order
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toastError('يرجى كتابة سبب الإلغاء');
      return;
    }
    setCancelling(true);
    try {
      await adminApi.updateOrderStatus(orderNumber, {
        status: 'cancelled',
        note: cancelReason.trim(),
      });
      success('تم إلغاء الطلب بنجاح');
      setCancelModalOpen(false);
      setCancelReason('');
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل إلغاء الطلب');
    } finally {
      setCancelling(false);
    }
  };

  // Proof Review Modal Open
  const openProofReview = async (proof, action = 'approve') => {
    setSelectedProof(proof);
    setReviewAction(action);
    setReviewNote('');
    setProofModalOpen(true);
    setLoadingProofImage(true);
    if (proofImageBlobUrl) URL.revokeObjectURL(proofImageBlobUrl);
    setProofImageBlobUrl(null);

    try {
      const blob = await adminApi.getPaymentProofImage(orderNumber, proof.id);
      const url = URL.createObjectURL(blob);
      setProofImageBlobUrl(url);
    } catch {
      toastError('تعذر تحميل صورة الإشعار');
    } finally {
      setLoadingProofImage(false);
    }
  };

  const handleProofDecision = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProof) return;

    if (reviewAction === 'reject' && !reviewNote.trim()) {
      toastError(adminAr.payments.rejectReasonRequired);
      return;
    }

    setReviewingProof(true);
    try {
      await adminApi.reviewPaymentProof(orderNumber, selectedProof.id, {
        action: reviewAction,
        note: reviewNote.trim() || undefined,
      });
      success(reviewAction === 'approve' ? 'تم اعتماد التحويل وتأكيد الطلب' : 'تم رفض الإشعار');
      setProofModalOpen(false);
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل تنفيذ القرار');
    } finally {
      setReviewingProof(false);
    }
  };

  const handleCopySummary = () => {
    if (!order) return;
    const summary = `طلب رقم #${order.order_number}\nالعميل: ${order.customer_name} (${order.customer_phone})\nالمبلغ الإجمالي: ${formatSdg(order.total_sdg)}\nالحالة: ${order.status}\nالاستلام: ${order.delivery_type === 'delivery' ? 'توصيل' : 'استلام بالمحل'}`;
    navigator.clipboard.writeText(summary);
    success('تم نسخ ملخص الطلب إلى الحافظة');
  };

  const handlePrintSlip = () => {
    window.print();
  };

  if (loading) {
    return (
      <Page className={styles.container}>
        <Skeleton height="36px" width="280px" />
        <div style={{ height: 16 }} />
        <Skeleton height="180px" borderRadius="var(--radius-lg)" />
        <div style={{ height: 16 }} />
        <Skeleton height="320px" borderRadius="var(--radius-lg)" />
      </Page>
    );
  }

  if (error || !order) {
    return (
      <Page className={styles.container}>
        <ErrorState message={error || 'تعذر تحميل بيانات الطلب'} onRetry={() => loadOrder(true)} />
      </Page>
    );
  }

  const isDelivery = order.delivery_type === 'delivery';

  // Determine Primary Next-Step Action Label, Hint, and Icon
  const proofs = order.proofs || order.payment_proofs || [];
  const canReviewPayment = order.payment?.can_review ?? (proofs.some((p) => p.status === 'pending') || order.status === 'payment_review');

  let nextStepAction = null;
  let nextStepHint = null;
  let NextStepIcon = CheckCircle2;
  let isNextStepDisabled = false;

  if (order.status === 'payment_review' || order.status === 'pending_payment') {
    if (canReviewPayment && proofs.length > 0) {
      nextStepAction = 'مراجعة الإشعار';
      nextStepHint = 'التحقق من إشعار التحويل البنكي وتأكيد استلام المبلغ';
      NextStepIcon = Eye;
    } else if (order.status === 'payment_review' && proofs.length === 0) {
      nextStepAction = null;
      nextStepHint = null;
    } else {
      nextStepAction = 'بانتظار إشعار العميل';
      nextStepHint = 'لم يقم العميل برفع إشعار التحويل البنكي بعد';
      NextStepIcon = Clock;
      isNextStepDisabled = true;
    }
  } else if (order.status === 'confirmed') {
    nextStepAction = 'بدء التجهيز';
    nextStepHint = 'تجهيز أجهزة الطلب وملحقاتها من المخزن';
    NextStepIcon = Package;
  } else if (order.status === 'processing') {
    nextStepAction = isDelivery ? 'تسليم للمندوب' : 'جاهز للاستلام';
    nextStepHint = isDelivery ? 'تسليم الطرد لمندوب شركة التوصيل وتحديث الحالة' : 'إشعار العميل بجاهزية الطلب للاستلام من المحل';
    NextStepIcon = isDelivery ? Truck : Store;
  } else if (order.status === 'ready_for_pickup' || order.status === 'out_for_delivery') {
    nextStepAction = 'تأكيد التسليم';
    nextStepHint = 'تأكيد استلام العميل للطلب بنجاح وإغلاقه';
    NextStepIcon = Check;
  } else if (order.status === 'delivered') {
    nextStepAction = 'الطلب مكتمل وتم التسليم';
    nextStepHint = 'تم إغلاق دورة حياة الطلب بنجاح';
    isNextStepDisabled = true;
  }

  return (
    <Page className={styles.container}>
      {/* Printable Order Slip (Visible only during window.print) */}
      <div className={styles.printOnlySlip} aria-hidden="true">
        <div className={styles.printHeader}>
          <h1>متجر ويكس تكنولوجي — بطاقة طلب</h1>
          <p>مول الواحة، الشهداء، أم درمان | هاتف: 0912345678</p>
        </div>
        <hr />
        <div className={styles.printMeta}>
          <div><strong>رقم الطلب:</strong> #{order.order_number}</div>
          <div><strong>التاريخ:</strong> {formatDate(order.created_at)}</div>
          <div><strong>العميل:</strong> {order.customer?.name || order.customer_name || (order.customer?.email ? order.customer.email.split('@')[0] : (order.customer?.phone || order.customer_phone || order.delivery_phone || '—'))} ({order.customer?.phone || order.customer_phone || order.delivery_phone || '—'})</div>
          <div><strong>طريقة الاستلام:</strong> {isDelivery ? 'توصيل' : 'استلام من المحل'}</div>
        </div>
        <table className={styles.printTable}>
          <thead>
            <tr>
              <th>الجهاز / المنتج</th>
              <th>الكمية</th>
              <th>السعر الفردي</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((it) => (
              <tr key={it.id || it.product_id}>
                <td>{it.product_name}</td>
                <td>{it.quantity}</td>
                <td>{formatSdg(it.unit_price_sdg)}</td>
                <td>{formatSdg(it.line_total_sdg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.printTotal}>
          <strong>المبلغ الإجمالي المدفوع: {formatSdg(order.total_sdg)}</strong>
        </div>
      </div>

      {/* Screen View */}
      <div className={styles.screenView}>
        {/* Back Link & Header */}
        <div className={styles.navBack}>
          <Link to="/admin/orders" className={styles.backLink}>
            <ArrowRight size={16} />
            <span>العودة لكافة الطلبات</span>
          </Link>
        </div>

        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.titleRow}>
              <h1 className={styles.orderTitle}>طلب #{order.order_number}</h1>
              <StatusChip status={order.status} size="md" />
            </div>
            <span className={styles.orderDate}>
              تم الإنشاء: {formatDate(order.created_at)} ({formatRelativeTime(order.created_at)})
            </span>
          </div>

          {/* Secondary Actions Bar */}
          <div className={styles.secondaryActions}>
            <Button variant="outline" size="sm" onClick={handlePrintSlip} title={adminAr.orders.printSlip}>
              <Printer size={14} />
              <span>{adminAr.orders.printSlip || 'طباعة بطاقة الطلب'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopySummary} title={adminAr.orders.copySummary}>
              <Copy size={14} />
              <span>نسخ الملخص</span>
            </Button>
            {order.status === 'pending_payment' && (
              <Button variant="outline" size="sm" onClick={() => setLockModalOpen(true)}>
                <Clock size={14} />
                <span>تمديد المهلة</span>
              </Button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(true)} className={styles.cancelBtn}>
                <Ban size={14} />
                <span>إلغاء الطلب</span>
              </Button>
            )}
          </div>
        </header>

        {/* Brand Divider */}
        <div className={styles.titleDivider} aria-hidden="true" />

        {/* Primary Next-Step Action Banner */}
        {nextStepAction && (
          <aside className={styles.nextStepBanner} aria-label="الإجراء التالي المطلوب">
            <div className={styles.nextStepInfo}>
              <span className={styles.nextStepBadge}>الخطوة التالية في مسار الطلب:</span>
              <span className={styles.nextStepHint}>{nextStepHint}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={isNextStepDisabled || updating}
              loading={updating}
              onClick={handlePrimaryNextStep}
              className={styles.nextStepCTA}
            >
              <NextStepIcon size={18} />
              <span>{nextStepAction}</span>
            </Button>
          </aside>
        )}

        {/* Two-Column Grid: Left Details + Right Timeline */}
        <div className={styles.grid}>
          {/* Main Column */}
          <div className={styles.mainCol}>
            {/* Customer Contact Card */}
            <section className={styles.card} aria-label="بيانات العميل">
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>بيانات العميل والتواصل</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.customerRow}>
                  <div>
                    <span className={styles.custName}>
                      {order.customer?.name || order.customer_name || (order.customer?.email ? order.customer.email.split('@')[0] : (order.customer?.phone || order.customer_phone || order.delivery_phone || '—'))}
                    </span>
                    <span className={styles.custPhone}>
                      {order.customer?.phone || order.customer_phone || order.delivery_phone || '—'}
                    </span>
                    <span className={styles.deliveryBadge}>
                      {isDelivery ? 'توصيل إلى العنوان' : 'استلام من المحل (مول الواحة)'}
                    </span>
                  </div>
                  <div className={styles.custActions}>
                    {(order.customer?.phone || order.customer_phone || order.delivery_phone) && (
                      <>
                        <a href={`tel:${order.customer?.phone || order.customer_phone || order.delivery_phone}`} className={styles.contactBtn}>
                          <Phone size={14} />
                          <span>اتصال هاتف</span>
                        </a>
                        <a
                          href={`https://wa.me/${(order.customer?.phone || order.customer_phone || order.delivery_phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            adminAr.orders.whatsappTemplate
                              .replace('{name}', order.customer?.name || order.customer_name || '')
                              .replace('{orderNumber}', order.order_number)
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.contactBtn} ${styles.whatsappBtn}`}
                        >
                          <MessageCircle size={14} />
                          <span>مراسلة واتساب</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery Details Card */}
            <section className={styles.card} aria-label={adminAr.orders.deliveryDetailsTitle}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{adminAr.orders.deliveryDetailsTitle}</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.deliveryDetailsGrid}>
                  <div>
                    <span className={styles.fieldLabel}>طريقة الاستلام:</span>
                    <strong className={styles.fieldValue}>{isDelivery ? 'توصيل إلى العنوان' : 'استلام من المحل (مول الواحة)'}</strong>
                  </div>
                  {isDelivery && (
                    <>
                      <div>
                        <span className={styles.fieldLabel}>المنطقة / الولاية:</span>
                        <strong className={styles.fieldValue}>{order.shipping_state || 'الخرطوم'}</strong>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>العنوان التفصيلي:</span>
                        <strong className={styles.fieldValue}>{order.shipping_address || '—'}</strong>
                      </div>
                    </>
                  )}
                  {order.courier_name && (
                    <div>
                      <span className={styles.fieldLabel}>مندوب التوصيل:</span>
                      <strong className={styles.fieldValue}>
                        {order.courier_name} {order.courier_phone && `(${order.courier_phone})`}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Order Items List */}
            <section className={styles.card} aria-label={adminAr.orders.itemsTitle}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{adminAr.orders.itemsTitle}</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.itemsList}>
                  {(order.items || []).map((it) => (
                    <div key={it.id || it.product_id} className={styles.itemRow}>
                      <div className={styles.itemThumb}>
                        <ProductImage
                          src={resolveImageUrl(it.product_image)}
                          alt={it.product_name}
                          type={it.product_type || it.type || 'laptop'}
                        />
                      </div>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{it.product_name}</span>
                        <span className={styles.itemQuantity}>الكمية: {it.quantity}</span>
                      </div>
                      <div className={styles.itemPrices}>
                        <span className={styles.unitPrice}>{formatSdg(it.unit_price_sdg)}</span>
                        <strong className={styles.lineTotal}>{formatSdg(it.line_total_sdg)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.orderTotalsBreakdown}>
                  <div className={styles.breakdownRow}>
                    <span>المجموع الجزئي:</span>
                    <span>{formatSdg(order.subtotal_sdg)}</span>
                  </div>
                  {order.discount_sdg > 0 && (
                    <div className={styles.breakdownRow}>
                      <span>خصم التطبيق:</span>
                      <span className={styles.discountText}>- {formatSdg(order.discount_sdg)}</span>
                    </div>
                  )}
                  {isDelivery && (
                    <div className={styles.breakdownRow}>
                      <span>رسوم التوصيل:</span>
                      <span>{formatSdg(order.delivery_fee_sdg)}</span>
                    </div>
                  )}
                  <div className={`${styles.breakdownRow} ${styles.finalTotalRow}`}>
                    <strong>الإجمالي النهائي:</strong>
                    <strong>{formatSdg(order.total_sdg)}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Proofs History */}
            <section className={styles.card} aria-label={adminAr.orders.proofsHistoryTitle}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{adminAr.orders.proofsHistoryTitle}</h2>
              </div>
              <div className={styles.cardBody}>
                {order.status === 'payment_review' && proofs.length === 0 && (
                  <div className={styles.orphanNoticeCard}>
                    <div className={styles.orphanHeader}>
                      <AlertTriangle size={18} />
                      <strong>طلب يتيم بدون إشعار دفع قيد المراجعة</strong>
                    </div>
                    <p className={styles.orphanDesc}>
                      هذا الطلب وصل لحالة مراجعة الدفع بدون وجود سجل إشعار دفع معلق. يمكنك إعادة الطلب لمرحلة بانتظار التحويل لفك التعليق.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleResetOrphan} loading={resettingOrphan}>
                      إعادة الطلب إلى بانتظار التحويل
                    </Button>
                  </div>
                )}

                {proofs.length === 0 ? (
                  <p className={styles.emptyNotice}>لا توجد إشعارات دفع مرفوعة حتى الآن.</p>
                ) : (
                  <div className={styles.proofsList}>
                    {proofs.map((proof) => (
                      <ProofThumbnailItem
                        key={proof.id}
                        proof={proof}
                        orderNumber={orderNumber}
                        onOpen={(action) => openProofReview(proof, action)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Side Column: Audit Timeline */}
          <div className={styles.sideCol}>
            <section className={styles.card} aria-label={adminAr.orders.timelineTitle}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{adminAr.orders.timelineTitle}</h2>
              </div>
              <div className={styles.cardBody}>
                {(order.timeline || []).length === 0 ? (
                  <p className={styles.emptyNotice}>لا توجد سجلات متابعة مسجلة.</p>
                ) : (
                  <div className={styles.timeline}>
                    {order.timeline.map((step, idx) => (
                      <div key={idx} className={styles.timelineStep}>
                        <div className={styles.timelineDot} />
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineHeader}>
                            <StatusChip status={step.status} size="sm" />
                            <span className={styles.timelineDate}>{formatRelativeTime(step.created_at)}</span>
                          </div>
                          {step.note && <p className={styles.timelineNote}>{step.note}</p>}
                          {step.user_name && <span className={styles.timelineUser}>بواسطة: {step.user_name}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Courier Modal */}
      <Modal
        isOpen={courierModalOpen}
        onClose={() => setCourierModalOpen(false)}
        title="بيانات مندوب التوصيل"
      >
        <form onSubmit={handleCourierSubmit} className={styles.modalForm}>
          <Input
            label={adminAr.orders.courierNameLabel}
            placeholder="اسم المندوب الكامل"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label={adminAr.orders.courierPhoneLabel}
            placeholder="0912345678"
            type="tel"
            value={courierPhone}
            onChange={(e) => setCourierPhone(e.target.value)}
          />
          <div className={styles.modalActions}>
            <Button variant="primary" size="md" type="submit" loading={updating}>
              تأكيد التسليم للمندوب
            </Button>
            <Button variant="outline" size="md" type="button" onClick={() => setCourierModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Extend Lock Modal */}
      <Modal
        isOpen={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        title="تمديد مهلة تثبيت السعر"
      >
        <form onSubmit={handleExtendLock} className={styles.modalForm}>
          <Input
            label={adminAr.orders.extendLockHoursLabel}
            type="number"
            min="1"
            max="48"
            value={lockHours}
            onChange={(e) => setLockHours(e.target.value)}
            required
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="primary" size="md" type="submit" loading={extendingLock}>
              تمديد المهلة
            </Button>
            <Button variant="outline" size="md" type="button" onClick={() => setLockModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="إلغاء طلب الشراء"
      >
        <div className={styles.modalForm}>
          <p className={styles.cancelWarning}>
            سيتم إلغاء الطلب وإعادة كميات الأجهزة إلى المخزون المتوفر فوراً.
          </p>
          <Input
            label={adminAr.orders.cancelReasonLabel}
            placeholder="اكتب سبب إلغاء الطلب (يظهر للعميل)..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="danger" size="md" onClick={handleCancelOrder} loading={cancelling}>
              تأكيد إلغاء الطلب
            </Button>
            <Button variant="outline" size="md" onClick={() => setCancelModalOpen(false)}>
              تراجع
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Proof Review Modal */}
      <Modal
        isOpen={proofModalOpen}
        onClose={() => setProofModalOpen(false)}
        title="معاينة إشعار الدفع البنكي"
      >
        <div className={styles.modalForm}>
          <div className={styles.proofModalViewer}>
            {loadingProofImage ? (
              <Skeleton height="300px" width="100%" borderRadius="var(--radius-md)" />
            ) : proofImageBlobUrl ? (
              <ImageViewer src={proofImageBlobUrl} alt="صورة إشعار بنكك" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', padding: '24px', background: 'var(--color-slate-100)', borderRadius: 'var(--radius-md)' }}>
                <AlertTriangle size={32} color="#D97706" />
                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-navy)' }}>تعذر عرض صورة الإشعار (الملف مفقود أو غير قابل للقراءة)</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-slate-600)', textAlign: 'center' }}>
                  يمكنك رفض الإشعار أدناه مع كتابة ملاحظة للعميل لرفع إشعار جديد.
                </p>
              </div>
            )}
          </div>

          <div className={styles.proofDecisionBox}>
            <div className={styles.decisionTypeRow}>
              <label>
                <input
                  type="radio"
                  name="reviewAction"
                  value="approve"
                  checked={reviewAction === 'approve'}
                  onChange={() => setReviewAction('approve')}
                />
                <span>اعتماد وقبول التحويل</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="reviewAction"
                  value="reject"
                  checked={reviewAction === 'reject'}
                  onChange={() => setReviewAction('reject')}
                />
                <span>رفض الإشعار</span>
              </label>
            </div>

            {reviewAction === 'reject' && (
              <Input
                label="سبب الرفض (يظهر للعميل)"
                placeholder="المبلغ المحول غير مطابق، الصورة غير واضحة..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                required
              />
            )}
          </div>

          <div className={styles.modalActions}>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              size="md"
              onClick={handleProofDecision}
              loading={reviewingProof}
            >
              تأكيد القرار
            </Button>
            <Button variant="outline" size="md" onClick={() => setProofModalOpen(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
