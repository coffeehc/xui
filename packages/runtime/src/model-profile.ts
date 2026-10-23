import {createResource} from './resource.js';
import {isHttpError} from './http.js';
import {ModelProfileService} from './model-profile-service.js';
import {parseModelProfileEditorData, parseModelPolicy, parseModelHeaders, parseModelCatalog, parseModelProfileTest} from './model-profile-parse.js';
import {modelProfileStoredKey, modelProfileProviders, type ModelProfileAdapter, type ModelProfileCandidate, type ModelProfileConfig, type ModelProfileCredentials, type ModelProfileEditorData, type ModelProfileField, type ModelProfileOperation, type ModelProfileState, type ModelCredentialMode} from './model-profile-types.js';
export * from './model-profile-types.js';
export {ModelProfileClient, ModelProfileService, modelProfileEndpoints, type ModelProfileClientOptions} from './model-profile-service.js';
export {parseModelProfileEditorData} from './model-profile-parse.js';

export interface ModelProfileControllerOptions {
  service?: ModelProfileAdapter;
  profileId?: string;
  /** Optional already-loaded, safe projection; avoids an extra read. */
  initial?: ModelProfileEditorData;
  disabled?: boolean;
  readOnly?: boolean;
  /** Finite waiting even for non-cooperative injected adapters. Default 180 seconds. */
  timeoutMs?: number;
}
export interface ModelProfileController {
  getState(): Readonly<ModelProfileState>;
  subscribe(listener: () => void): () => void;
  /** Explicit read discards the draft; no automatic polling. */
  load(profileId?: string | null): Promise<void>;
  setField<K extends keyof ModelProfileConfig>(key: K, value: ModelProfileConfig[K]): void;
  setPolicyText(value: string): void;
  setCredentialMode(field: 'api_key' | 'headers', mode: ModelCredentialMode): void;
  /** Invalidates catalog/test on DOM-held credential edits. */
  credentialsChanged(): void;
  bindCredentials(reader: () => ModelProfileCredentials): () => void;
  setEmbeddingTest(input: string, dimensions: string): void;
  catalog(): Promise<void>;
  test(): Promise<void>;
  save(): Promise<void>;
  cancel(): void;
  reset(): void;
  /** Clear private view data immediately on identity/scope exit, including injected controllers. */
  clear(): void;
  update(gates: {disabled?: boolean; readOnly?: boolean}): void;
  destroy(): void;
}
const initialState = (): ModelProfileState => ({data: null, draft: null, policyText: '', dirty: false, operation: null, catalog: null, testResult: null, errors: {}, error: null, apiKeyMode: 'keep', headersMode: 'keep', embeddingInput: '', embeddingDimensions: '', disabled: false, readOnly: false, credentialRevision: 0});

/** Per-editor draft owner. Sends explicit patches only; effective profile merge belongs to the backend. */
export function createModelProfileController(options: ModelProfileControllerOptions = {}): ModelProfileController {
  const service = options.service ?? ModelProfileService;
  let profileId = options.profileId, state: Readonly<ModelProfileState> = Object.freeze({...initialState(), disabled: !!options.disabled, readOnly: !!options.readOnly});
  let patch: Partial<ModelProfileConfig> = {}, dead = false, reader: (() => ModelProfileCredentials) | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: Partial<ModelProfileState>) => {state = Object.freeze({...state, ...next}); for (const listener of listeners) {try {listener();} catch {/* A view observer cannot change an operation outcome. */}}};
  const install = (input: ModelProfileEditorData) => {
    const data = parseModelProfileEditorData(input); profileId = data.profile_id ?? undefined; patch = {};
    publish({data, draft: data.config, policyText: JSON.stringify(data.config.default_policy, null, 2), dirty: false, operation: null, errors: {}, error: null, catalog: null, testResult: null, embeddingInput: '', embeddingDimensions: '', apiKeyMode: 'keep', headersMode: 'keep', credentialRevision: state.credentialRevision + 1});
  };
  type OperationResult = {operation: ModelProfileOperation; value: unknown};
  let generation = 0;
  let pending: ((signal: AbortSignal) => Promise<unknown>) | undefined;
  const resource = createResource<OperationResult>({timeoutMs: options.timeoutMs ?? 180000, loader: async (operation, signal) => {if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); const task = pending; pending = undefined; if (!task || signal.aborted) throw new DOMException('Cancelled', 'AbortError'); return {operation: operation as ModelProfileOperation, value: await task(signal)};}});
  const allowed = () => !dead && !state.disabled && !state.readOnly && !!state.draft && state.operation !== 'save' && state.operation !== 'load';
  const cancel = () => {const operation = state.operation; generation++; resource.cancel(); pending = undefined; publish({operation: null, ...(operation === 'save' ? {error: 'save_unknown' as const} : {})});};
  const invalidate = (connection = false) => {if (state.operation) cancel(); publish({testResult: null, ...(connection ? {catalog: null} : {}), errors: {}, error: state.error === 'save_unknown' ? state.error : null, dirty: true});};
  async function run(operation: ModelProfileOperation, task: (signal: AbortSignal) => Promise<unknown>) {
    if (dead || state.operation) return;
    const turn = ++generation; pending = task; publish({operation, error: null});
    await resource.load(operation);
    if (dead || turn !== generation || state.operation !== operation) return;
    const result = resource.getState();
    if (result.status === 'error') {
      // A timeout, cancellation, parse failure or server crash cannot prove a save did not commit.
      const rejected = isHttpError(result.error) && (result.error.kind === 'business' && typeof result.error.code === 'number' && result.error.code >= 40000 && result.error.code < 50000 || result.error.status === 400 || result.error.status === 403 || result.error.status === 409 || result.error.status === 422);
      publish({operation: null, error: operation === 'save' && !rejected ? 'save_unknown' : operation}); return;
    }
    if (result.status !== 'ready') return;
    try {
      if (operation === 'load' || operation === 'save') {
        const data = parseModelProfileEditorData(result.value!.value);
        if (operation === 'load' && data.profile_id !== (profileId ?? null) || operation === 'save' && (data.profile_id === null || profileId !== undefined && data.profile_id !== profileId)) throw new TypeError('Mismatched model identity');
        install(data);
      }
      else if (operation === 'catalog') publish({catalog: parseModelCatalog(result.value!.value).models, operation: null});
      else {const test = parseModelProfileTest(result.value!.value); if (test.kind !== modelProfileProviders.find(item => item.id === state.draft!.provider_type)!.kind) throw new TypeError('Mismatched test protocol'); publish({testResult: test, operation: null});}
    } catch {publish({operation: null, error: operation === 'save' ? 'save_unknown' : operation});}
  }
  function request(operation: 'catalog' | 'test' | 'save'): ModelProfileCandidate | null {
    if (!allowed() || state.operation || operation === 'save' && (!state.data!.can_save || state.error === 'save_unknown')) return null;
    const draft = state.draft!, errors: Partial<Record<ModelProfileField, import('./model-profile-types.js').ModelProfileIssue>> = {};
    if (!draft.base_url.trim()) errors.base_url = 'required';
    else {try {const url = new URL(draft.base_url); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) errors.base_url = 'url';} catch {errors.base_url = 'url';}}
    if (operation !== 'catalog') {if (!draft.model_name.trim()) errors.model_name = 'required'; if (!draft.real_name.trim()) errors.real_name = 'required';}
    if (!Number.isSafeInteger(draft.timeout_seconds) || draft.timeout_seconds < 0) errors.timeout_seconds = 'integer';
    if (!Number.isSafeInteger(draft.max_concurrency) || draft.max_concurrency < -1 || draft.max_concurrency === 0) errors.max_concurrency = 'integer';
    if (draft.provider_type !== 'openai_embeddings') {try {parseModelPolicy(JSON.parse(state.policyText));} catch {errors.default_policy = 'json';}}
    let credentials: ModelProfileCredentials = {}, credentialsRead = false;
    try {credentials = reader?.() ?? {}; credentialsRead = true;} catch {errors.headers = 'json';}
    // Invalid Headers JSON aborts the view reader before it can return the key.
    // An unavailable key is not evidence that its input is invalid.
    if (credentialsRead && state.apiKeyMode === 'replace' && (!credentials.api_key?.trim() || credentials.api_key.length > 16384 || credentials.api_key === modelProfileStoredKey && !state.data!.has_api_key)) errors.api_key = 'credentials';
    if (state.headersMode === 'replace') {try {parseModelHeaders(credentials.headers);} catch {errors.headers = 'json';}}
    if (Object.keys(errors).length) {publish({errors: Object.freeze(errors)}); return null;}
    const config: ModelProfileCandidate['config'] = {...patch};
    config.api_key = state.apiKeyMode === 'keep' ? state.data!.has_api_key ? modelProfileStoredKey : '' : state.apiKeyMode === 'clear' ? '' : credentials.api_key!;
    if (state.headersMode !== 'keep') config.headers = state.headersMode === 'clear' ? {} : parseModelHeaders(credentials.headers);
    return {...(state.data!.profile_id === null ? {} : {profile_id: state.data!.profile_id, expected_version: state.data!.version!}), config};
  }
  const controller: ModelProfileController = {
    getState: () => state,
    subscribe(listener) {if (dead) return () => {}; listeners.add(listener); return () => {listeners.delete(listener);};},
    async load(id: string | null | undefined = profileId) {if (dead || state.error === 'save_unknown' && state.data?.profile_id === null && !id) return; cancel(); profileId = id ?? undefined; patch = {}; publish({...initialState(), disabled: state.disabled, readOnly: state.readOnly, credentialRevision: state.credentialRevision + 1}); await run('load', signal => service.read(profileId, {signal}));},
    setField(key, value) {
      if (!allowed()) return;
      if (!Object.hasOwn(state.draft!, key)) throw new TypeError('Unknown model field');
      if (key === 'default_policy' && state.draft!.provider_type === 'openai_embeddings' && value !== null) throw new TypeError('Embedding has no chat policy');
      const previous = state.draft!, next = {...previous, [key]: value};
      if (key === 'provider_type') {
        const defaults = state.data!.defaults.find(item => item.provider_type === value); if (!defaults) return;
        // This is an explicit edit of protocol-owned fields from server-provided defaults, not a backend profile merge.
        for (const field of ['default_policy','capabilities','disable_stream'] as const) {Object.assign(next, {[field]: defaults[field]}); Object.assign(patch, {[field]: defaults[field]});}
      }
      if (key === 'default_policy') next.default_policy = parseModelPolicy(value);
      if (key === 'capabilities') next.capabilities = Object.freeze({...value as ModelProfileConfig['capabilities']});
      patch = {...patch, [key]: next[key]};
      invalidate(['provider_type','base_url'].includes(key));
      publish({draft: Object.freeze(next), ...(['provider_type','default_policy'].includes(key) ? {policyText: JSON.stringify(next.default_policy, null, 2)} : {})});
    },
    setPolicyText(value) {if (!allowed()) return; invalidate(); publish({policyText: value}); try {const policy = parseModelPolicy(JSON.parse(value)); patch = {...patch, default_policy: policy}; publish({draft: Object.freeze({...state.draft!, default_policy: policy})});} catch {/* Keep the invalid text for correction; request() blocks all operations. */}},
    setCredentialMode(field, mode) {if (!allowed() || !['keep','replace','clear'].includes(mode)) return; invalidate(true); publish({[field === 'api_key' ? 'apiKeyMode' : 'headersMode']: mode});},
    credentialsChanged() {if (allowed()) invalidate(true);},
    bindCredentials(next) {if (reader) throw new Error('One credential view per model editor'); reader = next; return () => {if (reader === next) reader = undefined;};},
    setEmbeddingTest(input, dimensions) {if (!allowed()) return; invalidate(); publish({embeddingInput: input, embeddingDimensions: dimensions});},
    async catalog() {if (!modelProfileProviders.find(item => item.id === state.draft?.provider_type)?.catalog) return; const input = request('catalog'); if (input) await run('catalog', signal => service.catalog(input, {signal}));},
    async test() {
      const input = request('test'); if (!input) return;
      const embedding = state.draft!.provider_type === 'openai_embeddings';
      if (embedding) {
        const errors: Partial<Record<ModelProfileField, import('./model-profile-types.js').ModelProfileIssue>> = {};
        if (!state.embeddingInput.trim()) errors.embedding_input = 'required';
        else if (state.embeddingInput.length > 16384) errors.embedding_input = 'tooLong';
        if (state.embeddingDimensions !== '' && (!/^\d+$/.test(state.embeddingDimensions) || Number(state.embeddingDimensions) < 1 || !Number.isSafeInteger(Number(state.embeddingDimensions)))) errors.embedding_dimensions = 'integer';
        if (Object.keys(errors).length) {publish({errors: Object.freeze(errors)}); return;}
      }
      const test = {...input, ...(embedding ? {embedding: {input: [state.embeddingInput], ...(state.embeddingDimensions ? {dimensions: Number(state.embeddingDimensions)} : {})}} : {})};
      await run('test', signal => service.test(test, {signal}));
    },
    async save() {const input = request('save'); if (input) await run('save', signal => service.save(input, {signal}));},
    cancel,
    reset() {if (!allowed() || state.error === 'save_unknown') return; cancel(); install(state.data!);},
    clear() {if (dead) return; cancel(); patch = {}; publish({...initialState(), disabled: state.disabled, readOnly: state.readOnly, credentialRevision: state.credentialRevision + 1});},
    update(gates) {if (dead) return; publish({disabled: gates.disabled ?? state.disabled, readOnly: gates.readOnly ?? state.readOnly});},
    destroy() {if (dead) return; controller.clear(); dead = true; resource.destroy(); reader = undefined; listeners.clear();},
  };
  if (options.initial) install(options.initial);
  return Object.freeze(controller);
}
