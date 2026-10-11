# 业务日志查询与可扩展详情

用途是随时调取查阅领域业务记录，提供通用字段、可扩展payload、筛选分页和详情。用户所说的“审计”指这个业务日志用途，不是正式审计体系；旧BusinessAudit命名在同一实现上统一改为BusinessLog，没有增加另一套页面。公共事件描述谁在何时对哪个业务对象做了什么、结果如何、关联哪些请求及允许披露的业务细节。现有 [错误观察功能](LOGS.md) 是独立功能，severity/错误分组/首次代表不能充当业务日志。完整通用规则仅在 [DESIGN.md](DESIGN.md)。

runtime/business-log 的 DTO、严格解析、loader 和单一 controller 被 React/business-log 的 BusinessLogExplorer 与 runtime/business-log-dom 的 createBusinessLogExplorer 共用。两类视图使用已有公开 Layout/Field/Table/Dialog/反馈和公共 CSS，没有新色板、私有皮肤或 Tailwind 扫描依赖。

## 固定公共字段与可扩展 payload

以下是 xui 自己明确声明的最小接入合同，以 [源码](../packages/runtime/src/business-log.ts) 和正式 declarations 为准；没有声称任何后端接口已上线。采用方可以直接实现 typed loader，未来通过版本化 HTTP DTO adapter 与 baseservice 对接，不直接暴露数据库模型。

| 类型 | 字段与事实 |
| --- | --- |
| BusinessLogEvent | id、event_type、schema_version、occurred_at、recorded_at、actor、object、action、result、summary、correlation_id、request_id。列表没有 payload |
| BusinessLogActor | kind 为 user/agent/service，id 为可信标识，display_name 为允许显示的字符串或 null。服务负责归属及代理授权，UI 不由名称猜身份 |
| BusinessLogObject | kind、id、display_name；整个 object 可为 null。不同领域自定 kind，UI 不自行生成对象路由 |
| result | succeeded/failed/denied/unknown；unknown 不伪装完成。异步任务、部分完成等领域事实进入对应 event_type/payload，adapter 必须明确结果映射，不能由 HTTP 200 或 severity 推断 |
| BusinessLogPage | list 和 page：不透明 snapshot_id、next_cursor（末段 null），无虚构 total/分组/offset 页码 |
| BusinessLogDetail | event、state（available/expired/unavailable）、payload（JSONValue）。后两种 state 的 payload 必须为 null；available 的 null 是合法业务值 |

schema_version 是 **对应 event_type 的业务 payload 版本**，正安全整数；未知类型/版本仍展示公共事实及安全 JSON。公共字段的变更需同步升级 xui 接入合同与采用方，不能因这个字段任意改掉公共摘要。HTTP 外层协议版本、服务 route 和业务事件词表由后续 adapter 明确，本库没有默认 route 或业务成功 code。记录和关联 ID 保持字符串；整数超过 JS 安全范围必须在 payload 编码为字符串，不能经过 Number 舍入。

occurred_at 为事件实际发生时间，recorded_at 为服务记录时间，均须完整 RFC3339（允许 1–9 位小数）。不同事件可定义审批意见、工具执行结果、允许披露的变更字段或其他 JSON 对象；不强制一份通用 before/after 结构。Go 端可用 any 或按事件类型定义接口，但网络返回前必须明确版本、JSON 编码、权限和脱敏。

JSONValue 只接受 null/布尔/有限数字/字符串/数组/普通对象，深拷贝冻结；拒绝 unsafe 整数、bigint、undefined、函数、getter、自定义 prototype、循环。前端展示边界是 UTF-8 JSON 最多 64 KiB、深度最多 16、节点最多 4096；服务 adapter 应在传输前按更严格政策约束，不让库静默截断。null-prototype 对象不执行特殊键。**允许扩展不代表可携带任意秘密**：禁止完整 API Key、凭据、token、敏感字段 before/after；后端按 event_type 的 allowlist 和权限投影，前端无法撤回已传输数据。

## 两个 loader 与过滤、分页

BusinessLogLoader 提供 `list(query,{signal})` 和 `detail(eventId,{signal})`。query 为 `{filter,page:{size,cursor}}`；每个回调返回上表准确 DTO，没有 response 别名猜测。已有 HTTP client 可以由宿主 endpoint adapter 包装；loader 本身不决定 auth、租户、URL 或数据库。UI 显式 refresh，默认 size=50、范围 1–200；合成示例 size=2 仅便于验证分页。读失败不自动重试，取消仅结束本地等待，不证明服务停止。

filter 明确支持 `[since,until)` 事件时间、actor kind/id、object kind/id、event_type、action、result、correlation_id、request_id；后七者为精确过滤，不做全文 payload 搜索或 query AST。actor/object 必须配对，未知字段拒绝，时间比较保留纳秒边界。允许不存在 object 的事件，但按对象筛选时必须两字段齐全。身份和 tenant scope 从服务可信上下文取得，不由公共 filter/body 自报。

首次 null cursor 创建固定快照，后续 cursor 必须绑定 scope/filter/顺序及快照；snapshot_id 必须稳定，cursor 保持不透明。服务提供稳定全序（推荐记录顺序与 ID 解冲突），UI 保留返回顺序，不从事件时间猜提交顺序。缓存上一段只保存当前查询链的摘要，不重发 null cursor；下一段显式请求。过滤或刷新建新链，刷新失败保留旧事实和原已访问段编号，同时禁用旧链导航。pageIndex 只是成功访问的段，不能用作服务页码或总页数。

controller 的列表与详情各有取消/generation；替换、关闭、卸载与 destroy 拒绝迟到结果。状态转换一次通知，订阅回调的新意图优先；订阅释放/重绑不在同一次通知无限调用。权限/身份/scope 切换须销毁旧 controller，不能把摘要缓存跨租户复用。

## 详情与公开 renderer

详情每次按事件 ID 授权读取。403、404、expired、unavailable 和一般错误明确区分，前端不根据本地时间推测保留期。关闭/Esc/卸载释放 controller 与 DOM 的详情引用；回到仍存在的触发器，触发器失效回刷新。对象 URL 只由 resolveObject、baseURL 和显式 referenceOrigins 映射，仅允许 HTTP(S)、无 URL 凭据、同源或已允许 origin；否则为普通文本。

使用原有领域方法时，loader adapter 将权限/不存在错误明确归一化为公共 HttpError（kind=http、status=403/404、attempts=1）；任意对象的 status 字段不自动认定为该事实。expired/unavailable 则返回上述详情 state，不能把权限异常映射成保留期结束。有限等待预算由宿主已有 client/loader 决定，controller 没有隐式 timeout。

默认 payload 以格式化 JSON 文本展示，HTML/URL/脚本字符串保持普通文本。宿主可通过公开 `renderers` 注册 `{eventType,schemaVersion,render}`：React 返回 ReactNode，原生返回本窗口 Node。按类型和版本精确选中第一个注册项；未知类型/版本使用默认 JSON。注册代码来自可信应用代码，不从 payload 加载组件、eval、执行 HTML 或动态 import 路径。定制 renderer 负责保持业务权限、文本安全与自身资源生命周期，不能拿它另造通用字段皮肤。renderer 抛错给固定安全反馈并显示 JSON，不暴露异常内容；不触发重新读取。

## 服务边界与实际采用

业务服务记录日志，并负责权限/tenant、脱敏、查询顺序/快照与保留政策。xui 提供只读查询与详情展示，不实施日志写入或正式审计保证。baseservice 的规划是将业务日志收敛到日志能力并取消独立auditservice；这是后续后端范围，本轮没有修改服务或预设其HTTP路由。已有typed loader可以立即接入，前端不等待后端重构。

已实现 [共享合成模型](../examples/shared/business-log-model.ts)、[React](../examples/business-log-react/app.tsx)、[原生](../examples/business-log-vanilla/app.js) 两类消费者，先本地打包再独立安装正式 ESM/types/CSS。pnpm build/test:consumer/preview 后访问 /business-log-react/ 和 /business-log-vanilla/。示例只注入 typed fake loader，没有访问真实业务、创建后端路由或生成秘密。未来 baseservice 后端 adapter 尚未落地，这不阻塞先使用当前 typed loader。

按 [采用手册](ADOPTION.md) 先逐页接入 xui；baseservice 并行完成后逐个替换后端 adapter，通过公共合同版本、消费方依赖、类型和回归联动升级。没有要求全部产品同时切换，也不在本轮修改任何产品或后端。 [测试](../tests/business-log.test.mjs) 与 [浏览器检查](../tests/browser/business-log.spec.mjs) 仅证明当前展示合同/生命周期，真实业务服务与权限/脱敏集成仍须采用项目另验。
