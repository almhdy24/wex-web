import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { formatSdg, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { TableSkeleton } from '../../components/common/Skeleton';

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [proofImageBlobUrl, setProofImageBlobUrl] = useState(null);
  const [loadingProofImage, setLoadingProofImage] = useState(false);

  const fetchPendingPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOrders({ status: 'payment_review', per_page: 50 });
      setOrders(res.data || []);
    } catch (err) {
      setError(err.message || 'فشل تحميل قائمة إشعارات الدفع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const openReviewModal = async (orderItem, action) => {
    setSelectedOrder(orderItem);
    setReviewAction(action);
    setReviewNote('');
    setReviewModalOpen(true);
    setLoadingProofImage(true);
    setProofImageBlobUrl(null);

    // Fetch full order to get latest proof ID
    try {
      const orderRes = await adminApi.getOrderDetail(orderItem.order_number);
      const proofs = orderRes.data?.proofs || [];
      const pendingProof = proofs.find((p) => p.status === 'pending') || proofs[0];

      if (pendingProof) {
        setSelectedProof(pendingProof);
        const blob = await adminApi.getPaymentProofImage(orderItem.order_number, pendingProof.id);
        setProofImageBlobUrl(URL.createObjectURL(blob));
      }
    } catch {
      toastError('تعذر تحميل بيانات الإشعار');
    } finally {
      setLoadingProofImage(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !selectedProof) return;

    if (reviewAction === 'reject' && !reviewNote.trim()) {
      toastError('يرجى كتابة سبب رفض الإشعار');
      return;
    }

    setReviewing(true);
    try {
      await adminApi.reviewPaymentProof(selectedOrder.order_number, selectedProof.id, {
        action: reviewAction,
        note: reviewNote.trim() || undefined,
      });
      success(reviewAction === 'approve' ? 'تم اعتماد التحويل وتأكيد الطلب' : 'تم رفض الإشعار وتحديث الطلب');
      setReviewModalOpen(false);
      fetchPendingPayments();
    } catch (err) {
      toastError(err.message || 'فشل تنفيذ الإجراء');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 4 }}>مراجعة إشعارات الدفع والتحويلات</h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)', margin: 0 }}>
            مطابقة إشعارات تطبيق بنكك واعتماد الطلبات المؤكدة
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchPendingPayments}>
          🔄 تحديث القائمة
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchPendingPayments} />
      ) : loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="لا توجد إشعارات تنتظر المراجعة"
          description="تمت مراجعة جميع إشعارات التحويل البنكي المرفوعة من العملاء بنجاح."
        />
      ) : (
        <div className="card">
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table table-row-hover">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>هاتف التواصل</th>
                  <th>المبلغ المطلوب</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_number}>
                    <td className="en-text" style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                      #{o.order_number}
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.user_name || o.customer_name || 'عميل'}</td>
                    <td className="en-text">{o.contact_phone}</td>
                    <td style={{ fontWeight: 800, color: 'var(--color-royal-blue)' }}>
                      {formatSdg(o.total_sdg)}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                      {formatDate(o.created_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openReviewModal(o, 'approve')}
                        >
                          ✓ مراجعة واعتماد
                        </Button>
                        <Button
                          variant="danger-outline"
                          size="sm"
                          onClick={() => openReviewModal(o, 'reject')}
                        >
                          ✕ رفض
                        </Button>
                        <Link to={`/admin/orders/${o.order_number}`}>
                          <Button variant="ghost" size="sm">
                            التفاصيل
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewAction === 'approve' ? 'اعتماد إشعار التحويل البنكي' : 'رفض إشعار التحويل البنكي'}
        maxWidth="600px"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReviewModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              loading={reviewing}
              disabled={loadingProofImage || !selectedProof}
              onClick={handleReviewSubmit}
            >
              {reviewAction === 'approve' ? 'تأكيد الاعتماد وتحويل الطلب إلى مؤكد' : 'تأكيد الرفض'}
            </Button>
          </>
        }
      >
        <div>
          {/* Order Details Header */}
          {selectedOrder && (
            <div style={{ backgroundColor: 'var(--color-slate-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
              <div>طلب رقم: <strong className="en-text">#{selectedOrder.order_number}</strong></div>
              <div>المبلغ المطلوب: <strong style={{ color: 'var(--color-royal-blue)' }}>{formatSdg(selectedOrder.total_sdg)}</strong></div>
            </div>
          )}

          {/* Proof Image View */}
          <div style={{ textAlign: 'center', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            {loadingProofImage ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>جاري تحميل ملف الإشعار من الخادم...</div>
            ) : proofImageBlobUrl ? (
              <img
                src={proofImageBlobUrl}
                alt="إشعار بنكك"
                style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }}
              />
            ) : (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>تعذر تحميل ملف الإشعار</div>
            )}
          </div>

          {selectedProof && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-600)', marginBottom: 'var(--space-3)' }}>
              <div>صاحب الحساب المحوّل: <strong>{selectedProof.sender_name || 'غير محدد'}</strong></div>
              <div>الرقم المرجعي للإشعار: <span className="font-mono">{selectedProof.reference_number || 'غير محدد'}</span></div>
            </div>
          )}

          {reviewAction === 'reject' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label form-label-required">سبب الرفض (إلزامي للإرسال للعميل)</label>
              <textarea
                className="form-textarea"
                placeholder="اكتب سبب الرفض بوضوح (مثلاً: المبلغ غير مطابق، الرقم المرجعي غير مسجل...)"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                required
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
