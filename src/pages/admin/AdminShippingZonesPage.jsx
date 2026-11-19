import { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Trash2, Check } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatSdg } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminCommon.module.css';

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
  const [deleteModal, setDeleteModal] = useState({ open: false, zone: null, loading: false });

  const fetchZones = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getShippingZones();
      setZones(res.data || []);
    } catch (err) {
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
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
        success('تمت إضافة منطقة التوصيل بنجاح');
      }
      setEditModal((prev) => ({ ...prev, open: false }));
      fetchZones();
    } catch (err) {
      toastError(err.message || 'فشل حفظ منطقة التوصيل');
    } finally {
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.zone) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteShippingZone(deleteModal.zone.id);
      success('تم حذف منطقة التوصيل');
      setDeleteModal({ open: false, zone: null, loading: false });
      fetchZones();
    } catch (err) {
      toastError(err.message || 'فشل حذف منطقة التوصيل');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>إدارة مناطق ورسوم التوصيل</h1>
          <p className={styles.subtitle}>
            تحديد تكلفة الشحن لكل ولاية سودانية والتحكم في إتاحة التوصيل
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openAddModal}>
          <Plus size={16} />
          <span>إضافة ولاية / منطقة</span>
        </Button>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchZones} />
      ) : zones.length === 0 ? (
        <EmptyState
          title="لا توجد مناطق توصيل مسجلة"
          description="أضف ولايات ومناطق التوصيل ورسومها ليتمكن العملاء من اختيار التوصيل عند إتمام الطلب."
          actionLabel="إضافة منطقة جديدة"
          onAction={openAddModal}
        />
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>الولاية / المنطقة</th>
                  <th>رسوم التوصيل (SDG)</th>
                  <th>حالة التوصيل</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Truck size={16} style={{ color: 'var(--color-royal-blue)' }} />
                        <strong>{z.state_name_ar}</strong>
                      </div>
                    </td>
                    <td className={styles.totalPrice}>{formatSdg(z.fee_sdg)}</td>
                    <td>
                      {z.is_active ? (
                        <Tag variant="success">متاح للشحن</Tag>
                      ) : (
                        <Tag variant="warning">متوقف مؤقتاً</Tag>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(z)}>
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteModal({ open: true, zone: z, loading: false })}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal((prev) => ({ ...prev, open: false }))}
        title={editModal.isEdit ? 'تعديل منطقة التوصيل' : 'إضافة ولاية / منطقة توصيل جديدة'}
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
              <Check size={16} />
              <span>{editModal.isEdit ? 'حفظ التعديلات' : 'إضافة المنطقة'}</span>
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="اسم الولاية أو المنطقة"
            placeholder="مثال: ولاية الخرطوم (أم درمان، بحري، الخرطوم)"
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
            min="0"
            step="100"
            dir="ltr"
            placeholder="مثال: 3000"
            value={editModal.formData.fee_sdg}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                formData: { ...prev.formData, fee_sdg: e.target.value },
              }))
            }
            required
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            <input
              type="checkbox"
              checked={editModal.formData.is_active}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  formData: { ...prev.formData, is_active: e.target.checked },
                }))
              }
              style={{ accentColor: 'var(--color-royal-blue)' }}
            />
            <span>التوصيل متاح ونشط لهذه المنطقة</span>
          </label>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, zone: null, loading: false })}
        title="تأكيد حذف منطقة التوصيل"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteModal({ open: false, zone: null, loading: false })}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              loading={deleteModal.loading}
              onClick={handleDeleteConfirm}
            >
              تأكيد الحذف
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-slate-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
          هل أنت متأكد من رغبتك في حذف منطقة التوصيل:
          <br />
          <strong>{deleteModal.zone?.state_name_ar}</strong>؟
        </p>
      </Modal>
    </div>
  );
}
