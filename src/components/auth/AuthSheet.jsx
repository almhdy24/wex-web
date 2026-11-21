import { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import Sheet from '../common/Sheet';
import Button from '../common/Button';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './AuthSheet.module.css';

export default function AuthSheet({ isOpen, onClose, onSuccess }) {
  const { loginWithSession } = useAuth();
  const { success, error: toastError } = useToast();

  const [mode, setMode] = useState('menu'); // 'menu' | 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [userName, setUserName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');

  const inputRefs = useRef([]);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Countdown timer
  useEffect(() => {
    if (mode !== 'otp' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, countdown]);

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setMode('menu');
      setDigits(['', '', '', '', '', '']);
      setErrorMessage('');
      setLoading(false);
    }
  }, [isOpen]);

  // Autofocus first digit in OTP mode
  useEffect(() => {
    if (mode === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [mode]);

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      if (window.google?.accounts?.id && googleClientId) {
        window.google.accounts.id.prompt(async (notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setMode('email');
            setLoading(false);
          }
        });
      } else {
        // Fallback to email OTP if Google is not configured/loaded
        setMode('email');
        setLoading(false);
      }
    } catch {
      setMode('email');
      setLoading(false);
    }
  };

  // Request Email OTP
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await authApi.requestEmailOtp(cleanEmail);
      setMode('otp');
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
    } catch (err) {
      setErrorMessage(err.message || 'تعذر إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await authApi.requestEmailOtp(email.trim().toLowerCase());
      setCountdown(60);
      success('تم إرسال رمز جديد');
    } catch (err) {
      setErrorMessage(err.message || 'تعذر إعادة إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Code
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setErrorMessage('أدخل رمز التحقق المكون من 6 أرقام');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await authApi.verifyEmailOtp({
        email: email.trim().toLowerCase(),
        otp: code,
        name: userName.trim() || undefined,
      });

      if (res?.data?.user && res?.data?.access_token) {
        loginWithSession(res.data.user, res.data.access_token);
        success('تم تسجيل الدخول بنجاح');
        onClose();
        if (onSuccess) onSuccess(res.data.user);
      } else if (res?.data?.requires_name) {
        setNeedsName(true);
      } else {
        setErrorMessage('رمز التحقق غير صحيح أو منتهي الصلاحية');
      }
    } catch (err) {
      if (err.data?.requires_name) {
        setNeedsName(true);
      } else {
        setErrorMessage(err.message || 'رمز التحقق غير صحيح أو منتهي');
      }
    } finally {
      setLoading(false);
    }
  };

  // Digit input handling
  const handleDigitChange = (index, value) => {
    const char = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const targetIdx = Math.min(pasted.length, 5);
    if (inputRefs.current[targetIdx]) {
      inputRefs.current[targetIdx].focus();
    }

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="سجّل الدخول لإتمام الطلب">
      <div className={styles.container}>
        <p className={styles.subtitle}>
          لنربط الطلب بحسابك ونرسل لك التحديثات.
        </p>

        {errorMessage && (
          <div className={styles.errorAlert} role="alert">
            {errorMessage}
          </div>
        )}

        {mode === 'menu' && (
          <div className={styles.menuButtons}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={styles.googleBtn}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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
            </button>

            <Button
              variant="secondary"
              onClick={() => setMode('email')}
              className={styles.emailMenuBtn}
            >
              <Mail size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>المتابعة بالبريد الإلكتروني</span>
            </Button>
          </div>
        )}

        {mode === 'email' && (
          <form onSubmit={handleRequestOtp} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="auth-email-input" className={styles.label}>
                البريد الإلكتروني
              </label>
              <input
                id="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={styles.input}
                autoFocus
                required
                dir="ltr"
              />
            </div>

            <div className={styles.formActions}>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || !email.trim()}
                className={styles.submitBtn}
              >
                {loading ? <Loader2 size={18} className={styles.spinner} /> : 'إرسال رمز التحقق'}
              </Button>
              <button
                type="button"
                onClick={() => setMode('menu')}
                className={styles.backLink}
              >
                رجوع
              </button>
            </div>
          </form>
        )}

        {mode === 'otp' && (
          <div className={styles.otpContainer}>
            <p className={styles.otpSentText}>
              أرسلنا رمز التحقق المكون من 6 أرقام إلى <b dir="ltr">{email}</b>
            </p>

            {needsName && (
              <div className={styles.fieldGroup}>
                <label htmlFor="auth-name-input" className={styles.label}>
                  الاسم الكامل
                </label>
                <input
                  id="auth-name-input"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className={styles.input}
                  required
                />
              </div>
            )}

            <div className={styles.digitRow} dir="ltr" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={styles.digitBox}
                  aria-label={`الرقم ${idx + 1}`}
                />
              ))}
            </div>

            <div className={styles.otpActions}>
              <Button
                variant="primary"
                onClick={() => handleVerifyOtp()}
                disabled={loading || digits.join('').length !== 6 || (needsName && !userName.trim())}
                className={styles.submitBtn}
              >
                {loading ? <Loader2 size={18} className={styles.spinner} /> : 'تأكيد الرمز'}
              </Button>

              <div className={styles.resendRow}>
                {countdown > 0 ? (
                  <span className={styles.countdownText}>
                    إعادة الإرسال بعد {countdown} ثانية
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className={styles.resendBtn}
                    disabled={loading}
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    <span>إعادة إرسال الرمز</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMode('email')}
                  className={styles.backLink}
                >
                  تغيير البريد
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
