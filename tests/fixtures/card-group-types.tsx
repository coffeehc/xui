import {CardGroup,type CardGroupProps,type CardGroupContext,type CardGroupCardProps,type CollectionCursorPagination} from '@coffeehc/xui-react/card-group';
import {CardGroup as RootGroup} from '@coffeehc/xui-react';
import {getCollectionState,validateCollectionKeys,type CollectionViewOptions} from '@coffeehc/xui-runtime/collection-view';
import {Button} from '@coffeehc/xui-react/button';
type Row={id:string;name:string};
const rows:Row[]=[{id:'one',name:'一'}];
const template=(row:Row,context:CardGroupContext):CardGroupCardProps=>({title:row.name,footerActions:<Button disabled={context.disabled}>{context.rowKey}</Button>});
const page:CollectionCursorPagination={mode:'cursor',pageSize:20,total:null,nextCursor:null,hasPrevious:false};
const props:CardGroupProps<Row>={label:'记录',rows,rowKey:row=>row.id,renderCard:template,pagination:page};
export const example=<CardGroup {...props}/>;export const root=<RootGroup {...props}/>;
const view:CollectionViewOptions={label:'记录',status:'refreshing'};getCollectionState(view,rows.length);validateCollectionKeys(rows,row=>row.id);
// @ts-expect-error templates return Card props, not replacement JSX
const jsx:CardGroupProps<Row>={...props,renderCard:row=><div>{row.name}</div>};
// @ts-expect-error current record is strongly typed
const wrong:CardGroupProps<Row>={...props,renderCard:(row:{other:number})=>({title:String(row.other)})};
// @ts-expect-error no query/fetch owner on a view
const query:CardGroupProps<Row>={...props,loader:async()=>rows};
void [jsx,wrong,query];
