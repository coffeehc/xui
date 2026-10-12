# 应用头部、紧凑导航与文字角色验收

源基线为 d4bbe828，改动仅位于 xui。采用正式 ESM/CSS/types 的[React消费者](../examples/layout-typography-react/app.tsx)与[原生消费者](../examples/layout-typography-vanilla/app.js)，没有业务API、权限、数据库或产品页面改造。受控默认值来自[DESIGN](DESIGN.md)，使用合同与迁移步骤见[NAVIGATION](NAVIGATION.md#应用头部角色与紧凑侧栏迁移)和[COMPOSITIONS](COMPOSITIONS.md#菜单文字图标与字段标签)。

## 自动回归覆盖矩阵

| 角色 | React与原生验收 | 证据入口 |
| --- | --- | --- |
| 应用头部 | light/dark/system，1280桌面/390窄屏/200%文字，长中文品牌与路径、状态、多个动作、无动作、旧header | 布局边界CSS像素指标、截图、键盘focus、无pageerror/整页横溢出 |
| 角色更新 | 原生Node/DocumentFragment稳定，非头部更新不丢控件/焦点，明确替换与移除 | DOM identity与实际交互断言 |
| 紧凑菜单 | 3项带图标，默认展开216/收起60，36项/左右12；反复切换、支路、长列表与独立viewport滚动 | computed style/矩形、selected短线、hover/focus、当前项可见 |
| 窄屏导航 | 同一个drawer完整标签、取消和回焦点、200%文字 | 实际点击、键盘与无横溢出 |
| 菜单文字与图标 | 普通/Link/Radio/Checkbox/Submenu/Context角色13/20/500，icon slot16且非slot插图保留24 | computed style/矩形和作用域断言 |
| 标签与字段 | 标签13/20/500，label-control-help-error间距8/4/4，label和错误关联，choice点击区≥36 | computed style、关联与真实点击 |
| 正式合同 | 全入口types/ESM/CSS/init、peer单实例、token图/原来源逆校验、watch | 根脚本及相应unit/consumer/watch门禁 |

测试实现：[浏览器回归](../tests/browser/layout-typography.spec.mjs)、[菜单字段单测](../tests/menu-field-roles.test.mjs)。截图和CSS像素指标写入 `test-results` 并由既有CI validation artifact保存；不是设备像素测量。新fixture仅为独立公共合同验收，不是任何采用产品的端到端成绩。

## 执行与限制

本轮云端按既有Playwright配置执行一次正式Chromium启动，仍在页面打开前失败：process_singleton_posix.cc的socket()返回Operation not permitted；保留启动日志，不修改浏览器安全参数或反复重试。构建、275-token校验、typecheck及159项单测已实际通过；独立tarball消费也已通过68公开入口、全部命名types/ESM/CSS/init、React/native新合成页、peer/按需及gzip门禁。32项新浏览器回归已成功发现（全套234项），但本地未执行；本地watch未重复此前环境超时，cold-start因同一浏览器限制未跑。完整watch/cold-start/视觉矩阵留给本次push自动触发的既有GitHub CI，未取得结果前不称完整验收通过。最终精确提交的检查结果及CI链接由交付记录给出；失败与未跑必须分别列出，不能用静态源码断言替代截图/真实渲染。

用户提到的产品相对复现脚本及本机output截图未上传，本任务没有访问其本机路径，也未把这些截图作为已检查证据。原生浏览器200%zoom、真实产品页面/后端、其它浏览器、真实移动OS和读屏器未验证；根字体200%与相应窄CSS视口是明示的合成覆盖，不冒充原生浏览器缩放。
