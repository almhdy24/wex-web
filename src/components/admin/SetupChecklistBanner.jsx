import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronLeft } from 'lucide-react';
import { adminApi } from '../../api/admin';
import styles from './SetupChecklistBanner.module.css';

/**
 * "أكمل إعداد المتجر": a fresh install keeps ordering closed until the shop's contact,
 * address, hours, a payment account and the exchange rate are set. Lists what is missing
 * with a link to each place to fix it; renders nothing once setup is complete.
 */
export default function SetupChecklistBanner() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    adminApi.getSetupStatus()
      .then((res) => { if (alive) setStatus(res?.data || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!status || !Array.isArray(status.missing) || status.missing.length === 0) return null;
  const required = status.missing.filter((m) => m.required);
  const optional = status.missing.filter((m) => !m.required);
  if (status.complete && optional.length === 0) return null;

  return (
    <aside className={`${styles.banner} ${status.complete ? styles.soft : ''}`} role="status" aria-label="إعداد المتجر">
      <div className={styles.head}>
        <ClipboardList size={20} aria-hidden="true" className={styles.icon} />
        <div>
          <h2 className={styles.title}>{status.complete ? 'إعداد المتجر مكتمل' : 'أكمل إعداد المتجر'}</h2>
          <p className={styles.sub}>
            {status.complete
              ? 'يمكنك فتح استقبال الطلبات. عناصر مقترحة:'
              : 'استقبال الطلبات مغلق حتى تُكمل العناصر التالية:'}
          </p>
        </div>
      </div>
      <ul className={styles.list}>
        {[...required, ...optional].map((m) => (
          <li key={m.key}>
            <Link to={m.link} className={styles.item}>
              <span className={m.required ? styles.dotRequired : styles.dotOptional} aria-hidden="true" />
              <span className={styles.label}>{m.label}</span>
              <ChevronLeft size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
