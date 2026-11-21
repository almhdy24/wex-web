import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, CreditCard, Sliders, Check, ShoppingBag, Landmark, FileText } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Stepper from '../../components/admin/Stepper';
import { Skeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import styles from './AdminSettingsPage.module.css';

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    // Shop details
    shop_name: 'ويكس تكنولوجي - Wex Technology',
    shop_address: 'مول الواحة، الشهداء، أم درمان، السودان',
    shop_phone: '0912300000',
    shop_whatsapp: '+249912300000',
    working_hours: 'السبت - الخميس: 9:00 ص - 9:00 م',
    shop_map_link: '',
    social_facebook: '',
    social_instagram: '',
    footer_text: '',
    delivery_notes: '',

    // Orders control
    orders_enabled: true,
    orders_disabled_message: 'نعتذر، استقبال الطلبات متوقف مؤقتاً وسنعود لاستقبال طلباتكم قريباً.',

    // Store policies (Inspection, Hand-off & Warranty clarification)
    policy_inspection_title: 'المعاينة وفحص الأجهزة',
    policy_inspection: 'أجهزة مستوردة؛ يعاين العميل الجهاز بنفسه عند الاستلام في المتجر.',
    policy_pickup: 'يمكنك استلام الجهاز من مقرنا في مول الواحة، الشهداء، أم درمان.',
    policy_return: 'نظراً لطبيعة الأجهزة المستوردة، يتم الاستلام بعد المعاينة المباشرة.',
    inspection_note: '',
    returns_note: '',
    extra_delivery_note: '',

    // Bank account
    bank_name: 'بنك الخرطوم (تطبيق بنكك)',
    bank_account_name: 'ويكس للتكنولوجيا والتجارة',
    bank_account_number: '1234567',

    // Ops & pricing
    lock_hours: 4,
    app_discount_percent: 3,
    rounding_step_sdg: 500,
    low_stock_threshold: 2,
  });

  // Independent Saving States
  const [savingSection, setSavingSection] = useState({
    shop: false,
    policies: false,
    orders: false,
    bank: false,
    ops: false,
  });

  const [savedSection, setSavedSection] = useState({
    shop: false,
    policies: false,
    orders: false,
    bank: false,
    ops: false,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getSettings();
      if (res.data) {
        setFormData((prev) => ({
          ...prev,
          ...res.data,
          orders_enabled: res.data.orders_enabled === undefined || res.data.orders_enabled === null
            ? true
            : (res.data.orders_enabled === true || res.data.orders_enabled === 'true' || res.data.orders_enabled === 1 || res.data.orders_enabled === '1'),
        }));
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 1. Save Shop Info Section
  const handleSaveShopInfo = async (e) => {
    e.preventDefault();
    try {
      setSavingSection((prev) => ({ ...prev, shop: true }));
      await adminApi.updateSettings({
        shop_name: formData.shop_name,
        shop_address: formData.shop_address,
        shop_phone: formData.shop_phone,
        shop_whatsapp: formData.shop_whatsapp,
        working_hours: formData.working_hours,
        shop_map_link: formData.shop_map_link,
        social_facebook: formData.social_facebook,
        social_instagram: formData.social_instagram,
        footer_text: formData.footer_text,
        delivery_notes: formData.delivery_notes,
      });
      setSavedSection((prev) => ({ ...prev, shop: true }));
      success('تم حفظ معلومات المتجر والتواصل بنجاح');
      setTimeout(() => setSavedSection((prev) => ({ ...prev, shop: false })), 4000);
    } catch (err) {
      toastError(err.message || 'فشل حفظ معلومات المتجر');
    } finally {
      setSavingSection((prev) => ({ ...prev, shop: false }));
    }
  };

  // 1b. Save Store Policies Section
  const handleSavePolicies = async (e) => {
    e.preventDefault();
    try {
      setSavingSection((prev) => ({ ...prev, policies: true }));
      await adminApi.updateSettings({
        policy_inspection_title: formData.policy_inspection_title || 'معاينة الأجهزة',
        policy_inspection: formData.inspection_note || formData.policy_inspection || '',
        policy_pickup: formData.policy_pickup || '',
        policy_return: formData.returns_note || formData.policy_return || '',
        inspection_note: formData.inspection_note || '',
        returns_note: formData.returns_note || '',
        extra_delivery_note: formData.extra_delivery_note || '',
      });
      setSavedSection((prev) => ({ ...prev, policies: true }));
      success('تم حفظ نصوص الاستلام والسياسات بنجاح');
      setTimeout(() => setSavedSection((prev) => ({ ...prev, policies: false })), 4000);
    } catch (err) {
      toastError(err.message || 'فشل حفظ سياسات المتجر');
    } finally {
      setSavingSection((prev) => ({ ...prev, policies: false }));
    }
  };

  // 2. Save Bank Account Section
  const handleSaveBankInfo = async (e) => {
    e.preventDefault();
    try {
      setSavingSection((prev) => ({ ...prev, bank: true }));
      await adminApi.updateSettings({
        bank_name: formData.bank_name,
        bank_account_name: formData.bank_account_name,
        bank_account_number: formData.bank_account_number,
      });
      setSavedSection((prev) => ({ ...prev, bank: true }));
      success('تم حفظ بيانات حساب بنكك بنجاح');
      setTimeout(() => setSavedSection((prev) => ({ ...prev, bank: false })), 4000);
    } catch (err) {
      toastError(err.message || 'فشل حفظ بيانات الحساب البنكي');
    } finally {
      setSavingSection((prev) => ({ ...prev, bank: false }));
    }
  };

  // 3. Save Order-Taking Control
  const handleSaveOrdersControl = async (e) => {
    e.preventDefault();
    try {
      setSavingSection((prev) => ({ ...prev, orders: true }));
      await adminApi.updateSettings({
        orders_enabled: formData.orders_enabled,
        orders_disabled_message: formData.orders_disabled_message,
      });
      setSavedSection((prev) => ({ ...prev, orders: true }));
      success('تم حفظ حالة استقبال الطلبات بنجاح');
      setTimeout(() => setSavedSection((prev) => ({ ...prev, orders: false })), 4000);
    } catch (err) {
      toastError(err.message || 'فشل حفظ حالة استقبال الطلبات');
    } finally {
      setSavingSection((prev) => ({ ...prev, orders: false }));
    }
  };

  // 4. Save Operations & Pricing Section
  const handleSaveOpsInfo = async (e) => {
    e.preventDefault();
    try {
      setSavingSection((prev) => ({ ...prev, ops: true }));
      await adminApi.updateSettings({
        lock_hours: Number(formData.lock_hours),
        app_discount_percent: Number(formData.app_discount_percent),
        rounding_step_sdg: Number(formData.rounding_step_sdg),
        low_stock_threshold: Number(formData.low_stock_threshold),
      });
      setSavedSection((prev) => ({ ...prev, ops: true }));
      success('تم حفظ تفضيلات التشغيل والتسعير بنجاح');
      setTimeout(() => setSavedSection((prev) => ({ ...prev, ops: false })), 4000);
    } catch (err) {
      toastError(err.message || 'فشل حفظ تفضيلات التشغيل');
    } finally {
      setSavingSection((prev) => ({ ...prev, ops: false }));
    }
  };

  if (loading) {
    return (
      <Page className={styles.container}>
        <Skeleton height="36px" width="300px" />
        <div style={{ height: 16 }} />
        <Skeleton height="350px" borderRadius="var(--radius-lg)" />
      </Page>
    );
  }

  if (error) {
    return (
      <Page className={styles.container}>
        <ErrorState message={error} onRetry={fetchSettings} />
      </Page>
    );
  }

  return (
    <Page className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{adminAr.settings.title}</h1>
        <p className={styles.subtitle}>{adminAr.settings.subtitle}</p>
      </header>

      {/* Decorative Ribbon */}
      <div className={styles.titleDivider} aria-hidden="true" />

      <div className={styles.sectionsStack}>
        {/* Section 1: Order-Taking Control */}
        <form onSubmit={handleSaveOrdersControl} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <ShoppingBag size={18} color="var(--color-royal-blue)" />
              <h2 className={styles.cardTitle}>استقبال الطلبات في المتجر</h2>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <span className={styles.toggleTitle}>
                  {formData.orders_enabled ? 'استقبال الطلبات مفعّل حالياً' : 'استقبال الطلبات متوقف مؤقتاً'}
                </span>
                <span className={styles.toggleDesc}>
                  عند الإيقاف، يظهر تنبيه للمتصفحين في المتجر ويُعطّل إتمام الطلب في سلة الشراء.
                </span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  name="orders_enabled"
                  checked={formData.orders_enabled}
                  onChange={handleChange}
                />
                <span className={styles.slider} />
              </label>
            </div>

            {!formData.orders_enabled && (
              <div className={styles.textareaField}>
                <label className={styles.fieldLabel} htmlFor="orders_disabled_message">
                  رسالة الإيقاف المؤقت (تظهر للعملاء في أعلى المتجر)
                </label>
                <textarea
                  id="orders_disabled_message"
                  name="orders_disabled_message"
                  className={styles.textarea}
                  rows={3}
                  value={formData.orders_disabled_message}
                  onChange={handleChange}
                  placeholder="نعتذر، استقبال الطلبات متوقف مؤقتاً وسنعود لاستقبال طلباتكم قريباً."
                  required
                />
              </div>
            )}
          </div>
          <div className={styles.cardFooter}>
            <div>
              {savedSection.orders && (
                <span className={styles.savedBadge}>
                  <Check size={14} />
                  <span>تم حفظ الحالة</span>
                </span>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingSection.orders}
            >
              <Check size={14} />
              <span>حفظ حالة استقبال الطلبات</span>
            </Button>
          </div>
        </form>

        {/* Section 2: Store Information */}
        <form onSubmit={handleSaveShopInfo} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <Store size={18} color="var(--color-royal-blue)" />
              <h2 className={styles.cardTitle}>{adminAr.settings.storeInfoSection}</h2>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.grid2}>
              <Input
                label={adminAr.settings.shopName}
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                required
              />
              <Input
                label={adminAr.settings.workingHours}
                name="working_hours"
                value={formData.working_hours}
                onChange={handleChange}
                placeholder="مثال: السبت - الخميس: 9:00 ص - 9:00 م"
                required
              />
            </div>

            <div className={styles.grid2}>
              <Input
                label={adminAr.settings.shopAddress}
                name="shop_address"
                value={formData.shop_address}
                onChange={handleChange}
                placeholder="مثال: مول الواحة، الشهداء، أم درمان"
                required
              />
              <Input
                label="رابط الموقع الجغرافي (خرائط Google)"
                name="shop_map_link"
                value={formData.shop_map_link || ''}
                onChange={handleChange}
                placeholder="https://maps.app.goo.gl/..."
                dir="ltr"
              />
            </div>

            <div className={styles.grid2}>
              <Input
                label={adminAr.settings.shopPhone}
                name="shop_phone"
                value={formData.shop_phone}
                onChange={handleChange}
                type="tel"
                dir="ltr"
                required
              />
              <Input
                label={adminAr.settings.shopWhatsapp}
                name="shop_whatsapp"
                value={formData.shop_whatsapp}
                onChange={handleChange}
                type="tel"
                dir="ltr"
                required
              />
            </div>

            <div className={styles.grid2}>
              <Input
                label="صفحة فيسبوك"
                name="social_facebook"
                value={formData.social_facebook || ''}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
                dir="ltr"
              />
              <Input
                label="حساب إنستغرام"
                name="social_instagram"
                value={formData.social_instagram || ''}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
                dir="ltr"
              />
            </div>

            <div className={styles.textareaField}>
              <label className={styles.fieldLabel} htmlFor="delivery_notes">
                ملاحظات ومناطق التوصيل الافتراضية
              </label>
              <textarea
                id="delivery_notes"
                name="delivery_notes"
                className={styles.textarea}
                rows={2}
                value={formData.delivery_notes || ''}
                onChange={handleChange}
                placeholder="توصيل سريع لكافة ولايات ومناطق السودان المتاحة."
              />
            </div>

            <div className={styles.textareaField}>
              <label className={styles.fieldLabel} htmlFor="footer_text">
                نص التذييل الإضافي في واجهة المتجر
              </label>
              <textarea
                id="footer_text"
                name="footer_text"
                className={styles.textarea}
                rows={2}
                value={formData.footer_text || ''}
                onChange={handleChange}
                placeholder="ويكس تكنولوجي - وجهتكم الموثوقة لأجهزة اللابتوب والتقنية في السودان."
              />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <div>
              {savedSection.shop && (
                <span className={styles.savedBadge}>
                  <Check size={14} />
                  <span>تم حفظ التعديلات</span>
                </span>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingSection.shop}
            >
              <Check size={14} />
              <span>حفظ بيانات المتجر</span>
            </Button>
          </div>
        </form>

        {/* Section 2b: Store Policies & Delivery Notes */}
        <form onSubmit={handleSavePolicies} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <FileText size={18} color="var(--color-royal-blue)" />
              <h2 className={styles.cardTitle}>نصوص الاستلام والسياسات (ملاحظات اختيارية)</h2>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.textareaField}>
              <label className={styles.fieldLabel} htmlFor="extra_delivery_note">
                ملاحظة إضافية للشحن والتوصيل (اختياري - تظهر في صفحة المنتج والطلب)
              </label>
              <textarea
                id="extra_delivery_note"
                name="extra_delivery_note"
                className={styles.textarea}
                rows={2}
                value={formData.extra_delivery_note || ''}
                onChange={handleChange}
                placeholder="مثال: التوصيل متاح داخل ولاية الخرطوم والولايات المحددة عبر شركات الشحن..."
              />
            </div>

            <div className={styles.textareaField}>
              <label className={styles.fieldLabel} htmlFor="inspection_note">
                ملاحظة المعاينة عند الاستلام (اختياري)
              </label>
              <textarea
                id="inspection_note"
                name="inspection_note"
                className={styles.textarea}
                rows={2}
                value={formData.inspection_note || ''}
                onChange={handleChange}
                placeholder="مثال: أجهزة مستوردة؛ يعاين العميل الجهاز بنفسه عند الاستلام في المتجر..."
              />
            </div>

            <div className={styles.textareaField}>
              <label className={styles.fieldLabel} htmlFor="returns_note">
                ملاحظة سياسة الاستلام (اختياري)
              </label>
              <textarea
                id="returns_note"
                name="returns_note"
                className={styles.textarea}
                rows={2}
                value={formData.returns_note || ''}
                onChange={handleChange}
                placeholder="مثال: نظراً لطبيعة الأجهزة المستوردة، يتم الاستلام بعد المعاينة المباشرة في مقرنا..."
              />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <div>
              {savedSection.policies && (
                <span className={styles.savedBadge}>
                  <Check size={14} />
                  <span>تم حفظ السياسات</span>
                </span>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingSection.policies}
            >
              <Check size={14} />
              <span>حفظ سياسات المتجر</span>
            </Button>
          </div>
        </form>

        {/* Section 3: Bank Account for Bankak */}
        <form onSubmit={handleSaveBankInfo} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <CreditCard size={18} color="var(--color-royal-blue)" />
              <h2 className={styles.cardTitle}>{adminAr.settings.bankSection}</h2>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.calloutCard} style={{ marginBottom: 'var(--space-3)' }}>
              <div className={styles.calloutText}>
                <span className={styles.calloutTitle}>حسابات الدفع والتحويل المتعددة</span>
                <span className={styles.calloutDesc}>
                  لإضافة بنوك متعددة وترتيبها وتفعيلها أو إيقافها للعملاء، تفضل بزيارة شاشة حسابات الدفع.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/payment-accounts')}
              >
                <Landmark size={14} />
                <span>إدارة حسابات الدفع</span>
              </Button>
            </div>

            <div className={styles.grid3}>
              <Input
                label="اسم البنك / التطبيق"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                required
              />
              <Input
                label={adminAr.settings.bankAccountName}
                name="bank_account_name"
                value={formData.bank_account_name}
                onChange={handleChange}
                required
              />
              <Input
                label={adminAr.settings.bankAccountNumber}
                name="bank_account_number"
                value={formData.bank_account_number}
                onChange={handleChange}
                dir="ltr"
                required
              />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <div>
              {savedSection.bank && (
                <span className={styles.savedBadge}>
                  <Check size={14} />
                  <span>تم حفظ التعديلات</span>
                </span>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingSection.bank}
            >
              <Check size={14} />
              <span>حفظ بيانات بنكك</span>
            </Button>
          </div>
        </form>

        {/* Section 4: Operations, Price Lock & Discounts */}
        <form onSubmit={handleSaveOpsInfo} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <Sliders size={18} color="var(--color-royal-blue)" />
              <h2 className={styles.cardTitle}>تفضيلات التشغيل والتسعير</h2>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.grid2}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-slate-700)' }}>
                  {adminAr.settings.priceLockHours}
                </label>
                <Stepper
                  value={Number(formData.lock_hours)}
                  min={1}
                  max={24}
                  onChange={(val) => setFormData((prev) => ({ ...prev, lock_hours: val }))}
                  ariaLabel="تعديل ساعات تثبيت السعر"
                />
                <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                  المهلة الافتراضية لتحويل بنكك ورفع الإشعار
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-slate-700)' }}>
                  {adminAr.settings.appDiscountPercent}
                </label>
                <Stepper
                  value={Number(formData.app_discount_percent)}
                  min={0}
                  max={50}
                  onChange={(val) => setFormData((prev) => ({ ...prev, app_discount_percent: val }))}
                  ariaLabel="تعديل نسبة خصم التطبيق"
                />
                <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                  خصم تلقائي يطبق على سلة الطلب في المتجر (افتراضي 3%)
                </span>
              </div>
            </div>

            <div className={styles.grid2}>
              <Input
                label={adminAr.settings.roundingStep}
                name="rounding_step_sdg"
                type="number"
                value={formData.rounding_step_sdg}
                onChange={handleChange}
                dir="ltr"
                min="1"
                step="100"
                helperText="تقريب مبالغ الجنيه السوداني لأقرب مضاعف (مثلاً: 500 ج.س)"
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-slate-700)' }}>
                  حد التنبيه للمخزون المنخفض
                </label>
                <Stepper
                  value={Number(formData.low_stock_threshold)}
                  min={1}
                  max={10}
                  onChange={(val) => setFormData((prev) => ({ ...prev, low_stock_threshold: val }))}
                  ariaLabel="تعديل حد المخزون المنخفض"
                />
                <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                  إظهار تنبيه عند وصول كمية الجهاز إلى هذا الحد أو أقل
                </span>
              </div>
            </div>
          </div>
          <div className={styles.cardFooter}>
            <div>
              {savedSection.ops && (
                <span className={styles.savedBadge}>
                  <Check size={14} />
                  <span>تم حفظ التعديلات</span>
                </span>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingSection.ops}
            >
              <Check size={14} />
              <span>حفظ تفضيلات التشغيل</span>
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
