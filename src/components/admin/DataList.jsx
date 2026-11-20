import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronLeft } from 'lucide-react';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { TableSkeleton } from '../common/Skeleton';
import styles from './DataList.module.css';

/**
 * DataList
 * Unified responsive data presentation component.
 * - Under 768px: automatically transforms into touch-friendly cards.
 * - 768px and up: renders an accessible table with sticky header, row hover, and sortable columns.
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
}) {
  if (loading) {
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

  // Find primary and status columns for mobile card fallback
  const primaryCol = columns.find((c) => c.isPrimary) || columns[0];
  const statusCol = columns.find((c) => c.isStatus);
  const bodyCols = columns.filter((c) => c !== primaryCol && c !== statusCol && !c.hideOnMobile);

  return (
    <div className={styles.container}>
      {/* Mobile Card View (< 768px) */}
      <div className={styles.cardsList} role="feed" aria-label="قائمة البيانات">
        {data.map((row, index) => {
          const rowKey = row[keyField] ?? index;
          if (mobileCardRender) {
            return (
              <div key={rowKey} onClick={() => onRowClick?.(row)} className={styles.cardItem}>
                {mobileCardRender(row)}
              </div>
            );
          }

          return (
            <div
              key={rowKey}
              className={`${styles.cardItem} ${onRowClick ? styles.clickable : ''}`}
              onClick={() => onRowClick?.(row)}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {/* Card Header: Primary info + Status Badge */}
              <div className={styles.cardHeader}>
                <div className={styles.cardPrimary}>
                  {primaryCol?.render ? primaryCol.render(row) : row[primaryCol?.key]}
                </div>
                {statusCol && (
                  <div className={styles.cardStatus}>
                    {statusCol.render ? statusCol.render(row) : row[statusCol.key]}
                  </div>
                )}
              </div>

              {/* Card Body: Secondary fields */}
              {bodyCols.length > 0 && (
                <div className={styles.cardBody}>
                  {bodyCols.map((col) => (
                    <div key={col.key} className={styles.cardField}>
                      <span className={styles.cardFieldLabel}>{col.label}:</span>
                      <span className={styles.cardFieldValue}>
                        {col.render ? col.render(row) : row[col.key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop / Tablet Table View (>= 768px) */}
      <div className={styles.tableWrapper}>
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

      {/* Shared Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            <span>صفحة {pagination.page} من {pagination.totalPages}</span>
            {pagination.totalItems !== undefined && (
              <span className={styles.paginationTotal}>({pagination.totalItems} عنصر)</span>
            )}
          </div>

          <div className={styles.paginationControls}>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              aria-label="الصفحة السابقة"
            >
              <ChevronRight size={16} />
              <span>السابق</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              aria-label="الصفحة التالية"
            >
              <span>التالي</span>
              <ChevronLeft size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
