import type {HttpClient} from './http.js';
import {requestDownload,saveDownload,type DownloadOptions,type DownloadResult} from './download.js';
export interface DownloadService {
  request:(path:string,options?:DownloadOptions)=>Promise<Readonly<DownloadResult>>;
  /** Saving is a separate explicit user action, never triggered automatically by a completed request. */
  save:(result:Pick<DownloadResult,'blob'|'fileName'>,document?:Document)=>void;
}
/** Package-private service binding; requests reuse the application's existing HTTP/auth owner. */
export function buildDownloadService(http:HttpClient):DownloadService{return Object.freeze({request:(path:string,options?:DownloadOptions)=>requestDownload(http,path,options),save:saveDownload});}
