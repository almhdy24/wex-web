import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminAnnouncementsPage.module.css';

export default function AdminAnnouncementsPage() {
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    kind: 'info',
    placement: 'banner',
    link_label: '',
    link_url: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
    is_dismissible: true,
    sort_order: 0,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/announcements');
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل الإعلانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      body: '',
      kind: 'info',
      placement: 'banner',
      link_label: '',
      link_url: '',
      starts_at: '',
      ends_at: '',
      is_active: true,
      is_dismissible: true,
      sort_order: 0,
    });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      body: item.body || '',
      kind: item.kind || 'info',
      placement: item.placement || 'banner',
      link_label: item.link_label || '',
      link_url: item.link_url || '',
      starts_at: item.starts_at ? item.starts_at.slice(0, 16) : '',
      ends_at: item.ends_at ? item.ends_at.slice(0, 16) : '',
      is_active: Boolean(item.is_active),
      is_dismissible: Boolean(item.is_dismissible),
      sort_order: item.sort_order || 0,
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      toastError('عنوان الإعلان ونصه مطلوبان');
      return;
    }

    try {
      if (editingItem) {
        await api.patch(`/admin/announcements/${editingItem.id}`, formData);
        success('تم تحديث الإعلان بنجاح');
      } else {
        await api.post('/admin/announcements', formData);
        success('تم إنشاء الإعلان بنجاح');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toastError(err.message || 'فشل حفظ الإعلان');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await api.patch(`/admin/announcements/${item.id}/toggle`);
      success(item.is_active ? 'تم إيقاف الإعلان' : 'تم تفعيل الإعلان');
      fetchItems();
    } catch (err) {
      toastError(err.message || 'فشل تغيير حالة الإعلان');
    }
  };

  const handleDeleteRequest = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/admin/announcements/${itemToDelete.id}`);
      success('تم حذف الإعلان بنجاح');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err) {
      toastError(err.message || 'فشل حذف الإعلان');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>إدارة الإعلانات والتنبيهات</h1>
          <p className={styles.subtitle}>نشر الإعلانات والرسائل الترويجية والتنبيهات في شاشات المتجر</p>
        </div>
        <Button variant="primary" onClick={handleAddNew}>
          <Plus size={16} />
          <span>إضافة إعلان جديد</span>
        </Button>
      </div>

      <div className={styles.titleDivider} aria-hidden="true" />

      {loading ? (
        <div className={styles.loadingGrid}>
          <Skeleton height="100px" borderRadius="var(--radius-lg)" />
          <Skeleton height="100px" borderRadius="var(--radius-lg)" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchItems} />
      ) : items.length === 0 ? (
        <div className={styles.emptyCard}>
          <Megaphone size={40} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>لا توجد إعلانات منشورة حالياً</h3>
          <p className={styles.emptyDesc}>يمكنك إنشاء إعلان أو تنبيه يظهر كشريط علوي، أو إشعار منبثق، أو بطاقة في الصفحة الرئيسية.</p>
          <Button variant="primary" size="sm" onClick={handleAddNew} style={{ marginTop: '12px' }}>
            <Plus size={14} />
            <span>إضافة إعلان</span>
          </Button>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {items.map((item) => (
            <div key={item.id} className={`${styles.card} ${!item.is_active ? styles.cardInactive : ''}`}>
              <div className={styles.cardTop}>
                <div className={styles.badgesRow}>
                  <span className={`${styles.kindBadge} ${styles['kind_' + item.kind]}`}>
                    {item.kind === 'promo' ? 'ترويجي' : item.kind === 'warning' ? 'تحذير' : 'معلومة'}
                  </span>
                  <span className={styles.placementBadge}>
                    {item.placement === 'banner' ? 'شريط علوي' : item.placement === 'toast' ? 'إشعار منبثق' : 'بطاقة رئيسية'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(item)}
                  className={`${styles.togglePill} ${item.is_active ? styles.toggleActive : styles.toggleInactive}`}
                >
                  {item.is_active ? 'نشط' : 'معطل'}
                </button>
              </div>

              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardBody}>{item.body}</p>

              {(item.starts_at || item.ends_at) && (
                <div className={styles.datesRow}>
                  <Calendar size={14} />
                  <span>
                    {item.starts_at ? new Date(item.starts_at).toLocaleDateString('ar-SD') : 'مباشرة'}
                    {' إلى '}
                    {item.ends_at ? new Date(item.ends_at).toLocaleDateString('ar-SD') : 'مفتوح'}
                  </span>
                </div>
              )}

              <div className={styles.cardActions}>
                <button type="button" onClick={() => handleEdit(item)} className={styles.actionBtn}>
                  <Edit2 size={16} />
                  <span>تعديل</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRequest(item)}
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                >
                  <Trash2 size={16} />
                  <span>حذف</span>
                </button>
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
              {editingItem ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}
            </h3>

            <form onSubmit={handleFormSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>عنوان الإعلان *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان الإعلان أو التنبيه"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>نص الإعلان *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="نص الإعلان بالتفصيل..."
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>النوع</label>
                  <select
                    value={formData.kind}
                    onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="info">معلومة (أزرق)</option>
                    <option value="promo">ترويجي (أخضر)</option>
                    <option value="warning">تحذير (برتقالي)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>مكان الظهور</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="banner">شريط علوي (تحت القائمة)</option>
                    <option value="toast">إشعار منبثق (أسفل الشاشة)</option>
                    <option value="home">بطاقة في الصفحة الرئيسية</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>تاريخ البدء (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نص الرابط (اختياري)</label>
                  <input
                    type="text"
                    value={formData.link_label}
                    onChange={(e) => setFormData({ ...formData, link_label: e.target.value })}
                    placeholder="مثال: تسوق الآن"
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>الرابط (اختياري)</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="مثال: /products?type=laptop"
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
                  <span>تفعيل الإعلان فور الحفظ</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_dismissible}
                    onChange={(e) => setFormData({ ...formData, is_dismissible: e.target.checked })}
                  />
                  <span>قابل للإغلاق بواسطة العميل</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="primary">
                  حفظ الإعلان
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="تأكيد حذف الإعلان"
        message="هل أنت متأكد من حذف هذا الإعلان نهائياً؟"
        confirmText="حذف الإعلان"
        cancelText="إلغاء"
        variant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}
