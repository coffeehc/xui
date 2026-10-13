# 基础反馈展示验收补齐

范围仅为 G0/G1 的 Alert、Skeleton、Spinner、Progress。首批 `1f077ec` 以 `5a5896c9a74afa1468e1589e5a4e0523249e3d36` 为基线，仅新增验收。后续实际图审发现 Progress 强制颜色绘制缺陷，下面记录其最小修复；仍不涉及 API、展示示例、后置资源 owner、交互组合或业务组件。Badge 字重不在本批处理。

## 条款与已有覆盖

- [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射)：Alert 采用状态 foreground/soft/line 与可理解文字；被动状态不增加 hover、focus 或 disabled 行为。
- [DESIGN 公共文字比例与设计值边界](DESIGN.md#公共文字比例与设计值验收边界)：尺寸、颜色和动画消费已有语义变量；产品覆盖在同一根节点的 product-overrides 层。
- [DESIGN 通用加载与正式消费](DESIGN.md#通用加载主题所有权与构建消费)：原生消费者不加载框架，独立安装使用正式 exports，装饰动画不代替真实状态。
- [DESIGN 原生 progress 补充](DESIGN.md#公共表格整体与紧凑顶栏工具)：有 value 绘制真实 value/max；无 value 保留不定状态；减少动效静止；forced-colors 保留原生语义，以系统色绘制可识别轨道与真实比例。
- [PUBLIC_API feedback 默认](PUBLIC_API.md#xui-自己定义的默认行为)：Alert 默认 info/status，error 默认 alert。原生结构依 [IMPLEMENTATION](IMPLEMENTATION.md#原生公共结构与-controllers) 使用语义元素与公开类。

既有 `native-controls-audit.spec.mjs` 在 React 审计页检查 progress value=40、默认高度、reduced-motion 与 forced-colors，页面也有原生 progress 样本。`foundation*.spec.mjs` 着重资源加载、失败恢复和组合生命周期。它们没有逐项验证下列四 tone token、两端装饰语义、动态进度事实或实际轨道/填充覆写，因此本批新增独立门禁，保留原用例。

## 新增门禁

| 门禁 | 覆盖 |
| --- | --- |
| [7 项合同单测](../tests/feedback-foundation-contract.test.mjs) | React 根/feedback 子入口同一导出；真实 div/span/progress 结构；Alert 四 tone 默认 role；Skeleton/Spinner 默认 aria-hidden 且无第二 live/focus owner；现有 token 映射、reduced-motion 和 forced-colors 分支；补充系统角色的集中来源及覆盖边界 |
| [React fixture](../tests/fixtures/feedback-foundation-contract.tsx) / [原生 fixture](../tests/fixtures/feedback-foundation-contract.js) | 正式 ESM/CSS、默认及四 tone Alert、中英混排连续长错误、单一带文字 status 内的装饰指示、0/部分/分数/完成/未知进度及动态值 |
| [18 项浏览器门禁](../tests/browser/feedback-foundation-contract.spec.mjs) | 两端 × light/dark/system × Alert、装饰加载、Progress 三组；输出截图与测量 JSON |
| [独立 tarball 消费](../scripts/consumers.mjs) | 仅新增专用 fixture 块；React fixture 严格类型编译；构建输入全部在本次独立安装内，无私有 CSS；原生输入不含 React/ReactDOM/Base UI |

Alert 门禁逐 tone 核对 foreground/soft/line、默认几何和独立根语义覆盖；hover 不改状态底色，被动节点不进入 Tab 序列。连续中文和无空格长文本在 1280/390px、根字号 100%/200% 下测真实行框与内容盒，不截断或以放宽容差掩盖溢出。根字号 200% 不冒充浏览器真实 zoom。

Skeleton/Spinner 门禁检查隐藏装饰节点、唯一可理解 status 文案、默认/覆盖后的尺寸、颜色与动画时长。减少动效后要求 animation:none、没有活跃动画、opacity=1/transform:none；切回正常偏好后恢复动画，期间语义与文字保持。

Progress 门禁检查原生 position、max、:indeterminate 与 value 属性；0 和无 value 不混同，3/8 不改成猜测百分比。动态确定→未知→0→分数→完成→未知保留同一 DOM。实际元素截图取样验证填充/轨道分别来自 action-primary/muted，未知状态来自 interaction-selected；不把 Chromium progress 伪元素 computed style 当作实际绘制证明。覆盖只用于测试，不发布新主题。forced-colors 保留真实 value/未知语义；后续修复改为系统颜色的原生比例绘制，见下节。

## 验证边界

首批独立工作树通过 `pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、完整单测 516/516（新增 6 项）及 `pnpm test:consumer` 的 React/原生正式 tarball 消费。最小修复候选再次通过上述各项，精确 token 为 362、完整单测为 517/517（追加 1 项），构建哈希 `7181916372a8`；新增文档引用检查通过。18 项专用浏览器用例与 4 项既有 native-controls 用例枚举通过，修复实际执行交安全 CI。没有在受限云容器重复启动浏览器、关闭 sandbox 或使用测试 skip/预期失败。CI 结果与截图实际审阅前，本文件只说明门禁覆盖，不能宣称视觉验收通过或 G0/G1 全层完成。

系统读屏器的真实播报、其他浏览器/OS 和产品页面仍未由这些 fixture 证明。SSR 单测只核原生元素/属性输出，不冒充浏览器绘制、完整 SSR/hydration 或系统无障碍验收。

## 安全 CI 实图发现：绿色 appearance 断言漏检了空白绘制

CI [38454862068](https://github.com/coffeehc/xui/actions/runs/38454862068) 的 `770a83d` 中，18 项新增测试通过；artifact `11844090253` 的实际截图却显示 forced-colors 下全部进度不可见。保留未经修改的 [浅色原图](../tests/fixtures/evidence/progress-forced-colors-770a83d-light.png)、[深色原图](../tests/fixtures/evidence/progress-forced-colors-770a83d-dark.png) 及 [SHA256/像素记录](../tests/fixtures/evidence/progress-forced-colors-770a83d.json)。两端图片字节相同，system 与 dark 相同。每张图为 390×222；标题以下 y=60 到底部共 63,180 像素，浅色全为白色，深色全为黑色，没有轨道或填充。旧检查仅断言 computed appearance:auto 及 position，不能证明实际绘制。

根因与修复选择来自官方实现和规范：

- [Blink LayoutTheme](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/layout/layout_theme.cc) 的 IsControlStyled 对 Progress 检查作者背景/边框；匹配后 AdjustAppearanceWithAuthorStyle 将实际 appearance 设为 none。原规则只恢复 appearance:auto，保留作者 background/border，不能重新启用 native painter。
- [Blink UA progress CSS](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/html/resources/html.css) 的普通灰/绿轨道颜色，在上述自绘路径与强制颜色调整组合中不能提供对比。W3C 的 [forced-color 调整规则](https://www.w3.org/TR/css-color-adjust-1/#forced-colors-properties) 将非系统背景色归入用户系统色；这与本次实际全 Canvas 像素一致。
- 单纯继续 revert 作者背景/边框虽可消除这项 native painter 抑制条件，却不是本补丁方案：[Blink LayoutProgress](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/layout/layout_progress.cc) 的未知状态采用独立计时器，CSS animation:none 不足以保证其静止。本补丁保留 appearance:none 的可控绘制和原生 value/max 尺寸，不引入另一套数值布局或脚本。
- 系统色使用 [W3C 配对规则](https://www.w3.org/TR/css-color-4/#css-system-colors) 的 Canvas/CanvasText，避免假定 Highlight 与 Canvas 在所有用户调色板中对比。系统色不被再次归一，所以 forced-color-adjust 保持默认 auto，不需要 none，也不取消 forced-colors。实现的系统色判定亦可核对 [Blink ComputedStyle::ShouldForceColor](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/style/computed_style.cc)。

生产修改仅在 Progress 的 forced-colors 段：增加既有线宽的系统边界，填充继续来自原生 value/max；无 value 使用空心虚线，WebKit/Mozilla 填充均透明，不虚构百分比或满条。普通模式、既有圆角和动效 token 均不改；reduced-motion 延续静止。DESIGN 中央可逆块新增三个系统颜色角色与一个虚线样式角色，accessibility 层重新绑定它们，产品品牌覆写不得逃逸。精确 token 数 358→362，原始文档 SHA256 逆重建继续通过；没有放宽设计值扫描器。

补强回归通过同一像素算法识别保存的旧空白图，并要求新 0/部分/分数/完成/未知的轨道与填充实际可见。零值/未知中心均为空，未知周边实际断续、与完成态不同；原始截图不禁动画，间隔250ms检查减少动效的未知绘制静止。覆盖 forced-colors 开启/退出、原生元素身份、动态 value/max/未知往返及无合成 aria-valuenow；不再拿 appearance 值冒充可见性。

这次浏览器证据仅是安全 CI 官方 Chrome 的 forced-colors 模拟与当时的系统色值，不等于 Windows 所有高对比主题或 Firefox/Safari、多 OS 实测。修复候选的实际像素结果须等新的安全 CI；此前通过的截图不证明修复已生效。
