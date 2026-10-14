# 公开展示、弹层与表格组合

完整规则只在[DESIGN](DESIGN.md)；正式exports与types见[PUBLIC_API](PUBLIC_API.md)。本轮补充原子上的组合，不包含业务状态引擎或新默认品牌值。独立tarball消费者为[React](../examples/capabilities-react/app.tsx)/[原生](../examples/capabilities-vanilla/app.js)，两者无需私有页面CSS。

| 能力 | React | 原生公开接入 |
| --- | --- | --- |
| Sheet | /sheet的Sheet.Root/Content/Title/Description/Body/Footer/Close；Content side=start/end/top/bottom | createSheetController(dialog,trigger,{side,...DialogOptions})，公开xui-dialog部件结构；controller添加并恢复sheet class/side |
| AlertDialog | /alert-dialog的AlertDialog，延续Base UI AlertDialog Root与dialog parts；Content initialFocus/finalFocus | createAlertDialogController(dialog,trigger,{initialFocus,...DialogOptions})，role=alertdialog，data-xui-cancel为安全初始焦点，否则中性dialog |
| ContextMenu | /context-menu的ContextMenu.Root/Trigger/Content/Item/CheckboxItem/RadioItem等公开peer parts | createContextMenuController(trigger,popup)，public floating/menu class与role；checked/value由宿主更新 |
| Table | Table striped、TableRow selected/expanded；TableExpandedRow colSpan，TableExpandButton expanded/controls/onClick；Cell/HeaderCell sticky=start/end、stickyOffset | 相同xui-table/row/expanded-row类，data-striped/selected/expanded/sticky；语义table、colspan、aria-expanded/controls和展开状态由宿主 |
| MetricCard | /metric-card 的 MetricCard，复用 Surface；必填 label/value，可选通用 marker slot；不格式化值 | 公开 xui-surface/xui-metric-card 与 dl/header/label/marker/value 结构；无 controller。排列使用已有 xui-grid，见[完整合同与双端示例](METRIC_CARD.md) |

Sheet复用Dialog lifecycle，标题/描述/关闭部件复用同一组件；正文滚动、footer动作保持可见，逻辑side随RTL。AlertDialog复用peer确认角色和取消/焦点，不因关闭而执行业务。嵌套时只有最上层处理取消和Tab，确认逻辑由宿主显式执行；有草稿才打开确认，空草稿直接关闭。trigger若不存在或已移除须给可见finalFocus，不能把父关闭按钮同时作为无条件子确认trigger。

ContextMenu支持鼠标右键、Shift+F10/ContextMenu键、方向键、disabled、检查项保留、外部关闭和Esc回焦点。普通点击Trigger不执行业务。没有声明跨移动OS长按一致；必要操作还须由可点击按钮/菜单访问。React keyboard和popup定位由已安装Base UI peer1.7提供；native复用Popover controller，无额外监听owner。

表格为语义table，条纹排除expanded内容行，hover/selected优先级明确；sticky cell继承所属行的非透明背景，避免滚动穿透。多个同侧sticky列的offset由宿主显式给出，不测量/推断列宽；仅所属TableContainer横向滚动。展开按钮是正常button，不截获行所有点击，也不实现查询、虚拟化、权限、排序或选择引擎。

全部组合使用已有motion token/reduced-motion，动画不延后操作。native controllers的受控syncOpen、details.cancel、destroy与监听释放沿用[IMPLEMENTATION](IMPLEMENTATION.md)；键盘/焦点/长中文/窄屏/200%根字体的实际检查见[验证记录](FOUNDATION_VALIDATION.md)，真实移动OS、读屏器和其他浏览器未验。

Table新增stickyHeader布尔prop，原生table[data-sticky-header=true]相同；表头在所属TableContainer顶端sticky，与列sticky交点提高一层，边界使用现有surface-line。多个表头行/额外上方控件的offset由宿主明确style，不猜高度。行的raised/support底色保持不透明，hover/selected语义色以同色gradient叠在底色上，sticky单元格继承完整底色/图层；允许产品交互色有alpha而不穿透。产品基础layer仍须是可读不透明背景。selected优先hover，条纹/expanded基础层仍保留，无新增默认品牌值或产品color-mix配方。

React ContextMenu.SubmenuTrigger复用公共Menu.Item皮肤，SubmenuRoot/RadioGroup/RadioItem等由同一个Base UI peer处理。原生createSubmenuController(trigger,popup,options)要求trigger位于role=menu父popup，子popup保持父DOM后代；菜单项用公开xui-menu-item，触发器aria-haspopup=menu。左右键按RTL打开/退回，子层独立上下键/Escape，关闭父菜单同步关闭子层；checkbox/radio事实及业务动作仍由宿主提供。必要操作仍给普通可点击入口，未声明移动OS长按合同。

其它新增组合与HTML合同见[WIDGETS](WIDGETS.md)，它们复用既有token、motion、Field/Combobox/按钮，不增加界面密度或业务引擎。

React菜单沿用peer的可聚焦disabled项默认（可读取原因，不能执行）；native菜单方向键跳过disabled。两者都验证禁用不执行与Esc回焦点，不伪称所有键盘停靠点完全相同。

## 菜单文字、图标与字段标签

React Menu.LinkItem透传固定peer的closeOnClick合同，默认false；需要点击后关闭时明确传true，不由本次文字修复更改默认。

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

旧消费者迁移：删除尾部游离 X，改用 Header 的默认 CloseButton；或把原 X 的 Dialog.Close 改为 Dialog.CloseButton（二选一），不能两个一起保留。库不能从普通 Close 推断它是图标还是合法 footer Cancel，因此升级版本本身不会自动重新定位旧的游离 X。删除消费方通用定位/裁切补丁，业务草稿、onOpenChange/details.cancel、提交和权限继续归宿主；本次库修改不代表已修改任何业务仓库。

回归入口：`tests/browser/focus-boundaries.spec.mjs` 使用正式打包 React/native 消费者，覆盖 Dialog、Sheet、Card/ScrollArea、嵌套卡片、双列/窄列、首末控件、invalid+focus、light/dark/system、390px 与 200% 根字体、独立 CloseButton、键盘关闭/回焦点。源码结构测试不替代真实浏览器几何和截图验收。

原生 Dialog 的 `syncOpen` 同步宿主已确认的受控状态，不受最初注册 trigger 的 disabled 状态限制；同一个弹窗可能由另一项已授权动作打开（例如创建被未知写入门禁禁用时，允许打开核对/终止确认）。trigger 点击和 `open()` 请求仍拒绝 disabled，不能把 `syncOpen` 当未授权的用户请求入口。

## 搜索 + 操作 + 高级区域

[SearchToolbar](SEARCH_TOOLBAR.md) 组合 Toolbar/Button/DisclosureIndicator 和原生 disclosure controller，提供 search/actions/advanced 三个同名槽。它可用于已有 pageToolbar 或 DataTable.toolbar（同组筛选只放一处），不另造页面、查询或权限 owner。默认高级区折叠，defaultExpanded/expanded/onExpandedChange 分别表示初始值、受控事实与请求；长内容、窄容器、焦点绘制和 Node/Fragment 稳定更新由库负责。调用方只接公开槽/控件，无需私有 DOM/CSS 修补。

长风险说明放在 `Dialog.Body` 内的 `Dialog.Description`（原生仍是带唯一id的 `.xui-dialog-description`），使说明与表单共用一个滚动owner；Dialog 的 aria-describedby 仍指向该完整原文。短介绍可继续位于Header。不能让长说明作为独立固定轨挤掉表单，亦不能只用固定高度裁切正文。当前长标题/极端短窗口的整体可达边界按 DIALOG_READABILITY_VALIDATION 的真实矩阵验证，不以右上X存在代替正文和Footer可达。
