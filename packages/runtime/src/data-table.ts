/** Column track size. Numbers are CSS pixels; percentages resolve against the table
 * body's available width. Omit width to distribute remaining space automatically. */
type DataTableWidthUnit = 'px'|'rem'|'em'|'ch'|'ex'|'cap'|'ic'|'lh'|'rlh'|'vw'|'vh'|'vi'|'vb'|'vmin'|'vmax'|'svw'|'svh'|'lvw'|'lvh'|'dvw'|'dvh'|'cqw'|'cqh'|'cqi'|'cqb'|'cqmin'|'cqmax'|'cm'|'mm'|'Q'|'in'|'pt'|'pc'|'%';
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

/**
 * @internal One geometry owner per rendered DataTable. Only the body's track
 * and this component's own minimum are written. Host heights, column sizing,
 * pagination and full-content document flow stay outside this owner.
 */
export function observeDataTableLayout(frame: HTMLElement, body: HTMLElement, table: HTMLTableElement) {
  const win = table.ownerDocument.defaultView;
  // Non-layout renderers (including server/test DOMs) need no geometry owner.
  if (!win || typeof table.offsetHeight !== 'number' || !frame.parentElement) return {update() {}, destroy() {}};
  const root = frame.parentElement, original = frame.style.gridTemplateRows, originalMinimum = root.style.minBlockSize;
  let dead = false, pending = 0, written: string | undefined, writtenMinimum: string | undefined;
  const watched = new Set<Element>();
  const number = (value: string) => Number.parseFloat(value) || 0;
  const measure = () => {
    if (dead || !table.offsetHeight) return;
    const head = table.tHead, rows = table.tBodies[0]?.rows;
    const style = win.getComputedStyle(body);
    const scrollbar = Math.max(0, body.offsetHeight - body.clientHeight - number(style.borderTopWidth) - number(style.borderBottomWidth));
    const clearance = number(style.scrollPaddingTop) + number(style.scrollPaddingBottom);
    const edgeHeight = Math.max(rows?.[0]?.offsetHeight ?? 0, rows?.[rows.length - 1]?.offsetHeight ?? 0);
    const contentHeight = table.offsetHeight + scrollbar;
    const readableHeight = (head?.offsetHeight ?? 0) + edgeHeight + clearance + scrollbar;
    const minimum = Math.ceil(Math.min(contentHeight, readableHeight));
    if (!Number.isFinite(minimum) || minimum <= 0) return;
    // Read the component's actual chrome, never the allocated frame/body height
    // or a host header. Root/frame are outputs and are not observer targets.
    const frameStyle = win.getComputedStyle(frame);
    const chrome = Array.from(frame.children).reduce((height, node) => height + (node === body ? 0 : (node as HTMLElement).offsetHeight), 0);
    const frameEdges = number(frameStyle.borderTopWidth) + number(frameStyle.borderBottomWidth) + number(frameStyle.paddingTop) + number(frameStyle.paddingBottom);
    const componentMinimum = Math.ceil(chrome + frameEdges + minimum);
    const rootMinimum = root.dataset.layout === 'document' ? originalMinimum : root.dataset.layout === 'workspace' ? `max(var(--data-table-min-block-size), ${componentMinimum}px)` : `${componentMinimum}px`;
    const tracks = `auto minmax(${minimum}px, 1fr) auto`;
    if (frame.style.gridTemplateRows !== tracks) frame.style.gridTemplateRows = tracks;
    if (root.style.minBlockSize !== rootMinimum) root.style.minBlockSize = rootMinimum;
    written = tracks;
    writtenMinimum = rootMinimum;
  };
  const schedule = () => {
    if (!dead && !pending) pending = win.requestAnimationFrame(() => { pending = 0; measure(); });
  };
  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
  const update = () => {
    if (dead) return;
    const rows = table.tBodies[0]?.rows;
    const targets = new Set<Element>([...Array.from(frame.children), table]);
    if (table.tHead) targets.add(table.tHead);
    if (rows?.length) { targets.add(rows[0]); targets.add(rows[rows.length - 1]); }
    for (const node of watched) if (!targets.has(node)) { observer?.unobserve(node); watched.delete(node); }
    for (const node of targets) if (!watched.has(node)) { observer?.observe(node); watched.add(node); }
    schedule();
  };
  win.addEventListener('resize', schedule);
  update();
  return {
    update,
    destroy() {
      if (dead) return;
      dead = true;
      observer?.disconnect();
      watched.clear();
      win.cancelAnimationFrame(pending);
      win.removeEventListener('resize', schedule);
      if (written !== undefined && frame.style.gridTemplateRows === written) frame.style.gridTemplateRows = original;
      if (writtenMinimum !== undefined && root.style.minBlockSize === writtenMinimum) root.style.minBlockSize = originalMinimum;
    },
  };
}
