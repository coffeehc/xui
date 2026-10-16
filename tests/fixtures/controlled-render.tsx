import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Button} from '@coffeehc/xui-react/button';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {Tabs} from '@coffeehc/xui-react/tabs';
import {Select} from '@coffeehc/xui-react/select';
import {Combobox} from '@coffeehc/xui-react/combobox';
import {createOverlayController} from '@coffeehc/xui-runtime/interaction';
import '@coffeehc/xui-theme/style.css';

type State={open:boolean;tab:string;selected:string;input:string};
const initial:State={open:false,tab:'a',selected:'one',input:'initial'};
const events:{kind:string;value:unknown}[]=[],effects:unknown[]=[];
const injected=createOverlayController();
const demo={events,effects,injected,update:(_patch:Partial<State>)=>{},setMounted:(_value:boolean)=>{},setReject:(_value:boolean)=>{}};
(window as unknown as {controlledRender:typeof demo}).controlledRender=demo;
function App(){
 const [state,setState]=React.useState(initial),[mounted,setMounted]=React.useState(true),[reject,setReject]=React.useState(false),article=React.useRef<HTMLElement>(null),root=React.useRef<HTMLDivElement>(null);
 React.useLayoutEffect(()=>{demo.update=patch=>setState(previous=>({...previous,...patch}));demo.setMounted=setMounted;demo.setReject=setReject;},[]);
 const observe=(phase:string)=>({phase,expected:state,hidden:!!article.current?.closest('[hidden]'),tab:root.current?.querySelector('[role=tab][aria-selected=true]')?.textContent,input:(root.current?.querySelector('[data-test=controlled-input]') as HTMLInputElement|null)?.value,selected:root.current?.querySelector('[data-test=selected-value]')?.textContent,serialized:(root.current?.querySelector('input[name=controlled-record]') as HTMLInputElement|null)?.value});
 React.useLayoutEffect(()=>{effects.push(observe('layout'));},[state]);
 React.useEffect(()=>{if(state.open)article.current?.focus();effects.push({...observe('passive'),focused:document.activeElement===article.current});},[state]);
 return <main ref={root} className="xui-stack" style={{padding:'var(--layout-content-inset)'}}>
  <Button onClick={()=>demo.update({open:true})}>打开来源引用</Button><Button variant="outline" onClick={()=>demo.update({open:false})}>外部关闭来源</Button>
  <Disclosure title="来源依据" open={state.open} onOpenChange={value=>{events.push({kind:'open',value});if(!reject)demo.update({open:value});}}>
   <article ref={article} tabIndex={-1}>完整的来源引用记录</article>
  </Disclosure>
  <Tabs.Root value={state.tab} onValueChange={(value,details)=>{events.push({kind:'tab',value});if(reject)details.cancel();else demo.update({tab:String(value)});}}><Tabs.List aria-label="记录视图"><Tabs.Tab value="a">甲视图</Tabs.Tab><Tabs.Tab value="b">乙视图</Tabs.Tab></Tabs.List><Tabs.Panel value="a" keepMounted>甲内容</Tabs.Panel><Tabs.Panel value="b" keepMounted>乙内容</Tabs.Panel></Tabs.Root>
  <Select.Root name="controlled-record" items={[{value:'one',label:'One'},{value:'two',label:'Two'}]} value={state.selected} onValueChange={value=>{if(!reject)demo.update({selected:value??'one'});}}><Select.Trigger aria-label="记录选择"><Select.Value data-test="selected-value"/></Select.Trigger><Select.Content><Select.List><Select.Item value="one">One</Select.Item><Select.Item value="two">Two</Select.Item></Select.List></Select.Content></Select.Root>
  <Combobox.Root items={['initial','updated']} value={null} inputValue={state.input} onInputValueChange={input=>{if(!reject)demo.update({input});}}><Combobox.Input aria-label="查询输入" data-test="controlled-input"/><Combobox.Content><Combobox.List>{item=><Combobox.Item key={item} value={item}>{item}</Combobox.Item>}</Combobox.List></Combobox.Content></Combobox.Root>
  <Disclosure title="非受控来源" defaultOpen><span>非受控内容</span></Disclosure>
  {mounted&&<Disclosure title="独立 Controller 来源" controller={injected}><span>独立模型内容</span></Disclosure>}
  <Button variant="outline">组件外部焦点</Button>
 </main>;
}
const view=<App/>;
createRoot(document.getElementById('root')!).render(location.search.includes('strict')?<React.StrictMode>{view}</React.StrictMode>:view);
