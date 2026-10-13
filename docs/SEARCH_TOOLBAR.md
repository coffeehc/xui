# SearchToolbar

公开的「搜索 + 主操作 + 可选高级操作」组合，适用于列表、卡片集合、DataTable.toolbar 或 MenuLayout.pageToolbar。查询、值、筛选、分页、业务动作与 API 请求始终归宿主。它不创建 form、search landmark 或 ARIA toolbar 的方向键模型；内部是普通 group，控件保留正常 Tab 顺序。

## React

从 `@coffeehc/xui-react/search-toolbar` 或根入口导入 `SearchToolbar`、`SearchToolbarProps`。加载正式 `@coffeehc/xui-theme/style.css`；按需样式须同时具备 tokens/base/button/navigation/layout/search-toolbar 及所用控件 CSS。

```tsx
<SearchToolbar
  aria-label="记录搜索与操作"
  search={<Input type="search" aria-label="搜索记录" value={query} onChange={event => setQuery(event.target.value)} />}
  actions={<><Button onClick={search}>搜索</Button><Button variant="outline" onClick={create}>新增</Button></>}
  advanced={<Grid><Field label="来源"><Input value={source} onChange={event => setSource(event.target.value)} /></Field></Grid>}
  defaultExpanded={false}
  advancedLabel="高级筛选"
/>
```

- search/actions/advanced：ReactNode，可分别省略；null/undefined/布尔/空字符串/空 Fragment/空数组不占对应槽。0 是内容。返回 null 的自定义组件仍是已提供的内容，不对它做 DOM 探测。
- defaultExpanded：仅初始值，默认 false；true 初始展开。后续改变此字段不会重置用户选择。
- expanded/onExpandedChange(next)：受控事实与请求；拒绝/暂不回传时界面不擅自改变。程序更新 expanded 不触发 onExpandedChange。受控与非受控模式应保持稳定。
- advancedLabel：触发按钮文本及可访问名称，默认 `Advanced options`，空白文本回退默认名，本地化由宿主提供。
- 其余 div props/ref 透传到外层；children 不支持，使用命名槽。

## 原生

从 `@coffeehc/xui-runtime/search-toolbar-dom` 或根入口导入 `createSearchToolbar`、`SearchToolbarOptions`、`SearchToolbarController`。

```js
const view = createSearchToolbar(container, {
  label: '记录搜索与操作',
  search: searchInput,
  actions: actionButtons, // Node 或 DocumentFragment
  advanced: advancedFields,
  advancedLabel: '高级筛选',
  expanded: false,
  onExpandedChange(next) { view.update({expanded: next}); },
});
view.update({expanded: true});
view.getExpanded();
view.destroy();
```

search/actions/advanced 接收 Node|null，普通 button/input 使用现有 `.xui-button`/`.xui-input` 等公开控件类。`getElement()` 返回库生成的外层元素；只用于挂载关联/测量等正常调用，不要求查询私有子结构。`label` 设置内部 group 名称。默认值与受控语义同 React。`getExpanded()` 返回展开事实，即使 advanced 暂无内容也保留该状态；没有高级内容时不显示按钮/区域。

update 为字段合并：省略保留现值，显式 null/undefined 清空对应槽；defaultExpanded 后续不重置状态。相同 Node、相同已消费的 Fragment 只挂载一次，未改槽保留输入值、选择和焦点；传入新 Node 明确替换内容。各槽必须有独立节点，不能重复、嵌套共享或包含工具栏结构。空 Fragment、空文本节点及注释不显示触发器。内容变化需传新节点/Fragment，不能依赖工具栏扫描已消费 Fragment 的变化。一个容器同时只允许一个 owner；destroy 幂等、移除自己的监听并恢复容器原内容，不销毁宿主提供节点的业务监听。

## 尺寸、焦点与组合边界

宽屏搜索占剩余宽度，actions 靠右同一行，搜索默认宽度不参与操作组换行判断。工具栏自身窄于 40rem 时搜索单独一行，actions 内可换行。根、槽和控件均可收缩，无横向裁切；统一普通按钮尺寸采用公开 control-height 等 token，传入不同 Button.size 仍在工具栏动作区归一，图标按钮同步。极长标签允许自然增高；同一行按钮 stretch，不承诺所有跨行按钮固定像素高。高级区任意复杂布局继续组合 Grid/Field/Stack，禁止宿主给控件固定超宽尺寸或添加私有 CSS 补丁。

高级内容折叠时保持挂载和值，以 hidden/inert 移出可访问和焦点树；不禁用字段、不清值、不代表退出 form 提交。若业务希望折叠字段不提交，须由领域状态决定。触发器不是 submit，不执行搜索；程序收起焦点仍在高级内容时回触发器，外部焦点不被抢走。

正式独立打包消费者：[React](../examples/search-toolbar-react/app.tsx)、[原生](../examples/search-toolbar-vanilla/app.js)。测试：[结构/原生生命周期](../tests/search-toolbar.test.mjs)、[真实浏览器交互与几何](../tests/browser/search-toolbar.spec.mjs)。浏览器 200% 页面缩放专测通过隔离临时浏览器的设置页选择真实 Page zoom=200%，并断言 DPR 加倍、布局视口减半；根字号增大和 CSS zoom 不冒充真实缩放。实际执行结果随提交交付，不将测试存在写成已通过。
