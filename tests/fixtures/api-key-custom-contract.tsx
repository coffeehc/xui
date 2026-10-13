import {parseApiKeyCustomOperationDescriptor,type ApiKeyAdapter,type ApiKeyCustomOperationDescriptor,type ApiKeyCustomWriteReceipt,type ApiKeyWriteSnapshot} from '../../packages/runtime/src/api-key';
const identity:ApiKeyCustomOperationDescriptor=parseApiKeyCustomOperationDescriptor({schema_version:2,operation_id:'00000000-0000-4000-8000-000000000001',operation:'create',intent_target_id:'',action:'key-rotate',target_id:'a1',expected_version:'0',fingerprint:'a'.repeat(64)});
const snapshot:ApiKeyWriteSnapshot={schema_version:2,scope_id:'verified-actor',descriptor:identity};
const receipt:ApiKeyCustomWriteReceipt={descriptor:identity,resolution:'pending'};
const callbacks:Pick<ApiKeyAdapter,'prepareWrite'|'reconcileWrite'>={prepareWrite:async()=>identity,reconcileWrite:async()=>receipt};
void [snapshot,callbacks];
// @ts-expect-error custom descriptor versions are closed
const wrong:ApiKeyCustomOperationDescriptor={...identity,schema_version:1};
void wrong;
