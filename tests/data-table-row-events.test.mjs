import test from 'node:test';
import assert from 'node:assert/strict';
import {createDataTable} from '../packages/runtime/dist/data-table-dom.js';
import {isDataTableRowEvent} from '../packages/runtime/dist/data-table.js';
import {navigationDOM,fire} from './fixtures/navigation-dom.mjs';
const base={label:'Records',columns:[{id:'name',header:'Name',cell:row=>row.name}],rows:[{id:'one',name:'First'},{id:'two',name:'Second'}],rowKey:row=>row.id};
test('native row shortcuts receive the current stable record/key/index exactly once after reorder and replacement',()=>{
 const {root}=navigationDOM(),calls=[];
 const owner=createDataTable(root,{...base,rowEvents:{onDoubleClick:(row,context,event)=>calls.push({row,context,event})}});
 const original=root.querySelector('tbody').children[0];
 fire(original.children[0],'dblclick');
 assert.equal(calls.length,1);assert.equal(calls[0].row,base.rows[0]);assert.deepEqual(calls[0].context,{rowIndex:0,rowKey:'one',busy:false,disabled:false});
 const updated={id:'one',name:'Updated'};owner.update({rows:[base.rows[1],updated]});
 assert.equal(root.querySelector('tbody').children[1],original);fire(original.children[0],'dblclick');
 assert.equal(calls.length,2);assert.equal(calls[1].row,updated);assert.equal(calls[1].context.rowIndex,1);
 owner.update({status:'refreshing'});fire(original.children[0],'dblclick');owner.update({status:'ready',disabled:true});fire(original.children[0],'dblclick');assert.equal(calls.length,2);
 owner.update({disabled:false,rows:[]});fire(original.children[0],'dblclick');assert.equal(calls.length,2);assert.equal(original.ondblclick,null);
 owner.destroy();assert.equal(original.ondblclick,null);
});
test('buttons, links, labels, editable content, custom actions and nested tables never trigger native row shortcuts',()=>{
 const {root,doc}=navigationDOM(),calls=[];
 const controls=['button','a','input','label','select','textarea','summary','div','span'].map(tag=>doc.createElement(tag));
 controls[7].setAttribute('contenteditable','true');controls[8].setAttribute('data-xui-row-action','');
 const cell=doc.createElement('div');for(const control of controls){const child=doc.createElement('span');control.append(child);cell.append(control);}
 const nested=doc.createElement('table'),nestedRow=doc.createElement('tr'),nestedCell=doc.createElement('td');nestedRow.append(nestedCell);nested.append(nestedRow);cell.append(nested);
 const owner=createDataTable(root,{...base,rows:base.rows.slice(0,1),columns:[{id:'actions',header:'Actions',cell:()=>cell}],rowEvents:{onDoubleClick:()=>calls.push('double'),onClick:()=>calls.push('click'),onKeyDown:()=>calls.push('key'),onContextMenu:()=>calls.push('context')}});
 for(const control of controls)for(const type of ['click','dblclick','keydown','contextmenu'])fire(control.children[0],type);
 fire(nestedCell,'dblclick');assert.deepEqual(calls,[]);
 const td=root.querySelector('tbody').children[0].children[0];fire(td,'dblclick');fire(td,'contextmenu');fire(td,'keydown');assert.deepEqual(calls,['double','context','key']);
 const canceled=new Event('dblclick',{bubbles:true,cancelable:true});canceled.preventDefault();td.dispatchEvent(canceled);assert.equal(calls.length,3);
 owner.update({rowEvents:undefined});fire(td,'dblclick');assert.equal(calls.length,3);owner.destroy();
});
test('destroyed native rows and changed handlers cannot dispatch stale callbacks',()=>{
 const {root}=navigationDOM(),calls=[];const owner=createDataTable(root,{...base,rowEvents:{onClick:row=>calls.push(row.name)}});
 const row=root.querySelector('tbody').children[0];owner.update({rowEvents:{onClick:value=>calls.push(value.id)}});fire(row.children[0],'click');assert.deepEqual(calls,['one']);
 owner.destroy();fire(row.children[0],'click');assert.deepEqual(calls,['one']);
});
test('the shared boundary filters an open shadow control even when its event target is retargeted',()=>{
 const {doc}=navigationDOM(),row=doc.createElement('tr'),cell=doc.createElement('td'),host=doc.createElement('span'),button=doc.createElement('button');row.append(cell);cell.append(host);
 const event={target:host,defaultPrevented:false,composedPath:()=>[button,host,cell,row]};
 assert.equal(isDataTableRowEvent(event,row),false);
 assert.equal(isDataTableRowEvent({...event,composedPath:()=>[host,cell,row]},row),true);
});
