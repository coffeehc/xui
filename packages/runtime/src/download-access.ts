import {registerService} from './service-resolvers.js';
import {buildDownloadService,type DownloadService} from './download-service.js';
import {resolveHttpService} from './http-access.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
export function resolveDownloadService(state:RegistryState):DownloadService{return state.download??=buildDownloadService(resolveHttpService(state));}
export function getDownloadService():DownloadService{return resolveDownloadService(browserState());}

registerService('download',resolveDownloadService);
