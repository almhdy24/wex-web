import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import styles from './StickyActionBar.module.css';

/**
 * StickyActionBar (Admin Shared Primitive)
 * 
 * Clearance & Layering Contract:
 * - Mobile (< 768px): position: fixed, inset-inline: 0, bottom: var(--admin-tabbar-h), z-index: var(--z-sticky-action)
 * - Desktop (>= 768px): position: sticky, bottom: 0 inside content column
 * - Top edge box-shadow, flex-wrap buttons, collapses secondary buttons under 380px.
 */
export default function StickyActionBar({
  primary,
  secondary,
  children,
  className = '',
  ariaLabel = 'شريط إجراءات الحفظ والتعديل',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const secondaryArray = Array.isArray(secondary)
    ? secondary.filter(Boolean)
    : secondary
    ? [secondary]
    : [];

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={`${styles.actionBar} stickyBottomBar ${className}`}
    >
      <div className={styles.inner}>
        {children ? (
          children
        ) : (
          <>
            {/* Desktop / Standard view for secondary items */}
            {secondaryArray.length > 0 && (
              <div className={styles.secondaryDesktop}>
                {secondaryArray.map((item, idx) => (
                  <React.Fragment key={idx}>{item}</React.Fragment>
                ))}
              </div>
            )}

            {/* Compact < 380px collapsed menu for multiple secondary items */}
            {secondaryArray.length > 1 && (
              <div className={styles.secondaryCompact} ref={menuRef}>
                <button
                  type="button"
                  className={styles.moreBtn}
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-expanded={menuOpen}
                  aria-label="المزيد من الإجراءات"
                  title="المزيد من الإجراءات"
                >
                  <MoreHorizontal size={20} />
                </button>

                {menuOpen && (
                  <div className={styles.moreDropdown} role="menu">
                    {secondaryArray.map((item, idx) => (
                      <div
                        key={idx}
                        className={styles.dropdownItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Single secondary item under 380px still renders directly */}
            {secondaryArray.length === 1 && (
              <div className={styles.secondarySingleCompact}>
                {secondaryArray[0]}
              </div>
            )}

            {/* Primary Action Button (Save / Submit / Confirm) */}
            {primary && <div className={styles.primaryBox}>{primary}</div>}
          </>
        )}
      </div>
    </div>
  );
}
