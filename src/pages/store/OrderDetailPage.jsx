import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { formatSdg, formatDate, getOrderStatusInfo, getProofStatusInfo } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';

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
      setError(err.message || 'تعذر تحميل بيانات الطلب');
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
          loadOrder(false); // Refresh status when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsRemaining]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const pad = (n) => String(n).padStart(2, '0');

  // Handle Proof File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Submit Payment Proof
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      toastError('يرجى اختيار صورة إشعار التحويل البنكي');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('proof_image', proofFile);
    if (senderName.trim()) formData.append('sender_name', senderName.trim());
    if (referenceNumber.trim()) formData.append('reference_number', referenceNumber.trim());

    try {
      await ordersApi.uploadPaymentProof(orderNumber, formData);
      success('تم رفع إشعار التحويل بنجاح، جاري مراجعته من موظفي المحل');
      setUploadModalOpen(false);
      setProofFile(null);
      setProofPreview(null);
      setSenderName('');
      setReferenceNumber('');
      loadOrder(false);
    } catch (err) {
      toastError(err.message || 'فشل رفع إشعار التحويل');
    } finally {
      setUploading(false);
    }
  };

  // Cancel Order
  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      await ordersApi.cancelOrder(orderNumber);
      success('تم إلغاء الطلب بنجاح وإعادة الأجهزة للمخزن');
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
      toastError(err.message || 'فشل إعادة الطلب');
    } finally {
      setReordering(false);
    }
  };

  // Quick Copy Helper
  const handleCopy = (text, msg) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      success(msg || 'تم النسخ');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: 840 }}>
        <Skeleton height="36px" width="50%" style={{ marginBottom: 'var(--space-4)' }} />
        <Skeleton height="180px" borderRadius="var(--radius-xl)" style={{ marginBottom: 'var(--space-6)' }} />
        <Skeleton height="260px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <ErrorState
          title="تعذر العثور على الطلب"
          message={error || 'رقم الطلب غير صحيح أو ليس لديك صلاحية للاطلاع عليه.'}
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
    <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: 840 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>تفاصيل ومتابعة الطلب</div>
          <h1 className="en-text" style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-navy)', margin: 0 }}>
            #{order.order_number}
          </h1>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', marginTop: 4 }}>
            تم الإنشاء بتاريخ: {formatDate(order.created_at)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Badge variant={statusInfo.variant} style={{ fontSize: '13px', padding: '6px 14px' }}>
            <span>{statusInfo.icon}</span>
            <span>{statusInfo.label}</span>
          </Badge>
        </div>
      </div>

      {/* Hero Countdown Banner (if Pending Payment) */}
      {isPending && secondsRemaining > 0 && (
        <div className="price-lock-banner">
          <div className="lock-header">
            <div className="lock-status-badge">
              <span>السعر مثبت حالياً</span>
            </div>
            <span style={{ fontSize: '12px', opacity: 0.85 }}>طلب #{order.order_number}</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: '12px', color: 'var(--color-cyan)', fontWeight: 700 }}>
              الوقت المتبقي للتحويل في بنكك ورفع صورة الإشعار
            </div>
          </div>

          <div className="timer-digits-container">
            <div className="timer-box">
              <span className="digit">{pad(hours)}</span>
              <span className="unit">ساعة</span>
            </div>
            <span className="timer-colon">:</span>
            <div className="timer-box">
              <span className="digit">{pad(minutes)}</span>
              <span className="unit">دقيقة</span>
            </div>
            <span className="timer-colon">:</span>
            <div className="timer-box">
              <span className="digit">{pad(seconds)}</span>
              <span className="unit">ثانية</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 14,
            }}
          >
            <div>
              <div style={{ fontSize: '10px', opacity: 0.85 }}>المبلغ المطلوب تحويله:</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF' }}>
                {formatSdg(order.total_sdg)}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '10px', opacity: 0.85 }}>سعر الصرف المحجوز به:</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-cyan)' }}>
                1 درهم = {order.exchange_rate_sdg} جنيه
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expired State Notice */}
      {isExpired && (
        <div
          style={{
            backgroundColor: 'var(--color-danger-bg)',
            border: '1.5px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
          }}
        >
          <h3 style={{ color: 'var(--color-danger)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)' }}>
            انتهت مدة تثبيت السعر المحددة (4 ساعات)
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-700)', lineHeight: 1.6, maxWidth: 540, margin: '0 auto var(--space-4)' }}>
            سعر اللابتوب بالدرهم وبيتغير مع الصرف. لما تطلب، بنثبت ليك السعر لمدة محددة وبتحول فيها. لو المدة انتهت بيرجع السعر للصرف الحالي. تقدر تطلب الجهاز من جديد بالسعر الحالي.
          </p>
          <Button variant="primary" loading={reordering} onClick={handleReorder}>
            إعادة الطلب بالسعر الحالي
          </Button>
        </div>
      )}

      {/* Cancelled Notice */}
      {isCancelled && (
        <div
          style={{
            backgroundColor: 'var(--color-slate-100)',
            border: '1px solid var(--color-slate-200)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: 'var(--space-2)' }}>
            هذا الطلب ملغي وتمت استعادة الأجهزة إلى المخزن
          </div>
          <Button variant="outline" size="sm" loading={reordering} onClick={handleReorder}>
            إنشاء طلب جديد بنفس الأجهزة
          </Button>
        </div>
      )}

      {/* Bankak Details Card (if Pending Payment and bank details returned) */}
      {isPending && bankDetails && (
        <div className="bank-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-slate-100)' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                {bankDetails.bank_name || 'بنك الخرطوم (تطبيق بنكك)'}
              </h4>
              <div style={{ fontSize: '11px', color: 'var(--color-slate-500)', marginTop: 2 }}>
                فرع أم درمان - الحساب الرسمي المعتمد لمتجر ويكس تكنولوجي
              </div>
            </div>
            <span className="badge badge-success">تحويل بنكك</span>
          </div>

          <div className="bank-row">
            <span style={{ fontSize: '12px', color: 'var(--color-slate-600)' }}>رقم الحساب:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="font-mono" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-navy)' }}>
                {bankDetails.account_number}
              </span>
              <button
                type="button"
                className="copy-badge-btn"
                onClick={() => handleCopy(bankDetails.account_number, 'تم نسخ رقم الحساب')}
              >
                نسخ
              </button>
            </div>
          </div>

          <div className="bank-row">
            <span style={{ fontSize: '12px', color: 'var(--color-slate-600)' }}>اسم الحساب:</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)' }}>
              {bankDetails.account_name}
            </span>
          </div>

          <div className="bank-row">
            <span style={{ fontSize: '12px', color: 'var(--color-slate-600)' }}>المبلغ الدقيق:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-royal-blue)' }}>
                {formatSdg(bankDetails.amount_sdg || order.total_sdg)}
              </span>
              <button
                type="button"
                className="copy-badge-btn"
                onClick={() => handleCopy(String(bankDetails.amount_sdg || order.total_sdg), 'تم نسخ المبلغ')}
              >
                نسخ
              </button>
            </div>
          </div>

          <div className="bank-row">
            <span style={{ fontSize: '12px', color: 'var(--color-slate-600)' }}>ملاحظة التحويل:</span>
            <span style={{ fontSize: '12px', color: 'var(--color-royal-blue)', fontWeight: 700 }}>
              اكتب رقم الطلب #{order.order_number}
            </span>
          </div>

          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="vivid"
              size="lg"
              block
              onClick={() => setUploadModalOpen(true)}
            >
              📤 رفع صورة إشعار التحويل البنكي (بنكك)
            </Button>
          </div>
        </div>
      )}

      {/* Order Items Table */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>الأجهزة والمنتجات المطلوبة</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>الجهاز / المنتج</th>
                <th>سعر الوحدة</th>
                <th>الكمية</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{item.product_name}</div>
                    {item.specs_snapshot && (
                      <div className="en-text" style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                        {item.specs_snapshot.cpu || ''} {item.specs_snapshot.ram ? `| ${item.specs_snapshot.ram}` : ''}
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

        {/* Calculations Footer */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', backgroundColor: 'var(--color-slate-50)', borderTop: '1px solid var(--color-slate-100)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-slate-600)' }}>المجموع الفرعي للأجهزة:</span>
            <span style={{ fontWeight: 600 }}>{formatSdg(order.subtotal_sdg)}</span>
          </div>

          {order.discount_sdg > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
              <span>خصم الطلب بالتطبيق:</span>
              <span>-{formatSdg(order.discount_sdg)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-slate-600)' }}>رسوم التوصيل:</span>
            <span style={{ fontWeight: 600 }}>
              {order.delivery_fee_sdg === 0 ? 'مجاناً (استلام من المحل)' : formatSdg(order.delivery_fee_sdg)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px dashed var(--color-slate-200)', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-royal-blue)' }}>
            <span>المبلغ الإجمالي المثبت:</span>
            <span>{formatSdg(order.total_sdg)}</span>
          </div>
        </div>
      </div>

      {/* Delivery and Customer Information */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>بيانات الاستلام والتوصيل</h3>
          </div>
          <div className="card-body" style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>طريقة الاستلام: </span>
              <strong>{order.delivery_type === 'pickup' ? 'استلام من المحل (مول الواحة - الشهداء - أم درمان)' : 'توصيل للعنوان'}</strong>
            </div>

            {order.delivery_type === 'delivery' && (
              <>
                {order.shipping_zone && (
                  <div>
                    <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>الولاية / المنطقة: </span>
                    <span>{order.shipping_zone.state_name_ar}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>العنوان: </span>
                  <span>{order.delivery_address}</span>
                </div>
              </>
            )}

            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>هاتف التواصل: </span>
              <span className="en-text" style={{ fontWeight: 600 }}>{order.contact_phone}</span>
            </div>

            {order.customer_notes && (
              <div>
                <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>ملاحظات العميل: </span>
                <span style={{ color: 'var(--color-slate-700)' }}>{order.customer_notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Courier Info (if out for delivery) */}
        {order.status === 'out_for_delivery' && (
          <div className="card" style={{ borderColor: 'var(--color-cyan)', backgroundColor: 'var(--color-cyan-light)' }}>
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-navy)' }}>بيانات المندوب والتسليم</h3>
            </div>
            <div className="card-body" style={{ fontSize: 'var(--text-sm)' }}>
              <div style={{ marginBottom: 6 }}>
                الطلب حالياً في الطريق مع مندوب التوصيل المعتمد.
              </div>
              {order.courier_name && (
                <div>اسم المندوب: <strong>{order.courier_name}</strong></div>
              )}
              {order.courier_phone && (
                <div>هاتف المندوب: <span className="en-text">{order.courier_phone}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Submitted Proofs Status (if any uploaded) */}
        {order.proofs && order.proofs.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>إشعارات التحويل المرفوعة</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {order.proofs.map((proof) => {
                const proofStatus = getProofStatusInfo(proof.status);
                return (
                  <div key={proof.id} style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                        تاريخ الرفع: {formatDate(proof.created_at)}
                      </span>
                      <Badge variant={proofStatus.variant}>{proofStatus.label}</Badge>
                    </div>

                    {proof.sender_name && (
                      <div style={{ fontSize: '12px' }}>اسم المحوّل: <strong>{proof.sender_name}</strong></div>
                    )}
                    {proof.reference_number && (
                      <div style={{ fontSize: '12px' }}>الرقم المرجعي: <span className="en-text">{proof.reference_number}</span></div>
                    )}
                    {proof.reviewer_note && (
                      <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: 4 }}>
                        ملاحظة المراجعة: {proof.reviewer_note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Order Timeline Events */}
      {order.events && order.events.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>سجل ومسار مراحل الطلب</h3>
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

      {/* Bottom Danger Action: Cancel Order */}
      {isPending && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-slate-200)' }}>
          <Button variant="danger-outline" size="sm" onClick={() => setCancelModalOpen(true)}>
            إلغاء الطلب وتحرير الأجهزة
          </Button>
        </div>
      )}

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
              disabled={!proofFile}
              onClick={handleUploadSubmit}
            >
              تأكيد ورفع الإشعار
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label form-label-required">صورة إشعار التحويل (لقطة الشاشة من تطبيق بنكك)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="form-input"
              style={{ paddingTop: 8 }}
              required
            />
            <span className="form-hint">الصيغ المقبولة: JPEG, PNG, WEBP (الحد الأقصى 5 ميجابايت)</span>
          </div>

          {proofPreview && (
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)', maxHeight: 240, overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-slate-200)' }}>
              <img src={proofPreview} alt="معاينة الإشعار" style={{ maxHeight: 220, margin: 'auto', objectFit: 'contain' }} />
            </div>
          )}

          <Input
            label="اسم صاحب الحساب المحوِّل (اختياري)"
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
            <Button variant="danger" loading={cancelling} onClick={handleCancelOrder}>
              نعم، إلغاء الطلب
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-slate-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
          هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ سيتم إلغاء حجز السعر فوراً وإتاحة الجهاز لباقي المشترين في المتجر.
        </p>
      </Modal>
    </div>
  );
}
