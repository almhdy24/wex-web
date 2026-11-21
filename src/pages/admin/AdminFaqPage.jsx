import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
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
import styles from './AdminFaqPage.module.css';

export default function AdminFaqPage() {
  const { success, error: toastError } = useToast();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    is_active: true,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/faq');
      setFaqs(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل الأسئلة الشائعة');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleAddNew = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      is_active: Boolean(faq.is_active),
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      toastError('السؤال والإجابة مطلوبان');
      return;
    }
    try {
      if (editingFaq) {
        await api.patch(`/admin/faq/${editingFaq.id}`, formData);
        success('تم تحديث السؤال بنجاح');
      } else {
        await api.post('/admin/faq', formData);
        success('تمت إضافة السؤال بنجاح');
      }
      setModalOpen(false);
      fetchFaqs();
    } catch (err) {
      toastError(err.message || 'فشل حفظ السؤال');
    }
  };

  const handleToggleActive = async (faq) => {
    try {
      await api.patch(`/admin/faq/${faq.id}/toggle`);
      success(faq.is_active ? 'تم إخفاء السؤال' : 'تم تفعيل السؤال');
      fetchFaqs();
    } catch (err) {
      toastError(err.message || 'فشل تغيير حالة السؤال');
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const newFaqs = [...faqs];
    const temp = newFaqs[index];
    newFaqs[index] = newFaqs[targetIndex];
    newFaqs[targetIndex] = temp;

    setFaqs(newFaqs);
    try {
      const ids = newFaqs.map((f) => f.id);
      await api.post('/admin/faq/reorder', { ids });
      success('تم تحديث ترتيب الأسئلة');
    } catch (err) {
      toastError(err.message || 'فشل تحديث الترتيب');
      fetchFaqs();
    }
  };

  const handleDeleteRequest = (faq) => {
    setFaqToDelete(faq);
    setDeleteDialogOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!faqToDelete) return;
    try {
      await api.delete(`/admin/faq/${faqToDelete.id}`);
      success('تم حذف السؤال بنجاح');
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
      fetchFaqs();
    } catch (err) {
      toastError(err.message || 'فشل حذف السؤال');
    }
  };

  return (
    <Page className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>الأسئلة الشائعة</h1>
          <p className={styles.subtitle}>إدارة الأسئلة المتكررة وإجاباتها التي تظهر للعملاء في صفحة المساعدة</p>
        </div>
        <Button variant="primary" onClick={handleAddNew}>
          <Plus size={16} />
          <span>إضافة سؤال جديد</span>
        </Button>
      </div>

      <div className={styles.titleDivider} aria-hidden="true" />

      {loading ? (
        <div className={styles.loadingGrid}>
          <Skeleton height="80px" borderRadius="var(--radius-lg)" />
          <Skeleton height="80px" borderRadius="var(--radius-lg)" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchFaqs} />
      ) : (
        <div className={styles.faqList}>
          {faqs.map((faq, idx) => (
            <div key={faq.id} className={`${styles.faqCard} ${!faq.is_active ? styles.faqInactive : ''}`}>
              <div className={styles.faqInfo}>
                <div className={styles.faqTop}>
                  <HelpCircle size={18} className={styles.faqIcon} />
                  <h3 className={styles.faqQuestion}>{faq.question}</h3>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(faq)}
                    className={`${styles.togglePill} ${faq.is_active ? styles.toggleActive : styles.toggleInactive}`}
                  >
                    {faq.is_active ? 'نشط' : 'مخفي'}
                  </button>
                </div>

                <p className={styles.faqAnswer}>{faq.answer}</p>
              </div>

              <div className={styles.faqActions}>
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
                    disabled={idx === faqs.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className={styles.iconBtn}
                    title="تحريك لأسفل"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <div className={styles.crudBtns}>
                  <button type="button" onClick={() => handleEdit(faq)} className={styles.iconBtn} title="تعديل">
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(faq)}
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
            <h3 className={styles.modalTitle}>{editingFaq ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</h3>

            <form onSubmit={handleFormSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>نص السؤال *</label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="مثال: كيف يعمل نظام تثبيت السعر؟"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>الإجابة المفصلة *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="نص الإجابة بوضوح وسلاسة..."
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
                  <span>تفعيل السؤال في صفحة الأسئلة الشائعة</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="primary">
                  حفظ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="تأكيد حذف السؤال"
        message="هل أنت متأكد من حذف هذا السؤال من الأسئلة الشائعة؟"
        confirmText="حذف السؤال"
        cancelText="إلغاء"
        variant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setFaqToDelete(null);
        }}
      />
    </Page>
  );
}
