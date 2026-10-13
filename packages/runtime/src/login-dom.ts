import {generateDomId} from './dom-id.js';
import {resolveLoginPageConfig,getLoginPageError,runLoginPageExtension,type AuthPageConfig,type LoginPageExtensions,type LoginPageAction,type LoginPageConfig,type AuthClient,type AuthUser} from './auth.js';
import {bindPressFeedback,createDialogController} from './dom.js';
import type {ThemeController} from './theme.js';
export interface LoginPageOptions {auth:AuthClient;theme:ThemeController;config:LoginPageConfig;brandVisual?:HTMLElement;extensions?:LoginPageExtensions;beforeFields?:HTMLElement;afterFields?:HTMLElement;onAuthenticated?:(user:Readonly<AuthUser>,returnTo:string)=>void|Promise<void>}
export interface AuthPageOptions {
  config:AuthPageConfig;
  /** Optional compact decoration in the identity header; inert and hidden on narrow screens. */
  brandVisual?:HTMLElement;content?:Node;actions?:Node;feedback?:Node;feedbackActions?:Node;alternatives?:Node;form?:{noValidate?:boolean;onSubmit?:(event:SubmitEvent)=>void};
}
export type {AuthPageConfig} from './auth.js';
const owners=new WeakSet<HTMLElement>();
/** Shared public authentication/startup layout; never creates an authentication owner. */
export function createAuthPage(root:HTMLElement,initial:AuthPageOptions){
  if(owners.has(root))throw new Error('An authentication page already owns this root');
  const resolve=(input:AuthPageConfig)=>{if(typeof input.title!=='string')throw new TypeError('An authentication page requires a title');return resolveLoginPageConfig(input);};
  const validateForm=(value:AuthPageOptions['form'])=>{if(value!==undefined&&(value===null||typeof value!=='object'))throw new TypeError('Invalid authentication page form');};
  validateForm(initial.form);let config=resolve(initial.config),options={...initial},dead=false;
  const doc=root.ownerDocument,original=Array.from(root.childNodes),node=<Tag extends keyof HTMLElementTagNameMap>(tag:Tag,className='',text?:string)=>{const element=doc.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element;};
  const page=node('main','xui xui-login-page'),card=node('section','xui-login-card'),brand=node('header','xui-login-brand'),brandContent=node('div','xui-login-brand-content'),identity=node('div','xui-login-identity'),logo=node('img','xui-login-logo'),product=node('strong'),description=node('p','xui-login-description'),visual=node('div','xui-login-visual');
  logo.referrerPolicy='no-referrer';identity.append(logo,product);visual.setAttribute('aria-hidden','true');visual.inert=true;brandContent.append(identity,description,visual);brand.append(brandContent);
  const form=initial.form===undefined?null:node('form','xui-login-form'),panel=form??node('section','xui-login-form'),content=node('div','xui-login-content'),body=node('div','xui-login-body'),title=node('h1','',config.title),actions=node('footer','xui-login-actions'),alternatives=node('div','xui-login-options'),support=node('div','xui-login-support'),feedback=node('div','xui-login-feedback');
  title.id=generateDomId(doc,'xui-auth')+'-title';card.setAttribute('aria-labelledby',title.id);body.append(title);content.append(body,actions,alternatives);support.append(feedback);panel.append(content,support);card.append(brand,panel);page.append(card);
  type SlotName='content'|'actions'|'feedback'|'feedbackActions'|'alternatives'|'brandVisual';
  type Slot={parent:HTMLElement;anchor:Comment;value:Node|undefined;nodes:Node[]};
  const makeSlot=(parent:HTMLElement,name:SlotName):Slot=>{const anchor=doc.createComment(name);parent.append(anchor);return {parent,anchor,value:undefined,nodes:[]};};
  const slots:Record<SlotName,Slot>={content:makeSlot(body,'content'),actions:makeSlot(actions,'actions'),feedback:makeSlot(feedback,'feedback'),feedbackActions:makeSlot(feedback,'feedbackActions'),alternatives:makeSlot(alternatives,'alternatives'),brandVisual:makeSlot(visual,'brandVisual')};
  const slotNames=Object.keys(slots) as SlotName[],fragments=new WeakMap<Node,Node[]>(),layoutNodes=new Set<Node>([page,card,brand,brandContent,identity,logo,product,description,visual,panel,content,body,title,actions,alternatives,support,feedback]);
  const validateSlots=(candidate:AuthPageOptions)=>{const used=new Set<Node>();for(const name of slotNames){const value=candidate[name];if(value===undefined)continue;if(!value||typeof value.nodeType!=='number'||typeof value.contains!=='function'||value===root||value.contains(root)||layoutNodes.has(value)||value.contains(slots[name].parent))throw new TypeError('Invalid authentication page content');if(used.has(value))throw new TypeError('Each authentication page slot needs its own node');used.add(value);}};
  const replaceSlot=(name:SlotName,value:Node|undefined)=>{
    const slot=slots[name];if(slot.value===value)return;
    for(const child of slot.nodes)if(child.parentNode===slot.parent)slot.parent.removeChild(child);
    let children:Node[]=[];
    if(value){if(value.nodeType===11){children=fragments.get(value)??Array.from(value.childNodes);fragments.set(value,children);}else children=[value];}
    slot.anchor.before(...children);slot.value=value;slot.nodes=children;
  };
  const render=()=>{
    page.dataset.layout=config.layout;card.classList.toggle('xui-surface',config.layout==='card');if(product.textContent!==config.productName)product.textContent=config.productName;if(title.textContent!==config.title)title.textContent=config.title;
    logo.hidden=!config.logo;if(config.logo){if(logo.getAttribute('src')!==config.logo.src)logo.src=config.logo.src;if(logo.alt!==config.logo.alt)logo.alt=config.logo.alt;}else{logo.removeAttribute('src');logo.alt='';}
    description.hidden=config.description===undefined;const text=config.description??'';if(description.textContent!==text)description.textContent=text;
    for(const name of slotNames)replaceSlot(name,options[name]);
    actions.hidden=slots.actions.nodes.length===0;alternatives.hidden=slots.alternatives.nodes.length===0;visual.hidden=slots.brandVisual.nodes.length===0;
    if(form)form.noValidate=options.form?.noValidate??false;
  };
  // A pure layout form must never fall through to a browser GET containing fields.
  const submit=(event:SubmitEvent)=>{event.preventDefault();if(!dead)options.form?.onSubmit?.(event);};
  validateSlots(options);render();form?.addEventListener('submit',submit);root.replaceChildren(page);owners.add(root);const press=bindPressFeedback(page);
  return {getElement:()=>page,getForm:()=>form,update(next:Partial<AuthPageOptions>){
    if(dead)return;const candidate={...options,...next};validateForm(candidate.form);if((candidate.form!==undefined)!==(form!==null))throw new TypeError('Authentication page form mode cannot change');validateSlots(candidate);const nextConfig=resolve(candidate.config);options=candidate;config=nextConfig;render();
  },destroy(){if(dead)return;dead=true;form?.removeEventListener('submit',submit);press();if(root.childNodes.length===1&&root.firstChild===page)root.replaceChildren(...original);else if(page.parentNode===root)page.remove();owners.delete(root);}};
}
/** Complete public page, configured with data; shares the host's auth and theme owners. */
export function createLoginPage(root:HTMLElement,{auth,config:input,onAuthenticated,extensions,beforeFields,afterFields,brandVisual}:LoginPageOptions){
  if(owners.has(root))throw new Error('A login page already owns this root');
  const config=resolveLoginPageConfig(input),{labels}=config,doc=root.ownerDocument;let dead=false,active=true,request=0,viewAbort:AbortController|undefined,viewOperation:'session'|'login'|'extension'|null=null,sessionFailed=false,extensionBusy:string|null=null,extensionError=false;
  let navigationUser:Readonly<AuthUser>|null=null,navigationRevision=0,navigationPhase:'idle'|'opening'|'failed'='idle';
  const node=<Tag extends keyof HTMLElementTagNameMap>(tag:Tag,className='',text?:string)=>{const element=doc.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element;};
  const button=(text:string,variant='primary')=>{const element=node('button','xui-button',text);element.type='button';element.dataset.variant=variant;return element;};
  const prefix=generateDomId(doc,'xui-login'),body=doc.createDocumentFragment();
  const fields=node('div','xui-stack'),username=node('input','xui-input'),password=node('input','xui-input'),errors={username:node('p','xui-error'),password:node('p','xui-error')};
  for(const [key,input,label] of [['username',username,labels.username],['password',password,labels.password]] as const){const field=node('div','xui-field'),name=node('label','xui-label',label);input.id=prefix+'-'+key;input.name=key;input.required=true;input.type=key==='password'?'password':'text';input.autocomplete=key==='password'?'current-password':'username';input.maxLength=key==='password'?4096:128;name.htmlFor=input.id;errors[key].id=input.id+'-error';input.setAttribute('aria-describedby',errors[key].id);errors[key].hidden=true;field.append(name,input,errors[key]);fields.append(field);input.oninput=()=>{input.removeAttribute('aria-invalid');errors[key].hidden=true;};}
  const before=node('fieldset','xui-login-extension'),after=node('fieldset','xui-login-extension');if(beforeFields)before.append(beforeFields);if(afterFields)after.append(afterFields);body.append(before,fields,after);
  const feedback=node('div','xui-alert'),actions=doc.createDocumentFragment(),alternativeContent=doc.createDocumentFragment(),feedbackActions=doc.createDocumentFragment(),submit=button(labels.submit),check=button(labels.checkSession,'ghost'),retryNavigation=button(labels.retryNavigation,'ghost');
  feedback.tabIndex=-1;submit.type='submit';submit.dataset.size='lg';check.dataset.size=retryNavigation.dataset.size='sm';
  submit.classList.add('xui-login-submit');submit.dataset.idleLabel=labels.submit;submit.dataset.busyLabel=labels.signingIn;
  const submitText=node('span','',labels.submit),openingReservation=node('span','xui-login-opening-reservation',labels.opening);openingReservation.setAttribute('aria-hidden','true');submit.replaceChildren(submitText,openingReservation);
  const checkRecovery=button(labels.checkRecovery,'ghost'),terminateRecovery=button(labels.terminateRecovery,'outline');checkRecovery.dataset.size=terminateRecovery.dataset.size='sm';
  feedbackActions.append(check,retryNavigation,checkRecovery,terminateRecovery);
  const extensionButtons=(extensions?.actions??[]).map(action=>{const element=button(action.label,'outline');element.onclick=()=>{if(viewAbort||auth.getState().busy||auth.getState().status==='authenticated')return;clearPassword();void run('extension',undefined,action);};return {element,action};});
  actions.append(submit);alternativeContent.append(...extensionButtons.map(entry=>entry.element));
  const layout=createAuthPage(root,{config,brandVisual,content:body,actions,feedback,feedbackActions,alternatives:alternativeContent,form:{noValidate:true}}),page=layout.getElement(),form=layout.getForm()!;
  let recoveryId:string|null=null;
  const recoveryDialog=node('dialog','xui-layer xui-dialog xui-alert-dialog'),recoveryTitle=node('h2','xui-dialog-title',labels.recoveryTitle),recoveryDescription=node('p','xui-dialog-description',labels.recoveryDescription),recoveryFooter=node('div','xui-dialog-footer'),keepBlocked=button(labels.cancelRecovery,'outline'),confirmRecovery=button(labels.confirmRecovery);
  recoveryTitle.id=prefix+'-recovery-title';recoveryDescription.id=prefix+'-recovery-description';recoveryDialog.setAttribute('role','alertdialog');recoveryDialog.setAttribute('aria-labelledby',recoveryTitle.id);recoveryDialog.setAttribute('aria-describedby',recoveryDescription.id);recoveryFooter.append(keepBlocked,confirmRecovery);recoveryDialog.append(recoveryTitle,recoveryDescription,recoveryFooter);page.append(recoveryDialog);
  const recoveryControl=createDialogController(recoveryDialog,terminateRecovery,{open:false,initialFocus:()=>keepBlocked,onOpenChange:open=>{recoveryId=open?auth.getState().recovery?.operationId??null:null;recoveryControl.syncOpen(!!recoveryId);}});
  keepBlocked.onclick=()=>{recoveryId=null;recoveryControl.syncOpen(false);};
  const clearPassword=()=>{password.value='';password.defaultValue='';password.textContent='';};
  const openApplication=async(user:Readonly<AuthUser>,retry=false)=>{
    const state=auth.getState();if(dead||!active||state.status!=='authenticated'||state.user?.id!==user.id||state.reauthenticationRequired||state.busy||viewAbort||sessionFailed)return;
    if(navigationUser?.id===user.id&&(!retry||navigationPhase!=='failed'))return;
    const revision=++navigationRevision;navigationUser=user;navigationPhase='opening';clearPassword();render();
    try{if(onAuthenticated)await onAuthenticated(user,config.returnTo);else{const location=doc.defaultView!.location,target=new URL(config.returnTo,location.href);if(target.pathname===location.pathname&&target.search===location.search)throw new Error('The target is the current page');location.assign(config.returnTo);}}
    catch{if(!dead&&active&&revision===navigationRevision&&(auth.getState().status==='authenticated'&&auth.getState().user?.id===user.id||!auth.getState().reauthenticationRequired&&auth.getState().status==='unknown'&&auth.getState().busy!=='login'&&auth.getState().busy!=='logout')){navigationPhase='failed';render();feedback.focus();}}
  };
  const run=async(operation:'session'|'login'|'extension',credentials?:{username:string;password:string},action?:LoginPageAction)=>{
    if(dead||!active)return;const revision=++request;viewAbort?.abort();const controller=new AbortController();viewAbort=controller;viewOperation=operation;sessionFailed=false;extensionError=false;render();let extensionPhase=false;
    try{if(operation==='extension'||operation==='login'&&extensions?.beforeSubmit){extensionPhase=true;extensionBusy=operation==='extension'?action!.label:labels.signingIn;render();await runLoginPageExtension(operation==='extension'?action!.run:extensions!.beforeSubmit!,{username:credentials?.username??username.value,signal:controller.signal});if(dead||!active||revision!==request||controller.signal.aborted)return;extensionBusy=null;render();extensionPhase=false;}if(operation==='extension')return;if(operation==='login')await auth.login(credentials!,{signal:controller.signal});else{const user=await auth.currentUser({signal:controller.signal});if(auth.getState().status==='authenticated'&&auth.getState().user?.id!==user?.id)throw new Error('Session identity changed');}}
    catch{if(!dead&&active&&revision===request&&!controller.signal.aborted){if(operation==='session')sessionFailed=true;else extensionError=extensionPhase||!auth.getState().error;render();feedback.focus();}}
    finally{if(credentials)credentials.password='';if(revision===request&&viewAbort===controller){viewAbort=undefined;viewOperation=null;extensionBusy=null;clearPassword();synchronize();}}
  };
  const runRecovery=async(resolve:boolean,id?:string)=>{
    if(dead||!active||viewAbort||auth.getState().busy)return;const revision=++request,controller=new AbortController();viewAbort=controller;viewOperation='session';sessionFailed=false;extensionError=false;recoveryId=null;recoveryControl.syncOpen(false);clearPassword();render();
    try{if(resolve&&id)await auth.resolveRecovery?.(id,{signal:controller.signal});else await auth.inspectRecovery?.({signal:controller.signal});}
    catch{/* Failure and pending identity remain owned by auth. */}
    finally{if(!dead&&active&&revision===request){viewAbort=undefined;viewOperation=null;synchronize();(auth.getState().reauthenticationRequired?feedback:username).focus();}}
  };
  checkRecovery.onclick=()=>{void runRecovery(false);};confirmRecovery.onclick=()=>{const id=recoveryId;if(id)void runRecovery(true,id);};
  form.onsubmit=event=>{event.preventDefault();if(!active||auth.getState().status==='authenticated'||auth.getState().busy||viewAbort)return;const credentials={username:username.value,password:password.value};let invalid=false;for(const key of ['username','password'] as const){const empty=key==='username'?!credentials.username.trim():!credentials.password;errors[key].hidden=!empty;errors[key].textContent=empty?labels[key==='username'?'usernameRequired':'passwordRequired']:'';(key==='username'?username:password).setAttribute('aria-invalid',String(empty));invalid ||= empty;}if(invalid){(!credentials.username.trim()?username:password).focus();return;}clearPassword();void run('login',credentials);};
  check.onclick=()=>{void run('session');};retryNavigation.onclick=()=>{const user=auth.getState().user;if(user)void openApplication(user,true);};
  const render=()=>{if(dead)return;const state=auth.getState(),authenticated=state.status==='authenticated',navigating=authenticated&&!state.busy&&viewOperation===null&&!sessionFailed,navigationFailed=navigating&&navigationPhase==='failed',busy=!!state.busy||viewOperation!==null||extensionBusy!==null||authenticated&&!sessionFailed&&!navigationFailed,locked=busy||authenticated;before.disabled=after.disabled=locked;for(const {element,action} of extensionButtons)element.disabled=locked||!!action.disabled;username.disabled=password.disabled=submit.disabled=locked;const canCheck=!busy&&!state.reauthenticationRequired&&(sessionFailed&&!state.error||!authenticated&&state.error?.metadata.endpointId==='auth.session'&&(state.error.kind==='network'||state.error.kind==='timeout'||state.error.kind==='http'&&(state.error.status??0)>=500));check.hidden=!canCheck;check.disabled=!canCheck;const canRecover=state.reauthenticationRequired&&state.recovery?.canResolve&&!!auth.inspectRecovery&&!!auth.resolveRecovery;checkRecovery.hidden=terminateRecovery.hidden=!canRecover;checkRecovery.disabled=terminateRecovery.disabled=busy||!canRecover;if(recoveryId&&(!canRecover||state.recovery?.operationId!==recoveryId)){recoveryId=null;recoveryControl.syncOpen(false);}retryNavigation.hidden=!navigationFailed;retryNavigation.disabled=!navigationFailed;const submitLabel=navigating?labels.opening:state.busy==='login'||viewOperation==='login'?labels.signingIn:labels.submit;if(submitText.textContent!==submitLabel){submitText.textContent=submitLabel;submit.scrollTop=0;}feedback.hidden=!state.reauthenticationRequired&&!state.error&&!state.busy&&!viewOperation&&!extensionBusy&&!extensionError&&!sessionFailed&&!authenticated;feedback.textContent=extensionError?(extensions?.errorLabel??'登录配置或认证方式暂不可用，请检查后重试。'):navigationFailed?labels.navigationError:navigating?labels.opening:extensionBusy??(state.reauthenticationRequired&&!state.busy&&!viewOperation?labels.reauthenticate:state.error?getLoginPageError(state.error,labels):sessionFailed?labels.error:state.busy||viewOperation?labels[viewOperation==='session'||state.busy==='session'||state.busy==='refresh'?'checking':'signingIn']:'');const error=state.reauthenticationRequired&&!busy||navigationFailed||extensionError||sessionFailed||!!state.error&&state.error.kind!=='cancel';feedback.dataset.tone=error?'error':'info';feedback.setAttribute('role',error?'alert':'status');if(authenticated||state.error)clearPassword();};
  const synchronize=()=>{const state=auth.getState();if(state.status!=='authenticated'||!state.user||state.reauthenticationRequired){if(navigationUser&&(state.reauthenticationRequired||state.status==='anonymous'||state.busy==='login'||state.busy==='logout')){navigationRevision++;navigationUser=null;navigationPhase='idle';}}render();if(state.status==='authenticated'&&state.user&&!state.busy&&!state.reauthenticationRequired){const user=state.user;queueMicrotask(()=>{void openApplication(user);});}};
  const off=auth.subscribe(synchronize),release=()=>{active=false;recoveryId=null;recoveryControl.syncOpen(false);request++;navigationRevision++;viewAbort?.abort();viewAbort=undefined;viewOperation=null;extensionBusy=null;clearPassword();},resume=(event:PageTransitionEvent)=>{if(!event.persisted||dead)return;active=true;navigationRevision++;navigationUser=null;navigationPhase='idle';if((auth.getState().busy==='session'||auth.getState().busy==='refresh')&&!auth.getState().reauthenticationRequired)void run('session');else synchronize();};doc.defaultView?.addEventListener('pagehide',release);doc.defaultView?.addEventListener('pageshow',resume);synchronize();const initial=auth.getState();if(!initial.reauthenticationRequired&&(initial.busy==='session'||initial.busy==='refresh'||initial.status==='unknown'&&!initial.busy&&!initial.error))void run('session');
  return {getElement:()=>page,destroy(){if(dead)return;dead=true;off();release();recoveryControl.destroy();doc.defaultView?.removeEventListener('pagehide',release);doc.defaultView?.removeEventListener('pageshow',resume);form.onsubmit=null;layout.destroy();}};
}
