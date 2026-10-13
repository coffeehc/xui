# DESIGN 合同实现核对

目标是落实现有 DESIGN，不把规范改松来适应代码，也不实施尚未选择的新风格。完整值与依赖继续由 DESIGN 单一生成；结构/运行时例外仍走既有 guard。

## 首批明确偏差

| 条款 | 已确认偏差 | 公共修正 | 验收 |
| --- | --- | --- | --- |
| DESIGN「圆角」：菜单外层xl、项md；token `menu-radius` | floating基础用radius-lg，菜单没有绑定已有menu-radius，改菜单变量不生效 | 仅Menu/ContextMenu/Combobox/Listbox及既有选择popup绑定menu-radius，普通Popover/Tooltip不改为菜单尺寸 | menu-design-contract unit；React/native三明暗模式覆写menu-radius并读取实际computed radius |
| DESIGN Components Dropdown/ContextMenu：menu-min-width | 菜单继承control-height最小宽，短项可低于规范菜单最小宽 | 语义菜单/listbox消费menu-min-width，Select同时保留trigger锚点最小宽 | 覆写menu-min-width验证实际最小宽；原菜单键盘/子菜单/选中与关层回焦点回归 |
| DESIGN Table/DataTable文字角色：header body-xs/500，cell body-sm | 表头只定义字重、字号继承正文；表格正文也依赖宿主继承 | 显式绑定表格body-sm和表头body-xs的字号、行高、字重与字体变量 | 两端三模式默认值及独立覆盖头/正文token的真实计算样式 |
| DESIGN菜单/导航规范样例：menu-item-focus-color | 已公开焦点token没有消费，组件仅取interaction-focus | menu/nav focus-visible只覆盖outline-color，保留全局焦点宽度/offset与键盘语义 | 实际键盘focus-visible+token覆写，不隐藏禁用或焦点 |
| 同条款：禁用项不可表现为可用操作 | hover/highlight不排除禁用；pressed只排除data-disabled，原生disabled/aria-disabled仍可能变按下底色 | hover和pressed统一排除disabled/data-disabled/aria-disabled，不隐藏条目、不改导航/focus owner | 三种公开禁用表示真实hover+mousedown绘制不变，执行计数仍0；保留Escape回触发器 |

所有更改只消费现有变量，无新颜色、尺寸或风格值。列表锚点宽由原定位owner提供，不新增CSS回退值绕过设计值guard。覆盖测试的任意变量值是隔离测试输入，不进入默认主题。

## 证据边界

本批本地build/types/497unit已通过，正式tarball消费者与安全CI按对应提交记录。浏览器测试共18项新矩阵，并合并现有context-submenu/foundation-contract回归。未运行的用例不写通过；实际截图/计算样式/输入行为需从该提交CI取证。

上一布局里程碑c6e4778为494unit、81Auth视觉、410focused、1094完整浏览器通过。后续同形12行五固定列、caption/分页的24项用例用于进一步匹配用户反馈；不把当前全固定宽度合同暗改成默认铺满。

首轮1eba74e安全CI：497unit、81Auth、463/466focused通过；三个React菜单用例错误假定Shift+F10后直接聚焦首项。真实trace/截图及BaseUI实现显示初始focus进入menu容器，随后Home定位首项。回归现保留Shift+F10→菜单内focus→真实Home→首项focus/变量颜色→禁用交互→Escape回焦点，未手工focus条目或移除键盘断言。24项同形表格与6项表格文字变量矩阵全部通过；完整browser因前置失败未运行。

## 第二批实际状态与布局偏差

- a903a18 安全浏览器的24项独立回归确认：workspace正文scrollport裁掉首/中/末输入的左右outline及首顶/末底；ToggleGroup选中后hover被通用Button悬停色覆盖。对应DESIGN焦点四边可见与H不覆盖S条款。原测试全部保留。workspace复用现有focus-width+focus-offset四边padding/scroll-padding/scroll-margin，不取消overflow所有权；Toggle选中选择器优先级覆盖通用hover，同时排除所有禁用表示。
- DESIGN Table动作间距table-action-gap已有默认4px，内置APIKey两端此前按钮直接邻接。现有Stack/Toolbar分别绑定通用内容/工具条gap，无法表达该独立语义，新增薄TableActions及原生xui-table-actions，只管可换行布局，不接业务动作、写入权限、回执。两个内置APIKey采用同容器。正式测试覆盖默认gap、变量覆盖、长标签换行、Tab焦点四边及窄屏无水平溢出。
- LAYOUT_SLOTS/PUBLIC_API过期Tab顺序修为leading→brand→navigation→breadcrumb，与现有已批准实现一致。

此批通过情况以对应提交的build/types/unit、独立tarball消费者及实际安全CI为准，不将修复前红灯算通过。
