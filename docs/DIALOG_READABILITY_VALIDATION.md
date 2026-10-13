# Dialog 基础层可读性验收

基线3afbcf5的完整CI成功不代表所有G2合同已验完。本批只处理已有Dialog/Sheet组合、标题角色和库内Key示例的长说明；不改业务权限/写入回执/主题风格，不新增弹层API。

## 已核规范与生产偏差

- DESIGN第946/968条：header使用section-title/600，body内滚、footer可达。旧 `.xui-dialog-title` 只有margin，继承浏览器h2角色；现明确消费 font-weight-heading/font-size-section-title/line-height-section-title/font-sans。
- APIKey双端旧结构为Title、Description、Body、Footer四个直接flex子项。390px根200%实图显示长说明挤占外部轨道，Body被压为细条。说明移入唯一Body，完整原文和唯一aria-describedby指向保持；React使用既有xui-stack，native已有同类。没有将必要风险说明折叠/截断。
- Header/CloseButton已有正式公共出口。Footer Close仍为普通动作；不从普通Close推断它是右上X，不重复注入关闭控件。

## 本批真实浏览器门禁

`dialog-readability.spec.mjs`：2端×3主题共6例，每例覆盖1280×800、390×720根200%、320×480；检查标题token、说明唯一ID/可访问描述、初始输入focus四边位于Body内容盒、footer在viewport内、普通滚轮读取长说明首末行、Esc回原入口且零PUT。截图用完整viewport，保留外环绘制空间。

`focus-boundaries.spec.mjs`既有62例继续执行。原长标题只测标题与X的横向不重叠，未测Body被挤压；本轮补Body至少容纳首个控件及外环、footer可达的强断言。若极端标题或短窗口失败，记录实际图/几何后确定最小公共组合；不通过固定像素高度、裁掉标题、第二说明滚动owner或放宽断言解决。极端短窗口无法同时展示所有动作时仍需整体触控可达方案，不能只凭Esc关闭判定通过。

本地build、362 tokens、类型、523单测与完整独立React/native tarball消费者通过；安全CI尚待本候选。没有真实浏览器结果前不得宣称G2全部可用。Input截图边界与OS/读屏未测继续见基础门禁，不因本批推进删除。
