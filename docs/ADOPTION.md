# xui 通用组件接入手册

xui 提供可复用组件、主题、公共交互和已有的通用页面组合。接入时按实际需求选择公开能力，宿主项目负责业务页面、领域图形、产品布局与业务流程，以及领域数据、鉴权、路由和接口适配。项目局部差异先在宿主自有组件中组合；只有可复用的通用能力缺口才反馈 xui，不把业务特例扩成公共 API。

本手册引用公共规范、正式类型与示例，不另定义组件或品牌合同。采用前核对实际消费版本、Git SHA、本地依赖或 tarball，以及 [全部公开入口与默认行为](PUBLIC_API.md)。Codex 流程的唯一源随 checkout 维护，见 [adopt-xui](../.agents/skills/adopt-xui/SKILL.md)；全局发现入口可以链接同一源，物理路径解析遵循该 skill。

## 阅读顺序与职责

1. 读取采用项目的规则，检查工作区、分支、上游、固定版本与包 manifests/exports，保护已有改动后按项目 Git 规范同步。
2. 读取采用项目自己的 `docs/DESIGN.md`，确定产品设计要求；xui 的 [DESIGN.md](DESIGN.md) 是公共默认值与变量合同，两者职责不同。
3. 按 [原子→组合→页面](FOUNDATION.md#组件层次与扩展原则) 选择复用层次，核对 [IMPLEMENTATION.md](IMPLEMENTATION.md) 的正式入口、组件 props/部件、主题 owner 和原生 lifecycle。
4. 按需要读取 [导航](NAVIGATION.md)、[布局插槽](LAYOUT_SLOTS.md)、[表格](DATA_TABLE.md)、[HTTP/query](HTTP.md)、[登录/认证](AUTH.md)、[API Key](API_KEY.md)、[业务日志](BUSINESS_LOGS.md)；确有程序错误观察需求再读 [独立错误查询](LOGS.md)。公共页面所需 DTO、默认 HTTP adapters 与后端前置见 [PAGE_APIS.md](PAGE_APIS.md)。
5. 能力与验证边界见 [FOUNDATION.md](FOUNDATION.md)、[FOUNDATION_VALIDATION.md](FOUNDATION_VALIDATION.md)；规范来源迁移见 [MIGRATION.md](MIGRATION.md)。

theme 提供无框架预构建 CSS/tokens；runtime 提供主题、DOM、resource、导航、HTTP/query、认证与共享页面控制器；ui-react 复用共享类型和 React/Base UI peers。宿主保管业务状态、权限、租户范围、导航条件、输入草稿与业务动作。公共组合通过数据、配置和已有 props/parts/slots/render/adapters 接入，不复制内部 DOM 或私有皮肤。

HTTP、认证、API Key 与日志能力可按需采用。选用固定 client/adapter 或完整页面时，真实服务必须满足对应合同；修改 baseURL 不能替代 DTO、认证或分页语义适配。宿主决定领域接口及其适配边界，采用通用组件不自动要求重写所有业务 API、后端或产品流程。OAuth2/OIDC/SAML 和第三方接口继续遵循各自标准与合同，转换在宿主明确边界完成。

## 固定产物与可运行示例

在 xui 仓库根执行，工具版本以 packageManager/lock 为准：

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test:consumer
pnpm preview
```

`test:consumer` 将包打成 tarball，在新目录安装并从正式 ESM/CSS/types 编译、打包。采用项目也应固定已核对的版本或提交，使用正式构建产物；当前 manifests 为 private 包，不猜 registry 版本。React/ReactDOM/Base UI peers 保持单实例，原生只使用 theme/runtime。无需 `packages/src` alias 或下游 Tailwind 扫描依赖源码。

| 用途 | React | 原生 |
| --- | --- | --- |
| 最小菜单 | [menu-react](../examples/menu-react/app.tsx) | [menu-vanilla](../examples/menu-vanilla/app.js) |
| 富条目导航 | [rich-navigation-react](../examples/rich-navigation-react/app.tsx) | [rich-navigation-vanilla](../examples/rich-navigation-vanilla/app.js) |
| HTTP 查询 | [http-react](../examples/http-react/app.tsx) | [http-vanilla](../examples/http-vanilla/app.js) |
| 列表/表单/详情 | [foundation-react](../examples/foundation-react/app.tsx) | [foundation-vanilla](../examples/foundation-vanilla/app.js) |
| 工作区 | [workspace-react](../examples/workspace-react/app.tsx) | [workspace-vanilla](../examples/workspace-vanilla/app.js) |
| 完整表格 | [data-table-react](../examples/data-table-react/app.tsx) | [data-table-vanilla](../examples/data-table-vanilla/app.js) |
| 登录 | [login-react](../examples/login-react/app.tsx) | [login-vanilla](../examples/login-vanilla/app.js) |
| API Key | [api-key-react](../examples/api-key-react/app.tsx) | [api-key-vanilla](../examples/api-key-vanilla/app.js) |
| 业务日志 | [business-log-react](../examples/business-log-react/app.tsx) | [business-log-vanilla](../examples/business-log-vanilla/app.js) |
| 程序错误观察 | [log-react](../examples/log-react/app.tsx) | [log-vanilla](../examples/log-vanilla/app.js) |
| 公共组合与默认页面 HTTP | [capabilities-react](../examples/capabilities-react/app.tsx) | [capabilities-vanilla](../examples/capabilities-vanilla/app.js) |

示例按各自目录名访问。合成数据、fetch 和认证模型只演示公开合同，不证明采用项目的真实后端、业务权限或页面已集成；具体已跑与未跑项以对应验证记录为准。

## 主题、CSS 与单 owner

最短主题请求：**根据 `docs/DESIGN.md` 生成 xui 可识别的 `theme.css`。** 这里的设计文件默认指采用项目自己的文件。完整步骤见 [项目主题流程](../.agents/skills/adopt-xui/references/theming.md)；该请求只覆盖主题及必要样式入口，不自动扩大到业务、页面布局、组件替换、HTTP、认证、后端或完整迁移。

1. 核对项目实际消费的 xui 版本及其公开 tokens。将项目设计中的颜色、字体、尺寸、边线、层级、阴影与动效要求映射到真实变量；无产品差异的部分继承 xui 默认值，不复制整份默认色板或编造 token。当前 checkout 的新变量不能直接当成旧安装版本的能力。
2. 在项目现有样式目录生成或整理一份 `theme.css`，在简短注释或已有采用记录中保存设计来源、xui 版本及关键映射。覆盖放在 `@layer product-overrides`，作用于与默认变量相同的文档根；按实际 `data-theme` 合同覆盖 light/dark/system 对应分支，避免 system 回到另一套品牌。主色 `--action-primary` 与 `--action-primary-foreground` 成对考虑，并检查 hover、pressed、selected、错误与焦点状态。
3. 尺寸使用 `rem` 或依赖公开尺度的 `calc`，保留中文、系统及通用字体回退，不缩小根字号补布局。保留必要对比、键盘焦点、forced-colors 和 reduced-motion；公开变量表达不了的要求记录准确缺口，不用私有选择器、复制组件皮肤或 `!important` 补丁。
4. 在项目既有样式入口导入这份文件。公开基础 CSS 选择一次 `style.css`，或按合同加载 `critical.css` 与可选分片；层序为 design-defaults → product-overrides → design-accessibility，组件位于独立 xui-components 层，详见 [实施说明](IMPLEMENTATION.md)。检查重复导入与未分层旧全局 CSS 的实际优先级，再确认 computed style。

复用一个与 xui 合同兼容的文档主题 owner，支持 `light` / `dark` / `system`，区分用户 mode 与实际 effective。公开 init 的首屏脚本先于 CSS 和可见内容，应用复用 `window.xuiTheme`；已有偏好通过受控 bridge 接入时保留 storage key、格式和其他字段。React `useTheme` 只订阅，不另造 context、storage 或 matchMedia owner，不在 JS 保存调色板；卸载释放视图订阅，文档 owner 终止时再销毁。

主题验收使用采用项目的真实构建和代表页面，覆盖浅色、深色、system 变化、窄屏、200% 浏览器缩放、长中文、输入/主操作/浮层、键盘焦点及动效偏好。只生成主题时，发现需要替换的业务控件或布局应记录位置与建议，按本次范围结束。

## 通用控件与宿主组合

普通交互优先复用公开封装：简单选择使用 `SimpleSelect` / `bindSelectControl`，复杂选择使用 `Select` / `Combobox` 或已公开的原生搜索组合；date-only 日期选择使用 `Calendar` / `createCalendar`。Calendar 不是现成 DatePicker，也不提供时间选择器，按实际公开能力组合。不要以裸 select、datalist 或 input type=date 的 OS 弹出面板作为统一外观的默认方案。

公共封装内部仍保留真实 input/button 的表单、事件、键盘和可访问语义。`NativeSelect` 等显式平台 API，以及安全文件选择窗口，属于浏览器/OS 能力边界，按明确需求使用并说明差异。领域组件、业务图形和产品布局由宿主自有组件组合；选择公共 Button、Surface 等应匹配实际语义，不机械套用，也不补私有 xui 皮肤。

下表是组装入口，详细 props/部件以 [PUBLIC_API.md](PUBLIC_API.md)、[IMPLEMENTATION.md](IMPLEMENTATION.md) 与固定版本类型为准：

| 公开能力 | 数据、状态与边界 |
| --- | --- |
| MenuLayout/NavigationMenu | 宿主提供菜单、activeId/location 和一次路由适配；公开 renderLink/renderButton/renderLabel/renderAction 与受控回调；不重复拥有选中状态或 drawer |
| AppShell/Container/Stack/Grid/Toolbar/PageHeader/Section | 公开内容与布局插槽；AppShell 用于自组 sidebar，避免叠加第二个 MenuLayout owner |
| Button/IconButton | 标准事件、ref/render、disabled/aria-busy 与可访问名称；busy 和防重复由宿主明确控制 |
| Field/Input/Textarea/Fieldset/Checkbox/Radio/Switch | 保留 name/value/checked、label/controlId、required/readOnly、help/error 与标准事件；复合字段显式关联控制项 |
| InputGroup | 单一输入边界，公开 Input/Textarea、前后缀 Addon 与 Button；`layout='stacked'` 支持多行输入及上下附件/工具区域，见 [WIDGETS](WIDGETS.md#多行输入与上下工具区域) |
| SimpleSelect/Select/Combobox；原生 bindSelectControl/createCommandPicker | 简单选择、复合选择或搜索选择；选项、查询和确认状态由宿主拥有 |
| Calendar/createCalendar；CommandPicker/createCommandPicker；ToggleGroup/Avatar/Accordion/ScrollArea | 按 [WIDGETS](WIDGETS.md) 使用各自公开合同，不用文本输入或 Tabs 代替其他交互 |
| GroupedCombobox/createGroupedCombobox | 一个搜索输入与 listbox，折叠/分页控件外置；查询、取消、选择和各组分页归宿主，见 [GROUPED_SEARCH](GROUPED_SEARCH.md) |
| NavItem/Breadcrumbs/Pagination/Disclosure/Tabs | 当前项、页码、open/value 与内容由宿主提供；保留链接、键盘、方向与受控确认语义 |
| Dialog/Sheet/AlertDialog/ContextMenu/Menu/Popover/Tooltip/Toast | 公开部件与生命周期负责浮层、取消和回焦点；Tooltip 仅放说明，必要错误不只放自动消失通知 |
| Table 与 DataTable/createDataTable | 真实 table、公开列与受控查询事实；布局、列宽和分页见下节 |
| Surface/Alert/Badge/Skeleton/Spinner/Progress；DataRegion/反馈状态/RenderBoundary | 默认层级、语义与动效；刷新保留旧值，异步失败与 render 异常分别处理 |
| MetricCard | 名称、值与颜色含义由宿主提供，复用 Surface 及统计 token，多卡按需要组合，见 [METRIC_CARD](METRIC_CARD.md) |
| Typography/Copyable/Separator/Tag/Image | 复制只传授权值，标签移除与焦点归宿主，图片提供 alt 与尺寸/比例，见 [DISPLAY](DISPLAY.md) |
| AuthPage/ConfigurableLoginPage；createAuthPage/createLoginPage | 无请求认证布局与完整登录页分别接入，见下节及 [AUTH](AUTH.md) |
| ApiKeyManager/BusinessLogExplorer/StructuredLogExplorer 及原生 factories | 共享 controller 与公开完整视图；服务能力、权限和领域 adapter/loader 归宿主，按需采用 |
| theme/resource/HTTP/query | 每项状态保持所属 owner，显式 key/loader/预算/Abort 与 endpoint adapter，不默认重试或重放写操作 |

多行 InputGroup 的 Addon 是 span，只放合法短语内容和公开按钮，不塞块级 Toolbar；Textarea 不同时加 `xui-input`。组件只处理公共布局与状态投影，真实草稿、附件、权限、IME/发送和业务流程继续归宿主。

原生基础控件使用已公开的 HTML 结构、CSS 类与 controller；完整 factory 只用于其明确支持的组合，不随意复制 React 内部 DOM。数据驱动菜单由 `createMenuLayout` / `createNavigationMenu` 生成，避免第二套内部 selected 皮肤或键盘实现。

## 表格与工作区布局

`DataTable` / `createDataTable` 的列 `width` 通常省略，仅在标识、操作或用户尺寸配置等确有需要时设置。它表示列宽下限，支持的值以 [DATA_TABLE](DATA_TABLE.md#列宽与内容边界) 为准。表格横向默认铺满：未配置列优先吸收余宽，全部配置时也由这些列分配余宽；下限总和超出可用宽度时，表体横向滚动，不压缩已配置下限。无需补占位列或私有表体 CSS。

列宽与纵向 `layout` 分开选择。默认 `natural` 使少量/空行随内容收缩，实际有界父级中才限高并滚动表体；auto 高度父级仍按文档流增长。显式 `workspace` 填满并保留组件下限，`document` 在有界父级也取消高度上限。由旧版本升级且依赖填满表现的调用，明确设置 `layout='workspace'`；不以列 width 控制纵向高度。

标准列表可组合 MenuLayout 的 pageHeader、DataTable 内部 toolbar 与唯一 footer；也可使用外部 pageToolbar，同一组筛选不重复。本地分页由宿主筛选/排序后切片，服务端分页保留真实响应；筛选/排序由同一查询 owner 重置第一页并取消旧请求。cursor 使用真实游标与可选 total，不杜撰页码或总数。低层 Table 仍是表格原语，不自带排序、查询或虚拟化引擎。

工作区正文贴边使用 AppShell/MenuLayout（原生 `createMenuLayout`）的 `scrollMode='workspace'` 与 `contentInset='edge'`；默认仍为 `standard`。内部滚动组合 ScrollArea，按需显式选择 `Viewport.focusMode='inset'`，默认保留 gutter；嵌套滚动边界拥有自己的焦点策略。`Surface.padding='none'` 只省略该表面的内距，保留背景、边线和圆角。旧引擎不支持 `@scope` 时保留安全焦点余量，不以私有选择器或 `focus-width=0` 绕过，详见 [工作区正文贴边](LAYOUT_SLOTS.md#工作区正文贴边)。

shell 的 scrollMode 与表格 layout 相互独立。超高页头需要保证非零正文视口时，按 [页面标题、筛选与滚动](DATA_TABLE.md#页面标题筛选与滚动) 通过公开 `--layout-workspace-content-min-block-size` 设置必要下限，不测量固定页头或定位 footer。顶栏紧凑间隔与语言入口见 [HEADER_CONTROLS](HEADER_CONTROLS.md)。

## 登录与密码

`AuthPage` / `createAuthPage` 提供无请求的认证、初始化及启动状态布局；`ConfigurableLoginPage` / `createLoginPage` 在其上接完整 auth owner。默认是紧凑、居中、自然高度的单列框，fullscreen 保留同一窄框并省略外框皮肤。反馈按实际内容出现，idle 无反馈占位，长表单与短视口自然文档滚动；主题复用既有 owner。布局、品牌层级与实际验收见 [AUTH](AUTH.md) 和 [LOGIN_VISUAL_ACCEPTANCE](LOGIN_VISUAL_ACCEPTANCE.md)。

管理员初始化可按需使用已有 [AdminSetupPage / createAdminSetupPage](PUBLIC_API.md#完整管理员初始化页)，由宿主提供权威状态与 submit 回调，密码复用 `NewPasswordFields`。

登录与管理员初始化共用基础字段和 InputGroup 的视觉、交互状态与焦点规范。接入时分清表单字段、反馈和提交职责，以及居中、响应式与滚动的页面壳职责，按已有公开能力组合；必需字段、各自校验和业务提交仍由原有 owner 负责。共用外观不向登录增加确认密码、新密码规则或强度提交门禁。

完整登录页接一个 HTTP/auth owner，按固定 Bearer v2 login/refresh/logout/session 合同连接真实服务。正常凭据登录直接 POST，不增加持久恢复 gate、写前 preflight、Lookup/Resolve 或恢复 dialog；结果未知时通过一次普通 refresh/session 核验，不自动重发写请求。提交时禁用字段和主按钮，按钮显示“正在登录…”等配置的忙态文案，无主登录取消入口；公共页面也不自动为扩展等待生成取消动作。Cookie、CSRF、身份与资源权限归服务及宿主，登录后的目标路由由宿主处理。

普通密码使用基于 InputGroup 的 `PasswordInput`，复用前后缀和显隐按钮；需要本地强度时使用 `PasswordStrengthInput`，新密码与确认使用 `NewPasswordFields`。React 正式入口分别为 `/text-inputs` 与 `/password`；原生对应 `createPasswordInput`（`/text-inputs-dom`）、`createPasswordStrengthInput` / `createNewPasswordFields`（`/password-dom`），完整路径与用法见 [PASSWORD](PASSWORD.md)。

新设密码固定为有效 Unicode 的 **6–32 个码点**，不修剪、归一化或截断；没有 GET password-policy 或项目 policy 配置。空态不显示规则、计数或建议；`NewPasswordFields` 在提交时通过 `readValidatedPassword()` 校验并显示关联字段 tips。本地强度只显示一条连续彩色条，低分、首次离线或估算不可用均不增加提交门禁；服务端独立执行固定校验。旧账号登录使用普通密码输入，不套新设密码限制。密码不进入 URL、storage、日志或远程评分，清理及生命周期按 [PASSWORD](PASSWORD.md) 执行。

## 公共请求、API Key 与日志

HTTP/query 按 [HTTP](HTTP.md) 核对响应模式、错误、下载、预算与 endpoint codec；不猜 `data/msg/items`、页基数、日期格式或路由。一个请求与状态 owner 连接宿主明确的 adapter/resource，区分 401/403、网络失败与业务错误，不自动重放写请求。Vite 开发接入另核 [冷启动与依赖优化](NAVIGATION.md#vite开发模式的已复现依赖优化刷新)，以实际正式入口配置必要的 include/dedupe，分别验证冷暖 cache 与真实刷新原因。

`createApiKeyHttpAdapter` 与 `createBusinessLogHttpLoader` 已提供默认 HTTP 连接，选用时分别满足 [API_KEY](API_KEY.md)、[BUSINESS_LOGS](BUSINESS_LOGS.md) 和 [PAGE_APIS](PAGE_APIS.md) 的 DTO/分页/鉴权前置。宿主仍负责注册真实路由、身份、tenant、授权、脱敏、事务与数据保留；也可在公开 typed adapter/loader 边界连接明确的领域合同。

API Key 管理针对平台签发凭据，与 provider key 分开。v2 合同采用直接 CRUD、提交 busy、更新 `expected_version` CAS 和独立授权确认；未知结果普通列表读取一次，不重发写请求。撤销与删除管理记录分别确认；完整 secret 仅在当次结果视图显示，关闭/卸载清除，不放 metadata/resource/cache，身份切换销毁旧 controller。

业务日志是可查询的业务记录：公共字段与 `event_type/schema_version` 配合授权 payload，按类型/版本注册 renderer，未知版本安全文本回退。默认 HTTP loader 使用明确的 offset 合同，领域 cursor 依自身 loader 合同；日志写入可靠性归服务。StructuredLogExplorer 是独立程序错误观察，按 [LOGS](LOGS.md) 的明确 facade 接入，不替代业务日志或宣称后端已存在。

## 原生 UI ID 与内网 HTTP

原生登录、菜单/布局、API Key/日志视图、Command、Disclosure、Popover 和 Toast 的内部 UI ID 不依赖 `crypto` / `crypto.randomUUID()`，非安全上下文无需 UUID polyfill。allocator 在每个 ownerDocument 共享分配并避开已存在 ID，组件沿用已有显式 DOM ID。宿主将自动 ID 视为临时不透明标识，不解析或持久化，也不用于 token、nonce、密钥或幂等键。认证传输、Cookie、CSRF 和剪贴板仍按各自能力合同处理。

## 发布状态与升级原则

采用前在宿主确认其发布状态、依赖版本、真实协议、配置、会话与持久数据影响，再决定升级步骤。必要的兼容只服务于已确认的使用方与升级约束，明确映射、保留能力和退出条件；正常 props/render/loader/adapter、标准协议边界与安全校验各自保留。组件接入或代码清理不授权删除业务数据、重置运行、改其他仓库、发布或部署。

## 按授权范围迁移与验收

先盘点受影响页面的权限、导航条件、输入保留、认证、查询/缓存、上传下载、错误恢复和可访问性，再建立旧行为到公开能力的映射。主题任务只完成主题与入口；页面接入只替换本次授权的通用部分，宿主业务和产品布局按实际需求保留。清理被本次公共能力接管的重复 listener、状态、DOM 或皮肤，不为整齐扩大改动。

验收仅调用固定产物的公共 exports/props/slots/adapters。检查解析路径、peer 单实例、CSS/init、computed style 与真实页面行为，按受影响状态验证浅深/system、宽窄、长中文、200%缩放、焦点与 reduced-motion、加载失败、刷新保留、显式重试、迟到响应和卸载释放。合成示例、源码检查、自动测试与产品现场验证分别记录；未执行的浏览器、SSR、移动 OS、读屏器或性能场景不写成通过。

交付说明采用范围、实际版本/SHA、主题与入口位置、公开能力映射、验证结果及具体缺口。业务局部需求在宿主组合；公共缺口应有可复用场景和受限位置，不默认扩展 xui API。公共合同升级后重新核对依赖、类型、adapter 和受影响页面回归，只在对应项目授权中实施。

最短页面接入请求：`阅读 xui/.agents/skills/adopt-xui/SKILL.md，按实际公开合同接入当前页面需要的通用组件；保留宿主业务、权限与路由，使用正式产物，运行实际构建并报告通过、未跑和缺口。` 使用实际 checkout 路径替换 xui。
