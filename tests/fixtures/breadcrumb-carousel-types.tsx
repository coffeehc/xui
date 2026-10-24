import * as React from 'react';
import {Breadcrumbs,type BreadcrumbItem} from '@coffeehc/xui-react/navigation';
import {Carousel} from '@coffeehc/xui-react/carousel';
import {createCarouselController} from '@coffeehc/xui-runtime/carousel';
const items:BreadcrumbItem[]=[{id:'home',label:'首页',href:'/home'},{id:'current',label:'详情'}];
<Breadcrumbs items={items} maxItems={3} aria-label="当前位置"/>;
<Breadcrumbs><Breadcrumbs.Item><Breadcrumbs.Link href="/home">首页</Breadcrumbs.Link></Breadcrumbs.Item><Breadcrumbs.Item><Breadcrumbs.Separator/><Breadcrumbs.Current>详情</Breadcrumbs.Current></Breadcrumbs.Item></Breadcrumbs>;
// @ts-expect-error the two list owners are mutually exclusive
<Breadcrumbs items={items}>duplicate</Breadcrumbs>;
const rows=[{id:'a',name:'资源'}],controller=createCarouselController({ids:['a']});
<Carousel label="精选资源" items={rows} itemKey={row=>row.id} renderItem={(row,context)=><button disabled={context.disabled}>{row.name}</button>} controller={controller}/>;
<Carousel label="精选资源" items={rows} itemKey={row=>row.id} renderItem={row=>row.name} defaultValue="a" loop controls={<Carousel.Controls><Carousel.PlayPause/><Carousel.Previous/><Carousel.Indicators/><Carousel.Next/></Carousel.Controls>}/>;
// @ts-expect-error an injected model owns value and initialization
<Carousel label="资源" items={rows} itemKey={row=>row.id} renderItem={row=>row.name} controller={controller} value="a"/>;
// @ts-expect-error item types remain authoritative in the renderer
<Carousel label="资源" items={rows} itemKey={row=>row.id} renderItem={row=>row.missing}/>;
