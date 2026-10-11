import * as React from 'react';
import {Toast as Base} from '@base-ui/react/toast';
import {branded} from './shared.js';
export const Toast={
 ...Base,
 Viewport:function Viewport({className,...props}:React.ComponentProps<typeof Base.Viewport>){return <Base.Viewport {...props} className={branded('xui-layer xui-toast-viewport',className)}/>;},
 Root:function Root({className,...props}:React.ComponentProps<typeof Base.Root>){return <Base.Root {...props} className={branded('xui-toast',className)}/>;},
 Title:function Title({className,...props}:React.ComponentProps<typeof Base.Title>){return <Base.Title {...props} className={branded('xui-label',className)}/>;},
 Description:function Description({className,...props}:React.ComponentProps<typeof Base.Description>){return <Base.Description {...props} className={branded('xui-help',className)}/>;},
};
