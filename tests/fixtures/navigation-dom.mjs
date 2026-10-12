// Lightweight identity, selector, event-propagation and focus model for native
// controller unit tests. This is not a browser, layout or accessibility check.
export function navigationDOM() {
  class Target extends EventTarget {
    listeners = new Map();
    addEventListener(type, callback, options = false) {
      if (!callback) return;
      const capture = typeof options === 'boolean' ? options : !!options.capture;
      const listeners = this.listeners.get(type) ?? [];
      if (!listeners.some(value => value.callback === callback && value.capture === capture)) {
        listeners.push({callback, capture, once: !!options?.once});
        this.listeners.set(type, listeners);
      }
    }
    removeEventListener(type, callback, options = false) {
      const capture = typeof options === 'boolean' ? options : !!options.capture;
      this.listeners.set(type, (this.listeners.get(type) ?? []).filter(value => value.callback !== callback || value.capture !== capture));
    }
    dispatchEvent(event) {
      const path = [this];
      for (let parent = this.parentNode; parent; parent = parent.parentNode) path.push(parent);
      let stopped = false, immediate = false;
      Object.defineProperties(event, {
        target: {configurable: true, value: this},
        currentTarget: {configurable: true, writable: true, value: null},
        stopPropagation: {configurable: true, value() { stopped = true; }},
        stopImmediatePropagation: {configurable: true, value() { stopped = immediate = true; }},
        composedPath: {configurable: true, value: () => [...path]},
      });
      const deliver = (target, capture) => {
        event.currentTarget = target;
        for (const listener of [...(target.listeners.get(event.type) ?? [])]) {
          if (immediate) break;
          if (listener.capture !== capture) continue;
          if (!(target.listeners.get(event.type) ?? []).includes(listener)) continue;
          if (listener.once) target.removeEventListener(event.type, listener.callback, capture);
          if (typeof listener.callback === 'function') listener.callback.call(target, event);
          else listener.callback.handleEvent(event);
        }
        if (!capture && !immediate) target[`on${event.type}`]?.(event);
      };
      for (const target of [...path].reverse()) {
        deliver(target, true);
        if (stopped) break;
      }
      if (!stopped) {
        deliver(this, false);
        if (event.bubbles) for (const target of path.slice(1)) {
          if (stopped) break;
          deliver(target, false);
        }
      }
      event.currentTarget = null;
      return !event.defaultPrevented;
    }
  }
  const doc = new Target(), win = new Target();
  const dataName = name => `data-${name.replace(/[A-Z]/g, value => `-${value.toLowerCase()}`)}`;
  class Element extends Target {
    constructor(tag = 'div', namespaceURI = 'http://www.w3.org/1999/xhtml') {
      super();
      this.tagName = tag.toUpperCase();
      this.nodeType = 1;
      this.namespaceURI = namespaceURI;
      this.ownerDocument = doc;
      this.children = [];
      this.attributes = new Map();
      this.style = {};
      this.dataset = new Proxy({}, {
        get: (_, name) => this.getAttribute(dataName(name)) ?? undefined,
        set: (_, name, value) => { this.setAttribute(dataName(name), value); return true; },
        deleteProperty: (_, name) => { this.removeAttribute(dataName(name)); return true; },
      });
      this.classList = {
        contains: name => this.className.split(/\s+/).includes(name),
        add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
        remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); },
      };
    }
    get childNodes() { return this.children; }
    get parentElement() { return this.parentNode?.nodeType === 1 ? this.parentNode : null; }
    get firstElementChild() { return this.children[0] ?? null; }
    get lastElementChild() { return this.children.at(-1) ?? null; }
    get isConnected() { return this === doc.body || !!this.parentNode?.isConnected; }
    get id() { return this.getAttribute('id') ?? ''; }
    set id(value) { this.setAttribute('id', value); }
    get className() { return this.getAttribute('class') ?? ''; }
    set className(value) { this.setAttribute('class', value); }
    get title() { return this.getAttribute('title') ?? ''; }
    set title(value) { this.setAttribute('title', value); }
    get type() { return this.getAttribute('type') ?? ''; }
    set type(value) { this.setAttribute('type', value); }
    get hidden() { return this.hasAttribute('hidden'); }
    set hidden(value) { this.toggleAttribute('hidden', value); }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { this.toggleAttribute('disabled', value); }
    get tabIndex() { return Number(this.getAttribute('tabindex') ?? (this.matches('button,a[href],input') ? 0 : -1)); }
    set tabIndex(value) { this.setAttribute('tabindex', value); }
    get textContent() { return this.text ?? this.children.map(child => child.textContent).join(''); }
    set textContent(value) { this.replaceChildren(); this.text = String(value); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    toggleAttribute(name, force) {
      const next = force ?? !this.hasAttribute(name);
      if (next) this.setAttribute(name, ''); else this.removeAttribute(name);
      return next;
    }
    append(...nodes) { for (const node of nodes) this.insertBefore(node, null); }
    insertBefore(node, before) {
      if (before === node) return node;
      if (node.parentNode) node.parentNode.children.splice(node.parentNode.children.indexOf(node), 1);
      const index = before ? this.children.indexOf(before) : this.children.length;
      if (index < 0) throw new Error('insertBefore reference is not a child');
      this.children.splice(index, 0, node);
      node.parentNode = this;
      this.text = undefined;
      return node;
    }
    remove() {
      if (this.contains(doc.activeElement)) doc.activeElement = doc.body;
      if (this.parentNode) this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1);
      this.parentNode = null;
    }
    replaceChildren(...nodes) { for (const node of [...this.children]) node.remove(); this.text = undefined; this.append(...nodes); }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    walk() { return [this, ...this.children.flatMap(child => child.walk())]; }
    matches(selector) {
      return selector.split(',').some(part => {
        let candidate = part.trim(), valid = true;
        candidate = candidate.replace(/:not\(([^)]+)\)/g, (_, inner) => { valid &&= !this.matches(inner); return ''; });
        candidate = candidate.replace(/:disabled/g, () => { valid &&= this.disabled; return ''; });
        candidate = candidate.replace(/\[([\w-]+)(?:(\^?=)["']?([^"'\]]*)["']?)?\]/g, (_, name, operator, value) => {
          const actual = this.getAttribute(name);
          valid &&= operator === '=' ? actual === value : operator === '^=' ? actual?.startsWith(value) === true : actual !== null;
          return '';
        });
        candidate = candidate.replace(/\.([\w-]+)/g, (_, name) => { valid &&= this.classList.contains(name); return ''; });
        return valid && (!candidate || candidate === '*' || candidate.toUpperCase() === this.tagName);
      });
    }
    closest(selector) { for (let node = this; node?.nodeType === 1; node = node.parentNode) if (node.matches(selector)) return node; return null; }
    querySelectorAll(selector) { return this.walk().slice(1).filter(node => node.matches(selector)); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
    getClientRects() { return this.isConnected && !this.closest('[hidden]') ? [{}] : []; }
    getBoundingClientRect() { return {left: 20, top: 20, right: 120, bottom: 50, width: 100, height: 30}; }
    scrollIntoView() {}
    showPopover() { this.popoverOpen = true; }
    hidePopover() { this.popoverOpen = false; }
    focus() {
      if (!this.isConnected || this.disabled || this.closest('[hidden]') || doc.activeElement === this) return;
      const previous = doc.activeElement;
      doc.activeElement = this;
      if (previous) {
        fire(previous, 'blur', {relatedTarget: this}, {bubbles: false});
        fire(previous, 'focusout', {relatedTarget: this});
      }
      fire(this, 'focus', {relatedTarget: previous}, {bubbles: false});
      fire(this, 'focusin', {relatedTarget: previous});
    }
    click() { if (!this.disabled) return fire(this, 'click', {button: 0}); }
  }
  doc.createElement = tag => new Element(tag);
  doc.createElementNS = (namespaceURI, tag) => new Element(tag, namespaceURI);
  doc.body = new Element('body');
  doc.body.parentNode = doc;
  doc.activeElement = doc.body;
  doc.getElementById = id => doc.body.walk().find(node => node.id === id) ?? null;
  doc.querySelector = selector => doc.body.querySelector(selector);
  doc.querySelectorAll = selector => doc.body.querySelectorAll(selector);
  doc.baseURI = 'https://example.test/';
  doc.location = {href: doc.baseURI};
  doc.defaultView = win;
  win.innerWidth = 1024;
  win.innerHeight = 768;
  win.getComputedStyle = node => ({direction: node.direction ?? 'ltr'});
  const root = doc.createElement('div'), original = doc.createElement('p'), outside = doc.createElement('button');
  original.textContent = 'Original host content';
  root.append(original);
  doc.body.append(root, outside);
  return {doc, win, root, original, outside};
}

export function fire(target, type, properties = {}, options = {}) {
  const event = new Event(type, {bubbles: true, cancelable: true, ...options});
  Object.assign(event, {ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...properties});
  target.dispatchEvent(event);
  return event;
}

export const key = (target, value, properties = {}) => fire(target, 'keydown', {key: value, ...properties});

export function mockComputedStyle(t) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'getComputedStyle');
  Object.defineProperty(globalThis, 'getComputedStyle', {configurable: true, value: node => node.ownerDocument.defaultView.getComputedStyle(node)});
  t.after(() => { if (original) Object.defineProperty(globalThis, 'getComputedStyle', original); else delete globalThis.getComputedStyle; });
}
