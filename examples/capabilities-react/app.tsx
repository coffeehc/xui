import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Button} from '@coffeehc/xui-react/button';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {AlertDialog} from '@coffeehc/xui-react/alert-dialog';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {Container,PageHeader,Toolbar,Stack} from '@coffeehc/xui-react/layout';
import {Alert} from '@coffeehc/xui-react/feedback';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {Table,TableContainer,TableHead,TableBody,TableRow,TableHeaderCell,TableCell,TableExpandedRow,TableExpandButton} from '@coffeehc/xui-react/table';
import {ApiKeyManager} from '@coffeehc/xui-react/api-key';
import {BusinessLogExplorer} from '@coffeehc/xui-react/business-log';
import {requestDownload,saveDownload} from '@coffeehc/xui-runtime/download';
import {getHttpErrorMessage} from '@coffeehc/xui-runtime/http';
import {createCapabilityExample} from '../shared/capability-model';
import '@coffeehc/xui-theme/critical.css';
import '@coffeehc/xui-theme/floating.css';
const owner=await createCapabilityExample(location.href),root=createRoot(document.getElementById('root')!);
// Exercise the real public Sheet side prop in independently packed consumers.
const requestedSheetSide=new URLSearchParams(location.search).get('sheetSide');
const sheetSide=(['start','end','top','bottom'] as const).find(side=>side===requestedSheetSide)??'end';
function App(){const [sheet,setSheet]=React.useState(false),[alert,setAlert]=React.useState(false),[draft,setDraft]=React.useState('保留草稿'),[expanded,setExpanded]=React.useState(false),[selected,setSelected]=React.useState(false),[feedback,setFeedback]=React.useState(''),[menuCount,setMenuCount]=React.useState(0),[busy,setBusy]=React.useState(false);const cancelRef=React.useRef<HTMLButtonElement>(null),fileAbort=React.useRef<AbortController|undefined>(undefined),revision=React.useRef(0);
 React.useEffect(()=>{void owner.keyController.refresh();void owner.logController.refresh();return()=>{revision.current++;fileAbort.current?.abort();};},[]);
 const download=async()=>{const current=++revision.current,controller=new AbortController();fileAbort.current=controller;setBusy(true);setFeedback('正在下载');try{const result=await requestDownload(owner.http,'/demo/download',{signal:controller.signal});if(current!==revision.current)return;saveDownload(result);setFeedback(`已下载 ${result.fileName}`);}catch(error){if(current===revision.current)setFeedback(getHttpErrorMessage(error));}finally{if(current===revision.current)setBusy(false);}};
 return <Container><Stack><PageHeader title="公共能力" actions={<><Button onClick={()=>setSheet(true)}>打开侧栏</Button><Button disabled={busy} onClick={download}>下载报告</Button>{busy&&<Button variant="outline" onClick={()=>fileAbort.current?.abort()}>取消下载</Button>}</>}/><p role="status">{feedback||`菜单执行 ${menuCount} 次`}</p>
 <ContextMenu.Root><ContextMenu.Trigger tabIndex={0} aria-label="记录操作区域">记录操作区域</ContextMenu.Trigger><ContextMenu.Content><ContextMenu.Item onClick={()=>setMenuCount(value=>value+1)}>查看记录</ContextMenu.Item><ContextMenu.Item disabled>不可用操作</ContextMenu.Item><ContextMenu.CheckboxItem>保留菜单选择</ContextMenu.CheckboxItem><ContextMenu.RadioGroup defaultValue="one"><ContextMenu.RadioItem value="one">菜单选项一</ContextMenu.RadioItem><ContextMenu.RadioItem value="two">菜单选项二</ContextMenu.RadioItem></ContextMenu.RadioGroup><ContextMenu.SubmenuRoot><ContextMenu.SubmenuTrigger>更多操作</ContextMenu.SubmenuTrigger><ContextMenu.Content><ContextMenu.Item onClick={()=>setMenuCount(value=>value+1)}>子菜单操作</ContextMenu.Item><ContextMenu.Item disabled>禁用子项</ContextMenu.Item></ContextMenu.Content></ContextMenu.SubmenuRoot></ContextMenu.Content></ContextMenu.Root>
 <TableContainer aria-label="公共表格"><Table striped><TableHead><TableRow><TableHeaderCell sticky="start">编号</TableHeaderCell><TableHeaderCell>详情</TableHeaderCell><TableHeaderCell>内容</TableHeaderCell><TableHeaderCell sticky="end">操作</TableHeaderCell></TableRow></TableHead><TableBody>{[1,2,3].map(id=><React.Fragment key={id}><TableRow selected={id===1&&selected} expanded={id===1&&expanded}><TableCell sticky="start">L0{id}</TableCell><TableCell>{id===1?<TableExpandButton expanded={expanded} controls="demo-expanded" onClick={()=>setExpanded(!expanded)}>展开详情</TableExpandButton>:'—'}</TableCell><TableCell>{'完整长中文字段 '.repeat(12)}</TableCell><TableCell sticky="end"><Button variant="outline" onClick={()=>setSelected(!selected)}>选中</Button></TableCell></TableRow>{id===1&&expanded&&<TableExpandedRow id="demo-expanded" colSpan={4}>展开后的允许披露详情</TableExpandedRow>}</React.Fragment>)}</TableBody></Table></TableContainer>
 <Disclosure title="访问密钥标准接口"><ApiKeyManager controller={owner.keyController}/></Disclosure><Disclosure title="业务日志标准接口"><BusinessLogExplorer controller={owner.logController}/></Disclosure>
 <Sheet.Root open={sheet} onOpenChange={(next,details)=>{if(!next&&draft){details.cancel();setAlert(true);}else setSheet(next);}}><Sheet.Content side={sheetSide}><Sheet.Title>编辑侧栏</Sheet.Title><Sheet.Body><Field label="草稿"><Input value={draft} onChange={event=>setDraft(event.target.value)}/></Field>{Array.from({length:25},(_,index)=><p key={index}>长内容 {index+1}：完整文字在所属正文滚动。</p>)}</Sheet.Body><Sheet.Footer><Sheet.Close render={<Button variant="outline"/>}>关闭侧栏</Sheet.Close></Sheet.Footer>
 <AlertDialog.Root open={alert} onOpenChange={setAlert}><AlertDialog.Content initialFocus={cancelRef}><AlertDialog.Title>放弃未保存草稿？</AlertDialog.Title><AlertDialog.Description>放弃后本地草稿会清空。</AlertDialog.Description><AlertDialog.Footer><AlertDialog.Close render={<Button ref={cancelRef} variant="outline"/>}>继续编辑</AlertDialog.Close><Button variant="destructive" onClick={()=>{setDraft('');setAlert(false);setSheet(false);}}>确认放弃</Button></AlertDialog.Footer></AlertDialog.Content></AlertDialog.Root></Sheet.Content></Sheet.Root>
 </Stack></Container>;
}
root.render(<App/>);Object.assign(window,{capabilityDemo:{...owner,destroy(){root.unmount();owner.destroy();}}});window.addEventListener('pagehide',()=>owner.destroy(),{once:true});
