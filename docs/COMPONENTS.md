# 组件手册

按当前任务查阅下列章节。正式入口与类型见 [PUBLIC_API](PUBLIC_API.md)，默认视觉值与状态要求只由 [DESIGN](DESIGN.md) 定义；已执行与未测范围统一见 [VALIDATION](VALIDATION.md)。`@coffeehc/xui-react` 是唯一公共 UI；runtime 只提供 TypeScript service、model、parser、theme 与工具，不再导出DOM UI factories/controllers。该 breaking removal 不表示 XQuant、XLead 等消费项目已完成 React 迁移；当前产品页须按各自授权逐项接入和验收。

项目自己的业务组合和布局按 [私有组合组件设计方法](DESIGN.md#项目私有组合组件的设计方法) 与 [页面信息呈现方法](DESIGN.md#首屏信息架构与信息密度) 设计，再从本手册选择已有能力；项目布局样式与公共控件内部皮肤分别由各自所有者维护。实施前按 [槽位架构](DESIGN.md#页面与组件的槽位架构)逐一填写内容归属，并执行 [接入检查清单](ADOPTION_CHECKLIST.md)。

4.2.41 保留 Button 模块的初始化：包的 sideEffects 白名单仅包含 dist/button.js，防止根入口静态重导出与面包屑异步菜单共享该模块时，bundler 保留组件函数却裁掉 React/peer 初始化。窄入口及 D3 按需裁剪仍由正式消费者体积和依赖图门禁核对，宿主无需自加初始化或复制组件。

按章节查阅：

- [界面缩放](#界面缩放)
- [应用服务启动与所有权](#应用服务启动与所有权)
- [基础组件与通用状态](#基础组件与通用状态)
- [局部反馈与离线](#局部反馈与离线)
- [文本输入](#文本输入)
- [密码输入](#密码输入)
- [成组选项](#成组选项)
- [选择与复合控件](#选择与复合控件)
- [展示与媒体](#展示与媒体)
- [布局与顶栏](#布局与顶栏)
- [表单与页面编排](#表单与页面编排)
- [导航与菜单](#导航与菜单)
- [弹层与工具栏](#弹层与工具栏)
- [数据表格](#数据表格)
- [公共图表](#公共图表)
- [登录与管理员表单](#登录与管理员表单)

## 界面缩放

统一调用 `setInterfaceScale(scale)`，scale取 `1 | 1.25 | 1.5 | 2`（`@coffeehc/xui-runtime/theme` 或runtime根入口）。这是无框架依赖的文档方法，不增加React副本、控件或比例订阅owner。默认100%，设置后写sessionStorage，正式init.js只在首屏恢复根元素缩放属性；bootstrap以config的scale作为无存储时默认值。字体、图标、rem间距与控件随倍率调整；视口上限、自动分列、滚动与焦点合同继续生效。值和异常边界见[DESIGN](DESIGN.md#公共界面缩放)。[React示例](../examples/page-composition-react/app.tsx)演示正式入口。

## 应用服务启动与所有权

浏览器 React 应用在首次 render 前调用一次 `bootstrap(overrides, environment)`，只建立配置和首绘主题/缩放/语言。业务按模块导入 `HTTPService/AuthService/MenuService/RouteService` 等稳定单例引用；实现随窄模块加载，首用从同一注册表读取已解析配置。不导入整个 `/services` 来获得单个功能。保留的容器 getter 要求相应模块已加载；SSR/隔离测试使用显式 `XuiServices`，借用的服务不由 View 销毁。完整依赖、4.0 迁移、失败安装回滚和认证安全边界见 [PUBLIC_API](PUBLIC_API.md#按模块导入的单例与-40-迁移)。

registry只销毁自己由 options 构造的实例，`{instance}` 注入的是借用服务；React View/provider卸载只退订，不销毁共享应用owner。默认HTTP/Auth在配置允许时复用同一个HTTP实例；没有配置HTTP/Auth时getter显式失败，auth未启用不创建认证owner。剪贴板注入使用窄类型 `SharedClipboardService`，只需实现 `writeText`；借用实例不要求也不会调用 `dispose`，注册表只释放自己创建的内部服务。组件 `create*Controller` 是语义组件模型工厂，仍由创建者按[Controller矩阵](#状态所有权与-controller-模式)管理；它与已移除的基础 Service factories不同。

`init.js` 只做首绘前主题/缩放属性恢复；应用 Controller由bootstrap/getThemeService提供。config中的theme mode/scale是默认，sessionStorage有效偏好优先。`ServicesProvider` 可把已创建的menu/i18n owner传给React树，`RouteProvider` 可传同一个RouteService；它们不创建业务API、翻译词典或第二份服务。
公共组件不各自选择色板：MenuLayout、DataTable、Field、Card、Sheet、Menu 与 Toast 都继承同一文档的语义色。项目用 `theme.preset` 选官方配色或在 product-overrides 定义品牌，不给每个组件额外传颜色来拼整套主题。`ThemeService.setPreset` 与 `useTheme` 保持同一 owner；切换时保留打开的弹层、输入、焦点和滚动，见[配色示例](../examples/theme-presets-react/app.tsx)与[首绘合同](PUBLIC_API.md#项目配色与首绘)。



受控 React props 是本次 render 已确认的事实：Disclosure 的 open、Tabs/Accordion 的 value、Select/Combobox 的 value/open/inputValue 在当前提交反映，不等待外部 store 的 layout 同步后二次渲染。宿主的 layout/passive effect 因此可读取确认后的 Disclosure 可见性、Tabs 当前项、Combobox 输入和 Select 原生 form value；Disclosure 展开后可直接把焦点交给内容，无需定时器。Select.Value 的派生标签、Portal 挂载和动画仍遵循 peer 生命周期，不承诺父 effect 内所有派生文本均已完成。Controller 的提交后同步不产生用户回调；注入完整 Controller 时仍只订阅该实例，不应用另一份 props 状态。

## 基础组件与通用状态

### React 公共组件

宿主通过公开的数据、状态、内容与事件 props 使用 React 组件；xui 提供其默认内部结构、样式、motion、focus 与可访问性行为。采用时不要求产品修改内部伪元素或补写选中皮肤。扩展通过该组件已公开的 props、部件/slots 和 theme 变量进行，当前项、路由及业务事实仍由宿主决定。菜单/布局已提供数据驱动接口；其他基础组件继续采用各自公开的 props 与部件。

| 能力 | API 与边界 |
| --- | --- |
| 操作 | Button/IconButton 复用 Base UI Button，支持 ref、render、nativeButton、className 函数、事件取消；默认 type=button。aria-busy 与 disabled 独立，不自动防重。render 为链接且希望链接语义时明确 role=link；nativeButton=false 保持 peer 默认按钮语义 |
| 字段 | Field 每个一个 Input/Textarea/SimpleSelect 或 choice。controlId 是显式 owner；未给 controlId 时识别直接或结构包装内已知控件的 id。自定义复合控件用 controlId 显式关联。help/error/required/invalid/describedby 自动关联；readOnly/ref 保留 |
| 分组 | Fieldset 清除单字段上下文，独立 legend/help/error；Checkbox/Radio/Switch 各有自己的 label、name、checked/defaultChecked 和 onChange，不共用输入 id |
| Tabs | Root/List/Tab/Panel 复用 peer；方向键/Home/End 仅适配跳过 disabled，保留手动/自动激活、loop、RTL/orientation、ref/render/className 函数和 Tab/List capture/bubble。preventBaseUIHandler 取消控件行为，preventDefault 仅取消浏览器默认 |
| 复合选择 | Select/Combobox 复用 peer generic Root，样式部件、Content portal/positioner/popup；受控、禁用、搜索空结果和取消仍由 peer/宿主负责。Positioner 测量通过 CSS，无 JS 色板 |
| 弹层 | Dialog、Sheet、AlertDialog、ContextMenu、Menu、Popover、Tooltip。Root/Trigger/Content/部件延续 peer 生命周期。Menu disabled 项可在 peer roving 顺序获得焦点但不能执行；peer roving 顺序仍允许 disabled menu item 获得焦点，但不能执行。Tooltip 增加 role 和描述 id，Root.contentId 可指定关联 id；外部 handle 触发器由宿主显式 aria-describedby 关联 |
| 通知 | Toast Provider/controller/Root/Content/Viewport/Close 使用同一个 xui 语义队列；默认右上角，Content/Actions统一文字/末行动作排版，窄屏或大字收敛最新一项，焦点/悬停展开和暂停，必要错误原位持续。Button/render/锚定几何复用 Base UI 公开入口 |
| 状态 | Surface/Alert、Badge/Skeleton/Spinner/Progress、Loading/Empty/ErrorState、DataRegion、RenderBoundary、useResource。错误/重试文字由宿主；render exception 重置不重试 Promise |

SimpleSelect 可选 `placeholder?: string` 只在没有选中项时显示提示，不向原生 select、FormData 或 onChange 增加虚构值；`multiple value={[]}` 仍表示空选择。省略时保留原有显示。StructuredLogExplorer 的多选筛选使用可翻译的 `labels.all`（可选，缺省 `All`），空选择表示不过滤，切换文字不发起查询；中文示例配置为“全部”。明确选择的空字符串 option 仍显示该 option 的标签。

### 统一内置页面 Demo（4.2.41）

[统一 Demo](../examples/pages-react/app.tsx) 的 7 类内置页面直接使用完整公共组合；只有 mock 场景、品牌与数据输入归示例。嵌入模式沿用外层导航、主题和阅读比例，不再增加第二个 Shell 或主题按钮。登录成功后的示例目标页也使用公共 Container/Stack/PageHeader；退出调用当前认证 owner。

| 页面 | 重点 slot/布局与状态 |
| --- | --- |
| API Key | PageHeader 动作、独立 key 列、DataTable 状态/分页、Dialog 字段与 footer；初次读取/空/失败恢复、刷新保行、创建/编辑/撤销/删除防重、一次性结果及关闭清理 |
| 业务日志 | QueryForm 的 fields/advanced/actions/summary、列表/游标、详情正文与 footer；草稿与已提交范围分离，空/错误/取消/迟到、快照与详情回焦 |
| 结构化错误日志 | pageToolbar、QueryForm/QueryField、分组/记录、详情；空多选明确显示“全部”，重置草稿零请求，清除筛选提交一次，复制只出 Toast |
| 模型配置 | 页面动作、Card/Fieldset/FormGrid、目录、FormActions、Sheet 确认；目录空/错误保手动输入，loading 图标不留闲置空槽，只读/禁用、取消和保存结果未知 |
| 用户登录 | 同一个 AuthPage 品牌/正文/动作/反馈；字段错误、拒绝/等待/成功与回到登录，保留用户名、清理密码，不增加认证 owner |
| 管理员初始化 | AuthPage + AdminSetupForm；字段关联、密码确认、提交防重、未确认锁定、手动只读核对与完成；不推断 BaseService 初始化端点 |
| 修改密码 | AuthPage + PasswordChangeForm；旧/新/确认字段、错误/等待/结果未知/完成；成功要求重登，保留原 PUT、Bearer、omit/no-store 与敏感值清理 |

API Key 与两类日志示例支持 `initial-list=hold|empty|error` URL 参数，供预览首次加载、空数据和初次失败；使用各自已有 mock 和 Controller，不是公共业务参数，也不发起真实后端请求。原 `window.*Demo` 检查入口可释放等待或恢复 mock。认证的持续错误与未知结果留在原反馈区域；临时复制结果使用下面的 Toast 合同，不将关键状态仅藏进通知。

ApiKeyManager 一次性值复制与 StructuredLogExplorer 标识复制统一复用公共 Toast。默认组件提供自己的通知队列和 View；已有宿主通知队列时传可选 `toastController`，由宿主渲染同一队列的一个 `Toast.View`。复制中保留原控制状态，成功/失败不插入正文块，不改变列表/弹窗尺寸或请求 owner；原始复制值不进入通知。精确订阅原 copyStatus 转换，连续快速复制也各有反馈，关闭/销毁后的迟到结果不再通知。Toast 常驻通知区域在模态打开时保持可播报，各条 Root 决定 polite/assertive，不解除页面的模态隔离或抢走表单焦点。

### 统一基础组件 Demo（4.2.41）

[统一 Demo](../examples/pages-react/app.tsx) 的基础组件入口逐项展示下列组合。状态只使用组件实际支持的公共合同；例如 SimpleSelect 没有只读模式，已确认值使用只读 Input，菜单通过权限禁用修改动作。图表与其他基础组件一起在 4.2.41 定版。

| 面板 | 常用组合与适用状态 |
| --- | --- |
| 按钮与操作 | 前置/后置图标、尺寸、IconButton；loading 显示 Spinner 并显式 disabled 防重，非 loading 不留空图标槽 |
| 表单与选择 | QueryForm/QueryField、FormGrid、InputGroup、选择/搜索/勾选组、日期时间、Calendar、密码；正常、禁用、只读和关联错误，查询草稿重置不清除已生效条件 |
| 状态与进度 | Badge/Alert、定值/未知 Progress、骨架、加载/空/错误与重试、保留内容刷新、Toast；临时反馈不占页面流 |
| Tabs 与容器 | line/segmented Tabs、Card 各 slot、MetricCard、CardGroup、Disclosure/Accordion；有表单草稿的 Tabs.Panel 显式使用公开 keepMounted，保留默认 peer 生命周期 |
| 弹窗与浮层 | Dialog/Sheet 的字段、SimpleSelect 与 footer 组合；加载、只读、错误修正、禁用，嵌套 Escape 和关闭回焦；Popover/Tooltip/AlertDialog |
| 菜单与操作配置 | 普通/配置菜单、勾选/单选/危险项、ContextMenu、NavigationMenu；加载、失败重试和权限禁用 |
| 文字与媒体 | Typography 角色、Icon/Avatar/Tag、复制各状态、图片失败恢复、可聚焦 ScrollArea；复制使用合成 writer，不宣称真实剪贴板验收 |
| 数据表格 | SearchToolbar search/actions、单一 Resource、真实名称排序、受控分页/列宽；首次加载、刷新保行/草稿、空/无匹配、错误恢复、禁用与只读，横滚归表格 |
| 文件上传 | 合成 HTTP 与文件；待上传、上传中、成功、禁用、只读、未知结果和校验失败；不编造上传百分比 |
| 面包屑 | 数据/具名 slot、长路径省略、禁用、只读、语言切换、加载/错误/空路径；两种组合复用示例导航回调，避免 iframe 内嵌套整页 |
| 走马灯 | 卡片/图片、受控值/注入 Controller、可暂停自动轮播、键盘/RTL、草稿保留；加载、空、错误重试、保留内容刷新、禁用/只读和单项边界 |

重试示例恢复对应内容或可用动作，不以成功文字或 Toast 代替数据恢复。表格示例只用本地合成 loader，宿主真实查询、权限、写入和请求 owner 不因此迁入展示组件。检查范围及未执行项见 [VALIDATION](VALIDATION.md#4241-整体定版回归2026-10-25)。

### 状态所有权与 Controller 模式

2.0.0 在历史 1.3.0 基线基础上落实下表的语义状态接口。旧 Controller 草稿版本1.4.0不是当前固定产物。源码实现、定向自动测试、正式安装包和浏览器证据分别记录在 [VALIDATION](VALIDATION.md)，不能将其中任何一项替代产品验收。3.0.0 进一步以自有 ToastController 补齐集合/计时/关闭阶段注入；完整语义和迁移限制见 PUBLIC_API。

默认/注入两种模式使用同一公开契约。React 的 `controller` 与其对应初始化、受控值、变更回调互斥，JS 冲突输入也应拒绝。纯展示、业务权限、路由、查询和认证不因此归组件；键盘、实际焦点、定位、DOM 测量仍由原 Base UI/浏览器执行。`getState` 返回稳定只读快照，`subscribe` 返回退订函数；注入实例由宿主销毁。默认实例仅在真正卸载或依赖身份替换时销毁，StrictMode replay 不重复启动请求；注入实例替换后旧实例不再驱动 View。下列模型不支持并发绑定两个独立 View 来争夺同一表单或焦点。

| 组件/组合 | 默认 owner 与完整替换入口 | 关键状态及边界 |
|---|---|---|
| `Menu.View` | 既有 `config` 或 `MenuController` | items/open/动作/活动项/焦点请求；权限和业务执行归宿主。JSX `Menu.Root` 的开合合同独立见下行 |
| `Menu.Root`、`ContextMenu.Root`、`Dialog.Root`、`Sheet.Root`、`AlertDialog.Root`、`Popover.Root`、`Tooltip.Root` | 原有 open/defaultOpen/callback 默认模式；`controller:OverlayController` 完整替换所属开合语义，工厂 `createOverlayController` | 原因/事件随请求传递，取消不改变状态；Portal、嵌套关闭、碰撞、焦点恢复仍由 peer。handle 只关联触发器，不是 Controller |
| `Menu.CheckboxItem`、`ContextMenu.CheckboxItem` | checked/defaultChecked/callback 或 `ValueController<boolean>` | 独立 checked，不冒充 Root 统管；`createValueController({defaultValue:false})` |
| `Menu.RadioGroup` / `RadioItem`、`ContextMenu.RadioGroup` / `RadioItem` | value/defaultValue/callback 或 `ValueController<T>` | RadioItem 由组投影，没有第二选择模型 |
| `Tabs.Root` | value/defaultValue/callback 或 `ValueController<string|number|null>` | 选择意图、动态缺失/禁用项回正；默认隐式首项保持兼容，受控确认不擅自回正。Tab/List/Panel 保留 peer 键盘与关联 |
| `Accordion.Root` | value/defaultValue/callback 或 `ValueController<readonly T[]>` | 展开集合；面板挂载/实际焦点留 peer |
| `ToggleGroup.Root` | 原 props 或 `ToggleGroupController<T>`，工厂 `createToggleGroupController` | value、multiple、allowEmpty 同一 owner，程序及指针请求均遵守策略；组内 Item 不创建独立模型 |
| 独立 `ToggleGroup.Item` | pressed/defaultPressed/callback 或 `ValueController<boolean>` | 脱组按下状态；组内禁止另注入 Item Controller |
| `Select.Root` | 原选择/开合 props 或 `SelectionController<T>`，工厂 `createSelectionController` | value/open 为同一 owner；保留 items/表单/peer 选择算法 |
| `Combobox.Root` | 原选择/输入/开合 props 或 `SelectionController<T>` | value/open/inputValue、键盘高亮外观及 peer 高亮观察；不复制 peer 导航算法 |
| `Calendar` | 原 `CalendarOptions` 或 `CalendarController`，工厂 `createCalendarModel` | ISO 日期/月份/逻辑焦点，受控更新无重复通知；single/range 与禁用日期保持 |
| `DateTimePicker` | 原 `DateTimeOptions` 或 `DateTimeController`，工厂 `createDateTimeModel` | 整个日期时间草稿、开合、格式/required反馈；分钟墙上时间不变，时区/窗口归宿主。Calendar 是受控子日期视图，其日历键盘焦点归该子视图 |
| `Copyable` | 原复制选项或 `CopyController`，工厂 `createCopyController` | value/disabled/status 可订阅；默认复用 runtime 剪贴板服务，显式 writer 保持兼容。普通可展示文本可进入此快照，密码和一次性 secret 使用自身秘密合同 |
| `PasswordInput` | 默认安全显隐模型或 `PasswordInputController` | 仅 visible/cleared，不含秘密值；DOM/reset/pagehide/退出清理不可禁用，宿主受控密码仍由宿主持有 |
| `PasswordStrengthInput` | 默认强度模型或 `PasswordStrengthController` | 无秘密强度摘要及其密码显隐子模型；DOM reader 在绑定期有效，worker/迟到结果按代次隔离 |
| `PasswordChangeForm` | 默认借用AuthClient的独立PasswordChangeController，或互斥完整注入 | 只拥有改密展示/显隐/反馈与提交作用域，认证与会话仍归原AuthClient |
| `NewPasswordFields` | 默认或 `NewPasswordFieldsController` | 安全错误码、提示开合、两个显隐/强度子实例；只在提交边界瞬时读取密码，快照不含密码或匹配词 |
| `AdminSetupPage / AdminSetupForm` | 原 state/onSubmit/onCheck 或 `AdminSetupController` | 旧权威初始化状态与提交/核对合同保留，新增 form 聚合含用户名错误与密码字段展示子模型；不新建 auth/API |
| `AppShell`、`MenuLayout`、`NavigationMenu` | 原 props 或 `NavigationPresentationController`，工厂 `createNavigationPresentationController` | collapsed/sidebarOpen/expandedIds；同一导航树沿用Shell上下文，独立keepMounted范围各自注入，详见[导航Controller作用域](#导航-controller-作用域)。activeId/路由/数据分页不迁入。环境宽度、同一树 Portal、实际 roving 焦点仍由 View 执行 |
| `DataTable.columnSizing` | 省略关闭；options默认或`controller:DataTableColumnSizingController`完整替换 | 只拥有稳定列id宽度与可取消草稿，工厂createDataTableColumnSizingController；数据/排序/分页不迁入；平台轨道测量、capture和焦点归React View |
| `Pagination` | 原 props 或 `PaginationController`，工厂 `createPaginationController` | page/pageCount/disabled；受控页只发请求，不能建立服务器页历史/query/cache |
| `Disclosure`、`SearchToolbar` | 原开合 props 或 `OverlayController` | 仅所属开合；查询/表单值归宿主，关闭前后实际焦点仍由 View 合法恢复 |
| `SimpleSelect` | 默认开合模型或 `OverlayController` | 只替换弹层语义；HTML select 继续拥有实际值/FormData/reset/validity，DOM options/disabled 是平台投影 |
| `CommandPicker` | 原默认/受控值或 `SelectionController<readonly string[]>` | 查询文本、选择、peer 高亮观察；业务 onAction 保留宿主执行，不引入命令服务 |
| `GroupedCombobox` | 原默认/受控值与输入或 `SelectionController<string|null>` | 通用选择/搜索意图及高亮观察；groups.open/分页/查询仍是宿主给定事实与请求，不能冒充业务成功 |
| `NumberInput` | 原 value/约束/回调或 `NumberInputController`，工厂 `createNumberInputController` | 中间文本、解析反馈、步进意图；数字始终由宿主确认，IME/selection/reset 留原生 |
| `ApiKeyManager` | 兼容旧 service `controller`；可选显式 `options` 创建唯一默认服务；`viewController:ApiKeyManagerViewController` 完整替换 | `createApiKeyManagerViewController` 引用一个 service 并持有客户端 pageIndex/pageSize；`viewController` 与旧 service/options/pagination 初始化互斥。真实总数仅完整已加载 rows.length，不加查询/权限/secret owner |
| `BusinessLogExplorer`、`StructuredLogExplorer` | 兼容旧 service `controller`；显式 `options` 默认服务；`viewController` 完整替换 | `createBusinessLogViewController` / `createStructuredLogViewController` 持有未提交 draft、filters Controller并引用唯一服务，不复制服务结果/快照/查询。缺失 records 继续不请求、不显示入口 |
| `ConfigurableLoginPage` | 原 auth/config/extensions/callback 或 `LoginViewController`，工厂 `createLoginViewController` | 错误、extension/登录/导航展示阶段与密码显隐；必须显式借用 AuthClient，绝不创建第二认证 owner。绑定 reader 不缓存秘密；异步扩展之后才重读密码，交给 auth 后立即清理本地引用及 DOM |
| `ThemeModeButton`、`AppHeader` 的主题区、`useTheme` | 沿用共享文档默认 ThemeController 或 `theme` | prepaint/JSON sessionStorage 与公开缩放合同保持；按钮/头部卸载不 destroy 文档共享实例。locale 事实归宿主，展开采用 SimpleSelect 合同 |
| `Toast` | `createToastController`（runtime `/toast`）；`Toast.Provider controller`，旧 `toastManager` 名称接受同一个 xui Controller | 唯一队列、阶段、上限、超时、暂停与Promise由模型持有；React负责DOM焦点/播报/动画回执和指针测量，默认实例拥有生命周期，借用实例不销毁。旧Base UI动作bus不满足此合同，3.0.0需迁移；Provider options 与注入互斥 |

完整服务组合使用 `viewController` 区分旧服务 `controller`，避免把旧的必填服务实例改名后误称完整展示注入。借用服务不被 View 销毁，仍按原关闭/取消合同释放所属瞬态详情/secret；options 创建的服务由默认 view model 销毁。默认服务 options 的服务配置仅在首次创建时使用；BusinessLogExplorer的实时labels例外见[整页语言](#业务日志整页标签热更新4229)。父组件传入新对象不会重建服务或丢失正在编辑的草稿。显式更换借用 service 身份会创建对应新展示实例，保持 React DOM 树；业务范围需要替换默认 owner 时由宿主明确重挂载。配置更新不覆盖注入者模型；注入者调用对应 update/动作。

#### 宿主事实、平台投影与无语义状态组件

这里的“不适用”是对**新增通用Controller**的判断，不是把它们伪记为已经支持完整注入。仅样式/布局部件沿用所属Root的状态合同；具有独立语义状态的parts已单列，不能因为挂在同一组件命名空间就漏报。

| 组件/公开组合 | 当前真实状态及边界 | 判定依据 | 证据 |
|---|---|---|---|
| `Input` | HTML value/defaultValue、原生编辑；宿主可受控 | **不适用**：不把原生或宿主字段值复制为TS store | [Forms](../packages/ui-react/src/forms.tsx) |
| `Textarea` | 同上；autoResize监听内容/字体/布局并测量高度 | **不适用**：高度是DOM投影，不能由Controller伪造测量；value仍归原owner | [Forms](../packages/ui-react/src/forms.tsx)、[measurement](../packages/ui-react/src/textarea.ts) |
| `NativeSelect` | 原生select value/defaultValue/selectedOptions/FormData | **不适用**：原生表单状态不另建镜像；与增强SimpleSelect的open缺口区分 | [Forms](../packages/ui-react/src/forms.tsx) |
| `Checkbox` | 原生checked/defaultChecked或宿主受控，readOnly guard取消原生activation | **不适用**：checked事实归原生/宿主，guard不是状态Controller | [Forms](../packages/ui-react/src/forms.tsx) |
| `Radio` | 原生同名组与宿主checked，保留原生表单/键盘 | **不适用**：不另建与HTML radio组竞争的owner | [Forms](../packages/ui-react/src/forms.tsx) |
| `Switch` | 原生checkbox语义加switch role，checked由原生/宿主拥有 | **不适用**：同Checkbox，不因role不同造新store | [Forms](../packages/ui-react/src/forms.tsx) |
| `CheckboxGroup` | 受控value/options，select-all与mixed由其派生；原生reset/焦点桥接 | **不适用**：多选值已由宿主确认，不把派生全选或validity升级成第二owner | [Choice groups](../packages/ui-react/src/choice-group.tsx) |
| `RadioGroup` | 受控单值/options，readOnly组合保护与原生表单 | **不适用**：保留宿主值和原生组，不保存第二选择集 | [Choice groups](../packages/ui-react/src/choice-group.tsx) |
| `SearchInput` | value/onValueChange必需，clear/submit发意图；本地仅IME、reset与DOM ref | **不适用**：查询文本已有宿主owner，composition是平台事实；不与CommandPicker拥有query的情况混淆 | [Inputs](../packages/ui-react/src/text-inputs.tsx) |
| `DataTable` | rows/columns/rowKey、status、selected/expanded及页/游标事实由宿主传入；layout helper只测量/投影 | **不适用查询Controller**：公共request guard仅防同回合重复动作，不能推进未确认分页或创建query/cache；行内业务控件保留自己的owner | [DataTable](../packages/ui-react/src/data-table.tsx)、[view helper](../packages/ui-react/src/collection-view.tsx) |
| `CardGroup` | 与DataTable同一受控集合合同；卡片等高由真实内容测量 | **不适用查询Controller**：保留宿主rows/分页/请求与派生高度，不将renderCard中的业务草稿收进集合 | [CardGroup](../packages/ui-react/src/card-group.tsx) |
| `LineChart`、`BarChart`、`PieChart` | 数据/status由宿主受控，临时读值与数据表开合由View管理，几何由实际CSS测量 | **不适用查询/选择Controller**：沿用宿主Resource，不新建请求、数据缓存或全局图表单例 | [Chart](../packages/ui-react/src/chart.tsx) |
| `DataTableFilter`、`DataTableToolbar` | 公开字段/toolbar布局，过滤值或children由宿主给定 | **不适用**：没有自己的查询状态，不因组件名称含Filter就创建查询owner | [DataTable](../packages/ui-react/src/data-table.tsx) |
| `RenderBoundary` | React捕获render异常，以类实例error/resetKey/reset显示fallback | **不适用完整外部替换**：捕获与重新渲染受React生命周期约束；保留onError/reset，不造并行error store，不重试业务Promise | [Feedback](../packages/ui-react/src/feedback.tsx) |
| `Image` | src/retryKey来自宿主；loading/loaded/error由img真实load/error/complete发布 | **不适用**：资源状态是浏览器事实，不能注入假ready或第二图片请求 | [Display](../packages/ui-react/src/display.tsx) |
| `Avatar` | peer Image/Fallback观察图片加载，Root配置size/color | **不适用**：加载是平台投影；已有回调不等于Controller，不能伪造图片成功 | [Avatar](../packages/ui-react/src/avatar.tsx) |
| `ScrollArea` | 原生scrollTop/scrollLeft、viewport和焦点留白；公开ref/onScroll | **不适用**：DOM滚动没有TS镜像owner；ref不是Controller | [ScrollArea](../packages/ui-react/src/scroll-area.tsx) |
| `OverflowText`、`NavigationMenu.Label` | 根据真实几何、hover/focus与reduced-motion显示溢出名称；无业务选择 | **不适用**：测量和滚动是DOM投影，不从useState/ref数量推导Controller | [Overflow](../packages/ui-react/src/display.tsx)、[Navigation](../packages/ui-react/src/menu-layout.tsx) |
| `Button`、`IconButton` | 原生/peer按压与焦点，disabled/busy由宿主给定；不拥有异步业务执行 | **不适用**：按压是平台交互事实，不能内置请求/确认/重试owner | [Button](../packages/ui-react/src/button.tsx) |
| `Tag` | label/disabled和onRemove意图；宿主删除集合项并决定后继焦点 | **不适用**：没有自身集合状态，不能把移除意图当已完成 | [Tag](../packages/ui-react/src/display.tsx) |
| `Nav`、`NavItem`、`Breadcrumbs` | 路由/selected/href事实与导航回调由宿主给定，链接保留浏览器语义 | **不适用**：不建路由Controller；NavigationMenu的展开交互单列处理 | [Navigation](../packages/ui-react/src/navigation.tsx) |
| `Table`、`TableContainer`、`TableCaption`、`TableHead`、`TableBody`、`TableRow`、`TableHeaderCell`、`TableCell`、`TableExpandedRow`、`TableActions` | HTML表格/滚动布局；selected/expanded/固定位置是显式props | **不适用**：纯语义结构与事实投影，不添加查询或选择owner | [Table](../packages/ui-react/src/table.tsx) |
| `SortButton`、`TableExpandButton` | 单次点击callback，排序/expanded及controls由宿主确认 | **不适用**：不自改顺序或展开业务记录 | [Table actions](../packages/ui-react/src/table.tsx) |
| `Card`、`MetricCard` | 公开slots与格式化内容；长文字测量使用OverflowText | **不适用**：无自有业务状态或选中/请求owner，子控件按自身合同处理 | [Card](../packages/ui-react/src/display.tsx)、[Metric](../packages/ui-react/src/metric-card.tsx) |
| `Surface`、`Alert`、`Badge`、`Skeleton`、`Spinner`、`Progress` | tone/busy/progress值由宿主给定；动效由CSS/reduced-motion决定 | **不适用**：反馈与进度投影不拥有真实操作进度 | [Feedback](../packages/ui-react/src/feedback.tsx) |
| `LoadingState`、`EmptyState`、`ErrorState`、`DataRegion` | 状态、反馈文字、busy及显式retry callback来自宿主 | **不适用**：不默认请求/重试/清空内容 | [Regions](../packages/ui-react/src/feedback.tsx) |
| `Container`、`Stack`、`Grid`、`FormGrid`、`FormActions`、`Toolbar`、`Section`、`PageHeader`、`HeaderBrand`、`SidebarFooterContent`、`SidebarFooterRow` | layout/slot结构；标题关联ID是渲染身份 | **不适用**：无语义交互状态，不为布局或ID造Controller | [Layout](../packages/ui-react/src/layout.tsx) |
| `Field`、`Fieldset`、`InputGroup` | label/help/error/disabled关联与边界，实际输入在children | **不适用**：不收归字段业务值；InputGroup.Button只是按钮部件 | [Forms](../packages/ui-react/src/forms.tsx) |
| `Typography`、`Icon`、`Separator`、`DisclosureIndicator` | 文字/图标/分隔/展开图形按props呈现；blink/reduced-motion为CSS状态 | **不适用**：不自创选中、开合或内容owner | [Display](../packages/ui-react/src/display.tsx)、[Indicator](../packages/ui-react/src/navigation.tsx) |
| `AuthPage` | 完整认证页slot与显式form submit入口；不请求、不保存凭据 | **不适用**：保持request-free布局，不与ConfigurableLoginPage服务混淆 | [AuthPage](../packages/ui-react/src/login.tsx) |
| `useTheme` | 仅订阅显式ThemeController，可给server snapshot | **订阅hook，不适用View默认创建**：默认共享owner在ThemeModeButton/文档入口取得 | [Theme hook](../packages/ui-react/src/theme.tsx) |
| `useResource` | 仅订阅宿主ResourceController；loader/key/生命周期归宿主 | **订阅hook，不适用默认请求owner**：不能为满足双模式隐式新建resource/query | [Resource hook](../packages/ui-react/src/feedback.tsx) |

`Badge`、`BadgeProps` 与 `BadgeTone` 从 `@coffeehc/xui-react/feedback` 及根入口导出。`tone` 为 neutral/info/success/warning/error，默认 neutral；例如 `<Badge tone="success">运行正常</Badge>`。neutral、未设置 data-tone 与普通 Tag 保留无边框、无底色的被动文字；显式状态才应用语义前景/soft/line、横向间距和4px圆角。标签文字或图标由宿主表达状态，不自动增加 live region、tab stop 或脉冲。

1.2.0的 `BadgeProps.color` 可显式指定前景，例如 `<Badge color="var(--action-primary)">发现新版本</Badge>`；省略时保持tone/继承规则。它不改字体、背景或增加动效；图标仍由公共Icon组合。错误/风险继续用真实语义tone，不用主题色掩盖状态。执行结果与范围见[验证记录](VALIDATION.md)。

同批新增`BadgeVariant='plain'|'soft'`及`BadgeProps.variant`：省略时neutral仍为plain、显式状态仍为soft；soft可用于中性归属，提供公共底色/间距/边界；plain保留语义前景而去掉底色/边界。Card归属标签默认选择neutral+soft，与业务状态tone分开，字体仍为原label角色。

Popover.Content的positionerProps仍透传peer的align/side/collisionBoundary等选项，align=end是合法组合。正式浮层CSS将Positioner的两侧语义gap计入可用尺寸，长内容在Popup内部滚动且完整border box留在碰撞边界内；不要求宿主添加高度扣减、内部选择器或固定collisionPadding。React Positioner 与公共浮层 CSS 共同负责定位和碰撞尺寸。Escape回触发器；外点已有新的可聚焦目标时保留其焦点，不为“回焦点”抢回宿主新焦点。

Dialog 关闭不会自动保存；移除触发器时指定 finalFocus。浮层非模态时不 trap 焦点，模态与取消/回焦点按 peer。Tooltip.Content 内只有说明，交互内容用 Popover。动画使用统一 motion token；reduced-motion 下状态立即变化。

NavItem 未提供 selected 时保留标准 aria-current；仅 aria-current="page" 默认匹配选中竖线、浅底与强调文字/图标。step/location/date/time/true/false 均保留各自 ARIA 语义，不自动转成 page 或选中样式。显式 selected 优先：true 输出 page，false 移除 aria-current，包括与传入 aria-current 矛盾时；这是原有 selected 调用的行为。宿主可只传 aria-current="page" 或 selected，不必同时提供，不需要手工设置 ::before。

NavItem 默认渲染HTML a，也支持公开 render 元素或回调。例如 `render={<RouterLink to="/settings" />}` 或 `render={(props,state)=><RouterLink {...props} to="/settings" />}`；RouterLink 是宿主选用的组件，xui 不依赖路由包。它必须透传合并后的 props/ref 到一个链接元素，不能嵌套链接或丢弃 xui class/ARIA/事件。元素方式合并双方 ref、class 和事件；回调方式扩展事件/class 时用 Base UI 的公开 mergeProps，并保留 props.ref。render 回调 state 为 selected/disabled/collapsed；当前项与 disabled 的顶层 props 优先，disabled 在 capture 阶段阻止点击、中键与 Enter 导航。

启用状态保留HTML href、修改键、中键、target 和 download 的浏览器语义。宿主路由链接必须先调用合并的 onClick，再检查 defaultPrevented，且只拦截自己支持的同源普通主键导航。xui 不把全部链接点击强制转换为客户端路由。正式最小消费者 tests/fixtures/nav-contract.tsx 演示这项接入；产品路由是否避免文档重载仍要由采用项目验证。

### Popover 的 Portal 容器

React `/popover` 与根入口导出 `PopoverContentProps`。`Popover.Content` 的可选 `portalProps` 类型为 `Omit<React.ComponentProps<typeof Popover.Portal>, 'children'>`，配置组合内部的唯一 Portal；`children` 仍属于 Content，`positionerProps` 仍只配置定位器。省略整个字段时保持默认 Portal 与关闭卸载：顶层目标为 body，嵌套时由 peer 继承父 Portal。Portal ref、标准 DOM 属性与 render 沿用公开 peer 合同，不另建 state、overlay 或 focus trap。

传入非 null/undefined 的 `container` 时，Content 默认 `keepMounted=true`：由 peer 隐藏关闭的子树，维持模态内回焦点与再次打开的节点/搜索连续性，父模态卸载时一并释放。原因是当前 peer 1.7.0 移除仍持有焦点的嵌套 Portal 后，父模态的延后恢复可覆盖子浮层回焦点。显式 `keepMounted=false` 保留 peer 的关闭卸载语义，也保留该嵌套回焦点限制；模态内选择器应使用默认保留策略，不通过定时 focus 补丁竞争。无 container、container=null/undefined 仍默认 false；公开 Portal 部件本身的默认行为没有改变。

当前固定 Base UI 1.7.0 的 `container` 接受 HTMLElement、ShadowRoot、RefObject<HTMLElement | ShadowRoot | null>、null 或 undefined，不接受选择器字符串或返回节点的回调；Portal 自己的 `ref` 则可以使用 React callback ref。显式 null 会等待目标，undefined 或 current=null 的 RefObject 会继承父 Portal/回退 body；更改 ref.current 本身不触发重新定位目标。宿主应在实际模态节点已挂载后渲染 Content（下面用节点状态作就绪条件），再传该节点或已就绪的稳定 RefObject；保持打开期间的容器身份稳定。更换容器可重新挂载 portal 子树，不承诺保留该子树的 DOM/焦点。

```tsx
const [modalContainer, setModalContainer] = React.useState<HTMLDivElement | null>(null);
<Dialog.Root>
  <Dialog.Trigger>编辑</Dialog.Trigger>
  <Dialog.Content ref={setModalContainer}>
    <Dialog.Title>编辑资源</Dialog.Title>
    <Popover.Root>
      <Popover.Trigger>选择资源</Popover.Trigger>
      {modalContainer && <Popover.Content portalProps={{container: modalContainer}} positionerProps={{align: 'start'}}>
        <Popover.Title>可选资源</Popover.Title>
        {/* 公共 Field/Input 与业务候选项 */}
      </Popover.Content>}
    </Popover.Root>
  </Dialog.Content>
</Dialog.Root>
```

Sheet 使用相同接线。不要再在 Content 外包一层 Portal，也不要把 `portalProps` 传给 Popup；选值、搜索、草稿和请求仍由宿主管理。完整可运行的[Dialog/Sheet 示例](../examples/popover-portal-react/app.tsx)由独立 tarball 安装消费，包含受控打开、搜索、取消和后续确认。


## 局部反馈与离线

### 局部失败反馈与离线边界

React DataRegion 只在调用方提供 feedback prop（包含 null）时常驻一个反馈槽；主题为该角色提供公开 `.xui-feedback-slot` 样式。共用 `--feedback-slot-block-size`，由已有字体/控件/内距/焦点 token 派生；错误完整保留，可在局部滚动并通过键盘访问动作。`.xui-reserved-action[data-inactive='true']` 仅隐藏辅助动作的绘制，调用方同时设置 aria-hidden、tabIndex=-1 与 disabled，不得保留不可见可交互控件。

React DataTable 保留其状态行；登录页空反馈/隐藏动作不占位，实际消息自然增长，并用闲置/忙状态文案的实际尺寸约束主动作。API Key 与两类日志的空反馈和闲置取消动作不占位；真实反馈仍在所属区域完整显示。API Key 的刷新与创建同属页头动作组，状态紧邻名称；三类管理页的刷新按钮闲置文字居中，忙时显示继承前景的 Spinner＋文字且按钮宽高不变；业务日志把摘要与结果前置，筛选使用同一个 Disclosure 外观。列表与详情的关闭先保留所属焦点事实，再隐藏内容，避免浏览器自动失焦被误认作宿主主动转移。列表刷新仅在实际顺序改变时移动 keyed 行，失败和同记录恢复不重建行控件。API Key 写入结果未知时读取普通列表一次，结束等待后允许用户手动再试，不自动重发写请求；瞬时 secret 释放、认证与权限规则见 [API Key 管理](PUBLIC_API.md#api-key-管理)。

这保证已加载应用在请求失败时的结构稳定，不保证首次从未加载资源且完全离线时可用。核心主题 CSS/字体/图标不依赖远端 CDN，但宿主配置的 logo、图片或延迟模块仍依赖其资源可用性。不增加 Service Worker、凭据持久化或自动重放。实际验证范围见 [失败布局验证](VALIDATION.md#失败复验与限制)。

## 文本输入

正式 React `@coffeehc/xui-react/text-inputs` 及根入口导出。共享数字纯函数在 `@coffeehc/xui-runtime/number-input`。复用 Input/InputGroup/Field 和 forms.css；没有 debounce、fetch、认证状态、密码策略或新颜色/尺寸 owner。Input 保留原有合同；NewPasswordFields 复用普通密码与强度输入，见 [密码输入](COMPONENTS.md#密码输入)。


### Textarea 可选自动增高

React `/forms` 的 `TextareaProps.autoResize?: {maxRows:number}` 显式启用；`InputGroup.Textarea` 共享同一入口。maxRows 必须是正整数；最小高度仍取已有 rows 与公共 CSS minimum，maxRows 不得压缩此下限。默认不启用，原有 rows、滚动和浏览器手动 resize 不变。

启用后按实际字体、内距、边线和宽度测量内容，增长到行数上限后内部滚动，删除内容会缩回；尊重公开 CSS max-height 约束。不改变 value、选区、焦点、表单、required/disabled/readOnly 或 IME/提交策略，不派发额外 input/change。组件测量不可见副本，避免先压缩正在编辑的框导致 Dialog 滚动跳动。自身高度不做过渡动画。stacked InputGroup 同样按内容增长：共享尺寸绑定与公共 CSS 协作，避免纵向 flex 压缩已测高度；未启用自动增高的 InputGroup 保留原 flex 与手动 resize 行为。不要在消费方覆盖 flex、固定高度或再加测量器。

React 受控值随 props 更新；组件根据 input、字体加载、宽度和窗口变化同步尺寸。表单 reset 后重测；启用期间由组件独占 block-size/overflow-y/resize，外部通过 rows/maxRows/CSS max-height 调整边界，不并行测高或写高度。禁用自动增高或卸载时恢复原内联尺寸/resize 并释放观察器、动画帧和监听。长编辑器仍由 Dialog.Body/Sheet.Body 管理所属滚动，不能把整页扩大成第二个滚动 owner。

```tsx
<Field label="想法内容"><Textarea rows={2} value={draft} onChange={e=>setDraft(e.target.value)} autoResize={{maxRows:6}} /></Field>
```

正式 React 示例见 [文本输入](../examples/text-inputs-react/app.tsx) 的按需草稿 Dialog；查询 `?sizing&layout=stacked&surface=sheet` 展示上下 Addon 与 Sheet，`rows=4`、`addons=top|bottom`、`manual` 用于核对原始行数、单侧工具区和未启用的默认行为。

### NumberInput

value 是 number|null，空白提交 null，绝不转为 0。min/max 必须有限且顺序正确，step 默认为 1 且必须正数；外部 value 必须有限且绝对值不超过 Number.MAX_SAFE_INTEGER。本组件不适用于精确金额、大整数、ID；这些继续用字符串 Input 加领域 parser，不提供格式化/本地化或 decimal 引擎。

文本输入保留 `-`、`.`、`1e` 等编辑中间态；无关 render 或同值 update 不擦除 draft。真实 inputMode=decimal、role=spinbutton、aria-valuemin/max/now 保留可访问数字语义。onDraftChange（可选）每次编辑通知；onValueChange 只在 blur、非 IME Enter、方向键或步进按钮提交有效且与确认值不同的值时通知。onInvalidDraft（可选）在提交非法文本时通知 draft/error；输入始终以 customValidity 阻止非法/越界/不合步长表单提交。草稿和已确认值不同是有意设计；即使宿主拒绝步进值，aria-valuenow 仍是原确认值。更改外部 value 才替换草稿，form.reset 捕获阶段会先把 defaultValue 同步为最新确认值，浏览器随后的同步重置及立即 FormData 因此都使用确认值；后续 task 再同步 React 草稿，不发送变更。新 input 事件取消尚未执行的旧重置协调，保留新草稿及其有效性，不提交或改写确认值。React 在 input/change 事件结束时可能把 DOM defaultValue 写回草稿，所以不把该 DOM 属性当作确认值 owner，也不只依赖 layout effect。取消 reset 保留原草稿。

解析支持普通小数和指数，不接受千位分隔或 locale 小数逗号。step 以 min（否则 0）为基线，容忍有限浮点噪声；步进封顶到边界内合法格点，空值从 min（否则 0，负 max 时从不超过 max 的合法格点）开始。超出支持范围或无法安全计算步数时拒绝；不承诺任意小数精确性。wheel 不改值。共享纯模型额外提供 getDraft()/commit()；需要表单提交前领域验证仍由宿主拥有。

### PasswordInput

传 value 时为字符串受控模式，onValueChange 必填；不传 value 时为非受控模式，不接受初始秘密 defaultValue。prefix/suffix 通过 InputGroup 前后缀组合；仅显隐在组件内，真实同一 input 在 password/text 间切换，保留 selection，按钮以 eye/eye-off 描边图标显示，保留 showLabel/hideLabel 可访问名称与 aria-pressed；静态 muted、hover primary，仍可 Tab 停靠。InputGroup 子 input 的自然滚动清距覆盖组边框，不用独立输入的边界代替整组。autocomplete 由调用点明确 current-password/new-password；没有 storage、日志、复制或请求。React 在 pagehide 同步清空 DOM value/defaultValue/隐藏密码并通知 onValueChange('')、onClear('pagehide')；真实卸载在一个 microtask 清空捕获的旧节点并通知 onClear('unmount')，避免 StrictMode 的检查性重挂造成伪清理。宿主必须接受清空并同步删除其受控秘密；组件不能清理宿主拒绝删除的 state，也不能保证浏览器密码管理器、自动填充或内存取证清除。不要把真实秘密用于示例、SSR 初始 HTML、URL 或诊断。controlRef 提供 clear()，ref 仍指向 input。固定新设校验与强度输入见 [密码输入](COMPONENTS.md#密码输入)，普通输入不限制既有账号登录密码。

### SearchInput

value 字符串受控，clearLabel 默认 Clear search；可选 onClear、onSubmit(value)、clearOnEscape（默认 false）。清除发空值意图并将焦点回输入；disabled/readOnly 不清除。onSubmit 存在时非 IME Enter 阻止原生隐式提交并只通知一次；没有 onSubmit 时保留浏览器表单提交。composition 期间 Enter 不发查询意图，组件不请求、不防抖、不改分页。输入和清除都由宿主发布最终值。

示例：[React](../examples/text-inputs-react/app.tsx)。纯模型/SSR/DOM identity 单测、正式 tarball 正负类型消费及独立浏览器键盘/表单/清理 suite 分开报告；截图覆盖 light/dark/system 与 320/390/1280，真正 200% Chrome Page zoom 使用临时 profile，不用 CSS/font/pinch 代替。受限执行器的 EPERM 不算通过，不关闭 sandbox。真实 hydration、读屏器、OS 密码管理器和移动输入法尚未验证。

## 密码输入

普通 `PasswordInput` 基于公开 InputGroup（Input、前后缀和显隐按钮）；`PasswordStrengthInput` 在同一个普通密码输入 owner 下仅增加一条连续强度条。React提供相同能力，不请求密码策略 API，不允许项目替换长度或评分规则。

新设密码固定为 **6–32 个 Unicode 码点**，不修剪、归一化或截断；拒绝孤立 UTF-16 代理项。中文、emoji 和组合符号按实际码点计数，不使用浏览器 UTF-16 minlength/maxlength 代替。强度低或估算器不可用都不增加提交门禁，服务端继续独立执行相同规则。

### 单框与组合

| 用途 | React 公共入口 |
| --- | --- |
| 普通密码输入 | `PasswordInput`，`@coffeehc/xui-react/text-inputs` |
| 带本地强度的输入 | `PasswordStrengthInput`，`@coffeehc/xui-react/password` |
| 新密码与确认组合 | `NewPasswordFields`，`@coffeehc/xui-react/password` |

普通与强度输入支持 prefix/suffix；显隐使用 eye/eye-off 描边图标，showLabel/hideLabel 继续提供可访问名称与 aria-pressed；切换保留 input 节点和选区，disabled/readOnly、form 关联、键盘和字段描述沿用基础输入合同。React 可显式受控（value/onValueChange），或不传 value 使用 DOM 非受控模式。ref 指向 input，controlRef 的 clear() 负责命令式清空；新密码组合默认使用非受控输入，秘密留在 DOM/ref，不进入公开状态。

```tsx
const fields = React.useRef<NewPasswordFieldsHandle>(null);
<NewPasswordFields ref={fields} disabled={submitting} />
// 放在宿主表单中，仅在明确提交时读取：
const password = fields.current?.readValidatedPassword();
if (password == null) return;
try { await initializeBusiness({password}); }
finally { fields.current?.clear(); }
```


runtime/password 公开 `passwordMinimumCharacters`、`passwordMaximumCharacters`、`countPasswordCodePoints`、`validatePassword(password)`、`validateNewPassword(password,confirmation)` 和 `getNewPasswordErrorMessage(error,labels?,count?)`。旧 PasswordPolicy/parsePasswordPolicy/loadPasswordPolicy 与 GET password-policy 接口已移除，不保留配置兼容壳。

pagehide、clear、reset 与卸载/destroy 清空所属非受控输入及派生反馈，丢弃迟到评分；受控输入的值由宿主确认。组件不发起账号变更、登录或密码保存。宿主提交回调应在 finally 丢弃自己的密码引用，不写 URL、日志或 storage。旧账号登录不套用新设密码校验；认证始终由服务端负责。

#### 本地密码强度建议

PasswordStrengthInput 与 NewPasswordFields 默认在输入暂停 150 ms 后本地估算。输入下方仅有一条 4px 连续 meter，以实际评分 0–4 映射五档 20/40/60/80/100% 长度；弱、中、强分别映射现有 error、warning、success 语义颜色。idle/loading/unavailable 保留空轨道，不画假分；无可见等待文案、规则段、字符计数或改进建议。meter 的 min=0/max=5，ready 时 now=score+1，aria-valuetext 与 sr-only live status 提供实际强弱或未就绪状态。使用 MIT 的 @zxcvbn-ts/core 4.2.0、language-common 4.1.3、language-en 4.1.1，识别常见密码、顺序、重复、键盘及常见个人信息模式，不按字符种类自行打分。固定映射：评分 0–1 为弱，2 为中，3–4 为强。强度仅供参考，任何分数都不参与 readValidatedPassword 的提交许可；强制规则固定为 6–32 个 Unicode 码点。

引擎和 common/en 字典在包构建时编成自包含固定 worker 源码，以动态 import 首次输入时懒加载。库在本地 Blob worker 中执行，ready 后才读取最新输入并通过本地 postMessage 发送；主线程不解析字典或执行评分，评分实例只存在于单次 worker 调用中。宿主无需 worker 打包插件；正常 ESM 动态导入拆包保留懒加载，显式关闭代码拆分的 bundler 会把模块合并进初始脚本。正式独立 tarball 消费者分别记录引擎与初始静态 JS 图体积，精确结果写入 strength-bundle.json；初始图不得包含引擎和字典。构建产物体积不等于浏览器运行时延迟，入口静态依赖图与既有全库体积门禁继续检查。

首次离线、Worker 不可用、打包产物不可加载或宿主 CSP 禁止 blob worker 时，保留空轨道，可访问状态为“暂不可评估”，不影响提交。库不修改、不要求放宽 worker-src/CSP，不会假称强。字典以常见模式和英文为主，对其他语言、人名、产品上下文及新泄露密码的识别有限；“强”不保证安全。估算为限制同步 CPU 工作只处理最多 256 个 UTF-16 单元，超出显示无法评估，不截断密码，也不改变服务端策略校验。复杂 Unicode 的强制长度仍按上面的码点规则。

runtime/password 提供纯 TypeScript createPasswordStrengthController({readPassword,onChange})、PasswordStrengthState 和 getPasswordStrengthSummary。控制器 refresh/clear/destroy 只回传状态、评分、等级和提示分类，不返回密码、匹配词或猜测轨迹。单框直接使用 PasswordStrengthInput，密码确认组合使用 NewPasswordFields，无需另建评分 owner。NewPasswordLabels.strengthLabel 翻译 meter 名称，strengthSummary 翻译可访问状态；labels 不改变评分与校验。

输入不上传、不进入 URL、日志或 storage，不使用远程泄露查询或网络 matcher。读取输入发生在引擎加载完成后，异步等待不保存密码快照；每次输入、clear 和卸载使旧 generation 失效，迟到加载或评分不能覆盖当前提示；卸载通过 AbortSignal 立即终止正在加载或工作的 worker。pagehide/clear/destroy 同步清除输入和显示状态。评分不用于旧账号登录密码限制。字典可缓存，但每次估算使用独立 Factory，避免其内部 scoring 缓存长期引用最近密码；JavaScript 字符串无法承诺物理内存清零。

实现依据：[zxcvbn-ts 指南](https://zxcvbn-ts.github.io/zxcvbn/guide/)、[懒加载](https://zxcvbn-ts.github.io/zxcvbn/guide/lazy-loading/)、[4.x Factory](https://zxcvbn-ts.github.io/zxcvbn/guide/migration/)。回归覆盖常见/重复/顺序模式、有效弱密码允许提交、懒加载隔离、离线和迟到结果。浏览器应记录实际输入事件、LongTask 与计时器延迟，不能由构建或 worker 结构推断响应性能；实际执行范围见 [VALIDATION.md](VALIDATION.md)。

已移除无用的 count、strength、strengthAdvice 文案入口与 getPasswordStrengthMessage；没有第二份建议/计数布局或 Disclosure owner。清空保留空轨道，丢弃上次评分；短错误文案的 length/tooShort/tooLong/invalidUnicode/confirmationMismatch 入口继续可翻译。

## 成组选项

React `@coffeehc/xui-react/choice-group` 与纯数据模型 `@coffeehc/xui-runtime/choice-group` 均从各自根入口导出。组件复用 Fieldset/Checkbox/Radio 的 HTML 语义和 forms.css，不新增皮肤或权限后端。

`options` 是唯一 key 的 `{key:string,label:string,disabled?,readOnly?}` 数组；label 是安全文本。legend 必填；name/help/error/disabled/readOnly/required 可选。CheckboxGroup 的 value 是 readonly string[]，RadioGroup 是 string|null；onValueChange 只发意图，宿主必须回传 value。拒绝/延迟更新不改变已确认值。组件接受 fieldset DOM props/ref；按稳定 key 更新文案、回调与选值，删除焦点项时回到剩余第一个可用选项，不抢外部焦点。

CheckboxGroup 显式 selectAll 字符串开启全选；只选择当前 options 中非 disabled/readOnly 的全集，不代表跨页查询全部结果。全选/清空保留未知及不可编辑 keys。部分态由同一 value 计算。未知值显示非 live 诊断并保留，不擅自清理权限。name 只赋给实际选项，全选不提交；未知值不创造隐藏表单字段，宿主必须使用受控 value 处理未知权限。

required 复选组表示至少选择一个当前已知选项，通过首个可用输入的浏览器 customValidity 实现，不要求每项都选；零项/全 disabled 没有可验证输入，业务必须明确处理不可填写状态。只读组不阻止原表单提交。单选组使用同 name 真实 radio，浏览器负责方向键和组级 required；未给 name 时产生组内唯一名称，宿主不得给两个独立组同一 name。被选中的 readOnly 单选项锁定整组，防止另一选项隐式取消它。只读不移除表单值或焦点，disabled 继续遵守浏览器表单排除规则。defaultChecked 始终派生自最新受控事实，所以 form.reset() 返回时 FormData 已一致；reset 后续 task 再恢复部分态，不使用可能早于浏览器默认动作的 microtask，不发业务变更；宿主需要清空应显式发布新 value。

示例：[React](../examples/choice-group-react/app.tsx)。正式类型消费与真实浏览器键盘、required、FormData 和焦点回归分别验收；纯模型或 DOM 测试不能代替浏览器验证。

## 选择与复合控件

唯一完整规则及默认值见[DESIGN](DESIGN.md)。本节说明选择与复合控件；[公开入口](PUBLIC_API.md)和[React消费者](../examples/widgets-react/app.tsx)使用正式CSS/ESM/types，不依赖私有皮肤、源码alias或下游Tailwind扫描。合成宿主不是产品迁移。

| 能力 | React公开接口 | 默认与所有权 |
| --- | --- | --- |
| Command | `/command` 的 `CommandPicker` | mode=single；multiple保留过滤前已选id；action回调不存选择。数据、领域权限、远端搜索和动作busy由宿主，选择只是草稿，确认另由宿主执行 |
| Calendar | `/calendar` 的 `Calendar`；纯模型 `@coffeehc/xui-runtime/calendar` | mode=single；range={start,end}，空端点null，start/end有序。严格YYYY-MM-DD，defaultMonth=YYYY-MM；locale默认zh-CN/weekStartsOn=1。只用UTC日期字段，不做时区转换；today可给确定日期，省略使用当前UTC日 |
| ToggleGroup | `/toggle-group` 的 `ToggleGroup.Root/Item` | 单选默认，value/defaultValue是字符串数组；multiple/allowEmpty/disabled/orientation按公开props。方向键/Home/End只移动焦点，Space/Enter选择；不冒用Tabs语义 |
| Accordion | `/accordion` 的 `Accordion.Root/Item/Header/Trigger/Panel` | value/defaultValue为id数组，默认single，可multiple。Tab/Enter/Space按按钮语义；peer 1.7 已弃用强制箭头roving，不编造键盘默认。展开内容由宿主提供 |
| ScrollArea | `/scroll-area` 的 `ScrollArea.Root/Viewport/Content` | 浏览器原生滚动与滚动条，无第二JS引擎。Root由宿主给blockSize/maxBlockSize等界限；Viewport=min-size:0/overflow:auto，默认tabIndex=0、role=region、focusMode=gutter；宿主给aria-label。内容同节点更新保留滚动 |
| InputGroup | `/forms` 的 `InputGroup.Root/Addon/Input/Textarea/Button`，复用Field/Input | 一个Field仍只有一个control，Addon不领id；label/help/error由Field关联。focus-within仅改变已有组边界颜色，invalid优先，输入自身无第二边框或outline；内嵌Button type=button，显式disabled不猜busy |

Command复用已安装的Combobox：inline列表、搜索、分组、空态、disabled、选择与键盘；只声明上述稳定组合，不照搬cmdk。React 输入节点保持稳定身份，aria-controls/activedescendant/selected/multiselectable 与同一受控事实一致；ArrowUp/Down/Home/End跳过disabled，Enter执行，Escape清过滤而保留选择。action不作权限/副作用校验，也不自动等待/重放业务。需要远端搜索或更细peer部件时组合已有Combobox/Select，不能用私有默认样式补丁。

Calendar使用共享 TypeScript 日期模型；React 更新一次发布一致快照，选相邻月份后保留所选日焦点。Arrow左右一天、上下七天、Home/End周端、PageUp/Down按月并夹到有效日，Enter/Space走按钮选择；禁用日期可焦点读取但不能选择，clear清空选择。月份查看不是业务查询，动画不等待操作。Calendar本身不选择时间；组合日期与时间使用下方 DateTimePicker。没有农历、复杂可用性/节假日或预约引擎。defaultMonth只定义初始视图；未传month时月份查看由库保存，month=YYYY-MM为受控视图。onMonthChange 只通知用户翻月、跨月键盘或相邻月日期选择的请求；外部共享模型更新/React month 变化不通知，不改变value，不触发onValueChange。共享模型的 setMonth(YYYY-MM) 是绝对月份请求，moveMonth(delta) 沿用相对移动；同月 setMonth 为 no-op。受控宿主未确认时保持原查看月，焦点仅在现有42格内移动，接受请求后恢复目标日；外部跳月回该月首日，标题与grid保持一致。disabled仍允许浏览月份但禁止选择/清空，disabled日期可读取。年份严格0001..9999，无隐式时区转换。

快速年月定位使用公开Input、SimpleSelect、Button与受控month组合，见[React](../examples/calendar-month-react/app.tsx)。日期与月份可独立受控；single/range不因翻月清空，locale只改变显示。defaultMonth的后续变化不重置视图；不通过修改value或重挂Calendar定位。

ToggleGroup 的紧凑高度使用 `--toggle-height`，不继承普通 Button 的高度；文字放大仍可自然增高。InputGroup 的边框属于组外壳，内部单行/多行控件分别消费 `--input-group-control-min-height` / `--input-group-textarea-min-height`，扣除外壳边线后与独立 Input/Textarea 对齐；内嵌动作复用同一内部高度。默认值与覆盖由 [DESIGN](DESIGN.md#组件尺寸与职责) 定义，不在组件硬编码像素。

Calendar 的禁用日期不出现可操作的 hover/pressed 底色；选中端点在 hover 后保留选中底色。forced-colors 下 Calendar 和 ToggleGroup 用额外下划线保留选择事实，焦点不添加outline或新边线；有可见边框时仅改变原边框颜色。


### 多行输入与上下工具区域

`InputGroup.Root` 的 `layout='inline'` 为默认横排，显式 `stacked` 按 DOM 纵向排列、拉伸控制项。`InputGroup.Textarea` 就是已存在的 Textarea 函数，直接接受 textarea props/ref；id、name、required、label/help/error 继续由 Field 与真实控制项共同绑定。只生成 xui-textarea，不额外套 xui-input。上下 `Addon` 使用 span，放合法短语内容、附件文字和按钮；自然换行，采用既有 padding/gap，空 Addon 不占位，不新增 Toolbar part。

```tsx
<Field label="草稿" help="可输入多行" required>
  <InputGroup.Root layout="stacked">
    <InputGroup.Addon><span>附件.txt</span><InputGroup.Button>移除</InputGroup.Button></InputGroup.Addon>
    <InputGroup.Textarea name="draft" defaultValue="保留草稿" />
    <InputGroup.Addon><InputGroup.Button>附加文件</InputGroup.Button><InputGroup.Button disabled>发送</InputGroup.Button></InputGroup.Addon>
  </InputGroup.Root>
</Field>
```

Textarea 位于 `.xui-input-group[data-layout='stacked']` 中时，label/help/error 与 aria-describedby/aria-invalid/required 仍由 Field 关联到真实 textarea。唯一背景、边线和 focus-within 在组外壳；直接 Input/Textarea 不再画边线/背景/outline，Textarea 自身的 padding、字体、最小高度与浏览器 resize 保留。工具按钮聚焦不新增外框；组边线随focus-within变色，invalid错误边线优先。组的 invalid/disabled 只由直接真实 Input/Textarea 与既有 Field error 投影，单独禁用发送按钮不会灰掉可编辑区域；没有第二个 Root.disabled/invalid owner。readOnly 保留浏览器选择/复制和焦点语义。

库不处理 Enter/IME/提交策略、发送 busy、草稿和附件状态。正式 [React](../examples/widgets-react/app.tsx) 的“多行字段组合”给出合成示例；`widgetsDemo.setComposerState` 可改变 layout/disabled/readOnly/invalid/sendDisabled/emptyAddons，`getComposerControl` 返回真实 Textarea，`getComposerEvents` 仅计合成 composition start/update/end 事件，不构成 OS IME 验收。没有具体产品域模型或网络调用。

### Button与选择控件补齐

Button variant=link提供文字链接外观，默认type=button。button继续Enter/Space执行；真正导航需renderHTML a、nativeButton=false和role=link（或直接HTML a.xui-button[data-variant=link]）。链接保留Enter、Space不模拟点击、修改键/中键/target/download；外观不改变导航所有权。aria-busy仍不自动disabled，焦点独立可见。 link默认文字使用action-primary；hover（含指针按下）使用interaction-hover及其成对interaction-hover-foreground，图标继承currentColor；disabled不应用hover配方。宿主不为修复默认对比度穿透私有CSS。

SimpleSelect/Checkbox/Radio/Switch的controlSize=sm/default/lg是视觉尺寸，默认default；SimpleSelect的size:number只作为隐藏表单桥事实。显式NativeSelect平台API保留原生size:number，默认采用政策见[DESIGN](DESIGN.md#公共复用与状态矩阵)，不增全局密度模式。React 使用data-control-size对应。选择控件的 readOnly 由 React 公共层阻止 click 与 Space（radio 也阻止改变选择的箭头），保留 Tab/指针焦点与 aria-readonly；不等于 disabled。受控 checked 和非受控 defaultChecked 均支持，readOnly 不触发 onChange。disabled 走真实 HTML disabled，表单提交语义不改。

### 平台输入边界

React NativeSelect / 浏览器 select 保留 OS 选择合同，CSS 外壳不能统一系统菜单。文件窗口、日期/颜色窗口、浏览器自动填充与密码管理器、移动键盘也属于浏览器/OS 能力；需要统一 date-only 日历时使用 Calendar。HTML 不支持 file/range/color 的 readOnly，不能用无效属性冒充只读或静默改成 disabled。Checkbox/Radio/Switch 只读使用 React 公共 guard，文本 Input/Textarea 保留 HTML readOnly。

Avatar 的被动图像、fallback 与名称合同见 [展示与媒体](COMPONENTS.md#avatar)。

### GroupedCombobox 与 Disclosure

正式消费：[React](../examples/grouped-search-react/app.tsx)、[合成宿主读取模型](../examples/shared/grouped-search-model.ts)。这是通用 UI 组合，不内置会话、归档业务、查询缓存或后端协议。

#### 为什么不能把 Disclosure 放进 Combobox.List

在固定的 Base UI 1.7.0 中，`Combobox.List` 的 Enter handler 只要存在 activeIndex 就会选择高亮项，不检查事件是否来自嵌套折叠按钮。`Combobox.Root inline open filter={null} → Input → List → Item + Disclosure(Item)` 因而不是 xui 支持的交互组合。即使没有复现错误，listbox 中也不应混入独立分页/折叠控件。

`Accordion.Root` 会建立另一份 CompositeList，影响 Item 注册；一个 Root 下放两个 List 又会竞争 listElement/listRef。两种写法均不在支持合同里。消费者不应添加 stopPropagation、穿透内部 DOM 或覆写 option 角色来补救。若需要每组内自由交互的表单/工具按钮，使用普通搜索和相应列表/表格语义，另设计键盘模式。

开发预览：运行 `pnpm dev`，待构建成功后在另一终端运行 `pnpm preview`；打开 `http://127.0.0.1:4173/grouped-search-react/`。正式独立安装仍由 `pnpm test:consumer` 验证，完整回归为 `pnpm verify`。

#### 最小公开组合

React 页面显式加载正式 `@coffeehc/xui-theme/style.css`；组件不隐式导入 CSS。

- React：`@coffeehc/xui-react/grouped-combobox` 的 `GroupedCombobox`。

- 共享类型与验证：`@coffeehc/xui-runtime/grouped-combobox`。纯验证函数 `getGroupedComboboxItems` 返回全量与展开组的选项，不发请求。

结构固定为一个搜索输入、仅可折叠组的同名开关、一个 listbox 中的分组标题/选项、listbox 外按组名标注的分页。控制区的名称由 controlsLabel 设置（默认“显示分组”，不额外显示标题）。归档开关与归档组同名，aria-controls 关联稳定容器；折叠时容器 hidden，选项卸载。不会产生两个 listbox 的复合注册竞争。

```tsx
<GroupedCombobox
  label="搜索结果"
  inputValue={query}
  onInputValueChange={setQuery}
  groups={[
    {id: 'normal', label: '普通结果', items: normalItems,
      pagination: {page: normalPage, pageCount: normalPageCount}},
    {id: 'archive', label: '归档结果', items: archiveItems, open: archiveOpen,
      pagination: {page: archivePage, pageCount: archivePageCount}},
  ]}
  onGroupOpenChange={setGroupOpen}
  onPageChange={setGroupPage}
  value={selectedId}
  onValueChange={setSelectedId}
/>
```

groups、inputValue、open、pagination 均由 React 宿主受控；回调只请求宿主更新，不先行猜测接受。`value` 可受控；省略时使用 `defaultValue`（默认 null）。onValueChange 仅在接受不同的选中值时回调，重复激活已选项不重复通知。搜索不会填成已选名称，也不因清空查询而清空选中值。条目为 `{id,label,disabled?}`；id 是不透明字符串，在全部组中唯一，包括折叠组。两个组件实例可使用相同业务 id，DOM id 仍独立。

组省略 open 时始终显示，不显示开关；显式 true/false 表示可折叠受控组。组 disabled 禁用其选项、开关和分页；全局 disabled 禁用全部操作。busy 只报告 aria-busy，分页是否禁用由 pagination.disabled 明确控制。emptyLabel 用于组外状态反馈；它可以由宿主表示正在读取、无结果或错误，不能把三者混为一谈。page/pageCount 为正整数且 page 不超过 pageCount；不透明 cursor 的映射仍由宿主负责。

#### 键盘、焦点与读取职责

| 情况 | 公共库 | 宿主 |
| --- | --- | --- |
| 查询 | 保持同一输入 DOM；单一 listbox 的 aria-controls/activedescendant | 一个 query 驱动两路过滤或远端请求；可防抖 |
| ArrowUp/ArrowDown、Enter | 跳过禁用候选，在展开且可用的选项中导航、选择；越过首尾先回无高亮的输入位置，DOM 焦点留输入；鼠标与 blur 不伪造键盘焦点 | onValueChange 执行业务选择；不会自动路由或发写请求 |
| 折叠开关 Enter/Space | HTML button只请求展开/收起，不触发列表选项选择 | 接受 open 状态；关闭时禁用归档读取并 Abort |
| 收起/替换选项 | 移除隐藏 options；活动项清除或回到仍可见的有效选项；不指向不存在的 DOM | 忽略取消后迟到结果，保留所需 query/selection |
| 分页 | 同组命名按钮、边界禁用；两组页码互不拥有 | 独立页码/游标和请求；查询变化如何重置由宿主决定 |
| 控制区焦点 | 更新保留按钮 DOM；聚焦的分页被移除时回该组开关，否则输入；不抢走已移到外部的焦点 | 关闭外层 Dialog/Sheet 时由外层拥有最终回焦点 |

示例使用合成读取延迟，归档初始关闭时不读；展开才读；关闭取消正在进行的归档读取；关闭期间查询更新只读普通组；再次展开使用当前 query；两组各自分页。示例 generation/AbortController 是宿主参考实现，不是库内置请求引擎。

#### Disclosure 默认箭头

`Disclosure` 保留 title/open/defaultOpen/onOpenChange/disabled 合同，defaultOpen 默认 false。默认指示器已由加减号改为装饰性 chevron。公开 `DisclosureIndicator({open,className?})` 可在库支持的按钮组合里复用；它固定 aria-hidden/focusable=false，不提供额外 accessible name。title 应是非交互标签内容，不嵌套按钮。

React Disclosure 由组件维护装饰性 chevron；自定义 indicator 应自己设置 aria-hidden，不能替代 trigger 的 aria-expanded/controls。

尺寸来自 control-icon-size，描边来自 icon-stroke-width，旋转/过渡复用 motion-disclosure-rotation、motion-duration-fast、motion-easing；reduced-motion 复用主题的全局归零规则。公开 `.xui-disclosure-label` 提供长标签换行，disabled 不响应 hover/pressed。受控收起包含当前焦点的内容时回到 trigger；已经移动到其他位置的焦点不会被抢回。

## 展示与媒体

共享纯类型与状态 helper 从 `@coffeehc/xui-runtime/display` 导入；React UI 从 `@coffeehc/xui-react/display` 导入。
样式复用 theme/style.css（或 base.css、button.css、feedback.css），没有新字号、色板、路由或业务 owner。
正式独立安装示例：[React](../examples/display-react/app.tsx)。

### Icon 与状态强调

Icon从1.2.0提供，固定1.1.3归档不含此入口。

React `/display` 及根入口公开 `Icon / IconProps / IconShape`。组件承载已有图标库或SVG，不内置升级图形、版本判断、网络或权限。默认图标采用control-icon-size，SVG描边采用共享icon-stroke-width，xs Button内自动使用control-icon-size-xs；不设置独立字号。图形采用currentColor，保留图标本身的fill/stroke语义，未指定颜色时经icon-color继承所属文字/控件状态。

| 参数 | 合同 |
|---|---|
| `color?: React.CSSProperties['color']` | CSS前景值，可直接传`var(--action-primary)`、`var(--status-warning-foreground)`等公共语义变量，变量随主题实时解析；产品扩展变量须已在所属主题层定义，不随页写原始色。优先级为color参数、style.color、闪烁默认强调色、继承；禁用状态仍恢复所属控件颜色 |
| `blink?: boolean` | 默认false。true且未给color时使用action-primary，以既有motion-duration-pulse、motion-easing和motion-feedback-opacity-start柔和明暗交替；不闪灭、不位移、不改变几何或请求状态 |
| `aria-label / aria-labelledby` | 不提供时为装饰性隐藏；提供名称时是被动img语义，不新增键盘停靠、按钮或live region。独立动作使用IconButton并将动作名称给按钮，内部Icon保持装饰性 |
| `children` | 放一个图形，SVG尺寸/描边由库维护；不能放按钮、版本文字或用图标容器截断业务字符串 |

`prefers-reduced-motion: reduce`停止动画并保留静态颜色。disabled/aria-disabled/data-disabled祖先下的Icon恢复颜色继承并停止闪烁；点击、键盘、防重入、busy/disabled和回调仍由所属公共控件及宿主负责。busy本身不推断禁用。color只是绘制前景，不构成可用、成功、升级或权限事实。

中性底的提醒可用主题强调色；有色底按钮内显式使用`color="currentColor"`延续该控件的成对前景。图标与状态文字需要同色时，把同一变量传给Icon和Badge，文字无需跟随闪烁。`Typography.Text`也接受color参数，保留其既有body字体角色；元数据继续按所属slot或Badge呈现，不包一层正文Text再缩字号。

```tsx
const noticeColor = 'var(--action-primary)';
// 条件、版本截断和动作仍由宿主提供，xui只呈现。
<>
  <SidebarFooterContent>{currentVersionLabel}</SidebarFooterContent>
  {canUpgrade && <IconButton variant="ghost" aria-label="升级到新版本"
    disabled={upgradeDisabled} aria-busy={upgrading} onClick={onUpgrade}>
    <Icon color={noticeColor} blink={attention}>{updateGlyph}</Icon>
  </IconButton>}
  {canUpgrade && <Badge color={noticeColor}>
    <Icon color={noticeColor} blink={attention}>{updateGlyph}</Icon>
    发现新版本 {latestVersionLabel}
  </Badge>}
</>
```

版本点分字符串保留几段、图标是否显示、管理员权限与升级回调全部留宿主；本库不新增专用升级组件或动画控制器。[React示例](../examples/display-react/app.tsx)的`?icons`用合成状态展示开关、四类语义颜色、独立图标、Badge/文字与xs动作。验收覆盖三主题、变量变化、blink开关、减少动效、disabled/busy、键盘与窄屏/放大，不能把本节或示例存在当作已通过。

### Typography

字体、字号、行高和字重由 xui 的[公共文字槽映射](DESIGN.md#公共文字槽验收)统一定义，消费项目非必要不得自行设置内容字号。Heading 分开指定 `level` 与 `visualRole`，Text 为正文、Link 继承所属文字槽，Code 为技术值；slot 的裸文本自动继承它的角色，嵌套 Button/Badge/Field 保留自身规则。不要在 meta 里包一层正文 Text 再用 CSS 改小；直接传字符串或无样式 span。

4.2.24起，Typography.Link、LinkedText、xui/xui-layer范围内原生a及Button的link变体默认无下划线，hover/pressed/focus/visited不另加装饰。Link保留action-primary和原文字槽字体；Button link保留原hover成对前景/背景、禁用和点击区。键盘focus-visible不新增外框，无边框链接保持原外观，原生href/target/download/rel/修饰键与导航owner不变。访问后不切换到浏览器默认紫色，xui范围外HTML不受此规则覆盖。forced-colors的导航/控件选中下划线仍表示选中事实，不在本次删除范围；没有新增装饰props或要求消费者写私有CSS。

`TypographyTextProps.color`支持直接指定语义颜色变量，只覆盖前景，不改变tone以外的文字角色；省略时保留旧行为。颜色参数优先于style.color与tone的默认前景。

本合同同时是 xui 发布门槛：正式独立消费者的[文字槽示例](../examples/typography-slots-react/app.tsx)不引入私有 CSS；浏览器逐项检查计算后的四项字体属性、父槽与子组件边界、主题、长中文与放大。纯布局/无文字部件按映射记不适用，新增文字 part 必须有角色及对应证据。


### Copyable

value 必填，展示完整值且仅复制这个值。用户点击后默认复用 runtime 剪贴板服务，优先调用 Clipboard API writeText；仅 API 缺失时才尝试临时 textarea/execCommand 回退。不读取剪贴板，不因权限拒绝或写入失败自动再次写入。失败显示安全的就地文字，不泄露异常消息；调用方可注入 `(value:string)=>void|Promise<void>`，宿主可注入同一 writer 合同。

4.2.28修复普通HTTP回退的零尺寸原生选区：保持不可见、脱离文档流、焦点/选区/滚动恢复和临时DOM清理。copied代表所用平台接口确认，服务不读回剪贴板；正式系统验收应使用原生浏览器和合成中文/多段/Markdown文本完整核对OS内容，mock execCommand只能证明调用及恢复流程。

idle/copying/copied/error 是当前交互事实。按钮 disabled 与 copying 独立于外部业务。
重复点击不并发写剪贴板；销毁/取消可停止本地等待，但不承诺撤回已经交给 OS 的写入。服务会等真实 writer settle 后才开始下一项，不能让后续写入越过仍未完成的 OS 操作。
value、writer 或 disabled 改变使旧结果失效；仍等待旧 write 结束后才能发起下一次复制，以免旧复制晚到覆盖新值。旧结果不会显示新值“已复制”。
状态不使用超时假定成功，不自动重试，不抢焦点。labels 可覆盖 copy/copying/copied/error。

密码和其他秘密不默认接入；值与授权由宿主明确决定。

### Separator 与 Tag

`Separator` 默认 horizontal、非装饰，具有 separator 与 aria-orientation；vertical 使用父容器 stretch，宿主提供布局高度；decorative=true 使用 none/aria-hidden，不成为多余读屏节点。

横竖线宽消费 `line-width-separator`，颜色消费 `separator-line`；Surface 仍独立消费 `line-width-surface`。默认均为 1px，同根 `product-overrides` 可独立覆盖分隔线宽，不改变区域边框。基础层实际验证和限制见 [VALIDATION.md](VALIDATION.md)。

`Tag` 必填安全字符串 label。被动标签没有 tab stop。
可移除分支必须提供 onRemove 和明确 removeLabel，使用真实 type=button；disabled 不发意图。
标签没有隐式选择状态，选择 chip 使用已有 ToggleGroup。

onRemove 只发删除意图，不自动删除 React 子树或猜邻居。宿主更新其集合。
可选 `onRemoveFocus(trigger)` 在 onRemove 后调用，供宿主聚焦明确输入/已存在邻项；异步确认/React 提交后才能确定目标时，宿主在确认/提交后按自己的稳定 key 管理焦点。

### Image

`Image` 必填 src 与 alt，装饰图片显式 alt=''。
必须提供有限正数 width+height，或 aspectRatio（可另给 width，不可同时给 height）。
这些是调用方内容尺寸，不是新的品牌 token。宽度最多为容器 100%，高度按预留比例计算；loading、error、loaded 共用同一外框，fit 默认 contain，可 cover。

缺省 loadingLabel='图片加载中'，fallback='图片无法加载'，均可本地化安全字符串。
内容图片在占位阶段保留 alt 与状态的可访问描述；装饰图片占位 aria-hidden。加载后只暴露真实 img 的 alt。
加载/错误回调 onStatusChange 报告实际资源事件；空 src 直接错误，不对当前页面发送空地址图片请求。


### Card

React `/display` 及根入口公开 `Card / CardProps / CardBadge / CardHeadingLevel`；纯 Badge/heading 类型从 runtime `/display` 导出。CSS 使用正式 `base.css` 和已有 Surface/Badge/Toolbar 样式，完整 `style.css` 已包含。

以下图标强调、标签外观、Footer分区与伸展参数从1.2.0提供，执行结果见[验证记录](VALIDATION.md)。

| 区域 | 公开内容 | 合同 |
| --- | --- | --- |
| Header | `title`、`headingLevel`、`icon`、`iconVariant`、`iconShape`、`iconColor`、`badge`、`actions` | 必填非空标题；headingLevel 2–6，默认3。图标为装饰，默认tile+主题强调色，plain适合已有头像/图像表现；badge默认neutral+soft，可显式color/variant。辅助动作与标题、Badge分离，窄屏可换行 |
| Content | `description` 与 `children` | 唯一内容区 `.xui-card-content`。description 是可选 muted/body-sm 文本，children 是领域正文；两者按顺序放在同一容器，不新增第四块、独立边框或另一套正文布局 |
| Footer | `footerMeta`、`footerActions`、`footerVariant` | 次要事实与业务动作属于同一页尾区，分别分组；默认band有公共支持表面和唯一分隔线，plain保留朴素呈现。元信息优先收缩，动作组放不下时才换行；具体边界见下文4.2.30规则；两者都空时整个页尾不占位 |

4.2.30补齐Footer压缩合同：footerMeta优先伸缩，最小可读轨道来自card-footer-meta-min-inline-size（默认依赖control-height），footerActions保留独立控件尺寸。二者及间距能放下时同行，长来源不再先把操作推下一行。meta使用OverflowText即可在支持动效的桌面指针环境省略，公共Card自动提供该卡片既有交互区域，不要求CardGroup消费者获取ref/穿透DOM；显式interactionRef仍优先。焦点/hover只揭示当前卡，不借整个集合触发其他卡的元信息。减少动态、粗指针或该卡没有既有可用键盘入口时，继续完整换行静态文字，不新增tab stop或藏掉无法揭示的事实。

空间确实不够时，Footer将动作组放到下一行；动作组自身仍容不下则按原Toolbar换行，绝不裁动作、缩字号或强制同行。actions-only保持右侧动作且不预留meta空间，meta-only不造按钮/焦点，全部空仍无footer。业务不需要版本/来源时直接省略footerMeta；示例不是必须恢复该信息行。正式[CardGroup示例](../examples/card-group-react/app.tsx)的?footer-meta展示可选元信息与Switch/详情/删除，&actions-only、&meta-only、&plain-meta、&draft分别展示槽位缺省/纯文本/保留草稿；不改变业务请求或权限。

4.2.31起，头部actions及footerActions组统一使用card-actions-gap，默认依赖space-text-gap（100%阅读比例时4px），与普通Toolbar的layout-toolbar-gap分开。默认IconButton命中区仍36px，相邻图标按钮中心距由44px收紧到40px；Switch、按钮字号/图标、焦点语义及危险tone不改。主题可在公共Token层调整card-actions-gap，不需要新增密度prop或穿透内部DOM/CSS。外层Footer的meta与动作分区间距、空间不足时换行、无meta时右对齐等合同保留；紧凑不承诺所有净宽均强制同行。

[正式CardGroup示例](../examples/card-group-react/app.tsx)的?footer-meta&icon-actions使用默认尺寸Switch、详情/编辑/删除IconButton；&actions-only省略meta、&header-actions同时展示头部动作，&draft用于刷新保草稿。图标为宿主合成内容，实际动作、disabled和busy仍由原业务owner提供；普通表单/搜索Toolbar没有改变。

Card仍只有header/content/footer三个根级区域，自身用Surface.padding=none避免重复内距，各区由公共Token提供边距。默认自然高度；`stretch`显式伸展到所属flex/grid轨道，content可增长、footer靠底，不设置正文像素高度或行数。图标容器、首行偏移与Footer背景由card-icon-size/offset/background和card-footer-background定义，标题仍section字体、正文仍body、底部仍meta，业务动作保留自身控件规则。

`iconColor`与`badge.color`接受公共语义变量；缺省图标为action-primary，中性归属不冒充info/success。Avatar.Root也公开color并默认继承所在角色，适合真实头像/fallback；Icon适合已有SVG图形。宿主通过这些参数组合，不给内部svg补颜色或给卡片改字号。摘要由宿主从真实来源提供，完整说明留原详情；库不截断业务字符串、不伪造版本/指标/运行状态。辅助文字动作可显式使用Button size="xs"；图标动作默认命中区不因紧凑而缩小，不通过Card后代规则强改按钮尺寸。

默认tile已经拥有唯一身份图标容器，icon槽推荐传裸图形节点（如现有Brain图标）、裸emoji/文字，或无背景的公共Icon；不要直接复用列表中带Avatar外框的辅助组件再嵌套一层。列表头像继续使用Avatar；卡片确实展示真实头像时明确iconVariant="plain"，使用Avatar.Root/Image/Fallback与公开color。默认继承必须在正式消费者中验证，不能用宿主样式覆盖来补齐。

`Card` 自身是 section，不添加 role=button、tabIndex、路由、请求、选中或 disabled owner。交互在已有 Button/Link 中，busy/disabled 按它们的公共合同显式传入。标题 hover/focus 展示按 [OverflowText](#通用长标题)执行；卡内没有键盘动作或 reduced-motion/触屏时完整静态换行。组件只负责一层 Surface 与默认间距，宿主不复制 header/content/footer 布局。React 保持正常 key/type 协调；移除内容会按 React 生命周期卸载对应子树。

```tsx
import {Card,Icon} from '@coffeehc/xui-react/display';
import {Button} from '@coffeehc/xui-react/button';
<Card title={resource.name} icon={<Icon>{resourceGlyph}</Icon>}
  iconColor="var(--action-primary)"
  badge={{label:'公共', color:'var(--action-primary)'}} description={resource.summary}
  actions={<Button variant="ghost" size="xs" onClick={openMenu}>更多</Button>}
  footerMeta={resource.updatedLabel}
  footerActions={<Button variant="ghost" size="xs" onClick={openResource}>查看资源</Button>}>
  {content}
</Card>
```

正式React消费者：[display](../examples/display-react/app.tsx)的`?card`；追加`avatar`、`icon=plain`、`badge=plain`或`footer=plain`比较公开参数。完整页面继续使用[页面/表单/刷新](../examples/page-composition-react/app.tsx)。库级示例与产品迁移分别验收，结果见[验证记录](VALIDATION.md)。

### CardGroup

`@coffeehc/xui-react/card-group`（及根入口）的 `CardGroup<T>` 是受控记录集合，复用 Card；`CardGroupProps<T>`、`CardGroupContext`、`CardGroupCardProps` 同步公开。运行时共享的状态/分页纯模型位于 `@coffeehc/xui-runtime/collection-view`，没有原生 UI 实现。

| 内容/事实 | 公开入口与归属 |
|---|---|
| 当前记录和稳定身份 | `rows:readonly T[]`、`rowKey(row):string|number`；禁止索引/随机/时间戳身份，数字与等价字符串不能重复 |
| 每条记录的卡片模板 | `renderCard(row, context):CardGroupCardProps`；返回公开 Card props，集合拥有实际 Card 实例与 key，不返回 JSX、不复制卡片 DOM/CSS |
| 同组卡高 | `cardSizing='natural'|'equal'`默认natural兼容独立高度；资源网格显式equal，由当前网格最大内容确定共同高度，集合统一传Card.stretch，模板不再拥有stretch |
| 当前上下文 | `rowIndex`为当前可见页基数0位置，`rowKey`为真实身份，`busy/disabled`为当前集合事实；回调中使用当前 row，不缓存旧索引 |
| 头部、正文、卡尾 | 模板返回Card的title/icon/iconColor/badge/actions、description/children、footerMeta/footerActions/footerVariant；分类Badge默认neutral+soft，三段按Card公共合同呈现，不按资源领域内置不同布局 |
| 工具栏 | `toolbar`或宿主`pageToolbar`二选一，始终在 body 外；填公共 SearchToolbar/控件，不重复同一查询动作 |
| 状态与空/错反馈 | `status`、`filtered`、`disabled`、`emptyState/errorState/feedback`、`onRetry`、`labels`；首次无数据在 body，已有卡片刷新/失败在集合 footer 保留当前内容 |
| 计数和翻页 | `pagination`复用 `CollectionPagination`或`CollectionCursorPagination`，与DataTable相同受控事实；`footer`仅补充内容，不再复制计数/翻页 |
| 布局和滚动 | `layout='natural'|'workspace'|'document'`默认natural；前两者正常高度在有界父容器内仅body滚动；不足以容纳工具栏/最小正文/页尾时整个集合滚动回退；document不创建内部滚动；toolbar/footer外置 |

`renderCard` 的业务控件按权限与操作语义采用 context.disabled（含 busy），集合不会递归克隆/禁用任意 slot 内容。被动卡片不增加 Tab stop、整卡 click 或 selection owner；业务主动作使用正常 Button/link，输入草稿由业务稳定组件保存。空工具槽、空反馈与空附加footer不留占位；计数可通过`labels.count`明确返回空字符串。长中文完整保留，尺寸放大后按净宽自动退列；`--card-group-item-min`默认依赖`--layout-field-long-min`，仅在产品根Token层覆盖。

equal使用CSS网格等分自动行和Card伸展，不新增测量器或高度状态owner。所有可见行依据当前完整内容取得共同卡高，content承接多余空间，存在的footer靠底；缺少footer不会生成空footer。单列/长中文/200%文字或界面缩放继续增加所需高度，不裁正文或动作，不固定像素高度。切换natural/equal只改布局与属性，原Card/字段/焦点身份不变；busy/empty/error、排序及offset/cursor合同保持。

```tsx
<CardGroup
  label="研究任务"
  cardSizing="equal"
  rows={rows}
  rowKey={row => row.id}
  status={status}
  renderCard={(row, context) => ({
    title: row.name,
    description: row.summary,
    footerMeta: row.ownerName,
    footerActions: <Button size="xs" disabled={context.disabled} onClick={() => open(row.id)}>查看</Button>,
  })}
  onRetry={retry}
  pagination={pagination}
/>
```

与DataTable共用同一状态和footer实现。offset需要pageIndexOffset、真实total或null；cursor需要nextCursor/hasPrevious，不推导游标/总数、自动钳位页码或自己发请求。onRetry、翻页和修改每页大小只发意图，同回合防重入，宿主确认后回传事实。刷新时宿主保留同范围rows；集合不会暗存旧记录，也不会把另一查询范围的旧数据冒充当前结果。排序/更新沿相同key协调，保留仍存在的Card与草稿；被移除或翻出页的对象按正常React生命周期卸载，不承诺跨页草稿缓存。完整[正式示例](../examples/card-group-react/app.tsx)覆盖两种工具栏归属、三种layout、offset/cursor和局部失败恢复。

本批示例默认采用equal，`?sizing=equal&varied&accent`提供不同长度摘要、图标与归属强调以及公开等高切换；`sizing=natural`可对照，`footer=plain`比较卡尾。库级默认仍natural，消费项目应在所有采用同一资源列表规范的CardGroup实例显式选择equal，不按智能体/技能/工具分支设尺寸。执行结果见[验证记录](VALIDATION.md)，库级验证不代表消费项目已升级。

### MetricCard

`MetricCard` 是一个被动统计单元，复用 `Surface` 的单层表面、现有统计文字与间距 token。多卡排列仍由调用方的 `Grid` 决定。它不拥有指标列表、请求、状态引擎、数值格式化、单位推断或业务颜色映射。

React 正式入口为 `@coffeehc/xui-react/metric-card`，根入口同时导出 `MetricCard` 与 `MetricCardProps`。CSS 在已有 `@coffeehc/xui-theme/feedback.css` 中，也包含在 `style.css`、`components.css` 与 `critical.css`。

- `label: ReactNode`：调用方提供可读指标名，使用行内内容。
- `value: ReactNode`：调用方提供最终显示内容；数字 `0` 原样显示，不自动变成未知。格式化、单位、空值、错误与加载说明由调用方明确表达。
- `marker?: ReactNode`：可选逻辑行尾 slot，通常位于右上；RTL 时跟随逻辑方向。可以是图形、Badge 或已有公共控件。不传、`null`、布尔值、空字符串和空 Fragment 均不预留可见空间。
- 其余 `Surface` 的 section props、`className`、`style`、`ref`、ARIA 与事件透传；不提供 `children`，避免绕过名称/值结构。

根节点默认无按钮角色、tabIndex、点击反馈或 live region。内部 `dl`/`dt`/`dd` 关联名称和值；不会额外生成一排命名地标。调用方可按实际需要命名 section、提供 `aria-busy` 或在自己的反馈区通知状态。

标记不默认设置 `aria-hidden`。纯装饰图形由调用方设置 `aria-hidden="true"`；有含义的颜色必须同时有可读文字或可访问名称，不能只靠颜色传达状态。交互标记使用真实 Button/link 等公共控件，自行提供名称、权限、disabled/busy、Tooltip 与回调；卡片不会代管或截获其事件。标记应为行内内容，不在 `dt` 中嵌套章节标题或整块页面。

#### 主题、长内容与采用

名称用 body-xs/muted，值用 metric/heading/tabular-nums/mono，内距和名称到值的间距用 `metric-padding`/`metric-gap`；边框、背景和圆角仍由 Surface 的 card token 提供。没有新增默认设计值或固定宽高。长名称、连续长数字和字符串自然换行；名称按自然内容参与分行，宽标记空间不足时换到逻辑行尾，不把短名称挤成竖排。卡片高度随内容增长。Grid 的列数、自定义宽度与整体布局留给调用方。

组件、公开 CSS、正式导出和空值/标记的单元测试见 [metric-card.test.mjs](../tests/metric-card.test.mjs)；独立消费者的浅/深/system、320px/宽屏、276px 近满宽标记边界、长内容、200% 根文字、动态更新和交互标记检查见 [metric-card.spec.mjs](../tests/browser/metric-card.spec.mjs)。实际已跑范围与未测边界见 [VALIDATION.md](VALIDATION.md)。

### Avatar

React `/avatar`及根入口提供Avatar.Root/Image/Fallback与AvatarRootProps，图像与fallback生命周期继续由同一peer管理。Root的size保持sm/default/lg；同批新增color用于前景，可直接传公共CSS变量，省略时继承所属角色，背景及形状保留公共默认。Fallback仍采用control字体，不要求宿主自设字号。Root原有className/style函数、ref、render和状态参数保留，color只覆盖前景，不替换图像或重挂fallback。

Card的icon槽可放Avatar或Icon：已有完整头像表现时选择Card.iconVariant="plain"；需要统一身份图标容器时用默认tile。业务名称、图片alt、真实src及fallback文字由宿主提供，不借头像伪造身份、运行状态或权限。1.2.0的默认Avatar前景由固定foreground改为继承；真实执行范围见[验证记录](VALIDATION.md)。


## 布局与顶栏

默认尺度、边界与动效只由[DESIGN](DESIGN.md)定义；本节规定布局组合与内容所有权。[公开入口](PUBLIC_API.md)提供正式 exports/types，完整可运行消费者见[React](../examples/header-controls-react/app.tsx)。不创建同义 PageLayout，不要求消费方修改内部DOM或写定位CSS。

### 语义区域矩阵


| 区域 | React 公开入口 | 默认与响应式 | 所有权/更新 |
| --- | --- | --- | --- |
| 平台前置安全区 | `headerSlots.leading` / `AppHeader.leading` | primary 最前、自动菜单开关之前；不收缩，默认为空 | OS/窗口态/真实尺寸和 drag 规则由宿主提供；不内置平台像素 |
| 顶栏品牌 | `headerSlots.brand` | primary 内；长品牌省略，窄屏保持导航入口 | 内容由宿主提供；`title` 仅未指定 brand 时回退 |
| 路径 | `headerSlots.breadcrumb` | 品牌右侧；窄屏单独换行 | 宿主提供 nav 语义，不推断路由 |
| 顶栏左中扩展 | `headerSlots.context` | primary 末尾；窄屏另起一行 | 工作区/搜索等宿主内容，不与右辅助工具混合 |
| 运行状态 | `headerSlots.status` | secondary 起始，按需换行 | 真实状态/文案由宿主提供 |
| 应用动作 | `headerSlots.actions` | 状态之后，可换行 | 不复制主题/语言/菜单控件 |
| 顶栏辅助工具扩展 | `headerSlots.auxiliary` | controls 组内，语言/主题之前，可换行 | 不依赖 locale 启用，可放版本/帮助等宿主内容 |
| 默认主题 | `theme` / `themeLabels` | 右侧 controls 最后，一个图标按钮 | 复用一个 theme owner，无独立持久化 |
| 可选语言 | `locale` | auxiliary 之后、主题之前；未启用不生成控件 | 宿主 i18n owner 提供事实/列表/回调 |
| 独立账号区 | `headerSlots.account` | secondary 最末，工具组之外；窄屏自然换行 | 账号菜单/认证/权限完全由宿主拥有 |
| 侧栏顶 | `sidebarHeader` | 菜单之前；与底部一起限制高度并可滚动；compact 仍受公共栏宽约束 | 同一个侧栏树随响应式进入导航抽屉，不加第二个菜单开关 |
| 侧栏内容范围 | `sidebarTabs` | 侧栏顶最后一段，只放水平`Tabs.List`（默认line）；轨道铺满，项仍按content/equal排列 | List拥有唯一分隔基线，Shell交出header的底边/底部padding；共享Tabs.Root/Panel继续归宿主 |
| 导航正文 | `AppShell.sidebar` / `MenuLayout.items` | 长菜单自身滚动；sidebar 替换完整默认菜单区，null 恢复 items | 一个 shell/drawer owner；宿主保管自组内容生命周期 |
| 侧栏底 | `sidebarFooter` | 短菜单贴底；极长内容自身滚动 | 返回/授权/版本只是可选业务内容，无默认内置意义 |
| 页面标题与操作 | `pageHeader` 内的 `PageHeader(title/description/meta/actions)` | 正文滚动流开头；标题右侧 actions 窄屏换行 | 复用现有 PageHeader，不增加同义标题 API |
| 页内工具条 | `pageToolbar` | 标题下、主内容前；正文滚动流 | 过滤器/页内 tabs/提示等宿主内容，不做数据 owner |
| 主内容 | `children` / `content` | document/viewport 自然正文；workspace 模式填满剩余高度 | 恒定 content 容器，切换其他槽不重挂正文 |
| 页面底部 | `pageFooter` | 主内容后、同一正文滚动流，非悬浮覆盖层 | 页面说明/操作，与 sidebarFooter 独立 |

空的可选槽不占位；React 的 undefined/null/boolean、空字符串/数组/Fragment 不产生内容包装，数值0保留；自定义组件渲染结果由 React 决定，空 DOM 包装由公开样式收敛。不存在 runtime DOM UI slot。React 遵循正常 key/type 协调，宿主有意移除某槽会卸载该槽内容，不影响其他槽、正文和导航 owner。

富业务自组导航使用完整sidebar区域，不能把整份导航塞进sidebarHeader的限高槽。React 自组 sidebar 的焦点与内容生命周期由宿主组件持有，布局不会复制菜单树。

Tab按真实DOM顺序经过primary（leading、品牌、导航、路径、context）、secondary（状态、actions、旧header、auxiliary、语言、主题、account），然后侧栏/正文；不使用正tabindex重排。打开抽屉仍采用原模态焦点限制；关闭回同一个顶栏菜单开关。关闭当前聚焦的语言入口会把焦点移到相邻主题按钮。槽自身交互语义/disabled/busy由其组件或宿主拥有。

PageHeader 的公开 props 保持 `title/description/meta/actions`；主组 `.xui-page-header-main` 含 h1、可选 p 和 `.xui-page-header-meta`，动作放同级 `.xui-toolbar`。React PageHeader 使用公开 props/parts。meta 使用 muted/body-xs，空 Fragment/数组等不生成包装，长内容不撑破正文；它是页面范围事实，不重复放品牌或开发说明。

### 有界工作区与滚动所有权


- document：页面随文档自然滚动，适合普通列表/表单/文章。
- viewport：外壳默认100dvh，sidebar/main各自滚动；content仍为自然文档高度，不承诺把业务的100%高度解析为剩余窗口。
- workspace：外壳有界，顶栏按真实内容自然增高/换行；main内部pageHeader→pageToolbar→content→pageFooter，标题/工具条/底部占自然高度，content 获得明确的剩余高度，默认允许收缩到零。公开token `--layout-workspace-content-min-block-size` 默认0px，库拥有这条可收缩链，不要求宿主测量顶栏、减固定头高或定位发送框。

workspace的顶栏和page slots不覆盖正文；主内容的业务布局通常使用height/blockSize:100%、flex/grid、min-block-size:0，再让指定历史/编辑器/检查器区域overflow:auto。发送区保持业务正常流、不收缩，历史区吃剩余空间。main/content的overflow:auto只作为无法拆分内容或页头/页尾过大的可达性兜底；正常可容纳的业务布局只有指定内部区域产生滚动。过大的固定业务内容仍需要可访问的滚动，模式不是把任意页面强行塞进首屏的裁切开关。不要叠加另一套body overflow锁、复制库内部CSS或绝对定位composer。

需要非零正文视口的组合可在shell公开style绑定 `--layout-workspace-content-min-block-size`，库把下限限制在100dvh内。DataTable正式范例显式绑定 `var(--data-table-min-block-size)`，该组合不是自动推断；超高标题/筛选时main自然滚动，而非把内容困在零高的内部滚动口。普通workspace默认值保持0，已有聊天/编辑器不增加强制留白。宿主拥有自己的style值，React 按正常 style 生命周期更新/卸载。完整React范例见[DataTable](COMPONENTS.md#页面标题筛选与滚动)。

公开Root style可以提供宿主已有的明确blockSize来嵌入非全窗口；否则以100dvh为界。若宿主使用百分比高度，它必须先提供可解析的祖先高度。改变scrollMode、页内槽或leading不会重建main/content，保留正文输入、焦点与宿主状态。短内容占满可用工作区但不产生多余文档滚动；自然高度页面继续选择document。完整两栏长/短历史示例：[React](../examples/workspace-react/app.tsx)（`?direct`直接AppShell）。示例仅在自有业务元素上提供布局，不读取或改写库内部元素。

### 工作区正文贴边


几何贴边使用 CSS @scope 增强；默认焦点仅改变已有边线颜色，不绘制outline或新增边框。focus-width/offset保留既有滚动清距和布局几何，组内输入不重复绘制边界。旧引擎不支持 @scope 时保留原有安全 gutter。嵌套 ScrollArea 默认仍为 gutter；需要它也贴边时显式选 `focusMode='inset'`，最近公共滚动边界决定策略。边界统一处理 scroll-padding/scroll-margin，首末控制项仍可通过 Tab 和 scrollIntoView 到达。不要改私有 DOM/CSS 或把 focus-width 设为零。

完整消费者的 `?edge`、`?inset`、`?focus`、`?surface`、`?long-menu` 可组合，React `?direct` 同时覆盖 AppShell。`workspaceDemo.setContentInset` / `setFocusMode` 仅更新公开状态，正文草稿、节点、各滚动区和导航状态保留；`?surface` 用公开 Surface，`setSurfacePadding('default'|'none')` 可切换其自身内距。Surface none 只省略该表面 padding，不裁切内容，也不改变内部卡片默认内距。

### 窗口平台前置槽

`headerSlots.leading`（独立AppHeader为`leading`）位于primary最前，先于库生成的导航按钮；brand仍是品牌位置。leading默认无内容、无尺寸、无额外Tab目标。库保持leading不收缩并限制其最大宽度为所在行；其他内容按既有窄屏规则换行，DOM与键盘顺序一致，不使用CSS order或正tabindex。宿主提供的内容必须适配可用宽度，不能把无界固定宽内容当作安全区。

macOS hiddenInset的真实控件避让尺寸、全屏/退出全屏、Windows/Linux和无标题栏变化由宿主窗口集成决定：需要时传安全区Node，不需要时传null；库不检测平台、不固定traffic-light像素、不创建窗口按钮。装饰性占位使用aria-hidden且不设tabIndex；真的交互控件提供名称和正常键盘语义。示例`?platform`的OS按钮只是合成顺序验证，不是原生窗口控件。

Wails/Electron等drag/no-drag机制属于宿主桥接。仅对宿主自有非交互区域声明可拖动；interactive leading内容应按宿主框架标为no-drag，不可把可拖动样式继承到整套xui顶栏或覆盖自动菜单/主题/账号按钮。库不会猜测或修改框架专用CSS属性。浏览器布局与 DOM 顺序不能替代真实 Wails/hiddenInset 集成验证。

### 默认主题与可选i18n


未传受控 `ThemeOptions.mode` 时，文档owner使用非受控模式，默认持久化键为 `ui.theme.mode`；bootstrap config `theme.mode` 是默认，已有有效sessionStorage值优先，无值才回到config默认。无显式保存值和config覆盖时默认dark；显式system跟随系统变化，matchMedia不可用时effective为light，存储不可用仍可内存切换。显式注入 `ThemeOptions.mode` 是受控owner，`setMode`只请求，直到宿主 `syncMode` 才确认事实。公开init.js不创建主题owner；`bootstrap`/`getThemeService`取得同一文档owner。组件卸载只解除 `useTheme` 订阅，不销毁共享owner。默认共享owner在html替换或主题属性被清空后自动恢复当前模式/配色/缩放；useTheme不需要重挂或再次订阅，细节见[根节点恢复](PUBLIC_API.md#主题根节点恢复4238)。登录页继续只继承外观，不显示这个顶栏控件。

locale由共享I18nService提供；config默认禁用，`defaultLocale`为启动语言、`locales`为可选项，宿主通过config messages或已声明locale的 `registerMessages` 加入翻译资源。xui不附带全量翻译词典。`useI18n`提供当前locale、locales、`t`与 `setLocale`；查找顺序为当前资源、fallback资源、显式fallback、原key。禁用切换或不支持的语言不改变locale；成功更新同步 `document.lang` 并通知订阅者。`ServicesProvider`注入的i18n实例由宿主持有，View只订阅，不自行存储语言。

可运行接线见 [React 顶栏示例](../examples/header-controls-react/app.tsx)。

React 的同名槽由 props 更新；`headerSlots` 是一个整体对象值，替换时传入需要保留的全部顶栏角色，清空某角色用 null。业务返回动作放 sidebarFooter；图示旧返回位置不成为新默认。所有示例仅合成数据，不改产品认证、权限、后端或部署。

### legacy 内容与身份

旧AppShell.header未搭配headerSlots时作为完整legacy内容区放在primary，不当成brand拆分、裁切或强制子节点块显示；搭配headerSlots时仍位于secondary的既有legacy位置。重复同角色更新保持正常React协调；显式切换headerSlots有无会改变legacy所属区域，不能宣称该跨角色移动保留legacy子树身份。其他控件继续使用同一内部Frame。

### 标准列表与卡片正文

现有pageHeader组合PageHeader的title/meta/actions，pageToolbar组合DataTableToolbar/DataTableFilter；workspace正文使用DataTable即可得到库维护的表体/底栏高度链。搜索只能放pageToolbar或DataTable.toolbar一处。卡片列表复用相同页槽和ScrollArea/Grid/Card，不新增PageLayout。pageToolbar默认没有下边框且保留layout-section-gap，不再包产品整行分隔。完整合同及0/20/50/100行正式 React 消费者见[DataTable](COMPONENTS.md#数据表格)。顶栏紧凑与无框语言控件见下方相邻控件合同。

### 顶栏相邻控件

#### 相邻工具与账号

secondary 的相邻组统一使用 `space-control-gap`。账号仍是 controls 之后的独立语义槽，没有移动 slot、负 margin 或 CSS order。主题按钮和账号 Button 的尺寸、padding、图标以及命中区不改；主组与次组之间仍使用既有区域间距。

以默认根字号16px、36px主题按钮/16px图标、small ghost Button 的10px横padding与1px边框为例：按钮命中框之间的默认间隔从16px变为8px；主题SVG盒右侧10px + 组间8px + 账号左侧11px，得到约29px的可见盒间距。这是该公开组合的几何推导，不是所有账号内容的固定目标，也不是已跑的浏览器像素证据。头像宽度和账号文字由宿主公开内容决定；控件可换行，不能缩小命中区来得到紧凑外观。

#### 统一主题的语言入口与浮层

`HeaderLocaleOptions` 由 runtime `/header-controls` 作为纯数据类型公开，宿主提供 `enabled/value/options/onValueChange/label/disabled`。React 顶栏在 enabled 时用公开控件呈现语言入口，并复用同一个主题与 popover owner；不启用时不生成入口。runtime 不创建 select、popover 或 DOM binding。标准示例遵循 [DESIGN 公共封装政策](DESIGN.md#公共复用与状态矩阵)。独立 React `NativeSelect` 是公开的平台选择器 API，其 OS 面板不能通过 CSS 保证跨平台统一。

入口与浮层使用公共语义 token，装饰箭头不成为第二个焦点目标，RTL 使用逻辑方向，强制颜色下仍保留箭头与边界。浮层按触发器定位，受可见视口安全边距与可用高度限制，长选项滚动。

键盘支持 Enter/Space、上下/Home/End、文字定位、Escape 关闭回焦点、Tab 离开；禁用项不可选择。点击外部关闭。请求尚未由宿主回传时不显示未确认语言；unknown 当前值保持空显示。关闭入口会将焦点移到相邻主题按钮。

#### 受控事实与生命周期

语言选择在请求 `onValueChange` 时保持当前已确认值；宿主同步新 `value` 后才显示新事实。相同当前值、禁用控件、禁用选项和非法选项均不发请求。不在 options 中的当前值显示一项禁用空项，避免假装第一项已被选中；后续添加该值对应选项会显示宿主标签，不产生额外请求。

#### 正式消费者

[React](../examples/header-controls-react/app.tsx) 示例的 `?compact&locale` 展示账号、Avatar、状态与语言/主题，`&long` 展示长中文账号；React `&direct` 直接消费 AppHeader。均为合成状态，使用公共 CSS。测试入口为 [受控语言合同](../tests/header-locale.test.mjs)、[紧凑几何](../tests/browser/header-compact.spec.mjs) 和 [品牌与浮层](../tests/browser/header-popup-brand.spec.mjs)；实际执行范围见 [VALIDATION.md](VALIDATION.md)。

#### 品牌区域与内容对齐

AppHeader 的内容顺序是 leading/brand → 可选 navigation → breadcrumb/context。leading 保留平台安全区位置。MenuLayout/AppShell 桌面身份区域使用与侧栏相同的宽度 token，collapsed 自动跟随rail宽度；桌面收起/展开控件属于侧栏内部，不占顶栏内容轨道。窄屏恢复自然品牌布局，并将同一个公共控件移至顶栏作为打开导航drawer的入口。直接AppHeader没有侧栏，navigation仍可按宿主明确任务独立组合。

可选 `HeaderBrand` 以 logo 和 children 提供规范内容，业务链接可包在组件外。带 logo 的 compact 品牌名称仅视觉收纳，accessible 名称保留；不带 logo 的任意旧 brand 内容仍按区域截断，库不猜业务 DOM。

React 将此节点传给 headerSlots.brand，无产品宽度/定位 CSS。浏览器测试检查真实浮层、受控选择、长列表滚动、品牌/侧栏/正文几何和窄屏 drawer；Chromium 结果不能代替真实 macOS 系统、读屏器或移动 Safari。

HeaderBrand 的 logo 容器固定采用 control-height-sm，图片与 SVG 保持 contain，不因素材原始尺寸撑大顶栏。桌面 compact、无 leading 安全区时，logo 中心与 nav-collapsed-width 侧栏中心重合；补偿顶栏内容内距仅作用于品牌，不移动菜单 toggle。存在 leading 时保留该平台区域，品牌在剩余区域居中。名称继续保留可访问文本，窄屏恢复名称。

## 表单与页面编排

通过 `@coffeehc/xui-react/layout` 导出 FormGrid/FormGridProps、FormGrid.Item/FormGridItemProps 与 FormActions/FormActionsProps；根入口同时汇总。它们仅组合排版，列数、跨列、动作、窄屏和反馈标准只在 [DESIGN](DESIGN.md#表单编排的公共入口) 定义。

```tsx
import {FormGrid, FormActions} from '@coffeehc/xui-react/layout';
import {Fieldset, Field, Input} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
<form onSubmit={save}>
  <Fieldset legend="研究范围" layout="stack">
    <FormGrid>
      <FormGrid.Item><Field label="候选账户上限" required><Input name="limit" type="number" /></Field></FormGrid.Item>
      <FormGrid.Item><Field label="回看天数" required><Input name="days" type="number" /></Field></FormGrid.Item>
      <FormGrid.Item span="full">长说明、整行确认或编辑内容</FormGrid.Item>
    </FormGrid>
  </Fieldset>
  <FormActions secondary={<Button variant="outline" onClick={cancel}>取消</Button>}>
    <Button type="submit">创建任务</Button>
  </FormActions>
</form>
```

FormGrid `columns?:1|2` 默认2（可用空间不足仍一列）；Item `span?:'full'`，不指定按正常网格顺序。Fieldset `layout?:'inline'|'stack'` 默认inline。FormActions `secondary?:ReactNode` 与 children 主操作组都可省略；无内容不保留空组。使用原生 form 的 submit/reset、form 关联或 ref，不通过捕获整页 Enter 代替提交。

`@coffeehc/xui-react/feedback` 的 LoadingState/LoadingStateProps 新增 `layout?:'block'|'inline'`（默认block）；DataRegion/DataRegionProps 新增 `feedbackLayout?:'reserved'|'flow'`（默认reserved）。block相对所属内容区水平、垂直居中；DataRegion只有一个直接LoadingState时自动分配内容区，无children且busy时将feedback里的首次加载置于区域中心，保留既有最小高度；有明确高度时填充该内容区，无明确高度时使用现有反馈Token的最小高度。加载图标与长文本整体居中，窄屏或大字自然增长。inline留在所属动作/计数旁，不接管正文；原有Skeleton仍可按明确的内容骨架需求单独采用。DataTable与CardGroup首次无记录使用一个居中status，分别以可见表体（表头之外）和body为中心，工具栏/footer不计入；已有记录刷新仅显示footer的inline反馈。公共主题定义反馈样式；Spinner aria-hidden，加载文本用一个 role=status，错误摘要使用已有 ErrorState/role=alert。DataTable 已统一有行刷新的行内反馈，调用者不要再包第二个计数/分页/反馈或横滚 owner。

Spinner从1.2.0使用主题色开放弧：三边复用action-primary，一边透明，尺寸、线宽和旋转时长沿用既有公共Token。普通动效下持续旋转，reduced-motion下静止保留开放形状；不会生成百分比、请求或额外live区域。直接组合Spinner时，宿主应提供忙状态文字或可访问名称，不能仅用一个圆环表达状态，也不在宿主另画旋转皮肤。light/dark/system切换通过同一语义变量更新。

普通详情内容可直接使用公共区域；已有内容刷新时保持原来的详情组件身份，反馈改为inline。DataRegion不请求、不缓存，实际读取仍由宿主拥有。

```tsx
<DataRegion aria-label="对象详情" busy={busy} feedback={busy ? (
  <LoadingState layout={detail ? 'inline' : 'block'}>正在读取详情…</LoadingState>
) : undefined}>
  {detail && <ObjectDetails detail={detail} />}
</DataRegion>
```

完整接线：[React](../examples/page-composition-react/app.tsx)、[共享合成数据 owner](../examples/shared/page-composition-model.ts)。数据属于示例内存，不连接产品后端；测试桥只供失败/延迟验收，不出现在用户界面。详情与创建按需打开，表单不常驻列表上方。刷新保留草稿，提交冲突禁用由唯一 saving owner 控制，写入完成后显式同步当前查询，不能让更早读取覆盖新写事实。

React 示例的页面动作位于 MenuLayout 内，它拥有自己的导航 Dialog 上下文，因此创建入口显式请求受控 Sheet 的 open，而不让 Sheet.Trigger 绑定到更近的导航上下文；按钮声明 aria-haspopup/aria-expanded，Content.finalFocus 返回实际入口。详情与创建使用同级 Sheet.Root，不嵌套打开。React 页面只使用公共弹层焦点和关闭合同。

SimpleSelect 的展开浮层在自己的事件区域消费 Escape，先请求关闭自身并回到选择入口，避免同一次按键继续关闭外层 Sheet/Dialog。关闭被宿主取消时保留当前选项焦点；选择浮层已关闭时不截取 Escape，下一次按键交给外层弹层。React共用该行为，不要求宿主补私有事件监听。

## 导航与菜单

公开 UI 由 React `@coffeehc/xui-react/menu-layout` 提供 `NavigationMenu`、`MenuLayout` 与 `AppShell`。runtime `/navigation` 只保留 `NavigationItem`、状态/请求类型、索引/匹配/导航工具；它不创建菜单 DOM。其他 runtime 服务与模型仍按实际业务复用。

应用导航数据可来自 `getMenuService()`；其 `items/label` 与配置语言联动，但菜单的 `expandedIds`、focus、active route、导航动作和权限仍由宿主与 React NavigationMenu 所有。使用 NavigationMenu 的 React `controller` 时，它替换展开等组件状态，不替换 MenuService 内容；反之传 MenuService 也不会建立额外键盘或DOM UI owner。

### 导航 Controller 作用域

`NavigationMenu` 采用明确的实例优先级：显式 `controller` → 最近的AppShell/MenuLayout上下文Controller → 脱离Shell时由菜单创建的默认Controller。Shell内的默认借用适用于同一导航树的共同展示，不表示每个NavigationMenu自动拥有独立展开集合。在该Shell内，仅更换`items`、React `key`、条目id、Tabs范围或视觉隐藏也不会隔离借用的实例。

| 实际场景 | Controller归属 | 接线规则 |
| --- | --- | --- |
| 脱离Shell、未注入 | 该NavigationMenu默认实例 | 在菜单props提供展开/收拢选项，由组件管理默认实例生命周期 |
| Shell内同一导航树、未注入 | 借用最近Shell的实例 | Shell与导航约定同一个展开集合和收拢事实，不让多个独立范围写该集合 |
| 同一Shell内普通/团队/插件/归档等独立范围，尤其keepMounted | 每个范围各自稳定持有并注入实例 | 受控值与回调进入各自Controller；业务列表、游标、路由和权限仍归原宿主owner |

隐藏的keepMounted菜单仍然挂载，其effect和受控更新仍可执行。给多个菜单各传`expandedIds/onExpandedChange`并不会分离它们默认借用的Shell实例：后更新的空范围`[]`可覆盖另一范围的展开集合；更换id或仅隐藏Panel不能修复该归属冲突。这些独立范围必须使用公开`createNavigationPresentationController`与`NavigationMenu controller`，不能修改内部DOM或复制导航实现。

```tsx
import {createNavigationPresentationController} from '@coffeehc/xui-runtime/interaction';
import {NavigationMenu} from '@coffeehc/xui-react/menu-layout';

// 在所属范围初始化时创建一次；以下变量来自原范围和Shell事实owner。
const controller = createNavigationPresentationController({
  expandedIds, onExpandedChange, collapsed, onCollapsedChange,
});
// 原owner确认值或替换回调后同步；update不是用户展开请求。
controller.update({expandedIds, onExpandedChange, collapsed, onCollapsedChange});
<NavigationMenu controller={controller} items={items} activeId={activeId} />;
// 真正结束该范围生命周期时由创建者controller.destroy()。
```

注入后不得再把`expandedIds/defaultExpandedIds/onExpandedChange`、`collapsed/defaultCollapsed/onCollapsedChange`同时传给NavigationMenu；类型与JS检查均拒绝混用。`setExpandedIds`在受控模式只发请求，宿主确认后`update({expandedIds})`才改变事实。若各范围要跟随Shell收拢，应将同一个Shell owner的`collapsed`同步给各Controller，必要的收拢请求也回到原owner；注入不会再自动继承Shell的收拢状态。不要为展开隔离额外创建Shell、drawer或第二个全局收拢owner。

实例跟随真实范围生命周期：普通render、数据刷新和Tab隐藏不重建/销毁；真实卸载或范围替换时由宿主退订并销毁所属注入实例，NavigationMenu只释放自己的View连接。React StrictMode检查性effect重放不能永久销毁仍被复用的注入实例；实际键盘与焦点由View执行，active route、数据和业务缓存不迁入Controller。

### 共享数据与内容扩展

`NavigationItem` 是可序列化树，含稳定 id、label、图标标识、href、children、group、disabled 与 HTML 链接属性。`indexNavigation` 建立索引并验证唯一 id；`getNavigationActiveId` 匹配显式 activeId 或 location。图标由 React `resolveIcon` 或公开默认映射解析。一个菜单树由宿主提供，状态、权限与导航 adapter 不由文案或 CSS 推导。

`NavigationMenu` 可使用 children、`resolveIcon`、`renderLabel`、`renderLink`、`renderButton` 与 `renderAction`。renderer 只通过公开 props/ref 扩展；`renderLabel` 提供非交互描述内容，主项仍为 link/button，独立行尾 action 是自己的 button，不触发主项导航。

当前项使用主题强调色：主名称、富标签说明及公共 Typography/Icon 文字槽共同继承 selected 前景，选中时 muted 说明也随当前项着色。hover/按下/键盘焦点保留选中色，竖线与浅底仅辅助识别；禁用时仍使用公共禁用前景。消费者不添加文字颜色覆盖。

### 数据菜单与 Controller 所有权

React `/menu` 的 `Menu.View` 把可序列化 `MenuConfig` 渲染为公开 Menu 部件。config 是顶层条目/组的数据树；组内可含条目、heading和separator，不再嵌套group；子菜单仍使用公开JSX组合。数据不含 React 节点、DOM、回调或业务权限；全树 node id 必须唯一，item 的 `actionId` 指向宿主动作，`icon` 是由公开 resolver 解释的标识。Heading 是非交互标题，group 的 label 属于该组，separator 仅分隔内容。隐藏状态由宿主配置，不从权限、路由或当前文案推导。

View 有互斥的两种模式：

- 使用 `config`、可选 `onAction` / `defaultOpen` 时，View 按需创建一个内部 Controller，订阅并连接同一个 Base UI Menu。View 负责该默认实例的生命周期；StrictMode 检查性重挂不会产生第二个有效 owner。
- 传入 `controller` 时，它完整替换默认 Controller；`config`、`onAction` 与 `defaultOpen` 不可同时传入，首次渲染不会先创建或订阅另一个默认实例。该 Controller 的销毁由注入者负责；View 只订阅、桥接状态并退订。自定义实现的 getState 须在状态未变时返回同一快照，变更后发布新只读快照并通知 subscribe；不得每次读取都创建对象。

Controller 管理 config/open/activeId 与 focus request 等模型事实，并按 `actionId` 发出一次动作事件。同步调用 `event.preventDefault()` 只阻止本次 activation 的默认关闭；异步导航、权限、确认、请求、忙状态与成功/失败仍由宿主完成。Base UI 继续执行实际方向键、roving focus、触发器与关闭焦点行为；View 把 peer 观察到的焦点记入 Controller，并执行它公开发出的 focus request，不新增第二套键盘算法。Menu 不代替 NavigationMenu、业务授权或通用命令路由。 `activeId` 记录 peer 实际聚焦的可见项，包括按 peer 合同可取焦但不可执行的 disabled 项；`focusItem` 的显式命令只接受可见可用动作。隐藏/移除活动项时才回退可用项，全局 disabled 则关闭菜单。

### 当前项与一次导航适配

`activeId` 显式给出时优先；未给时可以传 location/baseURL 与可选 matchLocation。null、无匹配、禁用或非链接项都不强制选择首项。宿主更新同一位置的受控状态，不逐项重复维护 selected。非受控展开会按需要打开当前项祖先。

navigation 是 opt-in。只接管未取消、无修改键的普通主键、同源 HTTP(S) 链接，保留 HTML `href` 的中键、修改键、target 和 download 行为。`canNavigate(request)` 返回 false 或未配置 adapter 时保留浏览器导航。request 提供 id/href/解析后的 url/sameLocation/原始事件；库不订阅 history、不猜测产品路由。

### 状态、键盘与布局

collapsed/defaultCollapsed/onCollapsedChange 与 expandedIds/defaultExpandedIds/onExpandedChange 支持受控与非受控。受控操作只发请求，React 更新 props 后才改变事实；default 值仅初始化。MenuLayout 在断点切换后保留展开/紧凑状态。桌面 compact 保留可访问名称与图标，窄屏 drawer 显示完整标签，长中文可读。

键盘采用普通 nav/link/button 语义与单一菜单项 tab stop。方向键/Home/End 遍历可见可用项；左右展开/收起并回父节点，RTL 反转。展开按钮 Enter/Space、链接 Enter 沿 HTML 语义。焦点独立可见；移除/隐藏焦点项时回退公开可用目标，空菜单回到布局菜单开关或抽屉关闭按钮。

`MenuLayout` 支持 title/header、children、sidebarOpen/defaultSidebarOpen/onSidebarOpenChange、label/emptyLabel/compactLabel/expandLabel/skipLabel/closeLabel，以及侧栏、页面和顶栏公开 slots。窄屏使用同一个模态 drawer；成功导航请求关闭并回到可见入口。切换 route 不应给整个 shell 加 key，不应重挂业务正文。

### React 正式消费者

[React 示例](../examples/menu-react/app.tsx) 与[富导航示例](../examples/rich-navigation-react/app.tsx)使用独立 tarball 与公开 React API；共享 JSON 和 TypeScript 模型不包含 DOM 节点或业务服务。它们用合成数据演示受控选择、键盘/焦点、路由 adapter 和独立动作，不代表产品迁移验收。

### 冷启动与路由ready边界

navigation adapter必须在第一个可操作菜单呈现时已连接，并保持同一个宿主router owner。canNavigate=false的正式含义是保留document navigation，不能把它当“router/鉴权/动态路由尚未ready，暂不执行”的阻止开关；缺少adapter也有相同HTML link behavior。必要的未就绪状态由宿主提供真实disabled/状态，或在已经接管preventDefault的navigate内部明确处理，不以几分钟定时等待掩盖初始化问题。真实权限仍由服务端校验。

冷启动取证区分主frame的Document请求/新document identity、history同文档路由，以及旧shell DOM是否重新挂载；单看“页面重新显示”不能确认reload。菜单更新保留同一shell/main/主题owner，不能因route key重挂整个外壳；非SPA链接、修改键、target/download的HTML link behavior保留。初始化、主题订阅与watch构建本身不自动发reload；参考页的界面重载按钮是明确用户动作，登录默认location.assign也是确认登录/继续的宿主导航边界，不与菜单routing混用。

回归应覆盖冷/暖缓存、受控资源延迟、前进/后退、菜单点击与移除 adapter/canNavigate=false 的对照；记录 Document 请求、document/timeOrigin/shell/theme identity、草稿和 pageerror。实际执行范围见 [VALIDATION.md](VALIDATION.md)。合成消费者未复现不能排除产品开发模式的问题，真实 dev 命令、optimizer/HMR 日志、路由状态与资源代际须在宿主取证；不收集凭据、响应 body 或 Cookie。

### 外壳的document、viewport与workspace滚动模式

React AppShell/MenuLayout 支持 scrollMode=document|viewport|workspace（`ShellScrollMode` 类型），默认document，保留原有文档滚动。React 根公开 `data-scroll-mode`。viewport根为100dvh有界grid，正文行minmax(0,1fr)，sidebar/main均min-height:0且独立overflow:auto；窄屏复用既有drawer的有界Body，不加第二drawer。宿主嵌入非全窗口时给公开Root style的blockSize，不穿透私有子元素调整默认皮肤。

viewport/workspace更新选中项以nearest进入所属侧栏可视区域；焦点依靠浏览器所属滚动区滚入可视区，菜单键盘规则不另建owner。同一main与内容节点更新保持滚动/输入；产品导航历史如何按route保存和恢复各容器scroll位置由宿主决定，不按route key重挂整个shell。官方两[控件消费者](COMPONENTS.md#选择与复合控件)演示24项长菜单、长正文、横/纵滚动表格与反向导航；实际窄屏/文字放大和焦点验收见最终记录。

workspace额外让content获得扣除真实顶栏和pageHeader/pageToolbar/pageFooter后的剩余高度，适合历史+发送区/编辑器+检查器等业务内部滚动。普通viewport不承诺content剩余高度。React公开合同、leading平台前置槽、例子和边界见[布局插槽](COMPONENTS.md#有界工作区与滚动所有权)。

固定高度宿主可使用 React `MenuLayout` 的公开 `style={{blockSize:'var(--layout-embedded-shell-height)'}}`（或 AppShell 的同一 Root style），并显式选 `scrollMode='viewport'`。这时侧栏和正文分别滚动，选中菜单滚动到可见范围；不靠子元素私有选择器修补，也不把滚动恢复策略移入库。


### 应用头部角色与紧凑侧栏迁移

`AppShell`、`MenuLayout` 的 `headerSlots: AppHeaderSlots` 接收 `brand`、`breadcrumb`、`status`、`actions` 四个 React 内容角色；`AppHeader` / `AppHeaderProps` 从 `@coffeehc/xui-react/layout`（及根入口）导出，可独立组合，直接接收这四个 props，另有 `navigation` 和兼容内容 `children`。`AppShell` 持有抽屉触发器，宿主不要再添加一套菜单开关。

`AppShell` 未传 `headerSlots` 时保留旧header直接排列，显式传角色对象才启用新组合。`MenuLayout` 的 `title` 仍可用：未提供 `headerSlots.brand` 时作为品牌回退；显式 `null` 隐藏回退。旧 `header` 仍渲染在兼容区域，可和新角色并存。品牌/面包屑组成左侧主组，状态/动作在右侧；窄屏先保留导航/品牌，breadcrumb在主组内独占下一行，再将状态和动作换行，避免200%文字把路径挤成单个字。长中文品牌和 breadcrumb 在自己的空间省略，不挤散另一组；完整文本不从 DOM/可访问名称删除。动作只换行，不自动隐藏。必要业务反馈仍由宿主决定放置，库没有授权、版本、返回等业务规则。


公开 CSS 结构为 `xui-app-header`、`xui-app-header-primary/secondary` 和 `xui-app-header-navigation/brand/breadcrumb/status/actions/legacy`。React 使用正式 `theme/layout.css`；普通采用应使用 props/Node，不穿透结构改排列。`AppHeader` 是 div 组合，独立使用时由宿主提供所属语义 header。breadcrumb 内容可以使用公开 `Breadcrumbs` / `.xui-breadcrumbs` 的 nav/ol/li/a 结构；链接保留键盘焦点语义，不新增外框。

展开侧栏按视口16%响应，在公开 `--nav-sidebar-min-width` / `--nav-sidebar-max-width`（默认192/224px）之间夹取，再以视口50%封顶；普通1280px桌面为204.8px，1600px及1920px桌面为224px。收起仍为60px；这些默认数值是根16px下的 CSS 像素，非设备像素。产品若确需统一调整上下限，只在product-overrides的根Token层声明，不能穿透侧栏DOM；视口上限优先，200%界面缩放时不挤掉正文。公开token `--nav-sidebar-width`、`--nav-sidebar-padding`、`--nav-collapsed-width` 与 `--nav-collapsed-item-size` 在 DESIGN 中定义，默认36px项+左右各12px；图标仍16px，选中短竖线/hover/独立focus不改变宽度。独立支路开关收起时移到所属链接下一行，窄屏抽屉恢复完整标签与既有键盘/路由合同。独立使用 NavigationMenu 的外层宽度由宿主布局决定，MenuLayout 才拥有完整侧栏宽度。

迁移顺序：先固定新SHA并重新构建正式包；把原 header 中品牌/路径/状态/动作内容分别送入公开角色；删除消费方仅用于通用 header flex/grid/gap、长中文截断、紧凑栏宽度和图标对齐的 CSS。保留领域内容布局、授权判断、事件、路由和有明确理由的产品token覆盖。不要删除业务规则来套入公共布局，不再叠加第二条rail。实际执行范围与限制见 [VALIDATION.md](VALIDATION.md)。

### 侧栏底部接入与迁移



```tsx
<MenuLayout items={items} sidebarTogglePlacement="bottom" sidebarFooter={
  <SidebarFooterRow>
    <Button onClick={onOpenSessions}><SidebarFooterContent icon={returnIcon}>返回会话</SidebarFooterContent></Button>
    <Toolbar>
      <SidebarFooterContent icon={editionIcon}>{edition} · {version}</SidebarFooterContent>
      <Button data-icon="true" aria-label="检查更新" disabled={busy} aria-busy={busy} onClick={checkUpdates}>{updateIcon}</Button>
    </Toolbar>
  </SidebarFooterRow>
}>{children}</MenuLayout>
```

上述内容、图标、回调与状态均由宿主提供。正式React示例增加 `?toggle=bottom&row`，可用 `composition=shell` 验证直接 AppShell、`longFooter` 验证长版本，未加参数使用默认top。React props更新复用按钮、侧栏、业务节点和焦点，不通过重挂布局改位置；runtime不再提供原生UI update入口。

图标/短表示为装饰，完整名称留在label。图标可为任意React内容；直接SVG采用公共control-icon-size。名称长时展开/窄屏换行；紧凑栏只对有icon的部件视觉隐藏label。没有icon时仍显示文字，不要求消费者自写隐藏CSS；需要更具体紧凑表示时提供icon。真实交互语义、tooltip/解释入口及权限由内容所属组件决定。


有footer时，短菜单通过flex可用空间将footer置底，长菜单只在公共menu区域滚动，不覆盖末项；footer自身超出侧栏一半时独立滚动保留全部内容。document模式正文仍文档滚动，侧栏由库测量实际头高后有界sticky；viewport模式包括公开Root blockSize固定窗口。无footer时保留已有侧栏滚动区域。紧凑默认宽度不变，窄屏复用原抽屉；React portal 保持同一侧栏树，开关抽屉不重复挂载footer业务状态。此布局不新增 SSR/hydration 支持承诺。

迁移：固定包含本节的已验证提交并重新构建正式包（具体SHA见对应提交/交付记录）；将原本位于侧栏尾部的内容送入sidebarFooter，顶栏内容继续headerSlots；删除消费方底部absolute/fixed/margin-top、侧栏height/overflow与compact宽度补丁，保留业务回调/权限/状态。不要以route key重挂MenuLayout或添加第二个drawer。完整无私有CSS例子见[React](../examples/sidebar-footer-react/app.tsx)，正式构建、watch和独立tarball类型检查都包含它们；真实产品迁移另按产品授权实施。

### 公共侧栏与正文边界

1.3.1的桌面侧栏在inline-end使用既有separator-line与line-width-surface提供低对比分隔；AppShell/MenuLayout共用，展开/紧凑外宽与内容净宽不变，RTL使用逻辑方向。窄屏抽屉仅保留自己的外框，没有重复内侧边线或resize handle。无需宿主覆盖私有CSS或增加分隔节点。

### 导航内部唯一收起/展开控件



采用 AppShell/MenuLayout 时由公共组件拥有唯一侧栏开关。宿主传入 collapsed/onCollapsedChange、sidebarOpen/onSidebarOpenChange 与标签配置；不得在同一 shell 再实现按钮、媒体监听或抽屉。`sidebarTogglePlacement="top"`（默认）时桌面控件位于全局 Header 品牌单元行尾，与品牌同一行；显式 `bottom` 时留在侧栏菜单/页尾之后。窄屏两种设置都复用同一按钮作为现有导航抽屉入口，不复制 DOM。已选择bottom的宿主需要改这个公开prop才能回到顶部，单独升级包不会覆盖宿主选择。

默认图标由库维护：桌面以大圆角侧栏面板和清晰箭头表达收起/展开动作，箭头沿既有180度状态变化；窄屏改用菜单图标打开已有导航抽屉。复用control-icon-size、通用icon-stroke-width和Button命中区/焦点，不缩小按钮或另加字号。图标装饰性隐藏，完整可访问名称与title来自当前动作标签。`?brand=long&row`展示长中文品牌，顶部/底部切换、窄屏和紧凑仍复用同一个控件。本段图标视觉更新不改变top/bottom API或状态owner。


### 富条目、独立行尾动作与上下文菜单

React `NavigationMenu` 支持 `children`、`resolveIcon`、`renderLabel`、`renderLink`、`renderButton` 和 `renderAction`。`renderLabel` 只能提供非交互描述内容；主项保持真实 link/button 语义。`renderAction` 为主项旁的独立 button，提供配置、收藏等辅助动作，不触发导航；无需 stopPropagation 或访问私有 DOM。权限、请求、busy 与动作执行仍归宿主。

从1.2.0起，公共名称槽伸展到主项扣除图标及内边距后的剩余宽度；独立分支与配置按钮继续在主项外留宽。富标签可在自己的非交互 flex/grid 中将名称设为可收缩轨道、状态设为不收缩的行尾轨道。仅把真实名称放入 `NavigationMenu.Label`，让名称独立滚动；Spinner、状态文字与独立动作都不进入滚动轨道。状态位于主项内容的逻辑末端，名称变长时不能挤掉它；多行名称的状态与首行对齐。触控和 reduced-motion 仍显示可换行的完整名称。被动状态不要送入只接受 button 的 `renderAction`，也不要为了对齐修改库内部包装。

完整接线见 [rich-navigation-react](../examples/rich-navigation-react/app.tsx) 的 `?status`：使用公开 renderLabel/Label/Spinner、宿主自有内容布局和真实状态回调，不添加私有选择器或字号覆盖。忙状态有文字解释，图标本身装饰性隐藏；状态变更保留原名称、主链接、分支、配置按钮和草稿节点。紧凑rail继续视觉隐藏整个名称槽，不在60px栏里额外塞入隐藏名称中的状态。

`expandBranchLabel(item)` 与 `collapseBranchLabel(item)` 可本地化带 href 分支的独立展开按钮名称，默认文案包含真实条目名；语言或条目更新不会替换当前焦点按钮。`labelOverflow` 默认 wrap，可按合同选择 marquee；`actionAlignment` 默认 center，可选择 start 对齐名称首行。两个配置只影响名称和同行控件排版，不改变动作或路由。

桌面侧栏默认宽度在公开 min/max token 范围内响应视口，compact rail 由公共组件统一管理；使用 MenuLayout 时收起开关位于侧栏内部，紧凑宽度与开关位置不由消费方 CSS 模拟。键盘采用 nav/link/button 与单一 roving 停靠；方向键遍历可见主项和独立动作，Enter 激活链接/按钮，Space 激活按钮。左右键在主项与分支按钮上控制树，RTL 反转；独立动作不触发树展开。禁用项不执行，焦点项移除/隐藏时回到公开可用目标。

```tsx
<NavigationMenu label="会话导航" items={items} defaultExpandedIds={['team']}
  expandBranchLabel={item=>`展开 ${item.label}`}
  collapseBranchLabel={item=>`收起 ${item.label}`}
  renderAction={item=><button aria-label={`配置 ${item.label}`} onClick={()=>configure(item.id)}>⚙</button>} />
```

富导航完整合成消费者见 [React 示例](../examples/rich-navigation-react/app.tsx)，它使用公开 React API、正式 CSS/types 与共享纯 JSON 数据，不连接产品服务。

### 富业务分组导航与简单选择的边界

GroupedCombobox 继续服务简单 `{id,label,disabled?}` 选择，分页只有已知 page/pageCount；不扩成带按钮、链接、子树和上下文菜单的 option。未知 total/cursor 不能虚构 pageCount。

需要子层级、自定义图标、富标签、配置按钮或 ContextMenu 的业务条目，使用公开 Input + Section/Disclosure + 两个 NavigationMenu + 组外加载按钮。一个 query 驱动两个宿主读取状态，各自拥有 cursor/hasMore/busy/error，无需 total。关闭组取消所属读取，查询变化使旧 generation 失效，宿主必须丢弃取消后迟到结果；写动作不进入导航 adapter。导航仍是普通 nav 的单 roving 停靠，与输入/分组开关/加载按钮的正常 Tab 顺序相接，不是 listbox，也不需要 stopPropagation。

NavigationMenu 提供 children/resolveIcon/renderLabel/renderLink、单 button 的 renderButton、独立 sibling renderAction，以及React slots/decorator 生命周期。完整 API 与键盘规则见[导航富条目合同](COMPONENTS.md#富条目独立行尾动作与上下文菜单)。正式[React](../examples/rich-navigation-react/app.tsx)消费者包含项目/成员合成数据、独立 cursor、异步配置防重复、关闭取消及上下文菜单，未接真实产品服务。
开发环境懒加载与依赖预优化见 [开发联调与冷启动](ADOPTION.md#开发联调与冷启动)。

## 弹层与工具栏

完整规则只在[DESIGN](DESIGN.md)；正式exports与types见[PUBLIC_API](PUBLIC_API.md)。本节说明原子上的公开组合，不包含业务状态引擎或新默认品牌值。独立tarball消费者为[React](../examples/capabilities-react/app.tsx)，不需要私有页面 CSS。

| 能力 | React 公开 API | 公共职责 |
| --- | --- | --- |
| Sheet | `/sheet` 的 `Sheet.Root/Content/Title/Description/Body/Footer/Close`；`Content side=start/end/top/bottom` | 复用 Dialog 生命周期；标题/描述/关闭部件复用同一组件，正文滚动与 footer 动作保持可达 |
| AlertDialog | `/alert-dialog` 的 `AlertDialog` 和 peer parts | 使用 alertdialog 角色及明确的初始/最终焦点；确认与取消由宿主决定 |
| ContextMenu | `/context-menu` 的 Root/Trigger/Content/Item/CheckboxItem/RadioItem 等公开 peer parts | 键盘、右键、外点与回焦点由公开 React 组件管理 |
| Menu/ContextMenu Separator | 两者均提供 `Separator` 与 `MenuSeparatorProps` | 复用 peer separator 语义与公共行分隔线；无动作、无额外键盘停靠 |
| Table | `Table/TableRow/TableCell` 等原语 | 语义 table、sticky/selected/expanded 状态与列布局由公开 props 管理 |
| MetricCard | `/metric-card` 的 `MetricCard` | 复用 Surface；必填 label/value，可选 marker；不格式化值或创建数据 owner |

Sheet复用Dialog lifecycle，标题/描述/关闭部件复用同一组件；正文滚动、footer动作保持可见，逻辑side随RTL。AlertDialog复用peer确认角色和取消/焦点，不因关闭而执行业务。嵌套时只有最上层处理取消和Tab，确认逻辑由宿主显式执行；有草稿才打开确认，空草稿直接关闭。trigger若不存在或已移除须给可见finalFocus，不能把父关闭按钮同时作为无条件子确认trigger。

### 导航抽屉与未保存确认的最终焦点

`AppShell`（`/layout`）和 `MenuLayout`（`/menu-layout`）公开 `navigationTriggerRef?: React.Ref<HTMLButtonElement>`，引用库拥有的唯一导航开关。支持对象 ref、callback ref 及 React 19 cleanup；响应式移动保持同一按钮，卸载清空引用。它不替换按钮，也不新增路由或草稿 owner。

移动抽屉内链接触发宿主确认时，抽屉会关闭而原链接隐藏；抽屉不得抢走新 AlertDialog 的焦点。宿主给确认框 `finalFocus` 指向仍可见的开关；放弃并导航则可改为新页面的真实操作。不要返回隐藏链接、查询私有 DOM 或加 document 级焦点兜底。未传 ref 的已有默认行为保持，升级本身不会自动给宿主确认框接线。

```tsx
const navigationTrigger = React.useRef<HTMLButtonElement>(null);
<MenuLayout navigationTriggerRef={navigationTrigger} {...navigationProps} />;
// 保留草稿：回到当前页面的公共导航开关。
<AlertDialog.Content finalFocus={navigationTrigger}>…</AlertDialog.Content>;
// 多种结果使用已有 finalFocus={() => keepDraft ? navigationTrigger.current : destination.current}。
```

完整受控 guard、取消/放弃示例见 [continuity-react](../examples/continuity-react/app.tsx)。业务继续决定是否离开、何时导航及新页面焦点。默认抽屉 Escape/关闭回焦与显式 finalFocus 合同不变。

### 保留Dialog的阅读位置

在支持布局观察的浏览器中，标准`Dialog.Content keepMounted`与单个直属`Dialog.Body`保留同一个弹窗DOM；受控open临时为false再恢复时，只要内容与滚动容器模式未变，公共布局观察不清除隐藏期间的body/whole模式，不主动把当前阅读位置滚到已聚焦控件；对隐藏后丢失偏移的浏览器，仅还原同一已测DOM滚动容器的最后可见位置（位置因内容缩短可自然夹紧）。仍存在的原生非零偏移优先于旧快照。输入值、选择区和阅读位置仍分别归宿主/DOM，组件不新增读取、核验或草稿owner。真正因窗口、字体或固定区域改变而切换滚动容器时，仍将焦点控件滚入新的可见区域；不承诺内容缩短后保留超出有效范围的offset，也不把卸载视作keepMounted。无Body或无ResizeObserver的CSS降级仍保证内容与动作可滚动到达，不承诺本节的偏移恢复；原生动画中的亚像素取整限制见[验收记录](VALIDATION.md#保留dialog异步恢复的阅读连续性4252026-10-17)。

宿主若临时关闭私有弹窗等待自己的异步核验，可用已有initialFocus回调对仍有效目标执行`focus({preventScroll:true})`并return false；暂停期间的finalFocus由宿主选择，正常关闭仍回真实触发按钮。库不接管核验/权限、document visibility或重放请求。公开[示例](../examples/dialog-resume-react/app.tsx)以合成暂停替代核验，`?whole`展示极端长标题的整体滚动模式；只消费正式Dialog/Field/Textarea/Button/主题，不访问私有DOM或覆盖内部CSS。业务决定是否、何时恢复原详情及焦点。

### 嵌套弹层与 Tooltip 的 Escape 顺序

Escape只关闭当前最上层的可关闭浮层。受控Sheet内的Button打开条件挂载的Dialog，第一次Escape关闭Dialog并回文件按钮，第二次关闭Sheet并回原开关；无需document监听、私有store、延时focus或重复onKeyDown。

若按钮还组合了Tooltip.Trigger，Dialog回焦点可能以trigger-focus打开Tooltip。此时第二次Escape关闭可见Tooltip，第三次才关闭Sheet；ContextMenu打开时同样先关闭菜单。这不是父Sheet失去Escape能力，不得把“Sheet仍可见”单独当作关闭故障，也不能强制同一事件同时关闭两层。3.1.1与4.2.3的独立组合均复现这一顺序；没有一个声称修复旧两次Escape的提交。

名称已经完整可读且Tooltip仅重复名称时，按高信噪比规则省略该Tooltip（已有动态组合可用公开`Tooltip.Root disabled={!hasExtraInformation}`，保持同一Root/Trigger/Button节点），只保留必要Button/ContextMenu.Trigger；这条公开组合自然是Dialog→Sheet两次Escape。确有额外说明时保留Tooltip，并测试Dialog→Tooltip→Sheet的完整顺序。Tooltip是非交互说明，不承载必须操作；必要文件动作放在Button或ContextMenu。公开[示例](../examples/tabs-overlay-react/app.tsx)的`?overlay`、`?overlay&tooltip`与`?overlay&tooltip&sibling`分别展示禁用重复提示的两层、额外提示和并列React树位置组合，宿主选择真实所需的信息层级。

ContextMenu支持鼠标右键、Shift+F10/ContextMenu键、方向键、disabled、检查项保留、外部关闭和Esc回焦点。普通点击Trigger不执行业务。没有声明跨移动OS长按一致；必要操作还须由可点击按钮/菜单访问。React 键盘与 popup 定位由已安装 Base UI peer 提供。

Table与DataTable全表默认仅行分割线，所有普通/左固定/右固定/双侧固定的th/td都不画列线；sticky不附带边框、阴影或伪元素分隔。沿用现有sticky/stickyOffset/stickyHeader接口，无需新prop或消费方CSS；当前没有行列网格模式。整体frame、表头/行底线与footer分隔保持各自唯一归属，最后数据行不与footer叠边。

TableContainer在子控件获焦且超出自身可视边界时以nearest滚动揭示，保留公共focus Token空间；宿主onFocus仍先执行，preventDefault可阻止该补充行为。它不更换焦点、不新增行交互或滚动owner。真实浏览器缩放下检查完整按钮边界，部分进入视口不足以验收。

表格为语义table，条纹排除expanded内容行，hover/selected优先级明确；sticky cell继承所属行的非透明背景，避免滚动穿透。多个同侧sticky列的offset由宿主显式给出，不测量/推断列宽；仅所属TableContainer横向滚动。展开按钮是正常button，不截获行所有点击，也不实现查询、虚拟化、权限、排序或选择引擎。

全部组合使用已有 motion token/reduced-motion，动画不延后操作；受控变化、可取消意图与 React 生命周期沿用[接入与组件分层](ADOPTION.md#组件层次与扩展原则)。键盘/焦点/长中文/窄屏/200%根字体的实际检查见[验证记录](VALIDATION.md#chromium-浏览器结果)，真实移动OS、读屏器和其他浏览器未验。

Table 支持 stickyHeader 布尔 prop；表头在所属TableContainer顶端sticky，与列sticky交点提高一层，表头/行底线使用separator-line，整体外框使用surface-line，不为固定列单独添加竖线。多个表头行/额外上方控件的offset由宿主明确style，不猜高度。行的raised/support底色保持不透明，hover/selected语义色以同色gradient叠在底色上，sticky单元格继承完整底色/图层；允许产品交互色有alpha而不穿透。产品基础layer仍须是可读不透明背景。selected优先hover，条纹/expanded基础层仍保留，无新增默认品牌值或产品color-mix配方。


其它组合与 HTML 合同见[选择与复合控件](COMPONENTS.md#选择与复合控件)，它们复用既有token、motion、Field/Combobox/按钮，不增加界面密度或业务引擎。

React Menu 沿用 peer 对 disabled 项的焦点合同：禁用项可被读取但不能执行；实际焦点与回焦点按公开 peer 行为验收。

### 菜单文字、图标与字段标签

React Menu.LinkItem透传固定peer的closeOnClick合同，默认false；需要点击后关闭时明确传true。

Menu / ContextMenu 的 Item、LinkItem、CheckboxItem、RadioItem、SubmenuTrigger 统一使用显式菜单角色 body-xs/line-height-body-xs/font-weight-control（默认13px/20px/500）。该规则位于 `.xui-menu-item`，不改变 Portal 的 `.xui-layer` body-sm正文；Select/Combobox/Command 中共用该菜单项角色的选项同时得到相同文字合同。

`Menu.Icon` 与 `ContextMenu.Icon` 是同一公开装饰性 span slot，透传 span props/ref，默认 `aria-hidden=true`。示例 `<Menu.Item><Menu.Icon><Settings /></Menu.Icon>设置</Menu.Item>`。slot 与它的直接 SVG 子元素由库绑定 control-icon-size（默认16px）、不收缩；图文间距继续采用 menu-item-gap（默认8px）。SVG 自身24px属性不再改变菜单图标布局；未声明slot的普通嵌套插图不受此规则强制缩放。不要再全局覆写菜单中所有svg。

菜单分组间的语义分隔使用 `<Menu.Separator />` 或 `<ContextMenu.Separator />`，两者共用 `MenuSeparatorProps`、separator-line 与统一行间距；不使用带交互的 Item 假装分隔线，也无需宿主添加私有 CSS。

`.xui-label` 与 `.xui-choice-label` 显式绑定标签字号、行高与字重；Field 仍是 label→control→help→error 的8/4/4px间距，控件 id/htmlFor/aria-describedby/aria-invalid 规则不变。choice-label 的默认36px点击区保留，不因13px文字机械缩为20px。React 组件使用显式 label/error 关联；没有为这次修复新增密度或small/large开关。

### 表单焦点绘制与关闭入口

Dialog.Body 与 ScrollArea.Viewport 是滚动边界：继续保留 `focus-width + focus-offset` 的四边滚动清距，焦点不新增外框。公共 base.css 统一拥有 padding / scroll-padding 与子控件 scroll-margin；Dialog.Body 用等值负 margin 消耗 Content 已有内距，因此字段仍与标题和 footer 对齐，长正文保持有界滚动，Content 的圆角裁切不变。ScrollArea.Viewport 默认 focusMode=gutter，在自己的内容盒中留空间，不扩宽 Root；其自身键盘焦点不新增边界。显式 focusMode=inset通过 CSS @scope 移除几何余量，旧引擎保留 gutter；最近公共滚动边界拥有策略，嵌套默认 gutter 不被外层 edge/inset 覆盖。可聚焦的 ScrollArea.Viewport 不新增边界，TableContainer 仅改变已有边线颜色，贴在外层零 gutter 滚动口边缘仍保持完整；其内部控制项继续采用各自边界策略。InputGroup 仍只有外层一套边框和焦点，invalid 边框不被 focus 覆盖。

Surface（无预设内容槽的表面）、Field、Grid 本身并不裁切：Surface 默认已有 card-padding，显式 padding=none只去除此表面的内距，背景/边线/圆角保留且不增加裁切，内部卡片与控件仍保留自己的默认 padding。Card 内套 ScrollArea、Dialog/Sheet 内套 Card 与滚动表单则由对应滚动边界承担绘制空间。宿主自行增加 overflow:hidden/auto、零内距或固定窄宽度，会建立新的裁切边界；应使用正式 ScrollArea，不通过输入框逐个补丁、全局 overflow:visible、缩小 focus token 处理。

工作区主内容贴边使用公开 [contentInset=edge](COMPONENTS.md#工作区正文贴边)，只在 workspace 生效。多行草稿与上下工具区域使用 [InputGroup stacked/Textarea](COMPONENTS.md#多行输入与上下工具区域)，唯一组表面/焦点仍由 InputGroup 拥有，不用 Surface 再套一层输入框皮肤。

React 推荐组合：`<Dialog.Header closeButtonProps={{'aria-label':'关闭设置'}}><Dialog.Title>设置</Dialog.Title><Dialog.Description>说明</Dialog.Description></Dialog.Header>`。Header 默认只生成一个 CloseButton，标题轨道可收缩/换行，关闭入口位于右上（RTL 为逻辑末端），不与文字重叠。`showClose={false}` 明确隐藏入口；`closeButtonProps` 透传 Base UI Close 的 disabled、回调、render/ref 等合同。Sheet.Header / Sheet.CloseButton 复用同一实现。需要手工标题组合时，可把一个 Dialog.CloseButton 直接放在 Content 内；它采用右上绝对定位，并为直接 Title/Description 留出位置。

`Dialog.Close` / `Sheet.Close` 继续是无位置假设的关闭动作，可用在 Footer 的“取消”按钮。Content 不盲目注入第二个关闭按钮；AlertDialog 继续通过明确的确认/取消动作作决定，不增加默认 X。


旧消费者迁移：删除尾部游离 X，改用 Header 的默认 CloseButton；或把原 X 的 Dialog.Close 改为 Dialog.CloseButton（二选一），不能两个一起保留。库不能从普通 Close 推断它是图标还是合法 footer Cancel，因此升级版本本身不会自动重新定位旧的游离 X。删除消费方通用定位/裁切补丁，业务草稿、onOpenChange/details.cancel、提交和权限继续归宿主；产品接入需核对真实消费版本与页面。

受控 Dialog props 同步宿主已确认的状态，不受某一个 Trigger 的 disabled 状态限制；同一个弹窗可能由另一项已授权动作打开。Trigger 点击仍遵守 disabled，不能把受控 props 当未授权的用户请求入口。

长风险说明放在 `Dialog.Body` 内的 `Dialog.Description`，使说明与表单共用一个滚动owner；Dialog 的 aria-describedby 仍指向该完整原文。短介绍可继续位于Header。不能让长说明作为独立固定轨挤掉表单，亦不能只用固定高度裁切正文。正常窗口由 Body 内滚且 Footer 可见；长 Header 或极端短窗口改为整体弹层滚动，Body 恢复自然高，关闭、标题、说明、表单和 Footer 均须可滚动到达。同一时刻只有一个活动滚动 owner，不承诺所有内容同时同屏。无 ResizeObserver 或 SSR 初始状态保留整体滚动；内部测量只切换布局属性，保留 DOM、值和焦点，销毁释放观察器/帧/事件。内部 dialog-layout 不是公开宿主 API；实际验证范围见 [VALIDATION.md](VALIDATION.md)。

### SearchToolbar

公开的「搜索 + 主操作 + 可选高级操作」组合，适用于列表、卡片集合、DataTable.toolbar 或 MenuLayout.pageToolbar。查询、值、筛选、分页、业务动作与 API 请求始终归宿主。

搜索框不需要重复的“搜索”视觉标题时，将带 `aria-label` 和 placeholder 的公开 `Input` 直接放入 `SearchToolbar.search`；不要传空 label 给 `Field` 或 `DataTableFilter` 来保留空标签轨道。`MenuLayout scrollMode="workspace"` 的 `pageToolbar` 位于独立正文滚动区外，`DataTable.toolbar` 也由表格负责保留可达；选择其中一处放同一个工具栏。工具条与正文的间距使用公共布局，不再由宿主增加 sticky/定位或分隔补丁。它不创建 form、search landmark 或 ARIA toolbar 的方向键模型；内部是普通 group，控件保留正常 Tab 顺序。

#### React

从 `@coffeehc/xui-react/search-toolbar` 或根入口导入 `SearchToolbar`、`SearchToolbarProps`。加载正式 `@coffeehc/xui-theme/style.css`；按需样式须同时具备 tokens/base/button/navigation/layout/search-toolbar 及所用控件 CSS。

完整接线见 [React SearchToolbar](../examples/search-toolbar-react/app.tsx)。

`actions` 可直接填公开控件，也可填嵌套 Toolbar。控制区域按底边对齐，Field 标签可自然换行；带帮助/错误的复杂字段放 advanced。操作组内部换行不会拉高独立高级筛选按钮，按钮按公共最小高度与自身文案自然增高。示例见 [多行工具与导航](../examples/public-layout-react/app.tsx)。

- search/actions/advanced：ReactNode，可分别省略；null/undefined/布尔/空字符串/空 Fragment/空数组不占对应槽。0 是内容。返回 null 的自定义组件仍是已提供的内容，不对它做 DOM 探测。
- defaultExpanded：仅初始值，默认 false；true 初始展开。后续改变此字段不会重置用户选择。
- expanded/onExpandedChange(next)：受控事实与请求；拒绝/暂不回传时界面不擅自改变。程序更新 expanded 不触发 onExpandedChange。受控与非受控模式应保持稳定。
- advancedLabel：触发按钮文本及可访问名称，默认 `Advanced options`，空白文本回退默认名，本地化由宿主提供。
- 其余 div props/ref 透传到外层；children 不支持，使用命名槽。

#### 尺寸、焦点与组合边界

宽屏搜索占剩余宽度，actions 靠右同一行，搜索默认宽度不参与操作组换行判断。工具栏自身窄于 40rem 时搜索单独一行，actions 内可换行。根、槽和控件均可收缩，无横向裁切；统一普通按钮尺寸采用公开 control-height 等 token，传入不同 Button.size 仍在工具栏动作区归一，图标按钮同步。极长标签允许自然增高；同一行按钮 stretch，不承诺所有跨行按钮固定像素高。高级区任意复杂布局继续组合 Grid/Field/Stack，禁止宿主给控件固定超宽尺寸或添加私有 CSS 补丁。

高级内容折叠时保持挂载和值，以 hidden/inert 移出可访问和焦点树；不禁用字段、不清值、不代表退出 form 提交。若业务希望折叠字段不提交，须由领域状态决定。触发器不是 submit，不执行搜索；程序收起焦点仍在高级内容时回触发器，外部焦点不被抢走。

`Dialog.Content.keepMounted` 默认 false。AppShell 为复用同一侧栏会显式启用它；关闭时仍隐藏并保持模态隔离，普通 Dialog 默认不变。

## 数据表格

通用记录页复用 DataTable 与公共 `xui-record-table` 排版：`xui-table-primary` 显式标识任务主列，使用 `--table-primary-min-inline-size`；`xui-table-label` 保留完整元数据词组，`xui-code xui-table-value` 组合采用 mono/tabular 与单行时间/计数。次要列在表内横滚，不压成逐字竖排。StructuredLogExplorer所有表头及records的三态标签复用完整词组角色，计数/时间采用数值角色；启用列宽调整时内容可在所属单元内换行。行操作复用 text/xs Button，真正危险确认仍在 Dialog 中；不新增请求、排序或权限 owner。表格通过准确的可访问名称识别，不重复可见页标题。这些角色只在有阅读需要的列显式采用，不为普通 Table 强制列宽。一次性 Key 的读取区域消费既有 mono/tabular 文字角色，保留 Textarea 的尺寸、焦点与选择复制语义。

正式 UI 入口为 React `@coffeehc/xui-react/data-table`；纯分页事实与类型由 `@coffeehc/xui-runtime/data-table` 共享。默认皮肤属于公共 `@coffeehc/xui-theme/table.css`，完整 `style.css` 已包含它。原有 Table/TableContainer、Toolbar/Field、Pagination、DataRegion/反馈原语保持原语合同，不会自动升级所有旧表格。

完整消费者：[React](../examples/data-table-react/app.tsx)，共用[合成只读模型](../examples/shared/data-table-model.ts)。它们只安装正式 tarball，不依赖 `packages/src` alias、私有 CSS、产品 DOM 或真实业务服务。默认示例使用自然高度；`?layout=workspace` / `?layout=document` 对比显式布局，`?unbounded` 检查无高度边界，`?local` 演示宿主本地分页，`?cursor` 演示不请求总数的服务端游标（`?cursor-total` 可同时带真实总数），`?no-search`、`?no-actions`、`?no-pagination`、`?fixed-page-size` 检查可选能力。本节不代表任何产品完成迁移。

### 责任与最小接口

- 库提供表格整体、表体滚动、自然流底栏、列头/单元结构、筛选排列、状态反馈、键盘与默认视觉。宿主提供数据、列/行键、业务筛选、权限、排序/选择事实与业务动作。
- `rowState(row)` 可提供 `selected/expanded` 事实。这里没有选择、排序、虚拟化或编辑状态引擎；展开明细、复杂合并单元格继续按已有 Table 原语组合，不伪装成已支持的 DataTable 特性。
- 可选 rowEvents 提供 onClick/onDoubleClick/onContextMenu/onKeyDown，每个回调接收 `(row:T, context:DataTableRowContext, event)`。context 的 rowIndex 是当前可见页零基索引，rowKey 是稳定宿主键；数据更新/排序/分页后按当前记录发布。React 回调接收对应行的 synthetic event。
- 行事件默认抑制 loading/refreshing/disabled、defaultPrevented、嵌套表格和 cell 内独立 button/link/input/label/select/textarea/summary、编辑区、对应交互 role。自定义动作容器可在宿主自身Node上声明公开 data-xui-row-action；open-shadow控件也过滤。不需要消费者 stopPropagation，也不修改原动作传播/浏览器默认行为。
- 双击保留真实 DOM 顺序（两次 click、一回 dblclick）；不要同时绑定 click/dblclick 执行同一业务而要求库猜测去重。没有新查询/选择/提交 owner，不给 tr 自动 role=button/tabIndex 或自动 Enter 激活。键盘等价主动作放正常 cell Button/link；被动可聚焦 cell 的 onKeyDown 可显式处理并自行 preventDefault。刷新时独立只读 cell 仍可由宿主决定是否可用；新增行快捷动作在busy时不执行。

- `status` 明确为 `idle/loading/ready/refreshing/error`，默认为 ready。`disabled` 阻止组件自有分页/条数/重试动作；单元业务动作由宿主按真实权限决定，context 提供 busy/disabled 事实。只读查看可在刷新时继续可用，不把整个表体设为 inert。
- `toolbar`、`emptyState`、`errorState`、`feedback`、`footer` 是公开插槽；内部 toolbar、反馈、表体与 footer 位于同一个 frame，没有默认业务动作或自动写入。`labels` 覆盖加载、错误、空态、分页和 `count({rowCount,total})` 文案。
- 所有 rowKey 必须唯一、稳定，字符串/数字经文本化也不能重合；列 id 唯一非空。空列、不合法 page facts 在渲染之前拒绝。

### 交互列宽调整

4.2.10的`DataTable.columnSizing`为可选对象，省略时保留现有响应式初始列宽、默认铺满与无拖动按钮。`{}`启用默认Controller；`{widths,onWidthsChange}`受控；`{controller}`完整替换，不能同时传widths/defaultWidths/onWidthsChange。工厂从`@coffeehc/xui-runtime/data-table`导入`createDataTableColumnSizingController`，只拥有列宽确认值与拖动草稿，原rows/query/排序/分页/权限仍归宿主。列id必须稳定，列重排后宽度按id匹配；未显示的id可保留供重新显示，宿主决定是否丢弃/保存偏好，库不读写storage。

```tsx
import {DataTable} from '@coffeehc/xui-react/data-table';
import {createDataTableColumnSizingController} from '@coffeehc/xui-runtime/data-table';
// style.css已包含；若使用critical.css或独立table.css，还需此正式可选分片。
import '@coffeehc/xui-theme/table-resize.css';
const sizing=createDataTableColumnSizingController();
<DataTable label="触发器" rows={rows} rowKey={row=>row.id}
  columns={[
    {id:'name',header:'名称',width:'16rem',resize:{label:'调整名称列宽',minWidth:80,maxWidth:700},cell:row=>row.name},
    {id:'actions',header:'操作',width:120,resize:false,cell:renderActions},
  ]} columnSizing={{controller:sizing}} />;
```

创建者销毁注入实例；View只订阅并清理自己的指针操作，不销毁注入者。`getState/subscribe/destroy`同既有observable合同；`begin(id,liveWidths,{minWidth,maxWidth},reason?)`开始、`resizeTo(px)`预览、`commit()`确认、`cancel()`无通知取消、`reset()`请求空widths恢复原布局、`update({widths,onWidthsChange})`接收确认/配置。模型不持DOM，View传入当前实际像素轨道。widths是只读`Record<稳定列id,正有限CSS像素数>`，不接受CSS字符串；初始列width继续支持rem/百分比/CSS数学式。数字是CSS像素而非设备像素，不做时区、查询或业务转换。

指针开始时快照全部当前可见列的实际宽度；预览固定这些轨道，只改变目标列，避免浏览器将增量重新分摊。松开一次回调`onWidthsChange(widths,{columnId,reason:'pointer'|'keyboard'|'reset'})`，移动/受控update/零移动/取消不回调。确认后表格按精确总宽渲染，可大于或小于可视表体；其他列保持宽度、表体自身横滚，footer仍沿表体自然宽度。尚未确认的默认布局继续铺满。受控宿主若不确认则返回旧值；外部新确认值会取消旧草稿，同步回调确认优先。`reset()`不改变数据或页码。

每列默认出现一个独立的focusable separator；`resize:false`排除。`resize.label`可本地化；默认名称使用字符串header或稳定id，不假设ReactNode能转成文字。header内容/排序按钮与separator是兄弟，拖动不触发排序。role=separator、vertical、aria-valuenow/min/max由真实宽度与交互范围维护。左右键每次1 CSS px，Shift为10；RTL反向，Home/End到交互上下限。Escape只取消本次拖动并保留焦点，不顺带关闭外层弹层。

启用columnSizing后，初始轨道以已有width与resize.minWidth（缺省使用公共data-table-column-resize-min）中较大者为下限；没有width的列也获得此下限，避免窄屏弹性列被压到零宽。余宽仍由浏览器分配。maxWidth是调整上限，默认min/max为64/1920 CSS px并随文字尺度派生；初始弹性分配可能超过max，第一次有效调整会收敛。显式确认widths是正有限CSS像素快照；重置空记录恢复上述初始分配。未启用columnSizing的表格保持旧布局。指针拖动、键盘确认、独立配置、两种Controller遵守同一限制。触屏使用24px×表头高的独立拖动轨道和pointer capture；不将整个th或tr改成按钮。disabled/loading/refreshing时禁止列调整并取消在途草稿；保留已确认宽度、行与焦点。pointercancel、丢失capture、窗口失焦/resize、pagehide、bounds/列结构/Controller更换、卸载均取消并释放临时监听；字尺度导致默认上下限变化也取消。窄屏/缩放使用同一表体横滚，不刷新Document或重挂rows。

### 列宽与内容边界

`DataTableColumn<T>.width` 是可选 `DataTableColumnWidth`，表达列宽下限。通常省略，由表格自动分配；仅在标识、操作或用户配置等确有尺寸要求时设置。该类型从 `@coffeehc/xui-runtime/data-table`、`@coffeehc/xui-react/data-table` 以及两个包的根入口导出。列尺寸不重定义品牌 token，也不让库新增业务列、读取用户偏好或保存列配置。

受控接线见 [React DataTable](../examples/data-table-react/app.tsx)。

- number 是 CSS 像素，运行时必须有限且非负；`0` 合法，但不表示隐藏列。隐藏列应由宿主过滤 `columns`，不能依靠零宽隐藏仍存在的表头、数据或交互。
- 字符串支持有单位的 CSS length（如 `'12rem'`、`'160px'`）、百分比（如 `'25%'`）、`calc(...)`、`clamp(...)`、`min(...)`、`max(...)` 和 `var(--...)`。裸数字字符串（如 `'160'`）、`auto`、对象、数组和 boolean 不是本接口的宽度值；自动列省略 `width`。
- TypeScript 模板字符串限制值的形状，不是完整 CSS 或数学验证。number 类型也不能静态证明有限、非负。在正常浏览器中，运行时再用 `CSS.supports('width', value)` 拒绝无效 CSS；SSR/无 CSS parser 时仅检查结构，不模拟 CSS parser、不解析变量，也不据此声明 SSR hydration 已验证。宿主须提供能解析为宽度的自定义属性；`calc(...)` 的合法表达式若计算为负数，宽度由浏览器归零，不会在静态类型阶段被证明或拒绝。

表格默认铺满表体可用宽度。未声明任何 `width` 时，保留原有自动表格布局；部分列声明时，未声明列优先吸收剩余空间；全部声明时，浏览器在这些列之间分配余宽，实际宽度可以大于配置值。配置下限总和超过可用宽度时不压缩这些列，仍由表体区域横向滚动。表头和全部数据单元格使用同一张 table 的列轨道，不分别计算或复制表头宽度。

此前全部指定列宽时按总和收缩、允许右侧留白；现在这些值作为下限且整表默认铺满。依赖旧精确宽度的消费者须核对新的实际列宽，不能再把 `width` 当作最大值或承诺像素不变；无需增加占位列或产品私有 CSS。

百分比及混合表达式（如 `'calc(50% - 1rem)'`）统一以表体可用宽度为基准，不以自身表格已经扩出的总宽为基准。组件内部用非交互、`aria-hidden` 的零高测量块交给浏览器解析，并由单个 `ResizeObserver` 将结果同步为 `colgroup` 的像素宽度；宿主无需查询内部 DOM、计算百分比或维护自己的观察器。此内部结构不是公共定位或样式入口。

长中文、长英文及无空格文本沿用公共表格的 `overflow-wrap:anywhere` 换行，不默认截断或省略内容。宿主 slot 若强制 `nowrap`、放置不可收缩的大控件或更大的最小宽度，仍须按内容选择合适列宽或适配 slot；库不会为满足指定宽度默认裁切按钮、操作内容或控件边界。`sticky:'start'|'end'` 仍是既有单侧零 offset 合同，列宽配置不自动累加多个 sticky 列的偏移；需要多列冻结组合时使用已有 Table 原语的显式 `stickyOffset`。

全指定列与主要内容列省略 width 的正式消费者对比及实际矩形检查入口见 [浏览器列宽合同](../tests/browser/data-table-widths.spec.mjs)，实际执行范围见 [VALIDATION.md](VALIDATION.md)。

### 页面标题、筛选与滚动


- `natural`：零行、少量行时随内容自然收缩；有实际确定高度的父容器时，以 `max-block-size:100%` 为上限，多行才由表体独立滚动，内部 toolbar、反馈和 footer 保留在正常布局流。父容器高度为 auto 时，百分比上限不能创造可用视口，表格仍按文档流增长；要限制高度，先通过公开 shell 或宿主已知尺寸建立真实边界。
- `workspace`：显式保留旧有填满已分配正文高度和组件最小高度的行为，适合需要少量行也占满工作区的页面。
- `document`：始终按无约束文档流增长，即使父容器有确定高度也不采用 natural 的高度上限；外层页面负责滚动可达性。

4.2.26起，纵向滚动边界按表体实际`scrollHeight > clientHeight`建立，而非按layout/行数猜测。没有纵向溢出时，表格内的纵向滚轮自然传给既有祖先owner：`MenuLayout scrollMode="viewport"`由main滚动且header/侧栏保持，workspace由既有正文滚动区承担，document由文档承担。真正受限的表体仍内部纵滚，并在首末边界保持contain；横向contain、列宽、sticky、分页与焦点合同不变。现有同一布局观察器随内容/高度变化更新并在销毁时清理内部标记，不新增公开属性或wheel处理器；无布局测量时安全降级为纵向auto。此内部标记不是宿主配置接口。正式示例`/data-table-react/?viewport&size=50&no-search&no-actions`演示固定壳中的自然高度长表格；`?internal&size=50`演示有界表体。

采用已有 `AppShell/MenuLayout` 的 `scrollMode="workspace"`、`pageHeader` 与正文可提供真实高度边界，没有第二套 PageLayout。下面让自然高度表格在 workspace 正文内按内容收缩，并把筛选放在同一表格外框内：

组件内部的 toolbar、表体与 footer 共用一个 frame；已有行的状态反馈与自定义 feedback 放在 footer 的计数区域，未出现反馈时不在列头上方预留空行；只有表体 `TableContainer` 在高度受限时滚动，列头按原有 stickyHeader 合同默认启用。边框属于整体 frame，滚动容器不再叠一层外框；底栏有必要的信息分隔。组件使用真实可用高度，宿主无需测量 pageHeader 或减固定像素，也不 absolute/fixed 定位分页。

极端字号或高工具条使全部 chrome 超过正文分配高度时，外框保留完整工具条/反馈/底栏和可读表体下限，交给既有祖先滚动，不让 footer 越出 frame。库内部只有一个稳定的布局观察器，以实际 table、thead、首末行高度和 computed scroll-padding/滚动条计算 `min(实际内容高度, 表头与首末行较高者的可读高度)`，将该值用于 Grid 的表体轨道，并与组件自身工具条/footer（含反馈）的实际高度、frame 边框相加，设置组件根的最小高度；不读取宿主页头或已分配的根/frame 高度作为下限。workspace 取该实测最小值与原 token 的较大者，document 不加此根下限。无固定表头数字、行数分类或新的宿主参数。短内容不会因此补出空白。观察器只观察内容输入节点，不观察写入尺寸的 root/frame；合并同帧读写、无变化不写、忽略隐藏时的零几何、恢复显示后重测，并在销毁时释放及恢复拥有的内联值；列宽测量与 colgroup 合同独立且不变。

这个下限保证边缘记录操作的可达空间，不保证任意高度的全部中间行都可完整同屏。自定义超高单元格仍由表体滚动访问；需要逐行长文档阅读时可选 `document`，或按已有 `stickyHeader={false}` / `{stickyHeader:false}` 关闭吸顶列头。父视口本身不足时使用祖先滚动，不裁切内容。


pageToolbar 容器原本就没有常驻下边框，和下方正文之间已有 `--layout-section-gap`。不要额外包整行 border-b；迁移时清理产品重复分隔及 footer/表体定位 CSS。表头、行和底栏必要边界保留。

`--layout-workspace-content-min-block-size` 仍是既有 shell 的公开内容区下限，默认 `0px`，不自动探测 DataTable。在 workspace shell 中要求超高页头/200%文字下保留非零正文视口时，仍须如上通过公开 style 显式绑定为 `var(--data-table-min-block-size)`；该设置只保障 shell 正文的可达空间，不把 natural 表格变成填满布局。main 可自然滚到表格，内容区可继续滚动到完整 footer。该下限按 rem 随字号变化并受 100dvh 约束，极短窗口允许 main 滚动，不承诺所有内容同屏。`--data-table-min-block-size` 保留用于显式 workspace 的组件下限，不是 natural 的强制高度；组件最小高度不能跨越零高父视口解决可达性。

React 宿主只设置公开 token；不要查找或改写 `.xui-shell-content`：

普通无边界文档页可直接使用默认 natural；只有需要显式取消有界父容器高度上限时才选择 `layout='document'`。卡片列表仍用相同 pageHeader/pageToolbar，正文复用 ScrollArea/Grid/Card，参见消费者 cards 模式；不用另造页面骨架。

### 默认布局迁移

此前省略 `layout` 等同于 `workspace`，现在省略等同于 `natural`。依赖旧默认填满工作区或最小高度的消费者应显式加 React `layout="workspace"` 或HTML `{layout:'workspace'}`，保留其真实父高度与必要的 shell 内容区下限。希望少量行/空态自然收缩的页面可以继续省略；显式 `document` 调用无需改变。不要通过产品私有 CSS 恢复旧默认。

内部 toolbar、反馈、表体与唯一计数/每页条数/Pagination footer 位于同一 frame。采用项目升级时核对固定依赖 SHA、实际入口、页面槽和业务行为，库中已有该组合不能证明产品已采用；已有使用方的兼容约束由宿主评估。

### 分页事实与未知总数边界

组件只渲染传入的 `rows`，不自动切片，也不新增查询 owner。两种分页方式复用同一受控接口和同一个 footer：

- 本地分页：宿主持有完整记录和查询状态，先筛选/排序，再按 `(pageIndex - pageIndexOffset) * pageSize` 切出当前页，发布切片 rows、筛选后真实 total 和已确认 page facts。查询或条数改变时由同一宿主 owner 重置/校正页码。
- 服务端分页：宿主发请求，并以已确认响应对应的 rows、pageIndex、pageSize、total 更新表格；等待/失败期间保留旧确认事实。服务端已分页的 rows 不得再做一次本地切片。

`pageIndexOffset` 必须显式指定 endpoint 页基数，不默认猜 0 或 1。共享 `WebfacadeQuery` 使用真实 `page_index/page_size/return_total`；`parseListData` 验证真实 `list` 与可选 `total/next_cursor`，`toListPage(wire,{returnTotal})` 把未请求的总数投影为 null。组件不调用 HTTP、解析 envelope、猜字段或建立第二个 query/resource owner。

已知 total 时只做明确视图投影：`page = pageIndex - pageIndexOffset + 1`，`pageCount = max(1, ceil(total/pageSize))`。用户点击发出原 wire 基数 index；事实仍保持旧值，直到宿主确认下一组 rows/page facts 后更新，服务端场景以响应确认为准。每页条数只在 footer 出现一次，和真实已显示条数、已知总数与分页在同一公共区域；pageSize 更改只发请求，宿主决定是否回 endpoint 第一页。pageSizeOptions 必须为正的唯一整数并包含已确认值。省略 `onPageSizeChange` 表示条数不可编辑，保留唯一禁用条数控件；不应在 toolbar 再放一个条数选择器。

旧 `DataTablePagination` 保留原字段和默认 offset 行为，可显式 `mode:'offset'`。其中 `total:null` 只显示真实已加载数并隐藏编号 Pagination，不从满页/短页/数组长度猜 pageCount 或 hasMore。无 pagination 则为未分页列表，只显示已加载数。

游标服务采用 `DataTableCursorPagination`，与 offset 类型同由 React 和 runtime 公开入口导出：

cursor 模式复用框内同一计数、条数控件和分页区域，只显示上一页/下一页。即使有 total 也不构造页码或页数，不接受 `onPageChange`。`hasPrevious:false`、`nextCursor:null` 或缺对应回调会禁用该动作；busy/disabled 与旧模式同样受控。服务端 `next_cursor` 缺省不等于末页：宿主 cursor adapter 必须要求字段存在，不能用 `?? null` 把未声明变成末页。HTTP 的 wire 使用 snake_case，组件 view facts 使用 camelCase，精确转换见 [列表合同](PUBLIC_API.md#列表元数据与受控游标分页)。

上一页历史、查询/排序变化后重置、请求预算、失败重试、取消和迟到结果仍由唯一宿主 resource/query owner 管理。仅成功确认响应才推进历史和 rows；失败/取消不推进。组件不把 cursor 当作 URL/页码、不解码或生成 token，不自动缓存 total，不用数组长度推断后页。公共组合提供标准游标按钮，`footer` 仍可放补充业务内容；不要重复两组翻页 owner。

已知 total 缩小导致当前 page 超范围时，组件保留事实而隐藏无效编号控件；宿主须在同一查询 owner 中协调过期页或提供恢复入口，不静默 clamp/自动发请求。

busy/disabled 阻止重复分页、条数和默认重试，另有同步单事件轮重入门禁。宿主必须同步发布 loading/refreshing，等待期间保持 busy，并在成功、失败、拒绝或取消后更新；组件不猜 Promise 完成，不自动重试写操作。回调结束并不表示请求成功。

### 状态、焦点与生命周期

- 首次 loading 始终保留列头并在 tbody 显示稳定骨架及 loading 状态，footer 不把加载中的未知计数当 0 条成功结果。
- [collection-refresh-react](../examples/collection-refresh-react/app.tsx) 演示同范围集合刷新。refreshing 传入既有 rows（包括已确认的空数组）；表体、空态、底栏和搜索身份保持。默认不在正常流插入临时 LoadingState/提示，不挤动内容；集合的 `aria-busy` 与分页禁用继续生效，宿主在固定刷新按钮的预留图标位显示进度。ApiKeyManager 和两类日志 Explorer 已采用此组合，取消按钮从首次即占固定动作位，空闲禁用。
- `hasValue?: boolean` 是宿主已确认过当前范围结果的事实，不是缓存开关。省略时由非空 rows 或 ready/refreshing 推得；首次 loading/error 无结果。已确认空结果刷新失败须传 `hasValue={true}`，保留 emptyState，错误/重试放在 footer；首次 error 仍位于内容区。切换查询范围或身份时宿主重置该事实，库不代持旧快照或发请求。error 保留既有行并提供 `onRetry`。
- ready 且 rows=[] 保留全部列头，默认空态在跨全列 tbody 单元格内。`filtered` 区分初始无记录与筛选无匹配；自定义 emptyState 可放已有新增/清空回调，库不会凭空创建记录。
- 关闭、切页、查询变化、取消和迟到响应由现有 resource/query owner 处理。示例使用 `createResource` 与显式已确认快照，不添加 HTTP owner。业务查询改变时保留旧 rows 的策略明确由宿主选择，不能把它们误标为新查询结果。
- React 行/单元使用稳定 key。不要在 footer 更新时改变 columns renderer 的组件类型、重新生成行键或用整个查询给 DataTable 设 key。

### 请求失败时的可读性与布局

无反馈时，toolbar 之后直接进入列头，不保留常驻状态空行。已有行或已确认空结果的失败反馈，以及显式自定义 feedback，使用已有 footer 中计数旁的正常流区域；默认 refreshing 不新增该反馈。保留真实计数、每页条数及分页 owner。常规短状态在空间足够时复用底栏高度并保持表体边缘；窄屏、200% 或长文案以完整可读、键盘可达为更高优先级，允许 footer 必要增长，由既有布局观察器维持 frame 包含与祖先滚动。无 count（labels.count 返回空字符串）且无 pagination、footer、反馈时，不显示空 footer；必要反馈出现时仍有完整区域。


零行的 idle/empty/error 仍在保留列头的 tbody 内；loading 保留该结构的占位行（aria-hidden），唯一 status 在可见表体轨道中居中，避开真实表头高度与横向超宽列，有 token 最小高度而无固定内容高度上限。首次加载/长错误可以自然增长；多行仍仅由表体独立滚动，分页留在 frame 内。没有新增自动重试、请求或缓存 owner。React正式消费者可用 `?internal&no-count&no-pagination` 和 `?internal&disclosure-feedback` 验证可选信息与长详情。

现有行是否保留仍由宿主 rows 决定：普通同资源刷新应保留已确认事实；权限撤销、退出、租户或资源切换应按领域/认证规则清空，无权通过本组件继续展示。组件不缓存数据、不创建网络请求或离线 owner。见 [失败布局验证与边界](VALIDATION.md#失败复验与限制)。
ACL/权限过滤后的有界扫描可连续返回空 list 与非空 next_cursor；这仍可继续翻页，不保证下一页含记录，也不表示剩余数量。仅显式 null 是 cursor 末页。DataTable 不因空行禁用下一页，React 有针对性回归；此补充不改变共享 fixture 的字节或 hash。

`TableActions` 从 React 根入口及 `/table` 导出，接受标准 div props/ref，只负责换行与 table-action-gap。标签、排序、权限和写入结果由宿主拥有。长标签可换行，单元格保留焦点间隙。

DataTable正式示例可使用 `?sticky=none`、`?sticky=start`、`?sticky=end` 或 `?sticky=both` 检查同一套行线策略；不指定仍演示双侧固定。它们只改变示例通过公开列配置传入的sticky，既有布局和查询owner不变。

## 登录与管理员表单

### 完整页面与扩展

配置产品名称、标题、说明、可选logo、文案、safe returnTo；默认card采用Stitch V3的居中品牌＋自然高度单列表单，品牌位于卡片外部。显式fullscreen保留相同窄框，只省略外框表面与边框；两者均无左右品牌面板或分割线，尺寸统一来自[DESIGN](DESIGN.md)。主题复用已有owner，登录页不增主题选择器或持久化副本。React 页面在窄屏/短视口/200%文字下自然文档滚动，字段和动作可达。主动作后的反馈与辅助动作为空或隐藏时不占位；实际消息自然增长并完整可读，不保留固定或最小反馈轨道。字段与主动作保持 DOM、尺寸和相对顺序，居中卡片可随消息增高调整位置；公共尺寸与品牌组合见 [DESIGN](DESIGN.md#公共登录页布局与主题)，实际验收见 [VALIDATION](VALIDATION.md#认证页验收)。brandVisual仍是可选inert装饰内容，放在卡片外部的居中品牌组、默认最大80px高，窄屏隐藏；不应嵌入完整登录卡片或重复登录任务标题，公共库不识别图片文字。原checkSession文案键仍可配置，默认文字为“Retry connection”，仅在安全的session读取网络/超时/服务端失败时作为局部次动作出现；凭据401/403/429无此入口。自动session/refresh检查只显示局部状态；共享读取的等待者取消不等于取消底层owner，因此页面不提供该阶段的取消按钮。公共登录页已删除取消按钮及专属文案/事件，扩展等待也不自动生成取消动作。卸载、pagehide 与 auth owner 的 Abort 能力仍会终止所属等待并拒绝迟到结果，保留迟到结果隔离。页面不再承担登出管理；应用内仍可通过同一auth owner显式logout。

导航就绪要求owner为authenticated且busy为空，并且本节等待的认证/读取已成功结算。currentUser恢复access期间的refresh结果保持busy=session，最终session核对完成才发布空闲；宿主先启动读取再挂登录页与页面自行检查使用同一个flight，StrictMode重放不会增加HTTP请求。单独refresh仍按原合同完成。旧session因新access generation而失效时，页面只提供局部读取重试，不因owner保留另一份有效access而提前导航。

owner确认有效authenticated后，无论来自初始session检查还是主动login，都一次直接进入目标页；不显示“已登录/继续进入”确认卡。匿名保留同一表单；checking、login busy、错误与navigation交接不重挂字段或主按钮。同一auth owner与已验证user.id去重，不依赖每次refresh产生的新user对象引用；临时unknown/session/refresh保留该去重和导航失败结果，恢复身份不会暗中重试宿主导航；StrictMode effect 重放和重复订阅通知不会重复导航。

`onAuthenticated(user, returnTo)`兼容void，也可显式返回Promise<void>。宿主负责真正导航或替换为目标内容。同步抛错/返回Promise拒绝时，保留已确认的认证事实，局部显示navigationError与retryNavigation；重试只再次打开目标，不调用login/refresh/logout。void回调自行启动的异步任务无法由页面观测，其错误由宿主处理；需要页面处理失败则返回该Promise。pagehide/unmount后迟到的回调结果不再修改登录页；已经开始的宿主副作用仍由宿主按自身生命周期取消。opening期间禁重复且清空密码，没有虚假的完成卡。真正卸载后alive失效；StrictMode探测性cleanup/replay沿用同一次回调而不再次启动；更换auth owner会失效旧导航revision。pagehide使当前激活失效；pageshow.persisted恢复交互，并在owner仍确认authenticated时开始该次激活的一次目标导航，不补session/refresh/login请求。宿主需遵循bfcache生命周期，不能在persisted pagehide无条件销毁要恢复的owner。

4.2.25明确区分导航就绪、opening与failed：failed时主登录按钮显示原labels.submit、disabled=true、aria-busy=false，不继续显示/播报labels.opening；字段仍锁定，密码仍为空，navigationError和可用的retryNavigation留在所属反馈槽。显式重试进入opening后才恢复忙态文案；再次失败回到相同失败呈现，成功由宿主进入目标内容，不增加登录、refresh或logout请求，也不新增确认卡或文案键。

既有[正式登录示例](../examples/login-react/app.tsx)的`?handoff=throw`/`?handoff=reject`复现失败，`?handoff=hold`演示交接等待；示例为合成认证，不代表产品首次启动联调。

现有公开LoginViewController的subscribe/getState可观察navigationPhase（idle/opening/failed），它仅表示交接阶段，不提供宿主内部失败步骤分类或原始Error/body/credentials。需要定位加载模块、业务上下文等步骤时，宿主在自身onAuthenticated与原请求/资源owner中记录经过脱敏的固定步骤/错误码，并把需页面处理的Promise返回；不要把异常正文放入Toast、公共state、URL或storage。公共层不根据任意异常猜网络/权限根因，不新增并行诊断owner。

没有onAuthenticated时，直接使用经过 `resolveLoginReturnTo` 的根相对location.assign；若目标path/query就是当前页，则显示局部导航失败而不重复reload。回跳拒绝规范化及多次解码后的外部路径、控制字符、双斜杠、默认/login循环；去fragment与明确密码/token/code/api_key等query。其它自定义登录路由或含秘密业务query仍由宿主验证。

`extensions.beforeSubmit/actions/errorLabel` 和beforeFields/afterFields仍只接收username与AbortSignal，不接收密码/token/原始响应。宿主标准SSO、服务地址与账户来源保留同一认证owner。重复提交、扩展卸载中止、迟到导航和密码节点清空仍受页面generation控制；修改真实服务由产品安全策略决定。

### 认证布局 slot 归属

未知logout后继续使用同一Auth owner的普通登录、重载/新owner与bfcache的不同初始化条件，以[未知退出与重载边界](PUBLIC_API.md#未知退出与页面重载)为准；不能从“没有恢复弹窗”推断Cookie已撤销或跨重载禁止会话恢复。

| 真实入口 | 内容与位置 | 文字/着色 | 空内容与状态 |
|---|---|---|---|
| config.productName / logo | 卡片外居中品牌；宿主资产原样显示，Logo在名称上方 | section-title、foreground；图像不套主题滤镜、不替换SVG | Logo可省略，长名称自然换行；更新不重挂form |
| config.title / description | 卡片内首部标题/说明，左对齐字段 | login-title 26/32、600；description body-sm、muted | title必填；description省略无占位 |
| children；完整页beforeFields / afterFields | 标题组后的单列Field/公开控件；扩展在凭据前/后 | label/input body-sm；help/error为meta，错误用公共语义 | 空扩展不占位；不得嵌套form或复制凭据字段 |
| actions | 字段后的唯一主提交，与控件同宽 | 复用Button主色、login-control高度和body-sm角色 | 权限/busy/回调由宿主或完整页Controller负责，只有真实动作才渲染 |
| alternatives；完整页extensions.actions | 主提交后独立的真实次级认证入口 | 公共outline Button，沿用控件文字 | 不配置不生成SSO/注册/忘记密码 |
| feedback / feedbackActions | 主动作及次级认证后的结果与局部恢复 | 公共Alert语义色，meta；恢复使用ghost Button | 两槽空/hidden不占轨道；长消息自然增高、必要结果不折叠 |
| brandVisual | 品牌身份下的显式非交互装饰 | inert、aria-hidden；不替代真实Logo | 可选、窄屏隐藏；不承载任务标题或必要说明 |

V3只调整公共布局与派生Token，不改props、请求、认证或密码清理。默认卡片无顶部强调线，使用layer-surface与统一边界，精确尺度见[认证设计](DESIGN.md#公共登录页布局与主题)。消费项目按[AUTH-UI-001～006](ADOPTION_CHECKLIST.md)逐项检查入口及真实页面，不能等待部署后再补私有样式。

### 纯认证布局 AuthPage

首次管理员设置、启动错误和其他认证入口使用 React `AuthPage`（`@coffeehc/xui-react/login`），由xui统一卡片外部居中品牌组、横纵定位、由DESIGN定义的窄表单、任务标题/说明层级、内距、全宽主动作、反馈与滚动/focus。feedback槽可组合现有Disclosure承载独立长详情，必要摘要和未知后果始终在折叠区外完整显示，不截断宿主消息。不得拼 `xui-login-*` 私有结构、给产品补定位CSS或局部修改control-height等公共尺度。既有完整登录内部复用此组合；认证client和业务API不属于布局。

- `config: AuthPageConfig`：productName、必填title、可选description/logo/layout，沿用登录品牌校验与fullscreen/card含义。主题继承文档根，不接第二theme owner。
- React `children`：宿主公开Field/Input等组成的内容，不传另一整个页面或嵌套form。
- `actions`：主操作按钮/Fragment；公共槽负责全宽、lg高度与内距，宿主负责标签、disabled/busy、权限、验证和事件。`alternatives`：独立次级操作组。
- `feedback`：宿主Alert等反馈；`feedbackActions`：只在有真实用途时出现的局部次动作。两槽均为空或隐藏时不占位，实际内容自然增长。React 识别空 Fragment 和条件空值。布局不自动提交、重试、认证或清除宿主字段。
- 可选 `brandVisual`：非交互装饰内容，继承窄屏隐藏与inert。
- 默认panel为section。只有显式 `form:{noValidate?,onSubmit?}` 才渲染form；公共处理阻止默认提交，避免无回调时把字段发到URL，然后调用宿主回调。初始化API、密码校验/清理、成功后的路由均由宿主负责，不接入或猜测产品初始化协议。


正式纯布局消费者为 [React](../examples/auth-page-react/app.tsx)：三字段管理员设置，仅合成submit回调，不调用真实初始化或认证API。按[同一登录验收清单](VALIDATION.md#认证页验收)验位置、更新identity、三主题/窄屏/200%与主动作可达；不能把示例通过当成产品已迁移。

### 管理员初始化页

React `AdminSetupPage`（`@coffeehc/xui-react/admin-setup`）提供用户名、新密码/确认、提交、忙状态和安全反馈，内部复用 React AuthPage 与 NewPasswordFields，不新增 AuthClient。空反馈不占位，实际消息自然增长，沿用同一主题与自然文档滚动。

#### 可组合初始化表单

`@coffeehc/xui-react/admin-setup` 公开 `AdminSetupForm`、`AdminSetupFormProps`、`AdminSetupFormHandle`，根入口同步导出。它是包含字段、提交与反馈的唯一真实 form，不生成 AuthPage、品牌、标题或卡片；完整 `AdminSetupPage` 直接组合 AuthPage 与同一个 AdminSetupForm。没有新建 runtime/UI 副本或第二套提交 owner。

Form 接受 `state/onSubmit/onCheck/validateUsername` 或互斥的完整 `controller`，并支持原有 `labels/passwordLabels/ref`；不接受页面 `config/brandVisual`。`ref.clear()` 仅清密码及用户名错误，不清用户名、不更改权威状态、不取消或重放写入。每个活动表单只使用自己的 Controller；宿主持有的注入实例不由 Form 销毁。submit、未知结果、手动核对、取消及密码清理完全沿用下文合同。焦点进入控件时，Form按既有scroll-margin就近保持完整焦点边界可见，不重新指定焦点或滚回文档顶部。

| 归属 | 内容与视觉角色 | 空槽和状态 |
|---|---|---|
| AuthPage config / 品牌 / 标题 | 原宿主Logo与名称、任务标题；V3既有Token | 检查/错误/初始化期间保持同一个AuthPage实例，不换key、不调用root.unmount |
| AuthPage children | 检查提示，或完整AdminSetupForm | AuthPage省略form；检查时不提前显示可提交初始化字段 |
| AdminSetupForm 字段 | 用户名、NewPasswordFields；继承body-sm、login-control与公共错误关联 | 锁定、校验、密码显隐和清密由同一实现维护 |
| AdminSetupForm 动作 / 反馈 | 唯一submit、busy播报、Alert与显式核对；沿用公共actions/feedback角色 | 空反馈无轨道；错误自然增长；宿主不再另外拼字段/提交/反馈 |

```tsx
// Shell stays mounted while host-owned checks change phase.
<AuthPage config={config}>
  {phase === 'setup'
    ? <AdminSetupForm controller={setupController} />
    : <StartupStatus status={phase} />}
</AuthPage>
```

这里的StartupStatus是宿主内容示意，不是新增公共组件。AuthPage从首次挂载就省略`form`，不可在其内再套完整AdminSetupPage，也不可给AuthPage传form后嵌套AdminSetupForm。AuthPage已有form模式不可挂载后切换的合同保持不变。宿主核对完成后才提供允许初始化的state；错误/检查恢复不自动重试写入，不把未知结果重新解释为idle。示例见[共享认证外壳](../examples/admin-setup-form-react/view.tsx)，只含明确标注的合成回调，不调用真实初始化/认证API。

#### 输入和责任

React props 为 `config: AuthPageConfig`、必填 `state: AdminSetupState`、`onSubmit: AdminSetupSubmit`，可覆盖 `labels: Partial<AdminSetupLabels>`、`passwordLabels: Partial<NewPasswordLabels>` 和 brandVisual。brandVisual 接受 ReactNode。用户名默认只校验非空，可选宿主校验见下节；不裁剪提交值或杜撰字符/长度政策。新密码固定校验 6–32 个 Unicode 码点，无策略请求或项目配置。

`onSubmit({username,password}, {signal})` 只在一次明确提交且字段有效时调用，返回 `complete | unconfirmed | unavailable | rejected`。`rejected` 必须表示宿主权威确认未应用、可重新提交，不能把网络异常/取消/无 receipt 映射成 rejected。throw/reject/运行时不合法结果一律转为 unconfirmed。回调需在开始时构造自己的请求数据；库清理传入对象的 password，不保证已传出的字符串或宿主副本可被擦除。

宿主保留具体初始化 API、权限/租户/数据库条件、权威初始化状态及跨重载的未知结果处理；公共页不要求 receipt、operation ID 或额外恢复协议。公共页既不重放写入，也不自动轮询、登录、导航、保存或记录密码。跨卸载/重载的未知结果保护是宿主责任；新挂载不能无依据传 idle。完成仅显示“管理员已创建，请登录。”。

#### 宿主用户名校验

`AdminSetupForm`、`AdminSetupPage`默认模式与runtime `AdminSetupControllerOptions`一致提供可选`validateUsername: AdminSetupUsernameValidator`。同步纯函数接收原始用户名，返回`null`通过或非空字符串作为本地化字段错误。必填检查先行，空白不会调用宿主规则；xui不内置产品正则、长度上限、trim或大小写转换。宿主若需要规范化，必须由其自身策略及提交合同明确处理，不得假定组件已改写值。

```tsx
const validateUsername: AdminSetupUsernameValidator = raw =>
  /^[a-z0-9][a-z0-9_.-]{2,63}$/.test(raw)
    ? null : '请输入3–64位小写字母、数字、下划线、点或连字符。';
// 上述规则仅为合成宿主示例，并非xui默认用户名规则。
<AdminSetupForm state={authority} onSubmit={submit} validateUsername={validateUsername} />
// 注入模式：规则仅配置在createAdminSetupController的options中，View只传controller。
```

Form在读取密码前校验用户名，失败保持idle、保留输入、关联公共Field错误并聚焦用户名；输入或`ref.clear()`清除字段错误，不改变权威状态。`controller.form.validateUsername(raw)`供显式校验，返回boolean；快照保留`usernameError`，自定义错误另有`usernameIssue: {message}`，无效回调为`'invalid'`，必填错误不增加issue。快照不保存用户名或密码。

Controller的`submit`也在写入边界执行同一校验；被拒绝时清空传入凭据对象的password，零写入。正常Form提交流程可能多次求值，回调必须纯净，不发请求、不变更状态；SSR、render及options更新不自动调用。`update({validateUsername})`替换未来规则，显式`undefined`移除，不自动清除已有反馈、重校验、解锁未知结果或重试提交。语言变化可替换规则并在下一次显式校验生成新文案。throw、Promise、空字符串或其他非法返回阻止写入，使用可翻译的可选`labels.usernameInvalid`（默认“请检查管理员用户名。”）；不展示异常内容，不等待异步结果或应用迟到结果。已有完整labels对象仍可使用。使用当前factory创建的Controller无需迁移；手写完整Controller必须补齐新增form.validateUsername方法及相同反馈合同，不能注入旧版Controller冒充当前类型。三个正式包必须同版本同代安装。

#### 状态和生命周期

- idle：宿主确认当前允许初始化；用户显式提交后进入 submitting。
- submitting：阻止重复提交，密码输入立即清空。
- unconfirmed：显示“暂时无法确认创建结果，不能再次提交。”，全部写入锁定；仅配置 onCheck 时生成手动核对入口。
- checking：仅执行宿主只读核对，字段与写入保持锁定，禁止并发核对。
- complete：初始化已确认完成，仍未登录。
- unavailable：当前不能初始化；界面不猜测原因。

可选 `onCheck: AdminSetupCheck` 接收 `{signal}`，只由用户在 unconfirmed/unavailable 状态明确触发，返回 `complete | unconfirmed | unavailable`。回调不接收密码，不得执行初始化或自动登录；其请求、期限和权威事实仍由宿主负责。拒绝、异常或非法返回产生 unconfirmed 与 `checkFailed:true`，显示可翻译的 checkError 并保留手动重试，绝不解锁写入。普通回调返回 idle/rejected 不能授权再次初始化；只有宿主另行发布权威 state 才能改变写入许可。库不自动请求、不新增端点、轮询、恢复协议或导航；完成后宿主可按现有路由回登录。labels 增加可选 check/checking/checkError，旧完整 labels 对象仍可编译；未配置时保持原 UI。

state 可含 `checkFailed?: boolean`（仅 unconfirmed/unavailable 有效）、`rejected?: boolean`（仅 idle 有效）与 `revision?: number`（安全整数）。React 对 status/rejected/revision 的事实变化应用新权威状态，普通 inline 对象重渲染不取消进行中的提交。宿主在相同状态值上发布新的权威观察（例如 unconfirmed 后又权威确认可以提交）时递增 revision。宿主更新 React state props 本身就是新权威观察。不要将页面暂态写回权威输入来循环同步。


底层 `createAdminSetupController`（runtime/admin-setup）仍公开相同状态/submit 合同及可选 onCheck/check()；它是不含用户名/密码快照的纯 TypeScript owner。React 页面已拥有其订阅，普通产品不需创建第二个。

#### 正式示例与接入

[React SSR/hydration 示例](../examples/admin-setup-react/app.tsx) 只使用合成状态和 submit 回调。迁移已有手写 setup 时，删除被公共页接管的用户名/submit/feedback、密码清理与忙态 UI，保留宿主领域 owner、接口与权威状态映射。

单测入口为 [admin-setup.test.mjs](../tests/admin-setup.test.mjs)，浏览器入口为 [admin-setup.spec.mjs](../tests/browser/admin-setup.spec.mjs)。正式构建/consumer 后可访问 `/admin-setup-react/`；`?long` 为合成长错误；`?check` 启用合成只读核对回调。检查未知状态关键句全文、完成不自动登录、稳定输入/焦点、卸载清理及浅深/system、窄屏/放大；实际运行证据见 [VALIDATION.md](VALIDATION.md#认证页验收)，不以 SSR 静态通过代替 hydration 或真实产品验证。

### 菜单危险操作语义

Menu.Item 与 ContextMenu.Item 共享带类型的 `tone?: 'default' | 'danger'`，默认外观不变。危险默认文字/图标取 status-error-foreground，hover/键盘高亮取 status-error-soft/foreground，pressed使用action-danger/action-danger-foreground成对填充；disabled使用原menu-item-disabled-foreground并禁执行，独立键盘focus轮廓保持。权限、确认、回调和结果由宿主负责，不因tone自动执行或弹确认。图标使用公开Icon且沿currentColor。LinkItem/CheckboxItem/RadioItem保持既有合同，此tone只为普通动作Item。


公开行事件正式消费：[React](../examples/row-events-react/app.tsx)。示例保留 selected/expanded、sticky、横滚和受控 cursor，名称 Button 提供键盘等价入口。

## 日期时间选择

React `DateTimePicker` 组合已有 Field、InputGroup、Calendar、Select 与 Popover；一个可编辑文本 Input 是唯一具名表单值，弹层小时/分钟选择不额外提交字段。必需 label；支持 id/name/form/help/error/describedBy/placeholder/autoComplete，React ref 指向文本 input；labels 可覆盖操作和错误文案，locale/weekStartsOn/today仅控制日期显示。help/error 使用 ReactNode。

value（传入即受控）与初始-only defaultValue 接受严格公历 `YYYY-MM-DDTHH:mm` 或 null。分钟精度、年份0001..9999，拒绝秒、Z、offset、时间戳及无效日期，不 trim/截断/转时区。onValueChange只请求变化后的有效值或null，外部value更新无通知；拒绝受控请求保留宿主确认值。业务时区、起止先后、可观察窗口范围由宿主决定；不得直接把墙上时间字符串当UTC瞬时值。today省略时仅以当前UTC日期作为日历浏览参考，空值不自动填当前时间。

输入完整有效文本即请求值；不完整或错误文本保留为局部 draft 且不通知，blur/Enter/invalid 时显示关联错误，输入无效草稿时公共 feedback slot 先保留错误区域，避免首次错误反馈推走正在点击的表单动作。弹层日期、小时0..23、分钟0..59是独立草稿，确认一次原子请求；取消/Escape不提交。清空返回null，required 也允许清空并由浏览器 validity/Field 提示必填。disabled禁止编辑、打开和提交；readOnly保留可聚焦读取但禁止编辑/清空/打开。readOnly/disabled遵循HTML表单校验规则（不会参与浏览器校验）；host error不会被内部格式校验覆盖。


```tsx
import {DateTimePicker} from '@coffeehc/xui-react/date-time';
<DateTimePicker label="开始日期时间" name="start" value={start}
  onValueChange={setStart} required error={startError} />
```


### 完整登录页密码显隐文案与品牌替代文本


React AuthPage、完整 LoginPage 和初始化页的 `logo.alt:''` 必须首次即输出显式 `alt=""`；非空替代文本与更新/移除 logo 遵从已有配置，不能用 DOM 属性的默认空值推断已输出属性。

`NewPasswordLabels.showPassword/hidePassword` 同样为可选字段，由 React NewPasswordFields 转交给新密码和确认两个内部输入；AdminSetupPage 的 passwordLabels 原样支持。默认英文与旧配置保持兼容，密码规则和强度建议不变。独立改密表单的合成正式消费者见 [React](../examples/password-change-react/app.tsx)，演示公开自助改密命令、完整表单及清理；服务端使用明确合成fixture，不连接真实账户。

### 通用长标题

React `@coffeehc/xui-react/display` 与根入口公开 `OverflowText` / `OverflowTextProps`；runtime `/display` 只保留共享纯类型与纯 helper。只接收 `text:string`，保留安全完整文本，不接受交互 children 或 HTML。组件本身是无 role、无 tabindex 的 span；宿主保留 h3、图标、右侧 Badge、摘要、元数据与操作。中性归属标签不跟随名称滚动，不因长标题改成错误/成功着色。

```tsx
const cardRef = React.useRef<HTMLElement>(null);
<Surface ref={cardRef}>
  <h3><OverflowText text={title} interactionRef={cardRef} /></h3>
  <Button onClick={onOpen}>查看资源</Button>
</Surface>
```

`interactionRef` 是包含此名称的现有卡片/控件表面；在该表面 hover 或已有按钮/链接/input 获得焦点时，只有实际溢出的名称停留后按共享 token 单次滚至末端，保留焦点与操作。未传时尝试名称现有的可交互祖先；找不到键盘入口时保留完整静态换行，不加标题Tab停靠/伪按钮。离开且失焦复位，短名称不动画。触屏/any-pointer:coarse、无hover、减少动效、无Web Animations或JS未运行均完整静态换行，英文无空格也可折行；完整名称一直保留在DOM和可访问文本中，不依赖title提示。


表面宽度和内容排列继续采用公开布局；此部件服务标题文字，不代替 Card 的 header/content/footer 三段槽位。正式 [React](../examples/display-react/app.tsx)增加 `?overflow`，h3名称和右侧中性“公共”Badge分离，下方摘要/草稿/既有动作不移动。合成样例不是产品业务或完整卡片框架验收。

从4.2.16起，AppShell/MenuLayout共享更紧凑的默认展开宽度：16vw在公开nav-sidebar-min-width/max-width间夹取，100%时192–224px，仍以50vw封顶。两种Shell、品牌列与侧栏使用同一个已解析长度，compact和窄屏不变；公共min/max/width覆盖继续有效。sidebarTabs的默认content排列让短项保持自然宽度并分布两端，四个短中文项按当前净宽自然分布，4.2.16较窄的下限允许换到下一行；无需选择equal或缩字。任意长名仍可折行，侧栏不随选中字重来回伸缩，也不按业务标题另建尺寸owner。

从4.2.8起，NavigationMenu有链接的独立分支按钮与无链接主分支按钮复用DisclosureIndicator：16px公共control-icon-size、currentColor、共享矢量线宽与开合旋转；独立按钮与配置动作统一36px方形命中区，指示器居中。紧凑rail和放大继续派生同一尺度，翻译名称、aria-expanded/controls、roving与动作归属不变；SVG装饰不增加键盘入口。

### 侧栏快捷操作组合

`AppShell.sidebarHeader` / `MenuLayout.sidebarHeader` 的裸说明为次要文字；不约束直属或嵌套 Button 的宽度/字体；默认按内容宽度，宿主需要全宽时明确使用公开 style/className；Toolbar/业务布局管理动作组合，空间不足时由公开布局自然换行。页头仍最多占侧栏合同上限，独立滚动且至少保留一项导航高度；footer 与菜单保留自己的滚动和焦点。Header 分隔两侧采用 space-text-gap，sidebar 中的 Tabs.Panel 不再叠加通用内容 padding；普通页面 Tabs 不变。无需宿主 wrapper 或内部 CSS。[正式示例](../examples/sidebar-footer-react/app.tsx)的 `?header=actions&row` 复现两项文字动作和一个图标动作，`header=long` 验证长中文，`header=direct|full|content|business` 验证宽度归属；`header=tabs` 展示一个 Tabs.Root 覆盖 sidebarHeader 内的 Toolbar/Input/Tabs.List 与 sidebar 内的 keepMounted Tabs.Panel/NavigationMenu。

从4.2.7起，若末位是水平line Tabs，AppShell和MenuLayout均使用可选`sidebarTabs`槽，动作/搜索仍在sidebarHeader。槽位自动占满header净宽，content项保留自然宽度并分布到轨道两端，equal仍按单项上限等分；保留单项最大宽度；Shell省略该header的分隔线及底部padding，普通header与segmented Tabs继续采用原边界。它不接管Root值、路由或Panel，也不复制侧栏。已采用4.2.5/4.2.6的宿主需把末位List从sidebarHeader移到sidebarTabs，共用同一个Tabs.Root；仅升级而未迁移slot的旧组合仍保留原Shell边界，不能宣称自动合线。无需宿主私有CSS、负margin、伪元素或删全站分隔。

```tsx
<Tabs.Root value={view} onValueChange={setView}>
  <AppShell
    sidebarHeader={<Stack>{actions}{search}</Stack>}
    sidebarTabs={<Tabs.List variant="line" aria-label="会话范围">
      <Tabs.Tab value="current">普通</Tabs.Tab><Tabs.Tab value="team">团队</Tabs.Tab>
      <Tabs.Tab value="plugins">插件</Tabs.Tab><Tabs.Tab value="archive">已归档</Tabs.Tab>
    </Tabs.List>}
    sidebar={panels}
  >{content}</AppShell>
</Tabs.Root>
```

该slot只用于水平line List；segmented、竖向或其他header内容仍使用原sidebarHeader，不把普通内容冒充Tabs。正式[组合示例](../examples/tabs-overlay-react/app.tsx)的`?sidebar=shell`/`?sidebar=menu`覆盖两个公共布局，`controlled`/`injected`展示同一个Root状态，`long`展示长中文与换行；不是产品的会话分类/API实现。

sidebarTabs不以内容改变整栏宽度。既有nav-sidebar-width需要可参与Grid、header品牌列calc的长度/百分比表达式，不能赋max-content等intrinsic关键字；当前没有“按四项Tab自然宽度收窄整栏”的公开模式。该能力须由公共布局另外实现与验收，不能由宿主读取私有DOM或临时宽度/CSS补丁模拟。

## Tabs

Tabs布局与图标部件从1.2.0提供；本版增强默认/选中对比，执行结果见[验证记录](VALIDATION.md)。固定1.1.3不包含新增部件。

React `/tabs`（及根入口）提供 `Tabs.Root/List/Tab/Label/Icon/Panel` 和 `TabsListProps/TabsLabelProps`。Root拥有受控value/defaultValue，并作为Flex/Grid子项允许收缩、不把长名称的最小内容宽度传给页面；List只管理轨道编排与键盘焦点；Tab的children承载名称，Icon只放装饰性图标，Panel承载对应内容。Tab拥有 body-sm 字号与行高，普通项字重400、选中项字重600；图标继承文字和状态色，Panel内公共组件保留自身文字角色。Icon不承载独立按钮、提示或业务状态，真实label不能只放在装饰槽。

`Tabs.List.layout` 默认 `content`：轨道贴合标签组，不自动铺满父容器；轨道最大宽度为可用空间，项之间允许换行。每个Tab最大宽度由公共 `--tabs-item-max-inline-size` 统一约束，默认复用layout-field-min（根字号16px时240px），同时不超出父容器。显式 `equal` 才在该上限内等分可用宽度，不为铺满而超过单项上限；宽容器允许轨道末尾留白。依赖旧满宽轨道的采用方应明确选择equal，不通过宿主内部CSS或缩字号修补。图标保持公共尺寸与非收缩；纯文字不留图标空位。

`Tabs.List.variant` 可选 `segmented | line`，从4.2.7起省略时默认line，需原内嵌外观时显式segmented。line仅改变同一组件的外观：无外胶囊底槽、无项内选中框，普通文字/图标继承muted-foreground，当前项继承action-primary与heading字重，唯一底部选中线使用line-width-emphasis和currentColor；其他项预留同宽透明底边，hover/focus不替换选中归属。水平List拥有separator-line/line-width-surface绘制的内嵌淡分隔，单行时与选中段同一底部基线，不增加布局高度或第二条平行线。多行时各行自然排版，选中段仍在所属项底边，整体淡分隔位于最后一行底部；不为合线裁切、固定高度或压缩字体。没有额外选中外圈或新状态owner。content/equal、竖向/RTL键盘仍沿用原合同；竖向line保留原每项底部选中线，不加入水平整行分隔。无额外原生UI实现。

Tab直属字符串/数字自动进入公共Label文本槽；组合内容显式使用 `<Tabs.Label text={name}/>`，装饰Icon、计数和状态放在文本槽之外，不把整组内容一起滚动。Label复用OverflowText：支持精细鼠标且未减少动效时，长名称单行省略，Tab hover或已有键盘焦点停留后仅名称按共享速度单次滚至末端，离开且失焦复位；完整名称始终在DOM/可访问名称中，不依赖title，不新增Tab停靠或更改选择。触屏、减少动效、无动画/JS、不能键盘进入的disabled项保留完整静态折行，以保证所有人可读。短名称不动画，内容/宽度/语言更新重新测量且不重挂Tab/Panel；RTL沿相应方向揭示。自定义嵌套label不被库猜测和改写，应使用公开Label槽，不能套自己的截断/滚动CSS。

显式segmented的普通项使用body 400文字；选中项使用raised底色、强调色文字/图标、heading 600和细边界，透明边框预留的线宽不会改变未选项几何。普通、选中、hover、键盘focus都清晰可辨。沿用peer的controlled、activateOnFocus、loop、RTL/orientation与panel关联；xui的键盘适配仍只负责跳过disabled。刷新、busy/error及草稿属于宿主或对应Panel，不因切换轨道布局而重挂Root或业务内容。

```tsx
<Tabs.Root value={view} onValueChange={setView}>
  <Tabs.List aria-label="任务视图" layout="content" variant="line">
    <Tabs.Tab value="grid"><Tabs.Icon>{gridIcon}</Tabs.Icon>运行网格</Tabs.Tab>
    <Tabs.Tab value="logs"><Tabs.Icon>{logsIcon}</Tabs.Icon>运行日志</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="grid" keepMounted>{grid}</Tabs.Panel>
  <Tabs.Panel value="logs" keepMounted>{logs}</Tabs.Panel>
</Tabs.Root>
```

[字体样板](../examples/typography-slots-react/app.tsx)使用公共Icon部件；[侧栏样板](../examples/sidebar-footer-react/app.tsx)的 `?header=tabs&row` 展示内容宽轨道，追加 `tabLayout=equal` 比较显式等宽排列。验收须分别记录布局、三主题、长中文、放大、图标状态色、键盘、disabled、关联panel和草稿连续性，不以静态截图代替交互结果。

## 文件上传 Upload

公共 React `Upload<T>` → 独立 `UploadController<T>` → 共享 `UploadService` → 同一 HTTP/Auth；View 不持有第二份队列，Service 不持有页面文件列表。options 与 controller 互斥；实例切换和真实卸载取消所属等待，StrictMode replay 不误取消存活视图。详细方法和文件政策见 [上传 API](PUBLIC_API.md#文件上传)。

| slot | 内容与形式 | 文字与状态归属 |
|---|---|---|
| label / picker / hint | Field 标签、公共选择 Button、拖拽提示；不把整个区变成按钮 | 继承 Field/Button/help 字体；错误关联 help/error |
| list / file / filename | 自然列表，稳定文件 id；完整名称允许换行 | 正文继承；宿主不另设字号或截断关键名称 |
| metadata | 确切字节、可选 renderFileMeta | help 语义；不重复状态或塞业务操作 |
| status | 每行唯一 Badge / role=status | queued 中性、uploading info、success 成功、invalid/error 错误、canceled 警告；同时有文字 |
| progress | 只在 uploading 显示 Progress 与等待文案 | 在自身文件行内居中；无已测进度不显示百分比 |
| fileActions | cancel/retry/remove | 公共小按钮，桌面行尾，窄容器自然换到所属行下方 |
| feedback | 类型/大小错误、未知写入结果提示 | 字段错误/error 与次要说明/help；retry 关联未知结果提示 |
| result | renderResult，仅已确认 response | 继承正文；payload 不自动映射业务事实 |
| actions | 当前队列唯一 Upload 主操作 | 内容宽度；空队列、无 queued、busy、锁定时禁用 |

交互只由明确选择/拖入追加文件，开始与重试是明确动作。disabled/readOnly 保留结果展示并禁用编辑；owner 可终止等待。焦点动作消失时转到同行可用操作；移除当前行落到下一行、上一行或选择按钮；焦点已离开组件时，后台完成不抢焦点。触屏/键盘使用同一选择按钮；文件选择器关闭遵循浏览器原生返回行为。窄屏、长中文、文字/界面/浏览器缩放依公共继承和容器 reflow，无横向页面溢出。正式示例 [upload-react](../examples/upload-react/app.tsx) 仅消费公开 ESM/CSS，不含私有皮肤。

## 自助改密表单

`@coffeehc/xui-react/password`及根入口公开`PasswordChangeForm`、`PasswordChangeFormProps/Handle`。一个真实form复用Field、PasswordInput、NewPasswordFields、FormActions和Alert，不含AuthPage/卡片/路由或第二认证owner。默认传`auth`、可选`onChanged`；亦可传完整`controller`，二者互斥。labels/passwordLabels只影响文案；`ref.clear()`清DOM与显隐，不解锁unknown或重发。必填当前密码错误关联Field并聚焦；新密码校验与强度建议沿用原组合。提交立即清三密码框，确定拒绝后也需要重新输入，不保留秘密帮助“恢复草稿”。

```tsx
import {AuthService} from '@coffeehc/xui-runtime/auth';
import {PasswordChangeForm} from '@coffeehc/xui-react/password';
<PasswordChangeForm auth={AuthService} onChanged={()=>openLogin()} />
```

openLogin是宿主的真实路由动作示意，库不生成登录URL。若置于AuthPage，省略AuthPage.form以免嵌套form；置于Dialog/Sheet则由该公共容器拥有标题、关闭和最终回焦。保留挂载的容器须将其公开open状态传给`active={open}`：false时清密、取消所属等待、禁用；默认卸载同样清理。外部身份失效/变化清密，未知结果维持锁定，新登录后的新表单生命周期才可重新发起。关闭不能回滚服务端写入。

| 区域 | 所属内容/形式 | 状态与文字角色 |
| --- | --- | --- |
| fields | 当前PasswordInput + 固定NewPasswordFields | 公共Field正文/标签/错误；不得自行覆盖字号或复制显隐按钮 |
| actions | 唯一FormActions主Button | 内容宽度，busy禁重入，宿主权限不可绕过 |
| feedback | 唯一公共Alert | 不预留空白，真实错误/未知自然增高；提交结束反馈可获焦，现有主题语义 |

runtime/password公开`createPasswordChangeController({auth,onChanged?})`，`PasswordChangeController/Options/State/Labels`、`passwordChangeLabels/getPasswordChangeMessage`。快照只有status、currentPasswordRequired、安全error；readonly auth为借用依赖，currentPassword/newPassword为显隐及校验子模型。`submit(credentials)`只调用一次AuthClient.changePassword且立即擦除传入对象；`validateCurrentPassword/clearCurrentPasswordError`管理字段反馈；`suspend`取消本表单作用域，`update({onChanged})`只替换未来回调；`destroy`由创建者调用，不销毁Auth。注入实例由宿主销毁，View仅释放自己的等待/DOM；一份实例只服务一个活动表单。confirmed后onChanged失败不改写已提交事实、不重发。

AuthClient新方法及busy的password分支是新增公开合同；使用官方Service的旧登录/退出调用无需改接线，手写完整AuthClient/对busy穷举的实现须补齐。正式三包须同版本；不能把4.2.3对象冒充当前完整注入接口。请求/代次与结果未知矩阵以[PUBLIC_API](PUBLIC_API.md#自助改密)为准。

## 进度 Progress

Progress保留语义progress、真实value/max与无value的未知状态；轨道与填充以及密码强度 meter 共用 progress-height（100% 为 4px）、progress-radius（默认 0）；宽度方向始终等厚，不能用满圆角或原生 meter 默认外观变成椭圆。宽度由所在公共slot决定，主题/RTL/缩放/forced-colors和reduced-motion沿用原合同。

### 导航抽屉的阅读空间（4.2.14）

AppShell/MenuLayout 在既有窄屏断点使用同一侧栏、同一导航 Controller 和模态焦点。默认贴边全宽全高；标题/关闭区与 Sidebar 各处只保留一层集中内距，Body 无重复 padding。sidebarTabs 与 sidebarHeader 分开布局，四个长中文 Tab 可以在 sidebarTabs 横向轨道中滚动，List 保留单一分隔基线，不能被 Header 的纵向裁切吞掉。窄屏公共槽将获得焦点的项按最近边界滚入可见区域，宿主不必补滚动事件；普通内容重渲染不先重置区域布局投影。

正常分区按 Body 可用高度和集中比例分配 Header/Footer/Menu；头尾自然内容超预算，或 Tabs 等占用导致菜单目标空间不足时，公共层自动改为 Body 整体纵滚。Header→Tabs→Menu→Footer 顺序与内容不变，不重挂组件，不销毁草稿/选中/展开事实。短屏、长账户与200%阅读不通过缩字或隐藏动作解决。独立分支与行尾操作空间不足换行，深层缩进最多累计一层；触屏长名称仍完整静态换行。实际公开组合见 [多行工具与导航](../examples/public-layout-react/app.tsx)。

### LinkedText、Toast.View 与绘图资源（4.2.15）

- `LinkedText` / `Typography.LinkedText` 归属正文或元信息的原文字槽，继承字体，包含未链接的长文本也安全换行，不增加新皮肤；字符串/数字只将安全绝对 HTTP(S) 片段呈现为现有 Link，其他文字与 React 元素保持原样。普通 Link 的装饰遵守当前[Typography合同](#typography)。嵌套行操作时显式 stopPropagation，不重写浏览器链接默认行为。
- `Toast.View` 是已有部件的标准全量组合：Title=label字重/body-sm、Description=meta、Actions=已有小按钮、Close=具名关闭；空标题/描述/动作不占位。labels 提供区域/关闭名称，renderActions 只填动作槽，不能创建第二队列。scopeKey 和 clear 的隐私边界不保留退出动画文案；旧异步 add 的取消由宿主负责。
- `useResource(createModuleResource(...))` 沿用 DataRegion/LoadingState/ErrorState：首次等待在所属内容区居中，同 key 刷新保留已挂载内容/焦点，失败仅显示局部恢复动作。模块的 React mount/teardown 和 trusted assets map 仍由宿主提供，库只管理一次资源等待和 CSS lease。
- 绘图从 `/theme-colors` 读取当前语义 token，复用 ThemeService，Canvas/WebGL 的业务状态与绘制循环保留原 owner，不增加原生 UI 版本。上述纯工具、资源与颜色接口完整边界见 [PUBLIC_API](PUBLIC_API.md#安全正文链接)。

[正式包示例](../examples/public-capabilities-react/app.tsx)组合四项能力，不使用源码 alias、产品数据或私有 CSS；不代表任一产品已接入。

### 紧凑导航的临时揭示（4.2.16）

AppShell 与 MenuLayout 公开可选 `sidebarRevealOnHover?: boolean`，默认 true。紧凑桌面在 fine pointer hover 或键盘进入导航时以同一侧栏树临时覆盖正文，显示完整标签与页脚；正文轨道和 Controller 的 collapsed、expandedIds、选中、滚动与草稿不变，不调用折叠回调或写偏好。收起/展开按钮仍修改原 Controller；临时显示时 aria-expanded=true，显式点击“展开导航”才确认永久展开。传 false 可保留仅显式切换。

侧栏 slot 及其公共 React portal 的指针/焦点共同维持显示；离开且失焦后150ms宽限收拢。公共菜单或 Dialog 优先关闭/回焦，再次 Escape 收起预览并回唯一导航开关。消失的焦点节点与 Shell 卸载会清理占用及资源。窄屏、触屏不依赖 hover，仍用已有显式抽屉；不为独立 NavigationMenu 添加第二套宽度 owner。

`SidebarFooterRow` 中的 ghost Button → SidebarFooterContent（直接 SVG）、Toolbar → ghost Button 或 passive span → SidebarFooterContent（Icon 包 SVG），以及更新 Button 或 role=status 均居于 compact 的同一中心线。默认按钮保留36px最小点击区，图标16px；passive 不成为按钮，无 icon 的事实仍完整换行。展开与预览时恢复完整文字并按自然宽度换行，使用继承字体，无逐项目宽度表。正式示例：[sidebar-reveal-react](../examples/sidebar-reveal-react/app.tsx)。

### 透明文字动作（4.2.17）

`Button variant="text"` 与 `Disclosure variant="text"` 在默认、hover、pressed、展开及disabled时均透明。默认foreground，hover/pressed/aria-expanded采用action-primary，图标/DisclosureIndicator继承；禁用前景和执行阻断保留。Button保留size点击区与文字角色，取消该变体按压缩放；无下划线。Disclosure保留全宽trigger、body、分隔线及同一Overlay/focus owner，关闭时按原规则回到同一trigger。默认ghost/link未改变，Disclosure自4.2.18默认text，显式default保留历史配方。可用 Button＋DisclosureIndicator 组合宿主自有折叠状态；它不代替宿主提供aria-expanded/controls。

正式公开组合示例：[text-actions-react](../examples/text-actions-react/app.tsx)。

### 透明导航与警告前景（4.2.17）

NavItem、NavigationItem 和 NavigationMenu/MenuLayout 可选 variant=text：普通/hover/pressed/selected/disabled 始终透明，普通前景继承正文角色，hover/pressed/选中为 action-primary。条目 tone=warning 优先 status-warning-foreground；不使用 warning soft 底，选中短线同警告前景。分支开关与主项保持一致，focus 和禁用前景沿用原规则。省略新选项不改变默认导航。

renderLabel 内把名称放入 NavigationMenu.Label，尾随无动作警告 Icon 独立占位、不收缩并按既有首行偏移对齐；只有名称参与原有 marquee。触屏/减少动态效果保留完整静态名称。配置按钮仍进入 renderAction，颜色不继承 warning；分组和子项不继承父项 tone。业务事实、图标、完整可访问名称由宿主提供，不新增等待业务状态或导航 owner。[正式组合](../examples/navigation-tones-react/app.tsx)同时演示转发 ref/props 的 ContextMenu 链接、独立配置动作和原生 button 渲染的 NavItem。

### 纯图标按钮（4.2.18）

公开IconButton与Button data-icon="true"沿用同一等宽高target及radius-full。4.2.32默认将视觉圆面内收，由button-icon-inset/button-icon-padding维护背景与outline/busy已有边界；size、SVG、点击外沿、危险/disabled/busy事实及render/ref键盘合同保持。具体几何、缩放和覆盖限制只由[DESIGN轮廓合同](DESIGN.md#纯图标按钮的统一轮廓4218)定义。所有variant与工具栏/表格/Card槽共用，不只修Card；表面裁剪只影响背景，不裁glyph或focus。带文字Button和Card头部图标tile不变。升级不新增prop/Controller/业务owner，消费方不写私有CSS或改SVG来缩圆。已有纯图标圆角补丁在升级并实际验收后可移除，本轮不要求消费项目立即升级。4.2.33同时覆盖SearchToolbar/QueryForm的actions与advanced，以及SidebarFooter的直放图标/行内图标；文字按钮布局规则不得覆盖纯图标内距、居中或等宽高；焦点仅改变outline变体已有内收边线颜色，不绘制纯图标焦点环，普通输入和滚动边界的几何政策仍保留。[搜索组合示例](../examples/search-toolbar-react/app.tsx)的`?icon-actions`和[侧栏示例](../examples/sidebar-footer-react/app.tsx)的`?icon-actions&no-reveal`/`?row&collapsed=true&no-reveal`展示这些公开组合。

行内模型/语言等菜单入口使用既有 `Menu.Trigger render={<Button variant="text"/>}`，在Button内容中依次放装饰图标、当前名称和箭头；Menu负责展开、键盘和关闭回焦，Button负责透明与前景。这个已公开组合就是推荐标准，无需新建同义Trigger或竞争Menu组件。需要显式primary/destructive时仍由宿主选择；表单Select/Input不适用。正式消费者 `/react/button-state-contract.html` 的 Inline menu trigger 区域提供可操作示例。

### 统一展开与收起入口（4.2.18）

展开搜索、菜单下拉、折叠标题按相同行为语义呈现，详见[统一映射](DESIGN.md#展开与收起入口的统一呈现4218)。Menu.Trigger未传render时默认Button.text，显式render仍保持原选择；Disclosure默认text，显式default保留历史背景；Accordion.Trigger默认text；SearchToolbar高级条件、侧栏独立收拢/分支、TableExpandButton均透明且仅前景强调。无href导航分支在未显式给variant时默认text，主导航链接选择不变。所有尺寸/字体/命中与状态owner保留，Menu、Disclosure、Accordion等不共享全局展开状态。Accordion草稿遵循宿主原有受控值/Panel keepMounted或卸载策略，不由外观变更偷偷延长生命周期。宿主自有区域直接使用Button.text/IconButton.text并接准确aria-expanded/controls，不新建业务专用菜单或搜索皮肤。成功/警告/危险事实与普通表单Input/Select不适用这条透明规则。

表格/重复行操作统一 `variant="text"`：查看等普通动作使用默认tone，删除显式 `tone="danger"`。两者各状态背景透明；危险前景在hover/pressed/expanded/busy不回品牌色，禁用仍由公共禁用角色接管。IconButton继承ButtonTone，ApiKeyManager与StructuredLogExplorer的内置表格行操作也使用同一text配方；撤销/删除为danger，确认弹窗保留原destructive。权限/确认/防重/行事件留给宿主。不要新增TableAction组件或用私有CSS模拟；显式非text主/危险按钮和普通表单不变。见[透明危险动作](PUBLIC_API.md#透明危险动作4218)。

未传render的裸Menu.Trigger现在采用标准Button默认几何；已有render提供的Button.size、图标、标签和回调不被覆写。不要把这项默认规范化说成所有既有裸HTML触发器的浏览器默认尺寸都相同。

### 紧凑通知排版（4.2.19）

优先Toast.View；高级parts按Icon—Content—Close三个Root直下槽组合，Title/Description/实际Actions进入Content。装饰Icon16px按显式type使用对应语义色，正文保持中性、不造标题，缺省Close为透明圆形32px×触点并与首行顶部对齐。Title统一body-sm 14/22px、500字重，Description为body-xs 13/20px、400字重；12px内距、8px列距、4px文本距都继承Token；仅真实操作增加末行8px间隔，没有动作不留空脚。单项默认约368px可用宽，视口不足自然缩窄；长正文自然增高、Viewport40dvh滚动。容器净宽≤18rem时说明/动作跨全行，≤12rem时首段文字也移到图标/关闭后的下一行；只重排公开槽位，不缩字、不隐藏图标或更改Tab顺序。旧Actions只有Close也自动同行；有动作的旧parts保持顺序，可按公开槽位迁至标准组合。未知type中性、重复通知不自动合并，5秒/-1、暂停、焦点、priority/aria与Controller不变。详见[公共组合](PUBLIC_API.md#紧凑通知部件4219)。


### 手动查询页 QueryForm / QueryField（4.2.20）

公开入口 `@coffeehc/xui-react/search-toolbar`（根入口同样导出）新增 `QueryForm / QueryFormProps`、`QueryField / QueryFieldProps / QueryFieldWidth`；原 SearchToolbar 接口与默认布局保留。排版唯一合同见 [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220)，[完整示例](../examples/query-page-react/app.tsx)复用现有 Resource、MenuLayout、DataTable、DateTimePicker 与 Sheet，无额外 CSS 或查询服务。

QueryForm 是原生 form：`label` 必填并形成可访问名称，`fields`、`actions` 为必填具名 ReactNode 槽；`advanced`、`summary` 可省略。form 的 id/ref/onSubmit/noValidate/aria 属性照常使用，调用方负责 preventDefault、字段校验和唯一查询 owner。actions 的查询 Button 显式 type=submit，Enter 通过原生表单提交；高级按钮为 button。advancedLabel 默认 Advanced options，由宿主翻译。`disclosure` 可提供 `{defaultExpanded}` 或 `{expanded,onExpandedChange}`，也可提供 `{controller: OverlayController}`；不可同时注入 Controller 和另一套展开状态。复用 SearchToolbar 原有 keep-mounted/hidden/inert/回焦行为，不再建第二个 Controller。

QueryField 沿用完整 FieldProps 与错误/帮助/required/控件关联；`width` 仅 primary/compact/standard/full，默认 standard。fields 直接填 QueryField 或 Fragment，每项一个控件；高级区由 FormGrid 管理。不要再用 equal FormGrid、空 label、固定 margin 或私有 CSS 对齐查询动作。summary 只接已提交事实，清草稿不应把旧结果冒充新范围。空 summary/advanced 不绘制对应内容。

`@coffeehc/xui-react/data-table` 的可选 `idleState` 仅替换尚未查询的表体内容；省略保留原 labels.idle。DataTable 的 idle/empty/首次error正文跟随当前表体可视净宽，逻辑sticky在横向滚动与RTL下保持可达；不要求宿主测宽或补定位。`@coffeehc/xui-react/feedback` 的 EmptyState 新增可选 `align=start|center`（默认start）和装饰 `icon`，不会生成请求或填造标题。DataTable/CardGroup 未确认任何数据时不调用 count/宣称0条；已确认空结果、保留值刷新及失败仍显示真实计数。仅未确认阶段的计数播报/页脚几何有意变化；宿主仍负责只传真实分页事实。

最小组合（业务校验与请求处理由 onSubmit 所属 owner 提供）：

~~~tsx
<QueryForm label="消息查询条件" onSubmit={submit}
  fields={<><QueryField label="Agent ID" width="primary" required><Input value={agent} onChange={changeAgent}/></QueryField><QueryField label="消息状态" width="compact"><SimpleSelect value={status} onChange={changeStatus}>{statusOptions}</SimpleSelect></QueryField></>}
  actions={<Button type="submit" disabled={busy}>查询消息</Button>}
  advancedLabel="按日期筛选" advanced={dateFields} summary={appliedRange}/>
<DataTable label="消息查询结果" rows={rows} columns={columns} rowKey={rowKey}
  status={statusFact} hasValue={hasValue}
  idleState={<EmptyState align="center" title="输入 Agent ID 开始查询"/>}
  emptyState={<EmptyState align="center" title="没有匹配的消息"/>}/>
~~~

正式 style.css 已包含查询布局。按需 CSS 须有 tokens/base/button/forms/feedback/navigation/layout/search-toolbar，以及实际 Select/DateTime/Table 使用的样式；不需要宿主复制内部 DOM。没有 runtime/native UI 版本；沿用 TS Resource/Overlay Controller。

### 无图标紧凑导航

NavigationMenu 未提供 item.icon 时，展开态继续使用完整名称，紧凑态显示真实名称缩写，替代原来的统一三横线。中文取前两个完整grapheme；英文多词取前两词首字母，单词取前两字符；首个emoji完整保留。缩写 aria-hidden，完整 label/title 与已有紧凑 hover/focus 临时揭示保持，selected/warning/disabled前景继承所属行，不新增彩色徽章或动作。相同前缀不生成编号或猜业务图标；需要消歧时使用已有显式 icon/resolveIcon。空白异常回退中性点，正常项目仍须有真实名称；语言改变时按当前名称重新投影，无新增请求/路由/Controller。

## 公共图表


正式入口为 @coffeehc/xui-react/chart，包含 LineChart、BarChart、PieChart；根入口同步导出，类型/纯计算在 @coffeehc/xui-runtime/chart。样式用正式 style.css，或 critical.css + chart.css（critical不含图表配方）。D3是内部精确版本依赖，不增加图表库 peer，React/ReactDOM/Base UI沿用宿主单实例。

4.2.41 计算内核按模块使用 d3-array 3.2.4（范围、刻度、求和）、d3-scale 4.0.2（线性/分类坐标与柱宽）和 d3-shape 3.2.0（折线、点形、饼与扇区）。只引入这些计算模块，未引入d3整包、DOM selection/axis/transition或fetch；React继续拥有SVG节点、事件、焦点及卸载。现有React props、runtime返回类型、Token和slot不变，消费者不传D3对象、不安装D3 peer、不复制路径。同步ESM由宿主bundler按使用裁剪，使用/chart的包图包含D3，Button和窄服务入口不包含D3；不是运行时加载CDN脚本。刻度采用D3 nice/ticks，具体间隔可能变化，零基线与有限极值合同保留。横轴仍为等距类别，不根据label解析时间或单位；未新增时间轴/缩放/堆叠能力。

共同 props：title 必填；headingLevel/description/actions/footerMeta/footerActions/className/id复用Card；status为idle/loading/ready/refreshing/error，缺省ready；error为宿主批准的安全文字，onRetry只发重试意图；labels覆盖全部内置文字，formatValue只格式化显示。数据全受控，不提供loader、URL、周期、聚合或业务时区选项。就近读值与数据表开合仅是View内临时交互，不建立查询Controller；宿主已有Resource继续拥有请求/取消/迟到/刷新。

LineChartProps新增可选 `curve?: LineChartCurve`，React `/chart` 与根入口导出 `LineChartCurve = 'linear' | 'monotone' | 'step'`。默认linear保持直线；monotone对应D3 curveMonotoneX，横坐标按类别递增，平滑穿过真实采样点且相邻点之间不产生额外极值；step对应curveStep，在相邻横坐标中点跳变，不代表业务状态发生时刻。配置作用于同图所有系列，只改变连线路径，不改变原始值、采样点、轴、图例、颜色、键盘读值、数据表或请求。三种模式均在null处结束当前段；单独采样点仍保留点形，全缺失仍为空态。JS无效配置明确拒绝，不静默替换；BarChart/PieChart没有此配置。不接受D3工厂或任意字符串，内部D3类型不暴露。

三类图共用 `animation?: boolean`，缺省true，false立即呈现；不向Card/DOM透传。所有图表的首次进入和数据更新统一使用 `--motion-duration-chart`（默认900ms），全部复用 `--motion-easing`，不另开时长/速度API。首次有效测量后，折线与曲线沿真实路径长度从起点绘制到终点，采样点在路径到达时显示；null分开的连续段按顺序绘制，空隙不产生连接线。原有实/虚/点线编码保持；单个孤立点没有可绘制线段，按所属位置显示。柱从真实0基线生长、饼顺时针展开；单正项保持circle并短暂放大半径。数据更新只过渡屏幕坐标/扇区边界，不把动画中间值当采样；图例、就近读值、百分比和数据表立即使用最新确认原值。指针/键盘开始读值时立即完成当前动画，让标记与读值一致。

更新以稳定ID、顺序、缺失掩码、曲线、坐标范围与测量尺寸一致为前提；连续更新从当前显示位置接续，取消旧时钟。类别/系列/正扇区增删或重排、null位置变化、曲线/范围/尺寸变化直接呈现新图，避免索引串行、跨缺失连线或轴与图形错配。仅status/语言/主题变化及同值刷新不重播；同范围loading/error保图，完成后相同数据不从0开始。新范围由宿主清空数据后再展示，视为首次。减少动态效果、显式false、0时长、不支持浏览器计时或后台文档立即呈现；运行中切换减少动态效果/进入后台取消动画，恢复后不补播，SVG卸载释放帧与监听。动画只改变图形属性，不改变绘图区/反馈槽尺寸，不重挂节点，不新增查询/Controller。SSR不访问DOM。

折线/柱图传 categories: {id,label}[] 与 series: {id,label,values,color?}[]，每系列values必须与类别等长，元素是有限number或null（缺采样）。类别和系列各自ID唯一且非空，名称非空，缺项/undefined/NaN/Infinity被拒绝，不猜0。柱图为分组柱而非堆叠，零基线固定；折线缺省直线连接有效相邻采样，三种curve均在null处断开。饼图传 slices: {id,label,value,color?}[]，有限非负值，零项保留在图例/数据表而不绘制扇区，全零为空态，单一正项是圆；比例计算先归一化避免有限极值相加溢出，不虚构总计。color为可选1～6公开分类槽；稳定ID保留节点与读值归属，显式color可在重排时保色，缺省按输入顺序循环。

所有槽位、文字、状态与几何见[唯一设计合同](DESIGN.md#公共图表布局与状态合同4221)。头部只有公共标题与宿主真实动作；内容为图例/绘图区/就近读值/反馈；footerMeta/footerActions仍由宿主提供；默认查看数据动作在actions内，按需展开同一正式DataTable，不再嵌套私有表格皮肤。

绘图区无viewBox缩字；轴与长类别文字继承caption，图例/读值继承body-xs，窄屏保轨宽在本图内部横滚。每图一个图形键盘入口，左右/上下/Home/End/Escape查看值，Tab离开；鼠标/触屏读值不导航或提交。查看数据是完整等价入口，含null的缺失标签与零项；图中颜色不是唯一的读值通路。刷新时宿主保留同范围data，组件保留图形、焦点与滚动；更新后由稳定ID定位当前值，移除所选ID后清除读值，不播报过期记录；键盘指引保留在图形可访问名称。

最小消费（所有数据都由宿主准备）：

```tsx
import {LineChart, BarChart, PieChart} from '@coffeehc/xui-react/chart';
const categories = [{id:'a',label:'甲'}, {id:'b',label:'乙'}];
const series = [{id:'tasks',label:'任务',color:1 as const,values:[12,null]}];
<LineChart title="任务趋势" categories={categories} series={series} />;
<BarChart title="净变化" categories={categories} series={[{id:'delta',label:'净变化',values:[12,-3]}]} />;
<PieChart title="任务分布" slices={[{id:'r',label:'研究',value:12},{id:'v',label:'复核',value:3}]} />;
```

完整正式包示例：[charts-react](../examples/charts-react/app.tsx)。其Resource和内存延迟数据只演示正常/空/全零/缺失/单项/刷新失败/范围变化，不代表任何消费项目或后端验收。统一demo的[图表面板](../examples/components-react/charts.tsx)独立按需加载；动画区分别保留折线图（linear）和曲线图（monotone）入口，两者复用LineChart与同一组带缺失的数据，不新增CurveChart公开组件。普通趋势组同时展示折线与曲线。顶部动效示例统一采用默认900ms，动画开关控制本面板全部图表；折线、曲线、柱和饼按类型切换展示。“重播首次绘制”只重新挂载所选demo图形，模拟首次，不绑定刷新或请求；“更新同一组数据”保持实例并接续到新值。另有同一组数据并排对比linear/monotone/step，含null断线；另含常用组合、缺采样、正负/零柱、单项/零项饼和状态对照；表单、面包屑与走马灯面板不请求该图表模块。面板代码加载使用同一公共加载/错误反馈，不改变图表的数据状态或请求owner。

## StructuredLogExplorer 查询与槽位（4.2.22）

正式 `/structured-log` 的 `StructuredLogExplorerProps` 与导出的 `StructuredLogExplorerSlots` 保留headerActions/className/writeClipboard，新增可选pageToolbar。它追加在原分组/全量切换与组内返回的工具区，位于QueryForm之前；空槽无占位，不替换内置筛选，不创建请求或路由owner。复制反馈默认用组件 Toast，可选 toastController 接宿主既有队列；不重复挂同队列的 View。内置查询槽对应[唯一设计矩阵](DESIGN.md#手动查询页布局与状态合同4220)，不要求宿主复制QueryForm或穿透DOM。

原ViewController.draft拥有编辑值，service.filter拥有提交范围；QueryForm复用原filters OverlayController，primary摘要与compact等级常显，其余条件进入advanced的FormGrid。收起不丢草稿，外部受控关闭从高级字段回焦唯一触发器。summary只显示service.filter与校验反馈，不把草稿冒充已展示结果的范围。

| 动作 | 对草稿/已提交范围的影响 | 请求与结果 |
| --- | --- | --- |
| 应用筛选 / Enter | 提交当前ViewController.draft，校验仍归service | 有效时同一service.setFilter；首段cursor=null，新范围清旧数据并隔离迟到；无效时不请求 |
| 重置草稿 / native form.reset | preventDefault后setDraft(service.getState().filter)，恢复最近提交条件 | 零请求；不取消在途读取，不改service状态、结果/游标/快照/错误或高级展开 |
| 清除筛选（清除已生效条件） | service.setFilter({})，由原service订阅同步草稿 | 显式提交空范围并请求一次当前视图首段；保留groups/records/groupId与既有取消/代次，不是草稿reset |
| 刷新快照 | 使用当前service.filter，未提交draft保留 | 原refresh动作；同范围保结果，不自动提交草稿 |

options.labels新增可翻译resetDraft（默认Reset draft）、appliedFilters（默认Applied filters）；旧的手写Controller.labels可省略这两个新字段，View使用相同英文默认；既有clear保留默认Clear filters及宿主覆盖，中文示例保留“清除筛选”并明确此动作为查询。Controller类型、factory、HTTP/DTO/认证、可选records、snapshot/游标/详情清理行为保持。React时间Input保留原RFC3339Nano字符串，未换成分钟型DateTimePicker或做时区转换。

完整正式包示例为[log-react](../examples/log-react/app.tsx)：默认借用原service；`?injected&slots`展示完整ViewController与pageToolbar，使用同一service和高级Overlay。`?network&grouped`仅供浏览器拦截测试真实POST wire，没有后端或基础设施；默认仍为注入内存transport的合成观察，不代表产品联调。

## CardGroup滚动传递与登录读取恢复（4.2.30）

CardGroup的natural/document跟随真实外层滚动owner；body没有纵向范围时，真实wheel继续交给Document/祖先，不被通用ScrollArea的contain截住。workspace有范围时先滚body，沿既有auto边界传递；短宿主仍保留原集合/正文滚动合同，不新增观察器或第二滚动owner。纯布局修复须用真实wheel验证，不能只看overflow属性或程序设scrollTop。

ConfigurableLoginPage对auth.refresh或auth.session的network/timeout/HTTP 5xx读取失败提供现有checkSession标签的检查动作，且必须非busy、未认证。用户明确触发后由原LoginViewController调用同一AuthClient.currentUser；没有自动retry、login/logout重放或新Auth owner。未知退出仍以auth.logout及既有禁恢复语义处理，不提供这种读恢复入口；403/401不是此重试按钮的条件。可恢复读取的unknown不当作anonymous或authenticated。

## 业务日志列定义与查询 slot（4.2.34）

React `/business-log` 的 `BusinessLogExplorer.list?: BusinessLogExplorerListPresentation`统一使用列定义。`columns`每项为`{id, header, width?, resize?, overflow?, cell?}`；id是稳定列标识，也是默认字段名，非空且唯一；header由宿主提供当前语言。没有指定columns时仍显示公共七列，公共默认列用同一cell路径呈现操作者、结果和对象；一旦指定columns，顺序与数量完全由配置决定，不自动追加detail。

**只有两条渲染规则**：不指定cell（或null）时读取原值；指定`cell(context)`时完全使用其React返回值，包括null/undefined留空。无全局defaultCell、无formatActor/formatAction/formatOccurredAt。原值先读事件自身`event[id]`，没有该字段才读显式`event.attributes[id]`，不猜别名、不走点路径、不解析显示文本、不读取payload。0/false显示为0/false，null/undefined为空；对象/数组默认是安全JSON文本。原ISO/状态码不自动格式化或翻译，需要时在对应cell明确处理。`detail`是公共动作列，缺省cell提供原详情Button，宿主可用`context.content`保留这个动作；覆盖或省略它时，宿主需保留必要事实的可达入口。

`BusinessLogExplorerCellContext`包含只读`rowId / columnId / event / value / text / content`。event是Controller当前页中对应的不可变原事件，value是该列原值，text为上述默认文本，content为公共默认呈现（detail为原按钮）。回调可以返回Badge、Button、链接、勾选等任意React内容；授权、确认、复制、导航和业务提交仍归宿主，不增加专用session/owner/copy列API。不得在渲染过程中请求/写入/修改事件；错误交宿主render boundary，不伪装成读取错误或触发重试。稳定列ID和行ID保留节点；回调组件自身的key/type由宿主保持。

`BusinessLogListColumn`、`BusinessLogCellContext`及`BusinessLogListPresentation`由runtime与React `/business-log`、根入口导出，React另导出带ReactNode回调的`BusinessLogExplorerColumn / BusinessLogExplorerCellContext / BusinessLogExplorerListPresentation`。纯helper `getBusinessLogTable(state, labels, list?)`返回`columns / columnIds / headers / rows`，每行`{id,event,values}`，values与全部列一一同序，包含detail的undefined原值；它不执行React cell。列宽复用DataTable的公开长度合同；`overflow="ellipsis"`必须显式width，公共OverflowText在hover/已有动作focus下揭示全文，reduced-motion与触屏自然换行。自定义Button/链接可组合公开OverflowText，不添加私有CSS、title补丁或额外tabindex。字体、颜色、焦点和横滚继承公共表格。

`BusinessLogEvent.attributes?: Readonly<Record<string,JSONValue>>`是可选、显式、宿主审核过的列表投影。parser只接纳这一个扩展对象并深冻结，沿用JSON payload的64KiB/深度16/4096节点边界；拒绝getter、自定义原型、循环和非JSON。未知顶层字段继续丢弃，不自动披露payload。属性不得覆盖原事件字段或冒充actor/ID/原始时间。领域loader负责确认字段真实性/权限/脱敏；列表和详情可携带相同投影。HTTP与Controller、排序/分页/快照合同不变，默认适配器不会自动把任意领域DTO变为该合同。

```tsx
import {BusinessLogExplorer, type BusinessLogExplorerListPresentation} from '@coffeehc/xui-react/business-log';
import {Badge} from '@coffeehc/xui-react/feedback';
import {QueryField} from '@coffeehc/xui-react/search-toolbar';
const list: BusinessLogExplorerListPresentation = {columns: [
  {id: 'owner_name', header: t('owner'), width: '10rem'}, // attributes.owner_name原值
  {id: 'occurred_at', header: t('time'), cell: ({value}) => timestamp.format(new Date(String(value)))},
  {id: 'summary', header: t('summary')}, // event.summary原值
  {id: 'result', header: t('result'), cell: ({event}) => <Badge>{t(event.result)}</Badge>},
  {id: 'detail', header: t('detail')},
]};
<BusinessLogExplorer controller={logs} labels={labels} list={list}
  queryFields={<QueryField label={t('resource')} width="standard">{resourceSelect}</QueryField>}
  querySummary={confirmedResourceSummary} headerActions={pageActions} />;
```

queryFields只接直接QueryField子项（可含Fragment），放额外查询字段；querySummary只呈现已确认的额外范围/持续反馈；headerActions放语言等页面动作。公共事件类型/结果在QueryForm主字段，高级原字段在原Disclosure/FormGrid，应用、清除属于QueryForm.actions；刷新/取消读取保留原PageHeader位置，采用次要outline动作，不争抢查询主按钮。原“清除筛选”仍提交空公共filter并请求首段，不是重置未提交草稿，也不会擅自清除宿主queryFields的独立scope。仅list/labels/slot内容更新零请求、零取消，不清草稿、详情、页和快照。自定义列header与cell内文案由宿主随语言重新提供，不由labels猜测。

额外资源scope由宿主的稳定loader持有，不是新查询owner。同范围refresh保行；**跨scope**先更新loader读取的scope，再在同一Controller调用`setFilter(controller.getState().filter)`，立即清空旧数据/详情/已访问页与快照、取消旧读取并查新scope首段；旧代迟到结果不接管新页面。不用key=resource/locale重挂载，也不把新options当动态loader更新。额外scope的“清空”由宿主显式接线，与清除公共filter区别记录。

4.2.34明确移除旧字符串columns和format*，不维护兼容分支：`'summary'`迁移为`{id:'summary',header:labels.summary}`；`occurredAt`迁移为真实字段`occurred_at`；formatActor迁到actor列cell（从context.event.actor读），formatAction/formatOccurredAt迁到对应列cell（从context.value读）。helper的rows.cells迁到rows.values，不再是旧格式化字符串；custom列需要详情时显式配置detail。未使用list配置的完整页无需调整。版本按项目政策只递增末位，不代表这一展示API兼容。

正式[示例](../examples/business-log-react/app.tsx)：`?activity`为五列，`&locale=en-GB`/`&time-zone=Asia/Shanghai`由宿主选择时间格式；`?cells&labels`展示原值用户、结构化会话复制Button、Badge、固定列宽、QueryField资源scope和Toast。无会话为空；复制读取真实结构化ID，不导航、不筛选。合成loader只用于公共组合验收。执行BIZ-LIST-001～008及实际命中的BIZ-LABEL/STATE-COPY，不重跑无关完整接入。

## 业务日志整页标签热更新（4.2.29）

`BusinessLogExplorer.labels?: Partial<BusinessLogLabels>`是实时展示输入，借用`controller`、注入`viewController`及默认`options`三种模式均支持。宿主语言owner传入当前词典，不增加全局语言服务、Controller或查询owner。React `/business-log`及根入口公开`BusinessLogLabels`类型；runtime `/business-log`及根入口公开纯函数`resolveBusinessLogLabels(overrides?, base?)`和`BusinessLogFeedbackKey`。

逐字段优先级为：当前React `labels` → 当前默认模式`options.labels`（借用/注入模式为原`controller.labels`）→ 公共英文默认。默认模式的`options.labels`随render生效，其余服务初始化项仍只用首次配置。每次覆盖替换上一份覆盖，不累积旧语言字段；undefined回退、空字符串保留，非字符串拒绝。移除React labels恢复当前基底；移除options.labels恢复公共默认，不回到构造时旧语言。纯resolver返回新的冻结词典，不修改输入或Controller。

```tsx
import {BusinessLogExplorer, type BusinessLogLabels} from '@coffeehc/xui-react/business-log';
const labels: Partial<BusinessLogLabels> = translations[locale];
// logs在语言变化前后保持同一个实例；也可使用viewController或options模式。
<BusinessLogExplorer controller={logs} labels={labels} list={activityList} />;
```

整页标题/筛选字段/枚举/表头/结果/读取反馈/分页/快照前缀/详情标签/按钮及可访问名称同步更新，包括已显示的错误和仍在途的读取。原`controller.labels/options`和旧state.error/detailError字符串保留构造时合同；默认Controller新增可选errorKey/detailErrorKey，取值readError/contractError/forbidden/notFound或null，清除反馈时原子清空。filterError新增可选filterErrorKey=invalidFilter或null，同样在清除时原子清空。React按各自语义键取当前词典。手写旧Controller未提供对应键时继续显示其原安全错误字符串；要热翻译这类自定义错误，由该Controller提供对应公开语义键，不能按旧文字猜类别。

换语言不发布service/view状态、不执行请求/重试/取消，不重置已生效筛选、草稿、开合、当前详情、分页、快照和已访问页缓存。原事件摘要/payload/代码/ISO、领域renderer及headerActions内容由宿主负责，词典不改写这些事实；列表时间格式仍走对应列的cell。表格行/列、表单字段和详情动作使用稳定语义键，切换后保留节点、选区、滚动和有效焦点，不同译文重排时允许原生滚动锚点调整，不人为归零或重建滚动区。关闭详情回原按钮。详情动作按内容优先，超长译文按表格自身可视净宽换行，不能压成逐字竖排，保留公共间距和滚动清距；不裁切文字或要求宿主限字/CSS覆盖。禁止key=locale、重挂载或复制公共DOM/CSS。

[既有正式示例](../examples/business-log-react/app.tsx)的`?labels&activity`展示中文/English按钮；`&owner=view`注入完整ViewController，`&owner=options`演示默认模式（先点刷新）；不传owner借用service。示例使用合成loader，无业务后端。定向验收只执行[BIZ-LABEL-001～006](ADOPTION_CHECKLIST.md#业务日志整页语言逐项检查)及实际受影响项，不因语言变化重跑认证或写入流程。

## API Key 列与复制（4.2.41）

ApiKeyManager 的 `prefix` 为独立列；名称仅显示名称，密钥列显示可辨识片段及掩码。可选 `locale/timeZone` 控制紧凑时间，时间弹层保留原始 ISO 值。`rowActions(record)` 只补充行内动作，不持有秘密或权限 owner。

默认省略 `keyCopy`（或传 `false`）只展示文本。传 `{readValue(record,{signal}),canCopy?,unavailableLabel?,labels?}` 启用密钥单元格的按钮语义，支持点击、Enter、Space。readValue 必须返回完整凭据，复用宿主已有授权读取 owner；公共库不增加读取 URL、不从 prefix/掩码还原凭据。不可恢复的哈希记录由 canCopy 禁用，不能将掩码当完整值。读取及写剪贴板期间禁重复，卸载、切换 Controller/记录/配置和 busy 变化取消等待；版本/状态变化丢弃迟到结果。明文仅在读取与剪贴板调用作用域，不进入 React state、列表元数据、URL、storage、日志或反馈。仅以安全 Toast 展示结果。注入 `toastController` 时由宿主渲染同一 Toast.View；省略时组件持有默认 Provider/View。

上述接口自 4.2.41 正式提供；真实后端是否可再次读取必须由业务合同确认。示例 [统一 Demo](../examples/pages-react/app.tsx) 只使用合成凭据。

4.2.42的默认adapter曾缺少官方读取连接；4.2.43已按BaseService正式v3补齐。显式`createApiKeyHttpAdapter({http,schemaVersion:3})`后直接传`keyCopy={adapter.keyCopy ?? false}`，不复制reader/DTO解析。默认v2和省略keyCopy仍被动展示；UI/API/认证owner保持同一个。能力、ID/版本绑定和无认证恢复规则见[授权读取合同](PUBLIC_API.md#api-key-授权读取v34243)。官方`/api-key-react/?official` mock另展示无权/哈希禁用，以及disabled/expired/revoked的授权管理读取；后者不代表凭据仍可认证。临时结果走Toast，权限变化即使未改版本也取消等待。

## 默认完整页面与配套接线（4.2.23）

四类业务启用且没有已确认特殊要求时，直接挂载现有完整页。品牌、文案、Logo、路由和公开扩展不要求复制页面；[默认选择规则](DESIGN.md#四类默认公共页面4223)由DESIGN定义。

| 页面 | 公共React入口 | 默认接线及保留的owner |
| --- | --- | --- |
| 管理员初始化 | `/admin-setup` AdminSetupPage；连续检查外壳用AuthPage + AdminSetupForm | 后端权威state/onCheck/onSubmit；当前没有统一初始化HTTP入口，不能猜URL或自动创建管理员 |
| 用户登录 | `/login` ConfigurableLoginPage | bootstrap注册的同一AuthService/ThemeService；固定authenticationservice/webfacade合同 |
| 业务日志查询与详情 | `/business-log` BusinessLogExplorer | 同一HttpService上的createBusinessLogHttpLoader，再接既有BusinessLogController/ViewController；只读查询，权限和脱敏归后端 |
| 平台API Key管理 | `/api-key` ApiKeyManager | 同一HttpService上的createApiKeyHttpAdapter；getConfiguration读取服务权限/期限，再创建一个所属Controller，不从JSON猜权限 |

`@coffeehc/xui-runtime/config`（根入口同步）新增`DefaultPagesConfig`与纯函数`resolveDefaultPages(overrides?)`。可传bootstrap返回的config或部分JSON覆盖；沿用resolveConfig的校验、深合并、数组替换、不可变快照。旧配置缺省pages时补入同一config.json默认值，旧手写XuiConfig可省略该字段。函数不读取Window、不创建服务/Controller、不注册路由/菜单、不启动IO；SSR按请求传自身配置。

| config.json位置 | 默认与含义 | 投影结果 |
| --- | --- | --- |
| pages.login | path=/login，title=Sign in，空description，layout=card | login.path及login.config（LoginPageConfig兼容） |
| pages.adminSetup | path=/setup，title=Set up administrator，空description，layout=card | adminSetup.path及adminSetup.config（AuthPageConfig兼容） |
| pages.businessLog | path=/business-logs，title=Business logs，pageSize=25（1～200） | businessLog.path及options.pageSize/labels.title |
| pages.apiKeys | path=/api-keys，title=API keys，pageSize=10，pageSizeOptions=[10,25,50] | apiKeys.path、labels.title与pagination；本地完整集合分页 |

path是相对router.basePath的绝对URI路径，不接受hash、query、外站、转义/穿越或四页重复路径。认证页品牌继承app.name/logo，description空值省略，login.fallbackReturnTo继承router.basePath。Key pageSize/选项为正安全整数且选项必须包含初始值；不会改变HTTP adapter的服务端分页。其它字段文案仍用各组件现有labels扩展和项目语言owner，函数不新增i18n副本。pages不能设置端点、凭据、权限、服务启用或初始化状态；真实业务能力/权限不足时不挂载，不把配置当授权。

最小接线（宿主已按既有生命周期管理state、signals与Controller）：

```tsx
const pages = resolveDefaultPages(ConfigService.getConfig());
// 路由由宿主注册到pages.*.path；品牌/标题来自同一配置，额外内容使用各页真实公开slot。
<ConfigurableLoginPage auth={AuthService} theme={ThemeService} config={pages.login.config} />;
<AdminSetupPage config={pages.adminSetup.config} state={setupState} onCheck={checkSetup} onSubmit={submitSetup} />;

const loader = createBusinessLogHttpLoader({http: HttpService});
const logs = createBusinessLogController({...pages.businessLog.options, loader});
<BusinessLogExplorer controller={logs} />;

const adapter = createApiKeyHttpAdapter({http: HttpService, idEncoding: ConfigService.getConfig().auth.idEncoding});
const capabilities = await adapter.getConfiguration({signal});
const keys = createApiKeyManagerController({...capabilities, adapter, labels: pages.apiKeys.labels});
<ApiKeyManager controller={keys} pagination={pages.apiKeys.pagination} />;
```

上述创建仅在原装配/作用域执行一次，不放入每次render，不并存第二个service/ViewController；借用Controller时初始读取仍由宿主显式执行，卸载和身份切换按原合同清理。官方端点/method/DTO/认证/错误由[服务前置表](PUBLIC_API.md#默认适配器的服务前置)定义，不在pages开放第二套配置。现有特殊SSO/领域协议先保留其真实owner与AuthPage等公开布局，记录默认完整页不匹配的合同，不能为外观升级改协议。

正式包示例沿用四个现有页面的`?defaults`模式：[登录](../examples/login-react/app.tsx)、[初始化](../examples/admin-setup-react/app.tsx)、[业务日志](../examples/business-log-react/app.tsx)、[Key](../examples/api-key-react/app.tsx)。它们消费bootstrap配置投影和原单一Controller，仅使用合成transport/回调，不代表真实BaseService部署。接入步骤见[默认页面专项](../.agents/skills/adopt-xui/references/default-pages.md)，初始化缺口提示词见[维护清单](PUBLIC_REQUESTS.md#baseservice-管理员初始化合同提示词)。


## 内部数据表格与列宽（4.2.36）

BusinessLogExplorer、StructuredLogExplorer、ApiKeyManager 及 LineChart/BarChart/PieChart 的数据视图统一使用公共 DataTable。四类组合新增可选 `columnSizing?: DataTableColumnSizingProps`，默认 `{}` 启用本地调整；受控 `widths/onWidthsChange` 或注入 `controller` 沿用[交互列宽调整](#交互列宽调整)合同。通用 DataTable 自身仍须显式传入该对象。各组合的请求、筛选、分页、详情与权限由原 Controller/宿主负责；调宽和刷新不重建已有行，也不创建查询。域分页置于同一 DataTable.footer，不再包第二个表体/状态区域。

BusinessLogExplorer 的 `list.columns[].resize` 复用 `DataTableColumnResizeOptions | false`，可给业务列定义可访问名称、上下限或明确禁用。内置 `detail` 列始终固定；即使 JavaScript 输入提供调整配置，也不产生手柄。`width` 与 `overflow`、完整 `cell` 回调语义继续有效。

StructuredLogExplorer 另公开 `StructuredLogExplorerColumnId` 及 `columnOptions`。两种视图共用 `summary/severity/source/actions`；分组另有 `entry_count/matched_entry_count/last_seen_at`，记录另有 `occurred_at/retryable/user_fixable`。业务列按 id 可给 `width/resize`；`actions` 只接受 `width` 和 `resize:false`。切换视图沿同一个 sizing owner 按语义 id 保留宽度，不将分组计数错配为记录时间。

ApiKeyManager 的内置 actions 与两类日志的内置详情/操作列均不显示手柄，其他列默认可调；Chart 数据视图全部数据列可调。操作列初始采用公共 field-min 轨道，调整其他列后保留其实际宽度。记录内容在单元内换行，长内容仍使用原有 OverflowText/公开 overflow 规则。库不显示“重置列宽”按钮，原 Controller.reset() 编程接口保持可用。

`DataTableColumn<T>.cellClassName?: string` 将现有语义排版角色放在 td 上，不改变 cell 返回内容、事件或业务 owner。DataTable 行向内部 OverflowText 提供已有交互面；焦点不增加额外 Tab 停靠，调宽或刷新后已聚焦动作保持可见。


## 图标背景基础模型（4.2.37）

图形与背景容器分开，统一形状由基础 CSS 维护。`IconShape = 'circle' | 'square'` 从 React `/display` 及根入口导出；圆形为缺省，square 显式使用 radius-md 方形圆角。glyph路径/描边、颜色、焦点和事件owner不变。默认背景直径统一为icon-container-size，根16px时32px、根200%时64px；显式size才保留尺寸级别。

| 入口 | 公开选项 | 默认与边界 |
| --- | --- | --- |
| Icon | `variant?: 'plain' | 'tile'`、`shape?: IconShape` | plain 默认无背景且沿用 glyph 尺寸；tile 使用 icon-container-size/background，默认圆形，glyph 仍是 control-icon-size |
| Card、CardGroup 模板 | `iconShape?: IconShape` | 默认 tile 背景圆形，所有资源卡片继承；iconVariant=plain 继续不添加背景，嵌入 Avatar 或图像拥有自己的形状 |
| IconButton、Button data-icon=true | `shape?: IconShape` | 默认圆面与Card相同，button-icon-inset从默认命中区与基础直径派生；36px命中区、字形和状态保留；显式size有意改变级别，普通文字Button不应用该形状 |
| Avatar.Root | `shape?: IconShape` | 默认圆形且直径使用基础尺寸；显式sm/lg继续已有尺寸；square选择方形圆角；Image/Fallback加载、裁切、ref、render和状态不变 |
| InputGroup.Button | `data-icon="true"`、`shape?: IconShape` | 只有明确的图标动作采用基础形状；密码显隐、搜索清除、数字步进已接入，命中宽度至少为基础直径，文字动作保留；内部背景层居中且使用统一基础直径 |
| 原生/parts 容器 | `className="xui-icon-container"`、`data-icon-shape="square"` | 类只选择默认圆形，不添加底色/大小或交互；现有图标槽、紧凑导航和 data-icon=true 动作统一由同一基础规则处理 |

Menu.Icon、Toast.Icon、EmptyState.icon、SidebarFooter.icon 的被动包装复用基础容器标记；Tabs.Icon 本身沿用 Icon。未加背景的菜单/标签/通知图形不自动加底色。普通完整导航行、品牌图片和图表序列形状保留本身用途，不按 SVG 外观猜测为图标按钮。

基础Token icon-container-size默认依赖control-height-sm，icon-container-background默认依赖muted；nav-icon-background-inset从导航目标与基础尺寸派生；icon-paint-z-index默认-1且只作用于内部隔离绘制层。现有 card-icon-size/card-icon-background 改为尺寸和背景 Token 的兼容别名，卡片专用覆盖继续优先，原 card-icon-offset/标题对齐和自然高度保留。按需 CSS 的 base.css/critical.css、完整 style.css 共享同一规则；使用 Avatar/widgets 或 Button 分片时仍按原方式加载基础 CSS。该模型不新增 runtime Service、动画或查询状态。

## 公共模型配置

组件目录的 [README](../packages/ui-react/model-profile/README.md) 随 React 安装包交付，说明 HTTP API、候选合并、秘密与 Controller 处理流程；这里维护 layout/slot 合同。

`ModelProfileForm` 是完整表单；`ModelProfileEditor` 在同一实现外组合公共 Sheet。Provider 固定六项与 agentCore 一致，可用子集和默认值来自 editor API。新增/修改共用表单和 Controller；`load(null)` 明确新增，`load(id)` 切换对象，`load()` 重新读取当前对象，均丢弃草稿。同范围目录刷新保留旧目录，连接/协议/凭据变化取消旧请求并清旧目录；真实模型名始终允许手工输入。组件不定义完整模型管理列表、默认模型选择或业务引用 owner。

| 区域 | 默认内容/正式扩展 | 状态与排版 |
| --- | --- | --- |
| identity | 模型名称、Provider、真实模型 | FormGrid 两列；真实模型跨列，目录按钮同行/窄屏换行 |
| connection | Base URL、单一API Key输入框；slots.afterConnection | 净宽允许时两列同行，不足时单列；密钥明文只在原生控件和提交作用域 |
| settings | 首字超时、并发 | 单位/特殊值就近标明；流式行为沿用后端配置，不提供表单开关 |
| capabilities/policy | 聊天能力、常用策略 | 紧凑公共Checkbox；向量不显示聊天字段/策略 |
| advanced | Headers JSON默认`{}`、策略JSON；slots.advanced | 直接编辑，无Headers处理选择器；Disclosure按需披露，长编辑器跨列 |
| embedding | 测试文本、可选维度 | 单次Embed请求参数，不保存成Profile策略 |
| result | 安全测试摘要/耗时/向量数量与维度；slots.result | 真实结果、不虚构token/价格，原始异常禁止带入 |
| actions | 重置、测试、保存；slots.actions | FormActions主次动作；成功Toast，不挤动页面 |

4.2.42 的 policy 区域直接显示当前具体值，缺失上下文显示“未配置，请填写”，输出和推理强度缺省显示“未指定”；明确的 `none` 单独显示。缺值不从通用defaults回填。宿主在原Controller配置 `requiredPolicyFields`，Field同步必填星号、错误关联及焦点，规则热更新保留草稿/Controller且零请求；默认不强制其他项目的业务规则，详见[随包合同](../packages/ui-react/model-profile/README.md#策略值未指定与宿主必填规则4242)。

4.2.44失败测试自动展开result并展示后端正式、已脱敏的summary，Toast显示同一具体原因；空白摘要回退，成功Toast仍本地化。版本冲突使用新的可选labels和errorReason，与网络/超时/取消区分；保留原草稿和凭据编辑事实，只有用户明确点击Toast的重新读取动作或宿主调用load才丢弃。临时反馈不添加页面块，不重复Toast/重试。HTTP502的原始message不直接显示；详细安全/locale与保存未知边界见[错误反馈合同](../packages/ui-react/model-profile/README.md#模型错误反馈4244)。

`labels` 是实时文字投影，变化不重建Controller/请求/草稿。`options` 与注入 `controller` 互斥；默认模型通过现有生命周期桥清理，注入模型不销毁。视图实际退出清除秘密及本次私有编辑状态，身份切换必须立即调用 `clear()` 或卸载旧作用域。禁用/只读不允许业务动作，取消保留可达。调用方可注入现有 toastController，默认自建局部通知。

API Key和Headers明文不进入快照。API Key未配置时为空，已配置时显示固定六星号`******`，提交同一标记由后端按已授权的profile_id解析原密钥；空字符串清除，其他值替换。该标记为保留值；新增或原记录无密钥时必须拒绝，后端还原后才能交给AgentCore，不得将标记传给AgentCore或上游。Headers JSON默认显示`{}`，未编辑时不提交该字段并保留后端配置；直接编辑后提交完整对象进行整项替换，显式提交`{}`清空。Headers仅返回名称，不回填已有值；重置/保存后恢复空对象编辑框。目录/测试不持久化配置；保存确认后清理秘密并采用权威新版本；4.2.40通过saveReceipt区分提交与测试/后置处理结果。onCommitted用于刷新所有已确认提交，onSaved只在有安全editor时触发，宿主不在两处重复刷新。已提交缺editor清dirty但只读锁定，须显式重读；有editor后未编辑不重复保存。错误Toast保留“已保存但测试未通过”等事实，不冒充测试通过。保存结果未知禁重复保存；修改可重新读取已知ID，新建未知不能以读取默认配置解除阻断，宿主先核对创建结果再load(确认的ID)；重新读取是显式丢弃当前草稿，不把取消视为失败回滚。控制器getState返回不可变非秘密状态；外部扩展通过setField等动作修改。

示例：[模型配置 Mock](../examples/model-profile-react/app.tsx)。4.2.39正式提供上述入口；mock fixture 参数不是正式协议默认值；HTTP及后端提示词见[PUBLIC_API](PUBLIC_API.md#模型配置后端实施提示词)。

## 面包屑与走马灯（4.2.41）

本节能力自 4.2.41 正式提供；复用正式 theme Token/公开组件，统一 demo 的“面包屑”“走马灯”和“图表”均可直接查看。不增加路由、数据请求、缓存或业务提交 owner。

`@coffeehc/xui-react/navigation` 的 Breadcrumbs 保留旧 children/ol 组合；新增互斥的 `items` 完整列表，条目为稳定 id、可翻译 label、可选 href/icon/disabled/render/linkProps。末项自动为非链接 Current（aria-current=page），无 href 的上级为文字；不从路由猜测路径、权限或首页。可选 maxItems>=3 保留首项、末尾及公共 Menu 省略入口；disabled 禁用所有生成动作。省略菜单需要时才加载其实现；宿主需加载正式 floating.css（或完整 style.css）。按需拆包由宿主 bundler 决定，共享依赖仍可能进入基础图。separator、overflowContent/overflowLabel 为内容槽，Root/Item/Link/Current/Separator 为正式组合部件。长名称自然换行，窄屏/RTL 不裁切当前路径；空 items 不生成假路径。onNavigate 只对普通主键点击通知宿主，宿主可 preventDefault 接自己的路由；修饰键、target、download 和原生链接行为保留。render 支持宿主链接元素；禁止把私有 DOM/ARIA 补丁作为接入。动态折叠删除焦点链接时，回到省略按钮或可用上级；语言更新不创建新路由 owner。加载/失败由宿主用所属 LoadingState/ErrorState 或 Toast 组合，不伪造路径。

`@coffeehc/xui-react/carousel` 的 Carousel 接收 label、items、itemKey、renderItem；Root 拥有 viewport/slide 的稳定身份、可访问语义和隐藏策略。renderItem 的 context 提供 id/index/active/disabled，业务内容和动作由宿主负责。默认 controls 由公开 Carousel.Controls/PlayPause/Previous/Indicators/Indicator/Next 组成；可替换 controls 槽，自定义时需保留可暂停入口且先于可轮播内容进入 Tab 顺序。controls=false 抑制 View 时钟。所有可见文案和页序由 labels 翻译；不把只读内容等同禁用浏览。

模型来自 `@coffeehc/xui-runtime/carousel` 的 createCarouselController，默认、受控 value/defaultValue 与注入 controller 互斥；注入时宿主持有同一顺序的 ids 与实际 items，并负责其生命周期。一个 Controller 同时绑定一个活动 Carousel View，多个控制入口使用该 View 下的 Controls 槽位，避免争用时钟和焦点。onValueChange(value,details) 为稳定 ID 意图，支持 cancel；受控值仅在 update/宿主确认后显示，不乐观切换。外部确认不回调；删除当前项时请求最近位置的存续项一次；无确认时不把其他记录冒充当前项。空值 null 表示无当前项，空集合不编造内容。数据重排保留当前 ID，旧 defaultValue 不重设状态。loop 默认 false；disabled 阻止生成导航和播放动作，renderItem 中的独立业务动作按 context.disabled 接线。busy 与 disabled 分离，已确认内容可在同范围刷新/错误时保留；新范围由宿主清空旧 items。状态/placeholder 与 onRetry 不创建请求或自动重试。

自动轮播默认关闭；显式 autoPlay 或播放动作才请求开始，interval 默认5000ms且至少1000ms。Controller 仅持有播放意图，不拥有计时器或 DOM；View 时钟在悬停/文档隐藏时暂停，焦点进入和减少动态效果会停止播放，恢复须用户显式操作。减少动态效果下关闭自动轮播与入场动画，手动切换仍可用。焦点停留在触发控件；外部切换使当前内容输入失去可见性时回到 viewport，不抢夺宿主已移走的焦点。仅 viewport 自身处理左右/Home/End，RTL 方向对应；内容里的输入、按钮和链接保留自己的键盘操作。触屏/笔手势仅在非独立控件内容中接管明确的横向移动，纵向滚动保留。View 退出清理时钟与监听，不销毁注入 Controller；destroy 状态会禁用生成控件。

非当前内容以 visibility/inert/aria-hidden 隐藏，但保留挂载和布局测量，避免切换销毁草稿或改变由最大内容决定的视口高度。加载占位使用 carousel-min-block-size（默认引用公共反馈最小高度）；没有私有字号/皮肤。CSS 使用完整 style.css，或 critical.css + carousel.css；carousel.css 为可选样式分片。ARIA/暂停规则参考 [WAI Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)、[WAI Breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/)，最终以本库实际浏览器证据为准。

| 区域 / slot | 内容归属与公共呈现 |
| --- | --- |
| Breadcrumbs items / children | 二选一；父级 Link 使用公共链接色，末项 Current 使用前景与强调字重，分隔符为装饰弱化色 |
| Breadcrumbs overflowContent / overflowLabel | 前者是按钮内容，后者是完整可翻译名称；隐藏条目使用同一公共 Menu，无宿主弹层皮肤 |
| Carousel renderItem | 宿主业务内容；默认字号继承，Card / Image / Field 等使用原公共组件，不把操作写入选择 Controller |
| Carousel controls | 公共动作与指示器，按容器净宽换行居中；自动播放必须保留可暂停入口，独立内容动作不触发行切换 |
| loadingState / emptyState / errorState | 初次无内容的局部占位；已有内容刷新/失败时原节点保持，反馈使用原 DataRegion 区域；重试仍由宿主请求 owner 执行 |

```tsx
import {Breadcrumbs} from '@coffeehc/xui-react/navigation';
import {Carousel} from '@coffeehc/xui-react/carousel';
import {Card} from '@coffeehc/xui-react/display';
import '@coffeehc/xui-theme/style.css';

<Breadcrumbs aria-label="工作区路径" maxItems={3} overflowLabel="显示上级路径"
  items={[{id:'home',label:'首页',href:'/'},{id:'workspace',label:'工作区',href:'/workspace'},
    {id:'current',label:'当前任务'}]}/>;
<Carousel label="工作区推荐" items={recommendations} itemKey={item=>item.id}
  labels={{previous:'上一项',next:'下一项',play:'开始轮播',pause:'暂停轮播'}}
  renderItem={item=><Card title={item.title}>{item.summary}</Card>}/>;
```

完整组合和适用状态见[统一 demo 源码](../examples/components-react/navigation-media.tsx)；图表沿用[公共图表](#公共图表)与同一 demo 导航。只读属于内容字段；未取得的数据路径不传入虚构条目。不能为了轮播获取数据而新增网络请求 owner。

### SSE 事件读取与页面状态

事件页沿用既有Controller/Resource及DataRegion、LoadingState、Toast等公共slot，不新增SSE专用皮肤或事件状态owner。HTTPService.readEvents只管单连接传输、协议与取消，生命周期/领域投影由宿主按[公共SSE合同](PUBLIC_API.md#sse-读取4245)接线；示例/http-events-react/展示真实分片、停止、401/403及超限。实际大屏仅在已确认实时事件到达时点亮，历史补发、重连或样例动画不能冒充真实事件。
