import {createPasswordInputController,type PasswordInputController,type PasswordInputOptions} from './display.js';
import {estimatePasswordStrength} from './password-strength-engine.js';

/** Advisory feedback. No password, matched word or guess trace is retained. */
export type PasswordStrengthHint='common'|'sequence'|'repeat'|'keyboard'|'personal'|'longer'|'none';
export type PasswordStrengthState=Readonly<{status:'idle'}|{status:'loading'}|{status:'unavailable'}|{status:'ready';score:0|1|2|3|4;level:'weak'|'medium'|'strong';hint:PasswordStrengthHint}>;
/** Optional host API result. Only the bounded score/category enters public state. */
export interface PasswordStrengthEstimate {readonly score:0|1|2|3|4;readonly hint?:PasswordStrengthHint}
/** Explicit opt-in: the host may send this transient secret through its existing HTTP owner.
 * Observe signal and discard the password after the request; never log, cache or persist it.
 * This advisory hook does not authorize submission or replace server password validation.
 */
export type PasswordStrengthEvaluator=(password:string,context:Readonly<{signal:AbortSignal}>)=>PasswordStrengthEstimate|Promise<PasswordStrengthEstimate>;
export interface PasswordStrengthControllerOptions {
 readPassword:()=>string|null;onChange?:(state:PasswordStrengthState)=>void;defaultVisible?:boolean;onVisibleChange?:PasswordInputOptions['onVisibleChange'];
 /** Omitted: small local regex/length feedback, with zero network or dictionary resources. */
 evaluateStrength?:PasswordStrengthEvaluator;
 /** Per evaluation budget after the 150ms debounce, including host IO. Default 15000; integer 1..60000 ms. */
 evaluationTimeoutMs?:number;
}
function validateOptions(options:Partial<PasswordStrengthControllerOptions>){
 if(options.evaluateStrength!==undefined&&typeof options.evaluateStrength!=='function')throw new TypeError('Invalid password strength evaluator');
 const timeout=options.evaluationTimeoutMs;if(timeout!==undefined&&(!Number.isSafeInteger(timeout)||timeout<1||timeout>60000))throw new TypeError('Invalid password strength evaluation timeout');
}
function projectEstimate(value:PasswordStrengthEstimate):PasswordStrengthState {
 if(!value||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError('Invalid password strength result');
 const fields=Object.getOwnPropertyDescriptors(value);
 if(Object.keys(fields).some(key=>!['score','hint'].includes(key)||!('value'in fields[key])))throw new TypeError('Invalid password strength result');
 const score=fields.score?.value,hint=fields.hint?.value;
 if(typeof score!=='number'||!Number.isInteger(score)||score<0||score>4||hint!==undefined&&!['common','sequence','repeat','keyboard','personal','longer','none'].includes(hint))throw new TypeError('Invalid password strength result');
 return Object.freeze({status:'ready',score,level:score<=1?'weak':score===2?'medium':'strong',hint:hint??(score>=3?'none':'longer')});
}

/** Owns the debounce, optional IO lifetime and safe result projection for one input. */
function createPasswordStrengthOwner(options:PasswordStrengthControllerOptions){
 validateOptions(options);
 let current={...options},dead=false,generation=0,timer:ReturnType<typeof setTimeout>|undefined,active:AbortController|undefined,state:PasswordStrengthState=Object.freeze({status:'idle'});
 const publish=(next:PasswordStrengthState)=>{state=Object.freeze(next);current.onChange?.(state);};
 const stop=()=>{generation++;if(timer!==undefined){clearTimeout(timer);timer=undefined;}active?.abort();active=undefined;};
 return Object.freeze({getState:()=>state,update(next:Partial<PasswordStrengthControllerOptions>){
  if(dead)return;validateOptions(next);const changed=('evaluateStrength'in next&&next.evaluateStrength!==current.evaluateStrength)||('evaluationTimeoutMs'in next&&next.evaluationTimeoutMs!==current.evaluationTimeoutMs);current={...current,...next};if(changed){stop();publish({status:'idle'});}
 },clear(){if(dead)return;stop();publish({status:'idle'});},refresh(){
  if(dead)return;stop();const intent=generation,length=current.readPassword()?.length;if(length===0){publish({status:'idle'});return;}if(length===undefined||length>256){publish({status:'unavailable'});return;}publish({status:'loading'});if(dead||intent!==generation)return;
  timer=setTimeout(async()=>{
   timer=undefined;if(dead||intent!==generation)return;
   const run=new AbortController(),custom=current.evaluateStrength;active=run;
   let onAbort:()=>void=()=>{};
   const cancelled=new Promise<never>((_,reject)=>{onAbort=()=>reject(new Error('Password strength evaluation ended'));run.signal.addEventListener('abort',onAbort,{once:true});});
   const deadline=setTimeout(()=>run.abort(),current.evaluationTimeoutMs??15000);
   try{
    // Read at dispatch, never before an asynchronous wait. Only the host hook can send the secret.
    const evaluate=():PasswordStrengthState|Promise<PasswordStrengthState>=>{
     const value=current.readPassword();if(value==='')return {status:'idle'};if(value===null||value.length>256)return {status:'unavailable'};
     return custom?Promise.resolve(custom(value,{signal:run.signal})).then(projectEstimate):estimatePasswordStrength(value);
    };
    const result=await Promise.race([evaluate(),cancelled]);if(!dead&&intent===generation&&!run.signal.aborted)publish(result);
   }catch{if(!dead&&intent===generation)publish({status:'unavailable'});}
   finally{clearTimeout(deadline);run.signal.removeEventListener('abort',onAbort);if(active===run)active=undefined;run.abort();}
  },150);
 },destroy(){if(dead)return;dead=true;stop();current={readPassword:()=>''};state=Object.freeze({status:'idle'});}});
}

export interface PasswordStrengthController {
 getState():PasswordStrengthState;subscribe(listener:()=>void):()=>void;update(next:Partial<PasswordStrengthControllerOptions>):void;
 /** Lease a view's DOM reader. Replacing/releasing a lease invalidates pending evaluation and releases that DOM reference. */
 bindReader(readPassword:()=>string|null):()=>void;
 clear():void;refresh(readPassword?:()=>string|null):void;readonly inputController:PasswordInputController;destroy():void;
}
/** Basic local feedback by default; an explicit host evaluator remains advisory. */
export function createPasswordStrengthController(options:PasswordStrengthControllerOptions):PasswordStrengthController {
 validateOptions(options);
 let dead=false,current={...options},binding:{read:()=>string|null}|undefined;const listeners=new Set<()=>void>();
 let state:PasswordStrengthState=Object.freeze({status:'idle'});
 const inputController=createPasswordInputController({defaultVisible:options.defaultVisible,onVisibleChange:visible=>current.onVisibleChange?.(visible)});
 const read=()=>binding?binding.read():current.readPassword();
 const owner=createPasswordStrengthOwner({...options,readPassword:read,onChange:next=>{state=next;current.onChange?.(next);for(const listener of [...listeners])if(listeners.has(listener))listener();}});
 const controller:PasswordStrengthController={getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
  update(next){if(dead)return;owner.update({...('evaluateStrength'in next?{evaluateStrength:next.evaluateStrength}:{}),...('evaluationTimeoutMs'in next?{evaluationTimeoutMs:next.evaluationTimeoutMs}:{})});current={...current,...next};inputController.update({defaultVisible:current.defaultVisible,onVisibleChange:visible=>current.onVisibleChange?.(visible)});},
  bindReader(readPassword){if(typeof readPassword!=='function')throw new TypeError('Password reader must be a function');if(dead)return()=>{};const lease={read:readPassword};binding=lease;owner.clear();return()=>{if(binding!==lease)return;binding=undefined;owner.clear();};},
  clear(){if(dead)return;try{owner.clear();}finally{inputController.markCleared();}},refresh(readPassword){if(dead)return;if(readPassword)current={...current,readPassword};owner.refresh();},inputController,
  destroy(){if(dead)return;dead=true;binding=undefined;owner.destroy();inputController.destroy();listeners.clear();current={readPassword:()=>''};state=Object.freeze({status:'idle'});}};
 return Object.freeze(controller);
}

export interface NewPasswordFieldsState {readonly error:string|null;readonly tipOpen:boolean;readonly strength:PasswordStrengthState}
export interface NewPasswordFieldsControllerOptions extends PasswordInputOptions,Pick<PasswordStrengthControllerOptions,'evaluateStrength'|'evaluationTimeoutMs'> {onStrengthChange?:(state:PasswordStrengthState)=>void;onErrorChange?:(error:string|null)=>void}
/** Secret-free presentation aggregate for the fixed new-password field composition. */
export interface NewPasswordFieldsController {
 getState():Readonly<NewPasswordFieldsState>;subscribe(listener:()=>void):()=>void;update(next:Partial<NewPasswordFieldsControllerOptions>):void;
 setError(error:string|null):void;setTipOpen(open:boolean):void;clear():void;
 readonly password:PasswordStrengthController;readonly confirmation:PasswordInputController;destroy():void;
}
/** Owns each child once so injected form views never create parallel visibility/error owners. */
export function createNewPasswordFieldsController(options:NewPasswordFieldsControllerOptions={}):NewPasswordFieldsController {
 let current={...options},dead=false,error:string|null=null,tipOpen=false;const listeners=new Set<()=>void>();
 const password=createPasswordStrengthController({evaluateStrength:options.evaluateStrength,evaluationTimeoutMs:options.evaluationTimeoutMs,readPassword:()=>null,defaultVisible:options.defaultVisible,onVisibleChange:options.onVisibleChange,onChange:options.onStrengthChange});
 const confirmation=createPasswordInputController({defaultVisible:options.defaultVisible,onVisibleChange:options.onVisibleChange});
 const snapshot=()=>Object.freeze({error,tipOpen,strength:password.getState()});let state:Readonly<NewPasswordFieldsState>=snapshot();
 const publish=()=>{if(dead)return;state=snapshot();for(const listener of [...listeners])if(listeners.has(listener))try{listener();}catch{/* Observers cannot interrupt sibling password cleanup. */}};
 const unsubStrength=password.subscribe(publish);
 const setError=(next:string|null)=>{if(dead||next===error)return;error=next;publish();current.onErrorChange?.(next);};
 const controller:NewPasswordFieldsController={getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
  update(next){if(dead)return;validateOptions(next);current={...current,...next};password.update({evaluateStrength:current.evaluateStrength,evaluationTimeoutMs:current.evaluationTimeoutMs,defaultVisible:current.defaultVisible,onVisibleChange:current.onVisibleChange,onChange:current.onStrengthChange});confirmation.update({defaultVisible:current.defaultVisible,onVisibleChange:current.onVisibleChange});},
  setError,setTipOpen(next){if(dead||tipOpen===next)return;tipOpen=next;publish();},clear(){if(dead)return;const hadError=error!==null;error=null;tipOpen=false;for(const clear of [()=>password.clear(),()=>confirmation.markCleared()])try{clear();}catch{/* Always attempt both visibility resets. */}publish();try{if(hadError)current.onErrorChange?.(null);}catch{/* Cleanup has already completed. */}},
  password,confirmation,destroy(){if(dead)return;dead=true;unsubStrength();password.destroy();confirmation.destroy();listeners.clear();current={};error=null;tipOpen=false;state=Object.freeze({error:null,tipOpen:false,strength:Object.freeze({status:'idle'})});}};
 return Object.freeze(controller);
}
