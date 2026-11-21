import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import styles from './AdminHeroSlidesPage.module.css';

export default function AdminHeroSlidesPage() {
  const { success, error: toastError } = useToast();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    button_label: '',
    link: '',
    is_active: true,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState(null);

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/hero-slides');
      setSlides(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل الشرائح');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleAddNew = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      image: '',
      button_label: 'استعرض الأجهزة',
      link: '/products',
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      image: slide.image || '',
      button_label: slide.button_label || '',
      link: slide.link || '',
      is_active: Boolean(slide.is_active),
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastError('عنوان الشريحة مطلوب');
      return;
    }
    try {
      if (editingSlide) {
        await api.patch(`/admin/hero-slides/${editingSlide.id}`, formData);
        success('تم تحديث الشريحة بنجاح');
      } else {
        await api.post('/admin/hero-slides', formData);
        success('تمت إضافة الشريحة بنجاح');
      }
      setModalOpen(false);
      fetchSlides();
    } catch (err) {
      toastError(err.message || 'فشل حفظ الشريحة');
    }
  };

  const handleToggleActive = async (slide) => {
    try {
      await api.patch(`/admin/hero-slides/${slide.id}/toggle`);
      success(slide.is_active ? 'تم إيقاف الشريحة' : 'تم تفعيل الشريحة');
      fetchSlides();
    } catch (err) {
      toastError(err.message || 'فشل تغيير حالة الشريحة');
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    setSlides(newSlides);
    try {
      const ids = newSlides.map((s) => s.id);
      await api.post('/admin/hero-slides/reorder', { ids });
      success('تم تحديث الترتيب');
    } catch (err) {
      toastError(err.message || 'فشل تحديث الترتيب');
      fetchSlides();
    }
  };

  const handleDeleteRequest = (slide) => {
    setSlideToDelete(slide);
    setDeleteDialogOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!slideToDelete) return;
    try {
      await api.delete(`/admin/hero-slides/${slideToDelete.id}`);
      success('تم حذف الشريحة بنجاح');
      setDeleteDialogOpen(false);
      setSlideToDelete(null);
      fetchSlides();
    } catch (err) {
      toastError(err.message || 'فشل حذف الشريحة');
    }
  };

  return (
    <Page className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>شرائح الواجهة الرئيسية (Hero Slides)</h1>
          <p className={styles.subtitle}>تعديل وترتيب الشرائح الترويجية التي تظهر في أعلى الصفحة الرئيسية</p>
        </div>
        <Button variant="primary" onClick={handleAddNew}>
          <Plus size={16} />
          <span>إضافة شريحة جديدة</span>
        </Button>
      </div>

      <div className={styles.titleDivider} aria-hidden="true" />

      {loading ? (
        <div className={styles.loadingGrid}>
          <Skeleton height="100px" borderRadius="var(--radius-lg)" />
          <Skeleton height="100px" borderRadius="var(--radius-lg)" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSlides} />
      ) : (
        <div className={styles.slidesList}>
          {slides.map((slide, idx) => (
            <div key={slide.id} className={`${styles.slideCard} ${!slide.is_active ? styles.slideInactive : ''}`}>
              <div className={styles.slideVisualCol}>
                {slide.image ? (
                  <img src={slide.image} alt={slide.title} className={styles.slideThumb} />
                ) : (
                  <div className={styles.slideNoImg}>
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>

              <div className={styles.slideContentCol}>
                <div className={styles.slideTitleRow}>
                  <h3 className={styles.slideTitle}>{slide.title}</h3>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(slide)}
                    className={`${styles.togglePill} ${slide.is_active ? styles.toggleActive : styles.toggleInactive}`}
                  >
                    {slide.is_active ? 'نشطة' : 'معطلة'}
                  </button>
                </div>
                {slide.subtitle && <p className={styles.slideSub}>{slide.subtitle}</p>}
                <div className={styles.slideMetaRow}>
                  <span className={styles.metaLabel}>الزر: {slide.button_label || 'افتراضي'}</span>
                  <span className={styles.metaLabel}>الرابط: {slide.link || 'افتراضي'}</span>
                </div>
              </div>

              <div className={styles.slideActionsCol}>
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
                    disabled={idx === slides.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className={styles.iconBtn}
                    title="تحريك لأسفل"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <div className={styles.crudBtns}>
                  <button type="button" onClick={() => handleEdit(slide)} className={styles.iconBtn} title="تعديل">
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(slide)}
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
            <h3 className={styles.modalTitle}>{editingSlide ? 'تعديل الشريحة' : 'إضافة شريحة جديدة'}</h3>

            <form onSubmit={handleFormSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>عنوان الشريحة الرئيسي *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: أجهزة لابتوب مختارة لأعمالك ودراستك"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>النص التوضيحي (الفرعي)</label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="تفاصيل العرض أو الميزة..."
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>رابط الصورة (اختياري)</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="مثال: /assets/hero/hero-1.webp أو رابط خارجي"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نص زر التوجيه (CTA)</label>
                  <input
                    type="text"
                    value={formData.button_label}
                    onChange={(e) => setFormData({ ...formData, button_label: e.target.value })}
                    placeholder="مثال: استعرض الأجهزة"
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>رابط الزر</label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="مثال: /products?sort=newest"
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
                  <span>تفعيل الشريحة في المتجر</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="primary">
                  حفظ الشريحة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="تأكيد حذف الشريحة"
        message="هل أنت متأكد من حذف هذه الشريحة؟"
        confirmText="حذف الشريحة"
        cancelText="إلغاء"
        variant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSlideToDelete(null);
        }}
      />
    </Page>
  );
}
