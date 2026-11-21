import { useState, useEffect } from 'react';
import { Tag as TagIcon, Plus, Edit, Trash2, Check } from 'lucide-react';
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

export default function AdminBrandsPage() {
  const { success, error: toastError } = useToast();
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
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
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
        is_active: Boolean(brand.is_active),
      },
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { name, slug, is_active } = editModal.formData;
    if (!name.trim()) {
      toastError('يرجى إدخال اسم الماركة');
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      is_active: Boolean(is_active),
    };

    try {
      setEditModal((prev) => ({ ...prev, submitting: true }));
      if (editModal.isEdit) {
        await adminApi.updateBrand(editModal.id, payload);
        success('تم تحديث الماركة بنجاح');
      } else {
        await adminApi.createBrand(payload);
        success('تمت إضافة الماركة بنجاح');
      }
      setEditModal((prev) => ({ ...prev, open: false }));
      fetchBrands();
    } catch (err) {
      toastError(err.message || 'فشل حفظ الماركة');
    } finally {
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.brand) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteBrand(deleteModal.brand.id);
      success('تم حذف الماركة بنجاح');
      setDeleteModal({ open: false, brand: null, loading: false });
      fetchBrands();
    } catch (err) {
      toastError(err.message || 'فشل حذف الماركة');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <Page className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>إدارة الماركات والشركات المصنعة</h1>
          <p className={styles.subtitle}>
            الماركات المسجلة في المتجر (Dell, HP, Lenovo, Apple, Samsung...)
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openAddModal}>
          <Plus size={16} />
          <span>إضافة ماركة جديدة</span>
        </Button>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBrands} />
      ) : brands.length === 0 ? (
        <EmptyState
          title="لا توجد ماركات مسجلة"
          description="أضف الماركات لتسهيل التصفية والبحث في المتجر."
          actionLabel="إضافة ماركة جديدة"
          onAction={openAddModal}
        />
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>المعرف</th>
                  <th>اسم الماركة</th>
                  <th>الرابط المباشر</th>
                  <th>الحالة</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>
                      #{b.id}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <TagIcon size={16} style={{ color: 'var(--color-royal-blue)' }} />
                        <strong>{b.name}</strong>
                      </div>
                    </td>
                    <td dir="ltr" style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)', textAlign: 'start' }}>
                      <bdi>{b.slug}</bdi>
                    </td>
                    <td>
                      {b.is_active ? (
                        <Tag variant="success">نشطة</Tag>
                      ) : (
                        <Tag variant="warning">معطلة</Tag>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(b)} aria-label="تعديل الماركة" title="تعديل الماركة">
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteModal({ open: true, brand: b, loading: false })}
                          aria-label="حذف الماركة"
                          title="حذف الماركة"
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
        title={editModal.isEdit ? 'تعديل الماركة' : 'إضافة ماركة جديدة'}
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
              <span>{editModal.isEdit ? 'حفظ التعديلات' : 'إضافة الماركة'}</span>
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="اسم الماركة"
            placeholder="مثال: Lenovo, Dell, Apple..."
            value={editModal.formData.name}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                formData: { ...prev.formData, name: e.target.value },
              }))
            }
            required
          />

          <Input
            label="الرابط الفريد - اختياري"
            placeholder="lenovo"
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
            <span>تفعيل الماركة وعرضها في الفلاتر</span>
          </label>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, brand: null, loading: false })}
        title="تأكيد حذف الماركة"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteModal({ open: false, brand: null, loading: false })}
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
          هل أنت متأكد من رغبتك في حذف الماركة:
          <br />
          <strong>{deleteModal.brand?.name}</strong>؟
        </p>
      </Modal>
    </Page>
  );
}
