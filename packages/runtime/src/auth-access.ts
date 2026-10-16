import {registerService} from './service-resolvers.js';
import {buildAuthClient,type AuthClient} from './auth-service.js';
import {resolveHttpService} from './http-access.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
export function resolveAuthService(state:RegistryState):AuthClient{
    const entry=state.auth;if(entry.value)return entry.value;
    const options=optionsFor(entry);if(!options)throw new Error('Auth service is not configured');
    entry.value=buildAuthClient({...options,http:resolveHttpService(state)});entry.owned=true;entry.resolvedOptions=options;return entry.value;
  }
export function getAuthService():AuthClient{return resolveAuthService(browserState());}

registerService('auth',resolveAuthService);
