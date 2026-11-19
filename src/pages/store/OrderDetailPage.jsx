import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, UploadCloud, MessageCircle, RefreshCw } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatSdg, formatDate, getOrderStatusInfo, getProofStatusInfo } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import CopyField from '../../components/common/CopyField';
import Countdown from '../../components/common/Countdown';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import styles from './OrderDetailPage.module.css';

/**
 * Client-side receipt image compression
 * Scales images down to max 1600px dimension, compresses at JPEG 0.8 to stay well under 1MB
 */
async function compressProofImage(file) {
  // If not an image or already small SVG/GIF, return as is
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^.]+$/, '.jpg');
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Lock Countdown
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef(null);

  // Proof Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [uploading, setUploading] = useState(false);

  // Cancel & Reorder State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
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
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder(true);
  }, [orderNumber]);

  // Handle Live Countdown
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
      success('تم رفع إشعار التحويل بنجاح، جاري مراجعته');
      setUploadModalOpen(false);
      setProofFile(null);
      setProofPreview(null);
      setSenderName('');
      setReferenceNumber('');
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل رفع إشعار التحويل. حاول تاني.');
    } finally {
      setUploading(false);
    }
  };

  // Cancel Order
  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      await ordersApi.cancelOrder(orderNumber);
      success('تم إلغاء الطلب');
      setCancelModalOpen(false);
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل إلغاء الطلب');
    } finally {
      setCancelling(false);
    }
  };

  // Reorder
  const handleReorder = async () => {
    setReordering(true);
    try {
      const res = await ordersApi.reorder(orderNumber);
      const newOrder = res.data;
      success(`تم إنشاء طلب جديد برقم #${newOrder.order_number}`);
      navigate(`/orders/${newOrder.order_number}`, { replace: true });
    } catch (err) {
      toastError(err.message || 'فشل إعادة الطلب. حاول تاني.');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="36px" width="50%" />
        <div style={{ height: 16 }} />
        <Skeleton height="160px" borderRadius="var(--radius-lg)" />
        <div style={{ height: 16 }} />
        <Skeleton height="240px" borderRadius="var(--radius-lg)" />
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

  const statusInfo = getOrderStatusInfo(order.status);
  const isPending = order.status === 'pending_payment';
  const isExpired = order.status === 'expired';
  const isCancelled = order.status === 'cancelled';
  const bankDetails = order.bank_details;

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.headerSub}>تفاصيل ومتابعة الطلب</span>
          <h1 className={styles.orderNumber}>#{order.order_number}</h1>
          <span className={styles.orderDate}>
            تاريخ الإنشاء: {formatDate(order.created_at)}
          </span>
        </div>

        <Tag variant={statusInfo.variant}>{statusInfo.label}</Tag>
      </header>

      {/* Live Tabular Countdown Banner (if Pending Payment) */}
      {isPending && secondsRemaining > 0 && (
        <section className={styles.countdownCard} aria-label="الوقت المتبقي لتثبيت السعر">
          <div className={styles.countdownHeader}>
            <div className={styles.countdownLabel}>
              <Clock size={16} />
              <span>الوقت المتبقي لتثبيت السعر والتحويل:</span>
            </div>
          </div>

          <Countdown
            initialSeconds={secondsRemaining}
            onExpire={() => loadOrder(false)}
          />

          <div className={styles.rateBanner}>
            <div>
              <span>المبلغ المطلوب تحويله: </span>
              <strong className={styles.rateBannerTotal}>
                {formatSdg(order.total_sdg)}
              </strong>
            </div>
            <div>
              <span>سعر الصرف المثبت: </span>
              <strong>1 درهم = {order.exchange_rate_sdg} جنيه</strong>
            </div>
          </div>
        </section>
      )}

      {/* Expired State Notice */}
      {isExpired && (
        <div className={styles.expiredBanner}>
          <h2 className={styles.expiredTitle}>انتهت مدة تثبيت السعر (4 ساعات)</h2>
          <p className={styles.expiredDesc}>
            السعر بالدرهم وبيتغير مع الصرف. لما تطلب، بنثبت ليك السعر لمدة 4 ساعات وبتحول فيها. لو المدة انتهت بيرجع السعر للصرف الحالي. تقدر تطلب الجهاز من جديد بالسعر الحالي.
          </p>
          <Button
            variant="primary"
            size="md"
            loading={reordering}
            onClick={handleReorder}
          >
            <RefreshCw size={16} />
            <span>إعادة الطلب بالسعر الحالي</span>
          </Button>
        </div>
      )}

      {/* Cancelled Notice */}
      {isCancelled && (
        <div className={styles.expiredBanner}>
          <h2 className={styles.expiredTitle}>الطلب ملغي</h2>
          <p className={styles.expiredDesc}>
            تم إلغاء هذا الطلب واسترجاع الأجهزة للمخزن.
          </p>
          <Button
            variant="outline"
            size="md"
            loading={reordering}
            onClick={handleReorder}
          >
            <RefreshCw size={16} />
            <span>إنشاء طلب جديد</span>
          </Button>
        </div>
      )}

      {/* Bankak Details Card with CopyFields */}
      {isPending && bankDetails && (
        <section className={styles.bankCard} aria-label="بيانات التحويل البنكي">
          <div className={styles.bankHeader}>
            <div>
              <h2 className={styles.bankTitle}>
                {bankDetails.bank_name || 'بنك الخرطوم (تطبيق بنكك)'}
              </h2>
              <div className={styles.bankSubtitle}>
                الحساب الرسمي المعتمد لمتجر ويكس تكنولوجي
              </div>
            </div>
            <Tag variant="success">تحويل بنكك</Tag>
          </div>

          <div className={styles.bankGrid}>
            <CopyField
              label="رقم الحساب"
              value={bankDetails.account_number}
            />

            <CopyField
              label="اسم الحساب"
              value={bankDetails.account_name}
            />

            <CopyField
              label="المبلغ المطلوب (جنيه سوداني)"
              value={String(bankDetails.amount_sdg || order.total_sdg)}
            />

            <CopyField
              label="ملاحظة التحويل (رقم الطلب)"
              value={`#${order.order_number}`}
            />
          </div>

          <div className={styles.bankActions}>
            <Button
              variant="primary"
              size="lg"
              block
              onClick={() => setUploadModalOpen(true)}
            >
              <UploadCloud size={18} />
              <span>ارفع إشعار التحويل</span>
            </Button>
          </div>
        </section>
      )}

      {/* Order Items Table */}
      <section className={styles.card} aria-label="المنتجات المطلوبة">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>المنتجات المطلوبة</h2>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>الجهاز</th>
                <th>سعر القطعة</th>
                <th>الكمية</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.product_name}</strong>
                    {item.specs_snapshot && (
                      <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                        {item.specs_snapshot.cpu || ''} {item.specs_snapshot.ram ? `· ${item.specs_snapshot.ram}` : ''}
                      </div>
                    )}
                  </td>
                  <td>{formatSdg(item.unit_price_sdg)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatSdg(item.subtotal_sdg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations Footer */}
        <div className={styles.tableFooter}>
          <div className={styles.footerRow}>
            <span>المجموع الفرعي:</span>
            <span>{formatSdg(order.subtotal_sdg)}</span>
          </div>

          {order.discount_sdg > 0 && (
            <div className={styles.footerRow} style={{ color: 'var(--color-success)' }}>
              <span>خصم التطبيق (3%):</span>
              <span>-{formatSdg(order.discount_sdg)}</span>
            </div>
          )}

          <div className={styles.footerRow}>
            <span>رسوم التوصيل:</span>
            <span>
              {order.delivery_fee_sdg === 0 ? 'مجاناً (استلام من المحل)' : formatSdg(order.delivery_fee_sdg)}
            </span>
          </div>

          <div className={styles.footerTotalRow}>
            <span>المبلغ الإجمالي المثبت:</span>
            <span className={styles.totalSdg}>{formatSdg(order.total_sdg)}</span>
          </div>
        </div>
      </section>

      {/* Delivery and Customer Information */}
      <div className={styles.infoGrid}>
        <div className={styles.card} style={{ marginBottom: 0 }}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>بيانات الاستلام</h2>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoList}>
              <div>
                <span className={styles.infoLabel}>طريقة الاستلام: </span>
                <strong>
                  {order.delivery_type === 'pickup'
                    ? 'استلام من المحل (مول الواحة - الشهداء - أم درمان)'
                    : 'توصيل للعنوان'}
                </strong>
              </div>

              {order.delivery_type === 'delivery' && (
                <>
                  {order.shipping_zone && (
                    <div>
                      <span className={styles.infoLabel}>الولاية / المنطقة: </span>
                      <span>{order.shipping_zone.state_name_ar}</span>
                    </div>
                  )}
                  <div>
                    <span className={styles.infoLabel}>العنوان: </span>
                    <span>{order.delivery_address}</span>
                  </div>
                </>
              )}

              <div>
                <span className={styles.infoLabel}>هاتف التواصل: </span>
                <span dir="ltr"><strong>{order.contact_phone}</strong></span>
              </div>

              {order.customer_notes && (
                <div>
                  <span className={styles.infoLabel}>ملاحظات: </span>
                  <span>{order.customer_notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submitted Proofs Status */}
        {order.proofs && order.proofs.length > 0 && (
          <div className={styles.card} style={{ marginBottom: 0 }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>إشعارات التحويل المرفوعة</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoList}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                          {formatDate(proof.created_at)}
                        </span>
                        <Tag variant={proofStatus.variant}>{proofStatus.label}</Tag>
                      </div>
                      {proof.sender_name && (
                        <div style={{ fontSize: '12px' }}>المحوّل: {proof.sender_name}</div>
                      )}
                      {proof.reference_number && (
                        <div style={{ fontSize: '12px' }} dir="ltr">رقم الإشعار: {proof.reference_number}</div>
                      )}
                      {proof.reviewer_note && (
                        <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: 4 }}>
                          ملاحظة: {proof.reviewer_note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Events */}
      {order.events && order.events.length > 0 && (
        <section className={styles.card} aria-label="مسار الطلب">
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>مسار مراحل الطلب</h2>
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
                  {evt.note && <span className={styles.timelineNote}>{evt.note}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Support & Actions row */}
      <footer className={styles.supportRow}>
        <a
          href={`https://wa.me/249912345678?text=${encodeURIComponent(`مرحباً، أستفسر بخصوص الطلب رقم #${order.order_number}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappSupportBtn}
        >
          <MessageCircle size={18} />
          <span>استفسار عن الطلب عبر واتساب</span>
        </a>

        {isPending && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCancelModalOpen(true)}
          >
            إلغاء الطلب
          </Button>
        )}
      </footer>

      {/* Modal: Upload Bankak Payment Proof */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="رفع إشعار تحويل بنكك"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUploadModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              loading={uploading}
              disabled={!proofFile || uploading}
              onClick={handleUploadSubmit}
            >
              تأكيد ورفع الإشعار
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit} className={styles.modalForm}>
          <div className={styles.fileUploadArea}>
            <label htmlFor="proof_image_input" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              صورة الإشعار (لقطة الشاشة من تطبيق بنكك)
            </label>
            <input
              id="proof_image_input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
              يتم ضغط الصورة تلقائياً لتسريع الرفع
            </span>
          </div>

          {proofPreview && (
            <div className={styles.previewContainer}>
              <img
                src={proofPreview}
                alt="معاينة إشعار التحويل"
                className={styles.previewImage}
              />
            </div>
          )}

          <Input
            label="اسم صاحب الحساب المحوّل (اختياري)"
            placeholder="مثال: أحمد محمد عثمان"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />

          <Input
            label="الرقم المرجعي للإشعار (اختياري)"
            placeholder="مثال: 12345678"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            dir="ltr"
          />
        </form>
      </Modal>

      {/* Modal: Cancel Order Confirmation */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="تأكيد إلغاء الطلب"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>
              تراجع
            </Button>
            <Button
              variant="danger"
              loading={cancelling}
              onClick={handleCancelOrder}
            >
              نعم، إلغاء الطلب
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-slate-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
          هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ سيتم إلغاء تثبيت السعر فوراً وإرجاع الأجهزة للمخزن.
        </p>
      </Modal>
    </div>
  );
}
