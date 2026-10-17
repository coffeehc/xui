import type {DataTableColumnResizeOptions} from './data-table-sizing.js';
import {validateCollectionKeys} from './collection-view.js';
export {
  getCollectionState as getDataTableState,
  createCollectionRequestGuard as createDataTableRequestGuard,
  collectionDefaultLabels as dataTableDefaultLabels,
  type CollectionStatus as DataTableStatus,
  type CollectionRowContext as DataTableRowContext,
  type CollectionLayout as DataTableLayout,
  type CollectionPagination as DataTablePagination,
  type CollectionCursorPagination as DataTableCursorPagination,
  type CollectionCount as DataTableCount,
  type CollectionLabels as DataTableLabels,
  type CollectionViewOptions as DataTableViewOptions,
} from './collection-view.js';
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

export function validateDataTableKeys<T>(rows: readonly T[], columns: readonly {id: string; width?: DataTableColumnWidth;resize?:DataTableColumnResizeOptions|false}[], rowKey: (row: T) => string | number): readonly (string | number)[] {
  if (!columns.length || columns.some(column => !column.id) || new Set(columns.map(column => column.id)).size !== columns.length) throw new TypeError('DataTable columns need unique nonempty ids');
  for (const column of columns) {
    validateColumnWidth(column.width);
    if(column.resize&&([column.resize.minWidth,column.resize.maxWidth].some(width=>width!==undefined&&(!Number.isFinite(width)||width<=0))||column.resize.minWidth!==undefined&&column.resize.maxWidth!==undefined&&column.resize.minWidth>column.resize.maxWidth))throw new TypeError('Invalid column resize bounds');
  }
  return validateCollectionKeys(rows,rowKey);
}

export {createDataTableColumnSizingController,type DataTableColumnWidths,type DataTableColumnResizeOptions,type DataTableColumnSizingOptions,type DataTableColumnSizingChange,type DataTableColumnResizeDraft,type DataTableColumnSizingState,type DataTableColumnSizingController} from './data-table-sizing.js';
