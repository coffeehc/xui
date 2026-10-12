import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigationMenu} from '../packages/runtime/dist/navigation.js';
import {navigationDOM, fire, key, mockComputedStyle} from './fixtures/navigation-dom.mjs';

// Unit coverage uses an explicit DOM/event model, not browser rendering or a11y.
const item = (id, overrides = {}) => ({id, label: id, href: `/${id}`, ...overrides});
const control = (root, id, kind = 'primary') => root.querySelectorAll('[data-menu-control]').find(node => node.dataset.menuId === id && node.dataset.menuControl === kind);

function slots(f) {
  const records = [];
  const create = (kind, element, value, state) => {
    const record = {kind, element, id: value.id, updates: [], destroyed: 0, initial: {...state}};
    records.push(record);
    return {element, update(next, nextState) { record.updates.push({item: next, state: {...nextState}}); }, destroy() { record.destroyed++; }};
  };
  return {
    records,
    renderLabel: (value, state) => create('label', f.doc.createElement('span'), value, state),
    renderAction: (value, state) => create('action', f.doc.createElement('button'), value, state),
    decorateItem: (element, value, state) => create('decoration', element, value, state),
  };
}

test('native navigation slots retain identities by id and receive current item and row state', () => {
  const f = navigationDOM(), factory = slots(f);
  const first = item('branch', {children: [item('leaf')]}), second = item('other');
  const owner = createNavigationMenu(f.root, {items: [first, second], activeId: null, expandedIds: [], ...factory});
  const primary = control(f.root, 'branch'), action = control(f.root, 'branch', 'action');
  const label = factory.records.find(record => record.kind === 'label' && record.id === 'branch').element;
  const updated = {...first, label: 'Renamed branch'};
  action.focus();
  owner.update({items: [second, updated], activeId: 'branch', collapsed: true, expandedIds: ['branch']});
  assert.equal(control(f.root, 'branch'), primary);
  assert.equal(control(f.root, 'branch', 'action'), action);
  assert.equal(primary.querySelector('.xui-menu-label').firstElementChild, label);
  assert.equal(f.doc.activeElement, action);
  assert.equal(factory.records.length, 9, 'same factories do not recreate retained slots');
  for (const record of factory.records.filter(record => record.id === 'branch')) {
    assert.equal(record.updates.at(-1).item, updated);
    assert.deepEqual(record.updates.at(-1).state, {active: true, collapsed: true, expanded: true, disabled: false});
    assert.equal(record.destroyed, 0);
  }
  owner.destroy();
});

test('native replacement, removal and repeated destroy release each slot lifecycle exactly once', () => {
  const f = navigationDOM(), before = slots(f), after = slots(f);
  const owner = createNavigationMenu(f.root, {items: [item('one'), item('two')], ...before});
  const primary = control(f.root, 'one');
  owner.update(after);
  assert.equal(control(f.root, 'one'), primary, 'factory replacement retains the navigation control');
  assert.ok(before.records.every(record => record.destroyed === 1));
  owner.update({items: [item('two')]});
  assert.ok(after.records.filter(record => record.id === 'one').every(record => record.destroyed === 1));
  assert.ok(after.records.filter(record => record.id === 'two').every(record => record.destroyed === 0));
  owner.destroy();
  owner.destroy();
  owner.update({items: [item('late')]});
  assert.ok([...before.records, ...after.records].every(record => record.destroyed === 1));
  assert.deepEqual(f.root.children, [f.original]);
});

test('native kind replacement releases all old slots and only decorates interactive primaries', () => {
  const f = navigationDOM(), factory = slots(f);
  const owner = createNavigationMenu(f.root, {items: [item('same')], ...factory});
  let previous = control(f.root, 'same');
  for (const value of [item('same', {href: undefined}), item('same', {href: undefined, group: true}), item('same')]) {
    const before = [...factory.records];
    owner.update({items: [value]});
    assert.ok(before.every(record => record.destroyed === 1));
    const primary = f.root.querySelectorAll('[data-menu-id]').find(node => node.dataset.menuId === 'same' && node.dataset.menuControl !== 'action');
    assert.notEqual(primary, previous);
    previous = primary;
  }
  assert.equal(factory.records.filter(record => record.kind === 'decoration').length, 3, 'a group heading has no interactive decorator');
  assert.equal(factory.records.filter(record => record.kind === 'label').length, 4);
  assert.equal(factory.records.filter(record => record.kind === 'action').length, 4);
  owner.destroy();
  assert.ok(factory.records.every(record => record.destroyed === 1));
});

test('native inherited disabled guards host actions and is fully removed on re-enable', () => {
  const f = navigationDOM(), calls = [], states = [];
  const items = disabled => [item('parent', {disabled, children: [item('child'), item('host-disabled')]})];
  const owner = createNavigationMenu(f.root, {items: items(false), defaultExpandedIds: ['parent'], renderAction(value) {
    const button = f.doc.createElement('button');
    button.disabled = value.id === 'host-disabled';
    button.addEventListener('click', () => calls.push(value.id));
    return {element: button, update(next, state) { states.push([next.id, state.disabled]); }};
  }});
  const child = control(f.root, 'child', 'action'), hostDisabled = control(f.root, 'host-disabled', 'action');
  child.click();
  owner.update({items: items(true)});
  assert.equal(child.disabled, true);
  assert.equal(control(f.root, 'child').getAttribute('aria-disabled'), 'true');
  assert.equal(control(f.root, 'child').getAttribute('href'), null);
  const suppressed = fire(child, 'click', {button: 0});
  assert.equal(suppressed.defaultPrevented, true, 'capture guard also blocks programmatically dispatched clicks');
  assert.deepEqual(calls, ['child']);
  owner.update({items: items(false)});
  assert.equal(child.disabled, false);
  assert.equal(hostDisabled.disabled, true, 'library inheritance must not clear the host disabled state');
  assert.equal(control(f.root, 'child').getAttribute('aria-disabled'), 'false');
  assert.equal(control(f.root, 'child').getAttribute('href'), '/child');
  assert.ok(states.some(([id, disabled]) => id === 'child' && disabled));
  child.click();
  assert.deepEqual(calls, ['child', 'child']);
  owner.destroy();
});

test('native action factory replacement starts with the new factory disabled state', () => {
  const f = navigationDOM();
  const owner = createNavigationMenu(f.root, {items: [item('one', {disabled: true})], renderAction: () => ({element: f.doc.createElement('button')})});
  owner.update({renderAction() { const element = f.doc.createElement('button'); element.disabled = true; return {element}; }});
  owner.update({items: [item('one')]});
  assert.equal(control(f.root, 'one', 'action').disabled, true, 'the old slot inherited-disabled bookkeeping cannot overwrite its replacement');
  owner.destroy();
});

test('native action is one sibling button and invokes no navigation or expansion', () => {
  const f = navigationDOM(), actions = [], navigations = [], expansions = [];
  const owner = createNavigationMenu(f.root, {
    items: [item('branch', {children: [item('child')]})],
    navigation: {navigate: value => navigations.push(value)}, onExpandedChange: value => expansions.push(value),
    renderAction(value) {
      const button = f.doc.createElement('button'), content = f.doc.createElement('span');
      content.textContent = '⋯'; button.append(content);
      button.addEventListener('click', () => actions.push(value.id));
      return {element: button};
    },
  });
  const primary = control(f.root, 'branch'), action = control(f.root, 'branch', 'action'), toggle = control(f.root, 'branch', 'toggle');
  assert.equal(action.tagName, 'BUTTON');
  assert.equal(action.type, 'button');
  assert.equal(action.parentElement, primary.parentElement);
  assert.equal(action.parentElement, toggle.parentElement);
  assert.equal(primary.contains(action), false);
  assert.equal(action.querySelector('button,a'), null);
  assert.ok(action.getAttribute('aria-label'));
  fire(action.firstElementChild, 'click', {button: 0});
  assert.deepEqual(actions, ['branch']);
  assert.deepEqual(navigations, []);
  assert.deepEqual(expansions, []);
  assert.deepEqual(owner.getState().expandedIds, []);
  primary.click();
  assert.equal(navigations.length, 1, 'the separate link still uses the navigation adapter');
  toggle.click();
  assert.deepEqual(expansions, [['branch']]);
  owner.destroy();
});

test('native action roving includes Up/Down/Home/End and ignores tree Left/Right in LTR and RTL', t => {
  mockComputedStyle(t);
  for (const direction of ['ltr', 'rtl']) {
    const f = navigationDOM(), expansions = [];
    const owner = createNavigationMenu(f.root, {
      items: [item('branch', {children: [item('hidden')]}), item('locked', {disabled: true}), item('last')],
      onExpandedChange: value => expansions.push(value), renderAction: () => ({element: f.doc.createElement('button')}),
    });
    owner.getElement().direction = direction;
    const primary = control(f.root, 'branch'), toggle = control(f.root, 'branch', 'toggle'), action = control(f.root, 'branch', 'action');
    const last = control(f.root, 'last'), lastAction = control(f.root, 'last', 'action');
    primary.focus();
    for (const expected of [toggle, action, last, lastAction, primary]) {
      assert.equal(key(f.doc.activeElement, 'ArrowDown').defaultPrevented, true);
      assert.equal(f.doc.activeElement, expected);
    }
    key(primary, 'ArrowUp'); assert.equal(f.doc.activeElement, lastAction);
    key(lastAction, 'Home'); assert.equal(f.doc.activeElement, primary);
    key(primary, 'End'); assert.equal(f.doc.activeElement, lastAction);
    action.focus();
    key(action, 'ArrowLeft'); key(action, 'ArrowRight');
    assert.equal(f.doc.activeElement, action);
    assert.deepEqual(expansions, []);
    owner.setExpanded('branch', true);
    const childAction = control(f.root, 'hidden', 'action');
    childAction.focus(); key(childAction, 'ArrowLeft'); key(childAction, 'ArrowRight');
    assert.equal(f.doc.activeElement, childAction, 'a child action does not move focus to its parent');
    assert.deepEqual(expansions, [['branch']]);
    assert.equal(f.root.querySelectorAll('[data-menu-control][tabindex="0"]').length, 1);
    owner.destroy();
  }
});

test('native slot update does not reclaim a newer host-selected outside focus', () => {
  const f = navigationDOM();
  const owner = createNavigationMenu(f.root, {items: [item('one')], renderAction() {
    const element = f.doc.createElement('button');
    return {element, update(value) { if (value.label === 'focus outside') f.outside.focus(); }};
  }});
  control(f.root, 'one', 'action').focus();
  owner.update({items: [item('one', {label: 'focus outside'})]});
  assert.equal(f.doc.activeElement, f.outside);
  owner.destroy();
});

test('native removal and destruction run host listener cleanup and leave stale handles inert', () => {
  const f = navigationDOM(); let calls = 0, destroys = 0;
  const owner = createNavigationMenu(f.root, {items: [item('one')], renderAction() {
    const element = f.doc.createElement('button'), click = () => calls++;
    element.addEventListener('click', click);
    return {element, destroy() { destroys++; element.removeEventListener('click', click); }};
  }});
  const action = control(f.root, 'one', 'action');
  action.click(); owner.update({items: []}); action.click();
  owner.destroy(); owner.destroy(); owner.update({items: [item('one')]});
  assert.equal(calls, 1);
  assert.equal(destroys, 1);
  assert.deepEqual(f.root.children, [f.original]);
});

test('native label and action slots reject nested interactive content', () => {
  for (const kind of ['label-button', 'label-focusable', 'action-wrapper', 'action-link']) {
    const f = navigationDOM();
    const renderLabel = kind.startsWith('label') ? () => {
      const element = f.doc.createElement('span'), child = f.doc.createElement(kind === 'label-button' ? 'button' : 'span');
      if (kind === 'label-focusable') child.tabIndex = 0;
      element.append(child); return {element};
    } : undefined;
    const renderAction = kind.startsWith('action') ? () => {
      const element = f.doc.createElement(kind === 'action-wrapper' ? 'div' : 'button');
      if (kind === 'action-link') element.append(f.doc.createElement('a'));
      return {element};
    } : undefined;
    assert.throws(() => createNavigationMenu(f.root, {items: [item('one')], renderLabel, renderAction}), TypeError, kind);
  }
});

test('native slot updates cannot add interactive label or action descendants', () => {
  for (const kind of ['renderLabel', 'renderAction']) {
    const f = navigationDOM();
    const owner = createNavigationMenu(f.root, {items: [item('one')], [kind]() {
      const element = f.doc.createElement(kind === 'renderAction' ? 'button' : 'span');
      return {element, update(value) { if (value.label === 'invalid') element.append(f.doc.createElement('input')); }};
    }});
    assert.throws(() => owner.update({items: [item('one', {label: 'invalid'})]}), TypeError);
    owner.destroy();
  }
});

test('native action fallback names update with labels without replacing host-authored names', () => {
  const f = navigationDOM();
  const owner = createNavigationMenu(f.root, {items: [item('one')], renderAction: () => ({element: f.doc.createElement('button')})});
  const action = control(f.root, 'one', 'action');
  assert.equal(action.getAttribute('aria-label'), 'Actions for one');
  owner.update({items: [item('one', {label: 'Renamed'})]});
  assert.equal(action.getAttribute('aria-label'), 'Actions for Renamed');
  assert.equal(action.title, 'Actions for Renamed');
  action.setAttribute('aria-label', 'Host actions'); action.title = 'Host tooltip';
  owner.update({items: [item('one', {label: 'Another name'})]});
  assert.equal(action.getAttribute('aria-label'), 'Host actions');
  assert.equal(action.title, 'Host tooltip');
  owner.destroy();
});

test('native failed initial slot rendering releases acquired lifecycles and leaves the root reusable', () => {
  const f = navigationDOM(), destroyed = [], failure = new Error('Host factory failed');
  assert.throws(() => createNavigationMenu(f.root, {
    items: [item('one')],
    renderLabel: () => ({element: f.doc.createElement('span'), destroy() { destroyed.push('label'); }}),
    renderAction: () => ({element: f.doc.createElement('button'), destroy() { destroyed.push('action'); }}),
    decorateItem() { throw failure; },
  }), failure);
  assert.deepEqual(destroyed, ['label', 'action']);
  assert.deepEqual(f.root.children, [f.original]);
  const next = createNavigationMenu(f.root, {items: [item('new')]});
  assert.ok(control(f.root, 'new'));
  next.destroy();
});

test('native a throwing replacement factory cannot destroy an already released lifecycle twice', () => {
  for (const kind of ['renderLabel', 'renderAction', 'decorateItem']) {
    const f = navigationDOM(), factory = slots(f), failure = new Error(`${kind} failed`);
    const owner = createNavigationMenu(f.root, {items: [item('one')], ...factory});
    assert.throws(() => owner.update({[kind]() { throw failure; }}), failure);
    owner.destroy();
    assert.ok(factory.records.every(record => record.destroyed === 1), `${kind} cleanup must be exactly once after an update failure`);
    assert.deepEqual(f.root.children, [f.original]);
  }
});
