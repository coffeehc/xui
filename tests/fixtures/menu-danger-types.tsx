import {Menu,type MenuItemProps,type MenuItemTone} from '@coffeehc/xui-react/menu';
import {ContextMenu,type MenuItemProps as ContextItemProps} from '@coffeehc/xui-react/context-menu';
import type {MenuItemTone as RootTone} from '@coffeehc/xui-react';
const tone:RootTone='danger';const menuTone:MenuItemTone=tone;
const props:MenuItemProps={tone:menuTone,disabled:true};const contextProps:ContextItemProps=props;
export const example=<><Menu.Item {...props}>删除</Menu.Item><ContextMenu.Item {...contextProps}>删除</ContextMenu.Item></>;
// @ts-expect-error The public danger tone is explicit and typed.
export const invalid=<Menu.Item tone="destructive">删除</Menu.Item>;
// @ts-expect-error ContextMenu shares the same tone contract.
export const invalidContext=<ContextMenu.Item tone="error">删除</ContextMenu.Item>;
