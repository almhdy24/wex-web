import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  User,
  Package,
  Heart,
  Bell,
  MapPin,
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  Check,
  AlertCircle,
  MessageCircle,
  Sparkles,
  Store,
  Sliders,
  ExternalLink,
  Smartphone,
  Mail,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { useMotionMode } from '../../motion';
import { authApi } from '../../api/auth';
import { ordersApi } from '../../api/orders';
import Page from '../../components/common/Page';
import { notificationsApi } from '../../api/notifications';
import { productsApi } from '../../api/products';
import { normalizeSudanPhone, isValidSudanPhone } from '../../utils/formatters';
import { ar } from '../../content/ar';
import styles from './AccountPage.module.css';

const DRAFT_STORAGE_KEY = 'wex_checkout_draft';
const SAVED_PHONE_KEY = 'wex_saved_contact_phone';

export default function AccountPage() {
  const { user, updateUserProfile, logout, logoutAll } = useAuth();
  const { favorites } = useFavorites();
  const { success, error: toastError, info } = useToast();
  const { motionMode, setMotionMode } = useMotionMode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active navigation tab: 'overview' | 'profile' | 'addresses' | 'security' | 'settings'
  const urlTab = searchParams.get('tab');
  const validTabs = ['overview', 'profile', 'addresses', 'security', 'settings'];
  const [activeTab, setActiveTab] = useState(() => {
    return urlTab && validTabs.includes(urlTab) ? urlTab : 'overview';
  });

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams(tabKey === 'overview' ? {} : { tab: tabKey });
  };

  // Stats
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Edit Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Delivery Address Form State
  const [shippingZones, setShippingZones] = useState([]);
  const [preferredZoneId, setPreferredZoneId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [savedContactPhone, setSavedContactPhone] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Modals
  const [priceLockModalOpen, setPriceLockModalOpen] = useState(false);
  const [logoutAllModalOpen, setLogoutAllModalOpen] = useState(false);
  const [unlinkGoogleModalOpen, setUnlinkGoogleModalOpen] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false);

  // Sync profile form when user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Load fresh profile & stats on mount
  useEffect(() => {
    let isMounted = true;

    // Refresh profile from backend
    authApi
      .getMe()
      .then((res) => {
        if (res?.data && isMounted) {
          updateUserProfile(res.data);
        }
      })
      .catch(() => {});

    // Load orders count
    ordersApi
      .getOrders()
      .then((res) => {
        if (isMounted) {
          const list = res?.data || [];
          setTotalOrderCount(list.length);
          const active = list.filter((o) => o.status === 'pending_payment' || o.status === 'confirmed');
          setActiveOrderCount(active.length);
        }
      })
      .catch(() => {});

    // Load unread notifications count
    notificationsApi
      .getUnreadCount()
      .then((res) => {
        if (isMounted && res?.data) {
          setUnreadNotifCount(res.data.unread_count || 0);
        }
      })
      .catch(() => {});

    // Load shipping zones
    productsApi
      .getShippingZones()
      .then((res) => {
        if (isMounted && Array.isArray(res?.data)) {
          setShippingZones(res.data);
        }
      })
      .catch(() => {});

    // Load draft delivery address if saved
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.deliveryAddress) setDeliveryAddress(parsed.deliveryAddress);
        if (parsed.selectedZoneId) setPreferredZoneId(parsed.selectedZoneId);
      }
      const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
      if (savedPhone) setSavedContactPhone(savedPhone);
    } catch {
      // storage unavailable
    }

    return () => {
      isMounted = false;
    };
  }, [updateUserProfile]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = {};

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      errs.name = 'الاسم يجب أن يتكون من حرفين على الأقل';
    }

    let cleanPhone = null;
    if (phone.trim()) {
      cleanPhone = normalizeSudanPhone(phone.trim());
      if (!isValidSudanPhone(cleanPhone)) {
        errs.phone = 'يرجى إدخال رقم هاتف سوداني صحيح (09 أو 01 يتبعه 8 أرقام)';
      }
    }

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    setProfileErrors({});
    setSavingProfile(true);

    try {
      const res = await authApi.updateMe({
        name: cleanName,
        phone: cleanPhone,
      });

      if (res?.data) {
        updateUserProfile(res.data);
      }
      success(ar.account.savedSuccess);
    } catch (err) {
      toastError(err.message || 'تعذر حفظ البيانات الشخصية');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Save Delivery Address Preferences
  const handleSaveAddress = (e) => {
    e.preventDefault();
    setSavingAddress(true);

    try {
      const draftObj = {
        deliveryAddress: deliveryAddress.trim(),
        selectedZoneId: preferredZoneId,
        contactPhone: savedContactPhone.trim() || user?.phone || '',
        orderType: 'delivery',
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftObj));
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftObj));

      if (savedContactPhone.trim()) {
        localStorage.setItem(SAVED_PHONE_KEY, savedContactPhone.trim());
      }

      success(ar.account.addressSavedSuccess);
    } catch {
      toastError('تعذر حفظ بيانات العنوان');
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle Unlink Google
  const handleConfirmUnlinkGoogle = async () => {
    setUnlinkingGoogle(true);
    try {
      const res = await authApi.unlinkGoogle();
      if (res?.data) {
        updateUserProfile(res.data);
      }
      success('تم إلغاء ربط حساب Google بنجاح');
      setUnlinkGoogleModalOpen(false);
    } catch (err) {
      toastError(err.message || 'تعذر إلغاء ربط حساب Google');
    } finally {
      setUnlinkingGoogle(false);
    }
  };

  // Handle Connect Google (Trigger Google One-Tap or explanation)
  const handleConnectGoogle = async () => {
    setLinkingGoogle(true);
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            info('يمكنك تسجيل الدخول مباشرة بحساب Google لربطه بحسابك تلقائياً');
          }
        });
      } else {
        info('يمكنك تسجيل الدخول بنفس بريد Google لربط الحسابين تلقائياً');
      }
    } catch {
      info('تسجيل الدخول عبر Google متاح من صفحة تسجيل الدخول');
    } finally {
      setLinkingGoogle(false);
    }
  };

  // Handle Logout Current Device
  const handleLogoutCurrent = async () => {
    await logout();
    success('تم تسجيل الخروج بنجاح');
    navigate('/');
  };

  // Handle Logout All Devices
  const handleLogoutAllDevices = async () => {
    await logoutAll();
    setLogoutAllModalOpen(false);
    success(ar.account.logoutAllSuccess);
    navigate('/');
  };

  // Motion Mode Toggle
  const handleToggleMotion = () => {
    const nextMode = motionMode === 'full' ? 'lite' : motionMode === 'lite' ? 'reduced' : 'full';
    setMotionMode(nextMode);
    const label = nextMode === 'full' ? 'كاملة' : nextMode === 'lite' ? 'مخففة' : 'موقوفة';
    info(`تم تغيير وضع الحركة إلى: ${label}`);
  };

  // Generate initials for avatar
  const getInitials = (nameStr) => {
    if (!nameStr) return 'W';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}.${parts[1][0]}`;
    }
    return parts[0].slice(0, 2);
  };

  const displayName = user?.name || ar.account.userFallback;
  const displayEmail = user?.email || 'لا يوجد بريد مسجل';
  const displayPhone = user?.phone || ar.account.phoneNotSet;
  const isGoogleLinked = Boolean(user?.google_linked || user?.avatar_url?.includes('googleusercontent'));
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <Page className={styles.container}>
      {/* 1. Account Hero Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroProfile}>
          <div className={styles.avatarBubble}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className={styles.avatarImg}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <span className={styles.avatarText}>{getInitials(displayName)}</span>
          </div>

          <div className={styles.heroDetails}>
            <div className={styles.nameBadgeRow}>
              <h1 className={styles.userName}>{displayName}</h1>
              <span className={styles.roleBadge}>
                {isAdmin ? 'مدير المتجر' : 'عميل المتجر'}
              </span>
            </div>
            <div className={styles.userEmail} dir="ltr">{displayEmail}</div>
            <div className={styles.userPhone} dir="ltr">{displayPhone}</div>
          </div>
        </div>

        {/* Quick Stats Bar (Orders, Wishlist, Notifications) */}
        <div className={styles.statsBar}>
          <Link to="/orders" className={styles.statItem}>
            <span className={styles.statNumber}>{totalOrderCount}</span>
            <span className={styles.statLabel}>طلباتي</span>
            {activeOrderCount > 0 && (
              <span className={styles.statBadge}>{activeOrderCount} نشط</span>
            )}
          </Link>

          <Link to="/favorites" className={styles.statItem}>
            <span className={styles.statNumber}>{favorites.length}</span>
            <span className={styles.statLabel}>المفضلة</span>
          </Link>

          <Link to="/notifications" className={styles.statItem}>
            <span className={styles.statNumber}>{unreadNotifCount}</span>
            <span className={styles.statLabel}>التنبيهات</span>
            {unreadNotifCount > 0 && (
              <span className={styles.statBadgeAlert}>{unreadNotifCount} جديد</span>
            )}
          </Link>
        </div>
      </div>

      {/* 2. Horizontal Navigation Tabs (Mobile-friendly segmented bar) */}
      <nav className={styles.navTabs} aria-label="أقسام الحساب">
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <Sliders size={16} />
          <span>{ar.account.tabOverview}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          <User size={16} />
          <span>{ar.account.tabProfile}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'addresses' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('addresses')}
        >
          <MapPin size={16} />
          <span>{ar.account.tabAddresses}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'security' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('security')}
        >
          <Shield size={16} />
          <span>{ar.account.tabSecurity}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          <Sparkles size={16} />
          <span>{ar.account.tabSettings}</span>
        </button>
      </nav>

      {/* =========================================================================
         TAB 1: OVERVIEW (نظرة عامة)
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className={styles.tabContent}>
          {/* Quick Shortcuts Grid */}
          <div className={styles.quickGrid}>
            <Link to="/orders" className={styles.quickCard}>
              <div className={styles.quickCardIcon} style={{ background: 'var(--wex-ice)', color: 'var(--wex-royal)' }}>
                <Package size={22} />
              </div>
              <div className={styles.quickCardContent}>
                <h3 className={styles.quickCardTitle}>متابعة وسجل الطلبات</h3>
                <p className={styles.quickCardDesc}>
                  {totalOrderCount > 0
                    ? `لديك ${totalOrderCount} طلب مسجل بالنظام`
                    : 'استعرض تفاصيل الشراء وإيصالات السداد وحالة التوصيل'}
                </p>
              </div>
              <ChevronLeft size={18} className={styles.chevronIcon} />
            </Link>

            <Link to="/favorites" className={styles.quickCard}>
              <div className={styles.quickCardIcon} style={{ background: 'var(--wex-ice)', color: 'var(--wex-royal)' }}>
                <Heart size={22} fill="var(--wex-royal)" />
              </div>
              <div className={styles.quickCardContent}>
                <h3 className={styles.quickCardTitle}>قائمة الأجهزة المفضلة</h3>
                <p className={styles.quickCardDesc}>
                  {favorites.length > 0
                    ? `لديك ${favorites.length} أجهزة محفوظة للشراء`
                    : 'احفظ الأجهزة لمتابعة الأسعار ونقلها للسلة بضغطة واحدة'}
                </p>
              </div>
              <ChevronLeft size={18} className={styles.chevronIcon} />
            </Link>

            <Link to="/notifications" className={styles.quickCard}>
              <div className={styles.quickCardIcon} style={{ background: 'var(--wex-ice)', color: 'var(--wex-royal)' }}>
                <Bell size={22} />
              </div>
              <div className={styles.quickCardContent}>
                <h3 className={styles.quickCardTitle}>مركز التنبيهات والتحديثات</h3>
                <p className={styles.quickCardDesc}>
                  {unreadNotifCount > 0
                    ? `لديك ${unreadNotifCount} إشعار جديد بحاجة لمراجعتك`
                    : 'تحديثات تثبيت الأسعار، واعتماد التحويل، وتأكيد التوصيل'}
                </p>
              </div>
              <ChevronLeft size={18} className={styles.chevronIcon} />
            </Link>
          </div>

          {/* Store Location & Operational Info */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Store size={20} className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>متجر ويكس تكنولوجي — فرع أم درمان</h3>
            </div>
            <div className={styles.shopInfoList}>
              <div className={styles.shopInfoRow}>
                <MapPin size={16} className={styles.shopInfoIcon} />
                <span>أم درمان، الشهداء — مول الواحة، الطابق الأرضي</span>
              </div>
              <div className={styles.shopInfoRow}>
                <Smartphone size={16} className={styles.shopInfoIcon} />
                <span dir="ltr">+249 91 234 5678</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 2: PERSONAL INFORMATION (المعلومات الشخصية)
         ========================================================================= */}
      {activeTab === 'profile' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <User size={20} className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>{ar.account.personalInfoTitle}</h2>
                <p className={styles.sectionDesc}>{ar.account.personalInfoDesc}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label htmlFor="account-name" className={styles.fieldLabel}>
                  {ar.account.nameLabel} <span className={styles.requiredMark}>*</span>
                </label>
                <input
                  id="account-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${styles.input} ${profileErrors.name ? styles.inputError : ''}`}
                  placeholder="محمد أحمد"
                  required
                />
                {profileErrors.name && (
                  <span className={styles.errorText}>{profileErrors.name}</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="account-phone" className={styles.fieldLabel}>
                  {ar.account.phoneLabel}
                </label>
                <input
                  id="account-phone"
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${styles.input} ${profileErrors.phone ? styles.inputError : ''}`}
                  placeholder="0912345678"
                />
                <span className={styles.fieldHint}>
                  يستخدم لتأكيد حجز السعر وتنسيق تسليم الأجهزة في أم درمان والخرطوم.
                </span>
                {profileErrors.phone && (
                  <span className={styles.errorText}>{profileErrors.phone}</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  {ar.account.emailLabel}
                </label>
                <div className={styles.readOnlyField}>
                  <Mail size={16} className={styles.readOnlyIcon} />
                  <span dir="ltr">{displayEmail}</span>
                  <span className={styles.verifiedBadge}>
                    <Check size={12} />
                    <span>{ar.account.emailVerifiedBadge}</span>
                  </span>
                </div>
                <span className={styles.fieldHint}>
                  البريد الإلكتروني هو معرّف الحساب الأساسي ولا يمكن تعديله بدون التحقق.
                </span>
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className={styles.saveBtn}
                >
                  {savingProfile ? ar.account.savingChanges : ar.account.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 3: ADDRESSES & CHECKOUT PREFERENCES (عناوين التوصيل)
         ========================================================================= */}
      {activeTab === 'addresses' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <MapPin size={20} className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>{ar.account.addressTitle}</h2>
                <p className={styles.sectionDesc}>{ar.account.addressDesc}</p>
              </div>
            </div>

            <form onSubmit={handleSaveAddress} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label htmlFor="address-zone" className={styles.fieldLabel}>
                  {ar.account.shippingZoneLabel}
                </label>
                <select
                  id="address-zone"
                  value={preferredZoneId}
                  onChange={(e) => setPreferredZoneId(e.target.value)}
                  className={styles.select}
                >
                  <option value="">اختر المنطقة أو الحي المفضل</option>
                  {shippingZones.map((z) => (
                    <option key={z.id} value={String(z.id)}>
                      {z.name} ({z.fee_sdg === 0 ? 'توصيل مجاني' : `${z.fee_sdg} ج.س`})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="address-details" className={styles.fieldLabel}>
                  {ar.account.addressLabel}
                </label>
                <textarea
                  id="address-details"
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className={styles.textarea}
                  placeholder={ar.account.addressPlaceholder}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="address-contact-phone" className={styles.fieldLabel}>
                  رقم الهاتف المخصص لاستلام الشحنة
                </label>
                <input
                  id="address-contact-phone"
                  type="tel"
                  dir="ltr"
                  value={savedContactPhone}
                  onChange={(e) => setSavedContactPhone(e.target.value)}
                  className={styles.input}
                  placeholder="0912345678"
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className={styles.saveBtn}
                >
                  {savingAddress ? 'جاري الحفظ...' : ar.account.saveAddressAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 4: CONNECTED ACCOUNTS & SECURITY (الحسابات والأمان)
         ========================================================================= */}
      {activeTab === 'security' && (
        <div className={styles.tabContent}>
          {/* Linked Authentication Providers Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <ShieldCheck size={20} className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>{ar.account.securityTitle}</h2>
                <p className={styles.sectionDesc}>{ar.account.securityDesc}</p>
              </div>
            </div>

            <div className={styles.providersList}>
              {/* 1. Email OTP Provider (Always Verified Primary) */}
              <div className={styles.providerItem}>
                <div className={styles.providerInfo}>
                  <div className={styles.providerIconCircle} style={{ background: '#EAF3FF', color: '#0B3FBF' }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className={styles.providerName}>{ar.account.providerEmailOtp}</h4>
                    <p className={styles.providerDesc}>{ar.account.providerEmailDesc}</p>
                    <span className={styles.providerMeta} dir="ltr">{displayEmail}</span>
                  </div>
                </div>
                <span className={styles.providerStatusBadgeActive}>
                  <Check size={14} />
                  <span>مفعّل ونشط</span>
                </span>
              </div>

              {/* 2. Google OAuth Provider (Accurate Backend State) */}
              <div className={styles.providerItem}>
                <div className={styles.providerInfo}>
                  <div className={styles.providerIconCircle} style={{ background: '#EAF3FF', color: '#061A55' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className={styles.providerName}>{ar.account.providerGoogle}</h4>
                    <p className={styles.providerDesc}>
                      {isGoogleLinked
                        ? ar.account.providerGoogleConnected
                        : ar.account.providerGoogleDisconnected}
                    </p>
                  </div>
                </div>

                {isGoogleLinked ? (
                  <button
                    type="button"
                    className={styles.unlinkBtn}
                    onClick={() => setUnlinkGoogleModalOpen(true)}
                  >
                    {ar.account.unlinkGoogle}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.linkBtn}
                    disabled={linkingGoogle}
                    onClick={handleConnectGoogle}
                  >
                    {linkingGoogle ? 'جاري الربط...' : ar.account.connectGoogle}
                  </button>
                )}
              </div>

              {/* 3. Facebook Provider (Accurate Report: Not Supported on Backend) */}
              <div className={`${styles.providerItem} ${styles.providerItemDisabled}`}>
                <div className={styles.providerInfo}>
                  <div className={styles.providerIconCircle} style={{ background: '#EAF3FF', color: '#4B5B85' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={styles.providerName}>{ar.account.providerFacebook}</h4>
                    <p className={styles.providerDesc}>{ar.account.providerFacebookNotice}</p>
                  </div>
                </div>

                <span className={styles.providerStatusBadgeUnsupported}>
                  <Lock size={13} />
                  <span>{ar.account.providerFacebookUnsupported}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Active Sessions & Global Logout Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Lock size={20} className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>{ar.account.sessionsTitle}</h2>
                <p className={styles.sectionDesc}>{ar.account.sessionsDesc}</p>
              </div>
            </div>

            <div className={styles.sessionActions}>
              <button
                type="button"
                className={styles.logoutCurrentBtn}
                onClick={handleLogoutCurrent}
              >
                <LogOut size={16} />
                <span>{ar.account.logoutCurrent}</span>
              </button>

              <button
                type="button"
                className={styles.logoutAllBtn}
                onClick={() => setLogoutAllModalOpen(true)}
              >
                <ShieldAlert size={16} />
                <span>{ar.account.logoutAll}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 5: SETTINGS & PREFERENCES (الإعدادات)
         ========================================================================= */}
      {activeTab === 'settings' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div className={styles.menuList}>
              {/* Motion Mode Toggle */}
              <div
                className={styles.menuRow}
                onClick={handleToggleMotion}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleToggleMotion(); }}
              >
                <div className={styles.menuRowLeft}>
                  <Sparkles size={18} className={styles.menuRowIcon} />
                  <div>
                    <h4 className={styles.menuRowTitle}>{ar.account.menuMotionMode}</h4>
                    <p className={styles.menuRowSub}>التحكم في تأثيرات الرسوم وسرعة التنقل</p>
                  </div>
                </div>
                <div className={styles.menuRowRight}>
                  <span className={styles.valueBadge}>
                    {motionMode === 'full' ? 'كاملة' : motionMode === 'lite' ? 'مخففة' : 'موقوفة'}
                  </span>
                  <ChevronLeft size={16} />
                </div>
              </div>

              {/* Price Lock Guide Modal */}
              <div
                className={styles.menuRow}
                onClick={() => setPriceLockModalOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setPriceLockModalOpen(true); }}
              >
                <div className={styles.menuRowLeft}>
                  <Shield size={18} className={styles.menuRowIcon} />
                  <div>
                    <h4 className={styles.menuRowTitle}>{ar.account.menuPriceLockGuide}</h4>
                    <p className={styles.menuRowSub}>تثبيت السعر لمدة 4 ساعات لثبات القيمة عند التحويل</p>
                  </div>
                </div>
                <div className={styles.menuRowRight}>
                  <span className={styles.cyanBadge}>تفاصيل</span>
                  <ChevronLeft size={16} />
                </div>
              </div>

              {/* Direct WhatsApp Support */}
              <a
                href="https://wa.me/249912345678?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%85%D8%AA%D8%AC%D8%B1%20%D9%88%D9%8A%D9%83%D8%B3"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.menuRow}
              >
                <div className={styles.menuRowLeft}>
                  <MessageCircle size={18} className={styles.menuRowIcon} style={{ color: '#12805C' }} />
                  <div>
                    <h4 className={styles.menuRowTitle}>{ar.account.menuSupport}</h4>
                    <p className={styles.menuRowSub}>فريق خدمة عملاء ويكس متاح طوال ساعات العمل</p>
                  </div>
                </div>
                <div className={styles.menuRowRight}>
                  <ExternalLink size={16} />
                </div>
              </a>

              {/* Admin Panel Link */}
              {isAdmin && (
                <Link to="/admin" className={styles.menuRow}>
                  <div className={styles.menuRowLeft}>
                    <Store size={18} className={styles.menuRowIcon} />
                    <div>
                      <h4 className={styles.menuRowTitle}>{ar.account.menuAdmin}</h4>
                      <p className={styles.menuRowSub}>إدارة المنتجات، الطلبات، والأسعار</p>
                    </div>
                  </div>
                  <div className={styles.menuRowRight}>
                    <span className={styles.adminBadge}>المدير</span>
                    <ChevronLeft size={16} />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         CONFIRMATION MODALS
         ========================================================================= */}

      {/* Logout All Devices Modal */}
      {logoutAllModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setLogoutAllModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalDangerIcon}>
                <ShieldAlert size={22} />
              </div>
              <h3 className={styles.modalTitle}>{ar.account.logoutAllConfirmTitle}</h3>
            </div>
            <p className={styles.modalBody}>{ar.account.logoutAllConfirmBody}</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setLogoutAllModalOpen(false)}
              >
                {ar.account.cancel}
              </button>
              <button
                type="button"
                className={styles.confirmDangerBtn}
                onClick={handleLogoutAllDevices}
              >
                {ar.account.logoutAll}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Google Modal */}
      {unlinkGoogleModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setUnlinkGoogleModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalDangerIcon}>
                <AlertCircle size={22} />
              </div>
              <h3 className={styles.modalTitle}>{ar.account.unlinkConfirmTitle}</h3>
            </div>
            <p className={styles.modalBody}>{ar.account.unlinkConfirmBody}</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setUnlinkGoogleModalOpen(false)}
              >
                {ar.account.cancel}
              </button>
              <button
                type="button"
                disabled={unlinkingGoogle}
                className={styles.confirmDangerBtn}
                onClick={handleConfirmUnlinkGoogle}
              >
                {unlinkingGoogle ? 'جاري الإلغاء...' : ar.account.unlinkGoogle}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Lock Modal */}
      {priceLockModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setPriceLockModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{ar.account.priceLockModalTitle}</h3>
            <p className={styles.modalBody}>{ar.account.priceLockModalBody}</p>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setPriceLockModalOpen(false)}
            >
              {ar.account.understood}
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}
