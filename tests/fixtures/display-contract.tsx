import * as React from 'react';
import {Typography,Tag,Copyable,Image,Separator,type ImageProps} from '@coffeehc/xui-react/display';
import {createImage,createTag,createCopyable} from '@coffeehc/xui-runtime/display-dom';
export const valid=<><Typography.Heading level={3} visualRole="section">Title</Typography.Heading><Typography.Text as="p" ref={React.createRef<HTMLParagraphElement>()}>Text</Typography.Text><Typography.Link href="/next" target="_blank" download>Native link</Typography.Link><Typography.Code value="<script>safe</script>" block/><Separator decorative/><Tag label="Passive"/><Tag label="Active" removeLabel="Remove active" onRemove={()=>{}} onRemoveFocus={button=>button.blur()}/><Image src="a.png" alt="" aspectRatio={2}/><Copyable value="explicit" writeText={async value=>{void value;}}/></>;
// @ts-expect-error Heading level is explicit.
const noLevel=<Typography.Heading>Missing</Typography.Heading>;
// @ts-expect-error Code is safe text, not an HTML or children renderer.
const code=<Typography.Code><b>no</b></Typography.Code>;
// @ts-expect-error Every removable tag has an accessible name.
const tag=<Tag label="x" onRemove={()=>{}}/>;
// @ts-expect-error Image alt must be explicitly provided, even when empty.
const image=<Image src="x" aspectRatio={2}/>;
// @ts-expect-error Image reserves explicit geometry.
const noSize=<Image src="x" alt="x"/>;
// @ts-expect-error Choose a ratio or dimensions, not conflicting geometry.
const conflict:ImageProps={src:'x',alt:'x',width:30,height:20,aspectRatio:2};
createImage(document,{src:'x',alt:'',width:30,height:20}).destroy();
createTag(document,{label:'x',onRemove(){},removeLabel:'Remove x'}).destroy();
createCopyable(document,{value:'x'}).destroy();
// @ts-expect-error Native matches required alt.
createImage(document,{src:'x',aspectRatio:2});
// @ts-expect-error Native matches remove label.
createTag(document,{label:'x',onRemove(){}});
