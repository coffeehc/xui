# 数据驱动导航与菜单布局

本文件记录实现接口；完整通用规则仅在 [DESIGN.md](DESIGN.md)。React 从 `@coffeehc/xui-react/menu-layout` 导入 NavigationMenu、MenuLayout；原生从 runtime/navigation 导入 createNavigationMenu，从 runtime/menu-layout 导入 createMenuLayout。双方共用 runtime/navigation 的 NavigationItem、NavigationMenuOptions、NavigationAdapter 等类型。

它们使用预构建 navigation/layout CSS；可直接导入 theme/critical.css 或 style.css，默认选中竖线、背景、文字、图标、focus 与 motion 不需要宿主补写。

```ts
import type {NavigationItem, NavigationAdapter} from '@coffeehc/xui-runtime/navigation';
const items: readonly NavigationItem[] = [
  {id:'overview', label:'总览', icon:'home', href:'/overview'},
  {id:'work', label:'工作空间', group:true, children:[
    {id:'library', label:'资料库', icon:'folder', href:'/library'},
  ]},
];
const navigation: NavigationAdapter = {
  navigate(request) { hostRouter.navigate(request.url); },
};
// hostRouter 是宿主自己的路由接入，不是 xui API。
```

```tsx
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
<MenuLayout title="工作台" items={items} location={currentURL} navigation={navigation}>
  <PageHeader title="当前页面" actions={<Button>新建记录</Button>}/>
  {pageContent}
</MenuLayout>
```

```ts
import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
const layout = createMenuLayout(root, {title:'工作台', items, location:currentURL, navigation});
// root 原有内容进入 main；菜单结构由库生成。路由订阅在宿主注册一次。
const off = hostRouter.subscribe(url => layout.update({location:url}));
// 卸载时先取消宿主订阅，再终止该布局的监听；destroy 幂等。
off(); layout.destroy();
```

## 共享数据与内容扩展

数据只保存 id、label、icon 标识、href、children、group、disabled、target、download、rel，可在两个宿主共用 JSON。id 必须非空且全树唯一，label 非空；循环、重复 id 和同时是 group/link 的数据抛 TypeError。group 是始终展开的分组标题；没有 href 的有子项节点是展开按钮；有 href 且有子项节点使用一个链接和独立展开按钮，始终没有嵌套链接。disabled 向后代继承；可见数据与权限过滤由宿主提供。数据按不可变数组使用，React 更新时提供新数组。

icon 内置 menu/home/folder/document/settings；宿主可一次提供 resolveIcon(name)，返回 viewBox/paths 的 SVG 描述。文字/图标随默认语义 token，运行时不维护色板。未知图标有 menu 回退。React 可选 renderLabel(item) 与 renderLink(item) 扩展内容/路由链接；renderLink 返回一个透传 props/ref 的链接组件，遵守 [NavItem 组合规则](IMPLEMENTATION.md)。已经使用 navigation adapter 时不必再逐项添加路由回调。

## 当前项与一次导航适配

activeId 省略时根据 location 选择；默认匹配同源精确 pathname，归一化末尾斜线，忽略 query/hash，不做前缀匹配。并列匹配按数据顺序取首个。需要 query/hash 或产品路由策略时只在菜单根提供一个 matchLocation(item,currentURL,targetURL)。显式 activeId 优先，null/不存在/禁用/非链接项表示无选中；不会强制选择第一项。宿主更新 location/activeId，不在每项重复维护 selected。非受控展开自动打开选中项的祖先，以便选中可见；选中父链接本身不会代替其展开按钮。

navigation 是显式 opt-in。只接管未取消、无修改键的普通主键、同源 HTTP(S) 链接，保留中键、修改键、target 和 download。canNavigate(request) 返回 false 时保留原生行为；没有 adapter 时普通链接也按原生行为。request 提供 id/href/解析后的 url/sameLocation/原始 event；同址仍交给宿主，是否产生 history entry 由宿主决定。库不订阅 history、不猜测产品路由。参考示例只有一次 history adapter/popstate 订阅，前进/后退同步 location，query 匹配由宿主明确提供。

## 状态、键盘与布局

collapsed/defaultCollapsed/onCollapsedChange、expandedIds/defaultExpandedIds/onExpandedChange 支持受控与非受控。受控操作只发请求，React 更新 props 或原生 update 确认后才改变事实；default 值仅初始化。MenuLayout 保管非受控菜单状态，使桌面与窄屏转换后仍保留展开/紧凑状态。桌面紧凑状态保留可访问名称与图标，窄屏抽屉显示完整标签；分组和长中文不裁切关键内容。

键盘采用普通 nav/link 语义与单一菜单项 tab stop，方向键/Home/End 跳过隐藏和 disabled；左右展开/收起及回父节点，RTL 反转左右。展开按钮的 Enter/Space、链接 Enter 和修改键沿用原生语义。focus 独立可见；移除/隐藏焦点项时回退可用项，空菜单回退紧凑按钮。

MenuLayout 还提供 title/header、children（原生 content Node 或原有 root 内容）、sidebarOpen/defaultSidebarOpen/onSidebarOpenChange、label/emptyLabel/compactLabel/expandLabel/skipLabel/closeLabel。窄屏使用现有模态 drawer，Esc/关闭/成功 adapter 导航请求关闭并回可见触发器；变宽关闭 drawer。受控 sidebar 仍须宿主确认。菜单导航不替换 shell/main 或未变更的链接节点；同一组件持续挂载时保留页面输入。React 的内容状态由宿主正常保管，不给布局添加路由 key。断点切换时 React sidebar 部件可重挂载，布局保管菜单事实；不承诺任意 renderLink 私有状态跨断点保留。

## 原生生命周期与正式消费者

原生 owner 的 update(partial) 合并选项，验证新数据后提交；无效数据保留旧菜单，匹配 id 的链接复用。getMenu()/getMain()/getSidebarOpen() 读取布局，菜单 owner 提供 getElement()/getState()/setCollapsed()/setExpanded()；布局选项统一通过 layout.update 更新。同一种 factory 不可在同一 root 重复创建活跃 owner，宿主只给该 root 一个所有者；destroy 后可以重建，更新已销毁 owner 无效。destroy 移除库监听、关闭 drawer，恢复创建前的 root 内容和属性；宿主自己的订阅/事件由宿主释放。原生 header/content 更新通过公开 Node，不复制内部菜单结构。

正式消费者在 examples/menu-react 与 examples/menu-vanilla，共用 examples/shared/menu-data.json，独立 tarball 编译和打包。预览为 `/menu-react/` 与 `/menu-vanilla/`；测试入口仅用于合成验证，不访问产品后端。它们不用示例私有 CSS。HTTP/query 已实现，接入合同见 [HTTP.md](HTTP.md)；API Key 通用管理见 [API_KEY.md](API_KEY.md)，结构化日志只读查询见 [LOGS.md](LOGS.md)，拟议 facade 由宿主后端实现。


## 冷启动与路由ready边界

navigation adapter必须在第一个可操作菜单呈现时已连接，并保持同一个宿主router owner。canNavigate=false的正式含义是保留原生document导航，不能把它当“router/鉴权/动态路由尚未ready，暂不执行”的阻止开关；缺少adapter也有相同原生行为。必要的未就绪状态由宿主提供真实disabled/状态，或在已经接管preventDefault的navigate内部明确处理，不以几分钟定时等待掩盖初始化问题。真实权限仍由服务端校验。

冷启动取证区分主frame的Document请求/新document identity、history同文档路由，以及旧shell DOM是否重新挂载；单看“页面重新显示”不能确认reload。菜单更新保留同一shell/main/主题owner，不能因route key重挂整个外壳；非SPA链接、修改键、target/download的原生行为保留。初始化、主题订阅与watch构建本身不自动发reload；参考页的界面重载按钮是明确用户动作，登录默认location.assign也是确认登录/继续的宿主导航边界，不与菜单routing混用。

本轮六组正式tarball消费者在冷缓存、资源延迟和已命中三份资源的暖缓存下，0/30/60/120/180秒共360菜单点击、60次前进/后退，只有每组初始一个Document请求，document/timeOrigin/shell/theme与草稿保持，无pageerror。移除adapter或canNavigate=false的两宿主受控对照均复现document导航，随后已连接adapter的点击保持SPA；这证明合同边界，不证明任何产品使用了错误gating。完整本地记录在.artifacts/cold-start/与cold-start-probe.log。

用户后续更正：问题发生在本地新接入版本，尚未部署，未访问用户本机。此前旧线上页面不能用于归因本地新版本，线上取证已停止。本地具体dev命令、两个watch/HMR日志、路由ready状态和初始资源版本尚未提供；需要用户后续提供安全日志或由采用任务在对应云环境取证，不收集真实凭据、响应body或cookie。云端独立dev对照须另记录实际optimizer/HMR因果，不能用生产消费者未复现就排除dev问题，也不能笼统归因“未就绪”。


### Vite开发模式的已复现依赖优化刷新

Vite8.2.2独立安装xui tarballs的合成宿主，以运行时生成的路径懒加载Select/Combobox/ContextMenu。首次依次加载三个deep import时，终端三次记录dependency optimized与optimized dependencies changed. reloading，HMR三次full-reload，主Document从1到4且document identity改变；相同页面再次点击稳定。暖依赖缓存同代码为1个Document/0 reload；冷缓存显式include相同依赖也为1/0。按钮触发而非anchor默认导航，未注入认证/SSR/主题跳转，未关HMR/优化或吞错误。实际记录见.artifacts/vite-cold/results.json与vite-cold-probe.log。

这证明当前库深入口与不可静态发现的懒加载组合能够触发Vite dev重新优化，不能据此声称已确认用户本地的相同原因。[Vite原生说明](https://vite.dev/guide/dep-pre-bundling)与[optimizeDeps选项](https://vite.dev/config/dep-optimization-options)明确这是dev机制。生产tarball打包消费者的360次点击没有该机制；xui watch只构建dist与记录状态，不提供浏览器HMR/reload客户端。产品框架、插件和真实本地命令需要分别核对。

接入项目在自己的Vite配置中提前声明实际会由懒页面导入的公开入口；不能把canNavigate=false当ready veto，也不能靠等几分钟或禁止reload掩盖optimizer缺口。例如已验证的这三个页面：

```ts
export default defineConfig({
  resolve: {dedupe: ['react', 'react-dom', '@base-ui/react']},
  optimizeDeps: {include: [
    'react', 'react-dom/client', '@coffeehc/xui-react/button',
    '@coffeehc/xui-react/select', '@coffeehc/xui-react/combobox',
    '@coffeehc/xui-react/context-menu',
  ]},
});
```

include清单按宿主实际正式入口扩展，特殊第三方/CJS依赖保持自身协议和interop；不把此清单当所有产品固定依赖或新增runtime API。保留framework插件/已有配置，在隔离冷cache和暖cache分别核optimizer日志、HMR packet与Document请求，并确认peer单实例和正常懒加载。没有在xAgent、用户本机或其他产品改配置；其真实本地日志仍待提供。

可重复回归：[tests/cold-start/vite.test.mjs](../tests/cold-start/vite.test.mjs)，构建后执行 `pnpm test:cold-start`；完整 `pnpm verify` 也包含它。脚本重新 pack 并安装独立宿主，固定 Vite 8.2.2、React 19.2.8、Base UI 1.7，使用全新、相同暖、独立 include 三组 cache。结果保存至 `.artifacts/vite-regression-*/results.json`，断言默认 cold 为 3 个 full-reload/4 个 Document，warm 与明确 include 均为 0/1。`@vite-ignore` 是夹具模拟无法静态发现路径的条件，不是给产品的修复建议。记录保留失败，未访问产品、真实服务或本机。

采用项目的 Codex 核对提示：

> 固定产品与 xui SHA，读取 AGENTS、adopt-xui 和真实 Vite/plugin/watch 配置。分别保存 fresh optimizer cache 与 warm cache 的安全日志、HMR full-reload 次数、主 Document 请求及 shell identity；确认是否出现 `dependency optimized` / `optimized dependencies changed. reloading`，逐个对应实际懒模块的公开深入口。只把无法扫描且真实使用的入口加入 optimizeDeps.include，保留插件与 peer dedupe；不用任意全扫描 glob、关 HMR、等几分钟、吞错或改生产构建来替代原因定位。从首次可操作菜单核 adapter 已接管，canNavigate=false 是 native fallback；路由 pending 在已接管的 navigate 内或真实 disabled 状态处理。确认公共 watch 的 BUILD_SUCCESS/sourceSha256 与 formal dist 代际；对 watch failure 保留旧产物并显示状态。按相同操作回归 cold/warm、键盘、修改键、回退前进、草稿和三主题，报告原因已证实/候选、实际 SHA、通过/失败/未跑。不用独立夹具结果代替产品现场归因，不访问用户电脑或真实凭据。

公共 `pnpm dev` 默认持续构建所有包与消费者，`--packages-only` 只构建包。两者输出 `BUILD_SUCCESS <sourceSha256>` / `BUILD_ERROR` 与 `.artifacts/watch-status.json`；预览另运行 `pnpm preview`。watch 没有浏览器 HMR 客户端，采用 Vite 的产品拥有自己的 dev server。产物生成失败保留上一完整代际，不能把页面仍可打开当成新构建成功。生产消费者验收继续用 `pnpm test:consumer` 的独立 tarballs，不使用 optimizer 热修来修正式 prod。

## 外壳的document与viewport滚动模式

AppShell/MenuLayout及createMenuLayout新增scrollMode=document|viewport，默认document，保留原有文档滚动。原生公开标记为data-scroll-mode。viewport根为100dvh有界grid，正文行minmax(0,1fr)，sidebar/main均min-height:0且独立overflow:auto；窄屏复用既有drawer的有界Body，不加第二drawer。宿主嵌入非全窗口时给公开Root style的blockSize，不穿透私有子元素调整默认皮肤。

viewport更新选中项以nearest进入所属侧栏可视区域；焦点依靠浏览器所属滚动区滚入可视区，菜单键盘规则不另建owner。同一main与内容节点更新保持滚动/输入；产品导航历史如何按route保存和恢复各容器scroll位置由宿主决定，不按route key重挂整个shell。官方两[控件消费者](WIDGETS.md)演示24项长菜单、长正文、横/纵滚动表格与反向导航；实际窄屏/文字放大和焦点验收见最终记录。

固定高度宿主可使用 React `MenuLayout` 的公开 `style={{blockSize:480}}`（或 AppShell 的同一 Root style），原生给传入的 root 设置 `style.blockSize`，并显式选 `scrollMode='viewport'`。这时侧栏和正文分别滚动，选中菜单滚动到可见范围；不靠子元素私有选择器修补，也不把滚动恢复策略移入库。

抽屉关闭先释放本次模态，再调用宿主 `navigation.navigate`。默认回焦点仅在当前焦点仍属于关闭的抽屉或没有有效焦点时执行；宿主已将焦点放到新路由标题、外部控件或新模态时保持它。React `restoreSidebarFocus={false}` 可显式关闭恢复；原生 `createDialogController`/Sheet/AlertDialog 的 `restoreFocus` 可用布尔值或接收 `DialogCloseDetails.reason` 的函数，`close(reason)` 与受控 `syncOpen(false, details)` 保留原因。原生 MenuLayout 的导航关闭原因是 `navigation`，取消/Escape 仍按普通关闭处理。旧 owner 的延迟 close 事件或重复 destroy 不得夺取新 owner 焦点。

## 应用头部角色与紧凑侧栏迁移

`AppShell`、`MenuLayout` 的 `headerSlots: AppHeaderSlots` 接收 `brand`、`breadcrumb`、`status`、`actions` 四个 React 内容角色；`AppHeader` / `AppHeaderProps` 从 `@coffeehc/xui-react/layout`（及根入口）导出，可独立组合，直接接收这四个 props，另有 `navigation` 和兼容内容 `children`。`AppShell` 持有抽屉触发器，宿主不要再添加一套菜单开关。

`AppShell` 未传 `headerSlots` 时保留旧header直接排列，显式传角色对象才启用新组合。`MenuLayout` 的 `title` 仍可用：未提供 `headerSlots.brand` 时作为品牌回退；显式 `null` 隐藏回退。旧 `header` 仍渲染在兼容区域，可和新角色并存。品牌/面包屑组成左侧主组，状态/动作在右侧；窄屏先保留导航/品牌，breadcrumb在主组内独占下一行，再将状态和动作换行，避免200%文字把路径挤成单个字。长中文品牌和 breadcrumb 在自己的空间省略，不挤散另一组；完整文本不从 DOM/可访问名称删除。动作只换行，不自动隐藏。必要业务反馈仍由宿主决定放置，库没有授权、版本、返回等业务规则。

```tsx
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Breadcrumbs} from '@coffeehc/xui-react/navigation';
<MenuLayout title="团队工作台" items={items} headerSlots={{
  breadcrumb: <Breadcrumbs aria-label="当前位置"><li><a href="/projects" title="项目资料">项目资料</a></li><li aria-current="page" title="当前记录">当前记录</li></Breadcrumbs>,
  status: <span role="status">已连接</span>,
  actions: <><Button variant="outline">帮助</Button><Button>新建</Button></>,
}}>{pageContent}</MenuLayout>
```

原生 `MenuLayoutHeaderSlots` 从 `@coffeehc/xui-runtime/menu-layout`（及根入口）导出；同名角色接收 `Node | null`，支持 `DocumentFragment` 组合，已有 Node 由布局移动而非复制。宿主保留这些 Node 引用修改内容/注册业务事件，无需查询库内部 DOM。`headerSlots` 是一个完整值：`update({headerSlots: nextSlots})` 替换整份角色配置；仅更新 `location` / 菜单状态不会替换头部内容或已消费的 fragment，不丢失控件焦点。一个 Node 只能归属于一个 slot。

```js
const actions = document.createDocumentFragment();
actions.append(helpButton, createButton);
const headerSlots = {breadcrumb: breadcrumbNode, status: statusNode, actions};
const layout = createMenuLayout(root, {items, title:'团队工作台', headerSlots});
layout.update({location: nextURL});
// 清除动作，保留其他角色；brand未指定仍使用title。
layout.update({headerSlots:{...headerSlots, actions:null}});
```

公开 CSS 结构为 `xui-app-header`、`xui-app-header-primary/secondary` 和 `xui-app-header-navigation/brand/breadcrumb/status/actions/legacy`。React 与原生使用相同 `theme/layout.css`；普通采用应使用 props/Node，不穿透结构改排列。`AppHeader` 是 div 组合，独立使用时由宿主提供所属语义 header。breadcrumb 内容可以使用公开 `Breadcrumbs` / `.xui-breadcrumbs` 的 nav/ol/li/a 结构；链接的焦点轮廓保持在截断边界内。

紧凑侧栏默认216px展开、60px收起；这些数值是根16px下的 CSS 像素，非设备像素。公开token `--nav-sidebar-width`、`--nav-sidebar-padding`、`--nav-collapsed-width` 与 `--nav-collapsed-item-size` 在 DESIGN 中定义，默认36px项+左右各12px；图标仍16px，选中短竖线/hover/独立focus不改变宽度。独立支路开关收起时移到所属链接下一行，窄屏抽屉恢复完整标签与既有键盘/路由合同。独立使用 NavigationMenu 的外层宽度由宿主布局决定，MenuLayout 才拥有完整侧栏宽度。

迁移顺序：先固定新SHA并重新构建正式包；把原 header 中品牌/路径/状态/动作内容分别送入公开角色；删除消费方仅用于通用 header flex/grid/gap、长中文截断、紧凑栏宽度和图标对齐的 CSS。保留领域内容布局、授权判断、事件、路由和有明确理由的产品token覆盖。不要删除业务规则来套入公共布局，不再叠加第二条rail。新合成验收与覆盖矩阵见[布局与文字验收](LAYOUT_TYPOGRAPHY_VALIDATION.md)。
