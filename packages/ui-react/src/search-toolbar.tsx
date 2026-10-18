import {useOverlay,type OverlayController} from './interaction-hooks.js';
import type {ControllerProps} from './controller.js';
import * as React from 'react';
import {Button} from './button.js';
import {Toolbar} from './layout.js';
import {DisclosureIndicator} from './navigation.js';
import {cx,hasContent as present} from './shared.js';
import {Field,type FieldProps} from './forms.js';

type SearchToolbarSlots=Omit<React.ComponentProps<'div'>,'children'> & {
  search?:React.ReactNode;
  actions?:React.ReactNode;
  advanced?:React.ReactNode;
};
type SearchToolbarStateProps={
  /** Initial state only. Defaults to false. */
  defaultExpanded?:boolean;
  /** Controlled state; requests do not change it until the host supplies a new value. */
  expanded?:boolean;
  onExpandedChange?:(expanded:boolean)=>void;
};
export type SearchToolbarProps=SearchToolbarSlots&{advancedLabel?:string}&ControllerProps<OverlayController,SearchToolbarStateProps>;

/** Responsive placement and one disclosure owner. Query, values and actions stay with the host. */
function SearchToolbarFrame({search,actions,advanced,controller,defaultExpanded,expanded,onExpandedChange,advancedLabel='Advanced options',className,layout='default',...props}:SearchToolbarProps&{layout?:'default'|'query'}){
  const model=useOverlay({controller,open:expanded,defaultOpen:defaultExpanded,onOpenChange:onExpandedChange}),open=model.open;
  const hasSearch=present(search),hasActions=present(actions),hasAdvanced=present(advanced),row=React.useRef<HTMLDivElement>(null),panelId=React.useId(),trigger=React.useRef<HTMLButtonElement>(null),panel=React.useRef<HTMLDivElement>(null),focusWithin=React.useRef(false);
  React.useLayoutEffect(()=>{
    if(open&&hasAdvanced)return;
    const body=panel.current,active=body?.ownerDocument.activeElement;
    // hidden may blur first; do not steal focus the host deliberately moved elsewhere.
    if(body&&(body.contains(active??null)||focusWithin.current&&active===body.ownerDocument.body))(trigger.current??Array.from(row.current?.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex]')??[]).find(node=>!node.matches(':disabled,[aria-disabled="true"]')&&node.getClientRects().length>0)??row.current)?.focus();
    focusWithin.current=false;
  },[open,hasAdvanced]);
  const controls=<>{actions}{hasAdvanced&&<Button ref={trigger} variant="text" aria-expanded={open} aria-controls={panelId} onClick={()=>model.onOpenChange(!open,{reason:'trigger-press'})}>{advancedLabel.trim()?advancedLabel:'Advanced options'}<DisclosureIndicator open={open}/></Button>}</>;
  return <div role="group" {...props} className={cx('xui-search-toolbar',className)} data-layout={layout} data-empty={!hasSearch&&!hasActions&&!hasAdvanced}>
    <Toolbar ref={row} tabIndex={-1} className="xui-search-toolbar-row">
      {hasSearch&&<div className="xui-search-toolbar-search">{search}</div>}
      {(hasActions||hasAdvanced)&&<div className="xui-search-toolbar-actions">
        {layout==='query'?<div className="xui-query-controls">{controls}</div>:controls}
      </div>}
    </Toolbar>
    <div ref={panel} id={panelId} className="xui-search-toolbar-advanced" hidden={!hasAdvanced||!open} inert={!hasAdvanced||!open} onFocusCapture={()=>{focusWithin.current=true;}} onBlurCapture={event=>{if(!event.currentTarget.hidden)focusWithin.current=event.currentTarget.contains(event.relatedTarget);}}>{advanced}</div>
  </div>;
}
export function SearchToolbar(props:SearchToolbarProps){return <SearchToolbarFrame {...props}/>;}

export type QueryFieldWidth='primary'|'compact'|'standard'|'full';
export type QueryFieldProps=FieldProps&{width?:QueryFieldWidth};
/** A normal Field with a semantic query width. Values, validation and inputs stay with the host. */
export function QueryField({width='standard',className,...props}:QueryFieldProps){
  return <Field {...props} data-query-width={width} className={cx('xui-query-field',className)}/>;
}
export type QueryFormProps=Omit<React.ComponentProps<'form'>,'children'> & {
  label:string;
  /** Direct QueryField children (including fragments); editing forms use FormGrid instead. */
  fields:React.ReactNode;
  actions:React.ReactNode;
  advanced?:React.ReactNode;
  advancedLabel?:string;
  /** Host-confirmed applied filters, never inferred from hidden draft controls. */
  summary?:React.ReactNode;
  /** Same disclosure contract/Controller as SearchToolbar; no second open owner. */
  disclosure?:ControllerProps<OverlayController,SearchToolbarStateProps>;
};
/** Named native form + existing toolbar disclosure + shared Surface recipe. No query state or requests. */
export function QueryForm({label,fields,actions,advanced,advancedLabel='Advanced options',summary,disclosure,className,...props}:QueryFormProps){
  if(!label.trim())throw new TypeError('QueryForm needs an accessible label');
  return <form aria-label={label} {...props} className={cx('xui-surface xui-query-form',className)}>
    <SearchToolbarFrame {...disclosure} layout="query" search={present(fields)?<div className="xui-query-fields">{fields}</div>:undefined} actions={actions} advanced={advanced} advancedLabel={advancedLabel}/>
    {present(summary)&&<div className="xui-query-summary">{summary}</div>}
  </form>;
}
