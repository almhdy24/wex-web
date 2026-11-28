import React from 'react';
import PropTypes from 'prop-types';
import { Minus, Plus } from 'lucide-react';
import { digitsOnly } from './formLogic';
import w from './ProductWizard.module.css';

/** Renders one schema field: segmented chips / select / number stepper / text / multi. */
export default function SpecField({ field, value, onChange, error, domId }) {
  const { input, label, required, options = [], unit, placeholder } = field;
  const set = (v) => onChange(field.key, v);

  let control = null;
  if (input === 'segmented') {
    control = (
      <div className={w.chips} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={String(value) === o.value}
            className={`${w.chip} ${w.chipLtr} ${String(value) === o.value ? w.chipOn : ''}`}
            onClick={() => set(String(value) === o.value ? '' : o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  } else if (input === 'select') {
    control = (
      <select id={domId} className={w.control} value={value ?? ''} onChange={(e) => set(e.target.value)}>
        <option value="">اختر...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  } else if (input === 'multi') {
    const cur = Array.isArray(value) ? value : [];
    control = (
      <div className={w.chips} role="group" aria-label={label}>
        {options.map((o) => {
          const on = cur.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              className={`${w.chip} ${on ? w.chipOn : ''}`}
              onClick={() => set(on ? cur.filter((x) => x !== o.value) : [...cur, o.value])}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  } else if (input === 'number') {
    const step = field.step || 1;
    const n = value === '' || value === undefined || value === null ? null : Number(value);
    const clamp = (x) => Math.min(field.max ?? Infinity, Math.max(field.min ?? 0, x));
    control = (
      <div className={w.numRow} dir="ltr">
        <button type="button" className={w.chip} aria-label="إنقاص" onClick={() => set(clamp(Number(((n ?? field.min ?? 0) - step).toFixed(2))))}>
          <Minus size={16} />
        </button>
        <input
          id={domId}
          className={w.control}
          style={{ maxWidth: 120, textAlign: 'center' }}
          inputMode="decimal"
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
            const cleaned = step < 1 ? raw.replace(/[^\d.]/g, '') : digitsOnly(raw);
            set(cleaned === '' ? '' : cleaned);
          }}
        />
        <button type="button" className={w.chip} aria-label="زيادة" onClick={() => set(clamp(Number(((n ?? (field.min ?? 0) - step) + step).toFixed(2))))}>
          <Plus size={16} />
        </button>
        {unit ? <span className={w.unit}>{unit}</span> : null}
      </div>
    );
  } else {
    control = (
      <input
        id={domId}
        className={w.control}
        value={value ?? ''}
        maxLength={field.max || 120}
        placeholder={placeholder}
        list={field.datalist}
        onChange={(e) => set(e.target.value)}
        dir="auto"
      />
    );
  }

  return (
    <div id={`field-${domId}`} className={`${w.field} ${error ? w.invalid : ''}`} data-field={domId}>
      <span className={w.fieldLabel}>
        {label}
        {required ? <span className={w.req} aria-hidden="true">*</span> : null}
      </span>
      {control}
      {error ? <span className={w.fieldError} role="alert">{error}</span> : null}
    </div>
  );
}

SpecField.propTypes = {
  field: PropTypes.object.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  domId: PropTypes.string.isRequired,
};
