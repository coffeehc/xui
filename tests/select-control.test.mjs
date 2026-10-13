import test from 'node:test';
import assert from 'node:assert/strict';
import {bindSelectControl} from '../packages/runtime/dist/select-control.js';
import {navigationDOM, fire} from './fixtures/navigation-dom.mjs';

// Identity, host-value bridging and lifecycle checks only. Real popup keyboard
// activation, geometry and accessibility are covered in browser tests.
function fixture({multiple = false, value = 'en'} = {}) {
  const f = navigationDOM(), select = f.doc.createElement('select');
  select.id = 'locale';
  select.setAttribute('aria-label', 'Language');
  select.multiple = multiple;
  for (const [value, label] of [['en', 'English'], ['zh', '中文']]) {
    const option = f.doc.createElement('option');
    option.value = value; option.textContent = label; select.append(option);
  }
  select.value = value;
  f.root.append(select);
  return {...f, select};
}

test('select duplicate binding retains a single owner and reflects host updates', () => {
  const f = fixture(), owner = bindSelectControl(f.select);
  f.select.value = 'zh';
  assert.equal(bindSelectControl(f.select), owner);
  assert.equal(f.root.querySelectorAll('.xui-select-control').length, 1);
  assert.equal(owner.trigger.textContent, '中文');
  assert.equal(owner.trigger.id, 'locale');
  assert.equal(f.select.id, '');
  owner.destroy();
});

test('select unknown value stays empty and multiple selection reflects all selected labels', () => {
  const f = fixture({value: 'unknown'}), owner = bindSelectControl(f.select);
  assert.equal(f.select.value, '');
  assert.equal(owner.trigger.textContent, '');
  assert.ok(owner.element.querySelectorAll('[role="option"]').every(node => node.getAttribute('aria-selected') === 'false'));
  f.select.multiple = true;
  f.select.options[0].selected = true;
  f.select.options[1].selected = true;
  owner.update();
  assert.equal(owner.trigger.textContent, 'English, 中文');
  assert.equal(owner.element.querySelector('[role="listbox"]').getAttribute('aria-multiselectable'), 'true');
  assert.ok(owner.element.querySelectorAll('[role="option"]').every(node => node.getAttribute('aria-selected') === 'true'));
  owner.destroy();
});

test('disabled select and disabled options cannot request a host value change', () => {
  const f = fixture(), owner = bindSelectControl(f.select);
  let changes = 0;
  f.select.addEventListener('change', () => changes++);
  f.select.options[1].disabled = true; owner.update();
  owner.element.querySelectorAll('[role="option"]')[1].click();
  assert.equal(f.select.value, 'en');
  f.select.disabled = true; owner.update();
  assert.equal(owner.trigger.disabled, true);
  owner.trigger.click();
  for (const option of owner.element.querySelectorAll('[role="option"]')) {
    assert.equal(option.disabled, true); option.click();
  }
  assert.equal(changes, 0);
  assert.equal(owner.trigger.getAttribute('aria-expanded'), 'false');
  owner.destroy();
});

test('select update and host change preserve outside focus and report current values', () => {
  const f = fixture(), owner = bindSelectControl(f.select);
  f.outside.focus();
  f.select.value = 'zh'; owner.update();
  assert.equal(f.doc.activeElement, f.outside);
  assert.equal(owner.trigger.textContent, '中文');
  f.select.value = 'en'; fire(f.select, 'change');
  assert.equal(f.doc.activeElement, f.outside);
  assert.equal(owner.trigger.textContent, 'English');
  const option = f.doc.createElement('option'); option.value = 'fr'; option.label = 'Français'; f.select.append(option); owner.update();
  assert.equal(f.doc.activeElement, f.outside);
  assert.equal(owner.element.querySelectorAll('[role="option"]').at(-1).textContent, 'Français');
  owner.destroy();
});

test('destroy restores host attributes and stale handles cannot disturb a new binding', () => {
  const f = fixture(); f.select.tabIndex = 3;
  const first = bindSelectControl(f.select), staleTrigger = first.trigger;
  first.destroy(); first.destroy();
  assert.equal(f.select.parentElement, f.root);
  assert.equal(f.select.hidden, false);
  assert.equal(f.select.tabIndex, 3);
  assert.equal(f.select.id, 'locale');
  const second = bindSelectControl(f.select);
  first.destroy(); first.update(); staleTrigger.click();
  assert.equal(bindSelectControl(f.select), second);
  assert.equal(f.root.querySelectorAll('.xui-select-control').length, 1);
  assert.equal(second.trigger.getAttribute('aria-expanded'), 'false');
  f.select.value = 'zh'; fire(f.select, 'change');
  assert.equal(second.trigger.textContent, '中文');
  second.destroy();
});
