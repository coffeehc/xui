import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import type {ThemeOptions} from '@coffeehc/xui-runtime/theme';
import type {XuiConfigOverrides} from '@coffeehc/xui-runtime/config';

/** Use the browser application's installed service owners in ordinary examples. */
export function bootstrapBrowserExample(overrides:XuiConfigOverrides={}){
  const themeOptions:ThemeOptions|undefined=window.xuiThemeOptions;
  return bootstrap(overrides,themeOptions?{services:{theme:{options:themeOptions}}}:{});
}
