import React, { useEffect, useRef } from 'react';
import styles from './StickyBar.module.css';

/**
 * Design System StickyBar
 * - Fixed bottom bar with soft top shadow and 1px border-top
 * - Dynamically updates CSS variable --sticky-bar-height on the document/parent
 * - Matches 480px frame width
 */
export default function StickyBar({
  children,
  className = '',
  cssVar = '--sticky-bar-height',
}) {
  const barRef = useRef(null);

  useEffect(() => {
    const updateHeight = () => {
      if (barRef.current) {
        const height = barRef.current.offsetHeight;
        document.documentElement.style.setProperty(cssVar, `${height}px`);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.removeProperty(cssVar);
    };
  }, [cssVar]);

  return (
    <div ref={barRef} className={`${styles.stickyBar} ${className}`}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
