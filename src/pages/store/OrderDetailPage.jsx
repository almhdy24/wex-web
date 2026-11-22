import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Copy,
  Check,
  Camera,
  Image as ImageIcon,
  Upload,
  Clock,
  AlertCircle,
  Loader2,
  ZoomIn,
} from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import AppBar from '../../components/common/AppBar';
import BrandRibbons from '../../components/common/BrandRibbons';
import Button from '../../components/common/Button';
import Page from '../../components/common/Page';
import Modal from '../../components/common/Modal';
import Price from '../../components/common/Price';
import ErrorState from '../../components/common/ErrorState';
import StickyBar from '../../components/common/StickyBar';
import NoticeLine from '../../components/common/NoticeLine';
import Skeleton from '../../components/common/Skeleton';
import { triggerHaptic } from '../../utils/haptics';
import { deriveOrderUiState, formatCountdownTime } from '../../utils/orderState';
import { getServerTimeOffset } from '../../api/client';
import styles from './OrderDetailPage.module.css';

/**
 * Authenticated Payment Proof Viewer
 * Fetches private receipt image blob via authenticated apiClient,
 * manages object URL lifecycle and memory cleanup, and supports full-size zoom.
 */
function PaymentProofViewer({ orderNumber, proof, localPreview, onOpenFull }) {
  const [blobUrl, setBlobUrl] = useState(localPreview || null);
  const [loading, setLoading] = useState(!localPreview && Boolean(proof?.id));
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (localPreview) {
      setBlobUrl(localPreview);
      setLoading(false);
      setError(null);
      return;
    }

    if (!proof?.id || !orderNumber) {
      setLoading(false);
      return;
    }

    let active = true;
    let createdUrl = null;
    setLoading(true);
    setError(null);

    const req = ordersApi?.getPaymentProofImage?.(orderNumber, proof.id);
    if (!req || typeof req.then !== 'function') {
      setLoading(false);
      return;
    }

    req
      .then((blob) => {
        if (!active) return;
        if (blob instanceof Blob) {
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        } else {
          setError('صيغة الصورة غير مدعومة');
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'تعذر تحميل صورة الإشعار');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [orderNumber, proof?.id, localPreview, retryCount]);

  if (loading) {
    return (
      <div className={styles.proofLoadingBox}>
        <Loader2 size={18} className={styles.spinner} />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.proofErrorBox}>
        <AlertCircle size={16} />
        <span>{error}</span>
        <button
          type="button"
          className={styles.retryBtn}
          onClick={() => setRetryCount((c) => c + 1)}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!blobUrl) return null;

  return (
    <div
      className={styles.proofThumbnailBox}
      onClick={() => onOpenFull(blobUrl)}
      role="button"
      tabIndex={0}
      aria-label="عرض إشعار التحويل بالحجم الكامل"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenFull(blobUrl);
      }}
    >
      <img
        src={blobUrl}
        alt="صورة إشعار التحويل"
        className={styles.proofThumbImg}
      />
      <div className={styles.proofThumbOverlay}>
        <ZoomIn size={16} />
        <span>تكبير</span>
      </div>
    </div>
  );
}

/**
 * Isolated Countdown Timer to prevent full page re-renders every 1s
 */
function OrderCountdown({ lockExpiresAt, secondsRemaining, isExpired, onExpire }) {
  const [remaining, setRemaining] = useState(() => {
    if (isExpired) return 0;
    const offset = getServerTimeOffset();
    const expiresAt = lockExpiresAt ? new Date(lockExpiresAt).getTime() : 0;
    if (expiresAt > 0) {
      return Math.max(0, Math.floor((expiresAt - (Date.now() + offset)) / 1000));
    }
    return typeof secondsRemaining === 'number' ? Math.max(0, Math.floor(secondsRemaining)) : 0;
  });

  useEffect(() => {
    if (isExpired) {
      setRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const offset = getServerTimeOffset();
      const expiresAt = lockExpiresAt ? new Date(lockExpiresAt).getTime() : 0;
      let nextRemaining = 0;
      if (expiresAt > 0) {
        nextRemaining = Math.max(0, Math.floor((expiresAt - (Date.now() + offset)) / 1000));
      } else if (typeof secondsRemaining === 'number') {
        nextRemaining = Math.max(0, remaining - 1);
      }

      setRemaining(nextRemaining);

      if (nextRemaining <= 0) {
        clearInterval(interval);
        if (typeof onExpire === 'function') {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt, secondsRemaining, isExpired, onExpire, remaining]);

  if (isExpired || remaining <= 0) {
    return <span className={styles.countdownText} dir="ltr">00:00:00</span>;
  }

  return (
    <span className={styles.countdownText} dir="ltr">
      {formatCountdownTime(remaining)}
    </span>
  );
}

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
  const [fullPreviewUrl, setFullPreviewUrl] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [reordering, setReordering] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const uploadCardRef = useRef(null);

  const totalAmount = order?.total_sdg ?? order?.total_amount_sdg ?? 0;

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

  // Poll every 30s while in payment_review (paused on hidden tab)
  useEffect(() => {
    const isUnderReview = order?.payment?.state === 'under_review' || order?.status === 'payment_review';
    if (!isUnderReview) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadOrder(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [order?.payment?.state, order?.status, orderNumber]);

  // Auto-scroll to upload card if navigated right after creation
  useEffect(() => {
    if (location.state?.justCreated && uploadCardRef.current) {
      setTimeout(() => {
        uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [location.state?.justCreated]);

  // Copy helper with robust fallback
  const handleCopy = async (text, key, msg = 'تم النسخ') => {
    if (!text) return;
    triggerHaptic(10);
    const str = String(text);

    let succeeded = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(str);
        succeeded = true;
      } catch {
        succeeded = false;
      }
    }

    if (!succeeded) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = str;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        succeeded = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        succeeded = false;
      }
    }

    if (succeeded) {
      setCopiedKey(key);
      success(msg);
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      toastError('تعذر نسخ النص تلقائياً');
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
      const res = await ordersApi.uploadPaymentProof(orderNumber, formData);
      success('أُرسل الإشعار. بانتظار مراجعة المحل.');
      setUploadedProofThumbnail(proofPreview);
      setProofFile(null);
      setProofPreview(null);
      if (res?.data) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: res.data.order_status || 'payment_review',
                payment: res.data.payment || prev.payment,
                proofs: res.data.proof ? [...(prev.proofs || []), res.data.proof] : prev.proofs,
                payment_proofs: res.data.proof ? [...(prev.payment_proofs || []), res.data.proof] : prev.payment_proofs,
              }
            : prev
        );
      }
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
      <div className={styles.pageWrapper}>
        <AppBar
          tone="navy"
          overlap={36}
          title="تفاصيل الطلب"
          showBack={true}
          backTo="/orders"
        />
        <Page className={styles.container}>
          <Skeleton height="200px" borderRadius="var(--radius-panel)" />
        </Page>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.pageWrapper}>
        <AppBar
          tone="navy"
          overlap={36}
          title="تفاصيل الطلب"
          showBack={true}
          backTo="/orders"
        />
        <Page className={styles.container}>
          <ErrorState
            message={error || 'الطلب غير موجود'}
            onRetry={() => loadOrder(true)}
          />
        </Page>
      </div>
    );
  }

  const offset = getServerTimeOffset();
  const uiState = deriveOrderUiState(order, Date.now(), offset);

  const isPending = uiState.stage === 'pending_payment';
  const isReview = uiState.stage === 'payment_review';
  const isRejected = uiState.stage === 'rejected';
  const isExpired = uiState.stage === 'expired';
  const isConfirmed = uiState.stage === 'confirmed';
  const isCompleted = uiState.stage === 'completed';
  const isCancelled = order.status === 'cancelled';
  const paymentAccounts = order.payment_accounts || [];

  return (
    <div className={styles.pageWrapper}>
      {/* AppBar tone="navy", header-bottom: 36px, order number in title, subtitle, status chip on end side */}
      <AppBar
        tone="navy"
        overlap={36}
        title={`طلب #${order.order_number}`}
        subtitle={formatDate(order.created_at)}
        showBack={true}
        backTo="/orders"
        showCart={false}
        customAction={
          <span className={styles.headerStatusChip}>{uiState.label}</span>
        }
      />

      <Page className={styles.container}>
        {/* 1. Price-Lock Dark Card */}
        <div className={styles.priceLockCard}>
          <BrandRibbons variant="panel" />

          <div className={styles.darkCardInner}>
            <div className={styles.countdownSection}>
              <span className={styles.countdownLabel}>
                السعر مثبت لمدة
                <span className={styles.srOnly}>المتبقي لتثبيت السعر</span>
              </span>
              <div className={styles.countdownClock}>
                <Clock size={18} strokeWidth={1.75} className={styles.clockIcon} aria-hidden="true" />
                <OrderCountdown
                  lockExpiresAt={order.lock_expires_at}
                  secondsRemaining={order.seconds_remaining}
                  isExpired={isExpired}
                  onExpire={() => loadOrder(false)}
                />
              </div>
            </div>

            <div className={styles.darkCardDivider} />

            <div className={styles.amountSection}>
              <div className={styles.amountTextCol}>
                <span className={styles.amountLabel}>المبلغ المطلوب</span>
                <div className={styles.amountValueRow}>
                  <Price value={totalAmount} size="hero" tone="onDark" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(totalAmount, 'amount', 'تم نسخ المبلغ')}
                className={styles.copyAmountBtn}
                title="نسخ المبلغ"
              >
                {copiedKey === 'amount' ? <Check size={18} /> : <Copy size={18} />}
                <span>نسخ</span>
              </button>
            </div>
          </div>
        </div>

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
        <section
          className={`${styles.accountsSection} ${(isExpired || isCancelled) ? styles.accountsSectionMuted : ''}`}
          aria-label="حسابات التحويل"
        >
          <h2 className={styles.sectionTitle}>حساب التحويل</h2>
          {(isExpired || isCancelled) && (
            <p className={styles.accountsNoticeMuted}>
              تم إيقاف التحويل البنكي لهذا الطلب.
            </p>
          )}
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

        {/* 3. Card Payment Review vs Upload Proof (Receipt Card) */}
        {isReview ? (
          <section className={styles.receiptCard} aria-label="حالة إشعار الدفع">
            <h2 className={styles.sectionTitle}>إشعار التحويل</h2>
            <div className={styles.proofUploadedStatus}>
              <span className={styles.successPill}>
                تم استلام الإشعار. بانتظار مراجعة المحل.
              </span>
              <p className={styles.receiptSecondaryText}>
                جاري مراجعة إشعار التحويل من قبل إدارة المتجر.
              </p>
              {(uploadedProofThumbnail || uiState.latestProof) && (
                <PaymentProofViewer
                  orderNumber={orderNumber}
                  proof={uiState.latestProof}
                  localPreview={uploadedProofThumbnail}
                  onOpenFull={(url) => setFullPreviewUrl(url)}
                />
              )}
            </div>
          </section>
        ) : isConfirmed || isCompleted ? (
          <section className={styles.receiptCard} aria-label="حالة إشعار الدفع">
            <h2 className={styles.sectionTitle}>حالة الدفع</h2>
            <div className={styles.proofUploadedStatus}>
              <span className={styles.successPill}>
                تم تأكيد الدفع بنجاح.
              </span>
              <p className={styles.receiptSecondaryText}>
                تم استلام المبلغ وتأكيد الطلب.
              </p>
              {(uploadedProofThumbnail || uiState.latestProof) && (
                <PaymentProofViewer
                  orderNumber={orderNumber}
                  proof={uiState.latestProof}
                  localPreview={uploadedProofThumbnail}
                  onOpenFull={(url) => setFullPreviewUrl(url)}
                />
              )}
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
        <NoticeLine variant="secondary" className={styles.noticeLine}>
          بعد المراجعة نُشعرك بتأكيد الدفع.
        </NoticeLine>

        {/* Timeline */}
        <section className={styles.timelineCard} aria-label="مراحل الطلب">
          <h2 className={styles.sectionTitle}>حالة الطلب</h2>
          <div className={styles.timeline}>
            {/* Step 1: Done */}
            <div className={styles.timelineStep}>
              <div className={styles.stepDoneCircle}>
                <Check size={18} strokeWidth={2.6} aria-hidden="true" />
              </div>
              <div className={styles.stepInfo}>
                <span className={styles.stepTitle}>إنشاء الطلب</span>
                <span className={styles.stepNote}>{formatDate(order.created_at)}</span>
              </div>
            </div>
            <div className={styles.stepConnector} />

            {/* Step 2: In review / pending */}
            <div className={styles.timelineStep}>
              <div
                className={
                  isConfirmed || isCompleted
                    ? styles.stepDoneCircle
                    : isReview
                    ? styles.stepCurrentCircle
                    : styles.stepFutureCircle
                }
              >
                {(isConfirmed || isCompleted) && (
                  <Check size={18} strokeWidth={2.6} aria-hidden="true" />
                )}
              </div>
              <div className={styles.stepInfo}>
                <span className={styles.stepTitle}>إشعار التحويل</span>
                <span className={styles.stepNote}>
                  {isConfirmed || isCompleted
                    ? 'تم التحقق من الدفع'
                    : isReview
                    ? 'بانتظار مراجعة المحل'
                    : 'بانتظار التحويل'}
                </span>
              </div>
            </div>
            <div className={styles.stepConnector} />

            {/* Step 3: Fulfillment */}
            <div className={styles.timelineStep}>
              <div
                className={
                  isCompleted
                    ? styles.stepDoneCircle
                    : isConfirmed
                    ? styles.stepCurrentCircle
                    : styles.stepFutureCircle
                }
              >
                {isCompleted && (
                  <Check size={18} strokeWidth={2.6} aria-hidden="true" />
                )}
              </div>
              <div className={styles.stepInfo}>
                <span className={styles.stepTitle}>
                  {order.order_type === 'delivery' ? 'التوصيل' : 'الاستلام'}
                </span>
                <span className={styles.stepNote}>
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
          <StickyBar className={styles.stickyBar}>
            <button
              type="button"
              onClick={() => {
                uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={styles.stickyUploadBtn}
            >
              <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>{isRejected ? 'ارفع إشعارًا جديدًا' : 'ارفع إشعار التحويل'}</span>
            </button>
          </StickyBar>
        )}

        {/* Full-size Proof Preview Modal */}
        <Modal
          isOpen={Boolean(fullPreviewUrl)}
          onClose={() => setFullPreviewUrl(null)}
          variant="image"
          ariaLabel="عرض صورة الإشعار"
        >
          {fullPreviewUrl && (
            <img
              src={fullPreviewUrl}
              alt="صورة إشعار التحويل كاملة"
              className={styles.modalFullImg}
            />
          )}
        </Modal>
      </Page>
    </div>
  );
}
