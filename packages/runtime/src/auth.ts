/** Public authentication contracts and presentation helpers. Obtain the app owner from services.ts. */
export {
  authEndpoints,
  authErrorCodes,
  parseAuthSession,
  resolveLoginReturnTo,
  loginPageDefaultLabels,
  resolveLoginPageConfig,
  getLoginPageError,
  runLoginPageExtension,
} from './auth-service.js';
export type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  AuthRequestOptions,
  AuthState,
  AuthClientOptions,
  AuthClient,
  LoginPageLabels,
  LoginPageLayout,
  LoginPageConfig,
  AuthPageConfig,
  LoginExtensionContext,
  LoginPageAction,
  LoginPageExtensions,
} from './auth-service.js';
export {getAuthService} from './auth-access.js';
