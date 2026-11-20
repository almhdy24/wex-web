import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  Eye,
  Building2,
  FileText,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminAr } from '../../content/admin.ar';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import PaymentAccountsDisplay from '../../components/store/PaymentAccountsDisplay';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminPaymentAccountsPage.module.css';

export default function AdminPaymentAccountsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const isAdmin = user?.role === 'admin';

  const [accounts, setAccounts] = useState([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState(null);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    branch: '',
    notes: '',
    is_active: true,
  });

  // Security Confirm Dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Delete Confirm Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const fetchAccounts = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [accRes, setRes] = await Promise.all([
        api.get('/admin/payment-accounts'),
        api.get('/admin/settings'),
      ]);
      setAccounts(Array.isArray(accRes?.data) ? accRes.data : []);
      if (setRes?.data?.payment_general_notes !== undefined) {
        setGeneralNotes(setRes.data.payment_general_notes || '');
      }
    } catch (err) {
      setError(err.message || 'تعذر تحميل حسابات الدفع');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Open modal for add
  const handleAddNew = () => {
    setEditingAccount(null);
    setFormData({
      bank_name: '',
      account_name: '',
      account_number: '',
      branch: '',
      notes: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (acc) => {
    setEditingAccount(acc);
    setFormData({
      bank_name: acc.bank_name || '',
      account_name: acc.account_name || '',
      account_number: acc.account_number || '',
      branch: acc.branch || '',
      notes: acc.notes || '',
      is_active: Boolean(acc.is_active),
    });
    setModalOpen(true);
  };

  // Request saving account (triggers security confirm)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.bank_name.trim() || !formData.account_name.trim() || !formData.account_number.trim()) {
      toastError('يرجى ملء جميع الحقول المطلوبة (اسم البنك، صاحب الحساب، رقم الحساب)');
      return;
    }
    setPendingAction({
      type: editingAccount ? 'update' : 'create',
      id: editingAccount?.id,
      data: {
        ...formData,
        confirm: true,
      },
    });
    setConfirmDialogOpen(true);
  };

  // Execute confirmed action
  const handleExecuteConfirmedAction = async () => {
    if (!pendingAction) return;
    setProcessingAction(true);
    try {
      if (pendingAction.type === 'create') {
        await api.post('/admin/payment-accounts', pendingAction.data);
        success('تمت إضافة حساب الدفع بنجاح وإرسال تنبيه للمشرفين');
      } else if (pendingAction.type === 'update') {
        await api.patch(`/admin/payment-accounts/${pendingAction.id}`, pendingAction.data);
        success('تم تحديث بيانات الحساب البنكي بنجاح');
      }
      setModalOpen(false);
      setConfirmDialogOpen(false);
      setPendingAction(null);
      await fetchAccounts();
    } catch (err) {
      toastError(err.message || 'فشل حفظ التعديلات');
    } finally {
      setProcessingAction(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (acc) => {
    try {
      await api.patch(`/admin/payment-accounts/${acc.id}/toggle`, { confirm: true });
      success(acc.is_active ? 'تم تعطيل الحساب مؤقتاً' : 'تم تفعيل الحساب لاستقبال التحويلات');
      fetchAccounts();
    } catch (err) {
      toastError(err.message || 'تعذر تغيير حالة الحساب');
    }
  };

  // Delete account confirmation
  const handleDeleteRequest = (acc) => {
    setAccountToDelete(acc);
    setDeleteDialogOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/admin/payment-accounts/${accountToDelete.id}`, { confirm: true });
      success('تم حذف الحساب البنكي بنجاح');
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      fetchAccounts();
    } catch (err) {
      toastError(err.message || 'فشل حذف الحساب');
    }
  };

  // Reorder accounts
  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= accounts.length) return;

    const newAccounts = [...accounts];
    const temp = newAccounts[index];
    newAccounts[index] = newAccounts[targetIndex];
    newAccounts[targetIndex] = temp;

    setAccounts(newAccounts);
    try {
      const ids = newAccounts.map((a) => a.id);
      await api.post('/admin/payment-accounts/reorder', { ids, confirm: true });
      success('تم تحديث ترتيب الحسابات');
    } catch (err) {
      toastError(err.message || 'فشل تحديث الترتيب');
      fetchAccounts();
    }
  };

  // Save General Payment Notes
  const handleSaveGeneralNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch('/admin/settings', { payment_general_notes: generalNotes });
      success('تم حفظ تعليمات الدفع العامة بنجاح');
    } catch (err) {
      toastError(err.message || 'فشل حفظ التعليمات العامة');
    } finally {
      setSavingNotes(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.forbiddenCard}>
          <ShieldAlert size={48} className={styles.forbiddenIcon} />
          <h2 className={styles.forbiddenTitle}>{adminAr.paymentAccounts.forbiddenTitle}</h2>
          <p className={styles.forbiddenDesc}>{adminAr.paymentAccounts.forbiddenDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{adminAr.paymentAccounts.title}</h1>
          <p className={styles.subtitle}>{adminAr.paymentAccounts.subtitle}</p>
        </div>
        <Button variant="primary" onClick={handleAddNew}>
          <Plus size={16} />
          <span>{adminAr.paymentAccounts.addNew}</span>
        </Button>
      </div>

      <div className={styles.titleDivider} aria-hidden="true" />

      {/* General Notes Card */}
      <section className={styles.notesSection} aria-label="تعليمات الدفع العامة">
        <div className={styles.notesHeader}>
          <FileText size={20} className={styles.sectionIcon} />
          <div>
            <h3 className={styles.notesTitle}>{adminAr.paymentAccounts.generalNotesTitle}</h3>
            <p className={styles.notesDesc}>{adminAr.paymentAccounts.generalNotesDesc}</p>
          </div>
        </div>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder={adminAr.paymentAccounts.generalNotesPlaceholder}
          className={styles.notesTextarea}
          rows={3}
        />
        <div className={styles.notesFooter}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveGeneralNotes}
            disabled={savingNotes}
          >
            {savingNotes ? 'جاري الحفظ...' : adminAr.paymentAccounts.saveGeneralNotes}
          </Button>
        </div>
      </section>

      {/* Accounts List Section */}
      <section className={styles.accountsSection} aria-label="قائمة الحسابات البنكية">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            الحسابات المسجلة ({accounts.length})
          </h2>
          <span className={styles.securityTag}>
            <ShieldAlert size={14} />
            <span>مشفرة وخاضعة لسجل التدقيق</span>
          </span>
        </div>

        {loading ? (
          <div className={styles.loadingGrid}>
            <Skeleton height="120px" borderRadius="var(--radius-lg)" />
            <Skeleton height="120px" borderRadius="var(--radius-lg)" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAccounts} />
        ) : accounts.length === 0 ? (
          <div className={styles.emptyCard}>
            <Landmark size={40} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>{adminAr.paymentAccounts.emptyTitle}</h3>
            <p className={styles.emptyDesc}>{adminAr.paymentAccounts.emptyDesc}</p>
            <Button variant="primary" size="sm" onClick={handleAddNew} style={{ marginTop: '16px' }}>
              <Plus size={14} />
              <span>{adminAr.paymentAccounts.addNew}</span>
            </Button>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {accounts.map((acc, idx) => (
              <div
                key={acc.id}
                className={`${styles.accountCard} ${!acc.is_active ? styles.inactiveCard : ''}`}
              >
                <div className={styles.cardTopRow}>
                  <div className={styles.bankInfo}>
                    <Building2 size={20} className={styles.bankIcon} />
                    <div>
                      <h4 className={styles.cardBankName}>{acc.bank_name}</h4>
                      {acc.branch && <span className={styles.cardBranch}>{acc.branch}</span>}
                    </div>
                  </div>

                  <span
                    className={`${styles.statusBadge} ${
                      acc.is_active ? styles.statusActive : styles.statusInactive
                    }`}
                  >
                    {acc.is_active ? adminAr.paymentAccounts.active : adminAr.paymentAccounts.inactive}
                  </span>
                </div>

                <div className={styles.cardDetailsRow}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>صاحب الحساب:</span>
                    <strong className={styles.detailVal}>{acc.account_name}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>رقم الحساب:</span>
                    <strong className={styles.detailValNumber}>{acc.account_number}</strong>
                  </div>
                </div>

                {acc.notes && (
                  <div className={styles.cardNotes}>
                    <span className={styles.detailLabel}>ملاحظات:</span>
                    <span className={styles.notesText}>{acc.notes}</span>
                  </div>
                )}

                <div className={styles.cardActionsRow}>
                  <div className={styles.reorderBtns}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className={styles.iconBtn}
                      title={adminAr.paymentAccounts.moveUp}
                      aria-label={adminAr.paymentAccounts.moveUp}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === accounts.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className={styles.iconBtn}
                      title={adminAr.paymentAccounts.moveDown}
                      aria-label={adminAr.paymentAccounts.moveDown}
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>

                  <div className={styles.operationBtns}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(acc)}
                      className={`${styles.actionPill} ${acc.is_active ? styles.toggleOff : styles.toggleOn}`}
                    >
                      {acc.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(acc)}
                      className={styles.iconBtn}
                      title="تعديل"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(acc)}
                      className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
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
      </section>

      {/* Live Preview Section */}
      <section className={styles.previewSection} aria-label="معاينة كما يراها العميل">
        <div className={styles.previewHeader}>
          <Eye size={20} className={styles.sectionIcon} />
          <div>
            <h3 className={styles.previewTitle}>{adminAr.paymentAccounts.previewTitle}</h3>
            <p className={styles.previewSubtitle}>{adminAr.paymentAccounts.previewSubtitle}</p>
          </div>
        </div>

        <div className={styles.previewBox}>
          <PaymentAccountsDisplay
            paymentAccounts={accounts.filter((a) => Boolean(a.is_active))}
            paymentGeneralNotes={generalNotes}
            orderNumber="WX-1042"
          />
        </div>
      </section>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>
              {editingAccount ? adminAr.paymentAccounts.editAccount : adminAr.paymentAccounts.addNew}
            </h3>

            <form onSubmit={handleFormSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{adminAr.paymentAccounts.bankName} *</label>
                <input
                  type="text"
                  required
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="مثال: بنك الخرطوم (تطبيق بنكك)"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{adminAr.paymentAccounts.accountName} *</label>
                <input
                  type="text"
                  required
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="الاسم الثلاثي أو اسم المنشأة"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{adminAr.paymentAccounts.accountNumber} *</label>
                <input
                  type="text"
                  required
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="رقم الحساب البنكي بدقة"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{adminAr.paymentAccounts.branch}</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="مثال: فرع الشهداء - أم درمان"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{adminAr.paymentAccounts.notes}</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مثال: يرجى كتابة رقم الطلب في خانة الغرض"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>{adminAr.paymentAccounts.active}</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="primary">
                  مراجعة وحفظ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Confirm Dialog (High-Risk Action Confirmation) */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        title={adminAr.paymentAccounts.securityConfirmTitle}
        message={adminAr.paymentAccounts.securityConfirmDesc}
        confirmText={adminAr.paymentAccounts.confirmSecurityBtn}
        cancelText="الرجوع والتحقق مجدداً"
        variant="danger"
        isLoading={processingAction}
        onConfirm={handleExecuteConfirmedAction}
        onCancel={() => {
          setConfirmDialogOpen(false);
          setPendingAction(null);
        }}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={adminAr.paymentAccounts.deleteConfirmTitle}
        message={adminAr.paymentAccounts.deleteConfirmDesc}
        confirmText="حذف الحساب"
        cancelText="إلغاء"
        variant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setAccountToDelete(null);
        }}
      />
    </div>
  );
}
