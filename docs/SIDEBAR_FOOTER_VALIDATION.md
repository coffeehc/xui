# 侧栏底部插槽验收

本轮在 `f64a5f2` 后新增公共底部区域，并按追加要求统一顶栏菜单开关。旧布局/文字验收成绩不作为本轮结果；下表为本轮可执行覆盖，实际命令结果如下，最终CI随提交可追溯。唯一视觉合同见[DESIGN](DESIGN.md)，[公开API](PUBLIC_API.md)与[迁移示例](NAVIGATION.md#侧栏底部接入与迁移)同步维护。

## 正式覆盖矩阵

| 场景 | React | 原生 | 证据 |
| --- | --- | --- | --- |
| 正式exports/types、纯themeCSS、无源alias | 独立tarball | 独立tarball且无React peer | consumers.mjs与public-api.json |
| 顶栏唯一开关 | MenuLayout/AppShell状态owner | 原生同一button切换两种请求 | 桌面/窄屏aria-expanded、键盘、受控与单owner |
| 顶栏和footer分区、静态/动作内容无业务默认值 | MenuLayout/AppShell.sidebarFooter、SidebarFooterContent | createMenuLayout.sidebarFooter、公开HTML内容部件 | unit及两组官方示例 |
| light/dark/system、展开/紧凑、短/长菜单 | 同一公共CSS | 同一公共CSS | sidebar-footer.spec.mjs测量与截图 |
| 60px紧凑宽、完整可访问名称、长中文 | label视觉隐藏，icon/短表示保留 | 相同公开部件 | computed style和accessible name断言 |
| 200%文字、窄屏和固定窗口 | 同一导航抽屉，过长footer可滚动 | 同一aside移动到抽屉 | 命中/边界/末项可见检查 |
| route/active/menu更新保焦点和footer身份 | React协调、稳定portal | Node/已消费Fragment identity guard | identity、回调计数、焦点断言 |
| disabled/busy与防重复 | 既有Button+宿主事实 | 原生button+宿主事实 | 鼠标/键盘及busy期间回调数 |
| 反复开关、Escape、宿主已移动焦点 | 原模态owner | 原shell/dialog owner | 回焦点与不夺焦点检查 |
| 正式build与watch | ESM/types/CSS generation | 同代产物 | build/check:tokens/typecheck/test:watch |

普通内容下仅menu滚动；footer超出可用侧栏一半时允许它自身滚动，确保放大文字/极长内容不挤掉整个菜单。document模式正文仍为文档滚动，有footer侧栏有界sticky；无footer保持已有滚动合同。

## 验证记录

本次本地 build、check:tokens、typecheck 与168项单测通过；两套独立tarball消费者的全部正式exports/types、示例构建和体积门禁通过。专项Playwright共37项已收集，尚未以收集数冒充实跑通过。watch本地两次在30秒首代际等待门限超时（包构建已完成，完整示例代际尚未完成），保留失败记录；相同代码在标准CI中完整watch通过（80.66秒，含多轮重建/故障恢复）。

云端执行环境存在已确认Chromium socket限制，不更改沙箱/浏览器参数绕过；完整pnpm verify（含watch、cold-start与真实浏览器）由每次提交的标准GitHub Verify任务执行，以对应提交终态为准。不得以此前成功、源码检查或Playwright用例数量冒充当前实跑通过。

未声明：产品真实权限/后端集成、用户本机、部署、移动OS、真实读屏器、Firefox/Safari、SSR/hydration、生产性能。合成授权/版本文案仅由示例宿主提供，库没有权限和版本业务逻辑。

### 首轮真实CI与测试修正

实现提交为 `9eb66c929cfcfbdace96b08d852ab814490acc9c`；迁移可从该提交的正式接口和[React示例](https://github.com/coffeehc/xui/blob/9eb66c929cfcfbdace96b08d852ab814490acc9c/examples/sidebar-footer-react/app.tsx)/[原生示例](https://github.com/coffeehc/xui/blob/9eb66c929cfcfbdace96b08d852ab814490acc9c/examples/sidebar-footer-vanilla/app.js)核对，再固定最终通过Verify的提交。

[首轮Verify](https://github.com/coffeehc/xui/actions/runs/38238584137)在2026-10-12完成：build、token、typecheck、168单测、watch、正式consumer及cold-start通过；浏览器268/271通过、3项失败，故该轮完整verify不通过。React两项确为测试同步/查询问题：finish后须等待disabled DOM提交再同任务双击；modal打开后背景trigger从可访问树隐藏，应通过稳定DOM定位检查属性，开前/关后仍验名称与焦点。这两项修正继续保留。

`775b9fd`曾把原生showModal首先聚焦overview、覆盖已有settings tab停靠点视为可接受，并把断言改为读取打开后的任意roving id。该判断错误；该提交浏览器271项全绿不足以证明原生焦点合同正确。随后独立macOS Chromium在正式包/官方原生示例、390×844、collapsed=true下复现：关闭期间update(activeId=settings)本已形成settings停靠点，打开时浏览器先focus overview触发focusin/refresh，把该停靠点覆写。selected仍为settings不能使这一副作用合法化。

### 原生初始焦点修复与回归

修复归属公共shell/dialog：打开前快照合法目标，showModal期间由已捕获目标临时拥有autofocus，只有同一次有效打开且焦点未被新owner接管时才能继续交付焦点；完整恢复原autofocus属性（含既有竞争属性）。菜单与footer不重建，既有Tab循环/模态隔离/关闭恢复继续使用原owner；初始open时先移入sidebar，长菜单打开后滚动优先保留实际焦点。未添加消费者CSS/focus补丁或新接口。

可执行顺序回归`tests/dialog-focus.test.mjs`对修复前正式dist运行：5项中2项失败，包含候选在showModal后才求值而返回overview；这是同步焦点算法的模拟单测，不冒充真实浏览器。修复后同一断言检查候选先解析、无overview中途focus、既有autofocus恢复、打开失败恢复、重新打开与宿主同步焦点转移。Playwright固定断言settings，另覆盖已存在library停靠优先于settings选中、无footer、长菜单、空菜单关闭退路、Tab循环、反复开关、关闭回入口及宿主新标题/新模态不被夺焦点。

当前提交的完整浏览器/watch/cold-start结果以[标准Verify](https://github.com/coffeehc/xui/actions)对应SHA终态为准；源码检查、单测和收集数均不能替代。此修复不证明历史hydration错误或任何产品接入状态。

`62d25c3`的标准Verify已真实执行：前置build/token/type/177单测/watch/consumer/cold-start通过，浏览器268/278通过、10项原生焦点回归失败。该轮只在dialog根上临时设置autofocus，模拟单测采用新HTML算法，未覆盖Chromium仍使用的legacy算法。Chromium legacy从dialog子节点开始查找，因此忽略根autofocus，仍聚焦首个可聚焦子节点（长菜单中也可能是滚动区域）。后续修正把autofocus直接交给预先捕获的目标子节点，显式dialog目标使用临时代理，并为legacy/modern两套同步算法补单测；严格浏览器断言保持不变。该失败记录保留，修复成功仍以新SHA的完整Verify终态为准。
