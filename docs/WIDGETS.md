# 公共控件扩展的实现合同

唯一完整规则及默认值见[DESIGN](DESIGN.md)。本页是当前公开实现映射；[公开入口](PUBLIC_API.md)、[React消费者](../examples/widgets-react/app.tsx)、[原生消费者](../examples/widgets-vanilla/app.js)使用正式CSS/ESM/types，不依赖私有皮肤、源码alias或下游Tailwind扫描。合成宿主不是产品迁移。

| 能力 | React公开接口 | 原生公开合同 | 默认与所有权 |
| --- | --- | --- | --- |
| Command | `/command`的CommandPicker | `/widgets-dom`的createCommandPicker(root,options) | mode=single；multiple保留过滤前已选id；action回调不存选择。items={id,label,group?,keywords?,disabled?}；value/defaultValue均id数组，single至多一个。label必填，空态可改。数据/领域权限/远端搜索/动作busy由宿主，选择只是草稿，确认另由宿主执行 |
| Calendar | `/calendar`的Calendar，独立`/calendar` runtime model | createCalendar(root,options)、createCalendarModel | mode=single；range={start,end}，空端点null，start/end有序。严格YYYY-MM-DD，defaultMonth=YYYY-MM；locale默认zh-CN/weekStartsOn=1。显示只用UTC日期字段，无瞬时时区转换；业务时区与日期→时间端点转换由宿主明确。today可给确定日期，省略用当前UTC日。不猜字符串日期/毫秒/时区 |
| ToggleGroup | `/toggle-group`的ToggleGroup.Root/Item，peer props/ref/render | createToggleGroup(root,options)，现有button[data-value] | 单选默认，value/defaultValue是字符串数组；multiple/allowEmpty/disabled/orientation。allowEmpty默认true；false阻止取消最后一项，但不替宿主猜初始值。方向键/Home/End只移动焦点，Space/Enter选择；不冒用Tabs语义 |
| Accordion | `/accordion`的Accordion.Root/Item/Header/Trigger/Panel | createAccordion(root,options)，公开details[data-value]/summary/内容类 | value/defaultValue为id数组，默认single，可multiple；禁用项原生data-disabled=true。Tab/Enter/Space按按钮/summary语义；peer1.7已弃用Accordion强制箭头roving，不编造键盘默认。展开内容由宿主，不接业务流程 |
| ScrollArea | `/scroll-area`的ScrollArea.Root/Viewport/Content | `.xui-scroll-area/.xui-scroll-viewport/.xui-scroll-content` | 浏览器原生滚动与滚动条，无第二JS引擎。Root由宿主给blockSize/maxBlockSize等界限；Viewport=min-size:0/overflow:auto，默认tabIndex=0、role=region、focusMode=gutter；显式inset通过CSS @scope同时移除gutter并向内绘制焦点，旧引擎保安全gutter，嵌套边界各自选择，宿主给aria-label。内容同节点更新保留滚动，宿主拥有路由历史恢复和任意虚拟化 |
| InputGroup | `/forms`的InputGroup.Root/Addon/Input/Textarea/Button，复用Field/Input | `.xui-input-group`内`.xui-input-addon/.xui-input/.xui-textarea/.xui-input-action` | 一个Field仍只有一个control，Addon不领id；native label/for/help/error由宿主准确连接。focus-within仅组边界，输入自身无第二outline；invalid由Field或aria-invalid合成。内嵌Button type=button，显式disabled不猜busy |

Command复用已安装的Combobox：inline列表、搜索、分组、空态、disabled、选择与键盘；只声明上述稳定组合，不照搬cmdk。原生输入保持DOM identity，aria-controls/activedescendant/selected/multiselectable同事实；ArrowUp/Down/Home/End跳过disabled，Enter执行，Escape清过滤而保留选择。action不作权限/副作用校验，也不自动等待/重放业务。需要远端搜索或更细peer部件时组合已有Combobox/Select，不能用私有默认样式补丁。

Calendar使用一个框架无关model；更新一次发布一致快照，选相邻月份后保留所选日焦点。Arrow左右一天、上下七天、Home/End周端、PageUp/Down按月并夹到有效日，Enter/Space走按钮选择；禁用日期可焦点读取但不能选择，clear清空选择。月份查看不是业务查询，动画不等待操作。没有时间选择器、农历、复杂可用性/节假日或预约引擎。defaultMonth只定义初始视图；月份查看由库保存，runtime model可显式moveMonth，日期value由宿主按受控合同确认。

原生工厂只拥有指定root，update(partial)保留选项；受控value由宿主确认，defaultValue只读初始。destroy恢复创建前root/相关控件属性并释放监听/计时器；destroy幂等，已销毁update无效，旧句柄不影响重建owner。同root不能重复创建活跃widget。Callback只能接受公开事实；安全权限/业务结果由宿主确认。原生ScrollArea/InputGroup为HTML合同，没有隐式controller。React同peer单实例，原生不引入React。

## 多行输入与上下工具区域

`InputGroup.Root` 的 `layout='inline'` 为默认旧横排，显式 `stacked` 按 DOM 纵向排列、拉伸控制项。`InputGroup.Textarea` 就是已存在的 Textarea 函数，直接接受 textarea props/ref；id、name、required、label/help/error 继续由 Field 与真实控制项共同绑定。只生成 xui-textarea，不额外套 xui-input。上下 `Addon` 使用 span，放合法短语内容、附件文字和按钮；自然换行，采用既有 padding/gap，空 Addon 不占位，不新增 Toolbar part。

```tsx
<Field label="草稿" help="可输入多行" required>
  <InputGroup.Root layout="stacked">
    <InputGroup.Addon><span>附件.txt</span><InputGroup.Button>移除</InputGroup.Button></InputGroup.Addon>
    <InputGroup.Textarea name="draft" defaultValue="保留草稿" />
    <InputGroup.Addon><InputGroup.Button>附加文件</InputGroup.Button><InputGroup.Button disabled>发送</InputGroup.Button></InputGroup.Addon>
  </InputGroup.Root>
</Field>
```

原生使用 `.xui-input-group[data-layout='stacked']`，内部直接 `textarea.xui-textarea` 和上下 `span.xui-input-addon`；label for、help/error id、aria-describedby/aria-invalid/required 由宿主连到 textarea。唯一背景、边线和 focus-within 在组外壳；直接 Input/Textarea 不再画边线/背景/outline，Textarea 自身的 padding、字体、最小高度与原生 resize 保留。焦点中的工具按钮仍有可辨指示；invalid 与 focus 共存。组的 invalid/disabled 只由直接真实 Input/Textarea 与既有 Field error 投影，单独禁用发送按钮不会灰掉可编辑区域；没有第二个 Root.disabled/invalid owner。readOnly 保留原生选择/复制和焦点语义。

库不处理 Enter/IME/提交策略、发送 busy、草稿和附件状态。正式 [React](../examples/widgets-react/app.tsx) / [原生](../examples/widgets-vanilla/app.js) 的“多行字段组合”给出合成示例；`widgetsDemo.setComposerState` 可改变 layout/disabled/readOnly/invalid/sendDisabled/emptyAddons，`getComposerControl` 返回真实 Textarea，`getComposerEvents` 仅计合成 composition start/update/end 事件，不构成 OS IME 验收。没有具体产品域模型或网络调用。

## Button与选择控件补齐

Button variant=link提供文字链接外观，默认type=button。button继续Enter/Space执行；真正导航需render原生a、nativeButton=false和role=link（或直接原生a.xui-button[data-variant=link]）。链接保留Enter、Space不模拟点击、修改键/中键/target/download；外观不改变导航所有权。aria-busy仍不自动disabled，焦点独立可见。

SimpleSelect/Checkbox/Radio/Switch的controlSize=sm/default/lg是视觉尺寸，默认default；SimpleSelect的size:number只作为隐藏表单桥事实。显式NativeSelect平台API保留原生size:number，默认采用政策见[DESIGN](DESIGN.md#公共复用与状态矩阵)，不增全局密度模式。原生用data-control-size对应。选择readOnly由公共层阻止click与Space（radio也阻止改变选择的箭头），保留Tab/指针焦点与aria-readonly；不等于disabled。React受控checked和非受控defaultChecked均支持，readonly不触发onChange。原生checkbox/radio调用bindReadonlyChoice(input)，使用input.readOnly事实、sync更新ARIA，destroy释放；不使用HTML readonly属性单独冒充功能。disabled走原生disabled，表单提交语义不改。

## 平台输入边界

NativeSelect / 原生 select / bindHeaderLocaleSelect 保留 OS 选择合同，CSS 外壳不能统一系统菜单。文件窗口、日期/颜色窗口、浏览器自动填充与密码管理器、移动键盘也属于浏览器/OS 能力；需要统一 date-only 日历时使用 Calendar。HTML 不支持 file/range/color 的 readOnly，不能用无效属性冒充只读或静默改成 disabled。Checkbox/Radio/Switch 只读使用上方公开 guard/binding，文本 Input/Textarea 保留原生 readOnly。

Avatar 的被动图像、fallback 与名称合同见 [DISPLAY.md](DISPLAY.md#avatar)。

## 受测范围

专项[控件浏览器](../tests/browser/widgets.spec.mjs)、[日期与取消单测](../tests/calendar.test.mjs)及[登录扩展](../tests/browser/login-extensions.spec.mjs)在正式打包消费者运行；实际执行范围与限制见 [VALIDATION.md](VALIDATION.md)。根字号200%只属于文字放大；真实OS/读屏器/Safari/Firefox、Wails窗口、产品接口和生产性能另验，不由源码/合成例子推断通过。



## GroupedCombobox 与 Disclosure

正式消费：[React](../examples/grouped-search-react/app.tsx)、[原生](../examples/grouped-search-vanilla/app.js)、[合成宿主读取模型](../examples/shared/grouped-search-model.ts)。这是通用 UI 组合，不内置会话、归档业务、查询缓存或后端协议。

### 为什么不能把 Disclosure 放进 Combobox.List

在固定的 Base UI 1.7.0 中，`Combobox.List` 的 Enter handler 只要存在 activeIndex 就会选择高亮项，不检查事件是否来自嵌套折叠按钮。`Combobox.Root inline open filter={null} → Input → List → Item + Disclosure(Item)` 因而不是 xui 支持的交互组合。即使没有复现错误，listbox 中也不应混入独立分页/折叠控件。

`Accordion.Root` 会建立另一份 CompositeList，影响 Item 注册；一个 Root 下放两个 List 又会竞争 listElement/listRef。两种写法均不在支持合同里。消费者不应添加 stopPropagation、穿透内部 DOM 或覆写 option 角色来补救。若需要每组内自由交互的表单/工具按钮，使用普通搜索和相应列表/表格语义，另设计键盘模式。

开发预览：运行 `pnpm dev`，待构建成功后在另一终端运行 `pnpm preview`；分别打开 `http://127.0.0.1:4173/grouped-search-react/` 与 `http://127.0.0.1:4173/grouped-search-vanilla/`。正式独立安装仍由 `pnpm test:consumer` 验证，完整回归为 `pnpm verify`。

### 最小公开组合

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

### 键盘、焦点与读取职责

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

### Disclosure 默认箭头

`Disclosure` 保留 title/open/defaultOpen/onOpenChange/disabled 合同，defaultOpen 默认 false。默认指示器已由加减号改为装饰性 chevron。公开 `DisclosureIndicator({open,className?})` 可在库支持的按钮组合里复用；它固定 aria-hidden/focusable=false，不提供额外 accessible name。title 应是非交互标签内容，不嵌套按钮。

原生 `.xui-disclosure-trigger` 配合 `createDisclosureController` 自动获得同样的 chevron；已有 `.xui-disclosure-indicator` 时不重复插入。controller 只在 destroy 时移除自己插入的图标。自定义 indicator 应自己设置 aria-hidden，不能替代 trigger 的 aria-expanded/controls。

尺寸来自 control-icon-size，描边来自 icon-stroke-width，旋转/过渡复用 motion-disclosure-rotation、motion-duration-fast、motion-easing；reduced-motion 复用主题的全局归零规则。公开 `.xui-disclosure-label` 提供长标签换行，disabled 不响应 hover/pressed。受控收起包含当前焦点的内容时回到 trigger；已经移动到其他位置的焦点不会被抢回。

### 验证与限制

- [声明消费](../tests/fixtures/grouped-search-types.tsx)：正式 tarball 子入口、React props/原生 update 与错误类型。
- [纯合同测试](../tests/grouped-search.test.mjs)：跨组唯一 ID、隐藏组、disabled、分页边界、无业务过滤。
- [浏览器矩阵](../tests/browser/grouped-search.spec.mjs)：两端查询/独立分页/关闭取消/恢复、Enter/Space隔离、Arrow导航、唯一 ARIA 引用、受控/默认展开、disabled、长中文窄屏、主题/reduced-motion、移除分页回焦点与原生销毁重建。
- 实际结果与未测限制见 [VALIDATION.md](VALIDATION.md)；读屏器、SSR hydration、真实后端与产品集成需另验。



富条目含链接、子树或独立动作时，按 [NAVIGATION.md](NAVIGATION.md#富业务分组导航与简单选择的边界) 组合普通导航，不把独立交互塞入 listbox。
