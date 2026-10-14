import * as React from 'react';
import {cx} from './shared.js';
/** gutter reserves external focus paint space; inset paints it inside controls without that space. */
export type ScrollAreaFocusMode='gutter'|'inset';
/** Native scrolling region; inset is progressive and keeps gutter in engines without CSS @scope. */
export type ScrollAreaViewportProps=React.ComponentProps<'div'>&{focusMode?:ScrollAreaFocusMode};
export const ScrollArea={
 Root:function Root({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-scroll-area',className)}/>;},
 Viewport:function Viewport({className,tabIndex=0,focusMode='gutter',...props}:ScrollAreaViewportProps){return <div role="region" {...props} tabIndex={tabIndex} data-focus-mode={focusMode} className={cx('xui-scroll-viewport',className)}/>;},
 Content:function Content({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-scroll-content',className)}/>;},
};
