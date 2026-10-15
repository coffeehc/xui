# 验证证据与限制

本页集中记录当前可复核的执行结果与验收边界；接口和设计合同分别由各能力文档与 [DESIGN.md](DESIGN.md) 维护。测试存在、收集成功、源码检查和实际浏览器通过分别陈述，不把历史全绿或局部复验当作当前完整验收。

## 通用卡片长标题（2026-10-15）

基于固定 `68b017cea090109967226aa4056064492583e2c1` 排重：此前只有 NavigationMenu.Label / createNavigationLabel 的导航专用滚动，没有卡片可用的通用入口。新增 React `/display` 与 root 的 OverflowText/OverflowTextProps、runtime `/display-dom` 与 root 的 createOverflowText/OverflowTextOptions/OverflowTextController。源码只改xui；没有升级或修改xAgent、后端、认证、API及其既有adapter。本次文本部件不构成完整卡片Header/Footer槽位框架交付，也没有实施尚在讨论的公共API接入规范变更。

h3、图标、中性归属Badge、摘要、footer和动作保留宿主语义；只有text字符串参与动画。interactionRef/interactionTarget指向现有包含该名称且有键盘入口的表面，其hover/focus触发同一名称展示；没有现有键盘入口时完整静态换行，不新增Tab或伪按钮。短名称、减少动效、触屏、无动画支持保留完整静态文本；英文无空格可折行。原导航呈现复用共享几何，原nav-label-scroll-*改为新text-overflow-scroll-*的同值别名，仍接受原公开覆盖。完整合同与合成消费者见[通用长标题](COMPONENTS.md#通用长标题)。

最终 source generation `aeb93d3bdd9e99a3960c245f0065f43e601940f5611d56f3b8c671bda571bb91`；DESIGN **0.17.0**，386 tokens、102 manifest入口，三包仍为私有0.1.0。正式CSS gzip **17424/17536**，预算未提高。独立tarball消费者验证正式ESM/CSS/types/init、命名类型与负向编译；React/ReactDOM/Base UI各一份，原生无React，没有源码alias或消费者动画/CSS补丁。新增internal/overflow-text仅包间接线，消费者使用公开display入口。

| 检查 | 结果 | 原始证据（`.artifacts/overflow-text/`） |
| --- | --- | --- |
| build / types / tokens / docs / 单测 | 通过；单测 **524/524**，包括完整安全SSR标题、不增加交互语义 | `build-final.log`、`typecheck-final.log`、`tokens-final.log`、`docs-final.log`、`unit-final.log` |
| 正式tarball消费者 | 通过；入口/类型/同代包/peer/gzip门禁 | `consumer-final.log`、release metadata |
| Chromium新专项 | **40/40**：两端 ×三主题 ×1280/390 ×16/32字号24项；减少动效/无target/无动画6项；触屏2项；销毁2项；真实Chrome200%缩放6项 | `browser-final.json`、`screenshots/` |
| 导航与展示回归 | **50/50**：navigation-presentation、display、display-foundation-contract | `regression-final.json` |
| Firefox / WebKit精选 | 每引擎 **10/10**：两端桌面浅色、窄屏深色200%文字、减少动效、无target和销毁 | `firefox-final.json`、`webkit-final.json` |

浏览器实际断言仅名称移动、Badge固定且不被裁切、完整h3名称、无新增Tab停靠、真实Tab/输入焦点触发展示、延迟/距离/速度与末端几何、短名称无动画、16/22rem表面及动态中英文标题更新、原节点/草稿/选区、降级全文折行、销毁取消动画/释放ResizeObserver后重挂只有一个owner。Chrome缩放由设置页执行200%，分别确认DPR翻倍、CSS视口减半、根字号不变、CSS zoom=1、pinch=1。实际查看桌面浅色、窄屏深色大字和system真实缩放截图。

候选构建先因固定token数量未同步、事件监听动态方法失去DOM重载类型而失败，已同步精确386并使用明确的add/remove；未放宽类型/预算。关键浏览器初轮4/6，两个失败为容器宽度更新后测试仍读取RO重测前旧动画；现等待当前距离/速度与动画时长匹配后在同一evaluate取值并finish，保留末端、时长和节点断言，生产动画未因该失败改动。初轮与复验报告完整保留。

未跑xAgent真实卡片、产品部署、后端/认证/API、实体触屏设备/读屏器和独立SSR hydration；模拟触屏与SSR字符串测试不代表这些已通过。此次新能力不授权消费项目更改其原有协议或业务owner。

## stacked InputGroup 的 Textarea 自动增高（2026-10-15）

在侧栏合同提交 `429298e53e3f14ba04616964a2f7811593804905` 之后独立修复；只修改 xui，不升级消费项目。以正式 `511383729302901d8ff7284f520a943519ee7051` 的三包安装到独立消费者复现：同一受控长文本中，独立 Textarea 从72px增长至120px，stacked InputGroup 实际仍70px，尽管内联 block-size 已为118px、scrollHeight272px。根因为公共纵向 flex 的伸缩基准覆盖共享测量结果，不是宿主 value、请求或另一个高度 owner。

共享 `bindTextareaAutoResize` 在活跃期间标记自身尺寸归属，公共 forms.css 仅对 stacked 中已启用的 Textarea 采用其测量高度；销毁恢复原属性和内联尺寸。React 继续复用同一绑定，没有第二套测量、状态或事件机制；公开 ESM/types 和 autoResize/maxRows/update/destroy 签名不变。未启用时保留原 flex、手动resize与rows，只有原本声明自动增高但被压缩的组合表现得到修正。具体合同及正式双端例子见[Textarea](COMPONENTS.md#textarea-可选自动增高)。

最终 source generation：`800d60ac70149bf505c06df26168f25886947a38ca361d0cee0ae50560802bf9`；DESIGN **0.16.1**，三包私有版本仍0.1.0，384 tokens/101公开入口。正式 CSS gzip **17351/17536**，未提高预算。独立 npm tarball 安装逐个核对 ESM/CSS/types/init，React/ReactDOM/Base UI 各一份，原生无 React，未使用 packages/src alias 或消费者 flex/高度补丁。

| 检查 | 结果 | 原始证据（`.artifacts/textarea-composition/`） |
| --- | --- | --- |
| build/types/tokens/docs/单测 | 通过；单测 **523/523** | `build-final.log`、`typecheck-final.log`、`tokens-final.log`、`docs-final.log`、`unit-final.log` |
| 独立正式消费者 | 通过；公开入口、命名类型、peer与gzip门禁 | `consumer-final.log`、release metadata |
| Chromium 新组合 | **64/64**：两端plain/Dialog及stacked/Sheet ×3主题 ×1280/390 ×16/32字号48项；交叉容器rows4共4项；单侧Addon4项；默认未启用2项；真实Chrome200%缩放6项 | `browser-final.json`、`screenshots/` |
| 原自动增高回归 | **30/30**：原Dialog全矩阵及真实缩放 | `regression-final.json` |
| Firefox / WebKit 精选 | 每引擎 **8个唯一用例通过**，包含两端窄屏200%文字stacked/Sheet、rows4交叉容器及默认行为 | `firefox-keyboard-final.json`、`webkit-keyboard-final.json`；Chromium只读真实按键的2项定向复验 `chromium-keyboard-final.json` 不重复累计 |

检查真实高度增长、5行封顶/内部滚动、删除缩回、rows下限、受控更新、原节点/选区/焦点、上下/单侧工具区、readOnly/disabled/busy、无额外input事件、合成composition与实际文字输入、恢复默认flex和手动resize、Dialog/Sheet滚动、关闭回触发器和无页面横溢。真实缩放由Chrome设置页200%执行，断言DPR翻倍、CSS视口减半、根字号不变、CSS zoom=1及pinch=1。已实际查看桌面浅色、窄屏深色大字及system真实缩放截图。

初轮测试错误与trace保留，未据此放宽生产实现：多行fill的原生事件数由浏览器决定，断言改为重测/受控同步不增发事件；测试向浏览器evaluate显式传入草稿。自动化insertText作用于只读框时，WebKit会折叠选区，Firefox还会产生原生input但值未变；现用真实按键验证只读值不变、零input，另行核对公共同步/测量保留选区和不增发事件，不将浏览器/驱动注入差异归因给尺寸绑定。三个引擎相同合同重验通过，初轮与定向报告保留。

未跑xAgent真实页面、后端/认证/生产部署、移动OS实体键盘/读屏器、独立SSR hydration和全仓浏览器/watch/coldstart；合成IME不等于OS IME验收。侧栏两项的独立证据见下节，不重复累计；最终正式包同时包含该侧栏提交及此修复，宿主仍需按固定产物接入验收。

## 底部导航开关与业务 footer 同行（2026-10-15）

基于固定 `511383729302901d8ff7284f520a943519ee7051` 补齐同一侧栏公共布局合同。React MenuLayout/AppShell、原生 createMenuLayout 新增可选 `sidebarTogglePlacement='top'|'bottom'`；默认 top 保留旧位置，bottom 将原控件放在菜单和可选业务 footer 之后，顶部没有占位。窄屏仍移动同一个按钮到顶栏打开原 drawer；折叠/抽屉/roving/导航事实沿用原 owner。直接 AppShell 入口是 `/layout`，没有新增 `/app-shell` 别名。

新增 React `/layout` 和根入口的 `SidebarFooterRow`，原生使用公开 `.xui-sidebar-footer-row`，只启用自然宽度、按空间换行的行排列。原 footer 的递归全宽规则在 Row 内不再强制，Button 的 icon/size 尺寸保留；未使用 Row 的默认 footer 保持全宽。长版本/授权事实完整换行，紧凑 rail 按分组纵排并保留 SidebarFooterContent 的 icon/label 合同。业务返回、更新、版本来源、权限/disabled/busy 均由宿主提供。完整合同和代码见[侧栏底部](COMPONENTS.md#侧栏底部接入与迁移)及两端[示例](../examples/sidebar-footer-react/app.tsx)。

source generation 为 `eb2537520a8ebcafd525bd9f83967cc3fc2785873c758e0cd9856d07a4e719fa`；DESIGN 0.16.0，384 tokens，101 manifest入口，三包仍为私有 0.1.0。正式 CSS 113800 bytes / gzip17338，未提高17536预算。独立 tarball 消费者逐项验证 ESM/CSS/types/init、Root及子入口命名类型、合法枚举与非法值负向编译；React/ReactDOM/Base UI 各一份，原生无 React，无源码 alias。

| 检查 | 结果 | 原始证据（`.artifacts/sidebar-bottom/`） |
| --- | --- | --- |
| build / types / tokens / docs / 单测 | 通过；完整单测 **523/523** | `build-final.log`、`typecheck-final.log`、`unit-release.log`、`tokens-release.log`、`docs-release.log` |
| 正式 tarball 消费者 | 通过；公共入口、同代包、CSS和peer门禁 | `consumer-final.log`、release metadata |
| Chromium 新组合 | **51/51**：React MenuLayout/AppShell、原生 MenuLayout × 三主题 × 1280/390px × 根字号16/32共36项；document/workspace长版本及移除footer6项；真实Chrome200%缩放9项 | `browser-final.json`、`chromium-targeted-final.json`（4项定向复验，不重复累计）、`screenshots/` |
| 默认兼容回归 | **84/84**：原 sidebar-control/sidebar-footer/menu-layout 全部 | `regression-final.json` |
| Firefox / WebKit 精选 | 每引擎 **9/9唯一用例通过**：三种组合的桌面浅色、窄屏200%文字深色与document长footer | `firefox-final.json`；WebKit初轮7/9及 `webkit-targeted-final.json` 中失败两项2/2 |

新专项真实检查324px展开/60px compact（随根字号缩放）、短菜单与80项长菜单的独立滚动、footer同行及busy/disabled、唯一开关的点击/Enter/Space、aria-expanded/controls、菜单单一Tab停靠及方向键、footer→开关Tab顺序、top/bottom更新后的同一焦点/按钮/滚动、断点移动后同一侧栏/业务footer/草稿节点和焦点、完整焦点环与末项可达。长中文/版本和放大场景自然换行；抽查浅色桌面、深色大字drawer与真实缩放截图。Chrome缩放通过设置页操作并核对DPR翻倍、CSS视口减半、根字号不变、CSS zoom=1、visualViewport.scale=1。

候选构建曾因SSR class组合向cx传入false而失败，按已有cx类型改为undefined，未放宽类型。WebKit初轮的两个失败是窄屏→桌面后立即读取DOM，测试未等待React媒体状态；已等待桌面可访问名和公开placement事实，保留严格的末子节点/焦点条件，生产代码未因该失败修改。原报告及trace保留，不将复验重复算作新增通过。

未跑xAgent真实页面/认证/API/部署、移动OS/读屏器、独立SSR hydration和全仓浏览器/watch/coldstart；这里只验证合成公共消费者，不代表宿主已升级。旧511归档及已交付Portal能力保持不变。同轮另行核对的stacked Textarea增长缺陷由独立修复提交处理，不把侧栏验收当作该项已通过。

## Popover.Content 的 Portal 容器（2026-10-15）

以 xAgent 实际固定的 `595380a6d2467d56623a0df0dedc026e0331a4ff` / DESIGN 0.13.1 对照修改前 main `57f4e8c0f8c7c640b4f8b1faa1fbf7438581d27f`：Popover 实现未变化，Content 尚无容器扩展。当前新增 React `/popover` 与根入口的 `PopoverContentProps`、Content.portalProps；复用公开 Portal 类型与原有 Root/Positioner/Popup，不新增叠层、焦点或打开状态 owner。实际类型、默认值与就绪接线见[组件手册](COMPONENTS.md#popover-的-portal-容器)，独立消费者为[Dialog/Sheet 示例](../examples/popover-portal-react/app.tsx)。本轮只改 xui，没有升级或修改 xAgent、业务 API、后端或认证。

首个正式包候选在 390px/200%文字下通过内滚、搜索与节点连续性，但 Escape 关闭后父 Dialog 的恢复帧覆盖了子 Popover 回焦点，原始失败保留于 `critical.json`/`critical-run.log`/trace。该 peer 1.7.0 竞争发生于移除持焦的嵌套 Portal；默认目标没有该失败，公开 keepMounted 策略也可避免它。最终 Content 对显式 container 默认 keepMounted=true，让 peer 隐藏稳定子树；省略 portalProps 保持原目标/关闭卸载，关闭父模态释放子树及 Portal ref。显式 keepMounted=false 仍采用 peer 卸载语义，模态内 Escape 回焦点限制未被修复或伪称通过；该覆盖项仅验收触发器关闭和确实卸载。

另一候选的 RefObject 在模态节点就绪前挂载保留子树，current=null 时按 peer 回退父 Portal，产生错误目标；失败为 `critical-retained.json`。正式示例改为节点就绪后挂载 Content，再传已就绪稳定的节点或 RefObject，没有改私有 DOM、手工搬节点或轮询 ref。类型消费者验证 HTMLElement/ShadowRoot/RefObject/null/undefined；callback container、选择器字符串和 portal children 均为负向编译检查，Portal callback ref 则可编译。原生 createPopoverController 没有 React Portal 参数，本轮不改原生定位/焦点职责。

最终 source generation 为 `47bcfa6a217451d6193b32bdc35982941f970593b8bf89ba0a1528694a233300`，DESIGN 0.15.0，三包仍为私有 0.1.0；384 tokens、默认变量 CSS 指纹、101 个 manifest 入口和既有 gzip 预算不变。正式消费检查逐项对比 ESM/CSS/types/init 与本代产物，保持 React/ReactDOM/Base UI 各一份、原生无 React，不使用 packages/src alias。CSS 为 17239 gzip bytes，未新增组件 CSS 或提高 17536-byte 预算。

证据集中于 `.artifacts/popover-portal/`，正式固定源码 SHA、三包摘要及可复制消费者随交付归档记录。

| 检查 | 结果 | 原始证据 |
| --- | --- | --- |
| 构建 / types / tokens / docs / 单测 | 通过；完整单测 **522/522**，384 tokens，101入口 | `build-final.log`、`typecheck-final.log`、`tokens-release.log`、`docs-release.log`、`unit-release.log` |
| 独立正式 tarball 消费者 | 通过；真实 ESM/CSS/types/init、命名类型及 peer/打包边界 | `consumer-final.log`、正式 metadata 与消费者 metafile |
| Chromium 新组合 | **38/38 唯一用例通过**：24项两类容器×三主题×桌面/390px×根字号16/32，默认兼容2、keepMounted2、显式卸载2、正常动效2、真实200%浏览器缩放6 | `browser-final.json`（36）及 `animated-final.json`（2），截图/几何及 `screenshots/` |
| 相关默认浮层 / 原生回归 | **38/38**：旧边界36（含两端及6项真实缩放）、foundation菜单/Popover/Tooltip生命周期2 | `regression-final.json`、`foundation-final.json` |
| Firefox 精选 | **8/8**：两类模态的浅/深390px根字号32、默认目标与保留子树 | `firefox-final.json` |
| WebKit 精选 | **8/8**：两类模态的浅/深390px根字号32、默认目标与保留子树 | `webkit-final.json` |

新组合实际检查搜索/空结果/键盘选择/取消/后续确认、受控拒绝关闭与宿主打开、草稿/选区/节点身份、单一可见 backdrop、隐藏搜索退出 Tab 顺序、内滚/末项命中与完整焦点环、Escape 分层回到同一触发器及父模态卸载释放。system 在打开状态跟随浅深切换且保留节点/焦点。真实 Chrome 缩放通过设置页操作，核对 DPR翻倍、CSS视口减半、根字号不变、CSS zoom=1、visualViewport.scale=1；不是用CSS放大替代。抽查了浅色Dialog、深色Sheet与实际缩放的可见内容及焦点截图。

未跑：xAgent 四处真实消费页面及其认证/网络/部署、ShadowRoot 的浏览器运行场景、独立 SSR 自定义容器、移动OS/触屏和读屏器、全仓全部浏览器用例与冷启动/watch。不能把本轮合成消费者验收当成 xAgent 已升级或产品验收。`critical.log` 的首次 grep 没有收集到用例，不计为任何行为通过；候选失败与最终通过分别保留。

## xLead 公共接入反馈（2026-10-15）

以正式595380a / DESIGN0.13.1对照当前main排重，五项均未已有解决：原生装饰logo空alt、完整登录及新密码组合的显隐文案转交、Key已确认吊销后的能力读回为公共缺陷；初始化手动只读核对与Textarea自动增高为显式可选扩展。此次仅修改xui，没有修改xLead、其它消费方或baseservice，也没有新增后端端点/DTO/密码策略。

| 反馈 | 已实现公开合同 | 责任边界与兼容 |
| --- | --- | --- |
| AuthPage空alt | 原生比较getAttribute('alt')，空字符串在首次创建也显式输出；更新/移除/重加与React一致 | 继续采用完整公共页，不要求消费者修改节点 |
| 显隐密码翻译 | LoginPageConfig.labels与NewPasswordLabels均新增可选showPassword/hidePassword；新密码/确认两个输入同步转交，AdminSetupPage的passwordLabels沿用 | 默认英文不变；旧完整labels对象仍可编译；不改变认证、清密或固定6–32码点规则 |
| 吊销后权限陈旧 | 已确认revoke后通过现有adapter.list读取一次权威metadata/capabilities | 成功前后均不推断删除授权；读失败保留已知revoked和锁定能力，使用原列表错误/刷新入口，不重放revoke；事务/权限/CAS仍归后端 |
| 初始化复核 | 可选onCheck({signal})返回complete/unconfirmed/unavailable；底层controller.check()；checking与checkFailed反馈 | 仅手动只读；异常/非法结果不解锁写入，不创建会话或导航；宿主提供权威回调和期限。未配置时无新动作。穷举AdminSetupStatus的代码需处理新增checking分支 |
| Textarea自动增高 | React autoResize={maxRows}；原生/dom的bindTextareaAutoResize/update/destroy | 默认关闭，已有rows/CSS下限保留；增长、上限滚动、缩回，保留value/选区/焦点/IME及所属Dialog滚动。只拥有尺寸，未新增皮肤 |

初始化写入/复核复用同一个controller；挂起、权威状态替换与销毁会中断本地等待，拒绝迟到结果，即使宿主忽略AbortSignal也不会悬挂本地调用者。这不证明后端已撤销已提交事务。完整登录与改密的合成消费者分别采用相同公开输入，原生不会安装React。

规范升至0.14.0，384 tokens、默认变量CSS指纹与101个manifest入口不变。最终package source generation为`02c5446c1133239437f50aecd48f45c9e779595ad59b2ccba085da7bc9b78d45`；三包仍为私有0.1.0，必须连同固定源码SHA和正式tarball识别，未发布registry。独立消费者逐项核对ESM/CSS/types/init与peer单实例；完整CSS仍为17239 gzip bytes，既有17536预算未提高。

证据集中于`.artifacts/xlead-public-feedback/`。首轮unit519/520，唯一失败是旧合成revoke只计数、普通list永远返回expired；修正夹具中的权威状态后page-api14/14通过。最后两项补充为忽略abort的本地等待终止，以及新密码组合显隐文案；最终六文件定向单测49/49，不宣称全仓完整单测已在最终代重跑。

首次专项27/48，15项是新增原生示例误用React的xui-dialog类，导致关闭后仍可见；改用已有公开xui-native-dialog。另6项完成消息断言匹配到密码强度status，改为精确定位完成反馈，不改产品行为。更正后候选48/48通过；其后补齐NewPasswordFields同根转交和正式改密消费者，最终结果以release报告为准。一次既有回归在确认失败根因后中断，原日志保留：旧密码模糊label会匹配新增中文显隐按钮，简单exact又漏掉必填星号，最终使用限定标签正则；Key手动再试成功后按新合同多一次普通读取，计数同步而非删除断言。跨引擎第一次尝试继承了Chromium专用可执行路径，未执行有效引擎验收即停止，独立config清除该启动项后再验证；不将启动候选算成Firefox/WebKit通过。

| 最终同代检查 | 结果 | 原始证据（`.artifacts/xlead-public-feedback/`） |
| --- | --- | --- |
| 构建 / types / tokens / 定向单测 | 通过；384 tokens；六文件49/49，未重跑最终全仓完整单测 | `build-release.log`、`typecheck-release.log`、tokens/unit release日志 |
| 独立正式tarball消费者 | 通过；101入口、17239 gzip；React/ReactDOM/Base UI单实例，原生无React | `consumer-release.log`及正式metadata/peer树 |
| Chromium新专项 | **52/52**；双端三主题/宽窄/根字号16或32，6项真实浏览器zoom200%，初始化与改密双字段显隐/清密/忙态 | `browser-release.json`、`browser-release-output/` |
| Chromium相关回归 | **192个唯一用例各自通过**；原164项中154先通过，10项英文标签旧预期同步后复验通过，另28项登录视觉首次通过；不重复累计复验 | `regression-final.json`、`regression-labels-rerun.json`及各自log/output |
| Firefox / WebKit精选 | **各12/12**；两端200%文字Textarea/Dialog、装饰logo、完整登录中文、新密码组合、手动只读复核 | `firefox-release.json`、`webkit-release.json`及对应log/output |

真实Chrome缩放分别断言CSS视口减半、DPR翻倍、根字号不变、CSS zoom=1与pinch=1，不拿根字号放大替代。Textarea检查原节点、原选区、焦点、增高/缩回、超过行数内部滚动、恢复默认resize、只读/禁用、输入与composition事件不增发、Dialog关闭回触发器；IME为合成事件与真实文本输入，不声称实体移动键盘验收。初始化/改密示例均只调用合成宿主回调，未触达真实写接口。最后的回归10项错误完整保留；修正的是配置已中文化后的对应名称断言，没有删除状态、像素、键盘或清密检查。

xLead原26项真实产品回归属于595380基线，不能替代本轮库级合成消费者结果。其产品升级、回调接线和实际后端回归由采用项目另行执行。本轮未跑全仓浏览器套件、真实移动OS/Wails、读屏器、生产会话或真实Key/初始化事务。

本批曾仅记录xAgent固定595380的Content容器缺口，未在xLead反馈批次实现；后续公开增强与嵌套弹层验收见本页[Popover.Content的Portal容器](#popovercontent-的-portal-容器)。历史固定产物本身没有被补写能力。

## 长内容 Popover 碰撞尺寸（2026-10-15）

固定0fd37c1与本轮修改前ad9dc9d的Popover/原生定位器/浮层CSS相同。独立正式包消费者用公开React Popover.Root/Trigger/Content/Title、`positionerProps={{align:'end'}}`及className宽度扩展复现：390×844、根字号32px、12项合成上下文数据，Popup top256、height591、bottom847，底边超出3px；原生同样内容bottom812，无越界。说明这不是宿主误用入口，也不需要宿主改成其它组件或编写内部CSS补丁。

Base UI 1.7.0把available-height/width赋给外层Positioner，其可用空间包含外壳；xui外壳又在对应轴上有两侧floating-offset留白，而原Popup上限直接使用整个available-height。修复在正式floating.css中为top/bottom内容高度扣除双侧语义gap，left/right对宽度同理；视口上限、offset、默认碰撞/side/align及受控/回调/节点生命周期均保持既有合同。原生controller已单独扣视口inset与锚点gap，不重复扣React外壳留白，不修改原生事件或新增状态owner。修复后上述React top256、height575、bottom831，完整border box留在844px视口内，长内容和末行焦点在内部可达。

DESIGN补丁版本0.13.1，384 tokens及默认变量CSS指纹不变；公开exports/types/API数量仍101。package source generation为`5b91a45f693b7375cd28b263fb974659849ba26ea8de079077b0cb218a3aef66`。独立tarball消费者的ESM/CSS/types/init、React/ReactDOM/Base UI单实例与原生无React检查通过。完整CSS gzip17239 bytes，在既有17536预算内，本轮不提高预算。边界fixture自身只用公共组件/原生controller、公开className宽度及宿主工具栏布局，不添加高度/碰撞补丁。

新专项、回归、跨浏览器及原始失败证据集中于`.artifacts/popover-boundary/`。基线原始报告`baseline-measured.json`为React失败、原生通过；不是产品现场验收，未连接xAgent/API/认证/后端。首次关键用例30/36，余下6项是测试假设：桌面普通字号内容能够自然放下、不应强制产生滚动；桌面大字的外点控件中央被合法弹层覆盖，改为点击可见部分而非force click。跨引擎候选另揭示程序化focus不必产生Firefox键盘焦点环，以及WebKit鼠标点击button不必转移焦点；最终用真实Shift+Tab/Tab与外部文本框验证，不放宽几何、outline、草稿、受控拒绝关闭及节点身份断言。

| 检查 | 最终结果 | 原始证据（`.artifacts/popover-boundary/`） |
| --- | --- | --- |
| 构建 / tokens / types / 单测 | 通过；384 tokens；unit首跑511/512，规范版本正则同步后contract文件5/5通过，其余511项有效 | `build.log`、`tokens.log`、`typecheck-final.log`、`unit.log`、`contract-test-rerun.log` |
| 独立正式消费者 / CSS与peer | 通过；101入口、17239 gzip bytes；同代安装包与React单实例、原生无React | `consumer.log`、`rebuild-fixtures.log`及正式metadata |
| Chromium新边界与连续性 | **36/36**；24项双端主题/桌面或390px/根字号16或32px矩阵、4向显式碰撞边界、2项正常动效、6项真实Chrome zoom200% | `browser-accepted-final.json`及截图/trace |
| 相关浮层回归 | **82/82**；80项相关选择/日期时间/菜单等回归及2项foundation的menu/popover/tooltip生命周期 | `regression-final.json`、`foundation-popover.json` |
| Firefox / WebKit精选 | **8/8唯一用例通过**；每引擎两端390px/200%文字和正常动画各4项，失败后定向复验不重复累计 | `firefox-keyboard-outside-rerun.json`、`webkit-keyboard-outside-rerun.json`、`webkit-tabcycle-rerun.json`及原动画报告 |

最后一次测试fixture又发现React接受关闭的测试状态尚未提交就发Escape的竞争（候选33/36），通过等待fixture的getAccept事实回传消除，未修改产品或组件事件。该只读测试探针更新后，按相同已安装正式包重新打包fixture并再次通过36/36；未重复构建包或改变包代际。WebKit按当前Mac平台采用Option/Alt+Tab和反向组合遍历原生控件，未改变全局系统设置、tabindex或focus样式；Tab与Option-Tab的差异见[Apple键盘合同](https://support.apple.com/en-in/guide/safari/cpsh003/mac)。这项端差异不能误报成组件几何失败。

Escape恢复同一trigger；外点若用户已聚焦另一输入，则保留新焦点，不以“回焦点”为由抢回。这个既有peer/native语义未改为全局focus trap或强制回触发器。React关闭后是否卸载仍按原peer生命周期，节点连续性检查针对保持打开和受控更新。没有修改xAgent固定依赖或旧0fd37c1归档；新修复须由宿主另行授权采用相应固定产物。

未跑全仓完整浏览器套件、真实移动OS/Wails、读屏器或xAgent现场API；不声称这些路径通过，没有registry发布。

## 导航名称滚动、首行对齐与 324px 默认侧栏（2026-10-15）

规范升至0.13.0，默认主题384 tokens。经用户明确确认，桌面展开侧栏默认由216px提升到324px（`nav-item-height × 9`）；60px compact rail与视口约束的288px窄屏drawer独立保留。此项会改变所有使用默认展开宽度的消费页面，需随固定正式包升级并复核主内容净宽，不能把历史216px或未升级产品截图当成新版事实。

React `NavigationMenu`/`MenuLayout` 与原生 `NavigationMenuOptions`/`createNavigationMenu`/`createMenuLayout` 共用新增 `labelOverflow?: 'wrap' | 'marquee'`、`actionAlignment?: 'center' | 'start'`。默认wrap/center保持兼容。显式marquee仅移动公开名称部件：React `NavigationMenu.Label`、原生`createNavigationLabel`；富描述、Badge、图标与分支/配置按钮不移动。默认纯文本名称自动组合；自定义renderer显式声明名称，不猜私有标签。独立动作在空间足够时与首行同轴，空间不足时折到下一行并保留主项最小空间；compact维持既有堆叠。没有新增路由、查询、权限或配置owner。

可hover的精细指针及键盘主项焦点以400ms延迟、40 CSS px/s单次滚至末端保持；离开/失焦取消并复位。触控、无hover、减少动效或缺少Web Animations时显示完整静态换行名称。RTL向逻辑末端滚动；名称、选项、几何及媒体变化更新同一controller，卸载释放监听、观察器、计时器和动画。`internal/navigation-presentation`仅为双端包间接线，已列入完整exports索引，非消费者稳定API。

最终 package source generation 为 `d85924520822d80660201d011590e3bf001ba95ad5df9d7c031f95a1d18df2e1`。独立tarball消费者逐个核对正式ESM/CSS/types/init；React/ReactDOM/Base UI单实例，原生无React。完整CSS为112549原始字节、17187 gzip字节，比上一交付16767增加420字节；新增8个主题token和导航样式后，原16768-byte门禁不再够用，本轮仅将该预算增加768至17536，Button/JS等其他预算不变。

最终执行证据集中在 `.artifacts/navigation-presentation/`，均使用上述同代正式包。unit首跑511/512，缺失内部manifest入口映射导致文档守卫失败；补齐PUBLIC_API映射后文档用例1/1通过，其余511项结果有效，没有重复运行整套512项。不是全仓浏览器套件、消费产品或生产API验收。

| 检查 | 最终结果 | 原始证据 |
| --- | --- | --- |
| 构建 / tokens / types / unit | 通过；384 tokens；512项各自通过（511项原结果＋文档1项修复后复验） | `build-final.log`、`check-tokens.log`、`typecheck.log`、`unit.log`、`docs-test-rerun.log` |
| 独立正式消费者 / peers / 体积 | 通过；101个manifest入口、双端正式ESM/CSS/types；CSS 17187 gzip bytes | `consumer-final.log`及正式metadata |
| Chromium新名称/对齐专项 | **32/32唯一用例通过**：24项双端主题/1280或390px/根字号16或32px矩阵，加滚动、更新/RTL、减少动效/触控、禁用/分组/compact；静态多行首行对齐另定向复验2/2 | `browser-final.json`、`browser-disabled-rerun.json`、`reduced-first-line.json`及各自截图/日志 |
| Chromium相关回归 | **314/314唯一用例覆盖通过**：数据表布局、布局/字体、菜单、分支翻译、页面编排、侧栏开关/页脚、workspace；中断首轮与修复后82/82去重，不重复累计 | `regression-final.log`、`recheck-final.json`与`coverage-summary.json` |
| Chrome真实浏览器zoom200% | **12/12**；rich-navigation与page-composition各6项，双端三主题 | `zoom-rich-navigation-final.json`、`zoom-page-composition-final.json` |
| Firefox / WebKit精选专项 | **12/12**；每引擎6项，双端桌面首行、鼠标/键盘单次滚动及更新/RTL | `firefox-final.json`、`webkit-final.json` |
| 文档 / 差异 | 通过；10文件、642链接、101公开入口、1 skill；无空白错误 | `docs-final.log`、提交前差异检查 |
| Stitch实际截图视觉终审 | **4/4 Pass**；React浅色、原生深色、390px/200%文字及名称滚动末端截图 | `stitch-final-approval.txt/.png` |

相关回归首轮有7项失败，都是已过时的测试前提：窄屏Sheet仍期望384px而已交付合同为全宽、原生名称仍定位strong、桌面开关仍定位顶栏。改为公开名称部件与现行布局/焦点归属，并保留原几何容差、滚动、草稿及节点连续性断言；对应三个文件82/82复验通过，生产代码未因此再改。首轮被明确中断，原始逐项执行以log为准；后续收集报告另命名为`regression-collection.json`，不是执行结果。去重摘要明确列出日志与复验JSON的来源。

Stitch已核准全局324px范围、可读降级和动作折行，并对4张正式包合成截图给出视觉终审Pass。其视觉判断不替代动态交互实测、辅助技术或产品现场验收；真实Chrome缩放另核对视口、DPR、根字号未变、CSS zoom=1、pinch=1，未用CSS缩放冒充。

早期窄屏/200%文字候选真实出现名称0px：独立按钮挤占全部可用空间。由公共布局保留主项最小宽度并允许动作落到下一行修复，原名称可读性断言未放宽。一次候选浏览器在正式消费者复制完成前读到旧CSS，已等待同代消费者完成后重跑。新专项初跑30/32，余下两项仅在收拢过渡开始立即量到324px；改为等待最终60px几何后2/2通过，生产代码未因该测试再改。失败日志/trace保留并与最终复验分开。

本轮不修改xAgent/Argus或其他消费者、业务API、认证、后端；未跑真实移动OS/Wails、读屏器或全仓完整浏览器套件，没有registry发布。

## 导航侧栏内部收起/展开（2026-10-15）

规范升至0.12.0，默认主题376 tokens及默认变量CSS指纹不变。React AppShell/MenuLayout与原生createMenuLayout将桌面唯一开关放在侧栏内部顶部独立辅助行，展开时靠末端、60px紧凑栏居中；窄屏同一按钮节点移到顶栏打开既有drawer。继续使用既有collapsed/defaultCollapsed/onCollapsedChange、sidebarOpen/onSidebarOpenChange与名称接口，原生setCollapsed/update遵守相同受控合同。没有新增位置/私有DOM接口、第二个按钮或抽屉；默认位置变化须随正式包升级获得，公共types/exports保持兼容。

最终 package source generation 为 `cf3565e72fbd8c8bf5005383ff46ded8221020acfd49dc70437a2d3f868980c4`，public API SHA256仍为 `d7ecf90266c528676481a0e1ee1dccbfb51232999d4c20c4f7f99e22372988c8`。独立正式tarball消费者同时核对ESM/CSS/types，React/ReactDOM/Base UI单实例；完整CSS gzip 16767 bytes，在既有16768-byte预算内，本轮没有提高预算。

| 最终同代检查 | 执行结果 | 原始证据（`.artifacts/sidebar-control-final-generation/`） |
| --- | --- | --- |
| 构建 / tokens / types / unit | 通过；376 tokens、**512/512** 单测 | `build-final.log`、`tokens-final.log`、`typecheck-final.log`、`unit-final.log` |
| 独立正式消费者 / 体积 / peers | 通过；双端正式入口/类型/产物，公开API未扩张 | `consumer-final.log`及最终元数据 |
| Chromium 新导航专项 | **26/26**；24项双端主题/1280或390px/根字号16或32px矩阵，2项跨断点节点与焦点连续性 | `sidebar-control-final2-browser.json`、对应截图目录 |
| Chromium 相关回归 | **216/216**；头部、侧栏/页脚、导航富条目/翻译、workspace、页面编排和foundation | `related-regressions-final.json`、对应输出目录 |
| Chrome 真实浏览器zoom200% | **12/12**；rich-navigation与page-composition各6项，两端三主题 | `rich-navigation-zoom.json`、`page-composition-zoom.json` |
| Firefox / WebKit 响应式焦点 | **4/4**；Firefox/WebKit各2项同节点/aria/焦点与宿主输入连续性 | `firefox-responsive.json`、`webkit-responsive.json` |
| 文档 / skill / 差异 | 通过；639文档引用、100公开入口、1 skill；skill frontmatter有效，差异无空白错误 | `docs-final.log`、skill验证与提交前检查 |

上述是受影响范围的专项结果，不是全仓完整浏览器套件。根字号200%核对计算值；真实Chrome缩放另核对视口、DPR、未改根字号/CSS zoom/pinch的事实。按钮焦点环、Enter/Space、aria-expanded/controls、桌面/窄屏开关归属、长中文、同按钮/侧栏/草稿节点与宿主新焦点均按实际浏览器检查。主题system跟随已有owner；本轮不另建storage或主题状态。

早期候选的24/26与24/26揭示跨断点把有焦点按钮移入隐藏区域后丢失焦点，以及原生共享shell自己的media listener覆盖aria状态。修复跟踪该控件的真实焦点所有权，新焦点/指针意图结束所有权；原生在共享shell布局完成后按可取消的动画帧协调一次，不用固定等待或抢回宿主焦点，销毁释放监听和帧。旧报告保留，不计作最终通过。

第一次相关回归为215/216：React首次长菜单的选中行定位早于顶部开关行占据44px空间，初始当前项下沿701px而菜单可用下沿657px。不是footer实际重叠，也不是查询或菜单失效。将定位放在开关放置及侧栏测量之后，原断言不放宽；双端viewport长菜单先2/2通过，随后上述同代26/26及216/216重验。失败trace、截图和报告保留在 `related-regressions.json`/`related-regressions-output/`，修复后证据单独归档。

Stitch已对独立正式消费者的展开/收拢桌面实际截图给出位置、同轴、密度视觉通过，记录见 `.artifacts/sidebar-control-review/stitch-visual-approval.txt/.png`。这些截图在最后的选中项定位修复前生成，布局样式与默认位置未再变化；最终长菜单截图及几何以同代回归为准。视觉审查不替代键盘、屏幕阅读器或消费产品现场验收。

会话交流作为独立页面类型写入DESIGN，不套用管理列表的标题/筛选/表格。另以固定旧包1672222制作仅合成数据的xAgent布局评估稿，保留真实领域owner的映射：阅读列与输入对齐、工具/审批跟随回合、必要执行状态和追加指导队列保留、文件按需、草稿/流式/历史连续。16项主题/宽度/根字号矩阵及合成状态/回焦点检查保留在 `.artifacts/xagent-session-design-review/qa/`，不是当前包或xAgent生产验收，也未跑该原型的浏览器zoom。Stitch批准其为可实施设计基线；唯一剩余首行分支对齐为不阻断实施的公共增强请求，尚未新增API。未修改xAgent代码、业务API、认证、查询或后端，也未自动升级消费依赖。

本轮没有重跑全仓浏览器套件、SSR hydration、读屏器、真实移动OS/Wails或消费项目生产API；没有registry发布。接入skill已同步新开关归属及已交付日期时间入口，正式CSS仍要求公开`.xui`根作用域，不能依赖宿主reset偶然补齐。

## Stitch v2 页面编排（2026-10-15）

规范按新增兼容语义升至0.11.0，默认主题的376 tokens与完整默认CSS指纹不变。新增 FormGrid/FormActions、Fieldset stack、LoadingState inline、DataRegion flow；DataTable 有行刷新不重复播放块级进入动效，侧向 Sheet 在40rem及以下全宽。Fieldset inline、LoadingState block、DataRegion reserved 默认仍保留兼容，导航 drawer 继续独立宽度。

独立正式 ESM/CSS/types 双端示例由一个合成资源 owner 提供记录、状态、分页与写入确认；主表仅保留编号、名称、状态、待办事项，配置与说明在按需 Sheet 中。没有实际高级条件时不显示“更多筛选”，清空入口按有效结果/空结果互斥出现。样例不连接业务 API，也不声称消费项目已采用。

首次独立正式消费者测得完整 CSS 为109488原始字节/16680 gzip字节；原有16512-byte门禁超出168字节。为明确新增的公共布局样式，预算仅增加256字节至16768，Button/JS等其他预算不变，最终消费者仍强制执行。

最终正式包的 package source generation 为 `fd301b7ab803078718076d48a56e13777b2af39f1845f0995e48b9cf10d8c440`，public API SHA256 为 `d7ecf90266c528676481a0e1ee1dccbfb51232999d4c20c4f7f99e22372988c8`。三包正式 ESM/CSS/types 与独立 tarball 消费者指纹一致；React、ReactDOM 与 Base UI 单实例，原生消费者不引入 React。

| 最终同代检查 | 已执行结果 | 原始证据 |
| --- | --- | --- |
| 构建 / tokens / types / unit | 通过；376 tokens、512/512 单测 | `.artifacts/page-composition-final-generation/build.log`、`tokens-after-select-fix.log`、`typecheck-after-select-fix.log`、`unit-after-select-fix.log` |
| 独立正式消费者 / 体积 / 单实例 | 通过；完整 CSS gzip 16680 bytes，在16768-byte预算内；公开类型正反例及双端参考页通过 | 同目录 `consumer-after-select-fix.log`、`react-peer-tree-after-select-fix.log`、`react-peer-singleton-after-select-fix.log`、`tarball-sha256-after-select-fix.txt` |
| Chromium 最终专项 | **99/99**，无跳过、失败、flaky 或重试；新增页面编排40项，受影响选择/日期时间/弹层/筛选等59项 | 同目录 `browser-final.json`、`browser-final-artifacts/` |
| 文档 / 差异 | 文档635引用、100公开入口通过；最终提交前另核对差异 | 同目录 `docs-after-select-fix.log` 及提交前检查 |

新增40项包含24项主题/宽度/根字号矩阵、6项连续性/提交/净宽边界、2项常规页面、2项嵌套选择Escape/回焦点和6项真实Chrome缩放。Select修复前另有既有表格/筛选/弹层/反馈回归129/129，其代码代际不同，仅作为当时受影响范围的补充证据，不将分次执行相加为全仓套件。早期候选与日志保留在 `.artifacts/page-composition-browser-candidate.json`、`.artifacts/page-composition-validation/browser-regression.json`。

检查包含495/496px容器净宽切换、最多两列/跨满、真实控件顶部对齐、长中文、动作内容宽与焦点四边余量；根字号32px明确核对计算值，真实Chrome zoom200%另核对视口减半、DPR翻倍、根字号不变、CSS zoom=1与pinch=1。刷新检查原壳/行/搜索节点身份、横滚、选择、焦点、草稿、零Document导航与失败保旧/显式重试；创建失败保留草稿，同一saving owner阻止重复提交，较早读取不能覆盖确认写入。

Stitch 对桌面列表、桌面表单、390px长中文和原生200%文字的4张实际截图均给出视觉Pass，并确认移除无事实高级筛选、保留16px组间距及自然内容尺寸。复审记录和截图位于 `.artifacts/page-composition-review/`。它的静态视觉判断不替代键盘、请求/生命周期或完整WCAG AA实测；React图标关闭与原生文字关闭是示例端间呈现，不能描述为库随缩放自动切换。

首轮示例复验修正了 MenuLayout 导航Dialog上下文截取外层Sheet.Trigger的问题：采用公共受控open与显式finalFocus，创建和详情Root同级，Header使用自带关闭入口，避免重复。早期测试的并发consumer未完成404、DOM尚未建立时设置根字号、指针操作后直接要求focus-visible均已按实际生命周期/键盘方式校正；未用缩字号、关StrictMode或隐藏内容掩盖失败。

补充嵌套选择后首轮为39/40：React SimpleSelect 展开时，Escape 到达 document 上的 Base UI Dialog 处理早于共享 popover 的关闭监听，导致选择和 Sheet 同时关闭。这是实际公共组合缺陷。共享 bindSelectControl 已在自己的展开区域处理该次 Escape，阻止继续关闭外层；确认关闭才回选择入口，被取消则保留选项焦点，关闭状态不截取下一次 Escape。传播/取消关闭两项原生单测及双端正式消费者键盘用例验证该边界，修复未要求宿主拦截私有DOM。失败日志/trace保留于 `.artifacts/page-composition-final-generation/`，修复后证据单独归档。



Select修复后的首轮扩展专项为98/99，唯一失败是既有React DateTime测试在Base UI选项初始焦点就绪前立即按Home，导致方向键从23移动至00。trace及独立重复验证确认该路径不经过本次Escape处理。测试增加“23已聚焦→Home聚焦00→ArrowDown聚焦01”的实际就绪断言，未修改DateTime源码、未加固定等待、未放宽最终01:59/单次回调/回焦点要求。双端各5次共10/10通过后，同代完整99项再次执行全过；失败保留在 `browser-after-select-fix.json`，重复证据为 `.artifacts/date-time-focus-readiness.json`。

本轮没有执行全仓浏览器整套、Firefox/WebKit、读屏器或任何消费项目生产认证/真实API验收；没有新请求/缓存/分页owner、业务协议变更或registry发布。

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

2026-10-15 接入自查标准澄清（规范0.10.2）：DESIGN给出高信噪比列表/表单/详情/多阶段任务页面组合，统一表单分组/列宽/跨列/动作与草稿规则，明确首次加载、同范围刷新、范围切换、失败、稳定身份与生命周期；ADOPTION列出实现基础检查及所需代码/Network/挂载/焦点等证据，adopt-xui按引用执行。截图审阅可确认大框小控件、混排、空表与常驻技术说明等问题，不能证明实际请求链路或组件来源。文档链接、skill frontmatter与公开100入口检查通过；contract5/5核对376 tokens、CSS指纹及历史协议边界，diff检查通过。本次只修改规范、元数据与对应版本断言，没有修改运行时代码或消费项目；未重跑浏览器、完整单测或重新打包，之前0220435固定代码产物保持原样，不将这些规范声明冒充产品页面整改通过。

## 2026-10-15 NavigationMenu 分支名称浏览器验收

`NavigationMenuOptions` 新增 `expandBranchLabel` 与 `collapseBranchLabel`，供 React 与原生公开组合按当前 item/确认展开状态提供 accessible name；未提供时保留 `Expand …` / `Collapse …` 默认值。双端 rich-navigation 示例通过独立安装消费者构建，`window.navigationLabelsDemo.update` 仅为示例验收桥；`projectItems` 只替换示例项目数据以验证真实菜单的 disabled 继承，不是产品 API。

| 门禁 | 最终结果 | 范围与证据 |
| --- | --- | --- |
| build / 类型 / token / unit | build generation `118f347dfeb0`；typecheck、check:tokens 通过；504/504 unit | `.artifacts/navigation-labels-validation/build.log`、`typecheck-final.log`、`check-tokens.log`、`test-unit.log` |
| 正式 consumer | React 与 native 独立 tarball 安装、公开 exports/types/CSS 与 gzip 门禁通过；native 无 React 导入 | `.artifacts/navigation-labels-validation/test-consumer-final.log`；React peer tree 显示 React 19.2.8、ReactDOM 19.2.8、Base UI 1.7.0 各单实例，app 与 xui 的 resolve 路径一致，见 `react-peer-tree.log` / `react-peer-singleton.log`；仅从已打包 xui 入口构建，不用源码 alias |
| 导航浏览器 | 40/40 通过：新增双端动态默认/中英文标签、DOM identity/aria-controls/focus、受控展开外部接受/拒绝、Enter/Space 单次回调、disabled 继承与 roving 跳过；加既有 rich-navigation 回归 | `.artifacts/navigation-labels-validation/navigation-browser-final.json` 与 `navigation-browser-final.log` |
| 视口/字号矩阵 | 24/24：React/native × light/dark/system × 1280/390px × 根字号 100%/200%；检查焦点四边和视口几何、真实展开/收起点击、无页面横向溢出 | 同上 JSON；查看的代表截图在 `.artifacts/navigation-labels-validation/` |
| 真 Chrome 页面缩放 | 6/6：React/native × light/dark/system，Chrome 设置 Zoom 200%，DPR 1→2、CSS 视口 1280×813→640×406、根字号仍 16px、CSS zoom=1、pinch scale=1；检查分支键盘展开、中文名称、焦点和横向溢出 | `.artifacts/navigation-labels-validation/navigation-zoom-final.json`、`navigation-zoom.log`、对应 PNG/JSON 附件 |

实际查看浅色桌面、深色窄屏 200% 根字号、system 窄屏 200% 根字号，以及真页面缩放下的深浅主题截图。窄屏侧栏用公开“工作导航”按钮打开；焦点保持在分支按钮，图标与右侧独立动作仍可见。首轮浏览器运行的 14 项失败是测试脚本未序列化 Node 变量、窄屏没有打开抽屉；修正测试编排后整批 40/40 通过，生产实现未因该首轮失败修改。既有 rich-navigation 回归覆盖主链接、独立配置 action、ContextMenu、Escape 回焦点和菜单键盘顺序。其它浏览器、读屏器及消费产品集成未在本轮执行。
