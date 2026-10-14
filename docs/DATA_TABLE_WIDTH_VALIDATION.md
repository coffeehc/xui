# DataTable 横向空间回归证据

## 旧合同与本轮明确变更

`448c6d85`（2026-10-12）引入列宽 API、测量 observer、单一 colgroup，以及全指定列宽的 `inline-size:0;min-inline-size:0`。旧合同要求配置轨道保持解析尺寸，全部指定时 table 按列宽总和收缩。因此外框、toolbar、footer、scrollport 全宽而 table 留白可以直接由公共组件产生，原宽度测试也明确要求该留白。

2026-10-14 用户明确选择：默认铺满，`width` 作为下限；保留列宽入口，但实际使用只有必要时才设置。本轮将全指定表格恢复为 `inline-size:100%`，由原生固定表格算法分配余宽；下限总和大于表体时仍保持轨道并在表体横滚。未指定列仍优先吸收余宽，百分比/表达式仍以表体宽为基准。不增加分配 owner、占位列、配置开关或产品 CSS。现行合同与迁移说明见 [列宽合同](DATA_TABLE.md#列宽与内容边界)。

## 独立正式消费者复现

React 与原生仅使用正式 tarball exports，全部数据合成。以下路径由现有 preview 提供：

- 全指定下限：`/data-table-react/?internal&widths&fluid-content&column-mode=sized&hide-column=source&size=12`
- 内容列吸收余宽：`/data-table-react/?internal&widths&fluid-content&hide-column=source&size=12`
- 原生将路径的 `react` 换成 `vanilla`。

两者唯一区别是第二种省略主要内容列的 width；它们现在都铺满。编号、类型、范围、操作的下限配置相同，第一种实际轨道可因余宽而增长；第二种由主要内容列吸收余宽。日常使用建议默认省略列宽，全指定页面专用于合同回归。`layout=workspace` 只控制纵向占满。

`tests/browser/data-table-widths.spec.mjs` 分别断言 probe/col 配置解析值、实际轨道不小于下限、表宽为表体与下限总和的较大者、表头与每行对齐。保留动态隐藏/恢复、百分比/clamp/calc、窄屏横滚、200%、LTR/RTL sticky、隐藏恢复与销毁，并将全指定模式纳入三主题与宽窄矩阵。`data-table-caption-shape.spec.mjs` 用12行5列验证natural/workspace/document、计数/分页两种footer、1700/390及200%文字；底栏高度按真实内容加公共padding计算，不能由多余Grid轨道拉高。矩形与截图包含源码SHA及包generation。

## 工具栏后的空白与公共修复

`057ea7ca` 引入的常驻反馈槽高度为 `control-height + 2 × space-content-gap + 2 × (focus-width + focus-offset)`，ready 无反馈也预留。这是表格工具栏与列头间空白的公共根因，独立于列宽。

后续公共修复将已有行状态及自定义 feedback 移入 footer 的计数区域，无反馈时 toolbar 直接接表体。短状态在空间足够时复用原底栏高度；长消息保留全部原文，不再固定高裁切/内滚，允许底栏必要增长并通过既有布局观察器保障 frame 与祖先滚动。零行 placeholder 同样只保留最小高。宿主已有摘要/详情可通过公开 Disclosure 合成；库不猜摘要、不增加业务流程或自动重试。无 count/pagination/业务 footer/反馈时隐藏空 footer。

`data-table-feedback.spec.mjs` 提供短状态前后真实几何、320/390/1280 的 200% 长错误完整文本行、短窗口分页/重试焦点命中、无 count/pagination 以及自定义 Disclosure 展开/输入/焦点保留。所有截图仅合成数据。浏览器实际结果需以新 SHA CI 确认。

## 采用方检查提示词

请先核对当前 xui 固定版本和实际 DataTable columns。通常省略 width；仅对确有需要的列设置下限。不要传 width:'auto'，它不是公开类型。新合同下全指定列也会铺满，原先依赖像素精确且不得增长的消费者须核对实际列宽；不要加产品 table/footer 定位覆盖。使用公共 toolbar、受控 pagination 和现有 Layout，分别检查少量/空行自然高度、多行表体滚动、分页可达、窄屏、200%与sticky。若仍不铺满，记录依赖SHA、正式入口、columns及table/scrollport矩形后回到公共组件定位。此提示不授权自动修改任何产品。

## 执行状态

2026-10-14本地CUA对重建后的正式消费者进行只读几何核对：React 12行5列在1280px视口时body/table同宽1014px，frame三轨为88/407/53px；1700px视口时body/table同宽1434px，实际列均不小于112/448/159.398/160/120px下限，footer仍为53px（36px控件、上下各8px及1px分隔）。同宽原生计数底栏也为53px，没有额外Grid余高。首次空白与四轨反馈间隙来自旧dist：旧示例不支持12条pageSizeOptions，资源更新后恢复，不能将其当作当前源码缺陷。

首轮表格自动化243项中237通过，6项失败均在扩展宽度矩阵：5项单例包含36组与大量逐格expect，耗尽30秒预算；另一项在200%字号切换引起shell宽度动画时，probe已更新但实际列轨道尚未稳定，偏差2.2625px。现按layout/theme拆为36个独立case，仍逐格测量、以最大误差断言，单例30秒与1.5px阈值不变；同一次poll同时验证解析值与实际几何，并保留失败矩形。此次只修测试，公共实现不变。

Precision默认主题C与固定密码B提交后的独立D候选，正式消费者 build 为 `a7df67e34ca9`；`data-table-widths.spec.mjs` 与 `data-table-caption-shape.spec.mjs` 在隔离 Chromium 中80/80通过。矩阵覆盖React/原生、自然/文档/workspace、窄宽视口、明暗模式、100%/200%文字、全部下限/混合/自动列，以及12行分页/footer固有高度；结果来自本地独立候选，不代表实际产品已升级或完整浏览器套件全部通过。
