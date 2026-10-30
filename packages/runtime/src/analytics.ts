/** Optional, explicit telemetry. Importing this module performs no I/O. */
export type AnalyticsEnvironment = 'production' | 'development' | 'test' | 'preview';
export type AnalyticsConsent = 'unknown' | 'granted' | 'denied';
export type AnalyticsEventName = 'page_view' | 'feature_clicked' | 'task_submitted' | 'task_succeeded' | 'task_failed';
export interface AnalyticsEvent {
  readonly name: AnalyticsEventName;
  readonly product: string;
  readonly version: string;
  readonly environment: 'production';
  readonly route?: string;
  readonly path?: string;
  readonly feature?: string;
  readonly taskType?: string;
}
/** A dedicated adapter must belong to one controller. It must not queue rejected events. */
export interface AnalyticsAdapter {
  start(): Promise<boolean>;
  stop(): void;
  send(event: AnalyticsEvent): void;
}
export interface AnalyticsOptions {
  /** Defaults to false. An ID alone never enables collection. */
  enabled?: boolean;
  environment?: AnalyticsEnvironment;
  product: string;
  version: string;
  /** Static names -> public path templates. Never populate from user or record data. */
  routes?: Readonly<Record<string, string>>;
  features?: readonly string[];
  taskTypes?: readonly string[];
  adapter: AnalyticsAdapter;
}
export interface AnalyticsController {
  /** The host obtains consent and owns persistence/UI. No pre-consent replay. */
  setConsent(consent: AnalyticsConsent): Promise<boolean>;
  getState(): Readonly<{enabled: boolean; consent: AnalyticsConsent; ready: boolean; destroyed: boolean}>;
  /** navigationKey is local-only; repeat render/effect calls with the same key are ignored. */
  page(route: string, navigationKey?: string): boolean;
  feature(name: string, eventKey?: string): boolean;
  task(phase: 'submitted' | 'succeeded' | 'failed', taskType: string, eventKey?: string): boolean;
  destroy(): void;
}
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(value);
const versionValue = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.+-]{0,63}$/.test(value);
const publicPath = (value: unknown): value is string => typeof value === 'string' && /^\/(?:[A-Za-z0-9_./:-]{0,199})$/.test(value) && !value.startsWith('//') && !value.includes('..');
const eventNames = new Set<AnalyticsEventName>(['page_view', 'feature_clicked', 'task_submitted', 'task_succeeded', 'task_failed']);

export function createAnalytics(options: AnalyticsOptions): AnalyticsController {
  const enabled = options.enabled === true && options.environment === 'production' && identifier(options.product) && versionValue(options.version);
  const product = options.product, version = options.version, adapter = options.adapter;
  const routes = new Map(Object.entries(options.routes ?? {}).filter(([key, path]) => identifier(key) && publicPath(path)));
  const features = new Set((options.features ?? []).filter(identifier));
  const tasks = new Set((options.taskTypes ?? []).filter(identifier));
  let consent: AnalyticsConsent = 'unknown', ready = false, destroyed = false, generation = 0;
  let pending: Promise<boolean> | undefined, lastPage: string | undefined;
  const recent = new Set<string>();
  const stop = () => { try { adapter.stop(); } catch { /* Analytics never breaks business flows. */ } };
  function send(event: AnalyticsEvent, eventKey?: string): boolean {
    if (!enabled || destroyed || !ready || consent !== 'granted') return false;
    const key = eventKey === undefined ? undefined : `${event.name}:${event.feature ?? event.taskType ?? ''}:${eventKey}`;
    if (eventKey !== undefined && (typeof eventKey !== 'string' || eventKey.length > 200 || recent.has(key!))) return false;
    try { adapter.send(Object.freeze(event)); } catch { ready = false; stop(); return false; }
    if (key !== undefined) { recent.add(key); if (recent.size > 128) recent.delete(recent.values().next().value!); }
    return true;
  }
  const base = () => ({product, version, environment: 'production' as const});
  return {
    async setConsent(next) {
      if (destroyed) return false;
      if (next !== 'granted') {
        consent = next === 'denied' ? 'denied' : 'unknown'; ready = false; generation++; pending = undefined; lastPage = undefined; recent.clear(); stop(); return false;
      }
      consent = 'granted';
      if (!enabled) return false;
      if (ready) return true;
      if (pending) return pending;
      const epoch = ++generation;
      pending = (async () => {
        try {
          const started = await Promise.resolve().then(() => destroyed || epoch !== generation || consent !== 'granted' ? false : adapter.start());
          if (destroyed || epoch !== generation || consent !== 'granted') return false;
          ready = started === true;
          if (!ready) stop();
          return ready;
        } catch { if (epoch === generation) { ready = false; stop(); } return false; }
        finally { if (epoch === generation) pending = undefined; }
      })();
      return pending;
    },
    getState: () => Object.freeze({enabled, consent, ready, destroyed}),
    page(route, navigationKey = route) {
      const path = routes.get(route);
      if (!path || typeof navigationKey !== 'string' || navigationKey.length > 200) return false;
      const key = JSON.stringify([route, navigationKey]);
      if (lastPage === key) return false;
      const sent = send({...base(), name: 'page_view', route, path});
      if (sent) lastPage = key;
      return sent;
    },
    feature(name, eventKey) { return features.has(name) && send({...base(), name: 'feature_clicked', feature: name}, eventKey); },
    task(phase, taskType, eventKey) {
      if (!['submitted', 'succeeded', 'failed'].includes(phase) || !tasks.has(taskType)) return false;
      return send({...base(), name: `task_${phase}` as AnalyticsEventName, taskType}, eventKey);
    },
    destroy() { if (destroyed) return; destroyed = true; ready = false; generation++; pending = undefined; recent.clear(); lastPage = undefined; stop(); },
  };
}

export interface Ga4AnalyticsOptions {
  measurementId: string;
  /** Explicit host allowlist prevents accidental preview / self-hosted collection. */
  allowedHosts: readonly string[];
  /** In CSP deployments supply the host's script nonce. */
  nonce?: string;
  /** DOM injection for isolated tests; omitted on server is a harmless disabled adapter. */
  window?: Window;
  loadTimeoutMs?: number;
}
type TagWindow = Window & {dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; [key: `ga-disable-${string}`]: boolean | undefined};
const ownedWindows = new WeakSet<Window>();
/** Dedicated GA stream only: turn Enhanced Measurement OFF in its GA admin settings. */
export function createGa4AnalyticsAdapter(options: Ga4AnalyticsOptions): AnalyticsAdapter {
  const win = options.window ?? (typeof window === 'undefined' ? undefined : window);
  const id = options.measurementId;
  let allowed = false;
  try { allowed = !!win && /^G-[A-Z0-9]+$/.test(id) && win.location.protocol === 'https:' && options.allowedHosts.includes(win.location.hostname); } catch { /* fail closed */ }
  let active = false, initialized = false, owns = false, epoch = 0;
  let loading: Promise<boolean> | undefined;
  const target = win as TagWindow | undefined;
  const consent = (granted: boolean) => ({analytics_storage: granted ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
  const disable = () => { if (owns && target) target[`ga-disable-${id}`] = true; };
  const command = (...args: unknown[]) => target?.gtag?.(...args);
  function load(): Promise<boolean> {
    if (loading) return loading;
    loading = new Promise(resolve => {
      const script = win!.document.createElement('script');
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      if (options.nonce) script.nonce = options.nonce;
      let settled = false;
      const finish = (ok: boolean) => { if (settled) return; settled = true; clearTimeout(timer); script.onload = null; script.onerror = null; resolve(ok); };
      const timer = setTimeout(() => finish(false), Math.min(30000, Math.max(100, options.loadTimeoutMs ?? 10000)));
      script.onload = () => finish(true); script.onerror = () => finish(false);
      try { win!.document.head.appendChild(script); } catch { finish(false); }
    });
    return loading;
  }
  return {
    async start() {
      if (!allowed || !target || !win) return false;
      const token = ++epoch;
      if (!owns) {
        // Never take over an existing tag/CMP or another adapter's consent state.
        if (ownedWindows.has(win) || target.gtag || target.dataLayer || win.document.querySelector('script[src*="googletagmanager.com/"]')) return false;
        ownedWindows.add(win); owns = true;
        target.dataLayer = [];
        target.gtag = function () { target.dataLayer!.push(arguments); };
        disable();
        command('consent', 'default', consent(false));
      }
      if (!await load() || token !== epoch) return false;
      target[`ga-disable-${id}`] = false;
      command('consent', 'update', consent(true));
      if (!initialized) {
        command('js', new Date());
        command('config', id, {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: `${win.location.origin}/`, page_referrer: '', page_title: ''});
        initialized = true;
      }
      active = true;
      return true;
    },
    stop() { epoch++; active = false; disable(); if (owns) command('consent', 'update', consent(false)); },
    send(event) {
      if (!active || !target || !win || !eventNames.has(event.name) || !identifier(event.product) || !versionValue(event.version) || event.environment !== 'production') return;
      if (event.name === 'page_view' && (!identifier(event.route) || !publicPath(event.path))) return;
      if (event.name === 'feature_clicked' && !identifier(event.feature)) return;
      if (event.name.startsWith('task_') && !identifier(event.taskType)) return;
      // Explicit projection: unknown fields, real URL, document title and referrer never enter our event.
      command('event', event.name, {send_to: id, product_name: event.product, product_version: event.version, deployment_environment: event.environment,
        ...(event.name === 'page_view' ? {route_name: event.route} : {}), ...(event.name === 'feature_clicked' ? {feature_name: event.feature} : {}), ...(event.name.startsWith('task_') ? {task_type: event.taskType} : {}),
        page_location: `${win.location.origin}${event.name === 'page_view' ? event.path : '/'}`, page_title: event.name === 'page_view' ? event.route : '', page_referrer: ''});
    },
  };
}
