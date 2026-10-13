# 公共新密码控件

baseservice 的 authenticationservice 是新设密码策略唯一维护方。xui 通过 `loadPasswordPolicy(http,{signal})` 从公开、无需登录的 `GET /api/v1/auth/password-policy` 读取 AjaxResponse payload；即使同一HttpClient已绑定auth owner及受保护API前缀，精确GET仍公开可读，省略Cookie、不获取access、不触发refresh；字段为 `version`、`minimum_characters`、`maximum_characters`、`counting_unit: unicode_code_points`。当前服务端范围是6–32，xui不内置范围默认值，加载失败/未知版本拒绝新设提交，宿主展示重试。

`@coffeehc/xui-runtime/password` 提供策略解析、加载、码点计数、校验及错误映射。新密码和确认原样比较，不修剪、不归一化、不截断；中文/emoji各按实际Unicode码点计数，组合附加符号单独计数，孤立UTF-16代理项拒绝。没有复杂度、强度评分或HTML minlength/maxlength门禁；浏览器的长度按UTF-16，不适用于这里。

React公开 `@coffeehc/xui-react/password`：

```tsx
const fields = React.useRef<NewPasswordFieldsHandle>(null);
// policy由同一个HttpClient通过loadPasswordPolicy加载；等待/失败时传null。
<NewPasswordFields policy={policy} ref={fields} disabled={submitting} />
// 放在宿主表单中；提交时：
const password = fields.current?.readValidatedPassword();
if (password == null) return;
try { await initializeBusiness({password}); }
finally { fields.current?.clear(); }
```

`readValidatedPassword` 展示公共校验错误、聚焦出错字段，仅成功时返回原始密码；禁用期间返回null。组件内部维护两个输入，产品不复制确认密码、计数或范围常量。`labels` 可覆盖字段及错误文本、动态长度说明函数。外层AuthPage/表单及业务初始化状态、业务失败/重试、成功导航由产品处理；组件不发起账号变更、登录或保存密码。

原生公开 `@coffeehc/xui-runtime/password-dom`：`createNewPasswordFields({policy,disabled,labels,document})` 返回 `element`、`setPolicy`、`setDisabled`、`readValidatedPassword`、`clear`、`destroy`。把element放进宿主表单，按同样的提交步骤调用。两种实现复用同一策略/校验/错误；现有Field/Input样式、标签与aria关联，不引入产品私有皮肤。pagehide及卸载/destroy清空字段；宿主异步回调仍须在finally丢弃密码，不写URL、日志、storage或持久React全局状态。

旧账号登录仍使用既有ConfigurableLoginPage/createLoginPage，不调用validateNewPassword。服务端独立实施新设规则及版本化bcrypt处理，客户端检查不能代替服务端认证。

验证：公共策略边界、中文/英文/emoji、组合码点、不归一化、确认错误、孤立代理项、未知策略及真实loader参数；SSR检查字段/aria公共结构与无UTF16长度门禁。React/原生交互回归在tests/browser/password-fields.spec.mjs；本次系统Chromium被环境socket限制阻止启动（普通及escalated均Operation not permitted），因此该2项浏览器用例未执行。build、typecheck和5项密码单元/SSR测试及31项认证/AuthPage回归已通过；不宣称真实后端账号已验证。

### 面向使用者的规则与当前计数

默认提示为“密码长度为 {minimum}–{maximum} 个字符，可使用大小写字母、数字及 _、+、# 等符号。”范围始终来自服务端 policy。React/原生新密码字段只保存当前字符数用于展示，密码本身仍仅保留在输入框；清空/pagehide 同时将计数归零。复杂 emoji 和组合字符仍按前述技术计数规则计数，不能承诺视觉上一个图案就是一个字符。此能力不用于现有账号的登录密码限制。

`NewPasswordLabels` 新增可选 count/tooShort/tooLong 文案函数；原完整 labels 对象保持兼容。`getNewPasswordErrorMessage` 可传第五参数当前字符数，以显示明确“太短/太长”信息；未提供时仍返回范围规则。无效字符提示为“密码包含无法识别的字符，请重新输入。”计数和提示不引入复杂度、归一化、截断或任何密码持久化。
