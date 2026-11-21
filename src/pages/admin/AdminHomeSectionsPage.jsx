import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import styles from './AdminHomeSectionsPage.module.css';

export default function AdminHomeSectionsPage() {
  const { success, error: toastError } = useToast();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    key: '',
    title: '',
    source: 'newest',
    source_value: '',
    limit: 8,
    is_active: true,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/home-sections');
      setSections(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل أقسام الرئيسية');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleAddNew = () => {
    setEditingSection(null);
    setFormData({
      key: '',
      title: '',
      source: 'newest',
      source_value: '',
      limit: 8,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (sec) => {
    setEditingSection(sec);
    setFormData({
      key: sec.key || '',
      title: sec.title || '',
      source: sec.source || 'newest',
      source_value: sec.source_value || '',
      limit: sec.limit || 8,
      is_active: Boolean(sec.is_active),
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.key.trim() || !formData.title.trim()) {
      toastError('رمز القسم وعنوانه مطلوبان');
      return;
    }
    try {
      if (editingSection) {
        await api.patch(`/admin/home-sections/${editingSection.id}`, formData);
        success('تم تحديث القسم بنجاح');
      } else {
        await api.post('/admin/home-sections', formData);
        success('تمت إضافة القسم بنجاح');
      }
      setModalOpen(false);
      fetchSections();
    } catch (err) {
      toastError(err.message || 'فشل حفظ القسم');
    }
  };

  const handleToggleActive = async (sec) => {
    try {
      await api.patch(`/admin/home-sections/${sec.id}/toggle`);
      success(sec.is_active ? 'تم إخفاء القسم' : 'تم تفعيل القسم');
      fetchSections();
    } catch (err) {
      toastError(err.message || 'فشل تغيير حالة القسم');
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setSections(newSections);
    try {
      const ids = newSections.map((s) => s.id);
      await api.post('/admin/home-sections/reorder', { ids });
      success('تم تحديث ترتيب الأقسام');
    } catch (err) {
      toastError(err.message || 'فشل تحديث الترتيب');
      fetchSections();
    }
  };

  const handleDeleteRequest = (sec) => {
    setSectionToDelete(sec);
    setDeleteDialogOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!sectionToDelete) return;
    try {
      await api.delete(`/admin/home-sections/${sectionToDelete.id}`);
      success('تم حذف القسم بنجاح');
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
      fetchSections();
    } catch (err) {
      toastError(err.message || 'فشل حذف القسم');
    }
  };

  return (
    <Page className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>أقسام وصفوف الصفحة الرئيسية</h1>
          <p className={styles.subtitle}>التحكم في صفوف المنتجات والأجهزة المعروضة في الصفحة الرئيسية وترتيبها</p>
        </div>
        <Button variant="primary" onClick={handleAddNew}>
          <Plus size={16} />
          <span>إضافة قسم جديد</span>
        </Button>
      </div>

      <div className={styles.titleDivider} aria-hidden="true" />

      {loading ? (
        <div className={styles.loadingGrid}>
          <Skeleton height="80px" borderRadius="var(--radius-lg)" />
          <Skeleton height="80px" borderRadius="var(--radius-lg)" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSections} />
      ) : (
        <div className={styles.sectionsList}>
          {sections.map((sec, idx) => (
            <div key={sec.id} className={`${styles.secCard} ${!sec.is_active ? styles.secInactive : ''}`}>
              <div className={styles.secInfo}>
                <div className={styles.secTop}>
                  <h3 className={styles.secTitle}>{sec.title}</h3>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(sec)}
                    className={`${styles.togglePill} ${sec.is_active ? styles.toggleActive : styles.toggleInactive}`}
                  >
                    {sec.is_active ? 'نشط' : 'مخفي'}
                  </button>
                </div>

                <div className={styles.secMeta}>
                  <span className={styles.metaBadge}>الرمز: {sec.key}</span>
                  <span className={styles.metaBadge}>
                    المصدر: {sec.source === 'type' ? 'نوع الأجهزة' : sec.source === 'category' ? 'فئة محددة' : sec.source}
                    {sec.source_value ? ` (${sec.source_value})` : ''}
                  </span>
                  <span className={styles.metaBadge}>الحد الأقصى: {sec.limit} أجهزة</span>
                </div>
              </div>

              <div className={styles.secActions}>
                <div className={styles.reorderBtns}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className={styles.iconBtn}
                    title="تحريك لأعلى"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sections.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className={styles.iconBtn}
                    title="تحريك لأسفل"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <div className={styles.crudBtns}>
                  <button type="button" onClick={() => handleEdit(sec)} className={styles.iconBtn} title="تعديل">
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(sec)}
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>{editingSection ? 'تعديل القسم' : 'إضافة قسم رئيسي جديد'}</h3>

            <form onSubmit={handleFormSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>عنوان القسم الظاهر للعميل *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: أحدث أجهزة اللابتوب"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>رمز القسم البرمجي (Key) *</label>
                  <input
                    type="text"
                    required
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="مثال: newest_laptops"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>مصدر المنتجات</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="newest">الأحدث وصولاً (Newest)</option>
                    <option value="type">نوع الجهاز (Type: laptop / accessory)</option>
                    <option value="category">فئة محددة (Category)</option>
                    <option value="featured">الأجهزة المختارة (Featured)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>قيمة المصدر (اختياري)</label>
                  <input
                    type="text"
                    value={formData.source_value}
                    onChange={(e) => setFormData({ ...formData, source_value: e.target.value })}
                    placeholder="مثال: laptop أو accessories"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>عدد الأجهزة المعروضة</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value, 10) || 8 })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>تفعيل القسم وعرضه في الصفحة الرئيسية</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="primary">
                  حفظ القسم
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="تأكيد حذف القسم"
        message="هل أنت متأكد من حذف هذا القسم من الصفحة الرئيسية؟"
        confirmText="حذف القسم"
        cancelText="إلغاء"
        variant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSectionToDelete(null);
        }}
      />
    </Page>
  );
}
