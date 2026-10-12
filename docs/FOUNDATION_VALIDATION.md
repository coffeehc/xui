# 本轮验证记录

本文件记录通用基础扩展的验证范围；完整规则在 DESIGN.md，覆盖矩阵在 FOUNDATION.md，正式采用接口在 IMPLEMENTATION.md。

本轮基线为 main 的 06946db8de1341c14960a1e5b9cc6252a56c37aa。运行环境为 Linux、Node 24.19.0、Chromium、React 19.2.8、Base UI 1.7.0；声明 pnpm 11.23.0。全部页面使用合成内存记录，没有访问产品或真实用户数据。

## 验证范围

| 检查 | 证据与结论 |
| --- | --- |
| 构建与 tokens | CSS 分片、ESM、types、经典 init；271 个默认变量、无缺失/循环、light/dark/system/reduced/产品覆盖；原始文件仅移除已记录增量即可核对来源 SHA256 |
| 正式消费 | 每次新建独立目录安装 npm pack 的三个 private 包；types/ESM/CSS 正式 exports 打包，无 monorepo 源码入口；foundation 不复制 shared/layout.css；原生不含 React/Base UI，React peers 单实例 |
| 生命周期 | 单测覆盖首次失败/显式重试/empty、同 key 刷新失败保留、A慢B快/换key、取消/销毁后不合作Abort晚到、订阅释放、回调重入、宿主 timeout、CSS失败和取消清理 |
| 主题 | 受控不读写storage，mode/effective分离、请求/确认、JSON保留其他字段、persist:false、OS变化、异常回退；重复 init/销毁重建单监听；useTheme 不创建owner |
| React 契约 | Button ref/render/link/className函数、busy独立、Enter/Space不重复；Field单id/Fieldset独立；Pagination/Disclosure/Select受控与非受控、取消；Tabs capture/bubble/preventBaseUIHandler/RTL/disabled；render异常独立恢复 |
| 公共布局 | 两宿主列表/表单/详情，1280×800/390×844、长中文、200%文字缩放、输入错误回焦点、移动导航Esc/回焦点；公共CSS与API组合 |
| 交互与动效 | 菜单键盘/禁用、Popover关闭回焦点、Tooltip键盘/ARIA、Toast关闭与原生计时暂停恢复；旧代表页面继续检查focus/selected/disabled/readOnly/busy、浅深/覆盖、触屏和reduced-motion |
| 加载真实页面 | 冷启动 app.js 延迟时关键标题/动作位置可读，启动失败显式恢复；工具JS/CSS首次失败重试、刷新保留选择、取消忽略晚到；重工具不在初始静态依赖图 |
| 性能 | 最终 bytesInOutput 排除Button-only中无关Dialog/Tabs等贡献；记录文件+inline脚本及init、gzip、criticalCSS、可选panel；关键锚点位移小于1px，保存PerformanceObserver记录；不声明生产LCP/INP |
| 默认完整 watch | 真正启动watch，修改规范/CSS/TSX/runtime/types/init/构建脚本/包入口；逐次核对产物generation，故意类型失败保留旧产物并显示error，修复后恢复；构建脚本通过新子进程重载 |

## 标准执行与最终证据

预提交标准 verify 已通过：23 项单测、1 项真实默认 watch、40 项浏览器检查，未跳过、无 flaky。随后修正 Node 原子保存监听边界，扩充后的 watch 单项实际再次通过（含 TSX 和 manifest 原子替换后再次编辑）。最终提交后重新执行完整标准 verify；受测 Git SHA、远端 SHA 和 CI 链接在交付中记录，不能用预提交结果替代该执行。运行日志保存在忽略的 .artifacts，浏览器 JSON/trace/合成附件在 test-results；体积原始结果在 .artifacts/performance-baseline.json。这里不会用局部通过替代尚未完成的全量运行。

## 体积基线与门禁

详见 performance-baseline.json，以下为本轮真实独立消费输出。JS gzip 累加独立文件与 inline 脚本的压缩值，包含 theme-init；HTML gzip 另记录，不当作生产网络或 LCP 指标。

| 输出 | minified/实际字节 | gzip 字节 | 门禁 |
| --- | ---: | ---: | ---: |
| Button-only 根入口和/button | 17,351 | 6,588 | 64 KiB / 16 KiB |
| 原生初始JS（含init/inline） | 20,433 | 8,249 | gzip 16 KiB |
| React初始JS（含init/inline） | 336,317 | 110,662 | gzip 128 KiB |
| critical CSS | 37,269 | 6,826 | gzip 16 KiB |

可选面板 entry 单独加载；表中 JS 是初始静态依赖图加初始化，不包含该 entry。metafile 检查最终 bytesInOutput，Button-only 无 Dialog/Tabs/Menu 等实际贡献。冷启动和工具延迟期间主操作锚点位移均小于1px，独立窄屏复核测得0；PerformanceObserver附件记录其他位移，没有宣称全页生产CLS已达标。

## 限制与接入门槛

### 导航与原生通知补充回归

导航旧 hover 选择器优先级高于后置 aria-current=page。四项新增回归在旧代码下均因背景/文字/图标被覆盖失败；修复仅降低 hover 优先级，正式独立 tarball 的 tokens+base+navigation 和完整 style 两入口均验浅深主题、普通/选中 hover、aria-current、native/ARIA disabled、键盘独立焦点，以及指示条/边框/几何。安装 CSS 与本次构建及源码逐字核对，避免旧产物掩盖。

Toast 原合并单项和完整套件在云端通过，未复现用户本机的确切失败；没有访问本机日志。另实测 Dialog 稍后 close 事件可重新还原焦点；hover 未离开时，移出 focus 后仍暂停符合原契约。测试先等待具体 close 事件，并显式检查实际焦点和 hover，再以暂停的可控时钟验证内部焦点迁移、两种暂停重叠、已用250ms/剩余750ms、替换/关闭/销毁，不增加 sleep 或重试。

独立审查还复现系统墙钟回拨导致剩余时间增加；新增墙钟前后跳变回归在旧 Date.now 实现失败，最小修复改为同一所属 window 的单调 performance.now。当前只承诺 hover/focus 暂停，真实后台/文档隐藏调度未测。最终受测提交、标准 verify 和 CI 结果在本次交付中报告。

本轮是通用基础及参考宿主验证，任何产品迁移均未实施。表格排序/查询/选择由宿主拥有，没有数据/虚拟化引擎；日期、复杂图表、富文本/代码编辑器、3D和业务流程不在范围。原生 datalist 允许自由输入；OS select面板、真实移动浏览器、读屏器、Firefox/Safari、SSR hydration、生产冷启动/LCP/INP仍未跑。200%测试改变根字号，不冒称全部原生浏览器zoom已测。

产品重启采用前，固定本轮验证提交，核对公共布局/控件所需覆盖，选定主题单owner与旧CSS层级映射，检查peer单实例，并在该产品跑构建和真实页面验收。示例内存保存不证明业务请求、权限、幂等或失败恢复；那些由宿主另验。

## 数据驱动菜单/布局独立步骤

本步骤基线为本地 6fd20916da7d1d8681bf2bb744c3f9e0bad48c14。新增 runtime/navigation、runtime/menu-layout 与 React/menu-layout 公开入口；两个正式 tarball 消费者共用菜单 JSON、只导入公开组件/工厂与 CSS，不复制菜单内部结构或私有皮肤。原生安装中没有 React；ESM/types 真实编译，Button-only 门禁也排除新增菜单/导航模块的输出贡献。

新增 6 项纯数据/导航适配单测与 16 项浏览器检查。覆盖选中默认皮肤与浅深 hover、分组/子项/独立展开、同址请求/前进后退、普通与修改键/中键/target/download/native bypass、禁用及继承、菜单和 shell/main/input 身份、键盘/Home/End/RTL/按压与独立 focus、受控确认、紧凑/更新/空菜单焦点回退、窄屏触屏/Esc/回焦点/变宽、长中文/200%根字号/reduced-motion，以及卸载销毁重建与无效数据更新保留旧状态。

本步骤标准 verify 覆盖 29 项单测、1 项真实默认 watch 和 76 项浏览器检查；最终受测提交和通过/失败状态在独立交付记录。日志位于 .artifacts/verify-menu-final.log，浏览器 JSON 位于 test-results/browser.json。前一版完整预提交验证通过，最终提交后仍须完整重跑，不用局部菜单检查代替全量结果。

这是合成宿主验证，没有实施产品迁移，没有调用产品后端；HTTP/query 与 API Key 组件尚未实现。200%测试为根字号变化，触屏为 Chromium 模拟；真实移动 OS、读屏器、浏览器原生 zoom、Firefox/Safari 和 SSR hydration 未跑。本步骤未新增独立代理审查。断点转换时 React sidebar 可重挂载，布局保留菜单事实，不宣称任意宿主路由链接的私有状态跨断点保留。

## HTTP/query 独立步骤

本步骤基线为本地 0df5116f41600c7634177c06c07ce24589e9543c。通过正常 Git 读取固定 httpx/commons/xagent 来源，完整合同与 SHA 见 [HTTP.md](HTTP.md)。新增 runtime/http、runtime/query 公开 ESM/types 入口；两类正式 tarball 消费者复用同一 typed endpoint model，原生消费不加载 React。默认 Go AjaxResponse/ListData 精确字段；不猜 data/msg/items 别名，payload=null 合法，只有显式投影把 nil list 转为空数组。

新增 14 项 HTTP 与 6 项 query 单测，覆盖模式、成功 code 适配、严格字段、request id、固定安全错误、provider/body 全程预算、非合作取消、已知失败状态读取异常、401 单 owner/epoch、403 与业务错误、销毁、默认无重试、写操作拒绝重试、有限幂等读重试与 Retry-After、显式页码基数/上限、白名单排序/过滤、编码、int64/时间、nullable list 和未请求总数。相对文档链接另有一项单测。

新增 10 项浏览器检查，每类消费者 5 项。一个真实 loopback fetch 场景核对合成 Go 响应及 exact URL query、分页/筛选/排序；其余 route fixture 检查刷新失败保留旧数据、显式重试、取消/超时、迟到结果隔离、401/403/business 区分、nil list、unsafe total、恶意文本、窄屏主操作、无水平溢出与卸载。这些 fixture 不包含真实凭据、不连接产品后端。

本步骤标准 verify 纳入 50 项单测、1 项默认 watch 和 86 项浏览器检查，并包含 token 一致性、根类型检查、独立打包消费及按需门禁。最终受测 SHA、退出状态和通过数量随独立提交交付，完整日志位于 .artifacts/verify-http-final.log；浏览器 JSON 位于 test-results/browser.json。断开通知后真实 shell、Git 对象检查和重新构建已成功，最终仍在同一提交完整验证。

采用手册见 [ADOPTION.md](ADOPTION.md)，有实际入口、组件/数据/行为/扩展点、标准页面与保留业务功能后清理重复 owner 的迁移清单。API Key、结构化日志与接入 skill 继续独立步骤；本次没有实施产品迁移、真实后端集成、推送、部署或包发布。未新增独立代理审查；真实移动 OS、读屏器、浏览器原生 zoom、Firefox/Safari、SSR hydration 和生产性能仍未跑。


## API Key 通用管理独立步骤

本步骤基线为本地 beb63559fb1c832cd920e87abde56aaaf1fb3a81。共享 runtime/api-key 控制器、runtime/api-key-dom 原生完整工厂与 React/api-key 组件提供脱敏列表、宿主声明的创建选项、一次性结果、明确复制和撤销确认；类型、默认行为、宿主边界与安全限制见 [API_KEY.md](API_KEY.md)。两类正式 tarball 示例共用 typed 假数据模型及 labels，只消费公开 CSS，原生不安装 React。没有生成真实 key 或访问产品服务。

新增 10 控制器单测，覆盖精确元数据 allowlist/nullable/不可变、配置/权限/有效期、读取失败保留与取消/替换/销毁、基础与宿主字段验证、重复提交防护、一次性引用与安全快照、无效结果/固定错误/默认不重放、关闭后不合作 producer 迟到隔离、撤销确认/失败/非 void 拒绝/取消/成功、明确复制/失败/迟到完成与销毁。新增 14 浏览器检查，每宿主 7 项：默认元数据与禁用、验证/键盘/声明选项、一次性结果/明确复制、不存 URL/storage、列表失败/空/重试、创建错误和关闭竞态、撤销确认/失败/取消/真实完成后状态/回焦点、剪贴板失败/关闭/卸载、恶意文本/长中文/窄屏/200%文字/浅深与 reduced-motion/Tab/Esc。

初轮发现背景 aria-hidden 导致撤销用例错误查找，已改为弹层中查共享事实、关闭后查按钮；React peer 的 focus guard 需要等待焦点回到控件，不增加 sleep/retry。真实 shell 复现原生 Tab 到 body，公共 Dialog controller 增加边界循环与重开后迟到 close 防护；关闭后原生复制提示也清空。14 项组件浏览器检查已通过，最终仍在独立提交完整标准 verify。

标准 verify 纳入 60 项单测、1 项真实默认 watch 与 100 项浏览器检查，另含 271 token 一致性/无循环、根类型、构建、十个正式预览及独立 tarball/types/按需门禁。最终受测 SHA、退出码和通过数量随独立提交交付；完整日志 .artifacts/verify-api-key-final.log，浏览器 JSON test-results/browser.json。

这些是合成数据和模拟 Clipboard 检查，不证明真实后端鉴权/密钥安全/幂等或 OS 剪贴板行为；不声称 JS 安全擦除或剪贴板撤回。真实移动 OS、读屏器、原生浏览器 zoom、Firefox/Safari、SSR hydration、生产性能及新增独立代理审查未跑。没有产品迁移、推送、部署或包发布；结构化日志与最终手册/接入 skill 仍为后续独立步骤。

## 独立结构化错误观察步骤（非业务日志）

用户后续明确日志目标是可随时调取查阅的业务记录。下面保留此前错误观察步骤的历史证据；这些结果不能当作业务日志交付。业务日志独立合同见 [BUSINESS_LOGS.md](BUSINESS_LOGS.md)。

本步骤基线为本地 6f2006614c626ca841416695ea00f63a54a93026。通过正常 Git 读取 commons@b0bc0f9 的 service/query/record/extension/README 完整合同；固定 SHA、拟议 DTO/HTTP facade 与宿主边界见 [LOGS.md](LOGS.md)。runtime/structured-log 控制器和类型被 React/structured-log、runtime/structured-log-dom 共用；两类完整正式 tarball 消费者共用 typed fake facade/labels，仅导入公开 CSS，不用源码 alias，原生不安装 React。只读分组/观察/精确详情，没有投递运维、删除、重放或全文系统。

新增 10 项逻辑测试：严格 v1/list 与 uint64 字符串/nullable/三态/不可变投影；实际 filter/UTF-8/纳秒半开时间边界；四操作显式 Go envelope 请求；cursor/as_of/循环与已访问摘要段回退；失败下一段重试和刷新保留原事实；不合作 producer 的取消/替换/无效过滤/销毁；累计/命中/首次代表与 group_id；403/404/过期区分；详情 ID、关闭和迟到隔离；宿主安全对象映射及明确复制。返回上一段使用缓存，不重发空 cursor 创建新快照。

新增 12 项浏览器检查，两宿主各 6 项：累计/过滤命中与首次代表、大整数完整显示；cursor 新提交排除/刷新和缓存上一段；真实 filter/时间区间/无假 request-id 搜索；单记录权限/缺失/过期与显式复制/对象映射/回焦点；读取失败保留、重试和取消/迟到隔离；自由文本不执行、长中文、窄屏主操作、dark/200%文字/reduced-motion/Tab/Esc 和卸载清除详情。详情默认显示 record/group ID、发生/记录时间、operation 和独立三态标记。

标准 verify 纳入 70 项单测、1 项真实默认 watch 与 112 项浏览器检查，另含 271 token 单源/无循环、根类型、构建、十二个正式预览、独立 tarball/types/按需贡献门禁。最终受测 SHA、退出码和实际通过数量随独立提交交付；完整日志 .artifacts/verify-log-final.log，浏览器 JSON test-results/browser.json。文档链接检查与全部公开构建入口同步纳入验证。

这些结果是合成 fetch/模拟 Clipboard 的展示合同与生命周期验证。未实现或验证生产后端 facade、Go/PostgreSQL、真实鉴权/tenant 隔离/脱敏、OS 剪贴板、产品迁移或新增独立代理审查；真实移动 OS、读屏器、原生浏览器 zoom、Firefox/Safari、SSR hydration 与生产性能仍未跑。没有推送、部署或包发布；最终手册与仓库接入 skill 继续独立收口。

## 业务日志、手册与 skill 收口

用户已纠正日志目标为可随时调取查阅的业务记录。本步骤在保留上述错误观察代码/历史的基础上新增 runtime/business-log、runtime/business-log-dom、React/business-log。固定公共日志字段与 event_type/schema_version、独立领域 JSON payload、显式 list/detail loader；完整合同见 [BUSINESS_LOGS.md](BUSINESS_LOGS.md)。合成两宿主覆盖 user/agent/service、四种结果、已知/未知 payload 版本与安全回退，不强制 before/after 或把 severity 冒作业务结果。

新增 11 项日志单测和 12 项浏览器检查；既有 API Key/错误观察新增 6 条控制器重入回归及 2 条同步清空保留 DOM 节点的浏览器回归。全套 87 单测、1 默认真实 watch、126 浏览器检查，另含 token 单源/无循环、根 types、48 全部公开入口的独立安装 ESM/CSS/init/types/运行导出与14正式页面消费、peer/按需/体积门禁。实际冻结 SHA 标准 verify 的数量和状态随最终交付给出；完整日志 .artifacts/verify-final.log，未用预提交局部结果替代全量执行。

三项独立只读审查的实质发现、修复/旧代码失败证据、源码/正式声明核对，以及四个 skill 接入任务见 [FINAL_REVIEW.md](FINAL_REVIEW.md)。仓库 skill 具备正式 frontmatter 和 UI 提示，不装到用户电脑；手册强调 agent-ready、领域 API 独立测试，以及先接 xui/随后逐项目替换 baseservice 的螺旋升级，不新增后端或运行配置组件。

真实后端 adapter、权限/tenant/脱敏/日志可靠性及产品迁移未实施，不承诺不可篡改或日志事务成功。真实移动 OS、读屏器、Firefox/Safari、SSR hydration、原生 browser zoom 和生产性能未跑；Clipboard/触屏/字号缩放限制保持。最终正常 push 与同 SHA CI 仅在本轮完整验收后执行；首次 CI 的三个浏览器失败及追加修正见 [FINAL_REVIEW.md](FINAL_REVIEW.md)。包仍 private、不部署不发布。


## 配置登录与三层设计哲学收口

追加步骤基线为已推送的46caeb75，首次CI三个浏览器失败的普通修复提交5c24fcd保留。新增runtime/auth、runtime/login-dom、React/login、theme/auth.css，统一严格cookie会话v1三路由与配置登录页；真实xAgent源协议差异与后端责任见[AUTH](AUTH.md)。两类合成示例共用品牌名称/logo/说明/文案配置和同一HTTP/auth模型，消费正式tarball，不复制私有页面CSS。

原子→组合→页面设计哲学由[FOUNDATION的单一架构章节](FOUNDATION.md#组件层次与扩展原则)定义，README、手册、实施映射和仓库skill均引用该源。普通项目填数据和配置采用整页，特殊业务通过公开原子/组合及扩展接口，不修改组件内部渲染；业务API、权限/tenant和核心执行保持独立，xui不等待baseservice。

新增9项认证逻辑检查和14项浏览器回归，涵盖严格DTO、固定方法/路径/body、共享401通知隔离、登录退出/currentUser一致、错误安全、防重复、不合作取消与超时/迟到、回跳规范化和已知凭据参数、三主题/键盘/focus/reduced-motion、390px/200%/后备字体/126字配置、pagehide/卸载清空保留密码节点。独立审查发现长品牌或动作压空正文P2；修复后增加同时126字品牌+120字动作配置回归，正文有可用空间、按钮在视口内、完整文字可滚动且登录可执行。品牌单独的正式tarball复核为正文326px/按钮bottom655≤720；同时长动作的dev预览复核为正文254px/同样bottom655，最终正式消费仍由整套verify确认。

全套纳入96单测、1真实默认watch、140浏览器检查；52全部公开入口(theme14/runtime17/React21)和16正式页面的独立安装ESM/CSS/init/types/实际导出、peer/按需/体积门禁。watch真实启动同时验证登录CSS与日志参考资源，新增入口也排除在Button-only实际贡献之外。冻结SHA完整verify、正常推送和同SHA CI实际状态随交付报告；详细首次失败、定位器修正与复核见[FINAL_REVIEW](FINAL_REVIEW.md)。

真实Cookie签发/撤销、安全属性、CSRF/CORS、鉴权、tenant与真实业务/日志后端均未实现或集成验证。注册、重置、SSO和完整用户管理是后续组合，不声称基础系统全部完成或任何产品已迁移；原有真实移动OS/读屏器/其它浏览器/原生zoom/SSR/生产性能未跑限制保持。包private，不发布不部署，不改许可证/可见性或其它仓库。

最新用户澄清：业务日志用于随时查询，早期BusinessAudit名称统一改为BusinessLog、business-log公开入口和两示例路径，原控制器/字段/payload安全与权限边界保持在同一实现内，不增加重复页或正式审计保证。独立程序错误观察仍为原LOGS用途。baseservice收敛日志能力及取消auditservice不在本轮实施范围，前端可先接现有typed loader；重新冻结提交与全套验收，以本轮最终交付为准。


## 公共能力与默认原生页面API

阶段基线为5adbf5c，源合同与逐项范围见[PAGE_APIS](PAGE_APIS.md)、[COMPOSITIONS](COMPOSITIONS.md)及[最终审查](FINAL_REVIEW.md#公共能力与原生页面api补齐)。不改DESIGN受控271变量或其它仓库。已实现默认API Key/业务日志HTTP适配、下载与安全结构化错误、三种弹层组合和条纹/展开/sticky表格，两类新消费者只消费正式包与公开CSS。

定向20/20、全部116单测、typecheck、正式tarballs/types/ESM/CSS/init检查通过；新增浏览器初轮10/12的两个定位器问题按公开button/summary语义纠正后12/12通过。五个独立可复现P2修复与回归详见FINAL_REVIEW。当前完整门禁为59入口/18消费者/116单测/1默认watch/152浏览器；最终SHA全verify和CI结果由实际交付记录，不拿合成消费者当产品迁移或后端集成。真实Cookie/CSRF/CORS/tenant/鉴权/生产日志与密钥服务、其他浏览器/读屏器/真实移动OS/原生zoom/SSR/生产性能仍未跑。

## 附件采用反馈 XUI-01～09 的公共库阶段

基线a03f93a2e15dcdfa05396918293b2ab57028f84a已正常推送、同SHA CI成功；用户随后明确授权附件全部公共库改动并测试后推main。来源规范0.5.1/原始SHA和271默认CSS字节保持，新增样式只引用既有变量；root仅指向规范，无新许可证、发布、部署或其它仓库改动。

| 编号 | 公共结果 | 验证与保留的边界 |
| --- | --- | --- |
| 01 下载 | 既有safe headers/filename、requestDownload/saveDownload，延续8241e56 | 真实浏览器文件名/字节、取消和Unicode合成测试；产品授权/CORS/服务端未集成 |
| 02 安全端点错误 | 既有显式error adapter与HTTP事实，OAuth/第三方协议独立 | 不强迫AjaxResponse，不透出description/body或凭据；行业标准真实provider另验 |
| 03 原生origin | nativeOrigin+fetch bridge，scheme/host/port tuple，强制redirect:error | wails合成status/401/取消/下载/外部目标拒绝；Darwin/Linux/Windows真实窗口未跑 |
| 04 登录slots | beforeFields/afterFields、beforeSubmit/actions，同auth/theme owner | local/LDAP配置、标准动作等待、取消迟到/密码清理/当前错误；只有合成动作，无真实LDAP/SSO/backend |
| 05 布局滚动 | 默认document兼容，显式有界viewport与独立sidebar/main | 24项菜单、history、草稿/DOM/scroll保持；窄屏/200%/focus，产品每route恢复策略留宿主 |
| 06 表格状态 | stripe/expanded/selected/hover保留底层opaque背景，stickyHeader/逻辑列 | 三主题alpha覆盖与横纵滚动，选中优先、焦点/边界；数据/排序/展开事实由宿主 |
| 07 新组合 | 所列Command、Calendar、ToggleGroup、Avatar、ScrollArea、InputGroup、Accordion及弹层/子菜单 | 各项公开React/native合同见WIDGETS/COMPOSITIONS；不把文本/OS datalist当日期/搜索选择等价，不含业务引擎 |
| 08 link外观 | link variant及正确a role/nativeButton合同 | Space不点击、Enter与target实际popup，保留既有modifiers/ref/默认type门禁 |
| 09 choice | controlSize独立select.size，readonly防click/Space/radio箭头且可focus | controlled/default、disabled、字段关联和尺寸；不增加密度或copy样式桥接 |

定向构建/根types、全部68公开入口(theme16/runtime22/React30)的正式ESM/CSS/types/init消费、20参考页面、13项新增单测、31项新浏览器检查以及1项Vite cold/warm/include回归已通过。浏览器初轮12/25失败保留：其中真实link Space激活、React跨月焦点、动作选择不适合重复执行已修；其余准确限定status/region/password locator、force触发disabled guard、等待原生PageDown真正完成、遵循peer可聚焦disabled与无高亮状态。后两轮3/27、2/27失败与修复日志保留，最终定向31/31。没有降低可访问性/对比度/尺寸阈值、隐藏错误或禁动画来取绿。

独立只读审查还用源内存转译及Chromium复现并修复：日历原子快照/订阅重入/邻月焦点/非法构造恢复，旧widget句柄销毁与更新、扩展无reason拒绝/旧auth错误、首次ArrowUp与chip删除后焦点。受控删除确认前不挪焦点，已转外部则不抢回。该审查不冒充正式构建；最终源码复核未见残留P1/P2，根整套验收与同SHA CI另以交付日志记录。

标准verify现在预计129单测、1默认watch、1Vite冷启动回归、183浏览器检查，并核271默认token与68入口/20参考页。最终冻结SHA整条命令未完成前不称完整通过。未跑真实产品Cookie/CSRF/SSO/API Key/业务日志backend、3OS Wails、其他浏览器/读屏器/真实触屏OS/浏览器zoom、全SSR或生产性能。仅最小独立SSR handler对照与Vite因果夹具完成；真实用户冷启动现场仍未确认。
