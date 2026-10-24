import type {ThemeController} from '@coffeehc/xui-runtime/theme';
import {setInterfaceScale} from '@coffeehc/xui-runtime/theme';
/** Only the local demo host can update its embedded preview's display preferences. */
export function bindDemoPreferences(theme:ThemeController){
 if(!new URLSearchParams(location.search).has('embed'))return;
 const receive=(event:MessageEvent)=>{if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='xui-demo-preferences')return;
  const {mode,preset,scale}=event.data;
  if(['light','dark','system'].includes(mode))theme.setMode(mode);
  if(['violet','precision','forest','ember','crimson','cobalt'].includes(preset))theme.setPreset(preset);
  if([1,1.25,1.5,2].includes(scale))setInterfaceScale(scale);
 };
 window.addEventListener('message',receive);window.addEventListener('pagehide',()=>window.removeEventListener('message',receive),{once:true});
}
