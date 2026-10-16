import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createOverlayController,
  createValueController,
  createSelectionController,
  createNavigationPresentationController,
  createPaginationController,
  createToggleGroupController,
} from '../packages/runtime/dist/interaction.js';
import {
  createApiKeyManagerViewController,
  createBusinessLogViewController,
  createStructuredLogViewController,
} from '../packages/runtime/dist/component-views.js';
import {createApiKeyManagerController} from '../packages/runtime/dist/api-key.js';
import {createBusinessLogController} from '../packages/runtime/dist/business-log.js';
import {createStructuredLogController} from '../packages/runtime/dist/structured-log.js';
import {createLoginViewController} from '../packages/runtime/dist/login-view.js';

function observe(controller) {
  const states = [];
  const unsubscribe = controller.subscribe(() => states.push(controller.getState()));
  return { states, unsubscribe };
}

test('overlay controller separates uncontrolled requests from controlled confirmation', () => {
  const requests = [];
  const controlled = createOverlayController({
    open: false,
    defaultOpen: true,
    onOpenChange: (open, details) => requests.push([open, details?.reason]),
  });
  const seen = observe(controlled);

  assert.equal(controlled.getState().open, false);
  assert.equal(controlled.setOpen(true, { reason: 'trigger' }), true);
  assert.deepEqual(requests, [[true, 'trigger']]);
  assert.equal(controlled.getState().open, false, 'a rejected controlled request must not mutate local state');
  assert.equal(seen.states.length, 0);

  controlled.update({ open: true });
  assert.equal(controlled.getState().open, true);
  assert.deepEqual(requests, [[true, 'trigger']], 'external confirmation is not a user callback');
  assert.equal(seen.states.length, 1);

  assert.equal(controlled.setOpen(false, { isCanceled: true, reason: 'peer-canceled' }), false);
  assert.equal(controlled.getState().open, true);
  assert.equal(requests.length, 1);
  seen.unsubscribe();
  controlled.destroy();

  const owned = createOverlayController({ defaultOpen: false });
  const ownedSeen = observe(owned);
  assert.equal(owned.setOpen(true), true);
  assert.deepEqual(owned.getState(), { open: true });
  assert.equal(ownedSeen.states.length, 1);
  ownedSeen.unsubscribe();
  owned.destroy();
});

test('value controller requests changes once and publishes only accepted controlled values', () => {
  const requests = [];
  const controller = createValueController({
    value: 'server',
    defaultValue: 'ignored-in-controlled-mode',
    onValueChange: (value, details) => requests.push([value, details?.reason]),
  });
  const seen = observe(controller);

  assert.equal(controller.setValue('proposal', { reason: 'pointer' }), true);
  assert.deepEqual(requests, [['proposal', 'pointer']]);
  assert.equal(controller.getState().value, 'server');
  assert.equal(seen.states.length, 0);

  controller.update({ value: 'accepted' });
  assert.equal(controller.getState().value, 'accepted');
  assert.deepEqual(requests, [['proposal', 'pointer']]);
  assert.equal(seen.states.length, 1);
  controller.update({ onValueChange: value => requests.push([`next:${value}`]) });
  controller.setValue('same-controlled-value');
  assert.deepEqual(requests.at(-1), ['next:same-controlled-value']);
  assert.equal(controller.getState().value, 'accepted');
  seen.unsubscribe();
  controller.destroy();

  const owned = createValueController({ defaultValue: 1 });
  assert.equal(owned.setValue(2), true);
  assert.equal(owned.getState().value, 2);
  owned.destroy();
});

test('toggle group controller owns selection policy, updates it dynamically and honors cancellation', () => {
  const blocked=[];
  const owned=createToggleGroupController({defaultValue:['one'],multiple:false,allowEmpty:false,onValueChange:(value,details)=>blocked.push([value,details?.reason])});
  assert.deepEqual(owned.getState(),{value:['one'],multiple:false,allowEmpty:false});
  let policyCancel=0;
  assert.equal(owned.setValue([],{reason:'pointer',cancel:()=>{policyCancel++;}}),false);
  assert.equal(owned.setValue(['one','two'],{reason:'programmatic',cancel:()=>{policyCancel++;}}),false);
  assert.equal(policyCancel,2,'invalid empty/multiple requests are canceled before the callback');
  assert.deepEqual(blocked,[]);
  assert.deepEqual(owned.getState().value,['one']);
  assert.equal(owned.setValue(['two'],{reason:'keyboard'}),true);
  assert.deepEqual(owned.getState().value,['two']);
  owned.update({multiple:true,allowEmpty:true});
  assert.deepEqual(owned.getState(),{value:['two'],multiple:true,allowEmpty:true});
  assert.equal(owned.setValue(['two','three']),true);
  assert.deepEqual(owned.getState().value,['two','three']);
  assert.equal(owned.setValue([]),true);
  assert.deepEqual(owned.getState().value,[]);
  owned.destroy();

  const requests=[];
  const controlled=createToggleGroupController({value:['one'],multiple:false,allowEmpty:true,onValueChange:(value,details)=>{requests.push([...value]);details?.cancel?.();}});
  assert.equal(controlled.setValue(['two'],{reason:'peer',isCanceled:false,cancel(){this.isCanceled=true;}}),false,'a canceled peer callback must not publish a controlled value');
  assert.deepEqual(requests,[['two']]);
  assert.deepEqual(controlled.getState().value,['one']);
  controlled.update({value:['two']});
  assert.deepEqual(controlled.getState().value,['two']);
  assert.deepEqual(requests,[['two']],'external confirmation does not call the user handler again');
  controlled.destroy();
});

test('selection controller keeps value, popup, input and peer-highlight state distinct', () => {
  const requests = { value: [], open: [], input: [] };
  const controller = createSelectionController({
    value: 'a', defaultValue: 'ignored',
    open: false, defaultOpen: true,
    inputValue: 'kept', defaultInputValue: 'ignored query',
    onValueChange: (value, details) => requests.value.push([value, details?.reason]),
    onOpenChange: (value, details) => requests.open.push([value, details?.reason]),
    onInputValueChange: (value, details) => requests.input.push([value, details?.reason]),
  });
  const seen = observe(controller);

  assert.equal(controller.setValue('b', { reason: 'option' }), true);
  assert.equal(controller.setOpen(true, { reason: 'trigger' }), true);
  assert.equal(controller.setInputValue('query', { reason: 'typing' }), true);
  assert.deepEqual(requests, {
    value: [['b', 'option']], open: [[true, 'trigger']], input: [['query', 'typing']],
  });
  assert.deepEqual(controller.getState(), {
    value: 'a', open: false, inputValue: 'kept', keyboardActive: false, highlightedValue: null,
  }, 'rejected controlled requests leave all controlled state untouched');
  assert.equal(seen.states.length, 0);

  controller.recordHighlight('b', true);
  assert.equal(controller.getState().highlightedValue, 'b');
  assert.equal(controller.getState().keyboardActive, true);
  assert.equal(requests.value.length + requests.open.length + requests.input.length, 3,
    'observed peer focus is not another selection request');
  controller.update({ value: 'b', open: true, inputValue: 'accepted query' });
  assert.deepEqual(controller.getState(), {
    value: 'b', open: true, inputValue: 'accepted query', keyboardActive: true, highlightedValue: 'b',
  });
  assert.equal(requests.value.length, 1);
  assert.equal(requests.open.length, 1);
  assert.equal(requests.input.length, 1);

  controller.setOpen(false);
  assert.equal(controller.getState().open, true, 'controlled popup remains open until confirmation');
  assert.equal(controller.setValue('denied', { isCanceled: true }), false);
  assert.equal(controller.getState().value, 'b');
  seen.unsubscribe();
  controller.destroy();

  const owned = createSelectionController({ defaultValue: null, defaultOpen: false, defaultInputValue: '' });
  owned.setOpen(true);
  owned.setInputValue('needle');
  owned.setValue('result');
  assert.deepEqual(owned.getState(), {
    value: 'result', open: true, inputValue: 'needle', keyboardActive: false, highlightedValue: null,
  });
  owned.destroy();
});

test('navigation presentation controller deduplicates expansion and only reveals uncontrolled ancestors', () => {
  const requests = [];
  const controller = createNavigationPresentationController({
    collapsed: true, defaultCollapsed: false,
    sidebarOpen: false,
    expandedIds: ['controlled'], defaultExpandedIds: ['ignored'],
    onCollapsedChange: value => requests.push(['collapsed', value]),
    onSidebarOpenChange: value => requests.push(['sidebarOpen', value]),
    onExpandedChange: value => requests.push(['expandedIds', [...value]]),
  });
  const seen = observe(controller);

  controller.setCollapsed(false);
  controller.setSidebarOpen(true);
  controller.setExpandedIds(['controlled', 'child']);
  controller.revealAncestors(['ancestor']);
  assert.deepEqual(requests, [
    ['collapsed', false], ['sidebarOpen', true], ['expandedIds', ['controlled', 'child']],
  ]);
  assert.deepEqual(controller.getState(), { collapsed: true, sidebarOpen: false, expandedIds: ['controlled'] });
  assert.equal(seen.states.length, 0);

  controller.update({ collapsed: false, sidebarOpen: true, expandedIds: ['controlled', 'child'] });
  assert.deepEqual(controller.getState(), { collapsed: false, sidebarOpen: true, expandedIds: ['controlled', 'child'] });
  assert.equal(seen.states.length, 1);
  assert.deepEqual(requests.length, 3, 'external updates do not echo into change callbacks');

  const owned = createNavigationPresentationController({ defaultExpandedIds: ['root'] });
  owned.revealAncestors(['root', 'child', 'child']);
  assert.deepEqual(owned.getState().expandedIds, ['root', 'child']);
  owned.setExpandedIds(['leaf']);
  assert.deepEqual(owned.getState().expandedIds, ['leaf']);
  seen.unsubscribe();
  controller.destroy();
  owned.destroy();
});

test('pagination controller validates requests, confirms controlled pages, and clamps refreshed totals', () => {
  const requests = [];
  const controller = createPaginationController({
    page: 2, defaultPage: 1, pageCount: 4,
    onPageChange: page => requests.push(page),
  });
  const seen = observe(controller);

  controller.setPage(3);
  assert.deepEqual(requests, [3]);
  assert.deepEqual(controller.getState(), { page: 2, pageCount: 4, disabled: false });
  assert.equal(seen.states.length, 0);
  for (const invalid of [0, 5, 2.5, Number.NaN]) controller.setPage(invalid);
  assert.deepEqual(requests, [3]);

  controller.update({ page: 3 });
  assert.deepEqual(controller.getState(), { page: 3, pageCount: 4, disabled: false });
  assert.deepEqual(requests, [3]);
  controller.update({ pageCount: 2 });
  assert.deepEqual(controller.getState(), { page: 2, pageCount: 2, disabled: false });
  controller.update({ disabled: true });
  controller.setPage(1);
  assert.deepEqual(requests, [3]);
  assert.deepEqual(controller.getState(), { page: 2, pageCount: 2, disabled: true });

  const owned = createPaginationController({ defaultPage: 2, pageCount: 5 });
  owned.setPage(4);
  assert.deepEqual(owned.getState(), { page: 4, pageCount: 5, disabled: false });
  seen.unsubscribe();
  controller.destroy();
  owned.destroy();
});

test('destroy is idempotent and prevents late state notifications in every controller family', () => {
  const controllers = [
    createOverlayController({ defaultOpen: false }),
    createValueController({ defaultValue: 'a' }),
    createSelectionController({ defaultValue: 'a' }),
    createNavigationPresentationController(),
    createPaginationController({ pageCount: 2 }),
  ];
  const mutate = [
    controller => controller.setOpen(true),
    controller => controller.setValue('b'),
    controller => { controller.setInputValue('q'); controller.setOpen(true); },
    controller => controller.setCollapsed(true),
    controller => controller.setPage(2),
  ];
  for (let index = 0; index < controllers.length; index++) {
    const controller = controllers[index], seen = observe(controller);
    controller.destroy();
    const finalState = controller.getState();
    controller.destroy();
    mutate[index](controller);
    assert.equal(controller.getState(), finalState);
    assert.equal(seen.states.length, 0);
    seen.unsubscribe();
  }
});

function countMethod(target, method) {
  const original = target[method].bind(target);
  let calls = 0, last;
  target[method] = (...args) => { calls++; last = original(...args); return last; };
  return {get calls() { return calls; }, get last() { return last; }};
}

const keyRow = id => ({id,name:`Key ${id}`,prefix:null,permissionIds:[],createdAt:null,expiresAt:null,lastUsedAt:null,status:'active'});
const keyOptions = adapter => ({adapter,permissions:[],expiryOptions:[{id:'never',label:'Never'}],defaultExpiryId:'never'});
const businessPage = {list:[],page:{next_cursor:null,snapshot_id:'snapshot:one'}};
const structuredGroupsPage = {schema_version:1,list:[],matched_groups:'0',matched_entries:'0',page:{next_cursor:null,as_of:'2026-10-16T00:00:00Z'}};
const structuredAdapter = overrides => ({
  groups:async()=>structuredGroupsPage,
  groupRecords:async()=>({schema_version:1,list:[],page:{next_cursor:null,as_of:'2026-10-16T00:00:00Z'},group:{id:'group:one',key_version:'v1',first_seen_at:null,last_seen_at:null,entry_count:'0',representative:{source:'test',nature:'system',category:'test',severity:'info',component:'test',operation:'read',code:'ok',summary:'Test',retryable:null,user_fixable:null,request_id:null,trace_id:null,subject:null}}}),
  record:async()=>{throw new Error('not used');},...overrides,
});

function deferred() {
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}
function fakeAuth(login=async()=>({id:'user:1',username:'alice',display_name:'Alice'})) {
  let state={status:'anonymous',user:null,busy:null,error:null};
  const listeners=new Set(),calls={login:[],destroy:0};
  const publish=next=>{state=next;for(const listener of [...listeners])if(listeners.has(listener))listener();};
  return {calls,
    getState:()=>state,
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    currentUser:async()=>null,refresh:async()=>null,
    async login(credentials,options){calls.login.push({credentials,passwordAtCall:credentials.password,signal:options?.signal});return login(credentials,options);},
    logout:async()=>{},cancel(){},expire(){},destroy(){calls.destroy++;},
    setState:publish,
  };
}

test('login view replacement aborts late extension work and keeps the latest credential reader bound', async () => {
  const late=deferred(),entered=deferred(),loginCalls=[];
  const auth=fakeAuth(async credentials=>{loginCalls.push(credentials.username);return {id:'user:1',username:credentials.username,display_name:null};});
  const controller=createLoginViewController({auth,config:{productName:'Test app'},extensions:{beforeSubmit:async()=>{entered.resolve();await late.promise;}}});
  const oldCalls={clear:0,focus:[],navigate:0};
  const oldBinding={readCredentials:()=>({username:'old-user',password:'FAKE_OLD_PASSWORD'}),clearPassword(){oldCalls.clear++;},focus(target){oldCalls.focus.push(target);},navigate(){oldCalls.navigate++;}};
  const releaseOld=controller.bind(oldBinding),pending=controller.submit();await entered.promise;
  const nextCalls={clear:0,focus:[],navigate:0};
  const releaseNext=controller.bind({readCredentials:()=>({username:'new-user',password:'FAKE_NEW_PASSWORD'}),clearPassword(){nextCalls.clear++;},focus(target){nextCalls.focus.push(target);},navigate(){nextCalls.navigate++;}});
  releaseOld();late.resolve();await pending;
  assert.deepEqual(loginCalls,[],'aborted old extension completion cannot submit old credentials');
  assert.ok(!JSON.stringify(controller.getState()).includes('FAKE_OLD_PASSWORD'));
  controller.update({extensions:undefined});await controller.submit();
  assert.deepEqual(loginCalls,['new-user'],'the replacement reader remains bound after releasing the old binding');
  assert.equal(nextCalls.navigate,0);assert.equal(oldCalls.navigate,0);
  releaseNext();controller.destroy();assert.equal(auth.calls.destroy,0);
});

test('login view snapshot stays secret-free and clears its local credentials before awaiting auth-owned work', async () => {
  const events=[],extension=deferred(),entered=deferred(),login=deferred();
  const secret='FAKE_TRANSIENT_LOGIN_SECRET';let reads=0,clears=0;
  const readerValues=[];
  const auth=fakeAuth(async credentials=>{try{return await login.promise;}finally{credentials.password='';events.push('auth:owned-clear');}});
  const originalAuthLogin=auth.login.bind(auth);
  auth.login=(credentials,options)=>{events.push('auth:login');return originalAuthLogin(credentials,options);};
  const controller=createLoginViewController({auth,config:{productName:'Test app',title:'Sign in'},extensions:{beforeSubmit:async()=>{events.push('extension:start');entered.resolve();await extension.promise;events.push('extension:complete');}}});
  const unbind=controller.bind({
    readCredentials(){const index=++reads;events.push(`credentials:${index}`);let value=index===1?'validation-secret':index===2?'extension-secret':secret;const reader={username:'alice',get password(){events.push(`password:read:${index}`);return value;},set password(next){value=next;events.push(`password:clear:${index}:${next}`);}};readerValues[index]=()=>value;return reader;},
    clearPassword(){clears++;},focus(){},navigate(){events.push('navigate');},
  });
  const submitted=controller.submit();await entered.promise;
  assert.equal(auth.calls.login.length,0,'AuthClient is not called while its extension is pending');
  assert.ok(!JSON.stringify(controller.getState()).includes(secret));
  assert.ok(!JSON.stringify(controller.password.getState()).includes(secret));
  extension.resolve();
  for(let index=0;index<8&&auth.calls.login.length===0;index++)await Promise.resolve();
  assert.equal(auth.calls.login.length,1);
  assert.ok(events.indexOf('extension:complete')<events.indexOf('password:read:3'),'the credential used for auth is read after extension completion');
  assert.ok(events.indexOf('auth:login')<events.indexOf('password:clear:3:'),'the controller clears its local DTO immediately after handing a fresh DTO to auth, before awaiting auth completion');
  assert.equal(readerValues[3](),'','the reader-owned transient DTO is cleared');
  assert.equal(auth.calls.login[0].passwordAtCall,secret);
  assert.equal(auth.calls.login[0].credentials.password,secret,'the AuthClient-owned DTO remains intact while its asynchronous request is pending');
  assert.ok(!JSON.stringify(controller.getState()).includes(secret));
  login.resolve({id:'user:1',username:'alice',display_name:'Alice'});await submitted;
  assert.equal(auth.calls.login[0].credentials.password,'','the AuthClient may clear its own DTO when its IO completes');
  assert.ok(clears>0);
  unbind();controller.destroy();assert.equal(auth.calls.destroy,0,'the view never owns or destroys AuthClient');
});

test('component view factories separate view presentation from service query and start/destroy only owned services', async () => {
  const keyReads=[];
  const ownedKeys=createApiKeyManagerViewController({options:keyOptions({list:async()=>{keyReads.push('list');return [keyRow('1'),keyRow('2'),keyRow('3'),keyRow('4'),keyRow('5')];},create:async()=>{throw new Error('not used');},revoke:async()=>{}}),pagination:{defaultPageSize:2,pageSizeOptions:[2,4]}});
  const keyRefresh=countMethod(ownedKeys.service,'refresh'),keyDestroy=countMethod(ownedKeys.service,'destroy');
  assert.deepEqual(ownedKeys.getState(),{pageIndex:0,pageSize:2,pagination:true,pageSizeOptions:[2,4]});
  ownedKeys.start();ownedKeys.start();await keyRefresh.last;
  assert.equal(keyRefresh.calls,1,'the default-options API key view starts its newly-created service once');
  assert.deepEqual(keyReads,['list']);
  ownedKeys.setPage(2);assert.equal(ownedKeys.getState().pageIndex,2);
  ownedKeys.setPageSize(4);assert.deepEqual(ownedKeys.getState(),{pageIndex:0,pageSize:4,pagination:true,pageSizeOptions:[2,4]});
  ownedKeys.setPage(1);assert.equal(ownedKeys.getState().pageIndex,1);
  assert.equal(ownedKeys.service.getState().rows.length,5,'the view slices the complete loaded collection without a new service query');
  assert.equal(keyReads.length,1);
  ownedKeys.destroy();assert.equal(keyDestroy.calls,1,'the factory destroys the service it created');

  const borrowedKeyService=createApiKeyManagerController(keyOptions({list:async()=>[],create:async()=>{throw new Error('not used');},revoke:async()=>{}}));
  const borrowedKeyRefresh=countMethod(borrowedKeyService,'refresh'),borrowedKeyDestroy=countMethod(borrowedKeyService,'destroy');
  const borrowedKeys=createApiKeyManagerViewController({service:borrowedKeyService,pagination:{defaultPageSize:1,pageSizeOptions:[1]}});
  assert.equal(borrowedKeys.service,borrowedKeyService);
  borrowedKeys.start();borrowedKeys.start();assert.equal(borrowedKeyRefresh.calls,0,'start does not take ownership of a borrowed service');
  borrowedKeys.destroy();assert.equal(borrowedKeyDestroy.calls,0,'destroying the view leaves its borrowed service alive');
  await borrowedKeyService.refresh();assert.equal(borrowedKeyRefresh.calls,1);borrowedKeyService.destroy();assert.equal(borrowedKeyDestroy.calls,1);

  const businessReads=[];
  const ownedBusiness=createBusinessLogViewController({options:{loader:{list:async query=>{businessReads.push(query);return businessPage;},detail:async()=>{throw new Error('not used');}}}});
  const businessRefresh=countMethod(ownedBusiness.service,'refresh'),businessDestroy=countMethod(ownedBusiness.service,'destroy');
  const initialBusinessFilter=ownedBusiness.service.getState().filter;
  ownedBusiness.setDraft({...ownedBusiness.getState().draft,action:'unsubmitted draft'});
  assert.equal(ownedBusiness.getState().draft.action,'unsubmitted draft');
  assert.equal(ownedBusiness.service.getState().filter.action,initialBusinessFilter.action,'editing view draft does not mutate the active service query');
  assert.equal(businessReads.length,0);
  ownedBusiness.start();ownedBusiness.start();await businessRefresh.last;
  assert.equal(businessRefresh.calls,1);assert.equal(businessReads.length,1);
  ownedBusiness.destroy();assert.equal(businessDestroy.calls,1);

  const borrowedBusinessService=createBusinessLogController({loader:{list:async()=>businessPage,detail:async()=>{throw new Error('not used');}}});
  const borrowedBusinessRefresh=countMethod(borrowedBusinessService,'refresh'),borrowedBusinessDestroy=countMethod(borrowedBusinessService,'destroy');
  const borrowedBusiness=createBusinessLogViewController({service:borrowedBusinessService});
  borrowedBusiness.start();assert.equal(borrowedBusinessRefresh.calls,0);
  borrowedBusiness.setDraft({...borrowedBusiness.getState().draft,action:'only a draft'});
  assert.equal(borrowedBusinessService.getState().filter.action,null);
  borrowedBusiness.destroy();assert.equal(borrowedBusinessDestroy.calls,0);borrowedBusinessService.destroy();

  const structuredReads=[];
  const ownedStructured=createStructuredLogViewController({options:{adapter:structuredAdapter({groups:async request=>{structuredReads.push(request);return structuredGroupsPage;}})}});
  const structuredRefresh=countMethod(ownedStructured.service,'refresh'),structuredDestroy=countMethod(ownedStructured.service,'destroy');
  ownedStructured.setDraft({...ownedStructured.getState().draft,text:'unsubmitted query'});
  assert.equal(ownedStructured.getState().draft.text,'unsubmitted query');
  assert.equal(ownedStructured.service.getState().filter.text,null,'filter presentation is independent until the host applies it');
  assert.equal(structuredReads.length,0);
  ownedStructured.start();ownedStructured.start();await structuredRefresh.last;
  assert.equal(structuredRefresh.calls,1);assert.equal(structuredReads.length,1);
  ownedStructured.destroy();assert.equal(structuredDestroy.calls,1);

  const borrowedStructuredService=createStructuredLogController({adapter:structuredAdapter()});
  const borrowedStructuredRefresh=countMethod(borrowedStructuredService,'refresh'),borrowedStructuredDestroy=countMethod(borrowedStructuredService,'destroy');
  const borrowedStructured=createStructuredLogViewController({service:borrowedStructuredService});
  borrowedStructured.start();assert.equal(borrowedStructuredRefresh.calls,0);
  borrowedStructured.setDraft({text:'draft only'});assert.equal(borrowedStructuredService.getState().filter.text,null);
  borrowedStructured.destroy();assert.equal(borrowedStructuredDestroy.calls,0);borrowedStructuredService.destroy();
});
