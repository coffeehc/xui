# 公开 API 与运行时合同

这是当前 manifests 的全部入口映射；完整通用规范只在 [DESIGN.md](DESIGN.md)，接入步骤见 [ADOPTION.md](ADOPTION.md)。没有省略 root/re-export/helper 入口，也不把规划能力列为可调用接口。

下表链接到可读源码与合同；正式 types 路径由包 exports.types 指向 dist 声明。请固定 checkout SHA，先构建再消费，不直接把源码链接设成产品 alias。根入口是相应子入口的汇总；命名类型和运行时导出逐项记录到可再生成的 `.artifacts/public-api.json`，不手写另一份函数签名。

[scripts/public-api.mjs](../scripts/public-api.mjs) 从实际 manifests/构建声明取全部名字；[文档守卫](../scripts/check-docs.mjs) 检查本表入口与 manifests 完全一致。[正式消费](../scripts/consumers.mjs) 在独立 tarball 安装中逐个读取 ESM/CSS/init、编译每个命名导出的 type import、导入各模块核对运行时导出，并打包全部 ESM/CSS；原生无 React。下面的完整页面与 fixture 再证明实际组装行为，入口通过不代表未跑的产品集成通过。

按章节查阅：

- [全部正式入口](#全部正式入口)
- [默认行为](#默认行为)
- [HTTP 与查询](#http-与查询)
- [认证会话](#认证会话)
- [API Key 管理](#api-key-管理)
- [业务日志](#业务日志)
- [程序错误观察](#程序错误观察)
- [默认适配器的服务前置](#默认适配器的服务前置)
- [通用资源控制器](#通用资源控制器)

## 全部正式入口

下表完整覆盖当前 101 个 manifest exports；组件用法按 [组件手册](COMPONENTS.md) 查阅，签名以固定版本的正式 types 为准。

### @coffeehc/xui-theme

| import/script | 源码与导出 | 使用合同 | 示例 |
| --- | --- | --- | --- |
| `@coffeehc/xui-theme/style.css` <!-- public-entry: @coffeehc/xui-theme/style.css --> | [源码](../scripts/tokens.mjs) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/tokens.css` <!-- public-entry: @coffeehc/xui-theme/tokens.css --> | [源码](DESIGN.md) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/components.css` <!-- public-entry: @coffeehc/xui-theme/components.css --> | [源码](../packages/theme/src/components.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/base.css` <!-- public-entry: @coffeehc/xui-theme/base.css --> | [源码](../packages/theme/src/base.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/button.css` <!-- public-entry: @coffeehc/xui-theme/button.css --> | [源码](../packages/theme/src/button.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/forms.css` <!-- public-entry: @coffeehc/xui-theme/forms.css --> | [源码](../packages/theme/src/forms.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/navigation.css` <!-- public-entry: @coffeehc/xui-theme/navigation.css --> | [源码](../packages/theme/src/navigation.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/feedback.css` <!-- public-entry: @coffeehc/xui-theme/feedback.css --> | [源码](../packages/theme/src/feedback.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/dialog.css` <!-- public-entry: @coffeehc/xui-theme/dialog.css --> | [源码](../packages/theme/src/dialog.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/layout.css` <!-- public-entry: @coffeehc/xui-theme/layout.css --> | [源码](../packages/theme/src/layout.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/floating.css` <!-- public-entry: @coffeehc/xui-theme/floating.css --> | [源码](../packages/theme/src/floating.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/table.css` <!-- public-entry: @coffeehc/xui-theme/table.css --> | [源码](../packages/theme/src/table.css) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/critical.css` <!-- public-entry: @coffeehc/xui-theme/critical.css --> | [源码](../scripts/tokens.mjs) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/auth.css` <!-- public-entry: @coffeehc/xui-theme/auth.css --> | [源码](../packages/theme/src/auth.css) | [合同](PUBLIC_API.md#认证会话) | [示例](../examples/login-vanilla/app.js) |
| `@coffeehc/xui-theme/sheet.css` <!-- public-entry: @coffeehc/xui-theme/sheet.css --> | [Sheet/确认/触发器样式](../packages/theme/src/sheet.css)，同样包含在critical/style | — | — |
| `@coffeehc/xui-theme/widgets.css` <!-- public-entry: @coffeehc/xui-theme/widgets.css --> | [源码](../packages/theme/src/widgets.css)，也包含于critical/style | — | — |
| `@coffeehc/xui-theme/search-toolbar.css` <!-- public-entry: @coffeehc/xui-theme/search-toolbar.css --> | 同时包含于 style/critical/components；统一尺寸和响应布局仅消费既有公共 token。 | [组件合同](COMPONENTS.md) | — |

### @coffeehc/xui-runtime

| import/script | 源码与导出 | 使用合同 | 示例 |
| --- | --- | --- | --- |
| `@coffeehc/xui-runtime` <!-- public-entry: @coffeehc/xui-runtime --> | [源码](../packages/runtime/src/index.ts) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/init.js` <!-- public-entry: @coffeehc/xui-runtime/init.js --> | [源码](../packages/runtime/src/init.ts) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/theme` <!-- public-entry: @coffeehc/xui-runtime/theme --> | [源码](../packages/runtime/src/theme.ts) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/theme-control` <!-- public-entry: @coffeehc/xui-runtime/theme-control --> | [源码](../packages/runtime/src/theme-control.ts) | [顶栏合同](COMPONENTS.md#布局与顶栏) | [示例](../examples/header-controls-vanilla/app.js) |
| `@coffeehc/xui-runtime/header-controls` <!-- public-entry: @coffeehc/xui-runtime/header-controls --> | [源码](../packages/runtime/src/header-controls.ts) | [语言合同](COMPONENTS.md#布局与顶栏) | [示例](../examples/header-controls-vanilla/app.js) |
| `@coffeehc/xui-runtime/loading` <!-- public-entry: @coffeehc/xui-runtime/loading --> | [源码](../packages/runtime/src/loading.ts) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/navigation` <!-- public-entry: @coffeehc/xui-runtime/navigation --> | [源码](../packages/runtime/src/navigation.ts) | [合同](COMPONENTS.md#导航与菜单) | [示例](../examples/menu-vanilla/app.js) |
| `@coffeehc/xui-runtime/http` <!-- public-entry: @coffeehc/xui-runtime/http --> | [源码](../packages/runtime/src/http.ts) | [合同](PUBLIC_API.md#http-与查询) | [示例](../examples/http-vanilla/app.js) |
| `@coffeehc/xui-runtime/query` <!-- public-entry: @coffeehc/xui-runtime/query --> | [源码](../packages/runtime/src/query.ts) | [合同](PUBLIC_API.md#http-与查询) | [示例](../examples/http-vanilla/app.js) |
| `@coffeehc/xui-runtime/menu-layout` <!-- public-entry: @coffeehc/xui-runtime/menu-layout --> | [源码](../packages/runtime/src/menu-layout.ts) | [合同](COMPONENTS.md#导航与菜单) | [示例](../examples/menu-vanilla/app.js) |
| `@coffeehc/xui-runtime/dom` <!-- public-entry: @coffeehc/xui-runtime/dom --> | [源码](../packages/runtime/src/dom.ts) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/internal/dialog-layout` <!-- public-entry: @coffeehc/xui-runtime/internal/dialog-layout --> | [内部实现](../packages/runtime/src/dialog-layout.ts) | 包间保留接线，非消费者稳定API；使用公开Dialog/Sheet | [内部类型](../packages/runtime/src/dialog-layout.ts) |
| `@coffeehc/xui-runtime/internal/navigation-presentation` <!-- public-entry: @coffeehc/xui-runtime/internal/navigation-presentation --> | [内部实现](../packages/runtime/src/navigation-presentation.ts) | 包间保留接线，非消费者稳定 API；使用公开 NavigationMenu 选项与名称部件 | [公共合同](COMPONENTS.md#导航与菜单) |
| `@coffeehc/xui-runtime/api-key` <!-- public-entry: @coffeehc/xui-runtime/api-key --> | [源码](../packages/runtime/src/api-key.ts) | [合同](PUBLIC_API.md#api-key-管理) | [示例](../examples/api-key-vanilla/app.js) |
| `@coffeehc/xui-runtime/api-key-dom` <!-- public-entry: @coffeehc/xui-runtime/api-key-dom --> | [源码](../packages/runtime/src/api-key-dom.ts) | [合同](PUBLIC_API.md#api-key-管理) | [示例](../examples/api-key-vanilla/app.js) |
| `@coffeehc/xui-runtime/structured-log` <!-- public-entry: @coffeehc/xui-runtime/structured-log --> | [源码](../packages/runtime/src/structured-log.ts) | [合同](PUBLIC_API.md#程序错误观察) | [示例](../examples/log-vanilla/app.js) |
| `@coffeehc/xui-runtime/structured-log-dom` <!-- public-entry: @coffeehc/xui-runtime/structured-log-dom --> | [源码](../packages/runtime/src/structured-log-dom.ts) | [合同](PUBLIC_API.md#程序错误观察) | [示例](../examples/log-vanilla/app.js) |
| `@coffeehc/xui-runtime/data-table` <!-- public-entry: @coffeehc/xui-runtime/data-table --> | [共享事实/类型](../packages/runtime/src/data-table.ts) | [完整组合](COMPONENTS.md#数据表格) | [模型](../examples/shared/data-table-model.ts) |
| `@coffeehc/xui-runtime/data-table-dom` <!-- public-entry: @coffeehc/xui-runtime/data-table-dom --> | [原生](../packages/runtime/src/data-table-dom.ts) | [完整组合](COMPONENTS.md#数据表格) | [示例](../examples/data-table-vanilla/app.js) |
| `@coffeehc/xui-runtime/grouped-combobox` <!-- public-entry: @coffeehc/xui-runtime/grouped-combobox --> | [源码](../packages/runtime/src/grouped-combobox.ts) | [合同](COMPONENTS.md#groupedcombobox-与-disclosure) | [示例](../examples/shared/grouped-search-model.ts) |
| `@coffeehc/xui-runtime/grouped-combobox-dom` <!-- public-entry: @coffeehc/xui-runtime/grouped-combobox-dom --> | [源码](../packages/runtime/src/grouped-combobox-dom.ts) | [合同](COMPONENTS.md#groupedcombobox-与-disclosure) | [示例](../examples/grouped-search-vanilla/app.js) |
| `@coffeehc/xui-runtime/business-log` <!-- public-entry: @coffeehc/xui-runtime/business-log --> | [源码](../packages/runtime/src/business-log.ts) | [合同](PUBLIC_API.md#业务日志) | [示例](../examples/business-log-vanilla/app.js) |
| `@coffeehc/xui-runtime/business-log-dom` <!-- public-entry: @coffeehc/xui-runtime/business-log-dom --> | [源码](../packages/runtime/src/business-log-dom.ts) | [合同](PUBLIC_API.md#业务日志) | [示例](../examples/business-log-vanilla/app.js) |
| `@coffeehc/xui-runtime/auth` <!-- public-entry: @coffeehc/xui-runtime/auth --> | [源码](../packages/runtime/src/auth.ts) | [合同](PUBLIC_API.md#认证会话) | [示例](../examples/shared/login-model.ts) |
| `@coffeehc/xui-runtime/entity-id` <!-- public-entry: @coffeehc/xui-runtime/entity-id --> | [源码](../packages/runtime/src/entity-id.ts) | [编码合同](PUBLIC_API.md#显式实体身份编码) | [合成合同](../tests/entity-id.test.mjs) |
| `@coffeehc/xui-runtime/login-dom` <!-- public-entry: @coffeehc/xui-runtime/login-dom --> | [源码](../packages/runtime/src/login-dom.ts) | [合同](PUBLIC_API.md#认证会话) | [示例](../examples/login-vanilla/app.js) |
| `@coffeehc/xui-runtime/password` <!-- public-entry: @coffeehc/xui-runtime/password --> | [源码](../packages/runtime/src/password.ts) | [合同](COMPONENTS.md#密码输入) | [验证](../tests/password.test.mjs) |
| `@coffeehc/xui-runtime/password-dom` <!-- public-entry: @coffeehc/xui-runtime/password-dom --> | [源码](../packages/runtime/src/password-dom.ts) | [合同](COMPONENTS.md#密码输入) | [验证](../tests/browser/password-fields.spec.mjs) |
| `@coffeehc/xui-runtime/choice-group` <!-- public-entry: @coffeehc/xui-runtime/choice-group --> | [源码](../packages/runtime/src/choice-group.ts) | [成组字段](COMPONENTS.md#成组选项) | [示例](../examples/choice-group-vanilla/app.js) |
| `@coffeehc/xui-runtime/choice-group-dom` <!-- public-entry: @coffeehc/xui-runtime/choice-group-dom --> | [源码](../packages/runtime/src/choice-group-dom.ts) | [成组字段](COMPONENTS.md#成组选项) | [示例](../examples/choice-group-vanilla/app.js) |
| `@coffeehc/xui-runtime/number-input` <!-- public-entry: @coffeehc/xui-runtime/number-input --> | [源码](../packages/runtime/src/number-input.ts) | [专用输入](COMPONENTS.md#文本输入) | [示例](../examples/text-inputs-vanilla/app.js) |
| `@coffeehc/xui-runtime/text-inputs-dom` <!-- public-entry: @coffeehc/xui-runtime/text-inputs-dom --> | [源码](../packages/runtime/src/text-inputs-dom.ts) | [专用输入](COMPONENTS.md#文本输入) | [示例](../examples/text-inputs-vanilla/app.js) |
| `@coffeehc/xui-runtime/download` <!-- public-entry: @coffeehc/xui-runtime/download --> | [下载](../packages/runtime/src/download.ts)：安全头信息、文件名、请求与显式保存 | — | — |
| `@coffeehc/xui-runtime/api-key-http` <!-- public-entry: @coffeehc/xui-runtime/api-key-http --> | [默认原生adapter](../packages/runtime/src/api-key-http.ts)，[页面API合同](PUBLIC_API.md#默认适配器的服务前置) | — | — |
| `@coffeehc/xui-runtime/business-log-http` <!-- public-entry: @coffeehc/xui-runtime/business-log-http --> | [默认原生loader](../packages/runtime/src/business-log-http.ts)，webfacade offset/ListData | — | — |
| `@coffeehc/xui-runtime/calendar` <!-- public-entry: @coffeehc/xui-runtime/calendar --> | [源码](../packages/runtime/src/calendar.ts)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-runtime/date-time` <!-- public-entry: @coffeehc/xui-runtime/date-time --> | [模型与值合同](../packages/runtime/src/date-time.ts) | [日期时间](COMPONENTS.md#日期时间选择) | [示例](../examples/date-time-vanilla/app.js) |
| `@coffeehc/xui-runtime/date-time-dom` <!-- public-entry: @coffeehc/xui-runtime/date-time-dom --> | [原生组合](../packages/runtime/src/date-time-dom.ts) | [日期时间](COMPONENTS.md#日期时间选择) | [示例](../examples/date-time-vanilla/app.js) |
| `@coffeehc/xui-runtime/widgets-dom` <!-- public-entry: @coffeehc/xui-runtime/widgets-dom --> | [源码](../packages/runtime/src/widgets-dom.ts)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-runtime/search-toolbar-dom` <!-- public-entry: @coffeehc/xui-runtime/search-toolbar-dom --> | 及根入口：`createSearchToolbar` / `SearchToolbarOptions` / `SearchToolbarController`，对应 Node/null 槽，稳定 update/getElement/getExpanded/destroy。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-runtime/display` <!-- public-entry: @coffeehc/xui-runtime/display --> | createCopyController、copyableLabels、validateImageOptions 与文字/复制/图片共享类型。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-runtime/display-dom` <!-- public-entry: @coffeehc/xui-runtime/display-dom --> | createTypographyHeading/Text/Link/Code、createCopyable、createSeparator、createTag、createImage 与原生 options。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-runtime/admin-setup` <!-- public-entry: @coffeehc/xui-runtime/admin-setup --> | createAdminSetupController、adminSetupLabels、getAdminSetupMessage 和 AdminSetupStatus/State/Result/Credentials/Submit/Labels/Controller/ControllerOptions。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-runtime/admin-setup-dom` <!-- public-entry: @coffeehc/xui-runtime/admin-setup-dom --> | createAdminSetupPage、AdminSetupPageOptions、AdminSetupPageController。 | [组件合同](COMPONENTS.md) | — |

### @coffeehc/xui-react

| import/script | 源码与导出 | 使用合同 | 示例 |
| --- | --- | --- | --- |
| `@coffeehc/xui-react` <!-- public-entry: @coffeehc/xui-react --> | [源码](../packages/ui-react/src/index.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/button` <!-- public-entry: @coffeehc/xui-react/button --> | [源码](../packages/ui-react/src/button.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/forms` <!-- public-entry: @coffeehc/xui-react/forms --> | [源码](../packages/ui-react/src/forms.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/navigation` <!-- public-entry: @coffeehc/xui-react/navigation --> | [源码](../packages/ui-react/src/navigation.tsx) | [合同](COMPONENTS.md#导航与菜单) | [示例](../examples/menu-react/app.tsx) |
| `@coffeehc/xui-react/menu-layout` <!-- public-entry: @coffeehc/xui-react/menu-layout --> | [源码](../packages/ui-react/src/menu-layout.tsx) | [合同](COMPONENTS.md#导航与菜单) | [示例](../examples/menu-react/app.tsx) |
| `@coffeehc/xui-react/tabs` <!-- public-entry: @coffeehc/xui-react/tabs --> | [源码](../packages/ui-react/src/tabs.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/dialog` <!-- public-entry: @coffeehc/xui-react/dialog --> | [源码](../packages/ui-react/src/dialog.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/feedback` <!-- public-entry: @coffeehc/xui-react/feedback --> | [源码](../packages/ui-react/src/feedback.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/metric-card` <!-- public-entry: @coffeehc/xui-react/metric-card --> | [源码](../packages/ui-react/src/metric-card.tsx) | [指标卡组合](COMPONENTS.md#metriccard) | [示例](../examples/metric-card-react/app.tsx) |
| `@coffeehc/xui-react/layout` <!-- public-entry: @coffeehc/xui-react/layout --> | [源码](../packages/ui-react/src/layout.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/table` <!-- public-entry: @coffeehc/xui-react/table --> | [源码](../packages/ui-react/src/table.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/data-table` <!-- public-entry: @coffeehc/xui-react/data-table --> | [源码](../packages/ui-react/src/data-table.tsx) | [完整组合](COMPONENTS.md#数据表格) | [示例](../examples/data-table-react/app.tsx) |
| `@coffeehc/xui-react/select` <!-- public-entry: @coffeehc/xui-react/select --> | [源码](../packages/ui-react/src/select.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/combobox` <!-- public-entry: @coffeehc/xui-react/combobox --> | [源码](../packages/ui-react/src/combobox.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/grouped-combobox` <!-- public-entry: @coffeehc/xui-react/grouped-combobox --> | [源码](../packages/ui-react/src/grouped-combobox.tsx) | [合同](COMPONENTS.md#groupedcombobox-与-disclosure) | [示例](../examples/grouped-search-react/app.tsx) |
| `@coffeehc/xui-react/menu` <!-- public-entry: @coffeehc/xui-react/menu --> | [源码](../packages/ui-react/src/menu.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/popover` <!-- public-entry: @coffeehc/xui-react/popover --> | [源码](../packages/ui-react/src/popover.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/tooltip` <!-- public-entry: @coffeehc/xui-react/tooltip --> | [源码](../packages/ui-react/src/tooltip.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/toast` <!-- public-entry: @coffeehc/xui-react/toast --> | [源码](../packages/ui-react/src/toast.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/theme` <!-- public-entry: @coffeehc/xui-react/theme --> | [源码](../packages/ui-react/src/theme.tsx) | [合同](ADOPTION.md#组件层次与扩展原则) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/api-key` <!-- public-entry: @coffeehc/xui-react/api-key --> | [源码](../packages/ui-react/src/api-key.tsx) | [合同](PUBLIC_API.md#api-key-管理) | [示例](../examples/api-key-react/app.tsx) |
| `@coffeehc/xui-react/structured-log` <!-- public-entry: @coffeehc/xui-react/structured-log --> | [源码](../packages/ui-react/src/structured-log.tsx) | [合同](PUBLIC_API.md#程序错误观察) | [示例](../examples/log-react/app.tsx) |
| `@coffeehc/xui-react/business-log` <!-- public-entry: @coffeehc/xui-react/business-log --> | [源码](../packages/ui-react/src/business-log.tsx) | [合同](PUBLIC_API.md#业务日志) | [示例](../examples/business-log-react/app.tsx) |
| `@coffeehc/xui-react/login` <!-- public-entry: @coffeehc/xui-react/login --> | [源码](../packages/ui-react/src/login.tsx) | [合同](PUBLIC_API.md#认证会话) | [示例](../examples/login-react/app.tsx) |
| `@coffeehc/xui-react/password` <!-- public-entry: @coffeehc/xui-react/password --> | [源码](../packages/ui-react/src/password.tsx) | [合同](COMPONENTS.md#密码输入) | [验证](../tests/browser/password-fields.spec.mjs) |
| `@coffeehc/xui-react/choice-group` <!-- public-entry: @coffeehc/xui-react/choice-group --> | [源码](../packages/ui-react/src/choice-group.tsx) | [成组字段](COMPONENTS.md#成组选项) | [示例](../examples/choice-group-react/app.tsx) |
| `@coffeehc/xui-react/text-inputs` <!-- public-entry: @coffeehc/xui-react/text-inputs --> | [源码](../packages/ui-react/src/text-inputs.tsx) | [专用输入](COMPONENTS.md#文本输入) | [示例](../examples/text-inputs-react/app.tsx) |
| `@coffeehc/xui-react/sheet` <!-- public-entry: @coffeehc/xui-react/sheet --> | [Sheet](../packages/ui-react/src/sheet.tsx)，复用Dialog lifecycle | — | — |
| `@coffeehc/xui-react/alert-dialog` <!-- public-entry: @coffeehc/xui-react/alert-dialog --> | [AlertDialog](../packages/ui-react/src/alert-dialog.tsx)，显式确认/取消 | — | — |
| `@coffeehc/xui-react/context-menu` <!-- public-entry: @coffeehc/xui-react/context-menu --> | [ContextMenu](../packages/ui-react/src/context-menu.tsx)，复用Menu部件 | — | — |
| `@coffeehc/xui-react/toggle-group` <!-- public-entry: @coffeehc/xui-react/toggle-group --> | [源码](../packages/ui-react/src/toggle-group.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/avatar` <!-- public-entry: @coffeehc/xui-react/avatar --> | [源码](../packages/ui-react/src/avatar.tsx)，[合同](COMPONENTS.md#avatar) | — | — |
| `@coffeehc/xui-react/accordion` <!-- public-entry: @coffeehc/xui-react/accordion --> | [源码](../packages/ui-react/src/accordion.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/scroll-area` <!-- public-entry: @coffeehc/xui-react/scroll-area --> | [源码](../packages/ui-react/src/scroll-area.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/calendar` <!-- public-entry: @coffeehc/xui-react/calendar --> | [源码](../packages/ui-react/src/calendar.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/date-time` <!-- public-entry: @coffeehc/xui-react/date-time --> | [React 组合](../packages/ui-react/src/date-time.tsx) | [日期时间](COMPONENTS.md#日期时间选择) | [示例](../examples/date-time-react/app.tsx) |
| `@coffeehc/xui-react/command` <!-- public-entry: @coffeehc/xui-react/command --> | [源码](../packages/ui-react/src/command.tsx)，[合同](COMPONENTS.md#选择与复合控件) | — | — |
| `@coffeehc/xui-react/search-toolbar` <!-- public-entry: @coffeehc/xui-react/search-toolbar --> | 及根入口：`SearchToolbar` / `SearchToolbarProps`，search/actions/advanced 三内容槽；defaultExpanded=false，支持 expanded/onExpandedChange，advancedLabel 与 div props/ref。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-react/display` <!-- public-entry: @coffeehc/xui-react/display --> | Typography.Heading/Text/Link/Code、Copyable、Separator、Tag、Image，及同名 props/共享类型。 | [组件合同](COMPONENTS.md) | — |
| `@coffeehc/xui-react/admin-setup` <!-- public-entry: @coffeehc/xui-react/admin-setup --> | AdminSetupPage、AdminSetupPageProps、AdminSetupPageHandle 与共享状态类型。 | [组件合同](COMPONENTS.md) | — |

## 默认行为

这些默认值来自上表源码；品牌原始值与 motion 参数仍只由 DESIGN 的受控 token 块定义，不在此复制色板。未改写的复合控件 props/parts 使用当前 Base UI peer 的声明与行为，不能根据另一个版本猜默认值。

| 能力 | 当前默认值与 owner |
| --- | --- |
| theme/init/useTheme | dark、sessionStorage key `ui.theme.mode`、persist 开启，同标签页刷新保留、不主动跨页同步、不读取或迁移旧localStorage；无保存值/非法值回 dark，只有显式 system 在媒体读取失败时生效 light，storage 失败保留内存。传 mode 为受控且不读写 storage；同步 init 复用 window.xuiTheme，useTheme 只订阅 |
| 原生 UI ID | 按 ownerDocument 共享分配，跨 bundle/多实例/卸载重建不重用；无 crypto/randomUUID 或 HTTPS 前置条件。已有显式 DOM ID 与 Toast message.id 保留。仅临时 UI 身份，不是认证/安全随机或持久业务 ID，见 [内网 HTTP 接入](ADOPTION.md#原生-ui-id-与内网-http) |
| Button/IconButton | type=button、variant=primary、size=default；busy 与 disabled 分开，无隐式防重复；IconButton 要求 aria-label。render/ref/事件沿用公开 peer 合并合同 |
| Field/Fieldset/choices | Field 自动统一已知控件 id/label/help/error；复合输入显式 controlId。Input/Textarea/SimpleSelect 与 checkbox/radio/switch 值/事件由宿主；Fieldset 独立关联 legend/help/error |
| MenuLayout/NavigationMenu | 未受控时 collapsed=false、sidebarOpen=false、未指定展开集合为空，当前链接祖先自动展开。activeId 省略才按同源精确 pathname 选择；null/无匹配无 selected。无 navigation adapter 时保留原生链接，菜单键盘/drawer owner 由库提供 |
| GroupedCombobox | 一个输入/listbox；查询/open/分页受控，预过滤数据由宿主；折叠和分页按钮在 listbox 外。选中默认 null；[合同](COMPONENTS.md#groupedcombobox-与-disclosure) |
| Pagination/Disclosure | Pagination 默认第 1 页，pageCount 由宿主；受控 page 只请求确认。Disclosure 默认关闭，装饰性 chevron 与公开 DisclosureIndicator 复用相同 tokens。两者不发请求、不自动路由 |
| React Tabs/原生 tabs | React Root/List props 保留固定 peer 行为，xui 只补跳过 disabled 的方向键。原生默认手动激活、loopFocus=true；初始 value 优先 options，其次已有 selected，最后首个可用项；受控必须 syncValue |
| Dialog/Popover/Menu/Tooltip | 关闭不保存。原生 open 默认 false；受控 syncOpen、可取消 change。React Content portal/默认定位：Select bottom/start 且 alignItemWithTrigger=false，Combobox/Menu bottom/start，Popover bottom/center，Tooltip top/center；positionerProps 可覆盖。Dialog 为模态，非模态浮层不 trap；Tooltip 只放说明 |
| Sheet/AlertDialog/ContextMenu | Sheet默认end，确认initialFocus由宿主或安全取消/中性节点；context rightclick/Shift+F10，checked状态宿主拥有；details.cancel/finalFocus/嵌套生命周期见[弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| Toast | 原生按 id 去重、默认限额 5（limit 可覆盖且至少 1），未给 timeoutMs 不自动消失；显式 timeout 由 performance.now 计时，hover/focus 暂停。React Provider/manager props 保留 peer 默认，不伪称两套计时行为相同；必要错误就地持续可见 |
| Table/layout | 真实标准元素、header cell 默认 scope=col；TableContainer 为可聚焦 region，宿主给名字。SortButton type=button；striped/expandedRow/ExpandedRow/ExpandButton与逻辑stickyOffset公开；排序/选择/查询/虚拟化不由库执行。PageHeader 主标题和 actions，AppShell 默认抽屉关闭 |
| feedback/resource | Alert 默认 info/status，error 为 alert；DataRegion busy=false；显式传 feedback（含 null）时保留局部反馈槽，原生可用公开 xui-feedback-slot；LoadingState 默认 Loading…，ErrorState 默认 Retry。resource 初始 idle、isEmpty 未声明不猜空、无 timeout/cache/请求或自动 retry；换 key 清旧值、同 key 刷新保留，hooks 只订阅 |
| MetricCard | label/value 必填且原样显示（保留0）；marker默认无、空内容不占位；section/dl/dt/dd为被动展示，未内置按钮/live角色。复用Surface/stat tokens，排列仍由Grid；[合同](COMPONENTS.md#metriccard) |
| HTTP | 默认 GET、response=ajax、same-origin credentials、Go success=true，code 为业务元数据；普通30秒/blob120秒预算，无自动重试。空/false/null payload 合法。响应模式、headers、认证/错误/重试适配与预算见 HTTP 合同，写操作不自动重放 |
| webfacade query | pageIndexOffset 必须逐 endpoint 明确，maxPageSize/字段 codecs/sort 白名单由宿主。没有全局页基数、上限或日期/object 隐式转换；ListData 为 list + 可选 total/next_cursor；总数缺省未知，游标缺省未声明、null明确末页，见 [列表合同](PUBLIC_API.md#列表元数据与受控游标分页) |
| API Key | 首次读取由宿主 refresh；canCreate明确true才创建、撤销/删除需capability或明确宿主许可；过期可按授权撤销，删除仅已撤销管理记录。required权限与独立confirmed保留；默认 HTTP facade/routes 见本节 API Key 与默认适配器前置章节，单一写入owner，未知结果普通列表核验一次，结束等待后可手动再试、不自动重写；完整值仅瞬时结果 |
| 业务日志 | 显式首次 refresh，page size=50（1–200），两宿主共享loader，默认原生 HTTP facade 见本节默认适配器前置章节，auth/scope由宿主；固定公共事实与版本化 JSON payload。renderer 精确匹配类型/版本的首项；未匹配格式化 JSON，抛错固定反馈与 JSON。JSON 64 KiB/16 层/4096 节点；不缓存 payload |
| 登录页/auth | 同一个 HTTP/auth/theme owner；居中单列窄框、可选 fullscreen 和 brandVisual。Bearer v2 login/refresh/logout/session；access 仅内存，protectedPaths 明确受保护端点；15秒默认预算、no-store、无写入重放。登录直接 POST，提交禁用显示正在登录；超时后普通会话核验一次，未确认则显示错误并允许手动重试。无持久门禁、恢复预请求或恢复弹窗。保留密码清理、安全回跳和宿主导航扩展，详见 [登录与会话](PUBLIC_API.md#认证会话) |
| 独立结构化错误 | 初始 groups、page size=50（1–200），host 显式 refresh；无隐式 endpoint/scope/排序/总记录数。v1/list/cursor、纳秒时间、uint64 字符串、三态、累计/命中/首次代表；详情只按记录 ID 读取，缓存仅当前链已访问摘要，刷新新快照 |

## HTTP 与查询

这是实现接口；完整通用规则只在 [DESIGN.md](DESIGN.md)。从 runtime/http、runtime/query 导入，React/原生使用同一无框架类型。React 复用 useResource/DataRegion/ErrorState，不创建第二套请求 owner。

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

createHttpClient 配置 baseURL、fetch、headers/getHeaders、默认 response/adapter、timeoutMs/credentials、onUnauthorized/onError。baseURL 必须无 URL 凭据、为绝对 HTTP(S)；request 必须同源，各后端可各建客户端。ESM 导入不发请求、不读 DOM。裸HTTP transport不保存token、storage、cache或路由；headers/provider来自宿主。绑定[Bearer v2认证owner](PUBLIC_API.md#认证会话)后由该owner私有内存持有session access，显式protectedPaths业务请求强制Bearer/omit/error，固定cookie端点无Bearer/same-origin；禁止手动第二凭据、重试/redirect/credentials覆盖。

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

createHttpClient 的默认 ajax 模式、ajaxResponseAdapter 与 createAjaxResponseAdapter() 共用 success 判定，code=0/1/2 或其他合法整数均不会把 success=true 改判为失败。仅端点确有额外严格合同才显式使用 createAjaxResponseAdapter({successCode})：此时同时要求 success=true 且 code 与指定值相等；不传 successCode 不启用码值限制。普通消费者不需要配置成功码或另写 parser。ResponseAdapter 接收未知解码值和 status/headerRequestId/endpointId/attempts，返回 payload 和可选 code/bodyRequestId/redirect；缺 payload 的结果被拒绝。客户端 adapter 属于默认模式，endpoint 明确换 response 模式时不继承不同模式的 adapter，也可提供 endpoint adapter。

响应为 payload/status/code/requestId/bodyRequestId/headerRequestId/redirect；非空 body id 优先 header，两者都保留，不伪造 traceId。redirect 只是数据，不触发应用导航。成功响应headers仅为冻结的contentType/contentDisposition/contentLength，超过长度或含控制字符的值为null；没有原始Response、完整Headers或请求对象，Authorization/Set-Cookie/WWW-Authenticate不会暴露。领域校验只在一次声明的 endpoint adapter；标准请求不把 null 改成其他字段。

requestDownload默认120秒与detectAjaxErrors:true，保留HTTP200原生Go失败envelope检测；HttpClient 的 blob detectAjaxErrors 与默认 JSON AjaxResponse 复用同一 success 判定，合法 success=true/code=0/1/2 等仍返回原始 Blob，并在 HttpResponse 保留 code/request id/redirect 元数据，不拆包成 payload。success=false 的合法 envelope 是业务失败；明确attachment的JSON文件保持文件，不猜为错误。resolveDownloadFileName优先UTF-8 filename*，处理引号/重复参数/无效编码并清理路径、控制字符与方向控制字符；不是文件内容安全检查。saveDownload只在宿主明确用户动作中调用，临时link和URL释放且不改焦点。下载不是JS读取认证头的理由。无流式/SSE/WebSocket/protobuf、上传进度、断点续传或文件安全校验支持声明，这些协议另行明确接入。

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

正式 [React 页面](../examples/http-react/app.tsx)、[原生页面](../examples/http-vanilla/app.js)/[HTML](../examples/http-vanilla/index.html) 共用 [typed endpoint model](../examples/shared/http-model.ts)，仅导入公开组件/工厂和 CSS。独立 tarball、types 与真实 fetch 由 [consumer](../scripts/consumers.mjs) 和 [浏览器检查](../tests/browser/http.spec.mjs) 验证。

根目录 pnpm build、pnpm test:consumer、pnpm preview 后访问 /http-react/ 或 /http-vanilla/；本地 /api/xui-example/records 是明确合成 fixture，页基数0/上限50不是产品默认合同，不访问真实后端。不请求 total 时 fixture 省略字段，双端示例显示未知并隐藏编号翻页，不以当前页 list.length 伪造 pageCount；需要游标使用 DataTable 的显式 cursor 模式。

接入先检查 headers/credentials、权限、缓存/去重、认证、日志、取消、上传/下载及业务恢复；保留必要行为，再收敛一个 transport/auth/error/resource owner。选用默认 ajax/query 或页面 adapter 时严格满足其 wire 合同；其它领域协议通过明确的 ResponseAdapter/ErrorResponseAdapter 接入，不猜别名、不要求全量业务 API 迁移。已有使用方的升级按 [发布状态原则](ADOPTION.md#发布状态与升级原则) 保留必要兼容与退出条件。

删除精确重复的 fetch 拦截器/认证跳转/Toast/loading owner；保留领域 API 作为一次 endpoint adapter。移除私造 query AST、隐式页码/日期/object 转换和重复编码。按 [采用手册](ADOPTION.md) 逐页迁移、真实构建验收，不先盲删业务权限/功能。

### 非2xx结构化错误适配

`createJsonApiErrorAdapter` 明确映射 `{error:{code:string,message:string,request_id:string}}`；不猜顶层 code/msg 或 JSON:API errors 数组。其它错误协议由宿主提供 typed ErrorResponseAdapter，按实际合同投影，不将正常领域适配视为必须删除的兼容层。业务 API 或后端迁移由宿主单独决定。

ErrorResponseAdapter可在client或单request明确配置；原生默认adapter保留Go字段，页面默认adapters显式选原生解析，并固定Accept:application/json及JSON写入Content-Type:application/json；保留其他宿主headers，不继承临时旧编码协议。HTTP status与业务code分开；任何body解析/投影失败保持HTTP事实和readFailure，不伪造成功。解码后结构化投影上限为64KiB JSON响应（当前先完整读取，非流式读取上限），message最多2048字符；details需显式allowlist投影，最多16KiB/depth8/512节点，拒绝函数/getter/prototype/cycle/unsafe整数。投影限制不等于后端脱敏；不能全量日志或直接弹出原始敏感响应。

401仍在收到响应头时按现有epoch通知，不能依赖该早期回调取得body code。需要按明确领域业务码判断失效时，显式unauthorized:ignore并由已有认证owner处理最终HttpError，不另造认证owner或吞掉401。跨origin下载需后端准确CORS与Expose-Headers允许Content-Disposition等所需字段；库不会绕过浏览器策略。

### 明确的原生应用origin与transport

createHttpClient({baseURL:'wails://wails/',nativeOrigin:'wails://wails',fetch:bridge})允许宿主显式声明hierarchical应用scheme/authority并注入原生fetch bridge。默认只接受HTTP(S)；自定义origin必须有host，不含URL凭据/query/hash或路径（空或/），拒绝http/https/data/blob/file/javascript/mailto作为nativeOrigin。原生同源按scheme、host、port三元组比对，绝不把不同自定义URL的origin=null当相同来源；所有目标再次拒绝凭据与外部tuple。

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

`createAuthClient({http,idEncoding:'hex'})` 统一校验 login/refresh/session 的用户 ID，`parseAuthSession(value,'hex')` 提供同一安全 DTO 解析；未知配置在网络请求与 owner 绑定前拒绝。`createApiKeyHttpAdapter({http,idEncoding:'hex'})` 与 `parseApiKeyWireMetadata(value,'hex')` 使用同一编码校验 list/create metadata、revoke/delete 确认及目标路径；非法动作目标在发送前拒绝，响应 ID 必须精确匹配目标。权限/期限 ID 是业务代码，保持原合同。

省略编码等同 decimal。选用配套 baseservice facade 时，其 Options.IDEncoding 同步配置为 idservice.HexIDEncoding；内部模型、鉴权、数据库和密文 AAD 不变。业务日志没有相应 hex 选项，不能从认证配置推断。纯 ApiKeyAdapter/controller/视图仍允许宿主自己的不透明 ID，不将所有领域接口强制成数值身份。

[共享身份矩阵](../tests/fixtures/contracts/identity-encodings.v1.json)、[hex 认证 fixture](../tests/fixtures/contracts/auth.v2.hex.json) 与 [hex Key v2 fixture](../tests/fixtures/api-key-contracts.v2.hex.json) 验证明确编码；Cookie/Bearer 隔离、内存凭据、取消/迟到和不重放规则不变。响应格式失败不暗中回退另一编码，也不能把后端已提交但投影失败称作回滚。

## 认证会话

`ConfigurableLoginPage` 和 `createLoginPage` 共享一个 `createAuthClient`，保持现有默认主题、布局、扩展、密码清理和安全回跳。这个自有应用合同配套 baseservice authenticationservice/webfacade；不是 OAuth/OIDC token endpoint，不替换第三方标准协议，不表示任何业务项目、生产登录链或部署已迁移。

### 固定 HTTP 合同

`createAuthClient({http, protectedPaths, timeoutMs, idEncoding})` 绑定宿主已有 `createHttpClient`。同一 transport 只能有一个认证 owner；不创建并行 fetch、token store 或第二个401拦截器。认证预算默认15秒。地址始终为根路径，不附加 baseURL 的路径、不猜 token/me/state 等旧路由。

| 操作 | 固定端点 | 请求凭据 | 成功 payload |
| --- | --- | --- | --- |
| login | POST /api/v1/auth/login，JSON username/password | 无 Authorization，credentials:same-origin | IssuedSessionV2 |
| refresh | POST /api/v1/auth/refresh，JSON {} | 无 Authorization，仅恢复 Cookie，credentials:same-origin | IssuedSessionV2 |
| currentUser 的 session 核对 | GET /api/v1/auth/session | session access Bearer，credentials:omit | AuthSessionV2 |
| logout | POST /api/v1/auth/logout，JSON {} | 无 Authorization，仅恢复 Cookie，credentials:same-origin | null |

以上请求统一 `Accept:application/json`、写入 `Content-Type:application/json`、`cache:no-store`、`redirect:error`，无自动重试。成功外层严格采用 httpx `AjaxResponse`：success/message/payload/request_id/code；业务成功仍由 success=true 决定，code 为安全整数。HTTP状态与业务码分开，不猜 data/msg 等别名。

AuthSessionV2 = `{schema_version:2,user:{id,username,display_name}}`。
IssuedSessionV2 在上述字段之外恰有 `access_token`、`token_type:"Bearer"`、`expires_at`。该含秘密 DTO 的解析器不公开；login/refresh 返回值只有 user。`parseAuthSession` 只接受无 token 的 session DTO。

用户 id 默认是正十进制 int64 字符串；`createAuthClient({http,idEncoding:"hex"})` 与 `parseAuthSession(value,"hex")` 可明确选择小写无前缀/前导零 hex。两者范围均为正 int64，不得转JS number；未知编码立即拒绝。详见 [共享实体编码](PUBLIC_API.md#显式实体身份编码)。username 非空、最多128 UTF-16单元；display_name 为null或最多256单元。拒绝额外字段、getter、旧版本、角色/权限/tenant投影。`access_token` 使用 `<prefix>-v1-sha256-access-<secret>`：prefix 为 `[a-z][a-z0-9]{0,31}`，secret 是32字节随机值的43字符规范无padding base64url。客户端仅接受 v1、sha256 和 access 类型的结构；服务端仍按配置前缀、凭据记录及 scope 校验，不能凭标识直接授权。此处 v1 是凭据格式版本，与 HTTP DTO 的 schema_version=2 分开；sha256 是高熵凭据摘要算法，不是密码算法，也不表示 JWT。新基线不接受旧无版本格式。expires_at 为尚未到期的UTC RFC3339；服务器默认access寿命5分钟，可由后端显式配置，不将JWT解码结果当作服务端权限。

用户名提交前trim；密码不trim且最多4096字符，只在POST body使用，不进入回调、URL、storage、日志或state。返回的 identity 不是授权决策依据。

### 一个内存 owner 与显式保护端点

先创建共享HTTP，再创建auth，例如：

```ts
const http = createHttpClient({baseURL: location.origin});
const auth = createAuthClient({http, protectedPaths: ['/api/v1/orders/', '/api/v1/profile']});
await auth.currentUser();
```

protectedPaths是精确路径，或以斜杠结尾的子树前缀；只接受规范根相对路径，不能带query/hash/URL/百分号。`/api/v1/orders/`不会匹配`/api/v1/orders-other`。HTTP首先规范化请求URL并校验同配置origin；认证owner拒绝歧义编码路径与直接绕过owner调用固定auth端点。前端路径表只是防止发送凭据到错误端点，后端仍必须独立校验route policy、身份、资源和权限。

声明的业务端点集中注入 `Authorization: Bearer <access>`，强制 `credentials:omit`、`redirect:error`，拒绝调用方覆盖或generic retry。已有静态headers/getHeaders/单请求headers若混入Authorization、Cookie或X-API-Key，发送前报安全错误，不静默覆盖第二凭据。CSRF及其他非秘密宿主header仍合并。未声明公共端点不会收到本owner的access。请求及非空Response.url都校验目标origin；自定义fetch必须真正遵守redirect:error，不能在内部透明改目标。

本owner只持有session access。API Key供Agent/集成使用，不从登录页签发或保存为会话；不要把API Key注入这个session owner。后端session scope是当前用户权限；API Key scope是当前用户权限∩key grants，受固定namespace用途和host资源策略约束。相同Bearer语法不意味着相同scope，session endpoint只接受session credential。

access和expiry只存在闭包内存，public AuthState、login/refresh/currentUser返回值、广播、日志和缓存没有token。禁止localStorage/sessionStorage/URL/共享channel存token。owner销毁后原managed routes继续失败关闭；新owner使用新HTTP实例。销毁auth不等于服务器logout。

### 会话初始化、401与并发

公开接口为 `getState/subscribe/currentUser/refresh/login/logout/cancel/expire/destroy`。state仅有status、user、busy、safe HttpError，不暴露secret/expiry。

- 新页面第一次currentUser先进行一次cookie refresh，再以新access调用session核对。缺失/过期恢复凭据401是正常anonymous，后续不会循环bootstrap。这支持现有默认整页location.assign；目标页同样先连接owner并currentUser。没有把默认导航强制改SPA。
- access到期或将到期时，只在业务请求需求发生后refresh，不做后台keepalive。
- 已发送业务请求的401只对它使用的access generation失效，合并一个refresh；原业务请求仍拒绝401，绝不自动重放写入。旧代迟到401不会清掉较新login/refresh结果。403不触发refresh，不变成“未登录”。若宿主要重读，必须明确是幂等读，由该领域owner最多重试一次；该auth owner禁止generic retry。
- 同tab refresh和session核对singleflight。取消一个调用者的signal仅撤销该等待者，不取消其他等待者共享的刷新。显式auth.cancel/destroy才取消owner执行并抛弃迟到结果。
- login/refresh/logout按本地队列串行；支持Web Locks的浏览器还按同origin锁跨tab串行。logout先清本地access，等待已在途refresh完成后使用浏览器最新恢复cookie撤销整个family。新login/退出意图阻止旧请求恢复旧identity。
- BroadcastChannel只发送不含 token/user 的临时身份失效通知；不保存 localStorage epoch 或持久操作记录。无 Web Locks/广播或存在同源非 xui 客户端时不承诺跨窗口无缝协调，后端事务和会话凭据规则仍是事实来源。

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

### Cookie、CSRF与后端责任

恢复cookie名 `__Host-baseservice-refresh`：HttpOnly、Secure、SameSite=Strict、Path=/、无Domain；只有后端明确development-only insecure模式才使用 `baseservice_refresh`。重复/替代名cookie、Cookie/Header混用、legacy会话cookie、错误purpose或API Key不能作为session/refresh fallback。

Cookie mutation必须在外层事务确认后才发送新secret/Set-Cookie；unknown/postcommit失败不得签发或清cookie。logout缺cookie幂等成功；已消费旧cookie409不得清cookie或撤销仍有效family。family默认绝对8小时、空闲30分钟；账户禁用、密码变更/会话撤销必须使family失效，重新启用不能复活旧family。

包括login在内的所有cookie写入需要后端严格CSRF：baseservice由宿主Options.CSRF精确校验Origin，可结合Fetch Metadata和缺header策略；JSON Content-Type仅为辅助，配套准确CORS、限速及枚举防护。本合同不新增自定义CSRF token/header。前端same-origin credentials和JSON并不提供完整CSRF保证。当前默认owner只支持同源cookie恢复；不自动开启跨origin include，也不读取/制造CSRF token。标准OAuth/OIDC/SAML仍由宿主按标准流程集成。

### 验证与采用

[共享wire fixture](../tests/fixtures/contracts/auth.v2.json)与[baseservice 0f5dba4](https://github.com/coffeehc/baseservice/blob/0f5dba4392279ccf85bba262ae4f453ea57bd579/docs/contracts/auth.v2.json)固定字节一致（配套[后端合同](https://github.com/coffeehc/baseservice/blob/0f5dba4392279ccf85bba262ae4f453ea57bd579/docs/bearer-auth-v2.md)），含issued/session/logout和8类错误。unit覆盖严格DTO/凭据隔离/恢复/多401/旧代响应/取消等待者/refresh-logout排序/不确定结果/不重放。正式React与原生消费者只用公开入口和tarball。浏览器测试覆盖原生整页导航恢复、Cookie/Authorization隔离、跨tab锁与安全通知；实际执行范围见 [VALIDATION.md](VALIDATION.md)，测试存在不等于全部场景通过。

选用 createAuthClient 时服务须满足明确 Bearer v2 合同，修改 baseURL 不能替代协议适配；已有消费者按自己的版本与升级约束评估。产品对外hex ID使用已提供的显式 idEncoding，并与后端 facade 同步配置，不自动接受双格式。注册、密码重置、用户生命周期和业务资源策略由实际后端/身份提供方负责。真实服务注册、部署和凭据签发由宿主负责。

普通 HTTP 接线使用 [auth-direct-http.mjs](../tests/integration/auth-direct-http.mjs)：显式启动 BaseService 的 loopback `TestDirectHTTPFixture` 后，以 `XUI_AUTH_HTTP_FIXTURE_ORIGIN=http://127.0.0.1:<port>` 运行脚本。它核对直接登录、普通 session/logout、真实响应丢失后的单次 refresh/session 和显式重试；传输层 Cookie jar 与业务账户均为合成替身，不证明真实 PostgreSQL、浏览器 Cookie 或产品部署。

## API Key 管理

此页面管理自有平台向 Agent 等集成签发的访问密钥，不是上游供应商凭据配置。通用规则仅在 [DESIGN](DESIGN.md)，统一前后端标准见 [默认适配器前置](PUBLIC_API.md#默认适配器的服务前置)。第三方 provider、OAuth/OIDC 等遵循原有行业协议，不强制套用此 facade；没有真实业务接口时记录前置缺口，不制造成功 adapter。

### 公开页面与业务能力

`ApiKeyManager` / `createApiKeyManager` 共用 `createApiKeyManagerController`。权限、期限、默认值和授权确认来自服务/宿主，不能由 UI 猜测。创建要求 `canCreate:true`；行 capabilities 分别声明 `update/revoke/deleteRecord`，未知默认不启用。通用域 adapter 可使用明确 `canUpdate/canRevoke/canDeleteRecord`，但服务端的明确 false 不能被宿主 true 覆盖。后端始终重新鉴权。

- create：name、permissionIds、expiryId、可选独立 confirmed；required 权限必须选中，disabled 权限不可选择，冲突配置拒绝。
- update：`openUpdate(id)/setUpdateDraft/submitUpdate` 编辑 name、permissionIds、enabled；可增加/移除宿主声明的权限，四个 scope 也使用同一权限集合，不写产品私有分支。required/disabled 规则仍适用；`validateUpdate(draft,key)` 可返回安全的 name/permissions 错误。没有完整已知 enabled 事实时不提供编辑入口，避免猜测启停状态。
- 暂停/恢复使用 enabled；暂停显示 disabled，不是 revoke。revoked 密钥不可更新或恢复；不重新显示完整密钥。
- revoke：使凭据失效；过期但未撤销的密钥仍按实际 capability 授权撤销。
- deleteRecord：仅删除已经 revoked 的管理记录，独立确认及 capability；不撤销活动凭据、不删除业务记录。

`ApiKeyAdapter.update` 返回真实公共 metadata；revoke/deleteRecord 成功返回 void。通用 custom adapter 的 update、metadata.version/enabled/capabilities.update 均可选，不要求宿主或第三方平台实现 BaseService 协议。React/原生页面等价，使用统一表单、选择器、弹窗、错误和焦点生命周期。

### 默认 HTTP adapter：严格 v2

`createApiKeyHttpAdapter({http,timeoutMs?,pageSize?,maxRecords?,idEncoding?})` 复用宿主已有 HTTP/auth owner，直接调用普通业务接口。旧默认 HTTP v1 调用须显式升级，不静默回退旧 endpoint、缺省版本或授权。URL 仍为 `/api/v1/api-keys`，DTO `schema_version` 为 2。所有请求 no-store / redirect:error，无写入自动重放；AjaxResponse 以 success=true 判定业务成功，code 为必填安全整数而非固定成功数字。

| 操作 | 方法/路径 | 请求和 payload |
| --- | --- | --- |
| 配置 | GET /api/v1/api-keys/capabilities | schema_version:2、can_create、permissions、expiry_options、default_expiry_id、default_permission_ids、confirmation_label |
| 列表 | GET /api/v1/api-keys | 基数0 page_index/page_size/return_total=true/sort=id/sort_id=asc；原生 ListData {list,total} |
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

[shared capability-model](../examples/shared/capability-model.ts) 的 React/原生消费者演示普通 v2 请求和编辑启停；全部是 FAKE 合成数据，不证明真实鉴权、部署或生产接入完成。宿主保留自己的业务权限、namespace、CSRF、限速和服务端存储策略。

迁移时删除旧 writeGuard/recovery 配置及 Lookup/Resolve 接线，同步升级 xui 与 BaseService；不删除线上业务数据或执行数据库清表。custom adapter 按真实领域接口实现普通 CRUD，已有 read/write、独立 confirmed、期限和管理记录删除语义继续保留，不强制第三方采用 BaseService 协议。

## 业务日志

用途是随时调取查阅领域业务记录，提供通用字段、可扩展payload、筛选分页和详情。用户所说的“审计”指这个业务日志用途，不是正式审计体系；旧BusinessAudit命名在同一实现上统一改为BusinessLog，没有增加另一套页面。公共事件描述谁在何时对哪个业务对象做了什么、结果如何、关联哪些请求及允许披露的业务细节。现有 [错误观察功能](PUBLIC_API.md#程序错误观察) 是独立功能，severity/错误分组/首次代表不能充当业务日志。完整通用规则仅在 [DESIGN.md](DESIGN.md)。

runtime/business-log 的 DTO、严格解析、loader 和单一 controller 被 React/business-log 的 BusinessLogExplorer 与 runtime/business-log-dom 的 createBusinessLogExplorer 共用。两类视图使用已有公开 Layout/Field/Table/Dialog/反馈和公共 CSS，没有新色板、私有皮肤或 Tailwind 扫描依赖。

### 固定公共字段与可扩展 payload

以下是 xui 自己明确声明的最小接入合同，以 [源码](../packages/runtime/src/business-log.ts) 和正式 declarations 为准；没有声称任何后端接口已上线。采用方可以直接实现 typed loader，或通过默认HTTP loader对接baseservice的版本化facade，不直接暴露数据库模型。

| 类型 | 字段与事实 |
| --- | --- |
| BusinessLogEvent | id、event_type、schema_version、occurred_at、recorded_at、actor、object、action、result、summary、correlation_id、request_id。列表没有 payload |
| BusinessLogActor | kind 为 user/agent/service，id 为可信标识，display_name 为允许显示的字符串或 null。服务负责归属及代理授权，UI 不由名称猜身份 |
| BusinessLogObject | kind、id、display_name；整个 object 可为 null。不同领域自定 kind，UI 不自行生成对象路由 |
| result | succeeded/failed/denied/unknown；unknown 不伪装完成。异步任务、部分完成等领域事实进入对应 event_type/payload，adapter 必须明确结果映射，不能由 HTTP 200 或 severity 推断 |
| BusinessLogPage | list和明确page：原生offset的page_index/page_size/total，或领域cursor的next_cursor（末段null）与可选真实snapshot_id；不混用或造假 |
| BusinessLogDetail | event、state（available/expired/unavailable）、payload（JSONValue）。后两种 state 的 payload 必须为 null；available 的 null 是合法业务值 |

schema_version 是 **对应 event_type 的业务 payload 版本**，正安全整数；未知类型/版本仍展示公共事实及安全 JSON。公共字段的变更需同步升级 xui 接入合同与采用方，不能因这个字段任意改掉公共摘要。默认HTTP facade的route与success成功判定在下方和PAGE_APIS明确声明；业务事件词表与payload版本由宿主明确，领域loader不另猜协议。记录和关联 ID 保持字符串；整数超过 JS 安全范围必须在 payload 编码为字符串，不能经过 Number 舍入。

occurred_at 为事件实际发生时间，recorded_at 为服务记录时间，均须完整 RFC3339（允许 1–9 位小数）。不同事件可定义审批意见、工具执行结果、允许披露的变更字段或其他 JSON 对象；不强制一份通用 before/after 结构。Go 端可用 any 或按事件类型定义接口，但网络返回前必须明确版本、JSON 编码、权限和脱敏。

JSONValue 只接受 null/布尔/有限数字/字符串/数组/普通对象，深拷贝冻结；拒绝 unsafe 整数、bigint、undefined、函数、getter、自定义 prototype、循环。前端展示边界是 UTF-8 JSON 最多 64 KiB、深度最多 16、节点最多 4096；服务 adapter 应在传输前按更严格政策约束，不让库静默截断。null-prototype 对象不执行特殊键。**允许扩展不代表可携带任意秘密**：禁止完整 API Key、凭据、token、敏感字段 before/after；后端按 event_type 的 allowlist 和权限投影，前端无法撤回已传输数据。

### 两个 loader 与过滤、分页

BusinessLogLoader提供list(query,{signal})与detail(eventId,{signal})，pagination声明offset/cursor。原生默认loader的query.page.index从0开始；领域cursor模型的query.page.cursor保持不透明。query 为 `{filter,page:{size,cursor,index?}}`；每个回调返回上表准确 DTO，没有 response 别名猜测。已有 HTTP client 可以由宿主 endpoint adapter 包装；loader 本身不决定 auth、租户、URL 或数据库。UI 显式 refresh，默认 size=50、范围 1–200；合成示例 size=2 仅便于验证分页。读失败不自动重试，取消仅结束本地等待，不证明服务停止。

filter 明确支持 `[since,until)` 事件时间、actor kind/id、object kind/id、event_type、action、result、correlation_id、request_id；后七者为精确过滤，不做全文 payload 搜索或 query AST。actor/object 必须配对，未知字段拒绝，时间比较保留纳秒边界。允许不存在 object 的事件，但按对象筛选时必须两字段齐全。身份和 tenant scope 从服务可信上下文取得，不由公共 filter/body 自报。

默认createBusinessLogHttpLoader采用原生webfacade offset和httpx ListData，不产生cursor或snapshot。领域cursor loader的cursor须绑定scope/filter/顺序；snapshot_id可选，仅展示实际返回值，当前链保留已知真实snapshot基准，缺省metadata不抹掉基准，后来返回的真实snapshot必须一致；不填时间戳/常量/虚构ID。服务提供稳定全序（推荐记录顺序与 ID 解冲突），UI 保留返回顺序，不从事件时间猜提交顺序。缓存上一段只保存当前查询链的摘要，不重发 null cursor；下一段显式请求。过滤或刷新建新链，刷新失败保留旧事实和原已访问段编号，同时禁用旧链导航。cursor域的pageIndex只是成功访问的段；默认offset域明确将它作为基数0的服务页码，不能将两者混用。

controller 的列表与详情各有取消/generation；替换、关闭、卸载与 destroy 拒绝迟到结果。状态转换一次通知，订阅回调的新意图优先；订阅释放/重绑不在同一次通知无限调用。权限/身份/scope 切换须销毁旧 controller，不能把摘要缓存跨租户复用。

### 详情与公开 renderer

详情每次按事件 ID 授权读取。403、404、expired、unavailable 和一般错误明确区分，前端不根据本地时间推测保留期。关闭/Esc/卸载释放 controller 与 DOM 的详情引用；回到仍存在的触发器，触发器失效回刷新。对象 URL 只由 resolveObject、baseURL 和显式 referenceOrigins 映射，仅允许 HTTP(S)、无 URL 凭据、同源或已允许 origin；否则为普通文本。

使用原有领域方法时，loader adapter 将权限/不存在错误明确归一化为公共 HttpError（kind=http、status=403/404、attempts=1）；任意对象的 status 字段不自动认定为该事实。expired/unavailable 则返回上述详情 state，不能把权限异常映射成保留期结束。有限等待预算由宿主已有 client/loader 决定，controller 没有隐式 timeout。

默认 payload 以格式化 JSON 文本展示，HTML/URL/脚本字符串保持普通文本。宿主可通过公开 `renderers` 注册 `{eventType,schemaVersion,render}`：React 返回 ReactNode，原生返回本窗口 Node。按类型和版本精确选中第一个注册项；未知类型/版本使用默认 JSON。注册代码来自可信应用代码，不从 payload 加载组件、eval、执行 HTML 或动态 import 路径。定制 renderer 负责保持业务权限、文本安全与自身资源生命周期，不能拿它另造通用字段皮肤。renderer 抛错给固定安全反馈并显示 JSON，不暴露异常内容；不触发重新读取。

### 服务边界与实际采用

业务服务记录日志，并负责权限/tenant、脱敏、查询顺序/快照与保留政策。xui 提供只读查询与详情展示，不实施日志写入或正式审计保证。baseservice已将业务日志放在bizlogservice；[bizlogservice/webfacade](https://github.com/coffeehc/baseservice/tree/main/bizlogservice/webfacade) 提供下述固定只读列表/详情HTTP边界，不引入独立auditservice。宿主注册路由，提供真实身份/tenant、授权与脱敏投影；xui不实现日志写入或用户管理。已有typed loader仍可在领域边界接入。

已实现 [共享合成模型](../examples/shared/business-log-model.ts)、[React](../examples/business-log-react/app.tsx)、[原生](../examples/business-log-vanilla/app.js) 两类消费者，先本地打包再独立安装正式 ESM/types/CSS。pnpm build/test:consumer/preview 后访问 /business-log-react/ 和 /business-log-vanilla/。示例只注入 typed fake loader，没有访问真实业务、创建后端路由或生成秘密。baseservice已有配套facade，但示例仍使用合成数据，不代表任一产品已接入真实服务。

按 [采用手册](ADOPTION.md) 先逐页接入 xui；按产品授权逐个接入baseservice facade或既有领域adapter，通过公共合同版本、消费方依赖、类型和回归联动升级。没有要求全部产品同时切换，也不因库级对齐自动修改任何产品或部署服务。 [测试](../tests/business-log.test.mjs) 与 [浏览器检查](../tests/browser/business-log.spec.mjs) 仅证明当前展示合同/生命周期，真实业务服务与权限/脱敏集成仍须采用项目另验。

### 原生默认HTTP facade

createBusinessLogHttpLoader({http,timeoutMs?})固定GET /api/v1/business-logs与GET /api/v1/business-logs/{id}。原生AjaxResponse以success=true判定业务成功，code是必填安全整数元数据，不要求固定值；列表payload原生ListData{list,total}，null list显式投影空数组，unsafe总数拒绝。默认offset query为page_index基数0/page_size最大200/return_total=true/sort=recorded_at,id与两个sort_* desc；filters为since/until、actor_kind/actor_id、object_kind/object_id、event_type/action/result/correlation_id/request_id，单次URL编码。后端明确FieldDefined和半开时间边界，用原生Convert/GetTimeFormQuery处理RFC3339Nano，不改commons或降精度。

请求no-store/redirect:error、默认30秒、无自动重试。详情使用现有BusinessLogDetail DTO，403/404/expired/unavailable分别处理；没有默认写入或删除API。页面实际后端缺失须报告前置条件，不能将程序故障记录、供应商凭据配置或假snapshot映射成业务日志成功。[共享默认adapter示例](../examples/shared/capability-model.ts)和[合同回归](../tests/page-api.test.mjs)使用合成原生fetch；产品真实服务/权限/脱敏仍须单独集成验收。

此合同用于自有业务记录，不把第三方响应或程序故障当作业务日志。第三方日志/审计API按第三方字段、分页和错误格式，宿主在内部边界投影允许披露的真实业务事实；不要求第三方AjaxResponse。行业标准/第三方优先边界见[DESIGN](DESIGN.md#规范强度与职责)。

### 跨库合同验证

[共享fixture](../tests/fixtures/page-contracts.v1.json) 在baseservice的 `docs/contracts/page-contracts.v1.json` 有逐字节一致副本；xui的 [合同测试](../tests/page-contracts.test.mjs) 经默认HTTP loader验证请求/响应，Go通过真实handler验证相同边界。事件 `schema_version` 表示宿主实际业务payload版本，不是facade版本，也不能默认填1；fixture使用3以验证原样保留。fixture记录时间使用真实PG事实支持的微秒精度，而since/until查询保留纳秒边界；服务须明确投影与半开区间，不声称存储保留不存在的精度。

共享测试只证明合成DTO与HTTP边界一致；真实宿主权限/tenant、详情脱敏、保留政策及生产集成仍需产品验收。

## 程序错误观察

这是独立程序错误观察功能。业务记录查询使用 [BusinessLogExplorer 合同](PUBLIC_API.md#业务日志)，不把 severity、错误分组或首次代表映射成 actor/action/result。

这是实现接口；完整通用规则只在 [DESIGN.md](DESIGN.md)。runtime/structured-log 提供无框架类型、DTO 校验、HTTP bridge 和单一查询/详情控制器；React/structured-log 的 StructuredLogExplorer 与 runtime/structured-log-dom 的 createStructuredLogExplorer 生成完整只读页面，复用公共布局、表格、字段、反馈与 Dialog。没有额外日志皮肤或下游 Tailwind 扫描要求。

### 配套源码基线与范围

配套只读协议的固定源码基线为 commons 提交 `b0bc0f9bbb72b708fb9a7d251c033ba946d820f8`：

- [service.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/service.go)：Facts、ErrorRecord、ErrorGroup、四种 Reader 操作及可信 Scope。
- [query.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/query.go)：实际过滤字段、ID 升序、cursor 绑定、事务序号高水位、计数与读取时保留期判断。
- [record.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/record.go)、[extension.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/extension.go)：去重观察、首次代表、属性 allowlist/边界与脱敏。
- [README](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/README.md)：失败边界显式记录、默认 Detail/Stack 保留 7 天与宿主认证/授权职责。

这是结构化错误观察查询，不是自动收集全部 stdout 的日志平台。EntryCount 是去重后的已提交观察数，不是未解决故障、业务实体、重试次数或恢复成功数。公开视图只提供分组、观察列表和精确单记录详情；不提供写入、删除、清空、重放、投递运维、事件关联、stream 或业务恢复按钮。

上述固定基线的 Go 包没有 JSON tags，也没有上述页面所需的 HTTP facade。下方 snake_case、schema_version=1 的协议是 **xui 拟议接入合同，必须由宿主后端明确实现**；不能把 Go 默认字段编码、旧产品 offset/limit/newest-first 接口当成此协议。公开类型与默认行为以 [structured-log.ts](../packages/runtime/src/structured-log.ts) 和正式构建声明为准。

### 四个显式只读操作

createStructuredLogHttpAdapter(client,endpoints) 接收宿主给定的 groups、records、groupRecords、record 四个路径，向同源 HTTP client 发送 POST JSON，使用 [HTTP 与查询](PUBLIC_API.md#http-与查询) 的 Go AjaxResponse envelope；默认以 success=true 判定业务成功，code 保留为必填安全整数元数据，不要求固定值或额外 adapter。POST 在这里是明确定义的查询，客户端不自动重试；页面上的重试由用户触发。也可直接提供符合 StructuredLogAdapter 的四个回调。

| adapter | Go Reader | 请求 JSON | envelope.payload |
| --- | --- | --- | --- |
| groups | Query | schema_version、filter、page | LogGroupsPage |
| records | QueryRecords | 同上 | LogRecordsPage |
| groupRecords | Detail | 同上，加 group_id | LogGroupRecordsPage |
| record | GetRecord | schema_version、record_id | LogDetailResponse |

page 为 `{size:50,cursor:null}` 或上一响应给出的不透明 cursor；50 是源码默认值，范围 1–200。本例显示 size=2 只为演示多段，不更改库默认值。filter 的未指定 scalar 为 null、facet 为 []。Scope 的 application/environment/tenant 只由服务端可信装配和认证上下文绑定，绝不接收公共 query/body 字段。host 必须分别验证列表权限与详情权限，清理未知请求字段并按配置限制 body。

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

[React 示例](../examples/log-react/app.tsx) 和 [原生示例](../examples/log-vanilla/app.js)/[HTML](../examples/log-vanilla/index.html) 共用 [typed fake facade model](../examples/shared/log-model.ts) 与 [labels](../examples/shared/log-labels.json)，经 [正式 tarball 消费](../scripts/consumers.mjs) 编译/打包；原生不安装 React，也不使用源码 alias 或示例私有 CSS。pnpm build、pnpm test:consumer、pnpm preview 后访问 /log-react/、/log-vanilla/。

这里注入合成 fetch，使用显式假路径，不实现 loopback 后端，也不连接产品。测试只有展示合同与生命周期证据，不证明 Go/PostgreSQL、真实认证/脱敏、tenant 隔离或产品集成通过；详情复制用模拟 Clipboard。控制器 [逻辑测试](../tests/structured-log.test.mjs)、两类 [浏览器测试](../tests/browser/structured-log.spec.mjs) 与限制见 [验证记录](VALIDATION.md#chromium-浏览器结果)。

生产采用时先补明确 facade/DTO mapper、后端 scope/权限/错误映射、预算与脱敏，再保留产品必要业务行为后清理旧错误观察 owner。宿主稳定创建一个 controller，首次明确 refresh；React 传给 StructuredLogExplorer，原生传给 createStructuredLogExplorer(root,{controller})。视图不拥有外部 controller：卸载/页面离开关闭详情并取消读取；宿主释放自身订阅后 destroy controller/client，原生同时 destroy view。接入迁移见 [ADOPTION.md](ADOPTION.md)，不得用本例通过宣称产品已迁移。

## 默认适配器的服务前置

本节只用于选用 xui 默认 HTTP client/页面 adapter 时核对服务前置。xui 提供通用组件与公开组合；宿主拥有业务 API、领域数据、业务 UI 和产品流程。采用通用组件不要求所有业务 API 统一到 commons/webfacade。宿主可通过 typed ResponseAdapter、ErrorResponseAdapter、ApiKeyAdapter 或 BusinessLogLoader 连接明确的领域接口；业务 API 迁移由宿主另行决定。通用边界见 [DESIGN](DESIGN.md#规范强度与职责)，组件层次见 [接入与组件分层](ADOPTION.md#组件层次与扩展原则)。

| 选用能力 | 默认连接 | 服务前置与合同 owner |
| --- | --- | --- |
| HTTP ajax / webfacade query | createHttpClient、serializeWebfacadeQuery | 明确 AjaxResponse success/message/payload/request_id/code/redirect 与 endpoint 页基数、上限、filter/sort codec；HTTP 状态和业务成功分开。响应模式、错误适配、列表三态及显式 ID 编码见 [HTTP 与查询](PUBLIC_API.md#http-与查询) |
| ConfigurableLoginPage/createLoginPage | createAuthClient；POST `/api/v1/auth/login`、`refresh`、`logout`，GET `/api/v1/auth/session` | 固定 Bearer v2 DTO；access 仅内存，同源恢复 Cookie 与 session Bearer 分离。宿主注册 route、CSRF 和资源策略；不猜旧路由或仅改 baseURL。见 [登录与会话](PUBLIC_API.md#认证会话) |
| ApiKeyManager/createApiKeyManager 的默认 HTTP adapter | createApiKeyHttpAdapter；`/api/v1/api-keys` 及 capabilities/update/revoke/record 路径 | 严格 DTO v2、AjaxResponse/ListData，服务提供权限、期限、独立确认、expected_version CAS 与一次性 secret。未知结果普通列表核验一次，不重发写请求。完整路径、能力和 fixture 见 [API Key 管理](PUBLIC_API.md#api-key-管理) |
| BusinessLogExplorer/createBusinessLogExplorer 的默认 HTTP loader | createBusinessLogHttpLoader；GET `/api/v1/business-logs` 与 `/{id}` | 明确 offset query/ListData 与必需 total，公共记录字段、版本化授权 payload；服务负责身份/tenant、权限和脱敏。领域 cursor loader 依自己的明确合同，不伪造 snapshot。见 [业务日志](PUBLIC_API.md#业务日志) |
| StructuredLogExplorer/createStructuredLogExplorer | 宿主声明 endpoints 的四操作 facade | 独立程序错误观察；服务实现明确 DTO、过滤、cursor、详情授权与保留期，不推断已有后端。见 [程序错误观察](PUBLIC_API.md#程序错误观察) |
| AuthPage/AdminSetupPage、MenuLayout、布局、表格、字段与弹层 | 公开数据、props/parts/slots/controllers 与 callbacks | 业务 API、权威状态、路由、权限、查询范围和执行归宿主；无通用后端路由要求。管理员初始化见 [登录与会话](COMPONENTS.md#管理员初始化页) |

选用默认 adapter 时严格满足其准确合同，不猜 data/token/items 或自动尝试路由；标准 OAuth2/OIDC/SAML 与第三方接口继续遵循各自标准，在宿主明确边界转换。平台 API Key 是自身签发凭据，业务日志是自身业务记录，不能由 provider key、第三方响应或程序故障记录改名替代。

baseservice 的 authenticationservice/webfacade、apikeyservice/webfacade 与 bizlogservice/webfacade 提供配套边界；采用项目仍须核对实际版本、注册路由并提供身份、tenant、授权、CSRF、事务与脱敏。共享 fixture 和合成消费者只验证约定的 wire，不能证明产品已集成或部署；实际已跑与未跑范围见 [VALIDATION](VALIDATION.md)。

## 通用资源控制器

### 加载 owner 与参考页

createResource({loader,isEmpty?,timeoutMs?}) 提供 idle/loading/refreshing/ready/empty/error/retrying、key/value/hasValue/error/busy/request。没有默认 timeout、请求/缓存或自动重试。load(key) 替换旧任务；同 key 刷新保留旧值，不同 key 清除旧对象；retry 是显式操作；cancel/destroy 即使生产者忽略 Abort，也结束本地等待并拒绝旧结果。回调重入以 generation 再检查，订阅异常不把数据成功改成错误。

useResource 只订阅；owner 放在宿主稳定生命周期，卸载时取消/销毁。loadStylesheet 创建的失败/取消 link 会清理，成功 link 由宿主拥有。

## 表单与刷新编排

`@coffeehc/xui-react/layout` 正式导出 FormGrid（含 Item）/FormGridProps/FormGridItemProps、FormActions/FormActionsProps；`forms` 的 Fieldset 增加可选 layout，`feedback` 的 LoadingStateProps/DataRegionProps 分别公开 inline 加载与 flow 反馈。原生复用正式主题同名结构与现有控制器，不新增纯排版 model。默认行为、字段顺序、请求/分页/提交 owner 保持兼容；侧向 Sheet 在40rem及以下全宽，有行 DataTable 的刷新改为紧凑行内表现。签名与双端用法见[表单与页面编排](COMPONENTS.md#表单与页面编排)，标准见[DESIGN](DESIGN.md#表单编排的公共入口)。

## 导航分支按钮翻译

React `/menu-layout` 的 `NavigationMenuProps`/`MenuLayoutProps` 继承 runtime `/navigation` 的 `NavigationMenuOptions`：`expandBranchLabel?:(item:NavigationItem)=>string`、`collapseBranchLabel?:(item:NavigationItem)=>string` 分别生成带 href 分支的独立展开/收起按钮可访问名称。原生 `createNavigationMenu`/`createMenuLayout` 使用相同字段；各自根入口同样公开。默认英文带真实条目名保持兼容，语言/条目/受控展开更新规则与两端示例见[导航富条目合同](COMPONENTS.md#富条目独立行尾动作与上下文菜单)。这些字段不接管整体导航的 `expandLabel`/`compactLabel`，也不创建 i18n owner。

## 导航名称与首行对齐

React `/menu-layout` 的 NavigationMenuProps/MenuLayoutProps 与 runtime `/navigation` 的 NavigationMenuOptions/NavigationMenuDOMOptions 统一接受 `labelOverflow?: 'wrap' | 'marquee'`、`actionAlignment?: 'center' | 'start'`，默认wrap/center保持兼容。React `NavigationMenu.Label`及NavigationMenuLabelProps与原生`createNavigationLabel(document,text)`为名称部件，原生返回element/setText，富描述/Badge在名称外组合。根入口同步导出这些公共能力；共享动画控制器仅在runtime/internal下用于包间实现，不作为宿主操作入口。完整降级、动态更新和双端消费见[富导航合同](COMPONENTS.md#富条目独立行尾动作与上下文菜单)。

## 导航收起与展开

AppShell/MenuLayout 与 runtime/createMenuLayout 的唯一导航开关由公共组件定位：桌面在侧栏内部，窄屏在顶栏打开隐藏导航；宿主继续使用既有collapsed/defaultCollapsed/onCollapsedChange及sidebarOpen/onSidebarOpenChange，不搬私有DOM。原生getMenu().setCollapsed/update遵循同一受控状态合同。详见 [导航控件](COMPONENTS.md#导航内部唯一收起展开控件)。

## 日历月份控制

`@coffeehc/xui-runtime/calendar` 的 `CalendarOptions` 及 `@coffeehc/xui-react/calendar` 的 `CalendarProps` 公开 `month?:string`、`onMonthChange?:(month:string)=>void`。根入口同样导出。原生 `createCalendar` 接受同一选项并返回 `model.setMonth(month)`；受控确认使用 `update({month})`。年月遵循严格 YYYY-MM、0001..9999；日期值与查看月份分开。默认值、回调和焦点合同见[Calendar](COMPONENTS.md#选择与复合控件)，双端正式消费者见[React](../examples/calendar-month-react/app.tsx)/[原生](../examples/calendar-month-vanilla/app.js)。

## 菜单危险语义

MenuItemTone/MenuItemProps 从 React `/menu`、`/context-menu` 和根入口公开。`Menu.Item` 与 `ContextMenu.Item` 接受 `tone="danger"`；默认 `default` 保持旧外观。公共 floating.css（亦包含在 style.css）承接同名data-tone投影，原生HTML与controller使用同一状态合同；详见[组件手册](COMPONENTS.md#菜单危险操作语义)。

## DataTable 行事件

DataTableRowContext、DataTableRowEvents 从 runtime/data-table、runtime/data-table-dom 及根入口导出；React/data-table 及根入口导出React事件适配类型。DataTableProps<T> 和 NativeDataTableOptions<T> 可传 rowEvents；DataTableCellContext/NativeDataTableCellContext沿用原字段并复用行上下文。共享 isDataTableRowEvent 只负责DOM事件来源边界，不检查业务权限。详细行为及公开自定义动作标记见[数据表格](COMPONENTS.md#数据表格)。

## 日期时间选择

React `/date-time` 与根入口导出 DateTimePicker/DateTimePickerProps；runtime `/date-time` 与根入口导出 DateTimeOptions/DateTimeValue/DateTimeParts/DateTimeError/DateTimePickerLabels、parseDateTimeValue、createDateTimeModel；`/date-time-dom` 与根入口导出 NativeDateTimePickerOptions/createDateTimePicker。沿用正式 style.css（critical.css+floating.css），不增加组件私有 CSS。完整行为见[组件手册](COMPONENTS.md#日期时间选择)，双端[React](../examples/date-time-react/app.tsx)/[原生](../examples/date-time-vanilla/app.js)可从独立 tarball 消费。
