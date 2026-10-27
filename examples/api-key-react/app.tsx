import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Container} from '@coffeehc/xui-react/layout';
import {resolveDefaultPages} from '@coffeehc/xui-runtime/config';
import {ApiKeyManager} from '@coffeehc/xui-react/api-key';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import {createApiKeyShowcase} from '../shared/api-key-showcase';
import {Switch} from '@coffeehc/xui-react/forms';
import {Toast,type ToastPayload} from '@coffeehc/xui-react/toast';
import {createToastController} from '@coffeehc/xui-runtime/toast';


import {createApiKeyHttpExample} from '../shared/api-key-http-model';
import {createApiKeyExample} from '../shared/api-key-model';
import '@coffeehc/xui-theme/critical.css';
import '@coffeehc/xui-theme/floating.css';
const configured=new URLSearchParams(location.search).has('defaults'),application=bootstrapBrowserExample(configured?{pages:{apiKeys:{title:'公共密钥管理',pageSize:1,pageSizeOptions:[1,2]}}}:{}),pages=resolveDefaultPages(application.config);
const official=new URLSearchParams(location.search).has('official'),httpExample=official?await createApiKeyHttpExample():undefined;
const showcase=new URLSearchParams(location.search).has('showcase'),demoShowcase=showcase?createApiKeyShowcase():undefined,example=httpExample??demoShowcase??createApiKeyExample(configured?pages.apiKeys.labels:undefined),root=createRoot(document.getElementById('root')!);
if(configured)Object.assign(window,{defaultPagesDemo:{config:application.config,pages}});
const notifications=createToastController<ToastPayload>();
const PreviewShell=new URLSearchParams(location.search).has('embed')?(({children}:{children:React.ReactNode})=><>{children}</>):MenuLayout;
const keyCopy=(httpExample?.keyCopy?{...httpExample.keyCopy,labels:{copy:'复制 API Key',copied:'已复制 API Key',copyError:'复制失败，请重试'}}:undefined)??(demoShowcase?{readValue:(record:Parameters<typeof demoShowcase.canCopy>[0])=>{const value=demoShowcase.readSyntheticSecret(record.id);if(!value)throw Error('Synthetic credential unavailable');return value;},canCopy:demoShowcase.canCopy,unavailableLabel:(record:Parameters<typeof demoShowcase.canCopy>[0])=>record.id==='showcase-4'?'仅保存哈希，无法再次取得完整密钥':'密钥已失效',labels:{copy:'复制 API Key',copied:'已复制 API Key',copyError:'复制失败，请重试'}}:undefined);
const initialList=new URLSearchParams(location.search).get('initial-list');
if(initialList==='hold'||initialList==='error')example.setBehavior('list',initialList);
if(initialList==='empty')example.setRows([]);
function App(){const [copyEnabled,setCopyEnabled]=React.useState(true);return(<React.StrictMode><Toast.Provider controller={notifications}><Toast.View/><PreviewShell title="xui" label="管理导航" items={[{id:'keys',label:'API Key',icon:'folder',href:location.pathname}]} activeId="keys"><Container style={new URLSearchParams(location.search).has('embed')?{padding:'var(--layout-content-inset)'}:undefined}><ApiKeyManager locale="zh-CN" controller={example.controller} toastController={notifications} keyCopy={(showcase||official)&&copyEnabled?keyCopy:false} headerActions={showcase||official?<Switch label="点击密钥复制" checked={copyEnabled} onChange={event=>setCopyEnabled(event.target.checked)}/>:undefined} pagination={new URLSearchParams(location.search).has('all')?false:configured?pages.apiKeys.pagination:undefined} tableLabels={{pageSize:'每页条数',pagination:'密钥分页',previous:'上一页',next:'下一页',count:({rowCount,total})=>total===null?`已读取 ${rowCount} 条`:`本页 ${rowCount} 条，共 ${total} 条`}} writeClipboard={'writeClipboard'in example?example.writeClipboard:undefined}/></Container></PreviewShell></Toast.Provider></React.StrictMode>); }
const render=()=>root.render(<App/>);render();
void example.controller.refresh();
Object.assign(window,{apiKeyDemo:{...example,unmountView(){root.render(null);},remountView:render,destroy(){root.unmount();example.destroy();}}});
window.addEventListener('pagehide',()=>example.destroy(),{once:true});
