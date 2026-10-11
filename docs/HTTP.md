# HTTP、响应与分页查询接入

这是实现接口；完整通用规则只在 [DESIGN.md](DESIGN.md)。从 runtime/http、runtime/query 导入，React/原生使用同一无框架类型。React 复用 useResource/DataRegion/ErrorState，不创建第二套请求 owner。

## 固定源码合同

通过正常 Git 读取的来源：

- [httpx@71f05d5 models.go](https://github.com/coffeehc/httpx/blob/71f05d5b635643313d5e1820f4a6bf1f61300f8e/httpxcommons/models.go)：AjaxResponse 为 success/message/payload/request_id/code/redirect；ListData 为 list/total。
- [同提交 utils.go](https://github.com/coffeehc/httpx/blob/71f05d5b635643313d5e1820f4a6bf1f61300f8e/httpxcommons/utils.go)：SendSuccess 的 code 由调用者传入；错误 success=false、payload=null，request_id 可能为空。
- [xagent@29139f7 成功调用](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/internal/services/apiserver/workgroup_endpoint.go) 与 [middleware](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/internal/services/apiserver/middlewares.go)：这里使用成功 code=1，X-Request-ID 单独返回；401/403 是不同 HTTP 事实。只读引用，没有改产品。
- [commons@896d1e7 query.go](https://github.com/coffeehc/commons/blob/896d1e7a80ec902cfdf739f67a82b7f49aa2b403/webfacade/query.go)、[query_test.go](https://github.com/coffeehc/commons/blob/896d1e7a80ec902cfdf739f67a82b7f49aa2b403/webfacade/query_test.go)、[select.go](https://github.com/coffeehc/commons/blob/896d1e7a80ec902cfdf739f67a82b7f49aa2b403/dbsource/sqlbuilder/select.go)：URL query；pageIndexOffset/maxPageSize 由接口决定。ParsePageQuery 无全局默认大小；BuildQuery 的缺省 30 和 AppendLimit 的 size=0 不分页也不是所有接口通用约定。

公开类型以 [http.ts](../packages/runtime/src/http.ts)、[query.ts](../packages/runtime/src/query.ts) 和正式构建声明为准，不另复制类型定义，不按旧 data/msg/items 别名猜测兼容。

## 单一传输与生命周期

createHttpClient 配置 baseURL、fetch、headers/getHeaders、默认 response/adapter、timeoutMs/credentials、onUnauthorized/onError。baseURL 必须无 URL 凭据、为绝对 HTTP(S)；request 必须同源，各后端可各建客户端。ESM 导入不发请求、不读 DOM。库不保存 token、storage、cache 或路由；headers/provider 来自宿主。

request(path,options) 接收 method、headers、body 或 json、signal、timeoutMs、response/adapter、endpointId、retry、detectAjaxErrors、credentials/cache/redirect。json:null 合法，json/body 不同时指定。默认 GET/same-origin credentials；Ajax/JSON 缺省 Accept: application/json，避免不明确的 protobuf 协商；json 补 Content-Type，FormData 不补 boundary。headers 合并顺序为 client→provider→endpoint。endpointId 是短逻辑标识，只含字母数字/点/下划线/冒号/连字符，不能传 URL。

没有默认 timeout，宿主明确预算；预算包含 provider、fetch、完整 body、adapter 和重试等待。取消/超时即使遇不合作 producer 也结束本地等待，不能证明服务端已停止，因此不能据此重放写操作。destroy 取消在途任务，销毁后 request 为 cancel；宿主同步释放 resource 与订阅。

## 模式与响应

| response | 行为 |
| --- | --- |
| ajax（默认） | 严格 JSON AjaxResponse；HTTP 2xx + success=true + code=1 才成功；payload 原样返回，null/0/false 合法 |
| json | 整个 JSON 值作为 payload，不猜 Go/OAuth/SCIM 形状 |
| text | 返回文本，不运行 JSON 解析 |
| blob | 返回 Blob，普通 JSON 文件合法 |
| empty | 明确无返回值，取消不需要的 body，payload=undefined；适用于声明的 204/裸状态接口 |

JSON 空 body/HTML/缺字段为 parse 错误，不默认为成功；204 在 ajax/json 仍不满足合同。非 2xx 保留 HTTP 事实，解析失败不把 401/403 隐藏成 parse/network；失败状态 body 超时记录 http/readFailure=timeout。

createAjaxResponseAdapter({successCode}) 明确采用其他成功 code。ResponseAdapter 接收未知解码值和 status/headerRequestId/endpointId/attempts，返回 payload 和可选 code/bodyRequestId/redirect；缺 payload 的结果被拒绝。客户端 adapter 属于默认模式，endpoint 明确换 response 模式时不继承不同模式的 adapter，也可提供 endpoint adapter。

响应为 payload/status/code/requestId/bodyRequestId/headerRequestId/redirect；非空 body id 优先 header，两者都保留，不伪造 traceId。redirect 只是数据，不触发应用导航。默认没有原始 Response/完整 headers/请求对象。领域校验只在一次声明的 endpoint adapter；标准请求不把 null 改成其他字段。

下载若可能用 HTTP 200 Go envelope 返回失败，显式 detectAjaxErrors:true 检查完整失败形状；普通 JSON 文件不会被猜成错误。无流式/SSE/WebSocket/protobuf、上传进度、断点续传或文件安全校验支持声明，这些协议另行明确接入。

## 安全错误、认证与重试

HttpError.kind 为 cancel/network/timeout/http/parse/business；metadata 仅保存 status/code、两种 request id、endpointId、attempts、retryAfterMs/readFailure。默认 message/getHttpErrorMessage 是安全固定文字，不包含 native fetch 敏感 URL、后端 message、body、headers 或 cause。领域反馈按 code 显式映射，不能直接把未知 Error.message 放入 Toast；后端仍须保证 request id 可公开展示。

onError 可一次绑定宿主反馈，cancel 不调用；交给 onUnauthorized 的 401 不重复调用 onError。同步抛错/异步拒绝不改变 HTTP 事实。必要错误同时在页面 ErrorState 可见，不能只放消失通知。

onUnauthorized 只响应实际 HTTP 401，收到响应头即通知，每个认证 epoch 至多一次；不按业务 code、403 或 redirect 跳登录。认证请求可以显式 unauthorized:"ignore"，既不通知也不消耗该 epoch 的全局 401 通知；[AUTH](AUTH.md) 用它将登录拒绝与会话核对留在认证上下文。ignore 的 HTTP 错误仍能交给 onError，宿主反馈可按 auth.* endpointId 避免重复。宿主确认新认证后 resetUnauthorized，旧 epoch 迟到 401 不再次失效新认证。库不刷新 token、不决定登录路由、不重放请求；宿主认证切换时还应取消旧 resource/key。

默认完全不自动重试，GET 也可能有副作用。只有显式 retry:{idempotentRead:true,maxAttempts} 的无 body GET/HEAD 能有限重试，maxAttempts 1–5；写方法和一次性 body 的 opt-in 在发送前拒绝。默认重试 network/429/502/503/504，绝不自动重试 401/403/business/parse/cancel/普通 timeout。delayMs/maxDelayMs 可配置，默认退避 250ms/最大等待30s；Retry-After 不提前缩短，超上限直接保留失败。signal 和整体预算覆盖退避；按钮重试仍须确认操作可重试。

## webfacade URL query 与 ListData

WebfacadeQuery 提供 page_index/page_size/return_total、filters、按优先级排列的 sort；WebfacadeContract 每接口显式 pageIndexOffset，可选 maxPageSize、filterFields codecs、sortFields 白名单，没有全局页码或上限。page_index 是 wire 值；示例将 1 基 Pagination 页码显式转换为 `page - 1 + endpoint.pageIndexOffset`。

serializeWebfacadeQuery 返回 URLSearchParams，仅编码一次；排序为 sort=name,created 与 sort_name=asc/sort_created=desc。没有 JSON/SQL AST、真实数据库列名或运算符。后端 start_id/FieldDefined 的附加排序/条件仍由具体接口定义。

filters 只能用声明字段和显式 codec。queryCodecs 为 string/int64/number/boolean/int64Array/time；不自动转换 Date/数组/对象。int64 可保留有范围校验的十进制字符串/BigInt；number 必须有限；time 必须 YYYY-MM-DD HH:mm:ss 并验证日历，不改成 ISO/millis。自定义 Convert 用明确 codec。null/undefined/空值清除，literal "null"/"undefined" 拒绝，避免后端静默跳过；保留参数和 sort_* 不作为字段，未知过滤/重复排序/无效方向拒绝。

existing params 复制后清除旧受管过滤/排序和无语义 field，保留宿主无关参数。page_size 是正 safe integer，page_index 不低于 endpoint offset，可选上限超限拒绝，不能默默改接口行为。

parseListData 仅接受 list 数组/null、非负 safe integer total；不猜 items/data/result，拒绝 int64 精度丢失，可显式 decodeItem。toListPage(wire,{returnTotal}) 才把 null list→[]，未请求 total→null；占位 total=0 不能当“零条记录”。其他 payload/cursor 协议另设 adapter；[结构化日志](LOGS.md) 使用独立 cursor 合同，不能套此分页/排序。

## 可运行接入与迁移

已编译运行的 [React 页面](../examples/http-react/app.tsx)、[原生页面](../examples/http-vanilla/app.js)/[HTML](../examples/http-vanilla/index.html) 共用 [typed endpoint model](../examples/shared/http-model.ts)，仅导入公开组件/工厂和 CSS。独立 tarball、types 与真实 fetch 由 [consumer](../scripts/consumers.mjs) 和 [浏览器检查](../tests/browser/http.spec.mjs) 验证。

根目录 pnpm build、pnpm test:consumer、pnpm preview 后访问 /http-react/ 或 /http-vanilla/；本地 /api/xui-example/records 是明确合成 fixture，页基数0/上限50不是产品默认合同，不访问真实后端。

迁移先检查旧请求承载的 headers/credentials、权限、缓存/去重、认证、日志、取消、上传/下载及业务恢复；保留必要行为，再收敛一个 transport/auth/error/resource owner。采用默认协议的产品使用准确 Go envelope/list/query，不保留长期别名猜测链；暂不符合的接口只能用明确、有限、有移除计划的 adapter。

删除精确重复的 fetch 拦截器/认证跳转/Toast/loading owner；保留领域 API 作为一次 endpoint adapter。移除私造 query AST、隐式页码/日期/object 转换和重复编码。按 [采用手册](ADOPTION.md) 逐页迁移、真实构建验收，不先盲删业务权限/功能。
