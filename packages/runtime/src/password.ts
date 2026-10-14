import type {PasswordStrengthState} from './password-strength.js';
export {createPasswordStrengthController} from './password-strength.js';
export type {PasswordStrengthState,PasswordStrengthHint,PasswordStrengthControllerOptions} from './password-strength.js';
/** 新设密码使用固定的 Unicode 码点范围，不接受项目配置。 */
export const passwordMinimumCharacters=6;
export const passwordMaximumCharacters=32;
/** 密码校验不以本地强度建议作为拒绝条件。 */
export type NewPasswordError='invalid_unicode'|'invalid_length'|'confirmation_mismatch';
/** 不裁剪、归一化或截断；拒绝 JS 孤立代理项，避免 JSON/UTF-8 替换改变密码。 */
export function countPasswordCodePoints(password:string):number|null{
  let count=0;
  for(const character of password){const code=character.codePointAt(0)!;if(code>=0xd800&&code<=0xdfff)return null;count++;}
  return count;
}
/** 只校验字符有效性与固定长度，不裁剪、归一化或评分。 */
export function validatePassword(password:string):Exclude<NewPasswordError,'confirmation_mismatch'>|null{
  const count=countPasswordCodePoints(password);
  if(count===null)return 'invalid_unicode';
  return count<passwordMinimumCharacters||count>passwordMaximumCharacters?'invalid_length':null;
}
/** 先校验新密码，再按原文逐字符确认；强度评估失败不影响此结果。 */
export function validateNewPassword(password:string,confirmation:string):NewPasswordError|null{
  const error=validatePassword(password);
  if(error)return error;
  if(countPasswordCodePoints(confirmation)===null)return 'invalid_unicode';
  return password===confirmation?null:'confirmation_mismatch';
}
/** 本地文案可翻译，固定校验范围和估算器不由项目配置。 */
export interface NewPasswordLabels {
 password:string;confirmation:string;invalidUnicode:string;confirmationMismatch:string;
 /** Generic fixed-range error when a caller does not provide the actual character count. */
 length:(minimum:number,maximum:number)=>string;
 tooShort?:(minimum:number)=>string;tooLong?:(maximum:number)=>string;
 /** Accessible meter name; no visible heading is added above the strength bar. */
 strengthLabel?:string;
 /** Accessible current state for the meter and its visually hidden live status. */
 strengthSummary?:(state:PasswordStrengthState)=>string;
}
/** Accessible strength text; empty and unavailable estimates never imply a score. */
export function getPasswordStrengthSummary(state:PasswordStrengthState):string {return state.status==='idle'?'等待输入':state.status==='loading'?'评估中':state.status==='unavailable'?'暂不可评估':state.level==='weak'?'弱':state.level==='medium'?'中':'强';}
export const newPasswordLabels:Readonly<NewPasswordLabels>=Object.freeze({strengthLabel:'密码强度',strengthSummary:getPasswordStrengthSummary,password:'新密码',confirmation:'确认密码',invalidUnicode:'密码含无效字符',confirmationMismatch:'两次密码不一致',length:(minimum:number,maximum:number)=>`${minimum}–${maximum}个字符`,tooShort:(minimum:number)=>`至少${minimum}个字符`,tooLong:(maximum:number)=>`最多${maximum}个字符`});
/** 把固定规则的校验结果投影为文案，不重新决定密码是否可接受。 */
export function getNewPasswordErrorMessage(error:NewPasswordError|null,labels:NewPasswordLabels=newPasswordLabels,count?:number|null):string|undefined{
  if(error===null)return undefined;
  if(error==='invalid_unicode')return labels.invalidUnicode;
  if(error==='confirmation_mismatch')return labels.confirmationMismatch;
  if(typeof count==='number'&&count<passwordMinimumCharacters)return (labels.tooShort??newPasswordLabels.tooShort!)(passwordMinimumCharacters);
  if(typeof count==='number'&&count>passwordMaximumCharacters)return (labels.tooLong??newPasswordLabels.tooLong!)(passwordMaximumCharacters);
  return labels.length(passwordMinimumCharacters,passwordMaximumCharacters);
}
