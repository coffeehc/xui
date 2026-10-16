import type {HttpClient, HttpRequestOptions, HttpResponse} from './http.js';

/** Multipart options retain the application's response/error contracts and auth owner.
 * The service always POSTs once; Content-Type/boundary belongs to the platform. */
export type UploadRequestOptions<T = unknown> = Omit<HttpRequestOptions<T>, 'method' | 'body' | 'json' | 'retry'> & {
  /** Multipart file field, default "file". */
  fieldName?: string;
  /** Explicit multipart metadata; never inferred from filenames or responses. */
  fields?: Readonly<Record<string, string | Blob>>;
};

/** Stateless application service. Queues, selection and component lifetime belong to UploadController. */
export interface UploadService {
  /** POST one file, default budget 120000ms. Resolves only after the shared HTTP response is validated.
   * Rejection/abort does not prove the server rolled back. No automatic write replay or fake progress. */
  request<T = unknown>(path: string, file: File, options?: UploadRequestOptions<T>): Promise<HttpResponse<T>>;
}

/** Package-private construction: registry supplies its existing HTTP/auth transport. */
export function buildUploadService(http: HttpClient): UploadService {
  return Object.freeze({
    request<T>(path: string, file: File, options: UploadRequestOptions<T> = {}) {
      const {fieldName = 'file', fields, ...request} = options;
      if (!fieldName.trim() || /[\r\n\0]/.test(fieldName)) throw new TypeError('Invalid upload field name');
      if (!file || typeof file.name !== 'string' || typeof file.size !== 'number' || typeof file.arrayBuffer !== 'function') throw new TypeError('Upload requires a File');
      // Reject JS callers trying to override the write contract, just as the types do.
      for (const key of ['method', 'body', 'json', 'retry']) if (Object.hasOwn(request, key)) throw new TypeError(`Upload cannot override ${key}`);
      const body = new FormData();
      for (const [key, value] of Object.entries(fields ?? {})) {
        if (!key || key === fieldName || /[\r\n\0]/.test(key) || !(typeof value === 'string' || value instanceof Blob)) throw new TypeError('Invalid upload metadata');
        body.append(key, value);
      }
      body.append(fieldName, file, file.name);
      return http.request<T>(path, {...request, method: 'POST', body, timeoutMs: request.timeoutMs ?? 120000});
    },
  });
}
