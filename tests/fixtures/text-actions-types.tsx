import{Button,type ButtonProps}from'@coffeehc/xui-react/button';
import{Disclosure,DisclosureIndicator,type DisclosureProps}from'@coffeehc/xui-react/navigation';
const action:ButtonProps={variant:'text',disabled:true};const disclosure:Pick<DisclosureProps,'title'|'variant'>={title:'计划',variant:'text'};
const views=[<Button {...action} aria-expanded={false} aria-controls="tools">工具<DisclosureIndicator open={false}/></Button>,<Disclosure {...disclosure}>正文</Disclosure>];
// @ts-expect-error the text appearance is an explicit enum, not a private CSS value
const bad=<Disclosure title="计划" variant="transparent">正文</Disclosure>;
void[views,bad];
