# 基础层 DESIGN 验收清单与依赖门禁

按用户最新顺序：规范/变量/基础样式 → 基础组件 → 合成组件 → 通用业务组件。此清单基于正式 `ui-react/src/index.tsx` 重导出和打包后的根值出口核对；不是新增 API 提案，也不以组件总数代表完成。完整值与交互规则只引用 DESIGN。

已验证基线：5a5896c；生产 generation af0c2c0dbba049fe241967569ce4b42ce8e41a4aaa39282665c6bf5f06cda14f。安全 CI 38448768298 已完整成功：510单测、81 Auth、600 focused、1224完整浏览器，watch/冷启动通过。表中“已有测试”仍只表示覆盖入口；当前未逐条证明的 DESIGN 合同不可因整套旧测试通过而标绿。

## G0：设计变量与基础样式

| 范围 | 静态规范/token检查 | 单测/正式消费 | 必须实际验证 | 当前缺口/未测 |
| --- | --- | --- | --- | --- |
| DESIGN→生成产物 | 358 tokens、无环依赖、light/dark/system/reduced、CSS/YAML一致；design-value-guard维持结构/运行时例外边界 | tokens/build、每个正式ESM/CSS/types出口、Button-only贡献与gzip门禁 | 在真正消费者覆盖语义变量后computed与绘制改变 | 尚无已选新风格；没有styleId/profile API |
| 字体与文字角色 | font、size、line-height、weight、说明/错误颜色只取相应变量 | typography、display、table-design-contract | 中英文/数字/长文本、fallback/离线、三主题对比与200% | 浏览器CJK字体已有CI证据；系统读屏、不同OS字体未全面验 |
| 共享状态优先级 | H/P/S/F/X/B各状态的适用规则，不用hover覆盖selected或variant覆盖disabled | menu-design-contract、design-state-contract；Button专项已通过 | 默认/hover/active/selected/focus/disabled/busy/invalid交叉矩阵 | Button variants 16例已过；所有组件的全局状态优先级仍需逐族核对 |
| 边界、surface和focus | 背景/边线/圆角/阴影/outline、scroll paint空间均用公共变量 | foundation-contract、focus-boundaries、design-state-regressions | 四边实际绘制、所有overflow祖先、Tab自动滚动、forced colors | workspace焦点与Toggle 24例已过；Surface及其他容器需逐项门禁 |

## G1：基础 DOM 与展示组件

所有行的双端指：React正式组件以及公开原生元素/语义类或正式controller，原生不加载React。适用状态必须列出，不把无意义状态硬加到静态展示控件。

| 正式族/入口及实际parts | 下层依赖 | DESIGN/token静态核对 | 单测/已有正式浏览器入口 | 当前门禁与未测 |
| --- | --- | --- | --- | --- |
| Button、IconButton（button） | G0、原生button/link | 六variants、公开尺寸、disabled/busy/focus/图标与可见名称 | button tests、native-controls-audit；新增Button状态专项 | variants disabled 16例、原尺寸12例及xs追加6例同5a通过；不新增尺寸/密度API |
| Input（forms） | G0、原生input | 字体、padding、高度、边线、placeholder、invalid/disabled/readOnly/focus | forms、native-controls-audit、foundation-contract | 500字体及独立token覆写已验；file/date/color安全系统子UI不承诺统一；autofill/密码管理器需明确未测 |
| Textarea（forms） | G0、原生textarea | 同字段token、resize/长内容/边界 | forms、native-controls-audit | 不凭Input通过替代Textarea；放大与长值滚动待逐项核 |
| NativeSelect（forms） | G0、原生select | 外壳、箭头、尺寸、禁用、required/invalid | forms、native-controls-audit | 明确保留OS弹层边界，不声称CSS统一原生弹出窗口 |
| Checkbox、Radio、Switch（forms） | G0、真实input语义 | unchecked/checked/indeterminate、readonly/disabled/invalid、focus | forms、native-controls-audit、widgets | 48态/两端绘制与真实禁用、readonly交互12例已过；既有mixed invalid/disabled回归保留 |
| 标签与帮助/错误文字能力 | G0；Field.label/help/error props；原生label.xui-label | htmlFor/id、required可见标记与accessible name、describedBy、文字角色 | forms、password-fields、foundation-contract | **没有独立Label或Field.Label出口**。Field实际组合在G3；本阶段只核标签基础语义/样式 |
| Typography（display） | G0、语义元素 | heading/body/help/code角色、长文字和语义层级 | display unit/browser、SSR/hydration fixture | 不新增small/large密度；全角色token覆盖需记录 |
| Separator（display） | G0、hr/装饰分隔语义 | 线宽/颜色/方向 | display unit/browser | 默认/独立覆写线宽横竖双端6例已过；装饰语义仍按独立用例核对 |
| Tag、Badge（display/feedback） | G0；Tag删除动作依赖Button类基础交互 | 文本、颜色、边界、可移除目标/focus | display unit/browser、feedback | Tag与Badge分别有出口，不把两者同名替代；长标签及删除后焦点需核 |
| Image、Avatar（display/avatar） | G0；Avatar实际Root/Image/Fallback parts | fit/尺寸/比例/占位、加载失败、替代文本 | display、widgets、SSR/hydration | 图像加载/失败/长fallback分别验；不推断业务图片 |
| Surface（feedback） | G0、section | surface背景、边线、圆角、padding、文本与焦点边界 | feedback/foundation/focus-boundaries | 独立surface状态/嵌套边界必须门禁，不能仅从页面截图推断通过 |
| Alert（feedback） | G0、role status/alert | 四tone、文字/图标与颜色关系、长错误完整可达 | feedback、error-layout、auth-feedback-readable | 不以toast替代关键错误；长内容不得裁切保高度 |
| Skeleton、Spinner、Progress（feedback） | G0、原生progress/隐藏装饰语义 | 轨道/填充、大小、动效/reduced motion、语义 | native-controls-audit、feedback | 不把spinner装饰播报成第二份busy；不定进度与确定进度分别验 |

G1通过标准：逐族静态条款/token映射、单测、正式React/原生浏览器和实际截图均有同一候选证据；每个未测项明确保留。已出现失败必须关闭或明确阻塞，不因其它行通过而整体标绿。

## G2：带交互状态 owner 的基础组件

| 族与公开parts边界 | 依赖与核对重点 | 现有正式测试入口 | 待完成门禁 |
| --- | --- | --- | --- |
| Select、Combobox | G0/G1；BaseUI parts+公共popup皮肤；选中/禁用/键盘/取消/定位 | foundation-contract、menu-design-contract | 所有适用parts token与状态，不能由SimpleSelect通过替代 |
| Menu、ContextMenu | G0/G1；同一menu owner/parts，context trigger不同 | context-submenu、capabilities、menu-design-contract | 初始容器focus后真实Home首项；禁用hover/press、子菜单与Escape回焦点 |
| Popover、Tooltip | G0/G1；非模态定位owner，独立用途 | foundation-contract、capabilities | 不误套menu最小宽；边缘/缩放/动态内容/禁用trigger |
| Dialog、AlertDialog、Sheet | G0/G1；Dialog复用parts，变体并非新的焦点owner | focus-boundaries、dialog compositions | 关闭后的弹层内容不可聚焦；关闭按钮本身可键盘聚焦/激活；标题/描述、取消/回焦点、长内容四边、真实200% |
| Tabs、Disclosure/DisclosureIndicator、Accordion | G0/G1；各自语义与controlled事实 | navigation、widgets、foundation-contract | 键盘/重复操作/disabled/收起后焦点与外部受控拒绝 |
| ToggleGroup | G0/G1 Button底层+选择owner | widgets、design-state-regressions | 12项selected-hover真实失败已修，5a同候选通过 |
| Calendar | G0/G1；date-only键盘owner | widgets/calendar | 日期语义与禁用、月跨界、RTL、focus；不新增业务时间规则 |
| ScrollArea | G0/G1；滚动与focus paint边界 | focus-boundaries、widgets | 首末焦点自动滚动、宽窄/缩放、原生滚动语义 |
| Toast | G0/G1；通知队列与生命周期 | feedback/toast | role、超时/关闭/焦点、reduced motion；关键错误不能仅放此处 |

## G3/G4：后置，不在基础尚未闭环时追加实现

- 字段组合：Field/Fieldset、InputGroup、SimpleSelect、CheckboxGroup/RadioGroup、NumberInput/PasswordInput/SearchInput、Copyable。
- 布局与导航：Container/Stack/Grid/Section/Toolbar、Nav/NavItem/Breadcrumbs/Pagination/NavigationMenu、AppHeader/HeaderBrand/AppShell/MenuLayout/SidebarFooterContent/PageHeader、ThemeModeButton。
- 通用组合：LoadingState/EmptyState/ErrorState/DataRegion/RenderBoundary、结构Table及其真实子部件（含TableActions/SortButton等）、DataTable/Toolbar/Filter、CommandPicker/GroupedCombobox、SearchToolbar/MetricCard/AuthPage。
- 通用业务：ConfigurableLoginPage、AdminSetupPage、NewPasswordFields、ApiKeyManager、StructuredLogExplorer、BusinessLogExplorer。
- useTheme/useResource是hooks，HTTP/auth/query/持久operation store是运行时能力，不计为视觉组件；其已有安全回归继续运行，不因本轮顺序改动而删掉。

上述按依赖安排验收顺序，不撤销现有exports，不声称现有所有族已验完。表格横向全定宽与用户期望的冲突仍等待明确决策；纵向footer及document/workspace测试证据继续跟踪，产品实际包版本须另核。

## 首批修复记录（5a同候选通过，未宣称全层完成）

- Button：disabled选择器由:where改:is，后置同级覆盖六variant默认配色；只提高禁用状态优先级，busy仍独立，保持native/aria/data-disabled语义。16项真实双端宽窄/三主题与forced-colors用例已通过。
- 输入文字：DESIGN Typography正文400、控件500；forms基础输入族从font-weight-body改为font-weight-control，保留原body-sm字号/行高与input-height。静态检查未发现另有普通输入400的明确例外。新增6项真实两端默认500与独立覆写700测试，包括React Select.Trigger/Combobox.Input复用皮肤。
- Button xs短文本24px与choice disabled+invalid已完成实现及真实回归；Combobox代理键盘focus与selected可辨识仍是后置G2候选，未实现，静态推断不写成浏览器复现。

- 下一选择合同待核：DESIGN中菜单min-width与Combobox/自定义选择popover-width/padding属于不同角色，当前选择皮肤存在消费差异候选。需先列各组件适用条款与冲突，再做token覆盖真实浏览器回归；不能批量给所有listbox套同宽或改规范迁就实现。

### NativeSelect平台行高边界

c83fd28安全CI确认字体500与14px已生效，原生select的computed line-height为normal，而非作者CSS的22px。Blink官方[AdjustMenuListStyle实现](https://chromium.googlesource.com/chromium/src/+/06e87fb3dc2a1c881f95eb6cd3738608b846d29a/third_party/blink/renderer/core/layout/layout_theme_default.cc#304)将menulist行高设回初始值；这仅是保留原生外观的NativeSelect边界，不适用于Input/Textarea或自绘Select/Combobox。后续回归明确断言NativeSelect normal、控件实际36px、无内部裁字滚动、500→700字重token覆写及End选择真实值；其它四类入口仍严格22px行高。平台边界不通过取消原生外观或修改默认规范值掩盖。系统OS弹层本身仍未像素统一，遵既有NativeSelect用途合同。

本轮后续基础候选：xs经12项真实CI确认32px不符24px后，按DESIGN集中新增派生button-padding-block-xs（358总token，旧默认/原始SHA逆重建保持）；原12严格断言保留，新增6项variants/长中文/状态/独立覆写。choice disabled+invalid保留错误边界的既有规则移至disabled之后，填充与交互仍禁用，12项双端48态回归进入同一候选；原native-controls-audit也纳入前置验证。G2 Combobox代理focus/弹层宽度候选保留，未开展实现。

### ba525f0 实际门禁与遗留几何基准

CI 38443173192：510 单测、81 Auth 视觉、558 focused 全部通过（零跳过/零重试），watch 181.86 秒及冷启动 18.83 秒通过；完整浏览器 1182/1224 通过，42 项 workspace-layout 均止于同一旧高度基准。逐条日志仅有五组尺寸差异，全部差值对应实际上下 focus padding；390px 代表 trace 为 content clientHeight 590、paddingTop/Bottom 各4、workspace 582。实图中 composer 与 page footer 完整位于首屏，document无横纵溢出。

漏掉的专项现改用 computed clientHeight 减上下 padding 作为百分比高度包含块，并补横向内容盒宽度及左上起点强断言，不写固定减8、不改变1px容差。全部滚动、footer/composer可见、短/空内容、DOM/focus保持断言保留；该专项纳入前置检查，随后仍跑完整套件。生产未改变，修复后结果待新CI。

本候选已实际通过的基础修复包括 Button 六variant禁用16例、原严格尺寸12例及xs追加6例、输入字体/NativeSelect平台边界6例、Separator独立线宽6例、choice绘制/真实禁用与只读交互12例，以及原生控件4例。这里只结算这些基础条款，不代表Typography/Surface/其他展示族全部token与可访问性门禁完成。G2候选继续后置；OS弹层、自动填充/密码管理器、系统读屏与多OS字体仍明确未全面测。

### G0/G1 展示基础的下一项独立消费证据

已按真实出口复核 Typography.Heading/Text/Link/Code（display）、Surface（feedback）及原生 createTypography* / xui-surface。新 `display-foundation-contract.spec.mjs` 使用既有独立 tarball 两端示例，增加六项三主题验证：文字四parts的独立font-family/字号/行高/字重变量，Surface背景/边线/线宽/圆角/padding/平面阴影；同时覆写Surface线宽仍不影响Separator，真实Tab进入链接，以及390px下200%文字放大不横溢出。这是新增待执行回归，语法和用例发现通过不代表真实浏览器通过。

Badge/Tag：DESIGN930/955写“元数据body-xs普通文字”，Typography799列正文400/控件500；现Badge使用control字重500且Tag复用。历史与DISPLAY专项没有明确独立字重映射，暂记录规格歧义，不凭孤立词语改变默认值。Tag删除按钮仍是Button控件。其既有移除/焦点/禁用/长中文测试不能替代元数据文字token的明确合同。

仍需逐族补充独立消费证据：Typography全部tone，Surface嵌套与四边focus，Alert四tone/非颜色唯一提示，Badge明确文字角色，Avatar fallback，Spinner/Skeleton独立motion token与无重复播报，Progress值/不定值及独立轨道token。现有display行为/SSR、native-controls进度/forced-colors、widgets头像等属于已有覆盖入口，不将这些入口存在自动计为上述所有合同完成。系统读屏、浏览器自动填充/密码管理器和跨OS原生窗口边界继续单独记录。

5a5896c 完整复验结论：510单测、81 Auth、600 focused、1224完整浏览器均通过；watch120.82秒、cold15.27秒通过。上述42个workspace验证基准已逐条关闭。后续纯基础验收批增加Typography全部tone和Surface内首/中/末控件的真实Tab与四边focus几何，放大文字后重复，未扩生产样式。此后新回归在CI实际执行前仍列未测。

合并纯基础验收批：`feedback-foundation-contract` 再增加18项独立React/native×三主题测试，具体覆盖与非重复边界见 [反馈基础验证](FEEDBACK_FOUNDATION_VALIDATION.md)。与展示6项一起24项纳入前置门禁。合成后的516单测和类型检查通过；浏览器执行、实际像素与截图审阅留给本批CI，不把unit或仅收集用例计为渲染验收。
