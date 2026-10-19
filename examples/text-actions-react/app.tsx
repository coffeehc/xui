import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Container,Stack,Toolbar,PageHeader} from '@coffeehc/xui-react/layout';
import {Button,IconButton} from '@coffeehc/xui-react/button';
import {Card} from '@coffeehc/xui-react/display';
import {Disclosure,DisclosureIndicator} from '@coffeehc/xui-react/navigation';
import {Input,Field} from '@coffeehc/xui-react/forms';
import {createOverlayController} from '@coffeehc/xui-runtime/interaction';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';
const query=new URLSearchParams(location.search),theme=bootstrapBrowserExample().services.getThemeService();theme.setMode(query.get('mode')==='dark'?'dark':query.get('mode')==='system'?'system':'light');theme.setPreset((['violet','ember','forest','crimson','cobalt','precision'] as const).find(value=>value===query.get('preset'))??'violet');if(query.get('dir')==='rtl')document.documentElement.dir='rtl';
let requests=0;const controller=createOverlayController({defaultOpen:false,onOpenChange:()=>requests++});
function EditIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="m16 3 5 5L9 20l-6 1 1-6Z"/><path d="m14 5 5 5"/></svg>;}
function App(){
 const [open,setOpen]=React.useState(false),[disabled,setDisabled]=React.useState(false),[title,setTitle]=React.useState('计划：先核对事实，再执行已授权的步骤'),id=React.useId();const toolClicks=React.useRef(0);
 Object.assign(window,{textActionsDemo:{controller,setDisabled,setTitle,get requests(){return requests;},get calls(){return toolClicks.current;}}});
 return <Container><Stack><PageHeader title="透明文字动作"/><Toolbar><IconButton variant="ghost" aria-label="编辑研究任务" onClick={()=>toolClicks.current++}><EditIcon/></IconButton><Button variant="text" data-icon="true" aria-label="编辑工作区" onClick={()=>toolClicks.current++}><EditIcon/></Button><IconButton variant="outline" aria-label="编辑配置" onClick={()=>toolClicks.current++}><EditIcon/></IconButton></Toolbar><Card title="研究任务" footerActions={<><IconButton variant="text" aria-label="编辑卡片任务" onClick={()=>toolClicks.current++}><EditIcon/></IconButton><IconButton variant="text" tone="danger" aria-label="删除卡片任务" onClick={()=>toolClicks.current++}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></IconButton></>}/><Toolbar><Button data-testid="tools" variant="text" disabled={disabled} aria-expanded={open} aria-controls={id} onClick={()=>{toolClicks.current++;setOpen(value=>!value);}}>调用了 2 次工具<DisclosureIndicator open={open}/></Button><Button variant="ghost" data-testid="default-ghost">默认ghost动作</Button><Button variant="outline" onClick={()=>setDisabled(value=>!value)}>切换可用状态</Button></Toolbar><div id={id} hidden={!open}>工具记录由宿主保留，同一折叠入口不改变任务状态。</div><Disclosure controller={controller} title={title} variant="text" disabled={disabled}><Field label="保留计划草稿"><Input aria-label="保留计划草稿" defaultValue="公开控件中的草稿"/></Field><Button variant="text" onClick={()=>controller.setOpen(false)}>收起计划</Button></Disclosure><Disclosure variant="default" title="默认Disclosure外观">默认背景反馈保留。</Disclosure></Stack></Container>;
}
createRoot(document.getElementById('root')!).render(<App/>);
