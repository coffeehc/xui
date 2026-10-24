import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MetricCard} from '@coffeehc/xui-react/metric-card';
import {Container,Grid,PageHeader,Stack} from '@coffeehc/xui-react/layout';
import {Badge} from '@coffeehc/xui-react/feedback';
import {Button} from '@coffeehc/xui-react/button';
import '@coffeehc/xui-runtime/init.js';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';

bootstrapBrowserExample();
function App(){
  const [updated,setUpdated]=React.useState(false),[actions,setActions]=React.useState(0);
  return <Container><Stack>
    <PageHeader title="通用指标卡" description="合成数据；名称、已格式化值与标记由调用方提供。" actions={<Button onClick={()=>setUpdated(value=>!value)}>更新示例</Button>}/>
    <Grid data-testid="metric-grid">
      <MetricCard data-testid="zero-card" label={updated?'更新后的记录数':'记录数'} value={updated?'1,234.50':0} marker={updated?<Badge>已同步</Badge>:null}/>
      <MetricCard data-testid="marked-card" label="完成比例" value="98.5%" marker={<Badge style={{color:'var(--status-success-foreground)'}}>已达标</Badge>}/>
      <MetricCard data-testid="long-card" label={'较长的指标名称与连续标识'.repeat(5)} value={'1234567890'.repeat(10)} marker={<svg viewBox="0 0 16 16" aria-hidden="true" style={{inlineSize:'var(--control-icon-size)',blockSize:'var(--control-icon-size)',fill:'var(--chart-color-2)'}}><circle cx="8" cy="8" r="5"/></svg>}/>
      <MetricCard data-testid="action-card" label="平均耗时" value={<>12.5 <span style={{font:'var(--font-weight-body) var(--font-size-body-xs)/var(--line-height-body-xs) var(--font-sans)'}}>秒</span></>} marker={<Button variant="ghost" onClick={()=>setActions(value=>value+1)}>查看说明</Button>}/>
      <MetricCard data-testid="empty-marker-card" label="尚未提供的数据" value="—" marker={<></>}/>
      <MetricCard data-testid="wide-marker-card" label="宽标记" value="由调用方提供" marker={<span style={{inlineSize:'var(--layout-field-min)'}}>较长的标记内容同样需要安全换行</span>}/>
    </Grid>
    <p className="xui-text" role="status" data-testid="marker-result">说明已查看 {actions} 次</p>
  </Stack></Container>;
}
createRoot(document.getElementById('root')!).render(<App/>);
