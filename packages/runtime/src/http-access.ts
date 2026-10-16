import {registerService,resolveService} from './service-resolvers.js';
import {buildHttpClient,HttpError,type HttpClient} from './http-service.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
import {inspectHttp} from './http-auth-internal.js';
export function resolveHttpService(state:RegistryState):HttpClient{
    const entry=state.http;if(entry.value)return entry.value;
    const options=optionsFor(entry);if(!options)throw new Error('HTTP service is not configured');
    // Composition is lazy, but an auth-enabled application must never send an
    // unbound request while waiting for its auth module/owner to be installed.
    entry.value=buildHttpClient(options,()=>{if(state.auth.input){if(!state.auth.value)resolveService('auth',state);if(!inspectHttp(entry.value!)?.binding)throw new HttpError('cancel');}});entry.owned=true;entry.resolvedOptions=options;return entry.value;
  }
export function getHttpService():HttpClient{return resolveHttpService(browserState());}

registerService('http',resolveHttpService);
