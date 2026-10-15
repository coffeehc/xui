import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {AppHeader} from '../packages/ui-react/dist/layout.js';
const base={enabled:true,value:'zh',label:'语言',options:[{value:'zh',label:'中文'},{value:'en',label:'English'},{value:'de',label:'Deutsch',disabled:true}],onValueChange:()=>{}};
test('React header locale server-renders a semantic form fallback until client enhancement',async()=>{
  const html=renderToStaticMarkup(React.createElement(AppHeader,{locale:{...base,value:'unknown',disabled:true}}));
  assert.match(html,/data-xui-header-locale=""/);assert.match(html,/<select aria-label="语言" disabled="" class="xui-select xui-header-locale"/);assert.match(html,/<option value="unknown" hidden="" disabled="" selected=""><\/option>/);assert.doesNotMatch(html,/<button[^>]*class="[^"]*xui-header-locale/);
});

test('header compactness uses existing spacing and locale styling never changes ordinary selects',async()=>{
  const source=await readFile('packages/theme/src/layout.css','utf8');
  const forms=await readFile('packages/theme/src/forms.css','utf8');
  assert.match(source,/\.xui-app-header-secondary\s*\{[^}]*gap:var\(--space-control-gap\);/);
  assert.match(source,/\.xui-header-locale\s*\{[^}]*appearance:none;[^}]*border-color:transparent/);
  assert.match(source,/\.xui-header-locale:focus\s*\{border-color:transparent;/);
  for(const state of ['hover','active','disabled'])assert(source.includes(`.xui-header-locale:${state}`));
  assert.match(forms,/\.xui-select-control-icon\s*\{[^}]*pointer-events:none/);
  assert.doesNotMatch(source,/\.xui-header-locale-icon/);
  assert.doesNotMatch(source,/\.xui-select\s*\{|\.xui-app-header-account[^}]*padding|\.xui-theme-mode-toggle[^}]*padding/);
});
