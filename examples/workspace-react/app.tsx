import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout,NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {AppShell,PageHeader,type ShellScrollMode,type ShellContentInset} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Input,InputGroup} from '@coffeehc/xui-react/forms';
import {ScrollArea,type ScrollAreaFocusMode} from '@coffeehc/xui-react/scroll-area';
import {Surface} from '@coffeehc/xui-react/feedback';
import {TableContainer,Table,TableBody,TableRow,TableCell} from '@coffeehc/xui-react/table';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';
const query=new URLSearchParams(location.search);
const items=[{id:'conversation',label:'Conversation',href:'#conversation',icon:'chat' as const},{id:'settings',label:'Settings',href:'#settings',icon:'settings' as const},...(query.has('long-menu')?Array.from({length:40},(_,i)=>({id:`extra-${i}`,label:`Extra navigation ${i+1}`,href:`#extra-${i}`,icon:'settings' as const})):[])];
declare global {interface Window {workspaceDemo:any}}
const root=createRoot(document.getElementById('root')!);
function App(){
  const [slots,setSlots]=React.useState(!query.has('plain')),[leading,setLeading]=React.useState(query.has('platform')),[count,setCount]=React.useState(query.has('short')?2:100),[mode,setMode]=React.useState<ShellScrollMode>('workspace'),[active,setActive]=React.useState('conversation'),[sent,setSent]=React.useState(0);
  const [surfacePadding,setSurfacePadding]=React.useState<'default'|'none'>('none');
  const [contentInset,setContentInset]=React.useState<ShellContentInset>(query.has('edge')?'edge':'standard'),[focusMode,setFocusMode]=React.useState<ScrollAreaFocusMode>(query.has('inset')?'inset':'gutter');
  window.workspaceDemo={setSlots,setLeading,setMode,setCount,setContentInset,setFocusMode,setSurfacePadding,getState:()=>({mode,contentInset,focusMode,surfacePadding}),navigate:()=>setActive('settings'),destroy:()=>root.unmount()};
  const headerSlots={leading:leading?<Button variant="ghost" aria-label="Platform action">OS</Button>:undefined,brand:<strong>Workspace</strong>,context:query.has('wrapped')?<span>A host-owned workspace context that can wrap onto another header line</span>:undefined,status:<span>Ready</span>};
  const pageSlots={pageHeader:slots?<PageHeader title="Page title"/>:undefined,pageToolbar:slots?<span>Page tools</span>:undefined,pageFooter:slots?<span>Page footer</span>:undefined};
  // Host-owned business geometry. No xui internal selector, shell measurement, or fixed composer.
  const panes=<>
    <section aria-label="Conversation" style={{display:'flex',flexDirection:'column',flex:'1 1 0',minBlockSize:0,minInlineSize:0}}>
      <ScrollArea.Root style={{flex:'1 1 0',minBlockSize:0}}><ScrollArea.Viewport aria-label="Message history" data-testid="history" focusMode={focusMode}><ScrollArea.Content>{query.has('focus')&&<InputGroup.Root><InputGroup.Input aria-label="First history field" defaultValue="History draft"/></InputGroup.Root>}{Array.from({length:count},(_,i)=><p key={i}>Message {i+1}: Synthetic conversation content.</p>)}{query.has('focus')&&<Button>Last history action</Button>}</ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root>
      <form aria-label="Composer" style={{display:'flex',flex:'none',gap:'var(--space-control-gap)',minInlineSize:0}} onSubmit={event=>{event.preventDefault();setSent(n=>n+1);}}><InputGroup.Root style={{flex:'1 1 0',minInlineSize:0}}><InputGroup.Input aria-label="Message draft" defaultValue="Keep my draft"/></InputGroup.Root><Button type="submit">Send message</Button></form>
    </section>
    <ScrollArea.Root style={{flex:'1 1 0',minBlockSize:0,minInlineSize:0}}><ScrollArea.Viewport aria-label="Inspector" data-testid="inspector" focusMode={focusMode}><ScrollArea.Content><p>Sent: {sent}</p>{query.has('focus')&&<><Surface aria-label="Padded inspector card"><Input aria-label="Padded card field"/></Surface><Surface padding="none" aria-label="Flush inspector card"><Input aria-label="Flush card field"/></Surface>{(['gutter','inset'] as const).map(nestedMode=><ScrollArea.Root key={nestedMode} style={{blockSize:'var(--layout-scroll-area-height)'}}><ScrollArea.Viewport aria-label={`Nested ${nestedMode}`} focusMode={nestedMode}><ScrollArea.Content>{nestedMode==='inset'&&<TableContainer aria-label="Nested inset table" style={{blockSize:'var(--layout-scroll-area-height)'}}><Table><TableBody><TableRow><TableCell>Public nested table</TableCell></TableRow></TableBody></Table></TableContainer>}<Input aria-label={`First ${nestedMode} field`}/>{Array.from({length:10},(_,i)=><p key={i}>Nested detail {i+1}</p>)}<Button>Last {nestedMode} action</Button></ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root>)}</>}{Array.from({length:count},(_,i)=><p key={i}>Detail {i+1}</p>)}</ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root>
  </>;
  const frame={style:{display:'flex',blockSize:'100%',minBlockSize:0,minInlineSize:0,gap:'var(--space-content-gap)'}};
  const content=query.has('surface')?<Surface {...frame} padding={surfacePadding} data-testid="workspace">{panes}</Surface>:<div {...frame} data-testid="workspace">{panes}</div>;
  const common={scrollMode:mode,contentInset,headerSlots,...pageSlots,navigationLabel:'Workspace navigation',compactLabel:'Compact navigation',expandLabel:'Expand navigation'};
  return query.has('direct')?<AppShell {...common} sidebar={<NavigationMenu items={items} activeId={active} label="Workspace navigation"/>}>{content}</AppShell>:<MenuLayout {...common} items={items} activeId={active} label="Workspace navigation" navigation={{navigate:request=>setActive(request.id)}}>{content}</MenuLayout>;
}
root.render(<App/>);
