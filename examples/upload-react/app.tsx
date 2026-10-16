import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Upload,type UploadController} from '@coffeehc/xui-react/upload';
import {createUploadController,UploadService} from '@coffeehc/xui-runtime/upload';
import {HTTPService} from '@coffeehc/xui-runtime/http';
import {ThemeService,setInterfaceScale} from '@coffeehc/xui-runtime/theme';
import {Button} from '@coffeehc/xui-react/button';
import {Input} from '@coffeehc/xui-react/forms';
import {PageHeader,Section,Stack,Toolbar} from '@coffeehc/xui-react/layout';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';

bootstrapBrowserExample();
type Result={id:string;name:string};
const options={path:'/api/demo/upload',service:UploadService,multiple:true,accept:'.txt,.csv',maxFiles:4,maxFileSize:1024,request:{fields:{purpose:'example'}}} as const;
const a=createUploadController<Result>(options),b=createUploadController<Result>(options);
const demo={a,b,current:a,service:UploadService,http:HTTPService,theme:ThemeService,setScale:setInterfaceScale,swap:(_mode:'A'|'B'|'default')=>{},setMounted:(_value:boolean)=>{},setDisabled:(_value:boolean)=>{},setReadOnly:(_value:boolean)=>{},setEnglish:(_value:boolean)=>{}};
(window as unknown as {uploadDemo:typeof demo}).uploadDemo=demo;
const english={select:'Select files',drop:'or drop files here',upload:'Upload',cancel:'Cancel',remove:'Remove',retry:'Upload again',queued:'Queued',uploading:'Uploading',success:'Uploaded',error:'Upload unconfirmed',canceled:'Stopped waiting',invalid:'Invalid file',type:'Unsupported file type',size:'File exceeds size limit',count:'Too many files',unknown:'Result unconfirmed. Check the server before uploading again to avoid duplicate files.',waiting:'Waiting for server confirmation',bytes:'bytes'};
function Panel({mode,disabled,readOnly,english:en}:{mode:'A'|'B'|'default';disabled:boolean;readOnly:boolean;english:boolean}){
 const current=mode==='A'?a:b;
 React.useLayoutEffect(()=>{demo.current=current;},[current]);
 const owner=mode==='default'?{options}:{controller:current};
 return <Upload<Result> {...owner} label={en?'Supporting files':'附件'} description={en?'TXT or CSV, up to 4 files, 1,024 bytes per file.':'TXT、CSV，最多 4 个文件，每个不超过 1,024 字节。'} required disabled={disabled} readOnly={readOnly} labels={en?english:undefined} locale={en?'en':'zh-CN'} renderResult={file=><span>{en?'Confirmed record: ':'已确认记录：'}{file.response.payload.id}</span>}/>;
}
function App(){
 const [mode,setMode]=React.useState<'A'|'B'|'default'>('A'),[mounted,setMounted]=React.useState(true),[disabled,setDisabled]=React.useState(false),[readOnly,setReadOnly]=React.useState(false),[english,setEnglish]=React.useState(false);
 React.useLayoutEffect(()=>{Object.assign(demo,{swap:setMode,setMounted,setDisabled,setReadOnly,setEnglish});},[]);
 return <main className="xui-container xui-stack" style={{padding:'var(--layout-content-inset)'}}><PageHeader title="文件上传"/><Section><Stack><Toolbar aria-label="示例控制"><Button variant="outline" onClick={()=>setMode(mode==='A'?'B':'A')}>切换队列</Button><Button variant="outline" onClick={()=>setMode('default')}>默认队列</Button><Button variant="outline" onClick={()=>setMounted(!mounted)}>切换视图</Button><Button variant="outline" onClick={()=>setDisabled(!disabled)}>切换禁用</Button><Button variant="outline" onClick={()=>setReadOnly(!readOnly)}>切换只读</Button></Toolbar><Input aria-label="操作草稿" defaultValue="保留焦点与草稿"/>{mounted&&<Panel mode={mode} disabled={disabled} readOnly={readOnly} english={english}/>}</Stack></Section></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
