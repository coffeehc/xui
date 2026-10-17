import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { branded } from './shared.js';

/** Optional semantic foreground for transparent text actions. */
export type ButtonTone = 'default' | 'danger';
export type ButtonProps = React.ComponentProps<typeof BaseButton> & {
  /** Text is a transparent action in every state; it preserves size, focus and disabled semantics. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link' | 'text';
  /** Applies to variant=text; explicit non-text variants retain their own recipes. */
  tone?: ButtonTone;
  size?: 'xs' | 'sm' | 'default' | 'lg';
};
/** Busy is a fact; disabled is a separate interaction policy owned by the host. */
export function Button({ className, variant='primary', tone, size='default', type='button', onKeyDown, onKeyUp, onBlur, ...props }: ButtonProps) {
  const [pressed,setPressed]=React.useState(false);
  return <BaseButton {...props} type={type} className={branded('xui-button',className)} data-variant={variant} {...(tone?{'data-tone':tone}:{})} data-size={size} data-pressed={pressed}
    onKeyDown={event=>{onKeyDown?.(event);if(event.key===' '&&event.currentTarget.tagName==='A'&&event.currentTarget.getAttribute('role')==='link')event.preventBaseUIHandler();if(!event.defaultPrevented && !event.baseUIHandlerPrevented && (event.key==='Enter'||event.key===' '&&props.role!=='link'))setPressed(true);}}
    onKeyUp={event=>{onKeyUp?.(event);if(event.key===' '&&event.currentTarget.tagName==='A'&&event.currentTarget.getAttribute('role')==='link')event.preventBaseUIHandler();setPressed(false);}} onBlur={event=>{onBlur?.(event);setPressed(false);}} />;
}
export type IconButtonProps = ButtonProps & { 'aria-label': string };
export function IconButton(props: IconButtonProps) { return <Button {...props} data-icon="true" />; }
