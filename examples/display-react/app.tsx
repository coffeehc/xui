import * as React from 'react';
import {createRoot} from 'react-dom/client';
import '@coffeehc/xui-theme/style.css';
import {Typography,Copyable,Separator,Tag,Image} from '@coffeehc/xui-react/display';
import {Button} from '@coffeehc/xui-react/button';
function App(){
 const [tags,setTags]=React.useState([1,2]),[source,setSource]=React.useState('./display-image-a.svg'),[retry,setRetry]=React.useState(0),input=React.useRef<HTMLInputElement>(null);
 return <main className="xui-stack"><Typography.Heading level={1} visualRole="page">文字、复制与媒体</Typography.Heading><Typography.Text as="p">长中文与完整标识保留：这是一段供窄屏和放大阅读的说明文字。</Typography.Text><Typography.Link href="#details">查看详情</Typography.Link><Typography.Code value={'<script>仅按文本显示</script>'} block/><Copyable value="explicit-id-中文-0123456789" writeText={value=>{(window as any).copied=value;}}/><Copyable value="rejected-copy" writeText={()=>Promise.reject(Error('unavailable'))}/><Separator/><input ref={input} aria-label="标签输入" className="xui-input"/><div>{tags.map(id=><Tag key={id} label="重复长标签中文完整值" removeLabel={`移除标签 ${id}`} onRemove={()=>setTags(current=>current.filter(value=>value!==id))} onRemoveFocus={()=>input.current?.focus()}/>)}</div><Tag label="不可移除" disabled onRemove={()=>{}} removeLabel="禁用移除"/><Image src={source} alt="合成图片" aspectRatio={2} retryKey={retry}/><Button onClick={()=>setSource(current=>current==='./display-image-a.svg'?'./display-image-b.svg':'./display-image-a.svg')}>更换图片</Button><Button onClick={()=>setRetry(value=>value+1)}>重试图片</Button><section id="details"><Typography.Heading level={2}>详情</Typography.Heading></section></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
