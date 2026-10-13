import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {CheckboxGroup,RadioGroup} from '@coffeehc/xui-react/choice-group';
import '@coffeehc/xui-theme/style.css';
const initial=[{key:'read',label:'Read'},{key:'write',label:'Write'},{key:'locked',label:'Locked',disabled:true}];
function App(){const [value,setValue]=React.useState(['locked','unknown']),[radio,setRadio]=React.useState<string|null>(null),[options,setOptions]=React.useState(initial),[accept,setAccept]=React.useState(true),[readOnly,setReadOnly]=React.useState(false),[requests,setRequests]=React.useState(0);return <main className="xui-container"><form onSubmit={event=>event.preventDefault()}>
<CheckboxGroup legend="Permissions" name="permissions" options={options} value={value} required readOnly={readOnly} selectAll="Select available" help="Only current editable options are selected." onValueChange={next=>{setRequests(n=>n+1);if(accept)setValue(next);}}/>
<RadioGroup legend="Mode" name="mode" options={options} value={radio} required readOnly={readOnly} onValueChange={next=>{setRequests(n=>n+1);if(accept)setRadio(next);}}/>
<button type="button" onClick={()=>setAccept(!accept)}>Toggle acceptance</button><button type="button" onClick={()=>setReadOnly(!readOnly)}>Toggle readonly</button><button type="button" onClick={()=>setOptions(options.filter(option=>option.key!=='write'))}>Remove write</button><button type="reset">Reset form</button><output className="xui-code" aria-label="State">{JSON.stringify({value,radio,requests})}</output>
</form></main>;}
createRoot(document.getElementById('root')!).render(<App/>);
