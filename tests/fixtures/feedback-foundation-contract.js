import '@coffeehc/xui-theme/style.css';

// Native adoption uses documented semantic HTML/classes, with no React package.
const root=document.getElementById('root'),main=document.createElement('main');
main.className='xui-container xui-stack';main.setAttribute('aria-labelledby','feedback-title');
main.innerHTML='<h1 id="feedback-title">Feedback foundation contract</h1><button type="button" class="xui-button" id="before-feedback">Before feedback</button><section class="xui-stack" aria-labelledby="alerts-title" id="alerts"><h2 id="alerts-title">Alert tones</h2></section><section class="xui-stack" aria-labelledby="loading-title" id="loading-feedback"><h2 id="loading-title">Decorative loading indicators</h2><div role="status" aria-busy="true" id="loading-status"><span class="xui-spinner" aria-hidden="true" data-testid="spinner"></span><span>正在读取示例内容。</span><div class="xui-skeleton" aria-hidden="true" data-testid="skeleton"></div></div></section><section class="xui-stack" aria-labelledby="progress-title" id="progress-feedback"><h2 id="progress-title">Progress facts</h2></section><button type="button" class="xui-button" id="after-feedback">After feedback</button>';
root.append(main);
const alerts=main.querySelector('#alerts');
function alert(id,tone,text){const node=document.createElement('div');node.className='xui-alert';node.dataset.testid=id;if(tone)node.dataset.tone=tone;node.setAttribute('role',tone==='error'?'alert':'status');node.textContent=text;alerts.append(node);}
alert('alert-default',null,'Default informational message');
for(const tone of ['info','success','warning','error'])alert(`alert-${tone}`,tone,`${tone}: 可理解的状态文字。`);
alert('alert-long','error','错误仍需完整阅读。LongUnbrokenDiagnosticIdentifier'.repeat(16)+' END-OF-MESSAGE');
const progress=main.querySelector('#progress-feedback');
for(const [id,label,value,max] of [['zero','Zero',0,100],['determinate','Determinate',40,100],['fractional','Fractional',3,8],['complete','Complete',100,100],['indeterminate','Indeterminate',null,null],['changing','Changing',25,100]]){
 const node=document.createElement('progress');node.className='xui-progress';node.dataset.testid=`progress-${id}`;node.setAttribute('aria-label',`${label} progress`);if(value!==null)node.value=value;if(max!==null)node.max=max;progress.append(node);
}
window.setFeedbackProgress=(value,max=100)=>{const node=progress.querySelector('[data-testid="progress-changing"]');node.max=max;if(value===null)node.removeAttribute('value');else node.value=value;};
