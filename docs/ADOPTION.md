# xui 使用与迁移手册

这是接入入口，引用同一份规范、公开类型和已运行的例子，不另定义品牌默认值。当前包为 private 0.1.0；采用前固定 Git SHA/本地 tarball 并核对 [全部公开入口与默认行为](PUBLIC_API.md)。菜单布局、HTTP/query、可配置登录页、API Key 管理和可扩展业务日志已实现；默认API Key/业务日志HTTP adapters已实现；产品真实认证、密钥、业务日志服务尚未集成。此前结构化错误查询是独立错误观察能力，不是业务日志。Codex 流程见 [adopt-xui](../.agents/skills/adopt-xui/SKILL.md)，随仓库 checkout 使用，没有安装到用户电脑或全局 skill 工作区。

xui用于统一品牌、前端体系和通用前后端接口。采用项目应在自身授权范围主动使用统一commons/webfacade标准化自有普通业务API；旧httpx响应由迁移边界保持兼容，不能新增第二协议owner；旧协议adapter仅作注明来源、映射、目标与移除条件的临时桥梁。必须遵循的协议、默认HTTP adapters和领域扩展边界见[页面API总索引](PAGE_APIS.md)。不能以保留旧协议为长期架构目标，也不能因此削减业务能力、鉴权或已上线xAgent的升级保护。

行业标准与第三方接入边界遵循[唯一通用规范](DESIGN.md#规范强度与职责)：OAuth2/OIDC/SAML等保持标准，第三方按其API与错误合同，宿主只在内部边界明确转换，不强制外部AjaxResponse。标准协议和第三方adapter不按旧协议迁移桥梁删除。平台API Key由自有平台向Agent/集成签发凭据，与provider key分开；自身业务日志与第三方响应、程序故障记录分开。

## 阅读顺序与架构职责

1. 检查 git status、当前提交、包 manifests/exports，保护本地改动后按任务授权正常 fetch。读清版本差异，不 reset/clean/强推，不覆盖业务修改。
2. [DESIGN.md](DESIGN.md)：唯一完整规则与默认 token 来源。
3. [原子→组合→页面的设计哲学](FOUNDATION.md#组件层次与扩展原则)：单一架构源；[IMPLEMENTATION.md](IMPLEMENTATION.md)：入口、主题 owner、组件 props/部件、原生公共结构与 lifecycle。
4. [NAVIGATION.md](NAVIGATION.md)：菜单数据、MenuLayout 与一次路由适配；[PAGE_APIS.md](PAGE_APIS.md)：页面默认合同与原生标准；[HTTP.md](HTTP.md)：传输/错误/下载/Go 响应/query；[AUTH.md](AUTH.md)：固定认证合同与配置登录页；[API_KEY.md](API_KEY.md)：脱敏列表/创建/一次性结果/复制/授权确认/撤销/删除管理记录；[BUSINESS_LOGS.md](BUSINESS_LOGS.md)：业务日志公共 DTO/loader 与扩展 payload；[LOGS.md](LOGS.md)：独立错误分组/观察/详情与拟议 facade。
5. 下方可运行源组装页面；能力、验收与未跑项见 [FOUNDATION.md](FOUNDATION.md)、[FOUNDATION_VALIDATION.md](FOUNDATION_VALIDATION.md)。规范权威迁移另见 [MIGRATION.md](MIGRATION.md)。

theme 提供无框架预构建 CSS/tokens；runtime 提供主题、DOM、resource、菜单、HTTP/query、认证与共享页面控制器；ui-react 复用共享类型和 React/Base UI peers。按上述三层准则，普通页面通过数据、配置和公开扩展接口使用完整页面/组合，特殊业务组合基础控件；不修改组件内部渲染。产品保管可见菜单过滤、路由、身份、领域权限/数据与业务动作；xui 提供默认结构、交互、motion、focus/a11y。产品迁就统一标准，业务扩展通过公开 slots/render/adapters，公共能力不足反馈 xui。

采用产品以 agent-ready 为优先：业务 API 完整、明确且可独立测试，UI 消费同一能力，只作为用户观察、配置和介入的入口。领域执行、权限、租户隔离、校验与核心业务流程属于宿主服务/领域层，不藏在组件内部，也不因组件替换而消失。xui 提供表现、交互和通用请求接入，不能成为业务 API 能力的唯一入口。这是接入职责，不增加本轮后端改造、Agent SDK 或其他产品仓库修改范围。BusinessLogExplorer是调取业务记录的查询页。baseservice的apikeyservice/webfacade与bizlogservice/webfacade通过版本化HTTP DTO和共享fixture与xui配套，数据库模型不直接暴露；实际边界与宿主接入前置见[PAGE_APIS](PAGE_APIS.md)。baseservice authenticationservice/webfacade 配套 Bearer v2 登录/恢复/session/退出和鉴权中间件；宿主负责注册route、用户身份来源、CSRF与资源策略，真实产品迁移另验。领域扩展保留typed adapter入口，本次不新增运行配置组件。

## 最小运行与固定产物

仓库根执行真实脚本，工具版本见 packageManager/lock：

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test:consumer
pnpm preview
```

富条目双端示例 /rich-navigation-react/、/rich-navigation-vanilla/ 使用公开搜索 + 两组导航 + sibling 配置动作；共享查询与独立未知 total 游标由宿主拥有，详见 [导航扩展](NAVIGATION.md#富条目独立行尾动作与上下文菜单)。

新增 /workspace-react/、/workspace-vanilla/ 验证公开有界工作区（?direct直接AppShell、?short、?plain、?platform、?wrapped），不需要内部样式补丁。

访问 /capabilities-react/、/capabilities-vanilla/ 侧栏/确认/右键菜单/表格/下载与默认页面HTTP，/menu-react/、/menu-vanilla/ 最小菜单，/http-react/、/http-vanilla/ 标准查询页，/login-react/、/login-vanilla/ 配置登录页，/api-key-react/、/api-key-vanilla/ 管理组件，/business-log-react/、/business-log-vanilla/ 业务日志，/log-react/、/log-vanilla/ 独立结构化错误查询，/foundation-react/、/foundation-vanilla/ 列表/表单/详情与动态加载。浏览器检查使用已有 Chromium，或 pnpm exec playwright install chromium。没有部署/发布操作。

test:consumer 将三个包 npm pack，在每次新目录安装 tarball，再从正式 ESM/CSS/types 编译和打包；原生不安装 React，React peers 单实例。生产接入也固定已验证提交，先构建并安装本地 tarball；包尚未发布，不默认填写不存在的 registry 版本。无 monorepo package src alias 或下游 Tailwind 扫描要求；菜单/HTTP/登录/API Key/日志/错误观察/foundation 示例只消费公开 CSS，最初 vanilla/react 示例保留自身页面 layout.css，它不是库所需的样式依赖。

完整可运行代码由正式 consumer/typecheck/browser 检查，直接参考公开调用：

| 宿主 | 菜单 | HTTP 标准页 | 列表/表单/详情 |
| --- | --- | --- | --- |
| React | [app.tsx](../examples/menu-react/app.tsx) | [app.tsx](../examples/http-react/app.tsx) | [app.tsx](../examples/foundation-react/app.tsx) |
| 原生 | [app.js](../examples/menu-vanilla/app.js) | [app.js](../examples/http-vanilla/app.js)/[HTML](../examples/http-vanilla/index.html) | [app.js](../examples/foundation-vanilla/app.js) |
| 共享数据/协议 | [菜单 JSON](../examples/shared/menu-data.json) | [typed endpoint model](../examples/shared/http-model.ts) | 领域事实归宿主 |

API Key 完整消费为 [React](../examples/api-key-react/app.tsx)/[原生](../examples/api-key-vanilla/app.js)，共用 [typed 假数据模型](../examples/shared/api-key-model.ts)，完整值只有一次性结果，不放进 metadata/resource/cache。

登录整页消费为 [React](../examples/login-react/app.tsx)/[原生](../examples/login-vanilla/app.js)，共用 [品牌与文案配置](../examples/shared/login-config.json) 和 [合成认证模型](../examples/shared/login-model.ts)。只接一个 theme、HTTP 与 auth owner；正常登录直接 POST，超时后通过普通 refresh/session 核验一次；不配置持久操作门禁或恢复协议。baseURL 由宿主传入，固定 v2 login/refresh/logout/session 合同见 [AUTH](AUTH.md)。现有 xAgent token/me/state 协议需要后端明确适配，不能直接把旧 bearer/JWT storage 搬进组件。已上线xAgent缺facade时先保留既有认证并采用其它公开页面，真实后端合同就绪后按升级方案切完整登录页；未发布项目直接使用新合同，不增设旧认证兼容层。改baseURL不能替代协议迁移。真实 Cookie、CSRF 和权限由服务负责；示例不会签发真实会话。

业务日志完整消费为 [React](../examples/business-log-react/app.tsx)/[原生](../examples/business-log-vanilla/app.js)，共用 [typed fake loader](../examples/shared/business-log-model.ts)。固定公共日志事实 + event_type/schema_version + 允许披露的业务 payload；按类型/版本注册 renderer，未知版本安全 JSON 回退。真实日志可靠性由服务负责，合同见 [BUSINESS_LOGS.md](BUSINESS_LOGS.md)。

独立结构化错误完整消费为 [React](../examples/log-react/app.tsx)/[原生](../examples/log-vanilla/app.js)，共用 [typed fake facade](../examples/shared/log-model.ts)。按真实 cursor/query 语义展示累计/命中数与首次代表，只有单记录授权读取返回详情；拟议协议和宿主实现责任见 [LOGS.md](LOGS.md)。

公开完整表格与page slots见 /data-table-react/、/data-table-vanilla/；默认 natural，`?layout=workspace` / `?layout=document` 对比显式布局，`?unbounded` 检查 auto 高度父级，`?local` 演示宿主本地分页，`?no-search`、`?no-actions`、`?no-pagination`、`?fixed-page-size` 检查可选能力。使用默认正式样式，无产品表体或footer补丁。顶栏紧凑间隔与无框语言入口见 [HEADER_CONTROLS](HEADER_CONTROLS.md)，普通NativeSelect边界保持。

## 原生 UI ID 与内网 HTTP

原生登录、菜单/布局、API Key/日志视图、Command、Disclosure、Popover 和 Toast 的内部 UI ID 不依赖 `crypto` 或 `crypto.randomUUID()`。内网 HTTP 等非安全上下文无需提供 UUID polyfill；用固定提交重新构建和安装正式 runtime 产物即可取得修复。

内部 allocator 在每个 `ownerDocument` 共享递增计数器，因此独立 bundle、多个组件、尚未挂载的根和卸载重建不会重用已分配 ID；生成前避开已有同名及字段/选项后缀的宿主 ID。组件沿用已有显式 DOM ID，Toast 仍以显式 `message.id` 去重。宿主应把自动生成 ID 视为不透明的临时 UI 标识，不解析格式、不跨文档持久化，也不用于 token、nonce、密钥或幂等键。这项兼容只涉及页面构造与可访问性关联；认证传输、Cookie、CSRF、剪贴板等能力仍遵循各自安全要求。

## 主题、CSS 与单 owner

首屏 init 在 CSS/内容之前，应用复用 window.xuiTheme，不另建 matchMedia/storage/context 竞争状态。mode 是 light/dark/system 选择，effective 是浅深结果；受控选择经宿主确认，不隐式写 storage。React useTheme 只订阅，原生释放订阅/owner 边界明确。

选择一次 style.css 或 critical.css 加可选分片；默认值只来自 DESIGN。tokens 的 design-defaults→product-overrides→design-accessibility 与独立 xui-components 层按 [实施说明](IMPLEMENTATION.md) 加载。少量语义覆盖参考 DESIGN 的既有变量与示例，不复制全色板、不创建缺失 var、不在 JS 中维护颜色或抵消 reduced-motion。

旧未分层普通 CSS 优先级高于分层声明。先确认其业务/布局职责，再移除重复、明确分层或改公开组合并查 computed style。清理针对内部 DOM/伪元素的 selected/hover/focus 竞争皮肤，不能以导入放最后或私有选择器补丁冒充采用。

## 组件、数据与扩展点

下表是组装选择，详细公开 props/部件以 [IMPLEMENTATION.md](IMPLEMENTATION.md) 及固定提交 types 为准，沿用宿主标准 React/原生元素数据，不另造统一业务 schema。

| 公开能力 | 数据与状态 | 默认行为/扩展 |
| --- | --- | --- |
| MenuLayout/NavigationMenu | NavigationItem[]、activeId/location、一次 navigation/matchLocation、header/children | 默认菜单、选中/展开/紧凑/键盘/drawer；renderLink/renderButton/renderLabel、独立renderAction 与受控回调 |
| AppShell/Container/Stack/Grid/Toolbar/PageHeader/Section | sidebar/header/children、title/description/actions/meta | skip link/响应布局；低层 AppShell 用于自组 sidebar，不叠加第二个 MenuLayout owner |
| Button/IconButton | 标准 props、disabled/aria-busy、onClick、图标按钮名字 | type=button、键盘/focus/motion；公开 render/ref，busy 与防重复分别控制 |
| Field/Input/Textarea/NativeSelect/Fieldset/Checkbox/Radio/Switch | label/controlId/name/value/checked、help/error/required/readOnly | 单 id/描述与分组关联；复合输入显式 controlId，保留标准事件 |
| Select/Combobox | peer generic items/value、受控回调、公开 Root/Trigger/Input/List/Item/Content | peer 选择/搜索/键盘/取消，xui 皮肤；原生 select/datalist 的 OS 差异明确 |
| NavItem/Breadcrumbs/Pagination/Disclosure/Tabs | 当前项/页码/open/value 与内容 | page 选中、受控确认、disabled/RTL/方向键；Tabs 为实际 Root/List/Tab/Panel 部件 |
| Dialog/Sheet/AlertDialog/ContextMenu/Menu/Popover/Tooltip/Toast | open/value、内容/执行回调、finalFocus，Toast manager | 公开部件/Content/positionerProps；模态/外点/Esc/回焦点；Tooltip 只放说明 |
| Table/TableContainer/TableCaption/TableHead/TableBody/TableRow/TableHeaderCell/TableCell/SortButton | 行/列/单元内容、scope/aria-sort/selected | 独立导出、原生 table 与命名滚动区域；排序/分页/选择由宿主，不是 rows/columns 引擎 |
| DataTable/DataTableToolbar/DataTableFilter；原生 createDataTable | rows/columns/rowKey、明确status、pageIndexOffset/pageIndex/pageSize/total、外部查询回调 | 默认natural按内容收缩、实际有界父级中限高并只滚动表体；显式workspace填满/document无约束；保留空表头和唯一底栏、受控busy/失败恢复；unknown total不生成页码 |
| Surface/Alert/Badge/Skeleton/Spinner/Progress | children/tone/标准元素状态 | 默认层级/role/status/motion，必要事实持续可见 |
| [MetricCard](METRIC_CARD.md) | label/value/可选 marker、section props/ref | 复用 Surface 的单层皮肤与既有统计 token；名称/值/颜色含义由宿主提供，多卡仍用 Grid，不造业务网格 |
| DataRegion/LoadingState/EmptyState/ErrorState/RenderBoundary | busy/value、反馈、retry/cancel 与 render fallback | 刷新保留旧值，错误即时可见；render 异常与异步失败分开 |
| ApiKeyManager/createApiKeyManager | 一个共享 controller、metadata/声明权限和有效期、领域 adapter | 脱敏列表、创建/一次性结果、明确复制/撤销确认、关闭竞态；labels/React headerActions |
| ConfigurableLoginPage/createLoginPage | 一个共享 auth/theme owner；默认居中单列 card，显式 fullscreen 同列省略外框皮肤；紧凑可选 brandVisual；品牌/标题/说明/logo/labels、安全 returnTo、onAuthenticated | 完整字段/固定局部反馈/防重/取消/主题/认证与会话核对，长表单自然文档滚动；固定路由与 DTO，密码不进 URL/storage/log，无隐式旧协议猜测 |
| BusinessLogExplorer/createBusinessLogExplorer | 一个共享 controller、公共日志字段、显式 list/detail loader、独立领域 JSON payload | 只读日志表格/过滤/授权详情、cursor 快照、文本回退/注册 renderer；不承诺日志写入可靠性 |
| StructuredLogExplorer/createStructuredLogExplorer | 一个共享 controller、明确 v1 DTO/facade、filter/cursor、详情权限与保留期 | 只读分组/观察/详情、缓存已访问摘要段、持续错误/取消、普通文本；labels/host Ref mapping/React headerActions |
| theme/resource/HTTP/query | 单 owner、key/loader/Abort/预算、endpoint adapter/query contract | 共享类型/终止/迟到隔离，默认不重试，401/403 分开，list/total 和基数明确 |

标准列表页可使用 MenuLayout workspace 的 pageHeader→PageHeader 主操作、正文→DataTable（原生 createDataTable）；筛选优先放同一 frame 内的 toolbar→DataTableToolbar/DataTableFilter，也可选择外部 pageToolbar，同一组控件不重复。表格默认 natural：少量/零行随内容收缩，只有实际有界父级才限高并滚动表体；auto 高度父级中仍按文档流增长。显式 workspace 保留旧填满/最小高度，document 在有界父级也取消高度上限。完整组合内置 Table/DataRegion 与统一计数、每页条数、Pagination 底栏；不再让产品复制 DataTableShell、通用滚动与 footer CSS。本地分页由宿主筛选/排序后切片并发布真实页事实；服务端分页保留已确认响应，不二次切片或新建 query owner。复杂自定义表格仍可单独组合既有原语。详细合同见 [DATA_TABLE](DATA_TABLE.md)。筛选/排序由同一宿主 owner 重置该 endpoint 第一页并取消旧请求。cursor 业务日志/错误观察页使用各自完整公开组件，不套此 Pagination 页码或杜撰 total。表单页用 PageHeader/Fieldset/Field/公开控件，值、保存权限、防重复由宿主，必要错误关联并回焦点。详情页用 Breadcrumbs/Section/Surface/公开文本结构，敏感明细按授权加载，不执行 HTML。

原生基础控件可使用公开 HTML 类与 controller；这不是随意复制 React 内部 DOM。数据驱动菜单通过 createMenuLayout/createNavigationMenu 生成，不手写内部皮肤/selected 伪元素或第二套键盘。

## 发布状态与升级原则

当前用户确认只有xAgent正式上线。未正式发布的项目按新设计直接演进，不为旧接口、旧配置或旧模型设置升级兼容分支/别名；xui本轮BusinessAudit旧入口已移除，仅有BusinessLog实现。正常props/render/loader/adapter扩展、权限校验和数据安全边界不是兼容层。对已上线xAgent，采用前单独评估协议、配置、会话与持久数据影响，按授权制定兼容升级方案；本轮不修改它的消费者或数据。代码清理不授权删除生产数据、重置运行或部署。

## DataTable 默认布局迁移

此前省略 layout 会填满 workspace，现在省略使用 natural。依赖旧表现的 React 调用显式加 `layout="workspace"`，原生 options 加 `layout:'workspace'`；希望少量/空行自然收缩的调用继续省略。显式 document 保持无高度上限。shell 的 scrollMode 与表格 layout 各自独立，既有 `--layout-workspace-content-min-block-size` 保留；超高页头仍须按[公开合同](DATA_TABLE.md#页面标题筛选与滚动)提供必要的正文下限，不使用私有 DOM/定位补丁。

当前通用 DataTable 的 footer 原本已位于 frame 内，这不能证明已上线的旧 XAgent 表格升级。产品采用须另核对固定依赖 SHA、实际入口、toolbar/footer 重复 owner 与真实页面回归；本轮没有修改 XAgent。先保留业务能力，再按产品授权迁移。

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

业务日志与独立错误观察已有可运行公开消费；API Key/业务日志配套baseservice facade与共享fixture见[PAGE_APIS](PAGE_APIS.md)，产品迁移和独立错误观察后端未实施。手册、skill 与公开入口由同一次验证交叉核对；独立审查范围和发现见 [最终审查](FINAL_REVIEW.md)。业务日志默认使用原生webfacade offset合同；领域cursor与独立错误观察仍遵循各自明确合同，不混用分页语义。SSR、真实移动 OS/读屏器/Firefox/Safari/生产性能等未跑项继续按验证记录保留。

未来按螺旋升级：先逐页采用 xui，按产品授权逐项目接入baseservice facade或替换后端 adapter。每次公共合同版本变化，都同步核对消费方包依赖/固定 SHA、HTTP DTO adapter、类型声明与独立业务/页面回归；只在该项目的明确授权中实施。不等待后端才接前端，也不要求一次同时切换全部产品。

最短 Codex 接入请求：`阅读 xui/.agents/skills/adopt-xui/SKILL.md，按其引用的规范和手册接入当前页面；保留业务 API/权限，使用公开产物，运行实际构建并报告通过、未跑和缺口。` 请用实际 checkout 路径替换 xui；这段请求不包含发布或其他仓库变更授权。


## 默认接口与业务能力映射

先核[页面API总索引](PAGE_APIS.md)，使用同一个 HTTP/auth owner 连接 createApiKeyHttpAdapter 与 createBusinessLogHttpLoader。Key 使用严格 DTO v2，直接 CRUD，无 writeGuard、操作回执或 Lookup/Resolve。提交时禁用按钮显示正在创建／保存；结果未知时通过普通列表读取一次，展示当前记录并允许手动再试，不自动重发写请求。配置失败不默认授权，required/read、可选权限和独立 confirmed 保留；更新 name/权限/enabled 使用 expected_version CAS，revoked 不可恢复。过期撤销与撤销记录删除分别确认。完整值只在当前结果视图显示，关闭/卸载清除。身份切换销毁旧 controller；后端继续负责鉴权、租户范围、事务和业务数据保留。完整合同见 [API_KEY](API_KEY.md)。

两宿主[React](../examples/capabilities-react/app.tsx)/[原生](../examples/capabilities-vanilla/app.js)消费正式产物，展示[公开组合](COMPOSITIONS.md)、safe filename下载及原生页面facade。合成fetch只验证合同，不证明产品具备API Key/业务日志后端。普通程序故障和供应商凭据不得改名替代这些业务。

已上线xAgent的bearer/token/me/state与固定Bearer v2登录合同不同，须单独升级评估；临时桥梁保留旧鉴权/业务、明确目标与移除条件。未发布项目直接向统一commons/webfacade标准化，由该项目自身授权实施。这里不授权修改后端、baseservice/commons、删除业务数据或部署。

Vite开发接入还须核[冷启动与依赖优化](NAVIGATION.md#vite开发模式的已复现依赖优化刷新)：初始扫描看不到的lazy deep imports可在首次访问触发重新优化/full-reload；提前include实际正式入口并保留peer dedupe，分别验冷/暖cache。不把参考生产消费者无刷新当dev验收，也不靠等待、禁HMR或吞错解决。

采用反馈新增公共能力见[WIDGETS](WIDGETS.md)：Command/date-only Calendar/ToggleGroup/Avatar/Accordion/ScrollArea/InputGroup，以及link/controlSize/readonly。完整登录slots在AUTH，原生origin在HTTP，viewport在NAVIGATION，sticky合成/子菜单在COMPOSITIONS。先用正式默认合同，业务需要通过声明props/data/callback扩展；不能改私有HTML或复制默认CSS。

可折叠分组搜索使用正式 [GroupedCombobox / createGroupedCombobox](GROUPED_SEARCH.md)：一个搜索输入与 listbox，外置折叠/分页控件；不要把 Disclosure 或 Accordion 放进 Combobox.List，也不采用同 Root 两个 List。业务查询、取消、选择与各组分页状态保持宿主所有。Disclosure 默认箭头和原生 controller 的同等合同亦见该页。

## 登录页验收入口

接入公共登录页时，先按 [DESIGN](DESIGN.md#公共登录页布局与主题) 确定品牌与任务层级，再逐项执行 [登录定量验收](LOGIN_VISUAL_ACCEPTANCE.md)。移除被公共组合接管的重复登录布局/动作 owner，通过公开内容与扩展入口保留业务能力；记录本产品实际截图、几何、状态矩阵和最终依赖 SHA。公共示例通过不能替代产品验收。

### 文字与媒体原子

详情文字、长 ID、复制、可移除标签和稳定图片占位采用 [DISPLAY](DISPLAY.md) 的 React/native 正式入口。复制只传授权 value；Tag 明确移除名称及宿主焦点目标；Image 必填 alt 与预留尺寸/比例，src/retryKey 才重启资源。将已替代的页面复制状态/图片错误循环删除，保留业务值、集合、请求和授权。

- 新密码规则、当前计数及本地强度建议统一复用 NewPasswordFields，见 [PASSWORD](PASSWORD.md)。不得复制打分算法、把弱密码提示改成额外提交门禁或把输入发给远程评分服务；字典首次懒加载失败仍按服务端 policy 正常校验。
