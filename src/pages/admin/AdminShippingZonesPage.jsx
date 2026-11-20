import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatSdg } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DataList from '../../components/admin/DataList';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminShippingZonesPage.module.css';

export default function AdminShippingZonesPage() {
  const { success, error: toastError } = useToast();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add / Edit Modal
  const [editModal, setEditModal] = useState({
    open: false,
    isEdit: false,
    id: null,
    submitting: false,
    formData: {
      state_name_ar: '',
      fee_sdg: '',
      is_active: true,
    },
  });

  // Delete Modal
  const [deleteDialog, setDeleteDialog] = useState({ open: false, zone: null, loading: false });

  const fetchZones = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getShippingZones();
      setZones(res.data || []);
    } catch (err) {
      setError(err.message || 'فشل في تحميل مناطق التوصيل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const openAddModal = () => {
    setEditModal({
      open: true,
      isEdit: false,
      id: null,
      submitting: false,
      formData: {
        state_name_ar: '',
        fee_sdg: '3000',
        is_active: true,
      },
    });
  };

  const openEditModal = (zone) => {
    setEditModal({
      open: true,
      isEdit: true,
      id: zone.id,
      submitting: false,
      formData: {
        state_name_ar: zone.state_name_ar || '',
        fee_sdg: String(zone.fee_sdg ?? 0),
        is_active: Boolean(zone.is_active),
      },
    });
  };

  const handleToggleActive = async (zone) => {
    const nextStatus = !zone.is_active;
    try {
      setZones((prev) =>
        prev.map((z) => (z.id === zone.id ? { ...z, is_active: nextStatus } : z))
      );
      await adminApi.updateShippingZone(zone.id, {
        state_name_ar: zone.state_name_ar,
        fee_sdg: zone.fee_sdg,
        is_active: nextStatus,
      });
      success(nextStatus ? 'تم تفعيل منطقة التوصيل' : 'تم إيقاف منطقة التوصيل');
    } catch (err) {
      toastError(err.message || 'تعذر تعديل حالة المنطقة');
      fetchZones();
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { state_name_ar, fee_sdg, is_active } = editModal.formData;
    if (!state_name_ar.trim()) {
      toastError('يرجى إدخال اسم الولاية أو المنطقة');
      return;
    }

    const payload = {
      state_name_ar: state_name_ar.trim(),
      fee_sdg: Number(fee_sdg || 0),
      is_active: Boolean(is_active),
    };

    try {
      setEditModal((prev) => ({ ...prev, submitting: true }));
      if (editModal.isEdit) {
        await adminApi.updateShippingZone(editModal.id, payload);
        success('تم تحديث منطقة التوصيل بنجاح');
      } else {
        await adminApi.createShippingZone(payload);
        success('تم إضافة منطقة التوصيل بنجاح');
      }
      setEditModal((prev) => ({ ...prev, open: false, submitting: false }));
      fetchZones();
    } catch (err) {
      toastError(err.message || 'فشل حفظ منطقة التوصيل');
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.zone) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteShippingZone(deleteDialog.zone.id);
      success('تم حذف منطقة التوصيل بنجاح');
      setDeleteDialog({ open: false, zone: null, loading: false });
      fetchZones();
    } catch (err) {
      toastError(err.message || 'فشل حذف منطقة التوصيل');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = [
    {
      key: 'state_name_ar',
      label: 'الولاية / المنطقة',
      isPrimary: true,
      render: (z) => <span className={styles.zoneStateName}>{z.state_name_ar}</span>,
    },
    {
      key: 'fee_sdg',
      label: 'رسوم التوصيل (ج.س)',
      render: (z) => <span className={styles.feeValue}>{formatSdg(z.fee_sdg)}</span>,
    },
    {
      key: 'is_active',
      label: 'الحالة',
      isStatus: true,
      render: (z) => (
        <button
          type="button"
          onClick={() => handleToggleActive(z)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          title={z.is_active ? 'إيقاف المنطقة' : 'تفعيل المنطقة'}
        >
          {z.is_active ? <Tag variant="success">مفعلة</Tag> : <Tag variant="neutral">معطلة</Tag>}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      hideOnMobile: true,
      render: (z) => (
        <div className={styles.actionsCell}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => openEditModal(z)}
            title="تعديل"
            aria-label="تعديل المنطقة"
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => setDeleteDialog({ open: true, zone: z, loading: false })}
            title="حذف"
            aria-label="حذف المنطقة"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>مناطق ورسوم التوصيل</h1>
          <p className={styles.subtitle}>
            تحديد الولايات والمناطق المتاحة للتوصيل وتعديل رسوم الشحن لكل منطقة
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openAddModal}>
          <Plus size={16} />
          <span>إضافة منطقة جديدة</span>
        </Button>
      </header>

      {/* Decorative Ribbon */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Main Content */}
      {error && !loading ? (
        <ErrorState message={error} onRetry={fetchZones} />
      ) : (
        <DataList
          columns={columns}
          data={zones}
          loading={loading}
          emptyMessage="لا توجد مناطق توصيل مسجلة حالياً."
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal((prev) => ({ ...prev, open: false }))}
        title={editModal.isEdit ? 'تعديل منطقة التوصيل' : 'إضافة منطقة توصيل جديدة'}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              loading={editModal.submitting}
              onClick={handleFormSubmit}
            >
              {editModal.isEdit ? 'حفظ التعديلات' : 'إضافة المنطقة'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="اسم الولاية أو المنطقة"
            placeholder="مثال: الخرطوم، بحري، أم درمان، الجزيرة..."
            value={editModal.formData.state_name_ar}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                formData: { ...prev.formData, state_name_ar: e.target.value },
              }))
            }
            required
          />

          <Input
            label="رسوم التوصيل بالجنيه السوداني (SDG)"
            type="number"
            placeholder="مثال: 3000"
            min="0"
            step="100"
            dir="ltr"
            value={editModal.formData.fee_sdg}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                formData: { ...prev.formData, fee_sdg: e.target.value },
              }))
            }
            required
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
            <input
              type="checkbox"
              checked={editModal.formData.is_active}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  formData: { ...prev.formData, is_active: e.target.checked },
                }))
              }
              style={{ width: 18, height: 18, accentColor: 'var(--color-royal-blue)' }}
            />
            <span>مفعلة ومتاحة للعملاء عند إتمام الطلب</span>
          </label>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, zone: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        title="تأكيد حذف منطقة التوصيل"
        message={`هل أنت متأكد من حذف منطقة "${deleteDialog.zone?.state_name_ar}"؟ لن تظهر للعملاء في خيارات التوصيل.`}
        confirmText="تأكيد الحذف"
        variant="danger"
        loading={deleteDialog.loading}
      />
    </div>
  );
}
