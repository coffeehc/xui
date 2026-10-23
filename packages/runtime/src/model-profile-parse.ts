import {modelProfileProviders, type ModelProfileConfig, type ModelProfileEditorData, type ModelCatalogResult, type ModelProfileTestResult, type ModelPolicyValue} from './model-profile-types.js';

const fail = (): never => {throw new TypeError('Invalid model profile contract');};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return fail();
  if (Object.values(Object.getOwnPropertyDescriptors(value)).some(field => !('value' in field))) return fail();
  return value as Record<string, unknown>;
}
function fields(value: unknown, keys: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  const row = object(value);
  if (keys.some(key => !Object.hasOwn(row, key)) || Object.keys(row).some(key => !keys.includes(key) && !optional.includes(key))) return fail();
  return row;
}
function string(value: unknown, max = 4096): string {if (typeof value !== 'string' || value.length > max) return fail(); return value;}
function bool(value: unknown): boolean {if (typeof value !== 'boolean') return fail(); return value;}
function integer(value: unknown, min = 0): number {if (!Number.isSafeInteger(value) || Number(value) < min) return fail(); return value as number;}
/** Bounded JSON, no executable values, accessors, non-finite numbers or prototype keys. */
export function parseModelPolicy(value: unknown): Readonly<Record<string, ModelPolicyValue>> | null {
  if (value === null) return null;
  object(value); let count = 0;
  const visit = (item: unknown, depth: number): ModelPolicyValue => {
    if (++count > 4096 || depth > 12) return fail();
    if (item === null || typeof item === 'boolean') return item;
    if (typeof item === 'string') return string(item, 16384);
    if (typeof item === 'number' && Number.isFinite(item)) return item;
    if (Array.isArray(item)) return Object.freeze(item.map(child => visit(child, depth + 1)));
    const row = object(item), result: Record<string, ModelPolicyValue> = {};
    for (const [key, child] of Object.entries(row)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key) || key.length > 256) return fail();
      result[key] = visit(child, depth + 1);
    }
    return Object.freeze(result);
  };
  return visit(value, 0) as Readonly<Record<string, ModelPolicyValue>>;
}
const configKeys = ['provider_type','model_name','real_name','base_url','timeout_seconds','max_concurrency','disable_stream','capabilities','default_policy'];
export function parseModelProfileConfig(value: unknown): Readonly<ModelProfileConfig> {
  const row = fields(value, configKeys), provider = modelProfileProviders.find(item => item.id === row.provider_type);
  if (!provider) return fail();
  const capabilities = object(row.capabilities);
  for (const [key, value] of Object.entries(capabilities)) {
    if (!['supports_chat','supports_tool_calls','supports_vision','supports_audio','supports_files','supports_image_generation','supports_embedding'].includes(key)) return fail();
    bool(value);
  }
  const max = integer(row.max_concurrency, -1); if (max === 0) return fail();
  const policy = parseModelPolicy(row.default_policy);
  if (provider.kind === 'embedding' && policy !== null) return fail();
  return Object.freeze({provider_type: provider.id, model_name: string(row.model_name), real_name: string(row.real_name), base_url: string(row.base_url), timeout_seconds: integer(row.timeout_seconds), max_concurrency: max, disable_stream: bool(row.disable_stream), capabilities: Object.freeze({...capabilities}) as ModelProfileConfig['capabilities'], default_policy: policy});
}
export function parseModelProfileEditorData(value: unknown): Readonly<ModelProfileEditorData> {
  const row = fields(value, ['schema_version','profile_id','version','config','defaults','has_api_key','header_names','can_save']);
  if (row.schema_version !== 1 || !Array.isArray(row.defaults) || !row.defaults.length || !Array.isArray(row.header_names)) return fail();
  const defaults = row.defaults.map(parseModelProfileConfig), config = parseModelProfileConfig(row.config);
  if (new Set(defaults.map(item => item.provider_type)).size !== defaults.length || !defaults.some(item => item.provider_type === config.provider_type)) return fail();
  const id = row.profile_id === null ? null : string(row.profile_id, 256), version = row.version === null ? null : string(row.version, 256);
  if ((id === null) !== (version === null) || id === '' || version === '') return fail();
  if (id === null && row.has_api_key === true) return fail();
  const names = row.header_names.map(value => string(value, 256));
  if (names.length > 100 || names.some(name => !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name))) return fail();
  return Object.freeze({schema_version: 1, profile_id: id, version, config, defaults: Object.freeze(defaults), has_api_key: bool(row.has_api_key), header_names: Object.freeze(names), can_save: bool(row.can_save)});
}
export function parseModelCatalog(value: unknown): Readonly<ModelCatalogResult> {
  const row = fields(value, ['schema_version','models']);
  if (row.schema_version !== 1 || !Array.isArray(row.models) || row.models.length > 10000) return fail();
  const models = row.models.map(value => {const item = fields(value, ['id'], ['owned_by','created_at']); const id = string(item.id); if (!id.trim()) return fail(); return Object.freeze({id,...(item.owned_by === undefined ? {} : {owned_by: string(item.owned_by)}),...(item.created_at === undefined ? {} : {created_at: integer(item.created_at)})});});
  if (new Set(models.map(item => item.id)).size !== models.length) return fail();
  return Object.freeze({schema_version: 1, models: Object.freeze(models)});
}
export function parseModelProfileTest(value: unknown): Readonly<ModelProfileTestResult> {
  const row = fields(value, ['schema_version','kind','passed','elapsed_ms','summary'], ['embedding']);
  if (row.schema_version !== 1 || !['chat','image_generation','embedding'].includes(String(row.kind))) return fail();
  let embedding: ModelProfileTestResult['embedding'];
  if (row.embedding !== undefined) {const item = fields(row.embedding, ['count','dimensions']); embedding = Object.freeze({count: integer(item.count, 1), dimensions: integer(item.dimensions, 1)});}
  if (row.kind !== 'embedding' && embedding || row.kind === 'embedding' && row.passed === true && !embedding) return fail();
  return Object.freeze({schema_version: 1, kind: row.kind as ModelProfileTestResult['kind'], passed: bool(row.passed), elapsed_ms: integer(row.elapsed_ms), summary: string(row.summary), ...(embedding ? {embedding} : {})});
}
/** Header values only exist at the submit boundary, never in read metadata. {} explicitly clears all headers. */
export function parseModelHeaders(value: unknown): Readonly<Record<string, string>> {
  const row = object(value), result: Record<string,string> = {};
  if (Object.keys(row).length > 100) return fail();
  for (const [key, value] of Object.entries(row)) {
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(key) || ['__proto__','constructor','prototype'].includes(key) || /[\r\n\0]/.test(string(value, 16384))) return fail();
    result[key] = value as string;
  }
  return Object.freeze(result);
}
/** Validate explicit fields without applying defaults or merging a stored profile. */
export function parseModelProfilePatch(value: unknown): import('./model-profile-types.js').ModelProfileCandidate['config'] {
  const row = fields(value, [], [...configKeys, 'api_key', 'headers']);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === 'provider_type') {if (!modelProfileProviders.some(item => item.id === value)) return fail(); result[key] = value;}
    else if (key === 'timeout_seconds') result[key] = integer(value);
    else if (key === 'max_concurrency') {const max = integer(value, -1); if (!max) return fail(); result[key] = max;}
    else if (key === 'disable_stream') result[key] = bool(value);
    else if (key === 'headers') result[key] = parseModelHeaders(value);
    else if (key === 'default_policy') result[key] = parseModelPolicy(value);
    else if (key === 'capabilities') {const caps = fields(value, [], ['supports_chat','supports_tool_calls','supports_vision','supports_audio','supports_files','supports_image_generation','supports_embedding']); result[key] = Object.freeze(Object.fromEntries(Object.entries(caps).map(([key, value]) => [key, bool(value)])));}
    else result[key] = string(value, key === 'api_key' ? 16384 : 4096);
  }
  return Object.freeze(result);
}
