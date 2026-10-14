# 验证证据与限制

本页集中记录当前可复核的执行结果与验收边界；接口和设计合同分别由各能力文档与 [DESIGN.md](DESIGN.md) 维护。测试存在、收集成功、源码检查和实际浏览器通过分别陈述，不把历史全绿或局部复验当作当前完整验收。

## 代码验证基线

以下既有代码验证对应 package source generation `f56796bb2c862c8afa285a1713d1c8a476422b6040c8b1bde52bd05eb70051eb`，example generation `4dc78683af33237bdf7a87e8f7e23748ec4da8a960d16c491ad2b0b335600cf7`，日期为 2026-10-14。后续文档整理未修改组件实现与受控主题 CSS，未因文档变更重跑 build 或完整功能测试；上述 generation 仅标识下方受测代码/产物，不能作为当前文档修改后的新构建指纹。

| 门禁 | 已执行结果 | 证据范围 |
| --- | --- | --- |
| dev-build | 通过 | 正式包与开发示例构建，包含类型检查 |
| check:tokens | 通过，372 tokens | 当时 283 文件、2176 声明；规范/生成 CSS、依赖与来源检查 |
| typecheck | 通过 | 当时根类型检查 |
| unit | 468/468 通过 | 当时完整单元套件 |
| 正式 consumer | 通过 | React/原生独立 tarball、公开 ESM/CSS/types、peer 与既有体积门禁 |
| watch | 1/1 通过，145.4 秒 | 同一代际的真实重建、错误与恢复 |
| cold-start | 1/1 通过 | 当时合成 Vite 消费者的冷启动 |

本次纯文档/引用治理检查文件与锚点、公开入口、来源元数据及相关静态规则，实际命令结果在交付中说明。未触及组件实现、样式、tokens、导出、行为或包配置。体积预算由 [scripts/consumers.mjs](../scripts/consumers.mjs) 内常量执行，运行快照写入 `.artifacts/performance-baseline.json`；本页不维护另一份预算或把合成消费者的包体门禁等同产品 LCP/INP。

## Chromium 浏览器结果

| 运行 | 实际结果 | 原始证据 |
| --- | --- | --- |
| 完整 Chromium 主运行 | 1347/1355 通过，8 失败，约 14.9 分钟 | `.artifacts/browser-final-4dc/` 的报告、截图与 trace |
| 首轮相关 targeted 复验 | 17/19 通过，两个 native locator 零匹配 | `.artifacts/browser-targeted-final-4dc/` |
| locator 修订后复验 | React/native token-scaling、widgets 4/4 通过 | `.artifacts/browser-locator-final-4dc/` |
| 最终 Precision 截图 | 8/8 通过，16 PNG + 16 JSON | `.artifacts/precision-theme-evidence/screenshots/` |

最终截图覆盖 Precision DataTable 与基础 `/react/` 页的 light/dark，以及 AdminSetup 两端桌面和 390px、根字号 200% 的末字段/主动作焦点。主运行还通过 DataTable width 44 项、caption/frame/footer 36 项、feedback 10 项和 workspace composition 4 项；这些只证明列出的合成合同，不代表所有组件状态和产品布局已逐条验收。

八个原始失败标题各有对应 targeted 通过证据，最后测试编排修订后没有再跑完整 1355 项。不得把分次复验合并改写为“1355/1355 完整套件全绿”。另一次误启动的 full suite 约 25 秒后以 SIGINT 中止，不计结果。

## 失败复验与限制

- Bearer 预算用例在主运行中超时；示例预算为 1000ms，库默认 15 秒，隔离重跑 1/1 通过、约 840ms。根因未证实，不能声称代码已修复某个确定超时根因。
- React dark 的真实 200% 用例已完成所有断言，在 persistent context.close 时超时；隔离用例约 5.2 秒通过，相关真实 200% 矩阵 12/12 通过。关闭超时根因未证实。
- React/native 两个短窗口 touch fixture 的物理 Chrome 窗口为 500×320，实际输入 surface 高 233px，gesture y=256 超出输入面；独立纯 overflow 对照同样失败。fixture 仅用 Browser.setWindowBounds 将物理窗口调整为 800×900，CSS viewport 仍为 390×320；双端真实 touch 滚动、Save 点击、DOM identity/focus 检查 2/2 通过，未改生产 CSS。
- token-scaling 与 widgets 各自 React/native 共四个失败源于新增 stacked InputGroup 后旧全局 locator 歧义。首轮修订仍有两个 native 零匹配；随后按具名 search textbox 所属 InputGroup 定位，4/4 通过。保留原交互、样式与几何断言，未通过放宽合同使测试变绿。

## 认证页验收

以下是登录、AuthPage 与 AdminSetupPage 的持续验收目标，不是逐项完成表。尺寸和具体 token 以 [DESIGN 的认证布局](DESIGN.md#公共登录页布局与主题) 为准，接口和生命周期见 [登录与会话](PUBLIC_API.md#认证会话)，新密码规则见 [密码输入](COMPONENTS.md#密码输入)。

| 范围 | 需要的可观察证据 |
| --- | --- |
| 居中单列与品牌层级 | React/native、light/dark/system、宽屏与 390/320px；card 自然高，fullscreen 保留同一窄列；品牌、任务标题、说明、字段、唯一主动作和局部反馈顺序清楚，无第二品牌面板 |
| 字段与主动作 | 常显 label、准确关联、统一文字/控件 token；字段和主动作对齐，末字段至主动作之间无空反馈或隐藏按钮占位 |
| 空与长反馈 | 空/hidden feedback、feedbackActions 不占位；消息位于主动作后自然增高，错误首尾及 unknown 关键后果完整可读，不固定轨道、裁切或把必要摘要藏进详情 |
| 状态稳定 | checking/idle/busy/error 不重挂字段、按钮与核心布局节点，不清普通输入；字段与主动作尺寸、相对顺序保持，卡片可因真实消息增长重新居中；密码按生命周期及时清理 |
| 直接登录 | 一次明确 POST，无恢复预请求/持久门禁；busy 禁重复且无取消入口，扩展等待也不自动生成取消；未知结果普通 refresh/session 核验一次，未确认结束 busy 可手动再试，不重发写入 |
| 导航 | 确认 authenticated 且所属等待结算后一次进入宿主目标；StrictMode、重复通知与同 ID 新对象不重复导航；失败仅局部重试打开目标，不重做认证；卸载/pagehide 拒绝迟到结果 |
| 短视口与长内容 | 文档自然滚动到每个字段、动作和错误；超长主按钮保留完整名称与内部滚动；不以固定表单高度或缩字号处理 |
| 焦点与输入 | 实际 Tab/Enter/Space、SSO 与辅助动作顺序、无隐藏 Tab 停靠、四边 focus 像素；根字号 200% 与真实浏览器 Page zoom=200% 分别验证，记录实际中文字体 |
| 初始化 | 三字段 setup 复用同一布局，动态更新保持 DOM、值、事件和焦点；unknown 锁写、必要后果全文、完成只提示去登录，零自动认证请求 |
| 正式消费 | 仅使用公开 exports/CSS/types 与同代际产物，检查 owner、取消/迟到、卸载清理；按实现影响执行适用构建、单测、consumer 与浏览器门禁 |

可执行入口包括 [login-visual](../tests/browser/login-visual.spec.mjs)、[auth-page](../tests/browser/auth-page.spec.mjs)、[login-navigation](../tests/browser/login-navigation.spec.mjs)、[auth-feedback-readable](../tests/browser/auth-feedback-readable.spec.mjs) 与 [admin-setup](../tests/browser/admin-setup.spec.mjs)。截图和实测 JSON 应通过 testInfo.outputPath 保存并附加，实际查看构图、长文、裁切与焦点；computed style 或用例数量不能代替视觉审查。

## 验收范围与未完成项

规范/变量/基础样式、基础组件、交互组件、组合与通用页面按同一候选逐层验收。当前有上述构建、自动测试与截图证据，但 DESIGN 仍有未逐条闭环的合同：不能由生成器通过推断每个 token 的实际绘制正确，也不能由一个族或页面的绿色结果宣布其余全部状态完成。ThemeController 只公开 light/dark/system，没有已发布的 styleId/profile 注册表或风格切换 API。

本次浏览器实测仅 Chromium；Firefox/WebKit、真实 OS 输入法、读屏器、自动填充/密码管理器、移动键盘及系统文件/日期/颜色窗口仍未实测。真实 BFCache 命中、所有 OS 缩放、实际 Wails/Electron/embed 窗口与 bridge IO 也未由合成生命周期或浏览器 fixture 证明。

合成 fetch/数据和共享 wire fixture 不证明真实后端事务、数据库 COUNT、Cookie/CSRF/权限/tenant/脱敏、真实产品页面、生产性能、发布或部署通过。外部产品的结果不能替代本仓库验收。后续实现变更须核对新的 source/example generation，按受影响合同补证；若需要完整套件结论，应独立执行完整浏览器套件并报告真实结果。
