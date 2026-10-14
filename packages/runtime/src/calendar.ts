/** ISO Gregorian calendar dates. No instants or implicit local/UTC conversions. */
export type CalendarValue=string|null|Readonly<{start:string|null;end:string|null}>;
export interface CalendarOptions {
 mode?:'single'|'range';value?:CalendarValue;defaultValue?:CalendarValue;
 /** Controlled viewed month (YYYY-MM, years 0001..9999), independent of value. */
 month?:string;
 /** Initial viewed month only; ignored by subsequent updates. */
 defaultMonth?:string;
 /** User navigation request; external month updates never notify. Browsing does not select a date. */
 onMonthChange?:(month:string)=>void;
 locale?:string;weekStartsOn?:number;disabled?:boolean;isDateDisabled?:(date:string)=>boolean;onValueChange?:(value:CalendarValue)=>void;today?:string;
}
export function parseCalendarDate(value:string):Date {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new TypeError('Use YYYY-MM-DD dates');
 const [year,month,day]=value.split('-').map(Number),date=new Date(0);date.setUTCFullYear(year,month-1,day);date.setUTCHours(12,0,0,0);
 if(year<1||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw new TypeError('Invalid calendar date');return date;
}
const encode=(date:Date)=>{const year=date.getUTCFullYear();if(year<1||year>9999)throw new RangeError('Calendar date out of range');return `${String(year).padStart(4,'0')}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;};
export function shiftCalendarDate(value:string,days:number):string {if(!Number.isSafeInteger(days))throw new TypeError('Day delta must be an integer');const date=parseCalendarDate(value);date.setUTCDate(date.getUTCDate()+days);return encode(date);}
function validValue(value:CalendarValue,range:boolean):CalendarValue {if(!range){if(value!==null)parseCalendarDate(value as string);return value;}if(!value||typeof value!=='object'||!('start'in value)||!('end'in value))throw new TypeError('Range requires start and end');if(value.start!==null)parseCalendarDate(value.start);if(value.end!==null)parseCalendarDate(value.end);if(value.end&&(!value.start||value.end<value.start))throw new TypeError('Range end precedes start');return Object.freeze({start:value.start,end:value.end});}
const sameValue=(left:CalendarValue,right:CalendarValue)=>left===right||!!left&&!!right&&typeof left==='object'&&typeof right==='object'&&left.start===right.start&&left.end===right.end;
export function createCalendarModel(initial:CalendarOptions={}) {
 let options={...initial},dead=false,intent=0,monthIntent=0;const range=options.mode==='range';let selected=validValue(options.value!==undefined?options.value:options.defaultValue??(range?{start:null,end:null}:null),range);
 const today=options.today??new Date().toISOString().slice(0,10);parseCalendarDate(today);let focus=typeof selected==='string'?selected:selected&&typeof selected==='object'?selected.start??today:today;
 let month=options.month??options.defaultMonth??focus.slice(0,7),pendingFocus:string|undefined;const listeners=new Set<()=>void>();
 const emit=()=>{for(const fn of [...listeners])if(listeners.has(fn))fn();};
 const validateMonth=(value:string)=>{if(typeof value!=='string'||!/^\d{4}-\d{2}$/.test(value))throw new TypeError('Use YYYY-MM month');return parseCalendarDate(value+'-01');};
 const first=()=>validateMonth(month);first();if(!focus.startsWith(month))focus=month+'-01';
 const request=(value:CalendarValue)=>{if(dead||options.disabled)return;const revision=++intent;if(options.value===undefined)selected=value;sync();if(!dead&&revision===intent)options.onValueChange?.(value);};
 const disabled=(date:string)=>!!options.disabled||!!options.isDateDisabled?.(date);
 const selectedDay=(date:string)=>typeof selected==='string'?date===selected:selected&&typeof selected==='object'?!!selected.start&&date>=selected.start&&date<=(selected.end??selected.start):false;
 const getState=()=>Object.freeze({value:selected,month,focus,disabled:!!options.disabled});let state=getState();
 const sync=()=>{if(dead)return;state=getState();emit();};
 // A denied controlled navigation must never leave the roving tab stop off-grid.
 const visible=(date:string)=>{const week=options.weekStartsOn??1,offset=(first().getUTCDay()-week+7)%7,distance=(parseCalendarDate(date).getTime()-first().getTime())/86400000;return distance>=-offset&&distance<42-offset;};
 const view=(target:string,nextFocus:string)=>{
  const changed=target!==month,revision=++monthIntent;
  pendingFocus=changed?nextFocus:undefined;
  if(options.month===undefined)month=target;
  if(visible(nextFocus))focus=nextFocus;
  return {changed,revision,target};
 };
 const notifyMonth=(change:ReturnType<typeof view>)=>{if(change.changed&&!dead&&change.revision===monthIntent)options.onMonthChange?.(change.target);};
 const api={getState:()=>state,subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},
  getDays(){const week=options.weekStartsOn??1;if(!Number.isInteger(week)||week<0||week>6)throw new RangeError('weekStartsOn must be 0..6');const start=first(),offset=(start.getUTCDay()-week+7)%7;return Array.from({length:42},(_,i)=>{let date:string;try{date=shiftCalendarDate(month+'-01',i-offset);}catch{return null;}return {date,inMonth:date.startsWith(month),disabled:disabled(date),selected:!!selectedDay(date),endpoint:typeof selected==='string'?date===selected:selected&&typeof selected==='object'?date===selected.start||date===selected.end:false};});},
  getLabels(){const locale=options.locale??'zh-CN',formatter=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'UTC'}),weekday=new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'});return {month:formatter.format(first()),weekdays:Array.from({length:7},(_,i)=>weekday.format(parseCalendarDate(shiftCalendarDate('2024-01-07',(options.weekStartsOn??1)+i))))};},
  choose(date:string){
   parseCalendarDate(date);if(dead||disabled(date))return;
   const previous=selected as Exclude<CalendarValue,string|null>;
   const value=range?(!previous.start||previous.end?Object.freeze({start:date,end:null}):Object.freeze({start:date<previous.start?date:previous.start,end:date<previous.start?previous.start:date})):date;
   const revision=++intent,change=view(date.slice(0,7),date);
   if(options.value===undefined)selected=value;
   sync();notifyMonth(change);
   if(!dead&&revision===intent)options.onValueChange?.(value);
  },
  clear(){request(range?Object.freeze({start:null,end:null}):null);},
  /** Request an absolute viewed month. Same-month requests are no-ops; does not change value. */
  setMonth(target:string){validateMonth(target);if(dead||target===month)return;const change=view(target,target+'-01');sync();notifyMonth(change);},
  moveMonth(delta:number){if(!Number.isSafeInteger(delta)||Math.abs(delta)>120000)throw new TypeError('Month delta must be a bounded integer');if(dead)return;const date=first();date.setUTCMonth(date.getUTCMonth()+delta);let target:string;try{target=encode(date).slice(0,7);}catch{return;}api.setMonth(target);},
  key(date:string,key:string){let next:string|undefined;try{if(key==='ArrowLeft')next=shiftCalendarDate(date,-1);if(key==='ArrowRight')next=shiftCalendarDate(date,1);if(key==='ArrowUp')next=shiftCalendarDate(date,-7);if(key==='ArrowDown')next=shiftCalendarDate(date,7);if(key==='Home')next=shiftCalendarDate(date,-((parseCalendarDate(date).getUTCDay()-(options.weekStartsOn??1)+7)%7));if(key==='End')next=shiftCalendarDate(date,6-((parseCalendarDate(date).getUTCDay()-(options.weekStartsOn??1)+7)%7));if(key==='PageUp'||key==='PageDown'){const d=parseCalendarDate(date),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+(key==='PageUp'?-1:1));const targetMonth=d.getUTCMonth();d.setUTCDate(day);if(d.getUTCMonth()!==targetMonth)d.setUTCDate(0);next=encode(d);}}catch{return false;}if(next&&!dead){const change=view(next.slice(0,7),next);sync();notifyMonth(change);return true;}return false;},
  update(next:Partial<CalendarOptions>){
   if(dead)return;if(next.mode!==undefined&&next.mode!==(options.mode??'single'))throw new TypeError('Calendar mode is stable');
   const nextValue=next.value!==undefined?validValue(next.value,range):selected;
   if(next.month!==undefined)validateMonth(next.month);
   // A full controlled view confirmation can include the unchanged date value.
   // Only a newer selection fact supersedes a pending selection notification.
   if(next.value!==undefined&&!sameValue(nextValue,selected))intent++;
   options={...options,...next};selected=nextValue;
   if(next.month!==undefined&&next.month!==month){
    month=next.month;focus=pendingFocus?.startsWith(month)?pendingFocus:month+'-01';pendingFocus=undefined;monthIntent++;
   }
   if(!visible(focus))focus=month+'-01';sync();
  },destroy(){intent++;monthIntent++;dead=true;listeners.clear();}
 };return api;
}
