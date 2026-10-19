# 四类默认完整页面接入

选择/迁移管理员初始化、用户登录、业务日志或平台API Key完整页，或改变其app/pages配置、服务接线时读取本页；仅处理本次受影响页面，不展开为全项目迁移。已正确接入BusinessLogExplorer且仅调整list展示时走[列表定向流程](../../../../docs/ADOPTION.md#toast-与复制及业务日志列表定向升级)，不重做本页接线。启用对应业务且无已确认特殊要求时，使用完整公共页，不只取Input/Button再拼同职责页面。品牌、Logo、文案、主题和路由差异优先作为正常配置。

1. **确定能力和公开入口。** 按[默认页映射](../../../../docs/COMPONENTS.md#默认完整页面与配套接线4223)选择AdminSetupPage、ConfigurableLoginPage、BusinessLogExplorer或ApiKeyManager；先核对固定版本与真实后端能力，不为没有日志/平台Key业务的产品新增假页面或数据。
2. **采用同一配置与已有owner。** app/pages经bootstrap和resolveDefaultPages投影成原组件的config/options/labels/pagination，挂到宿主URI路由；函数不挂菜单/路由、不创建服务或发请求。服务按模块导入，主题/Auth/HTTP沿用已有单例，独立页面保留所属Controller。完整字段、类型和接线例子只在[组件合同](../../../../docs/COMPONENTS.md#默认完整页面与配套接线4223)定义，skill不复制配置表。
3. **直接连接配套服务。** BaseService已有认证/Key/业务日志facade直接用[官方client/adapter](../../../../docs/PUBLIC_API.md#默认适配器的服务前置)，不改method/DTO/错误/凭据或增加前端兼容层；未用BaseService时由后端一次提供正式wire，缺失则登记owner，不借UI任务改后端。管理员初始化当前使用权威state/onCheck/onSubmit和同一AuthPage，缺少统一HTTP合同的[转交提示词](../../../../docs/PUBLIC_REQUESTS.md#baseservice-管理员初始化合同提示词)交BaseService，不猜URL或把配置当初始化授权。
4. **按真实slot扩展并登记例外。** 依[页面slot架构](../../../../docs/DESIGN.md#页面与组件的槽位架构)与各页实际props放内容，不假定所有完整页都有相同slot。公开slot/controller/callback不能表达的公共增强交xui，不复制或patch组件。特殊领域流程、第三方标准SSO与默认合同不符时保留真实owner，用适用公开组合并记录原因、受限slot/接口和未适用范围，不能擅改标准协议。
5. **完成定向验收。** 执行[DEFAULT-PAGE-001～008](../../../../docs/ADOPTION_CHECKLIST.md#四类默认页面逐项检查)及本次实际命中的认证/Key/业务日志REQ/OK/ERR与slot/状态ID，不重验无关API。共享正式产物/peer证据同构建一次；每个页面的初始化阶段、权限、秘密清理、分页、刷新、错误、焦点及实际请求接线分别验收。库mock通过不能替代产品页面或后端联调；有适用失败/未跑项时按既有报告格式交付部分完成与owner。

正常新接入与升级遵守[范围选择和停止条件](../../../../docs/ADOPTION.md#按影响选择执行范围)，公共默认值与例外判定只在[DESIGN](../../../../docs/DESIGN.md#四类默认公共页面4223)维护。不另造公共页面皮肤、第二认证/查询owner或项目私有API合同。
