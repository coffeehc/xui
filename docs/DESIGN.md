---
name: Precision Engineering Console
description: High-signal graphite and cyan engineering console with paired light/dark semantic themes.
colors:
  primary: "#0e7490"
  on-primary: "#ffffff"
  primary-dark: "#06b6d4"
  on-primary-dark: "#090b0e"
  foreground: "#0f172a"
  foreground-dark: "#f1f5f9"
  muted-foreground: "#475569"
  muted-foreground-dark: "#94a3b8"
  background: "#f1f5f9"
  background-dark: "#090b0e"
  canvas: "#f1f5f9"
  canvas-dark: "#090b0e"
  shell: "#e8eef5"
  shell-dark: "#11151c"
  surface: "#f8fafc"
  surface-dark: "#11151c"
  support: "#e2e8f0"
  support-dark: "#0d1016"
  raised: "#ffffff"
  raised-dark: "#11151c"
  overlay: "#ffffff"
  overlay-dark: "#1a2230"
  muted: "#e2e8f0"
  muted-dark: "#161e28"
  separator: "#cbd5e1"
  separator-dark: "#1e2633"
  surface-line: "#cbd5e1"
  surface-line-dark: "#1e2633"
  surface-line-strong: "#64748b"
  surface-line-strong-dark: "#52657e"
  input-line: "#64748b"
  input-line-dark: "#5b708b"
  selected: "color-mix(in oklab, #0e7490 9%, #ffffff)"
  selected-dark: "color-mix(in oklab, #06b6d4 13%, #11151c)"
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
  sm: 0.125rem
  md: 0.25rem
  lg: 0.375rem
  xl: 0.5rem
  2xl: 0.5rem
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
    rounded: "{rounded.md}"
    height: 2.25rem
  button-primary-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary-dark}"
    rounded: "{rounded.md}"
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

这是产品界面的完整通用设计契约，供开发者和编码 Agent 直接执行。执行本规范不依赖某个前端框架或业务路由。本文件是 xui 公共设计原则、默认主题与控件规则的唯一来源；采用项目在自己的 `docs/DESIGN.md` 中引用所采用的版本，记录品牌差异、业务信息和组合设计，不复制另一份公共基线。

当前默认品牌为 Precision Engineering Console：以深石墨背景、冷灰分层表面、青蓝主操作、翠绿成功、琥珀人工介入和红色错误提高信噪比。深色为首次使用基准；浅色是同一色相与语义的冷灰白配对，已有用户的显式偏好继续生效。Inter 负责界面文字，JetBrains Mono 负责代码、技术标识与表格数字；细边界和4px基础控件圆角表达工程精度。颜色、字体、间距、布局、状态及可访问性均由本文件统一定义，更换主题集中调整变量和前言，不逐页换色。

采用 Overview、Colors、Typography、Layout、Elevation & Depth、Shapes、Components、Do's and Don'ts 八段及可选 YAML token 前言组织。此组织方式不要求安装组件库、外部服务、特定设计工具或格式 CLI。

规范版本：1.1.1。新增兼容语义升次版本，澄清升修订号；删除或改变公共语义须主版本与兼容迁移。采用项目记录规范版本和产品扩展，不必搬迁原技术实现。

### React 唯一 UI 与运行时边界

所有消费项目统一使用React，`@coffeehc/xui-react`是唯一持续发展的UI实现。页面、组件、layout、slot、交互状态、焦点与布局机制属于UI层；`@coffeehc/xui-runtime`使用TypeScript构建，新增职责以services和utils为主，包括HTTP、认证、查询/资源生命周期、主题、缩放、下载及ID工具；`@coffeehc/xui-theme`集中提供Token与正式CSS。不得为新增组件再开发无框架DOM副本，也不得把一套原生UI工厂改名为runtime工具继续扩张。共享服务方法直接复用，不另包React版服务owner。

原生DOM UI工厂、控制器、公开入口、示例和专属测试在1.0.0统一移除，不提供第二套UI实现或兼容转发层。runtime保留HTTP/auth/query/theme/scale/download、纯模型/解析器/工具；React内部必要的DOM测量、事件及焦点操作由React包维护。此删除由用户明确授权，属于破坏性升级；旧原生消费者不能直接升级，须使用公开React组件。项目实际迁移与部署结果应由项目自身证据说明，本仓库不代替消费项目宣称完成。

HTML语义元素、React NativeSelect、浏览器/OS控件及HTTP nativeOrigin不属于被删除的原生UI副本；保留label、button/input/select的真实语义和现有服务协议。


### 简单、简洁、灵动、快速

- **简单**：用户路径短、入口清楚、操作归属明确；常用任务少重复步骤，复杂功能按需展开，不减少必要确认、安全或权限。
- **简洁**：主次分明，核心信息优先，少无用装饰、重复标题和常驻名词解释。保留必要分区、边界、标签、错误和关键内容，不缩字体或藏信息制造空旷感。
- **灵动**：每个实际用户操作必须有可感知、与状态变化对应的动效反馈，覆盖鼠标、键盘和触屏；不能只有少量装饰动画。反馈立即开始，不等待动画才执行操作，不抢焦点或造成布局抖动；按操作选择颜色、指示、淡入淡出或小幅按压，不把所有控件做同一种跳动。减少动效是可访问性例外，取消非必要位移/缩放并保留即时状态、颜色和事实反馈，详见Components动效矩阵。
- **快速**：首屏尽早呈现本页核心信息，交互先给真实本地反馈，重型内容按需加载；刷新保留已显示内容和布局位置，避免清空、闪烁或布局跳动。采用项目声明首屏/交互预算并在实际环境测量，不把一张settled截图或加载动画称作性能改善。

以上是设计与验收方向，不默认授权框架迁移、布局重构或性能工程。信息优先、可读性、可访问性和事实准确始终保留。

表现保持克制：以细边线和表面灰度区分层级，避免装饰 glow、厚投影和亮外框；微图标只在帮助识别时出现，反馈表达真实状态，密码强度按已有本地建议合同可视化。UI 正文使用 sans，数值、hash、时间与代码按职责使用 mono/tabular-nums，优先靠字重与对比分层而非扩充字号。同一任务突出一个明确主动作，轻反馈、清楚 focus ring、键盘与 reduced-motion 共存。可复用表单内容与布局壳分开，按需求在独立页、Dialog、Sheet 或宿主步骤中组合；这不新增向导、认证能力、token 或评分事实。

### 规范强度与职责

- **必须 / MUST**：新增和本次触及代码的验收要求；不能满足时按本文例外流程处理。
- **应当 / SHOULD**：默认遵守；其他方案须说明场景和取舍。
- **可以 / MAY**：允许选择，不要求所有页面采用。

分为三层：通用基础定义语义 token、尺度、状态与可访问性；框架适配负责 CSS 映射及公共控件；产品扩展负责领域状态、内容、画布和图表。适配和产品扩展依赖基础，基础不能依赖业务路由、专属状态或框架 API。不同项目可以各自实现，无须共享一个运行时包。

<!-- external-protocol-boundary:start -->
xui公共服务操作按正式wire统一接入：使用BaseService时直接接对应已存在的facade与xui官方client/HTTP adapter；不使用BaseService时由宿主后端在一个facade边界实现同一wire，前端直接调用官方client，不再增加字段、成功语义、认证或重试的兼容转换。范围是认证4项、平台Key6项、业务日志2项和程序错误观察4项，逐项见ADOPTION_CHECKLIST；仅选择业务需要的模块。后端前置缺失时报告未接入，UI范围授权不包含擅自迁移后端。普通领域API、OAuth2/OIDC/SAML和第三方继续遵循自己的协议，typed ResponseAdapter/ErrorResponseAdapter等公开扩展保留用于这些边界、独立展示及测试；不能用它们绕过上述公共服务验收。
<!-- external-protocol-boundary:end -->

业务逻辑拥有权限、请求、执行、校验、保存与错误事实；展示组件只映射真实状态。不得从颜色、类名或 hover 推断业务含义。视觉迁移保留现有功能、信息、品牌标识和页面骨架；布局或业务需求的变更须在其授权范围内评审，不能借样式统一改变数据、聚合、认证或动作时机。

### 项目设计文件与主题的关系

| 来源 | 定义什么 | 项目如何沿用或扩展 |
| --- | --- | --- |
| xui DESIGN | 通用设计方法、公共控件语义、状态、可访问性和默认视觉 | 未声明产品差异时沿用公共基线；已有控件按实际消费版本的公开合同使用 |
| 项目的 `docs/DESIGN.md` | 产品品牌与受众、业务术语、页面任务与信息优先级、私有组合组件及布局约定 | 记录所采用的 xui 版本/SHA 和规范引用，仅补项目差异与领域设计，不分叉整份公共规范 |
| 项目的 `theme.css` | 将产品视觉选择映射为当前版本可识别的变量 | 在规定层覆盖需要调整的值，其余继承公共默认值；不承担信息架构、业务流程或交互状态设计 |

Markdown 没有自动继承或合并机制。采用者和接入技能显式读取公共基线与项目约定，再核对实际组件版本；CSS 变量的默认值与覆盖才由浏览器实际继承。产品可以按公开变量与变体调整品牌、尺度和密度，不能用覆盖移除必要对比、键盘焦点、字段关联、状态语义或 reduced-motion/forced-colors 支持。项目领域约定归项目所有，不反向成为 xui 的全局默认。

## Colors

### 语义角色与集中来源

实际颜色必须只定义在集中主题 CSS 自定义属性中，提供浅深成对映射。组件、页面、CSS 规则、内联样式、图表配置和状态分支必须消费语义变量或映射类，禁止另写十六进制、rgb、hsl、命名原色、颜色工具类或原始调色板引用。动态业务数据也不能成为注入普通控件颜色的借口。

变量按用途命名，例如 action-primary、layer-overlay、status-warning，而不是按页面或色相命名。可以有集中原始调色板，但只有语义定义引用它。已有兼容名称引用同一语义来源，不持有可分叉的第二份值。主题、控件、业务扩展遵守单向映射。

### 变量分层、默认值和覆盖协议

下面给出完整可用的默认 CSS 变量声明。前言是便于工具读取的关键值摘要（无后缀为浅色配对，-dark为深色基准），CSS 是完整默认值与依赖关系；两者必须一致。:root 为深色默认，显式 light 及系统浅色媒体覆盖为浅色配对，显式 system 深色继承根配方。无特殊需求的系统原样采用默认值，不需要建立一套新主题。将本文件原样提取到项目后，产品调整另存集中覆盖 CSS，不修改一份全文分叉标准；家族源统一维护版本，各采用项目记录版本、覆盖项和验证结果。可以统一导入默认 CSS，也可以从同一版本原样提取，不能手改多份默认值。

| 层级 | 名称与用途 | 默认值/依赖及覆盖边界 |
| --- | --- | --- |
| 基础 | palette-* 主题调色板、base-font-*、base-weight-*、base-spacing、base-radius、base-line-* | Precision石墨/青蓝及冷灰白配对；Inter/Mono回退；400/500/600；4px间距/基础圆角、1/2px边线。只供主题编排，不让业务组件直读 |
| 主题配方 | selected-weight/base、状态soft/line权重 | 浅深配方见CSS，合成不透明表面。它们是默认主题内部参数，不是页面API |
| 语义颜色 | action-*、foreground、layer-*、interaction-*、status-*、input、separator/surface-line | 由基础调色板和配方派生，名称不随色相变化；产品优先覆盖这一层 |
| 文字 | font-sans/mono/heading/document、font-weight-body/control/heading、font-size-*、line-height-* | 字体栈别名；400/500/600；七个角色的默认字号/行高。图表轴和图例引用文字角色 |
| 共享尺度 | spacing、space-*、control-height[-xs/-sm/-lg]、control-icon-size[-xs]、radius-*、line-width-*、focus-* | gap4/8/12/16及图文6；高36/24/32/40；图标16/12；圆角2/4/6/8/8；线1/1/2；焦点2+2px |
| 层级 | shadow-flat/subtle/surface/raised/overlay、z-shell/sticky/overlay/menu/notice | 普通none、浮层成对阴影；z为10/20/50/70/80。只在公共portal/层级适配中消费 |
| 布局 | layout-content-inset[-narrow]/max、section/toolbar/field-gap、field[-long]-min、header-height、dialog/confirm/drawer-width、viewport-inset | 横20/16px，max none，gap16/8/16，字段240/288，顶栏48，弹层宽度按40%/30%/60%及各自rem上下限，视口边16；是可覆盖默认约束，不强制所有产品同一页面骨架 |
| 动效 | motion-duration[-fast/-enter/-exit]、motion-easing[-exit]、motion-distance-small、motion-press/enter-scale | 150/100/180/120ms，进入/状态与退出曲线，4px、0.98；减少动效为0ms/0px/1，保留即时反馈 |
| 必要组件 | button-*、input-*、card-*、menu-*、nav-*、floating-offset、popover-*、tooltip-max-width、table-*、metric-* | 共用语义和尺度；只有确实需要独立调整的组件参数另设入口，不给每个属性或每页建立变量 |
| 图形 | chart-color-1…6、chart-axis/grid/tooltip-*、chart-*-font-size、chart-line-width[-emphasis]、chart-min-block-size、diagram-* | 默认六序列、语义轴/网格/浮层，轴12/图例13、线2/2.5px、图高默认224；diagram引用选中/文字/边线 |
| 文档 | document-canvas、document-diagram-*、document-chart-1…6 | 独立文档调色板，不引用UI主题色；浅深切换不改变下载图形配色 |

依赖方向是基础→语义→必要组件：例如 base-spacing→spacing→control-height→button-height，palette-primary→action-primary→interaction-focus，action-primary+layer-raised→interaction-selected→menu-item-selected-background。组件只消费语义或组件变量。不得从button反向定义action-primary，不能互相引用形成循环，不能让通用变量依赖领域状态。

根元素data-theme为light或dark时强制对应主题；缺省为dark，只有显式system由CSS跟随系统。产品已有class/原生主题API可在实施层映射这一契约，不要求更换存储格式。主题分支只切换调色板、配方和浮层阴影；产品覆盖置于product-overrides层，因此不被更具体的默认dark选择器覆盖。design-accessibility层在产品覆盖后落实减少动效。普通未分层CSS优先于分层CSS，应避免旧全局声明意外接管规范值。

默认声明和产品覆盖都作用于同一根元素。CSS变量继承的是已求值结果：需要子树主题时，必须在该作用域重新声明相关派生角色，不只覆盖子节点基础值就假定祖先别名全部重算。层叠与求值遵守[CSS变量规范](https://www.w3.org/TR/css-variables-1/#using-variables)和[CSS层叠规范](https://www.w3.org/TR/css-cascade-5/#layer-order)。

### 三层Token的工程约束

三层是依赖关系，不要求引入 Tailwind、Vue 或第二份调色板。第一层 `palette-* / base-*` 只供主题编排；第二层定义颜色、文字、空间、布局、动效和焦点语义；第三层定义有独立调整需要的组件参数。层内复用必须无环，语义层不能反向依赖某个组件，组件参数不能跳过语义层直接引用调色板。历史名称 `input-surface` 及表格 background/foreground 是第二层语义角色；名称兼容不改变其职责。

默认值只有本文件一份，生成 CSS 后由 React 公共组件消费。`scripts/tokens.mjs` 在生成和检查时验证依赖方向、完整图、浅深/system 配方与来源指纹；设计值守卫检查组件、示例中的原始色值和私造尺度。新增 token 必须说明角色、依赖、覆盖范围及两主题行为，不按每个页面/slot 再造变量。主题 owner 仍负责 sessionStorage 与首屏；组件不各自读 storage 或判断主题。

[Stitch 架构参考](design-sources/stitch-token-architecture.v1.txt)提供三层 Token、自包含组件与视图连续性的方向；实际合同采用本文件已公开名称、尺度、三模式和无障碍规则。参考中的原始色值不替换现有品牌；普通正文不统一 mono，不新增 10/11px 提示角色；密码显隐保留键盘入口、label/错误关联，密码评分沿用公开建议而非安全熵事实。错误可自然增高或使用已有反馈槽，不能绝对定位遮住字段；管理员创建后的认证与导航由真实宿主事实决定，不内置自动登录承诺。

### 默认 CSS 变量（可直接提取）

该代码自包含，不依赖框架、不下载字体；字体文件未装载时按完整栈回退。变量不会自动创造组件，实施层仍按Components章节绑定语义、状态和交互。下面仅在变量声明内出现实际色值。所有默认变量均有定义，没有靠未定义变量的fallback假装完整。

<!-- design-default-css:start -->
~~~css
/* typography-registration:start */
@property --interface-scale { syntax: "<number>"; inherits: true; initial-value: 1; }
@property --font-scale { syntax: "<number>"; inherits: true; initial-value: 1; }
@property --line-height-scale { syntax: "<number>"; inherits: true; initial-value: 1; }
/* typography-registration:end */
@layer design-defaults, product-overrides, design-accessibility;
@layer design-defaults {
  :root {
    color-scheme: dark;
    /* Base: theme swatches and shared scales. Components do not consume these directly. */
    --palette-primary: #06b6d4;
    --palette-on-primary: #090b0e;
    --palette-secondary: #10b981;
    --palette-on-secondary: #090b0e;
    --palette-foreground: #f1f5f9;
    --palette-muted-foreground: #94a3b8;
    --palette-background: #090b0e;
    --palette-canvas: #090b0e;
    --palette-shell: #11151c;
    --palette-surface: #11151c;
    --palette-support: #0d1016;
    --palette-raised: #11151c;
    --palette-overlay: #1a2230;
    --palette-muted: #161e28;
    --palette-separator: #1e2633;
    --palette-surface-line: #1e2633;
    --palette-surface-line-strong: #52657e;
    --palette-input-line: #5b708b;
    --palette-info: #06b6d4;
    --palette-info-foreground: #22d3ee;
    --palette-warning: #f59e0b;
    --palette-warning-foreground: #fbbf24;
    --palette-success: #10b981;
    --palette-success-foreground: #34d399;
    --palette-error: #ef4444;
    --palette-error-foreground: #f87171;
    --palette-error-surface: var(--palette-error);
    --palette-state-base: #11151c;
    --palette-shadow-ink: #000000;
    --palette-input-surface: #0c0f14;
    --palette-on-danger: #090b0e;
    --palette-table-stripe: #131922;
    --base-font-sans: "Inter Variable", Inter, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "WenQuanYi Micro Hei", system-ui, sans-serif;
    --base-font-mono: "JetBrains Mono Variable", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Noto Sans Mono CJK SC", "Source Han Mono SC", "Sarasa Mono SC", "PingFang SC", "Microsoft YaHei", "Courier New", monospace;
    --base-weight-regular: 400;
    --base-weight-medium: 500;
    --base-weight-semibold: 600;
    --base-spacing: 0.25rem;
    --base-radius: 0.25rem;
    --base-line-thin: 1px;
    --base-line-emphasis: 2px;
    --palette-series-1: #06b6d4;
    --palette-series-2: #f59e0b;
    --palette-series-3: #94a3b8;
    --palette-series-4: #38bdf8;
    --palette-series-5: #a78bfa;
    --palette-series-6: #10b981;
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
    --selected-weight: 13%;
    --selected-base: var(--layer-surface);
    --info-soft-weight: 10%;
    --info-line-weight: 30%;
    --warning-soft-weight: 10%;
    --warning-line-weight: 30%;
    --success-soft-weight: 10%;
    --success-line-weight: 30%;
    --error-soft-weight: 10%;
    --error-line-weight: 30%;
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
    --input-surface: var(--palette-input-surface);
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
    --action-danger: var(--status-error);
    --action-danger-foreground: var(--palette-on-danger);
    --font-sans: var(--base-font-sans);
    --font-mono: var(--base-font-mono);
    --font-heading: var(--font-sans);
    --font-document: var(--font-sans);
    --font-weight-body: var(--base-weight-regular);
    --font-weight-control: var(--base-weight-medium);
    --font-weight-heading: var(--base-weight-semibold);
    /* typography-scale:start */
    --font-size-caption: max(.75rem, calc(.75rem * clamp(.5, var(--font-scale), 2)));
    --line-height-caption: max(calc(var(--font-size-caption) * 1.125 / .75), calc(1.125rem * clamp(.5, var(--line-height-scale), 2)));
    --font-size-body-xs: max(.75rem, calc(.8125rem * clamp(.5, var(--font-scale), 2)));
    --line-height-body-xs: max(calc(var(--font-size-body-xs) * 1.25 / .8125), calc(1.25rem * clamp(.5, var(--line-height-scale), 2)));
    --font-size-body-sm: max(.75rem, calc(.875rem * clamp(.5, var(--font-scale), 2)));
    --line-height-body-sm: max(calc(var(--font-size-body-sm) * 1.375 / .875), calc(1.375rem * clamp(.5, var(--line-height-scale), 2)));
    --font-size-section-title: max(.75rem, calc(1rem * clamp(.5, var(--font-scale), 2)));
    --line-height-section-title: max(calc(var(--font-size-section-title) * 1.625 / 1), calc(1.625rem * clamp(.5, var(--line-height-scale), 2)));
    --font-size-secondary-value: max(.75rem, calc(1.125rem * clamp(.5, var(--font-scale), 2)));
    --line-height-secondary-value: max(calc(var(--font-size-secondary-value) * 1.75 / 1.125), calc(1.75rem * clamp(.5, var(--line-height-scale), 2)));
    --font-size-page-title: max(.75rem, calc(1.25rem * clamp(.5, var(--font-scale), 2)));
    --line-height-page-title: max(calc(var(--font-size-page-title) * 1.75 / 1.25), calc(1.75rem * clamp(.5, var(--line-height-scale), 2)));
    --font-size-metric: max(.75rem, calc(1.5rem * clamp(.5, var(--font-scale), 2)));
    --line-height-metric: max(calc(var(--font-size-metric) * 1.75 / 1.5), calc(1.75rem * clamp(.5, var(--line-height-scale), 2)));
    /* typography-scale:end */
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
    --radius-sm: calc(var(--base-radius) * .5);
    --radius-md: var(--base-radius);
    --radius-lg: calc(var(--base-radius) * 1.5);
    --radius-xl: calc(var(--base-radius) * 2);
    --radius-2xl: calc(var(--base-radius) * 2);
    --line-width-separator: var(--base-line-thin);
    --line-width-surface: var(--base-line-thin);
    --line-width-emphasis: var(--base-line-emphasis);
    --shadow-flat: none;
    --shadow-subtle: var(--shadow-flat);
    --shadow-surface: var(--shadow-flat);
    --shadow-raised: var(--shadow-flat);
    --shadow-overlay: 0 8px 24px -4px color-mix(in oklab, var(--palette-shadow-ink) 60%, transparent), 0 0 0 1px var(--surface-line-strong);
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
    --layout-dialog-width: clamp(var(--layout-dialog-min-width), var(--layout-dialog-width-ratio), var(--layout-dialog-max-width));
    --layout-confirm-width: clamp(var(--layout-confirm-min-width), var(--layout-confirm-width-ratio), var(--layout-confirm-max-width));
    --layout-drawer-width: clamp(var(--layout-drawer-min-width), var(--layout-drawer-width-ratio), var(--layout-drawer-max-width));
    --layout-viewport-inset: var(--space-section-gap);
    /* Component: only independent, reusable adjustment points. */
    --button-height: var(--control-height);
    --button-padding-inline: var(--space-content-gap);
    --button-gap: var(--space-icon-gap);
    --button-radius: var(--radius-md);
    --button-background: var(--action-primary);
    --button-foreground: var(--action-primary-foreground);
    --input-height: var(--control-height);
    --input-radius: var(--radius-md);
    --input-background: var(--input-surface);
    --input-foreground: var(--foreground);
    --input-border-color: var(--input);
    --card-background: var(--layer-raised);
    --card-border-color: var(--surface-line);
    --card-radius: var(--radius-lg);
    --card-padding: calc(var(--spacing) * 3.5);
    --card-group-body-min: var(--feedback-slot-block-size);
    --card-group-item-min: var(--layout-field-long-min);
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
    --nav-sidebar-min-width: calc(var(--nav-item-height) * 9);
    --nav-sidebar-max-width: calc(var(--nav-item-height) * 12);
    --nav-sidebar-width: min(clamp(var(--nav-sidebar-min-width), 25vw, var(--nav-sidebar-max-width)), 50vw);
    --nav-row-first-line-height: max(var(--nav-item-height), var(--button-height), calc(var(--line-height-body-sm) + var(--space-text-gap) * 2 + var(--line-width-surface) * 2));
    --card-title-min-inline-size: calc(var(--control-height) * 3);
    --text-overflow-scroll-delay: calc(var(--motion-duration-fast) * 4);
    --text-overflow-scroll-speed: 40;
    --nav-label-scroll-delay: var(--text-overflow-scroll-delay);
    --nav-label-scroll-speed: var(--text-overflow-scroll-speed);
    --nav-row-primary-min-width: calc(var(--nav-item-height) * 3);
    --nav-row-padding-block: calc((var(--nav-row-first-line-height) - var(--line-height-body-sm)) / 2);
    --nav-row-icon-offset: calc((var(--line-height-body-sm) - var(--control-icon-size)) / 2);
    --nav-row-group-offset: calc((var(--nav-row-first-line-height) - var(--line-height-body-xs)) / 2);
    --nav-row-action-offset: calc((var(--nav-row-first-line-height) - max(var(--button-height), calc(var(--line-height-body-sm) + var(--space-text-gap) * 2 + var(--line-width-surface) * 2))) / 2);
    --nav-sidebar-padding: var(--space-content-gap);
    --nav-collapsed-width: calc(var(--nav-collapsed-item-size) + var(--nav-sidebar-padding) * 2);
    --layout-header-primary-min: var(--layout-field-min);
    /* shell-role-tokens:end */
    /* centralized-component-tokens:start */
    --dialog-body-min-block-size: calc(var(--control-height) + (var(--focus-width) + var(--focus-offset)) * 2);
    --button-padding-block-xs: max(0px, calc((var(--control-height-xs) - var(--line-height-body-sm)) / 2 - var(--line-width-surface)));
    --interface-scale: 1;
    --interface-root-font-size: calc(100% * clamp(1, var(--interface-scale), 2));
    --font-scale: 1;
    --line-height-scale: var(--font-scale);
    --radius-full: 50%;
    --icon-stroke-width: 2;
    --nav-icon-stroke-width: 1.5;
    --illustration-icon-size: 1.5rem;
    --nav-sidebar-header-max: 50%;
    --a11y-hidden-size: 1px;
    --a11y-hidden-offset: calc(var(--a11y-hidden-size) * -1);
    --a11y-skip-hidden-offset: -200%;
    /* Forced-color progress roles retain the user-agent system palette. */
    --progress-forced-track: Canvas;
    --progress-forced-border: CanvasText;
    --progress-forced-fill: CanvasText;
    --progress-forced-pending-border-style: dashed;
    --motion-feedback-opacity-start: .5;
    --motion-duration-pulse: calc(var(--motion-duration) * 10);
    --motion-duration-spin: calc(var(--motion-duration) * 8);
    --motion-disclosure-rotation: 180deg;
    --motion-spin-rotation: 1turn;
    --button-padding-inline-sm: calc(var(--spacing) * 2.5);
    --button-danger-hover-background: color-mix(in oklab, var(--action-danger) 92%, var(--foreground));
    --button-danger-pressed-background: color-mix(in oklab, var(--action-danger) 88%, var(--foreground));
    --backdrop-background: color-mix(in oklab, var(--foreground) 24%, transparent);
    --feedback-slot-block-size: calc(var(--control-height) + var(--space-content-gap) * 2 + (var(--focus-width) + var(--focus-offset)) * 2);
    --data-region-min-block-size: calc(var(--control-height) * 8);
    --textarea-min-block-size: calc(var(--input-height) * 2);
    --input-group-control-min-height: calc(var(--input-height) - var(--line-width-surface) * 2);
    --input-group-textarea-min-height: calc(var(--textarea-min-block-size) - var(--line-width-surface) * 2);
    --toggle-height: calc(var(--spacing) * 7);
    --range-thumb-offset: calc((var(--space-control-gap) - var(--control-icon-size)) / 2 - var(--line-width-surface));
    --choice-check-width: calc(var(--spacing) * 1.5);
    --choice-check-height: calc(var(--spacing) * 2.5);
    --choice-check-rotation: 45deg;
    --switch-width: calc(var(--spacing) * 7);
    --switch-height: calc(var(--spacing) * 4.15);
    --switch-thumb-size: calc(var(--spacing) * 3.6);
    --switch-travel: calc(var(--spacing) * 2.9);
    --switch-width-sm: calc(var(--spacing) * 6);
    --switch-height-sm: calc(var(--spacing) * 3.5);
    --switch-thumb-size-sm: calc(var(--spacing) * 3);
    --switch-travel-sm: calc(var(--spacing) * 2.5);
    --switch-width-lg: calc(var(--spacing) * 9);
    --switch-height-lg: calc(var(--spacing) * 5);
    --switch-thumb-size-lg: calc(var(--spacing) * 4.5);
    --switch-travel-lg: calc(var(--spacing) * 4);
    --layout-header-brand-max: 50%;
    --nav-sidebar-footer-max: 50%;
    --nav-sidebar-min-height: calc(var(--nav-item-height) * 4);
    --nav-drawer-max-inline-size: calc(var(--nav-item-height) * 8);
    --nav-toggle-transform-origin: 60% 50%;
    --login-card-padding: calc(var(--space-section-gap) * 1.5);
    --login-form-inline-size: 24rem;
    --login-card-padding-end: var(--space-content-gap);
    --login-heading-gap: var(--space-control-gap);
    --login-heading-fields-gap: var(--space-section-gap);
    --login-control-height: calc(var(--control-height-lg) + var(--space-text-gap));
    --login-group-input-height: calc(var(--login-control-height) - var(--line-width-surface) * 2);
    --login-control-font-size: var(--font-size-body-sm);
    --login-control-line-height: var(--line-height-body-sm);
    --login-card-inline-size: calc(var(--login-form-inline-size) + var(--login-card-padding) * 2 + var(--line-width-surface) * 2);
    --login-visual-max-block-size: calc(var(--control-height-lg) * 2);
    --login-action-max-block-size: max(var(--login-control-height), 20dvh);
    --login-logo-size: var(--control-height-sm);
    --sheet-max-block-size: 80dvh;
    --tabs-padding: calc(var(--spacing) * .75);
    --layout-workspace-content-min-block-size: 0px;
    --data-table-filter-min: 9rem;
    --data-table-min-block-size: calc(var(--control-height) * 4);
    --table-min-inline-size: calc(var(--control-height) * 12);
    --table-primary-min-inline-size: var(--layout-field-min);
    --z-sticky-intersection: calc(var(--z-sticky) + 1);
    --avatar-size-lg: calc(var(--control-height) * 1.5);
    --calendar-max-inline-size: calc(var(--control-height) * 9);
    --layout-scroll-area-height: 10rem;
    --layout-table-viewport-height: 15rem;
    --layout-embedded-shell-height: 30rem;
    --layout-demo-sidebar-width: 10rem;
    --layout-demo-max: 64rem;
    --layout-dialog-width-ratio: 40%;
    --layout-dialog-min-width: 24rem;
    --layout-dialog-max-width: 48rem;
    --layout-confirm-width-ratio: 30%;
    --layout-confirm-min-width: 20rem;
    --layout-confirm-max-width: 32rem;
    --layout-drawer-width-ratio: 60%;
    --layout-drawer-min-width: 24rem;
    --layout-drawer-max-width: 64rem;
    --layout-sheet-block-size: 46rem;
    --table-header-background: var(--layer-support);
    --table-header-foreground: var(--muted-foreground);
    --table-row-background: var(--layer-raised);
    --table-row-stripe-background: var(--palette-table-stripe);
    --table-row-expanded-background: var(--interaction-hover);
    --table-header-min-height: var(--control-height);
    --table-row-min-height: var(--control-height-lg);
    --table-cell-padding-inline: var(--space-content-gap);
    /* centralized-component-tokens:end */
  }
  :root[data-theme="light"] {
    color-scheme: light;
    --palette-primary: #0e7490;
    --palette-on-primary: #ffffff;
    --palette-secondary: #047857;
    --palette-on-secondary: #ffffff;
    --palette-foreground: #0f172a;
    --palette-muted-foreground: #475569;
    --palette-background: #f1f5f9;
    --palette-canvas: #f1f5f9;
    --palette-shell: #e8eef5;
    --palette-surface: #f8fafc;
    --palette-support: #e2e8f0;
    --palette-raised: #ffffff;
    --palette-overlay: #ffffff;
    --palette-muted: #e2e8f0;
    --palette-separator: #cbd5e1;
    --palette-surface-line: #cbd5e1;
    --palette-surface-line-strong: #64748b;
    --palette-input-line: #64748b;
    --palette-info: #0891b2;
    --palette-info-foreground: #155e75;
    --palette-warning: #d97706;
    --palette-warning-foreground: #92400e;
    --palette-success: #059669;
    --palette-success-foreground: #065f46;
    --palette-error: #dc2626;
    --palette-error-foreground: #b91c1c;
    --palette-state-base: #ffffff;
    --palette-shadow-ink: #0f172a;
    --palette-series-1: #0891b2;
    --palette-series-2: #d97706;
    --palette-series-3: #475569;
    --palette-series-4: #0284c7;
    --palette-series-5: #7c3aed;
    --palette-series-6: #059669;
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
    --shadow-overlay: 0 8px 24px -4px color-mix(in oklab, var(--palette-shadow-ink) 18%, transparent), 0 0 0 1px var(--surface-line);
    --palette-input-surface: #ffffff;
    --palette-on-danger: #ffffff;
    --palette-table-stripe: #f8fafc;
  }
  @media (prefers-color-scheme: light) {
    :root[data-theme="system"] {
      color-scheme: light;
      --palette-primary: #0e7490;
      --palette-on-primary: #ffffff;
      --palette-secondary: #047857;
      --palette-on-secondary: #ffffff;
      --palette-foreground: #0f172a;
      --palette-muted-foreground: #475569;
      --palette-background: #f1f5f9;
      --palette-canvas: #f1f5f9;
      --palette-shell: #e8eef5;
      --palette-surface: #f8fafc;
      --palette-support: #e2e8f0;
      --palette-raised: #ffffff;
      --palette-overlay: #ffffff;
      --palette-muted: #e2e8f0;
      --palette-separator: #cbd5e1;
      --palette-surface-line: #cbd5e1;
      --palette-surface-line-strong: #64748b;
      --palette-input-line: #64748b;
      --palette-info: #0891b2;
      --palette-info-foreground: #155e75;
      --palette-warning: #d97706;
      --palette-warning-foreground: #92400e;
      --palette-success: #059669;
      --palette-success-foreground: #065f46;
      --palette-error: #dc2626;
      --palette-error-foreground: #b91c1c;
      --palette-state-base: #ffffff;
      --palette-shadow-ink: #0f172a;
      --palette-series-1: #0891b2;
      --palette-series-2: #d97706;
      --palette-series-3: #475569;
      --palette-series-4: #0284c7;
      --palette-series-5: #7c3aed;
      --palette-series-6: #059669;
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
      --shadow-overlay: 0 8px 24px -4px color-mix(in oklab, var(--palette-shadow-ink) 18%, transparent), 0 0 0 1px var(--surface-line);
      --palette-input-surface: #ffffff;
      --palette-on-danger: #ffffff;
      --palette-table-stripe: #f8fafc;
    }
  }
}
@layer design-accessibility {
  /* progress-forced-colors:start */
  @media (forced-colors: active) {
    :root {
      --progress-forced-track: Canvas;
      --progress-forced-border: CanvasText;
      --progress-forced-fill: CanvasText;
      --progress-forced-pending-border-style: dashed;
    }
  }
  /* progress-forced-colors:end */
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
    --action-primary: #93c5fd;
    --action-primary-foreground: #0f172a;
    --button-height: 2.5rem;
    --layout-content-max: 72rem;
  }
  :root[data-product="example"][data-theme="light"] {
    --action-primary: #1d4ed8;
    --action-primary-foreground: #ffffff;
  }
  @media (prefers-color-scheme: light) {
    :root[data-product="example"][data-theme="system"] {
      --action-primary: #1d4ed8;
      --action-primary-foreground: #ffffff;
    }
  }
}
~~~
<!-- design-product-css:end -->

若只要不同主色，省略button-height与layout-content-max；成对覆盖action-primary及action-primary-foreground，hover/pressed默认继承公共语义配方，仅需要独立状态配方时显式覆盖button-hover/pressed-background；若需要更换字体，覆盖font-sans并保留中文/系统回退，font-heading/document自动继承。单个组件独立需求只覆盖相应组件变量，不改全局spacing来间接影响整个系统。覆盖须记录名称、理由、浅深值和受影响控件；不能用产品覆盖删除键盘焦点、错误反馈或必要对比。

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

当前主题主要操作浅色为 #0e7490/白字，深色为 #06b6d4/#090b0e 字；canvas 为浅色 #f1f5f9、深色 #090b0e。主操作 hover/pressed 从 action-primary 和中性表面/前景派生；结构面/卡片 #11151c、active/hover #161e28、overlay #1a2230。状态信号保留翠绿 #10b981、琥珀 #f59e0b、红 #ef4444；浅色配对使用同色相的深色前景。普通区域使用中性表面，不把所有卡染成主色。

默认 input-border-color 使用独立 input 角色，浅色 #64748b、深色 #5b708b；输入表面浅色 #ffffff、深色 #0c0f14，必要边界达到3:1。轻结构线 #1e2633 只用于区域分隔，不作为输入可识别边界。hover 不降低必要对比，产品覆盖按实际输入内外相邻表面核验。


### Precision 输入与适配边界

本次默认主题来自用户提供的 Precision Engineering Console。输入 YAML 的 surface #0f141a / primary #4cd7f6 与正文的 Elevation/组件值近似但不相同；此版本采用更具体的正文层级和交互状态，前言与 CSS 已同步，上传原文保存在设计来源快照中。浅色配对为本库推导：slate-white 表面、深青蓝操作及更深的同色相状态文字，不声称由原文件直接给出。

| 设计项 | 公共映射与生效位置 | 模式与必要适配 |
| --- | --- | --- |
| Canvas / structural / active / overlay | layer-canvas / layer-shell,surface,raised / interaction-hover / layer-overlay；页面、导航、Card、菜单和Dialog | dark正文四级层次；light冷灰白配对 |
| Primary Cyan | action-primary/foreground、button-hover/pressed-background；按钮、链接、选择、焦点 | dark #06b6d4/#090b0e；light #0e7490/white；hover/pressed 继承品牌语义派生 |
| Emerald / Amber / Crimson | status-success/warning/error 的 signal、foreground、soft、line；Badge、Alert和真实状态 | 信号保留正文色；错误正文改 #f87171、表头/placeholder 改 #94a3b8 以满足可读性 |
| Input / audit grid | input-surface/input-border-color；table-header/row/stripe/expanded-* | dark输入 #0c0f14、表头 #0d1016、条纹 #131922；必要输入边界提高至 #5b708b |
| Inter / JetBrains Mono | font-sans/font-mono；普通文字/代码与技术标识 | 保留七个已公开的rem文字角色、中文回退和缩放下限，不采用输入的11px普通文字 |
| 4px基础、6–8px容器 | button/input-radius、card-radius、menu-radius、radius-2xl | 三模式一致；保持36px普通输入与自然长文可达 |

正文给出的固定 hover #22d3ee 调整为既有公共语义配方：hover 混合 action-primary 92% 与 layer-raised，pressed 混合 action-primary 88% 与 foreground。这样已采用系统只覆盖 action-primary 与 action-primary-foreground 时，按钮各状态仍继承产品品牌并保留可读性，不在悬停时回到默认青色。产品如需独立状态配方，仍可显式覆盖 button-hover/pressed-background；上传原文保持原始字节。

多pane布局只在产品工作台需要时组合；公共登录仍为居中单框。光晕或脉冲只能映射真实运行/等待状态，不为品牌添加虚构遥测、日志或循环活动。reduced-motion、forced-colors、键盘焦点及显式 light/dark/system 选择继续保留。

### 三模式、持久化与首屏

系统必须支持浅色light、深色dark、跟随系统system三选一，并持久化用户选择。首次未设置偏好时默认选择dark；用户选择模式和实际生效主题是不同状态：system在当前系统下生效light或dark，不能将解析结果写回偏好后丢失system。跟随系统读取prefers-color-scheme并实时响应；显式light/dark不被系统变化覆盖。

选择须只接受这三个枚举。未知/过期值按dark处理；存储不可用时继续使用当前内存选择，刷新后回到默认dark，不阻断页面。显式system且系统偏好不可读取时生效light。各采用系统可有自己的存储key和迁移格式，不能因通用规范强制重命名已有数据。主题选择不重载页面、不清空业务缓存/草稿，不改变选中项、输入、任务或请求状态。

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
  let mode = "dark";
  try {
    const stored = window.sessionStorage.getItem(storageKey);
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
      mode = valid.has(value) ? value : "dark";
      apply();
      try { window.sessionStorage.setItem(storageKey, mode); } catch {}
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
| 表格 cell padding | block 8px、inline 12px；header至少36px、row至少40px |

按钮标准高度 xs24、sm32、default36、lg40px；对应横 padding8/10/12/16px、gap4/6/6/8px。普通图标16px，最小行操作12px；复用同一套图标尺寸和线宽，保留现有库，不混用装饰画布。默认 Checkbox为16×16px、radius-sm；Switch为28×16.6px、拇指14.4px；Tabs 高32px、内部 padding3px；紧凑切换项高28px、gap4px。适配项目可保留语义明确的既有变体，不能每页发明尺寸。

### 首屏信息架构与信息密度

信息密度是任务和信息的优先级，不是字号/间距档位。每页在实现前必须声明：核心用户问题、用于回答它的关键信息、主操作、支持视口及验收样本。不能先堆组件再靠缩小间距让首屏“塞满”。页面标题只说明当前任务，必要状态与主操作归属清楚，避免重复标题。

页面信息呈现按下列顺序推导，再选择卡片、列表、表格、表单或工作区组合；顺序用于设计判断，不要求每页新增一份报告。

| 设计步骤 | 要解决的问题与结果 |
| --- | --- |
| 确定任务 | 谁在什么情境下使用本页，要判断或完成什么；列清任务对象与范围 |
| 排列事实 | 按对当前判断的影响区分关键事实、相关上下文和次要详情；状态、阻断原因及必要时的信息来源/时效优先，未知不填零 |
| 匹配动作 | 将每个动作关联到对象、可用条件和真实后果；同一任务突出一个主要动作，独立任务区可各有自己的主动作，不强迫全页只有一个按钮 |
| 组织区域 | 需要比较多条记录时用列表/表格，需要编辑时用字段组，连续长内容按阅读顺序组织；卡片用于有独立职责的区域，不给每个字段再套一层框 |
| 决定披露 | 完成当前任务必需的内容直接显示；解释、历史、原始数据按需展开。风险、阻断与失败后的可用操作不能藏在详情里 |
| 覆盖变化 | 将加载、空、失败、忙碌、无权限、结果未知及长内容放回同一结构检查；只覆盖实际适用状态，并按支持容器决定换行、滚动和动作位置 |

### 高信噪比页面组合

xui既提供控件，也定义它们如何形成清楚的任务界面。每个默认可见区块须帮助用户判断当前事实、理解阻断或执行下一步；主次通过顺序、分组、对齐、宽度和逐步披露表达，不能只靠颜色、加粗、缩字或把内容全塞进卡片。先确定页面主任务，再选公共组合与容器；宿主提供领域内容和动作，不重新发明通用控件与状态。

| 页面任务 | 默认信息与布局次序 | 公共组合及边界 |
| --- | --- | --- |
| 查询与处理记录 | 一次任务标题/必要范围与主要动作 → 紧凑搜索与常用筛选 → 主要记录及局部状态；扩展筛选按需展开。数量只在有意义处表达一次，详情按需打开 | PageHeader、SearchToolbar/Toolbar、DataTable/DataRegion、Dialog/Sheet。若列表是主任务，创建/编辑使用独立表单区域或弹层，不将整份配置常驻列表上方 |
| 创建或修改对象 | 明确对象与任务 → 必需字段按含义分组 → 适用高级项 → 所属提交与反馈。短相关字段同行，长解释跨列，复杂编辑有足够空间；容器宽度与列数遵循表单标准 | Field/Fieldset、Grid/Stack、Disclosure、Button与已有表单组合。创建本身是主任务时使用清楚的独立表单；不为了统一强制所有编辑进入弹层 |
| 记录与详情联动 | 列表负责定位对象，详情负责当前对象的关键事实/状态/阻断与可用动作；技术标识、来源、完整历史按判断需要显示或展开 | DataTable与现有Dialog/Sheet或宿主明确的详情区。避免每个字段各套Card；详情不复制查询owner、不把刷新扩大到整个工作区 |
| 多阶段任务工作区 | 当前阶段、真实前置与可用入口优先；主要对象/结果集中，配置和完整历史按需查看。前置未满足时给具体原因和真实入口，不把所有后续空表和禁用表单平铺一屏 | MenuLayout/AppShell的既有page slots、DataRegion、Disclosure和宿主领域组合。阶段、权限、路由及执行仍由宿主提供，不在xui猜测或创建业务流程 |

普通正文和表单按任务选择适合阅读的内容宽度；表格/画布可使用更宽工作区。宽屏空间用于合理列宽、比较与分组，不是拉长所有按钮、边框和说明。窄屏按既定信息优先级换行、跨列和披露，保留对象、状态和主动作；200%放大允许必要滚动，不能裁切或隐藏核心任务。

空状态、无权限或前置不足时，保留用户能理解的位置与下一步；独立功能仍按实际需要可见。不能为了“页面完整”堆空表、重复计数、无效确认项或大块解释；必要业务风险、确认与数据缺口要用可理解的短说明表达，完整规则/协议细节按需阅读。真正需要专业JSON/规则编辑的任务遵循表单标准，不把内部模型默认当作普通操作界面。

执行时在实际公开入口中完成页面区域到组件/slots的映射，记录支持视口与状态样本。已有[列表/表单/详情](../examples/foundation-react/app.tsx)、[工作区](../examples/workspace-react/app.tsx)和[数据表格](../examples/data-table-react/app.tsx)提供公开消费参考；它们的合成数据不证明业务流程。外部设计图可以用于校准布局，须再映射真实公开能力并验收，不从图稿复制第二套控件皮肤或把图稿当作功能通过证据。

私有组合组件沿用同一优先级，不把组件内部最显眼的统计值或按钮自动提升为整页重点。例如项目的“任务执行面板”先说明任务对象、当前状态、阻断原因和可用动作，再显示支持判断的指标；执行历史与原始日志按需查看。未执行的任务不显示完成勾，未知进度不填百分比，重试只在领域能力确实支持时出现。该例说明信息关系，不要求所有项目采用相同页面布局。

在声明的支持视口内，首次完成加载后无需滚动页面即可看清核心内容及主操作；检查元素完整可见、文字可读、实际命中，不只检查DOM存在。窄屏可按已声明优先级换行、分组或按需展开次要区域，不能隐藏核心信息、裁切主操作、缩小字体到阅读下限以下或使用截图时特殊缩放伪装通过。

普通注释、名词释义、协议/实现背景不以常驻说明段落占据首屏。放入按需打开的说明、帮助或详情，入口有清楚名称，键盘Enter/Space和触屏点击可用，可关闭并恢复焦点；不能仅有鼠标hover。可访问名称、必要字段标签与及时操作反馈不属于应隐藏的名词注释。错误、风险、验证提示和执行反馈须在相关位置及时可见；高风险操作的必要说明在决策前可读，不能一并收进帮助。

不用无用统计、与任务无关概览、重复标题、装饰性卡片或大块空白把主体推下首屏。统计只有回答本页核心问题时才优先展示。核心事实、状态、主操作应相互关联；不能让一排大数字先占满页面而核心记录不可见。

禁止擅自添加无用户用途的重复品牌/页面名称页脚、开发备注、实现背景、接入完成或验收声明。例如已有品牌与当前位置时再常驻“产品名 · 当前空间”，仅重复已有信息。每条信息须能说明它帮助用户完成的判断或操作；必要标签、业务状态、权限限制、错误、风险和及时反馈仍应可见，不能因清理冗余一起删除。

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


### 页面与组件的槽位架构

layout 是从页面壳到控件内部的公共结构合同。每段内容先确定归属，再选择公开 slot/part；slot 的顺序、宽度约束、文字角色、着色、空态与滚动由 xui 维护，宿主提供事实、可访问名称、领域内容和动作。不能仅引入 Input/Button 后在外面重新组织同职责的通用页面或组件皮肤。公开 slot 中的领域内容仍须遵循本表，任意 JSX/Node 并不自动证明合规。

每个采用页面在实施前记录“内容 → 公共入口.slot/part → 文字/颜色角色 → 状态 → 滚动 owner → 检查 ID”，以固定版本类型为准。没有合适 slot 时列为 xui 公共缺口，不穿透私有 DOM/CSS。纯领域画布/编辑器等保留自己的内容和布局；不能用这种例外重写已有通用框架。槽位是布局 API，不将内部类名全部升级为可覆盖 API。

| 层/区域 | 内容与公开归属 | 呈现与着色 | 空槽、状态与滚动 |
| --- | --- | --- | --- |
| 应用壳 | AppShell/MenuLayout 的 headerSlots、sidebarHeader/sidebar/sidebarFooter、pageHeader/pageToolbar/children/pageFooter | 顶栏与侧栏用 shell 表面；主内容用 canvas；全局动作与页面动作分开 | 一个导航/主题 owner；正文容器稳定，模式与焦点见布局手册 |
| 应用顶栏 | leading=平台区域、brand=品牌、breadcrumb=路径、context=工作区；status=真实状态、actions=全局动作、auxiliary=辅助、account=账号 | 品牌/路径为正文，状态按真实 tone；辅助与账号不抢页面主动作 | 缺失扩展不占位；保留唯一导航、主题和显式启用的语言入口 |
| 页面标题 | PageHeader.title/description/meta/actions | title 唯一 h1/page-title；description 为 muted/body-sm；meta 为 muted/body-xs；actions 中 primary 为任务主操作 | 描述/meta/动作空则无包装；长标题换行，动作整组换行，不把刷新状态写进标题 |
| 页面工具 | pageToolbar 或 DataTable.toolbar 中的 SearchToolbar.search/actions/advanced | 搜索与常用筛选、动作、展开筛选各居其槽；默认中性，真实异常另用反馈 | 每组工具只有一个位置；高级筛选按需打开，焦点/草稿保持 |
| 内容章节 | Section.title/actions/children | 章节 h2/section-title，局部动作 ghost/outline，内容不额外加卡片边框 | 没有标题/动作时不生成空头部；正文自然延展 |
| 资源卡片 | Card的header/content/footer三段；title/icon/badge/actions归header，description/children归content，footerMeta/footerActions归footer | title 语义 h2–h6、section-title；icon 装饰；归属 badge 默认 neutral；description muted/body-sm；footerMeta muted/body-xs；更多动作在头部、对象动作在页尾 | 一层Surface，仅header/content/footer为根级区域；内容自然撑开，不固定高度或等分三段；标题用OverflowText，空content/footer不占位，header/footer不足时换行；卡片不成为伪按钮 |
| 指标与详情 | MetricCard.label/value/marker；详情用 dl 或公开展示组件 | 名称 muted/body-xs、值 metric/mono/tabular；marker 只承载真实状态。普通详情不每字段套 Card | 未知用明确占位而非 0；数值完整，标记不挤压主值 |
| 表单组 | Fieldset.legend、FormGrid.Item、FormActions.secondary/children | 语义分组、最多两列；长内容跨列；主次动作按所属表单排列 | 净宽决定列数；草稿独立于查询；提交错误在所属反馈区 |
| 字段 | Field.label/children/help/error；InputGroup.Addon/控件/动作 | label 为字段名，help 为 muted，error 为 error 文本；单层输入边界；单位就近展示 | required/invalid/describedby 真实关联；长错误自然换行，焦点和输入节点保持 |
| 卡片集合 | CardGroup.rows/rowKey/renderCard、toolbar、emptyState/errorState/feedback/footer 与受控 pagination | renderCard 返回 Card 的公开配置，集合创建实例；状态与计数/分页同属集合 | 单一 body 滚动，toolbar/footer 在外；稳定 key 保草稿/焦点，卡片自然高度 |
| 表格 | DataTable.toolbar/columns、emptyState/errorState/feedback/footer、受控 pagination | 对象主列、技术值、状态 Badge 与行操作按各自语义；唯一计数/分页 | 首次加载在数据区；刷新保留行；表内横滚和既有 sticky，不用外框遮罩 |
| 弹层 | Dialog/Sheet.Header/Title/Description、Body、Footer | 标题与说明分开，body 负责长内容，footer 放所属 FormActions | 开关只改可见性；正常 body 滚动、极端高度公共回退；关闭返回真实触发入口 |
| 导航/菜单 | NavigationMenu 的 items[].label/icon、renderLabel/renderAction 与公开渲染/事件扩展；Menu/ContextMenu 的 Item/Icon/Separator | 选中由真实 active/expanded，危险项使用 danger，图标继承语义色 | 独立分支和动作不导航；disabled 不执行；键盘及长名称由公共组件管理 |
| 原子控件 | Button/Link/IconButton 的内容与事件；Checkbox/Switch/Toggle/Radio 的标签与状态；Select/Combobox/Command 的公开 parts | 动作、选中、禁用、只读、错误分别映射已有语义，不依靠颜色推断业务 | 不给所有控件添加同一套 slot；保留原生/peer 表单与键盘语义 |
| 披露与时间 | Tabs/Disclosure/Accordion 的 trigger/content；Calendar 和 DateTimePicker 的已选值、查看月份及受控事件 | 当前选项与展开状态明确；时间按分钟墙上时间/ISO 日期合同，时区归宿主 | 焦点连续，日期/月份事件独立；不隐式截断精度或转换时区 |
| 反馈/媒体 | DataRegion.children/feedback；Alert/Toast；Typography/Copyable/Tag/Image | 临近相关操作的状态、错误、一次性反馈；文案/图像来源真实，复制/删除有明确入口 | 状态不重挂 children；图片预留真实比例；被动文本不增 Tab stop；通知只有一个 owner |

组件的详细 part 名称、React/native 差异和替换生命周期以 [COMPONENTS](COMPONENTS.md) 为准，公开入口以 [PUBLIC_API](PUBLIC_API.md) 为准；上表不发明所有控件共有的万能 renderSlot。完整判定按 [逐项清单](ADOPTION_CHECKLIST.md) 每个对象逐条记录，通过、不适用、失败、未跑分别报告。宿主填错 slot、私自着色或重复 owner 属于接入失败；公共类型和合法内容仍无法满足矩阵时属于 xui 缺口。

状态的统一边界：布局组件不请求、不缓存、不猜权限；交互组件拥有局部 focus/open/checked 等公开状态；resource/auth/业务 controller 拥有请求与确认事实。`busy` 不等于 `disabled`，`readOnly` 不等于 `disabled`，错误不等于空数据。正常 React render 是更新，切换 key、清空 DOM 或条件卸载是重建，不能用后者实现同范围刷新。刷新与范围切换、取消、失败恢复按下方连续性合同执行。

### 表单和响应式

标准业务表单按自身容器净宽采用一列或最多两列，普通每列至少240px、长路径至少288px、gap16px。普通两列需净宽496px；长字段两列592px。不能按整个视口宽度把抽屉字段挤成窄列。标签、控件、帮助、错误依次排列；相邻字段从顶部对齐，普通/invalid 控件顶部差不超过1px，不以帮助文案长度撑偏控件。

这些是根字号16px时的参考几何，实际使用既有rem/语义变量随文字放大。按字段关系和容器选择列数；通用Grid保留多列能力，标准表单采用FormGrid，不为填满宽屏而增加无关联字段列。字段较少的创建/设置表单使用适合阅读的内容宽度，不能把窄输入堆在全宽大框左侧，右侧留下大面积无任务用途的空白。

| 表单部分 | 统一组合规则 |
| --- | --- |
| 字段与分组 | 使用公共Field组织一个控件的label/control/help/error；多个选择项用Fieldset/legend及各自标签。placeholder不替代label，DOM阅读和Tab顺序与视觉顺序一致，不靠CSS order重排任务步骤 |
| 同行字段 | 相关短字段在净宽允许时同行；列起点、控件顶部、尺寸与间距一致。长名称、路径、解释、多行内容按需要跨列，不能把长标签/正文挤成逐字折行的小格，也不让不相关checkbox悬在任意一行 |
| 输入与编辑 | 按数据语义选公开控件，单位、必填及约束靠近对应字段；格式复杂的专业编辑保留足够空间。枚举或特殊值使用可理解的选项，原始协议值在宿主明确映射，不为改UI改变业务API。普通任务不直接要求用户手写JSON/规则AST/协议时间串；确有专业需求时按需提供编辑入口、校验和帮助，不伪造不存在的公共规则编辑器 |
| 时间合同 | 日期/分钟墙上时间选用实际消费版本中适用的公共组件。端点若要求秒、显式时区或更高精度，先核对公开能力与宿主转换合同；不能用分钟控件静默截断，不把无时区值冒充UTC。公共能力缺失按ADOPTION交给xui |
| 帮助与错误 | 普通帮助只解释当前字段的实际限制；名词/实现细节按需披露。错误关联字段并保留可修输入，必要时给临近主操作的整体错误；不因新增错误重挂控件或让正在点击的动作失去命中。内容增长可以自然改变高度，不通过所有表单常驻大块空槽追求绝对零位移；公共登录反馈按其专项合同 |
| 动作与提交 | 动作在所属表单末尾或既有公共footer，窄屏/滚动时可达。普通业务表单不默认把主按钮拉满整个工作区；登录等公开整页组合遵循自身尺寸合同。明确button的submit/reset/button类型，提交与确认使用既有单一owner，保留键盘/IME与真实表单值；busy只阻止确实冲突的动作，不机械禁用整个页面 |
| 草稿与重置 | 用户草稿与服务端确认值区分；后台读取/刷新不覆盖未提交输入，不因新响应重置整份表单。重置/取消/提交后清理按宿主明确动作处理，保留必要错误恢复；不能用刷新页面代替重置或保存结果处理 |
| 页面与容器 | 表单内容与页面、Dialog、Sheet布局壳分开，复用相同字段/状态基础。主要流程和必需前置清楚；未满足前置时解释具体原因并给真实入口，不能靠堆多个空表、无效按钮和开发说明代替流程 |

表单验收使用实际容器净宽，在宽/窄、长中文、必填/错误/只读/忙态与200%文字/浏览器缩放下核对列数、控件顶部、Tab顺序、动作命中及滚动可达。默认视口先完成任务信息与操作检查，不用缩小字号补布局。确认事项与业务风险保留在决策位置，不能以清理说明为由删除。

工具栏以操作整组换行，标题和长内容可收缩，动作可达；表格在自己容器内横滚，保留业务列。沿产品已定义断点采用侧栏收起、抽屉或局部滚动，不能为了样式一致擅自改导航和工作台结构。宽窄往返必须真实点击入口检查命中，DOM visible 不足以证明未遮挡。

长表单、编辑器和抽屉在所属 body 内滚动，保存/取消仍可达；代码编辑器保留行号、输入、复制、换行和自身滚动。页面不套多层互相争夺滚动的普通 Card。200%缩放下保留操作与内容可达性。

## Elevation & Depth

层级由职责决定，不能只看嵌套深度。独立 Card/Section 使用 raised 中性表面、一层1px surface-line、无投影；嵌入子组可以无框但保留标题/gap/分隔。连续 Item 只画底线，末项无底线；资产卡 footer 有分隔。统计采用独立轻框，或单外框加内部连续线，不能叠两套边界。

表格由表头、行线和不透明条纹组织；条纹与默认底先完成不透明合成，sticky 同步该行 default/偶数/hover/selected/expanded 背景。透明条纹或透明固定列不得让横滚底层文字穿透。普通 hover 不浮起、缩放或平移。

菜单、Popover、Dialog、Drawer 使用不透明 overlay、明确边界和一套浮层阴影：0 8px 24px -4px（浅色ink18%、深色black60%），辅以1px边界。深色四级层次为 canvas #090b0e → structural #11151c → active #161e28 → overlay #1a2230。实际阴影色仍来自集中变量。普通 flat/subtle/surface/raised 无投影；不把浮层配方复制到每张卡。

Portal 和叠层由公共浮层适配定义明确角色；不逐页抬 z-index 掩盖遮挡，不以高阴影代替真实区域边界。无法交互的背景保持模态语义。React Popover.Content 可通过公开 portalProps 指定所属 Dialog/Sheet 的实际容器，保留同一 Root、定位器与焦点生命周期；省略时仍使用默认 body。扩展不新增 overlay 或打开状态 owner，不要求采用项目复制 Content 部件接线。

## Shapes

圆角 sm2、md4、lg6、xl8、2xl8px，对应0.125/0.25/0.375/0.5/0.5rem。普通输入和按钮用md；Card用lg；菜单外层xl、项md；Dialog/Sheet用2xl。密度和容器尺寸不使圆角任意增长。

头像、Switch、状态点、Logo保持语义形状。普通元数据不一律做带框胶囊，有限可交互筛选 chip 可以使用小圆角。画布几何和原生平台形状是有记录的领域适配，不能被复制到普通控件。

## Components

### 公共复用与状态矩阵

优先复用已有公共组件及声明变体。页面负责布局组合，控件负责尺寸/颜色/状态；不再写同名按钮或输入皮肤。公共展示组件不请求 API、不判断业务权限。

标准界面默认采用 xui 公共控件封装。简单选择使用 SimpleSelect，搜索选择使用 Combobox / CommandPicker；不把裸 select、datalist 或操作系统选择面板作为标准示例和默认采用入口。React封装内部保留语义DOM和select表单桥，浮层复用公共Select。React NativeSelect 仅用于明确需要平台控件的场景与独立合同审计，其系统面板仍由浏览器/OS负责；不为统一外观替换文件、日期、颜色等尚无实际消费需求的系统能力。

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

### 项目私有组合组件的设计方法

项目私有组合组件承载领域对象和工作方式，复用 xui 的基础控件与设计语言。单个页面区域可以先就地组合；形成稳定业务职责、独立复杂交互或多场景复用时再抽成项目组件，不以复用次数作为唯一标准，也不为每层容器增加一层包装。

| 设计项 | 需要明确的约定 |
| --- | --- |
| 职责与边界 | 用一句话说明服务的业务对象和用户任务；哪些信息与动作属于此组件，哪些由页面或相邻组件负责 |
| 输入与所有者 | 明确已确认数据、编辑草稿、权限、查询与提交各由谁持有；复用已有领域能力，不复制 HTTP、认证、缓存或同一业务状态的 owner |
| 对外接口 | 输入业务数据与适用状态，输出明确的动作意图/回调；只开放真实复用的内容槽，不暴露内部 DOM、样式选择器或大量互相制约的显示开关 |
| 信息与动作 | 按上方页面方法确定内部主次；仅保留有用的标题、标签和说明，不机械重复页面标题。被动信息不增加按钮语义，交互区域保留真实控件与名称 |
| 状态与反馈 | 明确适用状态下显示什么、允许什么及如何继续；区分 disabled/readOnly、空/未知/错误。异步结果按权威事实更新，保留可继续的输入与焦点，不伪造成功，不因结果未知自行重发写入 |
| 容器与生命周期 | 内容主体与整页居中、窗口定位、路由和滚动壳分开；按实际需求放入页面、Dialog、Sheet 或步骤。声明自身所需空间、滚动边界、焦点及卸载清理，不假设永远占满窗口 |

先从公开组件及组合选择所需能力，保留它们的语义、尺寸、键盘、焦点和状态行为。项目可以编写自己组合根节点的语义结构与布局 CSS，使用公开 props/slots 和主题变量；这与穿透 xui 私有 DOM、复制按钮/输入框皮肤是不同边界。项目独有的视觉角色在项目主题中集中定义，复用已有语义的部分继续继承；不能把领域状态注入通用 token，也不能通过样式伪造公共 API 不具备的交互。确属可复用基础能力的缺口，才向 xui 提出带场景的公共扩展需求。

自包含意味着职责和交互闭合，不意味着每个组件都有外框、标题、帮助段和底部栏。必要上下文可以由宿主传入；可选内容为空时不占位。帮助在需要时可达，必要标签、错误和操作后果保持可理解；不为零布局变化预留大片空白，不通过裁切反馈保持固定高度。

用真实支持的容器和代表数据验收：正常与关键异常、短值/长中文、空数据、适用的只读/权限状态，以及窄屏、文字放大、键盘与焦点。多场景复用时分别检查这些场景，不强求所有组件支持全部宿主。可见性、动作结果、草稿与焦点连续性比“用了同一主色”更能证明设计一致。稳定的项目约定归入已有 `docs/DESIGN.md` 的对应章节，局部实现细节留在代码，不增加逐组件规范或验收文档。

### 组件尺寸与职责

数值按通用默认尺寸；高度和间距从共享尺度或组件变量计算，字号遵循 Typography：

| 组件 | 表面、尺寸与用途 | 状态、行为和验收 |
| --- | --- | --- |
| Button / 图标按钮 | default36、sm32、xs24、lg40px；padding12/10/8/16、gap6/6/4/8；radius-md。主动作primary，次动作outline或中性secondary，重复行操作ghost，危险动作destructive | default/hover/pressed/focus/disabled/busy/error；只有真实切换才selected。Enter/Space执行，图标有名称；不改变请求、防重、确认。工具栏换行不裁掉动作 |
| Input / Textarea / NativeSelect / 搜索 | 普通36px、小32px；body-sm；input表面、一层1px边界、radius-md。label/control/help/error间距8/4/4px | default/hover/focus/disabled/invalid/readOnly；busy由业务拥有。placeholder不代替label，错误用aria-invalid和describedby；只读可复制，native option跟随平台 |
| InputGroup | 只一层边界与focus；内部控件不重复border/ring；addon与清除不覆盖文字 | 单行默认外高与Input一致，内部输入和动作使用input-group-control-min-height扣除外框两条边；多行使用input-group-textarea-min-height。长文或放大文字仍可增高。外层映射内部真实focus/invalid；浅深检查focus+invalid；输入可收缩 |
| Switch / Checkbox / Toggle / Tabs | 默认Switch28×16.6px；Tabs高32、内padding3、项radius-md；Toggle高28、gap4；其他既有变体记录映射 | checked/selected来自真实状态，Space切换，方向键按控件语义；禁用项不可执行，hover不盖选中底；小屏项目可达 |
| DropdownMenu / ContextMenu | opaque overlay、1px边界、shadow-overlay、radius-xl、padding4；项至少28、body-xs、gap8；min-width128px | default/hover/selected/focus/disabled；业务busy/error不伪装选项。选中有check，危险项有文字；available-height内滚动 |
| Command / Combobox | 搜索复用输入、选项复用菜单角色，不另建选择器皮肤 | 活动项与持久选中分开；搜索输入保持焦点，键盘代理焦点只在键盘阶段存在，鼠标/blur清除；no results与error不同，不更改搜索和防抖 |
| Card / Section / Item | 独立raised、1px边界、radius-lg、padding14（小10），无阴影；内部组none；连续Item只底线 | 被动仅default/busy/error；交互才有hover/selected/focus/disabled，hover不浮起。两主题默认均能辨大区块 |
| Table / DataTable | header body-xs/500、cell body-sm、padding8、1px行线、不透明条纹；动作gap4，宽度容纳全部按钮 | 排序/分页/动作沿原语义；sticky随整行背景，default/条纹/hover/selected/expanded均不透字；局部横滚最左/中/末端与产品支持的尺寸配置检查，不删业务列 |
| Badge / Metadata / Status / Alert | 元数据body-xs普通可读文字；有限筛选chip；状态文字+点/图标；Alert语义soft底与line | 被动不套hover/focus/disabled；交互筛选才有selected等；长值在列内限制并有完整入口，换主色不改状态含义 |
| Dialog / AlertDialog / Drawer / Sheet | opaque overlay+单套shadow；普通Dialog宽40%（24–48rem）、确认30%（20–32rem），再受viewport边距≥16封顶，radius-2xl；header section-title/600。侧向Sheet宽60%（24–64rem）并封顶视口，上下Sheet高度独立 | 焦点限制和恢复，业务取消/确认不变；body内滚footer可达，窄屏抽屉全宽；不普通嵌套dialog/drawer |
| Popover / Tooltip / Calendar | Popover bottom/center、offset4、宽288、padding12、gap16；Tooltip top/center、offset4、最大320、body-xs；Calendar保留日期范围/locale | 辅助Tooltip不承载必要动作或唯一错误；键盘可达，Esc关闭；碰撞、portal主题与日期方向键实测 |
| 统计 / Chart / Progress | label body-xs/muted、value metric/600/tabular、单位body-xs；gap4、padding12。指标轻框或汇总单框+内部线；axis≥12、legend13、line2/2.5px；Tooltip overlay | 被动default/busy/error；hover仅Tooltip，selected仅范围控件，不用disabled假装未知。保留原列数/图高、数据口径，图例可换行 |
| Shell / Sidebar / PageHeader / Toolbar | 顶栏48px；标题page-title/600；导航body-sm；操作gap8、区域gap16 | 控件真实状态，导航selected无额外框、失焦focus消失；宽窄往返入口可点击，不改变信息架构 |

### 逐组件外观与状态映射

变量只提供值，下表同时规定如何使用。尺寸由spacing及control-height/icon-size、radius、文字角色或必要组件变量表达；设计倍率仅在集中token定义中计算，例如switch-width、switch-height、tabs-padding，组件直接消费对应var。结构常量与实时测量例外见公共设计值验收边界。D=默认，H=hover，P=pressed，S=持续selected/checked/expanded，F=keyboard focus，X=disabled，B=busy/loading，E=invalid/error。每个组件只实现其适用状态；被动内容不为了凑表增加交互。F与S独立，H不能盖掉S，E与F可同时可见。

| 组件/适用状态 | 默认尺寸和外观 | 状态到变量的映射及交互 |
| --- | --- | --- |
| 垂直导航菜单 D/H/S/F/X；B/E仅所属业务存在时 | 高nav-item-height=36px、gap8、radius4；默认透明。内容始终保留12px内距 | D用menu-item-background/foreground；H用menu-item-hover-background/foreground，无位移且无左指示；S用menu-item-selected-background/foreground并显示nav-selected-indicator-*，无四周外框；S+H保持S。F用focus-width/offset和interaction-focus，失焦消失；X文字muted且不可操作，不以hover伪造可用 |
| Dropdown/ContextMenu项 D/H/S/F/X；非选择项S不适用 | overlay+1px边界+shadow-overlay；menu-min-width128、item-min-height28、padding4、项内横8/gap8、radius-md、body-xs | D透明，H轻底不位移；radio/checkbox持久S用menu-item-selected-*和勾选语义，不画导航左竖线。F独立焦点，禁用不执行。方向键/Home/End/子菜单/Esc规则如下；业务B/E/空结果不是普通可执行选项 |
| Button/图标按钮 D/H/P/F/X/B/E；真实切换才S | 高button-height36、padding12、gap6、radius4；背景button-background、文字button-foreground；图标16（xs12） | H用button-hover-background，P用button-pressed-background且松开恢复，适用按压反馈沿下方动效矩阵。F用focus-*；X用button-disabled-*并禁用执行。B保留已有忙碌文案，防重由业务拥有。outline=raised+surface-line；secondary=muted；ghost默认透明、H=interaction-hover；危险用status-error-soft/foreground及原确认 |
| Input/Textarea/搜索 D/H/F/X/E/readOnly；B由业务拥有；S不适用 | input-height36、radius4、input-background/foreground、1px input-border-color；label→control→help→error，8/4/4px | H保持input-border-color的必要对比；F独立focus-*；E的必要控件边界用status-error-foreground，status-error-line只用于有文字/图标伴随的辅助分隔；关联aria-invalid/describedby，E+F均可见。readOnly可选择复制；X不可编辑；loading不自行改请求。placeholder不代替label |
| InputGroup D/H/F/X/E；S/B按内部控件 | 同输入，一层边界和焦点，addon/清除与内容gap8 | 外层映射内部真实focus/invalid，内部不重复border/ring；帮助和错误不撑偏相邻控件，不制造第二层皮肤 |
| Combobox/自定义选择 D/H/S/F/X/B/E | 搜索复用输入、选项复用menu-item-*；弹层popover-width288、padding12 | 持续S与键盘活动项分开，活动项F只在键盘阶段存在。搜索输入保留焦点，方向键/Enter选择；无结果与错误不同，不自动选首项、不改查询防抖；NativeSelect由平台负责面板 |
| Checkbox/Switch/Toggle D/H/S/F/X/E；B仅业务已有 | Checkbox默认16×16px（control-icon-size）、radius-sm、1px input-border-color；Switch宽28/高16.6px、拇指14.4px，圆形轨道；Toggle使用toggle-height默认28px、gap4，放大文字可自然增高 | S用action-primary及成对前景或interaction-selected-*，必须有真实checked；H不盖S，F独立，E相关错误可见，X不可切换。Space/方向键遵循角色；不得仅换颜色模拟checked |
| Tabs D/H/S/F/X；B/E归panel，P/S不混同 | 高control-height-sm32、内padding3、项radius-md；label body-sm | 默认透明/中性，H用interaction-hover，S用interaction-selected-*，F用focus-*；无四周选中框，不要求左侧竖线。方向键及panel关联完整，禁用项跳过，不能把panel加载当作tab被禁用 |
| 表格/列表 D/H/S/F/B/E；X属于行控件 | cell padding8、动作gap4，表头body-xs/500、正文body-sm，分隔separator-line；opaque条纹 | H用interaction-hover，S/expanded用interaction-selected背景；sticky与整行不透明底一致。F只归焦点控件/确有键盘行，不给被动行造焦点。B/空/E保留所属状态和恢复入口，排序/分页真实禁用 |
| Card/Section/连续Item | card-background=raised、border-color=surface-line、radius6、padding14/小10，shadow-flat | 被动仅D/B/E，H/P/S/F/X不适用；交互卡才用H/S/F/X。H轻底不浮起，S浅底无额外框，F独立。内部组无重复框，连续Item仅末端分隔 |
| 统计/指标 D/B/E；H/S仅已有tooltip或范围控件 | metric-padding12/gap4，label13/muted，主值24/600/tabular、单位13 | 0/未知/无数据/B/E分开，核心统计才进首屏；不以disabled表达缺数据。范围S沿选择器，tooltip H/F使用overlay；指标本体无按钮hover、焦点或选中 |
| Dialog/Drawer/Sheet D/F/X/B/E；容器H/P/S不适用 | overlay+surface-line+shadow-overlay，radius-2xl默认8px（贴边Sheet按其边缘合同）；宽layout-dialog/confirm/drawer-width按40%/30%/60%与各自min/max合成；Dialog/Confirm边距16，侧向Sheet封顶视口 | header/body/footer归属明确，body滚动footer可达；F限制/恢复按模态语义，X/B/E属于内部控件/反馈。取消不自动保存，危险确认保留，不普通嵌套同类模态 |
| Tooltip/Popover/Calendar D/F；H/S/X/B/E按角色 | Tooltip最大320、body-xs；Popover宽288/padding12/gap16；floating-offset4 | 辅助Tooltip不可承载唯一重要错误或必要动作；按需帮助须键盘/触屏可打开关闭。Calendar真实日期S/disabled与方向键/locale保留，定位和回焦点见下文；不要求所有浮层本体有hover |
| Badge/元数据/状态/Alert/通知 | 元数据body-xs普通文字，不泛胶囊；Badge默认neutral纯文字，显式info/success/warning/error用status-*-foreground/soft/line、横向space-text-gap、line-width-surface及radius-md；状态保留文字/图标 | 被动D/E，H/S/F/X不适用；可交互筛选chip才有H/S/F/X。错误/风险/必要反馈即时在相关位置可见，不收进普通解释；B有可理解文案，不只转圈 |
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
3. 可用碰撞尺寸属于定位外壳；React浮层内容的border box须从相应轴可用空间扣除外壳两侧floating-offset留白，不能令外壳padding叠加在可用高度/宽度之外。宿主使用公开Content即可，不硬编码collisionPadding或补高度/边距来修公共边界。
4. 菜单在available-height内纵滚，活动项可滚入视区；长值有完整入口。子菜单关闭不改变父表格滚动，抽屉滚动不让底部操作离屏。
5. Enter/Space打开或执行；方向键移动、Home/End到边界；子菜单左右键进退。Command输入保持搜索焦点，方向键移动活动项、Enter执行；视觉hover不是持久选中。
6. Escape关闭最上层并恢复触发器；特殊checkbox/radio菜单遵守其已有关闭规则。非模态外点和Tab按所属组件语义关闭或移出，不全局添加focus trap。模态Dialog保持焦点限制；触发器移除时回到所属工作区可用入口。
7. disabled不能激活；loading、失败、空结果有文案，不悄悄选首项。关闭不自动保存；选择、校验、异步动作由业务拥有，公共浮层不自行请求。
8. 真实鼠标与键盘验收打开→移动→选择/取消→Esc→回焦点，覆盖portal浅深、底部滚动、窄屏碰撞及反复往返；不用force click跳过遮挡。

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

应用头部按brand、breadcrumb、status、actions角色组合。桌面收起/展开入口归导航侧栏内部，由公共组件管理位置：sidebarTogglePlacement默认top保持原顶部独立辅助行；显式bottom将同一个控件放在菜单与可选业务sidebarFooter之后，菜单独立滚动，顶部不留占位。业务sidebarFooter需要同行时用公开SidebarFooterRow，自然宽度并按空间换行，长事实不截断；默认非Row组合保持全宽，紧凑rail按组纵排。展开时沿侧栏内距靠末端，紧凑rail中居中。窄屏侧栏不可见时，同一入口移至顶栏以打开已有导航抽屉；不在两处复制按钮或另建抽屉。公共层统一其按钮尺寸、位置、动效、键盘焦点、可访问名称和aria-expanded/controls，跨断点复用同一个控件节点，宿主仅传状态与事件，受控请求不能冒充已确认状态。导航入口和品牌/路径为左侧主组，状态和动作在右侧；采用方提供内容、名称、链接语义及实际动作，不在公共库写入产品权限或版本规则。主组保留layout-header-primary-min的合理宽度，窄屏优先完整保留导航入口，品牌与路径各在所属空间省略长文字；链接可聚焦，完整名称保留可访问语义，宿主可提供title或明确详情入口。状态/动作空间不足时整组换到下一行，动作组内部按需换行，不能盖住品牌、互相重叠或令整页横向溢出。不静默隐藏状态或重要动作，不用缩小字体解决空间问题；没有动作时不预留空白占位。旧任意header内容继续支持，迁移后通用排列由公共组合负责。

展开侧栏用nav-sidebar-width，按视口25%动态计算，在nav-sidebar-min-width与nav-sidebar-max-width之间夹取，默认根16px下324–432px，再以50vw封顶（视口约束优先于最小宽度）；内距nav-sidebar-padding，默认两侧各12px。紧凑栏用nav-collapsed-width，等于一份nav-collapsed-item-size加两侧内距，默认60px，36px图标项对称居中；不得多计一份图标项宽度。带独立展开按钮的链接在紧凑栏中把该按钮放在同一项下一行，不用横向加宽整栏。焦点环和短竖线在保留内距内可见；viewport模式侧栏独立滚动，当前项在状态更新后可见；窄屏同一抽屉继续完整显示标签。

长名称默认保持wrap兼容；显式labelOverflow=marquee时，只有公开名称部件在有hover、fine pointer且未减少动态效果时单行省略，主项悬停或聚焦停留后按nav-label-scroll-delay开始，以nav-label-scroll-speed（单位CSS px/秒）单次滚到末端并停驻。离开且失焦即取消和复位，短名称、禁用、紧凑隐藏名称不滚动；触屏/无hover/减少动态效果或不支持动画时保留完整静态换行。富标签使用公开名称部件分隔主名称，描述和Badge保持静止；库不猜消费者strong/br结构。actionAlignment=start将独立分支与行尾动作中心对准首行文字行框，主图标及无href分支箭头同步定位；start或marquee呈现用nav-row-primary-min-width保留可读名称净宽，空间不足时独立动作自然换到下一行，不能把名称压成零宽；默认center兼容既有布局，紧凑栏仍逐控件纵排。两项呈现更新不得重建主控件、切换路由或更改展开状态；宿主只声明公开选项，不穿透DOM写样式。默认展开324px是用户明确授权的全局变更，窄屏drawer独立封顶视口，阅读列max宽度仍是上限而非刚性占宽。

导航的当前页选中与键盘焦点相互独立：已有真实菜单焦点优先；没有菜单焦点时，菜单状态更新可把可用当前页设为单一tab停靠点。打开抽屉本身必须保留打开前合法的菜单停靠点，不能由浏览器默认聚焦首项而意外改写它。React shell/dialog由公共owner在模态建立前确定初始焦点并避免中途首项focusin；无可用菜单项时回退关闭按钮。保留的焦点项在长菜单中应可见；取消回可见入口，宿主已移动到新标题或新模态的焦点不得被旧关闭事件夺走。

侧栏底部是独立于顶栏角色的可选公共内容区域，不内置返回、授权、账号、版本等领域含义。短菜单时底部位于侧栏末端；长菜单使用上方唯一菜单滚动区，底部不覆盖末项。无底部时保留既有滚动合同；有底部时document模式仅侧栏有界并保持正文文档滚动，viewport模式仍使用所属窗口的可用高度。底部内容超出可用侧栏一半时允许自身滚动，以保留菜单和所有动作的可达性，不能裁掉放大文字。底部使用body-xs、space-text-gap/space-control-gap、separator-line与既有按钮状态/motion，禁止消费者额外复制定位和尺寸规则。

紧凑侧栏中的底部不增宽公共60px轨道。有图标/短表示的公开内容部件居中显示该表示，完整文字仅视觉隐藏并保留可访问名称；无紧凑表示时完整文字换行保留，不能静默删除。窄屏同一导航抽屉恢复完整文字。路由、选中和非底部更新不得重建底部或重复绑定回调；响应式与反复抽屉开关复用同一内容节点/状态和已有模态owner。动作的disabled/busy、防重复、权限、导航和状态文案仍由宿主明确提供。

DropdownMenu/ContextMenu及共用菜单项角色显式绑定body-xs字号/行高和font-weight-control，不继承浮层正文body-sm；浮层本身仍保留body-sm。菜单图标通过公开icon部件或xui-menu-icon语义类采用control-icon-size，非收缩并沿用menu-item-gap；只作用于声明的图标及其直接SVG，不把任意嵌套插图强制当图标。label与choice-label显式用body-xs/500，label→control→help→error间距保持8/4/4px；choice-label的文字角色变化不缩小默认控件点击区。错误关联与原输入语义保持。

### Agent-ready 的视觉与交互定位

UI是人类观察系统状态和数据、直接操作并介入Agent操作的入口；Agent通过可独立使用的业务API执行。统一目标是简洁、明了、快速，不以聊天气泡、满屏渐变或AI装饰替代可用性。默认界面先给任务/对象、当前权威状态、关键异常和主要动作；必要风险与阻断信息不得藏在高级详情中。颜色、字号、间距与焦点继续使用本规范既有语义角色，不建立第二套AI主题。

页面先按人的主任务选择编排。对话交流是独立的工作区类型，不能把管理列表的PageHeader、筛选、表格和状态墙直接套成会话首页。消息、所属工具摘要与答案按回合相邻组织，同回合段落间距小于回合间距，避免无意义的大块留白；长文、代码和表格保留适合阅读的列宽上限，输入区与阅读列对齐。历史读取、流式输出和局部刷新不得重建正在输入的区域。执行/连接状态、待审批与追加指导队列按真实作用保留，必要的取消/停止/重试可达；累计技术用量和文件细节按需查看，已选文件区开合尊重宿主任务与用户偏好。文字放大时允许所属公共容器自然滚动，键盘进入宿主自有输入区须让焦点和操作可见，不能用缩字或裁正文维持首屏静态构图。领域消息、队列、草稿、附件、路由及流式状态仍由宿主owner负责。

进行中、等待确认、已完成、失败和结果未知必须用文字区分；建议/生成内容不等于已经执行，未知/未加载/不可读不等于零。来源、作用范围和信息时效在影响判断时可见，不伪造进度或置信度。次要解释、历史和技术数据按需展开；展开不重建有效输入，普通通知不抢焦点。

动作必须对应真实可用能力，主次清晰、原位反馈、防重复且键盘/窄屏可达。暂停、停止本地等待、终止服务端任务与撤销已完成变更不能互相冒充；临界动作明确作用与后果，并给出权威结果及实际安全恢复路径。加载、离线和失败不重排主体；未知写入不通过自动重试装成恢复。认证凭据清除、门禁和权限沿用领域合同。

表单常显label，帮助解释约束而非重复标签；初始未操作字段不预先责备，提交时定位可修字段，整体错误接近主操作并保留可理解的恢复说明。可见状态不只依赖颜色、spinner或瞬时toast；辅助文字不能因层级弱而不可读。根字号与真实浏览器zoom分别验证，四边focus、长文案与中文实际字体必须留证。实现与验证须依据上述真实状态和动作，不将参考研究或合成例子当成公共状态/动作组件及产品业务能力已实现的证据。

### 公共登录页布局与主题

公共登录/初始化页复用一个AuthPage布局owner，默认layout=card：动态视口居中、自然高度的单列框，既有Surface边框、radius-lg和raised表面，无投影；顶部边线复用line-width-emphasis与action-primary，默认2px青色细边。框默认434px：384px内容轨道（含四边focus余量）+两侧24px内边距+边框；≤40rem时两侧16px，外侧保留layout-viewport-inset。底部padding使用space-content-gap（12px），不为视觉撑高卡片。fullscreen同布局只省略Surface皮肤。禁止左右品牌面板、背景大图、渐变或装饰分割线。显式brandVisual仍为inert可选装饰，最大80px、窄屏隐藏。

层级顺序为紧凑品牌身份→任务标题→可选任务说明→常显标签/字段→唯一主动作→局部反馈。品牌名采用body-xs 13/20px、500与muted-foreground，logo32px；品牌到标题8px。任务标题复用page-title 20/28px、600，随font-scale/line-height-scale与根字号缩放。description属于标题说明而非品牌口号，使用body-sm 14/22px，标题到说明8px；整个标题组到首字段16px。宿主标题建议使用“登录”或“创建管理员”等任务名，不重复品牌全称；显式配置仍原样保留，不猜测删词。字段label采用body-xs 13/20px、500，输入和主动作采用body-sm 14/22px。login-control-height默认44px由control-height-lg+space-text-gap派生，InputGroup包含外边框也为44px；字号增大时控件自然增高。label到input8px、字段间16px、最后字段到主动作16px；字段和主动作同宽（默认376px可操作区）。帮助与错误仍body-xs 13/20px，沿用通用颜色与间距，不增加仅登录使用的调色板、字体栈或焦点规则。

反馈仍在主按钮之后。feedback与feedbackActions均为空或隐藏时不占位；React识别空Fragment与条件空值，空反馈槽不生成占位。没有固定或最小反馈轨道高度，form到support不额外叠加间隔。checking、错误、未知后果与实际恢复动作按内容自然增高；字段和主动作的尺寸、相对顺序与DOM保持，整体居中卡片可因此调整位置。不得为零位移设置大块空白、固定反馈高度、裁切或要求用户在单行消息窗口内滚动。长页使用文档自然滚动；验收须区分必要内容增长与控件重建/尺寸跳变。

必要结果摘要必须完整显示，未知结果及实际可用的后续操作不可隐藏在详情中。登录和 Key 管理按各自公开合同通过普通会话或列表单次核验，不增加持久写入门禁或自动重发写请求。宿主有独立冗长说明时，可在现有feedback slot中组合公共Disclosure；默认摘要仍在外部，展开有明确名称、支持Enter/Space、全文随文档滚动，收起与回焦点保留输入。公共布局不能猜截断宿主文案、另造摘要或改变业务语义；仅给了一个长消息时显示全文。不新增详情API或业务动作。反馈动作在同一反馈区域自然换行，不与长消息争夺窄小横向空间。

提交忙态仅在主按钮原位显示一次状态文案并以单一live/status语义发布，配合aria-busy和既有禁重入。与按钮不同的session核对、未知、错误与恢复信息仍在反馈区域；不能为去重隐藏重要事实。React/native必填字段按已有Field惯例显示aria-hidden星号，真实required与准确可访问名称保持。普通密码登录不显示新密码规则或强度；管理员初始化采用NewPasswordFields。没有虚构的注册、找回密码、SSO或验证码入口。安全可重试读取使用公共ghost动作；未知写入不自动refresh/logout/重放。

SSO显式配置时作为主动作后的次级组。极端长主动作保留完整可访问名称，login-action-max-block-size（20dvh且至少login-control-height）限制单按钮高度并可内部滚动，保留safe center与四边focus。状态标签原位切换并滚动归零；普通通知不重挂输入或按钮。登录、初始化和纯AuthPage消费同一结构和token，不允许产品私有CSS补丁。

长品牌、配置表单、SSO及放大文字使用自然文档滚动；短视口不限制表单高度，所有字段与动作始终可达。正文、操作、反馈和SSO内部保留focus-width+focus-offset四边空间与滚动安全距离，反馈内的焦点不会被局部滚动裁切，不修改全局焦点token。定量标准、状态矩阵与真实截图验收见[公共登录验收](VALIDATION.md#认证页验收)；未执行实际像素回归与图像查看不能宣称视觉验收完成。

登录页不另放主题选择器，直接继承已有本地偏好和单一根主题所有者；没有已保存偏好时默认深色。首屏初始化先于可见内容，三模式及系统变化仍按本规范执行；不因登录页布局迁移更换既有存储 key/格式，也不改变认证会话或凭据。

### 通用加载、主题所有权与构建消费

本节补充兼容的通用验收要求，不改变默认品牌值或业务职责。

公共页面骨架应能组合列表、表单和详情。标题、关键事实与主操作先显示；表格超出窄视口时在已命名的区域内横滚，不能挤掉关键操作。字段负责一个控件的 label/id/help/error；多控件组使用独立分组语义和各自标签，不将一个 id 分配给多个输入。aria-busy 说明工作状态，是否禁用由真实动作规则决定，两者不能机械等同。

主题在同一文档根上只有一个所有者，首屏初始化与应用复用同一模式和持久化来源。受控模式区分所选 mode 与实际 effective；控件只请求变更，由宿主确认和同步。受控模式不隐式读取或写入另一个 storage key，宿主可桥接已有 JSON 并保留其他字段。销毁、重新创建和重复挂载释放旧订阅，不保留旧 owner 的监听。本协议的主题作用域是文档根，子树主题须另行设计和验证。

### 表单编排的公共入口

此次编排依据用户指定的 [Stitch v2 设计](https://stitch.withgoogle.com/projects/13033986353155220257)及与其逐项确认的容器宽度、动作、反馈与滚动规则。Stitch 负责视觉与交互设计，xui 对真实公开接口、可访问性与工程证据负责；不复制图稿中的虚构业务字段或另造控件皮肤。完整接线见[页面编排 React](../examples/page-composition-react/app.tsx)，合成数据不证明产品业务流程。

FormGrid 按自身容器净宽形成一列或最多两列，使用 layout-field-min 与 layout-field-gap；默认值在根字号16px时为240px与16px，两列阈值496px。净宽不足时回到一列，增加根字号会同步提高阈值；不按整个窗口宽度猜抽屉可容纳的列数。columns=1 可显式单列；FormGrid.Item span=full 用于长标签/说明、整行确认、错误摘要和规则编辑。保持 DOM 阅读及 Tab 顺序，短相关字段可同行，标签明显不对称时跨列，不固定标签行数或隐藏全文来凑对齐。Fieldset 的 layout=stack 用于纵向分组，默认 inline 保持原有成组选项兼容。

FormActions 在所属表单末尾或公共 Footer 中放置动作：secondary 在前、主操作组在后；宽度足够时分别靠起止边，窄时自然换行，按钮按内容宽度，不默认拉满。Sheet 继续由自己的 Body 滚动、Footer 提供动作，不增加第二层正文滚动。侧向 Sheet 在不超过40rem的视口全宽；导航抽屉仍遵守独立宽度。焦点四边留出 focus-width+focus-offset，不能把默认4px当成新的静态设计值。

React使用layout/forms/feedback正式子入口；纯排版不增加表单或请求owner。具体组合见[组件手册](COMPONENTS.md#表单与页面编排)。

### 数据刷新与视图连续性

刷新更新的是当前范围内的数据与相关状态。正常重新渲染可以更新已有DOM，不等于卸载重建。首次加载、已有内容刷新、可用、空结果、失败与显式重试必须区分；请求、鉴权、超时、幂等及可重试语义继续由既有宿主owner持有，展示组件不接管这些事实。

| 场景 | 必须保持的行为 |
| --- | --- |
| 首次无数据 | 加载图标与文案整体相对所属组件的可见内容区水平、垂直居中；保留页面壳、标题和必要入口，不能先宣告空集合或零总数 |
| 同范围手动/自动刷新 | 已确认内容继续可见，局部busy/refreshing反馈；响应确认后更新相应记录。不清空rows/value、不隐藏整个区域、不重挂页面或表格来表现刷新，也不对未变化数据反复播放整块进入动效 |
| 刷新失败/显式重试 | 保留同范围旧事实与草稿，局部显示失败和实际可用重试；不能把旧数据标成新成功、把错误变成空集合，或自动重放业务写入 |
| 返回有效空结果 | 仅确认响应为空后更新为空状态；保留适用表头、筛选和恢复动作。空状态用简短事实与下一步，不能靠重复“已读取0条”、成排空表或长实现声明占满页面 |
| 身份/权限/对象/查询范围变化 | 按真实范围与权限清理或明确隔离旧事实，不能把旧范围结果当作新结果；不以保留画面为由展示已失去权限的内容。保留筛选草稿或导航位置须符合该范围合同 |
| 相同范围视图 | 页面壳、未变化记录/字段的身份、滚动、焦点、选择和未提交输入保留；真实记录删除或失效时按公共合同回到仍可用入口，不抢走宿主已转移的焦点 |

禁止用location.reload、整页导航、刷新父路由或销毁重建应用来实现普通数据刷新。禁止为同一次刷新使用随机/时间戳key，或用loading条件把整个正文替换为Loading再挂回；也不能把索引当成可排序/插入/分页记录的稳定业务身份。React组件type/key保持业务含义，避免在父render内重新定义子组件类型。真实对象切换或显式重置有其生命周期，需与普通刷新区分。

验收覆盖连续刷新、慢请求、刷新失败和恢复；检查Network是否出现主Document导航，检查页面壳/未变化记录的节点身份和组件mount/unmount，记录前后滚动、焦点与草稿是否保持。截图只能证明某一帧，不能独自证明没有闪烁或重挂。开发期HMR/依赖预构建导致的文档刷新与产品刷新分开归因，必要时在正式构建复现，不通过关闭HMR/StrictMode掩盖问题。

LoadingState 默认block在所属内容区居中，按父容器分配空间；无明确高度时采用语义Token最小高度并随长文自然增长，不相对窗口定位。表格保留表头，加载层在可见表体轨道内居中，不跟随横向超宽列偏移；CardGroup在body内居中，工具栏和footer不计入中心。集合首次等待使用一个status及装饰性Spinner，不叠加骨架列表。相同规则用于详情、卡片及其他组件的内容等待，使用公共LoadingState，不以私有CSS或全屏遮罩居中。表头实际测量值仅是React内部几何，不是公共Token。

LoadingState layout=inline 复用既有 Spinner 与一个 status 文本，无块级大留白或整块进入动效；DataTable 有行刷新使用该表现，已有表体与正常流底栏保持，首次无数据仍使用表体区域的居中加载状态。DataRegion feedbackLayout=flow 的空反馈不占空间，出现反馈后按自然高度进入文档流，不另造固定高度滚动槽；默认 reserved 保持兼容。两者只负责呈现，不持有请求或自动重试；DataTable 的底栏反馈仍由 DataTable 维护，不叠加外层反馈、计数或横滚容器。移动端可由宿主用同一确认数据组合 Card/Grid 卡片，也可保留语义表格在表体内横滚；不把私有 tr 改造成卡片，不为适配复制查询 owner。

### 前端状态与资源生命周期

同一请求、认证、查询、业务事实和编辑草稿各有明确owner，不因页面组合复制另一份。请求不在render中直接发起；effects依赖与订阅保持真实且稳定，不用依赖循环制造重复查询，也不以压制依赖检查掩盖旧闭包。并发请求按key/generation及明确业务顺序确认，取消/卸载后拒绝晚到结果，包括不合作的Abort Promise；旧查询不能覆盖新查询，旧任务的finally不能解除新任务的busy。

定时器、轮询、事件监听、订阅、连接、对象URL和组件布局观察器在所属生命周期结束时释放，重挂不增加重复监听或并发轮询。遵循已有公共生命周期，不能为自查新增竞争请求/缓存owner。未知、失败、未加载不填成功或零；乐观反馈须与权威确认区分，并有符合业务合同的失败处理。组件渲染异常与Promise失败分别处理，重置视图不自动重试业务请求。

性能结论依据真实请求/渲染/浏览器记录，检查重复读取、无界轮询、可避免的大块DOM重建、长任务和布局抖动；不能仅因没有memo、缓存或虚拟化就判失败，不为满足“最佳实践”清单强加一套引擎。语义、键盘、标签/错误关联与disabled/readOnly等基础交互继续遵循Components规范。


关键 CSS 预先构建并随首屏加载；非关键模块可以真正按需 import，并为模块或样式失败提供显式恢复入口。等待与失败期间关键内容和操作仍可读、可用；状态区域避免无必要位移。首屏预算必须统计实际同步初始化、静态依赖和必要 CSS。组件按需消费检查最终输出贡献与压缩字节，不以源文件 imports 或 sideEffects 声明替代证明。

公共产物须能在独立安装中消费正式 exports 和类型，不能暗依赖 monorepo 源码别名或下游扫描依赖目录。框架 peer 保持宿主单实例；本地 watch 覆盖规范、样式、控件、类型、初始化脚本、包入口和构建逻辑，失败明确记录，修复后重建；旧产物不能标记为本次成功。参考消费者的体积、受控延迟和布局证据仅证明该消费者，产品采用仍须在真实页面验收。

### 公共界面缩放

`@coffeehc/xui-runtime/theme`（及runtime根入口）的 `setInterfaceScale(scale, options?)` 是唯一设置方法，React页面直接调用，不再封装另一套比例owner或设置组件。`InterfaceScale` 为 `1 | 1.25 | 1.5 | 2`，分别对应100%、125%、150%、200%；默认100%保留既有尺度。`options.window`只用于明确的同源iframe文档或隔离测试，不提供组件子树缩放。无浏览器时导入及合法调用均安全无操作；非法运行时参数抛出TypeError，且不改DOM/存储。

方法写当前document根的 `data-interface-scale` 与语义变量 `--interface-scale`，以 `--interface-root-font-size` 中的百分比派生根字号。文字、图标、rem间距、控件与布局约束共同放大；内容根据实际可用宽度换行，表单继续按净宽决定列数。展开侧栏使用公开nav-sidebar-min-width/max-width约束，默认分别为9/12个nav-item-height（100%时324/432px），首选25vw，并以50vw封顶，为中等视口放大后的正文保留至少一半宽度；compact rail和窄屏抽屉保持各自合同。视口百分比/上限不机械倍增，细边框、焦点线、媒体查询阈值和真实像素测量保留各自语义。该方法不采用transform或CSS zoom，不重挂组件、不刷新Document、不发业务请求、不创建订阅。浏览器默认字号与浏览器zoom仍独立生效；宿主不得用固定html字号、组件尺寸补丁或第二套CSS zoom覆盖此owner。

合法设置保存在当前同源标签页的sessionStorage键 `ui.interface.scale`，值为上述倍率字符串；与主题键独立。正式 `@coffeehc/xui-runtime/init.js` 在CSS和可见内容之前同步加载，首屏恢复比例，即使已有主题owner也会恢复。无值、非法值、读取失败均保留默认100%；写入失败仍即时应用当前页，不伪称已经持久化。切回100%调用 `setInterfaceScale(1)`。刷新/同标签页导航保留；关闭会话后的生命周期遵循浏览器sessionStorage，复制标签页/opener可能复制初值，不能宣称所有新标签页都强制重置。

缩放设置只改变呈现；正在输入的值、节点身份、焦点及选区必须保持。动态放大后仍通过原有滚动边界到达动作，关闭弹层焦点仍回到触发器。验收分别记录界面倍率、用户文字设置和真实浏览器zoom，不互相冒充；浅/深/system、桌面/窄屏、长中文与错误/刷新状态均沿用原合同。

### 公共文字比例与设计值验收边界

--font-scale 是统一文字比例，默认1；--line-height-scale 默认引用 --font-scale，可单独增加行距。两者均为无单位number，正常支持0.5至2，超范围数值按此范围夹取；支持@property的浏览器中非数字或带单位值回退1，遵循[CSS Properties and Values API](https://www.w3.org/TR/css-properties-values-api-1/)的类型与初值规则。旧浏览器仍可消费有效number，宿主不得提供非法输入；不宣称未验证旧引擎也有类型回退。覆盖必须在同一:root的product-overrides层，不能只改子树根并假定祖先派生别名重算。

七组字号按原rem尺度乘比例并保留0.75rem阅读下限，即默认16px根字号下12px；七组行高同步派生，且不低于该角色原有行高/字号比。仅改font-scale会连同行高调整；只增line-height-scale会增加行高，不改变字号。字号缩小不改变spacing、控件最小高度、图标、边框或圆角；文字放大时内容可自然增高/换行，不能承诺控件实际盒子永远固定。默认html根字号由浏览器/用户偏好决定；采用公共界面缩放时在该基准上乘所选倍率，rem下限与文字随用户放大，不用固定px上限压制200%文字。此入口不增加密度UI或本地持久化，不更换默认品牌；默认1的既有文字与布局值不变。实际浏览器zoom与根字号200%测试分别报告。

设计值只在design-default-css集中声明，组件CSS及库自建行内样式必须消费语义var。范围包括字体/字号/行高/字重、留白/尺寸/边框/圆角、颜色与混色权重、层级、动效时间与中间透明度；不能在var后混入局部设计倍率或fallback设计值。新增必要组件参数保留既有默认值，不以复用数值为由错误绑定其它组件的语义。

结构例外不是第二套设计尺度：0、auto/none/inherit/currentColor/transparent、占满容器或视口的100%/100vw/100dvh、flex伸缩0/1、grid分列数量与fr、网格可用宽减单个gap后等分两列的几何、居中50%/translate(-50%)、正负号反转、视口减去两侧边距的乘2、显隐端点0/1属于结构/几何。SVG的viewBox/path坐标与独立品牌图片资产是图形内容；实际呈现的图标尺寸/线宽继续使用语义变量。原生CSS media查询不支持var，48rem/47.999rem导航断点与40rem或等价640px示例断点作为显式查询例外；JS匹配同一断点。getBoundingClientRect等实际测量值、日历日期位置与宿主显式style/stickyOffset参数是运行时事实，不得借此注入静态默认设计值。无障碍隐藏技术尺寸有独立a11y token。宿主Markdown/代码/领域阅读内容不做全局UA重置；库自建文本用明确角色，外部内容由宿主拥有。

源码门禁扫描theme分片、公开示例和库源码中的静态设计值，负例覆盖不含var的值以及夹带倍率/fallback的伪token化。独立正式包消费者验证默认值、0.95/0.9、小字下限、独立行距、浅深/system、窄屏/菜单/键盘与文字放大；扫描通过不替代浏览器视觉证据。


### 响应式Dialog与侧向Sheet宽度

Dialog偏好layout-dialog-width-ratio=40%，min/max分别24rem/48rem；Confirm偏好30%，min/max为20rem/32rem；侧向Sheet偏好60%，min/max为24rem/64rem。layout-dialog/confirm/drawer-width仍是公开组合结果，可单独覆盖；比例与rem边界均集中定义。普通Dialog/Confirm最后用视口减去两侧layout-viewport-inset封顶，min下限不能让320px视口溢出。侧向Sheet紧贴边缘、窄屏封顶完整视口；上下Sheet只使用独立layout-sheet-block-size与sheet-max-block-size，绝不把横向百分比再用作纵向尺寸。

1280px宽、16px根字号下，Dialog/Confirm仍为512/384px，侧向Sheet改为768px；1920px时分别768/512/1024px上限。窄屏由各自最终视口约束决定，不能只验证字符串。导航drawer继续由nav-drawer-max-inline-size限制为默认288px，独立于这些详情面板；展开侧栏按本轮授权改为324px，紧凑侧栏保留60px。本段是用户追加的响应式宽度默认变更，不能并入“其余设计token迁移默认不变”的声明。

### 公共布局插槽与默认顶栏工具

AppHeader/AppShell/MenuLayout在右侧默认提供一个主题图标按钮，light→dark→system→light循环；复用文档现有theme owner，不另建存储。语言入口只在locale.enabled显式true时显示，语言value/options/onValueChange与词典均由宿主现有i18n owner提供。顶栏主区域、工具组与独立账号区，以及sidebarHeader/sidebarFooter、pageHeader/pageToolbar/content/pageFooter的顺序和所有权见[公共布局插槽](COMPONENTS.md#布局与顶栏)。这些槽只消费公共var及布局原语，不授予产品动作、不放新业务内容默认值；空槽无视觉占位，更新保留正文与导航实例，导航抽屉仍只拥有一份侧栏。默认登录页继续仅继承外观，不新增这些顶栏工具。

### 有界工作区与平台前置安全区

公共scrollMode保留document默认自然滚动与viewport独立main滚动，新增workspace显式工作区模式：shell默认100dvh，header自然换行，main按自然pageHeader/pageToolbar/pageFooter占用分配剩余确定高度给content；库默认维护min-block-size:0与弹性收缩链，layout-workspace-content-min-block-size是显式可覆盖的内容下限（默认0px、受100dvh约束），业务区域通过公开内容组合选择内部滚动owner。不得要求消费者减固定header高度、修私有selector或绝对定位发送区。大于可用高度且不可拆分的内容保留滚动可达兜底，不把文字或操作裁掉。公开root尺寸可由已知宿主窗口大小覆盖，不更改既有默认尺度。

公共 `contentInset` 使用共享 `ShellContentInset = 'standard' | 'edge'`，默认 standard。edge 仅在 workspace 移除 shell main 的页面内距与 content 的焦点 gutter；header、品牌、sidebar、页内槽自己的布局以及控件/卡片内距保持各自合同。document/viewport 保留原间距并记住选择，切回 workspace 生效。`ScrollArea.Viewport.focusMode='inset'` 是独立显式选项，默认 gutter，不由 edge 递归推断。零 gutter 与原宽度/颜色的内部焦点指示在同一 CSS @scope 增强中启用；最近 ScrollArea、弹层及其他公共滚动边界拥有自己的策略，嵌套默认 gutter 不受外层 edge/inset 覆盖。不支持 @scope 的旧引擎保留原有安全绘制空间，不以缺失焦点换取贴边；这里不构成各浏览器或旧 WebView 的实测声明。Surface 可显式 `padding='none'`，仅省略该表面的 card-padding，保留背景、边线和圆角，不新增裁切。

headerSlots.leading是可选、默认空且不收缩的最前区域，位于自动导航按钮之前；品牌继续独立。库负责顺序与窄屏布局，不内置macOS窗口控件尺寸或平台检测。平台/全屏状态、安全区真实尺寸、drag/no-drag由宿主集成提供，不把业务/OS规则带入默认皮肤。完整合同及React正式消费者见[布局插槽](COMPONENTS.md#布局与顶栏)。


### 富导航行与独立辅助动作

带层级、图标和描述的业务导航保持普通nav/link/button语义。主要导航/展开控件与行尾辅助button必须为sibling，标签只包含非交互描述，不能嵌入button/link/input或伪装成listbox option。库维护单一roving停靠：上下/Home/End遍历可见可用控件，左右只处理主控件的层级，辅助动作Enter/Space不触发导航。ContextMenu的浮层键盘和回焦点保持独立，不能借事件穿透要求消费方stopPropagation。库提供公开单元素renderer与稳定slot生命周期；disabled继承，busy和业务防重复由宿主明确提供。

行尾按钮和紧凑排列复用现有control/nav/space语义变量，根据可用窗口自适应；紧凑辅助按钮在同项下一行，不写产品固定宽高或加宽轨道。共享查询、各组独立cursor/hasMore、关闭取消与迟到丢弃属于宿主，不在通用组件猜total/pageCount或内置领域请求与写入。可用Input、Section/Disclosure、独立NavigationMenu与组外加载按钮组成富分组导航，简单选择仍采用原有listbox合同。

### 公共表格整体与紧凑顶栏工具

完整DataTable复用Table/Toolbar/Field/Pagination/DataRegion原语。共享DataTableLayout明确natural/workspace/document；默认natural，少量/零行随内容自然收缩，以max-block-size:100%对实际有界父级限高，多行只滚动表体，真实计数、唯一每页条数和分页留在同一正常流底栏。父级高度为auto时仍按文档流增长，不自动创造视口边界。显式workspace保留旧填满正文和组件最小高度；document在有界父级也不采用高度上限。依赖旧默认填满的调用必须显式选workspace，shell的scrollMode默认不变。

标题/主操作可置于既有pageHeader；内部toolbar、表体与footer共用一层frame，已有行的反馈位于footer计数区域，无反馈不在thead上方预留空行，外部pageToolbar仍可放筛选但与内部toolbar二选一，不复制搜索或查询owner。保留列头、行和底栏信息边界，不额外复制工具条下边框、要求宿主测量pageHeader或定位分页。筛选采用data-table-filter-min，搜索可沿长字段尺度增长，窄屏自然换行。data-table-min-block-size保留为显式workspace组件下限，不强制natural填满，也不是固定表体高度。workspace shell的layout-workspace-content-min-block-size默认0px保留旧收缩语义；需要极端超高页头下非零正文视口的组合，须在shell公开style显式绑定为var(--data-table-min-block-size)。该下限受100dvh约束，main可自然滚动，不改变natural表格的内容高度。库不通过父级:has探测表格，不测量或固定页头高度。设计门禁仅允许这个精确语义alias赋值，不放宽任意token重定义、裸尺寸或fallback。

DataTable以内部单一布局观察器测实际table/thead/首末行高度和computed scroll-padding/滚动条，取完整内容高与可读边缘行高度的较小值作为Grid表体轨道下限，再加组件自身toolbar/footer（含反馈）的实际高度与frame边界作为组件根的实测最小高度；workspace与原token取较大者，document不加根下限，不用CSS min-content查询替代实际chrome。只观察内容输入，不观察写入尺寸的root/frame；不按行数分类、不硬编码表头高、不新增宿主布局参数。超高chrome由完整frame自然撑起并由祖先滚动，footer始终属于外框。读写按帧合并、无变化不写、隐藏后恢复重测、销毁释放；不承诺任意超高中间行完整同屏，允许既有stickyHeader关闭或document布局。此高度owner不修改独立列宽observer与colgroup。

DataTable默认横向铺满，通常省略列宽；仅在列内容或用户尺寸配置确有需要时，通过公共width提供数字像素、CSS长度、百分比和calc()/clamp()下限。未配置列优先吸收余宽，全部配置时由浏览器在这些列间分配余宽；下限总和超出表体则在表体内横滚，不压缩已配置下限。这不是重定义品牌色、字体、间距或装饰token的许可。库用非交互、零高测量轨道让浏览器以表体可用宽度解析百分比表达式，再由同一colgroup统一表头与数据列；测量不得制造滚动范围、可访问节点或另一套宿主布局逻辑，更新/销毁必须释放观察。未配置宽度保持原有自动表格算法，完整迁移及长内容边界见DataTable合同。

通用记录页按任务把名称/摘要与真实状态前置，不重复页面标题作可见表题；表格仍有准确可访问名称。显式 xui-record-table 中的主列使用 table-primary-min-inline-size（默认复用字段最小宽度），短状态、行操作、时间和计数保留完整词组，次要列在表内横滚；不将此规则施加到普通 Table 或用户自定义长正文列。空反馈与隐藏辅助动作不预留占位，实际错误及风险仍完整可读。

空数据保留列头，empty/加载/错误在表体结构内各自表达；刷新保留既有行和焦点，恢复入口可达。查询、列内容、权限、页基数与总数属于宿主事实，既有分页保持受控；本地分页由宿主筛选/排序后切片并发布事实，服务端分页保留确认响应且不二次切片。未知total/cursor不得伪造编号页数，组件不新增HTTP/query owner。列表wire由commons/webfacade统一：total省略表示未计算，0是真实零；next_cursor缺失表示未声明，非空字符串是opaque续页token，null是cursor明确末页，可与total共存。DataTable保留旧offset类型与默认值，新增显式cursor受控模式复用框内前后控件；即使有total也不算编号页数，宿主唯一owner负责历史与响应确认。完整API与React公共消费见[DataTable](COMPONENTS.md#数据表格)。

顶栏secondary相邻工具组与账号区采用space-control-gap；图标/账号入口保留原按钮尺寸、内边距和命中区，不用负margin/order掩盖间隔。顶栏locale采用无常驻边框的工具栏表现，透明边框保留几何，装饰性SVG为control-icon-size、两侧space-control-gap，hover/pressed/disabled分别复用interaction-hover/interaction-pressed/muted，focus-visible独立保留；普通表单 SimpleSelect 保留输入边界。默认采用同一主题选择浮层，forced-colors 保留公共控件的边界、选中与键盘焦点语义。

实体身份的固定认证/Key HTTP 合同默认正 int64 decimal，可显式 idEncoding="hex" 选择严格小写无前导零 hex，前后端同配；未知编码、非规范值拒绝，不按外观猜测或转 JS Number。公开解析入口与纯视图不透明 ID 边界见[身份编码](PUBLIC_API.md#显式实体身份编码)。

原生输入外壳、文件选择按钮、range轨道/拇指、color色块边界和progress轨道/填充由同一语义变量提供；文件按钮复用muted/foreground、button-disabled-*和交互状态，range轨道用space-control-gap、拇指用control-icon-size，range-thumb-offset集中定义其垂直居中关系。color色块保留真实选择值。Checkbox indeterminate必须显示横线，不能以checked或仅颜色代替；choice/fieldset错误边界仍用status-error-foreground。progress有value时按真实value/max绘制，无value保留原生indeterminate语义，用状态脉冲而不虚构百分比；reduced-motion静止。forced-colors下progress保持原生元素、真实value/max与未知语义，采用浏览器提供的Canvas轨道、CanvasText边界与填充；颜色只由progress-forced-track/border/fill集中定义，design-accessibility层保证它们继续取系统色，不接受品牌覆盖。使用既有line-width-surface与radius-full，保留轨道形状并补可识别边界；确定状态按原生比例填充，无value仅显示由progress-forced-pending-border-style声明的空心虚线轨道，不画合成分数或全满填充，且保留已有状态脉冲及reduced-motion静止。forced-color-adjust继续为auto，不关闭用户强制颜色机制；appearance:none仅保留原生progress内部的真实比例布局与可控CSS动效，不能把computed appearance:auto当作浏览器原生绘制已恢复的证据。Checkbox/range等选择标记继续恢复各自的浏览器绘制。文件/日期/颜色系统窗口、密码管理器、自动填充建议及移动键盘属于浏览器/OS，不承诺CSS统一其界面，不移除number/date/search原生编辑能力；file/range/color不支持HTML readonly，不得只加属性就声称只读。

公共 SimpleSelect（包含顶栏语言入口）的浮层选项之间使用 space-text-gap（默认 4px），选项组与组内标题/选项同样保留该间距；选中与悬停背景不得垂直贴合。间距由公共样式负责，不改变选项最小高度、弹层定位或隐藏语义。

HeaderBrand logo盒使用control-height-sm，图片/SVG以contain限于盒内，不被固有尺寸或长名称撑大。桌面compact无leading时logo中心对齐nav-collapsed-width侧栏中心，补偿layout-content-inset只影响品牌，不改变toggle与内容起点；有leading保留平台安全区。

### 通用搜索与操作工具栏

SearchToolbar 是 Toolbar、输入与按钮之上的纯布局/披露组合。search、actions 和 advanced 是公开内容入口，不增加查询、分页、权限或请求 owner。宽屏搜索轨道采用 flex 剩余空间与 min-inline-size:0，主操作在行末；Input 的 100% 默认宽度只相对于搜索轨道，不把操作挤到下一行。操作组按 control-height、button-padding-inline、button-gap、control-icon-size 统一按钮尺寸；长标签可自然增高，同一行 stretch，不以固定高度裁切。工具栏按自身容器 40rem 既有断点换行，搜索独占一行，操作仍完整可达，不只依赖窗口宽度。

高级内容显示于下方，defaultExpanded 默认 false，可为 true；expanded/onExpandedChange 受控时只请求下一状态，宿主回传后才改变展示。只有非空 advanced 槽才显示一个具有可访问名称、aria-expanded/controls 的原生按钮，Enter/Space 采用按钮默认激活。折叠保留内容节点和值，并以 hidden/inert 同时退出绘制、键盘及辅助技术；程序收起时仅在焦点仍属于该区域时返回触发器，不抢走宿主已移走的焦点。更新不重挂搜索/动作/高级节点，也不重复绑定事件。四边保留 focus-width + focus-offset 绘制空间，没有 overflow 裁切或另一套焦点皮肤。具体接口和生命周期见 [弹层与工具栏](COMPONENTS.md#searchtoolbar)。


### 受控成组选项

CheckboxGroup/RadioGroup 复用 fieldset/legend、choice 与 help/error 的既有间距、控件尺寸、焦点和错误语义 token。全选部分态复用原 indeterminate 横线；只读/禁用仍保留明确原生状态，不以颜色代替。没有新的权限引擎、字体或密度。完整受控值、诊断、校验与React入口见 [成组选项](COMPONENTS.md#成组选项)。

### 多行输入组合

InputGroup.Root 的 layout 默认 inline，stacked 仅把原生控制项与上下 Addon 按 DOM 排成纵列。InputGroup.Textarea 直接复用 Textarea 的类型、Field、ref、label/help/error/required 与原生换行、选择、resize/readOnly 合同，只保留 xui-textarea 类。外层拥有唯一背景、边界与 focus-within；直接 Input/Textarea 无第二层边框/outline。invalid/disabled 只投影直接真实控制项或已有 Field error，单独禁用工具按钮不把可编辑正文变灰。Addon 保持 span，只放合法短语内容、附件文字与按钮；stacked 自然换行并采用既有间距，空槽不占位。不增加 Toolbar part、第二个状态 owner、Enter/IME/提交拦截或附件业务能力。完整公开组合见 [选择与复合控件](COMPONENTS.md#多行输入与上下工具区域)。

### 专用输入组合

NumberInput、PasswordInput、SearchInput 复用 InputGroup 的唯一输入边界与既有 input-action、control-height、control-icon-size、焦点和禁用 token。数字草稿/确认值分开，密码仅显隐与清理，搜索仅提交/清除意图；没有新颜色、密度、请求或认证 owner。帮助/错误继续采用 Field/native field 的关联。行为和安全边界见 [文本输入](COMPONENTS.md#文本输入)。

### 最小按钮的实际内容几何

xs上下内距由button-padding-block-xs按实际body-sm行高及按钮line-width-surface双边框居中推导，并下限钳制为0；border-box下默认短行24px，文字放大或换行可自然撑高，不能固定height裁字。不新增字号或密度开关；公开变量可独立覆盖，其余尺寸不随此变量改变。

### Dialog 极端高度可达性

常规有界窗口保持 Body 为唯一活动滚动区域且 Footer 可见。内部布局 owner 以弹层可用高度、非 Body 内容实际需求及 `dialog-body-min-block-size` 判断：该派生变量由一个普通控件高度和上下焦点绘制空间组成，不是固定内容高度。标题或操作区过长、窗口极短导致剩余空间不足时，整个弹层成为唯一滚动区域，Body 自然增长并停止自身滚动，关闭/标题/说明/操作均可滚动到达，此时不承诺 Footer 同时同屏。默认无测量/SSR/ResizeObserver 不可用时采用整体可达模式；测量就绪且预算足够才切换正常 Body 模式。不重挂内容、不修改字段/焦点事实。长标题/长说明可显式放入 Body，Header 保留关闭操作区，但既有 Header 长内容组合仍受极限可达合同保护。

<!-- foundation-lifecycle:end -->

### Calendar 查看月份与日期选择

Calendar共享model独立管理查看月份与已选日期。公开month/onMonthChange和model.setMonth复用原有ISO公历、UTC字段及键盘合同；月份定位不触发日期选择。受控确认与拒绝保持一个可见roving停靠，外部跳月不抢走公共年月控件焦点；浏览与选择的事件合同见[组件手册](COMPONENTS.md#选择与复合控件)。快速定位由公共Input/SimpleSelect/Button组合，不引入OS日期弹层或消费者私有DOM。

### 菜单危险语义

普通Menu/ContextMenu动作Item可选tone=danger。默认危险文字与图标使用status-error-foreground，hover及键盘高亮使用status-error-soft/foreground，pressed使用action-danger/action-danger-foreground；disabled和独立focus继续沿菜单公共变量。无新颜色或产品皮肤，确认及权限归宿主。见[菜单危险操作语义](COMPONENTS.md#菜单危险操作语义)。

### DataTable 行交互扩展

公开rowEvents在现有语义tr上分发当前记录与稳定键，不新增伪按钮/自动tabIndex、选择引擎、查询或提交owner。独立cell交互和已取消事件由共享边界隔离，busy/disabled抑制行快捷动作，保留既有单元与读取能力；鼠标快捷方式配正常Button/link键盘等价入口。状态/布局/分页及皮肤不变，完整合同见[数据表格](COMPONENTS.md#数据表格)。

### 接入反馈的状态与输入扩展

完整登录页和新密码组合的显隐密码名称可通过同一公开配置翻译，装饰 logo 显式输出空 alt。初始化页可选手动只读权威核对，checking/失败/完成沿用公共反馈；未确认结果继续锁定写入，不自动重放初始化、登录或新增恢复协议。Key 吊销后的能力以普通权威列表为准，读失败不推断授权。

Textarea 自动增高由公共控件显式启用并声明 maxRows，使用已有文字/尺寸语义，不新增皮肤或默认高度；保留草稿、IME、焦点、required/readOnly/disabled 与所属弹层滚动，超过上限内部滚动，内容减少缩回。stacked InputGroup 的公共 flex 与共享测量协作，仅在启用自动增高期间按测量高度排列，避免尺寸被纵向 flex 压缩；关闭后恢复原 flex、手动 resize 与 rows。具体React合同见[组件手册](COMPONENTS.md#textarea-可选自动增高)。

### 通用长标题展示

OverflowText仅承载名称字符串，不拥有h3、图标、归属Badge、摘要、footer或动作。公共文本部件占其分配的剩余净宽；仅此文本在鼠标悬停或现有交互表面内的键盘焦点停留后单次滚动至末端，离开且失焦复位。text-overflow-scroll-delay/speed定义共享节奏（400ms、40 CSS px/秒），原nav-label-scroll-*保留同值别名与原覆盖合同。没有溢出不播放动画；无现有键盘入口、触屏/粗指针、减少动效、缺少动画支持或JS未运行时显示完整静态换行，无空格英文也可折行。全文始终保留可访问名称，不新增Tab停靠、伪按钮、业务状态或查询owner；公共标题接口见[长标题](COMPONENTS.md#通用长标题)。

### 卡片集合布局与状态

CardGroup 是与 DataTable 同层的受控集合组合。rows 是宿主当前确认的记录，rowKey 是稳定身份，renderCard(row, context) 返回 Card 的 title/icon/badge/actions/description/children/footerMeta/footerActions 等公开配置；由集合创建 Card 实例，不接收替换整个卡片的 JSX。业务输入、权限、草稿和动作由宿主负责；模板内的组件类型保持稳定。

集合独占 toolbar、body 和 footer：toolbar 与计数/状态/分页均在 body 外，宿主选择 pageToolbar 或集合 toolbar 一处接线。body 使用有序 DOM 阅读顺序的语义列表；按容器净宽自动分列，以 card-group-item-min（默认依赖 layout-field-long-min，根16px时288px）为期望下限，不足时一列。卡片按内容自然高度、顶端对齐，不等高、不固定三段高度、不为整组添加第二层卡片皮肤。分组 gap、焦点 gutter 与已有语义 Token 共用。natural 随内容并受有界父容器约束；workspace 占满父容器，正常高度只有 body 滚动；极短父容器保留 card-group-body-min 的正文轨道（默认依赖 feedback-slot-block-size），整个集合可滚动，不能把正文压到仅剩焦点padding；document 随文档自然增长。

状态、offset/cursor 分页、真实/未知 total 与同回合请求防重入和 DataTable 使用同一纯 TypeScript 模型及 React footer。首次无记录加载仅在 body 内提示；同范围刷新与刷新失败保留 rows、key、Card/输入节点及焦点，footer 显示局部刷新或错误/显式重试。busy/disabled 阻止集合分页和重试意图，context 提供 busy/disabled 事实，业务控件按动作语义采用；不递归改写 slots 中的业务控件，不把被动卡片变成按钮。集合不请求、不缓存、不排序、不确认写操作，也不复制 query/resource owner。接口及示例见 [CardGroup](COMPONENTS.md#cardgroup)。
