import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
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

  const from = location.state?.from?.pathname || '/';

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
      // Handle paste or multiple chars
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((ch, idx) => {
        newDigits[idx] = ch;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      if (pasted.length === 6) {
        handleVerify(pasted.join(''));
      }
      return;
    }

    newDigits[index] = clean;
    setDigits(newDigits);

    // Auto-advance
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits filled
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

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = ['', '', '', '', '', ''];
    pasteData.split('').forEach((ch, idx) => {
      newDigits[idx] = ch;
    });
    setDigits(newDigits);

    const nextFocus = Math.min(pasteData.length, 5);
    inputRefs.current[nextFocus]?.focus();

    if (pasteData.length === 6) {
      handleVerify(pasteData);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify(digits.join(''));
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
      setErrorMsg(err.message || 'الاتصال ضعيف. حاول تاني.');
      toastError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        {/* Slanted ribbon brand graphic */}
        <div className={styles.ribbonDecoration} aria-hidden="true" />

        <header className={styles.cardHeader}>
          <img
            src="/logo.svg"
            alt="Wex Technology"
            className={styles.brandLogo}
          />
          <h1 className={styles.cardTitle}>تأكيد رمز الدخول</h1>
          <p className={styles.cardSubtitle}>
            أدخل الرمز المكون من 6 أرقام المرسل إلى:
            <br />
            <strong style={{ color: 'var(--color-navy)', direction: 'ltr', display: 'inline-block' }}>
              {emailParam}
            </strong>
          </p>
        </header>

        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 6-box numeric code input */}
          <div className={styles.otpBoxGroup} onPaste={handlePaste} aria-label="رمز التحقق">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={styles.otpInput}
                autoFocus={idx === 0}
                aria-label={`الرقم ${idx + 1}`}
              />
            ))}
          </div>

          {/* New user name prompt if required */}
          {needsName && (
            <Input
              label="الاسم الكريم (مطلوب للحساب الجديد)"
              placeholder="اكتب اسمك الثلاثي"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={loading}
            disabled={loading || digits.join('').length < 6}
          >
            <CheckCircle2 size={18} />
            <span>تأكيد وتسجيل الدخول</span>
          </Button>

          {/* Resend timer */}
          <div className={styles.timerRow}>
            <span>لم يصلك الرمز؟</span>
            {countdown > 0 ? (
              <span>
                إعادة الإرسال بعد <span className={styles.timerCount}>{countdown}</span> ثانية
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className={styles.resendBtn}
              >
                <RefreshCw size={12} style={{ display: 'inline', marginInlineEnd: 4 }} />
                <span>إعادة إرسال الرمز</span>
              </button>
            )}
          </div>
        </form>

        <Link to="/auth/login" className={styles.backLink}>
          <ArrowRight size={14} />
          <span>تغيير البريد الإلكتروني</span>
        </Link>
      </div>
    </div>
  );
}
