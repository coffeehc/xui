import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout,NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {AppShell,PageHeader,type ShellScrollMode} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Input} from '@coffeehc/xui-react/forms';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';
const query=new URLSearchParams(location.search);
const items=[{id:'conversation',label:'Conversation',href:'#conversation',icon:'chat' as const},{id:'settings',label:'Settings',href:'#settings',icon:'settings' as const}];
declare global {interface Window {workspaceDemo:any}}
const root=createRoot(document.getElementById('root')!);
function App(){
  const [slots,setSlots]=React.useState(!query.has('plain')),[leading,setLeading]=React.useState(query.has('platform')),[count,setCount]=React.useState(query.has('short')?2:100),[mode,setMode]=React.useState<ShellScrollMode>('workspace'),[active,setActive]=React.useState('conversation'),[sent,setSent]=React.useState(0);
  window.workspaceDemo={setSlots,setLeading,setMode,setCount,navigate:()=>setActive('settings'),destroy:()=>root.unmount()};
  const headerSlots={leading:leading?<Button variant="ghost" aria-label="Platform action">OS</Button>:undefined,brand:<strong>Workspace</strong>,context:query.has('wrapped')?<span>A host-owned workspace context that can wrap onto another header line</span>:undefined,status:<span>Ready</span>};
  const pageSlots={pageHeader:slots?<PageHeader title="Page title"/>:undefined,pageToolbar:slots?<span>Page tools</span>:undefined,pageFooter:slots?<span>Page footer</span>:undefined};
  // Host-owned business geometry. No xui internal selector, shell measurement, or fixed composer.
  const content=<div data-testid="workspace" style={{display:'flex',blockSize:'100%',minBlockSize:0,minInlineSize:0,gap:'var(--space-content-gap)'}}>
    <section aria-label="Conversation" style={{display:'flex',flexDirection:'column',flex:'1 1 0',minBlockSize:0,minInlineSize:0}}>
      <div role="region" aria-label="Message history" tabIndex={0} data-testid="history" style={{flex:'1 1 0',minBlockSize:0,overflow:'auto'}}>{Array.from({length:count},(_,i)=><p key={i}>Message {i+1}: Synthetic conversation content.</p>)}</div>
      <form aria-label="Composer" style={{display:'flex',flex:'none',gap:'var(--space-control-gap)',minInlineSize:0}} onSubmit={event=>{event.preventDefault();setSent(n=>n+1);}}><Input aria-label="Message draft" defaultValue="Keep my draft" style={{flex:'1 1 0',minInlineSize:0}}/><Button type="submit">Send message</Button></form>
    </section>
    <aside aria-label="Inspector" data-testid="inspector" style={{flex:'1 1 0',minBlockSize:0,minInlineSize:0,overflow:'auto'}}><p>Sent: {sent}</p>{Array.from({length:count},(_,i)=><p key={i}>Detail {i+1}</p>)}</aside>
  </div>;
  const common={scrollMode:mode,headerSlots,...pageSlots,navigationLabel:'Workspace navigation',compactLabel:'Compact navigation',expandLabel:'Expand navigation'};
  return query.has('direct')?<AppShell {...common} sidebar={<NavigationMenu items={items} activeId={active} label="Workspace navigation"/>}>{content}</AppShell>:<MenuLayout {...common} items={items} activeId={active} label="Workspace navigation" navigation={{navigate:request=>setActive(request.id)}}>{content}</MenuLayout>;
}
root.render(<App/>);
