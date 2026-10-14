# Bearer v2 鉴权接入与验证记录

> 本页为既有 v2 里程碑的历史验证记录；当前登录异常路径已改为普通会话单次核验和手动重试，持久恢复门禁已移除。现行合同以 [AUTH](AUTH.md) 为准。

日期：2026-10-12。范围：xui 公共 auth/HTTP owner、两个登录页及正式消费者；起点 `91fd32148a09b0ac33936a5ebf04a209b35173d0`。不改业务项目、不部署、不访问用户本地电脑、不生成真实凭据。正式合同见 [AUTH](AUTH.md)。后端固定来源为[baseservice a10b291](https://github.com/coffeehc/baseservice/commit/a10b291b4d562b9e282399c0e3fa89dbb02bf7c8)，共享fixture SHA256为`8255004f9e8256c05626050e1522b6e00efd9bc11bcb0aa23baddd05ee93cb08`。

## 发现、证据、处理与下一步

| 现象/风险 | 影响、证据和已尝试处理 | 当前状态/下一步 |
| --- | --- | --- |
| 原认证只有v1 cookie用户投影，无法消费短期Bearer会话 | 原auth.ts仅login/session/logout和schema_version1；与baseservice认证scope/purpose不匹配 | 改为严格v2及POSTrefresh；共享HTTP内部绑定，业务显式protectedPaths、Bearer/omit/error；不添加猜测兼容链 |
| 默认location.assign销毁内存access | 只把token改内存会导致整页导航后丢失登录 | currentUser先一次恢复cookie，再session Bearer核对；保留默认全页导航；新增两端真实fetch/HttpOnly合成cookie导航浏览器用例，需同SHA CI执行 |
| 共享header provider可能给cookie端点混入Bearer | 无端点上下文的全局开关在并发下可能泄漏/混用scope | 用package-private request capability标记固定auth端点；冲突Authorization/Cookie/X-API-Key在发送前拒绝；绝无全局boolean切换 |
| 多401/迟到旧代响应与取消等待者 | 可能重复rotation、清较新登录、错误终止其他调用者 | access generation + HTTP authEpoch；refresh/session singleflight，调用者signal仅detach；unit覆盖外部401通知、旧代响应和并发写不重放 |
| refresh/logout并发cookie mutation | logout可能用已经消费的旧cookie；JS不能撤回浏览器Set-Cookie | 本地队列+Web Locks，接受状态和发epoch都在锁内；logout清本地access并排在在途refresh后；合成延迟测试覆盖次序 |
| 登录完成通知中同步启动下一轮refresh | 已复现login返回null，原因是完成路径从已被新意图清理的state读取user | 捕获本次已接受generation与user；新意图抢先时旧login按cancel结束且不覆盖新refresh，增加重入回归 |
| HTTP epoch早于实际取得access | 首次业务请求自己bootstrap后立刻401，曾复现外部通知0次而应1次；另有本地零发送401不应冒充真实HTTP响应 | 受管请求在取得access时绑定HTTP epoch；callback只依据实际response status。新增新代1次、旧代0次、零发送0次回归 |
| 不同tab的旧login/logout消息迟到 | 仅广播不比较代次，可能错误清新登录；后续refresh也可能遮住遗漏identity变更 | 广播仅kind/epoch；localStorage只存epoch/identityEpoch/kind排序元数据，无user/token。回归覆盖迟到、乱序与漏掉identity事件；无可靠锁/存储的环境仍以服务端409失败关闭，不承诺透明恢复 |
| refresh409、未知commit50301、已提交后续失败50302、取消/网络丢响应 | 盲重试或logout补救可能产生多凭据、清合法cookie或撤销有效family | unknown+reauthenticationRequired；只允许新login确认状态，不自动再refresh、重放业务写或清cookie。本轮无KMS/加密秘密回执；丢响应可能需重新登录 |
| 后端原始错误可能含不适合公开的数据 | 直接在AuthState保留business error投影会暴露未知服务端message | auth owner克隆安全HttpError metadata，不把原始business投影放state；固定文案展示；后端仍须保证request_id可公开 |
| v2 user.id为十进制int64，部分新业务设计要求hex | 自动接受两种ID会弱化共享合同，也会把业务转换藏入库 | 基线保持明确十进制wire；后续新增闭合显式 idEncoding，见 [身份编码增量记录](IDENTITY_ENCODING.md)，不以本表历史结果冒充新验证 |
| 首次完整build的ui-react声明生成被SIGKILL | 无TypeScript诊断；同容器10GB内存当时已用约8GB，且其他仓库并行编译 | 暂停并行重型编译后串行重跑build通过；不是代码错误，也不把被杀的一轮算通过 |

## 本地验证与环境边界

- 已完成独立auth/http编译和17项初步安全回归，随后正式build通过。
- 正式dist上的48项auth/http/跨tabfocused回归通过，含与baseservice `docs/contracts/auth.v2.json` 字节一致的fixture、8类错误码和超过JS安全整数的ID。
- 重入守卫之前的候选已完成build、check:tokens、typecheck、321项全unit、全部正式tarball消费（原生零React、React peers单实例、ESM/CSS/types与gzip门禁）及634项浏览器全集收集。最后重入守卫已重新通过完整build、check:tokens、typecheck与322项全unit（0失败/跳过）；最终SHA完整tarball、watch、cold-start与浏览器由CI重新执行，收集不是浏览器通过。
- 本执行环境已有Chromium/socket限制，不重复启动、绕过限制，或以测试收集代替浏览器执行。watch、cold-start和真正Chromium回归交由同一提交SHA的GitHub Actions完整 `pnpm verify`，推送后持续核对直到终态。
- 浏览器fixture使用合成凭据和development-only恢复cookie，测试前端的真实fetch/全页导航、HttpOnly不可读、session omit与cookie端点无Bearer；不是生产Secure cookie、真实CSRF、真实PostgreSQL/family撤销或真实产品登录验收。
- 单元Web Locks/BroadcastChannel测试为受控模拟。跨tab真实浏览器行为、浏览器缺失存储/锁时的竞争、任意延迟Set-Cookie、第三方认证链、Wails、移动OS、读屏器、Firefox/Safari、SSR hydration和生产负载仍需对应环境验证。

## 发布与采用

本里程碑仅普通Git提交到xui main；验证前不把dirty树推荐为稳定依赖。推送后核对远端main SHA，再检查该SHA完整CI。CI尚未完成或受限时明确区分已通过、失败、未运行，不称“全链生产鉴权已完成”。消费者更新固定SHA后，需按自己的后端route policy/CSRF/用户来源/资源权限完成实际接入。
