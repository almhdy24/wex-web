import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { formatDate } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 25, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  // Details Modal
  const [detailsModal, setDetailsModal] = useState({ open: false, log: null });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        per_page: 25,
      };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;

      const res = await adminApi.getAuditLogs(params);
      setLogs(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل سجل العمليات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const handleActionBadge = (action) => {
    if (action.includes('delete')) return 'badge badge-danger';
    if (action.includes('update') || action.includes('review') || action.includes('status')) return 'badge badge-primary';
    if (action.includes('create')) return 'badge badge-success';
    return 'badge badge-secondary';
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">سجل العمليات الإدارية (Audit Trail)</h1>
          <p className="admin-page-subtitle">
            تتبع كافة الإجراءات والقرارات التي تم اتخاذها في لوحة التحكم وتاريخها وهوية الفاعل
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card admin-filter-bar mb-4">
        <div className="admin-filter-form">
          <div className="filter-item">
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="form-control"
            >
              <option value="">جميع الكيانات</option>
              <option value="orders">الطلبات (Orders)</option>
              <option value="payment_proofs">إشعارات الدفع (Proofs)</option>
              <option value="products">الأجهزة والمنتجات (Products)</option>
              <option value="settings">إعدادات المتجر (Settings)</option>
              <option value="rates">أسعار الصرف (Rates)</option>
              <option value="users">المستخدمين (Users)</option>
              <option value="shipping_zones">مناطق التوصيل (Shipping Zones)</option>
            </select>
          </div>

          <div className="filter-item search-item">
            <input
              type="text"
              placeholder="فلترة بنوع الإجراء (مثال: approve, update_status)..."
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="card">
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="لا توجد سجلات مطابقة"
          description="لم يتم العثور على أي إجراءات مسجلة بهذه الفلاتر."
        />
      ) : (
        <div className="card p-0 table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>#</th>
                <th>نوع الإجراء</th>
                <th>الكيان / المعرف</th>
                <th>المستخدم المسؤول</th>
                <th>عنوان IP</th>
                <th>التاريخ والوقت</th>
                <th style={{ width: '90px', textAlign: 'center' }}>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-muted text-center">#{log.id}</td>
                  <td>
                    <span className={handleActionBadge(log.action)}>{log.action}</span>
                  </td>
                  <td>
                    <span className="font-semibold">{log.entity}</span>
                    {log.entity_id ? ` #${log.entity_id}` : ''}
                  </td>
                  <td>
                    {log.user ? (
                      <div>
                        <span className="font-semibold text-navy">{log.user.name || 'مستخدم'}</span>
                        <span className="text-muted text-xs block">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted">نظام آلي (System)</span>
                    )}
                  </td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>
                    <code>{log.ip_address || '—'}</code>
                  </td>
                  <td className="text-muted text-sm">{formatDate(log.created_at)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setDetailsModal({ open: true, log })}
                    >
                      عرض
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
            صفحة {meta.page} من {meta.total_pages} (الإجمالي: {meta.total} سجل)
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

      {/* Details Modal */}
      {detailsModal.open && detailsModal.log && (
        <Modal
          isOpen={detailsModal.open}
          onClose={() => setDetailsModal({ open: false, log: null })}
          title={`تفاصيل العملية #${detailsModal.log.id}`}
        >
          <div className="p-2">
            <div className="mb-3">
              <span className="text-muted text-xs">نوع الإجراء:</span>
              <p className="font-bold">{detailsModal.log.action}</p>
            </div>
            <div className="mb-3">
              <span className="text-muted text-xs">الكيان والمعرف:</span>
              <p className="font-semibold">
                {detailsModal.log.entity} #{detailsModal.log.entity_id || '—'}
              </p>
            </div>
            <div className="mb-3">
              <span className="text-muted text-xs">بيانات التغييرات (Payload / Changes):</span>
              <pre
                style={{
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '6px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  direction: 'ltr',
                  textAlign: 'left',
                  fontSize: '12px',
                }}
              >
                {typeof detailsModal.log.details === 'object'
                  ? JSON.stringify(detailsModal.log.details, null, 2)
                  : String(detailsModal.log.details || 'لا توجد تفاصيل إضافية')}
              </pre>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDetailsModal({ open: false, log: null })}
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
