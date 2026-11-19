import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
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
  const from = location.state?.from?.pathname || '/';

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
      navigate(from, { replace: true });
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
      navigate(`/auth/verify?email=${encodeURIComponent(email.trim())}`, {
        state: { from: location.state?.from },
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
      <div className={styles.authCard}>
        {/* Slanted ribbon brand graphic at top of card */}
        <div className={styles.ribbonDecoration} aria-hidden="true" />

        <header className={styles.cardHeader}>
          <img
            src="/logo.svg"
            alt="Wex Technology"
            className={styles.brandLogo}
          />
          <h1 className={styles.cardTitle}>تسجيل الدخول</h1>
          <p className={styles.cardSubtitle}>
            سجّل دخولك لمتابعة طلباتك وتثبيت الأسعار
          </p>
        </header>

        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

        {/* 1. Google Sign-in First & Largest if configured */}
        {googleClientId && (
          <div className={styles.googleWrapper}>
            <div id="google-btn-container" className={styles.googleBtnContainer} />
            {googleLoading && (
              <div className={styles.googleStatus}>
                جاري التحقق من حساب جوجل...
              </div>
            )}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>أو بالبريد الإلكتروني</span>
              <div className={styles.dividerLine} />
            </div>
          </div>
        )}

        {/* 2. Email OTP Form */}
        <form onSubmit={handleEmailSubmit} className={styles.form}>
          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="ltr"
            icon={<Mail size={16} />}
            hint="بنرسل ليك رمز تحقق من 6 أرقام بدون كلمة سر"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={loading}
            disabled={loading}
          >
            <span>إرسال رمز التحقق</span>
            <ArrowLeft size={16} />
          </Button>
        </form>

        <div className={styles.footerNote}>
          بالتسجيل فإنك توافق على شروط الخدمة وتثبيت الأسعار في متجر ويكس تكنولوجي.
        </div>
      </div>
    </div>
  );
}
