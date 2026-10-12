import {generateDomId} from './dom-id.js';
import {getDataTableState,validateDataTableKeys,createDataTableRequestGuard,type DataTableViewOptions,type DataTableColumnWidth} from './data-table.js';
export type {DataTablePagination,DataTableLabels,DataTableCount,DataTableStatus,DataTableLayout,DataTableViewOptions,DataTableColumnWidth} from './data-table.js';
export type DataTableContent = Node | string | number | null | undefined;
export interface NativeDataTableCellContext {rowIndex:number;rowKey:string|number;busy:boolean;disabled:boolean}
export interface NativeDataTableCellSlot<T> {element:Node;update?:(row:T,context:NativeDataTableCellContext)=>void;destroy?:()=>void}
export interface NativeDataTableColumn<T> {
  id:string; header:DataTableContent; cell:(row:T,context:NativeDataTableCellContext)=>DataTableContent|NativeDataTableCellSlot<T>;
  /** Column track width; numeric values are pixels. Percentages use the table body width. */
  width?:DataTableColumnWidth;
  ariaSort?:'none'|'ascending'|'descending'|'other'; sticky?:'start'|'end';
}
export interface NativeDataTableOptions<T> extends DataTableViewOptions {
  rows:readonly T[]; columns:readonly NativeDataTableColumn<T>[]; rowKey:(row:T)=>string|number;
  rowState?:(row:T)=>{selected?:boolean;expanded?:boolean}; toolbar?:DataTableContent;
  emptyState?:DataTableContent; errorState?:DataTableContent; feedback?:DataTableContent; footer?:DataTableContent;
  striped?:boolean; stickyHeader?:boolean;
}
const owners=new WeakSet<HTMLElement>();
/** Public native Toolbar/Field composition: controls remain the host's nodes. */
export function createDataTableToolbar(doc:Document,children:readonly Node[]=[]) {
  const element=doc.createElement('div');element.className='xui-toolbar xui-data-table-toolbar';element.setAttribute('role','group');element.append(...children);return element;
}
export function createDataTableFilter(doc:Document,options:{label:string;control:HTMLElement;grow?:boolean}) {
  const field=doc.createElement('div'),label=doc.createElement('label');field.className='xui-field xui-data-table-filter';field.dataset.grow=String(!!options.grow);label.className='xui-label';
  const id=options.control.id||generateDomId(doc,'xui-data-table-filter');options.control.id=id;label.htmlFor=id;label.textContent=options.label;field.append(label,options.control);return field;
}
/** Native equivalent of DataTable. No requests, network client or query state is created. */
export function createDataTable<T>(root:HTMLElement,initial:NativeDataTableOptions<T>) {
  getDataTableState(initial,initial.rows.length);validateDataTableKeys(initial.rows,initial.columns,initial.rowKey);
  if(owners.has(root))throw new Error('This root already owns a DataTable');
  const doc=root.ownerDocument,original=Array.from(root.childNodes),attributes=new Map(['class','data-layout','aria-busy','aria-label','role'].map(name=>[name,root.getAttribute(name)]));
  owners.add(root);let dead=false,options=initial;const guard=createDataTableRequestGuard();
  const node=<K extends keyof HTMLElementTagNameMap>(tag:K,className='')=>{const element=doc.createElement(tag);element.className=className;return element;};
  const fragments=new WeakMap<HTMLElement,Node>(),contents=new WeakMap<HTMLElement,DataTableContent>();
  const content=(parent:HTMLElement,value:DataTableContent)=>{
    const previous=contents.get(parent);contents.set(parent,value);
    if(value&&typeof value==='object'&&value.nodeType===11){if(fragments.get(parent)===value)return;fragments.set(parent,value);}else fragments.delete(parent);
    if(value===null||value===undefined){if(parent.childNodes.length)parent.replaceChildren();return;}
    if(typeof value==='string'||typeof value==='number'){if((typeof previous!=='string'&&typeof previous!=='number')||parent.textContent!==String(value))parent.textContent=String(value);return;}
    if(parent.childNodes.length!==1||parent.childNodes[0]!==value)parent.replaceChildren(value);
  };
  const tools=node('div','xui-data-table-tools'),feedback=node('div','xui-data-table-feedback'),frame=node('div','xui-data-table-frame'),body=node('div','xui-table-container xui-data-table-body'),table=node('table','xui-table'),colgroup=node('colgroup'),widthProbes=node('div','xui-data-table-widths'),head=node('thead'),headerRow=node('tr','xui-table-row'),tbody=node('tbody'),footer=node('footer','xui-data-table-footer'),count=node('span','xui-data-table-count'),sizeField=node('label','xui-data-table-page-size'),sizeLabel=node('span'),size=node('select','xui-select'),pagination=node('nav','xui-pagination'),previous=node('button','xui-button'),position=node('span'),next=node('button','xui-button'),extra=node('div','xui-data-table-footer-extra');
  const statusFeedback=node('div'),customFeedback=node('div');feedback.append(statusFeedback,customFeedback);
  const retry=node('button','xui-button'),error=node('div','xui-state xui-state-error'),errorTitle=node('strong','xui-strong');error.setAttribute('role','alert');retry.type='button';retry.dataset.variant='outline';error.append(errorTitle,retry);
  const loading=node('div','xui-state'),spinner=node('span','xui-spinner'),loadingText=node('span');loading.setAttribute('role','status');spinner.setAttribute('aria-hidden','true');loading.append(spinner,loadingText);
  const empty=node('div','xui-state'),emptyTitle=node('strong','xui-strong');empty.append(emptyTitle);
  const placeholderRow=node('tr','xui-table-row'),placeholderCell=node('td');placeholderRow.append(placeholderCell);
  const skeletonRows=Array.from({length:5},()=>{const tr=node('tr','xui-table-row'),td=node('td'),skeleton=node('div','xui-skeleton');skeleton.setAttribute('aria-hidden','true');td.append(skeleton);tr.append(td);return tr;});
  body.tabIndex=0;body.setAttribute('role','region');count.setAttribute('aria-live','polite');position.setAttribute('aria-live','polite');size.dataset.controlSize='default';previous.type=next.type='button';
  head.append(headerRow);table.append(colgroup,head,tbody);widthProbes.setAttribute('aria-hidden','true');body.append(widthProbes,table);sizeField.append(sizeLabel,size);pagination.append(previous,position,next);footer.append(count,sizeField,pagination,extra);frame.append(tools,feedback,body,footer);root.classList.add('xui-data-region','xui-data-table');root.setAttribute('role','region');root.replaceChildren(frame);
  const arrange=(parent:HTMLElement,children:HTMLElement[])=>{children.forEach((child,index)=>{if(parent.children[index]!==child)parent.insertBefore(child,parent.children[index]??null);});for(const child of Array.from(parent.children))if(!children.includes(child as HTMLElement))child.remove();};
  type CellEntry={element:HTMLTableCellElement;column:NativeDataTableColumn<T>;value:DataTableContent;slot?:NativeDataTableCellSlot<T>};
  type RowEntry={element:HTMLTableRowElement;row:T;cells:Map<string,CellEntry>;index:number;blocked:boolean};
  const rows=new Map<string|number,RowEntry>(),headers=new Map<string,HTMLTableCellElement>(),tracks=new Map<string,HTMLTableColElement>(),probes=new Map<string,HTMLDivElement>();
  const win=doc.defaultView!;let widthFrame=0;
  const measureWidths=()=>{
    if(dead)return;
    const widths=options.columns.map(column=>column.width===undefined?null:win.getComputedStyle(probes.get(column.id)!).width);
    widths.forEach((width,index)=>{if(width?.endsWith('px')&&Number.isFinite(parseFloat(width))){const col=tracks.get(options.columns[index].id)!;if(col.style.width!==width)col.style.width=width;}});
  };
  const scheduleWidths=()=>{if(!dead&&!widthFrame)widthFrame=win.requestAnimationFrame(()=>{widthFrame=0;measureWidths();});};
  const widthObserver=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(scheduleWidths);
  win.addEventListener('resize',scheduleWidths);
  const releaseCell=(cell:CellEntry)=>{const slot=cell.slot;cell.slot=undefined;try{slot?.destroy?.();}catch{/* One host cleanup cannot prevent other cells from releasing. */}};
  const dispatch=(action:'previous'|'next'|'size'|'retry',requestedSize?:number)=>{
    if(dead)return;const state=getDataTableState(options,options.rows.length),page=options.pagination;
    let callback:(()=>void)|undefined;
    if(action==='retry')callback=options.onRetry;
    else if(action==='size'&&page&&requestedSize!==page.pageSize&&state.sizes.includes(requestedSize!))callback=page.onPageSizeChange?()=>page.onPageSizeChange!(requestedSize!):undefined;
    else if(page&&state.pageCount!==null&&!state.outOfRange&&action==='previous'&&state.page>1)callback=page.onPageChange?()=>page.onPageChange!(page.pageIndex-1):undefined;
    else if(page&&state.pageCount!==null&&!state.outOfRange&&action==='next'&&state.page<state.pageCount)callback=page.onPageChange?()=>page.onPageChange!(page.pageIndex+1):undefined;
    guard.run(state.blocked,callback);
  };
  previous.onclick=()=>dispatch('previous');next.onclick=()=>dispatch('next');retry.onclick=()=>dispatch('retry');size.onchange=()=>{const requested=Number(size.value);size.value=String(options.pagination?.pageSize??'');dispatch('size',requested);};
  const render=()=>{
    const state=getDataTableState(options,options.rows.length),keys=validateDataTableKeys(options.rows,options.columns,options.rowKey),labels=state.labels,page=options.pagination,hasRows=options.rows.length>0;
    root.dataset.layout=state.layout;root.setAttribute('aria-label',options.label);root.setAttribute('aria-busy',String(state.busy));body.setAttribute('aria-label',options.label+' — '+labels.count({rowCount:options.rows.length,total:state.total}));table.setAttribute('aria-label',options.label);table.dataset.striped=String(!!options.striped);table.dataset.stickyHeader=String(options.stickyHeader!==false);
    const sized=options.columns.filter(column=>column.width!==undefined).length;
    if(sized)body.dataset.columnSizing=table.dataset.columnSizing=sized===options.columns.length?'sized':'mixed';else {delete table.dataset.columnSizing;delete body.dataset.columnSizing;}
    widthProbes.hidden=!sized;
    const probeNodes:HTMLDivElement[]=[];
    const columnNodes=options.columns.map(column=>{
      let col=tracks.get(column.id);if(!col){col=node('col');tracks.set(column.id,col);}
      let probe=probes.get(column.id);if(!probe){probe=node('div');probes.set(column.id,probe);}probeNodes.push(probe);
      const width=column.width===undefined?'':typeof column.width==='number'?String(column.width)+'px':column.width;
      if(probe.style.width!==width){probe.style.width=width;col.style.width=width;}
      return col;
    });
    arrange(colgroup,columnNodes);arrange(widthProbes,probeNodes);
    for(const id of tracks.keys())if(!options.columns.some(column=>column.id===id)){tracks.delete(id);probes.delete(id);}
    widthObserver?.disconnect();if(sized){widthObserver?.observe(widthProbes);for(const probe of probeNodes)widthObserver?.observe(probe);}
    measureWidths();
    content(tools,options.toolbar);tools.hidden=options.toolbar===undefined||options.toolbar===null||options.toolbar==='';
    errorTitle.textContent=labels.error;retry.textContent=labels.retry;retry.hidden=!options.onRetry;retry.disabled=state.blocked;emptyTitle.textContent=options.filtered?labels.noMatches:labels.empty;loadingText.textContent=hasRows?labels.refreshing:labels.loading;
    const hasStatus=hasRows&&(state.busy||state.status==='error'),hasFeedback=options.feedback!==undefined&&options.feedback!==null&&options.feedback!=='';
    content(statusFeedback,hasStatus?(state.status==='error'?options.errorState??error:loading):null);statusFeedback.hidden=!hasStatus;
    content(customFeedback,options.feedback);customFeedback.hidden=!hasFeedback;feedback.hidden=!hasStatus&&!hasFeedback;
    const headerNodes=options.columns.map(column=>{let th=headers.get(column.id);if(!th){th=node('th');th.scope='col';headers.set(column.id,th);}content(th,column.header);if(column.ariaSort)th.setAttribute('aria-sort',column.ariaSort);else th.removeAttribute('aria-sort');if(column.sticky)th.dataset.sticky=column.sticky;else delete th.dataset.sticky;return th;});arrange(headerRow,headerNodes);for(const id of headers.keys())if(!options.columns.some(column=>column.id===id))headers.delete(id);
    const rowNodes:HTMLTableRowElement[]=[];
    options.rows.forEach((row,index)=>{
      const key=keys[index];let entry=rows.get(key);const fresh=!entry;
      if(!entry){entry={element:node('tr','xui-table-row'),row,cells:new Map(),index,blocked:state.blocked};rows.set(key,entry);}
      const selected=options.rowState?.(row);entry.element.dataset.selected=String(!!selected?.selected);entry.element.dataset.expanded=String(!!selected?.expanded);
      const cells=options.columns.map(column=>{
        let cell=entry!.cells.get(column.id);if(!cell){cell={element:node('td'),column,value:null};entry!.cells.set(column.id,cell);}
        const context={rowIndex:index,rowKey:key,busy:state.busy,disabled:state.blocked};
        const changedRenderer=cell.column.cell!==column.cell;
        if(cell.slot?.update&&!changedRenderer)cell.slot.update(row,context);
        else if(fresh||entry!.row!==row||entry!.index!==index||changedRenderer||cell.value===null){
          const focused=cell.element.contains(doc.activeElement)?doc.activeElement as HTMLElement:null;
          const focusables=Array.from(cell.element.querySelectorAll<HTMLElement>('button,a,input,select,textarea,[tabindex]')),focusIndex=focused?focusables.indexOf(focused):-1;
          releaseCell(cell);
          const rendered=column.cell(row,context);
          const slot=rendered&&typeof rendered==='object'&&'element'in rendered?rendered as NativeDataTableCellSlot<T>:undefined;
          if(slot&&(!slot.element||typeof slot.element.nodeType!=='number'))throw new TypeError('DataTable cell slots need a Node');
          cell.slot=slot;const value=slot?slot.element:rendered as DataTableContent;content(cell.element,value);cell.value=value;
          slot?.update?.(row,context);
          if(focused&&!cell.element.contains(focused)){const replacement=Array.from(cell.element.querySelectorAll<HTMLElement>('button,a,input,select,textarea,[tabindex]'))[focusIndex];if(replacement&&!replacement.matches(':disabled'))replacement.focus();else body.focus();}
        }
        cell.column=column;
        if(column.sticky)cell.element.dataset.sticky=column.sticky;else delete cell.element.dataset.sticky;return cell.element;
      });arrange(entry.element,cells);for(const [id,cell]of entry.cells)if(!options.columns.some(column=>column.id===id)){releaseCell(cell);entry.cells.delete(id);}entry.row=row;entry.index=index;entry.blocked=state.blocked;rowNodes.push(entry.element);
    });
    for(const [key,entry]of rows)if(!keys.includes(key)){if(entry.element.contains(doc.activeElement))body.focus();for(const cell of entry.cells.values())releaseCell(cell);rows.delete(key);}
    placeholderCell.colSpan=options.columns.length;
    if(!hasRows){
      if(state.busy){for(const tr of skeletonRows)(tr.firstElementChild as HTMLTableCellElement).colSpan=options.columns.length;content(placeholderCell,loading);rowNodes.push(...skeletonRows,placeholderRow);}
      else {const idle=node('div','xui-state');idle.setAttribute('role','status');idle.textContent=labels.idle;content(placeholderCell,state.status==='error'?options.errorState??error:state.status==='idle'?idle:options.emptyState??empty);rowNodes.push(placeholderRow);}
    }
    arrange(tbody,rowNodes);
    count.textContent=state.status==='loading'&&!hasRows?labels.loading:state.status==='idle'&&!hasRows?labels.idle:state.status==='error'&&!hasRows?labels.error:labels.count({rowCount:options.rows.length,total:state.total});
    sizeField.hidden=!page;sizeLabel.textContent=labels.pageSize;size.setAttribute('aria-label',labels.pageSize);size.disabled=state.blocked||!page?.onPageSizeChange;
    const currentSizes=Array.from(size.children).map(option=>(option as HTMLOptionElement).value).join(',');if(currentSizes!==state.sizes.join(','))size.replaceChildren(...state.sizes.map(value=>{const option=node('option');option.value=String(value);option.textContent=String(value);return option;}));size.value=String(page?.pageSize??'');
    pagination.hidden=!page||state.pageCount===null||state.outOfRange;pagination.setAttribute('aria-label',labels.pagination);previous.textContent=labels.previous;next.textContent=labels.next;position.textContent=state.page+' / '+state.pageCount;previous.disabled=state.blocked||!page?.onPageChange||state.page<=1;next.disabled=state.blocked||!page?.onPageChange||state.pageCount===null||state.page>=state.pageCount;
    content(extra,options.footer);extra.hidden=options.footer===undefined||options.footer===null||options.footer==='';
  };
  const destroy=()=>{if(dead)return;dead=true;guard.destroy();widthObserver?.disconnect();if(widthFrame)win.cancelAnimationFrame(widthFrame);win.removeEventListener('resize',scheduleWidths);for(const entry of rows.values())for(const cell of entry.cells.values())releaseCell(cell);rows.clear();previous.onclick=next.onclick=retry.onclick=size.onchange=null;root.replaceChildren(...original);for(const [name,value]of attributes)if(value===null)root.removeAttribute(name);else root.setAttribute(name,value);owners.delete(root);};
  try{render();}catch(error){destroy();throw error;}
  return {
    update(next:Partial<NativeDataTableOptions<T>>){if(dead)return;const proposed={...options,...next};getDataTableState(proposed,proposed.rows.length);validateDataTableKeys(proposed.rows,proposed.columns,proposed.rowKey);options=proposed;try{render();}catch(error){destroy();throw error;}},
    getBody:()=>body,destroy,
  };
}
