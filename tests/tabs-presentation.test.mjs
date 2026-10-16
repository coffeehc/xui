import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Tabs} from '../packages/ui-react/dist/tabs.js';

const h=React.createElement;
function renderTabs(layout,variant){
 const listRef=React.createRef();
 const html=renderToStaticMarkup(h(Tabs.Root,{defaultValue:'overview',className:'host-root','data-testid':'tab-root'},
  h(Tabs.List,{
   ...(layout===undefined?{}:{layout}),...(variant===undefined?{}:{variant}),id:'section-tabs',ref:listRef,
   className:'host-tabs','aria-label':'Workspace sections','data-testid':'workspace-tabs',
   loopFocus:false,
  },
   h(Tabs.Tab,{value:'overview'},h(Tabs.Icon,{
    id:'overview-icon',className:'host-icon',color:'var(--action-primary)',blink:true,
    'data-testid':'tab-icon',
   },'◉'),'Overview'),
   h(Tabs.Tab,{value:'activity'},'Activity'),
  ),
  h(Tabs.Panel,{value:'overview'},'Overview panel'),
  h(Tabs.Panel,{value:'activity'},'Activity panel'),
 ));
 // A DOM ref is intentionally unresolved during SSR; passing it alongside
 // peer props still exercises the declared React element contract.
 assert.equal(listRef.current,null);
 return html;
}

test('Tabs.List defaults to content layout and forwards peer DOM attributes and className',()=>{
 const html=renderTabs(undefined);
 assert.match(html,/class="xui-tabs host-root"/);assert.match(html,/data-testid="tab-root"/);
 assert.match(html,/role="tablist"/);
 assert.match(html,/data-layout="content"/);
 assert.match(html,/id="section-tabs"/);
 assert.match(html,/aria-label="Workspace sections"/);
 assert.match(html,/data-testid="workspace-tabs"/);
 assert.match(html,/class="xui-tabs-list host-tabs"/);
 assert.match(html,/Overview panel/);
 assert.doesNotMatch(html,/Activity panel/,'inactive panels follow the peer Tabs mount policy');
});

test('Tabs.List exposes equal layout without replacing its peer tab semantics',()=>{
 const html=renderTabs('equal');
 assert.match(html,/role="tablist"/);
 assert.match(html,/data-layout="equal"/);
 assert.match(html,/role="tab"[^>]*aria-selected="true"/);
 assert.match(html,/role="tab"[^>]*aria-selected="false"/);
 assert.match(html,/role="tabpanel"/);
 assert.match(html,/id="section-tabs"/);
 assert.match(html,/class="xui-tabs-list host-tabs"/);
});

test('Tabs.Icon forwards span attributes and presentation while remaining decorative to its Tab',()=>{
 const html=renderTabs('content');
 const icon=/<span\b(?=[^>]*id="overview-icon")[^>]*>/.exec(html)?.[0];
 assert.ok(icon,'the tab icon is rendered as a span');
 assert.match(icon,/class="xui-icon xui-tab-icon host-icon"/);
 assert.match(icon,/data-testid="tab-icon"/);
 assert.match(icon,/data-blink="true"/);
 assert.match(icon,/style="--icon-color:var\(--action-primary\)"/);
 assert.match(icon,/aria-hidden="true"/);
 assert.doesNotMatch(icon,/role="img"|aria-label=|aria-labelledby=/);
 assert.match(html,/aria-label="Workspace sections"/);
});

test('line is an optional visual list variant, retaining selected/Panel semantics and default segmented',()=>{assert.match(renderTabs(undefined),/data-variant="segmented"/);const html=renderTabs('equal','line');assert.match(html,/data-variant="line"/);assert.match(html,/data-layout="equal"/);assert.match(html,/role="tab"[^>]*aria-selected="true"/);assert.match(html,/Overview panel/);assert.doesNotMatch(html,/ variant=/);});

test('Tabs text slots preserve full accessible text and keep icons/metadata outside the moving label',()=>{
 const html=renderTabs('content','line');
 assert.match(html,/<span class="xui-overflow-text xui-tab-label"><span class="xui-overflow-text-content">Overview<\/span><\/span>/);
 assert.doesNotMatch(html,/<span class="xui-overflow-text-content">[^<]*◉/);
 const composed=renderToStaticMarkup(h(Tabs.Root,{defaultValue:1},h(Tabs.List,{'aria-label':'Labels'},h(Tabs.Tab,{value:1},h(Tabs.Label,{text:'名称 & <safe>'}),h('span',{'data-count':true},3)),h(Tabs.Tab,{value:2},42))));
 assert.match(composed,/名称 &amp; &lt;safe&gt;/);assert.match(composed,/<span data-count="true">3<\/span>/);assert.match(composed,/<span class="xui-overflow-text-content">42<\/span>/);
 assert.doesNotMatch(composed,/title=|interactionRef=|aria-hidden="true"/);
});
