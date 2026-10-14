# 默认页面 adapter 的服务前置

本页只用于选用 xui 默认 HTTP client/页面 adapter 时核对服务前置。xui 提供通用组件与公开组合；宿主拥有业务 API、领域数据、业务 UI 和产品流程。采用通用组件不要求所有业务 API 统一到 commons/webfacade。宿主可通过 typed ResponseAdapter、ErrorResponseAdapter、ApiKeyAdapter 或 BusinessLogLoader 连接明确的领域接口；业务 API 迁移由宿主另行决定。通用边界见 [DESIGN](DESIGN.md#规范强度与职责)，组件层次见 [IMPLEMENTATION](IMPLEMENTATION.md#组件层次与扩展原则)。

| 选用能力 | 默认连接 | 服务前置与合同 owner |
| --- | --- | --- |
| HTTP ajax / webfacade query | createHttpClient、serializeWebfacadeQuery | 明确 AjaxResponse success/message/payload/request_id/code/redirect 与 endpoint 页基数、上限、filter/sort codec；HTTP 状态和业务成功分开。响应模式、错误适配、列表三态及显式 ID 编码见 [HTTP](HTTP.md) |
| ConfigurableLoginPage/createLoginPage | createAuthClient；POST `/api/v1/auth/login`、`refresh`、`logout`，GET `/api/v1/auth/session` | 固定 Bearer v2 DTO；access 仅内存，同源恢复 Cookie 与 session Bearer 分离。宿主注册 route、CSRF 和资源策略；不猜旧路由或仅改 baseURL。见 [AUTH](AUTH.md) |
| ApiKeyManager/createApiKeyManager 的默认 HTTP adapter | createApiKeyHttpAdapter；`/api/v1/api-keys` 及 capabilities/update/revoke/record 路径 | 严格 DTO v2、AjaxResponse/ListData，服务提供权限、期限、独立确认、expected_version CAS 与一次性 secret。未知结果普通列表核验一次，不重发写请求。完整路径、能力和 fixture 见 [API_KEY](API_KEY.md) |
| BusinessLogExplorer/createBusinessLogExplorer 的默认 HTTP loader | createBusinessLogHttpLoader；GET `/api/v1/business-logs` 与 `/{id}` | 明确 offset query/ListData 与必需 total，公共记录字段、版本化授权 payload；服务负责身份/tenant、权限和脱敏。领域 cursor loader 依自己的明确合同，不伪造 snapshot。见 [BUSINESS_LOGS](BUSINESS_LOGS.md) |
| StructuredLogExplorer/createStructuredLogExplorer | 宿主声明 endpoints 的四操作 facade | 独立程序错误观察；服务实现明确 DTO、过滤、cursor、详情授权与保留期，不推断已有后端。见 [LOGS](LOGS.md) |
| AuthPage/AdminSetupPage、MenuLayout、布局、表格、字段与弹层 | 公开数据、props/parts/slots/controllers 与 callbacks | 业务 API、权威状态、路由、权限、查询范围和执行归宿主；无通用后端路由要求。管理员初始化见 [AUTH](AUTH.md#管理员初始化页) |

选用默认 adapter 时严格满足其准确合同，不猜 data/token/items 或自动尝试路由；标准 OAuth2/OIDC/SAML 与第三方接口继续遵循各自标准，在宿主明确边界转换。平台 API Key 是自身签发凭据，业务日志是自身业务记录，不能由 provider key、第三方响应或程序故障记录改名替代。

baseservice 的 authenticationservice/webfacade、apikeyservice/webfacade 与 bizlogservice/webfacade 提供配套边界；采用项目仍须核对实际版本、注册路由并提供身份、tenant、授权、CSRF、事务与脱敏。共享 fixture 和合成消费者只验证约定的 wire，不能证明产品已集成或部署；实际已跑与未跑范围见 [VALIDATION](VALIDATION.md)。
