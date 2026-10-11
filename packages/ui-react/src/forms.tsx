import * as React from 'react';
import { cx, branded } from './shared.js';
type FieldInfo = { id: string; describedBy?: string; invalid: boolean; required: boolean };
const FieldContext = React.createContext<FieldInfo | null>(null);
export type FieldProps = Omit<React.ComponentProps<'div'>,'children'> & { label: React.ReactNode; children: React.ReactNode; help?: React.ReactNode; error?: React.ReactNode; required?: boolean; controlId?: string };
/** One native control per Field. Names/help/errors are wired without cloning children. */
export function Field({ label, children, help, error, required = false, controlId, className, ...props }: FieldProps) {
  const autoId = React.useId();
  const childId=(nodes:React.ReactNode):string|undefined=>{for(const child of React.Children.toArray(nodes)){if(!React.isValidElement<{id?:string;children?:React.ReactNode}>(child))continue;if([Input,Textarea,NativeSelect,Checkbox,Radio,Switch,'input','textarea','select'].includes(child.type as never)&&child.props.id)return child.props.id;if(child.type!==Fieldset){const nested=childId(child.props.children);if(nested)return nested;}}};
  const id = controlId ?? childId(children) ?? autoId;
  const describedBy = [help ? `${id}-help` : '',error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), required }}><div {...props} className={cx('xui-field',className)}>
    <label className="xui-label" htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>{children}
    {help && <p className="xui-help" id={`${id}-help`}>{help}</p>}{error && <p className="xui-error" id={`${id}-error`}>{error}</p>}
  </div></FieldContext.Provider>;
}
function useField(props: {id?: string; 'aria-describedby'?: string; 'aria-invalid'?: React.AriaAttributes['aria-invalid']; required?: boolean}) {
  const field = React.useContext(FieldContext);
  return {id: field?.id ?? props.id, required: props.required ?? field?.required, 'aria-invalid': props['aria-invalid'] ?? (field?.invalid || undefined), 'aria-describedby': [field?.describedBy,props['aria-describedby']].filter(Boolean).join(' ') || undefined};
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

export type FieldsetProps=React.ComponentProps<'fieldset'> & {legend:React.ReactNode;help?:React.ReactNode;error?:React.ReactNode};
/** Groups several choices; unlike Field, never assigns one id to several inputs. */
export function Fieldset({legend,help,error,className,children,'aria-describedby':described,...props}:FieldsetProps){
  const id=React.useId();
  return <FieldContext.Provider value={null}><fieldset {...props} className={cx('xui-fieldset',className)} aria-describedby={[described,help?`${id}-help`:undefined,error?`${id}-error`:undefined].filter(Boolean).join(' ')||undefined} aria-invalid={props['aria-invalid']??(!!error||undefined)}>
    <legend className="xui-label">{legend}</legend>{children}{help&&<p className="xui-help" id={`${id}-help`}>{help}</p>}{error&&<p className="xui-error" id={`${id}-error`}>{error}</p>}
  </fieldset></FieldContext.Provider>;
}
