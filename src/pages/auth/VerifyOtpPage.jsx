import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');

  const { loginWithSession } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Resend 60s countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!emailParam) {
      setErrorMsg('البريد الإلكتروني مفقود، يرجى إعادة طلب الرمز');
      return;
    }
    if (code.trim().length !== 6) {
      setErrorMsg('يرجى إدخال رمز التحقق المكوّن من 6 أرقام');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.verifyEmailOtp({
        email: emailParam,
        code: code.trim(),
        name: name.trim() || undefined,
      });

      const { user, access_token, refresh_token } = res.data;
      loginWithSession(user, access_token, refresh_token);
      success(`تم تسجيل الدخول بنجاح. أهلاً بك يا ${user.name}`);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.errors?.name) {
        setNeedsName(true);
        setErrorMsg('هذا الحساب جديد، يرجى كتابة اسمك الكريم لإكمال التسجيل');
      } else {
        const msg = err.errors?.code || err.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته';
        setErrorMsg(msg);
      }
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setErrorMsg('');

    try {
      const res = await authApi.requestEmailOtp(emailParam);
      success(res.message || 'تم إرسال رمز تحقق جديد');
      setCountdown(60);
      setCode('');
    } catch (err) {
      setErrorMsg(err.message || 'تعذر إعادة إرسال الرمز حالياً');
      toastError(err.message);
    } finally {
      setResending(false);
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
              backgroundColor: 'var(--color-ice-blue)',
              color: 'var(--color-navy)',
              fontSize: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-3)',
            }}
          >
            ✉️
          </div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>
            تأكيد رمز الدخول (OTP)
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)', margin: 0 }}>
            أرسلنا رمز تحقق مكوّن من 6 أرقام إلى:
          </p>
          <div
            className="en-text"
            style={{
              fontWeight: 600,
              color: 'var(--color-royal-blue)',
              marginTop: 'var(--space-1)',
              direction: 'ltr',
              textAlign: 'center',
            }}
          >
            {emailParam || 'البريد الإلكتروني'}
          </div>
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

        <form onSubmit={handleVerify}>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label form-label-required" style={{ textAlign: 'center' }}>
              أدخل الرمز المكوّن من 6 أرقام
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
              className="form-input font-mono"
              style={{
                fontSize: '1.75rem',
                textAlign: 'center',
                letterSpacing: '0.5em',
                padding: 'var(--space-3)',
                height: 56,
              }}
            />
          </div>

          {needsName && (
            <Input
              label="الاسم الكامل"
              placeholder="مثال: أحمد محمد عثمان"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              hint="مطلوب لفتح حساب العميل الجديد وتسجيل فواتير الشراء باسمك"
            />
          )}

          <Button
            type="submit"
            variant="primary"
            block
            loading={loading}
            disabled={code.length !== 6 || (needsName && !name.trim())}
            style={{ marginTop: 'var(--space-4)' }}
          >
            تأكيد الدخول
          </Button>
        </form>

        <div
          style={{
            marginTop: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-sm)',
          }}
        >
          {countdown > 0 ? (
            <span style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>
              يمكنك طلب رمز جديد بعد {countdown} ثانية
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResend}
              disabled={resending}
              style={{ color: 'var(--color-royal-blue)', fontWeight: 600 }}
            >
              {resending ? 'جاري الإرسال...' : '🔄 إعادة إرسال رمز جديد'}
            </button>
          )}

          <Link
            to="/login"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-slate-500)',
              marginTop: 'var(--space-2)',
            }}
          >
            تغيير البريد الإلكتروني
          </Link>
        </div>
      </div>
    </div>
  );
}
