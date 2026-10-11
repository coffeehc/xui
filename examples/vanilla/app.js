import '@coffeehc/xui-theme/style.css';
import { createThemeController } from '@coffeehc/xui-runtime';
import './layout.css';
import './product.css';
const theme = window.xuiTheme ?? createThemeController();
const modeSelect = document.querySelector('#theme');
modeSelect.value = theme.getState().mode;
modeSelect.addEventListener('change',() => theme.setMode(modeSelect.value));
theme.subscribe(state => { modeSelect.value = state.mode; });
document.querySelector('#brand').addEventListener('change',event => { document.documentElement.dataset.product = event.target.value; });
document.querySelector('form').addEventListener('submit',event => {
  event.preventDefault();
  const name = document.querySelector('#name');
  const error = !name.value.trim();
  name.setAttribute('aria-invalid',String(error));
  const message = document.querySelector('#name-error');
  message.hidden = !error; message.textContent = error ? '请填写名称，草稿未保存。' : '';
  const feedback = document.querySelector('#feedback');
  feedback.className = error ? 'demo-feedback' : 'xui-alert';
  feedback.dataset.tone = 'success'; feedback.textContent = error ? '' : '偏好已保存在示例内存中。';
  document.querySelector('#status').textContent = error ? '草稿尚未保存' : '已保存';
  if (error) name.focus();
});
const dialog = document.querySelector('#help-dialog'), trigger = document.querySelector('#help');
trigger.addEventListener('click',() => dialog.showModal());
document.querySelector('#cancel-help').addEventListener('click',() => dialog.close());
dialog.addEventListener('close',() => trigger.focus());
dialog.addEventListener('keydown',event => {
  if (event.key !== 'Tab') return;
  const controls = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')].filter(el => el.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault();last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault();first?.focus(); }
});
document.querySelector('#long-help').textContent = '这是合成的长中文说明，用于检查弹层内容滚动和底部取消操作始终可达。'.repeat(60);
document.querySelector('#clear-note').addEventListener('click',() => {
  document.querySelector('#note').value = '';
  document.querySelector('#status').textContent = '备注已清空，草稿尚未保存';
});
document.querySelectorAll('.xui-nav-item').forEach(item => item.addEventListener('click',() => {
  document.querySelectorAll('.xui-nav-item').forEach(other => other.removeAttribute('aria-current'));
  item.setAttribute('aria-current','page');
}));
// Native button Enter/Space feedback complements :active without delaying clicks.
document.querySelectorAll('.xui-button').forEach(button => {
  button.addEventListener('keydown',event => { if (!button.disabled && ['Enter',' '].includes(event.key)) button.dataset.pressed = 'true'; });
  ['keyup','blur'].forEach(type => button.addEventListener(type,() => { button.dataset.pressed = 'false'; }));
});
