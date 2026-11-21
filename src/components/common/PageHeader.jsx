import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import styles from './PageHeader.module.css';

/**
 * Design System PageHeader
 * - Heading title (18/22px, weight 700, navy)
 * - Optional back button (ArrowRight, 20px, stroke 1.75)
 * - Optional trailing action
 */
export default function PageHeader({
  title,
  showBack = false,
  onBack,
  action,
  className = '',
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.leading}>
        {showBack && (
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleBack}
            aria-label="الرجوع"
          >
            <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {action && <div className={styles.trailing}>{action}</div>}
    </header>
  );
}
