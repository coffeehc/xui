import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { branded } from './shared.js';

export type ButtonProps = React.ComponentProps<typeof BaseButton> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'xs' | 'sm' | 'default' | 'lg';
};
/** Busy is a fact; disabled is a separate interaction policy owned by the host. */
export function Button({ className, variant='primary', size='default', type='button', onKeyDown, onKeyUp, onBlur, ...props }: ButtonProps) {
  const [pressed,setPressed]=React.useState(false);
  return <BaseButton {...props} type={type} className={branded('xui-button',className)} data-variant={variant} data-size={size} data-pressed={pressed}
    onKeyDown={event=>{onKeyDown?.(event);if(!event.defaultPrevented && !event.baseUIHandlerPrevented && (event.key==='Enter'||event.key===' '&&props.role!=='link'))setPressed(true);}}
    onKeyUp={event=>{onKeyUp?.(event);setPressed(false);}} onBlur={event=>{onBlur?.(event);setPressed(false);}} />;
}
export type IconButtonProps = ButtonProps & { 'aria-label': string };
export function IconButton(props: IconButtonProps) { return <Button {...props} data-icon="true" />; }
