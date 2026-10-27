import {modelProfileStoredKey, modelProfileProviders, type ModelProfileConfig, type ModelProfileEditorData, type ModelProfileCandidate} from '@coffeehc/xui-runtime/model-profile';
/** Synthetic fixture only. These numbers are NOT xui/agentCore defaults. No storage or upstream calls. */
const defaults: ModelProfileConfig[] = modelProfileProviders.map((provider): ModelProfileConfig => ({provider_type: provider.id, model_name: '', real_name: '', base_url: 'https://models.example.test/v1', timeout_seconds: 0, max_concurrency: 6, disable_stream: provider.kind !== 'chat', capabilities: provider.kind === 'chat' ? {supports_chat: true, supports_tool_calls: true} : provider.kind === 'embedding' ? {supports_embedding: true} : {supports_image_generation: true}, default_policy: provider.kind === 'embedding' ? null : provider.kind === 'chat' ? {max_context_tokens: 128000, max_completion_tokens: 8192} : {}}));
const saved: Record<string, ModelProfileEditorData> = {
  'example-chat': {schema_version: 1, profile_id: 'example-chat', version: '1', config: {...defaults[1], model_name: '团队日常助手', real_name: 'example-chat'}, defaults, has_api_key: true, header_names: ['X-Workspace'], can_save: true},
  'example-embedding': {schema_version: 1, profile_id: 'example-embedding', version: '1', config: {...defaults[3], model_name: '知识检索向量', real_name: 'example-embedding'}, defaults, has_api_key: true, header_names: [], can_save: true},
};
const held: (() => void)[] = [];
export const mockModelAPI = {
  feedback: null as {status:number;code?:number;message?:string;summary?:string;hold?:boolean} | null,
  releaseFeedback() {held.splice(0).forEach(resolve => resolve());},
  behavior: 'success' as 'success' | 'empty' | 'failure' | 'slow' | 'unknown' | 'test_failed' | 'completion_failed' | 'both_failed' | 'committed_no_id' | 'conflict' | 'probe_failed' | 'network',
  requests: [] as {method: string; path: string; fields: string[]; usesSavedKey: boolean; profileId?: string; expectedVersion?: string; headerKeys: string[]}[],
  /** Transport-level mock: the real public client still serializes, validates and handles HTTP errors. */
  fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url), method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) as ModelProfileCandidate : undefined;
    mockModelAPI.requests.push({method, path: url.pathname, fields: Object.keys(body?.config ?? {}), profileId: body?.profile_id, expectedVersion: body?.expected_version, headerKeys: Object.keys(body?.config.headers ?? {}), usesSavedKey: !!body?.profile_id && (body?.config.api_key === modelProfileStoredKey || !Object.hasOwn(body?.config ?? {}, 'api_key'))});
    const behavior = mockModelAPI.behavior, feedback = url.pathname.endsWith('/test') ? mockModelAPI.feedback : null;
    if (feedback?.hold) await new Promise<void>(resolve => held.push(resolve));
    await new Promise<void>((resolve, reject) => {const timer = setTimeout(done, behavior === 'slow' ? 3000 : 400); function abort() {clearTimeout(timer); init?.signal?.removeEventListener('abort', abort); reject(new DOMException('Cancelled', 'AbortError'));} function done() {init?.signal?.removeEventListener('abort', abort); resolve();} if (init?.signal?.aborted) abort(); else init?.signal?.addEventListener('abort', abort, {once: true});});
    const response = (payload: unknown, status = 200, code = status === 200 ? 1 : status === 503 ? 50301 : 40901) => new Response(JSON.stringify({success: status === 200, message: status === 200 ? '' : feedback?.message ?? 'Mock rejection', payload, request_id: 'mock-model-request', code}), {status, headers: {'Content-Type': 'application/json'}});
    if (feedback && feedback.status !== 200) return response(null, feedback.status, feedback.code ?? feedback.status * 100);
    if (behavior === 'conflict' && method !== 'GET') return response(null, 409, 40900);
    if (behavior === 'network') throw new TypeError('SYNTHETIC_PRIVATE_NETWORK_ERROR');
    if (behavior === 'failure') return response(null, 409);
    if (method === 'GET') {
      const id = url.searchParams.get('profile_id');
      return response(id ? saved[id] : {schema_version: 1, profile_id: null, version: null, config: defaults[1], defaults, has_api_key: false, header_names: [], can_save: true});
    }
    if (url.pathname.endsWith('/catalog')) return response({schema_version: 1, models: behavior === 'empty' ? [] : ['example-chat','example-reasoning','example-vision','example-embedding',...Array.from({length: 24}, (_, i) => `example-model-${i + 1}`)].map(id => ({id, owned_by: 'Mock provider'}))});
    if (body?.config.api_key === modelProfileStoredKey && (!body.profile_id || !saved[body.profile_id]?.has_api_key)) return response(null, 409);
    const base = body?.profile_id ? saved[body.profile_id].config : defaults[1];
    const effective = {...base, ...body!.config};
    if (url.pathname.endsWith('/test')) {
      const kind = modelProfileProviders.find(item => item.id === effective.provider_type)!.kind;
      const request = body as ModelProfileCandidate & {embedding?: {input: string[]; dimensions?: number}};
      if (feedback?.summary !== undefined) return response({schema_version: 1, kind, passed: false, elapsed_ms: 30, summary: feedback.summary});
      if (behavior === 'probe_failed') return response({schema_version: 1, kind, passed: false, elapsed_ms: 30, summary: '上游拒绝 reasoning_effort=high；支持 xhigh（默认）、medium、low。'});
      return response({schema_version: 1, kind, passed: true, elapsed_ms: 428, summary: kind === 'embedding' ? '已完成文本编码，向量维度与请求一致。' : kind === 'image_generation' ? '图片生成协议返回有效结果。' : '已收到有效回复，连接可用。', ...(kind === 'embedding' ? {embedding: {count: request.embedding?.input.length ?? 1, dimensions: request.embedding?.dimensions ?? 768}} : {})});
    }
    const id = body!.profile_id ?? 'example-new', existing = saved[id];
    if (existing && body!.expected_version !== existing.version) return response(null, 409);
    const {api_key, headers, ...config} = effective;
    saved[id] = {schema_version: 1, profile_id: id, version: String(Number(existing?.version ?? 0) + 1), config, defaults, has_api_key: api_key === undefined || api_key === modelProfileStoredKey ? !!existing?.has_api_key : !!api_key, header_names: headers === undefined ? existing?.header_names ?? [] : Object.keys(headers), can_save: true};
    // Committed mock write with a lost acknowledgement: exercises no blind replay.
    if (behavior === 'unknown') return response({outcome: 'unknown', operation_id: 'mock-operation', ...(body!.profile_id ? {profile_id: body!.profile_id} : {}), test_failed: false, completion_failed: false}, 503, 50310);
    if (['test_failed', 'completion_failed', 'both_failed', 'committed_no_id'].includes(behavior)) {
      const testFailed = behavior === 'test_failed' || behavior === 'both_failed', completionFailed = behavior !== 'test_failed';
      return response({outcome: 'committed', operation_id: 'mock-operation', ...(behavior === 'committed_no_id' ? {} : {profile_id: id}), test_failed: testFailed, completion_failed: completionFailed, ...(!completionFailed ? {editor: saved[id]} : {})}, 503, completionFailed ? 50311 : 50312);
    }
    return response(saved[id]);
  }) as typeof fetch,
};
