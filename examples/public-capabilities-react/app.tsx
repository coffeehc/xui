import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Container,Stack,Toolbar,PageHeader} from '@coffeehc/xui-react/layout';
import {Surface,DataRegion,LoadingState,ErrorState,useResource} from '@coffeehc/xui-react/feedback';
import {Field,Input,SimpleSelect} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
import {LinkedText,Typography} from '@coffeehc/xui-react/display';
import {Toast,type ToastPayload} from '@coffeehc/xui-react/toast';
import {createToastController} from '@coffeehc/xui-runtime/toast';
import {createModuleResource} from '@coffeehc/xui-runtime/loading';
import {observeThemeColors,readThemeColors} from '@coffeehc/xui-runtime/theme-colors';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';
const app=bootstrapBrowserExample(),theme=app.services.getThemeService();
const query=new URLSearchParams(location.search);theme.setMode(query.get('mode')==='dark'?'dark':query.get('mode')==='system'?'system':'light');
const queue=createToastController<ToastPayload>({exitTimeout:10000});
const moduleResource=createModuleResource<{message:string}>({timeoutMs:1000,resolve:(_key,context)=>({moduleURL:new URL(`./feature.js?attempt=${context.retry?context.request:0}`,location.href).href,styles:[new URL('./optional.css',location.href).href]}),load:(url)=>import(url)});
let colorRefresh=()=>{},colorDispose=()=>{},colorNotices=0,parentClicks=0,actions=0;
const tokenMap={accent:'--action-primary',surface:'--background',foreground:'--foreground'};
function Colors(){
 const canvas=React.useRef<HTMLCanvasElement>(null),[colors,setColors]=React.useState<ReturnType<typeof readThemeColors<typeof tokenMap>>>();
 React.useLayoutEffect(()=>{const observer=observeThemeColors(tokenMap,next=>{colorNotices++;setColors(next);const ctx=canvas.current?.getContext('2d');if(ctx){ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.fillStyle=next.accent?.css??'transparent';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);}},{theme});colorRefresh=observer.refresh;colorDispose=observer.dispose;return observer.dispose;},[]);
 return <Stack><Typography.Heading level={2}>绘图颜色</Typography.Heading><canvas ref={canvas} aria-label="主题强调色绘图" style={{inlineSize:'var(--layout-field-min)',blockSize:'var(--control-height)',maxInlineSize:'100%'}}/><output hidden data-testid="colors" data-colors={JSON.stringify(colors)}/></Stack>;
}
function App(){
 const [scope,setScope]=React.useState(1),[rowClicks,setRowClicks]=React.useState(0),[locale,setLocale]=React.useState('zh'),[alive,setAlive]=React.useState(true),state=useResource(moduleResource);
 React.useEffect(()=>{Object.assign(window,{publicCapabilities:{queue,moduleResource,theme,readThemeColors,observeThemeColors,get colorNotices(){return colorNotices;},get parentClicks(){return parentClicks;},get actions(){return actions;},refreshColors:()=>colorRefresh(),disposeColors:()=>colorDispose(),switchScope:()=>flushSync(()=>setScope(value=>value+1)),unmount:()=>setAlive(false),dispose(){queue.destroy();moduleResource.destroy();app.services.dispose();}}});},[]);
 if(!alive)return <Button onClick={()=>{moduleResource.destroy();queue.destroy();colorDispose();}}>释放示例</Button>;
 return <Toast.Provider controller={queue} scopeKey={scope}><Container><Stack>
 <PageHeader title="公共能力组合" actions={<Toolbar><Field label="显示模式"><SimpleSelect aria-label="显示模式" defaultValue={query.get('mode')??'light'} onChange={event=>theme.setMode(event.target.value as 'light'|'dark'|'system')}><option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option></SimpleSelect></Field><Field label="配色"><SimpleSelect aria-label="配色" defaultValue="violet" onChange={event=>theme.setPreset(event.target.value as 'violet'|'forest')}><option value="violet">紫色</option><option value="forest">绿色</option></SimpleSelect></Field></Toolbar>}/>
 <Surface><Stack><Typography.Heading level={2}>正文链接</Typography.Heading><div data-testid="linked-row" onClick={()=>{parentClicks++;setRowClicks(parentClicks);}}><LinkedText data-testid="prose" stopPropagation value={'说明：https://example.com/docs?q=中文。保留 emoji 😀、括号 (https://example.org/a_(b)) 与换行\n原文。'}/></div><output aria-label="行操作次数">{rowClicks}</output><LinkedText data-testid="elements">{['数字 ',42,' 与 ',<strong key="element">保留元素 https://element.example</strong>]}</LinkedText><LinkedText data-testid="rejected" value={'javascript:alert(1) https://user:pass@example.com https://127.1/x https://exa\u200bmple.com'}/><Field label="键盘草稿"><Input aria-label="键盘草稿" defaultValue="保留操作上下文"/></Field></Stack></Surface>
 <Surface><Stack><Typography.Heading level={2}>通知</Typography.Heading><Toolbar><Button onClick={()=>queue.add({title:'操作完成',description:'长中文通知只属于当前身份，可继续查看同一结果。'.repeat(4),timeout:-1,actionProps:{children:'查看结果',onClick:()=>actions++}})}>显示通知</Button><Button onClick={()=>{queue.clear();setScope(value=>value+1);}}>切换身份</Button><Button variant="outline" onClick={()=>setLocale(value=>value==='zh'?'en':'zh')}>切换通知语言</Button></Toolbar></Stack></Surface>
 <Surface><Stack><Typography.Heading level={2}>按需模块</Typography.Heading><Toolbar><Button onClick={()=>moduleResource.load('panel')}>加载模块</Button><Button variant="outline" disabled={!state.busy} onClick={moduleResource.cancel}>取消加载</Button><Button variant="outline" onClick={moduleResource.destroy}>释放模块</Button></Toolbar><DataRegion aria-label="模块区域" busy={state.busy} feedback={state.busy?<LoadingState layout={state.hasValue?'inline':'block'}>模块加载中</LoadingState>:state.status==='error'?<ErrorState title="模块加载失败" onRetry={()=>moduleResource.retry()} retryLabel="重试模块"/>:null}>{state.hasValue?<p data-testid="module-content">{state.value!.module.message}</p>:state.status==='idle'?<p>尚未加载模块</p>:null}</DataRegion><output aria-label="模块阶段">{state.status}</output></Stack></Surface>
 <Surface><Colors/></Surface>
 </Stack></Container><Toast.View labels={locale==='en'?{region:'Notifications',close:'Dismiss notification'}:undefined}/></Toast.Provider>;
}
createRoot(document.getElementById('root')!).render(<App/>);
