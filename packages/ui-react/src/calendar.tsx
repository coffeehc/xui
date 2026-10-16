import * as React from 'react';
import {createCalendarModel,type CalendarOptions,type CalendarController} from '@coffeehc/xui-runtime/calendar';
import {Button} from './button.js';
import {cx} from './shared.js';
import {useOwnedController,type ControllerProps,assertControllerProps} from './controller.js';
export type {CalendarController,CalendarOptions} from '@coffeehc/xui-runtime/calendar';
type CalendarPresentationProps={className?:string;label?:string;previousLabel?:string;nextLabel?:string;clearLabel?:string};
export type CalendarProps=CalendarPresentationProps&ControllerProps<CalendarController,CalendarOptions>;
export function Calendar(props:CalendarProps){
 const {className,label='日期',previousLabel='上个月',nextLabel='下个月',clearLabel='清空日期'}=props;
 const injected='controller'in props?props.controller:undefined;
 assertControllerProps(injected,props,['mode','value','defaultValue','month','defaultMonth','onMonthChange','locale','weekStartsOn','disabled','isDateDisabled','onValueChange','today']);
 const options=props as CalendarOptions;
 const latest=React.useRef(options);latest.current=options;
 const model=useOwnedController(injected,()=>createCalendarModel({...options,onValueChange:value=>latest.current.onValueChange?.(value),onMonthChange:month=>latest.current.onMonthChange?.(month)}));
 const state=React.useSyncExternalStore(model.subscribe,model.getState,model.getState),root=React.useRef<HTMLDivElement>(null),restoreFocus=React.useRef(false),focusedDay=React.useRef(false),previousMonth=React.useRef(state.month),id=React.useId();
 React.useLayoutEffect(()=>{
  if(injected)return;
  if(root.current?.querySelector('[data-date]:focus'))restoreFocus.current=true;
  model.update({value:options.value,month:options.month,disabled:options.disabled,isDateDisabled:options.isDateDisabled,locale:options.locale,weekStartsOn:options.weekStartsOn});
 },[model,injected,options.value,options.month,options.disabled,options.isDateDisabled,options.locale,options.weekStartsOn]);
 React.useEffect(()=>{const doc=root.current?.ownerDocument;if(!doc)return;const outside=(event:Event)=>{const target=event.target as Element|null;if(!target||!root.current?.contains(target)||event.type==='focusin'&&!target.matches('[data-date]')||event.type==='pointerdown'&&!target.closest('[data-date]'))focusedDay.current=false;};doc.addEventListener('pointerdown',outside,true);doc.addEventListener('focusin',outside,true);return()=>{doc.removeEventListener('pointerdown',outside,true);doc.removeEventListener('focusin',outside,true);};},[]);
 React.useLayoutEffect(()=>{if(previousMonth.current!==state.month){if(focusedDay.current)restoreFocus.current=true;previousMonth.current=state.month;}if(restoreFocus.current&&state===model.getState()){restoreFocus.current=false;root.current?.querySelector<HTMLButtonElement>(`[data-date="${state.focus}"]`)?.focus();}},[model,state]);
 const labels=model.getLabels(),days=model.getDays();
 return <div className={cx('xui-calendar',className)} ref={root} aria-label={label} onFocusCapture={event=>{if((event.target as Element).matches?.('[data-date]'))focusedDay.current=true;}}><header className="xui-calendar-header"><Button variant="ghost" aria-label={previousLabel} onClick={()=>model.moveMonth(-1)}>{'‹'}</Button><strong className="xui-strong" id={id} aria-live="polite">{labels.month}</strong><Button variant="ghost" aria-label={nextLabel} onClick={()=>model.moveMonth(1)}>{'›'}</Button></header><div role="grid" aria-labelledby={id} className="xui-calendar-grid"><div role="row" style={{display:'contents'}}>{labels.weekdays.map((weekday,index)=><span key={index} role="columnheader" className="xui-calendar-weekday">{weekday}</span>)}</div>{Array.from({length:6},(_,week)=><div role="row" key={week} style={{display:'contents'}}>{days.slice(week*7,week*7+7).map((day,index)=>day?<button type="button" role="gridcell" key={day.date} className="xui-calendar-day" data-date={day.date} data-endpoint={day.endpoint||undefined} aria-label={day.date} aria-selected={day.selected} aria-disabled={day.disabled||undefined} tabIndex={day.date===state.focus?0:-1} onClick={()=>{if(!day.disabled){restoreFocus.current=true;model.choose(day.date);}}} onKeyDown={event=>{restoreFocus.current=true;if(model.key(day.date,event.key))event.preventDefault();else restoreFocus.current=false;}}>{Number(day.date.slice(-2))}</button>:<span key={index}/>)}</div>)}</div><Button variant="link" disabled={state.disabled} onClick={()=>model.clear()}>{clearLabel}</Button></div>;
}
