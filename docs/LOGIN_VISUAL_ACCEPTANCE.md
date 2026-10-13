# 公共登录页视觉验收

本页是 [DESIGN](DESIGN.md#公共登录页布局与主题) 的实施与验收记录，不建立第二套主题规范。适用 `AuthPage` / `createAuthPage` 与内部复用它们的 `ConfigurableLoginPage` / `createLoginPage` 正式产物；不代表任何产品页面已升级。

## 实施前确定的目标与样本

- 核心任务：识别当前产品，输入账户和密码，完成一次明确的登录。
- 首屏关键内容：组合后的品牌身份、登录标题、字段、一个主登录按钮；必要状态在按钮后的局部区域。
- 参考公开页面与规范（2026-10-13）：[Carbon Forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms) 的标题层级、单主动作和局部错误；[GitHub 登录](https://github.com/login) 与 [Vercel 登录](https://vercel.com/login) 的任务导向结构。只参考层级与交互，不复制品牌素材、认证机制或第三方尺寸。
- 正式浏览器样本：React / 原生 × light / dark / system × 1280×800 / 390×800；另验 1600×900、390×320、根字号 200%、字体 token 放大、长错误、可选品牌图、扩展字段和 SSO。真实浏览器 zoom 与根字号放大分别报告。

## 固定验收标准

默认值以下以 16px 根字号为准，允许 1px 排版误差；字体偏好改变时按 token 比例验收。

| ID | 预期 | 验收方法 / 证据 | 实测与状态 |
| --- | --- | --- | --- |
| L01 | 默认双分区铺满视口，无外部卡片；窄屏品牌在上、表单在下；显式 card 保留 | 真实截图 + panel rect | 未测 |
| L02 | 身份行先于说明与装饰图；logo 40px、品牌名 20/28px；三者在同一有界组，不再出现插画后孤立大 logo | 可选图 desktop 截图 + DOM 顺序、rect、computed type | 未测 |
| L03 | 表单内容最大 400px（含四边焦点余量），标题 32/40px、label 13/20px、输入文字 14/22px、主按钮至少40px；标题明确大于字段 | screenshot + JSON type/rect | 未测 |
| L04 | label→input 8px、字段之间16px、密码→登录16px；无反馈框或隐藏辅助按钮插在密码和登录之间 | idle/error/busy screenshot + gap JSON | 未测 |
| L05 | 匿名普通页只有一个可见主登录按钮，宽度与字段一致；错误401不显示会话检查；SSO是独立次级组 | 公共 API 页面操作 + screenshots | 未测 |
| L06 | 反馈在主按钮之后，空状态仅保留40px内容轨道及焦点余量；长反馈向下使用剩余轨道，最多12rem再单一滚动；取消/重试仅有真实用途时出现，不能占主动作宽度或隐藏占行 | idle/busy/error截图，动作与反馈rect | 未测 |
| L07 | 检查→匿名、提交→busy→错误、断网/超时/重试时品牌、字段、主动作位置/大小变化≤1.5px；长错误在局部可滚动 | 连续状态 rect JSON + screenshot；已有 error-layout 回归 | 未测 |
| L08 | unknown write / reauthenticationRequired 不出现可刷新重试，不自动 refresh/logout/重放；显式重新登录可恢复，密码即时清空 | auth unit + auth-bearer/login browser HTTP counts | 未测 |
| L09 | 1280/390普通首屏主操作完整可见，无页面横向溢出；200%与短视口可滚动到每个字段/动作 | screenshot + viewport/scroll metrics | 未测 |
| L10 | Tab顺序字段→主动作→SSO→实际局部辅助动作；不存在隐藏Tab停靠；输入、主按钮、反馈、SSO四边focus真实像素可见 | 实际键盘路径 + four-side pixel screenshot | 未测 |
| L11 | light/dark/system复用一个根主题owner，系统变化不清输入；reduced-motion仍立即反馈 | existing theme/motion browser tests +截图 | 未测 |
| L13 | 三字段setup复用同一定位owner，表单不贴顶、标题/字段/主动作尺度同登录；动态更新保留表单/输入DOM、值、事件和焦点；零自动认证请求 | setup三主题×双端×1280/390实际截图与JSON；update/submit请求计数 | 未测 |
| L14 | 未知身份经既有owner检查；匿名原位表单；已确认session或login成功直接一次进入宿主目标，无身份/Continue/Logout确认卡。导航同步/Promise失败只局部重试打开目标，不重POST/refresh/logout；开发态StrictMode/重复通知/同id新user对象不重复导航；pagehide/unmount迟到结果失效，persisted恢复不锁死且不补认证请求 | login-navigation真实DOM mutation/rAF序列、identity/rect、HTTP/回调计数、目标内容截图；默认同URL防循环 | 未测 |
| L12 | 双端只消费正式 exports/CSS/types；build/token/type/unit/watch/consumer/cold-start/browser全部最终版本通过 | 根 pnpm verify 与准确commit CI | 未测 |

## 证据规则与当前限制

新增测试应把成功截图写入 `testInfo.outputPath` 并附加 JSON 实测数据；CI 的 test-results 产物提供原始证据。截图必须实际浏览器渲染，再由人或图像查看工具检查品牌构图、比例与裁切。DOM、computed style、测试收集、构建成功不能代替视觉检查。

当前状态为已实施、待最终真实浏览器验收，以上逐项尚未测完；云执行器 Chromium 启动受到 EPERM 限制，不改变安全启动配置或以伪造截图绕过。完成后记录最终 SHA、每项通过/失败/未测与实际证据。真实产品、真实后端、其他浏览器和移动 OS 未覆盖时继续明确标记未测。

## 最终源码树预检（非视觉验收）

2026-10-13，源码 generation `c8ffa0157d019e52c5c593b5a712afa9efe5aa6a4bcf19a93973ac5bfbe9edc5`：

- 正式包 build、完整开发示例构建、355-token 合同、typecheck、361/361 unit 通过。
- React/原生独立 tarball 的全部公开入口、类型、peer、体积门禁通过；含纯 AuthPage setup 与开发态 StrictMode 登录消费者。
- 本地 watch 两次在首轮30秒等待超时，未通过。直接运行同路径 dev-build 成功耗时40.447秒；这说明本地运行超过等待期限，不代表已排除构建缺陷。保留原门禁，待 CI 原样执行。
- `auth-page.spec.mjs`、`login-navigation.spec.mjs`、`login-visual.spec.mjs`收集65项，目标包含36张登录 idle/error/busy、12张setup主矩阵及额外焦点/导航图。仅收集，未在受限执行器启动浏览器，不证明像素、几何或视觉通过。
- cold-start 同样需要 Chromium，留给允许的 CI 与完整browser门禁；尚未运行。persisted pagehide/pageshow测试是浏览器生命周期事件模拟，不能当作真实 BFCache 命中验收。

最终commit、完整CI与逐项实测待补；真实浏览器zoom、真实BFCache命中、其他浏览器/OS和产品实接仍未测。
