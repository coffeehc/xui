import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Button,IconButton} from '@coffeehc/xui-react/button';
import {ToggleGroup} from '@coffeehc/xui-react/toggle-group';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';

const variants=['primary','secondary','outline','ghost','destructive','link'] as const;
const states=['enabled','busy','disabled','disabled-busy'] as const;
declare global{interface Window{buttonStateClicks:Record<string,number>}}
window.buttonStateClicks={};
const record=(id:string)=>{window.buttonStateClicks[id]=(window.buttonStateClicks[id]??0)+1;};
function Icon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>;}
createRoot(document.getElementById('root')!).render(<main className="xui-stack">
 <h1>Button state contracts</h1>
 {variants.map(variant=><section key={variant} className="xui-surface"><h2>{variant}</h2><div className="xui-toolbar">{states.map(state=>{const id=`${variant}-${state}`;return <Button key={state} data-testid={id} variant={variant} disabled={state.startsWith('disabled')} aria-busy={state.includes('busy')||undefined} onClick={()=>record(id)}><Icon/>{id}</Button>;})}</div></section>)}
 <ToggleGroup.Root defaultValue={['selected']} disabled aria-label="Disabled selected group"><ToggleGroup.Item value="selected" data-testid="disabled-selected-toggle">Selected disabled toggle</ToggleGroup.Item></ToggleGroup.Root>
 <Button variant="link" nativeButton={false} disabled render={<a href="#disabled-destination"/>} data-testid="disabled-link-element" onClick={()=>record('disabled-link-element')}>Disabled anchor</Button>
 <section className="xui-surface"><h2>Button sizes</h2>
  <div className="xui-toolbar">{(['xs','sm','default','lg'] as const).map(size=><Button key={size} size={size} data-testid={`size-${size}-text`}><Icon/>Save</Button>)}</div>
  <div className="xui-toolbar">{(['xs','sm','default','lg'] as const).map(size=><IconButton key={size} size={size} data-testid={`size-${size}-icon`} aria-label={`${size} save`}><Icon/></IconButton>)}</div>
 </section>
 <section className="xui-surface"><h2>Extra small states</h2>{variants.map(variant=><div key={variant} className="xui-toolbar">{states.map(state=><Button key={state} size="xs" variant={variant} data-testid={`xs-${variant}-${state}`} disabled={state.startsWith('disabled')} aria-busy={state.includes('busy')||undefined}><Icon/>保存</Button>)}<Button size="xs" variant={variant} data-testid={`xs-${variant}-long`} style={{maxInlineSize:'var(--layout-field-min)'}}>保存完整的中文操作名称并允许它自然换行</Button></div>)}</section>
</main>);
