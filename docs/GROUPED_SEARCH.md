# Disclosure 与可折叠分组搜索

正式消费：[React](../examples/grouped-search-react/app.tsx)、[原生](../examples/grouped-search-vanilla/app.js)、[合成宿主读取模型](../examples/shared/grouped-search-model.ts)。这是通用 UI 组合，不内置会话、归档业务、查询缓存或后端协议。

## 为什么不能把 Disclosure 放进 Combobox.List

在固定的 Base UI 1.7.0 中，`Combobox.List` 的 Enter handler 只要存在 activeIndex 就会选择高亮项，不检查事件是否来自嵌套折叠按钮。`Combobox.Root inline open filter={null} → Input → List → Item + Disclosure(Item)` 因而不是 xui 支持的交互组合。即使没有复现错误，listbox 中也不应混入独立分页/折叠控件。

`Accordion.Root` 会建立另一份 CompositeList，影响 Item 注册；一个 Root 下放两个 List 又会竞争 listElement/listRef。两种写法均不在支持合同里。消费者不应添加 stopPropagation、穿透内部 DOM 或覆写 option 角色来补救。若需要每组内自由交互的表单/工具按钮，使用普通搜索和相应列表/表格语义，另设计键盘模式。

开发预览：运行 `pnpm dev`，待构建成功后在另一终端运行 `pnpm preview`；分别打开 `http://127.0.0.1:4173/grouped-search-react/` 与 `http://127.0.0.1:4173/grouped-search-vanilla/`。正式独立安装仍由 `pnpm test:consumer` 验证，完整回归为 `pnpm verify`。

## 最小公开组合

两端加载正式 `@coffeehc/xui-theme/style.css`；React 不隐式导入 CSS。

- React：`@coffeehc/xui-react/grouped-combobox` 的 `GroupedCombobox`。
- 原生：`@coffeehc/xui-runtime/grouped-combobox-dom` 的 `createGroupedCombobox(root, options)`，返回 `update/getElement/getInput/destroy`。
- 共享类型与验证：`@coffeehc/xui-runtime/grouped-combobox`。纯验证函数 `getGroupedComboboxItems` 返回全量与展开组的选项，不发请求。

结构固定为一个搜索输入、仅可折叠组的同名开关、一个 listbox 中的分组标题/选项、listbox 外按组名标注的分页。控制区的名称由 controlsLabel 设置（默认“显示分组”，不额外显示标题）。归档开关与归档组同名，aria-controls 关联稳定容器；折叠时容器 hidden，选项卸载。不会产生两个 listbox 的复合注册竞争。

```tsx
<GroupedCombobox
  label="搜索结果"
  inputValue={query}
  onInputValueChange={setQuery}
  groups={[
    {id: 'normal', label: '普通结果', items: normalItems,
      pagination: {page: normalPage, pageCount: normalPageCount}},
    {id: 'archive', label: '归档结果', items: archiveItems, open: archiveOpen,
      pagination: {page: archivePage, pageCount: archivePageCount}},
  ]}
  onGroupOpenChange={setGroupOpen}
  onPageChange={setGroupPage}
  value={selectedId}
  onValueChange={setSelectedId}
/>
```

原生传入同样的 options，并在宿主状态改变后调用 update。两端的 groups、inputValue、open、pagination 均受控；回调只请求宿主更新，不先行猜测接受。`value` 可受控；省略时使用 `defaultValue`（默认 null）。onValueChange 仅在接受不同的选中值时回调，重复激活已选项不重复通知。搜索不会填成已选名称，也不因清空查询而清空选中值。条目为 `{id,label,disabled?}`；id 是不透明字符串，在全部组中唯一，包括折叠组。两个组件实例可使用相同业务 id，DOM id 仍独立。

组省略 open 时始终显示，不显示开关；显式 true/false 表示可折叠受控组。组 disabled 禁用其选项、开关和分页；全局 disabled 禁用全部操作。busy 只报告 aria-busy，分页是否禁用由 pagination.disabled 明确控制。emptyLabel 用于组外状态反馈；它可以由宿主表示正在读取、无结果或错误，不能把三者混为一谈。page/pageCount 为正整数且 page 不超过 pageCount；不透明 cursor 的映射仍由宿主负责。

## 键盘、焦点与读取职责

| 情况 | 公共库 | 宿主 |
| --- | --- | --- |
| 查询 | 保持同一输入 DOM；单一 listbox 的 aria-controls/activedescendant | 一个 query 驱动两路过滤或远端请求；可防抖 |
| ArrowUp/ArrowDown、Enter | 跳过禁用候选，在展开且可用的选项中导航、选择；越过首尾先回无高亮的输入位置，DOM 焦点留输入；鼠标与 blur 不伪造键盘焦点 | onValueChange 执行业务选择；不会自动路由或发写请求 |
| 折叠开关 Enter/Space | 原生按钮只请求展开/收起，不触发列表选项选择 | 接受 open 状态；关闭时禁用归档读取并 Abort |
| 收起/替换选项 | 移除隐藏 options；活动项清除或回到仍可见的有效选项；不指向不存在的 DOM | 忽略取消后迟到结果，保留所需 query/selection |
| 分页 | 同组命名按钮、边界禁用；两组页码互不拥有 | 独立页码/游标和请求；查询变化如何重置由宿主决定 |
| 控制区焦点 | 更新保留按钮 DOM；聚焦的分页被移除时回该组开关，否则输入；不抢走已移到外部的焦点 | 关闭外层 Dialog/Sheet 时由外层拥有最终回焦点 |
| 卸载 | 原生 destroy 释放监听并还原 root；旧 handle 不可操作新 owner | 取消所属请求、释放订阅和外部数据 owner |

示例使用合成读取延迟，归档初始关闭时不读；展开才读；关闭取消正在进行的归档读取；关闭期间查询更新只读普通组；再次展开使用当前 query；两组各自分页。示例 generation/AbortController 是宿主参考实现，不是库内置请求引擎。

## Disclosure 默认箭头

`Disclosure` 保留 title/open/defaultOpen/onOpenChange/disabled 合同，defaultOpen 默认 false。默认指示器已由加减号改为装饰性 chevron。公开 `DisclosureIndicator({open,className?})` 可在库支持的按钮组合里复用；它固定 aria-hidden/focusable=false，不提供额外 accessible name。title 应是非交互标签内容，不嵌套按钮。

原生 `.xui-disclosure-trigger` 配合 `createDisclosureController` 自动获得同样的 chevron；已有 `.xui-disclosure-indicator` 时不重复插入。controller 只在 destroy 时移除自己插入的图标。自定义 indicator 应自己设置 aria-hidden，不能替代 trigger 的 aria-expanded/controls。

尺寸来自 control-icon-size，描边来自 icon-stroke-width，旋转/过渡复用 motion-disclosure-rotation、motion-duration-fast、motion-easing；reduced-motion 复用主题的全局归零规则。公开 `.xui-disclosure-label` 提供长标签换行，disabled 不响应 hover/pressed。受控收起包含当前焦点的内容时回到 trigger；已经移动到其他位置的焦点不会被抢回。

## 验证与限制

- [声明消费](../tests/fixtures/grouped-search-types.tsx)：正式 tarball 子入口、React props/原生 update 与错误类型。
- [纯合同测试](../tests/grouped-search.test.mjs)：跨组唯一 ID、隐藏组、disabled、分页边界、无业务过滤。
- [浏览器矩阵](../tests/browser/grouped-search.spec.mjs)：两端查询/独立分页/关闭取消/恢复、Enter/Space隔离、Arrow导航、唯一 ARIA 引用、受控/默认展开、disabled、长中文窄屏、主题/reduced-motion、移除分页回焦点与原生销毁重建。
- 本地检查及 CI 的实际结果另见提交说明。不能把测试已编写称作真实浏览器已通过；读屏器、SSR hydration、真实后端与产品集成需另验。

## 富业务分组导航与简单选择的边界

GroupedCombobox 继续服务简单 `{id,label,disabled?}` 选择，分页只有已知 page/pageCount；不扩成带按钮、链接、子树和上下文菜单的 option。未知 total/cursor 不能虚构 pageCount。

需要子层级、自定义图标、富标签、配置按钮或 ContextMenu 的业务条目，使用公开 Input + Section/Disclosure + 两个 NavigationMenu + 组外加载按钮。一个 query 驱动两个宿主读取状态，各自拥有 cursor/hasMore/busy/error，无需 total。关闭组取消所属读取，查询变化使旧 generation 失效，宿主必须丢弃取消后迟到结果；写动作不进入导航 adapter。导航仍是普通 nav 的单 roving 停靠，与输入/分组开关/加载按钮的正常 Tab 顺序相接，不是 listbox，也不需要 stopPropagation。

NavigationMenu 原已支持 children/resolveIcon/renderLabel/renderLink；本轮补齐单 button 的 renderButton、独立 sibling renderAction，以及原生等价 slots/decorator 生命周期。完整 API 与键盘规则见[导航富条目合同](NAVIGATION.md#富条目独立行尾动作与上下文菜单)。正式[React](../examples/rich-navigation-react/app.tsx)/[原生](../examples/rich-navigation-vanilla/app.js)消费者包含项目/成员合成数据、独立 cursor、异步配置防重复、关闭取消及上下文菜单，未接真实产品服务。
