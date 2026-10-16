import type {RegistryState} from './service-state.js';

/** Implementations register only when their own module is imported. Bootstrap imports no feature service. */
type ServiceName = 'http' | 'auth' | 'theme' | 'clipboard' | 'config' | 'route' | 'i18n' | 'menu' | 'download' | 'upload';
const resolvers = new Map<ServiceName, (state: RegistryState, ...args: any[]) => unknown>();
export function registerService(name: ServiceName, resolve: (state: RegistryState, ...args: any[]) => unknown): void { resolvers.set(name, resolve); }
export function resolveService<T>(name: ServiceName, state: RegistryState, ...args: unknown[]): T {
  const resolve = resolvers.get(name);
  if (!resolve) throw new Error(`Import the xui ${name} service module before using its container getter`);
  return resolve(state, ...args) as T;
}

/** Stable import-time singleton reference; configuration/Window is read on invocation, never captured before bootstrap.
 * There is no second state store, transport or subscription here. The registry remains the sole instance owner. */
export function serviceInstance<T extends object>(resolve: () => T, methods: readonly (keyof T)[], properties: readonly (keyof T)[] = []): T {
  const instance = Object.create(null);
  for (const key of methods) Object.defineProperty(instance, key, {enumerable: true, value: (...args: unknown[]) => {
    const service = resolve(); return Reflect.apply(service[key] as (...args: unknown[]) => unknown, service, args);
  }});
  for (const key of properties) Object.defineProperty(instance, key, {enumerable: true, get: () => resolve()[key]});
  return Object.freeze(instance) as T;
}
