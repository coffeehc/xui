import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Surface} from '@coffeehc/xui-react/feedback';
import {Input,Textarea} from '@coffeehc/xui-react/forms';
import '@coffeehc/xui-theme/style.css';
declare global {interface Window {inputFoundationEvents:string[]}}
window.inputFoundationEvents=[];
const kinds=['input','textarea'] as const,states=['default','readonly','disabled'] as const;
createRoot(document.getElementById('root')!).render(<main className="xui-container xui-stack"><h1>Input foundation contract</h1><Surface><form id="input-foundation" className="xui-stack"><button type="button" className="xui-button" id="before-inputs">Before inputs</button>{kinds.flatMap(kind=>states.flatMap(state=>[false,true].map(invalid=>{
 const id=`${kind}-${state}-${invalid?'invalid':'valid'}`,Control=kind==='input'?Input:Textarea;
 return <div key={id} className="xui-field"><label htmlFor={id} className="xui-label">{id}</label><Control id={id} name={id} defaultValue={kind==='input'?'Sample 中文 123':'Line 1 中文\nLine 2 123'} readOnly={state==='readonly'} disabled={state==='disabled'} aria-invalid={invalid||undefined} aria-describedby={`${id}-help${invalid?` ${id}-error`:''}`} onInput={()=>window.inputFoundationEvents.push(id)}/><p id={`${id}-help`} className="xui-help">帮助说明可以完整阅读。</p>{invalid&&<p id={`${id}-error`} className="xui-error">请检查当前值。</p>}</div>;
})))}<button type="button" className="xui-button" id="after-inputs">After inputs</button></form></Surface></main>);
