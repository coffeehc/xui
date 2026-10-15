import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createAdminSetupController,getAdminSetupMessage} from '../packages/runtime/dist/admin-setup.js';
import {createApiKeyManagerController} from '../packages/runtime/dist/api-key.js';
import {ConfigurableLoginPage,AuthPage} from '../packages/ui-react/dist/login.js';
import {AdminSetupPage} from '../packages/ui-react/dist/admin-setup.js';
import {NewPasswordFields} from '../packages/ui-react/dist/password.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const config={productName:'Example',title:'Login',logo:{src:'/brand.svg',alt:''}};
test('public complete login labels reach the password control and decorative logo is explicit in React',()=>{
 const auth={getState:()=>({status:'anonymous',user:null,busy:null,error:null}),subscribe:()=>()=>{}};
 for(const labels of [undefined,{showPassword:'显示密码',hidePassword:'隐藏密码'}]){
  const html=renderToStaticMarkup(React.createElement(ConfigurableLoginPage,{auth,theme:{},config:{...config,labels}}));
  assert.match(html,/alt=""/);assert.ok(html.includes(`aria-label="${labels?.showPassword??'Show password'}"`));
 }
 assert.match(renderToStaticMarkup(React.createElement(AuthPage,{config})),/alt=""/);
});
test('setup authority checks are explicit, serial, read only, and cannot unlock another write',async()=>{
 let writes=0,reads=0;const held=deferred(),owner=createAdminSetupController({state:{status:'idle'},onSubmit:()=>{writes++;return 'unconfirmed';},onCheck:()=>{reads++;return held.promise;}});
 await owner.check();assert.equal(reads,0);await owner.submit({username:'demo',password:'FAKE'});assert.equal(writes,1);
 const read=owner.check();assert.equal(owner.getState().status,'checking');await owner.check();await owner.submit({username:'demo',password:'FAKE'});assert.equal(reads,1);assert.equal(writes,1);
 held.resolve('unconfirmed');await read;assert.equal(owner.getState().status,'unconfirmed');await owner.submit({username:'demo',password:'FAKE'});assert.equal(writes,1);owner.destroy();
});
test('both new-password fields accept optional reveal labels without changing default labels',()=>{
 for(const Component of [NewPasswordFields,AdminSetupPage]){
  const base=Component===AdminSetupPage?{config,state:{status:'idle'},onSubmit:()=>assert.fail()}:{};
  const prop=Component===AdminSetupPage?'passwordLabels':'labels';
  for(const override of [undefined,{showPassword:'显示密码',hidePassword:'隐藏密码'}]){
   const html=renderToStaticMarkup(React.createElement(Component,{...base,[prop]:override}));
   assert.equal((html.match(new RegExp(`aria-label="${override?'显示密码':'Show password'}"`,'g'))||[]).length,2);
  }
 }
});
test('setup failed/invalid checks expose safe retry without authorizing initialization',async()=>{
 for(const result of [()=>{throw Error('PRIVATE');},()=> 'idle',()=>undefined]){
  const owner=createAdminSetupController({state:{status:'unconfirmed'},onSubmit:()=>assert.fail('write replayed'),onCheck:result});await owner.check();assert.deepEqual(owner.getState(),{status:'unconfirmed',checkFailed:true});assert.doesNotMatch(getAdminSetupMessage(owner.getState()),/PRIVATE/);owner.destroy();
 }
});
test('setup read cancellation and authority replacement discard late completion',async()=>{
 for(const action of ['suspend','destroy','setState']){
  const held=deferred();let signal;const owner=createAdminSetupController({state:{status:'unconfirmed'},onSubmit:()=>assert.fail(),onCheck:context=>{signal=context.signal;return held.promise;}}),pending=owner.check();
  if(action==='setState')owner.setState({status:'unavailable',revision:2});else owner[action]();const snapshot=owner.getState();assert.equal(signal.aborted,true);held.resolve('complete');await pending;assert.equal(owner.getState(),snapshot);
 }
});
test('setup optional read action is absent by default and SSR never invokes it',()=>{
 const props={config,state:{status:'unconfirmed'},onSubmit:()=>assert.fail(),onCheck:()=>assert.fail('SSR checked')};
 assert.doesNotMatch(renderToStaticMarkup(React.createElement(AdminSetupPage,{...props,onCheck:undefined})),/>重新核对状态</);
 assert.match(renderToStaticMarkup(React.createElement(AdminSetupPage,props)),/>重新核对状态</);
});
test('setup abort releases the caller even if the host never settles its read or write',async()=>{
 for(const operation of ['submit','check']){
  const owner=createAdminSetupController({state:{status:operation==='submit'?'idle':'unconfirmed'},onSubmit:()=>new Promise(()=>{}),onCheck:()=>new Promise(()=>{})});
  const pending=operation==='submit'?owner.submit({username:'demo',password:'FAKE'}):owner.check();owner.suspend();await pending;assert.equal(owner.getState().status,'unconfirmed');owner.destroy();
 }
});
const metadata=(patch={})=>({id:'key-1',name:'Synthetic key',permissionIds:[],prefix:null,createdAt:null,expiresAt:null,lastUsedAt:null,status:'active',version:'1',capabilities:{revoke:true,deleteRecord:false},...patch});
const manager=adapter=>createApiKeyManagerController({adapter,permissions:[],expiryOptions:[{id:'never',label:'Never'}],defaultExpiryId:'never'});
test('confirmed revoke reads authoritative capabilities once before exposing delete',async()=>{
 let reads=0,writes=0;const entered=deferred(),held=deferred(),owner=manager({list:async()=>{if(++reads===1)return [metadata()];entered.resolve();return held.promise;},create:()=>assert.fail(),revoke:async()=>{writes++;},deleteRecord:async()=>{}});
 await owner.refresh();owner.openRevoke('key-1');const pending=owner.confirmRevoke();await entered.promise;
 assert.equal(owner.getState().rows[0].status,'revoked');assert.equal(owner.canDeleteRecord(owner.getState().rows[0]),false);await owner.confirmRevoke();assert.equal(writes,1);
 held.resolve([metadata({status:'revoked',version:'2',capabilities:{revoke:false,deleteRecord:true}})]);await pending;assert.equal(reads,2);assert.equal(owner.getState().phase,'closed');assert.equal(owner.canDeleteRecord(owner.getState().rows[0]),true);assert.equal(owner.getState().rows[0].version,'2');owner.destroy();
});
test('failed or denied post-revoke reads never infer delete permission or retry the write',async()=>{
 for(const fail of [true,false]){let reads=0,writes=0;const owner=manager({list:async()=>{if(++reads===1)return [metadata()];if(fail)throw Error('PRIVATE');return [metadata({status:'revoked',capabilities:{revoke:false,deleteRecord:false}})];},create:()=>assert.fail(),revoke:async()=>{writes++;},deleteRecord:async()=>{}});
  await owner.refresh();owner.openRevoke('key-1');await owner.confirmRevoke();assert.equal(writes,1);assert.equal(reads,2);assert.equal(owner.getState().phase,'closed');assert.equal(owner.canDeleteRecord(owner.getState().rows[0]),false);assert.equal(!!owner.getState().listError,fail);owner.destroy();
 }
});
test('closing or destroying while reading post-revoke authority discards late grants',async()=>{
 for(const action of ['close','destroy']){let reads=0;const entered=deferred(),held=deferred(),owner=manager({list:async()=>{if(++reads===1)return [metadata()];entered.resolve();return held.promise;},create:()=>assert.fail(),revoke:async()=>{},deleteRecord:async()=>{}});
  await owner.refresh();owner.openRevoke('key-1');const pending=owner.confirmRevoke();await entered.promise;owner[action]();await pending;const snapshot=owner.getState();held.resolve([metadata({status:'revoked',capabilities:{revoke:false,deleteRecord:true}})]);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(owner.getState(),snapshot);
 }
});
