import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle2, Check, X } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatSdg, formatDate, getOrderStatusInfo, getProofStatusInfo } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import styles from './AdminOrderDetailPage.module.css';

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams();
  const { success, error: toastError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Update Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [courierName, setCourierName] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Lock Extension Modal
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockHours, setLockHours] = useState(4);
  const [extendingLock, setExtendingLock] = useState(false);

  // Payment Proof Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [proofImageBlobUrl, setProofImageBlobUrl] = useState(null);
  const [loadingProofImage, setLoadingProofImage] = useState(false);

  const loadOrder = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOrderDetail(orderNumber);
      setOrder(res.data);
    } catch (err) {
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder(true);
  }, [orderNumber]);

  const openProofReview = async (proof, action) => {
    setSelectedProof(proof);
    setReviewAction(action);
    setReviewNote('');
    setReviewModalOpen(true);
    setLoadingProofImage(true);
    setProofImageBlobUrl(null);

    try {
      const blob = await adminApi.getPaymentProofImage(orderNumber, proof.id);
      const url = URL.createObjectURL(blob);
      setProofImageBlobUrl(url);
    } catch {
      toastError('تعذر تحميل ملف الإشعار');
    } finally {
      setLoadingProofImage(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setUpdatingStatus(true);

    try {
      await adminApi.updateOrderStatus(orderNumber, {
        status: newStatus,
        note: statusNote.trim() || undefined,
        courier_name: courierName.trim() || undefined,
        courier_phone: courierPhone.trim() || undefined,
      });
      success('تم تحديث حالة الطلب');
      setStatusModalOpen(false);
      setStatusNote('');
      setCourierName('');
      setCourierPhone('');
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل تحديث الحالة. حاول تاني.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExtendLock = async (e) => {
    e.preventDefault();
    setExtendingLock(true);
    try {
      await adminApi.extendPriceLock(orderNumber, Number(lockHours));
      success(`تم تمديد حجز السعر بنجاح لمدة ${lockHours} ساعات`);
      setLockModalOpen(false);
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل تمديد الحجز');
    } finally {
      setExtendingLock(false);
    }
  };

  const handleProofReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProof) return;

    if (reviewAction === 'reject' && !reviewNote.trim()) {
      toastError('يرجى كتابة سبب الرفض');
      return;
    }

    setReviewing(true);
    try {
      await adminApi.reviewPaymentProof(orderNumber, selectedProof.id, {
        action: reviewAction,
        note: reviewNote.trim() || undefined,
      });
      success(reviewAction === 'approve' ? 'تم اعتماد التحويل وتأكيد الطلب' : 'تم رفض الإشعار');
      setReviewModalOpen(false);
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل تنفيذ الإجراء');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="36px" width="40%" />
        <div style={{ height: 16 }} />
        <Skeleton height="260px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.container}>
        <ErrorState
          title="تعذر العثور على الطلب"
          message={error || 'رقم الطلب غير صحيح.'}
        />
      </div>
    );
  }

  const statusInfo = getOrderStatusInfo(order.status);
  const isPending = order.status === 'pending_payment';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <Link
            to="/admin/orders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--text-xs)',
              color: 'var(--color-slate-500)',
              textDecoration: 'none',
              marginBottom: 4,
            }}
          >
            <ArrowRight size={14} />
            <span>العودة لقائمة الطلبات</span>
          </Link>
          <h1 className={styles.orderNumber}>#{order.order_number}</h1>
          <span className={styles.orderDate}>
            تاريخ الإنشاء: {formatDate(order.created_at)}
          </span>
        </div>

        <div className={styles.headerActions}>
          <Tag variant={statusInfo.variant}>{statusInfo.label}</Tag>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewStatus(order.status);
              setStatusModalOpen(true);
            }}
          >
            <CheckCircle2 size={14} />
            <span>تحديث الحالة</span>
          </Button>

          {isPending && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLockModalOpen(true)}
            >
              <Clock size={14} />
              <span>تمديد حجز السعر</span>
            </Button>
          )}
        </div>
      </header>

      {/* Brand graphic: thin divider under admin page title */}
      <div className={styles.titleDivider} aria-hidden="true" />

      <div className={styles.grid}>
        {/* Main Column */}
        <div>
          {/* Order Items */}
          <section className={styles.card} aria-label="المنتجات">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>المنتجات والأجهزة المطلوبة</h2>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>الجهاز</th>
                    <th>سعر القطعة (SDG)</th>
                    <th>
                      سعر القطعة (AED) <span className={styles.adminOnlyBadge}>للإدارة فقط</span>
                    </th>
                    <th>الكمية</th>
                    <th>المجموع (SDG)</th>
                    <th>
                      المجموع (AED) <span className={styles.adminOnlyBadge}>للإدارة فقط</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name || item.product_name}</strong>
                      </td>
                      <td>{formatSdg(item.unit_price_sdg)}</td>
                      <td>{item.unit_price_aed ? `${item.unit_price_aed} AED` : '—'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatSdg(item.line_total_sdg || item.subtotal_sdg)}</td>
                      <td>{item.line_total_aed ? `${item.line_total_aed} AED` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <div className={styles.footerRow}>
                <span>
                  سعر الصرف المعتمد للطلب: <span className={styles.adminOnlyBadge}>للإدارة فقط</span>
                </span>
                <span style={{ fontWeight: 700 }}>
                  {order.rate_sdg_snapshot ? `1 AED = ${Number(order.rate_sdg_snapshot).toLocaleString('en-US')} SDG` : '—'}
                </span>
              </div>
              <div className={styles.footerRow}>
                <span>
                  المجموع الفرعي (AED): <span className={styles.adminOnlyBadge}>للإدارة فقط</span>
                </span>
                <span style={{ fontWeight: 700 }}>
                  {order.subtotal_aed ? `${order.subtotal_aed} AED` : '—'}
                </span>
              </div>
              <div className={styles.footerRow}>
                <span>المجموع الفرعي (SDG):</span>
                <span>{formatSdg(order.subtotal_sdg)}</span>
              </div>
              {order.discount_sdg > 0 && (
                <div className={styles.footerRow} style={{ color: 'var(--color-success)' }}>
                  <span>خصم التطبيق:</span>
                  <span>-{formatSdg(order.discount_sdg)}</span>
                </div>
              )}
              <div className={styles.footerRow}>
                <span>رسوم التوصيل:</span>
                <span>
                  {order.delivery_fee_sdg === 0 ? 'مجاناً' : formatSdg(order.delivery_fee_sdg)}
                </span>
              </div>
              <div className={styles.footerTotalRow}>
                <span>المبلغ الإجمالي المثبت:</span>
                <span className={styles.totalSdg}>{formatSdg(order.total_sdg)}</span>
              </div>
            </div>
          </section>

          {/* Payment Proofs */}
          <section className={styles.card} aria-label="إشعارات التحويل">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>إشعارات الدفع والتحويل البنكي</h2>
            </div>
            <div className={styles.cardBody}>
              {!order.proofs || order.proofs.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0 }}>
                  لم يتم رفع أي إشعار تحويل لهذا الطلب حتى الآن.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {order.proofs.map((proof) => {
                    const proofStatus = getProofStatusInfo(proof.status);
                    return (
                      <div
                        key={proof.id}
                        style={{
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-slate-50)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                            تاريخ الرفع: {formatDate(proof.created_at)}
                          </span>
                          <Tag variant={proofStatus.variant}>{proofStatus.label}</Tag>
                        </div>

                        {proof.sender_name && (
                          <div style={{ fontSize: '12px' }}>اسم المحوّل: <strong>{proof.sender_name}</strong></div>
                        )}
                        {proof.reference_number && (
                          <div style={{ fontSize: '12px' }} dir="ltr">الرقم المرجعي: <strong>{proof.reference_number}</strong></div>
                        )}

                        <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openProofReview(proof, 'approve')}
                          >
                            <Check size={14} />
                            <span>مراجعة واعتماد</span>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openProofReview(proof, 'reject')}
                          >
                            <X size={14} />
                            <span>رفض</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div>
          {/* Customer & Delivery */}
          <section className={styles.card} aria-label="بيانات العميل">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>بيانات العميل والتسليم</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoList}>
                <div>
                  <span className={styles.infoLabel}>العميل: </span>
                  <strong>{order.user_name || order.customer_name || 'عميل'}</strong>
                </div>
                <div>
                  <span className={styles.infoLabel}>الهاتف: </span>
                  <span dir="ltr"><strong>{order.contact_phone}</strong></span>
                </div>
                <div>
                  <span className={styles.infoLabel}>طريقة الاستلام: </span>
                  <span>{order.delivery_type === 'pickup' ? 'استلام من المحل' : 'توصيل للعنوان'}</span>
                </div>
                {order.delivery_type === 'delivery' && (
                  <div>
                    <span className={styles.infoLabel}>العنوان: </span>
                    <span>{order.delivery_address}</span>
                  </div>
                )}
                {order.customer_notes && (
                  <div>
                    <span className={styles.infoLabel}>ملاحظات العميل: </span>
                    <span>{order.customer_notes}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Timeline */}
          {order.events && order.events.length > 0 && (
            <section className={styles.card} aria-label="المسار">
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>مسار المراحل</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.timeline}>
                  {order.events.map((evt) => (
                    <div key={evt.id} className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <span className={styles.timelineStatus}>
                        {evt.status_ar || evt.new_status}
                      </span>
                      <span className={styles.timelineDate}>
                        {formatDate(evt.created_at)}
                      </span>
                      {evt.note && (
                        <span className={styles.timelineNote}>{evt.note}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Modal: Status Update */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="تحديث حالة الطلب"
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              loading={updatingStatus}
              onClick={handleStatusSubmit}
            >
              حفظ التحديث
            </Button>
          </>
        }
      >
        <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              الحالة الجديدة
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontFamily: 'inherit',
              }}
            >
              <option value="pending_payment">بانتظار الدفع</option>
              <option value="payment_review">مراجعة إشعار الدفع</option>
              <option value="confirmed">تم تأكيد الطلب</option>
              <option value="ready_for_pickup">جاهز للاستلام بالمحل</option>
              <option value="out_for_delivery">جاري التوصيل مع المندوب</option>
              <option value="completed">مكتمل ومستلم</option>
              <option value="cancelled">إلغاء الطلب</option>
            </select>
          </div>

          {newStatus === 'out_for_delivery' && (
            <>
              <Input
                label="اسم المندوب"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
              />
              <Input
                label="هاتف المندوب"
                value={courierPhone}
                onChange={(e) => setCourierPhone(e.target.value)}
                dir="ltr"
              />
            </>
          )}

          <Input
            label="ملاحظة إدارية داخلية (اختياري)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
        </form>
      </Modal>

      {/* Modal: Extend Price Lock */}
      <Modal
        isOpen={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        title="تمديد حجز سعر الصرف"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLockModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              loading={extendingLock}
              onClick={handleExtendLock}
            >
              تمديد المهلة
            </Button>
          </>
        }
      >
        <form onSubmit={handleExtendLock}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
            ساعات التمديد الإضافية
          </label>
          <input
            type="number"
            min={1}
            max={72}
            value={lockHours}
            onChange={(e) => setLockHours(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontFamily: 'inherit',
            }}
          />
        </form>
      </Modal>

      {/* Modal: Review Proof */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewAction === 'approve' ? 'اعتماد الإشعار' : 'رفض الإشعار'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReviewModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              loading={reviewing}
              disabled={loadingProofImage || reviewing}
              onClick={handleProofReviewSubmit}
            >
              تأكيد القرار
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ textAlign: 'center', backgroundColor: 'var(--color-slate-100)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loadingProofImage ? (
              <span>جاري تحميل ملف الإشعار...</span>
            ) : proofImageBlobUrl ? (
              <img
                src={proofImageBlobUrl}
                alt="إشعار"
                style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }}
              />
            ) : (
              <span style={{ color: 'var(--color-danger)' }}>تعذر تحميل الصورة</span>
            )}
          </div>

          {reviewAction === 'reject' && (
            <Input
              label="سبب الرفض (إلزامي)"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="مثال: المبلغ غير مطابق، الإشعار غير واضح..."
              required
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
