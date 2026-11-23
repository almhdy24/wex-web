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
  innerClassName = '',
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
    let handleViewportResize;

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

      // Detect virtual keyboard shrink via visualViewport
      if (typeof window !== 'undefined' && window.visualViewport) {
        handleViewportResize = () => {
          const isShrunk = window.visualViewport.height < window.innerHeight * 0.75;
          setIsInputFocused(isShrunk);
        };
        window.visualViewport.addEventListener('resize', handleViewportResize);
      }
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.removeProperty(cssVar);
      if (hideOnInput) {
        window.removeEventListener('focusin', handleFocusIn);
        window.removeEventListener('focusout', handleFocusOut);
        if (handleViewportResize && window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportResize);
        }
      }
    };
  }, [cssVar, hideOnInput]);

  return (
    <div
      ref={barRef}
      className={`${styles.stickyBar} ${isInputFocused ? styles.inputFocused : ''} ${className}`}
    >
      <div className={`${styles.inner} ${innerClassName}`}>{children}</div>
    </div>
  );
}
