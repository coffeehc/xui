# 验证证据与限制

本页集中记录当前可复核的执行结果与验收边界；接口和设计合同分别由各能力文档与 [DESIGN.md](DESIGN.md) 维护。测试存在、收集成功、源码检查和实际浏览器通过分别陈述，不把历史全绿或局部复验当作当前完整验收。

以下历史记录保留当时的版本、双端范围及结果。1.0.0移除了原生DOM UI；其中标为“历史路径”的文件需从对应固定提交查看，不是当前公开接口。

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
