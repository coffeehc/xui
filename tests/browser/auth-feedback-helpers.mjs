import {expect} from '@playwright/test';
/** Assert that every feedback line is laid out, not hidden in a local scrollport.
 * Document scrolling is intentional for long content and enlarged text. */
export async function readableFeedback(page,locator,info,name,capture=()=>page.screenshot({animations:'disabled'})){
 const measured=await locator.evaluate(element=>{
  const rect=element.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(element);
  const lines=[...range.getClientRects()].map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom}));
  const clipping=[];for(let parent=element;parent;parent=parent.parentElement){const style=getComputedStyle(parent);if(/hidden|clip|auto|scroll/.test(style.overflowY)){const r=parent.getBoundingClientRect();if(lines.some(line=>line.top<r.top-.5||line.bottom>r.bottom+.5))clipping.push(parent.className);}}
  return {text:element.textContent,clientHeight:element.clientHeight,scrollHeight:element.scrollHeight,rect:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom},lines,clipping};
 });
 expect(measured.scrollHeight).toBeLessThanOrEqual(measured.clientHeight+1);expect(measured.lines.length).toBeGreaterThan(0);expect(measured.clipping).toEqual([]);
 for(const line of measured.lines){expect(line.left).toBeGreaterThanOrEqual(measured.rect.left-.5);expect(line.right).toBeLessThanOrEqual(measured.rect.right+.5);expect(line.top).toBeGreaterThanOrEqual(measured.rect.top-.5);expect(line.bottom).toBeLessThanOrEqual(measured.rect.bottom+.5);}
 for(const end of [false,true]){await locator.evaluate((element,end)=>{const range=document.createRange();range.selectNodeContents(element);const lines=[...range.getClientRects()],line=end?lines.at(-1):lines[0];if(line)window.scrollBy(0,line.top-innerHeight/2);},end);await info.attach(`${name}-${end?'last-line':'first-line'}`,{body:await capture(),contentType:'image/png'});}
 await info.attach(name+'-readability',{body:JSON.stringify(measured),contentType:'application/json'});return measured;
}
