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

import {getAuthService as resolveAuth} from './auth-access.js';
import type {AuthClient} from './auth-service.js';
import {serviceInstance} from './service-resolvers.js';
/** Shared authentication reference; all methods use the registered application's one auth owner. */
export const AuthService:AuthClient=serviceInstance(resolveAuth,['getState','subscribe','currentUser','refresh','login','logout','cancel','expire','destroy']);
