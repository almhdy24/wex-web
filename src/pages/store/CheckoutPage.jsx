import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Truck, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productsApi } from '../../api/products';
import { shopApi } from '../../api/shop';
import { api } from '../../api/client';
import { formatSdg, isValidSudanPhone } from '../../utils/formatters';
import AppBar from '../../components/common/AppBar';
import Button from '../../components/common/Button';
import Page from '../../components/common/Page';
import Price from '../../components/common/Price';
import NoticeLine from '../../components/common/NoticeLine';
import StickyBar from '../../components/common/StickyBar';
import AuthSheet from '../../components/auth/AuthSheet';
import styles from './CheckoutPage.module.css';

const SAVED_PHONE_KEY = 'wex_saved_contact_phone';
const CHECKOUT_DRAFT_KEY = 'wex_checkout_draft';

export default function CheckoutPage({
  initialShippingZones = null,
  initialShopInfo = null,
} = {}) {
  const {
    items,
    clearCart,
    estimatedSubtotalSdg,
    refreshCartPrices,
  } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
      return draft.orderType || 'pickup';
    } catch {
      return 'pickup';
    }
  }); // 'pickup' | 'delivery'

  const [shippingZones, setShippingZones] = useState(initialShippingZones || []);

  const [selectedZoneId, setSelectedZoneId] = useState(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
      return draft.selectedZoneId || '';
    } catch {
      return '';
    }
  });

  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
      return draft.deliveryAddress || '';
    } catch {
      return '';
    }
  });

  const [contactPhone, setContactPhone] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(SAVED_PHONE_KEY);
        if (saved) return saved;
      } catch {
        // storage unavailable
      }
    }
    return user?.phone || '';
  });
  const [customerNotes, setCustomerNotes] = useState('');
  const [shopInfo, setShopInfo] = useState(initialShopInfo);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

  // Save checkout draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify({ orderType, selectedZoneId, deliveryAddress })
      );
    } catch {
      // storage unavailable
    }
  }, [orderType, selectedZoneId, deliveryAddress]);

  // Autofill phone from user when authenticated
  useEffect(() => {
    if (user?.phone && !contactPhone) {
      setContactPhone(user.phone);
    }
  }, [user?.phone, contactPhone]);

  // Load zones & shop settings
  useEffect(() => {
    if (initialShippingZones !== null && initialShopInfo !== null) return;
    let isMounted = true;
    refreshCartPrices();

    Promise.all([
      productsApi.getShippingZones().catch(() => ({ data: [] })),
      shopApi.getShop().catch(() => ({ data: null })),
    ]).then(([zonesRes, shopRes]) => {
      if (!isMounted) return;
      const zList = zonesRes?.data || [];
      setShippingZones(zList);
      setSelectedZoneId((current) => {
        if (current) return current;
        return zList.length > 0 ? String(zList[0].id) : '';
      });
      setShopInfo(shopRes?.data || null);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshCartPrices, initialShippingZones, initialShopInfo]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !submitting) {
      navigate('/cart', { replace: true });
    }
  }, [items, navigate, submitting]);

  // Financial calculations
  const subtotal = estimatedSubtotalSdg;
  const discount = Math.round(subtotal * 0.03);
  const selectedZone = shippingZones.find((z) => String(z.id) === String(selectedZoneId));
  const shippingFee = orderType === 'delivery' ? Number(selectedZone?.delivery_fee_sdg || selectedZone?.fee_sdg || 0) : 0;
  const total = Math.max(0, subtotal - discount + shippingFee);
  const lockHours = shopInfo?.lock_hours || shopInfo?.price_lock_hours || 4;

  // Validate phone on blur
  const handlePhoneBlur = () => {
    const cleanPhone = contactPhone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone) {
      setErrors((prev) => ({ ...prev, contactPhone: 'يرجى إدخال رقم الهاتف' }));
    } else if (!isValidSudanPhone(cleanPhone)) {
      setErrors((prev) => ({
        ...prev,
        contactPhone: 'يرجى إدخال رقم هاتف سوداني صحيح يبدأ بـ 09 أو 01 أو 012',
      }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.contactPhone;
        return next;
      });
    }
  };

  // Validate fields
  const validateForm = () => {
    const errs = {};
    const cleanPhone = contactPhone.trim().replace(/[\s-]/g, '');

    if (!cleanPhone) {
      errs.contactPhone = 'يرجى إدخال رقم الهاتف';
    } else if (!isValidSudanPhone(cleanPhone)) {
      errs.contactPhone = 'يرجى إدخال رقم هاتف سوداني صحيح يبدأ بـ 09 أو 01 أو 012';
    }

    if (orderType === 'delivery') {
      if (!selectedZoneId) {
        errs.selectedZoneId = 'يرجى اختيار المنطقة';
      }
      if (!deliveryAddress.trim()) {
        errs.deliveryAddress = 'يرجى كتابة العنوان بالتفصيل';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Execute order submission
  const executeOrderCreation = async () => {
    setSubmitting(true);
    const cleanPhone = contactPhone.trim().replace(/[\s-]/g, '');

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SAVED_PHONE_KEY, cleanPhone);
        localStorage.removeItem(CHECKOUT_DRAFT_KEY);
      }
    } catch {
      // storage unavailable
    }

    const payload = {
      order_type: orderType,
      contact_phone: cleanPhone,
      notes: customerNotes.trim() || undefined,
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    };

    if (orderType === 'delivery') {
      payload.shipping_zone_id = Number(selectedZoneId);
      payload.delivery_address = deliveryAddress.trim();
    }

    try {
      const res = await api.post('/orders', payload);
      const createdOrder = res?.data;
      const orderNumber = createdOrder?.order_number || createdOrder?.id;

      // Clear cart ONLY on success
      clearCart();
      success('تم تأكيد الطلب بنجاح');

      navigate(`/orders/${orderNumber}`, {
        replace: true,
        state: { justCreated: true },
      });
    } catch (err) {
      toastError(err.message || 'تعذر تأكيد الطلب، يرجى المحاولة مرة أخرى');
      setSubmitting(false);
    }
  };

  // Submit button handler
  const handleConfirmOrder = () => {
    if (!validateForm()) return;

    if (!isAuthenticated) {
      setIsAuthSheetOpen(true);
      return;
    }

    executeOrderCreation();
  };

  // Callback when AuthSheet signs in successfully
  const handleAuthSuccess = () => {
    executeOrderCreation();
  };

  return (
    <div className={styles.pageWrapper}>
      <AppBar
        tone="navy"
        overlap={36}
        title="تأكيد الطلب"
        showBack={true}
      />

      <Page className={styles.container}>
      {/* Section 1: طريقة الاستلام */}
      <section className={styles.sectionCard} aria-labelledby="delivery-type-heading">
        <h2 id="delivery-type-heading" className={styles.sectionHeading}>
          طريقة الاستلام
        </h2>

        <div className={styles.optionsRow} role="radiogroup" aria-label="طريقة الاستلام">
          <button
            type="button"
            role="radio"
            aria-checked={orderType === 'pickup'}
            className={`${styles.optionBtn} ${orderType === 'pickup' ? styles.optionBtnActive : ''}`}
            onClick={() => setOrderType('pickup')}
          >
            <div className={styles.optionHeader}>
              <Store size={20} strokeWidth={1.75} aria-hidden="true" />
              <span className={styles.optionTitle}>الاستلام من المحل</span>
            </div>
            <span className={styles.optionSub}>مجانًا</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={orderType === 'delivery'}
            className={`${styles.optionBtn} ${orderType === 'delivery' ? styles.optionBtnActive : ''}`}
            onClick={() => setOrderType('delivery')}
          >
            <div className={styles.optionHeader}>
              <Truck size={20} strokeWidth={1.75} aria-hidden="true" />
              <span className={styles.optionTitle}>التوصيل</span>
            </div>
            <span className={styles.optionSub}>حسب المنطقة</span>
          </button>
        </div>

        {/* Pickup Info */}
        {orderType === 'pickup' && (
          <div className={styles.pickupInfoCard}>
            <div className={styles.pickupInfoRow}>
              <strong>العنوان:</strong>
              <span>{shopInfo?.address || 'مول الواحة، الشهداء، أم درمان'}</span>
            </div>
            <div className={styles.pickupInfoRow}>
              <strong>ساعات العمل:</strong>
              <span>{shopInfo?.business_hours || 'السبت - الخميس: 9:00 ص - 9:00 م، الجمعة: مغلق'}</span>
            </div>
          </div>
        )}

        {/* Delivery Fields */}
        {orderType === 'delivery' && (
          <div className={styles.deliveryFields}>
            <div className={styles.fieldGroup}>
              <label htmlFor="checkout-zone-select" className={styles.fieldLabel}>
                المنطقة
              </label>
              <select
                id="checkout-zone-select"
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className={styles.select}
              >
                {shippingZones.map((z) => {
                  const fee = Number(z.delivery_fee_sdg || z.fee_sdg || 0);
                  const feeText = fee === 0 ? 'مجانًا' : formatSdg(fee);
                  return (
                    <option key={z.id} value={z.id}>
                      {z.zone_name || z.name} - {feeText}
                    </option>
                  );
                })}
              </select>
              {errors.selectedZoneId && (
                <span className={styles.fieldError}>{errors.selectedZoneId}</span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="checkout-address-input" className={styles.fieldLabel}>
                العنوان بالتفصيل
              </label>
              <textarea
                id="checkout-address-input"
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="اسم الشارع، رقم المنزل، أو أقرب معلم بارز"
                className={styles.textarea}
              />
              {errors.deliveryAddress && (
                <span className={styles.fieldError}>{errors.deliveryAddress}</span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section 2: التواصل */}
      <section className={styles.sectionCard} aria-labelledby="contact-heading">
        <h2 id="contact-heading" className={styles.sectionHeading}>
          التواصل
        </h2>

        <div className={styles.fieldGroup}>
          <label htmlFor="checkout-phone-input" className={styles.fieldLabel}>
            رقم الهاتف
          </label>
          <input
            id="checkout-phone-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            onBlur={handlePhoneBlur}
            aria-invalid={Boolean(errors.contactPhone)}
            aria-describedby={errors.contactPhone ? "checkout-phone-error checkout-phone-helper" : "checkout-phone-helper"}
            placeholder="09XXXXXXXX"
            className={styles.input}
            dir="ltr"
          />
          <span id="checkout-phone-helper" className={styles.fieldHelper}>
            نتواصل معك على هذا الرقم بشأن طلبك.
          </span>
          {errors.contactPhone && (
            <span id="checkout-phone-error" role="alert" className={styles.fieldError}>{errors.contactPhone}</span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="checkout-notes-input" className={styles.fieldLabel}>
            ملاحظات (اختياري)
          </label>
          <textarea
            id="checkout-notes-input"
            rows={2}
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="أي تعليمات إضافية بخصوص الطلب"
            className={styles.textarea}
          />
        </div>
      </section>

      {/* Section 3: Summary Card */}
      <section className={styles.summaryCard} aria-labelledby="order-summary-heading">
        <h2 id="order-summary-heading" className={styles.sectionHeading}>
          ملخص الطلب
        </h2>

        {/* Collapsible Order Items Review */}
        <details className={styles.itemsReviewDetails}>
          <summary className={styles.itemsReviewSummary}>
            مراجعة الأجهزة ({items.length})
          </summary>
          <div className={styles.itemsReviewList}>
            {items.map((item) => (
              <div key={item.id} className={styles.reviewItemRow}>
                <span className={styles.reviewItemName} dir="auto">
                  {item.name} × {item.quantity}
                </span>
                <Price value={(item.price_sdg || 0) * item.quantity} size="sm" tone="navy" />
              </div>
            ))}
          </div>
        </details>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>المجموع</span>
          <span className={styles.summaryValue}><Price value={subtotal} size="md" tone="navy" /></span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>خصم التطبيق (3%)</span>
          <span className={styles.discountValue}>- <Price value={discount} size="md" tone="success" /></span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>رسوم التوصيل</span>
          <span className={styles.summaryValue}>
            {orderType === 'pickup' || shippingFee === 0 ? 'مجانًا' : <Price value={shippingFee} size="md" tone="navy" />}
          </span>
        </div>

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>الإجمالي</span>
          <span className={styles.totalValue}><Price value={total} size="lg" tone="royal" /></span>
        </div>
      </section>

      {/* Sticky Bottom Bar */}
      <StickyBar hideOnInput={true}>
        <div className={styles.stickyContent}>
          <NoticeLine variant="secondary" className={styles.lockNoticeLine}>
            بعد التأكيد يُثبَّت السعر لمدة {lockHours} ساعات لتحوّل المبلغ وترفع إشعار التحويل.
          </NoticeLine>

          <Button
            variant="primary"
            onClick={handleConfirmOrder}
            disabled={submitting || items.length === 0}
            className={styles.confirmBtn}
          >
            {submitting ? (
              <Loader2 size={18} className={styles.spinner} />
            ) : (
              <span>تأكيد الطلب</span>
            )}
          </Button>
        </div>
      </StickyBar>

      {/* Auth Bottom Sheet (for signed-out users) */}
      <AuthSheet
        isOpen={isAuthSheetOpen}
        onClose={() => setIsAuthSheetOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </Page>
    </div>
  );
}
