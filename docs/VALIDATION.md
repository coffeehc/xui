# 验证证据与限制

## 模型具体失败原因与版本冲突（4.2.44，2026-10-27）

基于main 0fd9efc/4.2.43复核后，只修改xui的ModelProfile反馈，三包及规范只递增末位。BaseService安全summary合同引用56cd27a142563acdea71077723e2ba256f2edf8b及7a2688e60fd9f51a23984e0d945c08bbbb9da0e4；本轮不访问真实上游或模型数据。passed:false的正式有界summary用于失败Toast，并自动展开持续result；空白回退，HTML按纯文本显示，成功Toast仍本地化。HTTP502等原始message不透传。新增可选errorReason和五个可翻译labels，旧完整词典/自定义state保持类型兼容。

Catalog/Test/Save的已确认409/40900显示版本冲突，保留草稿、ID/CAS、六星号和Headers编辑事实，Save冲突不归unknown；没有自动读取/保存。Toast仅在显式点击重新读取时调用原load，旧对象/草稿变化后旧动作失效。网络、预算超时、响应解析与明确取消区分；后端504合并“取消或超时”不猜具体原因。取消读取不制造失败Toast，未确认的保存继续沿save_unknown/receipt边界。语言热更新不重新请求，进行中动作完成用当前labels；新模型先目录冲突再触发其他动作本地校验，仍准确聚焦必填字段且零请求/零重复Toast。

最终sourceGeneration：`49b5beda902180462bf002aa9169ec3f0917298af340e877f6c3688658c9c928`。build、typecheck、446 Token/指纹/依赖图通过，CSS与默认Token值未改。定向Node **43/43通过，0失败/跳过**，包含ModelProfile/保存回执/请求合同/文档与规范回归；本轮未重跑全仓Node。独立正式三tarball的ESM/CSS/types与115入口消费通过，React/ReactDOM19.2.8、Base UI1.7.0单实例，无packages/src alias或体积预算放宽；正式安装的types fixture验证旧词典/state兼容与新reason/labels。

最终Chromium **51/51通过，0失败/跳过/重试/flaky**：新增反馈专项17项，原策略8项、原模型26项。覆盖具体summary、空白/超限/HTML、成功本地化、三入口冲突、CAS/密钥/Headers保留、仅显式重读、单Toast、迟到/取消/保存未知与提交回执、同Controller语言变化、必填回焦。包含light/dark/system桌面与390px+200%阅读长中文，以及三主题真实Chrome200%下的Sheet操作、Toast动作和关闭回焦。两种缩放分别断言。人工查看浅色桌面与深色窄屏200%截图；其他模式保留截图和自动交互/几何证据。

过程记录：首轮50项中观察到4条测试交互失败后中断（exit130），一条把按钮引发的正常滚动误当布局位移，三条未关闭Combobox弹层便点击高级配置。测试改用文档坐标/同节点检查与Escape关闭弹层；首轮仅保留日志和当时诊断观察，中断未生成JSON，后续运行前未成功保留其trace/截图，不宣称这些原始证据仍在。修订后第二轮50/50通过，对应旧generation ce57c6b35f16；随后代码复核修正跨操作旧错误挡住必填回焦的顺序并增加一项用例，重建正式包后完成上述最终51项。两轮通过报告分开保留，不合并为同代验收；未用force click或retry绕过。caffeinate仅随浏览器进程存在。

证据：[checks.json](../.artifacts/model-feedback-4.2.44/checks.json)、[最终正式包浏览器报告](../.artifacts/model-feedback-4.2.44/browser-final.json)、[过程记录](../.artifacts/model-feedback-4.2.44/process-history.json)、[截图索引](../output/playwright/model-feedback-4.2.44/evidence.json)。复现：`pnpm build && pnpm check:tokens && pnpm typecheck`；`node --test tests/model-profile*.test.mjs tests/docs.test.mjs tests/contract.test.mjs`；`pnpm test:consumer`；`caffeinate -i pnpm exec playwright test tests/browser/model-profile.spec.mjs tests/browser/model-profile-policy.spec.mjs tests/browser/model-profile-feedback.spec.mjs --workers=1 --retries=0`。本地提交后由既有archive/archive:verify自动绑定三包、manifest、public-api.json、sourceGeneration与SHA256SUMS。

未跑全仓unit/browser/watch/cold-start、真实后端/上游、AgReady等消费项目升级/实际页面/88.7部署、Firefox/WebKit/移动OS/读屏器。库mock不能证明消费项目已显示真实上游原因或现场409；未修改AgReady、AgentCore、BaseService或实际模型配置，未发布npm、打tag或部署。

## API Key 官方 v3 列表复制接线（4.2.43，2026-10-27）

承接下方4.2.42文档待办，BaseService已交付 `f66724f44b5825143614ca2a9f2e0b15f3f3e140`，本轮只修改xui；原严格v2与默认schemaVersion=2保留。显式3提供逐行secretAccess与adapter.keyCopy，可直接传给原ApiKeyManager；POST secret精确携带expected_version，无query，严格验证响应schema/ID/版本/完整值与16384字节预算。无权/哈希/未知能力不发读取；expired/disabled/revoked的recoverable记录由原后端独立授权，不能按状态推断。现有Controller/分页/CRUD/CAS、权限/认证与ClipboardService/Toast owner保留，没有改动或轮换任何密钥。

秘密读取使用HTTP/Auth内部的仅当前访问凭据策略，不新增公开token getter、认证端点或owner。缺凭据零网络失败，401清理当前身份且不触发refresh/session/login或重放；普通HTTP恢复行为保持。读取期间身份代次改变、销毁或到期丢弃旧值；React对同版本权限变化也立即取消等待。错误不透出原始message/body。正式mock示例 `/api-key-react/?official` 使用同一HttpClient/Auth和真实v3 adapter，不绕过为宿主私有reader。

最终sourceGeneration：`ef3a556cfacea620c7887204bf80ac1c4efb53ddcf137d8e8af7f15fa4c70f08`。build、typecheck、446 Token/指纹与依赖图通过；CSS和默认Token值未改。完整Node **701/701通过，0失败/跳过**；包含新增8组v3用例、原v2、实体编码和全部HTTP/Auth回归。BaseService两份各21案例的decimal/hex fixture逐字节引入，SHA分别为 `860c76a1a8fe16359b42926a81850fa304d19574103a248039ad8ac63a629c78`、`c86ed83cc1c27c8760ba2cf2b0065bc2cb44f33f72c6b4f9f772d6333b82c256`；前端核对CRUD及秘密成功/失败请求响应，重复原始JSON版本字段的400案例由后端执行，前端只验证fixture结果并始终发单字段规范body，不冒称前端发送了重复JSON。

最终独立正式三tarball的ESM/CSS/types与115入口消费通过，React/ReactDOM19.2.8、Base UI1.7.0单实例；无packages/src alias，无体积预算放宽。新增公开types fixture覆盖v3配置、能力与直接keyCopy接线，未知版本/错误能力类型拒绝。公共操作逐项门禁增加KEY-SECRET-REQ/OK/ERR，并同步KEY-COPY-004～007与17项操作清单；历史16项锚点保留跳转位置。

最终Chromium **27/27通过，0失败/跳过/重试/flaky**：新增官方v3十二项及原API Key/v2十五项。覆盖指针/Enter/Space各一次、不可复制禁用、busy防重、权限/版本变化/卸载取消、迟到零剪贴板、失败无自动重试/认证恢复、状态无secret、刷新保行、六组实际light/dark/system桌面/390px+200%阅读、system媒体热切换，以及三模式真实Chrome200%缩放。两种缩放分别断言，不互相替代。截图已查看浅色桌面/窄屏与深色窄屏；完整值只经合成writer布尔比对，不出现在截图、状态或反馈中。

过程保留：首轮定向Node **63/64**，失败是测试用includes空字符串检查秘密泄漏，运行时已按预期拒绝空secret；修正该断言后专项8/8，最终完整701/701。首轮浏览器27项交互均通过，但截图发现URL的mode未配置实际主题，因此不计为三主题验收。测试改用公开ThemeOptions并断言data-theme/effective和system热更新后，完整27项再次通过；没有修改CSS、force click、放宽断言或使用retry。前后报告分别保留。两轮浏览器仅进程生命周期使用caffeinate，结束即释放。

证据：[checks.json](../.artifacts/api-key-v3-4.2.43/checks.json)、[正式包浏览器报告](../.artifacts/api-key-v3-4.2.43/browser-final.json)、[截图索引](../output/playwright/api-key-v3-4.2.43/evidence.json)；同目录含build/typecheck/tokens/unit/consumer日志和首轮报告。复现：`pnpm build && pnpm typecheck && pnpm check:tokens && pnpm test:unit && pnpm test:consumer`；`caffeinate -i pnpm exec playwright test tests/browser/api-key-v3.spec.mjs tests/browser/api-key.spec.mjs tests/browser/api-key-v2.spec.mjs --workers=1 --retries=0`。本地提交后通过既有archive与archive:verify自动生成、复算manifest/public-api.json/sourceGeneration/SHA256SUMS。

未跑真实后端/PG/KMS、真实OS剪贴板、消费项目升级/页面/部署、Firefox/WebKit/移动OS/读屏器、整仓browser/watch/cold-start。库mock与正式包验收不能证明xLead或其他产品已支持复制；历史FormatHashOnly始终不可恢复。未修改BaseService或其他消费项目，未发布npm、打tag或部署，也未向其他项目发送消息。

## API Key 列表复制官方接线复核（2026-10-27，合同待补）

本轮只补文档，不修改公共实现、类型、CSS、demo 或包版本。xui main `60ad071a921513487fbb9c12a38822cb09f66fce` / 4.2.42 已同步远端；BaseService 只读工作区与远端 main 均为 `01fc2c00b38a2a254aa3247968bad3e23a264f6a`，从来源 `3b5ec890` 至该提交的 apikeyservice 无差异。核对核心 Service/impl 的 GetSecret、FormatRecoverable/FormatHashOnly，及 webfacade 的 Register、Service、Action、Metadata/Capabilities：核心读取已有，facade 未公开读取路由或逐行复制能力。xui 正式 `/api-key-http` 类型只有严格 v2 CRUD/getConfiguration，无秘密 reader；React 现有 readValue/canCopy 不替代该合同。精确待办与依赖状态见 [维护项](PUBLIC_REQUESTS.md#api-key-列表复制的官方读取合同2026-10-27待-baseservice)，接入增加 KEY-COPY-004～005。

定向 `node --test tests/docs.test.mjs tests/api-key.test.mjs tests/api-key-v2.test.mjs` **19/19 通过**，`git diff --check` 通过。复算当前构建输入 sourceGeneration 与已验收正式包相同：`2645e40f34cea6d78c01448e611eda0394f86a6f94f2e0b316739532e2a13def`。`pnpm archive:verify .artifacts/public-60ad071a921513487fbb9c12a38822cb09f66fce` 独立校验通过，保留三包4.2.42、115个正式入口和55项校验；SHA256SUMS 摘要 `9d546c254bf2255424d466006a3da806251395ce0131fd8078da60fdb6f93d68`。本轮复用该固定包，不为未实现的 reader 发布新版本或覆盖旧归档；归档与本次合同补充提交分别标识。

没有修改视觉/交互或构建输入，未重复浏览器、全量unit、build/typecheck/consumer；4.2.41已有布局/合成复制的库级证据继续按原记录引用，不算本轮产品验收。未执行真实BaseService读取、xLead升级/页面、系统剪贴板或部署验收，未访问真实密钥，未转发消息。官方列表读取仍阻断，历史哈希记录仍不可恢复；本节不将本轮文档完成写成复制链路完成。

## 模型策略实际值与宿主必填规则（4.2.42，2026-10-26）

仅修复 xui ModelProfileForm/Editor 及同一 Controller 的策略展示/校验，基于 main d27f1ba 三包递增至4.2.42；未修改 AgReady、AgentCore、BaseService、真实模型记录或部署。初始公开源码中 policyNumber 缺值和推理强度空选项均使用 providerDefault“协议默认”，本轮改为明确“未配置，请填写”/“未指定”。当前具体值直接展示，0容量保留原值并提示无有效容量，none与未指定区分；不把通用defaults回填为现有记录生效值，不猜160000或medium/high/none。后端未提供真实上下文/强度时只能保留未知、由宿主要求填写；已有editor API可表达明确值，无需新增端点或前端适配层。

新增可选requiredPolicyFields（max_context_tokens/max_completion_tokens/reasoning_effort）归原Controller，默认[]保持已有可选操作。仅聊天test/save校验必填tokens为正安全整数、强度为非空字符串；catalog不受阻挡，向量/图片不套聊天规则。错误绑定公开Field并回焦。规则update保留原草稿与原owner，零请求且不取消已发操作；load/reset/clear仍按原生命周期处理草稿/取消，但保留宿主必填规则；后端继续独立验证。原HTTP DTO、认证、patch/六星号密钥/凭据清理和保存回执不变。新labels可选、旧完整labels和旧自定义state类型有正式fixture兼容检查；策略不再使用旧providerDefault文字。合同同步到随包README、PUBLIC_API、COMPONENTS、ADOPTION及MODEL-009～010。

最终sourceGeneration：`2645e40f34cea6d78c01448e611eda0394f86a6f94f2e0b316739532e2a13def`。build、446 Token/指纹/依赖图、typecheck、定向Node **40/40**、正式独立三tarball ESM/CSS/types消费通过；全部115公开入口和React/ReactDOM19.2.8、Base UI1.7.0单实例核对通过，无packages/src alias，体积门禁未放宽。最终Chromium **34/34通过，0失败/跳过/重试**，其中新增策略专项8项；覆盖配置/模板值直显、不猜fallback、未指定/none、宿主必填、零无效请求、同Controller/草稿、错误关联/焦点、键盘选值及返回、labels热更新、只读/禁用、Sheet、三主题/390px/200%阅读/长中文和三种模式真实Chrome200%缩放。六张新状态截图已查看，索引含尺寸/哈希。Token与CSS默认值未修改，本轮未重跑整仓unit/browser、watch/cold-start、其他引擎或真实后端；库mock通过不代表AgReady已升级或实际模型参数正确。

首轮同代并发浏览器记录为29通过/5失败（超时、teardown、目录/初始化等待），未计入最终通过。只读观测到19:26:25～19:27:03的OS休眠与最后一条Zoom超时重叠，且当时系统负载较高；不能因此断言全部失败都由休眠造成。保持源码和断言不变，单worker复验34/34通过；仅测试进程生命周期使用caffeinate -i，退出后已释放，没有修改系统配置或终止其他任务。首轮compact/失败trace、环境观察与最终报告均保留。

证据：[checks.json](../.artifacts/model-profile-policy-4.2.42/checks.json)、[最终浏览器报告](../.artifacts/model-profile-policy-4.2.42/browser-policy-final.json)、[截图索引](../output/playwright/model-profile-policy-4.2.42/evidence.json)。可复现命令：pnpm build / check:tokens / typecheck；node --test tests/model-profile*.test.mjs tests/docs.test.mjs tests/contract.test.mjs；pnpm test:consumer；caffeinate -i pnpm exec playwright test tests/browser/model-profile.spec.mjs tests/browser/model-profile-policy.spec.mjs --workers=1 --retries=0。正式归档继续由pnpm archive和archive:verify自动生成并核对manifest/public-api.json/sourceGeneration/SHA256SUMS。


## 4.2.41 整体定版回归（2026-10-25）

用户认可本轮统一 demo 和公共组件后，合并 main `d67ec1d5bc7ced4049678750da849e83ed7059e8` 以来的全部预览改动，三包只递增末位至 **4.2.41**。本节为定版结论；下方各“候选/未定版”章节是过程记录，不能替代最终正式产物证据。

统一入口 `/pages-react/` 包含七类内置完整页和十二个基础入口（含图表），沿用既有 Controller、Resource、请求和认证 owner。正式增加 Breadcrumbs 的具名组合、按需溢出菜单，以及 CarouselController / React Carousel；API Key 独立列，可选 keyCopy、locale/timeZone、rowActions 和通知 Controller。图表计算按需引入 D3 array/scale/shape，开放直线/单调平滑/阶梯，统一默认900ms；可关闭、尊重减少动态效果、缺失断线、读原值，刷新不重放首次绘制。Progress/meter 同厚；刷新按钮闲置文字居中、忙态含 Spinner 且尺寸稳定；复制临时反馈走 Toast，SimpleSelect 增加可选 placeholder，结构化日志的空多选可翻译。

本轮整体回归额外修正四类公共实现：根入口共享 Button 初始化被 tree shaking 裁掉；导航展开后的分支/行尾动作没有作为整体换行；紧凑页脚被动图标横排偏轴；AppShell 父级布局投影前滚动导致当前行在展开后被页脚裁掉。导航只在确认的状态变化后按最终几何定位当前行，悬停展开保持原滚动位置。独立 MetricCard/Input 示例接回唯一主题 owner，system 随媒体热更新。没有复制 peer 私有 DOM、叠加查询/认证 owner 或要求宿主覆盖私有 CSS。

最终 sourceGeneration：`956cc65ef0d3b5e511843268baeb757b69c3bd11c297b6b720213822074d49fa`。`pnpm build`、446 Token/依赖图检查、`pnpm typecheck`、Node 单测 **689/689**、`pnpm test:consumer` 通过。正式 ESM/CSS/types 和全部115入口从独立三 tarball 安装消费，无 packages/src alias，React/ReactDOM19.2.8、Base UI1.7.0 各单实例；根 Button 真实交互正常，Button/窄服务和统一基础入口不带 D3。体积/依赖图门禁未在本轮整体回归中放宽。watch 使用当前工作区原位探针验证启动、增量、失败不发布和修复恢复，源码已恢复，无额外源码副本；不运行会复制完整源码的旧 test:watch fixture。冷启动 通过1/1（Vite默认冷/温、显式入口三种配置；未配置时的冷优化重载与声明入口的零重优化分别记录）。

完整 Chromium 套件：**2,331通过、2条时序失败、2个条件跳过，0重试/0 flaky**。两条失败分别为：菜单用例在自动焦点进入前发送 Home；Popover 用例在宿主 accept 配置尚未 commit 前发送 Escape。trace 与示例调用链均已定位。测试分别等待真实焦点/已提交的宿主配置（示例只补 getAccept 观察入口），未修改公共源码。修订后 **两个完整文件53/53通过，原失败用例各20次、共40/40通过，均0重试/0跳过/0 flaky**，原全量失败与定向复验分别记录，不合并成一次全绿。统一 demo Chromium CLI 另通过 **433 项断言 / 57 组**（11组基础组件×3主题、7页×3主题、3组图表），覆盖1600px桌面、390px/公开200%阅读、长中文、焦点、弹层滚动和真实指针命中；图表900ms开关/更新不重播与原值检查通过。导航另有13项几何/滚动检查，根入口 Button 操作也通过。全仓专项覆盖真实 Chrome200%缩放、根字号200%、light/dark/system、forced-colors、reduced-motion和键盘；两类缩放分别记录，不相互代替。已查看最终统一页面、表单、按钮、嵌套弹层与真实zoom截图。

未执行的两个条件用例：未启用真实系统剪贴板显式 opt-in；未设置旧4.2.13布局基线的历史缺陷复现。它们不计入通过数。此前全量/专项的中间失败已单独保留，含旧尺寸/结构断言和上述实现缺陷；修正后完成整体回归；两项时序测试修订按受影响范围复验。本轮修复和 demo 使用真实指针/键盘路径，不以 retry 或 force click 绕过缺陷。首轮统一 demo 重排探针曾在响应式布局完成前采样；最终等待目标净宽后再次完成全部33组基础检查。无未解决的适用失败项。

可复现：`pnpm build && pnpm check:tokens && pnpm typecheck && pnpm test:unit && pnpm test:consumer`、`node .artifacts/release-4.2.41/watch-current.mjs`、`pnpm test:cold-start`、`pnpm exec playwright test --workers=2`；统一demo的三个 `*-probe.js` 用 Playwright CLI `run-code --filename` 执行。最终统计见 [checks.json](../.artifacts/release-4.2.41/checks.json)，详细最终报告和CLI探针位于 `.artifacts/release-4.2.41/`、[统一demo证据](../output/playwright/release-4.2.41/)。本地提交后按 `pnpm archive` 自动归档，并以 `pnpm archive:verify` 复算 manifest、public-api.json、sourceGeneration 和 SHA256SUMS，再正常推送 main。

兼容性：新配置均可选；既有请求、分页、权限、DTO、密钥提交和认证行为保持原合同。默认视觉差异为进度条、刷新动作、API Key列宽/日期展示与导航排列，宿主升级后仍需按受影响范围验收。示例数据/API/剪贴板 writer 为合成mock；未验真实后端、移动OS/读屏器、Firefox/WebKit、消费项目升级或部署，未发布npm，也未修改其他项目。


## 内置页面统一 Demo（2026-10-24，候选预览，未定版）

在 main `d67ec1d5bc7ced4049678750da849e83ed7059e8` 基础上连续开发；用户要求先看 API Key，再追加统一内置页面 Demo，认可后定版。本轮改动保留在工作区，没有提交、推送或新建正式归档。三个候选包文件标记为 4.2.41，不能视作已发布版本。

入口 `/pages-react/?page=api-key&mode=light`，包含 API Key、业务日志、结构化错误日志、模型配置、登录、管理员初始化和修改密码。复用各独立正式包示例，以同源 iframe 隔离页面实例；嵌入模式省略示例自己的 Shell，实测七页均无重复 Shell。每个文档继续使用自身唯一 React peers 和既有 Controller；偏好消息只同步主题、配方和阅读比例，不重载当前表单或传递凭据。演示控制位于侧栏底部，窄屏移入同一导航抽屉。

首轮 API Key 候选曾把安全前缀移到名称下方；根据后续反馈，当前已恢复独立 API Key 列，安全前缀仍为可辨识片段加掩码；时间按 locale/浏览器时区展示到分钟，点击保留原始 ISO 完整精度。权限、状态和操作列明确分配净宽；窄屏操作列随表格横滚，避免固定列遮盖名称。复制演示只使用固定合成凭据；哈希不可恢复的样例禁用复制。keyCopy 提供可选的授权读取回调及启停，默认被动展示；rowActions 仅是候选展示扩展，不构成秘密读取协议；真实列表复制仍依赖正式后端能力和授权合同。未修改其他项目或连接真实后端。

首轮候选 build（441 Token/依赖图）、typecheck、正式三 tarball ESM/CSS/types 消费、11 项规范/文档测试通过；sourceGeneration=`df81ddc467cee69a67220eba165e9d630232bc8a5fe2bc0a6b04858e4dbb7cc4`。React/ReactDOM 19.2.8、Base UI 1.7.0 各单实例，无源码 alias。关键 CSS gzip 23092 bytes；刷新修复最初测得 23080/23040 超限，预算仅有界增加 64 bytes 到 23104，其余门禁不变。Token 元数据和测试更新至本轮候选；原规范测试仍硬编码 4.2.38，已改为核对实际包版本，保留 Token 修订和指纹校验。

首轮真实浏览器已验证七页导航、合成密钥复制的完整文本布尔比较、不可恢复样例禁用、创建后关闭弹窗进入列表、编辑保存、主题切换保留编辑草稿。浅深色截图等待有限过渡完成；390px/200% 阅读下父文档和预览均为 390px、根字号均为 32px，无整页横向溢出，导航末项可达，比例可恢复到 100%。已查看最终截图。汇总与首轮对照图见 `.artifacts/pages-gallery-preview.json`、`output/playwright/pages-gallery/review-1/`。

追加预览包括十组基础组件导航、API Key 独立列与点击复制开关、Progress/密码强度 meter 共用 progress-height=4px 与 progress-radius=0。根字号放大时共同继承缩放，不再使用满圆角裁剪细轨道。该阶段验证单独记录在 review-2，不覆盖首轮截图和 sourceGeneration。 第二轮 build 的 443 Token/依赖图、typecheck、25 项规范/文档/API Key 回归及正式独立三 tarball 消费通过，sourceGeneration=`f7d7ac20fdfd6b050e73ba06c7080179f9a9005c188ade8b7f87d15724487d79`；React/ReactDOM/Base UI 各单实例。CSS gzip 23116，公共进度几何相对上一预算有界增加 64 至 23168，其余门禁不变。

第二轮浏览器：十组导航均无重复Shell；独立API Key列、完整合成值的点击/Enter/Space复制、不可恢复项禁用及配置关闭/保留Controller通过；上传合成文件零后端请求；Dialog/Sheet Escape回焦、主题切换保留密码草稿通过。Progress及meter普通4px、200%阅读8px，均为0圆角；system随浅/深媒体切换通过；390px/200%父子文档均宽390/根字号32px，无整页横溢出，末项导航可达。已查看浅色API Key、管理员强度条、进度样例、深色按钮及窄屏200%最终截图，见`output/playwright/pages-gallery/review-2/checks.json`。发现示例遗漏正式floating.css导致Toast异常，已补齐API Key及两类日志示例的公开CSS；首个iframe探测发生在consumer生成尚未完成时，等待产物后重载通过。窄屏最终截图等待Drawer退出及有限过渡完成。上述仍为候选预览冒烟，不替代完整发布矩阵。

刷新按钮的较早独立阶段先用正式 4.2.40 复现闲置文本偏右 11px，修复后 30 个定向浏览器用例通过（三类管理页、三主题、1280/390/320、200% 字号及三模式真实 Chrome 200% 缩放）；该阶段 sourceGeneration=`c9adfe97d001b65f3dc670b5406fa94afa331fa620a3ffc2342a1e5cfff0c0cc`。后续加入 API Key 排版和统一 Demo 后执行上述预览检查，没有把较早 30 项冒充最新候选的完整浏览器矩阵。

预览中，移动侧栏 SimpleSelect 的选项名称定位一次未命中，可见选项存在；归因尚未独立复核。演示比例改用更适合四档固定选项的公共 ToggleGroup，已验证窄屏点击和回落比例；本记录不宣称原选择器问题已修复。未运行最新候选的完整发布级 unit/browser、全部页面所有状态、真实浏览器缩放矩阵、Firefox/WebKit、真实后端联调或消费项目验收。用户确认视觉后继续收口公共合同和必要回归。

第三轮仅在“按钮与操作”追加前置图标、后置图标、loading及禁用的图标文字组合，复用公开Button/Icon/Spinner，不更改公共组件、Token或版本。沿用已安装正式包定向重建demo及严格类型消费通过；真实浏览器验证图标位置、点击/Enter计数、busy/disabled和Spinner，浅深色及390px/200%阅读无整页横溢出。截图和结论见`output/playwright/pages-gallery/review-3/`；没有重跑完整发布套件，仍未提交推送或定版。

第四轮将其余九组基础组件统一为“常用组合＋适用状态对照”，演示范围见 [接入手册](ADOPTION.md#内置页面对照-demo候选预览)。按 demo 面板拆分 inputs、containers、overlays、menus-media、collections，均复用公共 ESM/CSS/types；保留原独立完整交互示例链接。不改公共组件、接口或版本，不将不支持的状态强塞给组件。QueryForm 的重置只清草稿，已生效条件保持；GroupedCombobox 按公开合同由 demo 显式持有 query/filter；CardGroup/DataTable/Chart 同范围刷新保留已确认节点；上传复用 UploadService/Controller 和严格限定路径的 mock HTTP。

项目 typecheck、当前独立 tarball 安装的严格类型消费及两入口定向打包、2 项文档检查通过；公共包继续为前述同一 sourceGeneration，不生成新归档，不冒充重新执行完整 consumer 流程。首轮类型检查找出 demo 使用了不存在的 SortButton.direction、遗漏 GroupedCombobox.inputValue，已按公开 props 修正；浏览器脚本按实际 spinbutton/checkbox 角色和当前 popup 缩小定位范围后通过，没有 force click 或组件补丁。

真实浏览器覆盖浅色桌面、深色窄屏 390px/200% 阅读；九页最终均根字号32px、clientWidth/scrollWidth=390，无整页横溢出。只读文本/选择组、禁用项、错误关联、真实 Select 指针选择、草稿重置/已生效保留、右键键盘入口、Dialog/Sheet 关闭回焦、上传等待/取消/成功/失败/校验、复制等待/失败、表格排序分页/只读、图表独立错误恢复与保图通过。最终新面板导航没有 pageerror，实际 API 网络请求为0。已查看表单、上传、卡片、两列图表及窄屏错误Dialog/专用输入截图；Dialog在200%净宽324px，无横溢出。原始结论与截图为`output/playwright/pages-gallery/review-4/`。仍未跑完整发布矩阵、真实浏览器缩放、跨引擎或真实后端/消费项目验收；未提交、推送或定版。

第五轮补齐完整 Breadcrumbs 与 Carousel 公共组件，并与折线/柱状/饼图一起进入统一 demo。Breadcrumbs 沿用 navigation 入口，兼容旧 children 组合，新增完整 items、当前项、禁用、长路径省略菜单与具名部件。Carousel 的纯 TS runtime Controller 只管理稳定 ID、受控确认和播放意图；React View 管理焦点、暂停计时与可替换 controls/renderItem/状态槽，不增加业务请求 owner，也未恢复原生 UI 实现。统一展示现为七类内置页、十二组基础组件。仍为 4.2.41 候选，未提交、推送或归档定版。

最终 sourceGeneration 为 `8c5743c6f240e01d980eee43e77a8a0098ccdb51b99d5f3d935b6efe8021f300`。`pnpm build`（445 Token、主题图与设计值审计）、`pnpm typecheck`、53 项定向 Node 检查与 `pnpm test:consumer` 通过。独立安装真实三 tarball，全部 ESM/CSS/types 与正负类型例通过；React/ReactDOM 19.2.8、Base UI 1.7.0 各一份，无源码 alias。公共 entry/slot、可选 carousel.css、规范、接入文档与 BREADCRUMB/CAROUSEL 逐项清单一致。

首次消费者曾在初始图及图表 JS 预算失败。省略菜单现为需要时加载的独立模块，新增组合已标明无副作用供 tree shaking；原始 bundle 中共享 Base UI selector 初始化仍增加约4KiB，JS 门禁有界增加8KiB至161792，其余 Button/窄服务/图表CSS预算不变。最终 foundation 初始 JS gzip 147536，图表 156239；关键 CSS gzip 23234，新增导航/走马灯公共规则将上限有界增加128至23296。没有用失败运行代替最终同代通过。

最终同代 Chromium：51 项交互检查及18组浅/深/system×三面板×桌面/390px与200%阅读缩放几何检查通过，另验证 system 实时跟随与窄屏省略弹层。覆盖真实指针与键盘选项、Escape回焦、禁用、语言更新；轮播前后/指示器/RTL/受控定位、当前指示器可聚焦但不重复执行、inactive inert/aria-hidden、输入箭头不误切换、草稿/节点与最大内容高度保持、初次错误重试/刷新失败保留/只读/禁用/单项/图片加载和注入Controller销毁。页宽与scrollWidth均为390，父子根字号均32px；弹层在iframe视口内，操作可达；零pageerror、零真实API请求。

浏览器曾发现首次指针“暂停”在焦点进入先停止后又被click反转的问题，现保存按下时的播放动作，键盘仍按当前状态执行。Playwright Clock 验证首次暂停、显式恢复、悬停暂停/离开恢复、焦点停止、Space恢复、减少动态效果及手动切换通过；文档隐藏用合成visibilitychange验证，触屏分类使用合成PointerEvent，不冒充真实后台标签调度或触屏设备验收。截图等待有限弹层/主题/布局过渡后取得；早期即时断言与过渡帧未计为最终证据。

原始结论、同代包SHA及可复现CLI probes见 [review-5/checks.json](../output/playwright/pages-gallery/review-5/checks.json)，预览索引为 `.artifacts/pages-gallery-preview.json`。已查看[统一走马灯](../output/playwright/pages-gallery/review-5/gallery-carousel-light.png)、[统一图表](../output/playwright/pages-gallery/review-5/gallery-charts-light.png)、[面包屑](../output/playwright/pages-gallery/review-5/breadcrumbs-light.png)、[深色窄屏省略菜单](../output/playwright/pages-gallery/review-5/breadcrumb-menu-dark-narrow-200.png)与[深色200%轮播](../output/playwright/pages-gallery/review-5/carousel-dark-narrow-200.png)。复现可用 `playwright_cli.sh run-code "$(cat output/playwright/pages-gallery/review-5/auto-probe.js)"` 等相应probe，先打开其指定demo入口。未运行全量发布unit/browser、Firefox/WebKit、真实浏览器200%缩放、读屏器/真实触屏、真实后端或消费项目验收；本轮只改xui，不宣布消费项目已升级。

第六轮将图表计算内核切到按模块依赖的 D3：d3-array 3.2.4、d3-scale 4.0.2、d3-shape 3.2.0。范围/刻度/归一化、分类坐标/柱宽/指针分区、折线/点形/饼和扇区路径走同一计算职责；React继续拥有SVG、键盘、焦点和测量生命周期。原React props、runtime返回合同、Token、CSS、Card/DataRegion/DataTable slot与Resource请求owner保持。公开API清单SHA与第五轮相同，均为 `ae6abc9d62ea4739e51c2cf0e01b847544f7a03130e9a966740ff61a1347fbfe`。刻度步长与nice边界可能变化，原值/零基线/缺失语义不变，横轴仍是等距类别，未新增时间/堆叠/缩放合同。

最终sourceGeneration=`a1468689512fcd0575517cfc6b0d9fdca884523f9f6d80c10095607a8e5e82cd`。`pnpm build`（445 Token/图/设计值审计）、`pnpm typecheck`、19项定向Node检查、`pnpm test:consumer`通过。三tarball独立安装正式ESM/CSS/types，React/ReactDOM 19.2.8和Base UI 1.7.0各一份；无源码alias、D3 peer或D3公开类型。D3类型声明仅是各库包的开发依赖；初次将其放到根开发依赖时，消费者preserveSymlinks类型检查误读祖先目录类型并缺少关联模块，已调整声明归属后完整复验通过，没有要求消费者补装类型或使用skipLibCheck绕过。

计算单元覆盖空/零/缺失、负值、类别/系列顺序、单项/零项饼、有限极大与次正规极小数、分段路径与命中边界；初次SSR曾发现D3的空range不接受空类别，现内部绕过该分区构造，空/错误/SSR合同保持。柱位置检查按实际浮点精度使用1e-10容差。统一demo将图表移入独立动态模块，新增缺采样、正负柱/零基线和单项/零项组合，无新增说明字段或业务owner。

产物图验证实际使用三个D3模块，不包含D3的selection/axis/transition/fetch实现；Button与窄服务入口不包含D3。demo初始静态图D3贡献为0，进入图表才请求 `chunks/charts-6RCLR6UR.js`，其他三个已验面板不请求该模块。图表示例JS gzip为168793 bytes，相比第五轮156239增加12554 bytes；仅可选chart JS上限有界增加8KiB至169984，foundation仍147550/161792、关键CSS23234/23296、chart CSS23115/24576，Button/窄服务/CSS门禁均未放宽。

最终同代Chromium定向回归 **17/17通过**，无失败、跳过或重试：light/dark/system默认配方、390px/200%文字、公开200%阅读比例、RTL、键盘/缺失/语言/完整数据表、同范围刷新与失败保原SVG/点/焦点/横滚/Resource、重排/删除/新范围/取消迟到、空/全零/单项、初次失败与显式重试、ResizeObserver释放/自定义Token/减少动效/强制颜色及浏览器触屏上下文。三模式真实Chrome设置200%缩放均通过：DPR1→2、CSS视口1280→640、根字号16px不变、CSS zoom=1、pinch=1；不是根字号或CSS zoom替代。

统一demo另通过17项真实浏览器检查：表单首屏不请求图表动态模块、导航后加载；D3断线/负柱/零柱/单项饼与数据表零项准确；重试、主题热更新保原SVG及展开的数据表；390px/200%阅读父子文档均width/scrollWidth390、根字号32px、轴caption24px；面包屑和走马灯保持独立。pageerror与真实API请求均为0。初次CLI在consumer尚未生成页面时取得404，未计为最终证据；最终完整产物后的操作和截图均通过。

已查看[统一demo](../output/playwright/pages-gallery/review-6/gallery-light.png)、[状态组合](../output/playwright/pages-gallery/review-6/gallery-states-light.png)、[深色390px/200%阅读](../output/playwright/pages-gallery/review-6/chart-dark-narrow-200.png)及[真实浏览器200%](../output/playwright/pages-gallery/review-6/chart-browser-200-light.png)。报告、可复现命令、包SHA、缩放测量及CLI probe见 [review-6/checks.json](../output/playwright/pages-gallery/review-6/checks.json)；原始17项浏览器报告保留在同目录browser.json。未跑全仓unit/browser、Firefox/WebKit、物理触屏/读屏器、代表性大数据性能基准或真实后端/消费项目验收。本轮只改xui，保持4.2.41候选预览，未提交、推送、归档定版或通知其他项目升级。

第七轮开放LineChart公共 `curve?: LineChartCurve`，枚举为linear/monotone/step，缺省linear。内部对应D3 curveLinear/curveMonotoneX/curveStep；阶梯在相邻横坐标中点跳变。配置仅影响连线，同图所有系列共用；不改变原值/采样点/轴/图例/读值/数据表/请求owner，Bar/Pie无此配置。null在三种模式下均结束当前段，单独采样点保留。类型从React/chart和根入口导出，JS无效配置明确拒绝；未新增D3公开类型或runtime合同。公开清单仅新增这两处的LineChartCurve类型，移除该类型名后清单SHA与第六轮完全相同。

最终sourceGeneration=`74eeda0e4528b5124cfd0525a5e65b5f16fd1e6beaca39195683f7a0a75287d1`。build的445 Token/主题图/设计值审计、typecheck、22项定向Node检查及正式三tarball独立消费者通过，React/ReactDOM/Base UI保持各一份，无源码alias。新增正负类型fixture验证默认/三枚举、根入口、拒绝任意D3名称/工厂及Bar配置；计算检查覆盖默认路径不变、三模式缺失/空/单点、单调插值的段内边界和阶梯中点跳变。chart JS gzip为169413/169984，较第六轮增加620 bytes；所有预算、Token和CSS保持。

最终同代Chromium **18/18通过**，无失败/跳过/重试，包含原图表定向回归及新增热切换合同。切换曲线保持原SVG/路径/采样点节点、焦点、读值，查询增量为0；在途同范围刷新仍保图且只执行宿主原有一次请求，空态切换无异常。三模式真实浏览器200%缩放分别实际遍历linear/monotone/step，DPR×2、CSS视口减半、根字号16px、CSS zoom=1、pinch=1。其余浅深/system、390px/200%文字、公开阅读比例、RTL、缺失/单项/零/错误/重排/范围迟到、数据表/语言、Observer释放、自定义Token及浏览器触屏上下文继续通过。

统一demo顶部以同一组categories/series并排展示三种算法：相同原值、采样坐标、颜色和数据表，周四缺失后三图均断线，周五单点仍可读。CLI另有93项检查覆盖三主题的路径差异、缺失、原值读值/数据表相等、桌面并排、窄屏纵排、200% caption及末端点焦点局部横滚；父子文档均width/scrollWidth390，零pageerror和真实API请求。初次窄屏脚本在分别聚焦导致滚动后比较了不同视口坐标，已改为同一时刻测量所有卡片；没有修改组件规避检查。

已查看[浅色对比](../output/playwright/pages-gallery/review-7/comparison-light.png)、[深色对比](../output/playwright/pages-gallery/review-7/comparison-dark.png)、[窄屏200%单调图](../output/playwright/pages-gallery/review-7/monotone-dark-narrow-200.png)和[真实浏览器200%](../output/playwright/pages-gallery/review-7/browser-200-light.png)。同代包SHA、API差异、缩放数据与CLI probe见 [review-7/checks.json](../output/playwright/pages-gallery/review-7/checks.json)，原始浏览器报告为同目录browser.json。复现沿用第六轮定向命令并增加grep `public line curve updates`；真实缩放用例已在每个主题内覆盖三种配置。未跑全仓/跨引擎、物理触屏/读屏器、大数据性能基准或真实后端/消费项目验收。保持4.2.41候选预览，只改xui，未提交、推送或归档定版。

第八轮为三类图新增共同 `animation?: boolean`，默认开启Token短动效，false立即呈现。入场使用motion-duration-enter（默认180ms），更新使用motion-duration（默认150ms），共用motion-easing。React局部数值投影配合浏览器无目标计时effect读取缓动，D3仍只算路径；没有新增D3 transition/DOM/IO依赖、全局Controller或查询owner。首次折线揭示、柱从真实0基线生长、饼按顺序展开；后续同结构/坐标范围更新从当前显示位置接续，不重挂、不从0重播。类别/缺失掩码/曲线/范围/尺寸变化直接投影；null始终断线。所有文本原值、占比与数据表立即读取确认数据，交互时立即完成当前动画。关闭/reduce/后台/0时长/计时API不可用均直接呈现；卸载清理帧、时钟与监听。后台事件用模拟visibility验证，未冒充真实操作系统后台调度验收。

`pnpm build`、typecheck、**41/41** 定向Node回归及独立三tarball ESM/CSS/types消费通过；445 Token、公开命名导出、根入口与单实例React 19.2.8/ReactDOM 19.2.8/Base UI 1.7.0检查通过。最终sourceGeneration=`9a62b42fc3464a259eaa327772e21b641444db472365477d1845104f99750417`，包SHA与同代API/性能收据见[review-8/checks.json](../output/playwright/pages-gallery/review-8/checks.json)。公开配置仅新增可选boolean，不向Card DOM透传；没有要求宿主D3对象、源码alias或第二套样式。动画代码与demo使独立chart JS gzip由169413增至170708（+1295）；仅可选chart JS预算由169984有界调至171008（+1024）。基础JS147550、Button gzip6948、critical CSS23234、chart CSS23115保持；初始demo模块D3贡献仍为0。

同代Chromium **21/21独立场景通过**，无失败/跳过/重试；新增三项覆盖默认首次/更新、真实原值与数据表、null分段、连续更新接续、刷新/失败不重播、几何/节点/焦点保留、运行中false/reduce/0时长/模拟后台、恢复不补播、结构/曲线/尺寸直接投影、计时API缺失与卸载释放。原浅深/system、390px/200%文字、公开比例2、RTL、键盘/触屏上下文、空/零/单项/错误/范围迟到与语言回归通过。原三个真实浏览器缩放场景随后增强为no-preference下三图实际数据更新，再单独**3/3复验通过**，属于原21项中的同三个场景，不累计为24种场景。DPR1→2、视口1280→640、根字号16px、CSS zoom=1、pinch=1；长中文真实读值60，交互完成动画且无整页横溢出。生产React的StrictMode包装通过，不将它等同开发构建的effect重放实验。

统一demo新增顶部动画开关、更新同一组数据按钮和三图类型Tabs；左侧可切换短动效，右侧始终立即呈现，共用稳定ID和数据。CLI **84项检查通过**，覆盖三模式、各图开关/更新/节点/矩形/原值表、200%阅读和局部横滚；真实API请求0、pageerror 0。默认Token读数按秒/ms归一化；为观察中间帧，定向测试临时覆盖同一公开duration Token为1000ms，默认产品值仍为180/150ms。已查看[浅色](../output/playwright/pages-gallery/review-8/comparison-light.png)、[深色](../output/playwright/pages-gallery/review-8/comparison-dark.png)、[system](../output/playwright/pages-gallery/review-8/comparison-system.png)、[窄屏200%柱图](../output/playwright/pages-gallery/review-8/bar-dark-narrow-200.png)及[实际浏览器200%](../output/playwright/pages-gallery/review-8/zoom-light.png)。

过程中修正demo的Switch事件名、clip测量归属，以及探测对秒/ms、饼图不同标题和长中文fixture的错误假定；未为这些探测问题修改公共行为。CLI隔离浏览器不能打开Chrome设置页，实际zoom沿用项目已有persistent-context用例完成。原始browser/zoom报告、gallery.json、可复现probe和命令均在review-8；索引仍为`.artifacts/pages-gallery-preview.json`。未跑全仓发布矩阵、Firefox/WebKit、物理触屏/读屏器、大数据帧率基准或真实后端/消费项目验收。只改xui，保持4.2.41候选预览，未提交、推送、归档定版或通知消费项目。

第九轮按用户更正保留折线图，并在统一demo单列曲线图：两者共用LineChart，分别为linear与monotone，原三种曲线公开配置不变，不新增CurveChart或另一套Controller。动画对照改用五个稳定类别、四个真实点和一个null，让前三个连续点能形成可辨曲线；普通趋势组并排呈现折线/曲线，柱/饼仍保留。

首次进入由上一轮的横向裁切改为沿真实路径长度从起点绘制至终点。私有React子组件只在进入时测量每个连续段的SVG长度，以同一Token进度依次分配距离，点形在线条到达该采样位置后显示；三种公开curve均适用，null空隙没有连接线，单个孤立点保持真实点。内部alpha mask保留原完整路径与实/虚/点线编码，不改变原始值、读值、轴或图例；数据更新仍使用上一轮的当前坐标接续，刷新不重新入场。既有关闭/reduce/取消/卸载、焦点与原Resource请求owner保留。

构建、typecheck、**42/42定向Node测试**、独立三tarball ESM/CSS/types消费和445 Token检查通过；最终sourceGeneration=`b1d1b8db9515217301a70e800a99efc9eb722e517645f6fbf65d41f77d21da25`。本轮公开导出/接口不增加，React/ReactDOM/Base UI仍各单实例。chart JS gzip由170708增至171543（+835）；仅可选chart JS门禁由171008增至172032（+1024），CSS23115、基础JS147550、Button gzip6948与critical CSS23234保持，初始demo D3贡献0。包SHA、API和性能收据见[review-9/checks.json](../output/playwright/pages-gallery/review-9/checks.json)。

同代Chromium **22/22通过**，无失败/跳过/重试。新增原生路径测量检查覆盖linear/monotone/step：分段路径拼接等于原完整路径、按长度加权的已绘制距离等于浏览器缓动进度、后段等待前段、未到达的末点隐藏、点线编码保持、交互完成及单点边界。原刷新保节点/几何/焦点、减少动态效果/关闭/0时长/模拟后台/不支持计时/卸载、浅深/system、长中文/390px与200%阅读、RTL、真实触屏上下文、三模式实际浏览器200%缩放继续通过。真实缩放仍是DPR1→2、视口1280→640、根字号16px、CSS zoom=1、pinch=1；本轮用例保留三图no-preference的数据更新检查。CLI聚焦折线与曲线的独立入口、路径区别、同数据动效对照和三模式窄屏/200%，**78项通过**，真实API请求与pageerror均0；不冒充本轮重跑了柱/饼的全部demo组合。

已查看[折线中间帧](../output/playwright/pages-gallery/review-9/chart-linear-entry.png)、[曲线中间帧](../output/playwright/pages-gallery/review-9/chart-monotone-entry.png)、[曲线入口](../output/playwright/pages-gallery/review-9/curve-comparison-light.png)及[深色窄屏200%](../output/playwright/pages-gallery/review-9/curve-dark-narrow-200.png)。原始报告、命令、probe与截图在review-9，预览索引已更新。未跑全仓发布矩阵、跨引擎、物理触屏/读屏器、大数据帧率基准或真实后端/消费项目验收。保持4.2.41候选预览，未提交、推送、归档定版或通知其他项目。

第十轮（2026-10-25）按用户最终确认，所有图表首次进入与数据更新统一默认900ms。集中新增共享motion-duration-chart，减少动态效果为0ms，共用原motion-easing；普通控件原motion-duration/enter等不变。私有chart motion hook统一读取该Token，不增加公开时长对象或每类图的计时owner。折线/曲线仍沿真实路径进入，柱仍从0基线生长，饼仍顺序展开；刷新保图并从当前坐标更新，不重新入场。相同数据、语言或主题变化不重播，原值读数、取消/关闭/reduce/卸载合同保留。

构建、typecheck、**43/43定向Node测试**、独立三tarball ESM/CSS/types及446 Token图检查通过。新增精确的公开组合别名允许将motion-duration-chart绑定到var(--motion-duration-enter)，用于显式180ms对照；审计仍拒绝实例原始毫秒常量、任意别名和反向绑定。CSS指纹与Token计数由唯一DESIGN合同同步维护。最终sourceGeneration=`f44d8fe3dc48d2b5c6b6a90f33243dd149cfdb36ecaef390109805862c4e9f76`；三包SHA、公开清单和单实例React/ReactDOM/Base UI证据见[review-10/checks.json](../output/playwright/pages-gallery/review-10/checks.json)。chart JS gzip171536、chart CSS23128、基础JS147550、critical CSS23247，既有预算全部通过，初始demo D3贡献仍0，未新增依赖。

同代Chromium **22/22通过**，无失败/跳过/重试；真实浏览器计时验证三类组件首次均900ms、数据更新均900ms。原路径长度/点到达/null断线、刷新保节点/布局/焦点/滚动、关闭/reduce/0时长/卸载、真实值、浅深/system、窄屏200%文字和三模式实际浏览器200%缩放回归通过。顶部新增四种图形180ms与900ms对照及“重播首次绘制”，后者仅重挂所属两个demo实例，不作用于普通刷新；原“更新同一组数据”保持实例，实测只创建900ms更新时钟，不重播首次阶段。

CLI **107项检查通过**，逐一覆盖三模式下折线/曲线/柱/饼的两档计时、300ms时旧档完成而900ms仍绘制、点等待/柱生长/饼展开、最终真实坐标一致、重播隔离与布局、更新保实例、窄屏200%键盘/局部横滚及减少动态效果零时钟；真实API请求0、pageerror 0。已查看[浅色中间帧](../output/playwright/pages-gallery/review-10/speed-light-mid.png)、[深色中间帧](../output/playwright/pages-gallery/review-10/speed-dark-mid.png)及[窄屏200%](../output/playwright/pages-gallery/review-10/speed-dark-narrow-200.png)。报告、probe、命令和包证据在review-10；预览索引已更新。未跑全仓发布矩阵、跨引擎、物理硬件、大数据帧率或真实后端/消费项目验收。用户确认900ms默认值未视为定版/发布授权；仍为4.2.41候选，只改xui，未提交、推送、归档发布或通知其他项目。

第十一轮（2026-10-25）只调整统一demo与对应既有文档：移除180ms速度对照及固定关闭的一侧，每种类型只展示一个默认900ms实例。顶部开关默认开启，统一控制本面板所有图表；关闭时当前图形直接完成，重新开启不重播现有数据。“更新同一组数据”保持实例与原值读数并接续更新；“重播首次绘制”仅作为独立的显式演示动作，重挂所选图形而保留其他实例。公共组件、Token、服务、接口、包版本均未改。

工作区typecheck通过；复用第十轮已安装的正式三tarball，核对sourceGeneration=`f44d8fe3dc48d2b5c6b6a90f33243dd149cfdb36ecaef390109805862c4e9f76`和安装锁SHA不变，仅重新类型检查与编译当前demo，未新建源码副本或源码alias。模块图全部来自独立安装目录，React/ReactDOM/Base UI沿用原单实例，初始D3贡献0；本轮demo/入口SHA和可选chunk见[review-11/build.json](../output/playwright/pages-gallery/review-11/build.json)。原包级43项Node/22项浏览器证据仍见review-10，本轮不重复冒充重跑。

当前demo真实浏览器 **128项通过**，涵盖浅深/system四种图形：无旧对照文案/实例、每类型单图、更新仅900ms的update/idle且保节点/布局/读值、全页开关关闭无时钟/开启不重播、显式重播只影响所选图、窄屏390px/200%文字与键盘末点/局部横滚、减少动态效果零时钟。pageerror与真实API请求均0。已查看[浅色](../output/playwright/pages-gallery/review-11/uniform-light.png)、[深色](../output/playwright/pages-gallery/review-11/uniform-dark.png)和[窄屏200%](../output/playwright/pages-gallery/review-11/uniform-dark-narrow-200.png)。报告、probe及截图在review-11，预览索引已更新。未重跑全量/跨引擎/硬件/真实后端，也未重新打包发布；保持候选预览，未提交或推送。

## 模型配置保存回执与测试结果（4.2.40，2026-10-24）

在 4.2.39 基础上对齐 BaseService `16125c0b62a057922386176f4975eca09672c25b` 的 llmservice 合同；其 AgentCore 固定依赖为 `aeea6c2c7255021a0d77b7a3a0865a69031b5709`。HTTP 503 的 50310 为保存结果未知，50311 为已提交但后置处理失败，50312 为已提交但测试失败。公共 Client 严格解析官方 AjaxResponse 和安全回执，不再把后三种事实都归成未知。矛盾/损坏回执仍阻断重写；没有扩大通用 HTTP 错误载荷或增加请求 owner。

新增 onCommitted 对所有确认提交通知一次；onSaved 仅在有权威 editor 时通知，宿主列表刷新使用前者避免重复请求。已提交无 editor 时清理脏状态、私有密钥及 Headers，锁定旧视图直至显式重读；新增记录使用回执中的真实 ID，没有 ID 时由宿主核对 operation_id。测试失败不假装通过，后置失败不被测试失败覆盖。完整规则见随包 [README](../packages/ui-react/model-profile/README.md#保存结果与-baseservice-合同4240)。

- `pnpm build`、`pnpm typecheck`：通过；构建内 440 个 Token/主题依赖和设计值检查通过。
- `node --test tests/model-profile.test.mjs tests/docs.test.mjs`：27/27，通过 25 项模型配置和 2 项文档检查。覆盖精确 code/status/flags、坏回执、保存身份、六星号与秘密清理、已提交/未知区别、取消/迟到、同步订阅者切换身份、阻止未核对的新增配置退回默认值。
- `pnpm test:consumer`：正式三包 ESM/CSS/types、随包 README、正负类型消费者与性能门禁通过。React/ReactDOM 19.2.8、Base UI 1.7.0 各单实例，无源码 alias。
- `pnpm exec playwright test tests/browser/model-profile.spec.mjs --max-failures=3 --reporter=list,json` 加定向 `--grep 'committed test failure|postcommit failure|committed create without|cancel and scope'`：26 个唯一用例全部通过。初轮 22 项通过；另 3 项脚本失败及 1 项未运行在修正脚本后 4/4 通过，未重复累计。首轮误把点击滚动后的 viewport 坐标变化当布局变化，已改为同时检查表单内相对位置和总高度；异步重读改为等待非空数据，手输模型后用真实 Escape 关闭 Combobox 再操作。没有修改组件代码、强制点击或放宽布局阈值来通过复验。

浏览器覆盖新增/编辑、准确请求次数、已提交但测试失败的 Toast、无 editor 锁定/重读、无 ID 与未知不重放、取消和身份切换零旧回调，以及原目录、向量、密钥、Sheet 确认/回焦回归。light/dark/system、1280/390px、长中文、100%/200% 阅读缩放及三模式真实 Chrome 200% 缩放通过；原生缩放经设置页改变，DPR 翻倍、CSS 净宽减半、根字号和 CSS zoom/pinch 不变。已查看深色窄屏完整表单及浅深色原生缩放截图，核对只读字段、Toast、持久重读入口和操作可达；Toast 不占文档流，需重读的持久限制位于操作区。

sourceGeneration：`3595647d75a7daf3b38c2080dd0458819db9f6535473fcd5df75a702e4a9b7b1`。原始首轮/复验报告、逐例汇总及上述截图归档到正式产物 validation；manifest、public-api.json、sourceGeneration、SHA256SUMS 继续自动生成并校验。本轮所有 API 均为合成 mock，未执行真实 BaseService/AgentCore 联调、消费项目实际页面、全仓 unit/browser、Firefox/WebKit 或部署。库验证不代表 xAgent 接入完成。

## 主题根节点与属性恢复（4.2.38，2026-10-23）

基线为main 196e28c/4.2.37，公共ThemeService创建时捕获html，后续替换根会丢失主题投影。新增三种模式根替换Node回归先在未改动的4.2.37 dist上全部预期失败，原始baseline-unit.log及基线正式消费者回执保留。旧浏览器消费者缓存存在失效链接，未取得有效的旧版浏览器复现，不将无效尝试写成基线通过。候选沿用同一owner，以Document直接childList和当前html限定属性观察恢复mode/effective/preset及最后有效scale；幂等写入、不观察子树、不轮询、无逻辑变化不换state或通知、不因恢复读写storage。destroy与排队回调、临时无根和缺少MutationObserver的显式动作均有定向覆盖。无公开API、色板、Token或布局变化。

最终build、typecheck、440 Token图/指纹和42项定向Node检查全部通过。正式三包均为4.2.38，sourceGeneration为`51cf092d0682c097c7d03e4501fcdc80218e9edfe8f477d6a7f0801c9560612c`；独立tarball ESM/CSS/types及正负类型消费者通过，React/ReactDOM19.2.8、Base UI1.7.0单实例，无src alias。初始JS gzip144930/153600、关键CSS22933/22976，未提高预算，CSS保持原产物。

浏览器18/18通过，0 skipped/unexpected/flaky：新增15项覆盖light/dark/system、1280/390、读取缩放200%、同html属性清空、替换根、后续模式/配方/系统变化、存储拒绝、销毁以及真实浏览器200%缩放；另3项原session偏好回归通过。正式bootstrap示例`?recover-document`真实调用hydrateRoot(document)，三种模式均发生一次恢复，html身份保留，ThemeService/HTTP/bootstrap应用身份不变，forest和scale2恢复，后续公共按钮和草稿继续可用。仅属性清空场景另验证原输入节点、草稿和焦点保持及MutationObserver写入次数停止增长；不把React整棵恢复误称为保留原业务DOM。真实Chrome设置200%测得DPR1→2、视口1280→640，根字体16px不变、CSS zoom1、visualViewport.scale1，恢复后键盘操作可达。

主线程已查看proof中的宽屏、窄屏、真实hydration与浏览器缩放截图，核对主题、控件及恢复后的操作。light/system切换深色后的即时截图可能仍处CSS背景过渡，最终主题属性/Token断言与深色缩放截图分别保留，不据即时截图宣称过渡已结束；原200%主题示例的密集列换行不在本次布局验收范围。小结、选定截图及指标见`.artifacts/theme-root-4.2.38/case-summary.json`、`proof/`与`visual-proof.json`；构建、类型、Token、Node、消费者、浏览器最终日志保留，重复完整浏览器报告和临时输出在提取证据后清理。

复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`；`node --test tests/theme-root.test.mjs tests/theme-control.test.mjs tests/theme-session.test.mjs tests/theme-presets.test.mjs tests/interface-scale.test.mjs tests/config-services.test.mjs tests/service-architecture.test.mjs tests/contract.test.mjs tests/docs.test.mjs`；`pnpm test:consumer`；`pnpm exec playwright test tests/browser/theme-root.spec.mjs tests/browser/theme-session.spec.mjs --config .artifacts/theme-root-4.2.38/playwright.config.mjs --workers=2`。本机4173已有其他预览，本轮使用同一dist在4328的临时静态服务；无额外源码副本。未跑全仓unit/browser、watch/cold-start、其他浏览器/平台、实际xAgent/Cloudflare页面或部署；此修复不处理导致hydration失败的SCRIPT/宿主标记根因，不修改或部署消费项目。正式归档仍由提交后`pnpm archive --evidence .artifacts/theme-root-4.2.38`与`pnpm archive:verify <归档目录>`生成并验证。

## 业务日志列定义、cell 与查询槽（4.2.34，2026-10-19）

核对正式4.2.33/f69aabf及最新main：原完整页仅有字符串列和专用format*，无queryFields。按用户最后决定，4.2.34只保留列定义＋cell：无cell/null读取event自身字段、其次显式attributes原值；有cell则使用完整React结果（包括null/undefined留空）。不增加全局defaultCell或会话/用户/复制专用接口，不保留旧展示兼容分支。普通列无需回调，时间键为occurred_at，custom列按需显式detail；runtime helper返回原event和逐列values。未传list的默认七列仍由公共默认列定义渲染。attributes经现有JSON边界深冻结，未知顶层字段继续丢弃，真实身份/会话投影由宿主授权提供。

queryFields/querySummary复用既有QueryForm/QueryField：额外资源范围、标准宽事件类型和结果同带对齐，应用/清除在查询动作区，原刷新/取消保留标题次要动作。高级字段继续原Disclosure/ViewController草稿。scope切换由稳定loader先更新范围，再用同一Controller.setFilter清空旧列表/详情/缓存和快照、取消旧代；仅list/labels/cell更新零请求、零取消且不重挂。身份/权限/租户切换仍走原销毁边界。没有新增Controller、transport或业务owner。

build、436 Token图/指纹、typecheck、75项定向Node检查及正式三tarball ESM/CSS/types、正负类型消费者通过，sourceGeneration=`a17cf0789c5313f3fe181bfb5cf3aed2d914f55ecef06b2fbf8b00419d4674e0`。React/ReactDOM19.2.8、Base UI1.7.0各一份，无src alias。关键CSS gzip22612，较4.2.33的22553增加59 bytes；原22592上限不足，限定本功能新增64到22656，其余JS/Button/service门禁不变；初始JS144665/153600。首轮CSS超限日志consumer-candidate.log保留，不当作最终通过。

最终浏览器57/57通过：13项新cell/查询槽、12项列表、26项整页语言、6项原业务日志回归。覆盖无callback的0/false/null/缺失/嵌套JSON、callback留空及context.content保留详情、文本注入惰性、自定义Badge与Button、真实系统剪贴板写入结构化会话ID（无会话为空），复制前后URL/请求/行几何/焦点不变；scope在旧列表与详情在途时取消，迟到释放不复活；列重排、三种Controller模式及labels更新保留草稿/选区/详情/页/快照/缓存/节点和焦点。保留原筛选原始参数、权限/不存在/过期/错误/取消/重试和卸载清理回归。

light/dark/system、1280/390、长中文、根字号200%和真实Chrome设置200%分别通过。真实zoom校验DPR翻倍、净宽减半、根字号不变、CSS zoom=1/pinch=1。验证Enter复制、Enter打开详情/Escape回同按钮、操作与焦点完整揭示；公共OverflowText的hover/已有focus滚动、reduced-motion完整换行均通过。已查看最终浅深初始完整查询区、深色窄屏大字和原生zoom会话动作截图。截图复核后将事件类型改为标准宽度并保留原标题刷新/取消，消除多行动作撑开的字段空隙；变更后已重建正式包并完整重跑上述57项。

候选阶段发现自定义固定宽按钮超出窄表格净宽、已聚焦详情因语言变长后被裁，公共实现分别继承既有table-action-max-inline-size，并在本行展示更新后原位揭示当前动作，未要求宿主CSS。早期浏览器误用了尚未重建的4.2.33旧预览，已终止；该记录及候选50/56失败不作为本版结果。最终用例不累计多轮次数。原始日志、browser-final.json、逐例case-summary.json、解码截图/zoom附件、consumer-validation/performance和visual-proof均在`.artifacts/business-log-cells-4.2.34`。

复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`；`node --test tests/business-log.test.mjs tests/interaction-controller.test.mjs tests/page-api.test.mjs tests/contract.test.mjs tests/docs.test.mjs tests/design-state-contract.test.mjs tests/design-value-guard.test.mjs`；`pnpm test:consumer`；`pnpm exec playwright test tests/browser/business-log-cells.spec.mjs tests/browser/business-log-list.spec.mjs tests/browser/business-log-labels.spec.mjs tests/browser/business-log.spec.mjs --workers=2`。未跑全库unit/browser、watch/cold-start、其他平台/浏览器、真实领域后端或消费项目页面/部署；不把库示例通过写成xAgent升级完成。4.2.33记录的两个历史NavigationMenu滚动失败仍单列PUBLIC_REQUESTS，不在本次修复范围。

## 图标按钮组合与内描边界（4.2.33，2026-10-19）

先核对main 3c440f4/4.2.32及xAgent的真实组合证据。用已安装正式4.2.32 ESM/CSS/types运行新增回归，SearchToolbar圆面34而非28、Footer glyph不居中两项预期失败；另用同代正式CSS复现workspace edge的根100%/200%焦点环36/72而非34/62。baseline.log/json、focus-baseline.log/json及附件保留，无历史checkout或额外源码副本。

公共SearchToolbar/QueryForm actions与advanced保留button-icon-padding；SidebarFooter文字布局规则排除纯图标，收拢行不再把图标设为100% flex-basis。含纯图标的Footer在原rail内居中保留至少最大公共目标所需轨道，四种size维持24/32/36/40等宽高与glyph中心；不扩大60px rail。候选测试发现lg被36px净宽压扁，以及较小目标在40px轨道内靠左，均已补齐公共布局及断言，失败记录保留。

workspace contentInset=edge、ScrollArea inset、顶栏/侧栏通用内描以零额外specificity排除纯图标Button，保留其自身圆形offset；普通文字、invalid输入、InputGroup及滚动区自身的原政策保持，Dialog/gutter嵌套停止边界不变。默认target36、glyph16、圆面28、focus34；根200%为72/32/56/62。无新增API、Token、Controller或请求owner，旧props、文字按钮、权限与业务行为保持。三包/DESIGN仅递增末位，文档、ICON-ACTION-005～006及原正式示例的icon-actions/focus-scopes/no-reveal组合同步。

最终build、436 Token图/指纹、typecheck、44项定向Node测试、正式三tarball ESM/CSS/types及正负类型消费者通过。sourceGeneration为`f41da6b03d38289573166f773af5cf53f859c20742d5176dd03f827b8c4025b4`；React/ReactDOM19.2.8、Base UI1.7.0单实例，无src alias。初始JS gzip144665/153600、关键CSS22553/22592；关键CSS比4.2.32增加91 bytes，仅有界加128 bytes预算，其余门禁不变。预探针为22552，正式消费者实测以22553为准；原22504/22464超限日志单独保留，不冒充最终通过。

最终浏览器87个唯一用例中85通过、2个历史失败：61项图标密度/组合全部通过、7项SearchToolbar全部通过、19项SidebarFooter中17通过。light/dark/system、1280/390、长中文、根字号200%及真实Chrome设置200%分别验证；后者DPR翻倍、净宽减半、根字号保持、CSS zoom=1/pinch=1。覆盖纯图标各variant/size、横纵圆面、目标及glyph中心、收拢rail中心、真实外沿点击、Enter/Space、禁用零调用、busy防重复、原生zoom组合、原节点/草稿/展开连续性、普通文字/invalid与滚动区offset、嵌套Dialog Escape回焦。已查看浅深工具栏、窄屏大字、收拢Footer与真实zoom、深色窄屏Dialog截图；圆面和焦点完整，未裁SVG或缩小target。

两项原SidebarFooter长菜单测试在viewport/document下，收拢再展开后末行bottom=671、菜单bottom=653而失败。将正式4.2.32 theme tarball只读展开到内存、编译后替换同一示例CSS，旧主题与本轮候选得到完全相同的区域/scrollTop；React/runtime实现本轮未改。sidebar-regression-baseline.json保留对照，问题已列PUBLIC_REQUESTS，本轮不修改NavigationMenu滚动实现、不降低断言或把失败算通过。另4项旧测试仍硬编码240px，按4.2.16已生效的16vw/192–224px规范更正后通过。本轮不宣称整个87项套件全绿。

原始baseline、候选失败、browser-final.json/log、case-summary.json、解码几何/截图/zoom附件及visual-proof.json、正式consumer-final/performance-final存于`.artifacts/icon-button-composition-4.2.33`。复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`；`node --test tests/search-toolbar.test.mjs tests/sidebar-footer.test.mjs tests/contract.test.mjs tests/design-state-contract.test.mjs tests/design-value-guard.test.mjs tests/docs.test.mjs`；`pnpm test:consumer`；`pnpm exec playwright test tests/browser/icon-button-density.spec.mjs tests/browser/search-toolbar.spec.mjs tests/browser/sidebar-footer.spec.mjs --workers=2`。不累计多轮运行次数作为唯一用例数。

未跑全仓unit/browser、watch/cold-start、其他OS/浏览器、真实业务后端或消费项目实际页面/部署。只改xui；xAgent统计栏分配、升级及部署由其宿主任务负责。公共样例通过不代表消费项目已接入，也不掩盖上述两项历史NavigationMenu失败。

## 圆形图标动作的紧凑圆面与焦点（4.2.32，2026-10-19）

核对xAgent用户原始要求与固定4.2.31/7b05af0，缩约1/3是参考而非必须倍率。本轮只改xui公共IconButton及Button data-icon=true配方，不改Card图标tile、文字按钮或消费项目。先用已安装正式4.2.31 ESM/CSS/types运行新断言，预期失败：默认target36×36、SVG16×16、focus外径44px，背景仍按border-box绘制；正式receipt和baseline.json/geometry/截图保存在`.artifacts/icon-button-density-4.2.32`，没有历史checkout或额外源码副本。

最终target及四种size保持24/32/36/40px，SVG12/16px；公共button-icon-inset默认4px，button-icon-padding扣除原1px边界得到3px。default圆面28px，outline/busy边界同样内移；focus宽2px，offset=-3px，外径34px，圆面与focus保留1px间隙。候选32px环与圆面相接，结构复核后保留该间隙，未把所有尺寸强制乘2/3。背景只按content-box绘制，不裁内容、外沿命中或focus；颜色配方改用background-color避免状态切换重置background-clip。纯图标外沿真实指针仍执行一次；危险前景、disabled、busy、链接render/ref和原动作owner保持。导航compact旧横向零padding不再覆盖纯图标，但文字‹/›控制仍保留原零padding。root200时default target72、glyph32、圆面56、focus外径62px；原生浏览器200%保持CSS尺寸并物理放大。

三包及DESIGN仅递增末位到4.2.32，436 Token图/指纹及公开声明注释同步。COMPONENTS/PUBLIC_API/ADOPTION、ICON-ACTION-001～004、PUBLIC_REQUESTS和既有text-actions示例同步，无新增prop、Controller、Service或请求owner。设计审计把background-clip的三种box关键字识别为结构几何，正反测试仍拒绝颜色/尺寸/混合值。build/check:tokens/typecheck、定向37项Node测试、正式三tarball消费者ESM/CSS/types和正负类型检查通过；React/ReactDOM19.2.8及Base UI1.7.0单实例，无src alias。关键CSS gzip22462/22464（较4.2.31的22325增加137，复用旧11 bytes余量并有界加128 bytes预算）；初始React JS144665/153600不变，其他预算不放宽。首轮CSS预算超限的consumer-final2.log保留。

最终同代码浏览器70/70通过：21项新密度/交互及49项Button尺寸、禁用、品牌继承、链接对比度和Card动作回归。覆盖light/dark/system及系统浅色热切换、1280/390及Card1682/390、各variant/四种size、危险/禁用/disabled+busy、真实外沿点击、Tab跳过禁用、Space/Enter各回调一次、render链接Space不导航/Enter一次、Menu Escape回同节点、工具栏/Card及导航独立分支/行尾动作。两种200%分别验证：根字号与Chrome设置真实200%（DPR翻倍、净宽减半、根字号保持、CSS zoom=1/pinch=1）；目标、glyph和焦点完整可达，文字按钮focus-offset仍2px。Card既有刷新保节点/草稿/勾选/焦点、危险颜色与gap4px/普通Toolbar8px均通过。已查看最终编辑铅笔focus、Card/Toolbar及dark原生zoom截图，圆面/环清晰，SVG及点击布局未缩小。

首轮64通过、6项严格viewport ratio=1失败：同一长fixture原生最小滚动留下0.03125～0.4375px的透明target裁边，focus环完整。单用scrollIntoViewIfNeeded仍按浏览器舍入不移动，重复失败日志保留；测试改为在键盘往返前用原生scrollIntoView居中预定位，再真实Tab/Shift-Tab并保留ratio=1、尺寸及完整焦点断言，无固定睡眠、私有CSS、force或降低阈值。两项先通过后完整70重验通过；本轮不宣称修复document原生滚动的任意亚像素舍入。原始失败/最终browser JSON、trace/截图、case-summary.json与定位日志均保留，不将重复运行次数累计成唯一用例数。

浏览器验收generation为`064f1129b689db241dab90d45ea929302458e60e2ee4e7a12b716745143ee3b9`。随后仅修正正式消费者脚本注释的实测CSS数字，并将DESIGN的阅读缩放入口指向公开`setInterfaceScale`；最终发布generation为`c58d490a92bb237fc379efaec0dfa17f5ab0dd01781c1f78f03acbabdc5c1811`。发布重建后逐项比较browser-validated-bytes.json中的935个已验收文件路径（涵盖正式包dist和示例JS/CSS/types/HTML/SVG），SHA全部相同、零差异；三包build.json与正式消费者receipt均记录新的发布generation。因此此前70/70浏览器验收覆盖的公开文件字节与本次正式包完全一致。最终正式tarball消费者和性能门禁通过；不以旧receipt替代新构建证据。

复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`；`node --test tests/button-disabled-contract.test.mjs tests/button-xs-contract.test.mjs tests/design-value-guard.test.mjs tests/design-state-contract.test.mjs tests/contract.test.mjs tests/docs.test.mjs`；`pnpm test:consumer`；`pnpm exec playwright test tests/browser/icon-button-density.spec.mjs tests/browser/card-actions.spec.mjs tests/browser/button-size-contract.spec.mjs tests/browser/button-state-contract.spec.mjs tests/browser/button-brand-inheritance.spec.mjs tests/browser/button-link-contrast.spec.mjs --workers=2`。未跑全仓unit/browser、watch/cold-start、其他OS/浏览器或消费项目实际页面/后端/部署；本轮未修改或部署xAgent，库正式示例不代替产品升级验收。


## Card动作组紧凑间距（4.2.31，2026-10-19）

核对xAgent反馈与用户原始要求、固定4.2.30/4150bcd6及最新main，公共Card动作组确实沿用普通Toolbar的8px间距。先以已安装正式4.2.30 ESM/CSS和新合成示例复现，新增默认间距断言得到预期失败；五列单卡267.59375px，Switch＋三个默认36px IconButton的动作组宽160px，相邻图标按钮中心距44px。原receipt、baseline.log/browser/geometry保存在`.artifacts/card-actions-4.2.31`，无源码alias、历史checkout或额外源码副本。

新增公共card-actions-gap，默认依赖space-text-gap，Card头部actions及footerActions统一4px；通用Toolbar继续8px。正式实测同一宽度卡片的动作组由160px缩为148px，默认图标按钮仍36×36px、Switch标签命中区仍28×36px，中心距40px。字号200%时分别为72×72px/56×72px，Card gap为8px、普通Toolbar为16px；原生浏览器200%时CSS尺寸保持，物理显示放大。未修改Button/Switch字号、图标、焦点、危险tone、动作/权限/请求owner。公共主题可覆盖此Token，不新增密度prop或要求消费者穿透结构；原footerMeta可选、右对齐、长文揭示及真实不足时换行合同保留。

三包和DESIGN仅递增到4.2.31，434 Token计数/图及CSS指纹同步；CardProps补正式声明注释，公开类型/方法保持。COMPONENTS、ADOPTION、CARD-FOOT-005及PUBLIC_REQUESTS同步，既有正式CardGroup示例添加icon-actions/header-actions组合。最终build、check:tokens、typecheck、定向Node测试30/30、正式三tarball ESM/CSS/types和正负消费者通过；sourceGeneration `b5b6dbe93adfdfb7a7e4c3291e51db146b652c223a54d1f96b08730fa7c567e1`，React/ReactDOM19.2.8及Base UI1.7.0单实例，无src alias。关键CSS gzip22325/22336（较4.2.30增加26 bytes）、初始JS144665/153600，未放宽性能预算。

最终同代浏览器64/64通过：21项新动作间距验收及43项原Card footer/CardGroup回归，覆盖light/dark/system与系统偏好热切换、1682/390、长meta/纯文本meta/actions-only、头部与页脚、公共gap覆盖仍不影响Toolbar、文字200%、真实Chrome设置200%（DPR翻倍、净宽减半、CSS zoom=1/pinch=1）、Switch及三个独立图标按钮、危险颜色、真实Space/Tab/Enter各回调一次、disabled真实指针不执行、刷新保节点/草稿/勾选/焦点、排序/分页/集合滚动。每个聚焦控件和四边outline都要求完整位于body及窗口边界；不会以部分相交代替通过。截图确认桌面收紧及窄屏大字诚实换行。

首轮63通过、1项system＋200%字号的Button可见比例仅0.625；量测时侧栏grid过渡仍在改变净宽/工具栏换行。单独复现通过，测试改为等待公开页面有限布局动画及字体完成后进入稳定200%状态，连续5次通过；随后64项最终完整重验全部通过。原始失败报告与截图保留，不计最终通过，不宣称本轮修复了字号过渡中任意时刻主动移焦的连续性。原始browser-final.json、case-summary.json、截图/geometry/zoom附件、正式receipt/performance及visual-proof.json见该证据目录。

复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`；`node --test tests/display.test.mjs tests/card-presentation.test.mjs tests/card-group.test.mjs tests/contract.test.mjs tests/docs.test.mjs`；`pnpm test:consumer`；`pnpm exec playwright test tests/browser/card-actions.spec.mjs tests/browser/card-footer.spec.mjs tests/browser/card-group.spec.mjs --workers=2`。未跑全仓unit/browser、watch/cold-start、其他OS/浏览器或任何消费项目实际页面/后端/部署；本轮只改xui，正式示例不代替xAgent升级验收，也不要求恢复业务已删除的metadata。

## 卡片页脚、滚动传递与读取恢复（4.2.30，2026-10-19）

先核对最新4.2.29/45067eab，以原已安装正式tarball和当前合成fixture复现：五列约280px Card的长footerMeta把动作推到下一排，footer为81px；natural真实wheel被后加载的ScrollArea contain截住；auth.refresh网络失败缺少公共检查入口。baseline.log、recovery-baseline.log及原始报告保存预期失败，没有切历史checkout或复制源码。本轮仅修改xui，不要求xAgent恢复已删除的版本/只读/来源信息行。

Card公共Footer优先收缩可选metadata，最小可读轨道使用新增card-footer-meta-min-inline-size；能放下时动作同行。最终267.59375px卡片的footer为53px、metadata93.59375px、动作136px；确实不足时动作组下移，再不足组内换行，禁止裁动作/缩字伪装同行。私有React context只将当前Card既有交互面交给footer OverflowText，显式ref优先，无新DOM或tab stop；减少动态、粗指针、无可用入口及全部禁用时完整静态换行。回归发现旧focusable选择器把带tabindex=0的disabled按钮算成入口，已统一排除disabled、aria-disabled、负tabindex和隐藏input，并验禁用/重新启用。

CardGroup通过公共组件规则优先级恢复auto滚动传递，natural/document在body无范围时真实wheel滚外层，workspace仍先滚body。公共登录页只为refresh/session的network/timeout/HTTP 5xx提供既有checkSession检查，调用同一AuthClient.currentUser；无自动retry、login/logout重放或新认证owner，403及unknown logout不提供该入口。公开props保持，三个包仅递增末位；DESIGN/COMPONENTS/PUBLIC_API、定向ADOPTION、CARD-FOOT-001～004/CARD-SCROLL-001/AUTH-RECOVERY-001～002及adopt-xui同步。

最终build、433 Token图/指纹、typecheck、指定Node测试87/87、skill校验、正式三tarball ESM/CSS/types与正负类型消费者通过。sourceGeneration为`82a46036222cc82161638c6cad0a7c5bcc84be55118f2a574095b6d6bdaf2f41`，React/ReactDOM19.2.8及Base UI1.7.0单实例，无src alias。新增Footer规则/Token/滚动优先级使关键CSS gzip从22242到22299（+57 bytes），第一次超旧22272门禁的失败日志保留；仅给该能力增加64 bytes的有界预算到22336，其余预算不变。最终初始JS gzip144665/153600、关键CSS22299/22336。

同代正式浏览器最终121个唯一用例全部通过（21项Card footer、7项滚动/读取恢复、22项CardGroup、20项OverflowText、51项登录/导航）。不是将多次执行次数相加：公共修复复验117通过，剩余4项仅因display示例没有持续ThemeService而失败；示例改为既有公共bootstrap后，只重验其完整20项且全通过，其他未变用例复用。两个原始报告browser-regressions-final.json/browser-overflow-final.json与case-summary.json明确保留该边界。较早候选的disabled入口真缺陷和退出负例缺少异步等待也已修复，失败原始记录保留，不计通过。

覆盖light/dark/system及真实系统偏好热切换、桌面/390px、长元信息、200%根字号与真实Chrome设置200%缩放（DPR翻倍、净宽减半、CSS zoom=1/pinch=1）、当前卡hover/键盘揭示、减少动态/触屏/缺省槽位/禁用再启用、Switch/详情/删除独立且各回调一次、刷新保节点/草稿/勾选/焦点。三种CardGroup布局用真实wheel核对Document/body scrollTop；refresh network/timeout/5xx由同一owner手动恢复，超时迟到不回退身份，403及unknown logout无读取恢复按钮、logout只发送一次。原登录/导航仍覆盖generation、重复通知、密码清理与禁止重放。截图复核确认约267px五列同行、原生zoom及窄屏大字的完整聚焦动作；后者确实换行，不伪造“全部同行”。

原始基线、候选失败、正式receipt/performance、截图、geometry/wheel/请求/zoom附件及visual-proof.json存于`.artifacts/card-footer-4.2.30`。复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`；`node --test tests/display.test.mjs tests/card-presentation.test.mjs tests/card-group.test.mjs tests/metric-card.test.mjs tests/login-layout.test.mjs tests/auth.test.mjs tests/auth-coordination.test.mjs tests/contract.test.mjs tests/docs.test.mjs`；skill quick_validate；`pnpm test:consumer`；`pnpm exec playwright test tests/browser/card-footer.spec.mjs tests/browser/public-recovery.spec.mjs tests/browser/card-group.spec.mjs tests/browser/overflow-text.spec.mjs tests/browser/login.spec.mjs tests/browser/login-navigation.spec.mjs --workers=2`。仅修示例主题启动后，补跑`pnpm exec playwright test tests/browser/overflow-text.spec.mjs --workers=2`。

未跑全仓unit/browser、watch/cold-start、其他OS/浏览器、真实后端或消费项目现场/部署；合成回调与transport不代表xAgent/xLead已升级或业务验收通过。4.2.29的业务日志labels专项证据继续见下节，不由本轮卡片示例替代。

## 业务日志整页 labels 语言热更新（4.2.29，2026-10-19）

先核对main 53f0812a/4.2.28：list展示回调可更新，但Controller.labels只有构造时词典。新增resolver/反馈键回归先运行原4.2.28 dist，得到预期2项失败（缺少resolver与反馈语义键），见`.artifacts/business-log-labels-4.2.29/baseline.log`。没有切历史checkout、复制源码或修改消费项目。

React新增BusinessLogExplorer.labels实时展示输入，默认模式当前options.labels也实时生效。保留原service/view及状态，不用key=locale；部分覆盖每次替换、移除恢复当前基底。runtime纯resolveBusinessLogLabels与可选errorKey/detailErrorKey/filterErrorKey支持已有与未来反馈按当前词典呈现；旧Controller.labels、原错误字符串及无键的手写Controller行为保留。loader、HTTP、认证、筛选、详情和分页owner均未改变。公共类型、DESIGN/COMPONENTS/PUBLIC_API、定向接入及BIZ-LABEL-001～006、adopt-xui和原正式示例同步。

额外截图/几何复核发现390px、根字号200%下超长详情译文原宽398px，大于表格326px，焦点环无法完整显示（narrow-long-baseline.json）。公共表格区域建立inline容器，以新增table-action-max-inline-size Token预留焦点环空间；按钮按内容优先、超上限才换行，避免自动表格把可换行中文压成逐字竖排。432 Token的计数/源指纹已同步，不放宽design-value-guard或性能预算。最终浏览器同时断言该固定长译文最多两行、完整焦点边界和热切回长文案后的同一焦点。

最终构建、Token、typecheck、定向Node测试52/52、skill校验、正式三tarball ESM/CSS/types及正负类型消费者通过；sourceGeneration `ce48927e0c7e7b18fc860e5463b15b5e9cd50365a7099816d39bee4b19f62c19`。React/ReactDOM19.2.8、Base UI1.7.0单实例，无src alias。初始JS gzip144640/153600、关键CSS22242/22272、Button-only6631/16384 bytes，均在原预算内。

同代正式浏览器44个唯一用例全部通过（26项新labels验收、18项原业务日志/列表回归）：service/view/options三模式保留已生效条件、未提交草稿及选区、开合、当前详情、第二页与snapshot、原数据和行/单元格/动作/弹层节点；语言切换的list/detail请求和abort增量为零，已访问上一页仍读缓存。覆盖部分词典/移除/优先级、已有读取与合同错误、403/404、无效筛选、空态、过期/不可用、renderer fallback、旧手写Controller三类安全错误，以及在途列表/详情、取消/迟到。原ISO/ID/action/payload不改写，三个时区的列表formatter继续通过。覆盖light/dark/system、1280/390、长中文、窄屏根字号200%、真实Chrome设置200%缩放（DPR翻倍、CSS zoom=1、pinch=1）、弹层滚动、Tab/Enter/Escape和回原动作。

原始报告browser-final.json、case-summary.json、解码附件/截图、visual-proof.json和正式receipt/performance存于`.artifacts/business-log-labels-4.2.29`。截图复核包含浅深及窄屏中英文详情和真实zoom；补充真实wheel验证窄屏详情保持同一滚动节点，语言重排后scrollTop由500到544，未归零（不承诺不同译文下像素位置完全相等）；候选失败记录单独保留，不计为最终通过。复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`；`node --test tests/business-log.test.mjs tests/interaction-controller.test.mjs tests/page-api.test.mjs tests/contract.test.mjs tests/docs.test.mjs`；`pnpm test:consumer`；`pnpm exec playwright test tests/browser/business-log-labels.spec.mjs tests/browser/business-log.spec.mjs tests/browser/business-log-list.spec.mjs --workers=2`。

未跑全仓unit/browser、watch/cold-start、其他浏览器/OS、真实业务后端或消费项目现场；库合成loader只证明公共展示/请求边界，不代表xAgent等项目已升级或其业务验收完成。旧手写Controller无语义键时有意保留原安全错误文字；宿主自定义renderer/headerActions及事件事实由宿主语言/数据owner负责，labels不代为翻译。

## 普通HTTP原生剪贴板完整复制（4.2.28，2026-10-19）

核对4.2.18至4.2.27的公共fallback，均使用零尺寸textarea。早期无shim原生Chrome155对照中，0×0失败而1×1/2×2且opacity=0完整写入同一合成内容，证据`.artifacts/clipboard-confirm-4.2.26`。本轮新增系统回归先运行4.2.27正式tarball（sourceGeneration `6b899b4f543a588a964449c1a99c3b0df0ab939755d7520d5c83931f5c0b13cc`），原生Chrome156.0.8078.4、HTTP页面、isSecureContext=false、navigator.clipboard缺失、execCommand为native时，种子前置通过且service状态copied，但OS全文相等为false，得到预期失败；见`.artifacts/clipboard-4.2.28/baseline.log`和baseline.json。仅拦截页面合成HTML，不替换clipboard/execCommand，不用CUA剪贴板或快捷键作为系统证据。

4.2.28只把公共回退选区改为不可见、脱离文档流的非零几何；保留Clipboard API优先及失败不自动回退、FIFO、取消/迟到/释放、原焦点/输入选区/DOM Range/滚动和临时DOM清理。没有读回、持久化、通知或第二个writer owner。设计门禁仅对clipboard-service.ts的width/height精确1px允许平台例外，正反测试防止扩散为普通组件尺寸许可。公开方法/类型不变，三包及规范仅递增末位；STATE-COPY-001～002明确系统复制与mock调用的证据边界。


最终build、431 Token图/指纹、typecheck、指定7文件定向Node测试54/54、正式ESM/CSS/types消费者通过；sourceGeneration为`1540357fec672a76a5ebd779e97f3ea738aa1bbadae2143197618ca3625499ab`，React/ReactDOM19.2.8及Base UI1.7.0单实例，无源码alias。初始JS gzip144640、关键CSS22190 bytes，预算未改。receipt/performance与三包同代。

最终浏览器4/4全部通过：新增macOS普通HTTP原生系统用例（内部四次显式动作：ClipboardService、默认CopyController、默认React Copyable及重复复制）与既有fallback恢复、显示成功/失败和SSR hydration复制回归。系统用例使用headful原生Chrome156.0.8078.4、可信click且userActivation为true，不注入writer、不改navigator.clipboard/Document.execCommand；每次先写并核对合成种子，再把OS全文与合成中文/多段/emoji/Markdown原文精确比较，四次均相等。公开反馈copied只作等待条件，不作OS结果断言。只保存相等布尔值和合成原文hash，不输出其他剪贴板内容；临时textarea零残留，已检查合成页面截图，测试结束清理仍属于本测试的剪贴板和自有浏览器。焦点/原输入选区方向/内外滚动由既有独立恢复回归验证。

最终原始报告browser-final.json、case-summary.json、原生能力/激活/每次OS结果及截图proof存于`.artifacts/clipboard-4.2.28`。复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`；`node --test tests/clipboard.test.mjs tests/display.test.mjs tests/config-services.test.mjs tests/service-modules.test.mjs tests/design-value-guard.test.mjs tests/contract.test.mjs tests/docs.test.mjs`；`pnpm test:consumer`；macOS明确允许写合成系统剪贴板后执行`XUI_SYSTEM_CLIPBOARD=1 pnpm exec playwright test tests/browser/clipboard-system.spec.mjs tests/browser/clipboard.spec.mjs tests/browser/display.spec.mjs --grep 'clipboard|copy' --workers=1`。系统用例缺少显式开关或非macOS时跳过，不能记作系统验收通过。

未跑全仓unit/browser、watch/cold-start、其他OS/浏览器、真实HTTPS Clipboard API权限或任何消费项目/业务后端/部署。主题和文字样式未改；业务日志列表与TableContainer焦点能力沿用4.2.27独立验收，未在4.2.28重复其22项浏览器。新归档包含两项改动，仍须xAgent等项目独立升级并验收自己的实际复制/审计入口。公开API/Controller调用和认证/请求owner保持，无需宿主复制内部DOM/CSS或新增writer。


## 业务日志列表列与显示格式（4.2.27，2026-10-19）

核对xAgent报告的4.2.18与当前main90f6f397/4.2.26，原getBusinessLogTable仍固定七列。先用新增“list presentation selects”断言运行4.2.26 dist，实际为Summary/Result/Actor/Action/Event time/Business object/Detail七列而期望Actor/Event time/Summary/Result/Detail五列，得到预期失败，证据`.artifacts/business-log-list-4.2.27/baseline.log`。没有切换历史checkout或修改消费项目。

4.2.27新增可选BusinessLogExplorer.list与纯getBusinessLogTable第三参数，公开列ID和actor/action/occurredAt纯文本formatter；保留既有默认七列与缺省headers/cells，新增columnIds标明同序列。detail未选时追加，不丢完整事实入口；格式错误是宿主展示错误，不转换为查询错误。原BusinessLogController/ViewController、loader、wire/筛选、详情、权限/快照/取消/迟到owner保持。更新DESIGN、COMPONENTS、PUBLIC_API、ADOPTION和BIZ-LIST-001～005；既有正式示例?activity演示五列及宿主Intl本地时间/明确time-zone，默认URL保持旧视图。

构建、Token、类型、定向单测88/88（原5文件及5个表格直接测试）、正式ESM/CSS/types/正负类型消费者通过；sourceGeneration为`6b899b4f543a588a964449c1a99c3b0df0ab939755d7520d5c83931f5c0b13cc`，React/ReactDOM19.2.8和Base UI1.7.0单实例、无源码alias。初始JS gzip144640、关键CSS gzip22190 bytes，未改预算。最终同代浏览器22个唯一用例全部通过（12项新合同、6项原业务日志及4项表格动作/焦点回归）：Asia/Shanghai、America/New_York和UTC分别显示20:30、08:30和12:30，详情仍保留原纳秒ISO；动态列/语言更新不请求，行/actor单元格/详情按钮节点、焦点和草稿保持；action筛选仍发送approve，详情保留原ID/actor/action/object/ISO。覆盖旧七列、任意列顺序、detail自动补齐、未知结果、纯文本注入、游标/快照、取消/错误/过期/权限、三主题/桌面/390px长中文、200%根字号和真实浏览器200%缩放、键盘详情及回焦。

首轮18项及三主题截图检查后，实际查看真实zoom截图发现详情按钮仅部分露出，原toBeInViewport断言不足。改为真实Tab及按钮/焦点环完整边界断言；候选6过/1失败复现Chrome200%聚焦而未揭示。TableContainer现在仅对DOM内被裁切子控件作nearest揭示，先执行宿主onFocus并尊重preventDefault，跳过portal焦点；scroll-padding复用focus-width/offset及surface边框Token。第二候选21过/1失败检出焦点环约0.148CSSpx边界裁切，补边框余量后最终22/22，未降低断言。动态列仍保节点/焦点。中途consumer因源码变更触发generation保护失败，稳定源码的final4成功；候选日志均保留且不计为最终通过。

实际查看最终light/dark常态五列及长值/真实zoom截图；原始报告、截图、逐例和generation摘要在`.artifacts/business-log-list-4.2.27`，最终报告browser-final2.json、截图proof-final。复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`、原5文件及table-actions/data-table/data-table-sizing/data-table-row-events/data-table-layout的`node --test`、`pnpm test:consumer`、`pnpm exec playwright test tests/browser/business-log-list.spec.mjs tests/browser/business-log.spec.mjs tests/browser/table-actions.spec.mjs tests/browser/data-table-focus.spec.mjs --workers=2`。未跑全库套件、真实xAgent/后端或部署，库结果不代表其事件语义/操作者投影/实际页面完成。已确认的HTTP剪贴板问题单列PUBLIC_REQUESTS，未包含在本次实现中。

## DataTable无纵向溢出的滚轮链（4.2.26，2026-10-19）

xLetter反馈4.2.22长表格内部滚轮不能带动viewport的main；4.2.25源码仍无条件双轴contain。先在4.2.25正式tarball消费者的workspace＋document表格运行新wheel回归，纵向输入450后内容owner仍为0，得到预期失败，见`.artifacts/data-table-scroll-4.2.26/baseline.log`、baseline.json与results-baseline。没有切换历史checkout、修改xLetter或操作其已登录线上标签页。

修复只调整公共CSS与既有DataTable布局观察器：纵向默认auto，实际`scrollHeight > clientHeight`时contain，数据/空态/尺寸改变后重测并按原生命周期清理内部标记；无布局测量安全降级为auto。横向contain不变，无wheel监听、公开props/类型/endpoint或第二个滚动/请求owner。同步既有示例viewport模式、DESIGN/COMPONENTS/PUBLIC_API/ADOPTION及TABLE-SCROLL-001～003；宿主不需要私有DOM/CSS补丁。

构建、Token、类型、指定6文件单测52/52与正式ESM/CSS/types消费者通过；React/ReactDOM19.2.8、Base UI1.7.0单实例，无源码alias。sourceGeneration为`d102a37effd4da192ceb6760ad8669ae76b66be2cf93d39f3873a152376e7eb9`；初始JS gzip144519 bytes、关键CSS gzip22186 bytes，预算未改。浏览器最终66/66：新增滚轮合同14项，加既有布局/列宽/焦点/游标分页52项；覆盖light/dark/system、natural/document/workspace、有界/无界、少/多/空行、字体/隐藏/尺寸恢复、桌面与窄屏、200%根字号和真实Chrome200%缩放、横向wheel与LTR/RTL sticky、刷新/焦点/分页与取消。新增用例真实鼠标命中可见表体交集，不以赋值scrollTop或注入CSS证明滚轮正确。第一次修复后测试有两处向上滚轮指针落到固定页头，命中策略修正后14项完整重跑通过，原始记录保留且不重复计入最终数量。

实际查看light桌面、dark窄屏大字及真实缩放截图；viewport表体clientHeight=scrollHeight=2040时，main由0滚至450，表体scrollTop仍0，header/侧栏矩形与自身scrollTop不变。横向回归表体scrollLeft由0至114，main/content/document仍0，左右sticky列分别贴217与955的表体边界。截图、前后几何、缩放DPR/视口和逐例报告均在`.artifacts/data-table-scroll-4.2.26`。复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`、`node --test tests/data-table-layout.test.mjs tests/data-table.test.mjs tests/data-table-sizing.test.mjs tests/contract.test.mjs tests/docs.test.mjs tests/workspace-layout.test.mjs`、`pnpm test:consumer`、`pnpm exec playwright test tests/browser/data-table-scroll-chain.spec.mjs tests/browser/data-table-layout.spec.mjs tests/browser/data-table-focus.spec.mjs tests/browser/data-table-widths.spec.mjs tests/browser/data-table-cursor.spec.mjs --workers=2`。未跑全库套件、消费项目真实页面或部署；本记录不宣布xLetter已升级或现场问题已验收。

## 登录交接失败后的主动作状态（4.2.25，2026-10-19）

仅修正ConfigurableLoginPage的呈现判断：onAuthenticated抛出或拒绝后，认证事实保留，主登录按钮恢复既有submit文案并保持disabled、aria-busy=false；局部错误与retryNavigation可用。只有真正再次等待导航时显示opening。没有新增props、文案键、认证/请求owner或诊断存储；已有Controller.navigationPhase可说明交接阶段，宿主具体失败步骤仍由原owner记录脱敏固定阶段/代码，不向公共状态传递原始异常、凭据或响应体。

旧4.2.24正式消费者先运行新增断言，实际主按钮仍为“正在进入…”而预期“登录”，形成预期失败；证据为`.artifacts/login-handoff-4.2.25/baseline.log`及results-baseline。修复后指定单测67/67、正式包浏览器94/94（91项登录/布局/交接与3项light/dark/system真实浏览器200%缩放）通过。包含登录和既有会话两条路径、同步throw/异步reject、失败→pending重试→再次失败→成功；只有一次登录POST，导航重试请求集合不变，密码为空、认证仍有效、字段/按钮DOM保留、错误及重试焦点可达；桌面/390px窄屏、200%根字号和真实缩放分别检查。实际查看失败截图，未以静态截图替代请求/节点断言。

构建、Token、类型、文档检查及正式ESM/CSS/types消费者通过；sourceGeneration为`19b7f1c93801b1b491dc9766729cca2b91da14bb2ccff88a3d96bac509f5b3a6`，React/ReactDOM19.2.8与Base UI1.7.0单实例，初始JS gzip144519 bytes、关键CSS gzip22152 bytes，未调整预算。复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`、`node --test tests/contract.test.mjs tests/docs.test.mjs tests/auth.test.mjs tests/login-layout.test.mjs tests/interaction-controller.test.mjs`、`pnpm test:consumer`及`pnpm exec playwright test tests/browser/login-navigation.spec.mjs tests/browser/login.spec.mjs tests/browser/login-layout.spec.mjs --workers=2`。日志、报告与截图在`.artifacts/login-handoff-4.2.25`；未跑完整全库套件、xLead实际冷登录、BaseService集成或任何部署，不据此判定宿主最初交接失败根因。

## 临时通知归属与页面跳动自查（文档澄清，2026-10-19）

仅更新DESIGN的反馈位置/保留时间、刷新合同、ADOPTION、逐项清单与adopt-xui路由；没有修改组件、CSS、TypeScript接口、请求或认证，也未重发包，正式组件产物仍为4.2.24/e3fe0c0e的固定归档。本次将既有“临时反馈用Toast、刷新不挤动正文”的要求明确到show/hide整块通知的反例：页面级普通成功、复制完成等必须复用公共Toast；持续字段错误、失败/重试、权限阻断、未知写入与重要结果仍归所属入口，控件自身原位反馈遵守原合同，不额外重复通知。轮询不逐次报成功，不以大留白、固定提示高度、裁切或隐藏正文掩盖跳动。

新增TOAST-005～006并修订CTRL-016；检查通知出现、显示、自动关闭及手动关闭后，同范围未变化内容的几何/节点/滚动/焦点/输入与选区。清单共519项，数量不是产品验收通过数。skill只引用唯一DESIGN合同与现有检查ID，不复制另一份反馈规范或扩大每次升级范围。

验证范围为文档链接/公开入口/清单唯一性、现有docs测试、skill frontmatter/资源链接及diff格式；另人工核对普通保存/复制、字段校验失败、刷新失败、写入未知/一次性密钥及自动轮询的反馈归属，避免将所有状态一律迁到Toast。未运行组件构建、tarball、浏览器或任何消费项目页面验收；本条不证明现有产品已消除跳动。复现为`node scripts/check-docs.mjs`、`node --test tests/docs.test.mjs`、skill-creator的quick_validate.py与`git diff --check`。

## 公共链接默认无下划线（4.2.24，2026-10-18）

仅修改xui，核对最新main 54d12ec5/4.2.23仍为下划线；在其既有正式消费者的LinkedText上先运行新断言，实际收到underline而期望none，baseline报告、截图和trace保存在`.artifacts/links-4.2.24/browser-baseline.*`及results-baseline。来源xLead的4.2.20/5aeefe73实际列表按反馈登记，本轮没有访问或修改xLead，不把库复现称为产品现网复验。

4.2.24由正式base.css统一Typography.Link、LinkedText及xui/xui-layer范围内原生a的主题色与无下划线；Button link同步移除下划线及失去用途的offset，保持原hover成对前景/背景、pressed、disabled/busy和语义。正文链接仍继承所属文字槽，不新增长宽、字号、装饰props、路由或状态owner；href/target/download/rel、修饰键/中键及事件处理没有改动。已有导航/控件forced-colors选择下划线未删除，独立focus-visible保留。DESIGN、COMPONENTS、PUBLIC_API、ADOPTION及CAP-010同步，公共默认改变的兼容影响是旧页面链接外观，无接口/协议迁移。宿主升级后清理仅用于去下划线的局部覆盖，保留自己的真实品牌Token。

最终sourceGeneration `e160cba525215ca46e2721302b0a13afe23f603605924c6fbf118f671c9b4258`。build、431 Token图/指纹、typecheck、定向unit24/24及文档检查通过；110个全部正式ESM/CSS/types入口、类型正反例及正式消费者通过，无packages/src alias。三包4.2.24，React/ReactDOM19.2.8、Base UI1.7.0各单实例，peer-paths-final.log保存实际安装路径。consumer-final.json/performance-final.json与各门禁日志位于`.artifacts/links-4.2.24`；初始JS gzip144519/153600、critical CSS22152/22272，所有预算保持不变。

最终正式包浏览器21个唯一用例全部通过，无失败、跳过、重试或flaky；browser-accepted.json为17项，browser-zoom-links.json为4项，逐案及报告SHA见case-summary.json。新链接9项覆盖六preset×light/dark/system、1280/390、长中文与200%根字号、Typography.Link/LinkedText/范围内原生a主题色与字体继承、默认/hover/按下/键盘focus无下划线、可见焦点环、Enter/实际指针锚点导航、访问外链后的显示及noopener/noreferrer/window.opener=null。Button link既有8项覆盖light/dark/system的两种系统有效色、1280/320及200%根字号，默认/hover/按下/键盘focus的文字实际合成对比度均≥4.5:1，图标继承、disabled不执行、busy仍可执行和anchor的Enter/Space区别保留；另有Typography角色3项、LinkedText既有分词/React元素/外链和行隔离1项回归。

三种模式分别使用真实Chrome设置200%，记录DPR加倍、CSS视口减半、根字号不变、CSS zoom=1/pinch=1，保留键盘焦点及无页面横溢出。主线程查看了最终浅色、深色窄屏大字和真实zoom截图；内置浏览器实际点击消息标题、Tab进入正文URL后保存proof/links-iab-light.png。访问后样式结论来自正式CSS合同与实际外链打开后的截图；不读取浏览器私有历史，不把getComputedStyle当作:visited隐私探针。没有改变链接的安全解析、认证或请求协议。

复现：`pnpm build && pnpm check:tokens && pnpm typecheck`；`node --test tests/contract.test.mjs tests/docs.test.mjs tests/display.test.mjs tests/text-links.test.mjs`；`node scripts/check-docs.mjs && pnpm test:consumer`。完整consumer结束后，`pnpm exec playwright test tests/browser/link-defaults.spec.mjs tests/browser/button-link-contrast.spec.mjs tests/browser/display-foundation-contract.spec.mjs --grep-invert 'genuine.*browser' --workers=2`；再以link-defaults/public-capabilities两文件和`--grep 'safe LinkedText|public links.*genuine browser' --workers=1`运行4项。归档使用`pnpm archive --evidence .artifacts/links-4.2.24`与archive:verify，固定manifest、public-api、sourceGeneration和SHA256SUMS自动生成核验。

未跑全仓unit/browser、watch/cold-start、Firefox/WebKit、实体设备/读屏器或任何消费项目真实页面、升级、后端及部署；未新增正文装饰分支或消费者私有皮肤。本轮版本只递增末位到4.2.24。

## 四类默认完整页面与配置接入（4.2.23，2026-10-18）

仅修改xui，核对main e595a683/4.2.22已有AdminSetupPage、ConfigurableLoginPage、BusinessLogExplorer、ApiKeyManager及配套Controller/client；没有重复实现整页或增加UI包装器。4.2.23在默认config.json增加pages展示配置，公开/config和根入口提供DefaultPagesConfig、resolveDefaultPages；继承app品牌/Logo和router.basePath，投影到原组件config/options/labels/pagination。保留旧配置及旧手写XuiConfig可省略pages。JSON校验拒绝端点、权限、初始化状态、歧义URI、重复路径和无效分页；纯函数无Window、路由注册、服务实例或IO。主题、认证、请求、查询及权限owner未改。

DESIGN、PUBLIC_API、COMPONENTS、ADOPTION、DEFAULT-PAGE-001～008和adopt-xui默认页面专项同步；共516项接入检查是合同条目数量，不是516个产品页面的通过数。业务已启用且无已确认特殊要求时使用完整公共页，品牌/文案/slot配置不构成重新拼页理由；公共缺口交xui，不在前端转换标准协议。专项只加载命中页面的接入/请求/slot检查，不扩为每次全项目迁移。管理员初始化尚无统一BaseService HTTP合同，继续使用权威state/onCheck/onSubmit，不猜URL、伪造初始化授权或自动重放。可转交任务已在[维护清单](PUBLIC_REQUESTS.md#baseservice-管理员初始化合同提示词)列明安全首次授权、原子提交、并发唯一性、未知结果核对和密码清理；本轮没有修改BaseService或消费项目。

最终sourceGeneration `a17a4b5529afe2bd524f4574e1f5d540db21bbfc6eb58f51d5356f08d65d5c74`。build、431 Token图/指纹、typecheck、定向unit90/90、文档链接与skill校验通过；全部110个正式入口的ESM/CSS/types和正反类型夹具通过，bootstrap-types直接把配置投影传给四个原公共入口。独立消费者`.consumers/current/react`安装三个4.2.23正式tarball，React/ReactDOM19.2.8、Base UI1.7.0单实例，无packages/src alias；receipt、性能及peer证据位于`.artifacts/default-pages-4.2.23/consumer-final.json`、performance-final.json与peers-final.json/peer-paths-final.log。

首次正式consumer在Clipboard gzip4556/4096失败，consumer.log保留，未把它算作通过。实测新增全局默认JSON与校验使该入口由4075增至4556（+481）字节；未带入默认页投影运行代码、UI、HTTP或认证实现。窄服务预算为这项配置能力有界增加512到4608，其余依赖排除、Button/初始JS/CSS门禁不变。重建后四个窄入口clipboard/theme/i18n/menu-service分别4556/4264/3722/3958，初始JS144519/153600、critical CSS22163/22272，正式consumer通过，日志为consumer-release.log。候选类型检查曾发现递归JSON快照到覆盖类型的展开过深，已允许resolveConfig/resolveDefaultPages直接接受只读配置；最终类型及正式夹具通过。

正式包浏览器57个唯一用例全部通过，无失败、跳过、重试或flaky；browser-accepted.json含53项，browser-zoom.json含4项，逐案与报告SHA见case-summary.json。四个现有示例的?defaults配置接线16项，其余41项回归原bootstrap与四页：light/dark/system、桌面/390px、根字号200%、品牌/标题、输入校验、键盘、稳定焦点、错误/取消/迟到、登录固定facade、初始化串行写入/未知结果不解锁/密码清理、Key单次secret与客户端分页不额外请求、日志快照游标与刷新保行。示例沿用原合成transport/回调；没有真实账户、秘密或后端部署。真实Chrome设置200%逐页记录DPR加倍、CSS视口减半、根字号不变、CSS zoom=1/pinch=1，不以文字放大冒充浏览器zoom。

主线程实际查看浅色登录、深色初始化、窄屏大字日志/Key与真实zoom截图；内置浏览器指针操作Key下一页后呈现旧记录、未知事实与禁用撤销，截图为proof/default-key-iab.png。无新皮肤或Token变更，本轮没有把既有Stitch设计复核称为新增视觉审查。

复现：`pnpm build && pnpm check:tokens && pnpm typecheck`；`node --test tests/default-pages.test.mjs tests/config-services.test.mjs tests/service-modules.test.mjs tests/contract.test.mjs tests/docs.test.mjs tests/auth.test.mjs tests/admin-setup.test.mjs tests/api-key-v2.test.mjs tests/business-log.test.mjs`；`node scripts/check-docs.mjs && pnpm test:consumer`。完整consumer结束后，以default-pages/bootstrap/login/admin-setup/api-key/business-log这六个tests/browser/*.spec.mjs运行`pnpm exec playwright test <文件列表> --grep-invert 'genuine.*Chrome|genuine.*browser|actual browser|real browser' --workers=2`；default-pages以`--grep 'genuine.*browser' --workers=1`单独验真实zoom。归档使用`pnpm archive --evidence .artifacts/default-pages-4.2.23`与archive:verify，manifest、public-api、sourceGeneration和SHA256SUMS自动生成校验。

未跑全仓unit/browser、watch/cold-start、Firefox/WebKit、实体设备/读屏器及任何产品真实页面、BaseService集成、升级或部署。默认初始化HTTP接线仍依赖BaseService正式合同，不据公共合成样板宣布产品初始化或联调完成；版本仅递增末位到4.2.23。

## StructuredLogExplorer 查询布局与草稿语义（4.2.22，2026-10-18）

核对最新main 4.2.21（3df9d4e）仍使用Disclosure/Grid。4.2.22将完整Explorer的查询区域统一为QueryForm/QueryField：primary摘要、compact等级常显，其余条件进入原filters OverlayController的advanced/FormGrid，动作与已提交summary归公共槽位。新增可选pageToolbar，保留headerActions；原service、ViewController.draft、HTTP adapter、可选records、分页/快照、取消/迟到及详情owner不变。短枚举视图选择器沿用compact Token，显式退出Toolbar的伸展和标准字段最小宽度。没有新皮肤、Token、请求owner或消费项目修改。

“重置草稿”只恢复最近提交filter，native form.reset/Space/Enter均不请求、不取消在途读取，不修改service状态、结果节点、游标、快照或错误；“清除筛选”保留显式空范围查询语义，仅经同一service提交一次当前视图首段，组内模式仍携带group_id。刷新只读取已提交filter，不提交草稿。两个新文案resetDraft/appliedFilters可翻译，旧手写Controller.labels省略它们仍有英文默认。旧“清除筛选”会查询不是HTTP故障，准确行为和接线见[组件合同](COMPONENTS.md#structuredlogexplorer-查询与槽位4222)及LOG-QUERY-001～008。

最终sourceGeneration `721f55305bcc6108f0ae4c4ee5d33e13fdabee47433c6f2d2f5aa01716acd9ed`。build、431 Token图/指纹、typecheck、定向unit64/64和110个全部正式入口ESM/CSS/types、类型正反例通过。独立消费者 `.consumers/current/react` 安装三个4.2.22 tarball，React/ReactDOM19.2.8、Base UI1.7.0各单实例，无packages/src alias。receipt/performance为 `.artifacts/structured-log-query-4.2.22/consumer-final.json` 与performance-final.json，初始JS gzip143908/153600、critical CSS22163/22272，预算没有调整。文档逐项清单508项是合同检查数量，不代表508个产品页面已验收。

本代正式包浏览器86个唯一用例全部通过，无最终失败、跳过、重试或flaky。browser-accepted.json含80项，browser-zoom.json含6项；逐案及报告SHA在case-summary.json。新查询19项、既有StructuredLog/列布局/QueryForm/集合刷新回归67项，覆盖借用service与注入ViewController、中英文、长中文、light/dark/system、1280/390/320、200%根字号、字段净宽与多行动作末行对齐、唯一form、slot位置、高级条件草稿/关闭回焦、非法条件、纳秒及显式offset原样保留、分组和组内清除、刷新保行、取消/迟到、权限/错误/详情回焦。没有通过force click、缩字号或私有CSS完成验收。

`?network&grouped`以真实浏览器fetch和POST、官方HTTP adapter连接拦截响应，real-post-wire.json记录首次查询、提交text、清除text=null三次请求；中间编辑和重置零请求。默认示例仍是注入transport的合成观察，不连接业务后端。真实Chrome设置200%分别覆盖查询和原列布局的三种模式，zoom事实记录DPR×2、CSS视口减半、根字号不变、CSS zoom=1/pinch=1；不把根字号放大冒充浏览器缩放。主线程查看最终浅色桌面、深色窄屏大字与真实zoom截图，并在内置浏览器实际提交、修改和重置；proof/query-iab-light.png对应本代。长页fullPage截图可能把原视口外的fixed skip link拼入图中，另存viewport截图及几何证明其实际bottom=-68、未获焦且在可视区域之外。

候选过程保留，不累计为最终通过：首轮把多行动作的首个按钮底边当成动作组底边，改为按既有公共布局验证整个组的末行并补清规范。随后真实测量检出Toolbar默认flex伸展及240px字段下限分别覆盖compact宽度，已在Explorer的该Field退出这两个默认约束，最终桌面三模式均为192px上限。候选三轮各77通过/3失败及trace/截图保留在browser-first、browser-width-candidate、browser-min-width-candidate与对应results；最终86项全部来自上述最终generation。

复现：`pnpm build && pnpm check:tokens && pnpm typecheck`；`node --test tests/contract.test.mjs tests/design-value-guard.test.mjs tests/docs.test.mjs tests/interaction-controller.test.mjs tests/query-page.test.mjs tests/structured-log.test.mjs tests/structured-log-query.test.mjs`；`node scripts/check-docs.mjs && pnpm test:consumer`。完整consumer结束后，在既有4173预览上运行 `pnpm exec playwright test tests/browser/structured-log-query.spec.mjs tests/browser/structured-log.spec.mjs tests/browser/structured-log-columns.spec.mjs tests/browser/query-page.spec.mjs tests/browser/collection-refresh.spec.mjs --grep-invert 'genuine.*Chrome|genuine.*browser|actual browser' --workers=2`；另以两个structured-log-query/structured-log-columns文件及 `--grep 'genuine.*Chrome|genuine.*browser' --workers=1` 验真实zoom。归档使用 `pnpm archive --evidence .artifacts/structured-log-query-4.2.22` 并archive:verify，manifest、public-api、sourceGeneration和SHA256SUMS由既有流程自动生成核验。

未运行全仓unit/browser、watch/cold-start、Firefox/WebKit、实体设备/读屏器或任何产品真实页面、后端、升级和部署。不宣布xQuant或其他产品已完成，不通知其他项目必须升级；保留已有认证和请求合同，仅末位升级到4.2.22。

## 公共图表与无图标紧凑导航（4.2.21，2026-10-18）

仅修改xui，三包与DESIGN统一4.2.21。新增公开React `/chart` 的 LineChart、BarChart、PieChart 及对应类型，runtime `/chart` 仅提供数据类型、校验、笛卡尔域/归一化和饼弧计算；根入口同步导出，正式CSS可选 `critical.css + chart.css` 或完整style。复用Card、DataRegion、LoadingState/EmptyState/ErrorState、ScrollArea、DataTable和现有六个分类色，未引入图表依赖、原生UI、请求/缓存/业务状态owner。新增9个集中几何Token与三个精确限定到chart.tsx的数据几何例外，不放宽普通控件颜色/字号门禁。COMPONENTS、PUBLIC_API、ADOPTION及CHART-001～014同步，导航补NAV-FALLBACK-001～002，接入清单共500项。

NavigationMenu缺省icon的收起态由同一三横线改为真实名称缩写：中文两个完整grapheme、英文多词首字母、首个emoji完整保留；展开与窄屏显示完整名称。完整label/title、显式icon/resolveIcon、disabled/selected/warning、独立分支/配置/右键、原Controller与路由行为保持。不猜业务图标或生成新动作；同前缀仍需宿主用现有显式图标消歧。没有修改任何消费项目。

Stitch在既有会话完成图表slot、分类色与非颜色标记、宽度/缩放、状态和无图标回退的文字复核，原始记录为 `.artifacts/charts-4.2.21/stitch-{review,final,errata}.txt`。图稿中的Donut、虚构指标/导出没有实现；最终勘误明确全零饼图复用居中EmptyState、不画圆环，读值在就近固定内容槽、没有浮层。Stitch未查看最终工程截图或运行测试，其文字确认不当作工程验收。

最终sourceGeneration `d8723c9fe1bf50b42434cda31751872b3db0aaac700048c9be152a59b1ad5592`。build、431 Token图/指纹、typecheck、定向unit38/38、全部110个正式入口ESM/CSS/types与正反类型夹具通过。独立消费者 `.consumers/current/react` 安装三个4.2.21 tarball；React/ReactDOM19.2.8、Base UI1.7.0保持单实例，chart metafile的287个输入均来自正式消费者，无packages/src alias。完整示例 `examples/charts-react/app.tsx` 沿用一个现有Resource和内存合成数据；没有真实业务API、隐式时区或总数。

最终正式包浏览器90个唯一用例全部通过，无最终失败、跳过或重试：browser-accepted.json的86项加browser-zoom.json的4项，逐案和报告SHA见case-summary.json。新图表/回退导航47项，相关rich-navigation、navigation-selected、query-page、page-composition回归43项。覆盖六preset×light/dark/system、系统实时变化、自定义Token、桌面/320/390、长中文、根字号200%与公开界面比例125/150/200%、RTL、null断线、零/负柱、单项/全零饼、有限极值、完整数据表、中英文、键盘/指针/触屏仿真、稳定ID更新/移除、局部横滚、Observer释放和forced-colors。普通文字实测合成对比度≥4.5，示例系列图形≥3；全数据还有公共表格入口。

首次/未查询/空/错误反馈在组件区域居中；同范围刷新或失败保持原SVG/点节点、焦点、横滚和图形位置，单一Resource请求计数准确；范围切换清旧值并验证取消/迟到隔离。真实Chrome设置200%分别覆盖图表三模式及导航抽屉，记录DPR加倍、CSS视口减半、根字号不变、CSS zoom=1/pinch=1；不同于文字放大。主线程已查看最终浅/深色、窄屏长中文大字和真实zoom截图，并在内置浏览器实际点击收起导航及图表导航；图片与缩放事实在proof。

候选失败保留：首轮36通过/3失败，发现窄屏仍显示缩写，已限于桌面compact显示。第二轮33通过/10失败，新断言检出边点未完整揭示及顶部刻度越界9px；原因是图表选用ScrollArea的inset模式按合同清零padding，改回默认gutter让集中Token留白生效，九组窄屏边界通过。RTL窗口改变后边界检查一度未等待ResizeObserver的新几何；独立五次通过没有累计为验收，最终明确等待首类别标签/点对齐，再严格检查Home/End点位在本图可视边界。之前候选仅作过程证据，90项全部来自最终generation。

正式receipt/performance在consumer-final.json与performance-final.json：初始JS gzip143908/153600，critical CSS22163/22272，图表示例JS150365/153600、critical+chart合包CSS22046/24576。相对4.2.20实测critical CSS22016增加147字节，预算为本功能有界增加256；Button/窄Service上限保持，chart配方未进入critical。正式manifest、public-api、sourceGeneration和SHA256SUMS继续由archive自动生成与校验，不手补元数据。

复现：`pnpm build && pnpm check:tokens && pnpm typecheck`，`node --test tests/chart.test.mjs tests/contract.test.mjs tests/design-value-guard.test.mjs tests/docs.test.mjs tests/navigation-fallback.test.mjs tests/navigation-labels.test.mjs`；`node scripts/check-docs.mjs && pnpm test:consumer`。consumer完成后对charts、navigation-fallback、rich-navigation、navigation-selected、query-page、page-composition这六个tests/browser/*.spec.mjs运行 `pnpm exec playwright test <文件列表> --grep-invert 'genuine.*Chrome|genuine.*browser|actual browser' --workers=2`；charts和navigation-fallback另以 `--grep 'genuine.*browser' --workers=1` 验真实zoom。归档使用 `pnpm archive --evidence .artifacts/charts-4.2.21` 和archive:verify。

未跑全仓unit/browser、watch/cold-start、Firefox/WebKit、实体触屏设备、读屏器或完整hydration验收；SSR仅验证静态输出无DOM访问。未执行消费项目真实页面/后端/升级/部署，也未通知项目必须升级。现有接口保留，新图表可选采用；缺省icon的compact视觉变化由本版统一提供。

## 新接入与升级流程固化（文档与 skill，2026-10-18）

仅修改 adopt-xui 的入口/界面元数据、ADOPTION、ADOPTION_CHECKLIST 和本记录。接入手册统一范围盘点、固定产物、逐页 layout/slot 映射、状态/请求接线、实际页面验收和交付条件；skill 路由到同一流程，新增 FLOW-001～006，清单共484项。组件默认值、类型、ESM/CSS、DESIGN 与三包版本保持4.2.20；手册原先残留的“当前4.2.13”改为核对目标正式manifest，避免历史说明冒充最新版本。

`node scripts/check-docs.mjs`通过12份文档、1597个相对链接、107个公开入口及484项清单；`node --test tests/docs.test.mjs`通过2/2，含公开入口缺失/虚构、清单重复/缺少操作结果/缺少合同来源的负向检查。skill-creator 的 `quick_validate.py .agents/skills/adopt-xui` 与 `git diff --check`通过；新增/变更链接的31个文内锚点另行核对通过，界面short_description为36字符。

主线程按六类请求静态走查流程：完整新接入须盘点全部实例；已有自定义主题的升级保留品牌/owner；限定单页改造只验授权范围且手动查询归入QueryForm；公共缺口列举交给xui并继续独立工作；缺少后端wire前置不得在前端加兼容层；主题专项和只读评审不触发完整迁移。四种结果、未跑不能报通过和库样例不能代替产品验收均已明确。这是文档场景走查，不是消费项目执行证据。

重算构建输入sourceGeneration仍为 `60ce89b93d91b1e38019f1986caf4ca6f4225d07ca3adaef0b03dbdb0def49bf`。本次未重建/重归档4.2.20包，未重跑UI浏览器、全仓测试或任何消费项目；既有正式包验收见下节，不把它计作本次新增产品验收。未修改、通知或部署其他项目。

## 手动查询页公共编排（4.2.20，2026-10-18）

仅修改xui，三个正式包及DESIGN统一4.2.20。本轮新增QueryForm/QueryField（既有/search-toolbar及根入口）、DataTable可选idleState、EmptyState可选align/icon；原SearchToolbar和EmptyState默认排版保持。QueryForm复用既有Field/Surface样式和SearchToolbar的唯一disclosure Controller，负责原生form、fields/actions/advanced/summary槽位与宽度/四轨对齐，不增加查询、HTTP、认证、时区或业务owner。未确认数据时DataTable/CardGroup的可见计数与aria名称不再填造0；确认空结果与同范围刷新/失败仍保留真实计数。该阶段页脚是否显示可能改变，真实分页事实仍归宿主。

Stitch在既有项目会话生成查询样板，并完成字段宽度、label/control/help/error四轨、两个独立单层表面、40rem净宽单列及八种状态的文字审查。原始讨论与勘误见 `.artifacts/query-layout-4.2.20/stitch-{review,final,errata}.txt`。图稿额外环境指标/耗时/节点/密度及未经提供的删除重试动作没有实现；旧HEX、强制五行骨架及表头下错误反馈的文字已勘误，采用当前Violet语义Token、既有表内居中LoadingState和正常footer错误槽。Stitch没有查看最终工程截图或执行浏览器测试，其核准不当作工程通过证据。

完整示例为 `examples/query-page-react/app.tsx` 与共享query-page-model.ts，仅消费正式公开入口，无源码alias或私有CSS；一份真实HTML form连接一个现有createResource。草稿与已提交范围分离，Enter/点击提交、重置、受控分页、详情Sheet回焦、同key保行/新key清旧值与取消迟到响应均有实测。模型是内存合成数据，不是任何产品领域API，不新增前端DTO适配层或产品查询服务。规范/公开入口/组件/接入文档和QUERY-001～022逐项清单同步，共478项接入检查。

主线程实际查看截图时发现宽表格的居中空态落到表宽中点、窄屏看不到提示；已在公共DataTable内用集中data-table-placeholder-inline-size与逻辑sticky，将idle/empty/首次error正文约束到可视表体净宽。没有让宿主测宽或穿透DOM。新增三模式用例分别覆盖三个状态、LTR/RTL、100%/200%字号与横滚两端，合计72组边界断言；提示、错误与重试均保持可读/可达。最终浅色交互、深色390px大字与真实zoom截图已查看，见proof。普通列宽、sticky、横滚与表格语义保留。

最终sourceGeneration为 `60ce89b93d91b1e38019f1986caf4ca6f4225d07ca3adaef0b03dbdb0def49bf`。build、422 Token图/指纹、typecheck、定向unit48/48、107个全部正式入口ESM/CSS/types与正反类型夹具、文档检查通过。独立安装 `.consumers/current/react` 只引用三包tarball；React/ReactDOM19.2.8和BaseUI1.7.0保持宿主单实例，peer路径证据在peers-final.log与peer-paths-final.json。消费脚本用现有main示例的符号链接及preserveSymlinks，输入SHA防写回，没有新建源码副本、分支或worktree。

本代正式包浏览器124个唯一用例全部通过，无最终失败、跳过或flaky：browser-accepted.json为118项，browser-accepted-zoom.json为6项，逐项与报告SHA在case-summary.json。覆盖新查询组合及SearchToolbar、DataTable、表格反馈/布局、CardGroup、页面/表单组合回归；新查询15项含light/dark/system、系统实时切换、320/390/768及桌面、长中文、标签/帮助/错误、按钮实际底边、200%字号、hidden/inert/草稿、Enter/Space/关闭回焦、八种状态、分页、刷新节点/几何/输入selection保持、范围隔离与取消。真实Chrome设置200%三模式分别验证查询页和既有SearchToolbar，记录DPR加倍、CSS视口减半、根字号不变、CSS zoom=1/pinch=1；不是CSS缩放或模拟截图。内置浏览器另实际指针查询并核对13条合成结果与唯一分页，最终截图为proof/query-iab-light.png。

候选阶段测试存在旧Select选择器、隐藏代理误判、InputGroup焦点绘制位置断言，以及消费者重建输出时并发访问导致404；已修正测试并按“先完整正式consumer、后浏览器”顺序重验。扩大回归还发现两处旧五行骨架断言及一处未打开Select先读选项的断言，改为验证真实居中加载，以及打开弹层后的选项与Escape回焦，没有force click或放宽可见性。前代browser-final.json的112通过/3失败与recheck3通过仅保留历史；最终以本代118+6完整报告为准，不累计重复通过。

正式receipt与性能见consumer-final.json/performance-final.json：critical CSS gzip22016/22016（较4.2.19实际21619增加397字节，原cap21760的功能预算有界增加256）；初始JS gzip143908/153600，Button/窄Service上限不变。新增六个集中Token，几何配方没有散落裸尺寸或放宽设计门禁。manifest、public-api、sourceGeneration和SHA256SUMS继续由既有归档命令自动生成校验；归档路径与提交以manifest.commit为准，不手补元数据。

复现：`pnpm build && pnpm check:tokens && pnpm typecheck`；`node --test tests/contract.test.mjs tests/query-page.test.mjs tests/search-toolbar.test.mjs tests/data-table.test.mjs tests/resource.test.mjs tests/card-group.test.mjs`；`node scripts/check-docs.mjs && pnpm test:consumer`。consumer完成且4173预览可用后，针对query-page/search-toolbar/data-table/data-table-feedback/data-table-layout/card-group/page-composition这七个tests/browser/*.spec.mjs运行 `pnpm exec playwright test <文件列表> --grep-invert 'genuine.*Chrome|genuine.*browser|actual browser' --workers=2`；query-page/search-toolbar以 `--grep 'genuine.*Chrome|genuine.*browser' --workers=1` 单独运行真实zoom。归档用 `pnpm archive --evidence .artifacts/query-layout-4.2.20` 并archive:verify。

未跑全仓unit/browser、watch/cold-start、Firefox/WebKit、实体设备或读屏器；未修改或验收任何消费项目、真实后端、升级与部署。本轮是可选公共维护，不通知其他项目必须升级。

## 紧凑通知与窄容器重排（4.2.19，2026-10-18）

仅修改xui，三包及DESIGN统一4.2.19；本轮可选维护，不通知其他项目必须升级。标准Toast.View复用同一Controller，采用Icon—Content—Close三列；新增公开Toast.Icon/ToastIconProps，显式success/error/warning/info映射语义小图标，缺省/未知中性，不根据文案猜状态、不造标题、不自动去重。Close缺省透明圆形32px触点/16px图形，保留显式children/render/ref、disabled、preventDefault和翻译名称；Title统一14/22px、500字重，Description13/20px、400。没有缩字或固定正文高度，真实Actions才有末行；仅Close的旧Actions自动同行，有实际动作的旧组合保留DOM与Tab顺序。默认宽度从借用popover-width改为独立toast-width=24rem，根16px时单项实测368×70px（本轮截图文案）；popover不改。计时默认5秒、-1常驻、暂停/回焦/优先级/身份清空保持。

Stitch在既有会话完成三列、条件操作区和极窄重排的文字评审；原始意见与修正在 `.artifacts/toast-layout-4.2.19/stitch-{review,final,narrow}.txt`，没有把其“归档”文案当作工程验收。拒绝负margin和20rem硬最小宽度。实测320px+根字号200%时，三列中段原本只有46px；本版以Viewport净宽18rem/12rem为结构断点，说明/动作跨全行，极窄时首段文字也落到图标/关闭之后的整行，Content仅使用display:contents投影。图标不隐藏，字号不回缩，不改DOM/Tab顺序；读长文仍在既有40dvh Viewport内部滚动。主线程已查看本代浅/深色、RTL大字与真实zoom截图，位于proof；Stitch没有查看最终工程截图或声称已实测。

最终sourceGeneration `aff03f3381ba0e93bff89de244197e64e8f50d74c0fd7297002f9928936617a0`。build、416 Token、typecheck、contract/toast-controller定向unit30/30、全部公开ESM/CSS/types与正反类型夹具通过，文档与456条接入检查通过。正式安装 `.consumers/current/react` 使用测试过的三包tarball；React/ReactDOM19.2.8和BaseUI1.7.0保持单实例，零packages/src alias。消费验证脚本现在仅用固定工具缓存、符号链接引用main现有示例/fixture源码，esbuild/tsc preserveSymlinks使依赖解析到独立正式安装；生成入口先解除链接再写，输入SHA验证构建没有写回main。没有创建额外工作树、checkout或维护第二份项目源码版本；包安装和编译输出仍为正常工具缓存。

正式receipt见consumer-final.json，performance-final.json记录critical CSS gzip21619/21760、初始JS gzip143867/153600；Toast布局/语义/窄屏配方及两个派生Token的独立style探针相对旧包增加407 gzip bytes，预算只为本功能有界增加512，Button/JS/窄服务上限不变。包SHA、manifest、public-api、sourceGeneration及SHA256SUMS沿用归档脚本自动生成校验，不手补正式元数据。

正式包浏览器74个唯一用例全部通过，无最终失败、跳过或flaky：browser-final.json为65项，browser-zoom.json为9项，逐项与报告SHA在case-summary.json；关键问题另复验6/6，不累计重复通过数。覆盖六套实际preset×light/dark/system的截图原文双通知、14px角色、32px关闭/无空脚、普通文字实际合成对比度≥4.5与显式语义图标，未知/无标题、真实动作、长中文、RTL、窄屏根字号200%、既有界面缩放200%、原有parts及Positioner、默认5秒/-1、暂停/手势/禁用/阻止关闭、Controller替换/StrictMode、clear/scopeKey与迟到Promise、F6/Tab/Space/Escape及草稿/回焦。真实Chrome设置200%覆盖三模式，记录DPR加倍、CSS viewport减半、根字号不变、CSS zoom=1/pinch=1。内置浏览器另实测指针关闭后仅移除对应一项，几何在geometry-iab.json。

首轮68项为46过/22失败，保留browser-normal.log与原始失败证据：18项检出标题实际继承13px，已由Toast公共文字角色修正；3项检出极窄网格内容最小宽挤入关闭列，已改为公开槽位响应重排。旧计时用例在clock.install后仍允许真实时间推进，改为pauseAt后逐段runFor，不改生产计时算法。默认Token首次构建还检出组件内裸calc除数和Token计数漂移，已将偏移集中为派生Token并同步416项/哈希；失败候选不作最终验收。没有force click、私有DOM补丁、放宽焦点或取消几何断言。

复现基础：`pnpm build && pnpm check:tokens && pnpm typecheck && node --test tests/contract.test.mjs tests/toast-controller.test.mjs && node scripts/check-docs.mjs && pnpm test:consumer`。现有preview4173后，对toast-layout、toast、public-capabilities这三个tests/browser/*.spec.mjs运行 `pnpm exec playwright test <文件列表> --grep-invert 'genuine.*Chrome|genuine.*browser|actual browser' --workers=2`；真实zoom以同文件列表和 `--grep 'genuine.*Chrome|genuine.*browser|actual browser' --workers=1` 单独运行。静态规范与文档自查不当作真实业务验收。

未运行全仓unit/browser、watch/cold-start、Firefox/WebKit、实体设备或读屏器；未修改或验收xAgent/其他产品真实页面、后端、升级和部署。不恢复原生UI，不改变HTTP或认证owner。

## 公共动作轮廓、透明展开与危险前景（4.2.18，2026-10-17）

仅修改xui，不通知或要求其他项目必须升级。IconButton/公开Button data-icon=true在各状态统一radius-full，保留24/32/36/40尺寸、SVG本身形状和命中区；带文字Button不改变。普通Menu裸Trigger、Disclosure、Accordion、SearchToolbar高级筛选、侧栏独立开关与TableExpandButton复用已有透明前景配方；显式Menu render/primary/destructive、输入边界、导航主链接选择和各自Controller保持。裸Menu.Trigger现在采用标准Button几何，不声称浏览器原裸按钮几何完全相同。Disclosure显式variant=default保留历史背景；Accordion草稿仍由原受控值/Panel keepMounted或卸载策略负责。

Button/IconButton新增可选ButtonTone（default/danger），仅为text选择前景；危险动作使用status-error-foreground，hover/pressed/expanded/busy不回品牌色，disabled沿用公共禁用前景。ApiKeyManager和StructuredLogExplorer内置表格行操作也改为text，撤销/删除带danger；确认Dialog的destructive和原CRUD/查询/权限/清密/回焦owner保留。没有TableAction新封装、业务状态或第二套CSS。

Stitch完成纯文字设计边界核准及API名词纠正，记录在 `.artifacts/expansion-actions-4.2.18/stitch-{review,final,errata}.txt`。保留现有等宽高、间距、分隔和独立焦点，没有重复增加aspect/min-width、mask或自动注入宿主已有箭头；ghost不等同text，danger不借warning，实体危险入口仍为variant=destructive。Stitch没有查看最终工程截图或宣称实测，浏览器实测由本库独立执行。

最终sourceGeneration `3b4f06c8aed3f355dae5bde3eba86c8a8e40819516cb6c9ac747c99e40f68425`，三包及DESIGN均4.2.18，正式独立安装 `.consumers/run-9fUPtk/react`。final4 build、414 Token、typecheck、8文件定向unit25/25、文档1513链接/107入口/455检查均通过；所有正式ESM/CSS/types、类型正反例、React/ReactDOM19.2.8与BaseUI1.7.0单实例及零源码alias通过。receipt/performance见consumer-final4.json和performance-final4.json；critical CSS gzip21247/21248、初始JS gzip143865/153600，未提高预算。正式fixture与根测试源码逐字节相同。

正式包浏览器171个唯一用例全部通过，无最终失败、跳过或flaky：browser-core-accepted.json为155项，browser-zoom-final.json为16项，逐案与报告SHA见case-summary.json。覆盖纯图标7变体/各状态与4size、非图标边界、停止SVG和render链接、透明展开/菜单键盘/ref/显式主动作、六套实际preset×三模式的普通与危险前景和实际合成对比度≥4.5、禁用零执行与busy独立事实、navigation warning保留与父子/配置/右键隔离、原位草稿/受控值/Controller、CRUD与日志筛选/游标/迟到/清密回归。ApiKeyManager在三模式390px/根字号200%下验证进入确认而不直接写入、Escape回原按钮；StructuredLogExplorer新增三模式390px行操作，另以既有深色390px/根200%用例核对详情可达。

Forest三模式分别验证窄屏RTL/根字号200%与真实Chrome设置200%（DPR×2、CSS viewport减半、根字号不变、CSS zoom=1、pinch=1）。未使用缩字或隐藏长标题。主线程已查看最终代次的浅色圆形按钮、浅色透明危险行操作、深色RTL根200%以及真实zoom截图，PNG与缩放事实在proof-final。该fixture为状态合同展示，不当作业务页面排版样板或消费项目已验收。

浏览器复现：对 expansion-actions、button-state-contract、button-size-contract、text-actions、search-toolbar、action-menu、navigation-tones、sidebar-reveal、api-key、structured-log 这10个 tests/browser/*.spec.mjs 运行 `pnpm exec playwright test <文件列表> --grep-invert 'actual browser|genuine.*browser' --workers=2`；对 expansion-actions、text-actions、search-toolbar、action-menu、navigation-tones、sidebar-reveal 运行 `--grep 'actual browser|genuine.*browser' --workers=1`。保持正式consumer生成的dist输出与现有本地preview；各次原始报告归档，没有把旧候选通过数并入171。

过程失败与修正保留：初始SSR测试错误要求peer的关闭Menu静态HTML带aria-expanded=false，修正为已有真实SSR合同；Accordion现有CSS箭头参与可访问名称，测试按标题前缀定位，未改变生产名称。旧candidate未同步fixture的keepMounted/后补非text对照控件，引发草稿/找不到节点失败；在同一正式安装中重新编译fixture并严格tsc，不修改包或使用src alias。新tone默认属性曾覆盖导航内部warning前景，既有navigation-tones回归检出；生产改为仅显式tone投射属性，补单测并重新构建fresh consumer，旧代次不作最终证据。中途按主线程要求中止的一次consumer（exit130）仅保留日志，没有伪造receipt。

真实zoom菜单旧测试在指针打开后直接发End，错误假设焦点已进入菜单。过程曾怀疑浏览器进程混用，但独立运行仍失败；zoom-focus.json实际记录document.hasFocus=true、activeElement仍为触发器，不能把“菜单项inactive”解释成文档失焦。测试改为等待菜单可见，使用公开ArrowDown进入，再严格断言首项、End末项、Enter和Escape回焦；没有force click、直接focus菜单项、放宽断言或修改生产键盘逻辑。普通page与真实Chrome设置zoom分开运行，所有失败截图/trace/JSON保留，单次偶然通过不作为根因证据。

复现基础门禁：`pnpm build && pnpm check:tokens && pnpm typecheck && node --test tests/contract.test.mjs tests/button-disabled-contract.test.mjs tests/button-xs-contract.test.mjs tests/expansion-actions.test.mjs tests/search-toolbar.test.mjs tests/navigation-labels.test.mjs tests/navigation-slots.test.mjs tests/table-actions.test.mjs && node scripts/check-docs.mjs && pnpm test:consumer`。浏览器按case-summary.json对应的file/title去重；正式manifest/public-api/sourceGeneration/SHA256SUMS仍由archive脚本自动生成并验证。

未运行全套unit/browser、watch/cold-start、其他浏览器引擎、实体设备/读屏器或任何产品真实页面、后端和部署。不恢复原生UI，仅保留既有TypeScript数据/Service合同；不以本库验收宣布产品已升级或要求产品升级。


## 透明动作与导航语义完整交付（4.2.17，2026-10-17）

最终包含两项独立实现：Button/Disclosure 的可选 text 动作，以及 NavItem/NavigationItem/NavigationMenu/MenuLayout 的可选 text 呈现与条目 warning 前景。均复用已有 Controller、字体、尺寸、focus/disabled、路由和槽位，不改消费项目或发出升级通知。缺省导航、ghost/link 和普通 Disclosure 的外观保持；warning 只投射宿主事实，不增加等待业务枚举或查询 owner。用户最后要求透明背景，已覆盖此前 warning soft 建议。Stitch 的最终文字核准保存在 `.artifacts/semantic-actions-4.2.17/stitch-transparent-navigation.txt`；实际截图由主线程检查，不声称 Stitch 已查看最终工程截图。

最终 sourceGeneration `b935ed626e94109303e1cc68ebe6cb8780da03f9bb3a7acb6105847db5fb38e7`，正式独立安装 `.consumers/run-Rmyom9/react`。build、414 Token、typecheck、6文件定向unit 27/27、448项接入检查/1500文档链接均通过。107个公开ESM/CSS/types入口、正式类型正反例、React/ReactDOM/Base UI单实例与零源码alias、服务依赖门禁通过；receipt为 `navigation-stage/consumer-final2.json`，测量为 `performance-final2.json`。CSS gzip21226/21248，新增透明导航与首行Icon配方相对前置cap多42bytes，给本功能有界+64；初始JS gzip143841/153600，Button及窄服务预算不变。此前第一项候选仅作独立提交证据，完整正式归档以本段generation为准。

正式包浏览器68个唯一用例全部通过，无最终失败、跳过或flaky：新导航29、透明动作24、既有rich-navigation 5与navigation-selected 10。`navigation-recheck.json`10项、`browser-regression.json`58项覆盖完整集合；`navigation-marquee.json`额外重验1项并保存减少动态效果切换前的截图，69次执行去重为68，逐案见 `case-summary.json`。验证六种实际preset×light/dark/system的普通/hover/pressed/选中/展开/disabled，透明背景、警告优先前景、图标继承与普通文字实际合成背景对比度≥4.5；独立配置/右键不导航、Enter/Space单次动作、roving焦点、准确aria、普通与警告切换保留节点/Controller/展开/草稿。禁用阻断、按钮渲染的NavItem与转发props/ref的ContextMenu链接通过；分组、子项和配置按钮不继承tone。减少动态/触屏完整静态名称、名称单独marquee和不收缩Icon、compact揭示不改变collapsed或触发折叠回调均通过。

Forest三模式覆盖390px/RTL/根字号200%及三模式真实Chrome设置200%：DPR加倍、CSS viewport减半、根字号不变、CSS zoom=1、pinch=1；检查长名称、首行警告图标、分支/配置动作、独立focus和关闭回原触发器。主线程已查看深色RTL根200%、浅色真实zoom、正常marquee和减少动态静态退路截图，PNG见 `proof-final`。没有通过缩字号、隐藏名称或消费者私有CSS完成验收。

过程失败单独保留：最初新增data-tone/data-variant未补cloneElement的元素属性声明导致构建失败，已补类型后通过；consumer first.log/second.log的clipboard预算分别4128/4096与4098/4096，收拢同一入口的无效导航校验与异常文字，全部校验仍在，未提高窄服务门槛，freshconsumer已通过。浏览器首轮在窄屏错误查找桌面的“展开导航”，实际公开按钮名为“工作导航”；停止余下同类等待后修正测试locator，3模式根200%及真实zoom全部复验。首轮被中止未生成完整JSON，不计入通过总数，失败截图/trace仍在navigation-first-run；未为测试更改生产按钮名称。

复现：`pnpm build && pnpm check:tokens && pnpm typecheck && node --test tests/contract.test.mjs tests/navigation.test.mjs tests/navigation-labels.test.mjs tests/navigation-slots.test.mjs tests/navigation-tones.test.mjs tests/config-services.test.mjs && node scripts/check-docs.mjs && pnpm test:consumer`；`pnpm exec playwright test tests/browser/text-actions.spec.mjs tests/browser/navigation-tones.spec.mjs tests/browser/rich-navigation.spec.mjs tests/browser/navigation-selected.spec.mjs`。正式manifest/public-api/sourceGeneration/SHA256SUMS继续由既有archive脚本自动生成及校验。

未跑全套unit/browser、watch/cold-start、其他浏览器引擎、实体设备/读屏器、xAgent及其他产品真实页面/业务后端/部署；触屏为浏览器仿真。没有原生UI实现或新增持久化状态，只有既有TypeScript数据合同。此发布可选采用，不要求任何消费项目必须升级。

## 透明文字动作（4.2.17 第一项阶段，2026-10-17）

只修改xui。Button/Disclosure新增可选variant=text，复用原状态/焦点/大小/字体owner，各状态透明，强调仅前景；普通ghost/link/Disclosure不变。Stitch文字审查及最终边界确认见 `.artifacts/semantic-actions-4.2.17/stitch-{review,final}.txt`；按用户明确要求保留独立focus，未采用其先前改warning焦点环、加入渐变mask或要求宿主补Disclosure间距的建议。

4.2.16正式consumer单独复现原ghost/Disclosure hover有底色1/1（合法既有行为，属于新增可选外观缺口，不称默认失效）。第一项候选sourceGeneration `d6dcbb1c88142504620c98e650fbd0c8c7374e0338ddb7d1c34b8bab2364842c`，正式安装 `.consumers/run-jF4Xq4/react`。build/414 Token/typecheck/定向unit21项/文档444项、107个ESM/CSS/types入口与peer单实例/零源码alias通过；CSS gzip21115/21184，新增两独立CSS入口配方相对旧cap多59bytes，给该功能有界+128，JS/Button/service门槛不变。证据位于text-stage。本候选仅用于第一项独立提交，最终包含导航能力的正式源与归档见后续同版本完整验收，不能混代使用。

正式包text-actions定向浏览器24项通过：六种实际preset×light/dark/system的default/hover/pressed/expanded/disabled、Enter/Space单次调用、同节点、尺寸、独立focus及>=4.5:1实际合成背景文字对比；forest三模式下390px/RTL/根200%长标题、草稿、受控关闭回焦；三模式真实Chrome200%（DPR×2、viewport减半、根字号不变、CSS zoom=1、pinch=1）。示例最初只接受两种preset，补齐正式六种并增加根属性断言后重编译、重新验收；不能把参数本身当成配色已生效。原始记录text-first.json与修正后text-final.json分别保存。实际查看浅色Forest与深色RTL根200%、真实缩放截图。未运行全套unit/browser、其他引擎、读屏器、真实设备或消费项目；未通知其他项目升级。

## 紧凑导航临时揭示、页脚中心与默认宽度（4.2.16，2026-10-17）

仅修改 xui，不要求或通知其他项目必须升级。xAgent 固定4.2.14/bbe98dd的反馈只用于公共复现；本轮不改任何消费项目、认证、HTTP或业务 owner。Stitch 纯文字审查确认192–224px/16vw方向、150ms交互宽限、无正文backdrop、自然换行与页脚中轴；已纠正其固定两行高度、passive事实缩写及错误规范版本建议。记录为 `.artifacts/navigation-preview-4.2.16/stitch-{review,final}.txt`；不声称 Stitch 查看了最终截图。

AppShell/MenuLayout 新增默认 true 的可选 `sidebarRevealOnHover`。桌面 fine pointer hover/键盘焦点临时揭示同一侧栏，正文轨道不重排；collapsed/expandedIds、选中、草稿、滚动、回调与storage不被改写。侧栏/footer派生的公共React portal共同维持指针/焦点归属；Escape先关popup，再收预览回唯一开关；卸载清理。粗指针/窄屏仍显式操作，false退出。页脚合法Button/passive/Toolbar/Icon嵌套恢复同一中轴，按钮默认最小36px、图标16px；默认展开宽度有意改变，旧宽度可按公开min/max/width根Token保留。

旧正式4.2.14独立安装 `.consumers/run-VbJaAA/react` 用同一组合单独复现1/1通过：1280/1920宽分别240/288px、compact60px不揭示，license图标偏离return/update中轴。`baseline.json` 绑定对应安装的metafile与实际几何，不作新版本通过数。

最终包 sourceGeneration `63b98b0e606bc2a0c07fe6e5faad39880cbd5a21e51a458c620a1877e24f93da`，三包均4.2.16，正式安装 `.consumers/run-YMye1b/react`。build/typecheck、414 Token、文档441检查、定向unit21/21及107个正式ESM/CSS/types入口、React/ReactDOM/Base UI单实例/零源码alias均通过。日志/receipt在 `.artifacts/navigation-public-4.2.16/`；示例自身只用公开组件与正式CSS，正文辅助动作放Toolbar，不拉成满宽主操作。

最终定向浏览器26/26通过（sidebar-reveal 17项、sidebar-width 9项），无未解决失败/跳过。原始 `accepted-final.json` 的24项通过，加 `accepted-final2.json` 的两种Shell真实Tab修正后2/2，按file/title逐case覆盖汇总为 `.artifacts/navigation-preview-4.2.16/browser-accepted-summary.json`，保留原始报告和SHA；最终示例已将辅助动作移入Toolbar。覆盖两种Shell组合、hover、真实Tab、键盘聚焦/Escape、受控拒绝/确认、独立Footer动作一次执行及passive零动作、同节点/Controller/草稿/滚动/storage、portal焦点与Dialog层叠命中、移除焦点节点/卸载、禁用预览、触屏、RTL、light/dark/system、800/1280/1600/1920宽、390窄屏与200%根字号。默认展开几何192/204.8/224/224px，800/根200%时384px且正文416px；compact60px，footer SVG中心30px。light/dark/system三种真实Chrome设置200%缩放单独校验DPR×2、CSS viewport减半、根字号不变、CSS zoom=1、pinch=1，并检查抽屉末端操作与回焦。实际查看浅色hover/compact、200%长中文、深色RTL窄屏和真实zoom截图，PNG/JSON见proof。

过程失败保留：contract仍期待旧版本、清单新行列数错误已修；初版touch测试写后立刻读几何，改为等待真实呈现后通过；新增真实Tab测试最初漏算开关之后的全局主题按钮，纠正为按真实DOM顺序经过主题按钮再进入侧栏，未修改生产焦点行为；原宽度测试把4.2.9较宽栏的“四短Tab单行”当永久合同，新较窄下限允许自然两行，最终仍严格检查全文可读、边界、状态和键盘。未为通过测试缩字号、加宽新下限或裁标签。初次CSS超旧20992预算39bytes，去除多余几何后为21026；新增预览层/宽限Token相对旧cap仅34bytes，给本功能有界+64cap21056。初始JS143778/153600，Button/service预算不变。

复现：`pnpm build && pnpm check:tokens && pnpm typecheck && node --test tests/contract.test.mjs tests/navigation.test.mjs tests/navigation-labels.test.mjs tests/navigation-slots.test.mjs && node scripts/check-docs.mjs && pnpm test:consumer`；`pnpm exec playwright test tests/browser/sidebar-reveal.spec.mjs tests/browser/sidebar-width.spec.mjs`。归档复用既有自动manifest/public-api/sourceGeneration/SHA256SUMS流程。

未跑：全套unit/browser、watch/cold-start、Firefox/WebKit、真实设备/读屏器、xAgent及其他产品实际业务页面/后端/部署。合成公共组合不能代替产品验收；runtime只有既有TypeScript Controller，不恢复原生UI。正式版本仅末位递增，不维护兼容分支。

## 四项按需公共能力（4.2.15，2026-10-17）

仅修改 xui，保留已有 API 与默认行为，不通知或要求其他项目必须升级。新增安全正文链接（纯解析、UtilService、LinkedText）、同队列的 Toast.View 与 scopeKey/clear、单 Resource 的模块/CSS lease、同 ThemeService 的绘图颜色适配。没有新增默认配色、CSS皮肤、认证/查询/通知/主题 owner。四项接口、单位、清理与限制见 [PUBLIC_API](PUBLIC_API.md#安全正文链接)，逐项接入对应 CAP-001～009。

最终 sourceGeneration 为 `c6d1384cea8ae297bd8a3035b3420e2c0a6105a22bab933353fb065281cea800`，正式独立安装目录 `.consumers/run-CUTgfs/react`。源码/类型、413 Token、文档与434条接入检查均通过；unit 598/598，包括新增URL/原文保留、大文本、通知clear/迟到Promise、CSS共享lease/跨Document/取消/超时/重试/刷新/销毁、SSR与原Link兼容。正式107个ESM/CSS/types入口及React/ReactDOM/Base UI单实例、零源码alias、bundle门禁通过；关键CSS gzip20,992/20,992、初始JS142,815/153,600 bytes，未放宽预算。最终日志为 `.artifacts/public-capabilities-4.2.15/*-final2.log`，正式receipt为 `consumer-final2.json`。manifest、metadata/public-api.json、sourceGeneration 和 SHA256SUMS 由既有 archive 命令自动生成及校验，不手工补元数据。

正式包浏览器 `browser-final2.log` 113/113通过，无失败或跳过：新增public-capabilities 13项与既有Toast/Display/Foundation/Theme presets/Theme session 100项回归。同一批覆盖light/dark/system、桌面1280/1600及320/390窄屏、长中文、200%根字号、三主题真实Chrome设置200%缩放；新能力缩放事实为DPR加倍、CSS viewport减半、根字号不变、CSS zoom=1、pinch=1。新场景实测链接原文/数值/React元素/默认新标签与opener隔离、键盘Enter和行click隔离，中文/英文通知动作与F6/Escape回焦，scopeKey同步去除active/ending文案且Promise不复活，CSS失败重试/取消/1000ms端到端timeout及迟到不发布，Color4/P3/color-mix/alpha/invalid/null、目标上下文、同ThemeService的system/配色/祖先覆盖、CSSOM显式refresh、unsubscribe/dispose。通知长文内部滚动，关闭操作与四边focus可见；已查看浅色窄屏200%文字和深色真实200%zoom截图。`browser-proof` 保存PNG/JSON，另通过IAB实际查看最终标准通知组合。fixture采用静态合成内容，不涉及真实身份、密钥、业务请求或产品部署。

首轮13项9过4失败单独留证：三个矩阵失败定位为LinkedText的未链接长文本撑宽，已在公共外框补安全换行、继承原文字槽，不要求宿主CSS；另一个取消用例错误假定浏览器必定重新派发第二次同URL CSS请求，已先等真实请求启动，并按浏览器可能合并同URL在途请求核对1～2次，仍严格断言取消/timeout本地结束、link释放及迟到无值。早期fixture的字体/固有尺寸字面量被设计守卫拒绝，已移除字体覆盖、Canvas展示尺寸改用公共token；真实文字放大由测试设置。过程失败在 `process-failures` 或首轮日志，不计入最终通过。

复现：`pnpm build && pnpm typecheck && pnpm check:tokens && node scripts/check-docs.mjs && pnpm test:unit && pnpm test:consumer`；`pnpm exec playwright test tests/browser/public-capabilities.spec.mjs tests/browser/toast.spec.mjs tests/browser/display.spec.mjs tests/browser/foundation.spec.mjs tests/browser/theme-presets.spec.mjs tests/browser/theme-session.spec.mjs`。最终receipt/日志/截图按归档命令绑定当前提交，早期候选不作正式元数据。

未跑：全仓browser、watch/cold-start、Firefox/WebKit、实体设备、读屏器及各消费项目真实页面/后端。保留旧非scoped自定义ToastController，使用scopeKey才要求clear；旧异步直接add必须由宿主取消/隔离。模块release不撤销ESM执行，CSSOM变更需颜色observer.refresh，WebGL线性空间转换仍归renderer。未把这些边界冒称自动覆盖。

## 启动释放、多行工具栏与窄屏阅读空间（4.2.14，2026-10-17）

仅修改 xui。与 Stitch 在既有设计会话审查 SearchToolbar 的跨行拉伸抑制、控件底边、单一抽屉内距、名称净宽与低高度退路。采用既有 48rem 断点（默认 768px），不采用设计回复中把 48rem 写成 640px 的笔误；区域预算按标题/关闭区之外的 Body 实际可用高度计算，不把 30%/20%/50% 当作整个视口可同时保证的比例。原始讨论与最终文字核准位于 `.artifacts/public-fixes-4.2.14/stitch-layout-review*`。Stitch 的附件通道未返回文件选择事件，本轮为文字/真实几何合同复核；实际截图由本地浏览器独立检查，不声称 Stitch 已查看最终截图。

公开 `@coffeehc/xui-runtime/bootstrap` 直接再导出既有 `disposeXuiServices(window)`，释放 Window registry 及 owned 服务、保留 borrowed 服务，重复释放安全，再 bootstrap 创建新 owner；根入口与聚合入口保持。`app.services.dispose()` 只释放容器，不注销 Window registry。正式窄依赖图允许启动所需 theme，不带入 HTTP/Auth/Menu/Upload 等功能实现。没有新的认证、路由或请求 owner。

SearchToolbar 的 search/actions 轨道、actions 内直接公开 Toolbar 使用控件底边对齐，多行操作不会拉高旁侧高级筛选；长文案保留自然高度。导航 Drawer 默认贴边全宽全高，取消重复 Dialog 内距，Sidebar 一层集中 padding；四槽仍为 Header、独立 Tabs、主菜单、Footer。头尾/Tabs 超预算时转为 Body 整体自然纵滚；普通高度保持 split。限制累计缩进，分支/配置动作成组换行，为名称保留净宽；desktop 宽度、compact rail、主题和阅读字号不变。默认窄屏抽屉外观有意改变，项目仍可通过公开 nav-drawer-max-inline-size 限制宽度；不要求产品覆盖内部 CSS。

旧固定 4.2.13 独立 tarball 消费者 `.consumers/run-WrGaW4/react` 使用同一正式公共组合复现：1440px 工具栏高级筛选 108px、刷新 36px；390×900/scale=2 时 drawer 326px，四字“团队经理”名称 96px 宽、88px 高（两行，行高44px）。`baseline.log` 为单独 1/1 复现通过，证明旧包确有问题；它不计入新包通过数。

最终 sourceGeneration 为 `e42488a95c75e690658ba8b24634a77be0ae83d563a38ef92a529c01b314c8da`，完整正式消费者 `.consumers/run-VbJaAA/react`。build/typecheck、581/581 unit、413 Token、文档/425条接入检查、contract/docs 11/11及完整独立 tarball consumer 的105个公开 ESM/CSS/types入口通过，React/ReactDOM/Base UI 单实例、零源码alias。关键CSS gzip 20,986/20,992 bytes，未放宽原预算；bootstrap+释放入口 gzip5,555，单独释放导入3,975，依赖图没有功能HTTP/Auth/Menu/Upload实现。三包SHA、依赖图与测试收据由自动归档的 manifest、metadata/consumer-validation.json、public-api.json 与 SHA256SUMS绑定，不手工补齐元数据。证据集中在 `.artifacts/public-fixes-4.2.14/`。

最终正式包浏览器：`browser-final4.log` 为新增9/9通过（同文件的旧基线场景按模式故意跳过1项，已另跑旧包1/1）；`regression-final4.log` 为既有九文件179/179通过，无失败或跳过，合计188个候选场景，不累计quick或早期重复结果。覆盖light/dark/system、1440桌面/320和390窄屏/390×400短屏、100%与200%阅读、三主题真实Chrome设置200%浏览器缩放（DPR加倍、viewport减半、根字号不变、CSS zoom=1、pinch=1），另保留既有RTL、长中文与compact回归。工具栏高级筛选实测36px，actions108px时仍与36px输入/刷新底边一致；390×900/scale=2抽屉390px全宽、Body四向padding=0、四字名称268.31×44px（28px字/44px行高，单行）。正常split与短屏/放大whole均实测；逐个Tab焦点全可见、分支Enter/Space、独立配置仅一次、Footer与选中项的Tab/Shift+Tab、Escape回焦、宽窄往返同一节点和草稿通过。已查看浅色390/200%、深色320/200%、末项Tab焦点和桌面多行工具栏截图；`browser-proof`保存几何JSON与截图。正式归档的validation仅收录最终收据/日志/截图、旧基线与明确标记的失败过程，不混入quick tarball。

过程失败保留：完整 unit 首轮命中旧324px断言，按已发布4.2.9的240–288px公共宽度修正；既有179项浏览器首轮128通过/51失败，包含旧宽度、Tabs嵌套位置与顶部toggle归属断言，以及真实的窄屏分支/配置部分换行问题和 SearchToolbar 示例缺少主题 owner。已将辅助动作成组、示例接公共 bootstrap，并更新测试到实际公共slot与现行宽度；保留焦点、几何、节点身份和交互断言。候选 CSS 多次超预算，合并重复默认声明与轨道约束后保留原20,992-byte预算，没有放宽门槛。严格分区断言另找出延迟挂载Body未启动预算的真实问题，改为稳定ref挂载信号；截图复核恢复Body明确padding=0；逐项Tab焦点净宽检查找出末项仍被横向裁切，公共sidebarTabs现按最近边界滚入，布局投影不因新JSX对象每次清理重置。早期候选失败与一次quick安装未完成即启动的404测试均单独保留，不计为新包通过。既有Footer测试同步按当前宽度允许的自然换行与whole模式实际滚动owner验收，没有取消可见边界、对齐、焦点或节点身份检查。

复现：`pnpm build`、`pnpm typecheck`、`pnpm test:unit`、`pnpm test:consumer`；preview4173后运行 `tests/browser/public-layout.spec.mjs`，旧包单独以 `XUI_LAYOUT_BASELINE=1` 与 `--grep baseline` 复现。既有回归为 search-toolbar、sidebar-footer、sidebar-header-toolbar、sidebar-bottom、sidebar-width、tabs-baseline、navigation-presentation、navigation-labels、navigation-status 九个 spec。新示例 `examples/public-layout-react` 只消费公开 ESM/CSS/types，安装目录独立，不能通过 packages/src alias 或私有样式修复。

未运行全仓 browser、watch/cold-start、Firefox/WebKit、实体设备或读屏器；不宣称 xAgent/xLead/xQuant 的实际页面、后端、升级或部署已验收。

## 六套项目配色与归属边界（4.2.13，2026-10-17）

仅修改 xui。与 Stitch 在既有设计会话对齐 Violet/Ember，并根据用户决定将 Violet 作为默认，增加 Forest/Crimson/Cobalt，保留 Precision；具体色值由浏览器合成测量校正，不将设计稿标称比值当作验收。主题讨论和实际截图位于 `.artifacts/theme-comparison/`；正式回归、对比值、功能文件哈希和消费者 receipt 位于 `.artifacts/ownership-contract-4.2.13/`。

公开新增 `config.theme.preset`、`ThemeOptions.preset`、`ThemeState.preset` 与 `ThemeService.setPreset`，类型 `ThemePreset` 从既有 theme/根入口导出。六套配方随正式 tokens/style/critical CSS 交付；没有新的运行时颜色注入、额外配置请求或组件皮肤。明暗仍为独立 light/dark/system，默认 dark，sessionStorage 明暗偏好优先；配色由项目配置初始化，运行期 setPreset 不写 storage、不改变 mode/缩放/输入状态。自定义 product-overrides 继续优先。升级未显式选配色会采用紫色；保留青色显式 precision；自定义完整 ThemeController 须补齐 preset/setPreset，不把末位版本递增当作语义兼容承诺。

同时补齐多 NavigationMenu 范围 Controller 归属、受控 collapsed 同源接线、keepMounted 隐藏树隔离、真实退出销毁；未知 logout 的一次内部核验、同 owner 普通登录、新 Document 正常恢复与 bfcache 原 owner 的边界。未新增持久退出门禁或恢复按钮。ADOPTION_CHECKLIST 增加 NAV-OWNER、AUTH-LOGOUT/RELOAD 和 COLOR 逐项检查，当前 421 项。

正式包构建、typecheck、Token/文档守卫、92 项定向 unit，以及完整独立 tarball consumer 的 105 个公开 ESM/CSS/types 入口通过；React/ReactDOM/Base UI 单实例，无 packages/src alias。关键 CSS（含 floating）gzip 20,770 bytes，六套配方将预算由 19,456 增至 20,992；JS/Button/窄服务预算未放宽。具体 commit/sourceGeneration/tarball SHA 以自动归档的 manifest、metadata/source-generation.json、public-api.json 和 SHA256SUMS 为准，不手工补齐元数据。

实测普通文字（含链接、选中、品牌 Badge、主按钮与状态文字）最低值和必要输入内外边界/焦点最低值如下。浏览器解析 OKLab/color-mix 后测量，system 同时检查系统浅深切换；不是只比较静态 HEX。

| 配色 | 文字最低对比 | 边界/焦点最低对比 |
| --- | --- | --- |
| Violet | 5.57:1 | 3.21:1 |
| Ember | 4.53:1 | 3.10:1 |
| Forest | 4.82:1 | 3.06:1 |
| Crimson | 5.15:1 | 3.27:1 |
| Cobalt | 4.72:1 | 3.01:1 |
| Precision | 4.55:1 | 3.14:1 |

浏览器覆盖六套主题的 light/dark/system、1600px 桌面、390px/200% 根字号、长中文、预绘脚本先于应用、项目配置重载、自定义公开 Token 覆盖、Sheet 的草稿/焦点/所有祖先滚动位置保持和关闭回焦；另有每套浅深各一次真实 Chrome 200% 浏览器缩放，验证 viewport/DPR 变化且 CSS zoom=1、pinch=1。相关默认页面、菜单危险语义、导航选中、按钮品牌继承、表单和刷新连续性也执行定向回归。截图在 `images/theme-presets`、`images/default-theme` 和 `images/precision-theme-evidence`。

首轮122项中114通过、8失败：两个管理员焦点 fixture 仍找英文 Show password；菜单示例只有 prepaint，缺少共享主题 owner；刷新 fixture 仍期待已移除的临时状态栏；另四项暴露主题选择器名称长短使窄屏顶栏换行并移动文档滚动。已修正公开 bootstrap 示例接线、固定示例自身选择区的布局宽度，并更新旧测试定位/现行刷新合同断言。保留严格滚动、焦点、节点身份与页脚不跳动断言，未修改颜色阈值或通过私有 CSS 修组件；管理员6项及关键39项复验通过。最终各批原始 JSON/log 保留首轮失败与后续复验，不把候选的失败结果冒充最终通过。 最终正式包更新示例55/55、系统菜单与刷新连续性2/2、Toast/品牌覆盖/固定表格合成20/20；示例选择区最后调整为明确宽度上限后，主题全49项再次通过，新增桌面两选择器同行断言与严格窄屏滚动保持。其后只修DESIGN中的旧默认主题叙述，310项CSS/ESM/types等功能产物逐文件SHA一致，重建并重新验证完整consumer以生成最终元数据，不把旧sourceGeneration手工改成新值。

复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`node --test tests/contract.test.mjs tests/docs.test.mjs tests/runtime.test.mjs tests/theme-session.test.mjs tests/theme-control.test.mjs tests/theme-presets.test.mjs tests/config-services.test.mjs tests/interaction-controller.test.mjs tests/auth.test.mjs tests/page-composition.test.mjs tests/design-state-contract.test.mjs tests/menu-design-contract.test.mjs`、`pnpm test:consumer`，然后对 `tests/browser/theme-presets.spec.mjs`、`default-theme.spec.mjs`、`page-composition*.spec.mjs`、`button-link-contrast.spec.mjs`、`button-brand-inheritance.spec.mjs`、`navigation-selected.spec.mjs`、`menu-danger.spec.mjs`、`theme-session.spec.mjs`、`precision-theme-evidence.spec.mjs` 运行 Playwright。Toast/coverage/widgets 只选择颜色、长内容、缩放及背景合成相关场景，不扩展到无关计时回归。

未运行全仓 unit/browser、watch/cold-start、实体设备或读屏器；本轮浏览器为 Chrome，不声称 Firefox/WebKit 或各消费项目的页面、后端、升级、部署已验收。消费项目保留自定义配色后仍须按自己的实际组合验证。

## 自助改密与原认证owner（4.2.12，2026-10-17）

复核4.2.11没有公开改密命令后实现，不重复改造已闭环的组件。仅修改xui；只读核对BaseService `5e2c906bcb19913bbbd1959bf06d7463f486edb4`官方fixture。`AuthClient/AuthService.changePassword`固定官方PUT、唯一Bearer、omit/no-store/error redirect，严格确认schema1三字段；成功清凭据并要求重新登录，不添加备用URL、通用auth白名单、第二owner或写入重放。公共PasswordChangeForm复用原Field/PasswordInput/NewPasswordFields/FormActions/Alert，支持默认及完整Controller注入、keepMounted的active、清密和关闭回焦。

证据集中在`.artifacts/auth-password-validation/`，最终sourceGeneration为`8f1141f2ec8ddc2b26b9d5a482948402253408cd9f3dc9c5f1b9b9459ae343a1`。完整正式consumer通过全部105个ESM/CSS/types入口、peer单实例和公开分片/包尺寸门槛；三包摘要见consumer-final.json与自动归档manifest。build/typecheck、Token 408项与文档检查通过。`unit-final-v3.log`为85项定向unit全部通过，包含原Auth、密码/强度、官方DTO正负例、确定拒绝/冲突/50302、超时未知、单一等待预算、共享refresh、取消与旧代迟到、安全错误、同毫秒双owner、锁释放后旧失败延迟投递及异常订阅者清理。`browser-final-v3.json`20项Chromium与`cross-final-v3.json`34项Firefox/WebKit通过；`field-regression-final-v3.json`另有5项原登录/初始化/新密码字段回归通过，均无跳过，不累计早期候选结果。

浏览器只使用独立安装的正式ESM/CSS/types三包（最终consumer-final.json、完整正式消费者`.consumers/run-fIN7HR/react`），保持React/ReactDOM/Base UI单实例、零packages/src alias。覆盖owned/injected、light/dark/system及系统主题切换、桌面/390窄屏、长中文、200%根字号、真实Chrome设置200%缩放，必填/确认错误关联与焦点、弱但符合长度的密码可提交、busy单次写入、确定拒绝可修改、未知不重发、成功反馈焦点、keepMounted关闭回到公共trigger、卸载及pagehide清空保留DOM引用、真实兄弟标签页失效且零refresh恢复。已查看review-light-desktop/review-dark-narrow/review-system-zoom三张截图，输入、主动作、自然换行和焦点轮廓可见。

过程失败与修正：审查发现全局cancel可恢复旧凭据、异常observer中断模型进度、错误DTO分类不严，以及同毫秒跨owner旧事件/聚合密码显隐清理，均补代码和回归。跨tab只存数字协调水位，不存密码/token或会话；storage被禁用时不阻断认证，但不承诺跨tab完整排序，详见PUBLIC_API。浏览器候选中一次选中了额外的隐藏strength status，一次在写入尚未派发时立即卸载却期待有一次写入；分别收紧反馈定位和等待实际派发后再测取消，不要求库强行发送已取消写入，旧失败日志保留。

复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`node scripts/check-docs.mjs`；`node --test tests/auth.test.mjs tests/auth-password.test.mjs tests/auth-coordination.test.mjs tests/password-change.test.mjs tests/password.test.mjs tests/password-strength.test.mjs tests/contract.test.mjs`。定向consumer脚本在证据目录，完整正式消费使用`pnpm test:consumer`；preview4173执行password-change.spec.mjs及证据目录cross.config.mjs；字段回归运行password-fields/public-feedback并grep `both password reveal|NewPasswordFields|clear`。

未执行全仓unit/browser、真实账户或BaseService数据库撤销测试、消费项目升级/页面/API/部署、实体设备或读屏器；合成响应不能证明全部服务器旧会话已撤销。官方后端GET/PUT协议不会因公共表单自动适配，产品仍需独立核验真实鉴权与撤销。

## Progress等高轨道（4.2.11，2026-10-17）

旧4.2.10正式消费者`.consumers/run-852Het/react`复现600×8轨道border-radius为50%，截图及来源见`.artifacts/progress-shape-validation/baseline.json/png`。仅Progress及原生绘制伪元素改用已有radius-sm；不改变全局circle token、Spinner、value/max或查询。正式三包定向消费者generation为`8e7836e7bb8267a94ff25b6ecd47688ac310108abd4a77b6b457882de5a07b54`，路径和三包摘要见同目录consumer.json，ESM/CSS/types及React/ReactDOM/Base UI单实例已核验；随后在独立检出`c6021d6a3a7e9463be546bc4b6fac0e0d6a0d8fa`完成同代完整consumer（`.consumers/run-ZUODDQ/react`），归档`.artifacts/public-c6021d6a3a7e9463be546bc4b6fac0e0d6a0d8fa`并自动校验18个归档文件；不含后续改密开发。manifest、105入口和三包摘要由归档流程生成。

15项定向unit、docs通过；chromium-pass.json的12项与cross-final.json的18项通过。600px宽轨道用实际截图顶边像素验证平直条形，覆盖0/中间/100/未知、三主题、RTL、390px/200%文字；旧Progress专项覆盖真实比例、动态变化/节点身份、主题覆盖、forced-colors实际填充/边界、减弱动效静止；Chrome另做三主题真实200%浏览器缩放。review-final.png已人工查看。

过程失败保留：首轮宽度夹具把600px放在Grid子项造成测试宿主溢出，改为父容器min(600px,100%)；版本正则和误改的Spinner测试预期已纠正，生产Spinner未改。旧Skeleton/Spinner专项仍断言历史surface-line-strong/primary边框方向，与本次未修改的现实现不符，失败已保留，未扩大修复且不计入通过；最终限定Progress专项。WebKit不支持forced-color-adjust属性，测试按CSS.supports核对空computed值，仍执行实际强制色绘制断言，未跳过像素验收。

复现：`pnpm build`、`node --test tests/feedback-foundation-contract.test.mjs tests/contract.test.mjs`、同目录consumer.mjs；preview4173执行progress-shape与feedback-foundation-contract两文件的Progress专项，cross排除genuine Chrome。未跑全仓、消费项目或部署；4.2.11以后的固定正式包/产品页面另验。

## DataTable交互列宽（4.2.10，2026-10-17）

只修改xui。4.2.9正式独立消费者确认DataTable无resize separator/公开sizing类型（baseline.json、baseline-metafile.json）；不是宿主已写列宽却使用错误。新增可选columnSizing，默认拥有独立Controller，亦可受控widths或注入完整Controller；不拥有查询、排序或分页。第一次调整固定当前全部轨道、只改变目标列；启用时初始最小轨道避免窄屏零宽列；未启用仍保留旧响应式布局。确认后的widths为CSS像素，不自动随根字号同比放大，reset恢复当前响应式初始轨道。

证据在`.artifacts/data-table-resize-validation/`。最终generation为`514e48e2ecbce8552474d6114bf948a8a854a2a15b17ad29ba9292e9d718bb21`，完整正式消费者`.consumers/run-852Het/react`，三包、SHA256、peer、全部105个ESM/CSS/types入口见consumer-final.json与正式归档manifest；408 Token、398条接入检查。build/typecheck、54项定向unit、docs及完整consumer通过。最终browser-final-v2.json为53项Chromium、cross-final-v2.json为44项Firefox/WebKit通过，无失败/跳过；重叠候选结果不累计。

浏览器验证owned/controlled/injected三模式、light/dark/system、1280桌面、390窄屏/RTL/200%根字号、三主题真实Chrome200%浏览器缩放及真实触摸事件。验证准确轨道/单次确认、不触发排序或查询、旧行/按钮身份、上下限/键盘/RTL、焦点轮廓与End后可见、pointercancel/lost capture/Escape/字尺度变化/禁用/刷新/列变更/卸载清理、注入实例不销毁、受控拒绝/外部更新/reset、空表与独立排序；既有width、focus、cursor定向回归包含sticky、表体横滚及自然页脚。新增可选table-resize.css正式分片由style.css/components.css包含，critical.css继续不包含该可延迟交互样式；拆分消费需同时导入table.css和table-resize.css。

过程证据保留：最早候选根字号/窄屏暴露零宽弹性列，修正初始最小轨道；lost-capture测试最初在原生待处理事件尚未触发时轮询，改为真实下一次pointermove；首次consumer在主线程修正无原型列id快照时检测source变化并拒绝receipt，随后冻结源码重建；截图复核补齐键盘拉宽及Tab进入时的可见焦点。最终结果以final-*和*-final-v2为准，不用旧候选receipt归档。

复现：`pnpm build`、`pnpm typecheck`、`node --test tests/data-table-sizing.test.mjs tests/data-table.test.mjs tests/design-value-guard.test.mjs tests/contract.test.mjs`、`node scripts/check-docs.mjs`、`pnpm test:consumer`；preview4173，以上同目录playwright.config.mjs执行data-table-resize/widths/focus/cursor四文件，cross.config.mjs执行resize并排除genuine Chrome与real touch。未跑全仓unit/browser、watch/cold-start、实体触摸设备/读屏器、消费项目页面/API/部署。新增能力须宿主显式启用和固定正式包，不能宣称xAgent已升级。

## 公共侧栏紧凑宽度与短Tabs分布（4.2.9，2026-10-17）

仅修改xui默认布局Token和sidebarTabs排列；不修改消费项目。正式4.2.7独立消费者在管理MenuLayout与会话AppShell的800/1280/1600/1920px视口均测得324/324/400/432px，见`.artifacts/sidebar-compact-validation/baseline.json`。首个取样脚本遗漏目录尾斜线，后又在视口尚未完成绘制时读宽度；修正路径并以减少动效及双RAF取样，未把旧脚本结果当公共故障。

新默认18vw、最小6项高加两侧内距、最大8项高（100%时240–288px）且50vw封顶。四个短Tabs使用content自然宽度，槽内两端分布；不增加内容测量模式、查询或选择owner。公共宽度Token继续覆盖，普通header、60px compact、同一窄屏抽屉与品牌列对齐保留。

正式sourceGeneration为`31c40661b514efd70de362a22d92e7ef96db8cbb44a69daa942ac5b80b842795`，consumer为`.consumers/run-VPhXLJ/react`，精确三包/peer与单项结果见同目录consumer-final.json及final-summary.json。25项定向unit、完整consumer、Chrome62项及两项缩放合同、Firefox/WebKit96项浏览器全部通过（最终160项，无失败/跳过）。检查包括build/typecheck/Token/docs、定向unit及完整正式consumer；浏览器以sidebar-width、tabs-baseline、interface-scale的responsive sidebar/medium viewport、menu-layout和navigation-chevron定向组合，覆盖三主题、管理与两类会话Shell、800–1920桌面、390px/RTL/200%文字及真实Chrome200%缩放。验证四短项单行无截断、轨道两端填满、同一节点/草稿/滚动、公共min/max覆盖、放大800视口正文至少一半、焦点/抽屉关闭回焦及无文档横溢出。

未执行全仓unit/browser、watch/cold-start、实体设备/读屏器或消费项目页面/API/部署。默认宽度是明确的视觉兼容变化；产品额外品牌/内容约束须用公开Token并在自身验收。没有声称整栏会自动等于任意Tab的固有总宽。

## NavigationMenu分支矢量指示与命中对齐（4.2.8，2026-10-17）

旧正式4.2.7独立消费者中，链接分支按钮32×36px、字符指示器8.44×22px且偏中心6.78px，旁侧配置动作36×36px。证据`.artifacts/navigation-chevron-validation/baseline.json/png`。本轮复用公开DisclosureIndicator的16px装饰SVG及公共图标Button方形尺寸，去除字符字形差异与auto边距偏移；无链接分支也复用同一指示器，不新增状态或API。名称翻译、禁用、展开值、路由、配置及右键动作继续归现有owner。

针对性验证、正式consumer/generation及各主题截图见同目录final-summary.json与consumer-final.json。执行build/typecheck/Token/docs、navigation-labels/navigation-slots/navigation/menu-controller/contract/docs定向unit、正式consumer；浏览器执行navigation-labels、navigation-chevron、rich-navigation，并定向执行navigation-presentation的RTL保留节点用例。覆盖三主题、桌面/窄屏、200%文字、真实Chrome200%、触屏、长中文、受控更新/翻译、disabled、roving、Enter/Space、aria-controls、独立动作/右键不导航和compact。SVG居中，命中与行尾配置尺寸相等；减少动效保留静态清晰指示。

过程首次失败是旧版本正则断言未同步，以及浏览器测试在触屏/指针打开抽屉后仅程序性focus便要求键盘focus-visible；已更新版本断言并先经真实Tab建立键盘路径再检查同一按钮，未改库焦点策略。首次报告保留，触屏快速开关时还修正测试在SVG旋转中途取矩形的问题，等待真实动画结束后再量静态尺寸；最终browser-recheck/cross-recheck加touch-final/touch-cross-final覆盖63项唯一用例全部通过。27项unit与正式consumer通过。

未跑全仓unit/browser、watch/cold-start、实体设备/读屏器或消费项目/API/部署。本项不调整业务高亮、团队归档或输入区行为，不把公共合成示例替代宿主验收。

## 内容Tabs默认line与侧栏唯一分隔（4.2.7，2026-10-17）

仅修改xui公共组合、Token、文档和合成示例。xAgent原正式4.2.5与4.2.6的UI字节相同；以独立4.2.6安装包复现AppShell/MenuLayout的旧sidebarHeader组合，三主题6次均测得Tab底部与Shell分隔线相距5px。不是消费方私有边框。基线截图及原包重建输入见`.artifacts/tabs-baseline-validation/baseline.json`、baseline.log、baseline-metafile.json与images-before。

按用户最新要求，Tabs.List省略variant即line；显式segmented仍可使用旧底槽，但不新建视觉分支或状态owner。水平List以内嵌淡线拥有整体基线；AppShell/MenuLayout新增可选sidebarTabs，只放末位水平Tabs.List，自动铺满header净宽，交出Shell边框与底部padding。普通header不变。旧用户须迁移List槽位，Root/Controller/Panel不更换；仅安装包而沿用sidebarHeader不能宣称已合线。四项合成示例为“普通 / 团队 / 插件 / 已归档”。单行共线，多行强调线仍属当前项所在行，整体淡线在最后一行，不固定高度或裁切。

验收按最终正式consumer执行：build、typecheck、Token、docs、35项定向unit及完整ESM/CSS/types/导出/类型/示例/体积/单实例peer门禁；406 Token、104入口、397检查。浏览器覆盖Chrome三主题、AppShell与MenuLayout、LTR/RTL、桌面/390px、200%根字号/长中文、真实Chrome200%缩放；Firefox/WebKit同步验证同一组合。确认普通400/选中600、边线等高、切换无高度跳变、List铺满、键盘和焦点可达、同一节点及各Panel草稿/70px滚动保留；非line显式segmented与普通header仍保留Shell边界。最终通过数、generation和正式consumer见同目录report-default-final.json与consumer-default-final.json。

过程候选记录保留：第一次Token审计拒绝在局部CSS引入inset设计值，改为集中tabs-line-baseline-shadow；初次窄屏MenuLayout测试在模态导航打开时编辑被隔离正文而超时，修正为关闭抽屉检查正文再打开同一树；第二次把程序性Home聚焦误当作激活，改用Enter明确选择并验证hover不改选择。截图复核还发现槽容器随内容收缩，增加公共stretch并补齐轨道等于header净宽的几何断言。未放宽模态、焦点或宽度规则。default-final证据是默认line及铺满修正后的最终包，之前candidate/final/recheck仅保留过程，不混作最终构建。

复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`node --test tests/tabs-presentation.test.mjs tests/workspace-layout.test.mjs tests/interaction-controller.test.mjs tests/contract.test.mjs tests/docs.test.mjs`、`node scripts/check-docs.mjs`、`pnpm test:consumer`；预览4173，使用同目录playwright.config.mjs/cross.config.mjs执行tabs-baseline.spec.mjs（cross排除genuine Chrome），另以tabs-overlay.spec.mjs定向选择capped name-only motion、manual activation、segmented。未运行全仓unit/browser、watch/cold-start、实体设备/读屏器或消费项目页面/API/部署；宿主接线与真实升级验收归消费方。

## 正式产物统一归档与独立校验（4.2.6，2026-10-17）

仅修改xui的交付工具链、文档、版本与回归。三包/DESIGN为 **4.2.6**，末位递增，单一分发。最终sourceGeneration为`f861e4149344cb3e538b3c35d3fae0f6f8851ff637b5a181f306e2a827194c0f`；完整正式consumer为`.consumers/run-qTW68P/react`，React/ReactDOM19.2.8、Base UI1.7.0单实例。405 Token、104公开入口、396逐项检查。与4.2.5三包的300份dist文件逐一比较，仅三个build.json因generation变化，其余ESM/CSS/types字节完全相同；没有UI/运行时业务行为变更或新增公开包入口。

此前build只写generation，consumer另写API，正式目录依赖临时拼装，4.2.5交付曾漏public-api.json并手工补齐。本轮由[统一归档入口](../scripts/archive.mjs)生成schemaVersion=1目录：[归档合同](ADOPTION.md#正式归档的唯一入口)是目录、命令和摘要计算的唯一说明，旧历史目录保持原样。build与归档/校验共用[源码generation算法](../scripts/source-generation.mjs)，API从精确打包声明生成，consumer成功回执绑定实际三包和锁文件；CI既有验证成功后调用同一archive命令。正式命令要求提交完成且跟踪工作区干净，先暂存并完全校验，最后原子发布，拒绝覆盖已有目录；提交后最终目录的commit/摘要由命令与根manifest生成，不再手工追记或补文件。

| 检查 | 实际结果 |
|---|---|
| build、typecheck、Token、docs、diff | 通过；104入口、396检查；构建输入未漂移 |
| 定向unit | 22/22：归档12项（含负例子项）、contract8项、docs2项；未跑全量unit |
| 完整正式consumer | 通过；精确tarball的ESM/CSS/types、所有导出与类型、示例打包、无源码alias和单实例peer验证；成功后原子写consumer-validation.json |
| 正式consumer体积 | critical CSS gzip19155/19456、initial JS gzip142164/153600，未改预算 |
| 真实三包的归档生成与复制后校验 | 通过：隔离Git快照使用上述真实同代三包和consumer回执；移除原快照/消费者后仍能验证复制件，重建104入口与generation；该快照commit仅为测试，不冒充最终main提交 |
| 与4.2.5正式dist差分 | 300文件清单相同，297份非stamp文件字节相同，三份stamp更新；API清单SHA256仍为`7c4744683b5eac87f206fbb280dd693375c42052281f795bc4c08e72529eb14a` |

归档回归实际覆盖：大源码tar、自动重建而非复制过时全局API、干净提交/成功consumer前置、重复目录不覆盖、复制件独立验证、缺API、额外文件、坏tar、缺摘要行、重算摘要后仍不允许的API/generation/已测包错配、路径穿越、符号链接、过期dist、失败清理与重试。manifest、generation、API清单、精确包与source tar之间均做语义交叉检查，不只验证单文件摘要。独立复制校验仍需要已安装的xui工具依赖及Git/tar，未声称是无工具运行或签名认证。

过程限制与修正：初轮夹具暴露macOS `/var`与`/private/var`同一仓库路径比较失败，改用realpath；另修正测试将public-api.json误识为正式目录的前缀断言。第一代build/22项unit/完整consumer通过，但真实较大源码tar的`git get-tar-commit-id`提前关管道导致Node EPIPE，未发布该候选归档；改用文件描述符输入并给原关键测试增加2MB源码快照。随后重建最终generation，完整重跑上表门禁与真实三包归档验证通过。没有吞掉EPIPE、降低摘要/API一致性检查或手工补档。

证据在`.artifacts/archive-validation/`：`{build,typecheck,tokens,unit,docs,consumer}-final.log`、`real-snapshot-final.json/log`、`real-snapshot.mjs`、`dist-diff-final.json`；首代日志为`*-first-generation.log`和consumer-first-generation.json，EPIPE在real-snapshot-first-generation.log，大快照回归另见unit-large-snapshot.log。完整成功回执是`.artifacts/consumer-validation.json`，三包摘要与当前generation由该回执给出。复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`node --test tests/archive.test.mjs tests/contract.test.mjs tests/docs.test.mjs`、`node scripts/check-docs.mjs`、`pnpm test:consumer`；提交后执行`pnpm archive --evidence .artifacts/archive-validation`，再以输出路径执行`pnpm archive:verify <目录>`。日志输出置于传入证据目录之外，避免归档命令采到自身尚未写完的日志。

未执行全仓unit、watch/cold-start或浏览器/产品/API/部署验收；本轮UI与CSS字节未变，不复用旧98/151项作为本轮新跑结果。CI工作流已接入同一命令，本机未触发或宣称远端CI已通过。归档通过证明所列包、输入与元数据一致，不代替消费项目升级和真实页面验收，也不自动发布npm。

## 保留Dialog异步恢复的阅读连续性（4.2.5，2026-10-17）

仅修改xui，三包/DESIGN为 **4.2.5**，末位递增、单一分发。sourceGeneration为`a9fd920d5fa6326f0b1e9730ff8ee0e579d24cfa23cb071c24c33cbea38ea5af`；独立正式consumer `.consumers/dialog-resume-dvonpu/react`安装三份tarball的ESM/CSS/types，React/ReactDOM19.2.8、Base UI1.7.0单实例，无src alias、宿主私有CSS或原生UI。405 Token、104公开入口、395逐项检查。本轮无新增公开props/exports，既有keepMounted、initialFocus、finalFocus与Dialog.Body组合合同见[保留详情](COMPONENTS.md#保留dialog的阅读位置)，正式样板见[dialog-resume-react](../examples/dialog-resume-react/app.tsx)。

来源xLead固定4.2.3 / `b5c770f`的公开最小复现；本轮用4.2.4 / `f13c386`正式安装产物独立重建，观察器实现与4.2.3一致。输入保持焦点、草稿保留，Body手动滚至93px：同事件中立即关开仍为93px；真实受控关闭后等待350ms再打开，即使宿主initialFocus明确preventScroll，仍跳至10370px。根因为隐藏分支清除模式，恢复时误作滚动容器切换并将旧焦点scrollIntoView；不归因于宿主认证或请求适配。

修复在共享布局观察器中保留隐藏前的body/whole模式；同一已测容器恢复时不主动揭示旧焦点。仅当浏览器隐藏后丢失偏移至零时，以组件自己的最后可见位置补齐该轴，仍存在的非零原生偏移优先；同步记录隐藏边界，覆盖暂停的动画帧，销毁清理滚动监听、观察器和待执行帧。真实布局模式变化仍清理旧容器并揭示当前焦点。没有新增定时恢复内核、全局位置缓存、身份核验、查询/草稿owner或私有CSS。标准单个直属Body与布局观察支持为偏移恢复前提；无Body/无ResizeObserver降级只承诺内容与动作可滚动可达。

| 检查 | 最终实际结果 |
|---|---|
| build/typecheck/Token/docs/独立正式定向consumer | 通过；critical CSS gzip18702/19456；未测本轮完整initial JS或Button体积 |
| 定向unit | 18/18：dialog-layout、contract、docs；含两个滚动模式、隐藏帧暂停、真实容器切换、原生偏移优先及卸载清理 |
| Chromium恢复专项 | 22/22：18个主题/宽度/容器组合、1个真实容器切换、3个真实Chrome200%复合用例 |
| Firefox/WebKit恢复专项 | 各19/19，共38/38；不含Chrome专用缩放 |
| Chromium既有布局/焦点边界回归 | 36/36，含Dialog/Sheet/Card、footer/键盘/滚动、模式切换及无ResizeObserver降级 |
| Chromium既有Controller回归 | 2/2，默认/注入Dialog及Sheet/AlertDialog/Popover/Tooltip/Menu/ContextMenu组合 |

最终合计 **98项浏览器检查，0失败/跳过/flaky**。覆盖light/dark/system及实时变化、1280/390/320px、长中文、production/开发StrictMode；320px为200%根字号，真实Chrome200%校验DPR加倍、CSS viewport减半、根字号不变及CSS zoom/pinch=1。body/whole各两轮异步关闭/恢复，120个采样保留同一DOM、草稿、选择区2..7和焦点，Escape正常关闭回真实按钮；真实容器切换另验聚焦输入可见。Chrome/WebKit及静态Firefox的恢复偏移与关闭前实际读数严格相等。Firefox开启动画的6组两轮采样均有约0.1500015 CSS px差异；独立纯HTML滚动容器在scale动画下同样发生赋值取整，未调用xui。只对Firefox普通动画场景设置最多1设备像素边界，其他场景维持严格相等，不容许跳到零或焦点底部。已查看最终浅色窄屏、深色320px/200%根字号、system真实Chrome200%与极端长标题whole模式截图。

过程失败保留：最初仅保留模式的候选Chrome22/22、WebKit19/19，Firefox恢复为零；补齐组件内可见位置快照后Firefox剩6组原生动画取整差异，纯HTML对照后采用上述精度边界，未增加补偿动画定时器。首轮旧布局回归35/36，原无ResizeObserver用例在打开弹窗前已恢复该能力，实际走到了观察器路径；仅修正测试使该能力在整个独立页面缺失，原可达性断言不变，最终36/36。初次版本测试漏改转义正则的旧版本号，修正后18/18。最终全部以新正式包重建fixture并重跑，未将中间候选结果冒充最终包验收。

证据在`.artifacts/dialog-resume-validation/`：baseline.json/log及baseline-package.json；consumer.json/peers.json、native-final-{build,typecheck,tokens,unit,docs,consumer}.log；native-{browser,cross,layout,controller}-final.json/log、final-report-summary.json与images-final；过程browser-first、cross-first、layout-regression-first、retention-*-candidate、firefox-diagnostic及firefox-native-rounding保留。三份tarball的SHA256列在consumer.json，随最终源码SHA归档。复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`node --test tests/dialog-layout.test.mjs tests/contract.test.mjs tests/docs.test.mjs`、`node scripts/check-docs.mjs`、`node .artifacts/dialog-resume-validation/consumer.mjs`。预览4173；该目录playwright.config.mjs运行dialog-resume.spec.mjs、focus-boundaries.spec.mjs，cross.config.mjs运行前者并排除genuine Chrome；controller-modes.spec.mjs选择owned and injected Dialog与Sheet, AlertDialog两项。并行调用各用独立--output；Controller fixture按最新正式consumer即时bundle并复用同代CSS，全部构建输入核对无源码alias。

未执行全仓unit/browser、完整consumer套件、watch/cold-start、实体设备/读屏器或消费产品页面/API/部署。真实后台tab/visibility尝试在headless、headed及关闭焦点模拟后均未产生document.hidden变化，属于本机自动化环境未跑通（baseline-headed、baseline-native-background记录），未伪造visibility状态；本轮以明确350ms异步边界验证库布局问题，不冒称真实后台身份核验通过。xLead/xAgent等仍须自行升级、按公开slot接线并验收其恢复资格、权限和业务流程。

## Tabs扁平轨道与长名称阅读（4.2.4，2026-10-17）

仅修改xui，三包/DESIGN为 **4.2.4**，仍只递增末位、无兼容分发。sourceGeneration为`3952ad3c0ef097efacb7c0cfda3f679984e2aaa67463341ba7b6cc1273686ef1`，独立正式consumer `.consumers/tabs-overlay-FDn3x8/react`安装三份tarball内ESM/CSS/types，React/ReactDOM19.2.8与Base UI1.7.0单实例，没有src alias或宿主私有CSS。405 Token、104公开入口；本轮只运行定向consumer，不将其写成全量接入验收。

公开`Tabs.List.variant?: 'segmented' | 'line'`，默认segmented皮肤保持。line按已确认的扁平设计移除外胶囊/内选中框，仅保留文字/图标强调色、600字重与一条底部选中线，focus独立。所有Tab共用新增`--tabs-item-max-inline-size`，默认layout-field-min=15rem（根字号16px时240px），不超过容器；equal在该上限内分配。直属字符串/数字自动进入Label，组合内容提供`Tabs.Label`/`TabsLabelProps`，text:string且交互表面归Tab。复用OverflowText的真实测量、共享速度和单次滚动，hover/已有键盘焦点仅移动名称；Icon和计数在文本槽之外。减少动效、触屏、无动画/JS或disabled保留完整静态折行。Root允许Flex/Grid收缩，不把长名最小内容宽度传给页面。此项宽度/读名行为是默认合同更新，消费项目自定义嵌套名称应采用公开Label，不依赖内部span结构。见[Tabs](COMPONENTS.md#tabs)、TABS-LINE-001/TABS-OVERFLOW-001与[正式样板](../examples/tabs-overlay-react/app.tsx)。

| 检查 | 实际结果 |
|---|---|
| build/typecheck/Token/docs/正式定向consumer | 通过；critical CSS gzip18702/19456；没有测量本轮完整应用initial JS或Button体积 |
| 定向unit | 29/29，tabs-presentation、interaction-controller、contract、typography-scale；未跑全量unit |
| Chromium Tabs专项 | 45/45，含三主题真实Chrome200%及触屏context |
| Firefox/WebKit Tabs专项 | 各41/41，合计82/82；不含Chrome专用缩放与touch context |
| 既有Tabs Controller回归 | 2/2，受控接受/拒绝、非首项default与取消fallback不重复通知 |

上述计数按用例职责从最终组合报告筛选；三项Chrome缩放同时覆盖嵌套弹层，不重复当成六项用例。浏览器覆盖默认/受控/完整Controller、production/开发StrictMode，三真实Panel的keepMounted节点/草稿/阅读滚动/游标不变；方向键/Home/End跳过disabled、手动Space激活、竖向/RTL、aria-controls/selected及focus环。长中文/无空格英文、短长动态更新、内容和宽度重测、鼠标离开且失焦复位、RTL末端对齐、图标固定、销毁取消动画；320px的200%根字号与真实Chrome200%页面缩放（DPR加倍、CSS viewport减半、根字号不变、CSS zoom/pinch=1）均无页面横溢出。已查看最终浅色桌面、深色320px/200%根字号、system真实缩放与减少动效完整名称截图。

过程失败完整保留：首轮cap-probe为4/5，Base UI使用aria-disabled的Tab误进入动效，已在共享OverflowText交互表面补齐禁用判断；第二代Chromium42/57、Firefox/WebKit76/106，失败均为长名在Grid自动最小宽度下撑开Root（320px/200%页面达到608px），修复公共Root的min-inline-size后，用新正式包完成上述最终矩阵。未放宽横溢出或焦点断言。新增需求前的旧候选还有两项trace输出目录被并行Playwright清理造成ENOENT、一次受影响回归同因失败，独立输出目录复验3/3；这不是组件故障，最终各进程使用独立output目录。初始示例40dvh设计值审计失败已改用现有layout-scroll-area-height Token，未放开规则。

最终证据在`.artifacts/tabs-overlay-validation/`：consumer.json/peers.json、cap-root-final-{build,typecheck,tokens,unit-targeted,docs,consumer}.log、cap-root-browser-final.json/log、cap-root-cross-final.json/log、cap-root-controller-final.json/log、final-report-summary.json及images-final；过程保留cap-probe、cap-browser-before-root/cap-cross-before-root及consumer-before-root。复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`node --test tests/tabs-presentation.test.mjs tests/interaction-controller.test.mjs tests/contract.test.mjs tests/typography-scale.test.mjs`、`node scripts/check-docs.mjs`、`node .artifacts/tabs-overlay-validation/consumer.mjs`。预览4173，Chromium选该目录playwright.config.mjs与tabs-overlay.spec.mjs；跨引擎用cross.config.mjs，最终排除genuine Chrome、touch context以及nested Escape的light320/dark/system390组（其完整矩阵在前一代已通过，新包保留light390/system320代表性回归）。Controller回归从最新正式consumer即时bundle，使用同代正式CSS，选择controller-modes.spec.mjs的owned/injected Dialog、Sheet/AlertDialog、value controllers、Tabs preserve四项；每次并行调用必须使用独立--output。

未执行全仓unit/browser、完整consumer套件、watch/cold-start、物理触屏/读屏器或消费项目页面/API/部署。没有把本库合成样板当成xAgent/xLead等产品已升级或验收完成。

## 嵌套预览与Tooltip的取消顺序（4.2.4，2026-10-17）

来源xAgent旧3.1.1的Sheet→预览Dialog→回文件行→第二次Escape父层仍可见。独立对比旧3.1.1与最新基线4.2.3 / `b5c770f`：裸Button或禁用重复Tooltip时，第一次Escape关闭预览并回文件，第二次关闭Sheet并回开关；真实ContextMenu.Trigger→Tooltip.Trigger→Button组合回焦点后，以trigger-focus打开Tooltip，第二次Escape只关闭该Tooltip，第三次关闭Sheet。逐层open/可见性、escape-key原因和关闭计数确认，不是父Sheet丢监听；没有Overlay逻辑补丁，也没有可冒充本项修复的navigationTriggerRef/Popover提交。

公共建议和[示例](../examples/tabs-overlay-react/app.tsx)按真实信息选择层级：仅重复完整可读文件名的Tooltip使用已有Root.disabled，保留相同Root/Trigger/Button节点；确有额外说明保留Tooltip及完整三层取消。`?overlay`、`?overlay&tooltip`、`?overlay&tooltip&sibling`分别覆盖两层、三层和React树中并列位置；不加document监听、延时focus、私有store或强制同一Escape关闭两层。见[公开合同](COMPONENTS.md#嵌套弹层与-tooltip-的-escape-顺序)、OVERLAY-ORDER-001。仅修改xui文档/示例/回归，不修改宿主业务选择。

使用上节同一4.2.4正式包：Chromium12个嵌套矩阵和3个Chrome缩放复合用例全部通过；Firefox/WebKit各4个代表性嵌套用例通过；原有owned/injected Dialog与多类Overlay Controller回归2/2。light/dark/system、390/320、200%根字号、production/StrictMode、条件Dialog卸载、并列React树、普通/必要Tooltip、回焦点与两轮重复均覆盖。最终组合报告合计151项（57+90+4），三项缩放只计一次，0失败/跳过/flaky；394项逐项接入检查。前一代完整跨引擎嵌套矩阵均已通过，最终跨引擎只重跑代表性组；不得写成最终包全仓测试通过。

基线证据为同目录baseline.json、baseline-old.json、baseline-old-packages.json及日志；最新证据与命令见上节。旧3.1.1只用于同peer单实例的差分，临时兼容consumer/preview已清理，不恢复旧版分发。未访问xAgent真实页面、lazy业务预览、权限API或部署，产品旧负例仍须其自身验收。


本页集中记录当前可复核的执行结果与验收边界；接口和设计合同分别由各能力文档与 [DESIGN.md](DESIGN.md) 维护。测试存在、收集成功、源码检查和实际浏览器通过分别陈述，不把历史全绿或局部复验当作当前完整验收。

以下历史记录保留当时的版本、双端范围及结果。1.0.0移除了原生DOM UI；其中标为“历史路径”的文件需从对应固定提交查看，不是当前公开接口。

## 集合刷新布局连续性（4.2.3，2026-10-17）

与下节焦点补丁共享同一次正式4.2.3构建/consumer及sourceGeneration。旧4.2.2最新基线分别记录了空态替换、CardGroup高度+2px和320px日志区域下移44px/增高8.5px；API Key三宽及日志1280/390没有几何变化。基线通过旧安装包独立重建与输入路径核对，未使用packages/src alias。来源旧版本现象与本轮复现区分记录。

默认refreshing保留已确认空态和原行/控件，不在footer或数据区新增短暂LoadingState。ApiKeyManager、StructuredLogExplorer、BusinessLogExplorer复用同一个内部RefreshAction，以现有Button/Spinner和预留位CSS保持标签及尺寸；日志取消按钮始终占固定动作位，空闲禁用。新增可选`hasValue`表达当前范围已确认过结果（含空），空结果刷新失败时传true，错误/重试位于footer；非空行保持原错误路径，首次加载和首次错误不冒充空集合。未新增查询、缓存、分页、鉴权或业务owner，CSS/Token值未变。`labels.refreshing`仍保留兼容类型，默认不再渲染其临时文案；宿主自行配置feedback仍承担其内容带来的自然高度变化。详见[集合生命周期](COMPONENTS.md#状态焦点与生命周期)。

| 检查 | 最终结果 |
|---|---|
| build/typecheck/Token/docs/正式consumer | 通过；404Token、104入口、391逐项检查；initial JS gzip141997/153600、critical CSS19058/19456、Button6619/16384 |
| 全量unit | 520/520，0失败/跳过 |
| Chromium新增刷新矩阵 | 40/40，含三主题各一项真实Chrome200% |
| Firefox/WebKit新增刷新矩阵 | 各37/37，合计74/74；与焦点合计96/96 |
| Chromium全部选定回归 | 首轮131项中126通过、5失败；修正旧断言/示例接线后仅复验这5项，5/5通过，无剩余失败；不是一次全绿131项报告 |

新增39组几何附件的ready/refreshing最大差为0px，覆盖桌面/390/320、三主题、320px的200%根字号、空/非空DataTable/CardGroup及ApiKeyManager/StructuredLogExplorer held读。验证旧行/按钮身份、焦点、未应用筛选草稿、双次刷新、受控cursor禁重复、空结果刷新错误与首次加载/错误区别。已有API Key CRUD/secret清理、两类日志快照/游标/取消/迟到/失败重试、菜单抽屉与布局、Card/input选择/滚动、首次加载居中及长错误/横滚页脚回归均纳入上述131项。已查看窄屏大字空态和浅色日志held刷新截图。示例`/collection-refresh-react/`。

过程保留：旧基线自动采样wrapper曾因错误等待API Key的busy而超时，主线程改用真实listBusy和独立旧包脚本，补齐baseline-managed.json；不能把该脚本失败当组件故障。首轮unit517/520的3项是旧刷新文案/版本断言，按新合同更新后全量520通过。浏览器5项分别是CardGroup仍断言短暂刷新文案，以及feedback-foundation示例仅预绘制主题、未显式使用按需ThemeService而导致4个system实时切换失败；更新断言并在示例调用公开ThemeService.getState后，用同一正式安装包重建该示例、检查types并复验5/5。没有删除失败用例、放宽几何/焦点断言或改库主题实现；生产包字节与generation均未改变。

证据：`.artifacts/continuity-validation/`的build-final、typecheck-final、tokens-final、unit-final、docs-final、consumer-final日志；baseline-managed.json、baseline.json、geometry-summary.json、report-summary.json、browser-final/cross-final/browser-recheck的JSON/log/trace及images。复现为`node scripts/build.mjs`、`pnpm typecheck`、`pnpm check:tokens`、`pnpm test:unit`、`pnpm test:consumer`，浏览器用该目录配置，选择continuity、collection-refresh、menu-layout、api-key、api-key-v2、structured-log、business-log、card-group、data-table-feedback、loading-centering的spec文件；cross仅新两套且排除`genuine Chrome`。预览4173，报告文件名相对配置或使用绝对路径。feedback示例最后一次重建/类型日志分别为feedback-fixture-final.log与feedback-fixture-types-final.log。

未执行全仓browser、watch/cold-start、真实后端/账户、物理设备/读屏器或消费项目页面/部署。固定产物供宿主升级和接线，不能据此宣布xLead/xQuant/xAgent验收完成；其他维护项不在本次两项修复范围。

## 导航抽屉确认回焦（4.2.3，2026-10-17）

仅修改xui，三包/DESIGN版本4.2.3，末位递增；不提供旧版兼容分发。正式sourceGeneration为`e7926e03fee210b029b2dea95f4d8569c8f1716490f3a051f61b2e3c174d1c60`，独立consumer `.consumers/run-5shx7O/react`使用tarball内ESM/CSS/types，React/ReactDOM19.2.8及Base UI1.7.0单实例，无源码alias。

旧4.2.2 / `7d037443b0744226f8364ea4a660692fed2e6e15`正式consumer `.consumers/run-5Ga5AX/react`在390px复现取消未保存确认后焦点为BODY。现AppShell/MenuLayout公开`navigationTriggerRef`，宿主以AlertDialog已有`finalFocus`明确恢复到稳定开关；放弃可指向目的页面操作，确认期间不抢焦点。对象/callback ref及React19 cleanup、跨断点同一按钮与卸载清理均验证。省略新prop的行为兼容；已有宿主必须按[公开合同](COMPONENTS.md#导航抽屉与未保存确认的最终焦点)接线，不能宣称升级自动修复所有宿主确认框。未修改路由、认证、HTTP或业务guard。

正式Chromium焦点新用例14/14、Firefox/WebKit各11/11通过，0失败/跳过/flaky。覆盖light/dark/system、1280/390/320、长中文、320px的200%根字号、production/开发StrictMode、Enter/Space、取消/放弃、普通Escape、草稿保留与公开ref生命周期。三主题真实Chrome200%页面缩放通过DPR加倍、CSS viewport减半、根字号不变及CSS zoom/pinch=1确认；聚焦控件和轮廓全部在visualViewport内，使用原生截图避免CSS截图裁切。已查看深色390取消回焦和system真实200%最终截图。示例`/continuity-react/`及`/continuity-react-strict/`，公共类型正/负例随正式consumer检查。

证据在`.artifacts/continuity-validation/`：baseline.json/managed-baseline-final.log、browser-final.json/log、cross-final.json/log、images与focus附件；正式产物随最终源码SHA归档。复现：预览4173，`pnpm exec playwright test --config=.artifacts/continuity-validation/playwright.config.mjs continuity.spec.mjs`；跨引擎改用cross.config.mjs并排除`genuine Chrome`。未执行实体设备/读屏器或消费项目真实页面，不把本库样板当产品已升级验收。

## 业务界面决策标准融合（4.2.2，2026-10-17）

用户在独立规范会话审阅Stitch三轮讨论稿后，明确要求由本主会话融合。原草案固定在2460b81；本轮以其全文及当前公开API/slot为依据，将八类决策并入唯一[DESIGN](DESIGN.md#业务界面信息与交互决策)：信息归属与披露、集合/详情形态、导航/Tab/筛选、任务容器、动作与确认、反馈、输入与离开、窄屏连续性。四类场景替换既有粗略组合表，IA-001～012进入既有接入清单，ADOPTION明确“任务→信息/交互→真实组件/slot→状态证据”的顺序。独立草案退出活动文档树，项目无需同时采用两份规范，Git保留来源。

融合时保持Token、尺寸、字体、组件状态和刷新合同的原有owner；模式名不宣称新API，不增加路由、查询、草稿、重试或业务owner。纠正旧首屏条款与长表单/放大自然滚动的冲突：常规查询处理页以首屏核心任务为目标，长内容、窄屏与放大保留任务顺序和完整可达性，禁止缩字、裁切或固定栏遮挡。FRAME-004不再锁死历史1.0.0，统一核对三包同源码/同generation。新增规则的认可与正式文档完成，不代表各公共组件和消费项目已经逐项验收。

三包/DESIGN为 **4.2.2**，仍只递增末位；不恢复兼容版本线。最终sourceGeneration为`1b82310248cb7e041271b1eadb140e2ab5db771e1e71a25d2173e65eb463bc60`；正式独立consumer为`.consumers/run-5Ga5AX/react`，ESM/CSS/types与单实例React/ReactDOM19.2.8、Base UI1.7.0通过。无runtime/React库源码、CSS或Token实现改动；基础示例改用公开FormGrid/FormActions，form页只保留所属表单的一个保存submit，去掉页头重复保存和DOM转发；放大按自然文档滚动验证动作完整可达。正式ESM/CSS/types应与4.2.1逐文件一致，仅build.json、包版本及React精确peer更新。404Token、104公开入口、389逐项检查。完整用户名验证仍保留，见下节。

| 检查 | 实际结果 |
|---|---|
| build/typecheck/Token/docs/正式consumer | 通过，104公开入口、389逐项检查 |
| contract/docs定向unit | 10/10；库源码未改，未重复全量513项 |
| Chromium共享外壳/用户名及三个基础页面场景 | 31/31，0失败/跳过/flaky |
| Firefox/WebKit同组非Chrome缩放场景 | 各25/25，合计50/50，0失败/跳过/flaky |
| 与4.2.1正式dist逐文件对比 | 298文件中仅三份build.json变化；295份ESM/CSS/types等字节相同 |
| 原有预算 | 首屏JS gzip141912/153600、critical CSS19058/19456、Button6619/16384 |

浏览器在最终正式包验证原有用户名和共享外壳的28项，再补三种基础场景：受控主题/sessionStorage/system跟随；列表→表单→详情、错误聚焦、窄屏导航与唯一保存submit；动态加载失败重试及刷新失败保留数据/草稿。包括light/dark/system、1280/390/320、200%根字号、六项真实Chrome200%缩放及原生截图。新表单用例以真实Tab（WebKit按平台Alt+Tab）从名称字段到唯一保存动作，检查焦点及整个按钮在视口内；长表单可以自然滚动。已查看基础列表浅色、390px深色错误与320px/system/200%表单最终截图，页头不再有重复保存动作。它们是公共组合的合成演示，不是业务产品验收。

过程保留首轮规范代build/consumer和首屏句修订后的最终代。示例修改后的初轮30/31及48/50，其失败是测试在放大前后对同一个已聚焦按钮重复调用focus，原生浏览器不会因此再次滚动；改为真实键盘逐控件进入提交按钮，仍要求完整在视口内，未放宽比例或加私有CSS，随后完成上述最终矩阵。证据见`.artifacts/business-design-validation/`的build-final、consumer-example-final、typecheck/tokens/unit/docs日志，contract-review.json、consumer-dist-compare.json、browser.json/log、cross.json/log、images与focus-first报告/trace。复现使用同目录配置，选择admin-username-validation.spec.mjs、admin-setup-form.spec.mjs、foundation.spec.mjs，并grep `shared|form handle|username|public list/form/detail|controlled host theme|failed dynamic import retries`；cross再排除genuine Chrome。规范决策/接线审阅与实际浏览器行为分别记录。

未执行全仓浏览器、watch/cold-start、物理设备/读屏器及消费项目页面/真实API/后端/部署。来源新增的抽屉确认回焦、刷新几何反馈仅登记在PUBLIC_REQUESTS 14/15，未在最新库独立复现或修复，未因本轮普通导航/刷新保值用例通过而关闭；Tabs变体等既有待办也不因此宣布完成。

## 管理员用户名校验与单一版本线（4.2.1，2026-10-17）

本轮仅修改xui。正式三包与DESIGN统一 **4.2.1**，后续所有改动仅递增末位（4.2.2、4.2.3…）；不再回补或分发3.x兼容包。版本号不代表语义兼容，实际迁移以公开合同、固定SHA/sourceGeneration为准。React对runtime的peer固定同版4.2.1，防止混用缺少新form方法的旧Controller。四个兼容分发目录3.0.1/3.1.0/3.1.1/3.1.2已删除，3.0.0顶层及历史tarballs共六包已移除，兼容工作树经确认干净后归档退役；保留Git历史与metadata/validation证据，不再保留活动兼容构建。未操作外部Release或消费项目。删除明细见本轮compatibility-cleanup.json。

基线：独立正式4.1.2消费者`.consumers/run-dzjhlT/react`的Controller不识别validateUsername，合成用户名a仍写入一次、规则调用零次。新公开`AdminSetupUsernameValidator=(raw:string)=>string|null`由宿主定义同步纯规则及本地化文案；Form/Page默认模式和Controller options一致接线。必填优先、null通过、非空字符串拒绝；不裁剪、转换大小写或内置xLead正则。错误复用Field关联，显式提交失败聚焦用户名并保留DOM密码；Controller提交边界也复核，拒绝后清理凭据对象密码、零写入。规则更新仅影响后续显式校验；异常/非法/Promise返回安全拒绝，不暴露错误或应用迟到结果。未知结果仍锁定、无自动重试/登录/请求，清密与原AuthPage外壳保持。合同与示例见[用户名校验](COMPONENTS.md#宿主用户名校验)，接入检查AUTH-UI-008。

最终sourceGeneration：`31a7b4da0d9f0ca89e4749bd35ad6bead3c39ef6ca6e0867d2578c865bef2e58`。正式独立consumer为`.consumers/run-SZ1Tps/react`；全部ESM/CSS/types安装，不使用源码alias，单实例React/ReactDOM19.2.8、Base UI1.7.0，三包同版同代；404Token、104公开入口、377逐项检查。该代包含并行文档会话2460b81的草案迁移，新增业务决策仅在独立草案中，未提前进入正式验收门槛。

| 检查 | 结果 |
|---|---|
| build/typecheck/Token/docs/正式consumer | 通过；critical CSS gzip19058/19456、首屏JS141916/153600、Button6619/16384 |
| 全量unit（文档迁移前，UI源码相同） | 513/513 |
| 冻结后admin-setup/contract/docs定向unit | 26/26 |
| Chromium新规则与原共享外壳回归 | 28/28，0失败/跳过/flaky |
| Firefox/WebKit非Chrome缩放用例 | 各22/22，合计44/44，0失败/跳过/flaky |

浏览器覆盖默认/注入、production/StrictMode，输入a被拒绝、零写入、aria-invalid/describedby与用户名聚焦；英文/中文规则、异常fallback、移除规则后a正常提交、单次写入/清密和未知结果锁定。三主题×1280/320、200%根字号、长中文错误、错误修正后提交与system实时切换；原外壳回归覆盖检查/错误/初始化节点连续、密码匹配、手动核对、卸载/借用生命周期和键盘。新增与原有各三项真实Chrome200%页面缩放，DPR加倍、CSS viewport减半、根字号不变、CSS zoom/pinch=1；原生截图避免CSS裁切，焦点四边不超实际可视视口。未触发真实认证或管理员初始化API。

过程记录：首轮build在并行规范编辑期间触发source changed保护，未发布半代；早期单测读到旧dist失败，稳定重建后16项通过。旧779b代Chrome25通过/3失败，Firefox/WebKit44通过；三处失败因innerHeight将406.5CSS可视高度取整为406，误报轮廓越界0.5。focus-probe.json与原生截图确认实际可视边界，测试改用visualViewport高度，仍使用精确不越界断言，未放宽容差或修改组件CSS。随后另一会话按用户要求将规范移为独立草案，最终按新31a7代重建/安装并重新完成矩阵；旧失败日志与诊断保留。

证据在`.artifacts/admin-username-validation/`并随固定产物归档：baseline.json、compatibility-cleanup.json、build/typecheck/tokens/docs/unit/consumer的frozen日志、browser.json/log、cross.json/log、images、首轮报告/trace与focus-probe。复现：`node scripts/build.mjs`、`pnpm typecheck`、`pnpm check:tokens`、`pnpm test:unit`、`pnpm test:consumer`；`pnpm exec playwright test --config=.artifacts/admin-username-validation/playwright.config.mjs admin-username-validation.spec.mjs admin-setup-form.spec.mjs`，跨引擎改用cross.config.mjs并`--grep-invert 'genuine Chrome'`，预览端口4173。报告路径使用相对配置的browser.json/cross.json或绝对路径。

未执行全仓浏览器、watch/cold-start、实体设备/读屏器、消费项目实际页面/认证/初始化后端/部署；不能由公共合成样板替产品宣称升级完成。新规则可选，默认只非空；现有factory调用无需变更，手写完整form Controller需实现新增方法。与旧3.x相比既有4.0服务迁移仍须由产品按当前合同处理，本轮不再提供平行兼容包。

## 程序错误Explorer列阅读布局（4.1.2 / 3.1.2，2026-10-17）

xQuant固定3.0.0 / `b9753a4f43967c76f566eefdab38042d0423da18` 反馈：展开324px侧栏、1280窗口、长中文摘要时累计/匹配表头逐字竖排。本轮先在正式4.1.1消费者复现“累计观察数”5行，单行断言失败。正式3.0.0、3.1.1、4.1.1的structured-log.js SHA256均为`ff99e2408f405024221aa4f40d3556bda1d3601cff1b26c160dde8a6728adb2b`；当前Props没有列宽配置入口，不是遗漏宿主接线。原xQuant PG/119项HTTP/57页面主题和88.21现场证据仅按来源登记，本轮未在宿主重跑。

修复仅在React Explorer所有表头和records三态/分类标签采用已有xui-table-label角色。摘要继续主列下限与自然换行，计数/时间单行，长标签或窄屏按TableContainer横滚；未修改通用Table、CSS、Token值/数量404、DTO/API、runtime、cursor/as_of、刷新/权限或认证代码。不新增列宽API、业务owner或宿主私有CSS。接入清单新增LOG-LAYOUT-001，样板`/log-react/?long-labels`使用合成文案覆盖累计/匹配与三态长标签。

正式三包/DESIGN为 **4.1.2 / 3.1.2**；sourceGeneration分别`2564dcad1079d06dc4bf4374f9af16049347d7778e117d9c00646d5956d4e9bd` / `e37a501e6d251a2576929eef51b870bb057418a3cde3c8b0594b8eb56a369dc6`。独立消费者分别`.consumers/run-dzjhlT/react` / `.consumers/run-cAVWp9/react`；公开ESM/CSS/types和单实例React/ReactDOM19.2.8、Base UI1.7.0通过，无源码alias。3.1.2保持3.x服务与peer合同，不要求升级4.x。

| 检查 | main4.1.2 | 兼容3.1.2 |
|---|---|---|
| build/typecheck/Token/正式consumer/文档/diff | 通过 | 通过 |
| structured-log及主题合同定向unit | 24/24 | 24/24 |
| Chromium新布局及原日志回归 | 18/18 | 18/18 |
| Firefox/WebKit新布局 | 各9/9，合计18/18 | 各9/9，合计18/18 |
| critical CSS gzip / 原预算 | 19058/19456 | 18685/18688 |
| 首屏JS gzip / 原预算 | 141915/153600 | 152195/153600 |

新增12项Chromium为light/dark/system ×1280/390/320（窄屏200%根字号）9项，加三主题真实Chrome200%页面缩放3项；确认DPR加倍、CSS viewport减半、根字号不变、CSS zoom/pinch=1。保留完整表头单行与三态词组断言，14/28px公共字体不缩小，摘要全文可读/自然换行，document无横溢出。键盘从表格region进入组/记录行操作，浏览器自动滚动使按钮可达；记录详情动作焦点在视口内。WebKit使用平台Alt+Tab。刷新hold/release保持同一行节点，原6项回归覆盖计数/uint64、cursor/as_of、过滤、详情权限/清理、错误/取消/迟到、窄屏和退出；HTTP为合成fetch，不冒称真实鉴权验收。Firefox/WebKit只跑新增9项，两线均0失败/跳过/flaky。

已查看两线浅色1280分组截图：累计/匹配表头保持单行；另查看窄屏大字、记录与真实zoom代表图。`groups-geometry.json`与`computed-columns.json`记录实际字体/表头/表内滚动几何。初轮新测试误用旧计数label，另一次probe因DataRegion与滚动region同名而严格定位失败；只修正为示例实际label和可聚焦region，未放宽布局或键盘断言。原6项首轮已通过，后与最终新增12项同次18/18；后续补充记录首个详情动作的焦点视口断言，再次完成上述最终矩阵。过程失败/中断日志和probe保留，不当作最终成功。真缩放的最终截图使用仓库captureZoomViewport原生方法并验证PNG覆盖物理viewport，避免Playwright默认CSS裁切；兼容预览提前关闭造成的采样连接中断另存preview-restart-3.log，重启后以同代正式包完成最终矩阵。

证据各自`.artifacts/log-columns-validation/`随固定产物归档：`baseline.json/log`（主线）、`baseline-esm.json`、`build-main.log`或`build-3.log`、`{typecheck,tokens,targeted-unit,consumer,docs}.log`、`browser-main.json/log`或`browser-3.json/log`、`cross-main.json/log`或`cross-3.json/log`、`images/`与几何JSON。复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`node --test tests/structured-log.test.mjs tests/contract.test.mjs`、`pnpm test:consumer`；Chromium运行`structured-log-columns.spec.mjs structured-log.spec.mjs`，跨引擎运行新增文件并`--grep-invert 'genuine Chrome'`，配置/端口4173和4174见证据目录。

未执行全量unit/全仓浏览器、watch/cold-start、读屏器/实体移动设备、xQuant生产页面/API/PG/鉴权或部署。补丁不证明消费项目已升级，也不改变其GET/POST或BaseService合同。

## 链接按钮hover对比度（4.1.1 / 3.1.1，2026-10-17）

来源为xAgent固定3.0.0 / `b9753a4f43967c76f566eefdab38042d0423da18` 的默认浅色Button variant=link反馈。本轮先用正式4.1.0（`ae426453c7eec3c7f1ffc018976ea1ffa1fe860e`）和3.1.0（`31a54e5f2c0aca4552c629e4c7987f1208a97337`）独立消费者真实hover复现 **4.346070311712855:1**，严格4.5断言均失败。3.0.0/3.1.0/4.1.0正式button.css的SHA256相同；没有把CSS一致性当作已跑过3.0.0产品浏览器。

修复仅在link:hover复用已有 `interaction-hover-foreground` 与 `interaction-hover` 配对，图标通过currentColor继承；默认主色、字体、尺寸、全局Token值及数量404均不变，disabled不进入hover规则。React/runtime实现、API、权限、HTTP/认证和宿主未修改。浅色hover及指针按下最终 **14.481508292066573:1**；实际浏览器按合成祖先背景和解析后的颜色空间计算，不以固定HEX或静态主色对白底替代。

正式三包/DESIGN分别 **4.1.1 / 3.1.1**；sourceGeneration分别 `5e0730fccfe2047daad03f1f07e9ef451b3205e935559f8e55c267d9c7d51780` / `9732ecadea835ec53db7b660d88c3d0ea1cd56fccd7df9819bdc429c94c7c58a`。3.1.1保留3.x服务和peer范围，不要求4.x迁移。独立安装路径分别 `.consumers/run-4ZfY2s/react` / `.consumers/run-2M6bNm/react`，ESM/CSS/types公开入口、正负类型与单实例React/ReactDOM 19.2.8、Base UI 1.7.0通过，无源码alias。

| 检查 | main 4.1.1 | 兼容3.1.1 |
|---|---|---|
| build/typecheck/Token/正式consumer/文档/diff | 通过 | 通过 |
| Button disabled/xs与主题合同定向unit | 12/12 | 12/12 |
| Chromium | 13/13 | 13/13 |
| Firefox/WebKit 新增link专项 | 各8/8，合计16/16 | 各8/8，合计16/16 |
| critical CSS gzip / 原预算 | 19058/19456 | 18685/18688 |
| 首屏JS gzip / 原预算 | 141915/153600 | 152196/153600 |

新增8项为light/dark/system-light/system-dark ×1280/320，窄屏使用200%根字号；真实hover、指针按下、键盘Space按下与focus均检查普通文字≥4.5、图标同色和无横向溢出，验证button Enter/Space各一次、真实anchor Space零动作/Enter导航一次、busy独立可操作、禁用button/anchor零动作。Chromium另含3项主色覆盖D/H/P回归和2项forced-colors禁用回归，Firefox/WebKit仅新8项；WebKit使用平台完整键盘Alt+Tab。已查看正式包浅色宽屏与深色窄屏大字截图，两线均未失败/跳过/flaky；旧基线的预期失败单独保留。

证据位于各自 `.artifacts/button-link-validation/` 并随固定产物归档：`baseline-main.json/log`或`baseline-3.json/log`、`baseline-css.json`、`build-main.log`或`build-3.log`、`typecheck.log`、`tokens.log`、`targeted-unit.log`、`consumer.log`、`browser-main.json/log`或`browser-3.json/log`、`cross-main.json/log`或`cross-3.json/log`、`computed-states.json`与`images/`。复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`node --test tests/button-disabled-contract.test.mjs tests/button-xs-contract.test.mjs tests/contract.test.mjs`、`pnpm test:consumer`；Chromium运行`button-link-contrast.spec.mjs button-brand-inheritance.spec.mjs button-state-contract.spec.mjs --grep 'link |primary Button|disabled Button variants preserve'`，跨引擎仅`button-link-contrast.spec.mjs`，均使用证据目录中的config与对应端口4173/4174。

未运行完整unit/全仓浏览器、真实浏览器200%页面缩放、watch/cold-start、读屏器/实体设备、宿主页面/认证或部署；本次仅样式修订，不复用之前的全量/真缩放结论。扁平Tabs没有现成公开变体，单独列为待设计实现，本补丁不新增或冒称该接口。

## 可组合管理员初始化表单（4.1.0 / 3.1.0，2026-10-17）

新增 `/admin-setup` 与根入口的 `AdminSetupForm / AdminSetupFormProps / AdminSetupFormHandle`，完整 `AdminSetupPage` 直接复用同一个 Form。宿主保留一个不传form的AuthPage，在children切换检查/错误内容与Form；检查期间零form，初始化期间唯一form。没有修改AuthPage的form模式约束，没有复制密码/提交逻辑，也没有修改runtime认证、初始化协议或消费项目。

库源码基线为主线 `35fc181e852112f7c56338a858261b5ef740e932` / 4.0.1 与兼容线 `7722d385270426824e13ef1a47d85b7c6903fa31` / 3.0.1。正式三包与DESIGN分别为 **4.1.0 / 3.1.0**，404 Token、104 / 102正式入口、375 / 363逐项接入检查。最终source generation：主线 `86580e148a182f65c36260f548d600a4337a6a30a3660b5090dd9f7bc9f407f7`，兼容线 `acda2c6837ce088d6729623360c13c4213beaf0cf75d90308f65daa6af3bd253`。3.1.0只扩展原3.x公共表单，不要求服务/Upload迁移；新增示例按各版本既有入口激活唯一Theme owner，不创建第二主题状态。

| 检查 | 主线4.1.0 | 兼容3.1.0 |
|---|---|---|
| build / typecheck / Token / 正式包与类型 / diff | 通过 | 通过 |
| 完整unit | 506/506 | 492/492 |
| Chromium专项与相关回归 | 45/45 | 45/45 |
| Firefox / WebKit Form专项 | 各12/12，共24/24 | 各12/12，共24/24 |
| critical CSS gzip / 上限 | 19053 / 19456 | 18680 / 18688 |
| 首屏JS gzip / 上限 | 141914 / 153600 | 152195 / 153600 |

正式消费者安装同代ESM/CSS/types与React/ReactDOM 19.2.8、Base UI 1.7.0，逐输入排除packages/src alias。正负类型fixture覆盖子入口/根导出、ref和默认/注入互斥；示例对checking状态执行真实SSR后hydrate，production与开发StrictMode均无hydration/page error。没有真实初始化、登录或后台请求。

新增15项Chromium专项覆盖默认/借用 × production/StrictMode、检查→错误→重试→初始化的main/brand/logo/card节点identity、0→1 form、校验错误关联及焦点、同tick双提交仅一次、用户名保留、busy和即时清密、未知结果锁定、手动核对失败/完成，以及ref.clear与退出清密、借用实例继续可用和显式停止后迟到结果隔离。旧完整Page、纯AuthPage及相关密码/反馈回归包含于45项，不另相加。三主题、1280/320px、长中文、200%根字号和system实时变化均验证；真Chrome200%页面缩放确认DPR×2、CSS视口减半、根字号不变、CSS zoom/pinch=1，且完成键盘提交。已查看最终浅色宽屏、深色窄屏大字、真实zoom和WebKit窄屏代表图；沿用Stitch V3既有视觉合同，本轮未另请Stitch审图或改Token值。

WebKit在窄屏大字时原生focus仅滚动到caret，初轮跨引擎21/24，三项完整输入组焦点环被裁切。定向诊断在2/10帧后仍测得bottom828.97 > viewport800，证明并非未等待绘制。Form现在在下一布局帧仅对仍连接且仍为activeElement的控件调用标准nearest滚动，遵循现有scroll-margin，不改焦点、Controller或回调；正式包保留严格四边断言并增加真实键盘顺序。绘制测量等待两帧；WebKit使用该平台完整键盘导航Alt+Tab，与仓库既有用例一致。修复后曾因新增测试误用默认Tab而出现三项button未聚焦，随后仅修正平台按键，未放宽边界或强制focus。过程诊断与失败记录均保留。

主线最初57项中49通过、8失败：4项来自新测试在busy后仍用旧按钮名称定位，改为唯一原生submit并保留文案/disabled验证；另4项是无关旧text-inputs示例system有效属性未实时更新。后者已用固定4.0.1正式消费者复现（`baseline-theme.json/log/mjs`），其示例只启用预绘制init，没有激活实时Theme owner，未在本次修改。最终定向运行排除该12项Textarea矩阵；其余45项完整通过，不宣称最初57项或全仓浏览器全绿。

证据在两工作树各自 `.artifacts/admin-setup-form-validation/` 并随固定产物归档：主线 `build-main-focus.log`、`typecheck-main-focus.log`、`unit-main-focus.log`、`consumer-main-focus.log`、`browser-main-focus-final.json/log`、`cross-main-final.json/log`；兼容线构建/类型/unit/consumer见 `*-final.log`，Chromium为 `browser-focus-final.log`，跨引擎为 `cross-evidence-final.json/log`；Chromium最终45项仅保留通过日志，不宣称另有最终JSON。初轮日志、WebKit诊断JSON及images保留。复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`pnpm test:unit`、`pnpm test:consumer`；Chromium运行 `admin-setup-form.spec.mjs admin-setup.spec.mjs auth-page.spec.mjs public-feedback.spec.mjs --grep-invert 'textarea bounded'`；跨引擎只运行新Form文件并排除`genuine Chrome`。配置、独立端口及正式消费者路径见归档。

兼容性：新增接口为可选采用的组合能力，原Page props/handle、Controller、labels、提交结果与密码清理合同保持。Page内私有DOM改由Form组合；消费方不得依赖私有结构。未执行无关浏览器全集、watch/cold-start、真实读屏器/实体移动设备、消费产品初始化/认证API、持久化或部署验收，不替宿主豁免自己的门禁。

## 受控交互的当前提交一致性（4.0.1，兼容回补3.0.1，2026-10-16）

xLead 在固定 `b9753a4f43967c76f566eefdab38042d0423da18` / 3.0.0 上反馈：父组件确认 Disclosure `open=true` 后，其 effect 仍读取到隐藏内容，立即 focus 失败。独立正式3.0.0消费者复现了该问题；同源的 Tabs / Combobox 受控值也在父 effect 中滞后一轮。证据为 `.artifacts/controlled-render-validation/baseline-3.0.0.{json,log}` 与 `baseline-values-3.0.0.{json,log}`。本轮没有修改或验收 xLead。

修复共享 `useOverlay/useValue/useSelection`：当前 render 直接投影已经确认的受控 props；layout 阶段继续同步所属 Controller，不在 render 中写外部 store。默认、非受控、取消/拒绝、借用 Controller 与清理责任保持原合同；外部确认不新增用户回调。没有改认证、服务、CSS、公共 exports 或事件类型。父 effect 可以立即读取 Disclosure 可见性并聚焦其中内容。Select 原生 form value 同步提交；其 `Select.Value` 派生标签、Portal 和动画仍遵循 peer 生命周期，未承诺父 effect 中全部派生文本同步完成。

主线三包与 DESIGN 为 **4.0.1**，source generation `5c42f0165894fe990ba21affb9041166b795d541e613a1178fe3862a87c3a113`；为固定3.0.0消费者另提供兼容 **3.0.1**，generation `b2499e881c01b68125cecbf8049b88d02acb91ee2a1585c83792057e59139553`。3.0.1不包含4.0的服务/Upload迁移；无须为本修复升级主版本。两条线均使用独立正式 tarball ESM/CSS/types 消费者，React/ReactDOM 19.2.8、Base UI 1.7.0，测试构建逐输入排除源码 alias。

| 检查 | 主线4.0.1 | 兼容3.0.1 |
|---|---|---|
| build / typecheck / Token / 独立正式消费者 | 通过；104公开入口 | 通过；102公开入口 |
| 完整 unit | 505/505 | 491/491 |
| Chromium 新增专项 | 最终11/11 | 11项包含于37/37 |
| Controller / 分组搜索 / foundation 定向回归 | 26/26，来自首轮未失败范围 | 与新增专项同次37/37 |
| Firefox / WebKit 新增专项 | 各11/11，合计22/22 | 各11/11，合计22/22 |
| 正式包静态 SSR | controlled false/true；借用快照不变且仍可用，零回调 | 同样通过 |

主线证据在 `.artifacts/controlled-render-validation/`：`build-main.log`、`{typecheck,tokens,unit}-main.log`、`consumer-main.log`、`browser-main-first.json`、`browser-main-final.json/log`、`cross-main.json/log`、`ssr-main.log`。3.x对应独立维护工作树内同名验证目录的 `build-final.log`、`typecheck.log`、`tokens.log`、`unit.log`、`consumer.log`、`browser.json/log`、`cross.json/log`、`ssr.log`，随固定产物归档。

新增浏览器覆盖 production/StrictMode、受控 false↔true、父 layout/passive effect 的即时内容与焦点、从内容收起回焦及外部焦点不被夺取、Tabs / Select原生值 / Combobox输入、拒绝/取消、非受控Space，以及借用 Controller 卸载后继续使用。light/dark/system ×1280/320px和200%根字号均验证焦点、ARIA与横向边界；已查看浅色宽屏和深色窄屏代表截图。

主线首轮 **35/37** 保留在日志：两项失败来自测试把 Base UI `Select.Value` 派生标签误当作父 effect 同步承诺。根据公开生命周期，改为验证同次提交的原生 form value，并继续验证标签最终更新；Disclosure 即时可见/聚焦断言未放宽。修正后新专项11/11及跨引擎22/22均通过；兼容线使用最终测试一次37/37。

复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`pnpm test:unit`、`pnpm test:consumer`；配置和完整浏览器命令见上述验证目录。浏览器范围为 `controlled-render.spec.mjs controller-modes.spec.mjs grouped-search.spec.mjs foundation-contract.spec.mjs`，跨引擎只跑新增文件。未执行无关浏览器全集、watch/cold-start、SSR hydration、真实读屏器、真实浏览器200%页面缩放、实体设备及消费产品/后端/部署验收；本补丁不改尺寸或布局，未复用旧版本真缩放结果冒充本轮实测。

## 按需 Service 架构与文件上传（4.0.0，2026-10-16）

本轮仅修改 xui，从 `b9753a4f43967c76f566eefdab38042d0423da18` / 3.0.0 继续。三包/DESIGN 为 **4.0.0**，404 Token、104 公开入口、374 项逐项检查。source generation 为 `3ca598047b7ed7a2d786274741dfe55423f8ceae2b77ecbe1aed3c87b9cda568`；正式独立消费者 `.consumers/run-WY19g0/react` 安装 ESM/CSS/types 与相同 build.json，未使用 src alias/私有 CSS，React/ReactDOM 19.2.8、Base UI 1.7.0 单实例。

`bootstrap` 只解析配置并建立首绘主题/缩放/语言/标题；各窄入口导出稳定 Service 引用，首用才读取同一注册表配置。正式 bundle metafile 验证 bootstrap 不含 HTTP/Auth/Route/Menu/Upload 实现；HTTP 不静态引入 Auth，Upload/Download 逐层依赖 HTTP，Menu 依赖 I18n/Config，Util 保持纯函数。完整 `/services`/runtime 根入口有意汇总。启用认证后请求前先绑定同一 owner；显式借用 HTTP 时注入阶段无 IO 绑定，避免宿主原引用首请求绕行。失败安装回滚；自有 Auth dispose 解除自己的 binding。配置、Service、组件 Controller 与 React View 的职责和 4.0 getter 迁移已在 PUBLIC_API/COMPONENTS/ADOPTION/检查清单逐项对应。

新增 UploadService → 独立 UploadController → React Upload，复用共享 HTTP/Auth，一次 multipart POST、120秒默认预算、无自动重放；选文件不发请求，类型/大小/数量验证、部分成功、取消/迟到/重试隔离、disabled/readOnly 和完整 Controller 注入都有用例。沿用 Field/Button/Badge/Progress 与文字继承，文件行稳定保留，indeterminate 等待居中，无伪造百分比。取消/失败明确结果可能未知，移除不代表远端删除。

| 门禁 | 结果与证据（均在 `.artifacts/upload-validation/`，另注除外） |
|---|---|
| 构建 / 类型 / Token / 文档 | 通过；`build-exports.log`、`typecheck.log`、`tokens-final.log`、`docs-release.log`；最终104入口/374检查 |
| 单元测试 | Upload 8/8、service-modules 6/6；完整首轮504/505，Auth destroy后错误类型回归修复后相关48/48。最终完整 **505/505，0 fail/skip**，见 `unit-final.log`；不以首轮失败计作通过 |
| 正式包消费者 | `consumer-focus.log` 通过全部exports/types/正负fixture、peer单实例、独立示例、依赖和gzip门禁；初始 peer范围漏改、type-only re-export收集误判均修复后重跑 |
| Chromium 初轮专项/相关回归 | `browser.json/log` **46/46**，含Upload、bootstrap、HTTP、认证页/Bearer；未跑全仓浏览器套件 |
| Chromium最终Upload布局/焦点 | `browser-focus.json/log` **21/21**；新Enter/Space原生chooser **1/1**，`browser-keyboard.json` / `browser-keyboard-final.log` |
| Firefox / WebKit相关回归 | `cross.json/log` **62/62**；最终页面inset/完整焦点环复验 `cross-focus.json/log` 36通过、2个测试定位失败，修正定位后新chooser用例 **2/2**，`cross-keyboard-final.json/log`；没有未关闭失败 |
| watch / 冷启动 | `watch-final-rerun.log` **1/1**、`cold-start-final.log` **1/1**。watch首轮探针把注释放在layer外、继续到旧theme文件找storage key；只更新测试夹具至真实结构，严格生成器不放宽 |

复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`pnpm test:unit`、`pnpm test:consumer`、`pnpm test:watch`、`pnpm test:cold-start`。浏览器命令/配置保存在上述目录：首次 Chromium 运行 upload/bootstrap/http/auth-bearer/auth-page；跨引擎运行 upload/bootstrap/http，排除只能在Chrome设置执行的真缩放项；示例inset修正后仅重验受影响Upload。新键盘测试首轮 `getByLabel('附件')` 同时匹配region/list，改为原生file input并独立断言其可访问名称、required/描述关联；三引擎Enter/Space均真实打开chooser，选择后焦点保留且零请求。

浏览器覆盖三主题及system实时变更、1280/320px、长中文、200%根字号/界面比例；Chrome设置真正200%页面缩放验证DPR×2、CSS视口减半、根字号不变、CSS zoom=1/pinch=1。逐项检查multipart字段/文件名/boundary、响应确认、行DOM与外部草稿保留、取消/重试/完成/删除后的焦点、StrictMode及真实退出；完整焦点环四边都在视口内。已实际查看 `images/` 中浅色桌面、深色窄屏、大字与真实zoom截图。

Stitch仅进行了**文字合同审阅**（`stitch-upload-review.txt/png`）：确认单一语义选择代理、无冗余Tab、Field关联、自然折行、就近回焦点、内容宽度动作和无假进度。其建议映射到现有真实Token，不另造样式；网络结果按对应文件行表达以保留部分成功。右侧画布是旧登录V3，不能称Stitch审过上传实际截图或代码。

未执行：全仓浏览器完整套件、真实OS文件窗口/读屏器/移动键盘、真实后端存储/鉴权/CSRF/事务与产品页面、生产部署。浏览器HTTP为合成route响应，Auth为正式wire夹具；不证明任何消费项目升级或真实文件已持久化。4.0的兼容性变化是服务实现随模块加载，容器getter需先加载对应模块；基础Service工厂不恢复，组件Controller仍逐实例。

## Toast 完整 Controller、通知布局与时限（3.0.0，2026-10-16）

按用户授权以 xui 自有 Controller 替换 Toast 内核：runtime `/toast` 是唯一队列、进入/关闭阶段、可见上限、时限及 Promise owner；React 负责 DOM、实际焦点、播报、动画回执及手势测量。Provider 可创建唯一默认实例，或完整借用同一 Controller；借用时不创建、配置或销毁第二实例。没有读取 Base UI 私有 store，Button/render 与锚定几何仍复用其公开能力。默认右上角，`timeout` 省略或 `0` 使用配置默认（5000ms），`-1` 保持显示，正数为毫秒；无 View、悬停、焦点、窗口失焦、隐藏文档和手势期间暂停，恢复剩余时限。

三包与 DESIGN 为 **3.0.0**，404 Token、102 公开入口、362 项接入检查。正式 ESM/CSS/types 的 source generation 为 `f29cfd1d5e80159224d521ee3a752a5f22029c05152e3e98721f5d7b7223d666`，独立安装目录 `.consumers/run-M497TD/react`。全部公开 exports/types、正负类型 fixture 与示例均使用正式 tarball，没有源码 alias；React/ReactDOM 19.2.8 与 Base UI 1.7.0 单实例。公开组合和迁移示例见 [Toast 合同](PUBLIC_API.md#toast-完整-controller)。

| 检查 | 最终结果 | 证据（`.artifacts/toast-validation/`，另注路径除外） |
|---|---|---|
| build / typecheck / Token / 文档 / diff | 通过；248 文件、2419 条设计声明、404 Token | `.artifacts/toast-work/build-viewport-final.log`、`release-final-{typecheck,tokens,docs,diffcheck}.log` |
| 完整单测 | **491/491**，无 fail/skip；其中 runtime Toast **18 项**属于该总数 | `release-final-unit.log` |
| 独立正式包消费者 | 通过，同代 ESM/CSS/types、全部公开入口、示例及体积门禁 | `.artifacts/toast-work/consumer-final.log`、`.artifacts/performance-baseline.json` |
| Chromium 专项与相关组合回归 | **59/59**，无 skip/flaky；Toast 33 项，其余为 foundation 与 typography slots | `browser-final.json/log` |
| Firefox / WebKit 定向回归 | 各 **16/16**，合计 **32/32**，无 skip/flaky | `cross-final.json/log` |

浏览器覆盖默认/借用、StrictMode、绑定前入队、同 id 实例替换、真实退出和迟到 Promise/动画；关闭/移除各一次、动作不重复执行、禁用和 preventDefault、显式 Portal 容器与 Positioner。核对 title/description 动态卸载后的 ARIA 清理、render 自带内容及实际 ID；F6/Tab/再次 F6/Escape、外部关闭/destroy，以及焦点仅停在区域尚未 Tab 时退出/替换/清空，均回到正确位置。普通与高优先级 live region 的属性已检查，但不据此宣称真实读屏器播报验收。

视觉覆盖 light/dark/system（含 system 实时变化）、1280/320px、长中文、200% 根字号与界面缩放、forced-colors，及真实 Chrome 200% 页面缩放（DPR 加倍、CSS 视口减半、根字号不变、CSS zoom/pinch 均为 1）。Content/Actions 使用公共文字、间距及 small 32px 按钮；动作独立末行靠右，窄屏/大字收敛为一项，悬停/焦点展开并在 40dvh 公共上限内滚动。新增 scroll-margin 保护控件四边的完整焦点轮廓；最终用例比较 outline 与 offset 后的完整边界，不能仅以按钮中心可见判通过。已查看 `images-final/` 中浅色窄屏、深色桌面、大字、真实缩放和高对比度代表图。

与 Stitch 的本轮交互是**文字合同审阅**：确认独立 Actions 行、沿用公共 32px 按钮、窄屏单项/40dvh 及可翻译关闭名称，不采用负偏移或第二套尺寸。记录在 `stitch-review-state.txt`、`stitch-review.png`；右侧画布仍是此前登录 V3，不能称为 Stitch 审过实际 Toast 截图或代码。实际截图验收由本轮正式包浏览器执行。

过程失败分别保留：`browser-first.json` 首轮 **22/23**，Positioner 缺少公开 Popover.Portal 而报错，修复后通过；旧正式包的更严格焦点边界断言在 `focus-baseline.json/log` 复现底边轮廓裁切，公共 scroll-margin 修复后最终通过。`viewport-focus-recheck.json/log` 的旧候选为 **1/3**，暴露区域焦点在替换空队列/destroy 后未返回；修复 DOM 焦点所有权和空队列回焦后，本次正式包三项及跨引擎全部通过。独立审查另有当前源码内存 bundle **5/5**，只作定向复验证据，不替代上述正式产物结果。

critical CSS 初轮 **18604** 超过旧 **18560** 上限，保留实际失败；此次通知槽和高度 Token 明确增加 **128 bytes** 预算至 **18688**，最终 **18622/18688**。首屏 JS **152123/153600**、Button **6619/16384**，窄 Clipboard/Theme/I18n/Menu Service 分别 **3859/3491/3028/3253**（各不超过4096），未提高这些预算。React Doctor 固定 0.9.18，以 `--verbose --no-score --no-supply-chain` 检查单文件：发现并修复 Hook 名称、依赖和 Context 值问题；最终为 **0 errors、2 warnings**（`react-doctor-final.log`）。一项提示 cleanup 读取变化的 focusedId.current：这里必须读取退出时实际焦点归属，不能捕获绑定初值；相应退出/替换用例已验证。另一项是 Root 复杂度18/最大嵌套2的维护建议，队列模型和独立手势 Hook 已分离，保留集中 DOM 投影；未为消除建议机械拆分。不将建议项或不可用评分算作功能失败/通过。

兼容性：这是主版本升级。旧外部 Base UI Toast manager/对象不能继续注入，须改用 xui `/toast` 工厂；`Toast.createToastManager` 兼容拼写返回同一完整 xui Controller，原组合名称保留。旧 `timeout: 0` 常驻改为 `-1`，默认位置改为右上角；不保留 peer 私有堆叠变量。重要错误仍须在所属内容区域持续可见。未改消费项目、业务 API 或认证逻辑。

复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`pnpm test:unit`、`pnpm test:consumer`；Chromium 使用 `playwright.config.mjs` 执行 `toast.spec.mjs foundation.spec.mjs typography-slots.spec.mjs`；跨引擎使用 `cross.config.mjs` 与 `cross-final.log` 中的定向范围。未执行无关浏览器全集、watch/cold-start、独立 SSR hydration、真实读屏器/实体移动设备或消费产品/后端/部署验收，不宣称各产品已升级。

## 登录 V3 与导航生命周期（2.0.1，2026-10-16）

按用户确认的 Stitch V3 落实公共 `AuthPage`：原宿主 Logo/名称独立居中置于卡片外，卡片使用完整细边线与公共圆角，标题/字段/主操作采用同一认证布局 Token。没有替换 Logo、增加说明噪声或改变认证协议；`ConfigurableLoginPage` 与管理员初始化复用该布局。slot 归属见 [认证布局](COMPONENTS.md#认证布局-slot-归属)。窄屏内距受视口约束，200% 界面缩放仍可到达控件，垂直空间不足时自然滚动；没有缩小文字来掩盖溢出。

另行修复两个 LoginView 生命周期缺陷：StrictMode 释放并立即重新绑定同一 View 不再重复导航；会话刷新暂时进入 unknown 时，先前导航 Promise 的拒绝仍保留为可重试错误。真实退出或用户变化继续撤销旧导航；secret reader 在解绑时立即移除，不延迟秘密清理。两个运行时回归用例分别覆盖这些边界，不修改 AuthClient 或宿主导航实现。

正式 ESM/CSS/types 的 source generation 为 `a76f34adacfab4674e091a910749f967be17246b5fe1ad7e83e1a87cf482a8e0`，独立安装目录 `.consumers/run-GGJull/react`。三包与 DESIGN 为 **2.0.1**，403 Token、101 公开入口、358 项接入检查；React/ReactDOM 19.2.8 与 Base UI 1.7.0 单实例，没有源码 alias。新增五个认证 Token（内侧自适应 padding、品牌间距、卡片圆角、标题字号/行高）；共享正文字号与控件角色未改变。

| 检查 | 结果 | 证据（`.artifacts/login-v3-validation/`） |
|---|---|---|
| build / typecheck / Token / 文档 / 正式消费者 | 通过 | `responsive-final-*.log` |
| 完整单测 / 定向回归 | **472/472**；登录相关另 **32/32**、生命周期文件 **12/12** 是重叠定向范围，不相加 | `unit-current.log`、`responsive-final-unit-targeted.log`、`navigation-fix-unit.log` |
| 完整 Chromium 登录回归 | 首轮 **140/144**，暴露上述两个实际缺陷；修复后单次 **144/144**，无 skip/flaky | `browser-initial.json`、`browser-final.json`、`navigation-fix-browser.json` |
| 最终窄屏内距复验 | 最终正式产物 **76/76**，无 skip/flaky；涉及 V3 / LoginLayout / AuthPage，其他路径复用前次相同代码的回归 | `browser-responsive.json/log` |

浏览器覆盖浅/深/system、1440/390/320px、长中文、125%/150%/200% 界面缩放、200% 根字号，以及真实 Chrome 200% 页面缩放（DPR 加倍、CSS 视口减半、CSS zoom/pinch 保持 1）。验证原 Logo URL/alt、Logo 缺省/动态变化、输入节点与选区连续性、busy/错误、密码清理、键盘焦点、会话恢复与导航重试。已查看浅色桌面、深色390px、深色320px/200%及真实浏览器缩放截图；最终窄屏代表图为 `images/dark-scale200-v3-responsive.png`，Stitch 设计参考为 `.artifacts/stitch-login-redesign/v3-login-design.png`。

critical CSS gzip 初轮 **18503**、去除冗余布局后 **18485**，均超过原 **18432** 上限，保留原失败日志。本次公开 V3 布局明确增加 **128 bytes** 预算至 **18560**；最终响应式版本 **18511/18560**。首屏 JS **152144/153600**、Button **6619/16384**，未提高这些上限。登录布局 API/认证 wire 保持兼容，外观按 V3 更新。

复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`pnpm test:unit`、`pnpm test:consumer`；浏览器配置 `.artifacts/login-v3-validation/playwright.config.mjs`，完整范围与最终受影响复验分别见 `browser-final.log` 和 `browser-responsive.log`。本批未执行无关浏览器全集、Firefox/WebKit、真实读屏器/实体移动设备、独立 SSR hydration 或消费项目/后端/部署验收；不宣称消费项目已升级。

## 导航当前项的完整强调前景（2.0.0，2026-10-16）

`NavItem`和`NavigationMenu`的当前项主名称、富标签说明、公共Typography/Code/Icon槽统一继承既有selected前景（action-primary），muted说明不再脱离所属选中色。保留原选中背景/竖线、禁用优先和独立focus；hover/pressed不改成普通项颜色。只修改公共导航CSS，无新增Token、API、DOM补丁或`!important`，宿主不自行加颜色覆盖。

正式安装包Chromium专项 **10/10**：light/dark/system × 1280/390px与200%根字号，及真实Chrome200%页面缩放；逐槽比较computed color、hover/pressed/focus、system实时切换、普通项对照和页面横向边界。证据为`.artifacts/controller-modes-validation/browser-final4.json`中`navigation-selected.spec.mjs`及其附件，不能把整份168项报告称为全绿。后续Clipboard补丁的147份正式JS/CSS哈希比对确认导航代码和样式字节不变，因此复用本项证据。已查看浅色桌面、深色窄屏200%文字和真实页面缩放截图，提取图在`images-final4/4-navigation-selected.png`～`6-navigation-selected.png`。既有富导航、分支名称和presentation回归另有35项通过，分别保留在同一报告，不与10项混算。

## 统一启动、基础Service与组件Controller（2.0.0，2026-10-16）

DESIGN与三个包为 **2.0.0**，398 Token、101公开入口、352项接入检查。基础Service统一由浏览器Window注册表获取；`bootstrap(overrides, environment)`同步合并正式包内的默认`config.json`，项目参数仅覆盖需要改变的字段。HTTP/Auth/Theme/Clipboard/Route/I18n/Menu/Download共享所属依赖，Util为纯函数namespace；SSR/测试使用独立`XuiServices`。JSON不放实例/函数，借用实例不会被View或注册表销毁；启动不发请求、不登录、不恢复会话。主题和缩放的有效sessionStorage偏好优先于配置默认。

组件逐项默认/完整Controller注入与生命周期边界见[矩阵](COMPONENTS.md#状态所有权与-controller-模式)。受控请求与确认分开，注入模式不创建、配置或销毁并行默认实例；Base UI继续执行实际键盘、焦点、定位和Portal行为。服务组合的未提交筛选/客户端页由View Controller拥有，领域查询/认证/权限仍归已有服务。默认service options仅初始化，普通父渲染不重建owner。秘密不进入安全快照；实例替换、StrictMode、最后View退出、迟到结果及复制取消分别核对。**Toast集合/store完整替换仍未满足**：现有peer没有公开受控集合/store入口，不使用私有store或第二队列，本批不能称为所有组件已完整替换。

最终source generation为`38dd88423a710a990979e56b9b4b4ab9c2f828ef0a53a2288691ce5af0dc55a2`。独立消费者`.consumers/run-zPTCBl/react`从三个正式tarball安装ESM/CSS/types并编译全部公开入口、Controller与bootstrap正负类型fixture；没有源码alias，React/ReactDOM19.2.8与Base UI1.7.0保持单实例。常规门禁记录在`.artifacts/controller-modes-validation/`。

| 门禁 | 最终结果 | 证据 |
|---|---|---|
| build / 类型 / Token / 文档 | 通过；398 Token、101入口、352检查项 | `build-final5.log`、`typecheck-final5.log`、`tokens-final5.log`、`docs-final5.log` |
| 完整单测 | **470/470**，无skip；定向批次与本批重叠，不相加 | `unit-full-final5.log` |
| 独立正式包消费者 | 通过；公开exports/types、同代安装包、无alias、Button及CSS/JS体积门禁；登录示例调试桥暴露实际theme引用以核对同一owner，不是公共API | `consumer-final5.log`、`.artifacts/performance-baseline.json` |
| Chromium定向回归 | final4为**162通过/6失败**；受影响复验release5为**19/19通过**。原168项的6个失败已逐项闭合，另含2个展示复制用例；按文件/标题去重共170项覆盖通过，**不是单次170项全绿** | `browser-final4.json/log`、`browser-release5.json/log`、`browser-case-coverage.json` |

浏览器覆盖默认/注入/受控接受拒绝、peer键盘与回焦、StrictMode与替换/卸载、默认API options保owner、多个借用View的最后退出、密码清空/reader替换、AdminSetup动态检查入口；同时回归API Key CRUD/secret、两类日志快照/取消/迟到、Calendar月份、DateTime、Select表单、choice只读禁用和富导航。bootstrap的8项检查包含合并默认、幂等/冲突、History深链与后退保草稿、语言切换、session主题/缩放优先、三主题/窄屏/长中文/200%文字与真实页面缩放。Bootstrap更新后从同一个正式consumer重编并严格类型检查，metafile全部位于独立安装目录；示例不重复PageHeader同名标题，关闭/跳过导航通过公开label与catalog接线。已查看`images-release5/`浅色桌面和深色窄屏大字、`images-final4/`真实缩放及登录截图。

基础示例现在显式启动统一基础设施，并使用新增语义Controller。首屏JS gzip由1.3.1的133849增加至最终 **152144 bytes**，首轮152143超过旧135168-byte预算的真实失败保存在`consumer-release2.log`；本次2.0架构变更明确将该扩展入口预算增加18 KiB至 **153600 bytes**，没有隐藏失败或删除功能来规避。critical CSS **18418/18432 bytes**、Button **6619/16384 bytes**保持原预算。新增独立窄Service门禁要求Clipboard/Theme/I18n/Menu各自gzip不超过4096 bytes，并禁止带入services-core、HTTP/Auth/Download实现；实测分别3859/3491/3028/3253 bytes。密码强度词库worker仍独立懒加载，851531 gzip bytes不计入首屏，也不声称本轮优化了该词库。

正式消费者首轮暴露React声明推导到runtime未公开子路径，已显式标注来自公开入口的返回类型；未扩大私有exports或跳过strict类型检查。单测首轮466/470，四个旧测试分别缺少真实Theme owner方法、仍假定默认scale不写DOM属性，以及直接调用新增Hook组件；按纯prepaint与React SSR合同修订后完整470/470，storage零写入断言保留。实际浏览器另外发现显式密码clear的空值确认会撤销cleared状态，已修复；旧值不能因visibility或普通父渲染恢复。

浏览器初轮32项中16项失败：旧preview进程未加载History fallback；测试的Tab值错配、未启用创建权限、不可聚焦ContextMenu触发器、modal背后按钮点击和错误读取已退出Controller等按真实合同修订。后续中断的final3只保留原始日志，不计完整执行；其bootstrap窄屏失败是英文locator与实际中文“导航”不符，不能归咎旧进程。final4剩余5个登录失败是测试matcher参数位置错误；另一个Clipboard失败是**真实实现缺陷**：DOM Selection恢复后把输入选区重置0。调整为先恢复DOM Selection、再恢复原输入选区/方向，最后恢复滚动；release5通过正式包与mock execCommand验证焦点、原选区和方向、滚动及临时节点清理，未宣称真实OS剪贴板权限验收。`consumer-dist-a623-vs-4b08.json`逐文件比较147份JS/CSS，仅`clipboard-service.js`变化；其余已通过用例只在该明确范围内复用，未把历史绿色结果覆盖到新实现。最终清理新增`clipboard-service.ts`文件唯一多余EOF空白后重新构建并消费；`.artifacts/controller-modes-validation/consumer-dist-4b08-vs-38dd.json`比较三包280个`dist`文件，除三份`build.json`更新source generation外，其余277个JS/CSS/types及运行产物逐字节相同。因此复用4b08代已通过的行为验证，明确不称最终38dd代另跑过全部浏览器。

复现：`pnpm build`、`pnpm typecheck`、`pnpm check:tokens`、`pnpm test:unit`、`pnpm test:consumer`；浏览器完整范围和失败复验分别见`.artifacts/controller-modes-validation/playwright.config.mjs`与`playwright-release5.config.mjs`及对应日志。最终文档复核`node --test tests/docs.test.mjs`为2/2通过，`node scripts/check-docs.mjs`与`git diff --check`通过。原始失败、中断、复验报告分别保留，不拼成单次完整套件结论。

兼容性：这是破坏性升级，基础Service的`createHttpClient/createAuthClient/createThemeController/createClipboardService`公开工厂移除，改用bootstrap/Service getter或隔离容器；组件级Controller及无状态adapter工厂继续保留。`init.js`只恢复首绘主题/缩放，不再创建或订阅ThemeController。路由使用History URI，合法深链需宿主服务器fallback；同页anchor保留浏览器滚动/焦点语义，不创建hash router、伪popstate、页面刷新或业务请求owner。新增Controller注入可选，旧受控props仍按默认模式工作，两模式配置互斥。未改任何消费项目、业务API、认证协议或后端。

本批未执行完整浏览器全集、watch/cold-start、独立SSR hydration、真实OS剪贴板权限/读屏器/实体移动设备、消费产品页面或后端/部署；合成数据与隔离transport只证明对应库合同。没有新增实时Stitch审阅；沿用已确认视觉合同，源码审查和合成浏览器不能替代产品验收。

## Controller逐项审查与公共侧栏分隔（1.3.1，2026-10-16）

本轮先独立提交Controller审查文档`8104fbd5461f1b4cad1cb6cf4d72f03b88c16b6c`，再实现独立侧栏补丁。审查基于1a6772e4/1.3.0源码与正式types，逐项覆盖React根入口105个运行时导出及组合部件；覆盖记录为`.artifacts/controller-audit/coverage.json`，完整矩阵见[状态所有权](COMPONENTS.md#状态所有权与-controller-模式)。明确区分完整语义替换、服务仅注入、受控props、handle/manager、DOM投影及无自有状态；Toast的manager不替换Provider状态store。Controller缺口仍开放，**本轮没有重写或新增这些组件的Controller入口**，也未把105项源码审查当作105项行为测试。

DESIGN与三包为 **1.3.1**，398 Token、86公开入口、311项接入检查。仅在已有桌面断点添加inline-end的公共separator-line / line-width-surface边线，原末端padding扣除相同线宽，RTL换侧；窄屏不加内侧边线，保留Dialog外框。React逻辑、portal、键盘和业务owner不变，没有新增分隔节点、resize handle、默认请求或消费方补丁。

正式构建source generation：`b22e62fcfce25da2031f6477613af32d39712b9072953f801ea3b708da5526d7`。独立消费者`.consumers/run-93dseh/react`使用npm安装三个本地正式tarball，核对ESM/CSS/types与React/ReactDOM19.2.8、Base UI1.7.0单实例，无源码alias。critical CSS gzip **18386/18432 bytes**，初始JS **133849/135168 bytes**，Button **6619/16384 bytes**；预算未提高。相对1.3.0逐文件比较202项ESM/CSS/types，仅theme的layout/critical/components/style四份CSS变化，全部JavaScript和声明字节相同；没有新增Controller接口。产物差异与源码hash核对见`package-diff.json`。

| 检查 | 结果 | 证据（`.artifacts/sidebar-boundary/`） |
|---|---|---|
| build / types / Token / 定向单测 / 正式consumer | 通过；相关7文件单测 **50/50** | `build.log`、`typecheck.log`、`tokens.log`、`unit-targeted-final.log`、`consumer.log` |
| 旧1.3.0基线 | 新边界用例真实失败：预期1px、实际0；16组外宽/净宽记录保留 | `baseline-browser.log/json`、`baseline-output/`、`baseline-geometry.json` |
| 最终Chromium | **40/40**，含既有13项导航控制与新增27项；无skip/flaky | `browser-final.log/json`、`browser-output/` |
| 最终Firefox / WebKit | 各 **24/24**，共48；三主题、LTR/RTL、两个组合、100%/200%文字 | `cross-final.log/json`、`cross-output/` |
| 旧包到新包几何对照 | **16/16**外宽和内容净宽相同；默认324/60px，根字号200%时640/120px | `geometry-comparison.json`、`final-geometry.json` |

浏览器通过公共AppShell/MenuLayout正式示例核对逻辑边线方向与共享separator颜色，长中文导航滚动后边线持续可见；桌面/390px往返复用同一aside portal节点，保留草稿、键盘焦点、Space/Enter与Escape回焦。窄屏sidebar自身无边线，Dialog只有自身外框。三主题真实Chrome200%缩放分别核对DPR加倍、CSS视口减半、根字号不变、CSS zoom与pinch均为1。已查看浅色桌面、深色窄屏200%文字与system真实浏览器200%代表截图，提取图在`screenshots/`。

初轮相关单测49/50，唯一失败为旧contractVersion字面值1.3.0，按实际1.3.1同步后50/50。浏览器首轮Chromium36/40、跨引擎47/48；5项均在resize后的React媒体状态尚未切换前发送Enter，仍执行桌面折叠。用例增加`aria-haspopup=dialog`与关闭状态就绪断言后最终40/40、48/48通过，没有修改React键盘或焦点算法；初轮报告/trace分别保存在`browser-first*`、`cross-first*`。首次cross命令的grep未收集测试，不计通过，记录在`cross-collection-first.log`。

复现：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`、`pnpm test:consumer`；相关单测为`node --test tests/contract.test.mjs tests/workspace-layout.test.mjs tests/sidebar-footer.test.mjs tests/app-header.test.mjs tests/menu-design-contract.test.mjs tests/design-value-guard.test.mjs tests/docs.test.mjs`。浏览器为`pnpm exec playwright test tests/browser/sidebar-control.spec.mjs --config=.artifacts/sidebar-boundary/browser.config.mjs`；跨引擎使用同一spec、`--grep 'sidebar boundary (shell|layout)'`及`cross.config.mjs`。

未跑无关全仓单测/浏览器、watch/cold-start、消费项目真实页面或后端、部署、实体移动设备/读屏器或独立SSR hydration；没有新增实时Stitch评审。xAgent截图及消费版本按来件登记，不作为本轮宿主运行证据；1.3.1不代表Controller缺口或消费项目升级已经完成。

## Select浮层、API Key分页、分组日志与Menu Controller（1.3.0，2026-10-16）

DESIGN与`@coffeehc/xui-theme`、`@coffeehc/xui-runtime`、`@coffeehc/xui-react`均为 **1.3.0**；398 Token、86个公开入口、309项逐项接入检查。本节验收xui公共库及独立正式tarball消费者，不表示Argus或其他宿主已升级。

旧1.2.0固定包在API Key创建Dialog中通过公开SimpleSelect选择`demo.never`时，弹层选项中心落在Dialog footer上，真实指针被footer截获。`elementFromPoint`、祖先层叠上下文和失败截图保存在`.artifacts/public-followup/baseline/`。1.3.0把唯一的`selection.css`规则组装进`critical.css`与`forms.css`，`floating.css`仍保留完整`selection + floating`组合；没有用z-index补丁、强制点击或业务DOM处理规避。

本批公开能力与兼容边界：

- `ApiKeyManagerProps.pagination`提供对当前完整、已确认列表的客户端分页，默认10行、可选10/25/50，`false`关闭分页。翻页不再请求adapter，total只来自完整列表长度，刷新继续保留并夹紧当前页；没有增加服务端分页或查询owner。名称主列复用公开的`xui-table-primary`自然宽度策略，metadata/header使用已有`xui-table-label`不换行类，不设单列宽度，不修改DataTable通用合同。
- `GroupedStructuredLogAdapter.records`可选，完整`StructuredLogAdapter.records`继续必填；HTTP工厂在静态`records: string`时返回兼容完整类型，省略或动态路径返回分组能力类型。没有records时不创建该方法、不显示跨组全量入口，`setView('records')`为no-op。Argus真实GET DTO、权限和wire仍须宿主适配。
- runtime `/menu`公开可序列化MenuConfig/Node与MenuController；React `Menu.View`可使用自有默认Controller，也可由注入实例完整替换，前者由View清理，后者生命周期归注入者。ActionEvent的同步`preventDefault()`只控制菜单关闭；业务回调和异步动作由宿主负责。Base UI继续拥有键盘和焦点算法，控制器观察所有可见菜单项的真实焦点（包括peer允许聚焦的disabled项），显式`focusItem`与`activate`仍只操作可用项。
- 顶部导航开关使用唯一节点置于品牌行末端，bottom仍受支持；Tabs普通/选中项采用既有层级与边界合同；Menu/ContextMenu Separator复用typed peer分隔线且不参与roving焦点。Stitch合同审阅见`.artifacts/public-followup/stitch-review.md`。

最终构建generation为`4c42920abfff14f9ee10d4d569d40c392f93e7df7164ff7d76589f3b977fe9b0`，runtime/theme/ui-react的`dist/build.json`同代。正式独立消费者`.consumers/run-8uOPd6/react`使用npm安装三个本地正式tarball并核对86个公开入口、ESM/CSS/types、Menu与Grouped日志类型fixture；没有`packages/src` alias。React/ReactDOM 19.2.8与Base UI 1.7.0均deduped单实例。gzip实测CSS **18360/18432 bytes**、初始JS **133849/135168 bytes**、Button **6619/16384 bytes**。与d5正式包比较110项运行时JS/CSS哈希，仅`packages/runtime/dist/menu.js`与`packages/ui-react/dist/api-key.js`变化，其他108项相同；明细见`release-metadata-js-css-compare.json`。

| 检查 | 结果 | 证据（`.artifacts/public-followup/`） |
|---|---|---|
| build / types / Token / 完整单测 | 通过；**446/446** | `release-metadata-build.log`、`release-metadata-typecheck.log`、`release-metadata-tokens.log`、`release-metadata-unit.log` |
| 正式tarball consumer | 通过；ESM/CSS/types/入口和gzip门禁，React peer单实例 | `release-metadata-consumer.log`、`.consumers/run-8uOPd6/react`、`performance-baseline.json` |
| d5 Chromium既有矩阵；569ab951 Firefox/WebKit精选矩阵 | **141/141 Chromium**（d5）；另有 **56/56 Firefox+WebKit**（569ab951）。两份报告均保留，不重复计入本代新测试；110项JS/CSS哈希比较相同 | `final-browser.json`、`cross-browser.json`、`release-compatible-build.log`、`release-compatible-consumer.log`、`release-compatible-js-css-compare.log`及各浏览器`.log` |
| 4c最终正式包浏览器矩阵 | Chromium **47/47**；Firefox/WebKit精选 **56/56**（各28项）；另有真实指针打开/选择/回焦点 **12/12**。覆盖P1指针命中、API Key metadata/headers Range边界及Menu键盘前置 | `release-final-browser.json`、`release-final-browser.log`、`release-final-cross.json`、`release-final-cross.log`、`select-popup-final.json`、`select-popup-final.log` |

旧1.2.0的P1失败按上文保留。期间发现并修正的测试/实现问题完整保留：初次完整单测的3项SSR断言仍假定开关在aside，按已公开Header归属更新后最终446/446通过；Menu宿主示例曾在modal关闭提交前将焦点移至背景，改为关闭后转焦点，库未改该owner。之后定位真实`MenuController.recordFocus`缺陷：Base UI允许disabled项取焦而model拒绝记录，导致activeId滞后；修复状态观察，保留peer行为并继续断言disabled零执行。手动复验Menu键盘时曾在真实item focus未就绪时发送End/ArrowUp，焦点还在popup；增加触发器focus、Enter打开及首项焦点就绪断言后，隔离重复3/3通过，不改运行时键盘算法。API Key最初给名称列固定width后，正式截图发现metadata列仅约98px且时间范围溢入相邻列；删除该width并复用自然列布局，新增metadata/header Range边界检查。之后截图发现状态Badge与部分短表头换行，改为复用既有label类并增加断言；最终4c正式包Chromium47/47、Firefox/WebKit精选56/56通过。测试曾只按`td`查找表头Range，导致空引用；改为同时覆盖`th`和`td`后复验通过，没有改生产代码。最终Tab选中边界采用token化border；早期预检报错保留在`precheck.log`，没有放宽design guard。

Stitch确认了品牌行内开关、Tabs层级、typed Separator的合同，并审阅API Key完整集合客户端分页方案；这不是消费端浏览器验收。尝试通过嵌入式Stitch的选择文件、Upload Files和file input上传合成截图时，filechooser未返回；没有宣称截图已上传。本地正式消费者截图保存在`screenshots/`；主线程已查看表格元数据/表头与深色窄屏弹层命中截图，逐项记录在`stitch-review.md`。

复现门禁：`pnpm build`、`pnpm check:tokens`、`pnpm typecheck`、`pnpm test:unit`、`pnpm test:consumer`。Menu定向命令为`pnpm exec playwright test tests/browser/action-menu.spec.mjs --config=.artifacts/public-followup/menu-final.config.mjs`；Firefox/WebKit用同一spec及`menu-cross-final.config.mjs`。早期d5矩阵用`final.config.mjs`与`cross.config.mjs`，本代最终矩阵用`release-final.config.mjs`与`release-final-cross.config.mjs`。保留各轮原始报告和可用的截图/trace，没有拿JSON收集报告替代执行结果。

未跑全仓浏览器全集、watch/cold-start、消费产品真实页面或后端/API/权限/部署、独立SSR hydration、实体移动设备和读屏器。Argus升级、真实API wire适配与业务owner验收仍归宿主；库级验证不能替代这些步骤。

## 公共展示与导航布局 1.2.0（2026-10-16）

DESIGN与theme/runtime/react三个私有包均为 **1.2.0**；398 Token、85正式入口、303项逐项接入检查。只修改xui。本批统一Card的header/content/footer三段与默认图标tile、neutral soft标签、Footer分区；CardGroup新增可选cardSizing=equal，以真实内容计算共同卡高、伸展content并让Footer靠底，不固定高度或裁正文。Tabs.List默认内容宽，显式equal占满并等分；Tabs.Icon为装饰性图标，其命名属性在类型中明确禁止。Icon新增color/blink，支持CSS变量，Badge/Text/Avatar支持显式前景，字体角色和样式继承保持。

AppShell/MenuLayout沿用唯一侧栏开关、公开top/bottom及受控状态，只改善默认图形。NavigationMenu名称槽占满主项剩余宽度，renderLabel中的非交互状态可留在行尾；只有NavigationMenu.Label声明的名称独立滚动，分支与配置按钮不移动、不误导航。Spinner改为主题色开放弧，减少动态效果时静止，忙状态文字仍由宿主提供。没有新增业务状态、查询、权限或请求owner，runtime仍为TypeScript模型、服务与工具。

最终source generation：`bbcbff4207e97ea40899f9efd799d956d62a48fbdb6313da6a54af5b5fb9c9de`。独立正式tarball消费者目录为`.consumers/run-yLHns7/react`：通过npm新安装三包并核对正式ESM/CSS/types/init、命名导出、全部入口及React/ReactDOM/Base UI单实例，无packages/src alias或宿主私有CSS。首次npm安装因临时cache缺少@types/react-dom@19.2.3的内容文件失败；从已有全局cache补入同SHA512寻址的该文件后，原样npm安装成功，没有改peer版本、锁规则或依赖范围。

| 检查 | 最终结果 | 证据（仓库内`.artifacts/`） |
|---|---|---|
| build / 类型 / Token / 文档 | 通过；12文档、1124链接、85入口、303检查项 | `presentation-1.2/build-budget-adjusted.log`、`presentation-1.2/typecheck-final.log`、`presentation-1.2/tokens-final.log`、`presentation-1.2/docs-final.log` |
| 定向单测 | **74/74**；另一次已有完整单测运行最终 **438/438**，两者重叠不相加 | `presentation-1.2/targeted-unit-rerun.log`、`unit-full-final.log` |
| 独立正式包消费者 | 通过；完整ESM/CSS/types及同代产物与peer单实例 | `presentation-1.2/consumer-budget-adjusted.log`、`performance-baseline.json`与各正式metafile |
| Chromium定向浏览器 | **64/64**：本批展示23、导航状态20、侧栏开关13、富导航5、CardGroup刷新/排序分页/禁用3 | `presentation-1.2/browser.json`、`browser-final.log`、`regression.json`、`regression-final.log` |
| Firefox / WebKit精选 | 各 **7/7**，共14；浅色桌面、深色窄屏200%文字、状态动效/静止、Card/Avatar与Tabs方向键 | `presentation-1.2/cross.json`、`cross-final.log` |

浏览器使用上述安装包消费者：覆盖light/dark/system及system实时切换、桌面/390px、200%文字与公开200%界面比例、长中文、三主题真实Chrome200%浏览器缩放。真实缩放单独验证DPR加倍、视口减半、根字号不变且CSS zoom/pinch均为1，不拿文字或界面比例替代。逐项读取角色的font-family/font-size/line-height/font-weight；比较名称、尾随状态、分支与动作矩形；采样Spinner实际旋转与reduce静止、Icon脉冲两端可见且不位移；验证Tab键盘/RTL/vertical/disabled及keepMounted草稿，Card等高/自然切换、空区收拢、刷新失败保节点/焦点/草稿/滚动、当前记录及cursor分页。已查看桌面卡片与Tabs、深色窄屏大字、顶部开关、开放弧及真实缩放代表截图，提取图在`presentation-1.2/images/`。

初始JS gzip **133858/135168 bytes**，Button gzip **6619/16384 bytes**；完整关键CSS gzip **18276 bytes**，比1.1.3的17788增加488。本批新增公共视觉状态与布局后，将CSS上限从17792明确调整为 **18432 bytes（18 KiB）**，JS/Button预算不变，没有隐去旧预算失败。初轮设计值检查发现默认Icon颜色放错责任层、SVG尺寸属性不符规则，已分别交回主题CSS与glyph坐标；逻辑圆角被颜色检查器误判的问题补了正向圆角及负向裸颜色回归。类型检查发现装饰性Tabs.Icon仅Omit无法约束JSX命名属性，已显式禁止。旧样式/SSR断言按公开新合同修正，未改Tabs默认挂载行为。5项smoke及重复定向复验不计入64；cross首条命令未匹配测试的执行不计为通过。

兼容性：无新增必填props或公开路由。依赖旧整行Tabs外观的宿主须显式layout=equal；CardGroup默认仍natural，资源集合需显式cardSizing=equal。Card默认图标tile、标签soft和Footer band可分别用plain保留已有组合；照片/自带边框Avatar推荐iconVariant=plain，图形符号直接使用未带外框的图标。显式sidebarTogglePlacement=bottom仍保留，回到顶部需宿主改为top。普通中性Badge默认plain不变；Avatar在着色槽中继承前景，避免宿主另补私有皮肤或字号。

本节只证明xui与独立正式消费者的库级合同。未改xAgent、Argus、XQuant、XLead，未验其真实页面、业务API、认证、权限和部署；宿主收到固定产物后另行统一接入验收。未跑无关全仓浏览器、watch/cold-start、实体触屏、读屏器、forced-colors专项或独立SSR hydration，没有新增实时Stitch评审。既有Select/Dialog缺陷和其余公开请求仍按[公共维护清单](PUBLIC_REQUESTS.md)保留，未声明解决。

## 公共文字槽与样式继承（2026-10-16）

DESIGN及三个私有包 **1.1.3**，393 Token、85正式入口、275项逐项检查。[公共文字槽验收](DESIGN.md#公共文字槽验收)按组件与slot定义字体族、字号、行高和字重；[接入清单](ADOPTION_CHECKLIST.md) TYPE-001～023逐项检查公共控件、标题、正文、辅助文字、反馈、代码及组合内容，并要求库在发布前提供computed-style证据。消费项目非必要不得自行设置内容字体；确需领域例外时记录所属内容、理由、范围与放大验收，不能用例外重设公共控件。

实现充分复用样式继承：document/portal提供正文基线，布局继续继承；Card建立自身语义正文边界，meta/help/error只改必要属性；Link、inline Loading及图像fallback随所属文字槽继承，按钮、标题、代码与指标仅在角色变化处切换。修正InputGroup动作、Disclosure触发器、Calendar日期按钮的控件字重，明确Tabs触发器、Avatar fallback及月份标题等边界。没有新增字号、字体API、原生UI或业务owner。既有默认100%与公开界面缩放不变；上述控件字重及Copyable状态/InputGroup单位文字的角色呈现发生修正。

新增[正式字体示例](../examples/typography-slots-react/app.tsx)和[浏览器验收](../tests/browser/typography-slots.spec.mjs)，覆盖现有页面、卡片、字段、导航、表格、Calendar、Tabs、Accordion、反馈与浮层的真实文字槽。元数据中的Link/inline Loading继承13/20，旁边的Button保持14/22控件角色；Navigation group真实h2保留600标题字重。未用通配后代字体规则覆盖嵌套公共组件。聚合CSS仅合并同层外壳，保留每条规则、声明、媒体条件及次序；新增AST合同检查与逐组件CSS的等价性，未提高体积预算。

最终source generation：`c8ff24bdd9851c8258a4ae0c6a23fc401b338ffc538a4b49c98ceb3c119e7f54`。独立目录重新安装三个本轮tarball，验证85个公开ESM/CSS/types/init、命名导出、严格类型、同代产物和React/ReactDOM/Base UI单实例，无源码alias或私有CSS。由于已确认的registry固定peer解析限制，复用上一轮已验的同版本peer文件与锁文件，只通过npm离线重新安装本轮xui包，过程保存在`typography-slots-prepare-peer-lock.cjs`与`typography-slots-consumer.log`，未放宽peer检查。初始JS gzip **133621/135168 bytes**、critical CSS gzip **17788/17792 bytes**、Button **6619 bytes**。

| 检查 | 最终结果 | 原始证据（`.artifacts/`） |
|---|---|---|
| build / 类型 / Token / 完整单测 | 全部通过；单测 **427/427** | `typography-slots-build.log`、`typography-slots-types.log`、`typography-slots-tokens.log`、`typography-slots-unit.log` |
| 正式消费者 / 文档 | 通过；85正式入口、275检查项，示例只从安装包构建 | `typography-slots-consumer.log`、`typography-slots-docs.log`、performance及metafile |
| Chromium | **89/89**：字体18、侧栏header33、既有输入字体/布局/侧栏footer回归38 | `typography-slots-browser.json`、`typography-slots-browser.log` |
| Firefox / WebKit | 各 **4/4**，共8；字体及侧栏Tabs的浅色桌面、深色390px/200%文字 | `typography-slots-cross.json`、`typography-slots-cross.log` |

字体18项覆盖light/dark/system、1280/390px、200%文字、公开200%界面比例及三主题真实Chrome200%浏览器缩放。逐角色读取实际font-family/font-size/line-height/font-weight，核对继承及语义Token覆盖、长中文、system实时变化、键盘、弹层滚动与Escape回焦点，无文档横向溢出或控制台错误。真实浏览器缩放单独验证DPR与视口，未以CSS zoom或界面比例代替。实际查看默认浅色侧栏、深色窄屏200%文字侧栏及Sheet焦点截图，另存控制字重Token改为700的截图用于验证覆盖，后者不冒充默认500截图。初轮fixture中的Menu.Group、Toast键盘入口及Nav标题角色断言均已按真实peer/语义修正，最终整批结果如表；没有把早期失败或重复smoke计入通过数量。

本轮是xui及独立正式消费者的库级验收，未修改或验收xAgent、Argus、XQuant、XLead真实页面/后端和部署。未重跑全仓浏览器全集、watch/cold-start、实体触屏、读屏器或独立SSR hydration，也没有新增实时Stitch评审。既有Select/Dialog缺陷及其他公开请求仍见[公共维护清单](PUBLIC_REQUESTS.md)，本次未将其声明解决。runtime继续只维护TypeScript模型、服务与工具。

## 侧栏header组合边界（2026-10-16）

与上述1.1.3同代产物。sidebarHeader不再向直属或后代Button强制宽度、字体和compact padding；默认动作按内容宽度，宿主可通过公开style/className明确选100%或内容宽。sidebarFooter去除递归按钮字体与强制宽度，现有父容器stretch行为保留。Header分隔上下间距各4px，sidebar-menu内Tabs.Panel不再叠加正文padding；普通Tabs.Panel保持现有12px。所有侧栏区域的交互控件采用内部焦点绘制，并保留invalid边框及独立滚动边界。

[侧栏示例](../examples/sidebar-footer-react/app.tsx)提供`header=actions|long|direct|full|content|business|tabs`，用公开Toolbar、Field、Tabs、NavigationMenu验证常见组合；Tabs.Root可跨header和正文，keepMounted面板保留输入草稿与导航状态。没有增加会话专属组件或修改消费项目。[SHELL-020～022](ADOPTION_CHECKLIST.md)分别检查按钮宽度归属、Tabs与分隔间距、焦点和滚动。

[header浏览器测试](../tests/browser/sidebar-header-toolbar.spec.mjs) **33/33**，包含三主题、桌面/窄屏/200%文字、长中文Toolbar、直属按钮的默认/显式宽度、宿主组合、Sidebar Tabs和三主题真实Chrome200%缩放；既有sidebar-footer、layout-typography及input-typography-contract回归共同计入上节89项。Firefox/WebKit各两项header精选已包含在上节各4项中，不重复累计。验证动作可达、准确宽度、首个导航位置、普通Tabs padding不变、草稿与焦点保持、滚动及无水平溢出，已实际审阅代表截图。

兼容性变化是依赖旧header强制满宽的直接按钮需要在公开style/className中明确满宽；默认内容宽度修复Toolbar多动作被拆为多行的问题。普通Tabs、导航折叠、Footer底部归属与受控状态接口保持；未新增props或变更公开导出。浏览器证据与实际未跑范围同上节。

## 统一表格行分割线（2026-10-16）

DESIGN及三个私有包 **1.1.2**，393 Token、85正式入口、249项逐项检查。解决 [XUI-REQ-20261016-03](PUBLIC_REQUESTS.md#xui-req-20261016-03固定列与全表分割线一致112已实现待宿主验收)：公共Table/DataTable默认全表仅行线，所有th/td列线为0；移除sticky专属侧边框，保留既有位置、不透明背景、交互图层、表头交点层级和焦点。整体frame、表头/行底线、唯一footer分隔继续各有归属，末行不叠底栏边框。没有新增props、网格模式、API/query owner或原生UI；DataTableColumn.sticky及Table的stickyOffset用法不变。

正式React示例增加 `?sticky=none|start|end|both`，通过公开columns配置比较普通、左/右及双侧固定，不使用消费者CSS或DOM改造。最终source generation为 `2c7edd64342311b82fcae4d2de7f0c953830b2fa751b98ec1c36134612e1b500`。独立目录安装本轮三个tarball，核对85个公开ESM/CSS/types/init、命名导出、同代产物和peer单实例。仍采用上一轮已验的同版本peer文件与锁文件，通过npm重新安装三个xui包，不使用源码alias或放宽peer检查；过程记录在 `table-dividers-prepare-peer-lock.cjs` 与 `table-dividers-consumer.log`。初始JS gzip **133623/135168 bytes**，critical CSS **17768/17792 bytes**，Button **6619 bytes**，预算未提高。

| 检查 | 结果 | 原始证据（`.artifacts/`） |
|---|---|---|
| build / 类型 / Token / 完整单测 | 通过；单测 **426/426** | `table-dividers-build.log`、`table-dividers-types.log`、`table-dividers-tokens.log`、`table-dividers-unit.log` |
| 独立正式包消费者 | 通过；85公开入口及peer、完整类型/ESM/CSS | `table-dividers-consumer.log`、正式metafile与performance元数据 |
| Chromium | **76/76**：新分割线27、DataTable布局25/cursor4/feedback5、加载居中15 | `table-dividers-browser.json`、`table-dividers-images/` |
| Firefox / WebKit | 各 **8/8**，共16；四种sticky × 桌面浅色/窄屏200%深色 | `table-dividers-cross.json`、`table-dividers-cross.log` |

新27项覆盖四种固定组合、三主题及system实时切换、1280/390、100%/200%界面比例、长中文和三主题真实Chrome 200%浏览器缩放。每项检查空/加载/正常/刷新，逐个读取所有th/td的实际侧边框，检查表头与末行/footer分隔；横滚最左/中间/末端核对固定位置和表头正文列对齐、不透明背景及无替代阴影；真实键盘动作与命中检查，刷新保持行节点、焦点与横滚位置。截图已目视核对桌面浅色及窄屏深色大字。初次快速检查早于正式消费者构建完成，读到旧dist的竖线，不计入最终结果；本节只使用完成构建后的独立包验证。

本轮未验xAgent或其他消费项目的真实页面、后端及部署，未重跑watch/cold-start、全仓浏览器全集、实体触屏/读屏器或独立SSR hydration。Select/Dialog既有缺陷及侧栏/字体后续任务不纳入本轮分割线修复。

## 组件内容加载居中（2026-10-16）

DESIGN及三个私有包 **1.1.1**，393 Token、85正式入口、248项接入检查。只修改xui。LoadingState默认block的图标与文案整体相对内容区居中；inline继续随动作/计数，不覆盖旧内容。DataRegion直接包含唯一LoadingState或无children的首次busy反馈时，分配自身内容区；API Key、程序错误日志和业务日志组合同步区分首次等待与有确认数据的刷新。DataTable保留表头及aria-hidden占位行，唯一status在可见表体轨道内，避开真实表头高度，不跟随超宽列横滚；CardGroup在body内居中。首次集合加载不再叠加骨架列表，Skeleton公开入口仍保留。没有新增请求、缓存、分页或提交owner。

最终source generation：`ceac801494532257d80c1e1926077e17c5c711647ee8e52ca3dadab67c749f44`。正式ESM/CSS/types/init独立tarball消费者验证85入口、同代产物、命名导出及React/ReactDOM/Base UI单实例。registry安装未能解析固定Base UI 1.7.0，离线缓存随后也不可用；最终新目录复用上一轮已验的同版本peer文件与锁文件，仅重新通过npm安装三个本轮tarball，未放宽peer检查、没有源码alias或私有CSS。`loading-prepare-peer-lock.cjs`及`loading-center-consumer-final.log`保留过程。初始JS gzip **133623/135168 bytes**，critical CSS gzip **17775/17792 bytes**，Button **6619 bytes**；预算未提高。

| 检查 | 结果 | 原始证据（`.artifacts/`） |
|---|---|---|
| build / types / Token / 文档 | 通过；12文档、1026链接、85入口、248检查项 | `loading-center-build-final.log`、`loading-center-types-final.log`、`loading-center-tokens-final.log`、`loading-center-docs-final.log` |
| 完整单测 | **426/426** | `loading-center-unit-all-final.log` |
| Chromium本轮加载及集合回归 | **71/71**：加载15、DataTable布局25/cursor4/feedback5、CardGroup22 | `loading-center-browser-final.log`、`loading-center-centers-final.json`及`loading-center-images/` |
| 扩大到API Key及两类日志既有回归 | **26通过、1失败**；合计98项中97通过 | 同一浏览器日志、失败trace；下述基线归因 |
| Firefox / WebKit关键加载场景 | 各 **5/5**，共10；含普通/首次反馈区域、表格、卡片、窄屏大字、system切换、刷新保节点及三种公共layout | `loading-center-cross.json`、`loading-center-cross.log` |

加载15项实际覆盖light/dark/system、1280/390、100%/200%界面比例、长中文、表格横滚后可见区域几何、natural/workspace/document公共props、单一status、装饰性Spinner、同范围刷新保节点和焦点，以及真实Chrome 200%浏览器缩放。查看了正式消费者的桌面和窄屏大字截图；几何记录直接比较提示内容与所属区域矩形，不只断言flex样式。

扩大回归的失败位于API Key创建中的有效期Select：`demo.never`选项被Dialog footer拦截，30秒超时；单项三次隔离复验均失败。在未修改的前一轮 **1.1.0** 正式安装目录重建同一公开示例，复现相同footer拦截，确认是基线已存在的问题，未通过改键盘/强制点击或绕过公开控件掩盖。详见`loading-center-api-key-recheck.log`、`loading-center-baseline-browser.log`及原始trace，已登记[公共维护清单](PUBLIC_REQUESTS.md)。本轮不把该项写为通过，也未扩大为Select/Dialog修复。

本轮未重跑watch、Vite cold-start或全仓浏览器全集，未验消费项目真实页面、后端、实体触屏、读屏器或独立SSR hydration，也没有新增实时Stitch评审。1.1.1只改变上述加载呈现，不自动升级任何消费项目。

## CardGroup 与统一集合合同（2026-10-15）

DESIGN 与三个私有包为 **1.1.0**，393 Token、85正式入口、246项接入检查。只修改xui，在1.0 React单栈之上补齐CardGroup集合；不是让业务将Card/Grid/加载提示再拼接一遍。React `/card-group` 接收rows、稳定rowKey和typed renderCard配置，由集合创建Card实例及key，拥有toolbar/body/footer、状态与唯一计数/分页。模板复用Card三段，不新建皮肤；查询、缓存、排序、跨页草稿、权限与业务提交仍归宿主。正文直接复用公开ScrollArea.Viewport；尺寸来自既有语义Token与两个派生组件Token。

runtime `/collection-view`提取同一套纯TypeScript状态/分页校验、稳定key校验及同回合防重入；原DataTable类型/方法保留为同一实现的别名，React两个集合共用footer。合法DataTable调用、offset基数、未知total与cursor规则兼容；非法配置仍抛TypeError，诊断文字改用Collection前缀，列配置仍归DataTable。没有新增原生UI、业务API或请求/选择owner。

最终source generation：`884012fa71c66f4cd7f23354b245bc7d275465acb36ecaf3672643ae25ea12df`。独立目录安装同代1.1.0 tarball，逐个验证ESM/CSS/types/init、命名导出与peer单实例。正式CardGroup示例最后补上可见Field标签，并隐藏仅供断言的技术结果；在同一独立安装中重新编译该例，输入全部来自安装目录，CSS全部来自正式theme，无源码alias或私有CSS。初始JS gzip **133595/135168 bytes**，critical CSS gzip **17634/17792 bytes**；Button独立入口仍 **6619 bytes**，预算均未提高。

| 检查 | 结果 | 原始证据（`.artifacts/`） |
|---|---|---|
| build / types / Token / 文档 / 单测 | 通过；完整单测 **425/425** | `card-group-build-bounds.log`、`card-group-validation/` |
| watch / Vite cold-start | 各 **1/1**，隔离fixture，未修改最终dist | `card-group-validation/watch-final.log`、`cold-start-final.log` |
| 独立正式包消费者 | 通过；85入口、同代包、types、单实例、体积与正式示例 | `card-group-validation/consumer-final.log`、`example-final.log` |
| Chromium CardGroup与DataTable回归 | **65/65**：CardGroup22、DataTable布局25/cursor4/feedback5/row events9 | `card-group-final.json`、`card-group-final.log` |
| Firefox / WebKit精选 | 各 **6/6**，包含窄屏大字、保留节点/草稿、排序/分页及150px极短容器 | `card-group-cross.json`、`card-group-cross.log` |

CardGroup覆盖light/dark/system、1280/390、100%/200%界面比例、三主题真实Chrome200%缩放、长中文、语义列表/三段卡片、natural/workspace/document及两种工具栏归属。实际核对刷新/失败保留卡片、输入、选区、焦点、滚动和页面壳；无Document导航；成功/失败/显式重试、筛选空、disabled、排序后当前记录、受控offset/cursor、键盘Enter/Space和浮层Escape回焦点。已查看正式浅色桌面、深色窄屏大字和极短容器截图。

独立审查发现并用Chromium复现了极短容器中正文被压至8px的P2。已改成最小可读正文轨道，chrome放不下时整个集合滚动回退，保留正常高度的正文滚动；同一150px场景scale1/2下正文68/128px，末卡动作完整可见、页尾可达且Enter实际翻页，独立复验关闭。初轮单测另有3项陈旧版本/独立CSS选择器断言，按共享选择器真实语义修正后完整通过；SSR字符串断言去除React插入的文本注释，不改生产行为来迎合断言。

本轮设计按已有Stitch v2/Token材料落实，没有新增实时Stitch会话评审。没有跑消费项目真实页面/后端、全仓浏览器全集、实体触屏/读屏器或独立SSR hydration；本次库级通过不替代采用项目升级验收。失败、开发预览与最终正式消费者证据分别保留，不重复累计。

## React 单栈、界面缩放与动态侧栏（2026-10-15）

本轮只修改 xui。按用户最新授权，DESIGN 与三个私有包统一为 **1.0.0**：删除 runtime 的原生 DOM UI 工厂、控制器、内部 UI 入口、对应示例和专属测试，不保留兼容转发。React 成为唯一 UI 实现；runtime 保留 TypeScript 服务、纯模型、解析器与工具。React 所需的布局测量、文本呈现、键盘/焦点和行事件来源判断归 React 包内部；HTML 语义元素、React NativeSelect、下载/样式加载工具及 HTTP nativeOrigin 不属于被删除的 UI 副本。旧 DOM UI 消费者不能直接升级，消费项目实际迁移须另行验证。

新增公开 `setInterfaceScale(1 | 1.25 | 1.5 | 2)`（runtime `/theme` 及根入口）：默认100%，设置写当前标签页 sessionStorage，正式 init 在首屏恢复；非法参数在修改 DOM/存储前拒绝，无浏览器安全无操作，存储拒绝时仍应用当前文档。尺寸通过根字号及既有语义 Token 派生，保留可用视口、换行和滚动边界。展开侧栏按25vw在公开 min/max Token 间响应，默认根16px下324–432px，并以50vw封顶；compact rail 与窄屏抽屉保留各自合同。

Card 根级结构统一为 header/content/footer：description 与 children 同属 content，自然高度，不等分三段；空 content/footer 不占位。SimpleSelect 与顶栏语言选择统一使用 React/Base UI 公共 Select parts，保留真实 HTML select 的 FormData、值/变更、required、disabled、reset 与 SSR 回退。独立审查实际复现了继承 fieldset disabled 与关联 label 的 ARIA 名称两项问题，均已修复并复验；没有以隐藏状态或放宽焦点要求处理。

[接入清单](ADOPTION_CHECKLIST.md)现有 **240个唯一检查 ID**，逐页面/组件实例/slot记录证据，公共16项服务操作分别检查请求、成功与异常/权限。当前正式入口 **83个**、Token **391个**。这些规则与示例建立公共边界，不代表任何宿主业务、认证或真实服务已通过。

最终构建 source generation：`db60b5c118b323764594db20e71f1af520d8c0d6fff9bbbb6192f731c3d23121`。该代仅清理两个 React 私有 helper 文件末尾的空白；排除 `build.json` 后，193 个 ESM/CSS/types 产物逐文件哈希与上一代一致。独立目录安装三个1.0.0 tarball，逐项检查正式 ESM/CSS/types/init、完整导出及负向边界；React/ReactDOM/Base UI 单实例，无源码 alias。完整参考页初始 JS gzip **133592/135168 bytes**，critical CSS gzip **17396/17792 bytes**；Button 单独入口 gzip **6619 bytes**，未引入整个 UI。初始 JS 上限从131072增加4096 bytes，以容纳由旧 DOM 选择器转为同一 React/Base UI 机制；增加的是预算，不能把它当成实测增量。密码强度引擎继续延迟加载。

| 检查 | 结果 | 原始证据（`.artifacts/`） |
| --- | --- | --- |
| build / types / tokens / docs / 单测 | 通过，单测 **418/418**，11份文档、992链接、83入口与240检查一致 | `react-only-validation/build-package-final.log`、`typecheck-release.log`、`tokens-release.log`、`docs-complete.log`、`unit-release.log` |
| watch / Vite cold-start | 各 **1/1**，隔离fixture；错误恢复及显式依赖声明避免冷启动Document重载 | `react-only-validation/watch-release.log`、`react-only-validation/cold-start-release.log` |
| 独立正式包消费者 | 通过，正式导出、类型、peer、删除入口负向检查与体积门禁 | `react-only-validation/consumer-package-final.log`、`performance-baseline.json` |
| Chromium 缩放/卡片/页面与表单刷新 | **25/25、16/16、17/17** | `react-only-browser-final.json` 中对应文件 |
| Chromium 选择器/日期时间/顶栏 | 初轮9失败与1未跑；修正过时的测试假设后，27项定向复验26通过，剩余DateTime一项再定向通过 | `react-only-browser-final.json`、`react-only-browser-recheck.json`、`react-only-datetime-rerun.json` |
| Chromium 行事件与新 React Select | 最终产物 **16/16** | `react-only-final-boundaries.json` |
| Chromium 移动后的导航/菜单/文本/表格机制 | 初轮106项83通过，23失败均来自关闭选择器时查找尚未挂载的选项；表格首轮24/25因新 helper 改变搜索焦点，保存并恢复原焦点后 **25/25** 通过 | `react-only-moved-helpers.json`、`react-only-validation/data-table-layout-final.json`、`react-only-validation/data-table-layout-rerun.json`、`react-only-validation/dist-byte-equality.json` |
| Firefox / WebKit 精选 | 各 **12/12**，选择器、Card与缩放 | `react-only-cross.json` |

浏览器覆盖 light/dark/system、桌面与390px、长中文、125%/150%/200%界面尺寸、200%文字及真实 Chrome200%缩放，核对侧栏范围、卡片三段、表单换列、弹层滚动/分层Escape/回焦点、表单重置、受控拒绝与禁用、排序/分页后的当前记录和独立 cell 动作。刷新检查保留页面壳、旧行、输入草稿、节点与焦点，不导航 Document。实际查看了桌面浅色、窄屏深色大字和响应侧栏截图。真实浏览器缩放核对 DPR、CSS视口与根字号，不以 CSS zoom 代替。

保留初轮与复验报告，不把不同批次或不同引擎重复用例相加成一次全仓全绿。未跑全仓浏览器全集、消费项目真实页面/后端、产品部署、实体移动设备、读屏器和独立 SSR hydration；SSR字符串与回退测试不能代替 hydration。设计继续按用户提供的 Stitch v2/Token材料对齐，本轮没有新增实时 Stitch 会话评审。历史0.x证据以下保留，不能用于证明1.0.0当前接口仍存在。

## Token、槽位与接入验收架构（2026-10-15）

本轮只修改 xui。将用户提供的 Stitch Token 架构材料保存为带指纹的参考，统一落实到 DESIGN **0.18.0**、公开组件、原生结构、正式示例和逐项清单。设计方向由参考校准；最终合同仍采用已验证的语义尺度、可访问性和宿主事实，不引入参考中的10/11px普通提示、全mono、不可聚焦密码切换、覆盖错误文字或虚构认证流程。本轮没有新增实时 Stitch 会话评审。

三层 Token 在生成阶段检查依赖方向；默认浅深/reduced 与产品覆盖均不能出现语义层依赖组件、组件跳过语义层读取原始调色板。页面壳、标题、工具栏、章节、卡片、表单/字段、表格、弹层、导航、原子控件与反馈明确内容归属、文字/颜色、空槽、状态和滚动职责。布局不持有查询与业务提交；busy、disabled、readOnly、empty、error 保持不同事实。既有刷新合同继续要求旧内容、节点、输入和焦点连续，普通刷新不导航 Document 或重挂正文。

新增 React Card 与原生 createCard 共用 Surface/Toolbar/Typography/Badge/OverflowText，提供 title/icon/badge/actions/description/body/footerMeta/footerActions 的统一组合；归属 Badge 默认 neutral。原生 partial update 保留未变 Node/Fragment，销毁仅释放所拥有的文本呈现；React 保留同类型/key内容。PageHeader.meta 统一次要文字，空 Fragment 不产生工具/章节占位。正式卡片列表示例复用原有数据 owner、局部刷新及失败恢复。

[接入清单](ADOPTION_CHECKLIST.md)包含 **220 个唯一 ID、22类**。16个公共服务操作各有请求、成功、异常/权限三项，共48项；每个真实页面/组件实例/slot独立记录结果。公共操作由 BaseService facade 或后端一次适配同一wire，前端采用官方client；独立领域/第三方协议仍保留明确边界。该规则不授权本轮迁移任何消费项目的后端、认证或业务 API。文档守卫检查唯一ID、完整操作结果和每行合同来源，不能把清单存在当作项目验收通过。

最终 source generation `31bb3741c479c053c07eef0ecf54a3289493a7c0b2649a58e7074a938bf35854`；387 tokens、102公开入口，三包私有0.1.0。独立 tarball 消费者验证正式ESM/CSS/types/init、完整命名类型和peer单实例，不使用源码alias。正式critical CSS gzip **17620/17792**，比上一固定产物 c97cc82 的17417增加203字节；对应CSS预算由17536增加256至17792，Button/JS预算保持。早期567字节为未完成消费者流水线的中间测量，不能作为最终产物数据。

| 检查 | 结果 | 原始证据（`.artifacts/architecture/`） |
| --- | --- | --- |
| build / types / tokens / docs / 单测 | 通过，单测 **528/528**；220项检查源和102入口一致 | 最终构建与门禁日志 |
| 正式tarball消费者 | 通过，同代包、types、导出、peer与体积门禁 | 最终consumer日志与performance-baseline |
| Chromium槽位专项 | **32/32**，双端三主题、1280/390、16/32字号、真实Chrome200%与保行刷新 | `architecture-slots-final-0.18.json` |
| 页面/表单/刷新回归 | **34/34** | `page-composition-final-0.18.json` |
| Firefox / WebKit精选 | 各 **6/6**，双端桌面浅色、窄屏深色大字与刷新失败恢复 | `architecture-firefox-final-0.18.json`、`architecture-webkit-final-0.18.json` |

实际核对宽窄槽位边界、图标与首行标题对齐、Badge固定、业务动作Enter/Space只执行相应回调、空槽折叠、动态标题/层级更新、父壳及记录节点/焦点/输入选区保持、局部busy/error、明确重试和零主Document刷新。已查看浅色桌面、深色窄屏大字和完整卡片列表失败恢复截图。真实浏览器缩放与根字号放大分别执行，不以CSS zoom模拟浏览器缩放。

初轮查出工具栏同等选择器覆盖卡片首行对齐，已提高所属公共Card规则的明确性；另两次失败分别来自测试数组误加入其他组件、把Base UI真实Button的tabindex误判成新增焦点目标，已修正测试并保留失败证据。没有通过删状态、放宽几何、隐藏控件或修改消费项目来过验收。

未跑任何采用项目的真实业务页面、真实后端16项服务、部署、实体触屏设备、读屏器及独立SSR hydration；公共SSR字符串测试不等于hydration验收。旧公开入口和默认值保持，新增Card可逐步采用；PageHeader.meta新增公共包装，依赖旧私有DOM选择器的代码须按公开slot迁移。


## Popover 可用宽度边界（2026-10-15）

以固定 `17d8be6fa5ef3baf3845206c0e8bc89b62f0f053` 隔离复核，独立正式包消费者在 Dialog 实际节点内 Portal、align=start、32rem 目标宽度及内联 Combobox 下复现：普通 640px 视口和真实 Chrome 200%（innerWidth640/innerHeight406）均为 left134/right646、width512，而 positioner 的 available-width 仅372px。根因是 top/bottom 公共浮层只限制视口宽度，没有同时采用定位器的可用宽度。

floating.css 将现有 Select/Combobox 的可用宽度约束统一到定位器内的公共浮层；左右侧继续扣除定位间距。React API、公开 types、Portal container、受控 open、回焦点与宿主草稿合同不变；原生仍由既有 createPopoverController 计算原生 top-layer 的边界。没有复制定位器、修改宿主 CSS、认证/API 或引入新业务 owner。DESIGN 保持 **0.17.0**，386 tokens、102 入口，三包私有0.1.0；本修正不要求消费者迁移后续 Card/Token/接入规范。

正式 source generation `0b746d9f9c156ca6d34d4ddafea4b64ace029ae9d6128b4d4e5ba87aa25b73a5`。独立 tarball 安装验证正式 ESM/CSS/types、命名类型和单份 React/ReactDOM/Base UI，原生无 React，无源码 alias；CSS/JS 预算未改变。

| 检查 | 结果 | 原始证据 |
| --- | --- | --- |
| build / 类型 / tokens / 单测 | 通过，单测 **524/524** | `.artifacts/popover-bounds/` 中 `build-final.log`、`typecheck.log`、`tokens-final.log`、`unit-final.log` |
| 正式消费者 | 通过，同代包、正式入口、types 与体积门禁 | `consumer-final.log` |
| 初始最小复现与修正 | 初始两项几何失败；修正后关键三项通过 | `baseline-failed-evidence/`、`critical-final.json` |
| Chromium 新专项 | **54/54**；两类父弹层、四侧/三个对齐、三主题、1280/390、根字号16/32、真实Chrome200% | `.artifacts/popover-available-bounds/` |
| Firefox / WebKit | 各 **4/4**，两类父弹层的浅色窄屏与深色200%文字 | `firefox-keyboard-adjusted-final.json`、`webkit-keyboard-adjusted-final.json` |
| 既有弹层回归 | Portal **32/32**、双端边界 **30/30**（排除旧脚本硬编码的其他端口缩放） | `portal-regression-final.json`、`boundary-regression-final.json` |

复开使用真实 Tab 从内联搜索到取消按钮，断言焦点、完整按钮边界；Escape 返回触发按钮，父弹层、草稿和节点身份保持。浏览器缩放由 Chrome 设置执行，核对 DPR 翻倍、CSS视口减半、根字号不变、CSS zoom=1、pinch=1。初轮一个 Firefox 用例在复开后立即 programmatic focus 时记录到不同的滚动结果，证据保留；随后使用验收要求的真实 Tab 路径通过定向与完整精选复验。没有放宽边界或改动生产焦点代码，不能将该结果外推为任意时机的程序化焦点操作均已验收。未跑消费项目产品复验、实体移动设备和读屏器；独立消费者不代替宿主升级验收。

## 通用卡片长标题（2026-10-15）

基于固定 `68b017cea090109967226aa4056064492583e2c1` 排重：此前只有 NavigationMenu.Label / createNavigationLabel 的导航专用滚动，没有卡片可用的通用入口。新增 React `/display` 与 root 的 OverflowText/OverflowTextProps、runtime `/display-dom` 与 root 的 createOverflowText/OverflowTextOptions/OverflowTextController。源码只改xui；没有升级或修改xAgent、后端、认证、API及其既有adapter。本次文本部件不构成完整卡片Header/Footer槽位框架交付，也没有实施尚在讨论的公共API接入规范变更。

h3、图标、中性归属Badge、摘要、footer和动作保留宿主语义；只有text字符串参与动画。interactionRef/interactionTarget指向现有包含该名称且有键盘入口的表面，其hover/focus触发同一名称展示；没有现有键盘入口时完整静态换行，不新增Tab或伪按钮。短名称、减少动效、触屏、无动画支持保留完整静态文本；英文无空格可折行。原导航呈现复用共享几何，原nav-label-scroll-*改为新text-overflow-scroll-*的同值别名，仍接受原公开覆盖。完整合同与合成消费者见[通用长标题](COMPONENTS.md#通用长标题)。

最终 source generation `aeb93d3bdd9e99a3960c245f0065f43e601940f5611d56f3b8c671bda571bb91`；DESIGN **0.17.0**，386 tokens、102 manifest入口，三包仍为私有0.1.0。正式CSS gzip **17424/17536**，预算未提高。独立tarball消费者验证正式ESM/CSS/types/init、命名类型与负向编译；React/ReactDOM/Base UI各一份，原生无React，没有源码alias或消费者动画/CSS补丁。新增internal/overflow-text仅包间接线，消费者使用公开display入口。

| 检查 | 结果 | 原始证据（`.artifacts/overflow-text/`） |
| --- | --- | --- |
| build / types / tokens / docs / 单测 | 通过；单测 **524/524**，包括完整安全SSR标题、不增加交互语义 | `build-final.log`、`typecheck-final.log`、`tokens-final.log`、`docs-final.log`、`unit-final.log` |
| 正式tarball消费者 | 通过；入口/类型/同代包/peer/gzip门禁 | `consumer-final.log`、release metadata |
| Chromium新专项 | **40/40**：两端 ×三主题 ×1280/390 ×16/32字号24项；减少动效/无target/无动画6项；触屏2项；销毁2项；真实Chrome200%缩放6项 | `browser-final.json`、`screenshots/` |
| 导航与展示回归 | **50/50**：navigation-presentation、display、display-foundation-contract | `regression-final.json` |
| Firefox / WebKit精选 | 每引擎 **10/10**：两端桌面浅色、窄屏深色200%文字、减少动效、无target和销毁 | `firefox-final.json`、`webkit-final.json` |

浏览器实际断言仅名称移动、Badge固定且不被裁切、完整h3名称、无新增Tab停靠、真实Tab/输入焦点触发展示、延迟/距离/速度与末端几何、短名称无动画、16/22rem表面及动态中英文标题更新、原节点/草稿/选区、降级全文折行、销毁取消动画/释放ResizeObserver后重挂只有一个owner。Chrome缩放由设置页执行200%，分别确认DPR翻倍、CSS视口减半、根字号不变、CSS zoom=1、pinch=1。实际查看桌面浅色、窄屏深色大字和system真实缩放截图。

候选构建先因固定token数量未同步、事件监听动态方法失去DOM重载类型而失败，已同步精确386并使用明确的add/remove；未放宽类型/预算。关键浏览器初轮4/6，两个失败为容器宽度更新后测试仍读取RO重测前旧动画；现等待当前距离/速度与动画时长匹配后在同一evaluate取值并finish，保留末端、时长和节点断言，生产动画未因该失败改动。初轮与复验报告完整保留。

未跑xAgent真实卡片、产品部署、后端/认证/API、实体触屏设备/读屏器和独立SSR hydration；模拟触屏与SSR字符串测试不代表这些已通过。此次新能力不授权消费项目更改其原有协议或业务owner。

## stacked InputGroup 的 Textarea 自动增高（2026-10-15）

在侧栏合同提交 `429298e53e3f14ba04616964a2f7811593804905` 之后独立修复；只修改 xui，不升级消费项目。以正式 `511383729302901d8ff7284f520a943519ee7051` 的三包安装到独立消费者复现：同一受控长文本中，独立 Textarea 从72px增长至120px，stacked InputGroup 实际仍70px，尽管内联 block-size 已为118px、scrollHeight272px。根因为公共纵向 flex 的伸缩基准覆盖共享测量结果，不是宿主 value、请求或另一个高度 owner。

共享 `bindTextareaAutoResize` 在活跃期间标记自身尺寸归属，公共 forms.css 仅对 stacked 中已启用的 Textarea 采用其测量高度；销毁恢复原属性和内联尺寸。React 继续复用同一绑定，没有第二套测量、状态或事件机制；公开 ESM/types 和 autoResize/maxRows/update/destroy 签名不变。未启用时保留原 flex、手动resize与rows，只有原本声明自动增高但被压缩的组合表现得到修正。具体合同及正式双端例子见[Textarea](COMPONENTS.md#textarea-可选自动增高)。

最终 source generation：`800d60ac70149bf505c06df26168f25886947a38ca361d0cee0ae50560802bf9`；DESIGN **0.16.1**，三包私有版本仍0.1.0，384 tokens/101公开入口。正式 CSS gzip **17351/17536**，未提高预算。独立 npm tarball 安装逐个核对 ESM/CSS/types/init，React/ReactDOM/Base UI 各一份，原生无 React，未使用 packages/src alias 或消费者 flex/高度补丁。

| 检查 | 结果 | 原始证据（`.artifacts/textarea-composition/`） |
| --- | --- | --- |
| build/types/tokens/docs/单测 | 通过；单测 **523/523** | `build-final.log`、`typecheck-final.log`、`tokens-final.log`、`docs-final.log`、`unit-final.log` |
| 独立正式消费者 | 通过；公开入口、命名类型、peer与gzip门禁 | `consumer-final.log`、release metadata |
| Chromium 新组合 | **64/64**：两端plain/Dialog及stacked/Sheet ×3主题 ×1280/390 ×16/32字号48项；交叉容器rows4共4项；单侧Addon4项；默认未启用2项；真实Chrome200%缩放6项 | `browser-final.json`、`screenshots/` |
| 原自动增高回归 | **30/30**：原Dialog全矩阵及真实缩放 | `regression-final.json` |
| Firefox / WebKit 精选 | 每引擎 **8个唯一用例通过**，包含两端窄屏200%文字stacked/Sheet、rows4交叉容器及默认行为 | `firefox-keyboard-final.json`、`webkit-keyboard-final.json`；Chromium只读真实按键的2项定向复验 `chromium-keyboard-final.json` 不重复累计 |

检查真实高度增长、5行封顶/内部滚动、删除缩回、rows下限、受控更新、原节点/选区/焦点、上下/单侧工具区、readOnly/disabled/busy、无额外input事件、合成composition与实际文字输入、恢复默认flex和手动resize、Dialog/Sheet滚动、关闭回触发器和无页面横溢。真实缩放由Chrome设置页200%执行，断言DPR翻倍、CSS视口减半、根字号不变、CSS zoom=1及pinch=1。已实际查看桌面浅色、窄屏深色大字及system真实缩放截图。

初轮测试错误与trace保留，未据此放宽生产实现：多行fill的原生事件数由浏览器决定，断言改为重测/受控同步不增发事件；测试向浏览器evaluate显式传入草稿。自动化insertText作用于只读框时，WebKit会折叠选区，Firefox还会产生原生input但值未变；现用真实按键验证只读值不变、零input，另行核对公共同步/测量保留选区和不增发事件，不将浏览器/驱动注入差异归因给尺寸绑定。三个引擎相同合同重验通过，初轮与定向报告保留。

未跑xAgent真实页面、后端/认证/生产部署、移动OS实体键盘/读屏器、独立SSR hydration和全仓浏览器/watch/coldstart；合成IME不等于OS IME验收。侧栏两项的独立证据见下节，不重复累计；最终正式包同时包含该侧栏提交及此修复，宿主仍需按固定产物接入验收。

## 底部导航开关与业务 footer 同行（2026-10-15）

基于固定 `511383729302901d8ff7284f520a943519ee7051` 补齐同一侧栏公共布局合同。React MenuLayout/AppShell、原生 createMenuLayout 新增可选 `sidebarTogglePlacement='top'|'bottom'`；默认 top 保留旧位置，bottom 将原控件放在菜单和可选业务 footer 之后，顶部没有占位。窄屏仍移动同一个按钮到顶栏打开原 drawer；折叠/抽屉/roving/导航事实沿用原 owner。直接 AppShell 入口是 `/layout`，没有新增 `/app-shell` 别名。

新增 React `/layout` 和根入口的 `SidebarFooterRow`，原生使用公开 `.xui-sidebar-footer-row`，只启用自然宽度、按空间换行的行排列。原 footer 的递归全宽规则在 Row 内不再强制，Button 的 icon/size 尺寸保留；未使用 Row 的默认 footer 保持全宽。长版本/授权事实完整换行，紧凑 rail 按分组纵排并保留 SidebarFooterContent 的 icon/label 合同。业务返回、更新、版本来源、权限/disabled/busy 均由宿主提供。完整合同和代码见[侧栏底部](COMPONENTS.md#侧栏底部接入与迁移)及两端[示例](../examples/sidebar-footer-react/app.tsx)。

source generation 为 `eb2537520a8ebcafd525bd9f83967cc3fc2785873c758e0cd9856d07a4e719fa`；DESIGN 0.16.0，384 tokens，101 manifest入口，三包仍为私有 0.1.0。正式 CSS 113800 bytes / gzip17338，未提高17536预算。独立 tarball 消费者逐项验证 ESM/CSS/types/init、Root及子入口命名类型、合法枚举与非法值负向编译；React/ReactDOM/Base UI 各一份，原生无 React，无源码 alias。

| 检查 | 结果 | 原始证据（`.artifacts/sidebar-bottom/`） |
| --- | --- | --- |
| build / types / tokens / docs / 单测 | 通过；完整单测 **523/523** | `build-final.log`、`typecheck-final.log`、`unit-release.log`、`tokens-release.log`、`docs-release.log` |
| 正式 tarball 消费者 | 通过；公共入口、同代包、CSS和peer门禁 | `consumer-final.log`、release metadata |
| Chromium 新组合 | **51/51**：React MenuLayout/AppShell、原生 MenuLayout × 三主题 × 1280/390px × 根字号16/32共36项；document/workspace长版本及移除footer6项；真实Chrome200%缩放9项 | `browser-final.json`、`chromium-targeted-final.json`（4项定向复验，不重复累计）、`screenshots/` |
| 默认兼容回归 | **84/84**：原 sidebar-control/sidebar-footer/menu-layout 全部 | `regression-final.json` |
| Firefox / WebKit 精选 | 每引擎 **9/9唯一用例通过**：三种组合的桌面浅色、窄屏200%文字深色与document长footer | `firefox-final.json`；WebKit初轮7/9及 `webkit-targeted-final.json` 中失败两项2/2 |

新专项真实检查324px展开/60px compact（随根字号缩放）、短菜单与80项长菜单的独立滚动、footer同行及busy/disabled、唯一开关的点击/Enter/Space、aria-expanded/controls、菜单单一Tab停靠及方向键、footer→开关Tab顺序、top/bottom更新后的同一焦点/按钮/滚动、断点移动后同一侧栏/业务footer/草稿节点和焦点、完整焦点环与末项可达。长中文/版本和放大场景自然换行；抽查浅色桌面、深色大字drawer与真实缩放截图。Chrome缩放通过设置页操作并核对DPR翻倍、CSS视口减半、根字号不变、CSS zoom=1、visualViewport.scale=1。

候选构建曾因SSR class组合向cx传入false而失败，按已有cx类型改为undefined，未放宽类型。WebKit初轮的两个失败是窄屏→桌面后立即读取DOM，测试未等待React媒体状态；已等待桌面可访问名和公开placement事实，保留严格的末子节点/焦点条件，生产代码未因该失败修改。原报告及trace保留，不将复验重复算作新增通过。

未跑xAgent真实页面/认证/API/部署、移动OS/读屏器、独立SSR hydration和全仓浏览器/watch/coldstart；这里只验证合成公共消费者，不代表宿主已升级。旧511归档及已交付Portal能力保持不变。同轮另行核对的stacked Textarea增长缺陷由独立修复提交处理，不把侧栏验收当作该项已通过。

## Popover.Content 的 Portal 容器（2026-10-15）

以 xAgent 实际固定的 `595380a6d2467d56623a0df0dedc026e0331a4ff` / DESIGN 0.13.1 对照修改前 main `57f4e8c0f8c7c640b4f8b1faa1fbf7438581d27f`：Popover 实现未变化，Content 尚无容器扩展。当前新增 React `/popover` 与根入口的 `PopoverContentProps`、Content.portalProps；复用公开 Portal 类型与原有 Root/Positioner/Popup，不新增叠层、焦点或打开状态 owner。实际类型、默认值与就绪接线见[组件手册](COMPONENTS.md#popover-的-portal-容器)，独立消费者为[Dialog/Sheet 示例](../examples/popover-portal-react/app.tsx)。本轮只改 xui，没有升级或修改 xAgent、业务 API、后端或认证。

首个正式包候选在 390px/200%文字下通过内滚、搜索与节点连续性，但 Escape 关闭后父 Dialog 的恢复帧覆盖了子 Popover 回焦点，原始失败保留于 `critical.json`/`critical-run.log`/trace。该 peer 1.7.0 竞争发生于移除持焦的嵌套 Portal；默认目标没有该失败，公开 keepMounted 策略也可避免它。最终 Content 对显式 container 默认 keepMounted=true，让 peer 隐藏稳定子树；省略 portalProps 保持原目标/关闭卸载，关闭父模态释放子树及 Portal ref。显式 keepMounted=false 仍采用 peer 卸载语义，模态内 Escape 回焦点限制未被修复或伪称通过；该覆盖项仅验收触发器关闭和确实卸载。

另一候选的 RefObject 在模态节点就绪前挂载保留子树，current=null 时按 peer 回退父 Portal，产生错误目标；失败为 `critical-retained.json`。正式示例改为节点就绪后挂载 Content，再传已就绪稳定的节点或 RefObject，没有改私有 DOM、手工搬节点或轮询 ref。类型消费者验证 HTMLElement/ShadowRoot/RefObject/null/undefined；callback container、选择器字符串和 portal children 均为负向编译检查，Portal callback ref 则可编译。原生 createPopoverController 没有 React Portal 参数，本轮不改原生定位/焦点职责。

最终 source generation 为 `47bcfa6a217451d6193b32bdc35982941f970593b8bf89ba0a1528694a233300`，DESIGN 0.15.0，三包仍为私有 0.1.0；384 tokens、默认变量 CSS 指纹、101 个 manifest 入口和既有 gzip 预算不变。正式消费检查逐项对比 ESM/CSS/types/init 与本代产物，保持 React/ReactDOM/Base UI 各一份、原生无 React，不使用 packages/src alias。CSS 为 17239 gzip bytes，未新增组件 CSS 或提高 17536-byte 预算。

证据集中于 `.artifacts/popover-portal/`，正式固定源码 SHA、三包摘要及可复制消费者随交付归档记录。

| 检查 | 结果 | 原始证据 |
| --- | --- | --- |
| 构建 / types / tokens / docs / 单测 | 通过；完整单测 **522/522**，384 tokens，101入口 | `build-final.log`、`typecheck-final.log`、`tokens-release.log`、`docs-release.log`、`unit-release.log` |
| 独立正式 tarball 消费者 | 通过；真实 ESM/CSS/types/init、命名类型及 peer/打包边界 | `consumer-final.log`、正式 metadata 与消费者 metafile |
| Chromium 新组合 | **38/38 唯一用例通过**：24项两类容器×三主题×桌面/390px×根字号16/32，默认兼容2、keepMounted2、显式卸载2、正常动效2、真实200%浏览器缩放6 | `browser-final.json`（36）及 `animated-final.json`（2），截图/几何及 `screenshots/` |
| 相关默认浮层 / 原生回归 | **38/38**：旧边界36（含两端及6项真实缩放）、foundation菜单/Popover/Tooltip生命周期2 | `regression-final.json`、`foundation-final.json` |
| Firefox 精选 | **8/8**：两类模态的浅/深390px根字号32、默认目标与保留子树 | `firefox-final.json` |
| WebKit 精选 | **8/8**：两类模态的浅/深390px根字号32、默认目标与保留子树 | `webkit-final.json` |

新组合实际检查搜索/空结果/键盘选择/取消/后续确认、受控拒绝关闭与宿主打开、草稿/选区/节点身份、单一可见 backdrop、隐藏搜索退出 Tab 顺序、内滚/末项命中与完整焦点环、Escape 分层回到同一触发器及父模态卸载释放。system 在打开状态跟随浅深切换且保留节点/焦点。真实 Chrome 缩放通过设置页操作，核对 DPR翻倍、CSS视口减半、根字号不变、CSS zoom=1、visualViewport.scale=1；不是用CSS放大替代。抽查了浅色Dialog、深色Sheet与实际缩放的可见内容及焦点截图。

未跑：xAgent 四处真实消费页面及其认证/网络/部署、ShadowRoot 的浏览器运行场景、独立 SSR 自定义容器、移动OS/触屏和读屏器、全仓全部浏览器用例与冷启动/watch。不能把本轮合成消费者验收当成 xAgent 已升级或产品验收。`critical.log` 的首次 grep 没有收集到用例，不计为任何行为通过；候选失败与最终通过分别保留。

## xLead 公共接入反馈（2026-10-15）

以正式595380a / DESIGN0.13.1对照当前main排重，五项均未已有解决：原生装饰logo空alt、完整登录及新密码组合的显隐文案转交、Key已确认吊销后的能力读回为公共缺陷；初始化手动只读核对与Textarea自动增高为显式可选扩展。此次仅修改xui，没有修改xLead、其它消费方或baseservice，也没有新增后端端点/DTO/密码策略。

| 反馈 | 已实现公开合同 | 责任边界与兼容 |
| --- | --- | --- |
| AuthPage空alt | 原生比较getAttribute('alt')，空字符串在首次创建也显式输出；更新/移除/重加与React一致 | 继续采用完整公共页，不要求消费者修改节点 |
| 显隐密码翻译 | LoginPageConfig.labels与NewPasswordLabels均新增可选showPassword/hidePassword；新密码/确认两个输入同步转交，AdminSetupPage的passwordLabels沿用 | 默认英文不变；旧完整labels对象仍可编译；不改变认证、清密或固定6–32码点规则 |
| 吊销后权限陈旧 | 已确认revoke后通过现有adapter.list读取一次权威metadata/capabilities | 成功前后均不推断删除授权；读失败保留已知revoked和锁定能力，使用原列表错误/刷新入口，不重放revoke；事务/权限/CAS仍归后端 |
| 初始化复核 | 可选onCheck({signal})返回complete/unconfirmed/unavailable；底层controller.check()；checking与checkFailed反馈 | 仅手动只读；异常/非法结果不解锁写入，不创建会话或导航；宿主提供权威回调和期限。未配置时无新动作。穷举AdminSetupStatus的代码需处理新增checking分支 |
| Textarea自动增高 | React autoResize={maxRows}；原生/dom的bindTextareaAutoResize/update/destroy | 默认关闭，已有rows/CSS下限保留；增长、上限滚动、缩回，保留value/选区/焦点/IME及所属Dialog滚动。只拥有尺寸，未新增皮肤 |

初始化写入/复核复用同一个controller；挂起、权威状态替换与销毁会中断本地等待，拒绝迟到结果，即使宿主忽略AbortSignal也不会悬挂本地调用者。这不证明后端已撤销已提交事务。完整登录与改密的合成消费者分别采用相同公开输入，原生不会安装React。

规范升至0.14.0，384 tokens、默认变量CSS指纹与101个manifest入口不变。最终package source generation为`02c5446c1133239437f50aecd48f45c9e779595ad59b2ccba085da7bc9b78d45`；三包仍为私有0.1.0，必须连同固定源码SHA和正式tarball识别，未发布registry。独立消费者逐项核对ESM/CSS/types/init与peer单实例；完整CSS仍为17239 gzip bytes，既有17536预算未提高。

证据集中于`.artifacts/xlead-public-feedback/`。首轮unit519/520，唯一失败是旧合成revoke只计数、普通list永远返回expired；修正夹具中的权威状态后page-api14/14通过。最后两项补充为忽略abort的本地等待终止，以及新密码组合显隐文案；最终六文件定向单测49/49，不宣称全仓完整单测已在最终代重跑。

首次专项27/48，15项是新增原生示例误用React的xui-dialog类，导致关闭后仍可见；改用已有公开xui-native-dialog。另6项完成消息断言匹配到密码强度status，改为精确定位完成反馈，不改产品行为。更正后候选48/48通过；其后补齐NewPasswordFields同根转交和正式改密消费者，最终结果以release报告为准。一次既有回归在确认失败根因后中断，原日志保留：旧密码模糊label会匹配新增中文显隐按钮，简单exact又漏掉必填星号，最终使用限定标签正则；Key手动再试成功后按新合同多一次普通读取，计数同步而非删除断言。跨引擎第一次尝试继承了Chromium专用可执行路径，未执行有效引擎验收即停止，独立config清除该启动项后再验证；不将启动候选算成Firefox/WebKit通过。

| 最终同代检查 | 结果 | 原始证据（`.artifacts/xlead-public-feedback/`） |
| --- | --- | --- |
| 构建 / types / tokens / 定向单测 | 通过；384 tokens；六文件49/49，未重跑最终全仓完整单测 | `build-release.log`、`typecheck-release.log`、tokens/unit release日志 |
| 独立正式tarball消费者 | 通过；101入口、17239 gzip；React/ReactDOM/Base UI单实例，原生无React | `consumer-release.log`及正式metadata/peer树 |
| Chromium新专项 | **52/52**；双端三主题/宽窄/根字号16或32，6项真实浏览器zoom200%，初始化与改密双字段显隐/清密/忙态 | `browser-release.json`、`browser-release-output/` |
| Chromium相关回归 | **192个唯一用例各自通过**；原164项中154先通过，10项英文标签旧预期同步后复验通过，另28项登录视觉首次通过；不重复累计复验 | `regression-final.json`、`regression-labels-rerun.json`及各自log/output |
| Firefox / WebKit精选 | **各12/12**；两端200%文字Textarea/Dialog、装饰logo、完整登录中文、新密码组合、手动只读复核 | `firefox-release.json`、`webkit-release.json`及对应log/output |

真实Chrome缩放分别断言CSS视口减半、DPR翻倍、根字号不变、CSS zoom=1与pinch=1，不拿根字号放大替代。Textarea检查原节点、原选区、焦点、增高/缩回、超过行数内部滚动、恢复默认resize、只读/禁用、输入与composition事件不增发、Dialog关闭回触发器；IME为合成事件与真实文本输入，不声称实体移动键盘验收。初始化/改密示例均只调用合成宿主回调，未触达真实写接口。最后的回归10项错误完整保留；修正的是配置已中文化后的对应名称断言，没有删除状态、像素、键盘或清密检查。

xLead原26项真实产品回归属于595380基线，不能替代本轮库级合成消费者结果。其产品升级、回调接线和实际后端回归由采用项目另行执行。本轮未跑全仓浏览器套件、真实移动OS/Wails、读屏器、生产会话或真实Key/初始化事务。

本批曾仅记录xAgent固定595380的Content容器缺口，未在xLead反馈批次实现；后续公开增强与嵌套弹层验收见本页[Popover.Content的Portal容器](#popovercontent-的-portal-容器)。历史固定产物本身没有被补写能力。

## 长内容 Popover 碰撞尺寸（2026-10-15）

固定0fd37c1与本轮修改前ad9dc9d的Popover/原生定位器/浮层CSS相同。独立正式包消费者用公开React Popover.Root/Trigger/Content/Title、`positionerProps={{align:'end'}}`及className宽度扩展复现：390×844、根字号32px、12项合成上下文数据，Popup top256、height591、bottom847，底边超出3px；原生同样内容bottom812，无越界。说明这不是宿主误用入口，也不需要宿主改成其它组件或编写内部CSS补丁。

Base UI 1.7.0把available-height/width赋给外层Positioner，其可用空间包含外壳；xui外壳又在对应轴上有两侧floating-offset留白，而原Popup上限直接使用整个available-height。修复在正式floating.css中为top/bottom内容高度扣除双侧语义gap，left/right对宽度同理；视口上限、offset、默认碰撞/side/align及受控/回调/节点生命周期均保持既有合同。原生controller已单独扣视口inset与锚点gap，不重复扣React外壳留白，不修改原生事件或新增状态owner。修复后上述React top256、height575、bottom831，完整border box留在844px视口内，长内容和末行焦点在内部可达。

DESIGN补丁版本0.13.1，384 tokens及默认变量CSS指纹不变；公开exports/types/API数量仍101。package source generation为`5b91a45f693b7375cd28b263fb974659849ba26ea8de079077b0cb218a3aef66`。独立tarball消费者的ESM/CSS/types/init、React/ReactDOM/Base UI单实例与原生无React检查通过。完整CSS gzip17239 bytes，在既有17536预算内，本轮不提高预算。边界fixture自身只用公共组件/原生controller、公开className宽度及宿主工具栏布局，不添加高度/碰撞补丁。

新专项、回归、跨浏览器及原始失败证据集中于`.artifacts/popover-boundary/`。基线原始报告`baseline-measured.json`为React失败、原生通过；不是产品现场验收，未连接xAgent/API/认证/后端。首次关键用例30/36，余下6项是测试假设：桌面普通字号内容能够自然放下、不应强制产生滚动；桌面大字的外点控件中央被合法弹层覆盖，改为点击可见部分而非force click。跨引擎候选另揭示程序化focus不必产生Firefox键盘焦点环，以及WebKit鼠标点击button不必转移焦点；最终用真实Shift+Tab/Tab与外部文本框验证，不放宽几何、outline、草稿、受控拒绝关闭及节点身份断言。

| 检查 | 最终结果 | 原始证据（`.artifacts/popover-boundary/`） |
| --- | --- | --- |
| 构建 / tokens / types / 单测 | 通过；384 tokens；unit首跑511/512，规范版本正则同步后contract文件5/5通过，其余511项有效 | `build.log`、`tokens.log`、`typecheck-final.log`、`unit.log`、`contract-test-rerun.log` |
| 独立正式消费者 / CSS与peer | 通过；101入口、17239 gzip bytes；同代安装包与React单实例、原生无React | `consumer.log`、`rebuild-fixtures.log`及正式metadata |
| Chromium新边界与连续性 | **36/36**；24项双端主题/桌面或390px/根字号16或32px矩阵、4向显式碰撞边界、2项正常动效、6项真实Chrome zoom200% | `browser-accepted-final.json`及截图/trace |
| 相关浮层回归 | **82/82**；80项相关选择/日期时间/菜单等回归及2项foundation的menu/popover/tooltip生命周期 | `regression-final.json`、`foundation-popover.json` |
| Firefox / WebKit精选 | **8/8唯一用例通过**；每引擎两端390px/200%文字和正常动画各4项，失败后定向复验不重复累计 | `firefox-keyboard-outside-rerun.json`、`webkit-keyboard-outside-rerun.json`、`webkit-tabcycle-rerun.json`及原动画报告 |

最后一次测试fixture又发现React接受关闭的测试状态尚未提交就发Escape的竞争（候选33/36），通过等待fixture的getAccept事实回传消除，未修改产品或组件事件。该只读测试探针更新后，按相同已安装正式包重新打包fixture并再次通过36/36；未重复构建包或改变包代际。WebKit按当前Mac平台采用Option/Alt+Tab和反向组合遍历原生控件，未改变全局系统设置、tabindex或focus样式；Tab与Option-Tab的差异见[Apple键盘合同](https://support.apple.com/en-in/guide/safari/cpsh003/mac)。这项端差异不能误报成组件几何失败。

Escape恢复同一trigger；外点若用户已聚焦另一输入，则保留新焦点，不以“回焦点”为由抢回。这个既有peer/native语义未改为全局focus trap或强制回触发器。React关闭后是否卸载仍按原peer生命周期，节点连续性检查针对保持打开和受控更新。没有修改xAgent固定依赖或旧0fd37c1归档；新修复须由宿主另行授权采用相应固定产物。

未跑全仓完整浏览器套件、真实移动OS/Wails、读屏器或xAgent现场API；不声称这些路径通过，没有registry发布。

## 导航名称滚动、首行对齐与 324px 默认侧栏（2026-10-15）

规范升至0.13.0，默认主题384 tokens。经用户明确确认，桌面展开侧栏默认由216px提升到324px（`nav-item-height × 9`）；60px compact rail与视口约束的288px窄屏drawer独立保留。此项会改变所有使用默认展开宽度的消费页面，需随固定正式包升级并复核主内容净宽，不能把历史216px或未升级产品截图当成新版事实。

React `NavigationMenu`/`MenuLayout` 与原生 `NavigationMenuOptions`/`createNavigationMenu`/`createMenuLayout` 共用新增 `labelOverflow?: 'wrap' | 'marquee'`、`actionAlignment?: 'center' | 'start'`。默认wrap/center保持兼容。显式marquee仅移动公开名称部件：React `NavigationMenu.Label`、原生`createNavigationLabel`；富描述、Badge、图标与分支/配置按钮不移动。默认纯文本名称自动组合；自定义renderer显式声明名称，不猜私有标签。独立动作在空间足够时与首行同轴，空间不足时折到下一行并保留主项最小空间；compact维持既有堆叠。没有新增路由、查询、权限或配置owner。

可hover的精细指针及键盘主项焦点以400ms延迟、40 CSS px/s单次滚至末端保持；离开/失焦取消并复位。触控、无hover、减少动效或缺少Web Animations时显示完整静态换行名称。RTL向逻辑末端滚动；名称、选项、几何及媒体变化更新同一controller，卸载释放监听、观察器、计时器和动画。`internal/navigation-presentation`仅为双端包间接线，已列入完整exports索引，非消费者稳定API。

最终 package source generation 为 `d85924520822d80660201d011590e3bf001ba95ad5df9d7c031f95a1d18df2e1`。独立tarball消费者逐个核对正式ESM/CSS/types/init；React/ReactDOM/Base UI单实例，原生无React。完整CSS为112549原始字节、17187 gzip字节，比上一交付16767增加420字节；新增8个主题token和导航样式后，原16768-byte门禁不再够用，本轮仅将该预算增加768至17536，Button/JS等其他预算不变。

最终执行证据集中在 `.artifacts/navigation-presentation/`，均使用上述同代正式包。unit首跑511/512，缺失内部manifest入口映射导致文档守卫失败；补齐PUBLIC_API映射后文档用例1/1通过，其余511项结果有效，没有重复运行整套512项。不是全仓浏览器套件、消费产品或生产API验收。

| 检查 | 最终结果 | 原始证据 |
| --- | --- | --- |
| 构建 / tokens / types / unit | 通过；384 tokens；512项各自通过（511项原结果＋文档1项修复后复验） | `build-final.log`、`check-tokens.log`、`typecheck.log`、`unit.log`、`docs-test-rerun.log` |
| 独立正式消费者 / peers / 体积 | 通过；101个manifest入口、双端正式ESM/CSS/types；CSS 17187 gzip bytes | `consumer-final.log`及正式metadata |
| Chromium新名称/对齐专项 | **32/32唯一用例通过**：24项双端主题/1280或390px/根字号16或32px矩阵，加滚动、更新/RTL、减少动效/触控、禁用/分组/compact；静态多行首行对齐另定向复验2/2 | `browser-final.json`、`browser-disabled-rerun.json`、`reduced-first-line.json`及各自截图/日志 |
| Chromium相关回归 | **314/314唯一用例覆盖通过**：数据表布局、布局/字体、菜单、分支翻译、页面编排、侧栏开关/页脚、workspace；中断首轮与修复后82/82去重，不重复累计 | `regression-final.log`、`recheck-final.json`与`coverage-summary.json` |
| Chrome真实浏览器zoom200% | **12/12**；rich-navigation与page-composition各6项，双端三主题 | `zoom-rich-navigation-final.json`、`zoom-page-composition-final.json` |
| Firefox / WebKit精选专项 | **12/12**；每引擎6项，双端桌面首行、鼠标/键盘单次滚动及更新/RTL | `firefox-final.json`、`webkit-final.json` |
| 文档 / 差异 | 通过；10文件、642链接、101公开入口、1 skill；无空白错误 | `docs-final.log`、提交前差异检查 |
| Stitch实际截图视觉终审 | **4/4 Pass**；React浅色、原生深色、390px/200%文字及名称滚动末端截图 | `stitch-final-approval.txt/.png` |

相关回归首轮有7项失败，都是已过时的测试前提：窄屏Sheet仍期望384px而已交付合同为全宽、原生名称仍定位strong、桌面开关仍定位顶栏。改为公开名称部件与现行布局/焦点归属，并保留原几何容差、滚动、草稿及节点连续性断言；对应三个文件82/82复验通过，生产代码未因此再改。首轮被明确中断，原始逐项执行以log为准；后续收集报告另命名为`regression-collection.json`，不是执行结果。去重摘要明确列出日志与复验JSON的来源。

Stitch已核准全局324px范围、可读降级和动作折行，并对4张正式包合成截图给出视觉终审Pass。其视觉判断不替代动态交互实测、辅助技术或产品现场验收；真实Chrome缩放另核对视口、DPR、根字号未变、CSS zoom=1、pinch=1，未用CSS缩放冒充。

早期窄屏/200%文字候选真实出现名称0px：独立按钮挤占全部可用空间。由公共布局保留主项最小宽度并允许动作落到下一行修复，原名称可读性断言未放宽。一次候选浏览器在正式消费者复制完成前读到旧CSS，已等待同代消费者完成后重跑。新专项初跑30/32，余下两项仅在收拢过渡开始立即量到324px；改为等待最终60px几何后2/2通过，生产代码未因该测试再改。失败日志/trace保留并与最终复验分开。

本轮不修改xAgent/Argus或其他消费者、业务API、认证、后端；未跑真实移动OS/Wails、读屏器或全仓完整浏览器套件，没有registry发布。

## 导航侧栏内部收起/展开（2026-10-15）

规范升至0.12.0，默认主题376 tokens及默认变量CSS指纹不变。React AppShell/MenuLayout与原生createMenuLayout将桌面唯一开关放在侧栏内部顶部独立辅助行，展开时靠末端、60px紧凑栏居中；窄屏同一按钮节点移到顶栏打开既有drawer。继续使用既有collapsed/defaultCollapsed/onCollapsedChange、sidebarOpen/onSidebarOpenChange与名称接口，原生setCollapsed/update遵守相同受控合同。没有新增位置/私有DOM接口、第二个按钮或抽屉；默认位置变化须随正式包升级获得，公共types/exports保持兼容。

最终 package source generation 为 `cf3565e72fbd8c8bf5005383ff46ded8221020acfd49dc70437a2d3f868980c4`，public API SHA256仍为 `d7ecf90266c528676481a0e1ee1dccbfb51232999d4c20c4f7f99e22372988c8`。独立正式tarball消费者同时核对ESM/CSS/types，React/ReactDOM/Base UI单实例；完整CSS gzip 16767 bytes，在既有16768-byte预算内，本轮没有提高预算。

| 最终同代检查 | 执行结果 | 原始证据（`.artifacts/sidebar-control-final-generation/`） |
| --- | --- | --- |
| 构建 / tokens / types / unit | 通过；376 tokens、**512/512** 单测 | `build-final.log`、`tokens-final.log`、`typecheck-final.log`、`unit-final.log` |
| 独立正式消费者 / 体积 / peers | 通过；双端正式入口/类型/产物，公开API未扩张 | `consumer-final.log`及最终元数据 |
| Chromium 新导航专项 | **26/26**；24项双端主题/1280或390px/根字号16或32px矩阵，2项跨断点节点与焦点连续性 | `sidebar-control-final2-browser.json`、对应截图目录 |
| Chromium 相关回归 | **216/216**；头部、侧栏/页脚、导航富条目/翻译、workspace、页面编排和foundation | `related-regressions-final.json`、对应输出目录 |
| Chrome 真实浏览器zoom200% | **12/12**；rich-navigation与page-composition各6项，两端三主题 | `rich-navigation-zoom.json`、`page-composition-zoom.json` |
| Firefox / WebKit 响应式焦点 | **4/4**；Firefox/WebKit各2项同节点/aria/焦点与宿主输入连续性 | `firefox-responsive.json`、`webkit-responsive.json` |
| 文档 / skill / 差异 | 通过；639文档引用、100公开入口、1 skill；skill frontmatter有效，差异无空白错误 | `docs-final.log`、skill验证与提交前检查 |

上述是受影响范围的专项结果，不是全仓完整浏览器套件。根字号200%核对计算值；真实Chrome缩放另核对视口、DPR、未改根字号/CSS zoom/pinch的事实。按钮焦点环、Enter/Space、aria-expanded/controls、桌面/窄屏开关归属、长中文、同按钮/侧栏/草稿节点与宿主新焦点均按实际浏览器检查。主题system跟随已有owner；本轮不另建storage或主题状态。

早期候选的24/26与24/26揭示跨断点把有焦点按钮移入隐藏区域后丢失焦点，以及原生共享shell自己的media listener覆盖aria状态。修复跟踪该控件的真实焦点所有权，新焦点/指针意图结束所有权；原生在共享shell布局完成后按可取消的动画帧协调一次，不用固定等待或抢回宿主焦点，销毁释放监听和帧。旧报告保留，不计作最终通过。

第一次相关回归为215/216：React首次长菜单的选中行定位早于顶部开关行占据44px空间，初始当前项下沿701px而菜单可用下沿657px。不是footer实际重叠，也不是查询或菜单失效。将定位放在开关放置及侧栏测量之后，原断言不放宽；双端viewport长菜单先2/2通过，随后上述同代26/26及216/216重验。失败trace、截图和报告保留在 `related-regressions.json`/`related-regressions-output/`，修复后证据单独归档。

Stitch已对独立正式消费者的展开/收拢桌面实际截图给出位置、同轴、密度视觉通过，记录见 `.artifacts/sidebar-control-review/stitch-visual-approval.txt/.png`。这些截图在最后的选中项定位修复前生成，布局样式与默认位置未再变化；最终长菜单截图及几何以同代回归为准。视觉审查不替代键盘、屏幕阅读器或消费产品现场验收。

会话交流作为独立页面类型写入DESIGN，不套用管理列表的标题/筛选/表格。另以固定旧包1672222制作仅合成数据的xAgent布局评估稿，保留真实领域owner的映射：阅读列与输入对齐、工具/审批跟随回合、必要执行状态和追加指导队列保留、文件按需、草稿/流式/历史连续。16项主题/宽度/根字号矩阵及合成状态/回焦点检查保留在 `.artifacts/xagent-session-design-review/qa/`，不是当前包或xAgent生产验收，也未跑该原型的浏览器zoom。Stitch批准其为可实施设计基线；唯一剩余首行分支对齐为不阻断实施的公共增强请求，尚未新增API。未修改xAgent代码、业务API、认证、查询或后端，也未自动升级消费依赖。

本轮没有重跑全仓浏览器套件、SSR hydration、读屏器、真实移动OS/Wails或消费项目生产API；没有registry发布。接入skill已同步新开关归属及已交付日期时间入口，正式CSS仍要求公开`.xui`根作用域，不能依赖宿主reset偶然补齐。

## Stitch v2 页面编排（2026-10-15）

规范按新增兼容语义升至0.11.0，默认主题的376 tokens与完整默认CSS指纹不变。新增 FormGrid/FormActions、Fieldset stack、LoadingState inline、DataRegion flow；DataTable 有行刷新不重复播放块级进入动效，侧向 Sheet 在40rem及以下全宽。Fieldset inline、LoadingState block、DataRegion reserved 默认仍保留兼容，导航 drawer 继续独立宽度。

独立正式 ESM/CSS/types 双端示例由一个合成资源 owner 提供记录、状态、分页与写入确认；主表仅保留编号、名称、状态、待办事项，配置与说明在按需 Sheet 中。没有实际高级条件时不显示“更多筛选”，清空入口按有效结果/空结果互斥出现。样例不连接业务 API，也不声称消费项目已采用。

首次独立正式消费者测得完整 CSS 为109488原始字节/16680 gzip字节；原有16512-byte门禁超出168字节。为明确新增的公共布局样式，预算仅增加256字节至16768，Button/JS等其他预算不变，最终消费者仍强制执行。

最终正式包的 package source generation 为 `fd301b7ab803078718076d48a56e13777b2af39f1845f0995e48b9cf10d8c440`，public API SHA256 为 `d7ecf90266c528676481a0e1ee1dccbfb51232999d4c20c4f7f99e22372988c8`。三包正式 ESM/CSS/types 与独立 tarball 消费者指纹一致；React、ReactDOM 与 Base UI 单实例，原生消费者不引入 React。

| 最终同代检查 | 已执行结果 | 原始证据 |
| --- | --- | --- |
| 构建 / tokens / types / unit | 通过；376 tokens、512/512 单测 | `.artifacts/page-composition-final-generation/build.log`、`tokens-after-select-fix.log`、`typecheck-after-select-fix.log`、`unit-after-select-fix.log` |
| 独立正式消费者 / 体积 / 单实例 | 通过；完整 CSS gzip 16680 bytes，在16768-byte预算内；公开类型正反例及双端参考页通过 | 同目录 `consumer-after-select-fix.log`、`react-peer-tree-after-select-fix.log`、`react-peer-singleton-after-select-fix.log`、`tarball-sha256-after-select-fix.txt` |
| Chromium 最终专项 | **99/99**，无跳过、失败、flaky 或重试；新增页面编排40项，受影响选择/日期时间/弹层/筛选等59项 | 同目录 `browser-final.json`、`browser-final-artifacts/` |
| 文档 / 差异 | 文档635引用、100公开入口通过；最终提交前另核对差异 | 同目录 `docs-after-select-fix.log` 及提交前检查 |

新增40项包含24项主题/宽度/根字号矩阵、6项连续性/提交/净宽边界、2项常规页面、2项嵌套选择Escape/回焦点和6项真实Chrome缩放。Select修复前另有既有表格/筛选/弹层/反馈回归129/129，其代码代际不同，仅作为当时受影响范围的补充证据，不将分次执行相加为全仓套件。早期候选与日志保留在 `.artifacts/page-composition-browser-candidate.json`、`.artifacts/page-composition-validation/browser-regression.json`。

检查包含495/496px容器净宽切换、最多两列/跨满、真实控件顶部对齐、长中文、动作内容宽与焦点四边余量；根字号32px明确核对计算值，真实Chrome zoom200%另核对视口减半、DPR翻倍、根字号不变、CSS zoom=1与pinch=1。刷新检查原壳/行/搜索节点身份、横滚、选择、焦点、草稿、零Document导航与失败保旧/显式重试；创建失败保留草稿，同一saving owner阻止重复提交，较早读取不能覆盖确认写入。

Stitch 对桌面列表、桌面表单、390px长中文和原生200%文字的4张实际截图均给出视觉Pass，并确认移除无事实高级筛选、保留16px组间距及自然内容尺寸。复审记录和截图位于 `.artifacts/page-composition-review/`。它的静态视觉判断不替代键盘、请求/生命周期或完整WCAG AA实测；React图标关闭与原生文字关闭是示例端间呈现，不能描述为库随缩放自动切换。

首轮示例复验修正了 MenuLayout 导航Dialog上下文截取外层Sheet.Trigger的问题：采用公共受控open与显式finalFocus，创建和详情Root同级，Header使用自带关闭入口，避免重复。早期测试的并发consumer未完成404、DOM尚未建立时设置根字号、指针操作后直接要求focus-visible均已按实际生命周期/键盘方式校正；未用缩字号、关StrictMode或隐藏内容掩盖失败。

补充嵌套选择后首轮为39/40：React SimpleSelect 展开时，Escape 到达 document 上的 Base UI Dialog 处理早于共享 popover 的关闭监听，导致选择和 Sheet 同时关闭。这是实际公共组合缺陷。共享 bindSelectControl 已在自己的展开区域处理该次 Escape，阻止继续关闭外层；确认关闭才回选择入口，被取消则保留选项焦点，关闭状态不截取下一次 Escape。传播/取消关闭两项原生单测及双端正式消费者键盘用例验证该边界，修复未要求宿主拦截私有DOM。失败日志/trace保留于 `.artifacts/page-composition-final-generation/`，修复后证据单独归档。



Select修复后的首轮扩展专项为98/99，唯一失败是既有React DateTime测试在Base UI选项初始焦点就绪前立即按Home，导致方向键从23移动至00。trace及独立重复验证确认该路径不经过本次Escape处理。测试增加“23已聚焦→Home聚焦00→ArrowDown聚焦01”的实际就绪断言，未修改DateTime源码、未加固定等待、未放宽最终01:59/单次回调/回焦点要求。双端各5次共10/10通过后，同代完整99项再次执行全过；失败保留在 `browser-after-select-fix.json`，重复证据为 `.artifacts/date-time-focus-readiness.json`。

本轮没有执行全仓浏览器整套、Firefox/WebKit、读屏器或任何消费项目生产认证/真实API验收；没有新请求/缓存/分页owner、业务协议变更或registry发布。

## 完整浏览器套件复验（2026-10-15）

最终候选按仓库默认 Chromium 配置完整执行 **77 文件、1389/1389 项通过**，耗时 765.2 秒（12.8 分钟）。2 workers、0 retries，无过滤、跳过、flaky 或运行错误；不是分批或重复专项拼出的整轮结果。package source generation 为 `6c592e6cc54e020c35314d1accce844ccb2b3e531231a315f80834b0e1e62fbe`，example generation 为 `250f6b2d697271a4a4facde722992b368f93308f6b2b9351cfbc01ccc1a17897`；三包产物与正式 tarball consumer 同代际。环境与下方组合验收一致。

本轮修复共享 Dialog 迟到 close 重复恢复焦点的问题：确认关闭动作内只恢复一次，关闭返回后保留宿主新焦点，同时保留 Safari 原生回焦点、restoreFocus、重入与叠层边界。NumberInput 的后续 input 取消旧 reset 协调，双端新增同一任务内重置后立即输入的回归，保留新草稿及有效性，不提交或改写确认值。

Command 用例将原有空项循环断言放在纯键盘阶段，悬停验证后移开鼠标并从无高亮的新查询重新进入，继续核对选择、hover、失焦与键盘焦点，避免焦点滚动产生的 pointerleave 与方向键竞争；没有修改组件行为或减少原断言。文本输入用例移除重复的 Chromium 专属启动配置，沿用项目选择的真实引擎。

| 最终执行 | 已完成结果 | 原始证据 |
| --- | --- | --- |
| 构建 / tokens / types / unit / consumer | 通过；376 tokens、475/475 单测；公开 ESM/CSS/types、双端消费与既有体积预算通过 | `.artifacts/browser-full-race-build.log`、`-tokens.log`、`-typecheck.log`、`-unit.log`、`-consumer.log` |
| 完整 Chromium 套件 | 1389/1389，77 文件；原 Dialog、NumberInput、Command 失败及新增回归均在整轮通过 | `.artifacts/browser-full-final-6c.json`、同名日志、`-list.log`、`-output/` |
| Chromium Command 重复专项 | 双端各 20 次，共 40/40，无重试 | `.artifacts/browser-full-command-stable-repeat.json`、同名日志 |
| Chromium 数值 reset 重复专项 | 双端原重置及新增竞争用例各 10 次，共 40/40，无重试 | `.artifacts/browser-full-number-race-repeat.json`、同名日志 |
| Firefox / WebKit 数值与 Command 专项 | 共 12/12；使用各自真实引擎，无跳过、重试或 flaky | `.artifacts/browser-full-number-command-cross-final.json`、同名日志 |
| 文档链接 / 差异检查 | `node scripts/check-docs.mjs`、`git diff --check` 通过 | `.artifacts/browser-full-final-6c-docs.log`、`-diff-check.log` |

Dialog 修复后、数值输入修复前的候选 `cfe37756f06a04dc03bbf4721397c87da7095b08c007f6190be0c7be1a0b76e4`，另完成 Firefox/WebKit 焦点与组合 20/20、关闭路径 32/32 专项；覆盖宿主路由焦点、Key 写入中关闭、secret 清理、日志读取中关闭、窄屏键盘与迟到隔离。证据为 `.artifacts/browser-full-fixed-closeout-cross.json`、`.artifacts/browser-full-fixed-close-flows-cross.json` 及同名日志。这些是受影响路径补充验证，不是 Firefox/WebKit 完整套件结论。

前两轮完整执行均保留失败证据：基线 `b4b9f3631654d0c8ac22a26c01d5ab8d452e89f1` 为 1386/1387（810.3 秒），暴露 Dialog 迟到关闭覆盖宿主焦点；Dialog 修复候选为 1385/1387（777.0 秒），原失败已通过，新增发现数值 reset 竞争及 Command 混合输入测试竞争。分别见 `.artifacts/browser-full-b4b9.json`、`.artifacts/browser-full-fixed-final.json` 与同名日志、输出目录；不把它们计作完整通过。

## 组合组件与公共页面逐项收口（2026-10-14）

承接下方基础层验收，本轮核对仓库已经公开的组合、通用页面与双端参考消费者。颜色、字体、密度、发丝线、焦点和状态继续消费同一 DESIGN 主题；产品私有组合及实际后端不属于本轮范围。

| 组件族 / 页面 | 本轮核对的设计与交互合同 | 浏览器证据入口 |
| --- | --- | --- |
| AppHeader / HeaderBrand / 主题与语言工具 | 品牌与任务层级、紧凑工具间距、同一控件尺寸、窄屏换行、主题浮层和焦点 | `header-compact`、`header-controls`、`header-popup-brand` |
| AppShell / MenuLayout / NavigationMenu / SidebarFooter | 选中与焦点独立、折叠菜单、窄屏抽屉、富导航、页脚和滚动归属 | `menu-layout`、`nav-contract`、`rich-navigation`、`sidebar-footer` |
| Workspace / PageHeader / 页面插槽 | document/workspace 显式边界、自然页头和工具栏、正文占余高、空插槽不占位 | `workspace-layout`、`workspace-composition-contract`、`layout-typography` |
| SearchToolbar / GroupedCombobox | 主查询先行、附加筛选收起、长值与窄屏、IME/草稿与真实键盘选择 | `search-toolbar`、`grouped-search` |
| MetricCard | 单层 Surface、被动名称/值语义、mono/tabular 数字、宽标记换行而不挤成竖排、宿主更新 | `metric-card`、`composition-closeout` |
| DataTable / 内置筛选与分页 | 默认铺满、显式列宽作下限、表内横滚、单框三轨、页脚自然高、长/空/少量数据、受控 offset/cursor、刷新保留焦点 | `data-table`、`data-table-widths`、`data-table-layout`、`data-table-caption-shape`、`data-table-feedback`、`data-table-cursor`、`data-table-focus` |
| AuthPage / LoginPage / AdminSetupPage | 单列紧凑表单、密码强度条、提交时错误、空反馈无占位、busy 禁重复、无登录取消、明确导航和密码清理 | `auth-page`、`auth-visual-system`、`auth-feedback-readable`、`login`、`login-layout`、`login-visual`、`login-extensions`、`login-navigation`、`auth-bearer`、`admin-setup` |
| ApiKeyManager | 名称与真实状态前置、刷新/创建归页头、轻量行操作、表内完整元数据、一次性 secret、局部错误、显式复制/写入核验 | `api-key`、`api-key-v2`、`composition-closeout`、`dialog-readability` |
| BusinessLogExplorer | 摘要/结果前置、双端同一筛选 Disclosure、操作人/动作/时间不逐字折行、快照分页、按需详情 | `business-log`、`composition-closeout` |
| StructuredLogExplorer | 摘要/等级前置、累计与命中数区分、精确时间/计数、分组与观察切换、详情权限和保留期事实 | `structured-log`、`composition-closeout` |
| 表单 / 列表 / 详情参考页与局部反馈 | 公共组件构成任务顺序、准确可访问名称、错误完整可读、显式重试与迟到隔离、无闲置反馈空白 | `foundation`、`error-layout`、`http`、`capabilities`、`dom-id` |
| 上述组合中的 Dialog / Sheet | 窄屏/长文/根字号 200%、关闭后回到所属动作、浏览器原生回焦点与宿主新焦点分离 | `responsive-overlays`、`focus-boundaries`、`peer-contract`、`composition-closeout` |

本轮修正三类记录页的重复可见表题、空反馈占位、行操作权重和窄屏逐字折行；记录主列显式消费派生变量，其他元数据在表内横滚，详情标识符和时间使用技术文字角色。MetricCard 宽标记优先换行。原生详情先关闭再隐藏内容；共享 Dialog 识别 Safari 原生恢复到打开前容器的行为，继续尊重新的宿主焦点、恢复策略和叠层边界，并将 macOS Option+Tab 纳入同一模态焦点循环。没有增加查询、认证或写入 owner。规范为 0.10.0、376 tokens，新增变量只从既有字段尺度派生。

最终 package source generation 为 `25b3c7ca1b2828005d4e94cd893e486d67aa4d42bf68e85c5ee5a056a71da727`，example generation 为 `250f6b2d697271a4a4facde722992b368f93308f6b2b9351cfbc01ccc1a17897`。三包产物与正式 tarball consumer 使用同代际；环境沿用下方基础验收的 macOS、Node、三引擎及字体版本。

| 已执行门禁 | 结果与代际 | 原始证据 |
| --- | --- | --- |
| 最终构建 / tokens / types / 正式 consumer | 通过；376 tokens、231 文件、2191 声明；公开 ESM/CSS/types、双端 lazy worker 与布局门禁通过；critical CSS gzip 为 16384 bytes，未提高原 16384-byte 预算 | `.artifacts/composition-build-closeout-pass.log`、`.artifacts/composition-release-gates.log`、`.artifacts/performance-baseline.json` |
| 最终完整单测 | 473/473 通过，含原生回焦点、保留新宿主焦点、禁用恢复策略与 Option+Tab 双向边界四个新增回归 | `.artifacts/composition-release-gates.log` |
| Chromium 组合与页面主运行 | 首轮候选 `51f7c5b89a30f91968db56bcfaca77ec3f35c12459b406cca6d5f2af065b4056`，39 文件 879/881 通过；两项失败为改列序后旧最近使用列索引 | `.artifacts/composition-chromium-main.json`、同名日志 |
| Chromium 表格与记录页复验 | 后续候选 `585be26c3a81e2b5dbcab5a6245d43068e6afe05b933f5a9807b06a37bda3097`，9 文件 172/172 通过；包括两项改用具名表头定位后的原断言，以及三轨/分页回归 | `.artifacts/composition-chromium-affected-final.json`、同名日志 |
| 最终 Chromium 记录页与指标卡 | API Key v1/v2、两类日志与 MetricCard，5 文件 62/62 通过 | `.artifacts/composition-release-business-chromium.json`、同名日志 |
| 最终 Chromium 共享交互与 Dialog | 33/33 通过；foundation 浮层键盘交互、peer finalFocus、响应式 Dialog/Confirm/Sheet、长警告与原生 Dialog 焦点/滚动边界 | `.artifacts/composition-release-dialog-chromium.json`、同名日志与用例清单 |
| 最终 Firefox / WebKit 功能回归 | 各 68/68 通过，无跳过或 flaky；API Key v1/v2、两类日志、MetricCard、长警告，覆盖真实键盘、提交/取消、读取失败与迟到清理 | `.artifacts/composition-release-functional-cross.json`、同名日志 |
| 最终关键设计专项 | Chromium 8/8、Firefox 8/8、WebKit 8/8；React/原生、light/dark/system、1280/390px、根字号 200% 关闭回焦点、元数据单行与 MetricCard 宽标记 | `.artifacts/composition-release-closeout-chromium.json`、`.artifacts/composition-release-closeout-cross.json`、对应截图目录 |
| 最终 watch / cold-start | 各 1/1 通过；watch 约 148 秒，隔离副本检查真实重建/失败恢复与 Vite 冷启动 | `.artifacts/composition-release-watch.log`、`.artifacts/composition-release-cold-start.log` |

已查看最终三类记录页的深浅主题和窄屏截图，以及填充完成的 DataTable、紧凑认证页、长标记 MetricCard 和日志详情构图。首轮 WebKit 原生回焦点、Option+Tab 越界及 CSS 超预算候选的失败日志保留，均不计作通过。跨引擎遍历采用平台真实按键，WebKit 用 Option+Tab；仍断言准确控件顺序、循环与回焦点，不直接设置后续焦点或接受窗口外焦点。上表分次运行不能相加为完整套件全绿；未受影响的族使用主运行证据，最终受影响范围单独复验。

## 基础层逐项收口（2026-10-14）

基础层这一轮只处理基础主题、控件与交互原语；DataTable、业务导航、认证、API Key 和其他页面组合不在当时改造范围。它们所在示例仅作为公共基础 CSS 的真实消费载体，不能据此宣布上层组合或产品页面完成。下面以组件族列出逐项核对范围；不适用的交互状态不添加到被动组件上。

| 基础组件 | 逐项核对的合同与证据入口 |
| --- | --- |
| 主题、文字尺度与基础布局 | 默认深色、light/dark/system、语义覆盖、rem/独立文字比例、根字号 200%、长中文；`token-scaling`、`input-typography-contract`、`layout-typography`、`ui` |
| Button / IconButton / 链接变体 | xs/sm/default/lg、六种变体、鼠标/键盘按压、busy 与 disabled 分离、disabled+selected、焦点、品牌覆盖；`button-size-contract`、`button-state-contract`、`button-brand-inheritance` |
| Field / Fieldset / Input / Textarea | label/help/error 关联、错误+焦点、禁用错误边界、只读选择与复制、真实表单值与输入事件；`input-foundation-contract`、`foundation-contract` |
| Checkbox / Radio / Switch / 成组选项 | 真实 checked/mixed、受控变化、只读、禁用、错误+焦点、各尺寸、forced-colors；`choice-state-contract`、`choice-group`、`native-controls-audit` |
| InputGroup / SearchInput / NumberInput / 密码输入 | 单边框、外高对齐、前后缀/动作、草稿/重置/IME、密码显隐和清理、本地强度；`foundation-closeout`、`text-inputs`、`password-fields`、`password-strength` |
| SimpleSelect / Select / Combobox / Command 基础选择 | 公开封装与平台边界、选中/活动项分离、错误/空结果、禁用、键盘选择、碰撞与回焦点；`select-form`、`composition-select`、`selection-state-contract`、`widgets` |
| ToggleGroup | 独立紧凑高度、主题覆盖、选中+hover/焦点、禁用、键盘与 forced-colors 选中识别；`foundation-closeout`、`design-state-regressions`、`widgets` |
| Calendar | 日期/范围、locale、方向键与月份边界、禁用日期只读不可选、选中+hover、forced-colors；`widgets`、`foundation-closeout` |
| Tabs | 选中+hover、禁用跳过、方向/边界、取消回调、关联 panel；`peer-contract`、`ui` |
| Accordion / Disclosure | 单开/多开/受控、禁用、键盘、展开指示、隐藏后焦点不可进入、卸载清理；`widgets`、`foundation-contract` |
| Typography / Separator | 语义级别与视觉角色分离、技术文本 mono/tabular、长文、独立分隔线变量、装饰语义；`display-foundation-contract`、`separator-design-contract`、`foundation-closeout` |
| Surface / Section / Container / Stack / Grid / Toolbar | 单层表面、无装饰阴影、容器换行与字段对齐、文字放大、焦点绘制；`display-foundation-contract`、`layout-typography`、`focus-boundaries` |
| Badge / Tag / Copyable | 被动状态无额外交互、语义色、长值可读、移除意图与后续焦点、复制失败/串行/迟到隔离；`feedback-foundation-contract`、`media-foundation-contract`、`display`、`foundation-closeout` |
| Avatar / Image | 替代文字、加载/失败/回退、固定资源框、迟到资源隔离、显式重试、被动语义；`media-foundation-contract`、`display`、`widgets` |
| Alert / LoadingState / EmptyState / ErrorState | 真状态与局部反馈、必要错误全文可读、恢复入口、无重复警报；`feedback-foundation-contract`、`native-controls-audit` |
| Skeleton / Spinner / Progress | pending 与确定进度区分、真实绘制、accessible name、reduced-motion/forced-colors；`feedback-foundation-contract` |
| ScrollArea | 独立滚动、首/中/末控制项 Tab 与 Shift+Tab、四边焦点、草稿保留、窄屏与根字号 200%；`foundation-closeout`、`focus-boundaries` |
| Table 原语 / SortButton / ExpandButton / TableActions | 表头/正文独立文字角色、不透明行/固定列、禁用不出现按压反馈、操作布局；`table-design-contract`、`table-actions`、`widgets`、`foundation-closeout` |
| NavItem / Breadcrumbs / Pagination 原语 | 原生链接/表单语义、选中与焦点独立、禁用、键盘边界；`ui`、`peer-contract`、`foundation-contract` |
| Menu / ContextMenu | overlay/边界/圆角、checkbox/radio 状态、禁用、方向键/子菜单、鼠标打开后首次键盘焦点、pointer/blur/卸载清理、Esc/回焦点；`menu-design-contract`、`context-menu-keyboard`、`context-submenu` |
| Dialog / AlertDialog / Sheet | 宽度/边距、长标题/正文、正常 body 滚动和极端高度整体滚动、限制/恢复焦点、关闭/取消、真实 touch；`dialog-readability`、`responsive-overlays`、`focus-boundaries`、`peer-contract` |
| Popover / Tooltip / Toast | 非模态边界、锚点/碰撞、键盘帮助、关联描述、外点/Esc/关闭、portal 主题；`foundation` 的浮层专项、`ui`、`widgets` |

本轮修正 ToggleGroup 误用普通按钮高度、InputGroup 重复计算外框高度、Calendar 与表格排序按钮的禁用按压反馈；补充 Calendar/Toggle 的强制颜色选中标记、长 Badge 换行和技术文本等宽数字声明。Firefox 的菜单从鼠标转到键盘时可能保持 `:focus-visible=false`，现由共享绑定只投影真实键盘焦点，React/原生自动接入，不移动焦点或改变选择。集中规范更新为 0.9.0，新增三个派生变量，共 375 个 tokens；两个原始设计来源及历史合同指纹保持原样。

最终候选的 package source generation 为 `c405716680c18d9a33ac0f9e7dbc8a3cc15bf86c644bd0229fecba8220177069`，开发示例 generation 为 `9d7948bc82bbe32e9b5d7a2dd4cb5fb5d48f91291addc2f4589b3f5fe15dacf0`。三个包的 `dist/build.json` 指纹一致，正式 consumer 随后从本代际 tarball 生成浏览器消费 fixture。环境为 macOS Darwin 25.5.0 / arm64、Node 26.7.0；Chromium 156.0.8078.4、Firefox 157.0、WebKit 27.2。实际中文字体为 PingFangSC-Medium（label）和 PingFangSC-Semibold（heading）。环境快照为 `.artifacts/foundation-environment.json`。

| 已执行门禁 | 结果与代际 | 原始证据 |
| --- | --- | --- |
| dev-build / tokens / typecheck | 最终候选通过，375 tokens；231 文件、2185 声明与来源检查 | `.artifacts/foundation-final-dev-build.log`、`.artifacts/foundation-closeout-validation.log` |
| 单测 / 正式 consumer | 最终候选 469/469 单测通过；React/原生 tarball、公开 ESM/CSS/types、peer 与 gzip 门禁通过 | `.artifacts/foundation-closeout-validation.log` |
| 文档 / diff | 10 文件、576 引用、97 公开入口、1 skill 与 diff 检查通过 | 同上 |
| Chromium 基础主运行 | 菜单修复前的候选 `7baeaf8b7af4b0567046295e29786aca8b534c4020c21ec42448c692b6ac95d9`，35 文件 510/510 通过，无跳过或 flaky | `.artifacts/foundation-chromium.json`、同名日志与输出目录 |
| Chromium 测试编排复验 | 同一基础实现：ScrollArea/Display 24/24、Feedback 18/18 通过 | `.artifacts/foundation-chromium-fixture-final.json`、`.artifacts/foundation-chromium-feedback-final.json` |
| Chromium 最终菜单复验 | 最终候选 23/23 通过，包含 Menu 主题、首次 Home、pointer/blur 清理、ContextMenu 受控/取消/嵌套/子菜单 | `.artifacts/foundation-menu-chromium-pass.json` |
| Firefox / WebKit 菜单复验 | 最终候选各 18/18 通过 | `.artifacts/foundation-menu-cross-pass.json` |
| Chromium 浮层与叠层复验 | 最终候选 6/6 通过：Popover/Tooltip/Toast、Sheet/AlertDialog 叠层和 ContextMenu | `.artifacts/foundation-floating-layers-final.json` |
| Firefox 基础专项 | 最终候选 21 文件 240/240 通过，无跳过或 flaky；覆盖按钮、选项、输入、显示、反馈、媒体、选择、菜单、密码、表格原语及 widgets | `.artifacts/foundation-firefox-complete.json` |
| WebKit 几何、滚动与菜单专项 | 最终候选 23/23 通过：新增基础收口 18 项及 ContextMenu 键盘/子菜单 5 项 | `.artifacts/foundation-webkit-complete.json` |
| watch / cold-start | 最终候选各 1/1 通过，watch 128.2 秒；隔离副本验证真实重建/失败恢复与 Vite 冷启动 | `.artifacts/foundation-watch-accepted.log`、`.artifacts/foundation-cold-start-accepted.log` |

新增 `foundation-closeout` 在 React/原生、light/dark/system 下检查默认与覆盖后的控件外高、1280/390px 和根字号 200%、禁用鼠标命中、真实键盘选择、强制颜色以及独立滚动区域首/中/末控件四边焦点。已查看深浅主题和窄屏放大截图；未以缩小字号或放宽裁切断言解决问题。WebKit 原生完整控件遍历使用平台 Option+Tab；焦点滚动等待实际渲染帧后再测量。

跨浏览器复验同时修正两处测试编排：Display 从确定的前置控件开始真实 Tab，避免依赖浏览器末尾回绕；Progress 的历史空白截图按其自身系统底色判定，当前截图仍与当前引擎的 Canvas 比较，保留真实边界、填充、静止和空白反例断言。菜单修复前的 Firefox 失败运行，以及 consumer fixture 尚未生成时的 404/中断运行均保留日志，不计作通过。上表分次结果不能相加为完整浏览器套件总数；历史认证、DataTable 与业务组合不由本轮推断完成。

## 先前代码验证基线

以下既有代码验证对应 package source generation `f56796bb2c862c8afa285a1713d1c8a476422b6040c8b1bde52bd05eb70051eb`，example generation `4dc78683af33237bdf7a87e8f7e23748ec4da8a960d16c491ad2b0b335600cf7`，日期为 2026-10-14。后续文档整理未修改组件实现与受控主题 CSS，未因文档变更重跑 build 或完整功能测试；上述 generation 仅标识下方受测代码/产物，不能作为当前文档修改后的新构建指纹。

| 门禁 | 已执行结果 | 证据范围 |
| --- | --- | --- |
| dev-build | 通过 | 正式包与开发示例构建，包含类型检查 |
| check:tokens | 通过，372 tokens | 当时 283 文件、2176 声明；规范/生成 CSS、依赖与来源检查 |
| typecheck | 通过 | 当时根类型检查 |
| unit | 468/468 通过 | 当时完整单元套件 |
| 正式 consumer | 通过 | React/原生独立 tarball、公开 ESM/CSS/types、peer 与既有体积门禁 |
| watch | 1/1 通过，145.4 秒 | 同一代际的真实重建、错误与恢复 |
| cold-start | 1/1 通过 | 当时合成 Vite 消费者的冷启动 |

先前纯文档/引用治理检查文件与锚点、公开入口、来源元数据及相关静态规则，实际命令结果在交付中说明。未触及组件实现、样式、tokens、导出、行为或包配置。体积预算由 [scripts/consumers.mjs](../scripts/consumers.mjs) 内常量执行，运行快照写入 `.artifacts/performance-baseline.json`；本页不维护另一份预算或把合成消费者的包体门禁等同产品 LCP/INP。

## 先前 Chromium 浏览器结果

| 运行 | 实际结果 | 原始证据 |
| --- | --- | --- |
| 完整 Chromium 主运行 | 1347/1355 通过，8 失败，约 14.9 分钟 | `.artifacts/browser-final-4dc/` 的报告、截图与 trace |
| 首轮相关 targeted 复验 | 17/19 通过，两个 native locator 零匹配 | `.artifacts/browser-targeted-final-4dc/` |
| locator 修订后复验 | React/native token-scaling、widgets 4/4 通过 | `.artifacts/browser-locator-final-4dc/` |
| 最终 Precision 截图 | 8/8 通过，16 PNG + 16 JSON | `.artifacts/precision-theme-evidence/screenshots/` |

最终截图覆盖 Precision DataTable 与基础 `/react/` 页的 light/dark，以及 AdminSetup 两端桌面和 390px、根字号 200% 的末字段/主动作焦点。主运行还通过 DataTable width 44 项、caption/frame/footer 36 项、feedback 10 项和 workspace composition 4 项；这些只证明列出的合成合同，不代表所有组件状态和产品布局已逐条验收。

八个原始失败标题各有对应 targeted 通过证据，最后测试编排修订后没有再跑完整 1355 项。不得把分次复验合并改写为“1355/1355 完整套件全绿”。另一次误启动的 full suite 约 25 秒后以 SIGINT 中止，不计结果。

## 先前失败复验与限制

- Bearer 预算用例在主运行中超时；示例预算为 1000ms，库默认 15 秒，隔离重跑 1/1 通过、约 840ms。根因未证实，不能声称代码已修复某个确定超时根因。
- React dark 的真实 200% 用例已完成所有断言，在 persistent context.close 时超时；隔离用例约 5.2 秒通过，相关真实 200% 矩阵 12/12 通过。关闭超时根因未证实。
- React/native 两个短窗口 touch fixture 的物理 Chrome 窗口为 500×320，实际输入 surface 高 233px，gesture y=256 超出输入面；独立纯 overflow 对照同样失败。fixture 仅用 Browser.setWindowBounds 将物理窗口调整为 800×900，CSS viewport 仍为 390×320；双端真实 touch 滚动、Save 点击、DOM identity/focus 检查 2/2 通过，未改生产 CSS。
- token-scaling 与 widgets 各自 React/native 共四个失败源于新增 stacked InputGroup 后旧全局 locator 歧义。首轮修订仍有两个 native 零匹配；随后按具名 search textbox 所属 InputGroup 定位，4/4 通过。保留原交互、样式与几何断言，未通过放宽合同使测试变绿。

## 认证页验收

以下是登录、AuthPage 与 AdminSetupPage 的持续验收合同；本轮执行结果见首节的组合组件验收。尺寸和具体 token 以 [DESIGN 的认证布局](DESIGN.md#公共登录页布局与主题) 为准，接口和生命周期见 [登录与会话](PUBLIC_API.md#认证会话)，新密码规则见 [密码输入](COMPONENTS.md#密码输入)。

| 范围 | 需要的可观察证据 |
| --- | --- |
| 居中单列与品牌层级 | React/native、light/dark/system、宽屏与 390/320px；card 自然高，fullscreen 保留同一窄列；品牌、任务标题、说明、字段、唯一主动作和局部反馈顺序清楚，无第二品牌面板 |
| 字段与主动作 | 常显 label、准确关联、统一文字/控件 token；字段和主动作对齐，末字段至主动作之间无空反馈或隐藏按钮占位 |
| 空与长反馈 | 空/hidden feedback、feedbackActions 不占位；消息位于主动作后自然增高，错误首尾及 unknown 关键后果完整可读，不固定轨道、裁切或把必要摘要藏进详情 |
| 状态稳定 | checking/idle/busy/error 不重挂字段、按钮与核心布局节点，不清普通输入；字段与主动作尺寸、相对顺序保持，卡片可因真实消息增长重新居中；密码按生命周期及时清理 |
| 直接登录 | 一次明确 POST，无恢复预请求/持久门禁；busy 禁重复且无取消入口，扩展等待也不自动生成取消；未知结果普通 refresh/session 核验一次，未确认结束 busy 可手动再试，不重发写入 |
| 导航 | 确认 authenticated 且所属等待结算后一次进入宿主目标；StrictMode、重复通知与同 ID 新对象不重复导航；失败仅局部重试打开目标，不重做认证；卸载/pagehide 拒绝迟到结果 |
| 短视口与长内容 | 文档自然滚动到每个字段、动作和错误；超长主按钮保留完整名称与内部滚动；不以固定表单高度或缩字号处理 |
| 焦点与输入 | 实际 Tab/Enter/Space、SSO 与辅助动作顺序、无隐藏 Tab 停靠、四边 focus 像素；根字号 200% 与真实浏览器 Page zoom=200% 分别验证，记录实际中文字体 |
| 初始化 | 三字段 setup 复用同一布局，动态更新保持 DOM、值、事件和焦点；unknown 锁写、必要后果全文、完成只提示去登录，零自动认证请求 |
| 正式消费 | 仅使用公开 exports/CSS/types 与同代际产物，检查 owner、取消/迟到、卸载清理；按实现影响执行适用构建、单测、consumer 与浏览器门禁 |

可执行入口包括 [login-visual](../tests/browser/login-visual.spec.mjs)、[auth-page](../tests/browser/auth-page.spec.mjs)、[login-navigation](../tests/browser/login-navigation.spec.mjs)、[auth-feedback-readable](../tests/browser/auth-feedback-readable.spec.mjs) 与 [admin-setup](../tests/browser/admin-setup.spec.mjs)。截图和实测 JSON 应通过 testInfo.outputPath 保存并附加，实际查看构图、长文、裁切与焦点；computed style 或用例数量不能代替视觉审查。

## 验收范围与未完成项

基础层、组合与通用页面的逐项范围及分次执行结果见本页对应章节；验收结论只覆盖表中列出的设计和交互合同。不能由生成器通过推断每个 token 的实际绘制正确，也不能由公共组件或合成页面的绿色结果宣布其余产品页面完成。ThemeController 只公开 light/dark/system，没有已发布的 styleId/profile 注册表或风格切换 API。

跨引擎结果仅覆盖对应章节明确列出的专项，不代表三引擎运行了相同的全部用例。真实 OS 输入法、读屏器、自动填充/密码管理器、移动键盘及系统文件/日期/颜色窗口仍未实测。真实 BFCache 命中、所有 OS 缩放、实际 Wails/Electron/embed 窗口与 bridge IO 也未由合成生命周期或浏览器 fixture 证明。

合成 fetch/数据和共享 wire fixture 不证明真实后端事务、数据库 COUNT、Cookie/CSRF/权限/tenant/脱敏、真实产品页面、生产性能、发布或部署通过。外部产品的结果不能替代本仓库验收。后续实现变更须核对新的 source/example generation，按受影响合同补证；若需要完整套件结论，应独立执行完整浏览器套件并报告真实结果。

## 2026-10-15 公共交互扩展验收

本轮从已验收的 7f7da180e4b29f872b0c79c6f989fb6edbe3d9f2 核对，实施前 main 为 17f202d，相关包实现无差异。仅修改 xui。所有新增消费者均通过独立 tarball 安装正式 ESM/CSS/types，原生不引入 React；不使用源码 alias 或私有 CSS。下列结果是库级正式消费者验收，不代表 xAgent 已升级或完成产品联调。

| 能力 | 最终通过证据 | 范围 |
| --- | --- | --- |
| Calendar 受控月份 | model 16/16、calendar-month 与既有 widgets Calendar 浏览器 19/19；Chrome 真正 200% 缩放 6/6 | single/range、绝对定位、受控接受/拒绝、跨年/闰年、disabled、locale、焦点、浅/深/system、1280/390px、200% 根字号；真实缩放使用 Chrome 设置并校验 DPR×2、视口减半、根字号不变、CSS zoom=1/pinch=1 |
| Menu / ContextMenu danger | 菜单相关 unit 18/18、正式消费者浏览器 53/53、Chrome 真正200%缩放 6/6 | 普通/hover/pressed/keyboard focus/disabled；浅/深/system及系统实时切换、长中文、1280/390px、200%文字、弹层滚动、禁用Enter/Space不执行、关闭与回焦点 |
| DataTable rowEvents | 相关 unit 37/37、正式消费者浏览器 122/122、Chrome 真正200%缩放 6/6 | 双击一次、当前记录/稳定键/索引、排序/更新/cursor、cell控件隔离、busy/disabled、回收监听、空表/刷新保行、selected/expanded、长中文、浅/深/system、1280/390px、200%文字、横滚/sticky及键盘等价动作 |

构建、typecheck、check:tokens、check-docs 与 test:consumer 均通过。原生示例第一轮因 select 绑定转移 id 后误读 trigger、system 断言误认 data-theme 的失败已修正，最终复验通过；失败不计作通过。浏览器 JSON 保存于 .artifacts/calendar-month-browser-final.json 和 .artifacts/calendar-month-zoom-final.json。月份 API 未传时兼容原非受控行为，日期语义保持 ISO 公历与 UTC 字段。

本轮浏览器为真实 Chromium；其他浏览器、读屏器及宿主产品现场未由这些结果推断通过。

菜单证据保存于 .artifacts/menu-danger-browser-final.json 与 menu-danger-zoom-final.json，实际查看浅色桌面及深色390px截图。首轮新测试错误地要求Base UI跳过禁用项和ContextMenu首次ArrowDown直达第二项，已按peer真实合同改为准确Home/Arrow导航和零执行断言；53/53为修正后的复验。正式消费者初始CSS包含critical与floating，原16384 gzip字节已满，完整危险状态增加56字节至16440；该项上限显式调整为16512，Button/JS等其余预算不变，所有预算仍强制验证。

DataTable证据保存于 .artifacts/row-events-browser-final.json 与 row-events-zoom-final.json，实际查看深色390px和表头键盘焦点截图。122项包含新增行事件与既有cursor/layout/focus/widths回归；未传rowEvents保持原行为，CellContext原字段兼容，新增回调不接管请求或分页事实。

日期时间选择新增 DateTimePicker/createDateTimePicker/createDateTimeModel 与严格无时区分钟值；模型及关联Calendar回归28/28，浏览器21/21（完整20/21后仅补两端键盘2/2，保留原始报告并逐case合并），Calendar-month/widgets回归19/19、composition-select12/12，真实Chrome200%缩放6/6。正式构建/types/独立tarball消费者及预算通过，原生无React，公开入口100个。双端浅/深/system、1280/390px、长中文、200%文字、弹层滚动、受控接受/拒绝、清空、必填/宿主错误关联、readOnly/disabled、分钟选择、键盘、取消/Escape回焦点、表单reset及新编辑优先、原生update/destroy均有浏览器证据。React使用同peer公开Select及回调仲裁内层Escape；原生使用bindSelectControl/controller，无内部DOM依赖。UTC仅作为可省略today的日期浏览参考，value/callback不转换业务时区。

DateTime证据：.artifacts/date-time-browser-aggregated-final.json（及其原始full/keyboard报告）、date-time-calendar-regression-browser-final.json、date-time-composition-select-browser-final.json、date-time-zoom-final.json。实际查看两端深色390px/200%文字截图。首轮发现的内层Escape、错误反馈推走reset点击及示例长JSON溢出均已修复；桌面长内容也允许有界滚动。测试不直接使用React跟踪过的value setter伪装输入，按原生setter与真实事件复现reset后新编辑；Base UI先打开再Home/End定位与原生直接Home/End的差异如实记录。其他浏览器、读屏器及Argus/xQuant/xAgent实际产品未跑，本轮未修改消费项目。

主题sessionStorage迁移最终门禁：build/typecheck/check:tokens/check-docs及独立tarball消费者通过，完整unit501/501。浏览器theme-session6/6、header-controls18/18、foundation16/16、ui18/18、DateTime完整21/21，DateTime真实Chrome200%zoom6/6，总85项通过。该轮完整21项复验替代前述DateTime聚合报告作为最新主题产物证据。主题专用seed/assert迁移到sessionStorage；认证/凭据storage防泄露检查保留。首屏init与应用复用同一owner，同标签刷新、独立无opener标签、system实时变化、自定义key、受控/persistfalse零storage访问、storage拒绝及旧localStorage不读取均验证。旧localStorage值不自动迁移或覆盖，主题偏好生命周期按浏览器页会话管理，不主动跨标签同步。

最新证据位于.artifacts/theme-session-{browser,header-controls-browser,foundation-browser,ui-browser,date-time-browser,date-time-zoom}-final.json与对应日志；完整单测theme-session-unit-final.log。独立React安装的npm ls仅一个React19.2.8/ReactDOM19.2.8/BaseUI1.7.0，各模块从consumer与已安装xui-react解析到同一绝对路径；证据theme-session-react-peer-tree-final.log与theme-session-react-peer-singleton-final.log。正式CSS预算保持当前16512-byte gate，实际16440bytes（危险状态增加56bytes的有限调整见上文）；未再扩大预算。新的sessionStorage生命周期是本轮明确兼容性变化，受控接口/显式memory-only及CSS值保持。未跑其他浏览器、读屏器和任何消费项目实际集成，不声称这些通过。

2026-10-15 接入自查标准澄清（规范0.10.2）：DESIGN给出高信噪比列表/表单/详情/多阶段任务页面组合，统一表单分组/列宽/跨列/动作与草稿规则，明确首次加载、同范围刷新、范围切换、失败、稳定身份与生命周期；ADOPTION列出实现基础检查及所需代码/Network/挂载/焦点等证据，adopt-xui按引用执行。截图审阅可确认大框小控件、混排、空表与常驻技术说明等问题，不能证明实际请求链路或组件来源。文档链接、skill frontmatter与公开100入口检查通过；contract5/5核对376 tokens、CSS指纹及历史协议边界，diff检查通过。本次只修改规范、元数据与对应版本断言，没有修改运行时代码或消费项目；未重跑浏览器、完整单测或重新打包，之前0220435固定代码产物保持原样，不将这些规范声明冒充产品页面整改通过。

## 2026-10-15 NavigationMenu 分支名称浏览器验收

`NavigationMenuOptions` 新增 `expandBranchLabel` 与 `collapseBranchLabel`，供 React 与原生公开组合按当前 item/确认展开状态提供 accessible name；未提供时保留 `Expand …` / `Collapse …` 默认值。双端 rich-navigation 示例通过独立安装消费者构建，`window.navigationLabelsDemo.update` 仅为示例验收桥；`projectItems` 只替换示例项目数据以验证真实菜单的 disabled 继承，不是产品 API。

| 门禁 | 最终结果 | 范围与证据 |
| --- | --- | --- |
| build / 类型 / token / unit | build generation `118f347dfeb0`；typecheck、check:tokens 通过；504/504 unit | `.artifacts/navigation-labels-validation/build.log`、`typecheck-final.log`、`check-tokens.log`、`test-unit.log` |
| 正式 consumer | React 与 native 独立 tarball 安装、公开 exports/types/CSS 与 gzip 门禁通过；native 无 React 导入 | `.artifacts/navigation-labels-validation/test-consumer-final.log`；React peer tree 显示 React 19.2.8、ReactDOM 19.2.8、Base UI 1.7.0 各单实例，app 与 xui 的 resolve 路径一致，见 `react-peer-tree.log` / `react-peer-singleton.log`；仅从已打包 xui 入口构建，不用源码 alias |
| 导航浏览器 | 40/40 通过：新增双端动态默认/中英文标签、DOM identity/aria-controls/focus、受控展开外部接受/拒绝、Enter/Space 单次回调、disabled 继承与 roving 跳过；加既有 rich-navigation 回归 | `.artifacts/navigation-labels-validation/navigation-browser-final.json` 与 `navigation-browser-final.log` |
| 视口/字号矩阵 | 24/24：React/native × light/dark/system × 1280/390px × 根字号 100%/200%；检查焦点四边和视口几何、真实展开/收起点击、无页面横向溢出 | 同上 JSON；查看的代表截图在 `.artifacts/navigation-labels-validation/` |
| 真 Chrome 页面缩放 | 6/6：React/native × light/dark/system，Chrome 设置 Zoom 200%，DPR 1→2、CSS 视口 1280×813→640×406、根字号仍 16px、CSS zoom=1、pinch scale=1；检查分支键盘展开、中文名称、焦点和横向溢出 | `.artifacts/navigation-labels-validation/navigation-zoom-final.json`、`navigation-zoom.log`、对应 PNG/JSON 附件 |

实际查看浅色桌面、深色窄屏 200% 根字号、system 窄屏 200% 根字号，以及真页面缩放下的深浅主题截图。窄屏侧栏用公开“工作导航”按钮打开；焦点保持在分支按钮，图标与右侧独立动作仍可见。首轮浏览器运行的 14 项失败是测试脚本未序列化 Node 变量、窄屏没有打开抽屉；修正测试编排后整批 40/40 通过，生产实现未因该首轮失败修改。既有 rich-navigation 回归覆盖主链接、独立配置 action、ContextMenu、Escape 回焦点和菜单键盘顺序。其它浏览器、读屏器及消费产品集成未在本轮执行。

## 焦点仅改变已有边线（2026-10-21）

范围为公共主题：统一移除默认焦点外圈，以及 InputGroup、Menu、Combobox、Chart 的独立外圈；已有边线仅变色，错误边线优先，透明边线和无边线组件不新增边界。保留现有滚动清距、尺寸及键盘和回焦语义；设计合同与受影响的旧外圈断言同步更新。

`node scripts/dev-build.mjs` 的构建、类型与设计值检查通过；最后仅同步文档后 `pnpm build` 再次通过，generation 为 `9a23d5542cf8`。浏览器使用当前已构建公开入口及 CSS；测试 fixture 从原文件直接编译到既有 `dist/react`，没有复制源码另建项目版本。

关键浏览器用例 `tests/browser/design-state-regressions.spec.mjs` **21/21 通过**：light/dark/system、1280/390px，验证有效和错误 Input/Textarea、组合输入、普通及圆形按钮变体、选中 Toggle，以及登录密码错误后的鼠标、Tab、显隐动作。断言 outline 为 none/0、原边线宽度与控件尺寸不变、错误优先及无边线按钮原边界不变。

实际查看 [登录密码错误聚焦截图](../output/playwright/focus-border-login.png)：同一 password input 保持聚焦和 `aria-invalid=true`，组边界为 1px 错误色，outline 为 none/0，box-shadow 为 none。这里是仓库 Chromium 示例验收；正式 tarball 独立消费者、Firefox/WebKit 与消费产品升级、发布或部署未在本轮执行。

本轮其余定向 Chromium 自动用例另有 72/72 个唯一用例通过，覆盖 widgets、menu、input、choice、nav、focus boundaries、登录/认证、管理员初始化、workspace、link 与 icon-button；重跑首轮未通过的 14 个用例后，10+4 均通过。token-scaling 的 widget/group 边界用例再通过 1/1，因此自动浏览器结果合计 94 个唯一通过用例（关键 21 + 其余 72 + widget/group 1）。另由主线程在 layout-typography 实际 Field.error 输入上定向核验 6/6：light/dark/system 下 thin/emphasis 与 semantic-primary，保持聚焦及 `aria-invalid=true`，outline 为 none/0、边线宽度不变、错误边线颜色保持原 status-error 色。该核验补足了完整 token-scaling non-type 用例未能触达焦点断言的范围。

`node --check tests/browser/*.mjs` 通过；合同与文档 Node 检查 38/38 通过：`node --test tests/contract.test.mjs tests/design-state-contract.test.mjs tests/choice-state-contract.test.mjs tests/input-typography-contract.test.mjs tests/design-value-guard.test.mjs tests/text-inputs.test.mjs tests/docs.test.mjs`。token-scaling non-type root families 扩展用例停在既有侧栏几何断言：spacing 6 下当前实际宽度 288px，旧断言为 324px，发生在本轮焦点断言之前；未修改侧栏实现或该断言，也未将此用例计作通过。浏览器验证范围是本仓库 Chromium 与已构建 fixture，不代表完整浏览器套件、正式 tarball 消费者或消费产品现场验收。

## XUI 4.2.35 正式归档准备（2026-10-21）

本次版本提交只更新三包版本、React 包的精确 runtime peer、设计合同版本/变更归属、ADOPTION迁移说明和对应合同断言，没有新增运行时代码或改动焦点行为；焦点边线实现属于前一提交 `4894cb7`。三包均为 **4.2.35**，完整构建 `sourceGeneration` 为 `27b27b7117bcee29c898c9e8fe892c34dbabec5fd43de779139770b10b0da94d`。`pnpm build`、`pnpm check:tokens`、`pnpm typecheck` 及合同/文档 Node 检查 **38/38** 通过。

`pnpm test:consumer` 通过；正式 tarball 在固定 consumer cache 安装后构建公开 ESM/CSS/types 并由 React fixture 消费，无源码 alias。Consumer receipt 为 `.artifacts/consumer-validation.json`，性能门禁为 `.artifacts/performance-baseline.json`。包摘要：

| 正式包 | 版本 | SHA-256 |
| --- | --- | --- |
| `@coffeehc/xui-theme` | `4.2.35` | `744beb1fde869770787b50bf5ff350b83b8db8a3487cab2f8de04954355f2119` |
| `@coffeehc/xui-runtime` | `4.2.35` | `7e30bd3798645024f7a0f26401dcb6c01a471d87e6cac22a83d8cf75c9e50b18` |
| `@coffeehc/xui-react` | `4.2.35` | `c8936be008d3cd4b13c18f41ec73d662d1dbba499481e8e96aa7087372fe5e84` |

Consumer gzip 门禁通过：critical CSS 22,604/22,656 bytes，React 初始 JS 144,665/153,600 bytes，Button-only 6,631/16,384 bytes，Charts CSS 22,484/24,576 bytes。安装树中 React `19.2.8`、ReactDOM `19.2.8`、Base UI `1.7.0` 各为单实例；`@coffeehc/xui-react` 对 `@coffeehc/xui-runtime` 使用 exact `4.2.35` peer。基于正式 consumer 包构建的 `tests/browser/design-state-regressions.spec.mjs` 在 Chromium **21/21 通过**，覆盖 light/dark/system、输入与错误优先、各按钮边线、登录密码错误及 workspace/ToggleGroup 的窄宽视口。验收图 [登录密码错误聚焦](../output/playwright/focus-border-login.png) 已更新为本轮正式 consumer 产物。

本次完成本地归档准备；未推送或发布 npm，未修改 xAgent，也未据此声称消费产品已升级或现场验收。


## XUI 4.2.36 内部 DataTable 统一与列宽（2026-10-23）

BusinessLogExplorer 与 StructuredLogExplorer 的表体统一迁入 DataTable；ApiKeyManager 和三类 Chart 数据视图沿用同一 DataTable 并默认启用列宽。业务列默认可调，内置详情/操作列固定，无重置列宽按钮。公共 columnSizing 支持既有 local/controlled/injected owner；BusinessLog 的列 resize、StructuredLog 的稳定 columnIds/columnOptions 与 DataTable.cellClassName 已同步文档和正反类型用例。领域 Controller、请求、分页/游标、权限、labels 和详情回焦继续由原 owner 负责。

三包与 runtime exact peer 均为 **4.2.36**，最终 `sourceGeneration` 为 `e75f021b4e96a1dd0cc1f5e6fc9e788817a5999da650521bb4f3469a4d71ad5a`。`pnpm build`、`pnpm check:tokens`、`pnpm typecheck` 通过。定向 Node 覆盖 **106 个唯一用例**：contract/docs、business-log、structured-log/query、data-table/sizing/row-events/layout、api-key/v2 和 chart；焦点几何修复后 table/layout/row-events 的 28 项及最后 layout 的 8 项复验通过，未把重复运行累加为唯一用例数。

`pnpm test:consumer` 在最终 generation 通过。使用同一 main 的示例/fixture 链接及正式 tarball 安装，无源码 alias；公开 ESM/CSS/types、正反类型、动态入口、布局和性能门禁通过。React 19.2.8、ReactDOM 19.2.8、Base UI 1.7.0 各单实例。critical CSS gzip 22,629/22,656 bytes，React initial JS 144,641/153,600 bytes，Button-only gzip 6,631/16,384 bytes，Chart CSS 22,509/24,576 bytes。

| 正式包 | 版本 | SHA-256 |
| --- | --- | --- |
| `@coffeehc/xui-theme` | `4.2.36` | `5b34fc076a83dbc6d6eef852bb76cc0f6212a74d3a438d56fc2defe34c92f151` |
| `@coffeehc/xui-runtime` | `4.2.36` | `57e9da2cfa525775db01f56b7553fa8e84a710798731bd9bebf7134f006e9d36` |
| `@coffeehc/xui-react` | `4.2.36` | `5a7e40079023637f1303a4ff64fbcb5154178ffaf1bb1e8c0d44c9365d4e3c3a` |

最终正式包 Chromium 验收 **165 个唯一用例通过**：组合/业务日志/列表/cell/labels、结构化日志/查询/列布局、API Key/v2、行事件、列调整、表头焦点共 152 项，另有 13 项图表数据表/窄屏/键盘/刷新/错误/触屏检查。覆盖 light/dark/system、1280/390/320px、200% 根字号与真实 Chrome 页面缩放、RTL、真实触屏拖动、受控拒绝/注入更新/列重排和卸载。直接验证调宽零查询、固定操作宽度、刷新后保留列宽与 keyed 行、详情关闭回原按钮；完整筛选/分页/快照、取消/迟到、空态/失败重试与业务 cell/复制语义继续通过。

扩展验收曾发现窄屏焦点动作被裁切：DataTable 异步列/字号测量，以及原生 scrollIntoView 在按钮接近表体宽度时仍保留过大的 scroll-padding。现统一由既有 DataTable layout owner 监听活动作与表格几何，按实际剩余空间修正横向滚动；无额外行级 observer 或焦点 Tab 停靠。对应窄屏、长标签、刷新/重排及焦点用例复验通过。旧一次 Tab 直达详情的测试已适配新增列手柄；列重排几何曾出现 1/64px 舍入，现对 Controller 确认值做严格相等、浏览器轨道做 0.05px 容差，单项复验通过。最终 152 项由同一正式产物运行得到 151 通过及该项舍入断言失败，修正断言后只复验该项；不宣称一次整批 152/152。

实际查看[桌面列宽与固定详情](../output/playwright/composed-data-tables-business.png)及[390px、200% 字号聚焦动作](../output/playwright/composed-data-tables-narrow.png)。后者 activeElement 仍为原复制按钮，按钮左右 38/352px 位于表体 33/357px 内，outline=none，页面无横向溢出。consumer 首轮曾被共享 npm cache 缺失 blob 阻断；npm cache verify 后沿原参数成功，未放宽 peer、预算或安装校验。

上述证据仅为本仓库合成示例、正式包和 Chromium；未运行全量浏览器、Firefox/WebKit 或消费产品现场测试。本轮仅在 xui 完成本地提交与正式归档，不推送、不发布 npm，也未修改或部署 xAgent。生成的临时 consumer 与浏览器报告在归档后清理，验收图和必要归档保留。

## XUI 4.2.37 图标背景基础模型与统一直径（2026-10-23）

所有默认资源卡片使用公共基础形状，圆形为缺省，只有显式shape/iconShape/data-icon-shape=square选择方形圆角。Icon的plain默认和菜单、通知、空态、侧栏的无底色glyph不增加背景。Card保留原span与glyph呈现，不裁SVG；CardGroup直接继承，未按资源类型增加实现。IconShape从display及根入口导出，Button/IconButton、Avatar、InputGroup.Button复用该类型。

按用户补充要求，默认背景直径统一由icon-container-size管理，根16px时32px、根200%时64px：Card/Icon tile、默认图标按钮圆面、输入辅助动作、紧凑导航背景与默认Avatar一致。Button默认命中区仍36px、glyph仍16px；输入辅助动作至少32px宽，背景在原按钮内居中绘制，清除/步进的字符宽度不再决定圆径。显式size、Card专用尺寸覆盖保留有意差异。原Card size/background Token为兼容别名，导航内距由目标与基础尺寸派生；手机完整文字行恢复原半径及背景范围。

最终sourceGeneration为`ecfe2dd0b63627010fcdc995af128a6bd59a4ca1ff36ec2050ddfd30dda81101`。三包及runtime exact peer为4.2.37。build、440 Token图/指纹、typecheck和123项定向Node检查通过，覆盖Card/Avatar、图标呈现、按钮/输入、导航/菜单/Tabs/Toast、设计值审计和文档。正式consumer安装三份真实tarball，校验全部公开ESM/CSS/types、正负类型fixture和init；React/ReactDOM19.2.8、Base UI1.7.0各一份，无src alias。

| 包 | 4.2.37 tarball SHA256 |
| --- | --- |
| @coffeehc/xui-theme | `6720b890680f6a1831ee0c3e606d01b66bf11775d7df146ee1978853249527b7` |
| @coffeehc/xui-runtime | `4c58f6571045980c2b7d6ffa64ec1a3f3aedc5030a9dbaacaadb00a6878c2916` |
| @coffeehc/xui-react | `33b67de7fcb32923b3c0539ddbebe3c9a8b917329ce7a78fc37f7fa761cbd314` |

正式性能门禁通过：关键CSS gzip22933/22976、初始JS144699/153600、Button-only6654/16384、Charts CSS22814/24576 bytes。统一形状、直径和内部绘制层使关键CSS较4.2.36的22629增加304 bytes；本能力仅有界增加320 bytes预算，其余JS/Button/service/chart门禁不变。候选曾分别超出旧CSS预算，未将这些失败计为最终通过。

最终同代正式包单批Chromium **236/236通过**，零跳过、零重试，包含23项背景模型、61项图标密度/组合及Card三域、按钮、输入、导航、通知、display和21项焦点回归。覆盖light/dark/system、1280/390、根200%及真实Chrome设置200%缩放；默认圆径一致、显式square/size、无背景槽、Card专用覆盖、单一基础直径改为24px时各默认入口同步、手机文字导航恢复、真实键盘/单次回调、disabled/busy、原节点/草稿/焦点与形状切换连续性均通过。

输入辅助动作在三种主题与100%/200%根字号下，逐项截取hover/pressed真实背景像素：清除、步进和密码动作均为32px或64px统一圆径，抗锯齿边缘容差不超过1px，状态切换不改变命中区。紧凑导航曾被组合中的旧padding=0覆盖成36px，已改为同一公共内距并通过32px及24px覆盖验收。两项旧CSS/SSR断言及图标密度的旧焦点offset断言已按当前合同维护；早期两组浏览器进程共用临时目录造成的追踪文件冲突已改为串行执行，候选失败不计本批结果。

已查看最终[桌面默认背景](../output/playwright/icon-background-default.png)、[深色390px/200%](../output/playwright/icon-background-narrow.png)和[密码动作hover](../output/playwright/icon-background-password-hover.png)。[简要结果与像素测量](../output/playwright/icon-background-metrics.json)保留逐例状态和六组测量。复现使用pnpm build/check:tokens/typecheck/test:consumer；浏览器使用icon-container-shape、icon-button-density、button-state-contract、card-actions/footer/group、design-state-regressions、display及display-foundation-contract、rich-navigation、text-inputs、toast这12个spec，workers=2。

本轮只交付xui，库级合成示例不代表xAgent实际产品已接入或部署。未运行全仓unit/browser、watch/cold-start、Firefox/WebKit或真实领域后端。本次修改按授权提交并推送main，正式归档包含源码、三包及验证证据；临时consumer、浏览器中间产物和松散打包副本随后清理。


## 公共模型配置 Mock 预览（2026-10-23，尚未发布）

本轮只修改 xui；按用户要求先交互预览，版本仍为 4.2.38，交付范围为源码和Mock预览，未发布新版本或建立正式归档。新增 model-profile runtime/React 入口、公共表单与 Sheet 编辑器、合成 HTTP mock 示例。移除说明字段、密钥处理选择器、关闭流式输出开关和Headers处理选择器；Headers JSON默认显示{}，未编辑保留，编辑后整项替换。流式行为沿用后端配置。已有密钥显示固定六星号，提交该标记由后端按授权 profile_id 解析旧值，空值清除、其他值替换。新增/无原密钥拒绝六星号。默认参数为合成 fixture，不能视作 agentCore 正式默认值或真实测试结果。

验证：pnpm build、pnpm typecheck、node --test tests/model-profile.test.mjs（17/17）、tests/docs.test.mjs（2/2）和 pnpm test:consumer 通过。独立 consumer 安装三包 tarball，校验真实 ESM/CSS/types 与 React/ReactDOM/Base UI 单实例，没有源码 alias。sourceGeneration 为 `cf1601d3c6545f95287d1577b0e931b619817877fc9a4f2b408c50842789e0f7`。新增局部表单样式令关键 CSS gzip 为 23007 bytes，原 22976 上限不足31 bytes；预算有界增加64至23040，其余门禁未放宽。

实际浏览器使用上述独立包预览：目录拉取/指针选择、聊天与向量测试、密钥保留/替换/清除、mock保存后秘密清理、只读、慢请求取消无假成功Toast、Sheet的Escape确认/继续编辑/放弃回焦均通过。查看浅色、深色、system选择与长中文200%阅读缩放；883px可视宽度下文档宽度仍为883px，字段回落单列、目录动作自然换行。控制台没有error/warn。浅色最终截图保留在 `.artifacts/model-profile-preview/light.png`。Headers处理选择器移除后，另验默认{}、直接编辑、非法JSON聚焦阻断、保存后恢复{}和显式空对象清空；截图为 `.artifacts/model-profile-preview/headers.png`。

未执行：完整发布级浏览器矩阵（390px、真实浏览器200%缩放、Firefox/WebKit）、全仓unit/browser、真实后端/上游测试及消费项目验收。所有请求使用示例注入的mock fetch，未连接或修改后端/agentCore/消费项目。本记录是预览阶段证据，不是正式发布或产品接入完成声明。

补充：组件README位于 `packages/ui-react/model-profile/README.md`，随React包交付并纳入sourceGeneration及安装内容一致性检查。连接区改用公共FormGrid自动分列：818px视口、672px网格净宽为两列各328px；200%阅读缩放下630px净宽回落单列，页面宽度仍为818px。截图为 `.artifacts/model-profile-preview/connection-wide.png` 与 `connection-200.png`；这是阅读缩放验证，不等同于浏览器原生缩放。

## 公共模型配置正式交付（4.2.39，2026-10-24）

三包及 DESIGN 统一为 4.2.39；正式入口为 `@coffeehc/xui-react/model-profile` 的 ModelProfileForm/ModelProfileEditor，以及 runtime 同名子入口的 Controller/Client/Service。组件 README 随 React tarball 交付，PUBLIC_API、COMPONENTS、ADOPTION 和 MODEL-001～008 已同步明确：项目后端读取/授权原配置或 AgentCore 默认值，应用显式 patch，解析六星号标记和真实凭据，再将完整明文 Profile 交给 AgentCore。AgentCore 不接受前端 patch/掩码，不按 ID 查密钥，不合并或存储项目配置。

本轮浏览器发现并修复：输入新密钥同时填写非法 Headers JSON 时，读取私有输入的回调先因 JSON 失败而退出，旧校验把未取得的密钥误报为空。现在仅标记 Headers 错误并聚焦该字段；请求仍被阻止，秘密不进入公开快照。针对性单元和正式包浏览器路径均通过。

验证命令与结果：

- `pnpm build`、`pnpm typecheck`、`pnpm check:tokens`：通过；最终构建再次校验 440 个 Token 及主题依赖图。
- `node --test tests/model-profile.test.mjs tests/docs.test.mjs`：**20/20 通过**（18 项模型配置、2 项文档）；覆盖默认值投影、六协议、显式 patch、六星号/清空/替换、秘密快照、取消/迟到、有限等待、向量参数、保存去重/未知结果及字段错误归属。
- `pnpm test:consumer`：通过。三包正式 tarball 独立安装；全部 ESM/CSS/types 及随包 README 一致，零源码 alias。React/ReactDOM `19.2.8`、Base UI `1.7.0` 各单实例，runtime peer exact `4.2.39`。CSS gzip 23,007/23,040 bytes，React 初始 JS 144,929/153,600 bytes，Button-only 6,654/16,384 bytes。
- `pnpm exec playwright test tests/browser/model-profile.spec.mjs --max-failures=3`：最终 **22/22 通过**。真实 Chromium 运行上述独立正式包产物，涵盖新增/编辑、目录真实指针选择及滚动、手工输入、Headers 错误聚焦和清空、向量测试、只读/禁用、Controller 连续性、停止等待、保存未知核对、Sheet 确认/清密/回焦；light/dark/system、1280/390px、长中文、100%/200% 阅读缩放与三主题真实浏览器 200% 缩放。
- 为避免把弹层过渡动画截成最终状态，截图等待确认框完全显示/Sheet 关闭完成后，对 Sheet 和三主题浏览器缩放 **4/4 复验通过**。真实浏览器缩放经 Chrome 设置完成：CSS 视口减半、DPR 翻倍、根字号不变、CSS zoom=1、visualViewport.scale=1；不是 CSS zoom 或 pinch 替代。

sourceGeneration：`e7ab9b6afdb4b9ff908e8ad1072dd59b0e566e2f62c58af14b79559a82ac860c`。可复现浏览器测试见 [model-profile.spec.mjs](../tests/browser/model-profile.spec.mjs)，完整报告保存到正式归档 validation，截图包括 [浅色桌面](../output/playwright/model-profile/light-1280-1.png)、[深色桌面](../output/playwright/model-profile/dark-1280-1.png)、[390px/200% 阅读](../output/playwright/model-profile/light-390-2.png)、[确认弹层](../output/playwright/model-profile/sheet-confirmation.png)、[真实浏览器 200%](../output/playwright/model-profile/light-browser-200.png)。已实际查看这些截图核对布局、状态和层叠。

范围与限制：本轮没有未解决的适用失败项；首次脚本把 label 中可视必填星号当作可访问名称、并错误假设 1280px/200% 必须单列，已按真实字段标签和净宽合同修正。未执行全仓 unit/browser、watch/cold-start、Firefox/WebKit、移动 OS/读屏器、真实后端/上游和消费项目验收。示例所有 API 均为合成 mock；公共库交付不代表 xAgent 或 AgentCore 已完成接口接线。未修改其他项目，未发布 npm 或部署。正式归档沿用 `pnpm archive` 自动生成并核验 manifest、public-api.json、sourceGeneration 和 SHA256SUMS。

## 统一基础组件逐项预览复核（2026-10-25，未定版）

只复核统一 demo 中图表以外的 11 个基础面板：按钮、表单、反馈、容器、弹层、菜单、文字媒体、表格、上传、面包屑和走马灯。逐项组合与状态范围见 [COMPONENTS](COMPONENTS.md#统一基础组件-demo4241)。保留所有既有候选修改，图表代码、公共组件实现和主题 Token 本轮均未改动；没有提交、推送、归档、发布或增加版本。

修正 demo 接线：具名 Breadcrumbs 链接复用示例导航回调，先复现 iframe 内嵌套整页再验证修正；DataTable 工具栏使用 SearchToolbar 的 search/actions，同一 Resource 演示真实异步刷新、保行/草稿/分页，按名称实际排序；刷新失败重试保留已有行。Tabs 的草稿面板显式 keepMounted。单选组补关联错误。Dialog/Sheet 增加 SimpleSelect 与 footer 的组合，字段错误可修正后保存；Popover、菜单、图片、Tabs/Card 和 ErrorState 的重试恢复实际内容或可用动作。ScrollArea 使用现有高度 Token，真实发生组件内滚动。

继续消费同一组已验证、独立安装的三包 tarball 4.2.41（候选），sourceGeneration 为 `f44d8fe3dc48d2b5c6b6a90f33243dd149cfdb36ecaef390109805862c4e9f76`；本轮重新计算并确认不变。安装锁摘要和三包 SHA 对照既有 consumer receipt，React/ReactDOM/Base UI 仍为单实例。以 preserveSymlinks 在原正式消费者缓存中重跑 strict TypeScript 和 esbuild，仅重建当前 demo；所有依赖来自独立 node_modules，没有 packages/src alias，基础页面初始 D3 bytes 仍为 0。未改写此前性能门禁或正式包验证 receipt。

最终 Chromium CLI 通过 **283 项断言**：73 项交互、20 项补充控件、190 项统一外壳/几何检查；后者覆盖 11 面板 × light/dark/system 共 33 组桌面与 390px/公开阅读比例200%组合。覆盖指针/键盘、disabled/readOnly、关联错误、Calendar 单日/范围/禁用/清空、DateTime 墙上时间、Command/GroupedCombobox、菜单权限与 Shift+F10、Tooltip、AlertDialog、Tabs/Disclosure/Carousel 草稿保留、复制合成 writer、Upload 合成 HTTP、表格局部横滚及嵌套弹层操作。Dialog/Sheet 在三种模式的窄屏200%下，长中文选项真实指针命中/选择、滚动、Escape 关闭回焦均通过；无 force click、无 footer 隐藏和私有 CSS 覆盖。文档检查2/2、git diff --check 通过。

首轮探针发现 Tabs 草稿缺失，修正示例后复验通过；其他首轮失败分别来自未等待弹层挂载/原生平滑滚动、未限定同名控件、错误假定 Spinner 是 SVG、把页面滚动当布局位移、错误假定受控搜索文本随选值改写，以及自动化工具拒点 disabled 日期。最终探针改为真实指针坐标点击禁用日期、按已公开语义和实际挂载/滚动状态验收；早期失败不计入最终通过。

逐项证据、固定依赖和可复现 CLI 命令保存在 [review-12/checks.json](../output/playwright/pages-gallery/review-12/checks.json)、[构建记录](../output/playwright/pages-gallery/review-12/build.json) 与既有 `.artifacts/pages-gallery-preview.json`。已查看最终[表格](../output/playwright/pages-gallery/review-12/final-table-light.png)、[媒体和滚动](../output/playwright/pages-gallery/review-12/final-display-light.png)、[Dialog 窄屏200%](../output/playwright/pages-gallery/review-12/overlay-Dialog-light-narrow-200.png)、[Sheet 深色窄屏200%](../output/playwright/pages-gallery/review-12/overlay-Sheet-dark-narrow-200.png)，其他面板同目录保留截图。

本轮未跑全仓 unit/browser、watch/cold-start、跨引擎、移动 OS/读屏器、浏览器设置中的200%缩放、真实剪贴板/文件选择器、真实后端或消费项目验收。所有数据和请求为本地合成 mock；公开阅读比例200%的证据不替代真实浏览器缩放。本轮只形成候选预览，不代表消费项目已升级或部署。

## 统一内置页面逐项预览复核（2026-10-25，未定版）

范围为统一 demo 的 API Key、业务日志、结构化错误日志、模型配置、登录、管理员初始化及改密 7 类页面。按[内置页面矩阵](COMPONENTS.md#统一内置页面-demo4241)检查 layout/slot、默认文字与主题、加载/空/失败/禁用、查询与提交、局部刷新和焦点；保留已有其他候选修改，图表未改。本轮没有提交、推送、版本递增、正式归档或发布，也没有改消费项目或真实业务 API。

公共修正：SimpleSelect 增加可选 placeholder，只描述没有选中项的显示；StructuredLogLabels.all 可翻译空多选，仍保持原空数组/无过滤语义，不增加请求。模型目录/测试/保存按钮忙时增加公共 Spinner，闲置没有空图标占位。ApiKeyManager 一次性值和 StructuredLogExplorer 标识复制的临时结果改为 Toast；复用同一私有 copyStatus 订阅，保留 Controller/writer、立即重复复制、关闭和迟到隔离。结构化页可选 toastController 接宿主队列，默认组合无需宿主额外包装。通知常驻区域通过标准 aria-live=off 保持在模态期间的播报通道，各 Toast.Root 自己指定优先级；失败用可访问 alert，保留模态隔离，不改 peer 私有 DOM 属性或跳转焦点。

示例修正：模型页 embed 复用外层主题入口；登录目标页用公共 Container/Stack/PageHeader，退出使用当前 auth owner。API Key showcase 的故障与等待按 list/create/update/revoke/deleteRecord 区分并响应取消，不再由一个列表开关冒充全部操作；编辑过期记录保留 expired。三类列表的 initial-list=hold/empty/error 合成预览分别展示首次加载、空结果和失败重试，均沿用原查询 owner，不新增后端或皮肤。

最终同代 sourceGeneration 为 `5c7007c53ee01678b90859c682eb4e8bdb2a7ed0c4b6ef5d47059528aa2360be`，三包仍是既有候选 4.2.41。pnpm build/typecheck、针对性 Node **58/58**、pnpm test:consumer 通过；正式 ESM/CSS/types、三包 SHA、安装锁与 React/ReactDOM/Base UI 单实例核对通过，未使用 packages/src alias，性能门禁未放宽。独立安装包随后用于全部浏览器检查。

最终 Chromium **95/95** 现成回归通过，零失败/跳过/重试，覆盖 select-form、structured-log-query、api-key、structured-log、model-profile、toast；明确未运行未改协议的“real browser POST wire”用例。另有统一 demo CLI **218 项断言**：69 项主流程、34 项状态/复制、115 项几何与弹层。7 页 × light/dark/system 共21组，在1600px桌面与390px/公开阅读比例200%下，单一Shell/标题、字段语义净宽、局部横滚、末尾控制可达；API Key全部有效期真实指针选择、日志详情与模型Sheet滚动/关闭回焦均通过。现成回归还覆盖日志、模型和Toast的真实浏览器200%缩放，不把它扩写成7页全部真实zoom验收。

复制前后实测：旧的一次性结果弹窗高度274→312px（临时反馈增加38px），修正后成功/失败保持尺寸与位置；详情正文 scrollHeight 不因标识复制增加，原字段保留焦点。模态内错误Toast可由可访问alert定位，连续立即复制有独立反馈；复制不触发日志读取、关闭清除一次性textarea，迟到结果不恢复旧内容。认证错误/未知结果保留原持续反馈，不用Toast掩盖必需的重登或核对步骤。

首轮回归的两项旧断言分别期待撤销后继续显示禁用动作、把ISO原文直接作为时间显示；按当前公共行为改为验证撤销事实与隐藏动作、time.datetime保留精确原值。复制反馈迁移时发现的模态播报隔离已在公共Toast层修正后重跑全部95项。早期CLI的空目录未打开选择浮层、错误地把一像素隐藏表单桥当作视觉焦点目标等探针问题已修正；不将这些失败计作最终通过。

固定包、逐页数据、命令和截图见[检查记录](../output/playwright/pages-gallery/review-13/checks.json)、[构建记录](../output/playwright/pages-gallery/review-13/build.json)和[浏览器结果](../output/playwright/pages-gallery/review-13/regression.json)，既有 `.artifacts/pages-gallery-preview.json` 已更新为review-13。已查看[结构化查询](../output/playwright/pages-gallery/review-13/final-structured-log-light.png)、[模型配置](../output/playwright/pages-gallery/review-13/final-model-profile-light.png)、[API Key复制Toast](../output/playwright/pages-gallery/review-13/api-copy-toast.png)、[日志复制Toast](../output/playwright/pages-gallery/review-13/log-copy-toast.png)及深色窄屏200%弹窗截图。

未跑全仓unit/browser、watch/cold-start、跨引擎、移动OS/读屏器、真实系统剪贴板与后端/上游模型服务或消费项目验收；所有数据、认证和请求为合成mock。现有持续认证状态、授权、提交、secret清理和请求owner不变。当前交付是可继续比较的候选预览。
