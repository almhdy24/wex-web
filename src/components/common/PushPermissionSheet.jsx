import React, { useState } from 'react';
import { Bell, Share, AlertCircle, X } from 'lucide-react';
import { usePush } from '../../context/PushContext';
import styles from './PushPermissionSheet.module.css';

export default function PushPermissionSheet({
  variant = 'customer', // 'customer' | 'admin'
  onClose,
}) {
  const push = usePush();
  const [localDismissed, setLocalDismissed] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!push || localDismissed) return null;

  const { pushState, isSubscribed, busy, canShowPrompt, enablePush, dismissPrompt } = push;

  if (isSubscribed || pushState === 'granted') {
    return null;
  }

  if (pushState === 'unsupported') {
    return null;
  }

  // Respect 30-day cooldown for default/denied banners unless explicitly opened
  if (pushState === 'default' && !canShowPrompt) {
    return null;
  }

  const handleEnable = async () => {
    setFeedback('');
    const res = await enablePush();
    if (res?.ok) {
      setLocalDismissed(true);
      onClose?.();
    } else if (res?.state === 'denied') {
      setFeedback('تم رفض الإذن من المتصفح. يمكنك تفعيله لاحقاً من إعدادات الموقع.');
    } else if (res?.state === 'disabled') {
      setFeedback('خدمة الإشعارات الفورية غير مفعّلة حالياً من الإدارة.');
    }
  };

  const handleDismiss = () => {
    dismissPrompt(30);
    setLocalDismissed(true);
    onClose?.();
  };

  if (pushState === 'needs-install-on-ios') {
    return (
      <section className={styles.card} role="region" aria-label="تفعيل إشعارات آيفون">
        <div className={styles.iconWrap}>
          <Share size={20} />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>إشعارات الطلبات على iPhone</h3>
          <p className={styles.desc}>
            لتصلك تنبيهات تأكيد الدفع وحالة الطلب على iPhone، أضف المتجر أولاً إلى الشاشة الرئيسية عبر زر المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية»، وبعدها فعّل الإشعارات من داخل التطبيق المثبّت.
          </p>
        </div>
        <button type="button" className={styles.closeBtn} onClick={handleDismiss} aria-label="إغلاق">
          <X size={16} />
        </button>
      </section>
    );
  }

  if (pushState === 'denied') {
    return (
      <section className={`${styles.card} ${styles.cardWarning}`} role="region" aria-label="تنبيه صلاحية الإشعارات">
        <div className={styles.iconWrapWarning}>
          <AlertCircle size={20} />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>الإشعارات محظورة في المتصفح</h3>
          <p className={styles.desc}>
            لتفعيل الإشعارات: افتح إعدادات الموقع (أيقونة القفل بجانب العنوان) واختر السماح بالإشعارات، ثم أعد تحميل الصفحة.
          </p>
        </div>
        <button type="button" className={styles.closeBtn} onClick={handleDismiss} aria-label="إغلاق">
          <X size={16} />
        </button>
      </section>
    );
  }

  return (
    <section
      className={`${styles.card} ${variant === 'admin' ? styles.cardAdmin : ''}`}
      role="region"
      aria-label="تفعيل الإشعارات الفورية"
    >
      <div className={styles.iconWrap}>
        <Bell size={20} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>
          {variant === 'admin' ? 'تفعيل تنبيهات الإدارة الفورية' : 'فعّل إشعارات الطلب'}
        </h3>
        <p className={styles.desc}>
          {variant === 'admin'
            ? 'احصل على إشعار فوري عند وصول طلب جديد أو رفع إشعار تحويل بنكي أو انخفاض المخزون.'
            : 'نُعلمك بتأكيد الدفع وحالة طلبك فور تحديثها دون الحاجة لتحديث الصفحة.'}
        </p>
        {feedback && <p className={styles.feedback}>{feedback}</p>}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.enableBtn}
            onClick={handleEnable}
            disabled={busy}
          >
            {busy ? 'جاري التفعيل...' : 'تفعيل الإشعارات'}
          </button>
          <button
            type="button"
            className={styles.laterBtn}
            onClick={handleDismiss}
            disabled={busy}
          >
            لاحقاً
          </button>
        </div>
      </div>
    </section>
  );
}
