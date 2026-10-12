import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';

// Fixture-local HTML assembly, not a new controller or business metric engine.
function element(tag,className,text){const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
function card(id,label,value,marker){
  const root=element('section','xui-surface xui-metric-card');root.dataset.testid=id;
  const content=element('dl','xui-metric-card-content'),header=element('dt','xui-metric-card-header'),name=element('span','xui-metric-card-label',label),display=element('dd','xui-metric-card-value');
  header.append(name);if(marker){const slot=element('span','xui-metric-card-marker');slot.append(marker);header.append(slot);}
  display.append(value instanceof Node?value:document.createTextNode(String(value)));content.append(header,display);root.append(content);return root;
}
const grid=document.getElementById('metrics');
const zero=card('zero-card','记录数',0);grid.append(zero);
const badge=element('span','xui-badge','已达标');badge.style.color='var(--status-success-foreground)';
grid.append(card('marked-card','完成比例','98.5%',badge));
const dot=document.createElementNS('http://www.w3.org/2000/svg','svg');dot.setAttribute('viewBox','0 0 16 16');dot.setAttribute('aria-hidden','true');Object.assign(dot.style,{inlineSize:'var(--control-icon-size)',blockSize:'var(--control-icon-size)',fill:'var(--chart-color-2)'});
const circle=document.createElementNS(dot.namespaceURI,'circle');circle.setAttribute('cx','8');circle.setAttribute('cy','8');circle.setAttribute('r','5');dot.append(circle);
grid.append(card('long-card','较长的指标名称与连续标识'.repeat(5),'1234567890'.repeat(10),dot));
const value=document.createDocumentFragment(),unit=document.createElement('span');unit.style.font='var(--font-weight-body) var(--font-size-body-xs)/var(--line-height-body-xs) var(--font-sans)';unit.textContent='秒';value.append('12.5 ',unit);
let actions=0;const action=element('button','xui-button','查看说明');action.type='button';action.dataset.variant='ghost';action.onclick=()=>{document.getElementById('marker-result').textContent=`说明已查看 ${++actions} 次`;};
grid.append(card('action-card','平均耗时',value,action));
grid.append(card('empty-marker-card','尚未提供的数据','—',document.createDocumentFragment()));
const wideMarker=document.createElement('span');wideMarker.style.inlineSize='var(--layout-field-min)';wideMarker.textContent='较长的标记内容同样需要安全换行';grid.append(card('wide-marker-card','宽标记','由调用方提供',wideMarker));
let updated=false;document.getElementById('update').onclick=()=>{
  updated=!updated;zero.querySelector('.xui-metric-card-label').textContent=updated?'更新后的记录数':'记录数';zero.querySelector('.xui-metric-card-value').textContent=updated?'1,234.50':'0';
  zero.querySelector('.xui-metric-card-marker')?.remove();
  if(updated){const slot=element('span','xui-metric-card-marker');slot.append(element('span','xui-badge','已同步'));zero.querySelector('.xui-metric-card-header').append(slot);}
};
