# 通用基础实施与采用接口

完整通用规则仅在 [DESIGN.md](DESIGN.md)，当前版本 0.7.0。架构分层仅在 [原子→组合→页面](FOUNDATION.md#组件层次与扩展原则)；本文件记录真实入口与实现映射，不维护另一套品牌默认值或架构哲学。

## 包与正式入口

全部包 private、ESM；本地 npm pack 用于验证，不发布。没有 CommonJS、SSR hydration 或子树主题支持声明。

| 包 | 正式入口 | 职责 |
| --- | --- | --- |
| `@coffeehc/xui-theme` | `style.css`、`tokens.css`、`components.css`、`critical.css`；`base/button/forms/navigation/feedback/dialog/layout/floating/table/auth/sheet.css` | 无框架依赖，预构建 CSS。critical 包含 token 和除 floating 外的组件样式 |
| `@coffeehc/xui-runtime` | 根、`/theme`、`/loading`、`/dom`、`/navigation`、`/menu-layout`、`/http`、`/download`、`/api-key-http`、`/operation-store`、`/business-log-http`、`/query`、`/auth`、`/entity-id`、`/login-dom`、`/api-key`、`/api-key-dom`、`/structured-log`、`/structured-log-dom`、`/business-log`、`/business-log-dom`、`/init.js` | 无框架依赖。各模块可独立导入；init 是有副作用的经典同步脚本 |
| `@coffeehc/xui-react` | 根；`/button/forms/navigation/menu-layout/tabs/dialog/sheet/alert-dialog/context-menu/feedback/layout/table/select/combobox/menu/popover/tooltip/toast/theme/login/api-key/structured-log/business-log` | React、ReactDOM、Base UI、runtime 是 peers；不捆绑宿主实例，不隐式引入 CSS |

优先按能力导入，例如 `@coffeehc/xui-react/button`。根入口也经过 Button-only 最终输出贡献检查；sideEffects 标记不是验证替代品。theme 可用完整 style.css，或 tokens.css + base.css + 所需分片。不要将 style.css 和 critical.css 同时载入后又无意重复维护默认值。所有 CSS 都是打包后文件，无下游 Tailwind 扫描 node_modules 要求。

`design-default-css` 是唯一受控原始值来源。生成器检查 343 个变量、全部模式依赖图、前言摘要、产品覆盖和提取字节一致性。0.6.0新增四个头部/侧栏token；0.7.0增加68个公共文字根与集中设计参数，七组rem字号/行高由font-scale/line-height-scale派生，文字默认与0.6.0一致；用户追加的Dialog/Confirm/Sheet响应式宽度默认单列记录。来源元数据记录原文字CSS与每项规范变更，继续逆向核验原始文件SHA256。浮层 CSS 只允许 peer 提供的四个测量变量：available-height、anchor-width、toast-swipe-movement-x/y；它们不是品牌默认值或泛化缺失变量白名单。

tokens.css 按规范声明 design-defaults → product-overrides → design-accessibility；组件声明位于独立的 xui-components 层。按 tokens.css 后组件样式的标准加载顺序，xui-components 首次出现于这三层之后。产品在 product-overrides 覆盖少量语义变量，design-accessibility 再落实 reduced-motion；本说明不另设 token 层或更改现有层契约。旧项目未分层 CSS 的普通声明高于所有分层声明，不能只靠导入顺序推断 xui 能覆盖旧样式。采用时显式决定旧 CSS 所在层或移除精确重复规则，再检查真实 computed style。产品覆盖在同一 document 根上；本版不支持子树独立主题。

## 主题单一所有者

无受控 mode 时 runtime 可以持久化，默认 key 为 ui.theme.mode；persist:false 完全使用内存。传入 mode 则完全受控，不隐式读写 storage。setMode 只请求 onModeChange，宿主确认后调用 syncMode；state.mode 保留用户选择，state.effective 是当前浅深结果。显式浅深不被系统变更覆盖。

首屏阻塞经典脚本置于 CSS 和可见内容之前；应用复用 window.xuiTheme。window.xuiThemeOptions 可在脚本前提供受控 mode/onModeChange 或 storageKey。data-storage-key 优先于 options key。重复 init 复用存活 owner；销毁后重新执行 init 才重建。宿主确认受控值时同时更新 options.mode，使以后重建使用最新事实。

```html
<script src="./theme-init.js" data-storage-key="ui.theme.mode"></script>
<link rel="stylesheet" href="./app.css">
```

```ts
const theme = window.xuiTheme;
const off = theme.subscribe(state => updateView(state));
// 卸载视图时 off()，文档所有者终止时 theme.destroy()。
```

foundation 两个参考页在首屏前读取一个宿主 JSON key，再以受控模式桥接；保留其他 JSON 字段，原始 ui.theme.mode 不被覆盖。storage/matchMedia 异常回退可用内存/light；系统变化有单一监听。React useTheme 只订阅外部 owner，在 StrictMode 中不创建或销毁它。ESM 导入本身不读 DOM。

## React 公共组件

宿主通过公开的数据、状态、内容与事件 props 使用 React 组件；xui 提供其默认内部结构、样式、motion、focus 与可访问性行为。采用时不要求产品修改内部伪元素或补写选中皮肤。扩展通过该组件已公开的 props、部件/slots 和 theme 变量进行，当前项、路由及业务事实仍由宿主决定。菜单/布局已提供数据驱动接口；其他基础组件继续采用各自公开的 props 与部件。

| 能力 | API 与边界 |
| --- | --- |
| 布局 | AppShell、Container、Stack、Grid、PageHeader、Toolbar、Section。AppShell 有 skip link、桌面 sidebar、窄屏模态 drawer；一个 sidebar 树，resize 回到可见焦点。宿主拥有路由、选中、sidebarOpen/onSidebarOpenChange |
| 操作 | Button/IconButton 复用 Base UI Button，支持 ref、render、nativeButton、className 函数、事件取消；默认 type=button。aria-busy 与 disabled 独立，不自动防重。render 为链接且希望链接语义时明确 role=link；nativeButton=false 保持 peer 默认按钮语义 |
| 字段 | Field 每个一个 Input/Textarea/NativeSelect 或 choice。controlId 是显式 owner；未给 controlId 时识别直接或结构包装内已知控件的 id。自定义复合控件用 controlId 显式关联。help/error/required/invalid/describedby 自动关联；readOnly/ref 保留 |
| 分组 | Fieldset 清除单字段上下文，独立 legend/help/error；Checkbox/Radio/Switch 各有自己的 label、name、checked/defaultChecked 和 onChange，不共用输入 id |
| 导航 | Nav/NavItem、Breadcrumbs、Pagination、Disclosure。Pagination/Disclosure 受控与非受控，宿主负责导航/数据；NavItem disabled 去 href 并阻止激活 |
| Tabs | Root/List/Tab/Panel 复用 peer；方向键/Home/End 仅适配跳过 disabled，保留手动/自动激活、loop、RTL/orientation、ref/render/className 函数和 Tab/List capture/bubble。preventBaseUIHandler 取消控件行为，preventDefault 仅取消浏览器默认 |
| 复合选择 | Select/Combobox 复用 peer generic Root，样式部件、Content portal/positioner/popup；受控、禁用、搜索空结果和取消仍由 peer/宿主负责。Positioner 测量通过 CSS，无 JS 色板 |
| 弹层 | Dialog、Sheet、AlertDialog、ContextMenu、Menu、Popover、Tooltip。Root/Trigger/Content/部件延续 peer 生命周期。Menu disabled 项可在 peer roving 顺序获得焦点但不能执行；原生 menu 跳过 disabled。Tooltip 增加 role 和描述 id，Root.contentId 可指定关联 id；外部 handle 触发器由宿主显式 aria-describedby 关联 |
| 通知 | Toast Provider/manager/Root/Content/Viewport/Close 等复用 peer。peer 支持 collapsed/expanded，关闭控件在展开状态可访问，宿主不能将必要错误仅放在消失通知中 |
| 表格 | Table/Container/Caption/Head/Body/Row/HeaderCell/Cell/SortButton，真实 table，striped/expandedRow、TableExpandedRow/ExpandButton、sticky start/end及显式stickyOffset，named overflow region，scope/aria-sort/selected 由宿主事实提供。无排序/选择/查询/虚拟化引擎 |
| 组合管理页 | ApiKeyManager、BusinessLogExplorer、StructuredLogExplorer 使用 runtime 共享 controller；原生 createApiKeyManager/createBusinessLogExplorer/createStructuredLogExplorer 生成完整结构。领域回调、日志拟议 facade、详情权限由宿主，详见 [API_KEY.md](API_KEY.md)、[BUSINESS_LOGS.md](BUSINESS_LOGS.md)、[LOGS.md](LOGS.md) |
| 配置登录页 | AuthPage/createAuthPage统一无请求的setup/启动/认证布局，完整ConfigurableLoginPage 与原生 createLoginPage内部复用它，并使用同一 auth/theme owner，默认整个动态视口左品牌/右表单（显式 card 保留旧卡片），窄屏上下布局，装饰 brandVisual 窄屏收起；正文/操作滚动区保留四边焦点安全空间；登录页无主题选择器，首屏沿已有 localStorage 偏好、无值默认 system；公开品牌文案/logo/labels/安全回跳；内部复用基础控件/CSS；[登录定量验收](LOGIN_VISUAL_ACCEPTANCE.md)核对身份/插画组合、32/40标题、400px表单、单主动作、局部反馈与真实截图。固定 Bearer v2 login/refresh/session/logout、私有内存access、明确protectedPaths、15秒预算、cookie恢复/跨tab协调与密码清理见 [AUTH.md](AUTH.md)；配套baseservice facade，真实产品接入另验 |
| 状态 | Surface/Alert、Badge/Skeleton/Spinner/Progress、Loading/Empty/ErrorState、DataRegion、RenderBoundary、useResource。错误/重试文字由宿主；render exception 重置不重试 Promise |

Dialog 关闭不会自动保存；移除触发器时指定 finalFocus。浮层非模态时不 trap 焦点，模态与取消/回焦点按 peer。Tooltip.Content 内只有说明，交互内容用 Popover。动画使用统一 motion token；reduced-motion 下状态立即变化。

NavItem 未提供 selected 时保留标准 aria-current；仅 aria-current="page" 默认匹配选中竖线、浅底与强调文字/图标。step/location/date/time/true/false 均保留各自 ARIA 语义，不自动转成 page 或选中样式。显式 selected 优先：true 输出 page，false 移除 aria-current，包括与传入 aria-current 矛盾时；这是原有 selected 调用的行为。宿主可只传 aria-current="page" 或 selected，不必同时提供，不需要手工设置 ::before。

NavItem 默认渲染原生 a，也支持公开 render 元素或回调。例如 `render={<RouterLink to="/settings" />}` 或 `render={(props,state)=><RouterLink {...props} to="/settings" />}`；RouterLink 是宿主选用的组件，xui 不依赖路由包。它必须透传合并后的 props/ref 到一个链接元素，不能嵌套链接或丢弃 xui class/ARIA/事件。元素方式合并双方 ref、class 和事件；回调方式扩展事件/class 时用 Base UI 的公开 mergeProps，并保留 props.ref。render 回调 state 为 selected/disabled/collapsed；当前项与 disabled 的顶层 props 优先，disabled 在 capture 阶段阻止点击、中键与 Enter 导航。

启用状态保留原生 href、修改键、中键、target 和 download 的浏览器语义。宿主路由链接必须先调用合并的 onClick，再检查 defaultPrevented，且只拦截自己支持的同源普通主键导航。xui 不把全部链接点击强制转换为客户端路由。正式最小消费者 tests/fixtures/nav-contract.tsx 演示这项接入；产品路由是否避免文档重载仍要由采用项目验证。

## 原生公共结构与 controllers

body 使用 xui 类；portal/原生顶层弹层用 xui-layer。公共 layout/table/form 类与 React 对应，无示例私有布局要求。语义结构、label/name、aria-sort、区域名字、键和业务值由宿主提供。

原生 JS 当前由宿主组合公开 HTML 结构、xui CSS 类及所需 controller；例如 a.xui-nav-item 设置 aria-current="page" 即获得同一默认选中样式。它与已封装的 React 组件有区别，不能据此声称全部原生控件只传数据即可生成完整结构。

数据驱动导航是单独的公开组合：createNavigationMenu/createMenuLayout 接收数据并生成整个菜单/布局，采用方无需拼装其内部菜单 HTML。登录/API Key/业务日志/独立错误观察也有公开完整原生 factory，见对应合同文档；其他基础控件仍用上方公共结构。下面说明菜单组合的契约。

| `/dom` API | 输入和所有权 |
| --- | --- |
| bindPressFeedback(root) | 仅 Enter/Space 按压状态，不合成 click；返回释放函数 |
| createDisclosureController(trigger,panel) | aria-controls/expanded、hidden；open/defaultOpen、onOpenChange 和 syncOpen |
| createTabsController(tablist) | 原生 role=tab 的 data-value/aria-controls；手动默认、自动激活可选、RTL/Home/End、disabled 跳过、受控 value/syncValue |
| createDialogController(dialog,trigger) | HTMLDialogElement showModal/close、Esc cancel、data-xui-close、可见 finalFocus；显式初始焦点在showModal前快照并临时拥有autofocus，兼容Chromium legacy与新算法；属性在finally完整恢复；浏览器模态加库 Tab 边界循环，迟到 close 事件不改变已重开弹层焦点 |
| createSheetController(dialog,trigger)/createAlertDialogController(dialog,trigger) | 复用原生Dialog lifecycle，Sheet逻辑side、AlertDialog角色与显式/安全初始焦点；最上层取消/Tab，不以确认关闭当业务成功 |
| createContextMenuController(trigger,popup) | 复用Popover/menu，rightclick、Shift+F10/ContextMenu、坐标与focus/取消；触屏长按无通用保证 |
| createPopoverController(trigger,popup) | 浏览器 Popover API、位置测量、外点/Esc、可选 menu/tooltip、受控 open/syncOpen；非模态不 trap |
| createShellController(root) | 查找 sidebar-toggle/sidebar-dialog/sidebar/sidebar-content/main，单一 sidebar 在窄屏移入 dialog，宽屏回原位置 |
| createToastController(viewport) | 纯文本通知、去重/限额、关闭、可选宿主 timeout、hover/focus 暂停并恢复；无默认自动消失 |

open/value 受控时仅发请求，宿主调用 syncOpen/syncValue 更新事实。onOpenChange/onValueChange details.cancel() 或取消可冒泡 xui:change 事件阻止请求。destroy 终止监听/定时器，宿主保管 controller。原生 menuitemcheckbox/radio 的 checked/value 由宿主更新，普通 menuitem 执行后关闭，检查项默认保留（data-close=true 可指定关闭）。

原生 Toast 的 hover 与内部 focus 都会暂停宿主指定的 timeout；两者都离开才恢复剩余时长，内部焦点迁移不恢复。计时使用所属 window 的 performance.now()，不受系统墙钟调整影响。当前不因 document.hidden 单独暂停，后台定时器调度由浏览器决定；必要事实和错误不能只放在自动消失通知中。

目标是支持 HTML dialog、Popover、matchMedia、AbortController、ESM dynamic import 的现代浏览器。原生 select/datalist 使用 OS 面板，datalist 允许自由输入且不是完整受控 Combobox；没有声明跨移动 OS 弹出实现一致。

菜单/布局的共享数据、导航适配、状态、键盘、生命周期与两类正式消费示例见 [NAVIGATION.md](NAVIGATION.md)。

## 加载 owner 与参考页

createResource({loader,isEmpty?,timeoutMs?}) 提供 idle/loading/refreshing/ready/empty/error/retrying、key/value/hasValue/error/busy/request。没有默认 timeout、请求/缓存或自动重试。load(key) 替换旧任务；同 key 刷新保留旧值，不同 key 清除旧对象；retry 是显式操作；cancel/destroy 即使生产者忽略 Abort，也结束本地等待并拒绝旧结果。回调重入以 generation 再检查，订阅异常不把数据成功改成错误。

useResource 只订阅；owner 放在宿主稳定生命周期，卸载时取消/销毁。loadStylesheet 创建的失败/取消 link 会清理，成功 link 由宿主拥有。

foundation-react/vanilla 提供列表、表单和详情，宿主仅有合成内存记录。备注/通知草稿由宿主保存；标题和新建/保存动作先可用。附加工具实际分成另一 ESM entry，点击后并行动态 import 和加载 floating.css；初次失败显式重试，刷新失败保留组件实例及选择，取消不挂载晚到面板。示例 5 秒 timeout 是宿主预算，不是通用库默认值。import 失败的重试示例使用不同 attempt URL，真实构建部署应由宿主定义版本/失效恢复策略。

## 本地与双仓联调

pnpm dev 监听规范、CSS、TS/TSX、包入口、lock/config 和构建脚本，每次启动新的构建进程；生成 CSS、ESM、types 和 init 后，构建全部预览。packages 和 examples 分别暂存、校验代际并回滚发布失败。watch-status.json 的 building/error/success 及 source/example SHA 是事实；错误时旧预览可能继续服务，不能称为新改动已生效。pnpm preview 另开本地服务，dev 不部署。

正式验收先 npm pack，再在独立目录安装、编译 types 和打包；foundation 不复制 shared/layout.css。dev 的包解析也仅指向正式 exports 的 dist，没有源码入口。生产接入固定已验证的提交/本地 tarball。双仓 watch 可让宿主链接 built dist，但 React/ReactDOM/Base UI 必须由宿主保留单实例；Vite 可使用 resolve.dedupe 与指向本地正式入口的 alias，或独立 tarball 安装。链接后检查实际解析路径、ESM/types/init 的当前 generation，并运行宿主构建/页面检查。这里没有更改任何产品仓库的配置。

当前已实现数据驱动菜单/布局、无框架 HTTP、共享 query 和 [配置登录页](AUTH.md)；完整采用见 [ADOPTION.md](ADOPTION.md)，响应与查询合同见 [HTTP.md](HTTP.md)。API Key 通用管理见 [API_KEY.md](API_KEY.md)；可扩展业务日志见 [BUSINESS_LOGS.md](BUSINESS_LOGS.md)，默认原生HTTP loader已实现，真实服务未集成；独立结构化错误查询见 [LOGS.md](LOGS.md)，其 v1 facade 是宿主后端待实现合同；[仓库接入 skill](../.agents/skills/adopt-xui/SKILL.md) 与 [公开入口索引](PUBLIC_API.md) 可直接使用。领域路由、权限策略、身份凭据、产品 endpoint 后端、服务端会话、交易、表格引擎、图表/编辑器/3D 引擎仍由宿主负责。未覆盖项和限制见覆盖矩阵与本轮验证记录。

## 公共顶栏和布局区域

[布局slot矩阵](LAYOUT_SLOTS.md)固定context/auxiliary/account、sidebarHeader/Footer、pageHeader/Toolbar/content/Footer的角色、顺序和响应式合同。默认主题按钮复用runtime/theme owner与既有按钮；可选语言选择复用宿主i18n事实，不引入词典或持久化owner。React/native通过相同类型/表现配置，独立header-controls tarball消费者验证正式入口。CSS部件只用DESIGN语义var；无消费方定位尺寸补丁。

可折叠分组搜索使用正式 [GroupedCombobox / createGroupedCombobox](GROUPED_SEARCH.md)：一个搜索输入与 listbox，外置折叠/分页控件；不要把 Disclosure 或 Accordion 放进 Combobox.List，也不采用同 Root 两个 List。业务查询、取消、选择与各组分页状态保持宿主所有。Disclosure 默认箭头和原生 controller 的同等合同亦见该页。

### 富导航扩展

NavigationMenu 的 renderButton/renderAction 与原生 NavigationMenuDOMOptions 详见[富条目合同](NAVIGATION.md#富条目独立行尾动作与上下文菜单)。主链接/无href分支和辅助单button为 sibling，库承担 roving、继承禁用和 token 布局；不得在 renderLabel 中嵌入互动控件。原生 slots 按 id/kind/factory 保留 DOM 和 update/destroy，一次绑定一次清理；ContextMenu 使用公开 renderer/decorator，不复制内部导航结构。查询/独立cursor/hasMore、业务配置和写入由宿主拥有。

## 完整受控表格组合

DataTable系列使用正式/data-table与/data-table-dom入口，复用既有Table/Toolbar/Field/Pagination/DataRegion和page slots。共享DataTableLayout从runtime/data-table、runtime/data-table-dom、React/data-table与两包根导出。React DataTable/原生createDataTable默认layout='natural'，少量/零行按内容收缩，以max-block-size:100%对真实有界父级限高，只有表体滚动；auto高度父级中仍自然增长，不能凭百分比创造视口。显式workspace保持旧填满与最小高度，document即使在有界父级也不采用该上限。旧默认调用若依赖填满，须显式设置workspace；shell的公开内容区下限token与scrollMode默认不变。

内部toolbar、反馈、表体、footer统一在同一frame，外部pageToolbar仍可替代内部toolbar，同组筛选只放一处。统一计数/条数/Pagination footer和表体滚动属于库，data/columns/actions/rights/query仍由宿主提供；既有受控分页不建立第二个owner。本地分页由宿主切片并发布真实total/page facts，服务端分页使用确认响应且不二次切片；null total明确不启用编号分页。原生keyed row与cell slot.update/destroy保留生命周期，见[完整合同](DATA_TABLE.md)。公共footer原本已在frame内，不证明旧XAgent已升级；本次不修改XAgent消费者。顶栏locale装饰箭头、无框状态与controls/account尺度见[顶栏控件](HEADER_CONTROLS.md)。

## 局部失败反馈与离线边界

React DataRegion 只在调用方提供 feedback prop（包含 null）时常驻一个反馈槽；原生同角色使用公开 `.xui-feedback-slot`。共用 `--feedback-slot-block-size`，由已有字体/控件/内距/焦点 token 派生；错误完整保留，可在局部滚动并通过键盘访问动作。`.xui-reserved-action[data-inactive='true']` 仅隐藏辅助动作的绘制，调用方同时设置 aria-hidden、tabIndex=-1 与 disabled，不得保留不可见可交互控件。

DataTable 双端始终保留其状态行；登录页保留反馈与辅助动作位置，并用闲置/忙状态文案的实际尺寸约束主动作。API Key 与两类日志在现有页面局部显示请求反馈；原生列表只在实际顺序改变时移动 keyed 行，失败和同记录恢复不重建行控件。API Key 未知写入仍失败关闭，瞬时 secret 释放规则、认证与权限撤销不变。

这保证已加载应用在请求失败时的结构稳定，不保证首次从未加载资源且完全离线时可用。核心主题 CSS/字体/图标不依赖远端 CDN，但宿主配置的 logo、图片或延迟模块仍依赖其资源可用性。不增加 Service Worker、凭据持久化或自动重放。实际验证范围见 [失败布局验证](ERROR_LAYOUT_VALIDATION.md)。
