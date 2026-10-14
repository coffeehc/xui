# 验证证据与限制

本页集中记录当前可复核的执行结果与验收边界；接口和设计合同分别由各能力文档与 [DESIGN.md](DESIGN.md) 维护。测试存在、收集成功、源码检查和实际浏览器通过分别陈述，不把历史全绿或局部复验当作当前完整验收。

## 基础层逐项收口（2026-10-14）

本轮只处理基础主题、控件与交互原语；DataTable、业务导航、认证、API Key 和其他页面组合不在本轮改造范围。它们所在示例仅作为公共基础 CSS 的真实消费载体，不能据此宣布上层组合或产品页面完成。下面以组件族列出逐项核对范围；不适用的交互状态不添加到被动组件上。

| 基础组件 | 逐项核对的合同与证据入口 |
| --- | --- |
| 主题、文字尺度与基础布局 | 默认深色、light/dark/system、语义覆盖、rem/独立文字比例、根字号 200%、长中文；`token-scaling`、`input-typography-contract`、`layout-typography`、`ui` |
| Button / IconButton / 链接变体 | xs/sm/default/lg、六种变体、鼠标/键盘按压、busy 与 disabled 分离、disabled+selected、焦点、品牌覆盖；`button-size-contract`、`button-state-contract`、`button-brand-inheritance` |
| Field / Fieldset / Input / Textarea | label/help/error 关联、错误+焦点、禁用错误边界、只读选择与复制、真实表单值与输入事件；`input-foundation-contract`、`foundation-contract` |
| Checkbox / Radio / Switch / 成组选项 | 真实 checked/mixed、受控变化、只读、禁用、错误+焦点、各尺寸、forced-colors；`choice-state-contract`、`choice-group`、`native-controls-audit` |
| InputGroup / SearchInput / NumberInput / 密码输入 | 单边框、外高对齐、前后缀/动作、草稿/重置/IME、密码显隐和清理、本地强度；`foundation-closeout`、`text-inputs`、`password-fields`、`password-strength` |
| SimpleSelect / Select / Combobox / Command 基础选择 | 公开封装与平台边界、选中/活动项分离、错误/空结果、禁用、键盘选择、碰撞与回焦点；`select-form`、`composition-select`、`selection-state-contract`、`widgets` |
| ToggleGroup | 独立紧凑高度、主题覆盖、选中+hover/焦点、禁用、键盘与 forced-colors 选中识别；`foundation-closeout`、`design-state-regressions`、`widgets` |
| Calendar | 日期/范围、locale、方向键与月份边界、禁用日期只读不可选、选中+hover、forced-colors；`widgets`、`foundation-closeout` |
| Tabs | 选中+hover、禁用跳过、方向/边界、取消回调、关联 panel；`peer-contract`、`ui` |
| Accordion / Disclosure | 单开/多开/受控、禁用、键盘、展开指示、隐藏后焦点不可进入、卸载清理；`widgets`、`foundation-contract` |
| Typography / Separator | 语义级别与视觉角色分离、技术文本 mono/tabular、长文、独立分隔线变量、装饰语义；`display-foundation-contract`、`separator-design-contract`、`foundation-closeout` |
| Surface / Section / Container / Stack / Grid / Toolbar | 单层表面、无装饰阴影、容器换行与字段对齐、文字放大、焦点绘制；`display-foundation-contract`、`layout-typography`、`focus-boundaries` |
| Badge / Tag / Copyable | 被动状态无额外交互、语义色、长值可读、移除意图与后续焦点、复制失败/串行/迟到隔离；`feedback-foundation-contract`、`media-foundation-contract`、`display`、`foundation-closeout` |
| Avatar / Image | 替代文字、加载/失败/回退、固定资源框、迟到资源隔离、显式重试、被动语义；`media-foundation-contract`、`display`、`widgets` |
| Alert / LoadingState / EmptyState / ErrorState | 真状态与局部反馈、必要错误全文可读、恢复入口、无重复警报；`feedback-foundation-contract`、`native-controls-audit` |
| Skeleton / Spinner / Progress | pending 与确定进度区分、真实绘制、accessible name、reduced-motion/forced-colors；`feedback-foundation-contract` |
| ScrollArea | 独立滚动、首/中/末控制项 Tab 与 Shift+Tab、四边焦点、草稿保留、窄屏与根字号 200%；`foundation-closeout`、`focus-boundaries` |
| Table 原语 / SortButton / ExpandButton / TableActions | 表头/正文独立文字角色、不透明行/固定列、禁用不出现按压反馈、操作布局；`table-design-contract`、`table-actions`、`widgets`、`foundation-closeout` |
| NavItem / Breadcrumbs / Pagination 原语 | 原生链接/表单语义、选中与焦点独立、禁用、键盘边界；`ui`、`peer-contract`、`foundation-contract` |
| Menu / ContextMenu | overlay/边界/圆角、checkbox/radio 状态、禁用、方向键/子菜单、鼠标打开后首次键盘焦点、pointer/blur/卸载清理、Esc/回焦点；`menu-design-contract`、`context-menu-keyboard`、`context-submenu` |
| Dialog / AlertDialog / Sheet | 宽度/边距、长标题/正文、正常 body 滚动和极端高度整体滚动、限制/恢复焦点、关闭/取消、真实 touch；`dialog-readability`、`responsive-overlays`、`focus-boundaries`、`peer-contract` |
| Popover / Tooltip / Toast | 非模态边界、锚点/碰撞、键盘帮助、关联描述、外点/Esc/关闭、portal 主题；`foundation` 的浮层专项、`ui`、`widgets` |

本轮修正 ToggleGroup 误用普通按钮高度、InputGroup 重复计算外框高度、Calendar 与表格排序按钮的禁用按压反馈；补充 Calendar/Toggle 的强制颜色选中标记、长 Badge 换行和技术文本等宽数字声明。Firefox 的菜单从鼠标转到键盘时可能保持 `:focus-visible=false`，现由共享绑定只投影真实键盘焦点，React/原生自动接入，不移动焦点或改变选择。集中规范更新为 0.9.0，新增三个派生变量，共 375 个 tokens；两个原始设计来源及历史合同指纹保持原样。

最终候选的 package source generation 为 `c405716680c18d9a33ac0f9e7dbc8a3cc15bf86c644bd0229fecba8220177069`，开发示例 generation 为 `9d7948bc82bbe32e9b5d7a2dd4cb5fb5d48f91291addc2f4589b3f5fe15dacf0`。三个包的 `dist/build.json` 指纹一致，正式 consumer 随后从本代际 tarball 生成浏览器消费 fixture。环境为 macOS Darwin 25.5.0 / arm64、Node 26.7.0；Chromium 156.0.8078.4、Firefox 157.0、WebKit 27.2。实际中文字体为 PingFangSC-Medium（label）和 PingFangSC-Semibold（heading）。环境快照为 `.artifacts/foundation-environment.json`。

| 已执行门禁 | 结果与代际 | 原始证据 |
| --- | --- | --- |
| dev-build / tokens / typecheck | 最终候选通过，375 tokens；231 文件、2185 声明与来源检查 | `.artifacts/foundation-final-dev-build.log`、`.artifacts/foundation-closeout-validation.log` |
| 单测 / 正式 consumer | 最终候选 469/469 单测通过；React/原生 tarball、公开 ESM/CSS/types、peer 与 gzip 门禁通过 | `.artifacts/foundation-closeout-validation.log` |
| 文档 / diff | 10 文件、576 引用、97 公开入口、1 skill 与 diff 检查通过 | 同上 |
| Chromium 基础主运行 | 菜单修复前的候选 `7baeaf8b7af4b0567046295e29786aca8b534c4020c21ec42448c692b6ac95d9`，35 文件 510/510 通过，无跳过或 flaky | `.artifacts/foundation-chromium.json`、同名日志与输出目录 |
| Chromium 测试编排复验 | 同一基础实现：ScrollArea/Display 24/24、Feedback 18/18 通过 | `.artifacts/foundation-chromium-fixture-final.json`、`.artifacts/foundation-chromium-feedback-final.json` |
| Chromium 最终菜单复验 | 最终候选 23/23 通过，包含 Menu 主题、首次 Home、pointer/blur 清理、ContextMenu 受控/取消/嵌套/子菜单 | `.artifacts/foundation-menu-chromium-pass.json` |
| Firefox / WebKit 菜单复验 | 最终候选各 18/18 通过 | `.artifacts/foundation-menu-cross-pass.json` |
| Chromium 浮层与叠层复验 | 最终候选 6/6 通过：Popover/Tooltip/Toast、Sheet/AlertDialog 叠层和 ContextMenu | `.artifacts/foundation-floating-layers-final.json` |
| Firefox 基础专项 | 最终候选 21 文件 240/240 通过，无跳过或 flaky；覆盖按钮、选项、输入、显示、反馈、媒体、选择、菜单、密码、表格原语及 widgets | `.artifacts/foundation-firefox-complete.json` |
| WebKit 几何、滚动与菜单专项 | 最终候选 23/23 通过：新增基础收口 18 项及 ContextMenu 键盘/子菜单 5 项 | `.artifacts/foundation-webkit-complete.json` |
| watch / cold-start | 最终候选各 1/1 通过，watch 128.2 秒；隔离副本验证真实重建/失败恢复与 Vite 冷启动 | `.artifacts/foundation-watch-accepted.log`、`.artifacts/foundation-cold-start-accepted.log` |

新增 `foundation-closeout` 在 React/原生、light/dark/system 下检查默认与覆盖后的控件外高、1280/390px 和根字号 200%、禁用鼠标命中、真实键盘选择、强制颜色以及独立滚动区域首/中/末控件四边焦点。已查看深浅主题和窄屏放大截图；未以缩小字号或放宽裁切断言解决问题。WebKit 原生完整控件遍历使用平台 Option+Tab；焦点滚动等待实际渲染帧后再测量。

跨浏览器复验同时修正两处测试编排：Display 从确定的前置控件开始真实 Tab，避免依赖浏览器末尾回绕；Progress 的历史空白截图按其自身系统底色判定，当前截图仍与当前引擎的 Canvas 比较，保留真实边界、填充、静止和空白反例断言。菜单修复前的 Firefox 失败运行，以及 consumer fixture 尚未生成时的 404/中断运行均保留日志，不计作通过。上表分次结果不能相加为完整浏览器套件总数；历史认证、DataTable 与业务组合不由本轮推断完成。

## 先前代码验证基线

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

先前纯文档/引用治理检查文件与锚点、公开入口、来源元数据及相关静态规则，实际命令结果在交付中说明。未触及组件实现、样式、tokens、导出、行为或包配置。体积预算由 [scripts/consumers.mjs](../scripts/consumers.mjs) 内常量执行，运行快照写入 `.artifacts/performance-baseline.json`；本页不维护另一份预算或把合成消费者的包体门禁等同产品 LCP/INP。

## 先前 Chromium 浏览器结果

| 运行 | 实际结果 | 原始证据 |
| --- | --- | --- |
| 完整 Chromium 主运行 | 1347/1355 通过，8 失败，约 14.9 分钟 | `.artifacts/browser-final-4dc/` 的报告、截图与 trace |
| 首轮相关 targeted 复验 | 17/19 通过，两个 native locator 零匹配 | `.artifacts/browser-targeted-final-4dc/` |
| locator 修订后复验 | React/native token-scaling、widgets 4/4 通过 | `.artifacts/browser-locator-final-4dc/` |
| 最终 Precision 截图 | 8/8 通过，16 PNG + 16 JSON | `.artifacts/precision-theme-evidence/screenshots/` |

最终截图覆盖 Precision DataTable 与基础 `/react/` 页的 light/dark，以及 AdminSetup 两端桌面和 390px、根字号 200% 的末字段/主动作焦点。主运行还通过 DataTable width 44 项、caption/frame/footer 36 项、feedback 10 项和 workspace composition 4 项；这些只证明列出的合成合同，不代表所有组件状态和产品布局已逐条验收。

八个原始失败标题各有对应 targeted 通过证据，最后测试编排修订后没有再跑完整 1355 项。不得把分次复验合并改写为“1355/1355 完整套件全绿”。另一次误启动的 full suite 约 25 秒后以 SIGINT 中止，不计结果。

## 先前失败复验与限制

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

基础层的逐项范围与当前执行结果见本页首节；组合与通用页面继续按同一候选逐层验收，本轮没有逐条验收其全部合同。不能由生成器通过推断每个 token 的实际绘制正确，也不能由基础层或某个合成页面的绿色结果宣布其余产品页面完成。ThemeController 只公开 light/dark/system，没有已发布的 styleId/profile 注册表或风格切换 API。

本轮跨引擎结果仅覆盖首节明确列出的专项，不代表三引擎运行了相同的全部用例。真实 OS 输入法、读屏器、自动填充/密码管理器、移动键盘及系统文件/日期/颜色窗口仍未实测。真实 BFCache 命中、所有 OS 缩放、实际 Wails/Electron/embed 窗口与 bridge IO 也未由合成生命周期或浏览器 fixture 证明。

合成 fetch/数据和共享 wire fixture 不证明真实后端事务、数据库 COUNT、Cookie/CSRF/权限/tenant/脱敏、真实产品页面、生产性能、发布或部署通过。外部产品的结果不能替代本仓库验收。后续实现变更须核对新的 source/example generation，按受影响合同补证；若需要完整套件结论，应独立执行完整浏览器套件并报告真实结果。
