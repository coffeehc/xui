# 最终接入审查与验收

本步骤基线为 `4ed5b9adea5ef857e7d48639e145b0bd7c3793c5`。覆盖本轮 NavItem、Menu/Layout、HTTP/query、API Key、可扩展业务日志，以及可配置登录页、认证合同、三层设计哲学与完整手册/仓库接入 skill。此前结构化错误观察代码和提交保留，明确是独立错误功能，不能作为业务日志交付。没有新增后端服务、运行配置组件、SSO/注册/重置/完整用户管理、Agent SDK、产品迁移、部署或包发布。

最新用途澄清已在同一页面落实：BusinessLogExplorer/createBusinessLogExplorer与business-log入口取代早期BusinessAudit命名，提供业务记录查询与可扩展详情，不新增重复页面或正式审计体系。下方46caeb75等早期提交保留原命名和真实历史；baseservice日志能力收敛及取消独立auditservice属于后续后端范围。

## 审查范围

三个独立只读审查分别核对公开合同/正式消费、运行时与视图生命周期、skill 实际接入任务。读取实际源码、manifests、声明、默认值与示例，进行了独立类型/运行导出、最小浏览器和重入复现；没有改文件或代跑完整 build/consumer。审查期间变更的产物不冒最终提交结果，标准 verify 仍由主流程在冻结后的 SHA 完整执行。

| 发现 | 修复与独立证据 |
| --- | --- |
| P1：全入口检查用 require.resolve 解析 ESM-only export | 改为 fresh 独立安装内的原生 ESM import；两宿主实际全入口消费重新通过，声明与运行时导出一致 |
| P2：错误观察 reset 多次通知，使旧过滤覆盖新意图/销毁后复活；live Set 重绑重复通知 | 单次状态切换、generation 再检查、订阅快照；新意图、销毁和重绑回归在旧实现失败，在修复后通过 |
| P2：撤销成功的通知中新建会话被旧操作关闭 | 只关闭仍属于本次 generation 的会话；旧代码复现失败，新会话名称和 phase 保留 |
| P2：React 一次性 key 卸载后 textarea.value 仍有值 | 同步订阅/节点移除/pagehide 显式清空 value/defaultValue/textContent；两宿主三条退出路径独立 Chromium 复核通过 |
| P2：无效错误过滤重复 alert 且给旧查询 retry | 过滤区域单一归属，两宿主一个 alert、无错误 retry 入口；浏览器实测通过 |
| P2：日志 fake loader 按 RFC3339 字符串排序错筛等价时区 | 纳秒比较，保留时区与半开边界；核心纯逻辑及两宿主实际过滤验证 |
| P2：旧详情 Abort listener 新开详情，被 reset 关闭后仍存 payload | 日志与错误观察的关闭 patch 同时检查详情 generation，保留外层过滤与新详情；两条回归在旧产物失败、修复后独立 2/2 通过，源码/dist 匹配 |
| P2：工具栏快照时间在窄屏、放大字号和较宽后备字体下撑出页面 | 工具栏文字允许必要换行；两宿主 390px/200%/monospace 回归在旧消费者失败，重新打包安装修复产物后 2/2 通过，保留完整文字与字号 |
| P2：长品牌或动作文字耗尽登录卡片正文 | 品牌及动作区自身滚动，按钮使用安全居中以保留首尾文字；新增两宿主390×720/200%/monospace下126字品牌+120字动作的真实配置回归，正文保留可用空间，按钮在视口内，全文可滚动并且登录可执行 |

最后独立源码复核在该范围内无剩余 P1/P2。三个合成 skill 接入任务实际检查旧 JSON theme/HTTP owner、私有 CSS/菜单规则、response/query 猜测；追加日志任务确认旧 error samples 无法充当业务日志，已有领域 loader 可先接，不等待 HTTP route，也不重复调用已有批准 API 的日志写入。skill 的正式 YAML/frontmatter/UI 默认提示校验通过，所有相对引用存在；这是迁移判断检验，不是产品迁移。

## 统一验收

公开入口索引与实际 manifests 的 **52 个入口**一一对应。正式消费逐个检查安装后的 ESM、CSS、经典 init 字节及声明，编译全部命名类型（完整声明检查不跳过 lib），核对运行时导出，打包全部 ESM/CSS；另编译真实 React/原生登录、日志、API Key、菜单、HTTP 和基础页面。原生不装 React，React/ReactDOM/Base UI 单实例；CSS、动态面板和 Button-only 实际贡献/体积门禁保留。

本步骤新增 11 项业务日志逻辑测试与 12 项浏览器检查，覆盖固定公共事实、可扩展 JSON/版本/renderer、安全边界、过滤及纳秒时间、cursor/快照/缓存回退、取消/迟到/重入/销毁、权限/缺失/保留期/null、对象安全映射、键盘/focus、窄屏/长中文/200%文字及 reduced-motion。另加入 6 项既有控制器重入回归与 2 项保留 DOM 节点的浏览器回归。基础收口时全套为87单测、1真实默认watch、126浏览器检查。新增认证9项单测及14项登录浏览器回归后，全套数量为 **96 项单测、1 项真实默认 watch、140 项浏览器检查**；最终运行的通过/失败/未跑以交付中的冻结 SHA 和日志为准，不能用局部结果替代。完整日志 `.artifacts/verify-final.log` 首行记录受测 SHA，浏览器 JSON 位于 `test-results/browser.json`。

首轮针对性浏览器检查 38/40 通过，两个失败来自测试把格式化 JSON 转义引号当作原文；改为还原 JSON 核对原值，并继续验证无 DOM 图片/代码执行。没有加 sleep、retry 或跳过以掩盖失败。

首次正常推送 `46caeb75f37e6a07cb39f1924039d046e468ce64` 的本地完整 verify 通过，但 [CI 38168147699](https://github.com/coffeehc/xui/actions/runs/38168147699) 浏览器检查为 123/126，两个窄屏溢出和一个主题切换后对比度采样失败（4.357762882141346）。溢出已用上述后备字体在本地复现并修正；对比度测试补全有效主题状态确认、逐帧跟随替换 transition 的结束，保留实际渲染色值测量和 4.5/3 阈值，失败时也保存色值附件。没有降低阈值、关掉动画或靠重复执行取得通过。本地 Chromium 154，CI 下载的 Chromium 156 在本地下载受限，首轮 CI 数值失败未直接在相同浏览器复现；最终追加修正的冻结 SHA、完整 verify 和同 SHA CI 结果在交付中明确报告。

独立只读审查受控地在等待中替换 transition：旧动画取消后，单次 `.finished.catch` 提前返回，新动画仍运行，实际对比度 2.064439；新等待跟随替换后到最终 light，白字/蓝底恢复 6.701618。CPU 6 倍节流下两宿主六组合均无剩余动画、终态对比度达标。这证明旧等待存在取样缺口；没有把受控复现当作首轮 CI 的自然触发事件。

新增认证独立核对固定源 xAgent@29139f7 的真实 token/logout/me/state，明确新 cookie facade 不猜旧协议。Auth+HTTP独立23/23逻辑检查通过，两宿主验证提交即清密码、防重复、取消/迟到隔离、pagehide/卸载与安全回跳；未发现该生命周期范围的剩余P1/P2。公开合同复核发现上表长品牌P2，修复后独立实际操作通过。接入审查核对完整页面配置、特殊业务公开组合、单一架构引用与后端边界，无该范围剩余P1/P2；补明确缺cookie facade的旧项目先保留现有认证，不靠baseURL迁移。

登录初轮6/12浏览器检查通过，React六项均受同一测试定位器影响：必填Field的label包含星号，精确文本定位不匹配；改用兼容必填标记的label定位，未修改正确的可访问名称。14项专项回归通过。独立消费者也发现React示例依赖其它示例的Window声明；改为本文件显式ThemeController类型，再次完整tarball消费通过。新增品牌logo揭示预览服务缺SVG MIME，已修正并验证资源实际解码；watch对全部16页面的实际消费纳入冻结SHA完整verify。没有借测试重试或跳过掩盖失败。

详细入口见 [PUBLIC_API.md](PUBLIC_API.md)，接入过程见 [ADOPTION.md](ADOPTION.md) 与 [skill](../.agents/skills/adopt-xui/SKILL.md)。通用规则仍只在 [DESIGN.md](DESIGN.md)。此前各独立步骤的实际结果见 [FOUNDATION_VALIDATION.md](FOUNDATION_VALIDATION.md)。

## 未实施与未跑

没有改其他产品仓库或实现认证cookie后端/日志后端 adapter/错误 HTTP facade，没有真实业务后端/Cookie/CSRF/CORS/Go/PostgreSQL/鉴权/tenant/日志可靠性集成验证。日志 typed loader 和安全视图已由 xui 自身定义，实际服务后续适配；不承诺不可篡改、恰好一次、写入成功或日志事务保证。Clipboard 为模拟，触屏为 Chromium 模拟，200%为根字体放大；真实移动 OS、读屏器、Firefox/Safari、浏览器原生 zoom、SSR hydration 与生产性能未跑。合成例子不代表产品已迁移或性能提高。

用户已明确要求全部功能、文档、skill 与统一验收完成后正常推送 main。首次正常 push 的 CI 暴露以上修正，需要完整复验后追加普通修正提交并验证新 SHA 的 CI，保留首次推送和所有已有提交。push 前正常 fetch 比较远端；没有 force/reset/clean、文件树上传、秘密生成或发布部署授权。

统一登录提交db3ea9f已保存并保留完整恢复bundle；用户追加业务日志用途澄清时，该SHA完整verify已过96单测、正运行watch，由主流程主动终止（143），不记为整套通过或测试失败。日志位于.artifacts/verify-db3ea9f-scope-interrupted.log。统一命名后的新冻结SHA重新运行全部verify并检查同SHA CI。

发布状态原则同步到手册和skill：用户确认只有xAgent已正式上线，未发布项目直接使用新设计，无旧接口/配置/模型升级兼容层。当前xui没有旧auth路由/response猜测或BusinessAudit别名；公开扩展、状态失败回退和数据安全不是兼容层。基础控件参考页仍有覆盖用途，dev中的例子CSS解析仅消费已声明的示例资源，不是旧产品升级分支。9dce712的96单测通过后，主流程为同步此原则主动终止尚未完成的全verify（143）；最终新SHA重新完整验证，不把中断算通过。


## 公共能力与原生页面API补齐

本步骤基线为已推送5adbf5c。依据xAgent/xLead接入反馈补公共能力，不改任何产品后端；已保存普通WIP提交c45939d及完整本地恢复bundle，继续普通提交保留历史。原始DESIGN来源与271默认值保持，新增CSS只引用已有token。真实源SHA及原生协议在[PAGE_APIS](PAGE_APIS.md)，项目目标同步到README、手册、skill：统一品牌与前端体系，采用项目在自己的授权范围主动标准化commons/webfacade/httpx，旧协议adapter仅作为有目标和移除条件的临时桥梁。

交付包括HTTP安全三字段headers、filename/显式下载、非2xx结构化错误；Sheet/AlertDialog/ContextMenu；条纹/展开/逻辑sticky表格；默认API Key与业务日志HTTP facade。密钥required与独立confirmed、capability授权、过期撤销与撤销后删除管理记录分别保留；未知写入结果禁止同会话重复。默认日志使用真实offset/ListData，领域cursor允许可选真实snapshot且不丢已知基准。登录已有固定cookie v1合同，xAgent旧bearer协议仍须另项后端升级，不能仅换baseURL。供应商凭据和程序错误观察不冒充密钥/业务日志服务。

两项独立只读审查实际复现5个P2：JSON media type大小写绕过下载错误、可选snapshot抹掉链基准、默认facade继承protobuf/form headers、同步宿主回调关闭后仍发写入/恢复secret、空草稿关闭留下不可见native modal。全部修正并补最小回归。JSON协商由endpoint覆盖，其他宿主header保留；回调后再次核generation/phase/target/draft；确认trigger仅在有草稿时显式打开。PUBLIC_API旧默认timeout/授权描述同步，不留另一份冲突默认规则。

定向20项HTTP/页面逻辑测试通过；完整116单测与类型检查通过；两类正式tarball消费通过。新增浏览器首轮10/12通过，两失败是React Disclosure文本包含隐藏加号导致精确getByText定位不匹配；改按button/summary选择后12/12通过，未关闭motion/降低断言/添加重试。实际浏览器下载核filename与完整bytes、取消不合作迟到请求；嵌套取消/确认/空草稿关闭再开/可见focus、context键盘和检查项、条纹/展开/sticky滚动、密钥确认/撤销/删除、日志offset/无假snapshot、dark/390px/200%根字体/reduced-motion均覆盖。

统一验收现在包括59公开入口(theme15/runtime20/React24)、18个正式消费者、116单测、1真实默认watch、152浏览器检查。最终冻结SHA的整条verify、普通推送与同SHA CI仍以交付事实及.artifacts/verify-capabilities-final.log为准；局部通过不冒整套通过。旧5adbf5c验收证据原样保留，早期失败和修复记录不改写。

真实产品后端、Cookie/CSRF/CORS/鉴权/tenant、业务日志脱敏/可靠性与生产API Key生成未集成。模拟数据不代表xAgent/xLead或其它产品迁移；真实移动OS/长按/读屏器/Firefox/Safari/浏览器原生zoom/SSR/生产性能未跑。无密钥生成、许可证/可见性变更、发布或部署。

最后合同复核在Auth固定facade发现同类JSON协商遗漏；三请求补明确Accept、POST明确Content-Type，并以实际旧client headers+保留CSRF扩展已有auth合同回归。1b1cdce的整条verify在116单测通过、watch运行时主动中止以实施此修正，退出信号日志保留于.artifacts/verify-1b1cdce-auth-interrupted.log，不计整套通过或测试失败。新普通提交重新冻结全verify和同SHA CI。

8241e563c08f1e435313593bb0fd4924aaa0f7e7本地完整verify通过116单测/1watch/152浏览器、59入口/18消费者，并正常推送；[同SHA CI 38195855434](https://github.com/coffeehc/xui/actions/runs/38195855434)首次执行成功。之后用户仅授权行业标准/第三方边界文档澄清：DESIGN修订0.5.1、README/ADOPTION/skill/API合同同步；271默认CSS值和库实现不变，AjaxResponse/HTTP双层协议保持。附件XUI-03/04/05及其它新增组合仍仅只读评审，无新功能授权。新文档提交继续正常验收与同SHA CI。


用户追加冷启动重复页面/菜单刷新排查已独立取证，未扩展附件功能。正式tarball字节的两宿主各三条件在0–180秒共360菜单点击/60回退前进均无额外Document请求或外壳重挂；缺adapter和canNavigate=false受控对照复现完整导航，后续正常adapter恢复SPA，接入指引见[NAVIGATION](NAVIGATION.md#冷启动与路由ready边界)。本库范围未复现自发reload，不据此宣布产品问题已修复。产品现场因匿名无合法会话及本云环境ERR_TUNNEL_CONNECTION_FAILED受限；父任务登录页#418独立保留，真实部署版本未核，SSR/hydration与菜单问题不合并归因。最终文档提交继续全verify与同SHA CI，原8241e56完整绿色证据保留。

用户后续更正冷启动问题发生在本地新接入版本、尚未部署；停止线上取证，旧线上#418不再参与归因。未访问用户本机，本地dev/watch命令与日志尚未提供；继续云端独立dev模块初始化对照，区分生产字节与Vite依赖优化/HMR，不以“未就绪”代替因果证据。

进一步独立Vite8.2.2 dev宿主复现：三个不可静态发现的lazy xui deep imports对应三次dependency optimized→optimized dependencies changed. reloading→HMR full-reload→Document1→4；后续点击稳定。暖optimizer cache和冷cache预声明实际include均1 Document/0 reload，无pageerror。因果与配置指引同步NAVIGATION、ADOPTION、skill；不改库runtime协议或产品配置，不认定用户实际本地已确认此根因。具体本地命令/日志仍待用户提供，生产、dev和旧线上hydration证据分开。

dbd5f7f构建/271token/typecheck通过，116单测中来源复原校验1项失败：测试仍只认识0.5.0，未移除用户授权0.5.1边界段落。保留失败日志verify-boundary-dbd5f7f-source-proof-failed.log；新增精确段落marker/SHA记录并同步contractVersion，仍严格复原原始来源SHA，不改原值、默认CSS或降低门禁。新冻结SHA重新全verify。
