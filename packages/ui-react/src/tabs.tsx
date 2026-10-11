import * as React from 'react';
import { cx, branded } from './shared.js';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { DirectionContext } from '@base-ui/react/internals/direction-context';
function TabsList({className,onKeyDown,loopFocus=true,...props}: React.ComponentProps<typeof BaseTabs.List>) {
  const direction=React.useContext(DirectionContext)?.direction;
  return <BaseTabs.List {...props} loopFocus={loopFocus} className={branded('xui-tabs-list',className)} onKeyDown={event => {
    onKeyDown?.(event);
    // Base UI separates browser preventDefault from preventBaseUIHandler.
    if (event.baseUIHandlerPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const list=event.currentTarget;
    const tabs=Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).filter(tab=>tab.closest('[role="tablist"]') === list);
    const current=tabs.indexOf(list.ownerDocument.activeElement as HTMLElement);
    if (current < 0) return;
    const vertical=list.getAttribute('data-orientation') === 'vertical';
    const rtl=(direction ?? list.ownerDocument.defaultView?.getComputedStyle(list).direction) === 'rtl';
    const previous=vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const next=vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    if (![previous,next,'Home','End'].includes(event.key)) return;
    // Base UI 1.7 permits focus on disabled tabs. The family contract requires
    // skipping them. Only keyboard focus navigation is adapted; activation,
    // values, panel relationships and pointer behavior stay with the peer.
    event.preventDefault(); event.preventBaseUIHandler(); event.stopPropagation();
    const enabled=(tab: HTMLElement)=>tab.getAttribute('aria-disabled') !== 'true' && !tab.hasAttribute('disabled');
    if (event.key === 'Home') { tabs.find(enabled)?.focus();return; }
    if (event.key === 'End') { tabs.slice().reverse().find(enabled)?.focus();return; }
    const step=event.key === next ? 1 : -1;
    for(let distance=1;distance<=tabs.length;distance++) {
      const target=current+distance*step;
      if (!loopFocus && (target < 0 || target >= tabs.length)) return;
      const tab=tabs[(target+tabs.length)%tabs.length];
      if (enabled(tab)) {tab.focus();return;}
    }
  }} />;
}

// Reuse peer primitives for keyboard, relationships, portal and focus lifecycle.
export const Tabs = {
  Root: BaseTabs.Root,
  List: TabsList,
  Tab: function Tab({className,...props}: React.ComponentProps<typeof BaseTabs.Tab>) { return <BaseTabs.Tab {...props} className={branded('xui-tab',className)} />; },
  Panel: function Panel({className,...props}: React.ComponentProps<typeof BaseTabs.Panel>) { return <BaseTabs.Panel {...props} className={branded('xui-tab-panel',className)} />; },
};
