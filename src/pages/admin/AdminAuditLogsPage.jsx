import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatDate } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import DataList from '../../components/admin/DataList';
import FilterBar from '../../components/admin/FilterBar';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import styles from './AdminAuditLogsPage.module.css';

/**
 * Human-readable Arabic sentence generator for audit entries.
 */
function formatAuditSentence(log) {
  if (!log) return '';
  const actor = log.user_name || log.user?.name || 'المدير';
  let details = {};
  if (log.details) {
    try {
      details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
    } catch {
      // ignore
    }
  }

  const action = log.action || '';
  const entity = log.entity || log.entity_type || '';

  if (action === 'update_rate' || (entity === 'rates' && action.includes('update'))) {
    if (details.old_rate && details.new_rate) {
      return `قام ${actor} بتحديث سعر الصرف من ${details.old_rate} إلى ${details.new_rate} ج.س`;
    }
    if (details.rate) {
      return `قام ${actor} بتحديث سعر الصرف إلى ${details.rate} ج.س`;
    }
    return `قام ${actor} بتحديث سعر الصرف`;
  }

  if (action === 'approve_proof' || action === 'approve_payment') {
    return `قام ${actor} باعتماد إشعار التحويل البنكي للطلب #${details.order_number || log.entity_id || ''}`;
  }

  if (action === 'reject_proof' || action === 'reject_payment') {
    const reason = details.note || details.reason ? ` (${details.note || details.reason})` : '';
    return `قام ${actor} برفض إشعار التحويل للطلب #${details.order_number || log.entity_id || ''}${reason}`;
  }

  if (action === 'update_status' || action.includes('status')) {
    const oldStatus = details.old_status ? `من "${details.old_status}" ` : '';
    const newStatus = details.new_status ? `إلى "${details.new_status}"` : '';
    return `قام ${actor} بتعديل مسار الطلب #${details.order_number || log.entity_id || ''} ${oldStatus}${newStatus}`.trim();
  }

  if (action.includes('create') && entity === 'products') {
    return `قام ${actor} بإضافة جهاز جديد: ${details.name || `#${log.entity_id}`}`;
  }

  if (action.includes('update') && entity === 'products') {
    return `قام ${actor} بتعديل بيانات الجهاز: ${details.name || `#${log.entity_id}`}`;
  }

  if (action.includes('stock')) {
    return `قام ${actor} بتعديل مخزون الجهاز #${log.entity_id} إلى ${details.new_stock ?? details.stock_quantity ?? ''}`;
  }

  if (action.includes('role')) {
    return `قام ${actor} بتعديل صلاحيات المستخدم #${log.entity_id} إلى دور "${details.role || details.new_role || ''}"`;
  }

  return `قام ${actor} بإجراء ${action} على ${entity} #${log.entity_id || ''}`;
}

export default function AdminAuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 25, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters from URL
  const actionFilter = searchParams.get('action') || '';
  const entityFilter = searchParams.get('entity') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  // Details Modal
  const [detailsModal, setDetailsModal] = useState({ open: false, log: null });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
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
  }, [currentPage, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val !== undefined && val !== null && val !== '') {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const getActionVariant = (action) => {
    if (action.includes('delete') || action.includes('reject')) return 'danger';
    if (action.includes('update') || action.includes('status')) return 'info';
    if (action.includes('create') || action.includes('approve')) return 'success';
    return 'neutral';
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (entityFilter) count++;
    if (actionFilter) count++;
    return count;
  }, [entityFilter, actionFilter]);

  const columns = [
    {
      key: 'sentence',
      label: 'العملية',
      isPrimary: true,
      render: (log) => (
        <div className={styles.sentenceCell}>
          <span className={styles.sentenceText}>{formatAuditSentence(log)}</span>
          <div className={styles.sentenceMeta}>
            <span>{log.user_name || 'المدير'}</span>
            <span>·</span>
            <span>{formatDate(log.created_at)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'الإجراء',
      render: (log) => <Tag variant={getActionVariant(log.action)}>{log.action}</Tag>,
    },
    {
      key: 'entity',
      label: 'الكيان',
      render: (log) => (
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-navy)' }}>
          {log.entity || log.entity_type}
        </span>
      ),
    },
    {
      key: 'ip',
      label: 'عنوان IP',
      hideOnMobile: true,
      render: (log) => (
        <span className={styles.ipText} dir="ltr">
          {log.ip || log.ip_address || '—'}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'التفاصيل',
      isStatus: true,
      render: (log) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setDetailsModal({ open: true, log })}
          aria-label="عرض تفاصيل العملية"
        >
          <Eye size={14} />
          <span>عرض</span>
        </Button>
      ),
    },
  ];

  return (
    <Page className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>سجل العمليات الإدارية</h1>
          <p className={styles.subtitle}>
            تتبع زمني لكافة القرارات وتعديلات الأسعار والطلبات التي تمت في لوحة التحكم
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw size={14} />
          <span>تحديث السجل</span>
        </Button>
      </header>

      {/* Decorative Ribbon */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Filter Bar */}
      <FilterBar
        filterCount={activeFiltersCount}
        onClearFilters={() => setSearchParams(new URLSearchParams())}
      >
        <Select
          label="الكيان"
          value={entityFilter}
          onChange={(e) => updateParam('entity', e.target.value)}
          options={[
            { value: '', label: 'كافة الكيانات' },
            { value: 'orders', label: 'الطلبات' },
            { value: 'payment_proofs', label: 'إشعارات الدفع' },
            { value: 'products', label: 'الأجهزة والمنتجات' },
            { value: 'rates', label: 'أسعار الصرف' },
            { value: 'settings', label: 'إعدادات المتجر' },
            { value: 'users', label: 'المستخدمين والصلاحيات' },
            { value: 'shipping_zones', label: 'مناطق التوصيل' },
          ]}
        />
        <Select
          label="نوع الإجراء"
          value={actionFilter}
          onChange={(e) => updateParam('action', e.target.value)}
          options={[
            { value: '', label: 'كافة الإجراءات' },
            { value: 'approve_proof', label: 'قبول إشعار' },
            { value: 'reject_proof', label: 'رفض إشعار' },
            { value: 'update_status', label: 'تحديث مسار الطلب' },
            { value: 'update_rate', label: 'تحديث سعر الصرف' },
            { value: 'update_stock', label: 'تحديث المخزون' },
            { value: 'update_role', label: 'تعديل الصلاحيات' },
          ]}
        />
      </FilterBar>

      {/* Main Content */}
      {error && !loading ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : (
        <DataList
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="لا توجد عمليات مسجلة تطابق التصفية الحالية"
          pagination={
            meta.total_pages > 1
              ? {
                  currentPage: meta.page,
                  totalPages: meta.total_pages,
                  onPageChange: (newPage) => updateParam('page', newPage),
                }
              : null
          }
        />
      )}

      {/* Details Modal */}
      <Modal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, log: null })}
        title="تفاصيل العملية الإدارية"
        footer={
          <Button variant="ghost" onClick={() => setDetailsModal({ open: false, log: null })}>
            إغلاق
          </Button>
        }
      >
        {detailsModal.log && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>
                الوصف المقروء:
              </strong>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)', margin: '4px 0 0' }}>
                {formatAuditSentence(detailsModal.log)}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>المستخدم:</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {detailsModal.log.user_name || 'المدير'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>التاريخ والوقت:</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {formatDate(detailsModal.log.created_at)}
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>البيانات الفنية (JSON):</span>
              <pre className={styles.detailsJson}>
                {typeof detailsModal.log.details === 'string'
                  ? detailsModal.log.details
                  : JSON.stringify(detailsModal.log.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
