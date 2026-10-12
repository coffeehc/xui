import {getThemeController,type ThemeController,type ThemeMode} from './theme.js';

export interface ThemeModeLabels {light:string;dark:string;system:string;switchToLight:string;switchToDark:string;switchToSystem:string}
const defaults:Readonly<ThemeModeLabels>=Object.freeze({light:'浅色模式',dark:'暗黑模式',system:'跟随系统',switchToLight:'切换到浅色模式',switchToDark:'切换到暗黑模式',switchToSystem:'切换到跟随系统'});

/** The explicit preference is displayed even when system resolves to light/dark. */
export function getThemeModePresentation(mode:ThemeMode,labels?:Partial<ThemeModeLabels>){
  const next:ThemeMode=mode==='light'?'dark':mode==='dark'?'system':'light';
  const names={...defaults,...labels},title=next==='light'?names.switchToLight:next==='dark'?names.switchToDark:names.switchToSystem;
  const paths={
    light:['M14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z','M10 1v2m0 14v2M1 10h2m14 0h2M3.6 3.6 5 5m10 10 1.4 1.4M3.6 16.4 5 15M15 5l1.4-1.4'],
    dark:['M17 12.2A7.5 7.5 0 0 1 7.8 3a7.5 7.5 0 1 0 9.2 9.2Z'],
    system:['M2 3h16v11H2zM7 18h6m-3-4v4'],
  };
  return {next,label:`${names[mode]}. ${title}`,title,paths:paths[mode]};
}

/** Binds a view to the existing owner. Cleanup never destroys that shared owner. */
export function bindThemeModeButton(button:HTMLButtonElement,theme:ThemeController=getThemeController(button.ownerDocument.defaultView!),labels?:Partial<ThemeModeLabels>){
  const doc=button.ownerDocument,icon=doc.createElementNS('http://www.w3.org/2000/svg','svg');
  button.type='button';button.classList.add('xui-button','xui-theme-mode-toggle');button.dataset.variant='ghost';button.dataset.icon='true';
  icon.setAttribute('class','xui-theme-mode-icon');icon.setAttribute('viewBox','0 0 20 20');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');
  button.replaceChildren(icon);
  const render=()=>{const mode=theme.getState().mode,presentation=getThemeModePresentation(mode,labels);button.dataset.themeMode=mode;button.setAttribute('aria-label',presentation.label);button.title=presentation.title;icon.replaceChildren(...presentation.paths.map(d=>{const path=doc.createElementNS(icon.namespaceURI!,'path');path.setAttribute('d',d);return path;}));};
  const click=(event:MouseEvent)=>{if(!button.disabled&&!event.defaultPrevented)theme.setMode(getThemeModePresentation(theme.getState().mode).next);};
  render();const unsubscribe=theme.subscribe(render);button.addEventListener('click',click);
  return ()=>{unsubscribe();button.removeEventListener('click',click);};
}
