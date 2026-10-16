import test from 'node:test';
import assert from 'node:assert/strict';
import {XuiServices} from '../packages/runtime/dist/services.js';
import {HttpError} from '../packages/runtime/dist/http.js';
import {createUploadController} from '../packages/runtime/dist/upload.js';

const baseURL = 'https://upload.fixture.test/api/';
const user = {id: '42', username: 'uploader', display_name: 'Uploader'};
const token = `bs-v1-sha256-access-${'A'.repeat(43)}`;
const wire = (payload = null, extra = {}) => ({success: true, message: '', payload, request_id: 'upload:request', code: 200, ...extra});
const json = (payload, status = 200, extra = {}) => new Response(JSON.stringify(payload), {status, headers: {'Content-Type': 'application/json', ...extra}});
const issued = (accessToken = token) => ({schema_version: 2, user, access_token: accessToken, token_type: 'Bearer', expires_at: new Date(Date.now() + 300_000).toISOString()});
const session = {schema_version: 2, user};
const makeFile = (name, contents = 'file', type = 'text/plain') => new File([contents], name, {type});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
};
const flush = async () => {
  for (let index = 0; index < 32; index++) await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));
};
const response = payload => Object.freeze({payload, status: 200, headers: Object.freeze({contentType: 'application/json'})});

function isolatedServices(fetch, http = {}) {
  return new XuiServices({http: {options: {baseURL, fetch, ...http}}});
}

test('UploadService posts the named file and metadata through the shared HTTP contract', async () => {
  const calls = [];
  const services = isolatedServices(async (url, init) => {
    calls.push({url, init});
    return json(wire({assetId: 'asset-7', accepted: true}), 201);
  }, {headers: {'Content-Type': 'application/json'}});

  try {
    const upload = services.getUploadService();
    assert.equal(services.getUploadService(), upload);
    const file = makeFile('records.csv', 'id,name\n7,Example', 'text/csv');
    const result = await upload.request('files', file, {
      fields: {purpose: 'records'},
      endpointId: 'files:create',
    });

    assert.equal(result.status, 201);
    assert.deepEqual(result.payload, {assetId: 'asset-7', accepted: true});
    assert.equal(calls.length, 1);
    const [{url, init}] = calls;
    assert.equal(url, 'https://upload.fixture.test/api/files');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.get('accept'), 'application/json');
    assert.equal(init.headers.get('content-type'), null, 'the browser must choose the multipart boundary');
    assert.equal(init.body.get('purpose'), 'records');
    assert.deepEqual([...init.body.keys()], ['purpose', 'file']);
    const uploaded = init.body.get('file');
    assert.equal(uploaded.name, 'records.csv');
    assert.equal(await uploaded.text(), 'id,name\n7,Example');
  } finally {
    services.dispose();
  }
});

test('UploadService uses a 120-second default budget and sends a failed write only once', async t => {
  t.mock.timers.enable({apis: ['setTimeout']});
  const held = deferred();
  let sends = 0;
  const services = isolatedServices(async () => { sends++; return held.promise; });
  try {
    const pending = services.getUploadService().request('/slow', makeFile('slow.txt'));
    const outcome = pending.then(value => ({value}), error => ({error}));
    await flush();
    assert.equal(sends, 1);
    t.mock.timers.tick(119_999);
    await flush();
    assert.equal(sends, 1);
    t.mock.timers.tick(1);
    const settled = await outcome;
    assert.equal(settled.error.kind, 'timeout');
    assert.equal(sends, 1, 'a lost write response must not be replayed automatically');

    let rejectedSends = 0;
    const failed = isolatedServices(async () => {
      rejectedSends++;
      return new Response('unavailable', {status: 503});
    });
    try {
      await assert.rejects(failed.getUploadService().request('/unavailable', makeFile('once.txt')), error => error instanceof HttpError && error.status === 503);
      assert.equal(rejectedSends, 1);
    } finally {
      failed.dispose();
    }
  } finally {
    services.dispose();
  }
});

test('UploadService rejects runtime attempts to override the one-shot multipart write', () => {
  const services = isolatedServices(async () => { throw new Error('must not send invalid options'); });
  try {
    const upload = services.getUploadService();
    const file = makeFile('contract.txt');
    for (const options of [
      {method: 'PUT'},
      {body: 'not multipart'},
      {json: {file: 'not multipart'}},
      {retry: {idempotentRead: true, maxAttempts: 2}},
    ]) assert.throws(() => upload.request('/files', file, options), TypeError);
  } finally {
    services.dispose();
  }
});

test('UploadController snapshots are immutable; validation and count rejection never dispatch IO', async () => {
  const calls = [];
  const service = {request: async (_path, file) => { calls.push(file.name); return response({stored: file.name}); }};
  const controller = createUploadController({path: '/files', service, multiple: true, maxFiles: 3, maxFileSize: 4, accept: '.txt,image/*'});
  const before = controller.getState();

  controller.add([
    makeFile('large.txt', '12345'),
    makeFile('script.exe', 'x', 'application/octet-stream'),
    makeFile('valid.txt', '1234'),
  ]);
  const selected = controller.getState();
  assert.equal(before.files.length, 0);
  assert.equal(Object.isFrozen(before), true);
  assert.equal(Object.isFrozen(selected.files), true);
  assert.deepEqual(selected.files.map(file => [file.file.name, file.status, file.validation]), [
    ['large.txt', 'invalid', 'size'],
    ['script.exe', 'invalid', 'type'],
    ['valid.txt', 'queued', undefined],
  ]);
  assert.equal(calls.length, 0, 'selection only queues work');

  const ids = selected.files.map(file => file.id);
  controller.add([makeFile('overflow.txt')]);
  assert.equal(controller.getState().selectionError, 'count');
  assert.deepEqual(controller.getState().files.map(file => file.id), ids, 'count rejection leaves the prior batch intact');
  assert.equal(calls.length, 0);

  controller.start();
  await flush();
  assert.deepEqual(calls, ['valid.txt']);
  assert.deepEqual(controller.getState().files.map(file => file.status), ['invalid', 'invalid', 'success']);
  controller.destroy();
});

test('UploadController concurrency preserves partial success and retries only an explicitly failed row', async () => {
  const calls = [];
  const service = {request(_path, file, options) {
    const task = deferred();
    calls.push({name: file.name, signal: options.signal, ...task});
    return task.promise;
  }};
  const controller = createUploadController({path: '/files', service, multiple: true, maxFiles: 3, concurrency: 2});
  controller.add(['one.txt', 'two.txt', 'three.txt'].map(name => makeFile(name)));
  const ids = controller.getState().files.map(file => file.id);

  controller.start();
  controller.start();
  assert.deepEqual(calls.map(call => call.name), ['one.txt', 'two.txt']);
  assert.equal(controller.getState().busy, true);

  calls[0].resolve(response({id: 'one'}));
  calls[1].reject(new Error('server reply was lost'));
  await flush();
  assert.deepEqual(calls.map(call => call.name), ['one.txt', 'two.txt', 'three.txt']);
  assert.deepEqual(controller.getState().files.map(file => file.status), ['success', 'error', 'uploading']);
  assert.equal(controller.getState().files[1].resultUnknown, true);

  controller.retry(ids[1]);
  controller.retry(ids[1]);
  controller.start();
  assert.deepEqual(calls.map(call => call.name), ['one.txt', 'two.txt', 'three.txt', 'two.txt']);
  calls[2].resolve(response({id: 'three'}));
  calls[3].resolve(response({id: 'two-retry'}));
  await flush();
  assert.deepEqual(controller.getState().files.map(file => file.status), ['success', 'success', 'success']);
  assert.equal(calls.length, 4, 'repeated start/retry does not create duplicate writes');
  controller.destroy();
});

test('UploadController isolates late results and abort-callback reentry across cancel, remove, clear and destroy', async () => {
  for (const stop of ['cancel', 'remove', 'clear', 'destroy']) {
    const held = deferred();
    let controller;
    let id;
    let writes = 0;
    const service = {request(_path, _file, {signal}) {
      writes++;
      signal.addEventListener('abort', () => {
        controller.retry(id);
        controller.start(id);
        controller.remove(id);
        controller.clear();
      }, {once: true});
      return held.promise;
    }};
    controller = createUploadController({path: '/files', service});
    controller.add([makeFile(`${stop}.txt`)]);
    id = controller.getState().files[0].id;
    controller.start(id);
    assert.equal(writes, 1);

    if (stop === 'cancel') controller.cancel(id);
    else if (stop === 'remove') controller.remove(id);
    else if (stop === 'clear') controller.clear();
    else controller.destroy();

    const stopped = controller.getState();
    assert.equal(stopped.busy, false);
    if (stop === 'cancel') {
      assert.equal(stopped.files[0].status, 'canceled');
      assert.equal(stopped.files[0].resultUnknown, true);
    } else {
      assert.deepEqual(stopped.files, []);
    }

    held.resolve(response({id: 'late'}));
    await flush();
    assert.equal(controller.getState(), stopped, 'an obsolete response cannot publish a replacement snapshot');
    assert.equal(writes, 1, 'abort callbacks cannot create an untracked write');
    controller.destroy();
  }
});

test('UploadController links external abort signals and keeps disabled/readOnly actions inert', async () => {
  const preAborted = new AbortController();
  preAborted.abort();
  let preAbortedWrites = 0;
  const preAbortedController = createUploadController({path: '/files', request: {signal: preAborted.signal}, service: {request: async () => { preAbortedWrites++; return response({}); }}});
  preAbortedController.add([makeFile('already-stopped.txt')]);
  preAbortedController.start();
  await flush();
  assert.equal(preAbortedWrites, 0);
  assert.equal(preAbortedController.getState().files[0].status, 'canceled');
  assert.equal(preAbortedController.getState().files[0].resultUnknown, false);
  preAbortedController.destroy();

  const external = new AbortController();
  const held = deferred();
  let writes = 0;
  let internalSignal;
  const controller = createUploadController({path: '/files', request: {signal: external.signal}, service: {request: async (_path, _file, options) => { writes++; internalSignal = options.signal; return held.promise; }}});
  controller.add([makeFile('active.txt')]);
  const id = controller.getState().files[0].id;
  controller.update({disabled: true});
  controller.start();
  assert.equal(writes, 0);
  controller.remove(id);
  controller.clear();
  assert.equal(controller.getState().files.length, 1, 'interaction gates do not erase the caller-owned selection');

  controller.update({disabled: false, readOnly: true});
  controller.start();
  assert.equal(writes, 0);
  controller.remove(id);
  assert.equal(controller.getState().files.length, 1);
  controller.cancel(id);
  assert.equal(controller.getState().files[0].status, 'canceled', 'owner cancellation remains available through a view gate');

  controller.update({readOnly: false});
  controller.retry(id);
  assert.equal(writes, 1);
  external.abort();
  assert.equal(internalSignal.aborted, true);
  await flush();
  assert.equal(controller.getState().files[0].status, 'canceled');
  assert.equal(controller.getState().files[0].resultUnknown, true);
  const stopped = controller.getState();
  held.resolve(response({id: 'late'}));
  await flush();
  assert.equal(controller.getState(), stopped);
  assert.equal(writes, 1);
  controller.destroy();
});

test('UploadService shares the configured HTTP/Auth owner and never replays a rejected write', async () => {
  const calls = [];
  let denyUpload = false;
  const services = new XuiServices({
    http: {options: {
      baseURL,
      fetch: async (url, init) => {
        const path = new URL(url).pathname;
        calls.push({path, init});
        if (path === '/api/v1/auth/login') return json(wire(issued()));
        if (path === '/api/v1/auth/refresh') return json(wire(issued()));
        if (path === '/api/v1/auth/session') return json(wire(session));
        if (path === '/api/private/files' && denyUpload) return json(wire(null, {success: false, message: 'Denied', code: 40101}), 401);
        if (path === '/api/private/files') return json(wire({id: 'private-1'}));
        throw new Error(`Unexpected request ${path}`);
      },
    }},
    auth: {options: {protectedPaths: ['/api/private/'], timeoutMs: 1_000}},
  });

  try {
    const auth = services.getAuthService();
    assert.equal(await auth.login({username: user.username, password: 'fixture-password'}), auth.getState().user);
    const upload = services.getUploadService();
    const result = await upload.request('/api/private/files', makeFile('private.txt'));
    assert.deepEqual(result.payload, {id: 'private-1'});
    const successfulWrite = calls.find(call => call.path === '/api/private/files');
    assert.equal(successfulWrite.init.credentials, 'omit');
    assert.equal(successfulWrite.init.headers.get('authorization'), `Bearer ${token}`);

    denyUpload = true;
    await assert.rejects(upload.request('/api/private/files', makeFile('denied.txt')), error => error instanceof HttpError && error.status === 401);
    await flush();
    assert.equal(calls.filter(call => call.path === '/api/private/files').length, 2, 'a 401 write is not automatically replayed after auth recovery');
  } finally {
    services.dispose();
  }
});
