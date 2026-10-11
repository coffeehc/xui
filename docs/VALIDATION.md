# 第一版验证记录

验证代码 SHA：`b8c790ee5936e64d2009abf53c5c0d13413fc263`。本报告及 evidence 作为后续文档提交补入，执行源码未变。
日期：2026-10-11 UTC；环境为此独立云环境，Node 24.19.0、pnpm 11.25.0、Chromium 154.0.8037.57（Debian 13）。
React 19.2.8、Base UI 1.7.0。另以包管理器固定版本 pnpm 11.23.0 成功执行 frozen-lockfile 安装。
数据全部合成，不含真实业务内容或秘密。

最终 `pnpm verify` 返回 0。构建指纹、原始测试统计和实际渲染的颜色对比结果记录在 [validation-evidence.json](validation-evidence.json)。

| 检查 | 结果与范围 |
| --- | --- |
| 规范迁入 | 0.4.0 原文经三处已记录文字澄清为 0.4.1；反向还原 SHA256 匹配来源。完整默认 CSS 原样保留 |
| token / 单源 | 271 个默认根变量，浅深/system/reduced/产品覆盖图完整无循环。YAML 摘要与 CSS 一致，生成 CSS 逐字一致。负例能拒绝缺失引用、循环、原始颜色、原色回流及摘要漂移 |
| 构建 / types | 三包 CSS、ESM、.d.ts、同步 init 输出成功；源码及消费方 tsc 通过 |
| 独立消费 | 每次新目录安装三个本地 tarball；实际包字节等于最终构建字节，esbuild 输入无 packages 源码/alias。vanilla 只装 theme/runtime，无 React；React 从公开 exports 消费包与 peer |
| 单元测试 | 13/13 通过，无跳过：规范/守卫、SSR 安全导入、三模式、未知值、storage 拒绝、matchMedia 失败、自定义 key、旧监听 API、订阅失败与释放 |
| 浏览器 | 17/17 通过，0 failed、0 skipped、0 flaky；两类示例，mouse/keyboard 和 Chromium touch 模拟 |
| 三模式与首屏 | 初始化器执行后、CSS/body 前已设置偏好；light/dark/system/unknown 首次进入、刷新持久，system 随 OS 浅深变化，显式选择不被覆盖，模式选择不清空名称 |
| 覆盖主题 | 默认暖灰青绿及规范蓝色覆盖的 light/dark/system 均生效；使用同一根元素与 layer 覆盖，不另维护默认值 |
| 控件交互 | 原生 checkbox/switch Space、radio 方向键；按钮 Space 按压并立即执行；disabled+busy；invalid 错误关联、回字段 focus；textarea 清除；readOnly |
| 导航 | hover-only 无指示，selected+hover 指示保留，无边框；focus 独立，blur 不删选择；选中前后位置相同。网格布局的纵向拉伸已修复 |
| Tabs | 方向键、Enter 手动激活、禁用项跳过、Home/End、RTL；panel 关联；离开的 panel 立即隐藏，防止两个 panel 同时占布局 |
| Dialog | 真实 Enter/点击/tap 打开；焦点循环；Esc/取消回触发器；反复开关及减少动效；390px 窄屏碰撞边距、长中文 body 滚动、footer 仍可点击；取消不保存 |
| 首屏与长内容 | 1280×800、390×844，light/dark：关键标题、名称、主保存操作完整可见，实际点击，无横向溢出；保存第一视口截图。长中文输入/帮助可达 |
| 放大 / reduced / 强制色 | 200% 根文字放大可阅读/操作、无横向溢出；motion token 0ms、Switch 0s 即时状态；取消/回焦点照常；forced-colors 原生选择保留 checked |
| 代表性对比 | 浏览器解析实际颜色并采样为 sRGB：正文、次要文字、按钮、selected、状态及 danger 对 ≥4.5；输入边界、错误边界和 focus 对 ≥3。默认输入边界约浅色3.40、深色3.99；完整测量见 evidence，不代表所有组合穷举 |
| 工作区 / 远端 | git diff 检查通过；正常 Git 仓库内本地提交，未 push。最后只读核实远端仍无 refs |

## 证据位置与复现

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium  # 若无系统 Chromium
pnpm verify
pnpm preview
```

原始证据保留在本次工作区的 `test-results/browser.json`、`test-results/*/*.png`、`.artifacts/verify.log`。
构建与包在 `packages/*/dist`、`dist/{vanilla,react}`、`.artifacts/*.tgz`，独立安装目录由 `.consumers/latest.json` 指向。
这些可再生成产物不进入 Git，避免保留第二套可编辑默认值或缓存。`validation-evidence.json` 保存此次代码 SHA、构建 SHA256、计数和颜色比值以便对照。

本地预览 `/vanilla/`、`/react/` 只监听 127.0.0.1:4173。未部署站点。
CI 配置已写入，但空远端尚未运行 GitHub Actions；本次通过结论来自云环境实际执行。

## 未跑与剩余边界

- 未跑 Firefox/Safari、真实触屏设备、读屏器、移动 OS 原生 select 面板；触屏结论仅 Chromium 模拟。
- 已测 200% 文字放大；未跑浏览器原生页面缩放。未穷举各系统字体/强制色或全部组件组合的对比。
- 未测产品 SSR hydration、真实生产首屏/交互预算、产品网络等待/超时/业务竞态，也没有真实业务 API。本版不宣称性能提升。
- Dialog 触发器被业务移除的回焦点需采用方提供 finalFocus；当前验证是触发器保留场景。
- 垂直 Tabs 与 loopFocus=false 有接口支持，当前浏览器样本只覆盖水平 Tabs/RTL/default loop。未将未跑组合称为通过。
- 没有迁移任何产品仓库，没有全控件库完成结论。LICENSE 仍未选定，包均 private。
- 向 xui main 推送仍等待父任务获得具体授权；无推送、发布或部署。

首轮失败都已明确处理：ESM 检查脚本误用 CommonJS 解析；导航 grid 拉伸；原生 Dialog 单按钮焦点边界；Base UI 1.7 禁用 Tab 可聚焦策略；测试对动画中间态及手动激活的错误假设。最终全流程重跑通过，没有删除失败检查或降低验收要求。
