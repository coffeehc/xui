# ModelProfile：公共模型配置组件

`ModelProfileForm` 提供新增、修改模型配置的完整表单；`ModelProfileEditor` 在同一表单外组合公共 Sheet。本目录随 `@coffeehc/xui-react` 安装包交付，说明组件使用的 API 及处理流程。

本组件自 4.2.39 起通过正式 ESM/CSS/types 及独立 tarball 交付。当前示例使用合成 Mock 响应，不连接后端或上游模型。本轮没有实现任何消费项目的后端 API。真实接入前，项目后端必须实现下述合同，并核对所用 agentCore 的能力。

## 入口与职责

| 入口 | 职责 |
| --- | --- |
| `@coffeehc/xui-react/model-profile` | `ModelProfileForm`、`ModelProfileEditor`、labels 和 slot，负责展示、输入、字段反馈与焦点 |
| `@coffeehc/xui-runtime/model-profile` | `ModelProfileService`、`ModelProfileClient`、`createModelProfileController`、公开类型与 Provider 枚举 |
| 项目后端 | 权限、读取已有配置、候选合并、密钥解析、并发版本校验、持久化及调用 agentCore |
| agentCore | Provider 协议实现、权威默认配置、上游模型目录及测试/向量调用；执行入口仅接收已合并的完整明文 Profile |

Service 复用项目现有 `HTTPService` 和认证链路，导入模块不发请求。Controller 每个编辑器一份，不能用全局单例共享不同对象的草稿。前端不直连上游、不保存原密钥、不复制 Provider SDK，不新增业务模型列表、默认模型选择或业务引用 owner。

精确类型以安装包 `/model-profile` 的声明为准。完整公共规范见 [PUBLIC_API](https://github.com/coffeehc/xui/blob/main/docs/PUBLIC_API.md#模型配置后端实施提示词)、[COMPONENTS](https://github.com/coffeehc/xui/blob/main/docs/COMPONENTS.md#公共模型配置)；本 README 解释这些合同在组件中的执行方式。

## 最小使用

项目启动时已有的 bootstrap 负责配置 HTTP/认证。业务页面只需导入公共 CSS 和组件：

```tsx
import '@coffeehc/xui-theme/style.css';
import {ModelProfileForm} from '@coffeehc/xui-react/model-profile';

// 新增：从 editor API 读取默认配置。
export function CreateModel() {
  return <ModelProfileForm />;
}

// 修改：读取指定对象的已保存配置。
export function EditModel() {
  return <ModelProfileForm options={{profileId: 'profile-123'}} />;
}
```

`options` 是自建 Controller 的初始化参数；需要在同一编辑器切换记录时，注入稳定的 `controller`，显式调用 `load(id)`，不要依靠变化的初始参数或重挂表单。`controller` 与 `options` 互斥。宿主已取得安全初态时，可使用 `options.initial` 避免再次读取。

抽屉使用 `ModelProfileEditor` 的 `open`、`onOpenChange`、`trigger` 和可选 `finalFocus`；不复制一份表单。`labels` 可热更新，`disabled`/`readOnly` 限制编辑、目录、测试与保存，`onCommitted` 在本次确认提交后触发，包括测试或后续处理失败；`onSaved` 仅在同时取得权威保存配置时触发。宿主列表刷新选用 `onCommitted`，不要在两个回调重复刷新；`onSaved` 可以用于消费确认配置或关闭编辑器。后端仍必须独立鉴权。

## 固定 API

所有响应使用官方 AjaxResponse：`{success,message,payload,request_id,code}`，下表列出 `payload`。业务失败和不符合公开类型的响应不会当作成功。ID 和版本均为不透明字符串。

| API / Service 方法 | 输入 | 成功 payload / 用途 | 持久化 |
| --- | --- | --- | --- |
| `GET /api/v1/model-profiles/editor` / `read(undefined, context)` | 无 ID | `ModelProfileEditorData`，新增初态及可用 Provider 默认配置；`profile_id`/`version` 为 `null` | 否 |
| `GET /api/v1/model-profiles/editor?profile_id=...` / `read(id, context)` | 对象 ID | 同一类型，返回授权对象当前配置和版本；不存在必须报错，不冒充新增 | 否 |
| `POST /api/v1/model-profiles/actions/catalog` / `catalog(candidate, context)` | 候选配置 | `{schema_version:1,models:[{id,owned_by?,created_at?}]}`，填充真实模型名选择列表 | 否 |
| `POST /api/v1/model-profiles/actions/test` / `test(candidate, context)` | 候选配置，向量另带 `embedding` | `{schema_version:1,kind,passed,elapsed_ms,summary,embedding?}`，显示安全测试结果 | 否 |
| `POST /api/v1/model-profiles` / `save(candidate, context)` | 无 ID/版本的候选配置 | `ModelProfileEditorData`，含新 ID、版本和安全配置 | 是 |
| `PUT /api/v1/model-profiles/{id}` / `save(candidate, context)` | 候选配置含同一 ID 和版本 | 同一类型，返回保存后的版本；后端校验路径/请求 ID，并执行 CAS | 是 |

读取和目录请求默认 30 秒；测试、保存默认 180 秒，可通过 `ModelProfileClient.operationTimeoutMs` 调整。Controller 另有 `timeoutMs`（默认 180 秒），限制不响应取消的自定义 adapter；实际等待受先到期的预算约束。所有请求复用既有 HTTP，使用 `credentials:omit`、`cache:no-store`、`redirect:error`，不自动重放探测或保存。

### 安全初态

`ModelProfileEditorData` 包含：

- `schema_version: 1`、`profile_id`、`version`。
- `config`：`provider_type`、`model_name`、`real_name`、`base_url`、`timeout_seconds`、`max_concurrency`、`disable_stream`、`capabilities`、`default_policy`。
- `defaults`：允许使用的 Provider 子集及各自权威默认配置。当前 Provider 必须在其中。
- `has_api_key`：是否已保存密钥；不返回明文、前缀或掩码。
- `header_names`：只返回已有 Header 名称，不返回值。
- `can_save`：前端保存动作的能力门控。

说明字段不属于本组件可编辑合同。`disable_stream` 保留在协议配置中，表单不显示开关；切换 Provider 时由后端返回的协议默认值决定。新增默认配置应来自 agentCore，不能把 Demo fixture 当作正式默认值。

### 候选请求与后端合并

目录、测试、保存共用 `ModelProfileCandidate`。例如修改记录并保持原密钥、清空 Headers：

```json
{
  "profile_id": "profile-123",
  "expected_version": "revision-7",
  "config": {
    "real_name": "example-chat",
    "api_key": "******",
    "headers": {}
  }
}
```

新增时同时省略 `profile_id` 和 `expected_version`；修改时两者必须同时提供。前端只提交显式修改字段和密钥规则要求的值，不在前端把旧记录与默认配置合成完整有效配置。

后端先鉴权：有 ID 时加载对应记录及版本，无 ID 时使用对应 Provider 的权威默认配置，再覆盖请求中明确出现的字段。`0`、`false` 是有效值；`headers`、`capabilities`、`default_policy` 整项替换，不做隐式深合并；`default_policy:null` 表示清空策略。后端校验 Provider、URL、出口与凭据使用权限，然后按操作执行目录、测试或保存。

**AgentCore 执行入口只接收后端处理完成的明文 Profile**，其中 API Key 和敏感 Headers 已还原为本次实际使用值。`ModelProfileCandidate` 是 xui 与项目后端之间的协议，不能原样转发给 AgentCore；AgentCore 不接收掩码、不按 `profile_id` 查密钥、不合并草稿、不读写项目存储。完整流程是：鉴权 → 读取原配置或 AgentCore 默认配置 → 应用显式 patch → 解析凭据 → 校验有效配置 → 调用 AgentCore。目录和测试不写入配置，保存走项目既有 CAS/持久化 owner。

### 密钥与 Headers

| 输入 / 请求 | 处理规则 |
| --- | --- |
| API Key 为 `******` | 固定六星号保留标记，后端按授权 `profile_id` 读取原密钥；新增或记录无原密钥必须拒绝，不能将标记传给 AgentCore 或上游 |
| API Key 为 `""` | 明确不使用密钥；保存时清空 |
| API Key 为其他字符串 | 作为本次候选的新密钥；只有保存操作持久化 |
| 底层候选省略 `api_key` | 沿用基础配置；默认表单会根据是否已有密钥明确提交六星号或空字符串 |
| Headers 编辑框初始 `{}`，未编辑 | 候选省略 `headers`，保留后端已有配置；页面不回填原 Header 值 |
| 直接编辑 Headers JSON | 提交完整 `Record<string,string>` 替换原对象；编辑并提交 `{}` 清空 |

页面没有密钥处理或 Headers 处理选择器。Headers 必须是 JSON 对象，值必须为字符串，不能提交 `null`、数组、非法 Header 名或包含换行的值。非法草稿保留供用户修正，并阻止操作。重置/保存成功后，API Key 回到空值或六星号，Headers 编辑框回到 `{}`。

密钥和 Header 值只在输入控件及单次请求作用域短暂持有，不进入 Controller 公开快照、URL、storage、普通日志或原始错误反馈。身份切换应立即 `clear()` 或卸载旧编辑器；后端必须在返回摘要和错误前脱敏。

## Provider、目录与测试

| Provider ID | 协议类型 | 目录按钮 |
| --- | --- | --- |
| `openai_completions` | Chat Completions | 可用 |
| `openai_responses` | Responses | 可用 |
| `openai_images` | 图片生成 | 可用 |
| `openai_embeddings` | 文本向量 | 可用 |
| `gemini` | Gemini 聊天 | 不发目录请求，手工输入真实模型名 |
| `anthropic` | Anthropic 聊天 | 不发目录请求，手工输入真实模型名 |

上述枚举与 agentCore 对应；表单仅显示 `defaults` 允许的子集。目录请求不要求先填写真实模型名，不从模型名称猜测能力，不因拉到目录就标记模型测试通过。所有协议均允许手动填写真实模型名。

向量测试额外提交 `embedding:{input:string[],dimensions?:number}`；表单当前提供一条测试文本和可选正整数维度。它们属于单次测试，不保存进 Profile。向量策略为 `null`，不展示聊天能力与聊天策略。测试返回 `kind:'embedding'`；成功时必须有实际 `embedding:{count,dimensions}`，不返回完整向量。

后端复用 AgentCore 的 `ListModels`、`TestModelProfile` 和 `Embed` 能力；接入时核对所用版本是否已提供按 Provider 获取默认 Profile 及统一向量测试入口，缺口交 AgentCore，不复制默认参数或探测算法。不能把不支持 embedding 的聊天测试直接用于向量协议。连接测试可能产生上游费用，但本 API 不持久化配置或测试状态；默认保存不隐式测试；宿主明确选择 BaseService `SaveWithTest` / `TestBeforeSave` 时，后端在事务外先测试再保存，前端仍只发一次保存请求。明确测试失败仍可保存为未测试；不能把“已保存”展示为“测试通过”。后端应在影响执行的配置变更后失效旧验证事实。

## 保存结果与 BaseService 合同（4.2.40）

HTTP 200 / AjaxResponse `success:true` 仍返回原 `ModelProfileEditorData`。BaseService `llmservice` 的三个保存异常使用 HTTP 503 / `success:false`，安全 payload 为：

```ts
{
  outcome: 'committed' | 'unknown';
  operation_id: string;
  profile_id?: string;
  test_failed: boolean;
  completion_failed: boolean;
  editor?: ModelProfileEditorData;
}
```

| code | 事实与严格组合 | 公共组件行为 |
| --- | --- | --- |
| 50310 | `outcome:'unknown'`；两失败标志为 false，无 editor | 保留结果未知和禁止重写；不调用 onCommitted/onSaved，不推断保存成功或回滚 |
| 50311 | `outcome:'committed'`、completion_failed=true；test_failed 可同时为 true；无 editor | 清理脏状态与私有凭据；调用 onCommitted；锁定旧视图，要求显式重读后继续编辑 |
| 50312 | `outcome:'committed'`、test_failed=true、completion_failed=false；必须带 profile_id 与已验证 editor | 安装权威配置和版本、清理草稿/凭据；调用 onCommitted 和 onSaved；Toast 明确已保存但测试未通过 |

50311 同时携带 test_failed=true 时，两个失败事实都保留；测试失败不能掩盖后置失败。异常响应不能回传原始上游错误、明文 API Key 或 Headers 值。Client 只解析固定 code/status 和上述 payload，矛盾、越界 ID、非法快照、损坏响应仍按未知保存处理，不能靠一段错误文案猜测是否提交。普通 HTTP 行为和全局错误反馈保持原合同。

`ModelProfileAdapter.save` 支持原 EditorData 或公开 `ModelProfileSaveReceipt`。Client 把上述异常映射为安全 receipt：`status:'committed'|'unknown'`，保留 operation_id/profile_id 和已提交分支的 test_failed/completion_failed/editor。Controller 的 `saveReceipt` 持有最近结果；`save()` 返回本次 receipt，未取得有效结果、取消或退出作用域时返回 undefined。普通成功也产生 committed receipt，但不代表测试通过。所有保存行为只由一个 Controller 和服务处理，宿主不自行改写 DTO。

已提交但没有 editor 时，旧字段仍只是原草稿的只读视图，不能当新版本继续写。后端若提供可信 profile_id（包括新增），组件的“重新读取”调用该 ID；缺少 ID 时只有 operation_id，宿主先核对真实创建结果，再 `load(确认的ID)`，不能 reset/load(null) 开启重复新增。未知提交同样不允许盲重放。重读是显式用户/宿主动作，组件不自动查询或重试。

有效 editor 的已提交结果在未产生新编辑前禁用重复保存；编辑后使用返回的新版本。收到确认后显示安全 Toast，不插入成功块挤动布局；需要重读才能继续的持久限制留在操作区域。回调观察者抛错不会改变提交事实。取消、卸载、身份切换和旧代迟到结果不能触发旧 onCommitted/onSaved 或通知；语言/主题变化不重发通知或请求。宿主回调若关闭视图，建议注入现有 toastController，使错误反馈保持可见。

## Controller 处理流程

主调用链为：表单动作 → Controller 校验/构造 patch → Service/HTTP → 项目后端合并与调用 agentCore → 严格解析结果 → 同一 Controller 更新视图。

| 动作或状态 | 行为 |
| --- | --- |
| 初次显示 | 无 `initial` 时自动读取；有安全初态时直接显示。无自动轮询 |
| `load(null)` / `load(id)` / `load()` | 分别进入新增、切换对象、重读当前对象；显式读取丢弃旧草稿 |
| 修改字段 | 跟踪显式 patch，旧测试结果失效；连接、Provider 或凭据变化同时取消旧请求并清旧目录 |
| 同连接刷新目录 | 等待时保留旧目录；成功替换；空目录仍可手工输入 |
| 切换 Provider | 仅从后端 `defaults` 投影协议相关能力、策略与流式字段；有效候选最终由后端校验 |
| 校验失败 | 保留输入，字段关联错误并聚焦；不发送请求 |
| 测试/保存等待 | 防止重复操作；保存锁定编辑；取消入口可达 |
| 取消、切对象、退出后迟到响应 | Resource 与请求代次隔离，不能覆盖新对象或弹出旧成功反馈 |
| `reset()` | 无请求地恢复最近确认配置，清理秘密与测试结果；不是重新读后端 |
| 保存确认 | 产生 committed receipt；有 editor 安装新版本并调用 onSaved；所有确认提交调用 onCommitted。失败标志分别反馈，不假装测试通过 |
| 已提交但缺 editor | 清理脏状态与秘密，锁定编辑/重写；已知 ID 可显式读取，缺 ID 先由宿主核对 operation_id |
| 保存明确拒绝 | 保留草稿，反馈失败；根据权限、校验或版本冲突处理 |
| 保存结果未知 | 超时、断连、取消等待或无效成功响应不能证明未提交；阻止重复保存，不自动重放 |
| 未知结果核对 | 修改记录可显式重读已知 ID；新增需宿主查明创建结果后 `load(确认的ID)`，不能靠重读默认配置解除阻断 |
| 抽屉关闭 | 有草稿/待确认保存时先确认；放弃关闭清理私有作用域并恢复焦点 |

`getState()`/`subscribe()` 提供不可变安全快照。默认自建 Controller 由组件管理生命周期；注入 Controller 的销毁归宿主，视图退出仍清理私有编辑数据。语言、主题或缩放变化只改变展示，不重建 Controller 或触发业务请求。

## Layout 与 slot

表单复用公共 `FormGrid`、`Fieldset`、`Field`、`PasswordInput`、`Combobox`、`Disclosure`、`FormActions` 和 Sheet。字段字体、颜色、间距从公共主题继承。

- 名称与 Provider 两列；真实模型名与目录按钮共用一个字段区域。
- Base URL 与 API Key 使用同一 FormGrid：净宽至少容纳两份 `--layout-field-min` 加一份 `--layout-field-gap` 时同行，否则自动单列。默认字段下限为 `15rem`，阈值随主题、阅读缩放和实际容器宽度变化，不按整个屏幕写死断点。
- 运行参数与常用策略复用上述网格；模型能力使用紧凑 Checkbox。
- 高级 Headers/策略 JSON 按需展开；成功和临时失败通过 Toast，不插入挤动内容的提示块；保存未知结果保留阻断反馈。

正式扩展点统一接收 `{controller,state}`：

| slot | 内容归属 |
| --- | --- |
| `afterConnection` | 连接区域后补充宿主确需的内容 |
| `advanced` | 高级配置内容 |
| `actions` | 次要操作区，保留公共测试/保存主动作 |
| `result` | 替换安全测试结果展示 |

扩展复用同一 Controller 和请求 owner；不穿透内部 DOM、覆盖私有 CSS 或另建认证/保存逻辑。

## 示例与验收入口

仓库 `examples/model-profile-react/` 提供新增/修改、聊天/向量、Sheet、慢响应/失败/已提交测试失败/后置失败/结果未知、只读/禁用、长中文、主题和阅读缩放的 Mock 页面。构建后访问 `/model-profile-react/`。

- `pnpm build`、`pnpm typecheck`：构建与类型。
- `node --test tests/model-profile.test.mjs`：候选、秘密、取消、并发、未知结果等针对性回归。
- `pnpm test:consumer`：独立 tarball 的 ESM/CSS/types、React peers 单实例和示例构建。
- `pnpm exec playwright test tests/browser/model-profile.spec.mjs`：在 `test:consumer` 之后验收正式包示例、主题、窄屏、阅读缩放与真实浏览器缩放。
- 按 [MODEL-001～008](https://github.com/coffeehc/xui/blob/main/docs/ADOPTION_CHECKLIST.md#模型配置逐项检查) 验收实际页面和真实后端请求；Mock 成功不代表产品接入完成。

源码实现为 `packages/ui-react/src/model-profile.tsx`，运行态位于 `packages/runtime/src/model-profile*.ts`。组件目录 README、公开类型、既有规范和示例应随合同变更同步更新。
