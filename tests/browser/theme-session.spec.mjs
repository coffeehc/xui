import {test,expect} from '@playwright/test';
for(const kind of ['react']){
 test(kind+' session preference survives reload, ignores legacy local storage and isolates independent tabs',async({page,context})=>{
  await page.goto('/header-controls-'+kind+'/');await page.evaluate(()=>{localStorage.setItem('ui.theme.mode','light');sessionStorage.removeItem('ui.theme.mode');});await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const toggle=page.locator('.xui-theme-mode-toggle');await toggle.click();await toggle.click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');expect(await page.evaluate(()=>sessionStorage.getItem('ui.theme.mode'))).toBe('light');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  const fresh=await context.newPage();await fresh.goto('/header-controls-'+kind+'/');await expect(fresh.locator('html')).toHaveAttribute('data-theme','dark');expect(await fresh.evaluate(()=>sessionStorage.getItem('ui.theme.mode'))).toBeNull();await fresh.close();
  await page.evaluate(()=>window.xuiTheme.setMode('system'));await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');expect(await page.evaluate(()=>sessionStorage.getItem('ui.theme.mode'))).toBe('system');
 });
 test(kind+' pre-paint init reads the same session preference while the app module is blocked',async({page})=>{
  await page.addInitScript(()=>{sessionStorage.setItem('ui.theme.mode','light');Object.defineProperty(window,'localStorage',{get(){throw Error('Local storage must not be read');}});});
  let release;const blocked=new Promise(resolve=>release=resolve);await page.route('**/header-controls-'+kind+'/app.js',async route=>{await blocked;await route.continue();});await page.goto('/header-controls-'+kind+'/',{waitUntil:'commit'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');release();await expect(page.locator('.xui-theme-mode-toggle')).toHaveAttribute('data-theme-mode','light');
 });
 test(kind+' storage denial preserves a usable in-memory theme',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw Error('Session storage denied');}}));await page.goto('/header-controls-'+kind+'/');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.locator('.xui-theme-mode-toggle').click();await page.locator('.xui-theme-mode-toggle').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 });
}
