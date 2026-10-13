/** Local advisory feedback. No password, matched word or guess trace is retained. */
export type PasswordStrengthHint='common'|'sequence'|'repeat'|'keyboard'|'personal'|'longer'|'none';
export type PasswordStrengthState=Readonly<{status:'idle'|'loading'|'unavailable'}|{status:'ready';score:0|1|2|3|4;level:'weak'|'medium'|'strong';hint:PasswordStrengthHint}>;
export interface PasswordStrengthControllerOptions {readPassword:()=>string|null;onChange:(state:PasswordStrengthState)=>void}
type Estimator=(password:string)=>PasswordStrengthState;
let loading:Promise<Estimator>|undefined;
const load=()=>loading??=import('./password-strength-engine.js').then(module=>module.estimatePasswordStrength).catch(error=>{loading=undefined;throw error;});
/** Internal dependency-injection seam; only the public wrapper is exported from password. */
export function createPasswordStrengthOwner(options:PasswordStrengthControllerOptions,loadEstimator:()=>Promise<Estimator>){
 let read=options.readPassword,notify:typeof options.onChange|undefined=options.onChange,dead=false,generation=0,timer:ReturnType<typeof setTimeout>|undefined,state:PasswordStrengthState=Object.freeze({status:'idle'});
 const publish=(next:PasswordStrengthState)=>{state=Object.freeze(next);notify?.(state);};
 const stop=()=>{generation++;if(timer!==undefined){clearTimeout(timer);timer=undefined;}};
 return Object.freeze({getState:()=>state,clear(){if(dead)return;stop();publish({status:'idle'});},refresh(){
  if(dead)return;stop();const intent=generation,length=read()?.length;if(length===0){publish({status:'idle'});return;}if(length===undefined||length>256){publish({status:'unavailable'});return;}publish({status:'loading'});if(dead||intent!==generation)return;
  timer=setTimeout(async()=>{timer=undefined;if(dead||intent!==generation)return;try{const estimate=await loadEstimator();if(dead||intent!==generation)return;
    // Read only after the module is ready. Never retain a secret across an await.
    const value=read();if(value===''){publish({status:'idle'});return;}if(value===null||value.length>256){publish({status:'unavailable'});return;}
    const result=estimate(value);if(!dead&&intent===generation)publish(result);
   }catch{if(!dead&&intent===generation)publish({status:'unavailable'});}},150);
 },destroy(){if(dead)return;dead=true;stop();read=()=>'';notify=undefined;state=Object.freeze({status:'idle'});}});
}
/** The built-in estimator is fixed, local and advisory; it never authorizes submission. */
export function createPasswordStrengthController(options:PasswordStrengthControllerOptions){return createPasswordStrengthOwner(options,load);}
