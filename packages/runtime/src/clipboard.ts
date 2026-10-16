/** Public write-only clipboard contracts. The shared writer is owned by services.ts. */
export type {ClipboardWriteOptions,ClipboardPlatformWriter,ClipboardServiceOptions,ClipboardService,SharedClipboardService} from './clipboard-service.js';
export {getClipboardService} from './clipboard-access.js';
