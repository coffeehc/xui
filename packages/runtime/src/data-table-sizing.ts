import type {ObservableController} from './interaction.js';
/** Exact, user-confirmed CSS pixel widths indexed by stable column id. No storage or query owner. */
export type DataTableColumnWidths=Readonly<Record<string,number>>;
/** Optional CSS pixel bounds. Opt-in initial tracks also respect minWidth; maxWidth limits adjustment. */
export interface DataTableColumnResizeOptions {minWidth?:number;maxWidth?:number;label?:string}
export interface DataTableColumnSizingChange {columnId:string|null;reason:'pointer'|'keyboard'|'reset'}
export interface DataTableColumnSizingOptions {
  widths?:DataTableColumnWidths;
  defaultWidths?:DataTableColumnWidths;
  /** One notification on commit/reset; pointer previews and controlled updates do not notify. */
  onWidthsChange?:(widths:DataTableColumnWidths,details:DataTableColumnSizingChange)=>void;
}
export interface DataTableColumnResizeDraft {
  columnId:string;startWidth:number;width:number;minWidth:number;maxWidth:number;
  reason:'pointer'|'keyboard';widths:DataTableColumnWidths;
}
export interface DataTableColumnSizingState {widths:DataTableColumnWidths;resizing:Readonly<DataTableColumnResizeDraft>|null}
export interface DataTableColumnSizingController extends ObservableController<DataTableColumnSizingState> {
  /** Measured live tracks and resolved CSS pixel bounds are supplied by the View. No DOM is retained. */
  begin:(columnId:string,widths:DataTableColumnWidths,bounds:{minWidth:number;maxWidth:number},reason?:'pointer'|'keyboard')=>boolean;
  resizeTo:(width:number)=>void;
  commit:()=>void;
  cancel:()=>void;
  /** Restore the original responsive column layout; controlled callers confirm the empty map. */
  reset:()=>void;
  update:(options:Partial<DataTableColumnSizingOptions>)=>void;
}
function pixel(value:number){if(!Number.isFinite(value)||value<=0)throw new TypeError('Column widths must be finite positive CSS pixels');return value;}
function copy(widths:DataTableColumnWidths):DataTableColumnWidths {
  if(!widths||typeof widths!=='object'||Array.isArray(widths))throw new TypeError('Column widths need an id map');
  return Object.freeze(Object.fromEntries(Object.entries(widths).map(([id,width])=>{if(!id)throw new TypeError('Column ids must be nonempty');return[id,pixel(width)];})));
}
const equal=(a:DataTableColumnWidths,b:DataTableColumnWidths)=>Object.keys(a).length===Object.keys(b).length&&Object.entries(a).every(([id,width])=>Object.hasOwn(b,id)&&b[id]===width);
/** Local sizing only. Controlled widths remain authoritative; a drag is an explicit, cancellable draft. */
export function createDataTableColumnSizingController(initial:DataTableColumnSizingOptions={}):DataTableColumnSizingController {
  let options={...initial},dead=false,revision=0;
  let state:Readonly<DataTableColumnSizingState>=Object.freeze({widths:copy(initial.widths!==undefined?initial.widths:initial.defaultWidths!==undefined?initial.defaultWidths:{}),resizing:null});
  const listeners=new Set<()=>void>();
  const publish=(next:DataTableColumnSizingState)=>{if(dead||state.resizing===next.resizing&&equal(state.widths,next.widths))return;state=Object.freeze(next);for(const listener of [...listeners])if(listeners.has(listener))listener();};
  const cancel=()=>publish({...state,resizing:null});
  const request=(widths:DataTableColumnWidths,details:DataTableColumnSizingChange)=>{
    const before=revision;cancel();if(dead||before!==revision||equal(state.widths,widths))return;
    const stamp=++revision;options.onWidthsChange?.(widths,details);
    // A synchronous host confirmation/reset/destroy takes precedence over this request.
    if(!dead&&revision===stamp&&options.widths===undefined)publish({widths,resizing:null});
  };
  return {
    getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
    destroy(){if(dead)return;dead=true;revision++;if(state.resizing){state=Object.freeze({...state,resizing:null});for(const listener of [...listeners])if(listeners.has(listener))listener();}listeners.clear();},
    begin(columnId,widths,bounds,reason='pointer'){
      if(dead||state.resizing)return false;
      const measured=copy(widths),{minWidth,maxWidth}=bounds;pixel(minWidth);pixel(maxWidth);
      if(!Object.hasOwn(measured,columnId)||maxWidth<minWidth||!['pointer','keyboard'].includes(reason))throw new TypeError('Invalid column resize context');
      const draft=Object.freeze({columnId,startWidth:measured[columnId],width:measured[columnId],minWidth,maxWidth,reason,widths:measured});publish({...state,resizing:draft});return !dead&&state.resizing===draft;
    },
    resizeTo(width){if(dead||!state.resizing)return;if(!Number.isFinite(width))throw new TypeError('Invalid resize width');const draft=state.resizing,next=Math.min(draft.maxWidth,Math.max(draft.minWidth,width));if(next!==draft.width)publish({...state,resizing:Object.freeze({...draft,width:next})});},
    commit(){if(dead||!state.resizing)return;const draft=state.resizing;if(draft.width===draft.startWidth){cancel();return;}request(copy({...draft.widths,[draft.columnId]:draft.width}),{columnId:draft.columnId,reason:draft.reason});},
    cancel,reset(){if(dead)return;request(copy({}),{columnId:null,reason:'reset'});},
    update(next){if(dead)return;const widths=next.widths===undefined?state.widths:copy(next.widths),changed=!equal(state.widths,widths),merged={...options,...next};if(changed||(options.widths===undefined)!==(merged.widths===undefined))revision++;options=merged;publish({widths,resizing:changed?null:state.resizing});},
  };
}
