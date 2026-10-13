# Input / Textarea / 原生 Label 基础验收

## 范围与依赖

只核 G1 的公开 `Input`、`Textarea` 和真实 `label.xui-label` / `input.xui-input` / `textarea.xui-textarea`。React fixture 从正式 forms 出口导入；原生 fixture 仅导入正式主题，不加载 React。`xui-field` 只作为既有语义布局壳，未新增或更改 Field owner、受控字段状态机或业务规则。

规范依据：DESIGN 字体角色（正文400，控件/label500）、Input/Textarea 默认/禁用/只读/错误/焦点状态映射、label与describedBy关联、错误边界与focus同时可见、放大文字可达。

旧 native-controls-audit 仍保留：它主要在 React 消费页检查多种原生 type 的皮肤与部分交互，不能据此宣称原生独立 Textarea、只读选取和表单提交语义已经验收。

## 独立消费者与12项回归

`input-foundation-contract.tsx` / `.js` 经独立 tarball 安装构建，依赖范围及CSS来源受 consumers 检查。两端均显示 Input/Textarea × default/readonly/disabled × valid/invalid 共12个真实字段。

三主题各两项：

1. 标签名称与帮助/错误描述关联；真实Tab跳过disabled，readonly保留停靠；Ctrl/Cmd+A验证实际selectionStart/End，输入按键不能改只读值；readonly参与FormData，disabled排除；label点击聚焦适用字段，禁用label用真实指针命中，不通过移除disabled或修改值造证据；editable的合成编辑确实进入FormData并产生对应input事件。
2. 文字角色与独立输入/错误token覆写；1280/390px与根字号100%/200%，所有非禁用字段真实Tab检验focus-visible、公共outline宽/距/颜色，四边位于视口；invalid边界保持错误色，正文不横溢出，原生多行文本不被强制改为单行。

所有值均为明确合成测试文字，不含用户密码或业务数据。选择范围可证明只读仍可选取，**不等于已验证OS剪贴板读写**。本批不请求剪贴板权限、不伪造已复制，也不声称覆盖自动填充、密码管理器、系统输入窗口或全部读屏组合。

## 状态

源码/fixture类型、语法、12项发现已通过；真实安全Chrome运行及截图审查待本批CI。没有本地禁用sandbox绕过执行器限制。生产Input/Textarea实现未因新增测试改变；若出现真实失败先保留图/trace并区分实现偏差和测试假设。

## 首轮安全 CI 与消费者纠正

候选 d3064c9 / CI 38460396345 的12项新增输入测试均在第一个输入框的左侧焦点几何失败：控件边框 x=0，2px outline加2px offset后为-4px。原始失败PNG/trace保留在该run的 focused-interactions artifact（11846890265）。页面只使用 Container（仅最大宽度和居中，不提供内距）；并非使用 Surface 后仍裁切。纠正双端fixture为正式 Surface / xui-surface 包裹表单，使用既有 card-padding；没有私有padding、改Input绘制或放宽四边断言。首轮在此处中断后的readonly键盘、编辑FormData等行为尚未跑完，不计通过，须新CI全部重验。

ba934dd 的第二轮12失败已逐组拆分：语义6项用含空格的只读改值序列触发浏览器Space页面滚动，trace在下一Tab后scrollY继续从21/78增加到760；不是值被修改。序列改为无页面导航键的字母，保留选区、值不变与事件计数。样式6项在首Textarea真实Tab焦点后首行光标可见，整个72px控件底部仍超900px视口37.78125px；没有overflow容器裁切。浏览器编辑焦点只保证光标滚入，相关原理见 [Blink focused-editable参数](https://chromium.googlesource.com/chromium/src/+/e86aa03c91690aa22750fa335ea704bb1c207810/third_party/blink/public/mojom/scroll/scroll_into_view_params.mojom)。测试保留真实Tab和精确focused，记录自然滚入前几何；需要时通过普通鼠标滚轮把完整控件置于可用viewport，再逐边检查所有overflow祖先与视口。没有脚本focus/scrollIntoView或生产滚动劫持；短视口容不下控件应按可达区域验收，此fixture的控件高度均小于视口。原四边断言不放宽，滚动前后JSON作为独立证据。原生readonly Space默认行为不拦截。
