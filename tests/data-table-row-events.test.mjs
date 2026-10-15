import test from 'node:test';
import assert from 'node:assert/strict';
import {isDataTableRowEvent} from '../packages/ui-react/dist/data-table-row-events.js';
test('the shared boundary filters an open shadow control even when its event target is retargeted',()=>{
 const row={contains(node){return node===cell||node===host;}};
 const cell={nodeType:1,parentElement:row,matches(){return false;},closest(selector){return selector==='tr'?row:null;}};
 const host={nodeType:1,parentElement:cell,matches(){return false;},closest(selector){return selector==='tr'?row:null;}};
 const button={nodeType:1,matches(selector){return selector.includes('button');}};
 const event={target:host,defaultPrevented:false,composedPath:()=>[button,host,cell,row]};
 assert.equal(isDataTableRowEvent(event,row),false);
 assert.equal(isDataTableRowEvent({...event,composedPath:()=>[host,cell,row]},row),true);
});
