# 最终接入审查与验收

本步骤基线为 `4ed5b9adea5ef857e7d48639e145b0bd7c3793c5`。覆盖本轮 NavItem、Menu/Layout、HTTP/query、API Key、可扩展业务审计，以及完整手册/仓库接入 skill。此前结构化错误观察代码和提交保留，明确是独立错误功能，不能作为业务审计交付。没有新增后端服务、运行配置组件、Agent SDK、产品迁移、部署或包发布。

## 审查范围

三个独立只读审查分别核对公开合同/正式消费、运行时与视图生命周期、skill 实际接入任务。读取实际源码、manifests、声明、默认值与示例，进行了独立类型/运行导出、最小浏览器和重入复现；没有改文件或代跑完整 build/consumer。审查期间变更的产物不冒最终提交结果，标准 verify 仍由主流程在冻结后的 SHA 完整执行。

| 发现 | 修复与独立证据 |
| --- | --- |
| P1：全入口检查用 require.resolve 解析 ESM-only export | 改为 fresh 独立安装内的原生 ESM import；两宿主实际全入口消费重新通过，声明与运行时导出一致 |
| P2：错误观察 reset 多次通知，使旧过滤覆盖新意图/销毁后复活；live Set 重绑重复通知 | 单次状态切换、generation 再检查、订阅快照；新意图、销毁和重绑回归在旧实现失败，在修复后通过 |
| P2：撤销成功的通知中新建会话被旧操作关闭 | 只关闭仍属于本次 generation 的会话；旧代码复现失败，新会话名称和 phase 保留 |
| P2：React 一次性 key 卸载后 textarea.value 仍有值 | 同步订阅/节点移除/pagehide 显式清空 value/defaultValue/textContent；两宿主三条退出路径独立 Chromium 复核通过 |
| P2：无效错误过滤重复 alert 且给旧查询 retry | 过滤区域单一归属，两宿主一个 alert、无错误 retry 入口；浏览器实测通过 |
| P2：审计 fake loader 按 RFC3339 字符串排序错筛等价时区 | 纳秒比较，保留时区与半开边界；核心纯逻辑及两宿主实际过滤验证 |
| P2：旧详情 Abort listener 新开详情，被 reset 关闭后仍存 payload | 审计与错误观察的关闭 patch 同时检查详情 generation，保留外层过滤与新详情；两条回归在旧产物失败、修复后独立 2/2 通过，源码/dist 匹配 |
| P2：工具栏快照时间在窄屏、放大字号和较宽后备字体下撑出页面 | 工具栏文字允许必要换行；两宿主 390px/200%/monospace 回归在旧消费者失败，重新打包安装修复产物后 2/2 通过，保留完整文字与字号 |

最后独立源码复核在该范围内无剩余 P1/P2。三个合成 skill 接入任务实际检查旧 JSON theme/HTTP owner、私有 CSS/菜单规则、response/query 猜测；追加审计任务确认旧 error samples 无法充当业务审计，已有领域 loader 可先接，不等待 HTTP route，也不重复调用已有批准 API 的审计写入。skill 的正式 YAML/frontmatter/UI 默认提示校验通过，所有相对引用存在；这是迁移判断检验，不是产品迁移。

## 统一验收

公开入口索引与实际 manifests 的 **48 个入口**一一对应。正式消费逐个检查安装后的 ESM、CSS、经典 init 字节及声明，编译全部命名类型（完整声明检查不跳过 lib），核对运行时导出，打包全部 ESM/CSS；另编译真实 React/原生审计、API Key、菜单、HTTP 和基础页面。原生不装 React，React/ReactDOM/Base UI 单实例；CSS、动态面板和 Button-only 实际贡献/体积门禁保留。

本步骤新增 11 项业务审计逻辑测试与 12 项浏览器检查，覆盖固定公共事实、可扩展 JSON/版本/renderer、安全边界、过滤及纳秒时间、cursor/快照/缓存回退、取消/迟到/重入/销毁、权限/缺失/保留期/null、对象安全映射、键盘/focus、窄屏/长中文/200%文字及 reduced-motion。另加入 6 项既有控制器重入回归与 2 项保留 DOM 节点的浏览器回归。全套数量为 **87 项单测、1 项真实默认 watch、126 项浏览器检查**；最终运行的通过/失败/未跑以交付中的冻结 SHA 和日志为准，不能用局部结果替代。完整日志 `.artifacts/verify-final.log` 首行记录受测 SHA，浏览器 JSON 位于 `test-results/browser.json`。

首轮针对性浏览器检查 38/40 通过，两个失败来自测试把格式化 JSON 转义引号当作原文；改为还原 JSON 核对原值，并继续验证无 DOM 图片/代码执行。没有加 sleep、retry 或跳过以掩盖失败。

首次正常推送 `46caeb75f37e6a07cb39f1924039d046e468ce64` 的本地完整 verify 通过，但 [CI 38168147699](https://github.com/coffeehc/xui/actions/runs/38168147699) 浏览器检查为 123/126，两个窄屏溢出和一个主题切换后对比度采样失败（4.357762882141346）。溢出已用上述后备字体在本地复现并修正；对比度测试补全有效主题状态确认、逐帧跟随替换 transition 的结束，保留实际渲染色值测量和 4.5/3 阈值，失败时也保存色值附件。没有降低阈值、关掉动画或靠重复执行取得通过。本地 Chromium 154，CI 下载的 Chromium 156 在本地下载受限，首轮 CI 数值失败未直接在相同浏览器复现；最终追加修正的冻结 SHA、完整 verify 和同 SHA CI 结果在交付中明确报告。

独立只读审查受控地在等待中替换 transition：旧动画取消后，单次 `.finished.catch` 提前返回，新动画仍运行，实际对比度 2.064439；新等待跟随替换后到最终 light，白字/蓝底恢复 6.701618。CPU 6 倍节流下两宿主六组合均无剩余动画、终态对比度达标。这证明旧等待存在取样缺口；没有把受控复现当作首轮 CI 的自然触发事件。

详细入口见 [PUBLIC_API.md](PUBLIC_API.md)，接入过程见 [ADOPTION.md](ADOPTION.md) 与 [skill](../.agents/skills/adopt-xui/SKILL.md)。通用规则仍只在 [DESIGN.md](DESIGN.md)。此前各独立步骤的实际结果见 [FOUNDATION_VALIDATION.md](FOUNDATION_VALIDATION.md)。

## 未实施与未跑

没有改其他产品仓库或实现审计后端 adapter/错误 HTTP facade，没有真实业务后端/Go/PostgreSQL/鉴权/tenant/审计可靠性集成验证。审计 typed loader 和安全视图已由 xui 自身定义，实际服务后续适配；不承诺不可篡改、恰好一次、写入成功或审计事务保证。Clipboard 为模拟，触屏为 Chromium 模拟，200%为根字体放大；真实移动 OS、读屏器、Firefox/Safari、浏览器原生 zoom、SSR hydration 与生产性能未跑。合成例子不代表产品已迁移或性能提高。

用户已明确要求全部功能、文档、skill 与统一验收完成后正常推送 main。首次正常 push 的 CI 暴露以上修正，需要完整复验后追加普通修正提交并验证新 SHA 的 CI，保留首次推送和所有已有提交。push 前正常 fetch 比较远端；没有 force/reset/clean、文件树上传、秘密生成或发布部署授权。
