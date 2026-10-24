import * as React from 'react';
import {Button} from '@coffeehc/xui-react/button';
import {createRoot} from 'react-dom/client';
import {NumberInput,PasswordInput,SearchInput} from '@coffeehc/xui-react/text-inputs';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {Field,Textarea,InputGroup} from '@coffeehc/xui-react/forms';
import '@coffeehc/xui-theme/style.css';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
bootstrapBrowserExample();
function App(){const [number,setNumber]=React.useState<number|null>(2),[password,setPassword]=React.useState(''),[search,setSearch]=React.useState(''),[submits,setSubmits]=React.useState(0),[clears,setClears]=React.useState(0),[revision,setRevision]=React.useState(0),[shown,setShown]=React.useState(true),[readOnly,setReadOnly]=React.useState(false);return <main className="xui-container" style={{padding:'var(--layout-content-inset)'}}><form onSubmit={event=>{event.preventDefault();setSubmits(n=>n+1);}}>
<Field label="Capacity" help="Approximate JS number; empty is unset."><NumberInput name="capacity" value={number} min={-10} max={10} step={0.5} readOnly={readOnly} onValueChange={setNumber}/></Field>
{shown&&<Field label="Password" help="Synthetic demo only; do not enter a real secret."><PasswordInput name="password" value={password} autoComplete="new-password" readOnly={readOnly} onValueChange={setPassword} onClear={()=>setClears(n=>n+1)}/></Field>}
<Field label="Search"><SearchInput name="query" value={search} readOnly={readOnly} onValueChange={setSearch} clearOnEscape onSubmit={()=>setSubmits(n=>n+1)}/></Field>
<Button type="button" onClick={()=>setRevision(n=>n+1)}>Rerender</Button><Button type="button" onClick={()=>setReadOnly(!readOnly)}>Toggle readonly</Button><Button type="button" onClick={()=>setShown(false)}>Remove password</Button><Button type="reset">Reset form</Button><Button type="submit">Submit form</Button>
<output className="xui-code" aria-label="State">{JSON.stringify({number,submits,clears,revision,passwordEmpty:password===''})}</output>
</form><DraftExample/></main>;}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

const draftQuery=new URLSearchParams(location.search);
const stacked=draftQuery.get('layout')==='stacked',maxRows=draftQuery.has('sizing')?5:6,rows=draftQuery.get('rows')==='4'?4:2;
const DraftSurface=draftQuery.get('surface')==='sheet'?Sheet:Dialog;
function DraftExample(){
 const [draft,setDraft]=React.useState(''),[enabled,setEnabled]=React.useState(!draftQuery.has('manual')),[readOnly,setReadOnly]=React.useState(false),[disabled,setDisabled]=React.useState(false),[busy,setBusy]=React.useState(false);
 Object.assign(window,{textareaDemo:{setValue:setDraft,toggle:()=>setEnabled(value=>!value),setBusy,setReadOnly,setDisabled}});
 const Control=stacked?InputGroup.Textarea:Textarea;
 const control=<Control name="idea" rows={rows} value={draft} onChange={event=>setDraft(event.target.value)} autoResize={enabled?{maxRows}:undefined} readOnly={readOnly} disabled={disabled||busy} aria-busy={busy||undefined}/>;
 const addons=draftQuery.get('addons')||'both';
 const top=<InputGroup.Addon><Button variant="ghost" size="xs" disabled={busy}>已选附件：很长的中文研究记录名称</Button></InputGroup.Addon>;
 const bottom=<InputGroup.Addon><Button variant="ghost" size="xs" disabled={busy}>添加参考资料</Button><Button size="xs" disabled={disabled||busy}>{busy?'正在发送…':'发送想法'}</Button></InputGroup.Addon>;
 return <DraftSurface.Root><DraftSurface.Trigger render={<Button/>}>编辑长想法</DraftSurface.Trigger><DraftSurface.Content><DraftSurface.Header><DraftSurface.Title>想法草稿</DraftSurface.Title></DraftSurface.Header><DraftSurface.Body><Field label="想法内容" help={`长中文与分段输入；超过${maxRows}行后在输入框内滚动。`}>{stacked?<InputGroup.Root layout="stacked">{addons!=='bottom'&&top}{control}{addons!=='top'&&bottom}</InputGroup.Root>:control}</Field></DraftSurface.Body><DraftSurface.Footer><Button variant="outline" onClick={()=>setDraft('')}>清空想法</Button><Button variant="ghost" onClick={()=>setEnabled(!enabled)}>切换自动增高</Button><Button variant="ghost" onClick={()=>setReadOnly(!readOnly)}>切换只读</Button><Button variant="ghost" onClick={()=>setDisabled(!disabled)}>切换禁用</Button><DraftSurface.Close render={<Button/>}>完成编辑</DraftSurface.Close></DraftSurface.Footer></DraftSurface.Content></DraftSurface.Root>;
}
