import * as React from 'react';
import {Typography,Tag,Copyable,Image,Separator,OverflowText,Icon,Card,type IconShape,type CardProps,type IconProps,type OverflowTextProps,type ImageProps} from '@coffeehc/xui-react/display';
import {Tabs} from '@coffeehc/xui-react/tabs';
import {Avatar,type AvatarRootProps} from '@coffeehc/xui-react/avatar';
import {Button,IconButton,type ButtonProps,type IconButtonProps} from '@coffeehc/xui-react/button';
import {InputGroup} from '@coffeehc/xui-react/forms';
import type {IconShape as RootIconShape} from '@coffeehc/xui-react';
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
const card=React.createRef<HTMLElement>();
export const overflow=<h3><OverflowText text="长标题" interactionRef={card} ref={React.createRef<HTMLSpanElement>()}/></h3>;
// @ts-expect-error OverflowText accepts safe text, not arbitrary interactive children.
const unsafeOverflow=<OverflowText text="x"><button>nested</button></OverflowText>;
// @ts-expect-error No HTML injection into the text part.
const unsafeMarkup:OverflowTextProps={text:'x',dangerouslySetInnerHTML:{__html:'x'}};

export const cardSlots=<Card title="资源" headingLevel={3} badge={{label:'公共'}} icon={<span/>} actions={<button>More</button>} description="摘要" footerMeta="时间" footerActions={<button>Open</button>}>正文</Card>;
export const presentationSlots=<>
 <Icon color="var(--action-primary)" blink data-testid="named-icon"/>
 <Icon variant="tile" shape="circle" color="var(--action-primary)"><svg aria-hidden="true"/></Icon>
 <Icon variant="tile" shape="square" color="var(--action-primary)"><svg aria-hidden="true"/></Icon>
 <Icon aria-label="Deployment status" color="var(--status-success-foreground)"/>
 <Tabs.Root defaultValue="overview">
  <Tabs.List layout="equal" aria-label="Sections" ref={React.createRef<HTMLDivElement>()}>
   <Tabs.Tab value="overview"><Tabs.Icon color="var(--action-primary)" blink/>Overview</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview">Overview panel</Tabs.Panel>
 </Tabs.Root>
 <Avatar.Root color="var(--action-primary)" style={state=>({opacity:state?0.8:1})} ref={React.createRef<HTMLSpanElement>()}>
  <Avatar.Fallback>Member</Avatar.Fallback>
 </Avatar.Root>
 <Avatar.Root shape="circle"><Avatar.Fallback>Circle</Avatar.Fallback></Avatar.Root>
 <Avatar.Root shape="square"><Avatar.Fallback>Square</Avatar.Fallback></Avatar.Root>
</>;
export const cardPresentation=<Card title="Resource" iconVariant="plain" iconColor="var(--status-info-foreground)" badge={{label:'Active',variant:'plain',color:'var(--action-primary)'}} footerVariant="plain" stretch/>;
export const iconShapes=<>
 <Card title="Circle icon" icon={<svg aria-hidden="true"/>} iconShape="circle"/>
 <Card title="Square icon" icon={<svg aria-hidden="true"/>} iconShape="square"/>
 <Button data-icon="true" aria-label="Circular icon action" shape="circle"><svg aria-hidden="true"/></Button>
 <IconButton aria-label="Square icon action" shape="square"><svg aria-hidden="true"/></IconButton>
 <InputGroup.Button data-icon="true" shape="square" aria-label="Square input action"><svg aria-hidden="true"/></InputGroup.Button>
</>;
const displayShape:IconShape='circle';
const rootShape:RootIconShape='square';
const validCardShape:CardProps={title:'Shape',iconShape:'circle'};
const validIconShape:IconProps={variant:'tile',shape:'square'};
const validButtonShape:ButtonProps={shape:'circle'};
const validIconButtonShape:IconButtonProps={'aria-label':'Shape',shape:'square'};
const validAvatarShape:AvatarRootProps={shape:'circle'};
const validInputGroupButtonShape=<InputGroup.Button data-icon="true" shape="square" aria-label="Square input action"/>;
// @ts-expect-error Icon shapes are a closed circle/square choice.
const invalidIconShape:IconShape='triangle';
// @ts-expect-error Icons reject shapes outside the public contract.
const invalidIconComponentShape:IconProps={shape:'triangle'};
// @ts-expect-error Cards reject shapes outside the public contract.
const invalidCardShape:CardProps={title:'Shape',iconShape:'triangle'};
// @ts-expect-error Buttons reject shapes outside the public contract.
const invalidButtonShape:ButtonProps={shape:'triangle'};
// @ts-expect-error IconButtons reject shapes outside the public contract.
const invalidIconButtonShape:IconButtonProps={'aria-label':'Shape',shape:'triangle'};
// @ts-expect-error Avatars reject shapes outside the public contract.
const invalidAvatarShape:AvatarRootProps={shape:'triangle'};
// @ts-expect-error InputGroup.Button uses the shared closed shape choice.
const invalidInputGroupButtonShape=<InputGroup.Button data-icon="true" shape="triangle" aria-label="Invalid input action"/>;
// @ts-expect-error The page-level heading belongs to PageHeader, not Card.
const cardPageHeading=<Card title="x" headingLevel={1}/>;
// @ts-expect-error Badges have a declared label/tone, not an arbitrary renderer.
const cardBadge=<Card title="x" badge={<span>公共</span>}/>;
// @ts-expect-error Icon color uses a CSS color value rather than an HTML color attribute.
const invalidIconColor=<Icon color={42}/>;
// @ts-expect-error blink is a boolean presentation option.
const invalidIconBlink=<Icon blink="yes"/>;
// @ts-expect-error Tabs.Icon is decorative; its tab text supplies the accessible name.
const namedTabsIcon=<Tabs.Icon aria-label="Overview"/>;
// @ts-expect-error Card icon variants are a closed public choice.
const invalidCardIcon=<Card title="x" iconVariant="rounded"/>;
// @ts-expect-error Card footer variants are a closed public choice.
const invalidCardFooter=<Card title="x" footerVariant="bordered"/>;
void [invalidIconColor,invalidIconBlink,namedTabsIcon,invalidCardIcon,invalidCardFooter,displayShape,rootShape,validCardShape,validIconShape,validButtonShape,validIconButtonShape,validAvatarShape,validInputGroupButtonShape,invalidIconShape,invalidIconComponentShape,invalidCardShape,invalidButtonShape,invalidIconButtonShape,invalidAvatarShape,invalidInputGroupButtonShape];
