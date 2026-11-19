import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import styles from './AccountPage.module.css';

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
    authApi
      .getMe()
      .then((res) => {
        if (res?.data && isMounted) {
          updateUserProfile(res.data);
          setName(res.data.name || '');
          setPhone(res.data.phone || '');
          setEmailNotif(res.data.email_notifications ?? true);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
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
      success('تم تحديث البيانات');
    } catch (err) {
      if (err.errors) {
        setProfileErrors(err.errors);
      }
      toastError(err.message || 'الاتصال ضعيف. حاول تاني.');
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
      setEmailNotif(!val);
      toastError(err.message || 'الاتصال ضعيف. حاول تاني.');
    } finally {
      setUpdatingNotif(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    success('تم تسجيل الخروج');
    navigate('/');
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    success('تم إنهاء جميع الجلسات');
    navigate('/auth/login');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteMe();
      await logout();
      success('تم حذف الحساب');
      navigate('/');
    } catch (err) {
      toastError(err.message || 'فشل حذف الحساب. حاول تاني.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const roleLabelMap = {
    admin: { label: 'مدير عام', variant: 'warning' },
    staff: { label: 'موظف', variant: 'info' },
    customer: { label: 'عميل', variant: 'neutral' },
  };

  const currentRole = roleLabelMap[user?.role] || { label: 'عميل', variant: 'neutral' };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>حسابي</h1>
        <p className={styles.subtitle}>
          إدارة بياناتك الشخصية، رقم الهاتف السوداني، وإعدادات الإشعارات
        </p>
      </header>

      <div className={styles.grid}>
        {/* Profile Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>البيانات الشخصية</h2>
            <Tag variant={currentRole.variant}>{currentRole.label}</Tag>
          </div>
          <div className={styles.cardBody}>
            <form onSubmit={handleProfileSubmit} className={styles.form}>
              <div className={styles.readOnlyField}>
                <label className={styles.fieldLabel} htmlFor="account_email">
                  البريد الإلكتروني
                </label>
                <input
                  id="account_email"
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className={styles.readOnlyInput}
                  dir="ltr"
                />
                <span className={styles.fieldHint}>
                  معرف الحساب الأساسي ولا يمكن تغييره
                </span>
              </div>

              <Input
                label="الاسم الكريم"
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
                placeholder="0912345678"
                dir="ltr"
                hint="يستخدم للتواصل وتأكيد التسليم (09 أو 01)"
                error={profileErrors.phone}
              />

              <Button
                type="submit"
                variant="primary"
                loading={updatingProfile}
                disabled={updatingProfile}
              >
                <Check size={16} />
                <span>حفظ التعديلات</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Preferences & Security Column */}
        <div className={styles.actionsColumn}>
          {/* Notifications Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>إشعارات البريد</h2>
            </div>
            <div className={styles.cardBody}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={handleToggleNotifications}
                  disabled={updatingNotif}
                  className={styles.checkbox}
                />
                <div>
                  <div className={styles.checkboxTitle}>
                    استلام تحديثات الطلبات عبر البريد
                  </div>
                  <div className={styles.checkboxDesc}>
                    تنبيهات بتثبيت السعر، اعتماد إشعار التحويل، وجاهزية الجهاز للاستلام.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Sessions & Security */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>الجلسات والأمان</h2>
            </div>
            <div className={styles.cardBody}>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut size={16} />
                <span>تسجيل الخروج من هذا الجهاز</span>
              </Button>

              <Button variant="outline" onClick={handleLogoutAll}>
                <LogOut size={16} />
                <span>تسجيل الخروج من كافة الأجهزة</span>
              </Button>

              <div className={styles.dangerSection}>
                <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
                  <ShieldAlert size={14} />
                  <span>حذف الحساب</span>
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
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleDeleteAccount}
            >
              نعم، احذف حسابي
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-slate-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
          هل أنت متأكد من رغبتك في حذف حسابك؟ سيتم إيقاف تفعيل الحساب ولن تتمكن من الوصول إلى سجل طلباتك السابقة.
        </p>
      </Modal>
    </div>
  );
}
