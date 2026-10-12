# 文字根变量与设计值三轮验收

范围是 xui 公共主题、库自建文字节点、公开消费者示例与防回归门禁；不修改采用产品、部署、业务数据或宿主Markdown/代码阅读样式。本批集成基线为495a14d；此前登录cba215b与焦点修正保持独立历史。本批包含已授权的文字/设计变量、响应式浮层及公共header/locale/slot，合并为一次自洽集成。完整合同以 [DESIGN](DESIGN.md) 为准。

## 第一轮：全面盘点与修复

2026-10-12 首轮审计实际扫描155个源码/示例/文档文件、1326处声明。找到并收口消费层尺寸倍率、混色配方、圆角、无障碍隐藏尺寸、动效中间透明度、示例固定尺寸与SVG呈现线宽。初轮最后两项为原生例子的stroke-width和导航文档的固定blockSize；修复后扫描通过。

新增字体比例font-scale与行高比例line-height-scale，默认1及跟随；七角色仍以rem表达，文字下限0.75rem，行高保持原角色阅读比例。新增集中设计参数保留原默认数值；其后用户明确追加响应式Dialog/Confirm/Sheet宽度，作为单独授权默认变化记录（40%/30%/60%和相应min/max，纵向Sheet高度独立，导航侧栏不改）。库自建日志/状态文本的h3、strong、p与pre补显式语义类，解决浏览器隐式字号/字重/边距；这是针对自建节点的规范收口，不是全局宿主reset，不声称这些原UA样式与之前像素完全相同。

防回归8项独立负例通过，覆盖字面尺寸、变相calc倍率、变量fallback、颜色配方、JSX/DOM/HTML内联、状态更新值、动态模板和断点漂移。源规范逆向SHA256校验、默认角色一致性与已有非文字token保持检查纳入 [contract单测](../tests/contract.test.mjs) 和 [比例单测](../tests/typography-scale.test.mjs)。可运行入口是 [design-value-guard](../scripts/design-value-guard.mjs)，build/check:tokens自动执行，扫描通过不替代视觉验证。

## 第二轮：独立源码与合同复审

2026-10-12 独立审查者已复核比例公式、类型注册、源SHA复原、var消费、门禁负例及结构/运行时例外。补住静态源码中未知var引用、normal字重/行高和thin/medium/thick边框宽绕过；peer测量变量限定到浮层所属属性。扩展文档扫描再发现公开菜单SVG示例两处24px属性，已改为纯viewBox坐标、呈现尺寸继续由slot的var负责。审查者独立验证了负值、0、0.5、0.9、0.95、1、2和超上限的七角色公式；11项守卫测试及3项来源/契约检查通过（补充伪造定义marker、根公开说明与TS泛型解析负例）。本轮是独立源码复审与负例增强，不是重复第一轮grep。

## 第三轮：正式产物与真实浏览器

公共header/slot源码已冻结。正式build、343个token校验、类型检查、209项单测已通过；设计值最终扫描165文件/1346处声明通过。独立tarball原生与React消费者全部通过：70个公开入口/类型、全部示例、Button-only贡献及gzip门限通过；后续冷启动/浏览器执行会话中断，未取得终态，不能称通过，将以精确提交CI补全。新增24项 [token-scaling浏览器测试](../tests/browser/token-scaling.spec.mjs) 覆盖两种正式消费者、七角色、默认与0.95/0.9、小字下限、独立行距、非法输入、边界值、浅深/system、根字号200%、菜单portal、compact/drawer与键盘。

新增28项 [responsive-overlays浏览器测试](../tests/browser/responsive-overlays.spec.mjs) 独立验证1280/1920/390/320四档真实Dialog/Confirm/四方向Sheet及导航宽度，正式React/native fixture通过公开side参数选择方向。

新增14项header-controls浏览器用例覆盖主题/语言/语义slot及compact图标边界，本次完整套件收集368项。收集成功不代表执行通过。

本地完整verify在watch首次代际的30秒测试门限处终止；另一次合法完整开发构建成功耗时82.992秒（user92.908秒、system17.248秒），没有编译错误。保留首次失败记录，不延长门限或重复等待掩盖问题；独立consumer、冷启动、browser继续执行，最终同提交Verify负责核验完整watch链。第三轮截至本记录仍待正式浏览器及精确提交CI终态，前两轮通过不等于三轮完成。

根字号200%是文字放大测试，不是操作系统或浏览器原生zoom。首次本地Chromium在sandbox因socket权限于断言前失败；不能算浏览器测试失败断言或通过。后续完整验证已获准使用浏览器所需进程socket。真实读屏器、移动OS及Safari/Firefox不在本轮通过声明中。

### 首次精确提交CI与修复

[1929546 Verify](https://github.com/coffeehc/xui/actions/runs/38249852388)已实际完成完整build、343 token/类型、209单测、watch、双tarball消费者及Vite冷/暖/显式依赖回归。真实Chromium为366/368通过：24项文字根、14项header/locale/slot全过；百分比浮层27/28过。两项失败原样保留在该run的validation附件：React基础消费者旧静态头部与新公开头部不一致，导致首次挂载主按钮下移5px；原生导航dialog仍继承UA margin:auto，宽288px正确但390px下x=59px、纵向居中。

修复公共AppShell的旧header映射：私有稳定Frame将旧Fragment完整置于primary legacy区，不套brand样式；基础消费者故意保留旧Fragment并配套同结构首屏，保留小于1px的稳定性断言，追加桌面/窄屏头部高度及legacy结构检查；仅导航抽屉清零结构margin，保留普通Dialog居中、全部宽度合同，并追加y=viewport inset断言。独立实际查看了失败截图以及React窄屏0.9/200%根文字、原生320px Dialog和1920px顶部Sheet截图；与通过项CSS像素证据一致。修复提交仍须新的精确CI全链通过，不用首次366项成绩代替最终验收。

修复后源码守卫再次覆盖165文件/1351声明，文档27文件/499链接/70入口通过；私有Frame的独立source bundle编译与静态渲染断言通过，实际diff经独立复审无阻断。原本地修复代际build/typecheck/19项快测已完成；后补legacy源的最终正式生产构建与浏览器由新提交CI执行，不混称旧dist已验证新源。
