import * as React from 'react';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Fieldset,Input,Textarea,NativeSelect,SimpleSelect,Checkbox,Radio,Switch,InputGroup} from '@coffeehc/xui-react/forms';
import {Card,Typography} from '@coffeehc/xui-react/display';
import {Stack,Grid,Section,FormGrid,Toolbar} from '@coffeehc/xui-react/layout';
import {LoadingState,Spinner} from '@coffeehc/xui-react/feedback';
import {QueryForm,QueryField} from '@coffeehc/xui-react/search-toolbar';
import {PasswordStrengthInput} from '@coffeehc/xui-react/password';
import {Calendar} from '@coffeehc/xui-react/calendar';
import {DateTimePicker} from '@coffeehc/xui-react/date-time';
import {CommandPicker} from '@coffeehc/xui-react/command';
import {GroupedCombobox} from '@coffeehc/xui-react/grouped-combobox';
import {CheckboxGroup,RadioGroup} from '@coffeehc/xui-react/choice-group';
import {SearchInput,NumberInput} from '@coffeehc/xui-react/text-inputs';
import {ToggleGroup} from '@coffeehc/xui-react/toggle-group';
import {Toast} from '@coffeehc/xui-react/toast';

const cases=[['default','正常'],['disabled','禁用'],['readonly','只读'],['error','错误']] as const;
const directory=[{id:'local',label:'本地工作区',items:[{id:'research',label:'研究工作区'},{id:'operations',label:'运营工作区'}]},{id:'shared',label:'共享工作区',items:[{id:'shared-research',label:'共享研究资料'},{id:'locked',label:'受限目录',disabled:true}]}];
const choices=[{id:'research',label:'研究工作区'},{id:'operations',label:'运营工作区'},{id:'locked',label:'无权访问',disabled:true}];

function SpecializedInputs({phase,title}:{phase:typeof cases[number][0];title:string}){
 const [search,setSearch]=React.useState('研究'),[number,setNumber]=React.useState<number|null>(3),[selected,setSelected]=React.useState<string[]>(['read']),[single,setSingle]=React.useState<string|null>('read');
 const disabled=phase==='disabled',readOnly=phase==='readonly',error=phase==='error',options=[{key:'read',label:'读取'},{key:'write',label:'写入'},{key:'locked',label:'受限',disabled:true}];
 return <Card title={title}><Stack>
  <Field label={title+'搜索输入'} error={error?'请补充搜索条件':undefined}><SearchInput value={search} onValueChange={setSearch} clearLabel="清空搜索" clearOnEscape {...{disabled,readOnly}}/></Field>
  <Field label={title+'数字输入'} error={error?'请输入 1 到 20 之间的数值':undefined}><NumberInput value={number} onValueChange={setNumber} min={1} max={20} step={1} incrementLabel="增加数量" decrementLabel="减少数量" {...{disabled,readOnly}}/></Field>
  <CheckboxGroup legend={title+'多选权限'} value={selected} onValueChange={setSelected} selectAll="全选可用项" options={options} error={error?'请核对权限':undefined} {...{disabled,readOnly}}/>
  <RadioGroup legend={title+'单选权限'} value={single} onValueChange={setSingle} options={options} error={error?'请选择适用权限':undefined} {...{disabled,readOnly}}/>
 </Stack></Card>;
}

export function Forms(){
 const [groupQuery,setGroupQuery]=React.useState(''),[emptyQuery,setEmptyQuery]=React.useState('');
 const [keyword,setKeyword]=React.useState(''),[status,setStatus]=React.useState('all'),[applied,setApplied]=React.useState('全部任务 · 全部状态'),toast=Toast.useToastManager();
 return <Stack>
  <Section title="常用组合">
   <QueryForm label="任务查询示例" onSubmit={event=>{event.preventDefault();setApplied((keyword||'全部任务')+' · '+({all:'全部状态',active:'运行中',done:'已完成'}[status]??status));}}
    fields={<><QueryField label="任务名称" width="primary"><Input value={keyword} onChange={event=>setKeyword(event.target.value)} placeholder="输入任务名称"/></QueryField><QueryField label="状态" width="compact"><SimpleSelect value={status} onChange={event=>setStatus(event.target.value)}><option value="all">全部状态</option><option value="active">运行中</option><option value="done">已完成</option></SimpleSelect></QueryField></>}
    actions={<><Button type="submit">查询</Button><Button variant="outline" onClick={()=>{setKeyword('');setStatus('all');}}>重置草稿</Button></>}
    summary={<Typography.Text tone="muted">已生效：{applied}</Typography.Text>}/>
   <form onSubmit={event=>{event.preventDefault();toast.add({description:'示例表单已保存',type:'success'});}}>
    <Stack><FormGrid><Field label="工作区名称" required><Input name="workspace" defaultValue="研究工作区"/></Field><Field label="所属分组"><SimpleSelect defaultValue="research"><option value="research">研发团队</option><option value="operations">运营团队</option></SimpleSelect></Field><FormGrid.Item span="full"><Field label="任务内容"><Textarea name="content" defaultValue="整理本周研究资料" autoResize={{maxRows:5}}/></Field></FormGrid.Item></FormGrid><Toolbar><Button type="submit">保存表单</Button><Button type="reset" variant="outline">恢复初始值</Button></Toolbar></Stack>
   </form>
  </Section>
  <Section title="Input / Textarea 状态"><Grid>{cases.map(([id,title])=><Card key={id} title={title}><Stack>
   <Field label={title+'输入'} required error={id==='error'?'请输入工作区名称':undefined}><Input defaultValue={id==='error'?'':'研究工作区'} disabled={id==='disabled'} readOnly={id==='readonly'}/></Field>
   <Field label={title+'多行输入'} error={id==='error'?'内容不得为空':undefined}><Textarea defaultValue={id==='error'?'':'长中文任务内容：整理资料并保留来源。'} disabled={id==='disabled'} readOnly={id==='readonly'}/></Field>
  </Stack></Card>)}</Grid></Section>
  <Section title="InputGroup 组合"><Grid>
   <Card title="前后缀"><Field label="资源地址"><InputGroup.Root><InputGroup.Addon>https://</InputGroup.Addon><InputGroup.Input defaultValue="example.test"/><InputGroup.Button onClick={()=>toast.add({description:'已检查示例地址',type:'success'})}>检查</InputGroup.Button></InputGroup.Root></Field></Card>
   <Card title="读取中"><Field label="读取中的名称"><InputGroup.Root aria-busy="true"><InputGroup.Input placeholder="正在读取" disabled/><InputGroup.Addon><Spinner/></InputGroup.Addon></InputGroup.Root></Field></Card>
   <Card title="只读组合"><Field label="资源编号"><InputGroup.Root><InputGroup.Input value="workspace-demo-001" readOnly/><InputGroup.Addon>只读</InputGroup.Addon></InputGroup.Root></Field></Card>
   <Card title="错误组合"><Field label="校验名称" error="名称已存在"><InputGroup.Root><InputGroup.Input defaultValue="研究工作区"/><InputGroup.Button>重新校验</InputGroup.Button></InputGroup.Root></Field></Card>
  </Grid></Section>
  <Section title="选择控件状态"><Grid>{cases.map(([id,title])=><Card key={id} title={title}><Stack>
   {id==='readonly'?<Field label="已确认的工作区"><Input value="研究工作区" readOnly/></Field>:<><Field label={title+'选择'} error={id==='error'?'请选择一个工作区':undefined}><SimpleSelect defaultValue={id==='error'?'':'research'} disabled={id==='disabled'}><option value="">请选择</option><option value="research">研究工作区</option><option value="operations">运营工作区</option><option disabled>无权访问</option></SimpleSelect></Field><Field label={title+'原生选择'} error={id==='error'?'请选择分组':undefined}><NativeSelect defaultValue={id==='error'?'':'research'} disabled={id==='disabled'}><option value="">请选择</option><option value="research">研发团队</option><option value="operations">运营团队</option></NativeSelect></Field></>}
   <Fieldset legend={title+'勾选与开关'} error={id==='error'?'请确认至少一项':undefined}><Stack>
    <Checkbox label="接收任务通知" defaultChecked={id!=='error'} disabled={id==='disabled'} readOnly={id==='readonly'} aria-invalid={id==='error'||undefined}/>
    <Switch label="启用自动同步" defaultChecked={id!=='error'} disabled={id==='disabled'} readOnly={id==='readonly'} aria-invalid={id==='error'||undefined}/>
    <Radio name={'priority-'+id} label="普通优先级" defaultChecked={id!=='error'} disabled={id==='disabled'} readOnly={id==='readonly'} aria-invalid={id==='error'||undefined}/>
    <Radio name={'priority-'+id} label="高优先级" disabled={id==='disabled'} readOnly={id==='readonly'} aria-invalid={id==='error'||undefined}/>
   </Stack></Fieldset>
  </Stack></Card>)}</Grid><Typography.Text tone="muted">SimpleSelect 没有原生只读状态；已确认值使用只读 Input 展示。</Typography.Text></Section>
  <Section title="专用输入与受控选择组"><Grid>{cases.map(([phase,title])=><SpecializedInputs key={phase} {...{phase,title}}/>)}</Grid></Section>
  <Section title="搜索选择与切换"><Grid>
   <Card title="搜索多选"><CommandPicker label="搜索工作区" mode="multiple" items={choices} defaultValue={['research']}/></Card>
   <Card title="禁用搜索"><CommandPicker label="禁用的工作区搜索" items={choices} defaultValue={['research']} disabled/></Card>
   <Card title="没有匹配项"><CommandPicker label="空目录搜索" items={[]} emptyLabel="暂无可选工作区"/></Card>
   <Card title="目录读取中"><Stack><CommandPicker label="读取中的工作区搜索" items={[]} disabled emptyLabel="正在读取目录"/><LoadingState layout="inline">正在读取目录</LoadingState></Stack></Card>
   <Card title="单选切换"><ToggleGroup.Root aria-label="视图切换" defaultValue={['list']} allowEmpty={false}><ToggleGroup.Item value="list">列表</ToggleGroup.Item><ToggleGroup.Item value="grid">网格</ToggleGroup.Item><ToggleGroup.Item value="locked" disabled>受限</ToggleGroup.Item></ToggleGroup.Root></Card>
   <Card title="多选与禁用"><Stack><ToggleGroup.Root aria-label="通知方式" multiple defaultValue={['inbox']}><ToggleGroup.Item value="inbox">站内</ToggleGroup.Item><ToggleGroup.Item value="mail">邮件</ToggleGroup.Item></ToggleGroup.Root><ToggleGroup.Root aria-label="禁用视图切换" defaultValue={['list']} disabled><ToggleGroup.Item value="list">列表</ToggleGroup.Item><ToggleGroup.Item value="grid">网格</ToggleGroup.Item></ToggleGroup.Root></Stack></Card>
  </Grid></Section>
  <Section title="分组搜索目录"><Grid><Card title="常用分组"><GroupedCombobox label="分组工作区搜索" inputValue={groupQuery} onInputValueChange={setGroupQuery} groups={directory.map(group=>({...group,items:group.items.filter(item=>item.label.includes(groupQuery.trim()))}))}/></Card><Card title="分组读取中"><GroupedCombobox label="分组目录加载" inputValue="" disabled groups={[{id:'loading',label:'共享工作区',items:[],busy:true,emptyLabel:'正在读取目录'}]}/></Card><Card title="分组没有匹配"><GroupedCombobox label="分组空目录" inputValue={emptyQuery} onInputValueChange={setEmptyQuery} groups={[]} emptyLabel="没有匹配的工作区"/></Card></Grid></Section>
  <Section title="日期时间状态"><Grid>{cases.map(([id,title])=><Card key={id} title={title}><DateTimePicker label={title+'观察时间'} defaultValue="2026-10-24T10:30" locale="zh-CN" required disabled={id==='disabled'} readOnly={id==='readonly'} error={id==='error'?'结束时间必须晚于开始时间':undefined}/></Card>)}</Grid></Section>
  <Section title="Calendar 组合"><Grid>
   <Card title="单日期"><Calendar label="单日期选择" defaultMonth="2026-10" today="2026-10-24" defaultValue="2026-10-24" locale="zh-CN"/></Card>
   <Card title="范围与禁用日期"><Calendar label="日期范围选择" mode="range" defaultMonth="2026-10" today="2026-10-24" defaultValue={{start:'2026-10-16',end:'2026-10-20'}} isDateDisabled={date=>date<'2026-10-12'} locale="zh-CN"/></Card>
   <Card title="禁用日期选择"><Calendar label="禁用日历" defaultMonth="2026-10" defaultValue="2026-10-24" disabled locale="zh-CN"/></Card>
  </Grid></Section>
  <Section title="密码输入"><Grid>{cases.map(([id,title])=><Card key={id} title={title}><Field label={title+'密码'} error={id==='error'?'请使用符合要求的新密码':undefined}><PasswordStrengthInput autoComplete="new-password" disabled={id==='disabled'} readOnly={id==='readonly'}/></Field></Card>)}</Grid></Section>
 </Stack>;
}
