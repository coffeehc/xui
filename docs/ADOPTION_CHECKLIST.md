# xui 项目接入逐项验收清单

本清单用于改造前、实现中和部署前逐项核对。当前设计版本以固定 SHA 中的 [DESIGN.md](DESIGN.md)（4.1.2）、[PUBLIC_API.md](PUBLIC_API.md)、[COMPONENTS.md](COMPONENTS.md) 和正式 types 为唯一合同源；本表只把接线与验收拆成可重复检查的项目，不复制 token 默认值、DTO 或再定义一套设计系统。发现合同冲突时记录失败并交由 xui 维护者确认，不由消费项目自行发明合同。

## 使用与报告规则

1. 固定并记录 xui 完整 Git SHA、DESIGN 版本、三个包版本、正式 tarball 的 SHA-256 和安装锁文件解析结果。三个包必须来自同一源码构建。
2. 每一个实际页面实例、每一个实际组件实例、每一个适用 API 操作都单独填报告；同一组件出现在两个页面时是两个被测对象，不能用一个示例代替。
3. 每条状态只能是 `通过`、`失败`、`未跑`、`不适用`。`不适用`须附真实业务不存在或明确范围排除的证据；没实现、缺数据、没测、环境阻塞均记`未跑`或`失败`，不可记不适用。
4. 对公共能力缺口，状态记`失败`，责任 owner 记`xui`，附公开入口、最小复现及需要补齐的合同；消费方不得用私有 DOM、私有 CSS、`!important` 或第二套交互掩盖。
5. 每行证据必须指向此次固定产物上的真实消费源码、浏览器/Network 记录、自动化执行结果或后端 handler/合同测试。测试文件存在、样板通过、截图好看或旧版本通过均不能单独证明产品页面通过。
6. 每个使用中的具名 slot 都要按实际“页面/组件实例 × slot”单独检查；报告必须分别记录归属/API、填入内容、视觉语义与 token 角色、排版/对齐、空槽行为、适用状态、滚动与焦点归属。一个组件样板不能代表所有页面实例。
7. 部署前提交逐项矩阵，至少包含：`ID、对象/页面/组件实例/slot/API、状态、期望、实际、证据、责任 owner`。不得以“符合 xui”“组件已复用”或按章节汇总代替逐行结论。

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
| SERVICE-009 | 应用退出或文档owner结束 | 通过 `disposeXuiServices(window)` 释放该Window registry，不让组件卸载销毁共享服务 | owner destroy计数与多个view卸载对照 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| THEME-009 | 有有效 sessionStorage 主题且 config 默认值不同 | 恢复存储偏好，config只作为无效/缺失偏好时的默认；显式受控 `ThemeOptions.mode` 单独按受控合同测试 | init前后root属性、bootstrap ThemeState、storage值 | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
| THEME-010 | 加载 `@coffeehc/xui-runtime/init.js` | 首绘脚本不创建 `window.xuiTheme`/ThemeController；正式owner由bootstrap/getThemeService建立 | 运行脚本后、bootstrap前后owner实例与ThemeState | [PUBLIC_API 启动配置与服务](PUBLIC_API.md#启动配置与应用服务) |
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
| FRAME-004 | 构建或发布消费项目 | theme、runtime、React 三个包来自同一固定 1.0.0 源码版本；React 声明与宿主 peer 实例匹配公开 exports | manifests、lockfile、正式 tarball SHA-256、types 检查与 module graph | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) · [PUBLIC_API](PUBLIC_API.md#全部正式入口) |
| MIG-001 | 迁移 XQuant 页面 | 按活动页面和路由逐项盘点其旧非 React UI 调用；每个尚未切换的页面如实记失败/未跑，不能将 xui 1.0 发布等同迁移完成 | `xquant/web` 源码、构建入口、调用点到页面矩阵 | [ADOPTION React 唯一公共 UI](ADOPTION.md#react-是唯一公共-ui) · [逐项浏览器矩阵](#逐项浏览器验收矩阵) |
| MIG-002 | XQuant 页面引入 React UI | 正式产品入口创建 React root，并接入唯一 React/ReactDOM peers 与 xui React 包 | package/lockfile、实际入口、production module graph | [ADOPTION 固定产物](ADOPTION.md#固定产物与可运行示例) · [PUBLIC_API](PUBLIC_API.md#全部正式入口) |
| MIG-003 | XQuant 页面替换旧 UI factory | 每个旧 UI factory 调用映射到已有 React 公共组件或列为 `owner=xui` 的公共缺口 | 逐调用源码映射、React 页面 props/slot、旧调用清零扫描 | [COMPONENTS](COMPONENTS.md) · [PUBLIC_API](PUBLIC_API.md#全部正式入口) |
| MIG-004 | 发布 XQuant React 页面 | 正式产品构建解析已固定 ESM/CSS/types/init 且不含旧 runtime UI 路径；真实路由、交互和失败恢复在浏览器逐项通过 | production manifest、浏览器网络/操作记录、DOM identity 结果 | [ADOPTION 验收](ADOPTION.md#按授权范围迁移与验收) · [逐项浏览器矩阵](#逐项浏览器验收矩阵) |
| MIG-005 | 迁移 XLead 页面 | 逐项盘点动态 app、startup、boot guard、admin setup 与 React islands 内既有 UI factory；React 依赖存在不算完成 | 源码 imports/calls、动态 chunk 图、页面和 owner 矩阵 | [ADOPTION React 唯一公共 UI](ADOPTION.md#react-是唯一公共-ui) |
| MIG-006 | XLead 页面统一 React owner | 每个产品 UI 区域都由 React 页面/组件负责，没有同一可见区域继续由旧 DOM factory 持有 | React root 清单、旧调用扫描、节点身份与交互 owner 记录 | [DESIGN 生命周期](DESIGN.md#前端状态与资源生命周期) · [COMPONENTS](COMPONENTS.md) |
| MIG-007 | 发布 XLead React 页面 | 实际存在的 web、desktop/embed 路由分别通过正式构建和真实浏览器验收；React island 之外的页面不能漏测 | 各目标 bundle manifest、路由清单、浏览器操作结果 | [ADOPTION 验收](ADOPTION.md#按授权范围迁移与验收) · [逐项浏览器矩阵](#逐项浏览器验收矩阵) |
| MIG-008 | UI 迁移使用 runtime | 删除 UI factory 调用后仍保留业务实际使用的 HTTP/auth/query/theme/resource 服务、模型、解析器和工具 | runtime import 分类、编译结果与请求 owner 检查 | [ADOPTION React 唯一公共 UI](ADOPTION.md#react-是唯一公共-ui) · [PUBLIC_API](PUBLIC_API.md#全部正式入口) |
| MIG-009 | 迁移页面使用公共业务 API | 迁移前后适用 API 的 method/path/query/body/凭据/DTO/权限及成功失败语义不变；不得新增前后端双层协议转换 | 前后 Network HAR、typed wire 断言与后端合同测试 | [PUBLIC_API 默认适配器的服务前置](PUBLIC_API.md#默认适配器的服务前置) · [16个公共API](#16-个公共-api-操作逐项检查) |
| MIG-010 | 声明产品迁移完成 | 每个目标页面、正式构建和浏览器操作均有当前固定版本证据；未验环境、页面或状态明确列为未跑，不用 xui 示例或包升级代替 | 逐页报告矩阵、生产 SHA、路由和浏览器证据 | [ADOPTION 验收](ADOPTION.md#按授权范围迁移与验收) · [逐项浏览器矩阵](#逐项浏览器验收矩阵) |

## 业务界面信息与交互决策

在公开组件/slot 接线检查之前，先按 [DESIGN 决策标准](DESIGN.md#业务界面信息与交互决策) 核对信息与交互选择。评审可先记录设计依据；行为项须取得真实运行证据才能记通过，只有方案或截图时保留相应未跑项。此表只规定判定与证据，不另定义一套组件选型规则。

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
| SHELL-022 | 侧栏Header/列表/Footer有可聚焦控件 | Header保留限高/独立滚动、菜单最小高度和Footer；各控件inset焦点可绘制，invalid边界仍可读 | 324px/窄屏/200%文字与真实zoom、键盘焦点和滚动记录 | [COMPONENTS 侧栏组合](COMPONENTS.md#侧栏快捷操作组合) |
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
| TYPE-003 | AppShell/MenuLayout侧栏 | header/footer裸说明为meta，控件保持自身control角色；slot不递归覆盖字体 | 324px/窄屏200%时三动作与导航、footer几何 | [DESIGN 公共文字槽](DESIGN.md#公共文字槽验收) |
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
| CTRL-003 | 页面使用 IconButton | 图标动作有稳定可访问名称；busy/disabled 只按真实操作状态表达，不借图形颜色传达唯一含义 | accessibility tree 与键盘/disabled 记录 | [COMPONENTS 基础组件](COMPONENTS.md#基础组件与通用状态) · [PUBLIC_API 正式入口](PUBLIC_API.md#全部正式入口) |
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
| CTRL-016 | 页面使用 Toast | 仅短暂、非关键反馈进入 Toast；需要持续处理的错误/权限/风险仍在所属内容位置可见 | Provider/调用路径与错误恢复后截图 | [COMPONENTS 通用状态](COMPONENTS.md#基础组件与通用状态) · [DESIGN 表单、搜索与反馈](DESIGN.md#表单搜索与反馈) |
| TOAST-001 | 通知队列与注入 | 默认 Provider 仅建一个队列；controller/toastManager 与 timeout/limit/exitTimeout 互斥，借用实例不销毁 | 双模式、StrictMode、同id实例替换/退出与迟到结果 | [通知合同](DESIGN.md#通知队列与视图合同) |
| TOAST-002 | 通知位置与文字 | 默认右上角，Title/Description/Actions/Action/Close 使用公共槽，动作末行靠右；窄屏与大字默认最新1项、40dvh内滚动、焦点四边可见，宿主不写定位/字号补丁 | 三主题、长中文、200%文字与真实页面缩放截图 | [通知合同](DESIGN.md#通知队列与视图合同) |
| TOAST-003 | 计时与关闭 | 悬停/聚焦/文档隐藏/无View/隐藏项暂停；恢复剩余时长，关闭回调各一次，旧Promise不复活关闭项 | 受控时钟、真实指针/键盘、错误与退出用例 | [通知合同](DESIGN.md#通知队列与视图合同) |
| TOAST-004 | 通知焦点与播报 | 新增不抢焦点；F6/Tab/Escape与关闭后回焦；polite/assertive 按真实优先级，必要错误原位持续 | DOM语义、键盘与动作焦点；读屏器未测须单独注明 | [通知合同](DESIGN.md#通知队列与视图合同) |
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
| NAV-005 | 桌面默认展开或收起 | 展开使用公共min/max与25vw动态宽度（默认324–432px）、50vw封顶；收起使用60px compact rail，不写内部宽度覆盖 | computed width 与正式默认值 | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-006 | 用户键盘操作菜单 | 方向键、Home/End、Enter/Space 按公开导航合同工作 | 自动化按键轨迹与 active/expanded 状态 | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-007 | 菜单处于窄屏 Drawer | 只有一个可见打开入口；关闭回到原触发按钮 | 窄屏 DOM 计数、焦点前后 activeElement | [COMPONENTS 导航与菜单](COMPONENTS.md#导航与菜单) |
| NAV-008 | 名称旁有非交互运行/等待状态 | renderLabel使用主项剩余宽度；名称可收缩、尾随状态不收缩并位于逻辑末端；有独立分支/配置时保留各自轨道，不将状态伪装成action按钮 | 短/长名称、324/60、窄屏与200%矩形，状态出现/消失前后节点与焦点 | [COMPONENTS 富条目导航](COMPONENTS.md#富条目独立行尾动作与上下文菜单) |
| NAV-009 | 富标签开启名称滚动 | 只有NavigationMenu.Label内的名称移动；尾随状态和分支/配置不动，触控/reduced-motion完整换行且与名称首行对齐 | 悬停/键盘录像、动态偏好切换、RTL及名称/状态更新记录 | [COMPONENTS 富条目导航](COMPONENTS.md#富条目独立行尾动作与上下文菜单) |
| NAV-010 | 导航项处于当前选中状态 | 主名称、富标签说明与公共文字/图标槽共同继承主题 selected 前景，muted 不覆盖选中色；hover、pressed、focus 保持该色，禁用前景优先，竖线仅辅助 | 三主题、普通/富标签与200%文字/浏览器zoom的computed color及截图 | [DESIGN 状态前景](DESIGN.md#逐组件外观与状态映射) · [COMPONENTS 导航](COMPONENTS.md#导航与菜单) |
| MENU-SEP-001 | 菜单中需要分隔不同内容组 | 使用 `Menu.Separator` 或 `ContextMenu.Separator`，它不执行动作、不可成为额外键盘停靠点，浅深主题下仍清晰可辨 | role/aria、Tab顺序、主题computed样式与两种菜单组合 | [COMPONENTS 弹层与工具栏](COMPONENTS.md#弹层与工具栏) |
| MENU-VIEW-001 | 使用数据驱动 `Menu.View` | 默认 config 模式只有一个由 View 管理的内部 Controller；注入模式完全替换它，不创建默认实例，且 Controller 生命周期归注入宿主。两种 props 模式互斥 | 正/负类型编译、Controller 创建/订阅/退订/destroy 计数与实例身份 | [COMPONENTS 数据菜单与 Controller 所有权](COMPONENTS.md#数据菜单与controller所有权) · [PUBLIC_API `/menu`](PUBLIC_API.md#全部正式入口) |
| MENU-VIEW-002 | 菜单动作执行或需自定义焦点行为 | `actionId` 只映射宿主动作；只有同步 `event.preventDefault()` 取消本次默认关闭。异步操作仍归宿主，Base UI 是方向键与实际焦点的唯一 owner | pointer/keyboard 一次动作计数、阻止关闭断言、ARIA/焦点轨迹与迟到业务回调 | [COMPONENTS 数据菜单与 Controller 所有权](COMPONENTS.md#数据菜单与controller所有权) |
| STATE-OWNER-001 | 采用任一有语义交互状态组件 | 逐项选择默认或同契约注入，完整替换不创建/订阅并行默认；不得把value/onChange或handle算完整注入；Toast使用正式xui Controller，不传旧peer动作bus | 默认/注入/不适用/未满足逐项证据，不得全量笼统打勾 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-002 | 默认模式使用受控值 | 用户请求不提前发布未确认值；外部确认不触发回调循环，default仅初始化 | 拒绝/接受请求与动态值更新计数 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-003 | 注入或替换Controller | 初始化/受控/callback互斥；实例切换退订旧实例，不destroy注入者、不覆盖其配置；DOM/焦点连续 | 正/负类型、JS冲突、订阅计数、旧实例动作与焦点 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-004 | 默认实例生命周期或异步操作 | StrictMode不重复请求，不在effect replay永久销毁；真实退出取消所属等待并隔离迟到结果 | replay/卸载/切换、请求次数及迟到操作 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-005 | 登录、密码、初始化、一次性Key | 秘密只在DOM/瞬时提交边界，安全快照无密码/匹配词/secret，退出清理；现有AuthClient与权限owner不替换 | 快照检查、扩展await前后读取及退出DOM/worker清理 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-006 | ApiKey/业务日志/结构化日志View | 旧controller仅service；完整注入使用viewController且与service/options初始化互斥。默认依赖显式adapter/loader；展示草稿/客户端页不复制服务查询 | 三模式、请求次数、借用/所属销毁、取消/快照/刷新保行 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| STATE-OWNER-007 | 导航、选择与Overlay组合 | 父子共享所属语义实例，Base UI执行实际键盘/焦点/portal；路由、分组页、active事实归宿主 | 组合实例/受控拒绝、disabled、Escape和同树焦点 | [状态Controller](COMPONENTS.md#状态所有权与-controller-模式) |
| AUTH-UI-001 | 采用完整登录、初始化或纯认证布局 | 统一使用AuthPage及其组合；品牌位于卡片外，title/description属于卡片内标题组，不用宿主DOM/CSS复刻 | 实际props/组件映射与三主题桌面/窄屏截图 | [认证布局](COMPONENTS.md#认证布局-slot-归属) |
| AUTH-UI-002 | 提供品牌/Logo | config.productName/logo原样显示；Logo保留src/alt/referrerPolicy与比例；无Logo无占位，长名称自然换行 | 首次/更新/移除Logo、长中文及computed字形/几何 | [认证布局](COMPONENTS.md#认证布局-slot-归属) |
| AUTH-UI-003 | 填写字段或扩展认证内容 | children或beforeFields/afterFields只放真实Field/控件组；空扩展不占位，不嵌套form、不增加虚构入口 | label关联、Tab顺序、空槽/长中文与宿主输入节点身份 | [认证布局](COMPONENTS.md#认证布局-slot-归属) |
| AUTH-UI-004 | 主动作、次级动作与反馈 | actions只放主提交；alternatives只放真实SSO等次级入口；feedback/feedbackActions在主动作后自然增高，空槽无轨道 | busy/error/unknown、请求次数、DOM身份及必要结果全文可读 | [认证布局](COMPONENTS.md#认证布局-slot-归属) |
| AUTH-UI-005 | 字体与界面放大 | 采用login-title、section-title、body-sm/meta角色与公共缩放；宿主不设内容字号/控件皮肤，不缩字或裁字段维持构图 | light/dark/system、320/390px、125/150/200%界面、200%文字及真实浏览器缩放 | [认证设计](DESIGN.md#公共登录页布局与主题) |
| AUTH-UI-006 | 登录视觉升级 | AuthClient、导航、密码清理和扩展回调归属不变；提交无取消、无重复写，切主题/缩放不重挂表单 | Network顺序、受控/注入、焦点/选区、pagehide及迟到结果 | [认证会话](PUBLIC_API.md#认证会话) |
| AUTH-UI-007 | 检查/错误切换到管理员初始化 | 保留同一AuthPage与品牌/卡片节点；children使用AdminSetupForm，AuthPage从首次挂载省略form；检查阶段零form、初始化阶段唯一form，不复制校验/提交或嵌套完整页面；busy/清密/未知结果仍按原合同 | 阶段切换前后node identity、form计数、请求与密码清理轨迹 | [初始化组合](COMPONENTS.md#可组合初始化表单) |
| STATE-COPY-001 | 复制文本或显式writer | 使用runtime剪贴板服务或既有平台writer，写入串行、取消/迟到隔离；失败就地反馈，不读剪贴板/持久化/自动重试 | 真实指针、fallback焦点/选区/scroll、队列/失败/取消计数 | [剪贴板服务](PUBLIC_API.md#剪贴板复制服务) |
| COLOR-001 | 展示普通归属/来源类别 | 使用中性 Badge/tone，不以 success/warning/error 颜色代替分类 | Badge props、light/dark computed colors | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-002 | 展示成功/运行状态 | 只有后端或业务状态明确成功时使用 success 语义 | 状态来源字段与 DOM tone | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-003 | 展示警告/等待/人工介入状态 | tone 与真实状态分类逐条映射，不只用颜色传达状态 | 领域状态映射表和可访问文本 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-004 | 展示错误/失败状态 | 错误语义有文本/图标辅助，不把一般信息着色成错误 | 错误来源与两主题截图 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-005 | 出现删除/撤销等危险操作 | 使用公开 danger 语义；确认、权限和实际 mutation 仍归业务 owner | Item tone、公共 CSS 与确认回调 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-006 | 页面存在标题/摘要/meta/disabled/help 文本 | 分别使用 DESIGN 规定文字角色和对比，不手写每页字号/颜色 | computed tokens 与角色映射 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |
| COLOR-007 | 展示数值、ID、时间或代码 | 按 DESIGN 对应文本角色呈现；不把任意正文改成 mono 或截断事实 | computed font family 与完整值 | [DESIGN 逐组件外观与状态映射](DESIGN.md#逐组件外观与状态映射) |

## 刷新、身份与生命周期

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| LIFE-001 | 页面第一次加载资源 | shell/header/标题稳定存在；loading 位于数据所属区域 | DOM 时间线与首个请求 waterfall | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
| LIFE-002 | 已有数据同范围刷新 | 旧确认数据持续可见，局部显示 refreshing，不卸载整页/组件 | 节点 identity、快照、录屏与 Network | [DESIGN 数据刷新与视图连续性](DESIGN.md#数据刷新与视图连续性) · [生命周期](DESIGN.md#前端状态与资源生命周期) |
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

## API 接入公共底座

本清单的 16 项是 xui 已明确的公共业务操作，不代表所有业务/第三方 API 都须改造成这些 endpoint。OAuth/OIDC/SAML、上游模型、MCP、插件和其他领域接口继续遵循各自协议。BaseService 只能按该能力当前实际提供的 facade 使用，不能假称所有表格操作均已存在。

| ID | 触发条件 | 必须结果 | 证据 | 公共合同来源 |
|---|---|---|---|---|
| API-BASE-001 | 某项目采用 xui 公共16项操作，且 BaseService 对应版本包含该项 facade | 按该能力实际存在的 BaseService 配套服务与 facade 接入，并由 xui 官方 client 发起；前端不再插入同协议转换/包装层 | 版本化服务依赖、路由注册、client 调用源码与 Network wire | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-002 | 某项目未采用 BaseService，或 BaseService 尚未提供该公共操作 | 由宿主后端在一个 facade 边界实现 PUBLIC_API wire；前端仍直接使用官方 xui client，不增加前端协议适配层 | 服务端 route/DTO projection、client 调用链与同一响应抓包 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-003 | 领域模型字段与 xui 已声明的公共 DTO 不同 | 最多在宿主后端 facade 投影一次；前端不再把领域 DTO 转成公共 DTO，也不让后端再次转换 | 唯一 mapper 调用链、前端网络 client 与响应 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-004 | 任一公共操作所需的真实服务能力不存在 | 逐项记宿主未接入/失败并标后端 owner；不以 mock、静态假响应、虚构数据或前端 adapter 记通过 | 后端路由/服务版本与逐项报告 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-005 | 前端调用任一这16项公共操作 | 由 xui 官方 client 承担 endpoint、method、query/body、envelope、解析与公开错误；不得重复实现 client 或协议解析 | 前端 call graph、模块 resolved path 与 fetch/Network 记录 | [PUBLIC_API HTTP 与查询](PUBLIC_API.md#http-与查询) · [正式入口](PUBLIC_API.md#全部正式入口) |
| API-BASE-006 | 核验任一公共操作请求 | 逐操作对照 PUBLIC_API 中该 operation 的 method/path/query/body/credentials/header；不猜别名，不要求业务/第三方 API 改造 | 该操作的 wire fixture 与抓包逐字段比较 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |
| API-BASE-007 | 任一 HTTP 2xx 响应包含 AjaxResponse envelope | 仅 `success=true` 才是 envelope 成功；`code` 依合同作为安全整数元数据，不猜固定成功码或 payload 别名 | HTTP 200 success true/false 夹具与 UI 状态 | [PUBLIC_API HTTP 与查询](PUBLIC_API.md#http-与查询) |
| API-BASE-008 | 任一公共操作返回非2xx、业务失败或 parser 错误 | 按该 operation 的 PUBLIC_API/runtime error kind/status/code 分支；不能把所有 API 的 403/404/409/5xx 映射成相同文案 | 对应错误注入、HttpError/state 与用户可见反馈 | [PUBLIC_API 安全错误](PUBLIC_API.md#安全错误认证与重试) |
| API-BASE-009 | 响应 DTO 含缺失字段、额外字段、错类型或未知字段 | 严格遵循逐 adapter parser：auth 与 API-Key wire 是封闭字段合同；BusinessLog/StructuredLog 响应投影公开字段并丢弃额外内容；不能全局拒绝或允许额外字段 | 对应 runtime parser 对正负夹具的结果及实际响应字段 | [PUBLIC_API 对应 adapter/runtime](PUBLIC_API.md#全部正式入口) |
| API-BASE-010 | 响应包含 nullable、ID 或高精度时间字段 | 按对应合同验证 null/格式/范围；ID 保留字符串精度，RFC3339Nano 时间不得经 JS Date 降到毫秒 | 边界 fixtures、原始 wire 与 UI 展示值 | [PUBLIC_API ID 编码](PUBLIC_API.md#显式实体身份编码) |
| API-BASE-011 | 列表返回 offset total 或 StructuredLog cursor/as_of | 只显示响应确认的 total、cursor、snapshot/as_of；API-Key 要求准确 total；BusinessLog default loader 要求 total 字段存在但 null 仍是未知；StructuredLog 不得虚构 total | 原始分页响应、多页游标及 UI page facts | [PUBLIC_API 分页合同](PUBLIC_API.md#列表元数据与受控游标分页) |
| API-BASE-012 | 任何 mutation 返回超时、断线、取消或结果未知 | xui client 不自动重放写请求；只执行该 API 明确允许的普通读取核验或用户触发只读重试 | 请求次数、取消/超时轨迹及 API 专属核验请求 | [PUBLIC_API 默认服务前置](PUBLIC_API.md#默认适配器的服务前置) |

## 16 个公共 API 操作逐项检查

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
| AUTH-LOGOUT-ERR | logout 拒绝或请求结果未知 | logout 已先清理本地 access，但未确认服务端退出时保留未知/错误事实；不自动重发、不宣称 cookie 已撤销 | 断线/失败注入、状态时序、请求次数与 cookie 可见事实 | [PUBLIC_API 认证会话](PUBLIC_API.md#认证会话) · [runtime/auth.ts](../packages/runtime/src/auth.ts) |
| KEY-CAPS-REQ | API Key 管理器读取配置 | 由官方 `createApiKeyHttpAdapter` 请求 `GET /api/v1/api-keys/capabilities`；复用一个已授权 HTTP/auth owner | 调用点、Network 与 adapter 参数 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-CAPS-OK | capabilities 成功响应 | 严格 v2 解析权限、期限、默认项、确认文案和 can_create；配置来自服务，不由页面猜值 | 响应 fixture、运行时配置与控件选项 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-CAPS-ERR | capabilities 失败、无权或 schema 无效 | 能力保持未确认/不可用，不启用创建，不猜权限、期限或默认值 | 错误/schema注入与按钮状态 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-LIST-REQ | API Key 列表初读或刷新 | 官方 adapter 发 `GET /api/v1/api-keys`，`page_index` 基数0、`page_size` 按配置、`return_total=true`、`sort=id&sort_id=asc` 并按 total 完整取页 | Network query 与 pages 请求序列 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-LIST-OK | API Key 列表成功 | 解析严格 v2 ListData；ID/total准确、跨页稳定；metadata 不含 secret | response fixture、全页计数与行ID比对 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-LIST-ERR | 列表缺 total、重复ID、total变动、越预算或 HTTP/业务拒绝（含403） | 该轮读取失败，保留最近已确认列表并提示真实错误；不伪造总数/末页 | 故障响应、旧行 identity 与错误状态 | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [runtime/api-key-http.ts](../packages/runtime/src/api-key-http.ts) |
| KEY-LIST-001 | API Key Manager 使用本地分页 | 只对完整已确认rows分页；默认pageSize/options按公开合同，翻页或改页长不发请求；总数等于完整集合长度；显式false关闭分页 | rows/page状态、控制器请求计数、翻页前后行ID与total | [PUBLIC_API API Key 管理](PUBLIC_API.md#api-key-管理) · [COMPONENTS](COMPONENTS.md) |
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
| SERVICE-010 | 只用 bootstrap 或单项 Service | bootstrap 不含 HTTP/Auth/Menu/Upload 实现；窄入口仅包含职责依赖，根入口/全量 services 有意汇总 | 正式 tarball bundle metafile 的贡献文件与 gzip；不能仅看压缩后体积 | [按模块单例](PUBLIC_API.md#按模块导入的单例与-40-迁移) |
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
