# DataTable 高度与分页组合验证记录

日期：2026-10-12。范围：xui 公共 DataTable 的 React / 原生组合；起点 `448c6d852c57971503c78fca63994e5e971b735e`。不修改或声称已验证 XAgent、文件/MCP/session 产品页或生产部署。正式行为与迁移入口见 [DATA_TABLE](DATA_TABLE.md)。

## 差距、处理与边界

| 现象或发现 | 影响、证据与处理 | 状态与下一步 |
| --- | --- | --- |
| 旧默认 `workspace` 填满正文，少量数据仍留下大块表体空白 | 原 React 默认参数、原生 fallback 与 CSS `block-size:100%` 均可定位。默认改为 `natural`，明确 `workspace` 保留原填满行为，`document` 保留无界文档流 | 源码、类型与单元检查完成；本里程碑 CI 已通过实际高度与有界/auto 父级浏览器矩阵 |
| 内部工具条位于 frame 外 | 两个渲染器原结构是 root 下 tools + frame。现改为 frame 内 tools → feedback → body → footer；外部 pageToolbar 仍可替代内部工具条 | 结构/原生稳定节点测试通过；CI 中内部/外部工具条、短/长内容矩形边界通过 |
| 外拼分页、每页选择器占满一行、不同产品底栏不一致 | 当前公共组件在本轮前已把计数、唯一条数选择器与 Pagination 放在同一内部 footer，并已有紧凑 select CSS；仅凭产品现象不能确认使用了该组合 | 保留已有受控分页，不重复造 owner。产品应在各自授权任务核对固定版本、实际组件、外拼 footer/全宽覆盖后迁移；本轮未改产品 |
| 最后一行与 footer 相邻时重复边线 | 表格单元默认末端边线与 footer 顶部线叠加 | 仅 DataTable 末行取消单元末端线；表头/行间线和 footer 信息边界保留 |
| document 作为有界 column-flex 的子项可能被压缩 | 代码评审发现根 `min-block-size:0` 与默认 flex-shrink 会削弱无界合同 | document 明确 `flex:none`；正常/column-flex 有界宿主的实际增高与底栏滚动可达案例已在 CI 通过 |
| 分片 CSS 次序可能恢复 DataRegion 的通用最小高度 | `.xui-data-region` 与原根选择器同优先级；feedback.css 后加载可覆盖自然高度的零最小值 | natural/document 在带 layout 属性的更高优先级选择器声明零最小值；CSS 结构门禁通过，未单独执行浏览器分片反序载入用例 |
| 极端高工具条/200%文字下，sticky 表头可能遮住最低表体中的行 | 保留的表体最小值为 control-height；自定义/换行表头可能比它更高。这是源码评审风险，尚无本轮浏览器像素复现，旧 workspace 同样沿用该最小值 | 新增 natural 内部工具条 200% 案例已在 CI 验证祖先滚动、表体非零、末行几何交集和 footer 焦点/命中。该检查不证明被 sticky 表头覆盖处的行操作可命中；必要时补精确行命中复现再决定独立 fallback，不能把风险写成已修复 |

## 已完成的本地检查

在 dot 云执行环境进行，未使用用户本地电脑。最终候选构建的 build、check:tokens、typecheck 和 308 项单元测试通过（0 失败/跳过）。正式 tarball 双端消费在补充 document flex 与 CSS 优先级边界后再次完整通过；所有公开 ESM/CSS/types、React peer 单实例、原生零 React 与 gzip 门禁均通过。Playwright 全集收集为 629 例，收集不等于浏览器执行。列宽 API、宽度校验、probe/ResizeObserver、colgroup 和列宽 CSS 算法逐项比对未改动。

新增 `tests/browser/data-table-layout.spec.mjs` 的 46 个浏览器案例覆盖：两端、0/1/20/50/100 行、搜索/动作有无、本地同步切片与服务端延迟确认、内部/外部工具条、窄屏、有界/auto 父级、workspace/document、未知 total、无分页和固定条数。既有布局浏览器用例显式传 `layout=workspace`，保留原填满模式的回归，列宽浏览器用例继续保留。

## 同 SHA 的完整 CI

代码提交 `91fd32148a09b0ac33936a5ebf04a209b35173d0` 已推送 main；[GitHub Actions 38297151612](https://github.com/coffeehc/xui/actions/runs/38297151612) 最终为 success。完整 `pnpm verify` 通过 build、tokens、typecheck、308 项单元、1 项 watch、两端独立 tarball、1 项冷启动及 629 项真实 Chromium 测试（浏览器阶段 8.6 分钟）。其中 46 项是本轮新增布局矩阵；此前 6 项列宽浏览器回归保留并通过。

本记录更新仅补充该代码 SHA 的执行证据，不把后续认证或产品任务的改动自动纳入本次验收。

## 验证限制与发布状态

- 本执行环境已有 Chromium/socket 限制；本轮不重复启动、绕过限制或把收集测试等同于运行。watch、冷启动与真实 Chromium 回归通过 GitHub Actions 的完整 `pnpm verify` 检验。
- 本里程碑代码的同 SHA CI 已完成；后续源码变更需要按其新 SHA 独立验收，不能沿用本次结果。
- 真实产品后端、Wails/移动 OS、读屏器、Firefox/Safari、SSR hydration、生产性能及部署均未验证。
- 父容器高度为 auto 时自然表格不会凭空获得有界视口；分页会随完整表格位于文档后方，可通过文档滚动到达。需要固定可见分页的宿主必须使用公开 workspace 或自身真实已知高度。
