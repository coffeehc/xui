# 验证证据与限制

本页集中记录当前可复核的执行结果与验收边界；接口和设计合同分别由各能力文档与 [DESIGN.md](DESIGN.md) 维护。测试存在、收集成功、源码检查和实际浏览器通过分别陈述，不把历史全绿或局部复验当作当前完整验收。

## 完整浏览器套件复验（2026-10-15）

最终候选按仓库默认 Chromium 配置完整执行 **77 文件、1389/1389 项通过**，耗时 765.2 秒（12.8 分钟）。2 workers、0 retries，无过滤、跳过、flaky 或运行错误；不是分批或重复专项拼出的整轮结果。package source generation 为 `6c592e6cc54e020c35314d1accce844ccb2b3e531231a315f80834b0e1e62fbe`，example generation 为 `250f6b2d697271a4a4facde722992b368f93308f6b2b9351cfbc01ccc1a17897`；三包产物与正式 tarball consumer 同代际。环境与下方组合验收一致。

本轮修复共享 Dialog 迟到 close 重复恢复焦点的问题：确认关闭动作内只恢复一次，关闭返回后保留宿主新焦点，同时保留 Safari 原生回焦点、restoreFocus、重入与叠层边界。NumberInput 的后续 input 取消旧 reset 协调，双端新增同一任务内重置后立即输入的回归，保留新草稿及有效性，不提交或改写确认值。

Command 用例将原有空项循环断言放在纯键盘阶段，悬停验证后移开鼠标并从无高亮的新查询重新进入，继续核对选择、hover、失焦与键盘焦点，避免焦点滚动产生的 pointerleave 与方向键竞争；没有修改组件行为或减少原断言。文本输入用例移除重复的 Chromium 专属启动配置，沿用项目选择的真实引擎。

| 最终执行 | 已完成结果 | 原始证据 |
| --- | --- | --- |
| 构建 / tokens / types / unit / consumer | 通过；376 tokens、475/475 单测；公开 ESM/CSS/types、双端消费与既有体积预算通过 | `.artifacts/browser-full-race-build.log`、`-tokens.log`、`-typecheck.log`、`-unit.log`、`-consumer.log` |
| 完整 Chromium 套件 | 1389/1389，77 文件；原 Dialog、NumberInput、Command 失败及新增回归均在整轮通过 | `.artifacts/browser-full-final-6c.json`、同名日志、`-list.log`、`-output/` |
| Chromium Command 重复专项 | 双端各 20 次，共 40/40，无重试 | `.artifacts/browser-full-command-stable-repeat.json`、同名日志 |
| Chromium 数值 reset 重复专项 | 双端原重置及新增竞争用例各 10 次，共 40/40，无重试 | `.artifacts/browser-full-number-race-repeat.json`、同名日志 |
| Firefox / WebKit 数值与 Command 专项 | 共 12/12；使用各自真实引擎，无跳过、重试或 flaky | `.artifacts/browser-full-number-command-cross-final.json`、同名日志 |
| 文档链接 / 差异检查 | `node scripts/check-docs.mjs`、`git diff --check` 通过 | `.artifacts/browser-full-final-6c-docs.log`、`-diff-check.log` |

Dialog 修复后、数值输入修复前的候选 `cfe37756f06a04dc03bbf4721397c87da7095b08c007f6190be0c7be1a0b76e4`，另完成 Firefox/WebKit 焦点与组合 20/20、关闭路径 32/32 专项；覆盖宿主路由焦点、Key 写入中关闭、secret 清理、日志读取中关闭、窄屏键盘与迟到隔离。证据为 `.artifacts/browser-full-fixed-closeout-cross.json`、`.artifacts/browser-full-fixed-close-flows-cross.json` 及同名日志。这些是受影响路径补充验证，不是 Firefox/WebKit 完整套件结论。

前两轮完整执行均保留失败证据：基线 `b4b9f3631654d0c8ac22a26c01d5ab8d452e89f1` 为 1386/1387（810.3 秒），暴露 Dialog 迟到关闭覆盖宿主焦点；Dialog 修复候选为 1385/1387（777.0 秒），原失败已通过，新增发现数值 reset 竞争及 Command 混合输入测试竞争。分别见 `.artifacts/browser-full-b4b9.json`、`.artifacts/browser-full-fixed-final.json` 与同名日志、输出目录；不把它们计作完整通过。

## 组合组件与公共页面逐项收口（2026-10-14）

承接下方基础层验收，本轮核对仓库已经公开的组合、通用页面与双端参考消费者。颜色、字体、密度、发丝线、焦点和状态继续消费同一 DESIGN 主题；产品私有组合及实际后端不属于本轮范围。

| 组件族 / 页面 | 本轮核对的设计与交互合同 | 浏览器证据入口 |
| --- | --- | --- |
| AppHeader / HeaderBrand / 主题与语言工具 | 品牌与任务层级、紧凑工具间距、同一控件尺寸、窄屏换行、主题浮层和焦点 | `header-compact`、`header-controls`、`header-popup-brand` |
| AppShell / MenuLayout / NavigationMenu / SidebarFooter | 选中与焦点独立、折叠菜单、窄屏抽屉、富导航、页脚和滚动归属 | `menu-layout`、`nav-contract`、`rich-navigation`、`sidebar-footer` |
| Workspace / PageHeader / 页面插槽 | document/workspace 显式边界、自然页头和工具栏、正文占余高、空插槽不占位 | `workspace-layout`、`workspace-composition-contract`、`layout-typography` |
| SearchToolbar / GroupedCombobox | 主查询先行、附加筛选收起、长值与窄屏、IME/草稿与真实键盘选择 | `search-toolbar`、`grouped-search` |
| MetricCard | 单层 Surface、被动名称/值语义、mono/tabular 数字、宽标记换行而不挤成竖排、宿主更新 | `metric-card`、`composition-closeout` |
| DataTable / 内置筛选与分页 | 默认铺满、显式列宽作下限、表内横滚、单框三轨、页脚自然高、长/空/少量数据、受控 offset/cursor、刷新保留焦点 | `data-table`、`data-table-widths`、`data-table-layout`、`data-table-caption-shape`、`data-table-feedback`、`data-table-cursor`、`data-table-focus` |
| AuthPage / LoginPage / AdminSetupPage | 单列紧凑表单、密码强度条、提交时错误、空反馈无占位、busy 禁重复、无登录取消、明确导航和密码清理 | `auth-page`、`auth-visual-system`、`auth-feedback-readable`、`login`、`login-layout`、`login-visual`、`login-extensions`、`login-navigation`、`auth-bearer`、`admin-setup` |
| ApiKeyManager | 名称与真实状态前置、刷新/创建归页头、轻量行操作、表内完整元数据、一次性 secret、局部错误、显式复制/写入核验 | `api-key`、`api-key-v2`、`composition-closeout`、`dialog-readability` |
| BusinessLogExplorer | 摘要/结果前置、双端同一筛选 Disclosure、操作人/动作/时间不逐字折行、快照分页、按需详情 | `business-log`、`composition-closeout` |
| StructuredLogExplorer | 摘要/等级前置、累计与命中数区分、精确时间/计数、分组与观察切换、详情权限和保留期事实 | `structured-log`、`composition-closeout` |
| 表单 / 列表 / 详情参考页与局部反馈 | 公共组件构成任务顺序、准确可访问名称、错误完整可读、显式重试与迟到隔离、无闲置反馈空白 | `foundation`、`error-layout`、`http`、`capabilities`、`dom-id` |
| 上述组合中的 Dialog / Sheet | 窄屏/长文/根字号 200%、关闭后回到所属动作、浏览器原生回焦点与宿主新焦点分离 | `responsive-overlays`、`focus-boundaries`、`peer-contract`、`composition-closeout` |

本轮修正三类记录页的重复可见表题、空反馈占位、行操作权重和窄屏逐字折行；记录主列显式消费派生变量，其他元数据在表内横滚，详情标识符和时间使用技术文字角色。MetricCard 宽标记优先换行。原生详情先关闭再隐藏内容；共享 Dialog 识别 Safari 原生恢复到打开前容器的行为，继续尊重新的宿主焦点、恢复策略和叠层边界，并将 macOS Option+Tab 纳入同一模态焦点循环。没有增加查询、认证或写入 owner。规范为 0.10.0、376 tokens，新增变量只从既有字段尺度派生。

最终 package source generation 为 `25b3c7ca1b2828005d4e94cd893e486d67aa4d42bf68e85c5ee5a056a71da727`，example generation 为 `250f6b2d697271a4a4facde722992b368f93308f6b2b9351cfbc01ccc1a17897`。三包产物与正式 tarball consumer 使用同代际；环境沿用下方基础验收的 macOS、Node、三引擎及字体版本。

| 已执行门禁 | 结果与代际 | 原始证据 |
| --- | --- | --- |
| 最终构建 / tokens / types / 正式 consumer | 通过；376 tokens、231 文件、2191 声明；公开 ESM/CSS/types、双端 lazy worker 与布局门禁通过；critical CSS gzip 为 16384 bytes，未提高原 16384-byte 预算 | `.artifacts/composition-build-closeout-pass.log`、`.artifacts/composition-release-gates.log`、`.artifacts/performance-baseline.json` |
| 最终完整单测 | 473/473 通过，含原生回焦点、保留新宿主焦点、禁用恢复策略与 Option+Tab 双向边界四个新增回归 | `.artifacts/composition-release-gates.log` |
| Chromium 组合与页面主运行 | 首轮候选 `51f7c5b89a30f91968db56bcfaca77ec3f35c12459b406cca6d5f2af065b4056`，39 文件 879/881 通过；两项失败为改列序后旧最近使用列索引 | `.artifacts/composition-chromium-main.json`、同名日志 |
| Chromium 表格与记录页复验 | 后续候选 `585be26c3a81e2b5dbcab5a6245d43068e6afe05b933f5a9807b06a37bda3097`，9 文件 172/172 通过；包括两项改用具名表头定位后的原断言，以及三轨/分页回归 | `.artifacts/composition-chromium-affected-final.json`、同名日志 |
| 最终 Chromium 记录页与指标卡 | API Key v1/v2、两类日志与 MetricCard，5 文件 62/62 通过 | `.artifacts/composition-release-business-chromium.json`、同名日志 |
| 最终 Chromium 共享交互与 Dialog | 33/33 通过；foundation 浮层键盘交互、peer finalFocus、响应式 Dialog/Confirm/Sheet、长警告与原生 Dialog 焦点/滚动边界 | `.artifacts/composition-release-dialog-chromium.json`、同名日志与用例清单 |
| 最终 Firefox / WebKit 功能回归 | 各 68/68 通过，无跳过或 flaky；API Key v1/v2、两类日志、MetricCard、长警告，覆盖真实键盘、提交/取消、读取失败与迟到清理 | `.artifacts/composition-release-functional-cross.json`、同名日志 |
| 最终关键设计专项 | Chromium 8/8、Firefox 8/8、WebKit 8/8；React/原生、light/dark/system、1280/390px、根字号 200% 关闭回焦点、元数据单行与 MetricCard 宽标记 | `.artifacts/composition-release-closeout-chromium.json`、`.artifacts/composition-release-closeout-cross.json`、对应截图目录 |
| 最终 watch / cold-start | 各 1/1 通过；watch 约 148 秒，隔离副本检查真实重建/失败恢复与 Vite 冷启动 | `.artifacts/composition-release-watch.log`、`.artifacts/composition-release-cold-start.log` |

已查看最终三类记录页的深浅主题和窄屏截图，以及填充完成的 DataTable、紧凑认证页、长标记 MetricCard 和日志详情构图。首轮 WebKit 原生回焦点、Option+Tab 越界及 CSS 超预算候选的失败日志保留，均不计作通过。跨引擎遍历采用平台真实按键，WebKit 用 Option+Tab；仍断言准确控件顺序、循环与回焦点，不直接设置后续焦点或接受窗口外焦点。上表分次运行不能相加为完整套件全绿；未受影响的族使用主运行证据，最终受影响范围单独复验。

## 基础层逐项收口（2026-10-14）

基础层这一轮只处理基础主题、控件与交互原语；DataTable、业务导航、认证、API Key 和其他页面组合不在当时改造范围。它们所在示例仅作为公共基础 CSS 的真实消费载体，不能据此宣布上层组合或产品页面完成。下面以组件族列出逐项核对范围；不适用的交互状态不添加到被动组件上。

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

以下是登录、AuthPage 与 AdminSetupPage 的持续验收合同；本轮执行结果见首节的组合组件验收。尺寸和具体 token 以 [DESIGN 的认证布局](DESIGN.md#公共登录页布局与主题) 为准，接口和生命周期见 [登录与会话](PUBLIC_API.md#认证会话)，新密码规则见 [密码输入](COMPONENTS.md#密码输入)。

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

基础层、组合与通用页面的逐项范围及分次执行结果见本页对应章节；验收结论只覆盖表中列出的设计和交互合同。不能由生成器通过推断每个 token 的实际绘制正确，也不能由公共组件或合成页面的绿色结果宣布其余产品页面完成。ThemeController 只公开 light/dark/system，没有已发布的 styleId/profile 注册表或风格切换 API。

跨引擎结果仅覆盖对应章节明确列出的专项，不代表三引擎运行了相同的全部用例。真实 OS 输入法、读屏器、自动填充/密码管理器、移动键盘及系统文件/日期/颜色窗口仍未实测。真实 BFCache 命中、所有 OS 缩放、实际 Wails/Electron/embed 窗口与 bridge IO 也未由合成生命周期或浏览器 fixture 证明。

合成 fetch/数据和共享 wire fixture 不证明真实后端事务、数据库 COUNT、Cookie/CSRF/权限/tenant/脱敏、真实产品页面、生产性能、发布或部署通过。外部产品的结果不能替代本仓库验收。后续实现变更须核对新的 source/example generation，按受影响合同补证；若需要完整套件结论，应独立执行完整浏览器套件并报告真实结果。

## 2026-10-15 公共交互扩展验收

本轮从已验收的 7f7da180e4b29f872b0c79c6f989fb6edbe3d9f2 核对，实施前 main 为 17f202d，相关包实现无差异。仅修改 xui。所有新增消费者均通过独立 tarball 安装正式 ESM/CSS/types，原生不引入 React；不使用源码 alias 或私有 CSS。下列结果是库级正式消费者验收，不代表 xAgent 已升级或完成产品联调。

| 能力 | 最终通过证据 | 范围 |
| --- | --- | --- |
| Calendar 受控月份 | model 16/16、calendar-month 与既有 widgets Calendar 浏览器 19/19；Chrome 真正 200% 缩放 6/6 | single/range、绝对定位、受控接受/拒绝、跨年/闰年、disabled、locale、焦点、浅/深/system、1280/390px、200% 根字号；真实缩放使用 Chrome 设置并校验 DPR×2、视口减半、根字号不变、CSS zoom=1/pinch=1 |
| Menu / ContextMenu danger | 菜单相关 unit 18/18、正式消费者浏览器 53/53、Chrome 真正200%缩放 6/6 | 普通/hover/pressed/keyboard focus/disabled；浅/深/system及系统实时切换、长中文、1280/390px、200%文字、弹层滚动、禁用Enter/Space不执行、关闭与回焦点 |
| DataTable rowEvents | 相关 unit 37/37、正式消费者浏览器 122/122、Chrome 真正200%缩放 6/6 | 双击一次、当前记录/稳定键/索引、排序/更新/cursor、cell控件隔离、busy/disabled、回收监听、空表/刷新保行、selected/expanded、长中文、浅/深/system、1280/390px、200%文字、横滚/sticky及键盘等价动作 |

构建、typecheck、check:tokens、check-docs 与 test:consumer 均通过。原生示例第一轮因 select 绑定转移 id 后误读 trigger、system 断言误认 data-theme 的失败已修正，最终复验通过；失败不计作通过。浏览器 JSON 保存于 .artifacts/calendar-month-browser-final.json 和 .artifacts/calendar-month-zoom-final.json。月份 API 未传时兼容原非受控行为，日期语义保持 ISO 公历与 UTC 字段。

本轮浏览器为真实 Chromium；其他浏览器、读屏器及宿主产品现场未由这些结果推断通过。

菜单证据保存于 .artifacts/menu-danger-browser-final.json 与 menu-danger-zoom-final.json，实际查看浅色桌面及深色390px截图。首轮新测试错误地要求Base UI跳过禁用项和ContextMenu首次ArrowDown直达第二项，已按peer真实合同改为准确Home/Arrow导航和零执行断言；53/53为修正后的复验。正式消费者初始CSS包含critical与floating，原16384 gzip字节已满，完整危险状态增加56字节至16440；该项上限显式调整为16512，Button/JS等其余预算不变，所有预算仍强制验证。

DataTable证据保存于 .artifacts/row-events-browser-final.json 与 row-events-zoom-final.json，实际查看深色390px和表头键盘焦点截图。122项包含新增行事件与既有cursor/layout/focus/widths回归；未传rowEvents保持原行为，CellContext原字段兼容，新增回调不接管请求或分页事实。

日期时间选择新增 DateTimePicker/createDateTimePicker/createDateTimeModel 与严格无时区分钟值；模型及关联Calendar回归28/28，浏览器21/21（完整20/21后仅补两端键盘2/2，保留原始报告并逐case合并），Calendar-month/widgets回归19/19、composition-select12/12，真实Chrome200%缩放6/6。正式构建/types/独立tarball消费者及预算通过，原生无React，公开入口100个。双端浅/深/system、1280/390px、长中文、200%文字、弹层滚动、受控接受/拒绝、清空、必填/宿主错误关联、readOnly/disabled、分钟选择、键盘、取消/Escape回焦点、表单reset及新编辑优先、原生update/destroy均有浏览器证据。React使用同peer公开Select及回调仲裁内层Escape；原生使用bindSelectControl/controller，无内部DOM依赖。UTC仅作为可省略today的日期浏览参考，value/callback不转换业务时区。

DateTime证据：.artifacts/date-time-browser-aggregated-final.json（及其原始full/keyboard报告）、date-time-calendar-regression-browser-final.json、date-time-composition-select-browser-final.json、date-time-zoom-final.json。实际查看两端深色390px/200%文字截图。首轮发现的内层Escape、错误反馈推走reset点击及示例长JSON溢出均已修复；桌面长内容也允许有界滚动。测试不直接使用React跟踪过的value setter伪装输入，按原生setter与真实事件复现reset后新编辑；Base UI先打开再Home/End定位与原生直接Home/End的差异如实记录。其他浏览器、读屏器及Argus/xQuant/xAgent实际产品未跑，本轮未修改消费项目。

主题sessionStorage迁移最终门禁：build/typecheck/check:tokens/check-docs及独立tarball消费者通过，完整unit501/501。浏览器theme-session6/6、header-controls18/18、foundation16/16、ui18/18、DateTime完整21/21，DateTime真实Chrome200%zoom6/6，总85项通过。该轮完整21项复验替代前述DateTime聚合报告作为最新主题产物证据。主题专用seed/assert迁移到sessionStorage；认证/凭据storage防泄露检查保留。首屏init与应用复用同一owner，同标签刷新、独立无opener标签、system实时变化、自定义key、受控/persistfalse零storage访问、storage拒绝及旧localStorage不读取均验证。旧localStorage值不自动迁移或覆盖，主题偏好生命周期按浏览器页会话管理，不主动跨标签同步。

最新证据位于.artifacts/theme-session-{browser,header-controls-browser,foundation-browser,ui-browser,date-time-browser,date-time-zoom}-final.json与对应日志；完整单测theme-session-unit-final.log。独立React安装的npm ls仅一个React19.2.8/ReactDOM19.2.8/BaseUI1.7.0，各模块从consumer与已安装xui-react解析到同一绝对路径；证据theme-session-react-peer-tree-final.log与theme-session-react-peer-singleton-final.log。正式CSS预算保持当前16512-byte gate，实际16440bytes（危险状态增加56bytes的有限调整见上文）；未再扩大预算。新的sessionStorage生命周期是本轮明确兼容性变化，受控接口/显式memory-only及CSS值保持。未跑其他浏览器、读屏器和任何消费项目实际集成，不声称这些通过。
