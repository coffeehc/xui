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

默认提示为“密码长度为 {minimum}–{maximum} 个字符，可使用大小写字母、数字及 _、+、# 等符号。”范围始终来自服务端 policy。React/原生新密码字段只保存当前字符数用于展示，密码不进入持久状态，仅在输入框和本地校验/评分调用中短暂使用；清空/pagehide 同时将计数归零。复杂 emoji 和组合字符仍按前述技术计数规则计数，不能承诺视觉上一个图案就是一个字符。此能力不用于现有账号的登录密码限制。

`NewPasswordLabels` 新增可选 count/tooShort/tooLong 文案函数；原完整 labels 对象保持兼容。`getNewPasswordErrorMessage` 可传第五参数当前字符数，以显示明确“太短/太长”信息；未提供时仍返回范围规则。无效字符提示为“密码包含无法识别的字符，请重新输入。”计数和提示不引入复杂度、归一化、截断或任何密码持久化。


### 本地密码强度建议

两端 NewPasswordFields 默认在输入暂停 150 ms 后本地估算。长度规则独立显示；固定短摘要显示等待输入、评估中、弱/中/强或暂不可评估。改进建议复用公开 Disclosure，默认折叠，只由用户主动展开；评分、清空及提交不会自动展开或删除摘要行。短状态按固有内容共同预留高度，已展开建议也保留稳定区域，不把长建议默认占成大块空白。使用 MIT 的 @zxcvbn-ts/core 4.2.0、language-common 4.1.3、language-en 4.1.1，识别常见密码、顺序、重复、键盘及常见个人信息模式，不按字符种类自行打分。固定映射：评分 0–1 为弱，2 为中，3–4 为强。强度仅供参考，任何分数都不参与 readValidatedPassword 的提交许可；强制规则仍只来自服务端 policy。

引擎和 common/en 字典在包构建时编成自包含固定 worker 源码，以动态 import 首次输入时懒加载。库在本地 Blob worker 中执行，ready 后才读取最新输入并通过本地 postMessage 发送；主线程不解析字典或执行评分，评分实例只存在于单次 worker 调用中。宿主无需 worker 打包插件；正常 ESM 动态导入拆包保留懒加载，显式关闭代码拆分的 bundler 会把模块合并进初始脚本。正式独立 tarball 消费者的引擎压缩大小为原生 约 838 KB、React 约 838 KB；孤立示例初始静态 JS 图 gzip 约为 4 KB、72 KB（每次精确值写入 strength-bundle.json），均不含引擎和字典。这是构建产物测量，不是浏览器运行时延迟保证。入口静态依赖图与原有全库体积门禁继续检查。

首次离线、Worker 不可用、打包产物不可加载或宿主 CSP 禁止 blob worker 时，摘要显示“暂不可评估”，建议中说明不影响提交。库不修改、不要求放宽 worker-src/CSP，不会假称强。字典以常见模式和英文为主，对其他语言、人名、产品上下文及新泄露密码的识别有限；“强”不保证安全。估算为限制同步 CPU 工作只处理最多 256 个 UTF-16 单元，超出显示无法评估，不截断密码，也不改变服务端策略校验。复杂 Unicode 的强制长度仍按上面的码点规则。

公开 runtime/password 提供 createPasswordStrengthController({readPassword,onChange})、PasswordStrengthState 和 getPasswordStrengthMessage。控制器 refresh/clear/destroy 只回传状态、评分、等级和提示分类，不返回密码、匹配词或猜测轨迹。常规页面直接复用 NewPasswordFields，无需另建评分 owner。NewPasswordLabels.strength 是可选的中文提示映射覆盖，旧 labels 对象兼容。

输入不上传、不进入 URL、日志或 storage，不使用远程泄露查询或网络 matcher。读取输入发生在引擎加载完成后，异步等待不保存密码快照；每次输入、clear 和卸载使旧 generation 失效，迟到加载或评分不能覆盖当前提示；卸载通过 AbortSignal 立即终止正在加载或工作的 worker。pagehide/clear/destroy 同步清除输入和显示状态。评分不用于旧账号登录密码限制。字典可缓存，但每次估算使用独立 Factory，避免其内部 scoring 缓存长期引用最近密码；JavaScript 字符串无法承诺物理内存清零。

实现依据：[zxcvbn-ts 指南](https://zxcvbn-ts.github.io/zxcvbn/guide/)、[懒加载](https://zxcvbn-ts.github.io/zxcvbn/guide/lazy-loading/)、[4.x Factory](https://zxcvbn-ts.github.io/zxcvbn/guide/migration/)。新回归覆盖常见/重复/顺序模式、有效弱密码允许提交、懒加载隔离、离线和迟到结果；真实浏览器验收见对应提交 CI，不能以本机启动被阻断代替通过。

实际浏览器优化前记录：CI38408040199 合成输入的主线程长任务 React 124/56ms、原生127/99ms；这不是优化后的性能结果。worker 版本继续保存输入事件数、LongTask 和计时器延迟，须按新提交真实浏览器证据验收。

NewPasswordLabels 可选 strengthSummary 映射短状态，strengthAdvice 定义 Disclosure 标题，原 strength 函数继续映射展开建议。清空保留短行与折叠入口，不保留上次评分；参考文字参与自然布局但 aria-hidden，读屏只读取当前状态。

57c4afe 的安全 Chrome CI38413454627 实测：同一合成 12 次输入下，Worker 版本 React 最大计时器延迟 29.4ms、原生 34.5ms，均没有观察到 LongTask；对应优化前为149.7/151.8ms及上述长任务。这是一次 CI 样本，不能保证所有设备、首次加载网络或宿主打包方式都具有相同延迟。该提交完整1064浏览器用例通过，强度低分、离线、CSP禁Worker均不增加提交门禁。
