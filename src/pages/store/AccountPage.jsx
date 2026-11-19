import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';

export default function AccountPage() {
  const { user, updateUserProfile, logout, logoutAll } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Email Notifications Preference
  const [emailNotif, setEmailNotif] = useState(user?.email_notifications ?? true);
  const [updatingNotif, setUpdatingNotif] = useState(false);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Refresh profile from API on mount
  useEffect(() => {
    let isMounted = true;
    authApi.getMe().then((res) => {
      if (res?.data && isMounted) {
        updateUserProfile(res.data);
        setName(res.data.name || '');
        setPhone(res.data.phone || '');
        setEmailNotif(res.data.email_notifications ?? true);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [updateUserProfile]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileErrors({});

    try {
      const res = await authApi.updateMe({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      updateUserProfile(res.data);
      success('تم تحديث الملف الشخصي بنجاح');
    } catch (err) {
      if (err.errors) {
        setProfileErrors(err.errors);
      }
      toastError(err.message || 'فشل تحديث البيانات');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleToggleNotifications = async (e) => {
    const val = e.target.checked;
    setEmailNotif(val);
    setUpdatingNotif(true);

    try {
      await authApi.updatePreferences(val);
      updateUserProfile({ email_notifications: val });
      success(val ? 'تم تفعيل إشعارات البريد' : 'تم إيقاف إشعارات البريد');
    } catch (err) {
      setEmailNotif(!val); // revert
      toastError(err.message || 'فشل حفظ التفضيلات');
    } finally {
      setUpdatingNotif(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    success('تم تسجيل الخروج بنجاح');
    navigate('/');
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    success('تم إنهاء جميع الجلسات المسجلة بحسابك بنجاح');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteMe();
      await logout();
      success('تم حذف حسابك بنجاح');
      navigate('/');
    } catch (err) {
      toastError(err.message || 'فشل حذف الحساب');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: 840 }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>حسابي الشخصي</h1>
        <p style={{ color: 'var(--color-slate-500)', margin: 0 }}>
          إدارة بياناتك الشخصية، رقم الهاتف السوداني للتوصيل، وإعدادات الإشعارات
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Profile Card */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>البيانات الشخصية</h3>
            <Badge variant={user?.role === 'admin' ? 'warning' : user?.role === 'staff' ? 'info' : 'neutral'}>
              {user?.role === 'admin' ? 'مدير عام' : user?.role === 'staff' ? 'موظف متجر' : 'عميل'}
            </Badge>
          </div>
          <div className="card-body">
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="form-input"
                  style={{ backgroundColor: 'var(--color-slate-100)', color: 'var(--color-slate-600)' }}
                  dir="ltr"
                />
                <span className="form-hint">البريد الإلكتروني مسجل كمعرف أساسي ولا يمكن تعديله</span>
              </div>

              <Input
                label="الاسم الكامل"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                error={profileErrors.name}
              />

              <Input
                label="رقم الهاتف (سوداني)"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678 أو 01..."
                dir="ltr"
                hint="يستخدم للتواصل وتأكيد التوصيل (09 أو 01)"
                error={profileErrors.phone}
              />

              <Button
                type="submit"
                variant="primary"
                loading={updatingProfile}
                style={{ marginTop: 'var(--space-2)' }}
              >
                حفظ التعديلات
              </Button>
            </form>
          </div>
        </div>

        {/* Preferences & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Notifications Card */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>إشعارات الطلبات</h3>
            </div>
            <div className="card-body">
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={handleToggleNotifications}
                  disabled={updatingNotif}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-royal-blue)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                    استلام تحديثات الطلبات عبر البريد
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                    إشعارات بتثبيت السعر، قبول إشعار التحويل البنكي، وجاهزية الجهاز للاستلام.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Sessions & Security Card */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>الجلسات والأمان</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Button variant="outline" onClick={handleLogout}>
                تسجيل الخروج من هذا الجهاز
              </Button>
              <Button variant="outline" onClick={handleLogoutAll}>
                تسجيل الخروج من كافة الأجهزة الأخرى
              </Button>
              <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-slate-200)', marginTop: 'var(--space-2)' }}>
                <Button variant="danger-outline" onClick={() => setDeleteModalOpen(true)}>
                  حذف الحساب نهائياً
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="تأكيد حذف الحساب"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteAccount}>
              نعم، احذف حسابي
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-slate-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
          هل أنت متأكد من رغبتك في حذف حسابك؟ سيتم إلغاء تفعيل حسابك ولن تتمكن من الوصول إلى سجل طلباتك السابقة عبر هذا البريد الإلكتروني.
        </p>
      </Modal>
    </div>
  );
}
