import React, { useId } from 'react';
import styles from './BrandRibbons.module.css';

/**
 * BrandRibbons — Signature Wex brand element.
 * Slanted gradient ribbons (parallelograms) inspired by the 'X' mark in Wex Technology.
 * Used for backgrounds, hero sections, dividers and image stages.
 * Supports variants: 'header', 'hero', 'tile', 'panel', or default.
 */
export default function BrandRibbons({
  variant = 'default',
  animated = true,
  opacity = 1,
  className = '',
  style = {},
  ariaHidden = true,
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const renderContent = () => {
    switch (variant) {
      case 'header':
        return (
          <svg
            className={styles.ribbonsSvg}
            shapeRendering="geometricPrecision"
            viewBox="0 0 390 150"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <defs>
              <linearGradient id={`${uid}_G`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#1E6BFF" stopOpacity="0" />
                <stop offset="1" stopColor="#00B7FF" stopOpacity="1" />
              </linearGradient>
            </defs>
            <g className={styles.ribbonGroup}>
              <polygon points="-30,92 160,92 140,132 -50,132" fill={`url(#${uid}_G)`} opacity="0.4" />
              <polygon points="230,18 420,18 400,52 210,52" fill="#1E6BFF" opacity="0.35" />
            </g>
          </svg>
        );

      case 'hero':
        return (
          <svg
            className={styles.ribbonsSvg}
            shapeRendering="geometricPrecision"
            viewBox="0 0 390 420"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <defs>
              <linearGradient id={`${uid}_G1`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#0B3FBF" stopOpacity="1" />
                <stop offset="1" stopColor="#00B7FF" stopOpacity="1" />
              </linearGradient>
              <linearGradient id={`${uid}_G2`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#1E6BFF" stopOpacity="0" />
                <stop offset="1" stopColor="#1E6BFF" stopOpacity="1" />
              </linearGradient>
            </defs>
            <g className={styles.ribbonGroup}>
              <polygon points="-40,250 150,250 126,296 -64,296" fill={`url(#${uid}_G1)`} opacity="0.55" />
              <polygon points="-90,312 110,312 86,352 -114,352" fill={`url(#${uid}_G2)`} opacity="0.6" />
              <polygon points="-20,368 210,368 186,412 -44,412" fill={`url(#${uid}_G1)`} opacity="0.35" />
              <polygon points="250,24 470,24 446,64 226,64" fill={`url(#${uid}_G2)`} opacity="0.25" />
            </g>
          </svg>
        );

      case 'tile':
        return (
          <svg
            className={styles.ribbonsSvg}
            shapeRendering="geometricPrecision"
            viewBox="0 0 160 112"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <g className={styles.ribbonGroup}>
              <polygon points="-10,70 90,70 78,92 -22,92" fill="#00B7FF" opacity="0.28" />
              <polygon points="40,20 170,20 158,40 28,40" fill="#1E6BFF" opacity="0.4" />
            </g>
          </svg>
        );

      case 'panel':
        return (
          <svg
            className={styles.ribbonsSvg}
            shapeRendering="geometricPrecision"
            viewBox="0 0 360 340"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <g className={styles.ribbonGroup}>
              <polygon points="-30,260 170,260 146,304 -54,304" fill="#00B7FF" opacity="0.16" />
              <polygon points="220,20 400,20 376,60 196,60" fill="#1E6BFF" opacity="0.35" />
            </g>
          </svg>
        );

      default:
        return (
          <svg
            className={styles.ribbonsSvg}
            shapeRendering="geometricPrecision"
            viewBox="0 0 600 300"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <defs>
              <linearGradient id={`${uid}_wexRibbonGrad1`} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0B3FBF" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#00B7FF" stopOpacity="0.4" />
              </linearGradient>

              <linearGradient id={`${uid}_wexRibbonGrad2`} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E6BFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#00B7FF" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id={`${uid}_wexRibbonGrad3`} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#061A55" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0B3FBF" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            <g className={styles.ribbonGroup}>
              <polygon
                points="240,-40 380,-40 220,340 80,340"
                fill={`url(#${uid}_wexRibbonGrad1)`}
                opacity="0.35"
              />
              <polygon
                points="410,-40 480,-40 310,340 240,340"
                fill={`url(#${uid}_wexRibbonGrad2)`}
                opacity="0.28"
              />
              <polygon
                points="140,-40 210,-40 60,340 -10,340"
                fill={`url(#${uid}_wexRibbonGrad3)`}
                opacity="0.2"
              />
            </g>
          </svg>
        );
    }
  };

  return (
    <div
      className={`${styles.ribbonsWrapper} ${animated ? styles.animated : ''} ${className}`}
      style={{ opacity, ...style }}
      aria-hidden={ariaHidden}
    >
      {renderContent()}
    </div>
  );
}
