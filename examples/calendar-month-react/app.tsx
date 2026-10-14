import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Calendar} from '@coffeehc/xui-react/calendar';
import type {CalendarValue} from '@coffeehc/xui-runtime/calendar';
import {Field,Input,SimpleSelect,Checkbox} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
import {Stack,Section,Toolbar} from '@coffeehc/xui-react/layout';
import {createThemeController,type ThemeMode} from '@coffeehc/xui-runtime/theme';
import '@coffeehc/xui-theme/style.css';

const theme=window.xuiTheme??createThemeController();
const range=new URLSearchParams(location.search).has('range');
function App(){
 const [month,setMonth]=React.useState('2026-10'),[year,setYear]=React.useState('2020'),[targetMonth,setTargetMonth]=React.useState('01');
 const [value,setValue]=React.useState<CalendarValue>(range?{start:'2020-01-01',end:'2020-01-03'}:'2020-01-01');
 const [monthEvents,setMonthEvents]=React.useState(0),[valueEvents,setValueEvents]=React.useState(0),[deny,setDeny]=React.useState(false),[locale,setLocale]=React.useState('zh-CN');
 const [mode,setMode]=React.useState(theme.getState().mode);
 React.useEffect(()=>theme.subscribe(()=>setMode(theme.getState().mode)),[]);
 const valid=/^[0-9]{1,4}$/.test(year)&&Number(year)>0&&Number(year)<=9999;
 return <Stack style={{padding:'var(--space-section-gap)'}}>
  <h1>日期与查看月份</h1>
  <Field label="外观"><SimpleSelect value={mode} onChange={event=>theme.setMode(event.target.value as ThemeMode)}>{['light','dark','system'].map(item=><option key={item}>{item}</option>)}</SimpleSelect></Field>
  <Toolbar>
   <Field label="年份"><Input type="number" min={1} max={9999} value={year} onChange={event=>setYear(event.target.value)}/></Field>
   <Field label="月份"><SimpleSelect value={targetMonth} onChange={event=>setTargetMonth(event.target.value)}>{Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')).map(item=><option key={item} value={item}>{item} 月</option>)}</SimpleSelect></Field>
   <Button disabled={!valid} onClick={()=>setMonth(year.padStart(4,'0')+'-'+targetMonth)}>定位年月</Button>
   <Button onClick={()=>setMonth('2026-10')}>返回 2026-10</Button>
   <Field label="语言"><SimpleSelect value={locale} onChange={event=>setLocale(event.target.value)}><option value="zh-CN">中文</option><option value="en-US">English</option></SimpleSelect></Field>
   <Checkbox label="拒绝翻月请求" checked={deny} onChange={event=>setDeny(event.target.checked)}/>
  </Toolbar>
  <Section title="受控日期">
   <Calendar label="受控日期" mode={range?'range':'single'} month={month} defaultMonth="2026-10" value={value} locale={locale} today="2026-10-12" isDateDisabled={date=>date.endsWith('-15')}
    onMonthChange={next=>{setMonthEvents(count=>count+1);if(!deny)setMonth(next);}}
    onValueChange={next=>{setValueEvents(count=>count+1);setValue(next);}}/>
   <output aria-label="月份结果">{month}</output><output aria-label="日期结果">{JSON.stringify(value)}</output>
   <output aria-label="事件次数">{'month '+monthEvents+' value '+valueEvents}</output>
  </Section>
  <Section title="非受控日期"><Calendar label="非受控日期" defaultMonth="2026-12" defaultValue="2020-01-01" today="2026-10-12"/></Section>
 </Stack>;
}
createRoot(document.getElementById('root')!).render(<App/>);
