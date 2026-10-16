import {useOverlay,type OverlayController} from './interaction-hooks.js';
import type {ControllerProps} from './controller.js';
import * as React from 'react';
import {Button} from './button.js';
import {Toolbar} from './layout.js';
import {DisclosureIndicator} from './navigation.js';
import {cx,hasContent as present} from './shared.js';

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
export function SearchToolbar({search,actions,advanced,controller,defaultExpanded,expanded,onExpandedChange,advancedLabel='Advanced options',className,...props}:SearchToolbarProps){
  const model=useOverlay({controller,open:expanded,defaultOpen:defaultExpanded,onOpenChange:onExpandedChange}),open=model.open;
  const hasSearch=present(search),hasActions=present(actions),hasAdvanced=present(advanced),row=React.useRef<HTMLDivElement>(null),panelId=React.useId(),trigger=React.useRef<HTMLButtonElement>(null),panel=React.useRef<HTMLDivElement>(null),focusWithin=React.useRef(false);
  React.useLayoutEffect(()=>{
    if(open&&hasAdvanced)return;
    const body=panel.current,active=body?.ownerDocument.activeElement;
    // hidden may blur first; do not steal focus the host deliberately moved elsewhere.
    if(body&&(body.contains(active??null)||focusWithin.current&&active===body.ownerDocument.body))(trigger.current??Array.from(row.current?.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex]')??[]).find(node=>!node.matches(':disabled,[aria-disabled="true"]')&&node.getClientRects().length>0)??row.current)?.focus();
    focusWithin.current=false;
  },[open,hasAdvanced]);
  return <div role="group" {...props} className={cx('xui-search-toolbar',className)} data-empty={!hasSearch&&!hasActions&&!hasAdvanced}>
    <Toolbar ref={row} tabIndex={-1} className="xui-search-toolbar-row">
      {hasSearch&&<div className="xui-search-toolbar-search">{search}</div>}
      {(hasActions||hasAdvanced)&&<div className="xui-search-toolbar-actions">
        {actions}
        {hasAdvanced&&<Button ref={trigger} variant="outline" aria-expanded={open} aria-controls={panelId} onClick={()=>model.onOpenChange(!open,{reason:'trigger-press'})}>{advancedLabel.trim()?advancedLabel:'Advanced options'}<DisclosureIndicator open={open}/></Button>}
      </div>}
    </Toolbar>
    <div ref={panel} id={panelId} className="xui-search-toolbar-advanced" hidden={!hasAdvanced||!open} inert={!hasAdvanced||!open} onFocusCapture={()=>{focusWithin.current=true;}} onBlurCapture={event=>{if(!event.currentTarget.hidden)focusWithin.current=event.currentTarget.contains(event.relatedTarget);}}>{advanced}</div>
  </div>;
}
