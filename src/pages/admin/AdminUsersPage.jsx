import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatSdg } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();

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
      setError(err.message || 'فشل في تحميل قائمة المستخدمين');
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
      showToast(err.message || 'فشل في تحميل بيانات المستخدم', 'error');
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
      showToast('تم تحديث دور المستخدم بنجاح', 'success');
      setRoleModal({ open: false, user: null, newRole: 'customer', submitting: false });
      setUsers((prev) =>
        prev.map((u) => (u.id === roleModal.user.id ? { ...u, role: roleModal.newRole } : u))
      );
    } catch (err) {
      showToast(err.message || 'فشل في تحديث الدور', 'error');
      setRoleModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleToggleStatus = async (u) => {
    const nextStatus = !u.is_active;
    const confirmMsg = nextStatus
      ? `هل ترغب في إعادة تفعيل حساب: ${u.name || u.email}؟`
      : `هل أنت متأكد من تعطيل حساب: ${u.name || u.email}؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.updateUserStatus(u.id, nextStatus);
      showToast(nextStatus ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب', 'success');
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, is_active: nextStatus } : item))
      );
    } catch (err) {
      showToast(err.message || 'فشل تغيير حالة الحساب', 'error');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">مدير نظام (Admin)</Badge>;
      case 'staff':
        return <Badge variant="primary">موظف (Staff)</Badge>;
      case 'customer':
      default:
        return <Badge variant="secondary">عميل (Customer)</Badge>;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">إدارة المستخدمين والصلاحيات</h1>
          <p className="admin-page-subtitle">حسابات العملاء، طاقم العمل، والمديرين وإحصائيات مشترياتهم</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card admin-filter-bar mb-4">
        <form onSubmit={handleSearchSubmit} className="admin-filter-form">
          <div className="filter-item search-item">
            <input
              type="text"
              placeholder="ابحث بالاسم، البريد أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="filter-item">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="form-control"
            >
              <option value="">جميع الأدوار</option>
              <option value="customer">عملاء</option>
              <option value="staff">طاقم عمل (Staff)</option>
              <option value="admin">مدير نظام (Admin)</option>
            </select>
          </div>

          <div className="filter-item">
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="form-control"
            >
              <option value="">جميع الحالات</option>
              <option value="1">حساب نشط</option>
              <option value="0">حساب معطل</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            بحث
          </button>
        </form>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="card">
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          title="لم يتم العثور على مستخدمين"
          description="لا يوجد مستخدمون يطابقون معايير البحث الحالية."
        />
      ) : (
        <div className="card p-0 table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>#</th>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الهاتف</th>
                <th>الدور والصلاحية</th>
                <th>حالة الحساب</th>
                <th>تاريخ الانضمام</th>
                <th style={{ width: '160px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = currentAdmin && currentAdmin.id === u.id;
                return (
                  <tr key={u.id}>
                    <td className="text-muted text-center">#{u.id}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-link font-semibold text-navy p-0 border-0 bg-transparent text-start"
                        onClick={() => handleOpenDetails(u.id)}
                      >
                        {u.name || 'مستخدم بدون اسم'}
                      </button>
                      {isSelf && <span className="badge badge-outline text-xs ms-1">أنت</span>}
                    </td>
                    <td dir="ltr" style={{ textAlign: 'right' }}>
                      {u.email}
                    </td>
                    <td dir="ltr" style={{ textAlign: 'right' }}>
                      {u.phone || '—'}
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      {u.is_active ? (
                        <Badge variant="success">نشط</Badge>
                      ) : (
                        <Badge variant="warning">معطل</Badge>
                      )}
                    </td>
                    <td className="text-muted text-sm">{formatDate(u.created_at)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="admin-actions-cell">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenDetails(u.id)}
                          title="عرض تفاصيل المستخدم"
                        >
                          تفاصيل
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          disabled={isSelf}
                          onClick={() => handleOpenRoleModal(u)}
                          title={isSelf ? 'لا يمكنك تغيير صلاحياتك بنفسك' : 'تغيير الدور والصلاحيات'}
                        >
                          الدور
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                          disabled={isSelf}
                          onClick={() => handleToggleStatus(u)}
                          title={isSelf ? 'لا يمكنك تعطيل حسابك' : u.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        >
                          {u.is_active ? 'تعطيل' : 'تفعيل'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="admin-pagination mt-4">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            السابق
          </button>
          <span className="pagination-info">
            صفحة {meta.page} من {meta.total_pages} (الإجمالي: {meta.total} مستخدم)
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= meta.total_pages}
            onClick={() => setPage((prev) => Math.min(meta.total_pages, prev + 1))}
          >
            التالي
          </button>
        </div>
      )}

      {/* User Details Modal */}
      {detailsModal.open && (
        <Modal
          isOpen={detailsModal.open}
          onClose={() => setDetailsModal({ open: false, user: null, loading: false })}
          title="تفاصيل الملف الشخصي للمستخدم"
        >
          {detailsModal.loading ? (
            <div className="p-3">
              <Skeleton height="30px" className="mb-2" />
              <Skeleton height="30px" className="mb-2" />
              <Skeleton height="100px" />
            </div>
          ) : detailsModal.user ? (
            <div className="p-2">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <span className="text-muted text-xs font-semibold">الاسم</span>
                  <p className="font-bold text-navy">{detailsModal.user.name || 'بدون اسم'}</p>
                </div>
                <div>
                  <span className="text-muted text-xs font-semibold">البريد الإلكتروني</span>
                  <p dir="ltr" className="font-semibold text-start">{detailsModal.user.email}</p>
                </div>
                <div>
                  <span className="text-muted text-xs font-semibold">رقم الهاتف</span>
                  <p dir="ltr" className="text-start">{detailsModal.user.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-muted text-xs font-semibold">الصلاحية</span>
                  <div className="mt-1">{getRoleBadge(detailsModal.user.role)}</div>
                </div>
                <div>
                  <span className="text-muted text-xs font-semibold">تاريخ الانضمام</span>
                  <p>{formatDate(detailsModal.user.created_at)}</p>
                </div>
                <div>
                  <span className="text-muted text-xs font-semibold">آخر تسجيل دخول</span>
                  <p>{detailsModal.user.last_login_at ? formatDate(detailsModal.user.last_login_at) : '—'}</p>
                </div>
              </div>

              {/* Purchasing Stats */}
              <div className="card bg-light p-3" style={{ border: '1px solid var(--wex-border)' }}>
                <h3 className="font-bold text-navy mb-2" style={{ fontSize: '15px' }}>
                  إحصائيات المشتريات والطلبات
                </h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <span className="text-muted text-xs">إجمالي الطلبات:</span>
                    <p className="font-bold text-royal" style={{ fontSize: '18px' }}>
                      {detailsModal.user.orders_count || 0} طلب
                    </p>
                  </div>
                  <div>
                    <span className="text-muted text-xs">إجمالي الإنفاق المؤكد:</span>
                    <p className="font-bold text-royal" style={{ fontSize: '18px' }}>
                      {formatSdg(detailsModal.user.total_spent_sdg || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDetailsModal({ open: false, user: null, loading: false })}
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      )}

      {/* Change Role Modal */}
      {roleModal.open && (
        <Modal
          isOpen={roleModal.open}
          onClose={() => setRoleModal({ open: false, user: null, newRole: 'customer', submitting: false })}
          title="تعديل صلاحيات ودور المستخدم"
        >
          <form onSubmit={handleRoleSubmit} className="p-2">
            <p className="mb-3">
              تعديل صلاحيات المستخدم: <strong>{roleModal.user?.name || roleModal.user?.email}</strong>
            </p>

            <div className="form-group mb-4">
              <label className="form-label required">اختر الصلاحية الجديدة</label>
              <select
                value={roleModal.newRole}
                onChange={(e) => setRoleModal({ ...roleModal, newRole: e.target.value })}
                className="form-control"
                required
              >
                <option value="customer">عميل (Customer) — تصفح وشراء الطلبات فقط</option>
                <option value="staff">طاقم عمل (Staff) — إدارة الطلبات ومراجعة إشعارات الدفع</option>
                <option value="admin">مدير نظام (Admin) — تحكم كامل وإعدادات المتجر</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={roleModal.submitting}
                onClick={() => setRoleModal({ open: false, user: null, newRole: 'customer', submitting: false })}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={roleModal.submitting}
              >
                {roleModal.submitting ? 'جاري الحفظ...' : 'تحديث الصلاحية'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
