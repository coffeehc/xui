import {registerService} from './service-resolvers.js';
import {buildUploadService, type UploadService} from './upload-service.js';
import {resolveHttpService} from './http-access.js';
import {browserState, type RegistryState} from './service-state.js';

export function resolveUploadService(state: RegistryState): UploadService {
  return state.upload ??= buildUploadService(resolveHttpService(state));
}
/** One shared upload service per browser Window. Use XuiServices for SSR/test isolation. */
export function getUploadService(): UploadService { return resolveUploadService(browserState()); }

registerService('upload',resolveUploadService);
