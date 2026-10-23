# 公开 API 与运行时合同

这是当前 manifests 的全部入口映射；完整通用规范只在 [DESIGN.md](DESIGN.md)，接入步骤见 [ADOPTION.md](ADOPTION.md)。没有省略 root/re-export/helper 入口，也不把规划能力列为可调用接口。

新建或改造产品 UI 统一以 `@coffeehc/xui-react` 为唯一公共 UI 层。runtime 只保留无框架 TypeScript 服务、模型、解析器、presentation 数据/helper 与工具，不提供 DOM UI factory/controller；React 页面可按真实职责复用这些 TS 能力。XQuant、XLead 等产品迁移状态以各自仓库逐页验收为准。

4.2.7的`AppShellProps`/`MenuLayoutProps`可选`sidebarTabs?: React.ReactNode`为水平line Tabs提供统一分隔归属；Root/Panel/业务状态保持原owner，迁移与四项组合见[侧栏Tabs合同](COMPONENTS.md#侧栏快捷操作组合)。

下表链接到可读源码与合同；正式 types 路径由包 exports.types 指向 dist 声明。请固定 checkout SHA，先构建再消费，不直接把源码链接设成产品 alias。根入口是相应子入口的汇总；命名类型和运行时导出逐项记录到可再生成的 `.artifacts/public-api.json`，不手写另一份函数签名。

[scripts/public-api.mjs](../scripts/public-api.mjs) 从实际 manifests/构建声明取全部名字；[文档守卫](../scripts/check-docs.mjs) 检查本表入口与 manifests 完全一致。[正式消费](../scripts/consumers.mjs) 在独立 tarball 安装中读取 ESM/CSS/init、编译命名导出的 type import、核对运行时导出并打包全部 ESM/CSS。下面的完整页面与 fixture 再证明实际组装行为，入口通过不代表未跑的产品集成通过。

正式交付统一使用`pnpm archive`：固定清单路径为`metadata/public-api.json`，由准确tarball的manifests/声明生成，并通过根manifest中的SHA256、entries及sourceGeneration建立对应；`pnpm archive:verify <目录>`独立重算和交叉校验。目录、摘要计算和失败规则见[正式归档合同](ADOPTION.md#正式归档的唯一入口)，不再以手工补齐的清单作为正式交付流程。

按章节查阅：

- [全部正式入口](#全部正式入口)
- [默认行为](#默认行为)
- [启动、配置与应用服务](#启动配置与应用服务)
- [HTTP 与查询](#http-与查询)
- [认证会话](#认证会话)
- [API Key 管理](#api-key-管理)
- [业务日志](#业务日志)
- [程序错误观察](#程序错误观察)
- [默认适配器的服务前置](#默认适配器的服务前置)
- [通用资源控制器](#通用资源控制器)

## 全部正式入口

下表完整覆盖当前 manifest 中的全部公开入口；组件用法按 [组件手册](COMPONENTS.md) 查阅，签名以固定版本的正式 types 为准。

### @coffeehc/xui-theme

| import/script | 源码与导出 | 使用合同 | 示例 |
| --- | --- | --- | --- |
| `@coffeehc/xui-theme/style.css` <!-- public-entry: @coffeehc/xui-theme/style.css --> | [源码](../scripts/tokens.mjs) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/tokens.css` <!-- public-entry: @coffeehc/xui-theme/tokens.css --> | [源码](DESIGN.md) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/components.css` <!-- public-entry: @coffeehc/xui-theme/components.css --> | [源码](../packages/theme/src/components.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/base.css` <!-- public-entry: @coffeehc/xui-theme/base.css --> | [源码](../packages/theme/src/base.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/button.css` <!-- public-entry: @coffeehc/xui-theme/button.css --> | [源码](../packages/theme/src/button.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/forms.css` <!-- public-entry: @coffeehc/xui-theme/forms.css --> | [源码](../packages/theme/src/forms.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/navigation.css` <!-- public-entry: @coffeehc/xui-theme/navigation.css --> | [源码](../packages/theme/src/navigation.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/feedback.css` <!-- public-entry: @coffeehc/xui-theme/feedback.css --> | [源码](../packages/theme/src/feedback.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/dialog.css` <!-- public-entry: @coffeehc/xui-theme/dialog.css --> | [源码](../packages/theme/src/dialog.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/layout.css` <!-- public-entry: @coffeehc/xui-theme/layout.css --> | [源码](../packages/theme/src/layout.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/floating.css` <!-- public-entry: @coffeehc/xui-theme/floating.css --> | [源码](../packages/theme/src/floating.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/table.css` <!-- public-entry: @coffeehc/xui-theme/table.css --> | [源码](../packages/theme/src/table.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/table-resize.css` <!-- public-entry: @coffeehc/xui-theme/table-resize.css --> | [源码](../packages/theme/src/table-resize.css)，列宽拖动可选交互分片，已含于style/components，critical或独立table需另加本片 | [列宽拖动](COMPONENTS.md#交互列宽调整) | [示例](../examples/data-table-react/app.tsx) |
| `@coffeehc/xui-theme/critical.css` <!-- public-entry: @coffeehc/xui-theme/critical.css --> | [源码](../scripts/tokens.mjs) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-theme/auth.css` <!-- public-entry: @coffeehc/xui-theme/auth.css --> | [源码](../packages/theme/src/auth.css) | [合同](PUBLIC_API.md#认证会话) | [示例](../examples/login-react/app.tsx) |
| `@coffeehc/xui-theme/sheet.css` <!-- public-entry: @coffeehc/xui-theme/sheet.css --> | [Sheet/确认/触发器样式](../packages/theme/src/sheet.css)，同样包含在critical/style | — | — |
| `@coffeehc/xui-theme/widgets.css` <!-- public-entry: @coffeehc/xui-theme/widgets.css --> | [源码](../packages/theme/src/widgets.css)，也包含于critical/style | — | — |
| `@coffeehc/xui-theme/search-toolbar.css` <!-- public-entry: @coffeehc/xui-theme/search-toolbar.css --> | 同时包含于 style/critical/components；统一尺寸和响应布局仅消费既有公共 token。 | [组件合同](COMPONENTS.md) | — |

### @coffeehc/xui-runtime

| import/script | 源码与导出 | 使用合同 | 示例 |
| --- | --- | --- | --- |
| `@coffeehc/xui-runtime` <!-- public-entry: @coffeehc/xui-runtime --> | [源码](../packages/runtime/src/index.ts) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-runtime/init.js` <!-- public-entry: @coffeehc/xui-runtime/init.js --> | [源码](../packages/runtime/src/init.ts) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-runtime/theme` <!-- public-entry: @coffeehc/xui-runtime/theme --> | [源码](../packages/runtime/src/theme.ts)；`ThemePreset`、`ThemeState.preset`、`ThemeService.setPreset`；`setInterfaceScale`、`InterfaceScale`、`InterfaceScaleOptions`，与根入口一致 | [主题与界面缩放](DESIGN.md#公共界面缩放) | [示例](../examples/page-composition-react/app.tsx) |
| `@coffeehc/xui-runtime/theme-control` <!-- public-entry: @coffeehc/xui-runtime/theme-control --> | [源码](../packages/runtime/src/theme-control.ts) | [顶栏合同](COMPONENTS.md#布局与顶栏) | [示例](../examples/header-controls-react/app.tsx) |
| `@coffeehc/xui-runtime/header-controls` <!-- public-entry: @coffeehc/xui-runtime/header-controls --> | [源码](../packages/runtime/src/header-controls.ts) | [语言合同](COMPONENTS.md#布局与顶栏) | [示例](../examples/header-controls-react/app.tsx) |
| `@coffeehc/xui-runtime/loading` <!-- public-entry: @coffeehc/xui-runtime/loading --> | [源码](../packages/runtime/src/loading.ts) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-runtime/text-links` <!-- public-entry: @coffeehc/xui-runtime/text-links --> | parseHttpURL / linkifyText / TextLinkPart | [安全正文链接](#安全正文链接) | [示例](../examples/public-capabilities-react/app.tsx) |
| `@coffeehc/xui-runtime/theme-colors` <!-- public-entry: @coffeehc/xui-runtime/theme-colors --> | readThemeColors / observeThemeColors / ThemeColor 等类型 | [绘图主题颜色](#绘图主题颜色) | [示例](../examples/public-capabilities-react/app.tsx) |
| `@coffeehc/xui-runtime/navigation` <!-- public-entry: @coffeehc/xui-runtime/navigation --> | [源码](../packages/runtime/src/navigation.ts) | [合同](COMPONENTS.md#导航与菜单) | [示例](../examples/menu-react/app.tsx) |
| `@coffeehc/xui-runtime/http` <!-- public-entry: @coffeehc/xui-runtime/http --> | [源码](../packages/runtime/src/http.ts) | [合同](PUBLIC_API.md#http-与查询) | [示例](../examples/http-react/app.tsx) |
| `@coffeehc/xui-runtime/query` <!-- public-entry: @coffeehc/xui-runtime/query --> | [源码](../packages/runtime/src/query.ts) | [合同](PUBLIC_API.md#http-与查询) | [示例](../examples/http-react/app.tsx) |
| `@coffeehc/xui-runtime/api-key` <!-- public-entry: @coffeehc/xui-runtime/api-key --> | [源码](../packages/runtime/src/api-key.ts) | [合同](PUBLIC_API.md#api-key-管理) | [示例](../examples/api-key-react/app.tsx) |
| `@coffeehc/xui-runtime/structured-log` <!-- public-entry: @coffeehc/xui-runtime/structured-log --> | [源码](../packages/runtime/src/structured-log.ts)：GroupedStructuredLogAdapter（records可选）、兼容完整StructuredLogAdapter、Controller及HTTP工厂重载 | [合同](PUBLIC_API.md#程序错误观察) | [示例](../examples/log-react/app.tsx) |
| `@coffeehc/xui-runtime/data-table` <!-- public-entry: @coffeehc/xui-runtime/data-table --> | [共享事实/类型](../packages/runtime/src/data-table.ts) | [完整组合](COMPONENTS.md#数据表格) | [模型](../examples/shared/data-table-model.ts) |
| `@coffeehc/xui-runtime/grouped-combobox` <!-- public-entry: @coffeehc/xui-runtime/grouped-combobox --> | [源码](../packages/runtime/src/grouped-combobox.ts) | [合同](COMPONENTS.md#groupedcombobox-与-disclosure) | [示例](../examples/shared/grouped-search-model.ts) |
| `@coffeehc/xui-runtime/business-log` <!-- public-entry: @coffeehc/xui-runtime/business-log --> | [源码](../packages/runtime/src/business-log.ts) | [合同](PUBLIC_API.md#业务日志) | [示例](../examples/business-log-react/app.tsx) |
| `@coffeehc/xui-runtime/auth` <!-- public-entry: @coffeehc/xui-runtime/auth --> | [源码](../packages/runtime/src/auth.ts) | [合同](PUBLIC_API.md#认证会话) | [示例](../examples/shared/login-model.ts) |
| `@coffeehc/xui-runtime/entity-id` <!-- public-entry: @coffeehc/xui-runtime/entity-id --> | [源码](../packages/runtime/src/entity-id.ts) | [编码合同](PUBLIC_API.md#显式实体身份编码) | [合成合同](../tests/entity-id.test.mjs) |
| `@coffeehc/xui-runtime/password` <!-- public-entry: @coffeehc/xui-runtime/password --> | [源码](../packages/runtime/src/password.ts) | [合同](COMPONENTS.md#密码输入) | [验证](../tests/password.test.mjs) |
| `@coffeehc/xui-runtime/choice-group` <!-- public-entry: @coffeehc/xui-runtime/choice-group --> | [源码](../packages/runtime/src/choice-group.ts) | [成组字段](COMPONENTS.md#成组选项) | [示例](../examples/choice-group-react/app.tsx) |
| `@coffeehc/xui-runtime/number-input` <!-- public-entry: @coffeehc/xui-runtime/number-input --> | [源码](../packages/runtime/src/number-input.ts) | [专用输入](COMPONENTS.md#文本输入) | [示例](../examples/text-inputs-react/app.tsx) |
| `@coffeehc/xui-runtime/download` <!-- public-entry: @coffeehc/xui-runtime/download --> | [下载](../packages/runtime/src/download.ts)：安全头信息、文件名、请求与显式保存 | — | — |
| `@coffeehc/xui-runtime/api-key-http` <!-- public-entry: @coffeehc/xui-runtime/api-key-http --> | [默认 HTTP adapter](../packages/runtime/src/api-key-http.ts)，[页面API合同](PUBLIC_API.md#默认适配器的服务前置) | — | — |
| `@coffeehc/xui-runtime/business-log-http` <!-- public-entry: @coffeehc/xui-runtime/business-log-http --> | [默认 HTTP loader](../packages/runtime/src/business-log-http.ts)，webfacade offset/ListData | — | — |
| `@coffeehc/xui-runtime/calendar` <!-- public-entry: @coffeehc/xui-runtime/calendar --> | [源码](../packages/runtime/src/calendar.ts)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-runtime/date-time` <!-- public-entry: @coffeehc/xui-runtime/date-time --> | [模型与值合同](../packages/runtime/src/date-time.ts) | [日期时间](COMPONENTS.md#日期时间选择) | [示例](../examples/date-time-react/app.tsx) |
| `@coffeehc/xui-runtime/display` <!-- public-entry: @coffeehc/xui-runtime/display --> | createCopyController、copyableLabels、validateImageOptions 与文字/复制/图片共享类型。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-runtime/admin-setup` <!-- public-entry: @coffeehc/xui-runtime/admin-setup --> | AdminSetupUsernameValidator、AdminSetupCheck/CheckResult、createAdminSetupController、adminSetupLabels、getAdminSetupMessage 和 AdminSetupStatus/State/Result/Credentials/Submit/Labels/Controller/ControllerOptions。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-runtime/collection-view` <!-- public-entry: @coffeehc/xui-runtime/collection-view --> | [源码](../packages/runtime/src/collection-view.ts)；CollectionStatus/Layout/RowContext/Pagination/CursorPagination/Count/Labels/ViewOptions、collectionDefaultLabels、getCollectionState、validateCollectionKeys、createCollectionRequestGuard | [集合合同](COMPONENTS.md#cardgroup) | [示例](../examples/card-group-react/app.tsx) |
| `@coffeehc/xui-runtime/menu` <!-- public-entry: @coffeehc/xui-runtime/menu --> | [序列化配置、Controller 与动作事件](../packages/runtime/src/menu.ts)：MenuConfig/Node/Entry/ActionItem/Group/Heading/Separator、MenuController/State/Options/ActionEvent/ItemTone、createMenuController | [数据菜单与 Controller 所有权](COMPONENTS.md#数据菜单与-controller-所有权) | [示例](../examples/action-menu-react/app.tsx) |

| `@coffeehc/xui-runtime/interaction` <!-- public-entry: @coffeehc/xui-runtime/interaction --> | [模型](../packages/runtime/src/interaction.ts)：开合、选择、导航、分页与Toggle策略Controller | [双模式](COMPONENTS.md#状态所有权与-controller-模式) | [正式类型及交互示例](../tests/fixtures/controller-modes.tsx) |
| `@coffeehc/xui-runtime/component-views` <!-- public-entry: @coffeehc/xui-runtime/component-views --> | [完整服务View模型](../packages/runtime/src/component-views.ts) | [双模式](COMPONENTS.md#状态所有权与-controller-模式) | [API Key](../examples/api-key-react/app.tsx) |
| `@coffeehc/xui-runtime/login-view` <!-- public-entry: @coffeehc/xui-runtime/login-view --> | [登录展示模型](../packages/runtime/src/login-view.ts)，显式借用AuthClient | [双模式](COMPONENTS.md#状态所有权与-controller-模式) | [登录](../examples/login-react/app.tsx) |
| `@coffeehc/xui-runtime/clipboard` <!-- public-entry: @coffeehc/xui-runtime/clipboard --> | [只写剪贴板服务](../packages/runtime/src/clipboard.ts) | [复制合同](#剪贴板复制服务) | [正式浏览器示例](../tests/browser/clipboard.spec.mjs) |
| `@coffeehc/xui-runtime/services` <!-- public-entry: @coffeehc/xui-runtime/services --> | [应用服务注册表](../packages/runtime/src/services.ts)：XuiServices、共享 getters、disposeXuiServices；不导出 install/create service factories | [启动、配置与应用服务](#启动配置与应用服务) | — |
| `@coffeehc/xui-runtime/bootstrap` <!-- public-entry: @coffeehc/xui-runtime/bootstrap --> | [同步启动入口](../packages/runtime/src/bootstrap.ts)：bootstrap、disposeXuiServices、BootstrapEnvironment、XuiApplication | [启动、配置与应用服务](#启动配置与应用服务) | [React示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-runtime/config` <!-- public-entry: @coffeehc/xui-runtime/config --> | [纯配置解析与类型](../packages/runtime/src/config.ts)：resolveConfig、resolveDefaultPages、DefaultPagesConfig、XuiConfig、XuiConfigOverrides、ConfigService | [启动、配置与应用服务](#启动配置与应用服务) | — |
| `@coffeehc/xui-runtime/config.json` <!-- public-entry: @coffeehc/xui-runtime/config.json --> | [随包默认配置](../packages/runtime/src/config.json) | [启动、配置与应用服务](#启动配置与应用服务) | — |
| `@coffeehc/xui-runtime/route` <!-- public-entry: @coffeehc/xui-runtime/route --> | [History路由服务与类型](../packages/runtime/src/route.ts) | [启动、配置与应用服务](#启动配置与应用服务) | — |
| `@coffeehc/xui-runtime/i18n` <!-- public-entry: @coffeehc/xui-runtime/i18n --> | [应用语言服务](../packages/runtime/src/i18n.ts)：类型与 getI18nService | [启动、配置与应用服务](#启动配置与应用服务) | — |
| `@coffeehc/xui-runtime/menu-service` <!-- public-entry: @coffeehc/xui-runtime/menu-service --> | [菜单数据服务](../packages/runtime/src/menu-service.ts)：MenuService类型与 getMenuService | [启动、配置与应用服务](#启动配置与应用服务) | — |
| `@coffeehc/xui-runtime/util-service` <!-- public-entry: @coffeehc/xui-runtime/util-service --> | [纯工具命名空间](../packages/runtime/src/util-service.ts)：getUtilService、UtilService | [启动、配置与应用服务](#启动配置与应用服务) | — |

### @coffeehc/xui-react

| import/script | 源码与导出 | 使用合同 | 示例 |
| --- | --- | --- | --- |
| `@coffeehc/xui-react` <!-- public-entry: @coffeehc/xui-react --> | [源码](../packages/ui-react/src/index.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/button` <!-- public-entry: @coffeehc/xui-react/button --> | [源码](../packages/ui-react/src/button.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/forms` <!-- public-entry: @coffeehc/xui-react/forms --> | [源码](../packages/ui-react/src/forms.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/navigation` <!-- public-entry: @coffeehc/xui-react/navigation --> | [源码](../packages/ui-react/src/navigation.tsx) | [合同](COMPONENTS.md#导航与菜单) | [示例](../examples/menu-react/app.tsx) |
| `@coffeehc/xui-react/menu-layout` <!-- public-entry: @coffeehc/xui-react/menu-layout --> | [源码](../packages/ui-react/src/menu-layout.tsx) | [合同](COMPONENTS.md#导航与菜单) | [示例](../examples/menu-react/app.tsx) |
| `@coffeehc/xui-react/tabs` <!-- public-entry: @coffeehc/xui-react/tabs --> | [源码](../packages/ui-react/src/tabs.tsx) | [合同](COMPONENTS.md#tabs) | [示例](../examples/typography-slots-react/app.tsx) |
| `@coffeehc/xui-react/dialog` <!-- public-entry: @coffeehc/xui-react/dialog --> | [源码](../packages/ui-react/src/dialog.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/feedback` <!-- public-entry: @coffeehc/xui-react/feedback --> | [源码](../packages/ui-react/src/feedback.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/metric-card` <!-- public-entry: @coffeehc/xui-react/metric-card --> | [源码](../packages/ui-react/src/metric-card.tsx) | [指标卡组合](COMPONENTS.md#metriccard) | [示例](../examples/metric-card-react/app.tsx) |
| `@coffeehc/xui-react/chart` <!-- public-entry: @coffeehc/xui-react/chart --> | LineChart / BarChart / PieChart、ChartProps / CartesianChartProps / LineChartProps / BarChartProps / PieChartProps / ChartLabels 及数据类型；根入口同步导出 | [公共图表](COMPONENTS.md#公共图表) | [正式示例](../examples/charts-react/app.tsx) |
| `@coffeehc/xui-runtime/chart` <!-- public-entry: @coffeehc/xui-runtime/chart --> | ChartCategory / ChartSeries / ChartSlice / ChartColor / ChartStatus / ChartDomain / PieArc；validateChartData / getChartDomain / scaleChartValue / getPieArcs；纯 TypeScript，无 DOM/请求 | [公共图表](COMPONENTS.md#公共图表) | [正式示例](../examples/charts-react/app.tsx) |
| `@coffeehc/xui-theme/chart.css` <!-- public-entry: @coffeehc/xui-theme/chart.css --> | 图表独立 CSS，包含于 style/components，按需配合 critical；不包含于 critical | [公共图表](COMPONENTS.md#公共图表) | [正式示例](../examples/charts-react/app.tsx) |
| `@coffeehc/xui-react/layout` <!-- public-entry: @coffeehc/xui-react/layout --> | [源码](../packages/ui-react/src/layout.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/table` <!-- public-entry: @coffeehc/xui-react/table --> | [源码](../packages/ui-react/src/table.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/data-table` <!-- public-entry: @coffeehc/xui-react/data-table --> | [源码](../packages/ui-react/src/data-table.tsx) | [完整组合](COMPONENTS.md#数据表格) | [示例](../examples/data-table-react/app.tsx) |
| `@coffeehc/xui-react/select` <!-- public-entry: @coffeehc/xui-react/select --> | [源码](../packages/ui-react/src/select.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/combobox` <!-- public-entry: @coffeehc/xui-react/combobox --> | [源码](../packages/ui-react/src/combobox.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/grouped-combobox` <!-- public-entry: @coffeehc/xui-react/grouped-combobox --> | [源码](../packages/ui-react/src/grouped-combobox.tsx) | [合同](COMPONENTS.md#groupedcombobox-与-disclosure) | [示例](../examples/grouped-search-react/app.tsx) |
| `@coffeehc/xui-react/menu` <!-- public-entry: @coffeehc/xui-react/menu --> | [Menu.View 与 Menu parts](../packages/ui-react/src/menu.tsx)：默认 config 模式或完整 controller 注入；`Menu.Separator` / `MenuSeparatorProps` | [数据菜单与 Controller 所有权](COMPONENTS.md#数据菜单与-controller-所有权) | [示例](../examples/action-menu-react/app.tsx) |
| `@coffeehc/xui-react/popover` <!-- public-entry: @coffeehc/xui-react/popover --> | [源码](../packages/ui-react/src/popover.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/tooltip` <!-- public-entry: @coffeehc/xui-react/tooltip --> | [源码](../packages/ui-react/src/tooltip.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/toast` <!-- public-entry: @coffeehc/xui-react/toast --> | [源码](../packages/ui-react/src/toast.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/theme` <!-- public-entry: @coffeehc/xui-react/theme --> | [源码](../packages/ui-react/src/theme.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/api-key` <!-- public-entry: @coffeehc/xui-react/api-key --> | [源码](../packages/ui-react/src/api-key.tsx) | [合同](PUBLIC_API.md#api-key-管理) | [示例](../examples/api-key-react/app.tsx) |
| `@coffeehc/xui-react/structured-log` <!-- public-entry: @coffeehc/xui-react/structured-log --> | [源码](../packages/ui-react/src/structured-log.tsx)：重导出GroupedStructuredLogAdapter与完整StructuredLogAdapter | [合同](PUBLIC_API.md#程序错误观察) | [示例](../examples/log-react/app.tsx) |
| `@coffeehc/xui-react/business-log` <!-- public-entry: @coffeehc/xui-react/business-log --> | [源码](../packages/ui-react/src/business-log.tsx) | [合同](PUBLIC_API.md#业务日志) | [示例](../examples/business-log-react/app.tsx) |
| `@coffeehc/xui-react/login` <!-- public-entry: @coffeehc/xui-react/login --> | [源码](../packages/ui-react/src/login.tsx) | [合同](PUBLIC_API.md#认证会话) | [示例](../examples/login-react/app.tsx) |
| `@coffeehc/xui-react/password` <!-- public-entry: @coffeehc/xui-react/password --> | [源码](../packages/ui-react/src/password.tsx) | [合同](COMPONENTS.md#密码输入) | [验证](../tests/browser/password-fields.spec.mjs) |
| `@coffeehc/xui-react/choice-group` <!-- public-entry: @coffeehc/xui-react/choice-group --> | [源码](../packages/ui-react/src/choice-group.tsx) | [成组字段](COMPONENTS.md#成组选项) | [示例](../examples/choice-group-react/app.tsx) |
| `@coffeehc/xui-react/text-inputs` <!-- public-entry: @coffeehc/xui-react/text-inputs --> | [源码](../packages/ui-react/src/text-inputs.tsx) | [专用输入](COMPONENTS.md#文本输入) | [示例](../examples/text-inputs-react/app.tsx) |
| `@coffeehc/xui-react/sheet` <!-- public-entry: @coffeehc/xui-react/sheet --> | [Sheet](../packages/ui-react/src/sheet.tsx)，复用Dialog lifecycle | — | — |
| `@coffeehc/xui-react/alert-dialog` <!-- public-entry: @coffeehc/xui-react/alert-dialog --> | [AlertDialog](../packages/ui-react/src/alert-dialog.tsx)，显式确认/取消 | — | — |
| `@coffeehc/xui-react/context-menu` <!-- public-entry: @coffeehc/xui-react/context-menu --> | [ContextMenu](../packages/ui-react/src/context-menu.tsx)，复用Menu部件；`ContextMenu.Separator` 共用 `MenuSeparatorProps` | [合同](COMPONENTS.md#弹层与工具栏) | — |
| `@coffeehc/xui-react/toggle-group` <!-- public-entry: @coffeehc/xui-react/toggle-group --> | [源码](../packages/ui-react/src/toggle-group.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/avatar` <!-- public-entry: @coffeehc/xui-react/avatar --> | [源码](../packages/ui-react/src/avatar.tsx)，[合同](COMPONENTS.md#avatar) | — | — |
| `@coffeehc/xui-react/accordion` <!-- public-entry: @coffeehc/xui-react/accordion --> | [源码](../packages/ui-react/src/accordion.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/scroll-area` <!-- public-entry: @coffeehc/xui-react/scroll-area --> | [源码](../packages/ui-react/src/scroll-area.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/calendar` <!-- public-entry: @coffeehc/xui-react/calendar --> | [源码](../packages/ui-react/src/calendar.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/date-time` <!-- public-entry: @coffeehc/xui-react/date-time --> | [React 组合](../packages/ui-react/src/date-time.tsx) | [日期时间](COMPONENTS.md#日期时间选择) | [示例](../examples/date-time-react/app.tsx) |
| `@coffeehc/xui-react/command` <!-- public-entry: @coffeehc/xui-react/command --> | [源码](../packages/ui-react/src/command.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/search-toolbar` <!-- public-entry: @coffeehc/xui-react/search-toolbar --> | 及根入口：`SearchToolbar` / `SearchToolbarProps`；`QueryForm` / `QueryField` 及其 Props、QueryFieldWidth，原生查询 form、字段宽度角色及既有 disclosure。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-react/display` <!-- public-entry: @coffeehc/xui-react/display --> | Typography.Heading/Text/Link/Code/LinkedText、LinkedText、Copyable、Separator、Tag、Image，及同名 props/共享类型。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-react/admin-setup` <!-- public-entry: @coffeehc/xui-react/admin-setup --> | AdminSetupPage / AdminSetupForm、各自Props/Handle与共享状态类型。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-react/card-group` <!-- public-entry: @coffeehc/xui-react/card-group --> | [源码](../packages/ui-react/src/card-group.tsx)；CardGroup、CardGroupProps、CardGroupContext、CardGroupCardProps及共用Collection类型 | [CardGroup](COMPONENTS.md#cardgroup) | [示例](../examples/card-group-react/app.tsx) |

CSS 分片中的共享选择样式由一个源码 part 生成：`critical.css` 和 `forms.css` 包含基础 Select 定位/菜单项样式，`floating.css` 保留完整的 selection + floating 兼容组合。`forms.css` 是 forms + selection 组合入口；使用这些公开分片时不直接导入内部源码文件。

| `@coffeehc/xui-react/interaction` <!-- public-entry: @coffeehc/xui-react/interaction --> | [同一TS模型及公开类型汇总](../packages/ui-react/src/interaction.ts) | [双模式](COMPONENTS.md#状态所有权与-controller-模式) | [正式类型及交互示例](../tests/fixtures/controller-modes.tsx) |
| `@coffeehc/xui-react/services` <!-- public-entry: @coffeehc/xui-react/services --> | [React服务上下文](../packages/ui-react/src/services.tsx)：ServicesProvider、useI18n、useMenu 与公共类型 | [启动、配置与应用服务](#启动配置与应用服务) | — |
| `@coffeehc/xui-react/route` <!-- public-entry: @coffeehc/xui-react/route --> | [History路由React绑定](../packages/ui-react/src/route.tsx)：RouteProvider、useRoute、RouteLink | [启动、配置与应用服务](#启动配置与应用服务) | — |

集合 `CollectionViewOptions.hasValue?: boolean` 显式表达当前范围已确认结果（含空）；ready/refreshing或非空行默认推得。DataTable/CardGroup继承此字段，空结果刷新失败时传true以保留空态；首次读取/新范围由宿主重置，runtime不保留数据或创建查询owner。默认refreshing仅aria-busy/分页禁用，固定按钮显示指示，不插入临时反馈行；合同见[状态与生命周期](COMPONENTS.md#状态焦点与生命周期)。

## 默认行为

这些默认值来自上表源码；品牌原始值与 motion 参数仍只由 DESIGN 的受控 token 块定义，不在此复制色板。未改写的复合控件 props/parts 使用当前 Base UI peer 的声明与行为，不能根据另一个版本猜默认值。

| 能力 | 当前默认值与 owner |
| --- | --- |
| theme/init/useTheme | `bootstrap` 把 JSON `theme.mode` 作为非受控默认；有效的 `ui.theme.mode` sessionStorage 偏好优先，同标签页刷新保留、不主动跨页同步、不读取或迁移旧localStorage；无保存值时用配置默认 dark。`init.js` 只在首绘前恢复主题/缩放属性，不创建 controller；`bootstrap` / `getThemeService` 提供文档 owner，`useTheme` 只订阅。显式注入 `ThemeOptions.mode` 是受控模式，不读写 storage |
| Button/IconButton | type=button、variant=primary、size=default；busy 与 disabled 分开，无隐式防重复；IconButton 要求 aria-label。render/ref/事件沿用公开 peer 合并合同 |
| Field/Fieldset/choices | Field 自动统一已知控件 id/label/help/error；复合输入显式 controlId。Input/Textarea/SimpleSelect 与 checkbox/radio/switch 值/事件由宿主；Textarea 可选 `autoResize={maxRows}`，只拥有尺寸，包含 stacked InputGroup 的上下 Addon 组合，默认未启用时行为不变，见[文本输入](COMPONENTS.md#textarea-可选自动增高)；Fieldset 独立关联 legend/help/error |
| MenuLayout/NavigationMenu | 未受控时 collapsed=false、sidebarOpen=false、未指定展开集合为空，当前链接祖先自动展开。activeId 省略才按同源精确 pathname 选择；null/无匹配无 selected。无 navigation adapter 时保留 HTML link 导航，菜单键盘/drawer owner 由 React 组件提供 |
| GroupedCombobox | 一个输入/listbox；查询/open/分页受控，预过滤数据由宿主；折叠和分页按钮在 listbox 外。选中默认 null；[合同](COMPONENTS.md#groupedcombobox-与-disclosure) |
| Pagination/Disclosure | Pagination 默认第 1 页，pageCount 由宿主；受控 page 只请求确认。Disclosure 默认关闭，装饰性 chevron 与公开 DisclosureIndicator 复用相同 tokens。两者不发请求、不自动路由 |
| Tabs | Root/List props 保留固定peer行为，方向键跳过disabled；1.2.0新增List.layout='content'（默认）/'equal'、TabsListProps及装饰性Tabs.Icon，见[布局与图标合同](COMPONENTS.md#tabs)。1.3.0明确普通项400与选中项600字重和raised/强调状态对比；手动/自动激活、loop、RTL与方向不变；固定1.1.3尚不包含新增部分 |
| ApiKeyManager | `pagination` 默认本地 pageSize 10、选项 `[10,25,50]`，只分页完整 `rows`；显式 `false` 关闭分页。切页不发请求、total 仅取完整已确认集合长度；不改变 adapter、后端分页或请求 owner |
| Dialog/Popover/Menu/Tooltip | 关闭不保存。受控 open 与可取消变化遵循各自 React peer 合同。Content portal/默认定位：Select bottom/start 且 alignItemWithTrigger=false，Combobox/Menu bottom/start，Popover bottom/center，Tooltip top/center；positionerProps 可覆盖。Dialog 为模态，非模态浮层不 trap；Tooltip 只放说明 |
| Sheet/AlertDialog/ContextMenu | Sheet默认end，确认initialFocus由宿主或安全取消/中性节点；context rightclick/Shift+F10，checked状态宿主拥有；details.cancel/finalFocus/嵌套生命周期见[弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| Toast | xui Controller 唯一队列；Provider 可默认或完整注入，默认右上角；必要错误就地持续可见 |
| Table/layout | 真实标准元素、header cell 默认 scope=col；TableContainer 为可聚焦 region，宿主给名字。SortButton type=button；striped/expandedRow/ExpandedRow/ExpandButton与逻辑stickyOffset公开；排序/选择/查询/虚拟化不由库执行。PageHeader 主标题和 actions，AppShell 默认抽屉关闭 |
| feedback/resource | Alert 默认 info/status，error 为 alert；DataRegion busy=false；显式传 feedback（含 null）时保留局部反馈槽，使用公开 feedback slot；LoadingState 默认 Loading…，ErrorState 默认 Retry。resource 初始 idle、isEmpty 未声明不猜空、无 timeout/cache/请求或自动 retry；换 key 清旧值、同 key 刷新保留，hooks 只订阅 |
| MetricCard | label/value 必填且原样显示（保留0）；marker默认无、空内容不占位；section/dl/dt/dd为被动展示，未内置按钮/live角色。复用Surface/stat tokens，排列仍由Grid；[合同](COMPONENTS.md#metriccard) |
| HTTP | 默认 GET、response=ajax、same-origin credentials、Go success=true，code 为业务元数据；普通30秒/blob120秒预算，无自动重试。空/false/null payload 合法。响应模式、headers、认证/错误/重试适配与预算见 HTTP 合同，写操作不自动重放 |
| webfacade query | pageIndexOffset 必须逐 endpoint 明确，maxPageSize/字段 codecs/sort 白名单由宿主。没有全局页基数、上限或日期/object 隐式转换；ListData 为 list + 可选 total/next_cursor；总数缺省未知，游标缺省未声明、null明确末页，见 [列表合同](PUBLIC_API.md#列表元数据与受控游标分页) |
| API Key | 首次读取由宿主 refresh；canCreate明确true才创建、撤销/删除需capability或明确宿主许可；过期可按授权撤销，删除仅已撤销管理记录。required权限与独立confirmed保留；默认 HTTP facade/routes 见本节 API Key 与默认适配器前置章节，单一写入owner，未知结果普通列表核验一次，结束等待后可手动再试、不自动重写；完整值仅瞬时结果 |
| 业务日志 | 显式首次 refresh，page size=50（1–200），React 页面使用共享 runtime loader，默认 HTTP facade 见本节默认适配器前置章节，auth/scope由宿主；固定公共事实与版本化 JSON payload。renderer 精确匹配类型/版本的首项；未匹配格式化 JSON，抛错固定反馈与 JSON。JSON 64 KiB/16 层/4096 节点；不缓存 payload |
| 登录页/auth | 同一个 HTTP/auth/theme owner；居中单列窄框、可选 fullscreen 和 brandVisual。Bearer v2 login/refresh/logout/session；access 仅内存，protectedPaths 明确受保护端点；15秒默认预算、no-store、无写入重放。登录直接 POST，提交禁用显示正在登录；超时后普通会话核验一次，未确认则显示错误并允许手动重试。无持久门禁、恢复预请求或恢复弹窗。保留密码清理、安全回跳和宿主导航扩展，详见 [登录与会话](PUBLIC_API.md#认证会话) |
| 独立结构化错误 | 初始 groups、page size=50（1–200），host 显式 refresh；无隐式 endpoint/scope/排序/总记录数。v1/list/cursor、纳秒时间、uint64 字符串、三态、累计/命中/首次代表；详情只按记录 ID 读取，缓存仅当前链已访问摘要，刷新新快照 |

受控交互在当前 render 使用已确认 props，而不是等 layout effect 更新内部 model 后才反映 DOM。适用于 overlay.open、value 与 selection.value/open/inputValue；未传受控字段仍由默认 Controller 管理，完整 Controller 注入时只采用该 owner 快照。外部确认不触发 onChange，取消/拒绝不发布未确认值。

## 启动、配置与应用服务

`@coffeehc/xui-runtime/config.json` 是随 runtime 包提供的默认 JSON；runtime 配置模块从同一资产导入默认值，不在启动时发配置请求。产品以 `bootstrap(overrides, environment)` 同步完成配置解析与浏览器应用服务装配，再挂载 React。`bootstrap` 不登录、不恢复会话、不发 HTTP 请求。浏览器初始化要求明确可用的 `Window`；SSR/隔离测试使用每请求独立的 `new XuiServices(options, environment)`，不得跨 SSR 请求复用模块级认证服务。

`XuiConfigOverrides` 只描述可序列化配置。plain object 递归合并，数组整体替换，`undefined` 不覆盖默认值；配置已知区域中的未知键、非 JSON 值、访问器和不安全键会拒绝。`extensions` 只接受 JSON 数据，供宿主自行校验领域 schema；不得把 token、密码、cookie、私钥等 secret 放入 config.json。运行时对象、函数、Window、HTTP/Auth writer 等通过第二参数 `BootstrapEnvironment` 的 `services` 注入，不序列化进配置。配置类型与默认 JSON 见 [config.ts](../packages/runtime/src/config.ts) 和 [config.json](../packages/runtime/src/config.json)。

```ts
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {HTTPService} from '@coffeehc/xui-runtime/http';
import {AuthService} from '@coffeehc/xui-runtime/auth';
import {MenuService} from '@coffeehc/xui-runtime/menu-service';
import {I18nService} from '@coffeehc/xui-runtime/i18n';
import {RouteService} from '@coffeehc/xui-runtime/route';
import {ServicesProvider} from '@coffeehc/xui-react/services';
import {RouteProvider} from '@coffeehc/xui-react/route';

const app = bootstrap({
  app: {title: '控制台'},
  http: {baseURL: '/api/'},
  auth: {enabled: true, protectedPaths: ['/api/v1/orders/']},
  i18n: {enabled: true, messages: {en: {home: 'Home'}}},
});
const http = HTTPService;
const auth = AuthService; // 仅 auth.enabled=true 时使用
// React树中共享同一应用owner；RouteProvider可省略service并取getRouteService()。
<ServicesProvider menu={MenuService} i18n={I18nService}>
  <RouteProvider service={RouteService}>{/* app UI */}</RouteProvider>
</ServicesProvider>;
```

`bootstrap` 返回冻结的 `XuiApplication`（resolved config 与 services）。同一个 Window 上重复使用相同配置/绑定会复用既有 owner；冲突配置或重复绑定不同 service 会明确失败，不能借重复启动换 owner。`getHttpService()` 与 `getAuthService()` 在未配置时抛错；未启用 auth 时不创建认证 owner。`disposeXuiServices(window)` 从 `/bootstrap` 窄入口导出，释放该 Window 的应用注册表及其所属服务；原 `/services` 与根入口仍导出同一函数。重复释放安全，之后同 Window 再 bootstrap 建立新 owner，借用实例不被销毁。`app.services.dispose()` 用于结束容器自身，不能替代移除 Window 注册表。服务以 `{options}` 交由注册表创建，或以 `{instance}` 借用已有实例；借用实例不由 registry/React View 销毁。剪贴板借用实例的类型为 `SharedClipboardService`，只要求 `writeText`，不要求也不会调用 `dispose`；注册表只 dispose 自己创建的内部剪贴板服务。`getThemeService`、`getClipboardService` 等浏览器 getter 使用同一个 Window owner。组件级 `create*Controller` 是不同合同，仍按组件 Controller 生命周期使用。

主题配置的 `theme.mode` 是默认选择而非受控值；有效的 `ui.theme.mode` sessionStorage 用户选择优先于 config 默认。有效的 `ui.interface.scale` 同样优先于 `theme.scale` 默认。显式注入 `ThemeOptions.mode` 才是受控主题模式。公开 `init.js` 只负责首绘前恢复主题/缩放属性，不创建、订阅或拥有 ThemeController；正式文档主题 owner 由 `bootstrap`/`getThemeService` 提供。`useTheme` 订阅共享 owner，组件卸载不销毁它。

### 项目配色与首绘

`ThemePreset = 'violet' | 'ember' | 'forest' | 'crimson' | 'cobalt' | 'precision'` 从 `@coffeehc/xui-runtime/theme` 导出。默认 `config.json` 的 `theme.preset="violet"`；`theme.mode="dark"` 与配色独立。配置解析拒绝未知 preset。配方与 CSS 的唯一源在 [DESIGN](DESIGN.md#官方配色与项目品牌)。

```json
{"theme":{"preset":"forest","mode":"system"}}
```

```ts
import projectConfig from './config.json';
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {ThemeService} from '@coffeehc/xui-runtime/theme';
bootstrap(projectConfig);
ThemeService.setPreset('ember'); // 可选运行期切换；同一 document owner，无网络/存储写入
ThemeService.setMode('light');  // 沿用明暗偏好的 sessionStorage 合同
```

`ThemeOptions.preset` 是初始化配色，`ThemeState.preset` 是当前配色，`setPreset` 只更新此事实及公开根属性 `data-theme-preset`，不请求 `onModeChange`、不修改 mode、缩放或草稿。相同值不重复通知；销毁后不再写 DOM；无效 JavaScript 值安全回到 violet。配色不隐式写入 sessionStorage/localStorage，重载按项目配置初始化。`ThemeOptions.mode` 的受控行为保持原样。不要通过再次 bootstrap 更换 owner；运行期切换调用已有 `ThemeService.setPreset`。自行注入完整 ThemeController 的宿主需实现新增 setPreset 与 state.preset；普通配置调用无需实现 Controller。

首绘前项目应由**同一份项目配置**生成轻量 `window.xuiThemeOptions={preset,defaultMode}`，放在公开 `init.js` 和 CSS 前执行，再以同一配置调用 bootstrap。init 不会读取宿主 config.json URL，不创建 owner，也不请求网络；不要用另一个硬编码色板与 bootstrap 竞争。实际例子见 [主题示例的项目配置](../examples/theme-presets-react/config.json)、[首绘脚本](../examples/theme-presets-react/prepaint.ts)及[React 页面](../examples/theme-presets-react/app.tsx)。仅使用默认值时不需此项目脚本。已存在有效 owner 时，init 保留它当前的 mode/preset。

### 主题根节点恢复（4.2.38）

公开bootstrap、ThemeService/getThemeService、ThemeController和setInterfaceScale接法不变。同一Document内documentElement被替换，或React恢复复用同一html但清空其公共主题/缩放属性时，既有默认ThemeService在MutationObserver交付时自动重新投影当前mode/effective/preset及已生效scale，不用再次bootstrap、不重建服务。没有逻辑变化时保留原ThemeState对象，不调用订阅者/onModeChange，不重新读取或写入storage，不发请求；系统变化及后续setMode/syncMode/setPreset继续作用于当前根。scale复用现有文档方法的内存事实，保留首绘值、config默认及storage拒绝时的最后有效选择。

观察仅限Document直接子节点和当前html的data-theme/data-theme-effective/data-theme-preset/data-interface-scale/style；不观察页面子树、不轮询。投影写入比较现值，自己的属性写入最多产生后续空操作，不形成恢复循环；其他style属性不被覆盖。临时没有根时保留事实，重新插入后应用。destroy或容器释放断开DOM/media监听及订阅，已排队的回调不再写DOM。缺少MutationObserver的特殊环境不能承诺自动恢复，但显式主题动作仍解析当前root。

此合同恢复的是xui拥有的主题属性与--interface-scale，不恢复宿主丢失的lang/class/样式表/任意DOM，也不修复导致hydration失败的SCRIPT/扩展注入或服务端标记差异。完整自定义注入ThemeController由其owner承担同等恢复或明确限制，不能由消费者另写Observer、复制data属性或创建第二主题owner兜底。定向执行THEME-011～012；正式[bootstrap示例](../examples/bootstrap-react/app.tsx)的`?recover-document`故意制造document hydration不一致，使用真实hydrateRoot验证恢复，非产品推荐启动方式。


项目的 `theme.css` 仍用既有 `product-overrides` 层覆盖公开变量；其优先级高于六套默认配方，弹层与正文继承同一根主题。不重新导出 CSS 皮肤，不要求复制内部 DOM。保留旧青色请配置 `theme.preset="precision"`，而非恢复旧包或添加私有选择器。

默认 `i18n.enabled=false`，默认 `locales` 只有语言选项元数据，默认 `messages` 为空；xui 不随包承诺完整翻译词典。启用后 `defaultLocale` 是初始语言，`locales` 提供受支持语言；`t` 依次查当前语言、fallbackLocale、调用时的 fallback，仍未命中则返回 key。宿主可在 config 提供 messages，或对已声明 locale 调用 `registerMessages`。React `useI18n` 订阅 locale 并提供 `t/setLocale/locales`；禁用切换或未知 locale 返回 false。locale 更新同步 document lang，并使使用 `labelKey` 的 MenuService 文本随当前语言更新。`ServicesProvider` 可在 SSR 或隔离应用中显式借用 i18n/menu 实例；它不拥有销毁权。

`MenuService` 只提供 config 驱动的菜单 label/items 及语言更新；它不持有导航展开集合、活动焦点、路由或业务权限。React `NavigationMenu`/`MenuLayout` 的展开状态由 React 组件 props/Controller 持有，不能再把 runtime navigation data 当作 DOM UI controller。

`RouteService` 用浏览器 History API 维护 `uri/pathname/search/hash`；接受标准 URL，不使用 `#/` 或 `#!/` 哈希路由，不拦截全局锚点，也不发页面请求。`RouteProvider/useRoute/RouteLink` 连接同一 service 并保留普通链接修改键、下载与外链行为。部署在非根 `basePath` 时，宿主服务器仍须将深链路由 fallback 到应用 shell；xui 不配置服务器 rewrite。

`DownloadService` 复用注册表中的同一个 HttpClient；`request` 只取得 Blob 和文件元数据，只有宿主在明确用户动作中调用 `save` 才触发浏览器保存。它不自动保存、不另建 HTTP/auth owner。`getUtilService()` 返回冻结的纯函数 namespace（entityId/date/dateTime/number/download），不创建 registry、订阅、存储、网络或 UI 状态。

### 按模块导入的单例与 4.0 迁移

`bootstrap` 只解析配置、安装应用注册表、建立首绘主题并恢复缩放、初始 document lang/title。HTTP、Auth、Route、I18n、Menu、Clipboard、Download、Upload 的实现随对应模块导入；导入仅注册实现并导出稳定引用，不发请求、不读 DOM、不启动业务查询。首个方法调用从同一 Window 注册表取得唯一实例及已解析配置，避免在 bootstrap 之前捕获默认值。多个导入者调用同一 Service，不持有第二份状态。

| 窄入口 | 稳定单例引用 | 递进依赖 |
|---|---|---|
| `/config` | `ConfigService` | 默认 JSON、纯配置解析 |
| `/theme` | `ThemeService` | 文档主题、配置 |
| `/http` | `HTTPService` | 配置；启用 Auth 时请求前连接已导入的认证实现 |
| `/auth` | `AuthService` | 同一 HTTP；access 仅私有内存 |
| `/route` | `RouteService` | 配置与 History |
| `/i18n` | `I18nService` | 配置与文案资源 |
| `/menu-service` | `MenuService` | I18n、配置 |
| `/clipboard` | `ClipboardService` | 平台 writer |
| `/download`、`/upload` | `DownloadService`、`UploadService` | 同一 HTTP/Auth 链路 |
| `/util-service` | `UtilService` | 纯函数；不带 HTTP、注册表或组件状态 |

4.0 不再保证仅导入 `/bootstrap` 就加载所有 feature 实现。普通应用直接导入上述引用；保留的 `get*Service` 与 `app.services.get*Service` 使用同一 owner，但对应模块必须已加载。需要显式全量装配的隔离测试/SSR 可从 `/services` 导入 `XuiServices`；这个汇总入口有意加载全部服务，不能把它当作小体积入口。runtime 根入口同样是汇总。代码分割在宿主路由/feature 的动态 import 边界完成，不能期待单一静态 bundle 在运行时自动下载它已经包含的模块。

启用 `auth.enabled` 时需导入 `/auth`，HTTP 首次请求先连接该 owner，再决定 cookie/Bearer；认证模块缺失时在 fetch 前失败，绝不退回匿名业务请求。显式借用已有 HTTP 并配置 Auth 时，在注入阶段先绑定认证（无 IO），以覆盖宿主仍持有的原始 HTTP 引用。借用的 HTTP 必须是同一 xui transport，认证必须绑定它；销毁自有 Auth 释放自己的 binding，借用实例不由 registry 销毁。失败安装恢复此前配置/owner，允许修正后重试。

服务状态由所属 Service 独占并提供订阅；组件队列、草稿、分页和异步等待由独立 Controller 管理，React View 负责槽位、DOM 和焦点。不新增把这些事实复制一遍的 StateService，也不把每个 Controller 变成全局单例。

## HTTP 与查询

这是实现接口；完整通用规则只在 [DESIGN.md](DESIGN.md)。从 runtime/http、runtime/query 导入，React 使用同一无框架类型。React 复用 useResource/DataRegion/ErrorState，不创建第二套请求 owner。

选用 xui 默认 HTTP 解析与页面 adapter 时的合同范围及行业标准/第三方边界见[DESIGN](DESIGN.md#规范强度与职责)。OAuth2/OIDC/SAML保持标准，第三方按其API、HTTP状态及错误格式；端点明确response/errorAdapter在内部投影。标准OAuth2非2xx的error discriminator可由显式allowlist ErrorResponseAdapter映射，不能用 nested-error adapter 猜其结构，也不要求OAuth2返回AjaxResponse。

### 固定源码合同

通过正常 Git 读取的来源：

- [httpx@71f05d5 models.go](https://github.com/coffeehc/httpx/blob/71f05d5b635643313d5e1820f4a6bf1f61300f8e/httpxcommons/models.go)：AjaxResponse 为 success/message/payload/request_id/code/redirect；IsSuccess() 只返回 Success，Code 为无 omitempty 的 int64；该旧版本 ListData 为 list/total；新统一 owner 与可选字段合同见 [列表合同](PUBLIC_API.md#列表元数据与受控游标分页)。
- [同提交 utils.go](https://github.com/coffeehc/httpx/blob/71f05d5b635643313d5e1820f4a6bf1f61300f8e/httpxcommons/utils.go)：SendSuccess 的 code 由调用者传入；错误 success=false、payload=null，request_id 可能为空。
- [xagent@29139f7 成功调用](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/internal/services/apiserver/workgroup_endpoint.go) 与 [middleware](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/internal/services/apiserver/middlewares.go)：这里使用成功 code=1，X-Request-ID 单独返回；401/403 是不同 HTTP 事实。只读引用，没有改产品。
- [commons@896d1e7 query.go](https://github.com/coffeehc/commons/blob/896d1e7a80ec902cfdf739f67a82b7f49aa2b403/webfacade/query.go)、[query_test.go](https://github.com/coffeehc/commons/blob/896d1e7a80ec902cfdf739f67a82b7f49aa2b403/webfacade/query_test.go)、[select.go](https://github.com/coffeehc/commons/blob/896d1e7a80ec902cfdf739f67a82b7f49aa2b403/dbsource/sqlbuilder/select.go)：URL query；pageIndexOffset/maxPageSize 由接口决定。ParsePageQuery 无全局默认大小；BuildQuery 的缺省 30 和 AppendLimit 的 size=0 不分页也不是所有接口通用约定。

公开类型以 [http.ts](../packages/runtime/src/http.ts)、[query.ts](../packages/runtime/src/query.ts) 和正式构建声明为准，不另复制类型定义，不按旧 data/msg/items 别名猜测兼容。

HTTP状态表达传输/请求事实，AjaxResponse的success表达业务成功与否，code保留业务元数据。独立httpx/httpxcommons的SendError、SendErrors和SendErrorWithRedirect设置c.Status(statusCode)；SendSuccess的JSON分支不重设status且code由调用者指定。因此不是放弃HTTP状态或全200合同。xui支持2xx业务失败，非2xx仍是HTTP错误并保留合法code/request_id。commons/webfacade的PBResponse与SendPBError是另一实现，不能混同上述JSON合同；不同编码由 endpoint 明确选择。

### 单一传输与生命周期

浏览器应用通过 `bootstrap({http:...}, {services:{http:{options:...}}})` 配置唯一 HTTP owner，随后从 `/http` 导入 `HTTPService` 取得同一客户端；SSR/隔离实例用 `new XuiServices({http:{options:...}})`。选项包括 baseURL、fetch、headers/getHeaders、默认 response/adapter、timeoutMs/credentials、onUnauthorized/onError。baseURL 必须无 URL 凭据、为绝对 HTTP(S)；request 必须同源。ESM 导入不发请求、不读 DOM。裸 HTTP transport 不保存 token、storage、cache 或路由；headers/provider 来自宿主。绑定 [Bearer v2认证owner](PUBLIC_API.md#认证会话) 后由该 owner 私有内存持有 session access，显式 protectedPaths 业务请求强制 Bearer/omit/error，固定 cookie 端点无 Bearer/same-origin；禁止手动第二凭据、重试/redirect/credentials 覆盖。应用代码不再调用已移除的 `createHttpClient` 工厂。

request(path,options) 接收 method、headers、body 或 json、signal、timeoutMs、response/adapter/errorAdapter、endpointId、retry、detectAjaxErrors、credentials/cache/redirect。json:null 合法，json/body 不同时指定。默认 GET/same-origin credentials；Ajax/JSON 缺省 Accept: application/json，避免不明确的 protobuf 协商；json 补 Content-Type，FormData 不补 boundary。headers 合并顺序为 client→provider→endpoint。endpointId 是短逻辑标识，只含字母数字/点/下划线/冒号/连字符，不能传 URL。

按DESIGN，普通请求默认30秒、blob下载默认120秒；宿主可以明确覆盖预算。预算包含 provider、fetch、完整 body、adapter 和重试等待。取消/超时即使遇不合作 producer 也结束本地等待，不能证明服务端已停止，因此不能据此重放写操作。destroy 取消在途任务，销毁后 request 为 cancel；宿主同步释放 resource 与订阅。

### 模式与响应

| response | 行为 |
| --- | --- |
| ajax（默认） | 严格 JSON AjaxResponse；HTTP 2xx + success=true 即成功，不要求固定 code；payload 原样返回，null/0/false 合法 |
| json | 整个 JSON 值作为 payload，不猜 Go/OAuth/SCIM 形状 |
| text | 返回文本，不运行 JSON 解析 |
| blob | 返回 Blob，普通 JSON 文件合法 |
| empty | 明确无返回值，取消不需要的 body，payload=undefined；适用于声明的 204/裸状态接口 |

AjaxResponse 的 success 必须为 boolean，message/request_id 必须为 string，payload 必须存在，code 仍为必填安全整数，redirect 若存在必须为 string；不省略、不转换 code，也不接受字符串码或精度丢失。success=false 在任何合法 code 下都为业务失败。JSON 空 body/HTML/缺字段为 parse 错误，不默认为成功；204 在 ajax/json 仍不满足合同。非 2xx 保留 HTTP 事实，解析失败不把 401/403 隐藏成 parse/network；失败状态 body 超时记录 http/readFailure=timeout。

由 bootstrap/服务注册表创建的 HTTP 客户端默认 ajax 模式、ajaxResponseAdapter 与 createAjaxResponseAdapter() 共用 success 判定，code=0/1/2 或其他合法整数均不会把 success=true 改判为失败。仅端点确有额外严格合同才显式使用 createAjaxResponseAdapter({successCode})：此时同时要求 success=true 且 code 与指定值相等；不传 successCode 不启用码值限制。普通消费者不需要配置成功码或另写 parser。ResponseAdapter 接收未知解码值和 status/headerRequestId/endpointId/attempts，返回 payload 和可选 code/bodyRequestId/redirect；缺 payload 的结果被拒绝。客户端 adapter 属于默认模式，endpoint 明确换 response 模式时不继承不同模式的 adapter，也可提供 endpoint adapter。

响应为 payload/status/code/requestId/bodyRequestId/headerRequestId/redirect；非空 body id 优先 header，两者都保留，不伪造 traceId。redirect 只是数据，不触发应用导航。成功响应headers仅为冻结的contentType/contentDisposition/contentLength，超过长度或含控制字符的值为null；没有原始Response、完整Headers或请求对象，Authorization/Set-Cookie/WWW-Authenticate不会暴露。领域校验只在一次声明的 endpoint adapter；标准请求不把 null 改成其他字段。

requestDownload默认120秒与detectAjaxErrors:true，保留 HTTP 200 Go 失败 envelope 检测；HttpClient 的 blob detectAjaxErrors 与默认 JSON AjaxResponse 复用同一 success 判定，合法 success=true/code=0/1/2 等仍返回原始 Blob，并在 HttpResponse 保留 code/request id/redirect 元数据，不拆包成 payload。success=false 的合法 envelope 是业务失败；明确attachment的JSON文件保持文件，不猜为错误。resolveDownloadFileName优先UTF-8 filename*，处理引号/重复参数/无效编码并清理路径、控制字符与方向控制字符；不是文件内容安全检查。saveDownload只在宿主明确用户动作中调用，临时link和URL释放且不改焦点。下载不是JS读取认证头的理由。无流式/SSE/WebSocket/protobuf、上传进度、断点续传或文件安全校验支持声明，这些协议另行明确接入。

### 安全错误、认证与重试

HttpError.kind 为 cancel/network/timeout/http/parse/business；metadata保存status、number/string业务code、两种request id、endpointId、attempts、retryAfterMs/readFailure。HttpError.business提供显式结构化code/message/requestId，details仅在声明安全投影时存在；它不进入默认Error.message、toJSON或JSON.stringify，界面仍默认用固定安全文案。默认 message/getHttpErrorMessage 是安全固定文字，不包含 native fetch 敏感 URL、后端 message、body、headers 或 cause。领域反馈按 code 显式映射，不能直接把未知 Error.message 放入 Toast；后端仍须保证 request id 可公开展示。

onError 可一次绑定宿主反馈，cancel 不调用；交给 onUnauthorized 的 401 不重复调用 onError。同步抛错/异步拒绝不改变 HTTP 事实。必要错误同时在页面 ErrorState 可见，不能只放消失通知。

onUnauthorized 只响应实际 HTTP 401，收到响应头即通知，每个认证 epoch 至多一次；不按业务 code、403 或 redirect 跳登录。认证请求可以显式 unauthorized:"ignore"，既不通知也不消耗该 epoch 的全局 401 通知；[登录与会话](PUBLIC_API.md#认证会话) 用它将登录拒绝与会话核对留在认证上下文。ignore 的 HTTP 错误仍能交给 onError，宿主反馈可按 auth.* endpointId 避免重复。宿主确认新认证后 resetUnauthorized，旧 epoch 迟到 401 不再次失效新认证。裸HTTP不刷新token、不决定登录路由、不重放请求；绑定v2 auth后managed 401按token generation刷新但原业务请求仍抛401，不重放写入，403不刷新。移除旧onUnauthorized=>auth.expire重复失效逻辑；宿主认证切换时还应取消旧resource/key。

默认完全不自动重试，GET 也可能有副作用。只有显式 retry:{idempotentRead:true,maxAttempts} 的无 body GET/HEAD 能有限重试，maxAttempts 1–5；写方法和一次性 body 的 opt-in 在发送前拒绝。默认重试 network/429/502/503/504，绝不自动重试 401/403/business/parse/cancel/普通 timeout。delayMs/maxDelayMs 可配置，默认退避 250ms/最大等待30s；Retry-After 不提前缩短，超上限直接保留失败。signal 和整体预算覆盖退避；按钮重试仍须确认操作可重试。

### webfacade URL query 与 ListData

WebfacadeQuery 提供 page_index/page_size/return_total、filters、按优先级排列的 sort；WebfacadeContract 每接口显式 pageIndexOffset，可选 maxPageSize、filterFields codecs、sortFields 白名单，没有全局页码或上限。page_index 是 wire 值；示例将 1 基 Pagination 页码显式转换为 `page - 1 + endpoint.pageIndexOffset`。

serializeWebfacadeQuery 返回 URLSearchParams，仅编码一次；排序为 sort=name,created 与 sort_name=asc/sort_created=desc。没有 JSON/SQL AST、真实数据库列名或运算符。后端 start_id/FieldDefined 的附加排序/条件仍由具体接口定义。

filters 只能用声明字段和显式 codec。queryCodecs 为 string/int64/number/boolean/int64Array/time；不自动转换 Date/数组/对象。int64 可保留有范围校验的十进制字符串/BigInt；number 必须有限；time 必须 YYYY-MM-DD HH:mm:ss 并验证日历，不改成 ISO/millis。自定义 Convert 用明确 codec。null/undefined/空值清除，literal "null"/"undefined" 拒绝，避免后端静默跳过；保留参数和 sort_* 不作为字段，未知过滤/重复排序/无效方向拒绝。

existing params 复制后清除旧受管过滤/排序和无语义 field，保留宿主无关参数。page_size 是正 safe integer，page_index 不低于 endpoint offset，可选上限超限拒绝，不能默默改接口行为。

列表解析使用 parseListData/toListPage，保留 total 与 next_cursor 的缺省、null 和实际值；精确规则集中于 [列表元数据与受控游标分页](#列表元数据与受控游标分页)。

请求 cursor 的参数名、合法排序和 token 约束仍由 endpoint 明确声明；现有 serializeWebfacadeQuery 仍只序列化已发布的 offset query，不擅自添加 cursor 参数或兼容猜测。已有 API Key 全量读取与业务日志 offset adapter 明确请求并要求 total；缺失时失败关闭，而不是猜末页/无限抓取。业务日志领域 cursor 扩展合同另见 BUSINESS_LOGS，不混淆已有 page/snapshot 结构。

### 可运行接入

正式 [React 页面](../examples/http-react/app.tsx) 共用 [typed endpoint model](../examples/shared/http-model.ts)，仅导入公开组件/工厂和 CSS。独立 tarball、types 与真实 fetch 由 [consumer](../scripts/consumers.mjs) 和 [浏览器检查](../tests/browser/http.spec.mjs) 验证。

根目录 pnpm build、pnpm test:consumer、pnpm preview 后访问 /http-react/；本地 `/api/xui-example/records` 是明确合成 fixture，页基数0/上限50不是产品默认合同，不访问真实后端。不请求 total 时 fixture 省略字段，React 示例显示未知并隐藏编号翻页，不以当前页 list.length 伪造 pageCount；需要游标使用 DataTable 的显式 cursor 模式。

接入先检查 headers/credentials、权限、缓存/去重、认证、日志、取消、上传/下载及业务恢复；保留必要行为，再收敛一个 transport/auth/error/resource owner。选用默认 ajax/query 或页面 adapter 时严格满足其 wire 合同；其它领域协议通过明确的 ResponseAdapter/ErrorResponseAdapter 接入，不猜别名、不要求全量业务 API 迁移。已有使用方的升级按 [发布状态原则](ADOPTION.md#发布状态与升级原则) 保留必要兼容与退出条件。

删除精确重复的 fetch 拦截器/认证跳转/Toast/loading owner；保留领域 API 作为一次 endpoint adapter。移除私造 query AST、隐式页码/日期/object 转换和重复编码。按 [采用手册](ADOPTION.md) 逐页迁移、真实构建验收，不先盲删业务权限/功能。

### 非2xx结构化错误适配

`createJsonApiErrorAdapter` 明确映射 `{error:{code:string,message:string,request_id:string}}`；不猜顶层 code/msg 或 JSON:API errors 数组。其它错误协议由宿主提供 typed ErrorResponseAdapter，按实际合同投影，不将正常领域适配视为必须删除的兼容层。业务 API 或后端迁移由宿主单独决定。

ErrorResponseAdapter可在client或单request明确配置；默认 adapter 保留 Go 字段，显式按实际协议解析，并固定Accept:application/json及JSON写入Content-Type:application/json；保留其他宿主headers，不继承临时旧编码协议。HTTP status与业务code分开；任何body解析/投影失败保持HTTP事实和readFailure，不伪造成功。解码后结构化投影上限为64KiB JSON响应（当前先完整读取，非流式读取上限），message最多2048字符；details需显式allowlist投影，最多16KiB/depth8/512节点，拒绝函数/getter/prototype/cycle/unsafe整数。投影限制不等于后端脱敏；不能全量日志或直接弹出原始敏感响应。

401仍在收到响应头时按现有epoch通知，不能依赖该早期回调取得body code。需要按明确领域业务码判断失效时，显式unauthorized:ignore并由已有认证owner处理最终HttpError，不另造认证owner或吞掉401。跨origin下载需后端准确CORS与Expose-Headers允许Content-Disposition等所需字段；库不会绕过浏览器策略。

### 明确的原生应用origin与transport

桌面宿主通过 bootstrap 第二参数注入已存在的原生 HTTP transport，例如 `services:{http:{options:{baseURL:'wails://wails/',nativeOrigin:'wails://wails',fetch:bridge}}}`；服务注册表仍只创建一个应用 HTTP owner。默认只接受HTTP(S)；自定义origin必须有host，不含URL凭据/query/hash或路径（空或/），拒绝http/https/data/blob/file/javascript/mailto作为nativeOrigin。自定义同源按scheme、host、port三元组比对，绝不把不同自定义URL的origin=null当相同来源；所有目标再次拒绝凭据与外部tuple。

native请求强制redirect:error，拒绝follow/manual；bridge必须实际遵守不自动跟随/透明改目标。非空Response.url在读取body前再次校验同一tuple，302等非2xx保留HTTP事实，不追Location。Response.url可为空的合成/桥接响应需要宿主保证真实目标，库无法观察桥内部的物理IO。取消、budget、401 latch、adapter/error metadata、safe headers及下载继续使用同一HTTP owner，无模拟HTTP baseURL、JS色板或业务重放。

[合成测试](../tests/native-transport.test.mjs)覆盖wails://wails、不同host/scheme/port/凭据/返回URL/redirect、取消迟到、401状态与下载。Windows的HTTP(S)应用origin继续默认HTTP路径；Darwin/Linux自定义origin有新声明方式。三平台真实Wails窗口/bridge物理IO/Cookie/CORS/登录/下载尚未验，不能把合成fetch通过称作三平台兼容完成。

### 列表元数据与受控游标分页

#### 默认列表合同与职责

以下仅约束 runtime/query 的 ListData 与默认页面 HTTP adapter；领域 loader 可按自己的 typed 合同发布真实分页事实。默认 AjaxResponse 的 success/code 语义不变，payload 为：

- list：数组；空结果为 []。xui 的已发布 parser 仍接受旧 httpx nil slice 的 null，只有显式 toListPage 才投影 []。
- total：可省略；省略表示未计算/未知，后端无需执行 COUNT。存在时为真实非负安全整数，包括真实 0；null、字符串与丢精度整数不被 xui 接受。
- next_cursor：可省略；非空、最多 4096 UTF-8 字节的 opaque string 表示下一次请求 token，null 表示 cursor 明确末页。字段缺失仅表示端点未声明 cursor 状态，不能当末页。可与 total 同时存在。

offset 端点可省略 next_cursor；cursor 端点每次明确给出 token 或 null。总数计算是 endpoint/查询 owner 的显式选择，组件与 parser 不发 COUNT、不强制每页计算、不凭当前数组长度推断总数或是否还有页。

使用默认 adapter 的服务应满足该明确合同；共享 fixture 不证明产品后端、生产 route 或数据库 COUNT 性能已验证。

#### 公开前端入口

1. 从 @coffeehc/xui-runtime/query 导入 ListData、parseListData、toListPage，保留已有 HTTP/resource owner。HTTP envelope 的解析和成功判断不变。
2. ListData.total 从必需 number 扩为可选 number，next_cursor 为可选 string|null。直接使用 total 的 TypeScript 消费者需要处理 undefined；旧带 total 的 wire 与调用行为保持。
3. toListPage 的 total 为 number|null；returnTotal:false 仍不将旧占位数当真实总数，即使响应有数也投影 null。returnTotal:true 时缺失同样为 null；实际计算出的 0 原样保留。
4. toListPage 仅在 wire 存在 next_cursor 时返回 nextCursor。cursor adapter 必须检查 nextCursor !== undefined，再将 string|null 传组件；不得写 nextCursor ?? null 掩盖未声明状态。
5. 已有 offset DataTablePagination 不用改形状，显式 mode:'offset' 可选。采用 DataTableCursorPagination 时只传 pageSize/total/nextCursor/hasPrevious 与受控回调，见 [DataTable](COMPONENTS.md#数据表格)。历史与查询变化重置仍由已有宿主掌管，控件不解码 token、不假造页数。
6. 不需要总数的新列表默认选择不计算；需要总数的现有 offset 功能按其显式合同请求。Key 管理全量 adapter 仍要求 total 来验证完整读取，业务日志默认 offset loader 同样要求 total；缺失时拒绝，不能误切 cursor 或猜结束。
7. serializeWebfacadeQuery 不变：page_index/page_size/return_total 和 filter/sort 合同仍显式。具体 cursor 请求参数留 endpoint adapter；库不新增未经后端定义的通用 query AST。

新端点采用 [commons 的严格 ParsePaginationQuery](https://github.com/coffeehc/commons/blob/2fd78215cf5321b9dc9b12d5f02c90567ce3cc71/webfacade/pagination.go) 时，cursor 请求使用 page_size 与显式 return_total=false；首屏省略 cursor，续页将原 token 交 URLSearchParams 编码一次，不发送 page_index，也不把 null/空串序列化成 cursor。端点显式声明模式、页大小上限和过滤字段；旧 offset serializeWebfacadeQuery 与页基数合同不变。后端服务/存储必须实际跳过 COUNT，仅把算出的 total 从 JSON 隐去不算完成性能目标。

ACL/权限过滤后的有界扫描可以连续返回空 list 与非空 next_cursor；这仍可继续翻页，不保证下一页含记录，也不表示剩余数量。仅显式 null 表示 cursor 末页，DataTable 不因空行禁用下一页。宿主在成功后才提交 rows、cursor 和历史，失败/取消保留已确认事实，筛选与条数变化由同一查询 owner 重置历史。

共享 wire fixture 为 [webfacade-list.v1.json](../tests/fixtures/webfacade-list.v1.json)，固定来源为 [commons@2fd78215 的同一文件](https://github.com/coffeehc/commons/blob/2fd78215cf5321b9dc9b12d5f02c90567ce3cc71/webfacade/testdata/webfacade-list.v1.json)。它包含可选元数据、legacy nil slice 与非法响应，不代表真实业务服务完成迁移。实际执行范围见 [VALIDATION.md](VALIDATION.md)。

### 显式实体身份编码

从 `@coffeehc/xui-runtime/entity-id` 或根入口导入 `EntityIdEncoding` 与 `parseEntityId`。编码只有 decimal/hex；`parseEntityId(value, encoding='decimal')` 返回验证后的原字符串，不转 JS Number、不改写或猜格式。

- decimal 为无前导零的正十进制，最大 `9223372036854775807`。
- hex 为无前缀、无前导零的小写正十六进制，最大 `7fffffffffffffff`。
- 数字类型、零、负数、符号、空白、hex 大写/前缀、溢出和未知编码均拒绝。
- 两种字符集有交集：`"10"` 在 decimal 为十，在 hex 为十六；前后端必须选择同一合同。

`bootstrap({auth:{enabled:true,idEncoding:'hex'}})` 配置同一应用 Auth owner，`parseAuthSession(value,'hex')` 提供同一安全 DTO 解析；未知配置在网络请求与 owner 绑定前拒绝。`createApiKeyHttpAdapter({http,idEncoding:'hex'})` 与 `parseApiKeyWireMetadata(value,'hex')` 使用同一编码校验 list/create metadata、revoke/delete 确认及目标路径；非法动作目标在发送前拒绝，响应 ID 必须精确匹配目标。权限/期限 ID 是业务代码，保持原合同。

省略编码等同 decimal。选用配套 baseservice facade 时，其 Options.IDEncoding 同步配置为 idservice.HexIDEncoding；内部模型、鉴权、数据库和密文 AAD 不变。业务日志没有相应 hex 选项，不能从认证配置推断。纯 ApiKeyAdapter/controller/视图仍允许宿主自己的不透明 ID，不将所有领域接口强制成数值身份。

[共享身份矩阵](../tests/fixtures/contracts/identity-encodings.v1.json)、[hex 认证 fixture](../tests/fixtures/contracts/auth.v2.hex.json) 与 [hex Key v2 fixture](../tests/fixtures/api-key-contracts.v2.hex.json) 验证明确编码；Cookie/Bearer 隔离、内存凭据、取消/迟到和不重放规则不变。响应格式失败不暗中回退另一编码，也不能把后端已提交但投影失败称作回滚。

公共认证视觉由`@coffeehc/xui-react/login`的`AuthPage`统一；2.0.1采用Stitch V3的卡片外品牌与卡片内表单。现有配置、完整登录/初始化回调和Controller接口不变；slot、字体、颜色和空状态逐项见[认证布局](COMPONENTS.md#认证布局-slot-归属)，不要让宿主再造认证布局或改变请求协议。

`/admin-setup` 同时导出不生成页面的 `AdminSetupForm`，支持与完整页相同的默认/注入 Controller 和提交合同。检查→初始化保持一个AuthPage时，将它放入children并从首次挂载省略AuthPage.form；完整页复用同一个表单。slot、清密与组合限制见[初始化组合](COMPONENTS.md#可组合初始化表单)。此项不增加认证/初始化API或自动检查。可选同步纯函数 `validateUsername(rawUsername): string | null` 在Form/Page默认模式或Controller options配置，null通过，非空字符串为可翻译字段反馈；必填优先，输入和提交值不变，异常/非法返回使用可选labels.usernameInvalid。注入Controller时不再传该prop，详见[用户名校验](COMPONENTS.md#宿主用户名校验)。

## 认证会话

`ConfigurableLoginPage` 使用由 bootstrap 注册的同一 `getAuthService()` owner，保持现有默认主题、布局、扩展、密码清理和安全回跳。这个自有应用合同配套 baseservice authenticationservice/webfacade；不是 OAuth/OIDC token endpoint，不替换第三方标准协议，不表示任何业务项目、生产登录链或部署已迁移。

### 固定 HTTP 合同

`AuthService` 首用按 bootstrap 配置创建 AuthClient 并绑定注册表中同一 HTTP service；也可在 `environment.services.auth` 中借用完整 AuthClient。一个 HTTP transport 只能有一个认证 owner；不创建并行 fetch、token store 或第二个401拦截器。认证预算默认15秒。地址始终为根路径，不附加 baseURL 的路径、不猜 token/me/state 等旧路由。应用代码不再调用已移除的 `createAuthClient` 工厂。

| 操作 | 固定端点 | 请求凭据 | 成功 payload |
| --- | --- | --- | --- |
| login | POST /api/v1/auth/login，JSON username/password | 无 Authorization，credentials:same-origin | IssuedSessionV2 |
| refresh | POST /api/v1/auth/refresh，JSON {} | 无 Authorization，仅恢复 Cookie，credentials:same-origin | IssuedSessionV2 |
| currentUser 的 session 核对 | GET /api/v1/auth/session | session access Bearer，credentials:omit | AuthSessionV2 |
| logout | POST /api/v1/auth/logout，JSON {} | 无 Authorization，仅恢复 Cookie，credentials:same-origin | null |
| changePassword | PUT /api/v1/auth/password，JSON current_password/new_password | 当前access Bearer，credentials:omit | 独立schema_version:1的changed/reauthenticate确认 |

以上请求统一 `Accept:application/json`、写入 `Content-Type:application/json`、`cache:no-store`、`redirect:error`，无自动重试。成功外层严格采用 httpx `AjaxResponse`：success/message/payload/request_id/code；业务成功仍由 success=true 决定，code 为安全整数。HTTP状态与业务码分开，不猜 data/msg 等别名。

AuthSessionV2 = `{schema_version:2,user:{id,username,display_name}}`。
IssuedSessionV2 在上述字段之外恰有 `access_token`、`token_type:"Bearer"`、`expires_at`。该含秘密 DTO 的解析器不公开；login/refresh 返回值只有 user。`parseAuthSession` 只接受无 token 的 session DTO。

用户 id 默认是正十进制 int64 字符串；`bootstrap({auth:{enabled:true,idEncoding:"hex"}})` 与 `parseAuthSession(value,"hex")` 可明确选择小写无前缀/前导零 hex。两者范围均为正 int64，不得转JS number；未知编码立即拒绝。详见 [共享实体编码](PUBLIC_API.md#显式实体身份编码)。username 非空、最多128 UTF-16单元；display_name 为null或最多256单元。拒绝额外字段、getter、旧版本、角色/权限/tenant投影。`access_token` 使用 `<prefix>-v1-sha256-access-<secret>`：prefix 为 `[a-z][a-z0-9]{0,31}`，secret 是32字节随机值的43字符规范无padding base64url。客户端仅接受 v1、sha256 和 access 类型的结构；服务端仍按配置前缀、凭据记录及 scope 校验，不能凭标识直接授权。此处 v1 是凭据格式版本，与 HTTP DTO 的 schema_version=2 分开；sha256 是高熵凭据摘要算法，不是密码算法，也不表示 JWT。新基线不接受旧无版本格式。expires_at 为尚未到期的UTC RFC3339；服务器默认access寿命5分钟，可由后端显式配置，不将JWT解码结果当作服务端权限。

用户名提交前trim；密码不trim且最多4096字符，只在POST body使用，不进入回调、URL、storage、日志或state。返回的 identity 不是授权决策依据。

### 自助改密

`AuthClient.changePassword(credentials, {signal?})` 与同一个 `AuthService.changePassword` 只消费上表固定PUT；`PasswordChangeCredentials`恰为`{current_password:string,new_password:string}`。没有备用URL、通用auth白名单、token getter或新认证owner。新密码沿固定6–32 Unicode码点校验；当前密码不trim/重用新密码长度规则，须有效Unicode且最多128 UTF-8字节。参数复制仅在提交作用域内，调用者对象不被AuthClient修改；不进入快照/URL/storage/日志。公共表单会立即清除自己的传入对象及DOM。错误只保留安全HttpError元数据，不透传服务端message/business。

成功AjaxResponse payload必须恰有`{schema_version:1,changed:true,reauthenticate:true}`，别名/额外字段/错版本/false均拒绝；此schema独立于登录v2。方法返回`Promise<void>`，只在严格确认后resolve。成功由原auth owner清access/user、使旧读取代次失效、结束busy，并用原同源epoch通道的password事件通知兄弟标签页本地失效，必须重新登录；不发额外logout/refresh/session，不签发或返回token。服务端全部旧会话撤销是BaseService权威事实，xui不模拟撤销服务器记录。

| 结果 | Auth行为 | 重试/反馈 |
| --- | --- | --- |
| 完整官方400/403/429/501拒绝 | 恢复仍属同一代的此前会话，保留安全error | 宿主可让用户修正后明确重提，绝不自动重发 |
| 401或409冲突 | 清本地凭据并使旧响应失效 | 重新登录；不触发401自动refresh |
| 50302 | 本地失效，按官方码识别已提交但后续失败；Promise仍reject | 表单显示已更改/后续未完成，不能再次写入 |
| 50301/其他5xx、传输/解析失败、发出后取消/超时 | 本地失效且通知同源标签页；不能推断密码是否已提交 | 明确结果未知，重新登录核对，不重发或用session读取冒充改密确认 |
| 排队且尚未调用请求时取消 | 恢复此前本地身份 | 取消不是服务端已写入的证据；表单仍保守锁定本次未知等待 |

默认15秒是该命令从取得当前access、等待同源锁到写入/读响应的共同预算；前置恢复只由现有owner合并，取消某个等待者不破坏其他refresh调用。拿到access后开始新的命令代次，取消旧session/refresh读取；写入期间拒绝新的session/refresh/重复改密。旧代迟到成功、401、异常和取消不能覆盖后续新登录；expire/cancel/destroy与跨tab身份事件沿同一代次隔离。改密在锁内实际派发前预留数字水位，成功/未知/取消沿用该序号；迟到失败不再分配比新登录更新的序号，未派发的取消不广播。写入无通用retry和确认性重放。成功/未知及全局cancel/expire/destroy中的改密intent会锁定当前owner重新登录，禁止后续currentUser/refresh自动恢复旧凭据；只有明确的新登录或同源新登录事件解除。BroadcastChannel/Web Locks可用时复用原跨tab机制，只有epoch/kind，无密码/token；缺少这些平台能力时仍由服务端鉴权/撤销裁决，不承诺即时跨tab通知。

React组合与关闭/卸载合同见[自助改密表单](COMPONENTS.md#自助改密表单)，合成示例[password-change-react](../examples/password-change-react/app.tsx)。固定官方fixture来源为BaseService `5e2c906bcb19913bbbd1959bf06d7463f486edb4`的`docs/contracts/password-change.v1.json`，本库只读核对，不修改后端。

### 一个内存 owner 与显式保护端点

从窄入口引用同一 HTTP/Auth，例如：

```ts
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {HTTPService} from '@coffeehc/xui-runtime/http';
import {AuthService} from '@coffeehc/xui-runtime/auth';
const app = bootstrap({
  http: {baseURL: location.origin},
  auth: {enabled: true, protectedPaths: ['/api/v1/orders/', '/api/v1/profile']},
});
const http = HTTPService;
const auth = AuthService;
await auth.currentUser();
```

protectedPaths是精确路径，或以斜杠结尾的子树前缀；只接受规范根相对路径，不能带query/hash/URL/百分号。`/api/v1/orders/`不会匹配`/api/v1/orders-other`。HTTP首先规范化请求URL并校验同配置origin；认证owner拒绝歧义编码路径与直接绕过owner调用固定auth端点。前端路径表只是防止发送凭据到错误端点，后端仍必须独立校验route policy、身份、资源和权限。

声明的业务端点集中注入 `Authorization: Bearer <access>`，强制 `credentials:omit`、`redirect:error`，拒绝调用方覆盖或generic retry。已有静态headers/getHeaders/单请求headers若混入Authorization、Cookie或X-API-Key，发送前报安全错误，不静默覆盖第二凭据。CSRF及其他非秘密宿主header仍合并。未声明公共端点不会收到本owner的access。请求及非空Response.url都校验目标origin；自定义fetch必须真正遵守redirect:error，不能在内部透明改目标。

本owner只持有session access。API Key供Agent/集成使用，不从登录页签发或保存为会话；不要把API Key注入这个session owner。后端session scope是当前用户权限；API Key scope是当前用户权限∩key grants，受固定namespace用途和host资源策略约束。相同Bearer语法不意味着相同scope，session endpoint只接受session credential。

access和expiry只存在闭包内存，public AuthState、login/refresh/currentUser返回值、广播、日志和缓存没有token。禁止localStorage/sessionStorage/URL/共享channel存token。owner销毁后原registry的HTTP继续失败关闭，不自动复活；完整释放容器后，新隔离容器可显式重新绑定尚存活的借用HTTP。销毁auth不等于服务器logout。

### 会话初始化、401与并发

公开接口为 `getState/subscribe/currentUser/refresh/login/logout/changePassword/cancel/expire/destroy`。state仅有status、user、busy、safe HttpError，不暴露secret/expiry。

- 新页面第一次currentUser先进行一次cookie refresh，再以新access调用session核对。缺失/过期恢复凭据401是正常anonymous，后续不会循环bootstrap。这支持现有默认整页location.assign；目标页同样先连接owner并currentUser。没有把默认导航强制改SPA。
- access到期或将到期时，只在业务请求需求发生后refresh，不做后台keepalive。
- 已发送业务请求的401只对它使用的access generation失效，合并一个refresh；原业务请求仍拒绝401，绝不自动重放写入。旧代迟到401不会清掉较新login/refresh结果。403不触发refresh，不变成“未登录”。若宿主要重读，必须明确是幂等读，由该领域owner最多重试一次；该auth owner禁止generic retry。
- 同tab refresh和session核对singleflight。取消一个调用者的signal仅撤销该等待者，不取消其他等待者共享的刷新。显式auth.cancel/destroy才取消owner执行并抛弃迟到结果。
- login/refresh/logout按本地队列串行；支持Web Locks的浏览器还按同origin锁跨tab串行。logout先清本地access，等待已在途refresh完成后使用浏览器最新恢复cookie撤销整个family。新login/退出意图阻止旧请求恢复旧identity。
- BroadcastChannel只发送不含token/user的kind/epoch。复用Web Locks串行已提交变更，并以同源localStorage的`xui.auth.clock.v1:<origin>`保存唯一数字水位，避免同毫秒旧身份事件使后完成的新登录失效；水位不是会话/操作记录，不用于恢复或判定认证。禁止在此键保存秘密。storage被禁用时不阻断认证，退回本地水位并拒绝重复/同值事件；缺少共享storage、Web Locks/广播或存在同源不同版本/非xui客户端时不承诺跨窗口完整排序/即时失效，后端事务和会话凭据规则仍是事实来源。

不要保留旧 `onUnauthorized:()=>auth.expire()` 作为第二个失效owner。managed Bearer由auth按generation处理401；宿主订阅认证变化并清理所属resource、私密草稿、连接和业务缓存。HTTP onUnauthorized可观察事实，但不要在其中再次清理/触发refresh或重放。

### 不确定结果与普通会话核验

| HTTP / code | 含义 | 前端行为 |
| --- | --- | --- |
| 400 / 40001 | 无效认证请求 | 显示安全错误 |
| 401 / 40101 | 无效/过期/撤销/错误用途/登录拒绝 | session/refresh匿名；login拒绝可保留之前已确认会话 |
| 403 / 40301 | 已认证但kind/scope/resource被拒绝 | 不刷新、不重放 |
| 409 / 40901 | 旧 refresh 凭据已消费或发生刷新竞争 | 显示错误；不自动重发原请求，允许用户重新登录 |
| 429 / 42901 | 限速 | 不自动重试 |
| 503 / 50301 | mutation 提交结果未知 | 重新读取当前会话，不假称操作回滚 |
| 503 / 50302 | 已提交但后续失败 | 重新读取当前会话，不假称回滚 |
| 503 / 50300 | 依赖不可用 | 保留失败事实 |

正常 login 直接发送一次 POST，不先建立恢复会话或写入持久门禁。login 超时、网络断开或结果无法确认时，清理内存 access，再通过既有 refresh→session 接口核验一次；核验中的候选凭据只供内部 session 使用，确认本次账号后才发布已登录状态。未确认时保留安全错误、结束 busy，允许用户再次提交。不自动重发 login，也不轮询。refresh/session 的读取失败同样结束等待，后续由用户或既有页面初始化重新读取。取消共享等待者仍不影响其他等待者。

本地取消不能撤回已经执行的 Set-Cookie，也不能读取 HttpOnly Cookie。退出失败不宣称已安全退出，不以 logout 作为 refresh 失败的补救。服务端会话事实负责最终结果；前端没有恢复弹窗、专用 Lookup/Resolve 或跨重载写入锁。

### 未知退出与页面重载

“未知退出”指同一个Auth owner的`logout()`最终reject且状态仍为`unknown`；不是每次logout请求收到错误就已经结束。退出意图先清本地access/user并使旧读取代次失效。除显式取消等停止等待路径外，原owner可在一次既有`refresh → session`核验中确认结果：refresh的401可确认匿名并使logout完成；若仍存在会话或读取无法确认，则保留`unknown + error`、`user:null`、`busy:null`，不得把它称为服务器已安全退出。该核验的候选凭据不发布成已登录身份。宿主不得再叠加核验循环或重发logout。

| 阶段/上下文 | 公共行为 | 宿主必须完成的接线 |
| --- | --- | --- |
| 退出意图开始或最终未知 | 本地身份已清除；未知不等于Cookie撤销 | 隐藏私有页面，停止/取消领域读取并清理所属私密缓存，隔离迟到响应；保留必要的未知结果反馈 |
| 同一个owner最终保留logout错误，挂载/重挂ConfigurableLoginPage | 无busy时可手动提交普通login；该logout错误不触发登录页自动session初始化，也不生成专用恢复按钮 | 复用原owner，用户提交后走一次正常login；登录未确认时领域读取继续停止，确认身份/权限后再恢复 |
| 普通refresh/session读取发生可恢复的网络/超时/HTTP 5xx失败 | 4.2.30公开登录页非busy且未认证时显示现有checkSession检查动作，调用同一AuthClient.currentUser，无自动重放 | 此入口是普通读取错误重试，不恢复旧“检查登录状态→进入工作空间”的退出专用流程 |
| 主Document真正重载、新标签页或重新创建Auth owner | 原内存中的unknown/error不保留；新owner从unknown且无error开始，正常初始化可refresh/session并按服务端事实发布身份 | 不在读取完成前显示旧私密数据或启动领域请求；确认authenticated后才允许恢复，401匿名不循环读取 |
| bfcache恢复且仍是同一个owner | 不是新Document初始化；LoginView按现有状态resume，保留的logout unknown/error不会凭pageshow清掉 | 记录pageshow.persisted与实例身份；不人为销毁重建owner、清除错误或调用额外读取来绕过未知退出路径 |

同owner的普通登录按钮是现行可用入口，不要求另建恢复组件。宿主须分别记录“明确手动login”“Auth内部的一次结果核验”“新Document的正常初始化”；不能把三者的请求合并后断言所有refresh/session均非法，也不能用初始化读取成功冒充原logout已成功。

当前合同没有持久的“必须手动重新登录”门禁。localStorage中的数字协调水位只用于事件排序，不能恢复或判定认证；不得用URL、storage标记、假anonymous状态或前端Auth适配层宣称跨重载退出已确认。真实Cookie/服务器会话撤销仍由后端裁决。若产品要求刷新后也始终禁止自动会话恢复，应列为不同的公共合同请求，不能从本节或“无恢复弹窗”推导该能力。严格测试迁移时删除旧退出恢复按钮断言，同时保留未知反馈、零写入重放、私密读取停止、迟到隔离和不同初始化上下文的断言。

### Cookie、CSRF与后端责任

恢复cookie名 `__Host-baseservice-refresh`：HttpOnly、Secure、SameSite=Strict、Path=/、无Domain；只有后端明确development-only insecure模式才使用 `baseservice_refresh`。重复/替代名cookie、Cookie/Header混用、legacy会话cookie、错误purpose或API Key不能作为session/refresh fallback。

Cookie mutation必须在外层事务确认后才发送新secret/Set-Cookie；unknown/postcommit失败不得签发或清cookie。logout缺cookie幂等成功；已消费旧cookie409不得清cookie或撤销仍有效family。family默认绝对8小时、空闲30分钟；账户禁用、密码变更/会话撤销必须使family失效，重新启用不能复活旧family。

包括login在内的所有cookie写入需要后端严格CSRF：baseservice由宿主Options.CSRF精确校验Origin，可结合Fetch Metadata和缺header策略；JSON Content-Type仅为辅助，配套准确CORS、限速及枚举防护。本合同不新增自定义CSRF token/header。前端same-origin credentials和JSON并不提供完整CSRF保证。当前默认owner只支持同源cookie恢复；不自动开启跨origin include，也不读取/制造CSRF token。标准OAuth/OIDC/SAML仍由宿主按标准流程集成。

### 验证与采用

[共享wire fixture](../tests/fixtures/contracts/auth.v2.json)与[baseservice 0f5dba4](https://github.com/coffeehc/baseservice/blob/0f5dba4392279ccf85bba262ae4f453ea57bd579/docs/contracts/auth.v2.json)固定字节一致（配套[后端合同](https://github.com/coffeehc/baseservice/blob/0f5dba4392279ccf85bba262ae4f453ea57bd579/docs/bearer-auth-v2.md)），含issued/session/logout和8类错误。unit覆盖严格DTO/凭据隔离/恢复/多401/旧代响应/取消等待者/refresh-logout排序/不确定结果/不重放。正式 React 消费者只用公开入口和 tarball。浏览器测试覆盖整页导航恢复、Cookie/Authorization 隔离、跨 tab 锁与安全通知；实际执行范围见 [VALIDATION.md](VALIDATION.md)，测试存在不等于全部场景通过。

选用 bootstrap Auth service 时后端须满足明确 Bearer v2 合同，修改 baseURL 不能替代协议适配；已有消费者按自己的版本与升级约束评估。产品对外hex ID使用已提供的显式 idEncoding，并与后端 facade 同步配置，不自动接受双格式。注册、密码重置、用户生命周期和业务资源策略由实际后端/身份提供方负责。真实服务注册、部署和凭据签发由宿主负责。

普通 HTTP 接线使用 [auth-direct-http.mjs](../tests/integration/auth-direct-http.mjs)：显式启动 BaseService 的 loopback `TestDirectHTTPFixture` 后，以 `XUI_AUTH_HTTP_FIXTURE_ORIGIN=http://127.0.0.1:<port>` 运行脚本。它核对直接登录、普通 session/logout、真实响应丢失后的单次 refresh/session 和显式重试；传输层 Cookie jar 与业务账户均为合成替身，不证明真实 PostgreSQL、浏览器 Cookie 或产品部署。

## API Key 管理

此页面管理自有平台向 Agent 等集成签发的访问密钥，不是上游供应商凭据配置。通用规则仅在 [DESIGN](DESIGN.md)，统一前后端标准见 [默认适配器前置](PUBLIC_API.md#默认适配器的服务前置)。第三方 provider、OAuth/OIDC 等遵循原有行业协议，不强制套用此 facade；没有真实业务接口时记录前置缺口，不制造成功 adapter。

### 公开页面与业务能力

`ApiKeyManager` 使用 `createApiKeyManagerController`。权限、期限、默认值和授权确认来自服务/宿主，不能由 UI 猜测。创建要求 `canCreate:true`；行 capabilities 分别声明 `update/revoke/deleteRecord`，未知默认不启用。通用域 adapter 可使用明确 `canUpdate/canRevoke/canDeleteRecord`，但服务端的明确 false 不能被宿主 true 覆盖。后端始终重新鉴权。

- create：name、permissionIds、expiryId、可选独立 confirmed；required 权限必须选中，disabled 权限不可选择，冲突配置拒绝。
- update：`openUpdate(id)/setUpdateDraft/submitUpdate` 编辑 name、permissionIds、enabled；可增加/移除宿主声明的权限，四个 scope 也使用同一权限集合，不写产品私有分支。required/disabled 规则仍适用；`validateUpdate(draft,key)` 可返回安全的 name/permissions 错误。没有完整已知 enabled 事实时不提供编辑入口，避免猜测启停状态。
- 暂停/恢复使用 enabled；暂停显示 disabled，不是 revoke。revoked 密钥不可更新或恢复；不重新显示完整密钥。
- revoke：使凭据失效；过期但未撤销的密钥仍按实际 capability 授权撤销。
- deleteRecord：仅删除已经 revoked 的管理记录，独立确认及 capability；不撤销活动凭据、不删除业务记录。

`ApiKeyAdapter.update` 返回真实公共 metadata；revoke/deleteRecord 成功返回 void。通用 custom adapter 的 update、metadata.version/enabled/capabilities.update 均可选，供独立展示、领域/第三方边界与测试；第一方公共Key接入按服务前置直接使用官方HTTP adapter。唯一公共页面由React实现，使用统一表单、选择器、弹窗、错误和焦点生命周期。

### 页面内客户端分页

`ApiKeyManagerProps.pagination` 可省略、设为 `false` 或配置 `ApiKeyManagerPagination`。默认对 `controller.getState().rows` 的完整已载入集合使用 `pageSize=10` 和 `[10,25,50]` 选项；可通过 `defaultPageSize`、`pageSizeOptions` 覆盖。传 `false` 时显示完整集合并隐藏分页。`tableLabels?: Partial<DataTableLabels>` 只覆盖公共 DataTable 文案。

这是客户端展示分页：adapter.list 仍按其既有完整读取合同请求服务，页面翻页和改页长不发新请求；显示的 total 仅为当前完整已确认 `rows.length`。它不会把后端服务分页误报成页面分页，也不会改变 CRUD、请求参数、授权、controller 或列表刷新 owner。初次列表未完成前不显示分页；刷新后保留当前页范围并对缩短后的集合夹紧到有效页。

```tsx
<ApiKeyManager controller={controller} />
<ApiKeyManager controller={controller} pagination={{defaultPageSize:20,pageSizeOptions:[20,50,100]}} />
<ApiKeyManager controller={controller} pagination={false} />
```

### 默认 HTTP adapter：严格 v2

`createApiKeyHttpAdapter({http,timeoutMs?,pageSize?,maxRecords?,idEncoding?})` 复用宿主已有 HTTP/auth owner，直接调用普通业务接口。旧默认 HTTP v1 调用须显式升级，不静默回退旧 endpoint、缺省版本或授权。URL 仍为 `/api/v1/api-keys`，DTO `schema_version` 为 2。所有请求 no-store / redirect:error，无写入自动重放；AjaxResponse 以 success=true 判定业务成功，code 为必填安全整数而非固定成功数字。

| 操作 | 方法/路径 | 请求和 payload |
| --- | --- | --- |
| 配置 | GET /api/v1/api-keys/capabilities | schema_version:2、can_create、permissions、expiry_options、default_expiry_id、default_permission_ids、confirmation_label |
| 列表 | GET /api/v1/api-keys | 基数0 page_index/page_size/return_total=true/sort=id/sort_id=asc；ListData {list,total} |
| 创建 | POST /api/v1/api-keys | {name,permission_ids,expiry_id,confirmed}；{schema_version:2,metadata,secret} |
| 更新/启停 | PUT /api/v1/api-keys/{id} | {expected_version,name,permission_ids,enabled}；{schema_version:2,id,operation:"update",completed:true,metadata} |
| 撤销 | POST /api/v1/api-keys/{id}/revoke | {}；{schema_version:2,id,operation:"revoke",completed:true} |
| 删除管理记录 | DELETE /api/v1/api-keys/{id}/record | 无 body；{schema_version:2,id,operation:"delete_record",completed:true} |

wire metadata 为 id/name/prefix/permission_ids/created_at/expires_at/last_used_at/可选 last_used_at_pending/status/version/enabled/capabilities{update,revoke,delete_record}。nullable 字段必须明确 null，status 为 active/disabled/revoked/expired/unknown/null；version 必须为规范正 int64 十进制字符串（与 ID 编码独立），enabled 为明确 boolean。metadata 不允许 secret/token 等额外字段。内部公开 metadata 使用 camelCase，仅精确映射一次。

默认 ID 编码 decimal，可显式 hex；列表/创建/响应确认/请求路径采用同一规范正 int64 编码，发送前拒绝非法目标。权限和期限代码不受影响，custom adapter 仍可使用不透明 ID。详情 [HTTP 与查询](PUBLIC_API.md#显式实体身份编码)。

`last_used_at_pending:boolean` 只映射为 `lastUsedAtPending`。true 显示“待保存”，false/缺失各自保留；不从本机时间、nullable 时间或状态推断。访问元数据待保存不是写入事务 pending。分页完整收集预算30秒、每页最多200、默认最多5000条（显式可至100000）；拒绝变动 total、重复ID、缺页、超限，不承诺跨页原子快照。

### 提交、超时与刷新

controller 用当前页面的 `actionBusy` 防止重复提交；创建/保存按钮禁用并显示“正在创建／保存”，成功后展示真实结果。正常路径没有恢复会话预请求、持久 operation store、写入门禁或专用恢复弹窗。

写请求超时、网络断开或返回结果无法确认时，只通过 `adapter.list({signal})` 重新读取一次普通列表。列表成功就展示当前记录；读取失败保留可见错误和已有数据。结束本次等待后用户可以再次操作，不自动重发创建、更新、撤销或删除请求。列表是当前业务状态，不将同名记录当作原请求的提交证明，也不能取回丢失的一次性完整值。更新重新采用列表中最新 version，再由后端以 expected_version 校验。

`ApiKeyAdapter` 只包含 list/create/revoke 和可选 update/deleteRecord；`ApiKeyWriteContext` 仅传 AbortSignal。没有 prepareWrite、reconcileWrite、resolveWrite 或 writeGuard 配置。HTTP 写入无需 operation ID/fingerprint headers；服务端不再提供 Lookup/Resolve 路由。

关闭、pagehide、卸载或 destroy 中止所属等待并丢弃迟到结果，不声称撤销已提交写入。宿主切换服务器、账号或租户时销毁旧 controller 和所属资源，按新身份重建；后端始终重新鉴权，保留事务和并发更新校验。

### 一次性值与验证边界

完整值只在 controller 私有内存结果中，readSecret 仅允许 result 视图读取；不进入公开状态、列表缓存、URL、storage、日志或业务 payload。关闭/pagehide/卸载同步清理 DOM value/defaultValue/textContent。复制必须是用户明确动作，失败允许手动复制；不承诺 JS 内存物理擦除或撤回剪贴板。

baseservice 的 apikeyservice/webfacade 配套严格 v2。共享 [decimal](../tests/fixtures/api-key-contracts.v2.json) / [hex](../tests/fixtures/api-key-contracts.v2.hex.json) fixtures 核对 exact body_text、普通 headers、CRUD 和 ID 编码；旧 page-contracts.v1 仅归档，不表示服务兼容。

[shared capability-model](../examples/shared/capability-model.ts) 的 React 消费者演示普通 v2 请求和编辑启停；全部是 FAKE 合成数据，不证明真实鉴权、部署或生产接入完成。宿主保留自己的业务权限、namespace、CSRF、限速和服务端存储策略。

迁移时删除旧 writeGuard/recovery 配置及 Lookup/Resolve 接线，同步升级 xui 与 BaseService；不删除线上业务数据或执行数据库清表。custom adapter 按真实领域接口实现普通 CRUD，已有 read/write、独立 confirmed、期限和管理记录删除语义继续保留，不强制第三方采用 BaseService 协议。

## 业务日志

4.2.29新增React `BusinessLogExplorer.labels?: Partial<BusinessLogLabels>`，三种Controller模式实时更新整页文案；默认模式当前options.labels也实时生效。runtime新增纯`resolveBusinessLogLabels(overrides?, base?)`和可选state.errorKey/detailErrorKey（BusinessLogFeedbackKey）、filterErrorKey（invalidFilter），旧字符串及Controller.labels保留兼容。优先级、替换/移除、错误回退及无需请求的连续性合同见[组件规范](COMPONENTS.md#业务日志整页标签热更新4229)。不改loader/HTTP/认证/wire，也不把业务事实或时区当成labels转换。

4.2.34统一为列定义与cell：React `BusinessLogExplorerListPresentation.columns`为`{id,header,width?,overflow?,cell?}[]`，不指定cell读`event[id]`或显式`attributes[id]`原值，指定cell使用完整React返回结果（包括空值）。context公开只读rowId/columnId/event/value/text/content。无全局defaultCell，不保留字符串columns和format*；时间字段为occurred_at，custom列不自动追加detail。runtime `getBusinessLogTable`返回同序rows.values原值及原event，类型与React扩展均在正式子入口/根入口导出。可选attributes是经过JSON验证/深冻结的宿主投影，不是未知DTO透传。新增queryFields/querySummary复用QueryForm/QueryField，公共筛选/应用/清除与标题刷新/取消均由原Controller拥有。逐项迁移、列宽/长文本及scope取消规则见[组件合同](COMPONENTS.md#业务日志列定义与查询-slot4234)；不改HTTP/认证、loader、分页或快照owner。

用途是随时调取查阅领域业务记录，提供通用字段、可扩展payload、筛选分页和详情。用户所说的“审计”指这个业务日志用途，不是正式审计体系；旧BusinessAudit命名在同一实现上统一改为BusinessLog，没有增加另一套页面。公共事件描述谁在何时对哪个业务对象做了什么、结果如何、关联哪些请求及允许披露的业务细节。现有 [错误观察功能](PUBLIC_API.md#程序错误观察) 是独立功能，severity/错误分组/首次代表不能充当业务日志。完整通用规则仅在 [DESIGN.md](DESIGN.md)。

runtime/business-log 提供 DTO、严格解析、loader 和单一 controller；React `/business-log` 的 `BusinessLogExplorer` 使用这些 TypeScript 能力，并组合公开 Layout/Field/Table/Dialog/反馈与公共 CSS。

### 固定公共字段与可扩展 payload

以下是 xui 自己明确声明的最小接入合同，以 [源码](../packages/runtime/src/business-log.ts) 和正式 declarations 为准；没有声称任何后端接口已上线。采用方可以直接实现 typed loader，或通过默认HTTP loader对接baseservice的版本化facade，不直接暴露数据库模型。

| 类型 | 字段与事实 |
| --- | --- |
| BusinessLogEvent | id、event_type、schema_version、occurred_at、recorded_at、actor、object、action、result、summary、correlation_id、request_id；可选attributes为显式授权的不可变JSON投影。列表没有 payload |
| BusinessLogActor | kind 为 user/agent/service，id 为可信标识，display_name 为允许显示的字符串或 null。服务负责归属及代理授权，UI 不由名称猜身份 |
| BusinessLogObject | kind、id、display_name；整个 object 可为 null。不同领域自定 kind，UI 不自行生成对象路由 |
| result | succeeded/failed/denied/unknown；unknown 不伪装完成。异步任务、部分完成等领域事实进入对应 event_type/payload，adapter 必须明确结果映射，不能由 HTTP 200 或 severity 推断 |
| BusinessLogPage | list和明确page：offset的page_index/page_size/total，或领域cursor的next_cursor（末段null）与可选真实snapshot_id；不混用或造假 |
| BusinessLogDetail | event、state（available/expired/unavailable）、payload（JSONValue）。后两种 state 的 payload 必须为 null；available 的 null 是合法业务值 |

schema_version 是 **对应 event_type 的业务 payload 版本**，正安全整数；未知类型/版本仍展示公共事实及安全 JSON。公共字段的变更需同步升级 xui 接入合同与采用方，不能因这个字段任意改掉公共摘要。默认HTTP facade的route与success成功判定在下方和PAGE_APIS明确声明；业务事件词表与payload版本由宿主明确，领域loader不另猜协议。记录和关联 ID 保持字符串；整数超过 JS 安全范围必须在 payload 编码为字符串，不能经过 Number 舍入。

occurred_at 为事件实际发生时间，recorded_at 为服务记录时间，均须完整 RFC3339（允许 1–9 位小数）。不同事件可定义审批意见、工具执行结果、允许披露的变更字段或其他 JSON 对象；不强制一份通用 before/after 结构。Go 端可用 any 或按事件类型定义接口，但网络返回前必须明确版本、JSON 编码、权限和脱敏。

JSONValue 只接受 null/布尔/有限数字/字符串/数组/普通对象，深拷贝冻结；拒绝 unsafe 整数、bigint、undefined、函数、getter、自定义 prototype、循环。前端展示边界是 UTF-8 JSON 最多 64 KiB、深度最多 16、节点最多 4096；服务 adapter 应在传输前按更严格政策约束，不让库静默截断。null-prototype 对象不执行特殊键。**允许扩展不代表可携带任意秘密**：禁止完整 API Key、凭据、token、敏感字段 before/after；后端按 event_type 的 allowlist 和权限投影，前端无法撤回已传输数据。

### 两个 loader 与过滤、分页

BusinessLogLoader提供list(query,{signal})与detail(eventId,{signal})，pagination声明offset/cursor。默认 loader的query.page.index从0开始；领域cursor模型的query.page.cursor保持不透明。query 为 `{filter,page:{size,cursor,index?}}`；每个回调返回上表准确 DTO，没有 response 别名猜测。领域接口的已有 HTTP client 可以由明确 endpoint adapter 包装；第一方公共业务日志接入直接使用下方官方HTTP loader；loader 本身不决定 auth、租户、URL 或数据库。UI 显式 refresh，默认 size=50、范围 1–200；合成示例 size=2 仅便于验证分页。读失败不自动重试，取消仅结束本地等待，不证明服务停止。

filter 明确支持 `[since,until)` 事件时间、actor kind/id、object kind/id、event_type、action、result、correlation_id、request_id；后七者为精确过滤，不做全文 payload 搜索或 query AST。actor/object 必须配对，未知字段拒绝，时间比较保留纳秒边界。允许不存在 object 的事件，但按对象筛选时必须两字段齐全。身份和 tenant scope 从服务可信上下文取得，不由公共 filter/body 自报。

默认createBusinessLogHttpLoader采用 BaseService webfacade offset和httpx ListData，不产生cursor或snapshot。领域cursor loader的cursor须绑定scope/filter/顺序；snapshot_id可选，仅展示实际返回值，当前链保留已知真实snapshot基准，缺省metadata不抹掉基准，后来返回的真实snapshot必须一致；不填时间戳/常量/虚构ID。服务提供稳定全序（推荐记录顺序与 ID 解冲突），UI 保留返回顺序，不从事件时间猜提交顺序。缓存上一段只保存当前查询链的摘要，不重发 null cursor；下一段显式请求。过滤或刷新建新链，刷新失败保留旧事实和原已访问段编号，同时禁用旧链导航。cursor域的pageIndex只是成功访问的段；默认offset域明确将它作为基数0的服务页码，不能将两者混用。

controller 的列表与详情各有取消/generation；替换、关闭、卸载与 destroy 拒绝迟到结果。状态转换一次通知，订阅回调的新意图优先；订阅释放/重绑不在同一次通知无限调用。身份、权限或租户切换须销毁旧 controller，不能把摘要缓存跨租户复用。同一身份下的资源查询scope切换可由稳定loader先更新范围，再用同一Controller.setFilter清空旧数据/详情/已访问缓存及快照，取消旧代并读取新范围；不能只refresh保留旧scope行。

### 详情与公开 renderer

详情每次按事件 ID 授权读取。403、404、expired、unavailable 和一般错误明确区分，前端不根据本地时间推测保留期。关闭/Esc/卸载释放 controller 与 DOM 的详情引用；回到仍存在的触发器，触发器失效回刷新。对象 URL 只由 resolveObject、baseURL 和显式 referenceOrigins 映射，仅允许 HTTP(S)、无 URL 凭据、同源或已允许 origin；否则为普通文本。

使用原有领域方法时，loader adapter 将权限/不存在错误明确归一化为公共 HttpError（kind=http、status=403/404、attempts=1）；任意对象的 status 字段不自动认定为该事实。expired/unavailable 则返回上述详情 state，不能把权限异常映射成保留期结束。有限等待预算由宿主已有 client/loader 决定，controller 没有隐式 timeout。

默认 payload 以格式化 JSON 文本展示，HTML/URL/脚本字符串保持普通文本。宿主可通过公开 `renderers` 注册 `{eventType,schemaVersion,render}`：React renderer 返回 ReactNode。按类型和版本精确选中第一个注册项；未知类型/版本使用默认 JSON。注册代码来自可信应用代码，不从 payload 加载组件、eval、执行 HTML 或动态 import 路径。定制 renderer 负责保持业务权限、文本安全与自身资源生命周期，不能拿它另造通用字段皮肤。renderer 抛错给固定安全反馈并显示 JSON，不暴露异常内容；不触发重新读取。

### 服务边界与实际采用

业务服务记录日志，并负责权限/tenant、脱敏、查询顺序/快照与保留政策。xui 提供只读查询与详情展示，不实施日志写入或正式审计保证。baseservice已将业务日志放在bizlogservice；[bizlogservice/webfacade](https://github.com/coffeehc/baseservice/tree/main/bizlogservice/webfacade) 提供下述固定只读列表/详情HTTP边界，不引入独立auditservice。宿主注册路由，提供真实身份/tenant、授权与脱敏投影；xui不实现日志写入或用户管理。已有typed loader仍可在领域边界接入。

已实现 [共享合成模型](../examples/shared/business-log-model.ts) 与 [React 消费者](../examples/business-log-react/app.tsx)，先本地打包再独立安装正式 ESM/types/CSS。pnpm build/test:consumer/preview 后访问 /business-log-react/。示例只注入 typed fake loader，没有访问真实业务、创建后端路由或生成秘密。baseservice已有配套facade，但示例仍使用合成数据，不代表任一产品已接入真实服务。

按 [采用手册](ADOPTION.md) 先逐页接入 xui；按产品授权逐个接入baseservice facade或既有领域adapter，通过公共合同版本、消费方依赖、类型和回归联动升级。没有要求全部产品同时切换，也不因库级对齐自动修改任何产品或部署服务。 [测试](../tests/business-log.test.mjs) 与 [浏览器检查](../tests/browser/business-log.spec.mjs) 仅证明当前展示合同/生命周期，真实业务服务与权限/脱敏集成仍须采用项目另验。

### 默认 HTTP facade

createBusinessLogHttpLoader({http,timeoutMs?}) 固定 GET /api/v1/business-logs 与 GET /api/v1/business-logs/{id}。AjaxResponse 以 success=true 判定业务成功，code是必填安全整数元数据，不要求固定值；列表payload ListData{list,total}，null list显式投影空数组，unsafe总数拒绝。默认offset query为page_index基数0/page_size最大200/return_total=true/sort=recorded_at,id与两个sort_* desc；filters为since/until、actor_kind/actor_id、object_kind/object_id、event_type/action/result/correlation_id/request_id，单次URL编码。后端明确FieldDefined和半开时间边界，用服务现有的 Convert/GetTimeFormQuery 处理 RFC3339Nano，不改commons或降精度。

请求no-store/redirect:error、默认30秒、无自动重试。详情使用现有BusinessLogDetail DTO，403/404/expired/unavailable分别处理；没有默认写入或删除API。页面实际后端缺失须报告前置条件，不能将程序故障记录、供应商凭据配置或假snapshot映射成业务日志成功。[共享默认adapter示例](../examples/shared/capability-model.ts)和[合同回归](../tests/page-api.test.mjs)使用合成 fetch；产品真实服务/权限/脱敏仍须单独集成验收。

此合同用于自有业务记录，不把第三方响应或程序故障当作业务日志。第三方日志/审计API按第三方字段、分页和错误格式，宿主在内部边界投影允许披露的真实业务事实；不要求第三方AjaxResponse。行业标准/第三方优先边界见[DESIGN](DESIGN.md#规范强度与职责)。

### 跨库合同验证

[共享fixture](../tests/fixtures/page-contracts.v1.json) 在baseservice的 `docs/contracts/page-contracts.v1.json` 有逐字节一致副本；xui的 [合同测试](../tests/page-contracts.test.mjs) 经默认HTTP loader验证请求/响应，Go通过真实handler验证相同边界。事件 `schema_version` 表示宿主实际业务payload版本，不是facade版本，也不能默认填1；fixture使用3以验证原样保留。fixture记录时间使用真实PG事实支持的微秒精度，而since/until查询保留纳秒边界；服务须明确投影与半开区间，不声称存储保留不存在的精度。

共享测试只证明合成DTO与HTTP边界一致；真实宿主权限/tenant、详情脱敏、保留政策及生产集成仍需产品验收。

## 程序错误观察

这是独立程序错误观察功能。业务记录查询使用 [BusinessLogExplorer 合同](PUBLIC_API.md#业务日志)，不把 severity、错误分组或首次代表映射成 actor/action/result。

这是实现接口；完整通用规则只在 [DESIGN.md](DESIGN.md)。runtime/structured-log 提供无框架类型、DTO 校验、HTTP bridge 和单一查询/详情控制器；React `/structured-log` 的 StructuredLogExplorer 提供只读页面；runtime/structured-log 只提供无框架类型、DTO 校验、HTTP bridge 和查询/详情 controller。没有额外日志皮肤或下游 Tailwind 扫描要求。

React查询组合自4.2.22复用QueryForm/QueryField和既有ViewController.filters；可选pageToolbar及“重置草稿/清除已生效筛选”的准确请求语义见[组件合同](COMPONENTS.md#structuredlogexplorer-查询与槽位4222)。未增加或替换HTTP/Controller owner。

### 配套源码基线与范围

配套只读协议的固定源码基线为 commons 提交 `b0bc0f9bbb72b708fb9a7d251c033ba946d820f8`：

- [service.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/service.go)：Facts、ErrorRecord、ErrorGroup、四种 Reader 操作及可信 Scope。
- [query.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/query.go)：实际过滤字段、ID 升序、cursor 绑定、事务序号高水位、计数与读取时保留期判断。
- [record.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/record.go)、[extension.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/extension.go)：去重观察、首次代表、属性 allowlist/边界与脱敏。
- [README](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/README.md)：失败边界显式记录、默认 Detail/Stack 保留 7 天与宿主认证/授权职责。

这是结构化错误观察查询，不是自动收集全部 stdout 的日志平台。EntryCount 是去重后的已提交观察数，不是未解决故障、业务实体、重试次数或恢复成功数。公开视图只提供分组、观察列表和精确单记录详情；不提供写入、删除、清空、重放、投递运维、事件关联、stream 或业务恢复按钮。

上述固定基线的 Go 包没有 JSON tags，也没有上述页面所需的 HTTP facade。下方 snake_case、schema_version=1 的协议是 **xui 拟议接入合同，必须由宿主后端明确实现**；不能把 Go 默认字段编码、旧产品 offset/limit/newest-first 接口当成此协议。公开类型与默认行为以 [structured-log.ts](../packages/runtime/src/structured-log.ts) 和正式构建声明为准。

### 三个必需及一个可选只读操作

`createStructuredLogHttpAdapter(client,endpoints)` 接收宿主提供的 groups、groupRecords、record 三个必需路径，以及可选的 records 路径，向同源 HTTP client 发送 POST JSON，使用 [HTTP 与查询](PUBLIC_API.md#http-与查询) 的 Go AjaxResponse envelope；默认以 success=true 判定业务成功，code 保留为必填安全整数元数据，不要求固定值或额外 adapter。POST 在这里是明确定义的查询，客户端不自动重试；页面上的重试由用户触发。独立分组展示/测试可提供符合 `GroupedStructuredLogAdapter` 的三个必需回调与可选 records 回调；兼有全量记录能力时，`StructuredLogAdapter` 仍要求完整的四个回调。公共服务接入采用官方 HTTP adapter 与后端 wire。

| adapter | Go Reader | 请求 JSON | envelope.payload |
| --- | --- | --- | --- |
| groups | Query | schema_version、filter、page | LogGroupsPage |
| records（可选） | QueryRecords | 同上 | LogRecordsPage |
| groupRecords | Detail | 同上，加 group_id | LogGroupRecordsPage |
| record | GetRecord | schema_version、record_id | LogDetailResponse |

page 为 `{size:50,cursor:null}` 或上一响应给出的不透明 cursor；50 是源码默认值，范围 1–200。本例显示 size=2 只为演示多段，不更改库默认值。filter 的未指定 scalar 为 null、facet 为 []。Scope 的 application/environment/tenant 只由服务端可信装配和认证上下文绑定，绝不接收公共 query/body 字段。host 必须分别验证列表权限与详情权限，清理未知请求字段并按配置限制 body。

`GroupedStructuredLogAdapter.records` 与 `StructuredLogHttpEndpoints.records` 可省略；`StructuredLogAdapter` 继承分组接口并继续要求 `records`，因此旧的完整 adapter 结构类型和直接 `adapter.records(...)` 调用保持兼容。HTTP 工厂在 `endpoints.records` 为 `string` 时返回完整的 `StructuredLogAdapter`，省略或使用不能证明该字段存在的动态 endpoint 类型时返回 `GroupedStructuredLogAdapter`；Controller 接受基础分组接口。省略时 HTTP adapter 不创建 records 方法，Explorer 隐藏跨组全量记录入口，不发送 records 请求；分组、组内记录和单条详情仍工作。调用 `controller.setView('records')` 是安全 no-op；选中组后的“返回”按钮回到分组视图。提供 records 时原全量视图和默认行为保持不变。

### 明确 DTO 投影

所有响应都有数值 schema_version=1；分页数组只叫 list，不猜 items/data/records 别名。分页响应 page 有 RFC3339Nano 的 as_of 和 next_cursor（末段 null）。时间字段为 RFC3339Nano 字符串或明确 null；Go 零时间映射为 null。前端保持原字符串，并以纳秒精度验证/比较时间区间，不把细粒度边界转成 Date 毫秒。

| 类型 | 字段与语义 |
| --- | --- |
| LogFacts | source、nature、category、severity、component、operation、code、summary；retryable/user_fixable 为 true/false/null；request_id/trace_id 为 string/null；subject 为 `{kind,id}`/null。summary 和 source 非空 |
| LogRecord | id、group_id、occurred_at、recorded_at、details_retained、facts；没有 Detail/Stack/Related/Attributes 正文 |
| LogGroup | id、key_version、first_seen_at、last_seen_at、entry_count、representative（LogFacts） |
| LogGroupRow | group、matched_entry_count |
| LogGroupsPage | list、matched_groups、matched_entries、page |
| LogRecordsPage | list、page；没有 total |
| LogGroupRecordsPage | list、page、group；没有 total 或杜撰的分组过滤总量 |
| LogDetailResponse | record 为 LogRecordDetail：LogRecord 加 detail/stack（string/null）、related（Ref[]）、attributes（已允许且脱敏的 string map） |

entry_count、matched_entry_count、matched_groups、matched_entries 是 **uint64 范围内的规范十进制字符串**，最大 `18446744073709551615`；后端直接用 uint64 十进制格式化，不能先转 JavaScript Number。前端拒绝数值、前导零、负数及溢出，原样显示计数，不产生精度丢失。ID 保持不透明且满足 Go 的 1–256 字节安全标识格式；不据此生成业务路由。

backend DTO mapper 须显式 snake_case 标记、正确投影 nil bool→null、空 request/trace/subject→null、nil list/related→[]、nil attributes→{}、无 next cursor→null；不能直接 marshal Facts/ErrorRecord 充当摘要响应。**在网络返回前就从所有列表与 representative 去掉 Detail/Stack/Related/Attributes**，仅授权后的单记录读取返回详情。前端 allowlist 再剔除意外额外字段并冻结快照，它不能替代后端脱敏或撤回已经传输的敏感正文。nature/severity 使用源码枚举，category/source 是宿主维度；未知布尔值显示“未知”，不伪装成否或从 severity 推断。

### 分组事实与过滤命中

group.entry_count 是当前固定查询快照内该组所有观察的累计数；row.matched_entry_count 只计当前 filter 的观察。matched_groups/matched_entries 是整个过滤结果的计数，不是当前 list.length。group first_seen_at/last_seen_at 按该组发生时间的最小/最大值，仍是全组事实。

representative 是分组创建时首先提交的观察的摘要路由元数据，不是最新记录、不保证是最小 occurred_at，也不随当前 filter 替换。过滤“error”可能返回 representative 为 warning 的分组，这是该组存在匹配观察；页面保留首次代表、累计数与过滤命中数的区别。查看组内观察发送同一个 filter 加精确 group_id，不取旧接口的固定 20 个样本替代分页。

### 实际过滤与 cursor

支持 occurred_at 的 `[since,until)`、sources/natures/categories/severities 集合（每类最多 50 项）、component/code 精确值、subject 的 kind/id 配对及 text。text 最大 512 **UTF-8 字节**，只在 summary/source/category/component/code 五个脱敏字段中不区分大小写搜索；operation、Detail/Stack、request/trace、related 与 attributes 不在搜索范围。不添加查询 AST、任意排序、request-id 假筛选或 unsupported 状态字段。source/category 的候选值由宿主显式提供；默认不读取业务枚举接口。

cursor 最多 4096 UTF-8 字节，作为不透明值透传，绑定服务端 scope、查询类型、filter；组内 Detail 另绑定 group_id。首次 null cursor 建立数据库时间 as_of 与事务序号高水位，后续段固定该快照，稳定 ID 升序。新提交记录要刷新新快照才出现，不使用 webfacade 页码、offset、跳页或虚假末页/total。

控制器只为当前查询链保存已访问的**摘要页**，previous 返回缓存段，避免将 null cursor 重新发送而误建新快照。next 继续服务端 cursor；检查 as_of 一致和 cursor 循环。visited pageIndex 仅指已成功显示的段，不是协议页码。过滤、查询类型、分组或刷新会清除旧 cursor/缓存；刷新失败保留此前可读事实及原段编号，禁用旧链导航。缓存随访问增长，宿主应在离开页面/切换身份或 scope 时 destroy，不能复用跨租户控制器。列表的 details_retained 是当时读取事实，查看详情仍重新读取，不能凭缓存判断当前正文保留期。

### 详情、权限与生命周期

单记录详情按 ID 独立读取，另有 request generation；403 显示无权限，404 显示当前 scope 未找到，成功且 details_retained=false 显示保留期结束。这三种事实不能互相代替。Detail/Stack 到期即按读取时间隐藏，未执行物理 Prune 也不可返回；前端不根据本地时钟推算保留期，不将 7 天硬编码为所有产品政策。过期记录仍保留摘要元数据，客户端也强制将意外返回的 detail/stack 置 null。

默认视图显示记录/分组 ID、发生/记录时间、分类/组件/操作/错误码、三态标记、request/trace、对象和关联对象、详情/调用栈与允许的属性。所有自由文本经 React 文本节点或 textContent/pre 展示，绝不 innerHTML、执行 HTML 或自动识别可点击 URL。resolveRef(ref) 是宿主唯一对象路由映射；需明确 baseURL，只允许 HTTP(S)、无 URL 凭据、同源或 referenceOrigins 的显式 origin；没有映射就显示普通文字。

只有当前已授权详情中的 request/trace 提供明确点击复制；可由 writeClipboard 一次注入写入函数。失败就地可见，没有自动复制或 Toast owner。关闭/Esc、详情替换、页面离开与卸载释放 controller/DOM 中的详情引用，迟到读取/复制不能复活旧弹层。不能承诺 JS 安全擦除或撤回 OS 剪贴板；后端须在返回前确保元数据允许展示。

查询替换/取消即使遇忽略 Abort 的 producer 也结束本地等待并拒绝旧结果；这不证明服务端停止。列表刷新保留旧事实与持续错误，必要错误不用消失通知代替。详情失败只在明确操作下重读；取消不保存或执行业务动作。Dialog 采用既有 keyboard/focus/reduced-motion 行为，关闭回到仍可见触发器，否则回到刷新按钮。

### 已运行消费与接入责任

[React 示例](../examples/log-react/app.tsx) 共用 [typed fake facade model](../examples/shared/log-model.ts) 与 [labels](../examples/shared/log-labels.json)，经 [正式 tarball 消费](../scripts/consumers.mjs) 编译/打包。pnpm build、pnpm test:consumer、pnpm preview 后访问 /log-react/。

这里注入合成 fetch，使用显式假路径，不实现 loopback 后端，也不连接产品。测试只有展示合同与生命周期证据，不证明 Go/PostgreSQL、真实认证/脱敏、tenant 隔离或产品集成通过；详情复制用模拟 Clipboard。控制器 [逻辑测试](../tests/structured-log.test.mjs)、两类 [浏览器测试](../tests/browser/structured-log.spec.mjs) 与限制见 [验证记录](VALIDATION.md#chromium-浏览器结果)。

生产采用时先补明确 facade/DTO mapper、后端 scope/权限/错误映射、预算与脱敏，再保留产品必要业务行为后清理旧错误观察 owner。宿主稳定创建一个 controller，首次明确 refresh；React 组件接收外部 controller。视图不拥有外部 controller：卸载/页面离开关闭详情并取消读取；宿主释放自身订阅后 destroy controller/client，组件卸载释放视图订阅。接入迁移见 [ADOPTION.md](ADOPTION.md)，不得用本例通过宣称产品已迁移。

## 四类默认完整页面与配置（4.2.23）

`@coffeehc/xui-runtime/config`导出`DefaultPagesConfig`、`resolveDefaultPages(overrides?)`，根入口同步；同一config.json新增可选pages输入，解析时始终补齐四类默认展示。返回认证页config、业务日志options、Key labels/pagination与带router.basePath的URI路径，不注册路由、不创建服务/请求、不启用业务或授予权限。完整字段、兼容性、默认整页与BaseService接线见[组件合同](COMPONENTS.md#默认完整页面与配套接线4223)。管理员初始化仍用权威state/onCheck/onSubmit，当前没有新的默认初始化HTTP客户端或路由；缺口见[BaseService提示词](PUBLIC_REQUESTS.md#baseservice-管理员初始化合同提示词)。

## 默认适配器的服务前置

本节约束已采用的16项公共服务操作：认证 login/refresh/session/logout；平台Key capabilities/list/create/update/revoke/deleteRecord；业务日志 list/detail；程序错误 groups/records/groupRecords/record。StructuredLog `records` 是可选能力：服务不提供时，适用检查记录为不适用，分组、组记录与详情仍须满足各自合同。采用BaseService时直接使用对应已有facade与xui官方client/HTTP adapter；未用BaseService时后端在单一facade实现同一wire，前端仍使用官方client。不得在前端再改字段、成功/错误、认证或分页语义，也不另建重试/通知owner。每项请求、成功事实和异常检查见 [接入检查清单](ADOPTION_CHECKLIST.md#16-个公共-api-操作逐项检查)。这是所选公共模块的验收前置，不要求不存在业务的模块全部接入；后端缺失须报告。普通领域/第三方接口和独立展示继续使用明确typed扩展，公开扩展类型不代表可绕开公共16项合同。唯一职责规则见 [DESIGN](DESIGN.md#规范强度与职责)。

| 选用能力 | 默认连接 | 服务前置与合同 owner |
| --- | --- | --- |
| HTTP ajax / webfacade query | `bootstrap` / `getHttpService`、serializeWebfacadeQuery | 明确 AjaxResponse success/message/payload/request_id/code/redirect 与 endpoint 页基数、上限、filter/sort codec；HTTP 状态和业务成功分开。响应模式、错误适配、列表三态及显式 ID 编码见 [HTTP 与查询](PUBLIC_API.md#http-与查询) |
| ConfigurableLoginPage | bootstrap / `getAuthService`；POST `/api/v1/auth/login`、`refresh`、`logout`，GET `/api/v1/auth/session` | 固定 Bearer v2 DTO；access 仅内存，同源恢复 Cookie 与 session Bearer 分离。宿主注册 route、CSRF 和资源策略；不猜旧路由或仅改 baseURL。见 [登录与会话](PUBLIC_API.md#认证会话) |
| ApiKeyManager 的默认 HTTP adapter | createApiKeyHttpAdapter；`/api/v1/api-keys` 及 capabilities/update/revoke/record 路径 | 严格 DTO v2、AjaxResponse/ListData，服务提供权限、期限、独立确认、expected_version CAS 与一次性 secret。未知结果普通列表核验一次，不重发写请求。完整路径、能力和 fixture 见 [API Key 管理](PUBLIC_API.md#api-key-管理) |
| BusinessLogExplorer 的默认 HTTP loader | createBusinessLogHttpLoader；GET `/api/v1/business-logs` 与 `/{id}` | 明确 offset query/ListData 与必需 total，公共记录字段、版本化授权 payload；服务负责身份/tenant、权限和脱敏。领域 cursor loader 依自己的明确合同，不伪造 snapshot。见 [业务日志](PUBLIC_API.md#业务日志) |
| StructuredLogExplorer | 宿主声明三个必需 endpoints 与可选 records endpoint | 独立程序错误观察；服务实现明确 DTO、过滤、cursor、详情授权与保留期，不推断已有后端。缺失 records 时仅关闭跨组全量视图，不影响组/详情接口。见 [程序错误观察](PUBLIC_API.md#程序错误观察) |
| AuthPage/AdminSetupPage、MenuLayout、布局、表格、字段与弹层 | 公开数据、props/parts/slots/controllers 与 callbacks | 业务 API、权威状态、路由、权限、查询范围和执行归宿主；无通用后端路由要求。管理员初始化见 [登录与会话](COMPONENTS.md#管理员初始化页) |

选用默认 adapter 时严格满足其准确合同，不猜 data/token/items 或自动尝试路由；标准 OAuth2/OIDC/SAML 与第三方接口继续遵循各自标准，在宿主明确边界转换。平台 API Key 是自身签发凭据，业务日志是自身业务记录，不能由 provider key、第三方响应或程序故障记录改名替代。

baseservice 的 authenticationservice/webfacade、apikeyservice/webfacade 与 bizlogservice/webfacade 提供配套边界；采用项目仍须核对实际版本、注册路由并提供身份、tenant、授权、CSRF、事务与脱敏。共享 fixture 和合成消费者只验证约定的 wire，不能证明产品已集成或部署；实际已跑与未跑范围见 [VALIDATION](VALIDATION.md)。

## 通用资源控制器

### 加载 owner 与参考页

createResource({loader,isEmpty?,timeoutMs?}) 提供 idle/loading/refreshing/ready/empty/error/retrying、key/value/hasValue/error/busy/request。没有默认 timeout、请求/缓存或自动重试。load(key) 替换旧任务；同 key 刷新保留旧值，不同 key 清除旧对象；retry 是显式操作；cancel/destroy 即使生产者忽略 Abort，也结束本地等待并拒绝旧结果。回调重入以 generation 再检查，订阅异常不把数据成功改成错误。

useResource 只订阅；owner 放在宿主稳定生命周期，卸载时取消/销毁。loadStylesheet 创建的失败/取消 link 会清理，成功 link 由宿主拥有。

## 表单与刷新编排

`@coffeehc/xui-react/layout` 正式导出 FormGrid（含 Item）/FormGridProps/FormGridItemProps、FormActions/FormActionsProps；`forms` 的 Fieldset 增加可选 layout，`feedback` 的 LoadingStateProps/DataRegionProps 分别公开 inline 加载与 flow 反馈。LoadingState block在所属可见内容区居中，inline随动作/计数；DataRegion首次无内容等待将反馈放在区域中心，已有内容刷新保持原节点。它们是 React UI props，不存在 runtime DOM UI 排版 factory。默认行为、字段顺序、请求/分页/提交 owner 保持兼容；侧向 Sheet 在40rem及以下全宽，有行 DataTable 的刷新改为紧凑行内表现。签名与 React 用法见[表单与页面编排](COMPONENTS.md#表单与页面编排)，标准见[DESIGN](DESIGN.md#表单编排的公共入口)。

## React 公共组件增强索引

React `/menu-layout` 的 `NavigationMenuProps`/`MenuLayoutProps` 继承 runtime `/navigation` 的纯数据 `NavigationMenuOptions`。`expandBranchLabel` 与 `collapseBranchLabel` 可为每个真实分支名称生成可访问名称；runtime 只提供 navigation 数据、类型与 helper。当前显示、首行对齐、菜单开关和独立行尾动作由 React `/menu-layout` 拥有，详见[导航富条目合同](COMPONENTS.md#富条目独立行尾动作与上下文菜单)与[导航内部唯一收起/展开控件](COMPONENTS.md#导航内部唯一收起展开控件)。

1.2.0的名称槽默认伸展，既有renderLabel内的尾随非交互状态可使用完整剩余宽度；名称独立滚动仍通过NavigationMenu.Label声明，renderAction继续只接辅助button。React `/feedback` 的既有Spinner入口及span属性保持，正式CSS改为主题色开放弧，reduced-motion静止。1.3.0将top侧栏开关放入全局品牌行尾，不改变显式bottom选择。没有新增runtime DOM入口、业务状态或请求owner。接线见[富条目导航](COMPONENTS.md#富条目独立行尾动作与上下文菜单)与[表单与页面编排](COMPONENTS.md#表单与页面编排)。

AppShell/MenuLayout 的 `navigationTriggerRef?: React.Ref<HTMLButtonElement>` 公开唯一导航按钮，供宿主确认框通过已有 `finalFocus` 恢复可见焦点；它不接管未保存确认或导航，见[抽屉确认回焦](COMPONENTS.md#导航抽屉与未保存确认的最终焦点)。

AppShell/MenuLayout 的唯一侧栏开关由 React 公共组件定位：`sidebarTogglePlacement="top"`（默认）时桌面在全局品牌单元行尾，`bottom` 时在侧栏菜单/页尾后；窄屏两种设置都将同一个公共控件用于现有导航抽屉。宿主继续用受控 props/callback 管理状态，不移动私有 DOM。已设置bottom的消费方须显式改prop回top，单独升级包不会覆盖它。`SidebarTogglePlacement` 与 `SidebarFooterRow` 从 React `/layout`、`/menu-layout` 及根入口导出。详见 [导航控件](COMPONENTS.md#导航内部唯一收起展开控件)。

Calendar 的 `CalendarProps` 公开受控 `month`/`onMonthChange`；runtime `/calendar` 提供 `CalendarOptions` 与共享纯模型。月份状态与所选日期分开，外部更新不触发用户回调。严格年月、值、焦点合同见[Calendar](COMPONENTS.md#选择与复合控件)，正式 React 消费者见[示例](../examples/calendar-month-react/app.tsx)。

`MenuItemTone`/`MenuItemProps` 与 `MenuSeparatorProps` 从 React `/menu`、`/context-menu` 与根入口导出；Menu.Item 和 ContextMenu.Item 接受 `tone="danger"`，正式主题 CSS 维护危险语义。`Menu.Separator` 和 `ContextMenu.Separator` 使用同一 typed peer wrapper 与公共语义分隔线。授权、确认、回调与结果归宿主，详见[菜单危险操作语义](COMPONENTS.md#菜单危险操作语义)。

`DataTableRowContext`/`DataTableRowEvents` 是 React `/data-table` 的 typed 行事件合同，`DataTableProps<T>` 接受 row events；事件来源边界由 React 组件内部维护，runtime 不导出 DOM 行事件处理器。键盘可达性、独立 cell action 与分页行为见[数据表格](COMPONENTS.md#数据表格)。

4.2.26仅修复DataTable实际纵向滚动边界：无纵向范围时纵向wheel交给祖先，有范围时保留表体contain，横向与sticky不变。公开ESM/types和props无新增入口，无宿主overscroll开关或请求改变；示例与边界降级见[滚动合同](COMPONENTS.md#页面标题筛选与滚动)。

Table/DataTable的正式CSS默认全表仅行线，sticky不额外添加列分割线；原有列sticky配置不变，当前没有行列网格开关。详见[表格组件](COMPONENTS.md#数据表格)。

React `/date-time` 与根入口导出 `DateTimePicker`/`DateTimePickerProps`；runtime `/date-time` 保留值、解析与纯模型类型。输入为分钟精度的墙上时间字符串，不携带时区。完整行为见[日期时间选择](COMPONENTS.md#日期时间选择)及[React 示例](../examples/date-time-react/app.tsx)。

`Popover.Content.positionerProps` 保持 peer 合同，浮层定位、碰撞边界和滚动由 React 组件与公共 CSS 负责，见[Popover 的 Portal 容器](COMPONENTS.md#popover-的-portal-容器)。

## 接入反馈的兼容扩展

完整登录页 `LoginPageConfig.labels.showPassword/hidePassword` 与新密码组合 `NewPasswordLabels.showPassword/hidePassword` 均为可选字段，保持英文默认，可配置中文，见[完整登录页文案](COMPONENTS.md#完整登录页密码显隐文案与品牌替代文本)。React `AdminSetupPage` 可选 `onCheck`，底层 runtime controller 提供 `check()` 只读核对，见[初始化页](COMPONENTS.md#管理员初始化页)。`TextareaProps.autoResize` 为显式启用的行数上限尺寸能力，不拥有草稿或提交。

已确认 revoke 成功后，ApiKeyManager 通过既有 adapter.list 普通读取一次最新 metadata/capabilities；不能推断 deleteRecord=true。读取期间禁止该写动作并发，失败保留已确认 revoked 行与锁定能力，展示原列表错误/刷新入口，不重放 revoke。关闭/卸载、较新读取或动作使用既有代际取消迟到结果；最终权限、事务、删除条件和 expected_version 仍由后端负责，未新增 HTTP API 或 DTO。

## 通用长标题

React `/display` 与根入口公开 `OverflowText` / `OverflowTextProps`。runtime `/display` 只提供共享类型和纯 helper。仅字符串 text，现有 React 交互表面使用 `interactionRef`，不新增 Tab/role/点击语义。触屏/减少动效/无键盘入口完整静态换行；消费组合见[长标题合同](COMPONENTS.md#通用长标题)。

## 通用图标与颜色参数

1.2.0新增React `/display`及根入口的`Icon / IconProps`：color采用`React.CSSProperties['color']`，可直接消费公共CSS变量；blink默认false，显式开启使用既有透明度动效和主题强调色，reduced-motion保留静态颜色。BadgeProps（`/feedback`）与TypographyTextProps（`/display`）增加显式color，只改变前景，不改变字体/背景或业务事实。runtime不增加原生UI或动画控制器，版本判断、权限、可见性和动作继续归宿主；完整用法与禁用/语义边界见[Icon合同](COMPONENTS.md#icon-与状态强调)。固定1.1.3不含这些新增能力；本轮执行范围见[验证记录](VALIDATION.md)。

## 布局与槽位架构

`layout` 的 PageHeader 保留 title/description/meta/actions；空槽不占位，meta 统一次要文字。React `/display` 新增 Card；runtime `/display` 只导出共享 Card 类型。Card 固定 header/content/footer 三段，description 与 children 同属唯一 `.xui-card-content`，完整字段见 [Card](COMPONENTS.md#card)。页面、组件、原子控件共用 [槽位架构](DESIGN.md#页面与组件的槽位架构)，各操作按 [逐项清单](ADOPTION_CHECKLIST.md)验收。

1.2.0新增CardProps的iconVariant='tile'（默认）/'plain'、iconColor、footerVariant='band'（默认）/'plain'与stretch；CardBadge纯类型新增color/variant，BadgeProps及BadgeVariant提供plain/soft（独立Badge默认行为保持）；AvatarRootProps新增color并保留peer函数式style/className。字体角色、三段结构和空槽规则保持，业务摘要仍归宿主。CardGroupProps<T>.cardSizing='natural'（默认）/'equal'统一控制伸展，CardGroupCardProps排除stretch，由集合按稳定key创建同一Card实例；所有资源类型使用相同模板能力，没有领域专属布局或新runtime UI。详见[Card](COMPONENTS.md#card)、[CardGroup](COMPONENTS.md#cardgroup)、[Avatar](COMPONENTS.md#avatar)。这些修改从1.2.0提供，实际通过/未跑范围见[验证记录](VALIDATION.md)。

### 集合视图纯模型

`/collection-view`与runtime根入口提供统一状态/分页校验、稳定key校验和同回合请求防重入，不依赖React/DOM，不持有查询、缓存、HTTP或业务提交。DataTable既有导出的getDataTableState/createDataTableRequestGuard/dataTableDefaultLabels及对应DataTable类型分别保留为同一实现的别名；合法输入行为、分页基数、未知total和cursor合同兼容。非法集合配置继续抛TypeError，通用诊断现使用Collection前缀；列宽/列身份诊断仍归DataTable。React集合直接采用同一模型与footer，不能由消费者另加兼容分页或复制控件。

文字 slot 的字体族、字号、行高与字重由[DESIGN 唯一映射](DESIGN.md#公共文字槽验收)定义，属于正式 CSS 合同和 xui 发布验收；宿主非必要不自设字号。本轮不新增字体 API、字号档位或原生 UI 入口。


## 语义交互 Controller 双模式

逐组件归属与例外见 [组件矩阵](COMPONENTS.md#状态所有权与-controller-模式)。2.0.0 保留既有默认/受控 props：受控回调发请求，只有下一次 props/model.update 确认才能发布新值。`default*` 只初始化。注入的 `controller` 与对应初始化、值和事件配置互斥，动态配置由注入者 update，不从 View 反向覆盖；宿主保留 destroy 责任。Root 的公开泛型、parts、render/ref/回调 details 与 Base UI 实际键盘/焦点仍保留，不注入私有 store。历史设计草稿中的 1.4.0 不是当前固定产物版本。

```tsx
import {createOverlayController,createSelectionController} from '@coffeehc/xui-runtime/interaction';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Calendar} from '@coffeehc/xui-react/calendar';
import {createCalendarModel} from '@coffeehc/xui-runtime/calendar';
// 在组件生命周期中稳定创建，退出时由创建者destroy；不要每次render重建。
const dialog=createOverlayController();
const calendar=createCalendarModel({defaultMonth:'2026-10',defaultValue:null});
<Dialog.Root controller={dialog}>{/* 原公共Trigger/Content/parts */}</Dialog.Root>;
<Calendar controller={calendar}/>;
calendar.setMonth('2020-01'); // 浏览月份独立于所选值。
const selection=createSelectionController<string|null>({defaultValue:null});
// <Select.Root<string> controller={selection}>...公共parts...</Select.Root>
```

服务组合以 `viewController` 表示完整展示状态，旧 `controller` 继续表示既有服务，不能混称。`ApiKeyManager` 的 `options` 是 `ApiKeyManagerOptions`；日志的 `options` 分别是 `BusinessLogOptions` / `StructuredLogOptions`。显式 options 模式只创建一个所属服务，首挂载显式 start 一次；借用旧 controller 时不擅自开始宿主查询。`createApiKeyManagerViewController({service,pagination})` / `createBusinessLogViewController({service})` / `createStructuredLogViewController({service})` 引用服务，不复制结果和请求 owner；注入各自 viewController 后不可再传 service/options 初始化。API Key 页数来自完整 list，日志仍使用其真实游标/as_of，不虚构 total。`options` 的服务配置只初始化当前默认服务一次（BusinessLogExplorer的当前options.labels作为实时展示输入，见[整页语言](COMPONENTS.md#业务日志整页标签热更新4229)）；父组件传入新的等值配置对象不会重建服务、重发查询或丢弃草稿。更换业务数据 owner 时显式传入新的服务 controller/viewController，或按真实业务范围重挂载。AdminSetupController.update 可更新未来的 onSubmit/onCheck/validateUsername；不会重试在途操作，默认 Page 随回调更新核对入口。 PasswordStrengthController.bindReader 租用 View 的 DOM reader，释放或替换时取消旧代评估并恢复宿主原 reader；View 退出不永久保留 DOM 引用。

`createLoginViewController({auth,config,extensions?,onAuthenticated?})` 必须借用实际 AuthClient，View 不创建认证协议/client。绑定的 `readCredentials` 只提供瞬时读取边界，校验/扩展只保留用户名或安全错误，异步扩展完成后才读取用于 auth 的密码。交给 AuthClient 的参数属于其 IO 边界；本模型不在任何快照/缓存/日志保留密码，不破坏自定义 AuthClient 异步读取其参数的合同。实际 DOM 在提交、pagehide、替换和卸载时清理。Secret-safe 子模型与管理员初始化 form 聚合见组件矩阵。

4.2.25修正ConfigurableLoginPage在导航失败后仍显示opening的问题；失败保留认证事实、禁重复登录和局部导航重试，公开类型、labels与认证端点未变。LoginViewController已有navigationPhase订阅仅提供无凭据阶段事实，不能据此分类宿主内部失败原因，详见[完整登录页](COMPONENTS.md#完整页面与扩展)。

3.0.0 的 Toast 由 xui 公开 Controller 拥有唯一集合/计时/关闭阶段；不再使用 Base UI ToastStore。以下为正式迁移合同。

## 剪贴板复制服务

正式入口 `@coffeehc/xui-runtime/clipboard` 和 runtime 根入口提供共享 `getClipboardService()`。剪贴板基础服务的 `createClipboardService` 工厂在 2.0.0 中已从 public exports 移除；日常浏览器应用通过 bootstrap/服务注册表获取唯一服务，隔离测试或 SSR 容器可用 `new XuiServices({clipboard:{options}})`。服务只写文本，不读取剪贴板，不持久化、不创建通知/权限状态。`writeText(value,{signal?})` 返回 `Promise<void>`；成功代表所用平台写接口确认写入（legacy为execCommand返回true，不是读回OS内容），取消以 AbortError 拒绝，平台失败直接拒绝。用户消息/复制状态归调用组件。

```ts
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {ClipboardService} from '@coffeehc/xui-runtime/clipboard';
const app = bootstrap();
const clipboard = ClipboardService;
await clipboard.writeText(text,{signal});
```

默认优先用实际 navigator.clipboard.writeText；仅该能力缺失时使用临时 textarea/execCommand 的平台回退，始终清除临时DOM并恢复原焦点、input选区、文本选区与滚动。权限拒绝/实际写入失败不自动再次写入。无 navigator/document 的环境在调用时拒绝，不在 import 阶段访问 DOM。options 的 navigator/document/execCommand 是显式平台测试/宿主注入边界。4.2.28修复HTTP原生零尺寸选区假成功；临时选区保留非零、不可见、脱离文档流的几何。系统回归见[原生剪贴板用例](../tests/browser/clipboard-system.spec.mjs)，macOS显式设置XUI_SYSTEM_CLIPBOARD=1后运行；它使用正式包、原生Chrome/execCommand和pbcopy/pbpaste，仅写合成内容并比较布尔结果，不记录其他剪贴板内容。不启用该平台用例时不能把mock或UI状态当成系统复制验收。

同服务 FIFO 串行执行实际写入；取消队列中尚未开始的任务不会调用 writer，取消正在等待的调用会停止本地等待，但后续写入必须等真实 writer settle 才执行，不能越过未完成的 OS 操作。`disposeXuiServices(window)` 只释放注册表创建并拥有的内部剪贴板服务；经 `services.clipboard.instance` 借用的 `SharedClipboardService` 只有 `writeText` 合同，调用方无须提供 `dispose`，registry 也不会销毁借用实例。注入 `services.clipboard.options` 时，options 中的 `writeText` 是借用的平台 writer seam，内部服务使用但不拥有或 dispose 它。调用方不能据此声称已撤回 OS 剪贴板。`createCopyController` 是组件 Controller factory，保留并默认复用共享剪贴板服务；原显式 writeText 注入仍兼容并保留自身反馈代次隔离。

<!-- public-entry: @coffeehc/xui-runtime/toast -->
### Toast 完整 Controller

`@coffeehc/xui-runtime/toast` 导出纯 TypeScript `createToastController<T>()`、`ToastController<T>`、`ToastOptions`、`ToastContent`、`ToastRecord<T>`、`ToastState<T>` 与 View 租约/Promise options。runtime 不依赖 React/DOM。React `/toast` 导出 `Toast` 组合、各部件 Props 与 `ToastController<Data>`/`ToastObject<Data>`/`ToastPayload<Data>`；data 保留宿主类型。

```tsx
import {Toast} from '@coffeehc/xui-react/toast';
const notifications = Toast.createToastManager({timeout: 5000, limit: 3});
function Notices() {
  const {toasts} = Toast.useToastManager();
  return <Toast.Portal><Toast.Viewport aria-label="通知">{toasts.map(toast =>
    <Toast.Root key={toast.id} toast={toast}><Toast.Content>
      <Toast.Title/><Toast.Description/><Toast.Actions><Toast.Close aria-label="关闭通知">关闭</Toast.Close></Toast.Actions>
    </Toast.Content></Toast.Root>
  )}</Toast.Viewport></Toast.Portal>;
}
const view = <Toast.Provider controller={notifications}><Notices/></Toast.Provider>;
notifications.add({title: '已保存', description: '更改已保存。'});
```

省略 controller 的 Provider 拥有唯一默认实例，可配置 timeout（不填/0使用5000ms，-1保持）、limit（3）与 exitTimeout（1000ms关闭兜底）。controller 或兼容拼写 toastManager 注入的是同一个完整 xui 队列，与这些配置互斥；宿主负责销毁借用实例。可在绑定 View 前 add，绑定时投影已有项；无 View 暂停，重新绑定保留队列。配置 timeout 只影响后续新增及Promise完成默认时限，不追改已有项；update 仅更换文案/元数据保留剩余时限，显式 timeout 重启该项时限；同 id add 重新计时。limit控制未展开显示数；Viewport按48rem的实际阅读宽度或放大文字报告环境上限1，模型visibleLimit取配置和有效View报告的最小值，不重写limit；展开呈现全部并在40dvh公共Token上限内滚动，隐藏项暂停时限。

add 返回稳定字符串 id，同 id 活跃项转为 update；update/close、getState/subscribe、promise、bindView/destroy 均为同一 owner。快照/集合/记录浅只读，内容/data由宿主提供。revision 与 transitionStatus 是只读回执信息，宿主不写内部阶段。close 全部或指定项进入 ending、onClose 一次；动画回执或exitTimeout移除、onRemove一次。相同id替换关闭中的旧项会完成旧移除回调，不影响新记录。Promise 返回原结果/拒绝；记录已关闭、被手动更新或实例已销毁时不再执行迟到格式化/写入。

Actions承载实际操作时独立末行靠右并自然换行，无内容不占位，沿用small公共Button；4.2.19仅有Close的旧Actions组合与正文首行同排。Title/Description 缺省 children 使用记录内容（h2/p）；render/ref/className(state)/style(state) 保持公开组合，id 与 aria 关联同步。Action 使用 actionProps，不默认关闭；Close 可按普通公开 Button disabled。普通通知 role=status/polite，高优先级 role=alert/assertive；不抢新增焦点。键盘、暂停、手势及默认右上角见 [DESIGN](DESIGN.md#通知队列与视图合同)。Positioner/Arrow 使用 Base UI 公开 Popover 几何能力；`toast.positionerProps` 或部件 props 指定真实anchor。没有第二个通知 store。

**3.0.0迁移**：旧外部 `@base-ui/react/toast` manager/ToastObject/专有内部状态不能注入；改用以上xui入口。`Toast.createToastManager` 名称继续可用，但返回完整xui Controller；旧 Provider/Viewport/Root/Content/Title/Description/Close/Action/Portal/Positioner/Arrow/useToastManager 名称保留。Viewport默认位置变为右上角，timeout旧0常驻需改为-1（不填/0使用默认5秒），默认右滑保留纵向滚动；不保留peer堆叠高度/索引等私有CSS变量。宿主不复制队列或写DOM/CSS适配层。示例 `examples/toast-react/` 仅展示隔离合成动作，不代表业务保存已实现。

## 文件上传

<!-- public-entry: @coffeehc/xui-runtime/upload -->
<!-- public-entry: @coffeehc/xui-react/upload -->

`UploadService.request<T>(path, file, options?)` 复用同一 `HTTPService`，一次 multipart POST，一次默认 120000ms 预算。默认文件字段 `file`，可显式 `fieldName/fields`；响应模式、adapter、错误、取消和认证遵循 HTTP 合同。不能覆盖 method/body/json/retry；平台生成 Content-Type boundary（共享 HTTP 会移除 FormData 的自定义 Content-Type，包括默认 JSON 头）。不自动重放写入、不创建 storage/key/权限 owner。成功只表示 HTTP 与所选响应合同已确认；业务 payload 仍由宿主处理。

`createUploadController<T>` 每实例管理独立队列，选文件不请求；`start` 仅调度 queued，`retry(id)` 是用户明确的新写入。默认单文件、并发 1；multiple、accept、maxFiles、maxFileSize 显式配置，大小以字节为单位含上限，0 只允许空文件。数量超限整批拒绝并保留旧行，类型/大小无效行保留错误且不能发送。同名文件不推断相同业务对象。`getState/subscribe` 返回稳定冻结快照：files、busy、disabled/readOnly、selectionError；每行有稳定 id、File、status、progress:null、validation/errorKind、resultUnknown 和确认后的 typed response。

取消/超时/失败只证明本地等待结束，不证明服务器回滚；UI 提示先核对服务器再重新上传。`remove/clear` 只移除本地引用，不删除远端文件。迟到结果不能复活已移除或重试后的行。disabled/readOnly 阻止新增/开始/重试/移除，已有请求继续；owner 仍可 cancel/destroy 清理。默认 fetch 没有上传字节进度，因此只有居中的 indeterminate Progress，不能显示猜测百分比。大文件分片、断点续传、预签名、业务提交与远端清理仍由宿主明确协议负责。

```tsx
import {Upload} from '@coffeehc/xui-react/upload';
import {UploadService} from '@coffeehc/xui-runtime/upload';
// 应用入口先 bootstrap；启用认证时同时加载 @coffeehc/xui-runtime/auth。
<Upload<{id:string}>
  label="附件"
  description="最多 4 个 CSV 文件，每个不超过 1 MiB。"
  options={{path:'/api/files',service:UploadService,multiple:true,accept:'.csv',maxFiles:4,maxFileSize:1048576}}
  renderResult={file => <span>已确认记录：{file.response.payload.id}</span>}
/>;
```

`Upload` 支持默认 options 或完整 controller 注入，二者互斥。View 只订阅借用实例；真实退出/替换终止所属等待，不销毁借用 Service/Controller。完整 labels 可翻译，locale 只格式化确切字节数。label、description、error、required 按 Field 关联；file input 由公共 Button 代理，拖拽区不增加多余 Tab 停靠点。required 表达“当前存在有效文件选择”，不表达远端上传成功；原生文件输入选择后清空以允许重选，此组件通过显式 start 上传，不能把它当成传统 form 的 FileList 自动提交字段。宿主依实际成功记录验证业务提交。

槽位、字体和焦点见 [Upload 组件](COMPONENTS.md#文件上传-upload)；正式独立示例见 [upload-react](../examples/upload-react/app.tsx)。

`@coffeehc/xui-react/tabs` 的 `TabsListProps.variant?: "segmented" | "line"` 是现有List的可选视觉组合，从4.2.7起默认line，需内嵌底槽时显式segmented；仅默认视觉改变，line不创建选择/路由/查询owner。单项最大宽度使用公共tabs-item-max-inline-size；直属文字自动进入溢出阅读槽，组合名称公开Tabs.Label与TabsLabelProps（text:string、无interactionRef），复用OverflowText的hover/键盘与静态降级。详见[Tabs合同](COMPONENTS.md#tabs)与[正式示例](../examples/tabs-overlay-react/app.tsx)。弹层关闭按[完整Escape层级](COMPONENTS.md#嵌套弹层与-tooltip-的-escape-顺序)验证，不能将Tooltip消耗的一次Escape记为Sheet丢失监听。

`@coffeehc/xui-runtime/data-table`及runtime根入口新增`createDataTableColumnSizingController`与DataTableColumnWidths/Options/State/Change/Draft相关正式类型；React `/data-table`新增`DataTableColumnSizingProps`与可选`columnSizing`，默认或完整Controller注入互斥。列`resize`声明交互限制/翻译名称或false排除。原width、rows、排序和分页合同保留，精确字段见[交互列宽](COMPONENTS.md#交互列宽调整)与正式types。`table-resize.css`为可选交互能力分片，critical不预载未启用拖动的皮肤，style/components包含完整样式。

4.2.14 的 AppShell/MenuLayout 保留公开 slot 与 Controller 类型，仅调整窄屏默认布局：导航抽屉默认全宽全高、单层内距、Tabs 独立轨道，内容超出区域预算时自动整体纵滚。SearchToolbar 的嵌套 actions 不再撑高高级筛选按钮。布局几何会变化，宿主不必增加补丁；桌面侧栏、主题、查询、认证与业务 owner 不变。

## 安全正文链接

4.2.15 的 runtime `/text-links` 与根入口导出纯 `parseHttpURL(value): string | null`、`linkifyText(text): readonly TextLinkPart[]`，也可调用 `UtilService.url.parseHttp` / `UtilService.text.linkify`。只接受显式绝对 HTTP(S)；拒绝凭据、隐藏/控制字符、反斜杠及需要修复的 authority（含短写 IPv4、NFKC 变化、百分号 host）。合法 IDN 由标准 URL 规范化；返回 href 不是原展示文本。正文分词保留每个原始码元，中文标点和未配对的尾括号留在链接外；非 URL、不安全候选保持普通文字。没有相对路径、自动补协议、HTML 解析或请求 owner。浏览器解析可能修复输入，因此此合同在调用 [URL 标准解析器](https://url.spec.whatwg.org/) 前后显式约束 authority。

4.2.24将公共默认链接统一为无下划线，覆盖Typography.Link、LinkedText、xui/xui-layer内原生a与Button link，公开ESM/types和导航协议未改变。主题色、独立键盘焦点、外链安全与事件合同保持，具体[文字样式合同](COMPONENTS.md#typography)由公共CSS维护。

React `/display` 的 `LinkedText`（同 `Typography.LinkedText`）复用现有 Link 字体/颜色，外框只补安全换行并继承所属文字槽，不强制正文大小；只对字符串、数值及数组中的相应值分词；已有 React 元素完整保留、不遍历其内部，不接受 HTML。`value` 优先于 children（null/undefined 回退 children）。`linkProps` 保留标准 anchor 属性和事件但不能替换 href/内容；默认 `_blank`，始终追加 noopener/noreferrer 并移除 opener。`stopPropagation` 缺省 false，可为行/卡片显式开启，只停止链接 click 冒泡，不调用 preventDefault；宿主提供的事件仍可自行决定默认行为。既有 `Typography.Link` 行为不变，需 mailto 等协议继续显式使用它。

```tsx
<LinkedText value={message} stopPropagation linkProps={{target: '_self'}} />
```

## 标准通知视图与范围清空

4.2.15 的 `Toast.View` 在同一 `Toast.Provider` 下组合已有 Portal/Viewport/Root/Content/Title/Description/Actions/Action/Close，不创建队列；`labels`（region/close）默认“通知/关闭通知”，`container`、`viewportProps` 与 `renderActions(toast, controller)` 是公开扩展。默认动作取记录的 actionProps；关闭按钮始终保留。4.2.19标准View采用Icon—Content—Close三列，Close首行图标，Actions仅承载真实动作。字体、右上角、5秒/-1、窄屏/滚动、焦点与播报合同沿用已有部件。

`createToastController` / `Toast.createToastManager` 返回 `ClearableToastController`：`clear()` 立即移除 active/ending 项和计时，无退出动画，不执行旧 onClose/onRemove 回调，不让 pending promise 的迟到结果恢复文案。它保留 Controller 与 View 租约，可用于同一队列的身份切换。旧自定义 `ToastController.clear` 为可选，旧非 scoped Provider 兼容；新增 `scopeKey` 要求注入 Controller 支持 clear，缺失则明确报错。

```tsx
const queue = Toast.createToastManager(); // 放在宿主稳定生命周期
// 身份切换边界：先取消旧作用域生产者，再 queue.clear()，再发布新身份/启动新工作。
<Toast.Provider controller={queue} scopeKey={identityGeneration}>
  {children}<Toast.View labels={{region:'通知',close:'关闭通知'}} />
</Toast.Provider>
```

scopeKey 变化时先从 React 投影中去掉旧文案，再于 layout 阶段 clear 旧队列；即使 Controller 同时替换也会清空旧实例，新实例已有队列保留。它不订阅认证、不取消任意业务异步生产者：宿主须取消/隔离旧身份的直接 add，避免旧任务在清空后重新 add。新身份工作不能抢在 Provider 完成旧队列清空前写入复用队列，推荐上述显式切换顺序。宿主仍拥有借用 Controller 的 destroy。

## 模块与 CSS 的同一资源生命周期

runtime `/loading` 新增 `loadModuleWithStyles` / `createModuleResource`，保留既有 createResource/loadStylesheet。`ResourceOptions.loader` 增加兼容的第三参数 `{request, retry}`（只读），原双参数 loader 不变。

`loadModuleWithStyles({moduleURL,styles?,load,signal,document?})` 并行等待宿主 ESM loader 与 CSS，返回 `{module, release()}`。同 Document、同规范化 CSS URL 引用计数共享；最后一个 lease 释放才移除 link，在途/失败 link 清理且可重试。调用方取消同样释放其 lease，已就绪 CSS 的 lifetime 也受 signal 约束。无 CSS 可在 SSR 使用。只缓存 CSS lease，ESM 缓存/执行由浏览器或宿主 loader 拥有；release 不能撤销已执行模块，不承诺清除浏览器失败 import 缓存。

`createModuleResource({timeoutMs, resolve(key,context), load, document?})` 在**一个**既有 Resource 上持有 lease，timeoutMs 必填正有限数，覆盖模块+CSS整个等待。load/retry 返回 Promise<void>，成功/失败从 getState 读取；不自动 retry。不同 key 先清除旧值与样式，同 key 刷新保留已确认模块/CSS，失败保留旧值；成功替换、cancel/timeout 在途任务、destroy 时分别释放相应 lease。生产者忽略 Abort 时本地仍结束等待，迟到结果不发布。宿主拥有模块组件挂载和副作用 teardown；切换 key/销毁前应卸载相应消费者。JS 失败缓存若需新 URL，由 resolve 的 trusted build map 在显式 retry 时选择，不追加任意网络输入或自动 cache-bust。

```ts
const panel = createModuleResource({
  timeoutMs: 10000,
  resolve: (key, context) => trustedAssets[key],
  load: (url, signal) => import(url),
});
// React useResource(panel) 订阅同一个 owner；页面退出调用 panel.destroy()。
```

没有新增认证、fetch、业务请求或第二查询 owner，公共 bootstrap 不预加载可选模块。真实带凭据数据仍走 HttpService/原认证链路；trusted module/style 地址由构建清单提供。

## 绘图主题颜色

runtime `/theme-colors` 与根入口导出 `readThemeColors(mapping, {element?,document?})`、`observeThemeColors(mapping, listener, {theme?,element?,document?,signal?})` 及 ThemeColor/ThemeColors/ThemeColorObserver 等类型。mapping 由宿主指定语义名→CSS token 名，不另复制 palette。以目标 element（默认 documentElement）实际继承的 CSS 求值，包括 Color 4/color-mix/alpha；浏览器 Canvas 按 [sRGB 读回合同](https://html.spec.whatwg.org/multipage/canvas.html) 得到 `{colorSpace:'srgb', rgba:[r,g,b,a], css:'rgba(...)'}`，四通道归一化0–1，采样精度8位；透明度保留，超 sRGB 色域裁剪至 sRGB。WebGL 若需 linear-light，由其 renderer 明确转换，不能把 encoded sRGB 当线性输入。

missing/invalid/不支持的颜色、SSR 或无 Canvas readback 返回 null，绝不猜黑色；读回只创建并移除临时 probe，无保留节点。observer 借用既有 ThemeService（可显式注入同一 theme owner），订阅主题状态、目标祖先 class/style/主题属性和 window resize，同值去重。初次同步发一次；CSSOM/样式表替换或宿主语义变化调用 `refresh()`，不承诺自动捕捉任意 CSS 变更。`dispose()` / signal.abort 幂等释放订阅与监听，不销毁借用主题；SSR observe 明确抛错。不会管理绘图循环、相机、尺寸、业务映射或新增主题 owner。

```ts
const colors = observeThemeColors({edge:'--diagram-edge',text:'--foreground'}, next => {
  renderer.setColors(next); // null 的处理由实际 renderer 决定
}, {theme: app.services.getThemeService(), element: canvas.parentElement!});
// 卸载：colors.dispose()；stylesheet 替换后：colors.refresh()
```

### 侧栏临时显示扩展（4.2.16）

React `/layout` 的 AppShellProps 与 `/menu-layout` 的 MenuLayoutProps 新增可选 `sidebarRevealOnHover?: boolean`（默认 true）。桌面紧凑侧栏 hover/focus 临时显示完整宽度；不修改 Controller.collapsed、不发折叠请求、不创建新导航 Controller。设置 false 保留显式切换。窄屏/粗指针沿用原 drawer；导航范围与多 Controller 注入规则不变。独立 NavigationMenu 没有该属性，宽度仍由外层布局负责。

```tsx
<MenuLayout items={items} defaultCollapsed sidebarRevealOnHover>{content}</MenuLayout>
// 禁用临时揭示：<AppShell sidebar={navigation} sidebarRevealOnHover={false}>…</AppShell>
```

正式 CSS 的 nav-sidebar-width 默认16vw夹取192–224px（根16px）并50vw封顶，compact仍60px；nav-reveal-close-delay默认150ms是离开且失焦的宽限。完整键盘/portal/页脚规则见 [COMPONENTS](COMPONENTS.md#紧凑导航的临时揭示4216)。runtime 继续只提供原 TypeScript Controller，不恢复原生 UI，不引入持久显示态。

### 透明文字动作（4.2.17）

React `/button` 的 ButtonProps.variant 新增 `text`；`/navigation` 的 DisclosureProps 新增 `variant?: 'default' | 'text'`（4.2.18起默认text，default显式保留历史配方）。这只是公开CSS外观，不增加状态owner或业务状态。两种组件的独立CSS入口与聚合CSS一致。

```tsx
<Disclosure title="计划" variant="text">{plan}</Disclosure>
<Button variant="text" aria-expanded={open} aria-controls={id} onClick={toggle}>
  调用了 {count} 次工具 <DisclosureIndicator open={open}/>
</Button>
```

尺寸、字体、焦点、disabled和受控/Controller注入合同沿用原入口；普通Button默认样式保留，Disclosure默认改为text。不要用link变体冒充透明折叠动作，也无需消费者背景样式或复制Disclosure。

### 透明导航与警告前景（4.2.17）

Runtime `/navigation` 的 `NavigationVariant = 'default' | 'text'`、`NavigationTone = 'default' | 'warning'` 由 React `/navigation` 与 `/menu-layout` 同步导出。NavItem 新增可选 variant/tone；NavigationItem 新增相同字段，NavigationMenuOptions 与 MenuLayout 支持容器 variant，条目 variant 优先。省略字段保留默认外观；warning 仅改变该条目主控件的文字、图标、分支开关和选中短线，背景透明，不影响分组标题、子项、独立配置按钮或焦点环。config.json 的 menu.items 支持相同字段并校验枚举，MenuService 保留它们。

```tsx
const items = [{id: 'team', label: '研发团队', href: '/team', tone: 'warning' as const}];
<NavigationMenu items={items} variant="text"
  renderLabel={item => <><NavigationMenu.Label>{item.label}</NavigationMenu.Label>
    {item.tone === 'warning' && <Icon><TriangleAlert/></Icon>}</>}
  renderLink={item => <SessionLink aria-label={`${item.label}，需要人工确认`}/>} />
```

TriangleAlert 与 SessionLink 由宿主提供，link 必须转发 props/ref；例中完整名称用于读屏，不要求增加可见状态文字。宿主投射事实到通用 tone，不传业务生命周期枚举。Icon 是无动作装饰；配置动作仍进入 renderAction。既有 Controller、路由、roving 焦点、disabled 与 compact reveal 合同保持。正式示例见 [navigation-tones-react](../examples/navigation-tones-react/app.tsx)。

### 纯图标按钮轮廓（4.2.18）

`@coffeehc/xui-react/button` 的 IconButton / IconButtonProps / Button / ButtonProps 既有调用与事件入口保持。IconButton已设置公开data-icon="true"；Button显式使用相同标记时采用同一圆形容器，直接消费已有radius-full，文字按钮继续button-radius。4.2.18轮廓不新增属性/状态/Service；4.2.32补充button-icon-inset/button-icon-padding公共Token，视觉圆面和焦点内收而命中区/SVG不缩小，具体几何见[统一轮廓合同](DESIGN.md#纯图标按钮的统一轮廓4218)。4.2.33修复SearchToolbar/QueryForm和SidebarFooter组合的内部覆盖，不新增API/Token或改变请求/展开owner。ButtonProps与IconButtonProps调用保持，所有正式CSS入口同源；可选危险tone见后文。

```tsx
<IconButton aria-label="发送"><SendHorizontal/></IconButton>
<Button data-icon="true" variant="destructive" aria-label="停止"><Square/></Button>
<Button><Plus/>新建研究任务</Button>
```

前两者为圆形容器，Square图标自身仍是方块，第三者保持普通文字按钮。disabled与aria-busy仍是两个独立事实，busy不自动禁用或提交请求。正式CSS的button.css、critical.css和style.css同源；定向可运行示例在正式消费者 `/react/button-state-contract.html` 的 Icon-only shapes 区域。

行内下拉入口推荐直接复用现有组合，显式render不被重写：

```tsx
<Menu.Root>
  <Menu.Trigger render={<Button variant="text"/>}>
    <Icon><ModelGlyph/></Icon>当前模型 <Icon><ChevronDown/></Icon>
  </Menu.Trigger>
  <Menu.Content><Menu.Item onClick={selectModel}>模型选项</Menu.Item></Menu.Content>
</Menu.Root>
```

Menu把aria-expanded等状态合并给同一个Button；text变体维持透明并使用公共品牌前景，Menu保留唯一展开/关闭/焦点owner。不要给宿主显式primary或destructive入口覆写text，也不改变普通Select/Input默认。

4.2.18将上述标准上升为展开/收起动作的公共默认：无自定义render的Menu.Trigger使用Button.text；Disclosure缺省variant由default改text（显式default仍可用）；Accordion.Trigger、SearchToolbar高级条件、侧栏独立控制与TableExpandButton采用同一前景/透明规则。Menu.Trigger显式render不会被替换或强制改变variant；TableExpandButton保留原font/padding/高度，SortButton不改变。无新增公开属性或Controller，完整逐项映射见 [DESIGN](DESIGN.md#展开与收起入口的统一呈现4218)。这不是模型选择器特例，也不会靠aria-expanded扫描全页面来改宿主显式主/危险按钮。

### 透明危险动作（4.2.18）

`@coffeehc/xui-react/button` 新增 `ButtonTone = 'default' | 'danger'` 与可选 `ButtonProps.tone`，IconButton继承。tone只为variant=text选择前景，其他显式变体保持原配方。danger使用既有status-error-foreground，含hover/pressed/expanded/busy仍保持危险前景及透明背景；disabled沿用原禁用前景。没有授权、确认、请求或防重owner。

```tsx
<TableActions>
  <IconButton variant="text" aria-label="查看详情" onClick={view}><Eye/></IconButton>
  <IconButton variant="text" tone="danger" aria-label="删除记录"
    disabled={!canDelete || pending} aria-busy={pending} onClick={confirmDelete}><Trash/></IconButton>
</TableActions>
```

规则适用于每个表格的操作槽，产品按真实权限接线，不能以库级示例替代逐表验收。透明图标按钮仍采用同一圆形轮廓，带文字Button保持原圆角。

### 紧凑通知部件（4.2.19）

React `/toast` 新增 `Toast.Icon` / `ToastIconProps`：装饰状态槽，缺省图形只按记录显式type映射success/error/warning/info，其他为中性，不改变priority、队列或计时。children/render可替换装饰图形，原ref/className(state)/style(state)沿用，aria-label/labelledby不属于该装饰槽类型。Toast.Close缺省绘制×、透明圆形32px触点，显式children/render及可翻译aria-label保持；标准View默认关闭名称不变。Root直接组合Icon/Content/Close时共享公共三列布局，无固定内容高度。窄容器说明/动作跨全行，极窄时文字移到图标/关闭之后的完整下一行；不改DOM顺序。Title继承label的500字重，并由公共Toast角色统一使用body-sm（14/22px）；Description保持body-xs（13/20px）与400字重。

```tsx
<Toast.Root toast={toast}>
  <Toast.Icon/>
  <Toast.Content>
    <Toast.Title/><Toast.Description/>
    <Toast.Actions><Toast.Action/></Toast.Actions>
  </Toast.Content>
  <Toast.Close aria-label="关闭通知"/>
</Toast.Root>
```

通常直接使用Toast.View。旧parts仍可用，Actions只有Close时默认去除其独立底行；含实际动作的旧组合保留操作顺序。独立根Token toast-width与toast-icon-offset由DESIGN集中派生，popover宽度不受此修改影响。重复文案不自动合并，宿主若有重复请求反馈应在已有请求/通知owner消除重复触发；本库不会吞掉独立通知。


### 查询页公开编排（4.2.20）

`/search-toolbar` 与根入口新增 QueryForm/QueryFormProps、QueryField/QueryFieldProps、QueryFieldWidth；`/data-table` 的 DataTableProps 新增可选 idleState；`/feedback` 的 EmptyStateProps 新增可选 align/icon。均为兼容扩展，无新 package subentry、Service 或查询 owner。未确认集合的 count 不再调用或播报假0；已确认空结果保留0计数，真实分页仍由宿主提供。类型、槽位、原生表单行为与迁移边界见 [组件合同](COMPONENTS.md#手动查询页-queryform--queryfield4220)，区域/宽度/八种状态见 [DESIGN](DESIGN.md#手动查询页布局与状态合同4220)，[示例](../examples/query-page-react/app.tsx)仅消费正式公共入口。


### 组合表格列宽（4.2.36）

React `/business-log`、`/structured-log`、`/api-key`、`/chart` 的组合新增 `columnSizing?: DataTableColumnSizingProps`，默认启用 DataTable 列宽调整，支持既有本地/受控/注入模式。React `/data-table` 的 `DataTableColumn<T>` 新增 `cellClassName?: string`；runtime `/business-log` 的 `BusinessLogListColumn` 新增 `resize?: DataTableColumnResizeOptions | false`。现有入口与根入口同步导出，原 Controller、查询、分页、详情、labels 与 cell 回调接线保持。

React `/structured-log` 新增 `StructuredLogExplorerColumnId`，`StructuredLogExplorerSlots.columnOptions` 按稳定语义 id 提供 `width/resize`；actions 仅允许 width 与 resize:false。纯 helper `getStructuredLogTable` 在原 headers/rows/action 外新增 columnIds。业务日志 detail、结构化日志 actions、API Key actions 在运行时始终固定；Chart 数据列均可调。具体 id 与组件默认见[组件合同](COMPONENTS.md#内部数据表格与列宽4236)。

```tsx
import {BusinessLogExplorer} from '@coffeehc/xui-react/business-log';
import {StructuredLogExplorer} from '@coffeehc/xui-react/structured-log';
import {createDataTableColumnSizingController} from '@coffeehc/xui-runtime/data-table';
const sizing = createDataTableColumnSizingController();
<BusinessLogExplorer controller={businessLogs} columnSizing={{controller:sizing}}
  list={{columns:[
    {id:'summary',header:'摘要',width:'20rem',resize:{minWidth:120,maxWidth:800}},
    {id:'detail',header:'详情',width:'8rem'},
  ]}} />;
<StructuredLogExplorer controller={structuredLogs}
  columnOptions={{summary:{width:'20rem',resize:{minWidth:120}},actions:{width:'8rem'}}} />;
```

注入实例由创建者销毁；不会保存偏好、重置查询或增加“重置列宽”按钮。按需 CSS 入口在 critical.css/table.css 外还须加载既有 table-resize.css；完整 style.css 已包含该分片。


### 图标容器形状（4.2.37）

`@coffeehc/xui-react/display` 与根入口新增 `IconShape`，IconProps 新增 `variant?:'plain'|'tile'`、`shape?:IconShape`。原 Icon 的 plain 无背景呈现保留；带背景的基础模型默认圆形，显式 square 使用共享方形圆角。CardProps 新增 iconShape；CardGroupCardProps 继承。ButtonProps/IconButtonProps、AvatarRootProps 和 InputGroup.Button 新增 shape，Button 的该选项仅用于 data-icon=true 的图标动作。原控制器、ref/render、事件、disabled/busy 与 Avatar peer 生命周期保留。

```tsx
import {Icon, Card, type IconShape} from '@coffeehc/xui-react/display';
import {IconButton} from '@coffeehc/xui-react/button';
import {Avatar} from '@coffeehc/xui-react/avatar';
<Icon variant="tile"><ResourceGlyph/></Icon>;
<Icon variant="tile" shape="square"><ResourceGlyph/></Icon>;
<Card title="资源" icon={<ResourceGlyph/>} />;
<Card title="明确方形" icon={<ResourceGlyph/>} iconShape="square" />;
<Card title="真实头像" iconVariant="plain" icon={<Avatar.Root><Avatar.Fallback>研</Avatar.Fallback></Avatar.Root>} />;
<IconButton aria-label="设置" shape="square"><SettingsGlyph/></IconButton>;
```

公开 CSS 标记 xui-icon-container / data-icon=true 默认圆形，data-icon-shape=square 为显式例外；不自动添加背景、尺寸、按钮角色或焦点停靠。被动槽与紧凑导航由库内部统一接入，宿主按[组件合同](COMPONENTS.md#图标背景基础模型4237)选择公开选项，不用按资源类型复制 CSS。新增尺寸、背景、导航内距和绘制层四个基础 Token 及 Card 原 Token 兼容别名见[设计合同](DESIGN.md#图标背景的统一形状4237)。

## 模型配置（4.2.39）

| import/script | 源码与导出 | 使用合同 | 示例 |
| --- | --- | --- | --- |
| `@coffeehc/xui-runtime/model-profile` <!-- public-entry: @coffeehc/xui-runtime/model-profile --> | [TypeScript Controller 与 Service](../packages/runtime/src/model-profile.ts) | [模型配置合同](COMPONENTS.md#公共模型配置) | [Mock 示例](../examples/model-profile-react/app.tsx) |
| `@coffeehc/xui-react/model-profile` <!-- public-entry: @coffeehc/xui-react/model-profile --> | [React 表单与编辑器](../packages/ui-react/src/model-profile.tsx) | [模型配置合同](COMPONENTS.md#公共模型配置) | [Mock 示例](../examples/model-profile-react/app.tsx) |

`ModelProfileService.read/catalog/test/save` 复用 HTTPService；模块导入不请求。隔离的已有 HTTP 可通过 `new ModelProfileClient({http})` 借用。`createModelProfileController` 每编辑器一份；默认 UI 自建或通过 controller 注入，二者互斥。未配置 HTTP/后端不偷偷 fallback。

六个 Provider ID 与 agentCore 对应：openai_completions、openai_responses、openai_images、openai_embeddings、gemini、anthropic。目录支持前四种；Gemini/Anthropic保留手工真实模型名。向量专用测试输入 `{input:string[],dimensions?:number}` 属于单次测试，不能放进聊天 default_policy 或保存向量索引配置。预览阶段核对的 agentCore `6c71d63` 已有 ListModels 与 TestModelProfile，后者拒绝 embedding；采用项目必须核对其实际版本的统一向量测试入口及 Embed，不将该历史检查视作最新能力结论。xui 不实现 SDK/测试协议。

默认配置由 agentCore提供、项目后端投影；本地核对的 agentCore `6c71d63` 尚未找到统一导出完整默认 Profile 的入口。xAgent 的部分模板仍是产品私有，不能复制成 xui 默认。示例默认值全是合成 mock。配置合并、授权、并发版本和凭据存储均归项目后端。AgentCore 执行入口仅接收后端已合并、包含真实明文凭据的有效 Profile；不接收前端 patch、掩码或 profile_id 查库请求。详见[后端实施提示词](#模型配置后端实施提示词)。

### 模型配置后端实施提示词

组件使用及逐动作处理逻辑见 [模型配置 README](../packages/ui-react/model-profile/README.md)，下方为后端接线合同。

> 在当前项目实现 XUI ModelProfileService 的后端合同，只改本项目被授权的后端，不修改 xui、不在前端加转换层。先核对当前 agentCore 的 Provider、默认 Profile、ListModels、TestModelProfile 和 Embed 公开能力；复用它们，缺口交 agentCore，不能在产品复制协议 SDK、Provider 默认数值或另一套探测算法。
>
> 所有响应使用当前标准 AjaxResponse：`{success,message,payload,request_id,code}`。下列 payload schema_version 固定 1，字段以 XUI 正式 types 为准。实体 ID 和版本作为不透明非空字符串，不转 JS Number。仅授权的配置管理身份可调用；读取/响应/日志禁止带真实密钥、Headers 值及原始上游错误。
>
> 1. `GET /api/v1/model-profiles/editor?profile_id=...`：省略 ID 返回新增初态；传 ID 鉴权并返回当前已保存版本。payload 为 `{schema_version:1,profile_id:string|null,version:string|null,config,defaults,has_api_key:boolean,header_names:string[],can_save:boolean}`。has_api_key仅声明是否已保存密钥，前端显示固定六星号；不返回原密钥或前缀。config 不含 api_key/headers/id/is_test/is_default；defaults 是允许使用的六种协议子集，各条为 agentCore 默认配置的无秘密投影。config 字段：provider_type/model_name/real_name/base_url/timeout_seconds/max_concurrency/disable_stream/capabilities/default_policy。不存在对象返回明确错误，不冒充新增。
> 2. `POST /api/v1/model-profiles/actions/catalog`：请求 `{profile_id?,expected_version?,config:{...显式修改字段}}`；返回 `{schema_version:1,models:[{id,owned_by?,created_at?}]}`。真实模型名不是目录前置；不保存、不标记测试通过，不从目录推断模型能力。代理支持/不支持目录要真实反馈。
> 3. `POST /api/v1/model-profiles/actions/test`：相同候选请求，向量另带 `embedding:{input:string[],dimensions?:number}`。返回 `{schema_version:1,kind:'chat'|'image_generation'|'embedding',passed:boolean,elapsed_ms:number,summary:string,embedding?:{count,dimensions}}`。summary 必须安全脱敏。向量通过时必须返回实际 count/dimensions，不回完整向量。测试产生上游成本，但本合同不保存配置或测试状态；禁止自动重放。agentCore 聊天/图片测试与向量编码能力不能混用。
> 4. `POST /api/v1/model-profiles` 新增、`PUT /api/v1/model-profiles/{id}` 修改：请求仍为候选；修改的路径 ID/请求 ID/expected_version 一致并做 CAS；返回最新 editor payload。保存不隐式调用模型测试，不伪造 is_test，影响执行的配置变更由后端清理旧验证事实。默认模型选择、引用约束等属于项目业务，非此组件的新 owner。
>
> 统一候选构建：有 ID 时读取并授权该配置，无 ID 时从 agentCore 对应 Provider 默认配置开始；仅覆盖请求明确存在的字段。未传保留，0/false是有效覆盖；api_key为固定六星号`******`时必须读取该已授权profile_id的原密钥；新增/原记录无密钥时拒绝此标记，绝不把它传给AgentCore或上游。空字符串明确不用密钥，其他值替换本次候选；省略沿用该已授权记录，新建省略没有历史密钥。六星号是保留标记，不能设置为真实密钥。headers/default_policy/capabilities按整个对象替换，headers={}清空，default_policy=null清空，不做隐式深合并。Provider切换时按目标协议规范校验和清理；未知协议拒绝。公共编辑器只投影后端初态并追踪显式草稿，不负责后端合并。项目后端完成上述步骤后，将完整有效的明文Profile交给AgentCore；AgentCore不解析掩码、不按profile_id查密钥、不合并配置、不处理项目存储。
>
> 秘密只在后端凭据存储和本次请求作用域短暂持有；配置ID、权限、默认模型、测试标记不允许从config覆盖。服务端校验Base URL、出口与凭据使用权限，禁止读取任意ID后把旧密钥发送到未经授权的目标。请求体与上游错误不得进入普通日志。以有限总预算传递取消；客户端取消不代表服务端写入回滚。超时/50301/响应丢失等保存结果未知需权威查询后处理；不盲目重试。明确拒绝返回400/403/409/422或已确认未提交的业务错误，其他不确定错误不能伪装成明确拒绝。
>
> 验收：六协议枚举一致；新增/修改、有旧密钥/替换/清空、headers删除、0/false、目录无需model、测试不保存、向量路径、版本冲突、越权ID、取消迟到、已提交但响应丢失、秘密脱敏与真实请求数量。当前xui demo全部mock，不代表任何项目或agentCore接口已完成接线。
