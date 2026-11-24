import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { toAsciiDigits } from '../../utils/formatters';
import styles from './Stepper.module.css';

/**
 * Stepper
 * Touch-friendly numeric stepper:
 * - sm is 40px visual with 44px tap target; md is 48px.
 * - Forced dir="ltr" so minus is on left and plus on right (number-line order).
 * - role="group" on wrapper; role="spinbutton" semantics with aria-valuenow.
 * - Long-press repeat (400ms delay, 80ms interval).
 * - Tap to type numeric input, clamped to min/max on blur.
 */
export default function Stepper({
  value = 0,
  onChange,
  min = 0,
  max = 9999,
  disabled = false,
  size = 'md',
  ariaLabel = 'تعديل الكمية',
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));

  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  const stopRepeat = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleStep = (delta) => {
    if (disabled) return;
    const next = Math.min(max, Math.max(min, value + delta));
    onChange?.(next);
  };

  const startRepeat = (delta) => {
    if (disabled) return;
    handleStep(delta);
    stopRepeat();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        handleStep(delta);
      }, 80);
    }, 400);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const ascii = toAsciiDigits(inputValue);
    const parsed = parseInt(ascii, 10);
    if (isNaN(parsed)) {
      setInputValue(String(value));
    } else {
      const clamped = Math.min(max, Math.max(min, parsed));
      setInputValue(String(clamped));
      onChange?.(clamped);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleStep(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleStep(-1);
    }
  };

  return (
    <div
      className={`${styles.stepper} ${styles[size]}`}
      dir="ltr"
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={styles.stepBtn}
        disabled={disabled || value <= min}
        aria-label="إنقاص"
        onClick={() => handleStep(-1)}
        onPointerDown={() => startRepeat(-1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      >
        <Minus size={size === 'sm' ? 14 : 16} strokeWidth={2.5} />
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={styles.valueInput}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
        />
      ) : (
        <span
          className={styles.value}
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={ariaLabel}
          onClick={() => {
            if (!disabled) setIsEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsEditing(true);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              handleStep(1);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              handleStep(-1);
            }
          }}
        >
          {value}
        </span>
      )}

      <button
        type="button"
        className={styles.stepBtn}
        disabled={disabled || value >= max}
        aria-label="زيادة"
        onClick={() => handleStep(1)}
        onPointerDown={() => startRepeat(1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      >
        <Plus size={size === 'sm' ? 14 : 16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
