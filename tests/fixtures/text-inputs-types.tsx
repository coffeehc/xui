import {NumberInput,PasswordInput,SearchInput} from '@coffeehc/xui-react/text-inputs';
<NumberInput value={null} onValueChange={()=>{}} step={0.5}/>;
<PasswordInput value="" onValueChange={()=>{}} autoComplete="current-password"/>;
<SearchInput value="" onValueChange={()=>{}} onSubmit={()=>{}}/>;
// @ts-expect-error exact monetary strings must use Input and a domain parser
<NumberInput value="1.23" onValueChange={()=>{}}/>;
// @ts-expect-error no uncontrolled secret storage
<PasswordInput defaultValue="secret" onValueChange={()=>{}}/>;
// @ts-expect-error no fetch owner
<SearchInput value="" onValueChange={()=>{}} fetch={()=>{}}/>;
