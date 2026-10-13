import {createCheckboxGroup,createRadioGroup} from '@coffeehc/xui-runtime/choice-group-dom';
const host=document.createElement('div');
createCheckboxGroup(host,{legend:'Options',options:[],value:[],onValueChange(){}}).update({readOnly:true});
createRadioGroup(host,{legend:'Mode',options:[],value:null,onValueChange(){}});
// @ts-expect-error value cannot be numeric
createRadioGroup(host,{legend:'Mode',options:[],value:1,onValueChange(){}});
