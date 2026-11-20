import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Info, AlertTriangle, AlertCircle, CheckCircle2, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import { ar } from '../../content/ar';
import styles from './AnnouncementToast.module.css';

const LOCAL_STORAGE_KEY = 'wex_dismissed_announcements';
const SESSION_STORAGE_KEY = 'wex_session_shown_announcement_toasts';

function getDismissedIds() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
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
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    }
  } catch {
    // storage unavailable
  }
}

function getSessionShownIds() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessionShownId(id) {
  try {
    const current = getSessionShownIds();
    if (!current.includes(id)) {
      current.push(id);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(current));
    }
  } catch {
    // storage unavailable
  }
}

export default function AnnouncementToast({ announcements: propAnnouncements }) {
  const [currentToast, setCurrentToast] = useState(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const evaluateAndShow = (list) => {
      if (!Array.isArray(list)) return;
      const dismissed = getDismissedIds();
      const sessionShown = getSessionShownIds();

      // Find first toast announcement that was not dismissed in localStorage and not shown in this session
      const candidate = list.find(
        (a) => a.placement === 'toast' && !dismissed.includes(a.id) && !sessionShown.includes(a.id)
      );

      if (candidate && isMounted) {
        saveSessionShownId(candidate.id);
        setCurrentToast(candidate);
      }
    };

    if (propAnnouncements) {
      evaluateAndShow(propAnnouncements);
      return;
    }

    api.get('/announcements')
      .then((res) => {
        if (isMounted && res?.data) {
          evaluateAndShow(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [propAnnouncements]);

  if (!currentToast) {
    return null;
  }

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      saveDismissedId(currentToast.id);
      setCurrentToast(null);
      setIsExiting(false);
    }, 280);
  };

  const getKindIcon = (kind) => {
    switch (kind) {
      case 'warning':
        return <AlertTriangle size={20} className={`${styles.icon} ${styles.warningIcon}`} />;
      case 'critical':
        return <AlertCircle size={20} className={`${styles.icon} ${styles.criticalIcon}`} />;
      case 'success':
        return <CheckCircle2 size={20} className={`${styles.icon} ${styles.successIcon}`} />;
      case 'info':
      default:
        return <Info size={20} className={`${styles.icon} ${styles.infoIcon}`} />;
    }
  };

  const isExternal =
    currentToast.link_url &&
    (currentToast.link_url.startsWith('http://') || currentToast.link_url.startsWith('https://'));
  const kindBorderClass = styles[currentToast.kind] || styles.info;

  return (
    <div className={styles.toastWrapper} role="region" aria-label="تنبيه سريع">
      <div
        className={`${styles.toast} ${kindBorderClass} ${isExiting ? styles.leaving : styles.entering}`}
        role="alert"
      >
        {getKindIcon(currentToast.kind)}

        <div className={styles.content}>
          {currentToast.title && <strong className={styles.title}>{currentToast.title}</strong>}
          <p className={styles.body}>{currentToast.body}</p>

          {currentToast.link_url && (
            isExternal ? (
              <a
                href={currentToast.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                <span>{currentToast.link_label || ar.announcements.readMore}</span>
                <ExternalLink size={13} />
              </a>
            ) : (
              <Link to={currentToast.link_url} className={styles.link}>
                <span>{currentToast.link_label || ar.announcements.readMore}</span>
                <ArrowLeft size={13} />
              </Link>
            )
          )}
        </div>

        {currentToast.is_dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={styles.dismissBtn}
            aria-label={ar.announcements.dismiss}
            title={ar.announcements.dismiss}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
