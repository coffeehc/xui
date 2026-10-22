# xui 通用组件接入手册

xui 为新产品 UI 统一采用 React：公共组件从 `@coffeehc/xui-react` 导入，`@coffeehc/xui-runtime` 保持 TypeScript 的主题、服务、模型与工具能力。宿主项目负责业务页面、领域图形、产品布局与业务流程，以及领域数据、鉴权、路由和接口适配。项目局部差异先在宿主自有 React 组合中表达；只有可复用的通用能力缺口才反馈 xui，不把业务特例扩成公共 API。

本手册引用公共规范、正式类型与示例，不另定义组件或品牌合同。采用前核对实际消费版本、Git SHA、本地依赖或 tarball，以及 [全部公开入口与默认行为](PUBLIC_API.md)。Codex 流程的唯一源随 checkout 维护，见 [adopt-xui](../.agents/skills/adopt-xui/SKILL.md)；全局发现入口可以链接同一源，物理路径解析遵循该 skill。

4.2.7起Tabs.List默认line，原内嵌底槽须显式variant="segmented"；侧栏末位水平Tabs移入AppShell/MenuLayout.sidebarTabs，与原Tabs.Root/Panel共用状态，避免Shell header重复分隔。

4.2.16默认展开侧栏为192–224px（100%基准、16vw偏好与50vw封顶），sidebarTabs短项自然分布填满；原默认324–432px需保留的宿主可使用公开宽度Token。compact rail和窄屏抽屉不变。

4.2.13 起默认配色为 Violet 电光紫；项目可在 `config.json` 中选择 violet / ember / forest / crimson / cobalt / precision 六套配色，明暗偏好仍独立为 light / dark / system。保留青色方向显式选 precision；已有 product-overrides 自定义品牌继续生效。配置、首绘一致性和运行期 setPreset 见 [项目配色与首绘](PUBLIC_API.md#项目配色与首绘)，正式包示例见 [theme-presets-react](../examples/theme-presets-react/app.tsx)。

## 阅读顺序与职责

4.2.35统一移除默认焦点外圈，已有边框仅变色，错误边框优先，无边框组件保持原边界。三包需采用同一SHA/generation；本次没有新增API或状态owner。升级时核对采用项目中输入、按钮、选择器、菜单、弹窗和表格等实际交互入口的聚焦、错误及回焦行为，删除与新公共合同冲突的私有外圈补丁，不重建Controller或请求；完整规则见[焦点与状态](DESIGN.md#主题与交互颜色)。

1. 核对采用项目规则、工作区、固定版本与正式 exports，保护已有修改后按项目 Git 规范同步。
2. 核对项目自己的 `docs/DESIGN.md` 和已有主题；仅首次主题接入或主题差异命中本次范围时生成/更新，xui [DESIGN](DESIGN.md) 定义公共默认值和变量合同。
3. 在 [组件手册](COMPONENTS.md) 只读当前任务对应章节；正式入口、运行时与默认服务合同见 [PUBLIC_API](PUBLIC_API.md)。
4. 按 [逐项接入检查清单](ADOPTION_CHECKLIST.md)建立每个页面/组件/API的检查记录，先核对槽位映射再构建并验证实际消费页面；当前已验和未验范围见 [VALIDATION](VALIDATION.md)。

首次接入与版本升级均按[统一执行流程](#新接入与升级的统一执行流程)推进；本手册定义执行顺序，[DESIGN](DESIGN.md)定义布局与视觉合同，[COMPONENTS](COMPONENTS.md)和正式类型定义实际扩展点，[检查清单](ADOPTION_CHECKLIST.md)定义逐项判定与报告格式。项目已有接入记录只保存本次实例、差异与证据，不复制另一套规范。

## React 是唯一公共 UI

theme 提供预构建 CSS/tokens；runtime 只提供无框架 TypeScript 服务、模型、解析器和工具；`@coffeehc/xui-react` 是唯一公共 UI 实现，使用宿主提供的 React/ReactDOM/Base UI peer。runtime 不提供第二套 DOM UI factory/controller。宿主保管业务状态、权限、租户范围、导航条件、输入草稿与业务动作；公共组合通过数据、配置和 React props/parts/slots/render/adapters 接入，不复制组件内部 DOM 或私有皮肤。

runtime 原生 DOM UI exports 已从当前公开入口移除，原生 UI 示例也不再作为接入路径。该 breaking change 不代表 XQuant、XLead 或其他消费项目已完成 React 迁移或通过验收；消费项目须按自己的授权核实固定包版本、调用点和实际页面。HTTP/auth/query/theme/resource 等 TypeScript 服务、模型、解析器与工具继续公开，React 宿主可直接复用。

以4.2.1为基准只维护一条版本线，后续所有变更只递增末位，不再维护3.x兼容包或其他平行版本。目标版本以固定归档的manifest、三包及DESIGN为准，不从历史段落猜“最新版”。历史验证记录保留用于溯源，不是当前可用的兼容分发。三个包必须同版本、同sourceGeneration安装；版本递增不代表语义兼容，升级前核对实际迁移合同。runtime 基础 Service 不再导出 `create*` 工厂；消费者需在入口 bootstrap 后按窄模块导入稳定 Service 引用；4.0 的 bootstrap 不再加载所有实现，容器 getter 需先加载对应模块，`/services` 仅用于明确需要全量的隔离装配。须复核固定 ESM/CSS/types 与打包依赖。1.0.0 已移除 runtime DOM UI exports，2.0.0 进一步统一基础服务 owner；这些库版本变化不代表 XQuant、XLead 或其他消费项目已迁移或通过验收。消费项目逐页状态须以各自仓库实际源码和浏览器证据为准。2.0.1的公共认证页采用Stitch V3：品牌居于卡片外部，宿主只使用已有配置和slot，不补私有CSS。本轮 xui 当前验证见 [验证记录](VALIDATION.md)。

HTTP、认证、API Key 与日志能力可按需采用。选用固定 client/adapter 或完整页面时，真实服务必须满足对应合同；修改 baseURL 不能替代 DTO、认证或分页语义适配。公共16项操作采用官方 client，并从 bootstrap 共享 service 获取依赖；BaseService已有facade直接连接，其余由后端一次投影同一wire，禁止前端再设兼容转换。宿主决定其余领域接口及其适配边界，采用通用组件不自动要求重写所有业务 API、后端或产品流程。OAuth2/OIDC/SAML 和第三方接口继续遵循各自标准与合同，转换在宿主明确边界完成。

## 固定产物与可运行示例

在 xui 仓库根执行，工具版本以 packageManager/lock 为准：

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test:consumer
pnpm preview
```

`test:consumer` 将包打成 tarball，在新目录安装并从正式 ESM/CSS/types 编译、打包。采用项目应固定同一源码构建出的 DESIGN 与三个包，或固定完整 SHA，并使用正式产物。React、ReactDOM、Base UI 与 runtime peer 保持单实例；不使用 `packages/src` alias 或下游 Tailwind 扫描依赖源码。

### 正式归档的唯一入口

维护者完成本轮必要测试并提交后执行`pnpm archive`，可重复传`--evidence <本仓库文件或目录>`保存明确的验收证据；CI在既有验证成功后自动调用同一命令。不再手写manifest、复制旧API清单或临时拼装正式目录。命令要求跟踪工作区干净、三包与DESIGN同版本、当前源码与构建stamp及成功的`test:consumer`回执同generation，并逐字节核对已测tarball与当前dist；不重新打包或改变已测文件。消费者验证开始时撤销旧回执，仅全部检查成功后原子写入`.artifacts/consumer-validation.json`，绑定三包摘要、API、性能记录、独立消费者锁文件和peer单实例版本。归档不代替本轮必要的浏览器/产品验证，也不发布npm。

固定结构（归档schemaVersion=1；历史目录保持原样）：

```text
.artifacts/public-<完整提交SHA>/
  manifest.json
  README.md
  SHA256SUMS
  source/xui-source.tar
  tarballs/coffeehc-xui-{theme,runtime,react}-<版本>.tgz
  metadata/source-generation.json
  metadata/public-api.json
  metadata/consumer-validation.json
  metadata/performance-baseline.json
  metadata/consumer/{package.json,package-lock.json}
  validation/<显式传入的证据，保留原目录内部结构>
```

`manifest.json`是根索引，记录完整commit、version、sourceGeneration、三个包、源码及generation/API/consumer/性能元数据的相对路径和SHA256、publicApi.entries与证据文件清单；消费者package.json和锁文件摘要由consumer回执绑定。`metadata/public-api.json`保留既有`{entries}`格式，直接从归档三包的manifests和真实声明重新生成，包含ESM值与type名字，不复用可能过时的全局便利文件。`metadata/source-generation.json`记录sourceGeneration与有序sourceFiles；与构建共用同一算法：按路径排序，依次向SHA-256写入UTF-8相对路径及该文件原始字节，不加分隔符，等于包内build.json的sourceSha256。generation是构建输入身份，完整提交SHA另外固定全部文档、测试和示例。

所有文件摘要均为完整原始字节的SHA-256（JSON含结尾换行）。`SHA256SUMS`按相对路径排序，每行`<64位小写摘要><两个空格><相对路径>`，完整覆盖除自身外的全部文件，不允许遗漏、重复、额外文件、路径穿越或符号链接；其自身摘要由命令输出，避免循环自引用。

`pnpm archive:verify <归档目录>`可检查复制后的目录，不依赖当前checkout的源码、dist或消费者目录；需要已安装xui工具依赖及Git/tar。除逐文件摘要外，还重算归档源码的generation、检查source tar的commit、三包版本/stamp/精确runtime peer、真实公开声明、消费者回执/锁文件和peer单实例。手动重新计算摘要也不能掩盖API或generation错配。生成先在临时目录完成全部校验，最后原子发布；失败清理暂存目录，已有正式目录拒绝覆盖，交付后不再手动补文件。工具实现见[归档入口](../scripts/archive.mjs)，回归见[归档测试](../tests/archive.test.mjs)。

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
| 折线、柱状与饼图 | [charts-react](../examples/charts-react/app.tsx) |
| 多行操作、窄屏导航与阅读缩放 | [public-layout-react](../examples/public-layout-react/app.tsx) |
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

## 新接入与升级的统一执行流程

本流程适用于实施型新接入、升级和改造，先按下表选择范围；升级不能只替换包版本，也不默认重跑全部接入。主题生成仍按[主题专项](#主题css-与单-owner)，只读自查/评审使用同一适用清单记录现状，不因此取得修改授权。仅升级 xui 不授权修改后端、公共库、其他项目、业务协议或部署。

### 按影响选择执行范围

| 场景 | 页面和合同范围 | 验证与停止条件 |
| --- | --- | --- |
| 首次整体接入、明确的全量迁移 | 当前授权范围内所有实际页面、入口与已采用能力 | 走完整接入；每个实际实例和slot分别验收 |
| 版本升级、指定组件/页面改造 | 固定版本的合同差异及实际调用点决定全部受影响实例；保留已正确接线 | 只读相关章节，选择适用ID，运行必要构建/类型、受影响测试及产品页面/请求验收；相关检查通过后完成交付 |
| 只读自查/评审 | 用户指定或由差异确定的受影响集合 | 同样核对实例和slot，以现状、证据、缺口为完成，不实施迁移 |

完整接入细则仅在相应范围读取，见[skill按需参考](../.agents/skills/adopt-xui/references/full-adoption.md)。定向任务不重做未受影响的登录、菜单、主题、全部API或后端接线，不遍历整份清单给无关项逐条填不适用。共享主题、Shell、认证或构建入口确有变化时，按合同差异和调用关系加入所有受影响页面并说明原因；影响未查清不能假定无影响。仅StructuredLogExplorer升级走[专项流程](../.agents/skills/adopt-xui/references/structured-log.md)，与下文共用同一layout/slot、产物和报告合同。

同一构建的产物校验、peer单实例和共享入口证据可以验证一次、在各实例报告中引用；每页自身的slot、局部状态和请求接线仍分别验收。已有证据只有固定产物、项目构建、代码与环境仍适用时才复用。项目规则、实质变更或关联失败没有要求时，不机械重跑全套unit/browser、冷启动或无关模块回归；必要检查通过后进入交付。

### 卡片布局与登录读取恢复定向升级

4.2.31的Card动作组默认收紧，采用项目无需更换控件或写私有gap；按card-actions-gap继承公共主题，普通Toolbar不受影响。4.2.30及后续版本不要求启用新业务或恢复已删除的footerMeta。实际使用Card/CardGroup footer时按[Card合同](COMPONENTS.md#card)核对metadata/动作槽，执行CARD-FOOT-001～005；采用natural/document/workspace集合时补CARD-SCROLL-001；使用公共登录页的项目按AUTH-RECOVERY-001～002验证读取失败恢复及未知退出隔离。各项按实际使用范围执行，原服务/权限/数据owner不变，无需捆绑认证重接或全仓流程。正式包/peer证据同构建复用，但各页面的真实wheel、动作可达和恢复请求仍需实际验收。公共缺口交xui，禁止消费者私有CSS补丁。

### Toast 与复制及业务日志列表定向升级

升级到4.2.28及后续版本，或自查这些能力时，先按“当前到目标的合同差异 → 实际页面/调用点/运行入口 → slot与owner → 检查ID”选择下表适用行。三项分别判断，不因升级版本就强制执行全部三项；未使用的能力在范围摘要说明依据，不逐条遍历无关清单或新增业务/运行入口。共享TableContainer、主题或构建入口确有变化时，按[影响范围](#按影响选择执行范围)加入实际受影响实例，不因本表范围较小漏验累计差异。

| 实际命中范围 | 执行与取证 | 原合同与判定入口 |
| --- | --- | --- |
| 临时反馈触发点，或现有提示块出现/消失造成位移 | 盘点触发、显示、更新及自动/手动关闭路径，将临时通知接入同一公共Toast owner并移除竞争的流式提示块，持续状态和控件已有原位反馈保留所属slot。记录通知出现前、显示中和两种关闭后的正文几何、节点、滚动、焦点、草稿/选区及通知次数；不靠固定留白或隐藏正文消除位移 | [反馈归属](DESIGN.md#反馈位置与保留时间)、[通知合同](DESIGN.md#通知队列与视图合同)、[TOAST-005～006](ADOPTION_CHECKLIST.md#小控件与复合控件)；Provider/slot/计时/焦点接线改变时补同节TOAST-001～004 |
| 实际文本复制入口及其平台writer | 沿用公开ClipboardService/CopyController/Copyable或正式注入的平台writer，在项目真实入口以合成或已授权测试内容验证完整中文、多段、emoji/Markdown、重复复制及失败。先设不同种子再实际粘贴并全文比较，另核焦点、选区和滚动恢复；copied文字、mock writer或execCommand=true不能替代OS结果，不在生产代码加读回或记录敏感文本 | [剪贴板服务](PUBLIC_API.md#剪贴板复制服务)、[Copyable](COMPONENTS.md#copyable)、[STATE-COPY-001～002](ADOPTION_CHECKLIST.md#剪贴板复制逐项检查)；Copyable接线改变时补CTRL-012 |
| 已采用BusinessLogExplorer或getBusinessLogTable的列表展示 | 4.2.34使用列定义，普通列读原值，特殊展示用cell；旧字符串列和format*按组件迁移表一次替换，时间键为occurred_at，detail显式配置。额外字段进入queryFields，scope切换按同一Controller取消/清理。记录格式/语言/时区或列顺序更新前后的查询次数、原始详情/筛选参数、Controller与行/列节点、草稿/快照/焦点；验证分页、刷新、错误/权限和详情键盘关闭回焦，按钮及焦点环完整可见。只改列表展示不重新装配app/pages或loader | [列表展示合同与示例](COMPONENTS.md#业务日志列定义与查询-slot4234)、[业务日志请求](PUBLIC_API.md#业务日志)、[BIZ-LIST-001～008](ADOPTION_CHECKLIST.md#业务日志列表展示逐项检查)；实际更改服务接线时补BLOG-LIST/BLOG-DETAIL的REQ/OK/ERR |
| 已采用BusinessLogExplorer且支持运行中换语言 | 使用当前labels；默认模式options.labels也实时生效。保留原Controller/view和组件身份，禁止key=locale。逐一核对整页、已有反馈及在途状态文案，草稿/详情/页/快照/节点/选区/滚动和有效焦点保持，语言更新请求与取消增量均为零；不改原事件事实/请求参数 | [整页语言合同](COMPONENTS.md#业务日志整页标签热更新4229)、[BIZ-LABEL-001～006](ADOPTION_CHECKLIST.md#业务日志整页语言逐项检查)；同时改列表列/cell才补BIZ-LIST，改服务接线才补BLOG请求检查 |

复制按项目实际支持的HTTP、HTTPS或Desktop平台分别取证。普通HTTP且Clipboard API缺失时执行STATE-COPY-002的原生回退检查；仅支持HTTPS的产品不为本轮新增HTTP入口。库的macOS显式系统测试只证明其已验平台，其他平台须用自己的实际系统粘贴结果，不能把跳过或平台mock算通过。未使用BusinessLogExplorer不新增业务日志页，不把StructuredLogExplorer或程序异常数据当业务日志。

将适用行展开到每个受影响实例的[layout/slot矩阵](#逐页建立-layout-与-slot-映射)，运行项目必要的构建/类型和受影响回归，按[实际页面验收](#实际页面验收)覆盖相关主题、宽窄、长中文及两种200%放大。正式产物/peer校验同构建一次并引用；各页自身的连续性、系统复制和请求接线不能由库样板或其他页面代替。全部适用项有结论后按[交付条件](#交付与完成条件)结束；失败/未跑如实记录，公共组件/slot缺口按[归属规则](#接入合规与公共缺口归属)交xui，不在消费项目补丁。

### 确定范围与固定产物

1. 读取项目规则、已有设计/接入记录、实际入口与依赖，保护现有修改。列出范围内每个路由页面、嵌套视图、详情、表单和弹层，以及实际支持的 Web/Desktop/embed 构建入口；标明权限、领域 API、认证、路由、查询/缓存、草稿与提交 owner。多个页面共用组件仍分别列出实例，不能只选首页或代表性样板。
2. 记录当前与目标的完整源码 SHA、DESIGN/三包版本、正式归档 manifest、SHA256SUMS、sourceGeneration 和安装锁文件解析。按[正式归档](#正式归档的唯一入口)校验目标，优先安装已验 tarball，不假定 registry 已发布；核对正式 ESM/CSS/types/init、peer 单实例和零源码 alias。需要源码构建时使用任务指定的 xui checkout，遵循其项目规则与正式流程，不复制源码或借包构建修改公共库。
3. 对照固定版本的 [PUBLIC_API](PUBLIC_API.md)、[COMPONENTS](COMPONENTS.md)、[DESIGN](DESIGN.md)及[验证限制](VALIDATION.md)记录升级差异，检查现有用法是否受影响。新接入记录尚缺的接线；升级记录保留/迁移/移除及原因。已符合合同的实现保留并验证，不为升级重写业务或覆盖已有自定义主题。

### 逐页建立 layout 与 slot 映射

在代码改动前，为每个页面的每个实际组件实例列出：`内容 → 正式 API.slot/part → 文字/色彩角色 → 适用状态 → 滚动/焦点 owner → 检查 ID`。映射与验收共用[逐项报告模板](ADOPTION_CHECKLIST.md#每条检查的报告模板)，实施后填写实际与证据；不另造一份无法对照的总评。

| 页面区域 | 选择与归位 | 逐项入口 |
| --- | --- | --- |
| 全局框架与页头 | AppShell/MenuLayout 的导航、顶栏、pageHeader/pageToolbar/pageFooter；PageHeader 承接任务标题、真实状态与主要动作，空槽按合同处理 | [SHELL](ADOPTION_CHECKLIST.md#页面框架与具名-slot)、[SLOT](ADOPTION_CHECKLIST.md#每个页面和组件的-slot-矩阵) |
| 手动查询与即时筛选 | 手动提交用 QueryForm 的 fields/actions/advanced/summary，按内容为 QueryField 选择公开宽度角色；即时筛选用 SearchToolbar，不在外部工具栏与表内重复同组控件 | [查询合同与完整示例](#手动查询页接入4220)、[QUERY](ADOPTION_CHECKLIST.md#手动查询页逐项检查) |
| 创建与编辑 | Fieldset/Field/FormGrid/FormActions 分组、字段宽度、标签/帮助/错误关联和按钮对齐；长表单选择适用的页面/Sheet/Dialog 容器 | [表单与弹层](ADOPTION_CHECKLIST.md#表单数据表格和弹层) |
| 结果与详情 | 按任务选择 DataTable/CardGroup 等公开组合，工具、数据、反馈、真实计数/分页和页尾各归其槽；详情复用公开 parts，不嵌套竞争的表格外壳或多层装饰卡片 | [工具栏与卡片](ADOPTION_CHECKLIST.md#页面标题工具栏与卡片)、[卡片集合](ADOPTION_CHECKLIST.md#卡片集合逐项检查) |
| 文字、色彩与状态 | 标题/正文/meta/help/error/技术标识继承各自公共角色；真实状态才着状态色，加载/空/错反馈位于所属区域；不在页面逐个定字号、状态色或复制内部皮肤 | [TYPE](ADOPTION_CHECKLIST.md#公共文字槽逐项验收)、[加载位置](ADOPTION_CHECKLIST.md#组件内容加载位置) |

具体字段宽度、字体、间距、颜色、状态和响应式取值只引用上述固定版本合同，不把示例或 Stitch 单页数值另立为项目默认。保留宿主 Logo、品牌覆盖、用户主题/缩放偏好以及编辑器、Markdown、领域图形等专有能力；通过公开 props/slots/render/callbacks 组合，公共能力缺口按[归属规则](#接入合规与公共缺口归属)交给 xui。

### 实施与状态、请求接线

逐页完成映射后实施，清理本次公共能力替代的重复外壳、样式、listener 和状态 owner，保留业务权限与动作。公共控件复用既有实现与文字角色；主题和共享服务复用已有 owner，各独立组件按公开合同保留所属 Controller，不将多菜单或多视图状态合成全局单例。不复制示例的合成 loader 充当产品数据层，不另建 HTTP、认证、通知或查询状态体系。

按[刷新与身份清单](ADOPTION_CHECKLIST.md#刷新身份与生命周期)及各组件合同，区分未查询、首次加载、成功、空结果、首次失败、同范围刷新、刷新失败和范围切换。同范围刷新保留旧内容、稳定 key/节点、草稿、焦点与滚动；新范围隔离旧数据并取消/丢弃迟到结果。不得以整页 reload、先隐藏/卸载组件、随机 key 或无界自动重试实现刷新。手动查询的编辑草稿与已应用条件分别记录，业务时区、时间精度、起止顺序和窗口限制继续归宿主。

检查范围内页面级临时反馈的触发、显示与关闭路径，按[反馈位置与保留时间](DESIGN.md#反馈位置与保留时间)分清Toast通知与所属区域的持续状态、控件原位反馈；执行[Toast定向行](#toast-与复制及业务日志列表定向升级)取证。自动刷新不逐次弹成功通知；公共组件自身造成位移时列缺口交xui，不在消费项目补丁。

对采用的[16 个公共操作](ADOPTION_CHECKLIST.md#16-个公共-api-操作逐项检查)分别核对 REQ/OK/ERR：已有 BaseService facade 直接使用官方 client；未用 BaseService 的后端应一次实现同一 wire，不在前后端各加一层兼容转换。后端前置缺失时记录 owner 与未验项，不借 UI 升级授权修改后端；领域/第三方 API 保留合法 typed 边界。没有相应业务的公共操作按清单提供不适用依据，不为凑齐能力新增业务。

### 实际页面验收

本次命中的Toast、复制和BusinessLogExplorer列表，按[定向验收入口](#toast-与复制及业务日志列表定向升级)选择适用行；组件字段、通知归属和请求合同只由该行引用的原规范定义，不因验收重新实现公共组件或增加请求owner。

DataTable在4.2.26修正无纵向溢出时的滚轮陷阱，现有props/布局无需改变。按TABLE-SCROLL-001～003，在实际受影响页把指针放在表格内部测试上下滚动：无独立纵向范围时应滚动页面所属内容；固定高度表体仍内部滚动并保留首末边界；横向滚动不能拖动整页，sticky和键盘入口保持。不要在消费方转发wheel、覆盖私有overscroll样式或新增滚动容器。此升级不改变请求、认证或分页owner，库示例不代替产品页面复验。

运行采用项目的真实构建、相关测试及[逐项浏览器矩阵](ADOPTION_CHECKLIST.md#逐项浏览器验收矩阵)，逐页、逐实例、逐 slot 填证据。覆盖适用的 light/dark/system 及系统实时切换、桌面/窄屏、长中文、200%文字与真实浏览器200%缩放、键盘/回焦、弹层指针命中与滚动；界面比例、用户文字放大与真实浏览器 page zoom 分别记录，不能相互替代。各实际支持的构建入口分别检查，dev 页面不能代表嵌入产物或 Desktop。

用真实请求与权限验证数据、分页、错误恢复、取消和迟到丢弃；用刷新前/中/后的节点身份、几何、焦点、输入与滚动记录检查连续性。截图不能单独证明请求或生命周期正确，源码静态检查不能单独证明实际排版。xui 正式包示例、mock、DOM 存在或编译通过均不能替代产品页面验收；环境、数据或权限不足的场景如实记未跑。

### 交付与完成条件

采用[清单四种状态与报告格式](ADOPTION_CHECKLIST.md#使用与报告规则)，在项目既有接入记录中保存范围/页面/入口清单、固定产物身份、升级差异、逐页/组件/slot/API 矩阵、具体证据及责任 owner。报告同时列出保留的业务/品牌、移除的竞争实现和[公共缺口材料](#接入合规与公共缺口归属)；清单 ID 对每个实际对象分别判定，不只记录“模板已通过”。

适用失败项未解决或实际页面验收未跑时，不宣布完整接入/升级验收通过；交付已完成范围、失败/未跑项、依赖与后续 owner。公共缺口不由消费项目补丁规避，也不阻止继续完成与其无关的授权工作。全部适用项有结论后按项目规则交付代码；推送、发布和部署各遵循实际授权，不由本流程自动授权。

4.2.24公共链接默认无下划线，正式theme CSS统一覆盖Typography.Link、LinkedText、范围内原生a与Button link。升级后移除仅用于去下划线的项目补丁，保留真实href、外链属性及现有自定义主题；按CAP-010复验实际链接，不因样式变化改路由/业务API。

4.2.25登录交接失败修复无需改props、labels、认证协议或宿主回调：固定公共页失败后显示原登录按钮文案并保持禁用、退出忙态，只开放导航重试。按AUTH-UI-009在实际首次登录/会话恢复路径核对失败、重试等待、再次失败和成功，不以刷新后能进入代替首次交接验收；不要用CSS、假busy或第二Controller修正公共状态。

## 四类默认页面接入

项目启用管理员初始化、登录、业务日志或平台API Key业务且无已确认特殊要求时，按[默认完整页合同](COMPONENTS.md#默认完整页面与配套接线4223)采用现有整页，不只取原子控件重拼；配置app和pages，使用resolveDefaultPages投影，复用原HTTP/Auth/Controller和主题。品牌、标题、路由位置和公开slot属于正常配置。宿主注册路由并按真实服务能力/权限挂载，config不会自动启用业务或初始化管理员。

执行[skill默认页面专项](../.agents/skills/adopt-xui/references/default-pages.md)，只读本次命中的页面/配套API合同和检查ID；其它页面不重做。BaseService已有认证、Key、业务日志facade直接连官方client/adapter，不改method/DTO/凭据和错误，不在前端加兼容转换；非BaseService由后端一次实现正式wire，前置缺失记录owner，不借UI升级改后端。管理员初始化缺少统一HTTP合同，先用已有权威回调和同一AuthPage外壳；[可转发提示词](PUBLIC_REQUESTS.md#baseservice-管理员初始化合同提示词)交BaseService，不猜初始化URL。

特殊领域流程先用公开slot/controller/callback表达；仍有公共缺口列明场景、受限slot/接口和最小复现交xui。没有相应业务不挂假页面/生成假日志或平台Key数据。既有第三方SSO与领域协议保留真实owner，明确完整默认页未适用的原因及已验范围。按[DEFAULT-PAGE检查](ADOPTION_CHECKLIST.md#四类默认页面逐项检查)完成实际页面和请求验收，固定产物证据可共享，实例接线不可由样板代替。

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

设计或改造页面时，先按 [页面信息呈现方法](DESIGN.md#首屏信息架构与信息密度) 确定用户任务、关键事实、动作和披露顺序，按 [信息与交互决策](DESIGN.md#业务界面信息与交互决策) 判断信息位置、呈现时机、形态和任务容器，再按 [私有组合组件方法](DESIGN.md#项目私有组合组件的设计方法) 确定职责、状态所有者、输入/回调与容器边界。用 [组件手册](COMPONENTS.md) 和实际消费版本核对可复用能力，避免先堆组件再补信息层级。

项目可以组合 xui 控件并编写自身布局样式；公共控件的语义、状态、焦点与内部皮肤继续由 xui 负责。将公共基础缺口与宿主领域需求分开，保留已有业务能力及单一状态 owner。仅要求设计/评审时交付相应结论，不顺带实施页面、升级依赖或迁移后端；实施时按真实使用场景验证布局、异常、可达性和生命周期，不把主题生成当作页面设计完成。

可以直接请求：**使用 adopt-xui，按照项目 `docs/DESIGN.md` 和 xui 设计方法，设计当前任务的私有组合组件与页面信息呈现。** 稳定约定更新已有项目设计章节，不复制整份公共规范或另建组件设计文档。

业务界面设计规则已融合到唯一正式DESIGN，无需再同时阅读独立草案。逐项采用检查见[IA-001～012](ADOPTION_CHECKLIST.md#业务界面信息与交互决策)，之后继续各组件/slot/API检查；项目自己的DESIGN只记录业务差异和实际采用版本。未满足的公共能力明确列为owner=xui请求，宿主不复制组件或私有DOM/CSS，也不能据规范更新宣称页面已经通过。

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

通用规范最初取自 [xagent@29139f7843d9a79a9eca42892cb87da8f08f6320 的 docs/DESIGN.md](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/docs/DESIGN.md)，来源版本为 0.4.0。当前默认配色为 Violet 电光紫，规范版本 4.2.20，另有五套官方配色供项目选择；来源 SHA、可逆变更和受控 CSS 指纹由 [design-source.json](design-source.json) 记录，原始参考材料保留在 [Precision 来源](design-sources/precision-engineering-console.v1.txt) 与 [历史家族规范快照](design-sources/product-family-ui.0.7.0.txt)。历史指纹用于溯源，不代表当前实现已全部验收。

[生成器](../scripts/tokens.mjs) 从 DESIGN 的标记 CSS 提取产物并核对 token、依赖和来源；[合同测试](../tests/contract.test.mjs) 检查当前协议边界和原始规范逆重建。维护时同步当前合同元数据，保留历史来源与快照指纹。产品采用按 [ADOPTION.md](ADOPTION.md) 固定版本和自己的扩展，无需复制全文或历史实施流水。

## 开发联调与冷启动

`pnpm dev` 持续构建正式包和预览，`--packages-only` 只构建包；另运行 `pnpm preview` 提供页面。核对 `BUILD_SUCCESS <sourceSha256>` / `BUILD_ERROR` 与 `.artifacts/watch-status.json`，失败时保留旧完整代际。页面仍可打开不证明最新修改已构建，watch 不提供浏览器 HMR 客户端。

Vite 无法静态发现的懒加载深入口可能在首次访问时触发依赖重新优化和文档刷新。宿主按实际使用的公开入口设置 `optimizeDeps.include`，保留框架插件及 React/ReactDOM/Base UI 的 `resolve.dedupe`；不要全量扫描、禁 HMR 或等待固定时间掩盖原因。分别记录冷/暖 cache 的 optimizer/HMR 日志、主 Document 请求和 shell identity，区分文档刷新与同文档路由。可重复的合成对照见 [Vite 冷启动测试](../tests/cold-start/vite.test.mjs)，不能代替产品现场归因。

菜单从首次可操作时接同一 router owner。`canNavigate=false` 和缺少 adapter 都表示放行浏览器默认链接导航，不能当作路由 pending 的阻止开关；未就绪由真实 disabled 状态或已接管的 navigate 处理。保留修改键、中键、target/download、回退前进和宿主的滚动恢复，不以 route key 重挂整个 shell。

桌面导航收起/展开控件由AppShell/MenuLayout放在侧栏内部，窄屏在顶栏保留同一“打开导航”入口。宿主仅接既有collapsed/onCollapsedChange、sidebarOpen/onSidebarOpenChange及名称，不复制按钮或穿透DOM搬位置。1.3.0 将默认 `top` 控件放到全局品牌行末端；曾显式设置 `bottom` 的消费项目仍须按授权改公开 placement prop，升级不会覆盖该选择。不能将新规范当成已安装能力；见[导航控件](COMPONENTS.md#导航内部唯一收起展开控件)。

正式CSS的基础作用域必须落实：应用根容器（常用body）使用公开 `class="xui"`；弹层由公共组合生成 `.xui-layer`。基础border-box、字号和焦点规则作用于这些范围，单独import style.css但省略作用域不能视为完成接入。独立消费者不能依赖其他项目的Tailwind preflight恰好补齐缺失规则，也不能仅量外框就宣称Input/Textarea没有溢出；核对控件自身的box-sizing和实际边界。不要用私有宽度补丁替代这一公开前提。

卡片集合采用公开[CardGroup](COMPONENTS.md#cardgroup)：填记录、稳定key和Card配置模板，由集合负责实例、布局、局部状态及唯一分页/计数。不要把Card+Grid拼接视为已采用集合合同；不要在项目内补第二套集合加载/刷新骨架。状态和分页由同一个既有query/resource owner发布，业务数据、草稿与操作仍由宿主负责。


2.0.0 状态控制采用 [逐项双模式矩阵](COMPONENTS.md#状态所有权与-controller-模式) 与 STATE-OWNER-001～007、STATE-COPY-001。旧受控props仍有效；需要完整自定义交互时注入同契约Controller，不把value/onChange/handle当完整替换。服务页面区分旧 service controller 和 viewController，AuthClient、业务loader/adapter与权限仍归原owner。基础服务从 bootstrap/注册表获取，组件Controller factory仍按组件生命周期使用。复制统一使用 [runtime只写服务](PUBLIC_API.md#剪贴板复制服务) 或通过第二参数注入的平台writer，不新增前端传输适配/认证/查询层。3.0.0 的 Toast 注入完整 xui Controller，旧 Base UI manager 须换为 xui 工厂；不访问 peer 私有 store。逐项验证仍须以消费项目为准。

可选列宽拖动从4.2.10起使用DataTable.columnSizing及正式Controller；无需复制表头逻辑。完整style.css已含table-resize.css，采用critical或按需table.css的宿主须显式载入该可选分片。升级不自动为旧表打开拖动，也不保存列偏好；见[交互列宽](COMPONENTS.md#交互列宽调整)。

### 多导航范围与退出重载接入

菜单接线前先为每个范围填写[导航Controller作用域](COMPONENTS.md#导航-controller-作用域)的实例归属，再逐条验证NAV-OWNER-001～005。状态接口存在不等于独立范围已隔离；隐藏的keepMounted菜单同样计入，不在部署后靠DOM补丁补救。

认证按[未知退出与页面重载](PUBLIC_API.md#未知退出与页面重载)区分同owner未知退出、内部结果核验、用户普通登录、新Document初始化与bfcache恢复。按AUTH-LOGOUT和AUTH-RELOAD逐项记录实例/请求/状态/私密读取证据；不保留已移除的退出恢复按钮断言，也不把“无恢复弹窗”扩展为未提供的跨重载门禁。库规范澄清不代表产品已通过，仍按[逐项清单](ADOPTION_CHECKLIST.md)报告实际通过、失败和未跑。

### 自助改密接入

只在实际后端支持官方PUT /api/v1/auth/password时使用同一个AuthService.changePassword或公共PasswordChangeForm；禁止前后端各加一层翻译、备用URL、手写token读取或自动重试。复用现有NewPasswordFields；Dialog/Sheet保留挂载时传active=open，默认卸载与pagehide清密；业务回焦和重新登录目的地仍由宿主使用公开容器/RouteService接线。已提交与结果未知都不能再次写入来“核验”，后端全部会话撤销须在产品自己的真实链路验证。逐项按[AUTH-PASSWORD检查](ADOPTION_CHECKLIST.md)与[公共合同](PUBLIC_API.md#自助改密)，库级示例不等于产品升级完成。

4.2.14 应用结束从 `@coffeehc/xui-runtime/bootstrap` 导入 `disposeXuiServices(window)`，不为 teardown 导入全量 `/services`。窄屏导航和多行查询工具的实际验收按 TOOLBAR-005、NAV-SPACE-001～003 执行；升级不代表消费项目已通过这些页面检查。

### 可选公共能力接入（4.2.15）

四项为按需新增入口，保留既有调用，不要求其他项目立即升级。本轮不会通知消费项目必须升级，也不修改其页面。需要自动正文链接时用 `/display` LinkedText 或纯 `/text-links`（也在 UtilService）；需要标准通知组合时在既有 Provider 下放 Toast.View，按真实身份 generation 接 scopeKey，并先取消旧生产者、clear、再发布新身份。模块按 trusted build map 使用 `/loading` createModuleResource 和既有 useResource，在实际页面生命周期中销毁；绘图用 `/theme-colors` 借用现有 ThemeService，取消订阅及显式刷新样式表变化。

接口、scopeKey/clear 的先后顺序、CSS lease 与 ESM 不可撤销边界、sRGB/alpha/null 均见 [PUBLIC_API](PUBLIC_API.md#安全正文链接)。逐项检查 `CAP-*`，正式组合示例见 [public-capabilities-react](../examples/public-capabilities-react/app.tsx)。不为接入新增认证、HTTP/Resource/Toast/Theme 的竞争 owner，也不能用库的合成示例代替产品真实业务验收。

### 可选升级：导航揭示与宽度（4.2.16）

AppShell/MenuLayout 默认启用桌面 `sidebarRevealOnHover`，false 显式退出。它仅管理临时显示，不能据此写入 collapsed 或展开集合；原 Controller 仍唯一。宿主无需 DOM/CSS hover 补丁。阅读 [临时揭示合同](COMPONENTS.md#紧凑导航的临时揭示4216)，检查同一节点、草稿/滚动、弹层 Escape、页脚指针与键盘，窄屏仍用原抽屉。默认展开宽度改变，需保留旧宽度的项目可继续在根 Token 层覆盖公开 min/max/width。此发行不要求任何其他项目立即升级；库的正式包验证不替代项目实际页面验收。

4.2.17 提供可选透明文字动作：计划等内联折叠用 `Disclosure variant="text"`，宿主自有折叠状态的工具计数可用 `Button variant="text"`＋`DisclosureIndicator`，后者由宿主提供aria-expanded/controls。不修改组件私有背景，默认变体继续原样；见 [透明文字动作](COMPONENTS.md#透明文字动作4217)。不要求其他项目升级。

4.2.17 还提供可选 `NavigationMenu/MenuLayout variant="text"`、逐项 `NavigationItem.variant/tone` 与 `NavItem variant/tone`。需要透明会话导航时使用公开选项；warning 采用前景与指示线，不加软底，不染子项/配置动作。宿主只投射真实事实，使用公开 Label/装饰 Icon 和完整 aria-label，不复制导航 DOM/CSS。config.json 的 menu.items 可声明同字段。按 NAV-TEXT 逐项验收；见 [公共接口](PUBLIC_API.md#透明导航与警告前景4217)。本轮仍不通知或要求任何消费项目必须升级。

4.2.18 将 IconButton 与公开 Button data-icon="true" 的默认容器统一为圆形，各状态沿用radius-full；带文字Button不改变。升级时可移除产品在此公开标记上仅选择radius-full的临时覆盖，再按 CTRL-003 验收真实动作、焦点、禁用/忙态和各size。不要将带文字按钮误标为data-icon，也不扩展到头像或缩略图。本轮不通知或要求其他项目必须升级。

行内下拉（例如输入区模型选择）已有4.2.17的Button.text能力：采用 `Menu.Trigger render={<Button variant="text"/>}` 标准组合即可，不另写背景/品牌色CSS或菜单包装。其规范补充在4.2.18同步；普通表单Select/Input与宿主明确primary/destructive入口保留原语义。

4.2.18 的展开入口默认变化应按 EXPAND-001～006 核对：Menu.Trigger未自定义render、Disclosure默认标题、Accordion、SearchToolbar高级搜索与侧栏/表格内置展开都采用公共透明前景配方。业务自有区域仍接自己的状态与aria，显式主/危险render和普通表单不改。需要历史Disclosure背景时显式variant=default。标准作用于所有同类动作，不为每个模型、搜索或详情业务写一套CSS。

表格操作逐表统一Button/IconButton的variant=text；危险/删除用tone=danger，不能一组混用实心destructive或outline/primary来实现普通行操作。接线仍保留原权限、确认、禁用/忙态与业务owner；不要把所有text改成无危险前景的普通动作。4.2.18公共类型与正式CSS同步提供，无需消费者私有覆盖。

4.2.19统一紧凑Toast：标准View默认Icon—Content—Close，关闭为首行透明图标，不再撑出底部空行。高级parts优先同样组合，Actions只放真实动作；仅有Close的旧操作槽也自动同行。沿用原队列/5秒/-1/暂停/回焦，显式type才映射状态图标，不自动去重。无需私有CSS或改字号；按TOAST-LAYOUT-001在实际页面核对。此维护仍为可选升级，不通知其他项目必须升级。


### 手动查询页接入（4.2.20）

采用 [QueryForm/QueryField](COMPONENTS.md#手动查询页-queryform--queryfield4220) 后，逐一映射 pageHeader → pageToolbar.fields/actions/advanced/summary → DataTable body/toolbar/footer，不只检查组件 import。字段按 primary/compact/standard/full 角色，宽度、轨道底边、文字与着色由 [DESIGN 查询页合同](DESIGN.md#手动查询页布局与状态合同4220) 统一管理；宿主只填真实字段/动作与条件，不用私有样式补排版。手动查询不用等列编辑 FormGrid 平摊短枚举；高级编辑区仍用 FormGrid。

[完整查询页](../examples/query-page-react/app.tsx) 使用同一个原生 form、已提交条件与草稿分离、Resource 的同范围刷新/新范围取消代次、受控分页、详情回焦；模型数据为内存合成，未适配任何产品 API。查询前、加载、已查空、首次失败、有数据、刷新、刷新失败和提交新范围须按 [逐项清单](ADOPTION_CHECKLIST.md#手动查询页逐项检查) 在每个真实页面验收。没有真实total时传null，未确认时不造分页。刷新使用已提交条件，重置草稿不自动查询；保留产品现有HTTP/Auth和领域协议，不新增前端DTO适配owner。

4.2.20 为同一版本线的可选维护。新增接口可选，旧 SearchToolbar/EmptyState 默认布局保持；DataTable/CardGroup 在尚未确认数据时取消假0播报，可能改变该阶段的页脚显示。正式产物与公开包浏览器证据只说明库样例，不能代替消费项目真实页面验收；本轮不要求其他项目必须升级。

### 公共图表接入（4.2.21）

采用[LineChart / BarChart / PieChart](COMPONENTS.md#公共图表)时，先将已有后端/Resource结果投影为categories/series或slices，保留现有请求、缓存、单位、时区、范围隔离与权限owner，不复制示例loader。图表共用Card的title/description/actions/content/footerMeta/footerActions；按[图表清单](ADOPTION_CHECKLIST.md#公共图表逐项检查)逐页检查图例、绘图区、读值、数据表和反馈槽。已有自定义chart-color/axis/grid/文字Token覆盖继续继承；不在页面覆写私有SVG或另加一套图例/tooltip。窄入口按critical.css + chart.css加载，正式style.css已包含图表。

无图标导航的紧凑回退见[组件合同](COMPONENTS.md#无图标紧凑导航)，不要求产品补占位图标；真实名称和显式图标保持宿主事实。

### StructuredLogExplorer 查询组合（4.2.22）

升级完整Explorer执行[skill专项](../.agents/skills/adopt-xui/references/structured-log.md)，只覆盖实际使用页面及必要共享回归，不展开为整项目迁移。采用库内QueryForm及其fields/actions/advanced/summary，不在宿主再做一套筛选/DTO adapter。页级辅助内容传pageToolbar，标题动作传headerActions；按[组件动作矩阵](COMPONENTS.md#structuredlogexplorer-查询与槽位4222)验证各slot。原controller/options/viewController接法和唯一请求owner保持，缺少跨组records的项目继续省略该能力。

逐页分别验证：编辑与“重置草稿”零请求、恢复最近提交条件且保留游标/结果；“清除筛选”明确提交空范围并产生一次当前视图查询；刷新仅用已提交filter而不提交草稿。提交新条件清旧范围并隔离迟到，取消/错误/详情回焦沿原Controller。不能以按钮旧名称认定HTTP故障，也不能把“清除已生效筛选”改名“重置”后仍请求。库示例仅是正式包验收，产品仍须固定产物并验收自己的页面和API。

### 纯图标动作密度定向升级

4.2.32调整所有IconButton及Button data-icon=true的公共视觉圆面和焦点，保留原target、glyph、props与动作owner。按[ICON-ACTION-001～006](ADOPTION_CHECKLIST.md#纯图标动作紧凑呈现逐项检查)验收实际使用的工具栏、表格、Card槽及弹层，不能只验卡片。无纯图标实例时不执行此专项；正式包/peer证据同构建复用。保留自定义主题，通过已有公共Token继承；不在消费方复制按钮、添加wrapper或私有CSS缩圆，不把Card头部tile误改。公共验收不代替产品实际页面，也不要求无关认证/日志全流程重跑。

4.2.33补齐组合内部覆盖：SearchToolbar/QueryForm的actions与advanced、SidebarFooter直放或行内图标须分别执行ICON-ACTION-005；workspace edge/ScrollArea inset、顶栏/侧栏及Dialog嵌套另验ICON-ACTION-006，不能用独立按钮或Card截图替代。使用固定正式版本验收，消费方不补padding/圆角/居中CSS，也不因修外观重接查询或导航owner。


### 组合数据表格定向升级（4.2.36）

BusinessLogExplorer、StructuredLogExplorer、ApiKeyManager 和 Chart 数据视图均已由 DataTable 统一表体、行、状态与列宽调整。组合默认启用业务数据列手柄，内置详情/操作列固定；宿主继续使用原领域 Controller、过滤/分页与详情接线，不将请求移入 DataTable。库不提供“重置列宽”按钮。宿主自己的表格应使用公开 DataTable、显式 `columnSizing`，固定操作列用 `resize:false`，移除宿主自建的重置列宽按钮。

需要列宽偏好时直接向组合传 `columnSizing` 的受控或注入配置，不新建第二个列宽 owner。业务日志用 `list.columns[].resize`；结构化日志用 `columnOptions` 的稳定语义 id 指定宽度/上下限，actions 仅固定。接口与 id 见[公共契约](PUBLIC_API.md#组合表格列宽4236)。只使用完整 style.css 时无需增加 CSS；按分片使用 table.css 的项目须同步加载 table-resize.css。

按 TABLE-COMPOSE-001～004 验证实际使用页面：调整零请求且不变页/重挂已有行、刷新保留宽度、固定操作列没有手柄且不随其他列变宽、分组/记录切换和详情回焦保持。窄屏/大字在表体内横滚、单元内容不覆盖相邻列，筛选/空态/错误/重试/权限仍按原页面验收。库示例通过不等于消费产品已接入或部署。


### 图标背景统一升级（4.2.37）

固定 4.2.37 的同代 ESM/CSS/types/init 后，所有默认 Card/CardGroup tile 图标背景自动变为圆形；IconButton、复合图标动作、紧凑导航与 Avatar 使用同一基础形状规则。默认图标背景统一32px（根字号200%时64px），仅显式size/卡片size覆盖例外。Button原36px命中区不缩小；输入辅助动作使用至少32px命中宽度；Avatar默认直径同步基础尺寸。原无背景glyph保持无背景，普通文字按钮和完整导航行保持原样。不要逐资源类型覆盖 Card 内部圆角，也不在宿主再建一套背景容器。

确有方形用途时，Icon/IconButton/Button/Avatar.Root/InputGroup.Button 显式 shape=square，Card/CardGroup 模板显式 iconShape=square；高级 parts 或原生容器用公开 data-icon-shape=square。真实头像继续 Card.iconVariant=plain 并使用同一个 Avatar；它拥有自己的形状，不通过外层 Card.iconShape 裁切。Card 原 size/background Token 覆盖保留；新的 icon-container-size/background 可统一基础 tile，既有自定义主题不被替换。

按 ICON-BG-001～004 验证实际使用页面的所有资源类型、图标按钮/组合槽、输入辅助动作和紧凑导航：默认圆形、显式方形、无底色 glyph、主题/窄屏/大字、原尺寸/颜色/焦点/回调及 Card 草稿/记录身份。库级正式消费者证据不代替消费产品升级、真实页面验收或部署。
