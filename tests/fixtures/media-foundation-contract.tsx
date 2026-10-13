import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Badge,Surface} from '@coffeehc/xui-react';
import {Avatar} from '@coffeehc/xui-react/avatar';
import {Image,Tag,Typography} from '@coffeehc/xui-react/display';
import '@coffeehc/xui-theme/style.css';

const sizes=['sm','default','lg'] as const;
const longName='完整头像名称与原样fallback<&>'.repeat(8)+' END-AVATAR';
const longMessage='长替代内容须可阅读LongUnbrokenLabel'.repeat(10)+' END-IMAGE';
const longTag='长标签LongUnbrokenIdentifier'.repeat(12)+' END-TAG';
const longMetadata='完整元数据由宿主文字入口呈现LongMetadata'.repeat(12)+' END-METADATA';
declare global {interface Window {setMediaAvatar(src:string):void;setMediaImages(src:string):void;mediaRemoveIntents:number}}
function App(){const [avatar,setAvatar]=React.useState('/media-avatar-missing.svg'),[source,setSource]=React.useState('/media-loading.svg');window.setMediaAvatar=setAvatar;window.setMediaImages=setSource;return <main className="xui-container xui-stack" aria-labelledby="media-title">
 <h1 id="media-title">Media foundation contract</h1>
 <section className="xui-stack" id="avatars"><h2>Avatar</h2>
  {sizes.map(size=><Avatar.Root key={size} size={size} role="img" aria-label={`Avatar ${size}`} data-testid={`avatar-${size}`}><Avatar.Image src={avatar} alt=""/><Avatar.Fallback aria-hidden="true">甲</Avatar.Fallback></Avatar.Root>)}
  <Avatar.Root role="img" aria-label={longName} data-testid="avatar-long"><Avatar.Fallback aria-hidden="true">{longName}</Avatar.Fallback></Avatar.Root>
 </section>
 <section className="xui-stack" id="images"><h2>Image</h2>
  <Image src={source} alt="Contain content" width={240} height={240} data-testid="image-contain"/>
  <Image src={source} alt="Cover content" width={240} height={240} fit="cover" data-testid="image-cover"/>
  <Image src={source} alt="Responsive content" aspectRatio={2} data-testid="image-ratio"/>
  <Image src={source} alt="" width={240} height={120} data-testid="image-decorative"/>
  <Image src="" alt="长替代图" width={240} height={120} fallback={longMessage} data-testid="image-long"/>
 </section>
 <Surface className="xui-stack" id="labels"><h2>Tag and Badge</h2>
  <button className="xui-button" type="button" id="before-tags">Before tags</button>
  <Tag label="被动标签" data-testid="tag-passive"/>
  <Tag label={longTag} removeLabel="Request removal" onRemove={()=>window.mediaRemoveIntents++} data-testid="tag-long"/>
  <Tag label="Disabled removal" disabled removeLabel="Disabled removal" onRemove={()=>window.mediaRemoveIntents++} data-testid="tag-disabled"/>
  <Badge data-testid="badge" aria-describedby="metadata-full"><span>Metadata</span><span>value</span></Badge>
  <Typography.Text as="p" id="metadata-full">{longMetadata}</Typography.Text>
  <button className="xui-button" type="button" id="after-tags">After tags</button>
 </Surface>
 </main>;}
window.mediaRemoveIntents=0;createRoot(document.getElementById('root')!).render(<App/>);
