/** Provider IDs and protocol kinds match agentCore/llmprovider. Defaults are supplied by the backend. */
export const modelProfileProviders = Object.freeze([
  {id: 'openai_completions', label: 'OpenAI Chat Completions', kind: 'chat', catalog: true},
  {id: 'openai_responses', label: 'OpenAI Responses', kind: 'chat', catalog: true},
  {id: 'openai_images', label: 'OpenAI Images', kind: 'image_generation', catalog: true},
  {id: 'openai_embeddings', label: 'OpenAI Embeddings', kind: 'embedding', catalog: true},
  {id: 'gemini', label: 'Gemini', kind: 'chat', catalog: false},
  {id: 'anthropic', label: 'Anthropic', kind: 'chat', catalog: false},
] as const);
for (const provider of modelProfileProviders) Object.freeze(provider);
export type ModelProviderType = typeof modelProfileProviders[number]['id'];
export type ModelProtocolKind = typeof modelProfileProviders[number]['kind'];
export type ModelProfileCapability = 'supports_chat' | 'supports_tool_calls' | 'supports_vision' | 'supports_audio' | 'supports_files' | 'supports_image_generation' | 'supports_embedding';
export type ModelPolicyValue = null | boolean | number | string | readonly ModelPolicyValue[] | {readonly [key: string]: ModelPolicyValue};
/** Public editable projection. Secrets, IDs, test/default-selection facts are not editable fields. */
export interface ModelProfileConfig {
  provider_type: ModelProviderType;
  model_name: string;
  real_name: string;
  base_url: string;
  /** First response body timeout in seconds. 0 delegates to the provider. */
  timeout_seconds: number;
  /** -1 means unlimited, otherwise a positive integer. */
  max_concurrency: number;
  disable_stream: boolean;
  capabilities: Readonly<Partial<Record<ModelProfileCapability, boolean>>>;
  /** Protocol defaults and extensions; embedding uses null. */
  default_policy: Readonly<Record<string, ModelPolicyValue>> | null;
}
/** Display-safe read model. Defaults originate in agentCore via the host backend, never in xui. */
export interface ModelProfileEditorData {
  schema_version: 1;
  profile_id: string | null;
  version: string | null;
  config: Readonly<ModelProfileConfig>;
  /** Available subset of the six fixed protocols, each with authoritative default fields. */
  defaults: readonly Readonly<ModelProfileConfig>[];
  has_api_key: boolean;
  header_names: readonly string[];
  can_save: boolean;
}
export const modelProfileStoredKey = '******' as const;
/** Host-backend DTO, never an agentCore input. The backend merges and resolves plaintext credentials first.
 * api_key=****** reuses the authorized saved key, empty clears, other values replace. Omission preserves the base. */
export interface ModelProfileCandidate {
  profile_id?: string;
  expected_version?: string;
  config: Partial<ModelProfileConfig> & {api_key?: string; headers?: Readonly<Record<string, string>>};
}
export interface ModelCatalogEntry {id: string; owned_by?: string; created_at?: number}
export interface ModelCatalogResult {schema_version: 1; models: readonly ModelCatalogEntry[]}
/** No vectors or raw upstream error bodies are returned to the configuration UI. */
export interface ModelProfileTestResult {
  schema_version: 1;
  kind: ModelProtocolKind;
  passed: boolean;
  elapsed_ms: number;
  /** A display-safe, redacted summary, not an upstream response/body. */
  summary: string;
  embedding?: Readonly<{count: number; dimensions: number}>;
}
export interface ModelProfileTestRequest extends ModelProfileCandidate {
  /** Embedding test input is a request parameter, never a saved profile policy. */
  embedding?: {input: readonly string[]; dimensions?: number};
}
/** Confirmed persistence is independent from probe/completion success. No raw errors or credentials. */
export interface ModelProfileCommittedSave {
  status: 'committed';
  /** Present for classified backend completion failures. Never replay this operation. */
  operation_id?: string;
  /** May be absent only when the backend could not safely identify a committed create. */
  profile_id?: string;
  /** Authoritative saved projection, never a client merge of the submitted draft. */
  editor?: Readonly<ModelProfileEditorData>;
  test_failed: boolean;
  completion_failed: boolean;
}
/** A safe receipt can confirm a write without claiming the model passed verification. */
export type ModelProfileSaveReceipt = ModelProfileCommittedSave | {
  status: 'unknown';
  operation_id?: string;
  profile_id?: string;
};
export interface ModelProfileRequestContext {signal: AbortSignal}
/** No persistence merge, SDK, auth owner or cross-editor draft cache is added by this client. */
export interface ModelProfileAdapter {
  read(profileId: string | undefined, context: ModelProfileRequestContext): Promise<ModelProfileEditorData>;
  catalog(candidate: ModelProfileCandidate, context: ModelProfileRequestContext): Promise<ModelCatalogResult>;
  test(candidate: ModelProfileTestRequest, context: ModelProfileRequestContext): Promise<ModelProfileTestResult>;
  save(candidate: ModelProfileCandidate, context: ModelProfileRequestContext): Promise<ModelProfileEditorData | ModelProfileSaveReceipt>;
}
export type ModelCredentialMode = 'keep' | 'replace' | 'clear';
/** Read once at an explicit operation boundary. Never store these values in controller snapshots. */
export interface ModelProfileCredentials {api_key?: string; headers?: Readonly<Record<string, string>>}
export type ModelProfileOperation = 'load' | 'catalog' | 'test' | 'save';
export type ModelProfileErrorReason = 'version_conflict' | 'network' | 'timeout' | 'cancelled' | 'response' | 'rejected' | 'unavailable';
export type ModelProfileIssue = 'required' | 'url' | 'integer' | 'json' | 'credentials' | 'tooLong';
/** Known chat policy controls. Missing values have no inferred upstream default. */
export type ModelProfilePolicyField = 'max_context_tokens' | 'max_completion_tokens' | 'reasoning_effort';
export type ModelProfileField = keyof ModelProfileConfig | ModelProfilePolicyField | 'api_key' | 'headers' | 'embedding_input' | 'embedding_dimensions';
export interface ModelProfileState {
  readonly data: Readonly<ModelProfileEditorData> | null;
  readonly draft: Readonly<ModelProfileConfig> | null;
  readonly policyText: string;
  readonly dirty: boolean;
  readonly operation: ModelProfileOperation | null;
  readonly catalog: readonly Readonly<ModelCatalogEntry>[] | null;
  readonly testResult: Readonly<ModelProfileTestResult> | null;
  /** Last save receipt. A committed receipt without editor requires a read before further writes. */
  readonly saveReceipt: Readonly<ModelProfileSaveReceipt> | null;
  readonly errors: Readonly<Partial<Record<ModelProfileField, ModelProfileIssue>>>;
  readonly error: 'load' | 'catalog' | 'test' | 'save' | 'save_unknown' | null;
  /** Safe classification only; no Error, HTTP message or credentials. Optional for older custom controllers. */
  readonly errorReason?: ModelProfileErrorReason | null;
  readonly apiKeyMode: ModelCredentialMode;
  readonly headersMode: ModelCredentialMode;
  readonly embeddingInput: string;
  readonly embeddingDimensions: string;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  /** Host-required chat policy fields; omitted by older custom controllers. No HTTP DTO field. */
  readonly requiredPolicyFields?: readonly ModelProfilePolicyField[];
  /** Increments when views must erase secret DOM values. */
  readonly credentialRevision: number;
}
