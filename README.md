# xui

统一品牌前端基础的第一版：无框架 CSS、主题运行时、React 薄封装，以及两个构建后消费示例。

- [完整通用规范](docs/DESIGN.md)
- [范围、包接口与实施映射](docs/IMPLEMENTATION.md)
- [来源与后续迁移计划](docs/MIGRATION.md)
- [验证证据和限制](docs/VALIDATION.md)

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm preview
```

预览：`http://localhost:4173/vanilla/` 和 `http://localhost:4173/react/`。
包均为 `private: true`，仅本地打包验证，不发布。许可证尚待仓库所有者决定。
