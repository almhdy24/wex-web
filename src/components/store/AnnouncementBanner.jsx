import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Info, AlertTriangle, AlertCircle, CheckCircle2, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import { ar } from '../../content/ar';
import styles from './AnnouncementBanner.module.css';

const STORAGE_KEY = 'wex_dismissed_announcement_banners';

function getDismissedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDismissedId(id) {
  try {
    const current = getDismissedIds();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  } catch {
    // storage unavailable
  }
}

export default function AnnouncementBanner({ announcements: propAnnouncements }) {
  const [items, setItems] = useState(propAnnouncements || []);
  const [dismissed, setDismissed] = useState(getDismissedIds());
  const [exitingIds, setExitingIds] = useState(new Set());

  useEffect(() => {
    if (propAnnouncements) {
      setItems(propAnnouncements);
      return;
    }

    let isMounted = true;
    api.get('/announcements')
      .then((res) => {
        if (isMounted && Array.isArray(res?.data)) {
          setItems(res.data);
        }
      })
      .catch(() => {
        // Fallback gracefully on network / missing route
      });

    return () => {
      isMounted = false;
    };
  }, [propAnnouncements]);

  const activeBanners = items.filter(
    (item) => item.placement === 'banner' && !dismissed.includes(item.id)
  );

  if (activeBanners.length === 0) {
    return null;
  }

  const handleDismiss = (id) => {
    setExitingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      saveDismissedId(id);
      setDismissed((prev) => [...prev, id]);
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 280);
  };

  const getKindIcon = (kind) => {
    switch (kind) {
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'critical':
        return <AlertCircle size={18} />;
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'info':
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className={styles.container} role="region" aria-label={ar.announcements.title}>
      {activeBanners.map((banner) => {
        const isExiting = exitingIds.has(banner.id);
        const kindClass = styles[banner.kind] || styles.info;
        const isExternal = banner.link_url && (banner.link_url.startsWith('http://') || banner.link_url.startsWith('https://'));

        return (
          <aside
            key={banner.id}
            className={`${styles.banner} ${kindClass} ${isExiting ? styles.bannerLeaving : styles.bannerEntering}`}
            role="status"
          >
            <div className={styles.contentRow}>
              <span className={styles.iconWrap} aria-hidden="true">
                {getKindIcon(banner.kind)}
              </span>

              <div className={styles.textWrap}>
                {banner.title && <strong className={styles.title}>{banner.title}:</strong>}
                <span className={styles.body}>{banner.body}</span>

                {banner.link_url && (
                  isExternal ? (
                    <a
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      <span>{banner.link_label || ar.announcements.readMore}</span>
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <Link to={banner.link_url} className={styles.link}>
                      <span>{banner.link_label || ar.announcements.readMore}</span>
                      <ArrowLeft size={14} />
                    </Link>
                  )
                )}
              </div>
            </div>

            {banner.is_dismissible && (
              <button
                type="button"
                onClick={() => handleDismiss(banner.id)}
                className={styles.dismissBtn}
                aria-label={ar.announcements.dismiss}
                title={ar.announcements.dismiss}
              >
                <X size={16} />
              </button>
            )}
          </aside>
        );
      })}
    </div>
  );
}
