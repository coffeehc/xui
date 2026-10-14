# HTTP、响应与分页查询接入

这是实现接口；完整通用规则只在 [DESIGN.md](DESIGN.md)。从 runtime/http、runtime/query 导入，React/原生使用同一无框架类型。React 复用 useResource/DataRegion/ErrorState，不创建第二套请求 owner。

选用 xui 默认 HTTP 解析与页面 adapter 时的合同范围及行业标准/第三方边界见[DESIGN](DESIGN.md#规范强度与职责)。OAuth2/OIDC/SAML保持标准，第三方按其API、HTTP状态及错误格式；端点明确response/errorAdapter在内部投影。标准OAuth2非2xx的error discriminator可由显式allowlist ErrorResponseAdapter映射，不能用 nested-error adapter 猜其结构，也不要求OAuth2返回AjaxResponse。

## 固定源码合同

通过正常 Git 读取的来源：

- [httpx@71f05d5 models.go](https://github.com/coffeehc/httpx/blob/71f05d5b635643313d5e1820f4a6bf1f61300f8e/httpxcommons/models.go)：AjaxResponse 为 success/message/payload/request_id/code/redirect；IsSuccess() 只返回 Success，Code 为无 omitempty 的 int64；该旧版本 ListData 为 list/total；新统一 owner 与可选字段合同见 [列表合同](HTTP.md#列表元数据与受控游标分页)。
- [同提交 utils.go](https://github.com/coffeehc/httpx/blob/71f05d5b635643313d5e1820f4a6bf1f61300f8e/httpxcommons/utils.go)：SendSuccess 的 code 由调用者传入；错误 success=false、payload=null，request_id 可能为空。
- [xagent@29139f7 成功调用](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/internal/services/apiserver/workgroup_endpoint.go) 与 [middleware](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/internal/services/apiserver/middlewares.go)：这里使用成功 code=1，X-Request-ID 单独返回；401/403 是不同 HTTP 事实。只读引用，没有改产品。
- [commons@896d1e7 query.go](https://github.com/coffeehc/commons/blob/896d1e7a80ec902cfdf739f67a82b7f49aa2b403/webfacade/query.go)、[query_test.go](https://github.com/coffeehc/commons/blob/896d1e7a80ec902cfdf739f67a82b7f49aa2b403/webfacade/query_test.go)、[select.go](https://github.com/coffeehc/commons/blob/896d1e7a80ec902cfdf739f67a82b7f49aa2b403/dbsource/sqlbuilder/select.go)：URL query；pageIndexOffset/maxPageSize 由接口决定。ParsePageQuery 无全局默认大小；BuildQuery 的缺省 30 和 AppendLimit 的 size=0 不分页也不是所有接口通用约定。

公开类型以 [http.ts](../packages/runtime/src/http.ts)、[query.ts](../packages/runtime/src/query.ts) 和正式构建声明为准，不另复制类型定义，不按旧 data/msg/items 别名猜测兼容。

HTTP状态表达传输/请求事实，AjaxResponse的success表达业务成功与否，code保留业务元数据。独立httpx/httpxcommons的SendError、SendErrors和SendErrorWithRedirect设置c.Status(statusCode)；SendSuccess的JSON分支不重设status且code由调用者指定。因此不是放弃HTTP状态或全200合同。xui支持2xx业务失败，非2xx仍是HTTP错误并保留合法code/request_id。commons/webfacade的PBResponse与SendPBError是另一实现，不能混同上述JSON合同；不同编码由 endpoint 明确选择。

## 单一传输与生命周期

createHttpClient 配置 baseURL、fetch、headers/getHeaders、默认 response/adapter、timeoutMs/credentials、onUnauthorized/onError。baseURL 必须无 URL 凭据、为绝对 HTTP(S)；request 必须同源，各后端可各建客户端。ESM 导入不发请求、不读 DOM。裸HTTP transport不保存token、storage、cache或路由；headers/provider来自宿主。绑定[Bearer v2认证owner](AUTH.md)后由该owner私有内存持有session access，显式protectedPaths业务请求强制Bearer/omit/error，固定cookie端点无Bearer/same-origin；禁止手动第二凭据、重试/redirect/credentials覆盖。

request(path,options) 接收 method、headers、body 或 json、signal、timeoutMs、response/adapter/errorAdapter、endpointId、retry、detectAjaxErrors、credentials/cache/redirect。json:null 合法，json/body 不同时指定。默认 GET/same-origin credentials；Ajax/JSON 缺省 Accept: application/json，避免不明确的 protobuf 协商；json 补 Content-Type，FormData 不补 boundary。headers 合并顺序为 client→provider→endpoint。endpointId 是短逻辑标识，只含字母数字/点/下划线/冒号/连字符，不能传 URL。

按DESIGN，普通请求默认30秒、blob下载默认120秒；宿主可以明确覆盖预算。预算包含 provider、fetch、完整 body、adapter 和重试等待。取消/超时即使遇不合作 producer 也结束本地等待，不能证明服务端已停止，因此不能据此重放写操作。destroy 取消在途任务，销毁后 request 为 cancel；宿主同步释放 resource 与订阅。

## 模式与响应

| response | 行为 |
| --- | --- |
| ajax（默认） | 严格 JSON AjaxResponse；HTTP 2xx + success=true 即成功，不要求固定 code；payload 原样返回，null/0/false 合法 |
| json | 整个 JSON 值作为 payload，不猜 Go/OAuth/SCIM 形状 |
| text | 返回文本，不运行 JSON 解析 |
| blob | 返回 Blob，普通 JSON 文件合法 |
| empty | 明确无返回值，取消不需要的 body，payload=undefined；适用于声明的 204/裸状态接口 |

AjaxResponse 的 success 必须为 boolean，message/request_id 必须为 string，payload 必须存在，code 仍为必填安全整数，redirect 若存在必须为 string；不省略、不转换 code，也不接受字符串码或精度丢失。success=false 在任何合法 code 下都为业务失败。JSON 空 body/HTML/缺字段为 parse 错误，不默认为成功；204 在 ajax/json 仍不满足合同。非 2xx 保留 HTTP 事实，解析失败不把 401/403 隐藏成 parse/network；失败状态 body 超时记录 http/readFailure=timeout。

createHttpClient 的默认 ajax 模式、ajaxResponseAdapter 与 createAjaxResponseAdapter() 共用 success 判定，code=0/1/2 或其他合法整数均不会把 success=true 改判为失败。仅端点确有额外严格合同才显式使用 createAjaxResponseAdapter({successCode})：此时同时要求 success=true 且 code 与指定值相等；不传 successCode 不启用码值限制。普通消费者不需要配置成功码或另写 parser。ResponseAdapter 接收未知解码值和 status/headerRequestId/endpointId/attempts，返回 payload 和可选 code/bodyRequestId/redirect；缺 payload 的结果被拒绝。客户端 adapter 属于默认模式，endpoint 明确换 response 模式时不继承不同模式的 adapter，也可提供 endpoint adapter。

响应为 payload/status/code/requestId/bodyRequestId/headerRequestId/redirect；非空 body id 优先 header，两者都保留，不伪造 traceId。redirect 只是数据，不触发应用导航。成功响应headers仅为冻结的contentType/contentDisposition/contentLength，超过长度或含控制字符的值为null；没有原始Response、完整Headers或请求对象，Authorization/Set-Cookie/WWW-Authenticate不会暴露。领域校验只在一次声明的 endpoint adapter；标准请求不把 null 改成其他字段。

requestDownload默认120秒与detectAjaxErrors:true，保留HTTP200原生Go失败envelope检测；HttpClient 的 blob detectAjaxErrors 与默认 JSON AjaxResponse 复用同一 success 判定，合法 success=true/code=0/1/2 等仍返回原始 Blob，并在 HttpResponse 保留 code/request id/redirect 元数据，不拆包成 payload。success=false 的合法 envelope 是业务失败；明确attachment的JSON文件保持文件，不猜为错误。resolveDownloadFileName优先UTF-8 filename*，处理引号/重复参数/无效编码并清理路径、控制字符与方向控制字符；不是文件内容安全检查。saveDownload只在宿主明确用户动作中调用，临时link和URL释放且不改焦点。下载不是JS读取认证头的理由。无流式/SSE/WebSocket/protobuf、上传进度、断点续传或文件安全校验支持声明，这些协议另行明确接入。

## 安全错误、认证与重试

HttpError.kind 为 cancel/network/timeout/http/parse/business；metadata保存status、number/string业务code、两种request id、endpointId、attempts、retryAfterMs/readFailure。HttpError.business提供显式结构化code/message/requestId，details仅在声明安全投影时存在；它不进入默认Error.message、toJSON或JSON.stringify，界面仍默认用固定安全文案。默认 message/getHttpErrorMessage 是安全固定文字，不包含 native fetch 敏感 URL、后端 message、body、headers 或 cause。领域反馈按 code 显式映射，不能直接把未知 Error.message 放入 Toast；后端仍须保证 request id 可公开展示。

onError 可一次绑定宿主反馈，cancel 不调用；交给 onUnauthorized 的 401 不重复调用 onError。同步抛错/异步拒绝不改变 HTTP 事实。必要错误同时在页面 ErrorState 可见，不能只放消失通知。

onUnauthorized 只响应实际 HTTP 401，收到响应头即通知，每个认证 epoch 至多一次；不按业务 code、403 或 redirect 跳登录。认证请求可以显式 unauthorized:"ignore"，既不通知也不消耗该 epoch 的全局 401 通知；[AUTH](AUTH.md) 用它将登录拒绝与会话核对留在认证上下文。ignore 的 HTTP 错误仍能交给 onError，宿主反馈可按 auth.* endpointId 避免重复。宿主确认新认证后 resetUnauthorized，旧 epoch 迟到 401 不再次失效新认证。裸HTTP不刷新token、不决定登录路由、不重放请求；绑定v2 auth后managed 401按token generation刷新但原业务请求仍抛401，不重放写入，403不刷新。移除旧onUnauthorized=>auth.expire重复失效逻辑；宿主认证切换时还应取消旧resource/key。

默认完全不自动重试，GET 也可能有副作用。只有显式 retry:{idempotentRead:true,maxAttempts} 的无 body GET/HEAD 能有限重试，maxAttempts 1–5；写方法和一次性 body 的 opt-in 在发送前拒绝。默认重试 network/429/502/503/504，绝不自动重试 401/403/business/parse/cancel/普通 timeout。delayMs/maxDelayMs 可配置，默认退避 250ms/最大等待30s；Retry-After 不提前缩短，超上限直接保留失败。signal 和整体预算覆盖退避；按钮重试仍须确认操作可重试。

## webfacade URL query 与 ListData

WebfacadeQuery 提供 page_index/page_size/return_total、filters、按优先级排列的 sort；WebfacadeContract 每接口显式 pageIndexOffset，可选 maxPageSize、filterFields codecs、sortFields 白名单，没有全局页码或上限。page_index 是 wire 值；示例将 1 基 Pagination 页码显式转换为 `page - 1 + endpoint.pageIndexOffset`。

serializeWebfacadeQuery 返回 URLSearchParams，仅编码一次；排序为 sort=name,created 与 sort_name=asc/sort_created=desc。没有 JSON/SQL AST、真实数据库列名或运算符。后端 start_id/FieldDefined 的附加排序/条件仍由具体接口定义。

filters 只能用声明字段和显式 codec。queryCodecs 为 string/int64/number/boolean/int64Array/time；不自动转换 Date/数组/对象。int64 可保留有范围校验的十进制字符串/BigInt；number 必须有限；time 必须 YYYY-MM-DD HH:mm:ss 并验证日历，不改成 ISO/millis。自定义 Convert 用明确 codec。null/undefined/空值清除，literal "null"/"undefined" 拒绝，避免后端静默跳过；保留参数和 sort_* 不作为字段，未知过滤/重复排序/无效方向拒绝。

existing params 复制后清除旧受管过滤/排序和无语义 field，保留宿主无关参数。page_size 是正 safe integer，page_index 不低于 endpoint offset，可选上限超限拒绝，不能默默改接口行为。

列表解析使用 parseListData/toListPage，保留 total 与 next_cursor 的缺省、null 和实际值；精确规则集中于 [列表元数据与受控游标分页](#列表元数据与受控游标分页)。

请求 cursor 的参数名、合法排序和 token 约束仍由 endpoint 明确声明；现有 serializeWebfacadeQuery 仍只序列化已发布的 offset query，不擅自添加 cursor 参数或兼容猜测。已有 API Key 全量读取与业务日志 offset adapter 明确请求并要求 total；缺失时失败关闭，而不是猜末页/无限抓取。业务日志领域 cursor 扩展合同另见 BUSINESS_LOGS，不混淆已有 page/snapshot 结构。


## 可运行接入

正式 [React 页面](../examples/http-react/app.tsx)、[原生页面](../examples/http-vanilla/app.js)/[HTML](../examples/http-vanilla/index.html) 共用 [typed endpoint model](../examples/shared/http-model.ts)，仅导入公开组件/工厂和 CSS。独立 tarball、types 与真实 fetch 由 [consumer](../scripts/consumers.mjs) 和 [浏览器检查](../tests/browser/http.spec.mjs) 验证。

根目录 pnpm build、pnpm test:consumer、pnpm preview 后访问 /http-react/ 或 /http-vanilla/；本地 /api/xui-example/records 是明确合成 fixture，页基数0/上限50不是产品默认合同，不访问真实后端。不请求 total 时 fixture 省略字段，双端示例显示未知并隐藏编号翻页，不以当前页 list.length 伪造 pageCount；需要游标使用 DataTable 的显式 cursor 模式。

接入先检查 headers/credentials、权限、缓存/去重、认证、日志、取消、上传/下载及业务恢复；保留必要行为，再收敛一个 transport/auth/error/resource owner。选用默认 ajax/query 或页面 adapter 时严格满足其 wire 合同；其它领域协议通过明确的 ResponseAdapter/ErrorResponseAdapter 接入，不猜别名、不要求全量业务 API 迁移。已有使用方的升级按 [发布状态原则](ADOPTION.md#发布状态与升级原则) 保留必要兼容与退出条件。

删除精确重复的 fetch 拦截器/认证跳转/Toast/loading owner；保留领域 API 作为一次 endpoint adapter。移除私造 query AST、隐式页码/日期/object 转换和重复编码。按 [采用手册](ADOPTION.md) 逐页迁移、真实构建验收，不先盲删业务权限/功能。

## 非2xx结构化错误适配

`createJsonApiErrorAdapter` 明确映射 `{error:{code:string,message:string,request_id:string}}`；不猜顶层 code/msg 或 JSON:API errors 数组。其它错误协议由宿主提供 typed ErrorResponseAdapter，按实际合同投影，不将正常领域适配视为必须删除的兼容层。业务 API 或后端迁移由宿主单独决定。

ErrorResponseAdapter可在client或单request明确配置；原生默认adapter保留Go字段，页面默认adapters显式选原生解析，并固定Accept:application/json及JSON写入Content-Type:application/json；保留其他宿主headers，不继承临时旧编码协议。HTTP status与业务code分开；任何body解析/投影失败保持HTTP事实和readFailure，不伪造成功。解码后结构化投影上限为64KiB JSON响应（当前先完整读取，非流式读取上限），message最多2048字符；details需显式allowlist投影，最多16KiB/depth8/512节点，拒绝函数/getter/prototype/cycle/unsafe整数。投影限制不等于后端脱敏；不能全量日志或直接弹出原始敏感响应。

401仍在收到响应头时按现有epoch通知，不能依赖该早期回调取得body code。需要按明确领域业务码判断失效时，显式unauthorized:ignore并由已有认证owner处理最终HttpError，不另造认证owner或吞掉401。跨origin下载需后端准确CORS与Expose-Headers允许Content-Disposition等所需字段；库不会绕过浏览器策略。

## 明确的原生应用origin与transport

createHttpClient({baseURL:'wails://wails/',nativeOrigin:'wails://wails',fetch:bridge})允许宿主显式声明hierarchical应用scheme/authority并注入原生fetch bridge。默认只接受HTTP(S)；自定义origin必须有host，不含URL凭据/query/hash或路径（空或/），拒绝http/https/data/blob/file/javascript/mailto作为nativeOrigin。原生同源按scheme、host、port三元组比对，绝不把不同自定义URL的origin=null当相同来源；所有目标再次拒绝凭据与外部tuple。

native请求强制redirect:error，拒绝follow/manual；bridge必须实际遵守不自动跟随/透明改目标。非空Response.url在读取body前再次校验同一tuple，302等非2xx保留HTTP事实，不追Location。Response.url可为空的合成/桥接响应需要宿主保证真实目标，库无法观察桥内部的物理IO。取消、budget、401 latch、adapter/error metadata、safe headers及下载继续使用同一HTTP owner，无模拟HTTP baseURL、JS色板或业务重放。

[合成测试](../tests/native-transport.test.mjs)覆盖wails://wails、不同host/scheme/port/凭据/返回URL/redirect、取消迟到、401状态与下载。Windows的HTTP(S)应用origin继续默认HTTP路径；Darwin/Linux自定义origin有新声明方式。三平台真实Wails窗口/bridge物理IO/Cookie/CORS/登录/下载尚未验，不能把合成fetch通过称作三平台兼容完成。


## 列表元数据与受控游标分页

### 默认列表合同与职责

以下仅约束 runtime/query 的 ListData 与默认页面 HTTP adapter；领域 loader 可按自己的 typed 合同发布真实分页事实。默认 AjaxResponse 的 success/code 语义不变，payload 为：

- list：数组；空结果为 []。xui 的已发布 parser 仍接受旧 httpx nil slice 的 null，只有显式 toListPage 才投影 []。
- total：可省略；省略表示未计算/未知，后端无需执行 COUNT。存在时为真实非负安全整数，包括真实 0；null、字符串与丢精度整数不被 xui 接受。
- next_cursor：可省略；非空、最多 4096 UTF-8 字节的 opaque string 表示下一次请求 token，null 表示 cursor 明确末页。字段缺失仅表示端点未声明 cursor 状态，不能当末页。可与 total 同时存在。

offset 端点可省略 next_cursor；cursor 端点每次明确给出 token 或 null。总数计算是 endpoint/查询 owner 的显式选择，组件与 parser 不发 COUNT、不强制每页计算、不凭当前数组长度推断总数或是否还有页。

使用默认 adapter 的服务应满足该明确合同；共享 fixture 不证明产品后端、生产 route 或数据库 COUNT 性能已验证。

### 公开前端入口

1. 从 @coffeehc/xui-runtime/query 导入 ListData、parseListData、toListPage，保留已有 HTTP/resource owner。HTTP envelope 的解析和成功判断不变。
2. ListData.total 从必需 number 扩为可选 number，next_cursor 为可选 string|null。直接使用 total 的 TypeScript 消费者需要处理 undefined；旧带 total 的 wire 与调用行为保持。
3. toListPage 的 total 为 number|null；returnTotal:false 仍不将旧占位数当真实总数，即使响应有数也投影 null。returnTotal:true 时缺失同样为 null；实际计算出的 0 原样保留。
4. toListPage 仅在 wire 存在 next_cursor 时返回 nextCursor。cursor adapter 必须检查 nextCursor !== undefined，再将 string|null 传组件；不得写 nextCursor ?? null 掩盖未声明状态。
5. 已有 offset DataTablePagination 不用改形状，显式 mode:'offset' 可选。采用 DataTableCursorPagination 时只传 pageSize/total/nextCursor/hasPrevious 与受控回调，见 [DataTable](DATA_TABLE.md)。历史与查询变化重置仍由已有宿主掌管，控件不解码 token、不假造页数。
6. 不需要总数的新列表默认选择不计算；需要总数的现有 offset 功能按其显式合同请求。Key 管理全量 adapter 仍要求 total 来验证完整读取，业务日志默认 offset loader 同样要求 total；缺失时拒绝，不能误切 cursor 或猜结束。
7. serializeWebfacadeQuery 不变：page_index/page_size/return_total 和 filter/sort 合同仍显式。具体 cursor 请求参数留 endpoint adapter；库不新增未经后端定义的通用 query AST。

新端点采用 [commons 的严格 ParsePaginationQuery](https://github.com/coffeehc/commons/blob/2fd78215cf5321b9dc9b12d5f02c90567ce3cc71/webfacade/pagination.go) 时，cursor 请求使用 page_size 与显式 return_total=false；首屏省略 cursor，续页将原 token 交 URLSearchParams 编码一次，不发送 page_index，也不把 null/空串序列化成 cursor。端点显式声明模式、页大小上限和过滤字段；旧 offset serializeWebfacadeQuery 与页基数合同不变。后端服务/存储必须实际跳过 COUNT，仅把算出的 total 从 JSON 隐去不算完成性能目标。


ACL/权限过滤后的有界扫描可以连续返回空 list 与非空 next_cursor；这仍可继续翻页，不保证下一页含记录，也不表示剩余数量。仅显式 null 表示 cursor 末页，DataTable 不因空行禁用下一页。宿主在成功后才提交 rows、cursor 和历史，失败/取消保留已确认事实，筛选与条数变化由同一查询 owner 重置历史。

共享 wire fixture 为 [webfacade-list.v1.json](../tests/fixtures/webfacade-list.v1.json)，固定来源为 [commons@2fd78215 的同一文件](https://github.com/coffeehc/commons/blob/2fd78215cf5321b9dc9b12d5f02c90567ce3cc71/webfacade/testdata/webfacade-list.v1.json)。它包含可选元数据、legacy nil slice 与非法响应，不代表真实业务服务完成迁移。实际执行范围见 [VALIDATION.md](VALIDATION.md)。

## 显式实体身份编码

从 `@coffeehc/xui-runtime/entity-id` 或根入口导入 `EntityIdEncoding` 与 `parseEntityId`。编码只有 decimal/hex；`parseEntityId(value, encoding='decimal')` 返回验证后的原字符串，不转 JS Number、不改写或猜格式。

- decimal 为无前导零的正十进制，最大 `9223372036854775807`。
- hex 为无前缀、无前导零的小写正十六进制，最大 `7fffffffffffffff`。
- 数字类型、零、负数、符号、空白、hex 大写/前缀、溢出和未知编码均拒绝。
- 两种字符集有交集：`"10"` 在 decimal 为十，在 hex 为十六；前后端必须选择同一合同。

`createAuthClient({http,idEncoding:'hex'})` 统一校验 login/refresh/session 的用户 ID，`parseAuthSession(value,'hex')` 提供同一安全 DTO 解析；未知配置在网络请求与 owner 绑定前拒绝。`createApiKeyHttpAdapter({http,idEncoding:'hex'})` 与 `parseApiKeyWireMetadata(value,'hex')` 使用同一编码校验 list/create metadata、revoke/delete 确认及目标路径；非法动作目标在发送前拒绝，响应 ID 必须精确匹配目标。权限/期限 ID 是业务代码，保持原合同。

省略编码等同 decimal。选用配套 baseservice facade 时，其 Options.IDEncoding 同步配置为 idservice.HexIDEncoding；内部模型、鉴权、数据库和密文 AAD 不变。业务日志没有相应 hex 选项，不能从认证配置推断。纯 ApiKeyAdapter/controller/视图仍允许宿主自己的不透明 ID，不将所有领域接口强制成数值身份。

[共享身份矩阵](../tests/fixtures/contracts/identity-encodings.v1.json)、[hex 认证 fixture](../tests/fixtures/contracts/auth.v2.hex.json) 与 [hex Key v2 fixture](../tests/fixtures/api-key-contracts.v2.hex.json) 验证明确编码；Cookie/Bearer 隔离、内存凭据、取消/迟到和不重放规则不变。响应格式失败不暗中回退另一编码，也不能把后端已提交但投影失败称作回滚。
