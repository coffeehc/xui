import type {ThemeMode} from './theme.js';

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
