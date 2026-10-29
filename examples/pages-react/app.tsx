import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Toolbar,Stack} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Badge} from '@coffeehc/xui-react/feedback';
import {Field} from '@coffeehc/xui-react/forms';
import {ToggleGroup} from '@coffeehc/xui-react/toggle-group';
import {ThemeService,setInterfaceScale,type InterfaceScale} from '@coffeehc/xui-runtime/theme';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/critical.css';
const icons:Record<string,{paths:string[]}>= {key:{paths:['M8 11a4 4 0 1 1 3-3l6 6-3 3-2-2 1-1-2-2-1 1z']},user:{paths:['M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M4 17v-1a6 6 0 0 1 12 0v1']},shield:{paths:['M10 2l6 3v5c0 4-6 8-6 8S4 14 4 10V5z','M7 10l2 2 4-4']},warning:{paths:['M10 3l8 14H2z','M10 7v4M10 14h.01']}};
const pages=[
 {id:'api-key',label:'API Key 管理',icon:'key',path:'/api-key-react/?embed&showcase'},
 {id:'business-log',label:'业务日志',icon:'document',path:'/business-log-react/?embed&activity'},
 {id:'structured-log',label:'结构化错误日志',icon:'warning',path:'/log-react/?embed'},
 {id:'model-profile',label:'模型配置',icon:'settings',path:'/model-profile-react/?embed'},
 {id:'login',label:'用户登录',icon:'user',path:'/login-react/?embed&i18n&productName=XUI%20Console'},
 {id:'admin-setup',label:'管理员初始化',icon:'shield',path:'/admin-setup-react/?embed'},
 {id:'password-change',label:'修改密码',icon:'key',path:'/password-change-react/?embed'},
 {id:'buttons',label:'按钮与操作',icon:'settings',path:'/components-react/?embed&section=buttons'},
 {id:'forms',label:'表单与选择',icon:'settings',path:'/components-react/?embed&section=forms'},
 {id:'feedback',label:'状态与进度',icon:'warning',path:'/components-react/?embed&section=feedback'},
 {id:'containers',label:'Tabs 与容器',icon:'folder',path:'/components-react/?embed&section=containers'},
 {id:'overlays',label:'弹窗与浮层',icon:'folder',path:'/components-react/?embed&section=overlays'},
 {id:'menus',label:'菜单与操作配置',icon:'settings',path:'/components-react/?embed&section=menus'},
 {id:'display',label:'文字与媒体',icon:'document',path:'/components-react/?embed&section=display'},
 {id:'table',label:'数据表格',icon:'document',path:'/components-react/?embed&section=table'},
 {id:'breadcrumbs',label:'面包屑',icon:'folder',path:'/components-react/?embed&section=breadcrumbs'},
 {id:'carousel',label:'走马灯',icon:'document',path:'/components-react/?embed&section=carousel'},
 {id:'charts',label:'图表',icon:'document',path:'/components-react/?embed&section=charts'},
 {id:'upload',label:'文件上传',icon:'folder',path:'/components-react/?embed&section=upload'},
] as const;
bootstrapBrowserExample();const params=new URLSearchParams(location.search);
if(['light','dark','system'].includes(params.get('mode')??''))ThemeService.setMode(params.get('mode') as 'light'|'dark'|'system');
function App(){
 const [page,setPage]=React.useState(()=>pages.find(p=>p.id===params.get('page'))??pages[0]),[scale,setScale]=React.useState<InterfaceScale>(()=>{const value=Number(getComputedStyle(document.documentElement).getPropertyValue('--interface-scale'));return [1,1.25,1.5,2].includes(value)?value as InterfaceScale:1;});
 const frame=React.useRef<HTMLIFrameElement>(null),theme=React.useSyncExternalStore(ThemeService.subscribe,ThemeService.getState,ThemeService.getState);
 const sync=React.useCallback(()=>frame.current?.contentWindow?.postMessage({type:'xui-demo-preferences',mode:theme.mode,preset:theme.preset,scale},location.origin),[theme,scale]);
 React.useEffect(sync,[sync]);
 React.useEffect(()=>{const back=()=>setPage(pages.find(p=>p.id===new URLSearchParams(location.search).get('page'))??pages[0]);window.addEventListener('popstate',back);return()=>window.removeEventListener('popstate',back);},[]);
 return <MenuLayout title="XUI Demo" label="内置页面" resolveIcon={name=>icons[name]} theme={ThemeService} sidebarTogglePlacement="bottom" scrollMode="workspace" contentInset="edge" items={[{id:'builtin-pages',label:'内置页面',group:true,children:pages.slice(0,7).map(p=>({id:p.id,label:p.label,icon:p.icon,href:`?page=${p.id}`}))},{id:'base-components',label:'基础组件',group:true,children:pages.slice(7).map(p=>({id:p.id,label:p.label,icon:p.icon,href:`?page=${p.id}`}))}]} activeId={page.id}
  navigation={{navigate:request=>{const next=pages.find(p=>p.id===request.id);if(next){history.pushState(null,'',request.href);setPage(next);}}}}
  sidebarFooter={<Stack><Badge>Mock 预览</Badge><Field label="阅读比例"><ToggleGroup.Root aria-label="阅读比例" value={[String(scale)]} allowEmpty={false} onValueChange={values=>{if(values[0]){const value=Number(values[0]) as InterfaceScale;setScale(value);setInterfaceScale(value);}}}>{[['1','100%'],['1.25','125%'],['1.5','150%'],['2','200%']].map(([value,label])=><ToggleGroup.Item key={value} value={value}>{label}</ToggleGroup.Item>)}</ToggleGroup.Root></Field><Toolbar><Button variant="text" onClick={()=>frame.current?.contentWindow?.location.reload()}>重置场景</Button><Button variant="text" render={<a href={page.path.replace('&embed','').replace('?embed&','?').replace('?embed','')} target="_blank" rel="noopener"/>} nativeButton={false} role="link">独立打开</Button></Toolbar></Stack>}
  ><iframe ref={frame} title={`${page.label}公共页面预览`} src={page.path} onLoad={sync} style={{display:'block',inlineSize:'100%',blockSize:'100%',border:0}}/></MenuLayout>;
}
createRoot(document.getElementById('root')!).render(<App/>);
