# 公共能力维护清单

本页登记消费项目提交的公共能力缺口及核对结果，不定义另一份接口合同。当前仅维护以4.2.1为基准的单一版本线（当前4.2.3），后续递增末位；3.x兼容分发已退役，以下双版本记录只代表历史证据，不再回补或提供兼容包。下文是各条目原提交时的固定版本、现象与历史验证，不代表 2.0.0 产品已迁移或其最新状态。当前公开服务/配置/React入口以 [PUBLIC_API](PUBLIC_API.md) 与 [COMPONENTS](COMPONENTS.md) 为准；消费项目升级和逐页验收仍由各自仓库完成。待实现条目的建议字段不是现有 API。请求登记不代表已排期、实现或通过消费项目验收。

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

## 后续公开维护项（2026-10-16）

### XUI-REQ-20261017-14：移动导航与未保存确认后的焦点恢复（4.2.3，库级已验收、待宿主接线验收）

xLead原反馈固定3.1.0 / `31a54e5f2c0aca4552c629e4c7987f1208a97337`的390px独立正式消费者。最新4.2.2 / `7d037443b0744226f8364ea4a660692fed2e6e15`已独立复现：受控MenuLayout关闭抽屉、宿主AlertDialog取消后焦点为BODY；原链接已隐藏，抽屉不能抢走新确认框的焦点。

4.2.3公开AppShell/MenuLayout的`navigationTriggerRef?: React.Ref<HTMLButtonElement>`，宿主以既有AlertDialog.Content.finalFocus接到该稳定按钮；保留草稿回开关，放弃并继续可选择真实目的操作。支持对象/callback ref、React19 cleanup及响应式重排，不新增导航/草稿owner或私有DOM查询。**这是公开接线能力，宿主必须配置finalFocus；仅升级不会自动更改宿主确认框的恢复目标。** 三主题、窄屏、长中文、200%字号/真实Chrome缩放、取消/放弃、Escape与StrictMode库级通过；合同见[抽屉确认回焦](COMPONENTS.md#导航抽屉与未保存确认的最终焦点)，证据见[4.2.3记录](VALIDATION.md#导航抽屉确认回焦4232026-10-17)。本轮只修改xui，不回补3.x，不宣布xLead或其他产品已通过。

### XUI-REQ-20261017-15：同范围刷新不挤动内容（来源登记，待最新库复现）

xQuant反馈固定3.0.0 / `b9753a4f43967c76f566eefdab38042d0423da18`的正式独立组合：已确认空DataTable在ready→refreshing被LoadingState替换，高度188→180；320px非空表与ApiKeyManager底栏新增提示导致增高28px；StructuredLogExplorer新增取消按钮及提示在320px挤动过滤和数据区域。来源证据位于其refresh-layout.json；1280/390日志几何未失败。本轮未在最新4.2.2独立复现或修改实现，规范中的连续性目标不等于这些组合已经满足。待核对默认刷新呈现与公开扩展，保留首次读取、已确认空态、旧行/焦点、busy/取消、失败重试及分页，不以ready伪装refreshing或要求消费方私有CSS隐藏状态。

### XUI-REQ-20261017-13：管理员用户名宿主校验（4.2.1，库级已验收、待宿主验收）

来源xLead固定3.1.0 / `31a54e5f2c0aca4552c629e4c7987f1208a97337`：公共Form只校验非空，无法表达宿主字符/长度规则。4.2.1增加可选同步纯函数`validateUsername`，Form/Page与Controller共享字段错误、关联、聚焦与提交边界；不内置xLead正则，不修改值、认证或业务API。缺省仅非空，默认/注入互斥及未知结果锁定保持；合同见[用户名校验](COMPONENTS.md#宿主用户名校验)。正式包Chromium28项、Firefox/WebKit44项及单元/类型通过，详见[本轮记录](VALIDATION.md#管理员用户名校验与单一版本线4212026-10-17)。不提供3.x兼容包，宿主需按单一当前版本升级并独立验收。

### XUI-REQ-20261017-12：程序错误Explorer的中文表头与三态标签（4.1.2 / 3.1.2已修复，待宿主验收）

来源：xQuant固定3.0.0 / `b9753a4f43967c76f566eefdab38042d0423da18`，1280宽、324侧栏，长中文摘要使累计/匹配表头逐字竖排。最新4.1.1正式消费者同样复现累计表头5行；公开Props没有列宽入口，不是宿主遗漏配置。修复在Explorer表头及records三态标签采用既有完整词组角色；摘要保留主列最小宽度/自然换行，时间计数与操作保留单行，窄屏和大字由公共TableContainer横滚承接。未改Table全局样式、Token、DTO、cursor/as_of、查询/刷新/权限或认证逻辑。正式包结果见[验证记录](VALIDATION.md)，样板`/log-react/?long-labels`演示合成长标签。xQuant既有PG/HTTP/页面证据仅按来源登记，本轮不访问宿主API或替产品宣称验收通过。

### XUI-REQ-20261017-10：链接按钮hover文字对比度（4.1.1 / 3.1.1已修复，待宿主验收）

来源：xAgent固定3.0.0 / `b9753a4f43967c76f566eefdab38042d0423da18`，宿主报告浅色link Button在hover的普通文字对比度4.3460703117:1。本轮在独立正式4.1.0与3.1.0消费者复现4.346070311712855；3.0.0/3.1.0/4.1.0的正式button.css相同。修复只让link hover使用既有interaction-hover-foreground配对背景，保留默认主色、字体/尺寸、disabled/busy和button/link键盘语义；不改Token值、业务/认证或宿主CSS。具体范围见[验证记录](VALIDATION.md)。

### XUI-REQ-20261017-11：扁平Tabs变体（待设计与实现）

来源：xAgent请求无外胶囊底槽、文字及单底部选中指示的公开Tabs样式，保持默认/完整注入Controller、键盘与Panel节点连续。当前4.1.1/3.1.1的Tabs.List仅提供layout=content/equal，没有此公开视觉变体；拟议variant=line不是现有接口。本项单独登记，本次不修改Tabs或阻塞链接对比度补丁，不要求宿主私有CSS重画。

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
