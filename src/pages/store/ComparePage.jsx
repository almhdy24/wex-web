import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, ArrowLeft, GitCompare, Check, Plus } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatSdg, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { getProductUrl } from '../../utils/productUrl';
import { ProductImage } from '../../components/common';
import LatinText from '../../components/common/LatinText';
import Page from '../../components/common/Page';
import AppBar from '../../components/common/AppBar';
import { t } from '../../content/ar';
import styles from './ComparePage.module.css';

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare, maxItems } = useCompare();
  const { addItem } = useCart();
  const { success } = useToast();
  const [differencesOnly, setDifferencesOnly] = useState(false);

  if (compareItems.length === 0) {
    return (
      <div className={styles.pageWrapper}>
        <AppBar
          tone="navy"
          style={{ '--header-bottom': '36px' }}
          title={t('compare.title', 'مقارنة الأجهزة')}
          showBack={true}
          showCart={true}
        />
        <Page className={styles.container}>
          <div className={styles.emptyBox}>
            <div className={styles.emptyIconCircle}>
              <GitCompare size={44} className={styles.emptyIcon} />
            </div>
            <h2 className={styles.emptyTitle}>{t('compare.emptyTitle', 'لا توجد أجهزة في المقارنة')}</h2>
            <p className={styles.emptyDesc}>
              {t('compare.emptyDesc', 'يمكنك اختيار حتى 3 أجهزة من المتجر لمقارنة مواصفاتها وأسعارها بدقة جنباً إلى جنب.')}
            </p>
            <Link to="/products" className={styles.browseBtn}>
              <span>{t('compare.browseProducts', 'تصفّح الأجهزة')}</span>
              <ArrowLeft size={16} />
            </Link>
          </div>
        </Page>
      </div>
    );
  }

  // Calculate lowest price if >= 2 items
  const validPrices = compareItems
    .map((item) => Number(item.price_sdg || 0))
    .filter((p) => p > 0);
  const lowestPrice = validPrices.length >= 2 ? Math.min(...validPrices) : null;

  // Comparison Rows
  const specRows = [
    { id: 'processor', label: t('compare.processor', 'المعالج') },
    { id: 'ram', label: t('compare.ram', 'الذاكرة العشوائية') },
    { id: 'storage', label: t('compare.storage', 'سعة التخزين') },
    { id: 'gpu', label: t('compare.gpu', 'كرت الشاشة') },
    { id: 'screen', label: t('compare.screen', 'الشاشة') },
    { id: 'condition', label: t('compare.condition', 'حالة الجهاز') },
    { id: 'battery', label: t('compare.battery', 'البطارية') },
    { id: 'warranty', label: t('compare.warranty', 'الاستلام والتوصيل') },
  ];

  const getSpecValue = (item, specId) => {
    if (specId === 'condition') {
      return getConditionLabel(item.condition) || 'مستعمل استيراد';
    }
    if (specId === 'warranty') {
      return item.warranty_text || '—';
    }
    if (specId === 'processor') {
      return item.processor || item.cpu || findInSpecs(item, ['processor', 'cpu', 'معالج']) || '—';
    }
    if (specId === 'ram') {
      return item.ram || findInSpecs(item, ['ram', 'ذاكرة', 'memory']) || '—';
    }
    if (specId === 'storage') {
      return item.storage || findInSpecs(item, ['storage', 'تخزين', 'ssd', 'hdd']) || '—';
    }
    if (specId === 'gpu') {
      return item.gpu || item.graphics || findInSpecs(item, ['gpu', 'كرت الشاشة', 'graphics']) || '—';
    }
    if (specId === 'screen') {
      return item.screen_size || item.screen || findInSpecs(item, ['screen', 'شاشة', 'screen_size']) || '—';
    }
    if (specId === 'battery') {
      return item.battery || findInSpecs(item, ['battery', 'بطارية']) || 'حالة ممتازة (مطابقة للمواصفات)';
    }
    return item[specId] || findInSpecs(item, [specId]) || '—';
  };

  function findInSpecs(item, searchKeys) {
    if (!item.specs) return null;
    if (Array.isArray(item.specs)) {
      for (const k of searchKeys) {
        const found = item.specs.find((s) => {
          const keyName = (s.spec_key || s.name || s.spec_name || '').toLowerCase();
          return keyName.includes(k.toLowerCase());
        });
        if (found) return found.spec_value || found.value;
      }
    } else if (typeof item.specs === 'object') {
      for (const k of searchKeys) {
        if (item.specs[k]) return String(item.specs[k]);
      }
    }
    return null;
  }

  // Filter rows by differences if toggle is active
  const filteredRows = specRows.filter((spec) => {
    if (!differencesOnly) return true;
    const values = compareItems.map((item) => getSpecValue(item, spec.id));
    return new Set(values).size > 1;
  });

  const currentType = compareItems[0]?.type || 'laptop';

  const handleAddToCart = (product) => {
    addItem(product, 1);
    success({
      title: t('toast.addedToCartTitle', 'أُضيف إلى السلة'),
      detail: <LatinText>{product.name}</LatinText>,
      action: {
        label: t('toast.viewCartAction', 'عرض السلة'),
        onClick: () => {
          if (typeof window !== 'undefined') window.location.href = '/cart';
        },
      },
      dedupeKey: `cart-${product.id}`,
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <AppBar
        tone="navy"
        style={{ '--header-bottom': '36px' }}
        title={t('compare.title', 'مقارنة الأجهزة')}
        showBack={true}
        showCart={true}
      />
      <Page className={styles.container}>
      {/* Header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>{t('compare.title', 'مقارنة الأجهزة')}</h1>
          <p className={styles.subtitle}>
            {t('compare.subtitle', 'مقارنة المواصفات الفنية والأسعار جنبًا إلى جنب')}
          </p>
        </div>
      </header>

      {/* Controls Bar: Differences Toggle & Actions */}
      <div className={styles.controlsBar}>
        <label className={styles.diffToggleLabel}>
          <input
            type="checkbox"
            className={styles.toggleInput}
            checked={differencesOnly}
            onChange={(e) => setDifferencesOnly(e.target.checked)}
            aria-label={t('compare.differencesOnly', 'إظهار الفروق فقط')}
          />
          <span>{t('compare.differencesOnly', 'إظهار الفروق فقط')}</span>
        </label>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearCompare}
            aria-label="مسح كل أجهزة المقارنة"
            title="مسح المقارنة"
          >
            {t('compare.clearAll', 'مسح المقارنة')}
          </button>
          {compareItems.length < maxItems && (
            <Link
              to={`/products?type=${encodeURIComponent(currentType)}`}
              className={styles.addMoreBtn}
            >
              <Plus size={15} />
              <span>{t('compare.addDevice', 'إضافة جهاز')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th className={styles.specHeaderCell}>المواصفات</th>
              {compareItems.map((item) => {
                const isLowest = lowestPrice !== null && Number(item.price_sdg) === lowestPrice;
                const imgUrl = getProductImageUrl(
                  item.thumb_url ||
                  item.primary_image ||
                  item.image?.thumb_path ||
                  item.image?.path ||
                  item.image
                );

                return (
                  <th key={item.id} className={styles.productHeaderCell}>
                    <div className={styles.productHeaderCard}>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeFromCompare(item.id)}
                        aria-label={`إزالة ${item.name} من المقارنة`}
                        title={t('compare.removeDevice', 'إزالة من المقارنة')}
                      >
                        <X size={18} strokeWidth={2} />
                      </button>

                      <div className={styles.thumbBox}>
                        <ProductImage
                          src={imgUrl}
                          alt={item.name}
                          type={item.type || 'laptop'}
                          className={styles.thumbImg}
                        />
                      </div>

                      <span className={styles.conditionBadge}>
                        {getConditionLabel(item.condition) || 'مستعمل استيراد'}
                      </span>

                      <h3 className={styles.productName}>
                        <Link to={getProductUrl(item)} className={styles.productLink}>
                          <LatinText>{item.name}</LatinText>
                        </Link>
                      </h3>

                      <div className={styles.productPrice}>
                        {formatSdg(item.price_sdg)}
                      </div>

                      {isLowest && (
                        <span className={styles.lowestPriceBadge}>
                          <Check size={12} strokeWidth={2.5} />
                          <span>{t('compare.lowestPrice', 'الأقل سعرًا')}</span>
                        </span>
                      )}

                      <button
                        type="button"
                        className={styles.addCartBtn}
                        onClick={() => handleAddToCart(item)}
                        aria-label={`إضافة ${item.name} إلى السلة`}
                      >
                        <ShoppingCart size={15} />
                        <span>{t('compare.addToCart', 'أضف للسلة')}</span>
                      </button>
                    </div>
                  </th>
                );
              })}

              {compareItems.length < maxItems && (
                <th className={styles.emptySlotCell}>
                  <Link
                    to={`/products?type=${encodeURIComponent(currentType)}`}
                    className={styles.addSlotCard}
                    aria-label="إضافة جهاز آخر للمقارنة"
                  >
                    <div className={styles.addSlotIcon}>+</div>
                    <span className={styles.addSlotLabel}>{t('compare.addDevice', 'إضافة جهاز')}</span>
                  </Link>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={compareItems.length + 1} className={styles.noDiffNotice}>
                  جميع المواصفات متطابقة بين الأجهزة المختارة.
                </td>
              </tr>
            ) : (
              filteredRows.map((spec) => {
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
                        <LatinText>{getSpecValue(item, spec.id)}</LatinText>
                      </td>
                    ))}
                    {compareItems.length < maxItems && <td className={styles.specValCell}>—</td>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Page>
    </div>
  );
}
