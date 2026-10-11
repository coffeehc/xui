# 第一版实施映射

完整通用规则仅在 [DESIGN.md](DESIGN.md)。这里记录本仓库如何实施、接口和范围，不重新定义品牌原始值。

## 包边界和消费

| 包 | 输出 | 依赖与职责 |
| --- | --- | --- |
| `@coffeehc/xui-theme` | `style.css`、`tokens.css`、`components.css` | 无依赖、无框架；完整默认 token、可选择的 `.xui-*` 基础控件样式。无 Tailwind 扫描或运行时编译要求 |
| `@coffeehc/xui-runtime` | ESM `index.js`、`index.d.ts`、经典同步 `init.js` | 无依赖；mode、storage、matchMedia、订阅/释放，无 JS 色板或业务状态 |
| `@coffeehc/xui-react` | ESM `index.js`、`index.d.ts` | React/ReactDOM/Base UI 是 peerDependencies；原生组件薄封装，Tabs/Dialog 的完整交互复用 Base UI |

当前提供 ESM 和类型入口，没有声明 CommonJS 支持。包都为 private；`npm pack` 仅生成本地 tarball。CSS 要显式导入，不由 React 导入时暗中带入。

runtime 的同步初始化脚本声明为有副作用，打包器须保留仅为执行初始化而导入的 `init.js`；ESM 控制器入口保持可 tree-shake。首屏时序仍以以下阻塞经典 script 示例为验收方式。

```ts
import '@coffeehc/xui-theme/style.css';
import { createThemeController } from '@coffeehc/xui-runtime';
```

静态页面可直接复制打包后的 CSS/JS，以 `<link>` 加载 CSS。运行时初始脚本放在样式和可见内容之前：

```html
<script src="./theme-init.js" data-storage-key="ui.theme.mode"></script>
<link rel="stylesheet" href="./app.css">
```

初始化器把唯一控制器保存到 `window.xuiTheme`。应用优先复用它：

```ts
const theme = window.xuiTheme ?? createThemeController();
theme.setMode('system');
const modeSelect = document.querySelector<HTMLSelectElement>('select[data-theme-mode]');
const unsubscribe = theme.subscribe(state => { if (modeSelect) modeSelect.value = state.mode; });
// 应用卸载时 unsubscribe；文档级所有者销毁时 theme.destroy()。
```

应用自己创建控制器时同一 document 只创建一次。`storageKey` 可覆盖；首屏脚本与应用须使用同一 key。默认 `system`；无效值回退，存储拒绝保留内存选择，系统读取失败生效 light。显式主题不受系统改变影响。导入模块不访问 DOM，SSR 可以导入；当前消费样本是客户端页面，未验证产品 SSR hydration。

## 规范与生成流程

`docs/DESIGN.md` 的 `design-default-css` 是完整受控原始值来源。`scripts/tokens.mjs` 原样提取到忽略的构建目录，并检查全部引用、依赖循环、271 个根变量、浅深/system 配方、减少动效配方、YAML 颜色/文字/圆角/间距/组件摘要和消费样式引用。`pnpm check:tokens` 比较实际生成文件，不能通过手改 dist 维护一套默认值。

示例蓝色覆盖也从规范的 `design-product-css` 提取，作用于同一根元素的 `product-overrides` 层。组件仅消费语义/必要组件变量；对源码 CSS 检查缺失 var、原始色值、基础 palette 回流和额外默认变量。产品覆盖只改变品牌操作对、按钮高和最大宽度，不改变状态或 document 色板。CSS 变量在根元素求值，子树主题不是本版接口。

## 组件映射

| React API / CSS | 实施职责 |
| --- | --- |
| `Button` / `.xui-button` | 原生 button，默认 type=button；primary/secondary/outline/ghost/destructive、xs/sm/default/lg。真实 disabled、aria-busy 由使用者提供；不自行请求或猜业务防重 |
| `IconButton` | 必须提供 aria-label，复用 Button 和统一图标尺寸 |
| `Field` + `Input`/`Textarea`/`NativeSelect` | label→control→help→error；自动关联 id、required、invalid、describedby。每个 Field 一个控件；显式 id 用 Field 的 controlId 保持关联。保留 readOnly、原生选项和 ref |
| `Checkbox`/`Radio`/`Switch` | 原生 input，包裹 label；checked/defaultChecked/name/onChange 全部由原生/调用方拥有。Switch 使用原生 checkbox 与 switch 语义 |
| `Nav`/`NavItem` | 原生 nav/link；selected 映射 aria-current，左短竖线独立定位，不改变内距。disabled 去 href、退出 Tab 顺序并禁止 click；disabled+selected 保留归属 |
| `Tabs.Root/List/Tab/Panel` | Base UI peer 管理激活和 panel 关联。1.7.0 原生策略允许 disabled tab 获得方向键焦点；List 仅适配方向键/Home/End 焦点以跳过 disabled，保留 RTL、orientation 和 loopFocus。默认手动激活，Enter/Space 确认；可传 activateOnFocus。旧 panel 立即隐藏，保留新 panel 淡入 |
| `Alert` | 被动状态表面；error 默认 alert，其余默认 status，文字由调用方提供；不将业务错误改为空态 |
| `Surface` | 被动 section，raised、一层边界，无 hover/焦点伪语义 |
| `Dialog.Root/Trigger/Content/Title/Description/Body/Footer/Close` | Base UI 模态、portal、Esc/取消/回焦点；不自动保存，body 滚动、footer 可达。Content 提供公共 backdrop/popup 样式。移除触发器时调用者需指定 peer 的 finalFocus |

Base UI 的 `render`、ref、事件与 className 函数保持可传递。Dialog/Tab 的生命周期根据实际 transition 处理，不用计时器阻挡真实操作。[Dialog 官方交互 API](https://base-ui.com/react/components/dialog)、[Tabs 官方 API](https://base-ui.com/react/components/tabs)；实现以安装的 1.7.0 类型和浏览器结果为准。

Tabs 的键盘适配在 List 冒泡阶段执行，保留 Tab/List 的 capture 和 bubble 回调。遵循 peer 的事件契约：在 `onKeyDown` 中调用 `preventBaseUIHandler()` 取消控件导航；`preventDefault()` 只阻止浏览器默认行为，方向键仍跳过 disabled。方向优先来自 Base UI `DirectionProvider`，无上下文时采用 DOM 的计算方向；Shift/Alt/Ctrl/Meta 不参与普通方向导航。上下文通过 peer 正式导出的 `internals/direction-context` 读取，升级 peer 时应重跑此契约回归。

Vanilla 示例用原生 dialog.showModal/close 与最小采用层绑定实现焦点循环和恢复；这些绑定在示例内，主题 runtime 不承担控件状态或业务。

## 操作反馈覆盖

| 操作 | 本版反馈 | reduced-motion |
| --- | --- | --- |
| 鼠标/键盘/触屏按钮 | 按压色/小幅 scale；Enter/Space data-pressed；点击立即执行 | 时长0、scale1，真实结果文字即时更新 |
| checkbox/radio/switch | checked 底色、勾选/圆点、已有轨道内拇指过渡 | 状态即时，必要指示保留 |
| 导航 | 选中底色/文字、独立指示淡入；hover 不改变归属 | 指示立即显示；focus 独立 |
| Tabs | focus 移动、确认 active、新 panel 淡入 | panel 即时替换 |
| 输入/清除/错误 | 焦点/边线过渡，错误文字立即出现，清除立即更新值 | 即时错误、值和 focus |
| Dialog 打开/取消/Esc | 进入/退出 opacity；React 可选微缩放，取消立即改变 open 并回焦点 | 无延迟完成及回焦点 |
| 主题/配方选择 | 控件、页面语义色过渡，草稿保留 | 即时切色 |

原生 select 的弹出面板由浏览器/OS 负责；不声称 CSS 控制原生弹出动画。没有添加虚假异步等待：示例保存只写内存，等待同步按钮是明确的合成 disabled+busy 样本。

## 消费示例的首屏声明

两个示例都回答“如何调整并保存此工作空间偏好”：核心内容是名称、当前草稿/保存状态、外观和主要保存操作；更多设置和长说明次要。说明由“使用说明”打开、取消/Esc 关闭并回焦点，校验错误在字段位置可见。

声明默认支持 1280×800 和 390×844；首屏关键标题、名称和“保存偏好”必须完全可见、无水平裁切且真实可点击。长中文输入保留完整值和原生水平浏览；长帮助在 dialog body 内滚动。200% 文字放大允许自然纵滚，操作仍可达。真实原生浏览器缩放与移动 OS 面板列在验证限制中。

## 范围

这是基础端到端第一版，没有完整 Dropdown/Combobox/Calendar/Table/图表/编辑器实现，没有密度切换要求。没有产品路由、权限、API、会话或交易抽象，没有发布、部署或产品迁移。扩充控件与采用页面按 [迁移计划](MIGRATION.md) 继续。
