import React from 'react';

/**
 * Neutral line-art SVG illustrations by product type:
 * - 'laptop': Clean modern laptop line art
 * - 'phone': Clean modern smartphone line art
 * - 'accessory': Clean modern headphone / tech accessory line art
 * Strictly zero brand icons/logos.
 */
export default function ProductTypeSvg({
  type = 'laptop',
  className = '',
  width = '100%',
  height = '100%',
  _accentColor = 'var(--wex-royal, #0B3FBF)',
  ...rest
}) {
  const normType = String(type || '').toLowerCase();

  if (normType === 'phone') {
    return (
      <svg
        viewBox="0 0 100 130"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...rest}
      >
        <ellipse cx="50" cy="122" rx="36" ry="5" fill="rgba(6, 26, 85, 0.12)" />
        <rect x="22" y="10" width="56" height="106" rx="12" fill="#FFFFFF" stroke="#2B3C68" strokeWidth="2" />
        <rect x="26" y="15" width="48" height="96" rx="8" fill="#F4F8FD" />
        <rect x="42" y="19" width="16" height="4" rx="2" fill="#2B3C68" />
        <rect x="34" y="38" width="32" height="4" rx="2" fill="rgba(11, 63, 191, 0.18)" />
        <rect x="34" y="48" width="24" height="3" rx="1.5" fill="rgba(6, 26, 85, 0.1)" />
        <rect x="40" y="103" width="20" height="2.5" rx="1.25" fill="#2B3C68" opacity="0.4" />
      </svg>
    );
  }

  if (normType === 'accessory') {
    return (
      <svg
        viewBox="0 0 120 120"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...rest}
      >
        <ellipse cx="60" cy="110" rx="42" ry="6" fill="rgba(6, 26, 85, 0.12)" />
        <path
          d="M32 70 C32 38, 88 38, 88 70"
          stroke="#2B3C68"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M38 64 C42 45, 78 45, 82 64"
          stroke="rgba(11, 63, 191, 0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="22" y="66" width="14" height="26" rx="6" fill="#FFFFFF" stroke="#2B3C68" strokeWidth="2" />
        <rect x="26" y="70" width="6" height="18" rx="3" fill="rgba(11, 63, 191, 0.2)" />
        <rect x="84" y="66" width="14" height="26" rx="6" fill="#FFFFFF" stroke="#2B3C68" strokeWidth="2" />
        <rect x="88" y="70" width="6" height="18" rx="3" fill="rgba(11, 63, 191, 0.2)" />
      </svg>
    );
  }

  // Default: Laptop
  return (
    <svg
      viewBox="0 0 200 130"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <ellipse cx="100" cy="116" rx="86" ry="8" fill="rgba(6, 26, 85, 0.12)" />
      <rect x="25" y="10" width="150" height="86" rx="8" fill="#FFFFFF" stroke="#2B3C68" strokeWidth="2" />
      <rect x="30" y="15" width="140" height="76" rx="4" fill="#F4F8FD" />
      <path d="M50 85 L110 20 L126 20 L66 85 Z" fill="rgba(11, 63, 191, 0.12)" />
      <circle cx="100" cy="13" r="1.5" fill="#2B3C68" />
      <rect x="74" y="94" width="52" height="4" rx="2" fill="#2B3C68" />
      <path d="M14 96 L186 96 L194 112 C194 114 192 115 189 115 L11 115 C8 115 6 114 6 112 L14 96 Z" fill="#E8F1FC" stroke="#2B3C68" strokeWidth="1.5" />
      <rect x="85" y="103" width="30" height="7" rx="1.5" fill="#FFFFFF" stroke="#BACEE8" strokeWidth="1" />
    </svg>
  );
}
