// Deterministic linearizable test model only; NOT a production cross-tab mutex/store.
// Browser tests separately exercise the library's actual IndexedDB transactions.
export function memoryOperationStore(){
 const values=new Map();return {values,async read(scope){return values.get(scope)??null;},async compareExchange(scope,expected,next){const current=values.get(scope)??null;if(current!==expected)return {exchanged:false,current};if(next===null)values.delete(scope);else values.set(scope,next);return {exchanged:true,current:next};}};
}
const stores=new WeakMap();
export function testOperationStore(storage){let store=stores.get(storage);if(!store){store=memoryOperationStore();stores.set(storage,store);}return store;}
