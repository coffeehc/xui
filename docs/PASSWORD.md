# 公共密码输入与固定校验

普通 `PasswordInput` 基于公开 InputGroup（Input、前后缀和显隐按钮）；`PasswordStrengthInput` 在同一个普通密码输入 owner 下仅增加一条连续强度条。React 与原生提供相同能力，不请求密码策略 API，不允许项目替换长度或评分规则。

新设密码固定为 **6–32 个 Unicode 码点**，不修剪、归一化或截断；拒绝孤立 UTF-16 代理项。中文、emoji 和组合符号按实际码点计数，不使用浏览器 UTF-16 minlength/maxlength 代替。强度低或估算器不可用都不增加提交门禁，服务端继续独立执行相同规则。

## 单框与组合

| 用途 | React | 原生 |
| --- | --- | --- |
| 普通密码输入 | `PasswordInput`，`@coffeehc/xui-react/text-inputs` | `createPasswordInput(host, options)`，`@coffeehc/xui-runtime/text-inputs-dom` |
| 带本地强度的输入 | `PasswordStrengthInput`，`@coffeehc/xui-react/password` | `createPasswordStrengthInput(host, options)`，`@coffeehc/xui-runtime/password-dom` |
| 新密码与确认组合 | `NewPasswordFields`，`@coffeehc/xui-react/password` | `createNewPasswordFields(options?)`，`@coffeehc/xui-runtime/password-dom` |

普通与强度输入支持 prefix/suffix；显隐使用 eye/eye-off 描边图标，showLabel/hideLabel 继续提供可访问名称与 aria-pressed；切换保留 input 节点和选区，disabled/readOnly、form 关联、键盘和字段描述沿用基础输入合同。React 可显式受控（value/onValueChange），或不传 value 使用 DOM 非受控模式。ref 指向 input，controlRef 的 clear() 负责命令式清空；原生也提供 clear/update/destroy。新密码组合默认使用非受控输入，秘密留在 DOM/ref，不进入公开状态。

```tsx
const fields = React.useRef<NewPasswordFieldsHandle>(null);
<NewPasswordFields ref={fields} disabled={submitting} />
// 放在宿主表单中，仅在明确提交时读取：
const password = fields.current?.readValidatedPassword();
if (password == null) return;
try { await initializeBusiness({password}); }
finally { fields.current?.clear(); }
```

初始不显示规则、计数或错误；`readValidatedPassword` 才校验并聚焦出错字段，以既有非模态 Tooltip 在字段旁显示“至少6个字符”“最多32个字符”“密码含无效字符”或“两次密码不一致”。浮层不占表单正常布局高度、不抢焦点，Esc/blur 收起，仍无效的字段再次获得焦点时重开，输入后清错。input 的 aria-invalid 与稳定的描述节点保持关联，收起视觉 tips 后仍可读取错误；其他 Field 继续保留既有 inline error 合同。只在有效且可提交时返回原始密码。原生 `createNewPasswordFields({disabled,labels,document})` 返回 element、setDisabled、readValidatedPassword、clear、destroy；没有 policy/setPolicy。labels 只翻译文案，不改变固定校验。

runtime/password 公开 `passwordMinimumCharacters`、`passwordMaximumCharacters`、`countPasswordCodePoints`、`validatePassword(password)`、`validateNewPassword(password,confirmation)` 和 `getNewPasswordErrorMessage(error,labels?,count?)`。旧 PasswordPolicy/parsePasswordPolicy/loadPasswordPolicy 与 GET password-policy 接口已移除，不保留配置兼容壳。

pagehide、clear、reset 与卸载/destroy 清空所属非受控输入及派生反馈，丢弃迟到评分；受控输入的值由宿主确认。组件不发起账号变更、登录或密码保存。宿主提交回调应在 finally 丢弃自己的密码引用，不写 URL、日志或 storage。旧账号登录不套用新设密码校验；认证始终由服务端负责。

### 本地密码强度建议

两端 PasswordStrengthInput 与 NewPasswordFields 默认在输入暂停 150 ms 后本地估算。输入下方仅有一条 4px 连续 meter，以实际评分 0–4 映射五档 20/40/60/80/100% 长度；弱、中、强分别映射现有 error、warning、success 语义颜色。idle/loading/unavailable 保留空轨道，不画假分；无可见等待文案、规则段、字符计数或改进建议。meter 的 min=0/max=5，ready 时 now=score+1，aria-valuetext 与 sr-only live status 提供实际强弱或未就绪状态。使用 MIT 的 @zxcvbn-ts/core 4.2.0、language-common 4.1.3、language-en 4.1.1，识别常见密码、顺序、重复、键盘及常见个人信息模式，不按字符种类自行打分。固定映射：评分 0–1 为弱，2 为中，3–4 为强。强度仅供参考，任何分数都不参与 readValidatedPassword 的提交许可；强制规则固定为 6–32 个 Unicode 码点。

引擎和 common/en 字典在包构建时编成自包含固定 worker 源码，以动态 import 首次输入时懒加载。库在本地 Blob worker 中执行，ready 后才读取最新输入并通过本地 postMessage 发送；主线程不解析字典或执行评分，评分实例只存在于单次 worker 调用中。宿主无需 worker 打包插件；正常 ESM 动态导入拆包保留懒加载，显式关闭代码拆分的 bundler 会把模块合并进初始脚本。正式独立 tarball 消费者的引擎压缩大小为原生 约 838 KB、React 约 838 KB；孤立示例初始静态 JS 图 gzip 约为 4 KB、72 KB（每次精确值写入 strength-bundle.json），均不含引擎和字典。这是构建产物测量，不是浏览器运行时延迟保证。入口静态依赖图与原有全库体积门禁继续检查。

首次离线、Worker 不可用、打包产物不可加载或宿主 CSP 禁止 blob worker 时，保留空轨道，可访问状态为“暂不可评估”，不影响提交。库不修改、不要求放宽 worker-src/CSP，不会假称强。字典以常见模式和英文为主，对其他语言、人名、产品上下文及新泄露密码的识别有限；“强”不保证安全。估算为限制同步 CPU 工作只处理最多 256 个 UTF-16 单元，超出显示无法评估，不截断密码，也不改变服务端策略校验。复杂 Unicode 的强制长度仍按上面的码点规则。

公开 runtime/password 提供 createPasswordStrengthController({readPassword,onChange})、PasswordStrengthState 和 getPasswordStrengthSummary。控制器 refresh/clear/destroy 只回传状态、评分、等级和提示分类，不返回密码、匹配词或猜测轨迹。单框直接使用 PasswordStrengthInput，密码确认组合使用 NewPasswordFields，无需另建评分 owner。NewPasswordLabels.strengthLabel 翻译 meter 名称，strengthSummary 翻译可访问状态；labels 不改变评分与校验。

输入不上传、不进入 URL、日志或 storage，不使用远程泄露查询或网络 matcher。读取输入发生在引擎加载完成后，异步等待不保存密码快照；每次输入、clear 和卸载使旧 generation 失效，迟到加载或评分不能覆盖当前提示；卸载通过 AbortSignal 立即终止正在加载或工作的 worker。pagehide/clear/destroy 同步清除输入和显示状态。评分不用于旧账号登录密码限制。字典可缓存，但每次估算使用独立 Factory，避免其内部 scoring 缓存长期引用最近密码；JavaScript 字符串无法承诺物理内存清零。

实现依据：[zxcvbn-ts 指南](https://zxcvbn-ts.github.io/zxcvbn/guide/)、[懒加载](https://zxcvbn-ts.github.io/zxcvbn/guide/lazy-loading/)、[4.x Factory](https://zxcvbn-ts.github.io/zxcvbn/guide/migration/)。新回归覆盖常见/重复/顺序模式、有效弱密码允许提交、懒加载隔离、离线和迟到结果；真实浏览器验收见对应提交 CI，不能以本机启动被阻断代替通过。

实际浏览器优化前记录：CI38408040199 合成输入的主线程长任务 React 124/56ms、原生127/99ms；这不是优化后的性能结果。worker 版本继续保存输入事件数、LongTask 和计时器延迟，须按新提交真实浏览器证据验收。

已移除无用的 count、strength、strengthAdvice 文案入口与 getPasswordStrengthMessage；没有第二份建议/计数布局或 Disclosure owner。清空保留空轨道，丢弃上次评分；短错误文案的 length/tooShort/tooLong/invalidUnicode/confirmationMismatch 入口继续可翻译。

57c4afe 的安全 Chrome CI38413454627 实测：同一合成 12 次输入下，Worker 版本 React 最大计时器延迟 29.4ms、原生 34.5ms，均没有观察到 LongTask；对应优化前为149.7/151.8ms及上述长任务。这是一次 CI 样本，不能保证所有设备、首次加载网络或宿主打包方式都具有相同延迟。该提交完整1064浏览器用例通过，强度低分、离线、CSP禁Worker均不增加提交门禁。
