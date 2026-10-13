# CheckboxGroup 与 RadioGroup

正式 React `@coffeehc/xui-react/choice-group` 和原生 `@coffeehc/xui-runtime/choice-group-dom`。共享纯模型来自 `@coffeehc/xui-runtime/choice-group`。均从 root 导出。复用 Fieldset/Checkbox/Radio 的原生语义和 forms.css，不新增皮肤或权限后端。

两端 options 是唯一 key 的 `{key:string,label:string,disabled?,readOnly?}` 数组；label 是安全文本。legend 必填；name/help/error/disabled/readOnly/required 可选。CheckboxGroup 的 value 是 readonly string[]，RadioGroup 是 string|null；onValueChange 只发意图，宿主必须回传 value。拒绝/延迟更新不改变已确认值。React 接受原 fieldset DOM props/ref；原生 createX(host,options) 返回 element/update(partial)/destroy()，每个 host 唯一 owner，destroy 可重复且恢复原内容（宿主自行替换内容时不覆盖它）。更新文案/回调/选值保留同 key 节点；删除焦点项回到剩余第一个可用选项，不抢外部焦点。

CheckboxGroup 显式 selectAll 字符串开启全选；只选择当前 options 中非 disabled/readOnly 的全集，不代表跨页查询全部结果。全选/清空保留未知及不可编辑 keys。部分态由同一 value 计算。未知值显示非 live 诊断并保留，不擅自清理权限。name 只赋给实际选项，全选不提交；未知值不创造隐藏表单字段，宿主必须使用受控 value 处理未知权限。

required 复选组表示至少选择一个当前已知选项，通过首个可用输入的原生 customValidity 实现，不要求每项都选；零项/全 disabled 没有可验证输入，业务必须明确处理不可填写状态。只读组不阻止原表单提交。单选组使用同 name 真实 radio，浏览器负责方向键和组级 required；未给 name 时产生组内唯一名称，宿主不得给两个独立组同一 name。被选中的 readOnly 单选项锁定整组，防止另一选项隐式取消它。只读不移除表单值或焦点，disabled 继续遵守浏览器表单排除规则。原生 form reset 后恢复最新受控事实，不发业务变更；宿主需要清空应显式发布新 value。

示例：[React](../examples/choice-group-react/app.tsx)、[原生](../examples/choice-group-vanilla/app.js)。独立打包/正负类型消费纳入 consumers；纯模型、DOM identity 与 SSR 单测并非真实浏览器、hydration、读屏器验证。真实键盘、required、FormData 和焦点回归由 choice-group browser suite 验证；受限执行器不得关闭 sandbox 来运行。
