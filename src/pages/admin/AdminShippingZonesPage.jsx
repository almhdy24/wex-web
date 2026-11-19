import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { formatSdg } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function AdminShippingZonesPage() {
  const { showToast } = useToast();
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { state_name_ar, fee_sdg, is_active } = editModal.formData;
    if (!state_name_ar.trim()) {
      showToast('يرجى إدخال اسم الولاية أو المنطقة', 'error');
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
        showToast('تم تحديث منطقة التوصيل بنجاح', 'success');
      } else {
        await adminApi.createShippingZone(payload);
        showToast('تمت إضافة منطقة التوصيل بنجاح', 'success');
      }
      setEditModal((prev) => ({ ...prev, open: false }));
      fetchZones();
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء حفظ منطقة التوصيل', 'error');
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.zone) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteShippingZone(deleteModal.zone.id);
      showToast('تم حذف منطقة التوصيل بنجاح', 'success');
      setDeleteModal({ open: false, zone: null, loading: false });
      fetchZones();
    } catch (err) {
      showToast(err.message || 'فشل في حذف منطقة التوصيل', 'error');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">مناطق ورسوم التوصيل بالولايات</h1>
          <p className="admin-page-subtitle">
            تحديد تكلفة الشحن بالجنيه السوداني لكل ولاية أو مدينة وتفعيل التوصيل
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAddModal}>
          + إضافة منطقة توصيل
        </button>
      </div>

      {loading ? (
        <div className="card">
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchZones} />
      ) : zones.length === 0 ? (
        <EmptyState
          title="لا توجد مناطق توصيل"
          description="أضف ولايات السودان ورسوم التوصيل المقابلة لتفعيل خيارات الشحن للعملاء."
        />
      ) : (
        <div className="card p-0 table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>#</th>
                <th>الولاية / المنطقة</th>
                <th>رسوم التوصيل (SDG)</th>
                <th>حالة التوصيل</th>
                <th style={{ width: '130px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td className="text-muted text-center">#{zone.id}</td>
                  <td className="font-semibold text-navy">{zone.state_name_ar}</td>
                  <td className="font-semibold text-royal">
                    {formatSdg(zone.fee_sdg)}
                  </td>
                  <td>
                    {zone.is_active ? (
                      <Badge variant="success">متاح للتوصيل</Badge>
                    ) : (
                      <Badge variant="warning">متوقف مؤقتاً</Badge>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="admin-actions-cell">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditModal(zone)}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleteModal({ open: true, zone, loading: false })}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {editModal.open && (
        <Modal
          isOpen={editModal.open}
          onClose={() => setEditModal((prev) => ({ ...prev, open: false }))}
          title={editModal.isEdit ? 'تعديل منطقة التوصيل' : 'إضافة منطقة توصيل جديدة'}
        >
          <form onSubmit={handleFormSubmit} className="p-2">
            <div className="form-group mb-3">
              <label className="form-label required">اسم الولاية أو المنطقة</label>
              <input
                type="text"
                value={editModal.formData.state_name_ar}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: { ...editModal.formData, state_name_ar: e.target.value },
                  })
                }
                placeholder="مثال: ولاية الخرطوم (أم درمان - بحري - الخرطوم)"
                className="form-control"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label required">رسوم التوصيل بالجنيه السوداني (SDG)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={editModal.formData.fee_sdg}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: { ...editModal.formData, fee_sdg: e.target.value },
                  })
                }
                placeholder="مثال: 5000"
                className="form-control"
                required
              />
            </div>

            <div className="form-group mb-4">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editModal.formData.is_active}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      formData: { ...editModal.formData, is_active: e.target.checked },
                    })
                  }
                />
                <span className="font-semibold">تفعيل التوصيل لهذه المنطقة</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={editModal.submitting}
                onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={editModal.submitting}
              >
                {editModal.submitting ? 'جاري الحفظ...' : editModal.isEdit ? 'حفظ التعديلات' : 'إضافة المنطقة'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, zone: null, loading: false })}
          title="تأكيد حذف منطقة التوصيل"
        >
          <div className="p-2">
            <p className="mb-4">
              هل أنت متأكد من رغبتك في حذف منطقة التوصيل:{' '}
              <strong className="text-navy">{deleteModal.zone?.state_name_ar}</strong>؟
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleteModal.loading}
                onClick={() => setDeleteModal({ open: false, zone: null, loading: false })}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleteModal.loading}
                onClick={handleDeleteConfirm}
              >
                {deleteModal.loading ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
