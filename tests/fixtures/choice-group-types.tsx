import {CheckboxGroup,RadioGroup,type ChoiceGroupOption} from '@coffeehc/xui-react/choice-group';
const options:ChoiceGroupOption[]=[{key:'a',label:'Alpha'}];
<CheckboxGroup legend="Options" options={options} value={['a']} onValueChange={()=>{}} selectAll="All"/>;
<RadioGroup legend="Mode" options={options} value={null} onValueChange={()=>{}} required/>;
// @ts-expect-error opaque keys never numbers
<CheckboxGroup legend="Options" options={options} value={[1]} onValueChange={()=>{}}/>;
// @ts-expect-error no uncontrolled second owner
<RadioGroup legend="Mode" options={options} defaultValue="a" onValueChange={()=>{}}/>;
