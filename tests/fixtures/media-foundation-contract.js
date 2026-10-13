import {createAvatar} from '@coffeehc/xui-runtime/widgets-dom';
import {createImage,createTag,createTypographyText} from '@coffeehc/xui-runtime/display-dom';
import '@coffeehc/xui-theme/style.css';

const main=document.createElement('main');main.className='xui-container xui-stack';main.setAttribute('aria-labelledby','media-title');
main.innerHTML='<h1 id="media-title">Media foundation contract</h1><section class="xui-stack" id="avatars"><h2>Avatar</h2></section><section class="xui-stack" id="images"><h2>Image</h2></section><section class="xui-stack" id="labels"><h2>Tag and Badge</h2><button class="xui-button" type="button" id="before-tags">Before tags</button></section>';
document.getElementById('root').append(main);
const longName='完整头像名称与原样fallback<&>'.repeat(8)+' END-AVATAR',longMessage='长替代内容须可阅读LongUnbrokenLabel'.repeat(10)+' END-IMAGE',longTag='长标签LongUnbrokenIdentifier'.repeat(12)+' END-TAG',longMetadata='完整元数据由宿主文字入口呈现LongMetadata'.repeat(12)+' END-METADATA';
const avatarOwners=[];for(const size of ['sm','default','lg']){const node=document.createElement('span');node.dataset.testid=`avatar-${size}`;main.querySelector('#avatars').append(node);avatarOwners.push(createAvatar(node,{name:`Avatar ${size}`,src:'/media-avatar-missing.svg',fallback:'甲',size}));}
const longAvatar=document.createElement('span');longAvatar.dataset.testid='avatar-long';main.querySelector('#avatars').append(longAvatar);createAvatar(longAvatar,{name:longName,fallback:longName});
window.setMediaAvatar=src=>avatarOwners.forEach(owner=>owner.update({src}));
const imageOwners=[];for(const [id,options]of [['contain',{alt:'Contain content',width:240,height:240}],['cover',{alt:'Cover content',width:240,height:240,fit:'cover'}],['ratio',{alt:'Responsive content',aspectRatio:2}],['decorative',{alt:'',width:240,height:120}]]){const initial={...options,src:'/media-loading.svg'},owner=createImage(document,initial);owner.element.dataset.testid=`image-${id}`;main.querySelector('#images').append(owner.element);imageOwners.push({owner,initial});}
const longImage=createImage(document,{src:'',alt:'长替代图',width:240,height:120,fallback:longMessage});longImage.element.dataset.testid='image-long';main.querySelector('#images').append(longImage.element);
window.setMediaImages=src=>imageOwners.forEach(({owner,initial})=>owner.update({...initial,src}));
window.mediaRemoveIntents=0;const labels=main.querySelector('#labels');for(const [id,options]of [['passive',{label:'被动标签'}],['long',{label:longTag,removeLabel:'Request removal',onRemove:()=>window.mediaRemoveIntents++}],['disabled',{label:'Disabled removal',disabled:true,removeLabel:'Disabled removal',onRemove:()=>window.mediaRemoveIntents++}]]){const owner=createTag(document,options);owner.element.dataset.testid=`tag-${id}`;labels.append(owner.element);}
const badge=document.createElement('span');badge.className='xui-badge';badge.dataset.testid='badge';badge.setAttribute('aria-describedby','metadata-full');for(const text of ['Metadata','value']){const node=document.createElement('span');node.textContent=text;badge.append(node);}labels.append(badge);
const full=createTypographyText(document,{as:'p',text:longMetadata});full.id='metadata-full';labels.append(full);const after=document.createElement('button');after.className='xui-button';after.type='button';after.id='after-tags';after.textContent='After tags';labels.append(after);
