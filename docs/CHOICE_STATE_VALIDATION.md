# Checkbox / Radio / Switch 基础状态验证

本记录对应 [基础层门禁](FOUNDATION_DESIGN_GATES.md) 的 G1 原生选择控件，不代表 Field、成组选项、SimpleSelect 或任何业务表单验收。完整合同仍仅在 [DESIGN](DESIGN.md)。

## 条款与最小修复

- 基线：`8429b830a7c404d322801d736874ba1dd90e4995`，日期 2026-10-13（UTC）。
- DESIGN 的状态矩阵要求 disabled 不可执行、真实错误保留；逐组件映射要求选择标记、独立焦点与错误并存；原生控件补充要求 choice 错误边界继续使用 `status-error-foreground`。
- 旧 `.xui-choice[aria-invalid="true"]` 和 `.xui-choice:disabled` 都是 specificity `(0,2,0)`，但后置 disabled 将错误边框改为 `muted-foreground`。新的同名 invalid 规则移至 disabled 之后，仍只设置 `border-color`。
- 禁用背景、前景、勾选/圆点/拇指、cursor、真实 disabled/readOnly/checked/indeterminate 及业务回调均不改变。不新增 token，不用 aria-busy 推导 disabled，不清除宿主已声明的错误。
- readonly 是回归覆盖，不属于本次行为修改：React 使用公开 Checkbox/Radio/Switch 的 readOnly；原生使用真实 input 和公开 `bindReadonlyChoice`，不以仅加 HTML readonly 属性冒充选择控件只读。

## 正式消费者与状态样本

新增 `tests/fixtures/choice-state-contract.tsx` 和 `.js`。`scripts/consumers.mjs` 将两端分别复制到真实独立 tarball 安装后构建 `/react/choice-state-contract.html`、`/vanilla/choice-state-contract.html`，检查全部输入来自该安装、没有私有 CSS，原生包图不包含 React/ReactDOM/Base UI。

每端 48 个独立控件，组合如下：

| 控件 | 视觉/事实状态 | 可用性与错误 |
| --- | --- | --- |
| Checkbox | unchecked、checked、indeterminate+unchecked、indeterminate+checked | 各自 enabled/disabled/readonly × valid/invalid |
| Radio | unchecked、checked | 各自 enabled/disabled/readonly × valid/invalid |
| Switch | unchecked、checked | 各自 enabled/disabled/readonly × valid/invalid |

Radio/Switch 不伪造 mixed。每个 Radio 使用独立 name，样本测试单控件的状态，不充当成组选择业务测试。每个 invalid 样本都有可见错误文字及 aria-describedby；不引入 Field/Fieldset。

## 回归与证据强度

`tests/choice-state-contract.test.mjs`：

- 修复前，equal-specificity 源顺序断言真实失败；修复后通过。
- 只允许 invalid 规则修改错误边框，确认 disabled 背景/文字/cursor 仍使用原语义。
- 正式 React 出口 SSR 确认 checked、disabled、invalid、错误关联、busy 与 readonly 独立保留；SSR 不证明浏览器交互。

`tests/browser/choice-state-contract.spec.mjs` 共 12 项：两端 × light/dark/system × 外观/交互。

- 外观：48 个合法组合的边框、底色、前景、真实选择事实、mixed 横线、checked 标记与 Switch 拇指；同根 product-overrides 单独覆写 error 前景，再撤销覆盖。保留默认/覆写截图供查看。
- 禁用：滚入视口并确认真实鼠标命中 input，点击 input 和关联 label 后值、mixed 与 change 记录均不变；后续 Tab 跳过 disabled，不尝试把禁用控件伪造成 focus 状态。
- 可达焦点：enabled 和 readonly 由普通 Tab 到达，焦点环沿公共 focus token；focus+invalid 同时保留。readonly 的 Space、Radio 方向键、真实 input/label 点击不能改值。
- 可编辑错误：三种控件的 enabled+invalid+unchecked 通过键盘 Space 仍可选择，错误边界保留；不把 invalid 当作 disabled。

## 本地运行结果

以下结果仅对应本批基线和修改；主维护者合入其它基础批后必须重新验证最终提交。

- `node scripts/build.mjs` 通过，generation `0a10d212a1c9`。
- `node scripts/tokens.mjs --check` 与 `node node_modules/typescript/bin/tsc --noEmit` 通过。本批基线为 357 个设计变量；没有修改变量数量或来源元数据。
- 新增静态/SSR 单测 2/2；完整 `node --test tests/*.test.mjs` 为 509/509。
- `npm_config_offline=true node scripts/consumers.mjs` 通过：两端真实 tarball、全部公开出口/types、新增 choice fixture 的隔离/无私有 CSS 检查及既有包体门禁。
- 文档链接检查、`git diff --check` 通过；Playwright `--list` 发现 12 项，未执行浏览器。

## 未测边界

本轮不再尝试已知会遇 `socket() EPERM` 的本地 Chromium，不更改 sandbox。浏览器用例和截图均交主维护者统一 CI；Playwright `--list` 仅确认 12 项能被发现，不能宣称它们已通过。

没有本轮实际 computed style、像素或读屏结论，也未覆盖真实 200% 浏览器 zoom、移动 OS、所有 controlSize、RadioGroup/CheckboxGroup、字段组合或业务页面。若 CI 发现 readonly 等非本次 CSS 根因，须单独记录，不以扩大本批实现或放宽断言掩盖。

## 首轮真实浏览器与行为测试更正

23c70e1安全CI：6项48态颜色/错误边界/token覆写通过；6项行为用例被Playwright label.click的可操作性检查阻塞。trace精确停在label→checkbox-unchecked-disabled-valid，反复报element is not enabled，尚未执行后续readonly流程。测试改为真实鼠标在命中的label坐标点击，控件仍disabled且checked/indeterminate/事件不变断言全保留；readonly仍真实Tab/Space/方向键/控件与label点击。没有解除disabled、直接改值、增加sleep或扩大timeout。后续同SHA正式CI才可确认行为通过。
