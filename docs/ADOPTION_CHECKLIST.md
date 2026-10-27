# xui 项目接入逐项验收清单

本清单用于新接入、升级、自查的改造前、实现中及交付前逐项核对，执行顺序统一见[接入手册](ADOPTION.md#新接入与升级的统一执行流程)。当前设计版本以固定 SHA 中的 [DESIGN.md](DESIGN.md)（4.2.41）、[PUBLIC_API.md](PUBLIC_API.md)、[COMPONENTS.md](COMPONENTS.md) 和正式 types 为唯一合同源；本表只把接线与验收拆成可重复检查的项目，不复制 token 默认值、DTO 或再定义一套设计系统。发现合同冲突时记录失败并交由 xui 维护者确认，不由消费项目自行发明合同。

## 使用与报告规则

1. 固定并记录 xui 完整 Git SHA、DESIGN 版本、三个包版本、正式归档 manifest/SHA256SUMS/sourceGeneration、tarball 的 SHA-256 和安装锁文件解析结果。三个包必须来自同一源码构建；升级还须记录当前到目标的合同差异。
2. 先按[影响范围](ADOPTION.md#按影响选择执行范围)选择本次适用ID，覆盖每一个受影响页面实例、组件实例和API操作；同一组件出现在两个受影响页面时是两个被测对象，不能用一个示例代替。定向任务不遍历整表为无关项逐条填不适用，在范围摘要说明排除依据即可；已纳入的适用项未测仍须记未跑。
3. 每条状态只能是 `通过`、`失败`、`未跑`、`不适用`。`不适用`须附真实业务不存在或明确范围排除的证据；没实现、缺数据、没测、环境阻塞均记`未跑`或`失败`，不可记不适用。
4. 对公共能力缺口，状态记`失败`，责任 owner 记`xui`，附公开入口、最小复现及需要补齐的合同；消费方不得用私有 DOM、私有 CSS、`!important` 或第二套交互掩盖。
5. 每行证据必须指向此次固定产物上的真实消费源码、浏览器/Network 记录、自动化执行结果或后端 handler/合同测试。测试文件存在、样板通过、截图好看或旧版本通过均不能单独证明产品页面通过。
6. 每个使用中的具名 slot 都要按实际“页面/组件实例 × slot”单独检查；报告必须分别记录归属/API、填入内容、视觉语义与 token 角色、排版/对齐、空槽行为、适用状态、滚动与焦点归属。一个组件样板不能代表所有页面实例。
7. 实施前保存授权范围内的完整页面/组件实例/运行入口清单和 slot 映射，交付前提交逐项矩阵，至少包含：`ID、对象/页面/组件实例/slot/API、状态、期望、实际、证据、责任 owner`。不得以“符合 xui”“组件已复用”或按章节汇总代替逐行结论。适用失败项或实际页面验收未跑时，不宣布完整接入/升级验收通过。
8. 同一构建的产物、peer和共享入口证据可以验证一次并引用，仍须验证各页面自己的slot/状态/请求接线。选择必要构建/类型和受影响回归，不以本表要求无关全套测试；共享变化或关联失败按影响补验，不重复仍适用的同代证据。Toast、复制与业务日志列表按[定向适用表](ADOPTION.md#toast-与复制及业务日志列表定向升级)分别选择TOAST-005～006、STATE-COPY-001～002、BIZ-LIST-001～008，不捆绑三项或新增业务；BusinessLogExplorer整页换语言按BIZ-LABEL-001～006，不以list cell验收代替整页；StructuredLogExplorer定向流程见[skill专项](../.agents/skills/adopt-xui/references/structured-log.md)，判定仍用下文LOG-QUERY-001～008。

## 新接入与升级的流程门禁

以下门禁与本次命中的组件/API检查一起执行；每个受影响页面、slot的具体判定仍使用对应ID，不以流程门禁通过替代实例验收。定向升级、主题专项及只读任务按授权范围使用清单，不自动实施完整迁移。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| FLOW-001 | 新接入、升级或接入自查开始 | 明确授权边界，列全范围内路由/嵌套视图/表单/详情/弹层及 Web/Desktop/embed 入口，无首页抽样代替全页清单 | 项目实际路由/入口/调用点与逐页实例清单对照；排除项有范围依据 | [ADOPTION 范围与产物](ADOPTION.md#确定范围与固定产物) |
| FLOW-002 | 确定接入或升级目标 | 目标正式归档、实际安装与固定合同一致；升级另有旧到新的合同差异与保留/迁移/移除记录，不猜最新版 | 固定产物校验、安装解析、差异表及既有自定义主题/业务保留记录 | [ADOPTION 范围与产物](ADOPTION.md#确定范围与固定产物) |
| FLOW-003 | 实施某个页面前 | 每个组件实例的内容映射到正式 slot/part、文字/色彩角色、状态、滚动/焦点 owner 及适用检查 ID；源码没有的 slot 不冒充已提供 | 页/实例/slot 映射、正式类型与对应逐项报告 | [ADOPTION layout 与 slot](ADOPTION.md#逐页建立-layout-与-slot-映射) |
| FLOW-004 | 发现公共缺陷、缺失 slot 或增强需求 | 列明固定版本、入口/消费位置、场景与最小复现、影响、公开替代及验收条件，责任交给 xui；宿主不复制/补丁公共组件 | 逐项失败记录、公共缺口材料与未依赖缺口的工作结果 | [ADOPTION 缺口归属](ADOPTION.md#接入合规与公共缺口归属) |
| FLOW-005 | 实施后验证产品页面 | 每个实际页面/运行入口以目标正式包验证适用状态、主题、宽窄、文字/真实浏览器缩放、键盘/指针、请求和刷新连续性；不以库样板代替 | 实际产品构建、逐实例浏览器/Network/节点身份与几何记录；阻塞项记未跑 | [ADOPTION 实际验收](ADOPTION.md#实际页面验收) |
| FLOW-006 | 宣布接入或升级完成前 | 页面/slot/API 矩阵无遗漏，失败/未跑/不适用有依据与 owner；仍有适用失败或实际页面未验则仅报告部分完成，提交/推送/发布/部署不越授权 | 项目既有接入报告、完整矩阵、缺口与实际交付记录 | [ADOPTION 交付条件](ADOPTION.md#交付与完成条件) |

## 固定产物、运行时与主题

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| ART-001 | 锁定 xui 依赖 | 记录完整不可缩写的源码 SHA 和 DESIGN 版本 | lockfile、Git SHA、DESIGN 元数据 | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) |
| ART-002 | 安装 xui 三个包 | React、runtime、theme 均来自同一固定 SHA 的正式包 | tarball SHA-256 与构建清单 | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) |
| ART-003 | 打包 React 页面 | 组件从正式 ESM exports 解析，无 packages/src alias | bundler 配置和 resolved module 路径 | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) |
| ART-004 | 构建产品 UI | 所有产品 UI 从 React/ReactDOM 入口构建，manifest 与 bundle 中不引用 runtime DOM UI exports | exports manifest、源码 import graph、production bundle manifest | [ADOPTION React 唯一公共 UI](ADOPTION.md#react-是唯一公共-ui) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) |
| ART-005 | 打包包含 React 的页面 | React 只有宿主单实例，未被 xui 二次打包 | bundler stats / module graph | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) |
| ART-006 | 打包 React DOM 页面 | ReactDOM 只有宿主单实例 | bundler stats / module graph | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) |
| ART-007 | 打包 Base UI 弹层页面 | Base UI 只有宿主单实例，Dialog/Popover 等未嵌套另一份 peer | lockfile 与 bundle module graph | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) |
| ART-008 | 编译正式消费者 | 使用安装包 `.d.ts` 成功编译真实页面和公开类型 | 独立 tarball consumer 编译日志 | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) |
| ART-009 | 加载主题 CSS | 只导入正式 CSS，未依赖消费者 Tailwind 扫描 xui 源码 | CSS import 与生产 CSS manifest | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) |
| ART-010 | 文档首次可见前初始化主题/缩放 | 只加载固定 SHA 的正式 `@coffeehc/xui-runtime/init.js`；先于 CSS 和可见内容执行，仅预绘制根元素主题/缩放属性，不创建 ThemeController | HTML/script resolved path、首屏 Network 顺序、window.xuiTheme创建时序与根属性记录 | [ADOPTION 主题单一所有者](ADOPTION.md#主题单一所有者) |
| THEME-001 | 首次无有效主题偏好 | `bootstrap` 以 config `theme.mode` 建立默认 mode；有效 sessionStorage `ui.theme.mode` 优先于该默认 | config、sessionStorage、ThemeState.mode/effective 与页面 computed theme | [DESIGN 三层 Token](DESIGN.md#三层token的工程约束) · [PUBLIC_API 启动服务](PUBLIC_API.md#启动配置与应用服务) |
| THEME-002 | 用户切换主题 | mode 由单一受控 owner 确认并保存到合同规定的 sessionStorage key | Storage 面板及 mode/effective 记录 | [DESIGN 三层 Token](DESIGN.md#三层token的工程约束) · [ADOPTION 主题 owner](ADOPTION.md#主题css-与单-owner) |
| THEME-003 | 在同一标签页刷新 | 已保存主题恢复，页面不先闪到另一主题 | Performance 截图/录屏与 sessionStorage | [DESIGN 三层 Token](DESIGN.md#三层token的工程约束) · [ADOPTION 主题 owner](ADOPTION.md#主题css-与单-owner) |
| THEME-004 | 主题设为 system 且系统配色变化 | 页面响应媒体变化；不得另有第二个媒体监听/持久化 owner | 事件监听与主题状态记录 | [DESIGN 三层 Token](DESIGN.md#三层token的工程约束) · [ADOPTION 主题 owner](ADOPTION.md#主题css-与单-owner) |
| THEME-005 | 主题 storage 不可用或无效 | 按 runtime 合同回退并保留内存交互，不崩溃或伪称已持久化 | 注入失败测试和可见页面状态 | [DESIGN 三层 Token](DESIGN.md#三层token的工程约束) · [ADOPTION 主题 owner](ADOPTION.md#主题css-与单-owner) |
| THEME-006 | 主题或组件引用 `palette-*`、base 字体/间距/圆角等原始变量 | 原始层只在集中主题配方/映射中使用；页面和组件只读语义/组件层变量，不直接读 palette | CSS/TS 引用图及 `checkTokenLayers` 结果 | [DESIGN 三层 Token](DESIGN.md#三层token的工程约束) · [ADOPTION 主题 owner](ADOPTION.md#主题css-与单-owner) |
| THEME-007 | 增加或覆盖 token | 跨层依赖严格单向 base → semantic → component；同层只允许可展开的单向别名，无反向跨层引用或循环 | token graph 与脚本检查结果 | [DESIGN 三层 Token](DESIGN.md#三层token的工程约束) · [ADOPTION 主题 owner](ADOPTION.md#主题css-与单-owner) |
| THEME-008 | 产品需要品牌/组件视觉差异 | 单一集中主题 owner 映射公共 token；不复制公共默认值或在页面/组件另写色板、尺寸、状态色 | theme.css diff、CSS grep 与实际 computed token | [DESIGN 三层 Token](DESIGN.md#三层token的工程约束) · [ADOPTION 主题 owner](ADOPTION.md#主题css-与单-owner) |
| SCALE-001 | 默认与设置入口 | 无存储时100%；设置仅用同一公开方法，支持1/1.25/1.5/2，不另设第二主题/比例 owner | 入口导入、运行时DOM及比例记录 | [DESIGN 界面缩放](DESIGN.md#公共界面缩放) · [ADOPTION 使用方法](ADOPTION.md#界面缩放与会话恢复) |
| SCALE-002 | 同标签页恢复 | `ui.interface.scale` 有效值优先于 config `theme.scale` 默认；init.js在CSS/body前只恢复根元素预绘制值，不通过effect制造首屏跳变 | 首次绘制、reload、config与sessionStorage逐项记录 | [DESIGN 界面缩放](DESIGN.md#公共界面缩放) · [ADOPTION 使用方法](ADOPTION.md#界面缩放与会话恢复) |
| SCALE-003 | 异常存储与参数 | 读失败/非法保存值保持默认；写失败当前页仍应用；非法方法参数在DOM/存储写入前报错 | 异常注入与断言 | [DESIGN 界面缩放](DESIGN.md#公共界面缩放) · [ADOPTION 使用方法](ADOPTION.md#界面缩放与会话恢复) |
| SCALE-004 | 比例切换中的交互 | 草稿、节点、焦点、选区保留；没有Document导航或业务请求；不重挂正文 | DOM身份、activeElement、选区及网络记录 | [DESIGN 界面缩放](DESIGN.md#公共界面缩放) · [ADOPTION 使用方法](ADOPTION.md#界面缩放与会话恢复) |
| SCALE-005 | 放大布局与可达性 | 浅深system、宽窄、长中文、表单/弹层重排和全部动作可达；根字号和CSS zoom无第二owner | 各倍率几何、键盘操作与截图 | [DESIGN 界面缩放](DESIGN.md#公共界面缩放) · [ADOPTION 使用方法](ADOPTION.md#界面缩放与会话恢复) |
| SCALE-006 | 缩放证据区分 | 界面比例、用户字号与真实浏览器zoom分别记录；sessionStorage复制/关闭语义不冒充跨会话持久化 | 实际环境和独立验证记录 | [DESIGN 界面缩放](DESIGN.md#公共界面缩放) · [ADOPTION 使用方法](ADOPTION.md#界面缩放与会话恢复) |

## 启动、配置与基础 Service

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| BOOT-001 | 浏览器应用首次挂载 | 在 React root/render 前调用一次 `bootstrap(overrides, environment)`，取得同一个 `XuiApplication.config/services` | 入口调用顺序、React mount时间和返回实例身份 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| BOOT-002 | 调用浏览器 bootstrap | 同步配置期间没有登录、refresh、session、XHR/fetch 或隐藏配置请求 | Network记录及service状态调用轨迹 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| BOOT-003 | 运行依赖需要 Window、writer、HTTP/Auth 实例或函数 | 通过第二参数 `BootstrapEnvironment.services` 注入；不放入 JSON config 或 config.json | bootstrap调用点和配置对象字段审查 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| BOOT-004 | 浏览器不存在或需 SSR | 使用请求级 `new XuiServices(options, environment)`，bootstrap 不伪造浏览器全局 | SSR请求隔离测试、Window依赖调用栈 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| CONFIG-001 | 安装正式 runtime 包 | 默认 JSON 通过 `@coffeehc/xui-runtime/config.json` 可读取，bootstrap默认从包内置配置解析且没有远端配置请求 | tarball文件、config export resolved path与Network | [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [默认配置](../packages/runtime/src/config.json) |
| CONFIG-002 | override传入已知普通对象的部分子字段 | 仅覆盖提供字段；对象递归合并，未给同级默认值保留 | config默认值、部分override及解析后对象对照 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| CONFIG-003 | override传入数组 | 数组整体替换默认数组，不按索引合并 | 默认/override/解析结果三份数组对照 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| CONFIG-004 | override有值为 `undefined` 的对象属性 | 该属性不覆盖随包默认值 | descriptor夹具与解析结果 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| CONFIG-005 | 已知配置对象出现schema之外的字段 | `resolveConfig`/bootstrap明确拒绝未知字段，不静默丢弃 | 单个未知键正反向夹具和错误路径 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| CONFIG-006 | 配置含函数、循环对象、访问器或非JSON实例 | 解析拒绝；运行时对象必须转到第二参数注入 | 各类非JSON输入及错误结果 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| CONFIG-007 | `extensions` 携带宿主自有配置 | xui仅接受JSON值，不解释领域键；宿主在自身边界校验其业务schema | extension schema owner与输入/错误记录 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| CONFIG-008 | 维护 config.json、override、extensions | 不保存访问/刷新token、密码、cookie、私钥等secret；认证secret走其明确运行时/浏览器owner | 打包配置及仓库敏感配置审查，不以解析器测试代替 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| SERVICE-001 | 同一 Window重复执行相同 bootstrap | 复用已配置的注册表和服务owner；不并行创建第二套HTTP/Auth/Theme等实例 | 前后实例引用、监听数与请求数 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| SERVICE-002 | 同一 Window已有注册表但再次传入冲突配置/不同service | bootstrap/registry明确拒绝冲突，不静默重配或换owner | 冲突输入与错误、既有owner身份 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| SERVICE-003 | 取得 HTTP service 且没有 bootstrap HTTP配置或注入实例 | `getHttpService()` 明确失败，不自动猜baseURL/凭据 | 空注册表调用和错误类型 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| SERVICE-004 | 取得 Auth service 且 `auth.enabled=false` | 不创建认证owner；显式注入Auth与禁用配置组合时启动拒绝 | service getter、network零请求及错误结果 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| SERVICE-005 | `auth.enabled=true` 使用默认Auth service | AuthClient绑定同一注册表HTTP实例；没有第二fetch/token store/401 owner | HTTP/Auth实例身份与Protected请求trace | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| SERVICE-006 | bootstrap/XuiServices收到 `{instance}` 借用服务 | registry可提供该实例但dispose不调用其destroy/dispose | 借用实例析构spy和registry释放轨迹 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| SERVICE-007 | registry以 `{options}` 创建所属服务 | 所属服务由同一个registry生命周期释放；视图卸载不能提前dispose | 服务资源计数与应用关闭前后状态 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| SERVICE-008 | SSR并发处理多个请求 | 每请求创建隔离 `XuiServices`；Auth/HTTP/config/route/i18n状态不跨请求共享 | 并发请求使用的实例ID和secret隔离记录 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| SERVICE-009 | 应用退出或文档owner结束 | 从 `/bootstrap` 窄入口导入 `disposeXuiServices(window)` 释放该Window registry；同Window可重新启动、重复释放安全、借用实例保留，不让组件卸载销毁共享服务 | owner destroy计数与多个view卸载对照 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| THEME-009 | 有有效 sessionStorage 主题且 config 默认值不同 | 恢复存储偏好，config只作为无效/缺失偏好时的默认；显式受控 `ThemeOptions.mode` 单独按受控合同测试 | init前后root属性、bootstrap ThemeState、storage值 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| THEME-010 | 加载 `@coffeehc/xui-runtime/init.js` | 首绘脚本不创建 `window.xuiTheme`/ThemeController；正式owner由bootstrap/getThemeService建立 | 运行脚本后、bootstrap前后owner实例与ThemeState | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| THEME-011 | document根替换/同html公共属性清空，含hydration恢复 | 同一默认ThemeService恢复当前mode/effective/preset/scale；逻辑未变时State对象/订阅/偏好不变，零storage读写及请求；之后setMode/syncMode/setPreset与system继续有效，无第二Observer/owner | 根身份、前后属性/computed、State/服务identity、偏好/通知/请求计数，真实hydrateRoot与模式/缩放 | [恢复合同](PUBLIC_API.md#主题根节点恢复4238) |
| THEME-012 | storage拒绝、临时无root、销毁/重新启动 | 内存最后有效scale及受控确认保留；临时空根不崩溃，插入恢复；destroy断开DOM/media观察，迟到不写，按原bootstrap释放后重建规则启动；宿主SCRIPT mismatch单独修复 | 异常/插入/系统变化/销毁迟到及无循环证据；未支持Observer环境明确限制 | [恢复合同](PUBLIC_API.md#主题根节点恢复4238) |

| SCALE-007 | 有效 sessionStorage scale 与 config `theme.scale` 不同 | 首绘与bootstrap都采用已保存scale；config仅提供无有效存储值时的默认 | init前后document scale属性、bootstrap后值和storage | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| I18N-001 | 默认 config启动且未启用i18n | 服务初始locale为配置 `defaultLocale`，切换开关为false；顶栏语言入口不被默认为已启用 | config、I18nState与实际入口DOM | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| I18N-002 | 产品需要非默认翻译 | 由宿主config `messages` 或已声明locale的 `registerMessages` 提供；不得宣称xui自带全量翻译词典 | 实际messages来源、catalog条目与固定包内容 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| I18N-003 | `t(key, ..., fallback)` 查不到当前locale key | 顺序采用当前locale、fallbackLocale、显式fallback、原key | 多locale逐步缺项的返回值记录 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| I18N-004 | i18n禁用切换或目标locale未声明 | `setLocale` 返回false且当前locale不变，不伪显示目标语言 | 返回值、state revision和DOM lang | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| I18N-005 | 当前locale改变且菜单item含labelKey | document lang与菜单label同步更新；导航expandedIds/focus controller仍是独立React owner | DOM lang、菜单文本、展开集合/焦点身份 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| I18N-006 | React页面使用 `useI18n`/`ServicesProvider` | useI18n订阅注入或共享i18n服务，组件unmount只退订不销毁借用服务 | subscribe/unsubscribe计数、service身份 | [React services](PUBLIC_API.md#全部正式入口) |
| MENU-SVC-001 | 菜单内容来自默认config/语言服务 | MenuService只管理label/items内容，不承接展开、当前route、roving焦点、权限或动作owner | MenuService快照及NavigationMenu Controller状态对照 | [COMPONENTS 菜单数据与Controller](COMPONENTS.md#数据菜单与-controller-所有权) |
| ROUTE-001 | bootstrap连接History route service | route URI同时反映pathname/search/hash；pushState/replaceState/back/forward后订阅更新，不发document请求 | location、history event、Document请求与subscriber轨迹 | [PUBLIC_API Route](PUBLIC_API.md#启动配置与应用服务) |
| ROUTE-002 | route设置非根basePath | 解析/生成URL限制在basePath边界内，越界URI返回不接管/失败 | 根路径、边界路径和越界fixture | [PUBLIC_API Route](PUBLIC_API.md#启动配置与应用服务) |
| ROUTE-003 | 首次route含 `#/` 或 `#!/` hash路由 | runtime明确拒绝该路由形式，不假装支持HashRouter | 两种hash URI启动/resolve结果 | [PUBLIC_API Route](PUBLIC_API.md#启动配置与应用服务) |
| ROUTE-004 | 点击RouteLink外链、download、target或修饰键 | 保留标准浏览器链接行为，不由route service接管该导航 | Ctrl/Meta/Shift、中键、target、download与Network | [PUBLIC_API Route](PUBLIC_API.md#启动配置与应用服务) |
| ROUTE-005 | 部署使用非根History深链 | 宿主web server把合法深链fallback到应用shell；库本身不声称配置服务器rewrite | 直接刷新深链的HTTP状态、HTML入口和宿主server规则 | [PUBLIC_API Route](PUBLIC_API.md#启动配置与应用服务) |
| DOWNLOAD-001 | 发起DownloadService.request | 复用registry中同一HttpClient，返回Blob/文件元数据但不自动保存/点击隐藏link | service身份、请求次数、Blob与浏览器下载事件 | [PUBLIC_API Download](PUBLIC_API.md#启动配置与应用服务) |
| DOWNLOAD-002 | 用户明确触发下载保存 | 仅显式调用save时创建临时URL/link并清理；请求完成本身不触发下载 | 用户动作与下载事件时序、URL回收 | [PUBLIC_API Download](PUBLIC_API.md#启动配置与应用服务) |
| UTIL-001 | 调用 `getUtilService()` | 返回冻结纯函数namespace；不创建registry、订阅、storage、网络请求或UI状态 | 两次getter身份、Object.freeze与DOM/Network零变化 | [PUBLIC_API Util](PUBLIC_API.md#启动配置与应用服务) |

## React UI 与产品迁移

React 是唯一公共 UI。runtime DOM UI exports 已在 1.0.0 breaking change 中移除；这只说明 xui 入口状态，不表示消费项目已迁移。XQuant、XLead 等产品的当前迁移状态应以各项目最新源码和逐页实测为准；旧审计快照不能代替本次验收。runtime TypeScript 服务、模型、解析器和工具按真实调用继续保留。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| FRAME-001 | 新建或改造产品 UI | 产品 UI 由 React/ReactDOM 挂载并使用正式 `@coffeehc/xui-react`，React/ReactDOM/Base UI peers 保持单实例 | package manifests、实际入口与 bundler module graph | [ADOPTION React 唯一公共 UI](ADOPTION.md#react-是唯一公共-ui) · [PUBLIC_API](PUBLIC_API.md) |
| FRAME-002 | React 页面渲染 xui 组件 | 页面 UI 从正式 `@coffeehc/xui-react/*` 导入；不存在 `packages/src` alias 或复制组件内部 DOM/CSS | 源码 import graph、resolved module path、bundle manifest | [PUBLIC_API 全部入口](PUBLIC_API.md#全部正式入口) · [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) |
| FRAME-003 | React 页面导入 `@coffeehc/xui-runtime` | 每个 runtime import 都用于现存 TypeScript service/model/parser/tool/theme 等非 UI 职责；bundle 不引用已移除的 runtime UI factory/controller | 按 import 路径、调用点和 owner 分类的源码表；React bundle module graph | [ADOPTION React 唯一公共 UI](ADOPTION.md#react-是唯一公共-ui) · [PUBLIC_API Runtime](PUBLIC_API.md#全部正式入口) |
| FRAME-004 | 构建或发布消费项目 | theme、runtime、React 三个包来自同一固定源码版本与sourceGeneration；React 声明与宿主 peer 实例匹配公开 exports | manifests、lockfile、正式 tarball SHA-256、types 检查与 module graph | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) · [PUBLIC_API](PUBLIC_API.md#全部正式入口) |
| MIG-001 | 迁移 XQuant 页面 | 按活动页面和路由逐项盘点其旧非 React UI 调用；每个尚未切换的页面如实记失败/未跑，不能将 xui 1.0 发布等同迁移完成 | `xquant/web` 源码、构建入口、调用点到页面矩阵 | [ADOPTION React 唯一公共 UI](ADOPTION.md#react-是唯一公共-ui) · [逐项浏览器矩阵](#逐项浏览器验收矩阵) |
| MIG-002 | XQuant 页面引入 React UI | 正式产品入口创建 React root，并接入唯一 React/ReactDOM peers 与 xui React 包 | package/lockfile、实际入口、production module graph | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) · [PUBLIC_API](PUBLIC_API.md#全部正式入口) |
| MIG-003 | XQuant 页面替换旧 UI factory | 每个旧 UI factory 调用映射到已有 React 公共组件或列为 `owner=xui` 的公共缺口 | 逐调用源码映射、React 页面 props/slot、旧调用清零扫描 | [COMPONENTS](COMPONENTS.md) · [PUBLIC_API](PUBLIC_API.md#全部正式入口) |
| MIG-004 | 发布 XQuant React 页面 | 正式产品构建解析已固定 ESM/CSS/types/init 且不含旧 runtime UI 路径；真实路由、交互和失败恢复在浏览器逐项通过 | production manifest、浏览器网络/操作记录、DOM identity 结果 | [ADOPTION 验收](ADOPTION.md#按授权范围迁移与验收) · [逐项浏览器矩阵](#逐项浏览器验收矩阵) |
| MIG-005 | 迁移 XLead 页面 | 逐项盘点动态 app、startup、boot guard、admin setup 与 React islands 内既有 UI factory；React 依赖存在不算完成 | 源码 imports/calls、动态 chunk 图、页面和 owner 矩阵 | [ADOPTION React 唯一公共 UI](ADOPTION.md#react-是唯一公共-ui) |
| MIG-006 | XLead 页面统一 React owner | 每个产品 UI 区域都由 React 页面/组件负责，没有同一可见区域继续由旧 DOM factory 持有 | React root 清单、旧调用扫描、节点身份与交互 owner 记录 | [DESIGN 生命周期](DESIGN.md#前端状态与资源生命周期) · [COMPONENTS](COMPONENTS.md) |
| MIG-007 | 发布 XLead React 页面 | 实际存在的 web、desktop/embed 路由分别通过正式构建和真实浏览器验收；React island 之外的页面不能漏测 | 各目标 bundle manifest、路由清单、浏览器操作结果 | [ADOPTION 验收](ADOPTION.md#按授权范围迁移与验收) · [逐项浏览器矩阵](#逐项浏览器验收矩阵) |
| MIG-008 | UI 迁移使用 runtime | 删除 UI factory 调用后仍保留业务实际使用的 HTTP/auth/query/theme/resource 服务、模型、解析器和工具 | runtime import 分类、编译结果与请求 owner 检查 | [ADOPTION React 唯一公共 UI](ADOPTION.md#react-是唯一公共-ui) · [PUBLIC_API](PUBLIC_API.md#全部正式入口) |
| MIG-009 | 迁移页面使用公共业务 API | 迁移前后适用 API 的 method/path/query/body/凭据/DTO/权限及成功失败语义不变；不得新增前后端双层协议转换 | 前后 Network HAR、typed wire 断言与后端合同测试 | [PUBLIC_API 默认适配器的服务前置](PUBLIC_API.md#默认适配器的服务前置) · [17个公共API](#17-个公共-api-操作逐项检查) |
| MIG-010 | 声明产品迁移完成 | 每个目标页面、正式构建和浏览器操作均有当前固定版本证据；未验环境、页面或状态明确列为未跑，不用 xui 示例或包升级代替 | 逐页报告矩阵、生产 SHA、路由和浏览器证据 | [ADOPTION 验收](ADOPTION.md#按授权范围迁移与验收) · [逐项浏览器矩阵](#逐项浏览器验收矩阵) |

## 业务界面信息与交互决策

组件和slot接线前，逐项核对[信息与交互决策](DESIGN.md#业务界面信息与交互决策)及[场景推导](DESIGN.md#高信噪比页面组合)。此表只定义检查结果和所需证据，规则仅在DESIGN维护。设计依据可以先评审；涉及真实行为的项目只有在运行证据充分时才记通过，图稿、草案认可和库级示例不能代替产品验收。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| IA-001 | 新建或调整业务页面/区域 | 声明用户任务、对象范围和关键判断，区域、信息、动作能对应这些任务 | 页面约定、实际默认内容与任务路径 | [DESIGN 页面方法](DESIGN.md#首屏信息架构与信息密度) |
| IA-002 | 安排信息位置及披露 | 信息属于正确范围；必要事实/风险/阻断摘要在决策位置可见，次要内容有明确触发与返回 | 信息到区域/slot映射、默认/展开状态及键盘触屏步骤 | [DESIGN 归属与时机](DESIGN.md#信息归属与出现时机) |
| IA-003 | 选择 List/Table/Card/详情/时间线/图表 | 形态与阅读、辨识、跨记录比较、属性查验、事件顺序或趋势任务相符；未将模式名当公共API | 代表性真实数据、选型理由与场景对照 | [DESIGN 呈现形态](DESIGN.md#集合与详情的呈现形态) |
| IA-004 | 使用导航/Tab/筛选/视图切换/折叠/步骤 | 改变的业务范围与控件语义一致；需同时比较的关键值可同屏读取，折叠后有效条件/异常可辨识 | 切换前后内容、查询/路由/受控值与可访问语义 | [DESIGN 内容组织](DESIGN.md#导航内容切换与筛选) |
| IA-005 | 采用内联/Popover/Dialog/Sheet/分栏/页面 | 说明任务与上下文依据；背景交互、焦点和模态语义一致，不用时间/字段数/URL单项定容器 | 正式API、容器理由、背景点击与焦点/关闭/返回记录 | [DESIGN 任务容器](DESIGN.md#任务容器与上下文) |
| IA-006 | 页面有主动作/行操作/批量/提交 | 动作跟随真实作用范围；批量显示实际选择范围，主动作强调与任务一致 | 动作位置与实际对象、选择范围、请求和部分结果记录 | [DESIGN 动作归属](DESIGN.md#动作归属与确认) |
| IA-007 | 操作需要确认或提供撤销 | 确认显示真实对象/范围/后果，额外输入与风险相称；撤销由真实能力支持 | 确认内容、影响事实来源、取消/执行/适用撤销结果 | [DESIGN 确认规则](DESIGN.md#动作归属与确认) |
| IA-008 | 出现校验、读取、提交或刷新失败 | 反馈就近、错误可修正；首次/刷新/空/权限/未知分别表达，范围不被无故扩大 | 逐状态触发、保留内容/输入、恢复入口与焦点记录 | [DESIGN 反馈](DESIGN.md#反馈位置与保留时间) |
| IA-009 | 操作有进度、关键结果或仅Toast反馈 | 真实进度/未知状态分开；关键结果有所属入口，临时凭证按授权期清理，不以Toast代替 | 等待/成功/未知状态、结果进入与关闭/卸载后的清理 | [DESIGN 反馈生命周期](DESIGN.md#反馈位置与保留时间) |
| IA-010 | 选择输入方式、内联编辑或自动提交 | 控件语义与数据/设置一致；入口键盘触屏可达，失焦/Enter/IME按声明合同执行 | 控件类型、草稿/确认值、键盘/IME与真实写入记录 | [DESIGN 输入与编辑](DESIGN.md#输入编辑与离开) |
| IA-011 | Tab/对象/路由切换或关闭编辑 | 有意义修改会丢失时有明确处理，无损切换不滥确认；草稿/敏感值沿宿主生命周期 | 改动/未改动、切回、离开/返回及适用存储清理记录 | [DESIGN 离开保护](DESIGN.md#输入编辑与离开) |
| IA-012 | 窄屏/长值/放大导致布局变化 | 核心信息与动作可达，集合/分栏调整保留必要语义与返回位置，全文入口可用 | 支持视口、两种200%、键盘触屏、切换前后选择/草稿/滚动 | [DESIGN 窄屏连续性](DESIGN.md#窄屏与交互连续性) |

## 页面框架与具名 slot

以下只检查已公开的 slot 和 parts。若固定版本的正式 API 没有所需 slot，该项记`失败 / owner=xui`，不得把内容塞入无关 slot 后记通过。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| SHELL-002 | AppHeader 有平台安全区/leading 内容 | 只放入 `headerSlots.leading` / `leading` | props/Options 与顶栏顺序截图 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-003 | 顶栏显示品牌 | 品牌只放入 `headerSlots.brand` / `brand`，不与 breadcrumb 合并 | props/Options 与窄屏截图 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-004 | 顶栏显示当前路径 | 路径语义只放入 `headerSlots.breadcrumb` / `breadcrumb` | props/Options 与 DOM 阅读顺序 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-005 | 顶栏需显示工作区、搜索等左中扩展 | 只放入 `headerSlots.context` / `context` | props/Options 与桌面/窄屏截图 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-006 | 顶栏显示运行健康或同步事实 | 真实状态只放入 `headerSlots.status` / `status` | 数据绑定和实际状态截图 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-007 | 顶栏显示应用级动作 | 只放入 `headerSlots.actions` / `actions`，不把认证/权限 owner 移入 shell | props/Options 与动作调用记录 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-008 | 顶栏显示帮助、版本等辅助工具 | 只放入 `headerSlots.auxiliary` / `auxiliary` | props/Options 与响应式顺序 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-009 | 顶栏有账号菜单 | 只放入 `headerSlots.account` / `account`，登录态仍归宿主认证 owner | props/Options 与认证调用记录 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-012 | 侧栏有产品标识或说明 | 内容只进入 `sidebarHeader`，不塞入 NavigationMenu label | props/Options 与侧栏顺序 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-013 | 侧栏有导航树 | 树只进入 `sidebar`/`items` 对应的公开导航位置，不塞入 sidebarHeader 限高区 | props/Options 与完整导航截图 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-014 | 侧栏有返回、版本或业务动作 | 内容只进入 `sidebarFooter`，不作为额外导航条目 | props/Options 与窄屏顺序 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-015 | 页面有标题区 | 标题只放在 `pageHeader`，不复制到 pageToolbar 或正文开头 | shell props 与主标题 DOM 数量 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-016 | 页面有常用搜索、页内筛选或 tabs | 内容只放 `pageToolbar` 或组件自有 toolbar 的一个位置 | props/Options 与控件计数 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-017 | 页面有主要业务内容 | 内容只放 `content`/shell children，切换其他 slot 时正文节点身份稳定 | 节点 identity 前后记录 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-018 | 页面有页尾说明或操作 | 内容只放 `pageFooter`，不使用固定覆盖层模拟页尾 | DOM 顺序、底部滚动可达截图 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-019 | 可选 slot 无内容 | 不产生可见空条、空边距或键盘停靠点 | 空 slot DOM/geometry 与 Tab 序列 | [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SHELL-020 | sidebarHeader 放直属Button、Toolbar或业务布局 | slot不强改按钮宽度/字号/折叠态padding；默认内容宽，宿主显式公开style/className的全宽或内容宽均保留 | 直属/Toolbar/业务布局、width=100%/max-content的几何与字体计算值 | [COMPONENTS 侧栏组合](COMPONENTS.md#侧栏快捷操作组合) |
| SHELL-021 | sidebarHeader内Tabs.List控制sidebar内Tabs.Panel | 一个Tabs.Root与受控值；侧栏Panel不叠内容padding，Header分隔紧凑，普通页面Tabs保持原Token间距 | 切换前后间距、首项位置、search草稿与普通Tabs对照 | [COMPONENTS 侧栏组合](COMPONENTS.md#侧栏快捷操作组合) |
| SHELL-022 | 侧栏Header/列表/Footer有可聚焦控件 | Header保留限高/独立滚动、菜单最小高度和Footer；各控件inset焦点可绘制，invalid边界仍可读 | 默认展开/窄屏/200%文字与真实zoom、键盘焦点和滚动记录 | [COMPONENTS 侧栏组合](COMPONENTS.md#侧栏快捷操作组合) |
| SHELL-023 | 需要调整公共收起/展开入口 | `top` 时桌面唯一控件位于全局品牌单元行尾；显式 `bottom` 保持侧栏菜单/页尾后；窄屏复用同一抽屉入口，不替换私有SVG或另造按钮 | placement接线、唯一节点、实际位置/命中区、Enter/Space及Escape回焦点 | [COMPONENTS 唯一开关](COMPONENTS.md#导航内部唯一收起展开控件) |
| SHELL-024 | AppShell/MenuLayout侧栏与正文相邻 | 桌面使用公共inline-end低对比分隔，展开/紧凑外宽与内容净宽不变，RTL换侧；窄屏抽屉不叠内侧边线，不增加resize handle或宿主私有CSS | 与固定旧包几何对照、三主题/RTL/窄屏/两种200%、滚动和同一portal/焦点/草稿证据 | [COMPONENTS 公共侧栏边界](COMPONENTS.md#公共侧栏与正文边界) |

## 每个页面和组件的 slot 矩阵

对每个真实使用的 AppShell、PageHeader、SearchToolbar、Card、Form、DataTable、Dialog、Sheet、NavigationMenu 及其他有公开 slots/parts 的组件，按具体页面实例和 slot 分别填下列行。内容、颜色、排版和交互仍以链接的 xui 公共合同为准；Stitch 稿仅供设计校准，不能覆盖固定版本合同，也不能把图中某个 CSS 数值提升成 xui 默认值。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| SLOT-001 | 某页面/组件实例使用具名 slot 或公开 part | 报告记录它的正式 props/Options/part 名称、所属实例和唯一 owner；不以私有 DOM 节点冒充 slot | 正式 types、页面接线与实例清单 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SLOT-002 | slot 有内容 | 内容语义与 slot 职责一致；不把说明、状态、业务动作或数据塞入仅因位置相近的其他 slot | slot 属性/Node、实际文案和业务动作来源 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SLOT-003 | slot 内容有颜色或 Badge/tone | 颜色角色来自 DESIGN 语义映射；真实状态才用状态色，分类/归属保持中性 | slot 对应 DOM 的 tone 与 light/dark computed tokens | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SLOT-004 | slot 内容有标题、正文、meta、help、error 或技术标识 | 使用各自公共文字角色、对齐和排版；不从 Stitch 单例抄 10/11px、全 mono 或绝对定位错误文字 | computed font/line-height、slot rectangle 与长中文截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SLOT-005 | 可选 slot 内容为空 | 按该组件合同折叠或保持语义容器；不留下视觉空高、装饰分隔或空焦点目标 | 空值渲染 DOM、geometry 与键盘轨迹 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SLOT-006 | slot 对应内容进入 loading/busy/empty/error/disabled/selected 等状态 | 只验证该组件公开支持且该业务真实适用的状态；状态文案、颜色、动作与事实一致 | 组件公开状态、业务状态 fixture 与浏览器截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |
| SLOT-007 | slot 内容超出容器或出现在弹层/工作区 | 按组件合同确定唯一滚动 owner；键盘焦点、页尾/操作区及弹层关闭入口保持可达 | scrollHeight/scrollTop、focus trace 与滚动录像 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [COMPONENTS 语义区域矩阵](COMPONENTS.md#语义区域矩阵) |

## 公共文字槽逐项验收

这些条目也是 xui 自身的发布验收；消费方逐实例检测接线与覆盖，xui 逐公共 part 验证默认实现。角色值只以 [DESIGN 唯一映射](DESIGN.md#公共文字槽验收)为准。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| TYPE-001 | 任何公共组件内容 | 宿主非必要不自设字号；逐项定位font/font-size/family/line-height/weight、style及文字工具类覆盖 | 覆盖扫描、用途和限定范围 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-002 | AppHeader/HeaderBrand各文字slot | brand、路径、context、status、辅助及账号逐槽匹配公共映射，内嵌控件保持自身角色 | 逐slot四项computed与嵌套Button | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-003 | AppShell/MenuLayout侧栏 | header/footer裸说明为meta，控件保持自身control角色；slot不递归覆盖字体 | 默认展开/窄屏200%时三动作与导航、footer几何 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-004 | PageHeader/Section | title、description、meta、章节正文分别匹配page/section/body/meta，动作不被降字号 | 每个文字slot四项computed | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-005 | Card/CardGroup | 标题、说明、正文、归属badge、footerMeta、计数和分页逐槽匹配；元信息内Button保持control | 每张卡各slot和集合footer计算样式 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-006 | MetricCard | label/value/marker分别使用label/metric与所用状态组件，值用Mono/tabular | 字体族、四项computed及完整长值 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-007 | Field/Fieldset/ChoiceGroup | label/legend、help、error及各选择标签分别匹配label/meta，错误不靠缩字避让 | 每字段及legend/错误四项computed | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-008 | Input/Textarea/Password/Select/Combobox | 输入值与trigger使用control，option/group使用label/meta；报告原生select平台行高差异 | 正式控件四项computed及原生高度/编辑验证 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-009 | InputGroup | Addon单位为meta，内部Input与Button仍为control，不能从小字号单位继承动作字重 | Addon/输入/嵌套动作四项computed | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-010 | Button/IconButton/Toggle | 文字为control，既有size只按公开几何；放入sidebar/meta/footer不变成小字 | 跨slot及size的computed比较与键盘操作 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-011 | Tabs/Disclosure/Accordion | Disclosure/Accordion trigger为control；Tab为body-sm，常规body400/选中heading600；panel/body为body，父标题或meta不改变trigger字体 | trigger与content四项computed | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-012 | NavigationMenu/Nav/Breadcrumbs/Pagination | 主label为control、组标题为meta-heading、路径body、页码meta；主名称无自造副描述小字 | 主项、组、路径、页码、动作逐项computed | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-013 | Menu/ContextMenu/Command | item/submenu等为label，group为meta；tone和键盘状态不改文字尺寸 | 两类菜单各item和group四项computed | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-014 | Calendar/DateTimePicker | 月标题、weekday、day、时间输入/清空分别匹配映射；保留日期值与键盘语义 | 各文字part四项computed与键盘选日/焦点 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-015 | Dialog/Sheet/AlertDialog/Popover/Tooltip | 标题、说明、body、footer、提示各自角色，portals采用相同比例且不改变嵌套控件 | 逐part computed、长内容滚动及关闭回焦点 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-016 | Alert/Loading/Empty/Error/Toast | 文案、标题、说明及retry/action分别匹配映射；块反馈继承正文、行内反馈继承所属文字槽 | 每种反馈四项computed及动作 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-017 | Table/DataTable | caption、th/sort、td/expanded、count/footer/分页说明、cell动作逐项匹配，状态用Badge技术值用Code | 各part计算样式和内部控件隔离 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-018 | Typography/Copyable/Badge/Tag/Avatar/Image | 正文、技术值、状态、复制反馈、fallback分别匹配映射，Mono不用作普通正文 | 四项computed、复制结果与长值 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-019 | 登录/KeyManager/业务日志/结构化日志组合 | 沿用其公共子组件角色和既有登录专用Token，无消费方字体皮肤 | 组成组件映射、登录专用Token与实际computed | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-020 | 纯布局/无文字部件 | 按公共映射说明无独立文字part；可见内容用适合的文字/业务组件，不能整片统一字号 | 不适用理由或拥有文字角色的子组件 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-021 | 需要领域阅读例外 | 记录必要用途、集中语义映射/公开入口、作用范围与缩放证据；公共缺口仍交给xui | 逐项例外说明与computed、范围检查 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-022 | xui自身发布或新增文字part | 公共映射、CSS、正式示例与computed断言同步；逐项报告通过/失败/未跑，不以宿主修补验收 | 正式tarball、角色矩阵与执行报告 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
| TYPE-023 | 任何文字slot主题/放大验收 | light/dark/system、桌面/窄屏、长中文、200%文字与真实zoom分别验证，无截断动作/焦点丢失 | 各环境computed、截图及键盘轨迹 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |

## Tabs 编排与状态

以下检查用于库发布及项目接入，按真实执行证据逐项记录，不将规范存在当作已通过。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| TABS-001 | 使用Tabs切换相关内容 | Root/Tab/Panel对应真实受控或非受控值，Tab名称与Panel内容归属明确，不用路由链接伪装内容切换 | props、role、labelledby/controls及当前值 | [COMPONENTS Tabs](COMPONENTS.md#tabs) |
| TABS-002 | 默认内容宽轨道 | List按标签组自然宽度，最大不越过所属容器，不留被动满宽空轨道 | List与各项实际矩形、长中文/窄屏换行 | [COMPONENTS Tabs](COMPONENTS.md#tabs) |
| TABS-003 | 设计确需整行等分切换 | 显式List.layout=equal，轨道填满且各项等分，不穿透内部class补flex | 公开prop与各项宽度、放大后完整名称 | [COMPONENTS Tabs](COMPONENTS.md#tabs) |
| TABS-004 | Tab带图标或只有文字 | 图标进入Icon装饰槽，统一尺寸/非收缩/图文间距/继承状态色；纯文字不留空图标位，label不隐藏在Icon中 | slot接线、计算样式与可访问名称 | [COMPONENTS Tabs](COMPONENTS.md#tabs) |
| TABS-005 | Tab呈现普通/选中/hover/focus/disabled | 轨道与内嵌选中层明确，文字/图标共同表达选中，focus独立可见，disabled不执行 | 三主题状态截图、颜色/焦点计算值与零执行记录 | [DESIGN 原子状态](DESIGN.md) · [COMPONENTS Tabs](COMPONENTS.md#tabs) |
| TABS-006 | 键盘操作Tabs | 方向键/Home/End跳过disabled；手动/自动激活、loop、RTL/orientation遵循公开peer配置 | 实际键盘顺序、value通知与panel关联 | [COMPONENTS Tabs](COMPONENTS.md#tabs) |
| TABS-007 | Panel含草稿或正在刷新 | 状态归所属内容，必要时keepMounted保留输入；同范围刷新/轨道布局切换不重挂Root或正文 | 节点identity、草稿、焦点与请求owner记录 | [COMPONENTS Tabs](COMPONENTS.md#tabs) |
| TABS-008 | Tabs发布或采用验收 | light/dark/system、长中文、桌面/窄屏、200%文字与真实zoom分别核对，不用缩字号或隐藏Tab过验收 | 正式包、截图/几何/键盘与实际未跑项 | [COMPONENTS Tabs](COMPONENTS.md#tabs) |

## 图标与状态提醒

Icon/color参数从1.2.0提供；固定1.1.3消费方须先升级正式包再验收。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| ICON-001 | 使用公共图标 | 图形由Icon承载，统一尺寸/描边；xs动作随所属Button，图标不承载版本字符串或交互owner | 正式types、slot接线与尺寸/描边计算值 | [COMPONENTS Icon](COMPONENTS.md#icon-与状态强调) |
| ICON-002 | 默认图标或状态文字 | 不指定color时继承所属角色，不额外设置字号或颜色皮肤 | 父槽及Icon/Badge/Text前景与字体计算值 | [COMPONENTS Icon](COMPONENTS.md#icon-与状态强调) |
| ICON-003 | 需要主题强调色或其他合法变量 | 通过color传公共语义var，变量随light/dark/system实时变化；明确颜色优先级，不穿透SVG/Badge补CSS | color接线、变量切换、计算前景及主题截图 | [COMPONENTS Icon](COMPONENTS.md#icon-与状态强调) |
| ICON-004 | 图标需要引起关注 | 显式blink；开启默认主题强调，关闭恢复默认或指定颜色；不闪灭、位移或影响周围几何 | 开关前后动画/颜色、矩形及节点identity | [COMPONENTS Icon](COMPONENTS.md#icon-与状态强调) |
| ICON-005 | 用户启用减少动态效果 | 停止blink动画，保留静态语义色和完整状态文字 | 真实媒体设置下animation与截图 | [COMPONENTS Icon](COMPONENTS.md#icon-与状态强调) |
| ICON-006 | 图标位于动作内或祖先禁用 | Icon不执行动作；所属Button维护disabled/busy/键盘，禁用时停止闪烁并继承控件颜色 | Enter/Space、busy事实、disabled零调用及前景/动画记录 | [COMPONENTS Icon](COMPONENTS.md#icon-与状态强调) |
| ICON-007 | 装饰图标或独立含义图标 | 装饰性默认隐藏；需要独立含义时给名称成为被动img；不增加Tab停靠或随动画重复播报 | accessibility tree、Tab顺序、无自动live region | [COMPONENTS Icon](COMPONENTS.md#icon-与状态强调) |
| ICON-008 | 呈现版本或类似状态提醒 | 是否显示、授权、版本截断、当前/最新值及升级回调归宿主；公共组件只表达已确认事实 | 条件与数据owner、版本示例、唯一业务回调 | [COMPONENTS Icon](COMPONENTS.md#icon-与状态强调) |
| ICON-009 | Icon/颜色能力发布或采用 | 三主题、blink开关、合法变量、窄屏、长中文、200%文字与真实zoom分别验收，不隐藏文字/缩小命中区 | 正式包、类型、截图/几何/键盘及实际未跑项 | [COMPONENTS Icon](COMPONENTS.md#icon-与状态强调) |

## 页面标题、工具栏与卡片

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| PAGE-001 | 页面有主标题 | `PageHeader.title` 只承载该页一个可访问主标题 | props/Node 接线、heading outline | [COMPONENTS 布局与顶栏](COMPONENTS.md#布局与顶栏) · [DESIGN 高信噪比页面组合](DESIGN.md#高信噪比页面组合) |
| PAGE-002 | 标题下有摘要 | `PageHeader.description` 只承载解释当前页面任务的短描述 | props/Node 接线与视觉层级 | [COMPONENTS 布局与顶栏](COMPONENTS.md#布局与顶栏) · [DESIGN 高信噪比页面组合](DESIGN.md#高信噪比页面组合) |
| PAGE-003 | 标题区有状态/计数等事实 | 每项进入公共 `PageHeader.meta` 包装且值来自真实页面数据；无 meta 时包装不占位 | 数据来源、DOM slot 与空态 geometry | [COMPONENTS 布局与顶栏](COMPONENTS.md#布局与顶栏) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| PAGE-004 | 标题区有页面主操作 | 操作进入 `PageHeader.actions`，同一主要任务只有一个强调主动作 | props/Node 与操作结果记录 | [COMPONENTS 布局与顶栏](COMPONENTS.md#布局与顶栏) · [DESIGN 高信噪比页面组合](DESIGN.md#高信噪比页面组合) |
| TOOLBAR-001 | 页面需要搜索 | 搜索控件进入 `SearchToolbar.search`，不重复出现在 actions 或正文 | slot 接线与控件计数 | [COMPONENTS SearchToolbar](COMPONENTS.md#searchtoolbar) |
| TOOLBAR-002 | 页面有常用工具动作 | 工具动作进入 `SearchToolbar.actions`，不混入搜索输入或高级筛选 | slot 接线与键盘顺序 | [COMPONENTS SearchToolbar](COMPONENTS.md#searchtoolbar) |
| TOOLBAR-003 | 页面有低频/高级查询 | 进入 `SearchToolbar.advanced`，通过公开展开入口按需显示 | slot 接线、展开前后 DOM 与焦点 | [COMPONENTS SearchToolbar](COMPONENTS.md#searchtoolbar) |
| TOOLBAR-004 | 页面同时有 pageToolbar 和 DataTable.toolbar | 搜索/过滤只使用其中一个 owner，不出现重复查询条 | 两处 props、DOM 搜索/筛选数量 | [COMPONENTS SearchToolbar](COMPONENTS.md#searchtoolbar) |
| CARD-001 | 页面呈现可识别的业务对象卡片 | 使用固定版本具名 Card 公共框架；无正式能力则记 xui 公共缺口 | 正式 types/ESM 与页面实例 | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-002 | 卡片有领域标题 | `Card.title` 接收真实标题字符串，headingLevel 映射业务层级 | props/Options 与 heading outline | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-003 | 卡片标题前有识别图标 | 图标进入 `Card.icon`，不与标题字符串拼成自定义头部控件 | props/Node 与标题行 DOM | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-004 | 卡片有公共/个人等归属事实 | 归属进入 `Card.badge`，默认中性色，不借用成功/错误语义 | badge props 与主题计算样式 | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-005 | 卡片有标题旁辅助动作 | 动作进入 `Card.actions`，保留其原有权限和回调 owner | props/Node 与动作调用记录 | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-006 | 卡片有摘要或主要正文 | `description` 与 `children` 都归入唯一 `.xui-card-content` 内容区；description 是同一区域的便捷属性，不构成第四个结构区或独立边框 | props、DOM 子树及卡片内容顺序 | [COMPONENTS Card](COMPONENTS.md#card) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-007 | 卡片同时呈现正文与底部事实/动作 | 正文留在 content，`footerMeta`/`footerActions` 只进 footer；三段结构为 header/content/footer | props/Node、DOM 顺序与实际视觉分隔 | [COMPONENTS Card](COMPONENTS.md#card) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-008 | 卡片底部有时间、来源等事实 | 事实进入 `Card.footerMeta`，颜色及文字角色符合元数据语义 | slot 接线、颜色样式与截图 | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-009 | 卡片底部有业务动作 | 操作进入 `Card.footerActions`，不放在 footerMeta 文案中 | slot 接线与可执行动作记录 | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-010 | 卡片任意可选 slot 为空 | 空 slot 不产生空分隔、空高度或额外焦点目标 | 空槽几何、DOM 与 Tab 序列 | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-011 | 卡片标题超过可用宽度 | 只滚动标题文本；Badge、摘要、元数据和动作保持原位；不溢出时不动画 | 长中文/英文矩形录像与 node identity | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-012 | Card 内现有键盘交互触发标题全文展示 | 仅沿 Card 已有键盘动作显示完整标题，不新增标题或根节点 Tab 停靠点；减少动效遵循固定组件合同 | Tab 序列、现有按键轨迹与 reduced-motion 样式 | [COMPONENTS Card](COMPONENTS.md#card) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-013 | 卡片在窄屏或放大文字下空间不足 | header/footer 按公共规则换行，完整文本与右侧动作可达 | 390px、200%文字及真实 zoom 截图 | [COMPONENTS Card](COMPONENTS.md#card) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) · [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) |
| CARD-014 | Card有身份图标或头像 | 使用icon/iconVariant/iconColor及公共Icon/Avatar.Root.color；默认tile强调，不写内部SVG颜色/字号，plain适配已有头像表现 | 公开props、首行对齐、三主题计算前景/尺寸 | [COMPONENTS Card](COMPONENTS.md#card) · [COMPONENTS Avatar](COMPONENTS.md#avatar) |
| CARD-015 | Card有公共/个人等归属标签 | tone维持真实neutral，默认soft区分普通正文；需要强调时显式badge.color，朴素时显式variant=plain，不伪造状态tone | CardBadge及BadgeVariant接线、文字角色/背景与颜色 | [COMPONENTS Card](COMPONENTS.md#card) |
| CARD-016 | Card有卡尾事实或动作 | 默认band统一背景/唯一分隔，plain公开可选；卡尾动作显式选标准size，不由父级改后代字体/命中区 | 分区/边界矩形、Footer为空及两种variant对照 | [COMPONENTS Card](COMPONENTS.md#card) |
| CARD-017 | Card展示领域摘要 | description为真实来源短摘要，完整说明仍有详情入口；公共层不固定正文高度/行数，不为参考图虚构版本、状态或指标 | 数据来源、摘要/详情映射与放大可达 | [COMPONENTS Card](COMPONENTS.md#card) |

## 小控件与复合控件

每个实际使用的组件实例单独记录；只测该公开接口拥有的交互，不要求所有控件机械具备相同状态。xui 只有一套 React UI；runtime 的纯 TypeScript 模型可按其自身公开方法测试，不把它当作第二套 UI 实现。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| CTRL-001 | 页面有普通 Button 操作 | 使用公共 Button 变体表达主次/危险语义；保留默认 `type="button"`，提交动作显式为 submit | 正式 props、DOM type 与操作计数；link变体在default/hover/pressed/focus按实际背景检查普通文字≥4.5:1，图标继承文字色 | [COMPONENTS 基础组件](COMPONENTS.md#基础组件与通用状态) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) |
| CTRL-002 | 页面用 Link/NavItem 跳转 | 保留浏览器链接 href、修改键、中键、target/download 和可访问名称；不把普通链接伪装成按钮 | DOM role/href 与鼠标键盘导航记录 | [COMPONENTS 基础组件](COMPONENTS.md#基础组件与通用状态) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) |
| CTRL-003 | 页面使用 IconButton | 图标动作有稳定可访问名称；IconButton/公开data-icon=true默认全状态圆形，文字按钮不得误标；busy/disabled 只按真实状态表达，不借图形颜色传达唯一含义 | accessibility tree、各size与default/hover/pressed/disabled/busy/expanded轮廓、键盘/禁用记录 | [COMPONENTS 基础组件](COMPONENTS.md#基础组件与通用状态) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) |
| CTRL-004 | 页面使用 Checkbox 或 Switch | checked 来自真实布尔事实，Space 操作一次；readOnly 不发值变化，disabled 不进入操作 | 受控前后值、change 计数及浏览器键盘记录 | [COMPONENTS 选择与复合控件](COMPONENTS.md#成组选项) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) |
| CTRL-005 | 页面使用 ToggleGroup | 当前值受控更新，方向键只移动焦点、Enter/Space 选择；`allowEmpty` 与多选只按公开配置执行 | value、activeElement 与回调轨迹 | [COMPONENTS ToggleGroup](COMPONENTS.md#选择与复合控件) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) |
| CTRL-006 | 页面使用 Tabs | Tab 与 Panel 关联准确；方向键、Home/End、disabled 跳过及手动/自动激活遵循实际 peer 配置 | ARIA 关系、activeElement 与按键轨迹 | [COMPONENTS Tabs](COMPONENTS.md#基础组件与通用状态) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) |
| CTRL-007 | 页面使用 Disclosure | expanded/controls 对应真实内容；Enter/Space 默认保留触发器焦点，收起内容不再可 Tab；受控 open 在当前提交反映，宿主 effect 可直接聚焦展开内容 | aria-expanded/controls、Tab 序列和 DOM 状态 | [COMPONENTS Disclosure](COMPONENTS.md#groupedcombobox-与-disclosure) |
| CTRL-008 | 页面使用 Accordion | 单/多展开模式按公开配置；disabled 项不可切换，内容 DOM 在更新时保留受控业务节点 | value、disabled 事件与节点 identity | [COMPONENTS Accordion](COMPONENTS.md#选择与复合控件) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) |
| CTRL-009 | 页面使用 Calendar | 可见月份与已选日期是不同状态；翻月不改日期值/不触发日期回调，禁用日期可读但不能选 | React month 与 value 快照、键盘轨迹及对应 runtime 纯模型结果 | [COMPONENTS Calendar](COMPONENTS.md#选择与复合控件) · [PUBLIC_API 日历月份控制](PUBLIC_API.md#日历月份控制) |
| CTRL-010 | 页面使用 DateTimePicker | 值保持公开本地日期时间字符串合同和分钟精度；不得隐式解释为 UTC 或按浏览器时区转换 | 输入/回调原始值、跨时区浏览器比较 | [COMPONENTS 日期时间选择](COMPONENTS.md#日期时间选择) · [PUBLIC_API 日期时间选择](PUBLIC_API.md#日期时间选择) |
| CTRL-011 | 页面使用 Typography | heading 的语义级别与视觉角色分别符合页面层级；正文、muted、technical 不因组件方便而混用 | heading outline、computed text role 与长文截图 | [COMPONENTS Typography](COMPONENTS.md#typography) · [DESIGN Typography](DESIGN.md#typography) |
| CTRL-012 | 页面使用 Copyable | 只有明确点击复制动作才访问 clipboard；busy/成功/失败状态按公开文案呈现，复制失败仍保留原值 | clipboard spy、按钮键盘操作和状态节点 | [COMPONENTS Copyable](COMPONENTS.md#copyable) |
| CTRL-013 | 页面使用 Tag | 普通分类保持被动中性文本；只有存在移除动作时才显示独立可访问移除按钮 | Tag props、computed tone 与动作回调 | [COMPONENTS Tag](COMPONENTS.md#separator-与-tag) |
| CTRL-014 | 页面使用 Image | 帧尺寸由公开尺寸/aspect-ratio 保持；loading/error 文案及 alt 语义真实，资源更新不替换外层布局节点 | naturalWidth、状态、外层节点 identity 与截图 | [COMPONENTS Image](COMPONENTS.md#image) |
| CTRL-015 | 页面使用 MetricCard | 只呈现回答当前任务的真实指标；loading/unknown/error 与数值0分别表达，不把未知补成零 | 数据来源、状态样本与实际首屏位置 | [COMPONENTS MetricCard](COMPONENTS.md#metriccard) · [DESIGN 指标映射](DESIGN.md#逐组件外观与状态映射) |
| CTRL-016 | 页面产生操作反馈 | 页面级临时通知使用公共Toast，不以show/hide整块提示挤动内容；需持续处理的错误/权限/风险与关键结果仍在所属位置可见 | 触发/关闭路径、反馈归属和实际恢复证据 | [DESIGN 反馈归属](DESIGN.md#反馈位置与保留时间) |
| TOAST-001 | 通知队列与注入 | 默认 Provider 仅建一个队列；controller/toastManager 与 timeout/limit/exitTimeout 互斥，借用实例不销毁 | 双模式、StrictMode、同id实例替换/退出与迟到结果 | [通知合同](DESIGN.md#通知队列与视图合同) |
| TOAST-002 | 通知位置与文字 | 默认右上角，Icon/Title/Description/Actions/Action/Close 使用公共槽，Close首行末端，只有实际动作才有末行；窄屏与大字默认最新1项、40dvh内滚动、焦点四边可见，宿主不写定位/字号补丁 | 三主题、长中文、200%文字与真实页面缩放截图 | [通知合同](DESIGN.md#通知队列与视图合同) |
| TOAST-003 | 计时与关闭 | 悬停/聚焦/文档隐藏/无View/隐藏项暂停；恢复剩余时长，关闭回调各一次，旧Promise不复活关闭项 | 受控时钟、真实指针/键盘、错误与退出用例 | [通知合同](DESIGN.md#通知队列与视图合同) |
| TOAST-004 | 通知焦点与播报 | 新增不抢焦点；F6/Tab/Escape与关闭后回焦；polite/assertive 按真实优先级，必要错误原位持续 | DOM语义、键盘与动作焦点；读屏器未测须单独注明 | [通知合同](DESIGN.md#通知队列与视图合同) |
| TOAST-005 | 普通保存/复制等页面级临时通知 | 使用现有公共Toast及同一owner，不插入临时Alert/Card/横幅/提示行，不与页面块重复；完整页复制通知在模态打开期间仍可播报、无正文位移；持续错误/关键结果不只放Toast，控件原位反馈沿原合同，轮询不逐次报成功 | 每个触发点、Provider/Controller身份、持续状态入口和通知次数 | [反馈归属](DESIGN.md#反馈位置与保留时间) |
| TOAST-006 | 连续触发通知并等待自动关闭/手动关闭 | 同视口同范围未变化内容的几何/节点/滚动/草稿与选区保持，焦点不无故转移，主动进入通知及关闭按公共合同回焦；不以大留白/固定反馈高度/裁切/隐藏正文掩盖跳动，必要内容增长单独归因 | 出现前/显示中/两种关闭后的bounding rect、DOM身份与交互记录；不能只给截图或CLS | [几何验收](DESIGN.md#反馈位置与保留时间) |
| CTRL-017 | 页面使用 Alert 或 ErrorState | 文案与 severity 来自真实业务结果；重试按钮只在真实可重试时出现，Alert 不吞掉表单错误关联 | HTTP/业务错误夹具、aria-describedby 与回调次数 | [COMPONENTS 局部失败反馈](COMPONENTS.md#局部失败反馈与离线边界) · [DESIGN 表单、搜索与反馈](DESIGN.md#表单搜索与反馈) |
| CTRL-018 | 页面使用 PasswordInput 显隐按钮 | 显隐按钮保留正常 Tab 顺序及可访问名称/`aria-pressed`；不得使用 `tabIndex=-1` 或 `aria-hidden` 隐藏交互 | Tab 录像、DOM 属性与密码输入节点 identity | [COMPONENTS 密码输入](COMPONENTS.md#密码输入) |
| CTRL-019 | DateTimePicker 使用 required 或清空 | 清空回调为 null；具名输入的 FormData 与浏览器 required validity 一致，不因 required 隐藏清空入口 | React 表单 FormData、validity 与回调计数 | [COMPONENTS 日期时间选择](COMPONENTS.md#日期时间选择) · [DESIGN 表单反馈](DESIGN.md#表单搜索与反馈) |
| CTRL-020 | DateTimePicker 为 disabled | 禁止编辑、打开和清空，不接收用户值回调 | DOM disabled、开弹层键盘/点击和回调计数 | [COMPONENTS 日期时间选择](COMPONENTS.md#日期时间选择) |
| CTRL-021 | DateTimePicker 为 readOnly | 仍可聚焦读取值，但不编辑/清空/打开；保留真实表单只读语义 | activeElement、DOM 属性及输入/按钮事件计数 | [COMPONENTS 日期时间选择](COMPONENTS.md#日期时间选择) |
| CTRL-022 | DateTimePicker 有关联 Field.error | `aria-invalid` 和 `aria-describedby` 指向稳定错误节点，文本出现不造成字段错位或遮盖 | accessibility snapshot 与错误前后 field geometry | [COMPONENTS 日期时间选择](COMPONENTS.md#日期时间选择) · [COMPONENTS 表单](COMPONENTS.md#表单与页面编排) |
| CTRL-023 | DateTimePicker 通过键盘打开、选择或取消 | 键盘操作符合公开 Calendar/Select 语义；确认/取消/Escape 回原触发入口，外部新焦点不被抢回 | 全键盘录像、activeElement 与事件计数 | [COMPONENTS 日期时间选择](COMPONENTS.md#日期时间选择) |
| CTRL-024 | 页面使用 Select、RadioGroup 或 ChoiceGroup | 实际值受控且可访问名称关联；按对应浏览器/peer 键盘、required、disabled/readOnly 合同工作，不把选择变成业务提交 | ARIA/label/form state、键盘轨迹和回调计数 | [COMPONENTS 成组选项](COMPONENTS.md#成组选项) · [COMPONENTS 选择控件](COMPONENTS.md#选择与复合控件) |

## 不把设计样例误当作新规范

外部设计图、Stitch 生成代码和说明只用于校准信息层级与视觉方向；逐项核对固定 xui DESIGN/组件合同后再采用。以下检查针对具体误用，不表示图稿本身是规范源。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| EXAMPLE-001 | Stitch 样例出现 `10px`/`11px` 或其它字号/间距字面值 | 仅按固定 DESIGN 的语义角色和 token 判断；不得把样例数字照搬为公共默认值 | 样式 diff、token 引用与 computed styles | [DESIGN 三层Token](DESIGN.md#三层token的工程约束) · [DESIGN Typography/Layout](DESIGN.md#typography) |
| EXAMPLE-002 | 页面把所有正文、表单帮助或普通标签设为等宽字体 | Mono 只用于合同适用的代码、技术标识或数值角色；普通文本继承对应 sans 角色 | 元素 font-family 与文本用途清单 | [DESIGN Typography](DESIGN.md#typography) |
| EXAMPLE-003 | 表单错误通过绝对定位脱离字段流 | 使用公开 Field.error 关联与正常字段布局；仅已有组件明确提供 Tooltip 时按其合同使用，不做通用绝对定位补丁 | Field DOM、aria-invalid/describedby、错误出现前后几何 | [DESIGN 表单与反馈](DESIGN.md#表单搜索与反馈) · [COMPONENTS 密码输入](COMPONENTS.md#密码输入) |
| EXAMPLE-004 | 设计稿/样例写“自动登录”或首次打开直接宣称已登录 | 只复用认证合同允许的既有 refresh→session 恢复；没有确认的登录事实不得伪造，不从图稿推导后台登录动作 | auth owner 请求顺序、session 状态与 Network 记录 | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [DESIGN 认证展示边界](DESIGN.md#认证超时与安全恢复的展示边界) |

## 表单、数据表格和弹层

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| FORM-001 | 表单有可并列短字段 | 使用 `FormGrid` 正式列结构，不用每字段固定宽度堆成单列 | JSX/HTML、computed grid 与 1280px 截图 | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| FORM-002 | 表单有长文本、规则或整行确认 | 对应 `FormGrid.Item` 使用公开 `span="full"` | props/slot 接线与网格占列几何 | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| FORM-003 | 字段属于独立语义组 | 使用 `Fieldset` 的 `legend`，不使用纯边框标题代替组名 | DOM fieldset/legend 与读屏树 | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| FORM-004 | 每个 control 有可见名称 | 使用 `Field.label` 及正式 control 关联，同一 control 只关联一个主 label | label/control ID 及 accessibility snapshot | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| FORM-005 | 字段需要填写帮助 | 帮助进入 `Field.help` 并关联目标 control | aria-describedby 与具体 help 节点 | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| FORM-006 | 字段校验失败 | 错误进入 `Field.error`，同步 aria-invalid 与描述关联 | 提交失败后的 DOM/ARIA 与错误文本 | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| FORM-007 | 表单有主提交按钮 | 主操作进入 `FormActions` 主操作组，语义为实际 submit | 表单键盘提交、按钮 type 与 Network | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| FORM-008 | 表单有取消/返回等次操作 | 次操作进入 `FormActions.secondary`，取消不隐式提交 | props/Node、按钮 type 与行为录像 | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| FORM-009 | 表单只有主操作或只有次操作 | 不为缺失操作组保留空占位 | 空组 DOM/geometry | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| FORM-010 | 表单布局在窄屏或200%文字下 | 网格退为可读单列，label/help/error 和操作完整换行 | viewport/字体缩放矩形与截图 | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) · [DESIGN 表单和响应式](DESIGN.md#表单和响应式) |
| TABLE-001 | DataTable 有搜索、筛选或工具动作 | 工具内容放 `DataTable.toolbar`；无工具时无空工具区 | props/Options 与表格首行 geometry | [COMPONENTS 数据表格](COMPONENTS.md#数据表格) |
| TABLE-002 | DataTable 首次加载 | 使用 `status=loading`；唯一加载提示相对可见表体（不含表头/工具栏/footer）水平垂直居中，横向超宽列不使其偏移，不把未知计数显示为0条成功 | 页面状态、DOM 和首个响应前截图 | [COMPONENTS 数据表格](COMPONENTS.md#数据表格) |
| TABLE-003 | 已加载查询结果为空 | 使用 `emptyState`，保留列头并区分空数据与筛选无匹配 | rows/filtered事实与 tbody DOM | [COMPONENTS 数据表格](COMPONENTS.md#数据表格) |
| TABLE-004 | 首次请求失败 | 使用 `errorState`，不显示成功空态或假记录 | HTTP失败记录与表格 DOM | [COMPONENTS 数据表格](COMPONENTS.md#数据表格) |
| TABLE-005 | DataTable 同范围刷新 | 使用 `feedback` 槽表达局部刷新事实，保留旧行/旧计数与稳定行身份 | 请求日志、旧行节点 identity、刷新中截图 | [COMPONENTS 数据表格](COMPONENTS.md#数据表格) |
| TABLE-006 | 表格需要计数/分页/补充说明 | 使用唯一 `DataTable.footer`，不在外部复制另一个分页/计数 owner | footer DOM 与翻页动作计数 | [COMPONENTS 数据表格](COMPONENTS.md#数据表格) |
| TABLE-007 | offset/cursor 分页 | 发布已确认的受控 pagination facts；只有成功响应后再更新行与页事实 | 请求 query/cursor 与前后状态快照 | [COMPONENTS 数据表格](COMPONENTS.md#数据表格) |
| TABLE-008 | DataTable 同范围刷新失败 | 旧行/旧计数继续可见，`feedback` 显示失败及真实可用恢复入口；不得改成空态 | 失败注入、旧行 identity、错误文案和恢复事件 | [COMPONENTS 数据表格](COMPONENTS.md#数据表格) |
| TABLE-009 | 普通或含sticky列的Table/DataTable | 全表仅行线，固定列不额外画竖线/阴影；保留固定、横滚、行底色及焦点，不以取消sticky或私有CSS修补 | 普通/左/右/双侧固定、主题/窄屏/200%、空/加载/刷新截图和computed border、横滚及命中 | [COMPONENTS 数据表格](COMPONENTS.md#数据表格) |
| OVERLAY-001 | 打开 Dialog | 标题和可选描述进入公开 `Dialog.Header` | 组件组合与标题 ID 关联 | [COMPONENTS 弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| OVERLAY-002 | Dialog 内容较长 | 输入/内容放 `Dialog.Body`，由其及真实祖先拥有滚动 | body scrollTop、容器滚动录像 | [COMPONENTS 弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| OVERLAY-003 | Dialog 有提交/取消动作 | 操作进入 `Dialog.Footer`，主次动作和键盘序列明确 | DOM slot 与 Tab/Enter/Escape 录像 | [COMPONENTS 弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| OVERLAY-004 | 打开 Sheet | 标题和说明进入公开 `Sheet.Header`，不另造私有抽屉头 | 组件组合、标题可访问性 | [COMPONENTS 弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| OVERLAY-005 | Sheet 内容较长 | 表单/列表进入 `Sheet.Body`，不扩大整页或裁切 footer | Sheet/body scroll 及窄屏录像 | [COMPONENTS 弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| OVERLAY-006 | Sheet 有提交/取消动作 | 操作进入 `Sheet.Footer`，可达且不会被正文遮挡 | DOM slot、滚动到底及键盘录像 | [COMPONENTS 弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| OVERLAY-007 | Dialog/Sheet 中打开 Select 或 Combobox | 实际指针命中可见选项；不能被 footer/其他层截获，也不能以 force click 代替。键盘选择、Escape关闭与回焦点仍按公开 peer 合同 | elementFromPoint、真实指针操作、键盘轨迹与 activeElement | [COMPONENTS 选择与复合控件](COMPONENTS.md#选择与复合控件) · [PUBLIC_API 样式入口](PUBLIC_API.md#全部正式入口) |
| INPUT-001 | 输入需上下工具/附件区 | 使用 `InputGroup.Addon`，不以绝对定位覆盖 control | 正式组合 DOM 与碰撞几何 | [COMPONENTS InputGroup](COMPONENTS.md#多行输入与上下工具区域) |
| INPUT-002 | 多行输入在纵向工具布局中 | 使用 `InputGroup.Root layout="stacked"` 和 `InputGroup.Textarea` | props/Options 与垂直顺序 | [COMPONENTS InputGroup](COMPONENTS.md#多行输入与上下工具区域) |
| INPUT-003 | 多行输入需要自动增高 | 明确选择 React `TextareaProps.autoResize`；未启用者保留浏览器原生行高/滚动 | props、初始高度与输入录像 | [COMPONENTS InputGroup](COMPONENTS.md#多行输入与上下工具区域) |
| INPUT-004 | autoResize 超过 maxRows | 输入框内部滚动，外层弹层和页面不随字符无限扩张 | rect/clientHeight/scrollHeight 与滚动录像 | [COMPONENTS InputGroup](COMPONENTS.md#多行输入与上下工具区域) |
| INPUT-005 | InputGroup 内部有动作按钮 | 使用公开 Addon/Button 语义，按钮保持独立 type、disabled 和回调 | DOM、键盘与点击动作计数 | [COMPONENTS InputGroup](COMPONENTS.md#多行输入与上下工具区域) |

## NavigationMenu、文字层级和色彩

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| NAV-001 | 菜单项存在子项并可展开 | 分支展开按钮用公开独立按钮入口，不让分支主链接被替代 | DOM role、href 与两按钮回调记录 | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-002 | 菜单项有独立配置/更多动作 | 动作进入公开 action slot/callback，不冒泡触发行导航 | 点击动作计数与 location/history | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-003 | 菜单项配置右键菜单 | 右键菜单动作不触发主链接导航 | contextmenu 和导航事件日志 | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-004 | 分支名长于菜单宽度 | 仅名称按 OverflowText 合同展示；折叠/展开按钮和行尾动作不被挤出 | 最小/中间/最大宽度矩形、悬停录像与焦点录像 | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-005 | 桌面默认展开或收起 | 展开使用公共min/max与16vw动态宽度（默认192–224px）、50vw封顶；收起使用60px compact rail，不写内部宽度覆盖 | computed width 与正式默认值 | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-006 | 用户键盘操作菜单 | 方向键、Home/End、Enter/Space 按公开导航合同工作 | 自动化按键轨迹与 active/expanded 状态 | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-007 | 菜单处于窄屏 Drawer | 只有一个可见打开入口；关闭回到原触发按钮 | 窄屏 DOM 计数、焦点前后 activeElement | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-008 | 名称旁有非交互运行/等待状态 | renderLabel使用主项剩余宽度；名称可收缩、尾随状态不收缩并位于逻辑末端；有独立分支/配置时保留各自轨道，不将状态伪装成action按钮 | 短/长名称、默认展开/60、窄屏与200%矩形，状态出现/消失前后节点与焦点 | [COMPONENTS 富条目导航](COMPONENTS.md#富条目独立行尾动作与上下文菜单) |
| NAV-009 | 富标签开启名称滚动 | 只有NavigationMenu.Label内的名称移动；尾随状态和分支/配置不动，触控/reduced-motion完整换行且与名称首行对齐 | 悬停/键盘录像、动态偏好切换、RTL及名称/状态更新记录 | [COMPONENTS 富条目导航](COMPONENTS.md#富条目独立行尾动作与上下文菜单) |
| NAV-010 | 导航项处于当前选中状态 | 主名称、富标签说明与公共文字/图标槽共同继承主题 selected 前景，muted 不覆盖选中色；hover、pressed、focus 保持该色，禁用前景优先，竖线仅辅助 | 三主题、普通/富标签与200%文字/浏览器zoom的computed color及截图 | [DESIGN 状态前景](DESIGN.md#逐组件外观与状态映射) · [COMPONENTS 导航](COMPONENTS.md#导航与菜单) |
| NAV-OWNER-001 | 每个NavigationMenu首次接线 | 记录显式注入/借最近Shell/脱离Shell默认实例三种来源；共享只用于同一导航展示范围，不把菜单数量当实例数量 | 范围→Controller实例身份表，逐个标明共享原因 | [导航Controller作用域](COMPONENTS.md#导航-controller-作用域) |
| NAV-OWNER-002 | 多个独立范围或keepMounted Tabs菜单 | 每范围稳定注入独立Controller；隐藏空范围的[]、受控更新及祖先揭示不能覆盖另一范围的展开集合 | 非空团队/空归档等至少两范围同时挂载，切换前后expandedIds与真实aria-expanded/子树可见性 | [导航Controller作用域](COMPONENTS.md#导航-controller-作用域) |
| NAV-OWNER-003 | 独立菜单使用受控展开 | expandedIds/onExpandedChange在该范围Controller配置并随事实update；注入后不再传同名菜单props；请求只由原owner确认一次 | 正负类型/JS互斥检查、请求与确认时间线、拒绝请求无值变更/无回调循环 | [导航Controller作用域](COMPONENTS.md#导航-controller-作用域) |
| NAV-OWNER-004 | 注入菜单须跟随Shell收拢 | 各Controller同步同一Shell collapsed事实及必要请求回调；不假定注入后仍自动继承，不新增Shell/drawer/全局收拢owner | 全范围展开/紧凑往返的快照、选中与操作可达，收拢事实来源唯一 | [导航Controller作用域](COMPONENTS.md#导航-controller-作用域) |
| NAV-OWNER-005 | render、刷新、隐藏、StrictMode或真实范围退出 | render/刷新/隐藏不重建或销毁；StrictMode replay不破坏仍复用实例；真实退出/替换由创建者清理注入实例，View只退订自己的连接 | 创建/订阅/退订/destroy计数、实例身份、两次StrictMode交互及真实卸载后无迟到通知 | [导航Controller作用域](COMPONENTS.md#导航-controller-作用域) |
| MENU-SEP-001 | 菜单中需要分隔不同内容组 | 使用 `Menu.Separator` 或 `ContextMenu.Separator`，它不执行动作、不可成为额外键盘停靠点，浅深主题下仍清晰可辨 | role/aria、Tab顺序、主题computed样式与两种菜单组合 | [COMPONENTS 弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| MENU-VIEW-001 | 使用数据驱动 `Menu.View` | 默认 config 模式只有一个由 View 管理的内部 Controller；注入模式完全替换它，不创建默认实例，且 Controller 生命周期归注入宿主。两种 props 模式互斥 | 正/负类型编译、Controller 创建/订阅/退订/destroy 计数与实例身份 | [COMPONENTS 数据菜单与 Controller 所有权](COMPONENTS.md#数据菜单与controller所有权) · [PUBLIC_API `/menu`](PUBLIC_API.md#全部正式入口) |
| MENU-VIEW-002 | 菜单动作执行或需自定义焦点行为 | `actionId` 只映射宿主动作；只有同步 `event.preventDefault()` 取消本次默认关闭。异步操作仍归宿主，Base UI 是方向键与实际焦点的唯一 owner | pointer/keyboard 一次动作计数、阻止关闭断言、ARIA/焦点轨迹与迟到业务回调 | [COMPONENTS 数据菜单与 Controller 所有权](COMPONENTS.md#数据菜单与controller所有权) |
| STATE-OWNER-001 | 采用任一有语义交互状态组件 | 逐项选择默认或同契约注入，完整替换不创建/订阅并行默认；不得把value/onChange或handle算完整注入；Toast使用正式xui Controller，不传旧peer动作bus | 默认/注入/不适用/未满足逐项证据，不得全量笼统打勾 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-002 | 默认模式使用受控值 | 用户请求不提前发布未确认值；外部确认不触发回调循环，default仅初始化 | 拒绝/接受请求与动态值更新计数 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-003 | 注入或替换Controller | 初始化/受控/callback互斥；实例切换退订旧实例，不destroy注入者、不覆盖其配置；DOM/焦点连续 | 正/负类型、JS冲突、订阅计数、旧实例动作与焦点 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-004 | 默认实例生命周期或异步操作 | StrictMode不重复请求，不在effect replay永久销毁；真实退出取消所属等待并隔离迟到结果 | replay/卸载/切换、请求次数及迟到操作 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-005 | 登录、密码、初始化、一次性Key | 秘密只在DOM/瞬时提交边界，安全快照无密码/匹配词/secret，退出清理；现有AuthClient与权限owner不替换 | 快照检查、扩展await前后读取及退出DOM/worker清理 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-006 | ApiKey/业务日志/结构化日志View | 旧controller仅service；完整注入使用viewController且与service/options初始化互斥。默认依赖显式adapter/loader；展示草稿/客户端页不复制服务查询 | 三模式、请求次数、借用/所属销毁、取消/快照/刷新保行 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-007 | 导航、选择与Overlay组合 | 同一导航树/选择组/Overlay共享所属语义实例；独立导航范围按NAV-OWNER逐项隔离，View/peer执行实际键盘/焦点/portal；路由、分组页、active事实归宿主 | 组合实例/受控拒绝、disabled、Escape和同树焦点 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| AUTH-UI-001 | 采用完整登录、初始化或纯认证布局 | 统一使用AuthPage及其组合；品牌位于卡片外，title/description属于卡片内标题组，不用宿主DOM/CSS复刻 | 实际props/组件映射与三主题桌面/窄屏截图 | [认证布局](COMPONENTS.md#认证布局-slot-归属) |
| AUTH-UI-002 | 提供品牌/Logo | config.productName/logo原样显示；Logo保留src/alt/referrerPolicy与比例；无Logo无占位，长名称自然换行 | 首次/更新/移除Logo、长中文及computed字形/几何 | [认证布局](COMPONENTS.md#认证布局-slot-归属) |
| AUTH-UI-003 | 填写字段或扩展认证内容 | children或beforeFields/afterFields只放真实Field/控件组；空扩展不占位，不嵌套form、不增加虚构入口 | label关联、Tab顺序、空槽/长中文与宿主输入节点身份 | [认证布局](COMPONENTS.md#认证布局-slot-归属) |
| AUTH-UI-004 | 主动作、次级动作与反馈 | actions只放主提交；alternatives只放真实SSO等次级入口；feedback/feedbackActions在主动作后自然增高，空槽无轨道 | busy/error/unknown、请求次数、DOM身份及必要结果全文可读 | [认证布局](COMPONENTS.md#认证布局-slot-归属) |
| AUTH-UI-005 | 字体与界面放大 | 采用login-title、section-title、body-sm/meta角色与公共缩放；宿主不设内容字号/控件皮肤，不缩字或裁字段维持构图 | light/dark/system、320/390px、125/150/200%界面、200%文字及真实浏览器缩放 | [认证设计](DESIGN.md#公共登录页布局与主题) |
| AUTH-UI-006 | 登录视觉升级 | AuthClient、导航、密码清理和扩展回调归属不变；提交无取消、无重复写，切主题/缩放不重挂表单 | Network顺序、受控/注入、焦点/选区、pagehide及迟到结果 | [认证会话](PUBLIC_API.md#认证会话) |
| AUTH-UI-007 | 检查/错误切换到管理员初始化 | 保留同一AuthPage与品牌/卡片节点；children使用AdminSetupForm，AuthPage从首次挂载省略form；检查阶段零form、初始化阶段唯一form，不复制校验/提交或嵌套完整页面；busy/清密/未知结果仍按原合同 | 阶段切换前后node identity、form计数、请求与密码清理轨迹 | [初始化组合](COMPONENTS.md#可组合初始化表单) |
| AUTH-UI-008 | 管理员用户名规则 | 需附加规则时使用可选validateUsername同步纯函数：原值输入，null通过/非空本地化字符串拒绝；注入模式只在Controller配置；缺省仅非空。失败零写入、关联错误并聚焦，修正/clear后可恢复，未知结果仍锁定；不在宿主复制字段或私有DOM补丁 | 默认/注入、无规则、语言更新、异常回调、Enter、错误关联和零请求证据；核对未改写提交值 | [用户名校验](COMPONENTS.md#宿主用户名校验) |
| AUTH-UI-009 | 已认证后的宿主交接失败与重试 | 失败保留认证，主按钮普通文案/禁用/非busy，不同时声称opening；仅重试导航，保留字段/密码清理与回焦；阶段订阅不携带异常正文或秘密 | 同步throw/Promise拒绝、失败→重试等待→再失败→成功，Network次数/节点/焦点及阶段事实 | [完整登录页](COMPONENTS.md#完整页面与扩展) |
| COLOR-001 | 展示普通归属/来源类别 | 使用中性 Badge/tone，不以 success/warning/error 颜色代替分类 | Badge props、light/dark computed colors | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-002 | 展示成功/运行状态 | 只有后端或业务状态明确成功时使用 success 语义 | 状态来源字段与 DOM tone | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-003 | 展示警告/等待/人工介入状态 | tone 与真实状态分类逐条映射，不只用颜色传达状态 | 领域状态映射表和可访问文本 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-004 | 展示错误/失败状态 | 错误语义有文本/图标辅助，不把一般信息着色成错误 | 错误来源与两主题截图 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-005 | 出现删除/撤销等危险操作 | 使用公开 danger 语义；确认、权限和实际 mutation 仍归业务 owner | Item tone、公共 CSS 与确认回调 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-006 | 页面存在标题/摘要/meta/disabled/help 文本 | 分别使用 DESIGN 规定文字角色和对比，不手写每页字号/颜色 | computed tokens 与角色映射 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-007 | 展示数值、ID、时间或代码 | 按 DESIGN 对应文本角色呈现；不把任意正文改成 mono 或截断事实 | computed font family 与完整值 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-008 | 验收默认主题或集中品牌覆盖 | 先用无产品覆盖的固定正式包核对 canvas/shell/content/overlay，再验证品牌覆盖；默认主题缺陷交 xui，不要求产品逐页补皮肤 | 正式包来源、CSS 加载链、四类表面计算值与同视口截图 | [DESIGN 默认主题层级](DESIGN.md#默认主题层级与动作强调) |
| COLOR-009 | 表格包含多行重复操作 | 日常动作采用已有 ghost/link/必要 outline；危险菜单用 danger，最终危险决策用 destructive；不把所有行操作做成实心主色/红色，不新增行按钮字号 | Table.Actions/columns 接线、实际变体与整表截图 | [DESIGN 默认主题层级](DESIGN.md#默认主题层级与动作强调) |
| COLOR-010 | 输入、选中、hover/pressed、焦点及状态反馈 | 按实际合成背景验算文字4.5:1、必要控件/焦点3:1；输入内外背景均测，设计稿的标称比值不算证据 | 浏览器计算颜色、合成算法、各状态比值与焦点截图 | [DESIGN 默认主题层级](DESIGN.md#默认主题层级与动作强调) |
| COLOR-011 | 选择项目品牌 | 六套preset或自定义品牌明确；未配置violet，保留青色显式precision；未知配置失败 | config.json、resolveConfig与固定版本 | [项目配色与首绘](PUBLIC_API.md#项目配色与首绘) |
| COLOR-012 | 首绘与启动 | 项目首绘脚本与bootstrap来自同一配置；init在CSS/应用前，不创建第二owner | 阻止应用JS时根preset/mode及首帧截图 | [项目配色与首绘](PUBLIC_API.md#项目配色与首绘) |
| COLOR-013 | 运行期切换配色 | 同一ThemeService.setPreset；不改变mode/缩放、不写storage；弹层/草稿/焦点/滚动保留；自定义Controller补齐preset | 同页切换、storage写入、刷新回项目配置 | [项目配色与首绘](PUBLIC_API.md#项目配色与首绘) |
| COLOR-014 | 保留自定义品牌 | product-overrides优先；浅深/system检查全部交互状态的文字/输入内外边界/焦点对比度 | 产品正式包实测与截图，不以库示例替代 | [项目配色与首绘](PUBLIC_API.md#项目配色与首绘) |
| COLOR-015 | 红绿品牌与状态 | 状态使用独立status-*和明确文案，危险操作依tone/确认，不将status别名到primary | 红绿品牌下成功/失败/普通/危险动作对照 | [项目配色与首绘](PUBLIC_API.md#项目配色与首绘) |


## 刷新、身份与生命周期

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| LIFE-001 | 页面第一次加载资源 | shell/header/标题稳定存在；loading 位于数据所属区域 | DOM 时间线与首个请求 waterfall | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-002 | 已有数据同范围刷新 | 旧确认数据（含空态）持续可见；固定刷新按钮闲置文字居中、忙时图标与文字同组且宽高不变，不临时插入反馈/取消动作挤动布局，不卸载整页/组件 | 节点 identity、ready/refreshing 几何差分、快照与 Network | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-EMPTY-001 | 已确认空结果刷新失败 | DataTable/CardGroup传入当前范围hasValue=true，保留emptyState并显示错误/重试；首次读取或换范围重置，不伪造空结果 | 成功空→刷新→错误与首次错误对比 | [集合生命周期](COMPONENTS.md#状态焦点与生命周期) |
| LIFE-FOCUS-001 | 移动导航关闭并打开未保存确认 | 确认期间焦点留在AlertDialog；保留草稿后通过navigationTriggerRef/finalFocus回到可见开关，放弃则回宿主目的操作；不访问私有DOM | 指针/Enter/Space/Escape、焦点及ref生命周期 | [抽屉确认回焦](COMPONENTS.md#导航抽屉与未保存确认的最终焦点) |
| LIFE-003 | 查询范围发生变化 | 旧数据清除或明确标为旧范围；不得把旧事实冒充新查询结果 | query key、范围标签和 rows 数据来源 | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-004 | 刷新请求失败 | 保留上一份已确认数据、筛选草稿和局部错误/恢复入口 | 断网/HTTP错误注入及前后快照 | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-005 | 同一筛选连续刷新两次 | 新请求 generation 获胜，迟到旧响应不能覆盖新结果 | 延迟响应逆序测试与最终数据断言 | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-006 | 请求被取消或页面切换 | 取消的迟到结果不提交、不改变新页面状态 | AbortSignal 记录与迟到响应断言 | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-007 | 同范围行值更新 | 稳定业务 key 保留行与焦点控件身份 | 更新前后 element handle/activeElement | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-008 | 刷新发生在用户输入草稿时 | 草稿值和 selectionStart/End 保持，除非对应业务明确提交 | 受控值、选区与节点身份记录 | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-009 | 刷新或分页期间页面已滚动 | scrollTop/scrollLeft 不无故归零或跳到页面顶部 | document/容器滚动值前后记录 | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-010 | 组件 busy/refreshing | 只禁用其不允许重入的动作，不使整页 inert 或卸载只读内容 | aria-busy/disabled 与键盘操作 | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-011 | React 组件卸载 | 组件拥有的 observer/listener/timer/request 清理；不清理宿主仍在使用的共享 service | observer/listener/request 计数与卸载记录 | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-012 | 新身份、tenant 或资源 owner 接管 | 旧身份私密资源销毁，不让旧请求迟到污染新身份 | owner generation、缓存清理与请求序列 | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-013 | 刷新开始时焦点位于表格行或表单控件 | 更新后原业务节点仍是 activeElement；只有用户操作或节点被业务合法删除时才移动焦点 | 刷新前后 activeElement 与节点 identity | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |

| TABLE-SCROLL-001 | 自然高度表体无纵向溢出 | 指针位于单元格时，上下滚轮交给既有页面/内容owner；viewport的header/侧栏不随正文移动；不依赖表格外空白或wheel补丁 | 实际wheel输入、表体及祖先scrollTop/clientHeight/scrollHeight、header/侧栏矩形 | [DataTable滚动](COMPONENTS.md#页面标题筛选与滚动) |
| TABLE-SCROLL-002 | 真实有界表体、少/多/空行及尺寸变化 | 有纵向范围时表体滚动且首末边界保留；范围消失后不阻断祖先；数据/字号/视口更新保留DOM和焦点 | 滚轮前中后范围、节点身份、两种200%、键盘入口 | [DataTable滚动](COMPONENTS.md#页面标题筛选与滚动) |
| TABLE-SCROLL-003 | 表格横向溢出及sticky列 | 横向wheel仅滚动表体，页面不横向漂移；sticky列/表头对齐、分页和最后操作仍可达 | scrollLeft、sticky矩形、焦点与分页实际操作 | [DataTable列宽](COMPONENTS.md#页面标题筛选与滚动) |

## API 接入公共底座

本清单的 17 项是 xui 已明确的公共业务操作，不代表所有业务/第三方 API 都须改造成这些 endpoint。OAuth/OIDC/SAML、上游模型、MCP、插件和其他领域接口继续遵循各自协议。BaseService 只能按该能力当前实际提供的 facade 使用，不能假称所有表格操作均已存在。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| API-BASE-001 | 某项目采用 xui 公共17项操作，且 BaseService 对应版本包含该项 facade | 按该能力实际存在的 BaseService 配套服务与 facade 接入，并由 xui 官方 client 发起；前端不再插入同协议转换/包装层 | 版本化服务依赖、路由注册、client 调用源码与 Network wire | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-002 | 某项目未采用 BaseService，或 BaseService 尚未提供该公共操作 | 由宿主后端在一个 facade 边界实现 PUBLIC_API wire；前端仍直接使用官方 xui client，不增加前端协议适配层 | 服务端 route/DTO projection、client 调用链与同一响应抓包 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-003 | 领域模型字段与 xui 已声明的公共 DTO 不同 | 最多在宿主后端 facade 投影一次；前端不再把领域 DTO 转成公共 DTO，也不让后端再次转换 | 唯一 mapper 调用链、前端网络 client 与响应 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-004 | 任一公共操作所需的真实服务能力不存在 | 逐项记宿主未接入/失败并标后端 owner；不以 mock、静态假响应、虚构数据或前端 adapter 记通过 | 后端路由/服务版本与逐项报告 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-005 | 前端调用任一这17项公共操作 | 由 xui 官方 client 承担 endpoint、method、query/body、envelope、解析与公开错误；不得重复实现 client 或协议解析 | 前端 call graph、模块 resolved path 与 fetch/Network 记录 | [PUBLIC_API HTTP 与查询](PUBLIC_API.md#http-与查询) · [正式入口](PUBLIC_API.md#全部正式入口) |
| API-BASE-006 | 核验任一公共操作请求 | 逐操作对照 PUBLIC_API 中该 operation 的 method/path/query/body/credentials/header；不猜别名，不要求业务/第三方 API 改造 | 该操作的 wire fixture 与抓包逐字段比较 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-007 | 任一 HTTP 2xx 响应包含 AjaxResponse envelope | 仅 `success=true` 才是 envelope 成功；`code` 依合同作为安全整数元数据，不猜固定成功码或 payload 别名 | HTTP 200 success true/false 夹具与 UI 状态 | [PUBLIC_API HTTP 与查询](PUBLIC_API.md#http-与查询) |
| API-BASE-008 | 任一公共操作返回非2xx、业务失败或 parser 错误 | 按该 operation 的 PUBLIC_API/runtime error kind/status/code 分支；不能把所有 API 的 403/404/409/5xx 映射成相同文案 | 对应错误注入、HttpError/state 与用户可见反馈 | [PUBLIC_API 安全错误](PUBLIC_API.md#安全错误认证与重试) |
| API-BASE-009 | 响应 DTO 含缺失字段、额外字段、错类型或未知字段 | 严格遵循逐 adapter parser：auth 与 API-Key wire 是封闭字段合同；BusinessLog/StructuredLog 响应投影公开字段并丢弃额外内容；不能全局拒绝或允许额外字段 | 对应 runtime parser 对正负夹具的结果及实际响应字段 | [PUBLIC_API 对应 adapter/runtime](PUBLIC_API.md#全部正式入口) |
| API-BASE-010 | 响应包含 nullable、ID 或高精度时间字段 | 按对应合同验证 null/格式/范围；ID 保留字符串精度，RFC3339Nano 时间不得经 JS Date 降到毫秒 | 边界 fixtures、原始 wire 与 UI 展示值 | [PUBLIC_API ID 编码](PUBLIC_API.md#显式实体身份编码) |
| API-BASE-011 | 列表返回 offset total 或 StructuredLog cursor/as_of | 只显示响应确认的 total、cursor、snapshot/as_of；API-Key 要求准确 total；BusinessLog default loader 要求 total 字段存在但 null 仍是未知；StructuredLog 不得虚构 total | 原始分页响应、多页游标及 UI page facts | [PUBLIC_API 分页合同](PUBLIC_API.md#列表元数据与受控游标分页) |
| API-BASE-012 | 任何 mutation 返回超时、断线、取消或结果未知 | xui client 不自动重放写请求；只执行该 API 明确允许的普通读取核验或用户触发只读重试 | 请求次数、取消/超时轨迹及 API 专属核验请求 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |

<a id="16-个公共-api-操作逐项检查"></a>

## 17 个公共 API 操作逐项检查

下列每个操作独立记录三项：请求接线、成功事实、异常/权限。默认适配器的实际字段、fixture、路径可配置项和业务语义只从对应固定版本 [PUBLIC_API.md](PUBLIC_API.md) 与 runtime parser 读取；本表不另造 DTO。没有真实服务时逐项报告未接入，不构造通过证据。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| AUTH-LOGIN-REQ | 用户提交登录 | `POST /api/v1/auth/login` 只发送 username/password JSON；Accept/Content-Type 为 application/json，无 Authorization，credentials=same-origin、cache=no-store、redirect:error、无自动重试 | 浏览器 Network method/path/body/headers/credentials | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-LOGIN-OK | login 返回成功 envelope | 严格解析字段闭合的 IssuedSessionV2；Access 只在 auth owner 私有闭包内存；公开 AuthState 与 login 返回值只有 user | response fixture、AuthState keys 与 storage/log scan | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-LOGIN-ERR | login 返回拒绝或请求结果未知 | 按准确 HttpError 分支；401拒绝可保留此前确认会话；403不触发刷新；50301/50302结果未知时仅走既有 refresh→session核验，不重发login | 拒绝/503注入、Network顺序与 AuthState 时间线 | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-REFRESH-REQ | 初始化、明确 refresh 或受保护请求需要恢复 access | `POST /api/v1/auth/refresh` JSON `{}`；无 Authorization、仅同源恢复 Cookie、credentials=same-origin、no-store、redirect:error | Network method/path/body/credentials 与 Cookie | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-REFRESH-OK | refresh 返回签发 envelope | 严格解析 v2；access token 只进入 auth owner 私有内存，不进入 state/return/storage/URL/log；refresh 直接返回时只暴露用户，若由 currentUser 恢复则该调用随后完成 session 核验 | parser fixture、refresh 与 session 请求顺序、public state 和 storage scan | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-REFRESH-ERR | refresh 返回 401/409/429/503 或传输错误 | 401 按匿名恢复；409/429不自动重试；503依精确 code 保留失败/未知；不循环 bootstrap、不伪造登录 | 各类响应注入、请求次数和 AuthState | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-SESSION-REQ | 认证 owner 核对当前登录用户 | `GET /api/v1/auth/session` 带当前 session Bearer 且 credentials=omit；URL 固定同源 | Network method/path/headers/credentials | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-SESSION-OK | session 返回成功 envelope | 严格解析无秘密 AuthSessionV2；ID 按固定 encoding 保持字符串；不推断 role/tenant/permission | 真实/契约 response、AuthState 与权限数据来源 | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-SESSION-ERR | session 返回 401/403/其它错误 | 401清除当前会话；403不刷新、不重放；非403解析/传输错误维持 unknown，不伪造匿名或已认证 | 分状态码注入与 AuthState 时间线 | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-LOGOUT-REQ | 用户明确执行 logout | `POST /api/v1/auth/logout` body `{}`；不带 Authorization，仅同源恢复 Cookie；credentials=same-origin | 用户动作与 Network 请求抓包 | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-LOGOUT-OK | logout 返回 success 且 null payload | auth owner 确认 anonymous 并清理私有 access；宿主只由一个 owner 清理相关私密资源并导航 | AjaxResponse fixture、认证状态和清理/导航事件 | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-LOGOUT-ERR | logout 拒绝或请求结果未知 | 退出先清本地access/user并隔离旧代次；原owner核验后若最终仍unknown/error则busy结束，不自动重发、不宣称Cookie撤销；另按AUTH-LOGOUT-001～004与AUTH-RELOAD-001～003逐项验收 | 断线/失败注入、状态时序、请求次数与 cookie 可见事实 | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| AUTH-LOGOUT-001 | logout响应丢失/未知且未取消等待 | 仅原Auth owner执行一次现有refresh→session核验；确认匿名则完成退出，仍有会话/读取失败则保留unknown/error，不把候选凭据发布为authenticated | 初始logout、核验分支与最终状态的有序轨迹；读取401/仍登录/核验失败/取消分别记录，无轮询 | [未知退出与重载](PUBLIC_API.md#未知退出与页面重载) |
| AUTH-LOGOUT-002 | 退出开始或最终未知 | 隐藏私有页面并停止/取消领域读取、清理所属私密缓存；迟到旧响应不可重新展示内容；保留必要未知反馈 | 领域请求和缓存/DOM时间线、受控延迟响应；未知时零新增领域读取 | [未知退出与重载](PUBLIC_API.md#未知退出与页面重载) |
| AUTH-LOGOUT-003 | 同owner最终unknown/error后显示登录页 | ConfigurableLoginPage无busy时可手动普通login，不自动session核验；无旧“检查登录状态→进入工作空间”退出恢复按钮；只有新登录确认后恢复私有读取 | 同实例重挂前后请求计数、普通提交一次、失败仍停止读取、成功后读取与权限接线；不重发logout | [未知退出与重载](PUBLIC_API.md#未知退出与页面重载) |
| AUTH-LOGOUT-004 | 未知等待、重挂或失败恢复 | 原logout只来自明确用户动作；宿主不自动重发logout/login，不叠加核验循环或以任意authenticated样本误判原退出成功 | 自动等待窗口/挂载周期内写请求次数；内部核验、新登录、领域读取分别分类 | [未知退出与重载](PUBLIC_API.md#未知退出与页面重载) |
| AUTH-RELOAD-001 | 真正Document重载、新标签页或全新Auth owner | 与同owner重挂分开测；正常初始化可refresh/session，确认前不显示旧私密数据或发领域请求；确认身份后可恢复，401匿名不循环 | Document导航/owner身份、初始化请求/状态、首屏与领域请求顺序；不能要求所有初始化读取都为零 | [未知退出与重载](PUBLIC_API.md#未知退出与页面重载) |
| AUTH-RELOAD-002 | pageshow.persisted且仍为同owner | 不伪装为新Document；保留logout unknown/error时不因pageshow清错误或额外发读取，不销毁重建owner绕过该路径 | pagehide/pageshow.persisted、owner身份、错误状态与请求计数，同普通重载分开报告 | [未知退出与重载](PUBLIC_API.md#未知退出与页面重载) |
| AUTH-RELOAD-003 | 产品声称刷新后必须手动登录或服务器已退出 | 现有合同没有跨重载写入锁/退出门禁；不以URL/storage标记、假匿名或新前端适配owner证明Cookie撤销；额外策略列公共请求 | 明确策略与后端会话证据；删除旧恢复按钮断言仍保留零重放/读取停止/迟到隔离，不删除未知结果测试 | [未知退出与重载](PUBLIC_API.md#未知退出与页面重载) |
| KEY-CAPS-REQ | API Key 管理器读取配置 | 由官方 `createApiKeyHttpAdapter` 请求 `GET /api/v1/api-keys/capabilities`；复用一个已授权 HTTP/auth owner | 调用点、Network 与 adapter 参数 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-CAPS-OK | capabilities 成功响应 | 严格 v2 解析权限、期限、默认项、确认文案和 can_create；配置来自服务，不由页面猜值 | 响应 fixture、运行时配置与控件选项 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-CAPS-ERR | capabilities 失败、无权或 schema 无效 | 能力保持未确认/不可用，不启用创建，不猜权限、期限或默认值 | 错误/schema注入与按钮状态 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-LIST-REQ | API Key 列表初读或刷新 | 官方 adapter 发 `GET /api/v1/api-keys`，`page_index` 基数0、`page_size` 按配置、`return_total=true`、`sort=id&sort_id=asc` 并按 total 完整取页 | Network query 与 pages 请求序列 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-LIST-OK | API Key 列表成功 | 解析严格 v2 ListData；ID/total准确、跨页稳定；metadata 不含 secret | response fixture、全页计数与行ID比对 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-LIST-ERR | 列表缺 total、重复ID、total变动、越预算或 HTTP/业务拒绝（含403） | 该轮读取失败，保留最近已确认列表并提示真实错误；不伪造总数/末页 | 故障响应、旧行 identity 与错误状态 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-LIST-001 | API Key Manager 使用本地分页 | 只对完整已确认rows分页；默认pageSize/options按公开合同，翻页或改页长不发请求；总数等于完整集合长度；显式false关闭分页 | rows/page状态、控制器请求计数、翻页前后行ID与total | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [COMPONENTS](COMPONENTS.md) |
| KEY-COPY-001 | 列表密钥列 | 名称与API Key分列；keyCopy省略/false仅被动掩码，不触发读取或剪贴板；开关不重建原Controller/查询owner | 单元格DOM、读写计数、Controller身份 | [API Key复制](COMPONENTS.md#api-key-列与复制4241) |
| KEY-COPY-002 | 显式启用keyCopy | 点击/Enter/Space均复制完整授权值；哈希不可恢复项禁用，不复制prefix/掩码；busy防重，反馈仅Toast | 合成完整值布尔比较、键盘、禁用与请求数 | [API Key复制](COMPONENTS.md#api-key-列与复制4241) |
| KEY-COPY-003 | 复制中取消/卸载/记录或权限变化 | signal取消、迟到丢弃；秘密不进入state/metadata/URL/storage/日志/反馈；仅按正式v3读取合同；实际后端读取能力单独验收 | 取消与迟到注入、秘密扫描及后端合同 | [API Key复制](COMPONENTS.md#api-key-列与复制4241) |
| KEY-COPY-004 | 第一方列表复制接线前 | 逐项确认正式facade路由、目标/版本响应、可信Scope/授权、逐行可恢复与可读事实，以及官方adapter reader；4.2.43显式schemaVersion=3与BaseService SchemaV3配套，keyCopy=adapter.keyCopy；默认v2无reader，不自动探测/降级或加私有前端适配层 | 固定双方SHA、正式HTTP/types与缺口状态；core GetSecret不计作HTTP已完成 | [官方读取待办](PUBLIC_REQUESTS.md#api-key-列表复制的官方读取合同2026-10-27待-baseservice) · [HTTP合同](PUBLIC_API.md#默认-http-adapter严格-v2) |
| KEY-COPY-005 | 产品声称列表已可复制 | 验真实后端完整值与实际系统剪贴板；FormatHashOnly不可恢复，不复制prefix/掩码/ID/摘要，不自动轮换；合成demo与产品结论分开 | 产品实际记录格式/能力、请求和完整值布尔比较；不保存或打印真实秘密，缺前置则报告阻断 | [官方读取待办](PUBLIC_REQUESTS.md#api-key-列表复制的官方读取合同2026-10-27待-baseservice) · [API Key复制](COMPONENTS.md#api-key-列与复制4241) |
| KEY-COPY-006 | v3 reader请求/响应 | POST /api/v1/api-keys/{id}/secret，无query，精确expected_version；校验schema=3和ID/版本一致，拒绝非法完整值；无权/哈希/未知能力零读取 | Network目标/body、decimal/hex fixture、解析拒绝和取消/迟到；秘密不打印 | [授权读取](PUBLIC_API.md#api-key-授权读取v34243) |
| KEY-COPY-007 | 复制遇身份改变、到期或401 | 只借当前Auth owner，零隐式refresh/session/login、零重放；旧代返回丢弃，真实401清当前身份；普通HTTP原恢复规则保持 | 原owner身份、请求次数、跨身份迟到及实际产品认证接线 | [授权读取](PUBLIC_API.md#api-key-授权读取v34243) |
| KEY-SECRET-REQ | 用户明确复制且v3逐行能力允许 | 使用官方adapter.keyCopy，POST固定secret路径、当前expected_version、无query；只借当前凭据，不预取或重放 | 点击/Enter/Space各一次、busy防重、能力禁用零请求 | [授权读取](PUBLIC_API.md#api-key-授权读取v34243) |
| KEY-SECRET-OK | 授权读取成功 | 严格v3响应ID/版本匹配当前行；完整值仅交本次ClipboardService，元数据/状态/日志/URL/storage不存secret；Toast不挤动列表 | 系统完整值布尔比较、无秘密扫描、行节点/几何 | [授权读取](PUBLIC_API.md#api-key-授权读取v34243) |
| KEY-SECRET-ERR | 无权/不存在/冲突/哈希/未知/超时/取消/401或身份变化 | 失败不复制，不自动refresh/session/login或重发；旧代迟到丢弃，不轮换；冲突由用户明确刷新再操作 | 失败注入、认证与读取请求数、同owner/版本、迟到零写剪贴板 | [授权读取](PUBLIC_API.md#api-key-授权读取v34243) |
| KEY-CREATE-REQ | 用户确认并提交 API Key 创建 | `POST /api/v1/api-keys` 精确发送 name/permission_ids/expiry_id/confirmed；required/disabled/confirmed 按能力控制请求 | Network body 与表单确认事实 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-CREATE-OK | 创建返回成功 metadata 与 secret | 一次性 secret 只可经 controller 的私有结果视图读取；不进入公开状态、列表缓存、URL、storage、日志或业务 payload；关闭/pagehide/卸载清 DOM 值 | response、状态/list cache/storage/log scan 与关闭后 DOM | [PUBLIC_API 一次性值与验证边界](PUBLIC_API.md#一次性值与验证边界) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-CREATE-ERR | 创建拒绝、超时、断网或写结果未知 | 不重发创建；未知结果仅普通 list 核验一次，普通读失败保留错误；不能以同名记录证明本次提交 | 写/读请求次数与实际页面状态 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-UPDATE-REQ | 用户更新 Key 名称、权限或启用状态 | `PUT /api/v1/api-keys/{id}` 提交当前规范 ID、`expected_version`、name/permission_ids/enabled | Network path/body 与被编辑版本 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-UPDATE-OK | 更新返回成功 acknowledgement | 校验 schema_version=2、operation=update、completed=true、目标 ID 和 metadata；展示确认的版本 | 响应 fixture 与目标行版本/字段 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-UPDATE-ERR | 更新遇权限/不存在/版本冲突/未知结果 | 不覆盖更新期间服务端新版本；按准确错误处理，未知结果最多普通 list核验一次，不自动再写 | 并发冲突注入、请求数与服务器确认值 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-REVOKE-REQ | 用户明确撤销有权操作的 Key | `POST /api/v1/api-keys/{id}/revoke` body `{}`；路径 ID 与受控目标一致 | 确认动作、Network path/body | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-REVOKE-OK | revoke 返回成功 acknowledgement | 严格核验 schema_version=2、operation=revoke、completed=true 和目标 ID；按需用普通 list 读取新 metadata，不推断权限 | 响应、请求序列和最新行状态 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-REVOKE-ERR | revoke 被拒、404 或结果未知 | 按服务事实显示；不自动重发，也不把未确认状态显示为 revoked | 错误注入、行状态和请求数 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-DELETE-REQ | 用户删除管理记录 | 仅 revoked 且 capability 允许时请求 `DELETE /api/v1/api-keys/{id}/record`，无 body，动作确认独立 | 目标 metadata/capability、确认与 Network | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-DELETE-OK | 删除记录返回成功 acknowledgement | 严格核验 schema_version=2、operation=delete_record、completed=true 和目标 ID；表达为删除管理记录，不称撤销凭据 | 响应 fixture、目标ID与页面文案 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-DELETE-ERR | 删除目标未撤销、无权、找不到或结果未知 | 非 revoked 不发请求；失败/未知不冒报删除或撤销成功，未知只按明确读合同核验 | 请求计数、错误与最新列表 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| BLOG-LIST-REQ | 业务日志列表查询、筛选或 offset 翻页 | 官方 loader 发 `GET /api/v1/business-logs`；filter/page/sort 严格按固定 query contract 编码 | Network URL 与过滤/page 参数 | [PUBLIC_API 业务日志](PUBLIC_API.md#业务日志) · [runtime/business-log-http.ts](../packages/runtime/src/business-log-http.ts) · [runtime/business-log.ts](../packages/runtime/src/business-log.ts) |
| BLOG-LIST-OK | 业务日志列表 success | 解析 AjaxResponse/ListData 且 total 字段必须存在；total=null 保持未知，不从当前页长度补值；按响应顺序展示公共业务事实 | payload fixture、total 与行内容对照 | [PUBLIC_API 业务日志](PUBLIC_API.md#业务日志) · [runtime/business-log-http.ts](../packages/runtime/src/business-log-http.ts) · [runtime/business-log.ts](../packages/runtime/src/business-log.ts) |
| BLOG-LIST-ERR | 列表拒绝、缺 total、错类型或传输错误 | 按真实错误/合同错误显示并保留已有确认数据；响应允许的额外字段按 parser 投影丢弃，不全局因扩展字段拒绝 | 错误 fixture、parser 投影和旧行 identity | [PUBLIC_API 业务日志](PUBLIC_API.md#业务日志) · [runtime/business-log-http.ts](../packages/runtime/src/business-log-http.ts) · [runtime/business-log.ts](../packages/runtime/src/business-log.ts) |
| BLOG-DETAIL-REQ | 用户打开一条业务日志详情 | 官方 loader 发 `GET /api/v1/business-logs/{id}`；目标由当前认证/tenant scope 约束 | 点击目标 ID 与 Network path | [PUBLIC_API 业务日志](PUBLIC_API.md#业务日志) · [runtime/business-log-http.ts](../packages/runtime/src/business-log-http.ts) · [runtime/business-log.ts](../packages/runtime/src/business-log.ts) |
| BLOG-DETAIL-OK | 详情读取 success | 详情 event ID 等于请求目标；state=available 才呈现 payload；expired/unavailable 的 payload 必须为 null | 详情 fixture、目标 ID 与详情状态 DOM | [PUBLIC_API 业务日志](PUBLIC_API.md#业务日志) · [runtime/business-log-http.ts](../packages/runtime/src/business-log-http.ts) · [runtime/business-log.ts](../packages/runtime/src/business-log.ts) |
| BLOG-DETAIL-ERR | 详情 HTTP 403/404、无效 DTO 或 transport error | 区分权限、当前 scope 未找到、合同/读取失败；关闭/切换目标后不保留上一条正文冒充当前记录 | 各类注入、detail state 与关闭后 DOM | [PUBLIC_API 业务日志](PUBLIC_API.md#业务日志) · [runtime/business-log-http.ts](../packages/runtime/src/business-log-http.ts) · [runtime/business-log.ts](../packages/runtime/src/business-log.ts) |
| LOG-GROUPS-REQ | 错误观察页查询分组 | POST 到宿主明确配置的 groups endpoint；请求仅按 schema_version/filter/page 合同构造，不能猜固定产品路由 | endpoint配置、请求 body 抓包 | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-GROUPS-OK | groups 返回 success | 校验 schema_version/list/group/count/page；matched_* 是服务结果，不由当前页长度推导 | 响应 fixture、计数和 UI facts | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-GROUPS-ERR | groups 返回 403/404、合同错误或 transport error | StructuredLog 按 403 forbidden、404 not_found、parser contract、其它读取错误表达；失败不伪装空列表 | 四类故障注入与 controller state | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-LAYOUT-001 | 使用完整StructuredLogExplorer | 表头与三态/分类标签保留完整词组，计数/时间单行；摘要自然换行保留主列下限；空间不足只在表内横滚，不缩字号或覆盖私有CSS | 正式包长中文、1280/390/320、200%文字/真zoom与键盘滚动/行操作 | [COMPONENTS 记录页布局](COMPONENTS.md#数据表格) |
| LOG-RECORDS-001 | 服务或 adapter 未提供 records 能力 | 不显示跨组全量入口，不请求records；groups、groupRecords、record继续工作，公开setView('records')为no-op | adapter keys、页面入口、请求计数与分组/详情操作 | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-RECORDS-REQ | 服务明确提供 records 且用户查看全量观察记录 | POST 到配置的 records endpoint，body 为公开 filter/page；不把详情字段置入查询 | endpoint、真实能力配置与 request JSON | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-RECORDS-OK | 可选 records 返回 success | 只投影公共摘要字段；校验 list/page/as_of/next_cursor；无 total，后端网络列表不能携带 Detail/Stack/Related/Attributes | raw response、parser result、后端脱敏样本与 DOM | [PUBLIC_API 明确 DTO 投影](PUBLIC_API.md#明确-dto-投影) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-RECORDS-ERR | 已提供的 records 返回 forbidden/not_found/contract/transport error | 保留此前确认页并报告读取失败；不能造 cursor、末页、total 或 snapshot，retry 必须用户明确触发 | 注入错误、cursor history 和请求次数 | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-GROUP-RECORDS-REQ | 用户打开某个错误组的观察记录 | POST 到配置的 groupRecords endpoint；请求包含一致 filter/page 和明确 group_id | Network JSON 与当前选中组ID | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-GROUP-RECORDS-OK | groupRecords 返回 success | 响应 group ID 与所查目标相同；matched_entry_count 与 group.entry_count 保持不同事实 | 响应 fixture、组ID与两个计数 | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-GROUP-RECORDS-ERR | 组记录无权/未找到/合同错误/读取错误 | 保留当前组范围并就地显示相应失败；不把其他组数据作 fallback | 错误注入、group state 与当前 rows | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-RECORD-REQ | 用户明确查看单条错误详情 | POST 到配置的 record endpoint，body 精确为 schema_version 和 record_id；不附带组列表 filter/page | 点击目标与 Network request body | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-RECORD-OK | record 返回 success | record.id 与目标一致；只在单记录授权响应中呈现 Detail/Stack/Related/Attributes；`details_retained=false` 表示成功读取到已过保留期事实，Detail/Stack 正文置空 | 响应 allowlist、目标ID与详情 DOM | [PUBLIC_API 详情权限与生命周期](PUBLIC_API.md#详情权限与生命周期) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |
| LOG-RECORD-ERR | record 返回 403/404、contract 或 transport error | 按 403 forbidden、404 not_found、contract/transport 分类；过期由成功详情 `details_retained=false` 表示，不把404当过期 | 状态注入、detailState、正文清理记录 | [PUBLIC_API 程序错误观察](PUBLIC_API.md#程序错误观察) · [runtime/structured-log.ts](../packages/runtime/src/structured-log.ts) |

## 逐项浏览器验收矩阵

每个相关页面/组件至少执行一条正常路径和一条错误/空/忙路径。将 viewport、文字倍率和浏览器 page zoom 分开记录；CSS `zoom`、transform、DPR、pinch 不能替代浏览器真实缩放。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| BROWSER-001 | 每个页面首次打开 | 桌面 1280px 下标题、工具、正文和页尾 slot 顺序正确且没有意外空槽 | 浏览器截图、DOM slot 标注、录屏 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-002 | 每个页面窄屏打开 | 390px 下内容无横向裁切；控件按各自公开规则换行 | viewport 记录与整页截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-003 | 页面含长中文内容 | 标题、Badge、按钮和字段帮助可完整阅读，不以省略号隐藏唯一事实 | 具体 DOM 文本、矩形和截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-004 | 页面含无空格英文标识 | 受控断行/公开 overflow 行为不遮住其他 slot | 长英文用例与 geometry | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-005 | 系统文字放大到200% | 字体以真实浏览器/页面可访问性缩放方式改变，必要区域自然增高 | browser setting、computed font 与截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-006 | 浏览器页面 zoom 设为200% | 使用浏览器真实 zoom；关键按钮、Badge、错误、footer 仍可见/可聚焦 | zoom setting、CSS viewport 与截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-007 | 主题选择 light | 每个实际页面中的文字、表面、边界、hover/focus 清晰且语义颜色一致 | computed semantic tokens 与截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-008 | 主题选择 dark | 每个实际页面中的文字、表面、边界、hover/focus 清晰且语义颜色一致 | computed semantic tokens 与截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-009 | 主题选择 system | 系统浅/深实际切换后控件状态与 contrast 仍正确 | prefers-color-scheme 设置与截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-010 | 使用键盘访问页面 | 按自然 DOM 顺序经过所有必要入口，不跳过 slot、不陷入不可见控件 | Tab/Shift+Tab 录像与 focus trace | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-011 | 聚焦按钮、输入或导航动作 | 焦点轮廓不被滚动容器/卡片/弹层裁切 | focus bounding rect 与截图 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-012 | 打开 Dialog/Sheet 内部滚动 | Tab 可达首末动作，滚动归属唯一，关闭后焦点回原触发入口 | activeElement 与各容器 scrollTop | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-013 | 用户执行 Enter/Space/箭头键 | 对应公开控件只执行一次语义操作，不同时触发行导航/表单重复提交 | event/request counter 与键盘录像 | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |
| BROWSER-014 | 页面处于 reduced-motion | 非必要滚动/位移动画关闭，状态文本与静态内容完整 | media query 与 computed animation | [DESIGN 槽位架构](DESIGN.md#页面与组件的槽位架构) · [DESIGN 公共复用与状态矩阵](DESIGN.md#公共复用与状态矩阵) · [页面信息架构](DESIGN.md#首屏信息架构与信息密度) |

## 每条检查的报告模板

| ID | 对象/页面/组件实例/slot/API | 状态 | 期望 | 实际 | slot内容及owner | 视觉语义/token角色 | 排版与对齐 | 空槽行为 | 适用状态 | 滚动与焦点owner | 证据 | 责任 owner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 示例：SHELL-015 | 资源列表 / AppShell / pageHeader | 未跑 | PageHeader.title 是唯一主标题 | 尚未执行 | 资源标题；PageHeader | page-title 语义 | 主标题与 actions 按合同排列 | 空描述/meta不占位 | 正常、窄屏 | 页面正文滚动 | — | 宿主 |

逐项状态表应随交付保存；按章节写一段总评不能替代上表。对非 slot 的 API/页面行，slot 专用列填 `—`，不能省略实际请求/数据所有者。对于`不适用`必须在“实际”和“证据”列写出业务范围及核对依据。公共合同/slot/peer 能力缺失时填`失败`并标记 owner=`xui`；API 未接入或后端前置未提供时填`未跑`/`失败`并标明宿主后端 owner。

## 卡片集合逐项检查

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| CGROUP-001 | 页面以卡片展示同一记录集合 | 使用CardGroup接收rows/rowKey/renderCard；模板返回公开Card配置，由集合创建实例 | 正式types、实例接线及DOM | [COMPONENTS CardGroup](COMPONENTS.md#cardgroup) |
| CGROUP-002 | 集合含搜索/筛选/计数/分页 | toolbar或pageToolbar只选一处；计数分页只由集合footer呈现，body为唯一内容滚动区 | slot映射、滚动与footer矩形 | [COMPONENTS CardGroup](COMPONENTS.md#cardgroup) |
| CGROUP-003 | 初始/空/筛选空/刷新/失败 | 首次无数据加载相对body水平垂直居中；各状态真实；同范围刷新/失败保留记录和节点，局部反馈与显式重试，不加载整个页面 | Network、节点身份、录像 | [DESIGN 卡片集合](DESIGN.md#卡片集合布局与状态) |
| CGROUP-004 | 排序、数据更新或翻页 | 当前记录与context一致，稳定key；仍存在记录的草稿/焦点保留，不承诺跨页缓存 | 事件、记录及mount日志 | [COMPONENTS CardGroup](COMPONENTS.md#cardgroup) |
| CGROUP-005 | 集合busy/disabled或有业务动作 | 集合分页/重试阻止重复意图，业务动作按context及自身权限禁用；卡片不变伪按钮 | Enter/Space、禁用与回调次数 | [COMPONENTS CardGroup](COMPONENTS.md#cardgroup) |
| CGROUP-006 | 窄屏/长中文/界面或浏览器放大 | 按容器净宽退列，卡高由完整内容决定；equal不得裁内容/动作，三段与工具/页尾完整可达，无私有尺寸补丁 | 主题/宽度/倍率矩阵截图与焦点 | [DESIGN 卡片集合](DESIGN.md#卡片集合布局与状态) |
| CGROUP-007 | 同一资源网格要求卡片整齐 | 显式cardSizing=equal，网格按最大内容计算共同卡高，content伸展、存在的footer靠底；无固定像素正文高 | 不同摘要/正文/空槽下各卡高度和Footer位置 | [COMPONENTS CardGroup](COMPONENTS.md#cardgroup) |
| CGROUP-008 | 切换等高、刷新、排序或内容更新 | 不重挂Card/字段/业务树，不丢草稿、焦点；卡高可随新内容和放大增长 | identity/输入/选区/焦点及高度变化记录 | [COMPONENTS CardGroup](COMPONENTS.md#cardgroup) |
| CGROUP-009 | 多资源类型或多个页面使用CardGroup | 逐调用点检查同一Card三段/图标/标签/Footer与cardSizing接线，不在库中按领域写专属布局 | 全部调用点清单、各模板props、逐页实际结果 | [COMPONENTS CardGroup](COMPONENTS.md#cardgroup) |

### 组件内容加载位置

| 检查ID | 适用条件 | 通过标准 | 必需证据 | 公共合同来源 |
|---|---|---|---|---|
| LOAD-001 | 详情、卡片或其他局部内容首次等待 | 使用LoadingState block，相对所属可见内容区水平垂直居中，不以页面/窗口为中心；保留外围标题与动作 | 内容区与提示矩形、主题/窄屏/大字截图 | [DESIGN 刷新连续性](DESIGN.md#数据刷新与视图连续性) |
| LOAD-002 | 已有内容刷新或按钮动作等待 | 内容及节点保留；区域footer/反馈槽使用inline，按钮内Spinner与标签同组，不用居中遮罩替换内容 | 节点/焦点/草稿/滚动、status数量与无Document请求 | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) |
| LOAD-003 | 使用公共Spinner指示忙状态 | 主题色开放弧可辨认；普通动效下实际旋转，reduced-motion静止且仍有忙状态文字/名称；不在宿主重画圆环或增加重复live播报 | light/dark/system的边框与真实帧采样、reduce静止采样、状态可访问名称 | [COMPONENTS 表单与页面编排](COMPONENTS.md#表单与页面编排) |

## 按需服务与文件上传专项

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| SERVICE-010 | 只用 bootstrap 或单项 Service | bootstrap 与其 disposer 不含 HTTP/Auth/Menu/Upload 实现；释放不要求导入全量 services；窄入口仅包含职责依赖，根入口/全量 services 有意汇总 | 正式 tarball bundle metafile 的贡献文件与 gzip；不能仅看压缩后体积 | [按模块单例](PUBLIC_API.md#按模块导入的单例与-40-迁移) |
| SERVICE-011 | 多处导入同一 Service | 引用稳定、同一 Window 同一 owner；import 不发 IO，不在启动前捕获默认 config | 导入/首用/重复导入轨迹及配置快照 | [公共合同](PUBLIC_API.md#文件上传) |
| SERVICE-012 | auth.enabled 或借用已有 HTTP | 首个业务请求前绑定唯一 Auth；缺模块/不匹配在发送前失败；借用原引用也受保护 | 无登录 protected POST 请求次数、凭据策略及借用测试 | [公共合同](PUBLIC_API.md#文件上传) |
| SERVICE-013 | 安装失败或销毁自有 Auth | 修正配置可重试；此前 owner 不受损；自有 binding 被释放，借用 HTTP 不销毁 | 错误后重试、再次绑定和 dispose spy | [公共合同](PUBLIC_API.md#文件上传) |
| UPLOAD-001 | 页面添加上传 | 使用公共 Upload/options 或借用完整 Controller；同一 UploadService/HTTP/Auth；不另建 fetch、队列或认证 | 实例身份、调用路径、Network | [上传 API](PUBLIC_API.md#文件上传) |
| UPLOAD-002 | 选择/拖入/重选文件 | 选择不请求；accept/大小含边界/数量限制生效，超数整批拒绝，错误关联正确 | 文件选择器真实指针/键盘、DataTransfer 与请求次数 | [公共合同](PUBLIC_API.md#文件上传) |
| UPLOAD-003 | 点击开始或重新上传 | POST multipart，filename/字段正确，平台 boundary，重复动作不并发重发同一行 | 请求方法、头、body 与次数 | [公共合同](PUBLIC_API.md#文件上传) |
| UPLOAD-004 | 请求等待、部分成功或刷新 | 文件行、已确认结果和外部草稿保留；Progress 在所属区域居中；无假百分比 | DOM身份、几何、进度属性、请求轨迹 | [Upload 槽位](COMPONENTS.md#文件上传-upload) |
| UPLOAD-005 | 取消/超时/错误/迟到 | 提示结果可能未知；不自动重放，不把移除当远端删除；旧结果不能覆盖重试行 | 受控延迟/失败、重试计数、旧结果释放 | [上传 API](PUBLIC_API.md#文件上传) |
| UPLOAD-006 | disabled/readOnly/替换/退出 | 锁定不发新动作，已有请求不误取消；真实退出终止所属等待，不销毁借用 owner | 控件状态、Abort/late result、StrictMode | [公共合同](PUBLIC_API.md#文件上传) |
| UPLOAD-007 | 文件行操作消失或删除 | Cancel/Retry/完成/Remove 均保留合理焦点；外部焦点不被后台结果抢走 | activeElement 与键盘录制 | [Upload 槽位](COMPONENTS.md#文件上传-upload) |
| UPLOAD-008 | 所有呈现模式 | 字体继承，正文/metadata/status/actions 各归所属 slot；浅深system、窄屏、长中文、两种200%均可读可达 | 正式消费者截图、computed typography、真实浏览器 zoom 几何 | [公共合同](PUBLIC_API.md#文件上传) |

## 可选内容轨道与完整取消层级

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| TABS-LINE-001 | 采用扁平内容Tabs | List默认line或显式variant=line，需内嵌外观才选segmented；无重复轨道/内选中框；状态色和独立focus由库负责，Panel与宿主范围/游标不重挂 | 三主题、长中文、键盘、节点/滚动/草稿/游标对比 | [Tabs](COMPONENTS.md#tabs) |
| OVERLAY-ORDER-001 | Dialog关闭回到Sheet内带Tooltip/ContextMenu按钮 | 记录每层open与escape-key；只关闭顶层；不要仅以Sheet仍可见判父监听故障；重复名称省略Tooltip，必要补充说明保留独立层级 | 两层/三层、回焦点、条件卸载和重复循环 | [Escape顺序](COMPONENTS.md#嵌套弹层与-tooltip-的-escape-顺序) |
| TABS-OVERFLOW-001 | Tabs长名称与尺寸 | 单项使用tabs-item-max-inline-size；名称进自动文本/Label槽，Icon/计数独立；精细鼠标hover及键盘焦点揭示全文，离开复位，不增加停靠点 | 三主题、短/长中文、RTL、窄屏、两种200%、减少动效/触屏/disabled完整静态阅读；节点/焦点与选中归属不变 | [Tabs](COMPONENTS.md#tabs) |
| OVERLAY-RESUME-001 | keepMounted详情临时关闭后恢复 | 标准Body及布局观察支持下，同节点/内容/滚动模式保留阅读位置与草稿，不因重开自动滚向旧焦点；真实容器切换仍保证焦点可见；核验与恢复资格归宿主；CSS降级只保证可达 | body/whole、异步边界、两轮、DOM/选择区/焦点/offset、三主题/窄屏/两种200%，对照原生动画精度 | [保留详情](COMPONENTS.md#保留dialog的阅读位置) |
| ARTIFACT-001 | 固定正式产物接入或交付 | 使用统一archive入口；manifest、API清单、generation、三包、源码和SHA256SUMS相符，复制后独立验证；不手动补档或用一份版本的测试冒充另一份 | archive:verify成功输出、完整SHA/版本/generation/API摘要/入口数；范围另查真实验证记录 | [正式归档](ADOPTION.md#正式归档的唯一入口) |
| SIDEBAR-TABS-001 | 侧栏header末位水平line Tabs | 动作/搜索留在sidebarHeader，List放sidebarTabs；单行选中段与淡分隔同基线，Shell无第二条；多行按所属行底边，不裁切；非line及普通header保持旧边界 | AppShell/MenuLayout、四项组合、三主题/RTL/两种200%、焦点、草稿/Panel节点和滚动连续性 | [侧栏Tabs](COMPONENTS.md#侧栏快捷操作组合) |

| TABLE-RESIZE-001 | 需要用户调整列宽的DataTable | 使用columnSizing默认或完整Controller，不能竞争widths/defaultWidths；按稳定列id接线，列resize声明名称/限制，正确载入正式CSS | 三主题、指针/触屏/键盘/RTL、最小最大、取消/卸载清理、刷新/数据/排序/分页后保行与宽度 | [交互列宽](COMPONENTS.md#交互列宽调整) |

| FEEDBACK-PROGRESS-001 | 呈现已测或未知进度 | 公共Progress真实value/max或省略value；与密码强度meter共用progress-height/progress-radius；端点与中间等厚，不改成椭圆；缩放/RTL/强制颜色及减弱动效保持 | 属性、窄屏几何与真实绘制截图 | [Progress](COMPONENTS.md#进度-progress) |

| AUTH-PASSWORD-REQ | 提交一次改密 | 固定PUT官方JSON/唯一Bearer、omit/no-store/error redirect；零备用URL/自动重放 | Network精确方法/字段/凭据/次数 | [自助改密](PUBLIC_API.md#自助改密) · [表单](COMPONENTS.md#自助改密表单) |
| AUTH-PASSWORD-OK | 严格确认成功 | 封闭schema1三字段全true；清access/user与旧代次；同源epoch通知，重新登录 | 正负DTO、状态时间线及跨tab | [自助改密](PUBLIC_API.md#自助改密) · [表单](COMPONENTS.md#自助改密表单) |
| AUTH-PASSWORD-REJECT | 400/403/429/501与401/409 | 官方确定拒绝可修正；失效/冲突清凭据，不触发refresh | 按状态码的真实请求轨迹/错误 | [自助改密](PUBLIC_API.md#自助改密) · [表单](COMPONENTS.md#自助改密表单) |
| AUTH-PASSWORD-UNKNOWN | 超时/取消/503/解析失败 | 不宣称回滚，不自动核验或重复写；50302区分已提交后续失败 | 阻塞及迟到夹具/等待预算/重试零次数 | [自助改密](PUBLIC_API.md#自助改密) · [表单](COMPONENTS.md#自助改密表单) |
| AUTH-PASSWORD-GEN | 并发session/refresh/身份变化 | 共享原owner预算；旧代迟到不能覆盖新登录；写入期间拒绝重复 | 代次竞争/取消与跨tab证据 | [自助改密](PUBLIC_API.md#自助改密) · [表单](COMPONENTS.md#自助改密表单) |
| AUTH-PASSWORD-SECRET | 输入/提交/关闭/卸载 | 三密码只在DOM和提交作用域；清密/显隐复位；state/URL/storage/log/error无秘密 | DOM引用与安全state/诊断扫描 | [自助改密](PUBLIC_API.md#自助改密) · [表单](COMPONENTS.md#自助改密表单) |
| AUTH-PASSWORD-VIEW | 表单默认/完整Controller注入 | 唯一Auth；复用NewPasswordFields/Field/FormActions/Alert；keepMounted以active接open | 类型互斥、焦点/键盘/主题/两种200% | [自助改密](PUBLIC_API.md#自助改密) · [表单](COMPONENTS.md#自助改密表单) |

| ID | 对象 | 必须检查 | 证据 | 依据 |
|---|---|---|---|---|
| TOOLBAR-005 | actions 内含嵌套 Toolbar/带标签 Field | 换成多行不把高级筛选拉高到整组高度；普通字段控制边框与按钮底边对齐；长字自然增高 | 单行/多行/窄容器/两种200%真实几何及截图 | [SearchToolbar](COMPONENTS.md#searchtoolbar) |
| NAV-SPACE-001 | 窄屏导航抽屉 | 默认贴边全宽，一层内距；320/390px与scale=2名称保持可辨、四字常规名称不逐字纵排 | computed内距、名称净宽/行高及截图 | [阅读空间](COMPONENTS.md#导航抽屉的阅读空间4214) |
| NAV-SPACE-002 | Header/Tabs/Menu/Footer | Tabs独立；菜单有主要空间；头尾超预算/短屏自动整体纵滚，全部动作/账号/搜索可达 | 两种flow、滚动owner、键盘和短屏截图 | [阅读空间](COMPONENTS.md#导航抽屉的阅读空间4214) |
| NAV-SPACE-003 | 分区切换与宽窄往返 | 保留节点/草稿/展开/选择；独立动作不误导航；Escape回真实触发器 | 节点身份、请求/动作次数、焦点 | [阅读空间](COMPONENTS.md#导航抽屉的阅读空间4214) |

## 可选公共能力逐项检查（4.2.15）

未使用的能力按真实 import graph 记不适用，不强制项目升级；每个实际使用实例分别核对。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| CAP-001 | 正文自动生成链接 | 只链接显式安全 HTTP(S)，拒绝凭据/控制/隐藏字符/修复 host；原文标点、括号、emoji、数值完整 | 正式包解析结果与真实 DOM textContent | [PUBLIC_API 链接](PUBLIC_API.md#安全正文链接) |
| CAP-002 | 富文本或行中使用 LinkedText | React 元素保持；链接继承原槽；按需止冒泡，保留修饰键/默认导航，rel安全 | 元素identity、click事件与键盘 | [PUBLIC_API 链接](PUBLIC_API.md#安全正文链接) |
| CAP-003 | 使用标准 Toast.View | 复用一个 Provider/队列，标题/描述/动作/关闭各回所属槽，名称可翻译且焦点可达 | Controller引用、DOM、键盘与长文滚动 | [PUBLIC_API Toast](PUBLIC_API.md#标准通知视图与范围清空) |
| CAP-004 | 身份或租户切换且有旧通知 | 先取消旧生产者并clear再启新工作；scopeKey变更立即去除含ending文案，无动画残留/旧回调/迟到promise复活 | 同步切换DOM、队列和旧任务交错证据 | [PUBLIC_API Toast](PUBLIC_API.md#标准通知视图与范围清空) |
| CAP-005 | 动态模块和CSS加载 | 地址来自trusted build map；只有一个Resource与端到端有限预算，显式retry，无第二HTTP/认证owner | resolved地址、Network次数、状态时序 | [PUBLIC_API 模块](PUBLIC_API.md#模块与-css-的同一资源生命周期) |
| CAP-006 | 模块刷新/取消/超时/销毁 | 同key保留旧内容/CSS，换key清旧范围；CSS共享到最后lease才释放，迟到无发布，宿主卸载副作用 | 节点identity、link计数、Abort/teardown与重试 | [PUBLIC_API 模块](PUBLIC_API.md#模块与-css-的同一资源生命周期) |
| CAP-007 | 绘图消费主题颜色 | 用当前上下文token、同一ThemeService；sRGB归一化/8位/alpha/null明确，WebGL线性转换自有 | computed样式、Canvas读回与真实renderer输入 | [PUBLIC_API 颜色](PUBLIC_API.md#绘图主题颜色) |
| CAP-008 | 主题/样式/renderer生命周期 | light/dark/system/配色/祖先覆盖更新；stylesheet变化refresh，dispose/abort后无通知/残留probe，不销毁借用theme | 切换、计数、监听清理和目标上下文 | [PUBLIC_API 颜色](PUBLIC_API.md#绘图主题颜色) |
| CAP-009 | 上述能力实际呈现 | 桌面/窄屏、长中文、200%文字和真实200%浏览器zoom，焦点四边、通知滚动和链接无页面溢出 | 每主题实测与缩放事实 | [DESIGN 公共能力](DESIGN.md#正文链接通知范围与可选绘图资源4215) |
| CAP-010 | 公共链接默认装饰 | Typography.Link/LinkedText、范围内原生a与Button link无下划线；颜色、键盘焦点、点击/修饰键/外链安全合同保留，不加局部皮肤 | 浅深system、默认/hover/pressed/focus、访问后与实际导航证据 | [文字合同](COMPONENTS.md#typography) |

## 导航临时显示逐项检查（4.2.16）

| 编号 | 场景 | 必须检查 | 证据 | 合同 |
|---|---|---|---|---|
| NAV-REVEAL-001 | 桌面紧凑 fine pointer | 默认 hover 揭示完整标签；关闭选项 false 不揭示；正文 x/width 不变 | 前后几何与公开配置  | [COMPONENTS](COMPONENTS.md#紧凑导航的临时揭示4216) |
| NAV-REVEAL-002 | 临时揭示往返 | 同一 DOM/Controller、collapsed/expandedIds/选中/草稿/滚动保留；折叠回调和偏好写次数为零 | 节点身份、状态与写入计数  | [COMPONENTS](COMPONENTS.md#紧凑导航的临时揭示4216) |
| NAV-REVEAL-003 | 指针、键盘与公共 portal | 侧栏/footer/派生菜单或 Dialog 有焦点时不收起；跨间隙后仍可达 | 实际 hover/focus/指针路径与命中  | [COMPONENTS](COMPONENTS.md#紧凑导航的临时揭示4216) |
| NAV-REVEAL-004 | 分层 Escape 与卸载 | 先关闭最上层弹层，再收起预览回唯一开关；移除焦点节点及 Shell 无残留 | 焦点轨迹、卸载后计时/监听结果  | [COMPONENTS](COMPONENTS.md#紧凑导航的临时揭示4216) |
| NAV-REVEAL-005 | 粗指针与窄屏 | 不依赖 hover，已有显式开关/抽屉和回焦正常 | touch 与窄屏键盘路径  | [COMPONENTS](COMPONENTS.md#紧凑导航的临时揭示4216) |
| NAV-REVEAL-006 | 页脚合法嵌套 | 直接 SVG、Icon 包装、Toolbar 版本 Button/passive span、更新 Button/status 同中心线；图标16px、按钮最小36px；passive 不执行动作 | computed 几何、语义、真实点击计数  | [COMPONENTS](COMPONENTS.md#紧凑导航的临时揭示4216) |
| NAV-REVEAL-007 | 宽度与可读性 | 192–224/16vw、50vw上限、60 compact、12px内距与公开覆盖；长中文/RTL不截内容、不缩字 | 800/1280/1600/1920、三模式、根字号与浏览器200%分别实测  | [COMPONENTS](COMPONENTS.md#紧凑导航的临时揭示4216) |

上述尺寸以根16px为基准，字体放大后按 Token 派生并以视口上限保护正文；正式包结果不代替产品页面验收。本轮无强制消费方升级或自动通知。

## 可选透明动作逐项检查（4.2.20）

| 编号 | 场景 | 必须检查 | 证据 | 合同 |
|---|---|---|---|---|
| ACTION-TEXT-001 | 计划Disclosure/轻量文字Button | 只用公开variant=text；各状态透明、无下划线；显式Disclosure default保留历史背景，ghost/link保留既有配方，不私改CSS | default/hover/pressed/expanded/disabled computed与截图；行内下拉使用Menu.Trigger＋Button.text，不覆写显式主/危险入口或普通表单Select/Input | [COMPONENTS](COMPONENTS.md#透明文字动作4217) |
| ACTION-TEXT-002 | 键盘/关闭/更新 | Enter/Space一次动作、aria-expanded/controls准确、同节点/尺寸/草稿、关闭回焦、禁用零动作；不另建Controller | 指针和键盘时间线、节点与调用计数 | [PUBLIC_API](PUBLIC_API.md#透明文字动作4217) |
| ACTION-TEXT-003 | 阅读与主题 | light/dark/system/forest、窄屏、长中文、RTL、200%根字号和真实浏览器zoom下可达；独立focus清晰，reduced-motion遵守原合同 | 字体/命中/几何及两种200%事实 | [DESIGN](DESIGN.md#透明文字动作4217) |

## 可选透明导航逐项检查（4.2.20）

| 编号 | 场景 | 标准 | 证据 | 入口 |
| --- | --- | --- | --- | --- |
| NAV-TEXT-001 | 透明导航各状态 | 使用公开 variant=text；default/hover/pressed/selected/disabled 背景透明、无按压缩放，普通选中/hover为主题动作色 | 实际 computed、指针及键盘截图 | [COMPONENTS](COMPONENTS.md#透明导航与警告前景4217) |
| NAV-TEXT-002 | 需要人工介入事实 | 宿主投射 tone=warning；主名/主图标/警告图标/选中短线保持 warning 前景，无软底；完整可访问名称；不传业务枚举 | 类型、色值、aria 名称与真实事实来源 | [PUBLIC_API](PUBLIC_API.md#透明导航与警告前景4217) |
| NAV-TEXT-003 | 同行或父子动作 | 分组/下级/配置动作不染色；分支独立切换、右键与配置不误导航；禁用零执行；普通入口默认外观保留 | 回调和路由计数、焦点、aria-current/expanded/controls | [COMPONENTS](COMPONENTS.md#透明导航与警告前景4217) |
| NAV-TEXT-004 | 语言/状态/阅读更新 | 同一 Controller/DOM/草稿，长名只滚动 Label、Icon 不收缩；三模式/配色/窄屏/RTL/根200%及真实zoom下可读可操作 | 正式包、节点/几何/对比度/媒体与缩放事实 | [DESIGN](DESIGN.md#导航文字呈现与warning前景4217) |

## 统一展开与收起逐项检查（4.2.18）

| 编号 | 入口 | 标准 | 证据 | 合同 |
| --- | --- | --- | --- | --- |
| EXPAND-001 | Menu下拉入口 | 无render默认text；显式render/primary/destructive保留；键盘、关闭回焦与props/ref转发正常 | default/hover/pressed/展开computed、原节点/焦点和动作次数 | [映射](DESIGN.md#展开与收起入口的统一呈现4218) |
| EXPAND-002 | Disclosure/Accordion标题 | 默认透明前景配方，同一值/Overlay owner，沿用原内容/草稿/keepMounted与回焦策略；Disclosure显式default仍可用 | 三主题各状态、aria与节点/草稿 | [映射](DESIGN.md#展开与收起入口的统一呈现4218) |
| EXPAND-003 | SearchToolbar高级搜索 | 内置展开入口透明，原expanded/Controller与查询owner不变，筛选草稿不因收拢清空 | 开关/请求次数、草稿与焦点 | [映射](DESIGN.md#展开与收起入口的统一呈现4218) |
| EXPAND-004 | 侧栏/导航分支/表格行展开 | 独立开关透明，aria/Controller/命中不变，主链接选择与SortButton不被套用 | 几何、键盘、独立动作和导航次数 | [映射](DESIGN.md#展开与收起入口的统一呈现4218) |
| EXPAND-005 | 自有区域或纯图标入口 | 使用Button.text/IconButton.text，准确aria-expanded/controls及无文字名称；不重复样式或状态owner | 接线、可访问名称/状态与零重复执行 | [映射](DESIGN.md#展开与收起入口的统一呈现4218) |
| EXPAND-006 | 视觉与范围 | 三模式、窄屏、长中文、200%文字/浏览器zoom下可达；图标前景继承，独立focus/disabled；不抹掉输入边界/成功警告危险事实 | 正式包、色值/几何/两种200%及范围检查 | [映射](DESIGN.md#展开与收起入口的统一呈现4218) |

| TABLE-ACTION-001 | 每个表格操作槽 | 查看等动作统一text，删除用text＋tone=danger；各状态透明，危险前景不被hover品牌覆盖，disabled仍禁用；保留权限/确认/防重/行事件 | 逐表props清单、三主题各状态computed、动作/确认计数与真实页面 | [透明危险动作](PUBLIC_API.md#透明危险动作4218) |

| TOAST-LAYOUT-001 | 标准或高级parts通知 | 标准View/新parts的Icon/Content/Close分列，关闭首行可达；窄容器说明/动作跨行、极窄时全文转入下一行；纯文案无操作空行，旧Actions包含真实动作和Close时保留原顺序；空Title/Description不占位、不推断type或priority | 无标题/长中文/技术长串/动作与关闭几何，六配色三模式，两种200%及RTL，空槽、ref/render/动作计数与回焦 | [紧凑通知](PUBLIC_API.md#紧凑通知部件4219) |


## 手动查询页逐项检查

以下每行按实际页面与slot记录，不能用“已采用QueryForm”合并通过。宽度、Token与状态唯一来源是 [DESIGN](DESIGN.md#手动查询页布局与状态合同4220)。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| QUERY-001 | 手动提交条件查询 | 使用 QueryForm 单一原生 form，label 可访问名称明确，宿主提交 preventDefault 且无整页 reload | 源码、Enter提交、Network/document导航 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-002 | 页面区域映射 | pageHeader 标题、pageToolbar 查询、children 结果，toolbar 不重复摆条件，单层表面无双 Card | 逐slot映射、DOM和首屏截图 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-003 | 主标识或搜索输入 | fields 内 QueryField.width=primary，宽屏受角色上限约束，不占半屏/全屏强拉伸 | 净宽与控件边界实测 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-004 | 短状态枚举 | QueryField.width=compact，不机械等分剩余宽度；长选项仍可完整理解 | 真实选项、宽度与键盘截图 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-005 | 普通和长规则字段 | 默认standard，必要长内容显式full跨整行，fields直接QueryField或Fragment | 类型与实际slot DOM | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-006 | 查询或次动作 | actions 只放真实动作，submit显式type，内容自然宽；同带control底边齐，不被help/error挤偏 | 长label/help/error及按钮底边几何 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-007 | 字段关联 | 每项一个公共控件，required/error/help关联且首错可定位，不能用空标签补对齐 | aria-labelledby/describedby/invalid、焦点 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-008 | 高级条件 | advanced 使用已有公共组合，收起保持DOM与草稿、hidden/inert、Tab不可进入 | 节点identity、输入保留、键盘记录 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-009 | 高级区关闭 | 内部焦点回展开按钮；外部已移动焦点不被抢回，长中文按钮可达 | 受控关闭及Tab/Enter/Space | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-010 | 已提交高级范围 | summary只呈现已提交事实，无内容不占位，草稿不伪装已生效 | 修改未提交日期、已提交摘要对照 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-011 | 窄容器与放大 | 按组件净宽重排、单列和动作换行，长中文不单字挤压；无页面横向溢出 | 侧栏后净宽、320/390/768、200%字号和真zoom | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-012 | 尚未查询 | idle/hasValue=false，idleState提示必要输入，不调用count造0、不传伪分页；横滚后提示仍在可视表体内 | 首次无请求、DOM/aria/计数 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-013 | 首次加载 | 表体居中加载，页面壳/列头/输入identity与焦点保持，不整页重载或隐藏 | 延迟请求、几何、焦点和挂载 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-014 | 成功有数据 | 稳定rowKey、真实行与total或null，唯一受控分页，翻页对应当前范围 | 响应、行键、页码与请求次数 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-015 | 成功无匹配 | ready/hasValue=true，emptyState给有效下一步，真实空才可计0 | 空响应、计数、横滚/RTL可见性和真实动作 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-016 | 首次失败 | error/hasValue=false，就近错误与重试；条件/输入保留，无无限重发 | 失败Network、焦点/输入和重试次数 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-017 | 同范围刷新 | 使用已提交条件，保留旧行与节点/滚动/选择/输入焦点；局部busy无整区遮罩 | 延迟刷新、前中后几何/DOM/scroll | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-018 | 刷新失败 | hasValue=true保留旧事实，footer就近反馈与一次重试；不清表或假空 | 失败响应、旧行和恢复 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-019 | 提交新范围 | 清旧值进入loading，取消/代次丢弃迟到响应，不串用旧范围 | 交错响应、abort及最终行归属 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-020 | 草稿变更和重置 | 不擅自查询或更改已展示范围，刷新继续用已提交条件 | 草稿/applied和请求参数对照 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-021 | 主题和文字角色 | 正式CSS、light/dark/system、公共字体继承、无私有字号/皮肤/DOM补丁 | computed style、主题切换及源码 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |
| QUERY-022 | 日期和领域边界 | 保留DateTimePicker分钟字符串，无隐式时区；起止、窗口与HTTP/业务协议仍宿主管 | 提交参数和公开接线、真实API验收 | [DESIGN 查询页](DESIGN.md#手动查询页布局与状态合同4220) · [公开组件](COMPONENTS.md#手动查询页-queryform--queryfield4220) |

## 无图标紧凑导航逐项检查

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| NAV-FALLBACK-001 | NavigationMenu未指定icon并收起 | 按真实名称显示grapheme安全缩写，不再出现相同三横线；显式icon不变，完整名称/disabled/selected继承 | 中文、英文、组合字符、emoji、语言切换、显式图标与完整可访问名 | [组件合同](COMPONENTS.md#无图标紧凑导航) |
| NAV-FALLBACK-002 | 紧凑回退项交互与放大 | 单一roving、Enter导航/分支动作独立、hover/focus临时揭示及窄屏完整名称保持，不因缩写制造动作/路由owner | 三主题、桌面/窄屏、两种200%、指针/键盘、节点/Controller及回焦证据 | [组件合同](COMPONENTS.md#无图标紧凑导航) |

## 公共图表逐项检查

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| CHART-001 | 正式包消费图表 | 从/chart或根入口取得三类React组件及types，runtime/chart仅纯类型/计算，CSS来自正式style或critical+chart；D3仅为库内部声明的计算依赖，无d3整包/DOM/IO模块、宿主D3对象/源码alias/重复peer，Button与窄服务包图不含D3 | 独立tarball types/ESM/CSS、module graph及peer路径 | [公开入口](PUBLIC_API.md#全部正式入口) |
| CHART-002 | 图表页面slot编排 | title/description/actions/正文/页尾复用Card，图例/绘图区/就近读值/反馈各有归属，查看数据动作就近，不嵌套私有卡/表/tooltip | 每页实例slot矩阵及实际DOM/geometry | [图表组件](COMPONENTS.md#公共图表) |
| CHART-003 | categories/series/slices变化 | 稳定唯一ID、非空名称、数值有限、长度匹配，null仅表示缺失；非法输入拒绝，不补0/截断/猜单位或时间 | 正负类型、非法数据回归及实际数据来源 | [数据合同](COMPONENTS.md#公共图表) |
| CHART-004 | 折线曲线/缺采样/单点/全零 | curve仅用linear/monotone/step，默认直线；单调平滑不产生相邻点间额外极值，阶梯中点跳变；三种模式null处断开而非补0/跨缺失插值，单点有点形，合法0保留；切换曲线不重挂SVG/采样点、不清焦点/读值/草稿、不额外请求；原值与数据表一致 | SVG路径/点、键盘读值、数据表及截图 | [设计合同](DESIGN.md#公共图表布局与状态合同4221) |
| CHART-005 | 分组柱含负/零值 | 0基线与刻度明确，正负方向和长度正确，零柱高度0；不把负数改为错误色，分组次序对应图例 | 实际柱几何、0刻度、色Token与数据表 | [设计合同](DESIGN.md#公共图表布局与状态合同4221) |
| CHART-006 | 饼图含零/单项/极值 | 有限非负值，零项无弧但可读；全零为空态，单正项完整圆，比例归一化避免溢出，不虚构总数 | 弧度/占比、全零/单项/有限极值回归与截图 | [数据合同](COMPONENTS.md#公共图表) |
| CHART-007 | 主题或品牌变化 | 图形只用既有chart-color等语义Token，文字/轴/图例/网格/焦点同步；分类不充当状态，重排保色需求显式配color | 六preset×浅深system、实时切换、实际文字/图形对比与自定义Token继承 | [设计合同](DESIGN.md#公共图表布局与状态合同4221) |
| CHART-008 | 窄屏/长中文/200%文字或真实zoom | 轴/图例/读值不缩字，类别按可读轨宽在本图横滚，其他slot自然重排，页面无横裁/焦点遮挡 | 桌面/320/390、根字号/真实zoom分开记录，字体与几何截图 | [设计合同](DESIGN.md#公共图表布局与状态合同4221) |
| CHART-009 | 键盘/鼠标/触屏读值 | 每绘图区一个键盘入口，方向/Home/End/Escape准确读值且Tab可离开，指针与触屏同样就近显示，不提交/导航 | activeElement、播报文本、值与实际指针/触屏事件 | [交互合同](COMPONENTS.md#公共图表) |
| CHART-010 | 查看数据入口 | 公共DataTable完整列出类别/系列/原值/null/零项及适用占比，公开文字可翻译，展开/关闭动作与焦点可达 | 实际表格内容、Enter/Space、长中文与英文接线 | [交互合同](COMPONENTS.md#公共图表) |
| CHART-011 | 首次加载/空/错误/未查询 | 反馈在组件区域居中，保留标题/操作，无假0分布/无限重试，宿主重试意图保留 | 每状态截图、反馈居中矩形与真实状态 | [状态合同](DESIGN.md#公共图表布局与状态合同4221) |
| CHART-012 | 同范围刷新/失败 | 旧SVG/点/柱节点、焦点和横滚保留，反馈不遮罩或改变图形透明度；没有新增请求owner | 刷新前/中/后节点/滚动/几何、请求计数与错误恢复 | [状态合同](DESIGN.md#公共图表布局与状态合同4221) |
| CHART-013 | 数据重排/删除/换范围 | 按稳定类别/系列ID读取更新值，删除后不报旧值；范围清理/取消/迟到由原Resource负责 | 重排/删除的节点与读值、范围切换及迟到回归 | [状态合同](COMPONENTS.md#公共图表) |
| CHART-014 | SSR/挂载/卸载/减少动效/强制颜色 | SSR无DOM访问；测量随节点更新并释放，无自动请求/循环动效；强制颜色及数据表仍可用 | SSR结果、StrictMode/Observer释放、media与实际页面检查 | [设计合同](DESIGN.md#公共图表布局与状态合同4221) |
| CHART-015 | 首次展示/显式关闭 | 所有图表首次进入和数据更新均用motion-duration-chart（默认900ms）；折线/曲线沿实际路径从起点至终点、采样点随到达显现，null连续段按序而不补线；animation=false或减少动态效果直接呈现，复用统一chart时长/easing Token，0时长不排帧 | 同组数据开启/关闭、默认Token及media测量 | [图表呈现](COMPONENTS.md#公共图表) |
| CHART-016 | 同范围刷新与值更新 | 在途/失败保留旧图、反馈槽与焦点；确认数据更新从当前坐标过渡，相同数据不重播；不清数组/key重挂 | 刷新前中后节点/矩形/请求、连续更新轨迹 | [图表呈现](COMPONENTS.md#公共图表) |
| CHART-017 | 动画中的读值/缺失/边界 | 文本、百分比、数据表立即读取确认原值，交互完成动画；null不跨段；结构/范围/尺寸变化直接投影，无误配索引/轴 | 三类中间帧、原值表、null段数、重排/曲线/resize | [图表呈现](COMPONENTS.md#公共图表) |
| CHART-018 | 动画取消与生命周期 | 运行中关闭/media reduce/后台立即完成；恢复不补播；卸载释放时钟/帧/监听；不新增请求 | StrictMode、运行中切换、后台/恢复和卸载计数 | [图表呈现](COMPONENTS.md#公共图表) |

## StructuredLogExplorer 查询逐项检查

| ID | 操作 | 必须结果 | 证据 | 合同 |
| --- | --- | --- | --- | --- |
| LOG-QUERY-001 | 渲染查询区和宿主内容 | 只一份QueryForm；fields/advanced/actions/summary按公共映射，pageToolbar与headerActions各归其位，空槽不占位；空多选显示可翻译的全部文案，原值仍为空，不增加查询 | 正式types、DOM与slot矩阵 | [组件合同](COMPONENTS.md#structuredlogexplorer-查询与槽位4222) |
| LOG-QUERY-002 | 修改后重置草稿 | 恢复最近提交filter；零请求，service/结果/游标/快照/错误保持 | 前后state身份、请求计数与参数 | [组件合同](COMPONENTS.md#structuredlogexplorer-查询与槽位4222) |
| LOG-QUERY-003 | 清除已生效筛选 | 同一service提交空filter、首段cursor=null，仅一次当前视图请求，不伪称草稿reset | 真实POST body/次数、分组与组内模式 | [组件合同](COMPONENTS.md#structuredlogexplorer-查询与槽位4222) |
| LOG-QUERY-004 | 提交与刷新 | Enter/应用提交草稿；刷新使用原applied，summary仅显示service.filter | 草稿/applied/网络及刷新节点 | [组件合同](COMPONENTS.md#structuredlogexplorer-查询与槽位4222) |
| LOG-QUERY-005 | 收起高级条件和键盘操作 | 复用原filters Controller；草稿保留、hidden/inert和准确aria，关闭回唯一触发器 | Controller身份、焦点和键盘 | [设计合同](DESIGN.md#手动查询页布局与状态合同4220) |
| LOG-QUERY-006 | 不合法筛选与时间 | 无请求，错误在所属summary可见；原RFC3339Nano/半开区间与显式offset保留，无隐式时区 | 非法/纳秒/offset正负例与错误截图 | [组件合同](COMPONENTS.md#structuredlogexplorer-查询与槽位4222) |
| LOG-QUERY-007 | 新范围/取消/迟到/可选records | 原service拥有查询、游标和代次；缺省records不展示/请求，旧响应不污染新范围 | 各模式请求、取消及迟到回归 | [PUBLIC_API](PUBLIC_API.md#程序错误观察) |
| LOG-QUERY-008 | 三主题/窄屏/长中文/放大 | 公开字段宽度、动作对齐、原字号继承；局部横滚与详情回焦可达，无页面横裁 | 浅深system、320/390、根字号/真实zoom分别记录 | [设计合同](DESIGN.md#手动查询页布局与状态合同4220) |

## 剪贴板复制逐项检查

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| STATE-COPY-001 | 复制文本或显式writer | 使用runtime剪贴板服务或既有平台writer，写入串行、取消/迟到隔离；失败就地反馈，不读剪贴板/持久化/自动重试 | 真实指针、fallback焦点/选区/scroll、队列/失败/取消计数 | [剪贴板服务](PUBLIC_API.md#剪贴板复制服务) |
| STATE-COPY-002 | 普通HTTP回退复制/系统验收 | 无Clipboard API时用原生平台及合成中文、多段/Markdown完整核对OS文本；仅copied/execCommand=true不算通过；不要求产品加读回或私有补丁 | 固定正式包、HTTP/secure能力、原生execCommand、种子前置及完整文本相等布尔值；无shim证据 | [剪贴板服务](PUBLIC_API.md#剪贴板复制服务) |

## 业务日志列表展示逐项检查

| ID | 操作 | 必须结果 | 证据 | 合同 |
| --- | --- | --- | --- | --- |
| BIZ-LIST-001 | 配置列表列/顺序 | 列定义id/header非空唯一；默认键读取原值；五列使用actor/occurred_at/summary/result/detail，custom列显式detail；旧字符串列/format*迁移，不声称兼容 | 正式types、表头/每行同序、默认对照 | [组件合同](COMPONENTS.md#业务日志列定义与查询-slot4234) |
| BIZ-LIST-002 | 单元格默认/自定义 | 无cell或null读取event[id]、其次attributes[id]，0/false保留、缺失为空、对象为JSON文本；有cell完全使用返回内容，返回null不回退；context.content可复用原详情按钮，宿主明确时间/标签/动作；原事实保持 | 不同时区/语言文本、state及详情原文 | [组件合同](COMPONENTS.md#业务日志列定义与查询-slot4234) |
| BIZ-LIST-003 | 动态替换list配置 | 不换Controller/loader、不请求、不清草稿/筛选/快照/详情；按行/列ID保留节点与有效焦点 | 配置前后请求/节点/草稿/焦点、各Controller模式 | [状态归属](COMPONENTS.md#状态所有权与-controller-模式) |
| BIZ-LIST-004 | 应用筛选/打开关闭详情 | 筛选仍发送原始action/actor ID；详情保留技术事实与权限/过期分支；键盘关闭回同一按钮 | 实际请求参数、详情原字段、Enter/Escape与回焦 | [业务日志](PUBLIC_API.md#业务日志) |
| BIZ-LIST-005 | 三主题/窄屏/长中文/两种200% | 继承公共表格文字和颜色，横滚只在表体，全部列与详情按钮可达，Tab及详情关闭回焦后按钮边界完整位于表格可视边界，不以部分相交判通过；不裁文字/缩字/套私有皮肤 | 明暗system、桌面/390、根字号/真实zoom、实际几何与截图 | [设计合同](DESIGN.md#业务日志列表展示4227) |
| BIZ-LIST-006 | 宿主增加查询字段/额外scope | QueryField放queryFields，确认范围放querySummary，页面动作放headerActions；应用/清除留公共QueryForm，刷新/取消保留原标题动作，清除公共filter不冒充重置草稿/额外scope | DOM槽位、字段宽度/按钮对齐、实际参数和零重复请求 | [组件合同](COMPONENTS.md#业务日志列定义与查询-slot4234) |
| BIZ-LIST-007 | 资源scope切换、在途列表/详情、缓存页 | 稳定loader先更新scope，同一Controller.setFilter重置代次和旧数据/详情/缓存/快照；新scope首段一次请求，旧代迟到不复活；禁止key=scope重挂载 | 请求/abort、旧响应释放、detail/page/cache与Controller身份 | [组件合同](COMPONENTS.md#业务日志列定义与查询-slot4234) |
| BIZ-LIST-008 | 自定义cell动作与宿主投影 | attributes是显式授权的不可变JSON，不解析显示名猜ID；Button/Badge等用公开组合。复制只写真实ID一次、不导航/筛选，Toast不挤动行；语言/cell更新零请求且焦点保持 | 真实剪贴板、URL/请求不变、空会话、DOM/布局/focus、原详情事实 | [组件合同](COMPONENTS.md#业务日志列定义与查询-slot4234) |


## 卡片页脚与读取恢复逐项检查

| ID | 操作 | 必须结果 | 证据 | 合同 |
| --- | --- | --- | --- | --- |
| CARD-FOOT-001 | 有metadata及独立业务动作 | metadata优先收缩，能容纳最小meta+动作及间距时同排；长来源不先挤走动作 | 约267px卡片、五列、长短meta footer几何与正式CSS | [Card](COMPONENTS.md#card) |
| CARD-FOOT-002 | footerMeta采用OverflowText | 借当前卡已有交互面，显式ref仍优先，不借集合/其他卡动作；支持揭示时省略，无新增tab stop | hover/键盘当前卡揭示、其他卡静止、完整DOM文本 | [Card](COMPONENTS.md#card) |
| CARD-FOOT-003 | 窄屏/放大/减少动态/粗指针 | 不裁动作或缩字；空间不足可下移动作组，再不足组内换行；无动效揭示时完整静态换行 | 三主题、两种200%、完整按钮/焦点几何及真实状态，不伪造同行通过 | [Card](COMPONENTS.md#card) |
| CARD-FOOT-004 | metadata或动作缺省/全部禁用/刷新 | 不要求恢复业务已删信息行，空槽无占位；原控件身份/草稿/权限/回调保持 | actions-only/meta-only/空、disabled、刷新与回调次数 | [Card](COMPONENTS.md#card) |
| CARD-FOOT-005 | Card头部/页脚多个动作 | Card动作间距使用card-actions-gap，默认紧凑；Button/IconButton/Switch命中区和焦点不缩小，普通Toolbar间距不变 | 实测动作gap、按钮尺寸/中心距离、三主题/窄屏/两种200%、有无meta、禁用及刷新 | [Card](COMPONENTS.md#card) |
| CARD-SCROLL-001 | CardGroup natural/document/workspace上真实wheel | 无body范围时滚外层，有界workspace先滚body；自然/文档不因ScrollArea contain吞滚轮 | 前后HTML/body scrollTop、client/scrollHeight、实际wheel和边界 | [公共恢复合同](COMPONENTS.md#cardgroup滚动传递与登录读取恢复4230) |
| AUTH-RECOVERY-001 | refresh/session network/timeout/HTTP 5xx后手动检查 | 同一AuthClient.currentUser，保持unknown直到确认，手动只读恢复、不重放login/logout、不自动重试 | endpoint/status、owner身份、真实请求次数及失败/恢复/迟到 | [公共恢复合同](COMPONENTS.md#cardgroup滚动传递与登录读取恢复4230) |
| AUTH-RECOVERY-002 | 403/401或unknown logout | 不借读取恢复按钮绕过权限或未知退出门禁，不重发logout；正常手动登录仍按原合同 | 负例按钮/请求和退出后的受保护读取 | [未知退出](PUBLIC_API.md#未知退出与页面重载) |

## 业务日志整页语言逐项检查

| ID | 操作 | 必须结果 | 证据 | 合同 |
| --- | --- | --- | --- | --- |
| BIZ-LABEL-001 | 切换当前语言，沿用实际Controller模式 | labels为展示输入；默认options.labels也实时生效，不用key=locale或新owner；三模式采用同一优先级 | 正式types、实际调用点、Controller/view身份及语言前后DOM | [整页语言](COMPONENTS.md#业务日志整页标签热更新4229) |
| BIZ-LABEL-002 | 替换部分词典、移除覆盖 | 当前labels覆盖当前基底；不继承上一份语言；移除恢复当前options/controller基底，默认options移除恢复英文默认 | 完整/部分/undefined覆盖、更新基底和默认对照 | [整页语言](COMPONENTS.md#业务日志整页标签热更新4229) |
| BIZ-LABEL-003 | 已筛选、未提交草稿、非首页、打开详情时换语言 | 生效filter、草稿、Disclosure、详情、游标/快照/缓存及原事件事实保持；字段/行/动作/弹层节点、选区/滚动和有效焦点连续 | state/节点identity、输入选区/滚动、page/snapshot、Enter/Escape回焦 | [整页语言](COMPONENTS.md#业务日志整页标签热更新4229) |
| BIZ-LABEL-004 | 已有错误、空/加载/过期状态和在途请求时换语言 | 所有公共文案/可访问名称使用当前词典；已显示错误按语义键翻译；旧自定义Controller无键保留安全字符串 | 列表/详情读取与合同错误、403/404、无效筛选、空态、过期/不可用、加载及取消/迟到 | [整页语言](COMPONENTS.md#业务日志整页标签热更新4229) |
| BIZ-LABEL-005 | 换语言前后记录请求/取消 | 语言本身零list/detail请求、零retry/cancel，不改变在途signal/generation；旧迟到不复活，已访问上一页不因翻译失去缓存 | 请求参数/次数、abort计数、在途和取消后释放；原loader owner | [业务日志](PUBLIC_API.md#业务日志) |
| BIZ-LABEL-006 | 三主题、宽窄、长中文、根字号及真实200%缩放 | 继承公共layout/slot/文字，不裁剪或自写皮肤；弹层滚动和按钮边界完整可达，关闭回同一动作 | 实际几何、焦点/scroll与浅深system截图；库示例不代替产品现场 | [设计合同](DESIGN.md#业务日志整页语言4229) |

## 四类默认页面逐项检查

| ID | 操作 | 必须结果 | 证据 | 合同 |
| --- | --- | --- | --- | --- |
| DEFAULT-PAGE-001 | 启用初始化/登录/业务日志/平台Key业务 | 无已确认特殊要求时采用对应完整公共页，不只用原子控件重拼；无业务不造假页面 | 实际调用点、业务能力、正式exports与例外依据 | [默认选择](DESIGN.md#四类默认公共页面4223) |
| DEFAULT-PAGE-002 | 加载app/pages配置 | 同一bootstrap配置经resolveDefaultPages投影品牌、标题、URI与分页，默认值只来自随包JSON；不自动挂路由/请求或授权 | 配置/默认值、resolved结果和实际路径 | [配置合同](COMPONENTS.md#默认完整页面与配套接线4223) |
| DEFAULT-PAGE-003 | 填充品牌和附加内容 | 正常差异走配置与本页真实公开slot，保留Logo、自定义主题和文字继承；不复制内部皮肤 | 各实例slot映射、源码与computed style | [slot架构](DESIGN.md#页面与组件的槽位架构) |
| DEFAULT-PAGE-004 | 连接已有BaseService facade | 官方client/adapter与原唯一HTTP/Auth owner直接连接；method/DTO/错误/凭据不经消费方兼容改写 | 实际请求、官方合同与适用REQ/OK/ERR | [服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| DEFAULT-PAGE-005 | 进入管理员初始化 | 使用权威state/onCheck/onSubmit；不从JSON/读取失败解锁、不猜HTTP端点、不重放未知写入、不自动登录 | 状态/提交/核对、取消/迟到与秘密清理 | [初始化合同](COMPONENTS.md#管理员初始化页) |
| DEFAULT-PAGE-006 | 连接日志/Key及权限 | 日志真实只读事实、Key能力来自后端getConfiguration；pageSize不伪造total/权限、不新增查询owner | Controller/adapter身份、权限响应、分页与写入 | [完整接线](COMPONENTS.md#默认完整页面与配套接线4223) |
| DEFAULT-PAGE-007 | 默认整页不匹配领域需求 | 先使用公开slot/controller；例外有场景/受限接口/范围依据，公共增强交xui，前置缺口交服务owner | 最小复现、保留流程、责任和验收条件 | [缺口归属](ADOPTION.md#接入合规与公共缺口归属) |
| DEFAULT-PAGE-008 | 实际挂载页面验收 | 固定正式包上按适用状态/布局/焦点/刷新/秘密与请求验收；不能拿库mock代替产品，相关检查通过后交付 | 逐实例浏览器/Network/构建及未跑边界 | [专项流程](../.agents/skills/adopt-xui/references/default-pages.md) |

## 纯图标动作紧凑呈现逐项检查

| ID | 触发范围 | 必须结果 | 证据 | 合同 |
|---|---|---|---|---|
| ICON-ACTION-001 | IconButton或Button data-icon=true | 复用公共圆面/边界/焦点配方；保留所有size命中区及SVG，带文字Button/Card图标tile不套用；不加私有CSS/wrapper | 默认、hover、pressed、focus实际几何与截图，圆面与target分开记录 | [DESIGN](DESIGN.md#纯图标按钮的统一轮廓4218) |
| ICON-ACTION-002 | 工具栏、表格、Card、弹层实际实例 | 外沿透明padding仍可点击且每动作一次；Tab/Shift-Tab与Enter/Space、链接导航、Menu Escape回焦正常；四边焦点清晰 | 真实指针坐标、键盘路径、回调/路由次数与可访问名称 | [COMPONENTS](COMPONENTS.md#纯图标按钮4218) |
| ICON-ACTION-003 | 危险、禁用、busy | 危险前景保留；禁用含disabled+busy零调用且跳过Tab；busy本身按原合同可交互，边界内收不遮SVG | 各状态computed/截图、回调计数、原权限/防重owner | [PUBLIC_API](PUBLIC_API.md#纯图标按钮轮廓4218) |
| ICON-ACTION-004 | 主题、缩放或视觉Token覆盖 | light/dark/system、桌面/窄屏、长中文、文字200%及真实浏览器200%分别可达；系统偏好更新，焦点完整；自定义不挤图标或缩target | 正式包/peer、几何、缩放事实及实际未跑范围 | [DESIGN](DESIGN.md#纯图标按钮的统一轮廓4218) |
| ICON-ACTION-005 | 图标处于公共layout/slot组合 | 分别验SearchToolbar.actions/advanced、QueryForm对应槽、SidebarFooter直放/行内及展开/收拢/抽屉；横纵圆面一致且glyph居中，文字按钮原布局保留；不能以Card通过代替 | 每slot的target/圆面两轴/内边界/focus、根200与原生200、实际独立回调和草稿/展开连续性 | [DESIGN](DESIGN.md#纯图标按钮的统一轮廓4218) |
| ICON-ACTION-006 | workspace edge、ScrollArea inset/gutter、顶栏/侧栏、Dialog嵌套 | IconButton保留自身圆形offset；普通文字/输入/invalid及滚动区自身保留各自内描/留白政策；不因@scope proximity放大纯图标环 | 各边界default/根200/native200的offset、完整focus、嵌套停止边界及关闭回焦；区分宿主空间不足 | [DESIGN](DESIGN.md#纯图标按钮的统一轮廓4218) |


### 组合表格列宽逐项检查

| ID | 适用页面 | 必须满足 | 证据 | 公共合同来源 |
| --- | --- | --- | --- | --- |
| TABLE-COMPOSE-001 | 业务日志、结构化日志、API Key、图表数据视图及宿主数据列表 | 使用 DataTable；组合默认启用列宽，宿主普通 DataTable 显式 columnSizing；沿用唯一请求/分页 owner | 公共 props、真实表格与请求记录 | [组合数据表格](COMPONENTS.md#内部数据表格与列宽4236) |
| TABLE-COMPOSE-002 | 含详情/操作列 | 内置操作列无手柄；调整业务列后操作宽度保持，无重置列宽按钮 | 手柄数量、调整前后宽度和动作可达性 | [组合数据表格](COMPONENTS.md#内部数据表格与列宽4236) |
| TABLE-COMPOSE-003 | 调宽、刷新、切换视图 | 调宽零查询、保留页码与 keyed 行；刷新保留宽度；语义 id 不错配，详情关闭返回原动作 | 请求计数、节点 identity、页码/列宽和焦点 | [组合数据表格](COMPONENTS.md#内部数据表格与列宽4236) |
| TABLE-COMPOSE-004 | 窄屏/大字与各列表状态 | 表体内横滚，文字不覆盖相邻单元；加载/空/错误/重试与原筛选/权限接线有效 | 受影响页面状态、几何与操作证据 | [组合数据表格](COMPONENTS.md#内部数据表格与列宽4236) |


### 图标背景逐项检查

| ID | 适用入口 | 必须结果 | 证据 | 公共合同来源 |
| --- | --- | --- | --- | --- |
| ICON-BG-001 | 所有 Card、CardGroup 资源图标与 Icon.tile | 背景默认圆形且基础直径一致，所有资源类型继承；保留glyph、颜色和内容结构，只有显式size才有尺寸差异 | 各实际模板、computed radius/geometry、默认截图 | [基础模型](COMPONENTS.md#图标背景基础模型4237) |
| ICON-BG-002 | 明确方形用途 | 使用公开 shape、iconShape 或 data-icon-shape 标记；不按资源类型另写皮肤 | 公开 props、显式方形与缺省对照 | [公开接口](PUBLIC_API.md#图标容器形状4237) |
| ICON-BG-003 | 图标动作、复合槽、紧凑导航、Avatar、plain Card | 默认图标背景统一圆形及基础直径；无背景glyph不加底色，plain Avatar 维持自己的框；文字动作/完整导航行保留 | 默认/hover/focus/disabled/busy、geometry、Avatar/文字对照 | [设计合同](DESIGN.md#图标背景的统一形状4237) |
| ICON-BG-004 | 主题、窄屏、大字及动态变更 | public Token 覆盖有效；切换形状不改布局/草稿/身份/业务 owner，真实键盘和单次动作有效 | theme/viewport/scale矩阵、DOM identity、焦点和回调记录 | [基础模型](COMPONENTS.md#图标背景基础模型4237) |

### 模型配置逐项检查

仅使用模型配置能力时执行，不扩展到无关页面。

| ID | 适用入口 | 必须结果 | 证据 | 公共合同来源 |
| --- | --- | --- | --- | --- |
| MODEL-001 | 模型配置Form/Editor | 正式model-profile入口、六种Provider与实际agentCore一致；默认配置由agentCore经后端提供，未复制xAgent私有模板 | 组件实际页面、快照和请求记录 | [模型配置](COMPONENTS.md#公共模型配置) |
| MODEL-002 | 模型配置Form/Editor | 逐slot映射identity/connection/settings/capabilities/policy/advanced/result/actions；两列按容器净宽回落，长中文与200%无裁切 | 组件实际页面、快照和请求记录 | [模型配置](COMPONENTS.md#公共模型配置) |
| MODEL-003 | 模型配置Form/Editor | profile_id+config显式patch；0/false、缺省、空密钥、headers={}、policy=null各自语义；后端唯一合并/权限/CAS owner；仅将完整明文Profile交AgentCore，不能传patch或profile_id查密钥 | 组件实际页面、快照和请求记录 | [模型配置](COMPONENTS.md#公共模型配置) |
| MODEL-004 | 模型配置Form/Editor | 原密钥只在后端；六星号标记只解析授权记录，新增无原值拒绝；标记在后端解析，不进入AgentCore/上游；空值清除/其他值替换；替换值不在state、URL、storage、日志/错误；关闭/卸载/身份切换清理 | 组件实际页面、快照和请求记录 | [模型配置](COMPONENTS.md#公共模型配置) |
| MODEL-005 | 模型配置Form/Editor | 目录无需real_name、可手动输入、刷新保留列表与焦点；连接变化取消旧请求、迟到隔离 | 组件实际页面、快照和请求记录 | [模型配置](COMPONENTS.md#公共模型配置) |
| MODEL-006 | 模型配置Form/Editor | 向量协议可选、无聊天策略、Embed输入/维度仅用于测试；不把聊天测试拒绝误报为向量不可用 | 组件实际页面、快照和请求记录 | [模型配置](COMPONENTS.md#公共模型配置) |
| MODEL-007 | 模型配置Form/Editor | 测试/目录不保存；明确后端Save或SaveWithTest策略；逐项验50310未知、50311已提交后置失败（可叠加测试失败）、50312已提交测试失败；安全editor/新增ID/operation_id；onCommitted与onSaved无重复刷新；确认提交清dirty/凭据，缺editor锁定重读；取消/身份切换迟到无旧回调；无自动重写，CAS不覆盖 | 组件实际页面、快照和请求记录 | [模型配置](COMPONENTS.md#公共模型配置) |
| MODEL-008 | 模型配置Form/Editor | 同Controller切语言/主题/缩放不请求；键盘/浮层/Sheet关闭回焦、disabled/readOnly；成功反馈Toast，验真实页面及实际请求 | 组件实际页面、快照和请求记录 | [模型配置](COMPONENTS.md#公共模型配置) |
| MODEL-009 | policy 展示/后端 editor | 当前已配置或已投影进新增模板的具体 tokens/推理强度直接显示；缺上下文、0容量、未指定强度各自明确；none与未指定区分；不从通用defaults/模型名猜当前生效值，不将某实例窗口硬编码成全局默认 | config/defaults/草稿对照、字段实际显示与请求payload | [随包策略合同](../packages/ui-react/model-profile/README.md#策略值未指定与宿主必填规则4242) |
| MODEL-010 | 宿主要求上下文/强度必填 | 同Controller的requiredPolicyFields接线；test/save缺失或非法值零请求、对应字段aria-invalid/错误关联/焦点；catalog不受阻挡；规则更新保留草稿与原owner、零请求且不取消已发操作；load/reset/clear保留必填规则但遵守原数据/取消生命周期 | Controller身份、draft、请求次数、键盘和正式types | [随包策略合同](../packages/ui-react/model-profile/README.md#策略值未指定与宿主必填规则4242) |
| MODEL-011 | Test返回passed:false | 使用正式有界安全summary作为失败Toast并自动展开持续result；空白回退、本地化成功、HTML纯文本；单动作单Toast、临时反馈不挤动原字段 | 正式payload、Toast/result、节点/几何与请求数；后端脱敏单独验证 | [错误反馈合同](../packages/ui-react/model-profile/README.md#模型错误反馈4244) |
| MODEL-012 | Catalog/Test/Save返回已确认409/40900 | errorReason=version_conflict，明确重新读取建议；原草稿/ID/版本/六星号/Headers编辑事实保留；Save不是unknown，零自动重读/重写，仅显式reload丢弃 | 三入口请求body/CAS/state/DOM、重读前后计数；不显示原始Error/message | [错误反馈合同](../packages/ui-react/model-profile/README.md#模型错误反馈4244) |
| MODEL-013 | 模型操作网络/超时/取消/解析或迟到 | 安全reason区分，不靠任意status/message对象猜；取消读取无失败Toast，保存未确认沿save_unknown/receipt边界；504合并取消/超时不臆断；旧代迟到不覆盖 | 实际预算/取消、错误注入、状态与零重放 | [错误反馈合同](../packages/ui-react/model-profile/README.md#模型错误反馈4244) |
| MODEL-014 | 模型错误labels与同owner语言变化 | 5个可选公共反馈key按项目locale接入，旧词典仍可用；进行中动作完成用当前语言，已发Toast保留原语言，不因重渲染重复通知/请求；不重挂Controller或清草稿 | en/zh切换、Toast与请求数、同draft/Controller | [错误反馈合同](../packages/ui-react/model-profile/README.md#模型错误反馈4244) |


### 面包屑与走马灯逐项检查

| ID | 适用范围 | 检查项 | 证据 | 规范 |
| --- | --- | --- | --- | --- |
| BREADCRUMB-001 | 完整或组合面包屑 | items与children互斥、稳定id、唯一当前项、空路径不伪造；父级URI由原路由owner提供，修饰键/target不被抢占 | 正式类型、真实链接及路由调用计数 | [面包屑](COMPONENTS.md#面包屑与走马灯4241) |
| BREADCRUMB-002 | 长路径/省略/禁用/换语言 | 公共Menu省略入口、完整名称、禁用不导航、关闭回焦；长中文/窄屏/RTL/缩放可读，动态折叠不丢焦点 | 真实指针/键盘、aria-current、焦点与净宽 | [面包屑](COMPONENTS.md#面包屑与走马灯4241) |
| CAROUSEL-001 | 数据与Controller接线 | value默认/受控/注入互斥、稳定itemKey、移除/重排回退准确；确认不回调、不增加请求owner | 类型正负例、Controller记录和内容身份 | [走马灯](COMPONENTS.md#面包屑与走马灯4241) |
| CAROUSEL-002 | 切换与内容 | 前后/指示器/键盘/RTL/触屏边界准确；非当前内容不可聚焦但草稿和高度保留；独立动作不误切换 | 浏览器焦点、inert/ARIA、内容节点和几何 | [走马灯](COMPONENTS.md#面包屑与走马灯4241) |
| CAROUSEL-003 | 自动播放和生命周期 | 默认关闭；显式开始、焦点停止、悬停/隐藏暂停、减少动态效果停播；无控件无时钟；退出/销毁零旧计时动作 | 假时钟或有界真实时钟、媒体/焦点/卸载记录 | [走马灯](COMPONENTS.md#面包屑与走马灯4241) |
| CAROUSEL-004 | 状态和视觉 | loading/空/错误/刷新保留内容与disabled各自准确；labels热更新，CSS正式分片，主题/窄屏/200%和长中文可达 | 正式包独立消费与真实截图/操作 | [走马灯](COMPONENTS.md#面包屑与走马灯4241) |
