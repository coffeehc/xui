import {HttpError,type HttpClient,type HttpRequestOptions} from './http.js';
export interface DownloadResult {blob:Blob;fileName:string;contentType:string|null;contentLength:string|null;status:number;requestId?:string}
export interface DownloadOptions extends Omit<HttpRequestOptions<Blob>,'response'|'adapter'> {fallbackFileName?:string}
import {normalizeDownloadFileName as fileName,resolveDownloadFileName} from './download-file-name.js';
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
