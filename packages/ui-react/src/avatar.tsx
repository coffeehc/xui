import * as React from 'react';
import {Avatar as Base} from '@base-ui/react/avatar';
import {branded} from './shared.js';
export const Avatar={...Base,
 Root:function Root({className,size='default',...props}:React.ComponentProps<typeof Base.Root>&{size?:'sm'|'default'|'lg'}){return <Base.Root {...props} data-size={size} className={branded('xui-avatar',className)}/>;},
 Image:function Image({className,...props}:React.ComponentProps<typeof Base.Image>){return <Base.Image {...props} className={branded('xui-avatar-image',className)}/>;},
 Fallback:function Fallback({className,...props}:React.ComponentProps<typeof Base.Fallback>){return <Base.Fallback {...props} className={branded('xui-avatar-fallback',className)}/>;},
};
