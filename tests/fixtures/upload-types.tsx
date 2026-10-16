import {Upload, type UploadController, type UploadControllerOptions} from '@coffeehc/xui-react/upload';
import {HTTPService, UploadService, XuiServices} from '@coffeehc/xui-runtime/services';
import type {HttpClientOptions, HttpResponse} from '@coffeehc/xui-runtime/http';
import type {UploadRequestOptions, UploadService as UploadServiceContract} from '@coffeehc/xui-runtime/upload';

interface StoredFile {assetId: string; bytes: number}

declare const file: File;
declare const controller: UploadController<StoredFile>;
const requestOptions: UploadRequestOptions<StoredFile> = {fieldName: 'attachment', fields: {purpose: 'invoice'}, timeoutMs: 45_000};
const httpOptions: HttpClientOptions = {baseURL: 'https://example.test/api/'};
const isolated = new XuiServices({http: {options: httpOptions}});

const stableHttp: typeof HTTPService = HTTPService;
const stableUpload: typeof UploadService = isolated.getUploadService();
const serviceContract: UploadServiceContract = stableUpload;
const httpResult: Promise<HttpResponse<StoredFile>> = HTTPService.request<StoredFile>('/files');
const uploadResult: Promise<HttpResponse<StoredFile>> = UploadService.request<StoredFile>('/files', file, requestOptions);

const options: UploadControllerOptions<StoredFile> = {
  path: '/files',
  service: UploadService,
  multiple: true,
  maxFiles: 4,
  request: requestOptions,
};
const configured = <Upload<StoredFile> label="文件" options={options} />;
const injected = <Upload<StoredFile> label="文件" controller={controller} />;

// @ts-expect-error Upload fixes POST so multipart bodies cannot be replaced.
UploadService.request('/files', file, {method: 'PUT'});
// @ts-expect-error UploadService owns the multipart body.
UploadService.request('/files', file, {body: 'raw'});
// @ts-expect-error UploadService does not accept a JSON body.
UploadService.request('/files', file, {json: {name: file.name}});
// @ts-expect-error Write requests cannot opt into automatic replay.
UploadService.request('/files', file, {retry: {idempotentRead: true, maxAttempts: 2}});
// @ts-expect-error A borrowed controller replaces options and its service owner.
const conflict = <Upload<StoredFile> label="文件" controller={controller} options={options} />;

void [stableHttp, stableUpload, serviceContract, httpResult, uploadResult, configured, injected, conflict, isolated];
