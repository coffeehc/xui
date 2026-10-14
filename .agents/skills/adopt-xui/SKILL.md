---
name: adopt-xui
description: 接入、迁移或评审采用 xui 的 React/原生前端，或根据项目 docs/DESIGN.md 生成、更新 xui 可识别的 theme.css。用于采用 xui、统一前端品牌或清理重复 UI/请求 owner；仅生成主题时保留业务、布局、API 和认证范围。
---

# 接入 xui 与生成项目主题

## 先确定范围与参考根目录

- 先解析本 SKILL.md 的物理路径，再从其所在目录向上三级定位 xui 根；全局发现入口可以是符号链接，不能从链接所在的 skills 目录推算仓库。下文相对链接均以这个物理 skill 目录为基准，不依赖固定宿主路径。
- 用户说“根据 DESIGN.md 生成 xui 可识别的 theme.css”或仅要求生成、更新、接入项目主题时，进入[项目主题流程](references/theming.md)，默认设计来源是采用项目的 `docs/DESIGN.md`。完成主题和必要入口接入、验证后结束；不执行下文完整迁移，不借此改业务、页面布局、HTTP、认证或后端。
- 用户明确要求采用、迁移或评审页面/前端体系时，执行下文完整流程；只处理已授权的页面和能力。项目视觉要求映射为公开主题变量，未覆盖项继承 xui 默认规范；需要生成主题时再读[项目主题流程](references/theming.md)。

## 完整采用：固定版本与阅读入口

1. 在任务指定的 xui checkout 与采用仓库读取 AGENTS.md，检查 git status、当前 SHA、分支、包 manifests/exports 和已有改动。按任务授权正常 fetch，比较版本；保护全部提交和业务修改。不要 reset/clean/强推、用文件树 API 同步、猜 registry 版本或改其他仓库。
2. 先读 [采用手册](../../../docs/ADOPTION.md)、[xui 默认完整规范](../../../docs/DESIGN.md)、[公开入口与默认行为](../../../docs/PUBLIC_API.md) 和 [实施映射](../../../docs/ADOPTION.md#组件层次与扩展原则)。另读采用项目自己的 `docs/DESIGN.md`，区分产品视觉要求与 xui 默认合同。以实际消费版本的正式声明和源码核对 API，不能把计划或其他版本写成可调用能力。
3. 读 [原子→组合→页面的单一架构源](../../../docs/ADOPTION.md#组件层次与扩展原则)，为页面选择实际公开层次与扩展点；按需要读 [导航](../../../docs/COMPONENTS.md#导航与菜单)、[HTTP/query](../../../docs/PUBLIC_API.md#http-与查询)、[登录/认证](../../../docs/PUBLIC_API.md#认证会话)、[API Key](../../../docs/PUBLIC_API.md#api-key-管理) 或 [业务日志](../../../docs/PUBLIC_API.md#业务日志)；确有错误观察需求再读 [独立错误 facade](../../../docs/PUBLIC_API.md#程序错误观察)；读 [宿主边界](../../../docs/ADOPTION.md#宿主边界) 与 [实际验证和限制](../../../docs/VALIDATION.md)。不要复制完整规范、默认品牌值或另造组件合同。

## 通用组件与宿主边界

xui 提供通用组件、主题、交互与可选页面组合。宿主拥有业务 API、领域数据、业务页面和产品流程。先按需求选择公共能力；仅选用默认 HTTP client/页面 adapter 时满足 [服务前置](../../../docs/PUBLIC_API.md#默认适配器的服务前置) 的明确 wire 合同，宿主可通过 typed ResponseAdapter、ErrorResponseAdapter、ApiKeyAdapter 或 BusinessLogLoader 接入领域接口。采用 xui 不要求全部普通业务 API 统一到 commons/webfacade；业务 API 或后端迁移是宿主独立任务。这份 skill 不授权改产品后端、baseservice、commons、生产数据或部署。

行业标准优先：OAuth2/OIDC/SAML保持原协议，第三方按对方API/错误格式；adapter在宿主内部边界明确转换，不强迫第三方AjaxResponse。此正常协议边界不按旧升级兼容桥梁删除。平台API Key是自有平台向Agent/集成签发的凭据，不是provider key；自身业务日志不是第三方响应或程序故障记录。唯一通用边界见[DESIGN](../../../docs/DESIGN.md#规范强度与职责)。

## 先保留业务能力，再接入表现层

- 盘点页面的领域 API、权限/租户范围、导航条件、输入保留、认证/日志、查询/缓存、上传下载与失败恢复。记录旧行为到新公开能力的映射，先保留必要功能再删重复实现。按 [发布状态原则](../../../docs/ADOPTION.md#发布状态与升级原则) 核对实际版本、使用方、配置、会话与数据影响，保留必要的升级约束与退出条件。正常领域 adapter、公开扩展和安全校验保留。
- 保持 agent-ready：业务 API 完整且可独立测试，UI 消费同一能力，提供观察、配置与介入入口。把核心流程、权限和校验放在宿主领域层；xui 负责表现、通用交互和请求接入，不能成为业务 API 唯一入口。不由这份 skill 自动扩展后端改造或 Agent SDK 范围。
- 依据 [公开入口索引](../../../docs/PUBLIC_API.md) 选择公开 props/parts/slots/adapters 和标准页面组合。按需要选择完整登录页、MenuLayout、API Key/业务日志视图，通过数据和配置采用；宿主业务 UI 组合原子和公开组合，不改内部渲染、不复制内部 DOM/伪元素或私有皮肤。交互控件统一采用 xui 公开封装：简单选择默认 SimpleSelect / bindSelectControl，复杂选择用 Select/Combobox 或已公开的原生搜索组合，date-only 日期选择用 Calendar / createCalendar；普通输入与动作使用 Input、Button 或相应原生公共结构。Calendar 不等于现成 DatePicker，也不提供时间选择器，按已公开组合接入。公共组件保留真实 input/button 的表单、事件、键盘与可访问语义，不能改成伪 div 控件；也不能依赖裸 select、datalist 或 input type=date 的 OS 弹出面板实现跨平台统一。NativeSelect 等显式平台 API 和安全文件选择窗口是能力边界，不作为普通项目控件的默认推荐；用户明确需要时保留并说明差异。其余交互组合按 [选择与复合控件](../../../docs/COMPONENTS.md#选择与复合控件) 选择 Command/action、ToggleGroup、ScrollArea、InputGroup 与 Accordion；被动 Avatar 按 [展示与媒体](../../../docs/COMPONENTS.md#avatar) 采用；不要把文本输入/Tabs 伪称同等交互。能力不足说明缺口并反馈 xui，不默默新建竞争 owner。

## 连接单一所有者与正式产物

1. 固定已验证提交，构建并本地打包安装；用正式 ESM/CSS/types/init，保持 React/ReactDOM/Base UI peers 单实例，原生只用 theme/runtime。按 [手册](../../../docs/ADOPTION.md) 联调 built dist；不以 packages/src alias、下游 Tailwind 扫描依赖目录或未分层 CSS 覆写冒充接入。
2. 首屏初始化先于 CSS/内容；复用一个文档根主题 owner，支持 light/dark/system 和失败回退。已有 JSON 持久化用受控 bridge 保留其他字段。少量语义覆盖在规定 layer，默认值只来自 DESIGN；清理旧 matchMedia/storage/context、原始色与 selected/hover/focus 竞争规则。
3. 核[冷启动/开发模式](../../../docs/ADOPTION.md#开发联调与冷启动)：navigation从首次可操作菜单就连接，canNavigate=false放行原生导航，不作ready阻止。Vite不可扫描的lazy deep imports须预声明实际optimizeDeps.include并保持peer dedupe，用冷/暖cache的optimizer日志、HMR full-reload和Document请求找因果，不等待几分钟/禁HMR/吞错；用户本地/部署产物未核不冒充确认。菜单共用数据，在根接一次 location/activeId 和 navigation adapter；保留原生修改键、中键、target/download。不要逐项重复选中/路由、叠加第二个 drawer 或用 route key 重挂整个 shell。应用头部优先采用headerSlots的brand/breadcrumb/status/actions或AppHeader，原生同角色传Node；按组件手册的导航迁移说明删掉消费方通用排列/紧凑栏宽度CSS，不替换业务动作。菜单开关由顶栏唯一入口统一负责桌面collapsed与窄屏sidebarOpen，删除产品重复按钮和媒体监听，保留受控回调。侧栏尾部内容使用sidebarFooter及公开SidebarFooterContent/原生同名内容结构，headerSlots仍是顶栏；按[布局slot矩阵](../../../docs/COMPONENTS.md#布局与顶栏)选择context/auxiliary/account与sidebarHeader/pageHeader/pageToolbar/pageFooter，空槽不占位，复用PageHeader.actions和正文，不复制内部布局。默认顶栏主题复用单theme owner；locale仅显式enabled时接现有i18n状态/语言列表/回调，业务不用另拼主题或默认语言入口；删除消费方底部定位/滚动/紧凑宽度补丁，保留业务权限和回调。菜单图标采用Menu.Icon/ContextMenu.Icon或公开xui-menu-icon类，默认菜单与label文字尺度由公共CSS负责，不再全局缩小Portal或所有SVG。
4. 一个 HTTP transport/auth/error owner，加宿主领域 endpoint adapter 与一个所属 resource/controller。明确响应模式；选择默认 ajax 模式时使用准确 Go envelope，业务成功只由 success=true 判定，code 保留必填安全整数元数据，只有明确的端点合同才 opt-in 严格 successCode；固定安全反馈、区分 401/403/business，宿主拥有预算、凭据与登录动作。禁止默认猜 data/msg/items、自创 query AST、隐式日期/页码、重复编码或自动重放写操作。
5. webfacade query 明确 endpoint 页基数/上限/字段 codec/sort；业务日志是随时调取业务记录的查询用途，不建设正式审计体系；baseservice的bizlogservice/webfacade提供配套只读HTTP边界，不引入独立auditservice；宿主接入前置见公开 API 的默认适配器章节，本skill不授权产品后端迁移。业务日志使用 [公开 loader/DTO](../../../docs/PUBLIC_API.md#业务日志)：actor/事件时间/对象/action/result/关联标识与 event_type/schema_version，业务 payload 只允许已授权脱敏 JSON；未知类型/版本安全回退，不把 severity/错误组当业务日志、不强制通用 before/after。优先默认createBusinessLogHttpLoader的原生offset/ListData；领域cursor扩展的snapshot可选且仅真实值，保留已知链基准。不伪造cursor/snapshot。默认HTTP adapter与baseservice facade共享fixture验证，仍不能声明产品已注册生产route、不可篡改或真实鉴权集成通过。独立错误观察仅按公开 API 的程序错误合同采用。
6. 优先 createApiKeyHttpAdapter 严格 DTO v2，完整合同见 [API Key 管理](../../../docs/PUBLIC_API.md#api-key-管理)。直接普通 CRUD，提交禁用显示正在创建／保存；超时读取普通列表一次，允许用户手动再试，不自动重发写请求。无需 writeGuard、操作回执或 Lookup/Resolve 接线。name/权限/enabled 更新保留 expected_version CAS；required 权限、独立 confirmed、撤销和仅 revoked 管理记录删除的授权与确认保留。custom adapter 按领域合同提供可选 update，不强迫第三方采用 base 协议。完整值只在瞬时结果视图，关闭/卸载清除，不进 URL/storage/cache。身份切换销毁旧 controller，后端重新鉴权并执行事务、范围及并发校验。lastUsedAtPending 仅按明确 bool 显示。业务日志只列摘要，详情按单事件授权读取，403/404/保留期分开，文本防注入，对象链接由宿主映射。
7. 标准列表、表单、详情使用公开布局、字段、DataRegion 和反馈；首屏关键事实与主操作可读，风险和错误及时可见。Sheet/AlertDialog/ContextMenu与条纹/展开/sticky表格按[公开组合](../../../docs/COMPONENTS.md#弹层与工具栏)，下载按HTTP白名单header与requestDownload/saveDownload；不复制内部皮肤。保留 disabled/busy、防重复、键盘/focus、触屏、motion/reduced-motion、取消/回焦点、窄屏/放大/长内容。卸载释放所属订阅/owner，取消本地等待并拒绝迟到结果。

8. 登录服务地址/本地LDAP/标准SSO入口用公开beforeFields/afterFields与extensions.beforeSubmit/actions，共享现有owner、不向回调传密码；真实标准协议和产品认证链留宿主；baseservice authenticationservice/webfacade配套自有Bearer v2，宿主注册route/CSRF/资源策略。登录先读[定量验收清单](../../../docs/VALIDATION.md#认证页验收)，从DESIGN规范映射具体预期，再以真实截图/几何/状态结果逐项验收；移除被公共组合替代的重复通用布局与动作owner，业务内容使用公开组合/扩展，不重写私有皮肤。首次管理员设置优先使用公开AdminSetupPage/createAdminSetupPage整页，传宿主权威状态与 submit 回调，密码使用公共组件固定规则；其它启动错误使用公开AuthPage/createAuthPage纯布局，不拼私有login DOM或产品定位CSS，不把初始化业务塞进认证client。登录使用 ConfigurableLoginPage/createLoginPage 与同一个 createAuthClient，按 [登录与会话](../../../docs/PUBLIC_API.md#认证会话) 配置 baseURL、品牌文案/logo 和安全回跳。固定login/refresh/session/logout四路由与v2 DTO；旧 token/me/state 必须明确适配，不能猜协议。固定客户端所需 facade 未就绪时先保留宿主既有认证 owner，按授权接入主题/原子等公共能力；服务与真实合同验收就绪后再接完整登录页，缺口如实报告。仅改baseURL不能完成旧协议迁移。登录401在认证上下文处理；protectedPaths显式声明业务端点，由共享owner按access generation处理401并singleflight刷新，但不重放业务写，403不刷新。access只在内存，业务Bearer omit/error，login/refresh/logout无Bearer、same-origin Cookie；新页面currentUser恢复再核session，支持默认整页导航。正常 login 直接 POST，提交禁用并显示正在登录，无取消按钮；结果未知通过既有 refresh/session 核验一次，未确认则显示安全错误并允许手动重新提交，不自动重放写请求。无恢复会话预请求、持久操作门禁或恢复弹窗；跨窗口仅保留临时协调通知。密码/token不进URL/storage/log/state。真实 Cookie、安全属性、CSRF、鉴权与权限保留在后端，不自动扩展 SSO/注册/重置。

## 核对、交付与授权边界

- 默认HTTP/弹层/下载/表格完整消费参考[React](../../../examples/capabilities-react/app.tsx)/[原生](../../../examples/capabilities-vanilla/app.js)与[合成原生模型](../../../examples/shared/capability-model.ts)。
- 直接采用 [React 菜单](../../../examples/menu-react/app.tsx)/[原生菜单](../../../examples/menu-vanilla/app.js)、[React 标准页](../../../examples/http-react/app.tsx)/[原生标准页](../../../examples/http-vanilla/app.js)、[React 登录](../../../examples/login-react/app.tsx)/[原生登录](../../../examples/login-vanilla/app.js)、[品牌配置](../../../examples/shared/login-config.json)、[完整 API Key 模型](../../../examples/shared/api-key-model.ts)、[业务日志模型](../../../examples/shared/business-log-model.ts) 和 [基础页面](../../../examples/foundation-react/app.tsx)。参考例子是合成数据，不等于任何产品迁移。
- 运行采用产品的真实构建、独立业务 API 检查与页面交互；检查 resolved package 路径、peer 单实例、types/CSS/init generation、computed style 和 watch 故障恢复。涉及 xui 实现或公开行为时按受影响合同执行必要门禁，正式产物采用包含独立 tarball 消费的验证；纯文档/引用治理检查文档、来源合同和相关静态规则。采用页改动实际验证该产品，不能拿 xui 示例结果代替。
- 报告代码 SHA、范围、移除的旧 owner、保留的业务能力、通过/失败/未跑、剩余缺口和实际证据。真实后端/tenant/移动 OS/读屏器/其他浏览器/SSR/生产性能未验就明示。
- 先逐页采用 xui；按产品授权逐项目接入baseservice facade或换后端 adapter。公共合同变更同步升级消费方依赖/固定 SHA、DTO adapter、类型和独立业务/页面回归；不自动修改其他项目，也不要求全产品同时切换。
- 只在具体任务授权的仓库和操作范围内行动。这份 skill 不授权提交其他产品、push、包发布、部署、生成真实密钥或改许可证/可见性；已获授权的操作不重复索取确认。

- 公共扩展默认：shell的viewport/workspace显式选择，否则document；表格stickyHeader与行底色合成由库提供；link保留原生a语义；controlSize不覆盖HTML select.size，readonly choice使用公共React guard或bindReadonlyChoice。原生自定义scheme用明确nativeOrigin和bridge，不因URL.origin=null放行外部tuple；真实Wails三OS必须另验。新组合正式消费参考[React](../../../examples/widgets-react/app.tsx)/[原生](../../../examples/widgets-vanilla/app.js)。

- 简单选项的可折叠分组搜索采用[正式GroupedCombobox](../../../docs/COMPONENTS.md#groupedcombobox-与-disclosure)及双端示例。不能将Disclosure/Accordion嵌入Combobox.List或在同Root放两个List；无需消费者stopPropagation/穿透DOM。共享查询、归档关闭暂停/取消、分页属于宿主；默认Disclosure箭头属于库。

- 富业务导航（子树、图标、描述、独立配置按钮、ContextMenu、未知total/cursor）采用[NAVIGATION公开扩展](../../../docs/COMPONENTS.md#富条目独立行尾动作与上下文菜单)和双端rich-navigation正式消费者；复用Input、Section/Disclosure、各组NavigationMenu和组外加载按钮。原有children/resolveIcon/renderLabel/renderLink不是缺口；使用renderButton/renderAction及原生slots/decorator，不把互动控件塞进label/option，不添加消费方stopPropagation。导航按单roving停靠，辅助动作不导航；请求/游标/防重复/取消/迟到丢弃属于宿主，GroupedCombobox仍是简单选择且不杜撰pageCount。

- 标准列表优先采用[公共DataTable](../../../docs/COMPONENTS.md#数据表格)和既有workspace/pageHeader/pageToolbar。表格layout默认natural：少量/零行自然收缩，仅实际有界父级中限高并滚动表体，auto高度父级仍自然增长；显式workspace保留旧填满/最小高度，document即使在有界父级也无该上限。依赖旧默认的调用须明确layout='workspace'；shell scrollMode与公开内容区下限token不变。内部toolbar与反馈/表体/footer共用frame，外部pageToolbar仍支持，同组筛选只放一处。移除产品重复DataTableShell/筛选/footer/分割线CSS，保留data/columns/rowKey/权限/查询与业务回调。offset的pageIndexOffset与ListData真实total显式传入，既有分页保持受控；服务端不计算总数时省略total而不是假0，cursor按[列表合同](../../../docs/PUBLIC_API.md#列表元数据与受控游标分页)采用显式DataTableCursorPagination，next_cursor缺省不等于末页，null才明确结束；本地数据由宿主切片并发布事实，服务端已分页rows不得二次切片或新增query owner。未知total不伪造页码，刷新保行、零行保表头、分页条数唯一且底栏可达，原生cell slot释放。公开通用 footer 不证明宿主已接入同一版本，须核固定 SHA 和真实消费页。顶栏[语言/主题/账号](../../../docs/COMPONENTS.md#顶栏相邻控件)默认合同不需要宿主穿透样式。

- 独立指标展示采用[公共MetricCard](../../../docs/COMPONENTS.md#metriccard)，已有 Surface 拼卡可改为 label/value/marker 三个公开内容入口；名称、最终格式化值和颜色语义仍归宿主。卡片复用 Surface 和现有统计 token，排列保留调用方 Grid，不内置业务指标清单或专属网格；原生采用同页公开 dl/dt/dd 结构。

- 若产品设计要求用户/Key 对外为 hex，使用[身份编码](../../../docs/PUBLIC_API.md#显式实体身份编码)的公开 idEncoding 与 baseservice Options.IDEncoding 同配。默认 decimal 不变，不复制认证流程或实体解析器，不猜两种格式；固定 HTTP Key adapter 严格校验，域 adapter 的不透明 ID 不受影响。

- 文字、复制与媒体采用 [展示与媒体](../../../docs/COMPONENTS.md#展示与媒体) 的 Typography/Copyable/Separator/Tag/Image 和原生同等构建器。复用既有 token；Copyable 只写显式授权 value、失败可见、等待写入串行；Tag 删除/后续焦点由宿主稳定 key 管理；Image 必须给 alt 与尺寸/比例，不自动重试或猜代理。正式示例/负类型/资源迟到检查见专项合同，不以 DOM 模型测试冒充浏览器验收。

- 普通密码使用基于 InputGroup 的 PasswordInput；本地强度单框使用 PasswordStrengthInput，确认组合使用 NewPasswordFields，固定 6–32 个 Unicode 码点且无策略 API，见 [密码输入](../../../docs/COMPONENTS.md#密码输入)。不得复制打分算法、把弱密码提示改成额外提交门禁或把输入发给远程评分服务；字典首次懒加载失败仍按固定 6–32 个 Unicode 码点规则正常校验。
