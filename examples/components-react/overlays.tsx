import * as React from 'react';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input,Textarea,SimpleSelect} from '@coffeehc/xui-react/forms';
import {Card,Typography} from '@coffeehc/xui-react/display';
import {Stack,Grid,Section,Toolbar} from '@coffeehc/xui-react/layout';
import {LoadingState,Spinner} from '@coffeehc/xui-react/feedback';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {AlertDialog} from '@coffeehc/xui-react/alert-dialog';
import {Popover} from '@coffeehc/xui-react/popover';
import {Tooltip} from '@coffeehc/xui-react/tooltip';
import {Toast} from '@coffeehc/xui-react/toast';

const cases=[['normal','正常'],['loading','加载中'],['readonly','只读'],['error','错误'],['disabled','禁用']] as const;
type Phase=typeof cases[number][0];
function DetailOverlay({kind,phase,label}:{kind:'Dialog'|'Sheet';phase:Phase;label:string}){
 const Surface=kind==='Dialog'?Dialog:Sheet,[open,setOpen]=React.useState(false),[name,setName]=React.useState('研究工作区'),toast=Toast.useToastManager();
 const error=phase==='error'&&name==='研究工作区'?'名称已存在，请更换名称':undefined;
 return <Surface.Root open={open} onOpenChange={setOpen}>
  <Surface.Trigger render={<Button variant="outline" disabled={phase==='disabled'}/>}>{label+' '+kind}</Surface.Trigger>
  <Surface.Content><Surface.Title>{label+'工作区详情'}</Surface.Title>
   <Surface.Body aria-busy={phase==='loading'}>{phase==='loading'?<LoadingState>正在读取工作区详情</LoadingState>:<Stack><Field label="工作区名称" required error={error}><Input value={name} onChange={event=>setName(event.target.value)} readOnly={phase==='readonly'}/></Field><Field label="任务内容"><Textarea defaultValue="整理本周研究与运营资料。" readOnly={phase==='readonly'}/></Field><Field label="工作区状态">{phase==='readonly'?<Input value="研究中" readOnly/>:<SimpleSelect defaultValue="research"><option value="research">研究中</option><option value="review">等待复核</option><option value="archived">已归档，保留跨区域研发与运营团队的完整记录</option></SimpleSelect>}</Field></Stack>}</Surface.Body>
   <Surface.Footer><Surface.Close render={<Button variant="outline"/>}>{phase==='readonly'?'关闭':'取消'}</Surface.Close>{phase!=='readonly'&&<Button disabled={phase==='loading'} aria-busy={phase==='loading'} onClick={()=>{if(error||!name.trim()){toast.add({description:'请修正名称后再保存',type:'error'});return;}setOpen(false);toast.add({description:'示例工作区已保存',type:'success'});}}>{phase==='loading'&&<Spinner/>}{phase==='loading'?'等待数据':'保存'}</Button>}</Surface.Footer>
  </Surface.Content>
 </Surface.Root>;
}
export function Overlays(){
 const toast=Toast.useToastManager(),[recovered,setRecovered]=React.useState(false);
 return <Stack>
  <Section title="Dialog 状态"><Toolbar aria-label="Dialog 状态示例">{cases.map(([phase,label])=><DetailOverlay key={phase} kind="Dialog" {...{phase,label}}/>)}</Toolbar></Section>
  <Section title="Sheet 状态"><Toolbar aria-label="Sheet 状态示例">{cases.map(([phase,label])=><DetailOverlay key={phase} kind="Sheet" {...{phase,label}}/>)}</Toolbar></Section>
  <Section title="Popover / Tooltip"><Grid>
   <Card title="详情浮层"><Toolbar><Popover.Root><Popover.Trigger render={<Button variant="outline"/>}>只读详情 Popover</Popover.Trigger><Popover.Content><Popover.Title>工作区信息</Popover.Title><Popover.Description>研究工作区当前运行正常。</Popover.Description><Field label="工作区编号"><Input value="workspace-demo-001" readOnly/></Field></Popover.Content></Popover.Root><Popover.Root><Popover.Trigger render={<Button variant="outline" disabled/>}>禁用 Popover</Popover.Trigger><Popover.Content>不可用</Popover.Content></Popover.Root></Toolbar></Card>
   <Card title="加载与错误浮层"><Toolbar><Popover.Root><Popover.Trigger render={<Button variant="outline"/>}>加载中 Popover</Popover.Trigger><Popover.Content><Popover.Title>正在读取</Popover.Title><LoadingState>正在读取详情</LoadingState></Popover.Content></Popover.Root><Popover.Root><Popover.Trigger render={<Button variant="outline"/>}>错误 Popover</Popover.Trigger><Popover.Content><Popover.Title>{recovered?'工作区信息':'读取失败'}</Popover.Title>{recovered?<Field label="已恢复的工作区"><Input value="研究工作区" readOnly/></Field>:<><Popover.Description>暂时无法读取工作区信息。</Popover.Description><Button variant="outline" onClick={()=>setRecovered(true)}>重试详情</Button></>}</Popover.Content></Popover.Root></Toolbar></Card>
   <Card title="提示文字"><Toolbar><Tooltip.Root><Tooltip.Trigger render={<Button variant="outline"/>}>悬停或聚焦</Tooltip.Trigger><Tooltip.Content>查看工作区的完整详情</Tooltip.Content></Tooltip.Root><Tooltip.Root><Tooltip.Trigger render={<Button variant="outline" disabled/>}>禁用提示触发器</Tooltip.Trigger><Tooltip.Content>不可用</Tooltip.Content></Tooltip.Root></Toolbar></Card>
  </Grid></Section>
  <Section title="危险操作确认"><AlertDialog.Root><AlertDialog.Trigger render={<Button variant="text" tone="danger"/>}>删除示例任务</AlertDialog.Trigger><AlertDialog.Content><Dialog.Title>确认删除任务？</Dialog.Title><Dialog.Body><AlertDialog.Description>仅删除当前合成任务，不影响其他记录。</AlertDialog.Description></Dialog.Body><Dialog.Footer><AlertDialog.Close render={<Button variant="outline"/>}>保留任务</AlertDialog.Close><AlertDialog.Close render={<Button variant="destructive" onClick={()=>toast.add({description:'示例任务已删除',type:'success'})}/>}>确认删除</AlertDialog.Close></Dialog.Footer></AlertDialog.Content></AlertDialog.Root></Section>
  <Typography.Text tone="muted">浮层的加载、只读和错误由内容组合呈现；关闭后返回原触发按钮。</Typography.Text>
 </Stack>;
}
