import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Popover} from '@coffeehc/xui-react/popover';
import {Button} from '@coffeehc/xui-react/button';
import {Input} from '@coffeehc/xui-react/forms';
import {createThemeController} from '@coffeehc/xui-runtime/theme';
import '@coffeehc/xui-theme/style.css';
import './popover-boundary.css';
const params=new URLSearchParams(location.search),side=params.get('side') as 'top'|'bottom'|'left'|'right'|null;
function App(){const [open,setOpen]=React.useState(false),[accept,setAccept]=React.useState(true);Object.assign(window,{popoverBoundary:{setOpen,setAccept,getOpen:()=>open,getAccept:()=>accept}});return <main className="xui-stack"><Input aria-label="保留草稿" defaultValue="原有草稿"/><button id="outside">其他独立操作</button><div className="usage-toolbar"><Popover.Root open={open} onOpenChange={next=>{if(accept)setOpen(next);}}><Popover.Trigger render={<Button/>}>上下文与累计用量</Popover.Trigger><Popover.Content className="usage-popover" data-testid="usage-popup" positionerProps={{align:'end',...(side?{side}:{}),...(params.has('boundary')?{collisionBoundary:document.getElementById('root')!,collisionPadding:20}:{})}}><Popover.Title>上下文与累计用量</Popover.Title><dl>{Array.from({length:12},(_,index)=><div key={index}><dt>第{index+1}项上下文与累计用量长中文名称</dt><dd>合成统计内容：{(index+1)*12345}</dd></div>)}</dl><Button>末行操作</Button></Popover.Content></Popover.Root></div></main>;}
createThemeController();createRoot(document.getElementById('root')!).render(<App/>);
