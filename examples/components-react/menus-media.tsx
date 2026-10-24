import * as React from 'react';
import {Button} from '@coffeehc/xui-react/button';
import {Card,Typography,Icon,Tag,Copyable,Image,Separator} from '@coffeehc/xui-react/display';
import {Stack,Grid,Section,Toolbar} from '@coffeehc/xui-react/layout';
import {Badge,Spinner,Skeleton} from '@coffeehc/xui-react/feedback';
import {Menu} from '@coffeehc/xui-react/menu';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import {NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {Avatar} from '@coffeehc/xui-react/avatar';
import {ScrollArea} from '@coffeehc/xui-react/scroll-area';
import {Toast} from '@coffeehc/xui-react/toast';
import {createCopyController} from '@coffeehc/xui-runtime/display';

export function Menus(){
 const toast=Toast.useToastManager(),[checked,setChecked]=React.useState(true),[menuRecovered,setMenuRecovered]=React.useState(false);
 const action=(name:string)=>toast.add({description:'已执行示例：'+name,type:'info'});
 return <Stack>
  <Section title="菜单常用组合"><Toolbar>
   <Menu.Root><Menu.Trigger render={<Button variant="outline"/>}>文件操作菜单</Menu.Trigger><Menu.Content><Menu.Item onClick={()=>action('查看')}>查看详情</Menu.Item><Menu.Item onClick={()=>action('编辑')}>编辑</Menu.Item><Menu.Item disabled>无权限操作</Menu.Item><Menu.Separator/><Menu.CheckboxItem checked={checked} onCheckedChange={setChecked}>显示已归档</Menu.CheckboxItem><Menu.Separator/><Menu.RadioGroup defaultValue="compact"><Menu.RadioItem value="compact">紧凑视图</Menu.RadioItem><Menu.RadioItem value="comfortable">舒适视图</Menu.RadioItem></Menu.RadioGroup><Menu.Separator/><Menu.Item tone="danger" onClick={()=>action('请求删除确认')}>删除</Menu.Item></Menu.Content></Menu.Root>
   <Menu.View trigger={<Button variant="outline">配置菜单</Button>} config={{items:[{kind:'item',id:'open',label:'打开工作区',actionId:'workspace.open',icon:'folder'},{kind:'item',id:'readonly',label:'编辑（受限）',actionId:'workspace.edit',disabled:true},{kind:'separator',id:'divider'},{kind:'item',id:'remove',label:'删除工作区',actionId:'workspace.remove',tone:'danger'}]}} onAction={event=>action(event.item.id)}/>
   <Menu.Root><Menu.Trigger render={<Button variant="outline" disabled/>}>禁用菜单触发器</Menu.Trigger><Menu.Content><Menu.Item>不可用</Menu.Item></Menu.Content></Menu.Root>
  </Toolbar></Section>
  <Section title="菜单内容状态"><Toolbar>
   <Menu.Root><Menu.Trigger render={<Button variant="outline"/>}>菜单加载中</Menu.Trigger><Menu.Content><Menu.Item disabled><Spinner/>正在读取操作</Menu.Item></Menu.Content></Menu.Root>
   <Menu.Root><Menu.Trigger render={<Button variant="outline"/>}>菜单读取失败</Menu.Trigger><Menu.Content>{menuRecovered?<Menu.Item onClick={()=>action('查看恢复后的工作区')}>查看工作区</Menu.Item>:<><Menu.Item disabled>暂时无法读取操作</Menu.Item><Menu.Item onClick={()=>setMenuRecovered(true)}>重试读取</Menu.Item></>}</Menu.Content></Menu.Root>
   <Menu.Root><Menu.Trigger render={<Button variant="outline"/>}>只读权限菜单</Menu.Trigger><Menu.Content><Menu.Item onClick={()=>action('查看只读详情')}>查看详情</Menu.Item><Menu.Item disabled>编辑</Menu.Item><Menu.Item disabled tone="danger">删除</Menu.Item></Menu.Content></Menu.Root>
  </Toolbar></Section>
  <Section title="右键与键盘菜单"><ContextMenu.Root><ContextMenu.Trigger render={<Button variant="outline"/>}>右键或 Shift+F10 打开菜单</ContextMenu.Trigger><ContextMenu.Content><ContextMenu.Item onClick={()=>action('打开资源')}>打开资源</ContextMenu.Item><ContextMenu.Item disabled>修改（无权限）</ContextMenu.Item><ContextMenu.Separator/><ContextMenu.Item tone="danger" onClick={()=>action('请求移除确认')}>移除资源</ContextMenu.Item></ContextMenu.Content></ContextMenu.Root></Section>
  <Section title="导航状态"><NavigationMenu label="组件导航示例" showCollapseToggle={false} activeId="tasks" defaultExpandedIds={['team']} expandBranchLabel={item=>'展开 '+item.label} collapseBranchLabel={item=>'收起 '+item.label} items={[{id:'tasks',label:'当前任务',href:'?demo=tasks',icon:'document'},{id:'team',label:'跨区域研发与运营协作团队的完整中文名称',children:[{id:'member',label:'团队成员',href:'?demo=member'}]},{id:'disabled',label:'受限工作区',href:'?demo=locked',disabled:true}]} navigation={{navigate:request=>{action(request.id);}}}/></Section>
  <Typography.Text tone="muted">菜单没有只读属性；只读权限通过保留查看动作、禁用修改动作组合。</Typography.Text>
 </Stack>;
}

const illustration='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="#e9e3ff"/><path d="M80 140 150 65l65 65 45-45 60 55" stroke="#7044cf" stroke-width="6" fill="none"/></svg>');
function CopyExample({phase}:{phase:'normal'|'disabled'|'loading'|'error'}){
 const release=React.useRef<()=>void>(()=>{});
 const [owner]=React.useState(()=>createCopyController({value:'demo-workspace-001',disabled:phase==='disabled',writeText:()=>phase==='loading'?new Promise<void>(resolve=>{release.current=resolve;}):phase==='error'?Promise.reject(new Error('Synthetic copy failure')):Promise.resolve()}));
 React.useEffect(()=>{if(phase==='loading'||phase==='error')void owner.copy();return()=>{owner.destroy();release.current();};},[owner,phase]);
 return <Stack><Copyable controller={owner} labels={{error:'复制失败，请重试'}}/>{phase==='loading'&&<Button variant="outline" onClick={()=>release.current()}>完成示例复制</Button>}</Stack>;
}
export function Media(){
 const [tags,setTags]=React.useState(['研发','运营']),[imageRecovered,setImageRecovered]=React.useState(false);
 return <Stack>
  <Section title="文字与常用组合"><Grid>
   <Card title="文字角色"><Stack><Typography.Heading level={3}>分组标题</Typography.Heading><Typography.Text>标准正文与长中文内容。</Typography.Text><Typography.Text tone="muted">次要时间、来源和元数据</Typography.Text><Typography.Text tone="success">操作已确认</Typography.Text><Typography.Text tone="error">需要修正输入</Typography.Text><Typography.Code value="workspace-demo-001"/></Stack></Card>
   <Card title="图标、头像与标签"><Stack><Toolbar><Avatar.Root><Avatar.Image src={illustration} alt="合成头像"/><Avatar.Fallback>研</Avatar.Fallback></Avatar.Root><Avatar.Root role="img" aria-label="缺少图片的头像"><Avatar.Fallback>运</Avatar.Fallback></Avatar.Root><Avatar.Root role="img" aria-label="正在读取头像"><Avatar.Fallback><Spinner/></Avatar.Fallback></Avatar.Root><Avatar.Root size="sm" shape="square"><Avatar.Fallback>AI</Avatar.Fallback></Avatar.Root><Badge tone="success">运行中</Badge></Toolbar><Toolbar>{tags.map(tag=><Tag key={tag} label={tag} removeLabel={'移除 '+tag} onRemove={()=>setTags(values=>values.filter(value=>value!==tag))}/>)}<Tag label="禁用移除" disabled removeLabel="移除禁用标签" onRemove={()=>{}}/><Tag label="只读标签"/></Toolbar><Button variant="text" onClick={()=>setTags(['研发','运营'])}>恢复标签</Button></Stack></Card>
  </Grid></Section>
  <Section title="复制状态"><Grid>{(['normal','disabled','loading','error'] as const).map(phase=><Card key={phase} title={{normal:'正常复制',disabled:'禁用复制',loading:'复制中',error:'复制失败'}[phase]}><CopyExample phase={phase}/></Card>)}</Grid></Section>
  <Section title="媒体状态"><Grid>
   <Card title="图片正常"><Image src={illustration} alt="合成研究图示" aspectRatio={2}/></Card>
   <Card title="图片加载占位"><Stack><Skeleton aria-label="图片骨架" style={{minBlockSize:'var(--feedback-empty-min-block-size)'}}/><Typography.Text tone="muted">正在读取图片</Typography.Text></Stack></Card>
   <Card title="图片失败与恢复"><Image src={imageRecovered?illustration:''} alt="可重试的合成图示" aspectRatio={2} fallback="图片无法加载"/><Button variant="text" disabled={imageRecovered} onClick={()=>setImageRecovered(true)}>重新读取</Button></Card>
  </Grid></Section>
  <Section title="图标与滚动区域"><Grid>
   <Card title="继承文字颜色"><Toolbar>{(['default','muted','success','error'] as const).map(tone=><Typography.Text key={tone} tone={tone}><Icon color="currentColor"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="m4 10 4 4 8-8"/></svg></Icon>{tone}</Typography.Text>)}</Toolbar></Card>
   <Card title="区域内滚动"><ScrollArea.Root><ScrollArea.Viewport aria-label="只读任务记录" tabIndex={0} style={{maxBlockSize:'var(--layout-scroll-area-height)'}}><Stack>{Array.from({length:12},(_,index)=><Typography.Text key={index}>只读任务记录 {index+1}：保留完整中文名称。</Typography.Text>)}</Stack></ScrollArea.Viewport></ScrollArea.Root></Card>
  </Grid></Section><Separator/>
 </Stack>;
}
