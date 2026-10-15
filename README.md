# xui

通用前端组件与主题：统一React UI、TypeScript服务与工具、公共CSS/Token、公共布局、交互与可选页面组合。宿主负责业务 API、领域数据、业务 UI 和产品流程；选用默认 HTTP client/页面 adapter 时满足相应合同，也可使用公开 typed adapter/loader 接入领域能力。

| 文档 | 用途 |
| --- | --- |
| [ADOPTION](docs/ADOPTION.md) | 安装、主题、组件分层、开发联调与迁移 |
| [DESIGN](docs/DESIGN.md) | 唯一完整设计规范与默认主题生成源 |
| [COMPONENTS](docs/COMPONENTS.md) | 组件使用、组合、状态与生命周期，按章节查阅 |
| [PUBLIC_API](docs/PUBLIC_API.md) | 全部公开入口、HTTP/认证/Key/日志运行时合同 |
| [VALIDATION](docs/VALIDATION.md) | 实际验证结果、未完成与未测范围 |

Codex 接入流程：[adopt-xui](.agents/skills/adopt-xui/SKILL.md)。

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium # 已有 Chromium 可省略
pnpm verify
pnpm preview
# 另一个终端：pnpm dev（构建状态与自动恢复）
```

参考页默认由本地 preview 在4173端口提供：`/foundation-react/`展示列表、表单和详情；`/card-group-react/`展示受控卡片集合与刷新；`/react/`、`/widgets-react/`展示基础控件。登录扩展为`/login-react/?extensions`。1.0.0已移除原生DOM UI入口与示例；runtime服务/模型继续复用。示例仅使用合成数据，不证明产品或真实后端已集成。

包均为 `private: true`，仅本地打包验证，不发布。许可证尚待仓库所有者决定。
