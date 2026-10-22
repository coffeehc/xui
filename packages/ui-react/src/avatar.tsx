import type {IconShape} from './icon-shape.js';
import * as React from 'react';
import {Avatar as Base} from '@base-ui/react/avatar';
import {branded} from './shared.js';
export type AvatarRootProps=Omit<React.ComponentProps<typeof Base.Root>,'color'>&{
 size?:'sm'|'default'|'lg';
 /** Circle by default; square explicitly selects the shared rounded-square frame. */
 shape?:IconShape;
 /** Foreground only; without it, fallback content inherits its enclosing role. */
 color?:React.CSSProperties['color'];
};
export const Avatar={...Base,
 Root:function Root({className,size='default',shape,color,style,...props}:AvatarRootProps){return <Base.Root {...props} {...(shape?{'data-icon-shape':shape}:{})} data-size={size} className={branded('xui-avatar',className)} style={color===undefined?style:typeof style==='function'?state=>({...style(state),color}):{...style,color}}/>;},
 Image:function Image({className,...props}:React.ComponentProps<typeof Base.Image>){return <Base.Image {...props} className={branded('xui-avatar-image',className)}/>;},
 Fallback:function Fallback({className,...props}:React.ComponentProps<typeof Base.Fallback>){return <Base.Fallback {...props} className={branded('xui-avatar-fallback',className)}/>;},
};
