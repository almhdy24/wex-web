import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.code}>404</div>
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
