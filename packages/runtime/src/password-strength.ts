import {createPasswordInputController,type PasswordInputController,type PasswordInputOptions} from './display.js';

/** Local advisory feedback. No password, matched word or guess trace is retained. */
export type PasswordStrengthHint='common'|'sequence'|'repeat'|'keyboard'|'personal'|'longer'|'none';
export type PasswordStrengthState=Readonly<{status:'idle'}|{status:'loading'}|{status:'unavailable'}|{status:'ready';score:0|1|2|3|4;level:'weak'|'medium'|'strong';hint:PasswordStrengthHint}>;
export interface PasswordStrengthControllerOptions {readPassword:()=>string|null;onChange?:(state:PasswordStrengthState)=>void;defaultVisible?:boolean;onVisibleChange?:PasswordInputOptions['onVisibleChange']}
type Estimator=((password:string)=>PasswordStrengthState|Promise<PasswordStrengthState>)&{destroy?:()=>void};

/** Internal dependency-injection seam; only the public wrapper is exported from password. */
export function createPasswordStrengthOwner(options:PasswordStrengthControllerOptions,loadEstimator:()=>Promise<Estimator>){
 let estimator:Estimator|undefined,current={...options},dead=false,generation=0,timer:ReturnType<typeof setTimeout>|undefined,state:PasswordStrengthState=Object.freeze({status:'idle'});
 const publish=(next:PasswordStrengthState)=>{state=Object.freeze(next);current.onChange?.(state);};
 const stop=()=>{generation++;if(timer!==undefined){clearTimeout(timer);timer=undefined;}};
 return Object.freeze({getState:()=>state,update(next:Partial<PasswordStrengthControllerOptions>){if(dead)return;current={...current,...next};},clear(){if(dead)return;stop();publish({status:'idle'});},refresh(){
  if(dead)return;stop();const intent=generation,length=current.readPassword()?.length;if(length===0){publish({status:'idle'});return;}if(length===undefined||length>256){publish({status:'unavailable'});return;}publish({status:'loading'});if(dead||intent!==generation)return;
  timer=setTimeout(async()=>{timer=undefined;if(dead||intent!==generation)return;try{const estimate=await loadEstimator();estimator=estimate;if(dead){estimate.destroy?.();return;}if(intent!==generation)return;
    // Read only after the module is ready. Never retain a secret across an await.
    const evaluate=():PasswordStrengthState|Promise<PasswordStrengthState>=>{const value=current.readPassword();if(value==='')return {status:'idle'};if(value===null||value.length>256)return {status:'unavailable'};return estimate(value);};
    const result=await evaluate();if(!dead&&intent===generation)publish(result);
   }catch{if(!dead&&intent===generation)publish({status:'unavailable'});}},150);
 },destroy(){if(dead)return;dead=true;stop();estimator?.destroy?.();estimator=undefined;current={readPassword:()=>''};state=Object.freeze({status:'idle'});}});
}

export interface PasswordStrengthController {
 getState():PasswordStrengthState;subscribe(listener:()=>void):()=>void;update(next:Partial<PasswordStrengthControllerOptions>):void;
 /** Lease a view's DOM reader. Replacing/releasing a lease invalidates pending evaluation and releases that DOM reference. */
 bindReader(readPassword:()=>string|null):()=>void;
 clear():void;refresh(readPassword?:()=>string|null):void;readonly inputController:PasswordInputController;destroy():void;
}
/** The built-in estimator is fixed, local and advisory; it never authorizes submission. */
export function createPasswordStrengthController(options:PasswordStrengthControllerOptions):PasswordStrengthController {
 let loading:Promise<Estimator>|undefined,dead=false,current={...options},binding:{read:()=>string|null}|undefined;const lifetime=new AbortController(),listeners=new Set<()=>void>();
 let state:PasswordStrengthState=Object.freeze({status:'idle'});
 const inputController=createPasswordInputController({defaultVisible:options.defaultVisible,onVisibleChange:visible=>current.onVisibleChange?.(visible)});
 const read=()=>binding?binding.read():current.readPassword();
 const owner=createPasswordStrengthOwner({readPassword:read,onChange:next=>{state=next;current.onChange?.(next);for(const listener of [...listeners])if(listeners.has(listener))listener();}},()=>loading??=import('./password-strength-worker.js').then(module=>module.createPasswordStrengthEstimator(lifetime.signal)).catch(error=>{loading=undefined;throw error;}));
 const controller:PasswordStrengthController={getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
  update(next){if(dead)return;current={...current,...next};inputController.update({defaultVisible:current.defaultVisible,onVisibleChange:visible=>current.onVisibleChange?.(visible)});},
  bindReader(readPassword){if(typeof readPassword!=='function')throw new TypeError('Password reader must be a function');if(dead)return()=>{};const lease={read:readPassword};binding=lease;owner.clear();return()=>{if(binding!==lease)return;binding=undefined;owner.clear();};},
  clear(){if(dead)return;try{owner.clear();}finally{inputController.markCleared();}},refresh(readPassword){if(dead)return;if(readPassword)current={...current,readPassword};owner.refresh();},inputController,
  destroy(){if(dead)return;dead=true;binding=undefined;lifetime.abort();owner.destroy();inputController.destroy();listeners.clear();current={readPassword:()=>''};state=Object.freeze({status:'idle'});}};
 return Object.freeze(controller);
}

export interface NewPasswordFieldsState {readonly error:string|null;readonly tipOpen:boolean;readonly strength:PasswordStrengthState}
export interface NewPasswordFieldsControllerOptions extends PasswordInputOptions {onStrengthChange?:(state:PasswordStrengthState)=>void;onErrorChange?:(error:string|null)=>void}
/** Secret-free presentation aggregate for the fixed new-password field composition. */
export interface NewPasswordFieldsController {
 getState():Readonly<NewPasswordFieldsState>;subscribe(listener:()=>void):()=>void;update(next:Partial<NewPasswordFieldsControllerOptions>):void;
 setError(error:string|null):void;setTipOpen(open:boolean):void;clear():void;
 readonly password:PasswordStrengthController;readonly confirmation:PasswordInputController;destroy():void;
}
/** Owns each child once so injected form views never create parallel visibility/error owners. */
export function createNewPasswordFieldsController(options:NewPasswordFieldsControllerOptions={}):NewPasswordFieldsController {
 let current={...options},dead=false,error:string|null=null,tipOpen=false;const listeners=new Set<()=>void>();
 const password=createPasswordStrengthController({readPassword:()=>null,defaultVisible:options.defaultVisible,onVisibleChange:options.onVisibleChange,onChange:options.onStrengthChange});
 const confirmation=createPasswordInputController({defaultVisible:options.defaultVisible,onVisibleChange:options.onVisibleChange});
 const snapshot=()=>Object.freeze({error,tipOpen,strength:password.getState()});let state:Readonly<NewPasswordFieldsState>=snapshot();
 const publish=()=>{if(dead)return;state=snapshot();for(const listener of [...listeners])if(listeners.has(listener))try{listener();}catch{/* Observers cannot interrupt sibling password cleanup. */}};
 const unsubStrength=password.subscribe(publish);
 const setError=(next:string|null)=>{if(dead||next===error)return;error=next;publish();current.onErrorChange?.(next);};
 const controller:NewPasswordFieldsController={getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
  update(next){if(dead)return;current={...current,...next};password.update({defaultVisible:current.defaultVisible,onVisibleChange:current.onVisibleChange,onChange:current.onStrengthChange});confirmation.update({defaultVisible:current.defaultVisible,onVisibleChange:current.onVisibleChange});},
  setError,setTipOpen(next){if(dead||tipOpen===next)return;tipOpen=next;publish();},clear(){if(dead)return;const hadError=error!==null;error=null;tipOpen=false;for(const clear of [()=>password.clear(),()=>confirmation.markCleared()])try{clear();}catch{/* Always attempt both visibility resets. */}publish();try{if(hadError)current.onErrorChange?.(null);}catch{/* Cleanup has already completed. */}},
  password,confirmation,destroy(){if(dead)return;dead=true;unsubStrength();password.destroy();confirmation.destroy();listeners.clear();current={};error=null;tipOpen=false;state=Object.freeze({error:null,tipOpen:false,strength:Object.freeze({status:'idle'})});}};
 return Object.freeze(controller);
}
