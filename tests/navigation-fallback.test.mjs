import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NavigationMenu} from '../packages/ui-react/dist/menu-layout.js';

const render=(label,options={})=>renderToStaticMarkup(React.createElement(NavigationMenu,{items:[{id:'item',label,href:'/item',...options.item}],collapsed:true,showCollapseToggle:false,...options}));
test('missing navigation icons use name graphemes without changing the full accessible text',()=>{
  for(const [name,short] of [['研究工作区','研究'],['Message Query','MQ'],['Analytics','An'],['🧑‍💻研发团队','🧑‍💻'],['e\u0301quipe','e\u0301q'],['   ','·']]){
    const html=render(name);
    assert.ok(html.includes(`<span class="xui-nav-initials" aria-hidden="true">${short}</span>`));
    assert.ok(html.includes(`<span class="xui-menu-label">${name}</span>`));
    assert.ok(!html.includes('<svg'),'a missing icon is not a menu-action glyph');
  }
});
test('expanded names, explicit icons, rich labels and disabled navigation keep their contracts',()=>{
  assert.ok(!render('研究',{collapsed:false}).includes('xui-nav-initials'));
  const icon=render('研究',{item:{icon:'document'}});assert.ok(icon.includes('<svg'));assert.ok(!icon.includes('xui-nav-initials'));
  const disabled=render('研究',{item:{disabled:true},renderLabel:item=>React.createElement('span',null,item.label)});
  assert.match(disabled,/aria-disabled="true"/);assert.match(disabled,/class="xui-menu-label"><span>研究<\/span>/);
});
