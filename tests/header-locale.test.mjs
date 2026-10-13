import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {bindHeaderLocaleSelect} from '../packages/runtime/dist/header-controls.js';
import {AppHeader} from '../packages/ui-react/dist/layout.js';

function fixture(){
  const doc={};
  class Element extends EventTarget {
    constructor(tag){super();this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.attributes=new Map();this.disabled=false;this.textContent='';this._value='';this.classList={contains:name=>this.className.split(/\s+/).includes(name),add:(...names)=>{this.className=[...new Set([...this.className.split(/\s+/).filter(Boolean),...names])].join(' ');},remove:(...names)=>{this.className=this.className.split(/\s+/).filter(name=>!names.includes(name)).join(' ');}};}
    get className(){return this.getAttribute('class')??'';}
    set className(value){this.setAttribute('class',value);}
    get value(){return this._value;}
    set value(value){this._value=this.tagName==='SELECT'&&!this.children.some(child=>child.value===value)?'':value;}
    get parentElement(){return this.parentNode??null;}
    setAttribute(name,value){this.attributes.set(name,String(value));}
    getAttribute(name){return this.attributes.get(name)??null;}
    insertBefore(node,reference){node.remove();const index=reference?this.children.indexOf(reference):this.children.length;assert(index>=0);this.children.splice(index,0,node);node.parentNode=this;return node;}
    append(...nodes){for(const node of nodes)this.insertBefore(node,null);}
    remove(){if(this.parentNode){this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null;}}
    replaceChildren(...nodes){for(const child of [...this.children])child.remove();this.append(...nodes);}
  }
  doc.createElement=tag=>new Element(tag);doc.createElementNS=(_,tag)=>new Element(tag);
  const host=doc.createElement('div'),select=doc.createElement('select');host.append(select);return {host,select};
}
const base={enabled:true,value:'zh',label:'语言',options:[{value:'zh',label:'中文'},{value:'en',label:'English'},{value:'de',label:'Deutsch',disabled:true}],onValueChange:()=>{}};
const change=(select,value)=>{select.value=value;select.dispatchEvent(new Event('change'));};

test('native locale keeps one mounted decoration and select while unchanged options and values update',()=>{
  const {host,select}=fixture(),binding=bindHeaderLocaleSelect(select,base),options=[...select.children];
  assert.equal(host.children[0],binding.element);assert.equal(binding.element.children[0],select);assert.equal(binding.element.children[1].getAttribute('aria-hidden'),'true');assert.equal(binding.element.children[1].getAttribute('focusable'),'false');
  const repeat=bindHeaderLocaleSelect(select,{...base,value:'en',label:'Language'});assert.equal(repeat,binding);assert.equal(select.value,'en');assert.equal(select.getAttribute('aria-label'),'Language');assert.deepEqual(select.children,options);assert.equal(host.children.length,1);
  binding.destroy();assert.equal(host.children[0],select);assert.equal(select.classList.contains('xui-header-locale'),false);assert.equal(select.value,'en');
});

test('native locale requests reset the displayed fact before callbacks and permit host reentrant sync',()=>{
  const {select}=fixture(),requests=[];let binding;
  const options={...base,onValueChange:value=>{requests.push([value,select.value]);binding.update({...options,value});}};
  binding=bindHeaderLocaleSelect(select,options);change(select,'en');assert.deepEqual(requests,[['en','zh']]);assert.equal(select.value,'en');change(select,'en');change(select,'de');change(select,'missing');assert.deepEqual(requests,[['en','zh']]);assert.equal(select.value,'en');binding.destroy();
});

test('native locale unknown/disabled facts stay explicit and update never emits a request',()=>{
  const {select}=fixture(),requests=[],options={...base,onValueChange:value=>requests.push(value)},binding=bindHeaderLocaleSelect(select,{...options,value:'unknown'});
  assert.equal(select.value,'unknown');assert.equal(select.children[0].disabled,true);assert.equal(select.children[0].textContent,'');
  binding.update({...options,disabled:true});change(select,'en');assert.equal(select.value,'zh');assert.equal(select.disabled,true);assert.deepEqual(requests,[]);
  binding.update({...options,enabled:false});assert.equal(select.disabled,true);change(select,'en');assert.equal(select.value,'zh');assert.deepEqual(requests,[]);
  binding.update({...options,value:'unknown',options:[...options.options,{value:'unknown',label:'已确认的语言'}]});assert.equal(select.children.length,4);assert.equal(select.children.at(-1).textContent,'已确认的语言');assert.equal(select.value,'unknown');assert.equal(select.disabled,false);binding.destroy();
});

test('native locale destroyed handles cannot mutate or remove a replacement binding',()=>{
  const {host,select}=fixture(),oldRequests=[],newRequests=[];
  const old=bindHeaderLocaleSelect(select,{...base,onValueChange:value=>oldRequests.push(value)});old.destroy();old.destroy();old.update({...base,value:'en'});assert.equal(select.value,'zh');
  const next=bindHeaderLocaleSelect(select,{...base,onValueChange:value=>newRequests.push(value)});old.destroy();old.update({...base,disabled:true});assert.equal(select.disabled,false);assert.equal(host.children[0],next.element);change(select,'en');assert.deepEqual(oldRequests,[]);assert.deepEqual(newRequests,['en']);assert.equal(select.value,'zh');next.destroy();change(select,'en');assert.deepEqual(newRequests,['en']);
});

test('React header locale mounts the same public native theme owner without an OS selector',async()=>{
  const html=renderToStaticMarkup(React.createElement(AppHeader,{locale:{...base,value:'unknown',disabled:true}}));
  assert.match(html,/data-xui-header-locale=""/);assert.doesNotMatch(html,/<select/);
  const source=await readFile('packages/ui-react/src/layout.tsx','utf8');assert.match(source,/createHeaderLocaleSelect\(node.ownerDocument,locale\)/);assert.match(source,/binding.current\?\.update\(locale\)/);
});

test('header compactness uses existing spacing and locale styling never changes ordinary selects',async()=>{
  const source=await readFile('packages/theme/src/layout.css','utf8');
  assert.match(source,/\.xui-app-header-secondary\s*\{[^}]*gap:var\(--space-control-gap\);/);
  assert.match(source,/\.xui-header-locale\s*\{[^}]*appearance:none;[^}]*border-color:transparent/);
  assert.match(source,/\.xui-header-locale:focus\s*\{border-color:transparent;/);
  for(const state of ['hover','active','disabled'])assert(source.includes(`.xui-header-locale:${state}`));
  assert.match(source,/\.xui-header-locale-icon\s*\{[^}]*inset-inline-end:calc\(var\(--space-control-gap\) \+ var\(--line-width-surface\)\)/);
  assert.doesNotMatch(source,/\.xui-select\s*\{|\.xui-app-header-account[^}]*padding|\.xui-theme-mode-toggle[^}]*padding/);
});
