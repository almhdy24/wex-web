import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export default function Select({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
  children,
  ...rest
}) {
  const selectId = id || name;

  const selectClasses = [
    styles.select,
    error ? styles.hasError : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.selectBox}>
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={selectClasses}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <span className={styles.arrow} aria-hidden="true">
          <ChevronDown size={18} strokeWidth={1.75} />
        </span>
      </div>

      {error ? (
        <span className={styles.errorText} role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span className={styles.helperText}>{helperText}</span>
      ) : null}
    </div>
  );
}
