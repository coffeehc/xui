import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Button} from '@coffeehc/xui-react/button';
import {Textarea,Field} from '@coffeehc/xui-react/forms';
import {Container,PageHeader,Stack} from '@coffeehc/xui-react/layout';
import {ThemeService} from '@coffeehc/xui-runtime/theme';
import '@coffeehc/xui-theme/style.css';
ThemeService.getState();
const parameters=new URLSearchParams(location.search);
const events:{name:string;scroll:number}[]=[];
const demo={events,pause(){},resume(){},setWhole(_whole:boolean){}};
Object.assign(window,{dialogResumeDemo:demo});
function Example(){
 const[open,setOpen]=React.useState(false),[paused,setPaused]=React.useState(false),[whole,setWhole]=React.useState(parameters.has('whole'));
 const field=React.useRef<HTMLTextAreaElement>(null),body=React.useRef<HTMLDivElement>(null),trigger=React.useRef<HTMLButtonElement>(null),previous=React.useRef<HTMLElement|null>(null);
 const pending=React.useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 React.useEffect(()=>()=>{clearTimeout(pending.current);},[]);
 const pause=React.useCallback(()=>{previous.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setPaused(true);},[]);
 const resume=React.useCallback(()=>setPaused(false),[]);
 React.useLayoutEffect(()=>{demo.pause=pause;demo.resume=resume;demo.setWhole=setWhole;return()=>{demo.pause=()=>{};demo.resume=()=>{};demo.setWhole=()=>{};};},[pause,resume]);
 const record=(name:string)=>events.push({name,scroll:body.current?.scrollTop??0});
 return <Container><Stack><PageHeader title="保留弹窗的阅读位置"/><Button ref={trigger} onClick={()=>setOpen(true)}>打开保留详情</Button>
  <Dialog.Root open={open&&!paused} onOpenChange={setOpen}>
   <Dialog.Content keepMounted initialFocus={()=>{const target=previous.current;previous.current=null;if(target?.isConnected){target.focus({preventScroll:true});record('initialFocus');return false;}return true;}} finalFocus={paused?false:trigger}>
    <Dialog.Header><Dialog.Title>{whole?'很长的中文详情标题用于验证极端高度下的整体滚动退化。'.repeat(40):'保留的详情'}</Dialog.Title></Dialog.Header>
    <Dialog.Body ref={body}><p>{'这是用于验证阅读位置连续性的合成内容。'.repeat(1000)}</p><Field label="详情草稿"><Textarea ref={field} disabled={paused}/></Field></Dialog.Body>
    <Dialog.Footer><Button onClick={()=>{pause();clearTimeout(pending.current);pending.current=setTimeout(resume,350);}}>暂停后继续</Button><Dialog.Close render={<Button/>}>关闭</Dialog.Close></Dialog.Footer>
   </Dialog.Content>
  </Dialog.Root>
 </Stack></Container>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Example/></React.StrictMode>);
