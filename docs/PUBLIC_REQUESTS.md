# 公共能力维护清单

本页登记消费项目提交的公共能力缺口及核对结果，不定义另一份接口合同。已提供的能力以 [PUBLIC_API](PUBLIC_API.md)、[COMPONENTS](COMPONENTS.md) 和固定产物为准；待实现条目的建议字段不是现有 API。请求登记不代表已排期、实现或通过消费项目验收。

## Argus 固定版接入反馈（2026-10-16）

来源记录：Argus `d3cc589fd803e20d0640321437ed280a2a4036dc` 的 `docs/xui-public-requests.md`。其消费基线为 xui `595380a6d2467d56623a0df0dedc026e0331a4ff`、DESIGN `0.13.1`、三个包 `0.1.0`。来源中的产品调用点和现场现象按反馈登记，本轮没有读取或修改 Argus，也没有重跑其页面。

核对版本：xui main `b700606624ae1453ce2796afdad2882dd938d9ee`，DESIGN 与三个包均为 `1.1.0`。本轮仅核对源码、正式声明和既有验证记录，不修改公共实现。

| ID | 请求 | xui 状态 | 消费项目后续 |
|---|---|---|---|
| XUI-REQ-20261016-01 | 完整登录/初始化页密码显隐名称本地化 | 已由既有公开能力解决 | 按固定产物配置并复验，不能把旧基线缺口继续记为当前 xui 阻塞 |
| XUI-REQ-20261016-02 | StructuredLogExplorer 不提供跨组全量 records 的模式 | 待实现，当前仍要求四操作 | 保留真实分组流程，不能伪造 records adapter 或分页；本次未要求更改业务 API |

### XUI-REQ-20261016-01：完整认证页显隐文案（已解决）

Argus 调用点：`frontend/src/workspace/identity-boundary.tsx`、`frontend/src/features/identity/setup-page.tsx`。反馈是在中文完整认证页中，独立 PasswordInput 可本地化，但页内按钮仍显示英文。

该能力已经由 [57f4e8c](https://github.com/coffeehc/xui/commit/57f4e8c0f8c7c640b4f8b1faa1fbf7438581d27f) 提供，当前 `1.1.0` 保留：

- `ConfigurableLoginPage` 使用 `config.labels.showPassword` / `hidePassword`。
- `AdminSetupPage` 使用 `passwordLabels.showPassword` / `hidePassword`，新密码及确认两个输入均转交相同文案。
- 两组字段均可选，省略时保留英文默认；无需宿主接管完整页字段或穿透按钮 DOM。

例如配置值分别为 `showPassword: '显示密码'`、`hidePassword: '隐藏密码'`。真实声明见 [LoginPageLabels](../packages/runtime/src/auth.ts)、[NewPasswordLabels](../packages/runtime/src/password.ts)；接线见 [登录页](../packages/ui-react/src/login.tsx)、[初始化页](../packages/ui-react/src/admin-setup.tsx) 与 [新密码组合](../packages/ui-react/src/password.tsx)。公开使用合同见 [完整认证页文案](COMPONENTS.md#完整登录页密码显隐文案与品牌替代文本)，既有执行结果见 [验证记录](VALIDATION.md)。

消费项目升级后仍需复验鼠标、Enter/Space、按钮焦点、状态对应的 accessible name、密码值和清理行为。本次没有将历史库级验证写成 Argus 当前页面已通过，也不自动升级其依赖或认证协议。`0.1.0` 曾对应多个固定源码版本，不能只比较包版本字符串判断能力。

### XUI-REQ-20261016-02：分组模式不依赖全量 records（待实现）

Argus 调用点：`frontend/src/features/error-observation/page.tsx`、`frontend/src/domain/read-api.ts`。反馈的真实读取能力为组列表、指定组记录、指定记录详情及投递列表，路径分别是 `GET /api/ops/error-logs/groups`、`/groups/:id`、`/records/:id`、`/deliveries`；没有跨组全量记录查询。投递列表、组内记录和单条详情都不能冒充全量 records。

当前缺口已经从 xui 源码确认：[StructuredLogAdapter](../packages/runtime/src/structured-log.ts) 的 `records` 必填，controller 的全量视图直接调用它；[StructuredLogExplorer](../packages/ui-react/src/structured-log.tsx) 仍提供 records 模式和“全部观察”入口。当前没有可公开配置的分组专用模式，不能只省略字段后声称已支持。

期望合同与验收要求（尚未实现）：

1. 支持不提供全量 records 能力；公开 React 入口、runtime 类型、controller 与 HTTP adapter 的能力声明一致，不增加原生 UI 副本。
2. 未提供时不呈现不可履行的全量模式或“全部观察”入口，也不发起全量请求；公开 controller 不能进入随后调用缺失方法的状态，具体类型与安全处理由实现合同明确。
3. 组列表、指定组记录与详情保持可用；提供 records 时保留现有全量模式和默认行为。
4. 筛选、范围切换、游标/快照、上一页/下一页、取消、迟到响应、读取错误及详情关闭继续采用既有 owner，不制造游标、总数或 as_of。
5. 以独立正式 ESM/CSS/types 消费者验证有/无 records 两种组合，覆盖键盘、入口可见性、请求次数、取消与错误恢复，并区分库级结果和产品验收。

现有替代是保留 Argus 已使用的公共 DataTable、Field、Disclosure 与反馈组件，呈现真实的“分组 → 组内记录 → 详情”流程；不要求消费项目复制 Explorer 或自行增强公共组件。

接口适配边界仍遵守 [程序错误观察合同](PUBLIC_API.md#程序错误观察)：当前默认 HTTP adapter 是宿主提供路径的四个 POST 查询 facade，并不等同于上述 Argus GET 领域接口。将来支持省略 records 也不自动证明其余 DTO、筛选、分页和权限合同已匹配，不能据此新增前端兼容层或未经授权改动后端。本项本次只登记，尚无实现、正式产物或新增浏览器验收。
