import * as React from 'react';
import {NavigationMenu,MenuLayout,type NavigationMenuProps,type MenuLayoutProps} from '@coffeehc/xui-react/menu-layout';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import {AppShell,SidebarFooterRow,SidebarFooterContent,type SidebarTogglePlacement} from '@coffeehc/xui-react/layout';
import type {NavigationItem} from '@coffeehc/xui-runtime/navigation';

const placement:SidebarTogglePlacement='bottom';
const footerRow=<SidebarFooterRow><button>返回会话</button><SidebarFooterContent>企业版 · v0.0.1</SidebarFooterContent></SidebarFooterRow>;
const positioned=<AppShell sidebar={<nav/>} sidebarFooter={footerRow} sidebarTogglePlacement={placement}>内容</AppShell>;
const menuLayoutProps:Pick<MenuLayoutProps,'sidebarTogglePlacement'>={sidebarTogglePlacement:placement};
// @ts-expect-error only the public desktop positions are accepted
const invalidPlacement=<AppShell sidebar={<nav/>} sidebarTogglePlacement="footer">内容</AppShell>;

function Branch({ref,...props}:React.ComponentPropsWithRef<'button'>){return <ContextMenu.Root disabled={props.disabled}><ContextMenu.Trigger render={<button {...props} ref={ref}/>}/><ContextMenu.Content><ContextMenu.Item>设置</ContextMenu.Item></ContextMenu.Content></ContextMenu.Root>;}
const items:readonly NavigationItem[]=[{id:'group',label:'项目',children:[{id:'page',label:'详情',href:'/detail'}]}];
const props:NavigationMenuProps={items,renderButton:()=> <Branch/>,renderAction:item=><button aria-label={`配置 ${item.label}`} disabled aria-busy>⚙</button>};
const menu=<NavigationMenu {...props}/>;
const translated:NavigationMenuProps={...props,expandBranchLabel:item=>`展开 ${item.label}`,collapseBranchLabel:item=>`收起 ${item.label}`};
const invalidLabel:NavigationMenuProps={...props,
// @ts-expect-error branch labels are formatters receiving the current item, not fixed strings
expandBranchLabel:'展开'};
// @ts-expect-error accessible names must be text, not React elements
const invalidElementLabel:NavigationMenuProps={...props,collapseBranchLabel:item=><span>{item.label}</span>};
const layout=<MenuLayout {...props} sidebarTogglePlacement="bottom">{menu}</MenuLayout>;
const presentation=<NavigationMenu {...props} labelOverflow="marquee" actionAlignment="start" renderLabel={item=><><NavigationMenu.Label><strong>{item.label}</strong></NavigationMenu.Label><small>静态描述</small></>}/>;
// @ts-expect-error only the supported enum values are accepted
const badPresentation=<NavigationMenu {...props} labelOverflow="scroll"/>;
// @ts-expect-error CSS positioning is not the public action-alignment contract
const badAlignment=<MenuLayout {...props} actionAlignment="flex-start">{menu}</MenuLayout>;
void positioned;void menuLayoutProps;void invalidPlacement;void translated;void invalidLabel;void invalidElementLabel;void layout;void presentation;void badPresentation;void badAlignment;
