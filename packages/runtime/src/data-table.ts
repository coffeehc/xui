/** View facts only. Query, HTTP, cancellation and response ordering stay with the host. */
export type DataTableStatus = 'idle' | 'loading' | 'ready' | 'refreshing' | 'error';
export interface DataTablePagination {
  /** Wire/query index and the endpoint's explicit index offset. No implicit 0/1 conversion. */
  pageIndex: number;
  pageIndexOffset: number;
  pageSize: number;
  /** null means unknown: numbered pagination is unavailable, never inferred from row count. */
  total: number | null;
  pageSizeOptions?: readonly number[];
  onPageChange?: (pageIndex: number) => void;
  /** Host decides/reset pageIndex, confirms data, then publishes the next facts. */
  onPageSizeChange?: (pageSize: number) => void;
}
export interface DataTableCount {rowCount: number; total: number | null}
export interface DataTableLabels {
  loading: string; refreshing: string; idle: string; empty: string; noMatches: string;
  error: string; retry: string; pageSize: string; pagination: string; previous: string; next: string;
  count: (facts: DataTableCount) => string;
}
export const dataTableDefaultLabels: Readonly<DataTableLabels> = Object.freeze({
  loading: 'Loading…', refreshing: 'Refreshing…', idle: 'Ready to load', empty: 'No records yet', noMatches: 'No matching records',
  error: 'Could not load records', retry: 'Retry', pageSize: 'Rows per page', pagination: 'Pagination', previous: 'Previous page', next: 'Next page',
  count: ({rowCount,total}: DataTableCount) => total === null ? `${rowCount} loaded` : `${rowCount} shown · ${total} total`,
});
export interface DataTableViewOptions {
  label: string; status?: DataTableStatus; disabled?: boolean; filtered?: boolean;
  pagination?: DataTablePagination; labels?: Partial<DataTableLabels>; onRetry?: () => void;
}
export function getDataTableState(options: DataTableViewOptions, rowCount: number) {
  if (!options.label?.trim()) throw new TypeError('DataTable needs an accessible label');
  const status = options.status ?? 'ready';
  if (!['idle','loading','ready','refreshing','error'].includes(status)) throw new TypeError('Invalid DataTable status');
  if (!Number.isSafeInteger(rowCount) || rowCount < 0) throw new TypeError('Invalid DataTable row count');
  const pagination = options.pagination;
  let page = 1, pageCount: number | null = null, sizes: readonly number[] = [];
  if (pagination) {
    const {pageIndex,pageIndexOffset,pageSize,total} = pagination;
    if (!Number.isSafeInteger(pageIndexOffset) || pageIndexOffset < 0 || !Number.isSafeInteger(pageIndex) || pageIndex < pageIndexOffset || !Number.isSafeInteger(pageSize) || pageSize < 1 || total !== null && (!Number.isSafeInteger(total) || total < 0)) throw new TypeError('DataTable requires explicit valid page facts');
    page = pageIndex - pageIndexOffset + 1;
    pageCount = total === null ? null : Math.max(1,Math.ceil(total / pageSize));
    if (!Number.isSafeInteger(page)) throw new TypeError('Unsafe DataTable page');
    // A stale/out-of-range query is still visible; do not silently clamp or request another page.
    sizes = pagination.pageSizeOptions ?? [pageSize];
    if (!sizes.length || new Set(sizes).size !== sizes.length || sizes.some(size => !Number.isSafeInteger(size) || size < 1) || !sizes.includes(pageSize)) throw new TypeError('DataTable page sizes must be positive, unique and contain the confirmed size');
  }
  const busy = status === 'loading' || status === 'refreshing';
  const outOfRange = pageCount !== null && page > pageCount;
  return {status,busy,blocked: !!options.disabled || busy,outOfRange,page,pageCount,sizes,total:pagination?.total ?? null,labels:{...dataTableDefaultLabels,...options.labels}};
}
export function validateDataTableKeys<T>(rows: readonly T[], columns: readonly {id: string}[], rowKey: (row: T) => string | number): readonly (string | number)[] {
  if (!columns.length || columns.some(column => !column.id) || new Set(columns.map(column => column.id)).size !== columns.length) throw new TypeError('DataTable columns need unique nonempty ids');
  const keys = rows.map(rowKey);
  if (keys.some(key => typeof key !== 'string' && typeof key !== 'number' || typeof key === 'number' && !Number.isFinite(key)) || new Set(keys.map(String)).size !== keys.length) throw new TypeError('DataTable rows need unique stable keys');
  return keys;
}
/** Prevent same-turn reentrant requests before a controlled host can publish busy. */
export function createDataTableRequestGuard() {
  let locked = false, dead = false;
  return {
    run(blocked: boolean, callback: (() => void) | undefined) {
      if (dead || blocked || locked || !callback) return;
      locked = true;
      try { callback(); } finally { queueMicrotask(() => { locked = false; }); }
    },
    destroy() { dead = true; },
  };
}
