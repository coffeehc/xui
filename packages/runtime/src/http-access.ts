import {buildHttpClient,type HttpClient} from './http-service.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
export function resolveHttpService(state:RegistryState):HttpClient{
    const entry=state.http;if(entry.value)return entry.value;
    const options=optionsFor(entry);if(!options)throw new Error('HTTP service is not configured');
    entry.value=buildHttpClient(options);entry.owned=true;entry.resolvedOptions=options;return entry.value;
  }
export function getHttpService():HttpClient{return resolveHttpService(browserState());}
