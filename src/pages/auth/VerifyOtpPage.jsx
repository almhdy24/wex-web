import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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

  const inputRefs = useRef([]);
  const { loginWithSession } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const searchReturnTo = new URLSearchParams(location.search).get('returnTo');
  const from = location.state?.from?.pathname || location.state?.from || searchReturnTo || '/';

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

  const handleVerify = useCallback(
    async (codeToVerify, currentName = name) => {
      if (!emailParam) {
        setErrorMsg('البريد الإلكتروني مفقود. ارجع لصفحة الدخول واكتبه تاني.');
        return;
      }
      if (codeToVerify.length !== 6) {
        setErrorMsg('اكتب رمز التحقق المكون من 6 أرقام');
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
        navigate(from, { replace: true });
      } catch (err) {
        if (err.errors?.name) {
          setNeedsName(true);
          setErrorMsg('حساب جديد. اكتب اسمك عشان نكمل تسجيلك.');
        } else {
          const msg =
            err.errors?.code || err.message || 'رمز التحقق غير صحيح أو انتهى وقته. حاول تاني.';
          setErrorMsg(msg);
        }
        toastError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [emailParam, name, loginWithSession, success, navigate, from, toastError]
  );

  const handleDigitChange = (index, value) => {
    // Keep only Western digits 0-9
    const clean = value.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (clean.length > 1) {
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

    newDigits[index] = clean;
    setDigits(newDigits);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
      setErrorMsg(err.message || 'تعذر إعادة إرسال الرمز');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify(digits.join(''));
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
          <h1 className={styles.cardTitle}>تأكيد رمز الدخول</h1>
          <p className={styles.cardSubtitle}>
            أدخل الرمز المكون من 6 أرقام المرسل إلى: <br />
            <strong dir="ltr">{emailParam}</strong>
          </p>
        </div>

        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {needsName && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="userName">الاسم الكامل:</label>
              <input
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

          {/* 6-box OTP digits */}
          <div className={styles.otpBoxGroup}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={styles.otpInput}
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                aria-label={`الرقم ${idx + 1}`}
              />
            ))}
          </div>

          <div className={styles.timerRow}>
            {countdown > 0 ? (
              <span>
                إعادة الإرسال بعد: <span className={styles.timerCount}>{countdown} ثانية</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className={styles.resendBtn}
              >
                <RefreshCw size={12} />
                <span>إعادة إرسال الرمز</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6}
            className={styles.submitBtn}
          >
            <CheckCircle2 size={16} />
            <span>{loading ? 'جاري التحقق...' : 'تأكيد ودخول'}</span>
          </button>
        </form>

        <Link to="/login" className={styles.backLink}>
          <ArrowRight size={14} />
          <span>تغيير البريد الإلكتروني</span>
        </Link>
      </div>
    </div>
  );
}
