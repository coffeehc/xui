# 结构化错误分组、观察与详情

这是此前实现的独立错误观察功能，不能作为本轮业务日志交付。业务日志使用 [BusinessLogExplorer 合同](BUSINESS_LOGS.md)，不把 severity、错误分组或首次代表映射成 actor/action/result。既有代码和历史提交保留。

这是实现接口；完整通用规则只在 [DESIGN.md](DESIGN.md)。runtime/structured-log 提供无框架类型、DTO 校验、HTTP bridge 和单一查询/详情控制器；React/structured-log 的 StructuredLogExplorer 与 runtime/structured-log-dom 的 createStructuredLogExplorer 生成完整只读页面，复用公共布局、表格、字段、反馈与 Dialog。没有额外日志皮肤或下游 Tailwind 扫描要求。

## 已读取的源码与当前范围

通过正常 Git 读取的固定来源为 commons 提交 `b0bc0f9bbb72b708fb9a7d251c033ba946d820f8`：

- [service.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/service.go)：Facts、ErrorRecord、ErrorGroup、四种 Reader 操作及可信 Scope。
- [query.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/query.go)：实际过滤字段、ID 升序、cursor 绑定、事务序号高水位、计数与读取时保留期判断。
- [record.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/record.go)、[extension.go](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/extension.go)：去重观察、首次代表、属性 allowlist/边界与脱敏。
- [README](https://github.com/coffeehc/commons/blob/b0bc0f9bbb72b708fb9a7d251c033ba946d820f8/logservice/README.md)：失败边界显式记录、默认 Detail/Stack 保留 7 天与宿主认证/授权职责。

这是结构化错误观察查询，不是自动收集全部 stdout 的日志平台。EntryCount 是去重后的已提交观察数，不是未解决故障、业务实体、重试次数或恢复成功数。本次只实现分组、观察列表和精确单记录详情；不提供写入、删除、清空、重放、投递运维、事件关联、stream 或业务恢复按钮。

该 Go 包没有 JSON tags，也没有上述页面所需的 HTTP facade。下方 snake_case、schema_version=1 的协议是 **xui 拟议接入合同，必须由宿主后端明确实现**；不能把 Go 默认字段编码、旧产品 offset/limit/newest-first 接口当成此协议。公开类型与默认行为以 [structured-log.ts](../packages/runtime/src/structured-log.ts) 和正式构建声明为准。

## 四个显式只读操作

createStructuredLogHttpAdapter(client,endpoints) 接收宿主给定的 groups、records、groupRecords、record 四个路径，向同源 HTTP client 发送 POST JSON，使用 [HTTP.md](HTTP.md) 的 Go AjaxResponse envelope；默认以 success=true 判定业务成功，code 保留为必填安全整数元数据，不要求固定值或额外 adapter。POST 在这里是明确定义的查询，客户端不自动重试；页面上的重试由用户触发。也可直接提供符合 StructuredLogAdapter 的四个回调。

| adapter | Go Reader | 请求 JSON | envelope.payload |
| --- | --- | --- | --- |
| groups | Query | schema_version、filter、page | LogGroupsPage |
| records | QueryRecords | 同上 | LogRecordsPage |
| groupRecords | Detail | 同上，加 group_id | LogGroupRecordsPage |
| record | GetRecord | schema_version、record_id | LogDetailResponse |

page 为 `{size:50,cursor:null}` 或上一响应给出的不透明 cursor；50 是源码默认值，范围 1–200。本例显示 size=2 只为演示多段，不更改库默认值。filter 的未指定 scalar 为 null、facet 为 []。Scope 的 application/environment/tenant 只由服务端可信装配和认证上下文绑定，绝不接收公共 query/body 字段。host 必须分别验证列表权限与详情权限，清理未知请求字段并按配置限制 body。

## 明确 DTO 投影

所有响应都有数值 schema_version=1；分页数组只叫 list，不猜 items/data/records 别名。分页响应 page 有 RFC3339Nano 的 as_of 和 next_cursor（末段 null）。时间字段为 RFC3339Nano 字符串或明确 null；Go 零时间映射为 null。前端保持原字符串，并以纳秒精度验证/比较时间区间，不把细粒度边界转成 Date 毫秒。

| 类型 | 字段与语义 |
| --- | --- |
| LogFacts | source、nature、category、severity、component、operation、code、summary；retryable/user_fixable 为 true/false/null；request_id/trace_id 为 string/null；subject 为 `{kind,id}`/null。summary 和 source 非空 |
| LogRecord | id、group_id、occurred_at、recorded_at、details_retained、facts；没有 Detail/Stack/Related/Attributes 正文 |
| LogGroup | id、key_version、first_seen_at、last_seen_at、entry_count、representative（LogFacts） |
| LogGroupRow | group、matched_entry_count |
| LogGroupsPage | list、matched_groups、matched_entries、page |
| LogRecordsPage | list、page；没有 total |
| LogGroupRecordsPage | list、page、group；没有 total 或杜撰的分组过滤总量 |
| LogDetailResponse | record 为 LogRecordDetail：LogRecord 加 detail/stack（string/null）、related（Ref[]）、attributes（已允许且脱敏的 string map） |

entry_count、matched_entry_count、matched_groups、matched_entries 是 **uint64 范围内的规范十进制字符串**，最大 `18446744073709551615`；后端直接用 uint64 十进制格式化，不能先转 JavaScript Number。前端拒绝数值、前导零、负数及溢出，原样显示计数，不产生精度丢失。ID 保持不透明且满足 Go 的 1–256 字节安全标识格式；不据此生成业务路由。

backend DTO mapper 须显式 snake_case 标记、正确投影 nil bool→null、空 request/trace/subject→null、nil list/related→[]、nil attributes→{}、无 next cursor→null；不能直接 marshal Facts/ErrorRecord 充当摘要响应。**在网络返回前就从所有列表与 representative 去掉 Detail/Stack/Related/Attributes**，仅授权后的单记录读取返回详情。前端 allowlist 再剔除意外额外字段并冻结快照，它不能替代后端脱敏或撤回已经传输的敏感正文。nature/severity 使用源码枚举，category/source 是宿主维度；未知布尔值显示“未知”，不伪装成否或从 severity 推断。

## 分组事实与过滤命中

group.entry_count 是当前固定查询快照内该组所有观察的累计数；row.matched_entry_count 只计当前 filter 的观察。matched_groups/matched_entries 是整个过滤结果的计数，不是当前 list.length。group first_seen_at/last_seen_at 按该组发生时间的最小/最大值，仍是全组事实。

representative 是分组创建时首先提交的观察的摘要路由元数据，不是最新记录、不保证是最小 occurred_at，也不随当前 filter 替换。过滤“error”可能返回 representative 为 warning 的分组，这是该组存在匹配观察；页面保留首次代表、累计数与过滤命中数的区别。查看组内观察发送同一个 filter 加精确 group_id，不取旧接口的固定 20 个样本替代分页。

## 实际过滤与 cursor

支持 occurred_at 的 `[since,until)`、sources/natures/categories/severities 集合（每类最多 50 项）、component/code 精确值、subject 的 kind/id 配对及 text。text 最大 512 **UTF-8 字节**，只在 summary/source/category/component/code 五个脱敏字段中不区分大小写搜索；operation、Detail/Stack、request/trace、related 与 attributes 不在搜索范围。不添加查询 AST、任意排序、request-id 假筛选或 unsupported 状态字段。source/category 的候选值由宿主显式提供；默认不读取业务枚举接口。

cursor 最多 4096 UTF-8 字节，作为不透明值透传，绑定服务端 scope、查询类型、filter；组内 Detail 另绑定 group_id。首次 null cursor 建立数据库时间 as_of 与事务序号高水位，后续段固定该快照，稳定 ID 升序。新提交记录要刷新新快照才出现，不使用 webfacade 页码、offset、跳页或虚假末页/total。

控制器只为当前查询链保存已访问的**摘要页**，previous 返回缓存段，避免将 null cursor 重新发送而误建新快照。next 继续服务端 cursor；检查 as_of 一致和 cursor 循环。visited pageIndex 仅指已成功显示的段，不是协议页码。过滤、查询类型、分组或刷新会清除旧 cursor/缓存；刷新失败保留此前可读事实及原段编号，禁用旧链导航。缓存随访问增长，宿主应在离开页面/切换身份或 scope 时 destroy，不能复用跨租户控制器。列表的 details_retained 是当时读取事实，查看详情仍重新读取，不能凭缓存判断当前正文保留期。

## 详情、权限与生命周期

单记录详情按 ID 独立读取，另有 request generation；403 显示无权限，404 显示当前 scope 未找到，成功且 details_retained=false 显示保留期结束。这三种事实不能互相代替。Detail/Stack 到期即按读取时间隐藏，未执行物理 Prune 也不可返回；前端不根据本地时钟推算保留期，不将 7 天硬编码为所有产品政策。过期记录仍保留摘要元数据，客户端也强制将意外返回的 detail/stack 置 null。

默认视图显示记录/分组 ID、发生/记录时间、分类/组件/操作/错误码、三态标记、request/trace、对象和关联对象、详情/调用栈与允许的属性。所有自由文本经 React 文本节点或 textContent/pre 展示，绝不 innerHTML、执行 HTML 或自动识别可点击 URL。resolveRef(ref) 是宿主唯一对象路由映射；需明确 baseURL，只允许 HTTP(S)、无 URL 凭据、同源或 referenceOrigins 的显式 origin；没有映射就显示普通文字。

只有当前已授权详情中的 request/trace 提供明确点击复制；可由 writeClipboard 一次注入写入函数。失败就地可见，没有自动复制或 Toast owner。关闭/Esc、详情替换、页面离开与卸载释放 controller/DOM 中的详情引用，迟到读取/复制不能复活旧弹层。不能承诺 JS 安全擦除或撤回 OS 剪贴板；后端须在返回前确保元数据允许展示。

查询替换/取消即使遇忽略 Abort 的 producer 也结束本地等待并拒绝旧结果；这不证明服务端停止。列表刷新保留旧事实与持续错误，必要错误不用消失通知代替。详情失败只在明确操作下重读；取消不保存或执行业务动作。Dialog 采用既有 keyboard/focus/reduced-motion 行为，关闭回到仍可见触发器，否则回到刷新按钮。

## 已运行消费与接入责任

[React 示例](../examples/log-react/app.tsx) 和 [原生示例](../examples/log-vanilla/app.js)/[HTML](../examples/log-vanilla/index.html) 共用 [typed fake facade model](../examples/shared/log-model.ts) 与 [labels](../examples/shared/log-labels.json)，经 [正式 tarball 消费](../scripts/consumers.mjs) 编译/打包；原生不安装 React，也不使用源码 alias 或示例私有 CSS。pnpm build、pnpm test:consumer、pnpm preview 后访问 /log-react/、/log-vanilla/。

这里注入合成 fetch，使用显式假路径，不实现 loopback 后端，也不连接产品。测试只有展示合同与生命周期证据，不证明 Go/PostgreSQL、真实认证/脱敏、tenant 隔离或产品集成通过；详情复制用模拟 Clipboard。控制器 [逻辑测试](../tests/structured-log.test.mjs)、两类 [浏览器测试](../tests/browser/structured-log.spec.mjs) 与限制见 [验证记录](FOUNDATION_VALIDATION.md)。

生产采用时先补明确 facade/DTO mapper、后端 scope/权限/错误映射、预算与脱敏，再保留产品必要业务行为后清理旧错误观察 owner。宿主稳定创建一个 controller，首次明确 refresh；React 传给 StructuredLogExplorer，原生传给 createStructuredLogExplorer(root,{controller})。视图不拥有外部 controller：卸载/页面离开关闭详情并取消读取；宿主释放自身订阅后 destroy controller/client，原生同时 destroy view。接入迁移见 [ADOPTION.md](ADOPTION.md)，不得用本例通过宣称产品已迁移。
