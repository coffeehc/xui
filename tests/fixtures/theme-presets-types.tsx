import {ThemeService,type ThemePreset,type ThemeOptions,type ThemeState} from '@coffeehc/xui-runtime/theme';
import {resolveConfig} from '@coffeehc/xui-runtime/config';
const options:ThemeOptions={preset:'forest',defaultMode:'system'};
const state:Readonly<ThemeState>=ThemeService.getState();
const preset:ThemePreset=state.preset;
resolveConfig({theme:{preset,mode:'system'}});
if(false){
 ThemeService.setPreset('crimson');
 // @ts-expect-error The supported official families are a closed typed contract.
 ThemeService.setPreset('red');
 // @ts-expect-error Unknown configuration cannot silently fall back.
 resolveConfig({theme:{preset:'unknown'}});
}
void options;
