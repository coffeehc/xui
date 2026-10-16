import {XuiServices} from '../../packages/runtime/dist/services.js';

const owners=new WeakMap();

function remember(services,...instances){for(const instance of instances)if(instance&&typeof instance==='object')owners.set(instance,services);}

export function isolatedHttp(options,environment={}) {
 const services=new XuiServices({http:{options}},environment);
 const http=services.getHttpService();remember(services,http);return http;
}

export function isolatedAuth(httpOptions,authOptions,environment={}) {
 const services=new XuiServices({http:{options:httpOptions},auth:{options:authOptions}},environment);
 const http=services.getHttpService(),auth=services.getAuthService();remember(services,http,auth);return {services,http,auth};
}

export function isolatedTheme(options={},environment={}) {
 const services=new XuiServices({theme:{options}},environment);
 const theme=services.getThemeService(options.window??environment.window);remember(services,theme);return theme;
}

export function isolatedClipboard(options={},environment={}) {
 const services=new XuiServices({clipboard:{options}},environment);
 const clipboard=services.getClipboardService();remember(services,clipboard);return clipboard;
}

export function disposeServices(...instances){const seen=new Set();for(const instance of instances){const services=instance&&typeof instance==='object'?owners.get(instance):undefined;if(services&&!seen.has(services)){seen.add(services);services.dispose();}}}
