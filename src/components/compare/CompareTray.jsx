import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { getProductImageUrl } from '../../utils/formatters';
import LaptopSvg from '../common/LaptopSvg';
import { t } from '../../content/ar';
import styles from './CompareTray.module.css';

export default function CompareTray() {
  const location = useLocation();
  const { compareItems, removeFromCompare, clearCompare, maxItems } = useCompare();

  const count = compareItems.length;

  // Don't show tray on checkout, order flow, admin, or compare page itself
  const path = location.pathname;
  if (
    count === 0 ||
    path === '/compare' ||
    path === '/checkout' ||
    path.startsWith('/orders') ||
    path.startsWith('/admin')
  ) {
    return null;
  }

  const canCompare = count >= 2;

  return (
    <aside
      className={styles.trayContainer}
      aria-label="شريط المقارنة السريعة"
    >
      <div className={styles.trayCard}>
        <div className={styles.itemsList}>
          {compareItems.map((item) => {
            const imgUrl = getProductImageUrl(item.image?.thumb_path || item.image?.path || item.image);
            return (
              <div key={item.id} className={styles.thumbWrapper}>
                {imgUrl ? (
                  <img src={imgUrl} alt={item.name} className={styles.thumbImg} />
                ) : (
                  <LaptopSvg width={28} height={20} />
                )}
                <button
                  type="button"
                  className={styles.removeThumbBtn}
                  onClick={() => removeFromCompare(item.id)}
                  aria-label={`إزالة ${item.name} من المقارنة`}
                  title="إزالة"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}

          {count < maxItems && (
            <div className={styles.emptySlot} title="خانة مقارنة فارغة" aria-hidden="true">
              +
            </div>
          )}
        </div>

        <div className={styles.metaInfo}>
          <span className={styles.counterTitle}>
            {t('compare.counterText', { current: count, max: maxItems })}
          </span>
          <span className={styles.counterSub}>
            {canCompare ? 'جاهز للمقارنة' : 'أضف جهازاً آخر للمقارنة'}
          </span>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearCompare}
            aria-label="مسح كل أجهزة المقارنة"
            title="مسح"
          >
            {t('compare.clearShort', 'مسح')}
          </button>

          {canCompare ? (
            <Link
              to="/compare"
              className={styles.compareCta}
              aria-label="عرض مقارنة الأجهزة"
            >
              <span>{t('compare.compareNow', 'قارن الآن')}</span>
              <ArrowLeft size={15} />
            </Link>
          ) : (
            <button
              type="button"
              className={`${styles.compareCta} ${styles.compareCtaDisabled}`}
              disabled
              title="أضف جهازين على الأقل للمقارنة"
            >
              <span>{t('compare.compareNow', 'قارن الآن')}</span>
              <ArrowLeft size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
