import {createAnalytics, createGa4AnalyticsAdapter, type AnalyticsAdapter} from '@coffeehc/xui-runtime/analytics';
const noop: AnalyticsAdapter = {start:async()=>true,stop(){},send(){}};
const analytics = createAnalytics({product:'example',version:'1.0',adapter:noop});
analytics.task('succeeded','research');
// @ts-expect-error arbitrary event names are not accepted
analytics.task('user_email','research');
// @ts-expect-error custom payloads are not accepted
analytics.feature('search',{prompt:'private'});
// @ts-expect-error application metadata is explicit
createAnalytics({adapter:noop});
createGa4AnalyticsAdapter({measurementId:'G-EXAMPLE',allowedHosts:['example.invalid']});
