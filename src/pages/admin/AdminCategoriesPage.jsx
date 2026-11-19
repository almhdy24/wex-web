import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Add / Edit
  const [editModal, setEditModal] = useState({
    open: false,
    isEdit: false,
    id: null,
    submitting: false,
    formData: {
      name_ar: '',
      name_en: '',
      slug: '',
      sort_order: '0',
      is_active: true,
    },
  });

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null, loading: false });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      setError(err.message || 'فشل في تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditModal({
      open: true,
      isEdit: false,
      id: null,
      submitting: false,
      formData: {
        name_ar: '',
        name_en: '',
        slug: '',
        sort_order: String(categories.length),
        is_active: true,
      },
    });
  };

  const openEditModal = (cat) => {
    setEditModal({
      open: true,
      isEdit: true,
      id: cat.id,
      submitting: false,
      formData: {
        name_ar: cat.name_ar || '',
        name_en: cat.name_en || '',
        slug: cat.slug || '',
        sort_order: String(cat.sort_order ?? 0),
        is_active: Number(cat.is_active) === 1,
      },
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { name_ar, name_en, slug, sort_order, is_active } = editModal.formData;
    if (!name_ar.trim()) {
      showToast('يرجى إدخال اسم الفئة بالعربية', 'error');
      return;
    }

    const payload = {
      name_ar: name_ar.trim(),
      name_en: name_en.trim() || null,
      slug: slug.trim() || undefined,
      sort_order: Number(sort_order || 0),
      is_active: is_active ? 1 : 0,
    };

    try {
      setEditModal((prev) => ({ ...prev, submitting: true }));
      if (editModal.isEdit) {
        await adminApi.updateCategory(editModal.id, payload);
        showToast('تم تحديث الفئة بنجاح', 'success');
      } else {
        await adminApi.createCategory(payload);
        showToast('تمت إضافة الفئة بنجاح', 'success');
      }
      setEditModal((prev) => ({ ...prev, open: false }));
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء حفظ الفئة', 'error');
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.category) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteCategory(deleteModal.category.id);
      showToast('تم حذف الفئة بنجاح', 'success');
      setDeleteModal({ open: false, category: null, loading: false });
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'فشل في حذف الفئة', 'error');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">إدارة فئات المنتجات</h1>
          <p className="admin-page-subtitle">تصنيفات الأجهزة والملحقات وترتيب ظهورها في المتجر</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAddModal}>
          + إضافة فئة جديدة
        </button>
      </div>

      {loading ? (
        <div className="card">
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCategories} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="لا توجد فئات حالياً"
          description="قم بإضافة أول فئة للبدء بتصنيف المنتجات في المتجر."
        />
      ) : (
        <div className="card p-0 table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>الترتيب</th>
                <th>اسم الفئة (عربي)</th>
                <th>اسم الفئة (إنجليزي)</th>
                <th>الرابط المباشر (Slug)</th>
                <th>حالة العرض</th>
                <th style={{ width: '130px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="font-semibold text-center">{cat.sort_order}</td>
                  <td className="font-semibold text-navy">{cat.name_ar}</td>
                  <td className="text-muted">{cat.name_en || '—'}</td>
                  <td>
                    <code>{cat.slug}</code>
                  </td>
                  <td>
                    {Number(cat.is_active) === 1 ? (
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
                        onClick={() => openEditModal(cat)}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleteModal({ open: true, category: cat, loading: false })}
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
          title={editModal.isEdit ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
        >
          <form onSubmit={handleFormSubmit} className="p-2">
            <div className="form-group mb-3">
              <label className="form-label required">اسم الفئة بالعربية</label>
              <input
                type="text"
                value={editModal.formData.name_ar}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: { ...editModal.formData, name_ar: e.target.value },
                  })
                }
                placeholder="مثال: لابتوبات للأعمال"
                className="form-control"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">اسم الفئة بالإنجليزية (اختياري)</label>
              <input
                type="text"
                value={editModal.formData.name_en}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: { ...editModal.formData, name_en: e.target.value },
                  })
                }
                placeholder="مثال: Business Laptops"
                className="form-control"
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

            <div className="form-group mb-3">
              <label className="form-label">ترتيب العرض (رقم تصاعدي)</label>
              <input
                type="number"
                value={editModal.formData.sort_order}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: { ...editModal.formData, sort_order: e.target.value },
                  })
                }
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
                <span className="font-semibold">تفعيل الفئة وعرضها في المتجر</span>
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
                {editModal.submitting ? 'جاري الحفظ...' : editModal.isEdit ? 'حفظ التعديلات' : 'إضافة الفئة'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, category: null, loading: false })}
          title="تأكيد حذف الفئة"
        >
          <div className="p-2">
            <p className="mb-4">
              هل أنت متأكد من رغبتك في حذف الفئة:{' '}
              <strong className="text-navy">{deleteModal.category?.name_ar}</strong>؟
            </p>
            <p className="text-muted text-sm mb-4">
              ملاحظة: إذا كانت هناك أجهزة مرتبطة بهذه الفئة، يفضل تعديل ارتباطها أولاً.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleteModal.loading}
                onClick={() => setDeleteModal({ open: false, category: null, loading: false })}
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
