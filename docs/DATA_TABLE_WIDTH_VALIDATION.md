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

## 工具栏后的空白与公共修复

`057ea7ca` 引入的常驻反馈槽高度为 `control-height + 2 × space-content-gap + 2 × (focus-width + focus-offset)`，ready 无反馈也预留。这是表格工具栏与列头间空白的公共根因，独立于列宽。

后续公共修复将已有行状态及自定义 feedback 移入 footer 的计数区域，无反馈时 toolbar 直接接表体。短状态在空间足够时复用原底栏高度；长消息保留全部原文，不再固定高裁切/内滚，允许底栏必要增长并通过既有布局观察器保障 frame 与祖先滚动。零行 placeholder 同样只保留最小高。宿主已有摘要/详情可通过公开 Disclosure 合成；库不猜摘要、不增加业务流程或自动重试。无 count/pagination/业务 footer/反馈时隐藏空 footer。

`data-table-feedback.spec.mjs` 提供短状态前后真实几何、320/390/1280 的 200% 长错误完整文本行、短窗口分页/重试焦点命中、无 count/pagination 以及自定义 Disclosure 展开/输入/焦点保留。所有截图仅合成数据。浏览器实际结果需以新 SHA CI 确认。

## 采用方检查提示词

请先核对当前 xui 固定版本和实际 DataTable columns。若每一列都传 width，按现有公共合同会得到列宽总和，不会自动铺满。对主要内容列省略 width，让它吸收剩余宽度，保留编号、日期、操作等明确配置列和所有业务行为；不要传 width: 'auto'，它不是公开类型。不要加产品 table/footer 定位覆盖。使用公共 DataTable toolbar、受控 pagination 和现有 Layout 组合，分别检查少量/空行自然高度、多行表体滚动、分页可达、窄屏、200% 和 sticky。若已有未配置列仍不铺满，记录实际依赖 SHA、正式导入入口、columns 配置和 table/scrollport CSS 像素边缘，再回到 xui 修复。此提示不授权自动修改任何产品。

## 执行状态

新增浏览器矩形及截图必须由安全浏览器 CI 对集成提交执行；测试代码/采集成功不等于浏览器通过。这里不声明真实产品已升级，也不从参考截图设备像素换算 CSS 几何。实际 CI 结果以集成提交报告为准。
