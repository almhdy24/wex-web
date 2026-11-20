import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, ArrowLeft, GitCompare } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { useCart } from '../../context/CartContext';
import { formatSdg, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import LaptopSvg from '../../components/common/LaptopSvg';
import { t } from '../../content/ar';
import styles from './ComparePage.module.css';

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addItem } = useCart();

  if (compareItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyBox}>
          <div className={styles.emptyIconCircle}>
            <GitCompare size={48} className={styles.emptyIcon} />
          </div>
          <h2 className={styles.emptyTitle}>لا توجد أجهزة في المقارنة</h2>
          <p className={styles.emptyDesc}>
            يمكنك اختيار حتى 3 أجهزة من المتجر لمقارنة مواصفاتها وأسعارها بدقة جنباً إلى جنب.
          </p>
          <Link to="/products" className={styles.browseBtn}>
            <span>تصفّح الأجهزة</span>
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Gather all unique spec keys across all compared items
  const specKeys = [
    { id: 'processor', label: 'المعالج' },
    { id: 'ram', label: 'الذاكرة (RAM)' },
    { id: 'storage', label: 'سعة التخزين' },
    { id: 'screen_size', label: 'مقاس الشاشة' },
    { id: 'gpu', label: 'كرت الشاشة' },
    { id: 'condition', label: 'حالة الجهاز' },
    { id: 'warranty', label: 'الضمان' },
  ];

  const getSpecValue = (item, specId) => {
    if (specId === 'condition') {
      return getConditionLabel(item.condition) || 'مستعمل استيراد';
    }
    if (specId === 'warranty') {
      return item.warranty_text || (item.condition === 'new' ? 'سنة معتمدة' : '3 أشهر فحص واستبدال');
    }
    if (item[specId]) return String(item[specId]);
    if (item.specs) {
      if (Array.isArray(item.specs)) {
        const found = item.specs.find(
          (s) => (s.spec_key || s.name || s.spec_name || '').toLowerCase() === specId.toLowerCase()
        );
        if (found) return found.spec_value || found.value;
      } else if (typeof item.specs === 'object') {
        if (item.specs[specId]) return String(item.specs[specId]);
      }
    }
    return '—';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>مقارنة مواصفات الأجهزة</h1>
          <p className={styles.subtitle}>
            مقارنة دقيقة وشاملة لـ {compareItems.length} أجهزة بالأسعار والضمان
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearCompare}
          >
            مسح الكل
          </button>
          <Link to="/products" className={styles.addMoreBtn}>
            + إضافة جهاز
          </Link>
        </div>
      </div>

      {/* Comparison Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th className={styles.specHeaderCell}>الجهاز</th>
              {compareItems.map((item) => (
                <th key={item.id} className={styles.productHeaderCell}>
                  <div className={styles.productHeaderCard}>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeFromCompare(item.id)}
                      aria-label={`إزالة ${item.name}`}
                      title="إزالة من المقارنة"
                    >
                      <X size={16} />
                    </button>

                    <div className={styles.thumbBox}>
                      {item.image ? (
                        <img
                          src={getProductImageUrl(item.image?.thumb_path || item.image?.path || item.image)}
                          alt={item.name}
                          className={styles.thumbImg}
                        />
                      ) : (
                        <LaptopSvg width={64} height={44} />
                      )}
                    </div>

                    <h3 className={styles.productName}>
                      <Link to={`/products/${item.slug || item.id}`} className={styles.productLink}>
                        {item.name}
                      </Link>
                    </h3>

                    {/* SDG Price Tabular Western */}
                    <div className={styles.productPrice}>
                      {formatSdg(item.price_sdg)}
                    </div>

                    <button
                      type="button"
                      className={styles.addCartBtn}
                      onClick={() => addItem(item, 1)}
                    >
                      <ShoppingCart size={15} />
                      <span>{t('product.addToCart')}</span>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specKeys.map((spec) => {
              // Check if values differ across compared items to highlight differences
              const values = compareItems.map((item) => getSpecValue(item, spec.id));
              const isDifferent = values.length > 1 && new Set(values).size > 1;

              return (
                <tr key={spec.id} className={isDifferent ? styles.differRow : ''}>
                  <td className={styles.specLabelCell}>
                    <div className={styles.labelWithTag}>
                      <span>{spec.label}</span>
                      {isDifferent && <span className={styles.diffTag}>مختلف</span>}
                    </div>
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className={styles.specValCell}>
                      {getSpecValue(item, spec.id)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
