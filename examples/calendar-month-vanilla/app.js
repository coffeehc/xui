import {createCalendar} from '@coffeehc/xui-runtime/widgets-dom';
import {bindSelectControl} from '@coffeehc/xui-runtime/dom';
import {createThemeController} from '@coffeehc/xui-runtime/theme';
import '@coffeehc/xui-theme/style.css';
const root=document.getElementById('root'),theme=window.xuiTheme??createThemeController(),range=new URLSearchParams(location.search).has('range');
root.innerHTML='<main class="xui-stack" style="padding:var(--space-section-gap)"><h1>日期与查看月份</h1><label class="xui-field"><span class="xui-label">外观</span><select class="xui-select" id="theme"><option>light</option><option>dark</option><option>system</option></select></label><div class="xui-toolbar"><label class="xui-field"><span class="xui-label">年份</span><input class="xui-input" id="year" type="number" min="1" max="9999" value="2020"></label><label class="xui-field"><span class="xui-label">月份</span><select class="xui-select" id="month">'+Array.from({length:12},(_,i)=>{const value=String(i+1).padStart(2,'0');return '<option value="'+value+'">'+value+' 月</option>';}).join('')+'</select></label><button class="xui-button" id="jump">定位年月</button><button class="xui-button" id="reset">返回 2026-10</button><label class="xui-field"><span class="xui-label">语言</span><select class="xui-select" id="locale"><option value="zh-CN">中文</option><option value="en-US">English</option></select></label><label class="xui-choice-label"><input class="xui-choice" id="deny" type="checkbox">拒绝翻月请求</label></div><section class="xui-section"><h2>受控日期</h2><div id="controlled"></div><output aria-label="月份结果"></output><output aria-label="日期结果"></output><output aria-label="事件次数"></output></section><section class="xui-section"><h2>非受控日期</h2><div id="uncontrolled"></div></section></main>';
const $=id=>document.getElementById(id);
// The public binding transfers the select id to its visible trigger. Retain the
// actual form bridge rather than looking it up again after binding.
const monthSelect=$('month'),localeSelect=$('locale'),themeSelect=$('theme');
let month='2026-10',value=range?{start:'2020-01-01',end:'2020-01-03'}:'2020-01-01',monthEvents=0,valueEvents=0;
const show=()=>{root.querySelector('[aria-label="月份结果"]').textContent=month;root.querySelector('[aria-label="日期结果"]').textContent=JSON.stringify(value);root.querySelector('[aria-label="事件次数"]').textContent='month '+monthEvents+' value '+valueEvents;};
const calendar=createCalendar($('controlled'),{label:'受控日期',mode:range?'range':'single',month,defaultMonth:'2026-10',value,today:'2026-10-12',isDateDisabled:date=>date.endsWith('-15'),
 onMonthChange:next=>{monthEvents++;if(!$('deny').checked){month=next;calendar.update({month});}show();},
 onValueChange:next=>{valueEvents++;value=next;calendar.update({value});show();}});
const uncontrolled=createCalendar($('uncontrolled'),{label:'非受控日期',defaultMonth:'2026-12',defaultValue:'2020-01-01',today:'2026-10-12'});
$('year').oninput=()=>{$('jump').disabled=!/^[0-9]{1,4}$/.test($('year').value)||Number($('year').value)<1||Number($('year').value)>9999;};
$('jump').onclick=()=>{month=$('year').value.padStart(4,'0')+'-'+monthSelect.value;calendar.update({month});show();};
$('reset').onclick=()=>{month='2026-10';calendar.update({month});show();};
localeSelect.onchange=()=>calendar.update({locale:localeSelect.value});
themeSelect.value=theme.getState().mode;themeSelect.onchange=()=>theme.setMode(themeSelect.value);
const bindings=Array.from(root.querySelectorAll('select')).map(bindSelectControl),off=theme.subscribe(()=>{themeSelect.value=theme.getState().mode;bindings[0].update();});show();
window.addEventListener('pagehide',()=>{off();bindings.forEach(binding=>binding.destroy());calendar.destroy();uncontrolled.destroy();},{once:true});
