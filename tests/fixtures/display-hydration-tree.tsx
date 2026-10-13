import * as React from 'react';
import {Typography,Copyable,Tag,Image,Separator} from '@coffeehc/xui-react/display';
export function DisplayHydrationTree(){return <section><Typography.Heading level={2}>Hydrated display</Typography.Heading><Typography.Text>Safe text</Typography.Text><Typography.Link href="#native">Native</Typography.Link><Typography.Code value="<safe>"/><Copyable value="hydrate-value" writeText={()=>{}}/><Separator/><Tag label="Passive"/><Image src="" alt="Synthetic image" aspectRatio={2}/></section>;}
