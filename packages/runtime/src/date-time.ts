import {parseCalendarDate} from './calendar.js';

/** Minute-precision Gregorian wall time YYYY-MM-DDTHH:mm, without offset or zone.
 * Null clears the value. This type never represents an instant. */
export type DateTimeValue=string|null;
/** Validated date-only fields; no Date object or epoch is returned. */
export interface DateTimeParts {date:string;hour:number;minute:number}
/** Local format/required errors only. Business zone, ordering and window bounds belong to the host. */
export type DateTimeError='format'|'required';
/** Shared model options; value is controlled when supplied, defaultValue is initial-only. */
export interface DateTimeOptions {
 value?:DateTimeValue;defaultValue?:DateTimeValue;
 /** Requests a changed valid minute value or null; external updates never notify. */
 onValueChange?:(value:DateTimeValue)=>void;
 disabled?:boolean;readOnly?:boolean;required?:boolean;
 /** Calendar display only; neither locale nor week start changes the wire value. */
 locale?:string;weekStartsOn?:number;
 /** Date-only calendar reference. Omission uses the current UTC day for browsing, never for a value. */
 today?:string;
}
/** Copy is overrideable independently from the Calendar locale. */
export interface DateTimePickerLabels {
 open:string;clear:string;apply:string;cancel:string;title:string;date:string;hour:string;minute:string;
 invalid:string;required:string;externalError:string;
}
/** Shared Chinese defaults; hosts may override copy without changing value semantics. */
export const dateTimeDefaultLabels:Readonly<DateTimePickerLabels>=/*@__PURE__*/Object.freeze({
 open:'选择日期时间',clear:'清空日期时间',apply:'确认',cancel:'取消',title:'选择日期与时间',date:'日期',hour:'小时',minute:'分钟',
 invalid:'请输入有效的日期时间（YYYY-MM-DDTHH:mm）',required:'请选择日期时间',externalError:'请检查字段错误',
});
/** Reject seconds, offsets, Z, timestamps and invalid dates instead of trimming or converting. */
export function parseDateTimeValue(value:DateTimeValue):Readonly<DateTimeParts>|null {
 if(value===null)return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))throw new TypeError('Use YYYY-MM-DDTHH:mm without a time zone');
 const date=value.slice(0,10);parseCalendarDate(date);
 return Object.freeze({date,hour:Number(value.slice(11,13)),minute:Number(value.slice(14,16))});
}
function validateView(options:DateTimeOptions) {
 if(options.today!==undefined)parseCalendarDate(options.today);
 if(options.weekStartsOn!==undefined&&(!Number.isInteger(options.weekStartsOn)||options.weekStartsOn<0||options.weekStartsOn>6))throw new RangeError('weekStartsOn must be 0..6');
 if(options.locale!==undefined)new Intl.DateTimeFormat(options.locale,{timeZone:'UTC'});
}
/** Owns UI drafts and controlled value requests only; no zone conversion, clock subscription or IO. */
export function createDateTimeModel(initial:DateTimeOptions={}) {
 validateView(initial);
 let options={...initial},value=initial.value!==undefined?initial.value:initial.defaultValue??null;
 parseDateTimeValue(value);
 const today=options.today??new Date().toISOString().slice(0,10);
 let draft=value??'',touched=false,open=false,dead=false,intent=0;
 let date:string|null=null,hour=0,minute=0,month=today.slice(0,7);
 const listeners=new Set<()=>void>();
 const resetPicker=()=>{const parts=parseDateTimeValue(value);date=parts?.date??null;hour=parts?.hour??0;minute=parts?.minute??0;month=(parts?.date??options.today??today).slice(0,7);};
 resetPicker();
 const error=():DateTimeError|null=>{
  if(!draft)return options.required?'required':null;
  try{parseDateTimeValue(draft);return null;}catch{return 'format';}
 };
 const snapshot=()=>Object.freeze({value,draft,open,date,hour,minute,month,disabled:!!options.disabled,readOnly:!!options.readOnly,required:!!options.required,invalid:error(),error:touched?error():null});
 let state=snapshot();
 const publish=()=>{if(dead)return;state=snapshot();for(const listener of [...listeners])if(listeners.has(listener))listener();};
 const blocked=()=>dead||!!options.disabled||!!options.readOnly;
 const request=(next:DateTimeValue,close=false)=>{
  if(blocked())return false;
  const changed=next!==value,revision=++intent;
  if(options.value===undefined)value=next;
  draft=value??'';if(close)open=false;resetPicker();publish();
  if(changed&&!dead&&revision===intent)options.onValueChange?.(next);
  return true;
 };
 return {
  getState:()=>state,
  subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
  /** Valid complete input requests a value immediately; incomplete/invalid text stays as draft without a callback. */
  edit(next:string){if(typeof next!=='string')throw new TypeError('Date-time draft must be text');if(blocked())return false;draft=next;if(!next||!error())return request(next||null);publish();return false;},
  /** Marks the draft for field feedback. Never converts malformed input or emits a duplicate request. */
  commit(){if(blocked())return false;touched=true;if(error()){publish();return false;}return request(draft||null);},
  /** Explicit clear remains available for required fields; native validation then reports missing value. */
  clear(){if(blocked())return false;touched=true;return request(null,true);},
  open(){if(blocked()||open)return;resetPicker();open=true;publish();},
  /** Discards only the picker draft; preserves manual text until corrected or reset. */
  close(){if(dead||!open)return;open=false;resetPicker();publish();},
  setDate(next:string|null){if(next!==null)parseCalendarDate(next);if(blocked()||!open)return;date=next;if(next)month=next.slice(0,7);publish();},
  setTime(part:'hour'|'minute',next:number){if((part!=='hour'&&part!=='minute')||!Number.isInteger(next)||next<0||next>(part==='hour'?23:59))throw new RangeError('Use hour 0..23 and minute 0..59');if(blocked()||!open)return;if(part==='hour')hour=next;else minute=next;publish();},
  setMonth(next:string){if(typeof next!=='string'||!/^\d{4}-\d{2}$/.test(next))throw new TypeError('Use YYYY-MM month');parseCalendarDate(next+'-01');if(blocked()||!open||next===month)return;month=next;publish();},
  /** Applies date/hour/minute atomically. An empty picker date cannot be applied. */
  apply(){if(blocked()||!open||!date)return false;touched=true;return request(date+'T'+String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'),true);},
  /** Form reset reconciles drafts to the current confirmed value without a value callback. */
  resetDraft(){if(dead)return;draft=value??'';touched=false;open=false;resetPicker();publish();},
  update(next:Partial<DateTimeOptions>){
   if(dead)return;
   const proposed={...options,...next};validateView(proposed);
   const nextValue=next.value!==undefined?next.value:value;parseDateTimeValue(nextValue);
   const changed=nextValue!==value;
   if(changed){intent++;value=nextValue;draft=value??'';}
   options=proposed;
   if(changed)resetPicker();
   if(options.disabled||options.readOnly){open=false;draft=value??'';touched=false;resetPicker();}
   publish();
  },
  destroy(){if(dead)return;dead=true;intent++;listeners.clear();},
 };
}

/** Public React injection contract for the date/time draft and picker state owner. */
export type DateTimeController=ReturnType<typeof createDateTimeModel>;
