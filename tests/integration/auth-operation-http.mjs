// Explicit live BaseService Fiber fixture only. This is not a production login tool.
import assert from 'node:assert/strict';
import {createHttpClient} from '../../packages/runtime/dist/http.js';
import {createAuthClient} from '../../packages/runtime/dist/auth.js';
import {memoryOperationStore} from '../helpers/operation-store.mjs';
const origin=process.env.XUI_AUTH_HTTP_FIXTURE_ORIGIN;
if(!origin||!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw new Error('Set XUI_AUTH_HTTP_FIXTURE_ORIGIN to the explicitly started loopback synthetic fixture');
const nativeFetch=globalThis.fetch;
function fixture(){
 const cookies=new Map(),requests=[],store=memoryOperationStore();let drop=false;
 const fetch=async(url,init)=>{
  const target=new URL(url);assert.equal(target.origin,origin);const headers=new Headers(init.headers);headers.set('Origin',origin);
  if(init.credentials==='same-origin'){const values=[...cookies.values()].filter(cookie=>target.pathname.startsWith(cookie.path)).map(cookie=>cookie.pair);if(values.length)headers.set('Cookie',values.join('; '));}
  requests.push({path:target.pathname,method:init.method});const response=await nativeFetch(url,{...init,headers});
  if(init.credentials==='same-origin')for(const raw of response.headers.getSetCookie()){const [pair,...attrs]=raw.split(';').map(part=>part.trim()),name=pair.split('=')[0],path=attrs.find(value=>/^Path=/i.test(value))?.slice(5)??'/';if(attrs.some(value=>/^Max-Age=0$/i.test(value)))cookies.delete(name);else cookies.set(name,{pair,path});}
  if(drop&&target.pathname.endsWith('/login')){drop=false;await response.body?.cancel();throw Error('synthetic response loss after real handler commit');}return response;
 };
 const http=createHttpClient({baseURL:origin,fetch}),auth=createAuthClient({http,recovery:{scope:'synthetic',protocol:'operation-v1',store}});
 return {auth,store,requests,dropNextLogin(){drop=true;},destroy(){auth.destroy();http.destroy();}};
}
const login=auth=>auth.login({username:'fixture',password:'synthetic-password-only'});
{
 const f=fixture();await login(f.auth);assert.equal(f.auth.getState().status,'authenticated');assert.equal(f.store.values.size,0);await f.auth.logout();assert.equal(f.auth.getState().status,'anonymous');assert.equal(f.store.values.size,0);f.destroy();console.log('PASS real Fiber bootstrap + matching scope + login/logout terminal headers');
}
{
 const f=fixture();f.dropNextLogin();await assert.rejects(login(f.auth));assert.equal(f.store.values.size,1);assert.equal(f.auth.getState().recovery.canResolve,true);assert.equal(await f.auth.inspectRecovery(),true);assert.equal(f.store.values.size,0);assert.equal(f.auth.getState().user,null);await login(f.auth);assert.equal(f.auth.getState().status,'authenticated');assert.equal(f.requests.filter(item=>item.path.endsWith('/resolve')).length,0);f.destroy();console.log('PASS real committed response loss + read-only applied lookup + explicit new login');
}
{
 const control=await nativeFetch(origin+'/__fixture/pending-next',{method:'POST',headers:{Origin:origin}});assert(control.ok);const f=fixture();await assert.rejects(login(f.auth));const id=f.auth.getState().recovery.operationId;assert.equal(await f.auth.inspectRecovery(),false);assert.equal(f.store.values.size,1);await assert.rejects(f.auth.resolveRecovery('f'.repeat(32)));assert.equal(f.requests.filter(item=>item.path.endsWith('/resolve')).length,0);assert.equal(await f.auth.resolveRecovery(id),true);assert.equal(f.store.values.size,0);await login(f.auth);assert.equal(f.auth.getState().status,'authenticated');f.destroy();console.log('PASS real pending lookup + explicit original-ID Resolve + new login');
}
{
 const control=await nativeFetch(origin+'/__fixture/hold-next',{method:'POST',headers:{Origin:origin}});assert(control.ok);const f=fixture(),late=login(f.auth).then(()=>true,()=>false);
 let held=false;for(let attempt=0;attempt<100;attempt++){held=(await (await nativeFetch(origin+'/__fixture/status')).json()).held;if(held)break;await new Promise(resolve=>setTimeout(resolve,10));}assert(held,'original operation reached the real handler hold point');f.auth.cancel();assert.equal(await late,false);const id=f.auth.getState().recovery.operationId;assert.equal(await f.auth.inspectRecovery(),false);assert.equal(await f.auth.resolveRecovery(id),true);await login(f.auth);assert.equal(f.auth.getState().status,'authenticated');const release=await nativeFetch(origin+'/__fixture/release',{method:'POST',headers:{Origin:origin}});assert(release.ok);await new Promise(resolve=>setTimeout(resolve,30));await f.auth.currentUser();assert.equal(f.auth.getState().status,'authenticated');assert.equal(f.store.values.size,0);f.destroy();console.log('PASS real Resolve tombstone before held original mutation, followed by new login and late release');
}
console.log('Boundary: real Fiber HTTP/Origin/receipt handlers; synthetic auth store and test transport Cookie jar. Not PostgreSQL or browser-Cookie acceptance.');
