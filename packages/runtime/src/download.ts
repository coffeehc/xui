export {requestDownload,saveDownload,type DownloadResult,type DownloadOptions} from './download-core.js';
export {resolveDownloadFileName} from './download-file-name.js';
export {getDownloadService} from './download-access.js';
import type {DownloadService as DownloadContract} from './download-service.js';
import {getDownloadService} from './download-access.js';
import {serviceInstance} from './service-resolvers.js';
export type DownloadService=DownloadContract;
/** Shared download reference; file saving remains an explicit user action. */
export const DownloadService:DownloadService=serviceInstance(getDownloadService,['request','save']);
