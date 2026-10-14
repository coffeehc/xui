# API Key 管理与 HTTP v2 安全合同

此页面管理自有平台向 Agent 等集成签发的访问密钥，不是上游供应商凭据配置。通用规则仅在 [DESIGN](DESIGN.md)，统一前后端标准见 [PAGE_APIS](PAGE_APIS.md)。第三方 provider、OAuth/OIDC 等遵循原有行业协议，不强制套用此 facade；没有真实业务接口时记录前置缺口，不制造成功 adapter。

## 公开页面与业务能力

`ApiKeyManager` / `createApiKeyManager` 共用 `createApiKeyManagerController`。权限、期限、默认值和授权确认来自服务/宿主，不能由 UI 猜测。创建要求 `canCreate:true`；行 capabilities 分别声明 `update/revoke/deleteRecord`，未知默认不启用。通用域 adapter 可使用明确 `canUpdate/canRevoke/canDeleteRecord`，但服务端的明确 false 不能被宿主 true 覆盖。后端始终重新鉴权。

- create：name、permissionIds、expiryId、可选独立 confirmed；required 权限必须选中，disabled 权限不可选择，冲突配置拒绝。
- update：`openUpdate(id)/setUpdateDraft/submitUpdate` 编辑 name、permissionIds、enabled；可增加/移除宿主声明的权限，四个 scope 也使用同一权限集合，不写产品私有分支。required/disabled 规则仍适用；`validateUpdate(draft,key)` 可返回安全的 name/permissions 错误。没有完整已知 enabled 事实时不提供编辑入口，避免猜测启停状态。
- 暂停/恢复使用 enabled；暂停显示 disabled，不是 revoke。revoked 密钥不可更新或恢复；不重新显示完整密钥。
- revoke：使凭据失效；过期但未撤销的密钥仍按实际 capability 授权撤销。
- deleteRecord：仅删除已经 revoked 的管理记录，独立确认及 capability；不撤销活动凭据、不删除业务记录。

`ApiKeyAdapter.update` 返回真实公共 metadata；revoke/deleteRecord 成功返回 void。通用 custom adapter 的 update、metadata.version/enabled/capabilities.update 均可选，不要求宿主或第三方平台实现 BaseService 协议。React/原生页面等价，使用统一表单、选择器、弹窗、错误和焦点生命周期。

## 默认 HTTP adapter：严格 v2

`createApiKeyHttpAdapter({http,timeoutMs?,pageSize?,maxRecords?,idEncoding?})` 复用宿主已有 HTTP/auth owner，直接调用普通业务接口。旧默认 HTTP v1 调用须显式升级，不静默回退旧 endpoint、缺省版本或授权。URL 仍为 `/api/v1/api-keys`，DTO `schema_version` 为 2。所有请求 no-store / redirect:error，无写入自动重放；AjaxResponse 以 success=true 判定业务成功，code 为必填安全整数而非固定成功数字。

| 操作 | 方法/路径 | 请求和 payload |
| --- | --- | --- |
| 配置 | GET /api/v1/api-keys/capabilities | schema_version:2、can_create、permissions、expiry_options、default_expiry_id、default_permission_ids、confirmation_label |
| 列表 | GET /api/v1/api-keys | 基数0 page_index/page_size/return_total=true/sort=id/sort_id=asc；原生 ListData {list,total} |
| 创建 | POST /api/v1/api-keys | {name,permission_ids,expiry_id,confirmed}；{schema_version:2,metadata,secret} |
| 更新/启停 | PUT /api/v1/api-keys/{id} | {expected_version,name,permission_ids,enabled}；{schema_version:2,id,operation:"update",completed:true,metadata} |
| 撤销 | POST /api/v1/api-keys/{id}/revoke | {}；{schema_version:2,id,operation:"revoke",completed:true} |
| 删除管理记录 | DELETE /api/v1/api-keys/{id}/record | 无 body；{schema_version:2,id,operation:"delete_record",completed:true} |

wire metadata 为 id/name/prefix/permission_ids/created_at/expires_at/last_used_at/可选 last_used_at_pending/status/version/enabled/capabilities{update,revoke,delete_record}。nullable 字段必须明确 null，status 为 active/disabled/revoked/expired/unknown/null；version 必须为规范正 int64 十进制字符串（与 ID 编码独立），enabled 为明确 boolean。metadata 不允许 secret/token 等额外字段。内部公开 metadata 使用 camelCase，仅精确映射一次。

默认 ID 编码 decimal，可显式 hex；列表/创建/响应确认/请求路径采用同一规范正 int64 编码，发送前拒绝非法目标。权限和期限代码不受影响，custom adapter 仍可使用不透明 ID。详情 [HTTP](HTTP.md#显式实体身份编码)。

`last_used_at_pending:boolean` 只映射为 `lastUsedAtPending`。true 显示“待保存”，false/缺失各自保留；不从本机时间、nullable 时间或状态推断。访问元数据待保存不是写入事务 pending。分页完整收集预算30秒、每页最多200、默认最多5000条（显式可至100000）；拒绝变动 total、重复ID、缺页、超限，不承诺跨页原子快照。

## 提交、超时与刷新

controller 用当前页面的 `actionBusy` 防止重复提交；创建/保存按钮禁用并显示“正在创建／保存”，成功后展示真实结果。正常路径没有恢复会话预请求、持久 operation store、写入门禁或专用恢复弹窗。

写请求超时、网络断开或返回结果无法确认时，只通过 `adapter.list({signal})` 重新读取一次普通列表。列表成功就展示当前记录；读取失败保留可见错误和已有数据。结束本次等待后用户可以再次操作，不自动重发创建、更新、撤销或删除请求。列表是当前业务状态，不将同名记录当作原请求的提交证明，也不能取回丢失的一次性完整值。更新重新采用列表中最新 version，再由后端以 expected_version 校验。

`ApiKeyAdapter` 只包含 list/create/revoke 和可选 update/deleteRecord；`ApiKeyWriteContext` 仅传 AbortSignal。没有 prepareWrite、reconcileWrite、resolveWrite 或 writeGuard 配置。HTTP 写入无需 operation ID/fingerprint headers；服务端不再提供 Lookup/Resolve 路由。

关闭、pagehide、卸载或 destroy 中止所属等待并丢弃迟到结果，不声称撤销已提交写入。宿主切换服务器、账号或租户时销毁旧 controller 和所属资源，按新身份重建；后端始终重新鉴权，保留事务和并发更新校验。

## 一次性值与验证边界

完整值只在 controller 私有内存结果中，readSecret 仅允许 result 视图读取；不进入公开状态、列表缓存、URL、storage、日志或业务 payload。关闭/pagehide/卸载同步清理 DOM value/defaultValue/textContent。复制必须是用户明确动作，失败允许手动复制；不承诺 JS 内存物理擦除或撤回剪贴板。

baseservice 的 apikeyservice/webfacade 配套严格 v2。共享 [decimal](../tests/fixtures/api-key-contracts.v2.json) / [hex](../tests/fixtures/api-key-contracts.v2.hex.json) fixtures 核对 exact body_text、普通 headers、CRUD 和 ID 编码；旧 page-contracts.v1 仅归档，不表示服务兼容。

[shared capability-model](../examples/shared/capability-model.ts) 的 React/原生消费者演示普通 v2 请求和编辑启停；全部是 FAKE 合成数据，不证明真实鉴权、部署或生产接入完成。宿主保留自己的业务权限、namespace、CSRF、限速和服务端存储策略。

迁移时删除旧 writeGuard/recovery 配置及 Lookup/Resolve 接线，同步升级 xui 与 BaseService；不删除线上业务数据或执行数据库清表。custom adapter 按真实领域接口实现普通 CRUD，已有 read/write、独立 confirmed、期限和管理记录删除语义继续保留，不强制第三方采用 BaseService 协议。
