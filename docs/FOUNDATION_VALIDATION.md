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
