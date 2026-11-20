import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  Truck,
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productsApi } from '../../api/products';
import { api } from '../../api/client';
import { formatSdg, getProductImageUrl, normalizeSudanPhone, isValidSudanPhone } from '../../utils/formatters';
import LaptopSvg from '../../components/common/LaptopSvg';
import PriceNotice from '../../components/common/PriceNotice';
import styles from './CheckoutPage.module.css';

const DRAFT_STORAGE_KEY = 'wex_checkout_draft';
const SAVED_PHONE_KEY = 'wex_saved_contact_phone';

export default function CheckoutPage() {
  const {
    items,
    clearCart,
    estimatedSubtotalSdg,
    refreshCartPrices,
    confirmAllPriceChanges,
    hasUnconfirmedPriceChanges,
  } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError, info: toastInfo } = useToast();
  const navigate = useNavigate();

  // Load draft values if present
  const [draft] = useState(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [orderType, setOrderType] = useState(draft.orderType || 'pickup');
  const [shippingZones, setShippingZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(draft.selectedZoneId || '');
  const [deliveryAddress, setDeliveryAddress] = useState(draft.deliveryAddress || '');
  const [contactPhone, setContactPhone] = useState(() => {
    if (draft.contactPhone) return draft.contactPhone;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SAVED_PHONE_KEY);
        if (saved) return saved;
      } catch {
        // storage unavailable
      }
    }
    return user?.phone || '';
  });
  const [customerNotes, setCustomerNotes] = useState(draft.customerNotes || '');
  const [shopInfo, setShopInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync draft to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          orderType,
          selectedZoneId,
          deliveryAddress,
          contactPhone,
          customerNotes,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [orderType, selectedZoneId, deliveryAddress, contactPhone, customerNotes]);

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
      if (zList.length > 0 && !selectedZoneId) {
        setSelectedZoneId(String(zList[0].id));
      }
      setShopInfo(shopRes?.data || null);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshCartPrices, selectedZoneId]);

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

    // Validate phone
    const cleanPhone = normalizeSudanPhone(contactPhone.trim());
    if (!cleanPhone) {
      setErrors({ contact_phone: 'رقم الهاتف للتواصل مطلوب' });
      return;
    }
    if (!isValidSudanPhone(cleanPhone)) {
      setErrors({ contact_phone: 'يرجى إدخال رقم سوداني صحيح (يبدأ بـ 09 أو 01 ويتكون من 10 أرقام)' });
      return;
    }

    try {
      localStorage.setItem(SAVED_PHONE_KEY, cleanPhone);
    } catch {
      // storage unavailable
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

    // Guest Flow: If customer is not authenticated, save draft and redirect to login
    if (!isAuthenticated) {
      toastInfo('يرجى تسجيل الدخول أو إدخال بريدك لإتمام تثبيت السعر والطلب');
      navigate('/login?returnTo=/checkout', { state: { from: '/checkout' } });
      return;
    }

    setSubmitting(true);

    const payload = {
      order_type: orderType,
      contact_phone: cleanPhone,
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
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // storage cleanup
      }
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
      {/* 3-Step Checkout Progress Header */}
      <div className={styles.progressContainer}>
        <div className={styles.progressTrack}>
          {/* Step 1: Cart */}
          <Link to="/cart" className={`${styles.progressStep} ${styles.stepCompleted}`}>
            <span className={styles.stepCircle}>
              <CheckCircle2 size={16} />
            </span>
            <span className={styles.stepText}>السلة</span>
          </Link>

          <div className={`${styles.stepConnector} ${styles.connectorActive}`} />

          {/* Step 2: Order Info (Active) */}
          <div className={`${styles.progressStep} ${styles.stepActive}`}>
            <span className={styles.stepCircle}>2</span>
            <span className={styles.stepText}>بيانات الطلب</span>
          </div>

          <div className={styles.stepConnector} />

          {/* Step 3: Payment */}
          <div className={`${styles.progressStep} ${styles.stepUpcoming}`}>
            <span className={styles.stepCircle}>3</span>
            <span className={styles.stepText}>تثبيت السعر والدفع</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className={styles.checkoutForm}>
        <div className={styles.checkoutLayout}>
          {/* Left/Start Form Column */}
          <div className={styles.formColumn}>
            {/* Delivery Method Selector */}
            <div className={styles.card}>
              <h2 className={styles.cardHeading}>طريقة الاستلام</h2>

              <div className={styles.deliveryGrid}>
                <div
                  className={`${styles.deliveryBox} ${orderType === 'pickup' ? styles.deliveryBoxSelected : ''}`}
                  onClick={() => setOrderType('pickup')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setOrderType('pickup');
                  }}
                >
                  <div className={styles.boxTitle}>
                    <Store size={18} />
                    <span>استلام من المحل (مجاني)</span>
                  </div>
                  <div className={styles.boxDesc}>مول الواحة، الشهداء، أم درمان</div>
                  <div className={styles.boxBadge}>جاهز فور تأكيد الإشعار</div>
                </div>

                <div
                  className={`${styles.deliveryBox} ${orderType === 'delivery' ? styles.deliveryBoxSelected : ''}`}
                  onClick={() => setOrderType('delivery')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setOrderType('delivery');
                  }}
                >
                  <div className={styles.boxTitle}>
                    <Truck size={18} />
                    <span>توصيل للعنوان</span>
                  </div>
                  <div className={styles.boxDesc}>أم درمان والخرطوم والولايات</div>
                  <div className={styles.boxBadge}>خلال 24 إلى 48 ساعة</div>
                </div>
              </div>

              {/* Delivery Zone & Address Fields */}
              {orderType === 'delivery' && (
                <div className={styles.deliveryDetails}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} htmlFor="zoneSelect">
                      المدينة / منطقة التوصيل:
                    </label>
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
                    <label className={styles.inputLabel} htmlFor="deliveryAddress">
                      العنوان بالتفصيل:
                    </label>
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

            {/* Customer Contact & Notes */}
            <div className={styles.card}>
              <h2 className={styles.cardHeading}>بيانات الاتصال والمطابقة</h2>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="contactPhone">
                  رقم هاتف التواصل والواتساب:
                </label>
                <div className={styles.inputWithIcon}>
                  <Phone size={16} className={styles.inputIcon} />
                  <input
                    id="contactPhone"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0912345678"
                    className={`${styles.input} ${styles.inputPadded}`}
                    required
                  />
                </div>
                {errors.contact_phone && (
                  <span className={styles.fieldError}>{errors.contact_phone}</span>
                )}
                <span className={styles.fieldHint}>
                  رقم سوداني فعال لمطابقة إشعار تحويل بنكك وتأكيد الاستلام.
                </span>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="customerNotes">
                  ملاحظات إضافية (اختياري):
                </label>
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

            {/* "What's Next" Explainer Card */}
            <div className={styles.whatsNextCard}>
              <h3 className={styles.whatsNextTitle}>ماذا بعد تثبيت السعر؟</h3>
              <div className={styles.stepsList}>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumberBadge}>1</div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepItemTitle}>حجز الجهاز وتثبيت السعر</span>
                    <span className={styles.stepItemDesc}>
                      يتم تجميد السعر بالجنيه لمدة {priceLockHours} ساعات فور الضغط على زر التثبيت.
                    </span>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepNumberBadge}>2</div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepItemTitle}>التحويل عبر تطبيق بنكك</span>
                    <span className={styles.stepItemDesc}>
                      تحوّل المبلغ إلى حساب المتجر المعروض وترفع صورة إشعار التحويل من نفس الصفحة.
                    </span>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepNumberBadge}>3</div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepItemTitle}>الاستلام أو التوصيل السريع</span>
                    <span className={styles.stepItemDesc}>
                      فور مراجعة الإشعار يُجهّز جهازك فورًا مع الضمان المعتمد والفاتورة.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right/End Sticky Summary Column */}
          <div className={styles.summaryColumn}>
            <div className={styles.stickySummaryCard}>
              <h2 className={styles.summaryHeading}>مراجعة الطلب</h2>

              {/* Items List Mini */}
              <div className={styles.itemsPreviewList}>
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

              {/* Price Breakdown */}
              <div className={styles.breakdownCard}>
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

                <div className={styles.calcDivider} />

                <div className={styles.calcTotalRow}>
                  <div>
                    <span className={styles.totalLabel}>الإجمالي المطلوب تحويله:</span>
                    <span className={styles.totalSub}>شامل الخصم ورسوم التوصيل</span>
                  </div>
                  <div className={styles.totalAmount}>{formatSdg(finalTotal)}</div>
                </div>
              </div>

              {/* Price Notice Card */}
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

              {/* Desktop Submit Button (Inside Sticky Summary) */}
              <div className={styles.desktopSubmitWrap}>
                <button
                  type="submit"
                  disabled={submitting || hasUnconfirmedPriceChanges}
                  className={`${styles.desktopSubmitBtn} btn-vivid`}
                >
                  <Lock size={18} />
                  <span>
                    {submitting
                      ? 'جاري تثبيت السعر...'
                      : !isAuthenticated
                      ? 'تسجيل الدخول لتثبيت السعر'
                      : 'تثبيت السعر وإتمام الطلب'}
                  </span>
                  <ArrowLeft size={16} />
                </button>
              </div>

              <div className={styles.guaranteeNote}>
                <ShieldAlert size={14} className={styles.guaranteeIcon} />
                <span>
                  السعر ثابت ومضمون بالجنيه لمدة {priceLockHours} ساعات حتى مع تقلبات أسعار الصرف.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomSpacer} />

        {/* Mobile/Tablet Sticky Submit Bar */}
        <div className={styles.stickySubmitBar}>
          <div className={styles.mobileTotalInfo}>
            <span className={styles.mobileTotalLabel}>المطلوب تحويله:</span>
            <span className={styles.mobileTotalAmount}>{formatSdg(finalTotal)}</span>
          </div>

          <button
            type="submit"
            disabled={submitting || hasUnconfirmedPriceChanges}
            className={`${styles.submitBtn} btn-vivid`}
          >
            <Lock size={16} />
            <span>
              {submitting
                ? 'جاري التثبيت...'
                : !isAuthenticated
                ? 'الدخول والتثبيت'
                : 'تثبيت السعر والطلب'}
            </span>
            <ArrowLeft size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
