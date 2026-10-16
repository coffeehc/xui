import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input,Textarea,Checkbox,Radio,Switch,InputGroup,Fieldset} from '@coffeehc/xui-react/forms';
import {Progress} from '@coffeehc/xui-react/feedback';
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import '@coffeehc/xui-theme/style.css';
const theme=bootstrap().services.getThemeService();
declare global {interface Window {nativeAudit:{setMode:typeof theme.setMode}}}
window.nativeAudit={setMode:mode=>theme.setMode(mode)};
const types=['text','search','email','url','tel','password','number','date','datetime-local','month','time','week','file','range','color'] as const;
const states=['default','disabled','readonly','invalid'] as const;
function App(){
 React.useEffect(()=>{
  document.querySelectorAll<HTMLInputElement>('[data-mixed]').forEach(node=>node.indeterminate=true);
 },[]);
 return <main className="xui xui-container xui-stack">
  <h1>Native control audit</h1>
  <form id="audit-form" className="xui-stack" onSubmit={event=>event.preventDefault()}>
   {states.map(state=><section key={state} className="xui-stack" data-state={state}>
    <h2>{state}</h2><div className="xui-grid">
    {types.map(type=><Field key={type} label={`${type} ${state}`} help={state==='readonly'&&['file','range','color'].includes(type)?'HTML does not support readonly for this input type':undefined} error={state==='invalid'?'Value needs attention':undefined}>
     <Input type={type} name={`${type}-${state}`} disabled={state==='disabled'} readOnly={state==='readonly'&&!['file','range','color'].includes(type)} defaultValue={type==='file'?undefined:type==='range'?'50':type==='color'?'#326c62':type==='number'?'4':type==='date'?'2026-10-13':type==='datetime-local'?'2026-10-13T09:30':type==='month'?'2026-10':type==='time'?'09:30':type==='week'?'2026-W42':'Sample'} />
    </Field>)}
    <Field label={`Textarea ${state}`} error={state==='invalid'?'Text needs attention':undefined}><Textarea defaultValue="Longer editable text" disabled={state==='disabled'} readOnly={state==='readonly'}/></Field>
    </div>
    <Fieldset legend={`Choices ${state}`} error={state==='invalid'?'Choose an option':undefined} disabled={state==='disabled'}>
     <Checkbox label={`Checkbox ${state}`} name={`checkbox-${state}`} defaultChecked readOnly={state==='readonly'} aria-invalid={state==='invalid'||undefined}/>
     <Checkbox label={`Mixed ${state}`} data-mixed="" readOnly={state==='readonly'} aria-invalid={state==='invalid'||undefined}/>
     <Radio label={`Radio first ${state}`} name={`radio-${state}`} value="first" defaultChecked readOnly={state==='readonly'} aria-invalid={state==='invalid'||undefined}/>
     <Radio label={`Radio second ${state}`} name={`radio-${state}`} value="second" readOnly={state==='readonly'} aria-invalid={state==='invalid'||undefined}/>
     <Switch label={`Switch ${state}`} defaultChecked readOnly={state==='readonly'} aria-invalid={state==='invalid'||undefined}/>
    </Fieldset>
   </section>)}
   <section className="xui-stack"><h2>Actions and native equivalents</h2>
    <div className="xui-toolbar">{(['primary','secondary','outline','ghost','destructive','link'] as const).map(variant=><React.Fragment key={variant}><Button variant={variant}>{variant} enabled</Button><Button variant={variant} disabled>{variant} disabled</Button></React.Fragment>)}</div>
    <Field label="Input group"><InputGroup.Root><InputGroup.Input/><InputGroup.Button disabled>Disabled addon</InputGroup.Button></InputGroup.Root></Field>
    <label className="xui-choice-label"><input id="native-readonly" className="xui-choice" type="checkbox" readOnly defaultChecked/>Native readonly</label>
    <label className="xui-label">Native file<input type="file" className="xui-input" aria-label="Native file"/></label>
    <label className="xui-label">Native date<input type="date" className="xui-input" aria-label="Native date"/></label>
    <label className="xui-label">Native range<input type="range" className="xui-input" aria-label="Native range"/></label>
    <label className="xui-label">Native color<input type="color" className="xui-input" aria-label="Native color"/></label>
    <label className="xui-choice-label"><input className="xui-choice" type="checkbox" data-mixed=""/>Native mixed</label>
    <Progress value={40} max={100} aria-label="Determinate progress"/><Progress aria-label="Indeterminate progress"/>
    <progress className="xui-progress" value={70} max={100} aria-label="Native progress"/>
   </section>
  </form>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
