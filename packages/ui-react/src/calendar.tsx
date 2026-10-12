import * as React from 'react';
import {createCalendarModel,type CalendarOptions} from '@coffeehc/xui-runtime/calendar';
import {Button} from './button.js';
import {cx} from './shared.js';
export type CalendarProps=CalendarOptions&{className?:string;label?:string;previousLabel?:string;nextLabel?:string;clearLabel?:string};
export function Calendar({className,label='日期',previousLabel='上个月',nextLabel='下个月',clearLabel='清空日期',...options}:CalendarProps){
 const latest=React.useRef(options);latest.current=options;
 const [model]=React.useState(()=>createCalendarModel({...options,onValueChange:value=>latest.current.onValueChange?.(value)}));
 const state=React.useSyncExternalStore(model.subscribe,model.getState,model.getState),root=React.useRef<HTMLDivElement>(null),id=React.useId();
 React.useLayoutEffect(()=>model.update({value:options.value,disabled:options.disabled,isDateDisabled:options.isDateDisabled,locale:options.locale,weekStartsOn:options.weekStartsOn,month:options.month}),[model,options.value,options.disabled,options.isDateDisabled,options.locale,options.weekStartsOn,options.month]);
 const labels=model.getLabels(),days=model.getDays();
 return <div className={cx('xui-calendar',className)} ref={root} aria-label={label}><header className="xui-calendar-header"><Button variant="ghost" aria-label={previousLabel} onClick={()=>model.moveMonth(-1)}>{'‹'}</Button><strong id={id} aria-live="polite">{labels.month}</strong><Button variant="ghost" aria-label={nextLabel} onClick={()=>model.moveMonth(1)}>{'›'}</Button></header><div role="grid" aria-labelledby={id} className="xui-calendar-grid">{labels.weekdays.map((weekday,index)=><span key={index} role="columnheader" className="xui-calendar-weekday">{weekday}</span>)}{Array.from({length:6},(_,week)=><div role="row" key={week} style={{display:'contents'}}>{days.slice(week*7,week*7+7).map((day,index)=>day?<button type="button" role="gridcell" key={day.date} className="xui-calendar-day" data-date={day.date} data-endpoint={day.endpoint||undefined} aria-label={day.date} aria-selected={day.selected} aria-disabled={day.disabled||undefined} tabIndex={day.date===state.focus?0:-1} onClick={()=>model.choose(day.date)} onKeyDown={event=>{if(model.key(day.date,event.key)){event.preventDefault();queueMicrotask(()=>root.current?.querySelector<HTMLButtonElement>(`[data-date="${model.getState().focus}"]`)?.focus());}}}>{Number(day.date.slice(-2))}</button>:<span key={index}/>)}</div>)}</div><Button variant="link" disabled={state.disabled} onClick={()=>model.clear()}>{clearLabel}</Button></div>;
}
