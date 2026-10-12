import * as React from 'react';
import {MetricCard,type MetricCardProps} from '@coffeehc/xui-react/metric-card';
import {MetricCard as RootMetricCard} from '@coffeehc/xui-react';
import {Grid} from '@coffeehc/xui-react/layout';
const props:MetricCardProps={label:'调用方名称',value:0,marker:<span aria-hidden="true">●</span>,ref:React.createRef<HTMLElement>(),'aria-busy':true};
const example=<Grid><MetricCard {...props}/><RootMetricCard label="已格式化值" value="1,234.50"/></Grid>;
// @ts-expect-error A value is required; the library must not invent missing facts.
const missing=<MetricCard label="名称"/>;
// @ts-expect-error The single metric does not accept a business metric collection.
const collection=<MetricCard label="名称" value={0} metrics={[]}/>;
// @ts-expect-error Content uses the documented label/value/marker slots.
const children=<MetricCard label="名称" value={0}>隐式内容</MetricCard>;
void [example,missing,collection,children];
