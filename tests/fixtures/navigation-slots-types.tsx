import * as React from 'react';
import {NavigationMenu,MenuLayout,type NavigationMenuProps} from '@coffeehc/xui-react/menu-layout';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import {createNavigationMenu,type NavigationMenuDOMOptions,type NavigationDOMSlot,type NavigationRowState,type NavigationDOMLifecycle} from '@coffeehc/xui-runtime/navigation';
import {createMenuLayout,type MenuLayoutOptions} from '@coffeehc/xui-runtime/menu-layout';
function Branch({ref,...props}:React.ComponentPropsWithRef<'button'>){return <ContextMenu.Root disabled={props.disabled}><ContextMenu.Trigger render={<button {...props} ref={ref}/>}/><ContextMenu.Content><ContextMenu.Item>设置</ContextMenu.Item></ContextMenu.Content></ContextMenu.Root>;}
const props:NavigationMenuProps={items:[{id:'group',label:'项目',children:[{id:'page',label:'详情',href:'/detail'}]}],renderButton:()=> <Branch/>,renderAction:item=><button aria-label={`配置 ${item.label}`} disabled aria-busy>⚙</button>};
const menu=<NavigationMenu {...props}/>;
const layout=<MenuLayout {...props}>{menu}</MenuLayout>;
const options:NavigationMenuDOMOptions={items:props.items,renderLabel:item=>({element:document.createTextNode(item.label),update(next,state){this.element.textContent=next.label;const facts:NavigationRowState=state;void facts;}}),renderAction:item=>{const slot:NavigationDOMSlot<HTMLButtonElement>={element:document.createElement('button'),update(next,state){this.element.disabled=state.disabled;this.element.setAttribute('aria-label',next.label);},destroy(){}};slot.element.textContent=item.label;return slot;},decorateItem(element,item,state){const life:NavigationDOMLifecycle={update(next,facts){element.title=next.label+String(facts.active);},destroy(){}};void item;void state;return life;}};
const owner=createNavigationMenu(document.createElement('div'),options);owner.update({renderAction:()=>null});owner.destroy();
const shell:MenuLayoutOptions={...options,title:'工作台',sidebar:document.createElement('div')};createMenuLayout(document.createElement('div'),shell).destroy();
const bad:NavigationMenuDOMOptions={items:[],
// @ts-expect-error actions are one button, never an anchor or arbitrary Node
renderAction:()=>({element:document.createElement('a')})};
void bad;void layout;
