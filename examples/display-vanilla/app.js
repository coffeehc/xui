import '@coffeehc/xui-theme/style.css';
import {createTypographyHeading,createTypographyText,createTypographyLink,createTypographyCode,createSeparator,createTag,createCopyable,createImage,createOverflowText} from '@coffeehc/xui-runtime/display-dom';
if(new URLSearchParams(location.search).has('overflow'))renderOverflow();else renderDisplay();
function renderDisplay(){

const root=document.getElementById('root'),main=document.createElement('main');main.className='xui-stack';root.append(main);
main.append(createTypographyHeading(document,{level:1,visualRole:'page',text:'文字、复制与媒体'}),createTypographyText(document,{as:'p',text:'长中文与完整标识保留：这是一段供窄屏和放大阅读的说明文字。'}),createTypographyLink(document,{text:'查看详情',href:'#details'}),createTypographyCode(document,{value:'<script>仅按文本显示</script>',block:true}));
const copy=createCopyable(document,{value:'explicit-id-中文-0123456789',writeText:value=>{window.copied=value;}}),failure=createCopyable(document,{value:'rejected-copy',writeText:()=>Promise.reject(Error('unavailable'))});main.append(copy.element,failure.element,createSeparator(document));
const input=document.createElement('input');input.className='xui-input';input.setAttribute('aria-label','标签输入');main.append(input);const tags=[1,2].map(id=>{let owner=createTag(document,{label:'重复长标签中文完整值',removeLabel:`移除标签 ${id}`,onRemove:()=>owner.destroy(),onRemoveFocus:()=>input.focus()});main.append(owner.element);return owner;});
const disabled=createTag(document,{label:'不可移除',disabled:true,onRemove(){},removeLabel:'禁用移除'});main.append(disabled.element);
let options={src:'./display-image-a.svg',alt:'合成图片',aspectRatio:2,retryKey:0};const image=createImage(document,options);main.append(image.element);
for(const [text,run] of [['更换图片',()=>{options={...options,src:options.src==='./display-image-a.svg'?'./display-image-b.svg':'./display-image-a.svg'};image.update(options);}],['重试图片',()=>{options={...options,retryKey:options.retryKey+1};image.update(options);} ]]){const button=document.createElement('button');button.type='button';button.className='xui-button';button.textContent=text;button.addEventListener('click',run);main.append(button);}
const details=document.createElement('section');details.id='details';details.append(createTypographyHeading(document,{level:2,text:'详情'}));main.append(details);
const separatorSample=document.createElement('section');separatorSample.className='xui-surface xui-stack';separatorSample.setAttribute('aria-label','Separator contract');
const horizontal=createSeparator(document),vertical=createSeparator(document,{orientation:'vertical'}),separatorRow=document.createElement('div');
horizontal.setAttribute('aria-label','Horizontal separator');vertical.setAttribute('aria-label','Vertical separator');separatorRow.className='xui-toolbar';
separatorRow.append(createTypographyText(document,{text:'左侧'}),vertical,createTypographyText(document,{text:'右侧'}));
separatorSample.append(createTypographyText(document,{text:'分隔线与区域边框使用独立线宽。'}),horizontal,separatorRow);root.append(separatorSample);
window.addEventListener('pagehide',()=>{copy.destroy();failure.destroy();tags.forEach(tag=>tag.destroy());disabled.destroy();image.destroy();},{once:true});

const foundationSample=document.createElement('section');foundationSample.className='xui-surface xui-stack';foundationSample.setAttribute('aria-label','Display foundation');
for(const tone of ['default','muted','error','success'])foundationSample.append(createTypographyText(document,{text:`${tone}: 完整可读的基础文字`,tone}));
const firstInput=document.createElement('input');firstInput.className='xui-input';firstInput.setAttribute('aria-label','Surface first input');
const lastAction=document.createElement('button');lastAction.type='button';lastAction.className='xui-button';lastAction.textContent='Surface last action';
foundationSample.append(firstInput,createTypographyLink(document,{text:'Surface middle link',href:'#details'}),lastAction);root.append(foundationSample);

}

function renderOverflow(){
 const card=document.createElement('section'),header=document.createElement('div'),icon=document.createElement('span'),title=document.createElement('h3'),badge=document.createElement('span'),summary=document.createElement('p'),draft=document.createElement('input'),footer=document.createElement('div'),fact=document.createElement('span'),button=document.createElement('button');
 card.className='xui-surface xui-stack';card.setAttribute('aria-label','资源卡片');header.className='xui-toolbar';header.style.flexWrap='nowrap';header.style.alignItems='flex-start';icon.setAttribute('aria-hidden','true');icon.textContent='◇';Object.assign(title.style,{flex:'1',minWidth:'0',margin:'0'});badge.className='xui-badge';badge.dataset.tone='neutral';badge.style.flex='none';badge.textContent='公共';summary.className='xui-text';summary.dataset.tone='muted';summary.textContent='资源摘要留在正文，标题滚动不会移动这段内容。';draft.className='xui-input';draft.setAttribute('aria-label','卡片草稿');footer.className='xui-toolbar';fact.className='xui-text';fact.dataset.tone='muted';fact.textContent='更新于 10/15';button.className='xui-button';button.dataset.variant='ghost';button.type='button';button.textContent='查看资源';header.append(icon,title,badge);footer.append(fact,button);card.append(header,summary,draft,footer);document.getElementById('root').append(card);
 let text='很长的中文资源卡片名称：公开组件让名称独立滚动，归属标签和操作保持原位',withTarget=true,owner;
 const options=()=>({text,interactionTarget:withTarget?card:undefined}),mount=()=>{owner=createOverflowText(document,options());title.append(owner.element);owner.update(options());};mount();
 window.overflowDemo={setTitle(value){text=value;owner?.update(options());},setTarget(value){withTarget=value;owner?.update(options());},setMounted(value){if(value&&!owner)mount();else if(!value&&owner){owner.destroy();owner=undefined;}}};window.addEventListener('pagehide',()=>owner?.destroy(),{once:true});
}
