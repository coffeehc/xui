# 基础反馈展示验收补齐

范围仅为 G0/G1 的 Alert、Skeleton、Spinner、Progress。以 `5a5896c9a74afa1468e1589e5a4e0523249e3d36` 为基线，不更改生产组件、默认 token、API 或展示示例，不涉及后置的资源 owner、交互组合和业务组件。Badge 字重不在本批处理。

## 条款与已有覆盖

- [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射)：Alert 采用状态 foreground/soft/line 与可理解文字；被动状态不增加 hover、focus 或 disabled 行为。
- [DESIGN 公共文字比例与设计值边界](DESIGN.md#公共文字比例与设计值验收边界)：尺寸、颜色和动画消费已有语义变量；产品覆盖在同一根节点的 product-overrides 层。
- [DESIGN 通用加载与正式消费](DESIGN.md#通用加载主题所有权与构建消费)：原生消费者不加载框架，独立安装使用正式 exports，装饰动画不代替真实状态。
- [DESIGN 原生 progress 补充](DESIGN.md#公共表格整体与紧凑顶栏工具)：有 value 绘制真实 value/max；无 value 保留不定状态；减少动效静止，forced-colors 恢复原生绘制。
- [PUBLIC_API feedback 默认](PUBLIC_API.md#xui-自己定义的默认行为)：Alert 默认 info/status，error 默认 alert。原生结构依 [IMPLEMENTATION](IMPLEMENTATION.md#原生公共结构与-controllers) 使用语义元素与公开类。

既有 `native-controls-audit.spec.mjs` 在 React 审计页检查 progress value=40、默认高度、reduced-motion 与 forced-colors，页面也有原生 progress 样本。`foundation*.spec.mjs` 着重资源加载、失败恢复和组合生命周期。它们没有逐项验证下列四 tone token、两端装饰语义、动态进度事实或实际轨道/填充覆写，因此本批新增独立门禁，保留原用例。

## 新增门禁

| 门禁 | 覆盖 |
| --- | --- |
| [6 项合同单测](../tests/feedback-foundation-contract.test.mjs) | React 根/feedback 子入口同一导出；真实 div/span/progress 结构；Alert 四 tone 默认 role；Skeleton/Spinner 默认 aria-hidden 且无第二 live/focus owner；现有 token 映射、reduced-motion 和 forced-colors 分支 |
| [React fixture](../tests/fixtures/feedback-foundation-contract.tsx) / [原生 fixture](../tests/fixtures/feedback-foundation-contract.js) | 正式 ESM/CSS、默认及四 tone Alert、中英混排连续长错误、单一带文字 status 内的装饰指示、0/部分/分数/完成/未知进度及动态值 |
| [18 项浏览器门禁](../tests/browser/feedback-foundation-contract.spec.mjs) | 两端 × light/dark/system × Alert、装饰加载、Progress 三组；输出截图与测量 JSON |
| [独立 tarball 消费](../scripts/consumers.mjs) | 仅新增专用 fixture 块；React fixture 严格类型编译；构建输入全部在本次独立安装内，无私有 CSS；原生输入不含 React/ReactDOM/Base UI |

Alert 门禁逐 tone 核对 foreground/soft/line、默认几何和独立根语义覆盖；hover 不改状态底色，被动节点不进入 Tab 序列。连续中文和无空格长文本在 1280/390px、根字号 100%/200% 下测真实行框与内容盒，不截断或以放宽容差掩盖溢出。根字号 200% 不冒充浏览器真实 zoom。

Skeleton/Spinner 门禁检查隐藏装饰节点、唯一可理解 status 文案、默认/覆盖后的尺寸、颜色与动画时长。减少动效后要求 animation:none、没有活跃动画、opacity=1/transform:none；切回正常偏好后恢复动画，期间语义与文字保持。

Progress 门禁检查原生 position、max、:indeterminate 与 value 属性；0 和无 value 不混同，3/8 不改成猜测百分比。动态确定→未知→0→分数→完成→未知保留同一 DOM。实际元素截图取样验证填充/轨道分别来自 action-primary/muted，未知状态来自 interaction-selected；不把 Chromium progress 伪元素 computed style 当作实际绘制证明。覆盖只用于测试，不发布新主题。forced-colors 保留真实 value/未知语义并恢复 appearance:auto。

## 验证边界

独立工作树已通过 `pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、完整单测 516/516（新增 6 项）及 `pnpm test:consumer` 的 React/原生正式 tarball 消费；新增文档引用检查通过。浏览器文件已通过 18 项用例枚举，实际执行交安全 CI。没有在受限云容器重复启动浏览器、关闭 sandbox 或使用测试 skip/预期失败。CI 结果与截图实际审阅前，本文件只说明门禁覆盖，不能宣称视觉验收通过或 G0/G1 全层完成。

系统读屏器的真实播报、其他浏览器/OS 和产品页面仍未由这些 fixture 证明。SSR 单测只核原生元素/属性输出，不冒充浏览器绘制、完整 SSR/hydration 或系统无障碍验收。
