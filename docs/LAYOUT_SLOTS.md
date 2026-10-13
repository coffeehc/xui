# 公共布局插槽与顶栏控件

默认尺度、边界与动效只由[DESIGN](DESIGN.md)定义；本页规定布局组合与内容所有权。[公开入口](PUBLIC_API.md)提供正式 exports/types，完整可运行消费者见[React](../examples/header-controls-react/app.tsx)和[原生](../examples/header-controls-vanilla/app.js)。不创建同义 PageLayout，不要求消费方修改内部DOM或写定位CSS。

## 语义区域矩阵

React 的 AppShell/MenuLayout 接收 ReactNode；原生 createMenuLayout 接收 Node/DocumentFragment/null，并通过 update 更新。AppHeader 独立组合采用同名顶栏属性。

| 区域 | React | 原生 | 默认与响应式 | 所有权/更新 |
| --- | --- | --- | --- | --- |
| 平台前置安全区 | headerSlots.leading / AppHeader.leading | 同名Node | primary最前、自动菜单开关之前；不收缩，默认为空 | OS/窗口态/真实尺寸和drag规则由宿主提供；不内置mac像素 |
| 顶栏品牌 | headerSlots.brand | headerSlots.brand | primary 内，长品牌省略；窄屏保持导航入口 | 内容由宿主提供；title仅未指定brand时回退 |
| 路径 | headerSlots.breadcrumb | 同名Node | 品牌右侧；窄屏单独换行 | 宿主提供nav语义，不推断路由 |
| 顶栏左中扩展 | headerSlots.context | 同名Node | primary末尾；窄屏另起一行 | 工作区/搜索等宿主内容，不与右辅助工具混合 |
| 运行状态 | headerSlots.status | 同名Node | secondary起始，按需换行 | 真实状态/文案由宿主提供 |
| 应用动作 | headerSlots.actions | 同名Node | 状态之后，可换行 | 不复制主题/语言/菜单控件 |
| 顶栏辅助工具扩展 | headerSlots.auxiliary | 同名Node | controls组内，语言/主题之前，可换行 | 不依赖locale启用，可放版本/帮助等宿主内容 |
| 默认主题 | theme / themeLabels | 同名选项 | 右侧controls最后，一个图标按钮 | 复用一个theme controller，无独立持久化 |
| 可选语言 | locale | 同名HeaderLocaleOptions | auxiliary之后、主题之前；未启用不生成控件 | 宿主i18n owner提供事实/列表/回调 |
| 独立账号区 | headerSlots.account | 同名Node | secondary最末，工具组之外；窄屏自然换行 | 账号菜单/认证/权限完全由宿主拥有 |
| 侧栏顶 | sidebarHeader | sidebarHeader | 菜单之前；与底部一起限制高度并可滚动；compact仍受公共栏宽约束 | 同一个侧栏树随响应式进入导航抽屉，不加第二个菜单开关 |
| 导航正文 | AppShell.sidebar / MenuLayout.items | items / sidebar Node | 长菜单自身滚动；sidebar替换完整默认菜单区，null恢复items | 一个shell/drawer owner；每个NavigationMenu拥有自身键盘，宿主保管自组内容生命周期 |
| 侧栏底 | sidebarFooter | sidebarFooter | 短菜单贴底；极长内容自身滚动 | 返回/授权/版本只是可选业务内容，无默认内置意义 |
| 页面标题与操作 | pageHeader内组合PageHeader(title/description/meta/actions) | pageHeader Node，使用公开xui-page-header/xui-toolbar结构 | 正文滚动流开头，标题右侧actions窄屏换行 | 复用现有PageHeader，不增加同义标题API |
| 页内工具条 | pageToolbar | pageToolbar | 标题下、主内容前；正文滚动流 | 过滤器/页内tabs/提示等宿主内容，不做数据owner |
| 主内容 | children | content或root原内容 | document/viewport自然正文；workspace模式填满剩余高度 | 恒定content容器，切换其他槽不重挂正文 |
| 页面底部 | pageFooter | pageFooter | 主内容后、同一正文滚动流，非悬浮覆盖层 | 页面说明/操作，与sidebarFooter独立 |

空的可选槽不占位；React undefined/null/boolean、空字符串/数组/Fragment不产生内容包装，数值0保留；自定义组件渲染结果由React决定，实际空DOM包装用:empty消除视觉占位。原生空槽不占视觉/键盘空间。同一个Node/已消费Fragment传回不重建内容、不重复绑定；需要替换内容传新Node/Fragment，清空传null/undefined。移除后恢复已消费Fragment须重新填入内容或保留Node引用。React遵循正常key/type协调，宿主有意移除某槽会卸载该槽内容，不影响其他槽、正文和导航owner。

富业务自组导航使用完整sidebar区域，不能把整份导航塞进sidebarHeader的限高槽。原生新增sidebar的节点保留、null恢复、替换焦点与清理边界见[导航合同](NAVIGATION.md#原生完整自组-sidebar)。

Tab按真实DOM顺序经过primary（leading、品牌、导航、路径、context）、secondary（状态、actions、旧header、auxiliary、语言、主题、account），然后侧栏/正文；不使用正tabindex重排。打开抽屉仍采用原模态焦点限制；关闭回同一个顶栏菜单开关。关闭当前聚焦的语言入口会把焦点移到相邻主题按钮。槽自身交互语义/disabled/busy由其组件或宿主拥有。

## 有界工作区与滚动所有权

`scrollMode` 使用共享 `ShellScrollMode = 'document' | 'viewport' | 'workspace'`，React AppShell/MenuLayout和原生createMenuLayout完全同型。默认仍为document，旧viewport语义不变：

- document：页面随文档自然滚动，适合普通列表/表单/文章。
- viewport：外壳默认100dvh，sidebar/main各自滚动；content仍为自然文档高度，不承诺把业务的100%高度解析为剩余窗口。
- workspace：外壳有界，顶栏按真实内容自然增高/换行；main内部pageHeader→pageToolbar→content→pageFooter，标题/工具条/底部占自然高度，content获得明确的剩余高度，默认允许收缩到零。公开token `--layout-workspace-content-min-block-size` 默认0px，库拥有这条可收缩链，不要求宿主测量顶栏、减固定头高或定位发送框。

workspace的顶栏和page slots不覆盖正文；主内容的业务布局通常使用height/blockSize:100%、flex/grid、min-block-size:0，再让指定历史/编辑器/检查器区域overflow:auto。发送区保持业务正常流、不收缩，历史区吃剩余空间。main/content的overflow:auto只作为无法拆分内容或页头/页尾过大的可达性兜底；正常可容纳的业务布局只有指定内部区域产生滚动。过大的固定业务内容仍需要可访问的滚动，模式不是把任意页面强行塞进首屏的裁切开关。不要叠加另一套body overflow锁、复制库内部CSS或绝对定位composer。

需要非零正文视口的组合可在shell公开style绑定 `--layout-workspace-content-min-block-size`，库把下限限制在100dvh内。DataTable正式范例显式绑定 `var(--data-table-min-block-size)`，该组合不是自动推断；超高标题/筛选时main自然滚动，而非把内容困在零高的内部滚动口。普通workspace默认值保持0，已有聊天/编辑器不增加强制留白。宿主拥有自己的style值，原生销毁时由宿主恢复原值，React按正常style生命周期更新/卸载。完整双端范例见[DataTable](DATA_TABLE.md#页面标题筛选与滚动)。

公开Root style可以提供宿主已有的明确blockSize来嵌入非全窗口；否则以100dvh为界。若宿主使用百分比高度，它必须先提供可解析的祖先高度。改变scrollMode、页内槽或leading不会重建main/content，保留正文输入、焦点与宿主状态。短内容占满可用工作区但不产生多余文档滚动；自然高度页面继续选择document。完整两栏长/短历史示例：[React](../examples/workspace-react/app.tsx)（`?direct`直接AppShell）、[原生](../examples/workspace-vanilla/app.js)。示例仅在自有业务元素上提供布局，不读取或改写库内部元素。

## 窗口平台前置槽

`headerSlots.leading`（独立AppHeader为`leading`）位于primary最前，先于库生成的导航按钮；brand仍是品牌位置。leading默认无内容、无尺寸、无额外Tab目标。库保持leading不收缩并限制其最大宽度为所在行；其他内容按既有窄屏规则换行，DOM与键盘顺序一致，不使用CSS order或正tabindex。宿主提供的内容必须适配可用宽度，不能把无界固定宽内容当作安全区。

macOS hiddenInset的真实控件避让尺寸、全屏/退出全屏、Windows/Linux和无标题栏变化由宿主窗口集成决定：需要时传安全区Node，不需要时传null；库不检测平台、不固定traffic-light像素、不创建窗口按钮。装饰性占位使用aria-hidden且不设tabIndex；真的交互控件提供名称和正常键盘语义。示例`?platform`的OS按钮只是合成顺序验证，不是原生窗口控件。

Wails/Electron等drag/no-drag机制属于宿主桥接。仅对宿主自有非交互区域声明可拖动；interactive leading内容应按宿主框架标为no-drag，不可把可拖动样式继承到整套xui顶栏或覆盖自动菜单/主题/账号按钮。库不会猜测或修改框架专用CSS属性。本次验证浏览器布局与DOM顺序；没有真实Wails/hiddenInset验证声明。

## 默认主题与可选i18n

AppHeader、AppShell、MenuLayout与原生createMenuLayout默认生成右侧主题图标按钮。明确偏好按light→dark→system→light循环；图标表达当前mode，不把system显示成其当前effective颜色。完整可访问名称包含当前模式和下一动作，title说明下一动作，Enter/Space使用既有按钮动效及reduced-motion合同。

未传theme时复用预初始化的window.xuiTheme；若文档尚无有效owner，getThemeController(window)只建立一次。默认持久化键ui.theme.mode，无有效值为system；system跟随系统变化，存储不可用仍可内存切换。自有JSON桥接或受控偏好继续传同一个ThemeController，setMode仅请求，直到宿主syncMode才改变事实。布局卸载只解除视图订阅，不销毁共享owner。登录页继续只继承外观，不显示这个顶栏控件。

locale只有enabled:true才显示。value/options/onValueChange全部由现有产品i18n owner提供；库不加载词典、不猜支持语言、不设置document.lang、不另写locale存储。原生与React都用标准select语义，当前值受控；回调后不自动把请求当事实。options中的disabled语言不可选择；不在列表的当前值显示空项，不假装已选择首项。label用于控件可访问名，主题文案可用themeLabels覆盖light/dark/system/switchToLight/switchToDark/switchToSystem，沿用库现有labels模式。

```tsx
<MenuLayout items={items} theme={existingTheme}
  locale={i18nEnabled ? {
    enabled: true, value: locale, options: languages,
    onValueChange: requestLocale, label: t('language')
  } : undefined}
  headerSlots={{brand: <Brand/>, context: <WorkspacePicker/>,
    auxiliary: <HelpAction/>, account: <AccountMenu/>}}
  sidebarHeader={<WorkspaceSummary/>}
  sidebarFooter={<ReturnAndPermissionActions/>}
  pageHeader={<PageHeader title={t('settings')} actions={<SaveAction/>}/>}
  pageToolbar={<Filters/>} pageFooter={<PageNotes/>}>
  {page}
</MenuLayout>
```

原生同名槽传Node，locale/theme为同一配置/owner。update未指定的顶级槽保持原值；headerSlots是一个整体对象值，替换它时传入需要保留的全部顶栏角色，清空某角色用null。业务返回动作放sidebarFooter；图示旧返回位置不成为新默认。所有示例仅合成数据，不改产品认证、权限、后端或部署。

## 验证边界

新增header-controls正式消费者由独立tarball构建及types/exports门禁覆盖；对应unit/Playwright验证默认主题、三模式循环/系统变化、受控请求、i18n显式开启、翻译标签、槽身份/焦点、长菜单、窄屏/200%文字及空槽。全量build/watch和最终浏览器结果以对应提交Verify终态为准；本页不把源码断言、收集数量或前次CI成绩当成这次实跑成功。真实读屏器、移动OS、Safari/Firefox和SSR hydration没有本轮通过声明。

旧AppShell.header未搭配headerSlots时作为完整legacy内容区放在primary，不当成brand拆分、裁切或强制子节点块显示；搭配headerSlots时仍位于secondary的既有legacy位置。重复同角色更新保持正常React协调；显式切换headerSlots有无会改变legacy所属区域，不能宣称该跨角色移动保留legacy子树身份。其他控件继续使用同一内部Frame。

## 标准列表与卡片正文

现有pageHeader组合PageHeader的title/meta/actions，pageToolbar组合DataTableToolbar/DataTableFilter；workspace正文使用DataTable即可得到库维护的表体/底栏高度链。搜索只能放pageToolbar或DataTable.toolbar一处。卡片列表复用相同页槽和ScrollArea/Grid/Surface，不新增PageLayout。pageToolbar默认没有下边框且保留layout-section-gap，不再包产品整行分隔。完整合同及0/20/50/100行正式双端消费者见[DataTable](DATA_TABLE.md)。顶栏紧凑与无框语言控件见[专项说明](HEADER_CONTROLS.md)。
