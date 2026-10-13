# API Key 管理与 HTTP v2 安全合同

此页面管理自有平台向 Agent 等集成签发的访问密钥，不是上游供应商凭据配置。通用规则仅在 [DESIGN](DESIGN.md)，统一前后端标准见 [PAGE_APIS](PAGE_APIS.md)。第三方 provider、OAuth/OIDC 等遵循原有行业协议，不强制套用此 facade；没有真实业务接口时记录前置缺口，不制造成功 adapter。

## 公开页面与业务能力

`ApiKeyManager` / `createApiKeyManager` 共用 `createApiKeyManagerController`。权限、期限、默认值和授权确认来自服务/宿主，不能由 UI 猜测。创建要求 `canCreate:true`；行 capabilities 分别声明 `update/revoke/deleteRecord`，未知默认不启用。通用域 adapter 可使用明确 `canUpdate/canRevoke/canDeleteRecord`，但服务端的明确 false 不能被宿主 true 覆盖。后端始终重新鉴权。

- create：name、permissionIds、expiryId、可选独立 confirmed；required 权限必须选中，disabled 权限不可选择，冲突配置拒绝。
- update：`openUpdate(id)/setUpdateDraft/submitUpdate` 编辑 name、permissionIds、enabled；可增加/移除宿主声明的权限，四个 scope 也使用同一权限集合，不写产品私有分支。required/disabled 规则仍适用；`validateUpdate(draft,key)` 可返回安全的 name/permissions 错误。没有完整已知 enabled 事实时不提供编辑入口，避免猜测启停状态。
- 暂停/恢复使用 enabled；暂停显示 disabled，不是 revoke。revoked 密钥不可更新或恢复；不重新显示完整密钥。
- revoke：使凭据失效；过期但未撤销的密钥仍按实际 capability 授权撤销。
- deleteRecord：仅删除已经 revoked 的管理记录，独立确认及 capability；不撤销活动凭据、不删除业务记录。

`ApiKeyAdapter.update` 返回真实公共 metadata；revoke/deleteRecord 成功返回 void。通用 custom adapter 的 update、metadata.version/enabled/capabilities.update 均可选，不要求尚未采用 baseservice 的 xAgent 或第三方平台实现 base 协议。React/原生页面等价，使用统一表单、选择器、弹窗、错误和焦点生命周期。

## 默认 HTTP adapter：严格 v2

`createApiKeyHttpAdapter({http,writeGuard,timeoutMs?,pageSize?,maxRecords?,idEncoding?})` 必须提供下面的持久 actor-scoped guard。旧默认 HTTP v1 调用须显式升级，不静默回退旧 endpoint、缺省版本或授权。URL 仍为 `/api/v1/api-keys`，DTO `schema_version` 为 2。所有请求 no-store / redirect:error，无写入自动重放；AjaxResponse 以 success=true 判定业务成功，code 为必填安全整数而非固定成功数字。

| 操作 | 方法/路径 | 请求和 payload |
| --- | --- | --- |
| 配置 | GET /api/v1/api-keys/capabilities | schema_version:2、can_create、permissions、expiry_options、default_expiry_id、default_permission_ids、confirmation_label |
| 列表 | GET /api/v1/api-keys | 基数0 page_index/page_size/return_total=true/sort=id/sort_id=asc；原生 ListData {list,total} |
| 创建 | POST /api/v1/api-keys | {name,permission_ids,expiry_id,confirmed}；{schema_version:2,metadata,secret,operation_id,fingerprint} |
| 更新/启停 | PUT /api/v1/api-keys/{id} | {expected_version,name,permission_ids,enabled}；{schema_version:2,id,operation:"update",completed:true,metadata,operation_id,fingerprint} |
| 撤销 | POST /api/v1/api-keys/{id}/revoke | {}；{schema_version:2,id,operation:"revoke",completed:true,operation_id,fingerprint} |
| 删除管理记录 | DELETE /api/v1/api-keys/{id}/record | 无 body；{schema_version:2,id,operation:"delete_record",completed:true,operation_id,fingerprint} |

wire metadata 为 id/name/prefix/permission_ids/created_at/expires_at/last_used_at/可选 last_used_at_pending/status/version/enabled/capabilities{update,revoke,delete_record}。nullable 字段必须明确 null，status 为 active/disabled/revoked/expired/unknown/null；version 必须为规范正 int64 十进制字符串（与 ID 编码独立），enabled 为明确 boolean。metadata 不允许 secret/token 等额外字段。内部公开 metadata 使用 camelCase，仅精确映射一次。

默认 ID 编码 decimal，可显式 hex；列表/创建/响应确认/请求路径采用同一规范正 int64 编码，发送前拒绝非法目标。权限和期限代码不受影响，custom adapter 仍可使用不透明 ID。详情 [IDENTITY_ENCODING](IDENTITY_ENCODING.md)。

`last_used_at_pending:boolean` 只映射为 `lastUsedAtPending`。true 显示“待保存”，false/缺失各自保留；不从本机时间、nullable 时间或状态推断。访问元数据待保存不是写入事务 pending。分页完整收集预算30秒、每页最多200、默认最多5000条（显式可至100000）；拒绝变动 total、重复ID、缺页、超限，不承诺跨页原子快照。

## 持久写入 owner 与恢复

正式 HTTP v2 必须创建 `createApiKeyWriteGuard({scopeId,isCurrentScope,storage:{load,save}})`，再把该 guard 传给 HTTP adapter；manager 自动复用 adapter 的同一 owner，若另传不同 guard 则拒绝。scopeId 必须来自宿主已经验证的 server/账号/namespace，不能从请求参数、用户名或 origin 单独猜测。必填 isCurrentScope() 与宿主真实 auth owner 的当前三元身份比较；throw 等同 false，不得在生产中硬编码 true。claim、prepare 后、发送、响应、receipt 终态和持久清理前均复核；失效停止旧 controller/等待，隐藏其metadata与一次性值，不删除旧 scope 恢复记录。宿主在身份事件发生时同步 destroy 旧 controller，避免等待下一次读/操作才反映切换。换身份时使用该身份自己的 owner，不展示其他 scope 的 descriptor、不清除旧 scope 未决记录。scopeId 不使用 token/password/secret；服务端仍绑定真实 actor/scope 并重新鉴权。

storage 保留宿主同步持久镜像/旧版本恢复接口：`load(scopeId)` 返回 null/undefined 或快照，`save(scopeId,snapshot|null)` 失败必须 throw。完整快照仅 `{schema_version:1,scope_id,descriptor}`，不保存草稿或凭据。初始化同步验证字段白名单、版本、scope、字符串长度/格式；已有未知 descriptor 必须保留并原子导入，绝不把新的 IndexedDB 空库视为旧请求不存在。旧镜像与原子记录冲突时两者都保留并失败关闭，需要明确核对这两个旧操作，不能择一覆盖。

公共 owner 默认使用 IndexedDB 短事务作为权威跨窗口门禁。`guard.ready()` 可供宿主等待异步恢复；controller/HTTP adapter 在每次发送前自动等待，不要求产品自行实现锁。新窗口/重新加载自动读取原 scope descriptor 为 uncertain，保留原 operation_id 与五字段。不同 tab 的 prepare 可以同时完成，但原子 `compareExchange(null,descriptor)` 只有一个成功者；只有其事务提交、镜像保存成功且 scope/generation 仍有效后才允许 POST/PUT/DELETE。整个网络期间及 unknown 后记录都占住该 scope。失败者继承原 descriptor，不生成另一个请求重放它。

成功/确定拒绝、确定未发送的取消，以及完整匹配权威 receipt 终态，通过精确原 descriptor 的条件事务清理。迟到清理绝不删除其他窗口的新记录。未知/超时/关闭/卸载没有自动清理、过期租约或超时接管。跨 tab 正确性来自 IndexedDB 原子事务，不是 localStorage 的 load→save、复读、sent 标记或不同 operation ID 去重；所有参与窗口必须升级为此合同。旧版本仍在运行且绕过原子门禁时不能宣称兼容并发保护。

IndexedDB 在普通内网 HTTP 上也可用，不依赖安全上下文的 Web Locks、randomUUID 或 SubtleCrypto。浏览器禁用/阻止 IndexedDB、事务失败、镜像失败时发送前失败关闭，显示保护存储不可用；不会退到无保护内存写入。自定义存储适配器也必须实现真实跨上下文原子持久 CAS，不能用进程内 Map/队列或 localStorage 伪实现。

### 公共原子恢复存储

`@coffeehc/xui-runtime/operation-store` 导出 `createIndexedDBOperationStore({databaseName?,indexedDB?})`、`DurableOperationStore`、`IndexedDBOperationStoreOptions`。默认数据库 `xui.operation-recovery.v1`；Key scope 为 `xui.api-key.v1:` 加完整可信 scopeId，Auth 使用独立命名空间。正常产品只配置公开业务 scope/storage；特殊宿主可向 Key guard 传 `operationStore`，无需包装或复制 Key/controller。

- `read(scope): Promise<string|null>` 读取原始非秘密记录。
- `compareExchange(scope,expected,next)` 在一个 readwrite 事务内比较完整字符串，匹配才替换/删除；返回 `{exchanged,current}`，成功 current 为 next，失败为原值。必须等事务成功提交才 resolve。
- IndexedDB 事务只做 get/put/delete，使用 strict durability，不跨网络等待、不忙循环保活、不依赖时钟。
- caller 负责只使用白名单 canonical JSON。Key 保留原五字段及 schema/scope；Auth 保留明确 attempt/operation。禁止存密码、token、secret、草稿或响应 body。
- 公共接口供真实原子持久适配器/确定性测试注入。测试用 Map 只是模型，真实跨页 IndexedDB另有浏览器回归，不能将模型用作生产 fallback。

descriptor 仅含：

```
{ operation_id, operation, target_id, expected_version, fingerprint }
```

operation 为 create/update/revoke/delete_record；create 的 target_id 为空，其他为所选 ID 编码；仅 update 的 expected_version 为正 int64 十进制字符串，其他为空。没有 draft、name、prefix、URL、secret、token、password 或响应 body。

每个请求生成 canonical lowercase UUIDv4 `operation_id`，仅依赖 `crypto.getRandomValues`，不要求安全上下文的 randomUUID；安全随机数不可用则发送前拒绝。指纹为 exact UTF8 `method + '\n' + canonicalPath + '\n' + exactBodyBytes` 的 SHA-256；GET 不算，DELETE 空 body。内网 HTTP 不依赖 SubtleCrypto。发送 headers `X-API-Key-Operation-ID` / `X-API-Key-Request-Fingerprint`；服务端独立重算并绑定权限/actor/scope/CAS，不能信任客户端 header。异步 prepare 后检查当前 generation/取消/owner；取消且确定未调用写 adapter 时才按 before-send 证明释放。成功响应 operation_id/fingerprint 必须逐项匹配。

通用 custom adapter 不使用正式 HTTP 时仍可沿用 `createApiKeyWriteGuard()` 内存 owner，或显式接入 prepareWrite/持久 descriptor。同一个原始 adapter 默认共享 owner；重建 adapter 时保留 owner。没有持久配置的 custom adapter 仅保证共用单 owner 的内存门禁，不宣称跨 tab、整页重载保护。持久 custom adapter 若使用 prepareWrite，也必须遵守相同原子 descriptor 合同。

### 只读 Lookup 与显式 Resolve

`recoverUncertainWrite()` 首先新读并验证完整公共列表，然后调用只读 `adapter.reconcileWrite`。默认 v2 为 GET `/api/v1/api-keys/operations/{operation_id}`，query 为其余四个 descriptor 字段。列表相似、没有同名记录、普通409或当前时间都不是核对证据；没有 receipt 时 Lookup 必须 pending。

`openResolveWrite()/confirmResolveWrite()` 是独立明确确认：“终止尚未执行请求并核查结果”。对应 POST 同路径 `/resolve`，body 为 descriptor 其余四字段。它可能写不可逆 not-applied 墓碑，阻止迟到原请求；不是只读，不撤销已应用写入，不由 refresh/Lookup 自动触发。用户先看到终止说明，再确认。服务端与原写共用操作事务锁，重验身份/权限；不能先读后凭猜测写墓碑。

两者仅接受 `{schema_version:2,...完整descriptor,resolution:'pending'|'applied'|'not-applied'}`。五个身份字段逐项严格匹配，只有 applied / not-applied 权威终态才释放当前保护；not-applied 必须保证未来不会迟到应用。pending、失配、错误、取消、较新 list/guard 或 Resolve 结果未知继续锁。不恢复一次性值，不自动重放；用户须表达新的写入意图。

创建、更新、撤销、删除的网络/超时/parse/5xx/普通409均保持 uncertain。明确其他4xx/business拒绝可释放，50301（提交未知）与50302（已提交、后处理失败）即使被200/4xx包装也继续阻止重放。50302 不表示回滚。取消、关闭、pagehide、卸载、destroy 只停止本地等待，不回滚服务端。正式v2持久 descriptor 跨整页重载恢复为 uncertain，迟到结果不恢复弹窗、密钥或改行。

关闭后的门禁提示与核对/终止入口位于标题之后、列表工具栏之前，自然高度完整显示；不塞固定列表反馈槽。窄屏大字检查祖先裁切区和焦点四边，不承诺门禁切换零位移。闭窗恢复焦点到核对入口，但不夺走宿主主动移走的焦点。

## 一次性值与验证边界

完整值仅在 controller 瞬时私有结果，readSecret 只允许 result 视图读取；不进入状态、列表缓存、URL、storage、日志或业务 payload。关闭/pagehide/卸载同步清 DOM value/defaultValue/textContent。复制必须明确用户动作，失败允许手动复制；不承诺 JS 内存物理擦除或撤回剪贴板。

baseservice [apikeyservice/webfacade](https://github.com/coffeehc/baseservice/tree/main/apikeyservice/webfacade) 对应严格v2。共享 [decimal](../tests/fixtures/api-key-contracts.v2.json) / [hex](../tests/fixtures/api-key-contracts.v2.hex.json) fixtures 逐字节一致，通过真实 adapter 验证 exact body_text、headers、更新和 Lookup/Resolve。测试还使用公开 SHA-256 向量、独立 Node crypto 和 Go UTF8 固定向量。旧 page-contracts.v1 仍归档；旧覆盖通过明确测试专用 helper 升级合成输入，不能称作真实服务v1兼容或新合同联调。

[shared capability-model](../examples/shared/capability-model.ts) 的 React/原生消费者演示v2、storage和编辑启停；全部合成 FAKE 数据，不能证明真实鉴权、部署或生产集成完成。宿主升级须同时注册 endpoints、持久 receipts/事务锁、鉴权/tenant、授权投影、CSRF、限速与安全存储；不能只更新前端库。

迁移保留业务边界：xLead 的 read/write、独立 confirmed、30/90/365/0天、过期撤销和单独管理记录删除仍通过服务声明/custom adapter 表达。xLead 的 last_accessed_at/last_access_pending 只能在其领域 adapter 显式映射，不猜旧别名。本轮不修改产品业务仓库；Argus四scope增减/暂停恢复由新通用编辑模型承载，真实接入仍需产品任务验证。
