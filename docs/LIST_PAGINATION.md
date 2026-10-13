# 列表元数据与受控游标分页

## 统一协议与职责

统一后端 owner 是 commons/webfacade，融合旧 httpx/httpxcommons 响应能力。xui 消费同一 AjaxResponse 壳，不创建另一种成功/错误协议，不更改 success/code 的现有语义。标准 payload 为：

- list：数组；空结果为 []。xui 的已发布 parser 仍接受旧 httpx nil slice 的 null，只有显式 toListPage 才投影 []。
- total：可省略；省略表示未计算/未知，后端无需执行 COUNT。存在时为真实非负安全整数，包括真实 0；null、字符串与丢精度整数不被 xui 接受。
- next_cursor：可省略；非空、最多 4096 UTF-8 字节的 opaque string 表示下一次请求 token，null 表示 cursor 明确末页。字段缺失仅表示端点未声明 cursor 状态，不能当末页。可与 total 同时存在。

offset 端点可省略 next_cursor；cursor 端点每次明确给出 token 或 null。总数计算是 endpoint/查询 owner 的显式选择，组件与 parser 不发 COUNT、不强制每页计算、不凭当前数组长度推断总数或是否还有页。

新后端标准化到 commons/webfacade；旧 httpx 协议的阶段性兼容由后端迁移负责。此页与共享 fixture 不表示任何产品后端已迁移、生产 route 已上线或数据库 COUNT 性能已实测。

## 公开前端入口与迁移

1. 从 @coffeehc/xui-runtime/query 导入 ListData、parseListData、toListPage，保留已有 HTTP/resource owner。HTTP envelope 的解析和成功判断不变。
2. ListData.total 从必需 number 扩为可选 number，next_cursor 为可选 string|null。直接使用 total 的 TypeScript 消费者需要处理 undefined；旧带 total 的 wire 与调用行为保持。
3. toListPage 的 total 为 number|null；returnTotal:false 仍不将旧占位数当真实总数，即使响应有数也投影 null。returnTotal:true 时缺失同样为 null；实际计算出的 0 原样保留。
4. toListPage 仅在 wire 存在 next_cursor 时返回 nextCursor。cursor adapter 必须检查 nextCursor !== undefined，再将 string|null 传组件；不得写 nextCursor ?? null 掩盖未声明状态。
5. 已有 offset DataTablePagination 不用改形状，显式 mode:'offset' 可选。采用 DataTableCursorPagination 时只传 pageSize/total/nextCursor/hasPrevious 与受控回调，见 [DataTable](DATA_TABLE.md)。历史与查询变化重置仍由已有宿主掌管，控件不解码 token、不假造页数。
6. 不需要总数的新列表默认选择不计算；需要总数的现有 offset 功能按其显式合同请求。Key 管理全量 adapter 仍要求 total 来验证完整读取，业务日志默认 offset loader 同样要求 total；缺失时拒绝，不能误切 cursor 或猜结束。
7. serializeWebfacadeQuery 不变：page_index/page_size/return_total 和 filter/sort 合同仍显式。具体 cursor 请求参数留 endpoint adapter；库不新增未经后端定义的通用 query AST。

新端点采用 [commons 的严格 ParsePaginationQuery](https://github.com/coffeehc/commons/blob/2fd78215cf5321b9dc9b12d5f02c90567ce3cc71/webfacade/pagination.go) 时，cursor 请求使用 page_size 与显式 return_total=false；首屏省略 cursor，续页将原 token 交 URLSearchParams 编码一次，不发送 page_index，也不把 null/空串序列化成 cursor。端点显式声明模式、页大小上限和过滤字段；旧 offset serializeWebfacadeQuery 与页基数合同不变。后端服务/存储必须实际跳过 COUNT，仅把算出的 total 从 JSON 隐去不算完成性能目标。

## 示例与验证记录

正式 React/原生 DataTable 示例增加 ?cursor：不请求 total，服务端 fixture 发布真实 token 和末页 null；?cursor&cursor-total 展示二者共存仍无页码。宿主 resource 在成功后才提交 rows、cursor 和历史，失败/取消保留已确认事实，筛选和条数变化重置历史。不连接真实业务服务。

本轮修改不涉及 theme CSS、布局测量 owner、列宽验证/observer/colgroup 或 XAgent。

- 发现：正式 HTTP 双端示例在未知 total 时以 list.length 假造 pageCount，preview 无计数仍返回占位 0；已改为未知不显示编号翻页、无计数响应省略 total，并增加实际 HTTP 浏览器回归。
- 发现：旧 parser 强制 total 且 decodeItem 丢弃 next_cursor；旧 DataTable 的 unknown total 仅隐藏编号控件，宿主需在 footer 外加 cursor 交互。
- 修正：精确可选元数据与三态投影；新增显式受控 cursor 组合，保留 offset 合同与既有框内布局。
- 验证覆盖：共享 wire fixture、null/缺省/0/非法元数据、双端类型/正式 tarball、受控回调与防重复、首末页/空页/失败/取消/迟到响应、宽窄屏真实 footer bounds，以及全部旧布局/列宽回归。
- 本地 build、350 token/design checks、typecheck 与 344 项 unit 已通过（0 fail/skip），构建指纹 e7a6d60d9735；此初版双端正式 tarball/exports/types/peer/performance 也通过；随后补 HTTP 示例修正，已按下方最终结果重跑，没有沿用初版成绩。本地 Chromium/socket 已知受环境限制，不重试绕过，实际浏览器验收由 GitHub Actions 正常 pnpm verify 完成。
- 边界：未测试真实数据库 COUNT、产品权限/生产 route、其他浏览器/OS/读屏器或生产部署。

共享 fixture 的唯一源为 commons/webfacade/testdata/webfacade-list.v1.json；本仓逐字节镜像在 [tests/fixtures/webfacade-list.v1.json](../tests/fixtures/webfacade-list.v1.json)，SHA-256 为 d1d04bf74b24909dd7f8e4a27fa7b2a6fc2de17c6e8c3c79027d2450df9c4ed1。共 9 个标准有效响应、1 个 legacy nil-slice 响应、17 个无效响应；实际 HTTP adapter、parseListData、显式投影与 cursor DataTable 共同消费同一文件。正式来源已经正常推送并逐仓核对 remote master：commons [`2fd78215cf5321b9dc9b12d5f02c90567ce3cc71`](https://github.com/coffeehc/commons/blob/2fd78215cf5321b9dc9b12d5f02c90567ce3cc71/webfacade/README.md) 与冻结兼容的 httpx [`51e2a0a334f77ff79bf23b2ebc4c75de5a8e0814`](https://github.com/coffeehc/httpx/blob/51e2a0a334f77ff79bf23b2ebc4c75de5a8e0814/README.md)。[同一 fixture 源文件](https://github.com/coffeehc/commons/blob/2fd78215cf5321b9dc9b12d5f02c90567ce3cc71/webfacade/testdata/webfacade-list.v1.json) 与本仓镜像逐字节相同。此前未发布阶段不作为正式依赖来源；现在可以固定上述远端版本，但仍不能把合同检查等同真实端点/数据库或产品迁移验收。

独立只读审阅核对三态、控制回调、取消历史与 count-required adapter，未发现阻断。初版 consumer 仅有既有 npm http-proxy 配置警告，退出状态为 0；没有变更环境配置。

ACL/权限过滤后的有界扫描可连续返回空 list 与非空 next_cursor；这仍可继续翻页，不保证下一页含记录，也不表示剩余数量。仅显式 null 是 cursor 末页。DataTable 不因空行禁用下一页，React/原生都有独立回归；此补充不改变共享 fixture 的字节或 hash。

## 最终树本地结果（2026-10-13 UTC）

补修 HTTP 示例与 ACL 空页回归后的最终树重新执行：build（3822f58f81a3）、350 token/design checks、typecheck、347 项 unit（0 fail/skip），以及 React/原生独立正式 tarball 的全部 exports/types/peer/performance 检查，全部通过。648 项浏览器用例成功收集，其中新增 8 个 cursor 与 2 个真实 HTTP 无总数场景；收集不代表执行通过。

## 同 SHA 完整远程验收

实现提交 `682d45317c6f1711e36f9dc5e993509d19f93fb6` 的 [CI 38326203907](https://github.com/coffeehc/xui/actions/runs/38326203907) 已 success：build 指纹同为 3822f58f81a3，347 unit（0 fail/skip）、watch、React/原生正式 tarball、cold-start 及 **648 项实际 Chromium** 全部通过（浏览器 9.8 分钟）。这是执行结果，不是用收集数代替通过数。

新增 8 项 cursor 检查覆盖 React/原生 × 1280/390px 的前后翻页、真实 token、未知与已知总数、空末页、失败/重试、取消迟到、筛选/条数重置和 footer 四边 bounds；新增 2 项 HTTP 检查验证不计数响应确实省略 total、未知时不造编号页数、恢复真实总数后正常分页。既有全部列宽与布局矩阵亦通过。没有修改这些宽度/布局实现来放宽测试。

本地未重复尝试已知受限的 Chromium/socket 路径。xui 前端合同与正式消费者已验证，后端固定源码来源已发布；真实数据库/生产产品接入仍按明确边界单独完成。
