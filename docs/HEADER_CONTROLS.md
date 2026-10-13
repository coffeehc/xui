# 顶栏相邻控件与语言入口

本轮补齐只影响公共顶栏。完整槽顺序、主题与 i18n 所有权见 [LAYOUT_SLOTS](LAYOUT_SLOTS.md)，默认值来自 [DESIGN](DESIGN.md)。正式消费入口为 React `AppHeader` / `AppShell` / `MenuLayout` 与原生 `createMenuLayout`；普通表单 `NativeSelect` / `.xui-select` 保留输入边界。

## 相邻工具与账号

secondary 的相邻组统一使用 `space-control-gap`。账号仍是 controls 之后的独立语义槽，没有移动 slot、负 margin 或 CSS order。主题按钮和账号 Button 的尺寸、padding、图标以及命中区不改；主组与次组之间仍使用既有区域间距。

以默认根字号16px、36px主题按钮/16px图标、small ghost Button 的10px横padding与1px边框为例：按钮命中框之间的默认间隔从16px变为8px；主题SVG盒右侧10px + 组间8px + 账号左侧11px，得到约29px的可见盒间距。这是该公开组合的几何推导，不是所有账号内容的固定目标，也不是已跑的浏览器像素证据。头像宽度和账号文字由宿主公开内容决定；控件可换行，不能缩小命中区来得到紧凑外观。

## 统一主题的语言入口与浮层

`HeaderLocaleOptions` 仍由宿主提供 `enabled/value/options/onValueChange/label/disabled`。顶栏现使用可见 button/combobox 与主题 listbox，React 与原生都复用正式 `createHeaderLocaleSelect(document, options)`、`bindSelectControl` 和同一个公共 popover owner，React 在 layout effect 内管理挂载/更新/清理，不为默认 shell 引入另一套选择器 owner。此组合不新增 SSR/hydration 支持承诺。OS 原生菜单不再作为顶栏默认。独立 `NativeSelect` 及显式 `bindHeaderLocaleSelect` 仍保留原生选择器合同，其 OS 面板不能通过 CSS 保证跨平台统一。

入口默认透明边框，hover/pressed/disabled/focus 消费同一语义 token；装饰箭头不成为第二个焦点目标，RTL 使用逻辑方向，强制颜色下仍保留箭头与可见边界。浮层使用公共 overlay 颜色、边界、阴影和选中态；按触发器定位，受可见视口安全边距与可用高度限制，长选项滚动。原生 owner 监听 trigger/浮层 resize、滚动及 visualViewport；不会要求产品修正固定坐标。

键盘支持 Enter/Space、上下/Home/End、文字定位、Escape 关闭回焦点、Tab 离开；禁用项不可选择。点击外部关闭。请求尚未由宿主回传时不显示未确认语言；unknown 当前值保持空显示。关闭入口会将其内部焦点回相邻主题按钮。

## 受控事实与生命周期

两个宿主在请求 `onValueChange` 时保持当前已确认值；宿主同步新 `value` 后才显示新事实。相同当前值、禁用控件、禁用选项和非法选项均不发请求。不在 options 中的当前值显示一项禁用空项，避免假装第一项已被选中；后续添加该值对应选项会显示宿主标签，不产生额外请求。

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

## 品牌区域与内容对齐

AppHeader 的内容顺序是 leading/brand → navigation toggle → breadcrumb/context。leading 保留平台安全区位置。MenuLayout/AppShell 桌面身份区域使用与侧栏相同的宽度 token，计入公共间距后使 toggle 左边对齐正文内容起点；collapsed 自动跟随 rail 宽度，窄屏恢复自然品牌布局与同一 drawer 入口。直接 AppHeader 没有侧栏，按内容自然排列。

可选 `HeaderBrand` 以 logo 和 children 提供规范内容；原生使用同名公开结构，业务链接可包在组件外。带 logo 的 compact 品牌名称仅视觉收纳，accessible 名称保留；不带 logo 的任意旧 brand 内容仍按区域截断，库不猜业务 DOM。

```tsx
<MenuLayout headerSlots={{brand:<HeaderBrand logo={<img src="/logo.svg" alt=""/>}>工作台</HeaderBrand>,breadcrumb:<Breadcrumbs/>}} {...navigation}/>
```

```html
<span class="xui-header-brand"><span class="xui-header-brand-logo" aria-hidden="true"><img src="/logo.svg" alt=""></span><span class="xui-header-brand-name">工作台</span></span>
```

原生将此节点传给 headerSlots.brand，无产品宽度/定位 CSS。新增 `header-popup-brand.spec.mjs` 检查真实浮层、受控选择、长列表滚动、品牌/侧栏/正文几何和窄屏 drawer。运行结果以交付 SHA 的 CI 为准；macOS 系统/读屏器/移动 Safari 未由 Chromium 通过替代。
