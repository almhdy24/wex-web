import React from 'react';

export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const selectId = name || `select-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className={`form-label ${required ? 'form-label-required' : ''}`}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`form-select ${error ? 'is-invalid' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error" role="alert">{error}</span>}
      {!error && hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}
