import { useState, useCallback } from 'react';
import styles from './Ripple.module.css';

/**
 * <Ripple>
 * Adds an interactive touch/click material-style ripple.
 * Animates strictly transform and opacity.
 */
export default function Ripple() {
  const [ripples, setRipples] = useState([]);

  const addRipple = useCallback((event) => {
    const trigger = event.currentTarget;
    const rect = trigger.getBoundingClientRect();

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);
  }, []);

  const handleAnimationEnd = (id) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    triggerProps: {
      onPointerDown: addRipple,
    },
    rippleElement: (
      <span className={styles.rippleContainer} aria-hidden="true">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={styles.rippleCircle}
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
              width: `${ripple.size}px`,
              height: `${ripple.size}px`,
            }}
            onAnimationEnd={() => handleAnimationEnd(ripple.id)}
          />
        ))}
      </span>
    ),
  };
}
