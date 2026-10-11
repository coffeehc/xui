import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input,Fieldset,Checkbox,Radio,Switch} from '@coffeehc/xui-react/forms';
import {Pagination,Disclosure} from '@coffeehc/xui-react/navigation';
import {RenderBoundary,Progress} from '@coffeehc/xui-react/feedback';
import {Select} from '@coffeehc/xui-react/select';
import * as dom from '@coffeehc/xui-runtime/dom';
import '@coffeehc/xui-theme/style.css';
type Config={controlled?:boolean;cancelSelect?:boolean;throwRender?:boolean};
declare global{interface Window{foundationEvents:string[];renderFoundationCase:(config:Config)=>number;foundationTools:typeof dom;repairView:()=>void}}
window.foundationTools=dom;window.foundationEvents=[];
const root=createRoot(document.getElementById('root')!,{onCaughtError:()=>{}});let revision=0;
function Broken({broken}:{broken:boolean}){if(broken)throw Error('render-only-error');return <p>View ready</p>;}
function App({config,revision}:{config:Config;revision:number}){
 const log=(value:string)=>window.foundationEvents.push(value);const [page,setPage]=React.useState(1),[open,setOpen]=React.useState(false),[value,setValue]=React.useState<string|null>('One'),[broken,setBroken]=React.useState(!!config.throwRender);window.repairView=()=>setBroken(false);
 const ref=React.useCallback((node:HTMLElement|null)=>{if(node)node.dataset.forwardedRef='true';},[]);
 return <div data-foundation-case={revision} className="xui-stack">
 <Button ref={ref} aria-busy onClick={()=>log('button-click')} className={()=>'host-button'}>Busy enabled</Button><Button render={<a href="#target"/>} nativeButton={false} role="link" onClick={event=>{event.preventDefault();log('link-click');}}>Link action</Button><Button render={<a href="#target"/>} nativeButton={false} disabled onClick={()=>log('disabled-click')}>Disabled link</Button>
 <Field label="Explicit control" help="Help" error="Error"><Input id="explicit-control"/></Field><Field label="Owner control" controlId="owner-control"><Input id="ignored-child-id"/></Field>
 <Fieldset legend="Choice group" help="Group help"><Checkbox label="First choice"/><Checkbox label="Second choice"/><Radio name="radio" label="Radio one"/><Radio name="radio" label="Radio two"/><Switch label="Switch"/></Fieldset>
 <Progress value={30} max={100} aria-label="Progress"/><Pagination pageCount={3} {...(config.controlled?{page}:{defaultPage:1})} onPageChange={next=>{log(`page:${next}`);setPage(next);}}/>
 <Disclosure title="Details" {...(config.controlled?{open}:{defaultOpen:false})} onOpenChange={next=>{log(`disclosure:${next}`);setOpen(next);}}>Expanded details</Disclosure>
 <Select.Root {...(config.controlled?{value}:{defaultValue:'One'})} onValueChange={(next,details)=>{log(`select:${next}`);if(config.cancelSelect)details.cancel();else setValue(next);}}><Select.Trigger aria-label="Contract select" className={state=>state.open?'host-open':'host-closed'}><Select.Value/></Select.Trigger><Select.Content><Select.List><Select.Item value="One">One</Select.Item><Select.Item value="Disabled" disabled>Disabled</Select.Item><Select.Item value="Two">Two</Select.Item></Select.List></Select.Content></Select.Root>
 <RenderBoundary fallback={(_error,reset)=><div role="alert">Render failed<Button onClick={reset}>Reset render</Button></div>} onError={()=>log('render-error')}><Broken broken={broken}/></RenderBoundary>
 </div>;
}
window.renderFoundationCase=config=>{revision++;window.foundationEvents=[];root.render(<React.StrictMode><App key={revision} config={config} revision={revision}/></React.StrictMode>);return revision;};
