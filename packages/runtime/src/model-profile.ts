import {createResource} from './resource.js';
import {isHttpError} from './http.js';
import {ModelProfileService} from './model-profile-service.js';
import {parseModelProfileEditorData, parseModelPolicy, parseModelHeaders, parseModelCatalog, parseModelProfileTest, parseModelProfileSaveReceipt} from './model-profile-parse.js';
import {modelProfileStoredKey, modelProfileProviders, type ModelProfileAdapter, type ModelProfileCandidate, type ModelProfileConfig, type ModelProfileCredentials, type ModelProfileEditorData, type ModelProfileField, type ModelProfilePolicyField, type ModelProfileOperation, type ModelProfileState, type ModelProfileErrorReason, type ModelCredentialMode, type ModelProfileSaveReceipt} from './model-profile-types.js';
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
  /** Optional host preflight for chat test/save. Catalog remains independent; the backend still validates. */
  requiredPolicyFields?: readonly ModelProfilePolicyField[];
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
  /** Returns only this operation's receipt; cancellation/scope exit cannot return another save's result. */
  save(): Promise<Readonly<ModelProfileSaveReceipt> | undefined>;
  cancel(): void;
  reset(): void;
  /** Clear private view data immediately on identity/scope exit, including injected controllers. */
  clear(): void;
  /** Changes gates/required fields without replacing the draft, issuing IO or cancelling an in-flight operation. */
  update(gates: {disabled?: boolean; readOnly?: boolean; requiredPolicyFields?: readonly ModelProfilePolicyField[]}): void;
  destroy(): void;
}
const initialState = (): ModelProfileState => ({data: null, draft: null, policyText: '', dirty: false, operation: null, catalog: null, testResult: null, saveReceipt: null, errors: {}, error: null, errorReason: null, apiKeyMode: 'keep', headersMode: 'keep', embeddingInput: '', embeddingDimensions: '', disabled: false, readOnly: false, credentialRevision: 0});
const policyFields: readonly ModelProfilePolicyField[] = ['max_context_tokens', 'max_completion_tokens', 'reasoning_effort'];
function errorReason(error: unknown): ModelProfileErrorReason {
  if (isHttpError(error)) {
    if (['http', 'business'].includes(error.kind) && !error.metadata.readFailure && error.code === 40900 && (error.status === 409 || error.kind === 'business' && (error.status === undefined || error.status === 200))) return 'version_conflict';
    if (error.metadata.readFailure === 'timeout') return 'timeout';
    if (error.metadata.readFailure === 'network') return 'network';
    if (error.metadata.readFailure === 'parse') return 'response';
    if (error.kind === 'cancel') return 'cancelled';
    if (error.kind === 'timeout' || error.kind === 'http' && error.status === 504) return 'timeout';
    if (error.kind === 'network') return 'network';
    if (error.kind === 'parse') return 'response';
    if (error.kind === 'business' || error.status !== undefined && error.status >= 400 && error.status < 500) return 'rejected';
  }
  if (error instanceof Error && error.name === 'TimeoutError') return 'timeout';
  if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
  return 'unavailable';
}
function requiredPolicyFields(input: readonly ModelProfilePolicyField[] = []): readonly ModelProfilePolicyField[] {
  if (!Array.isArray(input) || input.some(field => !policyFields.includes(field))) throw new TypeError('Unknown required model policy field');
  return Object.freeze(policyFields.filter(field => input.includes(field)));
}

/** Per-editor draft owner. Sends explicit patches only; effective profile merge belongs to the backend. */
export function createModelProfileController(options: ModelProfileControllerOptions = {}): ModelProfileController {
  const service = options.service ?? ModelProfileService;
  let profileId = options.profileId, state: Readonly<ModelProfileState> = Object.freeze({...initialState(), disabled: !!options.disabled, readOnly: !!options.readOnly, requiredPolicyFields: requiredPolicyFields(options.requiredPolicyFields)});
  let patch: Partial<ModelProfileConfig> = {}, dead = false, reader: (() => ModelProfileCredentials) | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: Partial<ModelProfileState>) => {state = Object.freeze({...state, ...next}); for (const listener of listeners) {try {listener();} catch {/* A view observer cannot change an operation outcome. */}}};
  const install = (input: ModelProfileEditorData, saveReceipt: Readonly<ModelProfileSaveReceipt> | null = null) => {
    const data = parseModelProfileEditorData(input); profileId = data.profile_id ?? undefined; patch = {};
    publish({data, draft: data.config, policyText: JSON.stringify(data.config.default_policy, null, 2), dirty: false, operation: null, errors: {}, error: null, errorReason: null, catalog: null, testResult: null, saveReceipt, embeddingInput: '', embeddingDimensions: '', apiKeyMode: 'keep', headersMode: 'keep', credentialRevision: state.credentialRevision + 1});
  };
  type OperationResult = {operation: ModelProfileOperation; value: unknown};
  let generation = 0;
  let pending: ((signal: AbortSignal) => Promise<unknown>) | undefined;
  const resource = createResource<OperationResult>({timeoutMs: options.timeoutMs ?? 180000, loader: async (operation, signal) => {if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); const task = pending; pending = undefined; if (!task || signal.aborted) throw new DOMException('Cancelled', 'AbortError'); return {operation: operation as ModelProfileOperation, value: await task(signal)};}});
  const needsRead = () => state.saveReceipt?.status === 'committed' && !state.saveReceipt.editor;
  const allowed = () => !needsRead() && !dead && !state.disabled && !state.readOnly && !!state.draft && state.operation !== 'save' && state.operation !== 'load';
  const cancel = () => {const operation = state.operation; generation++; resource.cancel(); pending = undefined; publish({operation: null, ...(operation ? {errorReason: 'cancelled' as const} : {}), ...(operation === 'save' ? {error: 'save_unknown' as const, saveReceipt: Object.freeze({status: 'unknown' as const})} : {})});};
  const invalidate = (connection = false) => {if (state.operation) cancel(); publish({testResult: null, ...(connection ? {catalog: null} : {}), errors: {}, error: state.error === 'save_unknown' ? state.error : null, errorReason: state.error === 'save_unknown' ? state.errorReason : null, dirty: true});};
  async function run(operation: ModelProfileOperation, task: (signal: AbortSignal) => Promise<unknown>): Promise<Readonly<ModelProfileSaveReceipt> | undefined> {
    if (dead || state.operation) return;
    const turn = ++generation; pending = task; publish({operation, error: null, errorReason: null, ...(operation === 'save' ? {saveReceipt: null} : {})});
    await resource.load(operation);
    if (dead || turn !== generation || state.operation !== operation) return;
    const result = resource.getState();
    if (result.status === 'error') {
      // A timeout, cancellation, parse failure or server crash cannot prove a save did not commit.
      const reason = errorReason(result.error);
      const rejected = isHttpError(result.error) && ['http', 'business'].includes(result.error.kind) && !result.error.metadata.readFailure && (result.error.kind === 'business' && typeof result.error.code === 'number' && result.error.code >= 40000 && result.error.code < 50000 || [400, 403, 409, 422].includes(result.error.status ?? 0));
      const cancelledRead = reason === 'cancelled' && (operation === 'test' || operation === 'catalog');
      publish({operation: null, error: operation === 'save' && !rejected ? 'save_unknown' : cancelledRead ? null : operation, errorReason: reason, ...(operation === 'save' && !rejected ? {saveReceipt: Object.freeze({status: 'unknown' as const})} : {})}); return;
    }
    if (result.status !== 'ready') return;
    try {
      if (operation === 'load') {
        const data = parseModelProfileEditorData(result.value!.value);
        if (data.profile_id !== (profileId ?? null)) throw new TypeError('Mismatched model identity');
        install(data);
      }
      else if (operation === 'save') {
        const value = result.value!.value;
        let receipt = parseModelProfileSaveReceipt(value && typeof value === 'object' && Object.hasOwn(value, 'status') ? value : {status: 'committed', editor: value, test_failed: false, completion_failed: false});
        if (profileId !== undefined && receipt.profile_id !== undefined && receipt.profile_id !== profileId) throw new TypeError('Mismatched saved identity');
        if (receipt.profile_id === undefined && profileId !== undefined) receipt = Object.freeze({...receipt, profile_id: profileId});
        if (receipt.profile_id !== undefined) profileId = receipt.profile_id;
        if (receipt.status === 'unknown') {publish({operation: null, error: 'save_unknown', saveReceipt: receipt}); return turn === generation && state.saveReceipt === receipt ? receipt : undefined;}
        if (receipt.editor) install(receipt.editor, receipt);
        else {
          // Commit is authoritative, but the old draft is not a saved projection.
          // Clear secrets/dirty state and lock edits until a deliberate read confirms the version.
          patch = {};
          publish({operation: null, error: null, dirty: false, errors: {}, catalog: null, testResult: null, apiKeyMode: 'clear', headersMode: 'clear', saveReceipt: receipt, credentialRevision: state.credentialRevision + 1});
        }
        return turn === generation && state.saveReceipt === receipt ? receipt : undefined;
      }
      else if (operation === 'catalog') publish({catalog: parseModelCatalog(result.value!.value).models, operation: null});
      else {const test = parseModelProfileTest(result.value!.value); if (test.kind !== modelProfileProviders.find(item => item.id === state.draft!.provider_type)!.kind) throw new TypeError('Mismatched test protocol'); publish({testResult: test, operation: null});}
    } catch {publish({operation: null, error: operation === 'save' ? 'save_unknown' : operation, errorReason: 'response', ...(operation === 'save' ? {saveReceipt: Object.freeze({status: 'unknown' as const})} : {})});}
  }
  function request(operation: 'catalog' | 'test' | 'save'): ModelProfileCandidate | null {
    if (!allowed() || state.operation || operation === 'save' && (!state.data!.can_save || state.error === 'save_unknown' || state.saveReceipt?.status === 'committed' && !state.dirty)) return null;
    const draft = state.draft!, errors: Partial<Record<ModelProfileField, import('./model-profile-types.js').ModelProfileIssue>> = {};
    if (!draft.base_url.trim()) errors.base_url = 'required';
    else {try {const url = new URL(draft.base_url); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) errors.base_url = 'url';} catch {errors.base_url = 'url';}}
    if (operation !== 'catalog') {if (!draft.model_name.trim()) errors.model_name = 'required'; if (!draft.real_name.trim()) errors.real_name = 'required';}
    if (!Number.isSafeInteger(draft.timeout_seconds) || draft.timeout_seconds < 0) errors.timeout_seconds = 'integer';
    if (!Number.isSafeInteger(draft.max_concurrency) || draft.max_concurrency < -1 || draft.max_concurrency === 0) errors.max_concurrency = 'integer';
    if (draft.provider_type !== 'openai_embeddings') {try {parseModelPolicy(JSON.parse(state.policyText));} catch {errors.default_policy = 'json';}}
    if (operation !== 'catalog' && modelProfileProviders.find(provider => provider.id === draft.provider_type)!.kind === 'chat' && !errors.default_policy) {
      for (const field of state.requiredPolicyFields ?? []) {
        const value = draft.default_policy?.[field];
        if (field === 'reasoning_effort') {if (typeof value !== 'string' || !value.trim()) errors[field] = 'required';}
        else if (value === undefined || value === null || value === '') errors[field] = 'required';
        else if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) errors[field] = 'integer';
      }
    }
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
    async load(id: string | null | undefined = profileId) {if (dead || (state.error === 'save_unknown' || needsRead()) && state.data?.profile_id === null && !id) return; cancel(); profileId = id ?? undefined; patch = {}; publish({...initialState(), disabled: state.disabled, readOnly: state.readOnly, requiredPolicyFields: state.requiredPolicyFields, credentialRevision: state.credentialRevision + 1}); await run('load', signal => service.read(profileId, {signal}));},
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
    async save() {const input = request('save'); if (input) return run('save', signal => service.save(input, {signal}));},
    cancel,
    reset() {if (!allowed() || state.error === 'save_unknown') return; cancel(); install(state.data!, state.saveReceipt);},
    clear() {if (dead) return; cancel(); patch = {}; publish({...initialState(), disabled: state.disabled, readOnly: state.readOnly, requiredPolicyFields: state.requiredPolicyFields, credentialRevision: state.credentialRevision + 1});},
    update(gates) {
      if (dead) return;
      const required = gates.requiredPolicyFields === undefined ? state.requiredPolicyFields : requiredPolicyFields(gates.requiredPolicyFields);
      const errors = gates.requiredPolicyFields === undefined ? state.errors : Object.freeze(Object.fromEntries(Object.entries(state.errors).filter(([field]) => !policyFields.includes(field as ModelProfilePolicyField))));
      publish({disabled: gates.disabled ?? state.disabled, readOnly: gates.readOnly ?? state.readOnly, requiredPolicyFields: required, errors});
    },
    destroy() {if (dead) return; controller.clear(); dead = true; resource.destroy(); reader = undefined; listeners.clear();},
  };
  if (options.initial) install(options.initial);
  return Object.freeze(controller);
}
