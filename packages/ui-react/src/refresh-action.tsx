import {Button,type ButtonProps} from './button.js';
import {Spinner} from './feedback.js';
/** @internal One persistent indicator track; a same-scope read never inserts
 * flow feedback or changes this action's label, dimensions or identity. */
export function RefreshAction({busy,children,...props}:ButtonProps&{busy:boolean}){
 return <Button {...props} aria-busy={busy}><Spinner className="xui-reserved-action" data-inactive={!busy}/>{children}</Button>;
}
