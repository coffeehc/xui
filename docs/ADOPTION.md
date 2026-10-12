# xui 使用与迁移手册

这是接入入口，引用同一份规范、公开类型和已运行的例子，不另定义品牌默认值。当前包为 private 0.1.0；采用前固定 Git SHA/本地 tarball 并核对 [全部公开入口与默认行为](PUBLIC_API.md)。菜单布局、HTTP/query、可配置登录页、API Key 管理和可扩展业务日志已实现；默认API Key/业务日志HTTP adapters已实现；真实认证、密钥、业务日志服务尚未集成。此前结构化错误查询是独立错误观察能力，不是业务日志。Codex 流程见 [adopt-xui](../.agents/skills/adopt-xui/SKILL.md)，随仓库 checkout 使用，没有安装到用户电脑或全局 skill 工作区。

xui用于统一品牌、前端体系和通用前后端接口。采用项目应在自身授权范围主动使用原生commons/webfacade和httpx标准化前端API；旧协议adapter仅作注明来源、映射、目标与移除条件的临时桥梁。必须遵循的协议、默认HTTP adapters和领域扩展边界见[页面API总索引](PAGE_APIS.md)。不能以保留旧协议为长期架构目标，也不能因此削减业务能力、鉴权或已上线xAgent的升级保护。

## 阅读顺序与架构职责

1. 检查 git status、当前提交、包 manifests/exports，保护本地改动后按任务授权正常 fetch。读清版本差异，不 reset/clean/强推，不覆盖业务修改。
2. [DESIGN.md](DESIGN.md)：唯一完整规则与默认 token 来源。
3. [原子→组合→页面的设计哲学](FOUNDATION.md#组件层次与扩展原则)：单一架构源；[IMPLEMENTATION.md](IMPLEMENTATION.md)：入口、主题 owner、组件 props/部件、原生公共结构与 lifecycle。
4. [NAVIGATION.md](NAVIGATION.md)：菜单数据、MenuLayout 与一次路由适配；[PAGE_APIS.md](PAGE_APIS.md)：页面默认合同与原生标准；[HTTP.md](HTTP.md)：传输/错误/下载/Go 响应/query；[AUTH.md](AUTH.md)：固定认证合同与配置登录页；[API_KEY.md](API_KEY.md)：脱敏列表/创建/一次性结果/复制/授权确认/撤销/删除管理记录；[BUSINESS_LOGS.md](BUSINESS_LOGS.md)：业务日志公共 DTO/loader 与扩展 payload；[LOGS.md](LOGS.md)：独立错误分组/观察/详情与拟议 facade。
5. 下方可运行源组装页面；能力、验收与未跑项见 [FOUNDATION.md](FOUNDATION.md)、[FOUNDATION_VALIDATION.md](FOUNDATION_VALIDATION.md)。规范权威迁移另见 [MIGRATION.md](MIGRATION.md)。

theme 提供无框架预构建 CSS/tokens；runtime 提供主题、DOM、resource、菜单、HTTP/query、认证与共享页面控制器；ui-react 复用共享类型和 React/Base UI peers。按上述三层准则，普通页面通过数据、配置和公开扩展接口使用完整页面/组合，特殊业务组合基础控件；不修改组件内部渲染。产品保管可见菜单过滤、路由、身份、领域权限/数据与业务动作；xui 提供默认结构、交互、motion、focus/a11y。产品迁就统一标准，业务扩展通过公开 slots/render/adapters，公共能力不足反馈 xui。

采用产品以 agent-ready 为优先：业务 API 完整、明确且可独立测试，UI 消费同一能力，只作为用户观察、配置和介入的入口。领域执行、权限、租户隔离、校验与核心业务流程属于宿主服务/领域层，不藏在组件内部，也不因组件替换而消失。xui 提供表现、交互和通用请求接入，不能成为业务 API 能力的唯一入口。这是接入职责，不增加本轮后端改造、Agent SDK 或其他产品仓库修改范围。按最新用途，BusinessLogExplorer是调取业务记录的查询页；baseservice后续将业务日志收敛到日志能力并取消独立auditservice，本轮不修改后端或等待这次改造。未来 baseservice 的 API Key、业务日志与运行配置通过版本化 HTTP DTO 和契约测试配套，数据库模型不直接暴露；API_KEY与BUSINESS_LOGS已定义固定HTTP facade及默认client，领域扩展保留typed adapter入口。本轮没有运行配置组件或后端实现。

## 最小运行与固定产物

仓库根执行真实脚本，工具版本见 packageManager/lock：

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test:consumer
pnpm preview
```

访问 /capabilities-react/、/capabilities-vanilla/ 侧栏/确认/右键菜单/表格/下载与默认页面HTTP，/menu-react/、/menu-vanilla/ 最小菜单，/http-react/、/http-vanilla/ 标准查询页，/login-react/、/login-vanilla/ 配置登录页，/api-key-react/、/api-key-vanilla/ 管理组件，/business-log-react/、/business-log-vanilla/ 业务日志，/log-react/、/log-vanilla/ 独立结构化错误查询，/foundation-react/、/foundation-vanilla/ 列表/表单/详情与动态加载。浏览器检查使用已有 Chromium，或 pnpm exec playwright install chromium。没有部署/发布操作。

test:consumer 将三个包 npm pack，在每次新目录安装 tarball，再从正式 ESM/CSS/types 编译和打包；原生不安装 React，React peers 单实例。生产接入也固定已验证提交，先构建并安装本地 tarball；包尚未发布，不默认填写不存在的 registry 版本。无 monorepo package src alias 或下游 Tailwind 扫描要求；菜单/HTTP/登录/API Key/日志/错误观察/foundation 示例只消费公开 CSS，最初 vanilla/react 示例保留自身页面 layout.css，它不是库所需的样式依赖。

完整可运行代码由正式 consumer/typecheck/browser 检查，直接参考公开调用：

| 宿主 | 菜单 | HTTP 标准页 | 列表/表单/详情 |
| --- | --- | --- | --- |
| React | [app.tsx](../examples/menu-react/app.tsx) | [app.tsx](../examples/http-react/app.tsx) | [app.tsx](../examples/foundation-react/app.tsx) |
| 原生 | [app.js](../examples/menu-vanilla/app.js) | [app.js](../examples/http-vanilla/app.js)/[HTML](../examples/http-vanilla/index.html) | [app.js](../examples/foundation-vanilla/app.js) |
| 共享数据/协议 | [菜单 JSON](../examples/shared/menu-data.json) | [typed endpoint model](../examples/shared/http-model.ts) | 领域事实归宿主 |

API Key 完整消费为 [React](../examples/api-key-react/app.tsx)/[原生](../examples/api-key-vanilla/app.js)，共用 [typed 假数据模型](../examples/shared/api-key-model.ts)，完整值只有一次性结果，不放进 metadata/resource/cache。

登录整页消费为 [React](../examples/login-react/app.tsx)/[原生](../examples/login-vanilla/app.js)，共用 [品牌与文案配置](../examples/shared/login-config.json) 和 [合成认证模型](../examples/shared/login-model.ts)。只接一个 theme、HTTP 与 auth owner；baseURL 由宿主传入，固定 v1 login/logout/session 合同见 [AUTH](AUTH.md)。现有 xAgent token/me/state 协议需要后端明确适配，不能直接把旧 bearer/JWT storage 搬进组件。已上线xAgent缺facade时先保留既有认证并采用其它公开页面，真实后端合同就绪后按升级方案切完整登录页；未发布项目直接使用新合同，不增设旧认证兼容层。改baseURL不能替代协议迁移。真实 Cookie、CSRF 和权限由服务负责；示例不会签发真实会话。

业务日志完整消费为 [React](../examples/business-log-react/app.tsx)/[原生](../examples/business-log-vanilla/app.js)，共用 [typed fake loader](../examples/shared/business-log-model.ts)。固定公共日志事实 + event_type/schema_version + 允许披露的业务 payload；按类型/版本注册 renderer，未知版本安全 JSON 回退。真实日志可靠性由服务负责，合同见 [BUSINESS_LOGS.md](BUSINESS_LOGS.md)。

独立结构化错误完整消费为 [React](../examples/log-react/app.tsx)/[原生](../examples/log-vanilla/app.js)，共用 [typed fake facade](../examples/shared/log-model.ts)。按真实 cursor/query 语义展示累计/命中数与首次代表，只有单记录授权读取返回详情；拟议协议和宿主实现责任见 [LOGS.md](LOGS.md)。

## 主题、CSS 与单 owner

首屏 init 在 CSS/内容之前，应用复用 window.xuiTheme，不另建 matchMedia/storage/context 竞争状态。mode 是 light/dark/system 选择，effective 是浅深结果；受控选择经宿主确认，不隐式写 storage。React useTheme 只订阅，原生释放订阅/owner 边界明确。

选择一次 style.css 或 critical.css 加可选分片；默认值只来自 DESIGN。tokens 的 design-defaults→product-overrides→design-accessibility 与独立 xui-components 层按 [实施说明](IMPLEMENTATION.md) 加载。少量语义覆盖参考 DESIGN 的既有变量与示例，不复制全色板、不创建缺失 var、不在 JS 中维护颜色或抵消 reduced-motion。

旧未分层普通 CSS 优先级高于分层声明。先确认其业务/布局职责，再移除重复、明确分层或改公开组合并查 computed style。清理针对内部 DOM/伪元素的 selected/hover/focus 竞争皮肤，不能以导入放最后或私有选择器补丁冒充采用。

## 组件、数据与扩展点

下表是组装选择，详细公开 props/部件以 [IMPLEMENTATION.md](IMPLEMENTATION.md) 及固定提交 types 为准，沿用宿主标准 React/原生元素数据，不另造统一业务 schema。

| 公开能力 | 数据与状态 | 默认行为/扩展 |
| --- | --- | --- |
| MenuLayout/NavigationMenu | NavigationItem[]、activeId/location、一次 navigation/matchLocation、header/children | 默认菜单、选中/展开/紧凑/键盘/drawer；renderLink/renderLabel 与受控回调 |
| AppShell/Container/Stack/Grid/Toolbar/PageHeader/Section | sidebar/header/children、title/description/actions/meta | skip link/响应布局；低层 AppShell 用于自组 sidebar，不叠加第二个 MenuLayout owner |
| Button/IconButton | 标准 props、disabled/aria-busy、onClick、图标按钮名字 | type=button、键盘/focus/motion；公开 render/ref，busy 与防重复分别控制 |
| Field/Input/Textarea/NativeSelect/Fieldset/Checkbox/Radio/Switch | label/controlId/name/value/checked、help/error/required/readOnly | 单 id/描述与分组关联；复合输入显式 controlId，保留标准事件 |
| Select/Combobox | peer generic items/value、受控回调、公开 Root/Trigger/Input/List/Item/Content | peer 选择/搜索/键盘/取消，xui 皮肤；原生 select/datalist 的 OS 差异明确 |
| NavItem/Breadcrumbs/Pagination/Disclosure/Tabs | 当前项/页码/open/value 与内容 | page 选中、受控确认、disabled/RTL/方向键；Tabs 为实际 Root/List/Tab/Panel 部件 |
| Dialog/Sheet/AlertDialog/ContextMenu/Menu/Popover/Tooltip/Toast | open/value、内容/执行回调、finalFocus，Toast manager | 公开部件/Content/positionerProps；模态/外点/Esc/回焦点；Tooltip 只放说明 |
| Table/TableContainer/TableCaption/TableHead/TableBody/TableRow/TableHeaderCell/TableCell/SortButton | 行/列/单元内容、scope/aria-sort/selected | 独立导出、原生 table 与命名滚动区域；排序/分页/选择由宿主，不是 rows/columns 引擎 |
| Surface/Alert/Badge/Skeleton/Spinner/Progress | children/tone/标准元素状态 | 默认层级/role/status/motion，必要事实持续可见 |
| DataRegion/LoadingState/EmptyState/ErrorState/RenderBoundary | busy/value、反馈、retry/cancel 与 render fallback | 刷新保留旧值，错误即时可见；render 异常与异步失败分开 |
| ApiKeyManager/createApiKeyManager | 一个共享 controller、metadata/声明权限和有效期、领域 adapter | 脱敏列表、创建/一次性结果、明确复制/撤销确认、关闭竞态；labels/React headerActions |
| ConfigurableLoginPage/createLoginPage | 一个共享 auth/theme owner、品牌/标题/说明/logo/labels、安全 returnTo、onAuthenticated | 完整字段/错误/防重/取消/主题/登录退出与会话核对；固定路由与 DTO，密码不进 URL/storage/log，无隐式旧协议猜测 |
| BusinessLogExplorer/createBusinessLogExplorer | 一个共享 controller、公共日志字段、显式 list/detail loader、独立领域 JSON payload | 只读日志表格/过滤/授权详情、cursor 快照、文本回退/注册 renderer；不承诺日志写入可靠性 |
| StructuredLogExplorer/createStructuredLogExplorer | 一个共享 controller、明确 v1 DTO/facade、filter/cursor、详情权限与保留期 | 只读分组/观察/详情、缓存已访问摘要段、持续错误/取消、普通文本；labels/host Ref mapping/React headerActions |
| theme/resource/HTTP/query | 单 owner、key/loader/Abort/预算、endpoint adapter/query contract | 共享类型/终止/迟到隔离，默认不重试，401/403 分开，list/total 和基数明确 |

标准列表页为 MenuLayout→PageHeader 主操作→Toolbar/Field 筛选→DataRegion→TableContainer/Table→Pagination。筛选/排序重置该 endpoint 第一页并取消旧请求。cursor 业务日志/错误观察页使用各自完整公开组件，不套此 Pagination 页码或杜撰 total。表单页用 PageHeader/Fieldset/Field/公开控件，值、保存权限、防重复由宿主，必要错误关联并回焦点。详情页用 Breadcrumbs/Section/Surface/公开文本结构，敏感明细按授权加载，不执行 HTML。

原生基础控件可使用公开 HTML 类与 controller；这不是随意复制 React 内部 DOM。数据驱动菜单通过 createMenuLayout/createNavigationMenu 生成，不手写内部皮肤/selected 伪元素或第二套键盘。

## 发布状态与升级原则

当前用户确认只有xAgent正式上线。未正式发布的项目按新设计直接演进，不为旧接口、旧配置或旧模型设置升级兼容分支/别名；xui本轮BusinessAudit旧入口已移除，仅有BusinessLog实现。正常props/render/loader/adapter扩展、权限校验和数据安全边界不是兼容层。对已上线xAgent，采用前单独评估协议、配置、会话与持久数据影响，按授权制定兼容升级方案；本轮不修改它的消费者或数据。代码清理不授权删除生产数据、重置运行或部署。

## 逐页迁移与清理

先盘点旧实现承载的业务权限、导航条件、输入保留、认证/日志、缓存/并发、上传下载、错误恢复和可访问性；不能随旧皮肤盲删功能。保留行为后逐页建立旧→新映射：

- 旧 theme listener/storage/context → 一个 xui theme owner，保留宿主其他持久化字段，释放旧监听。
- 旧菜单 DOM/selected 皮肤/重复 current state/侧栏 drawer → 共享数据与一次 route adapter，清理竞争 owner，不用路由 key 重建 shell。
- 旧 fetch/认证重定向/Toast/loading 状态 → 一个 HTTP client+endpoint adapter+resource，按 [HTTP 合同](HTTP.md) 明确协议，不保留默认旧别名猜测链。
- 旧登录私有页 → ConfigurableLoginPage/createLoginPage 的品牌配置与共享 auth；按 [AUTH 合同](AUTH.md) 分清真实源协议和待实现后端，保留登录后的路由职责、401/403 区别与服务端会话/CSRF，不复制 token storage 或内部渲染。
- 输入/弹层/表格私有皮肤 → 公开组件/部件或原生公共结构，保留 name/label/required、权限和业务回调。
- 旧 API Key/业务日志私有页 → 共享控制器与公开完整视图，保留领域权限/选项；一次性 key 不进入列表缓存，日志列表不带 payload，详情按事件授权脱敏。按 BUSINESS_LOGS 连接现有领域 loader，不能把错误组/旧 offset 伪装业务日志/cursor。独立错误观察仅在确有需求时另按 LOGS 合同接入。
- 缩字号/裁切关键内容/页面尺寸补丁 → 公开布局和滚动区域，业务特殊需求只组合公开扩展点。

每页检查默认色、selected-hover 指示与独立 focus/disabled、操作反馈/reduced-motion、三模式与异常回退、前进后退/同址/修改键/中键、抽屉取消/回焦点、宽窄/长中文/200%文字、加载失败/刷新保留/取消/显式重试/迟到响应、无写操作自动重放、卸载释放。运行该产品真实构建和页面交互；合成例子通过不能替代产品迁移。

## 验收、缺口与权限

验收必须仅调用固定产物公共 exports/props/slots/adapters，不补私有控件皮肤，不留竞争 owner。检查解析路径、peer 单实例、types/CSS/init generation、computed style 和实际业务行为；记录通过/未跑/失败与缺口。能力缺失反馈 xui，修改 xui/推送/发布/部署仍依具体任务授权，不由手册自授权。

业务日志与独立错误观察已有可运行公开消费，但真实后端 adapter/facade 与产品迁移未实施。手册、skill 与公开入口由同一次验证交叉核对；独立审查范围和发现见 [最终审查](FINAL_REVIEW.md)。日志和错误观察各用独立 cursor 合同，不能套 webfacade offset query。SSR、真实移动 OS/读屏器/Firefox/Safari/生产性能等未跑项继续按验证记录保留。

未来按螺旋升级：先逐页采用 xui，baseservice 并行完成后逐项目替换后端 adapter。每次公共合同版本变化，都同步核对消费方包依赖/固定 SHA、HTTP DTO adapter、类型声明与独立业务/页面回归；只在该项目的明确授权中实施。不等待后端才接前端，也不要求一次同时切换全部产品。

最短 Codex 接入请求：`阅读 xui/.agents/skills/adopt-xui/SKILL.md，按其引用的规范和手册接入当前页面；保留业务 API/权限，使用公开产物，运行实际构建并报告通过、未跑和缺口。` 请用实际 checkout 路径替换 xui；这段请求不包含发布或其他仓库变更授权。


## 默认接口与业务能力映射

先核[页面API总索引](PAGE_APIS.md)，使用同一个HTTP/auth owner连接createApiKeyHttpAdapter与createBusinessLogHttpLoader。配置失败不得给默认权限；required/read、可选write和独立confirmed不合并；过期未撤销的key按真实capability允许撤销，已经撤销记录的删除是另一个确认操作。取消/未知结果不能重放写入，服务端仍负责鉴权、幂等和业务数据保留。

两宿主[React](../examples/capabilities-react/app.tsx)/[原生](../examples/capabilities-vanilla/app.js)消费正式产物，展示[公开组合](COMPOSITIONS.md)、safe filename下载及原生页面facade。合成fetch只验证合同，不证明产品具备API Key/业务日志后端。普通程序故障和供应商凭据不得改名替代这些业务。

已上线xAgent的bearer/token/me/state与固定cookie登录合同不同，须单独升级评估；临时桥梁保留旧鉴权/业务、明确目标与移除条件。未发布项目直接向原生commons/webfacade/httpx标准化，由该项目自身授权实施。这里不授权修改后端、baseservice/commons、删除业务数据或部署。
