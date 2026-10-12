# API Key管理与原生HTTP合同

此页面管理自有平台向Agent等集成签发的访问密钥，不是上游供应商凭据配置。通用规则仅在[DESIGN](DESIGN.md)，统一前后端标准见[PAGE_APIS](PAGE_APIS.md)。没有该业务接口的产品记录前置缺口，不能通过改名或假adapter制造成功。

## 公开页面与授权

ApiKeyManager/createApiKeyManager共用createApiKeyManagerController。permissions、expiryOptions、defaultExpiryId由服务/宿主授权声明，不猜产品权限或期限。创建要求明确canCreate:true；行capabilities声明revoke/deleteRecord，未知默认不启用。无capabilities的临时域adapter可以给明确canRevoke/canDeleteRecord；已有false服务声明不会被宿主true覆盖。后端始终重新鉴权。

required权限在初始draft中明确选中且不可取消；disabled权限不可选择，两者冲突拒绝配置。可选confirmationLabel提供独立授权勾选，draft.confirmed必须为true才能创建；它不是权限选择本身。validateCreate可返回name/permissions/expiry/confirmation的安全本地错误。不能将勾选视作后端授权或替代权限校验。

ApiKeyAdapter为list/create/revoke及可选deleteRecord。revoke使凭据失效；过期状态不再硬编码禁止，必须由实际capability/宿主授权允许。deleteRecord仅针对已经revoked的管理记录，需独立能力和callback；不撤销活动凭据、不删除已有业务记录。两操作都有目标、风险、确认/取消，确认回调成功返回void后才更新/移除。服务端无能力时保留业务原入口，不削减功能，也不默认放权。

写操作无自动重放。网络/超时/parse/5xx等结果未知使actionUncertain=true，同一弹层内禁止重复提交/确认；提示用户关闭并核对列表。HTTP4xx及原生明确business拒绝区分为安全拒绝反馈。取消/关闭只终止本地等待，不能回滚服务端；迟到结果不恢复弹层/密钥或删行。正式服务仍负责幂等和重复创建保护，前端不提供事务保证。

## 固定v1 facade与默认adapter

createApiKeyHttpAdapter({http,timeoutMs?,pageSize?,maxRecords?})使用同一个HttpClient。baseURL只确定origin，下面是固定根路径；不尝试旧route。全部使用原生httpx AjaxResponse，success=true/code=1为xui应用合同；错误保留HTTP事实和原生code。详情见[真实原生定义](PAGE_APIS.md#已读取的真实原生定义)。

| 操作 | 方法/路径 | 请求和payload |
| --- | --- | --- |
| 配置 | GET /api/v1/api-keys/capabilities | payload schema_version:1、can_create:boolean、permissions[{id,label,description:null/string,disabled,required}]、expiry_options[{id,label}]、default_expiry_id、default_permission_ids、confirmation_label:null/string |
| 列表 | GET /api/v1/api-keys | webfacade基数0/page_size(默认100最大200)/return_total=true/sort=id/sort_id=asc；payload为原生ListData{list,total} |
| 创建 | POST /api/v1/api-keys | JSON{name,permission_ids,expiry_id,confirmed}；payload{schema_version:1,metadata,secret}，secret只显示一次 |
| 撤销 | POST /api/v1/api-keys/{id}/revoke | JSON{}；payload{schema_version:1,id,operation:revoke,completed:true} |
| 删除管理记录 | DELETE /api/v1/api-keys/{id}/record | 无body；payload{schema_version:1,id,operation:delete_record,completed:true} |

wire metadata为id/name/prefix/permission_ids/created_at/expires_at/last_used_at/status/capabilities{revoke,delete_record}；nullable字段必须明确null，status为active/revoked/expired/unknown/null。时间由后端提供，UI不根据本机时钟猜授权状态。capability是服务确认的操作授权，状态规则仍由前端和后端共同校验。列表/metadata不允许secret/token等额外凭据字段。内部公开metadata使用camelCase，adapter做一次精确映射，不猜别名。

getConfiguration读取真实配置后，createApiKeyManagerController({...config,adapter})。配置404/403/无效DTO即错误，不能填默认授权或假配置。列表adapter按原生页查询收集完整列表，30秒整体预算、每页最多200、默认最多5000(显式可配置至100000)，拒绝变动total/重复ID/缺页/超限，不悄悄丢弃后续记录；不承诺跨页原子快照。写操作无自动重试，所有请求no-store/redirect:error。实际服务必须实现路径、DTO、鉴权/tenant、CSRF、限速、幂等与安全存储。

## 一次性值与临时接入

完整值仅在controller瞬时私有结果中，readSecret只允许result视图读取；不进getState、list缓存、URL、storage、日志或业务payload。关闭/pagehide/卸载同步清value/defaultValue/textContent，复制必须明确用户动作。无法复制时允许手动复制，不承诺JS内存擦除或撤回剪贴板。

本轮读取xLead@e766fb2a的真实[API页](https://github.com/coffeehc/xlead/blob/e766fb2a67d11880fd5f1db4d3b693511219017c/web/api-page.js)与[token routes](https://github.com/coffeehc/xlead/blob/e766fb2a67d11880fd5f1db4d3b693511219017c/plugin/api/auth_routes.go)：其read/write scopes、独立confirmed、30/90/365/0天、过期但未撤销仍可撤销、DELETE /tokens/{id}撤销与DELETE /tokens/{id}/record删除已撤销管理记录，必须保留。临时域adapter可精确映射为上述controller，成功删除需验证真实ok===true再返回void；不能把两种DELETE合并。长期由xLead在自己的授权任务中标准化后端，本轮不修改它。

[既有React例](../examples/api-key-react/app.tsx)/[原生例](../examples/api-key-vanilla/app.js)演示明确域adapter；[新共享模型](../examples/shared/capability-model.ts)与[React](../examples/capabilities-react/app.tsx)/[原生](../examples/capabilities-vanilla/app.js)实际消费默认HTTPadapter。全部合成FAKE数据，不生成真实密钥或证明生产鉴权通过。

第三方provider key与其管理API按第三方合同，不套用此平台facade或强制AjaxResponse；内部adapter只作明确领域转换。行业标准优先边界见[DESIGN](DESIGN.md#规范强度与职责)。
