import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Popover,type PopoverContentProps} from '@coffeehc/xui-react/popover';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {Combobox} from '@coffeehc/xui-react/combobox';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {createThemeController} from '@coffeehc/xui-runtime/theme';
import '@coffeehc/xui-theme/style.css';

const params=new URLSearchParams(location.search);
const wide=params.has('wide'),align=(['start','center','end'].includes(params.get('align')??'')?params.get('align'):'start') as 'start'|'center'|'end',side=(['top','bottom','left','right'].includes(params.get('side')??'')?params.get('side'):'bottom') as 'top'|'bottom'|'left'|'right';
const items=Array.from({length:24},(_,i)=>`资源${String(i+1).padStart(2,'0')} · 研发团队共享的长中文名称与访问范围`);

function Editor({kind}:{kind:'dialog'|'sheet'}){
 const Modal=kind==='sheet'?Sheet:Dialog;
 const [container,setContainer]=React.useState<HTMLDivElement|null>(null),containerRef=React.useRef<HTMLDivElement|null>(null);
 const [pickerOpen,setPickerOpen]=React.useState(false),[accept,setAccept]=React.useState(true),[query,setQuery]=React.useState(''),[value,setValue]=React.useState('尚未选择'),[revision,setRevision]=React.useState(0),[confirmOpen,setConfirmOpen]=React.useState(false);
 const events=React.useRef<boolean[]>([]),portalRef=React.useRef<HTMLDivElement|null>(null),searchRef=React.useRef<HTMLInputElement|null>(null),pickerTrigger=React.useRef<HTMLButtonElement|null>(null);
 const modalRef=React.useCallback((node:HTMLDivElement|null)=>{containerRef.current=node;setContainer(node);},[]);
 React.useEffect(()=>{
  const api={setOpen:setPickerOpen,setAccept,update:()=>setRevision(n=>n+1),getEvents:()=>events.current,getPortal:()=>portalRef.current};
  Object.assign(window,{popoverPortal:api});
 },[container]);
 // container follows the public Portal contract: an element or RefObject, not a callback.
 const portalProps:PopoverContentProps['portalProps']=params.has('default')?undefined:{container:params.get('container')==='ref'?containerRef:container,...(params.has('keep')?{keepMounted:true}:{}),...(params.has('unmount')?{keepMounted:false}:{}),ref:portalRef,id:'picker-portal'};
 return <Modal.Root><Modal.Trigger render={<Button/>}>{kind==='sheet'?'打开抽屉':'打开对话框'}</Modal.Trigger>
  <Modal.Content ref={modalRef} data-testid="editor" initialFocus={pickerTrigger}>
   <Modal.Header><Modal.Title>编辑共享资源</Modal.Title></Modal.Header>
   <Modal.Body><div className="xui-stack"><Modal.Description>选择资源后可继续编辑，取消选择保留当前草稿。</Modal.Description>
    <Field label="保留草稿"><Input defaultValue="原有草稿"/></Field>
    <Popover.Root open={pickerOpen} onOpenChange={next=>{events.current.push(next);if(accept)setPickerOpen(next);}}>
     <Popover.Trigger ref={pickerTrigger} render={<Button variant="outline"/>}>选择资源</Popover.Trigger>
     {container&&<Popover.Content portalProps={portalProps} positionerProps={{align,side}} style={wide?{width:'calc(100vw - var(--layout-viewport-inset) * 2)'}:undefined} initialFocus={searchRef} data-testid="picker" data-revision={revision}>
      <Popover.Title>选择共享资源</Popover.Title><Popover.Description>搜索名称或使用键盘访问下方资源。</Popover.Description>
      <>{wide?<Combobox.Root<string> inline open items={items} onValueChange={item=>{if(item){setValue(item);setPickerOpen(false);}}}><Combobox.Input ref={searchRef} aria-label="搜索资源"/><Combobox.List>{items.map(item=><Combobox.Item key={item} value={item}>{item}</Combobox.Item>)}</Combobox.List></Combobox.Root>:<><Field label="搜索资源"><Input ref={searchRef} value={query} onChange={event=>setQuery(event.currentTarget.value)}/></Field>
      <div className="xui-stack" aria-label="可选资源">{items.filter(item=>item.includes(query)).map(item=><Button key={item} variant="ghost" onClick={()=>{setValue(item);setPickerOpen(false);}}>{item}</Button>)}{!items.some(item=>item.includes(query))&&<p role="status">没有匹配资源</p>}</div>
      </>}</><Button variant="outline" onClick={()=>setPickerOpen(false)}>取消选择</Button>
      <Button variant="outline" onClick={()=>{setPickerOpen(false);setConfirmOpen(true);}}>查看后续确认</Button>
     </Popover.Content>}
    </Popover.Root>
    <output aria-label="已选资源">{value}</output>
   </div></Modal.Body>
   <Modal.Footer><Modal.Close render={<Button/>}>完成编辑</Modal.Close></Modal.Footer>
   <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}><Dialog.Content data-testid="followup" finalFocus={pickerTrigger}>
    <Dialog.Header><Dialog.Title>后续确认</Dialog.Title></Dialog.Header><Dialog.Body><Dialog.Description>只检查焦点交接，不提交任何业务请求。</Dialog.Description></Dialog.Body><Dialog.Footer><Dialog.Close render={<Button/>}>返回编辑</Dialog.Close></Dialog.Footer>
   </Dialog.Content></Dialog.Root>
  </Modal.Content>
 </Modal.Root>;
}
function App(){return <main className="xui-stack"><h1>弹层内资源选择</h1><Editor kind={params.get('host')==='sheet'?'sheet':'dialog'}/></main>;}
createThemeController();createRoot(document.getElementById('root')!).render(<App/>);
