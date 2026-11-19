import { useState, useEffect } from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatDate } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminCommon.module.css';

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
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const getActionVariant = (action) => {
    if (action.includes('delete')) return 'danger';
    if (action.includes('update') || action.includes('review') || action.includes('status')) return 'info';
    if (action.includes('create') || action.includes('approve')) return 'success';
    return 'neutral';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>سجل العمليات الإدارية (Audit Trail)</h1>
          <p className={styles.subtitle}>
            تتبع كافة الإجراءات والقرارات التي تم اتخاذها في لوحة التحكم وتاريخها
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw size={14} />
          <span>تحديث</span>
        </Button>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Filters Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarForm}>
          <Select
            label="الكيان"
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'جميع الكيانات' },
              { value: 'orders', label: 'الطلبات (Orders)' },
              { value: 'payment_proofs', label: 'إشعارات الدفع (Proofs)' },
              { value: 'products', label: 'الأجهزة والمنتجات (Products)' },
              { value: 'settings', label: 'إعدادات المتجر (Settings)' },
              { value: 'rates', label: 'أسعار الصرف (Rates)' },
              { value: 'users', label: 'المستخدمين (Users)' },
              { value: 'shipping_zones', label: 'مناطق التوصيل (Shipping Zones)' },
            ]}
          />

          <Input
            label="نوع الإجراء"
            placeholder="مثال: approve, update_status..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={10} cols={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="لا توجد عمليات مسجلة"
          description="لم يتم تسجيل أي عمليات تطابق معايير التصفية الحالية."
        />
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>التاريخ والوقت</th>
                  <th>المستخدم / الموظف</th>
                  <th>الإجراء</th>
                  <th>الكيان المستهدف</th>
                  <th>المعرف</th>
                  <th>عنوان IP</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.dateText}>{formatDate(log.created_at)}</td>
                    <td>
                      <div>
                        <strong>{log.user_name || 'النظام'}</strong>
                        {log.user_email && (
                          <div style={{ fontSize: '11px', color: 'var(--color-slate-400)' }} dir="ltr">
                            {log.user_email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Tag variant={getActionVariant(log.action)}>{log.action}</Tag>
                    </td>
                    <td><strong>{log.entity_type}</strong></td>
                    <td dir="ltr">{log.entity_id || '—'}</td>
                    <td dir="ltr" style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                      {log.ip_address || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailsModal({ open: true, log })}
                      >
                        <Eye size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                صفحة {meta.page} من {meta.total_pages} (الإجمالي: {meta.total} سجل)
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
      )}

      {/* Details Modal */}
      <Modal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, log: null })}
        title="تفاصيل العملية والبيانات"
        footer={
          <Button variant="ghost" onClick={() => setDetailsModal({ open: false, log: null })}>
            إغلاق
          </Button>
        }
      >
        {detailsModal.log && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
            <div>
              <strong>الإجراء:</strong> {detailsModal.log.action} على {detailsModal.log.entity_type} (معرف: {detailsModal.log.entity_id})
            </div>
            <div>
              <strong>الوقت:</strong> {formatDate(detailsModal.log.created_at)}
            </div>
            <div>
              <strong>المستخدم:</strong> {detailsModal.log.user_name || 'النظام'} ({detailsModal.log.user_email || '—'})
            </div>
            <div>
              <strong>IP:</strong> <span dir="ltr">{detailsModal.log.ip_address}</span>
            </div>

            {detailsModal.log.old_values && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>القيم السابقة:</div>
                <pre
                  dir="ltr"
                  style={{
                    backgroundColor: 'var(--color-slate-100)',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    overflowX: 'auto',
                    fontSize: '11px',
                  }}
                >
                  {typeof detailsModal.log.old_values === 'string'
                    ? detailsModal.log.old_values
                    : JSON.stringify(detailsModal.log.old_values, null, 2)}
                </pre>
              </div>
            )}

            {detailsModal.log.new_values && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>القيم الجديدة:</div>
                <pre
                  dir="ltr"
                  style={{
                    backgroundColor: 'var(--color-slate-100)',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    overflowX: 'auto',
                    fontSize: '11px',
                  }}
                >
                  {typeof detailsModal.log.new_values === 'string'
                    ? detailsModal.log.new_values
                    : JSON.stringify(detailsModal.log.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
