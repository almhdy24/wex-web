import React, { useState } from 'react';
import ProductTypeSvg from './ProductTypeSvg';
import styles from './ProductImage.module.css';

/**
 * Universal product image with clean white line-art SVG fallback.
 * Strictly avoids brand logos. Handles missing photos and image load errors cleanly.
 */
export default function ProductImage({
  src,
  alt = '',
  type = 'laptop',
  className = '',
  fallbackClassName = '',
  size,
  stroke = 'currentColor',
  strokeWidth = 1.4,
  loading = 'lazy',
  ...rest
}) {
  const [hasError, setHasError] = useState(false);

  const isNoPhoto =
    !src ||
    hasError ||
    (typeof src === 'string' && (src.includes('favicon.svg') || src.endsWith('/favicon.svg')));

  if (!isNoPhoto) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        onError={() => setHasError(true)}
        {...rest}
      />
    );
  }

  return (
    <div className={`${styles.placeholderWrapper} ${fallbackClassName || ''}`}>
      <ProductTypeSvg
        type={type}
        size={size}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className={`${styles.placeholderSvg} ${className || ''}`}
        {...rest}
      />
    </div>
  );
}
