import type {PasswordStrengthState} from './password-strength.js';
/** Basic length/composition feedback only. This is not a guess-resistance or entropy estimate. */
export function estimatePasswordStrength(password:string):PasswordStrengthState {
 if(!password)return Object.freeze({status:'idle'});
 const length=Array.from(password).length;
 if(length<8||/^([\s\S]+)\1+$/u.test(password))return Object.freeze({status:'ready',score:0,level:'weak',hint:length<8?'longer':'repeat'});
 const groups=[/\p{Ll}/u,/\p{Lu}/u,/\p{N}/u,/[^\p{L}\p{N}\s]/u].filter(pattern=>pattern.test(password)).length;
 const score=(1+Number(length>=12)+Number(length>=16)+Number(groups>=3)) as 1|2|3|4;
 const hint=score>=3?'none':'longer';
 return Object.freeze({status:'ready',score,level:score<=1?'weak':score===2?'medium':'strong',hint});
}
