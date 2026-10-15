import * as React from 'react';
import {createRoot} from 'react-dom/client';
import '@coffeehc/xui-theme/style.css';
import {Typography,Copyable,Separator,Tag,Image,OverflowText,Card} from '@coffeehc/xui-react/display';
import {Button} from '@coffeehc/xui-react/button';
import {Input} from '@coffeehc/xui-react/forms';
import {Surface,Badge} from '@coffeehc/xui-react/feedback';
function SeparatorSample(){return <Surface aria-label="Separator contract" className="xui-stack"><Typography.Text>分隔线与区域边框使用独立线宽。</Typography.Text><Separator aria-label="Horizontal separator"/><div className="xui-toolbar"><Typography.Text>左侧</Typography.Text><Separator orientation="vertical" aria-label="Vertical separator"/><Typography.Text>右侧</Typography.Text></div></Surface>;}
function FoundationSample(){return <Surface aria-label="Display foundation" className="xui-stack">{(['default','muted','error','success'] as const).map(tone=><Typography.Text key={tone} tone={tone}>{tone}: 完整可读的基础文字</Typography.Text>)}<Input aria-label="Surface first input"/><Typography.Link href="#details">Surface middle link</Typography.Link><Button>Surface last action</Button></Surface>;}
function App(){
 const [tags,setTags]=React.useState([1,2]),[source,setSource]=React.useState('./display-image-a.svg'),[retry,setRetry]=React.useState(0),input=React.useRef<HTMLInputElement>(null);
 return <main className="xui-stack"><Typography.Heading level={1} visualRole="page">文字、复制与媒体</Typography.Heading><Typography.Text as="p">长中文与完整标识保留：这是一段供窄屏和放大阅读的说明文字。</Typography.Text><Typography.Link href="#details">查看详情</Typography.Link><Typography.Code value={'<script>仅按文本显示</script>'} block/><Copyable value="explicit-id-中文-0123456789" writeText={value=>{(window as any).copied=value;}}/><Copyable value="rejected-copy" writeText={()=>Promise.reject(Error('unavailable'))}/><Separator/><input ref={input} aria-label="标签输入" className="xui-input"/><div>{tags.map(id=><Tag key={id} label="重复长标签中文完整值" removeLabel={`移除标签 ${id}`} onRemove={()=>setTags(current=>current.filter(value=>value!==id))} onRemoveFocus={()=>input.current?.focus()}/>)}</div><Tag label="不可移除" disabled onRemove={()=>{}} removeLabel="禁用移除"/><Image src={source} alt="合成图片" aspectRatio={2} retryKey={retry}/><Button onClick={()=>setSource(current=>current==='./display-image-a.svg'?'./display-image-b.svg':'./display-image-a.svg')}>更换图片</Button><Button onClick={()=>setRetry(value=>value+1)}>重试图片</Button><section id="details"><Typography.Heading level={2}>详情</Typography.Heading></section></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode>{new URLSearchParams(location.search).has('card')?<CardSample/>:new URLSearchParams(location.search).has('overflow')?<OverflowSample/>:<><App/><SeparatorSample/><FoundationSample/></>}</React.StrictMode>);

function OverflowSample(){
 const card=React.useRef<HTMLElement>(null),[title,setTitle]=React.useState('很长的中文资源卡片名称：公开组件让名称独立滚动，归属标签和操作保持原位'),[mounted,setMounted]=React.useState(true),[withTarget,setTarget]=React.useState(true);
 Object.assign(window,{overflowDemo:{setTitle,setMounted,setTarget}});
 return <Surface ref={card} aria-label="资源卡片" className="xui-stack"><div className="xui-toolbar" style={{flexWrap:'nowrap',alignItems:'flex-start'}}><span aria-hidden="true">◇</span><h3 style={{flex:'1',minWidth:0,margin:0}}>{mounted&&<OverflowText text={title} interactionRef={withTarget?card:undefined}/>}</h3><Badge tone="neutral" style={{flex:'none'}}>公共</Badge></div><Typography.Text as="p" tone="muted">资源摘要留在正文，标题滚动不会移动这段内容。</Typography.Text><Input aria-label="卡片草稿"/><div className="xui-toolbar"><Typography.Text tone="muted">更新于 10/15</Typography.Text><Button variant="ghost">查看资源</Button></div></Surface>;
}

function CardSample(){
 const [title,setTitle]=React.useState('标准资源卡片：标题滚动与归属标签分离，正文和操作按公共槽位排列'),[empty,setEmpty]=React.useState(false),[badge,setBadge]=React.useState(true),[level,setLevel]=React.useState<2|3|4|5|6>(3),[calls,setCalls]=React.useState(0);
 Object.assign(window,{cardDemo:{setTitle,setEmpty,setBadge,setLevel,getCalls:()=>calls}});
 return <Card aria-label="标准资源卡片" title={title} headingLevel={level} icon={<span>◇</span>} badge={badge?{label:'公共'}:undefined} actions={empty?null:<Button variant="ghost" size="xs" onClick={()=>setCalls(n=>n+1)}>更多</Button>} description={empty?undefined:'这段摘要使用公共次要文字，避免把归属标签和操作混入正文。'} footerMeta={empty?null:'更新于 10/15'} footerActions={empty?null:<Button variant="ghost" size="xs" onClick={()=>setCalls(n=>n+1)}>查看资源</Button>}>{empty?<></>:<Input aria-label="卡片业务草稿"/>}</Card>;
}
