---
name: Product Family UI Contract
description: Portable semantic variables, default theme, component states and content-first information architecture.
colors:
  primary: "#326c62"
  on-primary: "#ffffff"
  primary-dark: "#88bab0"
  on-primary-dark: "#14231f"
  foreground: "#2d3431"
  foreground-dark: "#edf0e9"
  muted-foreground: "#666862"
  muted-foreground-dark: "#aab5ac"
  background: "#faf9f6"
  background-dark: "#171c1a"
  canvas: "#f4f2ed"
  canvas-dark: "#171c1a"
  shell: "#faf9f6"
  shell-dark: "#202824"
  surface: "#f7f5f1"
  surface-dark: "#242d28"
  support: "#eceae4"
  support-dark: "#28352f"
  raised: "#fffefb"
  raised-dark: "#2b352f"
  overlay: "#fffefb"
  overlay-dark: "#303b34"
  muted: "#eeece6"
  muted-dark: "#2b332e"
  separator: "#deded5"
  separator-dark: "#364139"
  surface-line: "#d6d9d1"
  surface-line-dark: "#3b4840"
  surface-line-strong: "#a7b4aa"
  surface-line-strong-dark: "#637468"
  input-line: "#a3afa5"
  input-line-dark: "#687c70"
  selected: "color-mix(in oklab, #326c62 9%, #fffefb)"
  selected-dark: "color-mix(in oklab, #88bab0 13%, #242d28)"
typography:
  caption:
    fontFamily: Inter Variable
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.125rem
  body-xs:
    fontFamily: Inter Variable
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter Variable
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.375rem
  section-title:
    fontFamily: Inter Variable
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.625rem
  secondary-value:
    fontFamily: Inter Variable
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.75rem
  page-title:
    fontFamily: Inter Variable
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.75rem
  metric:
    fontFamily: JetBrains Mono Variable
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.75rem
rounded:
  sm: 0.3rem
  md: 0.4rem
  lg: 0.5rem
  xl: 0.7rem
  2xl: 0.9rem
spacing:
  unit: 0.25rem
  text-gap: 0.25rem
  control-gap: 0.5rem
  content-gap: 0.75rem
  section-gap: 1rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    height: 2.25rem
  button-primary-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary-dark}"
    rounded: "{rounded.lg}"
    height: 2.25rem
  navigation-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.primary}"
  navigation-selected-dark:
    backgroundColor: "{colors.selected-dark}"
    textColor: "{colors.primary-dark}"
  card:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 0.875rem
  card-dark:
    backgroundColor: "{colors.raised-dark}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.lg}"
    padding: 0.875rem
---

## Overview

这是产品界面的完整通用设计契约，供开发者和编码 Agent 直接执行。可将本文件单独提取为任意项目根目录的 DESIGN.md；执行本规范不依赖原仓库路径、实施附录、某个前端框架或业务路由。本文件是唯一权威品牌规范。项目自己的组件映射、文件职责、路由和审计证据另写实施文档，引用本文件，不另立一份完整规范。

当前示例主题为暖灰与青绿：中性表面组织内容，低饱和主色引导操作，标题、留白、一层边界和行分隔表达层级。轻量不等于删除所有区域边界。前言中的颜色是可以替换的主题取值；字体、间距、布局、组件状态及可访问性契约独立于这些颜色。更换主题应集中修改变量和对应前言，核验所有语义角色及浅深对比，不逐页换色。

采用 Overview、Colors、Typography、Layout、Elevation & Depth、Shapes、Components、Do's and Don'ts 八段及可选 YAML token 前言组织。此组织方式不要求安装组件库、外部服务、特定设计工具或格式 CLI。

规范版本：0.6.0。新增兼容语义升次版本，澄清升修订号；删除或改变公共语义须主版本与兼容迁移。采用项目记录规范版本和产品扩展，不必搬迁原技术实现。

### 简单、简洁、灵动、快速

- **简单**：用户路径短、入口清楚、操作归属明确；常用任务少重复步骤，复杂功能按需展开，不减少必要确认、安全或权限。
- **简洁**：主次分明，核心信息优先，少无用装饰、重复标题和常驻名词解释。保留必要分区、边界、标签、错误和关键内容，不缩字体或藏信息制造空旷感。
- **灵动**：每个实际用户操作必须有可感知、与状态变化对应的动效反馈，覆盖鼠标、键盘和触屏；不能只有少量装饰动画。反馈立即开始，不等待动画才执行操作，不抢焦点或造成布局抖动；按操作选择颜色、指示、淡入淡出或小幅按压，不把所有控件做同一种跳动。减少动效是可访问性例外，取消非必要位移/缩放并保留即时状态、颜色和事实反馈，详见Components动效矩阵。
- **快速**：首屏尽早呈现本页核心信息，交互先给真实本地反馈，重型内容按需加载；刷新保留已显示内容和布局位置，避免清空、闪烁或布局跳动。采用项目声明首屏/交互预算并在实际环境测量，不把一张settled截图或加载动画称作性能改善。

以上是设计与验收方向，不默认授权框架迁移、布局重构或性能工程。信息优先、可读性、可访问性和事实准确始终保留。

### 规范强度与职责

- **必须 / MUST**：新增和本次触及代码的验收要求；不能满足时按本文例外流程处理。
- **应当 / SHOULD**：默认遵守；其他方案须说明场景和取舍。
- **可以 / MAY**：允许选择，不要求所有页面采用。

分为三层：通用基础定义语义 token、尺度、状态与可访问性；框架适配负责 CSS 映射及公共控件；产品扩展负责领域状态、内容、画布和图表。适配和产品扩展依赖基础，基础不能依赖业务路由、专属状态或框架 API。不同项目可以各自实现，无须共享一个运行时包。

<!-- external-protocol-boundary:start -->
xui的自定义统一接口合同只约束自有项目的普通业务API。行业标准优先：OAuth2/OIDC/SAML等保留其标准协议；第三方按对方的API、状态码、请求、响应与错误格式对接，由宿主在内部边界做明确adapter转换，不强制第三方返回AjaxResponse，也不要求其改造服务。行业标准/第三方adapter是正常领域边界，不属于等待删除的旧协议兼容层。
<!-- external-protocol-boundary:end -->

业务逻辑拥有权限、请求、执行、校验、保存与错误事实；展示组件只映射真实状态。不得从颜色、类名或 hover 推断业务含义。视觉迁移保留现有功能、信息、品牌标识和页面骨架；布局或业务需求的变更须在其授权范围内评审，不能借样式统一改变数据、聚合、认证或动作时机。

## Colors

### 语义角色与集中来源

实际颜色必须只定义在集中主题 CSS 自定义属性中，提供浅深成对映射。组件、页面、CSS 规则、内联样式、图表配置和状态分支必须消费语义变量或映射类，禁止另写十六进制、rgb、hsl、命名原色、颜色工具类或原始调色板引用。动态业务数据也不能成为注入普通控件颜色的借口。

变量按用途命名，例如 action-primary、layer-overlay、status-warning，而不是按页面或色相命名。可以有集中原始调色板，但只有语义定义引用它。已有兼容名称引用同一语义来源，不持有可分叉的第二份值。主题、控件、业务扩展遵守单向映射。

### 变量分层、默认值和覆盖协议

下面给出完整可用的默认 CSS 变量声明。前言是便于工具读取的关键值摘要，CSS 是完整默认值与依赖关系；两者必须一致。无特殊需求的系统原样采用默认值，不需要建立一套新主题。将本文件原样提取到项目后，产品调整另存集中覆盖 CSS，不修改一份全文分叉标准；家族源统一维护版本，各采用项目记录版本、覆盖项和验证结果。可以统一导入默认 CSS，也可以从同一版本原样提取，不能手改多份默认值。

| 层级 | 名称与用途 | 默认值/依赖及覆盖边界 |
| --- | --- | --- |
| 基础 | palette-* 主题调色板、base-font-*、base-weight-*、base-spacing、base-radius、base-line-* | 暖灰青绿调色板；Inter/Mono回退；400/500/600；4px、8px、1/2px。只供主题编排，不让业务组件直读 |
| 主题配方 | selected-weight/base、状态soft/line权重 | 浅深配方见CSS，合成不透明表面。它们是默认主题内部参数，不是页面API |
| 语义颜色 | action-*、foreground、layer-*、interaction-*、status-*、input、separator/surface-line | 由基础调色板和配方派生，名称不随色相变化；产品优先覆盖这一层 |
| 文字 | font-sans/mono/heading/document、font-weight-body/control/heading、font-size-*、line-height-* | 字体栈别名；400/500/600；七个角色的默认字号/行高。图表轴和图例引用文字角色 |
| 共享尺度 | spacing、space-*、control-height[-xs/-sm/-lg]、control-icon-size[-xs]、radius-*、line-width-*、focus-* | gap4/8/12/16及图文6；高36/24/32/40；图标16/12；圆角4.8/6.4/8/11.2/14.4；线1/1/2；焦点2+2px |
| 层级 | shadow-flat/subtle/surface/raised/overlay、z-shell/sticky/overlay/menu/notice | 普通none、浮层成对阴影；z为10/20/50/70/80。只在公共portal/层级适配中消费 |
| 布局 | layout-content-inset[-narrow]/max、section/toolbar/field-gap、field[-long]-min、header-height、dialog/confirm/drawer-width、viewport-inset | 横20/16px，max none，gap16/8/16，字段240/288，顶栏48，弹层512/384/736，视口边16；是可覆盖默认约束，不强制所有产品同一页面骨架 |
| 动效 | motion-duration[-fast/-enter/-exit]、motion-easing[-exit]、motion-distance-small、motion-press/enter-scale | 150/100/180/120ms，进入/状态与退出曲线，4px、0.98；减少动效为0ms/0px/1，保留即时反馈 |
| 必要组件 | button-*、input-*、card-*、menu-*、nav-*、floating-offset、popover-*、tooltip-max-width、table-*、metric-* | 共用语义和尺度；只有确实需要独立调整的组件参数另设入口，不给每个属性或每页建立变量 |
| 图形 | chart-color-1…6、chart-axis/grid/tooltip-*、chart-*-font-size、chart-line-width[-emphasis]、chart-min-block-size、diagram-* | 默认六序列、语义轴/网格/浮层，轴12/图例13、线2/2.5px、图高默认224；diagram引用选中/文字/边线 |
| 文档 | document-canvas、document-diagram-*、document-chart-1…6 | 独立文档调色板，不引用UI主题色；浅深切换不改变下载图形配色 |

依赖方向是基础→语义→必要组件：例如 base-spacing→spacing→control-height→button-height，palette-primary→action-primary→interaction-focus，action-primary+layer-raised→interaction-selected→menu-item-selected-background。组件只消费语义或组件变量。不得从button反向定义action-primary，不能互相引用形成循环，不能让通用变量依赖领域状态。

根元素data-theme为light或dark时强制对应主题；缺省或system时由CSS跟随系统。产品已有class/原生主题API可在实施层映射这一契约，不要求更换存储格式。主题分支只切换调色板、配方和浮层阴影；产品覆盖置于product-overrides层，因此不被更具体的默认dark选择器覆盖。design-accessibility层在产品覆盖后落实减少动效。普通未分层CSS优先于分层CSS，应避免旧全局声明意外接管规范值。

默认声明和产品覆盖都作用于同一根元素。CSS变量继承的是已求值结果：需要子树主题时，必须在该作用域重新声明相关派生角色，不只覆盖子节点基础值就假定祖先别名全部重算。层叠与求值遵守[CSS变量规范](https://www.w3.org/TR/css-variables-1/#using-variables)和[CSS层叠规范](https://www.w3.org/TR/css-cascade-5/#layer-order)。

### 默认 CSS 变量（可直接提取）

该代码自包含，不依赖框架、不下载字体；字体文件未装载时按完整栈回退。变量不会自动创造组件，实施层仍按Components章节绑定语义、状态和交互。下面仅在变量声明内出现实际色值。所有默认变量均有定义，没有靠未定义变量的fallback假装完整。

<!-- design-default-css:start -->
~~~css
@layer design-defaults, product-overrides, design-accessibility;
@layer design-defaults {
  :root {
    color-scheme: light;
    /* Base: theme swatches and shared scales. Components do not consume these directly. */
    --palette-primary: #326c62;
    --palette-on-primary: #ffffff;
    --palette-secondary: #607367;
    --palette-on-secondary: #2d3431;
    --palette-foreground: #2d3431;
    --palette-muted-foreground: #666862;
    --palette-background: #faf9f6;
    --palette-canvas: #f4f2ed;
    --palette-shell: #faf9f6;
    --palette-surface: #f7f5f1;
    --palette-support: #eceae4;
    --palette-raised: #fffefb;
    --palette-overlay: #fffefb;
    --palette-muted: #eeece6;
    --palette-separator: #deded5;
    --palette-surface-line: #d6d9d1;
    --palette-surface-line-strong: #a7b4aa;
    --palette-input-line: #a3afa5;
    --palette-info: oklch(0.59 0.12 232);
    --palette-info-foreground: oklch(0.4 0.08 232);
    --palette-warning: oklch(0.62 0.14 74);
    --palette-warning-foreground: oklch(0.42 0.08 74);
    --palette-success: oklch(0.54 0.15 151);
    --palette-success-foreground: oklch(0.4 0.13 151);
    --palette-error: oklch(0.577 0.245 27.325);
    --palette-error-foreground: oklch(0.4 0.18 27);
    --palette-error-surface: var(--palette-error);
    --palette-state-base: #ffffff;
    --palette-shadow-ink: #2d3431;
    --base-font-sans: "Inter Variable", Inter, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "WenQuanYi Micro Hei", system-ui, sans-serif;
    --base-font-mono: "JetBrains Mono Variable", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Noto Sans Mono CJK SC", "Source Han Mono SC", "Sarasa Mono SC", "PingFang SC", "Microsoft YaHei", "Courier New", monospace;
    --base-weight-regular: 400;
    --base-weight-medium: 500;
    --base-weight-semibold: 600;
    --base-spacing: 0.25rem;
    --base-radius: 0.5rem;
    --base-line-thin: 1px;
    --base-line-emphasis: 2px;
    --palette-series-1: #2f6bff;
    --palette-series-2: #ff8a00;
    --palette-series-3: #1e2939;
    --palette-series-4: #4ac9ec;
    --palette-series-5: #a696e9;
    --palette-series-6: #00a14c;
    --palette-document-canvas: #ffffff;
    --palette-document-node-fill: #0d3152;
    --palette-document-node-stroke: #315b80;
    --palette-document-node-text: #c9e4ff;
    --palette-document-edge: #315b80;
    --palette-document-caption: #193952;
    --palette-document-series-1: #2f6bff;
    --palette-document-series-2: #ff8a00;
    --palette-document-series-3: #1e2939;
    --palette-document-series-4: #4ac9ec;
    --palette-document-series-5: #a696e9;
    --palette-document-series-6: #00a14c;
    /* Semantic: meaning stays stable when the theme changes. */
    --selected-weight: 9%;
    --selected-base: var(--layer-raised);
    --info-soft-weight: 12%;
    --info-line-weight: 36%;
    --warning-soft-weight: 13%;
    --warning-line-weight: 38%;
    --success-soft-weight: 12%;
    --success-line-weight: 36%;
    --error-soft-weight: 11%;
    --error-line-weight: 36%;
    --action-primary: var(--palette-primary);
    --action-primary-foreground: var(--palette-on-primary);
    --action-secondary: var(--palette-secondary);
    --action-secondary-foreground: var(--palette-on-secondary);
    --foreground: var(--palette-foreground);
    --muted-foreground: var(--palette-muted-foreground);
    --background: var(--palette-background);
    --muted: var(--palette-muted);
    --separator-line: var(--palette-separator);
    --surface-line: var(--palette-surface-line);
    --surface-line-strong: var(--palette-surface-line-strong);
    --input: var(--palette-input-line);
    --layer-canvas: var(--palette-canvas);
    --layer-shell: var(--palette-shell);
    --layer-surface: var(--palette-surface);
    --layer-support: var(--palette-support);
    --layer-raised: var(--palette-raised);
    --layer-overlay: var(--palette-overlay);
    --input-surface: var(--layer-raised);
    --interaction-focus: var(--action-primary);
    --interaction-selected: color-mix(in oklab, var(--action-primary) var(--selected-weight), var(--selected-base));
    --interaction-selected-foreground: var(--action-primary);
    --interaction-hover: var(--muted);
    --interaction-hover-foreground: var(--foreground);
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 16%, var(--layer-raised));
    --focus-width: var(--base-line-emphasis);
    --focus-offset: 2px;
    --status-info: var(--palette-info);
    --status-info-foreground: var(--palette-info-foreground);
    --status-info-soft: color-mix(in oklab, var(--status-info) var(--info-soft-weight), var(--palette-state-base));
    --status-info-line: color-mix(in oklab, var(--status-info) var(--info-line-weight), var(--status-info-soft));
    --status-warning: var(--palette-warning);
    --status-warning-foreground: var(--palette-warning-foreground);
    --status-warning-soft: color-mix(in oklab, var(--status-warning) var(--warning-soft-weight), var(--palette-state-base));
    --status-warning-line: color-mix(in oklab, var(--status-warning) var(--warning-line-weight), var(--status-warning-soft));
    --status-success: var(--palette-success);
    --status-success-foreground: var(--palette-success-foreground);
    --status-success-soft: color-mix(in oklab, var(--status-success) var(--success-soft-weight), var(--palette-state-base));
    --status-success-line: color-mix(in oklab, var(--status-success) var(--success-line-weight), var(--status-success-soft));
    --status-error: var(--palette-error);
    --status-error-foreground: var(--palette-error-foreground);
    --status-error-soft: color-mix(in oklab, var(--palette-error-surface) var(--error-soft-weight), var(--palette-state-base));
    --status-error-line: color-mix(in oklab, var(--status-error) var(--error-line-weight), var(--status-error-soft));
    --action-danger: var(--status-error-foreground);
    --action-danger-foreground: var(--palette-on-primary);
    --font-sans: var(--base-font-sans);
    --font-mono: var(--base-font-mono);
    --font-heading: var(--font-sans);
    --font-document: var(--font-sans);
    --font-weight-body: var(--base-weight-regular);
    --font-weight-control: var(--base-weight-medium);
    --font-weight-heading: var(--base-weight-semibold);
    --font-size-caption: .75rem;
    --line-height-caption: 1.125rem;
    --font-size-body-xs: .8125rem;
    --line-height-body-xs: 1.25rem;
    --font-size-body-sm: .875rem;
    --line-height-body-sm: 1.375rem;
    --font-size-section-title: 1rem;
    --line-height-section-title: 1.625rem;
    --font-size-secondary-value: 1.125rem;
    --line-height-secondary-value: 1.75rem;
    --font-size-page-title: 1.25rem;
    --line-height-page-title: 1.75rem;
    --font-size-metric: 1.5rem;
    --line-height-metric: 1.75rem;
    --spacing: var(--base-spacing);
    --space-text-gap: calc(var(--spacing) * 1);
    --space-control-gap: calc(var(--spacing) * 2);
    --space-content-gap: calc(var(--spacing) * 3);
    --space-section-gap: calc(var(--spacing) * 4);
    --space-icon-gap: calc(var(--spacing) * 1.5);
    --control-height-xs: calc(var(--spacing) * 6);
    --control-height-sm: calc(var(--spacing) * 8);
    --control-height: calc(var(--spacing) * 9);
    --control-height-lg: calc(var(--spacing) * 10);
    --control-icon-size: calc(var(--spacing) * 4);
    --control-icon-size-xs: calc(var(--spacing) * 3);
    --radius-sm: calc(var(--base-radius) * .6);
    --radius-md: calc(var(--base-radius) * .8);
    --radius-lg: calc(var(--base-radius) * 1);
    --radius-xl: calc(var(--base-radius) * 1.4);
    --radius-2xl: calc(var(--base-radius) * 1.8);
    --line-width-separator: var(--base-line-thin);
    --line-width-surface: var(--base-line-thin);
    --line-width-emphasis: var(--base-line-emphasis);
    --shadow-flat: none;
    --shadow-subtle: var(--shadow-flat);
    --shadow-surface: var(--shadow-flat);
    --shadow-raised: var(--shadow-flat);
    --shadow-overlay: 0 8px 20px -6px color-mix(in oklab, var(--palette-shadow-ink) 14%, transparent), 0 28px 64px -20px color-mix(in oklab, var(--palette-shadow-ink) 22%, transparent);
    --motion-duration: 150ms;
    --motion-duration-fast: 100ms;
    --motion-duration-enter: 180ms;
    --motion-duration-exit: 120ms;
    --motion-easing-exit: cubic-bezier(0.4, 0, 1, 1);
    --motion-distance-small: 0.25rem;
    --motion-press-scale: 0.98;
    --motion-enter-scale: 0.98;
    --motion-easing: cubic-bezier(0.2, 0, 0, 1);
    --z-shell: 10;
    --z-sticky: 20;
    --z-overlay: 50;
    --z-menu: 70;
    --z-notice: 80;
    --chart-color-1: var(--palette-series-1);
    --chart-color-2: var(--palette-series-2);
    --chart-color-3: var(--palette-series-3);
    --chart-color-4: var(--palette-series-4);
    --chart-color-5: var(--palette-series-5);
    --chart-color-6: var(--palette-series-6);
    --chart-axis-foreground: var(--muted-foreground);
    --chart-grid-color: var(--separator-line);
    --chart-tooltip-background: var(--layer-overlay);
    --chart-tooltip-foreground: var(--foreground);
    --chart-axis-font-size: var(--font-size-caption);
    --chart-legend-font-size: var(--font-size-body-xs);
    --chart-line-width: 2px;
    --chart-line-width-emphasis: 2.5px;
    --diagram-node-fill: var(--interaction-selected);
    --diagram-node-stroke: var(--surface-line-strong);
    --diagram-node-text: var(--foreground);
    --diagram-edge: var(--muted-foreground);
    --diagram-caption: var(--foreground);
    --document-canvas: var(--palette-document-canvas);
    --document-diagram-node-fill: var(--palette-document-node-fill);
    --document-diagram-node-stroke: var(--palette-document-node-stroke);
    --document-diagram-node-text: var(--palette-document-node-text);
    --document-diagram-edge: var(--palette-document-edge);
    --document-diagram-caption: var(--palette-document-caption);
    --document-chart-1: var(--palette-document-series-1);
    --document-chart-2: var(--palette-document-series-2);
    --document-chart-3: var(--palette-document-series-3);
    --document-chart-4: var(--palette-document-series-4);
    --document-chart-5: var(--palette-document-series-5);
    --document-chart-6: var(--palette-document-series-6);
    /* Layout: default constraints, not a mandatory page skeleton. */
    --layout-content-inset: calc(var(--spacing) * 5);
    --layout-content-inset-narrow: calc(var(--spacing) * 4);
    --layout-content-max: none;
    --layout-section-gap: var(--space-section-gap);
    --layout-toolbar-gap: var(--space-control-gap);
    --layout-field-gap: var(--space-section-gap);
    --layout-field-min: 15rem;
    --layout-field-long-min: 18rem;
    --layout-header-height: calc(var(--spacing) * 12);
    --layout-dialog-width: 32rem;
    --layout-confirm-width: 24rem;
    --layout-drawer-width: 46rem;
    --layout-viewport-inset: var(--space-section-gap);
    /* Component: only independent, reusable adjustment points. */
    --button-height: var(--control-height);
    --button-padding-inline: var(--space-content-gap);
    --button-gap: var(--space-icon-gap);
    --button-radius: var(--radius-lg);
    --button-background: var(--action-primary);
    --button-foreground: var(--action-primary-foreground);
    --input-height: var(--control-height);
    --input-radius: var(--radius-lg);
    --input-background: var(--input-surface);
    --input-foreground: var(--foreground);
    --input-border-color: color-mix(in oklab, var(--muted-foreground) 75%, var(--input-background));
    --card-background: var(--layer-raised);
    --card-border-color: var(--surface-line);
    --card-radius: var(--radius-lg);
    --card-padding: calc(var(--spacing) * 3.5);
    --card-padding-small: calc(var(--spacing) * 2.5);
    --menu-min-width: 8rem;
    --menu-item-min-height: calc(var(--spacing) * 7);
    --menu-padding: var(--space-text-gap);
    --menu-radius: var(--radius-xl);
    --floating-offset: var(--space-text-gap);
    --popover-width: 18rem;
    --popover-padding: var(--space-content-gap);
    --tooltip-max-width: 20rem;
    --table-cell-padding: var(--space-control-gap);
    --table-action-gap: var(--space-text-gap);
    --metric-padding: var(--space-content-gap);
    --metric-gap: var(--space-text-gap);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 92%, var(--layer-raised));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --button-disabled-background: var(--muted);
    --button-disabled-foreground: var(--muted-foreground);
    --menu-item-background: transparent;
    --menu-item-foreground: var(--foreground);
    --menu-item-hover-background: var(--interaction-hover);
    --menu-item-hover-foreground: var(--interaction-hover-foreground);
    --menu-item-selected-background: var(--interaction-selected);
    --menu-item-selected-foreground: var(--interaction-selected-foreground);
    --menu-item-focus-color: var(--interaction-focus);
    --menu-item-disabled-foreground: var(--muted-foreground);
    --menu-item-radius: var(--radius-md);
    --menu-item-padding-inline: var(--space-control-gap);
    --menu-item-gap: var(--space-control-gap);
    --chart-min-block-size: 14rem;
    --nav-item-height: var(--control-height);
    --nav-item-gap: var(--space-control-gap);
    --nav-item-radius: var(--radius-md);
    --nav-selected-indicator-color: var(--action-primary);
    --nav-selected-indicator-width: var(--line-width-emphasis);
    --nav-selected-indicator-height: 1rem;
    --nav-selected-indicator-radius: calc(var(--nav-selected-indicator-width) / 2);
    --nav-selected-indicator-inset: var(--space-text-gap);
    --nav-selected-indicator-gap: var(--space-icon-gap);
    --nav-item-padding-inline: calc(var(--nav-selected-indicator-inset) + var(--nav-selected-indicator-width) + var(--nav-selected-indicator-gap));
    --nav-collapsed-item-size: 2.25rem;
    --nav-selected-indicator-inset-collapsed: 2px;
    /* shell-role-tokens:start */
    --nav-sidebar-width: calc(var(--nav-item-height) * 6);
    --nav-sidebar-padding: var(--space-content-gap);
    --nav-collapsed-width: calc(var(--nav-collapsed-item-size) + var(--nav-sidebar-padding) * 2);
    --layout-header-primary-min: var(--layout-field-min);
    /* shell-role-tokens:end */
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --palette-primary: #88bab0;
    --palette-on-primary: #14231f;
    --palette-secondary: #95a99c;
    --palette-on-secondary: #14231f;
    --palette-foreground: #edf0e9;
    --palette-muted-foreground: #aab5ac;
    --palette-background: #171c1a;
    --palette-canvas: #171c1a;
    --palette-shell: #202824;
    --palette-surface: #242d28;
    --palette-support: #28352f;
    --palette-raised: #2b352f;
    --palette-overlay: #303b34;
    --palette-muted: #2b332e;
    --palette-separator: #364139;
    --palette-surface-line: #3b4840;
    --palette-surface-line-strong: #637468;
    --palette-input-line: #687c70;
    --palette-info: oklch(0.75 0.12 230);
    --palette-info-foreground: oklch(0.82 0.1 230);
    --palette-warning: oklch(0.78 0.14 80);
    --palette-warning-foreground: oklch(0.84 0.13 80);
    --palette-success: oklch(0.72 0.14 151);
    --palette-success-foreground: oklch(0.8 0.14 151);
    --palette-error: oklch(0.637 0.237 25.331);
    --palette-error-foreground: oklch(0.76 0.18 28);
    --palette-error-surface: oklch(0.396 0.141 25.723);
    --palette-state-base: #000000;
    --palette-shadow-ink: #000000;
    --selected-weight: 13%;
    --selected-base: var(--layer-surface);
    --info-soft-weight: 20%;
    --info-line-weight: 50%;
    --warning-soft-weight: 20%;
    --warning-line-weight: 52%;
    --success-soft-weight: 18%;
    --success-line-weight: 52%;
    --error-soft-weight: 24%;
    --error-line-weight: 48%;
    --shadow-overlay: 0 8px 20px -6px color-mix(in oklab, var(--palette-shadow-ink) 48%, transparent), 0 30px 72px -22px color-mix(in oklab, var(--palette-shadow-ink) 68%, transparent);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]):not([data-theme="dark"]) {
      color-scheme: dark;
      --palette-primary: #88bab0;
      --palette-on-primary: #14231f;
      --palette-secondary: #95a99c;
      --palette-on-secondary: #14231f;
      --palette-foreground: #edf0e9;
      --palette-muted-foreground: #aab5ac;
      --palette-background: #171c1a;
      --palette-canvas: #171c1a;
      --palette-shell: #202824;
      --palette-surface: #242d28;
      --palette-support: #28352f;
      --palette-raised: #2b352f;
      --palette-overlay: #303b34;
      --palette-muted: #2b332e;
      --palette-separator: #364139;
      --palette-surface-line: #3b4840;
      --palette-surface-line-strong: #637468;
      --palette-input-line: #687c70;
      --palette-info: oklch(0.75 0.12 230);
      --palette-info-foreground: oklch(0.82 0.1 230);
      --palette-warning: oklch(0.78 0.14 80);
      --palette-warning-foreground: oklch(0.84 0.13 80);
      --palette-success: oklch(0.72 0.14 151);
      --palette-success-foreground: oklch(0.8 0.14 151);
      --palette-error: oklch(0.637 0.237 25.331);
      --palette-error-foreground: oklch(0.76 0.18 28);
      --palette-error-surface: oklch(0.396 0.141 25.723);
      --palette-state-base: #000000;
      --palette-shadow-ink: #000000;
      --selected-weight: 13%;
      --selected-base: var(--layer-surface);
      --info-soft-weight: 20%;
      --info-line-weight: 50%;
      --warning-soft-weight: 20%;
      --warning-line-weight: 52%;
      --success-soft-weight: 18%;
      --success-line-weight: 52%;
      --error-soft-weight: 24%;
      --error-line-weight: 48%;
      --shadow-overlay: 0 8px 20px -6px color-mix(in oklab, var(--palette-shadow-ink) 48%, transparent), 0 30px 72px -22px color-mix(in oklab, var(--palette-shadow-ink) 68%, transparent);
    }
  }
}
@layer design-accessibility {
  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration: 0ms;
      --motion-duration-fast: 0ms;
      --motion-duration-enter: 0ms;
      --motion-duration-exit: 0ms;
      --motion-distance-small: 0px;
      --motion-press-scale: 1;
      --motion-enter-scale: 1;
    }
  }
}
~~~
<!-- design-default-css:end -->

### 最小产品覆盖

示例仅为匿名采用系统：改变主要操作及其成对文字、默认按钮高和内容最大宽，其他变量继承。实际值仍只写在集中覆盖CSS；按钮高度只影响按钮，不把所有间距一起放大。固定light/dark和system都显式覆盖，避免某模式悄悄回到默认主色；全局改品牌不改状态含义或文档调色板。

<!-- design-product-css:start -->
~~~css
@layer product-overrides {
  :root[data-product="example"] {
    --action-primary: #1d4ed8;
    --action-primary-foreground: #ffffff;
    --button-height: 2.5rem;
    --layout-content-max: 72rem;
  }
  :root[data-product="example"][data-theme="dark"] {
    --action-primary: #93c5fd;
    --action-primary-foreground: #0f172a;
  }
  @media (prefers-color-scheme: dark) {
    :root[data-product="example"]:not([data-theme="light"]):not([data-theme="dark"]) {
      --action-primary: #93c5fd;
      --action-primary-foreground: #0f172a;
    }
  }
}
~~~
<!-- design-product-css:end -->

若只要不同主色，省略button-height与layout-content-max；若需要更换字体，覆盖font-sans并保留中文/系统回退，font-heading/document自动继承。单个组件独立需求只覆盖相应组件变量，不改全局spacing来间接影响整个系统。覆盖须记录名称、理由、浅深值和受影响控件；不能用产品覆盖删除键盘焦点、错误反馈或必要对比。

尺寸统一采用rem或依赖spacing的calc；边线用px，权重为无单位，颜色/阴影为CSS值，层级为整数。断点是布局适配条件，CSS var不能直接当作media/container查询阈值；不为此定义不可使用的breakpoint变量。400/500/600、所有组件状态名称及业务数据事实不是任意主题参数。变量化的目的是可控继承和复用，不是替代信息架构和交互设计。


完整主题必须覆盖下列角色：

| 角色 | 契约 |
| --- | --- |
| action-primary / action-primary-foreground | 主要操作与成对文字；浅深分别定义 |
| action-secondary | 有限辅助强调，不等同所有次要按钮 |
| foreground / muted-foreground | 正文与次要文字；弱化不等于降低到不可读 |
| layer-canvas / shell / surface / support / raised / overlay | 画布、导航框架、内容、辅助、独立区域、浮层 |
| separator-line / surface-line / surface-line-strong / input | 连续分隔、区域边界、需强调的边界、输入边界 |
| interaction-hover / selected / focus / pressed | 独立语义来源，即使某主题暂时同值也不混为一项 |
| status-success / warning / info / error | 每种状态有前景、soft 表面和 line；不随主色换语义 |
| action-danger / action-danger-foreground | 危险操作成对填充与文字；destructive 是控件变体名称，映射到这对变量，不存在同名 CSS 变量。轻量危险变体使用 status-error-soft / status-error-foreground，不机械混用填充与错误文字 |
| input-surface、shadow 角色 | 输入表面与各层级阴影的集中定义 |
| chart、领域扩展、document | 数据序列、领域表现和独立导出，不能反向成为基础依赖 |

当前主题主要操作浅色为 #326c62/白字，深色为 #88bab0/#14231f 字；canvas 为浅色 #f4f2ed、深色 #171c1a。其余成对取值见前言。普通区域使用中性表面，不把所有卡染成主色。

默认input-border-color以muted-foreground占75%与input-background合成，必要输入边界不直接沿用轻结构线input；浅深默认均须达到3:1。hover不得变回低对比结构线。产品覆盖可换配方，但按实际输入内外相邻表面核验，不以其他文字可读代替边界检查。

### 三模式、持久化与首屏

系统必须支持浅色light、深色dark、跟随系统system三选一，并持久化用户选择。默认选择system；用户选择模式和实际生效主题是不同状态：system在当前系统下生效light或dark，不能将解析结果写回偏好后丢失system。跟随系统读取prefers-color-scheme并实时响应；显式light/dark不被系统变化覆盖。

选择须只接受这三个枚举。未知/过期值按system处理；存储不可用时继续使用当前内存选择，刷新后回到默认system，不阻断页面。系统偏好不可读取时生效light。各采用系统可有自己的存储key和迁移格式，不能因通用规范强制重命名已有数据。主题选择不重载页面、不清空业务缓存/草稿，不改变选中项、输入、任务或请求状态。

下列小脚本示范与默认CSS一致的浏览器初始化和切换；放在可见内容首次绘制前执行，UI选择器调用setMode，读取getMode与getEffectiveMode。CSS负责全组件、浮层、图表及状态的实际值，脚本只管理枚举，不维护JS调色板。存储值仅在本地读取，不进入URL或日志。

<!-- design-theme-js:start -->
~~~js
(() => {
  const root = document.documentElement;
  const storageKey = "ui.theme.mode";
  const valid = new Set(["light", "dark", "system"]);
  let media = null;
  try {
    if (typeof window.matchMedia === "function")
      media = window.matchMedia("(prefers-color-scheme: dark)");
  } catch { /* The system preference can be unavailable. */ }
  let mode = "system";
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (valid.has(stored)) mode = stored;
  } catch { /* Storage can be unavailable; use the default. */ }
  const effective = () => mode === "system"
    ? (media?.matches ? "dark" : "light")
    : mode;
  const apply = () => {
    root.dataset.theme = mode === "system" && !media ? "light" : mode;
    root.dataset.themeEffective = effective();
    window.dispatchEvent(new CustomEvent("design-theme-change", {
      detail: { mode, effective: effective() },
    }));
  };
  apply();
  try {
    if (typeof media?.addEventListener === "function")
      media.addEventListener("change", apply);
    else if (typeof media?.addListener === "function")
      media.addListener(apply);
  } catch { /* Initial selection still works if subscription is unavailable. */ }
  window.designTheme = {
    getMode: () => mode,
    getEffectiveMode: effective,
    setMode(value) {
      mode = valid.has(value) ? value : "system";
      apply();
      try { window.localStorage.setItem(storageKey, mode); } catch {}
    },
  };
})();
~~~
<!-- design-theme-js:end -->

服务端/静态预渲染首次内容与客户端首次树保持一致，不根据不可见的浏览器偏好预猜业务文本。可以由服务端已验证偏好输出一致的主题属性；否则用轻量首屏初始化设置颜色属性，框架首次树复用确定的结构/文本，偏好控件状态在框架允许的时机恢复。主题属性由明确的单一所有者管理，不泛化关闭hydration检查，不把重型业务资源变成主题初始化门控。无法读取偏好时仍有可见、可读的安全默认。

验收必须覆盖三模式首次进入与刷新保持；system浅→深→浅实时变化，显式light/dark在系统变化后不变；未知存储值、拒绝存储和无法读取系统偏好；菜单/弹层/图表/状态全量变量同步、业务状态和输入保留；真实对比度与独立键盘焦点。独立document调色板不跟随UI主题，不因这些切换改变导出图形。


### 主题与交互颜色

必须保留浅色、深色、跟随系统。跟随系统响应 OS 改变，固定主题不被 OS 覆盖。根节点统一初始化与存储，portal 同样继承主题和所采用的尺寸设置；业务页不维护第三套主题。首屏初始化保持轻量，不移入重型业务包、不等待业务资源，不引入主题闪烁。

普通 hover 使用中性底；selected 使用主色浅底与强调前景interaction-selected-foreground，hover 后仍有持续选中反馈。持续选中不另增 border、outline 或 ring；结构边界可以保留。focus-visible 使用 2px 实色环与 2px 表面间隔，在裁切区域采用 inset，失焦即消失。pressed 是瞬时按下反馈，不等于持久 selected。不得降低整块透明度来掩盖对比问题。

普通文字至少 4.5:1，大文字至少 3:1；必要控件、状态边界与焦点至少 3:1。按实际表面、透明合成及相邻颜色检查，不能只计算主色对白底。错误文字有独立可读前景，不直接复用错误填充。状态同时有文字或图标，不仅靠颜色；系统强制颜色模式保留平台可访问性颜色。

### 图形与独立文档导出

Canvas 和必须接受实际颜色的第三方渲染器通过集中解析器读取当前 CSS 变量。主题及根节点变量变化后重新渲染，不能在模块加载时缓存颜色或维护 JS 调色板。普通图表轴、图例和网格消费文字/分隔角色，系列映射由产品扩展负责。

文档导出拥有独立、可集中替换的 document 变量，包括节点填充、边线、节点文字、连线、说明、全部数据序列和需要的画布角色。界面浅深主题不得污染文档配色；图形导出保持透明画布，普通内容可使用明确定义的文档底色。固定文档调色板仍来自 CSS，不能硬编码在导出函数。

必须处理渲染器写入 SVG style、inline fill/stroke、图例、文字和箭头的全部配色，不能只覆盖几项 CSS 变量就宣称独立。必要时从原图源码按完整文档主题重新生成图形；共享全局渲染配置应隔离或串行执行，避免预览、主题切换和下载相互污染。实际图片回归检查图形、文字和透明区域，而非只检查变量赋值或空 SVG；浅深导出应具有相同几何和像素，导出不改变原界面预览。

## Typography

### 字体与文字角色

默认 Sans 为 Inter Variable，使用系统中文 Sans 回退；代码、技术标识及适用数值使用 JetBrains Mono Variable 和系统 Mono 回退。推荐回退覆盖 PingFang SC、Microsoft YaHei、Noto Sans CJK SC；各项目记录实际可用字体，不假定所有环境均加载自定义字体。正文 400，控件/导航/label 500，标题/指标 600。尺寸用 rem，尊重浏览器缩放，不用负字距或缩小文字减轻视觉。

以下按根字号16px给出默认字号/行高；前言与默认CSS一致，不要求采用系统实现用户可切换密度：

| 角色/字号变量 | 默认px | 行高变量 | 用途 |
| --- | --- | --- | --- |
| caption / font-size-caption | 12 | line-height-caption：18px | 次要标识，普通UI文字下限12px |
| body-xs / font-size-body-xs | 13 | line-height-body-xs：20px | 帮助、状态、单位；label500 |
| body-sm / font-size-body-sm | 14 | line-height-body-sm：22px | 正文400，控件/导航500 |
| section-title / font-size-section-title | 16 | line-height-section-title：26px | 区域标题600 |
| secondary-value / font-size-secondary-value | 18 | line-height-secondary-value：28px | 次级数值600 |
| page-title / font-size-page-title | 20 | line-height-page-title：28px | 页面唯一h1，600 |
| metric / font-size-metric | 24 | line-height-metric：28px | 主指标600、tabular-nums |

单位使用 body-xs，不与主值争强调。标题依靠字号、字重与留白，不加装饰色条或双色标记。日期和数字遵循界面 locale，报告遵循其已声明的时区，不能以机器时区改变事实。

### 长文本与领域阅读

明确选择换行、截断或局部滚动；flex/grid 子项允许收缩，避免技术标识挤掉动作。重要截断值须有键盘可达的完整入口，不能仅依赖鼠标 Tooltip。代码和标识使用 Mono，不给所有普通文本套等宽字体。Markdown、代码、公式、知识正文和画布保留领域阅读规则，不机械套普通表单尺寸。

## Layout

### 间距、尺寸与可选密度

通用默认spacing为4px，各系统可以固定采用，不必须提供紧凑/标准/宽松设置。若产品确有密度功能，应作为产品覆盖配置统一调整spacing、文字角色和适用组件，并验证支持的所有档位；不要逐页另补字号/高度。更换或删除已存在的密度功能属于产品变更，须另获授权，不由通用规范默认要求。本节的尺寸密度与下一节的信息密度不同。

以下是默认尺寸，CSS给出全部共享尺度和必要组件依赖：

| 场景 | 标准值 |
| --- | --- |
| 内容横 padding | 容器对应窄视口 <640px 时 16px，其余 20px |
| 同级区域 gap | 16px |
| 密集卡片网格 gap | 8px 或 12px，按现有职责统一 |
| 表单字段 gap | 16px |
| Card padding | 普通 14px、小卡 10px |
| 统计单元/连续行 padding | 12px |
| 标题与描述 / help / error gap | 4px |
| label 与 control | 8px |
| 操作组 / 行动作 gap | 8px / 4px |
| 图标与文字 | 常规 6px 或 8px，按组件尺寸统一 |
| 顶栏 | 48px |
| 普通控件 | 36px |
| 表格 cell padding | 8px |

按钮标准高度 xs24、sm32、default36、lg40px；对应横 padding8/10/12/16px、gap4/6/6/8px。普通图标16px，最小行操作12px；复用同一套图标尺寸和线宽，保留现有库，不混用装饰画布。默认 Checkbox为16×16px、radius-sm；Switch为28×16.6px、拇指14.4px；Tabs 高32px、内部 padding3px；紧凑切换项高28px、gap4px。适配项目可保留语义明确的既有变体，不能每页发明尺寸。

### 首屏信息架构与信息密度

信息密度是任务和信息的优先级，不是字号/间距档位。每页在实现前必须声明：核心用户问题、用于回答它的关键信息、主操作、支持视口及验收样本。不能先堆组件再靠缩小间距让首屏“塞满”。页面标题只说明当前任务，必要状态与主操作归属清楚，避免重复标题。

在声明的支持视口内，首次完成加载后无需滚动页面即可看清核心内容及主操作；检查元素完整可见、文字可读、实际命中，不只检查DOM存在。窄屏可按已声明优先级换行、分组或按需展开次要区域，不能隐藏核心信息、裁切主操作、缩小字体到阅读下限以下或使用截图时特殊缩放伪装通过。

普通注释、名词释义、协议/实现背景不以常驻说明段落占据首屏。放入按需打开的说明、帮助或详情，入口有清楚名称，键盘Enter/Space和触屏点击可用，可关闭并恢复焦点；不能仅有鼠标hover。可访问名称、必要字段标签与及时操作反馈不属于应隐藏的名词注释。错误、风险、验证提示和执行反馈须在相关位置及时可见；高风险操作的必要说明在决策前可读，不能一并收进帮助。

不用无用统计、与任务无关概览、重复标题、装饰性卡片或大块空白把主体推下首屏。统计只有回答本页核心问题时才优先展示。核心事实、状态、主操作应相互关联；不能让一排大数字先占满页面而核心记录不可见。

长列表、完整历史和详细正文可以自然向下延展，不要求全部数据塞进一屏。首屏交付的是关键任务视图，例如筛选/搜索、关键列、初始记录、当前结果状态和主操作；不是所有行。大表格的非关键列可在表内横滚，但必须声明关键列并保证它们可见。滚动所有者明确，局部滚动不得令核心入口或反馈不可达。

实施前记录如下内容，评审后按对应样本验收；这不是固定页面模板：

| 声明项 | 必须给出的信息 |
| --- | --- |
| 核心用户问题 | 用户来本页要判断或完成什么；不能写“展示数据”等空泛目的 |
| 关键内容与主操作 | 具体字段/状态/初始内容及动作名称，明确哪些应在首屏 |
| 支持视口 | 宽×高、平台及缩放条件，含产品实际支持的窄屏；不可只声明超大屏以回避问题 |
| 次要说明入口 | 说明放在哪里、键盘/触屏如何打开和关闭；重要风险为何仍常驻相关位置 |
| 状态样本 | 正常、加载、空、错误及关键长值/风险样本；说明每种状态核心信息如何保留 |
| 证据 | 元素位置/大小、无遮挡与真实点击、截图和结果；超出首屏的非关键详情可延展 |

验收清单：在所有声明视口首次进入/刷新，不滚动截图；核对关键内容和主操作完整可见；真实点击主操作；使用键盘及触屏方式打开说明、关闭并回焦点；触发相关错误/风险反馈；检查长值、空/加载状态与200%缩放可达性。必要的缩放可滚动阅读不等于默认视口首屏失败，但不能用改缩放作为首屏过关手段。未声明核心内容或未验证支持视口，不算完成首屏验收。


### 表单和响应式

表单按自身容器净宽分列，普通每列至少240px、长路径至少288px、gap16px。普通两列需净宽496px、四列1008px；长字段两列592px、四列1200px。不能按整个视口宽度把抽屉字段挤成窄列。标签、控件、帮助、错误依次排列；相邻字段从顶部对齐，普通/invalid 控件顶部差不超过1px，不以帮助文案长度撑偏控件。

工具栏以操作整组换行，标题和长内容可收缩，动作可达；表格在自己容器内横滚，保留业务列。沿产品已定义断点采用侧栏收起、抽屉或局部滚动，不能为了样式一致擅自改导航和工作台结构。宽窄往返必须真实点击入口检查命中，DOM visible 不足以证明未遮挡。

长表单、编辑器和抽屉在所属 body 内滚动，保存/取消仍可达；代码编辑器保留行号、输入、复制、换行和自身滚动。页面不套多层互相争夺滚动的普通 Card。200%缩放下保留操作与内容可达性。

## Elevation & Depth

层级由职责决定，不能只看嵌套深度。独立 Card/Section 使用 raised 中性表面、一层1px surface-line、无投影；嵌入子组可以无框但保留标题/gap/分隔。连续 Item 只画底线，末项无底线；资产卡 footer 有分隔。统计采用独立轻框，或单外框加内部连续线，不能叠两套边界。

表格由表头、行线和不透明条纹组织；条纹与默认底先完成不透明合成，sticky 同步该行 default/偶数/hover/selected/expanded 背景。透明条纹或透明固定列不得让横滚底层文字穿透。普通 hover 不浮起、缩放或平移。

菜单、Popover、Dialog、Drawer 使用不透明 overlay、明确边界和一套浮层阴影。当前默认浅色阴影为 0 8px 20px -6px（ink14%）与 0 28px 64px -20px（ink22%）；深色为 0 8px 20px -6px（black48%）与 0 30px 72px -22px（black68%）。实际阴影色仍来自集中变量。普通 flat/subtle/surface/raised 无投影；不把浮层配方复制到每张卡。

Portal 和叠层由公共浮层适配定义明确角色；不逐页抬 z-index 掩盖遮挡，不以高阴影代替真实区域边界。无法交互的背景保持模态语义。

## Shapes

圆角 sm4.8、md6.4、lg8、xl11.2、2xl14.4px，对应0.3/0.4/0.5/0.7/0.9rem。普通 Card、输入和按钮用lg；菜单外层xl、项md；Dialog/Sheet用2xl。密度和容器尺寸不使圆角任意增长。

头像、Switch、状态点、Logo保持语义形状。普通元数据不一律做带框胶囊，有限可交互筛选 chip 可以使用小圆角。画布几何和原生平台形状是有记录的领域适配，不能被复制到普通控件。

## Components

### 公共复用与状态矩阵

优先复用已有公共组件及声明变体。页面负责布局组合，控件负责尺寸/颜色/状态；不再写同名按钮或输入皮肤。公共展示组件不请求 API、不判断业务权限。

| 状态 | 必须呈现的语义 |
| --- | --- |
| default | 明确文字、边界和可操作性；动作不只在 hover 后出现 |
| hover | 指针反馈，不伪造焦点或持久选中 |
| pressed | 瞬时按下反馈，松开恢复 |
| focus-visible | 键盘可见，失焦移除，与 selected/invalid 共存 |
| selected / checked / expanded | 根据真实状态持续反馈，hover 后仍保留 |
| disabled | 不可执行，有可读反馈；与 selected 同时存在也不能激活 |
| readOnly | 保留查看、选择、复制，不自动当作 disabled |
| invalid / error | 保留真实错误，文字和关联 ARIA；focus+invalid 同时可见 |
| loading / busy | 可理解文案及已有等待反馈，不自动改变请求和防重策略 |
| empty / no results | 区分空集合、无搜索结果、未知和错误，给所属恢复入口 |

逐组件判断适用状态，不适用不是漏实现。被动展示卡不增加 hover、按钮、焦点或禁用语义；交互卡才有对应反馈。回归组合至少包括 selected+hover、selected+focus、disabled+selected、focus+invalid、busy+disabled。

### 组件尺寸与职责

数值按通用默认尺寸；高度和间距从共享尺度或组件变量计算，字号遵循 Typography：

| 组件 | 表面、尺寸与用途 | 状态、行为和验收 |
| --- | --- | --- |
| Button / 图标按钮 | default36、sm32、xs24、lg40px；padding12/10/8/16、gap6/6/4/8；radius-lg。主动作primary，次动作outline或中性secondary，重复行操作ghost，危险动作destructive | default/hover/pressed/focus/disabled/busy/error；只有真实切换才selected。Enter/Space执行，图标有名称；不改变请求、防重、确认。工具栏换行不裁掉动作 |
| Input / Textarea / NativeSelect / 搜索 | 普通36px、小32px；body-sm；raised表面、一层1px边界、radius-lg。label/control/help/error间距8/4/4px | default/hover/focus/disabled/invalid/readOnly；busy由业务拥有。placeholder不代替label，错误用aria-invalid和describedby；只读可复制，native option跟随平台 |
| InputGroup | 只一层边界与focus；内部控件不重复border/ring；addon与清除不覆盖文字 | 外层映射内部真实focus/invalid；浅深检查focus+invalid；输入可收缩 |
| Switch / Checkbox / Toggle / Tabs | 默认Switch28×16.6px；Tabs高32、内padding3、项radius-md；Toggle高28、gap4；其他既有变体记录映射 | checked/selected来自真实状态，Space切换，方向键按控件语义；禁用项不可执行，hover不盖选中底；小屏项目可达 |
| DropdownMenu / ContextMenu | opaque overlay、1px边界、shadow-overlay、radius-xl、padding4；项至少28、body-xs、gap8；min-width128px | default/hover/selected/focus/disabled；业务busy/error不伪装选项。选中有check，危险项有文字；available-height内滚动 |
| Command / Combobox | 搜索复用输入、选项复用菜单角色，不另建选择器皮肤 | 活动项与持久选中分开；搜索输入保持焦点，键盘代理焦点只在键盘阶段存在，鼠标/blur清除；no results与error不同，不更改搜索和防抖 |
| Card / Section / Item | 独立raised、1px边界、radius-lg、padding14（小10），无阴影；内部组none；连续Item只底线 | 被动仅default/busy/error；交互才有hover/selected/focus/disabled，hover不浮起。两主题默认均能辨大区块 |
| Table / DataTable | header body-xs/500、cell body-sm、padding8、1px行线、不透明条纹；动作gap4，宽度容纳全部按钮 | 排序/分页/动作沿原语义；sticky随整行背景，default/条纹/hover/selected/expanded均不透字；局部横滚最左/中/末端与产品支持的尺寸配置检查，不删业务列 |
| Badge / Metadata / Status / Alert | 元数据body-xs普通可读文字；有限筛选chip；状态文字+点/图标；Alert语义soft底与line | 被动不套hover/focus/disabled；交互筛选才有selected等；长值在列内限制并有完整入口，换主色不改状态含义 |
| Dialog / AlertDialog / Drawer / Sheet | opaque overlay+单套shadow；普通Dialog最大512、确认384px，viewport边距≥16，radius-2xl；header section-title/600。复杂详情可保留明确的736px变体 | 焦点限制和恢复，业务取消/确认不变；body内滚footer可达，窄屏抽屉全宽；不普通嵌套dialog/drawer |
| Popover / Tooltip / Calendar | Popover bottom/center、offset4、宽288、padding12、gap16；Tooltip top/center、offset4、最大320、body-xs；Calendar保留日期范围/locale | 辅助Tooltip不承载必要动作或唯一错误；键盘可达，Esc关闭；碰撞、portal主题与日期方向键实测 |
| 统计 / Chart / Progress | label body-xs/muted、value metric/600/tabular、单位body-xs；gap4、padding12。指标轻框或汇总单框+内部线；axis≥12、legend13、line2/2.5px；Tooltip overlay | 被动default/busy/error；hover仅Tooltip，selected仅范围控件，不用disabled假装未知。保留原列数/图高、数据口径，图例可换行 |
| Shell / Sidebar / PageHeader / Toolbar | 顶栏48px；标题page-title/600；导航body-sm；操作gap8、区域gap16 | 控件真实状态，导航selected无额外框、失焦focus消失；宽窄往返入口可点击，不改变信息架构 |

### 逐组件外观与状态映射

变量只提供值，下表同时规定如何使用。尺寸由spacing及control-height/icon-size、radius、文字角色或必要组件变量表达：例如Switch宽calc(spacing×7)、高calc(spacing×4.15)，Tabs内距calc(spacing×0.75)；不为每个常量另建一层变量。D=默认，H=hover，P=pressed，S=持续selected/checked/expanded，F=keyboard focus，X=disabled，B=busy/loading，E=invalid/error。每个组件只实现其适用状态；被动内容不为了凑表增加交互。F与S独立，H不能盖掉S，E与F可同时可见。

| 组件/适用状态 | 默认尺寸和外观 | 状态到变量的映射及交互 |
| --- | --- | --- |
| 垂直导航菜单 D/H/S/F/X；B/E仅所属业务存在时 | 高nav-item-height=36px、gap8、radius6.4；默认透明。内容始终保留12px内距 | D用menu-item-background/foreground；H用menu-item-hover-background/foreground，无位移且无左指示；S用menu-item-selected-background/foreground并显示nav-selected-indicator-*，无四周外框；S+H保持S。F用focus-width/offset和interaction-focus，失焦消失；X文字muted且不可操作，不以hover伪造可用 |
| Dropdown/ContextMenu项 D/H/S/F/X；非选择项S不适用 | overlay+1px边界+shadow-overlay；menu-min-width128、item-min-height28、padding4、项内横8/gap8、radius-md、body-xs | D透明，H轻底不位移；radio/checkbox持久S用menu-item-selected-*和勾选语义，不画导航左竖线。F独立焦点，禁用不执行。方向键/Home/End/子菜单/Esc规则如下；业务B/E/空结果不是普通可执行选项 |
| Button/图标按钮 D/H/P/F/X/B/E；真实切换才S | 高button-height36、padding12、gap6、radius8；背景button-background、文字button-foreground；图标16（xs12） | H用button-hover-background，P用button-pressed-background且松开恢复，适用按压反馈沿下方动效矩阵。F用focus-*；X用button-disabled-*并禁用执行。B保留已有忙碌文案，防重由业务拥有。outline=raised+surface-line；secondary=muted；ghost默认透明、H=interaction-hover；危险用status-error-soft/foreground及原确认 |
| Input/Textarea/搜索 D/H/F/X/E/readOnly；B由业务拥有；S不适用 | input-height36、radius8、input-background/foreground、1px input-border-color；label→control→help→error，8/4/4px | H保持input-border-color的必要对比；F独立focus-*；E的必要控件边界用status-error-foreground，status-error-line只用于有文字/图标伴随的辅助分隔；关联aria-invalid/describedby，E+F均可见。readOnly可选择复制；X不可编辑；loading不自行改请求。placeholder不代替label |
| InputGroup D/H/F/X/E；S/B按内部控件 | 同输入，一层边界和焦点，addon/清除与内容gap8 | 外层映射内部真实focus/invalid，内部不重复border/ring；帮助和错误不撑偏相邻控件，不制造第二层皮肤 |
| Combobox/自定义选择 D/H/S/F/X/B/E | 搜索复用输入、选项复用menu-item-*；弹层popover-width288、padding12 | 持续S与键盘活动项分开，活动项F只在键盘阶段存在。搜索输入保留焦点，方向键/Enter选择；无结果与错误不同，不自动选首项、不改查询防抖；NativeSelect由平台负责面板 |
| Checkbox/Switch/Toggle D/H/S/F/X/E；B仅业务已有 | Checkbox默认16×16px（control-icon-size）、radius-sm、1px input-border-color；Switch宽28/高16.6px、拇指14.4px，圆形轨道；Toggle高28、gap4 | S用action-primary及成对前景或interaction-selected-*，必须有真实checked；H不盖S，F独立，E相关错误可见，X不可切换。Space/方向键遵循角色；不得仅换颜色模拟checked |
| Tabs D/H/S/F/X；B/E归panel，P/S不混同 | 高control-height-sm32、内padding3、项radius-md；label body-sm | 默认透明/中性，H用interaction-hover，S用interaction-selected-*，F用focus-*；无四周选中框，不要求左侧竖线。方向键及panel关联完整，禁用项跳过，不能把panel加载当作tab被禁用 |
| 表格/列表 D/H/S/F/B/E；X属于行控件 | cell padding8、动作gap4，表头body-xs/500、正文body-sm，分隔separator-line；opaque条纹 | H用interaction-hover，S/expanded用interaction-selected背景；sticky与整行不透明底一致。F只归焦点控件/确有键盘行，不给被动行造焦点。B/空/E保留所属状态和恢复入口，排序/分页真实禁用 |
| Card/Section/连续Item | card-background=raised、border-color=surface-line、radius8、padding14/小10，shadow-flat | 被动仅D/B/E，H/P/S/F/X不适用；交互卡才用H/S/F/X。H轻底不浮起，S浅底无额外框，F独立。内部组无重复框，连续Item仅末端分隔 |
| 统计/指标 D/B/E；H/S仅已有tooltip或范围控件 | metric-padding12/gap4，label13/muted，主值24/600/tabular、单位13 | 0/未知/无数据/B/E分开，核心统计才进首屏；不以disabled表达缺数据。范围S沿选择器，tooltip H/F使用overlay；指标本体无按钮hover、焦点或选中 |
| Dialog/Drawer/Sheet D/F/X/B/E；容器H/P/S不适用 | overlay+surface-line+shadow-overlay，radius14.4；宽layout-dialog/confirm/drawer-width512/384/736，边距16 | header/body/footer归属明确，body滚动footer可达；F限制/恢复按模态语义，X/B/E属于内部控件/反馈。取消不自动保存，危险确认保留，不普通嵌套同类模态 |
| Tooltip/Popover/Calendar D/F；H/S/X/B/E按角色 | Tooltip最大320、body-xs；Popover宽288/padding12/gap16；floating-offset4 | 辅助Tooltip不可承载唯一重要错误或必要动作；按需帮助须键盘/触屏可打开关闭。Calendar真实日期S/disabled与方向键/locale保留，定位和回焦点见下文；不要求所有浮层本体有hover |
| Badge/元数据/状态/Alert/通知 | 元数据body-xs普通文字，不泛胶囊；状态用status-*-foreground/soft/line及文字/图标 | 被动D/E，H/S/F/X不适用；可交互筛选chip才有H/S/F/X。错误/风险/必要反馈即时在相关位置可见，不收进普通解释；B有可理解文案，不只转圈 |
| 图表/Progress D/B/E；H/F用于tooltip，S用于范围/确有数据选择 | chart-color-1…6、axis/legend字体12/13、grid=separator、line2/2.5、tooltip=overlay，默认plot224 | 数据系列身份稳定；H/F tooltip显示原值和声明时区，S归范围/真实选择不改变聚合；X不用于未知采样。图例可换行，0/缺样本/B/E不互换，实际PNG另验独立document-* |

未列出的专属编辑器、树、画布或组件变体，必须在采用层补具体尺寸、语义变量、适用状态与交互证据；不把本表称为所有组件及全部业务竞态已穷举。本表定义外观契约，不声明任何采用项目已完成迁移。

### 垂直导航选中指示与收起定位

选中导航使用左侧独立短竖线、浅底和强调文字/图标，不是四周外框。默认指示颜色nav-selected-indicator-color→action-primary，宽2px、高16px、圆角1px，离菜单项左边4px，指示与内容的保留间距6px。文字区域左内距由inset4+width2+gap6=12px计算，所有状态都保留此内距；指示absolute垂直居中，不参与布局，不令选中切换横向跳动。

收起图标导航默认项36×36px、图标16px居中；指示离左边2px、高16px、宽2px，图标左边10px，间隔6px。使用nav-collapsed-item-size和nav-selected-indicator-inset-collapsed，不给选中项增加padding。采用项目若改变项/图标尺寸，必须核对剩余间距，不能压住图标、焦点环或点击区。完整名称保留可访问入口，键盘/触屏可通过明确的展开导航或帮助获得，不只依赖hover。

hover-only不出现指示；selected+hover仍保持指示与选中浅底；keyboard focus独立可见，blur移除焦点而不移除当前项指示。disabled不可激活；若当前项同时disabled，保留当前项归属，弱化文字而不伪造可用。该指示用于垂直导航，不外推为横向Tabs、普通下拉项或表格必须画左竖线。

下面展示与变量一致的样式绑定，采用层仍负责正确导航/菜单角色、键盘、禁用和事件；不是一套完整交互组件库：

<!-- design-component-css:start -->
~~~css
.contract-nav-item, .contract-menu-item {
  position: relative;
  border: 0;
  background: var(--menu-item-background);
  color: var(--menu-item-foreground);
  font: var(--font-weight-control) var(--font-size-body-sm) / var(--line-height-body-sm) var(--font-sans);
}
.contract-nav-item {
  display: inline-flex;
  align-items: center;
  gap: var(--nav-item-gap);
  min-height: var(--nav-item-height);
  padding-inline: var(--nav-item-padding-inline);
  border-radius: var(--nav-item-radius);
  transition: background-color var(--motion-duration) var(--motion-easing), color var(--motion-duration) var(--motion-easing);
}
.contract-menu-item {
  min-height: var(--menu-item-min-height);
  padding-inline: var(--menu-item-padding-inline);
  border-radius: var(--menu-item-radius);
  font-size: var(--font-size-body-xs);
  line-height: var(--line-height-body-xs);
  padding-block: var(--space-text-gap);
}
.contract-nav-item:where(:hover):not(:disabled),
.contract-menu-item:where(:hover):not(:disabled) {
  background: var(--menu-item-hover-background);
  color: var(--menu-item-hover-foreground);
}
.contract-nav-item[aria-current="page"],
.contract-menu-item[aria-checked="true"] {
  background: var(--menu-item-selected-background);
  color: var(--menu-item-selected-foreground);
}
.contract-nav-item::before {
  content: "";
  position: absolute;
  inset-inline-start: var(--nav-selected-indicator-inset);
  top: 50%;
  width: var(--nav-selected-indicator-width);
  height: var(--nav-selected-indicator-height);
  transform: translateY(-50%);
  border-radius: var(--nav-selected-indicator-radius);
  background: var(--nav-selected-indicator-color);
  visibility: hidden;
  pointer-events: none;
}
.contract-nav-item[aria-current="page"]::before { visibility: visible; }
.contract-nav-item[data-collapsed="true"] {
  width: var(--nav-collapsed-item-size);
  height: var(--nav-collapsed-item-size);
  min-height: var(--nav-collapsed-item-size);
  justify-content: center;
  padding: 0;
}
.contract-nav-item[data-collapsed="true"]::before {
  inset-inline-start: var(--nav-selected-indicator-inset-collapsed);
}
.contract-nav-item:focus-visible, .contract-menu-item:focus-visible {
  outline: var(--focus-width) solid var(--menu-item-focus-color);
  outline-offset: var(--focus-offset);
}
.contract-nav-item:disabled, .contract-menu-item:disabled {
  color: var(--menu-item-disabled-foreground);
  cursor: not-allowed;
}
~~~
<!-- design-component-css:end -->


### 每次操作的动效反馈

所有实际用户操作必须有可感知且与真实状态匹配的动效反馈，不能只给少数组件加装饰。鼠标、键盘Enter/Space/方向键和触屏都应得到对应反馈。立即开始本地反馈，业务请求/导航/保存不等待动画完成；异步结果未知时只表达等待，不预演成功。保持焦点、滚动锚点和区域尺寸稳定，不重复抢焦点、不布局抖动、不全页遮罩拖慢刷新。

默认参数：状态过渡motion-duration150ms、按压/输入motion-duration-fast100ms、进入180ms、退出120ms；状态/进入曲线motion-easing=cubic-bezier(0.2,0,0,1)，退出motion-easing-exit=cubic-bezier(0.4,0,1,1)。小幅进入位移上限motion-distance-small4px，按压/进入缩放0.98；只在合适对象中使用，不能全部同时叠加。重复操作可衔接当前过渡，不排队延迟真实动作；不以计时器猜请求完成。

| 用户操作 | 真实状态变化 | 默认反馈动效 | 不允许 |
| --- | --- | --- | --- |
| 按钮按下/释放 | pressed→执行或恢复 | 背景/前景100ms，适用按钮可用press-scale0.98→1；键盘与触屏同样反馈 | hover浮起；等待按压动画后才执行；禁用操作伪装成功 |
| 开关/勾选/选择 | checked/selected改变 | 控件底色与指示150ms，Switch拇指在已有轨道自然过渡；选项浅底及勾选进入 | 只改数据无反馈；把hover当持久选择；改变尺寸令邻居跳动 |
| 垂直导航切换 | 当前入口改变 | 选中浅底/强调文字150ms、左指示显现；已确认新内容可淡入180ms | 指示占据布局；selected+hover丢指示；重置焦点/滚动替代导航语义 |
| Tab/分段切换 | active及关联panel改变 | active底/标记150ms，内容淡入；容器和操作位置稳定 | 所有Tab画左竖线；无授权改变查询时机或聚合 |
| 展开/收起 | expanded改变、内容可见性改变 | 触发图标/状态150ms；内容淡入/淡出，必要高度变化连续且可预期 | 骤然跳动、反复测量造成抖动；隐藏后仍可焦点进入 |
| 弹层打开/关闭 | 打开、关闭与回焦点 | opacity进入180/退出120ms，可选4px或0.98的小幅进入，定位锚点保持 | 进场飞行、全屏缩放、迟延真正打开或多次抢焦点 |
| 输入聚焦/清除/校验 | focus、值、invalid改变 | 焦点/边线/状态颜色100ms；清除后即时更新值与空态；错误即时出现并可轻淡入 | 通过延迟或隐藏错误等动画结束；invalid覆盖焦点 |
| 提交→等待→成功/失败 | 已发起、进行中、事实结果 | 立即busy指示，等待动效仅在真实pending期间；结果文字/图标淡入150ms，尺寸预留 | 动画先宣布成功；只转圈不说明等待；延迟请求或结果可见 |
| 新增/删除 | 已确认新增/删除事实 | 新项淡入180ms；已确认删除项淡出120ms后在稳定锚点下收束一次 | 失败仍演删除；无限占位；邻项反复跳动或丢失焦点 |
| 复制/下载/刷新等短动作 | 开始、完成/失败或更新 | 立即按压/状态反馈，完成/失败提示淡入；刷新保留旧内容，更新区域颜色/内容轻过渡 | 无反馈；整页先清空再重建；以动画掩盖超时或错报完成 |
| 滚动/拖动/调整尺寸 | 位置、范围或尺寸随真实输入改变 | 内容直接跟随输入连续变化，结束状态可轻过渡；直接操控不加延迟 | 平滑动画追不上指针；结束后回弹到错误事实；减少动效取消必要直接操控 |
| 主题选择及按需帮助 | 模式/帮助可见性改变 | 主题颜色150ms；帮助进入/退出沿浮层参数 | 重载页面、清草稿；只能鼠标hover获取必要说明 |

prefers-reduced-motion=reduce是可访问性例外：默认CSS的design-accessibility层将时长设0ms、位移0px、缩放1，保留即时状态/颜色/图标/文案。等待保留静态busy与事实提示，取消非必要循环动效；不能让减少动效变成操作无反馈。关闭/焦点恢复等必要交互照常执行。

验收以实际操作检查反馈立即开始、正确完成/恢复、鼠标/键盘/触屏等价、连续操作不排队、不延迟真实动作、不丢焦点、滚动和核心布局稳定；另测减少动效、异步失败、超时与取消。记录操作覆盖矩阵，不以一个示例按钮代表所有操作均有动效。本条是通用规范要求，不默认授权对采用项目批量重做动画或业务逻辑。

### 下拉与浮层完整交互

1. 原生选择保持浏览器/OS键盘、面板及滚动，不假称全部由CSS控制。自定义选择组合复用公共触发器、输入、列表与浮层。
2. Dropdown默认bottom/start、offset4px；Popover bottom/center、4px；Tooltip top/center、4px；子菜单right/start、0px。使用锚点定位和碰撞避让，不固定页面坐标；叠层遵守公共角色，不逐页加高。
3. 菜单在available-height内纵滚，活动项可滚入视区；长值有完整入口。子菜单关闭不改变父表格滚动，抽屉滚动不让底部操作离屏。
4. Enter/Space打开或执行；方向键移动、Home/End到边界；子菜单左右键进退。Command输入保持搜索焦点，方向键移动活动项、Enter执行；视觉hover不是持久选中。
5. Escape关闭最上层并恢复触发器；特殊checkbox/radio菜单遵守其已有关闭规则。非模态外点和Tab按所属组件语义关闭或移出，不全局添加focus trap。模态Dialog保持焦点限制；触发器移除时回到所属工作区可用入口。
6. disabled不能激活；loading、失败、空结果有文案，不悄悄选首项。关闭不自动保存；选择、校验、异步动作由业务拥有，公共浮层不自行请求。
7. 真实鼠标与键盘验收打开→移动→选择/取消→Esc→回焦点，覆盖portal浅深、底部滚动、窄屏碰撞及反复往返；不用force click跳过遮挡。

### 表单、搜索与反馈

字段按label→control→help→error呈现；帮助不放在控件前撑偏对齐。必填、无效和错误同时有语义标记与文字关联；同一错误只归属一次，不重复警报。复杂编辑器内部滚动，不为了静态截图改变输入、保存和复制。

搜索有名称与清除语义；搜索词、过滤、分页、异步查询属于业务控制器，公共样式不修改防抖、查询和选择时机。分页真实禁用，Tabs保持键盘与关联panel，不以手写div替代语义。

loading保留已显示内容，empty不替代error；失败提供当前区域的已有恢复入口。反馈不造成无限busy或布局跳跃，不以动画表达唯一状态。遵守reduced-motion，普通hover没有装饰位移；异步成功/失败由事实决定。

### 数字、时间与未知事实

标签、数值和单位归属同一单元。真实0、无数据、未报告/未知、加载和错误不可互换，不用默认0补缺字段，不因主题统一重新解释状态。范围、聚合、时区、百分比、字节/速率单位继续由协议和业务owner提供。

缩写有声明基数和精确值入口：例如十进制k/M/G为1000/10^6/10^9，缩放值<10可显示一位小数、否则整数；项目记录适用formatter，不据字母猜kB或KiB。报告横轴与Tooltip同一已声明时区，Tooltip显示原值和时间。缺少字段证据的口径列为待定义，不新增聚合、补采样或猜离线/成功。图例与轴可读，网格用separator，不把领域序列色用于正文。

### 认证、超时与安全恢复的展示边界

认证/权限事实由已有协议拥有；普通403、网络故障和外部服务401不能仅凭错误颜色清空登录。真实失效的统一生命周期独立于语言、偏好和页面加载；清理敏感状态、终止受保护等待并安全返回登录，不重复通知或循环跳转。站内回跳不带凭据；旧请求不能覆盖新登录或新对象。

网络等待有有限截止时间，结束本地busy、保留已显示内容和未提交草稿，给明确恢复入口；客户端超时不表示服务端任务停止。普通HTTP默认预算30秒、上传/下载120秒，需要更长预算显式声明。自动重试仅限已确认无副作用读取，显式次数和退避；不能仅凭GET判断。写入、上传、付费任务和用户输入不因超时自动重放，结果未知先补拉事实或由用户决定。

离开页面取消所属等待，共享请求按对象/登录隔离。WebSocket重连有限退避，耗尽提供人工恢复；短暂连接不能无限重置预算。恢复完整同步后再替换事实，旧连接/迟到包不能完成新请求。这里约束可见状态与前端责任，不授权修改协议、认证规则或后端幂等实现。

### 可访问性

使用真实HTML/组件语义、可访问名称、正确ARIA状态和焦点顺序；装饰图标隐藏，图标按钮有名称。所有关键功能可由键盘执行。Tooltip支持键盘且不承载唯一关键说明；错误用关联文字，不只红边。模态限制焦点，关闭回还；非模态不滥设trap。

文字、必要边界、焦点和各复合状态遵守Colors对比要求。保留disabled、readOnly、错误、帮助、权限反馈和数据完整性。检查200%缩放、长文本、reduced-motion和系统强制颜色；不声称少量截图等于完整读屏或原生平台验收。

## Do's and Don'ts

### CSS归属与来源检查

先调整本规范与集中语义token，再公共控件，最后核对页面组合。布局留在负责布局的组件、领域类留在对应模块；不把全产品类名塞进无职责的大对象。允许局部gap、grid、宽度、换行与领域布局，禁止第二套按钮/输入/菜单皮肤。

禁止业务页覆盖全局主题、原始颜色回流、任意局部文字尺度/阴影、强制删除焦点、泛化!important或长选择器补丁。第三方适配应精确作用于其生成内容，不影响普通控件；变更范围、原因和移除条件可核对，不能整文件忽略。

运行时测量、树深度、滚动、拖动、百分比、虚拟占位、用户尺寸、动效时刻及临时复制/下载节点可使用动态inline；固定颜色、阴影和装饰尺寸不因此获豁免。临时节点必须finally清理，不改变原界面焦点/内容。源码守卫检查真实前端来源及合成违规/合法样例，精确限定已登记适配数量，不以泛白名单让测试通过。

### 首次加载一致性

SSR/预渲染和客户端首次hydration必须给出相同文本与结构；轻量主题/可选尺寸偏好初始化有单一偏好来源，语言偏好在一致的首树后恢复。不能扩大suppressHydrationWarning或用隐藏/门控掩盖差异。样式、settled截图和本地无错不能证明生产hydration根因；诊断只采必要技术信息，不记录凭据或业务正文。

### 新页面、评审与验证

1. 声明核心用户问题、首屏关键内容、主操作、支持视口和次要解释入口；确认公共组件、业务所有者及适用状态。
2. 使用语义token、文字角色、共享尺度与表面配方；新语义先修改规范和映射，组件不发明局部主题。
3. 实现正常/加载/空/错误及适用交互，保留键盘、权限、确认、异步和数据语义。
4. 跑最终代码相关测试、类型检查与构建，补有意义的缺陷回归；源码守卫及token映射检查不能替代真实渲染。
5. 按影响范围做真实浏览器验证；纯文档变更检查内部一致性、引用和事实，不要求重跑未触及代码的构建。保存可复核的证据和限制；合并、推送、部署分别遵守已获授权。

信息架构变更逐页执行Layout的首屏验收清单，核对关键内容、真实操作、按需解释及错误风险反馈；没有实际页面证据不能宣称该页已通过。共享视觉变更覆盖所有受影响路由、宽屏浅色与窄屏深色；代表性组件覆盖浅深、产品实际支持的尺寸配置和system变化。专项至少检查固定列在声明窄视口、导航展开/收起与最左/中/末横滚、条纹/hover/selected/expanded；冷启动与登录刷新；菜单/弹窗键盘和回焦点；窄屏真实命中、长字段/错误对齐、反复交互。导出改动用真实渲染器及真实下载图片覆盖代表图类，验证透明、文字、序列色与主题独立。

证据记录代码SHA、环境/构建、数据来源、视口、主题/所选尺寸配置、步骤、预期/实际、截图/日志及阻塞。只使用合成数据截图，不含真实业务内容、凭据或密钥。测试通过不等于未跑的读屏、触控、全部业务失败竞态或原生平台已通过；问题未复现注明范围，不能宣布未知根因已修复。

评审逐项确认：核心问题/首屏优先/支持视口证据、单一规范和token来源、浅深与system、产品实际支持的尺寸配置、表面职责、所有适用状态与ARIA、键盘/焦点/长内容、业务语义无意外变化、最终证据与规范一致。发现真实缺陷或未验证关键风险时说明阻塞，不用删测试、改验收标准或假绿色掩盖。

### 例外与规范演进

必须条款的例外由设计维护者评审；涉及业务/产品范围另由其负责人确认。实施者不自行宣布永久豁免。用户已明确授权的取舍按其授权执行，不重复索取无必要确认。

例外记录精确文件/选择器/模式/数量、原因、影响、负责模块、批准人和记录、复审事件、到期或移除条件；不使用整页/整文件/整目录无限豁免。动态运行时适配不等于所有静态颜色获批。安全、可访问性和真实证据不能用例外伪造通过。

规范更新先写问题、前后规则、影响角色/组件/页面、迁移顺序、兼容与验证计划，经适当授权后修改实现；同步本文件前言、运行时映射、引用和检查。审计只记事实，不定义另一套品牌值；旧代码是已记录存量，不能成为新增代码复制违规写法的理由。

<!-- foundation-lifecycle:start -->
### 公共应用头部与紧凑导航

应用头部按brand、breadcrumb、status、actions角色组合。菜单开关统一放在顶栏，桌面控制侧栏收起/展开，窄屏控制同一导航抽屉；侧栏顶部不得重复设置开关。公共层统一其按钮尺寸、位置、动效、键盘焦点、可访问名称和aria-expanded/controls，宿主仅传状态与事件，受控请求不能冒充已确认状态。导航入口和品牌/路径为左侧主组，状态和动作在右侧；采用方提供内容、名称、链接语义及实际动作，不在公共库写入产品权限或版本规则。主组保留layout-header-primary-min的合理宽度，窄屏优先完整保留导航入口，品牌与路径各在所属空间省略长文字；链接可聚焦，完整名称保留可访问语义，宿主可提供title或明确详情入口。状态/动作空间不足时整组换到下一行，动作组内部按需换行，不能盖住品牌、互相重叠或令整页横向溢出。不静默隐藏状态或重要动作，不用缩小字体解决空间问题；没有动作时不预留空白占位。旧任意header内容继续支持，迁移后通用排列由公共组合负责。

展开侧栏用nav-sidebar-width，默认216px；内距nav-sidebar-padding，默认两侧各12px。紧凑栏用nav-collapsed-width，等于一份nav-collapsed-item-size加两侧内距，默认60px，36px图标项对称居中；不得多计一份图标项宽度。带独立展开按钮的链接在紧凑栏中把该按钮放在同一项下一行，不用横向加宽整栏。焦点环和短竖线在保留内距内可见；viewport模式侧栏独立滚动，当前项在状态更新后可见；窄屏同一抽屉继续完整显示标签。

导航的当前页选中与键盘焦点相互独立：已有真实菜单焦点优先；没有菜单焦点时，菜单状态更新可把可用当前页设为单一tab停靠点。打开抽屉本身必须保留打开前合法的菜单停靠点，不能由浏览器默认聚焦首项而意外改写它。原生shell/dialog由公共owner在模态建立前确定初始焦点并避免中途首项focusin；无可用菜单项时回退关闭按钮。保留的焦点项在长菜单中应可见；取消回可见入口，宿主已移动到新标题或新模态的焦点不得被旧关闭事件夺走。

侧栏底部是独立于顶栏角色的可选公共内容区域，不内置返回、授权、账号、版本等领域含义。短菜单时底部位于侧栏末端；长菜单使用上方唯一菜单滚动区，底部不覆盖末项。无底部时保留既有滚动合同；有底部时document模式仅侧栏有界并保持正文文档滚动，viewport模式仍使用所属窗口的可用高度。底部内容超出可用侧栏一半时允许自身滚动，以保留菜单和所有动作的可达性，不能裁掉放大文字。底部使用body-xs、space-text-gap/space-control-gap、separator-line与既有按钮状态/motion，禁止消费者额外复制定位和尺寸规则。

紧凑侧栏中的底部不增宽公共60px轨道。有图标/短表示的公开内容部件居中显示该表示，完整文字仅视觉隐藏并保留可访问名称；无紧凑表示时完整文字换行保留，不能静默删除。窄屏同一导航抽屉恢复完整文字。路由、选中和非底部更新不得重建底部或重复绑定回调；响应式与反复抽屉开关复用同一内容节点/状态和已有模态owner。动作的disabled/busy、防重复、权限、导航和状态文案仍由宿主明确提供。

DropdownMenu/ContextMenu及共用菜单项角色显式绑定body-xs字号/行高和font-weight-control，不继承浮层正文body-sm；浮层本身仍保留body-sm。菜单图标通过公开icon部件或xui-menu-icon语义类采用control-icon-size，非收缩并沿用menu-item-gap；只作用于声明的图标及其直接SVG，不把任意嵌套插图强制当图标。label与choice-label显式用body-xs/500，label→control→help→error间距保持8/4/4px；choice-label的文字角色变化不缩小默认控件点击区。错误关联与原输入语义保持。

### 公共登录页布局与主题

公共登录页宽屏采用左右分割：品牌区显示可配置的产品标识、名称和说明，表单区承载标题、输入、状态和操作；窄屏改为品牌在上、表单在下，不造成横向溢出。长品牌文字、配置表单和错误可滚动，主操作保持可达；沿用公共语义表面、边界、字号和间距，不新增页面尺寸档位或业务专属装饰。

登录页不另放主题选择器，直接继承已有本地偏好和单一根主题所有者；没有已保存偏好时默认跟随系统。首屏初始化先于可见内容，三模式及系统变化仍按本规范执行；不因登录页布局迁移更换既有存储 key/格式，也不改变认证会话或凭据。

### 通用加载、主题所有权与构建消费

本节补充兼容的通用验收要求，不改变默认品牌值或业务职责。

公共页面骨架应能组合列表、表单和详情。标题、关键事实与主操作先显示；表格超出窄视口时在已命名的区域内横滚，不能挤掉关键操作。字段负责一个控件的 label/id/help/error；多控件组使用独立分组语义和各自标签，不将一个 id 分配给多个输入。aria-busy 说明工作状态，是否禁用由真实动作规则决定，两者不能机械等同。

主题在同一文档根上只有一个所有者，首屏初始化与应用复用同一模式和持久化来源。受控模式区分所选 mode 与实际 effective；控件只请求变更，由宿主确认和同步。受控模式不隐式读取或写入另一个 storage key，宿主可桥接已有 JSON 并保留其他字段。销毁、重新创建和重复挂载释放旧订阅，不保留旧 owner 的监听。本协议的主题作用域是文档根，子树主题须另行设计和验证。

加载状态至少区分首次加载、已有内容刷新、可用、空结果、失败和显式重试。刷新失败保留旧事实与输入，错误及时可见；换对象 key 不展示旧对象的事实。取消或卸载后拒绝晚到结果，包括不合作的 Abort Promise；替换任务以 generation/key 隔离。请求、鉴权、超时预算、幂等与可重试语义由宿主拥有。不能自动重放写操作。组件渲染异常与 Promise 失败分别处理，重置视图不自动重试业务请求。

关键 CSS 预先构建并随首屏加载；非关键模块可以真正按需 import，并为模块或样式失败提供显式恢复入口。等待与失败期间关键内容和操作仍可读、可用；状态区域避免无必要位移。首屏预算必须统计实际同步初始化、静态依赖和必要 CSS。组件按需消费检查最终输出贡献与压缩字节，不以源文件 imports 或 sideEffects 声明替代证明。

公共产物须能在独立安装中消费正式 exports 和类型，不能暗依赖 monorepo 源码别名或下游扫描依赖目录。框架 peer 保持宿主单实例；原生宿主不加载框架运行时。本地 watch 覆盖规范、样式、控件、类型、初始化脚本、包入口和构建逻辑，失败明确记录，修复后重建；旧产物不能标记为本次成功。参考消费者的体积、受控延迟和布局证据仅证明该消费者，产品采用仍须在真实页面验收。
<!-- foundation-lifecycle:end -->
