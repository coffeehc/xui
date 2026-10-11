import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { DirectionContext } from '@base-ui/react/internals/direction-context';

const cx = (...values: (string | undefined)[]) => values.filter(Boolean).join(' ');
function branded<State>(base: string, value: string | ((state: State) => string | undefined) | undefined) {
  return typeof value === 'function' ? (state: State) => cx(base,value(state)) : cx(base,value);
}
export type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'xs' | 'sm' | 'default' | 'lg';
};
export function Button({ className, variant = 'primary', size = 'default', type = 'button', onKeyDown, onKeyUp, onBlur, ...props }: ButtonProps) {
  const [pressed, setPressed] = React.useState(false);
  return <button {...props} type={type} className={cx('xui-button',className)} data-variant={variant} data-size={size} data-pressed={pressed}
    onKeyDown={event => { onKeyDown?.(event); if (!event.defaultPrevented && (event.key === 'Enter' || event.key === ' ')) setPressed(true); }}
    onKeyUp={event => { onKeyUp?.(event); setPressed(false); }} onBlur={event => { onBlur?.(event); setPressed(false); }} />;
}
export type IconButtonProps = ButtonProps & { 'aria-label': string };
export function IconButton(props: IconButtonProps) { return <Button {...props} data-icon="true" />; }

type FieldInfo = { id: string; describedBy?: string; invalid: boolean; required: boolean };
const FieldContext = React.createContext<FieldInfo | null>(null);
export type FieldProps = Omit<React.ComponentProps<'div'>,'children'> & { label: React.ReactNode; children: React.ReactNode; help?: React.ReactNode; error?: React.ReactNode; required?: boolean; controlId?: string };
/** One native control per Field. Names/help/errors are wired without cloning children. */
export function Field({ label, children, help, error, required = false, controlId, className, ...props }: FieldProps) {
  const autoId = React.useId(); const id = controlId ?? autoId;
  const describedBy = [help ? `${id}-help` : '',error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), required }}><div {...props} className={cx('xui-field',className)}>
    <label className="xui-label" htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>{children}
    {help && <p className="xui-help" id={`${id}-help`}>{help}</p>}{error && <p className="xui-error" id={`${id}-error`}>{error}</p>}
  </div></FieldContext.Provider>;
}
function useField(props: {id?: string; 'aria-describedby'?: string; 'aria-invalid'?: React.AriaAttributes['aria-invalid']; required?: boolean}) {
  const field = React.useContext(FieldContext);
  return {id: props.id ?? field?.id, required: props.required ?? field?.required, 'aria-invalid': props['aria-invalid'] ?? (field?.invalid || undefined), 'aria-describedby': [field?.describedBy,props['aria-describedby']].filter(Boolean).join(' ') || undefined};
}
export function Input({className,...props}: React.ComponentProps<'input'>) { return <input {...props} {...useField(props)} className={cx('xui-input',className)} />; }
export function Textarea({className,...props}: React.ComponentProps<'textarea'>) { return <textarea {...props} {...useField(props)} className={cx('xui-textarea',className)} />; }
export function NativeSelect({className,...props}: React.ComponentProps<'select'>) { return <select {...props} {...useField(props)} className={cx('xui-select',className)} />; }
type ChoiceProps = Omit<React.ComponentProps<'input'>,'type' | 'children'> & { label: React.ReactNode };
function Choice({label,className,kind,...props}: ChoiceProps & {kind:'checkbox'|'radio'|'switch'}) {
  const fieldProps = useField(props);
  return <label className="xui-choice-label"><input {...props} {...fieldProps} type={kind === 'radio' ? 'radio' : 'checkbox'} role={kind === 'switch' ? 'switch' : undefined} className={cx('xui-choice',className)} />{label}</label>;
}
export function Checkbox(props: ChoiceProps) { return <Choice {...props} kind="checkbox" />; }
export function Radio(props: ChoiceProps) { return <Choice {...props} kind="radio" />; }
export function Switch(props: ChoiceProps) { return <Choice {...props} kind="switch" />; }
export function Nav({className,...props}: React.ComponentProps<'nav'>) { return <nav {...props} className={cx('xui-nav',className)} />; }
export type NavItemProps = React.ComponentProps<'a'> & { selected?: boolean; disabled?: boolean; collapsed?: boolean };
export function NavItem({selected,disabled,collapsed,className,onClick,tabIndex,...props}: NavItemProps) {
  return <a {...props} className={cx('xui-nav-item',className)} aria-current={selected ? 'page' : undefined} aria-disabled={disabled || undefined} data-collapsed={collapsed} tabIndex={disabled ? -1 : tabIndex}
    href={disabled ? undefined : props.href} onClick={event => { if (disabled) { event.preventDefault(); return; } onClick?.(event); }} />;
}
export function Surface({className,...props}: React.ComponentProps<'section'>) { return <section {...props} className={cx('xui-surface',className)} />; }
export type AlertProps = React.ComponentProps<'div'> & {tone?: 'info'|'success'|'warning'|'error'};
export function Alert({tone='info',className,...props}: AlertProps) { return <div role={tone === 'error' ? 'alert' : 'status'} {...props} className={cx('xui-alert',className)} data-tone={tone} />; }

function TabsList({className,onKeyDown,loopFocus=true,...props}: React.ComponentProps<typeof BaseTabs.List>) {
  const direction=React.useContext(DirectionContext)?.direction;
  return <BaseTabs.List {...props} loopFocus={loopFocus} className={branded('xui-tabs-list',className)} onKeyDown={event => {
    onKeyDown?.(event);
    // Base UI separates browser preventDefault from preventBaseUIHandler.
    if (event.baseUIHandlerPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const list=event.currentTarget;
    const tabs=Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).filter(tab=>tab.closest('[role="tablist"]') === list);
    const current=tabs.indexOf(list.ownerDocument.activeElement as HTMLElement);
    if (current < 0) return;
    const vertical=list.getAttribute('data-orientation') === 'vertical';
    const rtl=(direction ?? list.ownerDocument.defaultView?.getComputedStyle(list).direction) === 'rtl';
    const previous=vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const next=vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    if (![previous,next,'Home','End'].includes(event.key)) return;
    // Base UI 1.7 permits focus on disabled tabs. The family contract requires
    // skipping them. Only keyboard focus navigation is adapted; activation,
    // values, panel relationships and pointer behavior stay with the peer.
    event.preventDefault(); event.preventBaseUIHandler(); event.stopPropagation();
    const enabled=(tab: HTMLElement)=>tab.getAttribute('aria-disabled') !== 'true' && !tab.hasAttribute('disabled');
    if (event.key === 'Home') { tabs.find(enabled)?.focus();return; }
    if (event.key === 'End') { tabs.slice().reverse().find(enabled)?.focus();return; }
    const step=event.key === next ? 1 : -1;
    for(let distance=1;distance<=tabs.length;distance++) {
      const target=current+distance*step;
      if (!loopFocus && (target < 0 || target >= tabs.length)) return;
      const tab=tabs[(target+tabs.length)%tabs.length];
      if (enabled(tab)) {tab.focus();return;}
    }
  }} />;
}

// Reuse peer primitives for keyboard, relationships, portal and focus lifecycle.
export const Tabs = {
  Root: BaseTabs.Root,
  List: TabsList,
  Tab: function Tab({className,...props}: React.ComponentProps<typeof BaseTabs.Tab>) { return <BaseTabs.Tab {...props} className={branded('xui-tab',className)} />; },
  Panel: function Panel({className,...props}: React.ComponentProps<typeof BaseTabs.Panel>) { return <BaseTabs.Panel {...props} className={branded('xui-tab-panel',className)} />; },
};
export const Dialog = {
  Root: BaseDialog.Root, Trigger: BaseDialog.Trigger, Close: BaseDialog.Close,
  Content: function Content({className,...props}: React.ComponentProps<typeof BaseDialog.Popup>) {
    return <BaseDialog.Portal><BaseDialog.Backdrop className="xui-backdrop" /><BaseDialog.Popup {...props} className={branded('xui-dialog',className)} /></BaseDialog.Portal>;
  },
  Title: function Title({className,...props}: React.ComponentProps<typeof BaseDialog.Title>) { return <BaseDialog.Title {...props} className={branded('xui-dialog-title',className)} />; },
  Description: function Description({className,...props}: React.ComponentProps<typeof BaseDialog.Description>) { return <BaseDialog.Description {...props} className={branded('xui-dialog-description',className)} />; },
  Body: function Body({className,...props}: React.ComponentProps<'div'>) { return <div {...props} className={cx('xui-dialog-body',className)} />; },
  Footer: function Footer({className,...props}: React.ComponentProps<'div'>) { return <div {...props} className={cx('xui-dialog-footer',className)} />; },
};
