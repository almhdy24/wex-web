import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { formatSdg, formatAed, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function AdminRatesPage() {
  const { showToast } = useToast();
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
      showToast('يرجى إدخال سعر صرف صحيح أكبر من الصفر', 'error');
      return;
    }
    setConfirmModal({ open: true, submitting: false });
  };

  const handleConfirmSubmit = async () => {
    const val = Number(newRateInput);
    try {
      setConfirmModal((prev) => ({ ...prev, submitting: true }));
      await adminApi.updateRate(val);
      showToast('تم تحديث سعر الصرف بنجاح', 'success');
      setConfirmModal({ open: false, submitting: false });
      setNewRateInput('');
      setPage(1);
      fetchRates();
    } catch (err) {
      showToast(err.message || 'فشل في تحديث سعر الصرف', 'error');
      setConfirmModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">إدارة أسعار الصرف (AED ↔ SDG)</h1>
          <p className="admin-page-subtitle">
            تحديث سعر صرف الدرهم الإماراتي مقابل الجنيه السوداني وتتبع التغيرات التاريخية
          </p>
        </div>
      </div>

      {/* Current Rate Card & Update Form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ borderTop: '4px solid var(--wex-cyan)' }}>
          <span className="text-muted text-sm font-semibold">سعر الصرف الحالي النشط</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '14px 0' }}>
            <span style={{ fontSize: '36px', fontWeight: '800', color: 'var(--wex-navy)' }}>
              1 AED =
            </span>
            <span style={{ fontSize: '36px', fontWeight: '800', color: 'var(--wex-royal)' }}>
              {currentRate ? `${Number(currentRate).toLocaleString('en-US')} SDG` : '—'}
            </span>
          </div>
          <p className="text-muted text-xs">
            يتم احتساب جميع أسعار البيع في المتجر بالجنيه السوداني تلقائياً وفق هذا السعر.
          </p>
        </div>

        <div className="card">
          <h2 className="admin-section-heading mb-2">تحديث سعر الصرف</h2>
          <div className="alert alert-warning mb-3" style={{ padding: '8px 12px', fontSize: '13px' }}>
            <strong>تنبيه:</strong> تحديث سعر الصرف ينعكس فورياً على جميع المنتجات المعروضة في المتجر.
          </div>
          <form onSubmit={handleUpdateClick} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="أدخل السعر الجديد (مثال: 850)"
              value={newRateInput}
              onChange={(e) => setNewRateInput(e.target.value)}
              className="form-control"
              required
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              تحديث السعر
            </button>
          </form>
        </div>
      </div>

      {/* Historical Rates Table */}
      <div className="card p-0">
        <div className="p-4 border-bottom">
          <h2 className="admin-section-heading mb-0">سجل التغييرات السابقة لأسعار الصرف</h2>
        </div>

        {loading ? (
          <div className="p-4">
            <Skeleton height="40px" className="mb-2" />
            <Skeleton height="40px" className="mb-2" />
            <Skeleton height="40px" />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={fetchRates} />
          </div>
        ) : rates.length === 0 ? (
          <div className="p-4">
            <EmptyState title="لا يوجد سجل سابق" description="لم يتم تسجيل أي تعديلات على سعر الصرف بعد." />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>#</th>
                  <th>سعر الصرف (1 AED)</th>
                  <th>تاريخ التعديل</th>
                  <th>المسؤول عن التعديل</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r, index) => {
                  const rateVal = r.rate_sdg || r.rate;
                  return (
                    <tr key={r.id || index}>
                      <td className="text-muted text-center">#{r.id || index + 1}</td>
                      <td className="font-semibold text-navy">
                        {rateVal ? `${Number(rateVal).toLocaleString('en-US')} ج.س` : '—'}
                      </td>
                      <td className="text-muted">{formatDate(r.created_at)}</td>
                      <td>
                        <span className="badge badge-secondary">
                          {r.created_by_name || r.user_name || r.user?.name || 'مدير النظام'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="admin-pagination mt-4">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            السابق
          </button>
          <span className="pagination-info">
            صفحة {meta.page} من {meta.total_pages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= meta.total_pages}
            onClick={() => setPage((prev) => Math.min(meta.total_pages, prev + 1))}
          >
            التالي
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <Modal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, submitting: false })}
          title="تأكيد تغيير سعر الصرف"
        >
          <div className="p-2">
            <p className="mb-3">
              هل أنت متأكد من تغيير سعر الصرف إلى:{' '}
              <strong className="text-royal font-bold" style={{ fontSize: '18px' }}>
                1 AED = {newRateInput} SDG
              </strong>
              ؟
            </p>
            <p className="text-muted text-sm mb-4">
              سيتم إعادة حساب أسعار جميع الأجهزة في المتجر فوراً، ولن تتأثر الطلبات التي تم إنشاؤها وقفل
              سعرها مسبقاً.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={confirmModal.submitting}
                onClick={() => setConfirmModal({ open: false, submitting: false })}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={confirmModal.submitting}
                onClick={handleConfirmSubmit}
              >
                {confirmModal.submitting ? 'جاري الحفظ...' : 'تأكيد التحديث'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
