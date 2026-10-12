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

线上产品已登录菜单及其实际部署bundle尚未完成现场取证：本云环境访问xagent.51apis.com返回ERR_TUNNEL_CONNECTION_FAILED；父任务匿名根页跳登录并记录React #418/client-CmZD9ipx.js，仅证明登录启动hydration错误，不能认定与菜单reload同根，也不能假设当前Git main就是该线上产物。产品需在合法会话的云浏览器按上述Document/路由/重挂指标补冷暖对照，核首次adapter/ready状态和实际资源版本；不索取或记录真实凭据、响应body或cookie。
