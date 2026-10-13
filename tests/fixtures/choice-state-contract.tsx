import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Checkbox,Radio,Switch} from '@coffeehc/xui-react/forms';
import '@coffeehc/xui-theme/style.css';

declare global {interface Window {choiceStateEvents:string[]}}
window.choiceStateEvents=[];
const kinds=['checkbox','radio','switch'] as const;
const availability=['enabled','disabled','readonly'] as const;
function App(){return <main className="xui-container xui-stack" aria-labelledby="choice-title">
 <h1 id="choice-title">Choice state contract</h1>
 <button className="xui-button" type="button" id="before-choices">Before choices</button>
 <div className="xui-grid">{kinds.flatMap(kind=>(kind==='checkbox'?['unchecked','checked','mixed','mixed-checked']:['unchecked','checked']).flatMap(visual=>availability.flatMap(mode=>[false,true].map(invalid=>{
  const Component=kind==='checkbox'?Checkbox:kind==='radio'?Radio:Switch;
  const id=[kind,visual,mode,invalid?'invalid':'valid'].join('-');
  const label=[kind,visual,mode,invalid?'invalid':'valid'].join(' ');
  return <section key={id} className="xui-stack" data-choice-case={id}>
   <Component id={id} name={id} label={label} defaultChecked={visual==='checked'||visual==='mixed-checked'} disabled={mode==='disabled'} readOnly={mode==='readonly'}
    aria-invalid={invalid||undefined} aria-describedby={invalid?`${id}-error`:undefined}
    data-kind={kind} data-visual={visual} data-availability={mode}
    ref={node=>{if(node)node.indeterminate=visual.startsWith('mixed');}}
    onChange={()=>window.choiceStateEvents.push(id)}/>
   {invalid&&<p className="xui-error" id={`${id}-error`}>Review this choice.</p>}
  </section>;
 }))))}</div>
 <button className="xui-button" type="button" id="after-choices">After choices</button>
 </main>;}
createRoot(document.getElementById('root')!).render(<App/>);
