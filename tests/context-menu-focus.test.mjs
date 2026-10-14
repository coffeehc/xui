import test from 'node:test';
import assert from 'node:assert/strict';
import {bindMenuKeyboardFocus, createContextMenuController} from '../packages/runtime/dist/dom.js';
import {createNavigationMenu} from '../packages/runtime/dist/navigation.js';
import {navigationDOM, fire, key, mockComputedStyle} from './fixtures/navigation-dom.mjs';

// Synchronous controller/event regression tests. Popover placement, browser
// focus algorithms, assistive technology and native key activation need browser QA.
function contextFixture() {
  const f = navigationDOM(), trigger = f.doc.createElement('button'), popup = f.doc.createElement('div');
  const first = f.doc.createElement('button'), disabled = f.doc.createElement('button'), second = f.doc.createElement('button');
  for (const node of [first, disabled, second]) node.setAttribute('role', 'menuitem');
  disabled.disabled = true;
  popup.append(first, disabled, second);
  f.root.append(trigger, popup);
  return {...f, trigger, popup, first, disabled, second};
}

const context = target => fire(target, 'contextmenu', {button: 2, clientX: 60, clientY: 70});

test('menu keyboard projection preserves ownership, initial popup navigation and cleanup', () => {
  const f = contextFixture();
  f.popup.setAttribute('role', 'menu');
  f.first.className = f.second.className = 'xui-menu-item';
  f.first.setAttribute('data-keyboard-active', 'host');
  const release = bindMenuKeyboardFocus(f.popup);
  assert.throws(() => bindMenuKeyboardFocus(f.popup), /already owns/);
  f.popup.focus(); key(f.popup, 'Home'); f.first.focus();
  assert.equal(f.first.getAttribute('data-keyboard-active'), 'true');
  f.second.focus();
  assert.equal(f.first.getAttribute('data-keyboard-active'), null);
  assert.equal(f.second.getAttribute('data-keyboard-active'), 'true');
  fire(f.second, 'pointermove');
  assert.equal(f.second.getAttribute('data-keyboard-active'), null);
  key(f.second, 'Home', {ctrlKey: true});
  assert.equal(f.second.getAttribute('data-keyboard-active'), null);
  key(f.second, 'Home'); f.outside.focus();
  assert.equal(f.second.getAttribute('data-keyboard-active'), null);
  release(); release();
  assert.equal(f.first.getAttribute('data-keyboard-active'), 'host');
  assert.equal(f.second.getAttribute('data-keyboard-active'), null);
  bindMenuKeyboardFocus(f.popup)();
});

test('native ContextMenu leaves trigger expansion and controls owned by the host', () => {
  const f = contextFixture();
  f.trigger.setAttribute('aria-expanded', 'true');
  f.trigger.setAttribute('aria-controls', 'host-child-tree');
  f.trigger.setAttribute('aria-haspopup', 'dialog');
  const owner = createContextMenuController(f.trigger, f.popup);
  const assertHostAttributes = () => {
    assert.equal(f.trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(f.trigger.getAttribute('aria-controls'), 'host-child-tree');
  };
  assertHostAttributes();
  assert.equal(f.trigger.getAttribute('aria-haspopup'), 'menu');
  f.trigger.click(); assert.equal(owner.getOpen(), false);
  assert.equal(context(f.trigger).defaultPrevented, true);
  assert.equal(owner.getOpen(), true);
  assert.equal(f.doc.activeElement, f.first);
  assertHostAttributes();
  key(f.first, 'Escape');
  assert.equal(owner.getOpen(), false);
  assert.equal(f.doc.activeElement, f.trigger);
  assertHostAttributes();
  owner.destroy(); owner.destroy();
  assert.equal(f.trigger.getAttribute('aria-haspopup'), 'dialog');
  assertHostAttributes();
});

test('native ContextMenu creates no trigger expanded/controls attributes and restores only its own haspopup', () => {
  for (const hostChange of [undefined, 'tree', null]) {
    const f = contextFixture(), owner = createContextMenuController(f.trigger, f.popup);
    assert.equal(f.trigger.getAttribute('aria-expanded'), null);
    assert.equal(f.trigger.getAttribute('aria-controls'), null);
    owner.open(); owner.close();
    assert.equal(f.trigger.getAttribute('aria-expanded'), null);
    assert.equal(f.trigger.getAttribute('aria-controls'), null);
    if (hostChange === null) f.trigger.removeAttribute('aria-haspopup');
    else if (hostChange !== undefined) f.trigger.setAttribute('aria-haspopup', hostChange);
    owner.destroy();
    assert.equal(f.trigger.getAttribute('aria-haspopup'), hostChange ?? null);
  }
});

test('native ContextMenu keyboard opening, selection and Escape return to the precise trigger', () => {
  const f = contextFixture(), otherTrigger = f.doc.createElement('button'), otherPopup = f.doc.createElement('div'), otherItem = f.doc.createElement('button');
  otherItem.setAttribute('role', 'menuitem'); otherPopup.append(otherItem); f.root.append(otherTrigger, otherPopup);
  const firstOwner = createContextMenuController(f.trigger, f.popup), secondOwner = createContextMenuController(otherTrigger, otherPopup);
  f.trigger.focus();
  assert.equal(key(f.trigger, 'F10', {shiftKey: true}).defaultPrevented, true);
  assert.equal(f.doc.activeElement, f.first);
  key(f.first, 'ArrowDown'); assert.equal(f.doc.activeElement, f.second, 'menu roving skips disabled items');
  key(f.second, 'Home'); assert.equal(f.doc.activeElement, f.first);
  key(f.first, 'End'); assert.equal(f.doc.activeElement, f.second);
  f.second.click();
  assert.equal(firstOwner.getOpen(), false);
  assert.equal(f.doc.activeElement, f.trigger);
  otherTrigger.focus(); key(otherTrigger, 'ContextMenu');
  assert.equal(secondOwner.getOpen(), true);
  assert.equal(f.doc.activeElement, otherItem);
  key(otherItem, 'Escape');
  assert.equal(secondOwner.getOpen(), false);
  assert.equal(f.doc.activeElement, otherTrigger);
  firstOwner.destroy(); secondOwner.destroy();
});

test('native context selection does not steal newer focus chosen by the host action', () => {
  const f = contextFixture(), owner = createContextMenuController(f.trigger, f.popup);
  let calls = 0;
  f.first.addEventListener('click', () => { calls++; f.outside.focus(); });
  context(f.trigger); f.first.click();
  assert.equal(calls, 1);
  assert.equal(owner.getOpen(), false);
  assert.equal(f.doc.activeElement, f.outside);
  owner.destroy();
});

test('native context closing callback and Escape preserve an already moved outside focus', () => {
  const f = contextFixture();
  const owner = createContextMenuController(f.trigger, f.popup, {onOpenChange(open) { if (!open) f.outside.focus(); }});
  context(f.trigger); key(f.first, 'Escape');
  assert.equal(owner.getOpen(), false);
  assert.equal(f.doc.activeElement, f.outside);
  context(f.trigger); f.outside.focus(); key(f.outside, 'Escape');
  assert.equal(owner.getOpen(), false);
  assert.equal(f.doc.activeElement, f.outside);
  owner.destroy();
});

test('native context descendant opening restores its decorated primary rather than a label child', () => {
  const f = contextFixture(), label = f.doc.createElement('span');
  f.trigger.append(label);
  const owner = createContextMenuController(f.trigger, f.popup);
  context(label);
  assert.equal(owner.getOpen(), true);
  key(f.first, 'Escape');
  assert.equal(f.doc.activeElement, f.trigger);
  owner.destroy();
});

test('native context popup keys do not enter ancestor navigation roving or tree expansion', t => {
  mockComputedStyle(t);
  const f = navigationDOM(), popups = new Map(), expanded = [];
  const owner = createNavigationMenu(f.root, {
    items: [{id: 'branch', label: 'Branch', children: [{id: 'child', label: 'Child', href: '/child'}]}, {id: 'last', label: 'Last', href: '/last'}],
    onExpandedChange: value => expanded.push(value),
    renderAction() { return {element: f.doc.createElement('button')}; },
    decorateItem(primary, value) {
      const popup = f.doc.createElement('div'), first = f.doc.createElement('button'), second = f.doc.createElement('button');
      first.setAttribute('role', 'menuitem'); second.setAttribute('role', 'menuitem');
      popup.append(first, second);
      // Deliberately inside the nav ancestor: DOM events reach its keyboard owner
      // before the document-level context-menu owner.
      primary.parentElement.parentElement.append(popup);
      const controller = createContextMenuController(primary, popup);
      popups.set(value.id, {popup, first, second, controller});
      return {destroy() { controller.destroy(); popup.remove(); }};
    },
  });
  const primary = f.root.querySelectorAll('[data-menu-control]').find(node => node.dataset.menuId === 'branch' && node.dataset.menuControl === 'primary');
  const {first, second, controller} = popups.get('branch');
  const controls = primary.getAttribute('aria-controls');
  primary.focus(); context(primary);
  assert.equal(f.doc.activeElement, first);
  key(first, 'ArrowDown'); assert.equal(f.doc.activeElement, second);
  key(second, 'ArrowUp'); assert.equal(f.doc.activeElement, first);
  key(first, 'End'); assert.equal(f.doc.activeElement, second);
  key(second, 'Home'); assert.equal(f.doc.activeElement, first);
  key(first, 'ArrowLeft'); key(first, 'ArrowRight');
  assert.equal(f.doc.activeElement, first);
  assert.deepEqual(expanded, []);
  assert.equal(primary.getAttribute('aria-expanded'), 'false');
  assert.equal(primary.getAttribute('aria-controls'), controls);
  key(first, 'Escape');
  assert.equal(controller.getOpen(), false);
  assert.equal(f.doc.activeElement, primary);
  assert.equal(f.root.querySelectorAll('[data-menu-control][tabindex="0"]').length, 1);
  owner.destroy();
  assert.equal(primary.getAttribute('aria-haspopup'), null);
  assert.deepEqual(f.root.children, [f.original]);
});

test('native context disabled actions are blocked before host callbacks and destroyed listeners stay inert', () => {
  const f = contextFixture(); let calls = 0;
  f.disabled.addEventListener('click', () => calls++);
  const owner = createContextMenuController(f.trigger, f.popup);
  context(f.trigger);
  assert.equal(fire(f.disabled, 'click', {button: 0}).defaultPrevented, true);
  assert.equal(calls, 0);
  assert.equal(owner.getOpen(), true);
  owner.destroy(); owner.destroy();
  assert.equal(owner.getOpen(), false);
  assert.equal(f.popup.popoverOpen, false);
  context(f.trigger); key(f.trigger, 'ContextMenu'); owner.open();
  assert.equal(owner.getOpen(), false);
});
