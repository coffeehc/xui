# 公共新密码控件

baseservice 的 authenticationservice 是新设密码策略唯一维护方。xui 通过 `loadPasswordPolicy(http,{signal})` 从公开、无需登录的 `GET /api/v1/auth/password-policy` 读取 AjaxResponse payload；即使同一HttpClient已绑定auth owner及受保护API前缀，精确GET仍公开可读，省略Cookie、不获取access、不触发refresh；字段为 `version`、`minimum_characters`、`maximum_characters`、`counting_unit: unicode_code_points`。当前服务端范围是6–32，xui不内置范围默认值，加载失败/未知版本拒绝新设提交，宿主展示重试。

`@coffeehc/xui-runtime/password` 提供策略解析、加载、码点计数、校验及错误映射。新密码和确认原样比较，不修剪、不归一化、不截断；中文/emoji各按实际Unicode码点计数，组合附加符号单独计数，孤立UTF-16代理项拒绝。没有强制复杂度或HTML minlength/maxlength门禁；下述强度估算仅作建议；浏览器的长度按UTF-16，不适用于这里。

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


### 本地密码强度建议

两端 NewPasswordFields 默认在输入暂停 150 ms 后本地估算，显示“弱 / 中 / 强”和一条改进建议。使用 MIT 的 @zxcvbn-ts/core 4.2.0、language-common 4.1.3、language-en 4.1.1，识别常见密码、顺序、重复、键盘及常见个人信息模式，不按字符种类自行打分。固定映射：评分 0–1 为弱，2 为中，3–4 为强。强度仅供参考，任何分数都不参与 readValidatedPassword 的提交许可；强制规则仍只来自服务端 policy。

引擎和 common/en 字典通过动态 import 首次输入时懒加载。正式独立 tarball 消费者的引擎压缩大小为原生 837,476 B、React 837,496 B；本次孤立示例初始静态 JS 图 gzip 分别为 2,979 B、71,587 B，均不含引擎和字典。这是构建产物测量，不是浏览器运行时延迟保证。入口静态依赖图与原有全库体积门禁继续检查。

首次离线或加载失败显示“暂时无法评估密码强度，不影响提交。”，不会假称强。字典以常见模式和英文为主，对其他语言、人名、产品上下文及新泄露密码的识别有限；“强”不保证安全。估算为限制同步 CPU 工作只处理最多 256 个 UTF-16 单元，超出显示无法评估，不截断密码，也不改变服务端策略校验。复杂 Unicode 的强制长度仍按上面的码点规则。

公开 runtime/password 提供 createPasswordStrengthController({readPassword,onChange})、PasswordStrengthState 和 getPasswordStrengthMessage。控制器 refresh/clear/destroy 只回传状态、评分、等级和提示分类，不返回密码、匹配词或猜测轨迹。常规页面直接复用 NewPasswordFields，无需另建评分 owner。NewPasswordLabels.strength 是可选的中文提示映射覆盖，旧 labels 对象兼容。

输入不上传、不进入 URL、日志或 storage，不使用远程泄露查询或网络 matcher。读取输入发生在引擎加载完成后，异步等待不保存密码快照；每次输入、clear 和卸载使旧 generation 失效，迟到加载不能覆盖当前提示。pagehide/clear/destroy 同步清除输入和显示状态。评分不用于旧账号登录密码限制。

实现依据：[zxcvbn-ts 指南](https://zxcvbn-ts.github.io/zxcvbn/guide/)、[懒加载](https://zxcvbn-ts.github.io/zxcvbn/guide/lazy-loading/)、[4.x Factory](https://zxcvbn-ts.github.io/zxcvbn/guide/migration/)。新回归覆盖常见/重复/顺序模式、有效弱密码允许提交、懒加载隔离、离线和迟到结果；真实浏览器验收见对应提交 CI，不能以本机启动被阻断代替通过。
