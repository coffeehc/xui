# 公共控件扩展的实现合同

唯一完整规则及271个原始默认值见[DESIGN](DESIGN.md)。本页是当前公开实现映射；[公开入口](PUBLIC_API.md)、[React消费者](../examples/widgets-react/app.tsx)、[原生消费者](../examples/widgets-vanilla/app.js)使用正式CSS/ESM/types，不依赖私有皮肤、源码alias或下游Tailwind扫描。合成宿主不是产品迁移。

| 能力 | React公开接口 | 原生公开合同 | 默认与所有权 |
| --- | --- | --- | --- |
| Command | `/command`的CommandPicker | `/widgets-dom`的createCommandPicker(root,options) | mode=single；multiple保留过滤前已选id；action回调不存选择。items={id,label,group?,keywords?,disabled?}；value/defaultValue均id数组，single至多一个。label必填，空态可改。数据/领域权限/远端搜索/动作busy由宿主，选择只是草稿，确认另由宿主执行 |
| Calendar | `/calendar`的Calendar，独立`/calendar` runtime model | createCalendar(root,options)、createCalendarModel | mode=single；range={start,end}，空端点null，start/end有序。严格YYYY-MM-DD，defaultMonth=YYYY-MM；locale默认zh-CN/weekStartsOn=1。显示只用UTC日期字段，无瞬时时区转换；业务时区与日期→时间端点转换由宿主明确。today可给确定日期，省略用当前UTC日。不猜字符串日期/毫秒/时区 |
| ToggleGroup | `/toggle-group`的ToggleGroup.Root/Item，peer props/ref/render | createToggleGroup(root,options)，现有button[data-value] | 单选默认，value/defaultValue是字符串数组；multiple/allowEmpty/disabled/orientation。allowEmpty默认true；false阻止取消最后一项，但不替宿主猜初始值。方向键/Home/End只移动焦点，Space/Enter选择；不冒用Tabs语义 |
| Avatar | `/avatar`的Avatar.Root/Image/Fallback，peer loading callback/delay | createAvatar(root,{name,src?,fallback,size?,delay?}) | size=default（sm/lg可选），delay=0；图像加载/错误/文字fallback保持同一尺寸。业务名称/地址/身份由宿主。原生name给role=img名称，内图alt空；React宿主提供适当Root名称/内图alt，避免重复读出 |
| Accordion | `/accordion`的Accordion.Root/Item/Header/Trigger/Panel | createAccordion(root,options)，公开details[data-value]/summary/内容类 | value/defaultValue为id数组，默认single，可multiple；禁用项原生data-disabled=true。Tab/Enter/Space按按钮/summary语义；peer1.7已弃用Accordion强制箭头roving，不编造键盘默认。展开内容由宿主，不接业务流程 |
| ScrollArea | `/scroll-area`的ScrollArea.Root/Viewport/Content | `.xui-scroll-area/.xui-scroll-viewport/.xui-scroll-content` | 浏览器原生滚动与滚动条，无第二JS引擎。Root由宿主给blockSize/maxBlockSize等界限；Viewport=min-size:0/overflow:auto，默认tabIndex=0、role=region，宿主给aria-label。内容同节点更新保留滚动，宿主拥有路由历史恢复和任意虚拟化 |
| InputGroup | `/forms`的InputGroup.Root/Addon/Input/Button，复用Field/Input | `.xui-input-group`内`.xui-input-addon/.xui-input/.xui-input-action` | 一个Field仍只有一个control，Addon不领id；native label/for/help/error由宿主准确连接。focus-within仅组边界，输入自身无第二outline；invalid由Field或aria-invalid合成。内嵌Button type=button，显式disabled不猜busy |

Command复用已安装的Combobox：inline列表、搜索、分组、空态、disabled、选择与键盘；只声明上述稳定组合，不照搬cmdk。原生输入保持DOM identity，aria-controls/activedescendant/selected/multiselectable同事实；ArrowUp/Down/Home/End跳过disabled，Enter执行，Escape清过滤而保留选择。action不作权限/副作用校验，也不自动等待/重放业务。需要远端搜索或更细peer部件时组合已有Combobox/Select，不能用私有默认样式补丁。

Calendar使用一个框架无关model；更新一次发布一致快照，选相邻月份后保留所选日焦点。Arrow左右一天、上下七天、Home/End周端、PageUp/Down按月并夹到有效日，Enter/Space走按钮选择；禁用日期可焦点读取但不能选择，clear清空选择。月份查看不是业务查询，动画不等待操作。没有时间选择器、农历、复杂可用性/节假日或预约引擎。defaultMonth只定义初始视图；月份查看由库保存，runtime model可显式moveMonth，日期value由宿主按受控合同确认。

原生工厂只拥有指定root，update(partial)保留选项；受控value由宿主确认，defaultValue只读初始。destroy恢复创建前root/相关控件属性并释放监听/计时器；destroy幂等，已销毁update无效，旧句柄不影响重建owner。同root不能重复创建活跃widget。Callback只能接受公开事实；安全权限/业务结果由宿主确认。原生ScrollArea/InputGroup为HTML合同，没有隐式controller。React同peer单实例，原生不引入React。

## Button与选择控件补齐

Button variant=link提供文字链接外观，默认type=button。button继续Enter/Space执行；真正导航需render原生a、nativeButton=false和role=link（或直接原生a.xui-button[data-variant=link]）。链接保留Enter、Space不模拟点击、修改键/中键/target/download；外观不改变导航所有权。aria-busy仍不自动disabled，焦点独立可见。

NativeSelect/Checkbox/Radio/Switch的controlSize=sm/default/lg是视觉尺寸，默认default；NativeSelect原生size:number仍保留，不增全局密度模式。原生用data-control-size对应。选择readOnly由公共层阻止click与Space（radio也阻止改变选择的箭头），保留Tab/指针焦点与aria-readonly；不等于disabled。React受控checked和非受控defaultChecked均支持，readonly不触发onChange。原生checkbox/radio调用bindReadonlyChoice(input)，使用input.readOnly事实、sync更新ARIA，destroy释放；不使用HTML readonly属性单独冒充功能。disabled走原生disabled，表单提交语义不改。

## 受测范围

专项[控件浏览器](../tests/browser/widgets.spec.mjs)、[日期与取消单测](../tests/calendar.test.mjs)及[登录扩展](../tests/browser/login-extensions.spec.mjs)在正式打包消费者运行；最终SHA、全verify、CI与实际数量见[验证记录](FOUNDATION_VALIDATION.md)。根字号200%只属于文字放大；真实OS/读屏器/Safari/Firefox、Wails窗口、产品接口和生产性能另验，不由源码/合成例子推断通过。
