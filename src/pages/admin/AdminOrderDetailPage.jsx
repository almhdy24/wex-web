import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { formatSdg, formatDate, getOrderStatusInfo, getProofStatusInfo } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
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
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject'
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
      setError(err.message || 'فشل تحميل بيانات الطلب');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder(true);
  }, [orderNumber]);

  // Handle Loading Proof Image for modal review
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
      // image failed to stream
    } finally {
      setLoadingProofImage(false);
    }
  };

  // Submit Status Update
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
      success('تم تحديث حالة الطلب بنجاح');
      setStatusModalOpen(false);
      setStatusNote('');
      setCourierName('');
      setCourierPhone('');
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل تحديث حالة الطلب');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Submit Lock Extension
  const handleLockSubmit = async (e) => {
    e.preventDefault();
    setExtendingLock(true);

    try {
      await adminApi.extendLock(orderNumber, lockHours);
      success(`تم تمديد حجز السعر بنجاح لمدة ${lockHours} ساعات`);
      setLockModalOpen(false);
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل تمديد حجز السعر');
    } finally {
      setExtendingLock(false);
    }
  };

  // Submit Payment Proof Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewAction === 'reject' && !reviewNote.trim()) {
      toastError('سبب رفض إشعار التحويل مطلوب');
      return;
    }

    setReviewing(true);
    try {
      await adminApi.reviewPaymentProof(orderNumber, selectedProof.id, {
        action: reviewAction,
        note: reviewNote.trim() || undefined,
      });
      success(reviewAction === 'approve' ? 'تم اعتماد إشعار التحويل وتأكيد الطلب' : 'تم رفض الإشعار وتحديث الطلب');
      setReviewModalOpen(false);
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل مراجعة الإشعار');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton height="36px" width="300px" style={{ marginBottom: 'var(--space-4)' }} />
        <Skeleton height="160px" borderRadius="var(--radius-lg)" style={{ marginBottom: 'var(--space-6)' }} />
        <Skeleton height="320px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !order) {
    return <ErrorState message={error || 'تعذر تحميل بيانات الطلب'} onRetry={() => loadOrder(true)} />;
  }

  const statusInfo = getOrderStatusInfo(order.status);

  // Compute allowed transitions based on OrderStateMachine
  const getAllowedTransitions = () => {
    switch (order.status) {
      case 'confirmed':
        return [
          { value: 'ready_for_pickup', label: 'جاهز للاستلام بالمحل (Ready for Pickup)' },
          { value: 'out_for_delivery', label: 'جاري التوصيل مع المندوب (Out for Delivery)' },
          { value: 'cancelled', label: 'إلغاء الطلب (Cancel)' },
        ];
      case 'ready_for_pickup':
        return [
          { value: 'completed', label: 'تم التسليم بنجاح (Completed)' },
          { value: 'cancelled', label: 'إلغاء الطلب (Cancel)' },
        ];
      case 'out_for_delivery':
        return [
          { value: 'completed', label: 'تم التسليم بنجاح (Completed)' },
          { value: 'cancelled', label: 'إلغاء الطلب (Cancel)' },
        ];
      default:
        return [];
    }
  };

  const allowedTransitions = getAllowedTransitions();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
            <Link to="/admin/orders" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              ← العودة لقائمة الطلبات
            </Link>
          </div>
          <h1 className="en-text" style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-navy)', margin: 0 }}>
            #{order.order_number}
          </h1>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', marginTop: 4 }}>
            تاريخ الإنشاء: {formatDate(order.created_at)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Badge variant={statusInfo.variant} style={{ fontSize: '13px', padding: '6px 14px' }}>
            <span>{statusInfo.icon}</span>
            <span>{statusInfo.label}</span>
          </Badge>

          {allowedTransitions.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setNewStatus(allowedTransitions[0].value);
                setStatusModalOpen(true);
              }}
            >
              ⚙️ تحديث الحالة
            </Button>
          )}

          {order.status === 'pending_payment' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLockModalOpen(true)}
            >
              ⏳ تمديد حجز السعر
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {/* Customer Information */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>بيانات العميل</h3>
          </div>
          <div className="card-body" style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>الاسم: </span>
              <strong>{order.customer?.name || order.user_name || 'عميل'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>البريد الإلكتروني: </span>
              <span className="en-text">{order.customer?.email || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>رقم هاتف التواصل: </span>
              <span className="en-text" style={{ fontWeight: 700 }}>{order.contact_phone}</span>
            </div>
            {order.customer_notes && (
              <div>
                <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>ملاحظات العميل: </span>
                <span style={{ color: 'var(--color-slate-700)' }}>{order.customer_notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>بيانات التسليم والشحن</h3>
          </div>
          <div className="card-body" style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>نوع الاستلام: </span>
              <strong>{order.delivery_type === 'pickup' ? 'استلام من المحل (مول الواحة - أم درمان)' : 'توصيل للعنوان'}</strong>
            </div>
            {order.delivery_type === 'delivery' && (
              <>
                {order.shipping_zone && (
                  <div>
                    <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>الولاية: </span>
                    <span>{order.shipping_zone.state_name_ar}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>العنوان التفصيلي: </span>
                  <span>{order.delivery_address}</span>
                </div>
              </>
            )}
            {order.courier_name && (
              <div>
                <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>مندوب التوصيل: </span>
                <strong>{order.courier_name}</strong> ({order.courier_phone})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Proofs Review Section */}
      {order.proofs && order.proofs.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>
              إشعارات التحويل البنكي المرفوعة ({order.proofs.length})
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {order.proofs.map((proof) => {
              const pStatus = getProofStatusInfo(proof.status);
              return (
                <div
                  key={proof.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--color-slate-50)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-slate-200)',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                      <Badge variant={pStatus.variant}>{pStatus.label}</Badge>
                      <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                        تاريخ الرفع: {formatDate(proof.created_at)}
                      </span>
                    </div>
                    {proof.sender_name && (
                      <div style={{ fontSize: '12px' }}>اسم المحوّل: <strong>{proof.sender_name}</strong></div>
                    )}
                    {proof.reference_number && (
                      <div style={{ fontSize: '12px' }}>الرقم المرجعي: <span className="en-text font-mono">{proof.reference_number}</span></div>
                    )}
                    {proof.reviewer_note && (
                      <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: 2 }}>
                        ملاحظة المراجع: {proof.reviewer_note}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openProofReview(proof, 'view')}
                    >
                      👁️ معاينة الإشعار
                    </Button>
                    {proof.status === 'pending' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openProofReview(proof, 'approve')}
                        >
                          ✓ قبول واعتماد
                        </Button>
                        <Button
                          variant="danger-outline"
                          size="sm"
                          onClick={() => openProofReview(proof, 'reject')}
                        >
                          ✕ رفض الإشعار
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Line Items Table */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>المنتجات والأجهزة المحجوزة</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>اسم الجهاز</th>
                <th>سعر الوحدة</th>
                <th>الكمية</th>
                <th>المجموع بالجنيه</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{item.product_name}</div>
                    {item.specs_snapshot && (
                      <div className="en-text" style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                        {item.specs_snapshot.cpu} | {item.specs_snapshot.ram} | {item.specs_snapshot.storage}
                      </div>
                    )}
                  </td>
                  <td>{formatSdg(item.unit_price_sdg)}</td>
                  <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-royal-blue)' }}>
                    {formatSdg(item.subtotal_sdg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Calculations Footer */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', backgroundColor: 'var(--color-slate-50)', borderTop: '1px solid var(--color-slate-100)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-slate-600)' }}>المجموع الفرعي:</span>
            <span>{formatSdg(order.subtotal_sdg)}</span>
          </div>
          {order.discount_sdg > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
              <span>خصم التطبيق:</span>
              <span>-{formatSdg(order.discount_sdg)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-slate-600)' }}>رسوم التوصيل:</span>
            <span>{order.delivery_fee_sdg === 0 ? 'مجاناً' : formatSdg(order.delivery_fee_sdg)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px dashed var(--color-slate-200)', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-royal-blue)' }}>
            <span>الإجمالي:</span>
            <span>{formatSdg(order.total_sdg)}</span>
          </div>
        </div>
      </div>

      {/* Audit Events Timeline */}
      {order.events && order.events.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>سجل الأحداث والعمليات</h3>
          </div>
          <div className="card-body">
            <div className="timeline">
              {order.events.map((evt) => (
                <div key={evt.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>
                    {evt.status_ar || evt.new_status}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>
                    {formatDate(evt.created_at)}
                  </div>
                  {evt.note && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-600)', marginTop: 2 }}>
                      {evt.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Update Order Status */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="تحديث حالة الطلب"
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" loading={updatingStatus} onClick={handleStatusSubmit}>
              حفظ التحديث
            </Button>
          </>
        }
      >
        <form onSubmit={handleStatusSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">الحالة الجديدة للطلب</label>
            <select
              className="form-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
            >
              {allowedTransitions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {newStatus === 'out_for_delivery' && (
            <>
              <Input
                label="اسم مندوب التوصيل (اختياري)"
                placeholder="مثال: عثمان خالد"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
              />
              <Input
                label="رقم هاتف المندوب (اختياري)"
                placeholder="09..."
                value={courierPhone}
                onChange={(e) => setCourierPhone(e.target.value)}
                dir="ltr"
              />
            </>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ملاحظة إدارية / سبب التغيير (اختياري)</label>
            <textarea
              className="form-textarea"
              placeholder="اكتب ملاحظة تسجل في مسار أحداث الطلب..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Extend Price Lock */}
      <Modal
        isOpen={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        title="تمديد حجز السعر"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLockModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" loading={extendingLock} onClick={handleLockSubmit}>
              تأكيد التمديد
            </Button>
          </>
        }
      >
        <form onSubmit={handleLockSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">ساعات التمديد الإضافية (1 - 72 ساعة)</label>
            <input
              type="number"
              min={1}
              max={72}
              value={lockHours}
              onChange={(e) => setLockHours(e.target.value)}
              className="form-input"
              required
            />
            <span className="form-hint">سيتم تمديد وقت انتهاء صلاحية سعر الصرف المجمّد لهذا الطلب</span>
          </div>
        </form>
      </Modal>

      {/* Modal: Review Payment Proof */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewAction === 'view' ? 'معاينة إشعار التحويل البنكي' : reviewAction === 'approve' ? 'اعتماد إشعار التحويل وتأكيد الطلب' : 'رفض إشعار التحويل'}
        maxWidth="600px"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReviewModalOpen(false)}>
              إغلاق
            </Button>
            {reviewAction !== 'view' && (
              <Button
                variant={reviewAction === 'approve' ? 'primary' : 'danger'}
                loading={reviewing}
                onClick={handleReviewSubmit}
              >
                {reviewAction === 'approve' ? 'تأكيد القبول والاعتماد' : 'تأكيد الرفض'}
              </Button>
            )}
          </>
        }
      >
        <div>
          {/* Streamed Image Display */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loadingProofImage ? (
              <div style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>جاري تحميل صورة الإشعار الآمنة...</div>
            ) : proofImageBlobUrl ? (
              <img
                src={proofImageBlobUrl}
                alt="إشعار بنكك"
                style={{ maxWidth: '100%', maxHeight: 380, objectFit: 'contain' }}
              />
            ) : (
              <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>تعذر تحميل ملف الإشعار</div>
            )}
          </div>

          {selectedProof && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-600)', marginBottom: 'var(--space-3)' }}>
              <div>المحوّل: <strong>{selectedProof.sender_name || 'غير محدد'}</strong></div>
              <div>الرقم المرجعي: <span className="font-mono">{selectedProof.reference_number || 'غير محدد'}</span></div>
            </div>
          )}

          {reviewAction === 'reject' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label form-label-required">سبب الرفض (سيظهر للعميل)</label>
              <textarea
                className="form-textarea"
                placeholder="مثال: المبلغ غير مطابق، أو الصورة غير واضحة..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                required
              />
            </div>
          )}

          {reviewAction === 'approve' && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', backgroundColor: 'var(--color-success-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              ✓ بالاعتماد، سيتم تحويل حالة الطلب إلى <strong>مؤكد (confirmed)</strong> وإشعار العميل فوراً.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
