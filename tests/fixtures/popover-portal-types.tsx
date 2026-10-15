import * as React from 'react';
import {Popover,type PopoverContentProps} from '@coffeehc/xui-react/popover';
import type {PopoverContentProps as RootContentProps} from '@coffeehc/xui-react';
type Equal<A,B>=(<T>()=>T extends A?1:2) extends (<T>()=>T extends B?1:2)?true:false;
const sameContainer:Equal<NonNullable<PopoverContentProps['portalProps']>['container'],React.ComponentProps<typeof Popover.Portal>['container']>=true;
const sameRoot:Equal<RootContentProps,PopoverContentProps>=true;
const node=document.createElement('div'),shadow=node.attachShadow({mode:'open'}),ref=React.createRef<HTMLElement|ShadowRoot>();
const containers:NonNullable<PopoverContentProps['portalProps']>['container'][]=[node,shadow,ref,null,undefined];
const legacy=<Popover.Root><Popover.Trigger>Open</Popover.Trigger><Popover.Content positionerProps={{align:'end'}}>Old content</Popover.Content></Popover.Root>;
const content=containers.map(container=><Popover.Content key={String(container)} portalProps={{container,keepMounted:true,ref:portal=>{portal?.getAttribute('id');},id:'custom-portal'}} positionerProps={{align:'start'}} ref={React.createRef<HTMLDivElement>()}>Search</Popover.Content>);
// @ts-expect-error Base UI 1.7.0 container does not accept a callback; use a RefObject instead.
const callback:PopoverContentProps={portalProps:{container:()=>node}};
// @ts-expect-error container is a node/ref, never a selector string.
const selector:PopoverContentProps={portalProps:{container:'#modal'}};
// @ts-expect-error Content owns its portal children.
const children:PopoverContentProps={portalProps:{children:<span/>}};
void [sameContainer,sameRoot,legacy,content,callback,selector,children];
