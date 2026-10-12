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
| 分片 CSS 次序可能恢复 DataRegion 的通用最小高度 | `.xui-data-region` 与原根选择器同优先级；feedback.css 后加载可覆盖自然高度的零最小值 | natural/document 在带 layout 属性的更高优先级选择器覆盖通用值；后续内在高度修复把 natural 改为 min-content、document 仍为零。CSS 结构门禁通过，未单独执行浏览器分片反序载入用例 |
| 极端高工具条/200%文字下，sticky 表头可能遮住最低表体中的行 | 保留的表体最小值为 control-height；自定义/换行表头可能比它更高。CI 38297151612 的 geometry 附件已确认 390px、内部 toolbar、200% 时 outer/frame 高 288px、内容高 1146px、body 高 72px、footer 高 377px；footer 实际越过 frame 下边界。旧 workspace 同样沿用该最低表体值 | 旧测试仅验证祖先滚动、表体非零、末行几何交集和 footer 焦点/命中，漏掉 footer/frame 包含与行操作命中，CI 绿色不能证明完整需求。正在补真实首末操作点击/命中和 frame 包含断言，并修复内在最小高度；未获新 SHA 浏览器通过前保持未解决 |

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


## 极端 chrome 的内在高度修复（后续候选）

前述绿色 CI 遗漏的真实缺陷不能仅以文档关闭。后续实现把 frame 改为明确的工具条/反馈/表体/footer 四行 Grid；natural 和 workspace 的根及 frame 保留内在最小高度，全部 chrome 超出分配高度时完整外框自然撑起，由既有祖先滚动。workspace 的同格空伪元素保留原有 token 下限，即使父高度为 auto；不能用含未解析 100% 的 max() 代替独立下限。

组件内部新增稳定布局 owner，仅测实际 table/thead/首末行和 computed scroll-padding/滚动条，使用完整内容高与可读边缘行高度的较小值作为表体轨道下限。没有行数阈值、固定表头高度、消费者测量或新布局配置。观察目标更新、同帧合并、无变化不写、隐藏恢复和销毁清理有独立单元覆盖；宽度 API、宽度 observer/probe/colgroup 不变。

浏览器矩阵补上所有 frame 的四边包含，极端字号下 footer 必须真正留框内，首末行操作必须 elementFromPoint 命中后以真实指针点击且产生唯一业务回调；新增字号恢复、隐藏期间字号/宽度变化后显示、同 DOM 身份、短内容再收缩，以及 workspace 的 auto-height 父级。全量收集为 638 例，其中布局文件 50 例；收集不是执行。候选的 build/tokens/typecheck/326 单元检查与双端正式 tarball 已通过（含独立类型、公开入口、React 单实例、原生零 React 和 gzip 门禁）。独立复核另发现 React 从 frame 查询 table 可能误取 feedback/toolbar 内嵌表格，已改为真实 TableContainer/Table 的直接 ref，并将内嵌反馈表格加入极端用例；最后引用修补后的 build/tokens/typecheck/326 单元已再次通过，构建指纹 `8c1693948732`。该最后修补没有再次重复本地全 tarball；最终新 SHA CI 必须重新验证完整 tarball 与真实浏览器，不能使用修补前的打包结果代替。本段不以旧 SHA 成功代替新修复验收。

已知边界：任意自定义的中间行可能比首末行更高，不保证每行都能完整同屏；通过表体滚动访问操作，长文档可用既有 document 或关闭 stickyHeader。用户电脑、真实产品、其它浏览器与生产部署仍未测试。


### 1764080 的真实 CI 回归与最小纠正

[CI 38302846000](https://github.com/coffeehc/xui/actions/runs/38302846000) 对 `176408042d602d178bc9b2dc64332d0c902db0fe` 执行了完整前置 build/tokens/types/326 单元/watch/双端 tarball/冷启动；浏览器 638 例中 602 通过、36 失败。失败全部来自 natural 布局：frame/footer 包含关系已成立，但列向 flex 根的 min-content 将完整表格高度作为最小值，压过 100% 上限，导致长表不再由 body 滚动。artifact 的默认桌面 20 行证据为父 content 高 558px、root/frame 高 1153px、body clientHeight 与 scrollHeight 同为 1098px；极端 200% 的 root/frame 高 17745px，body clientHeight 与 scrollHeight 同为 16620px。对照已通过的 workspace 同数据是 root/frame 558px、body clientHeight 503px 与 scrollHeight 1098px，footer bottom 779px 位于 frame bottom 780px 内。trace 同时记录了实测表体轨道下限 318px（实际列头 121px、边缘行 165px、scroll-padding 合计 32px），说明测量 owner 已正确输出，未收缩发生在列向 flex 根的内在尺寸传播。workspace/document、既有列宽和其它组件浏览器回归通过。

这是真实布局回归，不能修改断言掩盖。最小纠正仅将 natural 根切换为单列 Grid，保留自动行、100% 上限和内在下限；与已通过的 workspace 根约束路径一致，但不添加 workspace 的 token 伪元素，因此短内容仍由真实内容决定。原有 50 例几何/可交互矩阵保持不减弱，结构单测追加 natural 的 Grid 根门禁。新的源码检查与完整浏览器验收仍须跟随本次提交的 SHA，未通过前不关闭极端问题。

本次 Grid 根纠正已随共同工作树通过 build/tokens/typecheck/332 项单元（0 fail/skip），构建指纹 `8a60cd76d5b4`；其中包含由独立 owner 尚待提交的身份编码扩展，不将其变更或额外测试数误归入本表格提交。表格提交仅包含 CSS 根规则、对应结构门禁和本记录，完整 tarball/浏览器结果仍按精确提交 SHA 验收。


### c55a2ed / b539c04 二次同型失败与实测组件下限

[表格 CI 38305343634](https://github.com/coffeehc/xui/actions/runs/38305343634) 和 [整合身份 CI 38305391325](https://github.com/coffeehc/xui/actions/runs/38305391325) 均为 failure：638 项浏览器仍然是相同 36 项 natural 失败、602 通过。后者包含身份编码 `b539c043b3c578df26075b16b836d6a51541ec77`，332 单元、watch、正式双端 tarball（types/exports/peer/性能门禁）、cold-start 已通过。此结果明确否定“仅将根从 flex 换成 Grid 就能让 min-content 只代表可读下限”的上一轮推断；不能把失败归到认证，也不再靠该 intrinsic 关键字猜测。

本轮改为沿用同一布局 owner 直接计算：表体下限 B 是既有真实内容/可读边缘行高度的较小值；组件下限 C = B + 实际工具条/反馈/footer 高度 + frame 边框/内边距。只写表体 track 与组件根最小高度，不测宿主页头、不以已分配 root/frame 高度回算 C、不观察 root/frame 写入目标。normal natural 仍由 auto 高度与父级 100% 上限决定，只在 C 更大时以 min 的标准优先级完整撑起框并让祖先滚动；workspace 的最小值为原 token 与 C 的较大者；document 恢复原根值。取消 root/frame 的 min-content 及上轮 workspace 伪元素，避免完整 table 参与意外的根下限查询。

独立几何单测使用可变真实输入替身验证：内容封顶时不补短表空白；chrome 增减时 C 同步增减而不累计已有输出高度；替换输入节点后释放旧观察目标；layout 切换、隐藏恢复、RAF 去重、无变化不写和销毁恢复仍成立。数据、分页、宽度 API/probe/colgroup 不变。50 项真实浏览器矩阵不删减；仅 workspace auto 父级的下限读取改为根计算值，不依赖已移除的实现伪元素。仍需新提交 SHA 的完整 CI 验证普通长表仅 body 滚动、短表无空白、极端 footer 留框与实际首末操作点击。

本次实测组件下限候选已通过独立几何/设计门禁 19 项，以及 build/tokens/typecheck/334 项全量单元（0 fail/skip），构建指纹 `ff6cec46af27`。未再重复已知不允许的本地浏览器；本轮未重复本地完整 tarball，后续精确 SHA 的完整 CI 负责重验正式双端消费和全部 638 项真实浏览器。
