import { useState, useEffect } from 'react';
import { Coins, Check, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminCommon.module.css';

export default function AdminRatesPage() {
  const { success, error: toastError } = useToast();
  const [rates, setRates] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form input
  const [newRateInput, setNewRateInput] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, submitting: false });

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getRates({ page, per_page: 15 });
      const items = res.data || [];
      setRates(items);
      if (items.length > 0 && page === 1) {
        setCurrentRate(items[0].rate_sdg || items[0].rate || null);
      }
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل سجل أسعار الصرف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [page]);

  const handleUpdateClick = (e) => {
    e.preventDefault();
    const val = Number(newRateInput);
    if (!val || val <= 0) {
      toastError('يرجى إدخال سعر صرف صحيح أكبر من الصفر');
      return;
    }
    setConfirmModal({ open: true, submitting: false });
  };

  const handleConfirmSubmit = async () => {
    const val = Number(newRateInput);
    try {
      setConfirmModal((prev) => ({ ...prev, submitting: true }));
      await adminApi.updateRate(val);
      success('تم تحديث سعر الصرف بنجاح');
      setConfirmModal({ open: false, submitting: false });
      setNewRateInput('');
      setPage(1);
      fetchRates();
    } catch (err) {
      toastError(err.message || 'فشل تحديث سعر الصرف');
      setConfirmModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className={styles.title}>إدارة أسعار الصرف (AED ↔ SDG)</h1>
            <span className={styles.adminOnlyBadge}>للإدارة فقط</span>
          </div>
          <p className={styles.subtitle}>
            تحديث سعر صرف الدرهم الإماراتي مقابل الجنيه السوداني وتتبع التغيرات التاريخية
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchRates}>
          <RefreshCw size={14} />
          <span>تحديث</span>
        </Button>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Current Rate & Update Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>سعر الصرف الحالي النشط</h2>
            <Coins size={18} style={{ color: 'var(--color-royal-blue)' }} />
          </div>
          <div className={styles.cardBody}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-navy)' }}>
                1 درهم =
              </span>
              <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-royal-blue)', fontVariantNumeric: 'tabular-nums' }}>
                {currentRate ? `${Number(currentRate).toLocaleString('en-US')} جنيه` : '—'}
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 'var(--space-2) 0 0' }}>
              تعتمد كافة أسعار المنتجات المعروضة بالمتجر على هذا السعر الحالي.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>تحديث سعر الصرف</h2>
          </div>
          <div className={styles.cardBody}>
            <form onSubmit={handleUpdateClick} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="سعر الصرف الجديد (جنيه لكل درهم)"
                type="number"
                placeholder="مثال: 660"
                min="1"
                step="any"
                value={newRateInput}
                onChange={(e) => setNewRateInput(e.target.value)}
                required
                dir="ltr"
                hint="يتم تطبيقه فوراً على جميع الأجهزة في المتجر"
              />

              <Button type="submit" variant="primary" size="md">
                <Check size={16} />
                <span>حفظ السعر الجديد</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Rate History Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>سجل التغيرات التاريخية لسعر الصرف</h2>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRates} />
        ) : rates.length === 0 ? (
          <EmptyState
            title="لا توجد بيانات سابقة"
            description="لم يتم تسجيل أي تغيرات سابقة في أسعار الصرف."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>تاريخ التحديث</th>
                  <th>سعر الصرف (SDG)</th>
                  <th>بواسطة</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r, i) => (
                  <tr key={r.id || i}>
                    <td className={styles.dateText}>{formatDate(r.created_at)}</td>
                    <td className={styles.totalPrice}>
                      1 AED = {Number(r.rate_sdg || r.rate).toLocaleString('en-US')} SDG
                    </td>
                    <td>{r.creator_name || r.user_name || 'النظام'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.total_pages > 1 && (
          <nav className={styles.pagination} aria-label="تنقل الصفحات">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              السابق
            </Button>
            <span className={styles.pageCount}>
              صفحة {meta.page} من {meta.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.total_pages}
              onClick={() => setPage((prev) => Math.min(meta.total_pages, prev + 1))}
            >
              التالي
            </Button>
          </nav>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, submitting: false })}
        title="تأكيد تحديث سعر الصرف"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmModal({ open: false, submitting: false })}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              loading={confirmModal.submitting}
              onClick={handleConfirmSubmit}
            >
              تأكيد التحديث
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-slate-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
          هل أنت متأكد من رغبتك في تحديث سعر الصرف المعتمد إلى:
          <br />
          <strong style={{ color: 'var(--color-royal-blue)', fontSize: 'var(--text-lg)', fontVariantNumeric: 'tabular-nums' }}>
            1 AED = {Number(newRateInput).toLocaleString('en-US')} SDG
          </strong>؟
          <br />
          سيتم تحديث أسعار جميع الأجهزة فوراً.
        </p>
      </Modal>
    </div>
  );
}
