import type {PasswordStrengthState} from './password-strength.js';
export {createPasswordStrengthController} from './password-strength.js';
export type {PasswordStrengthState,PasswordStrengthHint,PasswordStrengthControllerOptions} from './password-strength.js';
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
export const passwordPolicyEndpoint='/api/v1/auth/password-policy';
export async function loadPasswordPolicy(http:HttpClient,{signal}:{signal?:AbortSignal}={}):Promise<Readonly<PasswordPolicy>>{
  const ajax=createAjaxResponseAdapter();
  const result=await http.request<Readonly<PasswordPolicy>>(passwordPolicyEndpoint,{method:'GET',signal,credentials:'omit',cache:'no-store',redirect:'error',unauthorized:'ignore',endpointId:'auth.passwordPolicy',adapter:(value,context)=>{const result=ajax(value,context);return {...result,payload:parsePasswordPolicy(result.payload)};}});
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
export interface NewPasswordLabels {password:string;confirmation:string;policyUnavailable:string;invalidUnicode:string;confirmationMismatch:string;length:(minimum:number,maximum:number)=>string;count?:(count:number|null)=>string;tooShort?:(minimum:number)=>string;tooLong?:(maximum:number)=>string;strength?:(state:PasswordStrengthState)=>string}
export function getPasswordStrengthMessage(state:PasswordStrengthState):string {
 if(state.status==='idle')return '';if(state.status==='loading')return '正在评估密码强度…';if(state.status==='unavailable')return '暂时无法评估密码强度，不影响提交。';if(state.status!=='ready')return '';
 const hint={common:'建议避开常见密码或常用单词。',sequence:'建议避开连续的字母或数字。',repeat:'建议避开重复的字符或片段。',keyboard:'建议避开连续的键盘按键。',personal:'建议避开姓名、生日等容易猜到的信息。',longer:'建议增加长度，使用不容易猜到的内容。',none:''}[state.hint];
 return `密码强度：${{weak:'弱',medium:'中',strong:'强'}[state.level]}，仅供参考。${hint}`;
}
export const newPasswordLabels:Readonly<NewPasswordLabels>=Object.freeze({strength:getPasswordStrengthMessage,password:'新密码',confirmation:'确认密码',policyUnavailable:'密码规则暂不可用，请重试。',invalidUnicode:'密码包含无法识别的字符，请重新输入。',confirmationMismatch:'两次输入的密码不一致。',length:(minimum:number,maximum:number)=>`密码长度为 ${minimum}–${maximum} 个字符，可使用大小写字母、数字及 _、+、# 等符号。`,count:(count:number|null)=>count===null?'字符无法识别，请重新输入。':`已输入${count}个字符`,tooShort:(minimum:number)=>`密码太短，至少需要${minimum}个字符。`,tooLong:(maximum:number)=>`密码太长，最多可输入${maximum}个字符。`});
export function getNewPasswordErrorMessage(error:NewPasswordError|null,policy:PasswordPolicy|null,labels:NewPasswordLabels=newPasswordLabels,count?:number|null):string|undefined{
  if(error===null)return undefined;
  if(error==='policy_unavailable'||!policy)return labels.policyUnavailable;
  if(error==='invalid_unicode')return labels.invalidUnicode;
  if(error==='confirmation_mismatch')return labels.confirmationMismatch;
  if(typeof count==='number'&&count<policy.minimum_characters)return (labels.tooShort??newPasswordLabels.tooShort!)(policy.minimum_characters);
  if(typeof count==='number'&&count>policy.maximum_characters)return (labels.tooLong??newPasswordLabels.tooLong!)(policy.maximum_characters);
  return labels.length(policy.minimum_characters,policy.maximum_characters);
}
