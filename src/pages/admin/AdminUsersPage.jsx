import { useState, useEffect } from 'react';
import { Eye, Edit, Check } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatSdg } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminCommon.module.css';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  // User Details Modal
  const [detailsModal, setDetailsModal] = useState({ open: false, user: null, loading: false });

  // Role Change Modal
  const [roleModal, setRoleModal] = useState({
    open: false,
    user: null,
    newRole: 'customer',
    submitting: false,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        per_page: 20,
      };
      if (search.trim()) params.q = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== '') params.is_active = activeFilter;

      const res = await adminApi.getUsers(params);
      setUsers(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenDetails = async (id) => {
    try {
      setDetailsModal({ open: true, user: null, loading: true });
      const res = await adminApi.getUser(id);
      setDetailsModal({ open: true, user: res.data, loading: false });
    } catch (err) {
      toastError(err.message || 'فشل في تحميل بيانات المستخدم');
      setDetailsModal({ open: false, user: null, loading: false });
    }
  };

  const handleOpenRoleModal = (u) => {
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
    } finally {
      setRoleModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const roleMap = {
    admin: { label: 'مدير عام', variant: 'warning' },
    staff: { label: 'موظف متجر', variant: 'info' },
    customer: { label: 'عميل', variant: 'neutral' },
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>إدارة المستخدمين والصلاحيات</h1>
          <p className={styles.subtitle}>
            عرض العملاء والموظفين وإدارة أدوار الحسابات وتاريخ الطلبات
          </p>
        </div>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Search Toolbar */}
      <div className={styles.toolbarCard}>
        <form onSubmit={handleSearchSubmit} className={styles.toolbarForm}>
          <Input
            placeholder="ابحث بالاسم، البريد، أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'جميع الأدوار' },
              { value: 'admin', label: 'مدير عام' },
              { value: 'staff', label: 'موظف متجر' },
              { value: 'customer', label: 'عميل' },
            ]}
          />

          <Select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'جميع الحالات' },
              { value: '1', label: 'حساب نشط' },
              { value: '0', label: 'حساب معطل' },
            ]}
          />

          <Button type="submit" variant="primary" size="md">
            بحث
          </Button>
        </form>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          title="لم يتم العثور على مستخدمين"
          description="لا يوجد مستخدمون يطابقون معايير البحث الحالية."
        />
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الهاتف</th>
                  <th>الدور</th>
                  <th>الحالة</th>
                  <th>تاريخ التسجيل</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const role = roleMap[u.role] || { label: u.role, variant: 'neutral' };
                  const isSelf = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name || 'عميل'}</strong>
                        {isSelf && (
                          <span style={{ fontSize: '10px', color: 'var(--color-royal-blue)', marginInlineStart: 6 }}>
                            (حسابك الحالي)
                          </span>
                        )}
                      </td>
                      <td dir="ltr">{u.email}</td>
                      <td dir="ltr">{u.phone || '—'}</td>
                      <td>
                        <Tag variant={role.variant}>{role.label}</Tag>
                      </td>
                      <td>
                        {u.is_active ? (
                          <Tag variant="success">نشط</Tag>
                        ) : (
                          <Tag variant="danger">معطل</Tag>
                        )}
                      </td>
                      <td className={styles.dateText}>{formatDate(u.created_at)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="عرض تفاصيل المستخدم"
                            onClick={() => handleOpenDetails(u.id)}
                          >
                            <Eye size={14} />
                          </Button>

                          {!isSelf && (
                            <Button
                              variant="outline"
                              size="sm"
                              title="تعديل الدور"
                              onClick={() => handleOpenRoleModal(u)}
                            >
                              <Edit size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta.total_pages > 1 && (
            <nav className={styles.pagination} aria-label="تنقل الصفحات">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                السابق
              </Button>
              <span className={styles.pageCount}>
                صفحة {meta.page} من {meta.total_pages} (الإجمالي: {meta.total} مستخدم)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.total_pages}
                onClick={() => setPage((prev) => Math.min(meta.total_pages, prev + 1))}
              >
                التالي
              </Button>
            </nav>
          )}
        </div>
      )}

      {/* Role Change Modal */}
      <Modal
        isOpen={roleModal.open}
        onClose={() => setRoleModal((prev) => ({ ...prev, open: false }))}
        title="تعديل دور المستخدم"
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
              <Check size={16} />
              <span>حفظ الدور</span>
            </Button>
          </>
        }
      >
        <form onSubmit={handleRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)', margin: 0 }}>
            تعديل صلاحيات المستخدم: <strong>{roleModal.user?.name}</strong> ({roleModal.user?.email})
          </p>

          <Select
            label="الدور الوظيفي"
            value={roleModal.newRole}
            onChange={(e) => setRoleModal((prev) => ({ ...prev, newRole: e.target.value }))}
            options={[
              { value: 'customer', label: 'عميل (شراء وتصفح فقط)' },
              { value: 'staff', label: 'موظف متجر (إدارة الطلبات والمنتجات)' },
              { value: 'admin', label: 'مدير عام (صلاحيات كاملة على النظام)' },
            ]}
          />
        </form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, user: null, loading: false })}
        title="تفاصيل المستخدم"
      >
        {detailsModal.loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ height: 20, backgroundColor: 'var(--color-slate-100)', borderRadius: 4 }} />
            <div style={{ height: 20, backgroundColor: 'var(--color-slate-100)', borderRadius: 4 }} />
          </div>
        ) : detailsModal.user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
            <div>الاسم: <strong>{detailsModal.user.name || 'عميل'}</strong></div>
            <div>البريد: <strong dir="ltr">{detailsModal.user.email}</strong></div>
            <div>الهاتف: <strong dir="ltr">{detailsModal.user.phone || 'غير مسجل'}</strong></div>
            <div>الدور: <Tag variant={roleMap[detailsModal.user.role]?.variant}>{roleMap[detailsModal.user.role]?.label}</Tag></div>
            <div>تاريخ الانضمام: <span>{formatDate(detailsModal.user.created_at)}</span></div>

            {detailsModal.user.orders && detailsModal.user.orders.length > 0 && (
              <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
                <div style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>سجل الطلبات الأخير:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {detailsModal.user.orders.map((o) => (
                    <div
                      key={o.order_number}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-slate-50)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      <span dir="ltr">#{o.order_number}</span>
                      <span style={{ fontWeight: 700 }}>{formatSdg(o.total_sdg)}</span>
                      <span>{formatDate(o.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
