import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './PromoBanner.module.css';

function two(n) {
  return String(n).padStart(2, '0');
}

/** "02:14:09" until endsAt (ISO). Returns null when there is nothing to count down to. */
function useCountdown(endsAt, enabled) {
  const [left, setLeft] = useState(() => (endsAt ? Math.max(0, Math.floor((new Date(endsAt) - Date.now()) / 1000)) : 0));
  useEffect(() => {
    if (!enabled || !endsAt) return undefined;
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(endsAt) - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt, enabled]);
  if (!enabled || !endsAt || left <= 0) return null;
  return `${two(Math.floor(left / 3600))}:${two(Math.floor((left % 3600) / 60))}:${two(left % 60)}`;
}

/**
 * Promotion banner shared by the store and the admin live preview.
 * variant: "banner" (default) | "compact" (72px row) | "strip" (36px announcement).
 * size: "sm" (172px) | "lg" (360px, desktop hero).
 */
export default function PromoBanner({ promo, size = 'sm', variant = 'banner', as: Tag = 'a', href, onClick }) {
  const {
    title, subtitle, badge_text: badge, cta_label: cta, theme = 'ink', layout = 'text',
    image_url: imageUrl, image_alt: imageAlt, show_countdown: showCountdown, ends_at: endsAt,
  } = promo;
  const countdown = useCountdown(endsAt, Boolean(showCountdown));
  const hasImage = Boolean(imageUrl) && layout !== 'text';

  const cls = [
    styles.banner,
    styles[theme] || styles.ink,
    variant === 'banner' ? styles[layout] : '',
    size === 'lg' && variant === 'banner' ? styles.lg : '',
    variant === 'compact' ? styles.compact : '',
    variant === 'strip' ? styles.strip : '',
  ].filter(Boolean).join(' ');

  const props = Tag === 'a' ? { href: href || undefined } : { type: 'button' };

  return (
    <Tag className={cls} onClick={onClick} aria-label={[title, subtitle].filter(Boolean).join('، ')} {...props}>
      {variant === 'banner' && hasImage && layout === 'image' ? (
        <>
          <img className={styles.bgImage} src={imageUrl} alt={imageAlt || ''} loading="lazy" decoding="async" />
          <span className={styles.scrim} aria-hidden="true" />
        </>
      ) : null}
      {variant === 'banner' && hasImage && layout === 'split' ? (
        <img className={styles.sideImage} src={imageUrl} alt={imageAlt || ''} loading="lazy" decoding="async" />
      ) : null}
      <span className={styles.body}>
        {badge && variant === 'banner' ? <span className={styles.badge}>{badge}</span> : null}
        <span className={styles.title}>{title || 'عنوان العرض'}</span>
        {subtitle && variant !== 'strip' ? <span className={styles.subtitle}>{subtitle}</span> : null}
        {variant === 'banner' && (cta || countdown) ? (
          <span className={styles.footer}>
            {cta ? <span className={styles.cta}>{cta}</span> : null}
            {countdown ? <span className={styles.countdown}>ينتهي بعد {countdown}</span> : null}
          </span>
        ) : null}
      </span>
      {variant === 'compact' && cta ? <span className={styles.cta}>{cta}</span> : null}
    </Tag>
  );
}

PromoBanner.propTypes = {
  promo: PropTypes.object.isRequired,
  size: PropTypes.oneOf(['sm', 'lg']),
  variant: PropTypes.oneOf(['banner', 'compact', 'strip']),
  as: PropTypes.elementType,
  href: PropTypes.string,
  onClick: PropTypes.func,
};
