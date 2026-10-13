/** NumberInput is for approximate finite JS numbers, not exact money or opaque IDs. */
export interface NumberInputConstraints { min?:number; max?:number; step?:number }
export type NumberDraftResult={valid:true;value:number|null}|{valid:false;error:string};
export function validateNumberConstraints({min,max,step=1}:NumberInputConstraints):void {if([min,max,step].some(value=>value!==undefined&&!Number.isFinite(value))||step<=0||min!==undefined&&max!==undefined&&min>max)throw new TypeError('NumberInput requires finite ordered bounds and a positive step');}
export function parseNumberDraft(draft:string,constraints:NumberInputConstraints={}):NumberDraftResult {
 validateNumberConstraints(constraints);if(!draft.trim())return {valid:true,value:null};
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(draft.trim()))return {valid:false,error:'Enter a valid number.'};
 const value=Number(draft);if(!Number.isFinite(value)||Math.abs(value)>Number.MAX_SAFE_INTEGER)return {valid:false,error:'Number is outside the supported safe range.'};
 const {min,max,step=1}=constraints;if(min!==undefined&&value<min)return {valid:false,error:`Minimum is ${min}.`};if(max!==undefined&&value>max)return {valid:false,error:`Maximum is ${max}.`};
 const steps=(value-(min??0))/step;if(!Number.isFinite(steps)||!Number.isSafeInteger(Math.round(steps)))return {valid:false,error:'Step precision is outside the supported safe range.'};if(Math.abs(steps-Math.round(steps))>Math.min(1e-7,Number.EPSILON*Math.max(1,Math.abs(steps))*8))return {valid:false,error:`Use increments of ${step}.`};
 return {valid:true,value};
}
export function stepNumber(value:number|null,direction:1|-1,constraints:NumberInputConstraints={}):number|null {
 validateNumberConstraints(constraints);validateNumberValue(value);if(direction!==1&&direction!==-1)throw new TypeError('Step direction must be 1 or -1');const {min,max,step=1}=constraints,base=min??0,current=value??base,position=(current-base)/step,nearest=Math.round(position),aligned=Math.abs(position-nearest)<=Math.min(1e-7,Number.EPSILON*Math.max(1,Math.abs(position))*8),index=aligned?nearest+direction:direction>0?Math.ceil(position):Math.floor(position);
 let next=value===null?(min??(max!==undefined&&max<0?Math.floor(max/step)*step:0)):base+index*step;
 if(min!==undefined)next=Math.max(min,next);if(max!==undefined&&next>max)next=base+Math.floor((max-base)/step)*step;
 // Use integer-scaled decimal steps only while every operation is safe; never truncate a
 // representable value to a fixed number of significant digits or claim arbitrary precision.
 const places=(value:number)=>{const [coefficient,exponent='0']=String(value).split('e');return Math.max(0,(coefficient.split('.')[1]?.length??0)-Number(exponent));};
 const scale=10**Math.max(places(base),places(step)),scaledBase=Math.round(base*scale),scaledStep=Math.round(step*scale),scaledNext=scaledBase+Math.round((next-base)/step)*scaledStep;
 if(Number.isSafeInteger(scaledBase)&&Number.isSafeInteger(scaledStep)&&Number.isSafeInteger(scaledNext)&&scaledStep>0)next=scaledNext/scale;return parseNumberDraft(String(next),constraints).valid?next:value;
}
export function validateNumberValue(value:number|null):void {if(value!==null&&(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>Number.MAX_SAFE_INTEGER))throw new TypeError('NumberInput value must be null or a finite safe JS number');}
