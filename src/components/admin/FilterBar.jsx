import React, { useState } from 'react';
import { Filter, X, Search } from 'lucide-react';
import Sheet from '../common/Sheet';
import Button from '../common/Button';
import Input from '../common/Input';
import styles from './FilterBar.module.css';

/**
 * FilterBar
 * Responsive filter container:
 * - On desktop: Displays search input and filter dropdowns in a unified row.
 * - On phone: Shows search input + a filter trigger button with an active filter count badge that opens a bottom Sheet.
 */
export default function FilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'بحث...',
  filterCount = 0,
  onClearFilters,
  children,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className={styles.container}>
      {/* Primary Bar */}
      <div className={styles.bar}>
        {/* Search Input */}
        {onSearchChange && (
          <div className={styles.searchWrapper}>
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              icon={Search}
            />
          </div>
        )}

        {/* Desktop Filter Children */}
        <div className={styles.desktopFilters}>{children}</div>

        {/* Mobile Filter Sheet Trigger Button (< 768px) */}
        {children && (
          <div className={styles.mobileTriggerWrapper}>
            <Button
              variant="outline"
              size="md"
              onClick={() => setSheetOpen(true)}
              aria-label="تصفية النتائج"
            >
              <Filter size={16} />
              <span>تصفية</span>
              {filterCount > 0 && <span className={styles.badge}>{filterCount}</span>}
            </Button>
          </div>
        )}

        {/* Clear Filters Button */}
        {filterCount > 0 && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className={styles.clearBtn}
            aria-label="مسح كافة الفلاتر"
          >
            <X size={14} />
            <span>مسح الفلاتر</span>
          </Button>
        )}
      </div>

      {/* Mobile Filter Sheet */}
      {sheetOpen && (
        <Sheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="تصفية النتائج"
        >
          <div className={styles.sheetBody}>
            {children}
            <div className={styles.sheetActions}>
              <Button
                variant="primary"
                size="md"
                onClick={() => setSheetOpen(false)}
                className={styles.applyBtn}
              >
                تطبيق الفلاتر
              </Button>
              {filterCount > 0 && onClearFilters && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    onClearFilters();
                    setSheetOpen(false);
                  }}
                >
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
