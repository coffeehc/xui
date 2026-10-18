# StructuredLogExplorer 定向升级与验收

仅用于当前项目使用完整StructuredLogExplorer的页面。先执行[主入口的范围选择](../SKILL.md#定向升级与自查)；目标固定产物须实际具备4.2.22引入的查询组合合同。仅用基础控件组合的领域日志页面不因此强制迁移，缺少跨组records也不要求新增API。

## 读取已有合同，不重写另一套标准

- 布局、字段宽度、动作对齐、状态：[查询页layout与slot矩阵](../../../../docs/DESIGN.md#手动查询页布局与状态合同4220)。
- 实际公开props、slot及草稿/提交动作：[StructuredLogExplorer组件合同](../../../../docs/COMPONENTS.md#structuredlogexplorer-查询与槽位4222)。
- 请求、可选records、精度和Controller边界：[程序错误观察](../../../../docs/PUBLIC_API.md#程序错误观察)。
- 升级步骤与判定：[接入说明](../../../../docs/ADOPTION.md#structuredlogexplorer-查询组合4222)、[LOG-QUERY-001～008](../../../../docs/ADOPTION_CHECKLIST.md#structuredlogexplorer-查询逐项检查)。示例[log-react](../../../../examples/log-react/app.tsx)只作公共接法参考，不能替代产品验收。

## 执行与取证

1. **固定范围与产物。** 查找完整Explorer的所有实际调用、封装和运行入口，列出受影响页面、现有controller/options/viewController接法、创建/释放位置及HTTP入口。按[正式产物合同](../../../../docs/ADOPTION.md#固定产物与可运行示例)升级并核对三包、锁文件、ESM/CSS/types、peer单实例；同一构建只保存一份共享证据。保留自定义主题与原请求/认证/Controller owner，不为该组件重新迁移登录或导航。
2. **逐实例对照slot。** 按组件合同将宿主额外标题动作接headerActions、页级工具接pageToolbar；库内QueryForm.fields/actions/advanced/summary的映射由库维护，不把这些名称当作Explorer新增props，不外包第二份表单/筛选。结合LOG-QUERY-001检查空槽、归属、文字角色和实际侧栏后的净宽；不复制DOM、私有CSS、字号或字段宽度补丁。
3. **按动作矩阵测请求增量。** 待首屏读取稳定后，分别记录编辑、应用/Enter、重置草稿、清除筛选、刷新及原生form.reset的草稿/已提交filter、请求method/URL/参数/次数、结果/游标/快照。重点用LOG-QUERY-002～004区分“恢复最近提交草稿、零请求”与“显式提交空filter、一次当前视图查询”；以组件动作矩阵为完整判定，不把清除查询当HTTP故障，不把setFilter({})误当裸HTTP请求体。分组、全量和组内只验证项目实际支持的模式，缺省records按合同处理；无对应模式的检查记录业务依据。
4. **补相关状态和真实页面证据。** 按LOG-QUERY-005～008验证高级区草稿/关闭回焦、非法条件零请求、RFC3339Nano及显式offset、同范围刷新保行/草稿/焦点/滚动、新范围取消/迟到隔离与详情回焦。使用[浏览器矩阵](../../../../docs/ADOPTION_CHECKLIST.md#逐项浏览器验收矩阵)覆盖本页浅深system、宽窄、长中文、200%文字和真实浏览器200%缩放，后两者分开记录；实际请求与权限用项目接口取证，不用库mock通过替代。适用的程序错误API按[REQ/OK/ERR清单](../../../../docs/ADOPTION_CHECKLIST.md#16-个公共-api-操作逐项检查)选择，不重验无关认证、Key或业务日志操作。
5. **完成本次范围后停止。** 运行项目必要构建/类型和受影响回归，记录每页slot与LOG-QUERY-001～008的结论和证据。共享主题/构建入口确有版本差异或出现关联失败时才按[影响范围](../../../../docs/ADOPTION.md#按影响选择执行范围)补检查，不能为节省时间忽略真实影响，也不无依据扩大到整项目。公共缺口按[既有归属规则](../../../../docs/ADOPTION.md#接入合规与公共缺口归属)交给xui，不在消费项目补丁；失败/未跑项如实交付，全部适用项通过后按项目授权完成提交等交付。

交付沿用[统一报告格式](../../../../docs/ADOPTION_CHECKLIST.md#每条检查的报告模板)：当前→目标版本/SHA/sourceGeneration、受影响实例与选用ID、slot/owner映射、构建/浏览器/请求证据、公共缺口及未验边界。只维护项目现有接入记录，不复制本页或整份规范。
