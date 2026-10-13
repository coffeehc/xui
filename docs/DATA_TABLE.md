# 公共 DataTable 与页面槽组合

正式入口：React `@coffeehc/xui-react/data-table`；原生 `@coffeehc/xui-runtime/data-table-dom`；共享事实与类型 `@coffeehc/xui-runtime/data-table`。三者也从各自根入口导出。默认皮肤属于公共 `@coffeehc/xui-theme/table.css`，完整 `style.css` 已包含它。原有 Table/TableContainer、Toolbar/Field、Pagination、DataRegion/反馈原语保持原语合同，不会自动升级所有旧表格。

完整消费者：[React](../examples/data-table-react/app.tsx)、[原生](../examples/data-table-vanilla/app.js)，共用[合成只读模型](../examples/shared/data-table-model.ts)。它们只安装正式 tarball，不依赖 `packages/src` alias、私有 CSS、产品 DOM 或真实业务服务。默认示例使用自然高度；`?layout=workspace` / `?layout=document` 对比显式布局，`?unbounded` 检查无高度边界，`?local` 演示宿主本地分页，`?cursor` 演示不请求总数的服务端游标（`?cursor-total` 可同时带真实总数），`?no-search`、`?no-actions`、`?no-pagination`、`?fixed-page-size` 检查可选能力。本页不代表任何产品完成迁移。

## 责任与最小接口

- 库提供表格整体、表体滚动、自然流底栏、列头/单元结构、筛选排列、状态反馈、键盘与默认视觉。宿主提供数据、列/行键、业务筛选、权限、排序/选择事实与业务动作。
- `DataTable<T>` / `createDataTable<T>` 必填 `label`、`rows`、`columns`、`rowKey`。每列有唯一 `id`、`header`、`cell(row, context)`；React cell 返回 ReactNode，原生返回 Node/文本或下述生命周期 slot。列可声明 `width`、`ariaSort` 和 `sticky:'start'|'end'`，复用原有表格样式；排序按钮放 header，真实排序通过宿主回调完成。
- `rowState(row)` 可提供 `selected/expanded` 事实。这里没有选择、排序、虚拟化或编辑状态引擎；展开明细、复杂合并单元格继续按已有 Table 原语组合，不伪装成已支持的 DataTable 特性。
- `status` 明确为 `idle/loading/ready/refreshing/error`，默认为 ready。`disabled` 阻止组件自有分页/条数/重试动作；单元业务动作由宿主按真实权限决定，context 提供 busy/disabled 事实。只读查看可在刷新时继续可用，不把整个表体设为 inert。
- `toolbar`、`emptyState`、`errorState`、`feedback`、`footer` 是公开插槽；内部 toolbar、反馈、表体与 footer 位于同一个 frame，没有默认业务动作或自动写入。`labels` 覆盖加载、错误、空态、分页和 `count({rowCount,total})` 文案。
- 所有 rowKey 必须唯一、稳定，字符串/数字经文本化也不能重合；列 id 唯一非空。空列、不合法 page facts 在渲染之前拒绝。

## 列宽与内容边界

`DataTableColumn<T>.width` 与 `NativeDataTableColumn<T>.width` 同为可选 `DataTableColumnWidth`。该类型从 `@coffeehc/xui-runtime/data-table`、`@coffeehc/xui-runtime/data-table-dom`、`@coffeehc/xui-react/data-table` 以及 runtime、React 根入口导出。列宽是宿主按列内容或用户配置传入的尺寸，不重定义品牌 token，也不让库新增业务列、读取用户偏好或保存列配置。

```tsx
import type {DataTableColumn, DataTableColumnWidth} from '@coffeehc/xui-react/data-table';

type Row = {id: string; name: string};
const nameWidth: DataTableColumnWidth = 'clamp(12rem, 50%, 32rem)';
const columns: readonly DataTableColumn<Row>[] = [
  {id: 'id', header: '标识', width: 160, cell: row => row.id},
  {id: 'name', header: '名称', width: nameWidth, cell: row => row.name},
];
```

- number 是 CSS 像素，运行时必须有限且非负；`0` 合法，但不表示隐藏列。隐藏列应由宿主过滤 `columns`，不能依靠零宽隐藏仍存在的表头、数据或交互。
- 字符串支持有单位的 CSS length（如 `'12rem'`、`'160px'`）、百分比（如 `'25%'`）、`calc(...)`、`clamp(...)`、`min(...)`、`max(...)` 和 `var(--...)`。裸数字字符串（如 `'160'`）、`auto`、对象、数组和 boolean 不是本接口的宽度值；自动列省略 `width`。
- TypeScript 模板字符串限制值的形状，不是完整 CSS 或数学验证。number 类型也不能静态证明有限、非负。在正常浏览器中，运行时再用 `CSS.supports('width', value)` 拒绝无效 CSS；SSR/无 CSS parser 时仅检查结构，不模拟 CSS parser、不解析变量，也不据此声明 SSR hydration 已验证。宿主须提供能解析为宽度的自定义属性；`calc(...)` 的合法表达式若计算为负数，宽度由浏览器归零，不会在静态类型阶段被证明或拒绝。

未声明任何 `width` 时，保留原有自动表格布局。部分列声明时，明确尺寸的列使用配置宽度，未声明列吸收剩余可用空间；全部声明时，表格宽度按列宽总和布局，不保证填满表体。总宽超过可用宽度时仍由原有表体区域横向滚动。表头和全部数据单元格使用同一张 table 的列轨道，不分别计算或复制表头宽度。

百分比及混合表达式（如 `'calc(50% - 1rem)'`）统一以表体可用宽度为基准，不以自身表格已经扩出的总宽为基准。组件内部用非交互、`aria-hidden` 的零高测量块交给浏览器解析，并由单个 `ResizeObserver` 将结果同步为 `colgroup` 的像素宽度；宿主无需查询内部 DOM、计算百分比或维护自己的观察器。此内部结构不是公共定位或样式入口。

长中文、长英文及无空格文本沿用公共表格的 `overflow-wrap:anywhere` 换行，不默认截断或省略内容。宿主 slot 若强制 `nowrap`、放置不可收缩的大控件或更大的最小宽度，仍须按内容选择合适列宽或适配 slot；库不会为满足指定宽度默认裁切按钮、操作内容或焦点轮廓。`sticky:'start'|'end'` 仍是既有单侧零 offset 合同，列宽配置不自动累加多个 sticky 列的偏移；需要多列冻结组合时使用已有 Table 原语的显式 `stickyOffset`。

## 页面标题、筛选与滚动

共享 `DataTableLayout = 'natural' | 'workspace' | 'document'` 从 runtime/data-table、runtime/data-table-dom、React/data-table 及 runtime/React 根入口导出。React `DataTable` 与原生 `createDataTable` 的 `layout` 默认均为 `'natural'`；它与 shell 的 `scrollMode` 是两个独立选择。

- `natural`：零行、少量行时随内容自然收缩；有实际确定高度的父容器时，以 `max-block-size:100%` 为上限，多行才由表体独立滚动，内部 toolbar、反馈和 footer 保留在正常布局流。父容器高度为 auto 时，百分比上限不能创造可用视口，表格仍按文档流增长；要限制高度，先通过公开 shell 或宿主已知尺寸建立真实边界。
- `workspace`：显式保留旧有填满已分配正文高度和组件最小高度的行为，适合需要少量行也占满工作区的页面。
- `document`：始终按无约束文档流增长，即使父容器有确定高度也不采用 natural 的高度上限；外层页面负责滚动可达性。

采用已有 `AppShell/MenuLayout` 的 `scrollMode="workspace"`、`pageHeader` 与正文可提供真实高度边界，没有第二套 PageLayout。下面让自然高度表格在 workspace 正文内按内容收缩，并把筛选放在同一表格外框内：

```tsx
<MenuLayout scrollMode="workspace" items={navigation}
  style={{'--layout-workspace-content-min-block-size': 'var(--data-table-min-block-size)'} as React.CSSProperties}
  pageHeader={<PageHeader title="记录" meta={<span>业务说明</span>}
    actions={<Button onClick={createRecord}>新增</Button>}/>}>
  <DataTable label="记录" columns={columns} rows={rows} rowKey={row => row.id}
    status={status} pagination={pagination} onRetry={retry}
    toolbar={<DataTableToolbar aria-label="筛选记录">
      <DataTableFilter label="搜索" grow>
        <Input value={query.search} onChange={event => requestSearch(event.target.value)}/>
      </DataTableFilter>
      <DataTableFilter label="类型">
        <NativeSelect value={query.type} onChange={event => requestType(event.target.value)}>
          {typeOptions}
        </NativeSelect>
      </DataTableFilter>
    </DataTableToolbar>}/>
</MenuLayout>
```

组件内部的 toolbar、反馈、表体与 footer 共用一个 frame；只有表体 `TableContainer` 在高度受限时滚动，列头按原有 stickyHeader 合同默认启用。边框属于整体 frame，滚动容器不再叠一层外框；底栏有必要的信息分隔。组件使用真实可用高度，宿主无需测量 pageHeader 或减固定像素，也不 absolute/fixed 定位分页。

极端字号或高工具条使全部 chrome 超过正文分配高度时，外框保留完整工具条/反馈/底栏和可读表体下限，交给既有祖先滚动，不让 footer 越出 frame。库内部只有一个稳定的布局观察器，以实际 table、thead、首末行高度和 computed scroll-padding/滚动条计算 `min(实际内容高度, 表头与首末行较高者的可读高度)`，将该值用于 Grid 的表体轨道，并与组件自身工具条/反馈/footer 的实际高度、frame 边框相加，设置组件根的最小高度；不读取宿主页头或已分配的根/frame 高度作为下限。workspace 取该实测最小值与原 token 的较大者，document 不加此根下限。无固定表头数字、行数分类或新的宿主参数。短内容不会因此补出空白。观察器只观察内容输入节点，不观察写入尺寸的 root/frame；合并同帧读写、无变化不写、忽略隐藏时的零几何、恢复显示后重测，并在销毁时释放及恢复拥有的内联值；列宽测量与 colgroup 合同独立且不变。

这个下限保证边缘记录操作的可达空间，不保证任意高度的全部中间行都可完整同屏。自定义超高单元格仍由表体滚动访问；需要逐行长文档阅读时可选 `document`，或按已有 `stickyHeader={false}` / `{stickyHeader:false}` 关闭吸顶列头。父视口本身不足时使用祖先滚动，不裁切内容。

外部 `pageToolbar` 仍受支持，与内部 `toolbar` 二选一放同一组筛选；不要复制搜索或增加查询 owner。`DataTableToolbar` 复用 Toolbar，`DataTableFilter` 复用 Field 的标签/id/错误关联；普通筛选默认使用 `--data-table-filter-min`，`grow` 搜索使用既有长字段尺度，在足够宽时自然同排，窄屏换行。不要直接依赖 NativeSelect 的全宽规则排列整个筛选区域。原生使用 `createDataTableToolbar(document, nodes)` 和 `createDataTableFilter(document, {label,control,grow})`，业务 control Node 与事件始终属于宿主。未提供搜索、动作或 toolbar 时，不为缺失能力保留空控件。

pageToolbar 容器原本就没有常驻下边框，和下方正文之间已有 `--layout-section-gap`。不要额外包整行 border-b；迁移时清理产品重复分隔及 footer/表体定位 CSS。表头、行和底栏必要边界保留。

`--layout-workspace-content-min-block-size` 仍是既有 shell 的公开内容区下限，默认 `0px`，不自动探测 DataTable。在 workspace shell 中要求超高页头/200%文字下保留非零正文视口时，仍须如上通过公开 style 显式绑定为 `var(--data-table-min-block-size)`；该设置只保障 shell 正文的可达空间，不把 natural 表格变成填满布局。main 可自然滚到表格，内容区可继续滚动到完整 footer。该下限按 rem 随字号变化并受 100dvh 约束，极短窗口允许 main 滚动，不承诺所有内容同屏。`--data-table-min-block-size` 保留用于显式 workspace 的组件下限，不是 natural 的强制高度；组件最小高度不能跨越零高父视口解决可达性。

原生同样只设置宿主 root 的公开 token，在生命周期结束时恢复宿主原值；不要查找或改写 `.xui-shell-content`：

```ts
const token = '--layout-workspace-content-min-block-size';
const oldValue = root.style.getPropertyValue(token);
const oldPriority = root.style.getPropertyPriority(token);
root.style.setProperty(token, 'var(--data-table-min-block-size)');
const shell = createMenuLayout(root, {scrollMode:'workspace', items, pageHeader, content:tableRoot});
// On host cleanup, after table.destroy() and shell.destroy():
if (oldValue) root.style.setProperty(token, oldValue, oldPriority);
else root.style.removeProperty(token);
```

普通无边界文档页可直接使用默认 natural；只有需要显式取消有界父容器高度上限时才选择 `layout='document'`。卡片列表仍用相同 pageHeader/pageToolbar，正文复用 ScrollArea/Grid/Surface，参见消费者 cards 模式；不用另造页面骨架。

## 默认布局迁移

此前省略 `layout` 等同于 `workspace`，现在省略等同于 `natural`。依赖旧默认填满工作区或最小高度的消费者应显式加 React `layout="workspace"` 或原生 `{layout:'workspace'}`，保留其真实父高度与必要的 shell 内容区下限。希望少量行/空态自然收缩的页面可以继续省略；显式 `document` 调用无需改变。不要通过产品私有 CSS 恢复旧默认。

既有公共 DataTable 的计数/每页条数/Pagination footer 本来就在 frame 内，此次将内部 toolbar 也统一到同一 frame；看到通用组件已有内部 footer，不能据此声称旧 XAgent 表格已升级。产品必须另行核对固定依赖 SHA、实际采用入口、页面槽和业务行为。本次仅修改 xui 公共组件、示例与合同，不修改 XAgent，也不替代已上线产品的兼容评估。

## 分页事实与未知总数边界

```ts
const pagination = {
  pageIndex: confirmedQuery.page_index,
  pageIndexOffset: endpointContract.pageIndexOffset,
  pageSize: confirmedQuery.page_size,
  total: listPage.total,
  pageSizeOptions: [20, 50, 100],
  onPageChange: requestPage,
  onPageSizeChange: requestPageSize,
};
```

组件只渲染传入的 `rows`，不自动切片，也不新增查询 owner。两种分页方式复用同一受控接口和同一个 footer：

- 本地分页：宿主持有完整记录和查询状态，先筛选/排序，再按 `(pageIndex - pageIndexOffset) * pageSize` 切出当前页，发布切片 rows、筛选后真实 total 和已确认 page facts。查询或条数改变时由同一宿主 owner 重置/校正页码。
- 服务端分页：宿主发请求，并以已确认响应对应的 rows、pageIndex、pageSize、total 更新表格；等待/失败期间保留旧确认事实。服务端已分页的 rows 不得再做一次本地切片。

`pageIndexOffset` 必须显式指定 endpoint 页基数，不默认猜 0 或 1。共享 `WebfacadeQuery` 使用真实 `page_index/page_size/return_total`；`parseListData` 验证真实 `list` 与可选 `total/next_cursor`，`toListPage(wire,{returnTotal})` 把未请求的总数投影为 null。组件不调用 HTTP、解析 envelope、猜字段或建立第二个 query/resource owner。

已知 total 时只做明确视图投影：`page = pageIndex - pageIndexOffset + 1`，`pageCount = max(1, ceil(total/pageSize))`。用户点击发出原 wire 基数 index；事实仍保持旧值，直到宿主确认下一组 rows/page facts 后更新，服务端场景以响应确认为准。每页条数只在 footer 出现一次，和真实已显示条数、已知总数与分页在同一公共区域；pageSize 更改只发请求，宿主决定是否回 endpoint 第一页。pageSizeOptions 必须为正的唯一整数并包含已确认值。省略 `onPageSizeChange` 表示条数不可编辑，保留唯一禁用条数控件；不应在 toolbar 再放一个条数选择器。

旧 `DataTablePagination` 保留原字段和默认 offset 行为，可显式 `mode:'offset'`。其中 `total:null` 只显示真实已加载数并隐藏编号 Pagination，不从满页/短页/数组长度猜 pageCount 或 hasMore。无 pagination 则为未分页列表，只显示已加载数。

游标服务采用新增的 `DataTableCursorPagination`，与旧 offset 类型同由 React、原生及 runtime 公开入口导出：

```ts
const pagination: DataTableCursorPagination = {
  mode: 'cursor',
  pageSize: confirmed.pageSize,
  total: confirmed.total, // number | null；无需每页 COUNT
  nextCursor: confirmed.nextCursor, // 非空 opaque string | null（明确末页）
  hasPrevious: history.length > 1,
  onNext: cursor => requestNext(cursor), // 原样传回服务端 token
  onPrevious: () => requestPrevious(), // 历史由已有宿主 owner 管理
  pageSizeOptions: [20, 50, 100],
  onPageSizeChange: size => resetQuerySize(size),
};
```

cursor 模式复用框内同一计数、条数控件和分页区域，只显示上一页/下一页。即使有 total 也不构造页码或页数，不接受 `onPageChange`。`hasPrevious:false`、`nextCursor:null` 或缺对应回调会禁用该动作；busy/disabled 与旧模式同样受控。服务端 `next_cursor` 缺省不等于末页：宿主 cursor adapter 必须要求字段存在，不能用 `?? null` 把未声明变成末页。HTTP 的 wire 使用 snake_case，组件 view facts 使用 camelCase，精确转换见 [列表合同](LIST_PAGINATION.md)。

上一页历史、查询/排序变化后重置、请求预算、失败重试、取消和迟到结果仍由唯一宿主 resource/query owner 管理。仅成功确认响应才推进历史和 rows；失败/取消不推进。组件不把 cursor 当作 URL/页码、不解码或生成 token，不自动缓存 total，不用数组长度推断后页。新增组合替代标准游标按钮的宿主外拼，`footer` 仍可放补充业务内容；不要重复两组翻页 owner。

已知 total 缩小导致当前 page 超范围时，组件保留事实而隐藏无效编号控件；宿主须在同一查询 owner 中协调过期页或提供恢复入口，不静默 clamp/自动发请求。

busy/disabled 阻止重复分页、条数和默认重试，另有同步单事件轮重入门禁。宿主必须同步发布 loading/refreshing，等待期间保持 busy，并在成功、失败、拒绝或取消后更新；组件不猜 Promise 完成，不自动重试写操作。回调结束并不表示请求成功。

## 状态、焦点与生命周期

- 首次 loading 始终保留列头并在 tbody 显示稳定骨架及 loading 状态，footer 不把加载中的未知计数当 0 条成功结果。
- refreshing 传入既有 rows；表体、底栏和搜索身份保持，反馈置于同一外框内、表体前的正常流，不另加外部反馈层；natural 会随反馈内容自然调整高度，达到真实父级上限后再压缩表体。error 仍保留既有行并提供 `onRetry`；首屏 error 位于 tbody，不能伪装成 empty。
- ready 且 rows=[] 保留全部列头，默认空态在跨全列 tbody 单元格内。`filtered` 区分初始无记录与筛选无匹配；自定义 emptyState 可放已有新增/清空回调，库不会凭空创建记录。
- 关闭、切页、查询变化、取消和迟到响应由现有 resource/query owner 处理。示例使用 `createResource` 与显式已确认快照，不添加 HTTP owner。业务查询改变时保留旧 rows 的策略明确由宿主选择，不能把它们误标为新查询结果。
- React 行/单元使用稳定 key。不要在 footer 更新时改变 columns renderer 的组件类型、重新生成行键或用整个查询给 DataTable 设 key。
- 原生 root 一次只允许一个 owner。`update(partial)` 未指定项保留，显式 undefined 可清插槽；表体、分页控件、toolbar 和 keyed 行保持身份。`getBody()` 返回公开滚动区域供合法滚动控制，不要求消费方查私有 DOM。

原生交互单元推荐 slot：

```ts
cell: (row) => {
  const button = document.createElement('button');
  button.type = 'button';
  let current = row;
  button.onclick = () => openRecord(current.id);
  return {
    element: button,
    update(next) { current = next; button.textContent = `查看 ${next.name}`; },
    destroy() { button.onclick = null; },
  };
}
```

有 update 的 slot 在同 key 行、busy/footer 更新时复用 element 并接收新 row/context，不移除正在聚焦的节点；移除列/行、替换 renderer 或 destroy 时恰好释放一次。普通 Node/文本仍支持，状态变化不会为它重建业务动作；需要把 busy 映射到已有控件时使用 slot.update。宿主承担自己挂上的监听器/第三方控件清理；slot.destroy 为正式清理入口。更新删除当前行时焦点回表体区域，不留在已脱离的节点。destroy 解除组件事件、释放 slots、恢复原 root 内容/属性；旧 handle 不再生效。初始化 factory 出错同样回收 root，不留下半个 owner。

## 验收与限制

单元测试覆盖显式基数/真实总数、未知 total、控制值回退、busy/disabled/同步防重、空态列头、刷新保行、slot身份/清理与无效更新。正式 tarball 消费包含每个公开 ESM/CSS/types、新入口、React peer 单实例以及原生零 React。

Playwright 用真实浏览器量测组件/body/footer rect、clientHeight/scrollHeight，并实际把表体滚到尾部；验收需区分 natural 的少行/零行收缩、多行有界滚动及 auto 父级自然流，显式 workspace 填满和 document 取消上限，并覆盖缺搜索、动作、分页及固定条数的组合；同时检查页头/搜索 rect 不变、分页仍可见、横向滚动/列对齐、窄屏换行、键盘/取消、三主题与 reduced-motion、0/20/50/100条和长中文、刷新失败恢复、200%与超高页头可达性。代码存在或 overflow 字符串正确不等于验收通过；实际通过/失败/未跑以对应 SHA 的执行证据为准。没有真实产品查询、产品 slot 迁移、部署、Wails、移动 OS、读屏器、Firefox/Safari、SSR hydration 或性能通过声明。

本次变更的差距、处理、未验证风险和执行状态见 [高度与分页组合验证记录](DATA_TABLE_LAYOUT_VALIDATION.md)。

ACL/权限过滤后的有界扫描可连续返回空 list 与非空 next_cursor；这仍可继续翻页，不保证下一页含记录，也不表示剩余数量。仅显式 null 是 cursor 末页。DataTable 不因空行禁用下一页，React/原生都有独立回归；此补充不改变共享 fixture 的字节或 hash。

## 请求失败时的几何稳定

状态反馈行在 idle/ready/loading/refreshing/error 时始终占位，以共享 `--feedback-slot-block-size`（一行控件、公共内距及焦点空间）约束本地反馈，而不是固定整页高度。长错误、自定义 feedback 或重试按钮在该区域内滚动且可通过键盘到达，不撑开 frame、不挤动既有表头、行、页脚。零行的 loading/idle/empty/error 使用同一个局部占位区；底栏持续显示真实 rowCount/total，不把长错误再次塞进计数区域。

现有行是否保留仍由宿主 rows 决定：普通同资源刷新应保留已确认事实；权限撤销、退出、租户或资源切换应按领域/认证规则清空，无权通过本组件继续展示。组件不缓存数据、不创建网络请求或离线 owner。见 [失败布局验证与边界](ERROR_LAYOUT_VALIDATION.md)。
