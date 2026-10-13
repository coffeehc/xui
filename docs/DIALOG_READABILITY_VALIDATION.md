# Dialog 基础层可读性验收

基线3afbcf5的完整CI成功不代表所有G2合同已验完。本批只处理已有Dialog/Sheet组合、标题角色和库内Key示例的长说明；不改业务权限/写入回执/主题风格，不新增弹层API。

## 已核规范与生产偏差

- DESIGN第946/968条：header使用section-title/600，body内滚、footer可达。旧 `.xui-dialog-title` 只有margin，继承浏览器h2角色；现明确消费 font-weight-heading/font-size-section-title/line-height-section-title/font-sans。
- APIKey双端旧结构为Title、Description、Body、Footer四个直接flex子项。390px根200%实图显示长说明挤占外部轨道，Body被压为细条。说明移入唯一Body，完整原文和唯一aria-describedby指向保持；React使用既有xui-stack，native已有同类。没有将必要风险说明折叠/截断。
- Header/CloseButton已有正式公共出口。Footer Close仍为普通动作；不从普通Close推断它是右上X，不重复注入关闭控件。

## 本批真实浏览器门禁

`dialog-readability.spec.mjs`：2端×3主题共6例，每例覆盖1280×800、390×720根200%、320×480；检查标题token、说明唯一ID/可访问描述、初始输入focus四边位于Body内容盒、footer在viewport内、普通滚轮读取长说明首末行、Esc回原入口且零PUT。截图用完整viewport，保留外环绘制空间。

`focus-boundaries.spec.mjs`既有62例继续执行。原长标题只测标题与X的横向不重叠，未测Body被挤压；本轮补Body至少容纳首个控件及外环、footer可达的强断言。若极端标题或短窗口失败，记录实际图/几何后确定最小公共组合；不通过固定像素高度、裁掉标题、第二说明滚动owner或放宽断言解决。极端短窗口无法同时展示所有动作时仍需整体触控可达方案，不能只凭Esc关闭判定通过。

本地build、362 tokens、类型、523单测与完整独立React/native tarball消费者通过；安全CI尚待本候选。没有真实浏览器结果前不得宣称G2全部可用。Input截图边界与OS/读屏未测继续见基础门禁，不因本批推进删除。

## d30c4b0 实测结果（2026-10-13）

安全 CI [38475767248](https://github.com/coffeehc/xui/actions/runs/38475767248) 的 Dialog 前置门禁为 66/68，通过的 6 条长警告用例包含三种窗口/字体组合；失败为 React/native 的长 Header 标题各一条。390px、根字号 200% 时，固定 Header 的八行标题与三行说明占满可用高度，Body 实际 clientHeight 仅 8px，而当前控件和焦点空间需要 80px。失败截图还显示底部 Save 操作被弹层裁切。这是公共旧组合的真实缺陷，不能用将示例标题移入 Body 替代修复。

523 单测和正式消费者通过；此运行在前置门禁失败后未执行后续 Input、Auth、focused、watch、cold-start、full browser。稳定消费包仍为已完整通过的 3afbcf5。已检查实际长 Header 失败截图及长警告修复后的 390px/200% 输入焦点整页截图；后者名称输入的四边焦点环与底部动作可见。

下一修复必须区分正常窗口的 Body 单滚动 owner 与极端高度下整体可达的 fallback。极端情况下不能承诺标题、所有表单和 Footer 同时同屏，但必须保证关闭、标题说明和全部操作可滚动到达，且不能同时产生两个竞争的活动滚动 owner。保留旧长 Header 组合回归及正常 Footer 同屏断言。

## 下一候选：共享单一滚动 owner

默认 CSS 整体可滚动且 Body 自然高，SSR/缺少 ResizeObserver 时保留触控可达性。内部共享测量只切换 data 属性；正常窗口切 Body 内滚，极限窗口恢复整体滚动。预算同时受实际固定高度（含 top/bottom Sheet）与 max-height 约束，所有尺寸采用不含 transform 的 CSS 布局像素，避免入场 scale 低估标题。稳定外层 scrollbar gutter 保持两模式标题换行一致；Body 最小需求由 DESIGN 的 dialog-body-min-block-size 派生，不使用任意内容高度。React peer ref 及其 cleanup 保留，观察器/帧/事件在销毁时释放。

正式门禁保留旧组合长标题失败复现，增加动态标题/字体和短窗口切换的 DOM 身份、值/焦点保持，真实触屏滚动/点击 Footer，以及无 ResizeObserver、上下 Sheet 实际高度回归。正常窗口 Footer 同屏断言保留；极限窗口断言它经实际滚动完全可见且动作收到一次点击。新候选浏览器尚未执行，不能将本地单测通过替代可达性验收。包间 internal/dialog-layout 路径仅库实现接线，不是宿主可依赖的稳定布局 API。

本地最终候选 generation `eca5c3805af5`：363 token 与原始规范逆向 SHA 检查、根类型、528 单测、完整独立 tarball React/native 全部入口/类型/包体门禁通过。独立只读复核发现的固定 Sheet 高度、变换坐标混用已修正，并补 computed content-box/border-box、销毁待执行帧和无观察器单测。布局切换仅把原有焦点控件 nearest 滚入新 owner，不重新 focus，不拦截输入键盘；新增末字段真实 Tab 双向切换截图回归。初始化 showModal 抛错也释放观察器/监听。77 条 Dialog 前置浏览器用例已收集，实际结果等待安全 CI，不将本地结果记为浏览器通过。
