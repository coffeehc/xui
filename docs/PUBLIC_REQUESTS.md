# 公共能力维护清单

## 主题根节点与属性恢复（4.2.38，已解决）

xAgent固定4.2.37/196e28c反馈document恢复后主题回退。核对公共ThemeService在创建时捕获documentElement；原根被替换后仍写入脱离文档的节点。真实React 19.2.8的hydrateRoot(document)恢复还会复用同一html并清空属性，不能仅靠下次setMode解析新根解决。4.2.38沿用原ThemeService和缩放方法的内存状态，用Document直接子节点及当前html指定属性的有界观察自动重新投影；逻辑不变时保留state身份、零通知、不读写storage，不重建bootstrap/HTTP/认证或请求owner。destroy释放观察，后续动作始终解析当前根。

公开接法不变，消费者不用新增Observer或复制data属性。恢复仅覆盖xui的主题与缩放，不恢复宿主任意DOM，不修复SCRIPT注入/标记不一致导致的hydration根因。原4.2.37的三种模式根替换Node回归先失败；最终42项定向Node及18项正式包浏览器检查通过，包含真实React同html恢复、根替换、存储拒绝、销毁和真实200%缩放。准确合同见[PUBLIC_API](PUBLIC_API.md#主题根节点恢复4238)，证据与未跑范围见[VALIDATION](VALIDATION.md#主题根节点与属性恢复42382026-10-23)。本轮仅修改xui，消费项目升级和部署仍须独立验收。

## 业务日志查询 slot 与统一单元格扩展（4.2.34）

核对正式4.2.33/f69aabf与当前源码，BusinessLogExplorer原list只有字符串列和专用format*，无额外QueryField槽；领域操作者/会话等真实投影不能通过普通列cell组合。4.2.34按用户明确决定统一为列定义＋cell，不继续扩充专用formatter、会话列或复制接口。未指定cell读取对应原值，指定时完整使用返回内容；旧展示配置需要按COMPONENTS迁移表调整，不称兼容。queryFields/querySummary复用既有QueryForm，Controller/loader、HTTP、分页、快照与原始事件不换owner。可选attributes显式保留宿主授权的不可变JSON投影，不推断任意DTO，不改xAgent。

正式示例同时覆盖公共Button/Badge/OverflowText和ClipboardService/Toast组合，真实结构化会话ID仅复制，无导航/筛选，无会话为空。额外资源scope使用同一Controller取消/清空旧范围；list/labels热更新零请求并保留草稿/详情/分页。列宽和动作上限继承公共表格，已聚焦动作因标签更新变宽时原位揭示，不迫使消费项目补样式。测试及未执行范围见[验证记录](VALIDATION.md)。4.2.33记录的NavigationMenu历史滚动失败不在本项修复范围，消费项目仍须独立升级和实际页面验收。

## 图标按钮在组合容器中的覆盖遗漏（4.2.33）

xAgent正式4.2.32/3c440f4真实页面验收发现SearchToolbar.actions中的默认outline图标按钮padding被公共规则改回0，target36/圆面34，root32时圆面70；同页Card仍为28/56，问题归公共库。核对还发现SidebarFooter文字按钮样式覆盖纯图标的居中/收拢内距/最小宽度。同源补充还确认workspace edge/ScrollArea inset的scope proximity及侧栏通用内描会覆盖纯图标offset，普通72px target的环变72px而非62px。4.2.33沿用既有IconButton圆面Token，修复SearchToolbar/advanced/QueryForm及Footer组合，并排除通用inset选择器对纯图标的接管；普通输入/invalid/滚动区自身与Dialog边界保持，不更换Controller、权限或请求owner，不改xAgent；消费方反馈的业务统计栏挤压由宿主处理。独立正式4.2.32消费者先复现padding/居中两项失败，并复现根100%/200%的inset两项失败；候选回归进一步修复大号图标被收拢Footer净宽压扁的问题。最终组合范围及未跑项见[验证记录](VALIDATION.md)。

扩大回归另发现长菜单收拢再展开后，最后活动行可能部分超出菜单可视区。正式4.2.32主题与4.2.33候选的内存对照均为末行bottom=671、菜单bottom=653，viewport/document两项原测试仍失败；这是后续NavigationMenu滚动连续性修复项，本轮未改其Controller/滚动实现，也不把这两项写成通过。消费方不通过私有DOM滚动补丁规避。

## 圆形图标动作外圈（4.2.32）

xAgent固定4.2.31/7b05af0反馈纯图标按钮外圈留白偏大；已核对原始要求，约缩1/3是参考，不能机械缩所有尺寸或放大图标。公共默认36px target加focus-width/offset形成44px外圈。本轮统一IconButton与Button data-icon=true圆面/outline/busy及焦点内收，保持原target、glyph、状态和业务owner，工具栏/表格/弹层/Card共用；带文字按钮与Card图标tile不变。正式证据和未跑边界见[验证记录](VALIDATION.md)，产品不加私有补丁，本轮不修改或部署xAgent。

## Card操作图标间距（4.2.31）

xAgent固定4.2.30/4150bcd6反馈各类卡片footerActions都偏疏，已核对用户原始要求及公共最小复现：动作组沿用普通Toolbar的8px gap、默认36px IconButton中心距44px。4.2.31由公共Card独立card-actions-gap默认4px收紧至40px中心距，不修改全站Toolbar、Button/Switch尺寸/焦点或业务owner；头部及页脚使用同一合同。消费方不写私有CSS、也不恢复已删除的metadata。正式证据及未跑边界见[验证记录](VALIDATION.md)，不代替xAgent实际页面升级或部署验收。


## Card footerMeta、自然滚轮及refresh读取恢复（4.2.30）

xAgent的XUI-CARD-FOOTER-META-SHRINK与xLead两项反馈均源自正式4.2.28；核对4.2.29/45067eab仍存在。独立4.2.29消费者先复现五列约280px卡片长metadata令动作另起一行（footer81px）；xAgent实测约267px。4.2.30由公共Card维护压缩/回退及当前卡交互范围，不要求宿主取ref/穿DOM；技能/工具业务已删除信息行的项目继续省略footerMeta。另修CardGroup边界规则被通用ScrollArea覆盖，及公共登录页遗漏auth.refresh可恢复读取错误检查；未知退出合同保持。正式证据/未跑范围见[验证记录](VALIDATION.md)，不代表xAgent/xLead实际页面或部署已通过，本轮不改消费项目/BaseService。

## xAgent 业务日志整页语言热更新（4.2.29）

核对固定4.2.28及最新main 53f0812a，list formatter可热更新，但controller.labels只在构造时合并，缺少整页展示入口。4.2.29新增BusinessLogExplorer.labels，默认options.labels也实时生效；沿用同一Controller/view、草稿、详情、分页与快照，语言本身不请求或取消。默认Controller保留旧错误字符串并公开语义键，React据当前词典呈现已有/迟到反馈；无重建owner或私有DOM补丁。[公开合同](COMPONENTS.md#业务日志整页标签热更新4229)、[逐项检查](ADOPTION_CHECKLIST.md#业务日志整页语言逐项检查)与[正式验证](VALIDATION.md)分别记录。仅修改xui，不代表xAgent实际页面升级已通过。

## xAgent 业务日志列表展示配置（4.2.27）

核查报告的4.2.18及最新4.2.26：BusinessLogExplorer固定七列，actor拼接kind/name/id，时间原样ISO，没有列表列与formatter入口。4.2.27以可选list展示slot补齐列选择/顺序与actor/action/occurredAt纯字符串格式化；推荐actor、occurredAt、summary、result、detail，兼容旧七列。默认helper保留headers/cells形状并新增columnIds，原服务/请求、事件/筛选/详情不改。调用及验收见[组件合同](COMPONENTS.md#业务日志列定义与查询-slot4234)与[验证记录](VALIDATION.md)。宿主仍负责真实业务摘要、操作者投影和locale，库示例不代表xAgent实际验收。本轮不修改xAgent/业务API/部署。

## xAgent HTTP剪贴板假成功（4.2.28）

4.2.18到4.2.27公共fallback原生选区均为0×0。无shim的普通HTTP原生Chrome中，Controller/Copyable显示copied但OS文本不符；早期0×0/1×1对照及4.2.27正式包新系统回归已分别复现。4.2.28最小修复为不可见、脱离文档流的非零选区，不改默认writer选择、FIFO/取消/失败和焦点/选区/滚动恢复，不读回剪贴板或新建通知owner。精确平台几何例外由设计门禁限定，普通组件仍禁私有尺寸。正式系统回归、旧基线与限制见[VALIDATION](VALIDATION.md)，宿主仍须独立升级并验收实际复制入口；不修改xAgent/业务API/部署。

## xLetter DataTable无溢出滚轮陷阱（4.2.26）

xLetter报告固定4.2.22在`MenuLayout scrollMode="viewport"`的长表格内滚轮不动，表体没有纵向范围却无条件contain；最新4.2.25源码仍有相同规则。公共修复按实际纵向范围切换边界，复用既有布局观察器，无新props、私有宿主补丁或请求owner。原4.2.25正式消费者已用真实wheel复现同类祖先滚动阻断；正式修复证据见[VALIDATION](VALIDATION.md)。本任务不访问xLetter已登录线上标签页、不改业务/部署，产品升级后的实际页面验收由xLetter独立完成。

## xLead 登录交接失败呈现（4.2.25）

来源xLead固定4.2.20/5aeefe73；核对最新main 53b9c182/4.2.24仍把导航failed归入navigating，主按钮因此误显示opening。4.2.25只修正公共展示派生，失败时保留认证、字段锁定和空密码，主按钮普通文案/disabled/非busy，仅次动作重试导航；原Controller、认证和请求owner未改。正式包结果见[验证记录](VALIDATION.md)。xLead首次启动的模块/上下文失败步骤仍未确定，刷新后进入或另一轮200响应不能证明首次链路正常；本轮不修改xLead/BaseService，也不将宿主根因归为库缺陷。

诊断评估：现有公开Controller阶段订阅已可提供idle/opening/failed的无凭据事实，不提供任意宿主步骤分类。宿主内部步骤由onAuthenticated及原资源/请求owner记录脱敏固定码；库不保存或展示原始Error/body/credentials，不新增猜测分类或并行诊断owner。

## xLead 公共链接默认无下划线（4.2.24）

xLead报告固定4.2.20/5aeefe73的Typography.Link消息标题与来源链接显示下划线，要求由xui公共CSS统一处理。最新main 4.2.23仍为underline；4.2.24将Typography.Link、LinkedText、xui/xui-layer内原生a及Button link统一为默认无下划线，保持主题色、导航/外链属性、独立focus-visible与原点击合同。导航和控件forced-colors选中标记仍保留。无新增props/owner；正式包结果见[验证记录](VALIDATION.md)，宿主须升级后复验自己的实际列表，库验收不等于xLead产品验收通过。本轮不修改xLead或BaseService。

## BaseService 管理员初始化合同提示词

以下为交给BaseService维护者的独立任务；本轮xui仅提供默认页面/配置与现有回调接线，未实现或宣称已有初始化HTTP路由。接口命名和wire由BaseService确定，确认后xui再接正式默认client，不由消费项目猜测或创建前端兼容层。

```text
目标项目：coffeehc/baseservice。请先核对最新源码、AGENTS及公开服务/认证/事务合同；已存在的能力给准确入口和证据，避免重复实现。本任务只修改BaseService，不修改xui或消费项目。

为xui AdminSetupPage/AdminSetupForm补齐统一的首次管理员初始化后端合同，复用现有userservice、authenticationservice、authorizationservice和同一持久化/事务owner，不另建账户、密码、授权或数据库体系。现有xui仅有权威state/onSubmit/onCheck回调，不存在可供直接调用的统一初始化HTTP端点；下面是需求，URL/DTO名称不代表已有接口。

1. 明确初始化只读状态与首次创建两个操作，给固定method/URL、schema_version、AjaxResponse payload、错误和安全请求合同。状态只投影最少权威事实，区分允许、已完成、不可用/未确认；读取失败或取消不能解锁创建。不得返回密码、用户凭据、bootstrap秘密或不必要的用户信息。
2. 明确首次创建的授权来源和部署启用条件，防止“第一个匿名访问者成为管理员”。初始信任/一次性授权、Origin/CSRF、速率与输入预算由正式合同规定；前端config、空用户表或仅UI检查不能授予初始化权。不得新增通用auth端点白名单或借此削弱现有Bearer/会话安全默认。
3. 创建首个用户、本地密码凭据与初始管理员授权必须有明确的原子边界和并发互斥/唯一性保证。多个客户端并发、重复提交、部分失败及已初始化再次调用均不能生成第二管理员或半初始化数据；复用现有服务公开方法和同一事务context，不直接拼SQL绕过owner。
4. 明确确认完成、权威拒绝、冲突、未确认/超时结果未知及只读核对语义，给与xui complete/rejected/unavailable/unconfirmed状态的可靠映射。未知写入不自动重放，状态读取不能凭空证明本次写入未执行；已完成只引导正常登录，不自动签发登录会话。
5. 用户名校验/规范化与既有密码合同一致，前端不猜规则；密码只在提交作用域短暂持有，不进入响应、状态、URL、日志、storage或错误正文。取消/关闭不冒充服务端回滚，保留原始内部错误和安全外部分类。
6. 同步公开接口/文档、可被xui默认client直接消费的wire fixtures及独立HTTP合同测试。覆盖首次/已完成/禁用、并发唯一性、回滚/未知提交、错误凭据与授权、取消/迟到、限流和无秘密泄漏；按项目规则使用已授权测试环境，不以合成fixture冒充生产部署。

交付源码SHA、准确端点/DTO/状态与权限表、已跑/失败/未跑和可复现证据。只在合同确认并交付后由xui另行实现默认接线，不要求消费项目先各自发明初始化协议。
```

本页登记消费项目提交的公共能力缺口及核对结果，不定义另一份接口合同。当前仅维护以4.2.1为基准的单一版本线（当前版本以正式manifest为准），后续递增末位；3.x兼容分发已退役，以下双版本记录只代表历史证据，不再回补或提供兼容包。下文是各条目原提交时的固定版本、现象与历史验证，不代表 2.0.0 产品已迁移或其最新状态。当前公开服务/配置/React入口以 [PUBLIC_API](PUBLIC_API.md) 与 [COMPONENTS](COMPONENTS.md) 为准；消费项目升级和逐页验收仍由各自仓库完成。待实现条目的建议字段不是现有 API。请求登记不代表已排期、实现或通过消费项目验收。

## 历史 2.0.0 公共架构说明

2.0.0 的 runtime 基础 HTTP/Auth/Theme/Clipboard Service 统一由 `bootstrap` 与每个 Window 的服务注册表创建或借用；基础 `create*Service/Client` factories 已从公开 exports 移除。新应用使用包内默认 config.json 与部分覆盖，运行实例通过第二参数注入；SSR按请求持有独立 `XuiServices`。`init.js` 仅首绘前预绘制主题/缩放，不拥有主题 controller。新增 config、services、bootstrap、route、i18n、menu-service、util-service 与 React services/route 入口，逐项合同见 [PUBLIC_API 启动配置与应用服务](PUBLIC_API.md#启动配置与应用服务)。

这次 xui API 与服务生命周期变更不替消费项目安装新包、不修改其适配层或业务 API，也不表示任何产品完成升级。请在消费项目固定2.0.0源码SHA后，按 [接入清单](ADOPTION_CHECKLIST.md)逐入口和实际页面记录通过、失败、未跑或不适用。

## Argus 固定版接入反馈（2026-10-16）

来源记录：Argus `d3cc589fd803e20d0640321437ed280a2a4036dc` 的 `docs/xui-public-requests.md`。其消费基线为 xui `595380a6d2467d56623a0df0dedc026e0331a4ff`、DESIGN `0.13.1`、三个包 `0.1.0`。来源中的产品调用点和现场现象按反馈登记，本轮没有读取或修改 Argus，也没有重跑其页面。

原核查基线为 xui 源码 `cdeefa7193f8ae100f72e225befde36a79ee596a`（DESIGN及三个包为 `1.2.0`）；当时本工作树的 DESIGN 与三个包为 `1.3.0`。02/04/05对应能力的库级结论只在该时点有效；后续包版本与页面接入须按2.0.0实际产物重新核对。Argus仍须自行升级并验收真实页面、GET接口和wire，不能将旧库级结果写成产品已完成。

| ID | 请求 | xui 状态 | 消费项目后续 |
|---|---|---|---|
| XUI-REQ-20261016-01 | 完整登录/初始化页密码显隐名称本地化 | 已由既有公开能力解决 | 按固定产物配置并复验，不能把旧基线缺口继续记为当前 xui 阻塞 |
| XUI-REQ-20261016-02 | StructuredLogExplorer 不提供跨组全量 records 的模式 | xui库级已验收：1.3.0提供分组型adapter，旧完整adapter保持兼容 | Argus 可省略records入口，但仍须单独适配其真实GET接口和wire |
| XUI-REQ-20261016-04 | Dialog内Select选项被底栏遮挡 | xui库级已验收：1.3.0基础Select浮层样式通过正式包指针验收 | 消费项目需升级固定包并在自己的Dialog结构复验 |
| XUI-REQ-20261016-05 | API Key管理页的公开客户端分页 | xui库级已验收：1.3.0提供完整列表客户端分页及状态/metadata呈现 | 消费项目需升级固定包并复验实际API Key页面与服务 |

### XUI-REQ-20261016-01：完整认证页显隐文案（已解决）

Argus 调用点：`frontend/src/workspace/identity-boundary.tsx`、`frontend/src/features/identity/setup-page.tsx`。反馈是在中文完整认证页中，独立 PasswordInput 可本地化，但页内按钮仍显示英文。

该能力已经由 [57f4e8c](https://github.com/coffeehc/xui/commit/57f4e8c0f8c7c640b4f8b1faa1fbf7438581d27f) 提供，自 `1.1.0` 起保留于后续版本：

- `ConfigurableLoginPage` 使用 `config.labels.showPassword` / `hidePassword`。
- `AdminSetupPage` 使用 `passwordLabels.showPassword` / `hidePassword`，新密码及确认两个输入均转交相同文案。
- 两组字段均可选，省略时保留英文默认；无需宿主接管完整页字段或穿透按钮 DOM。

例如配置值分别为 `showPassword: '显示密码'`、`hidePassword: '隐藏密码'`。真实声明见 [LoginPageLabels](../packages/runtime/src/auth.ts)、[NewPasswordLabels](../packages/runtime/src/password.ts)；接线见 [登录页](../packages/ui-react/src/login.tsx)、[初始化页](../packages/ui-react/src/admin-setup.tsx) 与 [新密码组合](../packages/ui-react/src/password.tsx)。公开使用合同见 [完整认证页文案](COMPONENTS.md#完整登录页密码显隐文案与品牌替代文本)，既有执行结果见 [验证记录](VALIDATION.md)。

消费项目升级后仍需复验鼠标、Enter/Space、按钮焦点、状态对应的 accessible name、密码值和清理行为。本次没有将历史库级验证写成 Argus 当前页面已通过，也不自动升级其依赖或认证协议。`0.1.0` 曾对应多个固定源码版本，不能只比较包版本字符串判断能力。

### XUI-REQ-20261016-02：分组模式不依赖全量 records（xui 1.3.0已解决）

Argus 调用点：`frontend/src/features/error-observation/page.tsx`、`frontend/src/domain/read-api.ts`。反馈的真实读取能力为组列表、指定组记录、指定记录详情及投递列表，路径分别是 `GET /api/ops/error-logs/groups`、`/groups/:id`、`/records/:id`、`/deliveries`；没有跨组全量记录查询。投递列表、组内记录和单条详情都不能冒充全量 records。

1.3.0新增 [GroupedStructuredLogAdapter](../packages/runtime/src/structured-log.ts) 并允许省略 `records`；既有 `StructuredLogAdapter` 仍继承该接口且要求完整的 `records` 方法，保留完整adapter变量的直接调用类型合同。`StructuredLogHttpEndpoints.records` 可省略；factory在records路径为字符串时返回完整类型，不能证明其存在时返回分组类型。缺省时HTTP adapter不创建此方法，React [StructuredLogExplorer](../packages/ui-react/src/structured-log.tsx) 不显示跨组全量入口、不发records请求；组列表、指定组记录和详情保持可用，`setView('records')`为安全no-op。提供records时保留原有全量模式。库级验证见本轮[验证记录](VALIDATION.md)；Argus仍须在其授权边界内适配真实GET DTO/wire并升级验收。

现有替代是保留 Argus 已使用的公共 DataTable、Field、Disclosure 与反馈组件，呈现真实的“分组 → 组内记录 → 详情”流程；不要求消费项目复制 Explorer 或自行增强公共组件。

接口适配边界仍遵守 [程序错误观察合同](PUBLIC_API.md#程序错误观察)：xui HTTP adapter 使用宿主提供的三个必需加一个可选 POST 查询 endpoint，并不等同于上述 Argus GET 领域接口。支持分组模式省略 records 不证明其余 DTO、筛选、分页和权限合同已匹配；Argus 仍须在其授权范围内适配 wire/服务。此项不授权改动 Argus API 或后端。

## DataTable列宽拖动（2026-10-17）

XUI-REQ-20261017-20来自xAgent触发器管理公开DataTable，旧固定4.2.5/7222abb只有width初始下限，4.2.9复核仍无拖动入口。本轮只在xui提供可选columnSizing及完整可替换Controller，正式接口、边界和验收见[交互列宽](COMPONENTS.md#交互列宽调整)与[验证记录](VALIDATION.md)。宿主保留查询、触发器间隔格式、排序和业务动作，不在前端复制私有表头。正式包交付/消费项目升级分别验收，4.2.9导航交付不包含本能力。

## Progress宽轨道形状（2026-10-17）

XUI-REQ-20261017-21来自xAgent系统监控的公开Progress：4.2.10正式独立消费者也确认600×8轨道使用50%圆角，长条呈椭圆。4.2.11仅将公共Progress轨道/填充改用已有radius-sm，保留全局radius-full与Spinner圆形。真实value/max、未知进度、RTL与媒体合同不变；没有宿主补丁，证据见[验证记录](VALIDATION.md)。产品升级及真实监控页面验收仍由消费方完成。

## xLetter自助改密（2026-10-17）

XUI-REQ-20261017-22：来源消费XUI4.2.3/b5c770f、BaseService5e2c906；本轮复核4.2.11仍无AuthClient公开命令，收到追加授权后补齐4.2.12的changePassword与PasswordChangeForm/Controller。直接复用官方PUT与唯一Bearer owner，不扩张通用auth URL、不暴露token；详细代次/未知/清密合同见[自助改密](PUBLIC_API.md#自助改密)。只修改xui，BaseService协议仅只读核对；不修改xLetter/Argus/xQuant/xAgent，不宣称产品升级、服务器真实撤销或部署通过。库级证据见[验证记录](VALIDATION.md)。

## 后续公开维护项（2026-10-16）

### XUI-REQ-20261017-18：line Tabs与侧栏header分隔同基线（4.2.7，库级已验收，待宿主接线）

xAgent固定4.2.5 / `7222abb`反馈选中线与Shell header边界平行分离；4.2.6的库ESM/CSS/types与4.2.5相同。修正由水平line List拥有淡分隔与选中段同基线，AppShell/MenuLayout新增可选sidebarTabs槽移交header边界。宿主应把末位List从sidebarHeader移入该槽，共用原Tabs.Root/Panel；旧slot保留原边界，不能只升级包就宣称宿主已合线。实际四项验收采用“普通 / 团队 / 插件 / 已归档”，没有新增产品分类、查询或归档输入行为。正式证据与未跑范围见[验证记录](VALIDATION.md)，合同见[侧栏Tabs](COMPONENTS.md#侧栏快捷操作组合)。

### XUI-REQ-20261017-19：管理菜单与四项会话Tabs侧栏收窄（4.2.9，库级已验收，待宿主升级）

xAgent用户进一步确认普通管理菜单也偏宽。公共默认改为18vw，最小6项高加两侧内距、最大8项高（100%时240–288px），保留50vw安全封顶、60px compact rail与窄屏抽屉。sidebarTabs中content项保持自然宽度并分布两端，四项“普通 / 团队 / 插件 / 已归档”在默认桌面范围内单行且无大块尾部空白；不得改宿主字号。该槽不拥有查询或Tab值。

这是一份受上下限约束的公共布局合同，未新增任意内容测量模式。nav-sidebar-width参与Grid及品牌列calc，仍须可解析的长度/比例，不能置max-content；宿主如有额外品牌约束可覆盖公开min/max/width Token。长名称、200%文字与窄屏按自然换行/抽屉处理，不承诺任意语言/内容的整栏宽度恰等于所有Tab固有总宽，不用业务标题驱动全局测量owner。证据见[验证记录](VALIDATION.md)。

### XUI-REQ-20261017-17：保留Dialog异步重开后阅读位置跳到焦点（4.2.5，库级已验收、待宿主升级验收）

来源xLead固定4.2.3 / `b5c770f`的独立最小复现；本轮在4.2.4 / `f13c386`正式包独立确认：同一keepMounted详情中输入保持焦点，用户将Body滚至93px，受控关闭并等待350ms后重新打开，即使initialFocus明确preventScroll，仍到10370px；同一事件内立即开关保持93px。定位为公共布局观察隐藏时清除滚动模式，重开误作容器切换再scrollIntoView，不是认证或业务适配问题。

4.2.5保留隐藏期间已选模式，只在真实几何模式变化时重置旧容器并揭示焦点；仅在组件布局观察器内保存当前DOM滚动位置，不新增核验流程、查询owner或宿主私有CSS。18项定向unit、独立正式ESM/CSS/types消费者与98项浏览器检查通过。Firefox动画中的原生取整最大约0.15px，其他引擎和静态场景严格相等；精度、正式包与未跑范围见[验证记录](VALIDATION.md#保留dialog异步恢复的阅读连续性4252026-10-17)。本机自动化未产生真实后台visibility变化的尝试另行记录，不伪称生产身份恢复验收。合同见[保留详情](COMPONENTS.md#保留dialog的阅读位置)。仅修改xui，xLead产品升级与真实异步核验仍由其自身验收。

### XUI-REQ-20261017-14：移动导航与未保存确认后的焦点恢复（4.2.3，库级已验收、待宿主接线验收）

xLead原反馈固定3.1.0 / `31a54e5f2c0aca4552c629e4c7987f1208a97337`的390px独立正式消费者。最新4.2.2 / `7d037443b0744226f8364ea4a660692fed2e6e15`已独立复现：受控MenuLayout关闭抽屉、宿主AlertDialog取消后焦点为BODY；原链接已隐藏，抽屉不能抢走新确认框的焦点。

4.2.3公开AppShell/MenuLayout的`navigationTriggerRef?: React.Ref<HTMLButtonElement>`，宿主以既有AlertDialog.Content.finalFocus接到该稳定按钮；保留草稿回开关，放弃并继续可选择真实目的操作。支持对象/callback ref、React19 cleanup及响应式重排，不新增导航/草稿owner或私有DOM查询。**这是公开接线能力，宿主必须配置finalFocus；仅升级不会自动更改宿主确认框的恢复目标。** 三主题、窄屏、长中文、200%字号/真实Chrome缩放、取消/放弃、Escape与StrictMode库级通过；合同见[抽屉确认回焦](COMPONENTS.md#导航抽屉与未保存确认的最终焦点)，证据见[4.2.3记录](VALIDATION.md#导航抽屉确认回焦4232026-10-17)。本轮只修改xui，不回补3.x，不宣布xLead或其他产品已通过。

### XUI-REQ-20261017-15：同范围刷新不挤动内容（4.2.3，库级已验收、待宿主验收）

xQuant原反馈固定3.0.0 / `b9753a4f43967c76f566eefdab38042d0423da18`。最新4.2.2独立正式基线确认：空CardGroup刷新时空态消失、高度增加2px；320px StructuredLogExplorer筛选/数据区下移44px，数据区增高8.5px；本轮DataTable空态同样被加载态替换，但该样例高度不变。1280/390日志及API Key三宽几何无差，不能把来源3.0.0底栏28px反馈泛化为最新版本全部失败。

4.2.3默认refreshing保留已确认空态/旧行，不在footer新增临时加载文案；ApiKeyManager及两类日志Explorer用固定刷新按钮预留指示位，取消动作始终在固定位置、空闲禁用。新增可选`CollectionViewOptions.hasValue`供DataTable/CardGroup在空结果刷新失败时保持已确认空态及重试；首次加载/首次错误仍单独呈现，查询与范围重置归宿主。正式包新增39组刷新几何记录最大差0px，旧行/焦点、分页、错误/取消/迟到回归通过，完整范围和过程失败见[刷新记录](VALIDATION.md#集合刷新布局连续性4232026-10-17)。反馈/错误为可读性自然增高仍属明确合同，不通过ready伪装busy，也不要求宿主CSS隐藏状态。未修改xQuant或其他消费项目。

### XUI-REQ-20261017-13：管理员用户名宿主校验（4.2.1，库级已验收、待宿主验收）

来源xLead固定3.1.0 / `31a54e5f2c0aca4552c629e4c7987f1208a97337`：公共Form只校验非空，无法表达宿主字符/长度规则。4.2.1增加可选同步纯函数`validateUsername`，Form/Page与Controller共享字段错误、关联、聚焦与提交边界；不内置xLead正则，不修改值、认证或业务API。缺省仅非空，默认/注入互斥及未知结果锁定保持；合同见[用户名校验](COMPONENTS.md#宿主用户名校验)。正式包Chromium28项、Firefox/WebKit44项及单元/类型通过，详见[本轮记录](VALIDATION.md#管理员用户名校验与单一版本线4212026-10-17)。不提供3.x兼容包，宿主需按单一当前版本升级并独立验收。

### XUI-REQ-20261017-12：程序错误Explorer的中文表头与三态标签（4.1.2 / 3.1.2已修复，待宿主验收）

来源：xQuant固定3.0.0 / `b9753a4f43967c76f566eefdab38042d0423da18`，1280宽、324侧栏，长中文摘要使累计/匹配表头逐字竖排。最新4.1.1正式消费者同样复现累计表头5行；公开Props没有列宽入口，不是宿主遗漏配置。修复在Explorer表头及records三态标签采用既有完整词组角色；摘要保留主列最小宽度/自然换行，时间计数与操作保留单行，窄屏和大字由公共TableContainer横滚承接。未改Table全局样式、Token、DTO、cursor/as_of、查询/刷新/权限或认证逻辑。正式包结果见[验证记录](VALIDATION.md)，样板`/log-react/?long-labels`演示合成长标签。xQuant既有PG/HTTP/页面证据仅按来源登记，本轮不访问宿主API或替产品宣称验收通过。

### XUI-REQ-20261017-10：链接按钮hover文字对比度（4.1.1 / 3.1.1已修复，待宿主验收）

来源：xAgent固定3.0.0 / `b9753a4f43967c76f566eefdab38042d0423da18`，宿主报告浅色link Button在hover的普通文字对比度4.3460703117:1。本轮在独立正式4.1.0与3.1.0消费者复现4.346070311712855；3.0.0/3.1.0/4.1.0的正式button.css相同。修复只让link hover使用既有interaction-hover-foreground配对背景，保留默认主色、字体/尺寸、disabled/busy和button/link键盘语义；不改Token值、业务/认证或宿主CSS。具体范围见[验证记录](VALIDATION.md)。

### XUI-REQ-20261017-11：扁平Tabs变体与长名称（4.2.4，库级已验收、待宿主接线）

新增可选`Tabs.List variant="line"`，`TabsListProps`同步公开。单项公共上限tabs-item-max-inline-size与自动文本/显式Tabs.Label支持hover/键盘溢出阅读，完整静态降级、默认/受控/Controller和正式包多引擎验收通过。默认segmented保持；line是同一Root/List/Tab/Panel的视觉配置：文字/图标状态色与字重保持，无外胶囊/内选中框，仅一个底部当前项标记，焦点环独立。受控/默认/完整Controller、方向键/disabled/Panel关联与keepMounted沿用，不创建宿主三范围状态或查询owner。合同见[Tabs](COMPONENTS.md#tabs)，固定正式包和实际已验范围见[验证记录](VALIDATION.md)；宿主须升级并显式接线，不猜API或加私有CSS。

### XUI-REQ-20261017-16：预览关闭后Sheet的第二次Escape（已定位为额外Tooltip层，非父弹层失效）

来源xAgent固定3.1.1 / `9a44a09906838c67eb9f59fb16abdec9ddfdbe6a`的会话文件Sheet→预览Dialog→回文件行→第二次Escape后Sheet仍可见，显式CloseButton正常。4.2.3 / `b5c770f`最新正式包独立差分：裸Button的第二次Escape正常关闭Sheet；加入与来源相同的ContextMenu.Trigger→Tooltip.Trigger→Button后，预览回焦点以trigger-focus打开Tooltip，第二次Escape只关闭Tooltip，第三次关闭Sheet。旧3.1.1同样如此。用事件原因、Tooltip可见/open、父Sheet确认状态及两次/三次关闭计数定位，未把导航确认finalFocus或Popover修复冒作本项修复。

本项无公共Overlay逻辑补丁或“已修复提交”；保留最上层逐个取消合同，增加正式组合示例/回归。完整可读名称无需重复Tooltip，必要补充说明则保留真实额外层级；接线见[Escape顺序](COMPONENTS.md#嵌套弹层与-tooltip-的-escape-顺序)。宿主仍需在其固定产物、lazy预览、实际页面和权限下复验；本库不修改xAgent，不宣称其产品负例已关闭。

### XUI-REQ-20261017-09：检查到初始化的共享认证外壳（4.1.0 / 3.1.0已实现，待宿主验收）

来源：xLead固定3.0.1 / `7722d385270426824e13ef1a47d85b7c6903fa31`；其startup的`auth(setup=true)`显式destroy检查AuthPage，再挂完整AdminSetupPage。旧公开声明没有可脱离外壳复用的初始化表单；这是公共组合缺口，产品节点连续性失败不等同于此前Disclosure受控时序缺陷。

现新增 `@coffeehc/xui-react/admin-setup` 与根入口的AdminSetupForm、Props和Handle；完整Page直接复用它。宿主保留同一个AuthPage，首次即省略form，在children切换检查/错误和Form；不套两层AuthPage或嵌套form，不复制密码/提交逻辑。既有AdminSetupController仍是唯一提交/结果owner，业务初始化API、权威状态、未知结果恢复及后续登录/导航归宿主。接口、slot与可运行示例见[组件合同](COMPONENTS.md#可组合初始化表单)，具体结果及限制见[验证记录](VALIDATION.md#可组合管理员初始化表单410--3102026-10-17)。本轮仅修改xui，不据库级样板宣称xLead或其他产品已升级验收。

### XUI-REQ-20261016-08：受控 Disclosure 展开后的即时内容聚焦（4.0.1 / 3.0.1已解决，待宿主验收）

来源：xLead固定 `b9753a4f43967c76f566eefdab38042d0423da18` / 3.0.0，公开 `Disclosure open/onOpenChange` 在父 effect 内仍隐藏，导致来源记录 `article tabIndex=-1` 立即focus失败。独立正式3.0.0消费者复现；主线4.0.1及兼容3.0.1将共享受控overlay/value/selection在当前render投影，提交后同步内部Controller，不引入定时器、DOM补丁或用户回调循环。默认/注入、取消、SSR和实际浏览器结果见[本轮验证](VALIDATION.md#受控交互的当前提交一致性401兼容回补3012026-10-16)。Select派生标签仍遵循peer生命周期；不能把此修复推广为所有Portal或动画都在父effect前完成。3.0.1不包含4.0迁移，不要求宿主跨主版本升级。本轮只修改xui，宿主安装、接线和实际来源跳转仍待其验证。

### XUI-REQ-20261016-07：侧栏与正文的逻辑方向分隔（1.3.1，验收记录见下）

来源：xAgent维护来件，宿主部署提交`b1f45be625e8b023d95f99cce9130b9009994f54`、固定xui `1a6772e4fcbf7be180c813e560d9d32538dabe20`/1.3.0，使用公共AppShell；其他区域使用MenuLayout。截图仅按来件登记，本轮没有访问或修改宿主页面。

旧正式包中桌面侧栏没有inline-end边线，独立消费者保存了展开/紧凑、LTR/RTL、100%/200%文字的16组几何，新边界断言在旧包上复现失败。1.3.1仅在已有桌面断点增加line-width-surface / separator-line逻辑边线，并从原末端padding中扣除同样线宽；保持外宽及内容净宽，不增分隔节点或resize handle。窄屏不应用该规则，仅保留既有Dialog外框；AppShell/MenuLayout共用同一CSS，React逻辑/portal/查询和业务owner不变。正式包与浏览器实际结果见[验证记录](VALIDATION.md)；不因此宣称xAgent已升级或现网页面已验收。

### XUI-REQ-20261016-06：公共交互状态的默认与完整Controller替换（3.0.0已实现，待宿主验收）

来源：xAgent维护来件，固定消费xui `1a6772e4fcbf7be180c813e560d9d32538dabe20`、DESIGN/三包1.3.0。按公开根入口逐项核对了105个React运行时导出及其组合部件，结果和分阶段建议集中在[状态所有权矩阵](COMPONENTS.md#状态所有权与-controller-模式)。这轮是源码/类型审查，不是所有组件双模式已具备的声明。

历史审查基线中，Menu.View与共享主题已有语义双模式；当时Calendar/DateTimePicker、Copyable、密码展示及多种组合交互仍缺少实例替换。当时ApiKey与两类日志是必填服务Controller注入，不能将其本地分页/未提交筛选草稿也声称为完整替换。Toast已支持公开toastManager动作入口，但peer Provider仍拥有真实toasts/timeout/focus状态，需先解决上游公开替换合同。handle、受控props和DOM ref分别按真实能力登记；宿主领域值/查询、React异常捕获及平台测量/加载不强造Controller。

2.0.0按[当前逐项矩阵](COMPONENTS.md#状态所有权与-controller-模式)落实组件默认/注入与展示/服务边界，正式验证见[记录](VALIDATION.md)。保留消费项目、认证/API协议与业务owner；基础 Service 的创建统一经应用注册表，组件 Controller 工厂仍按组件模型使用。Toast的集合、超时、关闭阶段仍未满足完整外部替换：peer公开Provider不接受集合/store，需要上游公开合同或正式升级，当前未使用私有store或第二队列绕过，因此当时本请求仍部分开放，不能宣称全组件达标。

3.0.0在用户明确授权后替换Toast内核：runtime `/toast` 公开唯一队列/时限/关闭阶段Controller，React Provider默认或完整注入，不读peer私有store、不保留竞争队列。新增Content/Actions排版、右上角、窄屏单项/40dvh上限，以及timeout -1保持、0/省略默认5秒。旧Base UI动作manager须迁至xui工厂，原组合名称保留；正式产物与各项验证见[记录](VALIDATION.md)。库能力已补齐，消费项目升级、接线与真实页面验收仍由各宿主负责。

### XUI-REQ-20261016-03：固定列与全表分割线一致（1.1.2已实现，待宿主验收）

来源：xAgent维护线程转交；宿主固定 `b700606624ae1453ce2796afdad2882dd938d9ee`、DESIGN/三包1.1.0，调用点为 `frontend/packages/business/src/features/sessions/components/session-list-table-columns.tsx`，操作列公开配置 `sticky: 'end'`。宿主地址及现象按反馈登记，未在本轮访问该产品。

登记时的 [公共table CSS](../packages/theme/src/table.css) 对固定列单独增加起止侧边框，其余列没有纵线，源码核对属实。原请求合同：全表采用一致的分割线策略，不能仅因sticky增加一条纵线；由公共默认或正式全表设置表达，保留固定列与横向滚动，不能靠取消sticky或消费方私有CSS掩盖。验收应覆盖普通/左/右/双侧固定、适用的统一行列线模式、三主题、长中文/窄屏/200%、横滚及空/加载/刷新，固定背景、焦点和分隔仍可辨，无重复边框。1.1.2已将公共默认统一为全表仅行线，移除sticky专属侧边框；保留原有位置、底色、交互及焦点合同，没有新增网格模式/开关，不要求取消sticky或添加宿主CSS。源码、正式包与浏览器验证见[分割线验收](VALIDATION.md#统一表格行分割线2026-10-16)。消费项目的升级、真实页面与部署仍待宿主自行验收。

### XUI-REQ-20261016-04：Dialog内Select选项被底栏遮挡（xui 1.3.0已解决，宿主仍待升级）

来源：本轮组件加载居中扩大回归。API Key创建页公开有效期SimpleSelect选择 `demo.never` 时，选项中心被 `.xui-dialog-footer` 截获，鼠标无法完成选择并超时。旧1.2.0正式独立包复现证据保存在 `.artifacts/public-followup/baseline/`。

1.3.0将同一 `selection.css` 源规则组合进 `critical.css` 与 `forms.css`；`floating.css` 保留 `selection + floating` 完整兼容分片。SimpleSelect定位、选项和指针命中不依赖消费方额外导入内部CSS，也不通过z-index补丁或强制点击规避。旧1.2.0的真实footer遮挡复现与1.3.0正式tarball的指针、键盘/Escape及嵌套浮层验收见[验证记录](VALIDATION.md)。消费项目需自行升级固定包并复验自己的Dialog组合；旧截图不是其页面已修复的证据。

### XUI-REQ-20261016-05：API Key 管理页的公开客户端分页（xui 1.3.0已实现）

请求是保留完整权威列表读取，同时让较长的 Key 列表在公共 DataTable 内分页。1.3.0的 `ApiKeyManagerProps.pagination` 接受 `false` 或 `{defaultPageSize?, pageSizeOptions?}`；默认页长10、选项10/25/50。分页只切分当前完整已确认的 `rows`，改变页或页长不触发adapter请求，显示的total只使用完整集合长度；刷新保留当前页范围并夹紧到有效页。`pagination={false}`保留全量表格显示。

该能力不创建服务端分页、查询、CRUD/controller或业务提交owner，不改变 `adapter.list` 的完整读取与HTTP合同；`tableLabels`仅覆盖公共DataTable标签。库级types、正式tarball与最终metadata范围浏览器结果见本轮[验证记录](VALIDATION.md)。API Key产品升级和真实密钥服务验收仍归消费项目；不要据此标记任何产品已完成迁移。

### XUI-REQ-20261017-20～22：启动释放入口、多行工具与窄屏导航（4.2.14）

来自 xQuant/xLead/xAgent 对固定4.2.13的消费证据，本轮只修公共库：

- 启动生命周期：`@coffeehc/xui-runtime/bootstrap` 正式导出同一个 `disposeXuiServices`，不再为释放 Window registry 导入全量 services。保留原根/聚合入口，不改变借用与 owned 归属；`app.services.dispose()` 不替代 Window registry 移除。
- SearchToolbar：允许 actions 直接控件或嵌套 Toolbar，普通 Field 控制边框和独立按钮按底边对齐；操作组多行不拉高高级筛选。长文案自然增高，含帮助/错误的复杂筛选放 advanced。
- AppShell/MenuLayout：导航 Drawer 默认贴边全宽全高、集中单层内距；sidebarTabs 独立轨道，List 仍拥有单一分隔基线；头尾/Tabs超预算时 Body 整体自然纵滚，主导航文字优先，辅助操作整组换行并限制累计缩进。保留四slot、同一树/Controller、字号/主题和焦点合同。

与 Stitch 对齐的文字契约、4.2.13同组合复现和正式包浏览器证据见 [VALIDATION](VALIDATION.md)。这是库级修复，三个消费项目仍须独立升级和实际页面复验，不能自动宣布其完成。

### XUI-REQ-20261017-23～26：链接、标准通知、模块资源与绘图颜色（4.2.15）

按本会话明确授权补齐四项按需公共能力：`/text-links` + UtilService + React LinkedText；同一 Controller 的 Toast.View/clear/scopeKey；既有 Resource 上的模块/CSS lease；同一 ThemeService 的 `/theme-colors` sRGB 读回/订阅。保留既有 API 与默认行为，无第二套皮肤、认证/查询/通知/主题 owner；没有修改 xLead 或其他消费项目。逐项边界、样例与采用检查见 [PUBLIC_API](PUBLIC_API.md#安全正文链接)、[COMPONENTS](COMPONENTS.md#linkedtexttoastview-与绘图资源4215)、[CAP清单](ADOPTION_CHECKLIST.md#可选公共能力逐项检查4215)。本轮不通知或要求其他项目必须升级，产品按需要独立采用并验收；库级结果见 [VALIDATION](VALIDATION.md)。

### XUI-REQ-20261017-27～29：紧凑导航揭示、页脚中心与更窄默认宽度（4.2.16）

xAgent 固定4.2.14（bbe98dd11caa29afc0b46388a2c6c83fa6bebd0b）反馈：compact无法临时查看完整名称；SidebarFooterRow/Toolbar的版本图标靠左；默认展开240–288px仍偏宽。4.2.15未涉及导航，三项均需公共实现。产品截图与schema校验fixture只作复现线索，不声称真实后端验收。

AppShell/MenuLayout新增默认开启的可选 sidebarRevealOnHover，临时覆盖而不改持久Controller/正文布局；slot派生公共portal参与焦点/指针归属，Escape按弹层→预览分层。页脚以实际呈现态控制同轴和36px最小按钮点击区，passive不改语义。宽度改16vw/192–224px并保留50vw封顶、60px compact和根Token覆盖。主线程与Stitch文本审查对齐方向；保留自然文本高和iconless事实全文，未采用固定两行高度或缩写事实的建议。验证记录见VALIDATION，消费项目升级与业务验收另行决定。

### XUI-REQ-20261017-30：可选透明文字动作与Disclosure外观（4.2.17）

xAgent维护线程在4.2.16导航产物冻结后补充：会话计划/工具次数需要可选、无默认/hover/pressed/expanded底色的轻量文字触发器，保留主题强调、真实button键盘与独立focus。当前Disclosure未公开外观/trigger槽，ghost/link仍有既有背景，不能让宿主穿透CSS或冒用link代替；普通Button/导航/菜单的默认背景不应全局删除。本项未纳入4.2.16；4.2.17以Button/Disclosure可选variant=text实现，默认外观和原状态owner保留，验证见VALIDATION。xAgent状态区、执行中Badge及输入上方状态属于宿主业务，不在此修改。

### XUI-REQ-20261017-31：透明导航与局部警告前景（4.2.17）

按用户最后收口，NavItem/NavigationItem/NavigationMenu/MenuLayout 提供可选 variant=text；条目可声明通用 tone=warning。透明矩阵覆盖 default/hover/pressed/selected/disabled；警告只改变本项文字/图标/指示线，不使用软底，不向分组、子项或配置按钮传播。config/MenuService 同步保留字段；不承接业务等待枚举、查询或路由 owner。未声明选项的默认外观不变。与 Stitch 完成文字合同核准，浏览器证据由 xui 正式独立消费者提供，不以设计确认代替实测；入口及接入逐项清单见 [PUBLIC_API](PUBLIC_API.md#透明导航与警告前景4217) 和 [NAV-TEXT](ADOPTION_CHECKLIST.md#可选透明导航逐项检查4217)。本轮仅 xui，不要求消费项目升级。

### XUI-REQ-20261017-32：纯图标按钮统一圆形（4.2.18）

xAgent固定4.2.17（9b0dc8f）转交公共视觉规则：现有纯图标按钮虽等宽高，仍继承文字button-radius，背景显示为圆角方块。库在已有data-icon="true"配方采用radius-full，不改尺寸、图标形状、状态语义或行为owner，IconButton自动采用，文字Button保持原样。消费项目现有公开Token圆角选择可在独立升级验收后移除；本轮不修改或通知任何消费项目。接口和验收见 [PUBLIC_API](PUBLIC_API.md#纯图标按钮轮廓4218)、CTRL-003及[VALIDATION](VALIDATION.md)。

同一请求补充的行内模型下拉已有4.2.17公开Button.text实现，未列为缺失API。本轮明确Menu.Trigger＋Button.text为推荐公共组合，并在同一正式示例验证透明/品牌前景、键盘关闭回焦和草稿保留；不增加同义Trigger或重写显式主/危险按钮、普通表单Select/Input。

用户随后将同一规则明确扩展到所有普通展开/收起入口。4.2.18对无自定义render的Menu.Trigger、Disclosure默认、Accordion、高级搜索与侧栏/表格内置展开采用共同透明/品牌前景配方，原Controller和焦点/命中不变；显式主/危险render、表单与导航链接选择不改。不是模型专用修补；默认变化及历史Disclosure显式选项见 [统一映射](DESIGN.md#展开与收起入口的统一呈现4218)。

同任务追加 XUI-REQ-20261017-33：4.2.17缺少透明危险按钮表达。4.2.18在Button/IconButton公开可选tone=default/danger，仅对text前景生效；同组表格操作各状态透明，删除保持危险前景，disabled为公共禁用语义。既有显式非text变体不改，不新增TableAction或业务owner。逐表接入由产品独立完成，本轮不修改消费项目。

### XUI-REQ-20261018-34：StructuredLogExplorer 查询布局与草稿动作（4.2.22）

xQuant反馈固定4.2.20：旧组合使用Disclosure/Grid，修改草稿后“清除筛选”会POST groups并清除已提交text；该按钮可能有意提交空范围，不能直接认定HTTP缺陷。本轮核对main4.2.21仍为该实现。4.2.22统一QueryForm/QueryField与公开pageToolbar，新增明确的零请求“重置草稿”，保留“清除筛选”为同一service的显式空范围查询。原Controller、HTTP/DTO、可选records、游标/快照和详情owner保持，未改xQuant。准确入口与动作见[组件合同](COMPONENTS.md#structuredlogexplorer-查询与槽位4222)，正式包与未验边界见[验证记录](VALIDATION.md)。
