/** Public write-only clipboard contracts. The shared writer is owned by services.ts. */
export type {ClipboardWriteOptions,ClipboardPlatformWriter,ClipboardServiceOptions,SharedClipboardService} from './clipboard-service.js';
export {getClipboardService} from './clipboard-access.js';


import type {ClipboardService as ClipboardServiceContract} from './clipboard-service.js';
import type {SharedClipboardService} from './clipboard-service.js';

import {serviceInstance} from './service-resolvers.js';
import {getClipboardService as resolveSharedClipboardService} from './clipboard-access.js';
export type ClipboardService=ClipboardServiceContract;
/** Direct module singleton; state/configuration comes from the same application registry on use. */
export const ClipboardService:SharedClipboardService=serviceInstance(resolveSharedClipboardService,['writeText'],[]);
