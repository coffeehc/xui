# xui

通用前端组件与主题：无框架 CSS/runtime、React 薄封装、公共布局、交互与可选页面组合。宿主负责业务 API、领域数据、业务 UI 和产品流程；选用默认 HTTP client/页面 adapter 时满足相应合同，也可使用公开 typed adapter/loader 接入领域能力。

- [接入与迁移](docs/ADOPTION.md)
- [完整通用设计规范](docs/DESIGN.md)
- [全部公开入口与默认行为](docs/PUBLIC_API.md)
- [组件分层、实施映射与宿主边界](docs/IMPLEMENTATION.md)
- [布局插槽](docs/LAYOUT_SLOTS.md)、[导航](docs/NAVIGATION.md)、[公共组合](docs/COMPOSITIONS.md)
- [交互控件](docs/WIDGETS.md)、[文字与展示](docs/DISPLAY.md)、[表格](docs/DATA_TABLE.md)
- [HTTP/query](docs/HTTP.md)、[默认页面服务前置](docs/PAGE_APIS.md)、[认证](docs/AUTH.md)、[密码](docs/PASSWORD.md)
- [API Key](docs/API_KEY.md)、[业务日志](docs/BUSINESS_LOGS.md)、[程序错误观察](docs/LOGS.md)
- [验证证据与限制](docs/VALIDATION.md)
- [Codex 接入 skill](.agents/skills/adopt-xui/SKILL.md)

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium # 已有 Chromium 可省略
pnpm verify
pnpm preview
# 另一个终端：pnpm dev（构建状态与自动恢复）
```

参考页默认由本地 preview 在 4173 端口提供：`/foundation-react/` 与 `/foundation-vanilla/` 展示列表、表单和详情；`/react/`、`/vanilla/`、`/widgets-react/` 与 `/widgets-vanilla/` 展示基础控件。登录扩展为 `/login-react/?extensions` 与 `/login-vanilla/?extensions`。示例仅使用合成数据，不证明产品或真实后端已集成。

包均为 `private: true`，仅本地打包验证，不发布。许可证尚待仓库所有者决定。
