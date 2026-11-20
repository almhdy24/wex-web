import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Check, MessageCircle, RefreshCw, Upload, CheckCircle2, Clock } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatSdg, formatDate, getOrderStatusInfo } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import { compressProofImage } from '../../utils/imageCompressor';
import PriceNotice from '../../components/common/PriceNotice';
import styles from './OrderDetailPage.module.css';

function formatExpiryTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
}

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Lock Countdown State
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef(null);

  // Proof Upload State
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Load Order Data
  const loadOrder = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getOrderDetail(orderNumber);
      const data = res.data;
      setOrder(data);
      setSecondsRemaining(data.seconds_remaining || 0);
    } catch (err) {
      setError(err.message || 'تعذر تحميل بيانات الطلب');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder(true);
  }, [orderNumber]);

  // Handle Live Countdown Timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          loadOrder(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsRemaining]);

  // Handle Proof File Selection with instant client-side compression
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await compressProofImage(file);
      setProofFile(processed);

      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result);
      reader.readAsDataURL(processed);
    } catch {
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Submit Payment Proof
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      toastError('يرجى اختيار صورة إشعار التحويل');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('proof_image', proofFile);
    if (senderName.trim()) formData.append('sender_name', senderName.trim());
    if (referenceNumber.trim()) formData.append('reference_number', referenceNumber.trim());

    try {
      await ordersApi.uploadPaymentProof(orderNumber, formData);
      success('تم رفع إشعار التحويل بنجاح، جاري مراجعته وتأكيد الطلب');
      setProofFile(null);
      setProofPreview(null);
      setSenderName('');
      setReferenceNumber('');
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل رفع الإشعار، حاول مرة أخرى');
    } finally {
      setUploading(false);
    }
  };

  // Copy Account Number
  const handleCopyAccount = (accountNo) => {
    navigator.clipboard?.writeText(accountNo).then(() => {
      setCopiedAccount(true);
      success('تم نسخ رقم الحساب');
      setTimeout(() => setCopiedAccount(false), 2000);
    });
  };

  // Reorder expired
  const handleReorder = async () => {
    setReordering(true);
    try {
      const res = await ordersApi.reorder(orderNumber);
      const newOrder = res.data;
      success(`تم إنشاء طلب جديد برقم #${newOrder.order_number}`);
      navigate(`/orders/${newOrder.order_number}`, { replace: true });
    } catch (err) {
      toastError(err.message || 'تعذر إعادة الطلب بالسعر الحالي');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="180px" borderRadius="var(--radius-xl)" />
        <Skeleton height="120px" borderRadius="var(--radius-lg)" />
        <Skeleton height="200px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.container}>
        <ErrorState
          title="تعذر العثور على الطلب"
          message={error || 'رقم الطلب غير صحيح.'}
          onRetry={() => navigate('/orders')}
        />
      </div>
    );
  }

  const isPending = order.status === 'pending_payment';
  const isExpired = order.status === 'expired' && !order.payment_proof;
  const isUrgent = isPending && secondsRemaining > 0 && secondsRemaining < 3600;
  const hasProof = !!order.payment_proof || order.status === 'payment_uploaded' || order.status === 'under_review';
  const bankDetails = order.bank_details || {
    bank_name: 'بنك الخرطوم (بنكك)',
    account_number: '2849102',
    account_name: 'متجر ويكس تكنولوجي',
    branch_name: 'فرع أم درمان - الشهداء',
  };

  // Time calculation
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const padZero = (n) => String(n).padStart(2, '0');

  // Tracking Timeline Steps
  const trackingSteps = [
    {
      title: 'تم تسجيل الطلب وتثبيت السعر',
      desc: 'بدأ وقت تثبيت السعر وحجز الجهاز.',
      time: formatDate(order.created_at),
    },
    {
      title: 'رفع إشعار التحويل',
      desc: hasProof ? 'تم استلام صورة الإشعار بنجاح.' : 'بانتظار رفع صورة إشعار بنكك.',
      time: hasProof ? 'تم الرفع' : 'معلق',
    },
    {
      title: 'مراجعة التحويل',
      desc: 'مطابقة العملية في حساب بنكك وتأكيد السداد.',
      time: order.status === 'confirmed' || order.status === 'completed' ? 'تم التأكيد' : 'قيد المراجعة',
    },
    {
      title: order.order_type === 'pickup' ? 'تجهيز الجهاز للاستلام في المحل' : 'تجهيز الجهاز للتوصيل',
      desc: 'فحص الجهاز وشحن البطارية والتغليف.',
      time: order.status === 'completed' ? 'مكتمل' : 'قيد التجهيز',
    },
    {
      title: order.order_type === 'pickup' ? 'استلام العميل من المحل' : 'تسليم الطلب مع المندوب',
      desc: 'معاينة الجهاز واستلامه بنجاح.',
      time: order.status === 'completed' ? 'تم التسليم' : 'الخطوة الأخيرة',
    },
  ];

  let currentStepIdx = 0;
  if (isPending && !hasProof) currentStepIdx = 1;
  else if (hasProof && (order.status === 'pending_payment' || order.status === 'payment_uploaded' || order.status === 'under_review')) currentStepIdx = 2;
  else if (order.status === 'confirmed' || order.status === 'processing') currentStepIdx = 3;
  else if (order.status === 'completed') currentStepIdx = 4;
  else if (isExpired) currentStepIdx = 0;

  const statusInfo = getOrderStatusInfo(order.status);

  return (
    <div className={styles.container}>
      {/* 1. Hero Countdown & Price Lock Banner (Mockup Screen 6 Parity) */}
      <div
        className={`${styles.priceLockBanner} ${
          isExpired ? styles.bannerExpired : isUrgent ? styles.bannerUrgent : ''
        }`}
      >
        <div className={styles.lockHeader}>
          <div className={styles.lockStatusBadge}>
            <span>{isExpired ? 'انتهت المهلة' : isPending ? 'السعر مثبت' : statusInfo.label}</span>
          </div>
          <span className={styles.orderNumberLabel}>طلب #{order.order_number}</span>
        </div>

        <div className={styles.countdownTitle}>
          {isExpired
            ? 'انتهت مدة تثبيت السعر المحددة'
            : isPending
            ? 'الوقت المتبقي للتحويل ورفع الإشعار'
            : 'حالة الطلب الحالية'}
        </div>

        {/* Digital Clock Boxes & SVG Circular Ring */}
        {isPending && !isExpired && (
          <>
            <div className={styles.timerRingBox} aria-hidden="true">
              <svg className={styles.timerRingSvg} width="64" height="64" viewBox="0 0 64 64">
                <circle className={styles.timerRingBg} cx="32" cy="32" r="26" />
                <circle
                  className={`${styles.timerRingProg} ${isUrgent ? styles.ringUrgent : ''}`}
                  cx="32"
                  cy="32"
                  r="26"
                  style={{
                    strokeDasharray: 163.36,
                    strokeDashoffset: 163.36 * (1 - Math.max(0, Math.min(1, secondsRemaining / 14400))),
                  }}
                />
              </svg>
              <Clock size={20} className={styles.timerRingCenterIcon} />
            </div>

            <div className={styles.timerDigitsContainer}>
              <div className={styles.timerBox}>
                <span className={styles.digit}>{padZero(hours)}</span>
                <span className={styles.unit}>ساعة</span>
              </div>
              <span className={styles.timerColon}>:</span>
              <div className={styles.timerBox}>
                <span className={styles.digit}>{padZero(minutes)}</span>
                <span className={styles.unit}>دقيقة</span>
              </div>
              <span className={styles.timerColon}>:</span>
              <div className={styles.timerBox}>
                <span className={styles.digit}>{padZero(seconds)}</span>
                <span className={styles.unit}>ثانية</span>
              </div>
            </div>
          </>
        )}

        {/* 12-Particle Ribbon Confetti Burst on Confirmed / Completed Orders */}
        {(order.status === 'confirmed' || order.status === 'completed') && (
          <div className={styles.confettiContainer} aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={styles.particle} style={{ '--p': i }} />
            ))}
          </div>
        )}

        {/* Locked Price Summary Row */}
        <div className={styles.bannerSummaryRow}>
          <div>
            <div className={styles.bannerSummaryLabel}>السعر مثبت:</div>
            <div className={styles.bannerAmount}>
              {formatSdg(order.total_sdg || order.total_amount_sdg)}
            </div>
          </div>
          {order.lock_expires_at && (
            <div className={styles.bannerExpiryCol}>
              <div className={styles.bannerSummaryLabel}>ينتهي التثبيت:</div>
              <div className={styles.bannerExpiryVal}>
                الساعة {formatExpiryTime(order.lock_expires_at)}
              </div>
            </div>
          )}
        </div>

        {/* Short price notice on lock card */}
        <div className={styles.bannerNoticeWrapper}>
          <PriceNotice variant="short" />
        </div>
      </div>

      {/* 2. Expired State Action Box */}
      {isExpired && (
        <div className={styles.expiredBox}>
          <h3 className={styles.expiredTitle}>انتهت مهلة تثبيت السعر</h3>
          <p className={styles.expiredDesc}>
            انتهت مهلة تثبيت السعر لهذا الطلب وتم إلغاء الحجز. يمكنك بسهولة إعادة الطلب بالأسعار المحدثة حالياً.
          </p>
          <button
            type="button"
            disabled={reordering}
            onClick={handleReorder}
            className={styles.reorderBtn}
          >
            <RefreshCw size={16} />
            <span>{reordering ? 'جاري إعادة الحجز...' : 'إعادة الطلب بالسعر الحالي'}</span>
          </button>
        </div>
      )}

      {/* 3. Bankak Payment Details Card (Mockup Parity) */}
      {!isExpired && isPending && (
        <div className={styles.bankCard}>
          <div className={styles.bankHeader}>
            <div>
              <h4 className={styles.bankName}>{bankDetails.bank_name}</h4>
              <div className={styles.bankBranch}>{bankDetails.branch_name}</div>
            </div>
            <span className={styles.bankTag}>تحويل بنكك</span>
          </div>

          <div className={styles.bankRow}>
            <span className={styles.bankLabel}>رقم الحساب:</span>
            <div className={styles.accountBox}>
              <span className={styles.accountNumber}>{bankDetails.account_number}</span>
              <button
                type="button"
                onClick={() => handleCopyAccount(bankDetails.account_number)}
                className={styles.copyBtn}
                title="نسخ رقم الحساب"
              >
                {copiedAccount ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedAccount ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          <div className={styles.bankRow}>
            <span className={styles.bankLabel}>اسم الحساب:</span>
            <span className={styles.bankVal}>{bankDetails.account_name}</span>
          </div>

          <div className={styles.bankRow}>
            <span className={styles.bankLabel}>ملاحظة التحويل:</span>
            <span className={styles.orderRefHint}>اكتب رقم الطلب #{order.order_number}</span>
          </div>
        </div>
      )}

      {/* 4. Receipt Upload Dropzone */}
      {!isExpired && isPending && (
        <div className={styles.receiptCard}>
          <h4 className={styles.receiptTitle}>رفع إشعار التحويل:</h4>
          <p className={styles.receiptDesc}>
            بعد ما تحول في بنكك، ارفع صورة الإشعار هنا عشان نراجعها ونجهز جهازك.
          </p>

          {hasProof ? (
            <div className={styles.proofSuccessBox}>
              <CheckCircle2 size={24} className={styles.successIcon} />
              <div>
                <div className={styles.proofSuccessTitle}>تم استلام إشعار التحويل</div>
                <div className={styles.proofSuccessSub}>الطلب قيد المراجعة حالياً ومطابقة العملية.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className={styles.uploadForm}>
              <div
                className={styles.dropzone}
                onClick={() => document.getElementById('receiptFileInput').click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('receiptFileInput').click(); }}
              >
                <input
                  type="file"
                  id="receiptFileInput"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.hiddenFile}
                />
                <Upload size={24} className={styles.uploadIcon} />
                <div className={styles.dropzoneTitle}>
                  {proofFile ? proofFile.name : 'اضغط هنا لاختيار صورة إشعار بنكك'}
                </div>
                <div className={styles.dropzoneSub}>صورة عادية أو لقطة شاشة من الهاتف</div>
              </div>

              {proofPreview && (
                <div className={styles.previewBox}>
                  <img src={proofPreview} alt="معاينة الإشعار" className={styles.previewImg} />
                </div>
              )}

              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="اسم المحول في بنكك (اختياري)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className={styles.smallInput}
                />
                <input
                  type="text"
                  placeholder="الرقم المرجعي للإشعار (اختياري)"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className={styles.smallInput}
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !proofFile}
                className={`${styles.uploadBtn} btn-vivid`}
              >
                <Check size={16} />
                <span>{uploading ? 'جاري رفع الإشعار...' : 'تأكيد ورفع الإشعار'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* 5. 5-Step Order Tracking Timeline (Mockup Screen 8 Parity) */}
      <div className={styles.timelineCard}>
        <h4 className={styles.timelineHeading}>مراحل الطلب</h4>

        <div className={styles.trackingTimeline}>
          {trackingSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={idx}
                className={`${styles.timelineStep} ${
                  isCompleted ? styles.stepCompleted : isCurrent ? styles.stepCurrent : ''
                }`}
              >
                <div className={styles.timelineMarker}>
                  <div className={styles.markerDot}>
                    {isCompleted ? <Check size={12} /> : idx + 1}
                  </div>
                  {idx < trackingSteps.length - 1 && <div className={styles.markerLine} />}
                </div>

                <div className={styles.timelineContent}>
                  <div className={styles.stepTitleRow}>
                    <h5 className={styles.stepTitle}>{step.title}</h5>
                    <span className={styles.stepTime}>{step.time}</span>
                  </div>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Order Items & Delivery Summary */}
      <div className={styles.detailsCard}>
        <h4 className={styles.detailsTitle}>عناصر الطلب</h4>
        <div className={styles.itemsTable}>
          {order.items?.map((item, idx) => (
            <div key={idx} className={styles.itemRow}>
              <div>
                <span className={styles.itemName}>{item.product_name || item.name}</span>
                <span className={styles.itemQty}> × {item.quantity}</span>
              </div>
              <span className={styles.itemTotal}>
                {formatSdg((item.price_sdg || item.unit_price_sdg) * item.quantity)}
              </span>
            </div>
          ))}

          {order.discount_sdg > 0 && (
            <div className={styles.discountRow}>
              <span>خصم الطلب بالتطبيق (3%):</span>
              <span>- {formatSdg(order.discount_sdg)}</span>
            </div>
          )}

          {order.shipping_fee_sdg > 0 && (
            <div className={styles.itemRow}>
              <span>رسوم التوصيل:</span>
              <span>{formatSdg(order.shipping_fee_sdg)}</span>
            </div>
          )}

          <div className={styles.grandTotalRow}>
            <span>الإجمالي:</span>
            <span className={styles.grandTotalVal}>{formatSdg(order.total_amount_sdg)}</span>
          </div>
        </div>
      </div>

      {/* 7. WhatsApp Direct Assistance CTA */}
      <div className={styles.whatsappCard}>
        <a
          href={`https://wa.me/249912345678?text=${encodeURIComponent(
            `مرحباً، لدي استفسار عن طلبي رقم #${order.order_number}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappActionBtn}
        >
          <MessageCircle size={18} />
          <span>تواصل عبر واتساب لمتابعة الطلب</span>
        </a>
      </div>
    </div>
  );
}
