import * as React from 'react';import{Tabs,type TabsLabelProps,type TabsListProps}from'@coffeehc/xui-react/tabs';
const variant:TabsListProps['variant']='line';
<Tabs.Root defaultValue="one"><Tabs.List variant={variant} layout="equal" ref={React.createRef<HTMLDivElement>()}><Tabs.Tab value="one">One</Tabs.Tab></Tabs.List><Tabs.Panel value="one" keepMounted>Content</Tabs.Panel></Tabs.Root>;
// @ts-expect-error Only the two supported semantic visual variants are public.
<Tabs.List variant="flat"/>;

const label:TabsLabelProps={text:'长中文名称',ref:React.createRef<HTMLSpanElement>()};
<Tabs.Tab value="composed"><Tabs.Icon>◇</Tabs.Icon><Tabs.Label {...label}/><span>3</span></Tabs.Tab>;
// @ts-expect-error Labels accept plain text, not nested interactive content.
<Tabs.Label text={<button>Action</button>}/>;
// @ts-expect-error The containing Tab owns the interaction surface.
<Tabs.Label text="Name" interactionRef={React.createRef<HTMLDivElement>()}/>;
