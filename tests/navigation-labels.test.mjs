import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NavigationMenu} from '../packages/ui-react/dist/menu-layout.js';

const team=label=>({id:'team',label,href:'?sessionId=manager',children:[{id:'member',label:'成员',href:'?sessionId=member'}]});
const zh={expandBranchLabel:item=>`展开 ${item.label}`,collapseBranchLabel:item=>`收起 ${item.label}`};

test('React branch names preserve English defaults and use the actual item and confirmed state',()=>{
  const render=options=>renderToStaticMarkup(React.createElement(NavigationMenu,{items:[team('研发团队')],showCollapseToggle:false,...options}));
  assert.match(render({}),/aria-label="Expand 研发团队"/);
  assert.match(render({defaultExpandedIds:['team']}),/aria-label="Collapse 研发团队"/);
  assert.match(render({...zh,defaultExpandedIds:['team'],expandedIds:[]}),/aria-label="展开 研发团队"/);
  assert.match(render({...zh,expandedIds:['team']}),/aria-label="收起 研发团队"/);
  assert.match(render({expandBranchLabel:zh.expandBranchLabel,expandedIds:['team']}),/aria-label="Collapse 研发团队"/);
  const label='长中文团队名称与安全文本 <研发> "甲"';
  const html=render({...zh,items:[team(label)]});
  assert.match(html,/aria-label="展开 长中文团队名称与安全文本 &lt;研发&gt; &quot;甲&quot;"/);
  assert.match(html,/aria-expanded="false" aria-controls="[^"]+"/);
  assert.doesNotMatch(render({...zh,items:[{...team('无链接分组'),href:undefined}]}),/aria-label="展开 无链接分组"/);
});
