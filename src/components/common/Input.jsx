import React from 'react';
import styles from './Input.module.css';

export default function Input({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  iconStart: IconStart,
  iconEnd: IconEnd,
  className = '',
  dir,
  inputMode,
  autoComplete,
  ...rest
}) {
  const inputId = id || name;

  const inputClasses = [
    styles.input,
    error ? styles.hasError : '',
    IconStart ? styles.hasIconStart : '',
    IconEnd ? styles.hasIconEnd : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputBox}>
        {IconStart && (
          <span className={styles.iconStart}>
            <IconStart size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          dir={dir}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
          className={inputClasses}
          {...rest}
        />

        {IconEnd && (
          <span className={styles.iconEnd}>
            <IconEnd size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
        )}
      </div>

      {error ? (
        <span id={`${inputId}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${inputId}-desc`} className={styles.helperText}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
