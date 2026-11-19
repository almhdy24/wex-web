import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Truck, Lock, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productsApi } from '../../api/products';
import { api } from '../../api/client';
import { formatSdg } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import styles from './CheckoutPage.module.css';

export default function CheckoutPage() {
  const { items, clearCart, estimatedSubtotalSdg } = useCart();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('pickup');
  const [shippingZones, setShippingZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items, navigate]);

  useEffect(() => {
    let isMounted = true;
    productsApi
      .getShippingZones()
      .then((res) => {
        if (!isMounted) return;
        setShippingZones(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedZoneId(String(res.data[0].id));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedZone = shippingZones.find((z) => String(z.id) === String(selectedZoneId));
  const deliveryFee = orderType === 'delivery' && selectedZone ? selectedZone.fee_sdg : 0;
  const estimatedDiscount = Math.round(estimatedSubtotalSdg * 0.03);
  const estimatedTotal = Math.max(0, estimatedSubtotalSdg - estimatedDiscount + deliveryFee);

  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;
    setErrors({});

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
      toastError(err.message || 'فشل تقديم الطلب. حاول تاني.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>إتمام الطلب وتثبيت السعر</h1>
        <p className={styles.subtitle}>
          حدد طريقة الاستلام وأكمل بياناتك لحجز الأجهزة وتجميد السعر لمدة 4 ساعات
        </p>
      </header>

      <form onSubmit={handleSubmitOrder}>
        <div className={styles.layoutGrid}>
          {/* Steps column */}
          <div className={styles.formCol}>
            {/* Step 1: Delivery Method */}
            <div className={styles.stepCard}>
              <h2 className={styles.stepHeading}>
                <span className={styles.stepNumber}>1</span>
                <span>طريقة الاستلام</span>
              </h2>

              <div className={styles.deliveryOptions}>
                <label
                  className={`${styles.optionCard} ${
                    orderType === 'pickup' ? styles.optionCardSelected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="order_type"
                    value="pickup"
                    checked={orderType === 'pickup'}
                    onChange={() => setOrderType('pickup')}
                    className={styles.radioInput}
                  />
                  <div className={styles.optionTitle}>
                    <Store size={18} />
                    <span>استلام من المحل</span>
                  </div>
                  <div className={styles.optionDesc}>
                    مول الواحة، أم درمان (مجاناً)
                  </div>
                </label>

                <label
                  className={`${styles.optionCard} ${
                    orderType === 'delivery' ? styles.optionCardSelected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="order_type"
                    value="delivery"
                    checked={orderType === 'delivery'}
                    onChange={() => setOrderType('delivery')}
                    className={styles.radioInput}
                  />
                  <div className={styles.optionTitle}>
                    <Truck size={18} />
                    <span>توصيل وشحن</span>
                  </div>
                  <div className={styles.optionDesc}>
                    إلى أم درمان والولايات المتاحة
                  </div>
                </label>
              </div>
            </div>

            {/* Step 2: Delivery address (if delivery selected) */}
            {orderType === 'delivery' && (
              <div className={styles.stepCard}>
                <h2 className={styles.stepHeading}>
                  <span className={styles.stepNumber}>2</span>
                  <span>منطقة التوصيل والعنوان</span>
                </h2>

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
                  placeholder="مثال: أم درمان - حي الملازمين - شارع الشفيع"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  error={errors.delivery_address}
                  hint="يرجى ذكر أقرب معلم أو اسم الشارع بدقة"
                />
              </div>
            )}

            {/* Step 3: Contact Phone & Notes */}
            <div className={styles.stepCard}>
              <h2 className={styles.stepHeading}>
                <span className={styles.stepNumber}>
                  {orderType === 'delivery' ? 3 : 2}
                </span>
                <span>بيانات التواصل</span>
              </h2>

              <div className={styles.phoneFieldWrapper}>
                <label className={styles.fieldHint} htmlFor="contact_phone">
                  رقم الهاتف للتواصل (مطلوب)
                </label>
                <input
                  id="contact_phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder="0912345678"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className={styles.phoneInput}
                  required
                />
                {errors.contact_phone && (
                  <span className={styles.fieldError}>
                    {errors.contact_phone}
                  </span>
                )}
                <span className={styles.fieldHint}>
                  رقم سوداني فعال للتواصل معك لتسليم الطلب وتأكيد التحويل
                </span>
              </div>

              <div>
                <label className={styles.fieldHint} htmlFor="customer_notes">
                  ملاحظات إضافية على الطلب (اختياري)
                </label>
                <textarea
                  id="customer_notes"
                  className={styles.textarea}
                  placeholder="أي ملاحظات بخصوص موعد التسليم أو متطلبات إضافية..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Summary column */}
          <aside className={styles.summaryCol}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>ملخص الطلب</h2>

              <div className={styles.itemsPreview}>
                {items.map((item) => (
                  <div key={item.id} className={styles.itemPreviewRow}>
                    <span className={styles.itemPreviewName}>
                      {item.quantity}x {item.name}
                    </span>
                    <span className={styles.itemPreviewPrice}>
                      {formatSdg((item.price_sdg || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.calcRow}>
                <span>المجموع الفرعي:</span>
                <span>{formatSdg(estimatedSubtotalSdg)}</span>
              </div>

              <div className={styles.discountRow}>
                <span>خصم التطبيق (3%):</span>
                <span>-{formatSdg(estimatedDiscount)}</span>
              </div>

              <div className={styles.calcRow}>
                <span>رسوم التوصيل:</span>
                <span>
                  {deliveryFee === 0 ? 'مجاناً (استلام)' : formatSdg(deliveryFee)}
                </span>
              </div>

              <div className={styles.calcTotalRow}>
                <span>المبلغ الإجمالي التقريبي:</span>
                <span className={styles.totalSdg}>{formatSdg(estimatedTotal)}</span>
              </div>

              <div className={styles.lockNotice}>
                السعر بالدرهم وبيتغير مع الصرف. بنثبته ليك بعد الطلب مباشرة لمدة 4 ساعات.
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={submitting}
                disabled={submitting}
                className={styles.desktopSubmitBtn}
              >
                <Lock size={18} />
                <span>تثبيت السعر وإتمام الطلب</span>
              </Button>
            </div>
          </aside>
        </div>

        {/* Sticky Mobile CTA Bar */}
        <div className={styles.mobileStickyCta}>
          <div className={styles.mobileTotalInfo}>
            <span className={styles.mobileTotalLabel}>المبلغ التقريبي</span>
            <span className={styles.mobileTotalValue}>
              {formatSdg(estimatedTotal)}
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            disabled={submitting}
            className={styles.mobileSubmitBtn}
          >
            <span>إتمام الطلب</span>
            <ArrowLeft size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
