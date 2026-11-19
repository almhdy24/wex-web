import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
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
      showToast('تم حفظ الإعدادات بنجاح', 'success');
    } catch (err) {
      showToast(err.message || 'فشل في حفظ الإعدادات', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <Skeleton height="40px" width="300px" className="mb-4" />
        <Skeleton height="350px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <ErrorState message={error} onRetry={fetchSettings} />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">إعدادات النظام والمتجر</h1>
          <p className="admin-page-subtitle">
            بيانات التواصل، الحساب البنكي لبنكك، مدة تثبيت السعر، وتنبيهات المخزون
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Shop Information */}
          <div className="card">
            <h2 className="admin-section-heading">بيانات المتجر والتواصل</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              <div className="form-group">
                <label className="form-label required">اسم المتجر</label>
                <input
                  type="text"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">رقم هاتف المتجر</label>
                <input
                  type="text"
                  name="shop_phone"
                  value={formData.shop_phone}
                  onChange={handleChange}
                  className="form-control"
                  dir="ltr"
                  placeholder="0912345678"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">رقم الواتساب الرسمي</label>
                <input
                  type="text"
                  name="shop_whatsapp"
                  value={formData.shop_whatsapp}
                  onChange={handleChange}
                  className="form-control"
                  dir="ltr"
                  placeholder="0912345678"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ساعات العمل الرسمية</label>
                <input
                  type="text"
                  name="working_hours"
                  value={formData.working_hours}
                  onChange={handleChange}
                  placeholder="السبت - الخميس: 9:00 ص - 9:00 م"
                  className="form-control"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label required">عنوان المحل بأم درمان</label>
                <input
                  type="text"
                  name="shop_address"
                  value={formData.shop_address}
                  onChange={handleChange}
                  placeholder="أم درمان، الشهداء، شارع العرضة..."
                  className="form-control"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bank Payment Info */}
          <div className="card">
            <h2 className="admin-section-heading">بيانات حساب بنكك (Bankak) للتحويل</h2>
            <p className="text-muted text-sm mb-3">
              تظهر هذه البيانات للعملاء في صفحة إتمام الطلب وتفاصيل الدفع لنسخ رقم الحساب والتحويل المباشر.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              <div className="form-group">
                <label className="form-label required">اسم البنك</label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">اسم صاحب الحساب</label>
                <input
                  type="text"
                  name="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">رقم حساب بنكك</label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  className="form-control font-semibold"
                  dir="ltr"
                  required
                />
              </div>
            </div>
          </div>

          {/* Operational & Pricing Policies */}
          <div className="card">
            <h2 className="admin-section-heading">سياسات الطلبات والتسعير</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              <div className="form-group">
                <label className="form-label required">مدة تثبيت السعر (ساعات)</label>
                <input
                  type="number"
                  name="lock_hours"
                  min="1"
                  max="72"
                  value={formData.lock_hours}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
                <span className="text-muted text-xs">
                  المدة الافتراضية لقفل سعر الطلب بالجنيه السوداني للعميل لتحويل المبلغ.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label required">خطوة تقريب الأسعار (SDG)</label>
                <input
                  type="number"
                  name="rounding_step_sdg"
                  min="1"
                  step="50"
                  value={formData.rounding_step_sdg}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
                <span className="text-muted text-xs">
                  تقريب السعر المحسوب لأقرب مضاعف (افتراضياً: 500 جنيه).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label required">حد تنبيه انخفاض المخزون</label>
                <input
                  type="number"
                  name="low_stock_threshold"
                  min="0"
                  value={formData.low_stock_threshold}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
                <span className="text-muted text-xs">
                  عند وصول كمية الجهاز إلى هذا الرقم أو أقل يظهر في تنبيهات لوحة التحكم.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">نسبة خصم الطلب عبر الموقع (%)</label>
                <input
                  type="number"
                  name="app_discount_percent"
                  min="0"
                  max="100"
                  value={formData.app_discount_percent}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
