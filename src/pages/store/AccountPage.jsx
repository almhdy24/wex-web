import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Package, Bell, Shield, MessageCircle, ChevronLeft, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import styles from './AccountPage.module.css';

export default function AccountPage() {
  const { user, updateUserProfile, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [priceLockModalOpen, setPriceLockModalOpen] = useState(false);

  // Refresh profile from API on mount
  useEffect(() => {
    let isMounted = true;
    authApi
      .getMe()
      .then((res) => {
        if (res?.data && isMounted) {
          updateUserProfile(res.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [updateUserProfile]);

  const handleLogout = async () => {
    await logout();
    success('تم تسجيل الخروج بنجاح');
    navigate('/');
  };

  // Generate initials from name or fallback
  const getInitials = (nameStr) => {
    if (!nameStr) return 'W';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}.${parts[1][0]}`;
    }
    return parts[0].slice(0, 2);
  };

  const displayName = user?.name || 'مستخدم جديد';
  const displayPhone = user?.phone || user?.email || 'لا يوجد هاتف مسجل';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className={styles.container}>
      {/* 1. User Profile Card (Mockup Parity: 50px initials bubble) */}
      <div className={styles.profileCard}>
        <div className={styles.avatarBubble}>
          {getInitials(user?.name)}
        </div>

        <div className={styles.profileInfo}>
          <h2 className={styles.userName}>{displayName}</h2>
          <div className={styles.userPhone} dir="ltr">
            {displayPhone}
          </div>
          <div className={styles.userLocation}>أم درمان، السودان</div>
        </div>
      </div>

      {/* 2. Navigation Menu List Card */}
      <div className={styles.menuCard}>
        <Link to="/orders" className={styles.menuItem}>
          <div className={styles.menuItemLeft}>
            <Package size={18} className={styles.menuIcon} />
            <span className={styles.menuItemTitle}>سجل الطلبات</span>
          </div>
          <div className={styles.menuItemRight}>
            <span className={styles.menuMetaText}>متابعة الحالات</span>
            <ChevronLeft size={16} />
          </div>
        </Link>

        <Link to="/notifications" className={styles.menuItem}>
          <div className={styles.menuItemLeft}>
            <Bell size={18} className={styles.menuIcon} />
            <span className={styles.menuItemTitle}>الإشعارات والتنبيهات</span>
          </div>
          <div className={styles.menuItemRight}>
            <span className={styles.menuMetaText}>التحديثات</span>
            <ChevronLeft size={16} />
          </div>
        </Link>

        <div
          className={styles.menuItem}
          onClick={() => setPriceLockModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') setPriceLockModalOpen(true); }}
        >
          <div className={styles.menuItemLeft}>
            <Shield size={18} className={styles.menuIcon} />
            <span className={styles.menuItemTitle}>طريقة تثبيت السعر</span>
          </div>
          <div className={styles.menuItemRight}>
            <span className={styles.menuCyanText}>تفاصيل</span>
            <ChevronLeft size={16} />
          </div>
        </div>

        {isAdmin && (
          <Link to="/admin" className={styles.menuItem}>
            <div className={styles.menuItemLeft}>
              <Store size={18} className={styles.menuIcon} />
              <span className={styles.menuItemTitle}>لوحة إدارة المتجر</span>
            </div>
            <div className={styles.menuItemRight}>
              <span className={styles.menuAdminBadge}>المدير</span>
              <ChevronLeft size={16} />
            </div>
          </Link>
        )}
      </div>

      {/* 3. WhatsApp Direct Support Button (Mockup Parity) */}
      <div className={styles.supportSection}>
        <a
          href="https://wa.me/249912345678?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%85%D8%AA%D8%AC%D8%B1%20%D9%88%D9%8A%D9%83%D8%B3"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappBtn}
        >
          <MessageCircle size={18} />
          <span>تواصل معانا واتساب</span>
        </a>
      </div>

      {/* 4. Shop Info Card */}
      <div className={styles.shopCard}>
        <div className={styles.shopName}>Wex Technology (ويكس تكنولوجي)</div>
        <div className={styles.shopDetail}>
          الموقع: مول الواحة، الشهداء، أم درمان
        </div>
        <div className={styles.shopDetail}>
          ساعات العمل: السبت - الخميس من 10 ص إلى 10 م | الجمعة من 4 م
        </div>
        <div className={styles.shopDetail}>
          الهاتف: 0912345678
        </div>
      </div>

      {/* 5. Logout Button */}
      <div className={styles.logoutWrapper}>
        <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* Price Lock Explanation Dialog */}
      {priceLockModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setPriceLockModalOpen(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>نظام تثبيت السعر في ويكس</h3>
            <p className={styles.modalBody}>
              تتغير أسعار الأجهزة حسب تقلبات السوق. عند تقديم الطلب عبر التطبيق، يقوم نظام ويكس بتثبيت السعر لمدة 4 ساعات كاملة لتتمكن من التحويل وتأكيد الطلب دون أي تأثر بتغير الأسعار اللاحق.
            </p>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setPriceLockModalOpen(false)}
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
