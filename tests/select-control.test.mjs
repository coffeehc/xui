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

test('an open select consumes Escape before its enclosing layer and a closed select lets it pass',async()=>{
  const f=fixture(),owner=bindSelectControl(f.select);let outerEscapes=0;
  f.root.addEventListener('keydown',event=>{if(event.key==='Escape')outerEscapes++;});
  owner.trigger.click();await Promise.resolve();const option=owner.element.querySelector('[role="option"]');option.focus();
  const first=fire(option,'keydown',{key:'Escape'});assert.equal(first.defaultPrevented,true);assert.equal(outerEscapes,0);assert.equal(owner.trigger.getAttribute('aria-expanded'),'false');assert.equal(f.doc.activeElement,owner.trigger);
  const second=fire(owner.trigger,'keydown',{key:'Escape'});assert.equal(second.defaultPrevented,false);assert.equal(outerEscapes,1);owner.destroy();
});

test('a cancelled select close consumes only its own Escape and retains current popup focus',async()=>{
  const f=fixture(),owner=bindSelectControl(f.select);owner.trigger.click();await Promise.resolve();const option=owner.element.querySelector('[role="option"]');option.focus();
  owner.element.addEventListener('xui:change',event=>{if(event.detail.value===false)event.preventDefault();});
  const escape=fire(option,'keydown',{key:'Escape'});assert.equal(escape.defaultPrevented,true);assert.equal(owner.trigger.getAttribute('aria-expanded'),'true');assert.equal(f.doc.activeElement,option);owner.destroy();
});

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

test('form reset reads post-default facts, respects cancellation and releases former forms',async()=>{
  const f=fixture(),first=new EventTarget(),second=new EventTarget();f.select.form=first;const owner=bindSelectControl(f.select);
  f.select.value='zh';owner.update();const reset=new Event('reset',{cancelable:true});first.dispatchEvent(reset);f.select.value='en';await Promise.resolve();assert.equal(owner.trigger.textContent,'English');
  f.select.value='zh';owner.update();const canceled=new Event('reset',{cancelable:true});canceled.preventDefault();first.dispatchEvent(canceled);await Promise.resolve();assert.equal(owner.trigger.textContent,'中文');
  f.select.form=second;owner.update();f.select.value='en';first.dispatchEvent(new Event('reset'));await Promise.resolve();assert.equal(owner.trigger.textContent,'中文');second.dispatchEvent(new Event('reset'));await Promise.resolve();assert.equal(owner.trigger.textContent,'English');
  second.dispatchEvent(new Event('reset'));owner.destroy();await Promise.resolve();assert.equal(f.root.querySelector('.xui-select-control'),null);
});

test('hidden optgroups stay hidden and group labels remain visible',()=>{
  const f=fixture(),hidden=f.doc.createElement('optgroup'),visible=f.doc.createElement('optgroup');hidden.hidden=true;hidden.label='Hidden group';visible.label='Visible group';
  const hiddenOption=f.doc.createElement('option'),visibleOption=f.doc.createElement('option');hiddenOption.value='secret';hiddenOption.textContent='Hidden value';visibleOption.value='grouped';visibleOption.textContent='Grouped value';hidden.append(hiddenOption);visible.append(visibleOption);f.select.append(hidden,visible);
  const owner=bindSelectControl(f.select);assert.ok(!owner.element.querySelectorAll('[role="option"]').some(node=>node.textContent==='Hidden value'));assert.equal(owner.element.querySelector('[role="group"]').getAttribute('aria-label'),'Visible group');owner.destroy();
});

test('binding transfers initial focus and respects host tabindex without changing the bridge fact',()=>{
  const f=fixture();f.select.tabIndex=-1;f.select.focus();const owner=bindSelectControl(f.select);assert.equal(f.doc.activeElement,owner.trigger);assert.equal(owner.trigger.tabIndex,-1);
  f.select.tabIndex=2;owner.update();assert.equal(owner.trigger.tabIndex,2);owner.destroy();assert.equal(f.select.tabIndex,2);
});

test('hidden form bridge stays excluded from accessibility and restores its original aria fact',()=>{
  const f=fixture(),owner=bindSelectControl(f.select);assert.equal(f.select.getAttribute('aria-hidden'),'true');owner.destroy();assert.equal(f.select.getAttribute('aria-hidden'),null);
});

test('popup remeasurement preserves scrolling when a temporary larger cap clamps the viewport', async () => {
  const {createPopoverController}=await import('../packages/runtime/dist/dom.js');
  const f=navigationDOM(),trigger=f.doc.createElement('button'),popup=f.doc.createElement('div');
  f.root.append(trigger,popup);popup.scrollTop=600;popup.scrollLeft=20;
  let cap='',measurements=0;Object.defineProperty(popup.style,'maxHeight',{get:()=>cap,set:value=>{measurements++;cap=value;popup.scrollTop=Math.max(0,popup.scrollTop-100);}});
  const owner=createPopoverController(trigger,popup);owner.open();
  assert.equal(popup.scrollTop,600);assert.equal(popup.scrollLeft,20);
  const measured=measurements;fire(popup,'scroll');assert.equal(measurements,measured,'internal scrolling does not reposition its own popup');
  owner.destroy();
});
