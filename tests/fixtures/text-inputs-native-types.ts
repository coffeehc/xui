import {createNumberInput,createPasswordInput,createSearchInput} from '@coffeehc/xui-runtime/text-inputs-dom';
const host=document.createElement('div');createNumberInput(host,{label:'Count',value:null,onValueChange(){}}).commit();createPasswordInput(host,{label:'Password',value:'',onValueChange(){}}).destroy();createSearchInput(host,{label:'Search',value:'',onValueChange(){},onSubmit(){}});
// @ts-expect-error no numeric conversion for opaque IDs
createNumberInput(host,{label:'ID',value:'123',onValueChange(){}});
