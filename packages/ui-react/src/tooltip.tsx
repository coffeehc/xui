import * as React from 'react';
import { Tooltip as Base } from '@base-ui/react/tooltip';
import {branded} from './shared.js';
const DescriptionId=React.createContext<string|undefined>(undefined);
function Popup({className,id,...props}:React.ComponentProps<typeof Base.Popup>){const descriptionId=React.useContext(DescriptionId);return <Base.Popup role="tooltip" {...props} id={descriptionId??id} className={branded('xui-layer xui-floating xui-tooltip-popup',className)}/>;}
export const Tooltip = {
 ...Base,
 Root: function Root<Payload>({contentId,...props}:React.ComponentProps<typeof Base.Root<Payload>> & {contentId?:string}){const id=React.useId();return <DescriptionId.Provider value={contentId??id}><Base.Root {...props}/></DescriptionId.Provider>;},
 Trigger: function Trigger<Payload>({'aria-describedby':described,...props}:React.ComponentProps<typeof Base.Trigger<Payload>>){const id=React.useContext(DescriptionId);return <Base.Trigger {...props} aria-describedby={[described,id].filter(Boolean).join(' ')||undefined}/>;},
 Popup,
 Content: function Content({positionerProps,...props}:React.ComponentProps<typeof Base.Popup> & {positionerProps?:React.ComponentProps<typeof Base.Positioner>}){return <Base.Portal keepMounted><Base.Positioner side="top" align="center" {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Popup {...props}/></Base.Positioner></Base.Portal>;},
};
