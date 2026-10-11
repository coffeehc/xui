# 来源与迁移计划

本次从正常 Git clone 读取 `coffeehc/xagent`，权威来源为提交
[`29139f7843d9a79a9eca42892cb87da8f08f6320`](https://github.com/coffeehc/xagent/blob/29139f7843d9a79a9eca42892cb87da8f08f6320/docs/DESIGN.md)
的完整 `docs/DESIGN.md`，原规范版本 0.4.0。2026-10-11 核实时源仓库 `main` 仍是该 SHA。
原始文件的 SHA256、来源版本和精确变更记录在 [design-source.json](design-source.json)。
未把来源仓库检出成可编辑产品工作区，没有修改或提交任何其他产品仓库。

## 本次迁入的澄清

- 角色表 `action-primary / foreground` 改为准确的 `action-primary / action-primary-foreground`。
- 角色表 `destructive / destructive-foreground` 改为已存在的 `action-danger / action-danger-foreground`，明确 destructive 是组件变体名称；轻量危险变体另映射 `status-error-soft / status-error-foreground`。
- 按原规范的修订版本规则标为 0.4.1。全部标记的默认 CSS 原样保留，仍为 271 个变量；未加入不存在的 destructive CSS 变量，未更改默认品牌值。

回归测试反向还原这三处文字修改并核对原始 SHA256，能证明此次迁入未靠摘要改写全文。提取 CSS 与规范逐字一致；前言摘要也有独立一致性检查。

## 分阶段采用

1. **当前阶段：xui 基础与证据。** 唯一完整通用规范在 `docs/DESIGN.md`，根文件只指向它。生成 theme CSS、runtime、React 薄封装和两个独立 tarball 消费样本。
2. **权威引用迁移：待后续产品仓库授权。** 在源产品和各采用项目登记 xui 规范版本与来源，根设计入口改为引用；产品实施文档保留产品职责、路径和审计证据。删除全文镜像前先核对是否有未迁入的通用规则或产品扩展。
3. **代表页面采用：逐仓库授权、逐页验收。** 原生产品先采用 CSS 和可选主题运行时；React 产品先连接主题 CSS，再将已存在的公共控件映射到薄封装。已有存储格式通过 runtime 的自定义 key 或采用层迁移保留。
4. **扩大覆盖：基于使用证据。** 只有出现实际复用需求才补新组件；路由、权限、API、会话、交易、图表数据及产品性能工程仍由产品拥有。

每个采用项目必须记录范围、版本、覆盖项、首屏关键内容、真实页面与交互证据。当前示例通过不代表全库或任何产品迁移通过。

## 仓库与授权边界

初始核实：xui 公开、默认分支 `main`、远端无分支/提交；云环境本地是未出生的 `work` 分支。
未创建 LICENSE，许可证由所有者决定；没有变更可见性。全部包 `private: true`，没有 npm/GitHub Packages 发布或站点部署。
本地可以准备提交；向 xui `main` 推送仍需父任务取得具体授权，本次未 push。没有令牌生成、秘密写入、强推、reset、git clean 或文件树 API 上传。
