# 通用基础实施与采用接口

完整通用规则仅在 [DESIGN.md](DESIGN.md)，当前版本 0.5.0。范围与验收见 [FOUNDATION.md](FOUNDATION.md)；本文件记录实现映射，不维护另一套品牌默认值。

## 包与正式入口

全部包 private、ESM；本地 npm pack 用于验证，不发布。没有 CommonJS、SSR hydration 或子树主题支持声明。

| 包 | 正式入口 | 职责 |
| --- | --- | --- |
| `@coffeehc/xui-theme` | `style.css`、`tokens.css`、`components.css`、`critical.css`；`base/button/forms/navigation/feedback/dialog/layout/floating/table.css` | 无框架依赖，预构建 CSS。critical 包含 token 和除 floating 外的组件样式 |
| `@coffeehc/xui-runtime` | 根、`/theme`、`/loading`、`/dom`、`/navigation`、`/menu-layout`、`/http`、`/query`、`/api-key`、`/api-key-dom`、`/structured-log`、`/structured-log-dom`、`/business-audit`、`/business-audit-dom`、`/init.js` | 无框架依赖。各模块可独立导入；init 是有副作用的经典同步脚本 |
| `@coffeehc/xui-react` | 根；`/button/forms/navigation/menu-layout/tabs/dialog/feedback/layout/table/select/combobox/menu/popover/tooltip/toast/theme/api-key/structured-log/business-audit` | React、ReactDOM、Base UI、runtime 是 peers；不捆绑宿主实例，不隐式引入 CSS |

优先按能力导入，例如 `@coffeehc/xui-react/button`。根入口也经过 Button-only 最终输出贡献检查；sideEffects 标记不是验证替代品。theme 可用完整 style.css，或 tokens.css + base.css + 所需分片。不要将 style.css 和 critical.css 同时载入后又无意重复维护默认值。所有 CSS 都是打包后文件，无下游 Tailwind 扫描 node_modules 要求。

`design-default-css` 是唯一受控原始值来源。生成器检查 271 个变量、全部模式依赖图、前言摘要、产品覆盖和提取字节一致性。浮层 CSS 只允许 peer 提供的四个测量变量：available-height、anchor-width、toast-swipe-movement-x/y；它们不是品牌默认值或泛化缺失变量白名单。

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
| 弹层 | Dialog、Menu、Popover、Tooltip。Root/Trigger/Content/部件延续 peer 生命周期。Menu disabled 项可在 peer roving 顺序获得焦点但不能执行；原生 menu 跳过 disabled。Tooltip 增加 role 和描述 id，Root.contentId 可指定关联 id；外部 handle 触发器由宿主显式 aria-describedby 关联 |
| 通知 | Toast Provider/manager/Root/Content/Viewport/Close 等复用 peer。peer 支持 collapsed/expanded，关闭控件在展开状态可访问，宿主不能将必要错误仅放在消失通知中 |
| 表格 | Table/Container/Caption/Head/Body/Row/HeaderCell/Cell/SortButton，真实 table，named overflow region，scope/aria-sort/selected 由宿主事实提供。无排序/选择/查询/虚拟化引擎 |
| 组合管理页 | ApiKeyManager、BusinessAuditExplorer、StructuredLogExplorer 使用 runtime 共享 controller；原生 createApiKeyManager/createBusinessAuditExplorer/createStructuredLogExplorer 生成完整结构。领域回调、日志拟议 facade、详情权限由宿主，详见 [API_KEY.md](API_KEY.md)、[BUSINESS_AUDIT.md](BUSINESS_AUDIT.md)、[LOGS.md](LOGS.md) |
| 状态 | Surface/Alert、Badge/Skeleton/Spinner/Progress、Loading/Empty/ErrorState、DataRegion、RenderBoundary、useResource。错误/重试文字由宿主；render exception 重置不重试 Promise |

Dialog 关闭不会自动保存；移除触发器时指定 finalFocus。浮层非模态时不 trap 焦点，模态与取消/回焦点按 peer。Tooltip.Content 内只有说明，交互内容用 Popover。动画使用统一 motion token；reduced-motion 下状态立即变化。

NavItem 未提供 selected 时保留标准 aria-current；仅 aria-current="page" 默认匹配选中竖线、浅底与强调文字/图标。step/location/date/time/true/false 均保留各自 ARIA 语义，不自动转成 page 或选中样式。显式 selected 优先：true 输出 page，false 移除 aria-current，包括与传入 aria-current 矛盾时；这是原有 selected 调用的行为。宿主可只传 aria-current="page" 或 selected，不必同时提供，不需要手工设置 ::before。

NavItem 默认渲染原生 a，也支持公开 render 元素或回调。例如 `render={<RouterLink to="/settings" />}` 或 `render={(props,state)=><RouterLink {...props} to="/settings" />}`；RouterLink 是宿主选用的组件，xui 不依赖路由包。它必须透传合并后的 props/ref 到一个链接元素，不能嵌套链接或丢弃 xui class/ARIA/事件。元素方式合并双方 ref、class 和事件；回调方式扩展事件/class 时用 Base UI 的公开 mergeProps，并保留 props.ref。render 回调 state 为 selected/disabled/collapsed；当前项与 disabled 的顶层 props 优先，disabled 在 capture 阶段阻止点击、中键与 Enter 导航。

启用状态保留原生 href、修改键、中键、target 和 download 的浏览器语义。宿主路由链接必须先调用合并的 onClick，再检查 defaultPrevented，且只拦截自己支持的同源普通主键导航。xui 不把全部链接点击强制转换为客户端路由。正式最小消费者 tests/fixtures/nav-contract.tsx 演示这项接入；产品路由是否避免文档重载仍要由采用项目验证。

## 原生公共结构与 controllers

body 使用 xui 类；portal/原生顶层弹层用 xui-layer。公共 layout/table/form 类与 React 对应，无示例私有布局要求。语义结构、label/name、aria-sort、区域名字、键和业务值由宿主提供。

原生 JS 当前由宿主组合公开 HTML 结构、xui CSS 类及所需 controller；例如 a.xui-nav-item 设置 aria-current="page" 即获得同一默认选中样式。它与已封装的 React 组件有区别，不能据此声称全部原生控件只传数据即可生成完整结构。

数据驱动导航是单独的公开组合：createNavigationMenu/createMenuLayout 接收数据并生成整个菜单/布局，采用方无需拼装其内部菜单 HTML。API Key/业务审计/独立错误观察也有公开完整原生 factory，见对应合同文档；其他基础控件仍用上方公共结构。下面说明菜单组合的契约。

| `/dom` API | 输入和所有权 |
| --- | --- |
| bindPressFeedback(root) | 仅 Enter/Space 按压状态，不合成 click；返回释放函数 |
| createDisclosureController(trigger,panel) | aria-controls/expanded、hidden；open/defaultOpen、onOpenChange 和 syncOpen |
| createTabsController(tablist) | 原生 role=tab 的 data-value/aria-controls；手动默认、自动激活可选、RTL/Home/End、disabled 跳过、受控 value/syncValue |
| createDialogController(dialog,trigger) | HTMLDialogElement showModal/close、Esc cancel、data-xui-close、可见 finalFocus；浏览器模态加库 Tab 边界循环，迟到 close 事件不改变已重开弹层焦点 |
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

pnpm dev 监听规范、CSS、TS/TSX、包入口、lock/config 和构建脚本，每次启动新的构建进程；生成 CSS、ESM、types 和 init 后，构建十个预览。packages 和 examples 分别暂存、校验代际并回滚发布失败。watch-status.json 的 building/error/success 及 source/example SHA 是事实；错误时旧预览可能继续服务，不能称为新改动已生效。pnpm preview 另开本地服务，dev 不部署。

正式验收先 npm pack，再在独立目录安装、编译 types 和打包；foundation 不复制 shared/layout.css。dev 的包解析也仅指向正式 exports 的 dist，没有源码入口。生产接入固定已验证的提交/本地 tarball。双仓 watch 可让宿主链接 built dist，但 React/ReactDOM/Base UI 必须由宿主保留单实例；Vite 可使用 resolve.dedupe 与指向本地正式入口的 alias，或独立 tarball 安装。链接后检查实际解析路径、ESM/types/init 的当前 generation，并运行宿主构建/页面检查。这里没有更改任何产品仓库的配置。

当前已实现数据驱动菜单/布局、无框架 HTTP 和共享 query；完整采用见 [ADOPTION.md](ADOPTION.md)，响应与查询合同见 [HTTP.md](HTTP.md)。API Key 通用管理见 [API_KEY.md](API_KEY.md)；可扩展业务审计见 [BUSINESS_AUDIT.md](BUSINESS_AUDIT.md)，真实后端仅接显式 loader，未实现服务；独立结构化错误查询见 [LOGS.md](LOGS.md)，其 v1 facade 是宿主后端待实现合同；[仓库接入 skill](../.agents/skills/adopt-xui/SKILL.md) 与 [公开入口索引](PUBLIC_API.md) 可直接使用。领域路由、权限策略、身份凭据、产品 endpoint、会话、交易、表格引擎、图表/编辑器/3D 引擎仍由宿主负责。未覆盖项和限制见覆盖矩阵与本轮验证记录。
