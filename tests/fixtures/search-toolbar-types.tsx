import * as React from 'react';
import {SearchToolbar,type SearchToolbarProps} from '@coffeehc/xui-react/search-toolbar';
import {SearchToolbar as RootSearchToolbar} from '@coffeehc/xui-react';
import {Input} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
const props:SearchToolbarProps={search:<Input aria-label="Search"/>,actions:<Button>Go</Button>,advanced:<Input aria-label="Filter"/>,expanded:false,onExpandedChange:(value:boolean)=>void value,ref:React.createRef<HTMLDivElement>()};
const toolbar=<><SearchToolbar {...props}/><RootSearchToolbar defaultExpanded advancedLabel="高级" /></>;
// @ts-expect-error Only named slots are accepted.
const children=<SearchToolbar><Input/></SearchToolbar>;
// @ts-expect-error Query state remains host owned.
const query=<SearchToolbar query="name"/>;
void [toolbar,children,query];
