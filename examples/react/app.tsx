import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, IconButton, Field, Input, Textarea, SimpleSelect, Checkbox, Radio, Switch, Nav, NavItem, Tabs, Alert, Surface, Dialog } from '@coffeehc/xui-react';
import { createThemeController, type ThemeMode } from '@coffeehc/xui-runtime';
import '@coffeehc/xui-theme/style.css';
import './layout.css';
import './product.css';
declare global { interface Window { xuiTheme?: ReturnType<typeof createThemeController> } }
const theme = window.xuiTheme ?? createThemeController();
function App() {
  const [mode,setMode] = React.useState(theme.getState().mode);
  React.useEffect(() => theme.subscribe(state => setMode(state.mode)),[]);
  const [name,setName] = React.useState('我的工作空间'), [note,setNote] = React.useState('保留草稿，随时调整。');
  const [error,setError] = React.useState(''), [saved,setSaved] = React.useState(false), [selected,setSelected] = React.useState('preferences');
  const submit = (event: React.FormEvent) => { event.preventDefault(); const invalid = !name.trim(); setError(invalid ? '请填写名称，草稿未保存。' : ''); setSaved(!invalid); if (invalid) document.getElementById('workspace-name')?.focus(); };
  return <><header className="demo-header"><strong>xui</strong><span>React 示例</span></header><div className="demo-layout"><Nav aria-label="示例导航">
    <NavItem href="#preferences" selected={selected === 'preferences'} onClick={() => setSelected('preferences')}>偏好</NavItem>
    <NavItem href="#details" selected={selected === 'details'} onClick={() => setSelected('details')}>详情</NavItem>
  </Nav><main className="demo-main" id="preferences"><h1>工作偏好</h1><p className="demo-status" role="status">{saved ? '已保存' : '草稿尚未保存'}</p>
    <form className="demo-form" noValidate onSubmit={submit}><Field label="名称" required error={error} controlId="workspace-name"><Input value={name} onChange={event => {setName(event.target.value);setSaved(false);}} /></Field>
    <div className="demo-fields"><Field label="外观"><SimpleSelect value={mode} onChange={event => theme.setMode(event.target.value as ThemeMode)}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></SimpleSelect></Field>
    <Field label="主题配方"><SimpleSelect defaultValue="default" onChange={event => {document.documentElement.dataset.product = event.target.value;}}><option value="default">Precision 默认</option><option value="example">蓝色覆盖</option></SimpleSelect></Field></div>
    <div className="demo-row"><Checkbox label="允许提醒" defaultChecked /><Switch label="自动整理" /></div>
    <fieldset className="demo-choice-group"><legend>提醒方式</legend><Radio label="站内" name="channel" value="inbox" defaultChecked /><Radio label="邮件" name="channel" value="email" /></fieldset>
    <div className="demo-row"><Button type="submit">保存偏好</Button><Dialog.Root><Dialog.Trigger render={<Button variant="outline" />}>使用说明</Dialog.Trigger>
    <Dialog.Content><Dialog.Title>使用说明</Dialog.Title><Dialog.Description>偏好仅保存在此示例的内存中，外观选择保存在此浏览器。</Dialog.Description><Dialog.Body><p>主题切换保留名称与备注。取消不会保存草稿。</p><p>{'这是合成的长中文说明，用于检查弹层内容滚动和底部取消操作始终可达。'.repeat(60)}</p></Dialog.Body><Dialog.Footer><Dialog.Close render={<Button variant="outline" />}>取消</Dialog.Close></Dialog.Footer></Dialog.Content></Dialog.Root><Button disabled aria-busy="true">等待同步</Button></div>
    <div className="demo-feedback">{saved && <Alert tone="success">偏好已保存在示例内存中。</Alert>}</div></form>
    <Surface className="demo-detail" id="details" aria-label="更多设置"><Tabs.Root defaultValue="note"><Tabs.List aria-label="更多设置"><Tabs.Tab value="note">备注</Tabs.Tab><Tabs.Tab value="identity">标识</Tabs.Tab><Tabs.Tab value="unavailable" disabled>不可用</Tabs.Tab></Tabs.List>
    <Tabs.Panel value="note"><Field label="备注"><Textarea value={note} onChange={event => setNote(event.target.value)} /></Field><IconButton variant="ghost" aria-label="清空备注" onClick={() => {setNote('');setSaved(false);}}><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" fill="none" strokeWidth="var(--icon-stroke-width)" /></svg></IconButton></Tabs.Panel>
    <Tabs.Panel value="identity"><Field label="只读标识"><Input value="workspace-demo" readOnly /></Field><NavItem href="#preferences" disabled selected>不可用入口</NavItem><Button variant="destructive" disabled>移除示例</Button></Tabs.Panel></Tabs.Root></Surface>
  </main></div></>;
}
createRoot(document.getElementById('root')!).render(<App />);
