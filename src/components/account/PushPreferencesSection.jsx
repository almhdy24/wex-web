import React, { useState } from 'react';
import { Bell, Smartphone, Trash2, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { usePush } from '../../context/PushContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './PushPreferencesSection.module.css';

const CUSTOMER_CATEGORIES = [
  { key: 'order_updates', label: 'تحديثات حالة الطلب', desc: 'تأكيد الطلب، التجهيز، الجاهزية للاستلام والتوصيل' },
  { key: 'payment_updates', label: 'تحديثات الدفع والتحويل', desc: 'استلام إشعار التحويل، الاعتماد أو طلب المراجعة' },
  { key: 'price_alerts', label: 'تنبيهات حجز السعر', desc: 'تذكير قبل انتهاء مهلة حجز السعر' },
  { key: 'announcements', label: 'الإعلانات والعروض', desc: 'إعلانات المتجر والتحديثات العامة' },
];

const ADMIN_CATEGORIES = [
  { key: 'new_orders', label: 'الطلبات الجديدة', desc: 'تنبيه فوري عند إنشاء طلب جديد' },
  { key: 'receipts', label: 'إشعارات التحويل', desc: 'تنبيه عند رفع إشعار تحويل أو تأخر المراجعة' },
  { key: 'low_stock', label: 'انخفاض المخزون', desc: 'تنبيه عند وصول منتج لحد المخزون المنخفض' },
];

export default function PushPreferencesSection() {
  const push = usePush();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [testing, setTesting] = useState(false);
  const [savingKey, setSavingKey] = useState(null);

  if (!push) return null;

  const {
    pushState,
    isSubscribed,
    preferences,
    subscriptions,
    busy,
    enablePush,
    disablePush,
    updatePreferences,
    removeDevice,
    sendTestPush,
  } = push;

  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
  const categories = isStaffOrAdmin
    ? [...CUSTOMER_CATEGORIES, ...ADMIN_CATEGORIES]
    : CUSTOMER_CATEGORIES;

  const handleMasterToggle = async () => {
    try {
      if (isSubscribed) {
        await disablePush();
        success('تم إيقاف الإشعارات على هذا الجهاز');
      } else {
        const res = await enablePush();
        if (res?.ok) {
          success('تم تفعيل الإشعارات على هذا الجهاز');
        } else if (res?.state === 'denied') {
          toastError('الإشعارات محظورة في إعدادات المتصفح');
        } else if (res?.state === 'needs-install-on-ios') {
          toastError('أضف المتجر إلى الشاشة الرئيسية أولاً على iPhone');
        } else {
          toastError('تعذر تفعيل الإشعارات على هذا المتصفح');
        }
      }
    } catch (err) {
      toastError(err?.message || 'تعذر تحديث حالة الإشعارات');
    }
  };

  const handleCategoryToggle = async (key) => {
    if (!preferences) return;
    setSavingKey(key);
    try {
      await updatePreferences({ [key]: !preferences[key] });
    } catch (err) {
      toastError(err?.message || 'تعذر حفظ التفضيلات');
    } finally {
      setSavingKey(null);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await sendTestPush();
      success('تم إرسال الإشعار التجريبي');
    } catch (err) {
      toastError(err?.message || 'تعذر إرسال الإشعار التجريبي');
    } finally {
      setTesting(false);
    }
  };

  const handleRemoveDevice = async (id) => {
    try {
      await removeDevice(id);
      success('تمت إزالة الجهاز');
    } catch (err) {
      toastError(err?.message || 'تعذر إزالة الجهاز');
    }
  };

  return (
    <section id="notifications-settings" className={styles.section} aria-label="إعدادات الإشعارات">
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Bell size={18} />
          <h2>الإشعارات</h2>
        </div>
        <button
          type="button"
          className={`${styles.masterBtn} ${isSubscribed ? styles.masterBtnActive : ''}`}
          onClick={handleMasterToggle}
          disabled={busy || pushState === 'unsupported'}
          aria-pressed={isSubscribed}
        >
          {busy ? 'جاري التحديث...' : isSubscribed ? 'مفعّلة على هذا الجهاز' : 'تفعيل على هذا الجهاز'}
        </button>
      </div>

      {pushState === 'denied' && (
        <div className={styles.noticeWarn}>
          <AlertTriangle size={16} />
          <span>الإشعارات محظورة من المتصفح. اسمح بالإشعارات من إعدادات الموقع ثم أعد المحاولة.</span>
        </div>
      )}

      {pushState === 'needs-install-on-ios' && (
        <div className={styles.noticeInfo}>
          <AlertTriangle size={16} />
          <span>على أجهزة iPhone: أضف المتجر إلى الشاشة الرئيسية أولاً لتتمكن من تفعيل الإشعارات.</span>
        </div>
      )}

      {pushState === 'unsupported' && (
        <div className={styles.noticeInfo}>
          <span>هذا المتصفح لا يدعم الإشعارات الفورية، ستستمر الإشعارات بالظهور داخل التطبيق.</span>
        </div>
      )}

      {preferences && (
        <div className={styles.prefList}>
          {categories.map((cat) => {
            const checked = Boolean(preferences[cat.key]);
            return (
              <label key={cat.key} className={styles.prefRow}>
                <div className={styles.prefText}>
                  <span className={styles.prefLabel}>{cat.label}</span>
                  <span className={styles.prefDesc}>{cat.desc}</span>
                </div>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={checked}
                  disabled={savingKey === cat.key}
                  onChange={() => handleCategoryToggle(cat.key)}
                />
              </label>
            );
          })}
        </div>
      )}

      <div className={styles.testRow}>
        <button
          type="button"
          className={styles.testBtn}
          onClick={handleTest}
          disabled={testing}
        >
          <Send size={15} />
          <span>{testing ? 'جاري الإرسال...' : 'إرسال إشعار تجريبي'}</span>
        </button>
      </div>

      <div className={styles.devicesBlock}>
        <h3 className={styles.subTitle}>الأجهزة المسجلة ({subscriptions.length})</h3>
        {subscriptions.length === 0 ? (
          <p className={styles.emptyDevices}>لا توجد أجهزة مفعّلة للإشعارات الفورية حالياً.</p>
        ) : (
          <ul className={styles.deviceList}>
            {subscriptions.map((sub) => (
              <li key={sub.id} className={styles.deviceItem}>
                <div className={styles.deviceInfo}>
                  <Smartphone size={16} />
                  <div>
                    <div className={styles.deviceLabel}>{sub.device_label}</div>
                    <div className={styles.deviceMeta}>
                      {sub.platform} • {sub.provider}
                      {sub.last_success_at ? (
                        <span className={styles.verifiedTag}>
                          <CheckCircle2 size={12} /> نشط
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleRemoveDevice(sub.id)}
                  aria-label={`إزالة ${sub.device_label}`}
                >
                  <Trash2 size={15} />
                  <span>إزالة</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
