import React from 'react';

/**
 * Clean SVG vector laptop illustration from approved mockup.
 * Used when a product has no uploaded image or as a crisp fallback.
 */
export default function LaptopSvg({
  silhouette = 'business',
  accentColor = '#1E6BFF',
  className = '',
}) {
  const gradId = `screenGrad-${silhouette}-${accentColor.replace('#', '')}`;

  return (
    <svg
      viewBox="0 0 200 130"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="20" y1="10" x2="180" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#061A55" />
          <stop offset="60%" stopColor="#0B3FBF" />
          <stop offset="100%" stopColor={accentColor} />
        </linearGradient>
        <linearGradient id="bodyGrad" x1="0" y1="95" x2="200" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D9E6F6" />
          <stop offset="100%" stopColor="#BACEE8" />
        </linearGradient>
        <linearGradient id="keyboardGrad" x1="30" y1="96" x2="170" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#061A55" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#061A55" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="116" rx="86" ry="8" fill="rgba(6, 26, 85, 0.14)" />
      <rect x="25" y="10" width="150" height="86" rx="8" fill="#1A284A" stroke="#2B3C68" strokeWidth="1.5" />
      <rect x="30" y="14" width="140" height="78" rx="4" fill="#040C26" />
      <rect x="33" y="17" width="134" height="72" rx="2" fill={`url(#${gradId})`} />

      <path d="M50 89 L110 17 L128 17 L68 89 Z" fill="rgba(255, 255, 255, 0.16)" />
      <path d="M120 89 L145 45 L155 45 L130 89 Z" fill="rgba(0, 183, 255, 0.28)" />

      <circle cx="100" cy="15.5" r="1.2" fill="#00B7FF" />
      <circle cx="100" cy="53" r="10" fill="rgba(255, 255, 255, 0.08)" />
      <path d="M96 48 L104 58 M104 48 L96 58" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

      <rect x="74" y="94" width="52" height="4" rx="2" fill="#0B1B47" />
      <path d="M14 96 L186 96 L194 112 C194 114 192 115 189 115 L11 115 C8 115 6 114 6 112 L14 96 Z" fill="url(#bodyGrad)" />
      <polygon points="34,98 166,98 161,107 39,107" fill="url(#keyboardGrad)" />
      <rect x="85" y="109" width="30" height="5" rx="1.5" fill="rgba(6, 26, 85, 0.22)" />
      <line x1="8" y1="114" x2="192" y2="114" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}
