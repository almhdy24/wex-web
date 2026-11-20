import { useEffect, useRef } from 'react';

/**
 * useParallax
 * Subtly shifts background or element transforms based on scroll position.
 * rAF-throttled, passive scroll listener.
 * Disabled automatically in lite and reduced motion modes.
 */
export function useParallax(speed = 0.2) {
  const targetRef = useRef(null);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof window === 'undefined') return;

    // Check motion mode
    const isLiteOrReduced =
      typeof document !== 'undefined' &&
      (document.documentElement.getAttribute('data-motion') === 'lite' ||
        document.documentElement.getAttribute('data-motion') === 'reduced' ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));

    if (isLiteOrReduced) {
      node.style.transform = '';
      return;
    }

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset || 0;
          const yOffset = Math.round(scrollY * speed);
          if (node) {
            node.style.transform = `translate3d(0, ${yOffset}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);

  return targetRef;
}
