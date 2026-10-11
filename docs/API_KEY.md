# API Key 通用管理

完整通用规则只在 [DESIGN.md](DESIGN.md)。本组件提供脱敏列表、创建表单、一次性结果、明确复制与撤销确认，不实现认证服务、密钥生成、权限策略或后端存储。

## 公开入口与同一 owner

共享类型与 createApiKeyManagerController 从 `@coffeehc/xui-runtime/api-key` 导入；原生完整工厂 createApiKeyManager 从 `@coffeehc/xui-runtime/api-key-dom` 导入；React ApiKeyManager 从 `@coffeehc/xui-react/api-key` 导入。源码/types 为 [共享合同](../packages/runtime/src/api-key.ts)、[原生视图](../packages/runtime/src/api-key-dom.ts)、[React 视图](../packages/ui-react/src/api-key.tsx)，正式包只包含构建产物。组件消费既有公开表格、Field/Fieldset、按钮和 Dialog 的默认 CSS，不另造皮肤或 motion token。

宿主创建一个 controller，传给任一视图；组件订阅状态并调用它，不再叠加第二套写入/resource/认证 owner。HTTP、身份与 endpoint adapter 归宿主，见 [HTTP.md](HTTP.md)。没有隐式请求、自动挂载读取或全局凭据 store；宿主明确 controller.refresh()，生命周期结束 destroy()。

## 数据与宿主回调

| 数据 | 合同 |
| --- | --- |
| ApiKeyMetadata | id/name、只用于显示的 prefix、permissionIds、createdAt/expiresAt/lastUsedAt、status；日期/prefix/status 可以为 null，unknown 状态保留，不由浏览器时钟推断 |
| ApiKeyPermission | 宿主声明的 id/label、可选 description/disabled；不是产品权限模型 |
| ApiKeyExpiry | 宿主声明的 id/label，defaultExpiryId 必须在 options 中；组件不把天数转换成真实时间或猜“永久”权限 |
| ApiKeyDraft | name、permissionIds、expiryId；宿主将选项 id 映射成自己的后端合同，不添加业务字段猜测 |
| CreatedApiKey | metadata 与 secret；后端生成完整值，只有创建成功回调返回它 |
| adapter.list | 接收 {signal}，返回当前要显示的 metadata 数组；没有假设其后端分页/总数/endpoint |
| adapter.create | 接收冻结的 draft 与 {signal}，返回 CreatedApiKey；失败必须 reject |
| adapter.revoke | 接收冻结的 metadata 与 {signal}，确认成功返回 void；失败必须 reject，false/null/对象不被当成成功 |

parseApiKeyMetadata 验证精确公开字段并复制冻结 allowlist，剔除多余 secret/token/body 等字段；它不是通用脱敏引擎。prefix/name/日期/权限名和宿主提供的 labels 必须是可展示数据，不能把完整值伪装进元数据。nullable 字段必须明确为 null，不能用缺字段或别名猜测。后端鉴权、租户绑定、生成/保存/撤销、幂等、防泄漏和审计仍由后端负责；组件 disabled 不能代替鉴权。

options 声明 permissions、expiryOptions、defaultExpiryId/defaultPermissionIds、canCreate、canRevoke、同步 validateCreate 与 labels。默认可创建；默认仅 active 可撤销，null/unknown 需宿主显式许可，revoked/expired 不再撤销。canCreate=false 隐藏创建入口。默认要求非空名称、已声明且可选权限、有效期选项；业务约束由 validateCreate 返回已明确安全的 name/permissions/expiry 消息，不能绕过基础选择检查。宿主选项固定在 owner 中；身份/权限范围变化时先释放旧 owner，再建新 owner。

默认列表显示名称、前缀、权限、创建/到期/最近使用、状态与撤销操作；未知保持未知。日期为宿主已格式化的展示字符串，组件不隐式改变时区。扩展业务由公共组件组合，React headerActions 可添加独立宿主动作，labels 可本地化；不提供 rows/columns 引擎或完整后端管理平台。

## 一次性结果与明确复制

getState() 只有脱敏元数据、表单选择、阶段与安全反馈，不含完整值、原始 Error 或原始返回体。readSecret() 仅供临时结果视图，只有 phase=result 返回完整值。secret 不放进列表快照、URL、storage、Toast、日志、遥测或其他持久状态；宿主也必须遵守这一约束。

创建成功立即显示“只显示一次”的必要提示，完整值只在只读文本控件中呈现，并聚焦该控件。默认不自动复制、不自动读取或清空剪贴板。用户点击复制后才调用 copySecret(writeText)；React writeClipboard/native factory writeClipboard 可由宿主替换，默认调用所属浏览器 navigator.clipboard.writeText。失败持续提示手动复制；复制等待防止重复点击，关闭后的迟到反馈不再显示。

关闭、Esc、视图卸载/pagehide 或 owner destroy 释放库持有的临时引用并清空该 DOM 值。重新打开创建不会恢复旧值。JavaScript/浏览器/外部 callback 的其他引用无法保证安全擦除，也不保证清空 OS 剪贴板；已经由明确点击发起的异步剪贴板写入不能可靠取消。这里不声称内存擦除或剪贴板撤回。

## 请求、竞态与反馈

refresh 只有读取 callback；新读取取消旧读取，迟到元数据不覆盖新结果；刷新失败保留旧行并显示固定安全错误，可明确重试。创建/撤销在等待期间禁用重复提交及表单修改，取消入口仍可用。各 callback 接收 AbortSignal；关闭取消本地等待，即使 producer 不合作也拒绝该 session 的迟到结果，不重新显示完整值。

关闭不能证明后端未完成写入。等待期间弹层持续显示相应风险；异常显示“结果尚未确认”，没有写操作自动重放或自动重试。重新提交/重新确认是新的明确用户操作，宿主须先核对后端事实并采用所需幂等策略。确认创建后只有有效返回才加脱敏行；确认撤销成功后才更新 revoked，失败或取消不假成功。成功写入会隔离此前在途列表响应。

弹层关闭回到可用原触发器；撤销后原按钮变为不可用，则回到刷新入口。React 由既有 Base UI Dialog 管理焦点和取消，原生由公共 createDialogController 管理 modal/Tab 边界/Esc/回焦点，不叠加竞合 owner。按钮、选择与状态反馈使用统一 motion/reduced-motion；动效不阻挡操作。错误和写入风险在弹层中持续可见，不依赖短暂通知。

## 正式消费与迁移

可运行的 [React](../examples/api-key-react/app.tsx)/[原生](../examples/api-key-vanilla/app.js) 示例共用 [typed 假数据模型](../examples/shared/api-key-model.ts) 与 [同一 labels](../examples/shared/api-key-labels.json)。执行根 pnpm build、pnpm test:consumer、pnpm preview，访问 `/api-key-react/` 或 `/api-key-vanilla/`。模型明确为内存合成后端，权限/日期/完整值都以 demo/FAKE 命名，无真实密钥生成、产品请求或授权能力。测试模式 hold 故意不合作，用于迟到竞态检查。

正式 consumer 从三个本地 tarball 独立安装，检查 ESM/types、无源码 alias、只用公开 CSS；原生不安装 React。采用真实项目时先盘点现有权限、授权、错误/幂等、分页和审计，再用一次 endpoint adapter 映射回调；不得默认旧 data/token/items 别名或擅自构造不存在的 API Key endpoint。后端若使用 Go AjaxResponse/ListData，则显式采用 HTTP/query 合同并在领域 adapter 返回 metadata 数组或 CreatedApiKey。

组件没有 edit/轮换/批量操作/导出/后台自动到期判断。真实服务端合同与鉴权、真实 OS 剪贴板、读屏器、Firefox/Safari/SSR 仍需产品验收。安全与交互检查见 [验证记录](FOUNDATION_VALIDATION.md)，整体接入见 [ADOPTION.md](ADOPTION.md)。
