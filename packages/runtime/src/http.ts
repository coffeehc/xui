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
