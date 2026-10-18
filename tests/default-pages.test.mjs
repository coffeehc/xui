import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveConfig,resolveDefaultPages} from '../packages/runtime/dist/config.js';

test('default full pages inherit brand and URI base without creating routes or services',()=>{
 const source={app:{name:'研发工作台',logo:'/brand.svg'},router:{basePath:'/console/'},pages:{login:{title:'进入工作台'},businessLog:{pageSize:50},apiKeys:{pageSize:25}}};
 const pages=resolveDefaultPages(source);
 assert.deepEqual(Object.keys(pages),['login','adminSetup','businessLog','apiKeys']);
 assert.equal(pages.login.path,'/console/login');assert.equal(pages.adminSetup.path,'/console/setup');
 assert.equal(pages.login.config.productName,'研发工作台');assert.deepEqual(pages.login.config.logo,{src:'/brand.svg',alt:'研发工作台'});
 assert.equal(pages.adminSetup.config.productName,'研发工作台');assert.equal(pages.login.config.description,undefined);
 assert.equal(pages.login.config.fallbackReturnTo,'/console/');assert.equal(pages.businessLog.options.pageSize,50);
 assert.deepEqual(pages.apiKeys.pagination,{defaultPageSize:25,pageSizeOptions:[10,25,50]});
 assert.equal('http'in pages,false);assert.equal('state'in pages.adminSetup,false);assert.equal('adapter'in pages.apiKeys,false);
 source.app.name='changed';source.pages.apiKeys.pageSize=50;
 assert.equal(pages.login.config.productName,'研发工作台');assert.equal(pages.apiKeys.pagination.defaultPageSize,25);
 assert.throws(()=>pages.apiKeys.pagination.pageSizeOptions.push(100),TypeError);assert.throws(()=>{pages.login.path='/other';},TypeError);
});

test('page configuration rejects endpoint/permission overrides, route ambiguity and invalid presentation',()=>{
 const invalid=[{pages:{apiKeys:{endpoint:'/mine'}}},{pages:{apiKeys:{canCreate:true}}},{pages:{adminSetup:{initialized:false}}},
  {pages:{login:{path:'#/login'}}},{pages:{login:{path:'/login?next=/admin'}}},{pages:{login:{path:'//other.test/login'}}},{pages:{login:{path:'/a/../login'}}},{pages:{login:{path:'/login%2fsecret'}}},
  {pages:{apiKeys:{path:'/login/'}}},{pages:{login:{title:' '}}},{pages:{login:{layout:'split'}}},
  {pages:{apiKeys:{pageSize:0}}},{pages:{apiKeys:{pageSize:20}}},{pages:{apiKeys:{pageSizeOptions:[10,10]}}},{pages:{businessLog:{pageSize:201}}}];
 for(const config of invalid)assert.throws(()=>resolveDefaultPages(config),TypeError);
});

test('old partial configuration receives page defaults and existing non-page settings stay unchanged',()=>{
 const config=resolveConfig({auth:{enabled:true},theme:{preset:'forest'},extensions:{business:{retention:30}}});
 assert.equal(config.auth.enabled,true);assert.equal(config.theme.preset,'forest');assert.equal(config.extensions.business.retention,30);
 const pages=resolveDefaultPages(config);assert.equal(pages.businessLog.path,'/business-logs');assert.equal(pages.apiKeys.path,'/api-keys');
 assert.equal(config.auth.protectedPaths.length,0);assert.deepEqual(config.menu.items,[]);
 assert.equal(pages.apiKeys.labels.title,config.pages.apiKeys.title);
});
