import * as React from 'react';
import {hydrateRoot,createRoot} from 'react-dom/client';
import {ThemeService} from '@coffeehc/xui-runtime/theme';
import {createAdminSetupController} from '@coffeehc/xui-runtime/admin-setup';
import {StartupSetupExample,setupFormDemo,submit,check,type UsernamePolicy,type ExampleLanguage} from './view.js';
import '@coffeehc/xui-theme/style.css';
// init.js handles first paint; activate the same document owner for live system changes.
ThemeService.getState();
const controller=new URLSearchParams(location.search).has('injected')?createAdminSetupController({state:{status:'idle'},onSubmit:submit,onCheck:check}):undefined;
const parameters=new URLSearchParams(location.search),initialPolicy=(parameters.get('username')??'none') as UsernamePolicy,initialLanguage=(parameters.get('language')??'zh') as ExampleLanguage;
const element=document.getElementById('root')!,view=<React.StrictMode><StartupSetupExample controller={controller} initialPolicy={initialPolicy} initialLanguage={initialLanguage}/></React.StrictMode>;
const root=element.querySelector('main')?hydrateRoot(element,view):createRoot(element);if(!element.querySelector('main'))root.render(view);
setupFormDemo.destroy=()=>{root.unmount();controller?.destroy();};
Object.assign(window,{setupFormDemo});
