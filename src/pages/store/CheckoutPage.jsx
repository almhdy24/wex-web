import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Truck, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productsApi } from '../../api/products';
import { api } from '../../api/client';
import { formatSdg, getProductImageUrl } from '../../utils/formatters';
import LaptopSvg from '../../components/common/LaptopSvg';
import PriceNotice from '../../components/common/PriceNotice';
import styles from './CheckoutPage.module.css';

export default function CheckoutPage() {
  const {
    items,
    clearCart,
    estimatedSubtotalSdg,
    refreshCartPrices,
    confirmAllPriceChanges,
    hasUnconfirmedPriceChanges,
  } = useCart();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('pickup');
  const [shippingZones, setShippingZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [shopInfo, setShopInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items, navigate]);

  useEffect(() => {
    let isMounted = true;
    refreshCartPrices();

    Promise.all([
      productsApi.getShippingZones().catch(() => ({ data: [] })),
      productsApi.getShopInfo().catch(() => ({ data: null })),
    ]).then(([zonesRes, shopRes]) => {
      if (!isMounted) return;
      const zList = zonesRes?.data || [];
      setShippingZones(zList);
      if (zList.length > 0) {
        setSelectedZoneId(String(zList[0].id));
      }
      setShopInfo(shopRes?.data || null);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshCartPrices]);

  const selectedZone = shippingZones.find((z) => String(z.id) === String(selectedZoneId));
  const deliveryFee = orderType === 'delivery' && selectedZone ? selectedZone.fee_sdg : 0;
  const appDiscount = Math.round(estimatedSubtotalSdg * 0.03);
  const finalTotal = Math.max(0, estimatedSubtotalSdg - appDiscount + deliveryFee);
  const priceLockHours = shopInfo?.lock_hours || shopInfo?.price_lock_hours || 4;

  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    if (hasUnconfirmedPriceChanges) {
      toastError('تغير سعر بعض الأجهزة في السلة. يرجى تأكيد الأسعار الجديدة قبل المتابعة.');
      return;
    }

    setErrors({});

    if (!contactPhone.trim()) {
      setErrors({ contact_phone: 'رقم الهاتف للتواصل مطلوب' });
      return;
    }

    if (orderType === 'delivery') {
      if (!selectedZoneId) {
        setErrors({ shipping_zone_id: 'يرجى اختيار منطقة التوصيل' });
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
      success(`تم تثبيت السعر وإنشاء الطلب بنجاح رقم #${createdOrder.order_number}`);
      navigate(`/orders/${createdOrder.order_number}`, {
        state: { orderCreated: true, order: createdOrder },
        replace: true,
      });
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      }
      toastError(err.message || 'تعذر إتمام الطلب، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Products Summary Card (Mockup Parity) */}
      <div className={styles.itemsSummaryCard}>
        {items.map((item) => {
          const imgUrl = getProductImageUrl(item.image?.thumb_path || item.image?.path);
          return (
            <div key={item.id} className={styles.summaryItemRow}>
              <div className={styles.itemThumb}>
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={item.name}
                    className={styles.thumbImg}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/favicon.svg';
                    }}
                  />
                ) : (
                  <LaptopSvg
                    silhouette={item.silhouette || 'modern'}
                    accentColor={item.accent_color || '#1E6BFF'}
                  />
                )}
              </div>

              <div className={styles.itemInfo}>
                <h4 className={styles.itemName}>{item.name}</h4>
                <div className={styles.itemMeta}>
                  <span>الكمية: {item.quantity}</span>
                  {item.specs && Array.isArray(item.specs) && item.specs[0] && (
                    <span> · {item.specs[0].spec_value || item.specs[0].value}</span>
                  )}
                </div>
                <div className={styles.itemPrice}>
                  {formatSdg((item.price_sdg || 0) * item.quantity)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmitOrder} className={styles.checkoutForm}>
        {/* 2. Delivery Method Selector (2-Column Selector in Mockup) */}
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>طريقة الاستلام:</h3>

          <div className={styles.deliveryGrid}>
            <div
              className={`${styles.deliveryBox} ${orderType === 'pickup' ? styles.deliveryBoxSelected : ''}`}
              onClick={() => setOrderType('pickup')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setOrderType('pickup'); }}
            >
              <div className={styles.boxTitle}>
                <Store size={16} />
                <span>استلام من المحل (مجاني)</span>
              </div>
              <div className={styles.boxDesc}>مول الواحة، الشهداء، أم درمان</div>
            </div>

            <div
              className={`${styles.deliveryBox} ${orderType === 'delivery' ? styles.deliveryBoxSelected : ''}`}
              onClick={() => setOrderType('delivery')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setOrderType('delivery'); }}
            >
              <div className={styles.boxTitle}>
                <Truck size={16} />
                <span>توصيل للعنوان</span>
              </div>
              <div className={styles.boxDesc}>أم درمان والخرطوم والولايات</div>
            </div>
          </div>

          {/* Delivery Zone & Address Fields */}
          {orderType === 'delivery' && (
            <div className={styles.deliveryDetails}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="zoneSelect">المدينة / منطقة التوصيل:</label>
                <select
                  id="zoneSelect"
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className={styles.select}
                >
                  {shippingZones.map((z) => (
                    <option key={z.id} value={String(z.id)}>
                      {z.state_name_ar} (رسوم التوصيل: {formatSdg(z.fee_sdg)})
                    </option>
                  ))}
                </select>
                {errors.shipping_zone_id && (
                  <span className={styles.fieldError}>{errors.shipping_zone_id}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="deliveryAddress">العنوان بالتفصيل:</label>
                <input
                  id="deliveryAddress"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="الحي، الشارع، أو المعلم القريب..."
                  className={styles.input}
                  required
                />
                {errors.delivery_address && (
                  <span className={styles.fieldError}>{errors.delivery_address}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Customer Contact Phone & Notes */}
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>بيانات الاتصال:</h3>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="contactPhone">رقم هاتف التواصل والواتساب:</label>
            <input
              id="contactPhone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="0912345678"
              className={styles.input}
              required
            />
            {errors.contact_phone && (
              <span className={styles.fieldError}>{errors.contact_phone}</span>
            )}
            <span className={styles.fieldHint}>
              رقم سوداني فعال لمطابقة إشعار التحويل وتأكيد الاستلام.
            </span>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="customerNotes">ملاحظات إضافية (اختياري):</label>
            <textarea
              id="customerNotes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="أي تفاصيل خاصة بتسليم الجهاز أو توقيت التواجد..."
              rows={2}
              className={styles.textarea}
            />
          </div>
        </div>

        {/* 4. Financial Calculation Summary (Mockup Parity) */}
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>تفاصيل السعر:</h3>

          <div className={styles.calcRow}>
            <span className={styles.calcLabel}>سعر الأجهزة:</span>
            <span className={styles.calcVal}>{formatSdg(estimatedSubtotalSdg)}</span>
          </div>

          <div className={styles.calcDiscountRow}>
            <span>خصم الطلب بالتطبيق (3%):</span>
            <span className={styles.discountNum}>- {formatSdg(appDiscount)}</span>
          </div>

          <div className={styles.calcRow}>
            <span className={styles.calcLabel}>رسوم التوصيل:</span>
            <span className={styles.calcVal}>
              {deliveryFee === 0 ? 'مجاني (0 جنيه)' : formatSdg(deliveryFee)}
            </span>
          </div>

          <div className={styles.calcTotalRow}>
            <div>
              <div className={styles.totalLabel}>الإجمالي المطلوب تحويله:</div>
              <div className={styles.totalAmount}>
                {formatSdg(finalTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Checkout Price Notice */}
        <div className={styles.noticeWrapper}>
          <PriceNotice variant="full" lockHours={priceLockHours} />
        </div>

        {/* Price Change Warning if applicable */}
        {hasUnconfirmedPriceChanges && (
          <div className={styles.priceChangeWarning} role="alert">
            <AlertCircle size={16} />
            <span>تغير سعر بعض الأجهزة في السلة. يرجى تأكيد الأسعار الجديدة قبل تثبيت الطلب.</span>
            <button
              type="button"
              className={styles.confirmChangesBtn}
              onClick={confirmAllPriceChanges}
            >
              تأكيد الأسعار الجديدة
            </button>
          </div>
        )}

        <div className={styles.bottomSpacer} />

        {/* 6. Sticky Submit Order Button */}
        <div className={styles.stickySubmitBar}>
          <button
            type="submit"
            disabled={submitting || hasUnconfirmedPriceChanges}
            className={`${styles.submitBtn} btn-vivid`}
          >
            <Lock size={16} />
            <span>{submitting ? 'جاري تثبيت السعر...' : 'تثبيت السعر وإتمام الطلب'}</span>
            <ArrowLeft size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
