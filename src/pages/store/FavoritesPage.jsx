import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';
import ProductCard from '../../components/products/ProductCard';
import styles from './FavoritesPage.module.css';

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>الأجهزة المفضلة</h1>
        <p className={styles.subtitle}>
          {favorites.length > 0
            ? `لديك ${favorites.length} أجهزة محفوظة في قائمتك المفضلة`
            : 'احتفظ بالأجهزة التي تنال إعجابك للرجوع إليها في أي وقت'}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className={styles.emptyBox}>
          <div className={styles.emptyIconCircle}>
            <Heart size={48} className={styles.emptyIcon} />
          </div>
          <h2 className={styles.emptyTitle}>قائمتك المفضلة فارغة</h2>
          <p className={styles.emptyDesc}>
            اضغط على أيقونة القلب على أي جهاز في المتجر لحفظه هنا ومتابعة سعره وتفاصيله.
          </p>
          <Link to="/products" className={styles.browseBtn}>
            <span>تصفّح أجهزة المتجر</span>
            <ArrowLeft size={16} />
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {favorites.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
