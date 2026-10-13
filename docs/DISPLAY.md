# 文字、复制与媒体

本页为已实现 A1/A3 公共合同。React `@coffeehc/xui-react/display`、原生
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

横竖线宽消费 `line-width-separator`，颜色消费 `separator-line`；Surface 仍独立消费 `line-width-surface`。默认均为 1px，同根 `product-overrides` 可独立覆盖分隔线宽，不改变区域边框。基础层静态证据和未测范围见 [G0/基础展示验证](FOUNDATION_DISPLAY_VALIDATION.md)。

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
真实浏览器场景在 `tests/browser/display.spec.mjs`；实际运行结果、zoom/读屏等未测限制见 `DISPLAY_VALIDATION.md`。
