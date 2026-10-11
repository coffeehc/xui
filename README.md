# xui

统一品牌前端基础：无框架 CSS 与运行时、React 薄封装、公共布局、完整基础交互与加载反馈，以及独立安装后的 React/原生参考页。

- [完整通用规范](docs/DESIGN.md)
- [范围、包接口与实施映射](docs/IMPLEMENTATION.md)
- [使用与迁移手册](docs/ADOPTION.md)
- [全部公开入口与默认行为](docs/PUBLIC_API.md)
- [Codex 接入 skill](.agents/skills/adopt-xui/SKILL.md)
- [原子→组合→页面的设计哲学](docs/FOUNDATION.md#组件层次与扩展原则)
- [可配置登录页与统一认证接口](docs/AUTH.md)
- [HTTP 与共享 query 接入](docs/HTTP.md)
- [API Key 通用管理](docs/API_KEY.md)
- [可扩展业务审计](docs/BUSINESS_AUDIT.md)
- [独立结构化错误查询与拟议 facade 合同](docs/LOGS.md)
- [来源与后续迁移计划](docs/MIGRATION.md)
- [能力覆盖与宿主边界](docs/FOUNDATION.md)
- [本轮验证证据和限制](docs/FOUNDATION_VALIDATION.md)
- [早期验证记录](docs/VALIDATION.md)
- [限定独立复核与修订证据](docs/REVIEW.md)

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium # 已有 Chromium 可省略
pnpm verify
pnpm preview
# 另一个终端：pnpm dev（构建成功/失败状态与自动恢复）
```

主要参考页为 `http://localhost:4173/foundation-vanilla/` 和 `/foundation-react/`，通过公共 Layout/CSS 组合列表、表单与详情，附加工具真正按需加载。早期 `/vanilla/` 和 `/react/` 保留用于兼容回归。
包均为 `private: true`，仅本地打包验证，不发布。许可证尚待仓库所有者决定。
