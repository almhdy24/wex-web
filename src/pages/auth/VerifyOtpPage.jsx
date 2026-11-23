import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { safeReturnTo } from '../../utils/url';
import Page from '../../components/common/Page';
import styles from './Auth.module.css';

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const inputRefs = useRef([]);
  const nameInputRef = useRef(null);
  const { loginWithSession } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // A13: Open-redirect protection
  const searchReturnTo = searchParams.get('returnTo');
  const from = safeReturnTo(
    location.state?.from?.pathname || location.state?.from || searchReturnTo
  );

  // A14: Redirect to /login immediately if email is missing
  useEffect(() => {
    if (!emailParam.trim()) {
      navigate('/login', { replace: true });
    }
  }, [emailParam, navigate]);

  // 60-second countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Autofocus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // A11: Move focus to name field when it appears
  useEffect(() => {
    if (needsName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [needsName]);

  const handleVerify = useCallback(
    async (codeToVerify, currentName = name) => {
      if (!emailParam) {
        setErrorMsg('البريد الإلكتروني مفقود. يرجى العودة لصفحة تسجيل الدخول.');
        return;
      }
      if (codeToVerify.length !== 6) {
        setErrorMsg('يرجى إدخال رمز التحقق المكون من 6 أرقام');
        return;
      }

      setLoading(true);
      setErrorMsg('');

      try {
        const res = await authApi.verifyEmailOtp({
          email: emailParam,
          code: codeToVerify,
          name: currentName.trim() || undefined,
        });

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
        if (err.errors?.name) {
          // A10 & A12: Ask for name with MSA message; no toast error on normal registration step
          setNeedsName(true);
          setErrorMsg('هذا حساب جديد. اكتب اسمك لإكمال التسجيل.');
        } else {
          // A3: Clear boxes, focus first input, trigger shake
          const msg =
            err.errors?.code || err.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته. حاول مرة أخرى.';
          setErrorMsg(msg);
          setDigits(['', '', '', '', '', '']);
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
          inputRefs.current[0]?.focus();

          // A10: Network failure toast only
          if (err.isNetworkError || !err.response) {
            toastError('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [emailParam, name, loginWithSession, success, navigate, from, toastError]
  );

  // A2: Robust paste handler
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanDigits = pastedText.replace(/[^0-9]/g, '').slice(0, 6);
    if (!cleanDigits) return;

    const newDigits = cleanDigits.padEnd(6, '').split('').slice(0, 6);
    setDigits(newDigits);

    const focusIdx = Math.min(cleanDigits.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (cleanDigits.length === 6) {
      handleVerify(cleanDigits);
    }
  };

  // A2: Non-corrupting digit change
  const handleDigitChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (clean.length > 2) {
      // Treat multi-character input as paste
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((ch, idx) => {
        newDigits[idx] = ch;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();

      if (pasted.length === 6) {
        handleVerify(pasted.join(''));
      }
      return;
    }

    // Single character edit: take the last typed digit
    const char = clean.slice(-1);
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerify(fullCode);
    }
  };

  // A2: Keyboard navigation (LTR order) and backspace handling
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
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
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setErrorMsg(err.message || 'تعذر إعادة إرسال الرمز. حاول مرة أخرى.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify(digits.join(''));
  };

  return (
    <Page className={styles.container}>
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
          <h1 className={styles.cardTitle}>تأكيد رمز الدخول</h1>
          <p className={styles.cardSubtitle}>
            أدخل الرمز المكون من 6 أرقام المرسل إلى: <br />
            <strong dir="ltr">{emailParam}</strong>
          </p>
        </div>

        {/* A15: Accessible Error Alert */}
        {errorMsg && (
          <div className={styles.errorAlert} role="alert">
            <div className={styles.errorAlertInner}>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {needsName && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="userName">
                الاسم الكامل:
              </label>
              <input
                ref={nameInputRef}
                id="userName"
                type="text"
                placeholder="أحمد محمد"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={styles.input}
              />
            </div>
          )}

          {/* A1 & A2 & A3: 6-box OTP digits */}
          <div
            className={`${styles.otpBoxGroup} ${isShaking ? styles.shakeAnimation : ''}`}
            dir="ltr"
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={digit}
                onFocus={(e) => e.target.select()}
                onPaste={handlePaste}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={styles.otpInput}
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                aria-label={`الرقم ${idx + 1}`}
              />
            ))}
          </div>

          {/* A18: Centered resend timer */}
          <div className={styles.timerRow}>
            {countdown > 0 ? (
              <span aria-live="polite">
                إعادة الإرسال بعد:{' '}
                <span className={styles.timerCount}>{countdown} ثانية</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className={styles.resendBtn}
              >
                <RefreshCw size={14} />
                <span>إعادة إرسال الرمز</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6}
            className={styles.submitBtn}
          >
            <CheckCircle2 size={18} />
            <span>{loading ? 'جاري التحقق...' : 'تأكيد ودخول'}</span>
          </button>
        </form>

        {/* A15: Min 44px hit target back link */}
        <Link
          to={from && from !== '/' ? `/login?returnTo=${encodeURIComponent(from)}` : '/login'}
          className={styles.backLink}
        >
          <ArrowRight size={16} />
          <span>تغيير البريد الإلكتروني</span>
        </Link>
      </div>
    </Page>
  );
}
