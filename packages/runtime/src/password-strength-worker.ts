import type {PasswordStrengthState} from './password-strength.js';
type Estimator=((password:string)=>Promise<PasswordStrengthState>)&{destroy:()=>void};
import {passwordStrengthWorkerSource} from './password-strength-worker-source.js';
export function createPasswordStrengthEstimator(signal:AbortSignal):Promise<Estimator>{
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(new Error('Local estimator unavailable'));return;}if(!passwordStrengthWorkerSource){reject(new Error('Local estimator unavailable'));return;}const url=URL.createObjectURL(new Blob([passwordStrengthWorkerSource],{type:'text/javascript'}));let worker:Worker;try{worker=new Worker(url);}catch(error){URL.revokeObjectURL(url);reject(error);return;}const pending=new Map<number,{resolve:(state:PasswordStrengthState)=>void;reject:(error:Error)=>void}>();let next=0,dead=false,ready=false;
  const destroy=()=>{if(dead)return;dead=true;URL.revokeObjectURL(url);signal.removeEventListener('abort',destroy);worker.terminate();const error=new Error('Local estimator unavailable');for(const request of pending.values())request.reject(error);pending.clear();if(!ready)reject(error);};
  const estimate=Object.assign((password:string)=>new Promise<PasswordStrengthState>((accept,fail)=>{if(dead){fail(new Error('Local estimator unavailable'));return;}const id=++next;pending.set(id,{resolve:accept,reject:fail});worker.postMessage({id,password});}),{destroy});
  signal.addEventListener('abort',destroy,{once:true});worker.onerror=()=>destroy();worker.onmessage=event=>{const value=event.data;if(value?.failed){destroy();return;}if(value?.ready===true){if(!dead){ready=true;URL.revokeObjectURL(url);resolve(estimate);}return;}const request=pending.get(value?.id);if(!request)return;pending.delete(value.id);request.resolve(value.state);};
 });
}
