# 第一版限定独立复核

日期：2026-10-11 UTC。复核基线为 `d2c7e91429a2436f3f9071adb1c9e2db6faba75e`；修订代码为 `165d8a56daba379a3bc2634090ce0c04db5baa81`。两位独立审查者分别检查 runtime/包边界和 Tabs/Dialog。只修本轮证实的缺陷，没有新增产品功能或修改其他仓库。

## 缺陷与修订

| 复现问题 | 修订 |
| --- | --- |
| runtime 的 `sideEffects: false` 导致打包器删除 bare import 的 `init.js`，原经典 script 示例未受影响 | 仅 `dist/init.js` 声明有副作用；两个 fresh tarball 消费都断言初始化代码实际保留 |
| Tabs 在 capture 阶段停止传播，截断 Tab 的 capture/bubble 与 List bubble；调用方的 `preventBaseUIHandler()` 无效 | 将 disabled 跳过适配移到 List bubble，调用方事件先执行，尊重 peer 取消标记 |
| Tabs 只读 DOM 方向，忽略 DirectionProvider；遗漏 Shift modifier | 上下文方向优先，无上下文才读 DOM；保留四种 modifier 的 peer 行为 |
| 适配遇 `defaultPrevented` 提前返回会落回 peer，重新聚焦 disabled | 遵循 Base UI 区分：`preventDefault()` 只防浏览器默认行为，适配仍跳过 disabled；`preventBaseUIHandler()` 才取消控件导航 |

Dialog 未发现封装缺陷；没有改动 Dialog 实现。规范、271 个 token 和品牌默认值未改。

## 实际检查

| 检查 | 结果与边界 |
| --- | --- |
| runtime 独立检查 | 9/9 现有主题测试通过；重复执行初始化器复用同一 controller，只注册一次系统监听；unsubscribe/remount 不新增系统监听；system 跟随 OS，explicit 优先；storage 不可用保留内存选择，double destroy 清理且终止 controller |
| 包边界独立检查 | tarball 只有 package.json 与 dist；真实消费的所有 esbuild 文件输入都在各自独立安装目录，未借助工作区源码或 symlink。vanilla 未安装 React/ReactDOM，React peer 与 types 边界正确 |
| 修订后构建 / types / 消费 | `pnpm build`、`pnpm typecheck`、`pnpm test:consumer` 通过；重新打包并新目录安装，两种消费者的 bare import 初始化输出均非空，安装字节与构建字节一致，消费 types 通过 |
| 最终 Tabs 独立浏览器断言 | 38/38 通过，页面错误 0：事件顺序、peer/浏览器取消区别、context 与 DOM RTL、modifier、disabled 双向跳过、Home/End、vertical、loop/no-loop、controlled/uncontrolled、父组件拒绝更新、details.cancel、Enter/Space |
| 保存到仓库的 tarball 回归 | `peer-contract.spec.mjs` 4/4 通过，0 failed/skipped/flaky；消费包而非源码。四组包含上述 Tabs 的事件/值/方向，以及 Dialog 触发器移除后显式 finalFocus、Close/Esc 取消 |
| 原示例相关检查 | 现有 React Tabs 与 vanilla/React 原生输入、焦点和 Dialog lifecycle 共 3/3 通过；执行源码与最终修订一致 |
| 工作区 / 远端 | diff 检查通过，正常本地提交；只读核实远端仍无分支，未 push |

构建、源码和归档指纹以及最新四组测试的原始统计见 [review-evidence.json](review-evidence.json)。完整日志保留在忽略的 `.artifacts/review-tabs-independent.log`、`.artifacts/review-runtime-independent.log` 和 `.artifacts/review-browser.json`。永久回归入口在 `tests/browser/peer-contract.spec.mjs`；fixture 从真实安装的 React tarball 构建并校验 types。

```sh
pnpm build
pnpm typecheck
pnpm test:consumer
pnpm exec playwright test tests/browser/peer-contract.spec.mjs
pnpm exec playwright test tests/browser/ui.spec.mjs --grep 'React tabs|native input'
node --test tests/runtime.test.mjs
```

本轮修订过程的失败已处理：新方向变量与原步长同名，构建类型检查捕获并改名；测试 fixture 的 handler 元素类型不匹配，消费 tsc 捕获并改为正确联合类型；fixture 在 JSX key 中自增 revision 引发求值顺序差异，四组检查在进入交互前超时，已将自增移出 JSX 后重测四组通过。没有删除失败断言或放宽要求。

## 本轮未重跑与剩余边界

没有重跑未受影响的全套 token 负例、颜色采样、首屏截图和布局组合；首轮 13 单元 + 17 浏览器的完整通过记录仍明确属于基线。构建自身再次通过 token 单源/完整性检查。没有把局部复测称为修订后的全流程通过。

仍只验证 Chromium 和合成消费样本；Firefox/Safari、读屏器、真实触屏/OS 控件、原生页面缩放、产品 SSR hydration、实际产品业务与生产性能预算未跑。Dialog 触发器移除时应提供 finalFocus；未提供时 peer 回到 body，不保证业务上合适的焦点位置。没有产品迁移完成结论。

规范权威引用迁移仍按 [MIGRATION.md](MIGRATION.md)：先交付 xui 唯一通用规范，再在取得各产品授权后核对规则差异、登记 xui 版本并改为指针，最后逐页采用和验收。xAgent 文件本轮未动。

全部包保持 private，许可证未选定。没有 push、发布或部署。父任务此前询问的推送目标是旧 SHA `d2c7e91429a2436f3f9071adb1c9e2db6faba75e`；本次修订形成新 HEAD，最终推送目标需以父任务得到的具体授权为准。
