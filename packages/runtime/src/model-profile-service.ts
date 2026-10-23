import {HTTPService, isHttpError, parseAjaxResponse, createAjaxResponseAdapter, ajaxErrorResponseAdapter, type HttpClient, type ErrorResponseAdapter} from './http.js';
import {modelProfileStoredKey, type ModelProfileAdapter, type ModelProfileCandidate, type ModelProfileTestRequest, type ModelProfileRequestContext, type ModelProfileSaveReceipt} from './model-profile-types.js';
import {parseModelProfileEditorData, parseModelCatalog, parseModelProfileTest, parseModelProfilePatch, parseModelProfileSaveFailure} from './model-profile-parse.js';

export const modelProfileEndpoints = Object.freeze({editor: '/api/v1/model-profiles/editor', catalog: '/api/v1/model-profiles/actions/catalog', test: '/api/v1/model-profiles/actions/test', profiles: '/api/v1/model-profiles'});
const identifier = (value: string) => {if (typeof value !== 'string' || !value.trim() || value.length > 256 || /[\u0000-\u001f]/.test(value)) throw new TypeError('Invalid model profile identity'); return value;};
function candidate(input: ModelProfileCandidate): ModelProfileCandidate {
  if (Object.keys(input).some(key => !['profile_id','expected_version','config'].includes(key))) throw new TypeError('Invalid model profile request');
  if ((input.profile_id === undefined) !== (input.expected_version === undefined)) throw new TypeError('Profile identity requires its version');
  if (input.config.api_key === modelProfileStoredKey && input.profile_id === undefined) throw new TypeError('Stored key marker requires a profile identity');
  return {...(input.profile_id === undefined ? {} : {profile_id: identifier(input.profile_id), expected_version: identifier(input.expected_version!)}), config: parseModelProfilePatch(input.config)};
}
export interface ModelProfileClientOptions {
  /** Borrow the application's existing HTTP/auth client. Never creates a second transport. */
  http: HttpClient;
  /** Includes backend queueing and probe time. Default 180 seconds; no automatic replay. */
  operationTimeoutMs?: number;
}
/** Fixed shared backend facade. Projects implement this contract; xui does not translate product endpoints. */
export class ModelProfileClient implements ModelProfileAdapter {
  private readonly http: HttpClient;
  private readonly timeout: number;
  constructor({http, operationTimeoutMs = 180000}: ModelProfileClientOptions) {
    if (!Number.isSafeInteger(operationTimeoutMs) || operationTimeoutMs < 1 || operationTimeoutMs > 2147483647) throw new TypeError('Invalid model operation deadline');
    this.http = http; this.timeout = operationTimeoutMs;
  }
  private async request<T>(path: string, method: string, json: unknown, parse: (value: unknown) => T, context: ModelProfileRequestContext, timeoutMs: number, errorAdapter: ErrorResponseAdapter = ajaxErrorResponseAdapter): Promise<T> {
    const ajax = createAjaxResponseAdapter();
    const result = await this.http.request(path, {method, ...(json === undefined ? {} : {json}), signal: context.signal, timeoutMs, response: 'ajax', cache: 'no-store', credentials: 'omit', redirect: 'error', endpointId: 'modelProfiles.' + (method === 'GET' ? 'read' : 'operation'), errorAdapter, adapter: (value, response) => {const data = ajax(value, response); return {...data, payload: parse(data.payload)};}});
    return result.payload as T;
  }
  read(profileId: string | undefined, context: ModelProfileRequestContext) {
    return this.request(modelProfileEndpoints.editor + (profileId === undefined ? '' : '?' + new URLSearchParams({profile_id: identifier(profileId)})), 'GET', undefined, parseModelProfileEditorData, context, 30000);
  }
  catalog(input: ModelProfileCandidate, context: ModelProfileRequestContext) {
    return this.request(modelProfileEndpoints.catalog, 'POST', candidate(input), parseModelCatalog, context, 30000);
  }
  test(input: ModelProfileTestRequest, context: ModelProfileRequestContext) {
    const {embedding, ...profile} = input;
    if (embedding && (!Array.isArray(embedding.input) || !embedding.input.length || embedding.input.length > 2048 || embedding.input.some(text => typeof text !== 'string' || !text.trim() || text.length > 16384) || embedding.dimensions !== undefined && (!Number.isSafeInteger(embedding.dimensions) || embedding.dimensions < 1))) throw new TypeError('Invalid embedding test input');
    return this.request(modelProfileEndpoints.test, 'POST', {...candidate(profile), ...(embedding ? {embedding} : {})}, parseModelProfileTest, context, this.timeout);
  }
  async save(input: ModelProfileCandidate, context: ModelProfileRequestContext) {
    const body = candidate(input), path = modelProfileEndpoints.profiles + (body.profile_id === undefined ? '' : '/' + encodeURIComponent(body.profile_id));
    // Scope-specific projection: the shared transport does not retain raw error payloads.
    let receipt: Readonly<ModelProfileSaveReceipt> | undefined, receiptCode: number | undefined;
    const errorAdapter: ErrorResponseAdapter = (value, response) => {
      const wire = parseAjaxResponse(value);
      if (!wire.success && response.status === 503 && [50310, 50311, 50312].includes(wire.code)) {
        const parsed = parseModelProfileSaveFailure(wire.payload, wire.code);
        if (body.profile_id !== undefined && parsed.profile_id !== undefined && body.profile_id !== parsed.profile_id) throw new TypeError('Mismatched saved identity');
        receipt = parsed; receiptCode = wire.code;
      }
      return ajaxErrorResponseAdapter(wire, response);
    };
    try {return await this.request(path, body.profile_id === undefined ? 'POST' : 'PUT', body, parseModelProfileEditorData, context, this.timeout, errorAdapter);}
    catch (error) {
      if (!context.signal.aborted && receipt && isHttpError(error) && ['http', 'business'].includes(error.kind) && error.code === receiptCode && !error.metadata.readFailure) return receipt;
      throw error;
    }
  }
}
/** Importing is inert. The shared HTTP module resolves bootstrap configuration only when an operation runs. */
export const ModelProfileService: ModelProfileAdapter = Object.freeze(new ModelProfileClient({http: HTTPService}));
