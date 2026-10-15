import {FormGrid,FormActions,type FormGridProps,type FormGridItemProps,type FormActionsProps} from '@coffeehc/xui-react/layout';
import {Fieldset} from '@coffeehc/xui-react/forms';
import {LoadingState,DataRegion,type LoadingStateProps,type DataRegionProps} from '@coffeehc/xui-react/feedback';
const grid:FormGridProps={columns:2},item:FormGridItemProps={span:'full'},actions:FormActionsProps={secondary:'取消'},loading:LoadingStateProps={layout:'inline'},region:DataRegionProps={feedbackLayout:'flow'};
export const form=<DataRegion {...region}><Fieldset legend="研究范围" layout="stack"><FormGrid {...grid}><FormGrid.Item {...item}>完整字段</FormGrid.Item></FormGrid><FormActions {...actions}>保存</FormActions></Fieldset><LoadingState {...loading}/></DataRegion>;
// @ts-expect-error The public form grid intentionally has at most two columns.
const three=<FormGrid columns={3}/>;
// @ts-expect-error Only explicit full span is public; host must not invent track offsets.
const partial=<FormGrid.Item span={2}/>;
// @ts-expect-error Block/inline are loading presentation, not a request status owner.
const busy=<LoadingState layout="refreshing"/>;
// @ts-expect-error A feedback slot is reserved or natural flow.
const overlay=<DataRegion feedbackLayout="overlay"/>;
// @ts-expect-error Fieldset layout must retain the public stack/inline contract.
const horizontal=<Fieldset layout="horizontal"/>;
void [three,partial,busy,overlay,horizontal];
