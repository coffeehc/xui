import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {SimpleSelect,Field,Input,Fieldset} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
import {Dialog} from '@coffeehc/xui-react/dialog';
function App(){
 const [value,setValue]=React.useState('a'),[accept,setAccept]=React.useState(true),[language,setLanguage]=React.useState(false),[disabled,setDisabled]=React.useState(false),[calls,setCalls]=React.useState(0);
 const options=<><option value="a">{language?'甲':'Alpha'}</option><optgroup label="Visible group"><option value="b">Beta</option><option value="c" disabled>Gamma</option></optgroup><optgroup label="Hidden group" hidden><option value="h">Hidden</option></optgroup></>;
 return <main className="xui">
  <form id="contract-form" onSubmit={event=>event.preventDefault()}>
   <Field label={language?'受控选择':'Controlled'} help="Selection help"><SimpleSelect name="controlled" value={value} disabled={disabled} onChange={event=>{setCalls(n=>n+1);if(accept)setValue(event.currentTarget.value);}}>{options}</SimpleSelect></Field>
   <label>Wrapped<span hidden> secret</span><span style={{display:'none'}}> hidden</span><SimpleSelect name="wrapped" defaultValue="a">{options}</SimpleSelect></label>
   <span id="reference-name">Referenced</span><SimpleSelect name="reference" aria-label="Fallback" aria-labelledby="reference-name" defaultValue="a">{options}</SimpleSelect>
   <label aria-label="Label supplied name">Visible label<SimpleSelect defaultValue="a">{options}</SimpleSelect></label>
   <span id="label-reference">Label reference name</span><label aria-labelledby="label-reference">Visible label<SimpleSelect defaultValue="a">{options}</SimpleSelect></label>
   <Fieldset legend="Inherited policy" id="inherited-policy"><Field label="Inherited choice"><SimpleSelect name="inherited" defaultValue="a">{options}</SimpleSelect></Field></Fieldset>
   <Field label="Multiple"><SimpleSelect name="multiple" multiple defaultValue={['a']}>{options}</SimpleSelect></Field>
   <Field label="Required" required><SimpleSelect name="required" defaultValue=""><option value="" hidden>Choose a value</option>{options}</SimpleSelect></Field>
   <Field label="Readonly"><SimpleSelect name="readonly" aria-readonly="true" defaultValue="a">{options}</SimpleSelect></Field>
   <Button type="submit">Submit form</Button><Button type="reset">Reset form</Button>
  </form>
  <Button onClick={()=>setAccept(v=>!v)}>Toggle acceptance</Button><Button onClick={()=>setDisabled(v=>!v)}>Toggle disabled</Button><Button onClick={()=>setLanguage(v=>!v)}>Translate</Button><output aria-label="Change calls">{calls}</output>
  <Dialog.Root><Dialog.Trigger render={<Button/>}>Open form</Dialog.Trigger><Dialog.Content><Dialog.Title>Parent dialog</Dialog.Title><Dialog.Body><Field label="Dialog draft"><Input defaultValue="draft"/></Field><Field label="Dialog choice"><SimpleSelect defaultValue="a">{options}</SimpleSelect></Field></Dialog.Body><Dialog.Footer><Dialog.Close render={<Button/>}>Close form</Dialog.Close></Dialog.Footer></Dialog.Content></Dialog.Root>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
