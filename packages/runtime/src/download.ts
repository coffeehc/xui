import {HttpError,type HttpClient,type HttpRequestOptions} from './http.js';
export interface DownloadResult {blob:Blob;fileName:string;contentType:string|null;contentLength:string|null;status:number;requestId?:string}
export interface DownloadOptions extends Omit<HttpRequestOptions<Blob>,'response'|'adapter'> {fallbackFileName?:string}
function fileName(value:unknown):string|null{
  if(typeof value!=='string'||value.length>1024)return null;
  const clean=value.replace(/[\\/:*?"<>|\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,'_').trim().replace(/[. ]+$/g,'');
  return !clean||/^\.+$/.test(clean)?null:clean;
}
/** RFC 6266/5987 filename* (UTF-8 only) wins; ambiguous/invalid headers use a safe fallback. */
export function resolveDownloadFileName(disposition:string|null|undefined,fallback='download'):string{
  const safeFallback=fileName(fallback)??'download';if(!disposition||disposition.length>8192)return safeFallback;
  const parameters=new Map<string,string>();let index=disposition.indexOf(';');if(index<0)return safeFallback;
  while(index<disposition.length){index++;while(/\s/.test(disposition[index]??'')&&index<disposition.length)index++;const nameStart=index;while(index<disposition.length&&!/[=;]/.test(disposition[index]))index++;const name=disposition.slice(nameStart,index).trim().toLowerCase();if(disposition[index]!=='=')return safeFallback;index++;let value='';if(disposition[index]==='"'){index++;let closed=false;while(index<disposition.length){const char=disposition[index++];if(char==='"'){closed=true;break;}if(char==='\\'){if(index>=disposition.length)return safeFallback;value+=disposition[index++];}else value+=char;}if(!closed)return safeFallback;while(index<disposition.length&&/\s/.test(disposition[index]))index++;if(index<disposition.length&&disposition[index]!==';')return safeFallback;}else{const start=index;while(index<disposition.length&&disposition[index]!==';')index++;value=disposition.slice(start,index).trim();}if(parameters.has(name))return safeFallback;parameters.set(name,value);}
  const extended=parameters.get('filename*');if(extended!==undefined){const match=/^UTF-8'[^']*'([^']*)$/i.exec(extended);if(match)try{const decoded=fileName(decodeURIComponent(match[1]));if(decoded)return decoded;}catch{/* Try the declared ordinary filename. */}}
  return fileName(parameters.get('filename'))??safeFallback;
}
/** Host calls save explicitly; a completed request alone never triggers a browser download. */
export async function requestDownload(http:HttpClient,path:string,{fallbackFileName,...options}:DownloadOptions={}):Promise<Readonly<DownloadResult>>{
  const response=await http.request<Blob>(path,{...options,response:'blob',timeoutMs:options.timeoutMs??120000,detectAjaxErrors:options.detectAjaxErrors??true});
  if(!(response.payload instanceof Blob))throw new HttpError('parse',{status:response.status,attempts:1,endpointId:options.endpointId});
  return Object.freeze({blob:response.payload,fileName:resolveDownloadFileName(response.headers.contentDisposition,fallbackFileName),contentType:response.headers.contentType,contentLength:response.headers.contentLength,status:response.status,requestId:response.requestId});
}
/** Explicit user action. Temporary URL/node are released; no focus change or credential persistence. */
export function saveDownload(result:Pick<DownloadResult,'blob'|'fileName'>,doc:Document=document):void{
  const win=doc.defaultView;if(!win||!(result.blob instanceof Blob))throw new TypeError('A browser Blob is required');
  const urls=(win as Window&{URL:typeof URL}).URL,url=urls.createObjectURL(result.blob),link=doc.createElement('a');link.href=url;link.download=fileName(result.fileName)??'download';link.hidden=true;
  try{doc.body.append(link);link.click();}finally{link.remove();win.setTimeout(()=>urls.revokeObjectURL(url),0);}
}
