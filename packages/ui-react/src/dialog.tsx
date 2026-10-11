import * as React from 'react';
import { cx, branded } from './shared.js';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
export const Dialog = {
  Root: BaseDialog.Root, Trigger: BaseDialog.Trigger, Close: BaseDialog.Close,
  Content: function Content({className,...props}: React.ComponentProps<typeof BaseDialog.Popup>) {
    return <BaseDialog.Portal><BaseDialog.Backdrop className="xui-backdrop" /><BaseDialog.Popup {...props} className={branded('xui-layer xui-dialog',className)} /></BaseDialog.Portal>;
  },
  Title: function Title({className,...props}: React.ComponentProps<typeof BaseDialog.Title>) { return <BaseDialog.Title {...props} className={branded('xui-dialog-title',className)} />; },
  Description: function Description({className,...props}: React.ComponentProps<typeof BaseDialog.Description>) { return <BaseDialog.Description {...props} className={branded('xui-dialog-description',className)} />; },
  Body: function Body({className,...props}: React.ComponentProps<'div'>) { return <div {...props} className={cx('xui-dialog-body',className)} />; },
  Footer: function Footer({className,...props}: React.ComponentProps<'div'>) { return <div {...props} className={cx('xui-dialog-footer',className)} />; },
};
