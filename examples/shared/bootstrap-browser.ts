import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import type {ThemeOptions} from '@coffeehc/xui-runtime/theme';

/** Use the browser application's installed service owners in ordinary examples. */
export function bootstrapBrowserExample(){
  const themeOptions:ThemeOptions|undefined=window.xuiThemeOptions;
  return bootstrap({},themeOptions?{services:{theme:{options:themeOptions}}}:{});
}
