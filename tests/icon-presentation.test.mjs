import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Icon} from '../packages/ui-react/dist/display.js';
import {Badge} from '../packages/ui-react/dist/feedback.js';
import {Avatar} from '../packages/ui-react/dist/avatar.js';

const h=React.createElement;
const render=(Component,props)=>renderToStaticMarkup(h(Component,props));

test('Icon is decorative by default and exposes a named image only when labeled',()=>{
 const decorative=render(Icon,{id:'status-mark',title:'Status',children:'✓'});
 assert.match(decorative,/class="xui-icon"/);
 assert.match(decorative,/aria-hidden="true"/);
 assert.doesNotMatch(decorative,/\srole=|aria-label=|aria-labelledby=/);

 const named=render(Icon,{'aria-label':'Deployment status',children:'✓'});
 assert.match(named,/role="img"/);
 assert.match(named,/aria-label="Deployment status"/);
 assert.doesNotMatch(named,/aria-hidden="true"/);
 const referenced=render(Icon,{'aria-labelledby':'status-name',children:'✓'});
 assert.match(referenced,/role="img"/);
 assert.match(referenced,/aria-labelledby="status-name"/);
});

test('Icon resolves explicit color before style color, maps it to the CSS variable, and never leaks a color attribute',()=>{
 const inherited=render(Icon,{style:{color:'var(--foreground)',marginInlineStart:2}});
 assert.match(inherited,/style="margin-inline-start:2px;--icon-color:var\(--foreground\)"/);
 assert.doesNotMatch(inherited,/\scolor=/);

 const explicit=render(Icon,{color:'var(--action-danger)',style:{color:'var(--foreground)',opacity:.5}});
 assert.match(explicit,/style="opacity:0\.5;--icon-color:var\(--action-danger\)"/);
 assert.doesNotMatch(explicit,/\scolor=/);
 const plain=render(Icon,{});
 assert.doesNotMatch(plain,/--icon-color|\scolor=/);
});

test('Icon blink has no timer contract and uses the default accent only when color is omitted',()=>{
 const blinking=render(Icon,{blink:true,'data-testid':'busy-icon'});
 assert.match(blinking,/data-blink="true"/);
 assert.match(blinking,/data-colored="false"/);
 assert.doesNotMatch(blinking,/--icon-color/);
 assert.match(blinking,/data-testid="busy-icon"/);

 const colored=render(Icon,{blink:true,color:'var(--status-warning-foreground)'});
 assert.match(colored,/data-blink="true"/);
 assert.match(colored,/data-colored="true"/);
 assert.match(colored,/--icon-color:var\(--status-warning-foreground\)/);
 assert.doesNotMatch(colored,/--icon-color:var\(--action-primary\)/);
});

test('Badge keeps legacy tone defaults while explicit variant and foreground remain opt-in',()=>{
 const neutral=render(Badge,{children:'New'});
 assert.match(neutral,/data-tone="neutral"/);
 assert.match(neutral,/data-variant="plain"/);
 const status=render(Badge,{tone:'success',children:'Ready'});
 assert.match(status,/data-tone="success"/);
 assert.match(status,/data-variant="soft"/);

 const explicit=render(Badge,{tone:'neutral',variant:'soft',color:'var(--action-primary)',style:{color:'var(--foreground)',marginInlineStart:4},className:'host-badge'});
 assert.match(explicit,/class="xui-badge host-badge"/);
 assert.match(explicit,/data-variant="soft"/);
 assert.match(explicit,/style="color:var\(--action-primary\);margin-inline-start:4px"/);
 assert.doesNotMatch(explicit,/\scolor=/);
 const plain=render(Badge,{tone:'warning',variant:'plain',children:'Notice'});
 assert.match(plain,/data-variant="plain"/);
});

test('Avatar.Root preserves peer props, callback style state, className, and ref while applying color',()=>{
 const ref=React.createRef(),sentinel={initial:true};let received;
 const style=state=>{received=state;return {color:'var(--foreground)',opacity:.7};};
 const element=Avatar.Root({
  ref,size:'lg',color:'var(--action-primary)',style,className:'host-avatar',
  id:'member-avatar','aria-label':'Member','data-testid':'member-avatar',
 });
 assert.equal(element.props.ref,ref);
 assert.equal(element.props.id,'member-avatar');
 assert.equal(element.props['aria-label'],'Member');
 assert.equal(element.props['data-testid'],'member-avatar');
 assert.match(element.props.className,/xui-avatar/);
 assert.match(element.props.className,/host-avatar/);
 assert.equal(typeof element.props.style,'function');
 assert.deepEqual(element.props.style(sentinel),{color:'var(--action-primary)',opacity:.7});
 assert.equal(received,sentinel);
});
