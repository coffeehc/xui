import test from 'node:test';
import assert from 'node:assert/strict';
import {createDialogController} from '../packages/runtime/dist/dom.js';

// Model the synchronous native dialog focusing step, not browser layout or
// accessibility. Playwright covers the real showModal/focusin/roving integration.
function fixture({legacy=true}={}){
  const doc={activeElement:null},events=[];
  class Element extends EventTarget {
    constructor(name){super();this.name=name;this.ownerDocument=doc;this.attributes=new Map();this.children=[];this.isConnected=true;this.tabIndex=0;}
    setAttribute(name,value){this.attributes.set(name,String(value));}
    getAttribute(name){return this.attributes.get(name)??null;}
    hasAttribute(name){return this.attributes.has(name);}
    removeAttribute(name){this.attributes.delete(name);}
    matches(){return !!this.disabled;}
    closest(){return null;}
    getClientRects(){return this.isConnected&&!this.disabled?[{}]:[];}
    contains(node){return node===this||this.children.some(child=>child.contains(node));}
    querySelectorAll(selector){return selector==='[autofocus]'?this.children.filter(node=>node.hasAttribute('autofocus')):this.children;}
    prepend(node){this.children.unshift(node);node.parent=this;}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(node=>node!==this);this.isConnected=false;if(doc.activeElement===this)doc.activeElement=doc.body;}
    focus(){doc.activeElement=this;events.push(`focus:${this.name}`);this.onFocus?.();}
  }
  const body=new Element('body'),trigger=new Element('trigger'),dialog=new Element('dialog'),overview=new Element('overview'),settings=new Element('settings'),close=new Element('close');
  doc.createElement=name=>new Element(name);doc.body=body;doc.activeElement=trigger;dialog.children=[overview,settings,close];dialog.open=false;
  dialog.showModal=()=>{events.push('showModal');if(dialog.fail)throw new Error('cannot open');dialog.open=true;(!legacy&&dialog.hasAttribute('autofocus')?dialog:dialog.children.find(node=>node.hasAttribute('autofocus'))??overview).focus();};
  dialog.close=()=>{dialog.open=false;doc.activeElement=trigger;dialog.dispatchEvent(new Event('close'));};
  return {doc,events,trigger,dialog,overview,settings,close};
}

test('dialog snapshots initial focus before native focus can overwrite a roving target',()=>{
  const f=fixture();let roving=f.settings;
  f.overview.onFocus=()=>{roving=f.overview;};f.settings.onFocus=()=>{roving=f.settings;};
  const owner=createDialogController(f.dialog,f.trigger,{initialFocus:()=>{f.events.push(`resolve:${roving.name}`);return roving;}});
  owner.syncOpen(true);
  assert.equal(f.doc.activeElement,f.settings);
  assert.equal(roving,f.settings);
  assert.deepEqual(f.events,['resolve:settings','showModal','focus:settings']);
  assert.equal(f.dialog.hasAttribute('autofocus'),false);
  owner.destroy();
});

test('dialog resolves each opening and restores an existing autofocus attribute',()=>{
  const f=fixture();f.dialog.setAttribute('autofocus','host-value');let target=f.settings;
  const owner=createDialogController(f.dialog,f.trigger,{initialFocus:()=>target});
  for(const next of [f.settings,f.close,f.settings]){target=next;owner.syncOpen(true);assert.equal(f.doc.activeElement,next);assert.equal(f.dialog.getAttribute('autofocus'),'host-value');owner.syncOpen(false);assert.equal(f.doc.activeElement,f.trigger);}
  owner.destroy();
});

test('failed native opening releases temporary autofocus and can be retried',()=>{
  const f=fixture(),owner=createDialogController(f.dialog,f.trigger,{initialFocus:f.settings});
  f.dialog.fail=true;assert.throws(()=>owner.syncOpen(true),/cannot open/);assert.equal(f.dialog.hasAttribute('autofocus'),false);
  f.dialog.fail=false;owner.syncOpen(true);assert.equal(f.doc.activeElement,f.settings);owner.destroy();
});

test('explicit initial focus does not steal a newer focus chosen during native opening',()=>{
  const f=fixture();f.settings.onFocus=()=>f.close.focus();
  const owner=createDialogController(f.dialog,f.trigger,{initialFocus:f.settings});owner.syncOpen(true);
  assert.equal(f.doc.activeElement,f.close);assert.deepEqual(f.events,['showModal','focus:settings','focus:close']);owner.destroy();
});

test('unspecified or invalid initial focus keeps native dialog behavior',()=>{
  for(const target of [undefined,null,'outside','disabled']){
    const f=fixture();let initialFocus=target==='outside'?f.trigger:target==='disabled'?f.settings:target;if(target==='disabled')f.settings.disabled=true;
    const owner=createDialogController(f.dialog,f.trigger,{initialFocus});owner.syncOpen(true);
    assert.equal(f.doc.activeElement,f.overview);assert.equal(f.dialog.hasAttribute('autofocus'),false);owner.destroy();
  }
});


test('an initial focus resolver cannot reopen its destroyed owner',()=>{
  const f=fixture();let owner;
  owner=createDialogController(f.dialog,f.trigger,{initialFocus:()=>{owner.destroy();return f.settings;}});
  owner.syncOpen(true);assert.equal(f.dialog.open,false);assert.equal(f.events.includes('showModal'),false);assert.equal(f.dialog.hasAttribute('autofocus'),false);
});

test('a reentrant resolver leaves its newer opening in control and resolves once per opening',()=>{
  const f=fixture();let owner,calls=0;
  owner=createDialogController(f.dialog,f.trigger,{initialFocus:()=>{if(++calls===1){owner.syncOpen(true);return f.settings;}return f.close;}});
  owner.syncOpen(true);assert.equal(f.doc.activeElement,f.close);assert.equal(calls,2);assert.equal(f.events.filter(event=>event==='showModal').length,1);
  owner.syncOpen(true);assert.equal(calls,2);owner.destroy();
});

test('synchronous focus close and reopen keeps the new dialog focus instead of the old target',()=>{
  const f=fixture();let owner,target=f.settings,reopened=false;
  f.settings.onFocus=()=>{if(reopened)return;reopened=true;owner.syncOpen(false);target=f.dialog;owner.syncOpen(true);};
  owner=createDialogController(f.dialog,f.trigger,{initialFocus:()=>target});owner.syncOpen(true);
  assert.equal(f.dialog.open,true);assert.equal(f.doc.activeElement,f.dialog);assert.equal(f.events.filter(event=>event==='focus:settings').length,1);assert.equal(f.dialog.hasAttribute('autofocus'),false);assert.equal(f.dialog.children.some(node=>node.name==='span'),false);owner.destroy();
});

test('synchronous native focus destruction leaves the dialog closed without target delivery',()=>{
  const f=fixture();let owner;f.settings.onFocus=()=>owner.destroy();
  owner=createDialogController(f.dialog,f.trigger,{initialFocus:f.settings});owner.syncOpen(true);
  assert.equal(f.dialog.open,false);assert.equal(f.events.filter(event=>event==='focus:settings').length,1);assert.equal(f.dialog.hasAttribute('autofocus'),false);
});


for(const legacy of [true,false])test(`native ${legacy?'legacy':'modern'} autofocus preserves the captured target and restores all host attributes`,()=>{
  const f=fixture({legacy});f.dialog.setAttribute('autofocus','root');f.overview.setAttribute('autofocus','first');f.settings.setAttribute('autofocus','target');
  const owner=createDialogController(f.dialog,f.trigger,{initialFocus:f.settings});owner.syncOpen(true);
  assert.equal(f.doc.activeElement,f.settings);assert.deepEqual(f.events,['showModal','focus:settings']);
  assert.equal(f.dialog.getAttribute('autofocus'),'root');assert.equal(f.overview.getAttribute('autofocus'),'first');assert.equal(f.settings.getAttribute('autofocus'),'target');owner.destroy();
});

test('confirmed controlled state can open through another action while the primary trigger is disabled',()=>{
  const f=fixture();f.trigger.disabled=true;const owner=createDialogController(f.dialog,f.trigger,{open:false});
  owner.open();assert.equal(f.dialog.open,false);owner.syncOpen(true);assert.equal(f.dialog.open,true);owner.syncOpen(false);assert.equal(f.dialog.open,false);owner.destroy();
});
