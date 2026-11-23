import React from 'react';

/**
 * Branded Product Placeholder:
 * White line art SVG icon on transparent canvas for image stages.
 * Clean, lightweight line art (stroke #fff, width 1.4).
 * Keeps exact viewBoxes for type identification (laptop: 0 0 200 130, phone: 0 0 100 130, accessory: 0 0 120 120).
 */
export default function ProductTypeSvg({
  type = 'laptop',
  size,
  stroke = 'currentColor',
  strokeWidth = 1.4,
  className = '',
  width,
  height,
  ...rest
}) {
  const normType = String(type || '').toLowerCase();
  const iconWidth = width !== undefined ? width : size;
  const iconHeight = height !== undefined ? height : size;

  const svgProps = {
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    'aria-hidden': 'true',
    focusable: 'false',
    ...(iconWidth !== undefined ? { width: iconWidth } : {}),
    ...(iconHeight !== undefined ? { height: iconHeight } : {}),
    ...rest,
  };

  if (normType.includes('phone') || normType.includes('موبايل') || normType.includes('هاتف')) {
    return (
      <svg
        viewBox="0 0 100 130"
        {...svgProps}
      >
        <rect
          x="25"
          y="15"
          width="50"
          height="100"
          rx="10"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <line
          x1="42"
          y1="105"
          x2="58"
          y2="105"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="50"
          cy="25"
          r="2"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  if (normType.includes('access') || normType.includes('headphone') || normType.includes('سماعة') || normType.includes('ملحق')) {
    return (
      <svg
        viewBox="0 0 120 120"
        {...svgProps}
      >
        <path
          d="M25 65v-10a35 35 0 0 1 70 0v10"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect
          x="18"
          y="62"
          width="14"
          height="24"
          rx="6"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect
          x="88"
          y="62"
          width="14"
          height="24"
          rx="6"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  // Laptop / default
  return (
    <svg
      viewBox="0 0 200 130"
      {...svgProps}
    >
      <rect
        x="45"
        y="20"
        width="110"
        height="70"
        rx="8"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M25 90h150l-10 16H35L25 90z"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="88"
        y1="90"
        x2="112"
        y2="90"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
