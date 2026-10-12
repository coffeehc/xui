# 通用指标卡 MetricCard

`MetricCard` 是一个被动统计单元，复用 `Surface` 的单层表面、现有统计文字与间距 token。多卡排列仍由调用方的 `Grid` 决定。它不拥有指标列表、请求、状态引擎、数值格式化、单位推断或业务颜色映射。

## 评估与边界

既有 `Surface` 提供卡片表面，`Grid` 提供自适应排列；它们可以由调用方手工组合 CSS，但没有统一的 label/value/右上标记排版。`Section` 是章节标题与操作，`xui-details` 是详情键值列表，不能直接替代统计文字角色。因此只增加这一个公共组合，不增加业务网格或另一套卡片皮肤。

React 正式入口为 `@coffeehc/xui-react/metric-card`，根入口同时导出 `MetricCard` 与 `MetricCardProps`。CSS 在已有 `@coffeehc/xui-theme/feedback.css` 中，也包含在 `style.css`、`components.css` 与 `critical.css`。

- `label: ReactNode`：调用方提供可读指标名，使用行内内容。
- `value: ReactNode`：调用方提供最终显示内容；数字 `0` 原样显示，不自动变成未知。格式化、单位、空值、错误与加载说明由调用方明确表达。
- `marker?: ReactNode`：可选逻辑行尾 slot，通常位于右上；RTL 时跟随逻辑方向。可以是图形、Badge 或已有公共控件。不传、`null`、布尔值、空字符串和空 Fragment 均不预留可见空间。
- 其余 `Surface` 的 section props、`className`、`style`、`ref`、ARIA 与事件透传；不提供 `children`，避免绕过名称/值结构。

根节点默认无按钮角色、tabIndex、点击反馈或 live region。内部 `dl`/`dt`/`dd` 关联名称和值；不会额外生成一排命名地标。调用方可按实际需要命名 section、提供 `aria-busy` 或在自己的反馈区通知状态。

标记不默认设置 `aria-hidden`。纯装饰图形由调用方设置 `aria-hidden="true"`；有含义的颜色必须同时有可读文字或可访问名称，不能只靠颜色传达状态。交互标记使用真实 Button/link 等公共控件，自行提供名称、权限、disabled/busy、Tooltip 与回调；卡片不会代管或截获其事件。标记应为行内内容，不在 `dt` 中嵌套章节标题或整块页面。

## React 用法

```tsx
import {Grid} from '@coffeehc/xui-react/layout';
import {Badge} from '@coffeehc/xui-react/feedback';
import {MetricCard} from '@coffeehc/xui-react/metric-card';

<Grid>
  <MetricCard label="记录数" value={0} />
  <MetricCard
    label="完成比例"
    value="98.5%"
    marker={<Badge style={{color:'var(--status-success-foreground)'}}>已达标</Badge>}
  />
</Grid>
```

这段中的名称、格式化字符串与标记全部属于调用方；公共组件没有“完成比例”或“已达标”的内置规则。调用方已有的颜色小圆点、图标或公共 Badge 可直接放进 `marker`，不必把颜色转成枚举交给卡片。值含单位时可用行内节点，单位采用既有 body-xs 文字 token，参见[正式 React 示例](../examples/metric-card-react/app.tsx)。

## 原生公开结构

无需增加 controller 或框架运行时。使用同一 CSS 的公开语义结构；动态内容用 `textContent` 或安全 Node 更新，不将业务值写入 `innerHTML`。

```html
<div class="xui-grid">
  <section class="xui-surface xui-metric-card">
    <dl class="xui-metric-card-content">
      <dt class="xui-metric-card-header">
        <span class="xui-metric-card-label">记录数</span>
        <span class="xui-metric-card-marker">
          <span class="xui-badge">已同步</span>
        </span>
      </dt>
      <dd class="xui-metric-card-value">0</dd>
    </dl>
  </section>
</div>
```

没有标记时省略 `.xui-metric-card-marker`，空节点同样不占位；各角色只使用这里声明的类，不复制内部选择器或写业务网格。完整[原生示例](../examples/metric-card-vanilla/app.js)与 React 示例由独立安装的正式 tarball 构建。

## 主题、长内容与采用

名称用 body-xs/muted，值用 metric/heading/tabular-nums/mono，内距和名称到值的间距用 `metric-padding`/`metric-gap`；边框、背景和圆角仍由 Surface 的 card token 提供。没有新增默认设计值或固定宽高。长名称、连续长数字和字符串自然换行；标记按空间换行到逻辑行尾，卡片高度随内容增长。Grid 的列数、自定义宽度与整体布局留给调用方。

XAgent 的现有 `Surface` 拼卡可以在其后续独立授权的迁移中替换为 `MetricCard`：将既有名称/已格式化值/颜色标记传入这三个 prop，并保留原来的 Grid、数据来源、指标清单和业务判断。本任务没有修改 XAgent，也没有声称它的真实页面已经完成验收。

组件、公开 CSS、正式导出和空值/标记的单元测试见 [metric-card.test.mjs](../tests/metric-card.test.mjs)；独立消费者的浅/深/system、320px/宽屏、276px 近满宽标记边界、长内容、200% 根文字、动态更新和交互标记检查见 [metric-card.spec.mjs](../tests/browser/metric-card.spec.mjs)。浏览器测试是否通过以该提交 CI 为准；未执行真实移动 OS、读屏器或 XAgent 集成验证。
