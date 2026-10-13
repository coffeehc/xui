# 带版本的访问凭据接入验证

日期：2026-10-13。固定后端来源：[BaseService 0f5dba4](https://github.com/coffeehc/baseservice/commit/0f5dba4392279ccf85bba262ae4f453ea57bd579)。

共享十进制 fixture SHA-256：`559a1d472fd3f189cde37587ece2d925900463ac8a634829fb70143e564712f7`；十六进制 fixture：`5e2eef7c840fe82732a65d55a8b8b3ba512ac8c795d7335e4a086c2f47a684d8`。

## 范围与合同

公共 auth owner 采用 BaseService 的 `<prefix>-v1-sha256-access-<secret>` 格式。prefix 是 1–32 位小写字母数字、首位字母；secret 是 32 字节随机值的规范无填充 Base64URL 编码。前端仅检查收到的 access 格式，不生成凭据、不验证服务端摘要、不据此前缀授予权限。刷新凭据和两类 API Key 不作为 access 接受。

密码由后端使用 bcrypt 验证；凭据中的 sha256 表示随机凭据摘要验证算法，与密码算法无关。未知版本、未知算法、错误用途、非规范编码和旧凭据格式失败关闭。DTO 的 `schema_version: 2` 与凭据的 `v1` 分别表示响应合同和凭据格式，不能混为一个版本。

内存持有、Cookie 恢复、scope/purpose 隔离、取消、并发刷新、未知写入与禁止自动重放仍遵循 [AUTH](AUTH.md)。本次不变更认证端点、布局或产品仓库。

## 回归内容

- bs、xagent、xapi、最短与最长合法前缀。
- 错误用途 refresh/keyh/keyr，未知算法/版本，非法前缀，超长、截断、填充、非规范尾位和末尾换行。
- 登录后安全状态不含访问凭据；解析失败继续要求重新认证。
- 默认十进制与显式十六进制共享 fixture 同步；原生和 React 示例使用相同正式 owner。

## 验证状态

本批在同一云环境的隔离 worktree 验证，仅含本次凭据变更，不混入同时进行的错误布局改造。

- 正式 `pnpm build` 通过，CSS/ESM/types/theme init generation：`3f16b8079997`。
- `pnpm check:tokens` 通过，350 个 token。
- `pnpm typecheck` 通过。
- `pnpm test:unit`：348/348 通过，0 失败/跳过。
- `pnpm test:consumer` 通过：原生和 React 独立 tarball 安装、公开 ESM/CSS/types、单实例 peers、布局/动态入口及 gzip 门禁。
- 两份共享 fixture 与固定后端提交内容逐字一致；`git diff --check` 通过。
- 本次未运行 watch、cold-start 或 Chromium；历史 AUTH_V2_VALIDATION 的成绩不作为本次成绩。

当前执行环境 Chromium 因 socket 权限限制在页面启动前失败，本次不通过修改沙箱或安全设置绕过。浏览器、真实服务端、PostgreSQL、生产 cookie 和实际消费者认证链路尚未验证；仅收集测试不算浏览器通过。
