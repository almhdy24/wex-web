import React, { useState, useEffect, useRef } from 'react';
import { Filter, X, Search } from 'lucide-react';
import Sheet from '../common/Sheet';
import Button from '../common/Button';
import Input from '../common/Input';
import useMediaQuery from '../../hooks/useMediaQuery';
import { FilterDraftContext } from './FilterDraftContext';
import styles from './FilterBar.module.css';

/**
 * FilterBar
 * Responsive filter container:
 * - Desktop (>= 768px): Displays search input and filter dropdowns in a single live row.
 * - Phone (< 768px): Compact header row [ search (flex:1) ][ filter button 44px + badge ],
 *   with active filter chips displayed underneath, and a bottom Sheet with draft state.
 */
export default function FilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'بحث...',
  filterCount = 0,
  onClearFilters,
  activeChips = [],
  onApply,
  children,
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)', true);
  const [sheetOpen, setSheetOpen] = useState(false);

  // F3: Internal search value with 300ms debounce
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSearchChange = (val) => {
    setLocalSearch(val);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearchChange?.(val);
    }, 300);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearchChange?.('');
  };

  // F2: Draft state for mobile sheet
  const [draftValues, setDraftValues] = useState({});
  const pendingCallbacksRef = useRef({});

  const handleOpenSheet = () => {
    setDraftValues({});
    pendingCallbacksRef.current = {};
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setDraftValues({});
    pendingCallbacksRef.current = {};
    setSheetOpen(false);
  };

  const draftContextValue = {
    values: draftValues,
    setValue: (key, val, callback) => {
      setDraftValues((prev) => ({ ...prev, [key]: val }));
      if (callback) {
        pendingCallbacksRef.current[key] = callback;
      }
    },
  };

  const handleApplyDraft = () => {
    // Commit all pending changes
    Object.values(pendingCallbacksRef.current).forEach((cb) => cb());
    onApply?.(draftValues);
    handleCloseSheet();
  };

  const handleClearInSheet = () => {
    onClearFilters?.();
    handleCloseSheet();
  };

  return (
    <div className={styles.container}>
      {/* ====================================================================
         Desktop Bar (>= 768px) — Renders once, live updates
         ==================================================================== */}
      {isDesktop && (
        <div className={styles.desktopBar}>
          {onSearchChange && (
            <div className={styles.searchWrapper}>
              <Input
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                icon={Search}
              />
              {localSearch && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={handleClearSearch}
                  aria-label="مسح نص البحث"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Desktop Filter Children */}
          <div className={styles.desktopFilters}>{children}</div>

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
      )}

      {/* ====================================================================
         Phone Bar (< 768px) — [ search (flex:1) ][ filter button 44px ]
         ==================================================================== */}
      {!isDesktop && (
        <div className={styles.phoneSection}>
          <div className={styles.phoneBar}>
            {onSearchChange && (
              <div className={styles.phoneSearchWrapper}>
                <Input
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  icon={Search}
                />
                {localSearch && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={handleClearSearch}
                    aria-label="مسح نص البحث"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {children && (
              <button
                type="button"
                className={`${styles.phoneFilterBtn} ${filterCount > 0 ? styles.phoneFilterBtnActive : ''}`}
                onClick={handleOpenSheet}
                aria-label="تصفية النتائج"
              >
                <Filter size={20} />
                {filterCount > 0 && <span className={styles.badge}>{filterCount}</span>}
              </button>
            )}
          </div>

          {/* F4: Active Filter Chips under the phone bar */}
          {activeChips && activeChips.length > 0 && (
            <div className={styles.activeChipsRow} role="region" aria-label="الفلاتر النشطة">
              {activeChips.map((chip) => (
                <span key={chip.id || chip.label} className={styles.activeChip}>
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    className={styles.removeChipBtn}
                    onClick={chip.onRemove}
                    aria-label={`إزالة فلتر ${chip.label}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {onClearFilters && (
                <button
                  type="button"
                  className={styles.clearAllLink}
                  onClick={onClearFilters}
                >
                  مسح الكل
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
         F1 & F2 & F5: Mobile Filter Sheet (< 768px) with Draft State
         ==================================================================== */}
      {!isDesktop && sheetOpen && (
        <Sheet
          isOpen={sheetOpen}
          onClose={handleCloseSheet}
          title="تصفية النتائج"
          footer={
            <div className={styles.sheetStickyFooter}>
              <Button
                variant="primary"
                size="md"
                onClick={handleApplyDraft}
                className={styles.applyBtn}
              >
                تطبيق الفلاتر
              </Button>
              {filterCount > 0 && onClearFilters && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleClearInSheet}
                >
                  مسح الفلاتر
                </Button>
              )}
            </div>
          }
        >
          <FilterDraftContext.Provider value={draftContextValue}>
            <div className={styles.sheetBody}>{children}</div>
          </FilterDraftContext.Provider>
        </Sheet>
      )}
    </div>
  );
}
