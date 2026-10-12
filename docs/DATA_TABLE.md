# 公共 DataTable 与页面槽组合

正式入口：React `@coffeehc/xui-react/data-table`；原生 `@coffeehc/xui-runtime/data-table-dom`；共享事实与类型 `@coffeehc/xui-runtime/data-table`。三者也从各自根入口导出。默认皮肤属于公共 `@coffeehc/xui-theme/table.css`，完整 `style.css` 已包含它。原有 Table/TableContainer、Toolbar/Field、Pagination、DataRegion/反馈原语保持原语合同，不会自动升级所有旧表格。

完整消费者：[React](../examples/data-table-react/app.tsx)、[原生](../examples/data-table-vanilla/app.js)，共用[合成只读模型](../examples/shared/data-table-model.ts)。它们只安装正式 tarball，不依赖 `packages/src` alias、私有 CSS、产品 DOM 或真实业务服务。本页不代表任何产品完成迁移。

## 责任与最小接口

- 库提供表格整体、表体滚动、自然流底栏、列头/单元结构、筛选排列、状态反馈、键盘与默认视觉。宿主提供数据、列/行键、业务筛选、权限、排序/选择事实与业务动作。
- `DataTable<T>` / `createDataTable<T>` 必填 `label`、`rows`、`columns`、`rowKey`。每列有唯一 `id`、`header`、`cell(row, context)`；React cell 返回 ReactNode，原生返回 Node/文本或下述生命周期 slot。列可声明 `ariaSort` 和 `sticky:'start'|'end'`，复用原有表格样式；排序按钮放 header，真实排序通过宿主回调完成。
- `rowState(row)` 可提供 `selected/expanded` 事实。这里没有选择、排序、虚拟化或编辑状态引擎；展开明细、复杂合并单元格继续按已有 Table 原语组合，不伪装成已支持的 DataTable 特性。
- `status` 明确为 `idle/loading/ready/refreshing/error`，默认为 ready。`disabled` 阻止组件自有分页/条数/重试动作；单元业务动作由宿主按真实权限决定，context 提供 busy/disabled 事实。只读查看可在刷新时继续可用，不把整个表体设为 inert。
- `toolbar`、`emptyState`、`errorState`、`feedback`、`footer` 是公开插槽；没有默认业务动作或自动写入。`labels` 覆盖加载、错误、空态、分页和 `count({rowCount,total})` 文案。
- 所有 rowKey 必须唯一、稳定，字符串/数字经文本化也不能重合；列 id 唯一非空。空列、不合法 page facts 在渲染之前拒绝。

## 页面标题、筛选与滚动

采用已有 `AppShell/MenuLayout` 的 `scrollMode="workspace"`、`pageHeader`、`pageToolbar` 和正文；没有第二套 PageLayout。

```tsx
<MenuLayout scrollMode="workspace" items={navigation}
  style={{'--layout-workspace-content-min-block-size': 'var(--data-table-min-block-size)'} as React.CSSProperties}
  pageHeader={<PageHeader title="记录" meta={<span>业务说明</span>}
    actions={<Button onClick={createRecord}>新增</Button>}/>}
  pageToolbar={<DataTableToolbar aria-label="筛选记录">
    <DataTableFilter label="搜索" grow>
      <Input value={query.search} onChange={event => requestSearch(event.target.value)}/>
    </DataTableFilter>
    <DataTableFilter label="类型">
      <NativeSelect value={query.type} onChange={event => requestType(event.target.value)}>
        {typeOptions}
      </NativeSelect>
    </DataTableFilter>
  </DataTableToolbar>}>
  <DataTable label="记录" columns={columns} rows={rows} rowKey={row => row.id}
    status={status} pagination={pagination} onRetry={retry}/>
</MenuLayout>
```

默认 `layout='workspace'` 直接填满已分配的正文高度。组件工具条/反馈与 footer 为正常布局流，表体 `TableContainer` 独立滚动，列头按原有 stickyHeader 合同默认启用。边框属于整体 frame，滚动容器不再叠一层外框；底栏有必要的信息分隔。组件使用真实可用高度，不测 header、不减固定像素、不 absolute/fixed 定位分页。

外部 `pageToolbar` 与内部 `toolbar` 二选一放同一组筛选；不要复制搜索或增加查询 owner。`DataTableToolbar` 复用 Toolbar，`DataTableFilter` 复用 Field 的标签/id/错误关联；普通筛选默认使用 `--data-table-filter-min`，`grow` 搜索使用既有长字段尺度，在足够宽时自然同排，窄屏换行。不要直接依赖 NativeSelect 的全宽规则排列整个筛选区域。原生使用 `createDataTableToolbar(document, nodes)` 和 `createDataTableFilter(document, {label,control,grow})`，业务 control Node 与事件始终属于宿主。

pageToolbar 容器原本就没有常驻下边框，和下方正文之间已有 `--layout-section-gap`。不要额外包整行 border-b；迁移时清理产品重复分隔及 footer/表体定位 CSS。表头、行和底栏必要边界保留。

`--layout-workspace-content-min-block-size` 是既有 shell 的公开内容区下限，默认 `0px`，不自动探测 DataTable。采用本组合时，必须如上通过 shell 的公开 style 显式绑定为 `var(--data-table-min-block-size)`。普通高度仍由正文吃满剩余空间；超高页头/200%文字时保留非零正文视口，main可自然滚到表格，内容区可继续滚动到完整 footer。该下限按 rem 随字号变化并受 100dvh 约束，极短窗口允许 main 滚动，不承诺所有内容同屏。DataTable 自身的最小高度不能跨越零高父视口解决可达性。

原生同样只设置宿主 root 的公开 token，在生命周期结束时恢复宿主原值；不要查找或改写 `.xui-shell-content`：

```ts
const token = '--layout-workspace-content-min-block-size';
const oldValue = root.style.getPropertyValue(token);
const oldPriority = root.style.getPropertyPriority(token);
root.style.setProperty(token, 'var(--data-table-min-block-size)');
const shell = createMenuLayout(root, {scrollMode:'workspace', items, pageHeader, pageToolbar, content:tableRoot});
// On host cleanup, after table.destroy() and shell.destroy():
if (oldValue) root.style.setProperty(token, oldValue, oldPriority);
else root.style.removeProperty(token);
```

无边界文档页显式选择 `layout='document'`。卡片列表直接用相同 pageHeader/pageToolbar，正文复用 ScrollArea/Grid/Surface，参见消费者 cards 模式；不用另造页面骨架。

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

`pageIndexOffset` 必须显式指定 endpoint 页基数，不默认猜 0 或 1。共享 `WebfacadeQuery` 使用真实 `page_index/page_size/return_total`；`parseListData` 验证真实 `list/total`，`toListPage(wire,{returnTotal})` 把未请求的总数投影为 null。组件不调用 HTTP、解析 envelope、猜字段或建立第二个 query/resource owner。

已知 total 时只做明确视图投影：`page = pageIndex - pageIndexOffset + 1`，`pageCount = max(1, ceil(total/pageSize))`。用户点击发出原 wire 基数 index；事实仍保持旧值，直到宿主确认响应后更新。每页条数只在 footer 出现一次，和真实已显示条数、已知总数与分页在同一公共区域；pageSize 更改只发请求，宿主决定是否回 endpoint 第一页。pageSizeOptions 必须为正的唯一整数并包含已确认值。

`total:null` 只显示真实已加载数，不生成编号 Pagination，也不从满页/短页/数组长度猜 pageCount 或 hasMore。可使用 footer 放宿主已有 cursor 控件；本轮不提供 cursor 链/上一页历史/hasMore owner，不能把该插槽称为完整 cursor 分页组合。无 pagination 则为未分页列表，只显示已加载数。已知 total 缩小导致当前 page 超范围时，组件保留事实而隐藏无效编号控件；宿主须在同一查询 owner 中协调过期页或提供恢复入口，不静默 clamp/自动发请求。

busy/disabled 阻止重复分页、条数和默认重试，另有同步单事件轮重入门禁。宿主必须同步发布 loading/refreshing，等待期间保持 busy，并在成功、失败、拒绝或取消后更新；组件不猜 Promise 完成，不自动重试写操作。回调结束并不表示请求成功。

## 状态、焦点与生命周期

- 首次 loading 始终保留列头并在 tbody 显示稳定骨架及 loading 状态，footer 不把加载中的未知计数当 0 条成功结果。
- refreshing 传入既有 rows；表体、底栏和搜索身份保持，反馈置于同一外框内、表体前的正常流，显示反馈不移动可见外框。error 仍保留既有行并提供 `onRetry`；首屏 error 位于 tbody，不能伪装成 empty。
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

Playwright 用真实浏览器量测组件/body/footer rect、clientHeight/scrollHeight，并实际把表体滚到尾部；同时检查页头/搜索 rect 不变、分页仍可见、横向滚动/列对齐、窄屏换行、键盘/取消、三主题与 reduced-motion、0/20/50/100条和长中文、刷新失败恢复、200%与超高页头可达性。代码存在或 overflow 字符串正确不等于验收通过；实际通过/失败/未跑以对应 SHA 的执行证据为准。没有真实产品查询、产品 slot 迁移、部署、Wails、移动 OS、读屏器、Firefox/Safari、SSR hydration 或性能通过声明。
