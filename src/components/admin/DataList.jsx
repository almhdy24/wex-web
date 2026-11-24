import React, { useRef } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronLeft } from 'lucide-react';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { TableSkeleton } from '../common/Skeleton';
import useMediaQuery from '../../hooks/useMediaQuery';
import styles from './DataList.module.css';

/**
 * DataList
 * Unified responsive data presentation component.
 * - Under 768px: automatically transforms into touch-friendly cards (only cards in DOM).
 * - 768px and up: renders an accessible table with horizontal scroll wrapper and sticky header (only table in DOM).
 */
export default function DataList({
  columns = [],
  data = [],
  keyField = 'id',
  loading = false,
  emptyMessage = 'لا توجد بيانات متاحة',
  emptyAction,
  onRowClick,
  sortKey,
  sortDirection = 'asc',
  onSort,
  pagination,
  mobileCardRender,
  forceView, // 'table' | 'cards' | undefined
}) {
  const containerRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 768px)', true);
  const showTable = forceView ? forceView === 'table' : isDesktop;

  // Normalized pagination contract (supports deprecated currentPage)
  const paginationConfig = pagination
    ? {
        page: pagination.page ?? pagination.currentPage ?? 1,
        totalPages: pagination.totalPages ?? 1,
        totalItems: pagination.totalItems,
        onPageChange: (newPage) => {
          if (pagination.onPageChange) {
            pagination.onPageChange(newPage);
            if (containerRef.current) {
              containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        },
      }
    : null;

  // D6: Initial load shows skeleton; subsequent background loads keep rows visible with progress bar
  if (loading && (!data || data.length === 0)) {
    return (
      <div className={styles.loadingWrapper}>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <EmptyState title={emptyMessage} action={emptyAction} />
      </div>
    );
  }

  // Column taxonomy for mobile card representation
  const selectCol = columns.find((c) => c.isSelect || c.key === 'select');
  const primaryCol = columns.find((c) => c.isPrimary) || columns.find((c) => c !== selectCol) || columns[0];
  const statusCol = columns.find((c) => c.isStatus || c.key === 'status');
  const actionsCol = columns.find((c) => c.isActions || c.key === 'actions');
  const bodyCols = columns.filter(
    (c) =>
      c !== primaryCol &&
      c !== statusCol &&
      c !== actionsCol &&
      c !== selectCol &&
      !c.hideOnMobile &&
      !c.mobileHidden &&
      Boolean(c.label) &&
      (typeof c.label === 'string' ? Boolean(c.label.trim()) : true)
  );

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${loading ? styles.loadingState : ''}`}
    >
      {/* Background loading progress bar */}
      {loading && (
        <div className={styles.progressBarWrapper} aria-hidden="true">
          <div className={styles.progressBar} />
        </div>
      )}

      {/* D3 & D4 & D5: Mobile Card View (< 768px) */}
      {!showTable && (
        <div className={styles.cardsList} role="list" aria-label="قائمة البيانات">
          {data.map((row, index) => {
            const rowKey = row[keyField] ?? index;
            if (mobileCardRender) {
              return (
                <div key={rowKey} role="listitem" className={styles.cardItemWrapper}>
                  <article
                    className={`${styles.cardItem} ${onRowClick ? styles.clickable : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {mobileCardRender(row)}
                  </article>
                </div>
              );
            }

            return (
              <div key={rowKey} role="listitem" className={styles.cardItemWrapper}>
                <article className={styles.cardItem}>
                  {/* Card Header: Select Checkbox + Primary info + Status Badge */}
                  <header className={styles.cardHeader}>
                    <div className={styles.cardHeaderStart}>
                      {selectCol && (
                        <div
                          className={styles.cardSelect}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {selectCol.render ? selectCol.render(row) : row[selectCol.key]}
                        </div>
                      )}
                      <div className={styles.cardPrimary}>
                        {onRowClick ? (
                          <button
                            type="button"
                            className={styles.cardTitleBtn}
                            onClick={() => onRowClick(row)}
                          >
                            {primaryCol?.render ? primaryCol.render(row) : row[primaryCol?.key]}
                          </button>
                        ) : (
                          primaryCol?.render ? primaryCol.render(row) : row[primaryCol?.key]
                        )}
                      </div>
                    </div>
                    {statusCol && (
                      <div className={styles.cardStatus}>
                        {statusCol.render ? statusCol.render(row) : row[statusCol.key]}
                      </div>
                    )}
                  </header>

                  {/* Card Body: Secondary fields (auto-fit responsive grid) */}
                  {bodyCols.length > 0 && (
                    <div className={styles.cardBody}>
                      {bodyCols.map((col) => {
                        const label = col.label;
                        if (!label || (typeof label === 'string' && !label.trim())) {
                          return null;
                        }
                        return (
                          <div key={col.key} className={styles.cardField}>
                            <span className={styles.cardFieldLabel}>{label}:</span>
                            <span className={styles.cardFieldValue}>
                              <bdi>{col.render ? col.render(row) : row[col.key]}</bdi>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* D2: Card Footer: isActions column slot for mobile */}
                  {actionsCol && (
                    <footer className={styles.cardFooter}>
                      {actionsCol.render ? actionsCol.render(row) : row[actionsCol.key]}
                    </footer>
                  )}
                </article>
              </div>
            );
          })}
        </div>
      )}

      {/* D3 & D7: Desktop / Tablet Table View (>= 768px) with horizontal scroll wrapper */}
      {showTable && (
        <div className={styles.tableScrollWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`${styles.th} ${styles[col.align || 'start']} ${col.sortable ? styles.sortable : ''}`}
                      onClick={() => col.sortable && onSort?.(col.key)}
                      scope="col"
                      aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <div className={styles.thContent}>
                        <span>{col.label}</span>
                        {col.sortable && (
                          <span className={styles.sortIcon} aria-hidden="true">
                            {isSorted ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className={styles.sortIdle} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const rowKey = row[keyField] ?? index;
                return (
                  <tr
                    key={rowKey}
                    className={`${styles.tr} ${onRowClick ? styles.clickableRow : ''}`}
                    onClick={() => onRowClick?.(row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${styles.td} ${styles[col.align || 'start']}`}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* D8: Responsive Pagination Bar */}
      {paginationConfig && paginationConfig.totalPages > 1 && (
        <div className={styles.paginationBar}>
          {/* Desktop metadata view */}
          <div className={styles.paginationInfoDesktop}>
            <span>صفحة {paginationConfig.page} من {paginationConfig.totalPages}</span>
            {paginationConfig.totalItems !== undefined && (
              <span className={styles.paginationTotal}>({paginationConfig.totalItems} عنصر)</span>
            )}
          </div>

          {/* Desktop & Mobile controls */}
          <div className={styles.paginationControls}>
            <Button
              variant="outline"
              size="md"
              disabled={paginationConfig.page <= 1}
              onClick={() => paginationConfig.onPageChange(paginationConfig.page - 1)}
              aria-label="الصفحة السابقة"
              className={styles.paginationBtn}
            >
              <ChevronRight size={18} />
              <span>السابق</span>
            </Button>

            {/* Mobile centered counter */}
            <div className={styles.paginationInfoMobile}>
              <span className={styles.mobilePageCounter}>
                {paginationConfig.page} / {paginationConfig.totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="md"
              disabled={paginationConfig.page >= paginationConfig.totalPages}
              onClick={() => paginationConfig.onPageChange(paginationConfig.page + 1)}
              aria-label="الصفحة التالية"
              className={styles.paginationBtn}
            >
              <span>التالي</span>
              <ChevronLeft size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
