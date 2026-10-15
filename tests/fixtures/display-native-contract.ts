import {createTypographyHeading,createTypographyText,createTypographyLink,createTypographyCode,createSeparator,createImage,createTag,createCopyable,createOverflowText,createCard,type CardOptions,type CardController,type OverflowTextOptions,type OverflowTextController} from '@coffeehc/xui-runtime/display-dom';
import {createCopyController,type ImageSize} from '@coffeehc/xui-runtime/display';
const dimensions:ImageSize={aspectRatio:2};
createTypographyHeading(document,{level:2,text:'Heading'});createTypographyText(document,{text:'Safe',as:'p'});createTypographyLink(document,{text:'Native',href:'/next',download:'file'});createTypographyCode(document,{value:'<text>',block:true});createSeparator(document,{decorative:true});
const image=createImage(document,{...dimensions,src:'a',alt:''});image.update({src:'b',alt:'Image',width:40,height:30});image.destroy();
createTag(document,{label:'Tag',onRemove(){},removeLabel:'Remove tag'}).destroy();createCopyable(document,{value:'x',writeText:async value=>{void value;}}).destroy();createCopyController({value:'x'}).destroy();
// @ts-expect-error No implicit alt.
createImage(document,{src:'a',aspectRatio:2});
// @ts-expect-error No implicit dimensions.
createImage(document,{src:'a',alt:''});
// @ts-expect-error No unnamed remove action.
createTag(document,{label:'Tag',onRemove(){}});

const overflowOptions:OverflowTextOptions={text:'长标题',interactionTarget:document.createElement('section')};
const overflow:OverflowTextController=createOverflowText(document,overflowOptions);overflow.update({text:'更新标题'});overflow.destroy();
// @ts-expect-error Native safe text is required.
createOverflowText(document,{children:'x'});

const contentCard:CardController=createCard(document,{title:'资源',badge:{label:'公共'},content:document.createElement('input')});contentCard.update({title:'更新',footerMeta:'时间'});contentCard.destroy();
// @ts-expect-error Native heading contracts match React.
const cardHeading:CardOptions={title:'x',headingLevel:1};
