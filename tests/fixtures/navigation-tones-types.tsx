import * as React from 'react';
import {NavigationMenu,MenuLayout,type NavigationItem,type NavigationTone,type NavigationVariant} from '@coffeehc/xui-react/menu-layout';
import {NavItem} from '@coffeehc/xui-react/navigation';
import type {NavigationMenuOptions} from '@coffeehc/xui-runtime/navigation';
import type {XuiConfigOverrides} from '@coffeehc/xui-runtime/config';
const tone:NavigationTone='warning',variant:NavigationVariant='text';
const items:readonly NavigationItem[]=[{id:'team',label:'团队',href:'/team',tone,variant}];
const options:NavigationMenuOptions={items,variant};
const config:XuiConfigOverrides={menu:{items}};
const menu=<NavigationMenu {...options}/>;
const layout=<MenuLayout {...options}>内容</MenuLayout>;
const composed=<NavItem variant={variant} tone={tone} render={<button/>}/>;
// @ts-expect-error library semantics do not contain business lifecycle enums
const business:NavigationItem={id:'team',label:'团队',tone:'waiting_approval'};
// @ts-expect-error unsupported appearance
const invalid=<NavItem variant="ghost"/>;
// @ts-expect-error unsupported tone
const badMenu=<NavigationMenu items={items} tone="danger"/>;
void config;void menu;void layout;void composed;void business;void invalid;void badMenu;
