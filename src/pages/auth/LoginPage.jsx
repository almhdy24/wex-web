import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { safeReturnTo } from '../../utils/url';
import Page from '../../components/common/Page';
import styles from './Auth.module.css';
import { formatHoursAr } from '../../utils/arabicDuration';
import { normalizeShopInfo } from '../../utils/shopSettings';

let oneTapPrompted = false;

export default function LoginPage() {
  // Lock duration from the shop settings (was a hard-coded '4 ساعات').
  const lockHours = normalizeShopInfo(useOutletContext()?.shopInfo).lockHours;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [googleFailed, setGoogleFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { loginWithSession } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const googleResponseRef = useRef(null);
  const location = useLocation();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const searchParams = new URLSearchParams(location.search);
  const searchReturnTo = searchParams.get('returnTo');
  const isIdle = searchParams.get('reason') === 'idle';

  // A13: Safe return URL
  const rawFrom = location.state?.from?.pathname || location.state?.from || searchReturnTo;
  const from = safeReturnTo(rawFrom, '/');
  const isBackToCheckout = typeof from === 'string' && from.startsWith('/checkout');

  // A7: Detect touch device to prevent annoying auto-focus virtual keyboard popup
  const isTouchDevice =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer: coarse)').matches;

  const isValidEmail =
    email.trim().length > 4 && email.includes('@') && email.includes('.');

  // A5 & A6: Initialize Google Sign-in with timeout fallback and conditional One-Tap
  useEffect(() => {
    if (!googleClientId) return;

    let isMounted = true;
    let timer = setTimeout(() => {
      if (isMounted && !googleScriptReady) {
        setGoogleFailed(true);
      }
    }, 6000);

    const setupGoogle = () => {
      if (!window.google?.accounts?.id) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          // Google keeps the callback from initialize(); route it through a ref so it
          // always runs the latest handler (current returnTo/navigate), not the first render's.
          callback: (response) => googleResponseRef.current?.(response),
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const container = document.getElementById('google-btn-container');
        if (container) {
          container.innerHTML = '';
          const containerWidth = container.offsetWidth || 340;
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
            width: Math.min(Math.max(containerWidth, 280), 380),
            locale: 'ar',
          });
        }

        if (isMounted) {
          setGoogleScriptReady(true);
          setGoogleFailed(false);
          clearTimeout(timer);
        }

        // A6: Only prompt One-Tap on non-touch devices and when not recovering from idle logout
        // Once per page load: setGoogleScriptReady re-runs this effect, and a second
        // prompt() while the first is open throws "Only one navigator.credentials.get".
        if (!isTouchDevice && !isIdle && !oneTapPrompted) {
          oneTapPrompted = true;
          window.google.accounts.id.prompt(() => {});
        }
        return true;
      } catch (err) {
        console.warn('Google Sign-In initialization error:', err);
        if (isMounted) {
          setGoogleFailed(true);
        }
        return false;
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogle();
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (isMounted) setupGoogle();
    };
    script.onerror = () => {
      if (isMounted) {
        setGoogleScriptReady(false);
        setGoogleFailed(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [googleClientId, isTouchDevice, isIdle, googleScriptReady]);

  const handleGoogleResponse = async (response) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.googleSignIn(response.credential);
      const { user, access_token, refresh_token } = res.data;
      loginWithSession(user, access_token, refresh_token);
      success(`أهلاً بك يا ${user.name}`);
      const customerTarget =
        from && !from.startsWith('/login') && !from.startsWith('/auth') ? from : '/';
      const target =
        user.role === 'admin' || user.role === 'staff'
          ? from !== '/' && from.startsWith('/admin')
            ? from
            : '/admin'
          : customerTarget;
      navigate(target, { replace: true });
    } catch (err) {
      const message = err.message || 'فشل تسجيل الدخول عبر حساب جوجل';
      setErrorMsg(message);
      toastError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    googleResponseRef.current = handleGoogleResponse;
  });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    // A17: Trim and lowercase email
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.requestEmailOtp(cleanEmail);
      success(res.message || 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      navigate(
        `/auth/verify?email=${encodeURIComponent(cleanEmail)}&returnTo=${encodeURIComponent(from)}`,
        {
          state: { from },
        }
      );
    } catch (err) {
      // Modern standard Arabic message
      const msg =
        err.errors?.email ||
        err.message ||
        'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page className={styles.container}>
      <div className={styles.authCard}>
        {/* Top return navigation link */}
        <div className={styles.backRow}>
          <button
            type="button"
            onClick={() =>
              navigate(
                from && !from.startsWith('/login') && !from.startsWith('/auth') ? from : '/'
              )
            }
            className={styles.backBtn}
            aria-label="الرجوع"
          >
            <ArrowRight size={15} />
            <span>{isBackToCheckout ? 'العودة لإتمام الطلب' : 'العودة للمتجر'}</span>
          </button>
        </div>

        <div className={styles.cardHeader}>
          <div className={styles.logoBox}>
            <img
              src="/assets/logo.png"
              alt="Wex Technology"
              className={styles.brandLogo}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/favicon.svg';
              }}
            />
          </div>
          <h1 className={styles.cardTitle}>تسجيل الدخول إلى ويكس</h1>
          <p className={styles.cardSubtitle}>
            سجل دخولك بدون كلمة مرور للوصول لطلباتك والتمتع بمزايا التطبيق
          </p>

          {/* Value proposition badges */}
          <div className={styles.perksRow}>
            <div className={styles.perkChip}>
              <Sparkles size={13} className={styles.perkIcon} />
              <span>خصم التطبيق المباشر</span>
            </div>
            <div className={styles.perkChip}>
              <ShieldCheck size={13} className={styles.perkIcon} />
              <span>تثبيت السعر لمدة {formatHoursAr(lockHours)}</span>
            </div>
          </div>
        </div>

        {/* Friendly Error Alert */}
        {errorMsg && (
          <div className={styles.errorAlert} role="alert">
            <div className={styles.errorAlertInner}>
              <AlertCircle size={16} className={styles.errorIcon} />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              className={styles.errorCloseBtn}
              onClick={() => setErrorMsg('')}
              aria-label="إغلاق التنبيه"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* S8: Idle Session Expiration Alert */}
        {isIdle && (
          <div className={styles.infoAlert} role="status">
            <div className={styles.infoAlertInner}>
              <AlertCircle size={16} className={styles.infoIcon} />
              <span>انتهت الجلسة بسبب عدم النشاط. سجّل الدخول من جديد.</span>
            </div>
          </div>
        )}

        {/* Google Authentication Section */}
        {googleClientId && !googleFailed && (
          <div className={styles.googleWrapper}>
            <div className={styles.googleContainerInner}>
              <div
                id="google-btn-container"
                className={styles.googleBtnContainer}
                style={{ display: googleScriptReady ? 'flex' : 'none' }}
              />

              {!googleScriptReady && (
                <div className={styles.googlePlaceholderBtn}>
                  <svg
                    className={styles.googleIcon}
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
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
                  <span>المتابعة باستخدام Google</span>
                </div>
              )}
            </div>

            {googleLoading && (
              <div className={styles.googleActiveLoading}>
                <Loader2 size={16} className={styles.spinIcon} />
                <span>جاري التحقق من حساب جوجل وتسجيل الدخول...</span>
              </div>
            )}

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>أو عبر رمز البريد (OTP)</span>
              <span className={styles.dividerLine} />
            </div>
          </div>
        )}

        {/* A5: Google load failure notice */}
        {googleClientId && googleFailed && (
          <div className={styles.googleFallbackNotice}>
            <span>تعذر تحميل تسجيل الدخول بجوجل. استخدم البريد الإلكتروني.</span>
          </div>
        )}

        {/* Email OTP Form */}
        <form onSubmit={handleEmailSubmit} className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="authEmail">
              البريد الإلكتروني
            </label>
            <div className={styles.inputWrapper} dir="ltr">
              <input
                id="authEmail"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني"
                required
                autoFocus={!isTouchDevice}
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                disabled={loading || googleLoading}
                className={`${styles.input} ${isValidEmail ? styles.inputValid : ''}`}
              />
              {/* A4: Single 44px clear button inside input at logical end */}
              {email.length > 0 && !loading && !googleLoading && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setEmail('')}
                  aria-label="مسح البريد"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <p className={styles.inputHelper}>
              سنرسل رمز تحقق مكون من 6 أرقام (بدون كلمة مرور)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading || !email.trim()}
            className={styles.submitBtn}
          >
            {loading ? (
              <>
                <Loader2 size={16} className={styles.spinIcon} />
                <span>جاري إرسال رمز التحقق...</span>
              </>
            ) : (
              <>
                <Mail size={16} />
                <span>إرسال رمز التحقق</span>
                <ArrowLeft size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security Trust Footer */}
        <div className={styles.footerNote}>
          <div className={styles.trustBadge}>
            <ShieldCheck size={14} className={styles.trustIcon} />
            <span>تسجيل الدخول بدون كلمة مرور</span>
          </div>
          <p className={styles.termsText}>
            بالتسجيل، أنت توافق على شروط متجر ويكس تكنولوجي وسياسة الخصوصية.
          </p>
        </div>
      </div>
    </Page>
  );
}
