# 可配置登录页与统一认证合同 v1

`ConfigurableLoginPage` 和 `createLoginPage` 提供完整登录页：项目填写产品名称、标题、说明、可选 logo、文案与安全回跳目标，传入已有主题 owner 和认证 client，即可采用相同默认皮肤和交互。原子→组合→页面的设计哲学统一记录在 [FOUNDATION.md](FOUNDATION.md#组件层次与扩展原则)，通用视觉规则仍只在 [DESIGN.md](DESIGN.md)。

## 真实参考与新合同的区别

已用正常 Git 读取 xAgent 提交 `29139f7843d9a79a9eca42892cb87da8f08f6320`，核对 [auth-service.ts](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/frontend/packages/business/src/services/auth-service.ts)、[http-service.ts](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/frontend/packages/business/src/services/http-service.ts)、[user_endpoint.go](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/internal/services/apiserver/user_endpoint.go) 和 [user_auth_endpoint.go](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/internal/services/apiserver/user_auth_endpoint.go)。现有密码登录为 `POST /api/v1/auth/token`，发送 password grant、username/password/client_id/channel_type/terminal_id，返回 access/refresh token；退出是 `POST /api/v1/auth/logout`，当前用户为 `GET /api/v1/me/state`。现有前端持有 bearer token，错误也有 HTTP 200 的业务 envelope。

下面是 **xui 新定义的 cookie 会话 facade**，不是对上述协议的别名兼容，也不声称 xAgent 已可直接接入。产品或未来 baseservice 实现 adapter 后遵循它；本轮没有修改其他仓库、实现 cookie 后端或生成凭据。不等待 baseservice：xui 先通过可测试合同、合成 fetch 和两个正式消费者完成前端。采用旧协议的产品若尚无该facade，先保留已有认证owner并逐页采用主题/原子/其它页面，记录后端缺口；facade与真实契约验收就绪后再切完整登录页。createAuthClient只有http/timeoutMs配置，不支持靠改baseURL或猜route/adapter完成旧协议迁移。

## 固定版本接口

同一共享 `HttpClient` 的 `baseURL` 指定服务 origin；请求固定根路径 `/api/v1/auth/*`，不会附加 baseURL 的路径或自动尝试旧路由。默认 credentials 为 same-origin，登录与退出无 retry，三个请求 cache=no-store、redirect=error。默认整段预算 15,000ms，可在 `createAuthClient({http, timeoutMs})` 配置，覆盖 header provider、fetch 和读取响应 body。

| 操作 | 方法与固定路径 | 请求 | 成功响应 payload | HTTP 401 |
| --- | --- | --- | --- | --- |
| 登录 | POST `/api/v1/auth/login` | JSON `{username:string,password:string}` | `AuthSession`，后端同时签发/轮换 cookie | 登录拒绝；保留此前服务端确认的用户状态，不广播全局过期 |
| 当前用户 | GET `/api/v1/auth/session` | 无 body/query | `AuthSession` | anonymous、user=null，无错误提示；未登录是正常事实 |
| 退出 | POST `/api/v1/auth/logout` | JSON `{}` | null；后端撤销会话并清 cookie | 已无有效会话，视为已退出 |

成功外层必须为现有 [HTTP](HTTP.md) 的 Go `AjaxResponse`：`success:true`、`code:1`、`message:string`、`request_id:string`、`payload` 必须存在；失败 HTTP status 与 success/code 业务失败分开。不接受 data/msg/access_token/user_id 等猜测别名。

```ts
interface AuthUser { id: string; username: string; display_name: string | null }
interface AuthSession { schema_version: 1; user: Readonly<AuthUser> }
```

这两层 DTO 是严格公共投影：缺字段、额外字段、其它版本和 token 字段被拒绝。id 为非空不透明字符串（最多256字符）；username 非空（最多128字符），display_name 为 null 或最多256字符。角色、权限、tenant、数据库模型与完整用户档案不放进这个 DTO，也不能根据 display_name 推导权限。用户名提交时去两端空白；密码保留原始字符，不 trim，最长4096字符，必须仅在 POST body 传递。

401 之外的 403/429/5xx、业务失败、parse/network/timeout 保留为安全 `HttpError`。页面以本地文案反馈，不显示服务端原始 message、body、URL 或异常 cause。API 不将外层 redirect 用作登录跳转。固定 contract 接口负责其真实鉴权、状态码和脱敏；旧 bearer 协议由项目独立适配，不把 JWT 解码结果假装为服务端确认的 user。

## 状态、取消与凭据生命周期

认证 client 是同一宿主的一个状态 owner：`getState/subscribe/currentUser/login/logout/cancel/expire/destroy`。初始 unknown；页面挂载时显式核对会话。登录成功/currentUser成功→authenticated；session401/退出成功/退出401→anonymous。重复写操作在 client 和页面两层阻止，不自动重放。另一次读取、过期或销毁用 generation 排除迟到结果，订阅使用快照。

取消/超时/网络失败只停止本地等待，不能撤回已执行的登录、Set-Cookie 或服务端撤销。写操作结果不明时清 user、标记 unknown，页面显示必要反馈和“核对会话”，重新读取后再确认；不宣布已经安全退出，也不尝试从 JS 删除 HttpOnly cookie。当前用户读取取消保留此前确认状态，其它读取失败则标记 unknown、清 user，不将旧身份当作当前确认。退出等待开始即清本地 user，失败仍不恢复旧身份。宿主订阅身份变化，清理所属缓存、私密草稿、连接和领域资源；组件不替代这些业务生命周期。

三个 auth 请求使用显式 `unauthorized:'ignore'`，在认证 owner 内解释401，不消耗共享 HTTP 的全局过期 latch。其它 protected API 的 `onUnauthorized` 可调用 `auth.expire()`；认证成功和退出确认调用 `http.resetUnauthorized()`，防止旧 HTTP epoch 的401污染新会话。业务错误全局反馈若存在，按 endpointId 将 auth.* 交由页面反馈，避免两个提示 owner。

页面不在 React state、client state、URL、storage、缓存或日志保存密码；密码是 transient input，提交前清 DOM，成功/错误、pagehide、卸载时清 value/defaultValue/textContent，迟到结果不触发跳转。传输必然短暂持有请求 body/字符串；不承诺 JS 字符串内存擦除或浏览器密码管理器行为。

## 配置与公开扩展

```ts
import {createHttpClient} from '@coffeehc/xui-runtime/http';
import {createAuthClient} from '@coffeehc/xui-runtime/auth';
const http = createHttpClient({
  baseURL: location.origin,
  onUnauthorized: () => auth.expire(),
  // getHeaders: 项目既有受信任 CSRF header provider；不要在源码填真实秘密。
});
const auth = createAuthClient({http});
const config = {
  productName: '工作台', title: '登录工作台', description: '继续处理你的工作。',
  logo: {src: '/assets/logo.svg', alt: '工作台'}, returnTo: '/work',
  // labels: 本地化字符串；没有结构/HTML/内部 CSS override。
};
```

React：`<ConfigurableLoginPage auth={auth} theme={theme} config={config} />`。原生：`createLoginPage(root,{auth,theme,config})`；factory 返回 `getElement/destroy`，不销毁共享 auth/theme。先加载公共 CSS 与同步 init，复用 `window.xuiTheme`，不新建竞争主题 owner。

可选 `onAuthenticated(user,returnTo)` 将导航交给宿主 router；没有回调时登录成功和“Continue”采用安全的根相对 `location.assign`。已有有效会话显示确认用户、进入与退出操作。配置均以文本/普通 img 渲染，logo 只接受 HTTP(S)或相对资源且不能带 URL credentials；不注入 HTML、脚本或内部皮肤。尽量简短标题/说明；过长品牌与动作文字各自可滚动并保留正文空间，卡片正文必要时独立滚动，底部主操作保持可达，不裁切关键文字或缩小字号。

`resolveLoginReturnTo` 只保留根相对同源路径，规范化和重复解码后再拒绝双斜杠、反斜杠/控制字符、默认 `/login` 循环、无效转义与不安全 fallback。去掉整个 fragment 和 password/access_token/refresh_token/token/auth_token/authorization/code/api_key/client_secret/secret query；安全 fallback 默认 `/`。其它自定义登录路由和业务 query 由宿主另验，不承诺任意参数都识别为秘密；标准页面不会把密码构造成 returnTo。目标页面及任何后续业务重定向仍须后端自行验证，不把同源中转路由当开放跳转豁免。

## Cookie、CSRF 与后端责任

cookie 的签发/轮换/有效期/服务端撤销、HttpOnly/Secure/SameSite、准确的 Path/Domain、no-store响应、限速及用户枚举防护由真正后端实施。包括登录在内的写操作必须有后端 CSRF 防护（准确 Origin/Fetch Metadata 和缺 header 策略，或项目既有 token 方案），拒绝不合适的 simple content-types 与宽松 CORS。前端仅 JSON、同源路径和 credentials 不能提供这些保证。[OWASP CSRF 指南](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#possible-csrf-vulnerabilities-in-login-forms)

跨 origin 服务必须由宿主显式配置 HttpClient credentials=include 及准确服务端 CORS/CSRF/cookie策略；same-origin 默认不会自动发送跨 origin cookie。[MDN Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials) xui 不读取或创建 cookie、JWT/access/refresh token，也不引入 token 持久化。登录/退出是否写业务审计由宿主后端决定，页面不重复写入。

## 验证与后续边界

[共享配置](../examples/shared/login-config.json)、[合成 facade](../examples/shared/login-model.ts)、[React](../examples/login-react/app.tsx) 与 [原生](../examples/login-vanilla/app.js) 都经 fresh npm tarball 安装正式入口再打包，不读 monorepo 源码 alias，也不需要私有页面 CSS。[逻辑回归](../tests/auth.test.mjs) 与 [浏览器回归](../tests/browser/login.spec.mjs) 核对严格 DTO、共享401、固定请求、取消/超时/迟到/防重复、回跳、错误安全、theme、键盘/焦点/reduced-motion、390px/200%/后备字体和密码节点清空。

合成 fetch 没有签发真实 cookie，不证明后端登录、CSRF、CORS、鉴权或审计可靠性通过。最终完整验收与同 SHA CI 随交付记录。注册、重置密码、SSO、完整用户管理 UI 和 baseservice 后端是后续组合计划；当前基础已有登录/API Key/业务审计，不声称完整基础系统或产品迁移已完成。
