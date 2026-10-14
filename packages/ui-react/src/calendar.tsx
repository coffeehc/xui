import * as React from 'react';
import {createCalendarModel,type CalendarOptions} from '@coffeehc/xui-runtime/calendar';
import {Button} from './button.js';
import {cx} from './shared.js';
export type CalendarProps=CalendarOptions&{className?:string;label?:string;previousLabel?:string;nextLabel?:string;clearLabel?:string};
export function Calendar({className,label='日期',previousLabel='上个月',nextLabel='下个月',clearLabel='清空日期',...options}:CalendarProps){
 const latest=React.useRef(options);latest.current=options;
 const [model]=React.useState(()=>createCalendarModel({...options,onValueChange:value=>latest.current.onValueChange?.(value),onMonthChange:month=>latest.current.onMonthChange?.(month)}));
 const state=React.useSyncExternalStore(model.subscribe,model.getState,model.getState),root=React.useRef<HTMLDivElement>(null),restoreFocus=React.useRef(false),id=React.useId();
 React.useLayoutEffect(()=>{
  if(root.current?.querySelector('[data-date]:focus'))restoreFocus.current=true;
  model.update({value:options.value,month:options.month,disabled:options.disabled,isDateDisabled:options.isDateDisabled,locale:options.locale,weekStartsOn:options.weekStartsOn});
 },[model,options.value,options.month,options.disabled,options.isDateDisabled,options.locale,options.weekStartsOn]);
 React.useLayoutEffect(()=>{if(restoreFocus.current&&state===model.getState()){restoreFocus.current=false;root.current?.querySelector<HTMLButtonElement>(`[data-date="${state.focus}"]`)?.focus();}},[model,state]);
 const labels=model.getLabels(),days=model.getDays();
 return <div className={cx('xui-calendar',className)} ref={root} aria-label={label}><header className="xui-calendar-header"><Button variant="ghost" aria-label={previousLabel} onClick={()=>model.moveMonth(-1)}>{'‹'}</Button><strong className="xui-strong" id={id} aria-live="polite">{labels.month}</strong><Button variant="ghost" aria-label={nextLabel} onClick={()=>model.moveMonth(1)}>{'›'}</Button></header><div role="grid" aria-labelledby={id} className="xui-calendar-grid"><div role="row" style={{display:'contents'}}>{labels.weekdays.map((weekday,index)=><span key={index} role="columnheader" className="xui-calendar-weekday">{weekday}</span>)}</div>{Array.from({length:6},(_,week)=><div role="row" key={week} style={{display:'contents'}}>{days.slice(week*7,week*7+7).map((day,index)=>day?<button type="button" role="gridcell" key={day.date} className="xui-calendar-day" data-date={day.date} data-endpoint={day.endpoint||undefined} aria-label={day.date} aria-selected={day.selected} aria-disabled={day.disabled||undefined} tabIndex={day.date===state.focus?0:-1} onClick={()=>{if(!day.disabled){restoreFocus.current=true;model.choose(day.date);}}} onKeyDown={event=>{restoreFocus.current=true;if(model.key(day.date,event.key))event.preventDefault();else restoreFocus.current=false;}}>{Number(day.date.slice(-2))}</button>:<span key={index}/>)}</div>)}</div><Button variant="link" disabled={state.disabled} onClick={()=>model.clear()}>{clearLabel}</Button></div>;
}
