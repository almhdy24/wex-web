import { useState, useEffect } from 'react';
import { Save, Store, CreditCard, Sliders } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminCommon.module.css';

export default function AdminSettingsPage() {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    shop_whatsapp: '',
    working_hours: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    lock_hours: 4,
    app_discount_percent: 0,
    rounding_step_sdg: 500,
    low_stock_threshold: 2,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        shop_name: formData.shop_name,
        shop_address: formData.shop_address,
        shop_phone: formData.shop_phone,
        shop_whatsapp: formData.shop_whatsapp,
        working_hours: formData.working_hours,
        bank_name: formData.bank_name,
        bank_account_name: formData.bank_account_name,
        bank_account_number: formData.bank_account_number,
        lock_hours: Number(formData.lock_hours),
        app_discount_percent: Number(formData.app_discount_percent),
        rounding_step_sdg: Number(formData.rounding_step_sdg),
        low_stock_threshold: Number(formData.low_stock_threshold),
      };

      await adminApi.updateSettings(payload);
      success('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      toastError(err.message || 'فشل في حفظ الإعدادات');
    } finally {
      setSubmitting(false);
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
    return <ErrorState message={error} onRetry={fetchSettings} />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>إعدادات المتجر العامة</h1>
          <p className={styles.subtitle}>
            تكوين بيانات المتجر، الحساب البنكي المعتمد للتحويلات، وقواعد تثبيت الأسعار
          </p>
        </div>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Shop Info Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>بيانات المتجر والتواصل</h2>
            <Store size={18} style={{ color: 'var(--color-royal-blue)' }} />
          </div>
          <div className={styles.cardBody}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="اسم المتجر"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                required
              />

              <Input
                label="هاتف التواصل الرئيسي"
                name="shop_phone"
                value={formData.shop_phone}
                onChange={handleChange}
                dir="ltr"
                required
              />

              <Input
                label="رقم واتساب المعتمد"
                name="shop_whatsapp"
                value={formData.shop_whatsapp}
                onChange={handleChange}
                dir="ltr"
                hint="بدون إشارات أو مسافات (مثال: 249912345678)"
              />
            </div>

            <Input
              label="العنوان الجغرافي"
              name="shop_address"
              value={formData.shop_address}
              onChange={handleChange}
              required
            />

            <Input
              label="ساعات وأوقات العمل"
              name="working_hours"
              value={formData.working_hours}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Bankak Details Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>بيانات التحويل البنكي (بنكك)</h2>
            <CreditCard size={18} style={{ color: 'var(--color-royal-blue)' }} />
          </div>
          <div className={styles.cardBody}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="اسم البنك"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                required
              />

              <Input
                label="اسم صاحب الحساب"
                name="bank_account_name"
                value={formData.bank_account_name}
                onChange={handleChange}
                required
              />

              <Input
                label="رقم الحساب البنكي"
                name="bank_account_number"
                value={formData.bank_account_number}
                onChange={handleChange}
                dir="ltr"
                required
              />
            </div>
          </div>
        </div>

        {/* Operational Policies Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>سياسات الطلب وتثبيت الأسعار</h2>
            <Sliders size={18} style={{ color: 'var(--color-royal-blue)' }} />
          </div>
          <div className={styles.cardBody}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="مدة تثبيت السعر (ساعات)"
                type="number"
                name="lock_hours"
                value={formData.lock_hours}
                onChange={handleChange}
                min="1"
                max="48"
                dir="ltr"
                hint="المدة المتاحة للعميل لتحويل المبلغ ورفع الإشعار"
                required
              />

              <Input
                label="نسبة خصم التطبيق (%)"
                type="number"
                name="app_discount_percent"
                value={formData.app_discount_percent}
                onChange={handleChange}
                min="0"
                max="50"
                dir="ltr"
                hint="خصم تلقائي للطلبات المنفذة عبر المتجر"
                required
              />

              <Input
                label="خطوة تقريب السعر بالسوداني (SDG)"
                type="number"
                name="rounding_step_sdg"
                value={formData.rounding_step_sdg}
                onChange={handleChange}
                min="1"
                dir="ltr"
                hint="مثال: 500 لتقريب الأسعار لأقرب 500 جنيه"
                required
              />

              <Input
                label="حد تنبيه انخفاض المخزون"
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleChange}
                min="1"
                dir="ltr"
                hint="الكمية التي يعتبر عندها الجهاز منخفض المخزون"
                required
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="primary" size="lg" loading={submitting}>
            <Save size={18} />
            <span>حفظ جميع الإعدادات</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
