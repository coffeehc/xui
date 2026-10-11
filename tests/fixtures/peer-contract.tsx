import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog, Tabs } from '@coffeehc/xui-react';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import '@coffeehc/xui-theme/style.css';

type Config = {
  controlled?: boolean; auto?: boolean; cancelValue?: boolean;
  vertical?: boolean; loop?: boolean; provider?: 'ltr' | 'rtl'; css?: 'ltr' | 'rtl';
  prevent?: 'tabBubble' | 'listBubble'; defaultPrevent?: boolean;
  finalFocus?: boolean; cancelClose?: boolean;
};
declare global {
  interface Window { peerEvents: string[]; renderPeerCase: (config: Config) => number; }
}
type KeyEvent = Parameters<NonNullable<React.ComponentProps<typeof Tabs.List>['onKeyDown']>>[0] | Parameters<NonNullable<React.ComponentProps<typeof Tabs.Tab>['onKeyDown']>>[0];
const root = createRoot(document.getElementById('root')!);
window.peerEvents = [];
function App({ config, revision }: { config: Config; revision: number }) {
  const [value, setValue] = React.useState('a');
  const [open, setOpen] = React.useState(false);
  const [hasTrigger, setHasTrigger] = React.useState(true);
  const fallback = React.useRef<HTMLButtonElement>(null);
  const log = (value: string) => window.peerEvents.push(value);
  const key = (name: string, event: KeyEvent) => {
    log(`${name}:${event.key}`);
    if (config.prevent === name) {
      if (config.defaultPrevent) event.preventDefault();
      else event.preventBaseUIHandler();
    }
  };
  const tabProps = {
    onKeyDownCapture: (event: KeyEvent) => key('tabCapture', event),
    onKeyDown: (event: KeyEvent) => key('tabBubble', event),
  };
  const content = <div dir={config.css ?? 'ltr'} data-review-case={revision}>
    <Tabs.Root {...(config.controlled ? { value } : { defaultValue: 'a' })}
      orientation={config.vertical ? 'vertical' : 'horizontal'}
      onValueChange={(next, details) => { log(`value:${next}`); if (config.cancelValue) details.cancel(); else setValue(next); }}>
      <Tabs.List activateOnFocus={config.auto} loopFocus={config.loop ?? true}
        onKeyDownCapture={event => key('listCapture', event)} onKeyDown={event => key('listBubble', event)}>
        <Tabs.Tab value="a" {...tabProps}>A</Tabs.Tab>
        <Tabs.Tab value="b" {...tabProps}>B</Tabs.Tab>
        <Tabs.Tab value="d" disabled>D</Tabs.Tab>
        <Tabs.Tab value="c" {...tabProps}>C</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a">Panel A</Tabs.Panel><Tabs.Panel value="b">Panel B</Tabs.Panel><Tabs.Panel value="c">Panel C</Tabs.Panel>
    </Tabs.Root>
    <button ref={fallback}>Fallback</button>
    <Dialog.Root open={open} onOpenChange={(next, details) => {
      log(`open:${next}:${details.reason}`);
      if (!next && config.cancelClose) details.cancel(); else setOpen(next);
    }}>
      {hasTrigger && <Dialog.Trigger>Open review</Dialog.Trigger>}
      <Dialog.Content {...(config.finalFocus ? { finalFocus: fallback } : {})}>
        <Dialog.Title>Review dialog</Dialog.Title>
        <button onClick={() => setHasTrigger(false)}>Remove trigger</button><Dialog.Close>Close review</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  </div>;
  return config.provider ? <DirectionProvider direction={config.provider}>{content}</DirectionProvider> : content;
}
let revision = 0;
window.renderPeerCase = config => {
  window.peerEvents = [];
  revision += 1;
  root.render(<App key={revision} config={config} revision={revision} />);
  return revision;
};
