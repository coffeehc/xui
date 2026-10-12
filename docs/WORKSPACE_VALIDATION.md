# 有界工作区与平台前置槽验证

范围：公开AppShell/MenuLayout/createMenuLayout，新增scrollMode=workspace与可选leading；不修改业务仓库、不部署、不声称真实Wails/hiddenInset验证。旧document默认与viewport主内容自然滚动合同保持不变。

## 可运行正式消费者

- `/workspace-react/`、`/workspace-vanilla/`：长历史与独立检查器两栏，正常流发送区域
- `?direct`：React直接AppShell；`?short`：短内容；`?plain`：空page slots
- `?wrapped&platform`：会换行的顶栏context与自动菜单之前的合成平台内容
- `window.workspaceDemo`仅供示例交互/验证：切换slots、leading、scrollMode和记录数，模拟导航；不提供业务服务

消费者从每次新目录安装的正式tarball ESM/CSS/types构建；原生不安装React。仅业务自身flex/height/min-size/overflow布局，未读取库内部尺寸、复制shell CSS或使用库内部selector。

## 检查与边界

新增unit检查公共mode/默认值、leading前置顺序与空槽、CSS剩余高度合同、消费者无内部样式补丁。Playwright几何和交互检查包括桌面1280/窄屏390×844、三主题、reduced-motion、长短历史/两栏、动态page slots/leading、正文DOM与草稿焦点保留、compact/drawer恢复、自然换行header与keyboard顺序。

此云执行环境的Chromium启动此前已返回socket EPERM，因此不重复尝试或规避限制。本地build/typecheck/unit/正式消费者结果与本提交GitHub Verify的浏览器终态分别记录；测试文件或源码检查不等于浏览器通过。真实桌面窗口控件、全屏切换、Wails拖动区域、移动OS、读屏器、Safari/Firefox仍未跑。


## 提交前本地结果（2026-10-12）

- build、token/design guard与typecheck通过；最终全量unit 233/233
- 完整test:consumer双端通过（公开exports/types、独立tarball、CSS隔离与性能门禁）
- 随后补齐两端NavigationMenu对workspace的选中项滚入可见判断；最终重建/typecheck/相关22unit通过，并再次全量unit 233/233
- 最终新建独立目录重新打包/安装两端产物，核对全部公开文件/类型并重新构建workspace消费者，两端通过；原生未引入React
- 新增Playwright 42例语法/收集通过；没有在受限云环境伪称浏览器通过。watch/cold-start与完整浏览器由该提交的GitHub Verify执行，终态以对应run为准
