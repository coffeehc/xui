import {Button,type ButtonProps} from './button.js';
import {Spinner} from './feedback.js';
import {branded} from './shared.js';
/** @internal One persistent indicator track; a same-scope read never inserts
 * flow feedback or changes this action's label, dimensions or identity. */
export function RefreshAction({busy,children,className,...props}:Omit<ButtonProps,'children'>&{busy:boolean;children:string}){
 return <Button {...props} className={branded('xui-refresh-action',className)} aria-busy={busy}><span className="xui-refresh-action-measure" aria-hidden="true"><Spinner/>{children}</span><span className="xui-refresh-action-content">{busy&&<Spinner/>}<span>{children}</span></span></Button>;
}
