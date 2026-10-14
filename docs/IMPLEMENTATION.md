# 通用基础实施与采用接口

完整通用规则仅在 [DESIGN.md](DESIGN.md)，当前版本 0.8.0（Precision Engineering Console）。本文件维护组件分层、实施映射、构建消费和宿主边界；全部正式入口由 [PUBLIC_API.md](PUBLIC_API.md) 索引。

## 组件层次与扩展原则

xui 按 **原子→组合→页面** 提供同一前端体系。这是贡献与采用的架构准则；完整通用视觉/交互规则与默认 token 来源仍仅为 [DESIGN.md](DESIGN.md)，本节说明真实实现如何分层，不复制另一套皮肤规则。

| 层次 | 当前公开实例 | 采用与扩展 |
| --- | --- | --- |
| 原子 | Button/IconButton、Input/Textarea、Checkbox/Radio/Switch、Field、Alert、公共 CSS | 直接采用公开 props/ref/render、标准元素和语义 token；图标按钮使用共享 IconButton，不新增竞争按钮/输入基础包 |
| 组合 | MenuLayout/NavigationMenu、公共 Toolbar/Grid/Table/DataRegion、Dialog/详情布局、HTTP/query/controller | 组合原子提供通用键盘、状态、反馈和布局。Table 不抽查询引擎，query 不抽领域业务；状态与后端 adapter 通过明确公开合同连接 |
| 页面 | AuthPage/createAuthPage纯认证布局、ConfigurableLoginPage/createLoginPage、ApiKeyManager/createApiKeyManager、BusinessLogExplorer/createBusinessLogExplorer | 填文案/品牌数据、选项、adapter/loader 与 callbacks 即可整页使用；页面内部复用下层相同控件与皮肤，业务不必手写页面 CSS |

普通需求优先完整页面或组合；特殊业务可用公开扩展点或组合基础控件。允许声明的 props/render/parts、受信任 renderer、数据配置和 callbacks；不依赖内部 DOM/伪元素或覆写内部皮肤。上层不得复制下层的状态、focus/motion/disabled 或默认色值 owner；缺能力先反馈或补公开接口，再补验收。全部实际入口与默认值见 [PUBLIC_API.md](PUBLIC_API.md)，不能把规划的注册/SSO/完整用户管理列作已存在页面。

业务流程、领域数据、业务页面和产品布局由宿主负责；领域 API、权限/tenant 与校验须可独立测试。xui 提供通用组件、公开组合、请求接入及 typed adapter/loader 边界。仅选用默认 HTTP client 或页面 adapter 时，服务须满足对应明确 wire 合同；宿主可通过 ResponseAdapter、ErrorResponseAdapter、ApiKeyAdapter 或 BusinessLogLoader 连接自己的领域接口，业务 API 迁移是宿主独立任务。页面所需前置见 [PAGE_APIS.md](PAGE_APIS.md)。

贡献与采用应能说明所属层次、复用下层的方式、公开扩展点和实际构建消费。合成页面通过不代表产品迁移通过。

## 包与正式入口

全部包 private、ESM；本地 npm pack 用于验证，不发布。没有 CommonJS、SSR hydration 或子树主题支持声明。

| 包 | 正式入口 | 职责 |
| --- | --- | --- |
| `@coffeehc/xui-theme` | 预构建 CSS、tokens 与按需样式分片 | 无框架依赖，完整及分片入口见 PUBLIC_API |
| `@coffeehc/xui-runtime` | 主题、DOM、resource、导航、HTTP/query、认证和页面 controllers/factories | 无框架依赖；模块可独立导入，init.js 是有副作用的同步经典脚本 |
| `@coffeehc/xui-react` | 公共组件及各能力子入口 | React、ReactDOM、Base UI、runtime 是 peers，不捆绑宿主实例，不隐式导入 CSS |

优先按能力导入，例如 `@coffeehc/xui-react/button`。根入口也经过 Button-only 最终输出贡献检查；sideEffects 标记不是验证替代品。theme 可用完整 style.css，或 tokens.css + base.css + 所需分片。不要将 style.css 和 critical.css 同时载入后又无意重复维护默认值。所有 CSS 都是打包后文件，无下游 Tailwind 扫描 node_modules 要求。

`design-default-css` 是唯一受控原始值来源。生成器检查 372 个变量、全部模式依赖图、前言摘要、产品覆盖和提取字节一致性。0.6.0新增四个头部/侧栏token；0.7.0增加68个公共文字根与集中设计参数，七组rem字号/行高由font-scale/line-height-scale派生，文字默认与0.6.0一致；用户追加的Dialog/Confirm/Sheet响应式宽度默认单列记录。0.8.0 的按钮 hover/pressed 沿既有 action-primary 语义配方派生，产品仅覆盖主色与成对文字即可继承各状态。来源元数据记录原文字CSS与每项规范变更，继续逆向核验原始文件SHA256。浮层 CSS 只允许 peer 提供的四个测量变量：available-height、anchor-width、toast-swipe-movement-x/y；它们不是品牌默认值或泛化缺失变量白名单。

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

foundation 两个参考页在首屏前读取一个宿主 JSON key，再以受控模式桥接；保留其他 JSON 字段，原始 ui.theme.mode 不被覆盖。无有效保存值时默认 dark，storage 不可用时保留内存选择；仅显式 system 在 matchMedia 不可用时生效 light。系统变化有单一监听。React useTheme 只订阅外部 owner，在 StrictMode 中不创建或销毁它。ESM 导入本身不读 DOM。

## React 公共组件

宿主通过公开的数据、状态、内容与事件 props 使用 React 组件；xui 提供其默认内部结构、样式、motion、focus 与可访问性行为。采用时不要求产品修改内部伪元素或补写选中皮肤。扩展通过该组件已公开的 props、部件/slots 和 theme 变量进行，当前项、路由及业务事实仍由宿主决定。菜单/布局已提供数据驱动接口；其他基础组件继续采用各自公开的 props 与部件。

| 能力 | API 与边界 |
| --- | --- |
| 布局 | AppShell、Container、Stack、Grid、PageHeader、Toolbar、Section。AppShell 有 skip link、桌面 sidebar、窄屏模态 drawer；一个 sidebar 树，resize 回到可见焦点。宿主拥有路由、选中、sidebarOpen/onSidebarOpenChange |
| 操作 | Button/IconButton 复用 Base UI Button，支持 ref、render、nativeButton、className 函数、事件取消；默认 type=button。aria-busy 与 disabled 独立，不自动防重。render 为链接且希望链接语义时明确 role=link；nativeButton=false 保持 peer 默认按钮语义 |
| 字段 | Field 每个一个 Input/Textarea/SimpleSelect 或 choice。controlId 是显式 owner；未给 controlId 时识别直接或结构包装内已知控件的 id。自定义复合控件用 controlId 显式关联。help/error/required/invalid/describedby 自动关联；readOnly/ref 保留 |
| 分组 | Fieldset 清除单字段上下文，独立 legend/help/error；Checkbox/Radio/Switch 各有自己的 label、name、checked/defaultChecked 和 onChange，不共用输入 id |
| 导航 | Nav/NavItem、Breadcrumbs、Pagination、Disclosure。Pagination/Disclosure 受控与非受控，宿主负责导航/数据；NavItem disabled 去 href 并阻止激活 |
| Tabs | Root/List/Tab/Panel 复用 peer；方向键/Home/End 仅适配跳过 disabled，保留手动/自动激活、loop、RTL/orientation、ref/render/className 函数和 Tab/List capture/bubble。preventBaseUIHandler 取消控件行为，preventDefault 仅取消浏览器默认 |
| 复合选择 | Select/Combobox 复用 peer generic Root，样式部件、Content portal/positioner/popup；受控、禁用、搜索空结果和取消仍由 peer/宿主负责。Positioner 测量通过 CSS，无 JS 色板 |
| 弹层 | Dialog、Sheet、AlertDialog、ContextMenu、Menu、Popover、Tooltip。Root/Trigger/Content/部件延续 peer 生命周期。Menu disabled 项可在 peer roving 顺序获得焦点但不能执行；原生 menu 跳过 disabled。Tooltip 增加 role 和描述 id，Root.contentId 可指定关联 id；外部 handle 触发器由宿主显式 aria-describedby 关联 |
| 通知 | Toast Provider/manager/Root/Content/Viewport/Close 等复用 peer。peer 支持 collapsed/expanded，关闭控件在展开状态可访问，宿主不能将必要错误仅放在消失通知中 |
| 表格 | Table/Container/Caption/Head/Body/Row/HeaderCell/Cell/SortButton，真实 table，striped/expandedRow、TableExpandedRow/ExpandButton、sticky start/end及显式stickyOffset，named overflow region，scope/aria-sort/selected 由宿主事实提供。无排序/选择/查询/虚拟化引擎 |
| 组合管理页 | ApiKeyManager、BusinessLogExplorer、StructuredLogExplorer 使用 runtime 共享 controller；原生 createApiKeyManager/createBusinessLogExplorer/createStructuredLogExplorer 生成完整结构。领域回调、日志 facade 接线、详情权限由宿主，详见 [API_KEY.md](API_KEY.md)、[BUSINESS_LOGS.md](BUSINESS_LOGS.md)、[LOGS.md](LOGS.md) |
| 配置登录页 | AuthPage/createAuthPage统一无请求的setup/启动/认证布局，完整ConfigurableLoginPage 与原生 createLoginPage内部复用它，并使用同一 auth/theme owner，默认动态视口居中的自然高度单列框，fullscreen沿用同一列结构并省略Surface皮肤，装饰 brandVisual 窄屏收起；正文/操作滚动区保留四边焦点安全空间；登录页无主题选择器，首屏沿已有 localStorage 偏好、无值默认 dark；公开品牌文案/logo/labels/安全回跳；内部复用基础控件/CSS；[认证页验收](VALIDATION.md#认证页验收)核对居中单框、文字层级、单主动作、局部反馈与真实截图。固定 Bearer v2 login/refresh/session/logout、私有内存access、明确protectedPaths、15秒预算、cookie恢复/跨tab协调与密码清理见 [AUTH.md](AUTH.md)；配套baseservice facade，真实产品接入另验 |
| 状态 | Surface/Alert、Badge/Skeleton/Spinner/Progress、Loading/Empty/ErrorState、DataRegion、RenderBoundary、useResource。错误/重试文字由宿主；render exception 重置不重试 Promise |

`Badge`、`BadgeProps` 与 `BadgeTone` 从 `@coffeehc/xui-react/feedback` 及根入口导出。`tone` 为 neutral/info/success/warning/error，默认 neutral；例如 `<Badge tone="success">运行正常</Badge>`。原生使用 `<span class="xui-badge" data-tone="success">运行正常</span>`，没有 Badge constructor。neutral、未设置 data-tone 与普通 Tag 保留无边框、无底色的被动文字；显式状态才应用语义前景/soft/line、横向间距和4px圆角。标签文字或图标由宿主表达状态，不自动增加 live region、tab stop 或脉冲。

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

目标是支持 HTML dialog、Popover、matchMedia、AbortController、ESM dynamic import 的现代浏览器。标准示例与默认采用遵循[公共封装政策](DESIGN.md#公共复用与状态矩阵)：SimpleSelect / bindSelectControl 使用主题选择浮层，搜索选择复用 Combobox / CommandPicker。NativeSelect 与显式平台 binding 仅保留独立平台合同；其 OS 面板不声明跨平台统一。隐藏 select 仍是封装内部的表单与事件桥。

菜单/布局的共享数据、导航适配、状态、键盘、生命周期与两类正式消费示例见 [NAVIGATION.md](NAVIGATION.md)。

## 加载 owner 与参考页

createResource({loader,isEmpty?,timeoutMs?}) 提供 idle/loading/refreshing/ready/empty/error/retrying、key/value/hasValue/error/busy/request。没有默认 timeout、请求/缓存或自动重试。load(key) 替换旧任务；同 key 刷新保留旧值，不同 key 清除旧对象；retry 是显式操作；cancel/destroy 即使生产者忽略 Abort，也结束本地等待并拒绝旧结果。回调重入以 generation 再检查，订阅异常不把数据成功改成错误。

useResource 只订阅；owner 放在宿主稳定生命周期，卸载时取消/销毁。loadStylesheet 创建的失败/取消 link 会清理，成功 link 由宿主拥有。

foundation-react/vanilla 提供列表、表单和详情，宿主仅有合成内存记录。备注/通知草稿由宿主保存；标题和新建/保存动作先可用。附加工具实际分成另一 ESM entry，点击后并行动态 import 和加载 floating.css；初次失败显式重试，刷新失败保留组件实例及选择，取消不挂载晚到面板。示例 5 秒 timeout 是宿主预算，不是通用库默认值。import 失败的重试示例使用不同 attempt URL，真实构建部署应由宿主定义版本/失效恢复策略。

## 本地与双仓联调

pnpm dev 监听规范、CSS、TS/TSX、包入口、lock/config 和构建脚本，每次启动新的构建进程；生成 CSS、ESM、types 和 init 后，构建全部预览。packages 和 examples 分别暂存、校验代际并回滚发布失败。watch-status.json 的 building/error/success 及 source/example SHA 是事实；错误时旧预览可能继续服务，不能称为新改动已生效。pnpm preview 另开本地服务，dev 不部署。

正式验收先 npm pack，再在独立目录安装、编译 types 和打包；foundation 不复制 shared/layout.css。dev 的包解析也仅指向正式 exports 的 dist，没有源码入口。生产接入固定已验证的提交/本地 tarball。双仓 watch 可让宿主链接 built dist，但 React/ReactDOM/Base UI 必须由宿主保留单实例；Vite 可使用 resolve.dedupe 与指向本地正式入口的 alias，或独立 tarball 安装。链接后检查实际解析路径、ESM/types/init 的当前 generation，并运行宿主构建/页面检查。采用项目自行核对真实配置和消费结果。

当前已实现数据驱动菜单/布局、无框架 HTTP、共享 query 和 [配置登录页](AUTH.md)；完整采用见 [ADOPTION.md](ADOPTION.md)，响应与查询合同见 [HTTP.md](HTTP.md)。API Key 通用管理见 [API_KEY.md](API_KEY.md)；可扩展业务日志见 [BUSINESS_LOGS.md](BUSINESS_LOGS.md)，默认 HTTP loader 的服务前置见 [PAGE_APIS.md](PAGE_APIS.md)；独立结构化错误查询见 [LOGS.md](LOGS.md)，其 v1 facade 由宿主提供；[仓库接入 skill](../.agents/skills/adopt-xui/SKILL.md) 与 [公开入口索引](PUBLIC_API.md) 可直接使用。领域路由、权限策略、身份凭据、产品 endpoint 后端、服务端会话、交易、表格引擎、图表/编辑器/3D 引擎仍由宿主负责。实际已验与未验范围见 [VALIDATION.md](VALIDATION.md)。

## 公共顶栏和布局区域

[布局slot矩阵](LAYOUT_SLOTS.md)固定context/auxiliary/account、sidebarHeader/Footer、pageHeader/Toolbar/content/Footer的角色、顺序和响应式合同。默认主题按钮复用runtime/theme owner与既有按钮；可选语言选择复用宿主i18n事实，不引入词典或持久化owner。React/native通过相同类型/表现配置，独立header-controls tarball消费者验证正式入口。CSS部件只用DESIGN语义var；无消费方定位尺寸补丁。

可折叠分组搜索使用正式 [GroupedCombobox / createGroupedCombobox](WIDGETS.md#groupedcombobox-与-disclosure)：一个搜索输入与 listbox，外置折叠/分页控件；不要把 Disclosure 或 Accordion 放进 Combobox.List，也不采用同 Root 两个 List。业务查询、取消、选择与各组分页状态保持宿主所有。Disclosure 默认箭头和原生 controller 的同等合同亦见该页。

### 富导航扩展

NavigationMenu 的 renderButton/renderAction 与原生 NavigationMenuDOMOptions 详见[富条目合同](NAVIGATION.md#富条目独立行尾动作与上下文菜单)。主链接/无href分支和辅助单button为 sibling，库承担 roving、继承禁用和 token 布局；不得在 renderLabel 中嵌入互动控件。原生 slots 按 id/kind/factory 保留 DOM 和 update/destroy，一次绑定一次清理；ContextMenu 使用公开 renderer/decorator，不复制内部导航结构。查询/独立cursor/hasMore、业务配置和写入由宿主拥有。

## 完整受控表格组合

DataTable系列使用正式/data-table与/data-table-dom入口，复用既有Table/Toolbar/Field/Pagination/DataRegion和page slots。共享DataTableLayout从runtime/data-table、runtime/data-table-dom、React/data-table与两包根导出。React DataTable/原生createDataTable默认layout='natural'，少量/零行按内容收缩，以max-block-size:100%对真实有界父级限高，只有表体滚动；auto高度父级中仍自然增长，不能凭百分比创造视口。显式workspace保持旧填满与最小高度，document即使在有界父级也不采用该上限。旧默认调用若依赖填满，须显式设置workspace；shell的公开内容区下限token与scrollMode默认不变。

内部toolbar、反馈、表体、footer统一在同一frame，外部pageToolbar仍可替代内部toolbar，同组筛选只放一处。统一计数/条数/Pagination footer和表体滚动属于库，data/columns/actions/rights/query仍由宿主提供；既有受控分页不建立第二个owner。本地分页由宿主切片并发布真实total/page facts，服务端分页使用确认响应且不二次切片；null total明确不启用编号分页。原生keyed row与cell slot.update/destroy保留生命周期，见[完整合同](DATA_TABLE.md)。库提供的 footer 不能证明采用项目已接入同一版本与组合。顶栏locale装饰箭头、无框状态与controls/account尺度见[顶栏控件](LAYOUT_SLOTS.md#顶栏相邻控件)。

## 局部失败反馈与离线边界

React DataRegion 只在调用方提供 feedback prop（包含 null）时常驻一个反馈槽；原生同角色使用公开 `.xui-feedback-slot`。共用 `--feedback-slot-block-size`，由已有字体/控件/内距/焦点 token 派生；错误完整保留，可在局部滚动并通过键盘访问动作。`.xui-reserved-action[data-inactive='true']` 仅隐藏辅助动作的绘制，调用方同时设置 aria-hidden、tabIndex=-1 与 disabled，不得保留不可见可交互控件。

DataTable 双端始终保留其状态行；登录页空反馈/隐藏动作不占位，实际消息自然增长，并用闲置/忙状态文案的实际尺寸约束主动作。API Key 与两类日志在页面局部显示请求反馈；原生列表只在实际顺序改变时移动 keyed 行，失败和同记录恢复不重建行控件。API Key 写入结果未知时读取普通列表一次，结束等待后允许用户手动再试，不自动重发写请求；瞬时 secret 释放、认证与权限规则见 [API_KEY.md](API_KEY.md)。

这保证已加载应用在请求失败时的结构稳定，不保证首次从未加载资源且完全离线时可用。核心主题 CSS/字体/图标不依赖远端 CDN，但宿主配置的 logo、图片或延迟模块仍依赖其资源可用性。不增加 Service Worker、凭据持久化或自动重放。实际验证范围见 [失败布局验证](VALIDATION.md#失败复验与限制)。


## 宿主边界

业务路由、业务页面与领域图形、权限策略、身份源、缓存/查询、防抖、交易、服务端会话、表格查询/虚拟化引擎、图表数据、富文本/代码编辑器和 3D 引擎归宿主。xui 的 HTTP、认证客户端与通用页面组合只承担各自公开合同，不接管产品业务或要求全量后端标准化。OAuth2/OIDC/SAML 和第三方接口遵守各自协议，在宿主明确边界适配。

正式采用应固定版本/SHA，核对公开布局和组件、主题单 owner、旧 CSS 层级及真实构建产物。SSR hydration 仅按组件明确支持的范围使用；真实移动 OS、读屏器、产品后端和生产性能由采用项目另验，不能由参考消费者推断通过。

## 规范来源

通用规范最初取自 [xagent@29139f7843d9a79a9eca42892cb87da8f08f6320 的 docs/DESIGN.md](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/docs/DESIGN.md)，来源版本为 0.4.0。当前默认主题为 Precision Engineering Console，规范版本 0.8.0；来源 SHA、可逆变更和受控 CSS 指纹由 [design-source.json](design-source.json) 记录，原始参考材料保留在 [Precision 来源](design-sources/precision-engineering-console.v1.txt) 与 [历史家族规范快照](design-sources/product-family-ui.0.7.0.txt)。历史指纹用于溯源，不代表当前实现已全部验收。

[生成器](../scripts/tokens.mjs) 从 DESIGN 的标记 CSS 提取产物并核对 token、依赖和来源；[合同测试](../tests/contract.test.mjs) 检查当前协议边界和原始规范逆重建。维护时同步当前合同元数据，保留历史来源与快照指纹。产品采用按 [ADOPTION.md](ADOPTION.md) 固定版本和自己的扩展，无需复制全文或历史实施流水。
