import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ajaxResponseAdapter,parseAjaxResponse} from '../packages/runtime/dist/http.js';
import {isolatedHttp,disposeServices} from './helpers/runtime-services.mjs';
import {parseListData,toListPage} from '../packages/runtime/dist/query.js';
import {getDataTableState} from '../packages/runtime/dist/data-table.js';
const fixture=JSON.parse(await readFile(new URL('./fixtures/webfacade-list.v1.json',import.meta.url),'utf8'));
const adapter=(value,context)=>{const response=ajaxResponseAdapter(value,context);return {...response,payload:parseListData(response.payload)};};
test('commons/webfacade shared wire fixtures preserve optional metadata through the real HTTP adapter',async()=>{
  assert.equal(fixture.contract,'webfacade-list.v1');assert.ok(fixture.valid.length>=6);
  for(const {name,response} of fixture.valid){
    const wire=parseAjaxResponse(JSON.parse(response)),http=isolatedHttp({baseURL:'https://fixture.invalid/',fetch:async()=>new Response(response,{headers:{'Content-Type':'application/json'}})});
    try{
      const result=await http.request('records',{adapter});assert.deepEqual(result.payload,wire.payload,name);
      const decoded=parseListData(wire.payload,item=>item),page=toListPage(decoded,{returnTotal:true});
      assert.equal(Object.hasOwn(decoded,'total'),Object.hasOwn(wire.payload,'total'),name);assert.equal(Object.hasOwn(page,'nextCursor'),Object.hasOwn(wire.payload,'next_cursor'),name);
      assert.equal(page.total,wire.payload.total??null,name);assert.equal(page.nextCursor,wire.payload.next_cursor,name);
      if(page.nextCursor!==undefined){const state=getDataTableState({label:'Fixture',pagination:{mode:'cursor',pageSize:20,total:page.total,nextCursor:page.nextCursor,hasPrevious:false}},page.list.length);assert.equal(state.pageCount,null,name);}
    }finally{disposeServices(http);}
  }
});
test('shared legacy nil slice normalizes only at explicit UI projection, without invented metadata',()=>{
  for(const {name,response,normalized} of fixture.legacy){const wire=parseAjaxResponse(JSON.parse(response)),expected=parseAjaxResponse(JSON.parse(normalized));assert.equal(parseListData(wire.payload).list,null,name);const page=toListPage(wire.payload,{returnTotal:true});assert.deepEqual(page.list,expected.payload.list,name);assert.equal(page.total,expected.payload.total??null,name);assert.equal(Object.hasOwn(page,'nextCursor'),Object.hasOwn(wire.payload,'next_cursor'),name);}
});
test('shared malformed list fixtures fail as parse errors, never success or guessed cursor end',async()=>{
  for(const {name,response} of fixture.invalid){const http=isolatedHttp({baseURL:'https://fixture.invalid/',fetch:async()=>new Response(response,{headers:{'Content-Type':'application/json'}})});try{await assert.rejects(http.request('records',{adapter}),error=>error.kind==='parse',name);}finally{disposeServices(http);}}
});
