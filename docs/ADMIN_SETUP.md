# 公共管理员初始化页

`AdminSetupPage`（React）与 `createAdminSetupPage(root, options)`（原生）提供完整用户名、新密码/确认、提交、忙状态和安全反馈。页面内部复用 AuthPage/createAuthPage 和 NewPasswordFields，不新增 AuthClient，复用固定密码校验。所有主题、窄屏、反馈预留空间沿现有认证页合同。

## 输入和责任

双端配置为 `config: AuthPageConfig`、必填 `state: AdminSetupState`、`onSubmit: AdminSetupSubmit`，可覆盖 `labels: Partial<AdminSetupLabels>`、`passwordLabels: Partial<NewPasswordLabels>` 和 brandVisual。React brandVisual 接受 ReactNode，原生接受 HTMLElement。用户名只校验非空，不裁剪提交值或杜撰字符/长度政策。新密码固定校验 6–32 个 Unicode 码点，无策略请求或项目配置。

`onSubmit({username,password}, {signal})` 只在一次明确提交且字段有效时调用，返回 `complete | unconfirmed | unavailable | rejected`。`rejected` 必须表示宿主权威确认未应用、可重新提交，不能把网络异常/取消/无 receipt 映射成 rejected。throw/reject/运行时不合法结果一律转为 unconfirmed。回调需在开始时构造自己的请求数据；库清理传入对象的 password，不保证已传出的字符串或宿主副本可被擦除。

宿主保留具体初始化 API、权限/租户/数据库条件、已有未知写入恢复与生命周期、持久门禁、receipt、operation ID。公共页既不重放写入，也不自动轮询、登录、导航、保存或记录密码。跨卸载/重载的未知结果保护是宿主责任；新挂载不能无依据传 idle。完成仅显示“管理员已创建，请登录。”。

## 状态和生命周期

- idle：宿主确认当前允许初始化；用户显式提交后进入 submitting。
- submitting：阻止重复提交，密码输入立即清空。
- unconfirmed：仅显示“暂时无法确认创建结果，不能再次提交。”，全部写入锁定；不生成额外核对按钮或技术说明。
- complete：初始化已确认完成，仍未登录。
- unavailable：当前不能初始化；界面不猜测原因。

state 可含 `rejected?: boolean`（仅 idle 有效）与 `revision?: number`（安全整数）。React 对 status/rejected/revision 的事实变化应用新权威状态，普通 inline 对象重渲染不取消进行中的提交。宿主在相同状态值上发布新的权威观察（例如 unconfirmed 后又权威确认可以提交）时递增 revision。原生显式 update({state}) 本身就是新权威观察。不要将页面暂态写回权威输入来循环同步。

React 使用一个稳定 form、非受控密码输入和稳定密码字段 ref。`ref: AdminSetupPageHandle` 提供 clear() 清密码，React 卸载/pagehide 中止本地等待，丢弃迟到结果；StrictMode 重放不销毁仍需使用的 owner。原生返回 getElement/getState/update/clear/destroy，update 接受 state/config，保留 form、字段及未受影响焦点；destroy 清密码、释放事件/订阅、恢复原 root 内容。pagehide 使进行中结果变为 unconfirmed，不因返回页面重发。

底层 `createAdminSetupController`（runtime/admin-setup）也公开相同状态/submit 合同，subscribe/getState/setState/suspend/destroy 不包含用户名或密码快照。视图已经拥有该控制器，普通产品不需创建第二个。

## 正式使用示例

[React SSR/hydration 示例](../examples/admin-setup-react/app.tsx) 和 [原生示例](../examples/admin-setup-vanilla/app.js) 仅使用合成数据，使用公共组件固定的 6–32 个 Unicode 码点规则。两者由独立安装 tarball 的消费者构建并检查全部 ESM/types 导出；React HTML 在 Node SSR 生成后 hydration。

从原有 AuthPage 手写 setup 迁移时，删除用户名/submit/feedback 与重复密码清理、忙态 UI，保留领域 owner 和接口映射。Argus 当前 setup-page 的 ready/pending/unknown/succeeded 应由宿主映射状态；xQuant 的初始化状态/journal 同样留在宿主。本仓没有修改消费者或宣称 xapi 存在相同初始化页。

## 验证及边界

`tests/admin-setup.test.mjs` 覆盖序列化写、未知失败锁定、权威拒绝、终态、迟到结果、卸载取消、无秘密快照与五状态 SSR。`tests/browser/admin-setup.spec.mjs` 覆盖双端 hydration/稳定 ref 与焦点、键盘提交、重复提交、未知普通反馈、明确重试、完成不登录、卸载迟到和 light/dark/system 窄屏 200% 反馈几何。

本轮云执行安全 Chromium 因 socket/ptrace 权限在启动阶段失败，首次 12 项用例未运行到页面；现已扩展为 16 项（新增桌面/窄屏长错误），未关闭 sandbox；浏览器截图/真实放大/键盘/hydration 行为须由保持安全配置的 CI 验证。完整 watch 故障恢复首次在 180 秒总时限取消，未报告通过。SSR 静态测试不是 hydration 通过声明。真实后端、部署、跨浏览器及读屏器未验证。

### 可运行视觉验收路径

执行 `pnpm build && pnpm test:consumer && pnpm preview` 后打开 `/admin-setup-react/`、`/admin-setup-vanilla/`；`?long` 仅合成长错误样例。页面不显示调试 JSON。用 `pnpm exec playwright test admin-setup.spec.mjs` 跑双端桌面 1280 / 窄屏 390 单一居中框、初始密码帮助/强度区（复用 NewPasswordFields）、长错误、unknown、三主题 200%、四边焦点像素与键盘；截图附件分别为 admin-setup-initial、admin-setup-long-error、setup-200-percent，在 CI validation artifact 的 test-results 及 Playwright 报告可看。浏览器执行阻断时不得把这些计划截图写成已通过。
