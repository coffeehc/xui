import {expect} from '@playwright/test';
// Exercise the visible public control; never mutate the hidden form bridge.
export async function chooseSelect(page,controlOrLabel,value,optionName){
  const trigger=typeof controlOrLabel==='string'?page.getByRole('combobox',{name:controlOrLabel,exact:true}):controlOrLabel;
  const visibleNativeSelect=await trigger.evaluate(element=>element.tagName==='SELECT'&&!element.hidden);
  if(visibleNativeSelect){await trigger.selectOption(value);return;}
  await trigger.click();
  const id=await trigger.getAttribute('aria-controls');
  const popup=id?page.locator(`[id=${JSON.stringify(id)}]`):page.locator('.xui-select-popup:visible').last();
  await expect(popup).toBeVisible();
  const values=Array.isArray(value)?value:[value];
  if(Array.isArray(value)){
    const options=popup.getByRole('option');
    for(let index=0;index<await options.count();index++){
      const option=options.nth(index),key=await option.getAttribute('data-value');
      if((await option.getAttribute('aria-selected')==='true')!==values.includes(key))await option.click();
    }
    await page.keyboard.press('Escape');
  }else if(optionName!==undefined){await popup.getByRole('option',{name:optionName,exact:true}).click();}
  else await popup.locator(`[role="option"][data-value=${JSON.stringify(String(value))}]`).click();
  await expect(popup).toBeHidden();
}

/** Assert visible selection text and the native form bridge value when present. */
export async function expectSelectValue(page,controlOrLabel,value,optionName=value){
  const control=typeof controlOrLabel==='string'?page.getByRole('combobox',{name:controlOrLabel,exact:true}):controlOrLabel;
  const state=await control.evaluate(element=>{
    const bridge=element.matches('select')?element:element.closest('.xui-select-control,.xui-select-host')?.querySelector('select');
    return {visibleNativeSelect:element.tagName==='SELECT'&&!element.hidden,hasBridge:!!bridge};
  });
  if(state.visibleNativeSelect){await expect(control).toHaveValue(value);return;}
  if(state.hasBridge)await expect.poll(()=>control.evaluate(element=>{
    const bridge=element.matches('select')?element:element.closest('.xui-select-control,.xui-select-host')?.querySelector('select');
    return bridge?.value??null;
  })).toBe(value);
  await expect(control).toHaveText(optionName);
}
