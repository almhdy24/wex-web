import React, { useEffect, useRef, useState } from 'react';
import styles from './StickyBar.module.css';

/**
 * Design System StickyBar
 * - Fixed bottom bar with soft top shadow and 1px border-top
 * - Dynamically updates CSS variable --sticky-bar-height on the document/parent
 * - Matches 480px frame width
 * - Detects active input focus on mobile to prevent blocking on-screen keyboards
 */
export default function StickyBar({
  children,
  className = '',
  cssVar = '--sticky-bar-height',
  hideOnInput = false,
}) {
  const barRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const updateHeight = () => {
      if (barRef.current) {
        const height = barRef.current.offsetHeight;
        document.documentElement.style.setProperty(cssVar, `${height}px`);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    let handleFocusIn;
    let handleFocusOut;

    if (hideOnInput) {
      handleFocusIn = (e) => {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          setIsInputFocused(true);
        }
      };

      handleFocusOut = (e) => {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          setIsInputFocused(false);
        }
      };

      window.addEventListener('focusin', handleFocusIn);
      window.addEventListener('focusout', handleFocusOut);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.removeProperty(cssVar);
      if (hideOnInput) {
        window.removeEventListener('focusin', handleFocusIn);
        window.removeEventListener('focusout', handleFocusOut);
      }
    };
  }, [cssVar, hideOnInput]);

  return (
    <div
      ref={barRef}
      className={`${styles.stickyBar} ${isInputFocused ? styles.inputFocused : ''} ${className}`}
    >
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
