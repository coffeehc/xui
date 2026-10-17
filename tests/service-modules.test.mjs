import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {XuiServices} from '../packages/runtime/dist/services.js';

async function bundle(contents){return build({stdin:{contents,resolveDir:process.cwd(),sourcefile:'service-contract.mjs'},bundle:true,write:false,format:'esm',platform:'node',target:'node22',metafile:true});}
async function isolated(contents){const result=await bundle(contents);return execFileSync(process.execPath,['--input-type=module','--eval',result.outputFiles[0].text],{encoding:'utf8',timeout:10000});}
const windowFixture=`
const properties=new Map(),storage=new Map();
globalThis.window={location:new URL('https://fixture.example/console'),document:{documentElement:{dataset:{},style:{getPropertyValue:key=>properties.get(key)||'',setProperty:(key,value)=>properties.set(key,value)}},title:''},sessionStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};
`;

test('bootstrap and narrow modules contain only their progressive implementation dependencies',async()=>{
 for(const [entry,symbol,allowed] of [
  ['bootstrap','bootstrap',['theme-service']],['bootstrap','disposeXuiServices',['theme-service']],['http','HTTPService',['http-service']],
  ['upload','UploadService',['upload-service','http-service']],['menu-service','MenuService',['menu-service-core','i18n-core']],
  ['util-service','UtilService',[]],
 ]){
  const result=await bundle(`import {${symbol}} from '@coffeehc/xui-runtime/${entry}';globalThis.feature=${symbol};`);
  const files=Object.values(result.metafile.outputs).flatMap(output=>Object.entries(output.inputs).filter(([,v])=>v.bytesInOutput>0).map(([file])=>file));
  for(const implementation of ['http-service','auth-service','theme-service','route-core','i18n-core','menu-service-core','download-service','upload-service']){
   assert.equal(files.some(file=>file.endsWith('/'+implementation+'.js')),allowed.includes(implementation),`${entry}: ${implementation}`);
  }
 }
});

test('module references are import-safe and consume the post-bootstrap config on first use',async()=>{
 assert.match(await isolated(`
 import assert from 'node:assert/strict';
 import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
 import {ConfigService} from '@coffeehc/xui-runtime/config';
 import {I18nService} from '@coffeehc/xui-runtime/i18n';
 import {MenuService} from '@coffeehc/xui-runtime/menu-service';
 import {HTTPService} from '@coffeehc/xui-runtime/http';
 ${windowFixture}
 let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({success:true,message:'',code:0,request_id:'test',payload:null});};
 const app=bootstrap({app:{name:'Configured'},i18n:{enabled:true,defaultLocale:'en',messages:{en:{tasks:'Research tasks'}}},menu:{items:[{id:'tasks',label:'任务',labelKey:'tasks',href:'/tasks'}]}});
 assert.equal(calls,0);assert.equal(ConfigService.getConfig(),app.config);
 assert.equal(I18nService.getState().locale,'en');assert.equal(MenuService.getState().items[0].label,'Research tasks');
 assert.equal(window.document.documentElement.lang,'en');
 const first=MenuService.getState();assert.equal(MenuService.getState(),first);
 assert.equal(HTTPService,(await import('@coffeehc/xui-runtime/http')).HTTPService);
 await HTTPService.request('/read');assert.equal(calls,1);app.services.dispose();console.log('passed');
 `),/passed/);
});

test('auth-enabled HTTP cannot send before the auth feature module is loaded',async()=>{
 assert.match(await isolated(`
 import assert from 'node:assert/strict';
 import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
 import {HTTPService} from '@coffeehc/xui-runtime/http';
 ${windowFixture}
 let calls=0;globalThis.fetch=async()=>{calls++;return new Response();};
 const app=bootstrap({auth:{enabled:true,protectedPaths:['/api/business/']}});
 await assert.rejects(HTTPService.request('/api/business/upload',{method:'POST'}),/Import the xui auth service module/);
 assert.equal(calls,0);app.services.dispose();console.log('passed');
 `),/passed/);
});

test('lazy auth attaches to the same HTTP owner before its first protected write',async()=>{
 assert.match(await isolated(`
 import assert from 'node:assert/strict';
 import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
 import {HTTPService} from '@coffeehc/xui-runtime/http';
 import {AuthService} from '@coffeehc/xui-runtime/auth';
 ${windowFixture}
 const calls=[],user={id:'42',username:'demo',display_name:null},access='bs-v1-sha256-access-'+'A'.repeat(43);
 const wire=payload=>Response.json({success:true,message:'',code:0,request_id:'test',payload});
 globalThis.fetch=async(url,init)=>{const path=new URL(url).pathname;calls.push({path,init});return wire(path.endsWith('/refresh')?{schema_version:2,user,access_token:access,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()}:path.endsWith('/session')?{schema_version:2,user}:{ok:true});};
 const app=bootstrap({auth:{enabled:true,protectedPaths:['/api/business/']}});assert.equal(calls.length,0);
 await HTTPService.request('/api/business/upload',{method:'POST'});
 const writes=calls.filter(call=>call.path==='/api/business/upload');assert.equal(writes.length,1);
 assert.equal(writes[0].init.headers.get('authorization'),'Bearer '+access);assert.equal(writes[0].init.credentials,'omit');assert.equal(writes[0].init.redirect,'error');
 assert.equal(AuthService.getState().status,'authenticated');assert.equal(app.services.getAuthService().getState(),AuthService.getState());
 app.services.dispose();console.log('passed');
 `),/passed/);
});

test('a borrowed HTTP reference is auth-bound before its first protected write',async()=>{
 const calls=[],first=new XuiServices({http:{options:{baseURL:'https://fixture.example',fetch:async(url,init)=>{calls.push(new URL(url).pathname);return Response.json({success:false,message:'',code:40101,request_id:'test',payload:null},{status:401});}}}});
 const http=first.getHttpService(),second=new XuiServices({http:{instance:http},auth:{options:{protectedPaths:['/private/']}}});
 assert.equal(second.getHttpService(),http);
 await assert.rejects(http.request('/private/upload',{method:'POST'}));
 assert.deepEqual(calls,['/api/v1/auth/refresh']);second.dispose();
 const third=new XuiServices({http:{instance:http},auth:{options:{protectedPaths:['/private/']}}});
 assert.equal(third.getHttpService(),http);third.dispose();first.dispose();
});

test('a failed auth installation rolls back config and allows a corrected bootstrap',async()=>{
 assert.match(await isolated(`
 import assert from 'node:assert/strict';
 import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
 import {XuiServices} from '@coffeehc/xui-runtime/services';
 ${windowFixture}
 let calls=0;const transport=new XuiServices({http:{options:{baseURL:'https://fixture.example',fetch:async()=>{calls++;return new Response();}}}}),http=transport.getHttpService();
 const config={auth:{enabled:true,protectedPaths:['/private/']}};
 assert.throws(()=>bootstrap(config,{services:{http:{instance:http},auth:{options:{timeoutMs:0,protectedPaths:['/private/']}}}}),/Invalid auth timeout/);
 const app=bootstrap(config,{services:{http:{instance:http},auth:{options:{timeoutMs:1000,protectedPaths:['/private/']}}}});
 assert.equal(app.services.getHttpService(),http);assert.equal(calls,0);app.services.dispose();transport.dispose();console.log('passed');
 `),/passed/);
});


test('narrow bootstrap disposer removes the Window registry and preserves borrowed owners',async()=>{
 assert.match(await isolated(`
 import assert from 'node:assert/strict';
 import {bootstrap,disposeXuiServices} from '@coffeehc/xui-runtime/bootstrap';
 import {getThemeService} from '@coffeehc/xui-runtime/theme';
 ${windowFixture}
 let destroyed=0,requests=0;globalThis.fetch=async()=>{requests++;throw new Error('Unexpected IO');};
 const owner={getState:()=>({mode:'dark',effective:'dark',preset:'violet'}),setMode(){},syncMode(){},setPreset(){},isDestroyed:()=>false,subscribe:()=>()=>{},destroy:()=>{destroyed++;}};
 const first=bootstrap({}, {services:{theme:{instance:owner}}});
 disposeXuiServices(window);disposeXuiServices(window);assert.equal(destroyed,0);assert.equal(owner.isDestroyed(),false);
 const next=bootstrap();assert.notEqual(next.services,first.services);assert.notEqual(getThemeService(window),owner);
 assert.throws(()=>first.services.getThemeService(),/disposed/);
 const nextTheme=getThemeService(window);disposeXuiServices(window);assert.equal(nextTheme.isDestroyed(),true);
 assert.notEqual(bootstrap().services,next.services);disposeXuiServices(window);assert.equal(requests,0);owner.destroy();console.log('passed');
 `),/passed/);
});
