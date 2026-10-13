# 可配置登录页与 Bearer 会话合同 v2

`ConfigurableLoginPage` 和 `createLoginPage` 共享一个 `createAuthClient`，保持现有默认主题、布局、扩展、密码清理和安全回跳。这个自有应用合同配套 baseservice authenticationservice/webfacade；不是 OAuth/OIDC token endpoint，不替换第三方标准协议，不表示任何业务项目、生产登录链或部署已迁移。

## 固定 HTTP 合同

`createAuthClient({http, protectedPaths, timeoutMs, idEncoding})` 绑定宿主已有 `createHttpClient`。同一 transport 只能有一个认证 owner；不创建并行 fetch、token store 或第二个401拦截器。认证预算默认15秒。地址始终为根路径，不附加 baseURL 的路径、不猜 token/me/state 等旧路由。

| 操作 | 固定端点 | 请求凭据 | 成功 payload |
| --- | --- | --- | --- |
| login | POST /api/v1/auth/login，JSON username/password | 无 Authorization，credentials:same-origin | IssuedSessionV2 |
| refresh | POST /api/v1/auth/refresh，JSON {} | 无 Authorization，仅恢复 Cookie，credentials:same-origin | IssuedSessionV2 |
| currentUser 的 session 核对 | GET /api/v1/auth/session | session access Bearer，credentials:omit | AuthSessionV2 |
| logout | POST /api/v1/auth/logout，JSON {} | 无 Authorization，仅恢复 Cookie，credentials:same-origin | null |

以上请求统一 `Accept:application/json`、写入 `Content-Type:application/json`、`cache:no-store`、`redirect:error`，无自动重试。成功外层严格采用 httpx `AjaxResponse`：success/message/payload/request_id/code；业务成功仍由 success=true 决定，code 为安全整数。HTTP状态与业务码分开，不猜 data/msg 等别名。

AuthSessionV2 = `{schema_version:2,user:{id,username,display_name}}`。
IssuedSessionV2 在上述字段之外恰有 `access_token`、`token_type:"Bearer"`、`expires_at`。该含秘密 DTO 的解析器不公开；login/refresh 返回值只有 user。`parseAuthSession` 只接受无 token 的 session DTO。

用户 id 默认是正十进制 int64 字符串；`createAuthClient({http,idEncoding:"hex"})` 与 `parseAuthSession(value,"hex")` 可明确选择小写无前缀/前导零 hex。两者范围均为正 int64，不得转JS number；未知编码立即拒绝。详见 [共享实体编码](IDENTITY_ENCODING.md)。username 非空、最多128 UTF-16单元；display_name 为null或最多256单元。拒绝额外字段、getter、旧版本、角色/权限/tenant投影。`access_token` 使用 `<prefix>-v1-sha256-access-<secret>`：prefix 为 `[a-z][a-z0-9]{0,31}`，secret 是32字节随机值的43字符规范无padding base64url。客户端仅接受 v1、sha256 和 access 类型的结构；服务端仍按配置前缀、凭据记录及 scope 校验，不能凭标识直接授权。此处 v1 是凭据格式版本，与 HTTP DTO 的 schema_version=2 分开；sha256 是高熵凭据摘要算法，不是密码算法，也不表示 JWT。新基线不接受旧无版本格式。expires_at 为尚未到期的UTC RFC3339；服务器默认access寿命5分钟，可由后端显式配置，不将JWT解码结果当作服务端权限。

用户名提交前trim；密码不trim且最多4096字符，只在POST body使用，不进入回调、URL、storage、日志或state。返回的 identity 不是授权决策依据。

## 一个内存 owner 与显式保护端点

先创建共享HTTP，再创建auth，例如：

```ts
const http = createHttpClient({baseURL: location.origin});
const auth = createAuthClient({http, protectedPaths: ['/api/v1/orders/', '/api/v1/profile']});
await auth.currentUser();
```

protectedPaths是精确路径，或以斜杠结尾的子树前缀；只接受规范根相对路径，不能带query/hash/URL/百分号。`/api/v1/orders/`不会匹配`/api/v1/orders-other`。HTTP首先规范化请求URL并校验同配置origin；认证owner拒绝歧义编码路径与直接绕过owner调用固定auth端点。前端路径表只是防止发送凭据到错误端点，后端仍必须独立校验route policy、身份、资源和权限。

声明的业务端点集中注入 `Authorization: Bearer <access>`，强制 `credentials:omit`、`redirect:error`，拒绝调用方覆盖或generic retry。已有静态headers/getHeaders/单请求headers若混入Authorization、Cookie或X-API-Key，发送前报安全错误，不静默覆盖第二凭据。CSRF及其他非秘密宿主header仍合并。未声明公共端点不会收到本owner的access。请求及非空Response.url都校验目标origin；自定义fetch必须真正遵守redirect:error，不能在内部透明改目标。

本owner只持有session access。API Key供Agent/集成使用，不从登录页签发或保存为会话；不要把API Key注入这个session owner。后端session scope是当前用户权限；API Key scope是当前用户权限∩key grants，受固定namespace用途和host资源策略约束。相同Bearer语法不意味着相同scope，session endpoint只接受session credential。

access和expiry只存在闭包内存，public AuthState、login/refresh/currentUser返回值、广播、日志和缓存没有token。禁止localStorage/sessionStorage/URL/共享channel存token。owner销毁后原managed routes继续失败关闭；新owner使用新HTTP实例。销毁auth不等于服务器logout。

## 恢复、401与并发

公开接口为 `getState/subscribe/currentUser/refresh/login/logout/cancel/expire/destroy`。state仅有status、user、busy、safe HttpError和 `reauthenticationRequired`，不暴露secret/expiry。

- 新页面第一次currentUser先进行一次cookie refresh，再以新access调用session核对。缺失/过期恢复凭据401是正常anonymous，后续不会循环bootstrap。这支持现有默认整页location.assign；目标页同样先连接owner并currentUser。没有把默认导航强制改SPA。
- access到期或将到期时，只在业务请求需求发生后refresh，不做后台keepalive。
- 已发送业务请求的401只对它使用的access generation失效，合并一个refresh；原业务请求仍拒绝401，绝不自动重放写入。旧代迟到401不会清掉较新login/refresh结果。403不触发refresh，不变成“未登录”。若宿主要重读，必须明确是幂等读，由该领域owner最多重试一次；该auth owner禁止generic retry。
- 同tab refresh和session核对singleflight。取消一个调用者的signal仅撤销该等待者，不取消其他等待者共享的刷新。显式auth.cancel/destroy才取消owner执行并抛弃迟到结果。
- login/refresh/logout按本地队列串行；支持Web Locks的浏览器还按同origin锁跨tab串行。logout先清本地access，等待已在途refresh完成后使用浏览器最新恢复cookie撤销整个family。新login/退出意图阻止旧请求恢复旧identity。
- BroadcastChannel只发 `{kind:login|refresh|logout,epoch}`，不发token或user；localStorage的`xui.auth.v2:<origin>:epoch`仅保存epoch/identityEpoch/kind安全排序元数据，拒绝迟到旧广播覆盖较新登录，不保存任何用户或凭据。login/logout通知清理其他tab旧身份；refresh不废掉有效兄弟access。无Web Locks/广播、同源其他非xui客户端、网络丢响应和延迟Set-Cookie不承诺无缝恢复，由后端非破坏性409和显式重新登录处理。

不要保留旧 `onUnauthorized:()=>auth.expire()` 作为第二个失效owner。managed Bearer由auth按generation处理401；宿主订阅认证变化并清理所属resource、私密草稿、连接和业务缓存。HTTP onUnauthorized可观察事实，但不要在其中再次清理/触发refresh或重放。

## 不确定结果与重新登录

| HTTP / code | 含义 | 前端行为 |
| --- | --- | --- |
| 400 / 40001 | 无效认证请求 | 显示安全错误 |
| 401 / 40101 | 无效/过期/撤销/错误用途/登录拒绝 | session/refresh匿名；login拒绝可保留之前已确认会话 |
| 403 / 40301 | 已认证但kind/scope/resource被拒绝 | 不刷新、不重放 |
| 409 / 40901 | 旧恢复凭据已消费，refresh竞争 | 不清cookie、不撤family，要求重新登录验证 |
| 429 / 42901 | 限速 | 不自动重试 |
| 503 / 50301 | mutation提交结果未知 | 不重发、不签发、不清cookie、不假称退出 |
| 503 / 50302 | 已提交但后续失败 | 不假称回滚，同样要求重新登录验证 |
| 503 / 50300 | 依赖不可用 | 保留失败事实 |

任何refresh失败（除明确401）、不确定login/logout、网络丢响应、执行取消或超时都会清access并设unknown + reauthenticationRequired。此时currentUser/refresh/业务请求不会再盲试cookie；页面显示“请重新登录验证”，不提供会触发重复rotation的“核对会话”。新的显式login才能建立安全新会话。取消一个共享等待者不等于执行取消，不能污染成功的其他等待者。

本轮不实现KMS/加密秘密重放回执，网络丢失rotation响应可能必须重新登录。JS不能撤回已执行Set-Cookie，不能从HttpOnly cookie读取秘密，不能将失败logout宣称安全退出；也不使用logout作为refresh失败的补救动作。服务端的current family/revocation事实才是最终依据。

## Cookie、CSRF与后端责任

恢复cookie名 `__Host-baseservice-refresh`：HttpOnly、Secure、SameSite=Strict、Path=/、无Domain；只有后端明确development-only insecure模式才使用 `baseservice_refresh`。重复/替代名cookie、Cookie/Header混用、legacy会话cookie、错误purpose或API Key不能作为session/refresh fallback。

Cookie mutation必须在外层事务确认后才发送新secret/Set-Cookie；unknown/postcommit失败不得签发或清cookie。logout缺cookie幂等成功；已消费旧cookie409不得清cookie或撤销仍有效family。family默认绝对8小时、空闲30分钟；账户禁用、密码变更/会话撤销必须使family失效，重新启用不能复活旧family。

包括login在内的所有cookie写入需要后端严格CSRF：baseservice由宿主Options.CSRF精确校验Origin，可结合Fetch Metadata和缺header策略；JSON Content-Type仅为辅助，配套准确CORS、限速及枚举防护。本合同不新增自定义CSRF token/header。前端same-origin credentials和JSON并不提供完整CSRF保证。当前默认owner只支持同源cookie恢复；不自动开启跨origin include，也不读取/制造CSRF token。标准OAuth/OIDC/SAML仍由宿主按标准流程集成。

## 完整页面与扩展保持不变

配置产品名称、标题、说明、可选logo、文案、safe returnTo；默认fullscreen与显式card沿用[DESIGN](DESIGN.md)。主题复用已有owner，登录页不增主题选择器或持久化副本。React和原生布局保持已有的窄屏/200%文字/焦点安全空间与错误区；不改主题、DataTable、菜单或业务页面。

没有onAuthenticated时，登录成功和Continue仍用经过 `resolveLoginReturnTo` 的根相对location.assign。回跳拒绝规范化及多次解码后的外部路径、控制字符、双斜杠、默认/login循环；去fragment与明确密码/token/code/api_key等query。其它自定义登录路由或含秘密业务query仍由宿主验证。

`extensions.beforeSubmit/actions/errorLabel` 和beforeFields/afterFields仍只接收username与AbortSignal，不接收密码/token/原始响应。宿主标准SSO、服务地址与账户来源保留同一认证owner。重复提交、扩展取消、迟到导航和密码节点清空仍受页面generation控制；修改真实服务由产品安全策略决定。

## 验证与采用

[共享wire fixture](../tests/fixtures/contracts/auth.v2.json)与[baseservice 0f5dba4](https://github.com/coffeehc/baseservice/blob/0f5dba4392279ccf85bba262ae4f453ea57bd579/docs/contracts/auth.v2.json)固定字节一致（配套[后端合同](https://github.com/coffeehc/baseservice/blob/0f5dba4392279ccf85bba262ae4f453ea57bd579/docs/bearer-auth-v2.md)），含issued/session/logout和8类错误。unit覆盖严格DTO/凭据隔离/恢复/多401/旧代响应/取消等待者/refresh-logout排序/不确定结果/不重放。正式React与原生消费者只用公开入口和tarball。浏览器测试覆盖原生整页导航恢复、Cookie/Authorization隔离、跨tab锁与安全通知；是否真正执行成功看[凭据格式验证记录](CREDENTIAL_FORMAT_VALIDATION.md)（早期会话机制记录见 [AUTH_V2_VALIDATION](AUTH_V2_VALIDATION.md)）。

xAgent旧token/me/state协议不会仅改baseURL就兼容；已上线消费者需要单独授权迁移，未发布项目直接采用明确新合同。产品对外hex ID使用已提供的显式 idEncoding，并与后端 facade 同步配置，不自动接受双格式。注册、密码重置、用户生命周期和业务资源策略由实际后端/身份提供方负责。本轮不改业务项目、不部署、不生成真实凭据。
