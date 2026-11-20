import React from 'react';
import { Link } from 'react-router-dom';
import { Info, AlertTriangle, AlertCircle, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import { ar } from '../../content/ar';
import styles from './AnnouncementCard.module.css';

export default function AnnouncementCard({ announcements = [] }) {
  const homeAnnouncements = announcements.filter((a) => a.placement === 'home');

  if (homeAnnouncements.length === 0) {
    return null;
  }

  const getKindIcon = (kind) => {
    switch (kind) {
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'critical':
        return <AlertCircle size={20} />;
      case 'success':
        return <CheckCircle2 size={20} />;
      case 'info':
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className={styles.container} aria-label={ar.announcements.title}>
      {homeAnnouncements.map((announcement) => {
        const kindClass = styles[announcement.kind] || styles.info;
        const isExternal =
          announcement.link_url &&
          (announcement.link_url.startsWith('http://') || announcement.link_url.startsWith('https://'));

        return (
          <article key={announcement.id} className={`${styles.card} ${kindClass}`}>
            <div className={styles.iconBubble} aria-hidden="true">
              {getKindIcon(announcement.kind)}
            </div>

            <div className={styles.content}>
              <div className={styles.headerRow}>
                <h3 className={styles.title}>{announcement.title}</h3>
              </div>

              <p className={styles.body}>{announcement.body}</p>

              {announcement.link_url && (
                isExternal ? (
                  <a
                    href={announcement.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.ctaLink}
                  >
                    <span>{announcement.link_label || ar.announcements.readMore}</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <Link to={announcement.link_url} className={styles.ctaLink}>
                    <span>{announcement.link_label || ar.announcements.readMore}</span>
                    <ArrowLeft size={14} />
                  </Link>
                )
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
