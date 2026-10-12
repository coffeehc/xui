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
| `@coffeehc/xui-runtime/theme-control` <!-- public-entry: @coffeehc/xui-runtime/theme-control --> | [源码](../packages/runtime/src/theme-control.ts) | [顶栏合同](LAYOUT_SLOTS.md) | [示例](../examples/header-controls-vanilla/app.js) |
| `@coffeehc/xui-runtime/header-controls` <!-- public-entry: @coffeehc/xui-runtime/header-controls --> | [源码](../packages/runtime/src/header-controls.ts) | [语言合同](LAYOUT_SLOTS.md) | [示例](../examples/header-controls-vanilla/app.js) |
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
| `@coffeehc/xui-react/grouped-combobox` <!-- public-entry: @coffeehc/xui-react/grouped-combobox --> | [源码](../packages/ui-react/src/grouped-combobox.tsx) | [合同](GROUPED_SEARCH.md) | [示例](../examples/grouped-search-react/app.tsx) |
| `@coffeehc/xui-runtime/grouped-combobox` <!-- public-entry: @coffeehc/xui-runtime/grouped-combobox --> | [源码](../packages/runtime/src/grouped-combobox.ts) | [合同](GROUPED_SEARCH.md) | [示例](../examples/shared/grouped-search-model.ts) |
| `@coffeehc/xui-runtime/grouped-combobox-dom` <!-- public-entry: @coffeehc/xui-runtime/grouped-combobox-dom --> | [源码](../packages/runtime/src/grouped-combobox-dom.ts) | [合同](GROUPED_SEARCH.md) | [示例](../examples/grouped-search-vanilla/app.js) |
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
| 原生 UI ID | 按 ownerDocument 共享分配，跨 bundle/多实例/卸载重建不重用；无 crypto/randomUUID 或 HTTPS 前置条件。已有显式 DOM ID 与 Toast message.id 保留。仅临时 UI 身份，不是认证/安全随机或持久业务 ID，见 [内网 HTTP 接入](ADOPTION.md#原生-ui-id-与内网-http) |
| Button/IconButton | type=button、variant=primary、size=default；busy 与 disabled 分开，无隐式防重复；IconButton 要求 aria-label。render/ref/事件沿用公开 peer 合并合同 |
| Field/Fieldset/choices | Field 自动统一已知控件 id/label/help/error；复合输入显式 controlId。Input/Textarea/NativeSelect 与 checkbox/radio/switch 值/事件由宿主；Fieldset 独立关联 legend/help/error |
| MenuLayout/NavigationMenu | 未受控时 collapsed=false、sidebarOpen=false、未指定展开集合为空，当前链接祖先自动展开。activeId 省略才按同源精确 pathname 选择；null/无匹配无 selected。无 navigation adapter 时保留原生链接，菜单键盘/drawer owner 由库提供 |
| GroupedCombobox | 一个输入/listbox；查询/open/分页受控，预过滤数据由宿主；折叠和分页按钮在 listbox 外。选中默认 null；[合同](GROUPED_SEARCH.md) |
| Pagination/Disclosure | Pagination 默认第 1 页，pageCount 由宿主；受控 page 只请求确认。Disclosure 默认关闭，装饰性 chevron 与公开 DisclosureIndicator 复用相同 tokens。两者不发请求、不自动路由 |
| React Tabs/原生 tabs | React Root/List props 保留固定 peer 行为，xui 只补跳过 disabled 的方向键。原生默认手动激活、loopFocus=true；初始 value 优先 options，其次已有 selected，最后首个可用项；受控必须 syncValue |
| Dialog/Popover/Menu/Tooltip | 关闭不保存。原生 open 默认 false；受控 syncOpen、可取消 change。React Content portal/默认定位：Select bottom/start 且 alignItemWithTrigger=false，Combobox/Menu bottom/start，Popover bottom/center，Tooltip top/center；positionerProps 可覆盖。Dialog 为模态，非模态浮层不 trap；Tooltip 只放说明 |
| Sheet/AlertDialog/ContextMenu | Sheet默认end，确认initialFocus由宿主或安全取消/中性节点；context rightclick/Shift+F10，checked状态宿主拥有；details.cancel/finalFocus/嵌套生命周期见[COMPOSITIONS](COMPOSITIONS.md) |
| Toast | 原生按 id 去重、默认限额 5（limit 可覆盖且至少 1），未给 timeoutMs 不自动消失；显式 timeout 由 performance.now 计时，hover/focus 暂停。React Provider/manager props 保留 peer 默认，不伪称两套计时行为相同；必要错误就地持续可见 |
| Table/layout | 真实标准元素、header cell 默认 scope=col；TableContainer 为可聚焦 region，宿主给名字。SortButton type=button；striped/expandedRow/ExpandedRow/ExpandButton与逻辑stickyOffset公开；排序/选择/查询/虚拟化不由库执行。PageHeader 主标题和 actions，AppShell 默认抽屉关闭 |
| feedback/resource | Alert 默认 info/status，error 为 alert；DataRegion busy=false；LoadingState 默认 Loading…，ErrorState 默认 Retry。resource 初始 idle、isEmpty 未声明不猜空、无 timeout/cache/请求或自动 retry；换 key 清旧值、同 key 刷新保留，hooks 只订阅 |
| HTTP | 默认 GET、response=ajax、same-origin credentials、Go successCode=1；普通30秒/blob120秒预算，无自动重试。空/false/null payload 合法。响应模式、headers、认证/错误/重试适配与预算见 HTTP 合同，写操作不自动重放 |
| webfacade query | pageIndexOffset 必须逐 endpoint 明确，maxPageSize/字段 codecs/sort 白名单由宿主。没有全局页基数、上限或日期/object 隐式转换；ListData 为 list/total，未请求总数的 total 不代表真实零 |
| API Key | 首次读取由宿主 refresh；canCreate明确true才创建、撤销/删除需capability或明确宿主许可；过期可按授权撤销，删除仅已撤销管理记录。required权限与独立confirmed保留；默认HTTP facade/routes在API_KEY与PAGE_APIS，单一写入owner，未知结果不重复提交；完整值仅瞬时结果 |
| 业务日志 | 显式首次 refresh，page size=50（1–200），两宿主共享loader，默认原生HTTP facade见PAGE_APIS，auth/scope由宿主；固定公共事实与版本化 JSON payload。renderer 精确匹配类型/版本的首项；未匹配格式化 JSON，抛错固定反馈与 JSON。JSON 64 KiB/16 层/4096 节点；不缓存 payload |
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

## 已授权采用反馈扩展入口

| 正式入口 | 实现合同与源码 |
| --- | --- |
| `@coffeehc/xui-runtime/calendar` <!-- public-entry: @coffeehc/xui-runtime/calendar --> | [源码](../packages/runtime/src/calendar.ts)，[合同](WIDGETS.md) |
| `@coffeehc/xui-runtime/widgets-dom` <!-- public-entry: @coffeehc/xui-runtime/widgets-dom --> | [源码](../packages/runtime/src/widgets-dom.ts)，[合同](WIDGETS.md) |
| `@coffeehc/xui-react/toggle-group` <!-- public-entry: @coffeehc/xui-react/toggle-group --> | [源码](../packages/ui-react/src/toggle-group.tsx)，[合同](WIDGETS.md) |
| `@coffeehc/xui-react/avatar` <!-- public-entry: @coffeehc/xui-react/avatar --> | [源码](../packages/ui-react/src/avatar.tsx)，[合同](WIDGETS.md) |
| `@coffeehc/xui-react/accordion` <!-- public-entry: @coffeehc/xui-react/accordion --> | [源码](../packages/ui-react/src/accordion.tsx)，[合同](WIDGETS.md) |
| `@coffeehc/xui-react/scroll-area` <!-- public-entry: @coffeehc/xui-react/scroll-area --> | [源码](../packages/ui-react/src/scroll-area.tsx)，[合同](WIDGETS.md) |
| `@coffeehc/xui-react/calendar` <!-- public-entry: @coffeehc/xui-react/calendar --> | [源码](../packages/ui-react/src/calendar.tsx)，[合同](WIDGETS.md) |
| `@coffeehc/xui-react/command` <!-- public-entry: @coffeehc/xui-react/command --> | [源码](../packages/ui-react/src/command.tsx)，[合同](WIDGETS.md) |
| `@coffeehc/xui-theme/widgets.css` <!-- public-entry: @coffeehc/xui-theme/widgets.css --> | [源码](../packages/theme/src/widgets.css)，也包含于critical/style |

既有button/forms/table/layout/menu-layout/login/http入口增加明确props与slots，默认兼容：link、controlSize/readOnly/InputGroup、stickyHeader、不透明状态、scrollMode默认document、登录extensions、HTTP显式nativeOrigin。所有新增名字从构建声明自动核对，默认与控制事实见WIDGETS/AUTH/NAVIGATION/HTTP，不仅是新增入口名。

API Key入口追加公开 `createApiKeyWriteGuard`、`ApiKeyPendingWrite`/`ApiKeyWriteGuard`/`ApiKeyWriteResolution`/`ApiKeyWriteContext` 和controller的 `recoverUncertainWrite`，类型与范围见[API_KEY](API_KEY.md#写入保护的所有者与恢复)。保护所有者放在视图之外，guard没有任意清除方法；默认HTTP不新增推测核对路由。`lastUsedAtPending`/wire `last_used_at_pending` 都是可选明确bool。

## 应用头部与菜单文字角色补齐

- `@coffeehc/xui-react/layout` 及根入口：`AppHeader`、`AppHeaderProps`、`AppHeaderSlots`；`AppShellProps.headerSlots`。四角色为 brand/breadcrumb/status/actions，独立组合另有 navigation/children。`@coffeehc/xui-react/menu-layout` 的 `MenuLayoutProps.headerSlots` 同型，title作未指定brand的回退，旧header继续支持。
- `@coffeehc/xui-runtime/menu-layout` 及根入口：`MenuLayoutHeaderSlots`、`MenuLayoutOptions.headerSlots`，同名Node/null角色，支持DocumentFragment与稳定的非头部更新。完整替换/回退/生命周期见[NAVIGATION](NAVIGATION.md#应用头部角色与紧凑侧栏迁移)。
- `Menu.Icon` / `ContextMenu.Icon` 以及公开 `.xui-menu-icon` 图标类，显式16px语义图标，不处理任意嵌套插图；菜单项与label字号合同见[COMPOSITIONS](COMPOSITIONS.md#菜单文字图标与字段标签)。
- 公开theme/style.css与layout.css默认共用DESIGN新增的四个派生token：nav-sidebar-width、nav-sidebar-padding、nav-collapsed-width、layout-header-primary-min；不会覆盖整个Portal文字角色，也没有新增尺寸/密度开关。正式types/ESM全名字仍由public-api脚本与独立消费者验证。

## 侧栏底部公开插槽

- React `MenuLayoutProps.sidebarFooter` 与 `AppShellProps.sidebarFooter` 接收 `ReactNode`，默认无底部区域；`undefined`/`null`/`false` 不占位。`headerSlots` 四角色仍只属于顶栏。
- `@coffeehc/xui-react/layout` 与根入口导出 `SidebarFooterContent`、`SidebarFooterContentProps`，支持 span props/ref、`icon?: ReactNode`、`children`。它只组合图标/文字，动作使用既有 Button 或链接、状态使用宿主语义；没有业务动作默认值。
- 原生 `MenuLayoutOptions.sidebarFooter?: Node | null` 与 `update` 同型，接收 Node 或 DocumentFragment。未指定该字段的更新保留原 Node；同一 Node/已消费 Fragment 不重复挂载，null/undefined 清空。footer内容 Node 不能同时用于header或其它slot。
- 原生公开内容结构：`.xui-sidebar-footer-content`，其子 `.xui-sidebar-footer-icon[aria-hidden=true]` 和 `.xui-sidebar-footer-label`，与 React 同构。库生成 `.xui-shell-sidebar-menu` / `.xui-shell-sidebar-footer`；消费者不查询或修补它们来安排位置。
- `Dialog.Content.keepMounted?: boolean` 默认为false；底部模式的 AppShell 为复用同一侧栏而启用它，关闭时仍隐藏并保持模态隔离，普通Dialog默认不变。
- [接入及迁移](NAVIGATION.md#侧栏底部接入与迁移)、[专项覆盖矩阵](SIDEBAR_FOOTER_VALIDATION.md)。每个正式类型及ESM导出纳入全部exports/tarball检查。

## 顶栏单一导航开关

`MenuLayout` / `createMenuLayout` 在顶栏统一控制桌面collapsed与窄屏sidebarOpen，内部菜单不重复生成开关；原有受控props/update/callback保留。`AppShellProps`公开同型collapsed/defaultCollapsed/onCollapsedChange与compactLabel/expandLabel。独立NavigationMenuOptions追加showCollapseToggle（默认true，MenuLayout固定false/所属AppShell自动关闭）；共享键盘及原生菜单第三参数可选fallbackFocus供公开组合处理空菜单焦点。默认字号/按钮尺寸/动效沿既有token，不要求消费方CSS。[状态及迁移](NAVIGATION.md#顶栏唯一菜单开关)。

## 顶栏默认控件与语义插槽

完整[布局矩阵/迁移](LAYOUT_SLOTS.md)与[React](../examples/header-controls-react/app.tsx)/[原生](../examples/header-controls-vanilla/app.js)为正式独立消费者。AppHeaderSlots/MenuLayoutHeaderSlots追加context（左中）、auxiliary（工具组）、account（最右独立区）；原brand/breadcrumb/status/actions和legacy header继续保留。AppShell/MenuLayout及原生createMenuLayout追加sidebarHeader、pageHeader、pageToolbar、pageFooter，使用现有sidebarFooter/正文组合，不创建同义PageLayout。

AppHeader/AppShell/MenuLayout与原生MenuLayoutOptions同型theme?:ThemeController、themeLabels?:Partial<ThemeModeLabels>、locale?:HeaderLocaleOptions。主题入口默认始终存在，locale只有enabled:true才显示，辅助槽不依赖locale。ThemeModeButton/ThemeModeButtonProps从React/theme和根导出；runtime/theme的getThemeController(win)复用文档owner；runtime/theme-control导出ThemeModeLabels、getThemeModePresentation、bindThemeModeButton；runtime/header-controls导出HeaderLocaleOption/HeaderLocaleOptions、isHeaderLocaleEnabled、bindHeaderLocaleSelect。低层bind只绑定视图，清理不销毁theme/i18n owner。所有声明与新增名字由正式public-api/消费者检查自动取证。


## 有界工作区与平台前置槽

`ShellScrollMode`从runtime/menu-layout及根导出，并由React/layout及根重新导出；AppShellProps/MenuLayoutProps/MenuLayoutOptions.scrollMode接受document（默认）/viewport（旧main滚动）/workspace（content填满剩余高度）。workspace以库内flex/min-block-size链分配真实header和page slots以外的空间，不强制业务滚动区域、窗口集成或路由恢复策略。

AppHeaderSlots/MenuLayoutHeaderSlots追加可选leading（ReactNode / Node|null）；独立AppHeader直接接受leading。顺序为leading→自动navigation→brand→breadcrumb→context，默认空；同Node/Fragment与普通React协调保持稳定。宿主提供平台/全屏事实、尺寸和drag/no-drag语义，库没有OS默认像素。完整[合同](LAYOUT_SLOTS.md)、[React正式消费者](../examples/workspace-react/app.tsx)、[原生正式消费者](../examples/workspace-vanilla/app.js)及[验证记录](WORKSPACE_VALIDATION.md)。
