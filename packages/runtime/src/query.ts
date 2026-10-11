/** Paged URL protocol from commons/webfacade; not a SQL or JSON filter AST. */
export interface QuerySort{field:string;order:'asc'|'desc'}
export interface WebfacadeQuery{page_index:number;page_size:number;return_total:boolean;filters?:Readonly<Record<string,unknown>>;sort?:readonly QuerySort[]}
export interface QueryFieldCodec{encode:(value:unknown)=>string|undefined}
export interface WebfacadeContract{pageIndexOffset:number;maxPageSize?:number;filterFields?:Readonly<Record<string,QueryFieldCodec>>;sortFields?:readonly string[]}
const reserved=new Set(['page_index','page_size','return_total','sort','field']);
const fieldKey=(key:string)=>{if(!key||key.includes(',')||reserved.has(key)||key.startsWith('sort_'))throw new TypeError('Invalid or reserved query field');};
const integer=(value:unknown)=>{if(typeof value!=='number'||!Number.isSafeInteger(value))throw new TypeError('Expected a safe integer');return value;};
const absent=(value:unknown)=>value===null||value===undefined||value==='';
const int64=(value:unknown)=>{
  if(typeof value==='number')integer(value);if(!['number','string','bigint'].includes(typeof value)||!/^[-]?\d+$/.test(String(value)))throw new TypeError('Expected an int64 integer');
  const result=BigInt(value as string|number|bigint);if(result< -9223372036854775808n||result>9223372036854775807n)throw new RangeError('Integer exceeds int64');return result.toString();
};
export const queryCodecs:Readonly<Record<'string'|'int64'|'number'|'boolean'|'int64Array'|'time',QueryFieldCodec>>=Object.freeze({
  string:{encode(value){if(absent(value))return;if(typeof value!=='string')throw new TypeError('Expected a string');if(value==='null'||value==='undefined')throw new TypeError('The backend skips this string value');return value;}},
  int64:{encode(value){if(absent(value))return;return int64(value);}},
  number:{encode(value){if(absent(value))return;if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError('Expected a finite number');return String(value);}},
  boolean:{encode(value){if(absent(value))return;if(typeof value!=='boolean')throw new TypeError('Expected a boolean');return String(value);}},
  int64Array:{encode(value){if(value===null||value===undefined)return;if(!Array.isArray(value))throw new TypeError('Expected an integer array');if(!value.length)return;return value.map(int64).join(',');}},
  time:{encode(value){if(absent(value))return;if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(value))throw new TypeError('Expected YYYY-MM-DD HH:mm:ss');const date=new Date(value.replace(' ','T')+'Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,19).replace('T',' ')!==value)throw new TypeError('Invalid calendar time');return value;}},
});
export function serializeWebfacadeQuery(query:WebfacadeQuery,contract:WebfacadeContract,existing?:URLSearchParams):URLSearchParams{
  const offset=integer(contract.pageIndexOffset),index=integer(query.page_index),size=integer(query.page_size);
  if(offset<0||index<offset||size<=0||contract.maxPageSize!==undefined&&(integer(contract.maxPageSize)<=0||size>contract.maxPageSize))throw new RangeError('Invalid page index or size for this endpoint');
  if(typeof query.return_total!=='boolean')throw new TypeError('return_total must be boolean');
  const fields=contract.filterFields??{},sortFields=new Set(contract.sortFields??[]);Object.keys(fields).forEach(fieldKey);sortFields.forEach(fieldKey);
  const params=new URLSearchParams(existing);for(const key of Object.keys(fields))params.delete(key);params.delete('field');params.delete('sort');const staleSort:string[]=[];params.forEach((_value,key)=>{if(key.startsWith('sort_'))staleSort.push(key);});staleSort.forEach(key=>params.delete(key));
  params.set('page_index',String(index));params.set('page_size',String(size));params.set('return_total',String(query.return_total));
  for(const [key,value] of Object.entries(query.filters??{})){if(!Object.hasOwn(fields,key))throw new TypeError('Unknown query filter');const encoded=fields[key].encode(value);if(encoded!==undefined){if(typeof encoded!=='string'||encoded===''||encoded==='null'||encoded==='undefined')throw new TypeError('Invalid encoded query value');params.set(key,encoded);}}
  const sort=query.sort??[],used=new Set<string>();for(const item of sort){if(!sortFields.has(item.field)||used.has(item.field)||!['asc','desc'].includes(item.order))throw new TypeError('Unknown, duplicate or invalid sort');used.add(item.field);}if(sort.length)params.set('sort',sort.map(item=>item.field).join(','));for(const item of sort)params.set('sort_'+item.field,item.order);
  return params;
}
/** The wire permits Go nil slices. Nothing in HTTP implicitly normalizes them. */
export interface ListData<T>{list:readonly T[]|null;total:number}
export function parseListData<T=unknown>(value:unknown,decodeItem?:(value:unknown)=>T):ListData<T>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('Expected ListData');const body=value as Record<string,unknown>;
  if(!Object.hasOwn(body,'list')||body.list!==null&&!Array.isArray(body.list)||typeof body.total!=='number'||!Number.isSafeInteger(body.total)||body.total<0)throw new TypeError('Invalid ListData fields or unsafe total');
  if(decodeItem&&body.list!==null)return {list:(body.list as unknown[]).map(decodeItem),total:body.total};return value as ListData<T>;
}
/** Explicit UI projection: null list to [], unknown unrequested total to null. */
export function toListPage<T>(wire:ListData<T>,options:{returnTotal:boolean}):{list:readonly T[];total:number|null}{
  const valid=parseListData<T>(wire);if(typeof options.returnTotal!=='boolean')throw new TypeError('returnTotal must be explicit');return {list:valid.list??[],total:options.returnTotal?valid.total:null};
}
