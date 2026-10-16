import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeService} from '@coffeehc/xui-runtime/theme';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {AlertDialog} from '@coffeehc/xui-react/alert-dialog';
import {Button} from '@coffeehc/xui-react/button';
import {Input,Field} from '@coffeehc/xui-react/forms';
import {Container,PageHeader} from '@coffeehc/xui-react/layout';
import '@coffeehc/xui-theme/style.css';
ThemeService.getState();
const parameters=new URLSearchParams(location.search),root=createRoot(document.getElementById('root')!);
const bridge={ready:false,destroy:()=>root.unmount(),ref:undefined as HTMLButtonElement|null|undefined,refAttachments:0,refCleanups:0,readRef:()=>null as HTMLButtonElement|null};
Object.assign(window,{continuityDemo:bridge});
function GuardExample(){
 const [sidebarOpen,setSidebarOpen]=React.useState(false),[confirmation,setConfirmation]=React.useState(false),[destination,setDestination]=React.useState(false),trigger=React.useRef<HTMLButtonElement|null>(null),target=React.useRef<HTMLButtonElement|null>(null),keep=React.useRef(true);
 const attach=React.useCallback((node:HTMLButtonElement|null)=>{trigger.current=node;bridge.ref=node;if(node)bridge.refAttachments++;return()=>{trigger.current=null;bridge.ref=null;bridge.refCleanups++;};},[]);
 const navigation=React.useMemo(()=>({canNavigate:()=>true,navigate:()=>{keep.current=true;setConfirmation(true);}}),[]);
 React.useEffect(()=>{bridge.ready=true;bridge.readRef=()=>trigger.current;},[]);
 return <><MenuLayout label="工作导航" title="公共焦点组合" sidebarOpen={sidebarOpen} onSidebarOpenChange={setSidebarOpen} navigation={navigation} navigationTriggerRef={parameters.has('no-fallback')?undefined:parameters.has('object-ref')?trigger:attach} items={[{id:'settings',label:parameters.has('long')?'团队协作设置与权限核对：长中文导航名称':'设置',href:'?target=settings',icon:'folder'}]}><Container><PageHeader title={destination?'设置':'编辑草稿'}/><Field label="尚未保存的说明"><Input defaultValue="保留这份草稿"/></Field><Button ref={target} variant="outline">页面操作</Button></Container></MenuLayout>
 <AlertDialog.Root open={confirmation} onOpenChange={setConfirmation}><AlertDialog.Content finalFocus={parameters.has('no-fallback')?undefined:()=>keep.current?trigger.current:target.current}><AlertDialog.Title>尚未保存的修改</AlertDialog.Title><AlertDialog.Body>离开将丢失当前草稿，请选择继续编辑或明确放弃。</AlertDialog.Body><AlertDialog.Footer><AlertDialog.Close render={<Button variant="outline"/>} onClick={()=>{keep.current=true;}}>保留草稿</AlertDialog.Close><AlertDialog.Close render={<Button/>} onClick={()=>{keep.current=false;setDestination(true);}}>放弃草稿并继续</AlertDialog.Close></AlertDialog.Footer></AlertDialog.Content></AlertDialog.Root></>;
}
root.render(<React.StrictMode><GuardExample/></React.StrictMode>);
