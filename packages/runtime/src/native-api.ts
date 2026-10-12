/** Internal DTO checks shared by the native HTTP page adapters. No guessed aliases. */
export function apiObject(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Object.values(Object.getOwnPropertyDescriptors(value)).some(field=>!('value'in field)))throw new TypeError('Invalid page API contract');return value as Record<string,unknown>;}
export function apiString(value:unknown,max=1024):string{if(typeof value!=='string'||!value||value.length>max)throw new TypeError('Invalid page API string');return value;}
export function apiBoolean(value:unknown):boolean{if(typeof value!=='boolean')throw new TypeError('Invalid page API capability');return value;}
export function apiVersion(value:unknown):Record<string,unknown>{const result=apiObject(value);if(result.schema_version!==1)throw new TypeError('Unsupported page API version');return result;}
export function apiSegment(value:unknown):string{const id=apiString(value,256);if(id==='.'||id==='..'||/[\\/%\u0000-\u0020\u007f]/.test(id))throw new TypeError('Invalid page API identifier');return encodeURIComponent(id);}
