import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, RefreshCw, FileText } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatSdg, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { TableSkeleton } from '../../components/common/Skeleton';
import styles from './AdminPaymentsPage.module.css';

const CANNED_REJECTION_NOTES = [
  'الإشعار غير واضح',
  'المبلغ لا يطابق المطلوب',
  'رقم الإشعار غير صحيح',
];

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
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
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
      toastError('تعذر تحميل ملف الإشعار');
    } finally {
      setLoadingProofImage(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOrder || !selectedProof) return;

    if (reviewAction === 'reject' && !reviewNote.trim()) {
      toastError('يرجى تحديد سبب الرفض');
      return;
    }

    setReviewing(true);
    try {
      await adminApi.reviewPaymentProof(selectedOrder.order_number, selectedProof.id, {
        action: reviewAction,
        note: reviewNote.trim() || undefined,
      });
      success(reviewAction === 'approve' ? 'تم اعتماد التحويل وتأكيد الطلب' : 'تم رفض الإشعار');
      setReviewModalOpen(false);
      fetchPendingPayments();
    } catch (err) {
      toastError(err.message || 'فشل تنفيذ الإجراء. حاول تاني.');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.pageTitle}>مراجعة إشعارات الدفع والتحويلات</h1>
          <p className={styles.pageSubtitle}>
            مطابقة إشعارات تطبيق بنكك واعتماد الطلبات
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchPendingPayments}>
          <RefreshCw size={14} />
          <span>تحديث القائمة</span>
        </Button>
      </header>

      {/* Brand Graphic: thin divider under admin page title */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {error ? (
        <ErrorState message={error} onRetry={fetchPendingPayments} />
      ) : loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="لا توجد إشعارات تنتظر المراجعة"
          description="تمت مراجعة جميع إشعارات التحويل البنكي المرفوعة من العملاء."
        />
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
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
                    <td className={styles.orderNumber}>#{o.order_number}</td>
                    <td>{o.user_name || o.customer_name || 'عميل'}</td>
                    <td dir="ltr">{o.contact_phone}</td>
                    <td className={styles.totalPrice}>{formatSdg(o.total_sdg)}</td>
                    <td className={styles.dateText}>{formatDate(o.created_at)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openReviewModal(o, 'approve')}
                        >
                          <Check size={14} />
                          <span>اعتماد</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openReviewModal(o, 'reject')}
                        >
                          <X size={14} />
                          <span>رفض</span>
                        </Button>
                        <Link to={`/admin/orders/${o.order_number}`}>
                          <Button variant="ghost" size="sm">
                            <FileText size={14} />
                            <span>التفاصيل</span>
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

      {/* Split-View Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewAction === 'approve' ? 'اعتماد إشعار التحويل البنكي' : 'رفض إشعار التحويل البنكي'}
        maxWidth="800px"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReviewModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              loading={reviewing}
              disabled={loadingProofImage || !selectedProof || reviewing}
              onClick={handleReviewSubmit}
            >
              {reviewAction === 'approve' ? 'تأكيد الاعتماد' : 'تأكيد الرفض'}
            </Button>
          </>
        }
      >
        <div className={styles.splitView}>
          {/* Left / First Pane: Receipt Image Preview */}
          <div className={styles.imagePreviewPane}>
            {loadingProofImage ? (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                جاري تحميل ملف الإشعار...
              </span>
            ) : proofImageBlobUrl ? (
              <img
                src={proofImageBlobUrl}
                alt="إشعار التحويل"
                className={styles.receiptImg}
              />
            ) : (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
                تعذر تحميل ملف الإشعار
              </span>
            )}
          </div>

          {/* Right / Second Pane: Order Details & Actions */}
          <div className={styles.detailsPane}>
            {selectedOrder && (
              <div className={styles.summaryBox}>
                <div>
                  طلب رقم: <strong>#{selectedOrder.order_number}</strong>
                </div>
                <div>
                  المبلغ المطلوب: <strong>{formatSdg(selectedOrder.total_sdg)}</strong>
                </div>
                <div>
                  العميل: <strong>{selectedOrder.user_name || selectedOrder.customer_name || 'عميل'}</strong>
                </div>
                <div>
                  هاتف التواصل: <span dir="ltr">{selectedOrder.contact_phone}</span>
                </div>
              </div>
            )}

            {selectedProof && (
              <div className={styles.summaryBox}>
                <div>
                  صاحب الحساب المحوّل: <strong>{selectedProof.sender_name || 'غير محدد'}</strong>
                </div>
                <div>
                  الرقم المرجعي للإشعار: <strong dir="ltr">{selectedProof.reference_number || 'غير محدد'}</strong>
                </div>
              </div>
            )}

            {/* Toggle Action */}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant={reviewAction === 'approve' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setReviewAction('approve')}
              >
                اعتماد
              </Button>
              <Button
                variant={reviewAction === 'reject' ? 'danger' : 'outline'}
                size="sm"
                onClick={() => setReviewAction('reject')}
              >
                رفض
              </Button>
            </div>

            {reviewAction === 'reject' && (
              <div className={styles.cannedNotesSection}>
                <label className={styles.cannedNotesLabel} htmlFor="review_note_input">
                  سبب الرفض (إلزامي):
                </label>

                {/* Canned note quick chips */}
                <div className={styles.cannedChips}>
                  {CANNED_REJECTION_NOTES.map((note) => (
                    <button
                      key={note}
                      type="button"
                      className={styles.cannedChip}
                      onClick={() => setReviewNote(note)}
                    >
                      {note}
                    </button>
                  ))}
                </div>

                <textarea
                  id="review_note_input"
                  className={styles.textarea}
                  placeholder="اكتب سبب الرفض بالتفصيل..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
