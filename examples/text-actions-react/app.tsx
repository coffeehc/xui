import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Container,Stack,Toolbar,PageHeader} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Disclosure,DisclosureIndicator} from '@coffeehc/xui-react/navigation';
import {Input,Field} from '@coffeehc/xui-react/forms';
import {createOverlayController} from '@coffeehc/xui-runtime/interaction';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';
const query=new URLSearchParams(location.search),theme=bootstrapBrowserExample().services.getThemeService();theme.setMode(query.get('mode')==='dark'?'dark':query.get('mode')==='system'?'system':'light');theme.setPreset((['violet','ember','forest','crimson','cobalt','precision'] as const).find(value=>value===query.get('preset'))??'violet');if(query.get('dir')==='rtl')document.documentElement.dir='rtl';
let requests=0;const controller=createOverlayController({defaultOpen:false,onOpenChange:()=>requests++});
function App(){
 const [open,setOpen]=React.useState(false),[disabled,setDisabled]=React.useState(false),[title,setTitle]=React.useState('计划：先核对事实，再执行已授权的步骤'),id=React.useId();const toolClicks=React.useRef(0);
 Object.assign(window,{textActionsDemo:{controller,setDisabled,setTitle,get requests(){return requests;},get calls(){return toolClicks.current;}}});
 return <Container><Stack><PageHeader title="透明文字动作"/><Toolbar><Button data-testid="tools" variant="text" disabled={disabled} aria-expanded={open} aria-controls={id} onClick={()=>{toolClicks.current++;setOpen(value=>!value);}}>调用了 2 次工具<DisclosureIndicator open={open}/></Button><Button variant="ghost" data-testid="default-ghost">默认ghost动作</Button><Button variant="outline" onClick={()=>setDisabled(value=>!value)}>切换可用状态</Button></Toolbar><div id={id} hidden={!open}>工具记录由宿主保留，同一折叠入口不改变任务状态。</div><Disclosure controller={controller} title={title} variant="text" disabled={disabled}><Field label="保留计划草稿"><Input aria-label="保留计划草稿" defaultValue="公开控件中的草稿"/></Field><Button variant="text" onClick={()=>controller.setOpen(false)}>收起计划</Button></Disclosure><Disclosure variant="default" title="默认Disclosure外观">默认背景反馈保留。</Disclosure></Stack></Container>;
}
createRoot(document.getElementById('root')!).render(<App/>);
