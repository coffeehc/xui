/** Opaque presentation content is supplied by the host; runtime has no React or DOM dependency. */
export interface ToastContent {
    id?: string;
    title?: unknown;
    description?: unknown;
    type?: string;
    timeout?: number;
    priority?: 'low' | 'high';
    /** Called once when the item enters its closing phase. */
    onClose?: () => void;
    /** Called once after removal, including a replaced closing record. */
    onRemove?: () => void;
}
/** All durations are milliseconds. A timeout of -1 disables dismissal; omitted/zero uses the configured default (5000ms). */
export interface ToastOptions {
    timeout?: number;
    limit?: number;
    exitTimeout?: number;
}
export type ToastRecord<T extends ToastContent = ToastContent> = Readonly<Omit<T, 'id'> & {
    id: string;
    revision: number;
    updateKey: number;
    transitionStatus: 'starting' | 'ending' | undefined;
    limited: boolean;
}>;
export interface ToastState<T extends ToastContent = ToastContent> {
    readonly toasts: readonly ToastRecord<T>[];
    readonly expanded: boolean;
    readonly paused: boolean;
    readonly timeout: number;
    readonly limit: number;
    readonly visibleLimit: number;
}
/** A View lease cannot acknowledge transitions or pause a controller after release. */
export interface ToastViewBinding {
    setPaused(reason: string, paused: boolean): void;
    setExpanded(expanded: boolean): void;
    /** Environmental cap reported by a View; it never rewrites host configuration. */
    setVisibleLimit(limit: number | undefined): void;
    entered(id: string, revision: number): void;
    exited(id: string, revision: number): void;
    release(): void;
}
export interface ToastPromiseOptions<Value, T extends ToastContent = ToastContent> {
    loading: string | T;
    success: string | Partial<T> | ((value: Value) => string | Partial<T>);
    error: string | Partial<T> | ((error: unknown) => string | Partial<T>);
}
/** The sole queue/timer/phase owner. A borrowed controller survives View unmount. */
export interface ToastController<T extends ToastContent = ToastContent> {
    getState(): Readonly<ToastState<T>>;
    subscribe(listener: () => void): () => void;
    configure(options: ToastOptions): void;
    add(options: T): string;
    update(id: string, options: Partial<T>): void;
    close(id?: string): void;
    /** Optional for legacy custom controllers. Privacy reset, without exit animation or callbacks. */
    clear?(): void;
    /** Returns the supplied promise's result; dismissal/update/destroy invalidates late presentation. */
    promise<Value>(promise: PromiseLike<Value>, options: ToastPromiseOptions<Value, T>): Promise<Value>;
    bindView(): ToastViewBinding;
    destroy(): void;
}
export interface ClearableToastController<T extends ToastContent=ToastContent> extends ToastController<T>{clear():void}
type Entry<T extends ToastContent> = {
    record: ToastRecord<T>;
    remaining: number;
    deadline: number;
    timer?: ReturnType<typeof setTimeout>;
    exitTimer?: ReturnType<typeof setTimeout>;
};
const defaults = { timeout: 5000, limit: 3, exitTimeout: 1000 };
let sequence = 0;
function optionsOf(input: ToastOptions) {
    const value = { timeout: input.timeout === undefined || input.timeout === 0 ? defaults.timeout : input.timeout, limit: input.limit ?? defaults.limit, exitTimeout: input.exitTimeout ?? defaults.exitTimeout };
    for (const key of ['timeout', 'exitTimeout'] as const)
        if (!Number.isFinite(value[key]) || (value[key] < 0 && !(key === 'timeout' && value[key] === -1)) || value[key] > 2147483647)
            throw new TypeError(`Invalid toast ${key}`);
    if (!Number.isSafeInteger(value.limit) || value.limit < 1)
        throw new TypeError('Invalid toast limit');
    return value;
}
function validate(value: ToastContent) {
    if (value === null || typeof value !== 'object')
        throw new TypeError('Invalid toast content');
    if (value.id !== undefined && (typeof value.id !== 'string' || !value.id))
        throw new TypeError('Invalid toast id');
    if (value.timeout !== undefined)
        optionsOf({ timeout: value.timeout });
    if (value.type !== undefined && typeof value.type !== 'string')
        throw new TypeError('Invalid toast type');
    if (value.priority !== undefined && !['low', 'high'].includes(value.priority))
        throw new TypeError('Invalid toast priority');
    for (const key of ['onClose', 'onRemove'] as const)
        if (value[key] !== undefined && typeof value[key] !== 'function')
            throw new TypeError(`Invalid toast ${key}`);
}
function callbacks(values: (() => void)[]) { const errors: unknown[] = []; for (const run of values)
    try {
        run();
    }
    catch (error) {
        errors.push(error);
    } if (errors.length)
    throw new AggregateError(errors, 'Toast callbacks failed'); }
/** Allocate an inert queue. Timers run only while at least one View is bound and unpaused. */
export function createToastController<T extends ToastContent = ToastContent>(input: ToastOptions = {}): ClearableToastController<T> {
    let settings = optionsOf(input), entries: Entry<T>[] = [], revision = 0, disposed = false;
    const listeners = new Set<() => void>(), views = new Set<{
        pauses: Set<string>;
        expanded: boolean;
        visibleLimit: number | undefined;
    }>();
    let state: Readonly<ToastState<T>> = Object.freeze({ toasts: Object.freeze([]), expanded: false, paused: true, timeout: settings.timeout, limit: settings.limit, visibleLimit: settings.limit });
    const cancelTimer = (entry: Entry<T>) => { if (entry.timer !== undefined) {
        clearTimeout(entry.timer);
        entry.timer = undefined;
        entry.remaining = Math.max(0, entry.deadline - Date.now());
    } };
    function publish(isolateObservers=false) {
        if (disposed)
            return;
        const paused = views.size === 0 || [...views].some(view => view.pauses.size > 0), expanded = [...views].some(view => view.expanded), visibleLimit = Math.min(settings.limit, ...[...views].flatMap(view => view.visibleLimit === undefined ? [] : [view.visibleLimit]));
        let count = 0;
        for (const entry of entries) {
            const limited = entry.record.transitionStatus === 'ending' ? entry.record.limited : count++ >= visibleLimit;
            if (limited !== entry.record.limited)
                entry.record = Object.freeze({ ...entry.record, limited }) as ToastRecord<T>;
            if (paused || limited || entry.record.transitionStatus || entry.record.timeout === -1)
                cancelTimer(entry);
            else if (entry.timer === undefined) {
                const id = entry.record.id, token = entry.record.revision;
                entry.deadline = Date.now() + entry.remaining;
                entry.timer = setTimeout(() => { entry.timer = undefined; const current = find(id); if (current === entry && current.record.revision === token)
                    controller.close(id); }, entry.remaining);
            }
        }
        state = Object.freeze({ toasts: Object.freeze(entries.map(entry => entry.record)), paused, expanded, timeout: settings.timeout, limit: settings.limit, visibleLimit });
        for (const listener of [...listeners]) {
            if(isolateObservers){try{listener();}catch{/* Identity cleanup must reach every View. */}}
            else listener();
        }
    }
    const find = (id: string) => entries.find(entry => entry.record.id === id);
    function remove(entry: Entry<T>) {
        const index = entries.indexOf(entry);
        if (index < 0)
            return;
        cancelTimer(entry);
        if (entry.exitTimer !== undefined)
            clearTimeout(entry.exitTimer);
        entries.splice(index, 1);
        publish();
        entry.record.onRemove?.();
    }
    const controller: ClearableToastController<T> = {
        getState: () => state,
        subscribe(listener) { if (disposed)
            return () => { }; listeners.add(listener); return () => { listeners.delete(listener); }; },
        configure(options) { if (disposed)
            return; settings = optionsOf(options); publish(); },
        add(options) {
            if (disposed)
                throw new Error('Toast controller is destroyed');
            validate(options);
            const id = options.id ?? `xui-toast-${++sequence}`, previous = find(id);
            if (previous && previous.record.transitionStatus !== 'ending') {
                controller.update(id, { ...options, timeout: options.timeout ?? previous.record.timeout } as Partial<T>);
                return id;
            }
            if (previous) {
                cancelTimer(previous);
                clearTimeout(previous.exitTimer);
                entries = entries.filter(entry => entry !== previous);
            }
            const timeout = options.timeout === undefined || options.timeout === 0 ? settings.timeout : options.timeout;
            entries.unshift({ record: Object.freeze({ ...options, id, timeout, revision: ++revision, updateKey: 0, transitionStatus: 'starting', limited: false }) as ToastRecord<T>, remaining: timeout, deadline: 0 });
            publish();
            previous?.record.onRemove?.();
            return id;
        },
        update(id, options) {
            if (disposed)
                return;
            validate(options);
            const entry = find(id);
            if (!entry || entry.record.transitionStatus === 'ending')
                return;
            cancelTimer(entry);
            const timeout = options.timeout === 0 ? settings.timeout : options.timeout ?? entry.record.timeout ?? settings.timeout;
            entry.record = Object.freeze({ ...entry.record, ...options, id, timeout, revision: ++revision, updateKey: entry.record.updateKey + 1, transitionStatus: entry.record.transitionStatus, limited: entry.record.limited }) as ToastRecord<T>;
            if (options.timeout !== undefined)
                entry.remaining = timeout;
            publish();
        },
        close(id) {
            if (disposed)
                return;
            const closing = entries.filter(entry => (id === undefined || entry.record.id === id) && entry.record.transitionStatus !== 'ending');
            for (const entry of closing) {
                cancelTimer(entry);
                entry.record = Object.freeze({ ...entry.record, revision: ++revision, transitionStatus: 'ending' }) as ToastRecord<T>;
                entry.exitTimer = setTimeout(() => remove(entry), settings.exitTimeout);
            }
            publish();
            const runs = closing.flatMap(entry => entry.record.onClose ? [entry.record.onClose] : []);
            if (views.size === 0)
                for (const entry of closing) {
                    if (entry.record.onRemove)
                        runs.push(entry.record.onRemove);
                    clearTimeout(entry.exitTimer);
                    entries = entries.filter(candidate => candidate !== entry);
                }
            if (views.size === 0)
                publish();
            callbacks(runs);
        },
        clear() {
            if(disposed||!entries.length)return;
            for(const entry of entries){cancelTimer(entry);clearTimeout(entry.exitTimer);}
            entries=[];revision++;publish(true);
        },
        async promise(promise, options) {
            const content = (value: string | Partial<T>) => typeof value === 'string' ? { title: value } as Partial<T> : value;
            const id = controller.add({ ...content(options.loading), timeout: -1, type: 'loading' } as T), token = find(id)!.record.revision;
            const complete = (result: string | Partial<T>, type: string) => { const entry = find(id); if (!disposed && entry?.record.revision === token && entry.record.transitionStatus !== 'ending')
                controller.update(id, { ...content(result), type, timeout: content(result).timeout ?? settings.timeout } as Partial<T>); };
            try {
                const value = await promise;
                const entry = find(id);
                if (!disposed && entry?.record.revision === token)
                    complete(typeof options.success === 'function' ? options.success(value) : options.success, 'success');
                return value;
            }
            catch (error) {
                const entry = find(id);
                if (!disposed && entry?.record.revision === token)
                    complete(typeof options.error === 'function' ? options.error(error) : options.error, 'error');
                throw error;
            }
        },
        bindView() {
            const view = { pauses: new Set<string>(), expanded: false, visibleLimit: undefined as number | undefined };
            let released = disposed;
            if (!released) {
                views.add(view);
                publish();
            }
            return {
                setPaused(reason, paused) { if (released || disposed)
                    return; const before = view.pauses.has(reason); if (before === paused)
                    return; if (paused)
                    view.pauses.add(reason);
                else
                    view.pauses.delete(reason); publish(); },
                setExpanded(expanded) { if (released || disposed || view.expanded === expanded)
                    return; view.expanded = expanded; publish(); },
                setVisibleLimit(limit) { if (released || disposed || view.visibleLimit === limit)
                    return; if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1))
                    throw new TypeError('Invalid toast visible limit'); view.visibleLimit = limit; publish(); },
                entered(id, token) { if (released || disposed)
                    return; const entry = find(id); if (entry?.record.revision !== token || entry.record.transitionStatus !== 'starting')
                    return; entry.record = Object.freeze({ ...entry.record, transitionStatus: undefined }) as ToastRecord<T>; publish(); },
                exited(id, token) { if (released || disposed)
                    return; const entry = find(id); if (entry?.record.revision === token && entry.record.transitionStatus === 'ending')
                    remove(entry); },
                release() { if (released || disposed)
                    return; released = true; views.delete(view); publish(); if (!views.size)
                    for (const entry of [...entries])
                        if (entry.record.transitionStatus === 'ending')
                            remove(entry); },
            };
        },
        destroy() { if (disposed)
            return; disposed = true; for (const entry of entries) {
            cancelTimer(entry);
            clearTimeout(entry.exitTimer);
        } entries = []; views.clear(); state = Object.freeze({ toasts: Object.freeze([]), paused: true, expanded: false, timeout: settings.timeout, limit: settings.limit, visibleLimit: settings.limit }); for (const listener of [...listeners])
            listener(); listeners.clear(); },
    };
    return controller;
}
