import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Camera,
  Image as ImageIcon,
  Upload,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatSdg, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import DarkCard from '../../components/common/DarkCard';
import Page from '../../components/common/Page';
import { deriveOrderUiState, formatCountdownTime } from '../../utils/orderState';
import { getServerTimeOffset } from '../../api/client';
import styles from './OrderDetailPage.module.css';

export default function OrderDetailPage({
  initialOrder = null,
  initialLoading = null,
} = {}) {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: toastError } = useToast();

  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(initialLoading ?? (initialOrder === null));
  const [error, setError] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploadedProofThumbnail, setUploadedProofThumbnail] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [now, setNow] = useState(Date.now());

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const uploadCardRef = useRef(null);

  // Load Order Data
  const loadOrder = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getOrderDetail(orderNumber);
      const data = res.data;
      setOrder(data);
    } catch (err) {
      setError(err.message || 'تعذر تحميل بيانات الطلب');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrder === null) {
      loadOrder(true);
    }
  }, [orderNumber, initialOrder]);

  // Live countdown timer ticking every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to upload card if navigated right after creation
  useEffect(() => {
    if (location.state?.justCreated && uploadCardRef.current) {
      setTimeout(() => {
        uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [location.state?.justCreated]);

  // Copy helper
  const handleCopy = (text, key, msg = 'تم النسخ') => {
    if (!text) return;
    const str = String(text);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(str).then(() => {
        setCopiedKey(key);
        success(msg);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    } else {
      setCopiedKey(key);
      success(msg);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (JPG, PNG)');
      return;
    }

    setUploadError(null);
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit proof
  const handleUploadSubmit = async () => {
    if (!proofFile || uploading) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('proof_image', proofFile);

    try {
      await ordersApi.uploadPaymentProof(orderNumber, formData);
      success('أُرسل الإشعار. بانتظار مراجعة المحل.');
      setUploadedProofThumbnail(proofPreview);
      setProofFile(null);
      setProofPreview(null);
      // Immediately reflect review state in UI
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'payment_review',
              status_label: 'قيد المراجعة',
              payment_proofs: [
                ...(prev.payment_proofs || []),
                { id: Date.now(), status: 'pending', created_at: new Date().toISOString() },
              ],
            }
          : prev
      );
      loadOrder(false);
    } catch (err) {
      const msg = err.message || 'تعذر رفع الإشعار، يرجى المحاولة مرة أخرى';
      setUploadError(msg);
      toastError(msg);
    } finally {
      setUploading(false);
    }
  };

  // Reorder
  const handleReorder = async () => {
    setReordering(true);
    try {
      const res = await ordersApi.reorder(orderNumber);
      const newOrder = res.data;
      success('تم إنشاء طلب جديد');
      navigate(`/orders/${newOrder.order_number || newOrder.id}`, { replace: true });
    } catch (err) {
      toastError(err.message || 'تعذر إعادة الطلب');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <Page className={styles.container}>
        <div className={styles.loadingSkeleton} />
      </Page>
    );
  }

  if (error || !order) {
    return (
      <Page className={styles.container}>
        <div className={styles.errorCard}>
          <p>{error || 'الطلب غير موجود'}</p>
          <Button variant="secondary" onClick={() => navigate('/orders')}>
            العودة للطلبات
          </Button>
        </div>
      </Page>
    );
  }

  const offset = getServerTimeOffset();
  const uiState = deriveOrderUiState(order, now, offset);

  const isPending = uiState.stage === 'pending_payment';
  const isReview = uiState.stage === 'payment_review';
  const isRejected = uiState.stage === 'rejected';
  const isExpired = uiState.stage === 'expired';
  const isConfirmed = uiState.stage === 'confirmed';
  const isCompleted = uiState.stage === 'completed';

  const countdownFormatted = formatCountdownTime(uiState.countdown);
  const totalAmount = order.total_sdg ?? order.total_amount_sdg ?? 0;
  const paymentAccounts = order.payment_accounts || [];

  return (
    <Page className={styles.container}>
      {/* Header with back to orders */}
      <header className={styles.header}>
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className={styles.backBtn}
          aria-label="العودة للطلبات"
        >
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.title}>طلب #{order.order_number}</h1>
          <span className={styles.statusBadge}>{uiState.label}</span>
        </div>
      </header>

      {/* 1. Single Gradient / Dark Card */}
      <DarkCard gradient={true} className={styles.paymentCard}>
        <div className={styles.darkCardInner}>
          <div className={styles.countdownSection}>
            <span className={styles.countdownLabel}>المتبقي لتثبيت السعر</span>
            <div className={styles.countdownClock}>
              <Clock size={18} strokeWidth={1.75} className={styles.clockIcon} aria-hidden="true" />
              <span className={styles.countdownText} dir="ltr">
                {isExpired ? '00:00:00' : countdownFormatted}
              </span>
            </div>
          </div>

          <div className={styles.amountSection}>
            <span className={styles.amountLabel}>المبلغ المطلوب</span>
            <div className={styles.amountValueRow}>
              <span className={styles.amountValue}>{formatSdg(totalAmount)}</span>
              <button
                type="button"
                onClick={() => handleCopy(totalAmount, 'amount', 'تم نسخ المبلغ')}
                className={styles.copyAmountBtn}
                title="نسخ المبلغ"
              >
                {copiedKey === 'amount' ? <Check size={16} /> : <Copy size={16} />}
                <span>نسخ</span>
              </button>
            </div>
          </div>
        </div>
      </DarkCard>

      {/* Expired State Notice */}
      {isExpired && (
        <div className={styles.expiredCard}>
          <AlertCircle size={20} className={styles.warningIcon} aria-hidden="true" />
          <div className={styles.expiredInfo}>
            <p className={styles.expiredTitle}>انتهت مهلة تثبيت السعر.</p>
            <p className={styles.expiredSubtitle}>انقضت فترة حجز هذا الطلب وتغيرت أسعار الأجهزة.</p>
            <Button
              variant="secondary"
              onClick={handleReorder}
              disabled={reordering}
              className={styles.reorderBtn}
            >
              {reordering ? <Loader2 size={16} className={styles.spinner} /> : 'أعد الطلب بالسعر الحالي'}
            </Button>
          </div>
        </div>
      )}

      {/* Rejected State Notice */}
      {isRejected && (
        <div className={styles.rejectedCard}>
          <AlertCircle size={20} className={styles.dangerIcon} aria-hidden="true" />
          <div className={styles.rejectedInfo}>
            <p className={styles.rejectedTitle}>تم رفض الإشعار السابق</p>
            <p className={styles.rejectedReason}>{uiState.message}</p>
            <p className={styles.rejectedActionText}>يرجى إرفاق إشعار بديل أدناه لمراجعة الطلب.</p>
          </div>
        </div>
      )}

      {/* 2. Card "حساب التحويل" */}
      <section className={styles.accountsSection} aria-label="حسابات التحويل">
        <h2 className={styles.sectionTitle}>حساب التحويل</h2>
        <div className={styles.accountsList}>
          {paymentAccounts.length > 0 ? (
            paymentAccounts.map((acc, idx) => (
              <div key={acc.id || idx} className={styles.accountCard}>
                <div className={styles.accountHeader}>
                  <strong className={styles.bankName}>{acc.bank_name}</strong>
                  {acc.account_name && (
                    <span className={styles.accountHolder}>{acc.account_name}</span>
                  )}
                </div>

                <div className={styles.accountNumberRow}>
                  <span className={styles.accountNumber} dir="ltr">
                    {acc.account_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(acc.account_number, `acc-${acc.id || idx}`, 'تم نسخ رقم الحساب')}
                    className={styles.copyBtn}
                    title="نسخ رقم الحساب"
                  >
                    {copiedKey === `acc-${acc.id || idx}` ? <Check size={16} /> : <Copy size={16} />}
                    <span>نسخ</span>
                  </button>
                </div>

                {acc.notes && <p className={styles.accountNotes}>{acc.notes}</p>}
              </div>
            ))
          ) : (
            <div className={styles.accountCard}>
              <div className={styles.accountHeader}>
                <strong className={styles.bankName}>بنك الخرطوم (بنكك)</strong>
              </div>
              <p className={styles.accountNotes}>
                يرجى التواصل مع خدمة العملاء للحصول على حساب التحويل المباشر.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Card Payment Review vs Upload Proof */}
      {isReview ? (
        <section className={styles.uploadCard} aria-label="حالة إشعار الدفع">
          <h2 className={styles.sectionTitle}>إشعار التحويل</h2>
          <div className={styles.proofUploadedStatus}>
            <CheckCircle2 size={24} className={styles.successIcon} aria-hidden="true" />
            <div>
              <p className={styles.proofSuccessText}>
                تم استلام الإشعار. بانتظار مراجعة المحل.
              </p>
              {(uploadedProofThumbnail || uiState.latestProof?.image_url) && (
                <div className={styles.proofThumbnailBox}>
                  <img
                    src={uploadedProofThumbnail || uiState.latestProof.image_url}
                    alt="صورة إشعار التحويل"
                    className={styles.proofThumbImg}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      ) : isConfirmed || isCompleted ? (
        <section className={styles.uploadCard} aria-label="حالة إشعار الدفع">
          <h2 className={styles.sectionTitle}>حالة الدفع</h2>
          <div className={styles.proofUploadedStatus}>
            <CheckCircle2 size={24} className={styles.successIcon} aria-hidden="true" />
            <p className={styles.proofSuccessText}>
              تم تأكيد الدفع بنجاح.
            </p>
          </div>
        </section>
      ) : isPending || isRejected ? (
        <section
          id="upload-proof-card"
          ref={uploadCardRef}
          className={styles.uploadCard}
          aria-label={isRejected ? 'إشعار التحويل البديل' : 'إشعار التحويل'}
        >
          <h2 className={styles.sectionTitle}>
            {isRejected ? 'إشعار التحويل البديل' : 'إشعار التحويل'}
          </h2>

          <div className={styles.uploadBody}>
            <p className={styles.uploadNotice}>
              صورة واضحة تُظهر المبلغ ورقم العملية.
            </p>

            {uploadError && (
              <p className={styles.uploadErrorText} role="alert">
                {uploadError}
              </p>
            )}

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />

            {/* Choose / Capture buttons */}
            {!proofPreview && (
              <div className={styles.pickButtonsRow}>
                <Button
                  variant="secondary"
                  onClick={() => cameraInputRef.current?.click()}
                  className={styles.pickBtn}
                >
                  <Camera size={18} strokeWidth={1.75} aria-hidden="true" />
                  <span>التقاط صورة</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => galleryInputRef.current?.click()}
                  className={styles.pickBtn}
                >
                  <ImageIcon size={18} strokeWidth={1.75} aria-hidden="true" />
                  <span>اختيار من المعرض</span>
                </Button>
              </div>
            )}

            {/* Preview & Submit */}
            {proofPreview && (
              <div className={styles.previewContainer}>
                <img src={proofPreview} alt="صورة إشعار التحويل" className={styles.previewImg} />
                <div className={styles.previewActions}>
                  <Button
                    variant="primary"
                    onClick={handleUploadSubmit}
                    disabled={uploading}
                    className={styles.submitProofBtn}
                  >
                    {uploading ? <Loader2 size={18} className={styles.spinner} /> : 'إرسال الإشعار'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setProofFile(null);
                      setProofPreview(null);
                    }}
                    disabled={uploading}
                    className={styles.cancelPreviewBtn}
                  >
                    تغيير الصورة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 4. Notice line */}
      <div className={styles.noticeLine}>
        <Info size={16} strokeWidth={1.75} className={styles.noticeIcon} aria-hidden="true" />
        <span>بعد المراجعة نُشعرك بتأكيد الدفع.</span>
      </div>

      {/* Timeline */}
      <section className={styles.timelineCard} aria-label="مراحل الطلب">
        <h2 className={styles.timelineTitle}>حالة الطلب</h2>
        <div className={styles.timeline}>
          <div className={`${styles.timelineStep} ${styles.stepCompleted}`}>
            <span className={styles.stepDot} />
            <div className={styles.stepInfo}>
              <span className={styles.stepName}>إنشاء الطلب</span>
              <span className={styles.stepDate}>{formatDate(order.created_at)}</span>
            </div>
          </div>

          <div className={`${styles.timelineStep} ${isReview || isConfirmed || isCompleted ? styles.stepCompleted : styles.stepPending}`}>
            <span className={styles.stepDot} />
            <div className={styles.stepInfo}>
              <span className={styles.stepName}>إشعار التحويل</span>
              <span className={styles.stepDate}>
                {isConfirmed || isCompleted
                  ? 'تم التحقق من الدفع'
                  : isReview
                  ? 'بانتظار مراجعة المحل'
                  : 'بانتظار التحويل'}
              </span>
            </div>
          </div>

          <div className={`${styles.timelineStep} ${isConfirmed || isCompleted ? styles.stepCompleted : styles.stepPending}`}>
            <span className={styles.stepDot} />
            <div className={styles.stepInfo}>
              <span className={styles.stepName}>
                {order.order_type === 'delivery' ? 'التوصيل' : 'الاستلام'}
              </span>
              <span className={styles.stepDate}>
                {isCompleted
                  ? 'تم الاستلام'
                  : isConfirmed
                  ? 'جاهز للاستلام أو التوصيل'
                  : 'في الانتظار'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Button (only while order needs upload) */}
      {(isPending || isRejected) && !isExpired && (
        <div className={styles.stickyBar}>
          <Button
            variant="primary"
            onClick={() => {
              uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={styles.stickyUploadBtn}
          >
            <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>{isRejected ? 'ارفع إشعارًا جديدًا' : 'ارفع إشعار التحويل'}</span>
          </Button>
        </div>
      )}
    </Page>
  );
}
