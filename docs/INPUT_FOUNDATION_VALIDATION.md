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
