# 通用前端基础能力与验收

基础扩展历史基线为 `06946db8de1341c14960a1e5b9cc6252a56c37aa`；最终范围、审查和验收见 [FINAL_REVIEW.md](FINAL_REVIEW.md)。唯一完整视觉规则仍是 DESIGN.md；这里定义实施覆盖、宿主边界与可执行验收。本轮检查及独立审查通过后已获向 xui main 正常推送的明确授权；包发布与部署不在授权中。

## 能力覆盖矩阵

| 能力 | React 正式接口 | 原生宿主契约 | 验收 |
| --- | --- | --- | --- |
| 页面骨架 | AppShell、PageHeader、Toolbar、Section、Container、Stack、Grid | 同名 `.xui-*` 结构类、shell 控制器 | 列表/表单/详情组合；独立安装无需示例私有 layout.css；窄屏导航开关、Esc、回焦点 |
| 基础操作与字段 | Button/IconButton、Field、原生输入/选择/checkbox/radio/switch、Fieldset | 真实 button/link/label/input/fieldset | render/nativeButton/link 支持、ref、disabled 与 aria-busy 独立、单控件 id、错误关联、键盘 |
| 复合选择 | Select、Combobox，复用 Base UI | 原生 select；可搜索选择采用原生 datalist，限制写清 | controlled/uncontrolled、禁用、空选项、键盘选择与取消；不宣称原生 OS 面板由库控制 |
| 导航 | Nav、Breadcrumbs、Pagination、Tabs、Disclosure | 原生链接/分页、tabs/disclosure 控制器 | 所属状态、独立 focus、RTL/Home/End、disabled 跳过、事件取消、controlled、无路由所有权 |
| 弹层与帮助 | Dialog、Menu、Popover、Tooltip、Toast | dialog、popover/menu/tooltip 与通知控制器 | 取消、外点、焦点、命中、长内容、状态反馈；非模态不 trap，关键错误不能只在 tooltip |
| 结构表格 | Table/Caption/Head/Body/Row/HeaderCell/Cell、SortButton | 原生 table 与排序按钮状态 | 表头语义、横滚、排序由宿主、选择不丢；不内置表格查询/虚拟化引擎 |
| 反馈状态 | Skeleton、Spinner、Progress、Badge、Loading/Empty/ErrorState、DataRegion、RenderBoundary | 相同样式、role/status/aria-busy、明确 retry/cancel 按钮 | initial loading/refresh/ready/empty/error/retrying 区分；刷新失败保留旧内容；渲染异常与 Promise 失败分别测试 |
| 主题 | 复用单 owner，useTheme hook | runtime/theme、首屏 init | light/dark/system；controlled 不碰 storage；mode/effective 分离；JSON 由宿主桥接；销毁重建无泄漏 |
| 加载生命周期 | useResource + DataRegion（不发请求） | runtime/loading 的受控 resource | 首次失败重试、刷新失败、A 慢 B 快、换 key、取消/卸载、忽略不合作 Abort；无自动重放写操作 |
| 产物与性能 | 子入口 + 真正 dynamic import 的参考面板 | 同等 ESM 动态面板与必要 CSS 按需 | Button-only metafile 无 Dialog/Tabs 实际贡献；字节/gzip 门禁；冷启动/受控延迟关键元素可见、位移与资源记录 |
| 本地联调 | built exports / 宿主 peer 单实例 | built CSS/runtime | watch 覆盖 DESIGN、CSS、TS/TSX、types、init；错误后恢复；失败不冒充新构建 |

矩阵中的正式接口和参考组合均已实现；验证结果在 FOUNDATION_VALIDATION.md 按能力记录，源码存在不等于验证通过。复合选择的原生入口采用浏览器原生 select/datalist，而不是承诺两个宿主使用同一种面板实现。

## 组件层次与扩展原则

xui 按 **原子→组合→页面** 提供同一前端体系。这是贡献与采用的架构准则；完整通用视觉/交互规则与默认 token 来源仍仅为 [DESIGN.md](DESIGN.md)，本节说明真实实现如何分层，不复制另一套皮肤规则。

| 层次 | 当前公开实例 | 采用与扩展 |
| --- | --- | --- |
| 原子 | Button/IconButton、Input/Textarea、Checkbox/Radio/Switch、Field、Alert、公共 CSS | 直接采用公开 props/ref/render、标准元素和语义 token；图标按钮使用共享 IconButton，不新增竞争按钮/输入基础包 |
| 组合 | MenuLayout/NavigationMenu、公共 Toolbar/Grid/Table/DataRegion、Dialog/详情布局、HTTP/query/controller | 组合原子提供通用键盘、状态、反馈和布局。Table 不抽查询引擎，query 不抽领域业务；状态与后端 adapter 通过明确公开合同连接 |
| 页面 | ConfigurableLoginPage/createLoginPage、ApiKeyManager/createApiKeyManager、BusinessLogExplorer/createBusinessLogExplorer | 填文案/品牌数据、选项、adapter/loader 与 callbacks 即可整页使用；页面内部复用下层相同控件与皮肤，业务不必手写页面 CSS |

普通需求优先完整页面或组合；特殊业务可用公开扩展点或组合基础控件。允许声明的 props/render/parts、受信任 renderer、数据配置和 callbacks；不依赖内部 DOM/伪元素或覆写内部皮肤。上层不得复制下层的状态、focus/motion/disabled 或默认色值 owner；缺能力先反馈或补公开接口，再补验收。全部实际入口与默认值见 [PUBLIC_API.md](PUBLIC_API.md)，不能把规划的注册/SSO/完整用户管理列作已存在页面。

统一 API 数据合同让 UI 与自动化消费同一业务能力，领域流程、权限/tenant与校验保持在可独立测试的业务 API/后端。xui 提供界面、通用请求及正式 DTO/adapter 接口；baseservice 独立提供后端能力，经版本化 HTTP facade 组合，不能向前端暴露数据库模型。登录已定义固定 v1 三路由，但后端适配未实施；API Key和业务日志定义固定原生HTTP facade与默认adapter/loader，索引见[PAGE_APIS](PAGE_APIS.md)，真实服务未集成。不因等待后端阻塞 xui，也不自动改其它项目。

后续逐页采用 xui，并行完善 baseservice，再逐项目替换后端 adapter，按版本/固定 SHA、DTO 与真实业务/页面回归小步升级。贡献验收须给出所属层次、复用下层的证据、实际公开扩展与构建消费；合成页面通过不能当作完整基础系统或产品迁移通过。此设计哲学由本节作为单一架构源，README、采用手册和 skill 引用这里。

## 分步实施状态

目标是引入 xui 后，通过公开组件与共享数据、状态、回调构建普通页面；特殊需求组合基础组件。内部结构、选中皮肤、motion、focus/a11y 由库默认提供，不要求产品复制伪元素或内部 CSS。主题、加载、导航接入和 HTTP 错误应有一致的公开契约；领域业务与可见菜单过滤由宿主负责。

| 步骤 | 当前状态 | 接口与验收 |
| --- | --- | --- |
| NavItem 语义与链接组合 | 本地实现，验证结果随提交交付 | 省略 selected 保留 aria-current，显式 selected 优先；公开 render 组合一个链接，默认选中样式；ref/事件合并、disabled、修改键/中键/target/download |
| 数据驱动 Menu + Layout | 已实现；本步骤独立验证与提交 | NavigationMenu/MenuLayout 与 createNavigationMenu/createMenuLayout；React/原生同源数据，一次 activeId/location 与导航适配；分组/子项/展开/紧凑/窄屏、键盘、更新与生命周期、导航时 shell 身份稳定 |
| HTTP 与共享列表契约 | 已实现，本步骤独立验证 | 零框架传输、显式模式/response adapter、错误/status/Abort/timeout、默认不重试；共享列表默认 Go ListData 的 list/total，HTTP 保留原样 payload；来源与实现同步记录 |
| API Key 通用管理组件 | 已实现，本步骤独立验证 | 共享安全元数据、列表/创建/权限与有效期/一次性结果/明确复制/撤销确认；不生成真实密钥，不复制产品权限模型，后端生成与鉴权，默认脱敏与不持久化 |
| 可扩展业务日志 | 已实现，两宿主独立消费 | 固定公共字段 + event_type/schema_version + 业务 JSON payload；list/detail loader、过滤/cursor/权限/安全回退/注册 renderer；默认原生HTTP adapter已实现，真实后端未集成，见 [BUSINESS_LOGS](BUSINESS_LOGS.md) |
| Sheet/AlertDialog/ContextMenu与表格扩展 | 已实现，最终统一验证见交付 | 复用Dialog/Menu/表格原子，公开逻辑side、cancel/focus、条纹/展开/sticky，见[COMPOSITIONS](COMPOSITIONS.md) |
| 下载与默认页面HTTP | 已实现，最终统一验证见交付 | safe headers/filename、显式保存、原生JSON协商与正式API Key/业务日志facade |
| 可配置登录页 | 已实现，本轮完整验收后交付 | ConfigurableLoginPage/createLoginPage +共享认证 client；固定 v1 cookie login/logout/session、公开品牌文案与safe returnTo；[AUTH](AUTH.md) 明确真实源差异与后端责任 |
| 独立结构化错误观察 | 已实现，只读独立步骤 | 共享控制器、React/原生完整分组/观察/详情；依据固定 commons@b0bc0f9 的真实 filter/cursor，计数/首次代表/三态/保留期明确；[拟议 v1 facade](LOGS.md) 由宿主后端实现，不猜旧协议 |

菜单/布局、HTTP、业务日志与配置登录都是用户明确扩展的范围；本轮全部功能、手册、skill 与统一验收完成后正常推送 main。HTTP/query、API Key、业务日志、登录页、独立错误观察及 [接入 skill](../.agents/skills/adopt-xui/SKILL.md) 已实现；最终交叉验收见 FINAL_REVIEW。框架不实现产品 endpoint 后端、权限判断、业务 router 或数据引擎。采用产品的业务 API 保持完整并可独立测试；UI 通过相同 API 提供观察、配置和介入，核心流程不放进组件。

## 加载与性能实施

通用要求见 DESIGN.md 的“通用加载、主题所有权与构建消费”；本仓库参考页面的首屏关键标题、事实与主操作先渲染，必要 CSS 先加载；非关键面板由用户触发真正 dynamic import，并单独加载其可选样式。状态区域预留稳定空间；刷新保留旧内容，失败和取消即时可见。显式重试加载只用于宿主确认可重试的读取或模块构造，不自动重试任何操作。超时预算、请求、身份/对象 key、业务幂等与结果校验由宿主决定。

resource 按单 owner 的 request generation 隔离结果。Abort 是协作信号，不能保证停止服务端或 Promise；迟到结果必须被 generation/key 拒绝。换 key 清除旧对象内容，刷新同 key 保留旧事实。React render error 由 RenderBoundary 处理，不能用它代替 Promise rejection 处理。

按需消费必须看最终 metafile 的 bytesInOutput，不以 sideEffects 标记代替证明。Button-only 门禁先排除无关 overlay/tabs 模块贡献，另记录 minified/gzip；完整消费者记录初始资源与可选面板资源、关键锚点位移。门禁针对合成参考消费者，不能宣称产品生产 LCP/INP 达标。

## 明确留给宿主

业务路由与领域接口、权限策略、身份凭据、缓存/查询、防抖、交易、会话、表格引擎、虚拟化、图表数据、复杂富文本/代码编辑器和 3D 引擎由宿主负责。通用 HTTP 传输与可配置认证/错误适配已实现，不等同于接管产品认证业务。SSR hydration、真实移动 OS 面板、读屏器和产品生产性能必须由采用项目另验。

接入门槛：公开布局与组件真实消费通过；原生不加载 React；主题单 owner 和旧 CSS 层级映射明确；双仓 watch 可恢复；同一最终代码版本标准 verify 和独立审查完成。不得用参考消费者通过替代产品迁移通过。
