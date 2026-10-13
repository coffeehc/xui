import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Alert} from '@coffeehc/xui-react';
import {Skeleton,Spinner,Progress,type AlertProps} from '@coffeehc/xui-react/feedback';
import '@coffeehc/xui-theme/style.css';

// Only the public feedback exports and ordinary host markup are used here.
const tones=['info','success','warning','error'] as const satisfies readonly NonNullable<AlertProps['tone']>[];
const longMessage='错误仍需完整阅读。LongUnbrokenDiagnosticIdentifier'.repeat(16)+' END-OF-MESSAGE';
declare global {interface Window {setFeedbackProgress(value:number|null,max?:number):void}}
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
 </main>;}
const root=createRoot(document.getElementById('root')!);
window.setFeedbackProgress=(value,max=100)=>root.render(<App value={value} max={max}/>);
window.setFeedbackProgress(25);
