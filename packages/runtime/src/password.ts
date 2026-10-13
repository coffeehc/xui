import {createAjaxResponseAdapter,type HttpClient} from './http.js';
import {apiObject} from './native-api.js';

/** 新设密码策略由 baseservice 唯一维护，客户端只消费版本和范围。 */
export interface PasswordPolicy {readonly version:1;readonly minimum_characters:number;readonly maximum_characters:number;readonly counting_unit:'unicode_code_points'}
export type NewPasswordError='policy_unavailable'|'invalid_unicode'|'invalid_length'|'confirmation_mismatch';
export function parsePasswordPolicy(value:unknown):Readonly<PasswordPolicy>{
  const policy=apiObject(value);
  if(policy.version!==1||policy.counting_unit!=='unicode_code_points'||!Number.isSafeInteger(policy.minimum_characters)||!Number.isSafeInteger(policy.maximum_characters)||(policy.minimum_characters as number)<1||(policy.maximum_characters as number)<(policy.minimum_characters as number))throw new TypeError('Unsupported password policy');
  return Object.freeze({version:1,minimum_characters:policy.minimum_characters as number,maximum_characters:policy.maximum_characters as number,counting_unit:'unicode_code_points'});
}
export async function loadPasswordPolicy(http:HttpClient,{signal}:{signal?:AbortSignal}={}):Promise<Readonly<PasswordPolicy>>{
  const ajax=createAjaxResponseAdapter();
  const result=await http.request<Readonly<PasswordPolicy>>('/api/v1/auth/password-policy',{method:'GET',signal,cache:'no-store',redirect:'error',unauthorized:'ignore',endpointId:'auth.passwordPolicy',adapter:(value,context)=>{const result=ajax(value,context);return {...result,payload:parsePasswordPolicy(result.payload)};}});
  return result.payload;
}
/** 不裁剪、归一化或截断；拒绝 JS 孤立代理项，避免 JSON/UTF-8 替换改变密码。 */
export function countPasswordCodePoints(password:string):number|null{
  let count=0;
  for(const character of password){const code=character.codePointAt(0)!;if(code>=0xd800&&code<=0xdfff)return null;count++;}
  return count;
}
export function validateNewPassword(policy:PasswordPolicy|null,password:string,confirmation:string):NewPasswordError|null{
  if(policy===null)return 'policy_unavailable';
  let current:PasswordPolicy;try{current=parsePasswordPolicy(policy);}catch{return 'policy_unavailable';}
  const count=countPasswordCodePoints(password);
  if(count===null||countPasswordCodePoints(confirmation)===null)return 'invalid_unicode';
  if(count<current.minimum_characters||count>current.maximum_characters)return 'invalid_length';
  return password===confirmation?null:'confirmation_mismatch';
}
export interface NewPasswordLabels {password:string;confirmation:string;policyUnavailable:string;invalidUnicode:string;confirmationMismatch:string;length:(minimum:number,maximum:number)=>string}
export const newPasswordLabels:Readonly<NewPasswordLabels>=Object.freeze({password:'新密码',confirmation:'确认密码',policyUnavailable:'密码规则暂不可用，请重试。',invalidUnicode:'密码包含无效的 Unicode 字符。',confirmationMismatch:'两次输入的密码不一致。',length:(minimum:number,maximum:number)=>`密码须为 ${minimum}–${maximum} 个 Unicode 码点，中文和 emoji 按相同规则计数。`});
export function getNewPasswordErrorMessage(error:NewPasswordError|null,policy:PasswordPolicy|null,labels:NewPasswordLabels=newPasswordLabels):string|undefined{
  if(error===null)return undefined;
  if(error==='policy_unavailable'||!policy)return labels.policyUnavailable;
  if(error==='invalid_unicode')return labels.invalidUnicode;
  if(error==='confirmation_mismatch')return labels.confirmationMismatch;
  return labels.length(policy.minimum_characters,policy.maximum_characters);
}
