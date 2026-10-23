---
name: XUI Electric Violet
description: High-signal AI workbench with six official paired light/dark palette families.
colors:
  primary: "#6d28d9"
  on-primary: "#ffffff"
  primary-dark: "#a78bfa"
  on-primary-dark: "#0c0717"
  foreground: "#191424"
  foreground-dark: "#f5f3ff"
  muted-foreground: "#5b536b"
  muted-foreground-dark: "#9b93b0"
  background: "#f8f7fc"
  background-dark: "#09070f"
  canvas: "#f8f7fc"
  canvas-dark: "#09070f"
  shell: "#f1eff8"
  shell-dark: "#0f0b1a"
  surface: "#ffffff"
  surface-dark: "#141024"
  support: "#f1eff8"
  support-dark: "#0f0b1a"
  raised: "#ffffff"
  raised-dark: "#1a152e"
  overlay: "#ffffff"
  overlay-dark: "#211b3b"
  muted: "color-mix(in oklab, #191424 7%, #ffffff)"
  muted-dark: "color-mix(in oklab, #f5f3ff 7%, #1a152e)"
  separator: "#e5e1f0"
  separator-dark: "#29213d"
  surface-line: "#e5e1f0"
  surface-line-dark: "#29213d"
  surface-line-strong: "#8b819f"
  surface-line-strong-dark: "#817397"
  input-line: "#8b819f"
  input-line-dark: "#817397"
  selected: "color-mix(in oklab, #6d28d9 11%, #ffffff)"
  selected-dark: "color-mix(in oklab, #a78bfa 16%, #141024)"
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

当前默认配色为 Violet 电光紫：以紫墨分层表面、紫色主操作与青柠身份强调构成 AI 工作台。深色为首次使用基准，浅色采用微紫壳层与白色内容面；翠绿成功、琥珀人工介入和红色错误保留独立状态语义，已有用户的明暗偏好继续生效。项目还可选 Ember、Forest、Crimson、Cobalt 或 Precision，亦可保留自己的品牌覆盖。Inter 负责界面文字，JetBrains Mono 负责代码、技术标识与表格数字；细边界和4px基础控件圆角表达工程精度。颜色、字体、间距、布局、状态及可访问性均由本文件统一定义，更换主题集中调整变量和前言，不逐页换色。

采用 Overview、Colors、Typography、Layout、Elevation & Depth、Shapes、Components、Do's and Don'ts 八段及可选 YAML token 前言组织。此组织方式不要求安装组件库、外部服务、特定设计工具或格式 CLI。

规范版本：4.2.38。以4.2.1为基准仅维护一条版本线，后续所有改动均递增末位（4.2.17、4.2.18…），不再分发或回补旧版本兼容包；架构变化也不递增前两位。版本号不承诺语义兼容，公共语义变化必须记录实际影响与迁移要求。三个包与规范同步版本，以固定源码 SHA、sourceGeneration 和正式产物核对交付。采用项目记录规范版本和产品扩展，不必搬迁原技术实现。

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

表现保持克制：以细边线和表面灰度区分层级，避免装饰 glow、厚投影和亮外框；微图标只在帮助识别时出现，反馈表达真实状态，密码强度按已有本地建议合同可视化。UI 正文使用 sans，数值、hash、时间与代码按职责使用 mono/tabular-nums，优先靠字重与对比分层而非扩充字号。同一任务突出一个明确主动作，轻反馈、边框焦点变色、键盘与 reduced-motion 共存。可复用表单内容与布局壳分开，按需求在独立页、Dialog、Sheet 或宿主步骤中组合；这不新增向导、认证能力、token 或评分事实。

### 规范强度与职责

- **必须 / MUST**：新增和本次触及代码的验收要求；不能满足时按本文例外流程处理。
- **应当 / SHOULD**：默认遵守；其他方案须说明场景和取舍。
- **可以 / MAY**：允许选择，不要求所有页面采用。

分为三层：通用基础定义语义 token、尺度、状态与可访问性；框架适配负责 CSS 映射、公共控件和通用图表；产品扩展负责领域状态、内容、专有画布及图表的数据投影。适配和产品扩展依赖基础，基础不能依赖业务路由、专属状态或框架 API。领域图形不因通用图表接入而失去自己的职责。

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

### 官方配色与项目品牌

4.2.13 默认配色为 **Violet 电光紫**，默认明暗偏好仍为 dark。配色、明暗、阅读缩放是三个独立维度；升级后未声明配色的项目会采用紫色，需延续青色的项目显式选择 `precision`。已有 `theme.css` 的 `product-overrides` 继续优先，不强迫品牌迁移。

| `theme.preset` | 配色与身份强调 | 项目选择 |
| --- | --- | --- |
| `violet` | 电光紫 / 酸性青柠 | 默认 AI 工作台 |
| `ember` | 熔岩橙 / 午夜蓝 | 冷暖对照 |
| `forest` | 森林绿 / 铜金 | 绿色品牌 |
| `crimson` | 绯红 / 靛蓝 | 红色品牌 |
| `cobalt` | 钴蓝 / 冰青 | 蓝色品牌 |
| `precision` | 中性石墨 / 青色 | 保留此前配色方向 |

每套具备 light / dark / system 配方；system 跟随操作系统明暗，不是第三种色板。所有配方随正式 `tokens.css`、`style.css`、`critical.css` 生成，不依赖 JS 注入颜色、额外网络请求或组件皮肤副本。配色只改变语义色，不改变 layout、slot、字号、尺寸和交互。具体配置、首绘与服务入口见 [项目配色与首绘](PUBLIC_API.md#项目配色与首绘)。

品牌的红色或绿色不代表成功、失败或危险。状态继续使用独立 `status-*` 变量，并有明确文字；必要时配合语义图标。不得让 `status-success` 或 `status-error` 引用 `action-primary`，不得仅以红绿点表示结果。危险菜单使用公开 `tone="danger"`，确认与实际写入仍归宿主；同一列表中的常规动作优先 ghost / link / outline，不因品牌鲜明而堆满实心主色按钮。

项目仍可在 `product-overrides` 覆盖公开语义 Token，或以官方配方为基底只覆盖品牌差异。使用颜色必须成对考虑前景/背景，并覆盖 light / dark / system；自定义配色由项目重新验收普通文字和链接 ≥4.5:1、必要控件边界与焦点 ≥3:1、持久选中、错误和禁用状态。不能通过私有组件选择器、字号覆盖或 `!important` 修主题。

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
| 共享尺度 | spacing、space-*、control-height[-xs/-sm/-lg]、control-icon-size[-xs]、radius-*、line-width-*、focus-* | gap4/8/12/16及图文6；高36/24/32/40；图标16/12；圆角2/4/6/8/8；线1/1/2；焦点清距Token保留2+2px |
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

默认值只有本文件一份，生成 CSS 后由 React 公共组件消费。`scripts/tokens.mjs` 在生成和检查时验证依赖方向、完整图、浅深/system 配方与来源指纹；设计值守卫检查组件、示例中的原始色值和私造尺度。新增 token 必须说明角色、依赖、覆盖范围及两主题行为，不按每个页面/slot 再造变量。主题 owner 仍负责 sessionStorage 与首屏；组件不各自读 storage 或判断主题。4.2.38起，同一Document内替换html根或清空根上的公共主题/缩放属性，由既有ThemeService自动恢复当前投影；保留内存偏好与同一订阅，不增加存储写入或第二owner。具体恢复、退出及宿主hydration边界见[主题生命周期](PUBLIC_API.md#主题根节点恢复4238)。

[Stitch 架构参考](design-sources/stitch-token-architecture.v1.txt)提供三层 Token、自包含组件与视图连续性的方向；实际合同采用本文件已公开名称、尺度、三模式和无障碍规则。参考中的原始色值不替换现有品牌；普通正文不统一 mono，不新增 10/11px 提示角色；密码显隐保留键盘入口、label/错误关联，密码评分沿用公开建议而非安全熵事实。错误可自然增高或使用已有反馈槽，不能绝对定位遮住字段；管理员创建后的认证与导航由真实宿主事实决定，不内置自动登录承诺。

公共链接自4.2.24默认无下划线：Typography.Link、LinkedText、xui/xui-layer样式范围内原生a及Button的link变体在默认、hover、pressed、focus和visited均不添加下划线。品牌色和真实链接语义保留，键盘focus-visible不新增外框，无边框链接保持原外观；字体继承所属文字槽。导航/控件在forced-colors下表达选中事实的下划线不是链接装饰，仍保留；不影响xui范围外的普通HTML。消费者不复制局部链接皮肤。

Button 的 link 变体默认使用 action-primary 与透明底；hover及悬停期间pressed使用成对的interaction-hover / interaction-hover-foreground，图标继承currentColor。普通字号文字按实际合成背景达到4.5:1，不能只验证静态主色对白底；disabled仍只采用禁用配方，busy不改变交互权限。

记录型Explorer的表头和三态/分类标签使用既有完整词组角色；摘要保留主列最小宽度并自然换行，计数和时间保留单行。空间不足由表内横滚承接，不缩字号、不改变cursor/as_of或刷新owner。

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
    --palette-primary: #a78bfa;
    --palette-on-primary: #0c0717;
    --palette-secondary: #bef264;
    --palette-on-secondary: #132205;
    --palette-foreground: #f5f3ff;
    --palette-muted-foreground: #9b93b0;
    --palette-background: var(--palette-canvas);
    --palette-canvas: #09070f;
    --palette-shell: #0f0b1a;
    --palette-surface: #141024;
    --palette-support: var(--palette-shell);
    --palette-raised: #1a152e;
    --palette-overlay: #211b3b;
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-separator: #29213d;
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --palette-input-line: #817397;
    --palette-info: #06b6d4;
    --palette-info-foreground: #22d3ee;
    --palette-warning: #f59e0b;
    --palette-warning-foreground: #fbbf24;
    --palette-success: #10b981;
    --palette-success-foreground: #34d399;
    --palette-error: #ef4444;
    --palette-error-foreground: #f87171;
    --palette-error-surface: var(--palette-error);
    --palette-state-base: var(--palette-surface);
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
    --selected-weight: 16%;
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
    --input-surface: var(--palette-surface);
    --interaction-focus: var(--action-primary);
    --interaction-selected: color-mix(in oklab, var(--action-primary) var(--selected-weight), var(--selected-base));
    --interaction-selected-foreground: var(--action-primary);
    --interaction-hover: var(--muted);
    --interaction-hover-foreground: var(--foreground);
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
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
    --chart-plot-block-size: 14rem;
    --chart-min-inline-size: 18rem;
    --chart-category-min-inline-size: 5rem;
    --chart-bar-band-ratio: .72;
    --chart-bar-fill-ratio: .85;
    --chart-inspector-block-size: calc(var(--line-height-body-xs) * 2);
    --chart-tick-offset: -50%;
    --chart-dash-length: .5rem;
    --chart-dash-gap: .25rem;
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
    --query-field-min: 10rem;
    --query-field-primary: 30rem;
    --query-field-compact: 12rem;
    --query-field-standard: var(--layout-field-min);
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
    --button-icon-inset: max(0px, calc((var(--button-height) - var(--icon-container-size)) / 2));
    --button-icon-padding: max(0px, calc(var(--button-icon-inset) - var(--line-width-surface)));
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
    --card-actions-gap: var(--space-text-gap);
    --card-icon-size: var(--icon-container-size);
    --card-icon-offset: max(0px, calc((var(--line-height-section-title) - var(--card-icon-size)) / 2));
    --card-icon-background: var(--icon-container-background);
    --card-footer-background: var(--muted);
    --card-footer-meta-min-inline-size: var(--control-height);
    --card-group-body-min: var(--feedback-slot-block-size);
    --card-group-item-min: var(--layout-field-long-min);
    --card-padding-small: calc(var(--spacing) * 2.5);
    --menu-min-width: 8rem;
    --menu-item-min-height: calc(var(--spacing) * 7);
    --menu-padding: var(--space-text-gap);
    --menu-radius: var(--radius-xl);
    --floating-offset: var(--space-text-gap);
    --popover-width: 18rem;
    --toast-width: 24rem;
    --toast-icon-offset: calc((var(--line-height-body-sm) - var(--control-icon-size)) / 2);
    --toast-viewport-max-block-size: 40dvh;
    --popover-padding: var(--space-content-gap);
    --tooltip-max-width: 20rem;
    --table-cell-padding: var(--space-control-gap);
    --table-action-gap: var(--space-text-gap);
    --table-action-max-inline-size: calc(100cqi - (var(--focus-width) + var(--focus-offset) + var(--line-width-surface)) * 2);
    --metric-padding: var(--space-content-gap);
    --metric-gap: var(--space-text-gap);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
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
    --nav-sidebar-min-width: calc(var(--nav-item-height) * 5 + var(--space-content-gap));
    --nav-sidebar-max-width: calc(var(--nav-item-height) * 6 + var(--space-control-gap));
    --nav-sidebar-width: min(clamp(var(--nav-sidebar-min-width), 16vw, var(--nav-sidebar-max-width)), 50vw);
    --nav-reveal-close-delay: 150ms;
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
    --icon-color: currentColor;
    --icon-container-size: var(--control-height-sm);
    --icon-container-background: var(--muted);
    --nav-icon-background-inset: max(0px, calc((var(--nav-collapsed-item-size) - var(--icon-container-size)) / 2));
    --icon-paint-z-index: -1;
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
    --feedback-empty-min-block-size: calc(var(--control-height) * 4);
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
    --nav-drawer-max-inline-size: 100vw;
    --nav-drawer-padding: min(var(--nav-sidebar-padding), max(var(--space-text-gap), 2vw));
    --nav-drawer-indent: min(var(--space-control-gap), 3vw);
    --nav-drawer-header-ratio: .3;
    --nav-drawer-footer-ratio: .2;
    --nav-drawer-menu-ratio: .5;
    --nav-toggle-transform-origin: 60% 50%;
    --login-card-padding: calc(var(--space-section-gap) * 1.75);
    --login-card-inline-padding: min(var(--login-card-padding), 8vw);
    --login-form-inline-size: 22.5rem;
    --login-card-padding-end: var(--login-card-padding);
    --login-brand-gap: calc(var(--space-section-gap) * 1.5);
    --login-card-radius: calc(var(--radius-xl) * 2);
    --login-title-font-size: calc(var(--font-size-page-title) * 1.3);
    --login-title-line-height: max(calc(var(--login-title-font-size) * 16 / 13), calc(var(--line-height-page-title) * 8 / 7));
    --login-heading-gap: var(--space-control-gap);
    --login-heading-fields-gap: calc(var(--space-section-gap) + var(--space-text-gap));
    --login-control-height: calc(var(--control-height-lg) + var(--space-text-gap) + var(--line-width-surface) * 2);
    --login-group-input-height: calc(var(--login-control-height) - var(--line-width-surface) * 2);
    --login-control-font-size: var(--font-size-body-sm);
    --login-control-line-height: var(--line-height-body-sm);
    --login-card-inline-size: calc(var(--login-form-inline-size) + var(--login-card-padding) * 2 + var(--line-width-surface) * 2);
    --login-visual-max-block-size: calc(var(--control-height-lg) * 2);
    --login-action-max-block-size: max(var(--login-control-height), 20dvh);
    --login-logo-size: calc(var(--control-height-lg) + var(--space-control-gap));
    --sheet-max-block-size: 80dvh;
    --tabs-padding: calc(var(--spacing) * .75);
    --tabs-item-max-inline-size: var(--layout-field-min);
    --tabs-line-baseline-shadow: inset 0 calc(-1 * var(--line-width-surface)) 0 var(--separator-line);
    --layout-workspace-content-min-block-size: 0px;
    --data-table-filter-min: 9rem;
    --data-table-placeholder-inline-size: calc(100cqi - var(--table-cell-padding-inline) * 2);
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
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --table-row-expanded-background: var(--interaction-hover);
    --data-table-column-resize-min: calc(var(--control-height-lg) + var(--table-cell-padding-inline) * 2);
    --data-table-column-resize-max: calc(var(--layout-field-min) * 8);
    --table-header-min-height: var(--control-height);
    --table-row-min-height: var(--control-height-lg);
    --table-cell-padding-inline: var(--space-content-gap);
    /* centralized-component-tokens:end */
  }
  :root[data-theme="light"] {
    color-scheme: light;
    --palette-primary: #6d28d9;
    --palette-on-primary: #ffffff;
    --palette-secondary: #42690c;
    --palette-on-secondary: #ffffff;
    --palette-foreground: #191424;
    --palette-muted-foreground: #5b536b;
    --palette-background: var(--palette-canvas);
    --palette-canvas: #f8f7fc;
    --palette-shell: #f1eff8;
    --palette-surface: #ffffff;
    --palette-support: var(--palette-shell);
    --palette-raised: #ffffff;
    --palette-overlay: #ffffff;
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-separator: #e5e1f0;
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --palette-input-line: #8b819f;
    --palette-info: #0891b2;
    --palette-info-foreground: #155e75;
    --palette-warning: #d97706;
    --palette-warning-foreground: #92400e;
    --palette-success: #059669;
    --palette-success-foreground: #065f46;
    --palette-error: #dc2626;
    --palette-error-foreground: #b91c1c;
    --palette-state-base: var(--palette-surface);
    --palette-shadow-ink: #0f172a;
    --palette-series-1: #0891b2;
    --palette-series-2: #d97706;
    --palette-series-3: #475569;
    --palette-series-4: #0284c7;
    --palette-series-5: #7c3aed;
    --palette-series-6: #059669;
    --selected-weight: 11%;
    --selected-base: var(--layer-surface);
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
    --palette-table-stripe: #fafbfc;
    --input-surface: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  @media (prefers-color-scheme: light) {
    :root[data-theme="system"] {
      color-scheme: light;
      --palette-primary: #6d28d9;
      --palette-on-primary: #ffffff;
      --palette-secondary: #42690c;
      --palette-on-secondary: #ffffff;
      --palette-foreground: #191424;
      --palette-muted-foreground: #5b536b;
      --palette-background: var(--palette-canvas);
      --palette-canvas: #f8f7fc;
      --palette-shell: #f1eff8;
      --palette-surface: #ffffff;
      --palette-support: var(--palette-shell);
      --palette-raised: #ffffff;
      --palette-overlay: #ffffff;
      --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
      --palette-separator: #e5e1f0;
      --palette-surface-line: var(--palette-separator);
      --palette-surface-line-strong: var(--palette-input-line);
      --palette-input-line: #8b819f;
      --palette-info: #0891b2;
      --palette-info-foreground: #155e75;
      --palette-warning: #d97706;
      --palette-warning-foreground: #92400e;
      --palette-success: #059669;
      --palette-success-foreground: #065f46;
      --palette-error: #dc2626;
      --palette-error-foreground: #b91c1c;
      --palette-state-base: var(--palette-surface);
      --palette-shadow-ink: #0f172a;
      --palette-series-1: #0891b2;
      --palette-series-2: #d97706;
      --palette-series-3: #475569;
      --palette-series-4: #0284c7;
      --palette-series-5: #7c3aed;
      --palette-series-6: #059669;
      --selected-weight: 11%;
      --selected-base: var(--layer-surface);
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
      --palette-table-stripe: #fafbfc;
      --input-surface: var(--palette-surface);
      --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
      --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
      --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
      --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
    }
  }
}
/* project-theme-presets:start */
@layer design-defaults {
  :root[data-theme-preset="violet"] {
    --palette-primary: #a78bfa;
    --palette-on-primary: #0c0717;
    --palette-secondary: #bef264;
    --palette-on-secondary: #132205;
    --palette-foreground: #f5f3ff;
    --palette-muted-foreground: #9b93b0;
    --palette-canvas: #09070f;
    --palette-shell: #0f0b1a;
    --palette-surface: #141024;
    --palette-raised: #1a152e;
    --palette-overlay: #211b3b;
    --palette-input-line: #817397;
    --palette-separator: #29213d;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 16%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  :root[data-theme-preset="violet"][data-theme="light"] {
    --palette-primary: #6d28d9;
    --palette-on-primary: #ffffff;
    --palette-secondary: #42690c;
    --palette-on-secondary: #ffffff;
    --palette-foreground: #191424;
    --palette-muted-foreground: #5b536b;
    --palette-canvas: #f8f7fc;
    --palette-shell: #f1eff8;
    --palette-surface: #ffffff;
    --palette-raised: #ffffff;
    --palette-overlay: #ffffff;
    --palette-input-line: #8b819f;
    --palette-separator: #e5e1f0;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 11%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  @media (prefers-color-scheme: light) {
    :root[data-theme-preset="violet"][data-theme="system"] {
      --palette-primary: #6d28d9;
      --palette-on-primary: #ffffff;
      --palette-secondary: #42690c;
      --palette-on-secondary: #ffffff;
      --palette-foreground: #191424;
      --palette-muted-foreground: #5b536b;
      --palette-canvas: #f8f7fc;
      --palette-shell: #f1eff8;
      --palette-surface: #ffffff;
      --palette-raised: #ffffff;
      --palette-overlay: #ffffff;
      --palette-input-line: #8b819f;
      --palette-separator: #e5e1f0;
      --palette-background: var(--palette-canvas);
      --palette-support: var(--palette-shell);
      --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
      --palette-surface-line: var(--palette-separator);
      --palette-surface-line-strong: var(--palette-input-line);
      --input-surface: var(--palette-surface);
      --palette-state-base: var(--palette-surface);
      --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
      --selected-weight: 11%;
      --selected-base: var(--layer-surface);
      --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
      --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
      --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
    }
  }
  :root[data-theme-preset="ember"] {
    --palette-primary: #fb923c;
    --palette-on-primary: #1c0a02;
    --palette-secondary: #60a5fa;
    --palette-on-secondary: #051329;
    --palette-foreground: #f8fafc;
    --palette-muted-foreground: #a1b2ca;
    --palette-canvas: #070a10;
    --palette-shell: #0b111c;
    --palette-surface: #101929;
    --palette-raised: #152238;
    --palette-overlay: #1b2c47;
    --palette-input-line: #7d92ae;
    --palette-separator: #1f314d;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 15%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  :root[data-theme-preset="ember"][data-theme="light"] {
    --palette-primary: #c2410c;
    --palette-on-primary: #ffffff;
    --palette-secondary: #1e3a8a;
    --palette-on-secondary: #ffffff;
    --palette-foreground: #111827;
    --palette-muted-foreground: #4b5565;
    --palette-canvas: #f7f8fa;
    --palette-shell: #eef2f7;
    --palette-surface: #ffffff;
    --palette-raised: #ffffff;
    --palette-overlay: #ffffff;
    --palette-input-line: #7f8a9c;
    --palette-separator: #e2e7ef;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 10%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  @media (prefers-color-scheme: light) {
    :root[data-theme-preset="ember"][data-theme="system"] {
      --palette-primary: #c2410c;
      --palette-on-primary: #ffffff;
      --palette-secondary: #1e3a8a;
      --palette-on-secondary: #ffffff;
      --palette-foreground: #111827;
      --palette-muted-foreground: #4b5565;
      --palette-canvas: #f7f8fa;
      --palette-shell: #eef2f7;
      --palette-surface: #ffffff;
      --palette-raised: #ffffff;
      --palette-overlay: #ffffff;
      --palette-input-line: #7f8a9c;
      --palette-separator: #e2e7ef;
      --palette-background: var(--palette-canvas);
      --palette-support: var(--palette-shell);
      --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
      --palette-surface-line: var(--palette-separator);
      --palette-surface-line-strong: var(--palette-input-line);
      --input-surface: var(--palette-surface);
      --palette-state-base: var(--palette-surface);
      --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
      --selected-weight: 10%;
      --selected-base: var(--layer-surface);
      --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
      --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
      --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
    }
  }
  :root[data-theme-preset="forest"] {
    --palette-primary: #34d399;
    --palette-on-primary: #021a10;
    --palette-secondary: #facc15;
    --palette-on-secondary: #201702;
    --palette-foreground: #f0fdf4;
    --palette-muted-foreground: #86a193;
    --palette-canvas: #060b08;
    --palette-shell: #0a120e;
    --palette-surface: #101c16;
    --palette-raised: #15261e;
    --palette-overlay: #1b3026;
    --palette-input-line: #87998e;
    --palette-separator: #1b2e23;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 15%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  :root[data-theme-preset="forest"][data-theme="light"] {
    --palette-primary: #047857;
    --palette-on-primary: #ffffff;
    --palette-secondary: #854d0e;
    --palette-on-secondary: #ffffff;
    --palette-foreground: #111c16;
    --palette-muted-foreground: #4d5d54;
    --palette-canvas: #f6f8f6;
    --palette-shell: #eef2ef;
    --palette-surface: #ffffff;
    --palette-raised: #ffffff;
    --palette-overlay: #ffffff;
    --palette-input-line: #7c8e84;
    --palette-separator: #dfe5e1;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 9%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  @media (prefers-color-scheme: light) {
    :root[data-theme-preset="forest"][data-theme="system"] {
      --palette-primary: #047857;
      --palette-on-primary: #ffffff;
      --palette-secondary: #854d0e;
      --palette-on-secondary: #ffffff;
      --palette-foreground: #111c16;
      --palette-muted-foreground: #4d5d54;
      --palette-canvas: #f6f8f6;
      --palette-shell: #eef2ef;
      --palette-surface: #ffffff;
      --palette-raised: #ffffff;
      --palette-overlay: #ffffff;
      --palette-input-line: #7c8e84;
      --palette-separator: #dfe5e1;
      --palette-background: var(--palette-canvas);
      --palette-support: var(--palette-shell);
      --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
      --palette-surface-line: var(--palette-separator);
      --palette-surface-line-strong: var(--palette-input-line);
      --input-surface: var(--palette-surface);
      --palette-state-base: var(--palette-surface);
      --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
      --selected-weight: 9%;
      --selected-base: var(--layer-surface);
      --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
      --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
      --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
    }
  }
  :root[data-theme-preset="crimson"] {
    --palette-primary: #fb7185;
    --palette-on-primary: #1f040a;
    --palette-secondary: #818cf8;
    --palette-on-secondary: #0b0d26;
    --palette-foreground: #fff1f2;
    --palette-muted-foreground: #a88d94;
    --palette-canvas: #0d0608;
    --palette-shell: #140a0e;
    --palette-surface: #1f1016;
    --palette-raised: #29151e;
    --palette-overlay: #341c26;
    --palette-input-line: #a1838d;
    --palette-separator: #3a1e27;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 14%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  :root[data-theme-preset="crimson"][data-theme="light"] {
    --palette-primary: #be123c;
    --palette-on-primary: #ffffff;
    --palette-secondary: #3730a3;
    --palette-on-secondary: #ffffff;
    --palette-foreground: #1f1215;
    --palette-muted-foreground: #614e53;
    --palette-canvas: #fbf6f7;
    --palette-shell: #f5edef;
    --palette-surface: #ffffff;
    --palette-raised: #ffffff;
    --palette-overlay: #ffffff;
    --palette-input-line: #947e83;
    --palette-separator: #eadddf;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 8%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  @media (prefers-color-scheme: light) {
    :root[data-theme-preset="crimson"][data-theme="system"] {
      --palette-primary: #be123c;
      --palette-on-primary: #ffffff;
      --palette-secondary: #3730a3;
      --palette-on-secondary: #ffffff;
      --palette-foreground: #1f1215;
      --palette-muted-foreground: #614e53;
      --palette-canvas: #fbf6f7;
      --palette-shell: #f5edef;
      --palette-surface: #ffffff;
      --palette-raised: #ffffff;
      --palette-overlay: #ffffff;
      --palette-input-line: #947e83;
      --palette-separator: #eadddf;
      --palette-background: var(--palette-canvas);
      --palette-support: var(--palette-shell);
      --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
      --palette-surface-line: var(--palette-separator);
      --palette-surface-line-strong: var(--palette-input-line);
      --input-surface: var(--palette-surface);
      --palette-state-base: var(--palette-surface);
      --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
      --selected-weight: 8%;
      --selected-base: var(--layer-surface);
      --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
      --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
      --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
    }
  }
  :root[data-theme-preset="cobalt"] {
    --palette-primary: #60a5fa;
    --palette-on-primary: #051329;
    --palette-secondary: #22d3ee;
    --palette-on-secondary: #04191f;
    --palette-foreground: #f8fafc;
    --palette-muted-foreground: #8899b5;
    --palette-canvas: #060910;
    --palette-shell: #090e18;
    --palette-surface: #0f1726;
    --palette-raised: #141f33;
    --palette-overlay: #1a2842;
    --palette-input-line: #7f91b2;
    --palette-separator: #1c2b45;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 15%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  :root[data-theme-preset="cobalt"][data-theme="light"] {
    --palette-primary: #1d4ed8;
    --palette-on-primary: #ffffff;
    --palette-secondary: #0e7490;
    --palette-on-secondary: #ffffff;
    --palette-foreground: #0d1527;
    --palette-muted-foreground: #4e576d;
    --palette-canvas: #f6f8fb;
    --palette-shell: #edf1f7;
    --palette-surface: #ffffff;
    --palette-raised: #ffffff;
    --palette-overlay: #ffffff;
    --palette-input-line: #818ba2;
    --palette-separator: #e0e5ee;
    --palette-background: var(--palette-canvas);
    --palette-support: var(--palette-shell);
    --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
    --palette-surface-line: var(--palette-separator);
    --palette-surface-line-strong: var(--palette-input-line);
    --input-surface: var(--palette-surface);
    --palette-state-base: var(--palette-surface);
    --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
    --selected-weight: 9%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
  }
  @media (prefers-color-scheme: light) {
    :root[data-theme-preset="cobalt"][data-theme="system"] {
      --palette-primary: #1d4ed8;
      --palette-on-primary: #ffffff;
      --palette-secondary: #0e7490;
      --palette-on-secondary: #ffffff;
      --palette-foreground: #0d1527;
      --palette-muted-foreground: #4e576d;
      --palette-canvas: #f6f8fb;
      --palette-shell: #edf1f7;
      --palette-surface: #ffffff;
      --palette-raised: #ffffff;
      --palette-overlay: #ffffff;
      --palette-input-line: #818ba2;
      --palette-separator: #e0e5ee;
      --palette-background: var(--palette-canvas);
      --palette-support: var(--palette-shell);
      --palette-muted: color-mix(in oklab, var(--palette-foreground) 7%, var(--palette-raised));
      --palette-surface-line: var(--palette-separator);
      --palette-surface-line-strong: var(--palette-input-line);
      --input-surface: var(--palette-surface);
      --palette-state-base: var(--palette-surface);
      --table-row-stripe-background: color-mix(in oklab, var(--palette-shell) 25%, var(--palette-raised));
      --selected-weight: 9%;
      --selected-base: var(--layer-surface);
      --button-hover-background: color-mix(in oklab, var(--action-primary) 94%, var(--foreground));
      --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
      --interaction-pressed: color-mix(in oklab, var(--action-primary) 18%, var(--layer-raised));
    }
  }
  :root[data-theme-preset="precision"] {
    --palette-primary: #06b6d4;
    --palette-on-primary: #090b0e;
    --palette-secondary: #10b981;
    --palette-on-secondary: #090b0e;
    --palette-foreground: #f1f5f9;
    --palette-muted-foreground: #94a3b8;
    --palette-canvas: #090b0e;
    --palette-shell: #0d1016;
    --palette-surface: #11151c;
    --palette-raised: #141a24;
    --palette-overlay: #1a2230;
    --palette-input-line: #5b708b;
    --palette-separator: #1e2633;
    --palette-background: #090b0e;
    --palette-support: #0d1016;
    --palette-muted: #161e28;
    --palette-surface-line: #1e2633;
    --palette-surface-line-strong: #52657e;
    --input-surface: var(--palette-input-surface);
    --palette-state-base: #11151c;
    --table-row-stripe-background: var(--palette-table-stripe);
    --selected-weight: 13%;
    --selected-base: var(--layer-surface);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 92%, var(--layer-raised));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 16%, var(--layer-raised));
  }
  :root[data-theme-preset="precision"][data-theme="light"] {
    --palette-primary: #0e7490;
    --palette-on-primary: #ffffff;
    --palette-secondary: #047857;
    --palette-on-secondary: #ffffff;
    --palette-foreground: #17202e;
    --palette-muted-foreground: #525e70;
    --palette-canvas: #f7f8fa;
    --palette-shell: #f0f2f5;
    --palette-surface: #ffffff;
    --palette-raised: #ffffff;
    --palette-overlay: #ffffff;
    --palette-input-line: #808793;
    --palette-separator: #e4e7ec;
    --palette-background: #f7f8fa;
    --palette-support: #f7f8fa;
    --palette-muted: #eceef2;
    --palette-surface-line: #dfe3e8;
    --palette-surface-line-strong: #808793;
    --input-surface: var(--palette-input-surface);
    --palette-state-base: #ffffff;
    --table-row-stripe-background: var(--palette-table-stripe);
    --selected-weight: 9%;
    --selected-base: var(--layer-raised);
    --button-hover-background: color-mix(in oklab, var(--action-primary) 92%, var(--layer-raised));
    --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
    --interaction-pressed: color-mix(in oklab, var(--action-primary) 16%, var(--layer-raised));
  }
  @media (prefers-color-scheme: light) {
    :root[data-theme-preset="precision"][data-theme="system"] {
      --palette-primary: #0e7490;
      --palette-on-primary: #ffffff;
      --palette-secondary: #047857;
      --palette-on-secondary: #ffffff;
      --palette-foreground: #17202e;
      --palette-muted-foreground: #525e70;
      --palette-canvas: #f7f8fa;
      --palette-shell: #f0f2f5;
      --palette-surface: #ffffff;
      --palette-raised: #ffffff;
      --palette-overlay: #ffffff;
      --palette-input-line: #808793;
      --palette-separator: #e4e7ec;
      --palette-background: #f7f8fa;
      --palette-support: #f7f8fa;
      --palette-muted: #eceef2;
      --palette-surface-line: #dfe3e8;
      --palette-surface-line-strong: #808793;
      --input-surface: var(--palette-input-surface);
      --palette-state-base: #ffffff;
      --table-row-stripe-background: var(--palette-table-stripe);
      --selected-weight: 9%;
      --selected-base: var(--layer-raised);
      --button-hover-background: color-mix(in oklab, var(--action-primary) 92%, var(--layer-raised));
      --button-pressed-background: color-mix(in oklab, var(--action-primary) 88%, var(--foreground));
      --interaction-pressed: color-mix(in oklab, var(--action-primary) 16%, var(--layer-raised));
    }
  }
}
/* project-theme-presets:end */
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

Precision 预设保留的主要操作浅色为 #0e7490/白字，深色为 #06b6d4/#090b0e 字；canvas 为浅色 #f7f8fa、深色 #090b0e。主操作 hover/pressed 从 action-primary 和中性表面/前景派生；壳层 #0d1016、内容 #11151c、卡片 #141a24、active/hover #161e28、overlay #1a2230。状态信号保留翠绿 #10b981、琥珀 #f59e0b、红 #ef4444；浅色配对使用同色相的深色前景。普通区域使用中性表面，不把所有卡染成主色。

所有配色的 input-border-color 使用独立 input 角色，与所选配方的输入表面成对定义，必要边界达到3:1。轻结构线只用于区域分隔，不作为输入可识别边界。hover 不降低必要对比，产品覆盖按实际输入内外相邻表面核验。


### 默认主题层级与动作强调

默认主题本身必须形成完整页面，不能把辨认框架、内容和操作的工作留给产品私有皮肤。4.2.13 与 [Stitch 配色评审](https://stitch.withgoogle.com/projects/13033986353155220257)对齐六套官方配色，并按用户决定默认采用 Violet。浅色为带微弱品牌色相的框架、白色内容面、轻表头与细分隔，深色保留各自分层；实际色值以本文件前言和默认 CSS 为准。设计候选的主色、辅助色和输入边界均须按真实合成背景校正；设计建议不代替浏览器实测。

| 区域 | 默认表面与强调归属 | 验收重点 |
|---|---|---|
| 页面、顶栏与侧栏 | canvas 承接底层，shell 承接持久框架；surface/raised 承接阅读和独立内容 | 阅读面不整页染主色，导航当前项的文字、图标和指示清楚 |
| 表格 | header 使用 support，正文使用 row，条纹只作轻微区分；sticky 同步不透明行表面 | 表头/条纹/分隔不压过正文，selected/hover 与横滚固定列连续 |
| 表单 | input-surface 与必要 input 边界；label/help/error 分别继承已有文字角色 | 边界按内部和外部相邻背景核对；不以重灰填充代替识别，不加粗整组外框 |
| Dialog、Sheet、菜单、Toast | overlay 与既有浮层边界/阴影；内容、操作和反馈进入原公开 slot | 浮层清晰，键盘焦点独立；不增加装饰条或第二层卡片 |

日常重复行操作优先使用已有 `Button` 的 `ghost`、`link` 或必要 `outline` 变体，危险入口可收纳进公开 `Menu.Item tone="danger"`。实心 primary 留给当前任务的主要动作，实心 destructive 用于明确危险决策；不能让每行重复彩色按钮盖过数据。此规则约束组合选择，不根据 DOM 祖先自动更改 Button 的变体、权限或确认行为，不新增另一套行按钮字号。

库验收先使用无 product-overrides 的正式包示例，分别核对框架、导航、表格、表单、弹层和反馈，再核对品牌覆盖继承。浅/深/system、窄屏、长中文、200%文字和真实浏览器缩放均保留清楚的层次、必要边界和焦点；默认主题失败不能要求每个消费项目自行补皮肤。

### Precision 输入与适配边界

Precision 预设最初来自用户提供的 Precision Engineering Console；它是六套配色之一，当前默认已由上述 Violet 合同替代。输入 YAML 的 surface #0f141a / primary #4cd7f6 与正文的 Elevation/组件值近似但不相同；最初适配采用更具体的正文层级和交互状态，上传原文保存在设计来源快照中。浅色配对为本库推导：slate-white 表面、深青蓝操作及更深的同色相状态文字，不声称由原文件直接给出。下表记录初始适配脉络，不作为当前值表；当前值只以规范 CSS 和所选 preset 为准。

| 设计项 | 公共映射与生效位置 | 模式与必要适配 |
| --- | --- | --- |
| Canvas / structural / active / overlay | layer-canvas / layer-shell,surface,raised / interaction-hover / layer-overlay；页面、导航、Card、菜单和Dialog | dark石墨层级；light中性灰白框架与白色内容面 |
| Primary Cyan | action-primary/foreground、button-hover/pressed-background；按钮、链接、选择、焦点 | dark #06b6d4/#090b0e；light #0e7490/white；hover/pressed 继承品牌语义派生 |
| Emerald / Amber / Crimson | status-success/warning/error 的 signal、foreground、soft、line；Badge、Alert和真实状态 | 信号保留正文色；错误正文改 #f87171、表头/placeholder 改 #94a3b8 以满足可读性 |
| Input / audit grid | input-surface/input-border-color；table-header/row/stripe/expanded-* | dark输入 #0c0f14、表头 #0d1016、条纹 #131922；必要输入边界提高至 #5b708b |
| Inter / JetBrains Mono | font-sans/font-mono；普通文字/代码与技术标识 | 保留七个已公开的rem文字角色、中文回退和缩放下限，不采用输入的11px普通文字 |
| 4px基础、6–8px容器 | button/input-radius、card-radius、menu-radius、radius-2xl | 三模式一致；保持36px普通输入与自然长文可达 |

Precision 保留的公共 hover 配方由正文固定色 #22d3ee 改为 action-primary 92% 与 layer-raised 混合；其余五套采用 action-primary 94% 与 foreground。pressed 均混合 action-primary 88% 与 foreground。这样已采用系统只覆盖 action-primary 与 action-primary-foreground 时，按钮各状态仍继承产品品牌并保留可读性，不在悬停时回到默认青色。产品如需独立状态配方，仍可显式覆盖 button-hover/pressed-background；上传原文保持原始字节。

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

普通 hover 使用中性底；selected 使用主色浅底与强调前景interaction-selected-foreground，hover 后仍有持续选中反馈。持续选中不另增 border、outline 或 ring；结构边界可以保留。焦点（包括鼠标、键盘及组合控件的 focus-within）不新增 outline、ring 或 box-shadow，也不增加或加粗边框；已有可见边框的控件仅将原边框改为 interaction-focus，失焦恢复，invalid 错误边框优先。透明边框、无边框控件及链接保持原边界外观；圆形 outline 图标按钮只改变已有内收边线颜色，不在命中区外沿补线。键盘顺序、方向键、激活、选中和回焦语义不变。focus-width/offset 保留既有滚动清距与布局几何，不再用来绘制默认焦点环。pressed 是瞬时按下反馈，不等于持久 selected。不得降低整块透明度来掩盖对比问题。

导航当前项的主名称、富标签说明和公共文字/图标槽统一继承 `menu-item-selected-foreground`（默认映射主题强调色），不能只依赖左侧竖线表示选中。选中时普通 muted 文字不覆盖当前项强调色；hover、pressed 与 keyboard focus 保持该文字色，禁用前景仍优先。宿主不为这些文字槽另设颜色或字号，竖线与浅底只作辅助识别。

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

### 公共文字槽验收

**组件字体是 xui 的交付与验收责任。消费项目使用公共组件时，内容字体的大小非必要不得自行设置。** 页面和组件必须先按下表填入公开 slot；库用已有语义 Token 决定字体、字号、行高与字重，不让宿主在部署后逐页补 CSS。尺寸 `size` 只采用组件已有合同，不能自行推断小按钮应该缩字。主题改变颜色，不改变文字角色；界面比例、用户默认字号和浏览器 zoom 按公共缩放合同工作。

继承链优先：`.xui` 和 `.xui-layer` 提供公共 Sans/body/400 基线；页面壳、顶栏、章节等布局容器沿用这条基线；资源卡片与表格等确需从其他文字槽切换的正文边界才确立本区正文角色。description、body、footer 等相同角色的裸文本自然继承，meta/help/error 只改所需字号和行高，label/标题只增加对应字重。链接、OverflowText 和行内反馈继承所属文字槽；例如 Card.footerMeta 中的链接/同步文案仍为 meta。Button、输入、日期和披露等可能从小字号槽切入的独立控件才建立自己的 control 角色，技术值/指标显式切换 Mono。不会用 `.slot *` 或对子控件逐个重设字体来替代继承；四项 computed 验收检查最终结果，不要求每个后代都声明四个属性。

下表是文字归属的唯一映射。`body`=body-sm/正文400/Sans，`control`=body-sm/控件500/Sans，`meta`=body-xs/正文400/Sans，`label`=body-xs/控件500/Sans；`page`、`section` 分别为 page-title、section-title/标题600/Heading；`body-heading`=body-sm/标题600/Sans，`meta-heading`=body-xs/标题600/Heading；`code`=body-sm/正文400/Mono；`metric`=metric/标题600/Mono/tabular。每个尺寸的行高取同名 `line-height-*`，不另设像素值。既有 Heading 与 Sans 使用相同中文 Sans 回退；实际字体可用性与回退必须记录。

| 公共组件 | 文字 slot/part → 角色 | 组合边界 |
| --- | --- | --- |
| AppHeader / HeaderBrand | brand/name → body-heading；breadcrumb/context/leading/auxiliary/account 的裸文本 → body；status 裸文本 → meta | 内嵌 Breadcrumbs、Button、Badge、语言控件按自身规则 |
| AppShell / MenuLayout | sidebarHeader/sidebarFooter 的裸说明 → meta；pageHeader/pageToolbar/children/pageFooter 的文字由放入的公共组件决定 | 不限制直属或嵌套 Button 的宽度/字体；按自身默认与宿主显式公开布局选择，slot 仅拥有边界/滚动/焦点 |
| PageHeader | title → page；description → body/muted；meta → meta/muted；actions → 所用控件 | 不用 Typography.Text 将 meta 升为正文；普通字符串或无样式 span 自动继承该槽 |
| Section | title → section；children 裸文本 → body；actions → 所用控件 | 章节标题不替代页面 h1；富内容使用适合其语义的公共子组件 |
| Toolbar / SearchToolbar | 裸文字继承所属正文或元信息槽；search/actions/advanced → Field/输入/按钮/Disclosure 各自角色 | Toolbar 是布局，不为其所有后代统一字号 |
| Card | title/OverflowText → section；description → body/muted；children裸文本 → body；footerMeta → meta/muted | 图标区与Footer分区不改字体；header/footer actions使用Button/Menu，badge仍label，不改后代控件字体 |
| CardGroup | renderCard → Card 的各槽；footer/count/page-size label/分页说明 → meta | 卡片与反馈、页码控件保留各自角色 |
| MetricCard | label → label/muted；value → metric；marker → 所用 Badge 或正文 | value 内的完整数值保留 Mono/tabular，不把正文全设 Mono |
| Field / Fieldset | label/legend → label；help/error → meta/muted或error | 控件、错误关联与字重独立；不从父标题/按钮继承字号 |
| Input / Textarea / PasswordInput | 可见输入值/placeholder → control；密码显隐动作 → InputGroup.Button | label/help/error 仍归 Field；原生特定 input 展示由浏览器保留语义 |
| Select / SimpleSelect / Combobox | trigger/input → control；option → Menu.Item 的 label；group label → meta | 原生 select 的平台 line-height 可为 normal，字号/字重/字体与公共角色一致，实际高度需验证 |
| InputGroup | Addon 裸单位/说明 → meta；Input/Textarea → control；Button → control | 单位不能把其中的动作降为 meta；一个输入边界 |
| Checkbox / Radio / Switch / ChoiceGroup | 可见 label/组 label → label；help/error → meta | indicator 无文字；受控/只读/禁用不改变文字尺寸 |
| PasswordStrength | 输入 → control；可见说明 → Field help/error 的 meta；meter 无文字 | 隐藏播报不为视觉另造字号 |
| Button / IconButton | 文字 → control，所有既有 size 一致；纯图标无文字角色 | 按钮尺寸改变可用空间，不由侧栏或 footer 降字号；可访问名称仍必填 |
| Toggle / ToggleGroup | trigger → Button 的 control | pressed 只改语义状态与着色 |
| Tabs | Tab → body-sm，常规body字重400、选中heading字重600；Icon继承Tab状态色、无独立文字角色；Panel裸文本 → body | Panel内组件保留自身角色 |
| Nav / NavItem / NavigationMenu | 可操作主 label/renderLabel → control；group title → meta-heading/muted；emptyLabel → body/muted | renderLabel 现为主名称，尚无副说明 slot；branch/action 用 Button。缺副说明时提交公共缺口，不自写小字号 |
| Breadcrumbs / Pagination | 路径 → body；页码/总页数说明 → meta；前后按钮 → control | 路径中的链接保留语义；页码不降按钮字号 |
| Menu / ContextMenu | Item/LinkItem/CheckboxItem/RadioItem/SubmenuTrigger → label；GroupLabel → meta/muted | danger/disabled/highlight 改状态色，不另设字号；Icon 无文字角色 |
| Command / GroupedCombobox | 搜索 → control；item → label；group → meta/muted；已选 Tag → label | 复用输入、菜单、Tag 角色，不增加第三套字号 |
| Disclosure / Accordion | trigger → control；body/panel 裸文本 → body | 默认 h3/legend 等浏览器样式不得改变 trigger 字号 |
| Calendar | 月标题 → body-heading/Heading；weekday → meta/muted；day → control；翻月/清空 → Button | 查看月与值事件不因字体改变；不自造大号日期数字 |
| DateTimePicker | Field label/help/error → label/meta；显示值、时间输入、触发/清空 → control；日历 → Calendar | 保持 ISO 分钟墙上时间合同，业务时区归宿主 |
| Dialog / Sheet / AlertDialog | Title → section；Description/body/footer 裸文本 → body（说明 muted） | 共享同一组文字 part；Footer 的 FormActions/Button 与 body 的 Field 各自维护字体 |
| Popover / Tooltip | Popover.Title/Description → section/body；popup 裸正文 → body；Tooltip → meta | portal 的 xui-layer 与主树采用同一主题与比例 |
| Surface / Alert / DataRegion | Surface/Alert 裸内容继承所属文字槽（默认 body）；DataRegion 中正文由其内容组件决定 | 状态 tone 改颜色；布局 DataRegion 不覆盖内容文字 |
| LoadingState / EmptyState / ErrorState | 文案/说明 → 所属正文或元信息（默认 body）；Empty/Error title → 同字号+600（默认 body-heading）；retry → Button | block 文案继承所属内容正文；inline 文案继承所属动作/元信息槽，不另设字号；加载在所属内容区居中 |
| Toast | Title → label字重/body-sm；Description → meta；其余裸文本 → body；Close/action → Button | 使用通知专用标题/说明层级；默认右上角，内距与间距继承公共 token，窄屏/放大时通知区域内部滚动，焦点四边可见 |
| Badge / Tag | label → label；删除动作 → Button | 中性分类与语义状态共用字号；不因 tone 改字重 |
| Icon | 图形，无独立文字角色；颜色经icon-color默认currentColor继承 | 可选color/blink不改变所属Button、Badge或Tab的文字角色；装饰图标不新增键盘/朗读通知 |
| Typography | Heading → page或section（语义级别单独指定）；Text → body；Link → 所属文字槽；Code → code；Strong → 所属角色+600 | 链接继承段落或元信息角色，Text 明确正文边界；Code 是技术值，不能当全站字体 |
| Copyable | value → code；status → meta；copy → Button | 复制状态不抢技术值与动作 |
| Avatar / Image | Avatar fallback → control；Image 加载/失败文案继承所属文字槽（默认 body） | 图片/图标本身无字体；alt 与可访问名称仍由宿主提供 |
| Table / DataTable | caption → control；th/sort → label；td/expanded 裸内容 → body；footer/count/page-size label/分页说明 → meta | 行内技术值用 Code、状态用 Badge、动作用 Button；cell 内控件不继承 th/footer 字号 |
| APIKeyManager / BusinessLogExplorer / StructuredLogExplorer / LoginPanel及登录表单 | 使用上述 PageHeader、Field、DataTable、Dialog、状态与 Button 的文字角色；登录标题 → login-title、品牌 → section-title，描述 → body；登录控件/主动作采用既有 login-control-font-size/line-height，反馈 → meta | 这些已定义的登录专用尺寸由 xui 维护；采用者不另写登录字体或数据表皮肤 |
| Container / Stack / Grid / FormGrid / FormActions / ScrollArea / Separator / Spinner / Skeleton / Progress / 图标 | 无独立文字角色；仅布局、装饰、进度或媒体，无文字 part 记不适用 | 有可见内容时放入拥有文字角色的公共组件；OverflowText 仅继承其标题或名称槽，不擅自更改角色 |

新增或调整公共可见文字 part，必须同步本表、正式 CSS、示例和逐项字体验收。**xui 发布验收**逐个读取真实组件的 `font-family/font-size/line-height/font-weight`，对照角色与 Token；检查嵌套控件不被父槽覆盖。浅/深/system、长中文、桌面/窄屏、200%文字及真实浏览器缩放分别记录，不以源码出现变量或一张截图代替 computed style。原生表单平台差异要明确报告，不伪称所有浏览器都能锁定内部绘制。

**消费接入验收**逐实例记录该表对应角色，搜索 JSX/CSS 的 `font/font-size/font-family/line-height/font-weight` 及框架文字工具类，确认每个覆盖的用途与作用范围。普通 UI 不允许为“紧实”或修复公共组件而另设文字尺寸；领域阅读（文档、代码、公式、图表、画布）确需例外时，记录任务理由、公共入口或集中语义映射、限定范围和缩放证据。公共角色缺失交给 xui，不能用例外掩盖。比例设置只使用公共方法和既有 sessionStorage owner。

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

按钮标准高度 xs24、sm32、default36、lg40px；对应横 padding8/10/12/16px、gap4/6/6/8px。普通图标16px，最小行操作12px；复用同一套图标尺寸和线宽，保留现有库，不混用装饰画布。默认 Checkbox为16×16px、radius-sm；Switch为28×16.6px、拇指14.4px；Tabs 项至少32px、segmented轨道内部 padding3px，单项最大宽度与长名阅读见内容Tabs合同；紧凑切换项高28px、gap4px。适配项目可保留语义明确的既有变体，不能每页发明尺寸。

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

上述六步确定信息、内容组织和任务容器，再用下方决策表选择承载，最后按[页面与组件槽位](#页面与组件的槽位架构)映射真实内容。列表可以放在Tab中，表单可以放在页面或Sheet中，不把不同层次当作互斥选项。方案需明确“任务/对象范围 → 内容/位置 → 显示与退出时机 → 公开承载/slot → 失败与恢复”；主题、字体、尺寸和状态外观仍由既有Token及组件角色决定，不在业务页面重画。

### 业务界面信息与交互决策


本节将既有页面设计方法细化为“什么信息、放在哪里、何时出现、用什么承载、如何退出与恢复”的选择依据。适用于查询、阅读、配置、编辑和工作区，不要求所有系统采用相同页面模板。表中 List、时间线、分栏、步骤等是信息或布局模式，不代表新增同名公共组件；实际使用能力以固定版本的[组件手册](COMPONENTS.md)与公开类型为准。默认选择使用“应当”，业务差异说明任务与取舍；不能用选型例外删除必要事实、可访问入口或失败恢复。

#### 信息归属与出现时机

信息应当放在受其影响的最小完整范围内，使用户能在作判断、填写或执行的位置读到它。全局身份、页面对象、集合记录与单个字段不能仅因视觉位置相近混在一起；同一事实有一个权威来源，必要的跨区域摘要应与其保持一致。

| 信息范围 | 信息与默认位置 | 何时出现、何时收起 | 正例与不适用情况 |
| --- | --- | --- | --- |
| 全局 | 当前账号/空间、跨页入口、影响整个应用的连接或服务状态，进入应用头部或全局反馈区 | 相关上下文持续存在；异常仅在确实影响全局时出现，恢复后解除异常提示 | 全局会话失效统一处理；单个列表读取失败不占全局警告条 |
| 页面/对象 | 当前任务、对象名称、决定当前任务的状态与页面动作，进入页头及其邻近内容 | 随页面/对象进入和切换；仅在回答当前问题时增加摘要/统计 | 对象已停用及启用入口靠近对象；不在每页固定铺一排无用途指标 |
| 区域/集合 | 区域标题、搜索/筛选、集合状态、局部动作，进入所属工具栏、正文与反馈区 | 区域存在时显示；高级条件按需展开，已生效条件在收起后仍可辨识和清除 | 成员搜索放在成员区域；不让某个 Tab 的筛选看起来作用于整页 |
| 记录 | 对象辨识、关键状态/阻断原因、用于比较的值和单条动作，跟随行、列表项或资源卡 | 记录可见时保留判断摘要；选择/打开后才显示完整详情 | 失败任务的原因摘要随行显示；调用栈不挤进每行，也不能把失败事实仅藏进详情 |
| 字段 | 标签、值/单位、必要填写限制、校验反馈，靠近字段或详情键值组 | 标签及必要约束在填写前可读；错误在校验失败时出现，修正后按真实校验更新 | 格式错误关联对应输入；不把字段错误只发到全局 Toast |
| 操作 | 当前操作对象、作用范围、必要确认、执行与结果反馈，跟随入口和任务容器 | 用户触发后出现；成功、取消或明确关闭后按该任务生命周期收束 | 批量停用前显示选择范围；不提前常驻所有尚未开始操作的参数表单 |

| 披露方式 | 使用条件与承载 | 显示和退出规则 | 不适用情况 |
| --- | --- | --- | --- |
| 直接显示 | 完成本次判断/操作所需的对象、状态、风险、阻断摘要和可用下一步 | 在相应决策位置可见；风险解除后按事实更新 | 不把必要说明藏在 Tooltip、未选 Tab 或“更多详情”中 |
| 选择后显示 | 需要深入阅读当前记录的正文、完整属性或处理入口 | 明确选中对象，在详情区、Sheet 或页面显示；切换/关闭保留原定位上下文 | 需要同时比较的两组关键值不能只能反复切换查看 |
| 按需展开 | 低频解释、历史、原始数据、高级参数；用 Disclosure/Accordion、具名帮助或详情入口 | 由明确点击/键盘动作展开；折叠保留摘要、异常提示和有效高级条件 | 内容是否次要取决于任务：排查历史时历史就是主内容，不能固定一律折叠日志 |
| 操作后反馈 | 提交、复制、删除、运行等带来的等待与结果 | 依照[反馈位置与保留时间](#反馈位置与保留时间)进入所属区域 | 不在请求确认前预演成功，不用一次 Toast 代替关键结果入口 |

#### 集合与详情的呈现形态

| 形态与使用条件 | 放什么、放哪里 | 显示与进入详情 | 正例 | 不适用/反例 |
| --- | --- | --- | --- | --- |
| List：逐条辨识、阅读或处理，主要内容长度不同 | 同类对象按阅读顺序排列；名称/摘要、关键状态、必要元信息与动作随项 | 查询范围确定后显示集合；具名链接/按钮打开记录，分页/续页沿既有合同 | 消息收件箱逐条展示发送者、摘要、未读与时间 | 需要逐列比较多个金额时，长短不一的段落列表增加比较负担 |
| Table：同类记录有稳定属性，需要跨记录对齐比较、排序或批量处理 | 主识别列、决策列、状态和动作；搜索/批量动作在集合工具区，分页计数唯一 | 列表内读取/筛选；完整正文按需详情或局部展开 | 比较任务的状态、所属对象与耗时 | 单条对象的一组属性不套成只有一行的大表；大段正文不挤成大量窄列 |
| Card：对象有独立摘要、预览或差异化内容，主要任务是辨识和进入 | 资源名称、预览、简短摘要、真实状态和少量动作；集合使用 CardGroup | 按同一资源模板显示；打开对象后进入其任务上下文 | 按封面与摘要识别模板/素材 | 不能仅为铺满宽屏把每个数字或字段做成独立卡片；精确逐列比较优先表格 |
| 键值详情：阅读单个对象的属性与状态 | 用有语义的名称/值分组，重要状态与所属动作靠近；长值可换行/复制 | 随选中对象显示；低频技术属性按需展开 | 任务详情先显示对象、状态与阻断，再显示来源和标识 | 不把每一对名称/值各包一张 Card，也不把整份详情默认做成禁用输入框 |
| 时间线：用户需要理解事件发生顺序和阶段变化 | 时间、事件、对象/操作者、结果；按声明时区与顺序组织在历史区域 | 需要历史时进入；摘要或分页以真实记录为依据 | 查看一次申请的提交、退回、再提交记录 | 时间先后不证明因果；需要比较多条记录属性时仍用表格 |
| 指标/图表：用户要回答汇总、趋势、分布或比较问题 | 指标保留口径/范围/单位；图表保留维度、图例和精确值入口，放在它支持的判断区域 | 范围确定后展示；未知、真实零、空与读取失败分别表达 | 查看选定时间段的任务量趋势，再进入相关记录 | 精确查找某条记录不以图表代替列表；不因页面空而制造统计卡或虚构百分比 |

Card/List 也可以提供选择和批量动作；选择表格的理由是信息比较与操作效率，不是“有批量就必须表格”。内容列表、导航树和选择控件的 listbox 使用各自的语义与键盘模式，不因都呈纵向排列就互换。先确定形态，再按[页面组合](#高信噪比页面组合)安放工具、状态和详情。

#### 导航、内容切换与筛选

先回答用户切换后改变了什么，再决定控件。标签排成横排或外观像 Tab，不改变其业务语义。

| 改变的内容 | 应当采用的机制与位置 | 切换时机与保留项 | 正例与不适用情况 |
| --- | --- | --- | --- |
| 进入另一个可独立定位的页面/任务 | 路由链接、应用导航或面包屑；导航放应用/页面导航区 | 按路由进入与返回，保留正常链接和浏览器能力 | 客户管理进入客户详情；不要用无链接的 Tab 冒充页面导航 |
| 同一任务上下文中的并列内容域 | 内容 Tabs，位于受其控制的面板之前 | 用户选定后显示对应 Panel；仅影响该内容域，按需要保留草稿与滚动 | 对象“概览 / 配置 / 历史”；需要同时比较的变更前后值同屏呈现 |
| 同一集合的结果范围 | 筛选控件，放所属集合工具栏；少量互斥值可用语义明确的单选/ToggleGroup | 按既有查询时机生效；可辨识当前条件、清除条件，并处理分页/选择范围 | “全部 / 运行中 / 失败”只是状态条件时属于筛选，不赋予 tab/tabpanel 语义 |
| 同一数据范围的展示形式 | 有明确名称的视图切换控件，靠近集合工具栏 | 保留查询范围；稳定记录的选择与草稿按可用能力延续 | “列表 / 网格”；不把切换形式变成重新创建记录或清空搜索 |
| 同页相关内容的展开程度 | Disclosure/Accordion，触发器贴近对应摘要/区域 | 显式展开/收起，标签可理解当前状态；关键异常留在摘要 | “高级选项”“查看完整历史”；必填项不能无提示藏在默认折叠区 |
| 有真实先后依赖的阶段 | 宿主步骤流程与阶段指示，放当前任务范围内 | 标明当前阶段、真实前置及可回退入口，跨步输入按流程保留 | 配置→核对→提交；并列设置分组不为了外观强加步骤 |

状态名也可能代表目的、内容与动作不同的工作队列，此时评估内容 Tabs 或独立路由，例如“待处理”与“归档查询”；有计数、红点或列显示差异本身不足以证明应当使用 Tab。内容域可以由宿主同步 URL；URL 的存在不改变控件语义。实际 Tabs 的键盘、激活与 Panel 关联沿[公开合同](COMPONENTS.md#tabs)，异步内容按公开配置选择适用激活方式，避免仅移动焦点就反复等待网络。

#### 任务容器与上下文

选择容器时共同考虑任务是否独立、认知复杂度、所需空间、与当前页面的关系、连续查看/操作需求、定位/返回与草稿生命周期。字段数、预计秒数、一个 URL 或“新增/编辑”动作名称都不能单独决定容器。

| 容器与使用条件 | 信息、位置与进入方式 | 完成/关闭/返回 | 正例 | 不适用/反例 |
| --- | --- | --- | --- | --- |
| 内联：任务属于当前内容，局部修改可独立理解 | 在原值或所属区域展开编辑，保留对象名称与可达入口 | 明确保存/取消或沿已声明的即时保存规则，失败就地修正 | 重命名列表中的对象 | 需要复杂关联校验或大量参考资料时，不把一行无限撑开 |
| Popover：与锚点紧密相关的短辅助信息或轻量选择 | 入口旁显示，保留锚点关系，支持键盘和触屏 | 按公共非模态/选择合同关闭并回到原任务；关闭不隐式保存 | 查看字段解释、选择少量筛选条件 | 长表单、关键结果或必须持续阅读的说明不塞进小气泡 |
| Dialog：用户暂时中断当前任务，完成一个范围清楚的短任务/决定 | 明确标题、对象、必要字段/后果、所属操作 | 确认、取消或可达关闭；保留失败恢复，按模态合同回焦点 | 重命名确认、短创建表单、危险操作确认 | 长时间编辑、反复查询多个对象或复杂多阶段流程不层层套 Dialog |
| Sheet/Drawer：从当前对象/列表进入有较多内容的辅助详情或编辑 | 侧向内容区保留原定位线索，提供自己的标题、正文和动作 | 结束后回到原列表/记录；长内容在所属 Body 滚动 | 从任务列表打开完整详情或分组配置 | 背景可见不等于可操作；需要同时操作两侧时不能用模态 Sheet 代替分栏 |
| 持续分栏：连续选记录、读详情或对照工作是主要体验 | 列表与当前详情/编辑并列，选中对象归属清楚；各区滚动边界明确 | 切换记录保留集合位置，必要时处理当前草稿；关闭详情后仍可定位 | 连续处理收件箱消息、逐条排查记录 | 偶尔看一次详情不必常驻占据半屏；窄屏按任务安排返回与单区展示 |
| 独立页面：任务有独立工作空间、复杂结构或持续编辑需要 | 页面标题标明对象与任务，内容按阅读/操作顺序分组，保留来源/返回入口 | 由宿主路由和草稿策略处理保存、离开、返回与刷新 | 编辑包含关联规则和预览的完整配置 | 普通单字段修改不必总跳新页；独立页本身不会自动保存草稿 |

Dialog 与 Sheet 的形状不决定模态性；背景是否允许操作、焦点限制和关闭规则必须一致，采用时以公开组件的实际合同为准。非模态区域不限制全局焦点。普通次级选择复用菜单/选择器/Popover，避免新增嵌套模态；必要离开确认应形成一个清楚的决定，不能绕过草稿保护或留下不可返回的焦点层。定位链接也可以由宿主映射为详情抽屉，须明确直接进入、浏览器返回与显式关闭的目标；深链接不自动要求新页面，不因此新建路由或草稿服务。

#### 动作归属与确认

| 动作范围 | 默认位置与内容 | 出现、执行和退出 | 不适用/反例 |
| --- | --- | --- | --- |
| 页面/当前对象 | 页头 actions；名称说明作用对象，突出当前任务主动作 | 随该任务与权限显示，必要前置未满足时给具体原因/入口 | 不把“添加当前记录的附件”放到全局应用头部 |
| 区域/集合 | 区域标题或所属工具栏，搜索、筛选与动作各有位置 | 只影响该区域；相同工具不在页头和集合内重复接线 | 某个表格刷新不刷新整个应用 |
| 单条记录 | 记录附近的具名按钮/链接或行操作区；低频动作可进入更多菜单 | 高频操作可发现，键盘/触屏可达；执行针对明确稳定对象 | 不只在 hover 才出现唯一入口，也不把整行点击作为唯一操作方式 |
| 批量 | 选择后在所属集合工具区呈现数量、实际选择范围与动作 | 明确当前页/跨页/全部匹配；筛选或数据变化后按宿主合同处理选择；部分成功按记录反馈 | 不让“已选 5 项”暗中操作全部搜索结果，不强制浮动工具遮住正文 |
| 表单 | 所属 FormActions 或容器 Footer，保存/取消与反馈相邻 | 提交归同一 owner，忙态只阻止冲突动作；成功后按真实结果更新和退出 | 关闭不默认保存，取消本地等待不宣称服务端已回滚 |

跨页/全部匹配操作仅在宿主已有合同能确定并执行相应目标范围时开放，不以当前页记录假装全量。总数未知时用可理解的真实范围描述，不伪造精确数量；结果未知先核验，不能把它直接归入“失败项”再次写入。

同一任务突出一个主动作；独立任务区域可以各有主动作，纯阅读区域可以没有。危险操作在决定前展示真实对象、范围、后果和可恢复性；需要确认时使用有明确动作名称的 AlertDialog/确认流程，不使用泛化的“确定吗”。是否输入对象名取决于风险与产品要求，不能作为所有删除的固定仪式。低风险可恢复操作应减少重复确认；仅在已有领域能力支持时提供撤销，撤销已执行动作与取消未提交编辑是不同含义。

#### 反馈位置与保留时间

先区分临时操作通知与持续任务状态。保存成功、复制完成、偏好已保存等不需要继续处理的页面级临时通知，必须使用现有公共Toast；不得在页面正常文档流中show/hide一整块Alert、Card、横幅或提示行，先把原内容顶开、关闭后再让原内容回位。通知出现、更新、自动关闭和手动关闭均不得挤动原内容区、重置滚动或清除未提交输入，也不无故转移焦点；用户主动进入通知及关闭后的回焦遵循公共通知合同。同一次临时通知保持一个owner，不同时插入页面提示块和Toast，也不另建私有通知浮层。

反馈的持续时间由用户是否仍需要它判断；可修正错误、持续风险与关键结果应保留所属入口，不能靠用户记住一次瞬时提示。这些持续内容继续使用现有字段、DataRegion/DataTable反馈槽、Alert、状态展示和结果内容；不得为了消除跳动将字段错误、读取失败/重试、权限阻断、写入结果未知或一次性密钥全部塞进自动消失Toast。控件自身在既有位置更新图标、按钮文字或busy状态遵循原公共合同，不再额外复制一份页面通知。

| 触发条件 | 信息与承载位置 | 持续、恢复与退出 | 反例 |
| --- | --- | --- | --- |
| 字段校验失败 | Field.error 关联原因与可修正要求；多字段问题可在表单给错误摘要 | 错误随实际校验更新；显式提交失败按需要定位首错/摘要，输入中不反复抢焦点 | 只显示“参数错误”Toast，无法定位字段 |
| 表单提交失败 | 所属表单/操作区展示失败摘要及真实恢复动作，字段问题仍归字段 | 保留可修输入与原任务；修正/再提交后按结果更新 | 关闭弹窗、清空表单，再要求用户重填 |
| 首次读取中/失败 | 在需要数据的区域显示 LoadingState 或错误与可用重试，保留壳、标题及仍可用工具 | 读取确认后才显示结果/空态；只有整项功能不可用时才扩大反馈范围 | 单个表格失败就整页白屏；等待时先显示“0 条” |
| 同范围刷新失败 | 原数据区保留最后可信内容，局部 feedback 标明刷新失败/可能过期 | 仅展示真实已知的更新时间；重试成功后解除提示 | 用骨架或遮罩盖住已有记录，或将旧数据标为刚更新成功 |
| 空集合/无搜索结果 | 集合空态说明真实原因，分别给可用的创建入口或清除/修改筛选 | 有确认数据后出现，范围改变后更新 | “没有结果”时隐藏搜索和清除条件入口 |
| 无权限/前置不足/对象不存在 | 在所属对象或区域表达不同事实，提供实际可用入口 | 权限/对象变化按真实合同更新；有无存在事实须符合授权范围 | 一概当空列表，编造申请权限、恢复对象等未提供能力 |
| 操作执行中/进度未知 | 发起动作与所属任务区域显示忙态、真实阶段或等待文案 | 只显示已测得进度；持续后台任务保留可再进入的观察入口 | 用计时器编造 90%，把客户端等待结束当任务已停止 |
| 写入结果未知/批量部分成功 | 操作区说明尚未确认或各记录结果、已确认范围及可行下一步 | 沿既有核验/恢复能力更新，不自动重发；局部失败保留可处理对象 | 超时直接宣布失败并重做全部写入 |
| 成功且有重要结果 | 原任务结果区或实际对象页面提供单号、链接、复制/下载或下一步 | 保留到用户明确离开/关闭或该结果展示期结束；临时凭证按敏感结果合同清理 | 生成 API Key 后只在自动消失的 Toast 中显示一次 |
| 低权重瞬时反馈 | 页面级已复制、普通保存成功、偏好已保存或无需继续处理的提醒使用公共Toast | 沿公共通知合同关闭；新增/关闭不进入页面流、不挤动原内容；需修正/持续阅读的信息另有就近入口 | show/hide整块成功/通知横幅把内容顶开再回位；用Toast作为唯一错误、必要确认或关键结果记录 |

刷新、范围变化与迟到结果的完整行为继续遵循[数据刷新与视图连续性](#数据刷新与视图连续性)，不由呈现选型增加请求、持久缓存或重试owner。自动轮询和普通刷新不逐次弹“刷新成功”；只有确需反馈的显式用户动作才按真实结果通知。必要错误解除、真实内容变化和用户主动展开可以有符合任务的自然高度变化，但不能用定时器反复插入/移除通知块制造几何往返；也不能靠大块空白占位、固定反馈高度、裁切或隐藏原内容掩盖它。

验收在同一视口、同一范围和未变化数据下，连续触发临时通知，记录出现前、显示中、自动关闭后及手动关闭后原内容节点的bounding rect、身份、滚动、activeElement与输入/选区；未发生真实业务变化或用户主动操作的值应保持；主动进入通知及关闭回焦按通知合同另行检查。截图只作辅助，不能单凭CLS分数或某一帧认定交互期间没有跳动。真实业务内容更新与必要持续反馈的自然增高单独归因，不要求用Toast隐藏它们。

#### 输入、编辑与离开

表单字段的关系、列数、错误、动作与草稿基础按[表单标准](#表单和响应式)。控件按填写语义选择，不能用 Tab 冒充字段取值，不能用 disabled 输入框替代普通详情。

| 输入任务 | 应当使用的承载 | 触发与内容规则 | 不适用/反例 |
| --- | --- | --- | --- |
| 少量互斥选项需同时理解 | 单选组或语义明确的 ToggleGroup | 展示可理解标签；值是表单草稿还是即时设置须明确 | 选“正式/测试环境”不因此建立两个内容 Tab |
| 从枚举/记录中选择一个值 | 简单选择用 SimpleSelect；需要检索辨识时用 Combobox/适用公开选择器 | 标签、搜索、未知值与无结果各有语义；数量本身不决定强制搜索 | 不能让普通用户背 ID 手填，不能把普通选择器变成含复杂业务操作的导航树 |
| 独立多选/确认 | Checkbox 或公开成组选项，按关系分组 | 选择含义与作用范围可读，必需确认由真实任务决定 | 必选确认不预勾后伪称用户已同意 |
| 开关状态 | Switch 等明确二态控件 | 说明改变的是即时事实还是待保存草稿；结果由确认事实更新 | 失败仍保持假成功，或将未知当“关闭” |
| 自由输入/专业内容 | Input、Textarea 或已有领域编辑器 | 单位、精度、格式与业务合同匹配，给真正需要的帮助和空间 | 不因没有业务表单就默认把内部 JSON/AST 暴露给普通操作任务 |

内联编辑应有明确且键盘/触屏可达的进入方式；hover 只作反馈，不自行进入编辑或提交。Enter、失焦保存、Esc 取消按已声明的字段与表单合同执行，不能统一把 blur 变成写请求；保留多行输入与中文 IME。验证依据字段和既有专项合同选时机，不在初始空白页铺满错误；需要服务器事实的校验不伪装为本地已通过，密码等专项交互沿其公开规则。

高级字段收起时，摘要保留已生效的非默认配置与错误标识；提交失败能够展开并定位相关字段。不能让用户因错误位于未打开区域而无法继续，也不能为了减少首屏信息隐藏必需填写的前置。

只有即将离开会丢失有意义修改时，才需要保留、放弃或继续编辑的明确决定；正常切 Tab 且草稿仍在时不反复确认。草稿保存位置、期限、身份隔离和恢复由宿主既有能力决定，不默认新增 localStorage 暂存，密码/令牌不因防丢稿而持久化。关闭、刷新、对象切换与提交中的退出分别检查实际语义；浏览器离开提示与宿主返回流程不能宣称完全等价。保护草稿不能移除可理解的退出入口。

#### 窄屏与交互连续性

先保留对象辨识、关键状态、必要值和主要动作，再调整排列、披露和滚动。逐条阅读/处理的集合可以在宿主选择等价列表或卡片；比较任务可以保留公共表格的表内横滚。两者均须保留必要字段、排序/选择/批量语义与完整值入口，不强制所有窄屏表格改卡片，不把私有表格 DOM 改造成第二套组件。

分栏可转为列表→详情的单区流程，详情保留对象与返回入口，返回恢复搜索、选择和列表位置；Sheet 的宽度、表单列数与 Footer 沿公共容器合同。长中文、200%文字/浏览器缩放允许自然换行和必要滚动，动作不被固定栏遮住。截断值提供键盘/触屏可打开的全文、详情或复制入口；Tooltip 只补充短说明，不是唯一完整内容入口。模态关闭回到合理触发位置，非模态切换不抢焦点；数据刷新或布局变化不能无故清除输入、选中项或重挂整个任务。

本节与 Stitch 在[业务界面信息与交互设计标准项目](https://stitch.withgoogle.com/projects/6825216174800188019)中经三轮讨论整理，经用户审阅、与现有公开能力及slot合同复核后纳入本文件；本文件是唯一正式规则来源，采用项目无需再读独立草案。内容切换的语义与模态焦点分别参考 [WAI-ARIA Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) 和 [Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)，内容组织边界参考 [Carbon Tabs 使用指南](https://www.carbondesignsystem.com/building-blocks/core/components/tabs/guidelines)；本节的业务选型由 xui 维护，不把参考系统的组件 API、尺寸或样式引入为默认合同。

### 高信噪比页面组合

xui既提供控件，也定义它们如何形成清楚的任务界面。每个默认可见区块须帮助用户判断当前事实、理解阻断或执行下一步；主次通过顺序、分组、对齐、宽度和逐步披露表达，不能只靠颜色、加粗、缩字或把内容全塞进卡片。先确定页面主任务，再选公共组合与容器；宿主提供领域内容和动作，不重新发明通用控件与状态。

下表按完整场景演示前述决策；字段、动作和条件只是场景输入，采用项目须替换为自己的真实能力，不能据此新增“暂停”“重试”等未提供的业务操作。

| 页面任务与核心问题 | 默认信息与公开承载 | 触发后呈现、容器及理由 | 退出与恢复 | 不适用/反例 |
| --- | --- | --- | --- | --- |
| 任务查询列表：有哪些任务、状态如何、下一步能做什么 | PageHeader 的标题/范围与适用创建动作 → SearchToolbar 的搜索和状态筛选 → DataTable 的名称、状态/阻断摘要、比较值与行入口；计数一次 | 选状态仅过滤集合；查看详情用 Sheet 或对象页面。简单行编辑可内联/短 Dialog，复杂编辑按任务另选；选择记录后在集合工具区显示实际批量范围与可用动作 | 关闭详情回原记录；同范围保留搜索/滚动与有效选择，筛选变化按选择合同处理；刷新失败保留可信记录，批量部分失败可定位 | 把状态过滤伪装内容 Tabs；列表上方常驻整份创建表单；以“已选”暗指所有匹配记录 |
| 对象详情：当前事实是什么、如何配置、发生过什么 | 页头显示对象、关键状态与可用动作；概览用键值组和有判断价值的指标；概览/配置/历史需要独立阅读时用内容 Tabs | 查看历史进入事件时间线/记录；完整技术属性按需展开；需要比较的当前值/目标值直接同屏对照。连续选记录阅读时采用宿主分栏，偶尔查阅可用 Sheet | 切换内容保留适用草稿、局部条件与阅读位置；对象切换或失效明确处理。详情刷新仅影响所属事实，不复制查询 owner | 把变更前/后藏在两个互斥 Tab；每个属性套 Card；用时间相近推断因果 |
| 长配置编辑：如何完成并保存一份相关配置 | 独立任务所需工作空间用页面；明确对象 → Fieldset/FormGrid 的相关字段组 → Disclosure 的适用高级项 → 所属 FormActions 与反馈；短相关字段同行、长内容跨列 | 高级项在原位置展开，生效设置/错误在摘要可辨识；依赖字段按真实前置展示。复杂规则/预览保留领域编辑空间，不按字段数量强制弹层 | 提交失败保留输入，字段错误就近关联；必要时展开并定位首错。离开会丢稿才确认，保存成功后按权威事实更新；窄屏按净宽转列，Footer 可达 | 多子区域编辑挤进小 Dialog，再弹次级 Dialog；失焦自动写入；用清空表单或刷新页面处理失败 |
| 多阶段任务工作区：当前在哪一步、何处阻断、能做什么 | MenuLayout/AppShell 的 page slots、DataRegion 与领域组合呈现当前阶段、真实前置、主要对象/结果及可用入口 | 配置与完整历史按需查看；步骤表达真实前后关系，前置不足给具体原因和已有入口 | 阶段、权限、路由及执行由宿主提供，刷新保留当前工作；必要参数与结果在所属任务中恢复/清理 | 将所有后续空表、禁用表单和实现说明平铺首屏，或在 xui 内猜测业务流程 |

普通正文和表单按任务选择适合阅读的内容宽度；表格/画布可使用更宽工作区。宽屏空间用于合理列宽、比较与分组，不是拉长所有按钮、边框和说明。窄屏按既定信息优先级换行、跨列和披露，保留对象、状态和主动作；200%放大允许必要滚动，不能裁切或隐藏核心任务。

空状态、无权限或前置不足时，保留用户能理解的位置与下一步；独立功能仍按实际需要可见。不能为了“页面完整”堆空表、重复计数、无效确认项或大块解释；必要业务风险、确认与数据缺口要用可理解的短说明表达，完整规则/协议细节按需阅读。真正需要专业JSON/规则编辑的任务遵循表单标准，不把内部模型默认当作普通操作界面。

执行时在实际公开入口中完成页面区域到组件/slots的映射，记录支持视口与状态样本。已有[列表/表单/详情](../examples/foundation-react/app.tsx)、[工作区](../examples/workspace-react/app.tsx)和[数据表格](../examples/data-table-react/app.tsx)提供公开消费参考；它们的合成数据不证明业务流程。外部设计图可以用于校准布局，须再映射真实公开能力并验收，不从图稿复制第二套控件皮肤或把图稿当作功能通过证据。

私有组合组件沿用同一优先级，不把组件内部最显眼的统计值或按钮自动提升为整页重点。例如项目的“任务执行面板”先说明任务对象、当前状态、阻断原因和可用动作，再显示支持判断的指标；执行历史与原始日志按需查看。未执行的任务不显示完成勾，未知进度不填百分比，重试只在领域能力确实支持时出现。该例说明信息关系，不要求所有项目采用相同页面布局。

在声明的常规任务视口内，查询/处理页首次完成加载后，无需滚动页面即可辨识核心对象、关键状态和主操作；检查元素完整可见、文字可读、实际命中，不只检查DOM存在。长表单、长正文、窄屏及文字或浏览器放大时，按任务顺序允许必要的自然滚动，保留任务辨识、关键状态和操作的完整可达性。不得为强行塞进一屏而隐藏必要信息、裁切动作、缩小字体、用固定栏遮挡正文，或使用截图时特殊缩放伪装通过。

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


### 手动查询页布局与状态合同（4.2.20）

手动提交条件的查询页采用 `MenuLayout/AppShell.pageHeader → pageToolbar(QueryForm) → children(DataTable)`。PageHeader 只放任务标题与真实页面动作；查询主按钮归 QueryForm.actions，刷新当前已提交条件归结果 toolbar，分页归结果 footer。不得在 pageToolbar 与 DataTable.toolbar 重复查询条件，不给已有表面再套 Card，不将短枚举和主输入机械等分拉满宽屏。完整可运行组合见 [查询页示例](../examples/query-page-react/app.tsx)，合成数据仅用于演示公共交互。

| 区域/slot | 必须填入的内容 | 默认呈现与边界 |
| --- | --- | --- |
| QueryForm.fields | 直接 QueryField（可用 Fragment 分组），每项一个公共控件；label/help/error 沿用 Field 关联 | `primary` 主标识/搜索输入；`compact` 短枚举；`standard` 普通字段；`full` 长规则跨整行。标签与必填标记保持可见，帮助和错误分别归自己的轨道 |
| QueryForm.actions | 查询 `type=submit`，以及宿主确实提供的重置等动作 | 查询采用公共主按钮；次动作 outline/text。按钮自然内容宽，与同带控件底边齐；不靠标签占位、负 margin、固定高度或缩字对齐 |
| QueryForm.advanced | 次要日期/范围条件，使用 FormGrid/Field/DateTimePicker 等既有组合 | 复用 SearchToolbar 唯一 disclosure Controller；收起保持 DOM、草稿、hidden/inert；关闭时内部焦点回展开按钮，外部已移动焦点不抢回 |
| QueryForm.summary | 宿主已提交并确认归属的范围说明 | body-xs/muted，无内容不占位；不能把未提交的隐藏草稿写成已生效条件。查询/失败后仍须辨明结果对应哪个范围 |
| DataTable.idleState / emptyState / errorState | 尚未查询 / 已查询无匹配 / 首次失败的差异化内容 | 位于同一语义表格结果框；保留列头。提示宽度按表格可视滚动区域，横滚及RTL后仍可读，不按所有列宽之和居中。轻量居中引导使用 EmptyState.align=center，可选 icon 仅装饰；不造全屏大空卡或重复说明 |
| DataTable.toolbar / footer | 已提交结果的局部刷新；真实计数和单一受控分页 | 不添加图稿中的假耗时、节点或总数，不复制查询 owner；横滚只属于表格，不能扩大整页 |

查询宽度由集中 Token 定义：根字号16px时 query-field-primary=480px、compact=192px、standard 继承 layout-field-min=240px，query-field-min=160px是宽容器流式轨道的下限，并非手机硬最小宽。字段不超过其容器和角色上限，主输入在可用空间不足时先收缩/换带。QueryForm 自身净宽不超过40rem时转单列，各控件占当前列净宽，动作组在字段之后按 DOM 顺序换行；40rem随根字号缩放，不按整个屏幕猜侧栏后的空间。长中文标签自然换行，同带共享 label/control/help/error 四条轨道，动作组只与 control 轨道底边对齐；多行动作按DOM顺序自然换行，以整个动作组的末行底边对齐，帮助和错误不推走动作。不固定文字高度或行数。

表单和结果各一层 layer-raised/surface-line，沿用 Surface、控件及 DataTable 的默认边框/圆角；不加装饰性彩条。内距 card-padding，字段/动作间距 layout-toolbar-gap，相关支持文案沿用 space-text-gap。标题沿用 PageHeader；标签13/20px、控件与动作14/22px的默认角色与继承由公共组件负责，宿主不逐个改字号。采用项目可通过现有主题合同改变语义 Token，不用私有 CSS 重建 QueryForm。

| 查询状态 | 宿主确认事实及现有公共接线 | 必须保留 / 禁止 |
| --- | --- | --- |
| 尚未查询 | status=idle、hasValue=false，idleState 解释必要输入 | 保留表单/列头；不把尚未请求说成无数据或0条，未确认时不提供伪分页事实 |
| 首次加载 | status=loading、hasValue=false | 表体内居中 LoadingState，保留壳、输入与焦点；不隐藏整页/重挂控件或整页 reload |
| 成功有结果 | status=ready、真实 rows 与可选分页事实 | 稳定 rowKey，真实 total/null，不从一页长度推断总数 |
| 成功无匹配 | status=ready、hasValue=true、rows=[] | emptyState 给可用下一步；真实空结果可报0，不能沿用“尚未查询” |
| 首次失败 | status=error、hasValue=false | errorState 与可用重试，保留条件/输入；不清稿或自动无限重发 |
| 同范围刷新 | status=refreshing、hasValue=true、保留旧 rows | 同一 DOM/rowKey/表格几何、阅读与滚动；按钮局部 busy，不加整区遮罩 |
| 刷新失败 | status=error、hasValue=true，旧 rows 保留 | 结果 footer 就近反馈失败，旧事实可读；旧数据不得被清空为假空态 |
| 提交新范围 | 新请求范围键，hasValue=false、清旧 rows 后 loading | 旧结果不冒充新条件；取消/代次丢弃迟到响应；草稿未提交时不自动刷新或换范围 |

QueryForm 是 HTML form 与布局，不查询、不缓存、不推断权限、业务时区、起止顺序或窗口限制。例子复用 `createResource` 的同 key 保值/新 key 清值及取消代次；宿主已有查询 owner 时继续使用它。DateTimePicker 仍传递无时区分钟字符串，不为此页面增加协议适配或时间戳转换。提交失败、范围变更、分页及重置由宿主显式决定；重置草稿不自动改变已展示结果的范围。

“重置草稿”只恢复明确的草稿基准，不提交、不刷新、不改结果范围。“清除已生效筛选”是另一项显式查询动作：提交空过滤并从首段读取，允许经同一请求owner发起一次查询；不得用“重置”文案暗示无请求。StructuredLogExplorer自4.2.22采用下表，不将旧“清除筛选”请求认定为HTTP故障。

| StructuredLogExplorer 内容 | 公共layout/slot与状态归属 |
| --- | --- |
| 标题、刷新、取消、host headerActions、确认的命中数 | PageHeader；刷新使用service已提交filter，保留同范围结果 |
| 分组/全量切换、组内返回、host pageToolbar | 查询表单之外的Toolbar；短枚举继承query-field-compact净宽上限，视图变化是已有service动作，空槽不占位 |
| 摘要、等级 | QueryForm.fields中primary/compact QueryField；即时编辑只改原ViewController.draft |
| 时间、来源、性质、类别、组件、错误码、对象 | QueryForm.advanced内FormGrid/Field；原ViewController.filters负责展开、hidden/inert和回焦，时间保留RFC3339Nano与显式offset |
| 应用、重置草稿、清除筛选 | QueryForm.actions；submit/reset/button分别调用service.setFilter(draft)、view.setDraft(service.filter)、service.setFilter({})；重置基准为最近提交条件，不是全部空值 |
| 已提交条件与本次筛选校验错误 | QueryForm.summary；只从service.filter取范围，错误不藏到折叠区；无内容不占位 |
| 结果、游标/快照、详情与回焦 | 继续现有Table/DataRegion和唯一service；不新增total、分页、HTTP或查询owner |

验收逐个页面/slot执行 [QUERY 清单](ADOPTION_CHECKLIST.md#手动查询页逐项检查)：在真实侧栏后的净宽、长中文、light/dark/system、窄屏、200%根字号与真实浏览器200%缩放下检查控件宽度/按钮底边/焦点/高级展开及全部状态。图稿用于设计校准，正式包示例与产品现场各自验收，不能互相替代。

### 卡片页脚与读取恢复（4.2.30）

Card.footerMeta是可选次要事实轨道，优先收缩；footerActions的独立业务控件不因长来源先被挤走。meta最小轨道使用card-footer-meta-min-inline-size；可放下动作+最小元信息及间距时同排，确实不足才把动作组移到下排，再不足时动作组自然换行，禁止裁动作或缩字伪装适配。OverflowText按[Card合同](COMPONENTS.md#card)借当前卡的已有交互区域，支持揭示时省略；减少动态/粗指针/无键盘入口保留完整静态文字。不需要元信息的业务直接省略，不制造版本/权限/来源行。

CardGroup的自然/文档布局在body无滚动范围时必须将真实wheel交给外层owner，公共ScrollArea规则不能覆盖集合自己的边界；有界workspace仍由body先滚动。登录页的refresh/session可恢复读取错误只提供同一Auth owner的手动检查，unknown退出不能借此恢复旧会话。逐项边界见[公共合同](COMPONENTS.md#cardgroup滚动传递与登录读取恢复4230)。

### 页面与组件的槽位架构

#### 业务日志列表展示（4.2.27）

主视图围绕操作者、发生时间、业务摘要和结果，默认完整页保留七列。4.2.34统一为列定义：每列id/header确定位置与标题，不指定cell读取对应原值，指定cell完全使用返回内容。自定义Button/Badge/链接只占该单元格，不因业务内容新增专用公共列。原值不隐式转换时区/翻译代码；字段真实含义及显式attributes投影由宿主提供，原ID、代码、ISO和详情保持。custom列需要完整事实入口时显式保留detail，库不自动追加。查询额外字段进入queryFields/QueryField，确认范围进入querySummary，页面动作进入headerActions；公共应用/清除在QueryForm动作区，原刷新/取消保留标题次要动作，沿现有字段宽度与底部对齐，不把筛选混入标题动作。固定列宽复用DataTable长度；ellipsis使用公共OverflowText，hover/已有动作focus揭示，reduced-motion/触屏换行，字体与颜色继承表格角色。TableContainer就近揭示键盘动作并保留既有Token滚动清距。list/labels变化不重建Controller、不请求、不清草稿/详情/游标；scope更换则由同一Controller明确取消并清旧范围，不假装同范围refresh。具体API和旧展示配置迁移见[组件规范](COMPONENTS.md#业务日志列定义与查询-slot4234)。

#### 业务日志整页语言（4.2.29）

BusinessLogExplorer的整页文案属于实时展示slot，宿主语言owner把当前labels传给同一个组件，不使用key=locale、重新创建Controller或再次查询换语言。标题、筛选字段/枚举、表头、结果、加载/空/错误、分页与快照前缀、详情事实标签和动作共同更新；原业务摘要、payload、ID、action、ISO和snapshot是事实，不翻译或改写。保留同一个service/view、已生效范围、未提交草稿、详情、游标/已访问页、节点和有效焦点，在途请求不因语言改变而取消或重发。超长详情动作译文受所属表格净宽约束并自然换行，控件边界不能因动作宽于滚动区而被裁。优先级、部分覆盖替换和错误语义见[组件合同](COMPONENTS.md#业务日志整页标签热更新4229)，按[BIZ-LABEL清单](ADOPTION_CHECKLIST.md#业务日志整页语言逐项检查)验收。

#### 四类默认公共页面（4.2.23）

管理员初始化、用户登录、业务日志查询/详情和平台API Key管理，项目启用对应业务且没有已确认的特殊要求时，直接采用AdminSetupPage、ConfigurableLoginPage、BusinessLogExplorer和ApiKeyManager。品牌、文案、路由位置、主题覆盖和已有公开slot是正常配置，不构成另拼页面的理由。公共库维护整页layout、文字/色彩角色、字段、动作、反馈、刷新与焦点合同；宿主不只取Input/Button再重建同职责页面。

默认config.json的pages字段只配置四页展示和URI路径；通过[默认页配置投影](COMPONENTS.md#默认完整页面与配套接线4223)连接既有公共组件，不自动注册路由、菜单、HTTP请求、认证实例、权限或初始化状态。功能是否挂载和访问范围由真实后端能力与宿主授权决定；不存在业务日志或平台Key业务时不新增假页面/假数据。主题和Logo继承现有app/ThemeService，不另建页面皮肤。

BaseService配套的认证、Key和业务日志默认client直接连接正式webfacade，宿主不改method/DTO/错误/认证或增加前后端双重兼容层；服务前置缺失按归属反馈。管理员初始化已有公共页面，但统一后端HTTP合同尚未落地，暂用权威state/onCheck/onSubmit，不猜初始化URL或在JSON伪造允许初始化。公共缺口和确需领域专有组合的例外，分别记录场景、实际公开slot不足、保留能力和验收证据；公共增强交给xui。

layout 是从页面壳到控件内部的公共结构合同。每段内容先确定归属，再选择公开 slot/part；slot 的顺序、宽度约束、文字角色、着色、空态与滚动由 xui 维护，宿主提供事实、可访问名称、领域内容和动作。不能仅引入 Input/Button 后在外面重新组织同职责的通用页面或组件皮肤。公开 slot 中的领域内容仍须遵循本表，任意 JSX/Node 并不自动证明合规。

每个采用页面在实施前记录“内容 → 公共入口.slot/part → 文字/颜色角色 → 状态 → 滚动 owner → 检查 ID”，以固定版本类型为准。没有合适 slot 时列为 xui 公共缺口，不穿透私有 DOM/CSS。纯领域画布/编辑器等保留自己的内容和布局；不能用这种例外重写已有通用框架。槽位是布局 API，不将内部类名全部升级为可覆盖 API。

| 层/区域 | 内容与公开归属 | 呈现与着色 | 空槽、状态与滚动 |
| --- | --- | --- | --- |
| 应用壳 | AppShell/MenuLayout 的 headerSlots、sidebarHeader/sidebarTabs/sidebar/sidebarFooter、pageHeader/pageToolbar/children/pageFooter | 顶栏与侧栏用 shell 表面；主内容用 canvas；全局动作与页面动作分开 | 一个导航/主题 owner；普通Header分隔用space-text-gap；sidebarTabs专放水平line List，由List拥有唯一分隔基线，Shell交出底边与底部padding；内嵌Tabs.Panel不叠内容padding；正文容器稳定，模式与焦点见布局手册 |
| 应用顶栏 | leading=平台区域、brand=品牌、breadcrumb=路径、context=工作区；status=真实状态、actions=全局动作、auxiliary=辅助、account=账号 | 品牌/路径为正文，状态按真实 tone；辅助与账号不抢页面主动作 | 缺失扩展不占位；保留唯一导航、主题和显式启用的语言入口 |
| 页面标题 | PageHeader.title/description/meta/actions | title 唯一 h1/page-title；description 为 muted/body-sm；meta 为 muted/body-xs；actions 中 primary 为任务主操作 | 描述/meta/动作空则无包装；长标题换行，动作整组换行，不把刷新状态写进标题 |
| 页面工具 | pageToolbar 或 DataTable.toolbar 中的 SearchToolbar.search/actions/advanced | 搜索与常用筛选、动作、展开筛选各居其槽；默认中性，真实异常另用反馈 | 每组工具只有一个位置；高级筛选按需打开，焦点/草稿保持 |
| 内容章节 | Section.title/actions/children | 章节 h2/section-title，局部动作 ghost/outline，内容不额外加卡片边框 | 没有标题/动作时不生成空头部；正文自然延展 |
| 资源卡片 | Card的header/content/footer三段；title/icon/iconColor/badge/actions归header，description/children归content，footerMeta/footerActions/footerVariant归footer | title语义h2–h6、section-title；图标默认强调色tile，badge默认neutral+soft，可显式前景；description muted/body，footerMeta muted/meta；默认Footer有支持表面/唯一分隔，可选plain | 一层Surface，仅三段根级区域；默认自然高度，公开stretch让content伸展/Footer靠底，不固定正文高或等分三段；标题用OverflowText，空content/footer不占位，空间不足换行；不变伪按钮 |
| 指标与详情 | MetricCard.label/value/marker；详情用 dl 或公开展示组件 | 名称 muted/body-xs、值 metric/mono/tabular；marker 只承载真实状态。普通详情不每字段套 Card | 未知用明确占位而非 0；数值完整，标记不挤压主值 |
| 表单组 | Fieldset.legend、FormGrid.Item、FormActions.secondary/children | 语义分组、最多两列；长内容跨列；主次动作按所属表单排列 | 净宽决定列数；草稿独立于查询；提交错误在所属反馈区 |
| 字段 | Field.label/children/help/error；InputGroup.Addon/控件/动作 | label 为字段名，help 为 muted，error 为 error 文本；单层输入边界；单位就近展示 | required/invalid/describedby 真实关联；长错误自然换行，焦点和输入节点保持 |
| 卡片集合 | CardGroup.rows/rowKey/renderCard、cardSizing、toolbar、emptyState/errorState/feedback/footer与受控pagination | renderCard返回Card公开配置，集合创建实例；所有资源类型共用同一呈现。默认natural兼容；资源列表显式equal，由当前网格完整内容计算共同卡高 | 单一body滚动，toolbar/footer在外；稳定key保草稿/焦点；equal伸展content、卡尾靠底，不固定像素高度，不裁正文/动作 |
| 表格 | DataTable.toolbar/columns、emptyState/errorState/feedback/footer、受控 pagination | 对象主列、技术值、状态 Badge 与行操作按各自语义；唯一计数/分页 | 首次加载在数据区；刷新保留行；表内横滚和既有 sticky，不用外框遮罩 |

DataTable表体仅在实际存在纵向滚动范围时保留纵向边界；自然高度长表格没有自己的纵向范围，鼠标位于单元格上时，纵向滚轮仍交给既有页面/内容滚动owner。不能要求用户移到表格外才能滚动，也不能由宿主添加wheel转发、私有CSS或第二个滚动owner。横向滚动继续归表体，真正有界表体在首末边界不意外带动外层。此判断由公共布局观察器随数据、字号和可用高度更新，不按行数或layout名称猜测，详见[组件滚动合同](COMPONENTS.md#页面标题筛选与滚动)。
| 弹层 | Dialog/Sheet.Header/Title/Description、Body、Footer | 标题与说明分开，body 负责长内容，footer 放所属 FormActions | 开关只改可见性；正常 body 滚动、极端高度公共回退；关闭返回真实触发入口 |
| 导航/菜单 | NavigationMenu 的 items[].label/icon、renderLabel/renderAction 与公开渲染/事件扩展；Menu/ContextMenu 的 Item/Icon/Separator | 选中由真实 active/expanded，危险项使用 danger，图标继承语义色 | 独立分支和动作不导航；disabled 不执行；键盘及长名称由公共组件管理 |
| 原子控件 | Button/Link/IconButton 的内容与事件；Checkbox/Switch/Toggle/Radio 的标签与状态；Select/Combobox/Command 的公开 parts | 动作、选中、禁用、只读、错误分别映射已有语义，不依靠颜色推断业务 | 不给所有控件添加同一套 slot；保留原生/peer 表单与键盘语义 |
| 内容Tabs | Root=value，List=轨道布局，Tab.children/Label=名称，Icon=可选装饰图标，Panel=对应内容 | 内容宽为默认，equal在单项上限内等分可用宽度；variant默认line，显式segmented使用内嵌底色；水平line由tabs-line-baseline-shadow派生淡分隔，与单行当前项底线共基线，多行当前项仍在自身行底；强调色/字重与图标状态继承一致 | Root作为Flex/Grid子项允许收缩；纯文字无空图标位；单项上限tabs-item-max-inline-size，长名仅Label在hover/键盘聚焦滚动，减少动效/触屏等完整静态折行；键盘、disabled与panel关联见组件合同，刷新不重挂Root |
| 披露与时间 | Disclosure/Accordion的trigger/content；Calendar和DateTimePicker的已选值、查看月份及受控事件 | 当前选项与展开状态明确；时间按分钟墙上时间/ISO日期合同，时区归宿主 | 焦点连续，日期/月份事件独立；不隐式截断精度或转换时区 |
| 反馈/媒体 | DataRegion.children/feedback；Alert/Toast；Typography/Copyable/Tag/Image | 临近相关操作的状态、错误、一次性反馈；文案/图像来源真实，复制/删除有明确入口 | 状态不重挂 children；图片预留真实比例；被动文本不增 Tab stop；通知只有一个 owner |

NavigationMenu的名称槽占满主项剩余宽度。富内容仍由renderLabel组合：名称可收缩，尾随被动状态不收缩并靠逻辑末端、与名称首行对齐；分支和配置按钮保留独立轨道。仅真实名称进入NavigationMenu.Label的滚动区域，状态不随名称移动，也不伪装为renderAction按钮。紧凑rail隐藏整个名称槽，窄屏/触控/减少动态效果时完整换行，保留同一导航节点与键盘停靠。Spinner复用既有control-icon-size、line-width-emphasis、action-primary和旋转时长，以主题色开放弧表达等待；减少动态效果时静止，宿主仍提供真实忙状态文字或名称，不仅靠运动或颜色传达事实。

组件的详细 part 名称、React 组合与替换生命周期以 [COMPONENTS](COMPONENTS.md) 为准，公开入口以 [PUBLIC_API](PUBLIC_API.md) 为准；上表不发明所有控件共有的万能 renderSlot。完整判定按 [逐项清单](ADOPTION_CHECKLIST.md) 每个对象逐条记录，通过、不适用、失败、未跑分别报告。宿主填错 slot、私自着色或重复 owner 属于接入失败；公共类型和合法内容仍无法满足矩阵时属于 xui 缺口。

状态的统一边界：布局组件不请求、不缓存、不猜权限；交互组件拥有局部 focus/open/checked 等公开状态；resource/auth/业务 controller 拥有请求与确认事实。`busy` 不等于 `disabled`，`readOnly` 不等于 `disabled`，错误不等于空数据。正常 React render 是更新，切换 key、清空 DOM 或条件卸载是重建，不能用后者实现同范围刷新。刷新与范围切换、取消、失败恢复按下方连续性合同执行。

应用基础设施按单例 Service 组织，统一在 React 挂载前调用 `bootstrap(overrides)`。唯一默认值来源为 runtime 正式包的 `config.json`；参数只覆盖项目需要变化的字段：对象递归合并、数组整体替换、undefined 保留默认，未知公共键及非法值必须拒绝，`extensions` 留给宿主校验业务配置。JSON 不承载函数、实例、密钥或权限事实；可替换的平台实例在独立 environment 参数声明。ConfigService 提供不可变启动快照，ThemeService 管理文档主题，RouteService 管理 History URI，MenuService 管理菜单内容，I18nService 管理语言和纯文本资源，HTTP/Auth/Clipboard/Download/Upload 复用各自唯一基础设施；UtilService 仅组织纯函数。不另设万能事件总线、业务缓存、查询或全局表单状态。

Clipboard的HTTP回退使用不可见、脱离文档流的1×1 CSS px原生选区，这是OS复制必需的平台几何，不属于视觉尺寸/主题缩放Token；设计值门禁仅在clipboard-service.ts的width/height放行精确1px。服务不读取系统剪贴板验证成功，也不创建反馈或通知owner。真实回归须用无shim平台及合成文本完整比对OS内容，不能以execCommand返回true或copied状态代替，见[剪贴板服务](PUBLIC_API.md#剪贴板复制服务)。

bootstrap 只完成配置注册及首绘主题、缩放、初始语言/标题；其余 Service 实现由对应窄模块导入，并在首用读取同一配置。导入不发请求、不启动查询或会话恢复；不通过全量 service 汇总入口隐式拉入所有功能。依赖按职责单向递进：Menu → I18n → Config，Upload/Download/Auth → 同一 HTTP，组件 View → Controller → Service。基础 Service 使用稳定单例引用；局部队列/草稿/分页仍逐实例，不设复制所有事实的 StateService。启用认证的 HTTP 首次请求必须先绑定唯一认证 owner，缺失模块在发送前明确失败。依赖与迁移的逐项检查见 SERVICE-010～013。

主题、缩放已有 sessionStorage 偏好优先于配置默认值。语言开关关闭时使用配置默认语言且不展示全局切换入口；启用后通过公开语言服务订阅，菜单翻译和页面文案共同更新。已有显式宿主语言 owner 必须通过公开接口借用，不保留第二份语言状态。组件的 labels/locale 扩展继续有效，语言服务不代表已提供所有语言的全组件翻译资源。项目主题 CSS 仍按本规范语义 Token 生成，config 不引入任意控件皮肤或 CSS 覆盖入口。

路由统一使用 pathname 与 search，hash 仅用于文内锚点。导航不刷新文档、不以路由变化重建整个页面壳；部署必须为应用 URI 提供 HTML fallback，同时保留资源/API 的真实 404。返回、前进、外链、下载和修饰键遵守浏览器语义。MenuService 不拥有展开/收起、焦点、权限判断或业务请求，这些仍归导航实例 Controller 与宿主。SSR/嵌入隔离通过显式 `new XuiServices` 注入同一公开契约；只销毁容器自身创建的服务，不销毁借用实例。组件 Controller 工厂保持逐实例；基础 Service 的 `create*` 构造入口在 2.0 移除，具体迁移见 PUBLIC_API 与 ADOPTION。

通用语义交互采用可替换 Controller：未注入时 View 创建唯一默认实例，注入同一公开契约时只订阅该实例；初始化、受控确认和意图回调配置与注入互斥。受控事实只由宿主确认，用户请求不能先发布未确认值。切换实例退订旧订阅，View 不销毁注入者实例，不把动态配置覆盖到注入模型。默认实例清理兼容 StrictMode effect replay；真实退出终止所属等待并隔离迟到结果，秘密 DOM 的退出清理始终有效。键盘算法、实际焦点、碰撞、滚动、媒体查询与瞬态渲染由 Base UI/DOM 执行，不建立竞争状态。服务组合的展示 Controller 只持有自身草稿/分页并引用唯一服务；默认服务必须由显式 adapter/loader/AuthClient 配置取得，不能无配置创建认证、查询或业务事实。逐项入口、例外与未满足项以 [组件状态合同](COMPONENTS.md#状态所有权与-controller-模式) 和 [接入检查](ADOPTION_CHECKLIST.md) 为准；Toast 采用 xui 自有唯一队列 Controller；动作入口与 View 订阅同一集合，不借用 peer 私有 store。


上传使用现有 Field/Button/Badge/Progress 的字体、色彩和空间 Token，不另造皮肤。文件名称继承正文，元数据/等待继承 help，错误继承 error，状态只在所属 Badge 着色；完整文件行/结果/actions 的槽位见组件手册。首次无队列保持选择入口，上传时保留所有文件行和已有确认结果，等待指示相对所属文件行居中，响应就地更新。取消/失败不宣称回滚，无实际上传字节测量时不显示百分比；移除、取消和完成后的焦点保持连续。宿主不穿透私有 DOM/CSS 补齐这些行为。

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

Table与DataTable全表默认仅使用行分割线，所有th/td均无列分割线；sticky只固定位置，不额外增加竖线、阴影或伪元素分隔。表头底线、行线、整体外框及footer分隔各有归属，不叠加重复边框；最后数据行与footer交界由footer维护。当前不提供行列网格模式或分割线开关。表格由表头、行线和不透明条纹组织；条纹与默认底先完成不透明合成，sticky 同步该行 default/偶数/hover/selected/expanded 背景。透明条纹或透明固定列不得让横滚底层文字穿透。普通 hover 不浮起、缩放或平移。

菜单、Popover、Dialog、Drawer 使用不透明 overlay、明确边界和一套浮层阴影：0 8px 24px -4px（浅色ink18%、深色black60%），辅以1px边界。深色层次为 canvas #090b0e → shell #0d1016 → surface #11151c → raised #141a24 → overlay #1a2230；active/hover 使用独立交互配方。实际阴影色仍来自集中变量。普通 flat/subtle/surface/raised 无投影；不把浮层配方复制到每张卡。

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
| Button / 图标按钮 | default36、sm32、xs24、lg40px；padding12/10/8/16、gap6/6/4/8；文字按钮radius-md、纯图标按钮radius-full，命中区与紧凑圆面按下方统一轮廓区分。主动作primary，次动作outline或中性secondary，重复行操作text，行内危险动作text＋tone=danger，独立危险主操作destructive | default/hover/pressed/focus/disabled/busy/error；只有真实切换才selected。Enter/Space执行，图标有名称；不改变请求、防重、确认。工具栏换行不裁掉动作 |
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
| 垂直导航菜单 D/H/S/F/X；B/E仅所属业务存在时 | 高nav-item-height=36px、gap8、radius4；默认透明。内容始终保留12px内距 | D用menu-item-background/foreground；H用menu-item-hover-background/foreground，无位移且无左指示；S用menu-item-selected-background/foreground并显示nav-selected-indicator-*，无四周外框；S+H保持S。F不新增外框，沿用原选中与键盘语义；X文字muted且不可操作，不以hover伪造可用 |
| Dropdown/ContextMenu项 D/H/S/F/X；非选择项S不适用 | overlay+1px边界+shadow-overlay；menu-min-width128、item-min-height28、padding4、项内横8/gap8、radius-md、body-xs | D透明，H轻底不位移；radio/checkbox持久S用menu-item-selected-*和勾选语义，不画导航左竖线。F不新增外框，禁用不执行。方向键/Home/End/子菜单/Esc规则如下；业务B/E/空结果不是普通可执行选项 |
| Button/图标按钮 D/H/P/F/X/B/E；真实切换才S | 高button-height36、padding12、gap6；文字按钮radius4、纯图标按钮radius-full；背景button-background、文字button-foreground；图标16（xs12） | H用button-hover-background，P用button-pressed-background且松开恢复，适用按压反馈沿下方动效矩阵。F仅改变已有可见边线颜色；X用button-disabled-*并禁用执行。B保留已有忙碌文案，防重由业务拥有。outline=raised+surface-line；secondary=muted；ghost默认透明、H=interaction-hover；危险用status-error-soft/foreground及原确认 |
| Input/Textarea/搜索 D/H/F/X/E/readOnly；B由业务拥有；S不适用 | input-height36、radius4、input-background/foreground、1px input-border-color；label→control→help→error，8/4/4px | H保持input-border-color的必要对比；F仅改变已有边线颜色，错误优先；E的必要控件边界用status-error-foreground，status-error-line只用于有文字/图标伴随的辅助分隔；关联aria-invalid/describedby，E+F保留错误边线。readOnly可选择复制；X不可编辑；loading不自行改请求。placeholder不代替label |
| InputGroup D/H/F/X/E；S/B按内部控件 | 同输入，一层边界和焦点，addon/清除与内容gap8 | 外层映射内部真实focus/invalid，内部不重复border/ring；帮助和错误不撑偏相邻控件，不制造第二层皮肤 |
| Combobox/自定义选择 D/H/S/F/X/B/E | 搜索复用输入、选项复用menu-item-*；弹层popover-width288、padding12 | 持续S与键盘活动项分开，活动项F只在键盘阶段存在。搜索输入保留焦点，方向键/Enter选择；无结果与错误不同，不自动选首项、不改查询防抖；NativeSelect由平台负责面板 |
| Checkbox/Switch/Toggle D/H/S/F/X/E；B仅业务已有 | Checkbox默认16×16px（control-icon-size）、radius-sm、1px input-border-color；Switch宽28/高16.6px、拇指14.4px，圆形轨道；Toggle使用toggle-height默认28px、gap4，放大文字可自然增高 | S用action-primary及成对前景或interaction-selected-*，必须有真实checked；H不盖S，F仅改变已有边线颜色，E相关错误优先，X不可切换。Space/方向键遵循角色；不得仅换颜色模拟checked |
| Tabs D/H/S/F/X；B/E归panel，P/S不混同 | 项至少control-height-sm32、轨道内padding3、项radius-md；label body-sm，常规body400、选中heading600；可选装饰图标16px、图文间距space-icon-gap，文字与图标颜色继承所属Tab | 轨道layer-support与一层surface-line，项间space-text-gap，默认按内容宽度且不越过容器；显式equal在单项上限内分配。未选文字muted-foreground，H用interaction-hover，S用layer-raised、surface-line细边界与action-primary形成内嵌选中层，非选中项预留同宽透明边界，F不新增边线或焦点环。没有额外selected外圈或左竖线；可选line移除外槽/项内框，项预留line-width-emphasis底边，只有当前项以currentColor着色；F同样不新增外框，H不覆盖当前文字/线，普通尺寸/文字继承不变。单项上限tabs-item-max-inline-size，Label复用OverflowText且只滚名称；方向键及panel关联完整，禁用项跳过，panel加载不禁用Tab |
| 表格/列表 D/H/S/F/B/E；X属于行控件 | cell padding8、动作gap4，表头body-xs/500、正文body-sm，分隔separator-line；opaque条纹 | H用interaction-hover，S/expanded用interaction-selected背景；sticky与整行不透明底一致。F只归焦点控件/确有键盘行，不给被动行造焦点。B/空/E保留所属状态和恢复入口，排序/分页真实禁用 |
| Card/Section/连续Item | Card单层raised+surface-line、radius6、按三段消费card-padding14；图标tile的size/offset/background及Footer背景由组件Token定义，Footer仅一条separator-line；Section/连续Item不复制卡片分区 | Card可选plain图标/Footer，Badge有中性soft标签；默认自然高，公开stretch/equal让正文增长/Footer靠底。被动仅D/B/E，交互仍归内部控件；不加被动hover/伪按钮、不固定摘要行数或编造指标 |
| 统计/指标 D/B/E；H/S仅已有tooltip或范围控件 | metric-padding12/gap4，label13/muted，主值24/600/tabular、单位13 | 0/未知/无数据/B/E分开，核心统计才进首屏；不以disabled表达缺数据。范围S沿选择器，tooltip H/F使用overlay；指标本体无按钮hover、焦点或选中 |
| Dialog/Drawer/Sheet D/F/X/B/E；容器H/P/S不适用 | overlay+surface-line+shadow-overlay，radius-2xl默认8px（贴边Sheet按其边缘合同）；宽layout-dialog/confirm/drawer-width按40%/30%/60%与各自min/max合成；Dialog/Confirm边距16，侧向Sheet封顶视口 | header/body/footer归属明确，body滚动footer可达；F限制/恢复按模态语义，X/B/E属于内部控件/反馈。取消不自动保存，危险确认保留，不普通嵌套同类模态 |
| Tooltip/Popover/Calendar D/F；H/S/X/B/E按角色 | Tooltip最大320、body-xs；Popover宽288/padding12/gap16；floating-offset4 | 辅助Tooltip不可承载唯一重要错误或必要动作；按需帮助须键盘/触屏可打开关闭。Calendar真实日期S/disabled与方向键/locale保留，定位和回焦点见下文；不要求所有浮层本体有hover |
| Badge/元数据/状态/Alert/通知 | 元数据body-xs普通文字，不泛胶囊；Badge默认neutral纯文字，显式info/success/warning/error用status-*-foreground/soft/line、横向space-text-gap、line-width-surface及radius-md；状态保留文字/图标 | 被动D/E，H/S/F/X不适用；可交互筛选chip才有H/S/F/X。错误/风险/必要反馈即时在相关位置可见，不收进普通解释；B有可理解文案，不只转圈 |
| 图表/Progress D/B/E；H/F用于tooltip，S用于范围/确有数据选择 | chart-color-1…6、axis/legend字体12/13、grid=separator、line2/2.5、tooltip=overlay，默认plot224 | 数据系列身份稳定；H/F tooltip显示原值和声明时区，S归范围/真实选择不改变聚合；X不用于未知采样。图例可换行，0/缺样本/B/E不互换，实际PNG另验独立document-* |

未列出的专属编辑器、树、画布或组件变体，必须在采用层补具体尺寸、语义变量、适用状态与交互证据；不把本表称为所有组件及全部业务竞态已穷举。本表定义外观契约，不声明任何采用项目已完成迁移。

### 垂直导航选中指示与收起定位

选中导航使用左侧独立短竖线、浅底和强调文字/图标，不是四周外框。默认指示颜色nav-selected-indicator-color→action-primary，宽2px、高16px、圆角1px，离菜单项左边4px，指示与内容的保留间距6px。文字区域左内距由inset4+width2+gap6=12px计算，所有状态都保留此内距；指示absolute垂直居中，不参与布局，不令选中切换横向跳动。

收起图标导航默认项36×36px、图标16px居中；指示离左边2px、高16px、宽2px，图标左边10px，间隔6px。使用nav-collapsed-item-size和nav-selected-indicator-inset-collapsed，不给选中项增加padding。采用项目若改变项/图标尺寸，必须核对剩余间距，不能压住图标或点击区。完整名称保留可访问入口，键盘/触屏可通过明确的展开导航或帮助获得，不只依赖hover。

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

Icon的可选blink只表达宿主提供的关注事实：默认关闭；开启且未指定color时使用action-primary，通过motion-duration-pulse、motion-easing与motion-feedback-opacity-start进行不闪灭的明暗交替。color可直接引用公共语义变量，经icon-color实例范围应用；默认currentColor继承所在文字/控件状态，不另造色板。减少动效时停止动画并保留颜色；禁用祖先下恢复继承、停止闪烁。没有几何位移、JS动画owner或自动live region；版本、权限、显示条件、字符串截断与动作归宿主。Badge与Typography.Text的显式color只影响前景，不改变字体角色或暗示业务状态。

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

桌面AppShell/MenuLayout侧栏在逻辑inline-end绘制唯一的line-width-surface / separator-line低对比分隔，沿整个侧栏高度保持，不充当resize handle。分隔占用已有末端padding，保留展开/60px紧凑轨道的外宽与内容净宽；RTL自动换到左侧。窄屏导航只保留Dialog抽屉自身外框，不叠侧栏边线；断点、滚动区域、portal身份和焦点合同不变。

应用头部按brand、breadcrumb、status、actions角色组合。收起/展开入口由公共AppShell/MenuLayout持有并管理位置：sidebarTogglePlacement默认top位于全局Header品牌单元行尾，与Logo/品牌名称保持同一行，不占侧栏顶部独立辅助行；显式bottom将同一个控件放在侧栏菜单与可选业务sidebarFooter之后，菜单独立滚动，顶部不留占位。业务sidebarFooter需要同行时用公开SidebarFooterRow，自然宽度并按空间换行，长事实不截断；默认非Row组合保持全宽，紧凑rail按组纵排。bottom展开时沿侧栏内距靠末端，紧凑rail中居中；top紧凑时保持品牌Logo与开关相邻，不把全局Header压成一个60px图标槽。窄屏两种配置均将同一入口置于顶栏品牌行尾以打开已有导航抽屉；不在两处复制按钮或另建抽屉。公共层统一其按钮尺寸、位置、动效、键盘焦点、可访问名称和aria-expanded/controls，跨断点复用同一个控件节点，宿主仅传状态与事件，受控请求不能冒充已确认状态。导航入口和品牌/路径为左侧主组，状态和动作在右侧；采用方提供内容、名称、链接语义及实际动作，不在公共库写入产品权限或版本规则。主组保留layout-header-primary-min的合理宽度，窄屏优先完整保留导航入口，品牌与路径各在所属空间省略长文字；链接可聚焦，完整名称保留可访问语义，宿主可提供title或明确详情入口。状态/动作空间不足时整组换到下一行，动作组内部按需换行，不能盖住品牌、互相重叠或令整页横向溢出。不静默隐藏状态或重要动作，不用缩小字体解决空间问题；没有动作时不预留空白占位。旧任意header内容继续支持，迁移后通用排列由公共组合负责。

展开侧栏用nav-sidebar-width，按视口16%动态计算，在nav-sidebar-min-width与nav-sidebar-max-width之间夹取，默认根16px下192–224px，再以50vw封顶（视口约束优先于最小宽度）；内距nav-sidebar-padding，默认两侧各12px。紧凑栏用nav-collapsed-width，等于一份nav-collapsed-item-size加两侧内距，默认60px，36px图标项对称居中；不得多计一份图标项宽度。带独立展开按钮的链接在紧凑栏中把该按钮放在同一项下一行，不用横向加宽整栏。控件与选中短竖线在保留内距内可见；viewport模式侧栏独立滚动，当前项在状态更新后可见；窄屏同一抽屉继续完整显示标签。

AppShell/MenuLayout 的 sidebarRevealOnHover 默认 true。仅桌面 hover＋fine pointer 的紧凑侧栏，在鼠标进入或键盘焦点进入时临时揭示完整宽度；同一 aside/导航/底部节点叠在正文上方，正文轨道、滚动和草稿不变。该显示态不写 Controller.collapsed、不触发 onCollapsedChange、不持久化；显式收起/展开按钮仍确认原有折叠事实，aria-expanded 表达当前实际可见状态。独立 NavigationMenu 不拥有 Shell 展开宽度或预览行为。

指针离开但焦点仍在侧栏、底部或从这些 slot 派生的公共 React portal 时保持揭示；指针可跨浮层间隙移动，离开且失焦后按 nav-reveal-close-delay（默认150ms）收拢，此为交互宽限而非动画。最上层公共弹层先处理 Escape 并回到触发器；后续 Escape 收起预览并回到唯一导航开关，当前指针/开关焦点不立刻重开。焦点节点或所属 portal 被卸载时释放占用；卸载 Shell 清理监听、计时与观察。无 hover/粗指针和窄屏抽屉保持显式交互。可传 sidebarRevealOnHover={false} 关闭该显示扩展；不复制 DOM、添加宿主 hover 监听或用 title 冒充完整标签。独立全局弹层不由侧栏猜测归属。

长名称默认保持wrap兼容；显式labelOverflow=marquee时，只有公开名称部件在有hover、fine pointer且未减少动态效果时单行省略，主项悬停或聚焦停留后按nav-label-scroll-delay开始，以nav-label-scroll-speed（单位CSS px/秒）单次滚到末端并停驻。离开且失焦即取消和复位，短名称、禁用、紧凑隐藏名称不滚动；触屏/无hover/减少动态效果或不支持动画时保留完整静态换行。富标签使用公开名称部件分隔主名称，描述和Badge保持静止；库不猜消费者strong/br结构。actionAlignment=start将独立分支与行尾动作中心对准首行文字行框，主图标及无href分支箭头同步定位；start或marquee呈现用nav-row-primary-min-width保留可读名称净宽，空间不足时独立动作自然换到下一行，不能把名称压成零宽；默认center兼容既有布局，紧凑栏仍逐控件纵排。两项呈现更新不得重建主控件、切换路由或更改展开状态；宿主只声明公开选项，不穿透DOM写样式。默认展开宽度按本节4.2.16公共上下限合同统一派生，窄屏drawer独立封顶视口，阅读列max宽度仍是上限而非刚性占宽。

导航的当前页选中与键盘焦点相互独立：已有真实菜单焦点优先；没有菜单焦点时，菜单状态更新可把可用当前页设为单一tab停靠点。打开抽屉本身必须保留打开前合法的菜单停靠点，不能由浏览器默认聚焦首项而意外改写它。React shell/dialog由公共owner在模态建立前确定初始焦点并避免中途首项focusin；无可用菜单项时回退关闭按钮。保留的焦点项在长菜单中应可见；取消回可见入口，宿主已移动到新标题或新模态的焦点不得被旧关闭事件夺走。

侧栏底部是独立于顶栏角色的可选公共内容区域，不内置返回、授权、账号、版本等领域含义。短菜单时底部位于侧栏末端；长菜单使用上方唯一菜单滚动区，底部不覆盖末项。无底部时保留既有滚动合同；有底部时document模式仅侧栏有界并保持正文文档滚动，viewport模式仍使用所属窗口的可用高度。底部内容超出可用侧栏一半时允许自身滚动，以保留菜单和所有动作的可达性，不能裁掉放大文字。底部使用body-xs、space-text-gap/space-control-gap、separator-line与既有按钮状态/motion，禁止消费者额外复制定位和尺寸规则。

紧凑侧栏中的底部不增宽公共60px轨道。有图标/短表示的公开内容部件居中显示该表示，完整文字仅视觉隐藏并保留可访问名称；Toolbar 中的版本 Button、passive span 与更新状态均沿同一轨道中心线，按钮保留默认36px最小点击区、图标16px，passive 状态不变成按钮；无紧凑表示时完整文字换行保留，不能静默删除。窄屏同一导航抽屉恢复完整文字。路由、选中和非底部更新不得重建底部或重复绑定回调；响应式与反复抽屉开关复用同一内容节点/状态和已有模态owner。动作的disabled/busy、防重复、权限、导航和状态文案仍由宿主明确提供。

DropdownMenu/ContextMenu及共用菜单项角色显式绑定body-xs字号/行高和font-weight-control，不继承浮层正文body-sm；浮层本身仍保留body-sm。菜单图标通过公开icon部件或xui-menu-icon语义类采用control-icon-size，非收缩并沿用menu-item-gap；只作用于声明的图标及其直接SVG，不把任意嵌套插图强制当图标。label与choice-label显式用body-xs/500，label→control→help→error间距保持8/4/4px；choice-label的文字角色变化不缩小默认控件点击区。错误关联与原输入语义保持。

### Agent-ready 的视觉与交互定位

UI是人类观察系统状态和数据、直接操作并介入Agent操作的入口；Agent通过可独立使用的业务API执行。统一目标是简洁、明了、快速，不以聊天气泡、满屏渐变或AI装饰替代可用性。默认界面先给任务/对象、当前权威状态、关键异常和主要动作；必要风险与阻断信息不得藏在高级详情中。颜色、字号、间距与焦点继续使用本规范既有语义角色，不建立第二套AI主题。

页面先按人的主任务选择编排。对话交流是独立的工作区类型，不能把管理列表的PageHeader、筛选、表格和状态墙直接套成会话首页。消息、所属工具摘要与答案按回合相邻组织，同回合段落间距小于回合间距，避免无意义的大块留白；长文、代码和表格保留适合阅读的列宽上限，输入区与阅读列对齐。历史读取、流式输出和局部刷新不得重建正在输入的区域。执行/连接状态、待审批与追加指导队列按真实作用保留，必要的取消/停止/重试可达；累计技术用量和文件细节按需查看，已选文件区开合尊重宿主任务与用户偏好。文字放大时允许所属公共容器自然滚动，键盘进入宿主自有输入区须让焦点和操作可见，不能用缩字或裁正文维持首屏静态构图。领域消息、队列、草稿、附件、路由及流式状态仍由宿主owner负责。

进行中、等待确认、已完成、失败和结果未知必须用文字区分；建议/生成内容不等于已经执行，未知/未加载/不可读不等于零。来源、作用范围和信息时效在影响判断时可见，不伪造进度或置信度。次要解释、历史和技术数据按需展开；展开不重建有效输入，普通通知不抢焦点。

动作必须对应真实可用能力，主次清晰、原位反馈、防重复且键盘/窄屏可达。暂停、停止本地等待、终止服务端任务与撤销已完成变更不能互相冒充；临界动作明确作用与后果，并给出权威结果及实际安全恢复路径。加载、离线和失败不重排主体；未知写入不通过自动重试装成恢复。认证凭据清除、门禁和权限沿用领域合同。

表单常显label，帮助解释约束而非重复标签；初始未操作字段不预先责备，提交时定位可修字段，整体错误接近主操作并保留可理解的恢复说明。可见状态不只依赖颜色、spinner或瞬时toast；辅助文字不能因层级弱而不可读。根字号与真实浏览器zoom分别验证，四边focus、长文案与中文实际字体必须留证。实现与验证须依据上述真实状态和动作，不将参考研究或合成例子当成公共状态/动作组件及产品业务能力已实现的证据。

### 公共登录页布局与主题

公共登录/初始化页复用一个AuthPage布局owner，采用用户确认的 [Stitch V3](https://stitch.withgoogle.com/projects/13033986353155220257) 品牌与表单编排。整个品牌＋表单组在动态视口居中，自然高度、单列；品牌位于卡片外部上方、居中排列，宿主Logo与产品名保持原始内容，库不生成、着色或更换资产。Logo默认48px、object-fit:contain；产品名使用section-title 16/26px、500与foreground，长名称自然换行。品牌与卡片间隔24px。没有Logo时只保留产品名，不制造空Logo盒或替代标识。显式brandVisual仍在品牌组下方、inert，最大80px且窄屏隐藏，不自动增加装饰内容。

默认layout=card采用layer-surface、surface-line的1px完整边界和login-card-radius（默认16px），无顶部青线、投影、渐变或光晕；主动作是页面唯一的大面积强调色。卡片默认418px：360px内容轨道（含四边focus余量）+两侧28px内距+边框；横向内距由login-card-inline-padding限制在28px派生值与8vw的较小值，文字/界面放大时不让内距挤占字段；纵向仍按缩放派生。窄屏收缩至可用宽度，390px视口默认外侧各16px、卡片358px。内容增加或视口变矮时整个组随文档自然滚动，不限制表单高度。fullscreen保留相同品牌/表单结构、尺度与顺序，只省略卡片表面和边框。禁止左右宣传面板、背景大图、虚构环境/安全状态、页脚及额外入口。

卡片内层级顺序为任务标题→可选任务说明→常显标签/字段→唯一主动作→真实次级认证→局部反馈。标题使用login-title-font-size/line-height，默认26/32px、600，由page-title角色派生并分别尊重font-scale与line-height-scale；不改变普通页面标题。description使用body-sm 14/22px与muted-foreground，标题到说明8px、标题组到首字段20px。宿主标题建议“登录”或“创建管理员”，显式配置原样保留，不猜测删词。字段label、输入和主动作统一body-sm 14/22px、控件字重继承已有角色；label到input8px、字段间16px、末字段到主动作20px，字段和主动作同宽。login-control-height默认46px，由control-height-lg、space-text-gap及两条surface线派生；InputGroup外框也为46px，文字增大时自然增高。帮助、错误仍body-xs 13/20px；不新建认证调色板、字体栈或焦点规则。

完整初始化页复用公共AdminSetupForm。检查到初始化阶段需要连续外壳时，宿主保留同一AuthPage，将检查内容切换为AdminSetupForm；外层省略form，表单自行拥有唯一语义form及字段/动作/反馈。Form沿用既有认证文字、控件、焦点和间距Token，不增加品牌/标题/卡片或另一套认证样式。

反馈仍在主按钮之后。feedback与feedbackActions均为空或隐藏时不占位；React识别空Fragment与条件空值，空反馈槽不生成占位。没有固定或最小反馈轨道高度，form到support不额外叠加间隔。checking、错误、未知后果与实际恢复动作按内容自然增高；字段和主动作的尺寸、相对顺序与DOM保持，整体居中卡片可因此调整位置。不得为零位移设置大块空白、固定反馈高度、裁切或要求用户在单行消息窗口内滚动。长页使用文档自然滚动；验收须区分必要内容增长与控件重建/尺寸跳变。

必要结果摘要必须完整显示，未知结果及实际可用的后续操作不可隐藏在详情中。登录和 Key 管理按各自公开合同通过普通会话或列表单次核验，不增加持久写入门禁或自动重发写请求。宿主有独立冗长说明时，可在现有feedback slot中组合公共Disclosure；默认摘要仍在外部，展开有明确名称、支持Enter/Space、全文随文档滚动，收起与回焦点保留输入。公共布局不能猜截断宿主文案、另造摘要或改变业务语义；仅给了一个长消息时显示全文。不新增详情API或业务动作。反馈动作在同一反馈区域自然换行，不与长消息争夺窄小横向空间。

提交忙态仅在主按钮原位显示一次状态文案并以单一live/status语义发布，配合aria-busy和既有禁重入。与按钮不同的session核对、未知、错误与恢复信息仍在反馈区域；不能为去重隐藏重要事实。React必填字段按已有Field惯例显示aria-hidden星号，真实required与准确可访问名称保持。普通密码登录不显示新密码规则或强度；管理员初始化与自助改密的新密码部分采用NewPasswordFields。自助改密独立form按Field→FormActions→真实反馈编排，当前密码使用同一PasswordInput；无新皮肤、尺寸或秘密草稿。确定拒绝、已更改和结果未知分别呈现，不把取消/超时说成服务器回滚；关闭清密，保留挂载通过公开active状态停止所属等待。没有虚构的注册、找回密码、SSO或验证码入口。安全可重试读取使用公共ghost动作；未知写入不自动refresh/logout/重放。

SSO显式配置时作为主动作后的次级组。极端长主动作保留完整可访问名称，login-action-max-block-size（20dvh且至少login-control-height）限制单按钮高度并可内部滚动，保留safe center与四边focus。状态标签原位切换并滚动归零；普通通知不重挂输入或按钮。登录、初始化和纯AuthPage消费同一结构和token，不允许产品私有CSS补丁。

长品牌、配置表单、SSO及放大文字使用自然文档滚动；短视口不限制表单高度，所有字段与动作始终可达。正文、操作、反馈和SSO内部保留focus-width+focus-offset四边空间与滚动安全距离，反馈内的焦点不会被局部滚动裁切，不修改全局焦点token。定量标准、状态矩阵与真实截图验收见[公共登录验收](VALIDATION.md#认证页验收)；未执行实际像素回归与图像查看不能宣称视觉验收完成。

认证已确认而工作空间交接失败时，保留已登录事实、同一字段/主按钮与清空的密码；持续错误及“重试进入”留在所属反馈槽。主登录按钮保留普通submit文案和disabled，但aria-busy=false，不再显示或播报opening；重试期间才显示opening并防重复。仅重试宿主导航，不重新login/refresh/logout；失败不是新的凭据错误或自动登出理由。

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
| 同范围手动/自动刷新 | 已确认内容（含空结果）继续可见；局部busy/refreshing指示放在固定刷新动作的预留图标位，不在正常流新增临时反馈行或取消按钮而挤动标题、筛选和数据区；响应确认后更新相应记录。不清空rows/value、不隐藏整个区域、不重挂页面或表格来表现刷新，也不对未变化数据反复播放整块进入动效 |
| 刷新失败/显式重试 | 保留同范围旧事实与草稿，局部显示失败和实际可用重试；不能把旧数据标成新成功、把错误变成空集合，或自动重放业务写入 |
| 返回有效空结果 | 仅确认响应为空后更新为空状态；保留适用表头、筛选和恢复动作。空状态用简短事实与下一步，不能靠重复“已读取0条”、成排空表或长实现声明占满页面 |
| 身份/权限/对象/查询范围变化 | 按真实范围与权限清理或明确隔离旧事实，不能把旧范围结果当作新结果；不以保留画面为由展示已失去权限的内容。保留筛选草稿或导航位置须符合该范围合同 |
| 相同范围视图 | 页面壳、未变化记录/字段的身份、滚动、焦点、选择和未提交输入保留；真实记录删除或失效时按公共合同回到仍可用入口，不抢走宿主已转移的焦点 |

刷新过程的busy使用既有动作位，确需出现的临时完成通知使用公共Toast，不在页头、工具栏、表格或卡片上方插入再撤销整块提示。持续错误和恢复入口仍归所属反馈槽，具体归属与几何验收见[反馈位置与保留时间](#反馈位置与保留时间)。

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

方法写当前document根的 `data-interface-scale` 与语义变量 `--interface-scale`，以 `--interface-root-font-size` 中的百分比派生根字号。文字、图标、rem间距、控件与布局约束共同放大；内容根据实际可用宽度换行，表单继续按净宽决定列数。展开侧栏使用公开nav-sidebar-min-width/max-width约束，默认最小为5个nav-item-height加space-content-gap、最大为6个nav-item-height加space-control-gap（100%时192/224px），首选16vw，并以50vw封顶，为中等视口放大后的正文保留至少一半宽度；compact rail和窄屏抽屉保持各自合同。视口百分比/上限不机械倍增，细边框、焦点线、媒体查询阈值和真实像素测量保留各自语义。该方法不采用transform或CSS zoom，不重挂组件、不刷新Document、不发业务请求、不创建订阅。浏览器默认字号与浏览器zoom仍独立生效；宿主不得用固定html字号、组件尺寸补丁或第二套CSS zoom覆盖此owner。

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

1280px宽、16px根字号下，Dialog/Confirm仍为512/384px，侧向Sheet改为768px；1920px时分别768/512/1024px上限。窄屏由各自最终视口约束决定，不能只验证字符串。导航drawer继续独立于详情Sheet：默认贴边全宽/全高，nav-drawer-max-inline-size 可由项目限制；展开侧栏现按4.2.16合同为192–224px，紧凑侧栏保留60px。本段是用户追加的响应式宽度默认变更，不能并入“其余设计token迁移默认不变”的声明。

### 公共布局插槽与默认顶栏工具

AppHeader/AppShell/MenuLayout在右侧默认提供一个主题图标按钮，light→dark→system→light循环；复用文档现有theme owner，不另建存储。语言入口只在locale.enabled显式true时显示，语言value/options/onValueChange与词典均由宿主现有i18n owner提供。顶栏主区域、工具组与独立账号区，以及sidebarHeader/sidebarFooter、pageHeader/pageToolbar/content/pageFooter的顺序和所有权见[公共布局插槽](COMPONENTS.md#布局与顶栏)。这些槽只消费公共var及布局原语，不授予产品动作、不放新业务内容默认值；空槽无视觉占位，更新保留正文与导航实例，导航抽屉仍只拥有一份侧栏。默认登录页继续仅继承外观，不新增这些顶栏工具。

### 有界工作区与平台前置安全区

公共scrollMode保留document默认自然滚动与viewport独立main滚动，新增workspace显式工作区模式：shell默认100dvh，header自然换行，main按自然pageHeader/pageToolbar/pageFooter占用分配剩余确定高度给content；库默认维护min-block-size:0与弹性收缩链，layout-workspace-content-min-block-size是显式可覆盖的内容下限（默认0px、受100dvh约束），业务区域通过公开内容组合选择内部滚动owner。不得要求消费者减固定header高度、修私有selector或绝对定位发送区。大于可用高度且不可拆分的内容保留滚动可达兜底，不把文字或操作裁掉。公开root尺寸可由已知宿主窗口大小覆盖，不更改既有默认尺度。

公共 `contentInset` 使用共享 `ShellContentInset = 'standard' | 'edge'`，默认 standard。edge 仅在 workspace 移除 shell main 的页面内距与 content 的焦点 gutter；header、品牌、sidebar、页内槽自己的布局以及控件/卡片内距保持各自合同。document/viewport 保留原间距并记住选择，切回 workspace 生效。`ScrollArea.Viewport.focusMode='inset'` 是独立显式选项，默认 gutter，不由 edge 递归推断。零 gutter 在 CSS @scope 增强中启用，焦点仅改变已有可见边线颜色；最近 ScrollArea、弹层及其他公共滚动边界拥有自己的策略，嵌套默认 gutter 不受外层 edge/inset 覆盖。不支持 @scope 的旧引擎保留原有安全绘制空间，保留键盘和回焦语义；这里不构成各浏览器或旧 WebView 的实测声明。Surface 可显式 `padding='none'`，仅省略该表面的 card-padding，保留背景、边线和圆角，不新增裁切。

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

原生输入外壳、文件选择按钮、range轨道/拇指、color色块边界和progress轨道/填充由同一语义变量提供；文件按钮复用muted/foreground、button-disabled-*和交互状态，range轨道用space-control-gap、拇指用control-icon-size，range-thumb-offset集中定义其垂直居中关系。color色块保留真实选择值。Checkbox indeterminate必须显示横线，不能以checked或仅颜色代替；choice/fieldset错误边界仍用status-error-foreground。Progress轨道与填充使用radius-sm，维持等高条形而非50%椭圆；不改变圆形Spinner的radius-full。progress有value时按真实value/max绘制，无value保留原生indeterminate语义，用状态脉冲而不虚构百分比；reduced-motion静止。forced-colors下progress保持原生元素、真实value/max与未知语义，采用浏览器提供的Canvas轨道、CanvasText边界与填充；颜色只由progress-forced-track/border/fill集中定义，design-accessibility层保证它们继续取系统色，不接受品牌覆盖。使用既有line-width-surface与radius-full，保留轨道形状并补可识别边界；确定状态按原生比例填充，无value仅显示由progress-forced-pending-border-style声明的空心虚线轨道，不画合成分数或全满填充，且保留已有状态脉冲及reduced-motion静止。forced-color-adjust继续为auto，不关闭用户强制颜色机制；appearance:none仅保留原生progress内部的真实比例布局与可控CSS动效，不能把computed appearance:auto当作浏览器原生绘制已恢复的证据。Checkbox/range等选择标记继续恢复各自的浏览器绘制。文件/日期/颜色系统窗口、密码管理器、自动填充建议及移动键盘属于浏览器/OS，不承诺CSS统一其界面，不移除number/date/search原生编辑能力；file/range/color不支持HTML readonly，不得只加属性就声称只读。

公共 SimpleSelect（包含顶栏语言入口）的浮层选项之间使用 space-text-gap（默认 4px），选项组与组内标题/选项同样保留该间距；选中与悬停背景不得垂直贴合。间距由公共样式负责，不改变选项最小高度、弹层定位或隐藏语义。

HeaderBrand logo盒使用control-height-sm，图片/SVG以contain限于盒内，不被固有尺寸或长名称撑大。桌面compact无leading时logo中心对齐nav-collapsed-width侧栏中心，补偿layout-content-inset只影响品牌，不改变toggle与内容起点；有leading保留平台安全区。

### 通用搜索与操作工具栏

SearchToolbar 是 Toolbar、输入与按钮之上的纯布局/披露组合。search、actions 和 advanced 是公开内容入口，不增加查询、分页、权限或请求 owner。宽屏搜索轨道采用 flex 剩余空间与 min-inline-size:0，主操作在行末；Input 的 100% 默认宽度只相对于搜索轨道，不把操作挤到下一行。操作组按 control-height、button-padding-inline、button-gap、control-icon-size 统一按钮尺寸；长标签可自然增高，不以固定高度裁切。search 与 actions 轨道以及 actions 内的公开 Toolbar 采用控件底边对齐；带标签 Field 的控制项与普通按钮对齐。嵌套 Toolbar 可独立换行，高级筛选按钮保持自身内容高度，不能被整组多行高度 stretch 拉高。简单无帮助字段以控制边框底边对齐；含帮助/错误的复杂字段放在 advanced，不以内部 DOM 测量猜测其控制位置。工具栏按自身容器 40rem 既有断点换行，搜索独占一行，操作仍完整可达，不只依赖窗口宽度。

高级内容显示于下方，defaultExpanded 默认 false，可为 true；expanded/onExpandedChange 受控时只请求下一状态，宿主回传后才改变展示。只有非空 advanced 槽才显示一个具有可访问名称、aria-expanded/controls 的原生按钮，Enter/Space 采用按钮默认激活。折叠保留内容节点和值，并以 hidden/inert 同时退出绘制、键盘及辅助技术；程序收起时仅在焦点仍属于该区域时返回触发器，不抢走宿主已移走的焦点。更新不重挂搜索/动作/高级节点，也不重复绑定事件。四边保留 focus-width + focus-offset 既有滚动清距，没有 overflow 裁切或另一套焦点皮肤。具体接口和生命周期见 [弹层与工具栏](COMPONENTS.md#searchtoolbar)。


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

普通Menu/ContextMenu动作Item可选tone=danger。默认危险文字与图标使用status-error-foreground，hover及键盘高亮使用status-error-soft/foreground，pressed使用action-danger/action-danger-foreground；disabled继续沿菜单公共变量，焦点不新增外框。无新颜色或产品皮肤，确认及权限归宿主。见[菜单危险操作语义](COMPONENTS.md#菜单危险操作语义)。

### DataTable 行交互扩展

公开rowEvents在现有语义tr上分发当前记录与稳定键，不新增伪按钮/自动tabIndex、选择引擎、查询或提交owner。独立cell交互和已取消事件由共享边界隔离，busy/disabled抑制行快捷动作，保留既有单元与读取能力；鼠标快捷方式配正常Button/link键盘等价入口。状态/布局/分页及皮肤不变，完整合同见[数据表格](COMPONENTS.md#数据表格)。

### 接入反馈的状态与输入扩展

完整登录页和新密码组合的显隐密码名称可通过同一公开配置翻译，装饰 logo 显式输出空 alt。初始化页可选手动只读权威核对，checking/失败/完成沿用公共反馈；未确认结果继续锁定写入，不自动重放初始化、登录或新增恢复协议。Key 吊销后的能力以普通权威列表为准，读失败不推断授权。

Textarea 自动增高由公共控件显式启用并声明 maxRows，使用已有文字/尺寸语义，不新增皮肤或默认高度；保留草稿、IME、焦点、required/readOnly/disabled 与所属弹层滚动，超过上限内部滚动，内容减少缩回。stacked InputGroup 的公共 flex 与共享测量协作，仅在启用自动增高期间按测量高度排列，避免尺寸被纵向 flex 压缩；关闭后恢复原 flex、手动 resize 与 rows。具体React合同见[组件手册](COMPONENTS.md#textarea-可选自动增高)。

### 通用长标题展示

OverflowText仅承载名称字符串，不拥有h3、图标、归属Badge、摘要、footer或动作。公共文本部件占其分配的剩余净宽；仅此文本在鼠标悬停或现有交互表面内的键盘焦点停留后单次滚动至末端，离开且失焦复位。text-overflow-scroll-delay/speed定义共享节奏（400ms、40 CSS px/秒），原nav-label-scroll-*保留同值别名与原覆盖合同。没有溢出不播放动画；无现有键盘入口、触屏/粗指针、减少动效、缺少动画支持或JS未运行时显示完整静态换行，无空格英文也可折行。全文始终保留可访问名称，不新增Tab停靠、伪按钮、业务状态或查询owner；公共标题接口见[长标题](COMPONENTS.md#通用长标题)。

### 卡片集合布局与状态

CardGroup 是与 DataTable 同层的受控集合组合。rows 是宿主当前确认的记录，rowKey 是稳定身份，renderCard(row, context) 返回 Card 的 title/icon/badge/actions/description/children/footerMeta/footerActions 等公开配置；由集合创建 Card 实例，不接收替换整个卡片的 JSX。业务输入、权限、草稿和动作由宿主负责；模板内的组件类型保持稳定。

集合独占toolbar、body和footer：toolbar与计数/状态/分页均在body外，宿主选择pageToolbar或集合toolbar一处接线。body使用有序DOM阅读顺序的语义列表；按容器净宽自动分列，以card-group-item-min（默认依赖layout-field-long-min，根16px时288px）为期望下限，不足时一列。cardSizing默认natural兼容内容自然高、顶端对齐；资源网格显式equal，通过CSS自动行和Card.stretch由当前完整内容计算共同卡高，content可伸展、存在的footer底部对齐。缺失content/footer仍不生成空slot，长文字或200%放大可增加卡高，不裁内容或固定像素正文高，不等分三段，也不为集合添加第二层卡片皮肤。分组gap、焦点gutter与已有语义Token共用。layout的natural随内容并受有界父容器约束；workspace占满父容器，正常高度只有body滚动；极短父容器保留card-group-body-min的正文轨道（默认依赖feedback-slot-block-size），整个集合可滚动，不能把正文压到仅剩焦点padding；document随文档自然增长。cardSizing只管理卡片几何，不接管查询、分页、草稿或状态；所有资源类型共用这套公共合同。

状态、offset/cursor 分页、真实/未知 total 与同回合请求防重入和 DataTable 使用同一纯 TypeScript 模型及 React footer。首次无记录加载仅在 body 内提示；同范围刷新与刷新失败保留 rows、key、Card/输入节点及焦点，footer 显示局部刷新或错误/显式重试。busy/disabled 阻止集合分页和重试意图，context 提供 busy/disabled 事实，业务控件按动作语义采用；不递归改写 slots 中的业务控件，不把被动卡片变成按钮。集合不请求、不缓存、不排序、不确认写操作，也不复制 query/resource owner。接口及示例见 [CardGroup](COMPONENTS.md#cardgroup)。

### 通知队列与视图合同

Toast 默认固定在右上角（逻辑 block-start / inline-end，RTL随语言镜像），沿用layer-overlay、surface-line、shadow-overlay与label/meta/Button文字角色。4.2.19的标准View采用“Icon—Content—Close”三列，Close锁定首行末端，不再占据独立底行；Icon仅为装饰，16px并按toast-icon-offset对齐首行，Close为32px触点/16px图形的公共透明圆形按钮。Title继承label的500字重并使用body-sm（14/22px），由Toast公共文字角色统一定义，Description继承help（body-xs/400）；两者间space-text-gap=4px，外内距space-content-gap=12px、列距space-control-gap=8px，文字自然换行且不截断。空Title/Description不占位，Content只在实际Action存在时增加末行Actions（合计8px上间距、靠末端、自然换行）；关闭是独立控制，不作为操作区存在的理由。旧部件组合的Actions若仅有Close，公共CSS也使它与正文首行同排；有真实动作的旧组合保留原DOM/交互，推荐采用标准View或把Close置于Root直下。显式render、事件、禁用与标签仍由原公开parts接收，不复制宿主DOM。

Toast独立宽度使用toast-width=24rem（根16px时384px，扣除viewport焦点gutter后单项约368px），不再借用popover-width；窄屏以可用视口封顶，无固定最小宽度。Viewport容器净宽不超过18rem时，保留首行Icon/Title/Close，Description与真实Actions跨全行；不超过12rem时，Title或无标题的Description也移到Icon/Close之后的完整下一行，避免单字窄缝。18rem/12rem是本合同声明的容器结构断点（CSS查询不能引用var），按根字号响应阅读放大；Content仅投影display:contents，不改DOM/Tab顺序，不隐藏图标或缩字。旧Actions内含Close的组合保持既有布局，不强制改为新三列。队列最新项在上，默认至多三项；实际阅读宽度不超过48rem或font-scale大于1时仅最新一项。悬停或聚焦展开队列；toast-viewport-max-block-size=40dvh只限制整个Viewport并内部滚动，单项随内容自然增长，不固定height或裁切文案。图标只有显式type=success/error/warning/info使用对应status-*-foreground与不同形状，缺省/未知类型用中性信息图标；不从中文文案猜类型，不编造“连接异常”等标题，不改变priority播报或合并同文通知。细中性边界和不透明浮层表面保持，不将整卡染成状态色。

Icon、Title、Description、Actions、Action、Close均为公开parts；Close缺省为装饰×图形并保留可翻译aria-label，显式文字/render可继续使用。无负margin、绝对定位、固定正文高度或宿主私有CSS。长中文、无标题、URL/技术长串、RTL、浅深system、根字号/界面/真实浏览器200%均检查首行关闭可达、正文完整、空操作区零占位及独立焦点。默认5秒与暂停、回焦、clear/scopeKey和同一Controller合同不因排版改变。

runtime ToastController 是集合、进入/关闭阶段、可见上限、超时与暂停原因的唯一 owner。React 只投影 DOM、测量手势、转发动画完成和实际焦点。无 View、隐藏文档、窗口失焦、悬停、焦点及正在手势期间暂停计时，恢复剩余时间；被可见上限隐藏的项暂停。仅更新文案保留剩余时间；显式 timeout 更新或同 id add 重新计算该项时限，-1 表示不自动关闭，省略或0采用配置默认（5秒）；旧动画和旧 Promise 不得修改新实例或复活关闭项。默认右滑关闭，纵向保留浏览器滚动；显式上下滑会接管对应触控手势。手势 CSS 位移是实时指针测量，不是设计尺寸默认值。

新增通知不抢焦点；F6 聚焦通知区域，Tab 进入动作，再次 F6 返回原位置，Escape/关闭把焦点移至其余可见通知或原位置。普通通知 polite，高优先级 assertive；关闭或不可见项退出交互。重要错误持续显示在所属内容区域，不能只放自动消失 Toast。借用 Controller 退出 View 时释放 DOM/暂停租约，不销毁宿主队列；默认实例真实退出时销毁。完整双模式、迁移差异和可执行验证分别见 COMPONENTS、PUBLIC_API 与 VALIDATION。

4.2.12的可选DataTable列宽交互复用原表头、表体、footer与独立状态owner。headerLabel/排序动作保留表头文字角色；逻辑末端separator为独立24px命中区，细线使用separator-line，hover/focus/拖动使用action-primary与interaction-hover；禁用保留静态线和aria-disabled。DataTable数据/分页不归列宽Controller。默认上下限由data-table-column-resize-min/max集中派生，用户确认宽度属于真实CSS像素测量例外，不构成消费项目自行缩字号。详细状态、slot与清理合同见COMPONENTS交互列宽章节。

### 窄屏导航空间与区域预算（4.2.14）

导航抽屉沿用 AppShell/MenuLayout 的同一份侧栏与模态焦点，既有 48rem 窄屏断点不变。抽屉默认贴边全宽全高，标题、Body、关闭动作沿纵向排列；Body 不再叠加 Dialog 内距，Sidebar 仅一层 nav-drawer-padding=min(nav-sidebar-padding,max(space-text-gap,2vw))，文字、图标和点击区域继续按公开阅读尺度放大。桌面侧栏宽度与紧凑 rail 不变。

sidebarHeader 放操作/搜索，sidebarTabs 是独立、不被 Header 裁切的水平 List 轨道，sidebar 是主要菜单，sidebarFooter 是账号/环境。正常 split 模式以 Body 可用高度为预算：Header 最多 nav-drawer-header-ratio=.3，Footer 最多 nav-drawer-footer-ratio=.2，菜单目标至少 nav-drawer-menu-ratio=.5。标题、关闭动作和 Tabs 的实际占用也计入预算，不能把这些比例误认为整个视口的同时保证。任一区域自然高度超预算，或头/尾/Tabs 总占用超过剩余菜单预算时，公共 ResizeObserver 只切换布局投影为 whole：Header→Tabs→Menu→Footer 在 Body 同一自然流纵滚，不各自裁切成多个小窗口。无固定总行数假设，不缩字、不隐藏入口；焦点、草稿、展开状态与节点保持。

窄屏导航层级只累计一层 nav-drawer-indent=min(space-control-gap,3vw)，更深层保留语义层级，不继续蚕食宽度。主项以 nav-row-primary-min-width 优先分配，独立分支/行尾动作作为一组，空间不足时整组换行；名称部件消费剩余宽度。390px 与公共 scale=2 时以“团队经理”四字完整横排验收，并测有图标、状态、独立动作及长账号。触屏/减少动效继续完整静态换行；不把 marquee 当作修复净宽的手段。富标签中宿主自有组合仍须允许自身内容换行，公共库不推断任意后代结构。

### 正文链接、通知范围与可选绘图资源（4.2.15）

LinkedText 使用正文/元信息所属文字角色与既有 Link 颜色，不增加字号、卡片或装饰说明。安全正文 URL 的展示文本与原文字序完整保留；已有 React 内容不得由组件擅自拆解。Toast.View 复用通知部件、同一个 Controller 和既有 Title/Description/Actions/Close 槽；中文默认名称可翻译，关闭操作具名可达。身份切换的旧文案立即清空，不保留动画残影或旧回调；业务生产者仍由宿主按作用域取消。

可选模块的 loading/error/refreshing 继续由单个 Resource 发布，首次反馈相对所属内容区居中，同范围刷新保留正文与焦点，不把请求当作整页重挂。CSS 引用租约和模块的业务挂载生命周期分别明确，释放样式不能冒称卸载已执行 ESM。绘图颜色使用目标上下文的当前语义 token 与同一 ThemeService，保留 alpha，明确 sRGB 通道、null 和订阅清理；不以另一份 palette 或渲染状态替换公共主题。具体公开格式、限制和迁移见 [PUBLIC_API](PUBLIC_API.md#安全正文链接)。本次不增加视觉皮肤或默认 token，不要求消费项目必须升级。

### 透明文字动作（4.2.17）

Button.variant=text 为可选呈现；Disclosure自4.2.18默认text，显式variant=default保留历史外观。默认/hover/pressed/展开及disabled均无底色或下划线；文字与箭头继承 foreground，hover/pressed/aria-expanded=true 时采用 action-primary，disabled采用原禁用前景并阻断动作。透明文字Button不做按压缩放，保留原size的padding、最小点击区和字体；Disclosure保留原全宽trigger、自然标题/indicator/body与分隔线，不创建第二个Overlay或关闭owner。focus-visible不新增外框，无可见边线时保持原外观。默认ghost/link与显式Disclosure variant=default保留既有背景合同，不全局删除交互反馈。

### 导航文字呈现与warning前景（4.2.17）

NavItem.variant=text、NavigationMenu/MenuLayout.variant=text 及逐 NavigationItem.variant=text 可选地保持主控件 default/hover/pressed/selected/disabled 背景透明；缺省default外观保留。普通text项的hover/pressed/已选文字与主图标用action-primary，选中仍仅由aria-current事实决定。NavigationItem的variant可覆盖菜单默认，不是父子继承状态。

NavItem与NavigationItem的tone=warning只投影宿主事实；标题、主图标、公开Label/文字/Icon和尾随告警图标继承status-warning-foreground，选中指示也用该可读前景；warning各状态背景透明，不再采用此前建议的warning软底。tone优先于普通selected/hover文字品牌色；禁用前景、独立focus配方、aria-current与路由不变。组织组头忽略tone，子项不继承；独立配置动作继续自己的普通按钮外观，分支展开按钮跟随当前主项的透明呈现/前景。Name位于NavigationMenu.Label，旁侧被动Icon不收缩；名称按原wrap/marquee与触屏/reduced-motion退路处理，不复制DOM或增加渐变mask。

### 纯图标按钮的统一轮廓（4.2.18）

IconButton 与 Button data-icon="true" 使用同一纯图标配方：等宽高不变、radius-full，默认/hover/pressed/disabled/busy/expanded 都保持圆形容器。ghost/link/text 默认透明时同样保留圆形几何，背景出现不切换轮廓；图标自身形状不变，例如停止仍用方形图标。文字Button继续原button-radius，不变成圆形或胶囊。保留原size、点击区、前景/背景/危险/禁用/忙态、独立focus、render/ref/键盘和业务owner。不要用data-icon标记带可见文字的按钮，也不要通过产品私有CSS重新实现圆角。头像、缩略图和其他组件不适用这条按钮规则。

4.2.32将纯图标的视觉圆面与命中布局分开，4.2.37再将默认圆面统一到icon-container-size：命中尺寸仍为default36/sm32/xs24/lg40px，图标仍16px（xs12px），button-icon-inset由默认命中区与基础直径的差派生2px，button-icon-padding扣除原1px边界后为1px。圆面净径分别32/28/20/36px，显式size保留尺寸级别；outline/busy边界同样内移。背景按content-box绘制，不能裁内容或焦点。焦点不新增外圈；outline变体仅将已有内收边线改为interaction-focus，其余无可见边线的变体保留原边界外观。文字Button及Card头部图标tile不适用内收几何。全主题/variant一致，text仍透明且危险前景不变；disabled不执行，busy本身不禁用。公开Token只控制视觉留白，不缩小真实target，不使用消费方wrapper、私有CSS或放大SVG。

文字根字号/公开setInterfaceScale整体阅读缩放会同比例放大rem几何；focus-width及线宽继续既有px合同，不为凑倍数改线。根字号200%时default命中72、图标32、圆面64px；真实浏览器200%保持CSS尺寸并整体物理放大。宿主自定义button-height或button-icon-inset时需验证图标不被挤压、焦点和真实外沿点击；不以视觉圆面取代点击区。改造后在工具栏、表格、弹层及Card actions/footerActions所有实际实例验收，不只验单一卡片。参见[纯图标逐项检查](ADOPTION_CHECKLIST.md#纯图标动作紧凑呈现逐项检查)。

4.2.33补齐组合容器边界：SearchToolbar.actions/advanced及复用同一框架的QueryForm继续原有统一control-height/SVG归一化，但必须使用button-icon-padding，不能归零。SidebarFooter中的文字按钮可以居中、隐藏标签、使用导航最小宽度，纯图标不继承文字按钮的左对齐、横向零padding或单边min-width；其size/等宽高/图标中心与圆面继续由Button拥有，展开/收拢/窄屏抽屉一致。收拢Footer含纯图标时，在既有rail内居中保留至少nav-collapsed-item-size/control-height-lg中的较大净宽，避免40px目标被36px轨道单向压扁；行内纯图标也不强占100% flex-basis。rail宽度与普通文字Footer不变。验收同时量横纵圆面、glyph中心、透明target外沿、内边界及focus，不能只测独立按钮或Card，也不能仅凭focus外径正确判整圈正确。实际layout slot清单见[ICON-ACTION-005](ADOPTION_CHECKLIST.md#纯图标动作紧凑呈现逐项检查)。同理，workspace edge/ScrollArea inset的@scope和顶栏/侧栏通用内描规则须排除纯图标Button，不依靠scope proximity覆盖其圆形配方；排除不增加选择器优先级，普通invalid输入及InputGroup继续原额外偏移。Dialog/gutter边界和ScrollArea自身的focus offset保留，嵌套滚动区各自拥有策略；宿主业务头部挤压内容的布局问题不伪装成公共按钮尺寸缺陷。

行内、输入区和工具栏内不需要常驻表面边界的菜单入口，标准组合为 Menu.Trigger render={Button variant="text"}：图标、当前名称、箭头在同一文字按钮内容槽，默认/hover/pressed/展开保持透明，hover/pressed/展开用action-primary前景并由图标继承。使用既有text变体与Menu owner，不复制颜色配方或另设菜单封装。宿主显式primary/destructive等呈现优先；普通表单Select/Input继续其输入边界，不因这条行内菜单规则移除背景或边框。关闭、键盘与回焦仍由现有Menu负责。

### 展开与收起入口的统一呈现（4.2.18）

规则按动作语义归属，不为模型选择、展开搜索或其他业务各写皮肤。普通展开入口的default/hover/pressed/expanded背景透明，foreground为基础前景，hover/pressed/expanded采用action-primary，装饰图标继承；disabled保留禁用前景与执行阻断，focus独立可见，文字不加下划线。不推测通用Button是不是展开动作，也不将普通表单Select/Input、导航主链接选择、成功/警告/危险事实改成透明文字动作。

| 入口 | 公共默认或标准组合 | 状态归属 |
| --- | --- | --- |
| 行内下拉 | Menu.Trigger未传render时默认Button.text；传render时保留宿主显式外观，推荐Button.text | 原Menu Controller、键盘及关闭回焦 |
| 折叠标题 | Disclosure默认text；variant=default可显式保留历史配方 | 原Overlay Controller、同一trigger/body与草稿 |
| 多节折叠 | Accordion.Trigger默认采用text；显式render保留声明的Button外观 | 原Accordion值Controller及焦点 |
| 搜索高级条件 | SearchToolbar内置展开按钮采用text | 原expanded/Controller，不增加查询owner |
| 侧栏收拢/分支 | 内置独立展开按钮采用text；无href分支默认text，显式导航variant优先 | 原导航Controller；主链接选择不改 |
| 表格行展开 | TableExpandButton沿用原尺寸/字体，透明与主题前景；排序按钮按原合同 | 原expanded/controls与表格owner |
| 宿主自有展开区域 | Button.text或IconButton.text，提供准确aria-expanded/controls；无文字时必须具名 | 宿主已有状态；不另设竞争Disclosure |

以上是4.2.18有意的公共默认外观变化，几何、命中区、前景/背景语义Token和行为owner保持。没有替换显式主/危险按钮的含义。库级发布不要求任何消费项目必须升级；项目采用后应移除同义私有样式，再独立验收真实页面。

### 表格与重复行操作的透明语义（4.2.18）

所有同组表格操作入口统一以Button/IconButton variant=text表达，不混用带底色ghost/outline/primary/destructive。普通动作default用foreground，hover/pressed/expanded用action-primary；删除等危险动作显式tone=danger，所有可用状态用status-error-foreground，绝不退回品牌色或实心红底。disabled使用原禁用前景；default/hover/pressed/expanded/disabled/busy背景始终透明，焦点不新增边界。tone只影响text，不重写显式非text变体；警告/成功等业务事实仍使用原状态槽，未增加虚假tone。宿主逐表按真实动作给props，权限、确认、busy防重、行事件与提交owner不变，不新增TableAction业务包装或私有CSS。

### 公共图表布局与状态合同（4.2.21）

LineChart、BarChart、PieChart 是 React 数据展示组合，复用 Card 的 title/description/actions/content/footerMeta/footerActions 和 DataRegion/LoadingState/EmptyState/ErrorState。标题、操作与页尾沿用现有文字/布局角色，不加第二个边框、装饰标题条或虚拟指标；默认“查看数据”动作位于 Card.actions，宿主 actions 在它之前。内容依次为图例、绘图区、共用既有反馈槽的就近读值区与反馈，数据表在内容后按需展开。查询、缓存、筛选、单位、业务时区、聚合、总数及范围切换归宿主，图表没有请求/选择/提交 owner。

既有 chart-color-1～6 是分类色，负柱不自动变红；标题/轴/图例/网格/焦点分别继承 Card、chart-axis-foreground、foreground、chart-grid-color 与 interaction-focus。普通文字不着系列色；色点/线条仅作非文字标记。折线以圆/方/菱形和实/虚/点线辅助区分，分组柱按图例序号排列，饼图从上端顺时针按图例顺序呈现，并提供标签/原值/占比及完整数据表。主色和状态色不会代替分类事实。宿主重排系列/扇区且需保色时显式提供 color=1～6；省略时按当前输入顺序循环映射，超过六项不承诺颜色/线型唯一，不自动合并类别。

集中几何 Token 规定默认绘图区14rem、最小可读净宽18rem、每类别轨至少5rem；坐标轴 caption、图例/读值 body-xs，数值用 mono/tabular-nums。SVG 无缩放 viewBox，按 ResizeObserver 测得的 CSS 像素绘制；轴标签用同一角色的 HTML，点形半径从实际轴字号派生。数据轨数、等距刻度和分组柱宽是数据几何，不是另一套字号/尺寸。窄屏与200%文字/界面比例下保留字体和可读轨宽，只在所属绘图区横滚；图例/页头/操作/读值自然换行，饼图与图例按净宽换行。不加渐变遮罩、缩字、整页横滚或被截断的浮层。

折线每类别对应有限数值或显式null，null断开且不插值/补0；柱图始终包含0基线，正负值按实际方向绘制，0柱高度为0。饼仅接受有限非负数，零项不画扇区，全零显示居中空态而非等分；单项全占比为完整圆。原值和数据表不经过日期/时区转换，默认原数值字符串；格式化只影响显示。无数据的idle/loading/ready/error分别显示引导/居中加载/居中空态/可重试错误；保有同范围数据时loading/refreshing/error继续保图，反馈在固定既有反馈槽，不遮罩/透明化/重挂SVG。新范围由宿主清除旧数据并执行取消/迟到隔离。

绘图区是一个独立键盘停靠点：左右查看类别，笛卡尔图上下切系列，Home/End查看首末，Escape清除读值；饼方向键按输入次序巡检（含零值），不触发业务动作。鼠标/触屏在图中读值，同一就近文本区播报；查看数据入口保留所有类别/系列/原值与缺失标识，使用公开DataTable。数据/名称更新用稳定ID重新定位读值，删除后不继续播报旧记录。刷新不抢焦点，ResizeObserver随SVG节点卸载释放；不是全局Controller或独立原生UI。

### 内部数据列表统一 DataTable（4.2.36）

BusinessLogExplorer、StructuredLogExplorer、ApiKeyManager 与图表数据视图统一复用公共 DataTable；前两者移除独立 Table 拼装。Table 与 DataTable 自身的底层语义 table 实现保留，CardGroup 等非表格呈现保持其职责。组合组件默认开启数据列调宽，内置 detail/actions 列固定且不提供调整手柄；没有重置列宽按钮。自定义操作列显式 resize=false，不按单元格内容猜测操作语义。

DataTable 是表格渲染、列宽、行交互表面与滚动边界的唯一 owner；日志与 Key 的原 Controller 继续管理查询、草稿、权限、游标、快照、详情及关闭回焦。已有公开 columnSizing 支持本地、受控和完整 Controller 注入，组合不再建立另一份列宽状态。受调宽的记录列应自然换行，不能绘制覆盖相邻列；操作按钮仍受表体可视净宽约束。日志的领域游标工具条通过 DataTable.footer 组合，不伪造 DataTable cursor token。改列宽不得请求、刷新、清理草稿或重新挂载查询 owner。


### 图标背景的统一形状（4.2.37）

图形 glyph 与其背景容器分开：SVG 路径、字体符号、图表数据标记、品牌图片保持自身语义；已有无背景图标默认不增加底色。所有公共图标背景统一采用基础形状规则，默认 radius-full 圆形，只有显式 `shape="square"` / `iconShape="square"` 或 `data-icon-shape="square"` 才用 radius-md 方形圆角。普通文字按钮、完整导航行、Badge/状态文字和 Card 本身不属于图标背景。

Icon 保留 plain 默认；显式 variant=tile 使用 icon-container-size（默认 control-height-sm，即根16px时32px）与 icon-container-background（默认 muted），glyph 仍为 control-icon-size。Card tile、默认IconButton的实际圆面、InputGroup图标动作背景、紧凑图标导航背景与默认Avatar统一使用该直径；根字号200%时统一64px。显式size或卡片专用size覆盖是有意的尺寸例外。Button保留36px默认命中区；输入辅助动作至少为基础直径宽，避免字符宽度造成不同大小的圆。原card-icon-size/background为兼容别名；Card原glyph、颜色、标题与正文结构保持。CardGroup与其他组合直接继承Card，不按资源类型追加皮肤。

同一基础 CSS owner 覆盖 Icon、公开 xui-icon-container、data-icon=true 的动作（含 IconButton、弹层/通知关闭、主题/导航开关、InputGroup 的显隐/清除/步进）、紧凑态图标导航与 Avatar；Menu.Icon、Toast.Icon、EmptyState 和 SidebarFooter 的装饰槽复用同一容器标记。无底色的 Tabs/菜单/通知图形、品牌 logo 和图表序列编码不因这一规则添加背景或重绘路径。InputGroup在原按钮内使用居中的基础尺寸绘制层，横纵直径相等，矩形命中区不随hover/pressed改变；icon-paint-z-index默认-1，仅位于自身隔离层glyph后方。nav-icon-background-inset从导航命中区与基础直径派生，手机完整文字行恢复原背景范围。颜色、glyph、focus、disabled/busy与业务回调仍由原组件负责，背景模型不建立新交互或请求owner。

### 模型配置编辑器

模型配置沿用公共FormGrid/Fieldset/Field、PasswordInput、Combobox、Disclosure、FormActions和Sheet，不增加第二套皮肤。名称与协议优先，连接其次，运行参数及能力紧凑分组，高级Headers/JSON按需展开。真实模型名与目录动作属于同一字段区域，窄屏动作自然换行。向量协议显示专用测试输入及可选维度，隐藏聊天策略；不把协议固定能力伪装为探测结果。默认参数由agentCore经项目后端返回，xui只投影与跟踪显式修改。不提供说明字段，临时成功用Toast，保存未知结果保留简短阻断提示。详细API/slot及mock限制见[组件合同](COMPONENTS.md#公共模型配置)。
