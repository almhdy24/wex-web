import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp
 * Counts up a number smoothly when the referenced element scrolls into view.
 * Respects prefers-reduced-motion / reduced motion mode.
 */
export function useCountUp(targetNumber, durationMs = 700) {
  const [count, setCount] = useState(0);
  const domRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const node = domRef.current;
    const target = Number(targetNumber) || 0;

    if (target <= 0) {
      setCount(0);
      return;
    }

    // Check if motion is reduced
    const isReduced =
      typeof document !== 'undefined' &&
      (document.documentElement.getAttribute('data-motion') === 'reduced' ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));

    if (isReduced) {
      setCount(target);
      return;
    }

    if (!node || typeof IntersectionObserver === 'undefined') {
      setCount(target);
      return;
    }

    let animationFrameId;

    const startCounting = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      const startTime = performance.now();

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Ease out quad
        const easeOut = 1 - (1 - progress) * (1 - progress);
        const currentVal = Math.round(easeOut * target);

        setCount(currentVal);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCount(target);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCounting();
          observer.unobserve(node);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetNumber, durationMs]);

  return [count, domRef];
}
