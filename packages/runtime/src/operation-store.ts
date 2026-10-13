/** Non-secret operation identities only. Never credentials, drafts or response bodies. */
export interface DurableOperationStore {
  read:(scope:string)=>Promise<string|null>;
  /** One atomic durable comparison and replacement. Resolve only after commit. */
  compareExchange:(scope:string,expected:string|null,next:string|null)=>Promise<Readonly<{exchanged:boolean;current:string|null}>>;
}
export interface IndexedDBOperationStoreOptions {
  /** Share one database name across every cooperating tab/client. */
  databaseName?:string;
  /** Explicit capability injection for non-window hosts. No in-memory fallback. */
  indexedDB?:IDBFactory;
}
const invalid=()=>new TypeError('Durable operation storage unavailable');
const validScope=(scope:string)=>{if(typeof scope!=='string'||!scope||scope.length>2048)throw invalid();};
const validValue=(value:unknown):value is string|null=>value===null||typeof value==='string'&&value.length>0&&value.length<=16384;
/** Short IndexedDB transactions: no network waits, leases, expiry or process-local pseudo-CAS. */
export function createIndexedDBOperationStore(options:IndexedDBOperationStoreOptions={}):DurableOperationStore {
  const databaseName=options.databaseName??'xui.operation-recovery.v1',factory=options.indexedDB;
  if(typeof databaseName!=='string'||!databaseName||databaseName.length>256)throw invalid();
  const transaction=async<T>(scope:string,mode:IDBTransactionMode,action:(store:IDBObjectStore,value:string|null)=>T):Promise<T>=>{
    validScope(scope);
    return new Promise((resolve,reject)=>{
      let request:IDBOpenDBRequest,settled=false;
      const fail=()=>{if(!settled){settled=true;reject(invalid());}};
      try{const database=factory??globalThis.indexedDB;if(!database)throw invalid();request=database.open(databaseName,1);}catch{fail();return;}
      request.onerror=fail;request.onblocked=fail;
      request.onupgradeneeded=()=>{try{if(!request.result.objectStoreNames.contains('operations'))request.result.createObjectStore('operations');}catch{request.transaction?.abort();fail();}};
      request.onsuccess=()=>{
        const db=request.result;if(settled){db.close();return;}db.onversionchange=()=>db.close();
        let tx:IDBTransaction,result:T;
        try{
          tx=db.transaction('operations',mode,mode==='readwrite'?{durability:'strict'}:undefined);const store=tx.objectStore('operations'),read=store.get(scope);
          read.onsuccess=()=>{try{const value=read.result===undefined?null:read.result;if(!validValue(value))throw invalid();result=action(store,value);}catch{tx.abort();}};
          tx.oncomplete=()=>{db.close();if(!settled){settled=true;resolve(result);}};
          tx.onabort=()=>{db.close();fail();};tx.onerror=()=>{/* onabort is the terminal result. */};
        }catch{db.close();fail();}
      };
    });
  };
  return Object.freeze({
    read:(scope:string)=>transaction(scope,'readonly',(_store,value)=>value),
    compareExchange(scope:string,expected:string|null,next:string|null){
      if(!validValue(expected)||!validValue(next))return Promise.reject(invalid());
      return transaction(scope,'readwrite',(store,current)=>{
        if(current!==expected)return Object.freeze({exchanged:false,current});
        if(next===null)store.delete(scope);else store.put(next,scope);
        return Object.freeze({exchanged:true,current:next});
      });
    },
  });
}
