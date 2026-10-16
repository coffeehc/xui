/** View facts only. Query, HTTP, cancellation and response ordering stay with the host. */
export type CollectionStatus = 'idle' | 'loading' | 'ready' | 'refreshing' | 'error';
/** Current visible-page facts; rowIndex is zero-based and rowKey is the stable host key. */
export interface CollectionRowContext {rowIndex:number;rowKey:string|number;busy:boolean;disabled:boolean}
/** natural caps content to a bounded parent; workspace fills it; document is unbounded. */
export type CollectionLayout = 'natural' | 'workspace' | 'document';
export interface CollectionPagination {
  mode?: 'offset';
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
/** Controlled cursor facts. The host owns previous-cursor history and response confirmation. */
export interface CollectionCursorPagination {
  mode: 'cursor';
  pageSize: number;
  total: number | null;
  /** Nonempty opaque server cursor, or explicit null at the end. Never inferred from row count. */
  nextCursor: string | null;
  hasPrevious: boolean;
  pageSizeOptions?: readonly number[];
  onNext?: (cursor: string) => void;
  onPrevious?: () => void;
  onPageSizeChange?: (pageSize: number) => void;
}
export interface CollectionCount {rowCount: number; total: number | null}
export interface CollectionLabels {
  loading: string; refreshing: string; idle: string; empty: string; noMatches: string;
  error: string; retry: string; pageSize: string; pagination: string; previous: string; next: string;
  count: (facts: CollectionCount) => string;
}
export const collectionDefaultLabels: Readonly<CollectionLabels> = Object.freeze({
  loading: 'Loading…', refreshing: 'Refreshing…', idle: 'Ready to load', empty: 'No records yet', noMatches: 'No matching records',
  error: 'Could not load records', retry: 'Retry', pageSize: 'Rows per page', pagination: 'Pagination', previous: 'Previous page', next: 'Next page',
  count: ({rowCount,total}: CollectionCount) => total === null ? `${rowCount} loaded` : `${rowCount} shown · ${total} total`,
});
export interface CollectionViewOptions {
  label: string; status?: CollectionStatus; disabled?: boolean; filtered?: boolean;
  /** Host-confirmed data exists, including an empty result. Defaults to true
   * for ready/refreshing or nonempty rows. Pass true for an empty refresh error;
   * scope/identity changes must reset this fact with the host's data. */
  hasValue?: boolean;
  /** Defaults to natural. Explicit workspace preserves the former fill behavior. */
  layout?: CollectionLayout;
  pagination?: CollectionPagination | CollectionCursorPagination; labels?: Partial<CollectionLabels>; onRetry?: () => void;
}
export function getCollectionState(options: CollectionViewOptions, rowCount: number) {
  if (!options.label?.trim()) throw new TypeError('Collection needs an accessible label');
  const status = options.status ?? 'ready';
  const layout = options.layout ?? 'natural';
  if (!['natural','workspace','document'].includes(layout)) throw new TypeError('Invalid Collection layout');
  if (!['idle','loading','ready','refreshing','error'].includes(status)) throw new TypeError('Invalid Collection status');
  if (!Number.isSafeInteger(rowCount) || rowCount < 0) throw new TypeError('Invalid Collection row count');
  const pagination = options.pagination;
  let page = 1, pageCount: number | null = null, sizes: readonly number[] = [];
  if (pagination) {
    const {pageSize,total} = pagination;
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || total !== null && (!Number.isSafeInteger(total) || total < 0)) throw new TypeError('Collection requires explicit valid page facts');
    if (pagination.mode === 'cursor') {
      if (typeof pagination.hasPrevious !== 'boolean' || pagination.nextCursor !== null && (typeof pagination.nextCursor !== 'string' || !pagination.nextCursor.length)) throw new TypeError('Collection requires explicit cursor facts');
    } else {
      const {pageIndex,pageIndexOffset} = pagination;
      if (pagination.mode !== undefined && pagination.mode !== 'offset' || !Number.isSafeInteger(pageIndexOffset) || pageIndexOffset < 0 || !Number.isSafeInteger(pageIndex) || pageIndex < pageIndexOffset) throw new TypeError('Collection requires explicit valid page facts');
      page = pageIndex - pageIndexOffset + 1;
      pageCount = total === null ? null : Math.max(1,Math.ceil(total / pageSize));
      if (!Number.isSafeInteger(page)) throw new TypeError('Unsafe Collection page');
    }
    // A stale/out-of-range query is still visible; do not silently clamp or request another page.
    sizes = pagination.pageSizeOptions ?? [pageSize];
    if (!sizes.length || new Set(sizes).size !== sizes.length || sizes.some(size => !Number.isSafeInteger(size) || size < 1) || !sizes.includes(pageSize)) throw new TypeError('Collection page sizes must be positive, unique and contain the confirmed size');
  }
  if(options.hasValue!==undefined&&typeof options.hasValue!=='boolean')throw new TypeError('Collection hasValue must be a boolean');
  const hasValue=options.hasValue??(rowCount>0||status==='ready'||status==='refreshing');
  const busy = status === 'loading' || status === 'refreshing';
  const outOfRange = pageCount !== null && page > pageCount;
  return {layout,status,hasValue,busy,blocked: !!options.disabled || busy,outOfRange,page,pageCount,sizes,total:pagination?.total ?? null,labels:{...collectionDefaultLabels,...options.labels}};
}
/** Prevent same-turn reentrant requests before a controlled host can publish busy. */
export function createCollectionRequestGuard() {
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

/** Validate React-compatible record identity once per published collection. Numeric
 * and string equivalents collide because React keys use string identity. */
export function validateCollectionKeys<T>(rows:readonly T[],rowKey:(row:T)=>string|number):readonly (string|number)[] {
  const keys=rows.map(rowKey);
  if(keys.some(key=>typeof key!=='string'&&typeof key!=='number'||typeof key==='number'&&!Number.isFinite(key))||new Set(keys.map(String)).size!==keys.length)throw new TypeError('Collection rows need unique stable keys');
  return keys;
}
