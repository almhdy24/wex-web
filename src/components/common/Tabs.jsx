import React, { useRef, useEffect } from 'react';
import styles from './Tabs.module.css';

/**
 * Accessible Segmented Tabs Primitive
 * - role="tablist" with aria-label
 * - role="tab" with aria-selected, aria-controls, roving tabindex
 * - Arrow navigation mirrored for RTL (ArrowLeft = next, ArrowRight = previous)
 * - Auto-scrolls selected tab into view
 *
 * @param {Array<{ id: string, label: string, icon?: React.ComponentType, count?: number }>} tabs
 * @param {string} activeTab
 * @param {(id: string) => void} onChange
 * @param {string} ariaLabel
 * @param {'pill' | 'segment' | 'line'} variant
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  ariaLabel,
  variant = 'segment',
  className = '',
}) {
  const tablistRef = useRef(null);
  const activeTabRef = useRef(null);

  // Auto-scroll active tab into view for horizontally scrollable tablists
  useEffect(() => {
    if (activeTabRef.current && tablistRef.current && typeof activeTabRef.current.scrollIntoView === 'function') {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  const handleKeyDown = (e, index) => {
    if (!tabs || tabs.length <= 1) return;

    let targetIndex = null;
    // In RTL: ArrowLeft = next (forward), ArrowRight = previous (backward)
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      targetIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = tabs.length - 1;
    }

    if (targetIndex !== null) {
      const nextTab = tabs[targetIndex];
      onChange(nextTab.id);
      // Focus target element
      const buttons = tablistRef.current?.querySelectorAll('[role="tab"]');
      if (buttons && buttons[targetIndex]) {
        buttons[targetIndex].focus();
      }
    }
  };

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`${styles.tablist} ${styles[variant] || styles.segment} ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isSelected = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={isSelected ? activeTabRef : null}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isSelected}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isSelected ? 0 : -1}
            type="button"
            className={`${styles.tab} ${isSelected ? styles.selected : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            {Icon && <Icon size={18} strokeWidth={1.75} className={styles.tabIcon} aria-hidden="true" />}
            <span className={styles.tabLabel}>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={styles.tabCount} aria-hidden="true">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
