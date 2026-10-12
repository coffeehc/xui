import test from 'node:test';
import assert from 'node:assert/strict';
import {getGroupedComboboxItems} from '../packages/runtime/dist/grouped-combobox.js';
const groups=[{id:'normal',label:'普通',items:[{id:'n',label:'普通'}]},{id:'archive',label:'归档',open:false,items:[{id:'a',label:'归档'}]}];
test('grouped search exposes only expanded options without filtering or mutating host data',()=>{const before=JSON.stringify(groups),state=getGroupedComboboxItems(groups);assert.deepEqual(state.items.map(item=>item.id),['n','a']);assert.deepEqual(state.visible.map(item=>item.id),['n']);assert.equal(JSON.stringify(groups),before);assert.deepEqual(getGroupedComboboxItems(groups.map(group=>({...group,open:true}))).visible.map(item=>item.id),['n','a']);});
test('group and option identities are unique, including collapsed groups',()=>{for(const invalid of [[...groups,{...groups[0]}],[groups[0],{...groups[1],items:[{id:'n',label:'重复'}]}],[{id:'',label:'empty',items:[]}],[{id:'g',label:'ok',items:[{id:1,label:'number'}]}],[{id:'g',label:'ok',open:'false',items:[]} ]])assert.throws(()=>getGroupedComboboxItems(invalid),TypeError);});
test('disabled groups propagate disabled state without changing source items',()=>{const items=[{id:'one',label:'一'},{id:'two',label:'二',disabled:true}];assert(getGroupedComboboxItems([{id:'g',label:'组',items,disabled:true}]).visible.every(item=>item.disabled));assert.equal(items[0].disabled,undefined);});
test('pagination is explicit and bounded per group',()=>{for(const pagination of [{page:0,pageCount:2},{page:3,pageCount:2},{page:1,pageCount:0},{page:1.1,pageCount:2},{page:1,pageCount:Infinity}])assert.throws(()=>getGroupedComboboxItems([{...groups[0],pagination}]),TypeError);assert.doesNotThrow(()=>getGroupedComboboxItems([{...groups[0],pagination:{page:1,pageCount:1}}]));});

import {createDisclosureController} from '../packages/runtime/dist/dom.js';
// Event/DOM state model only; real layout/focus/ARIA is covered by Playwright.
function disclosureFixture(){
  const doc={activeElement:null};
  class Element extends EventTarget {
    constructor(){super();this.ownerDocument=doc;this.attributes=new Map();this.children=[];this.classList={contains:()=>false};this.id='panel';}
    setAttribute(name,value){this.attributes.set(name,String(value));}
    getAttribute(name){return this.attributes.get(name)??null;}
    matches(){return !!this.disabled;}
    contains(node){return node===this||this.children.includes(node);}
    focus(){doc.activeElement=this;}
  }
  const trigger=new Element(),panel=new Element(),child=new Element(),outside=new Element();panel.children.push(child);return {doc,trigger,panel,child,outside};
}
test('native disclosure controlled requests wait for syncOpen and disabled never requests',()=>{const f=disclosureFixture(),requests=[],owner=createDisclosureController(f.trigger,f.panel,{open:false,onOpenChange:value=>requests.push(value)});f.trigger.dispatchEvent(new Event('click'));assert.deepEqual(requests,[true]);assert.equal(owner.getOpen(),false);assert.equal(f.panel.hidden,true);owner.syncOpen(true);assert.equal(f.trigger.getAttribute('aria-expanded'),'true');f.trigger.disabled=true;f.trigger.dispatchEvent(new Event('click'));assert.deepEqual(requests,[true]);owner.destroy();owner.syncOpen(false);assert.equal(f.panel.hidden,false);});
test('native disclosure collapses focused content to its trigger without stealing outside focus',()=>{const f=disclosureFixture(),owner=createDisclosureController(f.trigger,f.panel,{defaultOpen:true});f.doc.activeElement=f.child;owner.syncOpen(false);assert.equal(f.doc.activeElement,f.trigger);owner.syncOpen(true);f.doc.activeElement=f.outside;owner.syncOpen(false);assert.equal(f.doc.activeElement,f.outside);owner.destroy();});
