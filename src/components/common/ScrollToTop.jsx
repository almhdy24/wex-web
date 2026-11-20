import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import styles from './ScrollToTop.module.css';

export default function ScrollToTop({ scrollThreshold = 500, targetRef }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const getScrollTop = () => {
      if (targetRef?.current) {
        return targetRef.current.scrollTop;
      }
      return window.scrollY || document.documentElement.scrollTop;
    };

    const handleScroll = () => {
      const top = getScrollTop();
      setIsVisible(top > scrollThreshold);
    };

    const target = targetRef?.current || window;
    target.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      target.removeEventListener('scroll', handleScroll);
    };
  }, [scrollThreshold, targetRef]);

  const scrollToTop = () => {
    if (targetRef?.current) {
      targetRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      className={styles.scrollBtn}
      onClick={scrollToTop}
      aria-label="الرجوع إلى أعلى الصفحة"
      title="الرجوع إلى أعلى الصفحة"
    >
      <ArrowUp size={20} />
    </button>
  );
}
