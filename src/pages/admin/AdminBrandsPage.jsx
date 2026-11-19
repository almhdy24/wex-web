import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function AdminBrandsPage() {
  const { showToast } = useToast();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Add / Edit
  const [editModal, setEditModal] = useState({
    open: false,
    isEdit: false,
    id: null,
    submitting: false,
    formData: {
      name: '',
      slug: '',
      is_active: true,
    },
  });

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, brand: null, loading: false });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getBrands();
      setBrands(res.data || []);
    } catch (err) {
      setError(err.message || 'فشل في تحميل الماركات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openAddModal = () => {
    setEditModal({
      open: true,
      isEdit: false,
      id: null,
      submitting: false,
      formData: {
        name: '',
        slug: '',
        is_active: true,
      },
    });
  };

  const openEditModal = (brand) => {
    setEditModal({
      open: true,
      isEdit: true,
      id: brand.id,
      submitting: false,
      formData: {
        name: brand.name || '',
        slug: brand.slug || '',
        is_active: Number(brand.is_active) === 1,
      },
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { name, slug, is_active } = editModal.formData;
    if (!name.trim()) {
      showToast('يرجى إدخال اسم الماركة', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      is_active: is_active ? 1 : 0,
    };

    try {
      setEditModal((prev) => ({ ...prev, submitting: true }));
      if (editModal.isEdit) {
        await adminApi.updateBrand(editModal.id, payload);
        showToast('تم تحديث الماركة بنجاح', 'success');
      } else {
        await adminApi.createBrand(payload);
        showToast('تمت إضافة الماركة بنجاح', 'success');
      }
      setEditModal((prev) => ({ ...prev, open: false }));
      fetchBrands();
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء حفظ الماركة', 'error');
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.brand) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteBrand(deleteModal.brand.id);
      showToast('تم حذف الماركة بنجاح', 'success');
      setDeleteModal({ open: false, brand: null, loading: false });
      fetchBrands();
    } catch (err) {
      showToast(err.message || 'فشل في حذف الماركة', 'error');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">إدارة الماركات والشركات المصنعة</h1>
          <p className="admin-page-subtitle">الماركات المسجلة في المتجر (Dell, HP, Lenovo, Apple, Samsung...)</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAddModal}>
          + إضافة ماركة جديدة
        </button>
      </div>

      {loading ? (
        <div className="card">
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBrands} />
      ) : brands.length === 0 ? (
        <EmptyState
          title="لا توجد ماركات مسجلة"
          description="قم بإضافة الماركات لتسهيل التصفية والبحث للعملاء."
        />
      ) : (
        <div className="card p-0 table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>المعرف</th>
                <th>اسم الماركة</th>
                <th>الرابط المباشر (Slug)</th>
                <th>حالة العرض</th>
                <th style={{ width: '130px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id}>
                  <td className="text-muted text-center">#{b.id}</td>
                  <td className="font-semibold text-navy">{b.name}</td>
                  <td>
                    <code>{b.slug}</code>
                  </td>
                  <td>
                    {Number(b.is_active) === 1 ? (
                      <Badge variant="success">نشطة</Badge>
                    ) : (
                      <Badge variant="warning">معطلة</Badge>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="admin-actions-cell">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditModal(b)}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleteModal({ open: true, brand: b, loading: false })}
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
          title={editModal.isEdit ? 'تعديل الماركة' : 'إضافة ماركة جديدة'}
        >
          <form onSubmit={handleFormSubmit} className="p-2">
            <div className="form-group mb-3">
              <label className="form-label required">اسم الماركة</label>
              <input
                type="text"
                value={editModal.formData.name}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: { ...editModal.formData, name: e.target.value },
                  })
                }
                placeholder="مثال: Lenovo"
                className="form-control"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">الرابط الفريد (Slug - اختياري)</label>
              <input
                type="text"
                value={editModal.formData.slug}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: { ...editModal.formData, slug: e.target.value },
                  })
                }
                placeholder="يتم إنشاؤه تلقائياً إذا ترك فارغاً"
                className="form-control"
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
                <span className="font-semibold">تفعيل الماركة وعرضها في الفلاتر</span>
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
                {editModal.submitting ? 'جاري الحفظ...' : editModal.isEdit ? 'حفظ التعديلات' : 'إضافة الماركة'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, brand: null, loading: false })}
          title="تأكيد حذف الماركة"
        >
          <div className="p-2">
            <p className="mb-4">
              هل أنت متأكد من رغبتك في حذف الماركة:{' '}
              <strong className="text-navy">{deleteModal.brand?.name}</strong>؟
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleteModal.loading}
                onClick={() => setDeleteModal({ open: false, brand: null, loading: false })}
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
