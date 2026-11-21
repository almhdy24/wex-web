import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { formatSdg, formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import ImageViewer from '../../components/admin/ImageViewer';
import Page from '../../components/common/Page';
import styles from './AdminPaymentsPage.module.css';

export default function AdminPaymentsPage() {
  const { success, error: toastError } = useToast();

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [error, setError] = useState(null);

  // Active Order & Proof Details
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentProof, setCurrentProof] = useState(null);
  const [imageBlobUrl, setImageBlobUrl] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Approve Confirmation Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  // Reject Reason Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [customRejectNote, setCustomRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const prevBlobUrlRef = useRef(null);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
    };
  }, []);

  // Fetch pending review orders queue
  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    setError(null);
    try {
      const res = await adminApi.getOrders({ status: 'payment_review', per_page: 50 });
      const orders = res.data || [];
      // Sort oldest first
      orders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setQueue(orders);
      setCurrentIndex(0);
    } catch (err) {
      setError(err.message || 'الاتصال ضعيف. حاول مجدداً.');
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    return () => {
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
        prevBlobUrlRef.current = null;
      }
    };
  }, [fetchQueue]);

  // Load details and receipt image for the active item
  const activeQueueItem = queue[currentIndex];

  useEffect(() => {
    if (!activeQueueItem) {
      setCurrentOrder(null);
      setCurrentProof(null);
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
        prevBlobUrlRef.current = null;
      }
      setImageBlobUrl(null);
      return;
    }

    let isSubscribed = true;
    setLoadingProof(true);

    const loadActiveProof = async () => {
      try {
        const orderRes = await adminApi.getOrderDetail(activeQueueItem.order_number);
        if (!isSubscribed) return;

        const orderData = orderRes.data;
        setCurrentOrder(orderData);

        const proofs = orderData?.proofs || [];
        const pendingProof = proofs.find((p) => p.status === 'pending') || proofs[0];

        if (pendingProof) {
          setCurrentProof(pendingProof);
          const blob = await adminApi.getPaymentProofImage(orderData.order_number, pendingProof.id);
          if (!isSubscribed) return;

          if (prevBlobUrlRef.current) {
            URL.revokeObjectURL(prevBlobUrlRef.current);
          }
          const url = URL.createObjectURL(blob);
          prevBlobUrlRef.current = url;
          setImageBlobUrl(url);
        } else {
          setCurrentProof(null);
          setImageBlobUrl(null);
        }
      } catch {
        if (isSubscribed) {
          toastError('تعذر تحميل ملف الإشعار للطلب');
        }
      } finally {
        if (isSubscribed) setLoadingProof(false);
      }
    };

    loadActiveProof();

    return () => {
      isSubscribed = false;
    };
  }, [activeQueueItem, toastError]);

  // Handle decisions & queue advance
  const advanceQueue = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      // Re-fetch queue to see if more arrived, or show empty state
      fetchQueue();
    }
  }, [currentIndex, queue.length, fetchQueue]);

  const handleApproveConfirm = async () => {
    if (!currentOrder || !currentProof) return;
    setApproving(true);
    try {
      await adminApi.reviewPaymentProof(currentOrder.order_number, currentProof.id, {
        action: 'approve',
      });
      success(`تم اعتماد تحويل الطلب #${currentOrder.order_number} بنجاح`);
      setApproveModalOpen(false);
      // Remove approved order from local queue
      setQueue((prev) => prev.filter((o) => o.order_number !== currentOrder.order_number));
      advanceQueue();
    } catch (err) {
      toastError(err.message || 'فشل اعتماد الإشعار');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!currentOrder || !currentProof) return;

    const finalReason = [selectedRejectReason, customRejectNote.trim()].filter(Boolean).join(' - ');
    if (!finalReason) {
      toastError(adminAr.payments.rejectReasonRequired);
      return;
    }

    setRejecting(true);
    try {
      await adminApi.reviewPaymentProof(currentOrder.order_number, currentProof.id, {
        action: 'reject',
        note: finalReason,
      });
      success(`تم رفض إشعار الطلب #${currentOrder.order_number} وإبلاغ العميل`);
      setRejectModalOpen(false);
      setSelectedRejectReason('');
      setCustomRejectNote('');
      // Remove rejected order from local queue
      setQueue((prev) => prev.filter((o) => o.order_number !== currentOrder.order_number));
      advanceQueue();
    } catch (err) {
      toastError(err.message || 'فشل رفض الإشعار');
    } finally {
      setRejecting(false);
    }
  };

  // Keyboard Shortcuts (A: Approve, R: Reject, J: Next, K: Prev)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e) => {
      // Ignore when typing inside input / textarea or modal is open
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        approveModalOpen ||
        rejectModalOpen
      ) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (currentProof) setApproveModalOpen(true);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (currentProof) setRejectModalOpen(true);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (currentIndex < queue.length - 1) setCurrentIndex((i) => i + 1);
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [approveModalOpen, rejectModalOpen, currentProof, currentIndex, queue.length]);

  const handleCopyAmount = () => {
    if (!currentOrder) return;
    navigator.clipboard.writeText(String(currentOrder.total_sdg));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  if (loadingQueue) {
    return (
      <Page className={styles.container}>
        <Skeleton height="36px" width="300px" />
        <div style={{ height: 16 }} />
        <Skeleton height="480px" borderRadius="var(--radius-lg)" />
      </Page>
    );
  }

  if (error) {
    return (
      <Page className={styles.container}>
        <ErrorState message={error} onRetry={fetchQueue} />
      </Page>
    );
  }

  if (queue.length === 0) {
    return (
      <Page className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleInfo}>
            <h1 className={styles.title}>{adminAr.payments.title}</h1>
            <p className={styles.subtitle}>{adminAr.payments.subtitle}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchQueue}>
            <RefreshCw size={14} />
            <span>{adminAr.common.refresh}</span>
          </Button>
        </header>

        <div className={styles.titleDivider} aria-hidden="true" />

        <div className={styles.emptyCard}>
          <EmptyState
            title={adminAr.payments.emptyTitle}
            description={adminAr.payments.emptyDesc}
            action={
              <Button variant="outline" size="sm" onClick={fetchQueue}>
                <RefreshCw size={14} />
                <span>تحديث الطابور</span>
              </Button>
            }
          />
        </div>
      </Page>
    );
  }

  // Calculate remaining lock time
  const lockExpiresAt = currentOrder?.price_locked_until;

  return (
    <Page className={styles.container}>
      {/* Top Header & Queue Navigation */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>{adminAr.payments.title}</h1>
          <div className={styles.queueCounter}>
            <span>{adminAr.payments.queueProgress.replace('{current}', currentIndex + 1).replace('{total}', queue.length)}</span>
            {lockExpiresAt && (
              <span className={styles.lockBadge}>
                <Clock size={12} />
                <span>ينتهي الحجز: {formatRelativeTime(lockExpiresAt)}</span>
              </span>
            )}
          </div>
        </div>

        <div className={styles.queueControls}>
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex <= 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
            aria-label="الإشعار السابق"
          >
            <ChevronRight size={16} />
            <span>السابق</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex >= queue.length - 1}
            onClick={() => setCurrentIndex((i) => i + 1)}
            aria-label="الإشعار التالي"
          >
            <span>التالي</span>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={fetchQueue} title="تحديث الطابور">
            <RefreshCw size={14} />
          </Button>
        </div>
      </header>

      {/* Brand Divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Side-by-Side Review Grid */}
      <div className={styles.reviewGrid}>
        {/* Left Column: Interactive Receipt Image Viewer */}
        <div className={styles.imageColumn}>
          {loadingProof ? (
            <div className={styles.imageSkeletonBox}>
              <Skeleton height="100%" width="100%" borderRadius="var(--radius-lg)" />
            </div>
          ) : imageBlobUrl ? (
            <ImageViewer src={imageBlobUrl} alt={`إشعار الطلب #${currentOrder?.order_number}`} />
          ) : (
            <div className={styles.noImageBox}>
              <AlertTriangle size={32} className={styles.noImageIcon} />
              <span>لم يتم العثور على صورة إشعار مرفوعة</span>
            </div>
          )}
        </div>

        {/* Right Column: Required Verification Details ("المطلوب") */}
        <div className={styles.detailsColumn}>
          {currentOrder && (
            <div className={styles.verificationCard}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.orderNumberLabel}>طلب رقم</span>
                  <h2 className={styles.orderNumber}>#{currentOrder.order_number}</h2>
                </div>
                <div className={styles.expectedAmountBox}>
                  <span className={styles.amountLabel}>{adminAr.payments.expectedAmount}</span>
                  <div className={styles.amountRow}>
                    <span className={styles.amountValue}>{formatSdg(currentOrder.total_sdg)}</span>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={handleCopyAmount}
                      title={adminAr.payments.copyAmount}
                      aria-label="نسخ المبلغ"
                    >
                      {copiedAmount ? <Check size={16} className={styles.copiedIcon} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Contact */}
              <div className={styles.sectionBlock}>
                <span className={styles.blockTitle}>{adminAr.payments.customerName}</span>
                <div className={styles.customerRow}>
                  <span className={styles.customerName}>{currentOrder.customer_name || 'عميل'}</span>
                  <div className={styles.contactButtons}>
                    {currentOrder.customer_phone && (
                      <>
                        <a
                          href={`tel:${currentOrder.customer_phone}`}
                          className={styles.contactBtn}
                          title={adminAr.payments.callCustomer}
                        >
                          <Phone size={14} />
                          <span>اتصال</span>
                        </a>
                        <a
                          href={`https://wa.me/${currentOrder.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            adminAr.orders.whatsappTemplate
                              .replace('{name}', currentOrder.customer_name || '')
                              .replace('{orderNumber}', currentOrder.order_number)
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.contactBtn} ${styles.whatsappBtn}`}
                          title={adminAr.payments.whatsappCustomer}
                        >
                          <MessageCircle size={14} />
                          <span>واتساب</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Uploaded Proof Bank Details */}
              {currentProof && (
                <div className={styles.sectionBlock}>
                  <span className={styles.blockTitle}>بيانات الإشعار المسجلة</span>
                  <div className={styles.proofGrid}>
                    <div className={styles.proofItem}>
                      <span className={styles.proofItemLabel}>{adminAr.payments.senderName}</span>
                      <span className={styles.proofItemValue}>{currentProof.sender_name || 'غير محدد'}</span>
                    </div>
                    <div className={styles.proofItem}>
                      <span className={styles.proofItemLabel}>{adminAr.payments.transferRef}</span>
                      <span className={styles.proofItemValue}>{currentProof.reference_number || 'غير متوفر'}</span>
                    </div>
                    <div className={styles.proofItem}>
                      <span className={styles.proofItemLabel}>{adminAr.payments.uploadTime}</span>
                      <span className={styles.proofItemValue}>{formatRelativeTime(currentProof.created_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Decision Actions */}
              <div className={styles.desktopActions}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setApproveModalOpen(true)}
                  disabled={!currentProof || approving}
                  className={styles.approveBtn}
                >
                  <ShieldCheck size={18} />
                  <span>{adminAr.payments.approveAction}</span>
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={!currentProof || rejecting}
                  className={styles.rejectBtn}
                >
                  <span>{adminAr.payments.rejectAction}</span>
                </Button>
              </div>

              <div className={styles.keyboardHelpNotice}>
                {adminAr.payments.keyboardHelp}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          Phone Sticky Bottom Actions Bar (< 768px)
          ==================================================================== */}
      <div className={styles.mobileStickyActions}>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setApproveModalOpen(true)}
          disabled={!currentProof || approving}
          className={styles.mobileApproveBtn}
        >
          <ShieldCheck size={18} />
          <span>قبول التحويل</span>
        </Button>
        <Button
          variant="danger"
          size="lg"
          onClick={() => setRejectModalOpen(true)}
          disabled={!currentProof || rejecting}
          className={styles.mobileRejectBtn}
        >
          <span>رفض</span>
        </Button>
      </div>

      {/* ====================================================================
          Approve Confirmation Modal
          ==================================================================== */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title={adminAr.payments.approveConfirmTitle}
      >
        <div className={styles.modalContent}>
          <p className={styles.modalDesc}>{adminAr.payments.approveConfirmDesc}</p>
          <div className={styles.confirmAmountBox}>
            <span>المبلغ المعتمد:</span>
            <strong>{formatSdg(currentOrder?.total_sdg)}</strong>
          </div>
          <div className={styles.modalActions}>
            <Button
              variant="primary"
              size="md"
              onClick={handleApproveConfirm}
              loading={approving}
            >
              {adminAr.payments.confirmApproveBtn}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setApproveModalOpen(false)}
              disabled={approving}
            >
              {adminAr.common.cancel}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====================================================================
          Reject Reason Modal
          ==================================================================== */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={adminAr.payments.rejectReasonTitle}
      >
        <form onSubmit={handleRejectConfirm} className={styles.modalContent}>
          <p className={styles.modalDesc}>{adminAr.payments.rejectReasonDesc}</p>

          {/* Quick Reason Chips */}
          <div className={styles.rejectionChipsList}>
            {adminAr.payments.rejectionChips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`${styles.rejectionChip} ${selectedRejectReason === chip ? styles.activeChip : ''}`}
                onClick={() => setSelectedRejectReason(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          <textarea
            className={styles.rejectTextarea}
            placeholder={adminAr.payments.customNotePlaceholder}
            rows={3}
            value={customRejectNote}
            onChange={(e) => setCustomRejectNote(e.target.value)}
          />

          <div className={styles.modalActions}>
            <Button
              variant="danger"
              size="md"
              type="submit"
              loading={rejecting}
            >
              {adminAr.payments.confirmRejectBtn}
            </Button>
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setRejectModalOpen(false)}
              disabled={rejecting}
            >
              {adminAr.common.cancel}
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
}
