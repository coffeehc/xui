import {AuthService,type PasswordChangeCredentials} from '@coffeehc/xui-runtime/auth';
import {createPasswordChangeController} from '@coffeehc/xui-runtime/password';
import {PasswordChangeForm} from '@coffeehc/xui-react/password';
const input:PasswordChangeCredentials={current_password:'synthetic-old',new_password:'synthetic-new'};
void AuthService.changePassword(input,{signal:new AbortController().signal});
const controller=createPasswordChangeController({auth:AuthService});
export const owned=<PasswordChangeForm auth={AuthService}/>;
export const injected=<PasswordChangeForm controller={controller} active={false}/>;
// @ts-expect-error an injected controller owns the auth dependency
export const invalid=<PasswordChangeForm controller={controller} auth={AuthService}/>;
// @ts-expect-error wire names are exact, no currentPassword alias
void AuthService.changePassword({currentPassword:'synthetic',newPassword:'synthetic'});
