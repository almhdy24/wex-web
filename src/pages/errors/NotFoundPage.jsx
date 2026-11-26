import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import Button from '../../components/common/Button';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconBox} aria-hidden="true">
        <SearchX size={44} strokeWidth={1.6} />
      </div>
      <div className={styles.code}>خطأ 404</div>
      <h1 className={styles.title}>الصفحة غير موجودة</h1>
      <p className={styles.message}>
        لم يتم العثور على الصفحة المطلوبة. يمكنك العودة إلى الرئيسية أو تصفح الأجهزة.
      </p>
      <div className={styles.actions}>
        <Link to="/">
          <Button variant="primary">الرجوع للرئيسية</Button>
        </Link>
        <Link to="/products">
          <Button variant="outline">تصفح الأجهزة</Button>
        </Link>
      </div>
    </div>
  );
}
