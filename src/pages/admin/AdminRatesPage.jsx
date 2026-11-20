import React, { useState, useEffect, useMemo } from 'react';
import { Coins, Check, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { formatDate, formatSdg, formatAed } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminRatesPage.module.css';

export default function AdminRatesPage() {
  const { success, error: toastError } = useToast();
  const [rates, setRates] = useState([]);
  const [currentRateObj, setCurrentRateObj] = useState(null);
  const [sampleProducts, setSampleProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form input
  const [newRateInput, setNewRateInput] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ratesRes, prodsRes] = await Promise.all([
        adminApi.getRates({ page, per_page: 30 }),
        adminApi.getProducts({ per_page: 20 }),
      ]);

      const items = ratesRes.data || [];
      setRates(items);
      if (items.length > 0 && page === 1) {
        setCurrentRateObj(items[0]);
      }
      if (ratesRes.meta) {
        setMeta(ratesRes.meta);
      }

      // Pick sample products (e.g. cheapest, median, most expensive)
      const pList = prodsRes.data || [];
      if (pList.length > 0) {
        const sorted = [...pList].sort((a, b) => Number(a.price_aed) - Number(b.price_aed));
        const samples = [];
        samples.push(sorted[0]); // cheapest
        if (sorted.length > 2) {
          samples.push(sorted[Math.floor(sorted.length / 2)]); // median
        }
        if (sorted.length > 1) {
          samples.push(sorted[sorted.length - 1]); // highest
        }
        setSampleProducts(samples);
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

  const currentRate = currentRateObj ? Number(currentRateObj.rate_sdg || currentRateObj.rate) : 0;
  const newRateNum = Number(newRateInput) || 0;

  // Rate change percentage
  const rateChangePercent = useMemo(() => {
    if (!currentRate || !newRateNum) return 0;
    return Math.abs(((newRateNum - currentRate) / currentRate) * 100);
  }, [currentRate, newRateNum]);

  const isLargeChange = rateChangePercent > 10;

  const handleUpdateClick = (e) => {
    e.preventDefault();
    if (!newRateNum || newRateNum <= 0) {
      toastError('يرجى إدخال سعر صرف صحيح أكبر من الصفر');
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      await adminApi.updateRate(newRateNum);
      success('تم تحديث سعر الصرف وتحديث أسعار المتجر فوراً');
      setConfirmOpen(false);
      setNewRateInput('');
      setPage(1);
      fetchRates();
    } catch (err) {
      toastError(err.message || 'فشل تحديث سعر الصرف');
    } finally {
      setSubmitting(false);
    }
  };

  // Sparkline coordinates generator
  const sparklinePoints = useMemo(() => {
    if (!rates || rates.length < 2) return '';
    // Use chronological order (oldest to newest)
    const reversed = [...rates].reverse();
    const values = reversed.map((r) => Number(r.rate_sdg || r.rate) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 500;
    const height = 70;
    const padding = 10;

    return values
      .map((val, idx) => {
        const x = (idx / (values.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - min) / range) * (height - padding * 2) - padding;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [rates]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{adminAr.rates.title}</h1>
            <span className={styles.adminBadge}>للإدارة فقط</span>
          </div>
          <p className={styles.subtitle}>{adminAr.rates.subtitle}</p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchRates}>
          <RefreshCw size={14} />
          <span>تحديث</span>
        </Button>
      </header>

      {/* Decorative Ribbon */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Top Grid: Current Rate & Update Form */}
      <div className={styles.topGrid}>
        {/* Active Rate Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>سعر الصرف المعتمد حالياً</h2>
            <Coins size={18} color="var(--color-royal-blue)" />
          </div>
          <div className={styles.cardBody}>
            <div className={styles.rateDisplay}>
              <span className={styles.ratePrefix}>1 درهم إماراتي =</span>
              <span className={styles.rateValue}>
                {currentRate ? currentRate.toLocaleString('en-US') : '—'}
              </span>
              <span className={styles.rateUnit}>جنيه سوداني</span>
            </div>

            {currentRateObj && (
              <div className={styles.metaText}>
                {adminAr.rates.lastUpdateInfo
                  .replace('{date}', formatDate(currentRateObj.created_at))
                  .replace('{user}', currentRateObj.creator_name || currentRateObj.user_name || 'المدير العام')}
              </div>
            )}
          </div>
        </div>

        {/* Update Form */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>تحديث سعر الصرف</h2>
            <TrendingUp size={18} color="var(--color-royal-blue)" />
          </div>
          <div className={styles.cardBody}>
            <form onSubmit={handleUpdateClick} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label={adminAr.rates.newRateLabel}
                type="number"
                placeholder="مثال: 680"
                min="1"
                step="any"
                value={newRateInput}
                onChange={(e) => setNewRateInput(e.target.value)}
                required
                dir="ltr"
                helperText="يتم تطبيقه فوراً على جميع الأجهزة في المتجر"
              />

              {isLargeChange && (
                <div className={styles.warningBox} role="alert">
                  <AlertTriangle size={16} />
                  <span>{adminAr.rates.largeChangeWarning}</span>
                </div>
              )}

              <Button type="submit" variant="primary" size="md">
                <Check size={16} />
                <span>معاينة وتأكيد السعر الجديد</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Price Impact Preview (When user enters a new rate) */}
      {newRateNum > 0 && sampleProducts.length > 0 && (
        <div className={styles.impactCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{adminAr.rates.impactPreviewTitle}</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.impactTable}>
              <thead>
                <tr>
                  <th>الجهاز التجريبي</th>
                  <th>السعر بالدرهم</th>
                  <th>{adminAr.rates.oldPrice}</th>
                  <th>{adminAr.rates.newPrice}</th>
                  <th>{adminAr.rates.priceDifference}</th>
                </tr>
              </thead>
              <tbody>
                {sampleProducts.map((p) => {
                  const oldSdg = Math.round(Number(p.price_aed) * currentRate);
                  const newSdg = Math.round(Number(p.price_aed) * newRateNum);
                  const diff = newSdg - oldSdg;
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{formatAed(p.price_aed)}</td>
                      <td>{formatSdg(oldSdg)}</td>
                      <td style={{ fontWeight: 800, color: 'var(--color-royal-blue)' }}>
                        {formatSdg(newSdg)}
                      </td>
                      <td className={diff >= 0 ? styles.diffPos : styles.diffNeg}>
                        {diff >= 0 ? `+${formatSdg(diff)}` : formatSdg(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 30-Day SVG Sparkline */}
      {sparklinePoints && (
        <div className={styles.sparklineCard}>
          <div className={styles.sparklineHeader}>
            <h2 className={styles.cardTitle}>مخطط حركة سعر الصرف (آخر 30 تحديث)</h2>
            <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>رسم بياني خفيف</span>
          </div>
          <svg className={styles.sparklineSvg} viewBox="0 0 500 70" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="var(--color-royal-blue)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparklinePoints}
            />
          </svg>
        </div>
      )}

      {/* Rate History Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{adminAr.rates.rateHistoryTitle}</h2>
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
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.impactTable}>
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
                    <td>{formatDate(r.created_at)}</td>
                    <td style={{ fontWeight: 800, color: 'var(--color-navy)' }}>
                      1 AED = {Number(r.rate_sdg || r.rate).toLocaleString('en-US')} SDG
                    </td>
                    <td>{r.creator_name || r.user_name || 'المدير العام'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.total_pages > 1 && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              السابق
            </Button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
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
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title={adminAr.rates.confirmRateTitle}
        message={`هل أنت متأكد من تحديث سعر الصرف إلى (1 AED = ${newRateNum.toLocaleString('en-US')} SDG)؟ ${adminAr.rates.confirmRateDesc}`}
        confirmText="تأكيد تحديث السعر"
        variant="primary"
        loading={submitting}
      />
    </div>
  );
}
