# NumberInput、PasswordInput 与 SearchInput

正式 React `@coffeehc/xui-react/text-inputs`、原生 `@coffeehc/xui-runtime/text-inputs-dom` 及 root 导出。共享数字纯函数在 `@coffeehc/xui-runtime/number-input`。复用 Input/InputGroup/Field 和 forms.css；没有 debounce、fetch、认证状态、密码策略或新颜色/尺寸 owner。旧 Input/NewPasswordFields 不变。

React 三控件均受控，value/onValueChange 必填，保留 input ref、name、id、disabled、readOnly、required、placeholder、autocomplete 等原生属性；放在 Field 中复用 label/help/error，显式 id 可通过 Field.controlId 统一。原生 createX(host, options) 必填 label（安全文本），有同等 name/id/help/error/required/disabled/readOnly/placeholder/autoComplete；返回 element/input/update(partial)/destroy()。同一 host 单 owner，更新保持输入 identity，destroy 幂等释放监听并恢复原内容，不覆盖宿主自行替换的内容。宿主发布值是唯一已确认事实。

## NumberInput

value 是 number|null，空白提交 null，绝不转为 0。min/max 必须有限且顺序正确，step 默认为 1 且必须正数；外部 value 必须有限且绝对值不超过 Number.MAX_SAFE_INTEGER。本组件不适用于精确金额、大整数、ID；这些继续用字符串 Input 加领域 parser，不提供格式化/本地化或 decimal 引擎。

文本输入保留 `-`、`.`、`1e` 等编辑中间态；无关 render 或同值 update 不擦除 draft。真实 inputMode=decimal、role=spinbutton、aria-valuemin/max/now 保留可访问数字语义。onDraftChange（可选）每次编辑通知；onValueChange 只在 blur、非 IME Enter、方向键或步进按钮提交有效且与确认值不同的值时通知。onInvalidDraft（可选）在提交非法文本时通知 draft/error；输入始终以 customValidity 阻止非法/越界/不合步长表单提交。草稿和已确认值不同是有意设计；即使宿主拒绝步进值，aria-valuenow 仍是原确认值。更改外部 value 才替换草稿，form.reset 捕获阶段会先把 defaultValue 同步为最新确认值，浏览器随后的同步重置及立即 FormData 因此都使用确认值；后续 task 再同步 React 草稿，不发送变更。React 在 input/change 事件结束时可能把 DOM defaultValue 写回草稿，所以不把该 DOM 属性当作确认值 owner，也不只依赖 layout effect。取消 reset 保留原草稿。

解析支持普通小数和指数，不接受千位分隔或 locale 小数逗号。step 以 min（否则 0）为基线，容忍有限浮点噪声；步进封顶到边界内合法格点，空值从 min（否则 0，负 max 时从不超过 max 的合法格点）开始。超出支持范围或无法安全计算步数时拒绝；不承诺任意小数精确性。wheel 不改值。原生额外提供 getDraft()/commit()；需要表单提交前领域验证仍由宿主拥有。

## PasswordInput

value 是字符串；仅显隐在组件内，真实同一 input 在 password/text 间切换，保留 selection，按钮有 showLabel/hideLabel 与 aria-pressed。autocomplete 由调用点明确 current-password/new-password；没有 storage、日志、复制或请求。React 在 pagehide 同步清空 DOM value/defaultValue/隐藏密码并通知 onValueChange('')、onClear('pagehide')；真实卸载在一个 microtask 清空捕获的旧节点并通知 onClear('unmount')，避免 StrictMode 的检查性重挂造成伪清理。原生 pagehide/destroy 同步清空内部值与 DOM 并通知 onValueChange('')、onClear(reason)。宿主必须接受清空并同步删除其受控秘密；组件不能清理宿主拒绝删除的 state，也不能保证浏览器密码管理器、自动填充或内存取证清除。不要把真实秘密用于示例、SSR 初始 HTML、URL 或诊断。独立于 NewPasswordFields 的策略/确认 owner。

## SearchInput

value 字符串受控，clearLabel 默认 Clear search；可选 onClear、onSubmit(value)、clearOnEscape（默认 false）。清除发空值意图并将焦点回输入；disabled/readOnly 不清除。onSubmit 存在时非 IME Enter 阻止原生隐式提交并只通知一次；没有 onSubmit 时保留浏览器表单提交。composition 期间 Enter 不发查询意图，组件不请求、不防抖、不改分页。输入和清除都由宿主发布最终值。

示例：[React](../examples/text-inputs-react/app.tsx)、[原生](../examples/text-inputs-vanilla/app.js)。纯模型/SSR/DOM identity 单测、正式 tarball 正负类型消费及独立浏览器键盘/表单/清理 suite 分开报告；截图覆盖 light/dark/system 与 320/390/1280，真正 200% Chrome Page zoom 使用临时 profile，不用 CSS/font/pinch 代替。受限执行器的 EPERM 不算通过，不关闭 sandbox。真实 hydration、读屏器、OS 密码管理器和移动输入法尚未验证。
