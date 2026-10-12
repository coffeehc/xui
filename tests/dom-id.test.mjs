import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {generateDomId} from '../packages/runtime/dist/dom-id.js';
import {createToastController} from '../packages/runtime/dist/dom.js';

// A document identity/lookup model, not a browser or accessibility substitute.
// The browser suite exercises the public built runtime with real native DOM.
function documentModel(ids = []) {
  const mounted = new Set(ids);
  return {
    getElementById: id => mounted.has(id) ? {id} : null,
    querySelector(selector) {
      const prefix = selector.match(/^\[id\^="([^"]+)"\]$/)?.[1];
      assert.ok(prefix, `unexpected selector: ${selector}`);
      const id = [...mounted].find(id => id.startsWith(prefix));
      return id ? {id} : null;
    },
    mounted,
  };
}

for (const mode of ['missing crypto', 'missing randomUUID', 'throwing crypto']) {
  test(`DOM IDs work with ${mode} and do not need time or randomness`, () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    const random = Math.random, now = Date.now;
    try {
      if (mode === 'throwing crypto') Object.defineProperty(globalThis, 'crypto', {configurable: true, get() {throw new Error('crypto must not be accessed');}});
      else Object.defineProperty(globalThis, 'crypto', {configurable: true, value: mode === 'missing crypto' ? undefined : {}});
      Math.random = Date.now = () => {throw new Error('UI IDs do not need random/time seeds');};
      const doc = documentModel();
      assert.equal(generateDomId(doc, 'xui-login'), 'xui-login-1');
      assert.equal(generateDomId(doc, 'xui-login'), 'xui-login-2');
    } finally {
      Math.random = random; Date.now = now;
      if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
      else delete globalThis.crypto;
    }
  });
}

test('independent runtime copies reserve unique IDs before mounting and after removal', async () => {
  const {generateDomId: otherCopy} = await import('../packages/runtime/dist/dom-id.js?independent-runtime-copy');
  const doc = documentModel(), ids = new Set();
  for (let index = 0; index < 4096; index++) {
    const id = (index % 2 ? otherCopy : generateDomId)(doc, 'xui-login');
    assert.match(id, /^xui-login-[a-z0-9]+$/);
    assert.equal(ids.has(id), false);
    ids.add(id);
  }
  const mountedId = generateDomId(doc, 'xui-command');
  doc.mounted.add(mountedId);
  doc.mounted.clear();
  assert.notEqual(otherCopy(doc, 'xui-command'), mountedId);
  assert.equal(Object.keys(doc).some(key => key.includes('xui')), false);
});

test('host IDs and suffixed field/option namespaces are skipped', () => {
  const doc = documentModel(['xui-login-1', 'xui-login-2-username', 'xui-login-3-username-error']);
  assert.equal(generateDomId(doc, 'xui-login'), 'xui-login-4');
  assert.equal(generateDomId(doc, 'xui-login'), 'xui-login-5');
  const command = documentModel(['xui-command-1-0']);
  assert.equal(generateDomId(command, 'xui-command'), 'xui-command-2');
});

test('the owner document, not an ambient window or a module singleton, scopes allocation', () => {
  const first = documentModel(), second = documentModel();
  assert.equal(generateDomId(first, 'xui-popup'), 'xui-popup-1');
  assert.equal(generateDomId(second, 'xui-popup'), 'xui-popup-1');
  assert.equal(generateDomId(first, 'xui-popup'), 'xui-popup-2');
});

test('the counter cannot lose integer precision on a long-lived document', () => {
  const doc = documentModel();
  generateDomId(doc, 'xui-toast');
  doc[Symbol.for('@coffeehc/xui-runtime/dom-id/v1')].next = BigInt(Number.MAX_SAFE_INTEGER);
  const ids = Array.from({length: 4}, () => generateDomId(doc, 'xui-toast'));
  assert.equal(new Set(ids).size, ids.length);
});

test('automatic toast IDs avoid explicit message IDs while explicit replacement still works', () => {
  const doc = documentModel();
  class Element extends EventTarget {
    constructor() {super(); this.ownerDocument = doc; this.children = []; this.dataset = {}; this.classList = {add() {}};}
    setAttribute() {}
    append(...nodes) {for (const node of nodes) {node.parent = this; this.children.push(node);}}
    contains(node) {return node === this || this.children.some(child => child.contains(node));}
    remove() {if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);}
  }
  doc.createElement = () => new Element();
  const viewport = new Element(), toast = createToastController(viewport);
  assert.equal(toast.add({id: 'xui-toast-1', title: 'Explicit'}), 'xui-toast-1');
  const generated = toast.add({title: 'Automatic'});
  assert.notEqual(generated, 'xui-toast-1');
  assert.equal(viewport.children.length, 2);
  assert.equal(viewport.children[0].children[0].textContent, 'Explicit');
  toast.add({id: 'xui-toast-1', title: 'Replaced'});
  assert.equal(viewport.children.length, 2);
  assert.equal(viewport.children[1].children[0].textContent, 'Replaced');
  toast.close(generated);
  assert.equal(viewport.children.length, 1);
  toast.destroy();
  assert.equal(viewport.children.length, 0);
});

test('all native UI UUID callers use the shared built helper without adding a public API', async () => {
  const files = ['login-dom', 'business-log-dom', 'structured-log-dom', 'menu-layout', 'api-key-dom', 'navigation', 'widgets-dom', 'dom'];
  for (const file of files) {
    const code = await readFile(new URL(`../packages/runtime/dist/${file}.js`, import.meta.url), 'utf8');
    assert.match(code, /import \{\s*generateDomId\s*\} from ["']\.\/dom-id\.js["']/);
    assert.doesNotMatch(code, /\brandomUUID\s*\(/);
  }
  const manifest = JSON.parse(await readFile(new URL('../packages/runtime/package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.exports['./dom-id'], undefined);
  const runtime = await import('../packages/runtime/dist/index.js');
  assert.equal('generateDomId' in runtime, false);
  // No UI call site elsewhere may quietly retain this secure-context dependency.
  for (const file of await readdir(new URL('../packages/runtime/src/', import.meta.url))) {
    if (file.endsWith('-dom.ts')) assert.doesNotMatch(await readFile(new URL(`../packages/runtime/src/${file}`, import.meta.url), 'utf8'), /\brandomUUID\s*\(/);
  }
});
