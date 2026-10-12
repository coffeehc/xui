# 显式实体身份编码

日期：2026-10-12。增量基线 xui `176408042d602d178bc9b2dc64332d0c902db0fe`、baseservice `a10b291b4d562b9e282399c0e3fa89dbb02bf7c8`；后端正式增量已验证并推送 [fa07927](https://github.com/coffeehc/baseservice/commit/fa079272c647ca77b4ddd491d5e39c0f007c536c)。这项扩展使产品在保留默认 decimal 合同的同时，明确选择 hex；不增加认证 owner、token store 或第二套 HTTP。

## API

从 `@coffeehc/xui-runtime/entity-id`（或根入口）导入 `EntityIdEncoding` 与 `parseEntityId`。编码类型只有 `'decimal' | 'hex'`；`parseEntityId(value, encoding = 'decimal')` 返回验证后的原字符串，绝不返回 JS Number、自动改写或推测格式。

- decimal 为无前导零的正十进制，最大 `9223372036854775807`。
- hex 为无前缀、无前导零的小写正十六进制，最大 `7fffffffffffffff`。
- 数字类型、零、负数、符号、空白、hex 大写/前缀和溢出均拒绝；未知编码抛 TypeError。
- 两种字符集合存在交集。`"10"` 在 decimal 中表示十，在 hex 中表示十六；hex 的 `"1e3"` 合法。前后端必须选同一合同，无法通过外观可靠识别配置错误。

`createAuthClient({http, idEncoding:'hex'})` 统一校验 login/refresh/session 的用户 ID。`parseAuthSession(value, 'hex')` 是相同安全 DTO 的公开解析入口；含秘密的签发 parser 仍不公开。未知配置在任何网络请求或绑定认证 owner 前拒绝。

`createApiKeyHttpAdapter({http, idEncoding:'hex'})` 对 list/create metadata、revoke/delete 确认与目标路径使用同一编码。`parseApiKeyWireMetadata(value, 'hex')` 可单独解析。非法动作目标在发出前拒绝，返回 ID 与原目标必须精确一致。permissions/expiry 的 ID 是业务代码，保持原合同，现有写 body 没有实体 ID 字段。

默认不传选项等同 `decimal`。对应 baseservice 两个 facade 的 `Options.IDEncoding` 都应明确为 `idservice.HexIDEncoding`。后端的 `idservice.IDEncoding.Encode/Decode` 在 int64 与 wire 之间转换，内部模型、鉴权、数据库与密文 AAD 不变。

## 迁移与安全边界

发现旧固定 Key HTTP parser 允许任意非空字符串，而后端早已严格 decimal。本次纠正固定 HTTP 边界；纯 `ApiKeyAdapter`、controller/React/原生视图仍可处理宿主自己的不透明 ID，不把所有领域 adapter 强制变为数值身份。依赖旧固定 HTTP 的非规范 ID 示例已改为合成 int64；真实第三方协议应使用明确领域 adapter。

发现两库旧 page fixture 的 ID 不同：本次将 xui decimal fixture 同步为 base 现有字节，并新增 hex 认证与 Key fixture。业务日志 fixture 只同步已有默认身份，没有新增日志 hex 选项。不能把两个 fixture 使用同名文件当作已经联调的证据。

Cookie、Bearer 隔离、memory-only access、CSRF、跨标签协调、取消/迟到结果、不自动重放、未知写入保护沿用 v2。后端确认提交后出现非法投影仍返回 50302，无 Cookie/秘密，不能称为回滚。前端将错误视为失败，签发解析失败要求重新登录，不暗中回退另一种编码。

## 验证与限制

[共享身份矩阵](../tests/fixtures/contracts/identity-encodings.v1.json)、[hex 认证 wire](../tests/fixtures/contracts/auth.v2.hex.json)、[hex Key wire](../tests/fixtures/contracts/page-contracts.v1.hex.json) 与 base 同字节；默认认证和 page fixture 同时保留并运行。包含 MaxInt64、超过 JS 安全整数的 ID、零、前导零、大写、溢出、未知格式和非法类型。

`tests/entity-id.test.mjs` 经实际 auth owner/API adapter 检查 login/refresh/session/logout、Key list/create/revoke/delete、发送前失败、响应失败、无重放和不泄露；已有 v2 全部安全回归继续运行。正式 tarball 消费验证新增 ESM、types 和根导出。2026-10-12 20:36 UTC，同一最终树 `pnpm build`、`pnpm check:tokens`、`pnpm typecheck`、`pnpm test:unit` 全部通过，332 项单元 0 失败/跳过，构建指纹 `8a60cd76d5b4`。包含同期表格独立修复，两个改动分别提交。`scripts/check-docs.mjs` 校验 78 个公开入口，五份默认/hex fixture 字节核对通过。

首轮新增 DESIGN 段落放到既有可逆扩展标记之外，332 项中 1 项原始 SHA 核验失败；已移入标准标记后重跑全链通过，未修改历史 sourceSha、降低或跳过门禁。固定 Key fixture 不一致造成的首轮定向失败也在同步真实默认合同后重跑，46 项全过。

本云执行环境已有 Chromium/socket 限制，不重复启动或绕过。watch、冷启动、双端完整 tarball 与真实浏览器由最终提交 SHA 的 GitHub Actions `pnpm verify` 验证；推送时其状态为待运行/待完成，不能将本地检查当作这些阶段通过。正式 tarball 脚本增加 `identity-contract.ts`，在原生与 React 独立安装中编译闭合编码选项、公开 parser 和错误类型用例。

只证明共享库与合成合同，不代表产品已注册路由、真实后端事务/权限/TLS/CSRF 通过。没有部署、生成真实凭据或修改产品。
