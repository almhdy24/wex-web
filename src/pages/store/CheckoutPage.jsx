import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productsApi } from '../../api/products';
import { api } from '../../api/client';
import { formatSdg } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

export default function CheckoutPage() {
  const { items, clearCart, totalItems, estimatedSubtotalSdg } = useCart();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('pickup'); // 'pickup' | 'delivery'
  const [shippingZones, setShippingZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items, navigate]);

  // Load active shipping zones
  useEffect(() => {
    let isMounted = true;
    productsApi.getShippingZones()
      .then((res) => {
        if (!isMounted) return;
        setShippingZones(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedZoneId(String(res.data[0].id));
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const selectedZone = shippingZones.find((z) => String(z.id) === String(selectedZoneId));
  const deliveryFee = orderType === 'delivery' && selectedZone ? selectedZone.fee_sdg : 0;
  // Estimated final total before server app discount (3%)
  const estimatedDiscount = Math.round(estimatedSubtotalSdg * 0.03);
  const estimatedTotal = Math.max(0, estimatedSubtotalSdg - estimatedDiscount + deliveryFee);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate phone
    if (!contactPhone.trim()) {
      setErrors({ contact_phone: 'رقم الهاتف للتواصل مطلوب' });
      return;
    }

    if (orderType === 'delivery') {
      if (!selectedZoneId) {
        setErrors({ shipping_zone_id: 'يرجى اختيار ولاية أو منطقة التوصيل' });
        return;
      }
      if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
        setErrors({ delivery_address: 'يرجى كتابة عنوان التوصيل بالتفصيل (5 أحرف على الأقل)' });
        return;
      }
    }

    setSubmitting(true);

    const payload = {
      order_type: orderType,
      contact_phone: contactPhone.trim(),
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      customer_notes: customerNotes.trim() || undefined,
    };

    if (orderType === 'delivery') {
      payload.shipping_zone_id = Number(selectedZoneId);
      payload.delivery_address = deliveryAddress.trim();
    }

    try {
      const res = await api.post('/orders', payload);
      const createdOrder = res.data;
      clearCart();
      success(`تم إنشاء الطلب بنجاح رقم #${createdOrder.order_number}`);
      navigate(`/orders/${createdOrder.order_number}`, {
        state: { orderCreated: true, order: createdOrder },
        replace: true,
      });
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      }
      toastError(err.message || 'فشل تقديم الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: 960 }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>إتمام الطلب وتثبيت السعر</h1>
        <p style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
          حدد طريقة الاستلام وأكمل بياناتك لحجز الأجهزة وتجميد سعر الصرف لمدة 4 ساعات
        </p>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-6)' }}>
          {/* Order Details Column */}
          <div style={{ gridColumn: 'span 7' }} className="checkout-form-col">
            {/* Step 1: Delivery Option */}
            <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)' }}>
                1. طريقة الاستلام
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <label
                  style={{
                    border: `2px solid ${orderType === 'pickup' ? 'var(--color-royal-blue)' : 'var(--color-slate-200)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    backgroundColor: orderType === 'pickup' ? 'var(--color-ice-blue-alt)' : 'var(--color-white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                  }}
                >
                  <input
                    type="radio"
                    name="order_type"
                    value="pickup"
                    checked={orderType === 'pickup'}
                    onChange={() => setOrderType('pickup')}
                    style={{ position: 'absolute', opacity: 0 }}
                  />
                  <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-sm)' }}>
                    🏪 استلام من المحل
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                    مول الواحة، أم درمان (بدون رسوم توصيل)
                  </div>
                </label>

                <label
                  style={{
                    border: `2px solid ${orderType === 'delivery' ? 'var(--color-royal-blue)' : 'var(--color-slate-200)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    backgroundColor: orderType === 'delivery' ? 'var(--color-ice-blue-alt)' : 'var(--color-white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                  }}
                >
                  <input
                    type="radio"
                    name="order_type"
                    value="delivery"
                    checked={orderType === 'delivery'}
                    onChange={() => setOrderType('delivery')}
                    style={{ position: 'absolute', opacity: 0 }}
                  />
                  <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-sm)' }}>
                    🚚 توصيل وشحن
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                    إلى أم درمان وكافة ولايات السودان
                  </div>
                </label>
              </div>
            </div>

            {/* Step 2: Shipping specifics if Delivery */}
            {orderType === 'delivery' && (
              <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
                <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)' }}>
                  2. منطقة التوصيل والعنوان
                </h3>

                <Select
                  label="الولاية / منطقة التوصيل"
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  options={shippingZones.map((z) => ({
                    value: String(z.id),
                    label: `${z.state_name_ar} (رسوم التوصيل: ${formatSdg(z.fee_sdg)})`,
                  }))}
                  required
                  error={errors.shipping_zone_id}
                />

                <Input
                  label="عنوان التوصيل بالتفصيل"
                  placeholder="مثال: أم درمان - حي الملازمين - شارع الشفيع - منزل 14"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  error={errors.delivery_address}
                  hint="يرجى كتابة أقرب معلم أو اسم الشارع بدقة"
                />
              </div>
            )}

            {/* Step 3: Contact & Notes */}
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)' }}>
                {orderType === 'delivery' ? '3. بيانات التواصل' : '2. بيانات التواصل'}
              </h3>

              <Input
                label="رقم هاتف التواصل للتأكيد"
                placeholder="0912345678 أو 01..."
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
                dir="ltr"
                error={errors.contact_phone}
                hint="رقم سوداني فعال للتواصل معك لتسليم الطلب وتأكيد التحويل"
              />

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ملاحظات إضافية على الطلب (اختياري)</label>
                <textarea
                  className="form-textarea"
                  placeholder="مثال: يرجى تنزيل برامج الأوفيس مسبقاً، أو موعد الاتصال المفضل..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Order Summary & Submit Column */}
          <div style={{ gridColumn: 'span 5' }} className="checkout-summary-col">
            <div className="card" style={{ padding: 'var(--space-5)', position: 'sticky', top: 'calc(var(--header-height) + 16px)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)' }}>
                ملخص الطلب
              </h3>

              {/* Items preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 220, overflowY: 'auto', marginBottom: 'var(--space-4)' }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', borderBottom: '1px solid var(--color-slate-100)', paddingBottom: 'var(--space-1)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-navy)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.quantity}x {item.name}
                    </span>
                    <span style={{ fontWeight: 700 }}>{formatSdg((item.price_sdg || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations breakdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--color-slate-600)' }}>المجموع الفرعي:</span>
                <span style={{ fontWeight: 600 }}>{formatSdg(estimatedSubtotalSdg)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-success)' }}>
                <span>خصم التطبيق (3%):</span>
                <span>-{formatSdg(estimatedDiscount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--color-slate-600)' }}>رسوم التوصيل:</span>
                <span style={{ fontWeight: 600 }}>{deliveryFee === 0 ? 'مجاناً (استلام)' : formatSdg(deliveryFee)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 'var(--space-3)',
                  borderTop: '2px solid var(--color-slate-200)',
                  marginBottom: 'var(--space-5)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 800,
                  color: 'var(--color-royal-blue)',
                }}
              >
                <span>المبلغ الإجمالي التقريبي:</span>
                <span>{formatSdg(estimatedTotal)}</span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning-border)',
                  color: 'var(--color-warning)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  lineHeight: 1.6,
                  marginBottom: 'var(--space-4)',
                }}
              >
                🔒 <strong>تثبيت السعر:</strong> فور الضغط على تأكيد الطلب، سيتم خصم الكميات من المخزن وتثبيت سعر الصرف لمدة 4 ساعات لإتاحة الوقت للتحويل عبر تطبيق بنكك.
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={submitting}
              >
                تأكيد الطلب وتثبيت السعر الآن
              </Button>
            </div>
          </div>
        </div>
      </form>

      <style>{`
        @media (max-width: 768px) {
          .checkout-form-col, .checkout-summary-col {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
}
