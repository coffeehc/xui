import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {createOverlayController,createValueController,createSelectionController,createToggleGroupController,type OverlayController,type ValueController,type SelectionController,type ToggleGroupController} from '@coffeehc/xui-runtime/interaction';
import {createPasswordInputController,type PasswordInputController,type PasswordInputOptions} from '@coffeehc/xui-runtime/display';
import {createNumberInputController,type NumberInputController,type NumberInputOptions} from '@coffeehc/xui-runtime/number-input';
import {createAdminSetupController,type AdminSetupController,type AdminSetupControllerOptions,type AdminSetupState} from '@coffeehc/xui-runtime/admin-setup';
import {createPasswordStrengthController,type PasswordStrengthController} from '@coffeehc/xui-runtime/password';
import {createApiKeyManagerViewController,type ApiKeyManagerViewController} from '@coffeehc/xui-runtime/component-views';
import {createBusinessLogViewController,type BusinessLogViewController} from '@coffeehc/xui-runtime/component-views';
import {createStructuredLogViewController,type StructuredLogViewController} from '@coffeehc/xui-runtime/component-views';
import type {ApiKeyManagerController,ApiKeyManagerOptions} from '@coffeehc/xui-runtime/api-key';
import type {BusinessLogController,BusinessLogOptions} from '@coffeehc/xui-runtime/business-log';
import type {StructuredLogController,StructuredLogOptions} from '@coffeehc/xui-runtime/structured-log';
import {createApiKeyManagerController} from '@coffeehc/xui-runtime/api-key';
import type {ApiKeyManagerProps} from '@coffeehc/xui-react/api-key';
import {PasswordInput,NumberInput,type PasswordInputHandle,type PasswordInputProps,type NumberInputProps} from '@coffeehc/xui-react/text-inputs';
import {PasswordStrengthInput,type PasswordStrengthInputProps} from '@coffeehc/xui-react/password';
import {AdminSetupPage,type AdminSetupPageProps} from '@coffeehc/xui-react/admin-setup';
import type {BusinessLogExplorerProps} from '@coffeehc/xui-react/business-log';
import type {StructuredLogExplorerProps} from '@coffeehc/xui-react/structured-log';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {AlertDialog} from '@coffeehc/xui-react/alert-dialog';
import {Popover} from '@coffeehc/xui-react/popover';
import {Tooltip} from '@coffeehc/xui-react/tooltip';
import {Menu} from '@coffeehc/xui-react/menu';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import {Tabs} from '@coffeehc/xui-react/tabs';
import {Accordion} from '@coffeehc/xui-react/accordion';
import {ToggleGroup} from '@coffeehc/xui-react/toggle-group';
import type {ToggleGroupProps} from '@coffeehc/xui-react/toggle-group';
import {Select} from '@coffeehc/xui-react/select';
import {Combobox} from '@coffeehc/xui-react/combobox';
import {ApiKeyManager} from '@coffeehc/xui-react/api-key';

type Tracked<T> = T & {activeSubscribers:number};
function tracked<T extends {subscribe:(listener:()=>void)=>()=>void}>(controller:T):Tracked<T> {
 let activeSubscribers=0;
 const subscribe=controller.subscribe;
 controller.subscribe=(listener:()=>void)=>{
  const unsubscribe=subscribe(listener);activeSubscribers++;let active=true;
  return ()=>{if(active){active=false;activeSubscribers--;unsubscribe();}};
 };
 Object.defineProperty(controller,'activeSubscribers',{get:()=>activeSubscribers});
 return controller as Tracked<T>;
}

const events:{name:string;value:unknown}[]=[];
const cancelledTabRequests:string[]=[];
let recordCancelledTabRequest=()=>{};
const trackOverlay=(name:string,options:Parameters<typeof createOverlayController>[0]={})=>tracked(createOverlayController({...options,onOpenChange:(open,details)=>{events.push({name,value:{open,reason:details?.reason}});options.onOpenChange?.(open,details);}}));
const trackValue=<T,>(name:string,options:Parameters<typeof createValueController<T>>[0])=>tracked(createValueController<T>({...options,onValueChange:(value,details)=>{events.push({name,value});options.onValueChange?.(value,details);}}));
const trackSelection=<T,>(name:string,options:Parameters<typeof createSelectionController<T>>[0])=>tracked(createSelectionController<T>({
 ...options,
 onValueChange:(value,details)=>{events.push({name:`${name}.value`,value});options.onValueChange?.(value,details);},
 onOpenChange:(value,details)=>{events.push({name:`${name}.open`,value});options.onOpenChange?.(value,details);},
 onInputValueChange:(value,details)=>{events.push({name:`${name}.input`,value});options.onInputValueChange?.(value,details);},
}));
const trackToggle=<T extends string,>(name:string,options:Parameters<typeof createToggleGroupController<T>>[0]={})=>tracked(createToggleGroupController<T>({
 ...options,
 onValueChange:(value,details)=>{events.push({name,value:[...value]});options?.onValueChange?.(value,details);},
}));

const controllers={
 dialog:trackOverlay('dialog',{open:false}),dialogReplacement:trackOverlay('dialogReplacement',{defaultOpen:false}),
 sheet:trackOverlay('sheet'),alert:trackOverlay('alert'),popover:trackOverlay('popover'),tooltip:trackOverlay('tooltip'),menu:trackOverlay('menu'),context:trackOverlay('context'),
 tabs:trackValue('tabs',{value:'overview',defaultValue:'overview'}),
 tabsCancelled:trackValue('tabsCancelled',{defaultValue:'A',onValueChange:(value,details)=>{cancelledTabRequests.push(value);recordCancelledTabRequest();details?.cancel?.();}}),
 tabsNonFirst:trackValue('tabsNonFirst',{defaultValue:'B'}),
 accordion:trackValue<readonly string[]>('accordion',{defaultValue:[]}),
 toggles:trackToggle('toggles',{defaultValue:['cards'],multiple:false,allowEmpty:false}),
 checkbox:trackValue<boolean>('checkbox',{defaultValue:false}),
 radio:trackValue<string>('radio',{defaultValue:'one'}),
 select:trackSelection<string|null>('select',{value:'alpha',defaultValue:'alpha'}),
 combobox:trackSelection<string|null>('combobox',{value:'alpha',defaultValue:'alpha',defaultInputValue:''}),
 passwordA:createPasswordInputController({defaultVisible:false}),
 passwordB:createPasswordInputController({defaultVisible:true}),
 strengthA:createPasswordStrengthController({readPassword:()=>''}),
 strengthB:createPasswordStrengthController({readPassword:()=>''}),
 number:createNumberInputController({value:1,onValueChange:()=>{}}),
 admin:createAdminSetupController({state:{status:'idle'},onSubmit:()=> 'complete'}),
};
const passwordEvents:{kind:string;value?:unknown}[]=[];
const apiKeyReads:string[]=[];
const apiKeyService=createApiKeyManagerController({canCreate:true,permissions:[],expiryOptions:[{id:'never',label:'Never'}],defaultExpiryId:'never',adapter:{list:async()=>{apiKeyReads.push('list');return[];},create:async()=>{throw new Error('not used');},revoke:async()=>{}}});
let apiKeyDestroyCalls=0;
const destroyApiKeyService=apiKeyService.destroy.bind(apiKeyService);
apiKeyService.destroy=()=>{apiKeyDestroyCalls++;destroyApiKeyService();};
const apiKeyViewController=createApiKeyManagerViewController({service:apiKeyService,pagination:{defaultPageSize:10,pageSizeOptions:[10,25]}});
const inlineApiKeyReads:string[]=[];
let inlineAdminCheckCalls=0;
const inlineApiKeyOptions=()=>({
 canCreate:true,
 permissions:[],
 expiryOptions:[{id:'never',label:'Never'}],
 defaultExpiryId:'never',
 adapter:{list:async()=>{inlineApiKeyReads.push('list');return[];},create:async()=>{throw new Error('not used');},revoke:async()=>{}},
});

function typeOnlyControllerFixtures(apiKeyOptions:ApiKeyManagerOptions,apiKeyService:ApiKeyManagerController,businessLogOptions:BusinessLogOptions,businessLogService:BusinessLogController,structuredLogOptions:StructuredLogOptions,structuredLogService:StructuredLogController,toggleController:ToggleGroupController<string>,passwordController:PasswordInputController,passwordOptions:PasswordInputOptions,strengthController:PasswordStrengthController,numberController:NumberInputController,numberOptions:NumberInputOptions,adminController:AdminSetupController,adminOptions:AdminSetupControllerOptions){
 const ownedApiKeyView:ApiKeyManagerViewController=createApiKeyManagerViewController({options:apiKeyOptions,pagination:{defaultPageSize:25,pageSizeOptions:[25,50]}});
 const borrowedApiKeyView:ApiKeyManagerViewController=createApiKeyManagerViewController({service:apiKeyService,pagination:false});
 const ownedBusinessLogView:BusinessLogViewController=createBusinessLogViewController({options:businessLogOptions});
 const borrowedBusinessLogView:BusinessLogViewController=createBusinessLogViewController({service:businessLogService});
 const ownedStructuredLogView:StructuredLogViewController=createStructuredLogViewController({options:structuredLogOptions});
 const borrowedStructuredLogView:StructuredLogViewController=createStructuredLogViewController({service:structuredLogService});
 const injectedApiKeyProps:ApiKeyManagerProps={viewController:borrowedApiKeyView};
 const injectedBusinessProps:BusinessLogExplorerProps={viewController:borrowedBusinessLogView};
 const injectedStructuredProps:StructuredLogExplorerProps={viewController:borrowedStructuredLogView};
 void [ownedApiKeyView,injectedApiKeyProps,injectedBusinessProps,borrowedStructuredLogView,injectedStructuredProps,passwordOptions,numberOptions,adminOptions];
 // @ts-expect-error A borrowed service cannot be combined with factory options.
 createApiKeyManagerViewController({service:apiKeyService,options:apiKeyOptions});
 // @ts-expect-error The injected view controller is a complete component owner.
 const conflictingApiKeyView:ApiKeyManagerProps={viewController:borrowedApiKeyView,pagination:false};
 // @ts-expect-error A business view controller cannot be combined with service props.
 const conflictingBusinessView:BusinessLogExplorerProps={viewController:borrowedBusinessView,controller:businessLogService};
 // @ts-expect-error A structured-log view controller cannot be combined with options.
 const conflictingStructuredView:StructuredLogExplorerProps={viewController:borrowedStructuredLogView,options:structuredLogOptions};
 // @ts-expect-error A component view controller cannot be combined with service factory options.
 const conflictingApiKeyOwner:ApiKeyManagerProps={controller:apiKeyService,options:apiKeyOptions};
 // @ts-expect-error A PasswordInput controller owns visibility options.
 const conflictingPasswordProps:PasswordInputProps={controller:passwordController,defaultVisible:true};
 // @ts-expect-error Password-strength controller also owns child visibility options.
 const conflictingStrengthProps:PasswordStrengthInputProps={controller:strengthController,defaultVisible:true};
 // @ts-expect-error A NumberInput controller owns value and disabled configuration.
 const conflictingNumberProps:NumberInputProps={controller:numberController,value:2,onValueChange:()=>{},disabled:true};
 // @ts-expect-error An AdminSetup controller owns state and action callbacks.
 const conflictingAdminProps:AdminSetupPageProps={config:{productName:'Example'},controller:adminController,state:{status:'idle'},onSubmit:()=> 'complete'};
 // @ts-expect-error ToggleGroup strategy is owned by its injected controller.
 const conflictingTogglePolicy:ToggleGroupProps<string>={controller:toggleController,allowEmpty:true};
 // @ts-expect-error Multiple-selection policy is also owned by the injected controller.
 const conflictingToggleMultiplicity:ToggleGroupProps<string>={controller:toggleController,multiple:true};
 void [conflictingApiKeyView,conflictingBusinessView,conflictingStructuredView,conflictingApiKeyOwner,conflictingPasswordProps,conflictingStrengthProps,conflictingNumberProps,conflictingAdminProps,conflictingTogglePolicy,conflictingToggleMultiplicity];
}
void typeOnlyControllerFixtures;

declare global {
 interface Window {controllerModes?:{
  controllers:typeof controllers;events:typeof events;
  apiKeyService:typeof apiKeyService;apiKeyViewController:typeof apiKeyViewController;apiKeyReads:string[];apiKeyDestroyCalls:()=>number;
  passwordEvents:typeof passwordEvents;clearPassword:()=>void;usePasswordB:()=>void;rerenderPassword:()=>void;resetPasswordForm:()=>void;pagehidePassword:()=>void;
  cancelledTabRequests:string[];removeCancelledTabA:()=>void;rerenderCancelledTabs:()=>void;
  useStrengthB:()=>void;
  inlineApiKeyReads:string[];rerenderInlineApi:()=>void;remountBorrowedAndOpenCreate:()=>void;mountSecondApiKeyView:()=>void;unmountSecondApiKeyView:()=>void;apiKeyViewsKey:number;apiKeyRevision:number;
  useDefaultAdmin:()=>void;setDefaultAdminUnavailable:()=>void;enableDefaultAdminCheck:()=>void;adminCheckCalls:()=>number;
  showNumberConflict:()=>void;
  replaceDialog:()=>void;restoreDialog:()=>void;setMounted:(mounted:boolean)=>void;
  resetEvents:()=>void;
 }}
}

class TestErrorBoundary extends React.Component<{children:React.ReactNode},{error:Error|null}> {
 state:{error:Error|null}={error:null};
 static getDerivedStateFromError(error:Error){return {error};}
 render(){return this.state.error?<output role="alert" data-testid="controller-conflict-error">{this.state.error.name}: {this.state.error.message}</output>:this.props.children;}
}

function State({name,controller}:{name:string;controller:{getState:()=>unknown;subscribe:(listener:()=>void)=>()=>void}}){
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
 return <output data-testid={`state-${name}`}>{JSON.stringify(state)}</output>;
}

function Views(){
 const [dialogController,setDialogController]=React.useState<OverlayController>(controllers.dialog);
 const [mounted,setMounted]=React.useState(true);
 const [passwordController,setPasswordController]=React.useState<PasswordInputController>(controllers.passwordA),passwordControl=React.useRef<PasswordInputHandle>(null),[passwordRevision,setPasswordRevision]=React.useState(0),[strengthController,setStrengthController]=React.useState<PasswordStrengthController>(controllers.strengthA);
 const [apiKeyViewsKey,setApiKeyViewsKey]=React.useState(0),[secondApiKeyView,setSecondApiKeyView]=React.useState(false),[apiKeyRevision,setApiKeyRevision]=React.useState(0);
 const [adminMode,setAdminMode]=React.useState<'injected'|'default'>('injected'),[adminState,setAdminState]=React.useState<AdminSetupState>({status:'idle'}),[adminCheckEnabled,setAdminCheckEnabled]=React.useState(false);
 const [showNumberConflict,setShowNumberConflict]=React.useState(false),[passwordValue,setPasswordValue]=React.useState('synthetic-controlled-secret'),[cancelledTabAVisible,setCancelledTabAVisible]=React.useState(true),[cancelledTabRevision,setCancelledTabRevision]=React.useState(0);
 recordCancelledTabRequest=()=>setCancelledTabRevision(value=>value+1);
 window.controllerModes={controllers,events,apiKeyService,apiKeyViewController,apiKeyReads,apiKeyDestroyCalls:()=>apiKeyDestroyCalls,
  passwordEvents,clearPassword:()=>passwordControl.current?.clear(),usePasswordB:()=>setPasswordController(controllers.passwordB),rerenderPassword:()=>setPasswordRevision(value=>value+1),resetPasswordForm:()=>document.querySelector<HTMLFormElement>('[data-testid="password-controller-form"]')?.reset(),pagehidePassword:()=>window.dispatchEvent(new Event('pagehide')),
  useStrengthB:()=>setStrengthController(controllers.strengthB),
  cancelledTabRequests,removeCancelledTabA:()=>setCancelledTabAVisible(false),rerenderCancelledTabs:()=>setCancelledTabRevision(value=>value+1),
  inlineApiKeyReads,rerenderInlineApi:()=>setApiKeyRevision(value=>value+1),remountBorrowedAndOpenCreate:()=>{flushSync(()=>setApiKeyViewsKey(value=>value+1));apiKeyService.openCreate();},mountSecondApiKeyView:()=>setSecondApiKeyView(true),unmountSecondApiKeyView:()=>setSecondApiKeyView(false),apiKeyViewsKey,apiKeyRevision,
  useDefaultAdmin:()=>setAdminMode('default'),setDefaultAdminUnavailable:()=>setAdminState({status:'unavailable'}),enableDefaultAdminCheck:()=>setAdminCheckEnabled(true),adminCheckCalls:()=>inlineAdminCheckCalls,
  showNumberConflict:()=>setShowNumberConflict(true),
  replaceDialog:()=>setDialogController(controllers.dialogReplacement),restoreDialog:()=>setDialogController(controllers.dialog),setMounted,resetEvents:()=>{events.length=0;}};
 return <main>
  <nav aria-label="测试操作">
   <button type="button" onClick={()=>setMounted(false)}>Unmount injected views</button>
   <button type="button" onClick={()=>setMounted(true)}>Mount injected views</button>
   <button type="button" onClick={()=>window.controllerModes?.replaceDialog()}>Replace dialog controller</button>
   <button type="button" onClick={()=>window.controllerModes?.restoreDialog()}>Restore dialog controller</button>
   <button type="button" onClick={()=>setPasswordController(controllers.passwordB)}>Use password controller B</button>
   <button type="button" onClick={()=>setPasswordRevision(value=>value+1)}>Rerender password parent</button>
   <button type="button" onClick={()=>setAdminMode('default')}>Use default admin setup</button>
   <button type="button" onClick={()=>setAdminState({status:'unavailable'})}>Set default admin unavailable</button>
   <button type="button" onClick={()=>setAdminCheckEnabled(true)}>Enable default admin check</button>
   <button type="button" onClick={()=>setShowNumberConflict(true)}>Show conflicting number props</button>
   <button type="button" onClick={()=>setApiKeyRevision(value=>value+1)}>Rerender inline API options</button>
   <button type="button" onClick={()=>{flushSync(()=>setApiKeyViewsKey(value=>value+1));apiKeyService.openCreate();}}>Remount borrowed API view and open</button>
   <button type="button" onClick={()=>setSecondApiKeyView(true)}>Mount second borrowed API view</button>
   <button type="button" onClick={()=>setSecondApiKeyView(false)}>Unmount second borrowed API view</button>
  </nav>
  <output data-testid="events">{JSON.stringify(events)}</output>
  <section aria-label="Owned overlay">
   <Dialog.Root defaultOpen={false} onOpenChange={open=>events.push({name:'ownedDialog',value:open})}>
    <Dialog.Trigger>Open owned dialog</Dialog.Trigger>
    <Dialog.Content><Dialog.Title>Owned dialog</Dialog.Title><p>Owned peer focus.</p><Dialog.Close>Close owned dialog</Dialog.Close></Dialog.Content>
   </Dialog.Root>
  </section>
  <section aria-label="Password controller replacement">
  <form data-testid="password-controller-form"><PasswordInput aria-label="Controlled password" name="controller-password" controller={passwordController} controlRef={passwordControl} value={passwordValue} onValueChange={value=>{passwordEvents.push({kind:'value',value});setPasswordValue(value);}} onClear={reason=>passwordEvents.push({kind:'clear',value:reason})}/></form>
   <PasswordStrengthInput aria-label="Leased strength password" controller={strengthController}/>
   <output data-testid="password-parent-revision">{passwordRevision}</output>
  </section>
  <section aria-label="Default API manager init options">
   <ApiKeyManager options={inlineApiKeyOptions()}/>
  </section>
  <section aria-label="Admin setup mode">
   {adminMode==='injected'?<AdminSetupPage config={{productName:'Example',title:'Example'}} controller={controllers.admin}/>:<AdminSetupPage config={{productName:'Example',title:'Example'}} state={adminState} onSubmit={()=> 'complete'} {...(adminCheckEnabled?{onCheck:()=>{inlineAdminCheckCalls++;return 'unavailable' as const;}}:{})}/>}
  </section>
  {secondApiKeyView&&<section aria-label="Second borrowed API view"><ApiKeyManager key={`second-${apiKeyViewsKey}`} viewController={apiKeyViewController}/></section>}
  {showNumberConflict&&<TestErrorBoundary><NumberInput {...({controller:controllers.number,value:1,onValueChange:()=>{},disabled:true} as unknown as NumberInputProps)}/></TestErrorBoundary>}
  {mounted&&<>
   <section aria-label="Injected overlay roots">
    <State name="dialog" controller={controllers.dialog}/>
    <Dialog.Root controller={dialogController}>
     <Dialog.Trigger>Open injected dialog</Dialog.Trigger>
     <Dialog.Content data-testid="dialog-content"><Dialog.Title>Injected dialog</Dialog.Title><p>Dialog controller view.</p><Dialog.Close>Close injected dialog</Dialog.Close></Dialog.Content>
    </Dialog.Root>

    <State name="sheet" controller={controllers.sheet}/>
    <Sheet.Root controller={controllers.sheet}><Sheet.Trigger>Open injected sheet</Sheet.Trigger><Sheet.Content><Sheet.Title>Sheet controller</Sheet.Title><Sheet.CloseButton aria-label="Close injected sheet"/></Sheet.Content></Sheet.Root>

    <State name="alert" controller={controllers.alert}/>
    <AlertDialog.Root controller={controllers.alert}><AlertDialog.Trigger>Open injected alert</AlertDialog.Trigger><AlertDialog.Content><AlertDialog.Title>Alert controller</AlertDialog.Title><AlertDialog.Description>Peer alert dialog.</AlertDialog.Description><AlertDialog.Close>Cancel alert</AlertDialog.Close><AlertDialog.Close onClick={()=>events.push({name:'alertHostConfirmed',value:true})}>Confirm alert</AlertDialog.Close></AlertDialog.Content></AlertDialog.Root>

    <State name="popover" controller={controllers.popover}/>
    <Popover.Root controller={controllers.popover}><Popover.Trigger>Open injected popover</Popover.Trigger><Popover.Content data-testid="popover-content"><Popover.Title>Popover controller</Popover.Title><p>Popover content</p></Popover.Content></Popover.Root>

    <Tooltip.Provider delay={0}>
     <State name="tooltip" controller={controllers.tooltip}/>
     <Tooltip.Root controller={controllers.tooltip}><Tooltip.Trigger>Hover injected tooltip</Tooltip.Trigger><Tooltip.Content>Tooltip controller</Tooltip.Content></Tooltip.Root>
    </Tooltip.Provider>

    <State name="menu" controller={controllers.menu}/>
    <Menu.Root controller={controllers.menu}><Menu.Trigger>Open injected menu</Menu.Trigger><Menu.Content><Menu.Item>Menu action</Menu.Item></Menu.Content></Menu.Root>

    <State name="context" controller={controllers.context}/>
    <ContextMenu.Root controller={controllers.context}><ContextMenu.Trigger tabIndex={0}>Right-click injected context</ContextMenu.Trigger><ContextMenu.Content><ContextMenu.Item>Context action</ContextMenu.Item></ContextMenu.Content></ContextMenu.Root>
   </section>

   <section aria-label="Injected value roots">
    <State name="tabs" controller={controllers.tabs}/>
    <Tabs.Root controller={controllers.tabs}>
     <Tabs.List aria-label="Injected tabs"><Tabs.Tab value="overview">Overview</Tabs.Tab><Tabs.Tab value="activity">Activity</Tabs.Tab></Tabs.List>
     <Tabs.Panel value="overview">Overview panel</Tabs.Panel><Tabs.Panel value="activity">Activity panel</Tabs.Panel>
    </Tabs.Root>

    <State name="tabs-non-first" controller={controllers.tabsNonFirst}/>
    <Tabs.Root controller={controllers.tabsNonFirst}>
     <Tabs.List aria-label="Non-first default tabs"><Tabs.Tab value="A">First tab</Tabs.Tab><Tabs.Tab value="B">Second tab</Tabs.Tab></Tabs.List>
     <Tabs.Panel value="A">First panel</Tabs.Panel><Tabs.Panel value="B">Second panel</Tabs.Panel>
    </Tabs.Root>

    <State name="tabs-cancelled" controller={controllers.tabsCancelled}/>
    <output data-testid="cancelled-tab-requests">{JSON.stringify(cancelledTabRequests)}</output>
    <output data-testid="cancelled-tab-revision">{cancelledTabRevision}</output>
    <button type="button" onClick={()=>setCancelledTabAVisible(false)}>Remove selected cancellable tab</button>
    <button type="button" onClick={()=>setCancelledTabRevision(value=>value+1)}>Rerender cancellable tabs</button>
    <Tabs.Root controller={controllers.tabsCancelled}>
     <Tabs.List aria-label="Cancellable fallback tabs">{cancelledTabAVisible&&<Tabs.Tab value="A">Fallback A</Tabs.Tab>}<Tabs.Tab value="B">Fallback B</Tabs.Tab></Tabs.List>
     <Tabs.Panel value="A">Fallback A panel</Tabs.Panel><Tabs.Panel value="B">Fallback B panel</Tabs.Panel>
    </Tabs.Root>

    <State name="accordion" controller={controllers.accordion}/>
    <Accordion.Root controller={controllers.accordion}>
     <Accordion.Item value="details"><Accordion.Header><Accordion.Trigger aria-label="Open controller accordion">Open controller accordion</Accordion.Trigger></Accordion.Header><Accordion.Panel>Accordion panel</Accordion.Panel></Accordion.Item>
    </Accordion.Root>

    <State name="toggles" controller={controllers.toggles}/>
     <ToggleGroup.Root controller={controllers.toggles} aria-label="Injected view toggles"><ToggleGroup.Item value="cards">Cards</ToggleGroup.Item><ToggleGroup.Item value="rows">Rows</ToggleGroup.Item></ToggleGroup.Root>

    <State name="checkbox" controller={controllers.checkbox}/>
    <State name="radio" controller={controllers.radio}/>
    <Menu.Root>
     <Menu.Trigger>Value menu</Menu.Trigger>
     <Menu.Content>
      <Menu.CheckboxItem controller={controllers.checkbox}>Injected checkbox item</Menu.CheckboxItem>
      <Menu.RadioGroup controller={controllers.radio}><Menu.RadioItem value="one">Radio one</Menu.RadioItem><Menu.RadioItem value="two">Radio two</Menu.RadioItem></Menu.RadioGroup>
     </Menu.Content>
    </Menu.Root>
   </section>

   <section aria-label="Injected selection roots">
    <State name="select" controller={controllers.select}/>
    <Select.Root<string> controller={controllers.select} items={[{value:'alpha',label:'Alpha'},{value:'beta',label:'Beta'}]}>
     <Select.Trigger aria-label="Injected select"><Select.Value/></Select.Trigger>
     <Select.Content><Select.List><Select.Item value="alpha">Alpha</Select.Item><Select.Item value="beta">Beta</Select.Item></Select.List></Select.Content>
    </Select.Root>

    <State name="combobox" controller={controllers.combobox}/>
    <Combobox.Root<string> controller={controllers.combobox} items={[{value:'alpha',label:'Alpha'},{value:'beta',label:'Beta'}]}>
     <Combobox.Input aria-label="Injected combobox"/>
     <Combobox.Content><Combobox.List><Combobox.Item value="alpha">Alpha</Combobox.Item><Combobox.Item value="beta">Beta</Combobox.Item></Combobox.List></Combobox.Content>
    </Combobox.Root>
   </section>

   <section aria-label="Injected component view">
    <State name="api-key-view" controller={apiKeyViewController}/>
    <ApiKeyManager key={`borrowed-${apiKeyViewsKey}`} viewController={apiKeyViewController}/>
   </section>
  </>}
 </main>;
}

const node=document.getElementById('root');
if(node)createRoot(node).render(<React.StrictMode><Views/></React.StrictMode>);
