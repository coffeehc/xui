# 公开入口、声明与默认行为索引

这是当前 manifests 的全部入口映射；完整通用规范只在 [DESIGN.md](DESIGN.md)，接入步骤见 [ADOPTION.md](ADOPTION.md)。没有省略 root/re-export/helper 入口，也不把规划能力列为可调用接口。

下表链接到可读源码与合同；正式 types 路径由包 exports.types 指向 dist 声明。请固定 checkout SHA，先构建再消费，不直接把源码链接设成产品 alias。根入口是相应子入口的汇总；命名类型和运行时导出逐项记录到可再生成的 `.artifacts/public-api.json`，不手写另一份函数签名。

[scripts/public-api.mjs](../scripts/public-api.mjs) 从实际 manifests/构建声明取全部名字；[文档守卫](../scripts/check-docs.mjs) 检查本表入口与 manifests 完全一致。[正式消费](../scripts/consumers.mjs) 在独立 tarball 安装中逐个读取 ESM/CSS/init、编译每个命名导出的 type import、导入各模块核对运行时导出，并打包全部 ESM/CSS；原生无 React。下面的完整页面与 fixture 再证明实际组装行为，入口通过不代表未跑的产品集成通过。

## 全部正式入口

| import/script | 源码及声明来源 | 使用合同 | 运行消费 |
| --- | --- | --- | --- |
| `@coffeehc/xui-theme/style.css` <!-- public-entry: @coffeehc/xui-theme/style.css --> | [源码](../scripts/tokens.mjs) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/tokens.css` <!-- public-entry: @coffeehc/xui-theme/tokens.css --> | [源码](DESIGN.md) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/components.css` <!-- public-entry: @coffeehc/xui-theme/components.css --> | [源码](../packages/theme/src/components.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/base.css` <!-- public-entry: @coffeehc/xui-theme/base.css --> | [源码](../packages/theme/src/base.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/button.css` <!-- public-entry: @coffeehc/xui-theme/button.css --> | [源码](../packages/theme/src/button.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/forms.css` <!-- public-entry: @coffeehc/xui-theme/forms.css --> | [源码](../packages/theme/src/forms.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/navigation.css` <!-- public-entry: @coffeehc/xui-theme/navigation.css --> | [源码](../packages/theme/src/navigation.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/feedback.css` <!-- public-entry: @coffeehc/xui-theme/feedback.css --> | [源码](../packages/theme/src/feedback.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/dialog.css` <!-- public-entry: @coffeehc/xui-theme/dialog.css --> | [源码](../packages/theme/src/dialog.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/layout.css` <!-- public-entry: @coffeehc/xui-theme/layout.css --> | [源码](../packages/theme/src/layout.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/floating.css` <!-- public-entry: @coffeehc/xui-theme/floating.css --> | [源码](../packages/theme/src/floating.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/table.css` <!-- public-entry: @coffeehc/xui-theme/table.css --> | [源码](../packages/theme/src/table.css) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-theme/critical.css` <!-- public-entry: @coffeehc/xui-theme/critical.css --> | [源码](../scripts/tokens.mjs) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime` <!-- public-entry: @coffeehc/xui-runtime --> | [源码](../packages/runtime/src/index.ts) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/init.js` <!-- public-entry: @coffeehc/xui-runtime/init.js --> | [源码](../packages/runtime/src/init.ts) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/theme` <!-- public-entry: @coffeehc/xui-runtime/theme --> | [源码](../packages/runtime/src/theme.ts) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/loading` <!-- public-entry: @coffeehc/xui-runtime/loading --> | [源码](../packages/runtime/src/loading.ts) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/navigation` <!-- public-entry: @coffeehc/xui-runtime/navigation --> | [源码](../packages/runtime/src/navigation.ts) | [合同](NAVIGATION.md) | [示例](../examples/menu-vanilla/app.js) |
| `@coffeehc/xui-runtime/http` <!-- public-entry: @coffeehc/xui-runtime/http --> | [源码](../packages/runtime/src/http.ts) | [合同](HTTP.md) | [示例](../examples/http-vanilla/app.js) |
| `@coffeehc/xui-runtime/query` <!-- public-entry: @coffeehc/xui-runtime/query --> | [源码](../packages/runtime/src/query.ts) | [合同](HTTP.md) | [示例](../examples/http-vanilla/app.js) |
| `@coffeehc/xui-runtime/menu-layout` <!-- public-entry: @coffeehc/xui-runtime/menu-layout --> | [源码](../packages/runtime/src/menu-layout.ts) | [合同](NAVIGATION.md) | [示例](../examples/menu-vanilla/app.js) |
| `@coffeehc/xui-runtime/dom` <!-- public-entry: @coffeehc/xui-runtime/dom --> | [源码](../packages/runtime/src/dom.ts) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-vanilla/app.js) |
| `@coffeehc/xui-runtime/api-key` <!-- public-entry: @coffeehc/xui-runtime/api-key --> | [源码](../packages/runtime/src/api-key.ts) | [合同](API_KEY.md) | [示例](../examples/api-key-vanilla/app.js) |
| `@coffeehc/xui-runtime/api-key-dom` <!-- public-entry: @coffeehc/xui-runtime/api-key-dom --> | [源码](../packages/runtime/src/api-key-dom.ts) | [合同](API_KEY.md) | [示例](../examples/api-key-vanilla/app.js) |
| `@coffeehc/xui-runtime/structured-log` <!-- public-entry: @coffeehc/xui-runtime/structured-log --> | [源码](../packages/runtime/src/structured-log.ts) | [合同](LOGS.md) | [示例](../examples/log-vanilla/app.js) |
| `@coffeehc/xui-runtime/structured-log-dom` <!-- public-entry: @coffeehc/xui-runtime/structured-log-dom --> | [源码](../packages/runtime/src/structured-log-dom.ts) | [合同](LOGS.md) | [示例](../examples/log-vanilla/app.js) |
| `@coffeehc/xui-react` <!-- public-entry: @coffeehc/xui-react --> | [源码](../packages/ui-react/src/index.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/button` <!-- public-entry: @coffeehc/xui-react/button --> | [源码](../packages/ui-react/src/button.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/forms` <!-- public-entry: @coffeehc/xui-react/forms --> | [源码](../packages/ui-react/src/forms.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/navigation` <!-- public-entry: @coffeehc/xui-react/navigation --> | [源码](../packages/ui-react/src/navigation.tsx) | [合同](NAVIGATION.md) | [示例](../examples/menu-react/app.tsx) |
| `@coffeehc/xui-react/menu-layout` <!-- public-entry: @coffeehc/xui-react/menu-layout --> | [源码](../packages/ui-react/src/menu-layout.tsx) | [合同](NAVIGATION.md) | [示例](../examples/menu-react/app.tsx) |
| `@coffeehc/xui-react/tabs` <!-- public-entry: @coffeehc/xui-react/tabs --> | [源码](../packages/ui-react/src/tabs.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/dialog` <!-- public-entry: @coffeehc/xui-react/dialog --> | [源码](../packages/ui-react/src/dialog.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/feedback` <!-- public-entry: @coffeehc/xui-react/feedback --> | [源码](../packages/ui-react/src/feedback.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/layout` <!-- public-entry: @coffeehc/xui-react/layout --> | [源码](../packages/ui-react/src/layout.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/table` <!-- public-entry: @coffeehc/xui-react/table --> | [源码](../packages/ui-react/src/table.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/select` <!-- public-entry: @coffeehc/xui-react/select --> | [源码](../packages/ui-react/src/select.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/combobox` <!-- public-entry: @coffeehc/xui-react/combobox --> | [源码](../packages/ui-react/src/combobox.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/menu` <!-- public-entry: @coffeehc/xui-react/menu --> | [源码](../packages/ui-react/src/menu.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/popover` <!-- public-entry: @coffeehc/xui-react/popover --> | [源码](../packages/ui-react/src/popover.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/tooltip` <!-- public-entry: @coffeehc/xui-react/tooltip --> | [源码](../packages/ui-react/src/tooltip.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/toast` <!-- public-entry: @coffeehc/xui-react/toast --> | [源码](../packages/ui-react/src/toast.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/theme` <!-- public-entry: @coffeehc/xui-react/theme --> | [源码](../packages/ui-react/src/theme.tsx) | [合同](IMPLEMENTATION.md) | [示例](../examples/foundation-react/app.tsx) |
| `@coffeehc/xui-react/api-key` <!-- public-entry: @coffeehc/xui-react/api-key --> | [源码](../packages/ui-react/src/api-key.tsx) | [合同](API_KEY.md) | [示例](../examples/api-key-react/app.tsx) |
| `@coffeehc/xui-react/structured-log` <!-- public-entry: @coffeehc/xui-react/structured-log --> | [源码](../packages/ui-react/src/structured-log.tsx) | [合同](LOGS.md) | [示例](../examples/log-react/app.tsx) |
| `@coffeehc/xui-runtime/business-log` <!-- public-entry: @coffeehc/xui-runtime/business-log --> | [源码](../packages/runtime/src/business-log.ts) | [合同](BUSINESS_LOGS.md) | [示例](../examples/business-log-vanilla/app.js) |
| `@coffeehc/xui-runtime/business-log-dom` <!-- public-entry: @coffeehc/xui-runtime/business-log-dom --> | [源码](../packages/runtime/src/business-log-dom.ts) | [合同](BUSINESS_LOGS.md) | [示例](../examples/business-log-vanilla/app.js) |
| `@coffeehc/xui-react/business-log` <!-- public-entry: @coffeehc/xui-react/business-log --> | [源码](../packages/ui-react/src/business-log.tsx) | [合同](BUSINESS_LOGS.md) | [示例](../examples/business-log-react/app.tsx) |
| `@coffeehc/xui-theme/auth.css` <!-- public-entry: @coffeehc/xui-theme/auth.css --> | [源码](../packages/theme/src/auth.css) | [合同](AUTH.md) | [示例](../examples/login-vanilla/app.js) |
| `@coffeehc/xui-runtime/auth` <!-- public-entry: @coffeehc/xui-runtime/auth --> | [源码](../packages/runtime/src/auth.ts) | [合同](AUTH.md) | [示例](../examples/shared/login-model.ts) |
| `@coffeehc/xui-runtime/login-dom` <!-- public-entry: @coffeehc/xui-runtime/login-dom --> | [源码](../packages/runtime/src/login-dom.ts) | [合同](AUTH.md) | [示例](../examples/login-vanilla/app.js) |
| `@coffeehc/xui-react/login` <!-- public-entry: @coffeehc/xui-react/login --> | [源码](../packages/ui-react/src/login.tsx) | [合同](AUTH.md) | [示例](../examples/login-react/app.tsx) |

## xui 自己定义的默认行为

这些默认值来自上表源码；品牌原始值与 motion 参数仍只由 DESIGN 的受控 token 块定义，不在此复制色板。未改写的复合控件 props/parts 使用当前 Base UI peer 的声明与行为，不能根据另一个版本猜默认值。

| 能力 | 当前默认值与 owner |
| --- | --- |
| theme/init/useTheme | system、storage key `ui.theme.mode`、persist 开启；未知值回 system、媒体读取失败生效 light、storage 失败保留内存。传 mode 为受控且不读写 storage；同步 init 复用 window.xuiTheme，useTheme 只订阅 |
| Button/IconButton | type=button、variant=primary、size=default；busy 与 disabled 分开，无隐式防重复；IconButton 要求 aria-label。render/ref/事件沿用公开 peer 合并合同 |
| Field/Fieldset/choices | Field 自动统一已知控件 id/label/help/error；复合输入显式 controlId。Input/Textarea/NativeSelect 与 checkbox/radio/switch 值/事件由宿主；Fieldset 独立关联 legend/help/error |
| MenuLayout/NavigationMenu | 未受控时 collapsed=false、sidebarOpen=false、未指定展开集合为空，当前链接祖先自动展开。activeId 省略才按同源精确 pathname 选择；null/无匹配无 selected。无 navigation adapter 时保留原生链接，菜单键盘/drawer owner 由库提供 |
| Pagination/Disclosure | Pagination 默认第 1 页，pageCount 由宿主；受控 page 只请求确认。Disclosure 默认关闭。两者不发请求、不自动路由 |
| React Tabs/原生 tabs | React Root/List props 保留固定 peer 行为，xui 只补跳过 disabled 的方向键。原生默认手动激活、loopFocus=true；初始 value 优先 options，其次已有 selected，最后首个可用项；受控必须 syncValue |
| Dialog/Popover/Menu/Tooltip | 关闭不保存。原生 open 默认 false；受控 syncOpen、可取消 change。React Content portal/默认定位：Select bottom/start 且 alignItemWithTrigger=false，Combobox/Menu bottom/start，Popover bottom/center，Tooltip top/center；positionerProps 可覆盖。Dialog 为模态，非模态浮层不 trap；Tooltip 只放说明 |
| Toast | 原生按 id 去重、默认限额 5（limit 可覆盖且至少 1），未给 timeoutMs 不自动消失；显式 timeout 由 performance.now 计时，hover/focus 暂停。React Provider/manager props 保留 peer 默认，不伪称两套计时行为相同；必要错误就地持续可见 |
| Table/layout | 真实标准元素、header cell 默认 scope=col；TableContainer 为可聚焦 region，宿主给名字。SortButton type=button；排序/选择/查询/虚拟化不由库执行。PageHeader 主标题和 actions，AppShell 默认抽屉关闭 |
| feedback/resource | Alert 默认 info/status，error 为 alert；DataRegion busy=false；LoadingState 默认 Loading…，ErrorState 默认 Retry。resource 初始 idle、isEmpty 未声明不猜空、无 timeout/cache/请求或自动 retry；换 key 清旧值、同 key 刷新保留，hooks 只订阅 |
| HTTP | 默认 GET、response=ajax、same-origin credentials、Go successCode=1；没有默认 timeout 或重试。空/false/null payload 合法。响应模式、headers、认证/错误/重试适配与预算见 HTTP 合同，写操作不自动重放 |
| webfacade query | pageIndexOffset 必须逐 endpoint 明确，maxPageSize/字段 codecs/sort 白名单由宿主。没有全局页基数、上限或日期/object 隐式转换；ListData 为 list/total，未请求总数的 total 不代表真实零 |
| API Key | 首次读取由宿主 refresh；默认可创建、仅 active 可撤销，unknown/null 须显式许可。权限/有效期/defaultExpiryId 必须宿主声明，默认权限集合为空；基础验证和单一写入 owner，无默认 HTTP route、生成或持久化；完整值仅瞬时结果 |
| 业务日志 | 显式首次 refresh，page size=50（1–200），两个宿主 loader，无默认 endpoint/auth/scope；固定公共事实与版本化 JSON payload。renderer 精确匹配类型/版本的首项；未匹配格式化 JSON，抛错固定反馈与 JSON。JSON 64 KiB/16 层/4096 节点；不缓存 payload |
| 登录页/auth | 一个已有 HTTP/auth/theme owner；固定 v1 cookie login/logout/session、严格 schema_version=1 user DTO、timeout=15000ms、no retry、no-store、ignore上下文401。页面挂载核会话，配置文本/logo，returnTo安全fallback `/`，没有callback则同源根路径导航；密码瞬时DOM，退出未知不假称成功，详见 AUTH |
| 独立结构化错误 | 初始 groups、page size=50（1–200），host 显式 refresh；无隐式 endpoint/scope/排序/总记录数。v1/list/cursor、纳秒时间、uint64 字符串、三态、累计/命中/首次代表；详情只按记录 ID 读取，缓存仅当前链已访问摘要，刷新新快照 |

## 内容与扩展的真实边界

React 组合控件保留各自公开 props/ref/render/parts；Select/Combobox/Menu/Popover/Tooltip/Toast 还透传当前 peer 的其他部件。不存在通用 rows/columns、万能业务 schema 或未声明的自定义 slot。所有命名导出及类型能在固定声明里查到；按需消费仍须看最终 metafile。

低层 navigation helpers（indexNavigation、getNavigationActiveId、resolveNavigationIcon、navigateNavigationItem、createNavigationKeyboard、renderNavigationIcon）与 DTO parsers/codecs 也是公开入口中的导出，已纳入全部名字/types/运行时核对；普通页面优先完整菜单/控制器，只有宿主组合公共结构需要时使用它们。不要让 helper 变成第二套 selected/键盘或 response/query owner。

业务流程、认证、权限、tenant、API 与日志仍由宿主拥有并独立测试；UI 消费同一能力。完整后台 facade、业务路由与产品迁移尚未实施。能力不足按采用手册反馈，不能以未验证的私有 CSS/内部 DOM/响应别名长期补丁补齐。

## 本轮公共补齐入口

| 正式入口 | 源码与用途 |
| --- | --- |
| `@coffeehc/xui-runtime/download` <!-- public-entry: @coffeehc/xui-runtime/download --> | [下载](../packages/runtime/src/download.ts)：安全头信息、文件名、请求与显式保存 |
| `@coffeehc/xui-runtime/api-key-http` <!-- public-entry: @coffeehc/xui-runtime/api-key-http --> | [默认原生adapter](../packages/runtime/src/api-key-http.ts)，[页面API合同](PAGE_APIS.md) |
| `@coffeehc/xui-runtime/business-log-http` <!-- public-entry: @coffeehc/xui-runtime/business-log-http --> | [默认原生loader](../packages/runtime/src/business-log-http.ts)，webfacade offset/ListData |
| `@coffeehc/xui-react/sheet` <!-- public-entry: @coffeehc/xui-react/sheet --> | [Sheet](../packages/ui-react/src/sheet.tsx)，复用Dialog lifecycle |
| `@coffeehc/xui-react/alert-dialog` <!-- public-entry: @coffeehc/xui-react/alert-dialog --> | [AlertDialog](../packages/ui-react/src/alert-dialog.tsx)，显式确认/取消 |
| `@coffeehc/xui-react/context-menu` <!-- public-entry: @coffeehc/xui-react/context-menu --> | [ContextMenu](../packages/ui-react/src/context-menu.tsx)，复用Menu部件 |
| `@coffeehc/xui-theme/sheet.css` <!-- public-entry: @coffeehc/xui-theme/sheet.css --> | [Sheet/确认/触发器样式](../packages/theme/src/sheet.css)，同样包含在critical/style |
