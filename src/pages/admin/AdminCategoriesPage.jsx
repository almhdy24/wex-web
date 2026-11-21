import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, FolderTree } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import styles from './AdminCommon.module.css';

export default function AdminCategoriesPage() {
  const { success, error: toastError } = useToast();
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
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
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
        sort_order: '0',
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
        is_active: Boolean(cat.is_active),
      },
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { name_ar, name_en, slug, sort_order, is_active } = editModal.formData;
    if (!name_ar.trim()) {
      toastError('يرجى إدخال اسم الفئة بالعربية');
      return;
    }

    const payload = {
      name_ar: name_ar.trim(),
      name_en: name_en.trim() || undefined,
      slug: slug.trim() || undefined,
      sort_order: Number(sort_order || 0),
      is_active: Boolean(is_active),
    };

    try {
      setEditModal((prev) => ({ ...prev, submitting: true }));
      if (editModal.isEdit) {
        await adminApi.updateCategory(editModal.id, payload);
        success('تم تحديث الفئة بنجاح');
      } else {
        await adminApi.createCategory(payload);
        success('تمت إضافة الفئة بنجاح');
      }
      setEditModal((prev) => ({ ...prev, open: false }));
      fetchCategories();
    } catch (err) {
      toastError(err.message || 'فشل حفظ الفئة');
    } finally {
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.category) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteCategory(deleteModal.category.id);
      success('تم حذف الفئة بنجاح');
      setDeleteModal({ open: false, category: null, loading: false });
      fetchCategories();
    } catch (err) {
      toastError(err.message || 'فشل حذف الفئة');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <Page className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>إدارة فئات وتصنيفات المتجر</h1>
          <p className={styles.subtitle}>
            تنظيم هيكل المنتجات والتصنيفات في الواجهة والمتجر
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openAddModal}>
          <Plus size={16} />
          <span>إضافة فئة جديدة</span>
        </Button>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCategories} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="لا توجد فئات مسجلة"
          description="أضف تصنيفات الأجهزة لعرضها في شريط التصفح والكتالوج."
          actionLabel="إضافة فئة جديدة"
          onAction={openAddModal}
        />
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>اسم الفئة (عربي)</th>
                  <th>الاسم بالإنجليزية</th>
                  <th>المعرف (Slug)</th>
                  <th>ترتيب العرض</th>
                  <th>الحالة</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <FolderTree size={16} style={{ color: 'var(--color-royal-blue)' }} />
                        <strong>{c.name_ar}</strong>
                      </div>
                    </td>
                    <td dir="ltr">{c.name_en || '—'}</td>
                    <td dir="ltr" style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>
                      {c.slug}
                    </td>
                    <td>{c.sort_order}</td>
                    <td>
                      {c.is_active ? (
                        <Tag variant="success">نشط</Tag>
                      ) : (
                        <Tag variant="warning">معطل</Tag>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(c)} aria-label="تعديل التصنيف" title="تعديل التصنيف">
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteModal({ open: true, category: c, loading: false })}
                          aria-label="حذف التصنيف"
                          title="حذف التصنيف"
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
        title={editModal.isEdit ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
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
              <span>{editModal.isEdit ? 'حفظ التعديلات' : 'إضافة الفئة'}</span>
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="اسم الفئة بالعربية"
            placeholder="مثال: لابتوبات، موبايلات..."
            value={editModal.formData.name_ar}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                formData: { ...prev.formData, name_ar: e.target.value },
              }))
            }
            required
          />

          <Input
            label="الاسم بالإنجليزية (اختياري)"
            placeholder="مثال: Laptops, Smartphones..."
            value={editModal.formData.name_en}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                formData: { ...prev.formData, name_en: e.target.value },
              }))
            }
            dir="ltr"
          />

          <Input
            label="المعرف في الرابط (Slug) - اختياري"
            placeholder="laptops"
            value={editModal.formData.slug}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                formData: { ...prev.formData, slug: e.target.value },
              }))
            }
            dir="ltr"
            hint="يترك فارغاً للتوليد التلقائي"
          />

          <Input
            label="ترتيب الظهور في القوائم"
            type="number"
            value={editModal.formData.sort_order}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                formData: { ...prev.formData, sort_order: e.target.value },
              }))
            }
            dir="ltr"
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
            <span>عرض هذه الفئة في المتجر (نشطة)</span>
          </label>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, category: null, loading: false })}
        title="تأكيد حذف الفئة"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteModal({ open: false, category: null, loading: false })}
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
          هل أنت متأكد من رغبتك في حذف الفئة:
          <br />
          <strong>{deleteModal.category?.name_ar}</strong>؟
        </p>
      </Modal>
    </Page>
  );
}
