import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.peerErrors = errors;
  await page.goto('/react/peer-contract.html');
  await page.waitForFunction(() => typeof window.renderPeerCase === 'function');
});
test.afterEach(({ page }) => { expect(page.peerErrors).toEqual([]); });
async function setup(page, config = {}) {
  const revision = await page.evaluate(config => window.renderPeerCase(config), config);
  await expect(page.locator('[data-review-case]')).toHaveAttribute('data-review-case', String(revision));
  const first = page.getByRole('tab', { name: 'A', exact: true });
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await first.focus();
  await page.evaluate(() => { window.peerEvents = []; });
}
const tab = (page, name) => page.getByRole('tab', { name, exact: true });

test('Tabs preserve event callbacks, cancellation and modified keys', async ({ page }) => {
  await setup(page);
  await page.keyboard.press('ArrowRight'); await expect(tab(page, 'B')).toBeFocused();
  expect(await page.evaluate(() => window.peerEvents)).toEqual(['listCapture:ArrowRight', 'tabCapture:ArrowRight', 'tabBubble:ArrowRight', 'listBubble:ArrowRight']);
  await page.keyboard.press('ArrowRight'); await expect(tab(page, 'C')).toBeFocused();
  for (const prevent of ['tabBubble', 'listBubble']) for (const defaultPrevent of [false, true]) {
    await setup(page, { prevent, defaultPrevent });
    await page.keyboard.press('ArrowRight'); await expect(tab(page, defaultPrevent ? 'B' : 'A')).toBeFocused();
    await expect(tab(page, 'A')).toHaveAttribute('aria-selected', 'true');
    expect(await page.evaluate(() => window.peerEvents)).toContain(`${prevent}:ArrowRight`);
    if (defaultPrevent) { await page.keyboard.press('ArrowRight'); await expect(tab(page, 'C')).toBeFocused(); }
  }
  for (const modifier of ['Shift', 'Alt', 'Control', 'Meta']) {
    await setup(page); await page.keyboard.press(`${modifier}+ArrowRight`); await expect(tab(page, 'A')).toBeFocused();
  }
});

test('Tabs preserve controlled/uncontrolled value changes and cancellable activation', async ({ page }) => {
  for (const controlled of [false, true]) for (const auto of [false, true]) for (const cancelValue of [false, true]) {
    await setup(page, { controlled, auto, cancelValue });
    await page.keyboard.press('ArrowRight'); await expect(tab(page, 'B')).toBeFocused();
    if (!auto) { await expect(tab(page, 'A')).toHaveAttribute('aria-selected', 'true'); await page.keyboard.press('Enter'); }
    await expect(tab(page, cancelValue ? 'A' : 'B')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: cancelValue ? 'A' : 'B', exact: true })).toBeVisible();
    expect((await page.evaluate(() => window.peerEvents)).filter(value => value.startsWith('value:'))).toEqual(['value:b']);
  }
});

test('Tabs obey direction context, DOM fallback, orientation and focus boundaries', async ({ page }) => {
  for (const config of [{ provider: 'rtl', css: 'ltr' }, { css: 'rtl' }]) {
    await setup(page, config); await page.keyboard.press('ArrowLeft'); await expect(tab(page, 'B')).toBeFocused();
    await page.keyboard.press('ArrowLeft'); await expect(tab(page, 'C')).toBeFocused();
  }
  await setup(page, { provider: 'ltr', css: 'rtl' });
  await page.keyboard.press('ArrowRight'); await expect(tab(page, 'B')).toBeFocused();
  await setup(page, { vertical: true, loop: false, provider: 'rtl' });
  await page.keyboard.press('ArrowUp'); await expect(tab(page, 'A')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(tab(page, 'B')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(tab(page, 'C')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(tab(page, 'C')).toBeFocused();
  await page.keyboard.press('Home'); await expect(tab(page, 'A')).toBeFocused();
  await page.keyboard.press('End'); await expect(tab(page, 'C')).toBeFocused();
  await setup(page); await page.keyboard.press('ArrowLeft'); await expect(tab(page, 'C')).toBeFocused();
});

test('Dialog cancellation and explicit finalFocus survive removal of the trigger', async ({ page }) => {
  for (const finalFocus of [true, false]) {
    await setup(page, { finalFocus });
    await page.getByRole('button', { name: 'Open review', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Remove trigger' }).click();
    await expect(page.getByRole('button', { name: 'Open review', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Close review' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    if (finalFocus) await expect(page.getByRole('button', { name: 'Fallback' })).toBeFocused();
    else await expect.poll(() => page.evaluate(() => document.activeElement === document.body)).toBe(true);
  }
  await setup(page, { finalFocus: true, cancelClose: true });
  await page.getByRole('button', { name: 'Open review', exact: true }).click();
  await page.getByRole('button', { name: 'Remove trigger' }).click();
  const close = page.getByRole('button', { name: 'Close review' });
  await close.click(); await expect(page.getByRole('dialog')).toBeVisible(); await expect(close).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toBeVisible(); await expect(close).toBeFocused();
  expect(await page.evaluate(() => window.peerEvents)).toContain('open:false:close-press');
  expect(await page.evaluate(() => window.peerEvents)).toContain('open:false:escape-key');
});
