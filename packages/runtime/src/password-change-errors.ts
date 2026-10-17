import type {HttpError} from './http-service.js';
/** Exact official failure codes. An HTTP status alone is not a confirmed refusal. */
export const passwordChangeErrorCodes:Readonly<Record<number,readonly number[]>>=Object.freeze({400:[40001],401:[40101],403:[40301],409:[40901],429:[42901],501:[50101],503:[50300,50301,50302]});
export function isPasswordChangeRejection(error:HttpError):boolean {
 return error.kind==='http'&&!error.metadata.readFailure&&[400,403,429,501].includes(error.status??0)&&error.code===error.status!*100+1;
}
