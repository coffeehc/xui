import * as React from 'react';
import {AppShell} from '@coffeehc/xui-react/layout';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {AlertDialog} from '@coffeehc/xui-react/alert-dialog';
const trigger=React.createRef<HTMLButtonElement>();
<AppShell navigationTriggerRef={trigger} sidebar="Navigation">Content</AppShell>;
<MenuLayout label="Navigation" items={[]} navigationTriggerRef={node=>{node?.focus();return()=>{};}}>Content</MenuLayout>;
<AlertDialog.Root><AlertDialog.Content finalFocus={trigger}>Confirmation</AlertDialog.Content></AlertDialog.Root>;
// @ts-expect-error The public shell control is a button, not a private drawer node.
<AppShell navigationTriggerRef={React.createRef<HTMLDivElement>()} sidebar="Navigation"/>;
