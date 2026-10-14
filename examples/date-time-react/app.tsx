import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {DateTimePicker,type DateTimeValue} from '@coffeehc/xui-react/date-time';
import {Button} from '@coffeehc/xui-react/button';
import {Checkbox} from '@coffeehc/xui-react/forms';
import {Stack,Toolbar} from '@coffeehc/xui-react/layout';
import '@coffeehc/xui-theme/style.css';
const long=new URLSearchParams(location.search).has('long'),startLabel=long?'开始日期时间：'+ '完整保留长中文观察窗口字段名称'.repeat(3):'开始日期时间';
function App(){
 const [start,setStart]=React.useState<DateTimeValue>('2020-02-29T23:59'),[end,setEnd]=React.useState<DateTimeValue>(null),[calls,setCalls]=React.useState(0),[disabled,setDisabled]=React.useState(false),[readOnly,setReadOnly]=React.useState(false),[required,setRequired]=React.useState(false),[deny,setDeny]=React.useState(false),[externalError,setError]=React.useState(false),[submitted,setSubmitted]=React.useState('');
 const change=(value:DateTimeValue)=>{setCalls(c=>c+1);if(!deny)setStart(value);};
 return <Stack style={{padding:'var(--space-section-gap)'}}><h1>观察窗口</h1><Toolbar>
  <Button onClick={()=>setStart('2026-10-15T09:30')}>外部更新</Button>
  <Checkbox label="禁用" checked={disabled} onChange={event=>setDisabled(event.target.checked)}/><Checkbox label="只读" checked={readOnly} onChange={event=>setReadOnly(event.target.checked)}/><Checkbox label="必填" checked={required} onChange={event=>setRequired(event.target.checked)}/><Checkbox label="拒绝受控更新" checked={deny} onChange={event=>setDeny(event.target.checked)}/><Checkbox label="宿主错误" checked={externalError} onChange={event=>setError(event.target.checked)}/>
 </Toolbar><form style={{minInlineSize:0}} onSubmit={event=>{event.preventDefault();const data:Record<string,FormDataEntryValue>={};new FormData(event.currentTarget).forEach((value,key)=>data[key]=value);setSubmitted(JSON.stringify(data));}}><Stack>
  <DateTimePicker id="start" label={startLabel} name="start" value={start} onValueChange={change} today="2026-10-15" locale="zh-CN" disabled={disabled} readOnly={readOnly} required={required} help="YYYY-MM-DDTHH:mm" error={externalError?'宿主提供的观察窗口校验错误':undefined} labels={long?{title:'选择开始日期与时间：'+ '完整保留长中文标题'.repeat(3)}:undefined}/>
  <DateTimePicker id="end" label="结束日期时间" name="end" value={end} onValueChange={setEnd} today="2026-10-15" disabled={disabled} readOnly={readOnly}/>
  <Toolbar><Button type="submit">提交</Button><Button type="reset" variant="outline">重置草稿</Button></Toolbar>
 </Stack></form><output style={{minInlineSize:0,overflowWrap:'anywhere'}} aria-label="日期时间结果">{JSON.stringify({start,end,calls})}</output><output style={{minInlineSize:0,overflowWrap:'anywhere'}} aria-label="表单结果">{submitted}</output></Stack>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
