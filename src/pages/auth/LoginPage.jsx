import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './Auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { loginWithSession } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const searchReturnTo = new URLSearchParams(location.search).get('returnTo');
  const from = location.state?.from?.pathname || location.state?.from || searchReturnTo || '/';

  // Initialize Google Sign-in if configured
  useEffect(() => {
    if (!googleClientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        });
        const container = document.getElementById('google-btn-container');
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            locale: 'ar',
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [googleClientId]);

  const handleGoogleResponse = async (response) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.googleSignIn(response.credential);
      const { user, access_token, refresh_token } = res.data;
      loginWithSession(user, access_token, refresh_token);
      success(`أهلاً بك يا ${user.name}`);
      const customerTarget = (from && !from.startsWith('/login') && !from.startsWith('/auth')) ? from : '/';
      const target = (user.role === 'admin' || user.role === 'staff')
        ? (from !== '/' && from.startsWith('/admin') ? from : '/admin')
        : customerTarget;
      navigate(target, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول عبر حساب جوجل');
      toastError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.requestEmailOtp(email.trim());
      success(res.message || 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      navigate(`/auth/verify?email=${encodeURIComponent(email.trim())}&returnTo=${encodeURIComponent(from)}`, {
        state: { from },
      });
    } catch (err) {
      const msg = err.errors?.email || err.message || 'الاتصال ضعيف. حاول تاني.';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgRibbon1} />
      <div className={styles.bgRibbon2} />

      <div className={styles.authCard}>
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
          <h1 className={styles.cardTitle}>تسجيل الدخول</h1>
          <p className={styles.cardSubtitle}>
            سجل دخولك لمتابعة طلباتك، تثبيت الأسعار، والحصول على خصم التطبيق
          </p>
        </div>

        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

        {googleClientId && (
          <div className={styles.googleWrapper}>
            <div id="google-btn-container" className={styles.googleBtnContainer} />
            {googleLoading && (
              <div className={styles.googleStatus}>جاري التحقق من حساب جوجل...</div>
            )}
            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>أو عبر البريد الإلكتروني</span>
              <span className={styles.dividerLine} />
            </div>
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="authEmail">البريد الإلكتروني:</label>
            <input
              id="authEmail"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoFocus
              className={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            <Mail size={16} />
            <span>{loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}</span>
            <ArrowLeft size={16} />
          </button>
        </form>

        <div className={styles.footerNote}>
          بالتسجيل، أنت توافق على شروط متجر ويكس تكنولوجي وسياسة الخصوصية.
        </div>
      </div>
    </div>
  );
}
