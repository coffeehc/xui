import {expect} from '@playwright/test';
// Exercise the visible public control; never mutate the hidden form bridge.
export async function chooseSelect(page,trigger,value){
  await trigger.click();
  const id=await trigger.getAttribute('aria-controls');
  const popup=page.locator(`[id=${JSON.stringify(id)}]`);
  await expect(popup).toBeVisible();
  const values=Array.isArray(value)?value:[value];
  if(Array.isArray(value)){
    const options=popup.getByRole('option');
    for(let index=0;index<await options.count();index++){
      const option=options.nth(index),key=await option.getAttribute('data-value');
      if((await option.getAttribute('aria-selected')==='true')!==values.includes(key))await option.click();
    }
    await page.keyboard.press('Escape');
  }else await popup.locator(`[role="option"][data-value=${JSON.stringify(String(value))}]`).click();
  await expect(popup).toBeHidden();
}
