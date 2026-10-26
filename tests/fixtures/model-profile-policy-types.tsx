import {createModelProfileController,type ModelProfilePolicyField} from '@coffeehc/xui-runtime/model-profile';
import {ModelProfileForm,modelProfileLabels,type ModelProfileLabels} from '@coffeehc/xui-react/model-profile';
const required:readonly ModelProfilePolicyField[]=['max_context_tokens','reasoning_effort'];
const owner=createModelProfileController({requiredPolicyFields:required});
owner.update({requiredPolicyFields:['max_completion_tokens']});
export const view=<ModelProfileForm controller={owner} labels={{contextMissing:'Configure capacity',notSpecified:'Unspecified'}}/>;
export const owned=<ModelProfileForm options={{requiredPolicyFields:required}}/>;
// @ts-expect-error Only the three public chat-policy controls are accepted.
owner.update({requiredPolicyFields:['invented']});
// @ts-expect-error The borrowed Controller alone owns requirements.
export const competing=<ModelProfileForm controller={owner} requiredPolicyFields={required}/>;

const {contextMissing,notSpecified,...legacyLabels}=modelProfileLabels;
const compatibleLabels:ModelProfileLabels=legacyLabels;
export const legacy=<ModelProfileForm options={{}} labels={compatibleLabels}/>;
