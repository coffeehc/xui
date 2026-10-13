---
name: adopt-xui
description: 接入、迁移或评审采用 xui 的 React/原生前端页面，按固定 checkout 的原子、组合、页面分层及公开产物使用主题、菜单布局、HTTP/query、配置登录、API Key 和业务日志，保留业务 API 能力与权限。用户要求采用 xui、统一前端品牌或清理重复 UI/请求 owner 时使用。
---

# 接入 xui

## 固定版本与阅读入口

1. 在任务指定的 xui checkout 与采用仓库读取 AGENTS.md，检查 git status、当前 SHA、分支、包 manifests/exports 和已有改动。按任务授权正常 fetch，比较版本；保护全部提交和业务修改。不要 reset/clean/强推、用文件树 API 同步、猜 registry 版本或改其他仓库。
2. 从本文件所在目录向上三级定位 xui 根。先读 [采用手册](../../../docs/ADOPTION.md)、[唯一完整规范](../../../docs/DESIGN.md)、[公开入口与默认行为](../../../docs/PUBLIC_API.md) 和 [实施映射](../../../docs/IMPLEMENTATION.md)。以当前提交的正式声明和源码核对 API，不能把计划或其他版本写成可调用能力。
3. 读 [原子→组合→页面的单一架构源](../../../docs/FOUNDATION.md#组件层次与扩展原则)，为页面选择实际公开层次与扩展点；按需要读 [导航](../../../docs/NAVIGATION.md)、[HTTP/query](../../../docs/HTTP.md)、[登录/认证](../../../docs/AUTH.md)、[API Key](../../../docs/API_KEY.md) 或 [业务日志](../../../docs/BUSINESS_LOGS.md)；确有错误观察需求再读 [独立错误 facade](../../../docs/LOGS.md)；读 [能力边界](../../../docs/FOUNDATION.md) 与 [实际验证和限制](../../../docs/FOUNDATION_VALIDATION.md)。不要复制完整规范、默认品牌值或另造组件合同。

## 统一品牌、前端体系与通用API

xui用于统一品牌和前端体系。先读[页面API总索引](../../../docs/PAGE_APIS.md)，按统一commons/webfacade的request/query/response/error定义（旧httpx仅保留明确迁移兼容）指导采用项目在自身授权范围主动标准化自有普通业务API后端。旧协议adapter仅为明确临时迁移：列来源SHA、准确映射、保留能力/鉴权、目标合同与移除条件；不能长期另造通用协议。xui任务本身不授权改产品后端、baseservice或commons，也不授权删除生产数据、重置或部署。已上线xAgent另评估升级兼容。

行业标准优先：OAuth2/OIDC/SAML保持原协议，第三方按对方API/错误格式；adapter在宿主内部边界明确转换，不强迫第三方AjaxResponse。此正常协议边界不按旧升级兼容桥梁删除。平台API Key是自有平台向Agent/集成签发的凭据，不是provider key；自身业务日志不是第三方响应或程序故障记录。唯一通用边界见[DESIGN](../../../docs/DESIGN.md#规范强度与职责)。

## 先保留业务能力，再接入表现层

- 盘点页面的领域 API、权限/租户范围、导航条件、输入保留、认证/日志、查询/缓存、上传下载与失败恢复。记录旧行为到新公开能力的映射，先保留必要功能再删重复实现。按[发布状态原则](../../../docs/ADOPTION.md#发布状态与升级原则)处理：未发布项目不保留仅为旧接口/配置/模型服务的兼容分支；已上线xAgent单独评估升级影响，不自动改消费者、数据或部署。正常扩展和安全校验保留。
- 保持 agent-ready：业务 API 完整且可独立测试，UI 消费同一能力，提供观察、配置与介入入口。把核心流程、权限和校验放在宿主领域层；xui 负责表现、通用交互和请求接入，不能成为业务 API 唯一入口。不由这份 skill 自动扩展后端改造或 Agent SDK 范围。
- 依据 [公开入口索引](../../../docs/PUBLIC_API.md) 选择公开 props/parts/slots/adapters 和标准页面组合。优先完整登录页、MenuLayout、API Key/业务日志视图，通过数据和配置采用；特殊业务组合原子和公开组合，不改内部渲染、不复制内部 DOM/伪元素或私有皮肤。其余基础控件采用 React 部件或已声明的原生 HTML/controller。附件新增组合按[WIDGETS](../../../docs/WIDGETS.md)选择Command/action或单/多选、date-only Calendar、ToggleGroup、ScrollArea、Avatar、InputGroup与Accordion；不要把datalist/文本输入/Tabs伪称同等交互。能力不足说明缺口并反馈 xui，不默默新建竞争 owner。

## 连接单一所有者与正式产物

1. 固定已验证提交，构建并本地打包安装；用正式 ESM/CSS/types/init，保持 React/ReactDOM/Base UI peers 单实例，原生只用 theme/runtime。按 [手册](../../../docs/ADOPTION.md) 联调 built dist；不以 packages/src alias、下游 Tailwind 扫描依赖目录或未分层 CSS 覆写冒充接入。
2. 首屏初始化先于 CSS/内容；复用一个文档根主题 owner，支持 light/dark/system 和失败回退。已有 JSON 持久化用受控 bridge 保留其他字段。少量语义覆盖在规定 layer，默认值只来自 DESIGN；清理旧 matchMedia/storage/context、原始色与 selected/hover/focus 竞争规则。
3. 核[冷启动/开发模式](../../../docs/NAVIGATION.md#vite开发模式的已复现依赖优化刷新)：navigation从首次可操作菜单就连接，canNavigate=false放行原生导航，不作ready阻止。Vite不可扫描的lazy deep imports须预声明实际optimizeDeps.include并保持peer dedupe，用冷/暖cache的optimizer日志、HMR full-reload和Document请求找因果，不等待几分钟/禁HMR/吞错；用户本地/部署产物未核不冒充确认。菜单共用数据，在根接一次 location/activeId 和 navigation adapter；保留原生修改键、中键、target/download。不要逐项重复选中/路由、叠加第二个 drawer 或用 route key 重挂整个 shell。应用头部优先采用headerSlots的brand/breadcrumb/status/actions或AppHeader，原生同角色传Node；按NAVIGATION迁移说明删掉消费方通用排列/紧凑栏宽度CSS，不替换业务动作。菜单开关由顶栏唯一入口统一负责桌面collapsed与窄屏sidebarOpen，删除产品重复按钮和媒体监听，保留受控回调。侧栏尾部内容使用sidebarFooter及公开SidebarFooterContent/原生同名内容结构，headerSlots仍是顶栏；按[布局slot矩阵](../../../docs/LAYOUT_SLOTS.md)选择context/auxiliary/account与sidebarHeader/pageHeader/pageToolbar/pageFooter，空槽不占位，复用PageHeader.actions和正文，不复制内部布局。默认顶栏主题复用单theme owner；locale仅显式enabled时接现有i18n状态/语言列表/回调，业务不用另拼主题或默认语言入口；删除消费方底部定位/滚动/紧凑宽度补丁，保留业务权限和回调。菜单图标采用Menu.Icon/ContextMenu.Icon或公开xui-menu-icon类，默认菜单与label文字尺度由公共CSS负责，不再全局缩小Portal或所有SVG。
4. 一个 HTTP transport/auth/error owner，加宿主领域 endpoint adapter 与一个所属 resource/controller。明确响应模式与真实 Go envelope；默认业务成功只由 success=true 判定，code 保留必填安全整数元数据，只有明确的端点合同才 opt-in 严格 successCode；固定安全反馈、区分 401/403/business，宿主拥有预算、凭据与登录动作。禁止默认猜 data/msg/items、自创 query AST、隐式日期/页码、重复编码或自动重放写操作。
5. webfacade query 明确 endpoint 页基数/上限/字段 codec/sort；业务日志是随时调取业务记录的查询用途，不建设正式审计体系；baseservice的bizlogservice/webfacade提供配套只读HTTP边界，不引入独立auditservice；宿主接入前置见PAGE_APIS，本skill不授权产品后端迁移。业务日志使用 [公开 loader/DTO](../../../docs/BUSINESS_LOGS.md)：actor/事件时间/对象/action/result/关联标识与 event_type/schema_version，业务 payload 只允许已授权脱敏 JSON；未知类型/版本安全回退，不把 severity/错误组当业务日志、不强制通用 before/after。优先默认createBusinessLogHttpLoader的原生offset/ListData；领域cursor扩展的snapshot可选且仅真实值，保留已知链基准。不伪造cursor/snapshot。默认HTTP adapter与baseservice facade共享fixture验证，仍不能声明产品已注册生产route、不可篡改或真实鉴权集成通过。独立错误观察仅另按 LOGS 实际合同采用。
6. 优先createApiKeyHttpAdapter严格DTO v2（完整合同API_KEY）；须显式已验证server/actor/namespace持久writeGuard和isCurrentScope实时校验，manager共用owner。name/权限增减/enabled更新使用expected_version CAS，暂停恢复不是revoke，revoked不可恢复；custom adapter的update/version/enabled可选，不强迫采用base协议。配置canCreate/capabilities失败关闭，required权限与独立confirmed保留。过期撤销与撤销记录删除独立确认、不删除业务记录。完整值仅瞬时结果，不进URL/storage/cache，关闭卸载同步清除。持久descriptor只含operation_id/operation/target_id/expected_version/fingerprint，不含draft/name/prefix/secret/token/password；未知写入跨关闭卸载重载保持。Lookup/reconcileWrite仅GET，只按完整匹配权威receipt终态解锁；没记录是pending，不凭列表或409推断。Resolve单独明确确认、可能写不可逆not-applied墓碑阻止晚到请求，绝不伪装只读/自动触发，未知继续锁。50301提交未知与50302已提交后处理失败均阻止重放，不称回滚。存储错误失败关闭，scope切换不显示/清除别人锁；load/save不是跨窗口原子CAS，不同operationID也不幂等合并。访问待保存仅按lastUsedAtPending显式bool显示。日志列表只带公共摘要，payload按单事件授权读取，403/404/保留期分开，普通文本防注入，对象链接仅宿主映射。
7. 标准列表、表单、详情使用公开布局、字段、DataRegion 和反馈；首屏关键事实与主操作可读，风险和错误及时可见。Sheet/AlertDialog/ContextMenu与条纹/展开/sticky表格按[公开组合](../../../docs/COMPOSITIONS.md)，下载按HTTP白名单header与requestDownload/saveDownload；不复制内部皮肤。保留 disabled/busy、防重复、键盘/focus、触屏、motion/reduced-motion、取消/回焦点、窄屏/放大/长内容。卸载释放所属订阅/owner，取消本地等待并拒绝迟到结果。

8. 登录服务地址/本地LDAP/标准SSO入口用公开beforeFields/afterFields与extensions.beforeSubmit/actions，共享现有owner、不向回调传密码；真实标准协议和产品认证链留宿主；baseservice authenticationservice/webfacade配套自有Bearer v2，宿主注册route/CSRF/资源策略。登录先读[定量验收清单](../../../docs/LOGIN_VISUAL_ACCEPTANCE.md)，从DESIGN规范映射具体预期，再以真实截图/几何/状态结果逐项验收；移除被公共组合替代的重复通用布局与动作owner，业务内容使用公开组合/扩展，不重写私有皮肤。首次管理员设置/启动错误使用公开AuthPage/createAuthPage纯布局，传公开字段/动作与宿主submit回调，不拼私有login DOM或产品定位CSS，不把初始化业务塞进认证client。登录使用 ConfigurableLoginPage/createLoginPage 与同一个 createAuthClient，按 [AUTH](../../../docs/AUTH.md) 配置 baseURL、品牌文案/logo 和安全回跳。固定login/refresh/session/logout四路由与v2 DTO；旧 token/me/state 必须明确适配，不能猜协议。对已上线xAgent，若Bearer v2 facade尚未就绪，先保留既有认证owner，接入主题/原子/其它页面；记录协议与上线升级影响，facade及其真实契约验收就绪后再切完整登录页。未发布项目直接采用新合同，不增设旧认证兼容层；服务未就绪如实报告集成缺口。仅改baseURL不能完成旧协议迁移。登录401在认证上下文处理；protectedPaths显式声明业务端点，由共享owner按access generation处理401并singleflight刷新，但不重放业务写，403不刷新。access只在内存，业务Bearer omit/error，login/refresh/logout无Bearer、same-origin Cookie；新页面currentUser恢复再核session，支持默认整页导航。Web Locks跨tab串行；正式HTTP接入配置recovery.scope，广播仅安全epoch，恢复存储仅非秘密attempt/操作pending，存储失败POST前failclosed，整页重载读公开reauthenticationRequired而不另造guard。省略recovery是legacy memory-only，不宣称跨reload保护。未知rotation/409/50301/50302/网络/执行取消失败关闭并要求重新登录，不反复刷新或logout补救。密码/token不进URL/storage/log/state。真实 Cookie、安全属性、CSRF、鉴权与权限保留在后端，不自动扩展 SSO/注册/重置。

## 核对、交付与授权边界

- 默认HTTP/弹层/下载/表格完整消费参考[React](../../../examples/capabilities-react/app.tsx)/[原生](../../../examples/capabilities-vanilla/app.js)与[合成原生模型](../../../examples/shared/capability-model.ts)。
- 直接采用 [React 菜单](../../../examples/menu-react/app.tsx)/[原生菜单](../../../examples/menu-vanilla/app.js)、[React 标准页](../../../examples/http-react/app.tsx)/[原生标准页](../../../examples/http-vanilla/app.js)、[React 登录](../../../examples/login-react/app.tsx)/[原生登录](../../../examples/login-vanilla/app.js)、[品牌配置](../../../examples/shared/login-config.json)、[完整 API Key 模型](../../../examples/shared/api-key-model.ts)、[业务日志模型](../../../examples/shared/business-log-model.ts) 和 [基础页面](../../../examples/foundation-react/app.tsx)。参考例子是合成数据，不等于任何产品迁移。
- 运行采用产品的真实构建、独立业务 API 检查与页面交互；检查 resolved package 路径、peer 单实例、types/CSS/init generation、computed style 和 watch 故障恢复。涉及 xui 自身修改时，在最终 SHA 运行根 pnpm verify（包含全部独立 tarball 消费）；只改采用页也要实际验证该产品，不能拿 xui 示例结果代替。
- 报告代码 SHA、范围、移除的旧 owner、保留的业务能力、通过/失败/未跑、剩余缺口和实际证据。真实后端/tenant/移动 OS/读屏器/其他浏览器/SSR/生产性能未验就明示。
- 先逐页采用 xui；按产品授权逐项目接入baseservice facade或换后端 adapter。公共合同变更同步升级消费方依赖/固定 SHA、DTO adapter、类型和独立业务/页面回归；不自动修改其他项目，也不要求全产品同时切换。
- 只在具体任务授权的仓库和操作范围内行动。这份 skill 不授权提交其他产品、push、包发布、部署、生成真实密钥或改许可证/可见性；已获授权的操作不重复索取确认。

- 公共扩展默认：shell的viewport/workspace显式选择，否则document；表格stickyHeader与行底色合成由库提供；link保留原生a语义；controlSize不覆盖HTML select.size，readonly choice使用公共React guard或bindReadonlyChoice。原生自定义scheme用明确nativeOrigin和bridge，不因URL.origin=null放行外部tuple；真实Wails三OS必须另验。新组合正式消费参考[React](../../../examples/widgets-react/app.tsx)/[原生](../../../examples/widgets-vanilla/app.js)。

- 简单选项的可折叠分组搜索采用[正式GroupedCombobox](../../../docs/GROUPED_SEARCH.md)及双端示例。不能将Disclosure/Accordion嵌入Combobox.List或在同Root放两个List；无需消费者stopPropagation/穿透DOM。共享查询、归档关闭暂停/取消、分页属于宿主；默认Disclosure箭头属于库。

- 富业务导航（子树、图标、描述、独立配置按钮、ContextMenu、未知total/cursor）采用[NAVIGATION公开扩展](../../../docs/NAVIGATION.md#富条目独立行尾动作与上下文菜单)和双端rich-navigation正式消费者；复用Input、Section/Disclosure、各组NavigationMenu和组外加载按钮。原有children/resolveIcon/renderLabel/renderLink不是缺口；使用renderButton/renderAction及原生slots/decorator，不把互动控件塞进label/option，不添加消费方stopPropagation。导航按单roving停靠，辅助动作不导航；请求/游标/防重复/取消/迟到丢弃属于宿主，GroupedCombobox仍是简单选择且不杜撰pageCount。

- 标准列表优先采用[公共DataTable](../../../docs/DATA_TABLE.md)和既有workspace/pageHeader/pageToolbar。表格layout默认natural：少量/零行自然收缩，仅实际有界父级中限高并滚动表体，auto高度父级仍自然增长；显式workspace保留旧填满/最小高度，document即使在有界父级也无该上限。依赖旧默认的调用须明确layout='workspace'；shell scrollMode与公开内容区下限token不变。内部toolbar与反馈/表体/footer共用frame，外部pageToolbar仍支持，同组筛选只放一处。移除产品重复DataTableShell/筛选/footer/分割线CSS，保留data/columns/rowKey/权限/查询与业务回调。offset的pageIndexOffset与ListData真实total显式传入，既有分页保持受控；服务端不计算总数时省略total而不是假0，cursor按[列表合同](../../../docs/LIST_PAGINATION.md)采用显式DataTableCursorPagination，next_cursor缺省不等于末页，null才明确结束；本地数据由宿主切片并发布事实，服务端已分页rows不得二次切片或新增query owner。未知total不伪造页码，刷新保行、零行保表头、分页条数唯一且底栏可达，原生cell slot释放。公开通用footer原本在frame内不证明旧XAgent升级；须另核固定SHA和真实消费页，本轮不修改XAgent。顶栏[语言/主题/账号](../../../docs/HEADER_CONTROLS.md)默认合同不需要宿主穿透样式。

- 独立指标展示采用[公共MetricCard](../../../docs/METRIC_CARD.md)，已有 Surface 拼卡可改为 label/value/marker 三个公开内容入口；名称、最终格式化值和颜色语义仍归宿主。卡片复用 Surface 和现有统计 token，排列保留调用方 Grid，不内置业务指标清单或专属网格；原生采用同页公开 dl/dt/dd 结构。

- 若产品设计要求用户/Key 对外为 hex，使用[身份编码](../../../docs/IDENTITY_ENCODING.md)的公开 idEncoding 与 baseservice Options.IDEncoding 同配。默认 decimal 不变，不复制认证流程或实体解析器，不猜两种格式；固定 HTTP Key adapter 严格校验，域 adapter 的不透明 ID 不受影响。
