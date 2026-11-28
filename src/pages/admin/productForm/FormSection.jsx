import React from 'react';
import PropTypes from 'prop-types';
import { Check, ChevronDown } from 'lucide-react';
import w from './ProductWizard.module.css';

/** Collapsible stepper section: number / check / red dot, title and a one-line summary. */
export default function FormSection({ id, index, title, summary, open, onToggle, done, invalid, children }) {
  return (
    <section id={`sec-${id}`} className={`${w.section} ${invalid ? w.sectionError : ''}`}>
      <button type="button" className={w.sectionHead} onClick={() => onToggle(id)} aria-expanded={open}>
        <span className={`${w.badge} ${done ? w.badgeDone : ''} ${invalid ? w.badgeError : ''}`}>
          {done && !invalid ? <Check size={16} /> : index}
        </span>
        <span className={w.headText}>
          <span className={w.headTitle}>{title}</span>
          {!open && summary ? <span className={w.headSummary}>{summary}</span> : null}
        </span>
        <ChevronDown size={18} className={`${w.chev} ${open ? w.chevOpen : ''}`} aria-hidden="true" />
      </button>
      {open ? <div className={w.sectionBody}>{children}</div> : null}
    </section>
  );
}

FormSection.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  summary: PropTypes.string,
  open: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  done: PropTypes.bool,
  invalid: PropTypes.bool,
  children: PropTypes.node,
};
