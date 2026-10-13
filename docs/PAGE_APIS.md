# 公共页面 API 与原生协议总索引

xui 的目的包括统一品牌、前端体系与通用前后端接口。采用项目主动使用统一 commons/webfacade 处理自有普通业务API，不长期保留另一套响应、查询或错误协议。这里列出页面所需合同、默认实现与后端前置条件；视觉规则仍只来自 [DESIGN](DESIGN.md)，原子/组合/页面分层见 [FOUNDATION](FOUNDATION.md#组件层次与扩展原则)。

行业标准/第三方优先边界见[DESIGN](DESIGN.md#规范强度与职责)。下面固定facade只针对自有普通业务API；OAuth2/OIDC/SAML按标准，第三方按其API/错误格式，在宿主内部adapter明确转换，不强制外部AjaxResponse。平台API Key是自身签发凭据，业务日志是自身业务记录，两者不能由provider key、第三方响应或程序故障改名替代。

## 已读取的真实原生定义

此前基线通过普通 Git 只读核对 httpx@`71f05d5b635643313d5e1820f4a6bf1f61300f8e` 的 [models.go](https://github.com/coffeehc/httpx/blob/71f05d5b635643313d5e1820f4a6bf1f61300f8e/httpxcommons/models.go) / [utils.go](https://github.com/coffeehc/httpx/blob/71f05d5b635643313d5e1820f4a6bf1f61300f8e/httpxcommons/utils.go)，以及 commons@`d8769b84b7f7796f4a8a64fdc6f0e5ec566bd541` 的 [query.go](https://github.com/coffeehc/commons/blob/d8769b84b7f7796f4a8a64fdc6f0e5ec566bd541/webfacade/query.go) / [utils.go](https://github.com/coffeehc/commons/blob/d8769b84b7f7796f4a8a64fdc6f0e5ec566bd541/webfacade/utils.go)。该基线当时未修改这些包；本轮统一迁移目标与新列表合同见 [LIST_PAGINATION](LIST_PAGINATION.md)，不再把旧双 owner 作为新接入目标。

- 冻结基线的 httpx JSON 为 `AjaxResponse{success,message,payload,request_id,code,redirect?}`；旧列表为 `ListData{list,total}`，Go nil list 可为 null。新 commons/webfacade 的标准 list 为数组、total/next_cursor 可选，末页 null 与未声明缺省严格区分；xui 继续兼容旧带 total 的 payload。code 是 int64，成功 helper 接收调用者指定的 code，没有包级统一成功常量。xui 的默认 HTTP 与页面 facade 统一以 success=true 判定业务成功；code 仍必须为安全整数并保留为业务元数据，成功值无需固定为1。共享 fixture 中的 code=1 只是示例，不是额外成功条件。
- webfacade 原生 URL 查询为 page_index/page_size/return_total、字段值、sort 与 sort_<field>；endpoint 显式声明页码基数、限制和 FieldDefined。没有全局页大小，也不接受任意 JSON query AST。以下默认 facade 选定基数0/最大200，按接口声明使用原生 ParseQuery/ParsePageQuery。
- webfacade 默认 Time codec 不是 RFC3339Nano。业务日志的 since/until 保留纳秒，后端须声明 FieldDefined.Convert，可用原生 GetTimeFormQuery 配合 time.RFC3339Nano；不能偷偷降精度或更改 commons。
- HTTP状态与AjaxResponse业务success是两层事实，code是业务元数据，不要求全200。SendError/SendErrors/SendErrorWithRedirect明确设置传入的statusCode；SendSuccess的JSON分支不另重设status，成功code由调用方传入。旧 commons/webfacade 的 PBResponse 与 AjaxResponse 曾为独立实现；统一迁移由 commons/webfacade 的新响应 owner 收口，保留明确编码边界，不让 xui 根据字段猜 JSON/protobuf。
- 没有额外通用 JSON 请求 envelope：业务请求是声明的 JSON DTO或原生 URL query。路由、payload DTO、权限和 cookie 行为由具体应用合同规定；它们不是原生包中已经存在的服务。

## 页面、默认 HTTP facade 与前置条件

| 页面/组合 | 公共接入与标准路径 | 原生协议与业务前置 |
| --- | --- | --- |
| ConfigurableLoginPage/createLoginPage | createAuthClient；POST /api/v1/auth/login、refresh、logout，GET /api/v1/auth/session | 原生 AjaxResponse；严格 Bearer v2，access仅内存，恢复Cookie只用于refresh/logout，session只接受session Bearer；baseservice authenticationservice/webfacade配套，宿主注册route与CSRF/资源策略，详情见 [AUTH](AUTH.md)。xAgent现有bearer/token/me/state尚不满足，不能说登录页没有合同，也不能直接换baseURL假装已集成 |
| ApiKeyManager/createApiKeyManager | createApiKeyHttpAdapter；GET /api/v1/api-keys/capabilities，GET/POST /api/v1/api-keys，POST /api/v1/api-keys/{id}/revoke，DELETE /api/v1/api-keys/{id}/record | 原生 ListData + AjaxResponse、webfacade页查询；配置/权限/有效期/独立授权确认、metadata/可选访问待保存bool与一次性secret、明确操作确认；未知写入跨视图保护，恢复须新list及宿主权威终态，默认adapter不猜核对endpoint。后端须真正提供访问密钥管理，不能把上游供应商凭据配置改名接入。详见 [API_KEY](API_KEY.md) |
| BusinessLogExplorer/createBusinessLogExplorer | createBusinessLogHttpLoader；GET /api/v1/business-logs，GET /api/v1/business-logs/{id} | 默认原生webfacade offset查询/ListData；公共业务记录字段与授权payload，真实服务负责权限/tenant/脱敏。没有强制或伪造snapshot。不存在业务日志接口时记录前置缺口，不把程序故障记录当业务行为。详见 [BUSINESS_LOGS](BUSINESS_LOGS.md) |
| StructuredLogExplorer/createStructuredLogExplorer | 已声明四操作DTO/facade，endpoints由宿主明确 | 独立程序错误观察，仍按 [LOGS](LOGS.md)；不能用它代替业务日志，也不宣称对应后端已存在 |
| MenuLayout、公共布局、表格、字段与弹层 | 公开数据/props/parts/controllers，无业务路由默认值 | 普通需求组合公开能力；业务API、授权、筛选范围和执行属于业务层，不用组件内部DOM或私有皮肤接入 |

默认HTTP adapters已实现；对应baseservice的 [apikeyservice/webfacade](https://github.com/coffeehc/baseservice/tree/main/apikeyservice/webfacade) 与 [bizlogservice/webfacade](https://github.com/coffeehc/baseservice/tree/main/bizlogservice/webfacade) 提供API Key与业务日志HTTP边界。宿主注册路由并提供真实身份/tenant、授权配置和脱敏投影；登录、会话及用户管理仍归宿主或身份提供方，不是baseservice后续待办。xui现有登录组件与API不变。

双方消费逐字节一致的 [page-contracts.v1.json](../tests/fixtures/page-contracts.v1.json)：xui通过默认HTTP adapters校验，baseservice通过HTTP handlers校验。API Key提交未知统一为HTTP503、原生success=false/code=50301/payload=null，不包含secret；已提交但后处理失败单独使用HTTP503/code50302/message=committed_followup_failed/payload=null，不声称回滚；xui防御这两个码被HTTP200/4xx包装时也保持阻止重放。默认adapter和baseservice facade均没有伪造核对endpoint或持久operation receipt；List不具备提交核对权威，详见 [API_KEY](API_KEY.md)。

实际可调用性和实测结果以最终提交的 [PUBLIC_API](PUBLIC_API.md)、声明及正式打包消费为准。共享合成合同通过不代表产品已注册这些路由或生产鉴权/tenant/脱敏已集成。

## 必须遵循与允许扩展

必须统一：预构建品牌CSS/主题owner；公开组件结构与可访问性/动效；原生HTTP envelope/query/error字段；固定页面facade与版本、明确预算/取消/失败/不重放写操作；必要权限/tenant/脱敏及真实后端前置。HTTP默认反馈安全，结构化业务错误仅显式处理，不能全量日志/弹窗显示敏感响应。

可扩展：领域 DTO/payload、授权业务动作、菜单/路由、受信任 renderer、公开props/slots，以及后端明确注册的 FieldDefined/Convert。typed loader/adapter连接领域能力，不授权另造永久通用协议。旧协议桥梁须列出真实来源SHA、准确字段映射、功能与权限保留、目标原生合同和移除条件；不能默认猜data/token/items或自动尝试路由。

当前用户确认仅xAgent正式上线，其升级兼容与持久数据影响须在该项目单独授权评估。未发布项目直接标准化，不新增旧接口/配置/模型升级层；代码演进不授权删除生产数据、重置运行或部署。采用项目应在自身授权范围同步后端标准化。本次只对齐xui和baseservice已有API Key/业务日志能力，不修改产品或commons，不增加登录/用户管理服务，不发布包或部署。
