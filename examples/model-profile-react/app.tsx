import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {createModelProfileController} from '@coffeehc/xui-runtime/model-profile';
import {ThemeService, setInterfaceScale} from '@coffeehc/xui-runtime/theme';
import {ModelProfileForm, ModelProfileEditor} from '@coffeehc/xui-react/model-profile';
import {Card} from '@coffeehc/xui-react/display';
import {Badge} from '@coffeehc/xui-react/feedback';
import {PageHeader, Stack, Toolbar, Container} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Field, SimpleSelect} from '@coffeehc/xui-react/forms';
import {ThemeModeButton} from '@coffeehc/xui-react/theme';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {mockModelAPI} from './mock';
import '@coffeehc/xui-theme/style.css';

bootstrap({app: {title: '模型配置 · XUI Preview'}}, {services: {http: {options: {baseURL: window.location.origin, fetch: mockModelAPI.fetch}}}});
const params = new URLSearchParams(location.search);
if (['light','dark','system'].includes(params.get('mode') ?? '')) ThemeService.setMode(params.get('mode') as 'light'|'dark'|'system');
const controller = createModelProfileController({profileId: params.get('create') === '1' ? undefined : 'example-chat'});
const sheetController = createModelProfileController({profileId: 'example-chat'});
const demo = {controller, sheetController, mock: mockModelAPI, setScale: setInterfaceScale, theme: ThemeService, setReadOnly: (_value: boolean) => {}, setDisabled: (_value: boolean) => {}, setLongLabels: (_value: boolean) => {}};
(window as unknown as {modelProfileDemo: typeof demo}).modelProfileDemo = demo;
function App() {
  const [sheet, setSheet] = React.useState(false), [readOnly, setReadOnly] = React.useState(false), [disabled, setDisabled] = React.useState(false), [long, setLongLabels] = React.useState(false);
  React.useLayoutEffect(() => {Object.assign(demo, {setReadOnly, setDisabled, setLongLabels});}, []);
  return <Container style={{maxInlineSize: 'var(--layout-dialog-max-width)', padding: 'var(--layout-content-inset)'}}><Stack>
    <PageHeader title="模型配置" meta={<Badge>Mock 预览</Badge>} actions={<ThemeModeButton/>}/>
    <Toolbar aria-label="示例场景">
      <Button variant="outline" onClick={() => void controller.load(null)}>新增模型</Button>
      <Button variant="outline" onClick={() => void controller.load('example-chat')}>修改聊天模型</Button>
      <Button variant="outline" onClick={() => void controller.load('example-embedding')}>修改向量模型</Button>
      <ModelProfileEditor controller={sheetController} open={sheet} onOpenChange={setSheet} title="编辑模型" trigger={<Button variant="text">抽屉预览</Button>}/>
    </Toolbar>
    <Card title="模型参数"><ModelProfileForm controller={controller} disabled={disabled} readOnly={readOnly} labels={long ? {model_name: '模型名称：供多个业务应用识别与引用的完整中文名称', real_name: '真实模型名：上游目录中的准确标识或手动输入的私有部署名称'} : undefined}/></Card>
    <Disclosure title="测试场景"><Toolbar><Field label="Mock 响应"><SimpleSelect defaultValue="success" onChange={event => {mockModelAPI.behavior = event.target.value as typeof mockModelAPI.behavior;}}><option value="success">成功</option><option value="empty">目录为空</option><option value="slow">慢响应</option><option value="failure">请求失败</option><option value="unknown">保存结果未知</option></SimpleSelect></Field><Button variant="text" onClick={() => setReadOnly(!readOnly)}>切换只读</Button><Button variant="text" onClick={() => setDisabled(!disabled)}>切换禁用</Button><Button variant="text" onClick={() => setLongLabels(!long)}>长中文标签</Button><Button variant="text" onClick={() => setInterfaceScale(2)}>200% 阅读</Button><Button variant="text" onClick={() => setInterfaceScale(1)}>100% 阅读</Button></Toolbar></Disclosure>
  </Stack></Container>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
