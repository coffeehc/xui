// Opt-in loopback BaseService fixture only; this is not a production login tool.
import assert from 'node:assert/strict';
import {isolatedAuth} from '../helpers/runtime-services.mjs';

const origin=process.env.XUI_AUTH_HTTP_FIXTURE_ORIGIN;
if(!origin||!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw new Error('Set XUI_AUTH_HTTP_FIXTURE_ORIGIN to an explicitly started synthetic loopback fixture');
const nativeFetch=globalThis.fetch;
function fixture(){
  const cookies=new Map(),requests=[];let dropLogin=false;
  const fetch=async(url,init)=>{
    const target=new URL(url);assert.equal(target.origin,origin);
    const headers=new Headers(init.headers);headers.set('Origin',origin);
    if(init.credentials==='same-origin'){
      const pairs=[...cookies.values()].filter(cookie=>target.pathname.startsWith(cookie.path)).map(cookie=>cookie.pair);
      if(pairs.length)headers.set('Cookie',pairs.join('; '));
    }
    requests.push({path:target.pathname,method:init.method,credentials:init.credentials,bearer:headers.has('Authorization'),cookie:headers.has('Cookie')});
    assert.equal(headers.has('X-Auth-Operation-ID'),false);
    const response=await nativeFetch(url,{...init,headers});
    if(init.credentials==='same-origin')for(const raw of response.headers.getSetCookie()){
      const [pair,...attributes]=raw.split(';').map(value=>value.trim()),name=pair.split('=')[0],path=attributes.find(value=>/^Path=/i.test(value))?.slice(5)??'/';
      if(attributes.some(value=>/^Max-Age=0$/i.test(value)))cookies.delete(name);else cookies.set(name,{pair,path});
    }
    if(dropLogin&&target.pathname.endsWith('/login')){
      dropLogin=false;await response.body?.cancel();throw new Error('Synthetic response loss after the real handler completed');
    }
    return response;
  };
  const owner=isolatedAuth({baseURL:origin,fetch},{timeoutMs:5000});
  return {auth:owner.auth,requests,dropNextLogin(){dropLogin=true;},destroy(){owner.services.dispose();}};
}
const login=(auth,password='synthetic-password-only')=>auth.login({username:'fixture',password});
{
  const f=fixture();
  try{
    const user=await login(f.auth);assert.equal(user.id,'9007199254740993');assert.equal(user.username,'fixture');
    assert.deepEqual(f.requests.map(request=>request.path),['/api/v1/auth/login']);
    assert.equal(f.auth.getState().busy,null);assert.equal(f.auth.getState().status,'authenticated');
    await f.auth.currentUser();await f.auth.logout();
    assert.deepEqual(f.requests.map(request=>request.path),['/api/v1/auth/login','/api/v1/auth/session','/api/v1/auth/logout']);
    assert.equal(f.requests[0].bearer,false);assert.equal(f.requests[1].bearer,true);assert.equal(f.requests[1].cookie,false);assert.equal(f.requests[1].credentials,'omit');
    assert.equal(f.requests[2].bearer,false);assert.equal(f.requests[2].cookie,true);assert.equal(f.auth.getState().status,'anonymous');
    console.log('PASS direct login/session/logout against real Fiber routes and CSRF');
  }finally{f.destroy();}
}
{
  const f=fixture();
  try{
    f.dropNextLogin();const user=await login(f.auth);assert.equal(user.username,'fixture');
    assert.deepEqual(f.requests.map(request=>request.path),['/api/v1/auth/login','/api/v1/auth/refresh','/api/v1/auth/session']);
    assert.equal(f.requests.filter(request=>request.path.endsWith('/login')).length,1);
    assert.equal(f.requests[1].bearer,false);assert.equal(f.requests[1].cookie,true);assert.equal(f.requests[2].bearer,true);assert.equal(f.requests[2].cookie,false);
    assert.equal(f.auth.getState().status,'authenticated');assert.equal(f.auth.getState().busy,null);
    await f.auth.logout();console.log('PASS lost login response uses one ordinary refresh/session check without replay');
  }finally{f.destroy();}
}
{
  const f=fixture();
  try{
    await assert.rejects(login(f.auth,'synthetic-invalid-password'),error=>error.status===401);
    assert.equal(f.auth.getState().busy,null);assert.equal(f.requests.length,1);
    await login(f.auth);assert.equal(f.requests.length,2);assert(f.requests.every(request=>request.path==='/api/v1/auth/login'));
    await f.auth.logout();console.log('PASS rejected login permits a separate explicit retry without recovery requests');
  }finally{f.destroy();}
}
console.log('Boundary: real Fiber HTTP/Origin/CSRF and production DTO parsers; synthetic auth service and test Cookie jar. No PostgreSQL, browser Cookie or production acceptance.');
