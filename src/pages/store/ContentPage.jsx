import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import AppBar from '../../components/common/AppBar';
import Page from '../../components/common/Page';
import Skeleton from '../../components/common/Skeleton';
import Button from '../../components/common/Button';
import { productsApi } from '../../api/products';
import styles from './ContentPage.module.css';

/**
 * Store pages edited in admin (/admin/pages): privacy, terms, returns, about.
 * The storefront had no route for them, so admin edits never reached customers.
 * Body is plain text: blank lines separate paragraphs, single newlines are kept.
 */
export default function ContentPage({ slug: slugProp = null }) {
  const params = useParams();
  const slug = slugProp || params.slug;
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    productsApi.getPage(slug)
      .then((res) => {
        if (!alive) return;
        const data = res?.data;
        if (data && data.is_active !== false && data.is_active !== 0 && data.body) {
          setPage(data);
          setStatus('ready');
        } else {
          setStatus('missing');
        }
      })
      .catch(() => alive && setStatus('missing'));
    return () => { alive = false; };
  }, [slug]);

  const paragraphs = (page?.body || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={styles.pageWrapper}>
      <AppBar tone="navy" title={page?.title || 'صفحة المتجر'} showBack backTo="/" showCart={false} />
      <Page className={styles.container}>
        {status === 'loading' && (
          <div className={styles.card} aria-busy="true">
            <Skeleton height="20px" width="60%" />
            <Skeleton height="14px" width="95%" />
            <Skeleton height="14px" width="88%" />
            <Skeleton height="14px" width="70%" />
          </div>
        )}

        {status === 'ready' && (
          <article className={styles.card}>
            {paragraphs.map((p, i) => (
              <p key={i} className={styles.paragraph}>{p}</p>
            ))}
          </article>
        )}

        {status === 'missing' && (
          <div className={`${styles.card} ${styles.missing}`}>
            <FileText size={32} strokeWidth={1.6} className={styles.missingIcon} aria-hidden="true" />
            <p className={styles.paragraph}>هذه الصفحة غير متوفرة حاليًا.</p>
            <Link to="/">
              <Button variant="primary">الرجوع للرئيسية</Button>
            </Link>
          </div>
        )}
      </Page>
    </div>
  );
}
