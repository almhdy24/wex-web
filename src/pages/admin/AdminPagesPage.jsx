import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Info,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminPagesPage.module.css';

export default function AdminPagesPage() {
  const { success, error: toastError } = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    body: '',
    is_active: true,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/pages');
      setPages(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل الصفحات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleAddNew = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      title: '',
      body: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug || '',
      title: page.title || '',
      body: page.body || '',
      is_active: Boolean(page.is_active),
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      toastError('عنوان الصفحة ومحتواها مطلوبان');
      return;
    }
    try {
      if (editingPage) {
        await api.patch(`/admin/pages/${editingPage.id}`, formData);
        success('تم تحديث الصفحة بنجاح');
      } else {
        await api.post('/admin/pages', formData);
        success('تم إنشاء الصفحة بنجاح');
      }
      setModalOpen(false);
      fetchPages();
    } catch (err) {
      toastError(err.message || 'فشل حفظ الصفحة');
    }
  };

  const handleToggleActive = async (page) => {
    try {
      await api.patch(`/admin/pages/${page.id}/toggle`);
      success(page.is_active ? 'تم إخفاء الصفحة' : 'تم نشر الصفحة');
      fetchPages();
    } catch (err) {
      toastError(err.message || 'فشل تغيير حالة الصفحة');
    }
  };

  const handleDeleteRequest = (page) => {
    setPageToDelete(page);
    setDeleteDialogOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!pageToDelete) return;
    try {
      await api.delete(`/admin/pages/${pageToDelete.id}`);
      success('تم حذف الصفحة بنجاح');
      setDeleteDialogOpen(false);
      setPageToDelete(null);
      fetchPages();
    } catch (err) {
      toastError(err.message || 'فشل حذف الصفحة');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>إدارة الصفحات التعريفية والسياسات</h1>
          <p className={styles.subtitle}>
            تعديل نصوص صفحات المتجر (سياسة الخصوصية، شروط الاستخدام، سياسة الاسترجاع، عن المحل)
          </p>
        </div>
        <Button variant="primary" onClick={handleAddNew}>
          <Plus size={16} />
          <span>إضافة صفحة جديدة</span>
        </Button>
      </div>

      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Notice Banner */}
      <div className={styles.noticeBanner}>
        <Info size={18} className={styles.noticeIcon} />
        <span className={styles.noticeText}>
          تنبيه: النصوص الحالية مسودات إرشادية يُراجعها صاحب المحل، وليست استشارة قانونية.
        </span>
      </div>

      {loading ? (
        <div className={styles.loadingGrid}>
          <Skeleton height="100px" borderRadius="var(--radius-lg)" />
          <Skeleton height="100px" borderRadius="var(--radius-lg)" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPages} />
      ) : (
        <div className={styles.pagesGrid}>
          {pages.map((p) => (
            <div key={p.id} className={`${styles.pageCard} ${!p.is_active ? styles.pageInactive : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.titleRow}>
                  <FileText size={20} className={styles.pageIcon} />
                  <div>
                    <h3 className={styles.pageTitle}>{p.title}</h3>
                    <span className={styles.pageSlug}>/{p.slug}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(p)}
                  className={`${styles.togglePill} ${p.is_active ? styles.toggleActive : styles.toggleInactive}`}
                >
                  {p.is_active ? 'منشورة' : 'مسودة'}
                </button>
              </div>

              <p className={styles.pageSnippet}>
                {p.body ? p.body.slice(0, 160) + '...' : ''}
              </p>

              <div className={styles.cardFooter}>
                <span className={styles.draftBadge}>مسودة يُراجعها صاحب المحل</span>

                <div className={styles.actions}>
                  <button type="button" onClick={() => handleEdit(p)} className={styles.actionBtn}>
                    <Edit2 size={16} />
                    <span>تعديل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(p)}
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  >
                    <Trash2 size={16} />
                    <span>حذف</span>
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
            <h3 className={styles.modalTitle}>
              {editingPage ? 'تعديل الصفحة' : 'إنشاء صفحة جديدة'}
            </h3>

            <form onSubmit={handleFormSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>عنوان الصفحة *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: سياسة الخصوصية"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>معرف الرابط (Slug) *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="مثال: privacy-policy"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>محتوى الصفحة (نص منسق بالفقرات) *</label>
                <textarea
                  required
                  rows={8}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="اكتب نصوص وبنود الصفحة هنا..."
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>نشر الصفحة للعملاء</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="primary">
                  حفظ الصفحة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="تأكيد حذف الصفحة"
        message="هل أنت متأكد من حذف هذه الصفحة نهائياً؟"
        confirmText="حذف الصفحة"
        cancelText="إلغاء"
        variant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setPageToDelete(null);
        }}
      />
    </div>
  );
}
