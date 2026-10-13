# G1 媒体与标签基础验收

本批基线 `d3064c9`，仅增加 Avatar、Image、Tag、Badge 的测试、正式消费 fixture 和验证说明，不改变生产 CSS、组件 API、字体权重或风格。它补齐明确缺口，不声明 G1 全层或真实产品已验收。

## 合同来源与已有证据

- [DESIGN 形状](DESIGN.md#shapes)：头像保持语义形状；[长文本](DESIGN.md#长文本与领域阅读)、[公共设计值边界](DESIGN.md#公共文字比例与设计值验收边界)约束完整内容入口、语义 token、用户字号与内容尺寸。
- [Avatar 合同](WIDGETS.md)：React 使用正式 `/avatar` 的 Root/Image/Fallback；原生使用 `createAvatar` 工厂，不存在另一个 bindAvatar API。三档映射到现有 control-height-sm、control-height、avatar-size-lg，形状/颜色/文字来自 radius-full、layer-support、foreground、font-weight-control。
- [Image 合同](DISPLAY.md#image)：显式 alt 与有限正数 width/height 或 aspectRatio；尺寸属于内容事实。contain 默认、cover 可选；加载/失败/成功保留同框。placeholder 使用 muted、muted-foreground、space-control-gap；装饰图片显式空 alt。
- [Tag 合同](DISPLAY.md#separator-与-tag)：安全 label，被动无 Tab；删除按钮明确名称，点击只发布意图，宿主决定删除与焦点。
- Badge 采用正式 React root/feedback 导出或原生 span.xui-badge；DESIGN 的元数据 body-xs、被动无交互状态及完整入口不等于每个 Badge 独自承担全部容器换行规则。font-weight-control 的现有使用与“普通文字”的 400/500 解释分歧保留，不新增默认字重断言。

已有 [widgets 浏览器](../tests/browser/widgets.spec.mjs)覆盖默认头像失败→加载的稳定几何。[display 单测](../tests/display.test.mjs)、[浏览器](../tests/browser/display.spec.mjs)和已有类型 fixture 已覆盖 Image 尺寸/alt 校验、src 迟到隔离、显式重试、destroy/原子更新、React hydration 及挂载前加载；Tag 已覆盖键盘删除、宿主移除与指定回焦点、disabled、缺删除名称。本批不重复建立这些资源生命周期矩阵。

## 有限 18 例与 4 项单测

[专用浏览器文件](../tests/browser/media-foundation-contract.spec.mjs)为 React/原生 × light/dark/system × 下列三组，共 18 例。各组内部遍历 1280/390 CSS px 与根字号 100%/200%；根字号放大不冒充浏览器真实 zoom。

1. Avatar 六例：三档实际尺寸与独立根 token 覆写/恢复、单一完整名称、空 alt 内图、被动不可聚焦；失败/加载前后保持尺寸；宽图实际 cover 裁切像素。长 fallback 原样安全呈现且完整名称保留，不要求小圆中完整展示任意长字符串，也不扩大头像尺寸。
2. Image 六例：width+height 与 ratio 两种内容几何、容器收缩、contain/cover 实际像素、内容图片与装饰图片的可访问树差异；加载和失败占位颜色/内距覆写与 reduced-motion；长替代文案的完整语义及首末文字滚动可达。此处若发现 flex 居中导致溢出起点不可达，应保留失败证据并按 DESIGN 修复流程另审，不能缩短内容掩盖。
3. Tag/Badge 六例：删除意图发出后宿主未接受，Tag 与焦点仍保留；disabled 跳过 Tab，被动标签/元数据无 Tab；body-xs/行高/间距覆盖；长 Tag 换行且 xs 删除按钮、四边焦点可见。Badge 保持普通无边框/填充的元数据；宿主以公开 Typography 提供完整长值，并通过 aria-describedby 连接，明确双方职责。

[四项单测](../tests/media-foundation-contract.test.mjs)核 root/subentry 同一正式导出、Badge 原生 span 语义、Avatar/Image 现有 CSS 角色映射、Tag 只发意图和现有文字尺度。它们不把 DOM 模型或 computed style 冒充真实绘制。

[React fixture](../tests/fixtures/media-foundation-contract.tsx)和[原生 fixture](../tests/fixtures/media-foundation-contract.js)只使用公开 API/样式与普通宿主标记。[consumer 脚本](../scripts/consumers.mjs)仅新增专用块：严格 React 类型编译、独立 tarball 安装路径限制、公开 CSS 限制、原生无 React/ReactDOM/Base UI。没有修改展示示例或既有 display 门禁。

## 像素与文字定位

合成 SVG 为 400×200，左右各四分之一不同色、中央一半第三色，属于图片内容，不是 UI 色板。对元素截图读取实际 PNG 宽高，再按内部相对位置取样，不根据默认 DPR 猜页面坐标。contain 中线 20%/50%/80% 显示三段；cover 同样位置与上方中心应来自中央区。比较实际 RGBA 通道，容差 2，保留原 PNG 与 JSON。

文字通过 TreeWalker 的首/末文本节点及单字符 Range 测真实行框。Image placeholder 分别 scrollTop=0 与 scrollTop=scrollHeight，要求首尾内容落在可见内容区；记录 scrollHeight/clientHeight 和两端行框。Tag 记录完整标签行框与真实键盘 focus 外扩四边，再以页面 PNG/实际视口比例映射每边中点，检查相邻 3×3 实际像素中存在 computed outline 颜色（通道容差 2）；不猜 DPR，不用截图尺寸代替可达性。

## 当前边界

独立工作树通过 build（`dfe766430ee0`）、types、362 token/原始 DESIGN SHA256 逆重建、全量 521/521 单测（本批新增 4 项）、React/原生正式全 tarball consumer 与文档引用检查。上述检查使用对应 package scripts 的 Node 入口；未改共享主树 dist。新增 18 例已通过枚举，尚未本地执行浏览器；实际图片与运行结果交安全 CI。没有再次尝试受限环境 EPERM、关闭 Chromium sandbox、添加 skip 或预期失败。若安全 CI 的绘制/可达断言失败，本批仍是未闭环证据，不得宣称视觉通过。

系统读屏器真实播报、触控、Firefox/Safari、多 OS、真实浏览器 zoom 与任意业务图片/宿主布局未由本批证明。Tag/Badge 不增加选择状态，Image 不加入上传、查看器或自动重试，Avatar 不推断业务身份或名称缩写。
