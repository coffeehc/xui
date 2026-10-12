# 顶栏相邻控件与语言入口

本轮补齐只影响公共顶栏。完整槽顺序、主题与 i18n 所有权见 [LAYOUT_SLOTS](LAYOUT_SLOTS.md)，默认值来自 [DESIGN](DESIGN.md)。正式消费入口为 React `AppHeader` / `AppShell` / `MenuLayout` 与原生 `createMenuLayout`；普通表单 `NativeSelect` / `.xui-select` 保留输入边界。

## 相邻工具与账号

secondary 的相邻组统一使用 `space-control-gap`。账号仍是 controls 之后的独立语义槽，没有移动 slot、负 margin 或 CSS order。主题按钮和账号 Button 的尺寸、padding、图标以及命中区不改；主组与次组之间仍使用既有区域间距。

以默认根字号16px、36px主题按钮/16px图标、small ghost Button 的10px横padding与1px边框为例：按钮命中框之间的默认间隔从16px变为8px；主题SVG盒右侧10px + 组间8px + 账号左侧11px，得到约29px的可见盒间距。这是该公开组合的几何推导，不是所有账号内容的固定目标，也不是已跑的浏览器像素证据。头像宽度和账号文字由宿主公开内容决定；控件可换行，不能缩小命中区来得到紧凑外观。

## 无常驻边框的语言入口

`HeaderLocaleOptions` 仍由宿主提供 `enabled/value/options/onValueChange/label/disabled`，无需新增样式开关。默认无常驻外框，透明边框保留控件几何；真实 `<select>` 继续提供平台键盘/选择/禁用语义。其 `appearance:none` 只限定顶栏语言入口；库在同一非交互包装内绘制装饰性 SVG chevron，使用 `control-icon-size` / `icon-stroke-width`，不会添加第二个可聚焦目标。

文字起始与箭头末端均留 `space-control-gap`，额外计入透明边框，文字至箭头亦预留相同间距。定位采用逻辑方向，因此 RTL 翻转由公共结构处理。hover 与瞬时 pressed 分别采用 `interaction-hover` / `interaction-pressed`；disabled 保留 muted 背景与前景且不发请求；focus-visible 沿公共独立焦点环，不靠常驻输入边框冒充焦点。所有颜色与动效来自同一主题。

强制颜色模式回退原生箭头并隐藏装饰 SVG，保留平台可访问性。选项弹出面板继续由浏览器/OS管理，不能据此声称 Safari、Firefox、移动 OS 面板与 Chromium 像素一致；这些平台需要实际验证。

## 受控事实与生命周期

两个宿主在请求 `onValueChange` 前先恢复当前已确认值；宿主同步新 `value` 后才显示新事实。相同当前值、禁用控件、禁用选项和非法选项均不发请求。不在 options 中的当前值显示一项禁用空项，避免假装第一项已被选中；后续添加该值对应选项会显示宿主标签，不产生额外请求。

原生低层 `bindHeaderLocaleSelect(select, options)` 返回 `{element, update, destroy}`：

- 挂载 `element`，它包含原 select 与一个装饰 SVG；传入已挂载 select 时会在原位置加包装
- 重复绑定同一存活 select 复用一个 binding 并同步参数；update 保留 select、包装与可用焦点，未变的选项也不替换
- `enabled:false` 使低层 select 禁用；MenuLayout 会直接移除整个语言入口
- destroy 幂等地解除事件并去掉包装/语言专用样式，保留原 select 最后确认的选项、值、名称与禁用事实；旧 handle 的 update/destroy 不影响后续重建
- 布局关闭当前聚焦的语言入口时先回相邻主题按钮，销毁布局不销毁共享主题或 i18n owner

库生成的包装与SVG不要求产品手写或穿透。只给独立原生 binding 挂载点需要使用新增返回的 element；此前直接把已绑定 select 再搬出包装的调用应改为挂载 element。React 与完整 createMenuLayout 自动完成此事。

## 正式消费者与验收

既有 [React消费者](../examples/header-controls-react/app.tsx) / [原生消费者](../examples/header-controls-vanilla/app.js) 增加 `?compact&locale`（small ghost 账号、公共 Avatar、升级状态、语言/主题）、`&long`（长中文账号），React另有 `&direct` 直接消费 AppHeader。两端同时提供普通表单select用于边界隔离，`headerDemo` 只作为合成演示的宿主状态控制。无示例私有 CSS、真实账号或产品API。

[专项单测](../tests/header-locale.test.mjs) 覆盖受控请求、回调重入、unknown/disabled/更新、重复初始化、销毁与旧句柄、React同构结构和CSS范围。[浏览器合同](../tests/browser/header-compact.spec.mjs) 在正式tarball消费者中覆盖三模式×桌面/390px、真实按钮/图标/头像与箭头rect、hover/pressed/focus/disabled、RTL、长账号、200%字号、普通select边界、unknown与取消、关闭/重建与销毁。

本轮本地 Chromium 已确认受运行环境 socket 权限限制，未绕过或再次尝试。此处仅声明已加入可执行验收，不把测试收集、源码断言或几何推导说成新浏览器通过。最终构建/types/单测/tarball结果由集成任务记录；浏览器由同提交 CI 真实执行后确认。未修改产品、发布包或部署。
