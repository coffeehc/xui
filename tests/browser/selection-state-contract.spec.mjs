import { test, expect } from '@playwright/test';
import { build } from 'esbuild';

let fixtureSource;
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `
import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Combobox} from '@coffeehc/xui-react/combobox';
const root=document.createElement('div');root.className='xui';document.body.append(root);
const options=Array.from({length:30},(_,index)=>({id:'option-'+index,label:'Long option '+index}));
function App(){return <Combobox.Root defaultOpen defaultValue="option-0" items={options.map(item=>item.id)} autoHighlight={false} itemToStringLabel={id=>options.find(item=>item.id===id)?.label??id}><Combobox.Input aria-label="Long options"/><Combobox.Content style={{maxBlockSize:'116px'}}><Combobox.Empty>No results</Combobox.Empty><Combobox.List>{(id:string)=>{const item=options.find(option=>option.id===id)!;return <Combobox.Item key={id} value={id}>{item.label}</Combobox.Item>;}}</Combobox.List></Combobox.Content></Combobox.Root>}
window.mountLongCombobox=()=>{const react=createRoot(root);react.render(<App/>);return()=>react.unmount();};
`,
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    target: 'es2022',
  });
  fixtureSource = result.outputFiles[0].text;
});

test('long Combobox keyboard focus outline stays inside its scrollport after real scrolling', async ({ page }, info) => {
  await page.goto('/react/foundation-contract.html');
  await page.addScriptTag({ content: fixtureSource });
  await page.evaluate(() => window.mountLongCombobox());
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('--menu-item-focus-color', '#345678');
    root.style.setProperty('--focus-width', '2px');
    root.style.setProperty('--focus-offset', '2px');
    root.style.setProperty('--popover-width', '260px');
    root.style.setProperty('--popover-padding', '12px');
  });

  const input = page.getByRole('combobox', { name: 'Long options', exact: true });
  const popup = page.locator('.xui-floating.xui-combobox-popup:visible');
  await expect(popup).toBeVisible();
  await input.focus();
  for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight']) {
    await input.press(key);
    await expect(page.locator('.xui-combobox-item[data-keyboard-active]')).toHaveCount(0);
  }
  for (let index = 0; index < 29; index += 1) await input.press('ArrowDown');
  const activeId = await input.getAttribute('aria-activedescendant');
  expect(activeId).toBeTruthy();
  const active = page.locator(`[id=${JSON.stringify(activeId)}]`);
  await expect(active).toHaveText('Long option 28');
  await expect(active).toHaveAttribute('data-highlighted', '');
  await expect(active).toHaveAttribute('data-keyboard-active', '');
  await expect(active).toHaveCSS('outline-style', 'solid');

  const geometry = await popup.evaluate((scrollport, item) => {
    const viewport = scrollport.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const style = getComputedStyle(item);
    const extent = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
    const clip = {
      left: viewport.left + scrollport.clientLeft,
      right: viewport.left + scrollport.clientLeft + scrollport.clientWidth,
      top: viewport.top + scrollport.clientTop,
      bottom: viewport.top + scrollport.clientTop + scrollport.clientHeight,
    };
    return {
      clip,
      outline: {
        left: itemRect.left - extent,
        right: itemRect.right + extent,
        top: itemRect.top - extent,
        bottom: itemRect.bottom + extent,
      },
      scrollTop: scrollport.scrollTop,
      scrollHeight: scrollport.scrollHeight,
      clientHeight: scrollport.clientHeight,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
    };
  }, await active.elementHandle());
  expect(geometry.scrollTop).toBeGreaterThan(0);
  expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
  expect(geometry.outline.left).toBeGreaterThanOrEqual(geometry.clip.left - 0.5);
  expect(geometry.outline.right).toBeLessThanOrEqual(geometry.clip.right + 0.5);
  expect(geometry.outline.top).toBeGreaterThanOrEqual(geometry.clip.top - 0.5);
  expect(geometry.outline.bottom).toBeLessThanOrEqual(geometry.clip.bottom + 0.5);
  await info.attach('long-combobox-scrollport-focus.png', { body: await page.screenshot(), contentType: 'image/png' });
});
