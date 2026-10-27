import {createModelProfileController,type ModelProfilePolicyField,type ModelProfileState,type ModelProfileErrorReason} from '@coffeehc/xui-runtime/model-profile';
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

const {contextMissing,notSpecified,versionConflict,networkError,timeoutError,responseError,requestCancelled,...legacyLabels}=modelProfileLabels;
const compatibleLabels:ModelProfileLabels=legacyLabels;
export const legacy=<ModelProfileForm options={{}} labels={compatibleLabels}/>;

const feedback:ModelProfileErrorReason='version_conflict';
declare const oldState:Omit<ModelProfileState,'errorReason'|'requiredPolicyFields'>;
const compatibleState:ModelProfileState=oldState;
export const translated=<ModelProfileForm controller={owner} labels={{versionConflict:'Configuration changed. Read it again.',networkError:'Network unavailable',timeoutError:'Request timed out',responseError:'Invalid response',requestCancelled:'Cancelled'}}/>;
// @ts-expect-error Raw server messages are not feedback reasons.
const invalidReason:ModelProfileErrorReason='raw_error_message';
void [feedback,compatibleState,invalidReason];
