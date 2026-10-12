# 侧栏底部插槽验收

本轮在 `f64a5f2` 后新增公共底部区域，并按追加要求统一顶栏菜单开关。旧布局/文字验收成绩不作为本轮结果；下表为本轮可执行覆盖，实际命令与CI终态在完成后补录。唯一视觉合同见[DESIGN](DESIGN.md)，[公开API](PUBLIC_API.md)与[迁移示例](NAVIGATION.md#侧栏底部接入与迁移)同步维护。

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

本次本地 build、check:tokens、typecheck 与168项单测通过；两套独立tarball消费者的全部正式exports/types、示例构建和体积门禁通过。专项Playwright共37项已收集，尚未以收集数冒充实跑通过。watch本地一次在30秒等待门限超时（包构建已完成，完整示例代际尚未完成），保留该失败记录。

云端执行环境存在已确认Chromium socket限制，不更改沙箱/浏览器参数绕过；当前完整pnpm verify（含watch、cold-start与真实浏览器）由本次提交的标准GitHub Verify任务执行，CI终态待验证。不得以此前成功、源码检查或Playwright用例数量冒充当前实跑通过。

未声明：产品真实权限/后端集成、用户本机、部署、移动OS、真实读屏器、Firefox/Safari、SSR/hydration、生产性能。合成授权/版本文案仅由示例宿主提供，库没有权限和版本业务逻辑。
