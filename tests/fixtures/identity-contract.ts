import {parseEntityId,type EntityIdEncoding} from '@coffeehc/xui-runtime/entity-id';
import {XuiServices} from '@coffeehc/xui-runtime/services';
import {parseAuthSession} from '@coffeehc/xui-runtime/auth';
import {createApiKeyHttpAdapter,parseApiKeyWireMetadata} from '@coffeehc/xui-runtime/api-key-http';

const encoding:EntityIdEncoding='hex';
const id:string=parseEntityId('7fffffffffffffff',encoding);
const services=new XuiServices({http:{options:{baseURL:'https://fixture.invalid'}},auth:{options:{idEncoding:encoding}}});
const http=services.getHttpService();
const auth=services.getAuthService();
const keys=createApiKeyHttpAdapter({http,idEncoding:encoding});
const user=parseAuthSession({schema_version:2,user:{id,username:'fixture',display_name:null}},encoding).user;
const metadata=parseApiKeyWireMetadata({id,name:'fixture',prefix:null,permission_ids:[],created_at:null,expires_at:null,last_used_at:null,status:'active',version:'1',enabled:true,capabilities:{update:true,revoke:true,delete_record:false}},encoding);
void [keys,user,metadata];services.dispose();

// @ts-expect-error 未声明的编码不能进入公共选项。
const unknown:EntityIdEncoding='auto';
void unknown;
