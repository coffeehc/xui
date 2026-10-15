type DataTableWidthUnit = 'px'|'rem'|'em'|'ch'|'ex'|'cap'|'ic'|'lh'|'rlh'|'vw'|'vh'|'vi'|'vb'|'vmin'|'vmax'|'svw'|'svh'|'lvw'|'lvh'|'dvw'|'dvh'|'cqw'|'cqh'|'cqi'|'cqb'|'cqmin'|'cqmax'|'cm'|'mm'|'Q'|'in'|'pt'|'pc'|'%';
/** Optional column minimum. Numbers are CSS pixels; percentages resolve against
 * the body width. Unconfigured columns receive spare width first; if all columns
 * are configured, the browser distributes spare width among them. */
export type DataTableColumnWidth = number | `${number}${DataTableWidthUnit}` | `calc(${string})` | `clamp(${string})` | `min(${string})` | `max(${string})` | `var(--${string})`;
const columnLength = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:px|rem|em|ch|ex|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|cm|mm|Q|in|pt|pc|%)$/;
function validateColumnWidth(width: DataTableColumnWidth | undefined) {
  if (width === undefined) return;
  if (typeof width === 'number' && Number.isFinite(width) && width >= 0) return;
  if (typeof width === 'string') {
    let valid=columnLength.test(width)&&Number.isFinite(parseFloat(width));
    if (/^(?:(?:calc|clamp|min|max)\(.+|var\(--[\w-]+.*)\)$/.test(width) && !/[;{}\\]|\/\*|\*\//.test(width)) {
      let depth=0,balanced=true;
      for(let index=0;index<width.length;index++) {
        if(width[index]==='(')depth++;
        else if(width[index]===')'&&(--depth<0||depth===0&&index!==width.length-1))balanced=false;
      }
      valid=balanced&&depth===0;
    }
    // Native CSS parsing validates math syntax in a browser. SSR checks the value
    // shape only; it does not emulate CSS grammar or resolve custom properties.
    if(valid&&(typeof CSS==='undefined'||CSS.supports('width',width)))return;
  }
  throw new TypeError('DataTable width must be a finite nonnegative pixel number or a valid CSS length, percentage, math expression or custom property');
}

/** View facts only. Query, HTTP, cancellation and response ordering stay with the host. */
export type DataTableStatus = 'idle' | 'loading' | 'ready' | 'refreshing' | 'error';
/** Current visible-page facts; rowIndex is zero-based and rowKey is the stable host key. */
export interface DataTableRowContext {rowIndex:number;rowKey:string|number;busy:boolean;disabled:boolean}
/** natural caps content to a bounded parent; workspace fills it; document is unbounded. */
export type DataTableLayout = 'natural' | 'workspace' | 'document';
export interface DataTablePagination {
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
export interface DataTableCursorPagination {
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
  /** Defaults to natural. Explicit workspace preserves the former fill behavior. */
  layout?: DataTableLayout;
  pagination?: DataTablePagination | DataTableCursorPagination; labels?: Partial<DataTableLabels>; onRetry?: () => void;
}
export function getDataTableState(options: DataTableViewOptions, rowCount: number) {
  if (!options.label?.trim()) throw new TypeError('DataTable needs an accessible label');
  const status = options.status ?? 'ready';
  const layout = options.layout ?? 'natural';
  if (!['natural','workspace','document'].includes(layout)) throw new TypeError('Invalid DataTable layout');
  if (!['idle','loading','ready','refreshing','error'].includes(status)) throw new TypeError('Invalid DataTable status');
  if (!Number.isSafeInteger(rowCount) || rowCount < 0) throw new TypeError('Invalid DataTable row count');
  const pagination = options.pagination;
  let page = 1, pageCount: number | null = null, sizes: readonly number[] = [];
  if (pagination) {
    const {pageSize,total} = pagination;
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || total !== null && (!Number.isSafeInteger(total) || total < 0)) throw new TypeError('DataTable requires explicit valid page facts');
    if (pagination.mode === 'cursor') {
      if (typeof pagination.hasPrevious !== 'boolean' || pagination.nextCursor !== null && (typeof pagination.nextCursor !== 'string' || !pagination.nextCursor.length)) throw new TypeError('DataTable requires explicit cursor facts');
    } else {
      const {pageIndex,pageIndexOffset} = pagination;
      if (pagination.mode !== undefined && pagination.mode !== 'offset' || !Number.isSafeInteger(pageIndexOffset) || pageIndexOffset < 0 || !Number.isSafeInteger(pageIndex) || pageIndex < pageIndexOffset) throw new TypeError('DataTable requires explicit valid page facts');
      page = pageIndex - pageIndexOffset + 1;
      pageCount = total === null ? null : Math.max(1,Math.ceil(total / pageSize));
      if (!Number.isSafeInteger(page)) throw new TypeError('Unsafe DataTable page');
    }
    // A stale/out-of-range query is still visible; do not silently clamp or request another page.
    sizes = pagination.pageSizeOptions ?? [pageSize];
    if (!sizes.length || new Set(sizes).size !== sizes.length || sizes.some(size => !Number.isSafeInteger(size) || size < 1) || !sizes.includes(pageSize)) throw new TypeError('DataTable page sizes must be positive, unique and contain the confirmed size');
  }
  const busy = status === 'loading' || status === 'refreshing';
  const outOfRange = pageCount !== null && page > pageCount;
  return {layout,status,busy,blocked: !!options.disabled || busy,outOfRange,page,pageCount,sizes,total:pagination?.total ?? null,labels:{...dataTableDefaultLabels,...options.labels}};
}
export function validateDataTableKeys<T>(rows: readonly T[], columns: readonly {id: string; width?: DataTableColumnWidth}[], rowKey: (row: T) => string | number): readonly (string | number)[] {
  if (!columns.length || columns.some(column => !column.id) || new Set(columns.map(column => column.id)).size !== columns.length) throw new TypeError('DataTable columns need unique nonempty ids');
  for (const column of columns) validateColumnWidth(column.width);
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
