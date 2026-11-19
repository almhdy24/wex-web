import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import styles from './CopyField.module.css';

export default function CopyField({
  label,
  value,
  copyValue,
  toastMessage = 'تم النسخ',
  className = '',
}) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const textToCopy = String(copyValue !== undefined ? copyValue : value || '');

  const handleCopy = async () => {
    if (!textToCopy) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast(toastMessage, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('تعذر النسخ تلقائياً', 'error');
    }
  };

  return (
    <div className={`${styles.field} ${className}`}>
      <div className={styles.content}>
        {label && <span className={styles.label}>{label}</span>}
        <span className={styles.value} title={textToCopy}>
          {value}
        </span>
      </div>

      <button
        type="button"
        className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
        onClick={handleCopy}
        aria-label={`نسخ ${label || ''}: ${textToCopy}`}
      >
        {copied ? (
          <>
            <Check size={14} strokeWidth={2} aria-hidden="true" />
            <span>تم</span>
          </>
        ) : (
          <>
            <Copy size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>نسخ</span>
          </>
        )}
      </button>
    </div>
  );
}
