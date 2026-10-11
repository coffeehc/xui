import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexNavigation,getNavigationActiveId,navigateNavigationItem,resolveNavigationIcon} from '../packages/runtime/dist/navigation.js';

const items=[{id:'group',label:'工作',group:true,children:[{id:'home',label:'主页',href:'/home'},{id:'locked',label:'禁用',disabled:true,children:[{id:'child',label:'子项',href:'/child'}]}]},{id:'external',label:'外部',href:'https://other.example/home'}];
test('navigation data validates unique ids, cycles and inherited disabled state',()=>{
  const nodes=indexNavigation(items);assert.deepEqual(nodes.get('child').ancestors,['group','locked']);assert.equal(nodes.get('child').disabled,true);
  assert.throws(()=>indexNavigation([...items,{id:'home',label:'重复'}]),TypeError);
  const cycle={id:'cycle',label:'循环'};cycle.children=[cycle];assert.throws(()=>indexNavigation([cycle]),TypeError);
  assert.throws(()=>indexNavigation([{id:'x',label:'组',group:true,href:'/x'}]),TypeError);
  assert.throws(()=>indexNavigation([{id:1,label:'数字 id'}]),TypeError);assert.throws(()=>indexNavigation([{id:'x',label:{}}]),TypeError);
});
test('unknown icon identifiers including inherited property names use the safe fallback',()=>{
  for(const name of ['missing','toString','constructor','__proto__'])assert.deepEqual(resolveNavigationIcon(name),resolveNavigationIcon('menu'));
  const custom={viewBox:'0 0 16 16',paths:['M2 2h12']};assert.equal(resolveNavigationIcon('custom',name=>name==='custom'?custom:undefined),custom);
});
test('active selection is exact, origin scoped and explicit null/disabled never select',()=>{
  const nodes=indexNavigation(items);assert.equal(getNavigationActiveId(nodes,{location:'https://host.example/home/?query=x#section'}),'home');
  assert.equal(getNavigationActiveId(nodes,{location:'https://host.example/home/child'}),null);
  for(const activeId of [null,'child','group','missing'])assert.equal(getNavigationActiveId(nodes,{location:'https://host.example/home',activeId}),null);
  assert.equal(getNavigationActiveId(nodes,{activeId:'home'}),'home');assert.equal(getNavigationActiveId(nodes,{location:'broken',baseURL:'broken'}),null);
});
test('one host matcher can distinguish same path queries; duplicate matches are deterministic',()=>{
  const nodes=indexNavigation([{id:'a',label:'A',href:'?page=a'},{id:'b',label:'B',href:'?page=b'}]);
  assert.equal(getNavigationActiveId(nodes,{location:'https://host.example/?page=b',matchLocation:(_item,current,target)=>current.origin===target.origin&&current.searchParams.get('page')===target.searchParams.get('page')}),'b');
  assert.equal(getNavigationActiveId(nodes,{location:'https://host.example/?page=b'}),'a');
});
function click(overrides={}){return {button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...overrides};}
test('only opted-in ordinary same-origin clicks reach one navigation adapter',()=>{
  const requests=[],options={items:[],location:'https://host.example/home',navigation:{navigate:request=>requests.push(request)}};
  const event=click();assert.equal(navigateNavigationItem({id:'home',label:'主页',href:'/home'},event,options),true);assert.equal(event.defaultPrevented,true);assert.equal(requests[0].sameLocation,true);assert.equal(requests[0].url,'https://host.example/home');
  navigateNavigationItem({id:'next',label:'下一页',href:'/next'},click(),options);assert.equal(requests.length,2);assert.equal(requests[1].sameLocation,false);
});
test('modified, auxiliary, target, download, foreign, disabled and canceled links retain native behavior',()=>{
  let count=0;const options={items:[],location:'https://host.example/home',navigation:{navigate:()=>count++}};
  for(const event of [click({button:1}),...['ctrlKey','metaKey','shiftKey','altKey','defaultPrevented'].map(key=>click({[key]:true}))])assert.equal(navigateNavigationItem({id:'x',label:'X',href:'/x'},event,options),false);
  for(const item of [{target:'_blank'},{download:true},{download:''},{href:'https://other.example/'},{href:'mailto:a@example.test'},{disabled:true}]){const event=click();assert.equal(navigateNavigationItem({id:'x',label:'X',href:'/x',...item},event,options),false);assert.equal(event.defaultPrevented,false);}
  const event=click();assert.equal(navigateNavigationItem({id:'x',label:'X',href:'/x'},event,{...options,navigation:{...options.navigation,canNavigate:()=>false}}),false);assert.equal(event.defaultPrevented,false);assert.equal(count,0);
});
