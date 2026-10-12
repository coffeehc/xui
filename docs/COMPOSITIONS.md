# 公开弹层与表格组合

完整规则只在[DESIGN](DESIGN.md)；正式exports与types见[PUBLIC_API](PUBLIC_API.md)。本轮补充原子上的组合，不包含业务状态引擎或新默认品牌值。独立tarball消费者为[React](../examples/capabilities-react/app.tsx)/[原生](../examples/capabilities-vanilla/app.js)，两者无需私有页面CSS。

| 能力 | React | 原生公开接入 |
| --- | --- | --- |
| Sheet | /sheet的Sheet.Root/Content/Title/Description/Body/Footer/Close；Content side=start/end/top/bottom | createSheetController(dialog,trigger,{side,...DialogOptions})，公开xui-dialog部件结构；controller添加并恢复sheet class/side |
| AlertDialog | /alert-dialog的AlertDialog，延续Base UI AlertDialog Root与dialog parts；Content initialFocus/finalFocus | createAlertDialogController(dialog,trigger,{initialFocus,...DialogOptions})，role=alertdialog，data-xui-cancel为安全初始焦点，否则中性dialog |
| ContextMenu | /context-menu的ContextMenu.Root/Trigger/Content/Item/CheckboxItem/RadioItem等公开peer parts | createContextMenuController(trigger,popup)，public floating/menu class与role；checked/value由宿主更新 |
| Table | Table striped、TableRow selected/expanded；TableExpandedRow colSpan，TableExpandButton expanded/controls/onClick；Cell/HeaderCell sticky=start/end、stickyOffset | 相同xui-table/row/expanded-row类，data-striped/selected/expanded/sticky；语义table、colspan、aria-expanded/controls和展开状态由宿主 |

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
