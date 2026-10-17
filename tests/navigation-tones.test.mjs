import test from 'node:test';
import assert from 'node:assert/strict';
import {indexNavigation,getNavigationActiveId} from '../packages/runtime/dist/navigation.js';
import {resolveConfig} from '../packages/runtime/dist/config.js';
import {XuiServices} from '../packages/runtime/dist/services.js';
test('optional navigation presentation is validated without inheriting tone, changing selection or inventing lifecycle state',()=>{
 const items=[{id:'group',label:'分组',group:true,tone:'warning',children:[{id:'team',label:'团队',href:'/team',tone:'warning',variant:'text',children:[{id:'manager',label:'经理',href:'/manager'}]}]}];
 const nodes=indexNavigation(items);assert.equal(nodes.get('manager').item.tone,undefined);assert.equal(nodes.get('manager').item.variant,undefined);assert.equal(getNavigationActiveId(nodes,{activeId:'team'}),'team');
 for(const field of[{tone:'waiting_approval'},{variant:'ghost'}])assert.throws(()=>indexNavigation([{id:'a',label:'A',...field}]),TypeError);
 const config=resolveConfig({menu:{items}});assert.equal(config.menu.items[0].children[0].tone,'warning');assert.equal(config.menu.items[0].children[0].variant,'text');
 assert.throws(()=>resolveConfig({menu:{items:[{id:'a',label:'A',tone:'danger'}]}}),TypeError);
 const services=new XuiServices({}, {config:{menu:{items}}});try{const item=services.getMenuService().getState().items[0].children[0];assert.equal(item.tone,'warning');assert.equal(item.variant,'text');assert.equal(item.children[0].tone,undefined);}finally{services.dispose();}
});
