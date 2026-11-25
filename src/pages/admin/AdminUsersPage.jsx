import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import StatusChip from '../../components/admin/StatusChip';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import DataList from '../../components/admin/DataList';
import FilterBar from '../../components/admin/FilterBar';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import styles from './AdminUsersPage.module.css';

const ROLE_DESCRIPTIONS = {
  customer: 'عميل المتجر: شراء وتصفح الأجهزة ومتابعة طلباته الشخصية فقط.',
  staff: 'موظف متجر: مراجعة الطلبات، فحص إشعارات التحويل البنكي، وتحديث حالات الشحن.',
  admin: 'مدير عام: صلاحيات كاملة للتحكم في كافة أقسام النظام والمنتجات والإعدادات والمستخدمين.',
};

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

  // Active admins count to prevent locking out the system (U4)
  const activeAdminCount = useMemo(
    () => users.filter((u) => u.role === 'admin' && u.is_active).length,
    [users]
  );

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

  const abortControllerRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
      if (controller.signal.aborted) return;

      // U5: Normalize is_active as boolean once on fetch
      const normalizedUsers = (res.data || []).map((u) => ({
        ...u,
        is_active: Number(u.is_active) === 1,
      }));

      setUsers(normalizedUsers);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      setError(err.message || 'فشل في تحميل قائمة المستخدمين');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [searchQuery, roleFilter, activeFilter, currentPage]);

  useEffect(() => {
    fetchUsers();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchUsers]);

  // U6: Update URL params with replace: true
  // Functional update so callers memoised in an earlier render (filter chips) never
  // write back a stale copy of the query string (which dropped the current search).
  const updateParam = useCallback((key, val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val !== undefined && val !== null && val !== '') {
        next.set(key, val);
      } else {
        next.delete(key);
      }
      if (key !== 'page') next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // U4: Block self role change and last admin change
  const handleOpenRoleModal = (u) => {
    if (!isAdmin) {
      toastError('تعديل الصلاحيات متاح فقط للمدير العام');
      return;
    }
    if (u.id === currentAdmin?.id) {
      toastError('لا يمكنك تعديل صلاحيات حسابك الحالي');
      return;
    }
    if (u.role === 'admin' && u.is_active && activeAdminCount <= 1) {
      toastError('لا يمكن تغيير دور المدير العام الوحيد في النظام');
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

  // U4: Block self disable and disabling last admin
  const handleToggleStatus = (u) => {
    if (!isAdmin) {
      toastError('تعديل حالة الحساب متاح فقط للمدير العام');
      return;
    }
    if (u.id === currentAdmin?.id) {
      toastError('لا يمكنك تعطيل حسابك الحالي');
      return;
    }
    if (u.is_active && u.role === 'admin' && activeAdminCount <= 1) {
      toastError('لا يمكن تعطيل المدير العام الوحيد في النظام');
      return;
    }
    setStatusConfirm({ open: true, user: u, loading: false });
  };

  const handleConfirmStatusChange = async () => {
    const targetUser = statusConfirm.user;
    if (!targetUser) return;
    const nextActive = !targetUser.is_active;
    try {
      setStatusConfirm((prev) => ({ ...prev, loading: true }));
      await adminApi.updateUserStatus(targetUser.id, nextActive ? 1 : 0);
      success(nextActive ? 'تم تنشيط الحساب بنجاح' : 'تم تعطيل الحساب');
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

  // U10: Removable active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (roleFilter) {
      const roleLabel =
        roleFilter === 'admin' ? 'مدير عام' : roleFilter === 'staff' ? 'موظف متجر' : 'عميل';
      chips.push({
        id: 'role',
        label: `الدور: ${roleLabel}`,
        onRemove: () => updateParam('role', ''),
      });
    }
    if (activeFilter !== '') {
      chips.push({
        id: 'is_active',
        label: activeFilter === '1' ? 'حساب نشط' : 'حساب معطل',
        onRemove: () => updateParam('is_active', ''),
      });
    }
    return chips;
  }, [roleFilter, activeFilter, updateParam]);

  const columns = [
    {
      key: 'name',
      label: 'المستخدم',
      isPrimary: true,
      render: (u) => (
        <div className={styles.userPrimary}>
          <span className={styles.userName}>{u.name || 'بدون اسم'}</span>
          <span className={styles.userEmail} dir="ltr">
            {u.email}
          </span>
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
      render: (u) => <StatusChip domain="role" status={u.role} />,
    },
    {
      key: 'is_active',
      label: 'الحالة',
      isStatus: true,
      render: (u) => (
        <StatusChip domain="account" status={u.is_active ? 'active' : 'inactive'} />
      ),
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
      isActions: true, // D2 & U3: renders in card footer on mobile with >=44px buttons
      render: (u) => {
        const isSelf = u.id === currentAdmin?.id;
        const isLastAdmin = u.is_active && u.role === 'admin' && activeAdminCount <= 1;
        const roleDisabled = !isAdmin || isSelf || isLastAdmin;
        const statusDisabled = !isAdmin || isSelf || isLastAdmin;

        return (
          <div className={styles.actionsCell}>
            <button
              type="button"
              className={`${styles.actionBtn} ${roleDisabled ? styles.actionBtnDisabled : ''}`}
              onClick={() => handleOpenRoleModal(u)}
              disabled={roleDisabled}
              title={
                isSelf
                  ? 'لا يمكنك تعديل صلاحيات حسابك الحالي'
                  : isLastAdmin
                  ? 'لا يمكن تغيير دور المدير الوحيد'
                  : !isAdmin
                  ? 'متاح للمدير العام فقط'
                  : 'تغيير الدور والصلاحيات'
              }
              aria-label="تغيير الدور والصلاحيات"
            >
              <ShieldCheck size={16} />
              <span className={styles.mobileActionLabel}>تغيير الدور</span>
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${statusDisabled ? styles.actionBtnDisabled : ''}`}
              onClick={() => handleToggleStatus(u)}
              disabled={statusDisabled}
              title={
                isSelf
                  ? 'لا يمكنك تعطيل حسابك الحالي'
                  : isLastAdmin
                  ? 'لا يمكن تعطيل المدير الوحيد'
                  : !isAdmin
                  ? 'متاح للمدير العام فقط'
                  : u.is_active
                  ? 'تعطيل الحساب'
                  : 'تنشيط الحساب'
              }
              aria-label={u.is_active ? 'تعطيل الحساب' : 'تنشيط الحساب'}
            >
              {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
              <span className={styles.mobileActionLabel}>
                {u.is_active ? 'تعطيل' : 'تنشيط'}
              </span>
            </button>
          </div>
        );
      },
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

      {/* Decorative Divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Filter and Search Bar */}
      <FilterBar
        search={searchQuery}
        onSearchChange={(val) => updateParam('q', val)}
        searchPlaceholder="ابحث بالاسم أو البريد أو الهاتف..."
        filterCount={activeFiltersCount}
        activeChips={activeChips}
        onClearFilters={() => setSearchParams(new URLSearchParams(), { replace: true })}
      >
        <Select
          id="userRoleFilter"
          name="role"
          label="الدور"
          value={roleFilter}
          onChange={(e) => updateParam('role', e.target.value)}
          options={[
            { value: '', label: 'كافة الأدوار' },
            { value: 'admin', label: 'مدير عام' },
            { value: 'staff', label: 'موظف متجر' },
            { value: 'customer', label: 'عميل' },
          ]}
        />
        <Select
          id="userActiveFilter"
          name="is_active"
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
          emptyAction={
            // EmptyState renders `action` as a React node; a {label,onClick} object here
            // crashed the page whenever a filter matched no users.
            activeFiltersCount > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
              >
                مسح الفلاتر
              </Button>
            ) : undefined
          }
          pagination={
            meta.total_pages > 1
              ? {
                  page: meta.page,
                  totalPages: meta.total_pages,
                  totalItems: meta.total,
                  onPageChange: (newPage) => updateParam('page', newPage),
                }
              : null
          }
        />
      )}

      {/* U8 & U9: Change Role Modal with short labels and dynamic description */}
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
              type="submit"
              form="roleChangeForm"
              loading={roleModal.submitting}
            >
              تأكيد تغيير الدور
            </Button>
          </>
        }
      >
        <form
          id="roleChangeForm"
          onSubmit={handleRoleSubmit}
          className={styles.modalForm}
        >
          <Select
            id="userNewRoleSelect"
            name="newRole"
            label="الدور الجديد"
            value={roleModal.newRole}
            onChange={(e) => setRoleModal((prev) => ({ ...prev, newRole: e.target.value }))}
            options={[
              { value: 'customer', label: 'عميل' },
              { value: 'staff', label: 'موظف متجر' },
              { value: 'admin', label: 'مدير عام' },
            ]}
          />
          <div className={styles.roleHelpBox}>
            <p className={styles.roleHelpText}>
              {ROLE_DESCRIPTIONS[roleModal.newRole] || ''}
            </p>
          </div>
        </form>
      </Modal>

      {/* U1: Status Toggle Confirm Dialog with normalized props */}
      <ConfirmDialog
        isOpen={statusConfirm.open}
        onClose={() => setStatusConfirm({ open: false, user: null, loading: false })}
        onConfirm={handleConfirmStatusChange}
        title={statusConfirm.user?.is_active ? 'تأكيد تعطيل الحساب' : 'تأكيد تنشيط الحساب'}
        description={
          statusConfirm.user?.is_active
            ? `هل أنت متأكد من تعطيل حساب "${statusConfirm.user?.name}"؟ لن يتمكن من تسجيل الدخول إلى المتجر أو لوحة التحكم.`
            : `هل أنت متأكد من إعادة تنشيط حساب "${statusConfirm.user?.name}"؟`
        }
        confirmLabel={statusConfirm.user?.is_active ? 'تعطيل الحساب' : 'تنشيط الحساب'}
        cancelLabel="إلغاء"
        variant={statusConfirm.user?.is_active ? 'danger' : 'primary'}
        loading={statusConfirm.loading}
      />
    </Page>
  );
}
