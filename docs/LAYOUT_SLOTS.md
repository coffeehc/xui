# 公共布局插槽与顶栏控件

默认尺度、边界与动效只由[DESIGN](DESIGN.md)定义；本页规定布局组合与内容所有权。[公开入口](PUBLIC_API.md)提供正式 exports/types，完整可运行消费者见[React](../examples/header-controls-react/app.tsx)和[原生](../examples/header-controls-vanilla/app.js)。不创建同义 PageLayout，不要求消费方修改内部DOM或写定位CSS。

## 语义区域矩阵

React 的 AppShell/MenuLayout 接收 ReactNode；原生 createMenuLayout 接收 Node/DocumentFragment/null，并通过 update 更新。AppHeader 独立组合采用同名顶栏属性。

| 区域 | React | 原生 | 默认与响应式 | 所有权/更新 |
| --- | --- | --- | --- | --- |
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
| 导航正文 | AppShell.sidebar / MenuLayout.items | items | 长菜单自身滚动，保留至少一项可用高度 | 库拥有一个导航/键盘/抽屉owner，宿主提供数据 |
| 侧栏底 | sidebarFooter | sidebarFooter | 短菜单贴底；极长内容自身滚动 | 返回/授权/版本只是可选业务内容，无默认内置意义 |
| 页面标题与操作 | pageHeader内组合PageHeader(title/description/meta/actions) | pageHeader Node，使用公开xui-page-header/xui-toolbar结构 | 正文滚动流开头，标题右侧actions窄屏换行 | 复用现有PageHeader，不增加同义标题API |
| 页内工具条 | pageToolbar | pageToolbar | 标题下、主内容前；正文滚动流 | 过滤器/页内tabs/提示等宿主内容，不做数据owner |
| 主内容 | children | content或root原内容 | 既有document/viewport正文滚动合同 | 恒定content容器，切换其他槽不重挂正文 |
| 页面底部 | pageFooter | pageFooter | 主内容后、同一正文滚动流，非悬浮覆盖层 | 页面说明/操作，与sidebarFooter独立 |

空的可选槽不占位；React undefined/null/boolean、空字符串/数组/Fragment不产生内容包装，数值0保留；自定义组件渲染结果由React决定，实际空DOM包装用:empty消除视觉占位。原生空槽不占视觉/键盘空间。同一个Node/已消费Fragment传回不重建内容、不重复绑定；需要替换内容传新Node/Fragment，清空传null/undefined。移除后恢复已消费Fragment须重新填入内容或保留Node引用。React遵循正常key/type协调，宿主有意移除某槽会卸载该槽内容，不影响其他槽、正文和导航owner。

Tab按真实DOM顺序经过primary（导航、品牌、路径、context）、secondary（状态、actions、旧header、auxiliary、语言、主题、account），然后侧栏/正文；不使用正tabindex重排。打开抽屉仍采用原模态焦点限制；关闭回同一个顶栏菜单开关。关闭当前聚焦的语言入口会把焦点移到相邻主题按钮。槽自身交互语义/disabled/busy由其组件或宿主拥有。

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
