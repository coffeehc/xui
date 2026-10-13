# 原生 DOM 控件样式审查

依据 [DESIGN](DESIGN.md) 和 [公开 API](PUBLIC_API.md)，本次检查的是库的公共组件与同名原生 CSS 结构，不修改消费方业务、权限、字段值或请求 owner。Select / SimpleSelect 的弹层统一由独立选择控件改动覆盖。

## 结论与修复

| 控件 | 现有能力与本次处理 |
| --- | --- |
| Input / Textarea | 外壳原已有字体、尺寸、边界、焦点、错误、禁用主题；保留原生 label/name/FormData/required/readOnly。InputGroup 禁用附属按钮不再出现 hover/pressed 可用反馈。 |
| text/search/email/url/tel/password/number/date/datetime-local/month/time/week | 保留浏览器编辑、步进、清除、日期/时间输入、自动填充语义及 color-scheme。没有用遮挡或替换隐藏必要功能。 |
| file | 补公共 `::file-selector-button` 主题、间距、边界和交互/禁用状态；保留真实文件输入、文件名、accept/multiple 和用户选择流程。 |
| range | 清除 range 浏览器默认外边距，避免 100% 宽控件超出父项；补 Chromium/WebKit 和 Firefox 的公共轨道/拇指规则；min/max/step、箭头键、实际数值仍由原生 input 决定。唯一新尺度 `range-thumb-offset` 从现有轨道/图标/边框 token 派生，只在 DESIGN 定义。 |
| color | 补色块边界、圆角、控件高度；色块颜色仍是实际选值，不能替成品牌颜色。 |
| Checkbox / Radio / Switch | 补真实 checkbox.indeterminate 横线和选中背景；补 aria-invalid 错误边界；维持禁用、只读 guard、键盘、RTL Switch 和 forced-colors 原生标记。Fieldset 错误亦绘制公共错误边界。 |
| Button / IconButton | 已有公共变体、尺寸、focus、pressed、busy、disabled；修复 link 变体 disabled hover 仍变背景的遗漏。 |
| Progress | 从单 accent-color 改为主题轨道/真实 value 填充，保留 progress 元素与 value/max/无 value 语义；不确定时不虚构百分比，减少动效静止，forced-colors 恢复原生绘制。 |

## 可控制边界

库可统一网页里可由 CSS 控制的外壳与子控件。系统文件窗口、日期/颜色选择窗口、浏览器密码管理器、自动填充建议与移动键盘不是普通 DOM 弹层；本次不声称能统一这些界面。需要统一 date-only 日历时使用已有公开 Calendar，不把浏览器日期窗口伪称该组件。

HTML 不支持 file/range/color 的 readOnly。审查页明确说明这一点，而不是静默禁用或用无效属性冒充只读。Checkbox/Radio/Switch 的 React guard，以及原生 bindReadonlyChoice，继续负责只读交互；CSS 只负责表达状态。

## 验证与证据

- 新增 `tests/fixtures/native-controls-audit.tsx`，通过 `scripts/consumers.mjs` 从独立 npm tarball 安装的公开 ESM/CSS/types 构建，禁止包源码 alias；页面同时使用 React 与原生公共结构，无控件外观补丁。
- 新增 `tests/browser/native-controls-audit.spec.mjs` 四个真实浏览器用例：light/dark/system（system 跟随实际媒体变化）、桌面/390px、普通/禁用/只读/错误/错误+焦点、混合勾选、文件实际选择、range/number/Radio 键盘、FormData、禁用 hover、减少动效、forced-colors。
- 每个主题/宽度/状态以及 actions/progress 和 forced-colors 均输出 PNG 附件，由现有 CI validation artifact 保存。截图附件需实际审查；计算样式和 CSS 字符串存在性不等于视觉验收。
- 当前本地已通过：token 生成与 `check:tokens`（351 个集中 token）、根 typecheck、fixture strict typecheck、browser 测试收集（4 项）。本地 Chromium 先前受 socket EPERM 限制，本次没有绕过限制，也未宣称任何实际浏览器断言或截图通过。
- 最终独立消费者/全量 verify 和 GitHub CI 的实际结果由提交负责人记录。真实 Firefox/WebKit、移动 OS、屏幕阅读器与系统窗口未测。

## 选择与弹层扫描矩阵

| 公开组件 | 处理与验证边界 |
| --- | --- |
| NativeSelect / 原生 select / bindHeaderLocaleSelect | 明确保留 OS 选择合同；普通表单边界回归保留，不把 CSS appearance 当作系统菜单统一。 |
| SimpleSelect / bindSelectControl / 顶栏 locale | 共享主题 button/combobox + listbox；单/多选、禁用、隐藏表单值、label/help/error、受控回传与销毁。新增单测覆盖表单 reset、取消 reset 与 optgroup；浏览器通过状态需看同提交 CI。 |
| DataTable / API Key / BusinessLog / StructuredLog | 两端内部默认选择入口全部迁到上述公共组合，包含分页条数、有效期、筛选和错误日志多选；业务请求/写入门禁/值所有者保留。 |
| React Select / Combobox / Menu / ContextMenu / Popover / Tooltip | 原已使用正式 Portal/Positioner 与公共主题层；未发现 OS select 弹窗替代问题，保持现有 props/位置扩展。 |
| 原生 createPopoverController / ContextMenu / 子菜单 / Tooltip | 补测量后的安全边距、RTL、可用高度、翻转与约束；观察触发器/内容 resize 和 visualViewport。移除旧只按 layout viewport 0 边界计算的局限；共享 owner 处理关闭/层级/回焦点。 |
| Calendar / GroupedCombobox / Command | 已为自定义 DOM 日期网格/列表，非系统 date/select 窗口；不新增另一套业务查询或日期状态。 |
| Dialog / Sheet / AlertDialog | 既有主题原生 dialog 或 React 公共组合，继续由模态 owner 管理；本次选择浮层位于其所属 DOM 范围，没有新增模态 owner。 |

集成预检已通过：最终共享源码的 build、typecheck、351-token check、385 项 unit，以及两端独立 tarball 消费（全部公开 ESM/CSS/types、动态入口、Button-only 和初始 gzip 预算）。本地 watch/cold-start/实际浏览器未在受限环境冒充通过，交由正常 GitHub CI 的完整 verify。真实 macOS OS 菜单、Firefox/WebKit、移动设备和读屏器未测。

选项细节回归：SimpleSelect 与顶栏语言浮层的相邻选项、optgroup 内部条目采用公共 space-text-gap。新增三主题/窄屏的选中+悬停截图及实际 bounding box 间距断言；真实执行结果仍以最终 CI 为准。

## 已执行的视觉里程碑

`b62bc1b4e64d168c1c494763e0001dd387364ad1` 的 [完整 verify](https://github.com/coffeehc/xui/actions/runs/38385385178) 已通过：385 项单测、900/900 Chromium 浏览器测试，以及构建、类型、token、watch、冷启动、独立 tarball 消费和体积预算。覆盖两端品牌/leading/RTL、三主题与窄屏选择浮层及选项间距、原生输入审查、表格组合选择、密码/登录与 62 项 Dialog/Sheet/Card 焦点边界。实际审阅了紧凑品牌、语言选项间距和窄屏 200% Dialog/Card 输入焦点截图。

已解决的失败包括隐藏 select 的 display 优先级、浮层重测时重置 scrollTop、range 浏览器默认外边距和 checkbox 错误边界优先级；测试侧修正了读取隐藏桥值、跨动画帧混合几何、将根 body 锁滚动误当 fixed portal 局部裁切等量测问题。保留真实点击/键盘、可见控件、实际四边几何和业务受控事实断言。

此结果不代替后续 auth 持久恢复或 Key v2 新增能力的独立 CI。真实浏览器 autofill/密码管理器 UI、Firefox/WebKit、移动 OS、系统日期/文件/颜色窗口、屏幕阅读器仍未实测；这些边界未伪报为统一样式或全面通过。
