import * as React from 'react';
import {createApiKeyHttpAdapter,type ApiKeySchemaVersion,type ApiKeySecretReader,type ApiKeyWireMetadataV3} from '@coffeehc/xui-runtime/api-key-http';
import type {ApiKeySecretAccess,ApiKeyManagerController} from '@coffeehc/xui-runtime/api-key';
import type {HttpClient} from '@coffeehc/xui-runtime/http';
import {ApiKeyManager,type ApiKeyCellCopyOptions} from '@coffeehc/xui-react/api-key';
declare const http:HttpClient,controller:ApiKeyManagerController,row:ApiKeyWireMetadataV3;
const version:ApiKeySchemaVersion=3,adapter=createApiKeyHttpAdapter({http,schemaVersion:version});
const copy:ApiKeyCellCopyOptions|false=adapter.keyCopy??false;
const page=<ApiKeyManager controller={controller} keyCopy={copy}/>;
const access:ApiKeySecretAccess={authorized:true,recoverable:false,canCopy:false};
declare const reader:ApiKeySecretReader;
void reader.readValue(controller.getState().rows[0],{signal:new AbortController().signal});
// @ts-expect-error Unknown wire versions cannot silently enable copying.
createApiKeyHttpAdapter({http,schemaVersion:4});
// @ts-expect-error A capability is a boolean fact, not a label.
const invalid:ApiKeySecretAccess={authorized:'yes',recoverable:true,canCopy:true};
void [page,access,row,invalid];
