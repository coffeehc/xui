# DataTable 横向空间回归证据

## 已确认的公共合同与源码原因

基线 `57c4afe`。`448c6d85`（2026-10-12）同时引入列宽 API、测量 observer、单一 colgroup、全指定列宽的 `inline-size:0;min-inline-size:0` 与对应实际宽度浏览器断言。见 [列宽合同](DATA_TABLE.md#列宽与内容边界)。这不是给浏览器自由拉伸全部固定列的建议值：明确配置的轨道按解析尺寸保持，未配置列吸收余宽；全部指定时，总和可能小于表体宽度。极窄列、不可收缩内容等仍受原生表格与内容约束。

因此外框、toolbar、footer、scrollport 全宽但 table 较窄，可以由公共全指定列宽模式直接产生；不能仅凭截图判断产品实际传入的 columns 或依赖 SHA。本次不改 API、不增加假列、不重分业务固定列，也不修改产品。

## 独立正式消费者复现

React 与原生仅使用正式 tarball exports，全部数据合成。以下路径由现有 preview 提供：

- 全指定：`/data-table-react/?internal&widths&fluid-content&column-mode=sized&hide-column=source&size=20`
- 内容列吸收余宽：`/data-table-react/?internal&widths&fluid-content&hide-column=source&size=20`
- 原生将路径的 `react` 换成 `vanilla`。

两者唯一区别是第二种省略主要内容列的 width。编号、类型、范围、操作轨道保持同一配置；没有额外 CSS、私有布局修改或不同表体。`layout=workspace` 只控制纵向占满，不改变横向合同。

`tests/browser/data-table-widths.spec.mjs` 增加直接复现、frame/scrollport/table 左右边、配置列不变及主要内容列吸收余宽断言，并输出 CSS 像素矩形 JSON 和两张合成截图。矩形包含 toolbar→table 距离、反馈槽、footer 及是否在视口。覆盖 React/原生、320/390/1280、light/dark/system、100%/200%、natural/workspace、自动/混合和隐藏列。原有测试继续检查全部指定尺寸、百分比表达式、空态 colspan、sticky LTR/RTL、隐藏恢复、销毁。少行/空态自然高、受限多行滚动、footer、缺省 toolbar 和 document 由既有 `data-table-layout.spec.mjs` 与 `data-table.spec.mjs` 聚合验证。

## 工具栏后的空白是另一个公共问题

`057ea7ca` 引入 `.xui-data-table-feedback` 的常驻反馈槽。当前高度为 `control-height + 2 × space-content-gap + 2 × (focus-width + focus-offset)`；ready 无反馈也预留。它用于失败/刷新不挤动表头，但会形成可见空白。这里记录原因，不把它解释成合理的最终视觉，也不以删除高度破坏失败稳定回归。后续应评估在已有 toolbar/footer 区域呈现短状态摘要、长详情按需展开的公共结构；要同时验证无工具栏、窄屏、200%、键盘重试及失败前后焦点和几何稳定。尚未实现该结构。

## 采用方检查提示词

请先核对当前 xui 固定版本和实际 DataTable columns。若每一列都传 width，按现有公共合同会得到列宽总和，不会自动铺满。对主要内容列省略 width，让它吸收剩余宽度，保留编号、日期、操作等明确配置列和所有业务行为；不要传 width: 'auto'，它不是公开类型。不要加产品 table/footer 定位覆盖。使用公共 DataTable toolbar、受控 pagination 和现有 Layout 组合，分别检查少量/空行自然高度、多行表体滚动、分页可达、窄屏、200% 和 sticky。若已有未配置列仍不铺满，记录实际依赖 SHA、正式导入入口、columns 配置和 table/scrollport CSS 像素边缘，再回到 xui 修复。此提示不授权自动修改任何产品。

## 执行状态

新增浏览器矩形及截图必须由安全浏览器 CI 对集成提交执行；测试代码/采集成功不等于浏览器通过。这里不声明真实产品已升级，也不从参考截图设备像素换算 CSS 几何。实际 CI 结果以集成提交报告为准。
