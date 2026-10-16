import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input,Fieldset,Checkbox,Radio,Switch} from '@coffeehc/xui-react/forms';
import {Pagination,Disclosure} from '@coffeehc/xui-react/navigation';
import {RenderBoundary,Progress} from '@coffeehc/xui-react/feedback';
import {Select} from '@coffeehc/xui-react/select';
import '@coffeehc/xui-theme/style.css';
type Config={controlled?:boolean;cancelSelect?:boolean;throwRender?:boolean};
declare global{interface Window{foundationEvents:string[];renderFoundationCase:(config:Config)=>number;repairView:()=>void}}
window.foundationEvents=[];
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

// Formal built-entry consumer for modal/card scroll-boundary regressions.
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {Surface} from '@coffeehc/xui-react/feedback';
import {ScrollArea} from '@coffeehc/xui-react/scroll-area';
import {InputGroup} from '@coffeehc/xui-react/forms';
type FocusCase={kind:'dialog'|'sheet'|'card';side?:'start'|'end'|'top'|'bottom';standalone?:boolean;noHeader?:boolean;titleText?:string};
function FocusFields(){return <div className="xui-grid">{Array.from({length:18},(_,index)=><Field key={index} label={`Field ${index+1}`} error={index===0?'必须填写该字段':undefined}>{index===1?<InputGroup.Root><Input defaultValue="Group"/></InputGroup.Root>:<Input defaultValue={`Value ${index+1}`}/>}</Field>)}</div>;}
function FocusCaseView({kind,side,standalone,noHeader,titleText='Long form 标题'}:FocusCase){
 if(kind==='card')return <Surface><ScrollArea.Root style={{height:260}}><ScrollArea.Viewport aria-label="Card form"><ScrollArea.Content><FocusFields/></ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root></Surface>;
 const Modal=kind==='sheet'?Sheet:Dialog;
 return <Modal.Root><Modal.Trigger render={<Button/>}>Open form</Modal.Trigger><Modal.Content {...(kind==='sheet'?{side}:{})} aria-label={titleText?'Long form':'Empty heading form'}>{noHeader?<Modal.Title>{titleText}</Modal.Title>:standalone?<><Modal.Title>{titleText}</Modal.Title><Modal.CloseButton aria-label="Dismiss form"/></>:<Modal.Header closeButtonProps={{'aria-label':'Dismiss form'}}><Modal.Title>{titleText}</Modal.Title><Modal.Description>长标题和说明与关闭入口保持独立。</Modal.Description></Modal.Header>}<Modal.Body><FocusFields/><Surface><ScrollArea.Root style={{height:160}}><ScrollArea.Viewport aria-label="Nested card"><ScrollArea.Content><Field label="Nested first"><Input/></Field><p style={{height:200}}>Nested content</p><Field label="Nested last"><Input/></Field></ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root></Surface></Modal.Body><Modal.Footer><Modal.Close render={<Button variant="outline"/>}>Cancel form</Modal.Close><Button onClick={()=>{window.focusCaseSaves++;}}>Save form</Button></Modal.Footer></Modal.Content></Modal.Root>;
}
declare global{interface Window{focusCaseSaves:number;renderFocusCase:(config:FocusCase)=>void}}
window.renderFocusCase=config=>{window.focusCaseSaves=0;root.render(<FocusCaseView key={JSON.stringify(config)} {...config}/>);};

// Formal public consumers for the workspace scrollport focus contract. There
// is deliberately no host padding, inset-outline override, or private shell DOM.
import {AppShell} from '@coffeehc/xui-react/layout';
import {getThemeService} from '@coffeehc/xui-runtime/services';
import type {ThemeMode} from '@coffeehc/xui-runtime/theme';
type WorkspaceFocusCase={mode:ThemeMode};
function WorkspaceFocusFields(){return <div className="xui-stack">
 <Input aria-label="Workspace first" defaultValue="Keep first draft"/>
 <InputGroup.Root><InputGroup.Addon aria-hidden="true">@</InputGroup.Addon><InputGroup.Input aria-label="Workspace grouped" defaultValue="Keep grouped draft"/></InputGroup.Root>
 <div aria-hidden="true" style={{blockSize:'100dvh'}}/>
 <Input aria-label="Workspace last" defaultValue="Keep last draft"/>
</div>;}
declare global{interface Window{renderWorkspaceFocusCase:(config:WorkspaceFocusCase)=>void}}
window.renderWorkspaceFocusCase=config=>{
 const theme=getThemeService(window);theme.setMode(config.mode);
 root.render(<AppShell key={`workspace-${config.mode}`} theme={theme} scrollMode="workspace" headerSlots={{brand:'Workspace focus'}} sidebar={<nav aria-label="Workspace navigation"><a href="#overview">Overview</a></nav>}><WorkspaceFocusFields/></AppShell>);
};

import {TableActions,TableContainer,Table,TableBody,TableRow,TableCell} from '@coffeehc/xui-react/table';
declare global {interface Window {renderTableActionsCase:()=>void}}
window.renderTableActionsCase=()=>{
 const labels=['编辑这条记录并保留完整文字','撤销这条记录的权限','删除已经撤销的记录'];
 root.render(<TableContainer aria-label="Action layout"><Table><TableBody><TableRow><TableCell><TableActions style={{maxInlineSize:'var(--layout-field-min)'}}>{labels.map(label=><Button key={label}>{label}</Button>)}</TableActions></TableCell></TableRow></TableBody></Table></TableContainer>);
};

import {Textarea,NativeSelect} from '@coffeehc/xui-react/forms';
import {Combobox} from '@coffeehc/xui-react/combobox';
declare global{interface Window{renderInputTypographyCase:()=>void}}
window.renderInputTypographyCase=()=>{
 root.render(<div className="xui-stack"><Field label="Text control"><Input defaultValue="Editable value"/></Field><Field label="Multiline control"><Textarea defaultValue="Editable text"/></Field><Field label="Native selection"><NativeSelect defaultValue="one"><option value="one">One</option><option value="two">Two</option></NativeSelect></Field><Select.Root defaultValue="one"><Select.Trigger aria-label="Themed selection"><Select.Value/></Select.Trigger><Select.Content><Select.List><Select.Item value="one">One</Select.Item></Select.List></Select.Content></Select.Root><Combobox.Root><Combobox.Input aria-label="Searchable selection"/></Combobox.Root></div>);
};
