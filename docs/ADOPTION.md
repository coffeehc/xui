# xui 使用与迁移手册

这是接入入口，引用同一份规范、公开类型和已运行的例子，不另定义品牌默认值。当前包为 private 0.1.0；采用前固定 Git SHA/本地 tarball 并核对实际 exports。API Key 通用管理和结构化日志只读查询已实现；仓库接入 skill 与最终手册交叉验收仍在后续步骤。日志 facade 需宿主后端明确实现。

## 阅读顺序与架构职责

1. 检查 git status、当前提交、包 manifests/exports，保护本地改动后按任务授权正常 fetch。读清版本差异，不 reset/clean/强推，不覆盖业务修改。
2. [DESIGN.md](DESIGN.md)：唯一完整规则与默认 token 来源。
3. [IMPLEMENTATION.md](IMPLEMENTATION.md)：入口、主题 owner、组件 props/部件、原生公共结构与 lifecycle。
4. [NAVIGATION.md](NAVIGATION.md)：菜单数据、MenuLayout 与一次路由适配；[HTTP.md](HTTP.md)：传输/错误/Go 响应/query；[API_KEY.md](API_KEY.md)：脱敏列表/创建/一次性结果/复制/撤销；[LOGS.md](LOGS.md)：分组/观察/详情与拟议后端 facade 合同。
5. 下方可运行源组装页面；能力、验收与未跑项见 [FOUNDATION.md](FOUNDATION.md)、[FOUNDATION_VALIDATION.md](FOUNDATION_VALIDATION.md)。规范权威迁移另见 [MIGRATION.md](MIGRATION.md)。

theme 提供无框架预构建 CSS/tokens；runtime 提供主题、DOM、resource、菜单、HTTP/query 和共享 API Key/结构化日志控制器；ui-react 复用共享类型和 React/Base UI peers。产品保管可见菜单过滤、路由、身份、领域权限/数据与业务动作；xui 提供默认结构、交互、motion、focus/a11y。产品迁就统一标准，业务扩展通过公开 slots/render/adapters，公共能力不足反馈 xui。

## 最小运行与固定产物

仓库根执行真实脚本，工具版本见 packageManager/lock：

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test:consumer
pnpm preview
```

访问 /menu-react/、/menu-vanilla/ 最小菜单，/http-react/、/http-vanilla/ 标准查询页，/api-key-react/、/api-key-vanilla/ 管理组件，/log-react/、/log-vanilla/ 结构化错误查询，/foundation-react/、/foundation-vanilla/ 列表/表单/详情与动态加载。浏览器检查使用已有 Chromium，或 pnpm exec playwright install chromium。没有部署/发布操作。

test:consumer 将三个包 npm pack，在每次新目录安装 tarball，再从正式 ESM/CSS/types 编译和打包；原生不安装 React，React peers 单实例。生产接入也固定已验证提交，先构建并安装本地 tarball；包尚未发布，不默认填写不存在的 registry 版本。无 monorepo package src alias 或下游 Tailwind 扫描要求；菜单/HTTP/API Key/日志/foundation 示例只消费公开 CSS，最初 vanilla/react 示例保留自身页面 layout.css，它不是库所需的样式依赖。

完整可运行代码由正式 consumer/typecheck/browser 检查，直接参考公开调用：

| 宿主 | 菜单 | HTTP 标准页 | 列表/表单/详情 |
| --- | --- | --- | --- |
| React | [app.tsx](../examples/menu-react/app.tsx) | [app.tsx](../examples/http-react/app.tsx) | [app.tsx](../examples/foundation-react/app.tsx) |
| 原生 | [app.js](../examples/menu-vanilla/app.js) | [app.js](../examples/http-vanilla/app.js)/[HTML](../examples/http-vanilla/index.html) | [app.js](../examples/foundation-vanilla/app.js) |
| 共享数据/协议 | [菜单 JSON](../examples/shared/menu-data.json) | [typed endpoint model](../examples/shared/http-model.ts) | 领域事实归宿主 |

API Key 完整消费为 [React](../examples/api-key-react/app.tsx)/[原生](../examples/api-key-vanilla/app.js)，共用 [typed 假数据模型](../examples/shared/api-key-model.ts)，完整值只有一次性结果，不放进 metadata/resource/cache。

结构化错误完整消费为 [React](../examples/log-react/app.tsx)/[原生](../examples/log-vanilla/app.js)，共用 [typed fake facade](../examples/shared/log-model.ts)。按真实 cursor/query 语义展示累计/命中数与首次代表，只有单记录授权读取返回详情；拟议协议和宿主实现责任见 [LOGS.md](LOGS.md)。

## 主题、CSS 与单 owner

首屏 init 在 CSS/内容之前，应用复用 window.xuiTheme，不另建 matchMedia/storage/context 竞争状态。mode 是 light/dark/system 选择，effective 是浅深结果；受控选择经宿主确认，不隐式写 storage。React useTheme 只订阅，原生释放订阅/owner 边界明确。

选择一次 style.css 或 critical.css 加可选分片；默认值只来自 DESIGN。tokens 的 design-defaults→product-overrides→design-accessibility 与独立 xui-components 层按 [实施说明](IMPLEMENTATION.md) 加载。少量语义覆盖参考 DESIGN 的既有变量与示例，不复制全色板、不创建缺失 var、不在 JS 中维护颜色或抵消 reduced-motion。

旧未分层普通 CSS 优先级高于分层声明。先确认其业务/布局职责，再移除重复、明确分层或改公开组合并查 computed style。清理针对内部 DOM/伪元素的 selected/hover/focus 竞争皮肤，不能以导入放最后或私有选择器补丁冒充采用。

## 组件、数据与扩展点

下表是组装选择，详细公开 props/部件以 [IMPLEMENTATION.md](IMPLEMENTATION.md) 及固定提交 types 为准，沿用宿主标准 React/原生元素数据，不另造统一业务 schema。

| 公开能力 | 数据与状态 | 默认行为/扩展 |
| --- | --- | --- |
| MenuLayout/NavigationMenu | NavigationItem[]、activeId/location、一次 navigation/matchLocation、header/children | 默认菜单、选中/展开/紧凑/键盘/drawer；renderLink/renderLabel 与受控回调 |
| AppShell/Container/Stack/Grid/Toolbar/PageHeader/Section | sidebar/header/children、title/description/actions/meta | skip link/响应布局；低层 AppShell 用于自组 sidebar，不叠加第二个 MenuLayout owner |
| Button/IconButton | 标准 props、disabled/aria-busy、onClick、图标按钮名字 | type=button、键盘/focus/motion；公开 render/ref，busy 与防重复分别控制 |
| Field/Input/Textarea/NativeSelect/Fieldset/Checkbox/Radio/Switch | label/controlId/name/value/checked、help/error/required/readOnly | 单 id/描述与分组关联；复合输入显式 controlId，保留标准事件 |
| Select/Combobox | peer generic items/value、受控回调、公开 Root/Trigger/Input/List/Item/Content | peer 选择/搜索/键盘/取消，xui 皮肤；原生 select/datalist 的 OS 差异明确 |
| NavItem/Breadcrumbs/Pagination/Disclosure/Tabs | 当前项/页码/open/value 与内容 | page 选中、受控确认、disabled/RTL/方向键；Tabs 为实际 Root/List/Tab/Panel 部件 |
| Dialog/Menu/Popover/Tooltip/Toast | open/value、内容/执行回调、finalFocus，Toast manager | 公开部件/Content/positionerProps；模态/外点/Esc/回焦点；Tooltip 只放说明 |
| Table/TableContainer/TableCaption/TableHead/TableBody/TableRow/TableHeaderCell/TableCell/SortButton | 行/列/单元内容、scope/aria-sort/selected | 独立导出、原生 table 与命名滚动区域；排序/分页/选择由宿主，不是 rows/columns 引擎 |
| Surface/Alert/Badge/Skeleton/Spinner/Progress | children/tone/标准元素状态 | 默认层级/role/status/motion，必要事实持续可见 |
| DataRegion/LoadingState/EmptyState/ErrorState/RenderBoundary | busy/value、反馈、retry/cancel 与 render fallback | 刷新保留旧值，错误即时可见；render 异常与异步失败分开 |
| ApiKeyManager/createApiKeyManager | 一个共享 controller、metadata/声明权限和有效期、领域 adapter | 脱敏列表、创建/一次性结果、明确复制/撤销确认、关闭竞态；labels/React headerActions |
| StructuredLogExplorer/createStructuredLogExplorer | 一个共享 controller、明确 v1 DTO/facade、filter/cursor、详情权限与保留期 | 只读分组/观察/详情、缓存已访问摘要段、持续错误/取消、普通文本；labels/host Ref mapping/React headerActions |
| theme/resource/HTTP/query | 单 owner、key/loader/Abort/预算、endpoint adapter/query contract | 共享类型/终止/迟到隔离，默认不重试，401/403 分开，list/total 和基数明确 |

标准列表页为 MenuLayout→PageHeader 主操作→Toolbar/Field 筛选→DataRegion→TableContainer/Table→Pagination。筛选/排序重置该 endpoint 第一页并取消旧请求。cursor 日志页使用其完整公开组件，不套此 Pagination 页码或杜撰 total。表单页用 PageHeader/Fieldset/Field/公开控件，值、保存权限、防重复由宿主，必要错误关联并回焦点。详情页用 Breadcrumbs/Section/Surface/公开文本结构，敏感明细按授权加载，不执行 HTML。

原生基础控件可使用公开 HTML 类与 controller；这不是随意复制 React 内部 DOM。数据驱动菜单通过 createMenuLayout/createNavigationMenu 生成，不手写内部皮肤/selected 伪元素或第二套键盘。

## 逐页迁移与清理

先盘点旧实现承载的业务权限、导航条件、输入保留、认证/审计、缓存/并发、上传下载、错误恢复和可访问性；不能随旧皮肤盲删功能。保留行为后逐页建立旧→新映射：

- 旧 theme listener/storage/context → 一个 xui theme owner，保留宿主其他持久化字段，释放旧监听。
- 旧菜单 DOM/selected 皮肤/重复 current state/侧栏 drawer → 共享数据与一次 route adapter，清理竞争 owner，不用路由 key 重建 shell。
- 旧 fetch/认证重定向/Toast/loading 状态 → 一个 HTTP client+endpoint adapter+resource，按 [HTTP 合同](HTTP.md) 明确协议，不保留默认旧别名猜测链。
- 输入/弹层/表格私有皮肤 → 公开组件/部件或原生公共结构，保留 name/label/required、权限和业务回调。
- 旧 API Key/日志私有管理页 → 共享控制器与公开完整视图，保留领域权限/选项；一次性 key 不进入列表缓存，日志列表不带正文，后端按 LOGS 合同补 facade，不能把旧 offset 包装成 cursor。
- 缩字号/裁切关键内容/页面尺寸补丁 → 公开布局和滚动区域，业务特殊需求只组合公开扩展点。

每页检查默认色、selected-hover 指示与独立 focus/disabled、操作反馈/reduced-motion、三模式与异常回退、前进后退/同址/修改键/中键、抽屉取消/回焦点、宽窄/长中文/200%文字、加载失败/刷新保留/取消/显式重试/迟到响应、无写操作自动重放、卸载释放。运行该产品真实构建和页面交互；合成例子通过不能替代产品迁移。

## 验收、缺口与权限

验收必须仅调用固定产物公共 exports/props/slots/adapters，不补私有控件皮肤，不留竞争 owner。检查解析路径、peer 单实例、types/CSS/init generation、computed style 和实际业务行为；记录通过/未跑/失败与缺口。能力缺失反馈 xui，修改 xui/推送/发布/部署仍依具体任务授权，不由手册自授权。

结构化日志已有可运行公开消费，但生产后端 facade 与产品迁移未实施。仓库接入 skill 仍待完成，之后整体交叉核对手册/skill/产物。日志用独立 cursor 合同，不能套 webfacade offset query。SSR、真实移动 OS/读屏器/Firefox/Safari/生产性能等未跑项继续按验证记录保留。
