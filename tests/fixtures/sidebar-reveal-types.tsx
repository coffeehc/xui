import {AppShell,type AppShellProps} from '@coffeehc/xui-react/layout';
import {MenuLayout,type MenuLayoutProps} from '@coffeehc/xui-react/menu-layout';
const view=<AppShell sidebarRevealOnHover={false} sidebar="菜单">正文</AppShell>;
const menu=<MenuLayout items={[]} sidebarRevealOnHover>正文</MenuLayout>;
const options:Pick<AppShellProps,'sidebarRevealOnHover'>={sidebarRevealOnHover:true};
const menuOptions:Pick<MenuLayoutProps,'sidebarRevealOnHover'>=options;
// @ts-expect-error preview is a boolean view option, never another collapse Controller
const invalid=<AppShell sidebar="菜单" sidebarRevealOnHover="hover">正文</AppShell>;
void [view,menu,menuOptions,invalid];
