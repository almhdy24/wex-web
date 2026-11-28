import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import PromoBanner from './PromoBanner';
import { promotionsApi, promoHref } from '../../api/promotions';
import styles from './PromoCarousel.module.css';

function useLarge() {
  const [large, setLarge] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 768px)');
    if (!mq) return undefined;
    const on = (e) => setLarge(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return large;
}

export function usePromotions(placement) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let ok = true;
    promotionsApi.list(placement).then((r) => ok && setItems(r));
    return () => { ok = false; };
  }, [placement]);
  return items;
}

/** CSS scroll-snap carousel (viewport 92% so the next banner peeks), 5s autoplay that pauses on touch/hover. */
export function PromoCarousel({ placement, whatsapp }) {
  const items = usePromotions(placement);
  const large = useLarge();
  const track = useRef(null);
  const paused = useRef(false);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const slide = el.firstElementChild;
    if (!slide) return;
    const i = Math.round(Math.abs(el.scrollLeft) / (slide.getBoundingClientRect().width + 8));
    setIndex(i);
  }, []);

  useEffect(() => {
    if (!items || items.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = window.setInterval(() => {
      const el = track.current;
      if (!el || paused.current || document.hidden) return;
      const slide = el.firstElementChild;
      const step = slide.getBoundingClientRect().width + 8;
      const next = (Math.round(Math.abs(el.scrollLeft) / step) + 1) % items.length;
      el.scrollTo({ left: (document.dir === 'rtl' || getComputedStyle(el).direction === 'rtl' ? -1 : 1) * next * step, behavior: 'smooth' });
    }, 5000);
    return () => window.clearInterval(id);
  }, [items]);

  useEffect(() => {
    if (items && items[index]) promotionsApi.track(items[index].id, 'view');
  }, [items, index]);

  if (items === null) return <div className={styles.skeleton} aria-hidden="true" />;
  if (items.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label="العروض">
      <div
        ref={track}
        className={`${styles.track} ${items.length === 1 ? styles.single : ''}`}
        onScroll={onScroll}
        onPointerDown={() => { paused.current = true; }}
        onPointerUp={() => { paused.current = false; }}
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        {items.map((p) => (
          <div key={p.id} className={styles.slide}>
            <PromoBanner
              promo={p}
              size={large ? 'lg' : 'sm'}
              href={promoHref(p, whatsapp)}
              onClick={() => promotionsApi.track(p.id, 'click')}
            />
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <div className={styles.dots} aria-hidden="true">
          {items.map((p, i) => <span key={p.id} className={`${styles.dot} ${i === index ? styles.dotOn : ''}`} />)}
        </div>
      ) : null}
    </section>
  );
}

PromoCarousel.propTypes = { placement: PropTypes.string.isRequired, whatsapp: PropTypes.string };

/** web_strip announcement (36px). */
export function PromoStrip({ placement = 'web_strip', whatsapp }) {
  const items = usePromotions(placement);
  useEffect(() => {
    if (items && items[0]) promotionsApi.track(items[0].id, 'view');
  }, [items]);
  if (!items || items.length === 0) return null;
  const p = items[0];
  return <PromoBanner promo={p} variant="strip" href={promoHref(p, whatsapp)} onClick={() => promotionsApi.track(p.id, 'click')} />;
}
PromoStrip.propTypes = { placement: PropTypes.string, whatsapp: PropTypes.string };

/** One in-list promo spanning the full grid row (web_inline). */
export function PromoInline({ placement = 'web_inline', whatsapp }) {
  const items = usePromotions(placement);
  useEffect(() => {
    if (items && items[0]) promotionsApi.track(items[0].id, 'view');
  }, [items]);
  if (!items || items.length === 0) return null;
  const p = items[0];
  return <PromoBanner promo={p} href={promoHref(p, whatsapp)} onClick={() => promotionsApi.track(p.id, 'click')} />;
}
PromoInline.propTypes = { placement: PropTypes.string, whatsapp: PropTypes.string };
