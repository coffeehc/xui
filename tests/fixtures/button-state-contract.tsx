import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Button,IconButton} from '@coffeehc/xui-react/button';
import {Menu} from '@coffeehc/xui-react/menu';
import {Input} from '@coffeehc/xui-react/forms';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {SearchToolbar} from '@coffeehc/xui-react/search-toolbar';
import {Accordion} from '@coffeehc/xui-react/accordion';
import {TableExpandButton} from '@coffeehc/xui-react/table';
import {ToggleGroup} from '@coffeehc/xui-react/toggle-group';
import '@coffeehc/xui-runtime/init.js';
import {ThemeService} from '@coffeehc/xui-runtime/theme';
import '@coffeehc/xui-theme/style.css';

const variants=['primary','secondary','outline','ghost','destructive','link'] as const;
const iconVariants=[...variants,'text'] as const;
const states=['enabled','busy','disabled','disabled-busy'] as const;
declare global{interface Window{buttonStateClicks:Record<string,number>}}
window.buttonStateClicks={};
const query=new URLSearchParams(location.search);if(query.has('mode'))ThemeService.setMode(query.get('mode')==='dark'?'dark':query.get('mode')==='system'?'system':'light');if(query.has('preset'))ThemeService.setPreset((['violet','ember','forest','crimson','cobalt','precision'] as const).find(p=>p===query.get('preset'))??'violet');if(query.get('dir')==='rtl')document.documentElement.dir='rtl';
const record=(id:string)=>{window.buttonStateClicks[id]=(window.buttonStateClicks[id]??0)+1;};
function Icon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>;}
function EditIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="m16 3 5 5L9 20l-6 1 1-6Z"/><path d="m14 5 5 5"/></svg>;}
function ExpansionCases(){
 const [expanded,setExpanded]=React.useState(false),ref=React.useRef<HTMLButtonElement>(null);
 Object.assign(window,{expansionDemo:{get trigger(){return ref.current;}}});
 return <section className="xui-surface"><h2>Shared expansion actions</h2>
  <Menu.Root><Menu.Trigger data-testid="default-inline-trigger" ref={ref} className={state=>state.open?'host-open':'host-closed'}>展开通用菜单</Menu.Trigger><Menu.Content><Menu.Item>普通菜单项</Menu.Item></Menu.Content></Menu.Root>
  <Menu.Root><Menu.Trigger disabled data-testid="disabled-inline-trigger">禁用展开菜单</Menu.Trigger><Menu.Content><Menu.Item>不可到达项</Menu.Item></Menu.Content></Menu.Root>
  <Disclosure title="默认折叠入口"><Input aria-label="折叠草稿" defaultValue="原位折叠草稿"/></Disclosure>
  <SearchToolbar search={<Input aria-label="主要搜索"/>} advancedLabel="展开搜索条件" advanced={<Input aria-label="高级搜索草稿" defaultValue="保留的高级条件"/>}/>
  <Accordion.Root><Accordion.Item value="rules"><Accordion.Header><Accordion.Trigger>展开分组规则</Accordion.Trigger></Accordion.Header><Accordion.Panel keepMounted><Input aria-label="规则草稿" defaultValue="保留的规则"/></Accordion.Panel></Accordion.Item></Accordion.Root>
  <TableExpandButton data-testid="row-expand" expanded={expanded} controls="row-expand-panel" onClick={()=>setExpanded(value=>!value)}>展开行详情</TableExpandButton><div id="row-expand-panel" hidden={!expanded}>原位行详情</div>
 </section>;
}
createRoot(document.getElementById('root')!).render(<main className="xui-stack">
 <h1>Button state contracts</h1>
 <section className="xui-surface"><h2>Compact icon actions</h2><div className="xui-toolbar"><IconButton data-testid="compact-edit" variant="text" aria-label="编辑任务" onClick={()=>record('compact-edit')}><EditIcon/></IconButton><IconButton data-testid="compact-edit-outline" variant="outline" aria-label="编辑配置"><EditIcon/></IconButton><Button data-icon="true" variant="ghost" aria-label="编辑工作区"><EditIcon/></Button></div></section>
 <section className="xui-surface"><h2>Transparent table actions</h2><div className="xui-toolbar">{(['enabled','busy','disabled','disabled-busy','expanded'] as const).map(state=><IconButton key={state} variant="text" tone="danger" data-testid={`danger-text-${state}`} aria-label={`删除 ${state}`} disabled={state.startsWith('disabled')} aria-busy={state.includes('busy')||undefined} aria-expanded={state==='expanded'?true:undefined} onClick={()=>record(`danger-text-${state}`)}><Icon/></IconButton>)}<IconButton variant="text" aria-label="查看" data-testid="table-view"><Icon/></IconButton><Button variant="text" tone="danger" data-testid="danger-text-label">删除记录</Button><Button variant="primary" tone="danger" data-testid="nontext-tone-control">明确主动作</Button></div></section>
 <ExpansionCases/>
 <section className="xui-surface"><h2>Inline menu trigger</h2><Input aria-label="保留消息草稿" defaultValue="同一输入区草稿"/><div className="xui-toolbar"><Menu.Root><Menu.Trigger render={<Button variant="text" data-testid="inline-model-trigger"/>}><Icon/>当前模型与长中文名称<svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none"><path d="m6 9 6 6 6-6"/></svg></Menu.Trigger><Menu.Content><Menu.Item onClick={()=>record('model-choice')}>切换模型</Menu.Item></Menu.Content></Menu.Root><Menu.Root><Menu.Trigger render={<IconButton variant="ghost" data-testid="round-menu-trigger" aria-label="附件操作"/>}><Icon/></Menu.Trigger><Menu.Content><Menu.Item onClick={()=>record('attachment-choice')}>添加附件</Menu.Item></Menu.Content></Menu.Root><Menu.Root><Menu.Trigger render={<Button variant="primary" data-testid="explicit-primary-trigger"/>}>显式主动作菜单</Menu.Trigger><Menu.Content><Menu.Item>普通动作</Menu.Item></Menu.Content></Menu.Root></div></section>
 <section className="xui-surface"><h2>Icon-only shapes</h2>
  {iconVariants.map(variant=><div key={variant} className="xui-toolbar">{(['enabled','busy','disabled','disabled-busy','expanded'] as const).map(state=>{const id=`round-${variant}-${state}`;return <IconButton key={state} data-testid={id} variant={variant} aria-label={`${variant} ${state} 图标操作`} disabled={state.startsWith('disabled')} aria-busy={state.includes('busy')||undefined} aria-expanded={state==='expanded'?true:undefined} aria-controls={state==='expanded'?'icon-shape-panel':undefined} onClick={()=>record(id)}><Icon/></IconButton>;})}<Button variant={variant} data-icon="true" aria-label={`${variant} 显式标记`} data-testid={`round-${variant}-marked`} onClick={()=>record(`${variant}-marked`)}><Icon/></Button></div>)}
  <div id="icon-shape-panel">展开态关联区域</div>
  <div className="xui-toolbar"><IconButton data-testid="round-stop" aria-label="停止"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z" fill="currentColor"/></svg></IconButton><IconButton data-testid="round-render" aria-label="查看文件" nativeButton={false} role="link" render={<a href="#icon-shape-panel"/>} onClick={()=>record('round-render')}><Icon/></IconButton><Button data-testid="round-text-control"><Icon/>带图标的长中文文字按钮</Button><Button data-testid="round-false-control" data-icon="false">普通文字按钮</Button></div>
 </section>
 {variants.map(variant=><section key={variant} className="xui-surface"><h2>{variant}</h2><div className="xui-toolbar">{states.map(state=>{const id=`${variant}-${state}`;return <Button key={state} data-testid={id} variant={variant} disabled={state.startsWith('disabled')} aria-busy={state.includes('busy')||undefined} onClick={()=>record(id)}><Icon/>{id}</Button>;})}</div></section>)}
 <ToggleGroup.Root defaultValue={['selected']} disabled aria-label="Disabled selected group"><ToggleGroup.Item value="selected" data-testid="disabled-selected-toggle">Selected disabled toggle</ToggleGroup.Item></ToggleGroup.Root>
 <Button variant="link" nativeButton={false} disabled render={<a href="#disabled-destination"/>} data-testid="disabled-link-element" onClick={()=>record('disabled-link-element')}>Disabled anchor</Button>
 <Button variant="link" nativeButton={false} role="link" render={<a href="#link-destination"/>} data-testid="enabled-link-element" onClick={()=>record('enabled-link-element')}>查看链接操作与长中文名称</Button>
 <section className="xui-surface"><h2>Button sizes</h2>
  <div className="xui-toolbar">{(['xs','sm','default','lg'] as const).map(size=><Button key={size} size={size} data-testid={`size-${size}-text`}><Icon/>Save</Button>)}</div>
  <div className="xui-toolbar">{(['xs','sm','default','lg'] as const).map(size=><IconButton key={size} size={size} data-testid={`size-${size}-icon`} aria-label={`${size} save`}><Icon/></IconButton>)}</div>
 </section>
 <section className="xui-surface"><h2>Extra small states</h2>{variants.map(variant=><div key={variant} className="xui-toolbar">{states.map(state=><Button key={state} size="xs" variant={variant} data-testid={`xs-${variant}-${state}`} disabled={state.startsWith('disabled')} aria-busy={state.includes('busy')||undefined}><Icon/>保存</Button>)}<Button size="xs" variant={variant} data-testid={`xs-${variant}-long`} style={{maxInlineSize:'var(--layout-field-min)'}}>保存完整的中文操作名称并允许它自然换行</Button></div>)}</section>
</main>);
