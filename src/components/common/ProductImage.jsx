import React, { useState } from 'react';
import ProductTypeSvg from './ProductTypeSvg';

/**
 * Universal product image with clean neutral type-based SVG fallback.
 * Strictly avoids brand logos. Handles missing photos and image load errors cleanly.
 */
export default function ProductImage({
  src,
  alt = '',
  type = 'laptop',
  className = '',
  fallbackClassName = '',
  loading = 'lazy',
  ...rest
}) {
  const [hasError, setHasError] = useState(false);

  if (src && !hasError) {
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
    <ProductTypeSvg
      type={type}
      className={fallbackClassName || className}
      {...rest}
    />
  );
}
