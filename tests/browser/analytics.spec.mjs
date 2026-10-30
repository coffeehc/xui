import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

// Fully isolated tag response. No real Google requests or production IDs.
test('optional analytics respects consent, navigation dedupe and withdrawal in a browser',async({page})=>{
 const source=await readFile('packages/runtime/dist/analytics.js','utf8');let loads=0;
 await page.route('https://analytics.example.invalid/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Private document</title><body>Analytics fixture</body>'}));
 await page.route('https://www.googletagmanager.com/**',route=>{loads++;return route.fulfill({contentType:'application/javascript',body:'window.mockTagLoaded = true;'});});
 await page.goto('https://analytics.example.invalid/private?secret=not-for-analytics');
 await page.addScriptTag({type:'module',content:source+`\nwindow.fixture = createAnalytics({enabled:true,environment:'production',product:'fixture',version:'1',routes:{home:'/',task:'/tasks/:task'},adapter:createGa4AnalyticsAdapter({measurementId:'G-TEST123',allowedHosts:['analytics.example.invalid']})});`});
 await expect.poll(()=>page.evaluate(()=>!!window.fixture)).toBe(true);
 expect(loads).toBe(0);expect(await page.evaluate(()=>window.fixture.page('home'))).toBe(false);
 await page.evaluate(()=>window.fixture.setConsent('denied'));expect(loads).toBe(0);
 expect(await page.evaluate(()=>window.fixture.setConsent('granted'))).toBe(true);expect(loads).toBe(1);
 expect(await page.evaluate(()=>[window.fixture.page('home','nav1'),window.fixture.page('home','nav1'),window.fixture.page('task','nav2')])).toEqual([true,false,true]);
 const events=await page.evaluate(()=>window.dataLayer.map(x=>Array.from(x)).filter(x=>x[0]==='event'));
 expect(events).toHaveLength(2);expect(JSON.stringify(events)).not.toContain('secret');expect(JSON.stringify(events)).not.toContain('Private document');
 await page.evaluate(()=>window.fixture.setConsent('denied'));expect(await page.evaluate(()=>window['ga-disable-G-TEST123'])).toBe(true);expect(await page.evaluate(()=>window.fixture.page('home','nav3'))).toBe(false);
 await page.evaluate(()=>window.fixture.setConsent('granted'));expect(loads).toBe(1);await page.evaluate(()=>window.fixture.destroy());expect(await page.evaluate(()=>window['ga-disable-G-TEST123'])).toBe(true);
});
