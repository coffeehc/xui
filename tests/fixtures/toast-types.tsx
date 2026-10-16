import {Toast,type ToastController,type ToastObject} from '@coffeehc/xui-react/toast';
import {createToastController,type ToastController as RuntimeToastController} from '@coffeehc/xui-runtime/toast';
const runtime:RuntimeToastController=createToastController({timeout:-1,limit:3});
const controller:ToastController<{key:number}>=createToastController();
controller.add({title:'保存',data:{key:1}});
const item={} as ToastObject<{key:number}>;
const key:number|undefined=item.data?.key;
const views=[<Toast.Provider controller={controller}/>,<Toast.Provider toastManager={Toast.createToastManager()}/>,<Toast.Provider timeout={-1} limit={2}/>,<Toast.Root toast={item}><Toast.Title/><Toast.Description/><Toast.Action>查看</Toast.Action><Toast.Close aria-label="关闭"/></Toast.Root>];
// @ts-expect-error injected state must not be reconfigured by the View
const conflict=<Toast.Provider controller={controller} timeout={1000}/>;
// @ts-expect-error a second manager is a second owner
const competing=<Toast.Provider controller={controller} toastManager={controller}/>;
// @ts-expect-error typed data cannot change its key type
controller.add({title:'保存',data:{key:'one'}});
// @ts-expect-error a method-only action bus is not a full Controller
const bus=<Toast.Provider controller={{add:()=> 'id',close:()=>{}}}/>;
void [runtime,views,key,conflict,competing,bus];
