import type {NavigationAdapter,NavigationRequest} from './navigation.js';
/** History URI includes pathname, search and an optional in-page anchor; never a hash router. */
export interface RouteLocation {uri:string;pathname:string;search:string;hash:string;revision:number}
export interface RouteNavigateOptions {replace?:boolean}
export interface RouteServiceOptions {
 /** Origin-relative deployment prefix, e.g. /console. Routing cannot leave it. */
 basePath?:string;
 /** Explicit browser seam. null provides a request-local, read-only server snapshot. */
 window?:Window|null;
 /** SSR URI only; never read an application's route from another request. */
 initialURI?:string;
}
export interface RouteService {
 readonly basePath:string;
 getState:()=>Readonly<RouteLocation>;subscribe:(listener:()=>void)=>()=>void;
 /** Build a document URI from an app-relative /path, ?query and optional anchor. */
 href:(path:string)=>string;
 /** Resolve standard relative/document links. Returns null outside origin/prefix or for hash routing. */
 resolve:(uri:string)=>string|null;
 navigate:(uri:string,options?:RouteNavigateOptions)=>boolean;
 back:()=>void;forward:()=>void;
 /** Public navigation bridge, preserving normal modifiers/targets/downloads at the link boundary. */
 readonly navigation:NavigationAdapter;
}
export interface OwnedRouteService extends RouteService {dispose:()=>void}
const hashRoute=(hash:string)=>/^#(?:!|\/)/.test(hash);
function prefix(input:string){if(typeof input!=='string'||!input.startsWith('/')||input.startsWith('//')||/[?#\\]/.test(input))throw new TypeError('basePath must be an origin-relative path');const path=new URL(input,'https://xui.invalid').pathname.replace(/\/+$/,'');return path==='/'?'':path;}
/** Package-private construction. Public applications configure/get the singleton service. */
export function buildRouteService(options:RouteServiceOptions={}):OwnedRouteService {
 const win=options.window===undefined?(typeof window==='undefined'?null:window):options.window,basePath=prefix(options.basePath??'/'),baseURL=win?.location.href??'https://xui.invalid/';
 const application=new URL(baseURL);
 if(!application.hostname)throw new TypeError('History routing requires a hierarchical application origin');
 const sameOrigin=(target:URL)=>target.protocol===application.protocol&&target.hostname===application.hostname&&target.port===application.port;
 const inside=(path:string)=>!basePath||path===basePath||path.startsWith(basePath+'/');
 const initial=options.initialURI??win?.location.href??(basePath||'/');
 let url=new URL(initial,baseURL);if(!sameOrigin(url)||!inside(url.pathname)||hashRoute(url.hash))throw new TypeError('Initial URI must use History routing inside basePath');
 let dead=false,listening=false,revision=0;const listeners=new Set<()=>void>();
 const snapshot=()=>Object.freeze({uri:url.pathname+url.search+url.hash,pathname:url.pathname,search:url.search,hash:url.hash,revision});let state:Readonly<RouteLocation>=snapshot();
 const read=()=>{if(!win||dead)return false;const next=new URL(win.location.href);if(next.href===url.href)return false;url=next;revision++;state=snapshot();return true;};
 const notify=()=>{if(!read())return;for(const listener of [...listeners])if(listeners.has(listener))listener();};
 const resolve=(uri:string)=>{if(dead||typeof uri!=='string'||!uri||/^[\u0000-\u0020]|[\u0000-\u001f]/.test(uri))return null;try{const next=new URL(uri,win?.location.href??url.href);if(!sameOrigin(next)||!inside(next.pathname)||hashRoute(next.hash))return null;return next.pathname+next.search+next.hash;}catch{return null;}};
 const navigate=(uri:string,request:RouteNavigateOptions={})=>{
  const next=resolve(uri);if(!win||next===null||dead)return false;
  const current=win.location.pathname+win.location.search+win.location.hash;if(next===current)return true;
  // The location is published only after History accepts the URI. No document reload,
  // fake popstate event, global anchor interception or query/request owner is created.
  if(request.replace)win.history.replaceState(win.history.state,'',next);else win.history.pushState(null,'',next);
  notify();return true;
 };
 const navigation:NavigationAdapter=Object.freeze({canNavigate:(request:NavigationRequest)=>{
  const resolved=resolve(request.url);if(resolved===null||request.href.startsWith('#'))return false;
  const target=new URL(resolved,baseURL),current=win?new URL(win.location.href):url;
  // Same-page anchors belong to the browser so their scrolling/focus behavior survives.
  return !(target.hash&&target.pathname===current.pathname&&target.search===current.search);
 },navigate:(request:NavigationRequest)=>{navigate(request.url);}});
 return Object.freeze({basePath:basePath||'/',getState:()=>{read();return state;},subscribe(listener:()=>void){if(dead)return()=>{};listeners.add(listener);if(win&&!listening){win.addEventListener('popstate',notify);win.addEventListener('hashchange',notify);listening=true;}return()=>{listeners.delete(listener);if(win&&!listeners.size&&listening){win.removeEventListener('popstate',notify);win.removeEventListener('hashchange',notify);listening=false;}};},
  href(path:string){if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||path.includes('\\'))throw new TypeError('Use an app-relative /path');const next=new URL((basePath||'')+path,baseURL);if(!inside(next.pathname)||hashRoute(next.hash))throw new TypeError('URI escapes basePath or uses hash routing');return next.pathname+next.search+next.hash;},resolve,navigate,navigation,back(){if(!dead)win?.history.back();},forward(){if(!dead)win?.history.forward();},
  dispose(){if(dead)return;dead=true;if(win&&listening){win.removeEventListener('popstate',notify);win.removeEventListener('hashchange',notify);}listening=false;listeners.clear();},
 });
}
