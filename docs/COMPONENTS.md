# 组件手册

按当前任务查阅下列章节。正式入口与类型见 [PUBLIC_API](PUBLIC_API.md)，默认视觉值与状态要求只由 [DESIGN](DESIGN.md) 定义；已执行与未测范围统一见 [VALIDATION](VALIDATION.md)。React 和原生共用公开组件与主题，公共控件不依赖消费方重写内部皮肤。

项目自己的业务组合和布局按 [私有组合组件设计方法](DESIGN.md#项目私有组合组件的设计方法) 与 [页面信息呈现方法](DESIGN.md#首屏信息架构与信息密度) 设计，再从本手册选择已有能力；项目布局样式与公共控件内部皮肤分别由各自所有者维护。

按章节查阅：

- [基础组件与通用状态](#基础组件与通用状态)
- [原生控制器](#原生控制器)
- [局部反馈与离线](#局部反馈与离线)
- [文本输入](#文本输入)
- [密码输入](#密码输入)
- [成组选项](#成组选项)
- [选择与复合控件](#选择与复合控件)
- [展示与媒体](#展示与媒体)
- [布局与顶栏](#布局与顶栏)
- [导航与菜单](#导航与菜单)
- [弹层与工具栏](#弹层与工具栏)
- [数据表格](#数据表格)
- [登录与管理员表单](#登录与管理员表单)

## 基础组件与通用状态

### React 公共组件

宿主通过公开的数据、状态、内容与事件 props 使用 React 组件；xui 提供其默认内部结构、样式、motion、focus 与可访问性行为。采用时不要求产品修改内部伪元素或补写选中皮肤。扩展通过该组件已公开的 props、部件/slots 和 theme 变量进行，当前项、路由及业务事实仍由宿主决定。菜单/布局已提供数据驱动接口；其他基础组件继续采用各自公开的 props 与部件。

| 能力 | API 与边界 |
| --- | --- |
| 操作 | Button/IconButton 复用 Base UI Button，支持 ref、render、nativeButton、className 函数、事件取消；默认 type=button。aria-busy 与 disabled 独立，不自动防重。render 为链接且希望链接语义时明确 role=link；nativeButton=false 保持 peer 默认按钮语义 |
| 字段 | Field 每个一个 Input/Textarea/SimpleSelect 或 choice。controlId 是显式 owner；未给 controlId 时识别直接或结构包装内已知控件的 id。自定义复合控件用 controlId 显式关联。help/error/required/invalid/describedby 自动关联；readOnly/ref 保留 |
| 分组 | Fieldset 清除单字段上下文，独立 legend/help/error；Checkbox/Radio/Switch 各有自己的 label、name、checked/defaultChecked 和 onChange，不共用输入 id |
| Tabs | Root/List/Tab/Panel 复用 peer；方向键/Home/End 仅适配跳过 disabled，保留手动/自动激活、loop、RTL/orientation、ref/render/className 函数和 Tab/List capture/bubble。preventBaseUIHandler 取消控件行为，preventDefault 仅取消浏览器默认 |
| 复合选择 | Select/Combobox 复用 peer generic Root，样式部件、Content portal/positioner/popup；受控、禁用、搜索空结果和取消仍由 peer/宿主负责。Positioner 测量通过 CSS，无 JS 色板 |
| 弹层 | Dialog、Sheet、AlertDialog、ContextMenu、Menu、Popover、Tooltip。Root/Trigger/Content/部件延续 peer 生命周期。Menu disabled 项可在 peer roving 顺序获得焦点但不能执行；原生 menu 跳过 disabled。Tooltip 增加 role 和描述 id，Root.contentId 可指定关联 id；外部 handle 触发器由宿主显式 aria-describedby 关联 |
| 通知 | Toast Provider/manager/Root/Content/Viewport/Close 等复用 peer。peer 支持 collapsed/expanded，关闭控件在展开状态可访问，宿主不能将必要错误仅放在消失通知中 |
| 状态 | Surface/Alert、Badge/Skeleton/Spinner/Progress、Loading/Empty/ErrorState、DataRegion、RenderBoundary、useResource。错误/重试文字由宿主；render exception 重置不重试 Promise |

`Badge`、`BadgeProps` 与 `BadgeTone` 从 `@coffeehc/xui-react/feedback` 及根入口导出。`tone` 为 neutral/info/success/warning/error，默认 neutral；例如 `<Badge tone="success">运行正常</Badge>`。原生使用 `<span class="xui-badge" data-tone="success">运行正常</span>`，没有 Badge constructor。neutral、未设置 data-tone 与普通 Tag 保留无边框、无底色的被动文字；显式状态才应用语义前景/soft/line、横向间距和4px圆角。标签文字或图标由宿主表达状态，不自动增加 live region、tab stop 或脉冲。

Dialog 关闭不会自动保存；移除触发器时指定 finalFocus。浮层非模态时不 trap 焦点，模态与取消/回焦点按 peer。Tooltip.Content 内只有说明，交互内容用 Popover。动画使用统一 motion token；reduced-motion 下状态立即变化。

NavItem 未提供 selected 时保留标准 aria-current；仅 aria-current="page" 默认匹配选中竖线、浅底与强调文字/图标。step/location/date/time/true/false 均保留各自 ARIA 语义，不自动转成 page 或选中样式。显式 selected 优先：true 输出 page，false 移除 aria-current，包括与传入 aria-current 矛盾时；这是原有 selected 调用的行为。宿主可只传 aria-current="page" 或 selected，不必同时提供，不需要手工设置 ::before。

NavItem 默认渲染原生 a，也支持公开 render 元素或回调。例如 `render={<RouterLink to="/settings" />}` 或 `render={(props,state)=><RouterLink {...props} to="/settings" />}`；RouterLink 是宿主选用的组件，xui 不依赖路由包。它必须透传合并后的 props/ref 到一个链接元素，不能嵌套链接或丢弃 xui class/ARIA/事件。元素方式合并双方 ref、class 和事件；回调方式扩展事件/class 时用 Base UI 的公开 mergeProps，并保留 props.ref。render 回调 state 为 selected/disabled/collapsed；当前项与 disabled 的顶层 props 优先，disabled 在 capture 阶段阻止点击、中键与 Enter 导航。

启用状态保留原生 href、修改键、中键、target 和 download 的浏览器语义。宿主路由链接必须先调用合并的 onClick，再检查 defaultPrevented，且只拦截自己支持的同源普通主键导航。xui 不把全部链接点击强制转换为客户端路由。正式最小消费者 tests/fixtures/nav-contract.tsx 演示这项接入；产品路由是否避免文档重载仍要由采用项目验证。

## 原生控制器

### 原生公共结构与 controllers

body 使用 xui 类；portal/原生顶层弹层用 xui-layer。公共 layout/table/form 类与 React 对应，无示例私有布局要求。语义结构、label/name、aria-sort、区域名字、键和业务值由宿主提供。

原生 JS 当前由宿主组合公开 HTML 结构、xui CSS 类及所需 controller；例如 a.xui-nav-item 设置 aria-current="page" 即获得同一默认选中样式。它与已封装的 React 组件有区别，不能据此声称全部原生控件只传数据即可生成完整结构。

数据驱动导航是单独的公开组合：createNavigationMenu/createMenuLayout 接收数据并生成整个菜单/布局，采用方无需拼装其内部菜单 HTML。登录/API Key/业务日志/独立错误观察也有公开完整原生 factory，见对应合同文档；其他基础控件仍用上方公共结构。下面说明菜单组合的契约。

| `/dom` API | 输入和所有权 |
| --- | --- |
| bindPressFeedback(root) | 仅 Enter/Space 按压状态，不合成 click；返回释放函数 |
| bindMenuKeyboardFocus(popup) | 只投影所属 menu 的真实键盘焦点，不移动焦点或改变选择；pointer/blur 清理标记，释放恢复属性。原生 menu controller 与 React Menu/ContextMenu.Popup 已自动绑定，不能重复绑定 |
| createDisclosureController(trigger,panel) | aria-controls/expanded、hidden；open/defaultOpen、onOpenChange 和 syncOpen |
| createTabsController(tablist) | 原生 role=tab 的 data-value/aria-controls；手动默认、自动激活可选、RTL/Home/End、disabled 跳过、受控 value/syncValue |
| createDialogController(dialog,trigger) | HTMLDialogElement showModal/close、Esc cancel、data-xui-close、可见 finalFocus；显式初始焦点在showModal前快照并临时拥有autofocus，兼容Chromium legacy与新算法；属性在finally完整恢复；浏览器模态加库 Tab/Option+Tab 边界循环。close/syncOpen(false) 的确认关闭动作内完成一次焦点恢复，迟到 close 不覆盖宿主随后设置的焦点或已重开弹层；保留 restoreFocus 策略与叠层边界 |
| createSheetController(dialog,trigger)/createAlertDialogController(dialog,trigger) | 复用原生Dialog lifecycle，Sheet逻辑side、AlertDialog角色与显式/安全初始焦点；最上层取消/Tab，不以确认关闭当业务成功 |
| createContextMenuController(trigger,popup) | 复用Popover/menu，rightclick、Shift+F10/ContextMenu、坐标与focus/取消；触屏长按无通用保证 |
| createPopoverController(trigger,popup) | 浏览器 Popover API、位置测量、外点/Esc、可选 menu/tooltip、受控 open/syncOpen；非模态不 trap |
| createShellController(root) | 查找 sidebar-toggle/sidebar-dialog/sidebar/sidebar-content/main，单一 sidebar 在窄屏移入 dialog，宽屏回原位置 |
| createToastController(viewport) | 纯文本通知、去重/限额、关闭、可选宿主 timeout、hover/focus 暂停并恢复；无默认自动消失 |

open/value 受控时仅发请求，宿主调用 syncOpen/syncValue 更新事实。onOpenChange/onValueChange details.cancel() 或取消可冒泡 xui:change 事件阻止请求。destroy 终止监听/定时器，宿主保管 controller。原生 menuitemcheckbox/radio 的 checked/value 由宿主更新，普通 menuitem 执行后关闭，检查项默认保留（data-close=true 可指定关闭）。

原生 Toast 的 hover 与内部 focus 都会暂停宿主指定的 timeout；两者都离开才恢复剩余时长，内部焦点迁移不恢复。计时使用所属 window 的 performance.now()，不受系统墙钟调整影响。当前不因 document.hidden 单独暂停，后台定时器调度由浏览器决定；必要事实和错误不能只放在自动消失通知中。

目标是支持 HTML dialog、Popover、matchMedia、AbortController、ESM dynamic import 的现代浏览器。标准示例与默认采用遵循[公共封装政策](DESIGN.md#公共复用与状态矩阵)：SimpleSelect / bindSelectControl 使用主题选择浮层，搜索选择复用 Combobox / CommandPicker。NativeSelect 与显式平台 binding 仅保留独立平台合同；其 OS 面板不声明跨平台统一。隐藏 select 仍是封装内部的表单与事件桥。

## 局部反馈与离线

### 局部失败反馈与离线边界

React DataRegion 只在调用方提供 feedback prop（包含 null）时常驻一个反馈槽；原生同角色使用公开 `.xui-feedback-slot`。共用 `--feedback-slot-block-size`，由已有字体/控件/内距/焦点 token 派生；错误完整保留，可在局部滚动并通过键盘访问动作。`.xui-reserved-action[data-inactive='true']` 仅隐藏辅助动作的绘制，调用方同时设置 aria-hidden、tabIndex=-1 与 disabled，不得保留不可见可交互控件。

DataTable 双端始终保留其状态行；登录页空反馈/隐藏动作不占位，实际消息自然增长，并用闲置/忙状态文案的实际尺寸约束主动作。API Key 与两类日志的空反馈和闲置取消动作不占位；真实反馈仍在所属区域完整显示。API Key 的刷新与创建同属页头动作组，状态紧邻名称；业务日志把摘要与结果前置，筛选使用同一个 Disclosure 外观。列表与详情的关闭先保留所属焦点事实，再隐藏内容，避免浏览器自动失焦被误认作宿主主动转移。原生列表只在实际顺序改变时移动 keyed 行，失败和同记录恢复不重建行控件。API Key 写入结果未知时读取普通列表一次，结束等待后允许用户手动再试，不自动重发写请求；瞬时 secret 释放、认证与权限规则见 [API Key 管理](PUBLIC_API.md#api-key-管理)。

这保证已加载应用在请求失败时的结构稳定，不保证首次从未加载资源且完全离线时可用。核心主题 CSS/字体/图标不依赖远端 CDN，但宿主配置的 logo、图片或延迟模块仍依赖其资源可用性。不增加 Service Worker、凭据持久化或自动重放。实际验证范围见 [失败布局验证](VALIDATION.md#失败复验与限制)。

## 文本输入

正式 React `@coffeehc/xui-react/text-inputs`、原生 `@coffeehc/xui-runtime/text-inputs-dom` 及 root 导出。共享数字纯函数在 `@coffeehc/xui-runtime/number-input`。复用 Input/InputGroup/Field 和 forms.css；没有 debounce、fetch、认证状态、密码策略或新颜色/尺寸 owner。Input 保留原有合同；NewPasswordFields 复用普通密码与强度输入，见 [密码输入](COMPONENTS.md#密码输入)。

React NumberInput/SearchInput 使用受控 value/onValueChange；PasswordInput 支持显式受控或 DOM 非受控模式。各组件保留 input ref、name、id、disabled、readOnly、required、placeholder、autocomplete 等原生属性；放在 Field 中复用 label/help/error，显式 id 可通过 Field.controlId 统一。原生 createX(host, options) 必填 label（安全文本），有同等 name/id/help/error/required/disabled/readOnly/placeholder/autoComplete；返回 element/input/update(partial)/destroy()。同一 host 单 owner，更新保持输入 identity，destroy 幂等释放监听并恢复原内容，不覆盖宿主自行替换的内容。宿主发布值是唯一已确认事实。

### NumberInput

value 是 number|null，空白提交 null，绝不转为 0。min/max 必须有限且顺序正确，step 默认为 1 且必须正数；外部 value 必须有限且绝对值不超过 Number.MAX_SAFE_INTEGER。本组件不适用于精确金额、大整数、ID；这些继续用字符串 Input 加领域 parser，不提供格式化/本地化或 decimal 引擎。

文本输入保留 `-`、`.`、`1e` 等编辑中间态；无关 render 或同值 update 不擦除 draft。真实 inputMode=decimal、role=spinbutton、aria-valuemin/max/now 保留可访问数字语义。onDraftChange（可选）每次编辑通知；onValueChange 只在 blur、非 IME Enter、方向键或步进按钮提交有效且与确认值不同的值时通知。onInvalidDraft（可选）在提交非法文本时通知 draft/error；输入始终以 customValidity 阻止非法/越界/不合步长表单提交。草稿和已确认值不同是有意设计；即使宿主拒绝步进值，aria-valuenow 仍是原确认值。更改外部 value 才替换草稿，form.reset 捕获阶段会先把 defaultValue 同步为最新确认值，浏览器随后的同步重置及立即 FormData 因此都使用确认值；后续 task 再同步 React 草稿，不发送变更。新 input 事件取消尚未执行的旧重置协调，保留新草稿及其有效性，不提交或改写确认值。React 在 input/change 事件结束时可能把 DOM defaultValue 写回草稿，所以不把该 DOM 属性当作确认值 owner，也不只依赖 layout effect。取消 reset 保留原草稿。

解析支持普通小数和指数，不接受千位分隔或 locale 小数逗号。step 以 min（否则 0）为基线，容忍有限浮点噪声；步进封顶到边界内合法格点，空值从 min（否则 0，负 max 时从不超过 max 的合法格点）开始。超出支持范围或无法安全计算步数时拒绝；不承诺任意小数精确性。wheel 不改值。原生额外提供 getDraft()/commit()；需要表单提交前领域验证仍由宿主拥有。

### PasswordInput

传 value 时为字符串受控模式，onValueChange 必填；不传 value 时为 DOM 非受控模式，不接受初始秘密 defaultValue。prefix/suffix 通过 InputGroup 前后缀组合；仅显隐在组件内，真实同一 input 在 password/text 间切换，保留 selection，按钮以 eye/eye-off 描边图标显示，保留 showLabel/hideLabel 可访问名称与 aria-pressed；静态 muted、hover primary，仍可 Tab 停靠。InputGroup 子 input 的自然滚动清距覆盖组边框与焦点轮廓，不用独立输入的边界代替整组。autocomplete 由调用点明确 current-password/new-password；没有 storage、日志、复制或请求。React 在 pagehide 同步清空 DOM value/defaultValue/隐藏密码并通知 onValueChange('')、onClear('pagehide')；真实卸载在一个 microtask 清空捕获的旧节点并通知 onClear('unmount')，避免 StrictMode 的检查性重挂造成伪清理。原生 pagehide/destroy 同步清空内部值与 DOM 并通知 onValueChange('')、onClear(reason)。宿主必须接受清空并同步删除其受控秘密；组件不能清理宿主拒绝删除的 state，也不能保证浏览器密码管理器、自动填充或内存取证清除。不要把真实秘密用于示例、SSR 初始 HTML、URL 或诊断。controlRef 提供 clear()（原生为 controller.clear()），ref 仍指向 input。固定新设校验与强度输入见 [密码输入](COMPONENTS.md#密码输入)，普通输入不限制既有账号登录密码。

### SearchInput

value 字符串受控，clearLabel 默认 Clear search；可选 onClear、onSubmit(value)、clearOnEscape（默认 false）。清除发空值意图并将焦点回输入；disabled/readOnly 不清除。onSubmit 存在时非 IME Enter 阻止原生隐式提交并只通知一次；没有 onSubmit 时保留浏览器表单提交。composition 期间 Enter 不发查询意图，组件不请求、不防抖、不改分页。输入和清除都由宿主发布最终值。

示例：[React](../examples/text-inputs-react/app.tsx)、[原生](../examples/text-inputs-vanilla/app.js)。纯模型/SSR/DOM identity 单测、正式 tarball 正负类型消费及独立浏览器键盘/表单/清理 suite 分开报告；截图覆盖 light/dark/system 与 320/390/1280，真正 200% Chrome Page zoom 使用临时 profile，不用 CSS/font/pinch 代替。受限执行器的 EPERM 不算通过，不关闭 sandbox。真实 hydration、读屏器、OS 密码管理器和移动输入法尚未验证。

## 密码输入

普通 `PasswordInput` 基于公开 InputGroup（Input、前后缀和显隐按钮）；`PasswordStrengthInput` 在同一个普通密码输入 owner 下仅增加一条连续强度条。React 与原生提供相同能力，不请求密码策略 API，不允许项目替换长度或评分规则。

新设密码固定为 **6–32 个 Unicode 码点**，不修剪、归一化或截断；拒绝孤立 UTF-16 代理项。中文、emoji 和组合符号按实际码点计数，不使用浏览器 UTF-16 minlength/maxlength 代替。强度低或估算器不可用都不增加提交门禁，服务端继续独立执行相同规则。

### 单框与组合

| 用途 | React | 原生 |
| --- | --- | --- |
| 普通密码输入 | `PasswordInput`，`@coffeehc/xui-react/text-inputs` | `createPasswordInput(host, options)`，`@coffeehc/xui-runtime/text-inputs-dom` |
| 带本地强度的输入 | `PasswordStrengthInput`，`@coffeehc/xui-react/password` | `createPasswordStrengthInput(host, options)`，`@coffeehc/xui-runtime/password-dom` |
| 新密码与确认组合 | `NewPasswordFields`，`@coffeehc/xui-react/password` | `createNewPasswordFields(options?)`，`@coffeehc/xui-runtime/password-dom` |

普通与强度输入支持 prefix/suffix；显隐使用 eye/eye-off 描边图标，showLabel/hideLabel 继续提供可访问名称与 aria-pressed；切换保留 input 节点和选区，disabled/readOnly、form 关联、键盘和字段描述沿用基础输入合同。React 可显式受控（value/onValueChange），或不传 value 使用 DOM 非受控模式。ref 指向 input，controlRef 的 clear() 负责命令式清空；原生也提供 clear/update/destroy。新密码组合默认使用非受控输入，秘密留在 DOM/ref，不进入公开状态。

```tsx
const fields = React.useRef<NewPasswordFieldsHandle>(null);
<NewPasswordFields ref={fields} disabled={submitting} />
// 放在宿主表单中，仅在明确提交时读取：
const password = fields.current?.readValidatedPassword();
if (password == null) return;
try { await initializeBusiness({password}); }
finally { fields.current?.clear(); }
```

初始不显示规则、计数或错误；`readValidatedPassword` 才校验并聚焦出错字段，以既有非模态 Tooltip 在字段旁显示“至少6个字符”“最多32个字符”“密码含无效字符”或“两次密码不一致”。浮层不占表单正常布局高度、不抢焦点，Esc/blur 收起，仍无效的字段再次获得焦点时重开，输入后清错。input 的 aria-invalid 与稳定的描述节点保持关联，收起视觉 tips 后仍可读取错误；其他 Field 继续保留既有 inline error 合同。只在有效且可提交时返回原始密码。原生 `createNewPasswordFields({disabled,labels,document})` 返回 element、setDisabled、readValidatedPassword、clear、destroy；没有 policy/setPolicy。labels 只翻译文案，不改变固定校验。

runtime/password 公开 `passwordMinimumCharacters`、`passwordMaximumCharacters`、`countPasswordCodePoints`、`validatePassword(password)`、`validateNewPassword(password,confirmation)` 和 `getNewPasswordErrorMessage(error,labels?,count?)`。旧 PasswordPolicy/parsePasswordPolicy/loadPasswordPolicy 与 GET password-policy 接口已移除，不保留配置兼容壳。

pagehide、clear、reset 与卸载/destroy 清空所属非受控输入及派生反馈，丢弃迟到评分；受控输入的值由宿主确认。组件不发起账号变更、登录或密码保存。宿主提交回调应在 finally 丢弃自己的密码引用，不写 URL、日志或 storage。旧账号登录不套用新设密码校验；认证始终由服务端负责。

#### 本地密码强度建议

两端 PasswordStrengthInput 与 NewPasswordFields 默认在输入暂停 150 ms 后本地估算。输入下方仅有一条 4px 连续 meter，以实际评分 0–4 映射五档 20/40/60/80/100% 长度；弱、中、强分别映射现有 error、warning、success 语义颜色。idle/loading/unavailable 保留空轨道，不画假分；无可见等待文案、规则段、字符计数或改进建议。meter 的 min=0/max=5，ready 时 now=score+1，aria-valuetext 与 sr-only live status 提供实际强弱或未就绪状态。使用 MIT 的 @zxcvbn-ts/core 4.2.0、language-common 4.1.3、language-en 4.1.1，识别常见密码、顺序、重复、键盘及常见个人信息模式，不按字符种类自行打分。固定映射：评分 0–1 为弱，2 为中，3–4 为强。强度仅供参考，任何分数都不参与 readValidatedPassword 的提交许可；强制规则固定为 6–32 个 Unicode 码点。

引擎和 common/en 字典在包构建时编成自包含固定 worker 源码，以动态 import 首次输入时懒加载。库在本地 Blob worker 中执行，ready 后才读取最新输入并通过本地 postMessage 发送；主线程不解析字典或执行评分，评分实例只存在于单次 worker 调用中。宿主无需 worker 打包插件；正常 ESM 动态导入拆包保留懒加载，显式关闭代码拆分的 bundler 会把模块合并进初始脚本。正式独立 tarball 消费者分别记录引擎与初始静态 JS 图体积，精确结果写入 strength-bundle.json；初始图不得包含引擎和字典。构建产物体积不等于浏览器运行时延迟，入口静态依赖图与既有全库体积门禁继续检查。

首次离线、Worker 不可用、打包产物不可加载或宿主 CSP 禁止 blob worker 时，保留空轨道，可访问状态为“暂不可评估”，不影响提交。库不修改、不要求放宽 worker-src/CSP，不会假称强。字典以常见模式和英文为主，对其他语言、人名、产品上下文及新泄露密码的识别有限；“强”不保证安全。估算为限制同步 CPU 工作只处理最多 256 个 UTF-16 单元，超出显示无法评估，不截断密码，也不改变服务端策略校验。复杂 Unicode 的强制长度仍按上面的码点规则。

公开 runtime/password 提供 createPasswordStrengthController({readPassword,onChange})、PasswordStrengthState 和 getPasswordStrengthSummary。控制器 refresh/clear/destroy 只回传状态、评分、等级和提示分类，不返回密码、匹配词或猜测轨迹。单框直接使用 PasswordStrengthInput，密码确认组合使用 NewPasswordFields，无需另建评分 owner。NewPasswordLabels.strengthLabel 翻译 meter 名称，strengthSummary 翻译可访问状态；labels 不改变评分与校验。

输入不上传、不进入 URL、日志或 storage，不使用远程泄露查询或网络 matcher。读取输入发生在引擎加载完成后，异步等待不保存密码快照；每次输入、clear 和卸载使旧 generation 失效，迟到加载或评分不能覆盖当前提示；卸载通过 AbortSignal 立即终止正在加载或工作的 worker。pagehide/clear/destroy 同步清除输入和显示状态。评分不用于旧账号登录密码限制。字典可缓存，但每次估算使用独立 Factory，避免其内部 scoring 缓存长期引用最近密码；JavaScript 字符串无法承诺物理内存清零。

实现依据：[zxcvbn-ts 指南](https://zxcvbn-ts.github.io/zxcvbn/guide/)、[懒加载](https://zxcvbn-ts.github.io/zxcvbn/guide/lazy-loading/)、[4.x Factory](https://zxcvbn-ts.github.io/zxcvbn/guide/migration/)。回归覆盖常见/重复/顺序模式、有效弱密码允许提交、懒加载隔离、离线和迟到结果。浏览器应记录实际输入事件、LongTask 与计时器延迟，不能由构建或 worker 结构推断响应性能；实际执行范围见 [VALIDATION.md](VALIDATION.md)。

已移除无用的 count、strength、strengthAdvice 文案入口与 getPasswordStrengthMessage；没有第二份建议/计数布局或 Disclosure owner。清空保留空轨道，丢弃上次评分；短错误文案的 length/tooShort/tooLong/invalidUnicode/confirmationMismatch 入口继续可翻译。

## 成组选项

正式 React `@coffeehc/xui-react/choice-group` 和原生 `@coffeehc/xui-runtime/choice-group-dom`。共享纯模型来自 `@coffeehc/xui-runtime/choice-group`。均从 root 导出。复用 Fieldset/Checkbox/Radio 的原生语义和 forms.css，不新增皮肤或权限后端。

两端 options 是唯一 key 的 `{key:string,label:string,disabled?,readOnly?}` 数组；label 是安全文本。legend 必填；name/help/error/disabled/readOnly/required 可选。CheckboxGroup 的 value 是 readonly string[]，RadioGroup 是 string|null；onValueChange 只发意图，宿主必须回传 value。拒绝/延迟更新不改变已确认值。React 接受原 fieldset DOM props/ref；原生 createX(host,options) 返回 element/update(partial)/destroy()，每个 host 唯一 owner，destroy 可重复且恢复原内容（宿主自行替换内容时不覆盖它）。更新文案/回调/选值保留同 key 节点；删除焦点项回到剩余第一个可用选项，不抢外部焦点。

CheckboxGroup 显式 selectAll 字符串开启全选；只选择当前 options 中非 disabled/readOnly 的全集，不代表跨页查询全部结果。全选/清空保留未知及不可编辑 keys。部分态由同一 value 计算。未知值显示非 live 诊断并保留，不擅自清理权限。name 只赋给实际选项，全选不提交；未知值不创造隐藏表单字段，宿主必须使用受控 value 处理未知权限。

required 复选组表示至少选择一个当前已知选项，通过首个可用输入的原生 customValidity 实现，不要求每项都选；零项/全 disabled 没有可验证输入，业务必须明确处理不可填写状态。只读组不阻止原表单提交。单选组使用同 name 真实 radio，浏览器负责方向键和组级 required；未给 name 时产生组内唯一名称，宿主不得给两个独立组同一 name。被选中的 readOnly 单选项锁定整组，防止另一选项隐式取消它。只读不移除表单值或焦点，disabled 继续遵守浏览器表单排除规则。两端 defaultChecked 始终派生自最新受控事实，所以原生 form.reset() 返回时的 FormData 已一致；reset 后续 task 再恢复部分态，不使用可能早于浏览器默认动作的 microtask，不发业务变更；宿主需要清空应显式发布新 value。

示例：[React](../examples/choice-group-react/app.tsx)、[原生](../examples/choice-group-vanilla/app.js)。独立打包/正负类型消费纳入 consumers；纯模型、DOM identity 与 SSR 单测并非真实浏览器、hydration、读屏器验证。真实键盘、required、FormData 和焦点回归由 choice-group browser suite 验证；受限执行器不得关闭 sandbox 来运行。

## 选择与复合控件

唯一完整规则及默认值见[DESIGN](DESIGN.md)。本节说明选择与复合控件；[公开入口](PUBLIC_API.md)、[React消费者](../examples/widgets-react/app.tsx)、[原生消费者](../examples/widgets-vanilla/app.js)使用正式CSS/ESM/types，不依赖私有皮肤、源码alias或下游Tailwind扫描。合成宿主不是产品迁移。

| 能力 | React公开接口 | 原生公开合同 | 默认与所有权 |
| --- | --- | --- | --- |
| Command | `/command`的CommandPicker | `/widgets-dom`的createCommandPicker(root,options) | mode=single；multiple保留过滤前已选id；action回调不存选择。items={id,label,group?,keywords?,disabled?}；value/defaultValue均id数组，single至多一个。label必填，空态可改。数据/领域权限/远端搜索/动作busy由宿主，选择只是草稿，确认另由宿主执行 |
| Calendar | `/calendar`的Calendar，独立`/calendar` runtime model | createCalendar(root,options)、createCalendarModel | mode=single；range={start,end}，空端点null，start/end有序。严格YYYY-MM-DD，defaultMonth=YYYY-MM；locale默认zh-CN/weekStartsOn=1。显示只用UTC日期字段，无瞬时时区转换；业务时区与日期→时间端点转换由宿主明确。today可给确定日期，省略用当前UTC日。不猜字符串日期/毫秒/时区 |
| ToggleGroup | `/toggle-group`的ToggleGroup.Root/Item，peer props/ref/render | createToggleGroup(root,options)，现有button[data-value] | 单选默认，value/defaultValue是字符串数组；multiple/allowEmpty/disabled/orientation。allowEmpty默认true；false阻止取消最后一项，但不替宿主猜初始值。方向键/Home/End只移动焦点，Space/Enter选择；不冒用Tabs语义 |
| Accordion | `/accordion`的Accordion.Root/Item/Header/Trigger/Panel | createAccordion(root,options)，公开details[data-value]/summary/内容类 | value/defaultValue为id数组，默认single，可multiple；禁用项原生data-disabled=true。Tab/Enter/Space按按钮/summary语义；peer1.7已弃用Accordion强制箭头roving，不编造键盘默认。展开内容由宿主，不接业务流程 |
| ScrollArea | `/scroll-area`的ScrollArea.Root/Viewport/Content | `.xui-scroll-area/.xui-scroll-viewport/.xui-scroll-content` | 浏览器原生滚动与滚动条，无第二JS引擎。Root由宿主给blockSize/maxBlockSize等界限；Viewport=min-size:0/overflow:auto，默认tabIndex=0、role=region、focusMode=gutter；显式inset通过CSS @scope同时移除gutter并向内绘制焦点，旧引擎保安全gutter，嵌套边界各自选择，宿主给aria-label。内容同节点更新保留滚动，宿主拥有路由历史恢复和任意虚拟化 |
| InputGroup | `/forms`的InputGroup.Root/Addon/Input/Textarea/Button，复用Field/Input | `.xui-input-group`内`.xui-input-addon/.xui-input/.xui-textarea/.xui-input-action` | 一个Field仍只有一个control，Addon不领id；native label/for/help/error由宿主准确连接。focus-within仅组边界，输入自身无第二outline；invalid由Field或aria-invalid合成。内嵌Button type=button，显式disabled不猜busy |

Command复用已安装的Combobox：inline列表、搜索、分组、空态、disabled、选择与键盘；只声明上述稳定组合，不照搬cmdk。原生输入保持DOM identity，aria-controls/activedescendant/selected/multiselectable同事实；ArrowUp/Down/Home/End跳过disabled，Enter执行，Escape清过滤而保留选择。action不作权限/副作用校验，也不自动等待/重放业务。需要远端搜索或更细peer部件时组合已有Combobox/Select，不能用私有默认样式补丁。

Calendar使用一个框架无关model；更新一次发布一致快照，选相邻月份后保留所选日焦点。Arrow左右一天、上下七天、Home/End周端、PageUp/Down按月并夹到有效日，Enter/Space走按钮选择；禁用日期可焦点读取但不能选择，clear清空选择。月份查看不是业务查询，动画不等待操作。没有时间选择器、农历、复杂可用性/节假日或预约引擎。defaultMonth只定义初始视图；未传month时月份查看由库保存，month=YYYY-MM为受控视图。onMonthChange只通知用户翻月、跨月键盘或相邻月日期选择的请求；外部update({month})/React month变化不通知，不改变value，不触发onValueChange。原生model.setMonth(YYYY-MM)是绝对月份请求，moveMonth(delta)沿用相对移动；同月setMonth为no-op。受控宿主未确认时保持原查看月，焦点仅在现有42格内移动，接受请求后恢复目标日；外部跳月回该月首日，标题与grid保持一致。disabled仍允许浏览月份但禁止选择/清空，disabled日期可读取。年份严格0001..9999，无隐式时区转换。

快速年月定位使用公开Input、SimpleSelect、Button与受控month组合，见[React](../examples/calendar-month-react/app.tsx)/[原生](../examples/calendar-month-vanilla/app.js)。日期与月份可独立受控；single/range不因翻月清空，locale只改变显示。defaultMonth的后续变化不重置视图；不通过修改value或重挂Calendar定位。

ToggleGroup 的紧凑高度使用 `--toggle-height`，不继承普通 Button 的高度；文字放大仍可自然增高。InputGroup 的边框属于组外壳，内部单行/多行控件分别消费 `--input-group-control-min-height` / `--input-group-textarea-min-height`，扣除外壳边线后与独立 Input/Textarea 对齐；内嵌动作复用同一内部高度。默认值与覆盖由 [DESIGN](DESIGN.md#组件尺寸与职责) 定义，不在组件硬编码像素。

Calendar 的禁用日期不出现可操作的 hover/pressed 底色；选中端点在 hover 后保留选中底色。forced-colors 下 Calendar 和 ToggleGroup 用额外下划线保留选择事实，焦点仍由独立 outline 表达。

原生工厂只拥有指定root，update(partial)保留选项；受控value由宿主确认，defaultValue只读初始。destroy恢复创建前root/相关控件属性并释放监听/计时器；destroy幂等，已销毁update无效，旧句柄不影响重建owner。同root不能重复创建活跃widget。Callback只能接受公开事实；安全权限/业务结果由宿主确认。原生ScrollArea/InputGroup为HTML合同，没有隐式controller。React同peer单实例，原生不引入React。

### 多行输入与上下工具区域

`InputGroup.Root` 的 `layout='inline'` 为默认横排，显式 `stacked` 按 DOM 纵向排列、拉伸控制项。`InputGroup.Textarea` 就是已存在的 Textarea 函数，直接接受 textarea props/ref；id、name、required、label/help/error 继续由 Field 与真实控制项共同绑定。只生成 xui-textarea，不额外套 xui-input。上下 `Addon` 使用 span，放合法短语内容、附件文字和按钮；自然换行，采用既有 padding/gap，空 Addon 不占位，不新增 Toolbar part。

```tsx
<Field label="草稿" help="可输入多行" required>
  <InputGroup.Root layout="stacked">
    <InputGroup.Addon><span>附件.txt</span><InputGroup.Button>移除</InputGroup.Button></InputGroup.Addon>
    <InputGroup.Textarea name="draft" defaultValue="保留草稿" />
    <InputGroup.Addon><InputGroup.Button>附加文件</InputGroup.Button><InputGroup.Button disabled>发送</InputGroup.Button></InputGroup.Addon>
  </InputGroup.Root>
</Field>
```

原生使用 `.xui-input-group[data-layout='stacked']`，内部直接 `textarea.xui-textarea` 和上下 `span.xui-input-addon`；label for、help/error id、aria-describedby/aria-invalid/required 由宿主连到 textarea。唯一背景、边线和 focus-within 在组外壳；直接 Input/Textarea 不再画边线/背景/outline，Textarea 自身的 padding、字体、最小高度与原生 resize 保留。焦点中的工具按钮仍有可辨指示；invalid 与 focus 共存。组的 invalid/disabled 只由直接真实 Input/Textarea 与既有 Field error 投影，单独禁用发送按钮不会灰掉可编辑区域；没有第二个 Root.disabled/invalid owner。readOnly 保留原生选择/复制和焦点语义。

库不处理 Enter/IME/提交策略、发送 busy、草稿和附件状态。正式 [React](../examples/widgets-react/app.tsx) / [原生](../examples/widgets-vanilla/app.js) 的“多行字段组合”给出合成示例；`widgetsDemo.setComposerState` 可改变 layout/disabled/readOnly/invalid/sendDisabled/emptyAddons，`getComposerControl` 返回真实 Textarea，`getComposerEvents` 仅计合成 composition start/update/end 事件，不构成 OS IME 验收。没有具体产品域模型或网络调用。

### Button与选择控件补齐

Button variant=link提供文字链接外观，默认type=button。button继续Enter/Space执行；真正导航需render原生a、nativeButton=false和role=link（或直接原生a.xui-button[data-variant=link]）。链接保留Enter、Space不模拟点击、修改键/中键/target/download；外观不改变导航所有权。aria-busy仍不自动disabled，焦点独立可见。

SimpleSelect/Checkbox/Radio/Switch的controlSize=sm/default/lg是视觉尺寸，默认default；SimpleSelect的size:number只作为隐藏表单桥事实。显式NativeSelect平台API保留原生size:number，默认采用政策见[DESIGN](DESIGN.md#公共复用与状态矩阵)，不增全局密度模式。原生用data-control-size对应。选择readOnly由公共层阻止click与Space（radio也阻止改变选择的箭头），保留Tab/指针焦点与aria-readonly；不等于disabled。React受控checked和非受控defaultChecked均支持，readonly不触发onChange。原生checkbox/radio调用bindReadonlyChoice(input)，使用input.readOnly事实、sync更新ARIA，destroy释放；不使用HTML readonly属性单独冒充功能。disabled走原生disabled，表单提交语义不改。

### 平台输入边界

NativeSelect / 原生 select / bindHeaderLocaleSelect 保留 OS 选择合同，CSS 外壳不能统一系统菜单。文件窗口、日期/颜色窗口、浏览器自动填充与密码管理器、移动键盘也属于浏览器/OS 能力；需要统一 date-only 日历时使用 Calendar。HTML 不支持 file/range/color 的 readOnly，不能用无效属性冒充只读或静默改成 disabled。Checkbox/Radio/Switch 只读使用上方公开 guard/binding，文本 Input/Textarea 保留原生 readOnly。

Avatar 的被动图像、fallback 与名称合同见 [展示与媒体](COMPONENTS.md#avatar)。

### GroupedCombobox 与 Disclosure

正式消费：[React](../examples/grouped-search-react/app.tsx)、[原生](../examples/grouped-search-vanilla/app.js)、[合成宿主读取模型](../examples/shared/grouped-search-model.ts)。这是通用 UI 组合，不内置会话、归档业务、查询缓存或后端协议。

#### 为什么不能把 Disclosure 放进 Combobox.List

在固定的 Base UI 1.7.0 中，`Combobox.List` 的 Enter handler 只要存在 activeIndex 就会选择高亮项，不检查事件是否来自嵌套折叠按钮。`Combobox.Root inline open filter={null} → Input → List → Item + Disclosure(Item)` 因而不是 xui 支持的交互组合。即使没有复现错误，listbox 中也不应混入独立分页/折叠控件。

`Accordion.Root` 会建立另一份 CompositeList，影响 Item 注册；一个 Root 下放两个 List 又会竞争 listElement/listRef。两种写法均不在支持合同里。消费者不应添加 stopPropagation、穿透内部 DOM 或覆写 option 角色来补救。若需要每组内自由交互的表单/工具按钮，使用普通搜索和相应列表/表格语义，另设计键盘模式。

开发预览：运行 `pnpm dev`，待构建成功后在另一终端运行 `pnpm preview`；分别打开 `http://127.0.0.1:4173/grouped-search-react/` 与 `http://127.0.0.1:4173/grouped-search-vanilla/`。正式独立安装仍由 `pnpm test:consumer` 验证，完整回归为 `pnpm verify`。

#### 最小公开组合

两端加载正式 `@coffeehc/xui-theme/style.css`；React 不隐式导入 CSS。

- React：`@coffeehc/xui-react/grouped-combobox` 的 `GroupedCombobox`。
- 原生：`@coffeehc/xui-runtime/grouped-combobox-dom` 的 `createGroupedCombobox(root, options)`，返回 `update/getElement/getInput/destroy`。
- 共享类型与验证：`@coffeehc/xui-runtime/grouped-combobox`。纯验证函数 `getGroupedComboboxItems` 返回全量与展开组的选项，不发请求。

结构固定为一个搜索输入、仅可折叠组的同名开关、一个 listbox 中的分组标题/选项、listbox 外按组名标注的分页。控制区的名称由 controlsLabel 设置（默认“显示分组”，不额外显示标题）。归档开关与归档组同名，aria-controls 关联稳定容器；折叠时容器 hidden，选项卸载。不会产生两个 listbox 的复合注册竞争。

```tsx
<GroupedCombobox
  label="搜索结果"
  inputValue={query}
  onInputValueChange={setQuery}
  groups={[
    {id: 'normal', label: '普通结果', items: normalItems,
      pagination: {page: normalPage, pageCount: normalPageCount}},
    {id: 'archive', label: '归档结果', items: archiveItems, open: archiveOpen,
      pagination: {page: archivePage, pageCount: archivePageCount}},
  ]}
  onGroupOpenChange={setGroupOpen}
  onPageChange={setGroupPage}
  value={selectedId}
  onValueChange={setSelectedId}
/>
```

原生传入同样的 options，并在宿主状态改变后调用 update。两端的 groups、inputValue、open、pagination 均受控；回调只请求宿主更新，不先行猜测接受。`value` 可受控；省略时使用 `defaultValue`（默认 null）。onValueChange 仅在接受不同的选中值时回调，重复激活已选项不重复通知。搜索不会填成已选名称，也不因清空查询而清空选中值。条目为 `{id,label,disabled?}`；id 是不透明字符串，在全部组中唯一，包括折叠组。两个组件实例可使用相同业务 id，DOM id 仍独立。

组省略 open 时始终显示，不显示开关；显式 true/false 表示可折叠受控组。组 disabled 禁用其选项、开关和分页；全局 disabled 禁用全部操作。busy 只报告 aria-busy，分页是否禁用由 pagination.disabled 明确控制。emptyLabel 用于组外状态反馈；它可以由宿主表示正在读取、无结果或错误，不能把三者混为一谈。page/pageCount 为正整数且 page 不超过 pageCount；不透明 cursor 的映射仍由宿主负责。

#### 键盘、焦点与读取职责

| 情况 | 公共库 | 宿主 |
| --- | --- | --- |
| 查询 | 保持同一输入 DOM；单一 listbox 的 aria-controls/activedescendant | 一个 query 驱动两路过滤或远端请求；可防抖 |
| ArrowUp/ArrowDown、Enter | 跳过禁用候选，在展开且可用的选项中导航、选择；越过首尾先回无高亮的输入位置，DOM 焦点留输入；鼠标与 blur 不伪造键盘焦点 | onValueChange 执行业务选择；不会自动路由或发写请求 |
| 折叠开关 Enter/Space | 原生按钮只请求展开/收起，不触发列表选项选择 | 接受 open 状态；关闭时禁用归档读取并 Abort |
| 收起/替换选项 | 移除隐藏 options；活动项清除或回到仍可见的有效选项；不指向不存在的 DOM | 忽略取消后迟到结果，保留所需 query/selection |
| 分页 | 同组命名按钮、边界禁用；两组页码互不拥有 | 独立页码/游标和请求；查询变化如何重置由宿主决定 |
| 控制区焦点 | 更新保留按钮 DOM；聚焦的分页被移除时回该组开关，否则输入；不抢走已移到外部的焦点 | 关闭外层 Dialog/Sheet 时由外层拥有最终回焦点 |
| 卸载 | 原生 destroy 释放监听并还原 root；旧 handle 不可操作新 owner | 取消所属请求、释放订阅和外部数据 owner |

示例使用合成读取延迟，归档初始关闭时不读；展开才读；关闭取消正在进行的归档读取；关闭期间查询更新只读普通组；再次展开使用当前 query；两组各自分页。示例 generation/AbortController 是宿主参考实现，不是库内置请求引擎。

#### Disclosure 默认箭头

`Disclosure` 保留 title/open/defaultOpen/onOpenChange/disabled 合同，defaultOpen 默认 false。默认指示器已由加减号改为装饰性 chevron。公开 `DisclosureIndicator({open,className?})` 可在库支持的按钮组合里复用；它固定 aria-hidden/focusable=false，不提供额外 accessible name。title 应是非交互标签内容，不嵌套按钮。

原生 `.xui-disclosure-trigger` 配合 `createDisclosureController` 自动获得同样的 chevron；已有 `.xui-disclosure-indicator` 时不重复插入。controller 只在 destroy 时移除自己插入的图标。自定义 indicator 应自己设置 aria-hidden，不能替代 trigger 的 aria-expanded/controls。

尺寸来自 control-icon-size，描边来自 icon-stroke-width，旋转/过渡复用 motion-disclosure-rotation、motion-duration-fast、motion-easing；reduced-motion 复用主题的全局归零规则。公开 `.xui-disclosure-label` 提供长标签换行，disabled 不响应 hover/pressed。受控收起包含当前焦点的内容时回到 trigger；已经移动到其他位置的焦点不会被抢回。

## 展示与媒体

React `@coffeehc/xui-react/display`、原生
`@coffeehc/xui-runtime/display-dom`，共享状态/类型 `@coffeehc/xui-runtime/display`，均由各自根入口导出。
样式复用 theme/style.css（或 base.css、button.css、feedback.css），没有新字号、色板、路由或业务 owner。
正式独立安装示例：[React](../examples/display-react/app.tsx)、[原生](../examples/display-vanilla/app.js)。

### Typography

- `Typography.Heading` 必填 level 1–6，决定真实 h1–h6；visualRole 默认 section，page/section 只绑定既有标题 token，语义层级不改变视觉尺度。原生 `createTypographyHeading(document,{level,text,visualRole})`。
- `Typography.Text` 默认 span，可 as='p'；tone 为 default/muted/error/success，不使用任意字号系统。原生 `createTypographyText(document,{text,as,tone})`。
- `Typography.Link` 是真实 a，保留 href、target、download、rel、修改键与中键；不接管 router。原生 `createTypographyLink(document,{text,href,target,download,rel})` 返回同样的 a，宿主可通过公开元素设置标准 HTML 属性。
- `Typography.Code` 必填安全字符串 value；block 默认 false，true 输出 pre/code。原生 `createTypographyCode(document,{value,block})` 使用 textContent。没有 HTML parser、代码编辑器或高亮引擎。
- 原生静态构建器返回元素，不订阅全局事件、不需要 destroy；宿主管理其标准 DOM 内容/属性与生命周期。

### Copyable

React `Copyable`、原生 `createCopyable(document,options)` 使用相同 value、disabled、writeText、labels、onStatusChange。
value 必填，展示完整值且仅复制这个值。默认在用户点击后使用 Clipboard API writeText；不读取剪贴板，不尝试 execCommand/权限绕过。失败显示安全的就地文字，不泄露异常消息；调用方可注入 `(value:string)=>void|Promise<void>`，原生宿主桥接同合同。

idle/copying/copied/error 是当前交互事实。按钮 disabled 与 copying 独立于外部业务。
重复点击不并发写剪贴板；等待中的 write 不可取消，也不声称取消了系统写入。
value、writer 或 disabled 改变使旧结果失效；仍等待旧 write 结束后才能发起下一次复制，以免旧复制晚到覆盖新值。旧结果不会显示新值“已复制”。
状态不使用超时假定成功，不自动重试，不抢焦点。labels 可覆盖 copy/copying/copied/error。

原生返回 element/button/update/destroy；update 接收完整 options，保持按钮/反馈节点。destroy 释放监听并使迟到结果失效。React 卸载同样清理，SSR 不访问 navigator。
密码和其他秘密不默认接入；值与授权由宿主明确决定。

### Separator 与 Tag

`Separator` / `createSeparator(document,options)` 默认 horizontal、非装饰，具有 separator 与 aria-orientation；vertical 使用父容器 stretch，宿主提供布局高度；decorative=true 使用 none/aria-hidden，不成为多余读屏节点。

横竖线宽消费 `line-width-separator`，颜色消费 `separator-line`；Surface 仍独立消费 `line-width-surface`。默认均为 1px，同根 `product-overrides` 可独立覆盖分隔线宽，不改变区域边框。基础层实际验证和限制见 [VALIDATION.md](VALIDATION.md)。

`Tag` / `createTag(document,options)` 必填安全字符串 label。被动标签没有 tab stop。
可移除分支必须提供 onRemove 和明确 removeLabel，使用真实 type=button；disabled 不发意图。
标签没有隐式选择状态，选择 chip 使用已有 ToggleGroup。

onRemove 只发删除意图，不自动删除 DOM 或猜邻居。宿主更新其集合。
可选 `onRemoveFocus(trigger)` 在 onRemove 后调用，供宿主聚焦明确输入/已存在邻项；异步确认/React 提交后才能确定目标时，宿主在确认/提交后按自己的稳定 key 管理焦点。
默认不把焦点送到 body，不扫描同名标签。原生返回 element/removeButton/update/destroy，update 接收完整 options 并保留按钮身份。

### Image

`Image` / `createImage(document,options)` 必填 src 与 alt，装饰图片显式 alt=''。
必须提供有限正数 width+height，或 aspectRatio（可另给 width，不可同时给 height）。
这些是调用方内容尺寸，不是新的品牌 token。宽度最多为容器 100%，高度按预留比例计算；loading、error、loaded 共用同一外框，fit 默认 contain，可 cover。

缺省 loadingLabel='图片加载中'，fallback='图片无法加载'，均可本地化安全字符串。
内容图片在占位阶段保留 alt 与状态的可访问描述；装饰图片占位 aria-hidden。加载后只暴露真实 img 的 alt。
加载/错误回调 onStatusChange 报告实际资源事件；空 src 直接错误，不对当前页面发送空地址图片请求。

src 或显式 retryKey 改变才创建新资源；旧 img 事件不能覆盖新图。fallback 不是第二个 URL，不递归重试、不猜 CORS 代理；重试由宿主变更 retryKey 发起。原生 update 接收完整 options，校验失败不改变旧状态；destroy 断开事件并移除节点。React 更新保留外框，切换 keyed 资源隔离旧事件，卸载无迟到状态回写。SSR hydration 会读取当前 img.complete/naturalWidth，接续挂载前已完成的资源，不等待已经错过的 load/error 事件。

### MetricCard

`MetricCard` 是一个被动统计单元，复用 `Surface` 的单层表面、现有统计文字与间距 token。多卡排列仍由调用方的 `Grid` 决定。它不拥有指标列表、请求、状态引擎、数值格式化、单位推断或业务颜色映射。

React 正式入口为 `@coffeehc/xui-react/metric-card`，根入口同时导出 `MetricCard` 与 `MetricCardProps`。CSS 在已有 `@coffeehc/xui-theme/feedback.css` 中，也包含在 `style.css`、`components.css` 与 `critical.css`。

- `label: ReactNode`：调用方提供可读指标名，使用行内内容。
- `value: ReactNode`：调用方提供最终显示内容；数字 `0` 原样显示，不自动变成未知。格式化、单位、空值、错误与加载说明由调用方明确表达。
- `marker?: ReactNode`：可选逻辑行尾 slot，通常位于右上；RTL 时跟随逻辑方向。可以是图形、Badge 或已有公共控件。不传、`null`、布尔值、空字符串和空 Fragment 均不预留可见空间。
- 其余 `Surface` 的 section props、`className`、`style`、`ref`、ARIA 与事件透传；不提供 `children`，避免绕过名称/值结构。

根节点默认无按钮角色、tabIndex、点击反馈或 live region。内部 `dl`/`dt`/`dd` 关联名称和值；不会额外生成一排命名地标。调用方可按实际需要命名 section、提供 `aria-busy` 或在自己的反馈区通知状态。

标记不默认设置 `aria-hidden`。纯装饰图形由调用方设置 `aria-hidden="true"`；有含义的颜色必须同时有可读文字或可访问名称，不能只靠颜色传达状态。交互标记使用真实 Button/link 等公共控件，自行提供名称、权限、disabled/busy、Tooltip 与回调；卡片不会代管或截获其事件。标记应为行内内容，不在 `dt` 中嵌套章节标题或整块页面。

#### 主题、长内容与采用

名称用 body-xs/muted，值用 metric/heading/tabular-nums/mono，内距和名称到值的间距用 `metric-padding`/`metric-gap`；边框、背景和圆角仍由 Surface 的 card token 提供。没有新增默认设计值或固定宽高。长名称、连续长数字和字符串自然换行；名称按自然内容参与分行，宽标记空间不足时换到逻辑行尾，不把短名称挤成竖排。卡片高度随内容增长。Grid 的列数、自定义宽度与整体布局留给调用方。

组件、公开 CSS、正式导出和空值/标记的单元测试见 [metric-card.test.mjs](../tests/metric-card.test.mjs)；独立消费者的浅/深/system、320px/宽屏、276px 近满宽标记边界、长内容、200% 根文字、动态更新和交互标记检查见 [metric-card.spec.mjs](../tests/browser/metric-card.spec.mjs)。实际已跑范围与未测边界见 [VALIDATION.md](VALIDATION.md)。

### Avatar

React `@coffeehc/xui-react/avatar` 的 `Avatar.Root/Image/Fallback` 复用 peer 的加载 callback/delay；原生 `createAvatar(root,{name,src?,fallback,size?,delay?})` 从 runtime/widgets-dom 导入。默认 size=default（可选 sm/lg）、delay=0；图像加载、错误和文字 fallback 保持同一尺寸。头像是被动展示，不自动变成按钮或焦点目标；长 fallback 保留完整名称，不保证小圆内展示全部长字符串，也不扩大头像。

业务名称、图片地址和身份由宿主提供。原生 name 提供 role=img 的单一名称，内部图片 alt 为空；React 宿主提供适当 Root 名称与内图 alt，避免重复读出。三档尺寸消费同一公开 token，原生使用 widgets 的 update/destroy 生命周期；[正式双端示例](COMPONENTS.md#选择与复合控件) 和 [媒体浏览器合同](../tests/browser/media-foundation-contract.spec.mjs) 检查加载、尺寸、命名与裁切，实际结果见 [VALIDATION.md](VALIDATION.md)。
原生 MetricCard 使用公开 `.xui-surface.xui-metric-card`，内部 `dl` 含 `dt.xui-metric-card-header`、名称 `span.xui-metric-card-label`、可选 `span.xui-metric-card-marker` 和 `dd.xui-metric-card-value`。无 marker 时省略该节点；动态值用 textContent 或安全 Node 更新，不使用 innerHTML。完整可运行示例见 [React](../examples/metric-card-react/app.tsx) / [原生](../examples/metric-card-vanilla/app.js)。

## 布局与顶栏

默认尺度、边界与动效只由[DESIGN](DESIGN.md)定义；本节规定布局组合与内容所有权。[公开入口](PUBLIC_API.md)提供正式 exports/types，完整可运行消费者见[React](../examples/header-controls-react/app.tsx)和[原生](../examples/header-controls-vanilla/app.js)。不创建同义 PageLayout，不要求消费方修改内部DOM或写定位CSS。

### 语义区域矩阵

React 的 AppShell/MenuLayout 接收 ReactNode；原生 createMenuLayout 接收 Node/DocumentFragment/null，并通过 update 更新。AppHeader 独立组合采用同名顶栏属性。

| 区域 | React | 原生 | 默认与响应式 | 所有权/更新 |
| --- | --- | --- | --- | --- |
| 平台前置安全区 | headerSlots.leading / AppHeader.leading | 同名Node | primary最前、自动菜单开关之前；不收缩，默认为空 | OS/窗口态/真实尺寸和drag规则由宿主提供；不内置mac像素 |
| 顶栏品牌 | headerSlots.brand | headerSlots.brand | primary 内，长品牌省略；窄屏保持导航入口 | 内容由宿主提供；title仅未指定brand时回退 |
| 路径 | headerSlots.breadcrumb | 同名Node | 品牌右侧；窄屏单独换行 | 宿主提供nav语义，不推断路由 |
| 顶栏左中扩展 | headerSlots.context | 同名Node | primary末尾；窄屏另起一行 | 工作区/搜索等宿主内容，不与右辅助工具混合 |
| 运行状态 | headerSlots.status | 同名Node | secondary起始，按需换行 | 真实状态/文案由宿主提供 |
| 应用动作 | headerSlots.actions | 同名Node | 状态之后，可换行 | 不复制主题/语言/菜单控件 |
| 顶栏辅助工具扩展 | headerSlots.auxiliary | 同名Node | controls组内，语言/主题之前，可换行 | 不依赖locale启用，可放版本/帮助等宿主内容 |
| 默认主题 | theme / themeLabels | 同名选项 | 右侧controls最后，一个图标按钮 | 复用一个theme controller，无独立持久化 |
| 可选语言 | locale | 同名HeaderLocaleOptions | auxiliary之后、主题之前；未启用不生成控件 | 宿主i18n owner提供事实/列表/回调 |
| 独立账号区 | headerSlots.account | 同名Node | secondary最末，工具组之外；窄屏自然换行 | 账号菜单/认证/权限完全由宿主拥有 |
| 侧栏顶 | sidebarHeader | sidebarHeader | 菜单之前；与底部一起限制高度并可滚动；compact仍受公共栏宽约束 | 同一个侧栏树随响应式进入导航抽屉，不加第二个菜单开关 |
| 导航正文 | AppShell.sidebar / MenuLayout.items | items / sidebar Node | 长菜单自身滚动；sidebar替换完整默认菜单区，null恢复items | 一个shell/drawer owner；每个NavigationMenu拥有自身键盘，宿主保管自组内容生命周期 |
| 侧栏底 | sidebarFooter | sidebarFooter | 短菜单贴底；极长内容自身滚动 | 返回/授权/版本只是可选业务内容，无默认内置意义 |
| 页面标题与操作 | pageHeader内组合PageHeader(title/description/meta/actions) | pageHeader Node，使用公开xui-page-header/xui-toolbar结构 | 正文滚动流开头，标题右侧actions窄屏换行 | 复用现有PageHeader，不增加同义标题API |
| 页内工具条 | pageToolbar | pageToolbar | 标题下、主内容前；正文滚动流 | 过滤器/页内tabs/提示等宿主内容，不做数据owner |
| 主内容 | children | content或root原内容 | document/viewport自然正文；workspace模式填满剩余高度 | 恒定content容器，切换其他槽不重挂正文 |
| 页面底部 | pageFooter | pageFooter | 主内容后、同一正文滚动流，非悬浮覆盖层 | 页面说明/操作，与sidebarFooter独立 |

空的可选槽不占位；React undefined/null/boolean、空字符串/数组/Fragment不产生内容包装，数值0保留；自定义组件渲染结果由React决定，实际空DOM包装用:empty消除视觉占位。原生空槽不占视觉/键盘空间。同一个Node/已消费Fragment传回不重建内容、不重复绑定；需要替换内容传新Node/Fragment，清空传null/undefined。移除后恢复已消费Fragment须重新填入内容或保留Node引用。React遵循正常key/type协调，宿主有意移除某槽会卸载该槽内容，不影响其他槽、正文和导航owner。

富业务自组导航使用完整sidebar区域，不能把整份导航塞进sidebarHeader的限高槽。原生新增sidebar的节点保留、null恢复、替换焦点与清理边界见[导航合同](COMPONENTS.md#原生完整自组-sidebar)。

Tab按真实DOM顺序经过primary（leading、品牌、导航、路径、context）、secondary（状态、actions、旧header、auxiliary、语言、主题、account），然后侧栏/正文；不使用正tabindex重排。打开抽屉仍采用原模态焦点限制；关闭回同一个顶栏菜单开关。关闭当前聚焦的语言入口会把焦点移到相邻主题按钮。槽自身交互语义/disabled/busy由其组件或宿主拥有。

### 有界工作区与滚动所有权

`scrollMode` 使用共享 `ShellScrollMode = 'document' | 'viewport' | 'workspace'`，React AppShell/MenuLayout和原生createMenuLayout完全同型。默认仍为document，旧viewport语义不变：

- document：页面随文档自然滚动，适合普通列表/表单/文章。
- viewport：外壳默认100dvh，sidebar/main各自滚动；content仍为自然文档高度，不承诺把业务的100%高度解析为剩余窗口。
- workspace：外壳有界，顶栏按真实内容自然增高/换行；main内部pageHeader→pageToolbar→content→pageFooter，标题/工具条/底部占自然高度，content获得明确的剩余高度，默认允许收缩到零。公开token `--layout-workspace-content-min-block-size` 默认0px，库拥有这条可收缩链，不要求宿主测量顶栏、减固定头高或定位发送框。

workspace的顶栏和page slots不覆盖正文；主内容的业务布局通常使用height/blockSize:100%、flex/grid、min-block-size:0，再让指定历史/编辑器/检查器区域overflow:auto。发送区保持业务正常流、不收缩，历史区吃剩余空间。main/content的overflow:auto只作为无法拆分内容或页头/页尾过大的可达性兜底；正常可容纳的业务布局只有指定内部区域产生滚动。过大的固定业务内容仍需要可访问的滚动，模式不是把任意页面强行塞进首屏的裁切开关。不要叠加另一套body overflow锁、复制库内部CSS或绝对定位composer。

需要非零正文视口的组合可在shell公开style绑定 `--layout-workspace-content-min-block-size`，库把下限限制在100dvh内。DataTable正式范例显式绑定 `var(--data-table-min-block-size)`，该组合不是自动推断；超高标题/筛选时main自然滚动，而非把内容困在零高的内部滚动口。普通workspace默认值保持0，已有聊天/编辑器不增加强制留白。宿主拥有自己的style值，原生销毁时由宿主恢复原值，React按正常style生命周期更新/卸载。完整双端范例见[DataTable](COMPONENTS.md#页面标题筛选与滚动)。

公开Root style可以提供宿主已有的明确blockSize来嵌入非全窗口；否则以100dvh为界。若宿主使用百分比高度，它必须先提供可解析的祖先高度。改变scrollMode、页内槽或leading不会重建main/content，保留正文输入、焦点与宿主状态。短内容占满可用工作区但不产生多余文档滚动；自然高度页面继续选择document。完整两栏长/短历史示例：[React](../examples/workspace-react/app.tsx)（`?direct`直接AppShell）、[原生](../examples/workspace-vanilla/app.js)。示例仅在自有业务元素上提供布局，不读取或改写库内部元素。

### 工作区正文贴边

`contentInset?: ShellContentInset` 由 React AppShell/MenuLayout 与原生 MenuLayoutOptions 共用，类型从 runtime/menu-layout、React/layout 及两端根导出。默认 `standard` 保留页面内距；显式 `edge` 只在 `scrollMode='workspace'` 移除 main 的页面内距与 content 的焦点 gutter。外层 header/brand/sidebar、page slots 自己的 margin/padding、内部控件和卡片不被清零。document/viewport 保留原间距和 edge 选值，返回 workspace 后生效。

几何贴边与焦点内部绘制是同一 CSS @scope 增强：不改 focus-width/color，ordinary focus-visible 与 InputGroup 外壳 focus-within 向内绘制，组内输入仍不重复 outline。旧引擎不支持 @scope 时保留原有安全 gutter。嵌套 ScrollArea 默认仍为 gutter；需要它也贴边时显式选 `focusMode='inset'`（原生 viewport 的 `data-focus-mode='inset'`），最近公共滚动边界决定策略。边界统一处理 scroll-padding/scroll-margin，首末控制项仍可通过 Tab 和 scrollIntoView 到达。不要改私有 DOM/CSS 或把 focus-width 设为零。

完整消费者的 `?edge`、`?inset`、`?focus`、`?surface`、`?long-menu` 可组合，React `?direct` 同时覆盖 AppShell。`workspaceDemo.setContentInset` / `setFocusMode` 仅更新公开状态，正文草稿、节点、各滚动区和导航状态保留；`?surface` 用公开 Surface，`setSurfacePadding('default'|'none')` 可切换其自身内距。Surface none 只省略该表面 padding，不裁切内容，也不改变内部卡片默认内距。

### 窗口平台前置槽

`headerSlots.leading`（独立AppHeader为`leading`）位于primary最前，先于库生成的导航按钮；brand仍是品牌位置。leading默认无内容、无尺寸、无额外Tab目标。库保持leading不收缩并限制其最大宽度为所在行；其他内容按既有窄屏规则换行，DOM与键盘顺序一致，不使用CSS order或正tabindex。宿主提供的内容必须适配可用宽度，不能把无界固定宽内容当作安全区。

macOS hiddenInset的真实控件避让尺寸、全屏/退出全屏、Windows/Linux和无标题栏变化由宿主窗口集成决定：需要时传安全区Node，不需要时传null；库不检测平台、不固定traffic-light像素、不创建窗口按钮。装饰性占位使用aria-hidden且不设tabIndex；真的交互控件提供名称和正常键盘语义。示例`?platform`的OS按钮只是合成顺序验证，不是原生窗口控件。

Wails/Electron等drag/no-drag机制属于宿主桥接。仅对宿主自有非交互区域声明可拖动；interactive leading内容应按宿主框架标为no-drag，不可把可拖动样式继承到整套xui顶栏或覆盖自动菜单/主题/账号按钮。库不会猜测或修改框架专用CSS属性。浏览器布局与 DOM 顺序不能替代真实 Wails/hiddenInset 集成验证。

### 默认主题与可选i18n

AppHeader、AppShell、MenuLayout与原生createMenuLayout默认生成右侧主题图标按钮。明确偏好按light→dark→system→light循环；图标表达当前mode，不把system显示成其当前effective颜色。完整可访问名称包含当前模式和下一动作，title说明下一动作，Enter/Space使用既有按钮动效及reduced-motion合同。

未传theme时复用预初始化的window.xuiTheme；若文档尚无有效owner，getThemeController(window)只建立一次。默认持久化键ui.theme.mode，无有效值为dark；显式system跟随系统变化，matchMedia不可用时生效light，存储不可用仍可内存切换。自有JSON桥接或受控偏好继续传同一个ThemeController，setMode仅请求，直到宿主syncMode才改变事实。布局卸载只解除视图订阅，不销毁共享owner。登录页继续只继承外观，不显示这个顶栏控件。

locale只有enabled:true才显示。value/options/onValueChange全部由现有产品i18n owner提供；库不加载词典、不猜支持语言、不设置document.lang、不另写locale存储。原生与React都用标准select语义，当前值受控；回调后不自动把请求当事实。options中的disabled语言不可选择；不在列表的当前值显示空项，不假装已选择首项。label用于控件可访问名，主题文案可用themeLabels覆盖light/dark/system/switchToLight/switchToDark/switchToSystem，沿用库现有labels模式。

可运行接线见 [React 顶栏示例](../examples/header-controls-react/app.tsx) / [原生顶栏示例](../examples/header-controls-vanilla/app.js)。

原生同名槽传Node，locale/theme为同一配置/owner。update未指定的顶级槽保持原值；headerSlots是一个整体对象值，替换它时传入需要保留的全部顶栏角色，清空某角色用null。业务返回动作放sidebarFooter；图示旧返回位置不成为新默认。所有示例仅合成数据，不改产品认证、权限、后端或部署。

### legacy 内容与身份

旧AppShell.header未搭配headerSlots时作为完整legacy内容区放在primary，不当成brand拆分、裁切或强制子节点块显示；搭配headerSlots时仍位于secondary的既有legacy位置。重复同角色更新保持正常React协调；显式切换headerSlots有无会改变legacy所属区域，不能宣称该跨角色移动保留legacy子树身份。其他控件继续使用同一内部Frame。

### 标准列表与卡片正文

现有pageHeader组合PageHeader的title/meta/actions，pageToolbar组合DataTableToolbar/DataTableFilter；workspace正文使用DataTable即可得到库维护的表体/底栏高度链。搜索只能放pageToolbar或DataTable.toolbar一处。卡片列表复用相同页槽和ScrollArea/Grid/Surface，不新增PageLayout。pageToolbar默认没有下边框且保留layout-section-gap，不再包产品整行分隔。完整合同及0/20/50/100行正式双端消费者见[DataTable](COMPONENTS.md#数据表格)。顶栏紧凑与无框语言控件见下方相邻控件合同。

### 顶栏相邻控件

#### 相邻工具与账号

secondary 的相邻组统一使用 `space-control-gap`。账号仍是 controls 之后的独立语义槽，没有移动 slot、负 margin 或 CSS order。主题按钮和账号 Button 的尺寸、padding、图标以及命中区不改；主组与次组之间仍使用既有区域间距。

以默认根字号16px、36px主题按钮/16px图标、small ghost Button 的10px横padding与1px边框为例：按钮命中框之间的默认间隔从16px变为8px；主题SVG盒右侧10px + 组间8px + 账号左侧11px，得到约29px的可见盒间距。这是该公开组合的几何推导，不是所有账号内容的固定目标，也不是已跑的浏览器像素证据。头像宽度和账号文字由宿主公开内容决定；控件可换行，不能缩小命中区来得到紧凑外观。

#### 统一主题的语言入口与浮层

`HeaderLocaleOptions` 仍由宿主提供 `enabled/value/options/onValueChange/label/disabled`。顶栏现使用可见 button/combobox 与主题 listbox，React 与原生都复用正式 `createHeaderLocaleSelect(document, options)`、`bindSelectControl` 和同一个公共 popover owner，React 在 layout effect 内管理挂载/更新/清理，不为默认 shell 引入另一套选择器 owner。此组合不新增 SSR/hydration 支持承诺。标准示例和默认采用遵循 [DESIGN 公共封装政策](DESIGN.md#公共复用与状态矩阵)。独立 `NativeSelect` 及显式 `bindHeaderLocaleSelect` 仅保留平台选择器合同，其 OS 面板不能通过 CSS 保证跨平台统一。

入口默认透明边框，hover/pressed/disabled/focus 消费同一语义 token；装饰箭头不成为第二个焦点目标，RTL 使用逻辑方向，强制颜色下仍保留箭头与可见边界。浮层使用公共 overlay 颜色、边界、阴影和选中态；按触发器定位，受可见视口安全边距与可用高度限制，长选项滚动。原生 owner 监听 trigger/浮层 resize、滚动及 visualViewport；不会要求产品修正固定坐标。

键盘支持 Enter/Space、上下/Home/End、文字定位、Escape 关闭回焦点、Tab 离开；禁用项不可选择。点击外部关闭。请求尚未由宿主回传时不显示未确认语言；unknown 当前值保持空显示。关闭入口会将其内部焦点回相邻主题按钮。

#### 受控事实与生命周期

两个宿主在请求 `onValueChange` 时保持当前已确认值；宿主同步新 `value` 后才显示新事实。相同当前值、禁用控件、禁用选项和非法选项均不发请求。不在 options 中的当前值显示一项禁用空项，避免假装第一项已被选中；后续添加该值对应选项会显示宿主标签，不产生额外请求。

原生低层 `bindHeaderLocaleSelect(select, options)` 返回 `{element, update, destroy}`：

- 挂载 `element`，它包含原 select 与一个装饰 SVG；传入已挂载 select 时会在原位置加包装
- 重复绑定同一存活 select 复用一个 binding 并同步参数；update 保留 select、包装与可用焦点，未变的选项也不替换
- `enabled:false` 使低层 select 禁用；MenuLayout 会直接移除整个语言入口
- destroy 幂等地解除事件并去掉包装/语言专用样式，保留原 select 最后确认的选项、值、名称与禁用事实；旧 handle 的 update/destroy 不影响后续重建
- 布局关闭当前聚焦的语言入口时先回相邻主题按钮，销毁布局不销毁共享主题或 i18n owner

库生成的包装与SVG不要求产品手写或穿透。只给独立原生 binding 挂载点需要使用新增返回的 element；此前直接把已绑定 select 再搬出包装的调用应改为挂载 element。React 与完整 createMenuLayout 自动完成此事。

#### 正式消费者

[React](../examples/header-controls-react/app.tsx) / [原生](../examples/header-controls-vanilla/app.js) 示例的 `?compact&locale` 展示账号、Avatar、状态与语言/主题，`&long` 展示长中文账号；React `&direct` 直接消费 AppHeader。均为合成状态，使用公共 CSS。测试入口为 [受控语言合同](../tests/header-locale.test.mjs)、[紧凑几何](../tests/browser/header-compact.spec.mjs) 和 [品牌与浮层](../tests/browser/header-popup-brand.spec.mjs)；实际执行范围见 [VALIDATION.md](VALIDATION.md)。

#### 品牌区域与内容对齐

AppHeader 的内容顺序是 leading/brand → navigation toggle → breadcrumb/context。leading 保留平台安全区位置。MenuLayout/AppShell 桌面身份区域使用与侧栏相同的宽度 token，计入公共间距后使 toggle 左边对齐正文内容起点；collapsed 自动跟随 rail 宽度，窄屏恢复自然品牌布局与同一 drawer 入口。直接 AppHeader 没有侧栏，按内容自然排列。

可选 `HeaderBrand` 以 logo 和 children 提供规范内容；原生使用同名公开结构，业务链接可包在组件外。带 logo 的 compact 品牌名称仅视觉收纳，accessible 名称保留；不带 logo 的任意旧 brand 内容仍按区域截断，库不猜业务 DOM。

原生将此节点传给 headerSlots.brand，无产品宽度/定位 CSS。浏览器测试检查真实浮层、受控选择、长列表滚动、品牌/侧栏/正文几何和窄屏 drawer；Chromium 结果不能代替真实 macOS 系统、读屏器或移动 Safari。

HeaderBrand 的 logo 容器固定采用 control-height-sm，图片与 SVG 保持 contain，不因素材原始尺寸撑大顶栏。桌面 compact、无 leading 安全区时，logo 中心与 nav-collapsed-width 侧栏中心重合；补偿顶栏内容内距仅作用于品牌，不移动菜单 toggle。存在 leading 时保留该平台区域，品牌在剩余区域居中。名称继续保留可访问文本，窄屏恢复名称。

## 导航与菜单

本节记录实现接口；完整通用规则仅在 [DESIGN.md](DESIGN.md)。React 从 `@coffeehc/xui-react/menu-layout` 导入 NavigationMenu、MenuLayout；原生从 runtime/navigation 导入 createNavigationMenu，从 runtime/menu-layout 导入 createMenuLayout。双方共用 runtime/navigation 的 NavigationItem、NavigationMenuOptions、NavigationAdapter 等类型。

它们使用预构建 navigation/layout CSS；可直接导入 theme/critical.css 或 style.css，默认选中竖线、背景、文字、图标、focus 与 motion 不需要宿主补写。

完整接线见 [React 菜单](../examples/menu-react/app.tsx) / [原生菜单](../examples/menu-vanilla/app.js)；独立行尾动作和 slots 见 [React 富导航](../examples/rich-navigation-react/app.tsx) / [原生富导航](../examples/rich-navigation-vanilla/app.js)。

### 共享数据与内容扩展

数据只保存 id、label、icon 标识、href、children、group、disabled、target、download、rel，可在两个宿主共用 JSON。id 必须非空且全树唯一，label 非空；循环、重复 id 和同时是 group/link 的数据抛 TypeError。group 是始终展开的分组标题；没有 href 的有子项节点是展开按钮；有 href 且有子项节点使用一个链接和独立展开按钮，始终没有嵌套链接。disabled 向后代继承；可见数据与权限过滤由宿主提供。数据按不可变数组使用，React 更新时提供新数组。

icon 内置 menu/home/folder/document/settings；宿主可一次提供 resolveIcon(name)，返回 viewBox/paths 的 SVG 描述。文字/图标随默认语义 token，运行时不维护色板。未知图标有 menu 回退。React 可选 renderLabel(item) 与 renderLink(item) 扩展内容/路由链接；renderLink 返回一个透传 props/ref 的链接组件，遵守 [NavItem 组合规则](ADOPTION.md#组件层次与扩展原则)。已经使用 navigation adapter 时不必再逐项添加路由回调。

### 当前项与一次导航适配

activeId 省略时根据 location 选择；默认匹配同源精确 pathname，归一化末尾斜线，忽略 query/hash，不做前缀匹配。并列匹配按数据顺序取首个。需要 query/hash 或产品路由策略时只在菜单根提供一个 matchLocation(item,currentURL,targetURL)。显式 activeId 优先，null/不存在/禁用/非链接项表示无选中；不会强制选择第一项。宿主更新 location/activeId，不在每项重复维护 selected。非受控展开自动打开选中项的祖先，以便选中可见；选中父链接本身不会代替其展开按钮。

navigation 是显式 opt-in。只接管未取消、无修改键的普通主键、同源 HTTP(S) 链接，保留中键、修改键、target 和 download。canNavigate(request) 返回 false 时保留原生行为；没有 adapter 时普通链接也按原生行为。request 提供 id/href/解析后的 url/sameLocation/原始 event；同址仍交给宿主，是否产生 history entry 由宿主决定。库不订阅 history、不猜测产品路由。参考示例只有一次 history adapter/popstate 订阅，前进/后退同步 location，query 匹配由宿主明确提供。

### 状态、键盘与布局

collapsed/defaultCollapsed/onCollapsedChange、expandedIds/defaultExpandedIds/onExpandedChange 支持受控与非受控。受控操作只发请求，React 更新 props 或原生 update 确认后才改变事实；default 值仅初始化。MenuLayout 保管非受控菜单状态，使桌面与窄屏转换后仍保留展开/紧凑状态。桌面紧凑状态保留可访问名称与图标，窄屏抽屉显示完整标签；分组和长中文不裁切关键内容。

键盘采用普通 nav/link 语义与单一菜单项 tab stop，方向键/Home/End 跳过隐藏和 disabled；左右展开/收起及回父节点，RTL 反转左右。展开按钮的 Enter/Space、链接 Enter 和修改键沿用原生语义。focus 独立可见；移除/隐藏焦点项时回退可用项，空菜单在桌面回退顶栏唯一开关，打开的模态抽屉内回退关闭按钮；独立NavigationMenu才回退自身紧凑按钮。

当前页`aria-current`不等于必须获得焦点：真实菜单焦点优先于activeId更新；焦点不在菜单时，更新会以可用当前页或首个可用项确定tab停靠点。原生抽屉打开优先保留当前侧栏真实焦点/已有合法menu停靠点，再回退当前页、首个可用导航项、关闭按钮和dialog。该选择由shell在`showModal()`之前快照；dialog临时把autofocus交给该目标并恢复原属性，避免浏览器先把首项写成roving target；显式选择dialog本身时使用临时焦点代理兼容旧版原生算法。空菜单不把footer业务动作当默认起点。反复开关保留独立的选中与键盘停靠；长菜单滚动保持实际焦点可见。显式`initialFocus`仍优先，初始open/defaultOpen在侧栏移入后执行，宿主同步转移焦点或新模态优先于旧owner。

MenuLayout 还提供 title/header、children（原生 content Node 或原有 root 内容）、sidebarOpen/defaultSidebarOpen/onSidebarOpenChange、label/emptyLabel/compactLabel/expandLabel/skipLabel/closeLabel。窄屏使用现有模态 drawer，Esc/关闭/成功 adapter 导航请求关闭并回可见触发器；变宽关闭 drawer。受控 sidebar 仍须宿主确认。菜单导航不替换 shell/main 或未变更的链接节点；同一组件持续挂载时保留页面输入。React 的内容状态由宿主正常保管，不给布局添加路由 key。未提供footer时断点切换的React sidebar部件仍可重挂载，布局保管菜单事实；提供footer时复用同一侧栏树（详见下方底部接入），不按route重建。

### 原生生命周期与正式消费者

原生 owner 的 update(partial) 合并选项，验证新数据后提交；无效数据保留旧菜单，匹配 id 的链接复用。getMenu()/getMain()/getSidebarOpen() 读取布局，菜单 owner 提供 getElement()/getState()/setCollapsed()/setExpanded()；布局选项统一通过 layout.update 更新。同一种 factory 不可在同一 root 重复创建活跃 owner，宿主只给该 root 一个所有者；destroy 后可以重建，更新已销毁 owner 无效。destroy 移除库监听、关闭 drawer，恢复创建前的 root 内容和属性；宿主自己的订阅/事件由宿主释放。原生 header/content 更新通过公开 Node，不复制内部菜单结构。

正式消费者在 examples/menu-react 与 examples/menu-vanilla，共用 examples/shared/menu-data.json，独立 tarball 编译和打包。预览为 `/menu-react/` 与 `/menu-vanilla/`；测试入口仅用于合成验证，不访问产品后端。它们不用示例私有 CSS。HTTP/query 已实现，接入合同见 [HTTP 与查询](PUBLIC_API.md#http-与查询)；API Key 通用管理见 [API Key 管理](PUBLIC_API.md#api-key-管理)，结构化日志只读查询见 [程序错误观察](PUBLIC_API.md#程序错误观察)，facade 由宿主后端明确实现。

### 冷启动与路由ready边界

navigation adapter必须在第一个可操作菜单呈现时已连接，并保持同一个宿主router owner。canNavigate=false的正式含义是保留原生document导航，不能把它当“router/鉴权/动态路由尚未ready，暂不执行”的阻止开关；缺少adapter也有相同原生行为。必要的未就绪状态由宿主提供真实disabled/状态，或在已经接管preventDefault的navigate内部明确处理，不以几分钟定时等待掩盖初始化问题。真实权限仍由服务端校验。

冷启动取证区分主frame的Document请求/新document identity、history同文档路由，以及旧shell DOM是否重新挂载；单看“页面重新显示”不能确认reload。菜单更新保留同一shell/main/主题owner，不能因route key重挂整个外壳；非SPA链接、修改键、target/download的原生行为保留。初始化、主题订阅与watch构建本身不自动发reload；参考页的界面重载按钮是明确用户动作，登录默认location.assign也是确认登录/继续的宿主导航边界，不与菜单routing混用。

回归应覆盖冷/暖缓存、受控资源延迟、前进/后退、菜单点击与移除 adapter/canNavigate=false 的对照；记录 Document 请求、document/timeOrigin/shell/theme identity、草稿和 pageerror。实际执行范围见 [VALIDATION.md](VALIDATION.md)。合成消费者未复现不能排除产品开发模式的问题，真实 dev 命令、optimizer/HMR 日志、路由状态与资源代际须在宿主取证；不收集凭据、响应 body 或 Cookie。

### 外壳的document、viewport与workspace滚动模式

AppShell/MenuLayout及createMenuLayout支持scrollMode=document|viewport|workspace（共享ShellScrollMode类型），默认document，保留原有文档滚动。原生公开标记为data-scroll-mode。viewport根为100dvh有界grid，正文行minmax(0,1fr)，sidebar/main均min-height:0且独立overflow:auto；窄屏复用既有drawer的有界Body，不加第二drawer。宿主嵌入非全窗口时给公开Root style的blockSize，不穿透私有子元素调整默认皮肤。

viewport/workspace更新选中项以nearest进入所属侧栏可视区域；焦点依靠浏览器所属滚动区滚入可视区，菜单键盘规则不另建owner。同一main与内容节点更新保持滚动/输入；产品导航历史如何按route保存和恢复各容器scroll位置由宿主决定，不按route key重挂整个shell。官方两[控件消费者](COMPONENTS.md#选择与复合控件)演示24项长菜单、长正文、横/纵滚动表格与反向导航；实际窄屏/文字放大和焦点验收见最终记录。

workspace额外让content获得扣除真实顶栏和pageHeader/pageToolbar/pageFooter后的剩余高度，适合历史+发送区/编辑器+检查器等业务内部滚动。普通viewport不承诺content剩余高度。两端公开合同、leading平台前置槽、例子和边界见[布局插槽](COMPONENTS.md#有界工作区与滚动所有权)。

固定高度宿主可使用 React `MenuLayout` 的公开 `style={{blockSize:'var(--layout-embedded-shell-height)'}}`（或 AppShell 的同一 Root style），原生给传入的 root 设置 `style.blockSize`，并显式选 `scrollMode='viewport'`。这时侧栏和正文分别滚动，选中菜单滚动到可见范围；不靠子元素私有选择器修补，也不把滚动恢复策略移入库。

抽屉关闭先释放本次模态，再调用宿主 `navigation.navigate`。默认回焦点仅在当前焦点仍属于关闭的抽屉或没有有效焦点时执行；宿主已将焦点放到新路由标题、外部控件或新模态时保持它。React `restoreSidebarFocus={false}` 可显式关闭恢复；原生 `createDialogController`/Sheet/AlertDialog 的 `restoreFocus` 可用布尔值或接收 `DialogCloseDetails.reason` 的函数，`close(reason)` 与受控 `syncOpen(false, details)` 保留原因。原生 MenuLayout 的导航关闭原因是 `navigation`，取消/Escape 仍按普通关闭处理。旧 owner 的延迟 close 事件或重复 destroy 不得夺取新 owner 焦点。

### 应用头部角色与紧凑侧栏迁移

`AppShell`、`MenuLayout` 的 `headerSlots: AppHeaderSlots` 接收 `brand`、`breadcrumb`、`status`、`actions` 四个 React 内容角色；`AppHeader` / `AppHeaderProps` 从 `@coffeehc/xui-react/layout`（及根入口）导出，可独立组合，直接接收这四个 props，另有 `navigation` 和兼容内容 `children`。`AppShell` 持有抽屉触发器，宿主不要再添加一套菜单开关。

`AppShell` 未传 `headerSlots` 时保留旧header直接排列，显式传角色对象才启用新组合。`MenuLayout` 的 `title` 仍可用：未提供 `headerSlots.brand` 时作为品牌回退；显式 `null` 隐藏回退。旧 `header` 仍渲染在兼容区域，可和新角色并存。品牌/面包屑组成左侧主组，状态/动作在右侧；窄屏先保留导航/品牌，breadcrumb在主组内独占下一行，再将状态和动作换行，避免200%文字把路径挤成单个字。长中文品牌和 breadcrumb 在自己的空间省略，不挤散另一组；完整文本不从 DOM/可访问名称删除。动作只换行，不自动隐藏。必要业务反馈仍由宿主决定放置，库没有授权、版本、返回等业务规则。

原生 `MenuLayoutHeaderSlots` 从 `@coffeehc/xui-runtime/menu-layout`（及根入口）导出；同名角色接收 `Node | null`，支持 `DocumentFragment` 组合，已有 Node 由布局移动而非复制。宿主保留这些 Node 引用修改内容/注册业务事件，无需查询库内部 DOM。`headerSlots` 是一个完整值：`update({headerSlots: nextSlots})` 替换整份角色配置；仅更新 `location` / 菜单状态不会替换头部内容或已消费的 fragment，不丢失控件焦点。一个 Node 只能归属于一个 slot。

公开 CSS 结构为 `xui-app-header`、`xui-app-header-primary/secondary` 和 `xui-app-header-navigation/brand/breadcrumb/status/actions/legacy`。React 与原生使用相同 `theme/layout.css`；普通采用应使用 props/Node，不穿透结构改排列。`AppHeader` 是 div 组合，独立使用时由宿主提供所属语义 header。breadcrumb 内容可以使用公开 `Breadcrumbs` / `.xui-breadcrumbs` 的 nav/ol/li/a 结构；链接的焦点轮廓保持在截断边界内。

紧凑侧栏默认216px展开、60px收起；这些数值是根16px下的 CSS 像素，非设备像素。公开token `--nav-sidebar-width`、`--nav-sidebar-padding`、`--nav-collapsed-width` 与 `--nav-collapsed-item-size` 在 DESIGN 中定义，默认36px项+左右各12px；图标仍16px，选中短竖线/hover/独立focus不改变宽度。独立支路开关收起时移到所属链接下一行，窄屏抽屉恢复完整标签与既有键盘/路由合同。独立使用 NavigationMenu 的外层宽度由宿主布局决定，MenuLayout 才拥有完整侧栏宽度。

迁移顺序：先固定新SHA并重新构建正式包；把原 header 中品牌/路径/状态/动作内容分别送入公开角色；删除消费方仅用于通用 header flex/grid/gap、长中文截断、紧凑栏宽度和图标对齐的 CSS。保留领域内容布局、授权判断、事件、路由和有明确理由的产品token覆盖。不要删除业务规则来套入公共布局，不再叠加第二条rail。实际执行范围与限制见 [VALIDATION.md](VALIDATION.md)。

### 侧栏底部接入与迁移

`sidebarFooter` 是 MenuLayout/原生 createMenuLayout 的侧栏底部内容插槽，AppShell也可组合；`headerSlots` 保持顶栏用途。没有返回、授权状态、版本/账号、服务地址等内置领域规则。业务传现有内容/回调和真实disabled/busy状态，不复制定位、尺寸或底部容器内部DOM。

图标/短表示为装饰，完整名称留在label。图标可为任意React内容；直接SVG采用公共control-icon-size。名称长时展开/窄屏换行；紧凑栏只对有icon的部件视觉隐藏label。没有icon时仍显示文字，不要求消费者自写隐藏CSS；需要更具体紧凑表示时提供icon。真实交互语义、tooltip/解释入口及权限由内容所属组件决定。

原生同一Node/Fragment赋回保留节点；替换内容须传新的Node/Fragment，传null/undefined移除。不要重用已被替换的空Fragment来恢复旧子节点；保留内容Node引用或新建Fragment。React按常规key/type协调，改变内容组件key或有意移除footer属于宿主重建。

有footer时，短菜单通过flex可用空间将footer置底，长菜单只在公共menu区域滚动，不覆盖末项；footer自身超出侧栏一半时独立滚动保留全部内容。document模式正文仍文档滚动，侧栏由库测量实际头高后有界sticky；viewport模式包括公开Root blockSize固定窗口。无footer时保留已有侧栏滚动区域。紧凑默认宽度不变，窄屏复用原抽屉；React常量portal目标与原生移动Node都保持同一侧栏树，开关抽屉不重复挂载footer业务状态。此布局不新增 SSR/hydration 支持承诺。

迁移：固定包含本节的已验证提交并重新构建正式包（具体SHA见对应提交/交付记录）；将原本位于侧栏尾部的内容送入sidebarFooter，顶栏内容继续headerSlots；删除消费方底部absolute/fixed/margin-top、侧栏height/overflow与compact宽度补丁，保留业务回调/权限/状态。不要以route key重挂MenuLayout或添加第二个drawer。完整无私有CSS例子见[React](../examples/sidebar-footer-react/app.tsx)/[原生](../examples/sidebar-footer-vanilla/app.js)，正式构建、watch和独立tarball类型检查都包含它们；真实产品迁移另按产品授权实施。

### 顶栏唯一菜单开关

MenuLayout及原生createMenuLayout只生成顶栏一个菜单开关。桌面点击/Enter/Space请求收起或展开侧栏；窄屏同一入口请求已有导航抽屉。侧栏顶部不再生成第二个开关，不改变正文导航adapter或单模态owner。开关采用公共icon按钮尺寸、motion与focus，桌面可访问名取compactLabel/expandLabel，aria-expanded表示侧栏展开事实；窄屏名取label（AppShell为navigationLabel），aria-expanded表示抽屉事实且有aria-haspopup=dialog。aria-controls对应当前受控区域。缩放/断点切换保持collapsed，变宽关闭抽屉；受控回调仍只请求，等宿主回传才改变事实。

React AppShell支持collapsed/defaultCollapsed/onCollapsedChange、compactLabel/expandLabel（同MenuLayout默认）；所属NavigationMenu自动接其非显式紧凑状态并移除内部开关。普通页面只使用MenuLayout传数据和状态；无需另传开关内容或尺寸。独立NavigationMenu/createNavigationMenu仍可显示自己的紧凑按钮，显式 showCollapseToggle=false 可关闭；该选项不能在MenuLayout中重新添加重复按钮。原生createNavigationMenu第三参数的可选fallbackFocus与共享createNavigationKeyboard同名回调仅供公共结构组合的空菜单焦点退路，普通宿主无需连接。

迁移时删除产品自行实现的侧栏顶部/顶栏菜单按钮及其宽度、位置、媒体监听和点击绑定，继续传collapsed/onCollapsedChange、sidebarOpen/onSidebarOpenChange及原标签配置。不要把sidebarOpen当桌面compact状态。顶栏DOM先于侧栏，Tab依次经过顶栏已有链接/动作，再进入菜单的单一tab停靠点；测试不应再假设旧侧栏开关之后立即是菜单。

### 富条目、独立行尾动作与上下文菜单

`children`、`resolveIcon`、`renderLabel` 和 `renderLink` 原已支持子层级、自定义图标、非交互富标签与单链接适配。通过 `renderButton(item)` 与 `renderAction(item)` 扩展，不将业务数据塞进 Combobox option，也不引入另一份查询或路由 owner。

React `renderButton` 仅用于没有 href 的分支，返回一个透传全部 props/ref、最终生成单一原生 button 的元素；`renderLink` 同理生成单一 a。库提供 children、disabled、展开 aria、路由、键盘与皮肤。renderer 必须保留这些属性及 children，不额外包按钮/链接。可以在自定义组件内组合公开 ContextMenu：

`onInspect/configure/canConfigure/busy` 为宿主已有动作和事实。宿主链接包装必须透传标准 a props/ref 到单一链接；禁用 ContextMenu.Root 必须接继承后的 disabled/aria-disabled。ContextMenu 内容通过公开 Portal，不放进主标签。`renderLabel` 仅提供描述性、非交互的 phrasing content（如 span、图标、Badge），不嵌套 button/link/input。任意表单或多按钮工具组应放在菜单外的 Section/Toolbar，不伪装一条导航主控件。

`renderAction` 返回 null 表示无动作，否则返回一个原生 button 或透传 props/ref 的单 button 组件。库将它作为主链接/分支按钮和独立展开按钮的 sibling，接入 `.xui-menu-row-action`、单一 roving 停靠和继承禁用；不要求宿主 stopPropagation。宿主提供明确 aria-label（省略回退 Actions for + item.label）、非交互内容、事件、aria-busy 与自身 disabled。busy 只陈述事实；防重复与权限由宿主明确禁用并在动作入口同步拦截。图标按钮尺寸和 compact 布局消费现有 control/nav/space tokens；compact 中动作另起一行，不增宽侧栏，窄屏恢复正常行布局。

键盘采用普通 nav/link/button，绝非 listbox/option。每个 NavigationMenu 保留一个 Tab 停靠；ArrowUp/Down、Home/End 按 DOM 顺序遍历可见可用的主项、独立展开按钮、行尾动作与子项。左右键只在主项/展开按钮处理树展开与父子移动（RTL 反转），在行尾动作上不改变树。动作 Enter/Space 只激活自己，链接 Enter 保留原生语义；Tab 离开整个菜单。搜索框、Disclosure 和组外加载按钮按正常 Tab 顺序独立可达。公开 ContextMenu 的键盘/回焦点由它自己拥有；Portal 内事件不会被导航 roving 接管。焦点项移除、隐藏或禁用时由库回到可用停靠/公开 fallback；宿主已经转移的新焦点不应被旧操作夺回。

#### 原生 slots 与 lifecycle

`createNavigationMenu` 与 `createMenuLayout` 的 `MenuLayoutOptions` 支持 `NavigationMenuDOMOptions`；共享 JSON 仍是 `NavigationItem`，不加入 Node/函数。原生扩展：

- `renderLabel(item,state) => NavigationDOMSlot | null`：非交互 Node。null 使用原始 label。
- `renderAction(item,state) => NavigationDOMSlot<HTMLButtonElement> | null`：单个原生 button，库检查无内嵌交互内容并提供 sibling 布局/键盘/继承 disabled。可直接保存引用，不穿透私有 DOM。
- `decorateItem(element,item,state) => NavigationDOMLifecycle | void`：取得库生成的主 a/button，可绑定公开 `createContextMenuController`，无需替换元素。分组标题不调用 decorator。
- `NavigationRowState` 是 `{disabled,collapsed,expanded,active}`；`NavigationDOMSlot` 是 `{element,update?(item,state),destroy?()}`，`NavigationDOMLifecycle` 是后两项。`update` 在创建及每次同步时调用，负责用最新 item/state 更新内容、事件读取的值及宿主自身 disabled/busy。不能在 update 中重新注册未清理的监听。

相同 id、主项种类及 factory 引用保留已有 slot/decorator 和 DOM；换 factory、id 被移除、link/button/group 种类改变或 owner.destroy 时释放旧 lifecycle 各一次。null slot 会在后续同步重试 factory；已挂载 slot 的显示/状态交给 update（需改变槽形态时传新的 factory）。destroy 幂等，update 不重新绑定；同时释放宿主请求与订阅。MenuLayout 转入同一窄屏 drawer 不重建内容。默认 label、icon、展开箭头由库维护；宿主不重建主控件或写私有选择器。

原生 ContextMenu 不接管触发器已有 aria-controls/aria-expanded，因而分支展开事实保持独立；只添加菜单 aria-haspopup 并在销毁时恢复自身仍拥有的属性。普通 Popover/Menu 的 aria-expanded/controls 合同不变。Escape/菜单动作关闭只在焦点仍属于该浮层时回触发器，已经聚焦新标题/新弹层的动作不会被旧菜单抢回。

富分组组合与 GroupedCombobox 的选用边界见 [富业务分组导航与简单选择](#富业务分组导航与简单选择的边界)。

#### 原生完整自组 sidebar

原生 `MenuLayoutOptions.sidebar?: Node | null` 与 React `AppShell.sidebar` 都可以承载上述两组自组导航。原生 sidebar 替换完整的默认菜单内容区域；没有传值或传 null 时显示原数据菜单，不占 sidebarHeader 的限定高度。sidebarHeader/sidebarFooter 仍是各自独立的上下槽，不将整份导航塞到顶部槽。一个 shell 继续拥有顶栏开关、主题、桌面 collapsed 与窄屏 drawer；多个自组 NavigationMenu 的 collapsed 和实际 navigation/关闭回调由宿主用现有 update 连接，不再创建另一个 shell/drawer。

同一 Node/Fragment 重传保留节点，普通 location/slot 更新不重建自组菜单；Fragment 首次转移后保留其内容，不重用已经移除的空 Fragment 恢复旧内容。替换/移除 sidebar 时只在旧焦点仍归该区域的情况下回到新可用控件，空菜单回顶栏开关或已打开 drawer 的关闭按钮。被暂时替换的自组内容生命周期仍归宿主，最终分别 destroy 其 NavigationMenu/Disclosure/ContextMenu 和订阅；createMenuLayout 不销毁自己未创建的 owner。

正式富导航示例用宿主公开的 `collapsed` 与 `sidebarOpen` 状态决定 rail 内容：桌面 compact 仅保留项目图标导航及独立 action，收纳完整搜索框、组标题、组外加载按钮和成员 Disclosure；顶栏“展开导航”仍可经 Tab/Enter 到达，展开后恢复完整控件。移动 drawer 打开时恢复全部控件，不复制第二份查询或导航树，也不按私有 DOM/class 或固定像素判断视口。受控原生 drawer 明确连接 `sidebarOpen` 与 `onSidebarOpenChange`，导航关闭后仍可再次打开。

品牌槽现在先于顶栏唯一菜单开关。桌面品牌区域自动跟随展开/紧凑侧栏宽度，toggle 对齐正文内容左边；随后为 breadcrumb/context。leading 仍位于身份区域最前，保留平台安全区。窄屏由公共布局恢复自然宽度并继续使用原 drawer，产品不补按钮/媒体监听。`HeaderBrand` 与原生公开品牌结构和迁移例子见 [布局与顶栏](COMPONENTS.md#品牌区域与内容对齐)。

### 富业务分组导航与简单选择的边界

GroupedCombobox 继续服务简单 `{id,label,disabled?}` 选择，分页只有已知 page/pageCount；不扩成带按钮、链接、子树和上下文菜单的 option。未知 total/cursor 不能虚构 pageCount。

需要子层级、自定义图标、富标签、配置按钮或 ContextMenu 的业务条目，使用公开 Input + Section/Disclosure + 两个 NavigationMenu + 组外加载按钮。一个 query 驱动两个宿主读取状态，各自拥有 cursor/hasMore/busy/error，无需 total。关闭组取消所属读取，查询变化使旧 generation 失效，宿主必须丢弃取消后迟到结果；写动作不进入导航 adapter。导航仍是普通 nav 的单 roving 停靠，与输入/分组开关/加载按钮的正常 Tab 顺序相接，不是 listbox，也不需要 stopPropagation。

NavigationMenu 提供 children/resolveIcon/renderLabel/renderLink、单 button 的 renderButton、独立 sibling renderAction，以及原生等价 slots/decorator 生命周期。完整 API 与键盘规则见[导航富条目合同](COMPONENTS.md#富条目独立行尾动作与上下文菜单)。正式[React](../examples/rich-navigation-react/app.tsx)/[原生](../examples/rich-navigation-vanilla/app.js)消费者包含项目/成员合成数据、独立 cursor、异步配置防重复、关闭取消及上下文菜单，未接真实产品服务。
开发环境懒加载与依赖预优化见 [开发联调与冷启动](ADOPTION.md#开发联调与冷启动)。

## 弹层与工具栏

完整规则只在[DESIGN](DESIGN.md)；正式exports与types见[PUBLIC_API](PUBLIC_API.md)。本节说明原子上的公开组合，不包含业务状态引擎或新默认品牌值。独立tarball消费者为[React](../examples/capabilities-react/app.tsx)/[原生](../examples/capabilities-vanilla/app.js)，两者无需私有页面CSS。

| 能力 | React | 原生公开接入 |
| --- | --- | --- |
| Sheet | /sheet的Sheet.Root/Content/Title/Description/Body/Footer/Close；Content side=start/end/top/bottom | createSheetController(dialog,trigger,{side,...DialogOptions})，公开xui-dialog部件结构；controller添加并恢复sheet class/side |
| AlertDialog | /alert-dialog的AlertDialog，延续Base UI AlertDialog Root与dialog parts；Content initialFocus/finalFocus | createAlertDialogController(dialog,trigger,{initialFocus,...DialogOptions})，role=alertdialog，data-xui-cancel为安全初始焦点，否则中性dialog |
| ContextMenu | /context-menu的ContextMenu.Root/Trigger/Content/Item/CheckboxItem/RadioItem等公开peer parts | createContextMenuController(trigger,popup)，public floating/menu class与role；checked/value由宿主更新 |
| Table | Table striped、TableRow selected/expanded；TableExpandedRow colSpan，TableExpandButton expanded/controls/onClick；Cell/HeaderCell sticky=start/end、stickyOffset | 相同xui-table/row/expanded-row类，data-striped/selected/expanded/sticky；语义table、colspan、aria-expanded/controls和展开状态由宿主 |
| MetricCard | /metric-card 的 MetricCard，复用 Surface；必填 label/value，可选通用 marker slot；不格式化值 | 公开 xui-surface/xui-metric-card 与 dl/header/label/marker/value 结构；无 controller。排列使用已有 xui-grid，见[完整合同与双端示例](COMPONENTS.md#metriccard) |

Sheet复用Dialog lifecycle，标题/描述/关闭部件复用同一组件；正文滚动、footer动作保持可见，逻辑side随RTL。AlertDialog复用peer确认角色和取消/焦点，不因关闭而执行业务。嵌套时只有最上层处理取消和Tab，确认逻辑由宿主显式执行；有草稿才打开确认，空草稿直接关闭。trigger若不存在或已移除须给可见finalFocus，不能把父关闭按钮同时作为无条件子确认trigger。

ContextMenu支持鼠标右键、Shift+F10/ContextMenu键、方向键、disabled、检查项保留、外部关闭和Esc回焦点。普通点击Trigger不执行业务。没有声明跨移动OS长按一致；必要操作还须由可点击按钮/菜单访问。React keyboard和popup定位由已安装Base UI peer1.7提供；native复用Popover controller，无额外监听owner。

表格为语义table，条纹排除expanded内容行，hover/selected优先级明确；sticky cell继承所属行的非透明背景，避免滚动穿透。多个同侧sticky列的offset由宿主显式给出，不测量/推断列宽；仅所属TableContainer横向滚动。展开按钮是正常button，不截获行所有点击，也不实现查询、虚拟化、权限、排序或选择引擎。

全部组合使用已有motion token/reduced-motion，动画不延后操作。native controllers的受控syncOpen、details.cancel、destroy与监听释放沿用[接入与组件分层](ADOPTION.md#组件层次与扩展原则)；键盘/焦点/长中文/窄屏/200%根字体的实际检查见[验证记录](VALIDATION.md#chromium-浏览器结果)，真实移动OS、读屏器和其他浏览器未验。

Table 支持 stickyHeader 布尔 prop，原生table[data-sticky-header=true]相同；表头在所属TableContainer顶端sticky，与列sticky交点提高一层，边界使用现有surface-line。多个表头行/额外上方控件的offset由宿主明确style，不猜高度。行的raised/support底色保持不透明，hover/selected语义色以同色gradient叠在底色上，sticky单元格继承完整底色/图层；允许产品交互色有alpha而不穿透。产品基础layer仍须是可读不透明背景。selected优先hover，条纹/expanded基础层仍保留，无新增默认品牌值或产品color-mix配方。

React ContextMenu.SubmenuTrigger复用公共Menu.Item皮肤，SubmenuRoot/RadioGroup/RadioItem等由同一个Base UI peer处理。原生createSubmenuController(trigger,popup,options)要求trigger位于role=menu父popup，子popup保持父DOM后代；菜单项用公开xui-menu-item，触发器aria-haspopup=menu。左右键按RTL打开/退回，子层独立上下键/Escape，关闭父菜单同步关闭子层；checkbox/radio事实及业务动作仍由宿主提供。必要操作仍给普通可点击入口，未声明移动OS长按合同。

其它组合与 HTML 合同见[选择与复合控件](COMPONENTS.md#选择与复合控件)，它们复用既有token、motion、Field/Combobox/按钮，不增加界面密度或业务引擎。

React菜单沿用peer的可聚焦disabled项默认（可读取原因，不能执行）；native菜单方向键跳过disabled。两者都验证禁用不执行与Esc回焦点，不伪称所有键盘停靠点完全相同。

### 菜单文字、图标与字段标签

React Menu.LinkItem透传固定peer的closeOnClick合同，默认false；需要点击后关闭时明确传true。

Menu / ContextMenu 的 Item、LinkItem、CheckboxItem、RadioItem、SubmenuTrigger 统一使用显式菜单角色 body-xs/line-height-body-xs/font-weight-control（默认13px/20px/500）。该规则位于 `.xui-menu-item`，不改变 Portal 的 `.xui-layer` body-sm正文；Select/Combobox/Command 中共用该菜单项角色的选项同时得到相同文字合同。

`Menu.Icon` 与 `ContextMenu.Icon` 是同一公开装饰性 span slot，透传 span props/ref，默认 `aria-hidden=true`。示例 `<Menu.Item><Menu.Icon><Settings /></Menu.Icon>设置</Menu.Item>`；原生使用 `<span class="xui-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24">…</svg></span>`。slot 与它的直接 SVG 子元素由库绑定 control-icon-size（默认16px）、不收缩；图文间距继续采用 menu-item-gap（默认8px）。SVG 自身24px属性不再改变菜单图标布局；未声明slot的普通嵌套插图不受此规则强制缩放。不要再全局覆写菜单中所有svg。

`.xui-label` 与 `.xui-choice-label` 显式绑定标签字号、行高与字重；Field 仍是 label→control→help→error 的8/4/4px间距，控件 id/htmlFor/aria-describedby/aria-invalid 规则不变。choice-label 的默认36px点击区保留，不因13px文字机械缩为20px。原生 HTML 继续使用同名公开类、label for 与显式错误关联；没有为这次修复新增密度或small/large开关。

### 表单焦点绘制与关闭入口

Dialog.Body 与 ScrollArea.Viewport 是滚动边界：两轴裁切需要给焦点外环预留 `focus-width + focus-offset` 的四边绘制空间，仅设置 scroll-padding 不够。公共 base.css 统一拥有 padding / scroll-padding 与子控件 scroll-margin；Dialog.Body 用等值负 margin 消耗 Content 已有内距，因此字段仍与标题和 footer 对齐，长正文保持有界滚动，Content 的圆角裁切不变。ScrollArea.Viewport 默认 focusMode=gutter，在自己的内容盒中留空间，不扩宽 Root；其自身键盘焦点使用 inset 指示。显式 focusMode=inset（原生 data-focus-mode=inset）把几何余量与控制项内部焦点绘制一起放在 CSS @scope 增强内，旧引擎保留 gutter；最近公共滚动边界拥有策略，嵌套默认 gutter 不被外层 edge/inset 覆盖。可聚焦的 ScrollArea.Viewport 与 TableContainer 自身使用内部焦点绘制，贴在外层零 gutter 滚动口边缘仍保持完整；其内部控制项继续采用各自边界策略。InputGroup 仍只有外层一套边框和焦点，invalid 边框不被 focus 覆盖。

Surface（普通 Card）、Field、Grid 本身并不裁切：Surface 默认已有 card-padding，显式 padding=none（原生 data-padding=none）只去除此表面的内距，背景/边线/圆角保留且不增加裁切，内部卡片与控件仍保留自己的默认 padding。Card 内套 ScrollArea、Dialog/Sheet 内套 Card 与滚动表单则由对应滚动边界承担绘制空间。宿主自行增加 overflow:hidden/auto、零内距或固定窄宽度，会建立新的裁切边界；应使用正式 ScrollArea，不通过输入框逐个补丁、全局 overflow:visible、缩小 focus token 或移除 outline 处理。

工作区主内容贴边使用公开 [contentInset=edge](COMPONENTS.md#工作区正文贴边)，只在 workspace 生效。多行草稿与上下工具区域使用 [InputGroup stacked/Textarea](COMPONENTS.md#多行输入与上下工具区域)，唯一组表面/焦点仍由 InputGroup 拥有，不用 Surface 再套一层输入框皮肤。

React 推荐组合：`<Dialog.Header closeButtonProps={{'aria-label':'关闭设置'}}><Dialog.Title>设置</Dialog.Title><Dialog.Description>说明</Dialog.Description></Dialog.Header>`。Header 默认只生成一个 CloseButton，标题轨道可收缩/换行，关闭入口位于右上（RTL 为逻辑末端），不与文字重叠。`showClose={false}` 明确隐藏入口；`closeButtonProps` 透传 Base UI Close 的 disabled、回调、render/ref 等合同。Sheet.Header / Sheet.CloseButton 复用同一实现。需要手工标题组合时，可把一个 Dialog.CloseButton 直接放在 Content 内；它采用右上绝对定位，并为直接 Title/Description 留出位置。

`Dialog.Close` / `Sheet.Close` 继续是无位置假设的关闭动作，可用在 Footer 的“取消”按钮。Content 不盲目注入第二个关闭按钮；AlertDialog 继续通过明确的确认/取消动作作决定，不增加默认 X。

原生 HTML 等价：在 `.xui-native-dialog` 内使用 `.xui-dialog-header`，其中 `.xui-dialog-heading` 包含带 id 的 `.xui-dialog-title` 与可选 description；兄弟按钮采用 `type="button" class="xui-button xui-dialog-close" data-variant="ghost" data-icon="true" data-xui-close aria-label="关闭设置"`，内部 SVG 为 aria-hidden。仍由一个 createDialogController/createSheetController 处理关闭、Escape、取消和回焦点。普通 Footer 按钮只保留 data-xui-close，不添加 xui-dialog-close。

旧消费者迁移：删除尾部游离 X，改用 Header 的默认 CloseButton；或把原 X 的 Dialog.Close 改为 Dialog.CloseButton（二选一），不能两个一起保留。库不能从普通 Close 推断它是图标还是合法 footer Cancel，因此升级版本本身不会自动重新定位旧的游离 X。删除消费方通用定位/裁切补丁，业务草稿、onOpenChange/details.cancel、提交和权限继续归宿主；产品接入需核对真实消费版本与页面。

原生 Dialog 的 `syncOpen` 同步宿主已确认的受控状态，不受最初注册 trigger 的 disabled 状态限制；同一个弹窗可能由另一项已授权动作打开（例如原 trigger 已禁用时，由另一个已授权入口打开）。trigger 点击和 `open()` 请求仍拒绝 disabled，不能把 `syncOpen` 当未授权的用户请求入口。

长风险说明放在 `Dialog.Body` 内的 `Dialog.Description`（原生仍是带唯一id的 `.xui-dialog-description`），使说明与表单共用一个滚动owner；Dialog 的 aria-describedby 仍指向该完整原文。短介绍可继续位于Header。不能让长说明作为独立固定轨挤掉表单，亦不能只用固定高度裁切正文。正常窗口由 Body 内滚且 Footer 可见；长 Header 或极端短窗口改为整体弹层滚动，Body 恢复自然高，关闭、标题、说明、表单和 Footer 均须可滚动到达。同一时刻只有一个活动滚动 owner，不承诺所有内容同时同屏。无 ResizeObserver 或 SSR 初始状态保留整体滚动；内部测量只切换布局属性，保留 DOM、值和焦点，销毁释放观察器/帧/事件。内部 dialog-layout 不是公开宿主 API；实际验证范围见 [VALIDATION.md](VALIDATION.md)。

### SearchToolbar

公开的「搜索 + 主操作 + 可选高级操作」组合，适用于列表、卡片集合、DataTable.toolbar 或 MenuLayout.pageToolbar。查询、值、筛选、分页、业务动作与 API 请求始终归宿主。它不创建 form、search landmark 或 ARIA toolbar 的方向键模型；内部是普通 group，控件保留正常 Tab 顺序。

#### React

从 `@coffeehc/xui-react/search-toolbar` 或根入口导入 `SearchToolbar`、`SearchToolbarProps`。加载正式 `@coffeehc/xui-theme/style.css`；按需样式须同时具备 tokens/base/button/navigation/layout/search-toolbar 及所用控件 CSS。

完整接线见 [React SearchToolbar](../examples/search-toolbar-react/app.tsx) / [原生 SearchToolbar](../examples/search-toolbar-vanilla/app.js)。

- search/actions/advanced：ReactNode，可分别省略；null/undefined/布尔/空字符串/空 Fragment/空数组不占对应槽。0 是内容。返回 null 的自定义组件仍是已提供的内容，不对它做 DOM 探测。
- defaultExpanded：仅初始值，默认 false；true 初始展开。后续改变此字段不会重置用户选择。
- expanded/onExpandedChange(next)：受控事实与请求；拒绝/暂不回传时界面不擅自改变。程序更新 expanded 不触发 onExpandedChange。受控与非受控模式应保持稳定。
- advancedLabel：触发按钮文本及可访问名称，默认 `Advanced options`，空白文本回退默认名，本地化由宿主提供。
- 其余 div props/ref 透传到外层；children 不支持，使用命名槽。

#### 原生

从 `@coffeehc/xui-runtime/search-toolbar-dom` 或根入口导入 `createSearchToolbar`、`SearchToolbarOptions`、`SearchToolbarController`。

search/actions/advanced 接收 Node|null，普通 button/input 使用现有 `.xui-button`/`.xui-input` 等公开控件类。`getElement()` 返回库生成的外层元素；只用于挂载关联/测量等正常调用，不要求查询私有子结构。`label` 设置内部 group 名称。默认值与受控语义同 React。`getExpanded()` 返回展开事实，即使 advanced 暂无内容也保留该状态；没有高级内容时不显示按钮/区域。

update 为字段合并：省略保留现值，显式 null/undefined 清空对应槽；defaultExpanded 后续不重置状态。相同 Node、相同已消费的 Fragment 只挂载一次，未改槽保留输入值、选择和焦点；传入新 Node 明确替换内容。各槽必须有独立节点，不能重复、嵌套共享或包含工具栏结构。空 Fragment、空文本节点及注释不显示触发器。内容变化需传新节点/Fragment，不能依赖工具栏扫描已消费 Fragment 的变化。一个容器同时只允许一个 owner；destroy 幂等、移除自己的监听并恢复容器原内容，不销毁宿主提供节点的业务监听。

#### 尺寸、焦点与组合边界

宽屏搜索占剩余宽度，actions 靠右同一行，搜索默认宽度不参与操作组换行判断。工具栏自身窄于 40rem 时搜索单独一行，actions 内可换行。根、槽和控件均可收缩，无横向裁切；统一普通按钮尺寸采用公开 control-height 等 token，传入不同 Button.size 仍在工具栏动作区归一，图标按钮同步。极长标签允许自然增高；同一行按钮 stretch，不承诺所有跨行按钮固定像素高。高级区任意复杂布局继续组合 Grid/Field/Stack，禁止宿主给控件固定超宽尺寸或添加私有 CSS 补丁。

高级内容折叠时保持挂载和值，以 hidden/inert 移出可访问和焦点树；不禁用字段、不清值、不代表退出 form 提交。若业务希望折叠字段不提交，须由领域状态决定。触发器不是 submit，不执行搜索；程序收起焦点仍在高级内容时回触发器，外部焦点不被抢走。

`Dialog.Content.keepMounted` 默认 false。AppShell 为复用同一侧栏会显式启用它；关闭时仍隐藏并保持模态隔离，普通 Dialog 默认不变。

## 数据表格

通用记录页复用 Table 原语与公共 `xui-record-table` 排版：`xui-table-primary` 显式标识任务主列，使用 `--table-primary-min-inline-size`；`xui-table-label` 保留完整元数据词组，`xui-code xui-table-value` 组合采用 mono/tabular 与单行时间/计数。次要列在表内横滚，不压成逐字竖排。行操作复用 ghost/xs Button，真正危险确认仍在 Dialog 中；不新增请求、排序或权限 owner。表格通过准确的可访问名称识别，不重复可见页标题。这些角色只在有阅读需要的列显式采用，不为普通 Table 强制列宽。一次性 Key 的读取区域消费既有 mono/tabular 文字角色，保留 Textarea 的尺寸、焦点与选择复制语义。

正式入口：React `@coffeehc/xui-react/data-table`；原生 `@coffeehc/xui-runtime/data-table-dom`；共享事实与类型 `@coffeehc/xui-runtime/data-table`。三者也从各自根入口导出。默认皮肤属于公共 `@coffeehc/xui-theme/table.css`，完整 `style.css` 已包含它。原有 Table/TableContainer、Toolbar/Field、Pagination、DataRegion/反馈原语保持原语合同，不会自动升级所有旧表格。

完整消费者：[React](../examples/data-table-react/app.tsx)、[原生](../examples/data-table-vanilla/app.js)，共用[合成只读模型](../examples/shared/data-table-model.ts)。它们只安装正式 tarball，不依赖 `packages/src` alias、私有 CSS、产品 DOM 或真实业务服务。默认示例使用自然高度；`?layout=workspace` / `?layout=document` 对比显式布局，`?unbounded` 检查无高度边界，`?local` 演示宿主本地分页，`?cursor` 演示不请求总数的服务端游标（`?cursor-total` 可同时带真实总数），`?no-search`、`?no-actions`、`?no-pagination`、`?fixed-page-size` 检查可选能力。本节不代表任何产品完成迁移。

### 责任与最小接口

- 库提供表格整体、表体滚动、自然流底栏、列头/单元结构、筛选排列、状态反馈、键盘与默认视觉。宿主提供数据、列/行键、业务筛选、权限、排序/选择事实与业务动作。
- `DataTable<T>` / `createDataTable<T>` 必填 `label`、`rows`、`columns`、`rowKey`。每列有唯一 `id`、`header`、`cell(row, context)`；React cell 返回 ReactNode，原生返回 Node/文本或下述生命周期 slot。列可声明 `width`、`ariaSort` 和 `sticky:'start'|'end'`，复用原有表格样式；排序按钮放 header，真实排序通过宿主回调完成。
- `rowState(row)` 可提供 `selected/expanded` 事实。这里没有选择、排序、虚拟化或编辑状态引擎；展开明细、复杂合并单元格继续按已有 Table 原语组合，不伪装成已支持的 DataTable 特性。
- `status` 明确为 `idle/loading/ready/refreshing/error`，默认为 ready。`disabled` 阻止组件自有分页/条数/重试动作；单元业务动作由宿主按真实权限决定，context 提供 busy/disabled 事实。只读查看可在刷新时继续可用，不把整个表体设为 inert。
- `toolbar`、`emptyState`、`errorState`、`feedback`、`footer` 是公开插槽；内部 toolbar、反馈、表体与 footer 位于同一个 frame，没有默认业务动作或自动写入。`labels` 覆盖加载、错误、空态、分页和 `count({rowCount,total})` 文案。
- 所有 rowKey 必须唯一、稳定，字符串/数字经文本化也不能重合；列 id 唯一非空。空列、不合法 page facts 在渲染之前拒绝。

### 列宽与内容边界

`DataTableColumn<T>.width` 与 `NativeDataTableColumn<T>.width` 同为可选 `DataTableColumnWidth`，表达列宽下限。通常省略，由表格自动分配；仅在标识、操作或用户配置等确有尺寸要求时设置。该类型从 `@coffeehc/xui-runtime/data-table`、`@coffeehc/xui-runtime/data-table-dom`、`@coffeehc/xui-react/data-table` 以及 runtime、React 根入口导出。列尺寸不重定义品牌 token，也不让库新增业务列、读取用户偏好或保存列配置。

受控接线见 [React DataTable](../examples/data-table-react/app.tsx) / [原生 DataTable](../examples/data-table-vanilla/app.js)。

- number 是 CSS 像素，运行时必须有限且非负；`0` 合法，但不表示隐藏列。隐藏列应由宿主过滤 `columns`，不能依靠零宽隐藏仍存在的表头、数据或交互。
- 字符串支持有单位的 CSS length（如 `'12rem'`、`'160px'`）、百分比（如 `'25%'`）、`calc(...)`、`clamp(...)`、`min(...)`、`max(...)` 和 `var(--...)`。裸数字字符串（如 `'160'`）、`auto`、对象、数组和 boolean 不是本接口的宽度值；自动列省略 `width`。
- TypeScript 模板字符串限制值的形状，不是完整 CSS 或数学验证。number 类型也不能静态证明有限、非负。在正常浏览器中，运行时再用 `CSS.supports('width', value)` 拒绝无效 CSS；SSR/无 CSS parser 时仅检查结构，不模拟 CSS parser、不解析变量，也不据此声明 SSR hydration 已验证。宿主须提供能解析为宽度的自定义属性；`calc(...)` 的合法表达式若计算为负数，宽度由浏览器归零，不会在静态类型阶段被证明或拒绝。

表格默认铺满表体可用宽度。未声明任何 `width` 时，保留原有自动表格布局；部分列声明时，未声明列优先吸收剩余空间；全部声明时，浏览器在这些列之间分配余宽，实际宽度可以大于配置值。配置下限总和超过可用宽度时不压缩这些列，仍由表体区域横向滚动。表头和全部数据单元格使用同一张 table 的列轨道，不分别计算或复制表头宽度。

此前全部指定列宽时按总和收缩、允许右侧留白；现在这些值作为下限且整表默认铺满。依赖旧精确宽度的消费者须核对新的实际列宽，不能再把 `width` 当作最大值或承诺像素不变；无需增加占位列或产品私有 CSS。

百分比及混合表达式（如 `'calc(50% - 1rem)'`）统一以表体可用宽度为基准，不以自身表格已经扩出的总宽为基准。组件内部用非交互、`aria-hidden` 的零高测量块交给浏览器解析，并由单个 `ResizeObserver` 将结果同步为 `colgroup` 的像素宽度；宿主无需查询内部 DOM、计算百分比或维护自己的观察器。此内部结构不是公共定位或样式入口。

长中文、长英文及无空格文本沿用公共表格的 `overflow-wrap:anywhere` 换行，不默认截断或省略内容。宿主 slot 若强制 `nowrap`、放置不可收缩的大控件或更大的最小宽度，仍须按内容选择合适列宽或适配 slot；库不会为满足指定宽度默认裁切按钮、操作内容或焦点轮廓。`sticky:'start'|'end'` 仍是既有单侧零 offset 合同，列宽配置不自动累加多个 sticky 列的偏移；需要多列冻结组合时使用已有 Table 原语的显式 `stickyOffset`。

全指定列与主要内容列省略 width 的正式消费者对比及实际矩形检查入口见 [浏览器列宽合同](../tests/browser/data-table-widths.spec.mjs)，实际执行范围见 [VALIDATION.md](VALIDATION.md)。

### 页面标题、筛选与滚动

共享 `DataTableLayout = 'natural' | 'workspace' | 'document'` 从 runtime/data-table、runtime/data-table-dom、React/data-table 及 runtime/React 根入口导出。React `DataTable` 与原生 `createDataTable` 的 `layout` 默认均为 `'natural'`；它与 shell 的 `scrollMode` 是两个独立选择。

- `natural`：零行、少量行时随内容自然收缩；有实际确定高度的父容器时，以 `max-block-size:100%` 为上限，多行才由表体独立滚动，内部 toolbar、反馈和 footer 保留在正常布局流。父容器高度为 auto 时，百分比上限不能创造可用视口，表格仍按文档流增长；要限制高度，先通过公开 shell 或宿主已知尺寸建立真实边界。
- `workspace`：显式保留旧有填满已分配正文高度和组件最小高度的行为，适合需要少量行也占满工作区的页面。
- `document`：始终按无约束文档流增长，即使父容器有确定高度也不采用 natural 的高度上限；外层页面负责滚动可达性。

采用已有 `AppShell/MenuLayout` 的 `scrollMode="workspace"`、`pageHeader` 与正文可提供真实高度边界，没有第二套 PageLayout。下面让自然高度表格在 workspace 正文内按内容收缩，并把筛选放在同一表格外框内：

组件内部的 toolbar、表体与 footer 共用一个 frame；已有行的状态反馈与自定义 feedback 放在 footer 的计数区域，未出现反馈时不在列头上方预留空行；只有表体 `TableContainer` 在高度受限时滚动，列头按原有 stickyHeader 合同默认启用。边框属于整体 frame，滚动容器不再叠一层外框；底栏有必要的信息分隔。组件使用真实可用高度，宿主无需测量 pageHeader 或减固定像素，也不 absolute/fixed 定位分页。

极端字号或高工具条使全部 chrome 超过正文分配高度时，外框保留完整工具条/反馈/底栏和可读表体下限，交给既有祖先滚动，不让 footer 越出 frame。库内部只有一个稳定的布局观察器，以实际 table、thead、首末行高度和 computed scroll-padding/滚动条计算 `min(实际内容高度, 表头与首末行较高者的可读高度)`，将该值用于 Grid 的表体轨道，并与组件自身工具条/footer（含反馈）的实际高度、frame 边框相加，设置组件根的最小高度；不读取宿主页头或已分配的根/frame 高度作为下限。workspace 取该实测最小值与原 token 的较大者，document 不加此根下限。无固定表头数字、行数分类或新的宿主参数。短内容不会因此补出空白。观察器只观察内容输入节点，不观察写入尺寸的 root/frame；合并同帧读写、无变化不写、忽略隐藏时的零几何、恢复显示后重测，并在销毁时释放及恢复拥有的内联值；列宽测量与 colgroup 合同独立且不变。

这个下限保证边缘记录操作的可达空间，不保证任意高度的全部中间行都可完整同屏。自定义超高单元格仍由表体滚动访问；需要逐行长文档阅读时可选 `document`，或按已有 `stickyHeader={false}` / `{stickyHeader:false}` 关闭吸顶列头。父视口本身不足时使用祖先滚动，不裁切内容。

外部 `pageToolbar` 仍受支持，与内部 `toolbar` 二选一放同一组筛选；不要复制搜索或增加查询 owner。`DataTableToolbar` 复用 Toolbar，`DataTableFilter` 复用 Field 的标签/id/错误关联；普通筛选默认使用 `--data-table-filter-min`，`grow` 搜索使用既有长字段尺度，在足够宽时自然同排，窄屏换行。不要直接依赖 SimpleSelect 的全宽规则排列整个筛选区域。原生使用 `createDataTableToolbar(document, nodes)` 和 `createDataTableFilter(document, {label,control,grow})`，业务 control Node 与事件始终属于宿主。简单选择先创建字段容器，再对其 select 调用 bindSelectControl；保存 select 引用，值/选项变化后 update，移除时 destroy。封装会将字段 id 转移给可见 trigger，后续不能通过该 id 读取表单桥的 value。未提供搜索、动作或 toolbar 时，不为缺失能力保留空控件。

pageToolbar 容器原本就没有常驻下边框，和下方正文之间已有 `--layout-section-gap`。不要额外包整行 border-b；迁移时清理产品重复分隔及 footer/表体定位 CSS。表头、行和底栏必要边界保留。

`--layout-workspace-content-min-block-size` 仍是既有 shell 的公开内容区下限，默认 `0px`，不自动探测 DataTable。在 workspace shell 中要求超高页头/200%文字下保留非零正文视口时，仍须如上通过公开 style 显式绑定为 `var(--data-table-min-block-size)`；该设置只保障 shell 正文的可达空间，不把 natural 表格变成填满布局。main 可自然滚到表格，内容区可继续滚动到完整 footer。该下限按 rem 随字号变化并受 100dvh 约束，极短窗口允许 main 滚动，不承诺所有内容同屏。`--data-table-min-block-size` 保留用于显式 workspace 的组件下限，不是 natural 的强制高度；组件最小高度不能跨越零高父视口解决可达性。

原生同样只设置宿主 root 的公开 token，在生命周期结束时恢复宿主原值；不要查找或改写 `.xui-shell-content`：

普通无边界文档页可直接使用默认 natural；只有需要显式取消有界父容器高度上限时才选择 `layout='document'`。卡片列表仍用相同 pageHeader/pageToolbar，正文复用 ScrollArea/Grid/Surface，参见消费者 cards 模式；不用另造页面骨架。

### 默认布局迁移

此前省略 `layout` 等同于 `workspace`，现在省略等同于 `natural`。依赖旧默认填满工作区或最小高度的消费者应显式加 React `layout="workspace"` 或原生 `{layout:'workspace'}`，保留其真实父高度与必要的 shell 内容区下限。希望少量行/空态自然收缩的页面可以继续省略；显式 `document` 调用无需改变。不要通过产品私有 CSS 恢复旧默认。

内部 toolbar、反馈、表体与唯一计数/每页条数/Pagination footer 位于同一 frame。采用项目升级时核对固定依赖 SHA、实际入口、页面槽和业务行为，库中已有该组合不能证明产品已采用；已有使用方的兼容约束由宿主评估。

### 分页事实与未知总数边界

组件只渲染传入的 `rows`，不自动切片，也不新增查询 owner。两种分页方式复用同一受控接口和同一个 footer：

- 本地分页：宿主持有完整记录和查询状态，先筛选/排序，再按 `(pageIndex - pageIndexOffset) * pageSize` 切出当前页，发布切片 rows、筛选后真实 total 和已确认 page facts。查询或条数改变时由同一宿主 owner 重置/校正页码。
- 服务端分页：宿主发请求，并以已确认响应对应的 rows、pageIndex、pageSize、total 更新表格；等待/失败期间保留旧确认事实。服务端已分页的 rows 不得再做一次本地切片。

`pageIndexOffset` 必须显式指定 endpoint 页基数，不默认猜 0 或 1。共享 `WebfacadeQuery` 使用真实 `page_index/page_size/return_total`；`parseListData` 验证真实 `list` 与可选 `total/next_cursor`，`toListPage(wire,{returnTotal})` 把未请求的总数投影为 null。组件不调用 HTTP、解析 envelope、猜字段或建立第二个 query/resource owner。

已知 total 时只做明确视图投影：`page = pageIndex - pageIndexOffset + 1`，`pageCount = max(1, ceil(total/pageSize))`。用户点击发出原 wire 基数 index；事实仍保持旧值，直到宿主确认下一组 rows/page facts 后更新，服务端场景以响应确认为准。每页条数只在 footer 出现一次，和真实已显示条数、已知总数与分页在同一公共区域；pageSize 更改只发请求，宿主决定是否回 endpoint 第一页。pageSizeOptions 必须为正的唯一整数并包含已确认值。省略 `onPageSizeChange` 表示条数不可编辑，保留唯一禁用条数控件；不应在 toolbar 再放一个条数选择器。

旧 `DataTablePagination` 保留原字段和默认 offset 行为，可显式 `mode:'offset'`。其中 `total:null` 只显示真实已加载数并隐藏编号 Pagination，不从满页/短页/数组长度猜 pageCount 或 hasMore。无 pagination 则为未分页列表，只显示已加载数。

游标服务采用 `DataTableCursorPagination`，与 offset 类型同由 React、原生及 runtime 公开入口导出：

cursor 模式复用框内同一计数、条数控件和分页区域，只显示上一页/下一页。即使有 total 也不构造页码或页数，不接受 `onPageChange`。`hasPrevious:false`、`nextCursor:null` 或缺对应回调会禁用该动作；busy/disabled 与旧模式同样受控。服务端 `next_cursor` 缺省不等于末页：宿主 cursor adapter 必须要求字段存在，不能用 `?? null` 把未声明变成末页。HTTP 的 wire 使用 snake_case，组件 view facts 使用 camelCase，精确转换见 [列表合同](PUBLIC_API.md#列表元数据与受控游标分页)。

上一页历史、查询/排序变化后重置、请求预算、失败重试、取消和迟到结果仍由唯一宿主 resource/query owner 管理。仅成功确认响应才推进历史和 rows；失败/取消不推进。组件不把 cursor 当作 URL/页码、不解码或生成 token，不自动缓存 total，不用数组长度推断后页。公共组合提供标准游标按钮，`footer` 仍可放补充业务内容；不要重复两组翻页 owner。

已知 total 缩小导致当前 page 超范围时，组件保留事实而隐藏无效编号控件；宿主须在同一查询 owner 中协调过期页或提供恢复入口，不静默 clamp/自动发请求。

busy/disabled 阻止重复分页、条数和默认重试，另有同步单事件轮重入门禁。宿主必须同步发布 loading/refreshing，等待期间保持 busy，并在成功、失败、拒绝或取消后更新；组件不猜 Promise 完成，不自动重试写操作。回调结束并不表示请求成功。

### 状态、焦点与生命周期

- 首次 loading 始终保留列头并在 tbody 显示稳定骨架及 loading 状态，footer 不把加载中的未知计数当 0 条成功结果。
- refreshing 传入既有 rows；表体、底栏和搜索身份保持，反馈置于同一外框内 footer 的计数区域，不另加外部反馈层；常规短状态优先复用 footer 既有高度；长内容或窄屏需要时自然调整高度，达到真实父级上限后再压缩表体。error 仍保留既有行并提供 `onRetry`；首屏 error 位于 tbody，不能伪装成 empty。
- ready 且 rows=[] 保留全部列头，默认空态在跨全列 tbody 单元格内。`filtered` 区分初始无记录与筛选无匹配；自定义 emptyState 可放已有新增/清空回调，库不会凭空创建记录。
- 关闭、切页、查询变化、取消和迟到响应由现有 resource/query owner 处理。示例使用 `createResource` 与显式已确认快照，不添加 HTTP owner。业务查询改变时保留旧 rows 的策略明确由宿主选择，不能把它们误标为新查询结果。
- React 行/单元使用稳定 key。不要在 footer 更新时改变 columns renderer 的组件类型、重新生成行键或用整个查询给 DataTable 设 key。
- 原生 root 一次只允许一个 owner。`update(partial)` 未指定项保留，显式 undefined 可清插槽；表体、分页控件、toolbar 和 keyed 行保持身份。`getBody()` 返回公开滚动区域供合法滚动控制，不要求消费方查私有 DOM。

原生交互单元推荐 slot：

有 update 的 slot 在同 key 行、busy/footer 更新时复用 element 并接收新 row/context，不移除正在聚焦的节点；移除列/行、替换 renderer 或 destroy 时恰好释放一次。普通 Node/文本仍支持，状态变化不会为它重建业务动作；需要把 busy 映射到已有控件时使用 slot.update。宿主承担自己挂上的监听器/第三方控件清理；slot.destroy 为正式清理入口。更新删除当前行时焦点回表体区域，不留在已脱离的节点。destroy 解除组件事件、释放 slots、恢复原 root 内容/属性；旧 handle 不再生效。初始化 factory 出错同样回收 root，不留下半个 owner。

### 请求失败时的可读性与布局

无反馈时，toolbar 之后直接进入列头，不保留常驻状态空行。已有行刷新或失败的反馈，以及自定义 feedback，使用已有 footer 中计数旁的正常流区域；保留真实计数、每页条数及分页 owner。常规短状态在空间足够时复用底栏高度并保持表体边缘；窄屏、200% 或长文案以完整可读、键盘可达为更高优先级，允许 footer 必要增长，由既有布局观察器维持 frame 包含与祖先滚动。无 count（labels.count 返回空字符串）且无 pagination、footer、反馈时，不显示空 footer；必要反馈出现时仍有完整区域。

库不截取、改写或猜测 labels.error / errorState / feedback 的摘要，不将关键条件藏在固定高内部滚动框里。宿主有明确短摘要与独立详情时，可在 errorState / feedback 里组合已有公开 Disclosure（原生 createDisclosureController）；摘要应完整表达当前后果，详情通过明确按钮展开，输入、展开状态和焦点在同一宿主节点生命周期中保留。只传一个长消息或 Node 时，原样自然呈现，不能为了零位移裁掉内容。

零行的 loading/idle/empty/error 仍在保留列头的 tbody 内，有 token 最小高度而无固定内容高度上限。首次加载/长错误可以自然增长；多行仍仅由表体独立滚动，分页留在 frame 内。没有新增自动重试、请求或缓存 owner。双端正式消费者可用 `?internal&no-count&no-pagination` 和 `?internal&disclosure-feedback` 验证可选信息与长详情。

现有行是否保留仍由宿主 rows 决定：普通同资源刷新应保留已确认事实；权限撤销、退出、租户或资源切换应按领域/认证规则清空，无权通过本组件继续展示。组件不缓存数据、不创建网络请求或离线 owner。见 [失败布局验证与边界](VALIDATION.md#失败复验与限制)。
ACL/权限过滤后的有界扫描可连续返回空 list 与非空 next_cursor；这仍可继续翻页，不保证下一页含记录，也不表示剩余数量。仅显式 null 是 cursor 末页。DataTable 不因空行禁用下一页，React/原生都有独立回归；此补充不改变共享 fixture 的字节或 hash。

`TableActions` 从 React 根入口及 `/table` 导出，接受标准 div props/ref，只负责换行与 table-action-gap；原生为公开 `.xui-table-actions`。标签、排序、权限和写入结果由宿主拥有。长标签可换行，单元格保留焦点间隙。

## 登录与管理员表单

### 完整页面与扩展

配置产品名称、标题、说明、可选logo、文案、safe returnTo；默认card采用居中、自然高度的单列登录框。显式fullscreen保留相同窄框，只省略外框表面与边框；两者均无左右品牌面板或分割线，尺寸统一来自[DESIGN](DESIGN.md)。主题复用已有owner，登录页不增主题选择器或持久化副本。React和原生共用布局，窄屏/短视口/200%文字自然文档滚动，字段和动作可达。主动作后的反馈与辅助动作为空或隐藏时不占位；实际消息自然增长并完整可读，不保留固定或最小反馈轨道。字段与主动作保持 DOM、尺寸和相对顺序，居中卡片可随消息增高调整位置；公共尺寸与品牌组合见 [DESIGN](DESIGN.md#公共登录页布局与主题)，实际验收见 [VALIDATION](VALIDATION.md#认证页验收)。brandVisual仍是可选inert装饰内容，放在框内顶部品牌组、默认最大80px高，窄屏隐藏；不应嵌入完整登录卡片或重复登录任务标题，公共库不识别图片文字。原checkSession文案键仍可配置，默认文字为“Retry connection”，仅在安全的session读取网络/超时/服务端失败时作为局部次动作出现；凭据401/403/429无此入口。自动session/refresh检查只显示局部状态；共享读取的等待者取消不等于取消底层owner，因此页面不提供该阶段的取消按钮。公共登录页已删除取消按钮及专属文案/事件，扩展等待也不自动生成取消动作。卸载、pagehide 与 auth owner 的 Abort 能力仍会终止所属等待并拒绝迟到结果，保留迟到结果隔离。页面不再承担登出管理；应用内仍可通过同一auth owner显式logout。

导航就绪要求owner为authenticated且busy为空，并且本节等待的认证/读取已成功结算。currentUser恢复access期间的refresh结果保持busy=session，最终session核对完成才发布空闲；宿主先启动读取再挂登录页与页面自行检查使用同一个flight，StrictMode重放不会增加HTTP请求。单独refresh仍按原合同完成。旧session因新access generation而失效时，页面只提供局部读取重试，不因owner保留另一份有效access而提前导航。

owner确认有效authenticated后，无论来自初始session检查还是主动login，都一次直接进入目标页；不显示“已登录/继续进入”确认卡。匿名保留同一表单；checking、login busy、错误与navigation交接不重挂字段或主按钮。同一auth owner与已验证user.id去重，不依赖每次refresh产生的新user对象引用；临时unknown/session/refresh保留该去重和导航失败结果，恢复身份不会暗中重试宿主导航；StrictMode effect重放、重复订阅通知和原生render不会重复导航。

`onAuthenticated(user, returnTo)`兼容void，也可显式返回Promise<void>。宿主负责真正导航或替换为目标内容。同步抛错/返回Promise拒绝时，保留已确认的认证事实，局部显示navigationError与retryNavigation；重试只再次打开目标，不调用login/refresh/logout。void回调自行启动的异步任务无法由页面观测，其错误由宿主处理；需要页面处理失败则返回该Promise。pagehide/unmount后迟到的回调结果不再修改登录页；已经开始的宿主副作用仍由宿主按自身生命周期取消。opening期间禁重复且清空密码，没有虚假的完成卡。真正卸载后alive失效；StrictMode探测性cleanup/replay沿用同一次回调而不再次启动；更换auth owner会失效旧导航revision。pagehide使当前激活失效；pageshow.persisted恢复交互，并在owner仍确认authenticated时开始该次激活的一次目标导航，不补session/refresh/login请求。宿主需遵循bfcache生命周期，不能在persisted pagehide无条件销毁要恢复的owner。

没有onAuthenticated时，直接使用经过 `resolveLoginReturnTo` 的根相对location.assign；若目标path/query就是当前页，则显示局部导航失败而不重复reload。回跳拒绝规范化及多次解码后的外部路径、控制字符、双斜杠、默认/login循环；去fragment与明确密码/token/code/api_key等query。其它自定义登录路由或含秘密业务query仍由宿主验证。

`extensions.beforeSubmit/actions/errorLabel` 和beforeFields/afterFields仍只接收username与AbortSignal，不接收密码/token/原始响应。宿主标准SSO、服务地址与账户来源保留同一认证owner。重复提交、扩展卸载中止、迟到导航和密码节点清空仍受页面generation控制；修改真实服务由产品安全策略决定。

### 纯认证布局 AuthPage

首次管理员设置、启动错误和其他认证入口使用 `AuthPage`（React `/login`）或 `createAuthPage`（原生 `/login-dom`），由xui统一品牌组、横纵定位、由DESIGN定义的窄表单、任务标题/说明层级、内距、全宽主动作、反馈与滚动/focus。feedback槽可组合现有Disclosure承载独立长详情，必要摘要和未知后果始终在折叠区外完整显示，不截断宿主消息。不得拼 `xui-login-*` 私有结构、给产品补定位CSS或局部修改control-height等公共尺度。既有完整登录内部复用此组合；认证client和业务API不属于布局。

- `config: AuthPageConfig`：productName、必填title、可选description/logo/layout，沿用登录品牌校验与fullscreen/card含义。主题继承文档根，不接第二theme owner。
- React `children` / 原生 `content`：宿主公开Field/Input等组成的内容，不传另一整个页面或嵌套form。
- `actions`：主操作按钮/Fragment；公共槽负责全宽、lg高度与内距，宿主负责标签、disabled/busy、权限、验证和事件。`alternatives`：独立次级操作组。
- `feedback`：宿主Alert等反馈；`feedbackActions`：只在有真实用途时出现的局部次动作。两槽均为空或隐藏时不占位，实际内容自然增长。React识别空Fragment和条件空值；原生跟随实际节点的hidden与内容变化，destroy释放观察器。布局不自动提交、重试、认证或清除宿主字段。
- 可选 `brandVisual`：非交互装饰内容，继承窄屏隐藏与inert。
- 默认panel为section。只有显式 `form:{noValidate?,onSubmit?}` 才渲染form；公共处理阻止原生默认提交，避免无回调时把字段发到URL，然后调用宿主回调。初始化API、密码校验/清理、成功后的路由均由宿主负责，不接入或猜测产品初始化协议。

原生返回 `getElement()`、`getForm()`、`update(partialOptions)`、`destroy()`。`update({config})`是完整品牌配置替换；传入同一content/action Node时不搬动、不重建，不丢输入值、focus或事件。DocumentFragment按初次插入的实际子节点维护。表单提交回调/noValidate可更新，但已挂载form/section类型不可切换（需有意destroy后新建）；React同样保留固定类型。update在改变DOM前拒绝把布局本身或槽祖先作为内容。destroy只释放布局自己的监听；root仍仅包含该布局时还原原内容，若宿主已换页则保留宿主新内容。宿主领域资源仍由宿主清理。

正式纯布局消费者为 [React](../examples/auth-page-react/app.tsx) / [原生](../examples/auth-page-vanilla/app.js)：三字段管理员设置，仅合成submit回调，不调用真实初始化或认证API。按[同一登录验收清单](VALIDATION.md#认证页验收)验位置、更新identity、三主题/窄屏/200%与主动作可达；不能把示例通过当成产品已迁移。

### 管理员初始化页

`AdminSetupPage`（React `/admin-setup`）与 `createAdminSetupPage`（原生 `/admin-setup-dom`）提供用户名、新密码/确认、提交、忙状态和安全反馈，内部复用 AuthPage/createAuthPage 与 NewPasswordFields，不新增 AuthClient。空反馈不占位，实际消息自然增长，沿用同一主题与自然文档滚动。

#### 输入和责任

双端配置为 `config: AuthPageConfig`、必填 `state: AdminSetupState`、`onSubmit: AdminSetupSubmit`，可覆盖 `labels: Partial<AdminSetupLabels>`、`passwordLabels: Partial<NewPasswordLabels>` 和 brandVisual。React brandVisual 接受 ReactNode，原生接受 HTMLElement。用户名只校验非空，不裁剪提交值或杜撰字符/长度政策。新密码固定校验 6–32 个 Unicode 码点，无策略请求或项目配置。

`onSubmit({username,password}, {signal})` 只在一次明确提交且字段有效时调用，返回 `complete | unconfirmed | unavailable | rejected`。`rejected` 必须表示宿主权威确认未应用、可重新提交，不能把网络异常/取消/无 receipt 映射成 rejected。throw/reject/运行时不合法结果一律转为 unconfirmed。回调需在开始时构造自己的请求数据；库清理传入对象的 password，不保证已传出的字符串或宿主副本可被擦除。

宿主保留具体初始化 API、权限/租户/数据库条件、权威初始化状态及跨重载的未知结果处理；公共页不要求 receipt、operation ID 或额外恢复协议。公共页既不重放写入，也不自动轮询、登录、导航、保存或记录密码。跨卸载/重载的未知结果保护是宿主责任；新挂载不能无依据传 idle。完成仅显示“管理员已创建，请登录。”。

#### 状态和生命周期

- idle：宿主确认当前允许初始化；用户显式提交后进入 submitting。
- submitting：阻止重复提交，密码输入立即清空。
- unconfirmed：仅显示“暂时无法确认创建结果，不能再次提交。”，全部写入锁定；不生成额外核对按钮或技术说明。
- complete：初始化已确认完成，仍未登录。
- unavailable：当前不能初始化；界面不猜测原因。

state 可含 `rejected?: boolean`（仅 idle 有效）与 `revision?: number`（安全整数）。React 对 status/rejected/revision 的事实变化应用新权威状态，普通 inline 对象重渲染不取消进行中的提交。宿主在相同状态值上发布新的权威观察（例如 unconfirmed 后又权威确认可以提交）时递增 revision。原生显式 update({state}) 本身就是新权威观察。不要将页面暂态写回权威输入来循环同步。

React 使用一个稳定 form、非受控密码输入和稳定密码字段 ref。`ref: AdminSetupPageHandle` 提供 clear() 清密码，React 卸载/pagehide 中止本地等待，丢弃迟到结果；StrictMode 重放不销毁仍需使用的 owner。原生返回 getElement/getState/update/clear/destroy，update 接受 state/config，保留 form、字段及未受影响焦点；destroy 清密码、释放事件/订阅、恢复原 root 内容。pagehide 使进行中结果变为 unconfirmed，不因返回页面重发。

底层 `createAdminSetupController`（runtime/admin-setup）也公开相同状态/submit 合同，subscribe/getState/setState/suspend/destroy 不包含用户名或密码快照。视图已经拥有该控制器，普通产品不需创建第二个。

#### 正式示例与接入

[React SSR/hydration 示例](../examples/admin-setup-react/app.tsx) 与 [原生示例](../examples/admin-setup-vanilla/app.js) 只使用合成状态和 submit 回调。迁移已有手写 setup 时，删除被公共页接管的用户名/submit/feedback、密码清理与忙态 UI，保留宿主领域 owner、接口与权威状态映射。

单测入口为 [admin-setup.test.mjs](../tests/admin-setup.test.mjs)，浏览器入口为 [admin-setup.spec.mjs](../tests/browser/admin-setup.spec.mjs)。正式构建/consumer 后可访问 `/admin-setup-react/` 与 `/admin-setup-vanilla/`；`?long` 为合成长错误。检查未知状态关键句全文、完成不自动登录、稳定输入/焦点、卸载清理及浅深/system、窄屏/放大；实际运行证据见 [VALIDATION.md](VALIDATION.md#认证页验收)，不以 SSR 静态通过代替 hydration 或真实产品验证。

### 菜单危险操作语义

Menu.Item 与 ContextMenu.Item 共享带类型的 `tone?: 'default' | 'danger'`，默认外观不变。危险默认文字/图标取 status-error-foreground，hover/键盘高亮取 status-error-soft/foreground，pressed使用action-danger/action-danger-foreground成对填充；disabled使用原menu-item-disabled-foreground并禁执行，独立键盘focus轮廓保持。权限、确认、回调和结果由宿主负责，不因tone自动执行或弹确认。图标使用公开Icon且沿currentColor。LinkItem/CheckboxItem/RadioItem保持既有合同，此tone只为普通动作Item。

原生menu/controller沿用公开 `.xui-menu-item`，动作按钮声明 `data-tone="danger"`；controller维护键盘/关闭/回焦点，无React依赖。使用标准disabled/data-disabled/aria-disabled，不能只改颜色伪装禁用。正式ESM/CSS/types消费例子：[React](../examples/menu-danger-react/app.tsx)、[原生](../examples/menu-danger-vanilla/app.js)。无需私有CSS或!important。React沿Base UI保留禁用项可获焦点供读取，但Enter/Space/点击均不执行；原生controller跳过disabled按钮。ContextMenu打开后的初始键盘停靠沿既有peer/controller，Home/End可直接到边界，不强制端间相同首次ArrowDown位置。
