import {test} from 'node:test';
import assert from 'node:assert/strict';
import {serializeWebfacadeQuery,queryCodecs,parseListData,toListPage} from '../packages/runtime/dist/query.js';
const contract={pageIndexOffset:0,maxPageSize:100,filterFields:{name:queryCodecs.string,enabled:queryCodecs.boolean,statuses:queryCodecs.int64Array,created:queryCodecs.time},sortFields:['name','created']};
const query={page_index:0,page_size:30,return_total:true};
test('query exactly encodes webfacade URL keys, sort priority and values once',()=>{
  const params=serializeWebfacadeQuery({...query,filters:{name:'中文 & + %',enabled:false,statuses:[1,2]},sort:[{field:'name',order:'asc'},{field:'created',order:'desc'}]},contract);
  assert.equal(params.get('page_index'),'0');assert.equal(params.get('return_total'),'true');assert.equal(params.get('name'),'中文 & + %');assert.equal(params.get('statuses'),'1,2');assert.equal(params.get('sort'),'name,created');assert.equal(params.get('sort_name'),'asc');assert.equal(params.get('enabled'),'false');assert(!params.has('field'));
  assert.equal(new URLSearchParams(params.toString()).get('name'),'中文 & + %');assert.equal(serializeWebfacadeQuery({...query,sort:[{field:'name',order:'asc'},{field:'created',order:'desc'}]},contract).toString(),'page_index=0&page_size=30&return_total=true&sort=name%2Ccreated&sort_name=asc&sort_created=desc');
});
test('each endpoint explicitly chooses page base and max; no global page default is guessed',()=>{
  assert.equal(serializeWebfacadeQuery({...query,page_index:1},{...contract,pageIndexOffset:1}).get('page_index'),'1');
  for(const invalid of [{page_index:-1},{page_size:0},{page_size:101},{page_index:1.5},{page_size:Infinity},{return_total:1}])assert.throws(()=>serializeWebfacadeQuery({...query,...invalid},contract));
  assert.throws(()=>serializeWebfacadeQuery(query,{...contract,pageIndexOffset:1}));assert.throws(()=>serializeWebfacadeQuery(query,{filterFields:{}}));
  assert.equal(serializeWebfacadeQuery({...query,page_size:1000},{pageIndexOffset:0}).get('page_size'),'1000');
});
test('unknown/reserved filters, SQL-like names, duplicate sorts and invalid directions are rejected',()=>{
  for(const filters of [{missing:'x'},{page_size:1},{sort_name:'asc'},{'name OR 1=1':'x'}])assert.throws(()=>serializeWebfacadeQuery({...query,filters},contract),TypeError);
  for(const sort of [[{field:'missing',order:'asc'}],[{field:'name',order:'ASC'}],[{field:'name',order:'asc'},{field:'name',order:'desc'}]])assert.throws(()=>serializeWebfacadeQuery({...query,sort},contract),TypeError);
  assert.throws(()=>serializeWebfacadeQuery(query,{...contract,filterFields:{page_size:queryCodecs.int64}}),TypeError);
});
test('cleared filters/sorts remove old managed keys without mutating existing params',()=>{
  const previous=new URLSearchParams('name=old&statuses=1&sort=name&sort_name=desc&sort_legacy=asc&field=name&host=kept');const params=serializeWebfacadeQuery({...query,return_total:false,filters:{name:null,statuses:[]}},contract,previous);
  for(const key of ['name','statuses','sort','sort_name','sort_legacy','field'])assert(!params.has(key));assert.equal(params.get('host'),'kept');assert.equal(params.get('return_total'),'false');assert.equal(previous.get('name'),'old');
});
test('codecs are explicit, preserve int64 strings, reject implicit arrays/objects/dates and invalid time',()=>{
  assert.equal(queryCodecs.int64.encode('9223372036854775807'),'9223372036854775807');assert.equal(queryCodecs.int64.encode(-9223372036854775808n),'-9223372036854775808');
  assert.throws(()=>queryCodecs.int64.encode(9007199254740992));assert.throws(()=>queryCodecs.int64.encode('9223372036854775808'));assert.throws(()=>queryCodecs.int64Array.encode([1,'broken']));
  assert.equal(queryCodecs.time.encode('2024-02-29 12:34:56'),'2024-02-29 12:34:56');for(const value of ['2025-02-29 12:00:00','2026-01-01T12:00:00Z',new Date()])assert.throws(()=>queryCodecs.time.encode(value));
  for(const value of [{a:1},['a'],new Date(),'null','undefined'])assert.throws(()=>queryCodecs.string.encode(value));assert.throws(()=>queryCodecs.boolean.encode('true'));assert.throws(()=>queryCodecs.number.encode(NaN));
});
test('ListData validates exact list/total, retains null until explicit projection, and marks unrequested count unknown',()=>{
  const wire={list:null,total:0};assert.equal(parseListData(wire),wire);assert.equal(parseListData(wire).list,null);assert.deepEqual(toListPage(wire,{returnTotal:false}),{list:[],total:null});assert.deepEqual(toListPage(wire,{returnTotal:true}),{list:[],total:0});
  for(const invalid of [{items:[],total:0},{list:[],total:null},{list:'bad',total:1},{list:[],total:9007199254740992},{list:[],total:-1},{list:[],total:'10'}])assert.throws(()=>parseListData(invalid),TypeError);
  assert.deepEqual(parseListData({list:['a'],total:1},value=>({name:value})),{list:[{name:'a'}],total:1});
});

test('ListData preserves optional count and cursor three-state metadata without inventing a total or an end',()=>{
  for(const wire of [{list:[]},{list:null,total:0},{list:['row'],next_cursor:'opaque + / 中文'},{list:[],next_cursor:null},{list:['row'],total:25,next_cursor:'next'}]){
    assert.equal(parseListData(wire),wire);
    const decoded=parseListData(wire,value=>({value}));
    assert.equal(Object.hasOwn(decoded,'total'),Object.hasOwn(wire,'total'));
    assert.equal(Object.hasOwn(decoded,'next_cursor'),Object.hasOwn(wire,'next_cursor'));
    const page=toListPage(decoded,{returnTotal:true});assert.equal(page.total,wire.total??null);
    assert.equal(Object.hasOwn(page,'nextCursor'),Object.hasOwn(wire,'next_cursor'));assert.equal(page.nextCursor,wire.next_cursor);
    assert.equal(toListPage(decoded,{returnTotal:false}).total,null);
  }
  for(const next_cursor of ['',0,false,{},[],undefined])assert.throws(()=>parseListData({list:[],next_cursor}),TypeError);
  for(const total of [null,undefined,-1,1.5,Infinity,Number.MAX_SAFE_INTEGER+1,'0'])assert.throws(()=>parseListData({list:[],total}),TypeError);
});

test('cursor tokens preserve exact UTF-8 bytes within the shared 4096-byte bound',()=>{
  for(const token of ['a'.repeat(4096),'界'.repeat(1365)+'a','  opaque + / %  '])assert.equal(parseListData({list:[],next_cursor:token}).next_cursor,token);
  for(const token of ['a'.repeat(4097),'界'.repeat(1366)])assert.throws(()=>parseListData({list:[],next_cursor:token}),TypeError);
});

test('projection does not promote inherited metadata into optional wire fields',()=>{
 const wire=Object.assign(Object.create({total:99,next_cursor:'inherited'}),{list:[]});
 assert.deepEqual(toListPage(wire,{returnTotal:true}),{list:[],total:null});
 assert.deepEqual(parseListData(wire,item=>item),{list:[]});
});

test('ACL-empty cursor pages preserve continuation rather than infer an end from list length',()=>{
 for(const next_cursor of ['scan:one','scan:two'])assert.deepEqual(toListPage({list:[],next_cursor},{returnTotal:false}),{list:[],total:null,nextCursor:next_cursor});
});
