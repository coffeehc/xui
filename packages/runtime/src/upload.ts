import {getUploadService} from './upload-access.js';
import {isHttpError, type HttpResponse, type HttpErrorKind} from './http.js';
import type {UploadService as UploadContract, UploadRequestOptions} from './upload-service.js';
export {getUploadService} from './upload-access.js';
export type { UploadRequestOptions} from './upload-service.js';

/** Queued files wait for an explicit start; invalid files are never sent. */
export type UploadStatus = 'queued' | 'uploading' | 'success' | 'error' | 'canceled' | 'invalid';
export type UploadValidationCode = 'type' | 'size' | 'count';
/** A record is immutable; File and the typed response remain caller-owned platform/domain objects. */
export interface UploadFile<T = unknown> {
  readonly id: string;
  readonly file: File;
  readonly status: UploadStatus;
  /** null means transport progress is unavailable; it never means zero percent. */
  readonly progress: null;
  readonly validation?: UploadValidationCode;
  readonly errorKind?: HttpErrorKind | 'unknown';
  /** A stopped/failed in-flight write may have committed. Removal never deletes a server file. */
  readonly resultUnknown: boolean;
  readonly response?: HttpResponse<T>;
}
export interface UploadState<T = unknown> {
  readonly files: readonly UploadFile<T>[];
  readonly busy: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly multiple: boolean;
  readonly accept: string;
  readonly maxFiles?: number;
  /** Per-file bytes, inclusive. */
  readonly maxFileSize?: number;
  /** A rejected batch/count error is separate from retained file rows. */
  readonly selectionError: UploadValidationCode | null;
}
export interface UploadControllerOptions<T = unknown> {
  /** Explicit upload endpoint. No endpoint, DTO or storage owner is invented. */
  path: string;
  service?: UploadService;
  request?: UploadRequestOptions<T>;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  maxFileSize?: number;
  /** Parallel files per controller, default 1. Other controllers remain independent. */
  concurrency?: number;
  disabled?: boolean;
  readOnly?: boolean;
}
export interface UploadController<T = unknown> {
  getState(): Readonly<UploadState<T>>;
  subscribe(listener: () => void): () => void;
  /** Validate/append without IO; same file may be selected again after removal. */
  add(files: Iterable<File>): void;
  /** Schedule queued files only. Repeated start never duplicates an in-flight write. */
  start(id?: string): void;
  /** Explicit new write after error/cancellation; host must first check unknown results/idempotency. */
  retry(id: string): void;
  /** Stop local waiting, including queued work. Allowed during disabled/readOnly for owner cleanup. */
  cancel(id?: string): void;
  remove(id: string): void;
  clear(): void;
  /** Change interaction gates, preserving files, results and existing requests. */
  update(options: {disabled?: boolean; readOnly?: boolean}): void;
  /** Abort owned waiting and release File/response references; never destroys the borrowed service. */
  destroy(): void;
}

function accepts(file: File, tokens: readonly string[]): boolean {
  return !tokens.length || tokens.some(token => token.startsWith('.') ? file.name.toLowerCase().endsWith(token) : token.endsWith('/*') ? file.type.toLowerCase().startsWith(token.slice(0, -1)) : file.type.toLowerCase() === token);
}
function constraints<T>(options: UploadControllerOptions<T>): string[] {
  if (typeof options.path !== 'string' || !options.path.trim()) throw new TypeError('Upload requires a path');
  for (const key of ['maxFiles', 'concurrency'] as const) if (options[key] !== undefined && (!Number.isSafeInteger(options[key]) || options[key]! < 1)) throw new TypeError(`Invalid upload ${key}`);
  if (options.maxFileSize !== undefined && (!Number.isSafeInteger(options.maxFileSize) || options.maxFileSize < 0)) throw new TypeError('Invalid upload maxFileSize');
  const tokens = (options.accept ?? '').split(',').map(token => token.trim().toLowerCase()).filter(Boolean);
  if (tokens.some(token => !/^\.[^\s,./]+(?:\.[^\s,/]+)*$|^[a-z0-9!#$&^_.+-]+\/(?:[a-z0-9!#$&^_.+-]+|\*)$/.test(token))) throw new TypeError('Invalid upload accept');
  return tokens;
}

/** Inert until start/retry. Uses the shared service lazily; no DOM, storage, preview URL or global queue. */
export function createUploadController<T = unknown>(options: UploadControllerOptions<T>): UploadController<T> {
  const tokens = constraints(options), {path, service, request} = options, concurrency = options.concurrency ?? 1;
  const policy = {multiple: options.multiple ?? false, accept: tokens.join(','), maxFiles: options.multiple ? options.maxFiles : 1, maxFileSize: options.maxFileSize};
  let disabled = !!options.disabled, readOnly = !!options.readOnly, files: readonly UploadFile<T>[] = Object.freeze([]), selectionError: UploadValidationCode | null = null, serial = 0, dead = false, pumping = false, stopping = false;
  type Task = {abort: AbortController; sent: boolean; release?: () => void};
  const listeners = new Set<() => void>(), scheduled = new Set<string>(), active = new Map<string, Task>();
  const snapshot = (): Readonly<UploadState<T>> => Object.freeze({...policy, files, disabled, readOnly, busy: active.size > 0 || scheduled.size > 0, selectionError});
  let state = snapshot();
  const publish = () => { state = snapshot(); for (const listener of [...listeners]) if (listeners.has(listener)) try { listener(); } catch { /* A view cannot interrupt another view or the queue. */ } };
  const replace = (id: string, changes: Partial<UploadFile<T>>) => { files = Object.freeze(files.map(file => file.id === id ? Object.freeze({...file, ...changes}) : file)); };
  const editable = () => !dead && !stopping && !disabled && !readOnly;
  const find = (id: string) => files.find(file => file.id === id);
  const finish = (id: string, task: Task, changes: Partial<UploadFile<T>>) => {
    if (dead || active.get(id) !== task) return;
    active.delete(id); task.release?.(); replace(id, changes); publish(); pump();
  };
  function pump() {
    if (pumping || dead) return;
    pumping = true;
    try {
      while (!dead && !disabled && !readOnly && active.size < concurrency && scheduled.size) {
        const id = scheduled.values().next().value!; scheduled.delete(id);
        const entry = find(id); if (!entry || entry.status !== 'queued') continue;
        const task: Task = {abort: new AbortController(), sent: false}; active.set(id, task);
        replace(id, {status: 'uploading', resultUnknown: false}); publish();
        // Publishing can reenter cancel/remove/destroy. Never dispatch the canceled intent.
        if (dead || active.get(id) !== task) continue;
        try {
          const external = request?.signal;
          const cancel = () => { if (active.get(id) === task) controller.cancel(id); };
          if (external?.aborted) { cancel(); continue; }
          external?.addEventListener('abort', cancel, {once: true});
          task.release = () => external?.removeEventListener('abort', cancel);
          const upload = service ?? getUploadService(); task.sent = true;
          const pending = upload.request<T>(path, entry.file, {...request, signal: task.abort.signal});
          Promise.resolve(pending).then(response => finish(id, task, {status: 'success', response, resultUnknown: false}), error => finish(id, task, {status: 'error', errorKind: isHttpError(error) ? error.kind : 'unknown', resultUnknown: true}));
        } catch (error) { finish(id, task, {status: 'error', errorKind: isHttpError(error) ? error.kind : 'unknown', resultUnknown: task.sent}); }
      }
    } finally { pumping = false; }
  }
  const cancelOne = (id: string) => {
    const entry = find(id); if (!entry || !['queued', 'uploading'].includes(entry.status)) return;
    const task = active.get(id); active.delete(id); scheduled.delete(id);
    replace(id, {status: 'canceled', resultUnknown: task?.sent ?? false}); task?.release?.(); task?.abort.abort();
  };
  const controller: UploadController<T> = {
    getState: () => state,
    subscribe(listener) { if (dead) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; },
    add(input) {
      if (!editable()) return;
      const selected = Array.from(input);
      if (selected.some(file => !file || typeof file.name !== 'string' || !Number.isSafeInteger(file.size) || file.size < 0 || typeof file.arrayBuffer !== 'function')) throw new TypeError('Upload requires Files');
      if (policy.maxFiles !== undefined && files.length + selected.length > policy.maxFiles) { selectionError = 'count'; publish(); return; }
      selectionError = null;
      files = Object.freeze([...files, ...selected.map(file => {
        const validation: UploadValidationCode | undefined = !accepts(file, tokens) ? 'type' : policy.maxFileSize !== undefined && file.size > policy.maxFileSize ? 'size' : undefined;
        return Object.freeze({id: `upload-${++serial}`, file, status: validation ? 'invalid' as const : 'queued' as const, validation, resultUnknown: false, progress: null});
      })]); publish();
    },
    start(id) { if (!editable()) return; for (const file of files) if ((!id || file.id === id) && file.status === 'queued') scheduled.add(file.id); pump(); },
    retry(id) {
      if (!editable()) return;
      const entry = find(id); if (!entry || !['error', 'canceled'].includes(entry.status)) return;
      replace(id, {status: 'queued', errorKind: undefined, response: undefined, resultUnknown: false}); scheduled.add(id); pump();
    },
    cancel(id) { if (dead || stopping) return; stopping=true; try { for (const file of files) if (!id || file.id === id) cancelOne(file.id); publish(); } finally {stopping=false;} pump(); },
    remove(id) { if (!editable() || !find(id)) return; const task=active.get(id); active.delete(id); scheduled.delete(id); files = Object.freeze(files.filter(file => file.id !== id)); selectionError = null; publish(); task?.release?.(); task?.abort.abort(); pump(); },
    clear() { if (!editable()) return; const tasks=[...active.values()]; active.clear(); scheduled.clear(); files = Object.freeze([]); selectionError = null; publish(); for(const task of tasks){task.release?.();task.abort.abort();} },
    update(next) { if (dead) return; if (next.disabled !== undefined) disabled = next.disabled; if (next.readOnly !== undefined) readOnly = next.readOnly; publish(); pump(); },
    destroy() { if (dead) return; dead = true; for (const task of active.values()) { task.release?.(); task.abort.abort(); } active.clear(); scheduled.clear(); files = Object.freeze([]); selectionError = null; publish(); listeners.clear(); },
  };
  return Object.freeze(controller);
}


import {serviceInstance} from './service-resolvers.js';
import {getUploadService as resolveSharedUploadService} from './upload-access.js';
export type UploadService=UploadContract;
/** Direct module singleton; state/configuration comes from the same application registry on use. */
export const UploadService:UploadService=serviceInstance(resolveSharedUploadService,['request'],[]);
