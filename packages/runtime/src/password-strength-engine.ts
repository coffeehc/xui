import {ZxcvbnFactory} from '@zxcvbn-ts/core';
import {dictionary as common,adjacencyGraphs} from '@zxcvbn-ts/language-common';
import {dictionary as english} from '@zxcvbn-ts/language-en';
import type {PasswordStrengthState,PasswordStrengthHint} from './password-strength.js';
const dictionary={...common,...english};
/** Project only score and a fixed feedback category; discard raw result/sequence/password. */
export function estimatePasswordStrength(password:string):PasswordStrengthState {
 // Factory scoring retains its last password/sequence. Never keep a factory beyond one check.
 const result=new ZxcvbnFactory({dictionary,graphs:adjacencyGraphs}).check(password),score=result.score;
 const warning=result.feedback.warning;let hint:PasswordStrengthHint='longer';
 if(score>=3)hint='none';
 else if(['topTen','topHundred','common','similarToCommon','wordByItself'].includes(warning??''))hint='common';
 else if(['simpleRepeat','extendedRepeat'].includes(warning??''))hint='repeat';
 else if(warning==='sequences')hint='sequence';
 else if(['straightRow','keyPattern'].includes(warning??''))hint='keyboard';
 else if(['dates','recentYears','namesByThemselves','commonNames','userInputs'].includes(warning??''))hint='personal';
 return Object.freeze({status:'ready',score,level:score<=1?'weak':score===2?'medium':'strong',hint});
}
