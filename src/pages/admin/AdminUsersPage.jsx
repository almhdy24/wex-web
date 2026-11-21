import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import DataList from '../../components/admin/DataList';
import FilterBar from '../../components/admin/FilterBar';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import styles from './AdminUsersPage.module.css';

export default function AdminUsersPage() {
  const { user: currentAdmin, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters from searchParams
  const searchQuery = searchParams.get('q') || '';
  const roleFilter = searchParams.get('role') || '';
  const activeFilter = searchParams.get('is_active') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  // Role Change Modal
  const [roleModal, setRoleModal] = useState({
    open: false,
    user: null,
    newRole: 'customer',
    submitting: false,
  });

  // Status Toggle Confirm Dialog
  const [statusConfirm, setStatusConfirm] = useState({
    open: false,
    user: null,
    loading: false,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        per_page: 20,
      };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== '') params.is_active = activeFilter;

      const res = await adminApi.getUsers(params);
      setUsers(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, activeFilter, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val !== undefined && val !== null && val !== '') {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const handleOpenRoleModal = (u) => {
    if (!isAdmin) {
      toastError('تعديل الصلاحيات متاح فقط للمدير العام');
      return;
    }
    setRoleModal({
      open: true,
      user: u,
      newRole: u.role,
      submitting: false,
    });
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleModal.user) return;
    try {
      setRoleModal((prev) => ({ ...prev, submitting: true }));
      await adminApi.updateUserRole(roleModal.user.id, roleModal.newRole);
      success('تم تحديث دور المستخدم بنجاح');
      setRoleModal({ open: false, user: null, newRole: 'customer', submitting: false });
      setUsers((prev) =>
        prev.map((u) => (u.id === roleModal.user.id ? { ...u, role: roleModal.newRole } : u))
      );
    } catch (err) {
      toastError(err.message || 'فشل في تحديث الدور');
      setRoleModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleToggleStatus = (u) => {
    if (!isAdmin) {
      toastError('تعديل حالة الحساب متاح فقط للمدير العام');
      return;
    }
    if (u.id === currentAdmin?.id) {
      toastError('لا يمكنك تعطيل حسابك الحالي');
      return;
    }
    setStatusConfirm({ open: true, user: u, loading: false });
  };

  const handleConfirmStatusChange = async () => {
    const targetUser = statusConfirm.user;
    if (!targetUser) return;
    const nextActive = targetUser.is_active ? 0 : 1;
    try {
      setStatusConfirm((prev) => ({ ...prev, loading: true }));
      await adminApi.updateUserStatus(targetUser.id, nextActive);
      success(nextActive === 1 ? 'تم تنشيط الحساب بنجاح' : 'تم تعطيل الحساب');
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: nextActive } : u))
      );
      setStatusConfirm({ open: false, user: null, loading: false });
    } catch (err) {
      toastError(err.message || 'فشل في تعديل حالة الحساب');
      setStatusConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (roleFilter) count++;
    if (activeFilter !== '') count++;
    return count;
  }, [roleFilter, activeFilter]);

  const columns = [
    {
      key: 'name',
      label: 'المستخدم',
      isPrimary: true,
      render: (u) => (
        <div className={styles.userPrimary}>
          <span className={styles.userName}>{u.name || 'بدون اسم'}</span>
          <span className={styles.userEmail} dir="ltr">{u.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'الهاتف',
      render: (u) => (
        <span className={styles.phoneText} dir="ltr">
          {u.phone || '—'}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'الدور',
      render: (u) => {
        if (u.role === 'admin') return <Tag variant="warning">مدير عام</Tag>;
        if (u.role === 'staff') return <Tag variant="info">موظف متجر</Tag>;
        return <Tag variant="neutral">عميل</Tag>;
      },
    },
    {
      key: 'is_active',
      label: 'الحالة',
      isStatus: true,
      render: (u) => {
        const isActive = Number(u.is_active) === 1;
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(u)}
            disabled={!isAdmin || u.id === currentAdmin?.id}
            style={{ background: 'none', border: 'none', cursor: isAdmin ? 'pointer' : 'default', padding: 0 }}
            title={isAdmin ? (isActive ? 'تعطيل الحساب' : 'تفعيل الحساب') : undefined}
          >
            {isActive ? <Tag variant="success">نشط</Tag> : <Tag variant="danger">معطل</Tag>}
          </button>
        );
      },
    },
    {
      key: 'created_at',
      label: 'تاريخ التسجيل',
      hideOnMobile: true,
      render: (u) => (
        <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
          {formatDate(u.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      hideOnMobile: true,
      render: (u) => (
        <div className={styles.actionsCell}>
          <button
            type="button"
            className={`${styles.actionBtn} ${!isAdmin ? styles.actionBtnDisabled : ''}`}
            onClick={() => handleOpenRoleModal(u)}
            disabled={!isAdmin}
            title={isAdmin ? 'تغيير الدور والصلاحيات' : 'متاح للمدير العام فقط'}
            aria-label="تغيير الدور والصلاحيات"
          >
            <ShieldCheck size={14} />
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${!isAdmin || u.id === currentAdmin?.id ? styles.actionBtnDisabled : ''}`}
            onClick={() => handleToggleStatus(u)}
            disabled={!isAdmin || u.id === currentAdmin?.id}
            title={isAdmin ? (u.is_active ? 'تعطيل الحساب' : 'تنشيط الحساب') : 'متاح للمدير العام فقط'}
            aria-label={u.is_active ? 'تعطيل الحساب' : 'تنشيط الحساب'}
          >
            {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <Page className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>إدارة المستخدمين والصلاحيات</h1>
        <p className={styles.subtitle}>
          عرض العملاء والموظفين وإدارة أدوار الحسابات وحالات التنشيط
        </p>
      </header>

      {/* Decorative Ribbon */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Filter and Search Bar */}
      <FilterBar
        search={searchQuery}
        onSearchChange={(val) => updateParam('q', val)}
        searchPlaceholder="ابحث بالاسم أو البريد أو الهاتف..."
        filterCount={activeFiltersCount}
        onClearFilters={() => setSearchParams(new URLSearchParams())}
      >
        <Select
          label="الدور"
          value={roleFilter}
          onChange={(e) => updateParam('role', e.target.value)}
          options={[
            { value: '', label: 'كافة الأدوار' },
            { value: 'admin', label: 'مدير عام (Admin)' },
            { value: 'staff', label: 'موظف متجر (Staff)' },
            { value: 'customer', label: 'عميل (Customer)' },
          ]}
        />
        <Select
          label="الحالة"
          value={activeFilter}
          onChange={(e) => updateParam('is_active', e.target.value)}
          options={[
            { value: '', label: 'كافة الحالات' },
            { value: '1', label: 'حساب نشط' },
            { value: '0', label: 'حساب معطل' },
          ]}
        />
      </FilterBar>

      {/* Main Content */}
      {error && !loading ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : (
        <DataList
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="لم يتم العثور على مستخدمين يطابقون معايير البحث"
          pagination={
            meta.total_pages > 1
              ? {
                  currentPage: meta.page,
                  totalPages: meta.total_pages,
                  onPageChange: (newPage) => updateParam('page', newPage),
                }
              : null
          }
        />
      )}

      {/* Change Role Modal */}
      <Modal
        isOpen={roleModal.open}
        onClose={() => setRoleModal((prev) => ({ ...prev, open: false }))}
        title={`تعديل دور المستخدم: ${roleModal.user?.name || ''}`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setRoleModal((prev) => ({ ...prev, open: false }))}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              loading={roleModal.submitting}
              onClick={handleRoleSubmit}
            >
              تأكيد تغيير الدور
            </Button>
          </>
        }
      >
        <form onSubmit={handleRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)', margin: 0, lineHeight: 1.6 }}>
            حدد الصلاحيات المناسبة للمستخدم. الموظف يمتلك حق مراجعة المدفوعات والطلبات فقط، بينما يمتلك المدير كافة الصلاحيات.
          </p>

          <Select
            label="الدور الجديد"
            value={roleModal.newRole}
            onChange={(e) => setRoleModal((prev) => ({ ...prev, newRole: e.target.value }))}
            options={[
              { value: 'customer', label: 'عميل (شراء ومتابعة الطلبات الشخصية)' },
              { value: 'staff', label: 'موظف متجر (الطلبات وإشعارات بنكك فقط)' },
              { value: 'admin', label: 'مدير عام (صلاحيات كاملة لكافة أقسام النظام)' },
            ]}
          />
        </form>
      </Modal>

      {/* Status Toggle Confirm Dialog */}
      <ConfirmDialog
        isOpen={statusConfirm.open}
        onClose={() => setStatusConfirm({ open: false, user: null, loading: false })}
        onConfirm={handleConfirmStatusChange}
        title={statusConfirm.user?.is_active ? 'تأكيد تعطيل الحساب' : 'تأكيد تنشيط الحساب'}
        message={
          statusConfirm.user?.is_active
            ? `هل أنت متأكد من تعطيل حساب "${statusConfirm.user?.name}"؟ لن يتمكن من تسجيل الدخول إلى المتجر أو لوحة التحكم.`
            : `هل أنت متأكد من إعادة تنشيط حساب "${statusConfirm.user?.name}"؟`
        }
        confirmText={statusConfirm.user?.is_active ? 'تعطيل الحساب' : 'تنشيط الحساب'}
        variant={statusConfirm.user?.is_active ? 'danger' : 'primary'}
        loading={statusConfirm.loading}
      />
    </Page>
  );
}
