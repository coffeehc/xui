import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Card} from '../packages/ui-react/dist/display.js';
import {CardGroup} from '../packages/ui-react/dist/card-group.js';

const h=React.createElement;
const render=(Component,props)=>renderToStaticMarkup(h(Component,props)).replace(/<!--.*?-->/g,'');
const count=(html,pattern)=>(html.match(pattern)||[]).length;
const cardRegion=name=>new RegExp(`class="[^"]*\\b${name}\\b[^"]*"`,'g');

test('Card renders one ordered header, content, and footer region with public slot options',()=>{
 const html=render(Card,{
  title:'Workspace',icon:h('svg',{'aria-hidden':'true',viewBox:'0 0 16 16'},h('path',{d:'M1 1'})),
  iconVariant:'plain',iconColor:'var(--status-info-foreground)',
  badge:{label:'Active',tone:'info',variant:'plain',color:'var(--status-info-foreground)'},
  actions:h('button',null,'More'),description:'A short summary',children:h('button',null,'Open'),
  footerMeta:'Owner: Lin',footerActions:h('button',null,'Settings'),footerVariant:'plain',stretch:true,
 });
 assert.equal(count(html,cardRegion('xui-card-header')),1);
 assert.equal(count(html,/class="xui-card-content"/g),1);
 assert.equal(count(html,cardRegion('xui-card-footer')),1);
 const header=html.indexOf('xui-card-header'),content=html.indexOf('class="xui-card-content"'),footer=html.indexOf('xui-card-footer');
 assert.ok(header<content&&content<footer,'the three public regions keep their reading order');
 assert.match(html,/data-padding="none"/);
 assert.match(html,/data-stretch="true"/);
 assert.match(html,/class="xui-card-icon" data-variant="plain" style="color:var\(--status-info-foreground\)"/);
 assert.match(html,/data-tone="info" data-variant="plain" style="color:var\(--status-info-foreground\)"[^>]*>Active/);
 assert.match(html,/class="xui-text xui-card-description"[^>]*>A short summary/);
 assert.match(html,/class="xui-card-body">.*>Open</);
 assert.match(html,/class="xui-toolbar xui-card-footer" data-variant="plain"/);
 assert.match(html,/class="xui-text xui-card-meta"[^>]*>Owner: Lin/);
 assert.match(html,/>Settings</);
});

test('Card leaves empty optional regions unmounted and keeps its header when content is absent',()=>{
 const empty=render(Card,{title:'Only title',icon:false,badge:false,actions:false,description:'',children:null,footerMeta:'',footerActions:false});
 assert.equal(count(empty,cardRegion('xui-card-header')),1);
 for(const optional of ['xui-card-content','xui-card-body','xui-card-description','xui-card-trailing','xui-card-footer'])assert.doesNotMatch(empty,new RegExp(`class="[^"]*${optional}`),optional);
 assert.match(empty,/<h3[^>]*>.*Only title/);
 const descriptionOnly=render(Card,{title:'Description',description:'Summary'});
 assert.equal(count(descriptionOnly,/class="xui-card-content"/g),1);
 assert.doesNotMatch(descriptionOnly,/xui-card-body|xui-card-footer/);
});

const rows=[{id:'a',name:'First'},{id:'b',name:'Second'}];
function renderGroup(cardSizing,renderCard){
 return render(CardGroup,{label:'Items',rows,rowKey:row=>row.id,cardSizing,renderCard});
}

test('CardGroup owns card sizing and exposes only current row context to the card template',()=>{
 for(const [requestedSizing,sizing,stretch] of [[undefined,'natural','false'],['natural','natural','false'],['equal','equal','true']]){
  const contexts=[];
  const html=renderGroup(requestedSizing,(row,context)=>{
   contexts.push({row:row.id,keys:Object.keys(context).sort(),context});
   // An untyped caller cannot override the group-owned stretch decision.
   return {title:row.name,stretch:true};
  });
  assert.match(html,new RegExp(`data-card-sizing="${sizing}"`));
  assert.equal(count(html,new RegExp(`data-stretch="${stretch}"`,'g')),rows.length);
  assert.deepEqual(contexts.map(value=>value.row),['a','b']);
  assert.deepEqual(contexts.map(value=>value.keys),[
   ['busy','disabled','rowIndex','rowKey'],['busy','disabled','rowIndex','rowKey'],
  ]);
  assert.deepEqual(contexts.map(value=>[value.context.rowIndex,value.context.rowKey,value.context.busy,value.context.disabled]),[
   [0,'a',false,false],[1,'b',false,false],
  ]);
  assert.ok(contexts.every(value=>!('cardSizing' in value.context)));
 }
});
