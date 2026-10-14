# 文字、复制、指标与媒体

本页维护公共展示与媒体合同。React `@coffeehc/xui-react/display`、原生
`@coffeehc/xui-runtime/display-dom`，共享状态/类型 `@coffeehc/xui-runtime/display`，均由各自根入口导出。
样式复用 theme/style.css（或 base.css、button.css、feedback.css），没有新字号、色板、路由或业务 owner。
正式独立安装示例：[React](../examples/display-react/app.tsx)、[原生](../examples/display-vanilla/app.js)。

## Typography

- `Typography.Heading` 必填 level 1–6，决定真实 h1–h6；visualRole 默认 section，page/section 只绑定既有标题 token，语义层级不改变视觉尺度。原生 `createTypographyHeading(document,{level,text,visualRole})`。
- `Typography.Text` 默认 span，可 as='p'；tone 为 default/muted/error/success，不使用任意字号系统。原生 `createTypographyText(document,{text,as,tone})`。
- `Typography.Link` 是真实 a，保留 href、target、download、rel、修改键与中键；不接管 router。原生 `createTypographyLink(document,{text,href,target,download,rel})` 返回同样的 a，宿主可通过公开元素设置标准 HTML 属性。
- `Typography.Code` 必填安全字符串 value；block 默认 false，true 输出 pre/code。原生 `createTypographyCode(document,{value,block})` 使用 textContent。没有 HTML parser、代码编辑器或高亮引擎。
- 原生静态构建器返回元素，不订阅全局事件、不需要 destroy；宿主管理其标准 DOM 内容/属性与生命周期。

## Copyable

React `Copyable`、原生 `createCopyable(document,options)` 使用相同 value、disabled、writeText、labels、onStatusChange。
value 必填，展示完整值且仅复制这个值。默认在用户点击后使用 Clipboard API writeText；不读取剪贴板，不尝试 execCommand/权限绕过。失败显示安全的就地文字，不泄露异常消息；调用方可注入 `(value:string)=>void|Promise<void>`，原生宿主桥接同合同。

idle/copying/copied/error 是当前交互事实。按钮 disabled 与 copying 独立于外部业务。
重复点击不并发写剪贴板；等待中的 write 不可取消，也不声称取消了系统写入。
value、writer 或 disabled 改变使旧结果失效；仍等待旧 write 结束后才能发起下一次复制，以免旧复制晚到覆盖新值。旧结果不会显示新值“已复制”。
状态不使用超时假定成功，不自动重试，不抢焦点。labels 可覆盖 copy/copying/copied/error。

原生返回 element/button/update/destroy；update 接收完整 options，保持按钮/反馈节点。destroy 释放监听并使迟到结果失效。React 卸载同样清理，SSR 不访问 navigator。
密码和其他秘密不默认接入；值与授权由宿主明确决定。

## Separator 与 Tag

`Separator` / `createSeparator(document,options)` 默认 horizontal、非装饰，具有 separator 与 aria-orientation；vertical 使用父容器 stretch，宿主提供布局高度；decorative=true 使用 none/aria-hidden，不成为多余读屏节点。

横竖线宽消费 `line-width-separator`，颜色消费 `separator-line`；Surface 仍独立消费 `line-width-surface`。默认均为 1px，同根 `product-overrides` 可独立覆盖分隔线宽，不改变区域边框。基础层实际验证和限制见 [VALIDATION.md](VALIDATION.md)。

`Tag` / `createTag(document,options)` 必填安全字符串 label。被动标签没有 tab stop。
可移除分支必须提供 onRemove 和明确 removeLabel，使用真实 type=button；disabled 不发意图。
标签没有隐式选择状态，选择 chip 使用已有 ToggleGroup。

onRemove 只发删除意图，不自动删除 DOM 或猜邻居。宿主更新其集合。
可选 `onRemoveFocus(trigger)` 在 onRemove 后调用，供宿主聚焦明确输入/已存在邻项；异步确认/React 提交后才能确定目标时，宿主在确认/提交后按自己的稳定 key 管理焦点。
默认不把焦点送到 body，不扫描同名标签。原生返回 element/removeButton/update/destroy，update 接收完整 options 并保留按钮身份。

## Image

`Image` / `createImage(document,options)` 必填 src 与 alt，装饰图片显式 alt=''。
必须提供有限正数 width+height，或 aspectRatio（可另给 width，不可同时给 height）。
这些是调用方内容尺寸，不是新的品牌 token。宽度最多为容器 100%，高度按预留比例计算；loading、error、loaded 共用同一外框，fit 默认 contain，可 cover。

缺省 loadingLabel='图片加载中'，fallback='图片无法加载'，均可本地化安全字符串。
内容图片在占位阶段保留 alt 与状态的可访问描述；装饰图片占位 aria-hidden。加载后只暴露真实 img 的 alt。
加载/错误回调 onStatusChange 报告实际资源事件；空 src 直接错误，不对当前页面发送空地址图片请求。

src 或显式 retryKey 改变才创建新资源；旧 img 事件不能覆盖新图。fallback 不是第二个 URL，不递归重试、不猜 CORS 代理；重试由宿主变更 retryKey 发起。原生 update 接收完整 options，校验失败不改变旧状态；destroy 断开事件并移除节点。React 更新保留外框，切换 keyed 资源隔离旧事件，卸载无迟到状态回写。SSR hydration 会读取当前 img.complete/naturalWidth，接续挂载前已完成的资源，不等待已经错过的 load/error 事件。

## 检查边界

共享模型/原生 DOM 模型测试不等于浏览器。`tests/display.test.mjs` 覆盖复制拒绝、不可用、重复/迟到、销毁、Tag 明确焦点及禁用、图片 src 竞态与尺寸校验；类型 fixture 覆盖缺 alt/尺寸/移除名称等负例；正式 tarball consumer 检查 React/native、root/subpath/types/CSS/init 与不引入 React 的原生输出。
真实浏览器场景在 `tests/browser/display.spec.mjs`；实际运行结果与未测限制见 [VALIDATION.md](VALIDATION.md)。


## MetricCard

`MetricCard` 是一个被动统计单元，复用 `Surface` 的单层表面、现有统计文字与间距 token。多卡排列仍由调用方的 `Grid` 决定。它不拥有指标列表、请求、状态引擎、数值格式化、单位推断或业务颜色映射。

React 正式入口为 `@coffeehc/xui-react/metric-card`，根入口同时导出 `MetricCard` 与 `MetricCardProps`。CSS 在已有 `@coffeehc/xui-theme/feedback.css` 中，也包含在 `style.css`、`components.css` 与 `critical.css`。

- `label: ReactNode`：调用方提供可读指标名，使用行内内容。
- `value: ReactNode`：调用方提供最终显示内容；数字 `0` 原样显示，不自动变成未知。格式化、单位、空值、错误与加载说明由调用方明确表达。
- `marker?: ReactNode`：可选逻辑行尾 slot，通常位于右上；RTL 时跟随逻辑方向。可以是图形、Badge 或已有公共控件。不传、`null`、布尔值、空字符串和空 Fragment 均不预留可见空间。
- 其余 `Surface` 的 section props、`className`、`style`、`ref`、ARIA 与事件透传；不提供 `children`，避免绕过名称/值结构。

根节点默认无按钮角色、tabIndex、点击反馈或 live region。内部 `dl`/`dt`/`dd` 关联名称和值；不会额外生成一排命名地标。调用方可按实际需要命名 section、提供 `aria-busy` 或在自己的反馈区通知状态。

标记不默认设置 `aria-hidden`。纯装饰图形由调用方设置 `aria-hidden="true"`；有含义的颜色必须同时有可读文字或可访问名称，不能只靠颜色传达状态。交互标记使用真实 Button/link 等公共控件，自行提供名称、权限、disabled/busy、Tooltip 与回调；卡片不会代管或截获其事件。标记应为行内内容，不在 `dt` 中嵌套章节标题或整块页面。

### React 用法

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

### 原生公开结构

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

### 主题、长内容与采用

名称用 body-xs/muted，值用 metric/heading/tabular-nums/mono，内距和名称到值的间距用 `metric-padding`/`metric-gap`；边框、背景和圆角仍由 Surface 的 card token 提供。没有新增默认设计值或固定宽高。长名称、连续长数字和字符串自然换行；标记按空间换行到逻辑行尾，卡片高度随内容增长。Grid 的列数、自定义宽度与整体布局留给调用方。

组件、公开 CSS、正式导出和空值/标记的单元测试见 [metric-card.test.mjs](../tests/metric-card.test.mjs)；独立消费者的浅/深/system、320px/宽屏、276px 近满宽标记边界、长内容、200% 根文字、动态更新和交互标记检查见 [metric-card.spec.mjs](../tests/browser/metric-card.spec.mjs)。实际已跑范围与未测边界见 [VALIDATION.md](VALIDATION.md)。


## Avatar

React `@coffeehc/xui-react/avatar` 的 `Avatar.Root/Image/Fallback` 复用 peer 的加载 callback/delay；原生 `createAvatar(root,{name,src?,fallback,size?,delay?})` 从 runtime/widgets-dom 导入。默认 size=default（可选 sm/lg）、delay=0；图像加载、错误和文字 fallback 保持同一尺寸。头像是被动展示，不自动变成按钮或焦点目标；长 fallback 保留完整名称，不保证小圆内展示全部长字符串，也不扩大头像。

业务名称、图片地址和身份由宿主提供。原生 name 提供 role=img 的单一名称，内部图片 alt 为空；React 宿主提供适当 Root 名称与内图 alt，避免重复读出。三档尺寸消费同一公开 token，原生使用 widgets 的 update/destroy 生命周期；[正式双端示例](WIDGETS.md) 和 [媒体浏览器合同](../tests/browser/media-foundation-contract.spec.mjs) 检查加载、尺寸、命名与裁切，实际结果见 [VALIDATION.md](VALIDATION.md)。
