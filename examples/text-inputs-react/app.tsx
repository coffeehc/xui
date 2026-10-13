import * as React from 'react';
import {Button} from '@coffeehc/xui-react/button';
import {createRoot} from 'react-dom/client';
import {NumberInput,PasswordInput,SearchInput} from '@coffeehc/xui-react/text-inputs';
import {Field} from '@coffeehc/xui-react/forms';
import '@coffeehc/xui-theme/style.css';
function App(){const [number,setNumber]=React.useState<number|null>(2),[password,setPassword]=React.useState(''),[search,setSearch]=React.useState(''),[submits,setSubmits]=React.useState(0),[clears,setClears]=React.useState(0),[revision,setRevision]=React.useState(0),[shown,setShown]=React.useState(true),[readOnly,setReadOnly]=React.useState(false);return <main className="xui-container" style={{padding:'var(--layout-content-inset)'}}><form onSubmit={event=>{event.preventDefault();setSubmits(n=>n+1);}}>
<Field label="Capacity" help="Approximate JS number; empty is unset."><NumberInput name="capacity" value={number} min={-10} max={10} step={0.5} readOnly={readOnly} onValueChange={setNumber}/></Field>
{shown&&<Field label="Password" help="Synthetic demo only; do not enter a real secret."><PasswordInput name="password" value={password} autoComplete="new-password" readOnly={readOnly} onValueChange={setPassword} onClear={()=>setClears(n=>n+1)}/></Field>}
<Field label="Search"><SearchInput name="query" value={search} readOnly={readOnly} onValueChange={setSearch} clearOnEscape onSubmit={()=>setSubmits(n=>n+1)}/></Field>
<Button type="button" onClick={()=>setRevision(n=>n+1)}>Rerender</Button><Button type="button" onClick={()=>setReadOnly(!readOnly)}>Toggle readonly</Button><Button type="button" onClick={()=>setShown(false)}>Remove password</Button><Button type="reset">Reset form</Button><Button type="submit">Submit form</Button>
<output className="xui-code" aria-label="State">{JSON.stringify({number,submits,clears,revision,passwordEmpty:password===''})}</output>
</form></main>;}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
