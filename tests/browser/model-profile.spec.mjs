import {test, expect, chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';

const form = page => page.getByRole('form', {name: '模型配置', exact: true});
const button = (page, name) => form(page).getByRole('button', {name, exact: true});
const label = name => new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\*?$');
const field = (page, name) => form(page).getByLabel(label(name));
const state = page => page.evaluate(() => window.modelProfileDemo.controller.getState());
const requests = page => page.evaluate(() => window.modelProfileDemo.mock.requests);
async function open(page, mode = 'light', query = '') {
  await page.goto(`/model-profile-react/?mode=${mode}${query}`);
  await expect(field(page, '模型名称')).toBeVisible();
  await expect(button(page, '保存模型')).toBeEnabled();
}
async function behavior(page, value) {
  await page.evaluate(value => {window.modelProfileDemo.mock.behavior = value;}, value);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}
async function evidence(page, info, name) {
  await mkdir('output/playwright/model-profile', {recursive: true});
  const body = await page.screenshot({path: `output/playwright/model-profile/${name}.png`, fullPage: true});
  await info.attach(name, {body, contentType: 'image/png'});
}

test('existing key marker, direct replacement and Headers reset use the public owner', async ({page}) => {
  await open(page);
  await expect(field(page, 'API Key')).toHaveValue('******');
  await button(page, '拉取模型目录').click();
  await expect.poll(async () => (await state(page)).catalog?.length).toBe(28);
  expect((await requests(page)).at(-1).usesSavedKey).toBe(true);
  await field(page, 'API Key').fill('synthetic-browser-key');
  await button(page, '高级配置').click();
  await expect(field(page, 'Headers JSON')).toHaveValue('{}');
  await field(page, 'Headers JSON').fill('{invalid');
  const before = (await requests(page)).length;
  await button(page, '测试连接').click();
  await expect(field(page, 'Headers JSON')).toBeFocused();
  await expect(field(page, 'Headers JSON')).toHaveAttribute('aria-invalid', 'true');
  expect((await requests(page)).length).toBe(before);
  expect(JSON.stringify(await state(page))).not.toContain('synthetic-browser-key');
  await field(page, 'Headers JSON').fill('{}');
  await button(page, '保存模型').click();
  await expect.poll(async () => (await state(page)).data.version).toBe('2');
  await expect(field(page, 'API Key')).toHaveValue('******');
  await expect(field(page, 'Headers JSON')).toHaveValue('{}');
  expect((await state(page)).data.header_names).toEqual([]);
  const saved = (await requests(page)).at(-1);
  expect(saved.method).toBe('PUT');
  expect(saved.fields).toEqual(['api_key', 'headers']);
  expect(saved.usesSavedKey).toBe(false);
  await field(page, 'API Key').fill('');
  await button(page, '保存模型').click();
  await expect.poll(async () => (await state(page)).data.version).toBe('3');
  await expect(field(page, 'API Key')).toHaveValue('');
  expect((await state(page)).data.has_api_key).toBe(false);
});

test('create validates fields and marker before POST; a new secret is cleared on success', async ({page}) => {
  await open(page, 'light', '&create=1');
  await expect(field(page, 'API Key')).toHaveValue('');
  await button(page, '保存模型').click();
  await expect(field(page, '模型名称')).toBeFocused();
  expect((await requests(page)).filter(r => r.method !== 'GET')).toHaveLength(0);
  await field(page, '模型名称').fill('创建测试模型');
  await field(page, '真实模型名').fill('manual-model');
  await field(page, 'API Key').fill('******');
  await button(page, '保存模型').click();
  await expect(field(page, 'API Key')).toHaveAttribute('aria-invalid', 'true');
  expect((await requests(page)).filter(r => r.method !== 'GET')).toHaveLength(0);
  await field(page, 'API Key').fill('synthetic-create-key');
  await button(page, '保存模型').click();
  await expect.poll(async () => (await state(page)).data.profile_id).toBe('example-new');
  const writes = (await requests(page)).filter(r => r.method === 'POST');
  expect(writes).toHaveLength(1);
  expect(writes[0].path).toBe('/api/v1/model-profiles');
  await expect(field(page, 'API Key')).toHaveValue('******');
});

test('directory pointer selection, refresh retention, empty and failed reads keep manual entry', async ({page}) => {
  await open(page);
  await button(page, '拉取模型目录').click();
  await expect.poll(async () => (await state(page)).catalog?.length).toBe(28);
  await field(page, '真实模型名').fill('example-model-');
  await page.getByRole('option', {name: 'example-model-24', exact: true}).click();
  await expect(field(page, '真实模型名')).toHaveValue('example-model-24');
  await behavior(page, 'slow');
  await button(page, '拉取模型目录').click();
  expect((await state(page)).catalog).toHaveLength(28);
  await button(page, '停止等待').click();
  await expect(button(page, '拉取模型目录')).toBeEnabled();
  await behavior(page, 'empty');
  await button(page, '拉取模型目录').click();
  await expect.poll(async () => (await state(page)).catalog?.length).toBe(0);
  await behavior(page, 'failure');
  await button(page, '拉取模型目录').click();
  await expect.poll(async () => (await state(page)).error).toBe('catalog');
  await field(page, '真实模型名').fill('private-deployment');
  await expect(field(page, '真实模型名')).toHaveValue('private-deployment');
});

test('embedding input and dimensions stay test-only; protocol switching uses server defaults', async ({page}) => {
  await open(page);
  await page.getByRole('button', {name: '修改向量模型', exact: true}).click();
  await expect(field(page, '模型名称')).toHaveValue('知识检索向量');
  await expect(page.getByText('默认策略', {exact: true})).toHaveCount(0);
  await button(page, '测试连接').click();
  await expect(field(page, '测试文本')).toBeFocused();
  await field(page, '测试文本').fill('用于公共模型配置验收的合成文本');
  await field(page, '请求维度（可选）').fill('256');
  await button(page, '测试连接').click();
  await expect.poll(async () => (await state(page)).testResult?.embedding).toEqual({count: 1, dimensions: 256});
  await button(page, '保存模型').click();
  await expect.poll(async () => (await state(page)).data.version).toBe('2');
  expect((await requests(page)).at(-1).fields).toEqual(['api_key']);
  await field(page, 'Provider 类型').click();
  await page.getByRole('option', {name: 'Anthropic', exact: true}).click();
  await expect(button(page, '拉取模型目录')).toBeDisabled();
  await expect(field(page, '测试文本')).toHaveCount(0);
  expect((await state(page)).draft.capabilities.supports_chat).toBe(true);
});

test('unknown write blocks replay, explicit reconciliation restores confirmed state', async ({page}) => {
  await open(page);
  await field(page, '模型名称').fill('保留已提交的模型名称');
  await behavior(page, 'unknown');
  await button(page, '保存模型').click();
  await expect.poll(async () => (await state(page)).error).toBe('save_unknown');
  await expect(button(page, '保存模型')).toBeDisabled();
  await expect(button(page, '重置草稿')).toBeDisabled();
  expect((await requests(page)).filter(r => r.method === 'PUT')).toHaveLength(1);
  await behavior(page, 'success');
  await button(page, '重新读取').click();
  await expect(field(page, '模型名称')).toHaveValue('保留已提交的模型名称');
  await expect(button(page, '保存模型')).toBeEnabled();
  expect((await state(page)).data.version).toBe('2');
});

test('scope switch cancels old work; readonly/disabled, labels and theme keep one controller', async ({page}) => {
  await open(page);
  await page.evaluate(() => {window.originalModelOwner = window.modelProfileDemo.controller;});
  await behavior(page, 'slow');
  await button(page, '测试连接').click();
  await button(page, '停止等待').click();
  await expect(button(page, '测试连接')).toBeEnabled();
  await behavior(page, 'success');
  await page.getByRole('button', {name: '修改向量模型', exact: true}).click();
  await expect(field(page, '模型名称')).toHaveValue('知识检索向量');
  expect((await state(page)).testResult).toBeNull();
  const count = (await requests(page)).length;
  await page.evaluate(() => {window.modelProfileDemo.setReadOnly(true);});
  await expect(field(page, '模型名称')).toHaveAttribute('readonly', '');
  await expect(button(page, '测试连接')).toBeDisabled();
  await page.evaluate(() => {window.modelProfileDemo.setReadOnly(false); window.modelProfileDemo.setDisabled(true);});
  await expect(field(page, '模型名称')).toBeDisabled();
  await page.evaluate(() => {window.modelProfileDemo.setDisabled(false); window.modelProfileDemo.setLongLabels(true); window.modelProfileDemo.theme.setMode('dark');});
  await expect(form(page).getByLabel(/^模型名称：/)).toHaveValue('知识检索向量');
  expect((await requests(page)).length).toBe(count);
  expect(await page.evaluate(() => window.originalModelOwner === window.modelProfileDemo.controller)).toBe(true);
});

test('Sheet dirty confirmation retains draft or discards secrets and returns keyboard focus', async ({page}, info) => {
  await open(page);
  const trigger = page.getByRole('button', {name: '抽屉预览', exact: true});
  await trigger.focus(); await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', {name: '编辑模型', exact: true});
  await expect(sheet.getByLabel(label('模型名称'))).toHaveValue('团队日常助手');
  await sheet.getByLabel(label('API Key')).fill('synthetic-sheet-key');
  await page.keyboard.press('Escape');
  const confirmation = page.getByRole('alertdialog');
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toHaveCSS('opacity', '1');
  await evidence(page, info, 'sheet-confirmation');
  await confirmation.getByRole('button', {name: '继续编辑', exact: true}).click();
  await expect(sheet.getByRole('button', {name: '关闭', exact: true})).toBeFocused();
  await expect(sheet.getByLabel(label('API Key'))).toHaveValue('synthetic-sheet-key');
  await page.keyboard.press('Escape');
  await confirmation.getByRole('button', {name: '放弃并关闭', exact: true}).click();
  await expect(sheet).toHaveCount(0); await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => window.modelProfileDemo.sheetController.getState().data)).toBeNull();
  await trigger.click();
  await expect(sheet.getByLabel(label('API Key'))).toHaveValue('******');
});

for (const mode of ['light', 'dark', 'system']) for (const width of [1280, 390]) for (const scale of [1, 2]) {
  test(`layout ${mode} ${width}px reading ${scale * 100}%: field tracks, focus and scrollable popup`, async ({page}, info) => {
    await page.setViewportSize({width, height: 800});
    await page.emulateMedia({colorScheme: 'dark'});
    await open(page, mode);
    await page.evaluate(scale => {window.modelProfileDemo.setScale(scale); window.modelProfileDemo.setLongLabels(true);}, scale);
    await expect(page.locator('html')).toHaveAttribute('data-theme-effective', mode === 'system' ? 'dark' : mode);
    await expect(page.locator('html')).toHaveAttribute('data-interface-scale', String(scale));
    await noOverflow(page);
    const url = await field(page, 'Base URL').boundingBox(), key = await field(page, 'API Key').boundingBox();
    if (width === 1280) expect(Math.abs(url.y - key.y)).toBeLessThan(3);
    else expect(key.y).toBeGreaterThan(url.y + url.height);
    await button(page, '拉取模型目录').click();
    await expect.poll(async () => (await state(page)).catalog?.length).toBe(28);
    const model = form(page).getByLabel(/^真实模型名：/);
    await model.fill('example-model-');
    await page.getByRole('option', {name: 'example-model-24', exact: true}).click();
    await expect(model).toHaveValue('example-model-24');
    await expect(model).toBeFocused();
    await field(page, 'Base URL').focus();
    await page.keyboard.press('Tab');
    await expect(field(page, 'API Key')).toBeFocused();
    await noOverflow(page);
    await evidence(page, info, `${mode}-${width}-${scale}`);
  });
}

for (const mode of ['light', 'dark', 'system']) test(`genuine browser zoom 200% ${mode}: Sheet controls remain reachable`, async ({}, info) => {
  test.setTimeout(60000);
  const context = await chromium.launchPersistentContext('', {...chromiumLaunchOptions, headless: true, chromiumSandbox: true, viewport: null, args: ['--window-size=1280,1000']});
  try {
    const page = await context.newPage();
    await page.emulateMedia({colorScheme: 'dark'});
    await page.goto(String(info.project.use.baseURL) + `/model-profile-react/?mode=${mode}`);
    await expect(field(page, '模型名称')).toBeVisible();
    const before = await page.evaluate(() => ({width: innerWidth, dpr: devicePixelRatio, font: getComputedStyle(document.documentElement).fontSize}));
    const settings = await context.newPage();
    await settings.goto('chrome://settings/appearance');
    await settings.locator('select#zoomLevel').selectOption('2');
    await settings.close(); await page.bringToFront();
    await expect.poll(() => page.evaluate(() => devicePixelRatio)).toBeCloseTo(before.dpr * 2, 1);
    const after = await page.evaluate(() => ({width: innerWidth, dpr: devicePixelRatio, font: getComputedStyle(document.documentElement).fontSize, zoom: getComputedStyle(document.documentElement).zoom, pinch: visualViewport.scale}));
    expect(after.width).toBeCloseTo(before.width / 2, 0); expect(after.font).toBe(before.font);
    expect(after.zoom).toBe('1'); expect(after.pinch).toBe(1);
    await noOverflow(page);
    await page.getByRole('button', {name: '抽屉预览', exact: true}).click();
    const sheet = page.getByRole('dialog', {name: '编辑模型', exact: true});
    const save = sheet.getByRole('button', {name: '保存模型', exact: true});
    await save.focus(); await expect(save).toBeInViewport();
    await sheet.getByLabel(label('Provider 类型')).click();
    await page.getByRole('option', {name: 'OpenAI Embeddings', exact: true}).click();
    await expect(sheet.getByLabel(label('测试文本'))).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('alertdialog').getByRole('button', {name: '放弃并关闭', exact: true}).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole('button', {name: '抽屉预览', exact: true})).toBeFocused();
    await info.attach('zoom.json', {body: JSON.stringify({before, after}), contentType: 'application/json'});
    const body = await captureZoomViewport(page);
    await mkdir('output/playwright/model-profile', {recursive: true});
    const {writeFile} = await import('node:fs/promises');
    await writeFile(`output/playwright/model-profile/${mode}-browser-200.png`, body);
    await info.attach('zoom.png', {body, contentType: 'image/png'});
  } finally {await context.close();}
});
