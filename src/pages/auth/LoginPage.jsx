import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

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
      success(`مرحباً بك مجدداً يا ${user.name}`);
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
      const msg = err.errors?.email || err.message || 'تعذر إرسال رمز التحقق';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)',
        minHeight: '70vh',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: 'var(--space-8) var(--space-6)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-navy)',
              color: 'var(--color-white)',
              fontSize: '1.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-3)',
              border: '2px solid var(--color-royal-blue)',
            }}
          >
            W
          </div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>
            تسجيل الدخول إلى ويكس تكنولوجي
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', margin: 0 }}>
            سجّل دخولك بدون كلمات مرور لمتابعة طلباتك وتثبيت الأسعار
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger-border)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              textAlign: 'center',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Google Sign-in */}
        {googleClientId ? (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <div id="google-btn-container" style={{ minHeight: 44 }} />
            {googleLoading && (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                جاري التحقق من حساب جوجل...
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: 'var(--space-5) 0',
                color: 'var(--color-slate-400)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-slate-200)' }} />
              <span style={{ padding: '0 var(--space-3)' }}>أو عبر البريد الإلكتروني</span>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-slate-200)' }} />
            </div>
          </div>
        ) : null}

        {/* Email OTP Form */}
        <form onSubmit={handleEmailSubmit}>
          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="example@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="ltr"
            hint="سنرسل لك رمز تحقق مكوّن من 6 أرقام بدون الحاجة لكلمة سر"
          />

          <Button
            type="submit"
            variant="primary"
            block
            loading={loading}
            style={{ marginTop: 'var(--space-4)' }}
          >
            إرسال رمز التحقق (OTP)
          </Button>
        </form>

        <div
          style={{
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-slate-100)',
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-slate-500)',
          }}
        >
          بالتسجيل فإنك توافق على سياسة الخصوصية وشروط حجز الأسعار في متجر ويكس تكنولوجي.
        </div>
      </div>
    </div>
  );
}
