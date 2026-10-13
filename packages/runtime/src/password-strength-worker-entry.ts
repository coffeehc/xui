import {estimatePasswordStrength} from './password-strength-engine.js';
const scope=self as unknown as {postMessage:(value:unknown)=>void;onmessage:((event:MessageEvent<{id:number;password:string}>)=>void)|null};
scope.onmessage=event=>{const {id,password}=event.data;if(!Number.isSafeInteger(id)||typeof password!=='string'||password.length>256)return;
 try{scope.postMessage({id,state:estimatePasswordStrength(password)});}catch{scope.postMessage({id,state:{status:'unavailable'}});}};
scope.postMessage({ready:true});
