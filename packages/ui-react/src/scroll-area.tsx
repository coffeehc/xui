import * as React from 'react';
import {cx} from './shared.js';
export const ScrollArea={
 Root:function Root({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-scroll-area',className)}/>;},
 Viewport:function Viewport({className,tabIndex=0,...props}:React.ComponentProps<'div'>){return <div role="region" {...props} tabIndex={tabIndex} className={cx('xui-scroll-viewport',className)}/>;},
 Content:function Content({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-scroll-content',className)}/>;},
};
