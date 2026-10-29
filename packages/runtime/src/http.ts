/** Public HTTP contracts and error adapters. Obtain the application client from services.ts. */
export {
  ajaxErrorResponseAdapter,
  createAjaxResponseAdapter,
  ajaxResponseAdapter,
  createJsonApiErrorAdapter,
  HttpError,
  isHttpError,
  getHttpErrorMessage,
  parseAjaxResponse,
} from './http-service.js';
export type {
  AjaxResponse,
  HttpErrorKind,
  HttpMetadata,
  HttpErrorDetails,
  HttpBusinessError,
  ErrorResponseAdapter,
  HttpResponseContext,
  AdaptedResponse,
  ResponseAdapter,
  ResponseMode,
  ReadRetry,
  HttpRequestOptions,
  HttpClientOptions,
  HttpResponseHeaders,
  HttpResponse,
  HttpClient,
} from './http-service.js';
export {getHttpService} from './http-access.js';
export type {ServerSentEvent,SseReadOptions} from './http-sse.js';

import {getHttpService as resolveHTTP} from './http-access.js';
import type {HttpClient} from './http-service.js';
import {serviceInstance} from './service-resolvers.js';
/** Direct shared HTTP singleton. Importing this module does not construct a transport or send a request. */
export const HTTPService:HttpClient=serviceInstance(resolveHTTP,['request','readEvents','resetUnauthorized','destroy']);
