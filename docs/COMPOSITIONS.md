# 公开展示、弹层与表格组合

完整规则只在[DESIGN](DESIGN.md)；正式exports与types见[PUBLIC_API](PUBLIC_API.md)。本页说明原子上的公开组合，不包含业务状态引擎或新默认品牌值。独立tarball消费者为[React](../examples/capabilities-react/app.tsx)/[原生](../examples/capabilities-vanilla/app.js)，两者无需私有页面CSS。

| 能力 | React | 原生公开接入 |
| --- | --- | --- |
| Sheet | /sheet的Sheet.Root/Content/Title/Description/Body/Footer/Close；Content side=start/end/top/bottom | createSheetController(dialog,trigger,{side,...DialogOptions})，公开xui-dialog部件结构；controller添加并恢复sheet class/side |
| AlertDialog | /alert-dialog的AlertDialog，延续Base UI AlertDialog Root与dialog parts；Content initialFocus/finalFocus | createAlertDialogController(dialog,trigger,{initialFocus,...DialogOptions})，role=alertdialog，data-xui-cancel为安全初始焦点，否则中性dialog |
| ContextMenu | /context-menu的ContextMenu.Root/Trigger/Content/Item/CheckboxItem/RadioItem等公开peer parts | createContextMenuController(trigger,popup)，public floating/menu class与role；checked/value由宿主更新 |
| Table | Table striped、TableRow selected/expanded；TableExpandedRow colSpan，TableExpandButton expanded/controls/onClick；Cell/HeaderCell sticky=start/end、stickyOffset | 相同xui-table/row/expanded-row类，data-striped/selected/expanded/sticky；语义table、colspan、aria-expanded/controls和展开状态由宿主 |
| MetricCard | /metric-card 的 MetricCard，复用 Surface；必填 label/value，可选通用 marker slot；不格式化值 | 公开 xui-surface/xui-metric-card 与 dl/header/label/marker/value 结构；无 controller。排列使用已有 xui-grid，见[完整合同与双端示例](DISPLAY.md#metriccard) |

Sheet复用Dialog lifecycle，标题/描述/关闭部件复用同一组件；正文滚动、footer动作保持可见，逻辑side随RTL。AlertDialog复用peer确认角色和取消/焦点，不因关闭而执行业务。嵌套时只有最上层处理取消和Tab，确认逻辑由宿主显式执行；有草稿才打开确认，空草稿直接关闭。trigger若不存在或已移除须给可见finalFocus，不能把父关闭按钮同时作为无条件子确认trigger。

ContextMenu支持鼠标右键、Shift+F10/ContextMenu键、方向键、disabled、检查项保留、外部关闭和Esc回焦点。普通点击Trigger不执行业务。没有声明跨移动OS长按一致；必要操作还须由可点击按钮/菜单访问。React keyboard和popup定位由已安装Base UI peer1.7提供；native复用Popover controller，无额外监听owner。

表格为语义table，条纹排除expanded内容行，hover/selected优先级明确；sticky cell继承所属行的非透明背景，避免滚动穿透。多个同侧sticky列的offset由宿主显式给出，不测量/推断列宽；仅所属TableContainer横向滚动。展开按钮是正常button，不截获行所有点击，也不实现查询、虚拟化、权限、排序或选择引擎。

全部组合使用已有motion token/reduced-motion，动画不延后操作。native controllers的受控syncOpen、details.cancel、destroy与监听释放沿用[IMPLEMENTATION](IMPLEMENTATION.md)；键盘/焦点/长中文/窄屏/200%根字体的实际检查见[验证记录](VALIDATION.md#chromium-浏览器结果)，真实移动OS、读屏器和其他浏览器未验。

Table新增stickyHeader布尔prop，原生table[data-sticky-header=true]相同；表头在所属TableContainer顶端sticky，与列sticky交点提高一层，边界使用现有surface-line。多个表头行/额外上方控件的offset由宿主明确style，不猜高度。行的raised/support底色保持不透明，hover/selected语义色以同色gradient叠在底色上，sticky单元格继承完整底色/图层；允许产品交互色有alpha而不穿透。产品基础layer仍须是可读不透明背景。selected优先hover，条纹/expanded基础层仍保留，无新增默认品牌值或产品color-mix配方。

React ContextMenu.SubmenuTrigger复用公共Menu.Item皮肤，SubmenuRoot/RadioGroup/RadioItem等由同一个Base UI peer处理。原生createSubmenuController(trigger,popup,options)要求trigger位于role=menu父popup，子popup保持父DOM后代；菜单项用公开xui-menu-item，触发器aria-haspopup=menu。左右键按RTL打开/退回，子层独立上下键/Escape，关闭父菜单同步关闭子层；checkbox/radio事实及业务动作仍由宿主提供。必要操作仍给普通可点击入口，未声明移动OS长按合同。

其它新增组合与HTML合同见[WIDGETS](WIDGETS.md)，它们复用既有token、motion、Field/Combobox/按钮，不增加界面密度或业务引擎。

React菜单沿用peer的可聚焦disabled项默认（可读取原因，不能执行）；native菜单方向键跳过disabled。两者都验证禁用不执行与Esc回焦点，不伪称所有键盘停靠点完全相同。

## 菜单文字、图标与字段标签

React Menu.LinkItem透传固定peer的closeOnClick合同，默认false；需要点击后关闭时明确传true。

Menu / ContextMenu 的 Item、LinkItem、CheckboxItem、RadioItem、SubmenuTrigger 统一使用显式菜单角色 body-xs/line-height-body-xs/font-weight-control（默认13px/20px/500）。该规则位于 `.xui-menu-item`，不改变 Portal 的 `.xui-layer` body-sm正文；Select/Combobox/Command 中共用该菜单项角色的选项同时得到相同文字合同。

`Menu.Icon` 与 `ContextMenu.Icon` 是同一公开装饰性 span slot，透传 span props/ref，默认 `aria-hidden=true`。示例 `<Menu.Item><Menu.Icon><Settings /></Menu.Icon>设置</Menu.Item>`；原生使用 `<span class="xui-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24">…</svg></span>`。slot 与它的直接 SVG 子元素由库绑定 control-icon-size（默认16px）、不收缩；图文间距继续采用 menu-item-gap（默认8px）。SVG 自身24px属性不再改变菜单图标布局；未声明slot的普通嵌套插图不受此规则强制缩放。不要再全局覆写菜单中所有svg。

`.xui-label` 与 `.xui-choice-label` 显式绑定标签字号、行高与字重；Field 仍是 label→control→help→error 的8/4/4px间距，控件 id/htmlFor/aria-describedby/aria-invalid 规则不变。choice-label 的默认36px点击区保留，不因13px文字机械缩为20px。原生 HTML 继续使用同名公开类、label for 与显式错误关联；没有为这次修复新增密度或small/large开关。

## 表单焦点绘制与关闭入口

Dialog.Body 与 ScrollArea.Viewport 是滚动边界：两轴裁切需要给焦点外环预留 `focus-width + focus-offset` 的四边绘制空间，仅设置 scroll-padding 不够。公共 base.css 统一拥有 padding / scroll-padding 与子控件 scroll-margin；Dialog.Body 用等值负 margin 消耗 Content 已有内距，因此字段仍与标题和 footer 对齐，长正文保持有界滚动，Content 的圆角裁切不变。ScrollArea.Viewport 默认 focusMode=gutter，在自己的内容盒中留空间，不扩宽 Root；其自身键盘焦点使用 inset 指示。显式 focusMode=inset（原生 data-focus-mode=inset）把几何余量与控制项内部焦点绘制一起放在 CSS @scope 增强内，旧引擎保留 gutter；最近公共滚动边界拥有策略，嵌套默认 gutter 不被外层 edge/inset 覆盖。可聚焦的 ScrollArea.Viewport 与 TableContainer 自身使用内部焦点绘制，贴在外层零 gutter 滚动口边缘仍保持完整；其内部控制项继续采用各自边界策略。InputGroup 仍只有外层一套边框和焦点，invalid 边框不被 focus 覆盖。

Surface（普通 Card）、Field、Grid 本身并不裁切：Surface 默认已有 card-padding，显式 padding=none（原生 data-padding=none）只去除此表面的内距，背景/边线/圆角保留且不增加裁切，内部卡片与控件仍保留自己的默认 padding。Card 内套 ScrollArea、Dialog/Sheet 内套 Card 与滚动表单则由对应滚动边界承担绘制空间。宿主自行增加 overflow:hidden/auto、零内距或固定窄宽度，会建立新的裁切边界；应使用正式 ScrollArea，不通过输入框逐个补丁、全局 overflow:visible、缩小 focus token 或移除 outline 处理。

工作区主内容贴边使用公开 [contentInset=edge](LAYOUT_SLOTS.md#工作区正文贴边)，只在 workspace 生效。多行草稿与上下工具区域使用 [InputGroup stacked/Textarea](WIDGETS.md#多行输入与上下工具区域)，唯一组表面/焦点仍由 InputGroup 拥有，不用 Surface 再套一层输入框皮肤。

React 推荐组合：`<Dialog.Header closeButtonProps={{'aria-label':'关闭设置'}}><Dialog.Title>设置</Dialog.Title><Dialog.Description>说明</Dialog.Description></Dialog.Header>`。Header 默认只生成一个 CloseButton，标题轨道可收缩/换行，关闭入口位于右上（RTL 为逻辑末端），不与文字重叠。`showClose={false}` 明确隐藏入口；`closeButtonProps` 透传 Base UI Close 的 disabled、回调、render/ref 等合同。Sheet.Header / Sheet.CloseButton 复用同一实现。需要手工标题组合时，可把一个 Dialog.CloseButton 直接放在 Content 内；它采用右上绝对定位，并为直接 Title/Description 留出位置。

`Dialog.Close` / `Sheet.Close` 继续是无位置假设的关闭动作，可用在 Footer 的“取消”按钮。Content 不盲目注入第二个关闭按钮；AlertDialog 继续通过明确的确认/取消动作作决定，不增加默认 X。

原生 HTML 等价：在 `.xui-native-dialog` 内使用 `.xui-dialog-header`，其中 `.xui-dialog-heading` 包含带 id 的 `.xui-dialog-title` 与可选 description；兄弟按钮采用 `type="button" class="xui-button xui-dialog-close" data-variant="ghost" data-icon="true" data-xui-close aria-label="关闭设置"`，内部 SVG 为 aria-hidden。仍由一个 createDialogController/createSheetController 处理关闭、Escape、取消和回焦点。普通 Footer 按钮只保留 data-xui-close，不添加 xui-dialog-close。

旧消费者迁移：删除尾部游离 X，改用 Header 的默认 CloseButton；或把原 X 的 Dialog.Close 改为 Dialog.CloseButton（二选一），不能两个一起保留。库不能从普通 Close 推断它是图标还是合法 footer Cancel，因此升级版本本身不会自动重新定位旧的游离 X。删除消费方通用定位/裁切补丁，业务草稿、onOpenChange/details.cancel、提交和权限继续归宿主；产品接入需核对真实消费版本与页面。

回归入口：`tests/browser/focus-boundaries.spec.mjs` 使用正式打包 React/native 消费者，覆盖 Dialog、Sheet、Card/ScrollArea、嵌套卡片、双列/窄列、首末控件、invalid+focus、light/dark/system、390px 与 200% 根字体、独立 CloseButton、键盘关闭/回焦点。源码结构测试不替代真实浏览器几何和截图验收。

原生 Dialog 的 `syncOpen` 同步宿主已确认的受控状态，不受最初注册 trigger 的 disabled 状态限制；同一个弹窗可能由另一项已授权动作打开（例如原 trigger 已禁用时，由另一个已授权入口打开）。trigger 点击和 `open()` 请求仍拒绝 disabled，不能把 `syncOpen` 当未授权的用户请求入口。

长风险说明放在 `Dialog.Body` 内的 `Dialog.Description`（原生仍是带唯一id的 `.xui-dialog-description`），使说明与表单共用一个滚动owner；Dialog 的 aria-describedby 仍指向该完整原文。短介绍可继续位于Header。不能让长说明作为独立固定轨挤掉表单，亦不能只用固定高度裁切正文。正常窗口由 Body 内滚且 Footer 可见；长 Header 或极端短窗口改为整体弹层滚动，Body 恢复自然高，关闭、标题、说明、表单和 Footer 均须可滚动到达。同一时刻只有一个活动滚动 owner，不承诺所有内容同时同屏。无 ResizeObserver 或 SSR 初始状态保留整体滚动；内部测量只切换布局属性，保留 DOM、值和焦点，销毁释放观察器/帧/事件。内部 dialog-layout 不是公开宿主 API；实际验证范围见 [VALIDATION.md](VALIDATION.md)。


## SearchToolbar

公开的「搜索 + 主操作 + 可选高级操作」组合，适用于列表、卡片集合、DataTable.toolbar 或 MenuLayout.pageToolbar。查询、值、筛选、分页、业务动作与 API 请求始终归宿主。它不创建 form、search landmark 或 ARIA toolbar 的方向键模型；内部是普通 group，控件保留正常 Tab 顺序。

### React

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

### 原生

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

### 尺寸、焦点与组合边界

宽屏搜索占剩余宽度，actions 靠右同一行，搜索默认宽度不参与操作组换行判断。工具栏自身窄于 40rem 时搜索单独一行，actions 内可换行。根、槽和控件均可收缩，无横向裁切；统一普通按钮尺寸采用公开 control-height 等 token，传入不同 Button.size 仍在工具栏动作区归一，图标按钮同步。极长标签允许自然增高；同一行按钮 stretch，不承诺所有跨行按钮固定像素高。高级区任意复杂布局继续组合 Grid/Field/Stack，禁止宿主给控件固定超宽尺寸或添加私有 CSS 补丁。

高级内容折叠时保持挂载和值，以 hidden/inert 移出可访问和焦点树；不禁用字段、不清值、不代表退出 form 提交。若业务希望折叠字段不提交，须由领域状态决定。触发器不是 submit，不执行搜索；程序收起焦点仍在高级内容时回触发器，外部焦点不被抢走。

正式独立打包消费者：[React](../examples/search-toolbar-react/app.tsx)、[原生](../examples/search-toolbar-vanilla/app.js)。测试：[结构/原生生命周期](../tests/search-toolbar.test.mjs)、[真实浏览器交互与几何](../tests/browser/search-toolbar.spec.mjs)。浏览器 200% 页面缩放专测通过隔离临时浏览器的设置页选择真实 Page zoom=200%，并断言 DPR 加倍、布局视口减半；根字号增大和 CSS zoom 不冒充真实缩放。实际执行范围见 [VALIDATION.md](VALIDATION.md)。
