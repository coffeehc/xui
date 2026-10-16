# xui 通用组件接入手册

xui 为新产品 UI 统一采用 React：公共组件从 `@coffeehc/xui-react` 导入，`@coffeehc/xui-runtime` 保持 TypeScript 的主题、服务、模型与工具能力。宿主项目负责业务页面、领域图形、产品布局与业务流程，以及领域数据、鉴权、路由和接口适配。项目局部差异先在宿主自有 React 组合中表达；只有可复用的通用能力缺口才反馈 xui，不把业务特例扩成公共 API。

本手册引用公共规范、正式类型与示例，不另定义组件或品牌合同。采用前核对实际消费版本、Git SHA、本地依赖或 tarball，以及 [全部公开入口与默认行为](PUBLIC_API.md)。Codex 流程的唯一源随 checkout 维护，见 [adopt-xui](../.agents/skills/adopt-xui/SKILL.md)；全局发现入口可以链接同一源，物理路径解析遵循该 skill。

## 阅读顺序与职责

1. 核对采用项目规则、工作区、固定版本与正式 exports，保护已有修改后按项目 Git 规范同步。
2. 按项目自己的 `docs/DESIGN.md` 生成主题；xui [DESIGN](DESIGN.md) 定义公共默认值和变量合同。
3. 在 [组件手册](COMPONENTS.md) 只读当前任务对应章节；正式入口、运行时与默认服务合同见 [PUBLIC_API](PUBLIC_API.md)。
4. 按 [逐项接入检查清单](ADOPTION_CHECKLIST.md)建立每个页面/组件/API的检查记录，先核对槽位映射再构建并验证实际消费页面；当前已验和未验范围见 [VALIDATION](VALIDATION.md)。

## React 是唯一公共 UI

theme 提供预构建 CSS/tokens；runtime 只提供无框架 TypeScript 服务、模型、解析器和工具；`@coffeehc/xui-react` 是唯一公共 UI 实现，使用宿主提供的 React/ReactDOM/Base UI peer。runtime 不提供第二套 DOM UI factory/controller。宿主保管业务状态、权限、租户范围、导航条件、输入草稿与业务动作；公共组合通过数据、配置和 React props/parts/slots/render/adapters 接入，不复制组件内部 DOM 或私有皮肤。

runtime 原生 DOM UI exports 已从当前公开入口移除，原生 UI 示例也不再作为接入路径。该 breaking change 不代表 XQuant、XLead 或其他消费项目已完成 React 迁移或通过验收；消费项目须按自己的授权核实固定包版本、调用点和实际页面。HTTP/auth/query/theme/resource 等 TypeScript 服务、模型、解析器与工具继续公开，React 宿主可直接复用。

当前 DESIGN 与三个私有包均为 4.1.2，runtime 基础 Service 不再导出 `create*` 工厂；消费者需在入口 bootstrap 后按窄模块导入稳定 Service 引用；4.0 的 bootstrap 不再加载所有实现，容器 getter 需先加载对应模块，`/services` 仅用于明确需要全量的隔离装配。须复核固定 ESM/CSS/types 与打包依赖。1.0.0 已移除 runtime DOM UI exports，2.0.0 进一步统一基础服务 owner；这些库版本变化不代表 XQuant、XLead 或其他消费项目已迁移或通过验收。消费项目逐页状态须以各自仓库实际源码和浏览器证据为准。2.0.1的公共认证页采用Stitch V3：品牌居于卡片外部，宿主只使用已有配置和slot，不补私有CSS。本轮 xui 当前验证见 [验证记录](VALIDATION.md)。

HTTP、认证、API Key 与日志能力可按需采用。选用固定 client/adapter 或完整页面时，真实服务必须满足对应合同；修改 baseURL 不能替代 DTO、认证或分页语义适配。公共16项操作采用官方 client，并从 bootstrap 共享 service 获取依赖；BaseService已有facade直接连接，其余由后端一次投影同一wire，禁止前端再设兼容转换。宿主决定其余领域接口及其适配边界，采用通用组件不自动要求重写所有业务 API、后端或产品流程。OAuth2/OIDC/SAML 和第三方接口继续遵循各自标准与合同，转换在宿主明确边界完成。

## 固定产物与可运行示例

在 xui 仓库根执行，工具版本以 packageManager/lock 为准：

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test:consumer
pnpm preview
```

`test:consumer` 将包打成 tarball，在新目录安装并从正式 ESM/CSS/types 编译、打包。采用项目应固定同一源码构建出的 DESIGN 与三个包 3.0.0，或固定完整 SHA，并使用正式产物。React、ReactDOM、Base UI 与 runtime peer 保持单实例；不使用 `packages/src` alias 或下游 Tailwind 扫描依赖源码。

当前可运行参考只展示 React UI；纯 TypeScript runtime 模型和服务可在 React 页面中复用。它们使用合成数据，不证明采用项目的真实后端、业务权限或页面已集成。

| 用途 | React 正式示例 |
| --- | --- |
| 最小菜单 | [menu-react](../examples/menu-react/app.tsx) |
| 富条目导航 | [rich-navigation-react](../examples/rich-navigation-react/app.tsx) |
| HTTP 查询 | [http-react](../examples/http-react/app.tsx) |
| 列表/表单/详情 | [foundation-react](../examples/foundation-react/app.tsx) |
| 标准槽位卡片（?card） | [display-react](../examples/display-react/app.tsx) |
| 工作区 | [workspace-react](../examples/workspace-react/app.tsx) |
| 卡片集合 | [card-group-react](../examples/card-group-react/app.tsx) |
| 完整表格 | [data-table-react](../examples/data-table-react/app.tsx) |
| 高信噪比页面、表单和局部刷新 | [page-composition-react](../examples/page-composition-react/app.tsx) |
| 日期时间 | [date-time-react](../examples/date-time-react/app.tsx) |
| 登录 | [login-react](../examples/login-react/app.tsx) |
| API Key | [api-key-react](../examples/api-key-react/app.tsx) |
| 业务日志 | [business-log-react](../examples/business-log-react/app.tsx) |
| 程序错误观察 | [log-react](../examples/log-react/app.tsx) |
| 公共组合与默认页面 HTTP | [capabilities-react](../examples/capabilities-react/app.tsx) |

示例按各自目录名访问。合成数据、fetch 和认证模型只演示公开合同，不证明采用项目的真实后端、业务权限或页面已集成；具体已跑与未跑项以对应验证记录为准。

## 主题、CSS 与单 owner

最短主题请求：**根据 `docs/DESIGN.md` 生成 xui 可识别的 `theme.css`。** 这里的设计文件默认指采用项目自己的文件。完整步骤见 [项目主题流程](../.agents/skills/adopt-xui/references/theming.md)；该请求只覆盖主题及必要样式入口，不自动扩大到业务、页面布局、组件替换、HTTP、认证、后端或完整迁移。

1. 核对项目实际消费的 xui 版本及其公开 tokens。将项目设计中的颜色、字体、尺寸、边线、层级、阴影与动效要求映射到真实变量；无产品差异的部分继承 xui 默认值，不复制整份默认色板或编造 token。当前 checkout 的新变量不能直接当成旧安装版本的能力。
2. 在项目现有样式目录生成或整理一份 `theme.css`，在简短注释或已有采用记录中保存设计来源、xui 版本及关键映射。覆盖放在 `@layer product-overrides`，作用于与默认变量相同的文档根；按实际 `data-theme` 合同覆盖 light/dark/system 对应分支，避免 system 回到另一套品牌。主色 `--action-primary` 与 `--action-primary-foreground` 成对考虑，并检查 hover、pressed、selected、错误与焦点状态。
3. 尺寸使用 `rem` 或依赖公开尺度的 `calc`，保留中文、系统及通用字体回退，不缩小根字号补布局。保留必要对比、键盘焦点、forced-colors 和 reduced-motion；公开变量表达不了的要求记录准确缺口，不用私有选择器、复制组件皮肤或 `!important` 补丁。
4. 在项目既有样式入口导入这份文件。公开基础 CSS 选择一次 `style.css`，或按合同加载 `critical.css` 与可选分片；层序为 design-defaults → product-overrides → design-accessibility，组件位于独立 xui-components 层，详见 [样式分层与正式产物](#包与正式入口)。检查重复导入与未分层旧全局 CSS 的实际优先级，再确认 computed style。

浏览器应用以 `bootstrap(overrides, environment)` 建立唯一文档服务注册表，再从同一个 `application.services` 取得 HTTP、认证、主题、菜单、i18n、路由和下载服务。包内 `config.json` 提供默认项；项目仅传 JSON override，服务实例、Window、平台 writer 等运行时依赖通过第二参数的 `environment.services` 注入。普通应用不得调用已移除的基础服务 `create*` 工厂。采用项目按页面会话使用 `ui.theme.mode` 与 `ui.interface.scale` 的 sessionStorage 偏好，存在有效保存值时优先于 config 中的 mode/scale 默认值。`init.js` 是首绘前脚本，只恢复根元素主题/缩放属性，不创建或订阅 ThemeController；React `useTheme` 订阅 bootstrap 提供的同一个主题 owner，组件卸载不销毁它。

主题验收使用采用项目的真实构建和代表页面，覆盖浅色、深色、system 变化、窄屏、200% 浏览器缩放、长中文、输入/主操作/浮层、键盘焦点及动效偏好。只生成主题时，发现需要替换的业务控件或布局应记录位置与建议，按本次范围结束。

## 发布状态与升级原则

采用前在宿主确认其发布状态、依赖版本、真实协议、配置、会话与持久数据影响，再决定升级步骤。必要的兼容只服务于已确认的使用方与升级约束，明确映射、保留能力和退出条件；正常 props/render/loader/adapter、标准协议边界与安全校验各自保留。组件接入或代码清理不授权删除业务数据、重置运行、改其他仓库、发布或部署。

## 按授权范围迁移与验收

先盘点受影响页面的权限、导航条件、输入保留、认证、查询/缓存、上传下载、错误恢复和可访问性，再建立旧行为到公开能力的映射。主题任务只完成主题与入口；页面接入只替换本次授权的通用部分，宿主业务和产品布局按实际需求保留。清理被本次公共能力接管的重复 listener、状态、DOM 或皮肤，不为整齐扩大改动。

验收仅调用固定产物的公共 exports/props/slots/adapters。检查解析路径、peer 单实例、CSS/init、computed style 与真实页面行为，按受影响状态验证浅深/system、宽窄、长中文、200%缩放、焦点与 reduced-motion、加载失败、刷新保留、显式重试、迟到响应和卸载释放。合成示例、源码检查、自动测试与产品现场验证分别记录；未执行的浏览器、SSR、移动 OS、读屏器或性能场景不写成通过。

交付说明采用范围、实际版本/SHA、主题与入口位置、公开能力映射、验证结果及具体缺口。业务局部需求在宿主组合；公共缺口应有可复用场景和受限位置，不默认扩展 xui API。公共合同升级后重新核对依赖、类型、adapter 和受影响页面回归，只在对应项目授权中实施。

最短页面接入请求：`阅读 xui/.agents/skills/adopt-xui/SKILL.md，使用 @coffeehc/xui-react 按实际公开合同接入当前 React 页面需要的通用组件；保留宿主业务、权限、路由与 runtime 服务 owner，使用正式产物，运行实际构建并报告通过、未跑和缺口。` 使用实际 checkout 路径替换 xui。

## 组件层次与扩展原则

xui 按 **原子→组合→页面** 提供同一前端体系。这是贡献与采用的架构准则；完整通用视觉/交互规则与默认 token 来源仍仅为 [DESIGN.md](DESIGN.md)，本节说明真实实现如何分层，不复制另一套皮肤规则。

| 层次 | 当前公开实例 | 采用与扩展 |
| --- | --- | --- |
| 原子 | Button/IconButton、Input/Textarea、Checkbox/Radio/Switch、Field、Alert、公共 CSS | 直接采用公开 props/ref/render、标准元素和语义 token；图标按钮使用共享 IconButton，不新增竞争按钮/输入基础包 |
| 组合 | MenuLayout/NavigationMenu、公共 Toolbar/Grid/Table/DataRegion、Dialog/详情布局、HTTP/query/controller | 组合原子提供通用键盘、状态、反馈和布局。Table 不抽查询引擎，query 不抽领域业务；状态与后端 adapter 通过明确公开合同连接 |
| 页面 | AuthPage React 纯认证布局、ConfigurableLoginPage、ApiKeyManager、BusinessLogExplorer | 填文案/品牌数据、选项、adapter/loader 与 callbacks 即可整页使用；页面内部复用下层相同控件与皮肤，业务不必手写页面 CSS |

产品 UI 统一使用 React 完整页面或组合；特殊业务可用公开 React props/render/parts、受信任 renderer、数据配置和 callbacks 组合基础控件。不依赖内部 DOM/伪元素或覆写内部皮肤。上层不得复制下层的状态、focus/motion/disabled 或默认色值 owner。runtime 服务、模型、工具和主题合同独立于 UI 组件继续保留。全部实际入口与默认值见 [PUBLIC_API.md](PUBLIC_API.md)，不能把规划的注册/SSO/完整用户管理列作已存在页面。

侧栏需要底部收拢入口时，给 React MenuLayout/AppShell 传 `sidebarTogglePlacement="bottom"`；不要移动库内按钮。业务底部动作与版本状态需要同行时使用 `SidebarFooterRow`，保留既有回调与 busy，见[侧栏底部接入](COMPONENTS.md#侧栏底部接入与迁移)。

Dialog/Sheet 内需要指定 Popover 的挂载目标时，使用 `Popover.Content.portalProps.container`，保留公共 Content 的定位/样式接线；不要外包第二层 Portal。容器就绪、默认 keepMounted 策略及 peer 类型边界见[Popover 的 Portal 容器](COMPONENTS.md#popover-的-portal-容器)。

业务流程、领域数据、业务页面和产品布局由宿主负责；领域 API、权限/tenant 与校验须可独立测试。xui 提供通用组件、公开组合、请求接入及 typed adapter/loader 边界。公共 16 项服务操作必须直接使用官方 client；使用 BaseService 时保持其 facade 与 wire 合同，不使用 BaseService 时由后端一次性实现同一合同，前端不得再次转换。ResponseAdapter、ErrorResponseAdapter、ApiKeyAdapter 与 BusinessLogLoader 保留给独立领域接口、第三方协议及隔离测试，不能用来重写这 16 项的请求、响应、认证或错误语义。业务 API 迁移是宿主独立任务。页面所需前置见 [默认适配器前置](PUBLIC_API.md#默认适配器的服务前置)。

贡献与采用应能说明所属层次、复用下层的方式、公开扩展点和实际构建消费。合成页面通过不代表产品迁移通过。

卡片使用公开 React `Card` 的 header/content/footer 三段槽位；标题、图标、Badge、辅助动作、正文、footerMeta/footerActions 按 [Card 合同](COMPONENTS.md#card)归位。长名称在标题内部使用公开 `OverflowText`，图标和 Badge 不进入文本滚动区域；无键盘入口或减少动效时完整静态换行。

### 接入合规与公共缺口归属

以下要求适用于首次接入、升级和接入自查。先固定实际安装版本/SHA，核对正式 ESM/CSS/types 与该版本合同；源码中的新能力不等于消费项目已安装。检查实际页面调用、最终样式与请求链路，不能凭 import 数量或截图认定完成。

- 已有适用完整页面或组合时直接采用，登录优先 ConfigurableLoginPage 及 bootstrap 注册的同一 AuthClient。品牌、文案、公开 extensions 与宿主业务可以配置；只使用公共 Input/Button 后手写另一套登录页面，不能算完整登录组合接入。认证服务前置不满足时按接入模式保留既有认证 owner并报告限制，不能猜协议或伪称完整登录通过。
- 需要修改、增强或修复公共组件时，消费项目不得自行复制 React 实现、fork、打补丁、穿透私有 DOM/CSS、使用 !important 或以 wrapper 建立竞争实现。消费项目列出实际入口/版本、代码位置、最小复现、业务场景、受限行为、当前公开替代入口与验收条件，统一交给 xui；由 xui 在自己的授权范围内补齐公开合同、实现和验收后，消费方再按升级授权采用。正常公开 props/slots/render/typed adapter 与领域组合仍属宿主职责。
- 逐项追踪已采用的 HTTP/auth/page adapter/loader，核对登录、刷新、退出、session及适用的Key/日志/下载等调用。不得悄悄改固定端点、method、DTO、解析或错误语义，不得绕过公共 client 另建重复请求、凭据、401跳转、超时、重试、loading或通知owner。领域API和标准/第三方协议按[默认适配器前置](PUBLIC_API.md#默认适配器的服务前置)保留明确typed边界，不要求全量后端迁移。
- UI信息遵守[信息披露](DESIGN.md#首屏信息架构与信息密度)。不添加重复品牌/页面名页脚、无用统计、常驻实现背景、开发备注或接入/验收声明；保留必要标签、真实业务状态、权限、错误、风险与及时操作反馈。不得用测试说明或合成记录冒充正式业务内容。

自查报告区分：已有公共能力误用、宿主接线/冗余内容、真实公共能力缺口及宿主业务职责；逐项附文件位置、公共入口与源码/浏览器Network等实际证据，明确通过、失败和未跑。只要求自查时保持只读；不把自查隐式升级为组件修改、依赖升级、业务API迁移或发布。

### 前端实现基础自查

接入自查必须包含前端实现正确性与适用的工程实践，不能只检查是否import了xui或颜色是否一致。统一标准只在DESIGN维护；本节规定检查方法，不另造组件规则或私有皮肤。

执行 [ADOPTION_CHECKLIST](ADOPTION_CHECKLIST.md)，逐项附对象、状态、期望、实际、证据和责任owner，不再用一段“已符合最佳实践”代替。页面先列出内容到 [公开槽位](DESIGN.md#页面与组件的槽位架构)的映射；源码核对后，浏览器验证文字/色彩、空槽、宽窄/放大、焦点、请求与刷新连续性。公共API逐操作核对method/path/body、成功事实和失败/权限。

每项只记通过、失败、未跑、不适用（须有业务依据）。正常React render不等于卸载，合法范围切换不等于错误清空；不能从截图判断的请求与生命周期行为记为未跑。规范给出标准，清单给出判定项，报告给出真实证据，三者职责分开。

宿主调用reload、清空数据、loading条件卸载、错误key/effect等属于宿主接入问题；保持公开props、记录、稳定身份与合法生命周期后，公共组件内部仍违背标准的，提供最小复现交给xui。自查不会授权消费项目修改或增强公共组件，也不自动授权修改业务API或实施性能改造。

检查→初始化需要连续认证外壳时，保留一个不传form的AuthPage，在children使用公开AdminSetupForm；完整AdminSetupPage复用同一个实现。接线见[组件合同](COMPONENTS.md#可组合初始化表单)，正式示例见[共享外壳](../examples/admin-setup-form-react/view.tsx)。

## 设计项目组件与页面

采用项目在自己的 `docs/DESIGN.md` 引用实际采用的 xui 版本/SHA，仅记录品牌差异、业务术语、信息优先级、私有组合及页面约定。公共基线与项目文件由开发者或技能显式读取，不存在 Markdown 自动继承；`theme.css` 只落实视觉变量覆盖，其余沿用默认值。完整关系见 [项目设计文件与主题](DESIGN.md#项目设计文件与主题的关系)。

设计或改造页面时，先按 [页面信息呈现方法](DESIGN.md#首屏信息架构与信息密度) 确定用户任务、关键事实、动作和披露顺序，再按 [私有组合组件方法](DESIGN.md#项目私有组合组件的设计方法) 确定职责、状态所有者、输入/回调与容器边界。用 [组件手册](COMPONENTS.md) 和实际消费版本核对可复用能力，避免先堆组件再补信息层级。

项目可以组合 xui 控件并编写自身布局样式；公共控件的语义、状态、焦点与内部皮肤继续由 xui 负责。将公共基础缺口与宿主领域需求分开，保留已有业务能力及单一状态 owner。仅要求设计/评审时交付相应结论，不顺带实施页面、升级依赖或迁移后端；实施时按真实使用场景验证布局、异常、可达性和生命周期，不把主题生成当作页面设计完成。

可以直接请求：**使用 adopt-xui，按照项目 `docs/DESIGN.md` 和 xui 设计方法，设计当前任务的私有组合组件与页面信息呈现。** 稳定约定更新已有项目设计章节，不复制整份公共规范或另建组件设计文档。

## 主题单一所有者

无显式受控 `ThemeOptions.mode` 时，ThemeController 使用非受控 mode 并默认持久化到 sessionStorage，默认 key 为 `ui.theme.mode`；`persist:false` 完全使用内存。`bootstrap` 将 JSON `theme.mode` 作为非受控默认，已有有效 sessionStorage mode 优先于该默认；没有有效保存值时才使用 config 默认。显式注入 `ThemeOptions.mode` 是受控模式，不隐式读写 storage。`setMode` 只请求 `onModeChange`，宿主确认后调用 `syncMode`；`state.mode` 保留用户选择，`state.effective` 是当前浅深结果。显式浅深不被系统变更覆盖。同一标签页刷新保留选择，不主动跨标签同步；不读取、迁移或改写旧 localStorage。

`@coffeehc/xui-runtime/init.js` 应在 CSS 与可见内容前加载，只读有效的 sessionStorage/预设主题信息并写根元素主题/缩放属性，供首绘避免闪烁。它不创建、订阅或销毁 ThemeController。浏览器服务的正式 owner 由 `bootstrap()` 或 `getThemeService(window)` 取得；主题设置 UI 可通过 React `useTheme` 订阅同一 owner。不要让 init、React provider、主题按钮或每个 View 各自创建 storage、matchMedia 监听或控制器。

```html
<script src="./theme-init.js"></script>
<link rel="stylesheet" href="./app.css">
```

```ts
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
const app = bootstrap({theme: {mode: 'system'}});
const theme = app.services.getThemeService();
// useTheme 订阅；应用关闭时由 app/services owner 统一释放。
```

有效 `ui.interface.scale` 同样优先于 config 的 `theme.scale` 默认。无存储值时才采用 config 默认缩放；首屏脚本负责预绘制恢复，bootstrap 安装服务后再次读取相同有效值不会产生第二个 owner。存储不可用时保留当前页内存操作。ESM 导入本身不创建浏览器 owner。

### 公共文字槽

消费项目非必要不得自行设置组件内容字号。按[唯一文字槽映射](DESIGN.md#公共文字槽验收)提供内容，普通 slot 裸文本自动采用所属角色，内部 Button/Badge/Input 保留自身字体。紧实度由公共 layout/slot/Token 决定，不能在宿主局部缩字。领域阅读必要例外必须记录用途、入口与范围；公共缺口提交 xui。逐实例完成[TYPE-001～023](ADOPTION_CHECKLIST.md#公共文字槽逐项验收)，这些同时是 xui 的发布门槛。正式样板：[文字槽](../examples/typography-slots-react/app.tsx)。

## 界面缩放与会话恢复

使用同一个runtime方法，React无需额外hook或组件：

```ts
import {setInterfaceScale} from '@coffeehc/xui-runtime/theme';
setInterfaceScale(1.25); // 125%，即时生效并写入sessionStorage
setInterfaceScale(1); // 恢复100%
```

只接受1、1.25、1.5、2；不传125或百分号字符串。保持正式init.js在CSS和可见body前同步执行，使 `ui.interface.scale` 在首屏预绘制恢复；它只写根元素属性，不创建服务或控制器。bootstrap 以 config 默认值启动其余服务，并复用已恢复的 scale 偏好。不要在React effect里再恢复一次，不新增localStorage、请求、页面reload或子树缩放owner。存储拒绝时当前页仍可放大。宿主可提供设置入口，但xui不强制新增界面。根字号基于浏览器默认比例计算，保留浏览器zoom；宿主不得以固定根字号或CSS zoom覆盖。完整值/异常/生命周期见[界面缩放合同](DESIGN.md#公共界面缩放)，按[逐项清单](ADOPTION_CHECKLIST.md)提交实际证据。

## 构建与正式消费

### 包与正式入口

全部包 private、ESM；本地 npm pack 用于验证，不发布。没有 CommonJS、SSR hydration 或子树主题支持声明。

| 包 | 正式入口 | 职责 |
| --- | --- | --- |
| `@coffeehc/xui-theme` | 预构建 CSS、tokens 与按需样式分片 | 无框架依赖，完整及分片入口见 PUBLIC_API |
| `@coffeehc/xui-runtime` | TypeScript 主题、resource、导航数据、HTTP/query、认证、服务、模型与工具 | 无框架依赖；模块可独立导入。`init.js` 是仅作首绘预设的经典脚本；bootstrap 才建立应用服务 owner。UI 仅由 `@coffeehc/xui-react` 提供 |
| `@coffeehc/xui-react` | 公共组件及各能力子入口 | React、ReactDOM、Base UI、runtime 是 peers，不捆绑宿主实例，不隐式导入 CSS |

优先按能力导入，例如 `@coffeehc/xui-react/button`。根入口也经过 Button-only 最终输出贡献检查；sideEffects 标记不是验证替代品。theme 可用完整 style.css，或 tokens.css + base.css + 所需分片。`critical.css` 与 `forms.css` 均包含共享 selection 样式，保证 SimpleSelect 的基础定位、选项和指针操作可用；`floating.css` 保留完整 selection + floating 组合入口，`forms.css` 保留 forms + selection 组合入口。共享规则只有一个源码定义，使用分片时不要再手工导入内部 selection 文件。不要将 style.css 和 critical.css 同时载入后又无意重复维护默认值。所有 CSS 都是打包后文件，无下游 Tailwind 扫描 node_modules 要求。

`design-default-css` 是唯一受控原始值来源。生成器核对全部版本化变量、全部模式依赖、前言、产品覆盖及提取字节；来源和可逆重建见[规范来源](#规范来源)。浮层只接收 peer 的 available-height、anchor-width、toast-swipe-movement-x/y 测量值，它们不是品牌 token 或缺失变量白名单。

tokens.css 按规范声明 design-defaults → product-overrides → design-accessibility；组件声明位于独立的 xui-components 层。按 tokens.css 后组件样式的标准加载顺序，xui-components 首次出现于这三层之后。产品在 product-overrides 覆盖少量语义变量，design-accessibility 再落实 reduced-motion；本说明不另设 token 层或更改现有层契约。旧项目未分层 CSS 的普通声明高于所有分层声明，不能只靠导入顺序推断 xui 能覆盖旧样式。采用时显式决定旧 CSS 所在层或移除精确重复规则，再检查真实 computed style。产品覆盖在同一 document 根上；本版不支持子树独立主题。

### 本地与双仓联调

pnpm dev 监听规范、CSS、TS/TSX、包入口、lock/config 和构建脚本，每次启动新的构建进程；生成 CSS、ESM、types 和 init 后，构建全部预览。packages 和 examples 分别暂存、校验代际并回滚发布失败。watch-status.json 的 building/error/success 及 source/example SHA 是事实；错误时旧预览可能继续服务，不能称为新改动已生效。pnpm preview 另开本地服务，dev 不部署。

正式验收先 npm pack，再在独立目录安装、编译 types 和打包；foundation 不复制 shared/layout.css。dev 的包解析也仅指向正式 exports 的 dist，没有源码入口。生产接入固定已验证的提交/本地 tarball。双仓 watch 可让宿主链接 built dist，但 React/ReactDOM/Base UI 必须由宿主保留单实例；Vite 可使用 resolve.dedupe 与指向本地正式入口的 alias，或独立 tarball 安装。链接后检查实际解析路径、ESM/types/init 的当前 generation，并运行宿主构建/页面检查。采用项目自行核对真实配置和消费结果。

## 宿主边界

业务路由、业务页面与领域图形、权限策略、身份源、缓存/查询、防抖、交易、服务端会话、表格查询/虚拟化引擎、图表数据、富文本/代码编辑器和 3D 引擎归宿主。xui 的 HTTP、认证客户端与通用页面组合只承担各自公开合同，不接管产品业务或要求全量后端标准化。OAuth2/OIDC/SAML 和第三方接口遵守各自协议，在宿主明确边界适配。

正式采用应固定版本/SHA，核对公开布局和组件、主题单 owner、旧 CSS 层级及真实构建产物。SSR hydration 仅按组件明确支持的范围使用；真实移动 OS、读屏器、产品后端和生产性能由采用项目另验，不能由参考消费者推断通过。

## 规范来源

通用规范最初取自 [xagent@29139f7843d9a79a9eca42892cb87da8f08f6320 的 docs/DESIGN.md](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/docs/DESIGN.md)，来源版本为 0.4.0。当前默认主题为 Precision Engineering Console，规范版本 4.1.2；来源 SHA、可逆变更和受控 CSS 指纹由 [design-source.json](design-source.json) 记录，原始参考材料保留在 [Precision 来源](design-sources/precision-engineering-console.v1.txt) 与 [历史家族规范快照](design-sources/product-family-ui.0.7.0.txt)。历史指纹用于溯源，不代表当前实现已全部验收。

[生成器](../scripts/tokens.mjs) 从 DESIGN 的标记 CSS 提取产物并核对 token、依赖和来源；[合同测试](../tests/contract.test.mjs) 检查当前协议边界和原始规范逆重建。维护时同步当前合同元数据，保留历史来源与快照指纹。产品采用按 [ADOPTION.md](ADOPTION.md) 固定版本和自己的扩展，无需复制全文或历史实施流水。

## 开发联调与冷启动

`pnpm dev` 持续构建正式包和预览，`--packages-only` 只构建包；另运行 `pnpm preview` 提供页面。核对 `BUILD_SUCCESS <sourceSha256>` / `BUILD_ERROR` 与 `.artifacts/watch-status.json`，失败时保留旧完整代际。页面仍可打开不证明最新修改已构建，watch 不提供浏览器 HMR 客户端。

Vite 无法静态发现的懒加载深入口可能在首次访问时触发依赖重新优化和文档刷新。宿主按实际使用的公开入口设置 `optimizeDeps.include`，保留框架插件及 React/ReactDOM/Base UI 的 `resolve.dedupe`；不要全量扫描、禁 HMR 或等待固定时间掩盖原因。分别记录冷/暖 cache 的 optimizer/HMR 日志、主 Document 请求和 shell identity，区分文档刷新与同文档路由。可重复的合成对照见 [Vite 冷启动测试](../tests/cold-start/vite.test.mjs)，不能代替产品现场归因。

菜单从首次可操作时接同一 router owner。`canNavigate=false` 和缺少 adapter 都表示放行浏览器默认链接导航，不能当作路由 pending 的阻止开关；未就绪由真实 disabled 状态或已接管的 navigate 处理。保留修改键、中键、target/download、回退前进和宿主的滚动恢复，不以 route key 重挂整个 shell。

桌面导航收起/展开控件由AppShell/MenuLayout放在侧栏内部，窄屏在顶栏保留同一“打开导航”入口。宿主仅接既有collapsed/onCollapsedChange、sidebarOpen/onSidebarOpenChange及名称，不复制按钮或穿透DOM搬位置。1.3.0 将默认 `top` 控件放到全局品牌行末端；曾显式设置 `bottom` 的消费项目仍须按授权改公开 placement prop，升级不会覆盖该选择。不能将新规范当成已安装能力；见[导航控件](COMPONENTS.md#导航内部唯一收起展开控件)。

正式CSS的基础作用域必须落实：应用根容器（常用body）使用公开 `class="xui"`；弹层由公共组合生成 `.xui-layer`。基础border-box、字号和焦点规则作用于这些范围，单独import style.css但省略作用域不能视为完成接入。独立消费者不能依赖其他项目的Tailwind preflight恰好补齐缺失规则，也不能仅量外框就宣称Input/Textarea没有溢出；核对控件自身的box-sizing和实际边界。不要用私有宽度补丁替代这一公开前提。

卡片集合采用公开[CardGroup](COMPONENTS.md#cardgroup)：填记录、稳定key和Card配置模板，由集合负责实例、布局、局部状态及唯一分页/计数。不要把Card+Grid拼接视为已采用集合合同；不要在项目内补第二套集合加载/刷新骨架。状态和分页由同一个既有query/resource owner发布，业务数据、草稿与操作仍由宿主负责。


2.0.0 状态控制采用 [逐项双模式矩阵](COMPONENTS.md#状态所有权与-controller-模式) 与 STATE-OWNER-001～007、STATE-COPY-001。旧受控props仍有效；需要完整自定义交互时注入同契约Controller，不把value/onChange/handle当完整替换。服务页面区分旧 service controller 和 viewController，AuthClient、业务loader/adapter与权限仍归原owner。基础服务从 bootstrap/注册表获取，组件Controller factory仍按组件生命周期使用。复制统一使用 [runtime只写服务](PUBLIC_API.md#剪贴板复制服务) 或通过第二参数注入的平台writer，不新增前端传输适配/认证/查询层。3.0.0 的 Toast 注入完整 xui Controller，旧 Base UI manager 须换为 xui 工厂；不访问 peer 私有 store。逐项验证仍须以消费项目为准。
