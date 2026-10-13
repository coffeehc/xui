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

// Formal built-entry consumer for modal/card scroll-boundary regressions.
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {Surface} from '@coffeehc/xui-react/feedback';
import {ScrollArea} from '@coffeehc/xui-react/scroll-area';
import {InputGroup} from '@coffeehc/xui-react/forms';
type FocusCase={kind:'dialog'|'sheet'|'card';native?:boolean;standalone?:boolean;noHeader?:boolean;titleText?:string};
function FocusFields(){return <div className="xui-grid">{Array.from({length:18},(_,index)=><Field key={index} label={`Field ${index+1}`} error={index===0?'必须填写该字段':undefined}>{index===1?<InputGroup.Root><Input defaultValue="Group"/></InputGroup.Root>:<Input defaultValue={`Value ${index+1}`}/>}</Field>)}</div>;}
function FocusCaseView({kind,standalone,noHeader,titleText='Long form 标题'}:FocusCase){
 if(kind==='card')return <Surface><ScrollArea.Root style={{height:260}}><ScrollArea.Viewport aria-label="Card form"><ScrollArea.Content><FocusFields/></ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root></Surface>;
 const Modal=kind==='sheet'?Sheet:Dialog;
 return <Modal.Root><Modal.Trigger render={<Button/>}>Open form</Modal.Trigger><Modal.Content aria-label={titleText?'Long form':'Empty heading form'}>{noHeader?<Modal.Title>{titleText}</Modal.Title>:standalone?<><Modal.Title>{titleText}</Modal.Title><Modal.CloseButton aria-label="Dismiss form"/></>:<Modal.Header closeButtonProps={{'aria-label':'Dismiss form'}}><Modal.Title>{titleText}</Modal.Title><Modal.Description>长标题和说明与关闭入口保持独立。</Modal.Description></Modal.Header>}<Modal.Body><FocusFields/><Surface><ScrollArea.Root style={{height:160}}><ScrollArea.Viewport aria-label="Nested card"><ScrollArea.Content><Field label="Nested first"><Input/></Field><p style={{height:200}}>Nested content</p><Field label="Nested last"><Input/></Field></ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root></Surface></Modal.Body><Modal.Footer><Modal.Close render={<Button variant="outline"/>}>Cancel form</Modal.Close><Button>Save form</Button></Modal.Footer></Modal.Content></Modal.Root>;
}
declare global{interface Window{renderFocusCase:(config:FocusCase)=>void}}
let nativeFocusCleanup:undefined|(()=>void);
window.renderFocusCase=config=>{
 nativeFocusCleanup?.();nativeFocusCleanup=undefined;
 if(!config.native){root.render(<FocusCaseView key={JSON.stringify(config)} {...config}/>);return;}
 root.render(null);
 const host=document.createElement('div');host.id='native-focus-case';host.className='xui';document.body.append(host);
 const fields=`<div class="xui-grid">${Array.from({length:18},(_,index)=>`<div class="xui-field"><label class="xui-label" for="native-field-${index}">Field ${index+1}</label><input class="xui-input" id="native-field-${index}" ${index===0?'aria-invalid="true" aria-describedby="native-error"':''}>${index===0?'<p class="xui-error" id="native-error">必须填写该字段</p>':''}</div>`).join('')}</div>`;
 const card='<div class="xui-surface"><div class="xui-scroll-area" style="height:260px"><div class="xui-scroll-viewport" tabindex="0" role="region" aria-label="Card form"><div class="xui-scroll-content">'+fields+'</div></div></div></div>';
 if(config.kind==='card'){host.innerHTML=card;nativeFocusCleanup=()=>host.remove();return;}
 const close='<button type="button" class="xui-button xui-dialog-close" data-variant="ghost" data-icon="true" data-xui-close aria-label="Dismiss form"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"><path d="m6 6 12 12M18 6 6 18"/></svg></button>';
 const title=config.titleText??'Long form 标题';const heading='<h2 class="xui-dialog-title" id="native-focus-title">'+title+'</h2>';
 host.innerHTML='<button class="xui-button" type="button">Open form</button><dialog class="xui-native-dialog" aria-labelledby="native-focus-title">'+(config.noHeader?heading:config.standalone?heading+close:'<div class="xui-dialog-header"><div class="xui-dialog-heading">'+heading+'<p class="xui-dialog-description">长标题和说明与关闭入口保持独立。</p></div>'+close+'</div>')+'<div class="xui-dialog-body">'+fields+card.replaceAll('native-field-','nested-field-').replaceAll('native-error','nested-error')+'</div><div class="xui-dialog-footer"><button class="xui-button" type="button" data-xui-close>Cancel form</button><button class="xui-button" type="button">Save form</button></div></dialog>';
 const dialog=host.querySelector('dialog')!,trigger=host.querySelector('button')!;
 const controller=config.kind==='sheet'?dom.createSheetController(dialog,trigger):dom.createDialogController(dialog,trigger);
 nativeFocusCleanup=()=>{controller.destroy();host.remove();};
};

// Formal public consumers for the workspace scrollport focus contract. There
// is deliberately no host padding, inset-outline override, or private shell DOM.
import {AppShell} from '@coffeehc/xui-react/layout';
import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {getThemeController,type ThemeMode} from '@coffeehc/xui-runtime/theme';
type WorkspaceFocusCase={native?:boolean;mode:ThemeMode};
function WorkspaceFocusFields(){return <div className="xui-stack">
 <Input aria-label="Workspace first" defaultValue="Keep first draft"/>
 <InputGroup.Root><InputGroup.Addon aria-hidden="true">@</InputGroup.Addon><InputGroup.Input aria-label="Workspace grouped" defaultValue="Keep grouped draft"/></InputGroup.Root>
 <div aria-hidden="true" style={{blockSize:'100dvh'}}/>
 <Input aria-label="Workspace last" defaultValue="Keep last draft"/>
</div>;}
declare global{interface Window{renderWorkspaceFocusCase:(config:WorkspaceFocusCase)=>void}}
let workspaceFocusCleanup:undefined|(()=>void);
window.renderWorkspaceFocusCase=config=>{
 workspaceFocusCleanup?.();workspaceFocusCleanup=undefined;
 nativeFocusCleanup?.();nativeFocusCleanup=undefined;
 const theme=getThemeController(window);theme.setMode(config.mode);
 if(!config.native){root.render(<AppShell key={`workspace-${config.mode}`} theme={theme} scrollMode="workspace" headerSlots={{brand:'Workspace focus'}} sidebar={<nav aria-label="Workspace navigation"><a href="#overview">Overview</a></nav>}><WorkspaceFocusFields/></AppShell>);return;}
 root.render(null);
 const host=document.createElement('div');document.body.append(host);
 const content=document.createElement('div');content.className='xui-stack';
 const input=(label:string,value:string)=>{const node=document.createElement('input');node.className='xui-input';node.setAttribute('aria-label',label);node.value=value;return node;};
 const group=document.createElement('div');group.className='xui-input-group';
 const addon=document.createElement('span');addon.className='xui-input-addon';addon.setAttribute('aria-hidden','true');addon.textContent='@';group.append(addon,input('Workspace grouped','Keep grouped draft'));
 const spacer=document.createElement('div');spacer.setAttribute('aria-hidden','true');spacer.style.blockSize='100dvh';
 content.append(input('Workspace first','Keep first draft'),group,spacer,input('Workspace last','Keep last draft'));
 const brand=document.createElement('span');brand.textContent='Workspace focus';
 const owner=createMenuLayout(host,{theme,scrollMode:'workspace',items:[{id:'overview',label:'Overview',href:'#overview'}],activeId:'overview',label:'Workspace navigation',headerSlots:{brand},content});
 workspaceFocusCleanup=()=>{owner.destroy();host.remove();};
};

import {TableActions,TableContainer,Table,TableBody,TableRow,TableCell} from '@coffeehc/xui-react/table';
declare global {interface Window {renderTableActionsCase:(native:boolean)=>void}}
window.renderTableActionsCase=native=>{
 const labels=['编辑这条记录并保留完整文字','撤销这条记录的权限','删除已经撤销的记录'];
 if(!native){root.render(<TableContainer aria-label="Action layout"><Table><TableBody><TableRow><TableCell><TableActions style={{maxInlineSize:'var(--layout-field-min)'}}>{labels.map(label=><Button key={label}>{label}</Button>)}</TableActions></TableCell></TableRow></TableBody></Table></TableContainer>);return;}
 root.render(null);const host=document.createElement('div');host.className='xui-table-container';host.setAttribute('role','region');host.setAttribute('aria-label','Action layout');host.innerHTML='<table class="xui-table"><tbody><tr class="xui-table-row"><td><div class="xui-table-actions" style="max-inline-size:var(--layout-field-min)">'+labels.map(label=>'<button type="button" class="xui-button">'+label+'</button>').join('')+'</div></td></tr></tbody></table>';document.body.append(host);
};

import {Textarea,NativeSelect} from '@coffeehc/xui-react/forms';
import {Combobox} from '@coffeehc/xui-react/combobox';
declare global{interface Window{renderInputTypographyCase:(native:boolean)=>void}}
window.renderInputTypographyCase=native=>{
 if(!native){root.render(<div className="xui-stack"><Field label="Text control"><Input defaultValue="Editable value"/></Field><Field label="Multiline control"><Textarea defaultValue="Editable text"/></Field><Field label="Native selection"><NativeSelect defaultValue="one"><option value="one">One</option><option value="two">Two</option></NativeSelect></Field><Select.Root defaultValue="one"><Select.Trigger aria-label="Themed selection"><Select.Value/></Select.Trigger><Select.Content><Select.List><Select.Item value="one">One</Select.Item></Select.List></Select.Content></Select.Root><Combobox.Root><Combobox.Input aria-label="Searchable selection"/></Combobox.Root></div>);return;}
 root.render(null);const host=document.createElement('div');host.className='xui-stack';host.innerHTML='<label class="xui-label" for="text-control">Text control</label><input id="text-control" class="xui-input" value="Editable value"><label class="xui-label" for="multiline-control">Multiline control</label><textarea id="multiline-control" class="xui-textarea">Editable text</textarea><label class="xui-label" for="native-selection">Native selection</label><select id="native-selection" class="xui-select"><option value="one">One</option><option value="two">Two</option></select>';document.body.append(host);
};
