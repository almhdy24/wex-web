import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Page from '../../components/common/Page';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { PLACEMENTS, formatKhartoum } from './promotions/promoLogic';
import styles from './AdminPromotions.module.css';

const STATUS_CLASS = { نشط: 'chipActive', مجدول: 'chipScheduled', منتهي: 'chipEnded', متوقف: 'chipPaused' };

export default function AdminPromotionsPage() {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPromotions();
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e.message || 'تعذر تحميل العروض');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, okMsg) => {
    try {
      await fn();
      success(okMsg);
      load();
    } catch (e) {
      toastError(/[؀-ۿ]/.test(e?.message || '') ? e.message : 'تعذر تنفيذ الإجراء');
    }
  };

  return (
    <Page className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>العروض والإعلانات</h1>
          <p className={styles.sub}>بنرات الصفحة الرئيسية والمتجر والسلة: جدولة، معاينة، وإحصاءات النقرات.</p>
        </div>
        <Link to="/admin/promotions/new" className={`${styles.btn} ${styles.btnPrimary}`}>إضافة عرض</Link>
      </header>

      {loading ? <Skeleton height="96px" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && items.length === 0 ? (
        <div className={styles.empty}>لا توجد عروض بعد. أضف أول عرض ليظهر في الصفحة الرئيسية.</div>
      ) : null}

      <div className={styles.list}>
        {items.map((p) => (
          <article key={p.id} className={styles.row}>
            {p.image_url ? (
              <img className={styles.thumb} src={p.image_url} alt="" loading="lazy" />
            ) : (
              <div className={`${styles.thumb} ${styles.thumbText}`}>نص فقط</div>
            )}
            <div className={styles.meta}>
              <div className={styles.name}>{p.title}</div>
              <div className={styles.line}>
                <span className={`${styles.chip} ${styles[STATUS_CLASS[p.status]] || ''}`}>{p.status}</span>
                <span>{PLACEMENTS.find((x) => x.value === p.placement)?.label || p.placement}</span>
                <span>{p.starts_at ? formatKhartoum(p.starts_at) : 'فوراً'} – {p.ends_at ? formatKhartoum(p.ends_at) : 'بدون نهاية'}</span>
              </div>
              <div className={`${styles.line} ${styles.stat}`}>
                <span>مشاهدات: {p.views}</span>
                <span>نقرات: {p.clicks}</span>
                <span>نسبة النقر: {p.ctr}%</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.btn} onClick={() => navigate(`/admin/promotions/${p.id}/edit`)}>تعديل</button>
              <button type="button" className={styles.btn} onClick={() => act(() => adminApi.togglePromotion(p.id), p.is_active ? 'تم إيقاف العرض' : 'تم تفعيل العرض')}>
                {p.is_active ? 'إيقاف' : 'تفعيل'}
              </button>
              <button type="button" className={styles.btn} onClick={() => act(() => adminApi.duplicatePromotion(p.id), 'تم نسخ العرض')}>نسخ</button>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setToDelete(p)}>حذف</button>
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          const id = toDelete.id;
          setToDelete(null);
          await act(() => adminApi.deletePromotion(id), 'تم حذف العرض');
        }}
        title="حذف العرض"
        message={`هل تريد حذف العرض «${toDelete?.title}» نهائياً؟`}
        confirmText="تأكيد الحذف"
        variant="danger"
      />
    </Page>
  );
}
