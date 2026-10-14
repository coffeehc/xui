# 公共登录页视觉验收

本页是 [DESIGN](DESIGN.md#公共登录页布局与主题) 的实施与验收记录，不建立第二套主题规范。适用 `AuthPage` / `createAuthPage` 与内部复用它们的 `ConfigurableLoginPage` / `createLoginPage` 正式产物；不代表任何产品页面已升级。

## 2026-10-14 当前候选验收记录

本轮 package source generation 为 `f56796bb2c862c8afa285a1713d1c8a476422b6040c8b1bde52bd05eb70051eb`，example generation 为 `4dc78683af33237bdf7a87e8f7e23748ec4da8a960d16c491ad2b0b335600cf7`。默认根字号16px下，认证壳使用434px居中单框、376px字段/动作；品牌13/20、标题20/28、label13/20、输入与主动作14/22且主动作至少44px。空状态不留support占位；密码区不显示规则段、字符计数、建议或等待文案，只显示一条强度meter，等待状态文案为屏幕阅读器内容。强度为非门禁提示，实际密码规则固定为6–32 Unicode码点并要求有效Unicode。

最终截图用例8/8通过，PNG与逐图JSON稳定副本位于 [`.artifacts/precision-theme-evidence/screenshots/`](../.artifacts/precision-theme-evidence/screenshots/)。包含React/原生 AdminSetup light/dark 桌面图，以及390px、root字号200%下确认密码与主动作的四边焦点图。确认密码focus bounds外缘为66/324/627/721px，submit为66/324/687/799px，视口390×800；字段、动作仍可达。

认证相关浏览器证据按运行分别记录：full browser首轮1347/1355，8个失败中包含一个bearer时间预算超时、一个真实200%视觉用例在所有页面断言结束后关闭persistent context超时；二者在同一候选隔离重跑时 bearer 1/1 与真实Page zoom矩阵12/12通过。初次超时的确定根因未证实，不据此宣称源码已修复。其余两端touch fixture与四个旧InputGroup locator失败已分别由fixture窗口边界调整、按textbox所属组定位后通过；细节见[基础门禁本候选矩阵](FOUNDATION_DESIGN_GATES.md#2026-10-14-当前候选验证矩阵有限合同不代表-g0g4-全量闭环)。浏览器只验证了Chromium；真实后端、OS输入法、读屏器、密码管理器及Firefox/WebKit未测。

本页下方的验收ID表继续定义目标；表内原“未测/待验证”文字是2026-10-13历史计划快照，不代表上面的当前候选结果。当前证据只关闭本段所列范围，不合并成一次1355项全绿，也不代表L01–L14全部合同已经闭环。

## 实施前确定的目标与样本

- 核心任务：识别当前产品，输入账户和密码，完成一次明确的登录。
- 首屏关键内容：组合后的品牌身份、登录标题、字段、一个主登录按钮；必要状态在按钮后的局部区域。
- 参考公开页面与规范（2026-10-13）：[Carbon Forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms) 的标题层级、单主动作和局部错误；[GitHub 登录](https://github.com/login) 与 [Vercel 登录](https://vercel.com/login) 的任务导向结构。只参考层级与交互，不复制品牌素材、认证机制或第三方尺寸。
- 正式浏览器样本：React / 原生 × light / dark / system × 1280×800 / 390×800；另验 1600×900、390×320、根字号 200%、字体 token 放大、长错误、可选品牌图、扩展字段和 SSO。真实浏览器 zoom 与根字号放大分别报告。

## 固定验收标准与历史状态快照

默认值以下以 16px 根字号为准，允许 1px 排版误差；字体偏好改变时按 token 比例验收。

| ID | 预期 | 验收方法 / 证据 | 2026-10-13历史状态（当前结果见上文） |
| --- | --- | --- | --- |
| L01 | 默认 card 居中单列窄框，最大434px、自然高度；1280/1600/390均无左右品牌面板或分割线。显式 fullscreen 同列仅省略外框皮肤 | 双端、两模式真实截图 + card/brand/form rect | 未测 |
| L02 | 紧凑身份行在框内顶部，先于任务标题，说明紧跟标题；logo 32px、品牌名13/20px、500字重与muted角色。可选装饰图 inert、最大80px高、窄屏隐藏 | 默认无图与可选图 desktop 截图 + DOM 顺序、rect、computed type | 未测 |
| L03 | 表单内容最大384px（含四边焦点余量），标题20/28px、label13/20px、输入/主动作14/22px，输入和主按钮至少44px；标题明确大于字段 | screenshot + JSON type/rect | 未测 |
| L04 | label→input 8px、字段之间16px、密码→登录16px；无反馈框或隐藏辅助按钮插在密码和登录之间 | idle/error/busy screenshot + gap JSON | 未测 |
| L05 | 匿名普通页只有一个可见主登录按钮，宽度与字段一致；错误401不显示会话检查；SSO是独立次级组 | 公共 API 页面操作 + screenshots | 未测 |
| L06 | 空反馈与反馈动作不渲染或隐藏且不占位；有消息时在主按钮之后按内容自然增高并保持全文可读，不设固定/最小轨道或局部裁切；必要后果不折叠；重试只在真实可恢复的读取失败时出现 | idle/busy/error/长错误截图，消息可读性与动作rect | 待本轮验证 |
| L07 | 短状态与错误不重挂/清空字段、主动作或核心布局节点；字段与主动作尺寸、横向对齐及层级顺序保持。反馈按内容自然增长，居中卡片可随之调整位置，长文经文档自然滚动完整访问 | 连续状态 DOM identity/rect + screenshot；error-layout 回归 | 待本轮验证 |
| L08 | 登录直接一次 POST，无恢复预请求；busy 禁重入且无取消。超时后原有 refresh/session 核验一次，未确认结束 busy 可手动再试，不重放写请求；密码及时清空 | auth unit + auth-bearer/login browser HTTP counts | 待本轮验证 |
| L09 | 1280/1600/390普通首屏主操作完整可见，无页面横向溢出；200%与短视口自然文档滚动到每个字段/动作。极端长主按钮独立限高并内部滚动，完整按钮与四边焦点仍可滚入视口，字段及操作组不困在局部小区域 | screenshot + viewport/scroll metrics；长品牌/长标签的按钮rect、内部滚动与键盘提交 | 未测 |
| L10 | Tab顺序字段→主动作→SSO→实际局部辅助动作；不存在隐藏Tab停靠；输入、主按钮、反馈、SSO四边focus真实像素可见 | 实际键盘路径 + four-side pixel screenshot | 未测 |
| L11 | light/dark/system复用一个根主题owner，系统变化不清输入；reduced-motion仍立即反馈 | existing theme/motion browser tests +截图 | 未测 |
| L13 | 三字段setup复用同一定位owner，表单不贴顶、标题/字段/主动作尺度同登录；动态更新保留表单/输入DOM、值、事件和焦点；零自动认证请求 | setup三主题×双端×1280/390实际截图与JSON；update/submit请求计数 | 未测 |
| L14 | 未知身份经既有owner检查；匿名原位表单；已确认session或login成功直接一次进入宿主目标，无身份/Continue/Logout确认卡。导航同步/Promise失败只局部重试打开目标，不重POST/refresh/logout；开发态StrictMode/重复通知/同id新user对象不重复导航；pagehide/unmount迟到结果失效，persisted恢复不锁死且不补认证请求 | login-navigation真实DOM mutation/rAF序列、identity/rect、HTTP/回调计数、目标内容截图；默认同URL防循环 | 未测 |
| L12 | 双端只消费正式 exports/CSS/types；build/token/type/unit/watch/consumer/cold-start/browser全部最终版本通过 | 根 pnpm verify 与准确commit CI | 未测 |

## 证据规则与当前限制

新增测试应把成功截图写入 `testInfo.outputPath` 并附加 JSON 实测数据；CI 的 test-results 产物提供原始证据。截图必须实际浏览器渲染，再由人或图像查看工具检查品牌构图、比例与裁切。DOM、computed style、测试收集、构建成功不能代替视觉检查。

本次单列布局已完成本机 targeted 验收；完整标准的覆盖范围、证据和未执行项见下方本版本记录。真实产品、真实后端、其他浏览器和移动 OS 未覆盖时继续明确标记未测。

## 前次双区版本的源码树预检（历史，非本次验收）

以下记录对应改版前的双分区版本，不能证明当前单列布局通过。2026-10-13，源码 generation `c8ffa0157d019e52c5c593b5a712afa9efe5aa6a4bcf19a93973ac5bfbe9edc5`：

- 正式包 build、完整开发示例构建、355-token 合同、typecheck、361/361 unit 通过。
- React/原生独立 tarball 的全部公开入口、类型、peer、体积门禁通过；含纯 AuthPage setup 与开发态 StrictMode 登录消费者。
- 本地 watch 两次在首轮30秒等待超时，未通过。直接运行同路径 dev-build 成功耗时40.447秒；这说明本地运行超过等待期限，不代表已排除构建缺陷。保留原门禁，待 CI 原样执行。
- `auth-page.spec.mjs`、`login-navigation.spec.mjs`、`login-visual.spec.mjs`收集65项，目标包含36张登录 idle/error/busy、12张setup主矩阵及额外焦点/导航图。仅收集，未在受限执行器启动浏览器，不证明像素、几何或视觉通过。
- 当时云执行器 Chromium 启动受到 EPERM 限制；cold-start 同样需要 Chromium，尚未运行。persisted pagehide/pageshow测试是浏览器生命周期事件模拟，不能当作真实 BFCache 命中验收。

上方表格记录完整验收标准；本 generation 的 targeted 检查与未覆盖范围见下方记录。真实浏览器zoom、真实BFCache命中、其他浏览器/OS和产品实接仍未测。

## 本次单列版本 targeted 验收记录（2026-10-13）

本段记录最终 source generation `c856d2e661fb`。上方验收表是完整标准；本轮通过的目标子集、未执行范围和证据以本段为准，不代表完整 `pnpm verify`、CI 或其他浏览器已通过。

- 最终源码 `node scripts/dev-build.mjs`（含typecheck）通过，generation `c856d2e661fb`；`pnpm check:tokens` 为350 tokens、215个设计文件通过；最终源码后的 `pnpm test:unit` 为360/360通过。
- `pnpm build` 在 package generation `2682b758ae24` 通过。其后只增加React/native提交按钮标签改变时的滚动归位逻辑；最终 `c856d2e661fb` 由 `dev-build` 构建并用于下方浏览器测试。`pnpm test:consumer` 对 `2682b758ae24` 包生成的React和原生tarball通过（公开exports/types、布局入口、Button-only贡献与gzip门禁）；未将其标成最终 `c856d2e661fb` 的独立消费者测试。
- `pnpm exec playwright test tests/browser/login-layout.spec.mjs tests/browser/login-visual.spec.mjs tests/browser/login.spec.mjs tests/browser/login-extensions.spec.mjs tests/browser/auth-page.spec.mjs --workers=2` 为151/151通过：五个文件原有149项，加上长主按钮React/native各一项。默认 card 与显式 fullscreen 都是居中窄单列；React/native在 light/dark/system 下覆盖1280、1600和390宽度；checking、idle、busy、错误、长错误、SSO、扩展字段、局部安全读取重试及setup均通过。200%根字号、390×320短视口、文档自然滚动和四边焦点像素也在此批覆盖。
- 长主按钮专项检查了390×720、200%根字号与超长品牌/按钮名：按钮最高144px、按钮本身可滚动且完整 accessible name 保留；滚至长标签末端后，普通认证通知不重置滚动，提交到busy会归位，使短busy标签完全落在可视控制区；长按钮四边焦点像素通过。此前观察到的超高按钮和busy短标签被推离可视区问题已由本generation的单按钮限高与状态滚动归位修复。
- `pnpm exec playwright test tests/browser/error-layout.spec.mjs --grep login --workers=2` 为4/4通过（React/native × 1280/390）。最终源码后的360项 unit 验证了现有认证行为；本轮没有修改认证时序。
- 截图与几何JSON保存在 `test-results/login-final-evidence/`。默认样本包括React light 1280、native dark 390；setup包括React/native的light 1280与dark 390；长主按钮两端的四边焦点图也保留。父级检查了React浅色桌面、深色窄屏和长主按钮焦点图；独立review检查了setup图及默认双端布局样本。
- 未运行完整 `pnpm verify`/watch，也未运行全仓浏览器套件。额外 login-navigation、StrictMode 导航矩阵未纳入最终targeted batch，L14仍未完成；真实BFCache命中、真实浏览器zoom、其他浏览器/OS、真实产品与后端仍未测。初始额外navigation探查观察到既有refresh→session期间的短暂authenticated状态及宿主导航时序；视觉恢复/焦点用例使用示例已有 `handoff=hold` 隔离宿主导航，只验证本次布局范围，未修复或声称修复认证时序。

## 后续导航时序修复（2026-10-13）

本批保持2b8居中布局与全部视觉token不变，只修共享owner就绪边界和双端导航生命周期：currentUser的refresh中间结果不再发布空闲；页面等待自己的认证/读取完成，失效读取不因另一份有效access而导航；同id刷新不重复导航。宿主回调在刷新期间失败仍保留局部手动重试，页面卸载/旧owner/过期waiter不触发迟到导航。

- 验收新增：宿主先发起session再挂页、最终session held/失败/匿名、旧session被新generation淘汰、隐藏期间读取完成后恢复、StrictMode加入共享读取、owner替换、刷新期间host callback失败；保留原直接目标页DOM序列与HTTP/回调计数。生命周期事件模拟不等于真实BFCache命中。
- currentUser三类owner边界单测已补：最终read前不能发布authenticated+idle、独立refresh仍完成且不增session、在恢复access通知时加入同一flight；另覆盖新login不被旧session的busy残留阻塞。
- 当前云Chromium按仓库正常配置启动报socket EPERM；初次28个导航用例都在启动阶段退出，没有页面断言或真实新截图。未更改安全启动配置；本批真实浏览器与全量验收等待最终提交的CI结果，不用旧2b8的布局targeted结果替代。

本批最终本地预检：源码generation `8259e27d35d59327f1cafe0590c7bd70a0866346a8442f1e60137c08c9022bbe` 的dev-build/typecheck、350-token合同、364/364 unit、真实watch重建与故障恢复（127.8秒）通过；同树React/native独立tarball的全部公开exports/types、布局示例和体积门禁通过。consumer首轮工具会话中断未计通过，240秒有界重跑返回exit 0。导航浏览器文件收集51项；未本地执行页面断言，L14及全量CI仍待最终SHA的真实结果。


## 2026-10-13 参考交互清单复核

对照用户提供的[墨刀登录页交互参考](https://modao.cc/ad/blog/login-page-prototype-templates.html)复核状态和交互，不改变已确定的居中单框设计。本文历史 targeted 记录不覆盖后续提交；最新完整安全浏览器基线为 8ae5ca0 的 979 项 full browser 和 199 项 focused（CI 38400356137）。

- 已有回归：普通匿名单主操作、字段 required/关联反馈、busy 禁重入、Enter 提交、网络错误可见、导航失败局部恢复、窄屏/根字号放大、Tab/四边焦点、pagehide 清密码和卸载迟到保护。对应 login、login-layout、login-visual、login-navigation 浏览器文件；API/真实产品不能由合成样例替代验收。
- 异常核验：超时或网络失败不推断写入回滚，通过普通会话读取一次当前状态。确认成功则继续，未确认保留错误并允许手动重试，不自动重发登录，不增加专用恢复交互。
- 待独立验收：真实系统密码管理器/自动填充、真实读屏器、手机系统键盘、真实 BFCache 命中；现有 autocomplete/ARIA 属性和模拟生命周期测试不算这些实际结果。登录页当前没有密码显隐按钮，不能把另一个公共 PasswordInput 的能力写成登录页已接入；若接入需保持光标/焦点并补两端回归。
- 验证码、短信、锁定解锁、注册、忘记密码、二次认证与第三方账号绑定均依赖真实后端能力。本次不为参考模板补假入口、倒计时或未实现恢复路径；多端策略以已实现认证合同为准。


## 第二轮层级重设计：基线、依据与目标（2026-10-13）

此轮以功能整合4b772f7为代码基线，不修改认证协议、setup业务controller或密码强度算法。旧截图为0eb345a的CI18登录证据，其视觉布局未被后续功能整合改变；新截图必须来自本轮最终提交，不拿旧全绿当新验收。

### 实际观察与参考取舍

已打开CI18的React light 1280截图，并读取同布局1600几何：卡片450×470px，品牌16/26、标题32/40、标签13/20、输入14/22和40高；主按钮底到卡片底85px。标题重复品牌任务词并抢占注意，说明先于任务标题，标签相对大标题显小；底部空轨与多个padding叠加显松。CI截图中文字出现衬线fallback，必须记录实际渲染字体，不用CSS声明冒充字体生效。

- [Carbon Login：Centered layout与Spacing](https://www.carbondesignsystem.com/building-blocks/core/patterns/login)：采纳任务集中、同网格和状态间位置稳定；其分步账号流程、背景图和营销区不移植。
- [GitHub Primer Forms](https://primer.style/product/ui-patterns/forms/)：采纳纵向扫描、标签常显、说明不重复；使用已有角色和邻近关系，不复制其品牌色或像素值。
- [GOV.UK Text input](https://design-system.service.gov.uk/components/text-input/)：参考label/hint/error的清晰职责与关联；不改变本项目既有错误时序。
- [用户提供的墨刀参考](https://modao.cc/ad/blog/login-page-prototype-templates.html)：作为异常、键盘、密码管理器和中断清单；不增加没有后端支持的入口、验证码或账号状态。

### 本轮预先固定的量化目标

默认16px根字号：卡片434px、内容轨道384px、字段和主动作376px；品牌14/22和32px图标；标题28/36；说明与标签14/22；输入和主动作16/26、44px高。顺序为品牌→标题→说明→字段→主动作→反馈。标题/说明8px、说明/首标签24px、标签/字段8px、字段间16px、末字段/动作16px；反馈40px、卡片底padding12px，动作后总余量57px而非85px。缺省说明时不占行。所有尺寸由DESIGN默认语义变量推导；主按钮不会被错误挤动，长消息只在局部滚动。正文增大时可自然增高，仍保留根字号偏好。

双端/三主题/320与390窄屏/1280桌面检查默认登录和真实AdminSetupPage；原长文案测试保留。普通登录不出现新密码规则与强度；setup显示规则、计数与本地强度。真实浏览器200%采用官方Chrome设置页的Page zoom=2，核验DPR翻倍、innerWidth减半、根字号不变、pinch=1与CSS zoom=1；另保留200%根字号测试，二者不得混称。逐控件focus和滚动可达，截图需捕获整个真实物理视口并核验尺寸。

中文生产字体继续使用已有中文sans系统回退，不远程加载字体。CI从官方系统仓安装Noto Sans CJK，并用Chrome CSS.getPlatformFontsForNode记录实际字体与glyphCount，发现缺字/衬线fallback时应报告。仅增加CI字体不能证明用户系统字体表现一致。

### 当前验证状态

本机Chromium正常安全配置启动在process_singleton socket()返回EPERM，未产生新渲染；未添加no-sandbox或其它安全降级。新截图、几何、状态、中文字体和真实200%等待官方Chrome安全CI。静态类型/单测/构建结果在最终版本记录，不能替代视觉查看。最终交付前必须打开新旧截图对照检查比例、可读性、空白与焦点。

本轮预检：source generation `1813da04f25c` 的正式build/typecheck、357-token合同及477/477单测通过；React/原生独立tarball的全部公开ESM/CSS/types、lazy strength拆包与体积门禁通过。新增视觉+既有login-visual收集52项（收集不等于执行）。真实watch重建与错误恢复通过（187.9秒）；真实安全Chrome与新截图尚待CI。随后仅增加Agent-ready研究/规范及更新AUTH的旧尺寸描述，最终提交仍由CI重跑。


## 57c真实图像复审后的反馈可读性修复

CI38413454627、SHA57c4afe2c8c7662b08922bb21382e500720d97ea的认证artifact11823253299与focused artifact11823188955已实际查看。36个默认矩阵几何无横向溢出；12个浏览器200%实例DPR1→2、innerWidth1280→640、根字号16px不变、pinch/CSS zoom均1；所看焦点图四边完整。18组短登录idle/error/busy最大几何差0px。默认native首label实际平台字体为NotoSansCJKsc-Regular（glyphCount3），标题/品牌NotoSansCJKsc-Bold；不以声明字体栈代替证据，密码/帮助未逐节点采字体。

实图暴露问题：固定40px反馈使setup长错只露一行及半截下一行；根字号200%时unknown的“不能再次提交”藏在下方。测试全绿不等于结果可读。旧L06/L07的长错误固定高/局部滚动要求因此由本轮完整显示要求替代；上方历史结果仍是当时基线记录，不当作修复通过。

本轮仅修公共呈现：反馈最小高而非固定高，长消息随文档自然增长；现有slot演示完整摘要+公共Disclosure独立详情；busy只在主按钮显示一次；原生必填星号与React对齐且不进入accessible name。无新主题、调色板、业务流程或认证/评分/Key协议改动。本轮新增真实图像验收要求包括unknown关键句所有行不受任何祖先裁切、长错误首尾行可经文档访问、详情Enter/Space展开/收起/回焦点、输入DOM和值不变，以及实际submitting截图。短状态仍测零位移；必要长内容增长不作为失败，但控件本身尺寸和顺序不可变。
