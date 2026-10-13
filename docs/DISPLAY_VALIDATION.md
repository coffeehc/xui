# A1/A3 检查记录

范围：Typography/Copyable、Separator/Tag/Image，仅 xui；基线 bcd2fa8，2026-10-13。

- 通过：正式 build、token/design-value guard、tsc --noEmit；10 项 React/native 专项模型/DOM 单元、全仓 440 项单元；root/subpath/types/CSS/init 正式 tarball 独立消费者、无源码 alias 与原生无 React、按需体积门槛。最终 watch 增加双端 display 产物断言并通过（175 秒），覆盖 token/CSS/TSX/types/init、原子保存、失败保留上一代与恢复。
- 原生单元是轻量 DOM 模型，不冒充浏览器或读屏验证。SSR renderToString 已在单元与独立安装 hydration fixture 生成时检查；真正 hydrateRoot 交互仍受下面启动限制。
- 浏览器：新增双端键盘复制/失败、Tag 移除后显式输入焦点、禁用、真实锚点导航，图片旧 src 晚到/失败/手动重试/稳定外框，1440/390/320 的 light/dark/system 变化、reduced-motion/forced-colors 场景，及 Node SSR→真实 hydrateRoot 场景。使用 chromiumSandbox:true、args:[]；CI 使用官方 Chrome。云环境实际启动在 Chromium process_singleton_posix.cc 的 socket() EPERM 退出，场景未执行，不算通过；没有关闭 sandbox、修改安全设置或用截图/DOM 断言代替。
- 真实浏览器 200% zoom、触屏 OS、人工读屏与其他浏览器未执行；需要受支持的安全浏览器环境继续验。字体放大/deviceScaleFactor 不作为真实 zoom 的替代。
- cold-start 原有测试在本基线硬编码 --no-sandbox；本任务未运行该不安全分支，交主 owner 的安全 CI 统一处理。根 pnpm verify 未整体通过：pnpm 的运行前自动安装尝试写入只读 /home/agent 路径，本任务直接执行同名 package scripts 的 Node/tsc 命令，不改目录权限。
- 这些是公共合成示例，不证明 xapi、Argus、xquant 或 xAgent 已采用，也不涉及真实凭据、用户业务数据、认证后端、部署或本地电脑。
