import React, { useState, useEffect } from 'react';
import { Store, CreditCard, Sliders, Check } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Stepper from '../../components/admin/Stepper';
import { Skeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminSettingsPage.module.css';

export default function AdminSettingsPage() {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    shop_name: 'ويكس تكنولوجي - Wex Technology',
    shop_address: 'مول الواحة، الشهداء، أم درمان، السودان',
    shop_phone: '0912300000',
    shop_whatsapp: '+249912300000',
    working_hours: 'السبت - الخميس: 9:00 ص - 9:00 م',
    bank_name: 'بنك الخرطوم (تطبيق بنكك)',
    bank_account_name: 'ويكس للتكنولوجيا والتجارة',
    bank_account_number: '1234567',
    lock_hours: 4,
    app_discount_percent: 3,
    rounding_step_sdg: 500,
    low_stock_threshold: 2,
  });

  // Independent Saving States
  const [savingSection, setSavingSection] = useState({
    shop: false,
    bank: false,
    ops: false,
  });

  const [savedSection, setSavedSection] = useState({
    shop: false,
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  // 3. Save Operations & Pricing Section
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
      <div className={styles.container}>
        <Skeleton height="36px" width="300px" />
        <div style={{ height: 16 }} />
        <Skeleton height="350px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <ErrorState message={error} onRetry={fetchSettings} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{adminAr.settings.title}</h1>
        <p className={styles.subtitle}>{adminAr.settings.subtitle}</p>
      </header>

      {/* Decorative Ribbon */}
      <div className={styles.titleDivider} aria-hidden="true" />

      <div className={styles.sectionsStack}>
        {/* Section 1: Store Information */}
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
                placeholder="مثال: 9:00 ص - 9:00 م"
                required
              />
            </div>

            <Input
              label={adminAr.settings.shopAddress}
              name="shop_address"
              value={formData.shop_address}
              onChange={handleChange}
              placeholder="مثال: مول الواحة، الشهداء، أم درمان"
              required
            />

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

        {/* Section 2: Bank Account for Bankak */}
        <form onSubmit={handleSaveBankInfo} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <CreditCard size={18} color="var(--color-royal-blue)" />
              <h2 className={styles.cardTitle}>{adminAr.settings.bankSection}</h2>
            </div>
          </div>
          <div className={styles.cardBody}>
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

        {/* Section 3: Operations, Price Lock & Discounts */}
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
    </div>
  );
}
