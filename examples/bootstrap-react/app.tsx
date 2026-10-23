import * as React from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {type XuiConfigOverrides} from '@coffeehc/xui-runtime/config';
import {HTTPService} from '@coffeehc/xui-runtime/http';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {PageHeader,Section,FormGrid} from '@coffeehc/xui-react/layout';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
import {RouteProvider,RouteLink,useRoute,useRouteService} from '@coffeehc/xui-react/route';
import {useMenu,useI18n} from '@coffeehc/xui-react/services';
import '@coffeehc/xui-theme/style.css';

// A project can import this partial object from its own JSON; all other defaults
// come from the packaged @coffeehc/xui-runtime/config.json.
const params=new URLSearchParams(location.search),recover=params.has('recover-document');
const projectConfig:XuiConfigOverrides={
  ...(recover?{theme:{preset:'forest',mode:'system',scale:params.get('scale')==='1.5'?1.5:1}}:{}),
  app:{name:'研究工作区',title:'研究工作区'},router:{basePath:'/bootstrap-react'},
  i18n:{enabled:true,messages:{'zh-CN':{'tasks':'研究任务','settings':'偏好设置','name':'任务名称','back':'返回任务','navigation':'导航','closeNavigation':'关闭导航','skipContent':'跳至主内容'},en:{tasks:'Research tasks',settings:'Preferences',name:'Task name',back:'Back to tasks',navigation:'Navigation',closeNavigation:'Close navigation',skipContent:'Skip to content','xui.language':'Language'}}},
  menu:{labelKey:'navigation',items:[{id:'tasks',label:'研究任务',labelKey:'tasks',href:'/bootstrap-react/tasks',icon:'folder'},{id:'settings',label:'偏好设置',labelKey:'settings',href:'/bootstrap-react/settings',icon:'settings'},{id:'long',label:'面向研发团队的跨年度独立研究任务与观察窗口',href:'/bootstrap-react/long',icon:'document'}]},
};
const app=bootstrap(projectConfig);
function App(){
 const route=useRoute(),router=useRouteService(),menu=useMenu(),language=useI18n();
 const [draft,setDraft]=React.useState('保留任务草稿');
 const title=route.pathname.endsWith('/settings')?language.t('settings'):language.t('tasks');
 return <MenuLayout items={menu.items} label={menu.label} location={location.href} navigation={router.navigation} headerSlots={{brand:app.config.app.name}} pageHeader={<PageHeader title={title}/>} closeLabel={language.t('closeNavigation')} skipLabel={language.t('skipContent')}
   expandBranchLabel={item=>language.t('expand',{name:item.label},'展开 {name}')} collapseBranchLabel={item=>language.t('collapse',{name:item.label},'收起 {name}')}>
   <Section><FormGrid columns={2}><Field label={language.t('name')}><Input value={draft} onChange={event=>setDraft(event.target.value)}/></Field></FormGrid>
    <RouteLink href={router.href('/tasks')}>{language.t('back')}</RouteLink>
    <Button variant="ghost" onClick={()=>router.back()}>{language.locale==='en'?'Previous page':'上一页'}</Button>
   </Section>
 </MenuLayout>;
}
const recovery=recover?{owner:app.services.getThemeService(),http:app.services.getHttpService(),original:document.documentElement,errors:0,ready:false}:undefined;
function RecoveryDocument(){React.useEffect(()=>{if(recovery)recovery.ready=true;},[]);return <html lang="zh-CN"><head><meta charSet="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>主题生命周期恢复</title><link rel="stylesheet" href="/bootstrap-react/app.css"/></head><body className="xui"><Section><PageHeader title="主题生命周期恢复"/><Field label="恢复后的草稿"><Input defaultValue="原主题继续生效"/></Field><Button onClick={()=>app.services.getThemeService().setMode('dark')}>切换深色</Button></Section></body></html>;}
declare global {interface Window {bootstrapDemo:{app:typeof app;repeat:()=>typeof app;conflict:()=>void;recovery:typeof recovery}}}
window.bootstrapDemo={app,recovery,repeat:()=>{void HTTPService;return bootstrap(projectConfig);},conflict:()=>{bootstrap({...projectConfig,theme:{mode:'light'}});}};
if(recover)hydrateRoot(document,<RecoveryDocument/>,{onRecoverableError:()=>{if(recovery)recovery.errors++;}});
else createRoot(document.getElementById('root')!).render(<React.StrictMode><RouteProvider><App/></RouteProvider></React.StrictMode>);
