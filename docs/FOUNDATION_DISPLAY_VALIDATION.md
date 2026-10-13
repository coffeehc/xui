# G0 与基础展示验证记录

本记录对应 [基础层门禁](FOUNDATION_DESIGN_GATES.md) 的 G0 以及 G1 中 Typography、Separator、Surface、Badge/Tag、Skeleton/Spinner/Progress。完整规范仍只来自 [DESIGN](DESIGN.md)，公开入口见 [DISPLAY](DISPLAY.md) 与 [PUBLIC_API](PUBLIC_API.md)。不据此宣布整个 G0/G1 或上层组合验收完成。

## 本次最小修改

- 基线：`d44cf06ef270e8b5d1049fb80259477ed378feeb`，验证日期 2026-10-13（UTC）。
- `base.css` 的横向、纵向 Separator 从 `line-width-surface` 改为已存在的 `line-width-separator`；颜色继续为 `separator-line`。两种线宽默认都是 1px，Surface 的区域边框语义不变。
- 依据：DESIGN 的共享尺度、集中声明中独立的两种线宽，以及“公共文字比例与设计值验收边界”中不得因默认同值错绑其它语义的要求。不新增 token、密度、Document/Markdown 功能或产品私有样式。
- 正式 React/native display 示例新增同构的 Surface、横向 Separator、纵向 Separator。既有独立 tarball consumer 构建这些示例，并检查无源码别名、无私有 CSS；native 构建不引入 React。

## G0/G1 静态与模型证据

| 门禁范围 | 本轮已检查内容 | 证据与边界 |
| --- | --- | --- |
| G0 DESIGN → 生成 token | 357 个变量、light/dark/system/reduced 与产品覆盖依赖图无环、前言/CSS 一致 | `scripts/tokens.mjs`；检查生成值与 13 个 CSS 分片、components/style/critical 的字节一致性，不等于浏览器计算与绘制已验 |
| G0 设计值来源 | 语义变量、结构常量、SVG 内容、已审定运行时测量的边界 | `scripts/design-value-guard.mjs`；未将 0/100%、方向反转、实际定位测量归为新设计尺度 |
| G0 字体与比例 | 七组字号/行高、rem 阅读下限、独立文字比例与行高比例、几何不随文字缩小 | `tests/typography-scale.test.mjs`；未替代真实字体回退或 200% 浏览器 zoom |
| G1 Typography | Heading 的 level 与 visualRole 分离；Text 状态色、Code Mono/安全文本、Link 原生语义 | `tests/display.test.mjs` 与公开入口源码；明确 role 规则优先于应用 h1/h2 基线，没有以全局选择器单独推断宿主阅读区域错误 |
| G1 Separator | 横竖线均消费 separator 线宽；默认 1px，覆写后与 Surface 的 1px 独立 | `tests/separator-design-contract.test.mjs`；修复前对应绑定断言失败，修复后通过 |
| G1 Surface | card 背景/边框/圆角/padding、flat 阴影、可收缩边界 | `packages/theme/src/feedback.css`；本轮未发现新静态偏差，未宣称实际焦点四边/嵌套表面验收通过 |
| G1 Badge/Tag | 已有 body-xs 文字、被动标签语义；可移除标签使用公共 Button 和宿主明确焦点目标 | `tests/display.test.mjs`；未额外增加被动标签的 hover/focus 状态，不覆盖独立 Button 门禁 |
| G1 Skeleton/Spinner/Progress | 大小、轨道/填充消费语义 token；隐藏装饰；Progress 保留真实 value/max 和省略 value | 公开 feedback 入口 SSR 与源码；Skeleton/Spinner/indeterminate Progress 在 reduced-motion 下均显式 `animation:none`，forced-colors 的 progress 恢复原生绘制；没有浏览器绘制结论 |

审查时，既有 typography/display/design-value-guard 共 29 项单测通过。新增 Separator 单测包含独立绑定与双主题默认/覆写检查，不以声明解析冒充 computed style。

本最小批本地运行结果：

- `node scripts/build.mjs`、`node scripts/tokens.mjs --check`、`node node_modules/typescript/bin/tsc --noEmit` 通过；生产 generation 为 `652705796c74`。
- Separator + typography/display/design-value-guard 定向单测 31/31；完整 `node --test tests/*.test.mjs` 为 507/507。
- `npm_config_offline=true node scripts/consumers.mjs` 通过：真实独立 tarball 安装、全部正式出口/types、两端示例及包体门禁。display 的构建输入确认只有打包后的 theme CSS；native 无 React peer，无源码别名。
- `node scripts/check-docs.mjs`、`git diff --check` 通过。Playwright `--list` 正常列出下述 6 项，列出不等于执行。

## 正式浏览器回归入口

`tests/browser/separator-design-contract.spec.mjs` 包含 6 项：React/native × light/dark/system。使用 `scripts/consumers.mjs` 的既有 `/display-react/` 与 `/display-vanilla/` 独立打包页面，只采用公开组件/原生类与主题 CSS。

每项依次检查：

1. 默认横向、纵向线宽均为 1px，方向与非活动边为 0 的几何正确，Surface 四边仍为 1px。
2. 在同一 `:root` 的 `product-overrides` 层仅设 `line-width-separator:3px`、`line-width-surface:1px`，两方向 Separator 变为 3px，Surface 保持 1px。
3. 撤销覆盖后回到默认；保留默认/覆写截图供实际查看。

没有注入消费者私有 selector、修布局 CSS 或绕过公共出口。

## 未测与交付限制

- 本轮云环境已知 Chromium 启动存在 `socket() EPERM`。未再次启动浏览器、未关闭 sandbox，以上 6 项只新增可执行回归，实际执行和截图检查交由主维护者统一 CI。
- 没有本轮 computed-style/像素通过证据；没有真实浏览器 200% zoom、系统读屏器、跨 OS 字体、移动原生控件或 forced-colors 实际绘制结论。
- 完整 `pnpm verify` 的浏览器/冷启动/watch 阶段不在本轮本地通过声明中。主维护者合入后须按最终候选提交运行，记录失败与未跑，不能从静态检查推导全层通过。
