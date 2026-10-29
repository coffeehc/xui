import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {AuthService} from '@coffeehc/xui-runtime/auth';
import {HTTPService,getHttpErrorMessage,type ServerSentEvent} from '@coffeehc/xui-runtime/http';
import {Container,Stack,Toolbar,PageHeader} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Field,SimpleSelect} from '@coffeehc/xui-react/forms';
import {Card} from '@coffeehc/xui-react/display';
import '@coffeehc/xui-theme/style.css';

const authCalls:string[]=[],user={id:'42',username:'demo',display_name:'合成用户'},wire=(payload:unknown)=>Response.json({success:true,message:'',payload,code:1,request_id:'sse-demo'});
const app=bootstrap({auth:{enabled:true,protectedPaths:['/api/xui-example/events']}},{services:{http:{options:{baseURL:location.origin,fetch:async(input,init)=>{
  const url=new URL(String(input));if(url.pathname.startsWith('/api/v1/auth/')){authCalls.push(url.pathname);return wire(url.pathname.endsWith('/logout')?null:url.pathname.endsWith('/session')?{schema_version:2,user}:{schema_version:2,user,access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()});}
  return fetch(input,init); // Real fetch and HTTP chunks; auth DTOs above are synthetic only.
}}}}});
type EventRow={sequence:number;label:string;id:string;event:string};
function project(frame:ServerSentEvent):EventRow{const value=JSON.parse(frame.data);if(!value||!Number.isSafeInteger(value.sequence)||typeof value.label!=='string')throw new TypeError('Invalid fixture event');return {...value,id:frame.id,event:frame.event};}
const demo={authCalls,auth:AuthService,http:HTTPService,unmount:()=>{}};
(window as unknown as {eventsDemo:typeof demo}).eventsDemo=demo;
function App(){
  const [mode,setMode]=React.useState('chunks'),[status,setStatus]=React.useState('未连接'),[rows,setRows]=React.useState<EventRow[]>([]),[busy,setBusy]=React.useState(false);
  const owner=React.useRef<AbortController|null>(null),turn=React.useRef(0),auth=React.useSyncExternalStore(AuthService.subscribe,AuthService.getState,AuthService.getState);
  const stop=()=>{turn.current++;owner.current?.abort();owner.current=null;setBusy(false);setStatus('已停止');};
  React.useLayoutEffect(()=>{if(auth.status!=='authenticated')setRows([]);},[auth.status]);
  React.useEffect(()=>()=>{turn.current++;owner.current?.abort();},[]);
  const start=async()=>{owner.current?.abort();const signal=new AbortController(),current=++turn.current;owner.current=signal;setBusy(true);setStatus('连接中');setRows([]);
    try{await HTTPService.readEvents(`/api/xui-example/events?mode=${mode}`,{signal:signal.signal,endpointId:'demo.events',maxLineBytes:65536,project,onOpen(){if(current===turn.current)setStatus('读取中');},onEvent(event,signal){if(!signal.aborted&&current===turn.current)setRows(rows=>[...rows.slice(-9),event]);}});if(current===turn.current)setStatus('连接结束');}
    catch(error){if(current===turn.current)setStatus(signal.signal.aborted?'已停止':getHttpErrorMessage(error));}
    finally{if(current===turn.current){owner.current=null;setBusy(false);}}
  };
  return <Container style={{maxInlineSize:'var(--layout-dialog-max-width)',padding:'var(--layout-content-inset)'}}><Stack><PageHeader title="事件流读取" description="合成事件与认证 DTO；事件正文由本地 HTTP 服务分片发送。"/>
    <Toolbar><Button onClick={()=>void AuthService.login({username:'demo',password:'synthetic-only'})}>建立模拟会话</Button><Button disabled={auth.status!=='authenticated'} onClick={()=>void AuthService.logout()}>退出模拟会话</Button><Field label="响应场景"><SimpleSelect value={mode} disabled={busy} onChange={event=>setMode(event.target.value)}><option value="chunks">分片与多行数据</option><option value="live">持续连接</option><option value="denied">401</option><option value="forbidden">403</option><option value="large">消息超限</option></SimpleSelect></Field><Button disabled={busy||auth.status!=='authenticated'} onClick={()=>void start()}>读取事件</Button><Button disabled={!busy} onClick={stop}>停止读取</Button></Toolbar>
    <Card title="当前连接"><p role="status" data-connection>{status}</p><p data-identity>{auth.status}</p><ol aria-label="已收到的事件">{rows.map((row,index)=><li key={`${row.sequence}-${index}`} data-event>{row.sequence} · {row.label} · {row.event} · ID {row.id||'空'}</li>)}</ol></Card>
  </Stack></Container>;
}
const root=createRoot(document.getElementById('root')!);root.render(<App/>);demo.unmount=()=>{root.unmount();app.services.dispose();};
