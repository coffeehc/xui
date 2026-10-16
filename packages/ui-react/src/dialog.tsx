import {useOverlay,type WithController,type OverlayController} from './interaction-hooks.js';
import {useDialogLayoutRef} from './dialog-layout.js';
import * as React from 'react';
import { cx, branded } from './shared.js';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
export type DialogCloseButtonProps = React.ComponentProps<typeof BaseDialog.Close>;
/** Explicit icon dismissal; Close remains an unpositioned primitive for footer actions. */
function CloseButton({className,children,'aria-label':label='关闭',...props}:DialogCloseButtonProps) {
  return <BaseDialog.Close {...props} aria-label={label} data-variant="ghost" data-icon="true" className={branded('xui-button xui-dialog-close',className)}>{children ?? <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)"><path d="m6 6 12 12M18 6 6 18" /></svg>}</BaseDialog.Close>;
}
export type DialogHeaderProps = React.ComponentProps<'div'> & {showClose?:boolean;closeButtonProps?:DialogCloseButtonProps};
function Header({className,children,showClose=true,closeButtonProps,...props}:DialogHeaderProps) {
  return <div {...props} className={cx('xui-dialog-header',className)}><div className="xui-dialog-heading">{children}</div>{showClose && <CloseButton {...closeButtonProps}/>}</div>;
}
export const Dialog = {
  Root, Trigger: BaseDialog.Trigger, Close: BaseDialog.Close, Header, CloseButton,
  Content: function Content({className,keepMounted,ref,...props}: React.ComponentProps<typeof BaseDialog.Popup> & {keepMounted?:boolean}) {
    const layoutRef=useDialogLayoutRef(ref);
    return <BaseDialog.Portal keepMounted={keepMounted}><BaseDialog.Backdrop className="xui-backdrop" /><BaseDialog.Popup {...props} ref={layoutRef} className={branded('xui-layer xui-dialog',className)} /></BaseDialog.Portal>;
  },
  Title: function Title({className,...props}: React.ComponentProps<typeof BaseDialog.Title>) { return <BaseDialog.Title {...props} className={branded('xui-dialog-title',className)} />; },
  Description: function Description({className,...props}: React.ComponentProps<typeof BaseDialog.Description>) { return <BaseDialog.Description {...props} className={branded('xui-dialog-description',className)} />; },
  Body: function Body({className,...props}: React.ComponentProps<'div'>) { return <div {...props} className={cx('xui-dialog-body',className)} />; },
  Footer: function Footer({className,...props}: React.ComponentProps<'div'>) { return <div {...props} className={cx('xui-dialog-footer',className)} />; },
};

export type DialogRootProps<Payload=unknown>=WithController<React.ComponentProps<typeof BaseDialog.Root<Payload>>,'open'|'defaultOpen'|'onOpenChange',OverlayController>;
function Root<Payload>(props:DialogRootProps<Payload>){
 const {controller,open,defaultOpen,onOpenChange,...rest}=props;
 const state=useOverlay({controller,open,defaultOpen,onOpenChange});
 return <BaseDialog.Root<Payload> {...rest} open={state.open} onOpenChange={state.onOpenChange}/>;
}
