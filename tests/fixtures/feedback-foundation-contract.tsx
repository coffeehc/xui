import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Alert} from '@coffeehc/xui-react';
import {Skeleton,Spinner,Progress,LoadingState,DataRegion,type AlertProps} from '@coffeehc/xui-react/feedback';
import {DataTable} from '@coffeehc/xui-react/data-table';
import {CardGroup} from '@coffeehc/xui-react/card-group';
import {Button} from '@coffeehc/xui-react/button';
import '@coffeehc/xui-theme/style.css';

// Only the public feedback exports and ordinary host markup are used here.
const tones=['info','success','warning','error'] as const satisfies readonly NonNullable<AlertProps['tone']>[];
const longMessage='错误仍需完整阅读。LongUnbrokenDiagnosticIdentifier'.repeat(16)+' END-OF-MESSAGE';
type DemoLayout='natural'|'workspace'|'document';
declare global {interface Window {setFeedbackProgress(value:number|null,max?:number):void;setLoadingDemo(status:'loading'|'refreshing'|'ready',hasRows:boolean,layout?:DemoLayout):void}}
const loadingText='正在读取当前范围的研究数据，请稍候。';
const sampleRows=[{id:'a',name:'保留的研究任务'}];
function LoadingExamples(){
 const [state,setState]=React.useState<{status:'loading'|'refreshing'|'ready';hasRows:boolean;layout:DemoLayout}>({status:'loading',hasRows:false,layout:'workspace'});
 React.useEffect(()=>{window.setLoadingDemo=(status,hasRows,layout='workspace')=>setState({status,hasRows,layout});},[]);
 const rows=state.hasRows?sampleRows:[];
 return <section className="xui-stack" aria-label="组件内居中加载">
  <h2>组件内加载</h2>
  <DataRegion aria-label="普通内容区域"><LoadingState>{loadingText}</LoadingState></DataRegion>
  <DataRegion aria-label="首次反馈区域" busy feedback={<LoadingState>{loadingText}</LoadingState>}/>
  <DataRegion aria-label="保留反馈区域" feedback={<LoadingState>{loadingText}</LoadingState>}>已有内容保留。</DataRegion>
  <div style={{blockSize:state.layout==='workspace'?'22rem':'auto',display:'grid'}}>
   <DataTable label="加载位置表格" layout={state.layout} status={state.status} rows={rows} rowKey={row=>row.id} labels={{loading:loadingText,refreshing:'正在刷新当前任务'}} columns={[
    {id:'name',header:'研究任务名称',width:'24rem',cell:row=><Button variant="link">{row.name}</Button>},
    {id:'status',header:'权威状态',width:'24rem',cell:()=> '待核对'},
   ]}/>
  </div>
  <div style={{blockSize:state.layout==='workspace'?'22rem':'auto',display:'grid'}}>
   <CardGroup label="加载位置卡片集合" layout={state.layout} status={state.status} rows={rows} rowKey={row=>row.id} labels={{loading:loadingText,refreshing:'正在刷新当前任务'}} renderCard={row=>({title:row.name,children:<Button variant="link">查看任务</Button>})}/>
  </div>
 </section>;
}
function App({value,max}:{value:number|null;max:number}){return <main className="xui-container xui-stack" aria-labelledby="feedback-title">
 <h1 id="feedback-title">Feedback foundation contract</h1>
 <button type="button" className="xui-button" id="before-feedback">Before feedback</button>
 <section className="xui-stack" aria-labelledby="alerts-title" id="alerts">
  <h2 id="alerts-title">Alert tones</h2>
  <Alert data-testid="alert-default">Default informational message</Alert>
  {tones.map(tone=><Alert key={tone} tone={tone} data-testid={`alert-${tone}`}>{tone}: 可理解的状态文字。</Alert>)}
  <Alert tone="error" data-testid="alert-long">{longMessage}</Alert>
 </section>
 <section className="xui-stack" aria-labelledby="loading-title" id="loading-feedback">
  <h2 id="loading-title">Decorative loading indicators</h2>
  <div role="status" aria-busy="true" id="loading-status"><Spinner data-testid="spinner"/><span>正在读取示例内容。</span><Skeleton data-testid="skeleton"/></div>
 </section>
 <section className="xui-stack" aria-labelledby="progress-title" id="progress-feedback">
  <h2 id="progress-title">Progress facts</h2>
  <Progress value={0} max={100} aria-label="Zero progress" data-testid="progress-zero"/>
  <Progress value={40} max={100} aria-label="Determinate progress" data-testid="progress-determinate"/>
  <Progress value={3} max={8} aria-label="Fractional progress" data-testid="progress-fractional"/>
  <Progress value={100} max={100} aria-label="Complete progress" data-testid="progress-complete"/>
  <Progress aria-label="Indeterminate progress" data-testid="progress-indeterminate"/>
  <Progress value={value??undefined} max={max} aria-label="Changing progress" data-testid="progress-changing"/>
 </section>
 <button type="button" className="xui-button" id="after-feedback">After feedback</button>
 <LoadingExamples/>
 </main>;}
const root=createRoot(document.getElementById('root')!);
window.setFeedbackProgress=(value,max=100)=>root.render(<App value={value} max={max}/>);
window.setFeedbackProgress(25);
