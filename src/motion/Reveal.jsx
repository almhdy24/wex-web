import React, { useRef, useState, useEffect } from 'react';
import styles from './Reveal.module.css';

/**
 * <Reveal>
 * Smoothly fades and rises an element when it first intersects the viewport.
 * Triggers strictly once per element.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
  threshold = 0.1,
  as: Component = 'div',
  ...rest
}) {
  const domRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = domRef.current;
    if (!node) return;

    // Check if IntersectionObserver is available
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  const style = delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <Component
      ref={domRef}
      className={`${styles.reveal} ${isVisible ? styles.visible : ''} ${className}`.trim()}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
}
