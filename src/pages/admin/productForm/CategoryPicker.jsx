import React from 'react';
import PropTypes from 'prop-types';
import { Laptop, Smartphone, Headphones } from 'lucide-react';
import w from './ProductWizard.module.css';

const ICONS = { laptop: Laptop, phone: Smartphone, accessory: Headphones };
const CARDS = [
  { type: 'laptop', label: 'حاسوب' },
  { type: 'phone', label: 'هاتف' },
  { type: 'accessory', label: 'ملحق' },
];

/** Step 0 — "ماذا تريد أن تضيف؟": big category cards; accessories then ask for the sub-type. */
export default function CategoryPicker({ type, subcategory, subtypes, onType, onSubtype, onContinue }) {
  return (
    <div className={w.sections}>
      <h2 className={w.pickerTitle}>ماذا تريد أن تضيف؟</h2>
      <div className={w.pickerGrid} role="radiogroup" aria-label="نوع المنتج">
        {CARDS.map((c) => {
          const Icon = ICONS[c.type];
          const active = type === c.type;
          return (
            <button
              key={c.type}
              type="button"
              role="radio"
              aria-checked={active}
              className={`${w.pickCard} ${active ? w.pickCardActive : ''}`}
              onClick={() => onType(c.type)}
            >
              <span className={w.pickIcon}><Icon size={26} /></span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {type === 'accessory' ? (
        <div className={w.field}>
          <span className={w.fieldLabel}>نوع الملحق</span>
          <div className={w.subRow} role="radiogroup" aria-label="نوع الملحق">
            {(subtypes || []).map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={subcategory === s.value}
                className={`${w.chip} ${subcategory === s.value ? w.chipOn : ''}`}
                onClick={() => onSubtype(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={w.nextRow}>
        <button
          type="button"
          className={`${w.chip} ${w.chipOn}`}
          disabled={!type || (type === 'accessory' && !subcategory)}
          onClick={onContinue}
        >
          متابعة
        </button>
      </div>
    </div>
  );
}

CategoryPicker.propTypes = {
  type: PropTypes.string,
  subcategory: PropTypes.string,
  subtypes: PropTypes.array,
  onType: PropTypes.func.isRequired,
  onSubtype: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
};
