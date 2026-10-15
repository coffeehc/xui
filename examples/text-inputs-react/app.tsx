import * as React from 'react';
import {Button} from '@coffeehc/xui-react/button';
import {createRoot} from 'react-dom/client';
import {NumberInput,PasswordInput,SearchInput} from '@coffeehc/xui-react/text-inputs';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Field,Textarea} from '@coffeehc/xui-react/forms';
import '@coffeehc/xui-theme/style.css';
function App(){const [number,setNumber]=React.useState<number|null>(2),[password,setPassword]=React.useState(''),[search,setSearch]=React.useState(''),[submits,setSubmits]=React.useState(0),[clears,setClears]=React.useState(0),[revision,setRevision]=React.useState(0),[shown,setShown]=React.useState(true),[readOnly,setReadOnly]=React.useState(false);return <main className="xui-container" style={{padding:'var(--layout-content-inset)'}}><form onSubmit={event=>{event.preventDefault();setSubmits(n=>n+1);}}>
<Field label="Capacity" help="Approximate JS number; empty is unset."><NumberInput name="capacity" value={number} min={-10} max={10} step={0.5} readOnly={readOnly} onValueChange={setNumber}/></Field>
{shown&&<Field label="Password" help="Synthetic demo only; do not enter a real secret."><PasswordInput name="password" value={password} autoComplete="new-password" readOnly={readOnly} onValueChange={setPassword} onClear={()=>setClears(n=>n+1)}/></Field>}
<Field label="Search"><SearchInput name="query" value={search} readOnly={readOnly} onValueChange={setSearch} clearOnEscape onSubmit={()=>setSubmits(n=>n+1)}/></Field>
<Button type="button" onClick={()=>setRevision(n=>n+1)}>Rerender</Button><Button type="button" onClick={()=>setReadOnly(!readOnly)}>Toggle readonly</Button><Button type="button" onClick={()=>setShown(false)}>Remove password</Button><Button type="reset">Reset form</Button><Button type="submit">Submit form</Button>
<output className="xui-code" aria-label="State">{JSON.stringify({number,submits,clears,revision,passwordEmpty:password===''})}</output>
</form><DraftExample/></main>;}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

function DraftExample(){
 const [draft,setDraft]=React.useState(''),[enabled,setEnabled]=React.useState(true),[readOnly,setReadOnly]=React.useState(false),[disabled,setDisabled]=React.useState(false);
 Object.assign(window,{textareaDemo:{setValue:setDraft,toggle:()=>setEnabled(value=>!value)}});
 return <Dialog.Root><Dialog.Trigger render={<Button/>}>编辑长想法</Dialog.Trigger><Dialog.Content><Dialog.Header><Dialog.Title>想法草稿</Dialog.Title></Dialog.Header><Dialog.Body><Field label="想法内容" help="长中文与分段输入；超过六行后在输入框内滚动。"><Textarea name="idea" rows={2} value={draft} onChange={event=>setDraft(event.target.value)} autoResize={enabled?{maxRows:6}:undefined} readOnly={readOnly} disabled={disabled}/></Field></Dialog.Body><Dialog.Footer><Button variant="outline" onClick={()=>setDraft('')}>清空想法</Button><Button variant="ghost" onClick={()=>setEnabled(!enabled)}>切换自动增高</Button><Button variant="ghost" onClick={()=>setReadOnly(!readOnly)}>切换只读</Button><Button variant="ghost" onClick={()=>setDisabled(!disabled)}>切换禁用</Button><Dialog.Close render={<Button/>}>完成编辑</Dialog.Close></Dialog.Footer></Dialog.Content></Dialog.Root>;
}
