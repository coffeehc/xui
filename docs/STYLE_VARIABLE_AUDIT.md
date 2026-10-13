# 风格变量覆盖与缺口审查

基线：c6e4778 的生产源码（后续4666bd5只增加测试/规范记录）。本轮是只读源码审查与待办，不新增风格值、profile、注册表或切换 API。实现顺序见 [DESIGN_ROLLOUT](DESIGN_ROLLOUT.md)，唯一规范与生成源为 [DESIGN](DESIGN.md)。完整357项直接依赖/消费表见 [TOKEN_DEPENDENCY_AUDIT](TOKEN_DEPENDENCY_AUDIT.md)。

## 当前覆盖矩阵

| 维度 | 已有公共变量族 | 实际消费/关联 | 当前判断 |
| --- | --- | --- | --- |
| 品牌与基本颜色 | palette-*、action-primary/secondary、foreground、muted-foreground | base/button/forms/navigation | 可成套替换，不能只换主色而忽略前景对比 |
| 表面层级 | layer-canvas/shell/surface/support/raised/overlay、surface-line、separator-line | layout/card/dialog/floating/table | 已覆盖各层；层级区分需样板实图验证 |
| 语义状态 | status-info/warning/success/error及foreground/soft/line、action-danger | feedback/forms/button | 独立于品牌色；错误事实不由风格判断 |
| 选中/悬停/按下/焦点 | interaction-*、focus-width/offset、menu-item-*、nav-selected-indicator-* | button/forms/navigation/floating | 选中与焦点已有分离；不能合并成单一颜色 |
| 字体家族 | base-font-sans/mono、font-sans/mono/heading/document | base/表单/标题/代码 | 家族可变；通用字体资源清单/回退/离线规则应由主题合同规定，宿主按约接入 |
| 字号、行高、字重 | font-size-*、line-height-*、font-weight-*、font-scale/line-height-scale | 通用文字与控件；Auth有语义别名 | 已覆盖，行高依赖字号下限；不可任意独立缩至不可读 |
| 间距与密度 | base-spacing→spacing→space-*、layout-*、button/menu/card/table/nav别名 | 全局布局与组件内距 | 已有变量；不新增字号或密度切换，风格内成套映射另行评审 |
| 尺寸与触达 | control-height-*、control-icon-size、input/button-height、menu/nav/switch-* | 表单、按钮、导航与开关 | 可配但必须保持触达/文字/图标/行高关系 |
| 形状与边线 | base-radius→radius-*、组件radius、line-width-*、input-border-color | 控件/浮层/卡片/表格 | 圆角与线宽已覆盖；边线类型仍统一solid结构约定 |
| 阴影与遮罩 | shadow-*、palette-shadow-ink、backdrop-background | raised/overlay/dialog | 可配；不允许遮罩替代内容surface可读性 |
| 动效 | motion-duration/fast/enter/exit/pulse/spin、easing、distance/scale/rotation | 表单反馈、Disclosure、Dialog等 | 已有reduced-motion生成与消费；风格不可移除该保护 |
| 布局与响应 | layout-content/inset/viewport/dialog/drawer-*、nav-sidebar-*、login-* | 页面/弹层/品牌/登录 | 视觉尺寸可配；布局策略、滚动归属与焦点边界不是任意风格开关 |
| 图表与文档 | chart-*、diagram-*、document-* | 已有主题语义出口，部分由宿主消费 | 变量存在不等于提供完整图表渲染组件；需实际消费者验收 |
| 明暗与系统适配 | light/dark根映射、system媒体映射、reduced-motion | tokens生成器、ThemeController | 正式API目前只有明暗三模式；风格维度未实现 |

## 已确认的依赖关系

- base-font-sans → font-sans → font-heading；更换字体必须检查标题、标签、正文、辅助说明、实际中文fallback。
- font-scale → 各font-size；line-height还受字号比例下限和line-height-scale约束。两者不是互不相关的旋钮。
- base-spacing → spacing → space-* / control尺寸 / menu尺寸 / 布局间距；修改基数会联动密度和触达。
- control-height → button-height/input-height/nav-item-height；Auth control高度另由control-height-lg与space-text-gap组合。
- palette-* → action/status/layer语义 → 组件状态变量；status soft/line还依赖混色权重与状态底色。
- palette-shadow-ink → shadow层级；阴影不能只按light图选择而不核dark。
- range-thumb-offset、switch-travel、侧栏折叠尺寸等属于相关尺寸推导，改变其上游要验证对齐，不单改最终偏移修图。
- z层级和运行时浮层可用空间参与定位；不能为风格重排到遮挡焦点或系统安全UI。

生成器当前检查light/dark/system、reduced及既有产品覆盖的完整无环依赖；设计值guard检查组件声明及批准的结构/运行时例外。它们不能自动证明颜色对比、中文字形、文本裁切或实际焦点像素正确。

## 缺口与可验收下一步

| ID | 已核现状/缺口 | 最小后续动作（尚未实现） | 验收条件 |
| --- | --- | --- | --- |
| V01 | 没有风格×明暗的正式组合/覆盖优先级合同；ThemeMode只有light/dark/system | 样板确定后先在DESIGN描述覆盖层次、缺省/SSR/切换规则，再决定是否需要公开风格标识 | 各风格×明暗无缺变量/循环；切换不丢输入/焦点/受控状态 |
| V02 | 表单label/help/error/placeholder/disabled复用body-xs、muted等通用变量，不能在不影响其他说明文字时独立调某一角色 | 只有样板确需不同角色时，增加语义别名并保持当前默认依赖，禁止产品重写选择器 | 角色映射表及三主题对比/文本放大截图；不重复一套基础字号 |
| V03 | 表格cell只有统一padding，行高随内容；用户未批准新的small/large字号或密度开关 | 仅评估风格内成套token及横纵padding语义别名，明确行/内距/控件/多行关系；除非用户另行批准，不提供密度切换API | 长内容不裁、按钮触达保持、自动高度/分页/空态矩阵通过 |
| V04 | letter-spacing、装饰线样式、边线类型没有任意风格变量 | 当前无选定需求，不为凑变量新增；样板证明必要后先写DESIGN，语义链接下划线/焦点不能被主题取消 | 字形/换行回归；链接非仅颜色识别；清楚划定可变与固定项 |
| V05 | 字体变量可换，但没有字体资源加载/语言覆盖的公共风格清单 | 由通用主题资源清单规定许可、字体来源、fallback及离线策略，宿主按约接入；不把通用责任全部交产品，不自动远程加载 | CDP实际字体/缺字/加载失败/首屏位移证据 |
| V06 | 现有状态矩阵以当前风格和明暗为主，缺多风格笛卡尔积验证 | 先复用现矩阵参数，样板确定后增加风格维度，不复制组件实现 | React/native、宽窄/真实zoom、focus/disabled/error/unknown均通过 |
| V07 | 某些公开token只由别名、继承或宿主消费 | 对照完整依赖表追溯，不以“本CSS未直接引用”判定无用 | 删除前列所有反向依赖/正式出口/产品引用；无用才删 |
| V08 | 原生OS菜单、文件/日期窗口、浏览器自动填充/密码管理器并非都受CSS控制；强制色模式也需独立实测 | 延续NativeSelect和系统UI边界，补实际平台验证记录 | 明确库外壳已测与系统UI未测；不假称风格可统一全部OS界面 |

## 固定合同，不作为风格开关

DOM语义、required/disabled/错误关联、Tab与键盘选择、受控事实、请求次数、未知结果门禁、凭据生命周期、真实列表数据/列宽策略、自然/工作区滚动归属、reduced motion、原生系统安全UI边界均须维持各正式API合同。结构常量与编译期断点按DESIGN例外检查。不得以新增风格为由删掉错误、缩窄焦点可视范围或修改认证/业务结果。

## 本次证据边界

直接审查357个默认token与theme/src全部CSS及ThemeController类型；输出变量关系而非新数值。c6生产源码完整CI为494unit、81Auth视觉、410focused、1094browser；这些仅证明当前实现，不能标作未选择风格通过。新12行五列同形footer矩阵随独立测试提交运行，实际产品版本/页面需另核。
